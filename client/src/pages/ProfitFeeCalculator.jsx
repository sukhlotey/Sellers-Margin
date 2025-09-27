import { useState, useContext } from "react";
import { SubscriptionContext } from "../context/SubscriptionContext";
import ProfitFeeForm from "./ProfitFeeForm";
import ProfitFeeHistory from "./ProfitFeeHistory";
import DashboardLayout from "../layout/DashboardLayout";
import BulkUploadModal from "./BulkUploadModal";
import BulkHistory from "./BulkHistory";
import "./pagesUI/ProfitFee.css";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { MdPlaylistAddCheck, MdPlaylistRemove } from "react-icons/md";

const ProfitFeeCalculator = () => {
  const { subscription } = useContext(SubscriptionContext);
  const [view, setView] = useState(null); // null, 'single', or 'bulk'
  const [showHistory, setShowHistory] = useState(true);

  const handleCardClick = (selectedView) => {
    if (selectedView === "bulk" && !subscription?.isSubscribed) {
      setView(selectedView);
      setShowHistory(true);
    } else {
      setView(selectedView);
      setShowHistory(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <div className="profit-fee-monitor">
          {view !== null && (
            <button
              className="card-btn"
              onClick={() => setView(null)}
            >
              <MdOutlineKeyboardBackspace />
            </button>
          )}
          <h2> Profit & Fee Monitor</h2>
        </div>
        <p>Quickly calculate your profit after Amazon/Flipkart fees & GST, Shipping etc.</p>

        {view === null ? (
          <div className="card-selection-container" style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div
              className="card"
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '1.5rem',
                borderRadius: '12px',
                background: '#f8fafc',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onClick={() => handleCardClick('single')}
            >
              <h3>One Product Monitor</h3>
              <p>Monitor profit for a single product.</p>
            </div>
            <div
              className="card"
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '1.5rem',
                borderRadius: '12px',
                background: '#f8fafc',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onClick={() => handleCardClick('bulk')}
            >
              <h3>Bulk Products Monitor</h3>
              <p>Upload and Monitor profits for multiple products.</p>
            </div>
          </div> 
        ) : (
          <div className="calculator-container">
            {view === 'single' ? (
              <>
                <div className="calculator-column">
                  <ProfitFeeForm />
                </div>
                <div className="history-column">
                  <ProfitFeeHistory />
                </div>
              </>
            ) : (
              <>
                <div className="calculator-column">
                  <BulkUploadModal />
                </div>
                <div className="history-column">
                  <BulkHistory />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfitFeeCalculator;