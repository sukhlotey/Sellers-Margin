import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { getDashboardData } from "../api/authApi";
import AdminDashboardLayout from "../layout/AdminDashboardLayout";
import { Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, TablePagination } from "@mui/material";
import Loading from "../components/Loading";
import "./pagesUI/AdminActiveUsers.css";

const AdminActiveUsers = () => {
  const { adminToken } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData(adminToken);
        console.log("Received active users in AdminActiveUsers:", JSON.stringify(res.data.activeUsers, null, 2));
        setActiveUsers(res.data.activeUsers);
        setLoading(false);
      } catch (err) {
        console.error("Active users data error:", err);
        showAlert("error", err.response?.data?.message || "Failed to load active users data.");
        setLoading(false);
      }
    };
    if (adminToken) {
      fetchData();
    }
  }, [adminToken, showAlert]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <AdminDashboardLayout>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Active Users (Last 30 Days)
        </Typography>
        {loading ? (
          <Loading />
        ) : activeUsers.length > 0 ? (
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
                  {activeUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <span
                            className="online-dot"
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
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={activeUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : (
          <Typography>No active users.</Typography>
        )}
      </Box>
    </AdminDashboardLayout>
  );
};

export default AdminActiveUsers;