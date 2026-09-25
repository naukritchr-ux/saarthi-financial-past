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
// IMPORTANT:
// This component is outside Revenue() so the input
// does not lose focus after every keystroke.
// =====================================================

function AmountInput({ value, onChange }) {
  return (
    <input
      className="revenue-input"
      type="text"
      inputMode="numeric"
      value={value}
      placeholder="Enter amount"
      autoComplete="off"
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

function TaxInput({ value, onChange }) {
  return (
    <input
      className="revenue-input tax-input"
      type="text"
      inputMode="decimal"
      value={value}
      placeholder="%"
      autoComplete="off"
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
// REVENUE COMPONENT
// =====================================================

function Revenue() {

  // ===================================================
  // STATES
  // ===================================================

  const [revenue, setRevenue] = useState(
    createInitialData(revenueRows)
  );

  const [expenditure, setExpenditure] = useState(
    createInitialData(expenditureRows)
  );

  const [salary, setSalary] = useState(
    createInitialData(salaryRows)
  );

  const [incomeTaxPercentage, setIncomeTaxPercentage] =
    useState("");


  // ===================================================
  // REVENUE INPUT HANDLER
  // ===================================================

  function handleRevenueChange(row, year, value) {
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

  function handleExpenditureChange(row, year, value) {
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

  function handleSalaryChange(row, year, value) {
    setSalary((previous) => ({
      ...previous,

      [row]: {
        ...previous[row],
        [year]: value,
      },
    }));
  }


  // ===================================================
  // TOTAL REVENUE
  // ===================================================

  function getRevenueTotal(year) {
    return (
      getNumber(
        revenue["Recruitment Revenue"][year]
      ) +
      getNumber(
        revenue["Franchisee Revenue"][year]
      ) +
      getNumber(
        revenue["Job portal Revenue"][year]
      )
    );
  }


  // ===================================================
  // TOTAL EXPENDITURE
  // ===================================================

  function getExpenditureTotal(year) {
    return (
      getNumber(
        expenditure["Recruitment Expenditure"][year]
      ) +
      getNumber(
        expenditure["Franchisee Expenditure"][year]
      ) +
      getNumber(
        expenditure["Job portal Expenditure"][year]
      )
    );
  }


  // ===================================================
  // TOTAL SALARY
  // ===================================================

  function getSalaryTotal(year) {
    return (
      getNumber(
        salary["Recruitment Salary"][year]
      ) +
      getNumber(
        salary["Franchisee Salary"][year]
      ) +
      getNumber(
        salary["Job portal Salary"][year]
      )
    );
  }


  // ===================================================
  // FINAL RECRUITMENT REVENUE
  // ===================================================

  function getFinalRecruitment(year) {
    return (
      getNumber(
        revenue["Recruitment Revenue"][year]
      ) -
      getNumber(
        expenditure["Recruitment Expenditure"][year]
      ) -
      getNumber(
        salary["Recruitment Salary"][year]
      )
    );
  }


  // ===================================================
  // FINAL FRANCHISEE REVENUE
  // ===================================================

  function getFinalFranchisee(year) {
    return (
      getNumber(
        revenue["Franchisee Revenue"][year]
      ) -
      getNumber(
        expenditure["Franchisee Expenditure"][year]
      ) -
      getNumber(
        salary["Franchisee Salary"][year]
      )
    );
  }


  // ===================================================
  // FINAL JOB PORTAL REVENUE
  // ===================================================

  function getFinalJobPortal(year) {
    return (
      getNumber(
        revenue["Job portal Revenue"][year]
      ) -
      getNumber(
        expenditure["Job portal Expenditure"][year]
      ) -
      getNumber(
        salary["Job portal Salary"][year]
      )
    );
  }


  // ===================================================
  // TOTAL FINAL REVENUE
  // ===================================================

  function getFinalRevenueTotal(year) {
    return (
      getFinalRecruitment(year) +
      getFinalFranchisee(year) +
      getFinalJobPortal(year)
    );
  }


  // ===================================================
  // OVERALL REVENUE
  // ===================================================

  function getOverallRevenue(year) {
    return getFinalRevenueTotal(year);
  }


  // ===================================================
  // INCOME TAX
  // ===================================================

  function getIncomeTax(year) {
    const overallRevenue = getOverallRevenue(year);

    const percentage =
      getNumber(incomeTaxPercentage);

    return (
      (overallRevenue * percentage) / 100
    );
  }


  // ===================================================
  // NET INCOME
  // ===================================================

  function getNetIncome(year) {
    return (
      getOverallRevenue(year) -
      getIncomeTax(year)
    );
  }


  // ===================================================
  // JSX
  // ===================================================

  return (
    <div className="revenue-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="revenue-page-header">

        <h1>Revenue</h1>

        <p>
          Financial revenue and expenditure overview
        </p>

      </div>


      {/* =================================================
          REVENUE SECTION
      ================================================= */}

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>Revenue</h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Particular
                </th>

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

                  <td>
                    {row}
                  </td>


                  {financialYears.map((year) => (

                    <td key={year}>

                      <AmountInput
                        value={revenue[row][year]}
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

                <td>
                  Total Revenue
                </td>


                {financialYears.map((year) => (

                  <td key={year}>
                    {getRevenueTotal(year)}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =================================================
          EXPENSES SECTION
      ================================================= */}

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>Expenses</h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Particular
                </th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}

              </tr>

            </thead>


            <tbody>

              {expenditureRows.map((row) => (

                <tr key={row}>

                  <td>
                    {row}
                  </td>


                  {financialYears.map((year) => (

                    <td key={year}>

                      <AmountInput
                        value={
                          expenditure[row][year]
                        }
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

                <td>
                  Total Expenditure
                </td>


                {financialYears.map((year) => (

                  <td key={year}>
                    {getExpenditureTotal(year)}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =================================================
          SALARY SECTION
      ================================================= */}

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>Salary</h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Particular
                </th>

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

                  <td>
                    {row}
                  </td>


                  {financialYears.map((year) => (

                    <td key={year}>

                      <AmountInput
                        value={
                          salary[row][year]
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

                  ))}

                </tr>

              ))}


              <tr className="total-row">

                <td>
                  Total Salary
                </td>


                {financialYears.map((year) => (

                  <td key={year}>
                    {getSalaryTotal(year)}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =================================================
          FINAL REVENUE SECTION
      ================================================= */}

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>Final Revenue</h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Particular
                </th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}

              </tr>

            </thead>


            <tbody>

              {/* RECRUITMENT */}

              <tr>

                <td>
                  Recruitment
                </td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {getFinalRecruitment(year)}
                  </td>

                ))}

              </tr>


              {/* FRANCHISEE */}

              <tr>

                <td>
                  Franchisee
                </td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {getFinalFranchisee(year)}
                  </td>

                ))}

              </tr>


              {/* JOB PORTAL */}

              <tr>

                <td>
                  Job portal
                </td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {getFinalJobPortal(year)}
                  </td>

                ))}

              </tr>


              {/* TOTAL */}

              <tr className="total-row">

                <td>
                  Total Final Revenue
                </td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {getFinalRevenueTotal(year)}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =================================================
          OVERALL REVENUE SECTION
      ================================================= */}

      <section className="revenue-section overall-revenue-section">

        <div className="revenue-section-header">

          <h2>
            Overall Revenue
          </h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Particular
                </th>

                {financialYears.map((year) => (
                  <th key={year}>
                    {year}
                  </th>
                ))}

              </tr>

            </thead>


            <tbody>

              {/* =================================================
                  OVERALL REVENUE
              ================================================= */}

              <tr>

                <td>
                  Overall Revenue
                </td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {getOverallRevenue(year)}
                  </td>

                ))}

              </tr>


              {/* =================================================
                  INCOME TAX %
              ================================================= */}

              <tr>

                <td>
                  Income Tax %
                </td>


                {financialYears.map((year) => (

                  <td key={year}>

                    <div className="tax-input-wrapper">

                      <TaxInput
                        value={incomeTaxPercentage}
                        onChange={
                          setIncomeTaxPercentage
                        }
                      />

                      <span>
                        %
                      </span>

                    </div>

                  </td>

                ))}

              </tr>


              {/* =================================================
                  INCOME TAX
              ================================================= */}

              <tr>

                <td>
                  Income Tax
                </td>


                {financialYears.map((year) => (

                  <td key={year}>
                    {getIncomeTax(year)}
                  </td>

                ))}

              </tr>


              {/* =================================================
                  NET INCOME
              ================================================= */}

              <tr className="net-income-row">

                <td>
                  Net Income
                </td>


                {financialYears.map((year) => (

                  <td key={year}>
                    {getNetIncome(year)}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}


export default Revenue;