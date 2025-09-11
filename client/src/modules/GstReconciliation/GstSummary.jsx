import { useContext } from "react";
import { GstContext } from "../../context/GstContext";

const GstSummary = () => {
  const { summary } = useContext(GstContext);

  if (!summary) return <p>No summary yet. Upload a report first.</p>;

  return (
    <div className="card">
      <h3>GST Summary</h3>
      <ul>
        <li>Total Sales: ₹{summary.totalSales.toFixed(2)}</li>
        <li>Output GST: ₹{summary.outputGST.toFixed(2)}</li>
        <li>Input GST (ITC): ₹{summary.inputGST.toFixed(2)}</li>
        <li>Net GST Liability: ₹{summary.netGST.toFixed(2)}</li>
        <li>Marketplace Fees: ₹{summary.totalFees.toFixed(2)}</li>
      </ul>
    </div>
  );
};

export default GstSummary;
