import { createContext, useState } from "react";

export const GstContext = createContext();

export const GstProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
const deleteFromReports = (batchIds) => {
    setReports((prev) => prev.filter((report) => !batchIds.includes(report._id)));
  };
  return (
    <GstContext.Provider value={{ reports, setReports, summary, setSummary,deleteFromReports }}>
      {children}
    </GstContext.Provider>
  );
};
