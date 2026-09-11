import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./TeamLeaderPerformance.css";


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
  "March",
];


/* ============================================================
   COMPONENT
   ============================================================ */

function TeamLeaderPerformance() {

  const {
    rows = [],
    getFinancialYearFromRow,
  } = useData();


  /* ==========================================================
     STATE
     ========================================================== */

  const [selectedTableFinancialYear, setSelectedTableFinancialYear] =
    useState("");

  const [selectedInfoStatus, setSelectedInfoStatus] =
    useState("");

  const [selectedLeader, setSelectedLeader] =
    useState(null);

  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState("");


  /* ==========================================================
     HELPERS
     ========================================================== */

  const toNumber = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const cleaned = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    const number = Number(cleaned);

    return Number.isFinite(number)
      ? number
      : 0;
  };


  const formatCurrency = (value) => {

    return `₹${toNumber(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };


  const getTeamLeader = (row) => {

    return (
      row?.["Team Leader"] ??
      row?.["team_leader"] ??
      row?.["TeamLeader"] ??
      row?.["teamLeader"] ??
      "Unknown"
    );
  };


  const getIndustry = (row) => {

    return (
      row?.["Industry"] ??
      row?.["industry"] ??
      "Unknown"
    );
  };


  const getCity = (row) => {

    return (
      row?.["City"] ??
      row?.["city"] ??
      "Unknown"
    );
  };


  /* ============================================================
     INFO STATUS
     ============================================================ */

  const getInfoStatus = (row) => {

    const value =
      row?.["Info"] ??
      row?.["info"] ??
      row?.["INFO"] ??
      row?.["Info Status"] ??
      row?.["info_status"] ??
      row?.["InfoStatus"] ??
      "";

    return String(value)
      .trim()
      .toUpperCase();
  };


  /* ============================================================
     BILLING
     ============================================================ */

  const getBilling = (row) => {

    return toNumber(
      row?.["Total Bill Amount"] ??
      row?.["total_bill_amount"] ??
      row?.["Total Billing"] ??
      row?.["total_billing"] ??
      row?.["Billing"] ??
      row?.["billing"] ??
      0
    );
  };


  /* ============================================================
     FRANCHISEE SHARE
     ============================================================ */

  const getFranchiseeShare = (row) => {

    return toNumber(
      row?.["Franchisee Share"] ??
      row?.["franchisee_share"] ??
      row?.["Franchise Cost"] ??
      row?.["franchise_cost"] ??
      0
    );
  };


  /* ============================================================
     NET AMOUNT
     ============================================================ */

  const getNetAmount = (row) => {

    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );
  };


  /* ============================================================
     TL EXPENDITURE
     ============================================================ */

  const getTLExpenditure = (row) => {

    return getBilling(row) * 0.05;
  };


  /* ============================================================
     ACQUIRED DATE
     ============================================================ */

  const getAcquiredDate = (row) => {

    return (
      row?.["Date Client Acquired"] ??
      row?.["date_client_acquired"] ??
      row?.["DateClientAcquired"] ??
      row?.["Client Acquired Date"] ??
      row?.["Acquisition Date"] ??
      row?.["acquisition_date"] ??
      row?.["Date Acquired"] ??
      row?.["date_acquired"] ??
      ""
    );
  };


  /* ============================================================
     FINANCIAL MONTH
     ============================================================ */

  const getFinancialMonth = (row) => {

    const rawDate = getAcquiredDate(row);

    if (!rawDate) {
      return "";
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      month: "long",
    });
  };


  /* ============================================================
     BEST VALUE
     ============================================================ */

  const getBestValue = (data, type) => {

    const counts = {};

    data.forEach((row) => {

      const value =
        type === "industry"
          ? getIndustry(row)
          : getCity(row);

      const cleanValue =
        String(value || "Unknown").trim();

      if (!cleanValue) {
        return;
      }

      counts[cleanValue] =
        (counts[cleanValue] || 0) + 1;
    });


    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);


    return sorted.length
      ? sorted[0][0]
      : "N/A";
  };


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const year =
        getFinancialYearFromRow?.(row);

      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort();

  }, [
    rows,
    getFinancialYearFromRow,
  ]);


  /* ============================================================
     FILTER ROWS
     ============================================================ */

  const filteredTableRows = useMemo(() => {

    return rows.filter((row) => {

      const rowFinancialYear =
        getFinancialYearFromRow?.(row) || "";

      const infoStatus =
        getInfoStatus(row);


      const financialYearMatch =
        !selectedTableFinancialYear ||
        rowFinancialYear === selectedTableFinancialYear;


      const infoStatusMatch =
        !selectedInfoStatus ||
        infoStatus === selectedInfoStatus;


      return (
        financialYearMatch &&
        infoStatusMatch
      );
    });

  }, [
    rows,
    selectedTableFinancialYear,
    selectedInfoStatus,
    getFinancialYearFromRow,
  ]);


  /* ============================================================
     FINANCIAL RULES
     ============================================================ */

  const applyFinancialRules = (row, target) => {

    const info =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    /* ----------------------------------------------------------
       NO INFO FILTER
       Only R contributes financially
       ---------------------------------------------------------- */

    if (!selectedInfoStatus) {

      if (info === "R") {

        target.billing += billing;

        target.netAmount +=
          getNetAmount(row);

        target.tlExpenditure +=
          getTLExpenditure(row);
      }

      return;
    }


    /* ----------------------------------------------------------
       R
       ---------------------------------------------------------- */

    if (selectedInfoStatus === "R") {

      if (info === "R") {

        target.billing += billing;

        target.netAmount +=
          getNetAmount(row);

        target.tlExpenditure +=
          getTLExpenditure(row);
      }

      return;
    }


    /* ----------------------------------------------------------
       RV / C / CN
       ---------------------------------------------------------- */

    if (
      selectedInfoStatus === "RV" ||
      selectedInfoStatus === "C" ||
      selectedInfoStatus === "CN"
    ) {

      if (
        info === selectedInfoStatus
      ) {

        target.billing += billing;

        target.netAmount += 0;

        target.tlExpenditure += 0;
      }
    }
  };


  /* ============================================================
     TEAM LEADER DATA
     ============================================================ */

  const leaderData = useMemo(() => {

    const grouped = {};


    filteredTableRows.forEach((row) => {

      const leader =
        String(
          getTeamLeader(row)
        ).trim() || "Unknown";


      if (!grouped[leader]) {

        grouped[leader] = {

          leader,

          clients: 0,

          billing: 0,

          netAmount: 0,

          tlExpenditure: 0,
        };
      }


      grouped[leader].clients += 1;


      applyFinancialRules(
        row,
        grouped[leader]
      );
    });


    return Object.values(grouped);

  }, [
    filteredTableRows,
    selectedInfoStatus,
  ]);


  /* ============================================================
     TABLE TOTALS
     ============================================================ */

  const tableTotals = useMemo(() => {

    return leaderData.reduce(
      (total, item) => {

        total.clients +=
          item.clients;

        total.billing +=
          item.billing;

        total.netAmount +=
          item.netAmount;

        total.tlExpenditure +=
          item.tlExpenditure;

        return total;

      },
      {
        clients: 0,
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0,
      }
    );

  }, [leaderData]);


  /* ============================================================
     SELECTED LEADER ROWS
     ============================================================ */

  const selectedLeaderRows = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }

    return filteredTableRows.filter(
      (row) =>
        String(
          getTeamLeader(row)
        ).trim() === selectedLeader
    );

  }, [
    filteredTableRows,
    selectedLeader,
  ]);


  /* ============================================================
     MODAL FILTERED ROWS
     ============================================================ */

  const modalFilteredRows = useMemo(() => {

    if (!selectedFinancialYear) {

      return selectedLeaderRows;
    }


    return selectedLeaderRows.filter(
      (row) => {

        const year =
          getFinancialYearFromRow?.(row) || "";

        return (
          year === selectedFinancialYear
        );
      }
    );

  }, [
    selectedLeaderRows,
    selectedFinancialYear,
    getFinancialYearFromRow,
  ]);


  /* ============================================================
     MODAL SUMMARY
     ============================================================ */

  const modalSummary = useMemo(() => {

    const summary = {

      clients:
        modalFilteredRows.length,

      billing: 0,

      netAmount: 0,

      tlExpenditure: 0,
    };


    modalFilteredRows.forEach((row) => {

      applyFinancialRules(
        row,
        summary
      );
    });


    return summary;

  }, [
    modalFilteredRows,
    selectedInfoStatus,
  ]);


  /* ============================================================
     YEARLY REPORT
     ============================================================ */

  const yearlyReport = useMemo(() => {

    const grouped = {};


    modalFilteredRows.forEach((row) => {

      const year =
        getFinancialYearFromRow?.(row) ||
        "Unknown";


      if (!grouped[year]) {

        grouped[year] = {

          financialYear: year,

          clients: 0,

          billing: 0,

          netAmount: 0,

          tlExpenditure: 0,
        };
      }


      grouped[year].clients += 1;


      applyFinancialRules(
        row,
        grouped[year]
      );
    });


    return Object.values(grouped);

  }, [
    modalFilteredRows,
    selectedInfoStatus,
    getFinancialYearFromRow,
  ]);


  /* ============================================================
     MONTHLY REPORT
     ============================================================ */

  const monthlyReport = useMemo(() => {

    const grouped = {};


    financialMonths.forEach((month) => {

      grouped[month] = {

        month,

        clients: 0,

        billing: 0,

        netAmount: 0,

        tlExpenditure: 0,
      };
    });


    modalFilteredRows.forEach((row) => {

      const month =
        getFinancialMonth(row);


      if (!grouped[month]) {
        return;
      }


      grouped[month].clients += 1;


      applyFinancialRules(
        row,
        grouped[month]
      );
    });


    return financialMonths.map(
      (month) => grouped[month]
    );

  }, [
    modalFilteredRows,
    selectedInfoStatus,
  ]);


  /* ============================================================
     OPEN LEADER
     ============================================================ */

  const openLeader = (leader) => {

    setSelectedLeader(leader);

    setSelectedFinancialYear(
      selectedTableFinancialYear
    );
  };


  /* ============================================================
     CLOSE LEADER
     ============================================================ */

  const closeLeader = () => {

    setSelectedLeader(null);

    setSelectedFinancialYear("");
  };


  /* ============================================================
     CLEAR FILTERS
     ============================================================ */

  const clearFilters = () => {

    setSelectedTableFinancialYear("");

    setSelectedInfoStatus("");
  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (

    <div className="team-leader-performance">


      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="performance-header">

        <div>

          <h2>
            Team Leader Performance
          </h2>

          <p>
            Financial performance by Team Leader
          </p>

        </div>

      </div>


      {/* ======================================================
          FILTER AREA
          IMPORTANT: DIRECTLY ABOVE TABLE
          ====================================================== */}

      <div className="team-leader-filter-wrapper">

        <div className="team-leader-filter-header">

          <h3>
            Filters
          </h3>

          <button
            type="button"
            onClick={clearFilters}
            className="team-leader-clear-btn"
          >
            Clear Filters
          </button>

        </div>


        <div className="team-leader-filters">


          {/* FINANCIAL YEAR */}

          <div className="team-leader-filter-item">

            <label htmlFor="teamLeaderFinancialYear">
              Financial Year
            </label>

            <select
              id="teamLeaderFinancialYear"
              value={selectedTableFinancialYear}
              onChange={(e) =>
                setSelectedTableFinancialYear(
                  e.target.value
                )
              }
            >

              <option value="">
                All Financial Years
              </option>

              {financialYears.map((year) => (

                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>

              ))}

            </select>

          </div>


          {/* INFO STATUS */}

          <div className="team-leader-filter-item">

            <label htmlFor="teamLeaderInfoStatus">
              Info Status
            </label>

            <select
              id="teamLeaderInfoStatus"
              value={selectedInfoStatus}
              onChange={(e) =>
                setSelectedInfoStatus(
                  e.target.value
                )
              }
            >

              <option value="">
                All Info Status
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


        {/* ACTIVE FILTER INFORMATION */}

        <div className="team-leader-filter-result">

          <span>
            Records:{" "}
            <strong>
              {filteredTableRows.length}
            </strong>
          </span>


          <span>
            Financial Year:{" "}
            <strong>
              {selectedTableFinancialYear || "All"}
            </strong>
          </span>


          <span>
            Info Status:{" "}
            <strong>
              {selectedInfoStatus || "All"}
            </strong>
          </span>

        </div>

      </div>


      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="performance-table-container">

        <table className="performance-table">

          <thead>

            <tr>

              <th>
                Team Leader Name
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
                TL Expenditure
              </th>

              <th>
                Performance
              </th>

            </tr>

          </thead>


          <tbody>

            {leaderData.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="no-data"
                >
                  No data found for the selected filters.
                </td>

              </tr>

            ) : (

              leaderData.map((leader) => (

                <tr
                  key={leader.leader}
                  className="clickable-row"
                  onClick={() =>
                    openLeader(
                      leader.leader
                    )
                  }
                >

                  <td>
                    <strong>
                      {leader.leader}
                    </strong>
                  </td>

                  <td>
                    {leader.clients}
                  </td>

                  <td>
                    {formatCurrency(
                      leader.billing
                    )}
                  </td>

                  <td>
                    {formatCurrency(
                      leader.netAmount
                    )}
                  </td>

                  <td>
                    {formatCurrency(
                      leader.tlExpenditure
                    )}
                  </td>

                  <td>

                    <button
                      type="button"
                      className="view-performance-btn"
                      onClick={(e) => {

                        e.stopPropagation();

                        openLeader(
                          leader.leader
                        );

                      }}
                    >
                      View Details
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>


          {leaderData.length > 0 && (

            <tfoot>

              <tr>

                <td>
                  <strong>
                    Total
                  </strong>
                </td>

                <td>
                  <strong>
                    {tableTotals.clients}
                  </strong>
                </td>

                <td>
                  <strong>
                    {formatCurrency(
                      tableTotals.billing
                    )}
                  </strong>
                </td>

                <td>
                  <strong>
                    {formatCurrency(
                      tableTotals.netAmount
                    )}
                  </strong>
                </td>

                <td>
                  <strong>
                    {formatCurrency(
                      tableTotals.tlExpenditure
                    )}
                  </strong>
                </td>

                <td>
                  -
                </td>

              </tr>

            </tfoot>

          )}

        </table>

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {selectedLeader && (

        <div
          className="leader-modal-overlay"
          onClick={closeLeader}
        >

          <div
            className="leader-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="leader-modal-header">

              <div>

                <h2>
                  {selectedLeader}
                </h2>

                <p>
                  Team Leader Performance Details
                </p>

              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeLeader}
              >
                ×
              </button>

            </div>


            {/* MODAL FINANCIAL YEAR */}

            <div className="modal-filter">

              <label>
                Financial Year
              </label>

              <select
                value={selectedFinancialYear}
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


            {/* SUMMARY */}

            <div className="leader-summary-grid">

              <div className="leader-summary-card">

                <span>
                  Total Clients
                </span>

                <strong>
                  {modalSummary.clients}
                </strong>

              </div>


              <div className="leader-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    modalSummary.billing
                  )}
                </strong>

              </div>


              <div className="leader-summary-card">

                <span>
                  Net Amount
                </span>

                <strong>
                  {formatCurrency(
                    modalSummary.netAmount
                  )}
                </strong>

              </div>


              <div className="leader-summary-card">

                <span>
                  TL Expenditure
                </span>

                <strong>
                  {formatCurrency(
                    modalSummary.tlExpenditure
                  )}
                </strong>

              </div>


              <div className="leader-summary-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {getBestValue(
                    modalFilteredRows,
                    "industry"
                  )}
                </strong>

              </div>


              <div className="leader-summary-card">

                <span>
                  Best City
                </span>

                <strong>
                  {getBestValue(
                    modalFilteredRows,
                    "city"
                  )}
                </strong>

              </div>

            </div>


            {/* YEARLY CHART */}

            <div className="report-section">

              <h3>
                Yearly Performance
              </h3>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={yearlyReport}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="financialYear"
                    />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="billing"
                      name="Billing"
                    />

                    <Bar
                      dataKey="netAmount"
                      name="Net Amount"
                    />

                    <Bar
                      dataKey="tlExpenditure"
                      name="TL Expenditure"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* MONTHLY CHART */}

            <div className="report-section">

              <h3>
                Monthly Performance
              </h3>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={monthlyReport}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="billing"
                      name="Billing"
                    />

                    <Bar
                      dataKey="netAmount"
                      name="Net Amount"
                    />

                    <Bar
                      dataKey="tlExpenditure"
                      name="TL Expenditure"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* CLIENT DETAILS */}

            <div className="report-section">

              <h3>
                Client Details
              </h3>


              <div className="client-details-table-container">

                <table className="client-details-table">

                  <thead>

                    <tr>

                      <th>#</th>

                      <th>
                        Industry
                      </th>

                      <th>
                        City
                      </th>

                      <th>
                        Info
                      </th>

                      <th>
                        Financial Year
                      </th>

                      <th>
                        Billing
                      </th>

                      <th>
                        Net Amount
                      </th>

                      <th>
                        TL Expenditure
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {modalFilteredRows.map(
                      (row, index) => {

                        const info =
                          getInfoStatus(row);

                        const billing =
                          getBilling(row);


                        let displayBilling = 0;

                        let displayNetAmount = 0;

                        let displayTLExpenditure = 0;


                        if (
                          !selectedInfoStatus
                        ) {

                          if (info === "R") {

                            displayBilling =
                              billing;

                            displayNetAmount =
                              getNetAmount(row);

                            displayTLExpenditure =
                              getTLExpenditure(row);
                          }

                        } else if (
                          selectedInfoStatus === "R"
                        ) {

                          if (info === "R") {

                            displayBilling =
                              billing;

                            displayNetAmount =
                              getNetAmount(row);

                            displayTLExpenditure =
                              getTLExpenditure(row);
                          }

                        } else {

                          if (
                            info ===
                            selectedInfoStatus
                          ) {

                            displayBilling =
                              billing;
                          }
                        }


                        return (

                          <tr key={index}>

                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {getIndustry(row)}
                            </td>

                            <td>
                              {getCity(row)}
                            </td>

                            <td>

                              <span className="info-status">
                                {info || "-"}
                              </span>

                            </td>

                            <td>
                              {getFinancialYearFromRow?.(
                                row
                              ) || "-"}
                            </td>

                            <td>
                              {formatCurrency(
                                displayBilling
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                displayNetAmount
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                displayTLExpenditure
                              )}
                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default TeamLeaderPerformance;
