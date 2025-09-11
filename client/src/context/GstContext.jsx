import { createContext, useState } from "react";

export const GstContext = createContext();

export const GstProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);

  return (
    <GstContext.Provider value={{ reports, setReports, summary, setSummary }}>
      {children}
    </GstContext.Provider>
  );
};
