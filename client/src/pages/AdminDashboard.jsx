import { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { getDashboardData } from "../api/authApi";
import { Typography, Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Button } from "@mui/material";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../layout/AdminDashboardLayout";
import DashboardStats from "../components/DashboardStats";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/sellersense1.png";
import Loading from "../components/Loading";

const AdminDashboard = () => {
  const { adminToken, admin } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeUsers: [],
    subscriptions: [],
    feedbacks: [],
    upcomingExpirations: [],
  });
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData(adminToken);
        console.log("Received dashboard data (feedbacks):", JSON.stringify(res.data.feedbacks, null, 2));
        setDashboardData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard data error:", err);
        showAlert("error", err.response?.data?.message || "Failed to load dashboard data.");
        setLoading(false);
      }
    };
    if (adminToken) {
      fetchData();
    }
  }, [adminToken, showAlert]);

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span key={star}>
        {star <= rating ? <FaStar style={{ color: "#f4b400" }} /> : <FaRegStar />}
      </span>
    ));
  };

  const handleDownloadReport = () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      autoTable(pdf, { html: null }); // Initialize autoTable
      const pageWidth = 190; // A4 width minus margins
      const margin = 10;
      let yOffset = 10;

      // Add Logo
      pdf.addImage(logo, "PNG", margin, yOffset, 20, 20);
      yOffset += 25;

      // Title
      pdf.setFontSize(18);
      pdf.text("Seller Sense report", margin, yOffset);
      yOffset += 10;
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yOffset);
      yOffset += 10;

      // Total Users
      pdf.setFontSize(14);
      pdf.text("Total Users", margin, yOffset);
      yOffset += 7;
      pdf.setFontSize(12);
      pdf.text(`Total: ${dashboardData.totalUsers}`, margin, yOffset);
      yOffset += 10;

      // Active Users Table
      pdf.setFontSize(14);
      pdf.text("Active Users (Last 30 Days)", margin, yOffset);
      yOffset += 7;
      autoTable(pdf, {
        startY: yOffset,
        head: [["Name", "Email", "Last Login"]],
        body: dashboardData.activeUsers.map((user) => [
          user.name || "N/A",
          user.email || "N/A",
          new Date(user.lastLogin).toLocaleDateString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 80 }, 2: { cellWidth: 60 } },
        margin: { left: margin, right: margin },
      });
      yOffset = pdf.lastAutoTable.finalY + 10;

      // Subscriptions Table
      pdf.setFontSize(14);
      pdf.text("User Subscriptions", margin, yOffset);
      yOffset += 7;
      autoTable(pdf, {
        startY: yOffset,
        head: [["Name", "Email", "Plan", "Amount (₹)", "Start Date", "End Date", "Order ID"]],
        body: dashboardData.subscriptions.map((sub) => [
          sub.userId?.name || "N/A",
          sub.userId?.email || "N/A",
          sub.plan || "N/A",
          sub.amount || "N/A",
          new Date(sub.startDate).toLocaleDateString(),
          new Date(sub.endDate).toLocaleDateString(),
          sub.orderId || "N/A",
        ]),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
        },
        margin: { left: margin, right: margin },
      });
      yOffset = pdf.lastAutoTable.finalY + 10;

      // Feedback Table
      pdf.setFontSize(14);
      pdf.text("User Feedback", margin, yOffset);
      yOffset += 7;
      autoTable(pdf, {
        startY: yOffset,
        head: [["Name", "Email", "Rating", "Feedback", "Date"]],
        body: dashboardData.feedbacks.map((fb) => {
          console.log("Rendering feedback for PDF:", JSON.stringify({ id: fb._id, name: fb.name, email: fb.email, userId: fb.userId }, null, 2));
          return [
            fb.name || fb.userId?.name || "N/A",
            fb.email || fb.userId?.email || "N/A",
            fb.rating || "N/A",
            fb.feedback || "N/A",
            new Date(fb.createdAt).toLocaleDateString(),
          ];
        }),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 20 },
          3: { cellWidth: 50 },
          4: { cellWidth: 30 },
        },
        margin: { left: margin, right: margin },
      });

      pdf.save(`Admin_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      showAlert("error", "Failed to generate PDF report.");
    }
  };

  return (
    <AdminDashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: "auto" }} ref={dashboardRef}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          {/* <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography> */}
          <Button variant="contained" color="primary" onClick={handleDownloadReport}>
            Download Report
          </Button>
        </Box>

        {loading ? (
          <Typography><Loading/></Typography>
        ) : (
          <>
            <DashboardStats dashboardData={dashboardData} />

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h4">{dashboardData.totalUsers}</Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">Active Users (Last 30 Days)</Typography>
                {dashboardData.activeUsers.length > 0 ? (
                  <>
                    <Box sx={{ overflowX: "auto" }}>
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Last Login</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboardData.activeUsers.slice(0, 5).map((user) => (
                            <TableRow key={user._id}>
                              <TableCell>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "green",
                                    borderRadius: "50%",
                                    marginRight: "8px",
                                    verticalAlign: "middle",
                                  }}
                                ></span>
                                {user.name}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                    {dashboardData.activeUsers.length > 5 && (
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate("/admin/active-users")}
                        >
                          View More
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography>No active users.</Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">User Subscriptions</Typography>
                {dashboardData.subscriptions.length > 0 ? (
                  <>
                    <Box sx={{ overflowX: "auto" }}>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Plan</TableCell>
                            <TableCell>Amount (₹)</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Order ID</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboardData.subscriptions.slice(0, 5).map((sub) => (
                            <TableRow key={sub._id}>
                              <TableCell>{sub.userId?.name || "N/A"}</TableCell>
                              <TableCell>{sub.userId?.email || "N/A"}</TableCell>
                              <TableCell>{sub.plan}</TableCell>
                              <TableCell>{sub.amount}</TableCell>
                              <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                              <TableCell>{sub.orderId}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                    {dashboardData.subscriptions.length > 5 && (
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate("/admin/subscriptions")}
                        >
                          View More
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography>No subscriptions.</Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">User Feedback</Typography>
                {dashboardData.feedbacks.length > 0 ? (
                  <>
                    <Box sx={{ overflowX: "auto" }}>
                      <Table sx={{ minWidth: 700 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Feedback</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboardData.feedbacks.slice(0, 3).map((fb) => {
                            console.log("Rendering feedback for table:", JSON.stringify({ id: fb._id, name: fb.name, email: fb.email, userId: fb.userId }, null, 2));
                            return (
                              <TableRow key={fb._id}>
                                <TableCell>{fb.name || fb.userId?.name || "N/A"}</TableCell>
                                <TableCell>{fb.email || fb.userId?.email || "N/A"}</TableCell>
                                <TableCell>{renderStars(fb.rating)}</TableCell>
                                <TableCell>{fb.feedback || "N/A"}</TableCell>
                                <TableCell>{new Date(fb.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                    {dashboardData.feedbacks.length > 3 && (
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => navigate("/admin/ratings")}
                        >
                          View More
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography>No feedback available.</Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">Upcoming Plan Expirations (Next 7 Days)</Typography>
                {dashboardData.upcomingExpirations.length > 0 ? (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Plan</TableCell>
                        <TableCell>Expiration Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.upcomingExpirations.map((sub) => (
                        <TableRow key={sub._id}>
                          <TableCell>{sub.userId?.name || "N/A"}</TableCell>
                          <TableCell>{sub.userId?.email || "N/A"}</TableCell>
                          <TableCell>{sub.plan}</TableCell>
                          <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography>No upcoming expirations.</Typography>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;