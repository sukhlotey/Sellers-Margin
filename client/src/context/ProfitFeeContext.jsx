import { createContext, useState } from "react";

export const ProfitFeeContext = createContext();

export const ProfitFeeProvider = ({ children }) => {
  const [history, setHistory] = useState([]);       // single records
  const [bulkHistory, setBulkHistory] = useState([]); // bulk batches

  const addToHistory = (record) => {
    setHistory((prev) => [record, ...prev]);
  };

  return (
    <ProfitFeeContext.Provider
      value={{
        history, setHistory, addToHistory,
        bulkHistory, setBulkHistory
      }}
    >
      {children}
    </ProfitFeeContext.Provider>
  );
};
