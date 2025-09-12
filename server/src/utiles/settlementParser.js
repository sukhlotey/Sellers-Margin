import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

/**
 * Column mapping dictionary for marketplace-specific column names
 */
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
 * @returns {Array<Object>}
 */
export function parseSettlementFile(buffer, marketplace = "generic") {
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

  const parser = marketplaceParsers[marketplace] || marketplaceParsers.generic;
  const canonical = parser(rows);
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
 * getColumnKey -> finds the matching column name from columnMap
 * @param {Object} keys - normalized column keys
 * @param {string} field - internal field name
 * @returns {string|null} - matching column name or null
 */
function getColumnKey(keys, field) {
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
  amazon: (rows) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Amazon parser keys:", keys);

      // Log unmapped columns for debugging
      const unmappedKeys = Object.keys(r).filter(key => !Object.values(keys).includes(key));
      if (unmappedKeys.length > 0) {
        console.warn("Unmapped columns in Amazon parser:", unmappedKeys);
      }

      const orderId = getColumnKey(keys, "orderId") ? r[getColumnKey(keys, "orderId")] : null;
      const productName = getColumnKey(keys, "productName") ? r[getColumnKey(keys, "productName")] : null;
      const settlementId = getColumnKey(keys, "settlementId") ? r[getColumnKey(keys, "settlementId")] : null;
      const orderDate = getColumnKey(keys, "orderDate") ? r[getColumnKey(keys, "orderDate")] : null;
      const quantity = parseNumberSafe(getColumnKey(keys, "quantity") ? r[getColumnKey(keys, "quantity")] : 1);
      const grossAmount = parseNumberSafe(getColumnKey(keys, "grossAmount") ? r[getColumnKey(keys, "grossAmount")] : 0);
      const costPrice = parseNumberSafe(getColumnKey(keys, "costPrice") ? r[getColumnKey(keys, "costPrice")] : 0);
      const commission = parseNumberSafe(getColumnKey(keys, "commission") ? r[getColumnKey(keys, "commission")] : 0);
      const shippingFee = parseNumberSafe(getColumnKey(keys, "shippingFee") ? r[getColumnKey(keys, "shippingFee")] : 0);
      const otherFee = parseNumberSafe(getColumnKey(keys, "otherFee") ? r[getColumnKey(keys, "otherFee")] : 0);
      const gstCollected = parseNumberSafe(getColumnKey(keys, "gstCollected") ? r[getColumnKey(keys, "gstCollected")] : 0);
      const gstOnFees = parseNumberSafe(getColumnKey(keys, "gstOnFees") ? r[getColumnKey(keys, "gstOnFees")] : 0);
      const netPayout = parseNumberSafe(getColumnKey(keys, "netPayout") ? r[getColumnKey(keys, "netPayout")] : 0);

      // Calculate profitability
      const grossProfit = grossAmount - costPrice;
      const netProfit = netPayout - costPrice;
      const margin = grossAmount > 0 ? (netProfit / grossAmount) * 100 : 0;

      // Basic reconciliation check
      const expectedPayout = grossAmount - (commission + shippingFee + otherFee) + gstCollected - gstOnFees;
      let reconciliationStatus = "Matched";
      let reconciliationNotes = "";
      if (Math.abs(netPayout - expectedPayout) > 0.01) {
        reconciliationStatus = "Short Paid";
        reconciliationNotes = `Expected payout: ${expectedPayout.toFixed(2)}, Actual: ${netPayout.toFixed(2)}`;
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
        grossAmount,
        costPrice,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected,
        gstOnFees,
        netPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus,
        reconciliationNotes,
        rawRow: r,
      };
    });
  },

  flipkart: (rows) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Flipkart parser keys:", keys);

      // Log unmapped columns for debugging
      const unmappedKeys = Object.keys(r).filter(key => !Object.values(keys).includes(key));
      if (unmappedKeys.length > 0) {
        console.warn("Unmapped columns in Flipkart parser:", unmappedKeys);
      }

      const orderId = getColumnKey(keys, "orderId") ? r[getColumnKey(keys, "orderId")] : null;
      const productName = getColumnKey(keys, "productName") ? r[getColumnKey(keys, "productName")] : null;
      const settlementId = getColumnKey(keys, "settlementId") ? r[getColumnKey(keys, "settlementId")] : null;
      const orderDate = getColumnKey(keys, "orderDate") ? r[getColumnKey(keys, "orderDate")] : null;
      const quantity = parseNumberSafe(getColumnKey(keys, "quantity") ? r[getColumnKey(keys, "quantity")] : 1);
      const grossAmount = parseNumberSafe(getColumnKey(keys, "grossAmount") ? r[getColumnKey(keys, "grossAmount")] : 0);
      const costPrice = parseNumberSafe(getColumnKey(keys, "costPrice") ? r[getColumnKey(keys, "costPrice")] : 0);
      const commission = parseNumberSafe(getColumnKey(keys, "commission") ? r[getColumnKey(keys, "commission")] : 0);
      const shippingFee = parseNumberSafe(getColumnKey(keys, "shippingFee") ? r[getColumnKey(keys, "shippingFee")] : 0);
      const otherFee = parseNumberSafe(getColumnKey(keys, "otherFee") ? r[getColumnKey(keys, "otherFee")] : 0);
      const gstCollected = parseNumberSafe(getColumnKey(keys, "gstCollected") ? r[getColumnKey(keys, "gstCollected")] : 0);
      const gstOnFees = parseNumberSafe(getColumnKey(keys, "gstOnFees") ? r[getColumnKey(keys, "gstOnFees")] : 0);
      const netPayout = parseNumberSafe(getColumnKey(keys, "netPayout") ? r[getColumnKey(keys, "netPayout")] : 0);

      // Calculate profitability
      const grossProfit = grossAmount - costPrice;
      const netProfit = netPayout - costPrice;
      const margin = grossAmount > 0 ? (netProfit / grossAmount) * 100 : 0;

      // Basic reconciliation check
      const expectedPayout = grossAmount - (commission + shippingFee + otherFee) + gstCollected - gstOnFees;
      let reconciliationStatus = "Matched";
      let reconciliationNotes = "";
      if (Math.abs(netPayout - expectedPayout) > 0.01) {
        reconciliationStatus = "Short Paid";
        reconciliationNotes = `Expected payout: ${expectedPayout.toFixed(2)}, Actual: ${netPayout.toFixed(2)}`;
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
        grossAmount,
        costPrice,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected,
        gstOnFees,
        netPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus,
        reconciliationNotes,
        rawRow: r,
      };
    });
  },

  generic: (rows) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Generic parser keys:", keys);

      // Log unmapped columns for debugging
      const unmappedKeys = Object.keys(r).filter(key => !Object.values(keys).includes(key));
      if (unmappedKeys.length > 0) {
        console.warn("Unmapped columns in Generic parser:", unmappedKeys);
      }

      const orderId = getColumnKey(keys, "orderId") ? r[getColumnKey(keys, "orderId")] : null;
      const productName = getColumnKey(keys, "productName") ? r[getColumnKey(keys, "productName")] : null;
      const settlementId = getColumnKey(keys, "settlementId") ? r[getColumnKey(keys, "settlementId")] : null;
      const orderDate = getColumnKey(keys, "orderDate") ? r[getColumnKey(keys, "orderDate")] : null;
      const quantity = parseNumberSafe(getColumnKey(keys, "quantity") ? r[getColumnKey(keys, "quantity")] : 1);
      const grossAmount = parseNumberSafe(getColumnKey(keys, "grossAmount") ? r[getColumnKey(keys, "grossAmount")] : 0);
      const costPrice = parseNumberSafe(getColumnKey(keys, "costPrice") ? r[getColumnKey(keys, "costPrice")] : 0);
      const commission = parseNumberSafe(getColumnKey(keys, "commission") ? r[getColumnKey(keys, "commission")] : 0);
      const shippingFee = parseNumberSafe(getColumnKey(keys, "shippingFee") ? r[getColumnKey(keys, "shippingFee")] : 0);
      const otherFee = parseNumberSafe(getColumnKey(keys, "otherFee") ? r[getColumnKey(keys, "otherFee")] : 0);
      const gstCollected = parseNumberSafe(getColumnKey(keys, "gstCollected") ? r[getColumnKey(keys, "gstCollected")] : 0);
      const gstOnFees = parseNumberSafe(getColumnKey(keys, "gstOnFees") ? r[getColumnKey(keys, "gstOnFees")] : 0);
      const netPayout = parseNumberSafe(getColumnKey(keys, "netPayout") ? r[getColumnKey(keys, "netPayout")] : 0);

      // Calculate profitability
      const grossProfit = grossAmount - costPrice;
      const netProfit = netPayout - costPrice;
      const margin = grossAmount > 0 ? (netProfit / grossAmount) * 100 : 0;

      // Basic reconciliation check
      const expectedPayout = grossAmount - (commission + shippingFee + otherFee) + gstCollected - gstOnFees;
      let reconciliationStatus = "Matched";
      let reconciliationNotes = "";
      if (Math.abs(netPayout - expectedPayout) > 0.01) {
        reconciliationStatus = "Short Paid";
        reconciliationNotes = `Expected payout: ${expectedPayout.toFixed(2)}, Actual: ${netPayout.toFixed(2)}`;
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
        grossAmount,
        costPrice,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected,
        gstOnFees,
        netPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus,
        reconciliationNotes,
        rawRow: r,
      };
    });
  },
};