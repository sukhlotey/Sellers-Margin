import { useContext, useEffect } from "react";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FiDownload } from "react-icons/fi";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  // 📄 Download as PDF
 const downloadPDF = () => {
  const doc = new jsPDF();
  doc.text("Profit Fee History Report", 14, 10);

  const tableData = history.map((item) => [
    item.productName,
    item.sellingPrice,
    item.costPrice,
    item.profit.toFixed(2),
    new Date(item.createdAt).toLocaleString(),
  ]);

  autoTable(doc, {
    head: [["Product", "SP", "CP", "Profit", "Date"]],
    body: tableData,
  });

  doc.save("profit_fee_report.pdf");
};


  // 📊 Download as Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      history.map((item) => ({
        Product: item.productName,
        SellingPrice: item.sellingPrice,
        CostPrice: item.costPrice,
        Profit: item.profit.toFixed(2),
        Date: new Date(item.createdAt).toLocaleString(),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "profit_fee_report.xlsx");
  };

  return (
    <div className="history-card">

      {history.length > 0 && (
        <div className="history-actions" style={{ marginBottom: "10px" }}>
          <button className="download-btn" onClick={downloadPDF}><FiDownload/> Download PDF</button>
          <button className="download-btn" onClick={downloadExcel}><FiDownload/> Download Excel</button>
        </div>
      )}

      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item._id} className={item.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
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
