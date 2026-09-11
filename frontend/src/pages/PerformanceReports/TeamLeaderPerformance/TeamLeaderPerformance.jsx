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
  // MAIN FILTERS
  // ==========================================================

  const [
    selectedTableFinancialYear,
    setSelectedTableFinancialYear,
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus,
  ] = useState("");


  // ==========================================================
  // MODAL
  // ==========================================================

  const [
    selectedLeader,
    setSelectedLeader,
  ] = useState(null);

  const [
    selectedFinancialYear,
    setSelectedFinancialYear,
  ] = useState("");


  // ==========================================================
  // NUMBER HELPER
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

    const cleanedValue = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    const number = Number(cleanedValue);

    return Number.isFinite(number)
      ? number
      : 0;
  };


  // ==========================================================
  // CURRENCY FORMAT
  // ==========================================================

  const formatCurrency = (value) => {

    return toNumber(value).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );
  };


  const fullCurrency = (value) => {
    return `₹${formatCurrency(value)}`;
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
  // 5% OF GROSS REVENUE
  // ==========================================================

  const getTLExpenditure = (row) => {

    return getBilling(row) * 0.05;
  };


  // ==========================================================
  // NET AMOUNT
  //
  // TOTAL BILLING - FRANCHISEE SHARE
  // ==========================================================

  const getNetAmount = (row) => {

    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );
  };


  // ==========================================================
  // ACQUISITION DATE
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
  // FINANCIAL MONTH
  // ==========================================================

  const getFinancialMonth = (row) => {

    const dateValue =
      getAcquiredDate(row);

    if (!dateValue) {
      return null;
    }

    const date =
      new Date(dateValue);

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

  const getBestValue = (
    data,
    type
  ) => {

    if (
      !data ||
      data.length === 0
    ) {
      return "N/A";
    }

    const grouped = {};


    data.forEach((row) => {

      let value = "Unknown";


      if (type === "Industry") {
        value = getIndustry(row);
      }


      if (type === "City") {
        value = getCity(row);
      }


      value =
        String(value || "Unknown")
          .trim();


      grouped[value] =
        (grouped[value] || 0) + 1;
    });


    const sorted =
      Object.entries(grouped)
        .sort(
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
        getFinancialYearFromRow?.(
          row
        );


      if (financialYear) {
        years.add(
          financialYear
        );
      }

    });


    return Array.from(years)
      .sort()
      .reverse();

  }, [
    rows,
    getFinancialYearFromRow,
  ]);


  // ==========================================================
  // FILTERED ROWS
  //
  // Financial Year + Info Status
  // ==========================================================

  const filteredTableRows = useMemo(() => {

    return rows.filter((row) => {

      // ------------------------------------------------------
      // FINANCIAL YEAR
      // ------------------------------------------------------

      const rowFinancialYear =
        getFinancialYearFromRow?.(
          row
        ) || "";


      const matchesFinancialYear =
        !selectedTableFinancialYear ||
        rowFinancialYear ===
          selectedTableFinancialYear;


      // ------------------------------------------------------
      // INFO STATUS
      // ------------------------------------------------------

      const infoStatus =
        getInfoStatus(row);


      const matchesInfoStatus =
        !selectedInfoStatus ||
        infoStatus ===
          selectedInfoStatus;


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
  // FINANCIAL CALCULATION RULE
  //
  // NO INFO FILTER:
  // Billing       = ALL
  // Net           = ONLY R
  // Expenditure   = ONLY R
  //
  // R:
  // Billing       = R
  // Net           = R
  // Expenditure   = R
  //
  // RV / C / CN:
  // Billing       = SELECTED STATUS
  // Net           = 0
  // Expenditure   = 0
  // ==========================================================

  const applyFinancialRules = (
    row,
    target
  ) => {

    const infoStatus =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    // --------------------------------------------------------
    // NO INFO FILTER
    // --------------------------------------------------------

    if (!selectedInfoStatus) {

      // Total billing from all records
      target.billing +=
        billing;


      // Net and expenditure only
      // where Info = R
      if (infoStatus === "R") {

        target.netAmount +=
          getNetAmount(row);

        target.tlExpenditure +=
          getTLExpenditure(row);
      }

      return;
    }


    // --------------------------------------------------------
    // R
    // --------------------------------------------------------

    if (
      selectedInfoStatus === "R"
    ) {

      target.billing +=
        billing;

      target.netAmount +=
        getNetAmount(row);

      target.tlExpenditure +=
        getTLExpenditure(row);

      return;
    }


    // --------------------------------------------------------
    // RV / C / CN
    // --------------------------------------------------------

    if (
      selectedInfoStatus === "RV" ||
      selectedInfoStatus === "C" ||
      selectedInfoStatus === "CN"
    ) {

      // Billing calculated
      target.billing +=
        billing;

      // Net = 0
      // Expenditure = 0

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
        ).trim() ||
        "Unknown";


      if (!grouped[leader]) {

        grouped[leader] = {

          name: leader,

          clients: 0,

          billing: 0,

          netAmount: 0,

          tlExpenditure: 0,
        };
      }


      // Client count
      grouped[leader].clients += 1;


      // Financial calculation
      applyFinancialRules(
        row,
        grouped[leader]
      );
    });


    return Object.values(grouped)
      .sort(
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
  // MODAL FILTERED ROWS
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
          ) ===
          selectedFinancialYear
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
  // OPEN MODAL
  // ==========================================================

  const openLeaderReport = (
    leader
  ) => {

    setSelectedLeader(
      leader
    );

    setSelectedFinancialYear(
      ""
    );
  };


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {

    setSelectedLeader(null);

    setSelectedFinancialYear("");
  };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {

    setSelectedTableFinancialYear(
      ""
    );

    setSelectedInfoStatus(
      ""
    );
  };


  // ==========================================================
  // RENDER
  // ==========================================================

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
            Team Leader wise client acquisition
            and financial performance
          </p>

        </div>

      </div>


      {/* ======================================================
          FILTERS ABOVE TABLE
      ====================================================== */}

      <div
        className="team-leader-filter-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "20px",
          width: "100%",
          padding: "20px",
          marginTop: "20px",
          marginBottom: "20px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          boxSizing: "border-box",
        }}
      >


        {/* ====================================================
            FINANCIAL YEAR
        ==================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            width: "220px",
          }}
        >

          <label
            htmlFor="team-leader-financial-year"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Financial Year
          </label>


          <select
            id="team-leader-financial-year"
            value={
              selectedTableFinancialYear
            }
            onChange={(e) =>
              setSelectedTableFinancialYear(
                e.target.value
              )
            }
            style={{
              display: "block",
              width: "220px",
              height: "42px",
              padding: "0 12px",
              backgroundColor: "#ffffff",
              color: "#111827",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none",
              boxSizing: "border-box",
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


        {/* ====================================================
            INFO STATUS
        ==================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            width: "220px",
          }}
        >

          <label
            htmlFor="team-leader-info-status"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Info Status
          </label>


          <select
            id="team-leader-info-status"
            value={
              selectedInfoStatus
            }
            onChange={(e) =>
              setSelectedInfoStatus(
                e.target.value
              )
            }
            style={{
              display: "block",
              width: "220px",
              height: "42px",
              padding: "0 12px",
              backgroundColor: "#ffffff",
              color: "#111827",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              fontSize: "14px",
              cursor: "pointer",
              outline: "none",
              boxSizing: "border-box",
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


        {/* ====================================================
            CLEAR FILTER
        ==================================================== */}

        {(selectedTableFinancialYear ||
          selectedInfoStatus) && (

          <button
            type="button"
            onClick={clearFilters}
            style={{
              height: "42px",
              padding: "0 18px",
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>

        )}

      </div>


      {/* ======================================================
          FILTER RESULT
      ====================================================== */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "center",
          marginBottom: "15px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >

        <span>

          Showing{" "}

          <strong
            style={{
              color: "#111827",
            }}
          >
            {filteredTableRows.length}
          </strong>

          {" "}records

        </span>


        {selectedTableFinancialYear && (

          <span>

            Financial Year:{" "}

            <strong
              style={{
                color: "#111827",
              }}
            >
              {selectedTableFinancialYear}
            </strong>

          </span>

        )}


        {selectedInfoStatus && (

          <span>

            Info Status:{" "}

            <strong
              style={{
                color: "#111827",
              }}
            >
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
                  No data available for
                  the selected filters.
                </td>

              </tr>

            ) : (

              leaderData.map(
                (leader) => (

                  <tr
                    key={
                      leader.name
                    }
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


      {/* ======================================================
          MODAL
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
                MODAL FINANCIAL YEAR
            ================================================== */}

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


            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

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


            {/* ==================================================
                CLIENT DETAILS
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


                          // ----------------------------------
                          // NO FILTER
                          // ONLY R
                          // ----------------------------------

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


                          // ----------------------------------
                          // R FILTER
                          // ----------------------------------

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
