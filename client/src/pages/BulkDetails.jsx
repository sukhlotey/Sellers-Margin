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
      formatNumber(item.importDuties),
      item.platform || "N/A",
      formatNumber(item.commissionFee),
      formatNumber(item.closingFee),
      formatNumber(item.fulfillmentFee),
      formatNumber(item.gstOnFees),
      formatNumber(item.outputGST),
      formatNumber(item.inputGSTCredit),
      formatNumber(item.netGSTRemitted),
      formatNumber(item.netPayout),
      formatNumber(item.shippingCost),
      formatNumber(item.adCost),
      item.weight ?? "N/A",
      item.category || "N/A",
      item.fulfillmentType || "N/A",
      formatNumber(item.profit),
      formatNumber(item.breakEvenPrice),
    ]);

    autoTable(doc, {
      head: [
        [
          "Product",
          "SP",
          "CP",
          "Import Duties",
          "Platform",
          "Comm. Fee",
          batch.platform === "Amazon" ? "Closing Fee" : "Collection Fee",
          "Fulfillment Fee",
          "GST on Fees",
          "Output GST",
          "Input GST Credit",
          "Net GST Remitted",
          "Net Payout",
          "Shipping",
          "Ad Cost",
          "Weight (g)",
          "Category",
          "Fulfillment Type",
          "Profit",
          "Break Even",
        ],
      ],
      body: tableData,
      styles: { fontSize: 8, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 25 }, // Product
        1: { cellWidth: 10 }, // SP
        2: { cellWidth: 10 }, // CP
        3: { cellWidth: 10 }, // Import Duties
        4: { cellWidth: 10 }, // Platform
        5: { cellWidth: 10 }, // Comm. Fee
        6: { cellWidth: 10 }, // Closing/Collection Fee
        7: { cellWidth: 10 }, // Fulfillment Fee
        8: { cellWidth: 10 }, // GST on Fees
        9: { cellWidth: 10 }, // Output GST
        10: { cellWidth: 10 }, // Input GST Credit
        11: { cellWidth: 10 }, // Net GST Remitted
        12: { cellWidth: 10 }, // Net Payout
        13: { cellWidth: 10 }, // Shipping
        14: { cellWidth: 10 }, // Ad Cost
        15: { cellWidth: 10 }, // Weight
        16: { cellWidth: 10 }, // Category
        17: { cellWidth: 10 }, // Fulfillment Type
        18: { cellWidth: 10 }, // Profit
        19: { cellWidth: 10 }, // Break Even
      },
      margin: { top: 20, left: 5, right: 5 },
    });

    doc.save(`${batch.fileName || "bulk_report"}.pdf`);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      records.map((item) => ({
        Product: item.productName,
        SellingPrice: formatNumber(item.sellingPrice),
        CostPrice: formatNumber(item.costPrice),
        ImportDuties: formatNumber(item.importDuties),
        Platform: item.platform,
        CommissionFee: formatNumber(item.commissionFee),
        [batch.platform === "Amazon" ? "ClosingFee" : "CollectionFee"]: formatNumber(item.closingFee),
        FulfillmentFee: formatNumber(item.fulfillmentFee),
        GSTOnFees: formatNumber(item.gstOnFees),
        OutputGST: formatNumber(item.outputGST),
        InputGSTCredit: formatNumber(item.inputGSTCredit),
        NetGSTRemitted: formatNumber(item.netGSTRemitted),
        NetPayout: formatNumber(item.netPayout),
        ShippingCost: formatNumber(item.shippingCost),
        AdCost: formatNumber(item.adCost),
        Weight: item.weight,
        Category: item.category,
        FulfillmentType: item.fulfillmentType,
        Profit: formatNumber(item.profit),
        BreakEvenPrice: formatNumber(item.breakEvenPrice),
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
              <th>Import Duties (₹)</th>
              <th>Platform</th>
              <th>Comm. Fee (₹)</th>
              <th>{batch.platform === "Amazon" ? "Closing Fee" : "Collection Fee"} (₹)</th>
              <th>Fulfillment Fee (₹)</th>
              <th>GST on Fees (₹)</th>
              <th>Output GST (₹)</th>
              <th>Input GST Credit (₹)</th>
              <th>Net GST Remitted (₹)</th>
              <th>Net Payout (₹)</th>
              <th>Shipping (₹)</th>
              <th>Ad Cost (₹)</th>
              <th>Weight (g)</th>
              <th>Category</th>
              <th>Fulfillment Type</th>
              <th>Profit (₹)</th>
              <th>Break Even (₹)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item._id} className={item.profit >= 0 ? "table-success" : "table-danger"}>
                <td>{item.productName}</td>
                <td>{formatNumber(item.sellingPrice)}</td>
                <td>{formatNumber(item.costPrice)}</td>
                <td>{formatNumber(item.importDuties)}</td>
                <td>{item.platform}</td>
                <td>{formatNumber(item.commissionFee)}</td>
                <td>{formatNumber(item.closingFee)}</td>
                <td>{formatNumber(item.fulfillmentFee)}</td>
                <td>{formatNumber(item.gstOnFees)}</td>
                <td>{formatNumber(item.outputGST)}</td>
                <td>{formatNumber(item.inputGSTCredit)}</td>
                <td>{formatNumber(item.netGSTRemitted)}</td>
                <td>{formatNumber(item.netPayout)}</td>
                <td>{formatNumber(item.shippingCost)}</td>
                <td>{formatNumber(item.adCost)}</td>
                <td>{item.weight ?? "N/A"}</td>
                <td>{item.category}</td>
                <td>{item.fulfillmentType}</td>
                <td>{formatNumber(item.profit)}</td>
                <td>{formatNumber(item.breakEvenPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={18}></td>
              <td>
                <strong>Total Profit: ₹{records.reduce((sum, item) => sum + (typeof item.profit === "number" && !isNaN(item.profit) ? item.profit : 0), 0).toFixed(2)}</strong>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BulkDetails;