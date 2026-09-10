import {
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

import "./TeamLeaderPerformance.css";


function TeamLeaderPerformance() {

  const {
    rows,
    getFinancialYearFromRow
  } = useData();


  const [selectedLeader, setSelectedLeader] =
    useState(null);


  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState("");


  /* =====================================================
     FORMAT CURRENCY
     ===================================================== */

  function formatCurrency(value) {

    const number =
      Number(value || 0);


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


    return `₹${number.toLocaleString("en-IN")}`;

  }


  /* =====================================================
     FULL CURRENCY
     ===================================================== */

  function fullCurrency(value) {

    return `₹${Number(value || 0)
      .toLocaleString("en-IN")}`;

  }


  /* =====================================================
     GET TEAM LEADER
     ===================================================== */

  function getTeamLeader(row) {

    return (
      row["Team Leader"] ??
      row.team_leader ??
      ""
    );

  }


  /* =====================================================
     GET INDUSTRY
     ===================================================== */

  function getIndustry(row) {

    return (
      row["Industry"] ??
      row.industry ??
      ""
    );

  }


  /* =====================================================
     GET CITY
     ===================================================== */

  function getCity(row) {

    return (
      row["City"] ??
      row.city ??
      ""
    );

  }


  /* =====================================================
     GET BILLING
     ===================================================== */

  function getBilling(row) {

    return Number(

      row["Total Bill Amount"] ??
      row.total_bill_amount ??
      0

    );

  }


  /* =====================================================
     GET FRANCHISE SHARE
     ===================================================== */

  function getFranchiseeShare(row) {

    return Number(

      row["Franchisee Share"] ??
      row.franchisee_share ??
      0

    );

  }


  /* =====================================================
     GET NET AMOUNT
     
     Net Amount =
     Total Billing - Franchisee Share
     ===================================================== */

  function getNetAmount(row) {

    return (

      getBilling(row) -
      getFranchiseeShare(row)

    );

  }


  /* =====================================================
     GET ACQUIRED DATE
     ===================================================== */

  function getAcquiredDate(row) {

    return (

      row["Date Client Acquired"] ??
      row.date_client_acquired ??
      null

    );

  }


  /* =====================================================
     GET FINANCIAL MONTH
     April → March
     ===================================================== */

  function getFinancialMonth(row) {

    const value =
      getAcquiredDate(row);


    if (!value) {

      return "";

    }


    const date =
      new Date(value);


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


  /* =====================================================
     FINANCIAL MONTH ORDER
     ===================================================== */

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


  /* =====================================================
     FINANCIAL YEAR LIST
     ===================================================== */

  const financialYears = useMemo(() => {

    const years =
      new Set();


    rows.forEach(row => {

      const year =
        getFinancialYearFromRow(row);


      if (year) {

        years.add(year);

      }

    });


    return Array.from(years)

      .sort(
        (a, b) => {

          const yearA =
            Number(
              String(a).split("-")[0]
            );

          const yearB =
            Number(
              String(b).split("-")[0]
            );

          return yearB - yearA;

        }
      );


  }, [
    rows,
    getFinancialYearFromRow
  ]);


  /* =====================================================
     TEAM LEADER DATA
     ===================================================== */

  const leaderData = useMemo(() => {

    const teamLeaders = {};


    rows.forEach(row => {

      const leader =
        String(
          getTeamLeader(row)
        ).trim();


      if (!leader) {

        return;

      }


      if (!teamLeaders[leader]) {

        teamLeaders[leader] = {

          name: leader,

          clients: 0,

          billing: 0,

          netAmount: 0,

          industries: {},

          cities: {}

        };

      }


      const data =
        teamLeaders[leader];


      /* Client */

      data.clients++;


      /* Billing */

      data.billing +=
        getBilling(row);


      /* Net Amount */

      data.netAmount +=
        getNetAmount(row);


      /* Industry */

      const industry =
        String(
          getIndustry(row)
        ).trim();


      if (industry) {

        data.industries[industry] =
          (data.industries[industry] || 0) + 1;

      }


      /* City */

      const city =
        String(
          getCity(row)
        ).trim();


      if (city) {

        data.cities[city] =
          (data.cities[city] || 0) + 1;

      }

    });


    return Object.values(teamLeaders)

      .map(leader => ({

        ...leader,

        bestIndustry:
          getBestValue(
            leader.industries
          ),

        bestCity:
          getBestValue(
            leader.cities
          )

      }))

      .sort(
        (a, b) =>
          b.clients -
          a.clients
      );


  }, [rows]);


  /* =====================================================
     BEST VALUE
     ===================================================== */

  function getBestValue(values) {

    const entries =
      Object.entries(values);


    if (!entries.length) {

      return "—";

    }


    entries.sort(
      ([, countA], [, countB]) =>
        countB - countA
    );


    return entries[0][0];

  }


  /* =====================================================
     SELECTED LEADER ROWS
     ===================================================== */

  const selectedLeaderRows = useMemo(() => {

    if (!selectedLeader) {

      return [];

    }


    return rows.filter(row => {

      return (

        String(
          getTeamLeader(row)
        ).trim()

        ===

        String(
          selectedLeader.name
        ).trim()

      );

    });


  }, [
    rows,
    selectedLeader
  ]);


  /* =====================================================
     SELECTED LEADER SUMMARY
     ===================================================== */

  const selectedSummary = useMemo(() => {

    if (!selectedLeader) {

      return {

        clients: 0,

        billing: 0,

        netAmount: 0,

        bestIndustry: "—",

        bestCity: "—"

      };

    }


    let clients = 0;

    let billing = 0;

    let netAmount = 0;

    const industries = {};

    const cities = {};


    selectedLeaderRows.forEach(row => {

      clients++;

      billing +=
        getBilling(row);

      netAmount +=
        getNetAmount(row);


      const industry =
        String(
          getIndustry(row)
        ).trim();


      if (industry) {

        industries[industry] =
          (industries[industry] || 0) + 1;

      }


      const city =
        String(
          getCity(row)
        ).trim();


      if (city) {

        cities[city] =
          (cities[city] || 0) + 1;

      }

    });


    return {

      clients,

      billing,

      netAmount,

      bestIndustry:
        getBestValue(industries),

      bestCity:
        getBestValue(cities)

    };


  }, [
    selectedLeader,
    selectedLeaderRows
  ]);


  /* =====================================================
     YEARLY GRAPH DATA
     
     No FY selected:
     Show yearly report.
     ===================================================== */

  const yearlyReportData = useMemo(() => {

    const yearly = {};


    selectedLeaderRows.forEach(row => {

      const year =
        getFinancialYearFromRow(row);


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


      yearly[year].clients++;

      yearly[year].billing +=
        getBilling(row);

    });


    return Object.values(yearly)

      .sort(
        (a, b) => {

          const yearA =
            Number(
              String(a.year).split("-")[0]
            );

          const yearB =
            Number(
              String(b.year).split("-")[0]
            );

          return yearA - yearB;

        }
      );


  }, [
    selectedLeaderRows,
    getFinancialYearFromRow
  ]);


  /* =====================================================
     MONTHLY GRAPH DATA
     
     FY selected:
     Show April → March.
     ===================================================== */

  const monthlyReportData = useMemo(() => {

    const monthly = {};


    financialMonths.forEach(month => {

      monthly[month] = {

        month,

        clients: 0,

        billing: 0

      };

    });


    selectedLeaderRows.forEach(row => {

      const year =
        getFinancialYearFromRow(row);


      if (
        year !==
        selectedFinancialYear
      ) {

        return;

      }


      const month =
        getFinancialMonth(row);


      if (!month) {

        return;

      }


      monthly[month].clients++;

      monthly[month].billing +=
        getBilling(row);

    });


    return financialMonths.map(
      month =>
        monthly[month]
    );


  }, [
    selectedLeaderRows,
    selectedFinancialYear
  ]);


  /* =====================================================
     GRAPH DATA
     ===================================================== */

  const reportGraphData =

    selectedFinancialYear

      ?

    monthlyReportData

      :

    yearlyReportData;


  /* =====================================================
     GRAPH LABEL
     ===================================================== */

  const graphPeriodLabel =

    selectedFinancialYear

      ?

    `Monthly Report - ${selectedFinancialYear}`

      :

    "Yearly Report";


  /* =====================================================
     TOOLTIP
     ===================================================== */

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

      <div className="team-modern-tooltip">

        <strong>
          {label}
        </strong>

        <span>
          {payload[0].value} Clients
        </span>

      </div>

    );

  }


  /* =====================================================
     BILLING TOOLTIP
     ===================================================== */

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

      <div className="team-modern-tooltip">

        <strong>
          {label}
        </strong>

        <span>
          {fullCurrency(
            payload[0].value
          )}
        </span>

      </div>

    );

  }


  /* =====================================================
     OPEN PERFORMANCE
     ===================================================== */

  function openPerformance(leader) {

    setSelectedLeader(
      leader
    );

    setSelectedFinancialYear(
      ""
    );

  }


  /* =====================================================
     CLOSE PERFORMANCE
     ===================================================== */

  function closePerformance() {

    setSelectedLeader(
      null
    );

    setSelectedFinancialYear(
      ""
    );

  }


  /* =====================================================
     RENDER
     ===================================================== */

  return (

    <div className="team-performance-page">


      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="team-page-header">

        <div>

          <span className="team-page-eyebrow">
            REPORTS
          </span>

          <h1>
            Team Leader Performance
          </h1>

          <p>
            Team leader acquisition and financial performance
          </p>

        </div>

      </div>


      {/* =================================================
          TABLE
          ================================================= */}

      <div className="team-table-card">

        <div className="team-table-header">

          <div>

            <span className="team-table-label">
              PERFORMANCE OVERVIEW
            </span>

            <h2>
              Team Leaders
            </h2>

          </div>


          <div className="team-leader-count">

            {leaderData.length}

            <span>
              Team Leaders
            </span>

          </div>

        </div>


        <div className="team-table-wrapper">

          <table className="team-leader-table">

            <thead>

              <tr>

                <th>
                  Team Leader Name
                </th>

                <th>
                  Total Acquired Client
                </th>

                <th>
                  Industry
                </th>

                <th>
                  City
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

              {leaderData.length > 0 ? (

                leaderData.map(
                  leader => (

                    <tr
                      key={leader.name}
                    >

                      <td>

                        <div className="leader-name">

                          <span className="leader-avatar">

                            {leader.name
                              .charAt(0)
                              .toUpperCase()}

                          </span>

                          <span>
                            {leader.name}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="client-count">

                          {leader.clients}

                        </span>

                      </td>


                      <td>

                        <span className="best-value">

                          {leader.bestIndustry}

                        </span>

                      </td>


                      <td>

                        <span className="best-value">

                          {leader.bestCity}

                        </span>

                      </td>


                      <td>

                        <strong className="billing-value">

                          {formatCurrency(
                            leader.billing
                          )}

                        </strong>

                      </td>


                      <td>

                        <strong className="net-value">

                          {formatCurrency(
                            leader.netAmount
                          )}

                        </strong>

                      </td>


                      <td>

                        <button

                          type="button"

                          className="view-performance-btn"

                          onClick={() =>
                            openPerformance(
                              leader
                            )
                          }

                        >

                          <MdArrow />

                          View

                        </button>

                      </td>

                    </tr>

                  )

                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="no-team-data"
                  >

                    No Team Leader data available.

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

      {selectedLeader && (

        <div
          className="team-performance-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closePerformance();

            }

          }}
        >

          <div className="team-performance-modal">


            {/* =================================================
                MODAL HEADER
                ================================================= */}

            <div className="performance-modal-header">

              <div>

                <span className="modal-eyebrow">
                  TEAM LEADER PERFORMANCE
                </span>

                <h2>
                  {selectedLeader.name}
                </h2>

                <p>
                  Detailed acquisition and financial report
                </p>

              </div>


              <button

                type="button"

                className="modal-close-btn"

                onClick={
                  closePerformance
                }

                aria-label="Close"

              >

                ×

              </button>

            </div>


            {/* =================================================
                SUMMARY CARDS
                ================================================= */}

            <div className="performance-summary-grid">


              <div className="performance-summary-card">

                <span>
                  Total Acquired Client
                </span>

                <strong>
                  {selectedSummary.clients}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {selectedSummary.bestIndustry}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Best City
                </span>

                <strong>
                  {selectedSummary.bestCity}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    selectedSummary.billing
                  )}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Net Amount
                </span>

                <strong>
                  {formatCurrency(
                    selectedSummary.netAmount
                  )}
                </strong>

              </div>


            </div>


            {/* =================================================
                FINANCIAL YEAR FILTER
                ================================================= */}

            <div className="performance-report-controls">

              <div>

                <label>
                  Financial Year
                </label>

                <select

                  value={
                    selectedFinancialYear
                  }

                  onChange={(event) =>
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
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="report-period">

                <span>
                  REPORT TYPE
                </span>

                <strong>
                  {graphPeriodLabel}
                </strong>

              </div>

            </div>


            {/* =================================================
                GRAPHS
                ================================================= */}

            <div className="performance-graphs">


              {/* =================================================
                  CLIENT ACQUIRED
                  ================================================= */}

              <div className="performance-chart-card">

                <div className="chart-heading">

                  <div>

                    <span>
                      ACQUISITION
                    </span>

                    <h3>
                      Client Acquired
                    </h3>

                  </div>

                  <div className="chart-indicator client-indicator">
                  </div>

                </div>


                <ResponsiveContainer
                  width="100%"
                  height={310}
                >

                  <BarChart
                    data={
                      reportGraphData
                    }

                    margin={{
                      top: 20,
                      right: 15,
                      left: 0,
                      bottom: 10
                    }}

                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E7E1D3"
                    />

                    <XAxis
                      dataKey={
                        selectedFinancialYear
                          ? "month"
                          : "year"
                      }
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#5B6472",
                        fontSize: 12
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#5B6472",
                        fontSize: 12
                      }}
                    />

                    <Tooltip
                      content={
                        renderClientTooltip
                      }
                      cursor={{
                        fill:
                          "rgba(183,138,52,0.08)"
                      }}
                    />

                    <Bar
                      dataKey="clients"
                      fill="#B78A34"
                      radius={[
                        7,
                        7,
                        0,
                        0
                      ]}
                      barSize={
                        selectedFinancialYear
                          ? 24
                          : 45
                      }
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>


              {/* =================================================
                  TOTAL BILLING
                  ================================================= */}

              <div className="performance-chart-card">

                <div className="chart-heading">

                  <div>

                    <span>
                      FINANCIAL PERFORMANCE
                    </span>

                    <h3>
                      Total Billing
                    </h3>

                  </div>

                  <div className="chart-indicator billing-indicator">
                  </div>

                </div>


                <ResponsiveContainer
                  width="100%"
                  height={310}
                >

                  <BarChart
                    data={
                      reportGraphData
                    }

                    margin={{
                      top: 20,
                      right: 15,
                      left: 0,
                      bottom: 10
                    }}

                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E7E1D3"
                    />

                    <XAxis
                      dataKey={
                        selectedFinancialYear
                          ? "month"
                          : "year"
                      }
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#5B6472",
                        fontSize: 12
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#5B6472",
                        fontSize: 12
                      }}
                      tickFormatter={
                        value =>
                          formatCurrency(
                            value
                          )
                      }
                    />

                    <Tooltip
                      content={
                        renderBillingTooltip
                      }
                      cursor={{
                        fill:
                          "rgba(38,115,77,0.08)"
                      }}
                    />

                    <Bar
                      dataKey="billing"
                      fill="#26734D"
                      radius={[
                        7,
                        7,
                        0,
                        0
                      ]}
                      barSize={
                        selectedFinancialYear
                          ? 24
                          : 45
                      }
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>


            </div>


            {/* =================================================
                MODAL FOOTER
                ================================================= */}

            <div className="performance-modal-footer">

              <span>
                {selectedFinancialYear
                  ? `Showing monthly performance for ${selectedFinancialYear}`
                  : "Showing yearly performance across all financial years"
                }
              </span>


              <button

                type="button"

                className="modal-footer-close"

                onClick={
                  closePerformance
                }

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


/* =========================================================
   SIMPLE VIEW ICON
   ========================================================= */

function MdArrow() {

  return (

    <span className="view-arrow">
      →
    </span>

  );

}


export default TeamLeaderPerformance;