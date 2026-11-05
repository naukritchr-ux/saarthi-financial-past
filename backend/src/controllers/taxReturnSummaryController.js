
const { createClient } = require("@supabase/supabase-js");

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
// GET TAX RETURN SUMMARY BY FINANCIAL YEAR
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

    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: "Financial Year is required.",
      });
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("financial_year", financialYear)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      exists: Boolean(data),
      data: data || null,
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
        message: "Date of Refund Process is required when status is Processed.",
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

      // Placeholder values until formulas are confirmed.
      calculated_refund: numericValue(body.calculated_refund),
      difference_income: numericValue(body.difference_income),
      difference_income_tax: numericValue(body.difference_income_tax),
      difference_return: numericValue(body.difference_return),

      updated_at: new Date().toISOString(),
    };

    // Financial year has a UNIQUE constraint.
    // Existing FY = UPDATE
    // New FY = INSERT

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, {
        onConflict: "financial_year",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

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

module.exports = {
  getTaxReturnSummary,
  saveTaxReturnSummary,
};
