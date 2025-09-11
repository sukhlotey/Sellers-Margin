import { useContext, useEffect, useState } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import { fetchReports } from "../../api/gstApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { FaHistory, FaDownload, FaEye } from "react-icons/fa";
import "./gstSettlement.css";

const GstHistory = () => {
  const { reports, setReports } = useContext(GstContext);
  const { token } = useContext(AuthContext);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetchReports(token);
        setReports(res.data);
      } catch (error) {
        console.error("Error fetching reports:", error.response?.data || error.message);
      }
    };
    loadReports();
  }, [token, setReports]);

  const handleViewDetails = (batchId) => {
    setSelectedBatch(batchId === selectedBatch ? null : batchId);
  };

  const handleDownloadBatch = async (batchId, filename) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/gst/bulk/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const records = response.data.map((record) => ({
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
        "Batch ID": batchId,
        "Filename": filename,
        "Marketplace": record.marketplace,
      }));

      const summaryResponse = await axios.get(`http://localhost:5000/api/gst/summary?batchId=${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summary = [
        { "Metric": "Total Sales", "Value": summaryResponse.data.summary.totalGross.toFixed(2) },
        { "Metric": "Total Fees Paid", "Value": summaryResponse.data.summary.totalFees.toFixed(2) },
        { "Metric": "Total GST Collected (Output)", "Value": summaryResponse.data.summary.totalGSTCollected.toFixed(2) },
        { "Metric": "Total GST on Fees (ITC)", "Value": summaryResponse.data.summary.totalGSTOnFees.toFixed(2) },
        { "Metric": "Net GST Liability", "Value": summaryResponse.data.gstLiability.toFixed(2) },
        { "Metric": "Total Gross Profit", "Value": summaryResponse.data.summary.totalGrossProfit.toFixed(2) },
        { "Metric": "Total Net Profit", "Value": summaryResponse.data.summary.totalNetProfit.toFixed(2) },
        { "Metric": "Final Net Settlement", "Value": summaryResponse.data.summary.totalNetPayout.toFixed(2) },
      ];

      const wb = XLSX.utils.book_new();
      const wsRecords = XLSX.utils.json_to_sheet(records);
      const wsSummary = XLSX.utils.json_to_sheet(summary);

      XLSX.utils.book_append_sheet(wb, wsRecords, "Order Details");
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(data, filename.replace(/\.[^/.]+$/, "") + "_processed.xlsx");
    } catch (error) {
      console.error(`Error downloading batch ${batchId}:`, error);
      alert("Failed to download report!");
    }
  };

  return (
    <div className="gst-container">
      <div className="gst-card">
        <h3 className="gst-title">
          <FaHistory /> Uploaded Reports History
        </h3>
        {reports.length === 0 ? (
          <p>No reports saved yet.</p>
        ) : (
          <ul className="gst-list">
            {reports.map((rep) => (
              <li key={rep._id}>
                <strong>{rep.filename || `Batch ${rep._id}`}</strong> —{" "}
                {new Date(rep.createdAt).toLocaleString()} ({rep.marketplace}, {rep.recordsCount} records)
                <button className="gst-button" onClick={() => handleViewDetails(rep._id)}>
                  <FaEye /> View Details
                </button>
                {selectedBatch === rep._id && (
                  <div className="gst-details">
                    <button
                      className="gst-button"
                      onClick={() => handleDownloadBatch(rep._id, rep.filename)}
                    >
                      <FaDownload /> Download Report
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GstHistory;