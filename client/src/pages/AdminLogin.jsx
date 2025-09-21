import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Typography, Box } from "@mui/material";
import "./pagesUI/Auth.css";
import Logo from "../components/Logo";

const AdminLogin = () => {
  const { adminLogin } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    favoriteColor: "",
    favoriteCharacter: "",
    secretCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminLogin(formData);
      showAlert("success", "Admin login successful!");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      showAlert("error", err.response?.data?.message || "Admin login failed. Please try again.");
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
          <Typography variant="h6">Admin Login</Typography>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <Box className="form-group">
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>
          <Box className="form-group">
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>
          <Box className="form-group">
            <TextField
              label="Favorite Color"
              name="favoriteColor"
              value={formData.favoriteColor}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>
          <Box className="form-group">
            <TextField
              label="Favorite Fictional Character"
              name="favoriteCharacter"
              value={formData.favoriteCharacter}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>
          <Box className="form-group">
            <TextField
              label="Secret Code"
              name="secretCode"
              value={formData.secretCode}
              onChange={handleChange}
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
            {isLoading ? <div className="spinner"></div> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;