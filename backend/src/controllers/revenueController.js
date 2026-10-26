
const { createClient } = require("@supabase/supabase-js");

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey)
    : null;

/* =========================================================
   CONSTANTS
========================================================= */

const TABLE_NAME = "revenue";

const FINANCIAL_YEARS = [
  "FY 2021-2022",
  "FY 2022-2023",
  "FY 2023-2024",
];

const REVENUE_ROWS = [
  "Recruitment Revenue",
  "Franchisee Revenue",
  "Job portal Revenue",
];

const EXPENDITURE_ROWS = [
  "Recruitment Expenditure",
  "Franchisee Expenditure",
  "Job portal Expenditure",
  "Other Expenditure",
];

const SALARY_ROWS = [
  "Recruitment Salary",
  "Franchisee Salary",
  "Job portal Salary",
];

const INCOME_ROWS = ["Income Received"];

/* =========================================================
   HELPERS
========================================================= */

function getNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getValue(object, row, year) {
  return getNumber(object?.[row]?.[year]);
}

function roundToTwo(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function createInitialRowData(rows) {
  const result = {};

  rows.forEach((row) => {
    result[row] = {};

    FINANCIAL_YEARS.forEach((year) => {
      result[row][year] = "";
    });
  });

  return result;
}

function createEmptyRevenueData() {
  const director = {};
  const keyExpenses = {};
  const leadGeneration = {};
  const tds = {};
  const netAmount = {};

  FINANCIAL_YEARS.forEach((year) => {
    director[year] = "";
    keyExpenses[year] = "";
    leadGeneration[year] = "";
    tds[year] = "";
    netAmount[year] = "";
  });

  return {
    revenue: createInitialRowData(REVENUE_ROWS),
    expenditure: createInitialRowData(EXPENDITURE_ROWS),
    salary: createInitialRowData(SALARY_ROWS),
    incomeReceived: createInitialRowData(INCOME_ROWS),

    incomeTaxPercentage: "",

    netIncomeBreakdown: {
      Director: director,
      "Key Expenses": keyExpenses,
      "Lead Generation": leadGeneration,
    },

    tds,
    netAmount,
    isSaved: false,
  };
}

/* =========================================================
   CALCULATIONS
========================================================= */

function calculateNetIncomeForYear(
  year,
  revenue,
  expenditure,
  salary,
  incomeTaxPercentage,
  incomeReceived
) {
  const recruitment =
    getValue(revenue, "Recruitment Revenue", year) -
    getValue(expenditure, "Recruitment Expenditure", year) -
    getValue(salary, "Recruitment Salary", year);

  const franchisee =
    getValue(revenue, "Franchisee Revenue", year) -
    getValue(expenditure, "Franchisee Expenditure", year) -
    getValue(salary, "Franchisee Salary", year);

  const jobPortal =
    getValue(revenue, "Job portal Revenue", year) -
    getValue(expenditure, "Job portal Expenditure", year) -
    getValue(salary, "Job portal Salary", year);

  const additionalIncome = getValue(
    incomeReceived,
    "Income Received",
    year
  );

  const otherExpenditure = getValue(
    expenditure,
    "Other Expenditure",
    year
  );

  const overallRevenue =
    recruitment +
    franchisee +
    jobPortal +
    additionalIncome -
    otherExpenditure;

  const incomeTax =
    overallRevenue * (getNumber(incomeTaxPercentage) / 100);

  const netIncome = overallRevenue - incomeTax;

  return {
    recruitment: roundToTwo(recruitment),
    franchisee: roundToTwo(franchisee),
    jobPortal: roundToTwo(jobPortal),
    additionalIncome: roundToTwo(additionalIncome),
    otherExpenditure: roundToTwo(otherExpenditure),
    overallRevenue: roundToTwo(overallRevenue),
    incomeTax: roundToTwo(incomeTax),
    netIncome: roundToTwo(netIncome),
  };
}

/* =========================================================
   DATABASE ROWS -> FRONTEND DATA
========================================================= */

function convertDatabaseRowsToFrontend(rows) {
  const result = createEmptyRevenueData();

  if (!Array.isArray(rows)) {
    return result;
  }

  rows.forEach((row) => {
    const year = row.financial_year;

    if (!FINANCIAL_YEARS.includes(year)) {
      return;
    }

    result.revenue["Recruitment Revenue"][year] =
      String(row.recruitment_revenue ?? "");

    result.revenue["Franchisee Revenue"][year] =
      String(row.franchisee_revenue ?? "");

    result.revenue["Job portal Revenue"][year] =
      String(row.job_portal_revenue ?? "");

    result.expenditure["Recruitment Expenditure"][year] =
      String(row.recruitment_expenditure ?? "");

    result.expenditure["Franchisee Expenditure"][year] =
      String(row.franchisee_expenditure ?? "");

    result.expenditure["Job portal Expenditure"][year] =
      String(row.job_portal_expenditure ?? "");

    // Frontend label: Other Expenditure
    // Database column: other_expenses
    result.expenditure["Other Expenditure"][year] =
      String(row.other_expenses ?? "");

    result.salary["Recruitment Salary"][year] =
      String(row.recruitment_salary ?? "");

    result.salary["Franchisee Salary"][year] =
      String(row.franchisee_salary ?? "");

    result.salary["Job portal Salary"][year] =
      String(row.job_portal_salary ?? "");

    result.incomeReceived["Income Received"][year] =
      String(row.income_received ?? "");

    result.netIncomeBreakdown.Director[year] =
      row.director == null ? "" : String(row.director);

    result.netIncomeBreakdown["Key Expenses"][year] =
      row.key_expenses == null ? "" : String(row.key_expenses);

    result.netIncomeBreakdown["Lead Generation"][year] =
      row.lead_generation == null ? "" : String(row.lead_generation);

    result.tds[year] =
      row.tds == null ? "" : String(row.tds);

    result.netAmount[year] =
      row.net_amount == null ? "" : getNumber(row.net_amount);

    if (
      row.income_tax_percent !== null &&
      row.income_tax_percent !== undefined
    ) {
      result.incomeTaxPercentage = String(row.income_tax_percent);
    }
  });

  const allRequiredValues = [];

  Object.values(result.revenue).forEach((row) => {
    FINANCIAL_YEARS.forEach((year) => {
      allRequiredValues.push(row[year]);
    });
  });

  Object.values(result.expenditure).forEach((row) => {
    FINANCIAL_YEARS.forEach((year) => {
      allRequiredValues.push(row[year]);
    });
  });

  Object.values(result.salary).forEach((row) => {
    FINANCIAL_YEARS.forEach((year) => {
      allRequiredValues.push(row[year]);
    });
  });

  allRequiredValues.push(result.incomeTaxPercentage);

  result.isSaved = allRequiredValues.every(
    (value) => value !== "" && value !== null && value !== undefined
  );

  return result;
}

/* =========================================================
   GET REVENUE DATA
   GET /api/revenue
========================================================= */

async function getRevenueData(req, res) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase configuration is missing.",
        error: "Check SUPABASE_URL and SUPABASE_SECRET_KEY.",
      });
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("GET REVENUE SUPABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load Revenue data.",
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    return res.status(200).json({
      success: true,
      exists: data.length > 0,
      data: convertDatabaseRowsToFrontend(data),
      count: data.length,
    });
  } catch (error) {
    console.error("GET REVENUE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unexpected error while loading Revenue data.",
      error: error.message,
    });
  }
}

/* =========================================================
   SAVE REVENUE DATA
   POST /api/revenue
========================================================= */

async function saveRevenueData(req, res) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase configuration is missing.",
        error: "Check SUPABASE_URL and SUPABASE_SECRET_KEY.",
      });
    }

    let incomingData = req.body;

    // Support a payload wrapped in { data: {...} }.
    if (
      incomingData &&
      !Array.isArray(incomingData) &&
      incomingData.data &&
      typeof incomingData.data === "object" &&
      !Array.isArray(incomingData.data)
    ) {
      incomingData = incomingData.data;
    }

    if (
      !incomingData ||
      typeof incomingData !== "object" ||
      Array.isArray(incomingData)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Revenue request body.",
      });
    }

    const revenue = incomingData.revenue || {};
    const expenditure = incomingData.expenditure || {};
    const salary = incomingData.salary || {};
    const incomeReceived = incomingData.incomeReceived || {};

    const incomeTaxPercentage = getNumber(
      incomingData.incomeTaxPercentage
    );

    const breakdown = incomingData.netIncomeBreakdown || {};
    const incomingTds = incomingData.tds || {};

    // Read existing records to determine whether to insert or update.
    const {
      data: existingRows,
      error: existingError,
    } = await supabase
      .from(TABLE_NAME)
      .select("id, financial_year");

    if (existingError) {
      console.error("READ EXISTING REVENUE ERROR:", existingError);

      return res.status(500).json({
        success: false,
        message: "Unable to read existing Revenue records.",
        error: existingError.message,
        code: existingError.code,
        details: existingError.details,
        hint: existingError.hint,
      });
    }

    const existingByYear = new Map();

    (existingRows || []).forEach((row) => {
      if (!existingByYear.has(row.financial_year)) {
        existingByYear.set(row.financial_year, row);
      }
    });

    // Process each financial year and report the exact year on failure.
    for (const year of FINANCIAL_YEARS) {
      const calculated = calculateNetIncomeForYear(
        year,
        revenue,
        expenditure,
        salary,
        incomeTaxPercentage,
        incomeReceived
      );

      const tds = roundToTwo(getNumber(incomingTds[year]));

      const director = getValue(breakdown, "Director", year);
      const keyExpenses = getValue(breakdown, "Key Expenses", year);
      const leadGeneration = getValue(
        breakdown,
        "Lead Generation",
        year
      );

      const netAmount = roundToTwo(
        tds + director + keyExpenses + leadGeneration
      );

      const now = new Date().toISOString();

      const rowData = {
        financial_year: year,

        recruitment_revenue: getValue(
          revenue,
          "Recruitment Revenue",
          year
        ),
        franchisee_revenue: getValue(
          revenue,
          "Franchisee Revenue",
          year
        ),
        job_portal_revenue: getValue(
          revenue,
          "Job portal Revenue",
          year
        ),

        recruitment_expenditure: getValue(
          expenditure,
          "Recruitment Expenditure",
          year
        ),
        franchisee_expenditure: getValue(
          expenditure,
          "Franchisee Expenditure",
          year
        ),
        job_portal_expenditure: getValue(
          expenditure,
          "Job portal Expenditure",
          year
        ),

        // Maps "Other Expenditure" to other_expenses.
        other_expenses: calculated.otherExpenditure,

        recruitment_salary: getValue(
          salary,
          "Recruitment Salary",
          year
        ),
        franchisee_salary: getValue(
          salary,
          "Franchisee Salary",
          year
        ),
        job_portal_salary: getValue(
          salary,
          "Job portal Salary",
          year
        ),

        // Income Received database column.
        income_received: calculated.additionalIncome,

        income_tax_percent: incomeTaxPercentage,

        tds,
        director,
        key_expenses: keyExpenses,
        lead_generation: leadGeneration,
        net_amount: netAmount,
        updated_at: now,
      };

      const existingRow = existingByYear.get(year);

      let saveResult;

      if (existingRow) {
        saveResult = await supabase
          .from(TABLE_NAME)
          .update(rowData)
          .eq("id", existingRow.id)
          .select("*")
          .single();
      } else {
        saveResult = await supabase
          .from(TABLE_NAME)
          .insert({
            ...rowData,
            created_at: now,
          })
          .select("*")
          .single();
      }

      if (saveResult.error) {
        console.error("SUPABASE REVENUE SAVE ERROR:", {
          financialYear: year,
          message: saveResult.error.message,
          code: saveResult.error.code,
          details: saveResult.error.details,
          hint: saveResult.error.hint,
        });

        return res.status(500).json({
          success: false,
          message: `Unable to save Revenue data for ${year}.`,
          error: saveResult.error.message,
          code: saveResult.error.code,
          details: saveResult.error.details,
          hint: saveResult.error.hint,
        });
      }
    }

    // Fetch saved records so the frontend receives the persisted values.
    const { data: savedRows, error: readBackError } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("id", { ascending: true });

    if (readBackError) {
      console.error("REVENUE READ-BACK ERROR:", readBackError);

      return res.status(500).json({
        success: false,
        message: "Saved data could not be reloaded.",
        error: readBackError.message,
        code: readBackError.code,
        details: readBackError.details,
        hint: readBackError.hint,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Revenue data saved successfully.",
      data: convertDatabaseRowsToFrontend(savedRows),
      count: savedRows.length,
    });
  } catch (error) {
    console.error("UNEXPECTED REVENUE SAVE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unexpected error while saving Revenue data.",
      error: error.message,
    });
  }
}

/* =========================================================
   EXPORT CONTROLLER FUNCTIONS
========================================================= */

module.exports = {
  getRevenueData,
  saveRevenueData,
};
