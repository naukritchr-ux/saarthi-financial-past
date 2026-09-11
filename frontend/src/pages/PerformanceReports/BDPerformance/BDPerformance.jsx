import React, { useMemo, useState } from "react";

import {
  useData
} from "../../../context/DataContext";

import "./BDPerformance.css";


function BDPerformance() {

  const {
    rows,
    getFinancialYearFromRow
  } = useData();


  /* ============================================================
     BASIC HELPERS
     ============================================================ */

  const toNumber = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    if (typeof value === "number") {
      return isNaN(value) ? 0 : value;
    }

    const cleanedValue = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    const number = Number(cleanedValue);

    return isNaN(number) ? 0 : number;
  };


  const fullCurrency = (value) => {

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(toNumber(value));
  };


  /* ============================================================
     FIELD HELPERS
     ============================================================ */

  const getBDMember = (row) => {

    return String(
      row["BD Member"] ??
      row.BDMember ??
      row.bd_member ??
      ""
    ).trim();
  };


  const getIndustry = (row) => {

    return String(
      row["Industry"] ??
      row.industry ??
      "Unknown"
    ).trim() || "Unknown";
  };


  const getCity = (row) => {

    return String(
      row["City"] ??
      row.city ??
      "Unknown"
    ).trim() || "Unknown";
  };


  const getInfoStatus = (row) => {

    return String(
      row["Info"] ??
      row.info ??
      ""
    ).trim().toUpperCase();
  };


  /* ============================================================
     BILLING

     DATABASE FIELD:
     total_bill_amount

     NO TANN
     NO TDS
     ============================================================ */

  const getBilling = (row) => {

    return toNumber(
      row["Total Bill Amount"] ??
      row.total_bill_amount ??
      row["total_bill_amount"] ??
      0
    );
  };


  /* ============================================================
     FRANCHISEE SHARE

     DATABASE FIELD:
     franchisee_share
     ============================================================ */

  const getFranchiseeShare = (row) => {

    return toNumber(
      row["Franchisee Share"] ??
      row.franchisee_share ??
      row["franchisee_share"] ??
      0
    );
  };


  /* ============================================================
     DATE HELPERS
     ============================================================ */

  const parseDate = (value) => {

    if (!value) {
      return null;
    }


    if (value instanceof Date) {

      return isNaN(value.getTime())
        ? null
        : value;
    }


    /* Excel serial date */

    if (
      typeof value === "number" &&
      value > 20000 &&
      value < 60000
    ) {

      const excelDate = new Date(
        Math.round(
          (value - 25569) *
          86400 *
          1000
        )
      );

      return isNaN(excelDate.getTime())
        ? null
        : excelDate;
    }


    const stringValue =
      String(value).trim();


    /* DD/MM/YYYY */

    const slashMatch =
      stringValue.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );


    if (slashMatch) {

      const day =
        Number(slashMatch[1]);

      const month =
        Number(slashMatch[2]) - 1;

      const year =
        Number(slashMatch[3]);

      const date =
        new Date(
          year,
          month,
          day
        );

      return isNaN(date.getTime())
        ? null
        : date;
    }


    /* DD-MM-YYYY */

    const dashMatch =
      stringValue.match(
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/
      );


    if (dashMatch) {

      const day =
        Number(dashMatch[1]);

      const month =
        Number(dashMatch[2]) - 1;

      const year =
        Number(dashMatch[3]);

      const date =
        new Date(
          year,
          month,
          day
        );

      return isNaN(date.getTime())
        ? null
        : date;
    }


    const date =
      new Date(stringValue);


    return isNaN(date.getTime())
      ? null
      : date;
  };


  const getAcquiredDate = (row) => {

    return (
      row["Date Client Acquired"] ??
      row["Date of Client Acquired"] ??
      row["Client Acquired Date"] ??
      row.date_client_acquired ??
      row["Acquisition Date"] ??
      null
    );
  };


  const getFinancialYear = (row) => {

    if (
      typeof getFinancialYearFromRow ===
      "function"
    ) {

      const contextYear =
        getFinancialYearFromRow(row);

      if (contextYear) {
        return contextYear;
      }
    }


    const date =
      parseDate(
        getAcquiredDate(row)
      );


    if (!date) {
      return "Unknown";
    }


    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;


    if (month >= 4) {

      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
    }


    return `${year - 1}-${String(
      year
    ).slice(-2)}`;
  };


  /* ============================================================
     FINANCIAL MONTHS
     ============================================================ */

  const financialMonths = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March"
  ];


  const getFinancialMonth = (row) => {

    const date =
      parseDate(
        getAcquiredDate(row)
      );


    if (!date) {
      return "Unknown";
    }


    const calendarMonth =
      date.getMonth();


    const financialMonthIndex =
      calendarMonth >= 3
        ? calendarMonth - 3
        : calendarMonth + 9;


    return financialMonths[
      financialMonthIndex
    ];
  };


  /* ============================================================
     FINANCIAL CALCULATION

     ALL:
       Billing = R + RV + C + CN
       Net Amount = Billing - Franchisee Share
       BD Expenditure = 5% Billing

     R:
       Billing = R Billing
       Net Amount = R Billing - R Franchisee Share
       BD Expenditure = 5% R Billing

     RV:
       Billing = RV Billing
       Net Amount = 0
       BD Expenditure = 0

     C:
       Billing = C Billing
       Net Amount = 0
       BD Expenditure = 0

     CN:
       Billing = CN Billing
       Net Amount = 0
       BD Expenditure = 0
     ============================================================ */

  const getFinancialValues = (
    row,
    infoFilter = ""
  ) => {

    const info =
      getInfoStatus(row);

    const billing =
      getBilling(row);

    const franchiseeShare =
      getFranchiseeShare(row);


    /* ==========================================================
       ALL
       ========================================================== */

    if (
      !infoFilter ||
      infoFilter === "ALL"
    ) {

      return {

        billing:
          billing,

        netAmount:
          billing -
          franchiseeShare,

        bdExpenditure:
          billing * 0.05

      };
    }


    /* ==========================================================
       R
       ========================================================== */

    if (
      infoFilter === "R"
    ) {

      if (
        info !== "R"
      ) {

        return {

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };
      }


      return {

        billing:
          billing,

        netAmount:
          billing -
          franchiseeShare,

        bdExpenditure:
          billing * 0.05

      };
    }


    /* ==========================================================
       RV
       ========================================================== */

    if (
      infoFilter === "RV"
    ) {

      if (
        info !== "RV"
      ) {

        return {

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };
      }


      return {

        billing:
          billing,

        netAmount: 0,

        bdExpenditure: 0

      };
    }


    /* ==========================================================
       C
       ========================================================== */

    if (
      infoFilter === "C"
    ) {

      if (
        info !== "C"
      ) {

        return {

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };
      }


      return {

        billing:
          billing,

        netAmount: 0,

        bdExpenditure: 0

      };
    }


    /* ==========================================================
       CN
       ========================================================== */

    if (
      infoFilter === "CN"
    ) {

      if (
        info !== "CN"
      ) {

        return {

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };
      }


      return {

        billing:
          billing,

        netAmount: 0,

        bdExpenditure: 0

      };
    }


    return {

      billing: 0,

      netAmount: 0,

      bdExpenditure: 0

    };
  };


  /* ============================================================
     STATE
     ============================================================ */

  const [
    selectedMember,
    setSelectedMember
  ] = useState(null);


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  const [
    selectedTableFinancialYear,
    setSelectedTableFinancialYear
  ] = useState("");


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");


  const [
    selectedModalInfoStatus,
    setSelectedModalInfoStatus
  ] = useState("");


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears =
    useMemo(() => {

      const years =
        new Set();


      rows.forEach((row) => {

        years.add(
          getFinancialYear(row)
        );

      });


      return Array.from(years)
        .filter(
          (year) =>
            year !== "Unknown"
        )
        .sort();

    }, [rows]);


  /* ============================================================
     MAIN TABLE FILTER
     ============================================================ */

  const filteredRows =
    useMemo(() => {

      return rows.filter((row) => {

        const year =
          getFinancialYear(row);

        const info =
          getInfoStatus(row);


        if (
          selectedTableFinancialYear &&
          year !==
            selectedTableFinancialYear
        ) {

          return false;
        }


        if (
          selectedInfoStatus &&
          info !== selectedInfoStatus
        ) {

          return false;
        }


        return true;

      });

    }, [
      rows,
      selectedTableFinancialYear,
      selectedInfoStatus
    ]);


  /* ============================================================
     BD MEMBER PERFORMANCE
     ============================================================ */

  const memberPerformance =
    useMemo(() => {

      const grouped = {};


      filteredRows.forEach((row) => {

        const member =
          getBDMember(row);


        if (!member) {
          return;
        }


        if (!grouped[member]) {

          grouped[member] = {

            name:
              member,

            clients: 0,

            billing: 0,

            netAmount: 0,

            bdExpenditure: 0

          };
        }


        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        grouped[member].clients += 1;


        grouped[member].billing +=
          financialValues.billing;


        grouped[member].netAmount +=
          financialValues.netAmount;


        grouped[member].bdExpenditure +=
          financialValues.bdExpenditure;

      });


      return Object.values(grouped);

    }, [
      filteredRows,
      selectedInfoStatus
    ]);


  /* ============================================================
     SELECTED MEMBER ROWS
     ============================================================ */

  const selectedMemberRows =
    useMemo(() => {

      if (!selectedMember) {
        return [];
      }


      return rows.filter((row) => {

        if (
          getBDMember(row) !==
          selectedMember.name
        ) {

          return false;
        }


        if (
          selectedFinancialYear &&
          getFinancialYear(row) !==
            selectedFinancialYear
        ) {

          return false;
        }


        if (
          selectedModalInfoStatus &&
          getInfoStatus(row) !==
            selectedModalInfoStatus
        ) {

          return false;
        }


        return true;

      });

    }, [
      rows,
      selectedMember,
      selectedFinancialYear,
      selectedModalInfoStatus
    ]);


  /* ============================================================
     PERFORMANCE SUMMARY
     ============================================================ */

  const performanceSummary =
    useMemo(() => {

      let billing = 0;

      let netAmount = 0;

      let bdExpenditure = 0;


      selectedMemberRows.forEach((row) => {

        const values =
          getFinancialValues(
            row,
            selectedModalInfoStatus
          );


        billing +=
          values.billing;


        netAmount +=
          values.netAmount;


        bdExpenditure +=
          values.bdExpenditure;

      });


      return {

        billing,

        netAmount,

        bdExpenditure

      };

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  /* ============================================================
     BEST INDUSTRY
     ============================================================ */

  const bestIndustry =
    useMemo(() => {

      const grouped = {};


      selectedMemberRows.forEach((row) => {

        const industry =
          getIndustry(row);


        if (!grouped[industry]) {

          grouped[industry] = {

            name:
              industry,

            billing: 0,

            netAmount: 0,

            bdExpenditure: 0

          };
        }


        const values =
          getFinancialValues(
            row,
            selectedModalInfoStatus
          );


        grouped[industry].billing +=
          values.billing;


        grouped[industry].netAmount +=
          values.netAmount;


        grouped[industry].bdExpenditure +=
          values.bdExpenditure;

      });


      const industries =
        Object.values(grouped);


      industries.sort(
        (a, b) =>
          b.billing - a.billing
      );


      return industries[0] || {

        name: "N/A",

        billing: 0,

        netAmount: 0,

        bdExpenditure: 0

      };

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  /* ============================================================
     BEST CITY
     ============================================================ */

  const bestCity =
    useMemo(() => {

      const grouped = {};


      selectedMemberRows.forEach((row) => {

        const city =
          getCity(row);


        if (!grouped[city]) {

          grouped[city] = {

            name:
              city,

            billing: 0,

            netAmount: 0,

            bdExpenditure: 0

          };
        }


        const values =
          getFinancialValues(
            row,
            selectedModalInfoStatus
          );


        grouped[city].billing +=
          values.billing;


        grouped[city].netAmount +=
          values.netAmount;


        grouped[city].bdExpenditure +=
          values.bdExpenditure;

      });


      const cities =
        Object.values(grouped);


      cities.sort(
        (a, b) =>
          b.billing - a.billing
      );


      return cities[0] || {

        name: "N/A",

        billing: 0,

        netAmount: 0,

        bdExpenditure: 0

      };

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  /* ============================================================
     YEARLY PERFORMANCE
     ============================================================ */

  const yearlyPerformance =
    useMemo(() => {

      const grouped = {};


      selectedMemberRows.forEach((row) => {

        const year =
          getFinancialYear(row);


        if (!grouped[year]) {

          grouped[year] = {

            year,

            billing: 0,

            netAmount: 0,

            bdExpenditure: 0

          };
        }


        const values =
          getFinancialValues(
            row,
            selectedModalInfoStatus
          );


        grouped[year].billing +=
          values.billing;


        grouped[year].netAmount +=
          values.netAmount;


        grouped[year].bdExpenditure +=
          values.bdExpenditure;

      });


      return Object.values(grouped)
        .sort(
          (a, b) =>
            a.year.localeCompare(
              b.year
            )
        );

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  /* ============================================================
     MONTHLY PERFORMANCE
     ============================================================ */

  const monthlyPerformance =
    useMemo(() => {

      const grouped = {};


      financialMonths.forEach(
        (month) => {

          grouped[month] = {

            month,

            billing: 0,

            netAmount: 0,

            bdExpenditure: 0

          };

        }
      );


      selectedMemberRows.forEach((row) => {

        const month =
          getFinancialMonth(row);


        if (
          !grouped[month]
        ) {
          return;
        }


        const values =
          getFinancialValues(
            row,
            selectedModalInfoStatus
          );


        grouped[month].billing +=
          values.billing;


        grouped[month].netAmount +=
          values.netAmount;


        grouped[month].bdExpenditure +=
          values.bdExpenditure;

      });


      return financialMonths.map(
        (month) =>
          grouped[month]
      );

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  /* ============================================================
     CHART
     ============================================================ */

  const maxChartValue =
    useMemo(() => {

      const values =
        monthlyPerformance.map(
          (item) =>
            toNumber(
              item.billing
            )
        );


      return Math.max(
        ...values,
        1
      );

    }, [
      monthlyPerformance
    ]);


  /* ============================================================
     OPEN PERFORMANCE
     ============================================================ */

  const openPerformance = (
    member
  ) => {

    setSelectedMember(member);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");
  };


  /* ============================================================
     CLOSE PERFORMANCE
     ============================================================ */

  const closePerformance = () => {

    setSelectedMember(null);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");
  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (

    <div className="bd-performance-page">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="bd-performance-header">

        <div>

          <h1>
            BD Member Performance
          </h1>

          <p>
            Analyse BD member billing,
            net amount and expenditure
            performance.
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN FILTERS
          ====================================================== */}

      <div className="bd-performance-filters">

        <div className="bd-filter-group">

          <label>
            Financial Year
          </label>

          <select
            value={
              selectedTableFinancialYear
            }
            onChange={(e) =>
              setSelectedTableFinancialYear(
                e.target.value
              )
            }
          >

            <option value="">
              All Financial Years
            </option>

            {financialYears.map(
              (year) => (

                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>

              )
            )}

          </select>

        </div>


        <div className="bd-filter-group">

          <label>
            Info Status
          </label>

          <select
            value={
              selectedInfoStatus
            }
            onChange={(e) =>
              setSelectedInfoStatus(
                e.target.value
              )
            }
          >

            <option value="">
              All
            </option>

            <option value="R">
              R
            </option>

            <option value="RV">
              RV
            </option>

            <option value="C">
              C
            </option>

            <option value="CN">
              CN
            </option>

          </select>

        </div>

      </div>


      {/* ======================================================
          MAIN TABLE
          ====================================================== */}

      <div className="bd-table-container">

        <div className="bd-table-header">

          <h2>
            BD Member Performance
          </h2>

          <span>
            {memberPerformance.length} BD Members
          </span>

        </div>


        <div className="table-responsive">

          <table className="bd-performance-table">

            <thead>

              <tr>

                <th>
                  BD MEMBER
                </th>

                <th>
                  TOTAL CLIENTS
                </th>

                <th>
                  TOTAL BILLING
                </th>

                <th>
                  NET AMOUNT
                </th>

                <th>
                  BD EXPENDITURE
                </th>

                <th>
                  ACTION
                </th>

              </tr>

            </thead>


            <tbody>

              {memberPerformance.length > 0 ? (

                memberPerformance.map(
                  (member) => (

                    <tr
                      key={
                        member.name
                      }
                    >

                      <td>
                        {member.name}
                      </td>

                      <td>
                        {member.clients}
                      </td>

                      <td>
                        {fullCurrency(
                          member.billing
                        )}
                      </td>

                      <td>
                        {fullCurrency(
                          member.netAmount
                        )}
                      </td>

                      <td>
                        {fullCurrency(
                          member.bdExpenditure
                        )}
                      </td>

                      <td>

                        <button
                          className="view-performance-btn"
                          onClick={() =>
                            openPerformance(
                              member
                            )
                          }
                        >
                          View Performance
                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="no-data"
                  >
                    No BD member data
                    available.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          PERFORMANCE MODAL
          ====================================================== */}

      {selectedMember && (

        <div
          className="performance-modal-overlay"
          onClick={closePerformance}
        >

          <div
            className="performance-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* ==================================================
                MODAL HEADER
                ================================================== */}

            <div className="performance-modal-header">

              <div>

                <h2>
                  {selectedMember.name}
                </h2>

                <p>
                  Detailed BD Member
                  Performance
                </p>

              </div>


              <button
                className="modal-close-btn"
                onClick={
                  closePerformance
                }
              >
                ×
              </button>

            </div>


            {/* ==================================================
                MODAL FILTERS
                ================================================== */}

            <div className="bd-modal-filters">

              <div className="bd-year-control">

                <label>
                  Financial Year
                </label>

                <select
                  value={
                    selectedFinancialYear
                  }
                  onChange={(e) =>
                    setSelectedFinancialYear(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All Financial Years
                  </option>

                  {financialYears.map(
                    (year) => (

                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="bd-year-control">

                <label>
                  Info Status
                </label>

                <select
                  value={
                    selectedModalInfoStatus
                  }
                  onChange={(e) =>
                    setSelectedModalInfoStatus(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All
                  </option>

                  <option value="R">
                    R
                  </option>

                  <option value="RV">
                    RV
                  </option>

                  <option value="C">
                    C
                  </option>

                  <option value="CN">
                    CN
                  </option>

                </select>

              </div>

            </div>


            {/* ==================================================
                SUMMARY CARDS
                ================================================== */}

            <div className="performance-summary-grid">

              <div className="performance-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {fullCurrency(
                    performanceSummary.billing
                  )}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Net Amount
                </span>

                <strong>
                  {fullCurrency(
                    performanceSummary.netAmount
                  )}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  BD Expenditure
                </span>

                <strong>
                  {fullCurrency(
                    performanceSummary.bdExpenditure
                  )}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {bestIndustry.name}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Best City
                </span>

                <strong>
                  {bestCity.name}
                </strong>

              </div>

            </div>


            {/* ==================================================
                YEARLY PERFORMANCE
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Yearly Performance
                </h3>

              </div>


              <div className="table-responsive">

                <table className="performance-report-table">

                  <thead>

                    <tr>

                      <th>
                        Financial Year
                      </th>

                      <th>
                        Total Billing
                      </th>

                      <th>
                        Net Amount
                      </th>

                      <th>
                        BD Expenditure
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {yearlyPerformance.length > 0 ? (

                      yearlyPerformance.map(
                        (item) => (

                          <tr
                            key={
                              item.year
                            }
                          >

                            <td>
                              {item.year}
                            </td>

                            <td>
                              {fullCurrency(
                                item.billing
                              )}
                            </td>

                            <td>
                              {fullCurrency(
                                item.netAmount
                              )}
                            </td>

                            <td>
                              {fullCurrency(
                                item.bdExpenditure
                              )}
                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan="4"
                          className="no-data"
                        >
                          No yearly data
                          available.
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                MONTHLY PERFORMANCE
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Monthly Performance
                </h3>

              </div>


              <div className="table-responsive">

                <table className="performance-report-table">

                  <thead>

                    <tr>

                      <th>
                        Month
                      </th>

                      <th>
                        Total Billing
                      </th>

                      <th>
                        Net Amount
                      </th>

                      <th>
                        BD Expenditure
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {monthlyPerformance.map(
                      (item) => (

                        <tr
                          key={
                            item.month
                          }
                        >

                          <td>
                            {item.month}
                          </td>

                          <td>
                            {fullCurrency(
                              item.billing
                            )}
                          </td>

                          <td>
                            {fullCurrency(
                              item.netAmount
                            )}
                          </td>

                          <td>
                            {fullCurrency(
                              item.bdExpenditure
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                PERFORMANCE CHART
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Monthly Billing Performance
                </h3>

              </div>


              <div className="performance-chart">

                {monthlyPerformance.map(
                  (item) => {

                    const percentage =
                      (
                        toNumber(
                          item.billing
                        ) /
                        maxChartValue
                      ) *
                      100;


                    return (

                      <div
                        className="chart-row"
                        key={
                          item.month
                        }
                      >

                        <div className="chart-label">

                          <span>
                            {item.month}
                          </span>

                          <strong>
                            {fullCurrency(
                              item.billing
                            )}
                          </strong>

                        </div>


                        <div className="chart-track">

                          <div
                            className="chart-bar"
                            style={{
                              width:
                                `${percentage}%`
                            }}
                          />

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            </div>


          </div>

        </div>

      )}

    </div>

  );
}


export default BDPerformance;
