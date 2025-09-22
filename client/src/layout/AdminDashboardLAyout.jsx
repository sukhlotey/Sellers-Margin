import { useState, useEffect } from "react";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import "../components/componentsUI/components.css";

const AdminDashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={`dashboard-container admin-dashboard-container ${sidebarOpen && !isMobile ? "sidebar-open" : ""}`}>
            <AdminNavbar toggleSidebar={toggleSidebar} />
            <div className="main-layout">
                <AdminSidebar isOpen={sidebarOpen} isMobile={isMobile} toggleSidebar={toggleSidebar} />
                <main className="content-area">{children}</main>
            </div>
        </div>
    );
};

export default AdminDashboardLayout;