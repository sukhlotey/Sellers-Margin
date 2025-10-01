import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { SubscriptionContext } from "../context/SubscriptionContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { validateRecoveryCode, resetPassword } from "../api/authApi";
import { Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, Box, Paper, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,InputAdornment,IconButton } from "@mui/material";
import { saveAs } from "file-saver";
import "./pagesUI/Settings.css";
import DashboardLayout from "../layout/DashboardLayout";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import jsPDF from "jspdf";
import { FaDownload, FaStar, FaRegStar } from "react-icons/fa";
import logo from "../assets/sellersense1.png";

const Setting = () => {
  const { user, token,logout} = useContext(AuthContext);
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
  const [charCount, setCharCount] = useState(0);
  const [billingHistory, setBillingHistory] = useState([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [forgotPasswordData, setForgotPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [newRecoveryCode, setNewRecoveryCode] = useState("");
  const [openRecoveryModal, setOpenRecoveryModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false });
  const [passwordLengthValid, setPasswordLengthValid] = useState(false);
  const [passwordSymbolValid, setPasswordSymbolValid] = useState(false);
   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  // Fetch billing history
  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        const res = await axios.get("https://sellers-sense.onrender.com/api/subscription/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBillingHistory(res.data);
      } catch (err) {
        console.error("Error fetching billing history:", err);
        showAlert("error", "Failed to load billing history.");
      }
    };
    if (token && user) {
      fetchBillingHistory();
    }
  }, [token,user,showAlert]);

  // Handle password change input
  const handlePasswordChange = (e) => {
     const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (name === "newPassword") {
      setPasswordLengthValid(value.length >= 8);
      setPasswordSymbolValid(/[!@#$%^&*]/.test(value));
    }
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
    if (!passwordLengthValid || !passwordSymbolValid) {
      showAlert("error", "New password must be at least 8 characters and include a special symbol.");
      return;
    }
    try {
      await axios.post(
        "https://sellers-sense.onrender.com/api/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("success", "Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordLengthValid(false);
      setPasswordSymbolValid(false);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to change password.");
    }
  };

  // Handle forgot password input
  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData({ ...forgotPasswordData, [name]: value });
    if (name === "newPassword") {
      setPasswordLengthValid(value.length >= 8);
      setPasswordSymbolValid(/[!@#$%^&*]/.test(value));
    }
  };

  const isPasswordFormValid = () => {
    return (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.confirmPassword &&
      passwordLengthValid &&
      passwordSymbolValid
    );
  };
  // Handle secret code input
  const handleSecretCodeChange = (e) => {
    setSecretCode(e.target.value);
  };

  // Submit forgot password
   const handleForgotPasswordSubmit = async () => {
    const { newPassword, confirmPassword } = forgotPasswordData;
    if (!secretCode) {
      showAlert("error", "Secret code is required.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      showAlert("error", "New password and confirm password are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("error", "New passwords do not match.");
      return;
    }
    if (!passwordLengthValid || !passwordSymbolValid) {
      showAlert("error", "New password must be at least 8 characters and include a special symbol.");
      return;
    }
    try {
      // Validate secret code
      const res = await validateRecoveryCode({ email: user.email, recoveryCode: secretCode });
      // Reset password
      const resetRes = await resetPassword({ 
        userId: res.data.userId, 
        newPassword, 
        confirmPassword,
        source: "settings"
      });
      showAlert("success", "Password reset successfully!");
      setNewRecoveryCode(resetRes.data.recoveryCode || "");
      setOpenRecoveryModal(true);
      setSecretCode("");
      setForgotPasswordData({ newPassword: "", confirmPassword: "" });
      setPasswordLengthValid(false);
      setPasswordSymbolValid(false);
      setShowForgotPassword(false);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to reset password.");
    }
  };

  const isForgotPasswordFormValid = () => {
    return (
      secretCode &&
      forgotPasswordData.newPassword &&
      forgotPasswordData.confirmPassword &&
      passwordLengthValid &&
      passwordSymbolValid
    );
  };

  // Handle copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(newRecoveryCode);
    showAlert("success", "Recovery code copied to clipboard!");
  };

  // Handle modal close
  const handleModalClose = () => {
     const date = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
    const blob = new Blob([newRecoveryCode], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `sellersense-secretcode${date}.txt`);
    showAlert("success", "Recovery code downloaded as TXT!");
    setOpenRecoveryModal(false);
    setNewRecoveryCode("");
  };

  // Handle feedback input
  const handleFeedbackChange = (e) => {
    const input = e.target.value;
    const nonWhitespaceCount = input.replace(/\s/g, "").length;
    if (nonWhitespaceCount <= 200) {
      setFeedback(input);
      setCharCount(nonWhitespaceCount);
    }
  };

  // Submit feedback
  const handleFeedbackSubmit = async () => {
    const nonWhitespaceCount = feedback.replace(/\s/g, "").length;
    if (nonWhitespaceCount > 200) {
      showAlert("error", "Feedback exceeds 200 non-whitespace characters.");
      return;
    }
    if (!rating) {
      showAlert("error", "Rating is required.");
      return;
    }
    try {
      await axios.post(
        "https://sellers-sense.onrender.com/api/feedback/submit",
        { rating, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("success", "Thank you for your feedback!");
      setRating(0);
      setFeedback("");
      setCharCount(0);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to submit feedback.");
    }
  };

  // Download invoice as PDF
  const handleDownloadInvoice = (subscription) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Subscription Invoice", 105, 40, { align: "center" });
      doc.setFontSize(12);
      doc.addImage(logo, "PNG", 20, 10, 20, 20);
      doc.text("Seller Sense", 20, 55);
      doc.text("Email: sellersense.services@gmail.com", 20, 63);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 71);

      // Billed To
      doc.setFontSize(14);
      doc.text("Billed To:", 20, 95);
      doc.setFontSize(12);
      doc.text(user.name, 20, 105);
      doc.text(user.email, 20, 113);

      // Table Header
      doc.setFontSize(12);
      doc.setFillColor(43, 108, 176);
      doc.rect(20, 135, 170, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Description", 25, 142);
      doc.text("Details", 100, 142);
      doc.setTextColor(0, 0, 0);

      // Table Content
      const planNameMap = {
        basic_monthly: "Basic Monthly",
        all_monthly: "All Modules Monthly",
        annual: "Annual",
      };
      const tableData = [
        ["Plan", planNameMap[subscription.plan] || subscription.plan],
        ["Amount", `${subscription.amount} rs`],
        ["Payment ID", subscription.paymentId],
        ["Order ID", subscription.orderId],
        ["Start Date", new Date(subscription.startDate).toLocaleDateString()],
        ["End Date", new Date(subscription.endDate).toLocaleDateString()],
      ];

      let y = 150;
      tableData.forEach(([desc, detail]) => {
        doc.text(desc, 25, y);
        doc.text(detail, 100, y);
        y += 10;
      });

      // Draw table lines
      doc.setDrawColor(0);
      doc.rect(20, 145, 170, y - 140);
      for (let i = 0; i < tableData.length; i++) {
        doc.line(20, 145 + i * 10, 190, 145 + i * 10);
      }
      doc.line(95, 135, 95, y - 5);

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

  const handleDeleteAccount = () => {
    setDeleteDialog({ open: true });
  };

  // Confirm account deletion
  const confirmDeleteAccount = async () => {
    try {
      await axios.delete("https://sellers-sense.onrender.com/api/auth/delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      showAlert("success", "Account deleted successfully!");
      logout();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false });
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleForgotNewPasswordVisibility = () => {
    setShowForgotNewPassword(!showForgotNewPassword);
  };

  const toggleForgotConfirmPasswordVisibility = () => {
    setShowForgotConfirmPassword(!showForgotConfirmPassword);
  };

  return (
    <DashboardLayout>
      <div className="settings-container">
        <Typography variant="h4" gutterBottom>
          Account
        </Typography>

        <div className="settings-top-row">
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
              {showForgotPassword ? (
                <>
                  <TextField
                    label="Secret Code"
                    value={secretCode}
                    onChange={handleSecretCodeChange}
                    placeholder="Enter your recovery code (e.g., 9X7F-A23K-TY88)"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="New Password"
                    name="newPassword"
                    type={showForgotNewPassword ? "text" : "password"}
                    value={forgotPasswordData.newPassword}
                    onChange={handleForgotPasswordChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={toggleForgotNewPasswordVisibility} edge="end">
                            {showForgotNewPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      color={passwordLengthValid ? "success.main" : "textSecondary"}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      {passwordLengthValid ? <IoCheckmarkCircleOutline style={{ marginRight: 8 }} /> : <IoCloseCircleOutline style={{ marginRight: 8 }} />}
                      Minimum 8 characters
                    </Typography>
                    <Typography
                      variant="caption"
                      color={passwordSymbolValid ? "success.main" : "textSecondary"}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      {passwordSymbolValid ? <IoCheckmarkCircleOutline style={{ marginRight: 8 }} /> : <IoCloseCircleOutline style={{ marginRight: 8 }} />}
                      Include special symbol
                    </Typography>
                  </Box>
                  <TextField
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showForgotConfirmPassword ? "text" : "password"}
                    value={forgotPasswordData.confirmPassword}
                    onChange={handleForgotPasswordChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={toggleForgotConfirmPasswordVisibility} edge="end">
                            {showForgotConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleForgotPasswordSubmit}
                    disabled={!isForgotPasswordFormValid()}
                    sx={{ mt: 2 }}
                    style={{ maxWidth: "200px" }}
                  >
                    Reset Password
                  </Button>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ mt: 1, cursor: "pointer" }}
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to Change Password
                  </Typography>
                </>
              ) : (
                <>
                  <TextField
                    label="Current Password"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={toggleCurrentPasswordVisibility} edge="end">
                            {showCurrentPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ mt: 1, cursor: "pointer" }}
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Current Password?
                  </Typography>
                  <TextField
                    label="New Password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={toggleNewPasswordVisibility} edge="end">
                            {showNewPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      color={passwordLengthValid ? "success.main" : "textSecondary"}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      {passwordLengthValid ? <IoCheckmarkCircleOutline style={{ marginRight: 8 }} /> : <IoCloseCircleOutline style={{ marginRight: 8 }} />}
                      Minimum 8 characters
                    </Typography>
                    <Typography
                      variant="caption"
                      color={passwordSymbolValid ? "success.main" : "textSecondary"}
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      {passwordSymbolValid ? <IoCheckmarkCircleOutline style={{ marginRight: 8 }} /> : <IoCloseCircleOutline style={{ marginRight: 8 }} />}
                      Include special symbol
                    </Typography>
                  </Box>
                  <TextField
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                            {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleChangePassword}
                    disabled={!isPasswordFormValid()}
                    sx={{ mt: 2 }}
                    style={{ maxWidth: "200px" }}
                  >
                    Change Password
                  </Button>
                </>
              )}
            </Box>
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
                              style={{ gap: "5px" }}
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
              onChange={handleFeedbackChange}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
              <Typography variant="caption" color={charCount >= 200 ? "error" : "textSecondary"}>
                {charCount}/200
              </Typography>
              {charCount >= 200 && (
                <Alert severity="warning" sx={{ backgroundColor: "#fff3cd", color: "#856404", py: 0.5 }}>
                  Feedback has reached the 200-character limit (excluding whitespace).
                </Alert>
              )}
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFeedbackSubmit}
              disabled={!rating}
              style={{ maxWidth: "200px", mt: 2 }}
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
            <a href="/privacypolicy.pdf" target="_blank" rel="noopener">
              Privacy Policy
            </a>
          </Typography>
          <Typography>
            <a href="/termsofseller.pdf" target="_blank" rel="noopener">
              Terms of Service
            </a>
          </Typography>
           <Button
    variant="contained"
    color="error"
    onClick={handleDeleteAccount}
    sx={{ mt: 2, maxWidth: "200px" }}
  >
    Delete Account
  </Button>
  <Dialog
    open={deleteDialog.open}
    onClose={handleCloseDeleteDialog}
    aria-labelledby="delete-account-dialog-title"
    aria-describedby="delete-account-dialog-description"
  >
    <DialogTitle id="delete-account-dialog-title">Delete Account</DialogTitle>
    <DialogContent>
      <DialogContentText id="delete-account-dialog-description">
        Are you sure you want to delete your account? This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCloseDeleteDialog} color="primary">
        Cancel
      </Button>
      <Button onClick={confirmDeleteAccount} color="error" autoFocus>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
        </Paper>

        <Dialog open={openRecoveryModal} onClose={handleModalClose}>
          <DialogTitle>Save Your New Recovery Code</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Save this code in a safe place. It can reset your password once if you lose access to your account.
            </DialogContentText>
            <Typography variant="h6" align="center" sx={{ my: 2 }}>
              {newRecoveryCode}
            </Typography>
            <Button variant="contained" onClick={handleCopyCode} fullWidth>
              Copy Code
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Confirm & Download</Button>
          </DialogActions>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Setting;