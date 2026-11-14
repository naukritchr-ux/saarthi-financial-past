
const { createClient } = require("@supabase/supabase-js");
const PDFDocument = require("pdfkit");

const TABLE_NAME = "tax_return_summary";

let supabaseClient = null;

// Initialize Supabase only when an API request is made.
// This avoids crashing the server immediately if environment variables
// are missing during deployment.
const getSupabase = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SECRET_KEY is missing."
    );
  }

  supabaseClient = createClient(
    supabaseUrl,
    supabaseSecretKey
  );

  return supabaseClient;
};


// ------------------------------
// COMMON HELPERS
// ------------------------------

const numericValue = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const nullableText = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return String(value).trim();
};

const nullableDate = (value) => {
  if (!value) {
    return null;
  }

  const date = String(value).trim();

  // Accept YYYY-MM-DD format.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}`);
  }

  return date;
};

const formatCurrency = (value) => {
  const amount = numericValue(value);

  return `INR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const getField = (body, snakeCase, camelCase) => {
  return body[snakeCase] ?? body[camelCase];
};


// ------------------------------
// DATABASE PAYLOAD
// ------------------------------

const createDatabasePayload = (body) => {
  const taxpayerName = nullableText(
    getField(body, "name", "name") ??
    body.taxpayer_name
  );

  const formType = nullableText(
    body.form_type ?? body.itr_form_type
  );

  const filingDate = nullableDate(
    body.itr_filing_date ?? body.filing_date
  );

  const refundProcess = nullableText(
    body.refund_process ?? body.refund_status
  ) || "Pending";

  const refundProcessDate = nullableDate(
    body.refund_process_date ?? body.refund_date
  );

  return {
    financial_year:
      nullableText(
        body.financial_year ?? body.financialYear
      ),

    assessment_year:
      nullableText(
        body.assessment_year ?? body.assessmentYear
      ),

    // Taxpayer details
    name: taxpayerName,
    taxpayer_name: taxpayerName,

    acknowledgement_number: nullableText(
      body.acknowledgement_number ??
      body.acknowledgementNumber
    ),

    form_type: formType,
    itr_form_type: formType,

    filing_status: nullableText(
      body.filing_status ?? body.filingStatus
    ),

    // Filing date
    itr_filing_date: filingDate,
    filing_date: filingDate,

    // Return details
    gross_income: numericValue(
      body.gross_income ?? body.grossIncome
    ),

    tax_payable: numericValue(
      body.tax_payable ?? body.taxPayable
    ),

    tds_claim: numericValue(
      body.tds_claim ?? body.tdsClaim
    ),

    refund_due: numericValue(
      body.refund_due ?? body.refundDue
    ),

    // Refund details
    refund_process: refundProcess,
    refund_status: refundProcess,

    refund_process_date: refundProcessDate,
    refund_date: refundProcessDate,

    // Assessment details
    income_assessment: numericValue(
      body.income_assessment ?? body.incomeAssessment
    ),

    income_tax: numericValue(
      body.income_tax ?? body.incomeTax
    ),

    tds_credit: numericValue(
      body.tds_credit ?? body.tdsCredit
    ),

    refund_amount: numericValue(
      body.refund_amount ?? body.refundAmount
    ),

    interest: numericValue(body.interest),

    // Calculated values
    calculated_refund: numericValue(
      body.calculated_refund ?? body.calculatedRefund
    ),

    difference_income: numericValue(
      body.difference_income ?? body.differenceIncome
    ),

    difference_income_tax: numericValue(
      body.difference_income_tax ?? body.differenceIncomeTax
    ),

    difference_return: numericValue(
      body.difference_return ?? body.differenceReturn
    ),

    updated_at: new Date().toISOString(),
  };
};


// ------------------------------
// GET TAX RETURN RECORDS
// ------------------------------

const getTaxReturnSummary = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { id } = req.query;

    const financialYear =
      req.query.financial_year ||
      req.query.financialYear;

    let query = supabase
      .from(TABLE_NAME)
      .select("*")
      .order("updated_at", {
        ascending: false,
      });

    // Fetch one record using its UUID.
    if (id) {
      query = query
        .eq("id", id)
        .maybeSingle();

      const { data, error } = await query;

      if (error) {
        console.error("Get tax return by ID error:", error);

        return res.status(500).json({
          success: false,
          message: "Unable to fetch tax return record.",
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        data: data || null,
        record: data || null,
      });
    }

    // Filter records by financial year if provided.
    if (financialYear) {
      query = query.eq(
        "financial_year",
        financialYear
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get tax return records error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch tax return records.",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      records: data || [],
    });
  } catch (error) {
    console.error("GET tax return error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching records.",
      error: error.message,
    });
  }
};


// ------------------------------
// SAVE / UPDATE TAX RETURN
// ------------------------------

const saveTaxReturnSummary = async (req, res) => {
  try {
    const supabase = getSupabase();

    const body = req.body?.data || req.body || {};

    const financialYear =
      body.financial_year || body.financialYear;

    const assessmentYear =
      body.assessment_year || body.assessmentYear;

    if (!financialYear || !assessmentYear) {
      return res.status(400).json({
        success: false,
        message:
          "Financial Year and Assessment Year are required.",
      });
    }

    const payload = createDatabasePayload(body);

    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: "Taxpayer name is required.",
      });
    }

    let result;

    // UPDATE: When an existing UUID is supplied.
    if (body.id) {
      result = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq("id", body.id)
        .select("*")
        .maybeSingle();

      if (!result.error && !result.data) {
        return res.status(404).json({
          success: false,
          message: "Tax return record not found.",
        });
      }
    } else {
      // INSERT: When no UUID is supplied.
      // This allows multiple taxpayers in the same financial year.
      result = await supabase
        .from(TABLE_NAME)
        .insert(payload)
        .select("*")
        .single();
    }

    if (result.error) {
      console.error("Save tax return error:", result.error);

      return res.status(500).json({
        success: false,
        message: "Unable to save tax return record.",
        error: result.error.message,
      });
    }

    return res.status(body.id ? 200 : 201).json({
      success: true,
      message: body.id
        ? "Tax return record updated successfully."
        : "Tax return record saved successfully.",
      data: result.data,
      record: result.data,
    });
  } catch (error) {
    console.error("Save tax return error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving the record.",
      error: error.message,
    });
  }
};


// ------------------------------
// PDF TABLE HELPER
// ------------------------------

const drawTable = (
  doc,
  headers,
  rows,
  options = {}
) => {
  const startX = options.x || 40;
  const startY = options.y || doc.y;
  const tableWidth =
    options.width || doc.page.width - 80;

  const columnWidths =
    options.columnWidths ||
    headers.map(() => tableWidth / headers.length);

  const rowHeight = options.rowHeight || 25;

  let currentY = startY;

  const drawRow = (values, isHeader = false) => {
    let currentX = startX;

    values.forEach((value, index) => {
      const width = columnWidths[index];

      if (isHeader) {
        doc
          .rect(currentX, currentY, width, rowHeight)
          .fill("#E9E3D5");
      }

      doc
        .rect(currentX, currentY, width, rowHeight)
        .stroke("#CFC8B8");

      doc
        .fillColor("#222222")
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8)
        .text(
          String(value ?? "-"),
          currentX + 5,
          currentY + 8,
          {
            width: width - 10,
            height: rowHeight - 5,
            ellipsis: true,
          }
        );

      currentX += width;
    });

    currentY += rowHeight;
  };

  drawRow(headers, true);

  rows.forEach((row) => {
    if (currentY + rowHeight > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;
    }

    drawRow(row);
  });

  doc.y = currentY + 15;
};


// ------------------------------
// GENERATE TAX RETURN PDF
// ------------------------------

const generateTaxReturnSummaryPDF = async (req, res) => {
  try {
    const supabase = getSupabase();

    const body = req.body?.data || req.body || {};

    let record = body;

    // If an ID is supplied, fetch the latest saved record.
    if (body.id) {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("id", body.id)
        .maybeSingle();

      if (error) {
        console.error("PDF record fetch error:", error);

        return res.status(500).json({
          success: false,
          message: "Unable to fetch record for PDF.",
          error: error.message,
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Tax return record not found.",
        });
      }

      record = data;
    }

    const taxpayerName =
      record.name ||
      record.taxpayer_name ||
      "-";

    const financialYear =
      record.financial_year ||
      record.financialYear ||
      "-";

    const assessmentYear =
      record.assessment_year ||
      record.assessmentYear ||
      "-";

    const acknowledgementNumber =
      record.acknowledgement_number ||
      record.acknowledgementNumber ||
      "-";

    const formType =
      record.form_type ||
      record.itr_form_type ||
      record.formType ||
      "-";

    const filingStatus =
      record.filing_status ||
      record.filingStatus ||
      "-";

    const filingDate =
      record.itr_filing_date ||
      record.filing_date ||
      record.itrFilingDate;

    const refundStatus =
      record.refund_process ||
      record.refund_status ||
      record.refundProcess ||
      "Pending";

    const refundDate =
      record.refund_process_date ||
      record.refund_date ||
      record.refundProcessDate;

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 45,
        bottom: 45,
        left: 40,
        right: 40,
      },
      bufferPages: true,
    });

    const filename =
      `Tax_Return_Summary_${String(financialYear).replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      )}.pdf`;

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    doc.pipe(res);

    // Header
    doc
      .fillColor("#172B4D")
      .font("Helvetica-Bold")
      .fontSize(19)
      .text("TAX RETURN SUMMARY", {
        align: "center",
      });

    doc
      .moveDown(0.4)
      .fillColor("#777777")
      .font("Helvetica")
      .fontSize(9)
      .text("Income Tax Return Details and Assessment Report", {
        align: "center",
      });

    doc.moveDown(1);

    doc
      .strokeColor("#C9B98B")
      .lineWidth(1.5)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(1);

    // Taxpayer details
    doc
      .fillColor("#172B4D")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("1. TAXPAYER DETAILS");

    doc.moveDown(0.5);

    const taxpayerRows = [
      ["Taxpayer Name", taxpayerName],
      ["Financial Year", financialYear],
      ["Assessment Year", assessmentYear],
      ["Acknowledgement Number", acknowledgementNumber],
      ["ITR Form Type", formType],
      ["Filing Status", filingStatus],
      ["ITR Filing Date", formatDate(filingDate)],
    ];

    drawTable(
      doc,
      ["Particulars", "Details"],
      taxpayerRows,
      {
        columnWidths: [190, 325],
        rowHeight: 26,
      }
    );

    // Return details
    doc
      .fillColor("#172B4D")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("2. RETURN DETAILS");

    doc.moveDown(0.5);

    const returnRows = [
      ["Gross Income", formatCurrency(record.gross_income)],
      ["Tax Payable", formatCurrency(record.tax_payable)],
      ["TDS Claimed", formatCurrency(record.tds_claim)],
      ["Refund Due", formatCurrency(record.refund_due)],
      ["Calculated Refund", formatCurrency(record.calculated_refund)],
    ];

    drawTable(
      doc,
      ["Particulars", "Amount"],
      returnRows,
      {
        columnWidths: [190, 325],
        rowHeight: 26,
      }
    );

    // Assessment details
    doc
      .fillColor("#172B4D")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("3. INCOME TAX ASSESSMENT");

    doc.moveDown(0.5);

    const assessmentRows = [
      ["Income Assessment", formatCurrency(record.income_assessment)],
      ["Income Tax", formatCurrency(record.income_tax)],
      ["TDS Credit", formatCurrency(record.tds_credit)],
      ["Refund Amount", formatCurrency(record.refund_amount)],
      ["Interest", formatCurrency(record.interest)],
    ];

    drawTable(
      doc,
      ["Particulars", "Amount"],
      assessmentRows,
      {
        columnWidths: [190, 325],
        rowHeight: 26,
      }
    );

    // Differences
    doc
      .fillColor("#172B4D")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("4. DIFFERENCE ANALYSIS");

    doc.moveDown(0.5);

    const differenceRows = [
      ["Difference in Income", formatCurrency(record.difference_income)],
      ["Difference in Income Tax", formatCurrency(record.difference_income_tax)],
      ["Difference in Return", formatCurrency(record.difference_return)],
    ];

    drawTable(
      doc,
      ["Particulars", "Amount"],
      differenceRows,
      {
        columnWidths: [190, 325],
        rowHeight: 26,
      }
    );

    // Refund information
    doc
      .fillColor("#172B4D")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("5. REFUND INFORMATION");

    doc.moveDown(0.5);

    const refundRows = [
      ["Refund Status", refundStatus],
      ["Refund Process Date", formatDate(refundDate)],
    ];

    drawTable(
      doc,
      ["Particulars", "Details"],
      refundRows,
      {
        columnWidths: [190, 325],
        rowHeight: 26,
      }
    );

    // Footer
    doc
      .moveDown(1)
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#777777")
      .text(
        "Generated from the Tax Return Summary application.",
        40,
        doc.page.height - 45,
        {
          align: "center",
          width: doc.page.width - 80,
        }
      );

    doc.end();
  } catch (error) {
    console.error("Generate tax return PDF error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to generate tax return PDF.",
        error: error.message,
      });
    }

    res.end();
  }
};


// ------------------------------
// EXPORT CONTROLLERS
// ------------------------------

module.exports = {
  getTaxReturnSummary,
  saveTaxReturnSummary,
  generateTaxReturnSummaryPDF,
};
