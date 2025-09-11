import { useContext } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { FaDownload } from "react-icons/fa";
import "./gstSettlement.css";

const GstDownload = () => {
  const { reports } = useContext(GstContext);
  const { token } = useContext(AuthContext);

  const downloadExcel = async () => {
    if (reports.length === 0) return alert("No reports available!");

    const detailedReports = [];
    let summaryTotals = {
      totalSales: 0,
      totalFees: 0,
      outputGST: 0,
      inputGST: 0,
      netGST: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
      totalNetPayout: 0,
    };

    for (const report of reports) {
      try {
        const response = await axios.get(`http://localhost:5000/api/gst/bulk/${report._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const records = response.data.map((record) => ({
          "Order ID": record.orderId || "",
          "Date": record.orderDate ? new Date(record.orderDate).toLocaleDateString() : "",
          "SKU/Product Name": record.productName || "",
          "Quantity": record.quantity || 1,
          "Selling Price": record.grossAmount || 0,
          "Cost Price": record.costPrice || 0,
          "Commission Fee": record.feesBreakdown.commission || 0,
          "Shipping Fee": record.feesBreakdown.shippingFee || 0,
          "Other Charges": record.feesBreakdown.otherFee || 0,
          "GST on Fees": record.gstOnFees || 0,
          "Total Settlement Amount": record.netPayout || 0,
          "GST Collected": record.gstCollected || 0,
          "Net GST Liability": (record.gstCollected || 0) - (record.gstOnFees || 0),
          "Gross Profit": record.grossProfit || 0,
          "Net Profit": record.netProfit || 0,
          "Margin %": record.margin ? record.margin.toFixed(2) : 0,
          "Status": record.reconciliationStatus || "Pending",
          "Notes": record.reconciliationNotes || "",
          "Batch ID": report._id,
          "Filename": report.filename || `Batch ${report._id}`,
          "Marketplace": report.marketplace,
        }));

        const batchSummary = await axios.get(`http://localhost:5000/api/gst/summary?batchId=${report._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.data.summary);

        summaryTotals.totalSales += batchSummary.totalGross || 0;
        summaryTotals.totalFees += batchSummary.totalFees || 0;
        summaryTotals.outputGST += batchSummary.totalGSTCollected || 0;
        summaryTotals.inputGST += batchSummary.totalGSTOnFees || 0;
        summaryTotals.netGST += (batchSummary.totalGSTCollected || 0) - (batchSummary.totalGSTOnFees || 0);
        summaryTotals.totalGrossProfit += batchSummary.totalGrossProfit || 0;
        summaryTotals.totalNetProfit += batchSummary.totalNetProfit || 0;
        summaryTotals.totalNetPayout += batchSummary.totalNetPayout || 0;

        detailedReports.push(...records);
      } catch (error) {
        console.error(`Error fetching details for batch ${report._id}:`, error);
      }
    }

    const summary = [
      { "Metric": "Total Sales", "Value": summaryTotals.totalSales.toFixed(2) },
      { "Metric": "Total Fees Paid", "Value": summaryTotals.totalFees.toFixed(2) },
      { "Metric": "Total GST Collected (Output)", "Value": summaryTotals.outputGST.toFixed(2) },
      { "Metric": "Total GST on Fees (ITC)", "Value": summaryTotals.inputGST.toFixed(2) },
      { "Metric": "Net GST Liability", "Value": summaryTotals.netGST.toFixed(2) },
      { "Metric": "Total Gross Profit", "Value": summaryTotals.totalGrossProfit.toFixed(2) },
      { "Metric": "Total Net Profit", "Value": summaryTotals.totalNetProfit.toFixed(2) },
      { "Metric": "Final Net Settlement", "Value": summaryTotals.totalNetPayout.toFixed(2) },
    ];

    const wb = XLSX.utils.book_new();
    const wsRecords = XLSX.utils.json_to_sheet(detailedReports);
    const wsSummary = XLSX.utils.json_to_sheet(summary);

    XLSX.utils.book_append_sheet(wb, wsRecords, "Order Details");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, "gst_reports_all.xlsx");
  };

  return (
    <div className="gst-container">
      <div className="gst-card">
        <h3 className="gst-title">
          <FaDownload /> Download All Reports
        </h3>
        <button className="gst-button" onClick={downloadExcel}>
          <FaDownload /> Export All to Excel
        </button>
      </div>
    </div>
  );
};

export default GstDownload;