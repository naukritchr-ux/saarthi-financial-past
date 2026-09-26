import React, { useState } from "react";

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

// =====================================================
// AMOUNT INPUT
// =====================================================

function AmountInput({
  value,
  onChange,
  disabled,
}) {
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

        // Allow only whole numbers
        if (/^\d*$/.test(nextValue)) {
          onChange(nextValue);
        }
      }}
    />
  );
}

// =====================================================
// TAX INPUT
// =====================================================

function TaxInput({
  value,
  onChange,
  disabled,
}) {
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

        // Allow empty value, whole numbers and decimals
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

// =====================================================
// CREATE INITIAL DATA
// =====================================================

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

// =====================================================
// NUMBER HELPER
// =====================================================

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

// =====================================================
// CHECK IF VALUE IS FILLED
// =====================================================

function hasValue(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined
  );
}

// =====================================================
// CHECK ALL REQUIRED FIELDS
// =====================================================

function checkAllRequiredFields(
  revenue,
  expenditure,
  salary,
  incomeTaxPercentage
) {
  const allValues = [];

  // REVENUE FIELDS
  revenueRows.forEach((row) => {
    financialYears.forEach((year) => {
      allValues.push(
        revenue?.[row]?.[year] ?? ""
      );
    });
  });

  // EXPENDITURE FIELDS
  expenditureRows.forEach((row) => {
    financialYears.forEach((year) => {
      allValues.push(
        expenditure?.[row]?.[year] ?? ""
      );
    });
  });

  // SALARY FIELDS
  salaryRows.forEach((row) => {
    financialYears.forEach((year) => {
      allValues.push(
        salary?.[row]?.[year] ?? ""
      );
    });
  });

  // INCOME TAX %
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

// =====================================================
// REVENUE COMPONENT
// =====================================================

function Revenue() {
  // ===================================================
  // LOAD SAVED DATA
  // ===================================================

  const savedData = (() => {
    try {
      const data = localStorage.getItem(
        "tchr-revenue-data"
      );

      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  })();

  // ===================================================
  // INITIAL DATA
  // ===================================================

  const initialRevenue =
    savedData?.revenue ||
    createInitialData(revenueRows);

  const initialExpenditure =
    savedData?.expenditure ||
    createInitialData(expenditureRows);

  const initialSalary =
    savedData?.salary ||
    createInitialData(salaryRows);

  const initialIncomeTaxPercentage =
    savedData?.incomeTaxPercentage || "";

  // ===================================================
  // STATES
  // ===================================================

  const [revenue, setRevenue] = useState(
    initialRevenue
  );

  const [expenditure, setExpenditure] = useState(
    initialExpenditure
  );

  const [salary, setSalary] = useState(
    initialSalary
  );

  const [
    incomeTaxPercentage,
    setIncomeTaxPercentage,
  ] = useState(
    initialIncomeTaxPercentage
  );

  // ===================================================
  // INITIAL LOCK STATE
  // ===================================================
  //
  // IMPORTANT:
  // Do NOT use savedData?.isSaved here.
  //
  // The actual field values determine whether the
  // fields should be locked.
  //
  // Empty fields       = unlocked
  // Partial fields     = unlocked
  // All fields filled  = locked
  //
  // This prevents old localStorage data containing
  // "isSaved": true from locking empty fields.
  // ===================================================

  const initialLockState =
    checkAllRequiredFields(
      initialRevenue,
      initialExpenditure,
      initialSalary,
      initialIncomeTaxPercentage
    ).allFieldsFilled;

  const [isSaved, setIsSaved] = useState(
    initialLockState
  );

  // ===================================================
  // REVENUE INPUT HANDLER
  // ===================================================

  function handleRevenueChange(
    row,
    year,
    value
  ) {
    if (isSaved) {
      return;
    }

    setRevenue((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  // ===================================================
  // EXPENDITURE INPUT HANDLER
  // ===================================================

  function handleExpenditureChange(
    row,
    year,
    value
  ) {
    if (isSaved) {
      return;
    }

    setExpenditure((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  // ===================================================
  // SALARY INPUT HANDLER
  // ===================================================

  function handleSalaryChange(
    row,
    year,
    value
  ) {
    if (isSaved) {
      return;
    }

    setSalary((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }

  // ===================================================
  // INCOME TAX CHANGE
  // ===================================================

  function handleIncomeTaxChange(value) {
    if (isSaved) {
      return;
    }

    setIncomeTaxPercentage(value);
  }

  // ===================================================
  // CHECK REQUIRED FIELDS
  // ===================================================

  function checkRevenueFields() {
    return checkAllRequiredFields(
      revenue,
      expenditure,
      salary,
      incomeTaxPercentage
    );
  }

  // ===================================================
  // SAVE DATA
  // ===================================================

  function handleSave() {
    const {
      hasAnyValue,
      allFieldsFilled,
    } = checkRevenueFields();

    // =================================================
    // ALL FIELDS EMPTY
    // =================================================
    //
    // Save empty state and make sure page remains
    // editable.
    // =================================================

    if (!hasAnyValue) {
      const dataToSave = {
        revenue,
        expenditure,
        salary,
        incomeTaxPercentage: "",
        isSaved: false,
      };

      localStorage.setItem(
        "tchr-revenue-data",
        JSON.stringify(dataToSave)
      );

      setIsSaved(false);

      return;
    }

    // =================================================
    // SOME OR ALL FIELDS HAVE VALUES
    // =================================================

    const dataToSave = {
      revenue,
      expenditure,
      salary,
      incomeTaxPercentage,
      isSaved: allFieldsFilled,
    };

    localStorage.setItem(
      "tchr-revenue-data",
      JSON.stringify(dataToSave)
    );

    // =================================================
    // SOME FIELDS ARE EMPTY
    // =================================================
    //
    // Data is saved but fields remain editable.
    // =================================================

    if (!allFieldsFilled) {
      setIsSaved(false);
      return;
    }

    // =================================================
    // ALL REQUIRED FIELDS ARE FILLED
    // =================================================
    //
    // Save and lock fields.
    // =================================================

    setIsSaved(true);
  }

  // ===================================================
  // EDIT DATA
  // ===================================================

  function handleEdit() {
    setIsSaved(false);
  }

  // ===================================================
  // REVENUE CALCULATIONS
  // ===================================================

  const revenueTotals = {};

  financialYears.forEach((year) => {
    revenueTotals[year] =
      getNumber(
        revenue["Recruitment Revenue"]?.[year]
      ) +
      getNumber(
        revenue["Franchisee Revenue"]?.[year]
      ) +
      getNumber(
        revenue["Job portal Revenue"]?.[year]
      );
  });

  // ===================================================
  // EXPENDITURE CALCULATIONS
  // ===================================================

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

  // ===================================================
  // SALARY CALCULATIONS
  // ===================================================

  const salaryTotals = {};

  financialYears.forEach((year) => {
    salaryTotals[year] =
      getNumber(
        salary["Recruitment Salary"]?.[year]
      ) +
      getNumber(
        salary["Franchisee Salary"]?.[year]
      ) +
      getNumber(
        salary["Job portal Salary"]?.[year]
      );
  });

  // ===================================================
  // FINAL REVENUE CALCULATIONS
  // ===================================================

  const finalRevenue = {
    Recruitment: {},
    Franchisee: {},
    "Job portal": {},
    Total: {},
  };

  financialYears.forEach((year) => {
    // Recruitment
    finalRevenue.Recruitment[year] =
      getNumber(
        revenue["Recruitment Revenue"]?.[year]
      ) -
      getNumber(
        expenditure[
          "Recruitment Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary["Recruitment Salary"]?.[year]
      );

    // Franchisee
    finalRevenue.Franchisee[year] =
      getNumber(
        revenue["Franchisee Revenue"]?.[year]
      ) -
      getNumber(
        expenditure[
          "Franchisee Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary["Franchisee Salary"]?.[year]
      );

    // Job portal
    finalRevenue["Job portal"][year] =
      getNumber(
        revenue["Job portal Revenue"]?.[year]
      ) -
      getNumber(
        expenditure[
          "Job portal Expenditure"
        ]?.[year]
      ) -
      getNumber(
        salary["Job portal Salary"]?.[year]
      );

    // Total Final Revenue
    finalRevenue.Total[year] =
      finalRevenue.Recruitment[year] +
      finalRevenue.Franchisee[year] +
      finalRevenue["Job portal"][year];
  });

  // ===================================================
  // OVERALL REVENUE
  // ===================================================

  const overallRevenue = {
    ...finalRevenue.Total,
  };

  // ===================================================
  // INCOME TAX
  // ===================================================

  const incomeTax = {};

  financialYears.forEach((year) => {
    incomeTax[year] =
      overallRevenue[year] *
      (getNumber(incomeTaxPercentage) / 100);
  });

  // ===================================================
  // NET INCOME
  // ===================================================

  const netIncome = {};

  financialYears.forEach((year) => {
    netIncome[year] =
      overallRevenue[year] -
      incomeTax[year];
  });

  // ===================================================
  // FORMAT NUMBER
  // ===================================================

  function formatNumber(value) {
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }

  // ===================================================
  // RENDER
  // ===================================================

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
          REVENUE SECTION
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

                {financialYears.map((year) => (
                  <th key={year}>{year}</th>
                ))}

              </tr>

            </thead>

            <tbody>

              {revenueRows.map((row) => (

                <tr key={row}>

                  <td>{row}</td>

                  {financialYears.map((year) => (

                    <td key={year}>

                      <AmountInput
                        value={
                          revenue[row]?.[year] || ""
                        }
                        disabled={isSaved}
                        onChange={(value) =>
                          handleRevenueChange(
                            row,
                            year,
                            value
                          )
                        }
                      />

                    </td>

                  ))}

                </tr>

              ))}

              <tr className="total-row">

                <td>Total Revenue</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      revenueTotals[year]
                    )}

                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          EXPENDITURE SECTION
      ================================================= */}

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
                  <th key={year}>{year}</th>
                ))}

              </tr>

            </thead>

            <tbody>

              {expenditureRows.map((row) => (

                <tr key={row}>

                  <td>{row}</td>

                  {financialYears.map((year) => (

                    <td key={year}>

                      <AmountInput
                        value={
                          expenditure[row]?.[year] ||
                          ""
                        }
                        disabled={isSaved}
                        onChange={(value) =>
                          handleExpenditureChange(
                            row,
                            year,
                            value
                          )
                        }
                      />

                    </td>

                  ))}

                </tr>

              ))}

              <tr className="total-row">

                <td>Total Expenditure</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      expenditureTotals[year]
                    )}

                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          SALARY SECTION
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

                {financialYears.map((year) => (
                  <th key={year}>{year}</th>
                ))}

              </tr>

            </thead>

            <tbody>

              {salaryRows.map((row) => (

                <tr key={row}>

                  <td>{row}</td>

                  {financialYears.map((year) => (

                    <td key={year}>

                      <AmountInput
                        value={
                          salary[row]?.[year] || ""
                        }
                        disabled={isSaved}
                        onChange={(value) =>
                          handleSalaryChange(
                            row,
                            year,
                            value
                          )
                        }
                      />

                    </td>

                  ))}

                </tr>

              ))}

              <tr className="total-row">

                <td>Total Salary</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      salaryTotals[year]
                    )}

                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          FINAL REVENUE SECTION
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

                {financialYears.map((year) => (
                  <th key={year}>{year}</th>
                ))}

              </tr>

            </thead>

            <tbody>

              <tr>

                <td>Recruitment</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      finalRevenue.Recruitment[year]
                    )}

                  </td>

                ))}

              </tr>

              <tr>

                <td>Franchisee</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      finalRevenue.Franchisee[year]
                    )}

                  </td>

                ))}

              </tr>

              <tr>

                <td>Job portal</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      finalRevenue["Job portal"][year]
                    )}

                  </td>

                ))}

              </tr>

              <tr className="total-row">

                <td>Total Final Revenue</td>

                {financialYears.map((year) => (

                  <td key={year}>

                    {formatNumber(
                      finalRevenue.Total[year]
                    )}

                  </td>

                ))}

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

                {financialYears.map((year) => (
                  <th key={year}>{year}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Overall Revenue */}
              <tr>
                <td>Overall Revenue</td>

                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(overallRevenue[year])}
                  </td>
                ))}
              </tr>

              {/* Income Tax % */}
              <tr>
                <td>Income Tax %</td>

                {financialYears.map((year) => (
                  <td key={year}>
                    <div className="tax-input-wrapper">
                      <TaxInput
                        value={incomeTaxPercentage}
                        disabled={isSaved}
                        onChange={handleIncomeTaxChange}
                      />
                      <span>%</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Income Tax */}
              <tr>
                <td>Income Tax</td>

                {financialYears.map((year) => (
                  <td key={year}>
                    {formatNumber(incomeTax[year])}
                  </td>
                ))}
              </tr>

              {/* Net Income */}
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

      {/* =================================================
          SAVE / EDIT BUTTONS
      ================================================= */}

      <div className="revenue-action-buttons">

        <button
          type="button"
          className="revenue-save-button"
          onClick={handleSave}
        >
          Save
        </button>

        <button
          type="button"
          className="revenue-edit-button"
          onClick={handleEdit}
        >
          Edit
        </button>

      </div>

    </div>
  );
}

export default Revenue;