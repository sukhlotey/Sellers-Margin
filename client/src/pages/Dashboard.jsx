import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { FaRegStar } from "react-icons/fa";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import { IoSettingsOutline, IoHomeOutline } from "react-icons/io5";
import { GrDocumentConfig } from "react-icons/gr";
const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <h2>Not logged in</h2>;

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <h2>Welcome, {user.name} 👋</h2>
        <p>Email: {user.email}</p>

        <section className="modules-preview">
          <h3>Quick Access</h3>
          <div className="cards">
            <div className="card"><IoHomeOutline size={20} /> Profit & Fee Calculator</div>
            <div className="card"> <RiMoneyRupeeCircleLine size={22} /> Review & Rating Tracker</div>
            <div className="card"> <GrDocumentConfig size={20} /> GST & Settlement</div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
