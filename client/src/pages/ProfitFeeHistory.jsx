import { useContext, useEffect } from "react";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const ProfitFeeHistory = () => {
  const { history, setHistory } = useContext(ProfitFeeContext);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/profit-fee/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (error) {
        console.error("Fetch history error:", error.response?.data || error.message);
      }
    };

    fetchHistory();
  }, [token, setHistory]);

  return (
    <div className="history-card">
      <h2>Saved Calculations</h2>
      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item._id}>
              <strong>{item.productName}</strong> — Profit: ₹{item.profit.toFixed(2)}  
              <br />
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProfitFeeHistory;
