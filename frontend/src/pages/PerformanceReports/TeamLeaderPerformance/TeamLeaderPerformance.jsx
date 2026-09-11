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


// ============================================================
// FINANCIAL MONTHS
// ============================================================

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


// ============================================================
// MAIN COMPONENT
// ============================================================

function TeamLeaderPerformance() {
  const {
    rows = [],
    getFinancialYearFromRow,
  } = useData();

  // ==========================================================
  // STATES
  // ==========================================================

  // Filters for main performance table
  const [selectedTableFinancialYear, setSelectedTableFinancialYear] =
    useState("");

  const [selectedInfoStatus, setSelectedInfoStatus] = useState("");

  // Modal
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Existing modal financial year filter
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");

  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  const formatCurrency = (value) => {
    const number = Number(value) || 0;

    return number.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const fullCurrency = (value) => {
    return `₹${formatCurrency(value)}`;
  };


  // ==========================================================
  // SAFE NUMBER
  // ==========================================================

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    if (typeof value === "number") {
      return value;
    }

    const cleaned = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  };


  // ==========================================================
  // GET TEAM LEADER
  // ==========================================================

  function getTeamLeader(row) {
    return (
      row["Team Leader"] ??
      row["team_leader"] ??
      row["TeamLeader"] ??
      row["teamLeader"] ??
      "Unknown"
    );
  }


  // ==========================================================
  // GET INDUSTRY
  // ==========================================================

  function getIndustry(row) {
    return (
      row["Industry"] ??
      row["industry"] ??
      "Unknown"
    );
  }


  // ==========================================================
  // GET CITY
  // ==========================================================

  function getCity(row) {
    return (
      row["City"] ??
      row["city"] ??
      "Unknown"
    );
  }


  // ==========================================================
  // GET INFO STATUS
  // ==========================================================

  function getInfoStatus(row) {
    return String(
      row["Info"] ??
      row["info"] ??
      row["INFO"] ??
      row["Info Status"] ??
      row["info_status"] ??
      row["InfoStatus"] ??
      ""
    )
      .trim()
      .toUpperCase();
  }


  // ==========================================================
  // GET BILLING
  // ==========================================================

  function getBilling(row) {
    return toNumber(
      row["Total Bill Amount"] ??
      row["total_bill_amount"] ??
      row["Total Billing"] ??
      row["total_billing"] ??
      row["Billing"] ??
      row["billing"] ??
      0
    );
  }


  // ==========================================================
  // GET FRANCHISEE SHARE
  // ==========================================================

  function getFranchiseeShare(row) {
    return toNumber(
      row["Franchisee Share"] ??
      row["franchisee_share"] ??
      row["Franchise Cost"] ??
      row["franchise_cost"] ??
      0
    );
  }


  // ==========================================================
  // TL EXPENDITURE
  // 5% OF GROSS REVENUE
  // ==========================================================

  function getTLExpenditure(row) {
    return getBilling(row) * 0.05;
  }


  // ==========================================================
  // NET AMOUNT
  // TOTAL BILLING - FRANCHISEE SHARE
  // ==========================================================

  function getNetAmount(row) {
    return getBilling(row) - getFranchiseeShare(row);
  }


  // ==========================================================
  // GET ACQUIRED DATE
  // ==========================================================

  function getAcquiredDate(row) {
    return (
      row["Date Client Acquired"] ??
      row["date_client_acquired"] ??
      row["Date Client acquired"] ??
      row["dateClientAcquired"] ??
      row["Acquisition Date"] ??
      row["acquisition_date"] ??
      null
    );
  }


  // ==========================================================
  // GET FINANCIAL MONTH
  // APRIL - MARCH
  // ==========================================================

  function getFinancialMonth(row) {
    const dateValue = getAcquiredDate(row);

    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString("en-US", {
      month: "long",
    });
  }


  // ==========================================================
  // GET BEST VALUE
  // ==========================================================

  function getBestValue(data, key) {
    if (!data || data.length === 0) {
      return "N/A";
    }

    const grouped = {};

    data.forEach((item) => {
      const value = item[key] || "Unknown";

      grouped[value] = (grouped[value] || 0) + 1;
    });

    const sorted = Object.entries(grouped).sort(
      (a, b) => b[1] - a[1]
    );

    return sorted.length > 0 ? sorted[0][0] : "N/A";
  };


  // ============================================================
  // AVAILABLE FINANCIAL YEARS
  // ============================================================

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach((row) => {
      const fy = getFinancialYearFromRow?.(row);

      if (fy) {
        years.add(fy);
      }
    });

    return Array.from(years).sort().reverse();
  }, [rows, getFinancialYearFromRow]);


  // ============================================================
  // FILTERED TABLE ROWS
  //
  // Applies:
  // 1. Financial Year
  // 2. Info Status
  // ============================================================

  const filteredTableRows = useMemo(() => {
    return rows.filter((row) => {
      // ------------------------------------------
      // Financial Year
      // ------------------------------------------

      const rowFinancialYear =
        getFinancialYearFromRow?.(row) || "";

      const matchesFinancialYear =
        !selectedTableFinancialYear ||
        rowFinancialYear === selectedTableFinancialYear;


      // ------------------------------------------
      // Info Status
      // ------------------------------------------

      const infoStatus = getInfoStatus(row);

      const matchesInfoStatus =
        !selectedInfoStatus ||
        infoStatus === selectedInfoStatus;


      return (
        matchesFinancialYear &&
        matchesInfoStatus
      );
    });
  }, [
    rows,
    selectedTableFinancialYear,
    selectedInfoStatus,
    getFinancialYearFromRow,
  ]);


  // ============================================================
  // CALCULATION RULES
  // ============================================================

  /*
    NO INFO FILTER:
      Total Billing     = ALL rows
      Net Amount        = ONLY Info R
      TL Expenditure    = ONLY Info R

    R FILTER:
      Total Billing     = ONLY R
      Net Amount        = ONLY R
      TL Expenditure    = ONLY R

    RV / C / CN:
      Total Billing     = SELECTED STATUS
      Net Amount        = 0
      TL Expenditure    = 0
  */

  function applyFinancialRules(row, currentData) {
    const infoStatus = getInfoStatus(row);

    // ----------------------------------------------------------
    // NO INFO FILTER
    // ----------------------------------------------------------

    if (!selectedInfoStatus) {
      // Billing includes every record
      currentData.billing += getBilling(row);

      // Net + expenditure only for R
      if (infoStatus === "R") {
        currentData.netAmount += getNetAmount(row);
        currentData.tlExpenditure += getTLExpenditure(row);
      }

      return;
    }


    // ----------------------------------------------------------
    // R FILTER
    // ----------------------------------------------------------

    if (selectedInfoStatus === "R") {
      currentData.billing += getBilling(row);
      currentData.netAmount += getNetAmount(row);
      currentData.tlExpenditure += getTLExpenditure(row);

      return;
    }


    // ----------------------------------------------------------
    // RV / C / CN
    // ----------------------------------------------------------

    if (
      selectedInfoStatus === "RV" ||
      selectedInfoStatus === "C" ||
      selectedInfoStatus === "CN"
    ) {
      // Billing is calculated
      currentData.billing += getBilling(row);

      // Net and expenditure intentionally remain 0
      return;
    }
  }


  // ============================================================
  // TEAM LEADER DATA
  // ============================================================

  const leaderData = useMemo(() => {
    const grouped = {};

    filteredTableRows.forEach((row) => {
      const leader = String(
        getTeamLeader(row)
      ).trim() || "Unknown";


      // --------------------------------------------------------
      // CREATE TEAM LEADER
      // --------------------------------------------------------

      if (!grouped[leader]) {
        grouped[leader] = {
          name: leader,
          clients: 0,
          billing: 0,
          netAmount: 0,
          tlExpenditure: 0,
        };
      }


      // --------------------------------------------------------
      // CLIENT COUNT
      // --------------------------------------------------------

      grouped[leader].clients += 1;


      // --------------------------------------------------------
      // FINANCIAL CALCULATIONS
      // --------------------------------------------------------

      applyFinancialRules(
        row,
        grouped[leader]
      );
    });


    return Object.values(grouped).sort(
      (a, b) => b.billing - a.billing
    );
  }, [
    filteredTableRows,
    selectedInfoStatus,
  ]);


  // ============================================================
  // SELECTED LEADER ROWS
  // ============================================================

  const selectedLeaderRows = useMemo(() => {
    if (!selectedLeader) {
      return [];
    }

    return filteredTableRows.filter(
      (row) =>
        String(getTeamLeader(row)).trim() ===
        String(selectedLeader).trim()
    );
  }, [
    filteredTableRows,
    selectedLeader,
  ]);


  // ============================================================
  // SELECTED LEADER SUMMARY
  // ============================================================

  const selectedSummary = useMemo(() => {
    if (!selectedLeader) {
      return {
        clients: 0,
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0,
        bestIndustry: "N/A",
        bestCity: "N/A",
      };
    }


    const summary = {
      clients: selectedLeaderRows.length,
      billing: 0,
      netAmount: 0,
      tlExpenditure: 0,
    };


    // ----------------------------------------------------------
    // APPLY SAME FINANCIAL RULES AS MAIN TABLE
    // ----------------------------------------------------------

    selectedLeaderRows.forEach((row) => {
      applyFinancialRules(
        row,
        summary
      );
    });


    return {
      ...summary,
      bestIndustry: getBestValue(
        selectedLeaderRows,
        "Industry"
      ),
      bestCity: getBestValue(
        selectedLeaderRows,
        "City"
      ),
    };
  }, [
    selectedLeader,
    selectedLeaderRows,
    selectedInfoStatus,
  ]);


  // ============================================================
  // MODAL FINANCIAL YEAR ROWS
  // ============================================================

  const modalFinancialYearRows = useMemo(() => {
    if (!selectedFinancialYear) {
      return selectedLeaderRows;
    }

    return selectedLeaderRows.filter(
      (row) =>
        getFinancialYearFromRow?.(row) ===
        selectedFinancialYear
    );
  }, [
    selectedLeaderRows,
    selectedFinancialYear,
    getFinancialYearFromRow,
  ]);


  // ============================================================
  // YEARLY REPORT DATA
  // ============================================================

  const yearlyReportData = useMemo(() => {
    const grouped = {};

    modalFinancialYearRows.forEach((row) => {
      const year =
        getFinancialYearFromRow?.(row) ||
        "Unknown";


      if (!grouped[year]) {
        grouped[year] = {
          year,
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


    return Object.values(grouped).sort(
      (a, b) =>
        String(a.year).localeCompare(
          String(b.year)
        )
    );
  }, [
    modalFinancialYearRows,
    selectedInfoStatus,
  ]);


  // ============================================================
  // MONTHLY REPORT DATA
  // ============================================================

  const monthlyReportData = useMemo(() => {
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


    modalFinancialYearRows.forEach((row) => {
      const month = getFinancialMonth(row);

      if (!month) {
        return;
      }

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
    modalFinancialYearRows,
    selectedInfoStatus,
  ]);


  // ============================================================
  // OPEN MODAL
  // ============================================================

  const openLeaderReport = (leader) => {
    setSelectedLeader(leader);

    // Reset modal FY whenever a new leader is opened
    setSelectedFinancialYear("");
  };


  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    setSelectedLeader(null);
    setSelectedFinancialYear("");
  };


  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSelectedTableFinancialYear("");
    setSelectedInfoStatus("");
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="team-leader-performance">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="performance-header">

        <div>
          <h2>Team Leader Performance</h2>

          <p>
            Team Leader wise client acquisition and financial
            performance
          </p>
        </div>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="performance-filters">

        {/* ----------------------------------------------------
            FINANCIAL YEAR
        ---------------------------------------------------- */}

        <div className="filter-group">

          <label htmlFor="tl-financial-year">
            Financial Year
          </label>

          <select
            id="tl-financial-year"
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


        {/* ----------------------------------------------------
            INFO STATUS
        ---------------------------------------------------- */}

        <div className="filter-group">

          <label htmlFor="tl-info-status">
            Info Status
          </label>

          <select
            id="tl-info-status"
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


        {/* ----------------------------------------------------
            CLEAR FILTER
        ---------------------------------------------------- */}

        {(selectedTableFinancialYear ||
          selectedInfoStatus) && (

          <button
            type="button"
            className="clear-filter-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        )}

      </div>


      {/* ======================================================
          FILTER SUMMARY
      ====================================================== */}

      <div className="filter-summary">

        <span>
          Showing{" "}
          <strong>
            {filteredTableRows.length}
          </strong>{" "}
          records
        </span>


        {selectedTableFinancialYear && (
          <span>
            Financial Year:{" "}
            <strong>
              {selectedTableFinancialYear}
            </strong>
          </span>
        )}


        {selectedInfoStatus && (
          <span>
            Info:{" "}
            <strong>
              {selectedInfoStatus}
            </strong>
          </span>
        )}

      </div>


      {/* ======================================================
          PERFORMANCE TABLE
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
                  No data available for the
                  selected filters.
                </td>

              </tr>

            ) : (

              leaderData.map((leader) => (

                <tr
                  key={leader.name}
                >

                  {/* ----------------------------------------
                      TEAM LEADER
                  ----------------------------------------- */}

                  <td>

                    <button
                      type="button"
                      className="leader-name-btn"
                      onClick={() =>
                        openLeaderReport(
                          leader.name
                        )
                      }
                    >
                      {leader.name}
                    </button>

                  </td>


                  {/* ----------------------------------------
                      CLIENTS
                  ----------------------------------------- */}

                  <td>
                    {leader.clients}
                  </td>


                  {/* ----------------------------------------
                      BILLING
                  ----------------------------------------- */}

                  <td>
                    {fullCurrency(
                      leader.billing
                    )}
                  </td>


                  {/* ----------------------------------------
                      NET AMOUNT
                  ----------------------------------------- */}

                  <td>
                    {fullCurrency(
                      leader.netAmount
                    )}
                  </td>


                  {/* ----------------------------------------
                      TL EXPENDITURE
                  ----------------------------------------- */}

                  <td>
                    {fullCurrency(
                      leader.tlExpenditure
                    )}
                  </td>


                  {/* ----------------------------------------
                      PERFORMANCE
                  ----------------------------------------- */}

                  <td>

                    <button
                      type="button"
                      className="view-performance-btn"
                      onClick={() =>
                        openLeaderReport(
                          leader.name
                        )
                      }
                    >
                      View Report
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>


      {/* ======================================================
          TEAM LEADER MODAL
      ====================================================== */}

      {selectedLeader && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="team-leader-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="modal-header">

              <div>

                <h2>
                  {selectedLeader}
                </h2>

                <p>
                  Team Leader Performance Report
                </p>

              </div>


              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            {/* ==================================================
                MODAL FINANCIAL YEAR FILTER
            ================================================== */}

            <div className="modal-filter">

              <label htmlFor="modal-financial-year">
                Financial Year
              </label>

              <select
                id="modal-financial-year"
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


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="summary-cards">

              {/* ----------------------------------------------
                  CLIENTS
              ----------------------------------------------- */}

              <div className="summary-card">

                <span className="summary-card-label">
                  Total Clients
                </span>

                <strong>
                  {selectedSummary.clients}
                </strong>

              </div>


              {/* ----------------------------------------------
                  BILLING
              ----------------------------------------------- */}

              <div className="summary-card">

                <span className="summary-card-label">
                  Total Billing
                </span>

                <strong>
                  {fullCurrency(
                    selectedSummary.billing
                  )}
                </strong>

              </div>


              {/* ----------------------------------------------
                  NET
              ----------------------------------------------- */}

              <div className="summary-card">

                <span className="summary-card-label">
                  Net Amount
                </span>

                <strong>
                  {fullCurrency(
                    selectedSummary.netAmount
                  )}
                </strong>

              </div>


              {/* ----------------------------------------------
                  TL EXPENDITURE
              ----------------------------------------------- */}

              <div className="summary-card">

                <span className="summary-card-label">
                  TL Expenditure
                </span>

                <strong>
                  {fullCurrency(
                    selectedSummary.tlExpenditure
                  )}
                </strong>

              </div>


              {/* ----------------------------------------------
                  BEST INDUSTRY
              ----------------------------------------------- */}

              <div className="summary-card">

                <span className="summary-card-label">
                  Best Industry
                </span>

                <strong>
                  {selectedSummary.bestIndustry}
                </strong>

              </div>


              {/* ----------------------------------------------
                  BEST CITY
              ----------------------------------------------- */}

              <div className="summary-card">

                <span className="summary-card-label">
                  Best City
                </span>

                <strong>
                  {selectedSummary.bestCity}
                </strong>

              </div>

            </div>


            {/* ==================================================
                YEARLY REPORT
            ================================================== */}

            <div className="report-section">

              <h3>
                Yearly Performance
              </h3>

              <div
                className="chart-container"
                style={{
                  width: "100%",
                  height: 350,
                }}
              >

                <ResponsiveContainer>

                  <BarChart
                    data={yearlyReportData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="year"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        fullCurrency(value)
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="billing"
                      name="Total Billing"
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


            {/* ==================================================
                MONTHLY REPORT
            ================================================== */}

            <div className="report-section">

              <h3>
                Monthly Performance
              </h3>

              <div
                className="chart-container"
                style={{
                  width: "100%",
                  height: 350,
                }}
              >

                <ResponsiveContainer>

                  <BarChart
                    data={monthlyReportData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                      angle={-35}
                      textAnchor="end"
                      height={80}
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        fullCurrency(value)
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="billing"
                      name="Total Billing"
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


            {/* ==================================================
                CLIENT DETAILS TABLE
            ================================================== */}

            <div className="report-section">

              <h3>
                Client Details
              </h3>

              <div className="client-table-container">

                <table className="client-details-table">

                  <thead>

                    <tr>

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

                    {modalFinancialYearRows.length === 0 ? (

                      <tr>

                        <td
                          colSpan="7"
                          className="no-data"
                        >
                          No client data available.
                        </td>

                      </tr>

                    ) : (

                      modalFinancialYearRows.map(
                        (row, index) => {

                          const infoStatus =
                            getInfoStatus(row);

                          let netAmount = 0;
                          let tlExpenditure = 0;


                          // ------------------------------------------------
                          // NET + EXPENDITURE RULES
                          // ------------------------------------------------

                          if (
                            !selectedInfoStatus &&
                            infoStatus === "R"
                          ) {
                            netAmount =
                              getNetAmount(row);

                            tlExpenditure =
                              getTLExpenditure(row);
                          }


                          if (
                            selectedInfoStatus === "R"
                          ) {
                            netAmount =
                              getNetAmount(row);

                            tlExpenditure =
                              getTLExpenditure(row);
                          }


                          return (

                            <tr
                              key={
                                row.id ??
                                row.ID ??
                                index
                              }
                            >

                              <td>
                                {getIndustry(row)}
                              </td>

                              <td>
                                {getCity(row)}
                              </td>

                              <td>
                                {infoStatus || "-"}
                              </td>

                              <td>
                                {
                                  getFinancialYearFromRow?.(
                                    row
                                  ) || "-"
                                }
                              </td>

                              <td>
                                {fullCurrency(
                                  getBilling(row)
                                )}
                              </td>

                              <td>
                                {fullCurrency(
                                  netAmount
                                )}
                              </td>

                              <td>
                                {fullCurrency(
                                  tlExpenditure
                                )}
                              </td>

                            </tr>

                          );
                        }
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                MODAL FOOTER
            ================================================== */}

            <div className="modal-footer">

              <button
                type="button"
                className="modal-close-footer-btn"
                onClick={closeModal}
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

export default TeamLeaderPerformance;
