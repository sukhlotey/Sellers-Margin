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
      item.platform || "N/A",
      formatNumber(item.sellingPrice),
      formatNumber(item.costPrice),
      formatNumber(item.importDuties),
      formatNumber(item.commissionFee),
      formatNumber(item.closingFee),
      formatNumber(item.fulfillmentFee),
      formatNumber(item.gstOnFees),
      formatNumber(item.outputGST),
      formatNumber(item.inputGSTCredit),
      formatNumber(item.netGSTRemitted),
      formatNumber(item.shippingCost),
      formatNumber(item.adCost),
      item.weight ?? "N/A",
      item.category || "N/A",
      item.fulfillmentType || "N/A",
      formatNumber(item.netPayout),
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
          "Platform",
          "SP",
          "CP",
          "Import Duties",
          "Comm. Fee",
          "Closing Fee",
          "Fulfill. Fee",
          "GST on Fees",
          "Output GST",
          "Input GST Credit",
          "Net GST",
          "Shipping",
          "Ad Cost",
          "Weight (g)",
          "Category",
          "Fulfill. Type",
          "Net Payout",
          "Profit",
          "Break Even",
          "Comm. %",
          "GST %",
          "Date",
        ],
      ],
      body: tableData,
      styles: { fontSize: 7, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 20 }, // Product
        1: { cellWidth: 10 }, // Platform
        2: { cellWidth: 10 }, // SP
        3: { cellWidth: 10 }, // CP
        4: { cellWidth: 10 }, // Import Duties
        5: { cellWidth: 10 }, // Comm. Fee
        6: { cellWidth: 10 }, // Closing Fee
        7: { cellWidth: 10 }, // Fulfill. Fee
        8: { cellWidth: 10 }, // GST on Fees
        9: { cellWidth: 10 }, // Output GST
        10: { cellWidth: 10 }, // Input GST Credit
        11: { cellWidth: 10 }, // Net GST
        12: { cellWidth: 10 }, // Shipping
        13: { cellWidth: 10 }, // Ad Cost
        14: { cellWidth: 10 }, // Weight
        15: { cellWidth: 10 }, // Category
        16: { cellWidth: 10 }, // Fulfill. Type
        17: { cellWidth: 10 }, // Net Payout
        18: { cellWidth: 10 }, // Profit
        19: { cellWidth: 10 }, // Break Even
        20: { cellWidth: 10 }, // Comm. %
        21: { cellWidth: 10 }, // GST %
        22: { cellWidth: 15 }, // Date
      },
      margin: { top: 20, left: 5, right: 5 },
    });

    doc.save("profit_fee_report.pdf");
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      history.map((item) => ({
        Product: item.productName || "N/A",
        Platform: item.platform || "N/A",
        SellingPrice: formatNumber(item.sellingPrice),
        CostPrice: formatNumber(item.costPrice),
        ImportDuties: formatNumber(item.importDuties),
        CommissionFee: formatNumber(item.commissionFee),
        ClosingFee: formatNumber(item.closingFee),
        FulfillmentFee: formatNumber(item.fulfillmentFee),
        GSTOnFees: formatNumber(item.gstOnFees),
        OutputGST: formatNumber(item.outputGST),
        InputGSTCredit: formatNumber(item.inputGSTCredit),
        NetGSTRemitted: formatNumber(item.netGSTRemitted),
        ShippingCost: formatNumber(item.shippingCost),
        AdCost: formatNumber(item.adCost),
        Weight: item.weight ?? "N/A",
        Category: item.category || "N/A",
        FulfillmentType: item.fulfillmentType || "N/A",
        NetPayout: formatNumber(item.netPayout),
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
              <strong>{item.productName}</strong> ({item.platform}) — Profit: ₹{formatNumber(item.profit)}
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