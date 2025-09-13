import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import axios from "axios";
import BulkDetails from "./BulkDetails";
import { FiArrowRight, FiTrash2 } from "react-icons/fi";
import { FaBoxes } from "react-icons/fa";
import { Alert, Snackbar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material"; // Import Material-UI components

const BulkHistory = () => {
  const { token } = useContext(AuthContext);
  const { bulkHistory, setBulkHistory, deleteFromBulkHistory } = useContext(ProfitFeeContext);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]); // Track selected batchIds
  const [showCheckboxes, setShowCheckboxes] = useState(false); // Toggle checkbox visibility
  const [alert, setAlert] = useState({ open: false, message: "", severity: "error" }); // State for Snackbar
  const [dialog, setDialog] = useState({ open: false, batchId: null, isBulk: false }); // State for Dialog

  useEffect(() => {
    const fetchBulkHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/profit-fee/bulk/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBulkHistory(res.data);
      } catch (err) {
        console.error("Error fetching bulk history", err);
      }
    };
    fetchBulkHistory();
  }, [token, setBulkHistory]);

  const handleViewDetails = async (batch) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/profit-fee/bulk/${batch._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedBatch({
        ...batch,
        records: res.data,
      });
    } catch (err) {
      console.error("Error fetching batch details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = (batchId) => {
    // Open confirmation dialog for single batch deletion
    setDialog({ open: true, batchId, isBulk: false });
  };

  const confirmDeleteBatch = async () => {
    const { batchId } = dialog;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/profit-fee/bulk/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      deleteFromBulkHistory([batchId]);
      setAlert({
        open: true,
        message: "Batch deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting batch", err);
      setAlert({
        open: true,
        message: "Error deleting batch",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setDialog({ open: false, batchId: null, isBulk: false });
    }
  };

  const handleToggleDelete = () => {
    if (!showCheckboxes) {
      // First click: Show checkboxes
      setShowCheckboxes(true);
    } else if (selectedBatches.length > 0) {
      // Second click (with selections): Open confirmation dialog
      setDialog({ open: true, batchId: null, isBulk: true });
    } else {
      // Second click (no selections): Hide checkboxes
      setShowCheckboxes(false);
      setSelectedBatches([]);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      setLoading(true);
      await axios.delete("http://localhost:5000/api/profit-fee/bulk", {
        headers: { Authorization: `Bearer ${token}` },
        data: { batchIds: selectedBatches },
      });
      deleteFromBulkHistory(selectedBatches);
      setSelectedBatches([]); // Clear selection
      setShowCheckboxes(false); // Hide checkboxes
      setAlert({
        open: true,
        message: "Selected batches deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting selected batches", err);
      setAlert({
        open: true,
        message: "Error deleting selected batches",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setDialog({ open: false, batchId: null, isBulk: false });
    }
  };

  const handleSelectBatch = (batchId) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, batchId: null, isBulk: false });
  };

  if (selectedBatch) {
    return (
      <BulkDetails
        batch={selectedBatch}
        onBack={() => setSelectedBatch(null)}
      />
    );
  }

  return (
    <div className="bulk-history">
      <div className="bulk-history-controls">
        <h3>
          <FaBoxes /> Bulk History
        </h3>
        <button
          className="toggle-delete-btn"
          onClick={handleToggleDelete}
          disabled={loading}
        >
          <FiTrash2 />
          {showCheckboxes ? `Delete Selected (${selectedBatches.length})` : "Select"}
        </button>
      </div>
      {bulkHistory.length === 0 ? (
        <p>No bulk uploads yet.</p>
      ) : (
        <div className="bulk-history-cards">
          {bulkHistory.map((batch) => (
            <div key={batch._id} className="bulk-history-card">
              <div className="bulk-history-card-content">
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={selectedBatches.includes(batch._id)}
                    onChange={() => handleSelectBatch(batch._id)}
                    className="batch-checkbox"
                  />
                )}
                <div>
                  <strong>{batch.fileName || "Untitled"}</strong>
                  <p>{new Date(batch.createdAt).toLocaleString()}</p>
                  <p>{batch.recordsCount} records</p>
                </div>
              </div>
              <div className="bulk-history-card-actions">
                <a
                  href="#"
                  className="view-details-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleViewDetails(batch);
                  }}
                >
                  {loading ? "Loading..." : "View Details"} <FiArrowRight />
                </a>
                <button
                  className="delete-batch-btn"
                  onClick={() => handleDeleteBatch(batch._id)}
                  disabled={loading}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
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
      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {dialog.isBulk ? "Delete Selected Batches" : "Delete Batch"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {dialog.isBulk
              ? `Are you sure you want to delete ${selectedBatches.length} selected batch(es)? This action cannot be undone.`
              : "Are you sure you want to delete this batch? This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={dialog.isBulk ? confirmBulkDelete : confirmDeleteBatch}
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BulkHistory;