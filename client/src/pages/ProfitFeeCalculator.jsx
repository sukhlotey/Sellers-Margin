import { useState } from "react";
import ProfitFeeForm from "./ProfitFeeForm";
import ProfitFeeHistory from "./ProfitFeeHistory";
import DashboardLayout from "../layout/DashboardLayout";
import BulkUploadModal from "./BulkUploadModal";
import BulkHistory from "./BulkHistory";
import "./pagesUI/ProfitFee.css";

const ProfitFeeCalculator = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkHistory, setShowBulkHistory] = useState(false);

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <h2>💰 Profit & Fee Calculator</h2>
        <p>Quickly calculate your profit after Amazon/Flipkart fees & GST.</p>

        <div className="actions">
          <button onClick={() => setShowBulkModal(true)}>📦 Bulk Upload</button>
          <button onClick={() => setShowBulkHistory((prev) => !prev)}>
            {showBulkHistory ? "Hide Bulk History" : "Show Bulk History"}
          </button>
        </div>
{showBulkHistory && <BulkHistory />}

        <div className="calculator-container">
          {/* Left Column */}
          <div className="calculator-column">
            <ProfitFeeForm />
          </div>

          {/* Right Column */}
          <div className="history-column">
            <button
              className="history-btn"
              onClick={() => setShowHistory((prev) => !prev)}
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
            {showHistory && <ProfitFeeHistory />}
          </div>
        </div>

        {showBulkModal && (
          <BulkUploadModal onClose={() => setShowBulkModal(false)} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfitFeeCalculator;
