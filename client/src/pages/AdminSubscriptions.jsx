import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { getDashboardData } from "../api/authApi";
import AdminDashboardLayout from "../layout/AdminDashboardLayout";
import { Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, TablePagination } from "@mui/material";
import Loading from "../components/Loading";
import "./pagesUI/AdminSubscriptions.css";

const AdminSubscriptions = () => {
  const { adminToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Changed to 10 rows per page
  const [selectedAmount, setSelectedAmount] = useState("All");
  const [selectedPlan, setSelectedPlan] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData(adminToken);
        console.log("Received subscriptions in AdminSubscriptions:", JSON.stringify(res.data.subscriptions, null, 2));
        setSubscriptions(res.data.subscriptions);
        setFilteredSubscriptions(res.data.subscriptions); // Initialize with all subscriptions
        setLoading(false);
      } catch (err) {
        console.error("Subscriptions data error:", err);
        showAlert("error", err.response?.data?.message || "Failed to load subscriptions data.");
        setLoading(false);
      }
    };
    if (adminToken) {
      fetchData();
    }
  }, [adminToken, showAlert]);

  useEffect(() => {
    // Filter subscriptions based on amount and plan across all data
    const filtered = subscriptions.filter((sub) => {
      const matchesAmount =
        selectedAmount === "All" || sub.amount === parseInt(selectedAmount);
      const matchesPlan = selectedPlan === "All" || sub.plan === selectedPlan;
      return matchesAmount && matchesPlan;
    });
    console.log("Filtered subscriptions:", JSON.stringify(filtered, null, 2));
    setFilteredSubscriptions(filtered);
    setPage(0); // Reset to first page when filters change
  }, [subscriptions, selectedAmount, selectedPlan]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  return (
    <AdminDashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
        <Typography variant="h4" gutterBottom>
          User Subscriptions
        </Typography>
        <Box className="filters">
          <Box className="filter-group">
            <label htmlFor="amount-filter">Filter by Amount:</label>
            <select
              id="amount-filter"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(e.target.value)}
            >
              <option value="All">All Amounts</option>
              <option value="399">₹399</option>
              <option value="499">₹499</option>
              <option value="1799">₹1799</option>
            </select>
          </Box>
          <Box className="filter-group">
            <label htmlFor="plan-filter">Filter by Plan:</label>
            <select
              id="plan-filter"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="All">All Plans</option>
              <option value="basic_monthly">Basic Monthly</option>
              <option value="all_monthly">All Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </Box>
        </Box>
        {loading ? (
          <Loading />
        ) : filteredSubscriptions.length > 0 ? (
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
                  {filteredSubscriptions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((sub) => (
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
            <TablePagination
              rowsPerPageOptions={[10]} // Fixed to 10 rows per page
              component="div"
              count={filteredSubscriptions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : (
          <Typography>No subscriptions match the selected filters.</Typography>
        )}
      </Box>
    </AdminDashboardLayout>
  );
};

export default AdminSubscriptions;