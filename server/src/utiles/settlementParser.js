import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

const columnMap = {
  orderId: [
    "order-id",
    "Order ID",
    "order",
    "amazon-order-id",
    "Order Item ID",
    "merchant-order-id",
  ],
  productName: [
    "sku",
    "asin",
    "Product",
    "item-name",
    "Product Name",
    "Seller SKU ID",
  ],
  settlementId: [
    "settlement-id",
    "settlement",
    "Settlement Ref. No.",
    "settlement-reference",
  ],
  orderDate: [
    "order-date",
    "Order Date",
    "settlement-date",
    "settlement-start-date",
    "settlement-end-date",
    "date",
    "Dispatch Date",
    "Delivery Date",
  ],
  quantity: ["quantity", "Quantity", "quantity-purchased", "qty"],
  grossAmount: [
    "item-price",
    "Selling Price",
    "Principal",
    "amount",
    "sale-amount",
    "total-charge",
    "gross",
    "sale-value",
    "Order Item Value (Rs)",
  ],
  costPrice: ["cost-price", "Cost Price", "cost"],
  commission: [
    "commission",
    "seller-fee",
    "selling-fee",
    "marketplace-fee",
    "fee",
    "commission-fee",
    "marketplace-commission",
    "fee-commission",
    "Total Marketplace Fee",
  ],
  shippingFee: [
    "shipping-charge",
    "shipping",
    "shipping-fee",
    "logistics-fee",
    "Shipping Fee",
    "Reverse Shipping Fee",
    "Return Shipping Fee",
  ],
  otherFee: [
    "other-fees",
    "other",
    "penalties",
    "closing-fee",
    "Other Fee",
    "Cancellation Fee",
    "collection-fee",
  ],
  gstCollected: [
    "tax",
    "gst",
    "gst-collected",
    "tax-collected",
    "gst-on-sales",
    "GST on Sales",
    "igst",
    "cgst",
    "sgst",
  ],
  gstOnFees: [
    "gst-on-fees",
    "fee-gst",
    "gst-on-marketplace-fees",
    "GST on Fees",
    "tax-deducted",
  ],
  netPayout: [
    "settlement-amount",
    "net-settlement-amount",
    "total-settlement",
    "payout",
    "net-amount",
    "net-payout",
    "amount-paid",
    "Settlement Value (Rs)",
  ],
  returnAmount: [
    "return-amount",
    "refund",
    "return-value",
    "Return Amount",
  ],
};

/**
 * parseCSVBuffer -> returns array of row objects using csv-parse sync
 * @param {Buffer} buffer
 * @returns {Array<Object>}
 */
export function parseCSVBuffer(buffer, options = {}) {
  try {
    const text = buffer.toString("utf8");
    return parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      ...options,
    });
  } catch (error) {
    console.error("Error parsing CSV buffer:", error.message);
    throw new Error("Failed to parse CSV file");
  }
}

/**
 * parseExcelBuffer -> returns array of row objects from Excel file
 * @param {Buffer} buffer
 * @returns {Array<Object>}
 */
export function parseExcelBuffer(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", raw: false, cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: true, raw: false, dateNF: "yyyy-mm-dd" });
    console.log("Parsed Excel rows:", rows);
    return rows;
  } catch (error) {
    console.error("Error parsing Excel buffer:", error.message);
    throw new Error("Failed to parse Excel file");
  }
}

/**
 * parseSettlementFile -> parses CSV or Excel file
 * @param {Buffer} buffer
 * @param {string} marketplace
 * @param {Object} columnMapping
 * @returns {Array<Object>}
 */
  export function parseSettlementFile(buffer, marketplace = "generic", columnMapping = {}) {
    let rows;
    try {
      if (buffer.slice(0, 4).toString("hex") === "504b0304") {
        rows = parseExcelBuffer(buffer);
      } else {
        rows = parseCSVBuffer(buffer);
      }
      console.log("Parsed rows:", rows);
    } catch (error) {
      console.error("parseSettlementFile error:", error.message);
      throw error;
    }

    // Validate required columns
    const requiredColumns = marketplace === "generic" 
      ? ["orderId", "grossAmount"]
      : ["settlementId", "orderId", "grossAmount", "gstCollected"];
    const headers = Object.keys(rows[0] || {});
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(h => columnMap[col]?.includes(h) || columnMapping[col] === h)
    );
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }

    // Check for marketplace mismatch with user-friendly error message
    if (marketplace === "amazon" && headers.includes("collection-fee") && !headers.includes("closing-fee")) {
      throw new Error("Incorrect platform selected. Please choose the correct platform (Flipkart) for the uploaded file.");
    }
    if (marketplace === "flipkart" && headers.includes("closing-fee") && !headers.includes("collection-fee")) {
      throw new Error("Incorrect platform selected. Please choose the correct platform (Amazon) for the uploaded file.");
    }

    const parser = marketplaceParsers[marketplace] || marketplaceParsers.generic;
    const canonical = parser(rows, columnMapping);
    console.log("Canonical data:", canonical);
    return canonical;
  }

/**
 * parseNumberSafe -> safely converts a value to a number
 * @param {any} v
 * @returns {number}
 */
function parseNumberSafe(v) {
  if (v === null || v === undefined || v === "") return 0;
  const cleaned = String(v).replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * normalizeColumnName -> standardizes column names for case-insensitive matching
 * @param {string} col
 * @returns {string}
 */
function normalizeColumnName(col) {
  return col ? col.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
}

/**
 * getColumnKey -> finds the matching column name from columnMap or columnMapping
 * @param {Object} keys - normalized column keys
 * @param {string} field - internal field name
 * @param {Object} columnMapping - user-defined column mappings
 * @returns {string|null} - matching column name or null
 */
function getColumnKey(keys, field, columnMapping) {
  if (columnMapping[field]) return columnMapping[field];
  const possibleNames = columnMap[field] || [];
  for (const name of possibleNames) {
    const normalizedName = normalizeColumnName(name);
    if (keys[normalizedName]) {
      return keys[normalizedName];
    }
  }
  return null;
}

export const marketplaceParsers = {
  amazon: (rows, columnMapping) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Amazon parser keys:", keys);

      const orderId = getColumnKey(keys, "orderId", columnMapping) ? r[getColumnKey(keys, "orderId", columnMapping)] : null;
      const productName = getColumnKey(keys, "productName", columnMapping) ? r[getColumnKey(keys, "productName", columnMapping)] : null;
      const settlementId = getColumnKey(keys, "settlementId", columnMapping) ? r[getColumnKey(keys, "settlementId", columnMapping)] : null;
      const orderDate = getColumnKey(keys, "orderDate", columnMapping) ? r[getColumnKey(keys, "orderDate", columnMapping)] : null;
      const quantity = parseNumberSafe(getColumnKey(keys, "quantity", columnMapping) ? r[getColumnKey(keys, "quantity", columnMapping)] : 1);
      const grossAmount = parseNumberSafe(getColumnKey(keys, "grossAmount", columnMapping) ? r[getColumnKey(keys, "grossAmount", columnMapping)] : 0);
      const costPrice = parseNumberSafe(getColumnKey(keys, "costPrice", columnMapping) ? r[getColumnKey(keys, "costPrice", columnMapping)] : 0);
      const commission = parseNumberSafe(getColumnKey(keys, "commission", columnMapping) ? r[getColumnKey(keys, "commission", columnMapping)] : (grossAmount * 0.15));
      const shippingFee = parseNumberSafe(getColumnKey(keys, "shippingFee", columnMapping) ? r[getColumnKey(keys, "shippingFee", columnMapping)] : 0);
      const otherFee = parseNumberSafe(getColumnKey(keys, "otherFee", columnMapping) ? r[getColumnKey(keys, "otherFee", columnMapping)] : (grossAmount < 300 ? 10 : grossAmount <= 500 ? 15 : 45));
      const gstCollected = parseNumberSafe(getColumnKey(keys, "gstCollected", columnMapping) ? r[getColumnKey(keys, "gstCollected", columnMapping)] : (grossAmount * 0.18));
      const gstOnFees = parseNumberSafe(getColumnKey(keys, "gstOnFees", columnMapping) ? r[getColumnKey(keys, "gstOnFees", columnMapping)] : ((commission + shippingFee + otherFee) * 0.18));
      const netPayout = parseNumberSafe(getColumnKey(keys, "netPayout", columnMapping) ? r[getColumnKey(keys, "netPayout", columnMapping)] : (grossAmount - (commission + shippingFee + otherFee + gstOnFees)));
      const returnAmount = parseNumberSafe(getColumnKey(keys, "returnAmount", columnMapping) ? r[getColumnKey(keys, "returnAmount", columnMapping)] : 0);

      // Adjust for returns
      const adjustedGrossAmount = grossAmount - returnAmount;
      const adjustedGstCollected = getColumnKey(keys, "gstCollected", columnMapping) ? gstCollected : (adjustedGrossAmount * 0.18);
      const adjustedNetPayout = getColumnKey(keys, "netPayout", columnMapping) ? netPayout : (adjustedGrossAmount - (commission + shippingFee + otherFee + gstOnFees));

      // Calculate profitability
      const grossProfit = adjustedGrossAmount - costPrice;
      const netProfit = adjustedNetPayout - costPrice;
      const margin = adjustedGrossAmount > 0 ? (netProfit / adjustedGrossAmount) * 100 : 0;

      // Reconciliation check
      const expectedPayout = adjustedGrossAmount - (commission + shippingFee + otherFee + gstOnFees);
      let reconciliationStatus = "Matched";
      let reconciliationNotes = "";
      if (Math.abs(adjustedNetPayout - expectedPayout) > 0.01) {
        reconciliationStatus = "Short Paid";
        reconciliationNotes = `Expected payout: ${expectedPayout.toFixed(2)}, Actual: ${adjustedNetPayout.toFixed(2)}`;
      }
      if (!orderId) {
        reconciliationStatus = "Missing";
        reconciliationNotes = "Order ID not found";
      }

      return {
        orderId,
        productName,
        settlementId,
        orderDate: orderDate ? new Date(orderDate) : null,
        quantity,
        grossAmount: adjustedGrossAmount,
        costPrice,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected: adjustedGstCollected,
        gstOnFees,
        netPayout: adjustedNetPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus,
        reconciliationNotes,
        rawRow: r,
        returnAmount,
      };
    });
  },

  flipkart: (rows, columnMapping) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Flipkart parser keys:", keys);

      const orderId = getColumnKey(keys, "orderId", columnMapping) ? r[getColumnKey(keys, "orderId", columnMapping)] : null;
      const productName = getColumnKey(keys, "productName", columnMapping) ? r[getColumnKey(keys, "productName", columnMapping)] : null;
      const settlementId = getColumnKey(keys, "settlementId", columnMapping) ? r[getColumnKey(keys, "settlementId", columnMapping)] : null;
      const orderDate = getColumnKey(keys, "orderDate", columnMapping) ? r[getColumnKey(keys, "orderDate", columnMapping)] : null;
      const quantity = parseNumberSafe(getColumnKey(keys, "quantity", columnMapping) ? r[getColumnKey(keys, "quantity", columnMapping)] : 1);
      const grossAmount = parseNumberSafe(getColumnKey(keys, "grossAmount", columnMapping) ? r[getColumnKey(keys, "grossAmount", columnMapping)] : 0);
      const costPrice = parseNumberSafe(getColumnKey(keys, "costPrice", columnMapping) ? r[getColumnKey(keys, "costPrice", columnMapping)] : 0);
      const commission = parseNumberSafe(getColumnKey(keys, "commission", columnMapping) ? r[getColumnKey(keys, "commission", columnMapping)] : (grossAmount * 0.15));
      const shippingFee = parseNumberSafe(getColumnKey(keys, "shippingFee", columnMapping) ? r[getColumnKey(keys, "shippingFee", columnMapping)] : 0);
      const otherFee = parseNumberSafe(getColumnKey(keys, "otherFee", columnMapping) ? r[getColumnKey(keys, "otherFee", columnMapping)] : (grossAmount * 0.025));
      const gstCollected = parseNumberSafe(getColumnKey(keys, "gstCollected", columnMapping) ? r[getColumnKey(keys, "gstCollected", columnMapping)] : (grossAmount * 0.18));
      const gstOnFees = parseNumberSafe(getColumnKey(keys, "gstOnFees", columnMapping) ? r[getColumnKey(keys, "gstOnFees", columnMapping)] : ((commission + shippingFee + otherFee) * 0.18));
      const netPayout = parseNumberSafe(getColumnKey(keys, "netPayout", columnMapping) ? r[getColumnKey(keys, "netPayout", columnMapping)] : (grossAmount - (commission + shippingFee + otherFee + gstOnFees)));
      const returnAmount = parseNumberSafe(getColumnKey(keys, "returnAmount", columnMapping) ? r[getColumnKey(keys, "returnAmount", columnMapping)] : 0);

      // Adjust for returns
      const adjustedGrossAmount = grossAmount - returnAmount;
      const adjustedGstCollected = getColumnKey(keys, "gstCollected", columnMapping) ? gstCollected : (adjustedGrossAmount * 0.18);
      const adjustedNetPayout = getColumnKey(keys, "netPayout", columnMapping) ? netPayout : (adjustedGrossAmount - (commission + shippingFee + otherFee + gstOnFees));

      // Calculate profitability
      const grossProfit = adjustedGrossAmount - costPrice;
      const netProfit = adjustedNetPayout - costPrice;
      const margin = adjustedGrossAmount > 0 ? (netProfit / adjustedGrossAmount) * 100 : 0;

      // Reconciliation check
      const expectedPayout = adjustedGrossAmount - (commission + shippingFee + otherFee + gstOnFees);
      let reconciliationStatus = "Matched";
      let reconciliationNotes = "";
      if (Math.abs(adjustedNetPayout - expectedPayout) > 0.01) {
        reconciliationStatus = "Short Paid";
        reconciliationNotes = `Expected payout: ${expectedPayout.toFixed(2)}, Actual: ${adjustedNetPayout.toFixed(2)}`;
      }
      if (!orderId) {
        reconciliationStatus = "Missing";
        reconciliationNotes = "Order ID not found";
      }

      return {
        orderId,
        productName,
        settlementId,
        orderDate: orderDate ? new Date(orderDate) : null,
        quantity,
        grossAmount: adjustedGrossAmount,
        costPrice,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected: adjustedGstCollected,
        gstOnFees,
        netPayout: adjustedNetPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus,
        reconciliationNotes,
        rawRow: r,
        returnAmount,
      };
    });
  },

  generic: (rows, columnMapping) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Generic parser keys:", keys);

      const orderId = getColumnKey(keys, "orderId", columnMapping) ? r[getColumnKey(keys, "orderId", columnMapping)] : null;
      const productName = getColumnKey(keys, "productName", columnMapping) ? r[getColumnKey(keys, "productName", columnMapping)] : null;
      const settlementId = getColumnKey(keys, "settlementId", columnMapping) ? r[getColumnKey(keys, "settlementId", columnMapping)] : null;
      const orderDate = getColumnKey(keys, "orderDate", columnMapping) ? r[getColumnKey(keys, "orderDate", columnMapping)] : null;
      const quantity = parseNumberSafe(getColumnKey(keys, "quantity", columnMapping) ? r[getColumnKey(keys, "quantity", columnMapping)] : 1);
      const grossAmount = parseNumberSafe(getColumnKey(keys, "grossAmount", columnMapping) ? r[getColumnKey(keys, "grossAmount", columnMapping)] : 0);
      const costPrice = parseNumberSafe(getColumnKey(keys, "costPrice", columnMapping) ? r[getColumnKey(keys, "costPrice", columnMapping)] : 0);
      const commission = parseNumberSafe(getColumnKey(keys, "commission", columnMapping) ? r[getColumnKey(keys, "commission", columnMapping)] : 0);
      const shippingFee = parseNumberSafe(getColumnKey(keys, "shippingFee", columnMapping) ? r[getColumnKey(keys, "shippingFee", columnMapping)] : 0);
      const otherFee = parseNumberSafe(getColumnKey(keys, "otherFee", columnMapping) ? r[getColumnKey(keys, "otherFee", columnMapping)] : 0);
      const gstCollected = parseNumberSafe(getColumnKey(keys, "gstCollected", columnMapping) ? r[getColumnKey(keys, "gstCollected", columnMapping)] : (grossAmount * 0.18));
      const gstOnFees = parseNumberSafe(getColumnKey(keys, "gstOnFees", columnMapping) ? r[getColumnKey(keys, "gstOnFees", columnMapping)] : ((commission + shippingFee + otherFee) * 0.18));
      const netPayout = parseNumberSafe(getColumnKey(keys, "netPayout", columnMapping) ? r[getColumnKey(keys, "netPayout", columnMapping)] : (grossAmount - (commission + shippingFee + otherFee + gstOnFees)));
      const returnAmount = parseNumberSafe(getColumnKey(keys, "returnAmount", columnMapping) ? r[getColumnKey(keys, "returnAmount", columnMapping)] : 0);

      // Adjust for returns
      const adjustedGrossAmount = grossAmount - returnAmount;
      const adjustedGstCollected = getColumnKey(keys, "gstCollected", columnMapping) ? gstCollected : (adjustedGrossAmount * 0.18);
      const adjustedNetPayout = getColumnKey(keys, "netPayout", columnMapping) ? netPayout : (adjustedGrossAmount - (commission + shippingFee + otherFee + gstOnFees));

      // Calculate profitability
      const grossProfit = adjustedGrossAmount - costPrice;
      const netProfit = adjustedNetPayout - costPrice;
      const margin = adjustedGrossAmount > 0 ? (netProfit / adjustedGrossAmount) * 100 : 0;

      // Reconciliation check
      const expectedPayout = adjustedGrossAmount - (commission + shippingFee + otherFee + gstOnFees);
      let reconciliationStatus = "Matched";
      let reconciliationNotes = "";
      if (Math.abs(adjustedNetPayout - expectedPayout) > 0.01) {
        reconciliationStatus = "Short Paid";
        reconciliationNotes = `Expected payout: ${expectedPayout.toFixed(2)}, Actual: ${adjustedNetPayout.toFixed(2)}`;
      }
      if (!orderId) {
        reconciliationStatus = "Missing";
        reconciliationNotes = "Order ID not found";
      }

      return {
        orderId,
        productName,
        settlementId,
        orderDate: orderDate ? new Date(orderDate) : null,
        quantity,
        grossAmount: adjustedGrossAmount,
        costPrice,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected: adjustedGstCollected,
        gstOnFees,
        netPayout: adjustedNetPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus,
        reconciliationNotes,
        rawRow: r,
        returnAmount,
      };
    });
  },
};