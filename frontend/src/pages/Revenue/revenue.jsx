import { useState } from "react";

import "./revenue.css";


function Revenue() {

  /*
   * ============================================================
   * FINANCIAL YEARS
   * ============================================================
   */

  const financialYears = [
    "FY 2021-2022",
    "FY 2022-2023",
    "FY 2023-2024"
  ];


  /*
   * ============================================================
   * INITIAL DATA
   * ============================================================
   */

  const createInitialData = (rows) => {

    const data = {};

    rows.forEach((row) => {

      data[row] = {
        "FY 2021-2022": "",
        "FY 2022-2023": "",
        "FY 2023-2024": ""
      };

    });

    return data;

  };


  /*
   * ============================================================
   * REVENUE
   * ============================================================
   */

  const [revenue, setRevenue] = useState(
    createInitialData([
      "Recruitment Revenue",
      "Franchisee Revenue",
      "Job portal Revenue"
    ])
  );


  /*
   * ============================================================
   * EXPENSES
   * ============================================================
   */

  const [expenses, setExpenses] = useState(
    createInitialData([
      "Recruitment Expenditure",
      "Franchisee Expenditure",
      "Job portal Expenditure"
    ])
  );


  /*
   * ============================================================
   * SALARY
   * ============================================================
   */

  const [salary, setSalary] = useState(
    createInitialData([
      "Recruitment Salary",
      "Franchisee Salary",
      "Job portal Salary"
    ])
  );


  /*
   * ============================================================
   * INCOME TAX
   * ============================================================
   */

  const [incomeTaxPercentage, setIncomeTaxPercentage] =
    useState("");


  /*
   * ============================================================
   * NUMBER CONVERSION
   * ============================================================
   */

  function getNumber(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return number;

  }


  /*
   * ============================================================
   * FORMAT CURRENCY
   * ============================================================
   */

  function formatCurrency(value) {

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(getNumber(value));

  }


  /*
   * ============================================================
   * HANDLE REVENUE INPUT
   * ============================================================
   */

  function handleRevenueChange(
    row,
    year,
    value
  ) {

    setRevenue((previous) => ({

      ...previous,

      [row]: {

        ...previous[row],

        [year]: value

      }

    }));

  }


  /*
   * ============================================================
   * HANDLE EXPENSE INPUT
   * ============================================================
   */

  function handleExpenseChange(
    row,
    year,
    value
  ) {

    setExpenses((previous) => ({

      ...previous,

      [row]: {

        ...previous[row],

        [year]: value

      }

    }));

  }


  /*
   * ============================================================
   * HANDLE SALARY INPUT
   * ============================================================
   */

  function handleSalaryChange(
    row,
    year,
    value
  ) {

    setSalary((previous) => ({

      ...previous,

      [row]: {

        ...previous[row],

        [year]: value

      }

    }));

  }


  /*
   * ============================================================
   * TOTAL REVENUE
   * ============================================================
   */

  function getTotalRevenue(year) {

    return (

      getNumber(
        revenue["Recruitment Revenue"]?.[year]
      )

      +

      getNumber(
        revenue["Franchisee Revenue"]?.[year]
      )

      +

      getNumber(
        revenue["Job portal Revenue"]?.[year]
      )

    );

  }


  /*
   * ============================================================
   * TOTAL EXPENDITURE
   * ============================================================
   */

  function getTotalExpenditure(year) {

    return (

      getNumber(
        expenses["Recruitment Expenditure"]?.[year]
      )

      +

      getNumber(
        expenses["Franchisee Expenditure"]?.[year]
      )

      +

      getNumber(
        expenses["Job portal Expenditure"]?.[year]
      )

    );

  }


  /*
   * ============================================================
   * TOTAL SALARY
   * ============================================================
   */

  function getTotalSalary(year) {

    return (

      getNumber(
        salary["Recruitment Salary"]?.[year]
      )

      +

      getNumber(
        salary["Franchisee Salary"]?.[year]
      )

      +

      getNumber(
        salary["Job portal Salary"]?.[year]
      )

    );

  }


  /*
   * ============================================================
   * FINAL REVENUE
   *
   * Final Revenue =
   * Revenue - Expenditure - Salary
   * ============================================================
   */

  function getFinalRevenue(
    revenueRow,
    expenseRow,
    salaryRow,
    year
  ) {

    return (

      getNumber(
        revenue[revenueRow]?.[year]
      )

      -

      getNumber(
        expenses[expenseRow]?.[year]
      )

      -

      getNumber(
        salary[salaryRow]?.[year]
      )

    );

  }


  /*
   * ============================================================
   * TOTAL FINAL REVENUE
   * ============================================================
   */

  function getTotalFinalRevenue(year) {

    return (

      getFinalRevenue(
        "Recruitment Revenue",
        "Recruitment Expenditure",
        "Recruitment Salary",
        year
      )

      +

      getFinalRevenue(
        "Franchisee Revenue",
        "Franchisee Expenditure",
        "Franchisee Salary",
        year
      )

      +

      getFinalRevenue(
        "Job portal Revenue",
        "Job portal Expenditure",
        "Job portal Salary",
        year
      )

    );

  }


  /*
   * ============================================================
   * OVERALL REVENUE
   *
   * Overall Revenue =
   * Recruitment Final Revenue
   * + Franchisee Final Revenue
   * + Job Portal Final Revenue
   * ============================================================
   */

  function getOverallRevenue() {

    /*
     * Overall Revenue is calculated
     * separately for each financial year.
     *
     * The latest financial year is used
     * for the Overall Revenue summary.
     */

    const year = "FY 2023-2024";

    return getTotalFinalRevenue(year);

  }


  /*
   * ============================================================
   * INCOME TAX AMOUNT
   * ============================================================
   */

  function getIncomeTaxAmount() {

    const percentage =
      getNumber(incomeTaxPercentage);

    const overallRevenue =
      getOverallRevenue();

    if (
      incomeTaxPercentage === "" ||
      percentage < 0
    ) {

      return 0;

    }

    return (
      overallRevenue *
      percentage /
      100
    );

  }


  /*
   * ============================================================
   * NET CASH INCOME
   *
   * Net Cash Income =
   * Overall Revenue - Income Tax Amount
   * ============================================================
   */

  function getNetCashIncome() {

    return (
      getOverallRevenue()
      -
      getIncomeTaxAmount()
    );

  }


  /*
   * ============================================================
   * INPUT COMPONENT
   * ============================================================
   */

  function AmountInput({
    value,
    onChange
  }) {

    return (

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Enter amount"
        className="revenue-input"
      />

    );

  }


  /*
   * ============================================================
   * REVENUE SECTION
   * ============================================================
   */

  function RevenueSection() {

    return (

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>
            Revenue
          </h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Revenue
                </th>

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
                  Recruitment Revenue
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        revenue[
                          "Recruitment Revenue"
                        ][year]
                      }
                      onChange={(value) =>
                        handleRevenueChange(
                          "Recruitment Revenue",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Franchisee Revenue
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        revenue[
                          "Franchisee Revenue"
                        ][year]
                      }
                      onChange={(value) =>
                        handleRevenueChange(
                          "Franchisee Revenue",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Job portal Revenue
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        revenue[
                          "Job portal Revenue"
                        ][year]
                      }
                      onChange={(value) =>
                        handleRevenueChange(
                          "Job portal Revenue",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


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

    );

  }


  /*
   * ============================================================
   * EXPENSE SECTION
   * ============================================================
   */

  function ExpenseSection() {

    return (

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>
            Expenses
          </h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Expenses
                </th>

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
                  Recruitment Expenditure
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        expenses[
                          "Recruitment Expenditure"
                        ][year]
                      }
                      onChange={(value) =>
                        handleExpenseChange(
                          "Recruitment Expenditure",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Franchisee Expenditure
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        expenses[
                          "Franchisee Expenditure"
                        ][year]
                      }
                      onChange={(value) =>
                        handleExpenseChange(
                          "Franchisee Expenditure",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Job portal Expenditure
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        expenses[
                          "Job portal Expenditure"
                        ][year]
                      }
                      onChange={(value) =>
                        handleExpenseChange(
                          "Job portal Expenditure",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


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

    );

  }


  /*
   * ============================================================
   * SALARY SECTION
   * ============================================================
   */

  function SalarySection() {

    return (

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>
            Salary
          </h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Salary
                </th>

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
                  Recruitment Salary
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        salary[
                          "Recruitment Salary"
                        ][year]
                      }
                      onChange={(value) =>
                        handleSalaryChange(
                          "Recruitment Salary",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Franchisee Salary
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        salary[
                          "Franchisee Salary"
                        ][year]
                      }
                      onChange={(value) =>
                        handleSalaryChange(
                          "Franchisee Salary",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


              <tr>

                <td>
                  Job portal Salary
                </td>

                {financialYears.map((year) => (

                  <td key={year}>

                    <AmountInput
                      value={
                        salary[
                          "Job portal Salary"
                        ][year]
                      }
                      onChange={(value) =>
                        handleSalaryChange(
                          "Job portal Salary",
                          year,
                          value
                        )
                      }
                    />

                  </td>

                ))}

              </tr>


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

    );

  }


  /*
   * ============================================================
   * FINAL REVENUE SECTION
   * ============================================================
   */

  function FinalRevenueSection() {

    return (

      <section className="revenue-section">

        <div className="revenue-section-header">

          <h2>
            Final Revenue
          </h2>

        </div>


        <div className="revenue-table-wrapper">

          <table className="revenue-table">

            <thead>

              <tr>

                <th>
                  Final Revenue
                </th>

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
                      getFinalRevenue(
                        "Recruitment Revenue",
                        "Recruitment Expenditure",
                        "Recruitment Salary",
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
                      getFinalRevenue(
                        "Franchisee Revenue",
                        "Franchisee Expenditure",
                        "Franchisee Salary",
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
                      getFinalRevenue(
                        "Job portal Revenue",
                        "Job portal Expenditure",
                        "Job portal Salary",
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
                      getTotalFinalRevenue(year)
                    )}

                  </td>

                ))}

              </tr>

            </tbody>

          </table>

        </div>

      </section>

    );

  }


  /*
   * ============================================================
   * OVERALL REVENUE SECTION
   * ============================================================
   */

  function OverallRevenueSection() {

    const overallRevenue =
      getOverallRevenue();

    const incomeTaxAmount =
      getIncomeTaxAmount();

    const netCashIncome =
      getNetCashIncome();


    const latestYear =
      "FY 2023-2024";


    const recruitmentFinalRevenue =
      getFinalRevenue(
        "Recruitment Revenue",
        "Recruitment Expenditure",
        "Recruitment Salary",
        latestYear
      );


    const franchiseeFinalRevenue =
      getFinalRevenue(
        "Franchisee Revenue",
        "Franchisee Expenditure",
        "Franchisee Salary",
        latestYear
      );


    const jobPortalFinalRevenue =
      getFinalRevenue(
        "Job portal Revenue",
        "Job portal Expenditure",
        "Job portal Salary",
        latestYear
      );


    return (

      <section className="revenue-section overall-revenue-section">

        <div className="revenue-section-header">

          <h2>
            Overall Revenue
          </h2>

        </div>


        <div className="overall-revenue-table-wrapper">

          <table className="overall-revenue-table">

            <tbody>

              <tr>

                <td>
                  Recruitment
                </td>

                <td>
                  {formatCurrency(
                    recruitmentFinalRevenue
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Franchisee
                </td>

                <td>
                  {formatCurrency(
                    franchiseeFinalRevenue
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Job portal
                </td>

                <td>
                  {formatCurrency(
                    jobPortalFinalRevenue
                  )}
                </td>

              </tr>


              <tr className="total-row">

                <td>
                  Overall Revenue
                </td>

                <td>
                  {formatCurrency(
                    overallRevenue
                  )}
                </td>

              </tr>


              <tr>

                <td>
                  Income Tax %
                </td>

                <td>

                  <div className="tax-input-wrapper">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={incomeTaxPercentage}
                      onChange={(event) =>
                        setIncomeTaxPercentage(
                          event.target.value
                        )
                      }
                      placeholder="Enter %"
                      className="tax-input"
                    />

                    <span>
                      %
                    </span>

                  </div>

                </td>

              </tr>


              <tr>

                <td>
                  Income Tax Amount
                </td>

                <td>
                  {formatCurrency(
                    incomeTaxAmount
                  )}
                </td>

              </tr>


              <tr className="net-income-row">

                <td>
                  Net Cash Income
                </td>

                <td>
                  {formatCurrency(
                    netCashIncome
                  )}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </section>

    );

  }


  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (

    <div className="revenue-page">

      <div className="revenue-page-header">

        <h1>
          Revenue
        </h1>

        <p>
          Revenue, expenses, salary and final revenue
          financial summary
        </p>

      </div>


      <RevenueSection />

      <ExpenseSection />

      <SalarySection />

      <FinalRevenueSection />

      <OverallRevenueSection />

    </div>

  );

}


export default Revenue;