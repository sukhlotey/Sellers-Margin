import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import axios from "axios";
import BulkDetails from "./BulkDetails";
import { FiArrowRight, FiTrash2 } from "react-icons/fi";
import { FaBoxes } from "react-icons/fa";

const BulkHistory = () => {
  const { token } = useContext(AuthContext);
  const { bulkHistory, setBulkHistory, deleteFromBulkHistory } = useContext(ProfitFeeContext);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]); // Track selected batchIds
  const [showCheckboxes, setShowCheckboxes] = useState(false); // Toggle checkbox visibility

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

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/profit-fee/bulk/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      deleteFromBulkHistory([batchId]);
      alert("Batch deleted successfully!");
    } catch (err) {
      console.error("Error deleting batch", err);
      alert("Error deleting batch");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDelete = async () => {
    if (!showCheckboxes) {
      // First click: Show checkboxes
      setShowCheckboxes(true);
    } else if (selectedBatches.length > 0) {
      // Second click (with selections): Delete selected batches
      if (!window.confirm(`Are you sure you want to delete ${selectedBatches.length} batch(es)?`)) return;

      try {
        setLoading(true);
        await axios.delete("http://localhost:5000/api/profit-fee/bulk", {
          headers: { Authorization: `Bearer ${token}` },
          data: { batchIds: selectedBatches },
        });
        deleteFromBulkHistory(selectedBatches);
        setSelectedBatches([]); // Clear selection
        setShowCheckboxes(false); // Hide checkboxes
        alert("Selected batches deleted successfully!");
      } catch (err) {
        console.error("Error deleting selected batches", err);
        alert("Error deleting selected batches");
      } finally {
        setLoading(false);
      }
    } else {
      // Second click (no selections): Hide checkboxes
      setShowCheckboxes(false);
      setSelectedBatches([]);
    }
  };

  const handleSelectBatch = (batchId) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
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
      

      {bulkHistory.length === 0 ? (
        <p>No bulk uploads yet.</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default BulkHistory;