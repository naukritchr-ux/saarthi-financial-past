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
     BASIC HELPERS
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

    return Number.isFinite(number) ? number : 0;
  };


  const formatCurrency = (value) => {

    return `₹${toNumber(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };


  const fullCurrency = (value) => {

    return toNumber(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };


  /* ==========================================================
     GET TEAM LEADER
     ========================================================== */

  const getTeamLeader = (row) => {

    return (
      row?.["Team Leader"] ??
      row?.["team_leader"] ??
      row?.["TeamLeader"] ??
      row?.["teamLeader"] ??
      "Unknown"
    );
  };


  /* ==========================================================
     GET INDUSTRY
     ========================================================== */

  const getIndustry = (row) => {

    return (
      row?.["Industry"] ??
      row?.["industry"] ??
      "Unknown"
    );
  };


  /* ==========================================================
     GET CITY
     ========================================================== */

  const getCity = (row) => {

    return (
      row?.["City"] ??
      row?.["city"] ??
      "Unknown"
    );
  };


  /* ==========================================================
     GET INFO STATUS
     
     Possible values:
     R
     RV
     C
     CN
     ========================================================== */

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


  /* ==========================================================
     GET BILLING
     ========================================================== */

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


  /* ==========================================================
     GET FRANCHISEE SHARE
     ========================================================== */

  const getFranchiseeShare = (row) => {

    return toNumber(
      row?.["Franchisee Share"] ??
      row?.["franchisee_share"] ??
      row?.["Franchise Cost"] ??
      row?.["franchise_cost"] ??
      0
    );
  };


  /* ==========================================================
     TL EXPENDITURE
     
     TL Expenditure = 5% of Billing
     ========================================================== */

  const getTLExpenditure = (row) => {

    return getBilling(row) * 0.05;
  };


  /* ==========================================================
     NET AMOUNT
     
     Net Amount = Billing - Franchisee Share
     ========================================================== */

  const getNetAmount = (row) => {

    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );
  };


  /* ==========================================================
     GET ACQUIRED DATE
     ========================================================== */

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


  /* ==========================================================
     GET FINANCIAL MONTH
     ========================================================== */

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


  /* ==========================================================
     BEST VALUE
     ========================================================== */

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


  /* ==========================================================
     FINANCIAL YEARS
     ========================================================== */

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
     FILTER MAIN TABLE
     ============================================================ */

  const filteredTableRows = useMemo(() => {

    return rows.filter((row) => {

      const rowFinancialYear =
        getFinancialYearFromRow?.(row) || "";

      const matchesFinancialYear =
        !selectedTableFinancialYear ||
        rowFinancialYear === selectedTableFinancialYear;


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


  /* ============================================================
     APPLY FINANCIAL RULES
     
     RULES:

     No Info Filter:
       Billing       = R only
       Net Amount    = R only
       TL Expenditure= R only

     R:
       Billing       = R only
       Net Amount    = R only
       TL Expenditure= R only

     RV:
       Billing       = RV only
       Net Amount    = 0
       TL Expenditure= 0

     C:
       Billing       = C only
       Net Amount    = 0
       TL Expenditure= 0

     CN:
       Billing       = CN only
       Net Amount    = 0
       TL Expenditure= 0
     ============================================================ */

  const applyFinancialRules = (
    row,
    target
  ) => {

    const infoStatus =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    /* ----------------------------------------------------------
       NO INFO FILTER
       ---------------------------------------------------------- */

    if (!selectedInfoStatus) {

      if (infoStatus === "R") {

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

      if (infoStatus === "R") {

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
        infoStatus === selectedInfoStatus
      ) {

        target.billing += billing;

        // Net Amount remains 0
        // TL Expenditure remains 0
      }

      return;
    }
  };


  /* ============================================================
     TEAM LEADER DATA
     ============================================================ */

  const leaderData = useMemo(() => {

    const grouped = {};


    filteredTableRows.forEach((row) => {

      const leader =
        String(getTeamLeader(row) || "Unknown").trim() ||
        "Unknown";


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
     SELECTED LEADER ROWS
     ============================================================ */

  const selectedLeaderRows = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }

    return filteredTableRows.filter(
      (row) =>
        String(getTeamLeader(row) || "Unknown").trim() ===
        selectedLeader
    );

  }, [
    filteredTableRows,
    selectedLeader,
  ]);


  /* ============================================================
     SELECTED LEADER SUMMARY
     ============================================================ */

  const selectedLeaderSummary = useMemo(() => {

    const summary = {
      clients: selectedLeaderRows.length,
      billing: 0,
      netAmount: 0,
      tlExpenditure: 0,
    };


    selectedLeaderRows.forEach((row) => {

      applyFinancialRules(
        row,
        summary
      );
    });


    return summary;

  }, [
    selectedLeaderRows,
    selectedInfoStatus,
  ]);


  /* ============================================================
     YEARLY REPORT
     ============================================================ */

  const yearlyReport = useMemo(() => {

    const grouped = {};


    selectedLeaderRows.forEach((row) => {

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


    return Object.values(grouped)
      .sort((a, b) =>
        String(a.financialYear).localeCompare(
          String(b.financialYear)
        )
      );

  }, [
    selectedLeaderRows,
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


    selectedLeaderRows.forEach((row) => {

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
    selectedLeaderRows,
    selectedInfoStatus,
  ]);


  /* ============================================================
     FILTER MODAL DATA BY FINANCIAL YEAR
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
      clients: modalFilteredRows.length,
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
     MODAL YEARLY REPORT
     ============================================================ */

  const modalYearlyReport = useMemo(() => {

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
     MODAL MONTHLY REPORT
     ============================================================ */

  const modalMonthlyReport = useMemo(() => {

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
      selectedTableFinancialYear || ""
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
     MAIN TABLE TOTALS
     ============================================================ */

  const tableTotals = useMemo(() => {

    return leaderData.reduce(
      (total, leader) => {

        total.clients +=
          leader.clients;

        total.billing +=
          leader.billing;

        total.netAmount +=
          leader.netAmount;

        total.tlExpenditure +=
          leader.tlExpenditure;

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
     RENDER
     ============================================================ */

  return (

    <div className="team-leader-performance">


      {/* ======================================================
          HEADER
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
          FILTERS
          ====================================================== */}

      <div className="performance-filters">

        {/* FINANCIAL YEAR */}

        <div className="filter-group">

          <label>
            Financial Year
          </label>

          <select
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

        <div className="filter-group">

          <label>
            Info Status
          </label>

          <select
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


        {/* CLEAR */}

        <button
          type="button"
          className="clear-filter-btn"
          onClick={clearFilters}
        >
          Clear Filters
        </button>

      </div>


      {/* ======================================================
          FILTER SUMMARY
          ====================================================== */}

      <div className="filter-result-summary">

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
          MAIN TABLE
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

                    {leader.clients > 0 ? (
                      <span className="performance-badge">
                        View Details
                      </span>
                    ) : (
                      "-"
                    )}

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
          LEADER MODAL
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


            {/* ==================================================
                MODAL HEADER
                ================================================== */}

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


            {/* ==================================================
                MODAL FILTER
                ================================================== */}

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


            {/* ==================================================
                SUMMARY CARDS
                ================================================== */}

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


            {/* ==================================================
                YEARLY REPORT
                ================================================== */}

            <div className="report-section">

              <div className="section-title">

                <h3>
                  Yearly Performance
                </h3>

              </div>


              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={modalYearlyReport}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="financialYear"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

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


            {/* ==================================================
                MONTHLY REPORT
                ================================================== */}

            <div className="report-section">

              <div className="section-title">

                <h3>
                  Monthly Performance
                </h3>

              </div>


              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={modalMonthlyReport}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

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


            {/* ==================================================
                CLIENT DETAILS
                ================================================== */}

            <div className="report-section">

              <div className="section-title">

                <h3>
                  Client Details
                </h3>

                <span>
                  {modalFilteredRows.length} Records
                </span>

              </div>


              <div className="client-details-table-container">

                <table className="client-details-table">

                  <thead>

                    <tr>

                      <th>
                        #
                      </th>

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

                    {modalFilteredRows.length === 0 ? (

                      <tr>

                        <td
                          colSpan="8"
                          className="no-data"
                        >
                          No client records found.
                        </td>

                      </tr>

                    ) : (

                      modalFilteredRows.map(
                        (row, index) => {

                          const infoStatus =
                            getInfoStatus(row);

                          const billing =
                            getBilling(row);

                          let displayBilling = 0;
                          let displayNetAmount = 0;
                          let displayTLExpenditure = 0;


                          /* ------------------------------------
                             NO INFO FILTER
                             Only R financial values
                             ------------------------------------ */

                          if (!selectedInfoStatus) {

                            if (
                              infoStatus === "R"
                            ) {

                              displayBilling =
                                billing;

                              displayNetAmount =
                                getNetAmount(row);

                              displayTLExpenditure =
                                getTLExpenditure(row);
                            }

                          }


                          /* ------------------------------------
                             R FILTER
                             ------------------------------------ */

                          else if (
                            selectedInfoStatus === "R"
                          ) {

                            if (
                              infoStatus === "R"
                            ) {

                              displayBilling =
                                billing;

                              displayNetAmount =
                                getNetAmount(row);

                              displayTLExpenditure =
                                getTLExpenditure(row);
                            }

                          }


                          /* ------------------------------------
                             RV / C / CN FILTER
                             Billing only
                             ------------------------------------ */

                          else if (
                            selectedInfoStatus === "RV" ||
                            selectedInfoStatus === "C" ||
                            selectedInfoStatus === "CN"
                          ) {

                            if (
                              infoStatus ===
                              selectedInfoStatus
                            ) {

                              displayBilling =
                                billing;

                              displayNetAmount = 0;

                              displayTLExpenditure = 0;
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

                                <span
                                  className={`info-status info-${infoStatus.toLowerCase()}`}
                                >
                                  {infoStatus || "-"}
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
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                MODAL FOOTER
                ================================================== */}

            <div className="leader-modal-footer">

              <div>

                <strong>
                  Billing:
                </strong>{" "}
                {fullCurrency(
                  modalSummary.billing
                )}

              </div>


              <div>

                <strong>
                  Net:
                </strong>{" "}
                {fullCurrency(
                  modalSummary.netAmount
                )}

              </div>


              <div>

                <strong>
                  TL Expenditure:
                </strong>{" "}
                {fullCurrency(
                  modalSummary.tlExpenditure
                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default TeamLeaderPerformance;
