import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MdOutlineArrowBack } from "react-icons/md";
import { FiDownload } from "react-icons/fi";

const BulkDetails = ({ batch, onBack }) => {
  const records = batch.records || [];

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Bulk Upload Report (${batch.fileName || "Untitled"} - ${new Date(batch.createdAt).toLocaleString()})`, 14, 10);

    const tableData = records.map((item) => [
      item.productName,
      item.sellingPrice,
      item.costPrice,
      item.profit?.toFixed(2),
    ]);

    autoTable(doc, {
      head: [["Product", "SP", "CP", "Profit"]],
      body: tableData,
    });

    doc.save(`${batch.fileName || "bulk_report"}.pdf`);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      records.map((item) => ({
        Product: item.productName,
        SellingPrice: item.sellingPrice,
        CostPrice: item.costPrice,
        Profit: item.profit?.toFixed(2),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BulkRecords");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `${batch.fileName || "bulk_report"}.xlsx`);
  };

  return (
    <div className="bulk-details">
      <button className="goback" onClick={onBack}><MdOutlineArrowBack/></button>
      <h3>Bulk Details</h3>
      <p><strong>File:</strong> {batch.fileName || "Untitled"}</p>
      <p><strong>Uploaded on:</strong> {new Date(batch.createdAt).toLocaleString()}</p>
      <p><strong>Total Records:</strong> {records.length}</p>

      <div className="bulk-actions">
        <button className="download-btn" onClick={downloadPDF}><FiDownload/>Download PDF</button>
        <button className="download-btn" onClick={downloadExcel}><FiDownload/>Download Excel</button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>Selling Price</th>
              <th>Cost Price</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item._id}>
                <td>{item.productName}</td>
                <td>{item.sellingPrice}</td>
                <td>{item.costPrice}</td>
                <td className={item.profit >= 0 ? "text-success" : "text-danger"}>
                  ₹{item.profit?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkDetails;