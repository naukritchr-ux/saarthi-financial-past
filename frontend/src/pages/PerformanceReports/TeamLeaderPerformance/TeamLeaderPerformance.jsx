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
// COMPONENT
// ============================================================

function TeamLeaderPerformance() {
  const {
    rows = [],
    getFinancialYearFromRow,
  } = useData();


  // ==========================================================
  // FILTER STATES
  // ==========================================================

  const [selectedTableFinancialYear, setSelectedTableFinancialYear] =
    useState("");

  const [selectedInfoStatus, setSelectedInfoStatus] =
    useState("");


  // ==========================================================
  // MODAL STATES
  // ==========================================================

  const [selectedLeader, setSelectedLeader] =
    useState(null);

  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState("");


  // ==========================================================
  // CURRENCY FORMAT
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
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
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

    return Number.isFinite(number)
      ? number
      : 0;
  };


  // ==========================================================
  // GET TEAM LEADER
  // ==========================================================

  const getTeamLeader = (row) => {
    return (
      row["Team Leader"] ??
      row["team_leader"] ??
      row["TeamLeader"] ??
      row["teamLeader"] ??
      "Unknown"
    );
  };


  // ==========================================================
  // GET INDUSTRY
  // ==========================================================

  const getIndustry = (row) => {
    return (
      row["Industry"] ??
      row["industry"] ??
      "Unknown"
    );
  };


  // ==========================================================
  // GET CITY
  // ==========================================================

  const getCity = (row) => {
    return (
      row["City"] ??
      row["city"] ??
      "Unknown"
    );
  };


  // ==========================================================
  // GET INFO STATUS
  // ==========================================================

  const getInfoStatus = (row) => {
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
  };


  // ==========================================================
  // GET BILLING
  // ==========================================================

  const getBilling = (row) => {
    return toNumber(
      row["Total Bill Amount"] ??
      row["total_bill_amount"] ??
      row["Total Billing"] ??
      row["total_billing"] ??
      row["Billing"] ??
      row["billing"] ??
      0
    );
  };


  // ==========================================================
  // GET FRANCHISEE SHARE
  // ==========================================================

  const getFranchiseeShare = (row) => {
    return toNumber(
      row["Franchisee Share"] ??
      row["franchisee_share"] ??
      row["Franchise Cost"] ??
      row["franchise_cost"] ??
      0
    );
  };


  // ==========================================================
  // TL EXPENDITURE
  //
  // TL EXPENDITURE = 5% OF GROSS REVENUE
  // ==========================================================

  const getTLExpenditure = (row) => {
    return getBilling(row) * 0.05;
  };


  // ==========================================================
  // NET AMOUNT
  //
  // NET AMOUNT = TOTAL BILLING - FRANCHISEE SHARE
  // ==========================================================

  const getNetAmount = (row) => {
    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );
  };


  // ==========================================================
  // GET ACQUIRED DATE
  // ==========================================================

  const getAcquiredDate = (row) => {
    return (
      row["Date Client Acquired"] ??
      row["date_client_acquired"] ??
      row["Date Client acquired"] ??
      row["dateClientAcquired"] ??
      row["Acquisition Date"] ??
      row["acquisition_date"] ??
      null
    );
  };


  // ==========================================================
  // GET FINANCIAL MONTH
  // ==========================================================

  const getFinancialMonth = (row) => {
    const dateValue = getAcquiredDate(row);

    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString(
      "en-US",
      {
        month: "long",
      }
    );
  };


  // ==========================================================
  // BEST VALUE
  // ==========================================================

  const getBestValue = (data, key) => {
    if (!data || data.length === 0) {
      return "N/A";
    }

    const grouped = {};

    data.forEach((row) => {
      let value = "";

      if (key === "Industry") {
        value = getIndustry(row);
      }

      if (key === "City") {
        value = getCity(row);
      }

      value =
        String(value || "Unknown").trim();

      grouped[value] =
        (grouped[value] || 0) + 1;
    });

    const sorted =
      Object.entries(grouped).sort(
        (a, b) => b[1] - a[1]
      );

    return sorted.length > 0
      ? sorted[0][0]
      : "N/A";
  };


  // ==========================================================
  // FINANCIAL YEARS
  // ==========================================================

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach((row) => {
      const financialYear =
        getFinancialYearFromRow?.(row);

      if (financialYear) {
        years.add(financialYear);
      }
    });

    return Array.from(years).sort().reverse();
  }, [
    rows,
    getFinancialYearFromRow,
  ]);


  // ==========================================================
  // FILTER ROWS
  //
  // 1. Financial Year
  // 2. Info Status
  // ==========================================================

  const filteredTableRows = useMemo(() => {
    return rows.filter((row) => {

      // ------------------------------------------------------
      // FINANCIAL YEAR FILTER
      // ------------------------------------------------------

      const rowFinancialYear =
        getFinancialYearFromRow?.(row) || "";

      const matchesFinancialYear =
        !selectedTableFinancialYear ||
        rowFinancialYear ===
          selectedTableFinancialYear;


      // ------------------------------------------------------
      // INFO FILTER
      // ------------------------------------------------------

      const infoStatus =
        getInfoStatus(row);

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


  // ==========================================================
  // APPLY FINANCIAL CALCULATION RULES
  //
  // NO INFO FILTER:
  //   Billing       = ALL records
  //   Net           = ONLY R
  //   Expenditure   = ONLY R
  //
  // R:
  //   Billing       = R
  //   Net           = R
  //   Expenditure   = R
  //
  // RV / C / CN:
  //   Billing       = selected status
  //   Net           = 0
  //   Expenditure   = 0
  // ==========================================================

  const applyFinancialRules = (
    row,
    target
  ) => {

    const infoStatus =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    // ========================================================
    // NO INFO FILTER
    // ========================================================

    if (!selectedInfoStatus) {

      // Total Billing includes ALL records
      target.billing += billing;


      // Net + Expenditure ONLY for R
      if (infoStatus === "R") {

        target.netAmount +=
          getNetAmount(row);

        target.tlExpenditure +=
          getTLExpenditure(row);
      }

      return;
    }


    // ========================================================
    // R FILTER
    // ========================================================

    if (selectedInfoStatus === "R") {

      target.billing += billing;

      target.netAmount +=
        getNetAmount(row);

      target.tlExpenditure +=
        getTLExpenditure(row);

      return;
    }


    // ========================================================
    // RV / C / CN FILTER
    // ========================================================

    if (
      selectedInfoStatus === "RV" ||
      selectedInfoStatus === "C" ||
      selectedInfoStatus === "CN"
    ) {

      // Billing is calculated
      target.billing += billing;

      // Net and Expenditure stay 0
      return;
    }
  };


  // ==========================================================
  // TEAM LEADER DATA
  // ==========================================================

  const leaderData = useMemo(() => {

    const grouped = {};


    filteredTableRows.forEach((row) => {

      const leader =
        String(
          getTeamLeader(row)
        ).trim() || "Unknown";


      // ------------------------------------------------------
      // CREATE LEADER
      // ------------------------------------------------------

      if (!grouped[leader]) {

        grouped[leader] = {

          name: leader,

          clients: 0,

          billing: 0,

          netAmount: 0,

          tlExpenditure: 0,
        };
      }


      // ------------------------------------------------------
      // CLIENT COUNT
      // ------------------------------------------------------

      grouped[leader].clients += 1;


      // ------------------------------------------------------
      // FINANCIAL CALCULATIONS
      // ------------------------------------------------------

      applyFinancialRules(
        row,
        grouped[leader]
      );
    });


    return Object.values(grouped).sort(
      (a, b) =>
        b.billing - a.billing
    );

  }, [
    filteredTableRows,
    selectedInfoStatus,
  ]);


  // ==========================================================
  // SELECTED LEADER ROWS
  // ==========================================================

  const selectedLeaderRows = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }

    return filteredTableRows.filter(
      (row) =>
        String(
          getTeamLeader(row)
        ).trim() ===
        String(
          selectedLeader
        ).trim()
    );

  }, [
    filteredTableRows,
    selectedLeader,
  ]);


  // ==========================================================
  // SELECTED LEADER SUMMARY
  // ==========================================================

  const selectedSummary = useMemo(() => {

    const summary = {

      clients:
        selectedLeaderRows.length,

      billing: 0,

      netAmount: 0,

      tlExpenditure: 0,
    };


    selectedLeaderRows.forEach(
      (row) => {

        applyFinancialRules(
          row,
          summary
        );

      }
    );


    return {

      ...summary,

      bestIndustry:
        getBestValue(
          selectedLeaderRows,
          "Industry"
        ),

      bestCity:
        getBestValue(
          selectedLeaderRows,
          "City"
        ),
    };

  }, [
    selectedLeaderRows,
    selectedInfoStatus,
  ]);


  // ==========================================================
  // MODAL FINANCIAL YEAR ROWS
  // ==========================================================

  const modalFinancialYearRows =
    useMemo(() => {

      if (!selectedFinancialYear) {
        return selectedLeaderRows;
      }

      return selectedLeaderRows.filter(
        (row) =>
          getFinancialYearFromRow?.(
            row
          ) === selectedFinancialYear
      );

    }, [
      selectedLeaderRows,
      selectedFinancialYear,
      getFinancialYearFromRow,
    ]);


  // ==========================================================
  // YEARLY REPORT
  // ==========================================================

  const yearlyReportData = useMemo(() => {

    const grouped = {};


    modalFinancialYearRows.forEach(
      (row) => {

        const year =
          getFinancialYearFromRow?.(
            row
          ) || "Unknown";


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
      }
    );


    return Object.values(grouped);

  }, [
    modalFinancialYearRows,
    selectedInfoStatus,
  ]);


  // ==========================================================
  // MONTHLY REPORT
  // ==========================================================

  const monthlyReportData =
    useMemo(() => {

      const grouped = {};


      financialMonths.forEach(
        (month) => {

          grouped[month] = {

            month,

            clients: 0,

            billing: 0,

            netAmount: 0,

            tlExpenditure: 0,
          };
        }
      );


      modalFinancialYearRows.forEach(
        (row) => {

          const month =
            getFinancialMonth(row);


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
        }
      );


      return financialMonths.map(
        (month) =>
          grouped[month]
      );

    }, [
      modalFinancialYearRows,
      selectedInfoStatus,
    ]);


  // ==========================================================
  // OPEN REPORT
  // ==========================================================

  const openLeaderReport = (
    leader
  ) => {

    setSelectedLeader(leader);

    setSelectedFinancialYear("");
  };


  // ==========================================================
  // CLOSE REPORT
  // ==========================================================

  const closeModal = () => {

    setSelectedLeader(null);

    setSelectedFinancialYear("");
  };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {

    setSelectedTableFinancialYear("");

    setSelectedInfoStatus("");
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="team-leader-performance">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="performance-header">

        <div>

          <h2>
            Team Leader Performance
          </h2>

          <p>
            Team Leader wise client acquisition
            and financial performance
          </p>

        </div>

      </div>


      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div
        className="performance-filters"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "20px",
          margin: "20px 0",
          padding: "18px 20px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          flexWrap: "wrap",
          visibility: "visible",
          opacity: 1,
        }}
      >

        {/* ==================================================
            FINANCIAL YEAR
        ================================================== */}

        <div
          className="filter-group"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            minWidth: "200px",
          }}
        >

          <label
            htmlFor="tl-financial-year"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Financial Year
          </label>


          <select
            id="tl-financial-year"
            value={
              selectedTableFinancialYear
            }
            onChange={(e) =>
              setSelectedTableFinancialYear(
                e.target.value
              )
            }
            style={{
              height: "42px",
              minWidth: "200px",
              padding: "0 12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              cursor: "pointer",
            }}
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


        {/* ==================================================
            INFO STATUS
        ================================================== */}

        <div
          className="filter-group"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            minWidth: "200px",
          }}
        >

          <label
            htmlFor="tl-info-status"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Info Status
          </label>


          <select
            id="tl-info-status"
            value={
              selectedInfoStatus
            }
            onChange={(e) =>
              setSelectedInfoStatus(
                e.target.value
              )
            }
            style={{
              height: "42px",
              minWidth: "200px",
              padding: "0 12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              cursor: "pointer",
            }}
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


        {/* ==================================================
            CLEAR FILTER
        ================================================== */}

        {(selectedTableFinancialYear ||
          selectedInfoStatus) && (

          <button
            type="button"
            className="clear-filter-btn"
            onClick={clearFilters}
            style={{
              height: "42px",
              padding: "0 18px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              background: "#ffffff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>

        )}

      </div>


      {/* ====================================================
          FILTER SUMMARY
      ==================================================== */}

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
            Info Status:{" "}
            <strong>
              {selectedInfoStatus}
            </strong>
          </span>

        )}

      </div>


      {/* ====================================================
          PERFORMANCE TABLE
      ==================================================== */}

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
                  No data available for
                  the selected filters.
                </td>

              </tr>

            ) : (

              leaderData.map(
                (leader) => (

                  <tr
                    key={leader.name}
                  >

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


                    <td>
                      {leader.clients}
                    </td>


                    <td>
                      {fullCurrency(
                        leader.billing
                      )}
                    </td>


                    <td>
                      {fullCurrency(
                        leader.netAmount
                      )}
                    </td>


                    <td>
                      {fullCurrency(
                        leader.tlExpenditure
                      )}
                    </td>


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

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* ====================================================
          MODAL
      ==================================================== */}

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

            {/* =================================================
                MODAL HEADER
            ================================================= */}

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


            {/* =================================================
                MODAL FINANCIAL YEAR
            ================================================= */}

            <div className="modal-filter">

              <label htmlFor="modal-financial-year">
                Financial Year
              </label>


              <select
                id="modal-financial-year"
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


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="summary-cards">

              <div className="summary-card">

                <span className="summary-card-label">
                  Total Clients
                </span>

                <strong>
                  {selectedSummary.clients}
                </strong>

              </div>


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


              <div className="summary-card">

                <span className="summary-card-label">
                  Best Industry
                </span>

                <strong>
                  {selectedSummary.bestIndustry}
                </strong>

              </div>


              <div className="summary-card">

                <span className="summary-card-label">
                  Best City
                </span>

                <strong>
                  {selectedSummary.bestCity}
                </strong>

              </div>

            </div>


            {/* =================================================
                YEARLY PERFORMANCE
            ================================================= */}

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
                    data={
                      yearlyReportData
                    }
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
                        fullCurrency(
                          value
                        )
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


            {/* =================================================
                MONTHLY PERFORMANCE
            ================================================= */}

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
                    data={
                      monthlyReportData
                    }
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
                        fullCurrency(
                          value
                        )
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


            {/* =================================================
                CLIENT DETAILS
            ================================================= */}

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

                    {modalFinancialYearRows.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="7"
                          className="no-data"
                        >
                          No client data
                          available.
                        </td>

                      </tr>

                    ) : (

                      modalFinancialYearRows.map(
                        (row, index) => {

                          const infoStatus =
                            getInfoStatus(
                              row
                            );


                          let netAmount = 0;

                          let tlExpenditure = 0;


                          // --------------------------------
                          // NO FILTER
                          // ONLY R GETS NET + EXPENDITURE
                          // --------------------------------

                          if (
                            !selectedInfoStatus &&
                            infoStatus === "R"
                          ) {

                            netAmount =
                              getNetAmount(
                                row
                              );

                            tlExpenditure =
                              getTLExpenditure(
                                row
                              );
                          }


                          // --------------------------------
                          // R FILTER
                          // --------------------------------

                          if (
                            selectedInfoStatus ===
                            "R"
                          ) {

                            netAmount =
                              getNetAmount(
                                row
                              );

                            tlExpenditure =
                              getTLExpenditure(
                                row
                              );
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
                                {getIndustry(
                                  row
                                )}
                              </td>


                              <td>
                                {getCity(
                                  row
                                )}
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
                                  getBilling(
                                    row
                                  )
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


            {/* =================================================
                FOOTER
            ================================================= */}

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
