import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { getDashboardData } from "../api/authApi";
import { Typography, Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button } from "@mui/material";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardStats from "../components/DashboardStats";
import AdminDashboardLayout from "../layout/AdminDashboardLAyout";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData(adminToken);
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

  return (
    <AdminDashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <>
            <DashboardStats dashboardData={dashboardData} />

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">Total Users</Typography>
                <Typography variant="h4">{dashboardData.totalUsers}</Typography>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">Active Users (Last 30 Days)</Typography>
                {dashboardData.activeUsers.length > 0 ? (
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
                        {dashboardData.activeUsers.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography>No active users.</Typography>
                )}
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">User Subscriptions</Typography>
                {dashboardData.subscriptions.length > 0 ? (
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
                        {dashboardData.subscriptions.map((sub) => (
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
                ) : (
                  <Typography>No subscriptions.</Typography>
                )}
              </CardContent>
            </Card>

            {/* Feedback */}
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
                          {dashboardData.feedbacks.slice(0, 3).map((fb) => (
                            <TableRow key={fb._id}>
                              <TableCell>{fb.userId?.name || "N/A"}</TableCell>
                              <TableCell>{fb.userId?.email || "N/A"}</TableCell>
                              <TableCell>{renderStars(fb.rating)}</TableCell>
                              <TableCell>{fb.feedback || "N/A"}</TableCell>
                              <TableCell>{new Date(fb.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
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

            {/* Upcoming Expirations */}
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