import { useContext } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { FaDownload } from "react-icons/fa";
import { useAlert } from '../../context/AlertContext';
import "./gstSettlement.css";

const GstDownload = () => {
  const { reports } = useContext(GstContext);
  const { token } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const downloadExcel = async () => {
    if (reports.length === 0) {
      showAlert("error", "No reports available!");
      return;
    }

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
      totalReturns: 0,
    };

    for (const report of reports) {
      try {
        const response = await axios.get(`http://localhost:5000/api/gst/bulk/${report._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const records = response.data.map((record) => {
          const feeLabel = record.marketplace === "amazon" ? "Closing Fee" : record.marketplace === "flipkart" ? "Collection Fee" : "Other Charges";
          return {
            "Order ID": record.orderId || "",
            "Date": record.orderDate ? new Date(record.orderDate).toLocaleDateString() : "",
            "SKU/Product Name": record.productName || "",
            "Quantity": record.quantity || 1,
            "Selling Price": record.grossAmount || 0,
            "Cost Price": record.costPrice || 0,
            "Commission Fee": record.feesBreakdown.commission || 0,
            "Shipping Fee": record.feesBreakdown.shippingFee || 0,
            [feeLabel]: record.feesBreakdown.otherFee || 0,
            "GST on Fees": record.gstOnFees || 0,
            "Total Settlement Amount": record.netPayout || 0,
            "GST Collected": record.gstCollected || 0,
            "Net GST Liability": (record.gstCollected || 0) - (record.gstOnFees || 0),
            "Gross Profit": record.grossProfit || 0,
            "Net Profit": record.netProfit || 0,
            "Margin %": record.margin ? record.margin.toFixed(2) : 0,
            "Status": record.reconciliationStatus || "Pending",
            "Notes": record.reconciliationNotes || "",
            "Return Amount": record.returnAmount || 0,
            "Batch ID": report._id,
            "Filename": report.filename || `Batch ${report._id}`,
            "Marketplace": record.marketplace,
          };
        });

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
        summaryTotals.totalReturns += batchSummary.totalReturns || 0;

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
      { "Metric": "Total Returns", "Value": summaryTotals.totalReturns.toFixed(2) },
      { "Metric": "Final Net Settlement", "Value": summaryTotals.totalNetPayout.toFixed(2) },
    ];

    const wb = XLSX.utils.book_new();
    const wsRecords = XLSX.utils.json_to_sheet(detailedReports);

    // Apply background colors based on Net Profit
    const range = XLSX.utils.decode_range(wsRecords["!ref"]);
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const netProfitCell = `O${row + 1}`;
      const netProfitValue = wsRecords[netProfitCell]?.v || 0;
      const fillStyle = netProfitValue < 0
        ? { fill: { fgColor: { rgb: "FF0000" } } }
        : netProfitValue > 0
          ? { fill: { fgColor: { rgb: "00FF00" } } }
          : {};
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        wsRecords[cellAddress] = wsRecords[cellAddress] || {};
        wsRecords[cellAddress].s = fillStyle;
      }
    }

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
        <h4 className="gst-title" style={{fontSize:"16px"}} >
      Download All Reports
        </h4>
        <button style={{ fontSize: "14px" }} className="gst-button" onClick={downloadExcel}>
          <FaDownload /> Export All
        </button>
      </div>
    </div>
  );
};

export default GstDownload;
