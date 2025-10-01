import { createContext, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [preferences, setPreferences] = useState({
    currency: "INR",
    notifications: "email",
  });

  const updatePreferences = async (newPreferences) => {
    try {
      const res = await axios.put(
        "https://sellers-sense.onrender.com/api/auth/preferences",
        newPreferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreferences(res.data.preferences);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};