import { useContext } from "react";
import { AiContext } from "../../context/AiContext";

const AiResult = () => {
  const { results, loading } = useContext(AiContext);

  if (loading) return <p>Optimizing your listing… ⏳</p>;

  if (!results.length) return <p>No optimizations yet. Try one above!</p>;

  return (
    <div className="card">
      <h3>Optimized Results</h3>
      {results.map((r, i) => (
        <div key={i} className="result-block">
          <p><strong>Optimized Title:</strong> {r.optimizedTitle}</p>
          <p><strong>Optimized Description:</strong> {r.optimizedDescription}</p>
          <p><strong>Keywords:</strong> {r.keywords?.join(", ")}</p>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default AiResult;
