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

/*
---------------------------------------------------------
Get value from frontend nested structure
---------------------------------------------------------
*/

function getValue(object, row, year) {
  return getNumber(
    object?.[row]?.[year]
  );
}

/*
---------------------------------------------------------
Round number to 2 decimal places
---------------------------------------------------------
*/

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
    "Lead Generation": {},
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

  /*
  -------------------------------------------------------
  Revenue
  -------------------------------------------------------
  */

  revenueRows.forEach((row) => {
    revenue[row] = {};

    financialYears.forEach((year) => {
      revenue[row][year] = "";
    });
  });

  /*
  -------------------------------------------------------
  Expenditure
  -------------------------------------------------------
  */

  expenditureRows.forEach((row) => {
    expenditure[row] = {};

    financialYears.forEach((year) => {
      expenditure[row][year] = "";
    });
  });

  /*
  -------------------------------------------------------
  Salary
  -------------------------------------------------------
  */

  salaryRows.forEach((row) => {
    salary[row] = {};

    financialYears.forEach((year) => {
      salary[row][year] = "";
    });
  });

  /*
  -------------------------------------------------------
  Net Income Breakdown
  -------------------------------------------------------
  */

  Object.keys(netIncomeBreakdown).forEach(
    (row) => {
      financialYears.forEach((year) => {
        netIncomeBreakdown[row][year] = "";
      });
    }
  );

  return {
    revenue,
    expenditure,
    salary,

    incomeTaxPercentage: "",

    netIncomeBreakdown,

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

function convertDatabaseRowsToFrontend(rows) {
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
    REVENUE
    =======================================================
    */

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

    /*
    =======================================================
    EXPENDITURE
    =======================================================
    */

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

    /*
    =======================================================
    SALARY
    =======================================================
    */

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
    =======================================================
    INCOME TAX
    =======================================================
    */

    if (
      result.incomeTaxPercentage === "" &&
      row.income_tax_percent !== null &&
      row.income_tax_percent !== undefined
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

    /*
    -------------------------------------------------------
    Director
    -------------------------------------------------------
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

    /*
    -------------------------------------------------------
    Key Expenses
    -------------------------------------------------------
    */

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

    /*
    -------------------------------------------------------
    Lead Generation
    -------------------------------------------------------
    */

    if (
      row.lead_generation !== null &&
      row.lead_generation !== undefined
    ) {
      result.netIncomeBreakdown[
        "Lead Generation"
      ][year] = String(
        row.lead_generation
      );
    }

    /*
    =======================================================
    TDS
    =======================================================
    */

    if (
      row.tds !== null &&
      row.tds !== undefined
    ) {
      result.tds[year] =
        getNumber(row.tds);
    }

    /*
    =======================================================
    NET AMOUNT
    =======================================================
    */

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

  const requiredValues = [];

  /*
  -------------------------------------------------------
  Revenue
  -------------------------------------------------------
  */

  Object.values(
    result.revenue
  ).forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(
        row[year]
      );
    });
  });

  /*
  -------------------------------------------------------
  Expenditure
  -------------------------------------------------------
  */

  Object.values(
    result.expenditure
  ).forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(
        row[year]
      );
    });
  });

  /*
  -------------------------------------------------------
  Salary
  -------------------------------------------------------
  */

  Object.values(
    result.salary
  ).forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(
        row[year]
      );
    });
  });

  /*
  -------------------------------------------------------
  Income Tax
  -------------------------------------------------------
  */

  requiredValues.push(
    result.incomeTaxPercentage
  );

  /*
  -------------------------------------------------------
  Breakdown, TDS and Net Amount are optional.
  -------------------------------------------------------
  */

  const allRequiredFieldsFilled =
    requiredValues.every(
      (value) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    );

  result.isSaved =
    allRequiredFieldsFilled;

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
  /*
  =======================================================
  REVENUE
  =======================================================
  */

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

  /*
  =======================================================
  EXPENDITURE
  =======================================================
  */

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

  /*
  =======================================================
  SALARY
  =======================================================
  */

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
  =======================================================
  FINAL REVENUE BY SEGMENT
  =======================================================
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

  /*
  =======================================================
  OVERALL REVENUE
  =======================================================
  */

  const overallRevenue =
    recruitment +
    franchisee +
    jobPortal;

  /*
  =======================================================
  INCOME TAX
  =======================================================
  */

  const incomeTax =
    overallRevenue *
    (
      getNumber(
        incomeTaxPercentage
      ) / 100
    );

  /*
  =======================================================
  NET INCOME
  =======================================================
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
      roundToTwo(
        incomeTax
      ),

    netIncome:
      roundToTwo(
        netIncome
      ),
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
        error:
          error.message,
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
      error:
        error.message,
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
    /*
    =======================================================
    SUPABASE CHECK
    =======================================================
    */

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase environment variables are not configured",
      });
    }

    /*
    =======================================================
    READ REQUEST BODY
    =======================================================
    */

    let incomingData =
      req.body;

    /*
    Support:

    {
      revenue: {...}
    }

    and:

    {
      data: {
        revenue: {...}
      }
    }
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

    /*
    =======================================================
    VALIDATE REQUEST
    =======================================================
    */

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

    /*
    =======================================================
    EXTRACT DATA
    =======================================================
    */

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
    TDS FROM FRONTEND
    =======================================================

    IMPORTANT:

    TDS is editable in the frontend.

    Therefore DO NOT recalculate it as
    10% of Net Income.

    Use the value entered by the user.
    =======================================================
    */

    const incomingTds =
      incomingData.tds ||
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
      .select("*")
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
    SAVE EACH FINANCIAL YEAR
    =======================================================
    */

    for (const year of financialYears) {
      /*
      -----------------------------------------------------
      Find existing row
      -----------------------------------------------------
      */

      const existingRow =
        existingRows?.find(
          (row) =>
            row.financial_year ===
            year
        );

      /*
      =====================================================
      CALCULATE NET INCOME
      =====================================================
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
      =====================================================
      TDS
      =====================================================

      Use the actual TDS entered in the frontend.
      =====================================================
      */

      const tds =
        roundToTwo(
          getNumber(
            incomingTds?.[year]
          )
        );

      /*
      =====================================================
      DIRECTOR
      =====================================================
      */

      const director =
        getValue(
          netIncomeBreakdown,
          "Director",
          year
        );

      /*
      =====================================================
      KEY EXPENSES
      =====================================================
      */

      const keyExpenses =
        getValue(
          netIncomeBreakdown,
          "Key Expenses",
          year
        );

      /*
      =====================================================
      LEAD GENERATION
      =====================================================
      */

      const leadGeneration =
        getValue(
          netIncomeBreakdown,
          "Lead Generation",
          year
        );

      /*
      =====================================================
      NET AMOUNT
      =====================================================

      TDS
      + Director
      + Key Expenses
      + Lead Generation
      =====================================================
      */

      const netAmount =
        roundToTwo(
          tds +
          director +
          keyExpenses +
          leadGeneration
        );

      /*
      =====================================================
      DATABASE ROW
      =====================================================
      */

      const rowData = {
        financial_year:
          year,

        /*
        ---------------------------------------------------
        REVENUE
        ---------------------------------------------------
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
        ---------------------------------------------------
        EXPENDITURE
        ---------------------------------------------------
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
        ---------------------------------------------------
        SALARY
        ---------------------------------------------------
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
        ---------------------------------------------------
        INCOME TAX
        ---------------------------------------------------
        */

        income_tax_percent:
          getNumber(
            incomeTaxPercentage
          ),

        /*
        ===================================================
        NET INCOME BREAKDOWN
        ===================================================
        */

        /*
        TDS
        */

        tds,

        /*
        Director
        */

        director,

        /*
        Key Expenses
        */

        key_expenses:
          keyExpenses,

        /*
        Lead Generation
        */

        lead_generation:
          leadGeneration,

        /*
        Calculated Net Amount
        */

        net_amount:
          netAmount,

        /*
        Updated timestamp
        */

        updated_at:
          new Date().toISOString(),
      };

      /*
      =====================================================
      UPDATE EXISTING ROW
      =====================================================
      */

      let result;

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
      =====================================================
      INSERT NEW ROW
      =====================================================
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

      /*
      =====================================================
      SUPABASE SAVE ERROR
      =====================================================
      */

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

    /*
    =======================================================
    CONVERT BACK TO FRONTEND
    =======================================================
    */

    const frontendData =
      convertDatabaseRowsToFrontend(
        savedRows
      );

    /*
    =======================================================
    SUCCESS LOG
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
      "TDS: saved from frontend"
    );

    console.log(
      "Director: saved"
    );

    console.log(
      "Key Expenses: saved"
    );

    console.log(
      "Lead Generation: saved"
    );

    console.log(
      "Net Amount: calculated and saved"
    );

    console.log(
      "=========================================="
    );

    /*
    =======================================================
    RESPONSE
    =======================================================
    */

    return res.status(200).json({
      success: true,

      message:
        "Revenue data saved successfully",

      data:
        frontendData,

      count:
        Array.isArray(savedRows)
          ? savedRows.length
          : 0,
    });
  } catch (error) {
    /*
    =======================================================
    UNEXPECTED ERROR
    =======================================================
    */

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

      error:
        error.message,
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