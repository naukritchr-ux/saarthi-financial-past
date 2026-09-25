import { useState } from "react";
import "./Revenue.css";


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


  /*
   * Convert an input value to a number only when
   * performing calculations.
   *
   * The actual input state remains a string.
   * This prevents the input from accepting only
   * one digit at a time.
   */
  function getNumber(value) {

    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    const number = parseFloat(value);

    return Number.isFinite(number) ? number : 0;
  }


  /*
   * Format calculated amounts.
   */
  function formatCurrency(value) {

    return getNumber(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  }


  /*
   * Handle Revenue input.
   */
  function handleRevenueChange(row, year, value) {

    setRevenue((previous) => ({

      ...previous,

      [row]: {

        ...previous[row],

        [year]: value

      }

    }));

  }


  /*
   * Handle Expenditure input.
   */
  function handleExpenditureChange(row, year, value) {

    setExpenditure((previous) => ({

      ...previous,

      [row]: {

        ...previous[row],

        [year]: value

      }

    }));

  }


  /*
   * Handle Salary input.
   */
  function handleSalaryChange(row, year, value) {

    setSalary((previous) => ({

      ...previous,

      [row]: {

        ...previous[row],

        [year]: value

      }

    }));

  }


  /*
   * Total Revenue
   */
  function getTotalRevenue(year) {

    return revenueRows.reduce(

      (total, row) => {

        return total + getNumber(
          revenue[row][year]
        );

      },

      0

    );

  }


  /*
   * Total Expenditure
   */
  function getTotalExpenditure(year) {

    return expenditureRows.reduce(

      (total, row) => {

        return total + getNumber(
          expenditure[row][year]
        );

      },

      0

    );

  }


  /*
   * Total Salary
   */
  function getTotalSalary(year) {

    return salaryRows.reduce(

      (total, row) => {

        return total + getNumber(
          salary[row][year]
        );

      },

      0

    );

  }


  /*
   * Final Recruitment Revenue
   */
  function getFinalRecruitmentRevenue(year) {

    return (

      getNumber(
        revenue["Recruitment Revenue"][year]
      )

      -

      getNumber(
        expenditure["Recruitment Expenditure"][year]
      )

      -

      getNumber(
        salary["Recruitment Salary"][year]
      )

    );

  }


  /*
   * Final Franchisee Revenue
   */
  function getFinalFranchiseeRevenue(year) {

    return (

      getNumber(
        revenue["Franchisee Revenue"][year]
      )

      -

      getNumber(
        expenditure["Franchisee Expenditure"][year]
      )

      -

      getNumber(
        salary["Franchisee Salary"][year]
      )

    );

  }


  /*
   * Final Job Portal Revenue
   */
  function getFinalJobPortalRevenue(year) {

    return (

      getNumber(
        revenue["Job portal Revenue"][year]
      )

      -

      getNumber(
        expenditure["Job portal Expenditure"][year]
      )

      -

      getNumber(
        salary["Job portal Salary"][year]
      )

    );

  }


  /*
   * Total Final Revenue / Overall Revenue
   *
   * This is calculated separately for each
   * financial year.
   */
  function getOverallRevenue(year) {

    return (

      getFinalRecruitmentRevenue(year)

      +

      getFinalFranchiseeRevenue(year)

      +

      getFinalJobPortalRevenue(year)

    );

  }


  /*
   * Income Tax Amount
   *
   * Same percentage is applied to the
   * Overall Revenue of each financial year.
   */
  function getIncomeTax(year) {

    const overallRevenue = getOverallRevenue(year);

    const taxPercentage = getNumber(
      incomeTaxPercentage
    );

    return (
      overallRevenue * taxPercentage
    ) / 100;

  }


  /*
   * Net Income
   *
   * Net Income =
   * Overall Revenue - Income Tax Amount
   */
  function getNetIncome(year) {

    return (

      getOverallRevenue(year)

      -

      getIncomeTax(year)

    );

  }


  /*
   * Reusable input component.
   */
  function AmountInput({
    value,
    onChange
  }) {

    return (

      <input

        type="text"

        inputMode="decimal"

        value={value}

        onChange={(event) => {

          const newValue = event.target.value;

          /*
           * Allow:
           * 123
           * 123.45
           * empty value
           *
           * Do not allow letters or other characters.
           */
          if (
            newValue === "" ||
            /^\d*\.?\d*$/.test(newValue)
          ) {

            onChange(newValue);

          }

        }}

        placeholder="Enter amount"

      />

    );

  }


  return (

    <div className="revenue-page">


      {/* =====================================================
          REVENUE
      ===================================================== */}

      <section className="revenue-section">

        <h2>Revenue</h2>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Revenue</th>

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

                        value={
                          revenue[row][year]
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

                  ))}

                </tr>

              ))}


              <tr className="total-row">

                <td>
                  Total Revenue
                </td>


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



      {/* =====================================================
          EXPENSES
      ===================================================== */}

      <section className="revenue-section">

        <h2>Expenses</h2>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Expenses</th>

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



      {/* =====================================================
          SALARY
      ===================================================== */}

      <section className="revenue-section">

        <h2>Salary</h2>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Salary</th>

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



      {/* =====================================================
          FINAL REVENUE
      ===================================================== */}

      <section className="revenue-section">

        <h2>Final Revenue</h2>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Final Revenue</th>

                {financialYears.map((year) => (

                  <th key={year}>
                    {year}
                  </th>

                ))}

              </tr>

            </thead>


            <tbody>

              <tr>

                <td>
                  Recruitment
                </td>


                {financialYears.map((year) => (

                  <td key={year}>

                    {formatCurrency(
                      getFinalRecruitmentRevenue(
                        year
                      )
                    )}

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Franchisee
                </td>


                {financialYears.map((year) => (

                  <td key={year}>

                    {formatCurrency(
                      getFinalFranchiseeRevenue(
                        year
                      )
                    )}

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Job portal
                </td>


                {financialYears.map((year) => (

                  <td key={year}>

                    {formatCurrency(
                      getFinalJobPortalRevenue(
                        year
                      )
                    )}

                  </td>

                ))}

              </tr>


              <tr className="total-row">

                <td>
                  Total Final Revenue
                </td>


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



      {/* =====================================================
          OVERALL REVENUE
      ===================================================== */}

      <section className="revenue-section">

        <h2>Overall Revenue</h2>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>Overall Revenue</th>

                {financialYears.map((year) => (

                  <th key={year}>
                    {year}
                  </th>

                ))}

              </tr>

            </thead>


            <tbody>

              {/* Overall Revenue */}

              <tr className="total-row">

                <td>
                  Overall Revenue
                </td>


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

                <td>
                  Income Tax %
                </td>


                {financialYears.map((year) => (

                  <td key={year}>

                    <input

                      type="text"

                      inputMode="decimal"

                      value={
                        incomeTaxPercentage
                      }

                      onChange={(event) => {

                        const value =
                          event.target.value;

                        if (
                          value === "" ||
                          /^\d*\.?\d*$/.test(value)
                        ) {

                          setIncomeTaxPercentage(
                            value
                          );

                        }

                      }}

                      placeholder="%"

                    />

                  </td>

                ))}

              </tr>


              {/* Income Tax */}

              <tr>

                <td>
                  Income Tax
                </td>


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

                <td>
                  Net Income
                </td>


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