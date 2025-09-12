import { useContext, useState, useRef } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import { uploadSettlement } from "../../api/gstApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileUpload, FaDownload, FaSave } from "react-icons/fa";
import { VscOpenPreview } from "react-icons/vsc";
import { useAlert } from '../../context/AlertContext';
import "./gstSettlement.css";

const UploadReport = () => {
  const { setSummary, setReports } = useContext(GstContext);
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [marketplace, setMarketplace] = useState("generic");
  const [uploadResult, setUploadResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const { showAlert } = useAlert();

  // Supported columns based on columnMap from settlementParser.js
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
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert("error", "Please select a file first!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("marketplace", marketplace);

      const res = await uploadSettlement(formData, token);
      setUploadResult(res.data);
      setSummary(res.data.summary);

      showAlert("success", "Report uploaded & processed successfully!");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      showAlert("error", "Upload failed! Please ensure the file is a valid CSV or Excel.");
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

    const records = uploadResult.records.map((record) => ({
      "Order ID": record.orderId || "",
      "Date": record.orderDate ? new Date(record.orderDate).toLocaleDateString() : "",
      "SKU/Product Name": record.productName || "",
      "Quantity": record.quantity || 1,
      "Selling Price": record.grossAmount || 0,
      "Cost Price": record.costPrice || 0,
      "Commission Fee": record.feesBreakdown.commission || 0,
      "Shipping Fee": record.feesBreakdown.shippingFee || 0,
      "Other Charges": record.feesBreakdown.otherFee || 0,
      "GST on Fees": record.gstOnFees || 0,
      "Total Settlement Amount": record.netPayout || 0,
      "GST Collected": record.gstCollected || 0,
      "Net GST Liability": (record.gstCollected || 0) - (record.gstOnFees || 0),
      "Gross Profit": record.grossProfit || 0,
      "Net Profit": record.netProfit || 0,
      "Margin %": record.margin ? record.margin.toFixed(2) : 0,
      "Status": record.reconciliationStatus || "Pending",
      "Notes": record.reconciliationNotes || "",
    }));

    const summary = [
      { "Metric": "Total Sales", "Value": uploadResult.summary.totalSales.toFixed(2) },
      { "Metric": "Total Fees Paid", "Value": uploadResult.summary.totalFees.toFixed(2) },
      { "Metric": "Total GST Collected (Output)", "Value": uploadResult.summary.outputGST.toFixed(2) },
      { "Metric": "Total GST on Fees (ITC)", "Value": uploadResult.summary.inputGST.toFixed(2) },
      { "Metric": "Net GST Liability", "Value": uploadResult.summary.netGST.toFixed(2) },
      { "Metric": "Total Gross Profit", "Value": uploadResult.summary.totalGrossProfit.toFixed(2) },
      { "Metric": "Total Net Profit", "Value": uploadResult.summary.totalNetProfit.toFixed(2) },
      { "Metric": "Final Net Settlement", "Value": uploadResult.summary.totalNetPayout.toFixed(2) },
    ];

    const wb = XLSX.utils.book_new();
    const wsRecords = XLSX.utils.json_to_sheet(records);

    // Apply background colors based on Net Profit
    const range = XLSX.utils.decode_range(wsRecords["!ref"]);
    for (let row = range.s.r + 1; row <= range.e.r; row++) { // Skip header row
      const netProfitCell = `O${row + 1}`; // Net Profit is in column O
      const netProfitValue = wsRecords[netProfitCell]?.v || 0;
      const fillStyle = netProfitValue < 0
        ? { fill: { fgColor: { rgb: "FF0000" } } } // Red for negative
        : netProfitValue > 0
          ? { fill: { fgColor: { rgb: "00FF00" } } } // Green for positive
          : {}; // No fill for zero
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
          Upload a CSV or Excel and will mapped to file with columns: Order ID, Product Name, Selling Price, Cost Price, Marketplace Fees, GST on Sales, GST on Fees, Net Settlement Amount, Settlement Date, Quantity.{" "}
          <a
            className="gst-preview-toggle"
            style={{ cursor: "pointer" }}
            onClick={() => setShowPreview(!showPreview)}
          >
        {showPreview ? "Hide Supported Columns" : "Show Supported Columns"} <VscOpenPreview/>
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
        <select
          className="gst-select"
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
        >
          <option value="generic">Generic</option>
          <option value="amazon">Amazon</option>
          <option value="flipkart">Flipkart</option>
        </select>
        <div className="gst-file-input-container">
          <input
            type="file"
            accept=".csv,.xlsx"
            className="gst-file-input"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="gst-file-input-label">
            <FaFileUpload size={30} /> {file ? file.name : "Choose a File"}
          </label>
        </div>
        <button className="gst-button" onClick={handleUpload}>
          <FaFileUpload /> Upload & Process
        </button>
        {uploadResult && (
          <div>
            <h4 className="gst-title">Summary for {uploadResult.report.filename}</h4>
            <ul className="gst-summary-list">
              <li>Total Sales: ₹{uploadResult.summary.totalSales.toFixed(2)}</li>
              <li>Output GST: ₹{uploadResult.summary.outputGST.toFixed(2)}</li>
              <li>Input GST (ITC): ₹{uploadResult.summary.inputGST.toFixed(2)}</li>
              <li>Net GST Liability: ₹{uploadResult.summary.netGST.toFixed(2)}</li>
              <li>Marketplace Fees: ₹{uploadResult.summary.totalFees.toFixed(2)}</li>
              <li>Total Gross Profit: ₹{uploadResult.summary.totalGrossProfit.toFixed(2)}</li>
              <li>Total Net Profit: ₹{uploadResult.summary.totalNetProfit.toFixed(2)}</li>
            </ul>
            <button className="gst-button" onClick={handleDownload}>
              <FaDownload /> Download This Report
            </button>
            <button className="gst-button" onClick={handleSave}>
              <FaSave /> Save to History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadReport;