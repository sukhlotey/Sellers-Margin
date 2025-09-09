import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import axios from "axios";
import BulkDetails from "./BulkDetails";

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
        records: res.data, // ✅ attach fetched records
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
      <h3>📦 Bulk Upload History</h3>

      {bulkHistory.length === 0 ? (
        <p>No bulk uploads yet.</p>
      ) : (
        <ul>
          {bulkHistory.map((batch) => (
            <li key={batch._id} className="bulk-item">
              <div>
                <strong>{new Date(batch.createdAt).toLocaleString()}</strong>
                <br />
                {batch.recordsCount} records
              </div>
              <button onClick={() => handleViewDetails(batch)}>
                {loading ? "Loading..." : "View Details"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BulkHistory;
