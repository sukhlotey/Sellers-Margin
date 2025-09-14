import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ProfitFeeProvider } from "./context/ProfitFeeContext";
import { GstProvider } from "./context/GstContext";
import { AlertProvider } from "./context/AlertContext"; // Import AlertProvider
import { AiProvider } from "./context/AiContext"; // Import AiProvider
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfitFeeCalculator from "./pages/ProfitFeeCalculator";
import GstSettlementPage from "./pages/GstSettlementPage";
import AiOptimizerPage from "./pages/AiOptimizerPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ProfitFeeProvider>
        <GstProvider>
          <AlertProvider> {/* Wrap all routes with AlertProvider */}
                      <AiProvider>

            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profit-fee"
                  element={
                    <PrivateRoute>
                      <ProfitFeeCalculator />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/gst-settlement"
                  element={
                    <PrivateRoute>
                      <GstSettlementPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ai-optimizer"
                  element={<PrivateRoute><AiOptimizerPage /></PrivateRoute>}
                />


                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Router>
            </AiProvider>
          </AlertProvider>
        </GstProvider>
      </ProfitFeeProvider>
    </AuthProvider>
  );
}

export default App;