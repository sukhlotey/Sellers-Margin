import { useContext, useEffect } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import { fetchReports } from "../../api/gstApi";

const GstHistory = () => {
  const { reports, setReports } = useContext(GstContext);
  const { token } = useContext(AuthContext);

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

  return (
    <div className="card">
      <h3>Uploaded Reports History</h3>
      {reports.length === 0 ? (
        <p>No reports uploaded yet.</p>
      ) : (
        <ul>
          {reports.map((rep) => (
            <li key={rep._id}>
              <strong>{rep.filename}</strong> —{" "}
              {new Date(rep.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GstHistory;
