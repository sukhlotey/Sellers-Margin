import { parse } from "csv-parse/sync";

/**
 * parseCSVBuffer -> returns array of row objects using csv-parse sync
 * @param {Buffer} buffer
 * @returns {Array<Object>}
 */
export function parseCSVBuffer(buffer, options = {}) {
  const text = buffer.toString("utf8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  });
}

/**
 * marketplaceParsers[marketplace](rows) -> canonicalRecords
 * Each canonical record should have:
 * { orderId, orderDate, grossAmount, feesBreakdown:{...}, gstCollected, gstOnFees, netPayout, rawRow }
 */

function parseNumberSafe(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export const marketplaceParsers = {
  // Example: Amazon settlement CSV style (columns vary by report type)
  amazon: (rows) => {
    return rows.map((r) => {
      // try multiple column keys safely
      const orderId = r["order-id"] || r["Order ID"] || r["OrderID"] || r["orderId"] || r["order_id"] || r["order"];
      const settlementId = r["settlement-id"] || r["Settlement ID"] || r["settlementId"];
      const orderDate = r["order-date"] || r["Order Date"] || r["shipment-date"];
      const grossAmount = parseNumberSafe(r["item-price"] || r["sale-amount"] || r["total-charge"] || r["gross"]);
      const commission = parseNumberSafe(r["commission"] || r["seller-fee"] || r["selling-fee"]);
      const shippingFee = parseNumberSafe(r["shipping-charge"] || r["shipping"] || r["shipping-fee"]);
      const otherFee = parseNumberSafe(r["other-fees"] || r["other"]);
      const gstCollected = parseNumberSafe(r["tax"] || r["gst"] || r["gst-collected"]);
      const gstOnFees = parseNumberSafe(r["gst-on-fees"] || r["fee-gst"]);
      const netPayout = parseNumberSafe(r["total-settlement"] || r["payout"] || r["net-amount"]);

      return {
        orderId,
        settlementId,
        orderDate: orderDate ? new Date(orderDate) : null,
        grossAmount,
        feesBreakdown: {
          commission,
          shippingFee,
          otherFee,
        },
        gstCollected,
        gstOnFees,
        netPayout,
        rawRow: r,
      };
    });
  },

  // Example: Flipkart settlement CSV style
  flipkart: (rows) => {
    return rows.map((r) => {
      const orderId = r["Order ID"] || r["orderId"] || r["order"];
      const settlementId = r["Settlement Reference"] || r["settlement-id"];
      const orderDate = r["Order Date"] || r["order-date"];
      const grossAmount = parseNumberSafe(r["Amount"] || r["Sale Value"] || r["gross"]);
      const commission = parseNumberSafe(r["Marketplace Fee"] || r["commission"]);
      const shippingFee = parseNumberSafe(r["Logistics Fee"] || r["shipping"]);
      const otherFee = parseNumberSafe(r["Penalties"] || r["other-fee"]);
      const gstCollected = parseNumberSafe(r["Tax Collected"] || r["GST Collected"]);
      const gstOnFees = parseNumberSafe(r["GST on Fees"] || r["gst-on-fees"]);
      const netPayout = parseNumberSafe(r["Net Payout"] || r["amount-paid"]);

      return {
        orderId,
        settlementId,
        orderDate: orderDate ? new Date(orderDate) : null,
        grossAmount,
        feesBreakdown: { commission, shippingFee, otherFee },
        gstCollected,
        gstOnFees,
        netPayout,
        rawRow: r,
      };
    });
  },

  // Fallback: try to map known columns generically
  generic: (rows) => {
    return rows.map((r) => {
      const grossAmount = parseNumberSafe(r["sellingPrice"] || r["selling_price"] || r["selling"] || r["grossAmount"] || r["amount"]);
      const commission = parseNumberSafe(r["commissionPercent"] ? 0 : r["commission"] || r["fee"] || 0);
      const gstCollected = parseNumberSafe(r["gst"] || r["tax"]);
      const netPayout = parseNumberSafe(r["net"] || r["netPayout"]);
      return {
        orderId: r["orderId"] || r["order_id"] || r["order"],
        orderDate: r["orderDate"] ? new Date(r["orderDate"]) : null,
        grossAmount,
        feesBreakdown: { commission },
        gstCollected,
        gstOnFees: 0,
        netPayout,
        rawRow: r,
      };
    });
  },
};

/**
 * parseSettlementFile(buffer, marketplace)
 * - buffer: file buffer
 * - marketplace: 'amazon' | 'flipkart' | 'generic'
 */
export function parseSettlementFile(buffer, marketplace = "generic") {
  const rows = parseCSVBuffer(buffer);
  const parser = marketplaceParsers[marketplace] || marketplaceParsers.generic;
  const canonical = parser(rows);
  return canonical;
}
