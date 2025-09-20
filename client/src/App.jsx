import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ProfitFeeProvider } from "./context/ProfitFeeContext";
import { GstProvider } from "./context/GstContext";
import { AlertProvider } from "./context/AlertContext"; // Import AlertProvider
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfitFeeCalculator from "./pages/ProfitFeeCalculator";
import GstSettlementPage from "./pages/GstSettlementPage";
import Plans from "./modules/Subscription/Plans";
import PaymentPage from "./modules/Subscription/PaymentPage";
import Loading from "./components/Loading";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import Setting from "./pages/Setting";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ProfitFeeProvider>
        <GstProvider>
          <SubscriptionProvider>
            <AlertProvider> {/* Wrap all routes with AlertProvider */}
              <Router>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected routes */}
                  <Route
                    path="/subscription"
                    element={
                      <PrivateRoute>
                        <Plans />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/payment"
                    element={
                      <PrivateRoute>
                        <PaymentPage />
                      </PrivateRoute>
                    }
                  />
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
                  <Route path="/settings" element={<PrivateRoute><Setting /></PrivateRoute>} />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Router>
            </AlertProvider>
          </SubscriptionProvider>
        </GstProvider>
      </ProfitFeeProvider>
    </AuthProvider>
  );
}

export default App;