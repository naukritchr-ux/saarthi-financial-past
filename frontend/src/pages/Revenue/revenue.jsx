
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
   ROW DEFINITIONS
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

const incomeRows = ["Income Received"];

const breakdownRows = [
  "Director",
  "Key Expenses",
  "Lead Generation",
];

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
      value={value ?? ""}
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
      value={value ?? ""}
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

function createInitialTdsData() {
  const data = {};

  financialYears.forEach((year) => {
    data[year] = "";
  });

  return data;
}

function createInitialBreakdownData() {
  return createInitialData(breakdownRows);
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

function normalizeRowData(savedData, rows) {
  const result = createInitialData(rows);

  rows.forEach((row) => {
    financialYears.forEach((year) => {
      result[row][year] = savedData?.[row]?.[year] ?? "";
    });
  });

  return result;
}

function normalizeBreakdown(savedBreakdown) {
  const result = createInitialBreakdownData();

  financialYears.forEach((year) => {
    result.Director[year] =
      savedBreakdown?.Director?.[year] ?? "";

    result["Key Expenses"][year] =
      savedBreakdown?.["Key Expenses"]?.[year] ?? "";

    result["Lead Generation"][year] =
      savedBreakdown?.["Lead Generation"]?.[year] ??
      savedBreakdown?.["Other expenses"]?.[year] ??
      "";
  });

  return result;
}

function normalizeTds(savedTds) {
  return {
    ...createInitialTdsData(),
    ...(savedTds || {}),
  };
}

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

  return {
    hasAnyValue: requiredValues.some(hasValue),
    allFieldsFilled: requiredValues.every(hasValue),
  };
}

function formatNumber(value) {
  return getNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   COMPONENT
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

  const [incomeReceived, setIncomeReceived] = useState(() =>
    createInitialData(incomeRows)
  );

  const [incomeTaxPercentage, setIncomeTaxPercentage] = useState("");

  const [tds, setTds] = useState(() => createInitialTdsData());

  const [netIncomeBreakdown, setNetIncomeBreakdown] = useState(() =>
    createInitialBreakdownData()
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageType, setSaveMessageType] = useState("");

  const inputsDisabled = isSaved || isLoading || isSaving;

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadRevenueData() {
      setIsLoading(true);

      try {
        const response = await fetch(REVENUE_API_URL, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const responseText = await response.text();

        let result;

        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error(
            `The server returned an invalid response (HTTP ${response.status}).`
          );
        }

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.error ||
              result.message ||
              `Unable to load Revenue data (HTTP ${response.status}).`
          );
        }

        const savedData = result.data;

        if (!active) return;

        if (!result.exists || !savedData) {
          setRevenue(createInitialData(revenueRows));
          setExpenditure(createInitialData(expenditureRows));
          setSalary(createInitialData(salaryRows));
          setIncomeReceived(createInitialData(incomeRows));
          setIncomeTaxPercentage("");
          setTds(createInitialTdsData());
          setNetIncomeBreakdown(createInitialBreakdownData());
          setIsSaved(false);
          return;
        }

        const loadedRevenue = normalizeRowData(
          savedData.revenue,
          revenueRows
        );

        const loadedExpenditure = normalizeRowData(
          savedData.expenditure,
          expenditureRows
        );

        const loadedSalary = normalizeRowData(
          savedData.salary,
          salaryRows
        );

        const loadedIncomeReceived = normalizeRowData(
          savedData.incomeReceived,
          incomeRows
        );

        const loadedTax = savedData.incomeTaxPercentage ?? "";

        const loadedTds = normalizeTds(savedData.tds);

        const loadedBreakdown = normalizeBreakdown(
          savedData.netIncomeBreakdown
        );

        const validation = checkAllRequiredFields(
          loadedRevenue,
          loadedExpenditure,
          loadedSalary,
          loadedTax
        );

        setRevenue(loadedRevenue);
        setExpenditure(loadedExpenditure);
        setSalary(loadedSalary);
        setIncomeReceived(loadedIncomeReceived);
        setIncomeTaxPercentage(loadedTax);
        setTds(loadedTds);
        setNetIncomeBreakdown(loadedBreakdown);
        setIsSaved(validation.allFieldsFilled);
      } catch (error) {
        console.error("Revenue loading failed:", error);

        if (active) {
          setSaveMessage(
            `Unable to load Revenue data: ${error.message}`
          );
          setSaveMessageType("error");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadRevenueData();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     CHANGE HANDLERS
  ======================================================= */

  function updateRow(setter, row, year, value) {
    if (inputsDisabled) return;

    setSaveMessage("");
    setSaveMessageType("");

    setter((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  function handleRevenueChange(row, year, value) {
    updateRow(setRevenue, row, year, value);
  }

  function handleExpenditureChange(row, year, value) {
    updateRow(setExpenditure, row, year, value);
  }

  function handleSalaryChange(row, year, value) {
    updateRow(setSalary, row, year, value);
  }

  function handleIncomeReceivedChange(row, year, value) {
    updateRow(setIncomeReceived, row, year, value);
  }

  function handleIncomeTaxChange(value) {
    if (inputsDisabled) return;

    setIncomeTaxPercentage(value);
    setSaveMessage("");
    setSaveMessageType("");
  }

  function handleTdsChange(year, value) {
    if (inputsDisabled) return;

    setTds((previous) => ({
      ...previous,
      [year]: value,
    }));

    setSaveMessage("");
    setSaveMessageType("");
  }

  function handleBreakdownChange(row, year, value) {
    updateRow(setNetIncomeBreakdown, row, year, value);
  }

  /* =======================================================
     TOTALS
  ======================================================= */

  const revenueTotals = {};
  const expenditureTotals = {};
  const salaryTotals = {};
  const incomeReceivedTotals = {};

  financialYears.forEach((year) => {
    revenueTotals[year] = revenueRows.reduce(
      (total, row) =>
        total + getNumber(revenue?.[row]?.[year]),
      0
    );

    expenditureTotals[year] = expenditureRows.reduce(
      (total, row) =>
        total + getNumber(expenditure?.[row]?.[year]),
      0
    );

    salaryTotals[year] = salaryRows.reduce(
      (total, row) =>
        total + getNumber(salary?.[row]?.[year]),
      0
    );

    incomeReceivedTotals[year] = incomeRows.reduce(
      (total, row) =>
        total + getNumber(incomeReceived?.[row]?.[year]),
      0
    );
  });

  /* =======================================================
     FINAL REVENUE
  ======================================================= */

  const finalRevenue = {
    Recruitment: {},
    Franchisee: {},
    "Job portal": {},
    "Income Received": {},
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

    finalRevenue["Income Received"][year] =
      incomeReceivedTotals[year];

    finalRevenue.Total[year] =
      finalRevenue.Recruitment[year] +
      finalRevenue.Franchisee[year] +
      finalRevenue["Job portal"][year] +
      finalRevenue["Income Received"][year] -
      getNumber(expenditure?.["Other Expenditure"]?.[year]);
  });

  const overallRevenue = { ...finalRevenue.Total };

  const incomeTax = {};
  const netIncome = {};
  const netAmount = {};

  financialYears.forEach((year) => {
    incomeTax[year] =
      overallRevenue[year] *
      (getNumber(incomeTaxPercentage) / 100);

    netIncome[year] = overallRevenue[year] - incomeTax[year];

    netAmount[year] =
      getNumber(tds?.[year]) +
      getNumber(netIncomeBreakdown?.Director?.[year]) +
      getNumber(netIncomeBreakdown?.["Key Expenses"]?.[year]) +
      getNumber(netIncomeBreakdown?.["Lead Generation"]?.[year]);
  });

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    console.log("Revenue Save button clicked.");

    if (isLoading || isSaving) {
      console.warn("Save prevented: data is loading or already saving.");
      return;
    }

    setSaveMessage("");
    setSaveMessageType("");

    const validation = checkAllRequiredFields(
      revenue,
      expenditure,
      salary,
      incomeTaxPercentage
    );

    if (!validation.allFieldsFilled) {
      const message =
        "Please fill all Revenue, Expenditure, Salary and Income Tax fields before saving.";

      setSaveMessage(message);
      setSaveMessageType("error");
      window.alert(message);
      return;
    }

    const normalizedTds = normalizeTds(tds);

    const normalizedBreakdown = normalizeBreakdown(
      netIncomeBreakdown
    );

    const dataToSave = {
      revenue,
      expenditure,
      salary,
      incomeReceived: normalizeRowData(
        incomeReceived,
        incomeRows
      ),
      incomeTaxPercentage,
      tds: normalizedTds,
      netIncomeBreakdown: normalizedBreakdown,
      netAmount,
      isSaved: true,
    };

    setIsSaving(true);
    setSaveMessage("Saving Revenue data...");
    setSaveMessageType("info");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(REVENUE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(dataToSave),
        signal: controller.signal,
      });

      const responseText = await response.text();

      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Invalid server response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || result.success !== true) {
        const details = [
          result.message,
          result.error,
          result.details,
          result.hint,
          result.code ? `Code: ${result.code}` : "",
        ].filter(Boolean);

        throw new Error(
          details.length
            ? details.join("\n")
            : `Save failed (HTTP ${response.status}).`
        );
      }

      if (!result.data) {
        throw new Error(
          "The server reported success but did not return saved data."
        );
      }

      setRevenue(
        normalizeRowData(result.data.revenue, revenueRows)
      );

      setExpenditure(
        normalizeRowData(result.data.expenditure, expenditureRows)
      );

      setSalary(
        normalizeRowData(result.data.salary, salaryRows)
      );

      setIncomeReceived(
        normalizeRowData(result.data.incomeReceived, incomeRows)
      );

      setIncomeTaxPercentage(
        result.data.incomeTaxPercentage ?? ""
      );

      setTds(normalizeTds(result.data.tds));

      setNetIncomeBreakdown(
        normalizeBreakdown(result.data.netIncomeBreakdown)
      );

      setIsSaved(true);

      const message = "Revenue data saved successfully.";

      setSaveMessage(message);
      setSaveMessageType("success");
      window.alert(message);
    } catch (error) {
      console.error("Revenue save failed:", error);

      const message =
        error.name === "AbortError"
          ? "The save request timed out after 30 seconds. Check the database before trying again."
          : error.message || "Unable to save Revenue data.";

      setSaveMessage(message);
      setSaveMessageType("error");
      window.alert(message);
    } finally {
      clearTimeout(timeoutId);
      setIsSaving(false);
    }
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit() {
    if (isLoading || isSaving) return;

    setIsSaved(false);
    setSaveMessage("");
    setSaveMessageType("");
  }

  /* =======================================================
     TABLE HELPERS
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

  function renderInputRows(rows, values, onChange) {
    return rows.map((row) => (
      <tr key={row}>
        <td>{row}</td>

        {financialYears.map((year) => (
          <td key={year}>
            <AmountInput
              value={values?.[row]?.[year] ?? ""}
              disabled={inputsDisabled}
              onChange={(value) => onChange(row, year, value)}
            />
          </td>
        ))}
      </tr>
    ));
  }

  function renderTotalsRow(label, totals) {
    return (
      <tr className="total-row">
        <td>{label}</td>
        {financialYears.map((year) => (
          <td key={year}>{formatNumber(totals[year])}</td>
        ))}
      </tr>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="revenue-page">
      <div className="revenue-page-header">
        <h1>Revenue</h1>
        <p>
          Manage revenue, expenditure, salary and final income details.
        </p>
      </div>

      {isLoading && (
        <div className="revenue-save-message info" role="status">
          Loading Revenue data...
        </div>
      )}

      {/* REVENUE */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Revenue</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Revenue Type")}</thead>
            <tbody>
              {renderInputRows(
                revenueRows,
                revenue,
                handleRevenueChange
              )}
              {renderTotalsRow("Total Revenue", revenueTotals)}
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
              {renderInputRows(
                expenditureRows,
                expenditure,
                handleExpenditureChange
              )}
              {renderTotalsRow(
                "Total Expenditure",
                expenditureTotals
              )}
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
              {renderInputRows(
                salaryRows,
                salary,
                handleSalaryChange
              )}
              {renderTotalsRow("Total Salary", salaryTotals)}
            </tbody>
          </table>
        </div>
      </div>

      {/* INCOME RECEIVED */}
      <div className="revenue-section">
        <div className="revenue-section-header">
          <h2>Income Received</h2>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>{renderYearHeaders("Income Type")}</thead>
            <tbody>
              {renderInputRows(
                incomeRows,
                incomeReceived,
                handleIncomeReceivedChange
              )}
              {renderTotalsRow(
                "Total Income Received",
                incomeReceivedTotals
              )}
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
                <td>Income Received</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(finalRevenue["Income Received"][year])}
                  </td>
                ))}
              </tr>

              <tr className="total-row">
                <td>Total Final Revenue</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(finalRevenue.Total[year])}
                  </td>
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
                  <td key={year}>
                    {formatNumber(overallRevenue[year])}
                  </td>
                ))}
              </tr>

              <tr>
                <td>Income Tax %</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    <div className="tax-input-wrapper">
                      <TaxInput
                        value={incomeTaxPercentage}
                        disabled={inputsDisabled}
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
                  <td key={year}>
                    {formatNumber(incomeTax[year])}
                  </td>
                ))}
              </tr>

              <tr className="net-income-row">
                <td>Net Income</td>
                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(netIncome[year])}
                  </td>
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
                      disabled={inputsDisabled}
                      onChange={(value) =>
                        handleTdsChange(year, value)
                      }
                    />
                  </td>
                ))}
              </tr>

              {breakdownRows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>

                  {financialYears.map((year) => (
                    <td key={year}>
                      <AmountInput
                        value={
                          netIncomeBreakdown?.[row]?.[year] ?? ""
                        }
                        disabled={inputsDisabled}
                        onChange={(value) =>
                          handleBreakdownChange(row, year, value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="net-income-row">
                <td>Net Amount</td>
                {financialYears.map((year) => (
                  <td
                    key={year}
                    className="calculated-breakdown-value"
                  >
                    {formatNumber(netAmount[year])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SAVE STATUS */}
      {saveMessage && (
        <div
          className={`revenue-save-message ${saveMessageType}`}
          role="status"
          aria-live="polite"
        >
          {saveMessage}
        </div>
      )}

      {/* ACTION BUTTONS */}
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
          disabled={isLoading || isSaving || !isSaved}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default Revenue;
