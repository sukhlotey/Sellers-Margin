import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useAlert } from "../context/AlertContext"; // Added import
import "./pagesUI/Auth.css";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography } from "@mui/material";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
    const { showAlert } = useAlert(); // Added useAlert
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
      const recoveryCode = await register(formData);
      showAlert("success", "User Registered!");
      setRecoveryCode(recoveryCode);
      setOpenRecoveryModal(true);

    } catch (err) {
      console.error("Registration error:", err);
      showAlert(err.response?.data?.message || "Registration failed. Please try again.");
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
          <p>Sign up to get started with our service</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name"
              name="name" 
              placeholder="Enter your full name" 
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              placeholder="Enter your email" 
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
              />
              <span className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </span>
            </div>
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Recovery Code Modal */}
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
          <Button onClick={handleModalClose}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Register;