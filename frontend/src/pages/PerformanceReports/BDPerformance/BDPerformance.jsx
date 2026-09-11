import React, {
  useMemo,
  useState
} from "react";

import {
  useData
} from "../../../context/DataContext";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import "./BDPerformance.css";


function BDPerformance() {

  const {
    rows = []
  } = useData();


  // =====================================================
  // STATE
  // =====================================================

  const [
    selectedMember,
    setSelectedMember
  ] = useState(null);


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  // Main table filters
  const [
    selectedTableFinancialYear,
    setSelectedTableFinancialYear
  ] = useState("");


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");


  // Modal Info filter
  const [
    selectedModalInfoStatus,
    setSelectedModalInfoStatus
  ] = useState("");


  // =====================================================
  // HELPERS
  // =====================================================

  function toNumber(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }


    const cleaned =
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim();


    const number =
      Number(cleaned);


    return Number.isFinite(number)
      ? number
      : 0;

  }


  function fullCurrency(value) {

    return `₹${toNumber(value).toLocaleString(
      "en-IN"
    )}`;

  }


  function formatCurrency(value) {

    const number =
      toNumber(value);


    if (number >= 10000000) {

      return `₹${(
        number / 10000000
      ).toFixed(1)} Cr`;

    }


    if (number >= 100000) {

      return `₹${(
        number / 100000
      ).toFixed(1)} L`;

    }


    if (number >= 1000) {

      return `₹${(
        number / 1000
      ).toFixed(1)} K`;

    }


    return fullCurrency(number);

  }


  // =====================================================
  // FIELD HELPERS
  // =====================================================

  function getBDMember(row) {

    return String(
      row.bd_member ??
      row["BD Member"] ??
      ""
    ).trim();

  }


  function getIndustry(row) {

    return String(
      row.industry ??
      row["Industry"] ??
      ""
    ).trim();

  }


  function getCity(row) {

    return String(
      row.city ??
      row["City"] ??
      ""
    ).trim();

  }


  // =====================================================
  // INFO STATUS
  // =====================================================

  function getInfoStatus(row) {

    return String(
      row.Info ??
      row["Info"] ??
      ""
    )
      .trim()
      .toUpperCase();

  }


  // =====================================================
  // BILLING
  // =====================================================

  function getBilling(row) {

    return toNumber(
      row.total_bill_amount ??
      row["Total Bill Amount"]
    );

  }


  // =====================================================
  // FRANCHISEE SHARE
  // =====================================================

  function getFranchiseeShare(row) {

    return toNumber(
      row.franchisee_share ??
      row["Franchisee Share"]
    );

  }


  // =====================================================
  // BD EXPENDITURE
  // =====================================================

  function getBDExpenditure(row) {

    // BD Expenditure = 5% of Gross Revenue

    return getBilling(row) * 0.05;

  }


  // =====================================================
  // NET AMOUNT
  // =====================================================

  function getNetAmount(row) {

    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );

  }


  // =====================================================
  // ACQUIRED DATE
  // =====================================================

  function getAcquiredDate(row) {

    return (
      row.date_client_acquired ??
      row["Date Client Acquired"] ??
      ""
    );

  }


  // =====================================================
  // DATE PARSER
  // =====================================================

  function parseDate(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }


    if (
      value instanceof Date
    ) {

      return Number.isNaN(
        value.getTime()
      )
        ? null
        : value;

    }


    // Excel serial date
    if (
      typeof value === "number"
    ) {

      const excelDate =
        new Date(
          Math.round(
            (value - 25569) *
            86400 *
            1000
          )
        );


      return Number.isNaN(
        excelDate.getTime()
      )
        ? null
        : excelDate;

    }


    const stringValue =
      String(value).trim();


    // DD/MM/YYYY
    // DD-MM-YYYY

    const parts =
      stringValue.match(
        /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
      );


    if (parts) {

      const day =
        Number(parts[1]);

      const month =
        Number(parts[2]) - 1;

      const year =
        Number(parts[3]);


      const date =
        new Date(
          year,
          month,
          day
        );


      return Number.isNaN(
        date.getTime()
      )
        ? null
        : date;

    }


    const parsed =
      new Date(
        stringValue
      );


    return Number.isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;

  }


  // =====================================================
  // FINANCIAL YEAR
  // APRIL - MARCH
  // =====================================================

  function getFinancialYear(row) {

    const dateValue =
      getAcquiredDate(row);


    const date =
      parseDate(dateValue);


    if (!date) {

      return "";

    }


    const year =
      date.getFullYear();


    const month =
      date.getMonth() + 1;


    if (month >= 4) {

      return `${year}-${year + 1}`;

    }


    return `${year - 1}-${year}`;

  }


  // =====================================================
  // FINANCIAL MONTH
  // =====================================================

  const financialMonths = [

    {
      full: "April",
      short: "Apr"
    },

    {
      full: "May",
      short: "May"
    },

    {
      full: "June",
      short: "Jun"
    },

    {
      full: "July",
      short: "Jul"
    },

    {
      full: "August",
      short: "Aug"
    },

    {
      full: "September",
      short: "Sep"
    },

    {
      full: "October",
      short: "Oct"
    },

    {
      full: "November",
      short: "Nov"
    },

    {
      full: "December",
      short: "Dec"
    },

    {
      full: "January",
      short: "Jan"
    },

    {
      full: "February",
      short: "Feb"
    },

    {
      full: "March",
      short: "Mar"
    }

  ];


  function getFinancialMonth(row) {

    const dateValue =
      getAcquiredDate(row);


    const date =
      parseDate(dateValue);


    if (!date) {

      return "";

    }


    return date.toLocaleString(
      "en-IN",
      {
        month: "long"
      }
    );

  }


  // =====================================================
  // FINANCIAL YEARS
  // =====================================================

  const financialYears =
    useMemo(() => {

      const years =
        new Set();


      rows.forEach(row => {

        const year =
          getFinancialYear(row);


        if (year) {

          years.add(year);

        }

      });


      return Array.from(
        years
      ).sort(
        (a, b) =>
          Number(
            b.split("-")[0]
          ) -
          Number(
            a.split("-")[0]
          )
      );

    }, [
      rows
    ]);


  // =====================================================
  // FINANCIAL CALCULATION RULES
  // =====================================================

  function getFinancialValues(
    row,
    infoFilter = ""
  ) {

    const info =
      getInfoStatus(row);


    const billing =
      getBilling(row);


    /*
      NO INFO FILTER

      Only Info = R is considered
      for Billing, Net Amount and
      BD Expenditure.
    */

    if (
      !infoFilter ||
      infoFilter === "ALL"
    ) {

      if (info !== "R") {

        return {
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        };

      }


      return {

        billing,

        netAmount:
          getNetAmount(row),

        bdExpenditure:
          getBDExpenditure(row)

      };

    }


    /*
      INFO = R

      Billing:
      R only

      Net:
      Billing - Franchisee Share

      Expenditure:
      5% Billing
    */

    if (
      infoFilter === "R"
    ) {

      if (info !== "R") {

        return {
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        };

      }


      return {

        billing,

        netAmount:
          getNetAmount(row),

        bdExpenditure:
          getBDExpenditure(row)

      };

    }


    /*
      INFO = RV / C / CN

      Billing:
      Selected Info only

      Net:
      0

      Expenditure:
      0
    */

    if (
      info === infoFilter
    ) {

      return {

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

  }


  // =====================================================
  // MAIN FILTERED ROWS
  // =====================================================

  const filteredRows =
    useMemo(() => {

      return rows.filter(row => {

        const year =
          getFinancialYear(row);


        const info =
          getInfoStatus(row);


        // Financial Year

        if (
          selectedTableFinancialYear &&
          year !== selectedTableFinancialYear
        ) {

          return false;

        }


        // Info Status

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


  // =====================================================
  // BD MEMBER TABLE
  // =====================================================

  const memberData =
    useMemo(() => {

      const members = {};


      filteredRows.forEach(row => {

        const member =
          getBDMember(row);


        if (!member) {

          return;

        }


        if (!members[member]) {

          members[member] = {

            name: member,

            clients: 0,

            billing: 0,

            netAmount: 0,

            bdExpenditure: 0

          };

        }


        // Client count

        members[member].clients += 1;


        // Financial calculations

        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        members[member].billing +=
          financialValues.billing;


        members[member].netAmount +=
          financialValues.netAmount;


        members[member].bdExpenditure +=
          financialValues.bdExpenditure;

      });


      return Object.values(
        members
      ).sort(
        (a, b) =>
          b.clients -
          a.clients
      );

    }, [
      filteredRows,
      selectedInfoStatus
    ]);


  // =====================================================
  // SELECTED BD MEMBER ROWS
  //
  // IMPORTANT:
  // Financial Year is applied here.
  // Therefore ALL MODAL CARDS change
  // when Financial Year changes.
  // =====================================================

  const selectedMemberRows =
    useMemo(() => {

      if (!selectedMember) {

        return [];

      }


      return rows.filter(row => {

        // Selected BD Member

        if (
          getBDMember(row) !==
          selectedMember.name
        ) {

          return false;

        }


        // Selected Financial Year

        if (
          selectedFinancialYear &&
          getFinancialYear(row) !==
          selectedFinancialYear
        ) {

          return false;

        }


        // Selected Info Status

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


  // =====================================================
  // PERFORMANCE SUMMARY
  // =====================================================

  const performanceSummary =
    useMemo(() => {

      let billing = 0;

      let netAmount = 0;

      let bdExpenditure = 0;


      selectedMemberRows.forEach(
        row => {

          const financialValues =
            getFinancialValues(
              row,
              selectedModalInfoStatus
            );


          billing +=
            financialValues.billing;


          netAmount +=
            financialValues.netAmount;


          bdExpenditure +=
            financialValues.bdExpenditure;

        }
      );


      return {

        clients:
          selectedMemberRows.length,

        billing,

        netAmount,

        bdExpenditure

      };

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  // =====================================================
  // BEST INDUSTRY
  // =====================================================

  const bestIndustry =
    useMemo(() => {

      const industries = {};


      selectedMemberRows.forEach(
        row => {

          const industry =
            getIndustry(row);


          if (!industry) {

            return;

          }


          if (!industries[industry]) {

            industries[industry] = 0;

          }


          industries[industry] += 1;

        }
      );


      const sorted =
        Object.entries(
          industries
        ).sort(
          (a, b) =>
            b[1] - a[1]
        );


      if (!sorted.length) {

        return {
          name: "—",
          clients: 0
        };

      }


      return {

        name: sorted[0][0],

        clients: sorted[0][1]

      };

    }, [
      selectedMemberRows
    ]);


  // =====================================================
  // BEST CITY
  // =====================================================

  const bestCity =
    useMemo(() => {

      const cities = {};


      selectedMemberRows.forEach(
        row => {

          const city =
            getCity(row);


          if (!city) {

            return;

          }


          if (!cities[city]) {

            cities[city] = 0;

          }


          cities[city] += 1;

        }
      );


      const sorted =
        Object.entries(
          cities
        ).sort(
          (a, b) =>
            b[1] - a[1]
        );


      if (!sorted.length) {

        return {
          name: "—",
          clients: 0
        };

      }


      return {

        name: sorted[0][0],

        clients: sorted[0][1]

      };

    }, [
      selectedMemberRows
    ]);


  // =====================================================
  // YEARLY REPORT
  // =====================================================

  const yearlyReportData =
    useMemo(() => {

      const yearly = {};


      selectedMemberRows.forEach(
        row => {

          const year =
            getFinancialYear(row);


          if (!year) {

            return;

          }


          if (!yearly[year]) {

            yearly[year] = {

              year,

              clients: 0,

              billing: 0

            };

          }


          yearly[year].clients += 1;


          const financialValues =
            getFinancialValues(
              row,
              selectedModalInfoStatus
            );


          yearly[year].billing +=
            financialValues.billing;

        }
      );


      return Object.values(
        yearly
      ).sort(
        (a, b) =>
          Number(
            a.year.split("-")[0]
          ) -
          Number(
            b.year.split("-")[0]
          )
      );

    }, [
      selectedMemberRows,
      selectedModalInfoStatus
    ]);


  // =====================================================
  // MONTHLY REPORT
  // =====================================================

  const monthlyReportData =
    useMemo(() => {

      if (!selectedFinancialYear) {

        return [];

      }


      const monthly = {};


      financialMonths.forEach(
        month => {

          monthly[month.full] = {

            month:
              month.full,

            monthShort:
              month.short,

            clients: 0,

            billing: 0

          };

        }
      );


      selectedMemberRows.forEach(
        row => {

          const year =
            getFinancialYear(row);


          if (
            year !==
            selectedFinancialYear
          ) {

            return;

          }


          const month =
            getFinancialMonth(row);


          if (
            !monthly[month]
          ) {

            return;

          }


          monthly[month].clients += 1;


          const financialValues =
            getFinancialValues(
              row,
              selectedModalInfoStatus
            );


          monthly[month].billing +=
            financialValues.billing;

        }
      );


      return financialMonths.map(
        month =>
          monthly[
            month.full
          ]
      );

    }, [
      selectedMemberRows,
      selectedFinancialYear,
      selectedModalInfoStatus
    ]);


  // =====================================================
  // ACTIVE GRAPH DATA
  // =====================================================

  const graphData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  // =====================================================
  // GRAPH LABEL
  // =====================================================

  const graphPeriodLabel =
    selectedFinancialYear
      ? `Monthly Report • FY ${selectedFinancialYear}`
      : "Yearly Report";


  // =====================================================
  // CLIENT TOOLTIP
  // =====================================================

  function renderClientTooltip({
    active,
    payload,
    label
  }) {

    if (
      !active ||
      !payload ||
      !payload.length
    ) {

      return null;

    }


    return (

      <div className="bd-modern-tooltip">

        <strong>
          {label}
        </strong>

        <span>
          Clients Acquired
        </span>

        <b>
          {payload[0].value}
        </b>

      </div>

    );

  }


  // =====================================================
  // BILLING TOOLTIP
  // =====================================================

  function renderBillingTooltip({
    active,
    payload,
    label
  }) {

    if (
      !active ||
      !payload ||
      !payload.length
    ) {

      return null;

    }


    return (

      <div className="bd-modern-tooltip">

        <strong>
          {label}
        </strong>

        <span>
          Total Billing
        </span>

        <b>
          {fullCurrency(
            payload[0].value
          )}
        </b>

      </div>

    );

  }


  // =====================================================
  // OPEN PERFORMANCE
  // =====================================================

  function openPerformance(member) {

    setSelectedMember(member);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");

  }


  // =====================================================
  // CLOSE PERFORMANCE
  // =====================================================

  function closePerformance() {

    setSelectedMember(null);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="bd-performance">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="bd-page-header">

        <div>

          <span className="bd-page-eyebrow">
            BUSINESS DEVELOPMENT
          </span>

          <h1>
            BD Member Performance
          </h1>

          <p>
            Performance overview of all
            Business Development Members
          </p>

        </div>


        <div className="bd-member-count">

          <strong>
            {memberData.length}
          </strong>

          <span>
            BD Members
          </span>

        </div>

      </div>


      {/* =================================================
          MAIN TABLE
      ================================================= */}

      <div className="bd-table-card">


        <div className="bd-table-header">

          <div>

            <span>
              PERFORMANCE SUMMARY
            </span>

            <h2>
              BD Member Overview
            </h2>

          </div>


          {/* =================================================
              FILTERS
          ================================================= */}

          <div
            className="bd-performance-filters"
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "16px",
              marginTop: "18px",
              flexWrap: "wrap"
            }}
          >

            {/* FINANCIAL YEAR */}

            <div
              className="bd-filter-group"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >

              <label>
                FINANCIAL YEAR
              </label>

              <select
                value={
                  selectedTableFinancialYear
                }
                onChange={event =>
                  setSelectedTableFinancialYear(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Financial Years
                </option>


                {financialYears.map(
                  year => (

                    <option
                      key={year}
                      value={year}
                    >

                      FY {year}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* INFO STATUS */}

            <div
              className="bd-filter-group"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >

              <label>
                INFO STATUS
              </label>

              <select
                value={
                  selectedInfoStatus
                }
                onChange={event =>
                  setSelectedInfoStatus(
                    event.target.value
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

        </div>


        <div className="bd-table-wrapper">

          <table className="bd-member-table">

            <thead>

              <tr>

                <th>
                  BD Member Name
                </th>

                <th>
                  Total Acquired Client
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

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {memberData.length > 0 ? (

                memberData.map(
                  member => (

                    <tr
                      key={
                        member.name
                      }
                    >


                      {/* MEMBER */}

                      <td>

                        <div className="bd-member-name">

                          <div className="bd-member-avatar">

                            {member.name
                              .charAt(0)
                              .toUpperCase()
                            }

                          </div>

                          <strong>
                            {member.name}
                          </strong>

                        </div>

                      </td>


                      {/* CLIENTS */}

                      <td>

                        <span className="bd-client-count">

                          {member.clients}

                        </span>

                      </td>


                      {/* BILLING */}

                      <td>

                        <strong className="bd-billing-value">

                          {formatCurrency(
                            member.billing
                          )}

                        </strong>

                      </td>


                      {/* NET AMOUNT */}

                      <td>

                        <strong className={
                          member.netAmount >= 0
                            ? "bd-net-positive"
                            : "bd-net-negative"
                        }>

                          {formatCurrency(
                            member.netAmount
                          )}

                        </strong>

                      </td>


                      {/* BD EXPENDITURE */}

                      <td>

                        <strong className="bd-expenditure-value">

                          {formatCurrency(
                            member.bdExpenditure
                          )}

                        </strong>

                      </td>


                      {/* PERFORMANCE */}

                      <td>

                        <button
                          type="button"
                          className="bd-view-button"
                          onClick={() =>
                            openPerformance(
                              member
                            )
                          }
                        >

                          <span>
                            View
                          </span>

                          <span className="bd-view-arrow">
                            →
                          </span>

                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="bd-empty-table"
                  >

                    No BD Member data
                    available.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =================================================
          PERFORMANCE MODAL
      ================================================= */}

      {selectedMember && (

        <div
          className="bd-performance-overlay"
          onClick={closePerformance}
        >


          <div
            className="bd-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="bd-modal-header">

              <div>

                <span>
                  PERFORMANCE REPORT
                </span>

                <h2>
                  {selectedMember.name}
                </h2>

                <p>
                  Detailed Business Development
                  performance report
                </p>

              </div>


              <button
                type="button"
                className="bd-modal-close"
                onClick={closePerformance}
                aria-label="Close"
              >

                ×

              </button>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="bd-summary-grid">


              {/* BEST INDUSTRY */}

              <div className="bd-summary-card">

                <span>
                  BEST INDUSTRY
                </span>

                <strong>
                  {bestIndustry.name}
                </strong>

                <small>
                  {bestIndustry.clients}
                  {" "}
                  client
                  {bestIndustry.clients !== 1
                    ? "s"
                    : ""
                  }
                </small>

              </div>


              {/* BEST CITY */}

              <div className="bd-summary-card">

                <span>
                  BEST CITY
                </span>

                <strong>
                  {bestCity.name}
                </strong>

                <small>
                  {bestCity.clients}
                  {" "}
                  client
                  {bestCity.clients !== 1
                    ? "s"
                    : ""
                  }
                </small>

              </div>


              {/* BILLING */}

              <div className="bd-summary-card">

                <span>
                  TOTAL BILLING
                </span>

                <strong className="billing-summary">

                  {formatCurrency(
                    performanceSummary.billing
                  )}

                </strong>

                <small>
                  Gross Revenue
                </small>

              </div>


              {/* NET AMOUNT */}

              <div className="bd-summary-card">

                <span>
                  NET AMOUNT
                </span>

                <strong className={
                  performanceSummary.netAmount >= 0
                    ? "net-summary-positive"
                    : "net-summary-negative"
                }>

                  {formatCurrency(
                    performanceSummary.netAmount
                  )}

                </strong>

                <small>
                  Billing − Franchisee Share
                </small>

              </div>


              {/* BD EXPENDITURE */}

              <div className="bd-summary-card">

                <span>
                  BD EXPENDITURE
                </span>

                <strong className="bd-expenditure-summary">

                  {formatCurrency(
                    performanceSummary.bdExpenditure
                  )}

                </strong>

                <small>
                  5% of Gross Revenue
                </small>

              </div>


            </div>


            {/* =================================================
                FINANCIAL YEAR + INFO FILTER
            ================================================= */}

            <div className="bd-report-controls">


              <div className="bd-year-control">

                <label>
                  FINANCIAL YEAR
                </label>

                <select
                  value={
                    selectedFinancialYear
                  }
                  onChange={event =>
                    setSelectedFinancialYear(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    None
                  </option>


                  {financialYears.map(
                    year => (

                      <option
                        key={year}
                        value={year}
                      >

                        FY {year}

                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="bd-year-control">

                <label>
                  INFO STATUS
                </label>

                <select
                  value={
                    selectedModalInfoStatus
                  }
                  onChange={event =>
                    setSelectedModalInfoStatus(
                      event.target.value
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


              <div className="bd-report-period">

                <span>
                  REPORT PERIOD
                </span>

                <strong>
                  {graphPeriodLabel}
                </strong>

              </div>

            </div>


            {/* =================================================
                GRAPHS
            ================================================= */}

            <div className="bd-report-graphs">


              {/* =================================================
                  CLIENT ACQUIRED GRAPH
              ================================================= */}

              <div className="bd-report-chart-card">

                <div className="bd-chart-heading">

                  <div>

                    <span>
                      CLIENT ACQUISITION
                    </span>

                    <h3>

                      {selectedFinancialYear
                        ? "Monthly Client Acquired"
                        : "Yearly Client Acquired"
                      }

                    </h3>

                  </div>


                  <div className="bd-chart-dot client-dot" />

                </div>


                <ResponsiveContainer
                  width="100%"
                  height={330}
                >

                  <BarChart
                    data={graphData}
                    margin={{
                      top: 15,
                      right: 10,
                      left: 0,
                      bottom: 5
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey={
                        selectedFinancialYear
                          ? "monthShort"
                          : "year"
                      }
                      tick={{
                        fontSize: 11,
                        fill: "#687180"
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 11,
                        fill: "#687180"
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={
                        renderClientTooltip
                      }
                      cursor={{
                        fill:
                          "rgba(183,138,52,.06)"
                      }}
                    />

                    <Bar
                      dataKey="clients"
                      name="Clients Acquired"
                      fill="#B78A34"
                      radius={[
                        5,
                        5,
                        0,
                        0
                      ]}
                      maxBarSize={45}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>


              {/* =================================================
                  BILLING GRAPH
              ================================================= */}

              <div className="bd-report-chart-card">

                <div className="bd-chart-heading">

                  <div>

                    <span>
                      FINANCIAL PERFORMANCE
                    </span>

                    <h3>

                      {selectedFinancialYear
                        ? "Monthly Total Billing"
                        : "Yearly Total Billing"
                      }

                    </h3>

                  </div>


                  <div className="bd-chart-dot billing-dot" />

                </div>


                <ResponsiveContainer
                  width="100%"
                  height={330}
                >

                  <BarChart
                    data={graphData}
                    margin={{
                      top: 15,
                      right: 10,
                      left: 0,
                      bottom: 5
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey={
                        selectedFinancialYear
                          ? "monthShort"
                          : "year"
                      }
                      tick={{
                        fontSize: 11,
                        fill: "#687180"
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "#687180"
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={
                        value =>
                          formatCurrency(value)
                      }
                    />

                    <Tooltip
                      content={
                        renderBillingTooltip
                      }
                      cursor={{
                        fill:
                          "rgba(38,115,77,.06)"
                      }}
                    />

                    <Bar
                      dataKey="billing"
                      name="Total Billing"
                      fill="#26734D"
                      radius={[
                        5,
                        5,
                        0,
                        0
                      ]}
                      maxBarSize={45}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="bd-modal-footer">

              <span>

                {selectedFinancialYear
                  ? `Showing monthly performance for FY ${selectedFinancialYear}`
                  : "Showing yearly performance across all financial years"
                }

              </span>


              <button
                type="button"
                onClick={closePerformance}
              >

                Close

              </button>

            </div>


          </div>

        </div>

      )}

    </div>

  );

}


export default BDPerformance;
