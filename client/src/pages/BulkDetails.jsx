import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MdOutlineArrowBack } from "react-icons/md";
import { FiDownload } from "react-icons/fi";

const BulkDetails = ({ batch, onBack }) => {
  const records = batch.records || [];

const formatNumber = (value) => (typeof value === "number" && !isNaN(value) ? value.toFixed(2) : "N/A");

const downloadPDF = () => {
  const doc = new jsPDF();
  doc.text(
    `Bulk Upload Report (${batch.fileName || "Untitled"} - ${new Date(batch.createdAt).toLocaleString()})`,
    14,
    10
  );

  const tableData = records.map((item) => [
    item.productName || "N/A",
    formatNumber(item.sellingPrice),
    formatNumber(item.costPrice),
    formatNumber(item.commissionFee),
    formatNumber(item.gstTax),
    formatNumber(item.shippingCost),
    formatNumber(item.adCost),
    item.weight ?? "N/A",
    item.category || "N/A",
    formatNumber(item.profit),
    formatNumber(item.breakEvenPrice),
    formatNumber(item.commissionPercent),
    formatNumber(item.gstPercent),
  ]);

  autoTable(doc, {
    head: [
      [
        "Product",
        "SP",
        "CP",
        "Comm. Fee",
        "GST Tax",
        "Shipping",
        "Ad Cost",
        "Weight (g)",
        "Category",
        "Profit",
        "Break Even",
        "Comm. %",
        "GST %",
      ],
    ],
    body: tableData,
    styles: { fontSize: 8, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 25 }, // Product
      1: { cellWidth: 12 }, // SP
      2: { cellWidth: 12 }, // CP
      3: { cellWidth: 12 }, // Comm. Fee
      4: { cellWidth: 12 }, // GST Tax
      5: { cellWidth: 12 }, // Shipping
      6: { cellWidth: 12 }, // Ad Cost
      7: { cellWidth: 12 }, // Weight
      8: { cellWidth: 15 }, // Category
      9: { cellWidth: 12 }, // Profit
      10: { cellWidth: 12 }, // Break Even
      11: { cellWidth: 12 }, // Comm. %
      12: { cellWidth: 12 }, // GST %
    },
    margin: { top: 20, left: 10, right: 10 },
  });

  doc.save(`${batch.fileName || "bulk_report"}.pdf`);
};

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      records.map((item) => ({
        Product: item.productName,
        SellingPrice: item.sellingPrice.toFixed(2),
        CostPrice: item.costPrice.toFixed(2),
        CommissionFee: item.commissionFee.toFixed(2),
        GSTTax: item.gstTax.toFixed(2),
        ShippingCost: item.shippingCost.toFixed(2),
        AdCost: item.adCost.toFixed(2),
        Weight: item.weight,
        Category: item.category,
        Profit: item.profit.toFixed(2),
        BreakEvenPrice: item.breakEvenPrice.toFixed(2),
        CommissionPercent: item.commissionPercent.toFixed(2),
        GSTPercent: item.gstPercent.toFixed(2),
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
    <div className="bulk-details-header">

    <button className="goback" onClick={onBack}>
      <MdOutlineArrowBack />
    </button>
    <h3>Bulk Details</h3>
    </div>
    <p>
      <strong>File:</strong> {batch.fileName || "Untitled"}
    </p>
    <p>
      <strong>Uploaded on:</strong> {new Date(batch.createdAt).toLocaleString()}
    </p>
    <p>
      <strong>Total Records:</strong> {records.length}
    </p>

    <div className="bulk-actions">
      <button className="download-btn" onClick={downloadPDF}>
        <FiDownload /> Download PDF
      </button>
      <button className="download-btn" onClick={downloadExcel}>
        <FiDownload /> Download Excel
      </button>
    </div>

    <div className="table-responsive table-scrollable">
      <table className="table table-bordered table-sm">
        <thead className="table-light">
          <tr>
            <th>Product</th>
            <th>SP (₹)</th>
            <th>CP (₹)</th>
            <th>Comm. Fee (₹)</th>
            <th>GST Tax (₹)</th>
            <th>Shipping (₹)</th>
            <th>Ad Cost (₹)</th>
            <th>Weight (g)</th>
            <th>Category</th>
            <th>Profit (₹)</th>
            <th>Break Even (₹)</th>
            <th>Comm. %</th>
            <th>GST %</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item) => (
            <tr key={item._id} className={item.profit >= 0 ? "table-success" : "table-danger"}>
              <td>{item.productName}</td>
              <td>{formatNumber(item.sellingPrice)}</td>
              <td>{formatNumber(item.costPrice)}</td>
              <td>{formatNumber(item.commissionFee)}</td>
              <td>{formatNumber(item.gstTax)}</td>
              <td>{formatNumber(item.shippingCost)}</td>
              <td>{formatNumber(item.adCost)}</td>
              <td>{item.weight ?? "N/A"}</td>
              <td>{item.category}</td>
              <td>{formatNumber(item.profit)}</td>
              <td>{formatNumber(item.breakEvenPrice)}</td>
              <td>{formatNumber(item.commissionPercent)}</td>
              <td>{formatNumber(item.gstPercent)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={9}></td>
            <td>
              <strong>Total Profit: ₹{records.reduce((sum, item) => sum + (typeof item.profit === "number" && !isNaN(item.profit) ? item.profit : 0), 0).toFixed(2)}</strong>
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);
};

export default BulkDetails;