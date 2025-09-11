import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { FaRegStar } from "react-icons/fa";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import { IoSettingsOutline, IoHomeOutline } from "react-icons/io5";
import { GrDocumentConfig } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  if (!user) return <h2>Not logged in</h2>;
const handleProfitFeePage = () => {
  navigate("/profit-fee");
}

const handleReviewRating = () => {
  navigate("/review");
}

const handleGstSettlement = () => {
  navigate("/gst-settlement");
}
  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <h2>Welcome, {user.name} 👋</h2>
        <p>Email: {user.email}</p>

        <section className="modules-preview">
          <h3>Quick Access</h3>
          <div className="cards">
            <div className="card" onClick={handleProfitFeePage}><IoHomeOutline size={20} /> Profit & Fee Calculator</div>
            <div className="card" onClick={handleReviewRating}> <RiMoneyRupeeCircleLine size={22} /> Review & Rating Tracker</div>
            <div className="card" onClick={handleGstSettlement}> <GrDocumentConfig size={20} /> GST & Settlement</div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
