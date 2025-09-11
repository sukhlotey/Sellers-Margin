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

  const formatNumber = (value) => (typeof value === "number" && !isNaN(value) ? value.toFixed(2) : "N/A");

 const downloadPDF = () => {
  const doc = new jsPDF();
  doc.text("Profit Fee History Report", 14, 10);

  const tableData = history.map((item) => [
    item.productName || "N/A",
    formatNumber(item.sellingPrice),
    formatNumber(item.costPrice),
    formatNumber(item.commissionFee),
    formatNumber(item.gstTax),
    formatNumber(item.shippingCost),
    formatNumber(item.adCost),
    item.weight ?? "N/A",
    item.category || "N/A",
    formatNumber(item.profit),
    formatNumber(item.breakEvenPrice),
    formatNumber(item.commissionPercent),
    formatNumber(item.gstPercent),
    new Date(item.createdAt).toLocaleString(),
  ]);

  autoTable(doc, {
    head: [
      [
        "Product",
        "SP",
        "CP",
        "Comm. Fee",
        "GST Tax",
        "Shipping",
        "Ad Cost",
        "Weight (g)",
        "Category",
        "Profit",
        "Break Even",
        "Comm. %",
        "GST %",
        "Date",
      ],
    ],
    body: tableData,
    styles: { fontSize: 8, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 25 }, // Product
      1: { cellWidth: 12 }, // SP
      2: { cellWidth: 12 }, // CP
      3: { cellWidth: 12 }, // Comm. Fee
      4: { cellWidth: 12 }, // GST Tax
      5: { cellWidth: 12 }, // Shipping
      6: { cellWidth: 12 }, // Ad Cost
      7: { cellWidth: 12 }, // Weight
      8: { cellWidth: 15 }, // Category
      9: { cellWidth: 12 }, // Profit
      10: { cellWidth: 12 }, // Break Even
      11: { cellWidth: 12 }, // Comm. %
      12: { cellWidth: 12 }, // GST %
      13: { cellWidth: 15 }, // Date
    },
    margin: { top: 20, left: 10, right: 10 },
  });

  doc.save("profit_fee_report.pdf");
};

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      history.map((item) => ({
        Product: item.productName || "N/A",
        SellingPrice: formatNumber(item.sellingPrice),
        CostPrice: formatNumber(item.costPrice),
        CommissionFee: formatNumber(item.commissionFee),
        GSTTax: formatNumber(item.gstTax),
        ShippingCost: formatNumber(item.shippingCost),
        AdCost: formatNumber(item.adCost),
        Weight: item.weight ?? "N/A",
        Category: item.category || "N/A",
        Profit: formatNumber(item.profit),
        BreakEvenPrice: formatNumber(item.breakEvenPrice),
        CommissionPercent: formatNumber(item.commissionPercent),
        GSTPercent: formatNumber(item.gstPercent),
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
          <button className="download-btn" onClick={downloadPDF}>
            <FiDownload /> Download PDF
          </button>
          <button className="download-btn" onClick={downloadExcel}>
            <FiDownload /> Download Excel
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li
              key={item._id}
              className={item.profit >= 0 ? "profit-positive" : "profit-negative"}
            >
              <strong>{item.productName}</strong> — Profit: ₹{formatNumber(item.profit)}
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