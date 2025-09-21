import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { SubscriptionContext } from "../context/SubscriptionContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, Box, Paper, IconButton } from "@mui/material";
import { saveAs } from "file-saver";
import "./pagesUI/Settings.css";
import DashboardLayout from "../layout/DashboardLayout";
import jsPDF from "jspdf";
import { FaDownload, FaStar, FaRegStar} from "react-icons/fa";

const Setting = () => {
  const { user, token } = useContext(AuthContext);
  const { subscription } = useContext(SubscriptionContext);
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [rating, setRating] = useState(0);
const [feedback, setFeedback] = useState("");
  const [billingHistory, setBillingHistory] = useState([]);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  // const [recoveryCode, setRecoveryCode] = useState("Use the code provided during signup");

  // Fetch billing history and recovery code
  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/subscription/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBillingHistory(res.data);
      } catch (err) {
        console.error("Error fetching billing history:", err);
        showAlert("error", "Failed to load billing history.");
      }
    };
    // const fetchRecoveryCode = async () => {
    //   try {
    //     const res = await axios.get("http://localhost:5000/api/auth/recovery-code", {
    //       headers: { Authorization: `Bearer ${token}` },
    //     });
    //     if (res.data.recoveryCode) {
    //       setRecoveryCode(res.data.recoveryCode);
    //     } else {
    //       setRecoveryCode("Use the code provided during signup");
    //     }
    //   } catch (err) {
    //     console.error("Error fetching recovery code:", err);
    //     showAlert("error", err.response?.data?.message || "Failed to load recovery code.");
    //   }
    // };
    if (token) {
      fetchBillingHistory();
      // fetchRecoveryCode();
    }
  }, [token, showAlert]);

  // Handle password change input
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Submit password change
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert("error", "All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("error", "New passwords do not match.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:5000/api/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("success", "Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to change password.");
    }
  };

// Submit feedback
const handleFeedbackSubmit = async () => {
  try {
    await axios.post(
      "http://localhost:5000/api/feedback/submit",
      { rating, feedback },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    showAlert("success", "Thank you for your feedback!");
    setRating(0);
    setFeedback("");
  } catch (err) {
    showAlert("error", err.response?.data?.message || "Failed to submit feedback.");
  }
};
  // Download invoice as PDF
  const handleDownloadInvoice = (subscription) => {
    try {
      const doc = new jsPDF();
      
      // Set document properties
      doc.setFontSize(18);
      doc.text("Invoice", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("Seller Sense", 20, 40);
      doc.text("Email: support@sellersense.com", 20, 48);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 56);

      // Billed To
      doc.setFontSize(14);
      doc.text("Billed To:", 20, 80);
      doc.setFontSize(12);
      doc.text(user.name, 20, 90);
      doc.text(user.email, 20, 98);

      // Table Header
      doc.setFontSize(12);
      doc.setFillColor(43, 108, 176); // Blue header background
      doc.rect(20, 120, 170, 10, "F");
      doc.setTextColor(255, 255, 255); // White text
      doc.text("Description", 25, 127);
      doc.text("Details", 100, 127);
      doc.setTextColor(0, 0, 0); // Reset to black

      // Table Content
      const planNameMap = {
        basic_monthly: "Basic Monthly",
        all_monthly: "All Modules Monthly",
        annual: "Annual",
      };
      const tableData = [
        ["Plan", planNameMap[subscription.plan] || subscription.plan],
        ["Amount", `₹${subscription.amount}`],
        ["Payment ID", subscription.paymentId],
        ["Order ID", subscription.orderId],
        ["Start Date", new Date(subscription.startDate).toLocaleDateString()],
        ["End Date", new Date(subscription.endDate).toLocaleDateString()],
      ];

      let y = 135;
      tableData.forEach(([desc, detail]) => {
        doc.text(desc, 25, y);
        doc.text(detail, 100, y);
        y += 10;
      });

      // Draw table lines
      doc.setDrawColor(0);
      doc.rect(20, 130, 170, y - 125); // Outer table border
      for (let i = 0; i < tableData.length; i++) {
        doc.line(20, 130 + i * 10, 190, 130 + i * 10); // Horizontal lines
      }
      doc.line(95, 120, 95, y - 5); // Vertical divider

      // Footer
      doc.text("Thank you for your subscription!", 20, y + 20);

      // Save PDF
      const pdfBlob = doc.output("blob");
      saveAs(pdfBlob, `invoice_${subscription.orderId}.pdf`);
      showAlert("success", "Invoice downloaded successfully!");
    } catch (err) {
      console.error("Download invoice error:", err);
      showAlert("error", "Failed to download invoice.");
    }
  };

  const toggleRecoveryCodeVisibility = () => {
    setShowRecoveryCode(!showRecoveryCode);
  };

  return (
    <DashboardLayout>
      <div className="settings-container">
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <div className="settings-top-row">
          {/* Account Settings */}
          <Paper className="settings-section settings-card" style={{ "--card-index": 0 }}>
            <Typography variant="h6" gutterBottom>
              Account Settings
            </Typography>
            <Box className="settings-profile">
              <TextField
                label="Name"
                value={user?.name || ""}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Email"
                value={user?.email || ""}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Change Password
            </Typography>
            <Box className="settings-password-form">
              <TextField
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleChangePassword}
                sx={{ mt: 2 }}
                style={{maxWidth: '200px'}}

              >
                Change Password
              </Button>
            </Box>
            {/* <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Recovery Code
            </Typography>
            <Box display="flex" alignItems="center">
              <TextField
                label="Recovery Code"
                value={showRecoveryCode ? recoveryCode : "••••••••••"}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <IconButton onClick={toggleRecoveryCodeVisibility}>
                {showRecoveryCode ? <FaEyeSlash /> : <FaEye />}
              </IconButton>
            </Box>
            <Typography variant="caption" color="textSecondary">
              This code can reset your password once if you lose access. Keep it safe.
            </Typography> */}
          </Paper>

          {/* Subscription & Billing */}
          <Paper className="settings-section settings-card" style={{ "--card-index": 1 }}>
            <Typography variant="h6" gutterBottom>
              Subscription & Billing
            </Typography>
            <Box className="settings-subscription">
              <Typography>
                <strong>Current Plan:</strong> {subscription?.planName || "Free"}
              </Typography>
              <Typography>
                <strong>Expiry Date:</strong>{" "}
                {subscription?.expiry
                  ? new Date(subscription.expiry).toLocaleDateString()
                  : "N/A"}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/subscription")}
                sx={{ mt: 2, mb: 2 }}
              >
                Subscriptions
              </Button>
              <Typography variant="subtitle1" gutterBottom>
                Billing History
              </Typography>
              {billingHistory.length > 0 ? (
                <div className="billing-table-container">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Plan</TableCell>
                        <TableCell>Amount (₹)</TableCell>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billingHistory.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{record.plan}</TableCell>
                          <TableCell>{record.amount}</TableCell>
                          <TableCell>{record.orderId}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              size="small"
                              style={{ gap: '5px' }}
                              className="download-invoice-button"
                              onClick={() => handleDownloadInvoice(record)}
                            >
                              Invoice <FaDownload />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Typography>No billing history available.</Typography>
              )}
            </Box>
          </Paper>
        </div>

       {/* Feedback */}
  <Paper className="settings-section settings-card-full" style={{ "--card-index": 2 }}>
    <Typography variant="h6" gutterBottom>
      Feedback
    </Typography>
    <Box className="feedback-container">
      <Typography variant="body1">Rate your experience:</Typography>
      <Box className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`feedback-star ${rating >= star ? "selected" : ""}`}
            onClick={() => setRating(star)}
          >
            {rating >= star ? <FaStar /> : <FaRegStar />}
          </span>
        ))}
      </Box>
      <textarea
        className="feedback-textarea"
        placeholder="Share your feedback (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleFeedbackSubmit}
        disabled={!rating}
        style={{maxWidth: '200px'}}
      >
        Submit Feedback
      </Button>
    </Box>
  </Paper>

        {/* Data & Privacy */}
        <Paper className="settings-section settings-card-full" style={{ "--card-index": 3 }}>
          <Typography variant="h6" gutterBottom>
            Data & Privacy
          </Typography>
          <Typography>
            <a href="https://example.com/privacy-policy" target="_blank" rel="noopener">
              Privacy Policy
            </a>
          </Typography>
          <Typography>
            <a href="https://example.com/terms-of-service" target="_blank" rel="noopener">
              Terms of Service
            </a>
          </Typography>
        </Paper>
      </div>
    </DashboardLayout>
  );
};

export default Setting;