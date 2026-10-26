
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
   FINANCIAL YEARS
========================================================= */

const financialYears = [
  "FY 2021-2022",
  "FY 2022-2023",
  "FY 2023-2024",
];

const revenueRows = [
  "Recruitment Revenue",
  "Franchisee Revenue",
  "Job portal Revenue",
];

const expenditureRows = [
  "Recruitment Expenditure",
  "Franchisee Expenditure",
  "Job portal Expenditure",
  "Other Expenditure",
];

const salaryRows = [
  "Recruitment Salary",
  "Franchisee Salary",
  "Job portal Salary",
];

const incomeRows = ["Income Received"];

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

function hasValue(value) {
  return value !== "" && value !== null && value !== undefined;
}

function createInitialRowData(rows) {
  const result = {};

  rows.forEach((row) => {
    result[row] = {};

    financialYears.forEach((year) => {
      result[row][year] = "";
    });
  });

  return result;
}

function createEmptyRevenueData() {
  const netIncomeBreakdown = {
    Director: {},
    "Key Expenses": {},
    "Lead Generation": {},
  };

  const tds = {};

  financialYears.forEach((year) => {
    netIncomeBreakdown.Director[year] = "";
    netIncomeBreakdown["Key Expenses"][year] = "";
    netIncomeBreakdown["Lead Generation"][year] = "";
    tds[year] = "";
  });

  return {
    revenue: createInitialRowData(revenueRows),
    expenditure: createInitialRowData(expenditureRows),
    salary: createInitialRowData(salaryRows),
    incomeReceived: createInitialRowData(incomeRows),
    incomeTaxPercentage: "",
    netIncomeBreakdown,
    tds,
    netAmount: {},
    isSaved: false,
  };
}

/* =========================================================
   CALCULATE REVENUE
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
   CONVERT DATABASE ROWS TO FRONTEND FORMAT
========================================================= */

function convertDatabaseRowsToFrontend(rows) {
  const result = createEmptyRevenueData();

  if (!Array.isArray(rows)) {
    return result;
  }

  rows.forEach((row) => {
    const year = row.financial_year;

    if (!financialYears.includes(year)) {
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

    if (
      row.income_tax_percent !== null &&
      row.income_tax_percent !== undefined
    ) {
      result.incomeTaxPercentage = String(row.income_tax_percent);
    }

    result.netIncomeBreakdown.Director[year] =
      row.director == null ? "" : String(row.director);

    result.netIncomeBreakdown["Key Expenses"][year] =
      row.key_expenses == null ? "" : String(row.key_expenses);

    result.netIncomeBreakdown["Lead Generation"][year] =
      row.lead_generation == null ? "" : String(row.lead_generation);

    result.tds[year] = row.tds == null ? "" : String(row.tds);

    result.netAmount[year] =
      row.net_amount == null ? "" : getNumber(row.net_amount);
  });

  const requiredValues = [];

  Object.values(result.revenue).forEach((row) => {
    financialYears.forEach((year) => requiredValues.push(row[year]));
  });

  Object.values(result.expenditure).forEach((row) => {
    financialYears.forEach((year) => requiredValues.push(row[year]));
  });

  Object.values(result.salary).forEach((row) => {
    financialYears.forEach((year) => requiredValues.push(row[year]));
  });

  requiredValues.push(result.incomeTaxPercentage);

  result.isSaved = requiredValues.every(hasValue);

  return result;
}

/* =========================================================
   GET REVENUE DATA
========================================================= */

async function getRevenueData(req, res) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase environment variables are not configured.",
      });
    }

    const { data, error } = await supabase
      .from("revenue")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("SUPABASE GET REVENUE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load Revenue data.",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      exists: Array.isArray(data) && data.length > 0,
      data: convertDatabaseRowsToFrontend(data),
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error("GET REVENUE DATA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Revenue data.",
      error: error.message,
    });
  }
}

/* =========================================================
   SAVE REVENUE DATA
========================================================= */

async function saveRevenueData(req, res) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase environment variables are not configured.",
      });
    }

    let incomingData = req.body;

    if (
      incomingData &&
      !Array.isArray(incomingData) &&
      incomingData.data &&
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
        message: "Invalid Revenue data format.",
      });
    }

    const revenue = incomingData.revenue || {};
    const expenditure = incomingData.expenditure || {};
    const salary = incomingData.salary || {};
    const incomeReceived = incomingData.incomeReceived || {};
    const incomeTaxPercentage = incomingData.incomeTaxPercentage ?? "";
    const breakdown = incomingData.netIncomeBreakdown || {};
    const incomingTds = incomingData.tds || {};

    const { data: existingRows, error: existingError } = await supabase
      .from("revenue")
      .select("*")
      .order("id", { ascending: true });

    if (existingError) {
      console.error("SUPABASE EXISTING ROWS ERROR:", existingError);

      return res.status(500).json({
        success: false,
        message: "Unable to read existing Revenue records.",
        error: existingError.message,
      });
    }

    for (const year of financialYears) {
      const existingRow = existingRows?.find(
        (row) => row.financial_year === year
      );

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
      const leadGeneration = getValue(breakdown, "Lead Generation", year);

      // Preserves the existing frontend Net Amount calculation.
      const netAmount = roundToTwo(
        tds + director + keyExpenses + leadGeneration
      );

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

        // Confirm this column exists in Supabase.
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

        // New field: Income Received.
        income_received: calculated.additionalIncome,

        income_tax_percent: getNumber(incomeTaxPercentage),

        tds,
        director,
        key_expenses: keyExpenses,
        lead_generation: leadGeneration,
        net_amount: netAmount,
        updated_at: new Date().toISOString(),
      };

      let saveResult;

      if (existingRow) {
        saveResult = await supabase
          .from("revenue")
          .update(rowData)
          .eq("id", existingRow.id)
          .select("*")
          .single();
      } else {
        saveResult = await supabase
          .from("revenue")
          .insert({
            ...rowData,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single();
      }

      if (saveResult.error) {
        console.error(`SUPABASE SAVE ERROR (${year}):`, saveResult.error);

        return res.status(500).json({
          success: false,
          message: `Unable to save Revenue data for ${year}.`,
          error: saveResult.error.message,
        });
      }
    }

    const { data: savedRows, error: readBackError } = await supabase
      .from("revenue")
      .select("*")
      .order("id", { ascending: true });

    if (readBackError) {
      console.error("SUPABASE READ-BACK ERROR:", readBackError);

      return res.status(500).json({
        success: false,
        message: "Revenue was saved but could not be read back.",
        error: readBackError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Revenue data saved successfully.",
      data: convertDatabaseRowsToFrontend(savedRows),
      count: Array.isArray(savedRows) ? savedRows.length : 0,
    });
  } catch (error) {
    console.error("SAVE REVENUE DATA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save Revenue data.",
      error: error.message,
    });
  }
}

module.exports = {
  getRevenueData,
  saveRevenueData,
};
