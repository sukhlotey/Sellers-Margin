import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const BulkDetails = ({ batch, onBack }) => {
  const records = batch.records || [];

  // 📄 Download as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Bulk Upload Report (${new Date(batch.createdAt).toLocaleString()})`, 14, 10);

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

    doc.save("bulk_report.pdf");
  };

  // 📊 Download as Excel
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
    saveAs(data, "bulk_report.xlsx");
  };

  return (
    <div className="bulk-details">
      <button onClick={onBack}>⬅ Back</button>
      <h3>📊 Bulk Details</h3>
      <p><strong>Uploaded on:</strong> {new Date(batch.createdAt).toLocaleString()}</p>
      <p><strong>Total Records:</strong> {records.length}</p>

      <div className="bulk-actions">
        <button onClick={downloadPDF}>Download PDF</button>
        <button onClick={downloadExcel}>Download Excel</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Selling Price</th>
            <th>Cost Price</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item, idx) => (
            <tr key={idx}>
              <td>{item.productName}</td>
              <td>{item.sellingPrice}</td>
              <td>{item.costPrice}</td>
              <td>{item.profit?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BulkDetails;
