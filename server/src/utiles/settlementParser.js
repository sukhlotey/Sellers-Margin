import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

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
    const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
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
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
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

export const marketplaceParsers = {
  amazon: (rows) => {
    return rows.map((r) => {
      const keys = Object.keys(r).reduce((acc, key) => {
        acc[normalizeColumnName(key)] = key;
        return acc;
      }, {});
      console.log("Amazon parser keys:", keys);

      const orderId =
        r[keys.orderid] ||
        r[keys.order] ||
        r[keys.orderid] ||
        r[keys.asin] ||
        r[keys.sku] ||
        null;
      const productName =
        r[keys.productname] ||
        r[keys.sku] ||
        r[keys.asin] ||
        r[keys.product] ||
        null;
      const settlementId = r[keys.settlementid] || r[keys.settlement] || null;
      const orderDate =
        r[keys.orderdate] || r[keys.shipmentdate] || r[keys.settlementdate] || r[keys.date] || null;
      const quantity = parseNumberSafe(r[keys.quantity] || r[keys.qty] || 1);
      const grossAmount = parseNumberSafe(
        r[keys.itemprice] ||
          r[keys.saleamount] ||
          r[keys.totalcharge] ||
          r[keys.gross] ||
          r[keys.sellingprice] ||
          r[keys.salevalue] ||
          r[keys.amount]
      );
      const costPrice = parseNumberSafe(r[keys.costprice] || r[keys.cost] || 0);
      const commission = parseNumberSafe(
        r[keys.commission] ||
          r[keys.sellerfee] ||
          r[keys.sellingfee] ||
          r[keys.marketplacefee] ||
          r[keys.fee]
      );
      const shippingFee = parseNumberSafe(
        r[keys.shippingcharge] ||
          r[keys.shipping] ||
          r[keys.shippingfee] ||
          r[keys.logisticsfee]
      );
      const otherFee = parseNumberSafe(
        r[keys.otherfees] || r[keys.other] || r[keys.penalties] || r[keys.closingfee]
      );
      const gstCollected = parseNumberSafe(
        r[keys.tax] ||
          r[keys.gst] ||
          r[keys.gstcollected] ||
          r[keys.taxcollected] ||
          r[keys.gstonsales]
      );
      const gstOnFees = parseNumberSafe(
        r[keys.gstonfees] || r[keys.feegst] || r[keys.gstonmarketplacefees]
      );
      const netPayout = parseNumberSafe(
        r[keys.totalsettlement] ||
          r[keys.payout] ||
          r[keys.netamount] ||
          r[keys.netpayout] ||
          r[keys.netsettlementamount]
      );

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

      const orderId = r[keys.orderid] || r[keys.order] || r[keys.sku] || null;
      const productName =
        r[keys.productname] || r[keys.sku] || r[keys.product] || null;
      const settlementId = r[keys.settlementreference] || r[keys.settlementid] || null;
      const orderDate =
        r[keys.orderdate] || r[keys.settlementdate] || r[keys.date] || null;
      const quantity = parseNumberSafe(r[keys.quantity] || r[keys.qty] || 1);
      const grossAmount = parseNumberSafe(
        r[keys.amount] ||
          r[keys.salevalue] ||
          r[keys.gross] ||
          r[keys.sellingprice] ||
          r[keys.saleamount]
      );
      const costPrice = parseNumberSafe(r[keys.costprice] || r[keys.cost] || 0);
      const commission = parseNumberSafe(
        r[keys.marketplacefee] ||
          r[keys.commission] ||
          r[keys.sellerfee] ||
          r[keys.fee]
      );
      const shippingFee = parseNumberSafe(
        r[keys.logisticsfee] || r[keys.shipping] || r[keys.shippingfee]
      );
      const otherFee = parseNumberSafe(
        r[keys.penalties] || r[keys.otherfee] || r[keys.closingfee]
      );
      const gstCollected = parseNumberSafe(
        r[keys.taxcollected] ||
          r[keys.gstcollected] ||
          r[keys.gst] ||
          r[keys.tax] ||
          r[keys.gstonsales]
      );
      const gstOnFees = parseNumberSafe(
        r[keys.gstonfees] || r[keys.feegst] || r[keys.gstonmarketplacefees]
      );
      const netPayout = parseNumberSafe(
        r[keys.netpayout] ||
          r[keys.amountpaid] ||
          r[keys.netamount] ||
          r[keys.netsettlementamount]
      );

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

      const orderId =
        r[keys.orderid] || r[keys.order] || r[keys.sku] || r[keys.asin] || null;
      const productName =
        r[keys.productname] || r[keys.sku] || r[keys.asin] || r[keys.product] || null;
      const orderDate =
        r[keys.orderdate] || r[keys.settlementdate] || r[keys.date] || null;
      const quantity = parseNumberSafe(r[keys.quantity] || r[keys.qty] || 1);
      const grossAmount = parseNumberSafe(
        r[keys.sellingprice] ||
          r[keys.salevalue] ||
          r[keys.gross] ||
          r[keys.amount] ||
          r[keys.grossamount] ||
          r[keys.saleamount]
      );
      const costPrice = parseNumberSafe(r[keys.costprice] || r[keys.cost] || 0);
      const commission = parseNumberSafe(
        r[keys.commission] ||
          r[keys.fee] ||
          r[keys.marketplacefee] ||
          r[keys.sellerfee] ||
          0
      );
      const shippingFee = parseNumberSafe(
        r[keys.shipping] || r[keys.shippingfee] || r[keys.logisticsfee] || 0
      );
      const otherFee = parseNumberSafe(
        r[keys.otherfee] || r[keys.penalties] || r[keys.closingfee] || 0
      );
      const gstCollected = parseNumberSafe(
        r[keys.gst] ||
          r[keys.tax] ||
          r[keys.gstcollected] ||
          r[keys.taxcollected] ||
          r[keys.gstonsales] ||
          0
      );
      const gstOnFees = parseNumberSafe(
        r[keys.gstonfees] || r[keys.feegst] || r[keys.gstonmarketplacefees] || 0
      );
      const netPayout = parseNumberSafe(
        r[keys.net] ||
          r[keys.netpayout] ||
          r[keys.amountpaid] ||
          r[keys.netamount] ||
          r[keys.netsettlementamount] ||
          0
      );

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