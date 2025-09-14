import { useState } from "react";
import AiForm from "../modules/AiOptimizer/AiForm";
import AiResult from "../modules/AiOptimizer/AiResult";
import AiHistory from "../modules/AiOptimizer/AiHistory";
import DashboardLayout from "../layout/DashboardLayout";
import { MdOutlineKeyboardBackspace } from "react-icons/md";

const AiOptimizerPage = () => {
  const [view, setView] = useState("form"); // form | history

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        {view !== "form" && (
          <button className="card-btn" onClick={() => setView("form")}>
            <MdOutlineKeyboardBackspace />
          </button>
        )}

        <h2>AI Listing Optimizer</h2>
        <p>Boost sales with AI-generated SEO titles, descriptions & keywords.</p>

        {view === "form" ? (
          <>
            <AiForm />
            <AiResult />
            <button
              className="btn btn-secondary"
              style={{ marginTop: "1rem" }}
              onClick={() => setView("history")}
            >
              View History
            </button>
          </>
        ) : (
          <AiHistory />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AiOptimizerPage;
