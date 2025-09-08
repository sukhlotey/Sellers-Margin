import { createContext, useState } from "react";

export const ProfitFeeContext = createContext();

export const ProfitFeeProvider = ({ children }) => {
  const [history, setHistory] = useState([]);

  // Add new record locally after save
  const addToHistory = (record) => {
    setHistory((prev) => [record, ...prev]); // prepend new record
  };

  return (
    <ProfitFeeContext.Provider value={{ history, setHistory, addToHistory }}>
      {children}
    </ProfitFeeContext.Provider>
  );
};
