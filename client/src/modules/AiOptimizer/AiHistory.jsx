import { useEffect, useContext } from "react";
import { AiContext } from "../../context/AiContext";
import { AuthContext } from "../../context/AuthContext";
import { fetchAiHistory } from "../../api/aiApi";

const AiHistory = () => {
  const { results, setResults } = useContext(AiContext);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetchAiHistory(token);
        setResults(res.data); // Past optimizations
      } catch (err) {
        console.error("History fetch error:", err.message);
      }
    };
    loadHistory();
  }, [token, setResults]);

  return (
    <div className="card">
      <h3>Optimization History</h3>
      {results.length ? (
        results.map((r, i) => (
          <div key={i} className="result-block">
            <p><strong>Original Title:</strong> {r.originalTitle}</p>
            <p><strong>Optimized Title:</strong> {r.optimizedTitle}</p>
            <p><strong>Keywords:</strong> {r.keywords?.join(", ")}</p>
            <hr />
          </div>
        ))
      ) : (
        <p>No history yet.</p>
      )}
    </div>
  );
};

export default AiHistory;
