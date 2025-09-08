import { useState } from "react";
import ProfitFeeForm from "./ProfitFeeForm";
import ProfitFeeHistory from "./ProfitFeeHistory";
import "./pagesUI/ProfitFee.css";
const ProfitFeeCalculator = () => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="dashboard-content">
      <h2>💰 Profit & Fee Calculator</h2>
      <p>Quickly calculate your profit after Amazon/Flipkart fees & GST.</p>

      <ProfitFeeForm />

      <button
        className="history-btn"
        onClick={() => setShowHistory((prev) => !prev)}
      >
        {showHistory ? "Hide History" : "Show History"}
      </button>

      {showHistory && <ProfitFeeHistory />}
    </div>
  );
};

export default ProfitFeeCalculator;
