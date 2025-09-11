import { createContext, useState } from "react";

export const ProfitFeeContext = createContext();

export const ProfitFeeProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [bulkHistory, setBulkHistory] = useState([]);

  // Add new record locally after save
  const addToHistory = (record) => {
    setHistory((prev) => [record, ...prev]); // prepend new record
  };
  const deleteFromBulkHistory = (batchIds) => {
    setBulkHistory((prev) => prev.filter((batch) => !batchIds.includes(batch._id)));
  };
  return (
    <ProfitFeeContext.Provider
      value={{ history, setHistory, addToHistory, bulkHistory, setBulkHistory, deleteFromBulkHistory }}
    >
      {children}
    </ProfitFeeContext.Provider>
  );
};
