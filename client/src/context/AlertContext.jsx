import { createContext, useContext, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({ open: false, severity: 'success', message: '' });

  const showAlert = (severity, message) => {
    setAlert({ open: true, severity, message });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, open: false }));
    }, 5000);
  };

  const handleClose = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      <Snackbar
        open={alert.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={5000}
        onClose={handleClose}
      >
        <Alert
          className="gst-toast-alert"
          severity={alert.severity}
          color={alert.severity}
          onClose={handleClose}
        >
          <AlertTitle>{alert.severity === 'success' ? 'Success' : 'Error'}</AlertTitle>
          {alert.message}
        </Alert>
      </Snackbar>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);