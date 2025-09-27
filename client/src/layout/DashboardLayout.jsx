import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../components/componentsUI/components.css";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); // Initialize based on 1024px breakpoint
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // Non-desktop is < 1024px

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close sidebar when clicking outside in non-desktop views
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Prevent sidebar clicks from closing it
  const handleSidebarClick = (e) => {
    e.stopPropagation();
  };

  // Watch window resize → detect desktop vs non-desktop
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 1024; // Changed to 1024px
      setIsMobile(newIsMobile);
      if (newIsMobile) {
        setSidebarOpen(false); // Close sidebar in non-desktop views
      } else {
        setSidebarOpen(true); // Open sidebar in full desktop view
      }
    };
    handleResize(); // Run on mount to set initial state correctly
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`dashboard-container ${sidebarOpen && !isMobile ? "sidebar-open" : ""}`}>
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="main-layout">
        <Sidebar isOpen={sidebarOpen} isMobile={isMobile} toggleSidebar={toggleSidebar} onClick={handleSidebarClick} />
        {isMobile && sidebarOpen && (
          <div className="sidebar-overlay" onClick={handleOverlayClick}></div>
        )}
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;