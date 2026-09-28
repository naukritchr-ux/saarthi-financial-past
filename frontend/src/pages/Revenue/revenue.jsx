import React, { useEffect, useState } from "react";

import "./revenue.css";

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
];

const salaryRows = [
  "Recruitment Salary",
  "Franchisee Salary",
  "Job portal Salary",
];

const REVENUE_API_URL = "/api/revenue";

/* =========================
   INPUT COMPONENTS
========================= */

function AmountInput({ value, onChange, disabled }) {
  return (
    <input
      className="revenue-input"
      type="text"
      inputMode="numeric"
      value={value}
      placeholder="Enter amount"
      autoComplete="off"
      disabled={disabled}
      onChange={(event) => {
        const nextValue = event.target.value;

        if (/^\d*$/.test(nextValue)) {
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

/* =========================
   HELPERS
========================= */

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

  const number = parseFloat(value);

  return Number.isFinite(number) ? number : 0;
}

function hasValue(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined
  );
}

/* =========================
   REQUIRED FIELD CHECK
========================= */

function checkAllRequiredFields(
  revenue,
  expenditure,
  salary,
  incomeTaxPercentage
) {
  const allValues = [];

  revenueRows.forEach((row) => {
    financialYears.forEach((year) => {
      allValues.push(
        revenue?.[row]?.[year] ?? ""
      );
    });
  });

  expenditureRows.forEach((row) => {
    financialYears.forEach((year) => {
      allValues.push(
        expenditure?.[row]?.[year] ?? ""
      );
    });
  });

  salaryRows.forEach((row) => {
    financialYears.forEach((year) => {
      allValues.push(
        salary?.[row]?.[year] ?? ""
      );
    });
  });

  allValues.push(incomeTaxPercentage ?? "");

  const hasAnyValue = allValues.some((value) =>
    hasValue(value)
  );

  const allFieldsFilled = allValues.every((value) =>
    hasValue(value)
  );

  return {
    hasAnyValue,
    allFieldsFilled,
  };
}

/* =========================
   REVENUE COMPONENT
========================= */

function Revenue() {
  const [revenue, setRevenue] = useState(() =>
    createInitialData(revenueRows)
  );

  const [expenditure, setExpenditure] = useState(() =>
    createInitialData(expenditureRows)
  );

  const [salary, setSalary] = useState(() =>
    createInitialData(salaryRows)
  );

  const [
    incomeTaxPercentage,
    setIncomeTaxPercentage,
  ] = useState("");

  const [isSaved, setIsSaved] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  /* =========================
     LOAD SHARED DATA
  ========================= */

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

        /*
          No saved shared data yet.
        */
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

            setIsSaved(false);
          }

          return;
        }

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

        /*
          We calculate the lock state from the
          actual loaded values.

          This preserves the existing behavior:
          all fields filled = locked
          otherwise = editable
        */
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

          setIsSaved(lockState);
        }
      } catch (error) {
        console.error(
          "Failed to load shared Revenue data:",
          error
        );

        /*
          Do not destroy existing React state if
          loading fails.
        */
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

  /* =========================
     CHANGE HANDLERS
  ========================= */

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

  /* =========================
     FIELD CHECK
  ========================= */

  function checkRevenueFields() {
    return checkAllRequiredFields(
      revenue,
      expenditure,
      salary,
      incomeTaxPercentage
    );
  }

  /* =========================
     SAVE
  ========================= */

  async function handleSave() {
    if (isLoading || isSaving) {
      return;
    }

    const {
      hasAnyValue,
      allFieldsFilled,
    } = checkRevenueFields();

    /*
      Preserve original behavior:
      If absolutely nothing is entered,
      save the empty state and keep editable.
    */
    const dataToSave = {
      revenue,
      expenditure,
      salary,
      incomeTaxPercentage:
        hasAnyValue
          ? incomeTaxPercentage
          : "",
      isSaved: allFieldsFilled,
    };

    try {
      setIsSaving(true);

      const response = await fetch(
        REVENUE_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(dataToSave),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to save Revenue data."
        );
      }

      /*
        Use the server response as the source
        of truth after Save.
      */
      if (result.data) {
        setRevenue(
          result.data.revenue ||
            createInitialData(revenueRows)
        );

        setExpenditure(
          result.data.expenditure ||
            createInitialData(
              expenditureRows
            )
        );

        setSalary(
          result.data.salary ||
            createInitialData(salaryRows)
        );

        setIncomeTaxPercentage(
          result.data
            .incomeTaxPercentage ?? ""
        );
      }

      /*
        Preserve original locking behavior:
        all fields filled = locked
        partial/empty = editable
      */
      setIsSaved(allFieldsFilled);
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

  /* =========================
     EDIT
  ========================= */

  function handleEdit() {
    if (isLoading || isSaving) {
      return;
    }

    /*
      Edit only unlocks the fields.

      The shared server data is NOT changed until
      Save is clicked.
    */
    setIsSaved(false);
  }

  /* =========================
     REVENUE TOTALS
  ========================= */

  const revenueTotals = {};

  financialYears.forEach((year) => {
    revenueTotals[year] =
      getNumber(
        revenue["Recruitment Revenue"]?.[
          year
        ]
      ) +
      getNumber(
        revenue["Franchisee Revenue"]?.[
          year
        ]
      ) +
      getNumber(
        revenue["Job portal Revenue"]?.[
          year
        ]
      );
  });

  /* =========================
     EXPENDITURE TOTALS
  ========================= */

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

  /* =========================
     SALARY TOTALS
  ========================= */

  const salaryTotals = {};

  financialYears.forEach((year) => {
    salaryTotals[year] =
      getNumber(
        salary["Recruitment Salary"]?.[
          year
        ]
      ) +
      getNumber(
        salary["Franchisee Salary"]?.[
          year
        ]
      ) +
      getNumber(
        salary["Job portal Salary"]?.[
          year
        ]
      );
  });

  /* =========================
     FINAL REVENUE
  ========================= */

  const finalRevenue = {
    Recruitment: {},
    Franchisee: {},
    "Job portal": {},
    Total: {},
  };

  financialYears.forEach((year) => {
    finalRevenue.Recruitment[year] =
      getNumber(
        revenue["Recruitment Revenue"]?.[
          year
        ]
      ) -
      getNumber(
        expenditure[
          "Recruitment Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary["Recruitment Salary"]?.[
          year
        ]
      );

    finalRevenue.Franchisee[year] =
      getNumber(
        revenue["Franchisee Revenue"]?.[
          year
        ]
      ) -
      getNumber(
        expenditure[
          "Franchisee Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary["Franchisee Salary"]?.[
          year
        ]
      );

    finalRevenue["Job portal"][year] =
      getNumber(
        revenue["Job portal Revenue"]?.[
          year
        ]
      ) -
      getNumber(
        expenditure[
          "Job portal Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary["Job portal Salary"]?.[
          year
        ]
      );

    finalRevenue.Total[year] =
      finalRevenue.Recruitment[year] +
      finalRevenue.Franchisee[year] +
      finalRevenue["Job portal"][year];
  });

  /* =========================
     OVERALL REVENUE
  ========================= */

  const overallRevenue = {
    ...finalRevenue.Total,
  };

  /* =========================
     INCOME TAX
  ========================= */

  const incomeTax = {};

  financialYears.forEach((year) => {
    incomeTax[year] =
      overallRevenue[year] *
      (getNumber(
        incomeTaxPercentage
      ) /
        100);
  });

  /* =========================
     NET INCOME
  ========================= */

  const netIncome = {};

  financialYears.forEach((year) => {
    netIncome[year] =
      overallRevenue[year] -
      incomeTax[year];
  });

  /* =========================
     FORMAT NUMBER
  ========================= */

  function formatNumber(value) {
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="revenue-page">
      <div className="revenue-page-header">
        <h1>Revenue</h1>

        <p>
          Manage revenue, expenditure, salary and
          final income details.
        </p>
      </div>

      {/* =========================
          REVENUE
      ========================= */}

      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Revenue Type</th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {revenueRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>

                  {financialYears.map(
                    (year) => (
                      <td key={year}>
                        <AmountInput
                          value={
                            revenue[row]?.[
                              year
                            ] || ""
                          }
                          disabled={
                            isSaved ||
                            isLoading ||
                            isSaving
                          }
                          onChange={(value) =>
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
              ))}

              <tr className="total-row">
                <td>Total Revenue</td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        revenueTotals[year]
                      )}
                    </td>
                  )
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          EXPENDITURE
      ========================= */}

      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Expenditure</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Expenditure Type</th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}
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

      {/* =========================
          SALARY
      ========================= */}

      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Salary</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Salary Type</th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {salaryRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>

                  {financialYears.map(
                    (year) => (
                      <td key={year}>
                        <AmountInput
                          value={
                            salary[row]?.[
                              year
                            ] || ""
                          }
                          disabled={
                            isSaved ||
                            isLoading ||
                            isSaving
                          }
                          onChange={(value) =>
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
              ))}

              <tr className="total-row">
                <td>Total Salary</td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        salaryTotals[year]
                      )}
                    </td>
                  )
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          FINAL REVENUE
      ========================= */}

      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Final Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Revenue Type</th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Recruitment</td>

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
                <td>Franchisee</td>

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
                <td>Job portal</td>

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
                        finalRevenue.Total[
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

      {/* =========================
          OVERALL REVENUE
      ========================= */}

      <div className="revenue-section overall-revenue-section">
        <div className="revenue-section-header">
          <h2>Overall Revenue</h2>
        </div>

        <div className="overall-revenue-table-wrapper">
          <table className="overall-revenue-table">
            <thead>
              <tr>
                <th></th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Overall Revenue</td>

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
                <td>Income Tax %</td>

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
                <td>Income Tax</td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        incomeTax[year]
                      )}
                    </td>
                  )
                )}
              </tr>

              <tr className="net-income-row">
                <td>Net Income</td>

                {financialYears.map(
                  (year) => (
                    <td key={year}>
                      {formatNumber(
                        netIncome[year]
                      )}
                    </td>
                  )
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          SAVE / EDIT
      ========================= */}

      <div className="revenue-action-buttons">
        <button
          type="button"
          className="revenue-save-button"
          onClick={handleSave}
          disabled={
            isLoading || isSaving
          }
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          className="revenue-edit-button"
          onClick={handleEdit}
          disabled={
            isLoading || isSaving
          }
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default Revenue;