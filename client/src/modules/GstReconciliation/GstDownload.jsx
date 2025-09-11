import { useContext } from "react";
import { GstContext } from "../../context/GstContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const GstDownload = () => {
  const { reports } = useContext(GstContext);

  const downloadExcel = () => {
    if (reports.length === 0) return alert("No reports available!");

    const ws = XLSX.utils.json_to_sheet(reports);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "gst_reports.xlsx");
  };

  return (
    <div className="card">
      <h3>Download Reports</h3>
      <button onClick={downloadExcel}>Export to Excel</button>
    </div>
  );
};

export default GstDownload;
