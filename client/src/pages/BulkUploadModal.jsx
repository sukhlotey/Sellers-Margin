import { useState, useContext } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import axios from "axios";
import { FiUpload } from "react-icons/fi";
import { Alert, Snackbar } from "@mui/material"; // Import Material-UI components
import { IoSaveOutline } from "react-icons/io5";

const BulkUploadModal = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    productName: "",
    sellingPrice: "",
    costPrice: "",
  });
  const [inputs, setInputs] = useState({
    commissionPercent: 15,
    gstPercent: 18,
    adCost: 0,
    category: "General",
    weightSlab: "0-500",
    customWeight: "",
    customShipping: "",
  });
  const [alert, setAlert] = useState({ open: false, message: "", severity: "error" }); // State for Snackbar

  const { token } = useContext(AuthContext);
  const { setBulkHistory } = useContext(ProfitFeeContext);

  const getShippingCost = (slab, customShipping) => {
    if (slab === "custom") return Number(customShipping) || 0;
    switch (slab) {
      case "0-500":
        return 40;
      case "501-1000":
        return 70;
      case "1001-5000":
        return 120;
      default:
        return 0;
    }
  };

  const getWeight = (slab, customWeight) => {
    if (slab === "custom") return Number(customWeight) || 0;
    switch (slab) {
      case "0-500":
        return 500;
      case "501-1000":
        return 1000;
      case "1001-5000":
        return 5000;
      default:
        return 0;
    }
  };

  const getCommission = (category) => {
    switch (category) {
      case "Electronics":
        return 8;
      case "Books":
        return 5;
      case "Fashion":
        return 15;
      default:
        return 15;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setInputs({ ...inputs, category: value, commissionPercent: getCommission(value) });
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
    setColumnMapping({ productName: "", sellingPrice: "", costPrice: "" });
    console.log("Selected file:", e.target.files[0]);
  };

  const handlePreview = async() => {
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
          };
          setColumnMapping(suggestedMapping);

          // Map data using current (or suggested) mappings
          const filteredData = results.data.map(row => ({
            productName: row[suggestedMapping.productName] || "",
            sellingPrice: parseFloat(row[suggestedMapping.sellingPrice]) || "",
            costPrice: parseFloat(row[suggestedMapping.costPrice]) || "",
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
        };
        setColumnMapping(suggestedMapping);

        // Map data using current (or suggested) mappings
        const filteredData = sheet.map(row => ({
          productName: row[suggestedMapping.productName] || "",
          sellingPrice: parseFloat(row[suggestedMapping.sellingPrice]) || "",
          costPrice: parseFloat(row[suggestedMapping.costPrice]) || "",
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
      columnHeaders.includes(columnMapping.productName) &&
      columnHeaders.includes(columnMapping.sellingPrice) &&
      columnHeaders.includes(columnMapping.costPrice)
    );
  };

  const handleApplyMapping = () => {
    if (!validateMapping()) {
      setAlert({
        open: true,
        message: "Please map all required columns (Product Name, Selling Price, Cost Price).",
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
        }));
        setPreviewData(filteredData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const calculateData = () => {
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

    const results = previewData.map((row) => {
      const sellingPrice = parseFloat(row.sellingPrice);
      const costPrice = parseFloat(row.costPrice);
      const commissionPercent = parseFloat(inputs.commissionPercent);
      const gstPercent = parseFloat(inputs.gstPercent);
      const adCost = parseFloat(inputs.adCost) || 0;
      const shippingCost = getShippingCost(inputs.weightSlab, inputs.customShipping);
      const weight = getWeight(inputs.weightSlab, inputs.customWeight);
      const category = inputs.category;

      if (!row.productName || isNaN(sellingPrice) || isNaN(costPrice) || isNaN(commissionPercent) || isNaN(gstPercent)) {
        return {
          productName: row.productName,
          sellingPrice: isNaN(sellingPrice) ? row.sellingPrice : sellingPrice,
          costPrice: isNaN(costPrice) ? row.costPrice : costPrice,
          commissionFee: null,
          gstTax: null,
          profit: null,
          breakEvenPrice: null,
          shippingCost: null,
          adCost: null,
          weight: null,
          category: null,
          commissionPercent: null,
          gstPercent: null,
          error: "Missing or invalid productName, sellingPrice, costPrice, commissionPercent, or gstPercent",
        };
      }

      const commissionFee = (sellingPrice * commissionPercent) / 100;
      const gstTax = (sellingPrice * gstPercent) / 100;
      const totalCost = costPrice + commissionFee + gstTax + shippingCost + adCost;
      const profit = sellingPrice - totalCost;
      const breakEvenPrice = totalCost;

      return {
        productName: row.productName,
        sellingPrice,
        costPrice,
        commissionFee,
        gstTax,
        profit,
        breakEvenPrice,
        shippingCost,
        adCost,
        weight,
        category,
        commissionPercent,
        gstPercent,
      };
    });

    console.log("Calculated data:", results);
    setCalculatedData(results);
  };

  const handleSave = async () => {
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
        "http://localhost:5000/api/profit-fee/bulk-save",
        { records: validRecords, fileName: file ? file.name : "Untitled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const historyRes = await axios.get("http://localhost:5000/api/profit-fee/bulk/history", {
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
      setColumnMapping({ productName: "", sellingPrice: "", costPrice: "" });
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

  return (
    <div className="profit-fee-card">
      <h5>Bulk Upload Products</h5>
      <p>
        Upload a <b>CSV or Excel (.xlsx)</b> file with columns for Product Name, Selling Price, and Cost Price (column names can vary; map them below).
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
        Upload & Preview
      </button>

      {columnHeaders.length > 0 && (
        <div className="mt-4">
          <h6>Map Columns</h6>
          <p>Select the columns from your file that correspond to the required fields.</p>
          <div className="column-mapping">
            <div className="form-group">
              <label>Product Name</label>
              <select
                name="productName"
                value={columnMapping.productName}
                onChange={handleColumnMappingChange}
              >
                <option value="">Select Column</option>
                {columnHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Selling Price</label>
              <select
                name="sellingPrice"
                value={columnMapping.sellingPrice}
                onChange={handleColumnMappingChange}
              >
                <option value="">Select Column</option>
                {columnHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Cost Price</label>
              <select
                name="costPrice"
                value={columnMapping.costPrice}
                onChange={handleColumnMappingChange}
              >
                <option value="">Select Column</option>
                {columnHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="calc-btn"
            onClick={handleApplyMapping}
            disabled={!columnMapping.productName || !columnMapping.sellingPrice || !columnMapping.costPrice}
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
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td>{row.productName}</td>
                    <td>{typeof row.sellingPrice === 'number' && !isNaN(row.sellingPrice) ? row.sellingPrice.toFixed(2) : row.sellingPrice}</td>
                    <td>{typeof row.costPrice === 'number' && !isNaN(row.costPrice) ? row.costPrice.toFixed(2) : row.costPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h6>Customize Calculation Parameters</h6>
          <div className="mt-3 d-flex gap-3 flex-wrap">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={inputs.category} onChange={handleInputChange}>
                <option value="">--Select Category--</option>
                <option value="General">General (15%)</option>
                <option value="Electronics">Electronics (8%)</option>
                <option value="Fashion">Fashion (15%)</option>
                <option value="Books">Books (5%)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Weight Slab</label>
              <select name="weightSlab" value={inputs.weightSlab} onChange={handleInputChange}>
                <option value="">--Select Weight Slab--</option>
                <option value="0-500">0 - 500g (₹40)</option>
                <option value="501-1000">501g - 1kg (₹70)</option>
                <option value="1001-5000">1kg - 5kg (₹120)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
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
                  <th>Commission Fee</th>
                  <th>GST Tax</th>
                  <th>Shipping Cost</th>
                  <th>Ad Cost</th>
                  <th>Weight</th>
                  <th>Category</th>
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
                    <td>
                      {typeof row.sellingPrice === "number" && !isNaN(row.sellingPrice)
                        ? row.sellingPrice.toFixed(2)
                        : row.sellingPrice}
                    </td>
                    <td>
                      {typeof row.costPrice === "number" && !isNaN(row.costPrice)
                        ? row.costPrice.toFixed(2)
                        : row.costPrice}
                    </td>
                    <td>
                      {typeof row.commissionFee === "number" && !isNaN(row.commissionFee)
                        ? row.commissionFee.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      {typeof row.gstTax === "number" && !isNaN(row.gstTax)
                        ? row.gstTax.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      {typeof row.shippingCost === "number" && !isNaN(row.shippingCost)
                        ? row.shippingCost.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      {typeof row.adCost === "number" && !isNaN(row.adCost)
                        ? row.adCost.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      {typeof row.weight === "number" && !isNaN(row.weight) ? row.weight : "N/A"}
                    </td>
                    <td>{row.category || "N/A"}</td>
                    <td>
                      {typeof row.profit === "number" && !isNaN(row.profit)
                        ? row.profit.toFixed(2)
                        : "Invalid"}
                    </td>
                    <td>
                      {typeof row.breakEvenPrice === "number" && !isNaN(row.breakEvenPrice)
                        ? row.breakEvenPrice.toFixed(2)
                        : "N/A"}
                    </td>
                    {row.error && <td>{row.error}</td>}
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
    </div>
  );
};

export default BulkUploadModal;