const { createClient } = require("@supabase/supabase-js");

/*
=========================================================
SUPABASE CONFIGURATION
=========================================================
*/

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseSecretKey
    ? createClient(
        supabaseUrl,
        supabaseSecretKey
      )
    : null;

/*
=========================================================
FINANCIAL YEARS
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

  return Number.isFinite(number)
    ? number
    : 0;
}

function getValue(object, row, year) {
  return getNumber(
    object?.[row]?.[year]
  );
}

function roundToTwo(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
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

  const netIncomeBreakdown = {
    Director: {},
    "Key Expenses": {},
    "Other expenses": {},
  };

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

  Object.keys(
    netIncomeBreakdown
  ).forEach((row) => {
    financialYears.forEach((year) => {
      netIncomeBreakdown[row][year] =
        "";
    });
  });

  return {
    revenue,
    expenditure,
    salary,

    incomeTaxPercentage: "",

    netIncomeBreakdown,

    /*
      Calculated values are included in the
      response for completeness.
    */

    tds: {},
    netAmount: {},

    isSaved: false,
  };
}

/*
=========================================================
CONVERT SUPABASE ROWS → REACT FORMAT
=========================================================
*/

function convertDatabaseRowsToFrontend(
  rows
) {
  const result =
    createEmptyRevenueData();

  if (!Array.isArray(rows)) {
    return result;
  }

  rows.forEach((row) => {
    const year =
      row.financial_year;

    if (
      !financialYears.includes(year)
    ) {
      return;
    }

    /*
    =======================================================
    EXISTING REVENUE
    =======================================================
    */

    result.revenue[
      "Recruitment Revenue"
    ][year] = String(
      row.recruitment_revenue ??
        ""
    );

    result.revenue[
      "Franchisee Revenue"
    ][year] = String(
      row.franchisee_revenue ??
        ""
    );

    result.revenue[
      "Job portal Revenue"
    ][year] = String(
      row.job_portal_revenue ??
        ""
    );

    /*
    =======================================================
    EXISTING EXPENDITURE
    =======================================================
    */

    result.expenditure[
      "Recruitment Expenditure"
    ][year] = String(
      row.recruitment_expenditure ??
        ""
    );

    result.expenditure[
      "Franchisee Expenditure"
    ][year] = String(
      row.franchisee_expenditure ??
        ""
    );

    result.expenditure[
      "Job portal Expenditure"
    ][year] = String(
      row.job_portal_expenditure ??
        ""
    );

    /*
    =======================================================
    EXISTING SALARY
    =======================================================
    */

    result.salary[
      "Recruitment Salary"
    ][year] = String(
      row.recruitment_salary ??
        ""
    );

    result.salary[
      "Franchisee Salary"
    ][year] = String(
      row.franchisee_salary ??
        ""
    );

    result.salary[
      "Job portal Salary"
    ][year] = String(
      row.job_portal_salary ??
        ""
    );

    /*
    =======================================================
    INCOME TAX PERCENTAGE
    =======================================================
    */

    if (
      result.incomeTaxPercentage ===
        "" &&
      row.income_tax_percent !==
        null &&
      row.income_tax_percent !==
        undefined
    ) {
      result.incomeTaxPercentage =
        String(
          row.income_tax_percent
        );
    }

    /*
    =======================================================
    NET INCOME BREAKDOWN
    =======================================================
    */

    if (
      row.director !== null &&
      row.director !== undefined
    ) {
      result.netIncomeBreakdown[
        "Director"
      ][year] = String(
        row.director
      );
    }

    if (
      row.key_expenses !== null &&
      row.key_expenses !== undefined
    ) {
      result.netIncomeBreakdown[
        "Key Expenses"
      ][year] = String(
        row.key_expenses
      );
    }

    if (
      row.other_expenses !== null &&
      row.other_expenses !== undefined
    ) {
      result.netIncomeBreakdown[
        "Other expenses"
      ][year] = String(
        row.other_expenses
      );
    }

    /*
    =======================================================
    CALCULATED VALUES FROM DATABASE
    =======================================================
    */

    if (
      row.tds !== null &&
      row.tds !== undefined
    ) {
      result.tds[year] =
        getNumber(row.tds);
    }

    if (
      row.net_amount !== null &&
      row.net_amount !== undefined
    ) {
      result.netAmount[year] =
        getNumber(
          row.net_amount
        );
    }
  });

  /*
  =======================================================
  DETERMINE LOCK STATE
  =======================================================
  */

  const allValues = [];

  Object.values(
    result.revenue
  ).forEach((row) => {
    financialYears.forEach(
      (year) => {
        allValues.push(
          row[year]
        );
      }
    );
  });

  Object.values(
    result.expenditure
  ).forEach((row) => {
    financialYears.forEach(
      (year) => {
        allValues.push(
          row[year]
        );
      }
    );
  });

  Object.values(
    result.salary
  ).forEach((row) => {
    financialYears.forEach(
      (year) => {
        allValues.push(
          row[year]
        );
      }
    );
  });

  allValues.push(
    result.incomeTaxPercentage
  );

  /*
  ---------------------------------------------------------
  New user-entered breakdown fields.
  TDS and Net Amount are calculated, therefore
  they are NOT required here.
  ---------------------------------------------------------
  */

  Object.values(
    result.netIncomeBreakdown
  ).forEach((row) => {
    financialYears.forEach(
      (year) => {
        allValues.push(
          row[year]
        );
      }
    );
  });

  const allFieldsFilled =
    allValues.every(
      (value) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    );

  result.isSaved =
    allFieldsFilled;

  return result;
}

/*
=========================================================
CALCULATE OVERALL REVENUE
=========================================================
*/

function calculateNetIncomeForYear(
  year,
  revenue,
  expenditure,
  salary,
  incomeTaxPercentage
) {
  const recruitmentRevenue =
    getValue(
      revenue,
      "Recruitment Revenue",
      year
    );

  const franchiseeRevenue =
    getValue(
      revenue,
      "Franchisee Revenue",
      year
    );

  const jobPortalRevenue =
    getValue(
      revenue,
      "Job portal Revenue",
      year
    );

  const recruitmentExpenditure =
    getValue(
      expenditure,
      "Recruitment Expenditure",
      year
    );

  const franchiseeExpenditure =
    getValue(
      expenditure,
      "Franchisee Expenditure",
      year
    );

  const jobPortalExpenditure =
    getValue(
      expenditure,
      "Job portal Expenditure",
      year
    );

  const recruitmentSalary =
    getValue(
      salary,
      "Recruitment Salary",
      year
    );

  const franchiseeSalary =
    getValue(
      salary,
      "Franchisee Salary",
      year
    );

  const jobPortalSalary =
    getValue(
      salary,
      "Job portal Salary",
      year
    );

  /*
  ---------------------------------------------------------
  Final revenue
  ---------------------------------------------------------
  */

  const recruitment =
    recruitmentRevenue -
    recruitmentExpenditure -
    recruitmentSalary;

  const franchisee =
    franchiseeRevenue -
    franchiseeExpenditure -
    franchiseeSalary;

  const jobPortal =
    jobPortalRevenue -
    jobPortalExpenditure -
    jobPortalSalary;

  const overallRevenue =
    recruitment +
    franchisee +
    jobPortal;

  /*
  ---------------------------------------------------------
  Income tax
  ---------------------------------------------------------
  */

  const incomeTax =
    overallRevenue *
    (getNumber(
      incomeTaxPercentage
    ) / 100);

  /*
  ---------------------------------------------------------
  Net income
  ---------------------------------------------------------
  */

  const netIncome =
    overallRevenue -
    incomeTax;

  return {
    overallRevenue:
      roundToTwo(
        overallRevenue
      ),

    incomeTax:
      roundToTwo(incomeTax),

    netIncome:
      roundToTwo(netIncome),
  };
}

/*
=========================================================
GET REVENUE DATA
=========================================================
*/

async function getRevenueData(
  req,
  res
) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase environment variables are not configured",
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from("revenue")
      .select("*")
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "SUPABASE GET REVENUE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load Revenue data",
        error: error.message,
      });
    }

    const frontendData =
      convertDatabaseRowsToFrontend(
        data
      );

    return res.status(200).json({
      success: true,

      exists:
        Array.isArray(data) &&
        data.length > 0,

      data: frontendData,

      count:
        Array.isArray(data)
          ? data.length
          : 0,
    });
  } catch (error) {
    console.error(
      "GET REVENUE DATA ERROR:",
      error
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

async function saveRevenueData(
  req,
  res
) {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase environment variables are not configured",
      });
    }

    let incomingData =
      req.body;

    /*
    -------------------------------------------------------
    Support:
    
    {
      revenue: {...},
      expenditure: {...},
      ...
    }

    OR:

    {
      data: {
        revenue: {...},
        ...
      }
    }
    -------------------------------------------------------
    */

    if (
      incomingData &&
      !Array.isArray(
        incomingData
      ) &&
      incomingData.data &&
      !Array.isArray(
        incomingData.data
      )
    ) {
      incomingData =
        incomingData.data;
    }

    if (
      !incomingData ||
      typeof incomingData !==
        "object" ||
      Array.isArray(
        incomingData
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Revenue data format",
      });
    }

    const revenue =
      incomingData.revenue ||
      {};

    const expenditure =
      incomingData.expenditure ||
      {};

    const salary =
      incomingData.salary ||
      {};

    const incomeTaxPercentage =
      incomingData.incomeTaxPercentage ??
      "";

    const netIncomeBreakdown =
      incomingData.netIncomeBreakdown ||
      {};

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
        error:
          existingError.message,
      });
    }

    /*
    =======================================================
    CALCULATE + VALIDATE + SAVE EACH YEAR
    =======================================================
    */

    for (const year of financialYears) {
      const existingRow =
        existingRows?.find(
          (row) =>
            row.financial_year ===
            year
        );

      /*
      -----------------------------------------------------
      Calculate Net Income from existing Revenue logic
      -----------------------------------------------------
      */

      const calculated =
        calculateNetIncomeForYear(
          year,
          revenue,
          expenditure,
          salary,
          incomeTaxPercentage
        );

      /*
      -----------------------------------------------------
      TDS = 10% of Net Income
      -----------------------------------------------------
      */

      const tds =
        roundToTwo(
          calculated.netIncome *
            0.10
        );

      /*
      -----------------------------------------------------
      User entered values
      -----------------------------------------------------
      */

      const director =
        getValue(
          netIncomeBreakdown,
          "Director",
          year
        );

      const keyExpenses =
        getValue(
          netIncomeBreakdown,
          "Key Expenses",
          year
        );

      const otherExpenses =
        getValue(
          netIncomeBreakdown,
          "Other expenses",
          year
        );

      /*
      -----------------------------------------------------
      Net Amount
      -----------------------------------------------------
      */

      const netAmount =
        roundToTwo(
          tds +
          director +
          keyExpenses +
          otherExpenses
        );

      /*
      -----------------------------------------------------
      IMPORTANT VALIDATION
      -----------------------------------------------------

      Net Amount MUST equal Net Income.
      -----------------------------------------------------
      */

      const difference =
        Math.abs(
          netAmount -
            calculated.netIncome
        );

      if (difference > 0.01) {
        return res.status(400).json({
          success: false,
          message:
            `Net Income Breakdown does not reconcile for ${year}. ` +
            `Net Income is ${calculated.netIncome.toFixed(
              2
            )}, but Net Amount is ${netAmount.toFixed(
              2
            )}. ` +
            `TDS + Director + Key Expenses + Other expenses must equal Net Income.`,
        });
      }

      /*
      -----------------------------------------------------
      DATABASE ROW
      -----------------------------------------------------

      Existing fields remain unchanged.
      New breakdown values are simply added.
      -----------------------------------------------------
      */

      const rowData = {
        financial_year:
          year,

        /*
        Existing Revenue
        */

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

        /*
        Existing Expenditure
        */

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

        /*
        Existing Salary
        */

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

        /*
        Existing Income Tax
        */

        income_tax_percent:
          getNumber(
            incomeTaxPercentage
          ),

        /*
        ===================================================
        NEW NET INCOME BREAKDOWN
        ===================================================
        */

        tds,

        director,

        key_expenses:
          keyExpenses,

        other_expenses:
          otherExpenses,

        net_amount:
          netAmount,

        updated_at:
          new Date().toISOString(),
      };

      let result;

      /*
      -----------------------------------------------------
      EXISTING YEAR → UPDATE
      -----------------------------------------------------
      */

      if (existingRow) {
        result =
          await supabase
            .from("revenue")
            .update(rowData)
            .eq(
              "id",
              existingRow.id
            )
            .select("*")
            .single();
      }

      /*
      -----------------------------------------------------
      NEW YEAR → INSERT
      -----------------------------------------------------
      */

      else {
        result =
          await supabase
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
          "SUPABASE SAVE ERROR:",
          result.error
        );

        return res.status(500).json({
          success: false,
          message:
            `Unable to save Revenue data for ${year}`,
          error:
            result.error.message,
        });
      }
    }

    /*
    =======================================================
    READ BACK FROM SUPABASE
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
        error:
          readBackError.message,
      });
    }

    const frontendData =
      convertDatabaseRowsToFrontend(
        savedRows
      );

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
      "Net Income Breakdown: saved"
    );

    console.log(
      "=========================================="
    );

    return res.status(200).json({
      success: true,

      message:
        "Revenue data saved successfully",

      data: frontendData,

      count:
        Array.isArray(savedRows)
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
