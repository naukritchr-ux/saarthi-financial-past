import { useState } from "react";
import "./revenue.css";

const financialYears = [
  "FY 2021-2022",
  "FY 2022-2023",
  "FY 2023-2024"
];

const revenueRows = [
  "Recruitment Revenue",
  "Franchisee Revenue",
  "Job portal Revenue"
];

const expenditureRows = [
  "Recruitment Expenditure",
  "Franchisee Expenditure",
  "Job portal Expenditure"
];

const salaryRows = [
  "Recruitment Salary",
  "Franchisee Salary",
  "Job portal Salary"
];

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

function Revenue() {

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

  function formatCurrency(value) {
    return getNumber(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
  }

  function handleRevenueChange(row, year, value) {
    setRevenue((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value
      }
    }));
  }

  function handleExpenditureChange(row, year, value) {
    setExpenditure((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value
      }
    }));
  }

  function handleSalaryChange(row, year, value) {
    setSalary((previous) => ({
      ...previous,
      [row]: {
        ...previous[row],
        [year]: value
      }
    }));
  }

  function getTotalRevenue(year) {
    return revenueRows.reduce(
      (total, row) =>
        total + getNumber(revenue[row][year]),
      0
    );
  }

  function getTotalExpenditure(year) {
    return expenditureRows.reduce(
      (total, row) =>
        total + getNumber(expenditure[row][year]),
      0
    );
  }

  function getTotalSalary(year) {
    return salaryRows.reduce(
      (total, row) =>
        total + getNumber(salary[row][year]),
      0
    );
  }

  function getFinalRecruitmentRevenue(year) {
    return (
      getNumber(revenue["Recruitment Revenue"][year]) -
      getNumber(expenditure["Recruitment Expenditure"][year]) -
      getNumber(salary["Recruitment Salary"][year])
    );
  }

  function getFinalFranchiseeRevenue(year) {
    return (
      getNumber(revenue["Franchisee Revenue"][year]) -
      getNumber(expenditure["Franchisee Expenditure"][year]) -
      getNumber(salary["Franchisee Salary"][year])
    );
  }

  function getFinalJobPortalRevenue(year) {
    return (
      getNumber(revenue["Job portal Revenue"][year]) -
      getNumber(expenditure["Job portal Expenditure"][year]) -
      getNumber(salary["Job portal Salary"][year])
    );
  }

  function getOverallRevenue(year) {
    return (
      getFinalRecruitmentRevenue(year) +
      getFinalFranchiseeRevenue(year) +
      getFinalJobPortalRevenue(year)
    );
  }

  function getIncomeTax(year) {
    const overallRevenue = getOverallRevenue(year);
    const taxPercentage = getNumber(incomeTaxPercentage);

    return (overallRevenue * taxPercentage) / 100;
  }

  function getNetIncome(year) {
    return (
      getOverallRevenue(year) -
      getIncomeTax(year)
    );
  }

  /*
   * Amount Input
   *
   * Keep the value as a string while typing.
   * This allows 6, 7, 8 or more digits.
   */
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

          const value = event.target.value;

          /*
           * Only numbers are allowed.
           */
          if (/^\d*$/.test(value)) {
            onChange(value);
          }

        }}
      />
    );
  }

  /*
   * Income Tax Percentage Input
   */
  function TaxInput() {

    return (
      <input
        className="revenue-input tax-input"
        type="text"
        inputMode="decimal"
        value={incomeTaxPercentage}
        placeholder="%"
        autoComplete="off"
        onChange={(event) => {

          const value = event.target.value;

          if (
            value === "" ||
            /^\d*\.?\d*$/.test(value)
          ) {
            setIncomeTaxPercentage(value);
          }

        }}
      />
    );
  }

  return (

    <div className="revenue-page">

      {/* =========================
          REVENUE
      ========================== */}

      <section className="revenue-section">

        <h2>Revenue</h2>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>
              <tr>
                <th>Revenue</th>

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

                <td>Total Revenue</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getTotalRevenue(year)
                    )}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =========================
          EXPENSES
      ========================== */}

      <section className="revenue-section">

        <h2>Expenses</h2>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Expenses</th>

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
                        value={expenditure[row][year]}
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
                    {formatCurrency(
                      getTotalExpenditure(year)
                    )}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =========================
          SALARY
      ========================== */}

      <section className="revenue-section">

        <h2>Salary</h2>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Salary</th>

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
                        value={salary[row][year]}
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
                    {formatCurrency(
                      getTotalSalary(year)
                    )}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =========================
          FINAL REVENUE
      ========================== */}

      <section className="revenue-section">

        <h2>Final Revenue</h2>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Final Revenue</th>

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
                    {formatCurrency(
                      getFinalRecruitmentRevenue(year)
                    )}
                  </td>

                ))}

              </tr>

              <tr>

                <td>Franchisee</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getFinalFranchiseeRevenue(year)
                    )}
                  </td>

                ))}

              </tr>

              <tr>

                <td>Job portal</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getFinalJobPortalRevenue(year)
                    )}
                  </td>

                ))}

              </tr>

              <tr className="total-row">

                <td>Total Final Revenue</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getOverallRevenue(year)
                    )}
                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      {/* =========================
          OVERALL REVENUE
      ========================== */}

      <section className="revenue-section">

        <h2>Overall Revenue</h2>

        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Overall Revenue</th>

                {financialYears.map((year) => (
                  <th key={year}>{year}</th>
                ))}

              </tr>

            </thead>

            <tbody>

              {/* Overall Revenue */}

              <tr className="total-row">

                <td>Overall Revenue</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getOverallRevenue(year)
                    )}
                  </td>

                ))}

              </tr>


              {/* Income Tax Percentage */}

              <tr>

                <td>Income Tax %</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    <TaxInput />
                  </td>

                ))}

              </tr>


              {/* Income Tax */}

              <tr>

                <td>Income Tax</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getIncomeTax(year)
                    )}
                  </td>

                ))}

              </tr>


              {/* Net Income */}

              <tr className="total-row">

                <td>Net Income</td>

                {financialYears.map((year) => (

                  <td key={year}>
                    {formatCurrency(
                      getNetIncome(year)
                    )}
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