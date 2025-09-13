import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import "./pagesUI/Auth.css";

const Register = () => {
  const { user, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData);
      navigate("/dashboard", { replace: true }); // Use replace to avoid adding to history
    } catch (err) {
      console.error("Registration error:", err); // Log error for debugging
      alert(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
           <div style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
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
    </div>
  );
};

export default Register;