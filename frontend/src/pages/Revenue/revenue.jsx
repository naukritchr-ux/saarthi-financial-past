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
  "Other Expenditure",
];

const salaryRows = [
  "Recruitment Salary",
  "Franchisee Salary",
  "Job portal Salary",
];

const interestRows = [
  "Interest Received",
];

/* =========================================================
   NET INCOME BREAKDOWN ROWS
========================================================= */

const breakdownRows = [
  "Director",
  "Key Expenses",
  "Lead Generation",
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

        if (nextValue === "" || /^\d*\.?\d*$/.test(nextValue)) {
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

        if (nextValue === "" || /^\d*\.?\d*$/.test(nextValue)) {
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
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasValue(value) {
  return value !== "" && value !== null && value !== undefined;
}

/* =========================================================
   INITIAL BREAKDOWN DATA
========================================================= */

function createInitialBreakdownData() {
  return createInitialData(breakdownRows);
}

/* =========================================================
   INITIAL TDS DATA

   TDS IS USER ENTERED.
   NO AUTOMATIC CALCULATION.
========================================================= */

function createInitialTdsData() {
  const data = {};

  financialYears.forEach((year) => {
    data[year] = "";
  });

  return data;
}

/* =========================================================
   NORMALIZE SAVED BREAKDOWN

   Supports old saved data:
   "Other expenses"

   Converts it to:
   "Lead Generation"
========================================================= */

function normalizeBreakdown(savedBreakdown) {
  const initialData = createInitialBreakdownData();

  if (!savedBreakdown) {
    return initialData;
  }

  const normalized = {
    Director: {},
    "Key Expenses": {},
    "Lead Generation": {},
  };

  financialYears.forEach((year) => {
    normalized.Director[year] =
      savedBreakdown?.Director?.[year] ?? "";

    normalized["Key Expenses"][year] =
      savedBreakdown?.["Key Expenses"]?.[year] ?? "";

    normalized["Lead Generation"][year] =
      savedBreakdown?.["Lead Generation"]?.[year] ??
      savedBreakdown?.["Other expenses"]?.[year] ??
      "";
  });

  return normalized;
}

/* =========================================================
   NORMALIZE SAVED ROW DATA

   Adds any newly introduced rows/years without discarding
   existing saved values.
========================================================= */

function normalizeRowData(savedData, rows) {
  const initialData = createInitialData(rows);

  rows.forEach((row) => {
    financialYears.forEach((year) => {
      initialData[row][year] = savedData?.[row]?.[year] ?? "";
    });
  });

  return initialData;
}

/* =========================================================
   REQUIRED FIELD CHECK

   Required:
   - Revenue
   - Expenditure
   - Salary
   - Income Tax %

   Optional:
   - Interest Received
   - TDS
   - Director
   - Key Expenses
   - Lead Generation
========================================================= */

function checkAllRequiredFields(
  revenue,
  expenditure,
  salary,
  incomeTaxPercentage
) {
  const requiredValues = [];

  revenueRows.forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(revenue?.[row]?.[year] ?? "");
    });
  });

  expenditureRows.forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(expenditure?.[row]?.[year] ?? "");
    });
  });

  salaryRows.forEach((row) => {
    financialYears.forEach((year) => {
      requiredValues.push(salary?.[row]?.[year] ?? "");
    });
  });

  requiredValues.push(incomeTaxPercentage ?? "");

  const hasAnyRequiredValue = requiredValues.some(hasValue);
  const allRequiredFieldsFilled = requiredValues.every(hasValue);

  return {
    hasAnyValue: hasAnyRequiredValue,
    allFieldsFilled: allRequiredFieldsFilled,
  };
}

/* =========================================================
   REVENUE COMPONENT
========================================================= */

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

  /* Interest Received has independent state and persistence. */
  const [interestReceived, setInterestReceived] = useState(() =>
    createInitialData(interestRows)
  );

  const [incomeTaxPercentage, setIncomeTaxPercentage] = useState("");

  const [tds, setTds] = useState(() => createInitialTdsData());

  const [netIncomeBreakdown, setNetIncomeBreakdown] = useState(() =>
    createInitialBreakdownData()
  );

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

        const response = await fetch(REVENUE_API_URL, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load Revenue data.");
        }

        if (!result.exists || !result.data) {
          if (isMounted) {
            setRevenue(createInitialData(revenueRows));
            setExpenditure(createInitialData(expenditureRows));
            setSalary(createInitialData(salaryRows));
            setInterestReceived(createInitialData(interestRows));
            setIncomeTaxPercentage("");
            setTds(createInitialTdsData());
            setNetIncomeBreakdown(createInitialBreakdownData());
            setIsSaved(false);
          }

          return;
        }

        const savedData = result.data;

        const loadedRevenue = normalizeRowData(savedData.revenue, revenueRows);
        const loadedExpenditure = normalizeRowData(
          savedData.expenditure,
          expenditureRows
        );
        const loadedSalary = normalizeRowData(savedData.salary, salaryRows);

        /*
         * Backward-compatible load:
         * if interestReceived has not yet been saved by the backend,
         * initialize it as empty rather than failing.
         */
        const loadedInterestReceived = normalizeRowData(
          savedData.interestReceived,
          interestRows
        );

        const loadedIncomeTaxPercentage =
          savedData.incomeTaxPercentage ?? "";

        const loadedTds = {
          ...createInitialTdsData(),
          ...(savedData.tds || {}),
        };

        const loadedBreakdown = normalizeBreakdown(
          savedData.netIncomeBreakdown
        );

        const lockState = checkAllRequiredFields(
          loadedRevenue,
          loadedExpenditure,
          loadedSalary,
          loadedIncomeTaxPercentage
        ).allFieldsFilled;

        if (isMounted) {
          setRevenue(loadedRevenue);
          setExpenditure(loadedExpenditure);
          setSalary(loadedSalary);
          setInterestReceived(loadedInterestReceived);
          setIncomeTaxPercentage(loadedIncomeTaxPercentage);
          setTds(loadedTds);
          setNetIncomeBreakdown(loadedBreakdown);
          setIsSaved(lockState);
        }
      } catch (error) {
        console.error("Failed to load shared Revenue data:", error);
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

  function handleRevenueChange(row, year, value) {
    if (isSaved || isLoading) return;

    setRevenue((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleExpenditureChange(row, year, value) {
    if (isSaved || isLoading) return;

    setExpenditure((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleSalaryChange(row, year, value) {
    if (isSaved || isLoading) return;

    setSalary((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleInterestReceivedChange(row, year, value) {
    if (isSaved || isLoading) return;

    setInterestReceived((previous) => ({
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

  function handleTdsChange(year, value) {
    if (isSaved || isLoading) return;

    setTds((previous) => ({
      ...previous,
      [year]: value,
    }));
  }

  function handleBreakdownChange(row, year, value) {
    if (isSaved || isLoading) return;

    setNetIncomeBreakdown((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

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
    revenueTotals[year] = revenueRows.reduce(
      (total, row) => total + getNumber(revenue?.[row]?.[year]),
      0
    );
  });

  /* =======================================================
     EXPENDITURE TOTALS
     Includes Other Expenditure.
  ======================================================= */

  const expenditureTotals = {};

  financialYears.forEach((year) => {
    expenditureTotals[year] = expenditureRows.reduce(
      (total, row) => total + getNumber(expenditure?.[row]?.[year]),
      0
    );
  });

  /* =======================================================
     SALARY TOTALS
  ======================================================= */

  const salaryTotals = {};

  financialYears.forEach((year) => {
    salaryTotals[year] = salaryRows.reduce(
      (total, row) => total + getNumber(salary?.[row]?.[year]),
      0
    );
  });

  /* =======================================================
     INCOME RECEIVED TOTALS
  ======================================================= */

  const interestReceivedTotals = {};

  financialYears.forEach((year) => {
    interestReceivedTotals[year] = interestRows.reduce(
      (total, row) => total + getNumber(interestReceived?.[row]?.[year]),
      0
    );
  });

  /* =======================================================
     FINAL REVENUE
     Interest Received is added as a separate row and included
     in Total Final Revenue.
  ======================================================= */

  const finalRevenue = {
    Recruitment: {},
    Franchisee: {},
    "Job portal": {},
    "Interest Received": {},
    Total: {},
  };

  financialYears.forEach((year) => {
    finalRevenue.Recruitment[year] =
      getNumber(revenue?.["Recruitment Revenue"]?.[year]) -
      getNumber(expenditure?.["Recruitment Expenditure"]?.[year]) -
      getNumber(salary?.["Recruitment Salary"]?.[year]);

    finalRevenue.Franchisee[year] =
      getNumber(revenue?.["Franchisee Revenue"]?.[year]) -
      getNumber(expenditure?.["Franchisee Expenditure"]?.[year]) -
      getNumber(salary?.["Franchisee Salary"]?.[year]);

    finalRevenue["Job portal"][year] =
      getNumber(revenue?.["Job portal Revenue"]?.[year]) -
      getNumber(expenditure?.["Job portal Expenditure"]?.[year]) -
      getNumber(salary?.["Job portal Salary"]?.[year]);

    finalRevenue["Interest Received"][year] =
      interestReceivedTotals[year];

    finalRevenue.Total[year] =
      finalRevenue.Recruitment[year] +
      finalRevenue.Franchisee[year] +
      finalRevenue["Job portal"][year] +
      finalRevenue["Interest Received"][year] -
      getNumber(expenditure?.["Other Expenditure"]?.[year]);
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
      overallRevenue[year] * (getNumber(incomeTaxPercentage) / 100);
  });

  /* =======================================================
     NET INCOME
  ======================================================= */

  const netIncome = {};

  financialYears.forEach((year) => {
    netIncome[year] = overallRevenue[year] - incomeTax[year];
  });

  /* =======================================================
     USER ENTERED TDS
  ======================================================= */

  const tdsAmount = {};

  financialYears.forEach((year) => {
    tdsAmount[year] = getNumber(tds?.[year]);
  });

  /* =======================================================
     USER ENTERED BREAKDOWN
  ======================================================= */

  const director = {};
  const keyExpenses = {};
  const leadGeneration = {};

  financialYears.forEach((year) => {
    director[year] = getNumber(netIncomeBreakdown?.Director?.[year]);
    keyExpenses[year] = getNumber(
      netIncomeBreakdown?.["Key Expenses"]?.[year]
    );
    leadGeneration[year] = getNumber(
      netIncomeBreakdown?.["Lead Generation"]?.[year]
    );
  });

  /* =======================================================
     NET AMOUNT
  ======================================================= */

  const netAmount = {};

  financialYears.forEach((year) => {
    netAmount[year] =
      tdsAmount[year] +
      director[year] +
      keyExpenses[year] +
      leadGeneration[year];
  });

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    if (isLoading || isSaving) return;

    const { allFieldsFilled } = checkRevenueFields();

    if (!allFieldsFilled) {
      window.alert(
        "Please fill all Revenue, Expenditure, Salary and Income Tax fields before saving."
      );
      return;
    }

    const normalizedTds = {};

    financialYears.forEach((year) => {
      normalizedTds[year] = getNumber(tds?.[year]);
    });

    const normalizedBreakdown = {
      Director: {},
      "Key Expenses": {},
      "Lead Generation": {},
    };

    financialYears.forEach((year) => {
      normalizedBreakdown.Director[year] = getNumber(
        netIncomeBreakdown?.Director?.[year]
      );

      normalizedBreakdown["Key Expenses"][year] = getNumber(
        netIncomeBreakdown?.["Key Expenses"]?.[year]
      );

      normalizedBreakdown["Lead Generation"][year] = getNumber(
        netIncomeBreakdown?.["Lead Generation"]?.[year]
      );
    });

    const normalizedInterestReceived = normalizeRowData(
      interestReceived,
      interestRows
    );

    const dataToSave = {
      revenue,
      expenditure,
      salary,
      interestReceived: normalizedInterestReceived,
      incomeTaxPercentage,
      tds: normalizedTds,
      netIncomeBreakdown: normalizedBreakdown,
      netAmount,
      isSaved: true,
    };

    try {
      setIsSaving(true);

      const response = await fetch(REVENUE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save Revenue data.");
      }

      if (result.data) {
        setRevenue(
          normalizeRowData(result.data.revenue, revenueRows)
        );
        setExpenditure(
          normalizeRowData(result.data.expenditure, expenditureRows)
        );
        setSalary(
          normalizeRowData(result.data.salary, salaryRows)
        );
        setInterestReceived(
          normalizeRowData(result.data.interestReceived, interestRows)
        );
        setIncomeTaxPercentage(result.data.incomeTaxPercentage ?? "");
        setTds({
          ...createInitialTdsData(),
          ...(result.data.tds || {}),
        });
        setNetIncomeBreakdown(
          normalizeBreakdown(result.data.netIncomeBreakdown)
        );
      }

      setIsSaved(true);
      window.alert("Revenue data saved successfully.");
    } catch (error) {
      console.error("Failed to save shared Revenue data:", error);
      window.alert(error.message || "Unable to save Revenue data.");
    } finally {
      setIsSaving(false);
    }
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit() {
    if (isLoading || isSaving) return;
    setIsSaved(false);
  }

  /* =======================================================
     FORMAT NUMBER
  ======================================================= */

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }

  /* =======================================================
     SHARED TABLE HEADER
  ======================================================= */

  function renderYearHeaders(firstColumnTitle) {
    return (
      <tr>
        <th>{firstColumnTitle}</th>
        {financialYears.map((year) => (
          <th key={year}>{year}</th>
        ))}
      </tr>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="revenue-page">
      {/* PAGE HEADER */}
      <div className="revenue-page-header">
        <h1>Revenue</h1>
        <p>
          Manage revenue, expenditure, salary and final income details.
        </p>
      </div>

      {/* REVENUE */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Revenue Type")}</thead>
            <tbody>
              {revenueRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>
                  {financialYears.map((year) => (
                    <td key={year}>
                      <AmountInput
                        value={revenue?.[row]?.[year] ?? ""}
                        disabled={isSaved || isLoading || isSaving}
                        onChange={(value) =>
                          handleRevenueChange(row, year, value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="total-row">
                <td>Total Revenue</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(revenueTotals[year])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENDITURE */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Expenditure</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Expenditure Type")}</thead>
            <tbody>
              {expenditureRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>
                  {financialYears.map((year) => (
                    <td key={year}>
                      <AmountInput
                        value={expenditure?.[row]?.[year] ?? ""}
                        disabled={isSaved || isLoading || isSaving}
                        onChange={(value) =>
                          handleExpenditureChange(row, year, value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="total-row">
                <td>Total Expenditure</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(expenditureTotals[year])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SALARY */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Salary</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Salary Type")}</thead>
            <tbody>
              {salaryRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>
                  {financialYears.map((year) => (
                    <td key={year}>
                      <AmountInput
                        value={salary?.[row]?.[year] ?? ""}
                        disabled={isSaved || isLoading || isSaving}
                        onChange={(value) =>
                          handleSalaryChange(row, year, value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="total-row">
                <td>Total Salary</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(salaryTotals[year])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* INCOME RECEIVED - AFTER SALARY */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Interest Received</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Interest Type")}</thead>
            <tbody>
              {interestRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>
                  {financialYears.map((year) => (
                    <td key={year}>
                      <AmountInput
                        value={interestReceived?.[row]?.[year] ?? ""}
                        disabled={isSaved || isLoading || isSaving}
                        onChange={(value) =>
                          handleInterestReceivedChange(row, year, value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="total-row">
                <td>Total Interest Received</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(interestReceivedTotals[year])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FINAL REVENUE */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Final Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Revenue Type")}</thead>
            <tbody>
              <tr>
                <td>Recruitment</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(finalRevenue.Recruitment[year])}
                  </td>
                ))}
              </tr>

              <tr>
                <td>Franchisee</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(finalRevenue.Franchisee[year])}
                  </td>
                ))}
              </tr>

              <tr>
                <td>Job portal</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(finalRevenue["Job portal"][year])}
                  </td>
                ))}
              </tr>

              <tr>
                <td>Interest Received</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(finalRevenue["Interest Received"][year])}
                  </td>
                ))}
              </tr>

              <tr className="total-row">
                <td>Total Final Revenue</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(finalRevenue.Total[year])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERALL REVENUE */}
      <div className="revenue-section overall-revenue-section">
        <div className="revenue-section-header">
          <h2>Overall Revenue</h2>
        </div>

        <div className="overall-revenue-table-wrapper">
          <table className="overall-revenue-table">
            <thead>{renderYearHeaders("")}</thead>
            <tbody>
              <tr>
                <td>Overall Revenue</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(overallRevenue[year])}</td>
                ))}
              </tr>

              <tr>
                <td>Income Tax %</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    <div className="tax-input-wrapper">
                      <TaxInput
                        value={incomeTaxPercentage}
                        disabled={isSaved || isLoading || isSaving}
                        onChange={handleIncomeTaxChange}
                      />
                      <span>%</span>
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td>Income Tax</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(incomeTax[year])}</td>
                ))}
              </tr>

              <tr className="net-income-row">
                <td>Net Income</td>
                {financialYears.map((year) => (
                  <td key={year}>{formatNumber(netIncome[year])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* NET INCOME BREAKDOWN */}
      <div className="revenue-section net-income-breakdown-section">
        <div className="revenue-section-header">
          <h2>Net Income Breakdown</h2>
        </div>

        <div className="overall-revenue-table-wrapper">
          <table className="overall-revenue-table net-income-breakdown-table">
            <thead>{renderYearHeaders("")}</thead>
            <tbody>
              <tr>
                <td>TDS</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    <AmountInput
                      value={tds?.[year] ?? ""}
                      disabled={isSaved || isLoading || isSaving}
                      onChange={(value) => handleTdsChange(year, value)}
                    />
                  </td>
                ))}
              </tr>

              <tr>
                <td>Director</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    <AmountInput
                      value={netIncomeBreakdown?.Director?.[year] ?? ""}
                      disabled={isSaved || isLoading || isSaving}
                      onChange={(value) =>
                        handleBreakdownChange("Director", year, value)
                      }
                    />
                  </td>
                ))}
              </tr>

              <tr>
                <td>Key Expenses</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    <AmountInput
                      value={
                        netIncomeBreakdown?.["Key Expenses"]?.[year] ?? ""
                      }
                      disabled={isSaved || isLoading || isSaving}
                      onChange={(value) =>
                        handleBreakdownChange("Key Expenses", year, value)
                      }
                    />
                  </td>
                ))}
              </tr>

              <tr>
                <td>Lead Generation</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    <AmountInput
                      value={
                        netIncomeBreakdown?.["Lead Generation"]?.[year] ?? ""
                      }
                      disabled={isSaved || isLoading || isSaving}
                      onChange={(value) =>
                        handleBreakdownChange("Lead Generation", year, value)
                      }
                    />
                  </td>
                ))}
              </tr>

              <tr className="net-income-row">
                <td>Net Amount</td>
                {financialYears.map((year) => (
                  <td key={year} className="calculated-breakdown-value">
                    {formatNumber(netAmount[year])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SAVE / EDIT */}
      <div className="revenue-action-buttons">
        <button
          type="button"
          className="revenue-save-button"
          onClick={handleSave}
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          className="revenue-edit-button"
          onClick={handleEdit}
          disabled={isLoading || isSaving}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default Revenue;
