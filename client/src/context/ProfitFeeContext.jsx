import { createContext, useState } from "react";

export const ProfitFeeContext = createContext();

export const ProfitFeeProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [bulkHistory, setBulkHistory] = useState([]);

  const addToHistory = (record) => {
    setHistory((prev) => [record, ...prev]);
  };
  const deleteFromBulkHistory = (batchIds) => {
    setBulkHistory((prev) => prev.filter((batch) => !batchIds.includes(batch._id)));
  };
    const deleteFromHistory = (recordIds) => {
    setHistory((prev) => prev.filter((record) => !recordIds.includes(record._id)));
  };
  return (
    <ProfitFeeContext.Provider
      value={{ history, setHistory, addToHistory, bulkHistory, setBulkHistory, deleteFromBulkHistory, deleteFromHistory }}
    >
      {children}
    </ProfitFeeContext.Provider>
  );
};