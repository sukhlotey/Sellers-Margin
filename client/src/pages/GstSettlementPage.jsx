import { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import UploadReport from "../modules/GstReconciliation/UploadReport";
import GstSummary from "../modules/GstReconciliation/GstSummary";
import GstDownload from "../modules/GstReconciliation/GstDownload";
import GstHistory from "../modules/GstReconciliation/GstHistory"; // New component for reports list
import { MdOutlineKeyboardBackspace } from "react-icons/md";

import "../pages/pagesUI/ProfitFee.css"; // reuse same styles

const GstSettlementPage = () => {
  const [view, setView] = useState(null); // null, 'upload', 'history'
  const [showHistory, setShowHistory] = useState(true);

  const handleCardClick = (selectedView) => {
    setView(selectedView);
    setShowHistory(true); // Reset toggle
  };

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <div className="profit-fee-monitor">
          {view !== null && (
            <button className="card-btn" onClick={() => setView(null)}>
              <MdOutlineKeyboardBackspace />
            </button>
          )}
          <h2>GST & Settlement Reconciliation</h2>
        </div>
        <p>
          Upload marketplace settlement reports, auto-calculate GST liability,
          ITC, fees, and download reconciled reports.
        </p>

        {view === null ? (
          <div
            className="card-selection-container"
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div
              className="card"
              style={{
                flex: "1",
                minWidth: "250px",
                padding: "1.5rem",
                borderRadius: "12px",
                background: "#f8fafc",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onClick={() => handleCardClick("upload")}
            >
              <h3>Upload Report</h3>
              <p>Upload and process GST/settlement files.</p>
            </div>

            <div
              className="card"
              style={{
                flex: "1",
                minWidth: "250px",
                padding: "1.5rem",
                borderRadius: "12px",
                background: "#f8fafc",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onClick={() => handleCardClick("history")}
            >
              <h3>Reports History</h3>
              <p>View all previously uploaded reports.</p>
            </div>
          </div>
        ) : (
          <div className="calculator-container">
            {view === "upload" ? (
              <>
                <div className="calculator-column">
                  <UploadReport />
                  <GstSummary />
                </div>
                <div className="history-column">
                  {/* <button
                    className="btn btn-secondary mb-2"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    {showHistory ? (
                      <MdPlaylistRemove size={25} />
                    ) : (
                      <MdPlaylistAddCheck size={25} />
                    )}{" "}
                    History
                  </button> */}
                  {showHistory && <GstHistory />}
                </div>
              </>
            ) : (
              <div className="history-column">
                <GstHistory />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GstSettlementPage;
