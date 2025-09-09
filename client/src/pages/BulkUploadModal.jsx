import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import * as XLSX from "xlsx";
import axios from "axios";

const BulkUploadModal = ({ onClose }) => {
  const { token } = useContext(AuthContext);
  const { setBulkHistory } = useContext(ProfitFeeContext);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 📂 Parse Excel/CSV
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      setRecords(json);
    };
    reader.readAsArrayBuffer(file);
  };

  // 💾 Save bulk
  const saveBulk = async () => {
    if (records.length === 0) return alert("No records to save!");
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/profit-fee/bulk/save",
        { records },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Bulk saved (${res.data.count} records)`);
      // refresh bulk history
      const historyRes = await axios.get("http://localhost:5000/api/profit-fee/bulk/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBulkHistory(historyRes.data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving bulk data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>📦 Bulk Upload</h3>
        <p>Upload Excel/CSV with columns: productName, sellingPrice, costPrice, commissionPercent, gstPercent, shippingCost, adCost, category, weight</p>

        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />

        {records.length > 0 && (
          <div className="preview-table">
            <h4>Preview ({records.length} rows)</h4>
            <table>
              <thead>
                <tr>
                  {Object.keys(records[0]).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length > 5 && <p>…and {records.length - 5} more rows</p>}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={saveBulk} disabled={loading}>
            {loading ? "Saving..." : "Save Bulk"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
