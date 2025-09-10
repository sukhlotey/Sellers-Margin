import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import axios from "axios";
import BulkDetails from "./BulkDetails";
import { FiArrowRight } from "react-icons/fi";
import { FaBoxes } from "react-icons/fa";

const BulkHistory = () => {
  const { token } = useContext(AuthContext);
  const { bulkHistory, setBulkHistory } = useContext(ProfitFeeContext);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);

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
      <h3><FaBoxes/> Bulk History</h3>

      {bulkHistory.length === 0 ? (
        <p>No bulk uploads yet.</p>
      ) : (
        <div className="bulk-history-cards">
          {bulkHistory.map((batch) => (
            <div key={batch._id} className="bulk-history-card">
              <div>
                <strong>{batch.fileName || "Untitled"}</strong>
                <p>{new Date(batch.createdAt).toLocaleString()}</p>
                <p>{batch.recordsCount} records</p>
              </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkHistory;