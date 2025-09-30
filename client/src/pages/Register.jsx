import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { IoEyeOutline, IoEyeOffOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import { useAlert } from "../context/AlertContext";
import "./pagesUI/Auth.css";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, TextField, Box, InputAdornment, IconButton, Alert } from "@mui/material";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openRecoveryModal, setOpenRecoveryModal] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [nameError, setNameError] = useState(false);
  const [passwordLengthValid, setPasswordLengthValid] = useState(false);
  const [passwordSymbolValid, setPasswordSymbolValid] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" && value.length > 20) {
      setNameError(true);
      return; // Prevent typing more than 20 characters
    } else {
      setNameError(false);
    }

    if (name === "password") {
      setPasswordLengthValid(value.length >= 8);
      setPasswordSymbolValid(/[!@#$%^&*]/.test(value));
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const recoveryCode = await register(formData);
      showAlert("success", "User Registered!");
      setRecoveryCode(recoveryCode);
      setOpenRecoveryModal(true);
    } catch (err) {
      console.error("Registration error:", err);
      showAlert("error", err.response?.data?.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    showAlert("success", "Recovery code copied to clipboard!");
  };

  const handleModalClose = () => {
    const date = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
    const blob = new Blob([recoveryCode], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `sellersense-secretcode${date}.txt`);
    showAlert("success", "Recovery code downloaded as TXT!");
    setOpenRecoveryModal(false);
    setIsLoading(false);
    navigate("/dashboard", { replace: true });
  };

  const isFormValid = () => {
    return (
      formData.name.length <= 20 &&
      formData.email &&
      passwordLengthValid &&
      passwordSymbolValid
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Logo />
          </div>
          <p>Sign up to get started with our service</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <Box className="form-group">
            <TextField
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              fullWidth
              required
              error={nameError}
            />
            {nameError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Name cannot exceed 20 characters
              </Alert>
            )}
          </Box>
          
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
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
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
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !isFormValid()}
            fullWidth
          >
            {isLoading ? <div className="spinner"></div> : "Create Account"}
          </Button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <Dialog open={openRecoveryModal} onClose={handleModalClose}>
        <DialogTitle>Save Your Recovery Code</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Save this code in a safe place. It can reset your password once if you lose access to your account.
          </DialogContentText>
          <Typography variant="h6" align="center" sx={{ my: 2 }}>
            {recoveryCode}
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
  );
};

export default Register;