import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import { SubscriptionContext } from "../context/SubscriptionContext";
import { getPlans } from "../api/subscriptionApi";
import axios from "axios";
import { FiUpload } from "react-icons/fi";
import { FaFileUpload } from "react-icons/fa";
import { Alert, Snackbar, Modal, Box, Typography, Button, IconButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { IoSaveOutline } from "react-icons/io5";
import { RiCloseFill } from "react-icons/ri";
import "../modules/Subscription/Plans.css";

const BulkUploadModal = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    productName: "",
    sellingPrice: "",
    costPrice: "",
    importDuties: "",
    platform: "",
  });
  const [inputs, setInputs] = useState({
    commissionPercent: 15,
    gstPercent: 18,
    adCost: 0,
    category: "General",
    weightSlab: "0-500",
    customWeight: "",
    customShipping: "",
    platform: "Amazon",
    fulfillmentType: "FBA",
    length: "",
    width: "",
    height: "",
    storageDuration: 1,
  });
  const [alert, setAlert] = useState({ open: false, message: "", severity: "error" });
  const [openModal, setOpenModal] = useState(false);
  const [plans, setPlans] = useState([]);

  const { token } = useContext(AuthContext);
  const { setBulkHistory } = useContext(ProfitFeeContext);
  const { subscription } = useContext(SubscriptionContext);
  const navigate = useNavigate();

  // Fetch plans on mount
  useEffect(() => {
    getPlans()
      .then((res) => {
        const enrichedPlans = res.data
          .filter((plan) => plan.id !== "free")
          .map((plan) => ({
            ...plan,
            features:
              plan.id === "basic_monthly"
                ? ["Unlimited calculations & savings (Profit Fee & Monitor)", "Ad free"]
                : plan.id === "all_monthly"
                ? [ "Unlimited calculations & savings (Profit Fee & Monitor)",
                "Unlimited bulk calculations",
                "Unlimited reports generate",
                "Ad free"]
                : plan.id === "annual"
                ? [ "Discount 70%",
                "Unlimited calculations & savings (Profit Fee & Monitor)",
                "GST & Settlement unlimited",
                "Unlimited bulk calculations",
                "Unlimited reports generate",
                "Ad free",]
                : [],
          }));
        console.log("Fetched plans:", enrichedPlans);
        setPlans(enrichedPlans);
      })
      .catch((err) => {
        console.error("Error fetching plans:", err);
        setAlert({ open: true, message: "Failed to load plans.", severity: "error" });
      });
  }, []);

  const getShippingCost = (slab, customShipping) => {
    if (slab === "custom") return Number(customShipping) || 0;
    switch (slab) {
      case "0-500": return 40;
      case "501-1000": return 70;
      case "1001-5000": return 120;
      default: return 0;
    }
  };

  const getWeight = (slab, customWeight) => {
    if (slab === "custom") return Number(customWeight) || 0;
    switch (slab) {
      case "0-500": return 500;
      case "501-1000": return 1000;
      case "1001-5000": return 5000;
      default: return 0;
    }
  };

  const getCommission = (category, platform, sellingPrice) => {
    if (platform === "Amazon" && sellingPrice < 300) return 0;
    if (platform === "Amazon") {
      switch (category) {
        case "Electronics": return 8;
        case "Books": return 2;
        case "Fashion": return 17;
        default: return 15;
      }
    } else { // Flipkart
      switch (category) {
        case "Electronics": return 6;
        case "Books": return 5;
        case "Fashion": return 20;
        default: return 15;
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "category" || name === "platform") {
      setInputs({ ...inputs, [name]: value, commissionPercent: getCommission(name === "category" ? value : inputs.category, name === "platform" ? value : inputs.platform, inputs.sellingPrice || 1000) });
    } else {
      setInputs({ ...inputs, [name]: value });
    }
  };

  const handleColumnMappingChange = (e) => {
    const { name, value } = e.target;
    setColumnMapping({ ...columnMapping, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setCalculatedData([]);
    setColumnHeaders([]);
    setColumnMapping({ productName: "", sellingPrice: "", costPrice: "", importDuties: "", platform: "" });
    console.log("Selected file:", e.target.files[0]);
  };

  const handlePreview = async () => {
    if (!subscription?.isSubscribed) {
      console.log("Opening modal: Free user attempting bulk upload");
      setOpenModal(true);
      return;
    }

    if (!file) {
      setAlert({
        open: true,
        message: "Please select a file first!",
        severity: "error",
      });
      return;
    }

    const reader = new FileReader();

    if (file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("CSV parsed:", results.data);
          const headers = Object.keys(results.data[0] || {});
          setColumnHeaders(headers);
          
          // Suggest initial mappings based on common variations
          const suggestedMapping = {
            productName: headers.find(h => h.toLowerCase().includes("product") || h.toLowerCase().includes("name")) || "",
            sellingPrice: headers.find(h => h.toLowerCase().includes("sell") || h.toLowerCase().includes("price")) || "",
            costPrice: headers.find(h => h.toLowerCase().includes("cost")) || "",
            importDuties: headers.find(h => h.toLowerCase().includes("import") || h.toLowerCase().includes("duties")) || "",
            platform: headers.find(h => h.toLowerCase().includes("platform")) || "",
          };
          setColumnMapping(suggestedMapping);

          // Map data using current (or suggested) mappings
          const filteredData = results.data.map(row => ({
            productName: row[suggestedMapping.productName] || "",
            sellingPrice: parseFloat(row[suggestedMapping.sellingPrice]) || "",
            costPrice: parseFloat(row[suggestedMapping.costPrice]) || "",
            importDuties: parseFloat(row[suggestedMapping.importDuties]) || "",
            platform: row[suggestedMapping.platform] || "",
          }));
          setPreviewData(filteredData);
        },
      });
    } else {
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log("Excel parsed:", sheet);
        const headers = Object.keys(sheet[0] || {});
        setColumnHeaders(headers);

        // Suggest initial mappings based on common variations
        const suggestedMapping = {
          productName: headers.find(h => h.toLowerCase().includes("product") || h.toLowerCase().includes("name")) || "",
          sellingPrice: headers.find(h => h.toLowerCase().includes("sell") || h.toLowerCase().includes("price")) || "",
          costPrice: headers.find(h => h.toLowerCase().includes("cost")) || "",
          importDuties: headers.find(h => h.toLowerCase().includes("import") || h.toLowerCase().includes("duties")) || "",
          platform: headers.find(h => h.toLowerCase().includes("platform")) || "",
        };
        setColumnMapping(suggestedMapping);

        // Map data using current (or suggested) mappings
        const filteredData = sheet.map(row => ({
          productName: row[suggestedMapping.productName] || "",
          sellingPrice: parseFloat(row[suggestedMapping.sellingPrice]) || "",
          costPrice: parseFloat(row[suggestedMapping.costPrice]) || "",
          importDuties: parseFloat(row[suggestedMapping.importDuties]) || "",
          platform: row[suggestedMapping.platform] || "",
        }));
        setPreviewData(filteredData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const validateMapping = () => {
    return (
      columnMapping.productName &&
      columnMapping.sellingPrice &&
      columnMapping.costPrice &&
      columnMapping.importDuties &&
      columnHeaders.includes(columnMapping.productName) &&
      columnHeaders.includes(columnMapping.sellingPrice) &&
      columnHeaders.includes(columnMapping.costPrice) &&
      columnHeaders.includes(columnMapping.importDuties)
    );
  };

  const handleApplyMapping = () => {
    if (!subscription?.isSubscribed) {
      console.log("Opening modal: Free user attempting to apply mapping");
      setOpenModal(true);
      return;
    }

    if (!validateMapping()) {
      setAlert({
        open: true,
        message: "Please map all required columns (Product Name, Selling Price, Cost Price, Import Duties).",
        severity: "error",
      });
      return;
    }

    // Re-parse the file with the user-selected mappings
    const reader = new FileReader();

    if (file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const filteredData = results.data.map(row => ({
            productName: row[columnMapping.productName] || "",
            sellingPrice: parseFloat(row[columnMapping.sellingPrice]) || "",
            costPrice: parseFloat(row[columnMapping.costPrice]) || "",
            importDuties: parseFloat(row[columnMapping.importDuties]) || "",
            platform: row[columnMapping.platform] || inputs.platform,
          }));
          setPreviewData(filteredData);
        },
      });
    } else {
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const filteredData = sheet.map(row => ({
          productName: row[columnMapping.productName] || "",
          sellingPrice: parseFloat(row[columnMapping.sellingPrice]) || "",
          costPrice: parseFloat(row[columnMapping.costPrice]) || "",
          importDuties: parseFloat(row[columnMapping.importDuties]) || "",
          platform: row[columnMapping.platform] || inputs.platform,
        }));
        setPreviewData(filteredData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const calculateData = async () => {
    if (!subscription?.isSubscribed) {
      console.log("Opening modal: Free user attempting to calculate data");
      setOpenModal(true);
      return;
    }

    if (previewData.length === 0) {
      setAlert({
        open: true,
        message: "Preview data first!",
        severity: "error",
      });
      return;
    }
    if (!validateMapping()) {
      setAlert({
        open: true,
        message: "Please map all required columns and apply mapping.",
        severity: "error",
      });
      return;
    }

    try {
      const results = await Promise.all(previewData.map(async (row) => {
        const sellingPrice = parseFloat(row.sellingPrice);
        const costPrice = parseFloat(row.costPrice);
        const importDuties = parseFloat(row.importDuties);
        const commissionPercent = parseFloat(inputs.commissionPercent);
        const gstPercent = parseFloat(inputs.gstPercent);
        const adCost = parseFloat(inputs.adCost) || 0;
        const shippingCost = getShippingCost(inputs.weightSlab, inputs.customShipping);
        const weight = getWeight(inputs.weightSlab, inputs.customWeight);
        const category = inputs.category;
        const platform = row.platform || inputs.platform;
        const fulfillmentType = inputs.fulfillmentType;
        const dimensions = {
          length: parseFloat(inputs.length) || 0,
          width: parseFloat(inputs.width) || 0,
          height: parseFloat(inputs.height) || 0,
        };
        const storageDuration = parseFloat(inputs.storageDuration) || 1;

        if (!row.productName || isNaN(sellingPrice) || isNaN(costPrice) || isNaN(importDuties) || isNaN(commissionPercent) || isNaN(gstPercent)) {
          return {
            productName: row.productName,
            sellingPrice: isNaN(sellingPrice) ? row.sellingPrice : sellingPrice,
            costPrice: isNaN(costPrice) ? row.costPrice : costPrice,
            importDuties: isNaN(importDuties) ? row.importDuties : importDuties,
            commissionFee: null,
            closingFee: null,
            fulfillmentFee: null,
            gstOnFees: null,
            outputGST: null,
            inputGSTCredit: null,
            netGSTRemitted: null,
            netPayout: null,
            profit: null,
            breakEvenPrice: null,
            shippingCost: null,
            adCost: null,
            weight: null,
            category: null,
            commissionPercent: null,
            gstPercent: null,
            platform,
            fulfillmentType,
            dimensions,
            storageDuration,
            error: "Missing or invalid productName, sellingPrice, costPrice, importDuties, commissionPercent, or gstPercent",
          };
        }

        const res = await axios.post(
          "https://sellers-sense.onrender.com/api/profit-fee/calculate",
          {
            sellingPrice,
            costPrice,
            importDuties,
            commissionPercent,
            gstPercent,
            adCost,
            shippingCost,
            weight,
            category,
            platform,
            fulfillmentType,
            dimensions,
            storageDuration,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        return {
          productName: row.productName,
          sellingPrice,
          costPrice,
          importDuties,
          commissionFee: res.data.commissionFee,
          closingFee: res.data.closingFee,
          fulfillmentFee: res.data.fulfillmentFee,
          gstOnFees: res.data.gstOnFees,
          outputGST: res.data.outputGST,
          inputGSTCredit: res.data.inputGSTCredit,
          netGSTRemitted: res.data.netGSTRemitted,
          netPayout: res.data.netPayout,
          profit: res.data.profit,
          breakEvenPrice: res.data.breakEvenPrice,
          shippingCost,
          adCost,
          weight,
          category,
          commissionPercent,
          gstPercent,
          platform,
          fulfillmentType,
          dimensions,
          storageDuration,
        };
      }));

      console.log("Calculated data:", results);
      setCalculatedData(results);
    } catch (err) {
      console.error("Bulk calculation error:", err.response?.data || err.message);
      setAlert({
        open: true,
        message: err.response?.data?.message || "Error calculating bulk records",
        severity: "error",
      });
    }
  };

  const handleSave = async () => {
    if (!subscription?.isSubscribed) {
      console.log("Opening modal: Free user attempting to save data");
      setOpenModal(true);
      return;
    }

    try {
      const validRecords = calculatedData.filter(row => !row.error);
      if (validRecords.length === 0) {
        setAlert({
          open: true,
          message: "No valid records to save!",
          severity: "error",
        });
        return;
      }
      const res = await axios.post(
        "https://sellers-sense.onrender.com/api/profit-fee/bulk-save",
        { records: validRecords, fileName: file ? file.name : "Untitled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const historyRes = await axios.get("https://sellers-sense.onrender.com/api/profit-fee/bulk/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBulkHistory(historyRes.data);

      setAlert({
        open: true,
        message: "Bulk records saved successfully!",
        severity: "success",
      });
      setFile(null);
      setPreviewData([]);
      setCalculatedData([]);
      setColumnHeaders([]);
      setColumnMapping({ productName: "", sellingPrice: "", costPrice: "", importDuties: "", platform: "" });
    } catch (err) {
      console.error("Bulk save error:", err.response?.data || err.message);
      setAlert({
        open: true,
        message: "Error saving bulk records",
        severity: "error",
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleCloseModal = () => {
    console.log("Closing modal");
    setOpenModal(false);
  };

  const handleBuy = async (plan) => {
    if (!token) {
      setAlert({ open: true, message: "Please login first!", severity: "error" });
      return;
    }
    try {
      const res = await axios.post(
        "https://sellers-sense.onrender.com/api/subscription/create-order",
        { plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Create order response:", res.data);
      navigate("/payment", { state: { paymentData: { order: res.data.order, plan } } });
    } catch (err) {
      console.error("Error creating payment:", err.response?.data || err.message);
      setAlert({ open: true, message: err.response?.data?.message || "Error creating payment", severity: "error" });
    }
  };

  return (
    <div className="profit-fee-card">
      <h4
        style={{
          fontWeight: "700",
          color: "#1a3c87",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
        className="bulk-title"
      >
        <FaFileUpload /> Bulk Upload Products
      </h4>
      <p>
        Upload a <b>CSV or Excel (.xlsx)</b> file with columns for Product Name, Selling Price, Cost Price, Import Duties, and optionally Platform (column names can vary; map them below).
      </p>

      <div
        className="upload-area"
        style={{
          border: "2px dashed #cbd5e1",
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          background: "#f1f5f9",
          cursor: "pointer",
          transition: "border-color 0.3s ease, background-color 0.3s ease",
        }}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <FiUpload size={40} color="#3b82f6" />
        <p style={{ margin: "0.5rem 0", fontWeight: "600" }}>
          {file ? file.name : "Click to upload CSV or Excel file"}
        </p>
        <input
          id="fileInput"
          type="file"
          accept=".csv,.xlsx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      <button
        className="calc-btn"
        onClick={handlePreview}
        disabled={!file}
        style={{ marginTop: "1rem" }}
      >
        <FaFileUpload /> Upload & Preview
      </button>

      {columnHeaders.length > 0 && (
        <div className="mt-4">
          <h6>Map Columns</h6>
          <p>Select the columns from your file that correspond to the required fields.</p>
          <div className="column-mapping">
            <FormControl fullWidth margin="normal">
              <InputLabel>Product Name</InputLabel>
              <Select
                name="productName"
                value={columnMapping.productName}
                onChange={handleColumnMappingChange}
                label="Product Name"
              >
                <MenuItem value="">Select Column</MenuItem>
                {columnHeaders.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Selling Price</InputLabel>
              <Select
                name="sellingPrice"
                value={columnMapping.sellingPrice}
                onChange={handleColumnMappingChange}
                label="Selling Price"
              >
                <MenuItem value="">Select Column</MenuItem>
                {columnHeaders.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Cost Price</InputLabel>
              <Select
                name="costPrice"
                value={columnMapping.costPrice}
                onChange={handleColumnMappingChange}
                label="Cost Price"
              >
                <MenuItem value="">Select Column</MenuItem>
                {columnHeaders.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Import Duties</InputLabel>
              <Select
                name="importDuties"
                value={columnMapping.importDuties}
                onChange={handleColumnMappingChange}
                label="Import Duties"
              >
                <MenuItem value="">Select Column</MenuItem>
                {columnHeaders.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Platform</InputLabel>
              <Select
                name="platform"
                value={columnMapping.platform}
                onChange={handleColumnMappingChange}
                label="Platform"
              >
                <MenuItem value="">Select Column</MenuItem>
                {columnHeaders.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <button
            className="calc-btn"
            onClick={handleApplyMapping}
            disabled={!columnMapping.productName || !columnMapping.sellingPrice || !columnMapping.costPrice || !columnMapping.importDuties}
          >
            Apply Mapping
          </button>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="mt-4">
          <h6>Preview (first 10 rows)</h6>
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>Selling Price</th>
                  <th>Cost Price</th>
                  <th>Import Duties</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td>{row.productName}</td>
                    <td>{typeof row.sellingPrice === 'number' && !isNaN(row.sellingPrice) ? row.sellingPrice.toFixed(2) : row.sellingPrice}</td>
                    <td>{typeof row.costPrice === 'number' && !isNaN(row.costPrice) ? row.costPrice.toFixed(2) : row.costPrice}</td>
                    <td>{typeof row.importDuties === 'number' && !isNaN(row.importDuties) ? row.importDuties.toFixed(2) : row.importDuties}</td>
                    <td>{row.platform || inputs.platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h6>Customize Calculation Parameters</h6>
          <div className="mt-3 d-flex gap-3 flex-wrap">
            <FormControl className="form-group">
              <InputLabel>Platform</InputLabel>
              <Select
                name="platform"
                value={inputs.platform}
                onChange={handleInputChange}
                label="Platform"
              >
                <MenuItem value="Amazon">Amazon</MenuItem>
                <MenuItem value="Flipkart">Flipkart</MenuItem>
              </Select>
            </FormControl>
            <FormControl className="form-group">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={inputs.category}
                onChange={handleInputChange}
                label="Category"
              >
                {inputs.platform === "Amazon" ? [
                  <MenuItem key="General" value="General">General (15%)</MenuItem>,
                  <MenuItem key="Electronics" value="Electronics">Electronics (8%)</MenuItem>,
                  <MenuItem key="Fashion" value="Fashion">Fashion (17%)</MenuItem>,
                  <MenuItem key="Books" value="Books">Books (2%)</MenuItem>
                ] : [
                  <MenuItem key="General" value="General">General (15%)</MenuItem>,
                  <MenuItem key="Electronics" value="Electronics">Electronics (6%)</MenuItem>,
                  <MenuItem key="Fashion" value="Fashion">Fashion (20%)</MenuItem>,
                  <MenuItem key="Books" value="Books">Books (5%)</MenuItem>
                ]}
              </Select>
            </FormControl>
            <FormControl className="form-group">
              <InputLabel>Weight Slab</InputLabel>
              <Select
                name="weightSlab"
                value={inputs.weightSlab}
                onChange={handleInputChange}
                label="Weight Slab"
              >
                <MenuItem value="0-500">0 - 500g (₹40)</MenuItem>
                <MenuItem value="501-1000">501g - 1kg (₹70)</MenuItem>
                <MenuItem value="1001-5000">1kg - 5kg (₹120)</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            {inputs.weightSlab === "custom" && (
              <>
                <div className="form-group">
                  <label>Custom Weight (grams)</label>
                  <input
                    type="number"
                    name="customWeight"
                    placeholder="Enter custom weight"
                    value={inputs.customWeight}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Custom Shipping Cost (₹)</label>
                  <input
                    type="number"
                    name="customShipping"
                    placeholder="Enter custom shipping cost"
                    value={inputs.customShipping}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
            <FormControl className="form-group">
              <InputLabel>Fulfillment Type</InputLabel>
              <Select
                name="fulfillmentType"
                value={inputs.fulfillmentType}
                onChange={handleInputChange}
                label="Fulfillment Type"
              >
                {inputs.platform === "Amazon" ? [
                  <MenuItem key="FBA" value="FBA">FBA</MenuItem>,
                  <MenuItem key="SellerFulfilled" value="SellerFulfilled">Seller Fulfilled</MenuItem>,
                  <MenuItem key="EasyShip" value="EasyShip">Easy Ship</MenuItem>
                ] : [
                  <MenuItem key="FBF" value="FBF">FBF</MenuItem>,
                  <MenuItem key="SellerFulfilled" value="SellerFulfilled">Seller Fulfilled</MenuItem>
                ]}
              </Select>
            </FormControl>
            <div className="form-group">
              <label>Length (cm)</label>
              <input
                type="number"
                name="length"
                value={inputs.length}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Width (cm)</label>
              <input
                type="number"
                name="width"
                value={inputs.width}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                name="height"
                value={inputs.height}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Storage Duration (months)</label>
              <input
                type="number"
                name="storageDuration"
                value={inputs.storageDuration}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Ad Cost (₹)</label>
              <input
                type="number"
                name="adCost"
                value={inputs.adCost}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Commission %</label>
              <input
                type="number"
                name="commissionPercent"
                value={inputs.commissionPercent}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>GST %</label>
              <input
                type="number"
                name="gstPercent"
                value={inputs.gstPercent}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <button className="calc-btn" onClick={calculateData}>
            Calculate Results
          </button>
        </div>
      )}

      {calculatedData.length > 0 && (
        <div className="mt-4">
          <h6>Calculated Results</h6>
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead className="table-dark">
                <tr>
                  <th>Product Name</th>
                  <th>Selling Price</th>
                  <th>Cost Price</th>
                  <th>Import Duties</th>
                  <th>Platform</th>
                  <th>Commission Fee</th>
                  <th>{inputs.platform === "Amazon" ? "Closing Fee" : "Collection Fee"}</th>
                  <th>Fulfillment Fee</th>
                  <th>GST on Fees</th>
                  <th>Output GST</th>
                  <th>Input GST Credit</th>
                  <th>Net GST Remitted</th>
                  <th>Net Payout</th>
                  <th>Shipping Cost</th>
                  <th>Ad Cost</th>
                  <th>Weight</th>
                  <th>Category</th>
                  <th>Fulfillment Type</th>
                  <th>Profit</th>
                  <th>Break Even Price</th>
                  {calculatedData.some(row => row.error) && <th>Error</th>}
                </tr>
              </thead>
              <tbody>
                {calculatedData.slice(0, 10).map((row, i) => (
                  <tr
                    key={i}
                    className={
                      row.error
                        ? "table-danger"
                        : parseFloat(row.profit) >= 0
                        ? "table-success"
                        : "table-danger"
                    }
                  >
                    <td>{row.productName}</td>
                    <td>{typeof row.sellingPrice === "number" && !isNaN(row.sellingPrice) ? row.sellingPrice.toFixed(2) : row.sellingPrice}</td>
                    <td>{typeof row.costPrice === "number" && !isNaN(row.costPrice) ? row.costPrice.toFixed(2) : row.costPrice}</td>
                    <td>{typeof row.importDuties === "number" && !isNaN(row.importDuties) ? row.importDuties.toFixed(2) : row.importDuties}</td>
                    <td>{row.platform}</td>
                    <td>{typeof row.commissionFee === "number" && !isNaN(row.commissionFee) ? row.commissionFee.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.closingFee === "number" && !isNaN(row.closingFee) ? row.closingFee.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.fulfillmentFee === "number" && !isNaN(row.fulfillmentFee) ? row.fulfillmentFee.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.gstOnFees === "number" && !isNaN(row.gstOnFees) ? row.gstOnFees.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.outputGST === "number" && !isNaN(row.outputGST) ? row.outputGST.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.inputGSTCredit === "number" && !isNaN(row.inputGSTCredit) ? row.inputGSTCredit.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.netGSTRemitted === "number" && !isNaN(row.netGSTRemitted) ? row.netGSTRemitted.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.netPayout === "number" && !isNaN(row.netPayout) ? row.netPayout.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.shippingCost === "number" && !isNaN(row.shippingCost) ? row.shippingCost.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.adCost === "number" && !isNaN(row.adCost) ? row.adCost.toFixed(2) : "N/A"}</td>
                    <td>{typeof row.weight === "number" && !isNaN(row.weight) ? row.weight : "N/A"}</td>
                    <td>{row.category || "N/A"}</td>
                    <td>{row.fulfillmentType || "N/A"}</td>
                    <td>{typeof row.profit === "number" && !isNaN(row.profit) ? row.profit.toFixed(2) : "Invalid"}</td>
                    <td>{typeof row.breakEvenPrice === "number" && !isNaN(row.breakEvenPrice) ? row.breakEvenPrice.toFixed(2) : "N/A"}</td>
                    {row.error && <th>{row.error}</th>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="calc-btn"
            onClick={handleSave}
            disabled={calculatedData.length === 0}
            style={{ marginTop: "1rem" }}
          >
            <IoSaveOutline /> Save
          </button>
        </div>
      )}

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="subscription-modal-title"
        aria-describedby="subscription-modal-description"
      >
        <Box
          sx={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600, md: 800 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <style>
            {`
              .modal-plans-flex {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 1rem;
              }
              .modal-plans-flex .plan-card {
                min-height: 300px;
                flex-grow: 1;
              }
                .plan-name{
                font-size: 1.7rem;
                padding-bottom: 0;
                }
                .plan-price{
                  font-size: 1.5rem;
                  padding-top: 0;
                  }
                  .price-duration{
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    justify-content: space-between;
                    }
              @media (min-width: 768px) {
                .modal-plans-flex .plan-card {
                  flex: 1 1 calc(33.33% - 1.5rem);
                  max-width: calc(33.33% - 1.5rem);
                }
              }
              @media (min-width: 600px) and (max-width: 767px) {
                .modal-plans-flex .plan-card {
                  flex: 1 1 calc(50% - 1.5rem);
                  max-width: calc(50% - 1.5rem);
                }
              }
              @media (max-width: 599px) {
                .modal-plans-flex .plan-card {
                  flex: 1 1 100%;
                  max-width: 100%;
                }
              }
            `}
          </style>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "error.main",
            }}
          >
            <RiCloseFill />
          </IconButton>
          <Typography id="subscription-modal-title" variant="h6" component="h2" gutterBottom>
            Subscription Required
          </Typography>
          <Typography id="subscription-modal-description" sx={{ mb: 3 }}>
            Bulk upload is available only for paid plans. Please upgrade to continue!
          </Typography>
          <div className="modal-plans-flex">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <div key={plan.id} className="plan-card">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="price-duration">
                  <p className="plan-price">₹{plan.price}</p>
                  <p className="plan-duration">{plan.duration}</p>
                    </div>
                  <div className="plan-features">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBuy(plan.id)}
                    sx={{ mt: 2 }}
                  >
                    Buy Now
                  </Button>
                </div>
              ))
            ) : (
              <Typography>No plans available. Please try again later.</Typography>
            )}
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default BulkUploadModal;