import { useState,useContext  } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { AuthContext } from "../context/AuthContext";
import { ProfitFeeContext } from "../context/ProfitFeeContext";
import axios from "axios";
const BulkUploadModal = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);

  // global override %
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [gstPercent, setGstPercent] = useState(18);

  const { token } = useContext(AuthContext);
  const { setBulkHistory } = useContext(ProfitFeeContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData([]);
    setCalculatedData([]);
    console.log("Selected file:", e.target.files[0]);
  };

  const handlePreview = () => {
    if (!file) return alert("Please select a file first!");

    const reader = new FileReader();

    if (file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log("CSV parsed:", results.data);
          setPreviewData(results.data);
        },
      });
    } else {
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log("Excel parsed:", sheet);
        setPreviewData(sheet);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const calculateData = () => {
    if (previewData.length === 0) return alert("Preview data first!");

    const results = previewData.map((row) => {
      const sellingPrice = parseFloat(row.sellingPrice || 0);
      const costPrice = parseFloat(row.costPrice || 0);
      const shippingCost = parseFloat(row.shippingCost || 0);
      const adCost = parseFloat(row.adCost || 0);

      const commPercent =
        row.commissionPercent !== undefined
          ? parseFloat(row.commissionPercent)
          : commissionPercent;

      const gstP =
        row.gstPercent !== undefined
          ? parseFloat(row.gstPercent)
          : gstPercent;

      const commissionFee = (sellingPrice * commPercent) / 100;
      const gstTax = (sellingPrice * gstP) / 100;
      const totalCost = costPrice + commissionFee + gstTax + shippingCost + adCost;
      const profit = sellingPrice - totalCost;
      const breakEvenPrice = totalCost;

      return {
        ...row,
        commissionFee: commissionFee.toFixed(2),
        gstTax: gstTax.toFixed(2),
        profit: profit.toFixed(2),
        breakEvenPrice: breakEvenPrice.toFixed(2),
      };
    });

    console.log("Calculated data:", results);
    setCalculatedData(results);
  };
const handleSave = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/profit-fee/bulk-save",
        { records: calculatedData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Bulk records saved successfully!");
      setBulkHistory((prev) => [res.data, ...prev]); // prepend latest batch
      setFile(null);
      setPreviewData([]);
      setCalculatedData([]);
    } catch (err) {
      console.error("Bulk save error:", err.response?.data || err.message);
      alert("Error saving bulk records");
    }
  };
  return (
    <div
      className="modal fade"
      id="bulkUploadModal"
      tabIndex="-1"
      aria-labelledby="bulkUploadModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="bulkUploadModalLabel">
              Bulk Upload Products
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            <p>
              Upload a <b>CSV or Excel (.xlsx)</b> file with required columns:
              <br />
              <code>
                productName, sellingPrice, costPrice, commissionPercent,
                gstPercent, shippingCost, adCost, weight, category
              </code>
            </p>

            <input
              type="file"
              className="form-control"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
            />

            <button
              className="btn btn-primary mt-3"
              onClick={handlePreview}
              disabled={!file}
            >
              Upload & Preview
            </button>

            {previewData.length > 0 && (
              <div className="mt-4">
                <h6>Preview (first 10 rows)</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 d-flex gap-3">
                  <div>
                    <label>Commission % override:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>GST % override:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-warning mt-3"
                  onClick={calculateData}
                >
                  Calculate Results
                </button>
              </div>
            )}

            {calculatedData.length > 0 && (
              <div className="mt-4">
                <h6>Calculated Results</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-dark">
                      <tr>
                        {Object.keys(calculatedData[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedData.slice(0, 10).map((row, i) => (
                        <tr
                          key={i}
                          className={
                            parseFloat(row.profit) >= 0
                              ? "table-success"
                              : "table-danger"
                          }
                        >
                          {Object.values(row).map((val, j) => (
                            <td key={j}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-success"
              disabled={calculatedData.length === 0}
              onClick={handleSave}
            >
              Save to Database 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
