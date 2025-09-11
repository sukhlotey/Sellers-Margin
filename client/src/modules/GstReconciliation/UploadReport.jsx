import { useContext, useState } from "react";
import { GstContext } from "../../context/GstContext";
import { AuthContext } from "../../context/AuthContext";
import { uploadSettlement } from "../../api/gstApi";

const UploadReport = () => {
  const { setSummary, setReports } = useContext(GstContext);
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadSettlement(formData, token);

      setSummary(res.data.summary);
      setReports((prev) => [res.data.report, ...prev]);

      alert("Report uploaded & processed successfully!");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      alert("Upload failed!");
    }
  };

  return (
    <div className="card">
      <h3>Upload Settlement Report</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload & Process</button>
    </div>
  );
};

export default UploadReport;
