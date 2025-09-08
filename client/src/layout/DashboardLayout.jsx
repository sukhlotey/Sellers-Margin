import { useState,useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
// import Footer from "../components/Footer";
import "../components/componentsUI/components.css";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // open by default on desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Watch window resize → detect mobile vs desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // auto close on mobile
      } else {
        setSidebarOpen(true); // default open on desktop
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`dashboard-container ${sidebarOpen && !isMobile ? "sidebar-open" : ""}`}>
      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="main-layout">
        <Sidebar isOpen={sidebarOpen} isMobile={isMobile} toggleSidebar={toggleSidebar} />
        <main className="content-area">{children}</main>
      </div>


      {/* <Footer /> */}
    </div>
  );
};

export default DashboardLayout;