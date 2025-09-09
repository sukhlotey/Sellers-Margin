import { useState } from "react";
import ProfitFeeForm from "./ProfitFeeForm";
import ProfitFeeHistory from "./ProfitFeeHistory";
import DashboardLayout from "../layout/DashboardLayout";
import BulkUploadModal from "./BulkUploadModal"; // ✅ new modal component
import "./pagesUI/ProfitFee.css";
import BulkHistory from "./BulkHistory";

const ProfitFeeCalculator = () => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <h2>💰 Profit & Fee Calculator</h2>
        <p>Quickly calculate your profit after Amazon/Flipkart fees & GST.</p>

        <div className="calculator-container">
          {/* Left Column: Calculator Form and Result */}
          <div className="calculator-column">
            <ProfitFeeForm />

            {/* Bulk Upload Button (Bootstrap trigger) */}
            <button
              className="btn btn-primary mt-3"
              data-bs-toggle="modal"
              data-bs-target="#bulkUploadModal"
            >
              📦 Bulk Upload
            </button>
          </div>

          {/* Right Column: History Toggle and History */}
          <div className="history-column">
            <button
              className="btn btn-secondary mb-2"
              onClick={() => setShowHistory((prev) => !prev)}
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
            {showHistory && <ProfitFeeHistory />}
            <hr />
  <BulkHistory />
          </div>
        </div>
      </div>

      {/* ✅ Bootstrap Modal Component */}
      <BulkUploadModal />
    </DashboardLayout>
  );
};

export default ProfitFeeCalculator;
