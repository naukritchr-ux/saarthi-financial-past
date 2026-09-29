const { createClient } = require("@supabase/supabase-js");

/*
=========================================================
SUPABASE CONFIGURATION
=========================================================
*/

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey)
    : null;

/*
=========================================================
FINANCIAL YEARS
Must match the React Revenue component
=========================================================
*/

const financialYears = [
  "FY 2021-2022",
  "FY 2022-2023",
  "FY 2023-2024",
];

/*
=========================================================
HELPERS
=========================================================
*/

function getNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getValue(object, row, year) {
  return getNumber(
    object?.[row]?.[year]
  );
}

/*
=========================================================
CREATE EMPTY FRONTEND STRUCTURE
=========================================================
*/

function createEmptyRevenueData() {
  const revenue = {};
  const expenditure = {};
  const salary = {};

  const revenueRows = [
    "Recruitment Revenue",
    "Franchisee Revenue",
    "Job portal Revenue",
  ];

  const expenditureRows = [
    "Recruitment Expenditure",
    "Franchisee Expenditure",
    "Job portal Expenditure",
  ];

  const salaryRows = [
    "Recruitment Salary",
    "Franchisee Salary",
    "Job portal Salary",
  ];

  revenueRows.forEach((row) => {
    revenue[row] = {};

    financialYears.forEach((year) => {
      revenue[row][year] = "";
    });
  });

  expenditureRows.forEach((row) => {
    expenditure[row] = {};

    financialYears.forEach((year) => {
      expenditure[row][year] = "";
    });
  });

  salaryRows.forEach((row) => {
    salary[row] = {};

    financialYears.forEach((year) => {
      salary[row][year] = "";
    });
  });

  return {
    revenue,
    expenditure,
    salary,
    incomeTaxPercentage: "",
    isSaved: false,
  };
}

/*
=========================================================
CONVERT SUPABASE ROWS → REACT FORMAT
=========================================================
*/

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

    result.revenue[
      "Recruitment Revenue"
    ][year] = String(
      row.recruitment_revenue ?? ""
    );

    result.revenue[
      "Franchisee Revenue"
    ][year] = String(
      row.franchisee_revenue ?? ""
    );

    result.revenue[
      "Job portal Revenue"
    ][year] = String(
      row.job_portal_revenue ?? ""
    );

    result.expenditure[
      "Recruitment Expenditure"
    ][year] = String(
      row.recruitment_expenditure ?? ""
    );

    result.expenditure[
      "Franchisee Expenditure"
    ][year] = String(
      row.franchisee_expenditure ?? ""
    );

    result.expenditure[
      "Job portal Expenditure"
    ][year] = String(
      row.job_portal_expenditure ?? ""
    );

    result.salary[
      "Recruitment Salary"
    ][year] = String(
      row.recruitment_salary ?? ""
    );

    result.salary[
      "Franchisee Salary"
    ][year] = String(
      row.franchisee_salary ?? ""
    );

    result.salary[
      "Job portal Salary"
    ][year] = String(
      row.job_portal_salary ?? ""
    );

    /*
    Income tax percentage is currently one value
    used for all financial years in the React UI.

    We take it from the first available row.
    */
    if (
      result.incomeTaxPercentage === "" &&
      row.income_tax_percent !== null &&
      row.income_tax_percent !== undefined
    ) {
      result.incomeTaxPercentage = String(
        row.income_tax_percent
      );
    }
  });

  /*
  =======================================================
  DETERMINE LOCK STATE
  =======================================================
  */

  const allValues = [];

  Object.values(result.revenue).forEach(
    (row) => {
      financialYears.forEach((year) => {
        allValues.push(row[year]);
      });
    }
  );

  Object.values(result.expenditure).forEach(
    (row) => {
      financialYears.forEach((year) => {
        allValues.push(row[year]);
      });
    }
  );

  Object.values(result.salary).forEach(
    (row) => {
      financialYears.forEach((year) => {
        allValues.push(row[year]);
      });
    }
  );

  allValues.push(result.incomeTaxPercentage);

  const allFieldsFilled = allValues.every(
    (value) =>
      value !== "" &&
      value !== null &&
      value !== undefined
  );

  result.isSaved = allFieldsFilled;

  return result;
}

/*
=========================================================
GET REVENUE DATA
=========================================================
*/

async function getRevenueData(req, res) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase environment variables are not configured",
      });
    }

    const { data, error } = await supabase
      .from("revenue")
      .select("*")
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "=========================================="
      );
      console.error(
        "SUPABASE GET REVENUE ERROR"
      );
      console.error(
        "Message:",
        error.message
      );
      console.error(
        "Details:",
        error.details
      );
      console.error(
        "Hint:",
        error.hint
      );
      console.error(
        "Code:",
        error.code
      );
      console.error(
        "=========================================="
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load Revenue data",
        error: error.message,
      });
    }

    const frontendData =
      convertDatabaseRowsToFrontend(data);

    return res.status(200).json({
      success: true,
      exists: Array.isArray(data) && data.length > 0,
      data: frontendData,
      count: Array.isArray(data)
        ? data.length
        : 0,
    });
  } catch (error) {
    console.error(
      "=========================================="
    );
    console.error(
      "GET REVENUE DATA ERROR"
    );
    console.error(
      "Error name:",
      error.name
    );
    console.error(
      "Error message:",
      error.message
    );
    console.error(
      "Error stack:",
      error.stack
    );
    console.error(
      "=========================================="
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load Revenue data",
      error: error.message,
    });
  }
}

/*
=========================================================
SAVE REVENUE DATA
=========================================================
*/

async function saveRevenueData(req, res) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase environment variables are not configured",
      });
    }

    let incomingData = req.body;

    /*
    Support both:

    {
      revenue: {...},
      expenditure: {...},
      salary: {...},
      incomeTaxPercentage: "30"
    }

    OR

    {
      data: {
        revenue: {...},
        expenditure: {...},
        salary: {...},
        incomeTaxPercentage: "30"
      }
    }
    */

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
        message:
          "Invalid Revenue data format",
      });
    }

    const revenue =
      incomingData.revenue || {};

    const expenditure =
      incomingData.expenditure || {};

    const salary =
      incomingData.salary || {};

    const incomeTaxPercentage =
      incomingData.incomeTaxPercentage ?? "";

    /*
    =======================================================
    GET EXISTING DATABASE ROWS
    =======================================================
    */

    const {
      data: existingRows,
      error: existingError,
    } = await supabase
      .from("revenue")
      .select("id, financial_year")
      .order("id", {
        ascending: true,
      });

    if (existingError) {
      console.error(
        "SUPABASE EXISTING ROWS ERROR:",
        existingError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to read existing Revenue records",
        error: existingError.message,
      });
    }

    /*
    =======================================================
    UPDATE EACH FINANCIAL YEAR
    =======================================================
    */

    for (const year of financialYears) {
      const existingRow =
        existingRows?.find(
          (row) =>
            row.financial_year === year
        );

      const rowData = {
        financial_year: year,

        recruitment_revenue:
          getValue(
            revenue,
            "Recruitment Revenue",
            year
          ),

        franchisee_revenue:
          getValue(
            revenue,
            "Franchisee Revenue",
            year
          ),

        job_portal_revenue:
          getValue(
            revenue,
            "Job portal Revenue",
            year
          ),

        recruitment_expenditure:
          getValue(
            expenditure,
            "Recruitment Expenditure",
            year
          ),

        franchisee_expenditure:
          getValue(
            expenditure,
            "Franchisee Expenditure",
            year
          ),

        job_portal_expenditure:
          getValue(
            expenditure,
            "Job portal Expenditure",
            year
          ),

        recruitment_salary:
          getValue(
            salary,
            "Recruitment Salary",
            year
          ),

        franchisee_salary:
          getValue(
            salary,
            "Franchisee Salary",
            year
          ),

        job_portal_salary:
          getValue(
            salary,
            "Job portal Salary",
            year
          ),

        income_tax_percent:
          getNumber(
            incomeTaxPercentage
          ),

        updated_at:
          new Date().toISOString(),
      };

      let result;

      /*
      Existing financial year:
      UPDATE the existing row.
      */

      if (existingRow) {
        result = await supabase
          .from("revenue")
          .update(rowData)
          .eq("id", existingRow.id)
          .select("*")
          .single();
      }

      /*
      Financial year doesn't exist:
      INSERT a new row.
      */

      else {
        result = await supabase
          .from("revenue")
          .insert({
            ...rowData,
            created_at:
              new Date().toISOString(),
          })
          .select("*")
          .single();
      }

      if (result.error) {
        console.error(
          "=========================================="
        );
        console.error(
          "SUPABASE SAVE ERROR"
        );
        console.error(
          "Financial year:",
          year
        );
        console.error(
          "Message:",
          result.error.message
        );
        console.error(
          "Details:",
          result.error.details
        );
        console.error(
          "Hint:",
          result.error.hint
        );
        console.error(
          "Code:",
          result.error.code
        );
        console.error(
          "=========================================="
        );

        return res.status(500).json({
          success: false,
          message:
            `Unable to save Revenue data for ${year}`,
          error: result.error.message,
        });
      }
    }

    /*
    =======================================================
    READ BACK FROM SUPABASE
    This guarantees the frontend receives the actual
    saved database values.
    =======================================================
    */

    const {
      data: savedRows,
      error: readBackError,
    } = await supabase
      .from("revenue")
      .select("*")
      .order("id", {
        ascending: true,
      });

    if (readBackError) {
      console.error(
        "SUPABASE READ-BACK ERROR:",
        readBackError
      );

      return res.status(500).json({
        success: false,
        message:
          "Revenue was saved but could not be read back",
        error: readBackError.message,
      });
    }

    const frontendData =
      convertDatabaseRowsToFrontend(
        savedRows
      );

    /*
    =======================================================
    RESPONSE
    =======================================================
    */

    console.log(
      "=========================================="
    );
    console.log(
      "REVENUE DATA SAVED SUCCESSFULLY"
    );
    console.log(
      "Supabase table: revenue"
    );
    console.log(
      "Financial years:",
      financialYears.length
    );
    console.log(
      "=========================================="
    );

    return res.status(200).json({
      success: true,
      message:
        "Revenue data saved successfully",
      data: frontendData,
      count: Array.isArray(savedRows)
        ? savedRows.length
        : 0,
    });
  } catch (error) {
    console.error(
      "=========================================="
    );
    console.error(
      "SAVE REVENUE DATA ERROR"
    );
    console.error(
      "Error name:",
      error.name
    );
    console.error(
      "Error message:",
      error.message
    );
    console.error(
      "Error stack:",
      error.stack
    );
    console.error(
      "=========================================="
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save Revenue data",
      error: error.message,
    });
  }
}

/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  getRevenueData,
  saveRevenueData,
};
