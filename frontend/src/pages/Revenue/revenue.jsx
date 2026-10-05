import React, { useEffect, useState } from "react";

import "./revenue.css";

/* =========================================================
   FINANCIAL YEARS
========================================================= */

const financialYears = [
  "FY 2021-2022",
  "FY 2022-2023",
  "FY 2023-2024",
];

/* =========================================================
   EXISTING ROWS
========================================================= */

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

/* =========================================================
   NET INCOME BREAKDOWN ROWS
========================================================= */

const breakdownRows = [
  "Director",
  "Key Expenses",
  "Other expenses",
];

/* =========================================================
   API
========================================================= */

const REVENUE_API_URL = "/api/revenue";

/* =========================================================
   INPUT COMPONENTS
========================================================= */

function AmountInput({ value, onChange, disabled }) {
  return (
    <input
      className="revenue-input"
      type="text"
      inputMode="decimal"
      value={value}
      placeholder="Enter amount"
      autoComplete="off"
      disabled={disabled}
      onChange={(event) => {
        const nextValue = event.target.value;

        if (
          nextValue === "" ||
          /^\d*\.?\d*$/.test(nextValue)
        ) {
          onChange(nextValue);
        }
      }}
    />
  );
}

function TaxInput({ value, onChange, disabled }) {
  return (
    <input
      className="revenue-input tax-input"
      type="text"
      inputMode="decimal"
      value={value}
      placeholder="%"
      autoComplete="off"
      disabled={disabled}
      onChange={(event) => {
        const nextValue = event.target.value;

        if (
          nextValue === "" ||
          /^\d*\.?\d*$/.test(nextValue)
        ) {
          onChange(nextValue);
        }
      }}
    />
  );
}

/* =========================================================
   HELPERS
========================================================= */

function createInitialData(rows) {
  const data = {};

  rows.forEach((row) => {
    data[row] = {};

    financialYears.forEach((year) => {
      data[row][year] = "";
    });
  });

  return data;
}

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

function hasValue(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined
  );
}

/* =========================================================
   INITIAL BREAKDOWN DATA

   Breakdown fields are OPTIONAL.
   Empty values are treated as 0 when calculating/saving.
========================================================= */

function createInitialBreakdownData() {
  const data = {};

  breakdownRows.forEach((row) => {
    data[row] = {};

    financialYears.forEach((year) => {
      data[row][year] = "";
    });
  });

  return data;
}

/* =========================================================
   REQUIRED FIELD CHECK

   IMPORTANT:
   Only these are required:
   - Revenue
   - Expenditure
   - Salary
   - Income Tax

   Net Income Breakdown fields are OPTIONAL.
========================================================= */

function checkAllRequiredFields(
  revenue,
  expenditure,
  salary,
  incomeTaxPercentage
) {
  const requiredValues = [];

  /* -------------------------------------------------------
     REVENUE
  ------------------------------------------------------- */

  revenueRows.forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(
        revenue?.[row]?.[year] ?? ""
      );
    });
  });

  /* -------------------------------------------------------
     EXPENDITURE
  ------------------------------------------------------- */

  expenditureRows.forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(
        expenditure?.[row]?.[year] ?? ""
      );
    });
  });

  /* -------------------------------------------------------
     SALARY
  ------------------------------------------------------- */

  salaryRows.forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(
        salary?.[row]?.[year] ?? ""
      );
    });
  });

  /* -------------------------------------------------------
     INCOME TAX
  ------------------------------------------------------- */

  requiredValues.push(
    incomeTaxPercentage ?? ""
  );

  const hasAnyRequiredValue =
    requiredValues.some((value) =>
      hasValue(value)
    );

  const allRequiredFieldsFilled =
    requiredValues.every((value) =>
      hasValue(value)
    );

  return {
    hasAnyValue: hasAnyRequiredValue,
    allFieldsFilled: allRequiredFieldsFilled,
  };
}

/* =========================================================
   REVENUE COMPONENT
========================================================= */

function Revenue() {
  /* -------------------------------------------------------
     EXISTING STATE
  ------------------------------------------------------- */

  const [revenue, setRevenue] = useState(() =>
    createInitialData(revenueRows)
  );

  const [expenditure, setExpenditure] =
    useState(() =>
      createInitialData(expenditureRows)
    );

  const [salary, setSalary] = useState(() =>
    createInitialData(salaryRows)
  );

  const [
    incomeTaxPercentage,
    setIncomeTaxPercentage,
  ] = useState("");

  /* -------------------------------------------------------
     NET INCOME BREAKDOWN STATE

     These fields are OPTIONAL.
  ------------------------------------------------------- */

  const [
    netIncomeBreakdown,
    setNetIncomeBreakdown,
  ] = useState(() =>
    createInitialBreakdownData()
  );

  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* =======================================================
     LOAD SHARED DATA
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadRevenueData() {
      try {
        setIsLoading(true);

        const response = await fetch(
          REVENUE_API_URL,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load Revenue data."
          );
        }

        /* -------------------------------------------------
           NO SAVED DATA
        ------------------------------------------------- */

        if (!result.exists || !result.data) {
          if (isMounted) {
            setRevenue(
              createInitialData(revenueRows)
            );

            setExpenditure(
              createInitialData(expenditureRows)
            );

            setSalary(
              createInitialData(salaryRows)
            );

            setIncomeTaxPercentage("");

            setNetIncomeBreakdown(
              createInitialBreakdownData()
            );

            setIsSaved(false);
          }

          return;
        }

        /* -------------------------------------------------
           EXISTING DATA
        ------------------------------------------------- */

        const savedData = result.data;

        const loadedRevenue =
          savedData.revenue ||
          createInitialData(revenueRows);

        const loadedExpenditure =
          savedData.expenditure ||
          createInitialData(expenditureRows);

        const loadedSalary =
          savedData.salary ||
          createInitialData(salaryRows);

        const loadedIncomeTaxPercentage =
          savedData.incomeTaxPercentage ?? "";

        const loadedBreakdown =
          savedData.netIncomeBreakdown ||
          createInitialBreakdownData();

        /* -------------------------------------------------
           DETERMINE LOCK STATE

           Only Revenue, Expenditure, Salary and Income Tax
           are required.

           Breakdown fields do NOT affect lock state.
        ------------------------------------------------- */

        const lockState =
          checkAllRequiredFields(
            loadedRevenue,
            loadedExpenditure,
            loadedSalary,
            loadedIncomeTaxPercentage
          ).allFieldsFilled;

        if (isMounted) {
          setRevenue(loadedRevenue);

          setExpenditure(
            loadedExpenditure
          );

          setSalary(loadedSalary);

          setIncomeTaxPercentage(
            loadedIncomeTaxPercentage
          );

          setNetIncomeBreakdown(
            loadedBreakdown
          );

          setIsSaved(lockState);
        }
      } catch (error) {
        console.error(
          "Failed to load shared Revenue data:",
          error
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRevenueData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =======================================================
     CHANGE HANDLERS
  ======================================================= */

  function handleRevenueChange(
    row,
    year,
    value
  ) {
    if (isSaved || isLoading) return;

    setRevenue((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleExpenditureChange(
    row,
    year,
    value
  ) {
    if (isSaved || isLoading) return;

    setExpenditure((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleSalaryChange(
    row,
    year,
    value
  ) {
    if (isSaved || isLoading) return;

    setSalary((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleIncomeTaxChange(value) {
    if (isSaved || isLoading) return;

    setIncomeTaxPercentage(value);
  }

  /* =======================================================
     NET INCOME BREAKDOWN CHANGE
  ======================================================= */

  function handleBreakdownChange(
    row,
    year,
    value
  ) {
    if (isSaved || isLoading) return;

    setNetIncomeBreakdown((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  /* =======================================================
     FIELD CHECK
  ======================================================= */

  function checkRevenueFields() {
    return checkAllRequiredFields(
      revenue,
      expenditure,
      salary,
      incomeTaxPercentage
    );
  }

  /* =======================================================
     REVENUE TOTALS
  ======================================================= */

  const revenueTotals = {};

  financialYears.forEach((year) => {
    revenueTotals[year] =
      getNumber(
        revenue[
          "Recruitment Revenue"
        ]?.[year]
      ) +
      getNumber(
        revenue[
          "Franchisee Revenue"
        ]?.[year]
      ) +
      getNumber(
        revenue[
          "Job portal Revenue"
        ]?.[year]
      );
  });

  /* =======================================================
     EXPENDITURE TOTALS
  ======================================================= */

  const expenditureTotals = {};

  financialYears.forEach((year) => {
    expenditureTotals[year] =
      getNumber(
        expenditure[
          "Recruitment Expenditure"
        ]?.[year]
      ) +
      getNumber(
        expenditure[
          "Franchisee Expenditure"
        ]?.[year]
      ) +
      getNumber(
        expenditure[
          "Job portal Expenditure"
        ]?.[year]
      );
  });

  /* =======================================================
     SALARY TOTALS
  ======================================================= */

  const salaryTotals = {};

  financialYears.forEach((year) => {
    salaryTotals[year] =
      getNumber(
        salary[
          "Recruitment Salary"
        ]?.[year]
      ) +
      getNumber(
        salary[
          "Franchisee Salary"
        ]?.[year]
      ) +
      getNumber(
        salary[
          "Job portal Salary"
        ]?.[year]
      );
  });

  /* =======================================================
     FINAL REVENUE
  ======================================================= */

  const finalRevenue = {
    Recruitment: {},
    Franchisee: {},
    "Job portal": {},
    Total: {},
  };

  financialYears.forEach((year) => {
    finalRevenue.Recruitment[year] =
      getNumber(
        revenue[
          "Recruitment Revenue"
        ]?.[year]
      ) -
      getNumber(
        expenditure[
          "Recruitment Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary[
          "Recruitment Salary"
        ]?.[year]
      );

    finalRevenue.Franchisee[year] =
      getNumber(
        revenue[
          "Franchisee Revenue"
        ]?.[year]
      ) -
      getNumber(
        expenditure[
          "Franchisee Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary[
          "Franchisee Salary"
        ]?.[year]
      );

    finalRevenue["Job portal"][year] =
      getNumber(
        revenue[
          "Job portal Revenue"
        ]?.[year]
      ) -
      getNumber(
        expenditure[
          "Job portal Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary[
          "Job portal Salary"
        ]?.[year]
      );

    finalRevenue.Total[year] =
      finalRevenue.Recruitment[year] +
      finalRevenue.Franchisee[year] +
      finalRevenue["Job portal"][year];
  });

  /* =======================================================
     OVERALL REVENUE
  ======================================================= */

  const overallRevenue = {
    ...finalRevenue.Total,
  };

  /* =======================================================
     INCOME TAX
  ======================================================= */

  const incomeTax = {};

  financialYears.forEach((year) => {
    incomeTax[year] =
      overallRevenue[year] *
      (
        getNumber(
          incomeTaxPercentage
        ) / 100
      );
  });

  /* =======================================================
     NET INCOME
  ======================================================= */

  const netIncome = {};

  financialYears.forEach((year) => {
    netIncome[year] =
      overallRevenue[year] -
      incomeTax[year];
  });

  /* =======================================================
     TDS

     TDS = 10% of Net Income
  ======================================================= */

  const tds = {};

  financialYears.forEach((year) => {
    tds[year] =
      netIncome[year] * 0.1;
  });

  /* =======================================================
     USER ENTERED BREAKDOWN

     OPTIONAL:
     Empty values are treated as 0.
  ======================================================= */

  const director = {};
  const keyExpenses = {};
  const otherExpenses = {};

  financialYears.forEach((year) => {
    director[year] =
      getNumber(
        netIncomeBreakdown[
          "Director"
        ]?.[year]
      );

    keyExpenses[year] =
      getNumber(
        netIncomeBreakdown[
          "Key Expenses"
        ]?.[year]
      );

    otherExpenses[year] =
      getNumber(
        netIncomeBreakdown[
          "Other expenses"
        ]?.[year]
      );
  });

  /* =======================================================
     NET AMOUNT

     Net Amount =
       TDS
       + Director
       + Key Expenses
       + Other expenses

     IMPORTANT:
     Net Amount is NOT compared with Net Income.
  ======================================================= */

  const netAmount = {};

  financialYears.forEach((year) => {
    netAmount[year] =
      tds[year] +
      director[year] +
      keyExpenses[year] +
      otherExpenses[year];
  });

  /* =======================================================
     SAVE

     REQUIRED:
       Revenue
       Expenditure
       Salary
       Income Tax

     OPTIONAL:
       Director
       Key Expenses
       Other expenses

     NO:
       Net Amount vs Net Income validation
  ======================================================= */

  async function handleSave() {
    if (isLoading || isSaving) {
      return;
    }

    const {
      hasAnyValue,
      allFieldsFilled,
    } = checkRevenueFields();

    /* -----------------------------------------------------
       ONLY REQUIRED FIELDS ARE CHECKED

       Breakdown fields are NOT required.
    ----------------------------------------------------- */

    if (!allFieldsFilled) {
      window.alert(
        "Please fill all Revenue, Expenditure, Salary and Income Tax fields before saving."
      );

      return;
    }

    /* -----------------------------------------------------
       NORMALIZE OPTIONAL BREAKDOWN VALUES

       Empty fields are saved as 0.
    ----------------------------------------------------- */

    const normalizedBreakdown = {
      Director: {},
      "Key Expenses": {},
      "Other expenses": {},
    };

    financialYears.forEach((year) => {
      normalizedBreakdown.Director[year] =
        getNumber(
          netIncomeBreakdown[
            "Director"
          ]?.[year]
        );

      normalizedBreakdown[
        "Key Expenses"
      ][year] =
        getNumber(
          netIncomeBreakdown[
            "Key Expenses"
          ]?.[year]
        );

      normalizedBreakdown[
        "Other expenses"
      ][year] =
        getNumber(
          netIncomeBreakdown[
            "Other expenses"
          ]?.[year]
        );
    });

    /* -----------------------------------------------------
       DATA TO SAVE
    ----------------------------------------------------- */

    const dataToSave = {
      revenue,

      expenditure,

      salary,

      incomeTaxPercentage:
        hasAnyValue
          ? incomeTaxPercentage
          : "",

      netIncomeBreakdown:
        normalizedBreakdown,

      /* ---------------------------------------------------
         CALCULATED VALUES

         TDS:
         10% of Net Income

         Net Amount:
         TDS + Director + Key Expenses + Other expenses

         No reconciliation with Net Income.
      --------------------------------------------------- */

      tds,

      netAmount,

      isSaved: true,
    };

    try {
      setIsSaving(true);

      const response = await fetch(
        REVENUE_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
            dataToSave
          ),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to save Revenue data."
        );
      }

      /* ---------------------------------------------------
         SERVER RESPONSE BECOMES SOURCE OF TRUTH
      --------------------------------------------------- */

      if (result.data) {
        setRevenue(
          result.data.revenue ||
            createInitialData(
              revenueRows
            )
        );

        setExpenditure(
          result.data.expenditure ||
            createInitialData(
              expenditureRows
            )
        );

        setSalary(
          result.data.salary ||
            createInitialData(
              salaryRows
            )
        );

        setIncomeTaxPercentage(
          result.data
            .incomeTaxPercentage ?? ""
        );

        setNetIncomeBreakdown(
          result.data
            .netIncomeBreakdown ||
            createInitialBreakdownData()
        );
      }

      setIsSaved(true);

      window.alert(
        "Revenue data saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save shared Revenue data:",
        error
      );

      window.alert(
        error.message ||
          "Unable to save Revenue data."
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit() {
    if (isLoading || isSaving) {
      return;
    }

    setIsSaved(false);
  }

  /* =======================================================
     FORMAT NUMBER
  ======================================================= */

  function formatNumber(value) {
    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="revenue-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="revenue-page-header">
        <h1>Revenue</h1>

        <p>
          Manage revenue, expenditure, salary and
          final income details.
        </p>
      </div>

      {/* =================================================
          REVENUE
      ================================================= */}

      <div className="revenue-section">

        <div className="revenue-section-header">
          <h2>Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>
              <tr>
                <th>Revenue Type</th>

                {financialYears.map(
                  (year) => (
                    <th key={year}>
                      {year}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>

              {revenueRows.map(
                (row) => (
                  <tr key={row}>

                    <td>{row}</td>

                    {financialYears.map(
                      (year) => (
                        <td key={year}>

                          <AmountInput
                            value={
                              revenue[
                                row
                              ]?.[
                                year
                              ] || ""
                            }

                            disabled={
                              isSaved ||
                              isLoading ||
                              isSaving
                            }

                            onChange={(
                              value
                            ) =>
                              handleRevenueChange(
                                row,
                                year,
                                value
                              )
                            }
                          />

                        </td>
                      )
                    )}

                  </tr>
                )
              )}

              <tr className="total-row">

                <td>
                  Total Revenue
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        revenueTotals[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          EXPENDITURE
      ================================================= */}

      <div className="revenue-section">

        <div className="revenue-section-header">
          <h2>Expenditure</h2>
        </div>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>
              <tr>

                <th>
                  Expenditure Type
                </th>

                {financialYears.map(
                  (year) => (
                    <th key={year}>
                      {year}
                    </th>
                  )
                )}

              </tr>
            </thead>

            <tbody>

              {expenditureRows.map(
                (row) => (
                  <tr key={row}>

                    <td>{row}</td>

                    {financialYears.map(
                      (year) => (
                        <td key={year}>

                          <AmountInput
                            value={
                              expenditure[
                                row
                              ]?.[
                                year
                              ] || ""
                            }

                            disabled={
                              isSaved ||
                              isLoading ||
                              isSaving
                            }

                            onChange={(
                              value
                            ) =>
                              handleExpenditureChange(
                                row,
                                year,
                                value
                              )
                            }
                          />

                        </td>
                      )
                    )}

                  </tr>
                )
              )}

              <tr className="total-row">

                <td>
                  Total Expenditure
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        expenditureTotals[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          SALARY
      ================================================= */}

      <div className="revenue-section">

        <div className="revenue-section-header">
          <h2>Salary</h2>
        </div>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>
              <tr>

                <th>Salary Type</th>

                {financialYears.map(
                  (year) => (
                    <th key={year}>
                      {year}
                    </th>
                  )
                )}

              </tr>
            </thead>

            <tbody>

              {salaryRows.map(
                (row) => (
                  <tr key={row}>

                    <td>{row}</td>

                    {financialYears.map(
                      (year) => (
                        <td key={year}>

                          <AmountInput
                            value={
                              salary[
                                row
                              ]?.[
                                year
                              ] || ""
                            }

                            disabled={
                              isSaved ||
                              isLoading ||
                              isSaving
                            }

                            onChange={(
                              value
                            ) =>
                              handleSalaryChange(
                                row,
                                year,
                                value
                              )
                            }
                          />

                        </td>
                      )
                    )}

                  </tr>
                )
              )}

              <tr className="total-row">

                <td>
                  Total Salary
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        salaryTotals[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          FINAL REVENUE
      ================================================= */}

      <div className="revenue-section">

        <div className="revenue-section-header">
          <h2>Final Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>
              <tr>

                <th>Revenue Type</th>

                {financialYears.map(
                  (year) => (
                    <th key={year}>
                      {year}
                    </th>
                  )
                )}

              </tr>
            </thead>

            <tbody>

              <tr>

                <td>
                  Recruitment
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        finalRevenue
                          .Recruitment[
                            year
                          ]
                      )}
                    </td>
                  )
                )}

              </tr>

              <tr>

                <td>
                  Franchisee
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        finalRevenue
                          .Franchisee[
                            year
                          ]
                      )}
                    </td>
                  )
                )}

              </tr>

              <tr>

                <td>
                  Job portal
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        finalRevenue[
                          "Job portal"
                        ][year]
                      )}
                    </td>
                  )
                )}

              </tr>

              <tr className="total-row">

                <td>
                  Total Final Revenue
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        finalRevenue
                          .Total[
                            year
                          ]
                      )}
                    </td>
                  )
                )}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          OVERALL REVENUE
      ================================================= */}

      <div className="revenue-section overall-revenue-section">

        <div className="revenue-section-header">
          <h2>Overall Revenue</h2>
        </div>

        <div className="overall-revenue-table-wrapper">

          <table className="overall-revenue-table">

            <thead>
              <tr>

                <th></th>

                {financialYears.map(
                  (year) => (
                    <th key={year}>
                      {year}
                    </th>
                  )
                )}

              </tr>
            </thead>

            <tbody>

              <tr>

                <td>
                  Overall Revenue
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        overallRevenue[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

              <tr>

                <td>
                  Income Tax %
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>

                      <div className="tax-input-wrapper">

                        <TaxInput
                          value={
                            incomeTaxPercentage
                          }

                          disabled={
                            isSaved ||
                            isLoading ||
                            isSaving
                          }

                          onChange={
                            handleIncomeTaxChange
                          }
                        />

                        <span>%</span>

                      </div>

                    </td>
                  )
                )}

              </tr>

              <tr>

                <td>
                  Income Tax
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        incomeTax[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

              <tr className="net-income-row">

                <td>
                  Net Income
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        netIncome[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          NET INCOME BREAKDOWN
      ================================================= */}

      <div className="revenue-section net-income-breakdown-section">

        <div className="revenue-section-header">
          <h2>Net Income Breakdown</h2>
        </div>

        <div className="overall-revenue-table-wrapper">

          <table className="overall-revenue-table net-income-breakdown-table">

            <thead>

              <tr>

                <th></th>

                {financialYears.map(
                  (year) => (
                    <th key={year}>
                      {year}
                    </th>
                  )
                )}

              </tr>

            </thead>

            <tbody>

              {/* -----------------------------------------
                  TDS
              ----------------------------------------- */}

              <tr>

                <td>
                  TDS
                </td>

                {financialYears.map(
                  (year) => (
                    <td
                      key={year}
                      className="calculated-breakdown-value"
                    >
                      {formatNumber(
                        tds[year]
                      )}
                    </td>
                  )
                )}

              </tr>

              {/* -----------------------------------------
                  DIRECTOR
              ----------------------------------------- */}

              <tr>

                <td>
                  Director
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>

                      <AmountInput
                        value={
                          netIncomeBreakdown[
                            "Director"
                          ]?.[
                            year
                          ] || ""
                        }

                        disabled={
                          isSaved ||
                          isLoading ||
                          isSaving
                        }

                        onChange={(
                          value
                        ) =>
                          handleBreakdownChange(
                            "Director",
                            year,
                            value
                          )
                        }
                      />

                    </td>
                  )
                )}

              </tr>

              {/* -----------------------------------------
                  KEY EXPENSES
              ----------------------------------------- */}

              <tr>

                <td>
                  Key Expenses
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>

                      <AmountInput
                        value={
                          netIncomeBreakdown[
                            "Key Expenses"
                          ]?.[
                            year
                          ] || ""
                        }

                        disabled={
                          isSaved ||
                          isLoading ||
                          isSaving
                        }

                        onChange={(
                          value
                        ) =>
                          handleBreakdownChange(
                            "Key Expenses",
                            year,
                            value
                          )
                        }
                      />

                    </td>
                  )
                )}

              </tr>

              {/* -----------------------------------------
                  OTHER EXPENSES
              ----------------------------------------- */}

              <tr>

                <td>
                  Other expenses
                </td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>

                      <AmountInput
                        value={
                          netIncomeBreakdown[
                            "Other expenses"
                          ]?.[
                            year
                          ] || ""
                        }

                        disabled={
                          isSaved ||
                          isLoading ||
                          isSaving
                        }

                        onChange={(
                          value
                        ) =>
                          handleBreakdownChange(
                            "Other expenses",
                            year,
                            value
                          )
                        }
                      />

                    </td>
                  )
                )}

              </tr>

              {/* -----------------------------------------
                  NET AMOUNT
              ----------------------------------------- */}

              <tr className="net-income-row">

                <td>
                  Net Amount
                </td>

                {financialYears.map(
                  (year) => (
                    <td
                      key={year}
                      className="calculated-breakdown-value"
                    >
                      {formatNumber(
                        netAmount[
                          year
                        ]
                      )}
                    </td>
                  )
                )}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          SAVE / EDIT
      ================================================= */}

      <div className="revenue-action-buttons">

        <button
          type="button"
          className="revenue-save-button"
          onClick={handleSave}
          disabled={
            isLoading ||
            isSaving
          }
        >
          {isSaving
            ? "Saving..."
            : "Save"}
        </button>

        <button
          type="button"
          className="revenue-edit-button"
          onClick={handleEdit}
          disabled={
            isLoading ||
            isSaving
          }
        >
          Edit
        </button>

      </div>

    </div>
  );
}

export default Revenue;