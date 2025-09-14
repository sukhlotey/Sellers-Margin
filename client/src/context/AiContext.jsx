import { createContext, useState } from "react";

export const AiContext = createContext();

export const AiProvider = ({ children }) => {
  const [results, setResults] = useState([]); // AI generated outputs
  const [loading, setLoading] = useState(false);

  return (
    <AiContext.Provider value={{ results, setResults, loading, setLoading }}>
      {children}
    </AiContext.Provider>
  );
};
