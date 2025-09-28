import { useContext, useEffect, useState } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import { fetchReports, deleteReport, deleteMultipleReports } from "../../api/gstApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import {FaDownload } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { useAlert } from '../../context/AlertContext';
import { Alert, Snackbar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import "./gstSettlement.css"; 
import GstDownload from "./GstDownload";

const GstHistory = () => {
  const { reports, setReports, deleteFromReports } = useContext(GstContext);
  const { token } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [dialog, setDialog] = useState({ open: false, batchId: null, isBulk: false });

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetchReports(token);
        setReports(res.data);
      } catch (error) {
        console.error("Error fetching reports:", error.response?.data || error.message);
        showAlert("error", "Failed to fetch reports!");
      }
    };
    loadReports();
  }, [token, setReports, showAlert]);

  const handleDownloadBatch = async (batchId, filename, marketplace) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/gst/bulk/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const feeLabel = marketplace === "amazon" ? "Closing Fee" : marketplace === "flipkart" ? "Collection Fee" : "Other Charges";
      const records = response.data.map((record) => ({
        "Order ID": record.orderId || "",
        "Date": record.orderDate ? new Date(record.orderDate).toLocaleDateString() : "",
        "SKU/Product Name": record.productName || "",
        "Quantity": record.quantity || 1,
        "Selling Price": record.grossAmount || 0,
        "Cost Price": record.costPrice || 0,
        "Commission Fee": record.feesBreakdown.commission || 0,
        "Shipping Fee": record.feesBreakdown.shippingFee || 0,
        [feeLabel]: record.feesBreakdown.otherFee || 0,
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
        { "Metric": "Total Returns", "Value": summaryResponse.data.summary.totalReturns.toFixed(2) },
        { "Metric": "Final Net Settlement", "Value": summaryResponse.data.summary.totalNetPayout.toFixed(2) },
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
      saveAs(data, filename.replace(/\.[^/.]+$/, "") + "_processed.xlsx");
      showAlert("success", "Report downloaded successfully!");
    } catch (error) {
      console.error(`Error downloading batch ${batchId}:`, error);
      showAlert("error", "Failed to download report!");
    }
  };

  // Handle single report deletion
  const handleDeleteReport = (batchId) => {
    setDialog({ open: true, batchId, isBulk: false });
  };

  // Confirm deletion of a single report
  const confirmDeleteReport = async () => {
    const { batchId } = dialog;
    try {
      setLoading(true);
      await deleteReport(batchId, token);
      deleteFromReports([batchId]);
      showAlert("success", "Report deleted successfully!");
    } catch (error) {
      console.error("Error deleting report:", error);
      showAlert("error", error.response?.data?.message || "Failed to delete report!");
    } finally {
      setLoading(false);
      setDialog({ open: false, batchId: null, isBulk: false });
    }
  };

  // Toggle checkbox visibility and handle bulk delete
  const handleToggleDelete = () => {
    if (!showCheckboxes) {
      setShowCheckboxes(true);
    } else if (selectedBatches.length > 0) {
      setDialog({ open: true, batchId: null, isBulk: true });
    } else {
      setShowCheckboxes(false);
      setSelectedBatches([]);
    }
  };

  // Confirm bulk deletion of selected reports
  const confirmBulkDelete = async () => {
    try {
      setLoading(true);
      await deleteMultipleReports(selectedBatches, token);
      deleteFromReports(selectedBatches);
      setSelectedBatches([]);
      setShowCheckboxes(false);
      showAlert("success", `${selectedBatches.length} report(s) deleted successfully!`);
    } catch (error) {
      console.error("Error deleting selected reports:", error);
      showAlert("error", error.response?.data?.message || "Failed to delete selected reports!");
    } finally {
      setLoading(false);
      setDialog({ open: false, batchId: null, isBulk: false });
    }
  };

  // Handle checkbox selection for bulk delete
  const handleSelectReport = (batchId) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  // Close dialog without deleting
  const handleCloseDialog = () => {
    setDialog({ open: false, batchId: null, isBulk: false });
  };

  return (
    <div className="gst-container">
      <div className="gst-card">
        <GstDownload />
        {reports.length === 0 ? (
          <p style={{ margin: 0, paddingBottom: "10px" }}>No reports saved yet.</p>
        ) : (
          <>
            {/* Bulk delete controls */}
            <div className="gst-history-controls">
              <button
                className="gst-button-del-sel"
                onClick={handleToggleDelete}
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <FiTrash2 />
                {showCheckboxes ? `Delete (${selectedBatches.length})` : "Select"}
              </button>
            </div>
            <ul className="gst-list">
              {reports.map((rep) => (
                <li
                  key={rep._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "15px",
                    gap: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(rep._id)}
                        onChange={() => handleSelectReport(rep._id)}
                        disabled={loading}
                      />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <strong>{rep.filename || "Untitled"}</strong>
                      <span>
                        {new Date(rep.createdAt).toLocaleString()} ({rep.marketplace}, {rep.recordsCount} records)
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <a
                      className="gst-download-link"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleDownloadBatch(rep._id, rep.filename, rep.marketplace)}
                    >
                      <FaDownload /> Download
                    </a>
                    <button
                      className="gst-button-del"
                      onClick={() => handleDeleteReport(rep._id)}
                      disabled={loading}
                      style={{ display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      <FiTrash2 /> 
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {/* Material UI Dialog for delete confirmation */}
      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {dialog.isBulk ? "Delete Selected Reports" : "Delete Report"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {dialog.isBulk
              ? `Are you sure you want to delete ${selectedBatches.length} selected report(s)? This action cannot be undone.`
              : "Are you sure you want to delete this report? This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={dialog.isBulk ? confirmBulkDelete : confirmDeleteReport}
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for success/error feedback */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => showAlert(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => showAlert(null)}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default GstHistory;