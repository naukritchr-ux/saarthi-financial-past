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
  // Supports both backend and mapped frontend fields
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


  function getBilling(row) {

    return toNumber(
      row.total_bill_amount ??
      row["Total Bill Amount"]
    );

  }


  function getFranchiseeShare(row) {

    return toNumber(
      row.franchisee_share ??
      row["Franchisee Share"]
    );

  }


  function getNetAmount(row) {

    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );

  }


  function getAcquiredDate(row) {

    return (
      row.date_client_acquired ??
      row["Date Client Acquired"] ??
      ""
    );

  }


  // =====================================================
  // FINANCIAL YEAR
  // APRIL - MARCH
  // =====================================================

  function getFinancialYear(row) {

    const dateValue =
      getAcquiredDate(row);


    if (!dateValue) {

      return "";

    }


    const date =
      new Date(dateValue);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

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


    if (!dateValue) {

      return "";

    }


    const date =
      new Date(dateValue);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

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
  // BD MEMBER TABLE
  // =====================================================

  const memberData =
    useMemo(() => {

      const members = {};


      rows.forEach(row => {

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

            netAmount: 0

          };

        }


        members[member].clients += 1;


        members[member].billing +=
          getBilling(row);


        members[member].netAmount +=
          getNetAmount(row);

      });


      return Object.values(
        members
      ).sort(
        (a, b) =>
          b.clients -
          a.clients
      );

    }, [
      rows
    ]);


  // =====================================================
  // SELECTED BD MEMBER ROWS
  // =====================================================

  const selectedMemberRows =
    useMemo(() => {

      if (!selectedMember) {

        return [];

      }


      return rows.filter(
        row =>
          getBDMember(row) ===
          selectedMember.name
      );

    }, [
      rows,
      selectedMember
    ]);


  // =====================================================
  // PERFORMANCE SUMMARY
  // =====================================================

  const performanceSummary =
    useMemo(() => {

      let billing = 0;

      let netAmount = 0;


      selectedMemberRows.forEach(
        row => {

          billing +=
            getBilling(row);


          netAmount +=
            getNetAmount(row);

        }
      );


      return {

        clients:
          selectedMemberRows.length,

        billing,

        netAmount

      };

    }, [
      selectedMemberRows
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


          yearly[year].billing +=
            getBilling(row);

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
      selectedMemberRows
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


          monthly[month].billing +=
            getBilling(row);

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
      selectedFinancialYear
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

  }


  // =====================================================
  // CLOSE PERFORMANCE
  // =====================================================

  function closePerformance() {

    setSelectedMember(null);

    setSelectedFinancialYear("");

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
                    colSpan="5"
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
                  Total bill amount
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

            </div>


            {/* =================================================
                FINANCIAL YEAR FILTER
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