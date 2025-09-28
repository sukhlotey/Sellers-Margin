import { useContext, useState, useRef } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { uploadSettlement } from "../../api/gstApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FiUpload } from "react-icons/fi";
import { FaFileUpload, FaDownload, FaSave } from "react-icons/fa";
import { VscOpenPreview } from "react-icons/vsc";
import { useAlert } from "../../context/AlertContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./gstSettlement.css";

const UploadReport = () => {
  const { setSummary, setReports } = useContext(GstContext);
  const { token } = useContext(AuthContext);
  const { subscription } = useContext(SubscriptionContext);
  const [file, setFile] = useState(null);
  const [marketplace, setMarketplace] = useState("generic");
  const [uploadResult, setUploadResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false); // For supported columns table
  const [showFilePreview, setShowFilePreview] = useState(false); // For file data preview
  const [previewData, setPreviewData] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    orderId: "",
    productName: "",
    settlementId: "",
    orderDate: "",
    quantity: "",
    grossAmount: "",
    costPrice: "",
    commission: "",
    shippingFee: "",
    otherFee: "",
    gstCollected: "",
    gstOnFees: "",
    netPayout: "",
    returnAmount: "",
  });
  const fileInputRef = useRef(null);
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const supportedColumns = [
    { internal: "orderId", names: ["order-id", "Order ID", "order", "amazon-order-id", "Order Item ID", "merchant-order-id"] },
    { internal: "productName", names: ["sku", "asin", "Product", "item-name", "Product Name", "Seller SKU ID"] },
    { internal: "settlementId", names: ["settlement-id", "settlement", "Settlement Ref. No.", "settlement-reference"] },
    { internal: "orderDate", names: ["order-date", "Order Date", "settlement-date", "settlement-start-date", "settlement-end-date", "date", "Dispatch Date", "Delivery Date"] },
    { internal: "quantity", names: ["quantity", "Quantity", "quantity-purchased", "qty"] },
    { internal: "grossAmount", names: ["item-price", "Selling Price", "Principal", "amount", "sale-amount", "total-charge", "gross", "sale-value", "Order Item Value (Rs)"] },
    { internal: "costPrice", names: ["cost-price", "Cost Price", "cost"] },
    { internal: "commission", names: ["commission", "seller-fee", "selling-fee", "marketplace-fee", "fee", "commission-fee", "marketplace-commission", "fee-commission", "Total Marketplace Fee"] },
    { internal: "shippingFee", names: ["shipping-charge", "shipping", "shipping-fee", "logistics-fee", "Shipping Fee", "Reverse Shipping Fee", "Return Shipping Fee"] },
    { internal: "otherFee", names: ["other-fees", "other", "penalties", "closing-fee", "Other Fee", "Cancellation Fee"] },
    { internal: "gstCollected", names: ["tax", "gst", "gst-collected", "tax-collected", "gst-on-sales", "GST on Sales", "igst", "cgst", "sgst"] },
    { internal: "gstOnFees", names: ["gst-on-fees", "fee-gst", "gst-on-marketplace-fees", "GST on Fees", "tax-deducted"] },
    { internal: "netPayout", names: ["settlement-amount", "net-settlement-amount", "total-settlement", "payout", "net-amount", "net-payout", "amount-paid", "Settlement Value (Rs)"] },
    { internal: "returnAmount", names: ["return-amount", "refund", "return-value", "Return Amount"] },
  ];

  const platformRequiredColumns = {
    amazon: ["settlementId", "orderId", "grossAmount", "gstCollected"],
    flipkart: ["settlementId", "orderId", "grossAmount", "gstCollected"],
    generic: ["orderId", "grossAmount"],
  };

  const premiumPlans = [
    { id: "all_monthly", name: "All Access Monthly", price: 499, duration: "30 days" },
    { id: "annual", name: "All Access Annually", price: 1799, duration: "365 days" },
  ];

  const validateFileHeaders = (headers) => {
    const required = platformRequiredColumns[marketplace];
    const missing = required.filter((col) => !headers.some((h) => supportedColumns.find((sc) => sc.internal === col)?.names.includes(h) || columnMapping[col] === h));
    if (missing.length > 0) {
      showAlert("error", `Missing required columns for ${marketplace}: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreviewData([]);
    setFileHeaders([]);
    setShowFilePreview(false);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          let rows;
          if (selectedFile.name.endsWith(".csv")) {
            const text = new TextDecoder("utf-8").decode(data);
            rows = text.split("\n").map(row => row.split(",").map(cell => cell.trim()));
          } else {
            const workbook = XLSX.read(data, { type: "array", raw: false });
            const sheetName = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false });
          }
          if (rows.length === 0) {
            showAlert("error", "File is empty or could not be parsed.");
            return;
          }
          setFileHeaders(rows[0] || []);
          setPreviewData(rows.slice(1, Math.min(rows.length, 11))); // Limit to 10 rows for preview
          // Suggest initial mappings
          const suggestedMapping = {};
          Object.keys(columnMapping).forEach((key) => {
            const col = supportedColumns.find((sc) => sc.internal === key);
            suggestedMapping[key] = rows[0].find((h) => col?.names.includes(h)) || "";
          });
          setColumnMapping(suggestedMapping);
        } catch (error) {
          showAlert("error", "Error parsing file. Please ensure it's a valid CSV or Excel file.");
          console.error("File parsing error:", error);
        }
      };
      reader.onerror = () => {
        showAlert("error", "Error reading file.");
      };
      if (selectedFile.name.endsWith(".csv")) {
        reader.readAsArrayBuffer(selectedFile);
      } else {
        reader.readAsArrayBuffer(selectedFile);
      }
    }
  };

  const handleColumnMappingChange = (e) => {
    const { name, value } = e.target;
    setColumnMapping({ ...columnMapping, [name]: value });
  };

  const handlePreview = () => {
    if (!file) {
      showAlert("error", "Please select a file first!");
      return;
    }
    if (!validateFileHeaders(fileHeaders)) return;
    if (previewData.length === 0) {
      showAlert("error", "No data available to preview.");
      return;
    }
    setShowFilePreview(true);
  };

  const handleBuy = async (plan) => {
    if (!token) {
      showAlert("error", "Please login first!");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5000/api/subscription/create-order",
        { plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPlansModal(false);
      navigate("/payment", { state: { paymentData: { order: res.data.order, plan } } });
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Error creating payment");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert("error", "Please select a file first!");
      return;
    }
    if (!subscription.isSubscribed || subscription.plan === "free" || subscription.plan === "basic_monthly") {
      setShowPlansModal(true);
      return;
    }
    if (!validateFileHeaders(fileHeaders)) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("marketplace", marketplace);
      formData.append("columnMapping", JSON.stringify(columnMapping));
      const res = await uploadSettlement(formData, token);
      setUploadResult(res.data);
      setSummary(res.data.summary);
      showAlert("success", "Report uploaded & processed successfully!");
    } catch (error) {
      // Show specific error message from backend or parser
      showAlert("error",error.response?.data?.error|| error.error || error.response?.data?.message || error.message || "Failed to upload file. Please check the file and try again.");
    }
  };

  const handleSave = () => {
    if (uploadResult) {
      setReports((prev) => [uploadResult.report, ...prev]);
      showAlert("success", "Report saved to history!");
    }
  };

  const handleDownload = () => {
    if (!uploadResult) {
      showAlert("error", "No report to download!");
      return;
    }
    const getFeeLabel = () => (marketplace === "amazon" ? "Closing Fee" : marketplace === "flipkart" ? "Collection Fee" : "Other Fee");
    const records = uploadResult.records.map((record) => ({
      "Order ID": record.orderId || "",
      "Date": record.orderDate ? new Date(record.orderDate).toLocaleDateString() : "",
      "SKU/Product Name": record.productName || "",
      "Quantity": record.quantity || 1,
      "Selling Price": record.grossAmount || 0,
      "Cost Price": record.costPrice || 0,
      "Commission Fee": record.feesBreakdown.commission || 0,
      "Shipping Fee": record.feesBreakdown.shippingFee || 0,
      [getFeeLabel()]: record.feesBreakdown.otherFee || 0,
      "GST on Fees": record.gstOnFees || 0,
      "Total Settlement Amount": record.netPayout || 0,
      "GST Collected": record.gstCollected || 0,
      "Net GST Liability": (record.gstCollected || 0) - (record.gstOnFees || 0),
      "Gross Profit": record.grossProfit || 0,
      "Net Profit": record.netProfit || 0,
      "Margin %": record.margin ? record.margin.toFixed(2) : 0,
      "Status": record.reconciliationStatus || "Pending",
      "Notes": record.reconciliationNotes || "",
      "Return Amount": record.returnAmount || 0,
    }));

    const summary = [
      { "Metric": "Total Sales", "Value": uploadResult.summary.totalSales.toFixed(2) },
      { "Metric": "Total Fees Paid", "Value": uploadResult.summary.totalFees.toFixed(2) },
      { "Metric": "Total GST Collected (Output)", "Value": uploadResult.summary.outputGST.toFixed(2) },
      { "Metric": "Total GST on Fees (ITC)", "Value": uploadResult.summary.inputGST.toFixed(2) },
      { "Metric": "Net GST Liability", "Value": uploadResult.summary.netGST.toFixed(2) },
      { "Metric": "Total Gross Profit", "Value": uploadResult.summary.totalGrossProfit.toFixed(2) },
      { "Metric": "Total Net Profit", "Value": uploadResult.summary.totalNetProfit.toFixed(2) },
      { "Metric": "Total Returns", "Value": uploadResult.summary.totalReturns.toFixed(2) },
      { "Metric": "Final Net Settlement", "Value": uploadResult.summary.totalNetPayout.toFixed(2) },
    ];

    const wb = XLSX.utils.book_new();
    const wsRecords = XLSX.utils.json_to_sheet(records);
    const range = XLSX.utils.decode_range(wsRecords["!ref"]);
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const netProfitCell = `O${row + 1}`;
      const netProfitValue = wsRecords[netProfitCell]?.v || 0;
      const fillStyle = netProfitValue < 0
        ? { fill: { fgColor: { rgb: "FF0000" } } }
        : netProfitValue > 0
          ? { fill: { fgColor: { rgb: "00FF00" } } }
          : {};
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        wsRecords[cellAddress] = wsRecords[cellAddress] || {};
        wsRecords[cellAddress].s = fillStyle;
      }
    }
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsRecords, "Order Details");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, uploadResult.report.filename.replace(/\.[^/.]+$/, "") + "_processed.xlsx");
  };

  return (
    <div className="gst-container">
      <div className="gst-card">
        <h3 className="gst-title">
          <FaFileUpload /> Upload Settlement Report
        </h3>
        <div className="gst-preview-section">
          <p>
            Upload a <b>CSV or Excel (.xlsx)</b> with columns: Order ID, Product Name, Selling Price, Cost Price, Marketplace Fees, GST on Sales, GST on Fees, Net Settlement Amount, Settlement Date, Quantity, Return Amount.
            <a className="gst-preview-toggle" style={{ cursor: "pointer" }} onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "Hide Supported Columns" : "Show Supported Columns"} <VscOpenPreview />
            </a>
          </p>
          {showPreview && (
            <div className="gst-preview-table-container">
              <table className="gst-preview-table">
                <thead>
                  <tr>
                    <th>Marketplace Column Name</th>
                    <th>Mapped To</th>
                  </tr>
                </thead>
                <tbody>
                  {supportedColumns.map((col, index) => (
                    <tr key={index}>
                      <td>{col.names.join(", ")}</td>
                      <td>{col.internal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <select className="gst-select" value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
          <option value="generic">Generic</option>
          <option value="amazon">Amazon</option>
          <option value="flipkart">Flipkart</option>
        </select>
        <div
          className="gst-file-input-container"
          style={{
            border: "2px dashed #cbd5e1",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            background: "#f1f5f9",
            cursor: "pointer",
            transition: "border-color 0.3s ease, background-color 0.3s ease",
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            accept=".csv,.xlsx"
            className="gst-file-input"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <FiUpload size={40} color="#3b82f6" />
          <p style={{ margin: "0.5rem 0", fontWeight: "600" }}>
            {file ? file.name : "Choose a File"}
          </p>
        </div>
        {fileHeaders.length > 0 && (
          <div className="column-mapping">
            <h4>Map Columns</h4>
            {Object.keys(columnMapping).map((key) => (
              <div key={key} style={{ marginBottom: "0.5rem" }}>
                <label>{key}</label>
                <select name={key} value={columnMapping[key]} onChange={handleColumnMappingChange}>
                  <option value="">Select Column</option>
                  {fileHeaders.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <button className="gst-button" onClick={handlePreview}>
          <VscOpenPreview /> Preview File
        </button>
        {showFilePreview && previewData.length > 0 && (
          <div className="gst-preview-table-container">
            <h4>File Preview</h4>
            <table className="gst-preview-table">
              <thead>
                <tr>
                  {fileHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index}>
                    {fileHeaders.map((header) => (
                      <td key={header}>{row[fileHeaders.indexOf(header)] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button className="gst-button" onClick={handleUpload}>
          <FaFileUpload /> Upload & Process
        </button>
      </div>

      {/* Separate Summary Card displayed only when uploadResult exists */}
      {uploadResult && (
        <div className="gst-card">
          <h4 className="gst-title">Summary for {uploadResult.report.filename}</h4>
          <ul className="gst-summary-list">
            <li>Total Sales: ₹{uploadResult.summary.totalSales.toFixed(2)}</li>
            <li>Output GST: ₹{uploadResult.summary.outputGST.toFixed(2)}</li>
            <li>Input GST (ITC): ₹{uploadResult.summary.inputGST.toFixed(2)}</li>
            <li>Net GST Liability: ₹{uploadResult.summary.netGST.toFixed(2)}</li>
            <li>Marketplace Fees: ₹{uploadResult.summary.totalFees.toFixed(2)}</li>
            <li>Total Gross Profit: ₹{uploadResult.summary.totalGrossProfit.toFixed(2)}</li>
            <li>Total Net Profit: ₹{uploadResult.summary.totalNetProfit.toFixed(2)}</li>
            <li>Total Returns: ₹{uploadResult.summary.totalReturns.toFixed(2)}</li>
          </ul>
          <button className="gst-button" onClick={handleDownload}>
            <FaDownload /> Download This Report
          </button>
          <button className="gst-button" onClick={handleSave}>
            <FaSave /> Save to History
          </button>
        </div>
      )}

      {/* Plans Modal (unchanged) */}
      {showPlansModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              width: "80%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h2 style={{ marginBottom: "1rem" }}>Upgrade Your Plan</h2>
            <p style={{ marginBottom: "1.5rem" }}>
              The GST Settlement module requires an All Access Monthly or Annual plan. Choose a plan to unlock unlimited access to all modules.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {premiumPlans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    flex: "1",
                    minWidth: "200px",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <h3>{plan.name}</h3>
                  <p>₹{plan.price} / {plan.duration}</p>
                  <p>Unlimited access to all modules including GST Settlement</p>
                  <button
                    style={{
                      backgroundColor: "#1976d2",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginTop: "1rem",
                    }}
                    onClick={() => handleBuy(plan.id)}
                  >
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
            <button
              style={{
                backgroundColor: "#ccc",
                color: "#000",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "1.5rem",
                width: "100%",
              }}
              onClick={() => setShowPlansModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadReport;