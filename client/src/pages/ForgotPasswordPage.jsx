import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { validateRecoveryCode, resetPassword } from "../api/authApi";
import { Alert, Button, TextField, Typography, Box } from "@mui/material";
import Logo from "../components/Logo";
import "./pagesUI/Auth.css";

const ForgotPasswordPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    recoveryCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (user) {
    navigate("/dashboard", { replace: true });
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleValidateCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await validateRecoveryCode({
        email: formData.email,
        recoveryCode: formData.recoveryCode,
      });
      setUserId(res.data.userId);
      setStep(2);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to validate recovery code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      await resetPassword({
        userId,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setError(null);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Logo />
          </div>
          <Typography variant="h6">
            {step === 1 ? "Recover Your Account" : "Reset Your Password"}
          </Typography>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 1 ? (
          <form onSubmit={handleValidateCode} className="auth-form">
            <Box className="form-group">
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                fullWidth
                required
              />
            </Box>
            <Box className="form-group">
              <TextField
                label="Recovery Code"
                name="recoveryCode"
                type="text"
                value={formData.recoveryCode}
                onChange={handleChange}
                placeholder="Enter your recovery code (e.g., 9X7F-A23K-TY88)"
                fullWidth
                required
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? <div className="spinner"></div> : "Validate Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <Box className="form-group">
              <TextField
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                fullWidth
                required
              />
            </Box>
            <Box className="form-group">
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                fullWidth
                required
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? <div className="spinner"></div> : "Reset Password"}
            </Button>
          </form>
        )}

        <div className="auth-footer">
          <Typography>
            Remember your password? <Link to="/login">Sign in</Link>
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;