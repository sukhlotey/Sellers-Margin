import { useContext } from "react";
import { GstContext } from "../../context/GstContext";
import { FaTable } from "react-icons/fa";
import "./gstSettlement.css";

const GstSummary = () => {
  const { summary } = useContext(GstContext);

  if (!summary) {
    return (
      <div className="gst-container">
        <div className="gst-card">
          <h3 className="gst-title">
            <FaTable /> GST Summary
          </h3>
          <p>No summary data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gst-container">
      <div className="gst-card">
        <h3 className="gst-title">
          <FaTable /> GST Summary
        </h3>
        <ul className="gst-summary-list">
          <li>Total Sales: ₹{summary.totalSales.toFixed(2)}</li>
          <li>Output GST: ₹{summary.outputGST.toFixed(2)}</li>
          <li>Input GST (ITC): ₹{summary.inputGST.toFixed(2)}</li>
          <li>Net GST Liability: ₹{summary.netGST.toFixed(2)}</li>
          <li>Marketplace Fees: ₹{summary.totalFees.toFixed(2)}</li>
          <li>Total Gross Profit: ₹{summary.totalGrossProfit.toFixed(2)}</li>
          <li>Total Net Profit: ₹{summary.totalNetProfit.toFixed(2)}</li>
        </ul>
      </div>
    </div>
  );
};

export default GstSummary;