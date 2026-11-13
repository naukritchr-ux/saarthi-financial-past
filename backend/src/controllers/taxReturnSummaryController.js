
const { createClient } = require("@supabase/supabase-js");
const PDFDocument = require("pdfkit");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey)
    : null;

const TABLE_NAME = "tax_return_summary";

// ======================================================
// HELPER: NUMERIC VALUE
// ======================================================

const numericValue = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// ======================================================
// HELPER: CURRENCY FORMAT
// ======================================================

const formatCurrency = (value) =>
  `INR ${numericValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ======================================================
// GET TAX RETURN SUMMARY
// GET /api/tax-return-summary
// GET /api/tax-return-summary?financialYear=2025-26
// ======================================================

const getTaxReturnSummary = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase configuration is missing.",
      });
    }

    const { financialYear } = req.query;

    // Fetch one record for a selected financial year.
    if (financialYear) {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("financial_year", financialYear)
        .maybeSingle();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        exists: Boolean(data),
        data: data || null,
      });
    }

    // Fetch all records for dashboard and records table.
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      records: data || [],
    });
  } catch (error) {
    console.error("Error fetching Tax Return Summary:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch Tax Return Summary.",
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
    });
  }
};

// ======================================================
// SAVE OR UPDATE TAX RETURN SUMMARY
// POST /api/tax-return-summary
// ======================================================

const saveTaxReturnSummary = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase configuration is missing.",
      });
    }

    const body = req.body?.data || req.body || {};

    const financialYear = body.financial_year;
    const assessmentYear = body.assessment_year;

    if (!financialYear || !assessmentYear) {
      return res.status(400).json({
        success: false,
        message: "Financial Year and Assessment Year are required.",
      });
    }

    const refundProcess = body.refund_process || "Pending";

    const taxPayable = numericValue(body.tax_payable);
    const tdsClaim = numericValue(body.tds_claim);

    if (
      refundProcess === "Processed" &&
      !body.refund_process_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Date of Refund Process is required when status is Processed.",
      });
    }

    const payload = {
      financial_year: financialYear,
      assessment_year: assessmentYear,
      itr_filing_date: body.itr_filing_date || null,

      gross_income: numericValue(body.gross_income),
      tax_payable: taxPayable,
      tds_claim: tdsClaim,
      refund_due: Math.max(0, tdsClaim - taxPayable),

      refund_process: refundProcess,
      refund_process_date:
        refundProcess === "Processed"
          ? body.refund_process_date || null
          : null,

      income_assessment: numericValue(body.income_assessment),
      income_tax: numericValue(body.income_tax),
      tds_credit: numericValue(body.tds_credit),
      refund_amount: numericValue(body.refund_amount),
      interest: numericValue(body.interest),

      calculated_refund: numericValue(body.calculated_refund),
      difference_income: numericValue(body.difference_income),
      difference_income_tax: numericValue(body.difference_income_tax),
      difference_return: numericValue(body.difference_return),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, {
        onConflict: "financial_year",
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Tax Return Summary saved successfully.",
      data,
    });
  } catch (error) {
    console.error("Error saving Tax Return Summary:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to save Tax Return Summary.",
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
    });
  }
};

// ======================================================
// GENERATE TAX RETURN SUMMARY PDF
// POST /api/tax-return-summary/pdf
// ======================================================

const generateTaxReturnSummaryPDF = async (req, res) => {
  try {
    const body = req.body?.data || req.body || {};

    const financialYear = body.financial_year;
    const assessmentYear = body.assessment_year;

    if (!financialYear || !assessmentYear) {
      return res.status(400).json({
        success: false,
        message: "Financial Year and Assessment Year are required.",
      });
    }

    const grossIncome = numericValue(body.gross_income);
    const taxPayable = numericValue(body.tax_payable);
    const tdsClaim = numericValue(body.tds_claim);

    const refundDue = Math.max(0, tdsClaim - taxPayable);

    const incomeAssessment = numericValue(body.income_assessment);
    const incomeTax = numericValue(body.income_tax);
    const tdsCredit = numericValue(body.tds_credit);
    const refundAmount = numericValue(body.refund_amount);
    const interest = numericValue(body.interest);

    const calculatedRefund = tdsCredit + interest;

    const differenceIncome = incomeAssessment - grossIncome;
    const differenceIncomeTax = incomeTax - taxPayable;
    const differenceReturn = refundAmount - calculatedRefund;

    const downloadDateTime = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const safeFinancialYear = String(financialYear).replace(
      /[^a-zA-Z0-9_-]/g,
      "-"
    );

    const filename = `Tax_Return_Summary_FY_${safeFinancialYear}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Cache-Control", "no-store");

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
      info: {
        Title: `Tax Return Summary FY ${financialYear}`,
        Author: "TCHR Performance Ledger",
        Subject: "Tax Return Summary",
      },
    });

    doc.on("error", (error) => {
      console.error("PDF stream error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Unable to generate Tax Return Summary PDF.",
        });
      } else {
        res.destroy(error);
      }
    });

    doc.pipe(res);

    // --------------------------------------------------
    // PDF HEADER
    // --------------------------------------------------

    const pageWidth = doc.page.width;
    const contentWidth =
      pageWidth - doc.page.margins.left - doc.page.margins.right;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text(`Downloaded On: ${downloadDateTime}`, {
        align: "right",
      });

    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor("#102a43")
      .text("TAX RETURN SUMMARY", {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .strokeColor("#c9a227")
      .lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + contentWidth, doc.y)
      .stroke();

    doc.moveDown(1);

    // --------------------------------------------------
    // PDF TABLE HELPER
    // --------------------------------------------------

    const drawTable = (headers, rows, widths) => {
      const startX = doc.page.margins.left;
      const totalWidth = contentWidth;
      const rowPadding = 7;

      const drawRow = (values, isHeader = false) => {
        const fontSize = isHeader ? 9 : 8.5;

        doc.font(isHeader ? "Helvetica-Bold" : "Helvetica");
        doc.fontSize(fontSize);

        const cellHeights = values.map((value, index) => {
          const cellWidth = totalWidth * widths[index];

          return doc.heightOfString(String(value ?? "—"), {
            width: cellWidth - rowPadding * 2,
            align: "left",
          });
        });

        const rowHeight =
          Math.max(...cellHeights, 12) + rowPadding * 2;

        if (doc.y + rowHeight > doc.page.height - 50) {
          doc.addPage();

          if (!isHeader) {
            drawRow(headers, true);
          }
        }

        const y = doc.y;
        let x = startX;

        values.forEach((value, index) => {
          const cellWidth = totalWidth * widths[index];

          doc
            .rect(x, y, cellWidth, rowHeight)
            .lineWidth(0.6)
            .strokeColor("#777777")
            .fillAndStroke(
              isHeader ? "#eeeeee" : "#ffffff",
              "#777777"
            );

          doc
            .font(isHeader ? "Helvetica-Bold" : "Helvetica")
            .fontSize(fontSize)
            .fillColor("#000000")
            .text(String(value ?? "—"), x + rowPadding, y + rowPadding, {
              width: cellWidth - rowPadding * 2,
              height: rowHeight - rowPadding * 2,
              align: "left",
              lineGap: 1,
            });

          x += cellWidth;
        });

        doc.y = y + rowHeight;
      };

      drawRow(headers, true);
      rows.forEach((row) => drawRow(row));
      doc.moveDown(1);
    };

    // --------------------------------------------------
    // TAX RETURN PARTICULARS
    // --------------------------------------------------

    const rows = [
      ["1", "Financial Year (FY)", financialYear],
      ["2", "Assessment Year (AY)", assessmentYear],
      ["3", "ITR Filing Date", body.itr_filing_date || "—"],
      ["4", "Gross Income As per ITR", formatCurrency(grossIncome)],
      ["5", "Tax Payable", formatCurrency(taxPayable)],
      ["6", "TDS Claim As per 26AS", formatCurrency(tdsClaim)],
      ["7", "Refund Due", formatCurrency(refundDue)],
      ["8", "Refund Process", body.refund_process || "Pending"],
      [
        "9",
        "Date of Refund Process",
        body.refund_process_date || "—",
      ],
      [
        "10",
        "Income As per Assessment",
        formatCurrency(incomeAssessment),
      ],
      ["11", "Income Tax As Per AY", formatCurrency(incomeTax)],
      ["12", "TDS Credit", formatCurrency(tdsCredit)],
      ["13", "Refund Amount", formatCurrency(refundAmount)],
      ["14", "Interest", formatCurrency(interest)],
      [
        "15",
        "Refund Amount (Calculated)",
        formatCurrency(calculatedRefund),
      ],
    ];

    drawTable(
      ["Sr. No.", "Particulars", "Amount / Details"],
      rows,
      [0.12, 0.48, 0.40]
    );

    // --------------------------------------------------
    // DIFFERENCE SECTION
    // --------------------------------------------------

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#102a43")
      .text("DIFFERENCE");

    doc.moveDown(0.5);

    drawTable(
      ["Particulars", "Amount"],
      [
        ["Income", formatCurrency(differenceIncome)],
        ["Income Tax", formatCurrency(differenceIncomeTax)],
        ["Return", formatCurrency(differenceReturn)],
      ],
      [0.60, 0.40]
    );

    doc.end();
  } catch (error) {
    console.error("Error generating Tax Return Summary PDF:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          error.message || "Unable to generate Tax Return Summary PDF.",
      });
    }

    res.destroy(error);
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  getTaxReturnSummary,
  saveTaxReturnSummary,
  generateTaxReturnSummaryPDF,
};
