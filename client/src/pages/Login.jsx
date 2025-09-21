import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import "./pagesUI/Auth.css";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, TextField, Box, InputAdornment, IconButton } from "@mui/material";

const Login = () => {
  const { login } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openRecoveryModal, setOpenRecoveryModal] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const recoveryCode = await login(formData);
      showAlert("success", "User Logged in!");
      if (recoveryCode) {
        setRecoveryCode(recoveryCode);
        setOpenRecoveryModal(true);
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      showAlert("error", err.response?.data?.message || "Login failed. Please try again.");
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
    setOpenRecoveryModal(false);
    setIsLoading(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Logo />
          </div>
          <p>Sign in to access your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
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
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? <div className="spinner"></div> : "Sign In"}
          </Button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
          <p>
            Forgot your password? <Link to="/forgot-password">Reset it</Link>
          </p>
        </div>
      </div>

      {/* Recovery Code Modal */}
      <Dialog open={openRecoveryModal} onClose={handleModalClose}>
        <DialogTitle>Save Your New Recovery Code</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Save this new code in a safe place. It can reset your password once if you lose access to your account.
          </DialogContentText>
          <Typography variant="h6" align="center" sx={{ my: 2 }}>
            {recoveryCode}
          </Typography>
          <Button variant="contained" onClick={handleCopyCode} fullWidth>
            Copy Code
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;