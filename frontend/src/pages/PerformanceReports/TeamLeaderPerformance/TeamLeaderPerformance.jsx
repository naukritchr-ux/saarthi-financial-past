import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import { useData } from "../../../context/DataContext";
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
  "March"
];


/* ============================================================
   COMPONENT
   ============================================================ */

function TeamLeaderPerformance() {

  const {
    rows = [],
    getFinancialYearFromRow
  } = useData();


  /* ==========================================================
     FILTER STATES
     ========================================================== */

  // Main table filters
  const [selectedTableFinancialYear, setSelectedTableFinancialYear] =
    useState("");

  const [selectedInfoStatus, setSelectedInfoStatus] =
    useState("");

  // Selected Team Leader
  const [selectedLeader, setSelectedLeader] =
    useState(null);

  // Modal Financial Year filter
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
      .replace(/\s/g, "")
      .trim();

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  };


  const formatCurrency = (value) => {

    const number = toNumber(value);

    return `₹${number.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })}`;
  };


  const normalizeText = (value) => {

    return String(value ?? "").trim();
  };


  /* ==========================================================
     FIELD HELPERS
     ========================================================== */

  const getTeamLeader = (row) => {

    return (
      normalizeText(row?.["Team Leader"]) ||
      "Unknown"
    );
  };


  const getIndustry = (row) => {

    return (
      normalizeText(
        row?.["Industry"] ||
        row?.["Sub Industry"]
      ) || "Unknown"
    );
  };


  const getCity = (row) => {

    return (
      normalizeText(row?.["City"]) ||
      "Unknown"
    );
  };


  /*
   * Excel column is exactly "Info"
   */

  const getInfoStatus = (row) => {

    return String(
      row?.["Info"] ?? ""
    )
      .trim()
      .toUpperCase();
  };


  const getBilling = (row) => {

    return toNumber(
      row?.["Billing"] ??
      row?.["Total Billing"] ??
      row?.["Billing Amount"] ??
      row?.["TANN/TDS"]
    );
  };


  const getFranchiseeShare = (row) => {

    return toNumber(
      row?.["Franchisee Share"] ??
      row?.["Franchise Cost"] ??
      row?.["Franchisee Cost"] ??
      row?.["Franchise Cost Amount"]
    );
  };


  const getNetAmount = (row) => {

    return (
      getBilling(row) -
      getFranchiseeShare(row)
    );
  };


  const getTLExpenditure = (row) => {

    return toNumber(
      row?.["TL Expenditure"] ??
      row?.["Team Leader Expenditure"] ??
      row?.["Team Leader Expense"] ??
      row?.["TL Expense"] ??
      row?.["Expenditure"]
    );
  };


  const getAcquiredDate = (row) => {

    return (
      row?.["Date Client Acquired"] ??
      row?.["Client Acquired Date"] ??
      row?.["Date Acquired"] ??
      row?.["Acquisition Date"] ??
      row?.["Client Acquisition Date"] ??
      ""
    );
  };


  /* ==========================================================
     DATE HELPERS
     ========================================================== */

  const parseDate = (value) => {

    if (!value) {
      return null;
    }

    if (value instanceof Date) {

      return Number.isNaN(value.getTime())
        ? null
        : value;
    }

    const text = String(value).trim();

    if (!text) {
      return null;
    }


    /* Excel serial date */

    if (/^\d+(\.\d+)?$/.test(text)) {

      const serial = Number(text);

      if (
        serial > 20000 &&
        serial < 70000
      ) {

        const date = new Date(
          Date.UTC(1899, 11, 30) +
          serial * 86400000
        );

        return Number.isNaN(date.getTime())
          ? null
          : date;
      }
    }


    /* DD/MM/YYYY or DD-MM-YYYY */

    const parts = text.split(/[\/\-]/);

    if (parts.length === 3) {

      let day = Number(parts[0]);
      let month = Number(parts[1]);
      let year = Number(parts[2]);

      if (year < 100) {
        year += 2000;
      }

      if (
        day >= 1 &&
        day <= 31 &&
        month >= 1 &&
        month <= 12 &&
        year >= 1900
      ) {

        const date = new Date(
          year,
          month - 1,
          day
        );

        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    }


    const date = new Date(text);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };


  const getFinancialMonth = (row) => {

    const date = parseDate(
      getAcquiredDate(row)
    );

    if (!date) {
      return "";
    }

    return date.toLocaleString(
      "en-IN",
      {
        month: "long"
      }
    );
  };


  /* ==========================================================
     FINANCIAL YEAR
     ========================================================== */

  const getRowFinancialYear = (row) => {

    try {

      if (
        typeof getFinancialYearFromRow ===
        "function"
      ) {

        const fy =
          getFinancialYearFromRow(row);

        if (fy) {
          return String(fy);
        }
      }

    } catch (error) {

      console.error(
        "Financial year error:",
        error
      );
    }


    const date = parseDate(
      getAcquiredDate(row)
    );

    if (!date) {
      return "";
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month >= 4) {

      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
    }

    return `${year - 1}-${String(
      year
    ).slice(-2)}`;
  };


  /* ==========================================================
     FINANCIAL YEARS
     ========================================================== */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const fy =
        getRowFinancialYear(row);

      if (fy) {
        years.add(fy);
      }
    });


    return Array.from(years).sort(
      (a, b) => {

        const yearA =
          Number(
            String(a).substring(0, 4)
          );

        const yearB =
          Number(
            String(b).substring(0, 4)
          );

        return yearB - yearA;
      }
    );

  }, [
    rows,
    getFinancialYearFromRow
  ]);


  /* ==========================================================
     FINANCIAL RULES
     ==========================================================

     R:
       Billing = Billing
       Net Amount = Billing - Franchisee Share
       TL Expenditure = TL Expenditure

     RV / C / CN:
       Billing = Billing
       Net Amount = 0
       TL Expenditure = 0

     No Info filter:
       Only R rows contribute financially.
  ========================================================== */

  const applyFinancialRules = (row) => {

    const info =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    if (info === "R") {

      return {

        billing,

        netAmount:
          getNetAmount(row),

        tlExpenditure:
          getTLExpenditure(row)
      };
    }


    if (
      info === "RV" ||
      info === "C" ||
      info === "CN"
    ) {

      return {

        billing,

        netAmount: 0,

        tlExpenditure: 0
      };
    }


    return {

      billing: 0,

      netAmount: 0,

      tlExpenditure: 0
    };
  };


  /* ==========================================================
     MAIN FILTER
     ========================================================== */

  const filteredRows = useMemo(() => {

    return rows.filter((row) => {

      const fy =
        getRowFinancialYear(row);

      const info =
        getInfoStatus(row);


      if (
        selectedTableFinancialYear &&
        fy !== selectedTableFinancialYear
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
    selectedInfoStatus,
    getFinancialYearFromRow
  ]);


  /* ==========================================================
     FINANCIAL ROWS
     ========================================================== */

  const financialRows = useMemo(() => {

    if (!selectedInfoStatus) {

      return filteredRows.filter(
        (row) =>
          getInfoStatus(row) === "R"
      );
    }


    return filteredRows.filter(
      (row) =>
        getInfoStatus(row) ===
        selectedInfoStatus
    );

  }, [
    filteredRows,
    selectedInfoStatus
  ]);


  /* ==========================================================
     TEAM LEADER SUMMARY
     ========================================================== */

  const teamLeaderSummary = useMemo(() => {

    const grouped = {};


    filteredRows.forEach((row) => {

      const leader =
        getTeamLeader(row);


      if (!grouped[leader]) {

        grouped[leader] = {

          teamLeader: leader,

          acquiredClients: 0,

          totalBilling: 0,

          netAmount: 0,

          tlExpenditure: 0,

          industries: {},

          cities: {},

          clients: []
        };
      }


      grouped[leader].acquiredClients += 1;

      grouped[leader].clients.push(row);


      /*
       * Financial calculation
       */

      const info =
        getInfoStatus(row);


      const shouldCalculate =
        selectedInfoStatus
          ? info === selectedInfoStatus
          : info === "R";


      if (shouldCalculate) {

        const financial =
          applyFinancialRules(row);


        grouped[leader].totalBilling +=
          financial.billing;


        grouped[leader].netAmount +=
          financial.netAmount;


        grouped[leader].tlExpenditure +=
          financial.tlExpenditure;
      }


      /*
       * Industry
       */

      const industry =
        getIndustry(row);

      grouped[leader].industries[industry] =
        (
          grouped[leader].industries[industry] ||
          0
        ) + 1;


      /*
       * City
       */

      const city =
        getCity(row);

      grouped[leader].cities[city] =
        (
          grouped[leader].cities[city] ||
          0
        ) + 1;
    });


    return Object.values(grouped)
      .map((leader) => {

        const grossProfit =
          leader.netAmount -
          leader.tlExpenditure;


        return {

          ...leader,

          grossProfit,

          grossMargin:
            leader.netAmount !== 0
              ? (
                  grossProfit /
                  leader.netAmount
                ) * 100
              : 0
        };
      })
      .sort(
        (a, b) =>
          b.totalBilling -
          a.totalBilling
      );

  }, [
    filteredRows,
    selectedInfoStatus
  ]);


  /* ==========================================================
     OVERALL TOTALS
     ========================================================== */

  const overallTotals = useMemo(() => {

    let totalBilling = 0;
    let netAmount = 0;
    let tlExpenditure = 0;


    financialRows.forEach((row) => {

      const financial =
        applyFinancialRules(row);


      totalBilling +=
        financial.billing;


      netAmount +=
        financial.netAmount;


      tlExpenditure +=
        financial.tlExpenditure;
    });


    const grossProfit =
      netAmount -
      tlExpenditure;


    return {

      clients:
        filteredRows.length,

      totalBilling,

      netAmount,

      tlExpenditure,

      grossProfit,

      grossMargin:
        netAmount !== 0
          ? (
              grossProfit /
              netAmount
            ) * 100
          : 0
    };

  }, [
    filteredRows,
    financialRows
  ]);


  /* ==========================================================
     CLEAR FILTERS
     ========================================================== */

  const clearFilters = () => {

    setSelectedTableFinancialYear("");

    setSelectedInfoStatus("");
  };


  /* ==========================================================
     BEST VALUE
     ========================================================== */

  const getBestValue = (object) => {

    const entries =
      Object.entries(object || {});


    if (!entries.length) {
      return "N/A";
    }


    entries.sort(
      (a, b) =>
        b[1] - a[1]
    );


    return entries[0][0];
  };


  /* ==========================================================
     SELECTED LEADER DATA
     ========================================================== */

  const selectedLeaderData =
    useMemo(() => {

      if (!selectedLeader) {
        return null;
      }


      const leader =
        teamLeaderSummary.find(
          (item) =>
            item.teamLeader ===
            selectedLeader
        );


      return leader || null;

    }, [
      selectedLeader,
      teamLeaderSummary
    ]);


  /* ==========================================================
     SELECTED LEADER ROWS
     ========================================================== */

  const selectedLeaderRows =
    useMemo(() => {

      if (!selectedLeader) {
        return [];
      }


      return filteredRows.filter(
        (row) =>
          getTeamLeader(row) ===
          selectedLeader
      );

    }, [
      filteredRows,
      selectedLeader
    ]);


  /* ==========================================================
     MODAL FILTERED LEADER ROWS
     ========================================================== */

  const modalLeaderRows = useMemo(() => {

    return selectedLeaderRows.filter(
      (row) => {

        const fy =
          getRowFinancialYear(row);


        if (
          selectedFinancialYear &&
          fy !== selectedFinancialYear
        ) {
          return false;
        }


        return true;
      }
    );

  }, [
    selectedLeaderRows,
    selectedFinancialYear,
    getFinancialYearFromRow
  ]);


  /* ==========================================================
     MODAL LEADER DATA
     ========================================================== */

  const modalLeaderData = useMemo(() => {

    if (!selectedLeader) {
      return null;
    }


    let totalBilling = 0;
    let netAmount = 0;
    let tlExpenditure = 0;

    const industries = {};
    const cities = {};


    modalLeaderRows.forEach((row) => {

      const info =
        getInfoStatus(row);


      const shouldCalculate =
        selectedInfoStatus
          ? info === selectedInfoStatus
          : info === "R";


      if (shouldCalculate) {

        const financial =
          applyFinancialRules(row);


        totalBilling +=
          financial.billing;


        netAmount +=
          financial.netAmount;


        tlExpenditure +=
          financial.tlExpenditure;
      }


      const industry =
        getIndustry(row);

      industries[industry] =
        (industries[industry] || 0) + 1;


      const city =
        getCity(row);

      cities[city] =
        (cities[city] || 0) + 1;
    });


    const grossProfit =
      netAmount -
      tlExpenditure;


    return {

      clients:
        modalLeaderRows.length,

      totalBilling,

      netAmount,

      tlExpenditure,

      grossProfit,

      grossMargin:
        netAmount !== 0
          ? (
              grossProfit /
              netAmount
            ) * 100
          : 0,

      industries,

      cities
    };

  }, [
    modalLeaderRows,
    selectedInfoStatus,
    selectedLeader
  ]);


  /* ==========================================================
     YEARLY REPORT
     ========================================================== */

  const yearlyReport = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }


    const grouped = {};


    modalLeaderRows.forEach((row) => {

      const fy =
        getRowFinancialYear(row);


      if (!fy) {
        return;
      }


      if (!grouped[fy]) {

        grouped[fy] = {

          financialYear: fy,

          clients: 0,

          totalBilling: 0,

          netAmount: 0,

          tlExpenditure: 0
        };
      }


      grouped[fy].clients += 1;


      const info =
        getInfoStatus(row);


      const shouldCalculate =
        selectedInfoStatus
          ? info === selectedInfoStatus
          : info === "R";


      if (shouldCalculate) {

        const financial =
          applyFinancialRules(row);


        grouped[fy].totalBilling +=
          financial.billing;


        grouped[fy].netAmount +=
          financial.netAmount;


        grouped[fy].tlExpenditure +=
          financial.tlExpenditure;
      }
    });


    return Object.values(grouped).sort(
      (a, b) => {

        const yearA =
          Number(
            String(a.financialYear)
              .substring(0, 4)
          );

        const yearB =
          Number(
            String(b.financialYear)
              .substring(0, 4)
          );

        return yearA - yearB;
      }
    );

  }, [
    modalLeaderRows,
    selectedInfoStatus,
    selectedLeader,
    getFinancialYearFromRow
  ]);


  /* ==========================================================
     MONTHLY REPORT
     ========================================================== */

  const monthlyReport = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }


    const grouped = {};


    financialMonths.forEach(
      (month) => {

        grouped[month] = {

          month,

          clients: 0,

          totalBilling: 0,

          netAmount: 0,

          tlExpenditure: 0
        };
      }
    );


    modalLeaderRows.forEach((row) => {

      const month =
        getFinancialMonth(row);


      if (!month || !grouped[month]) {
        return;
      }


      grouped[month].clients += 1;


      const info =
        getInfoStatus(row);


      const shouldCalculate =
        selectedInfoStatus
          ? info === selectedInfoStatus
          : info === "R";


      if (shouldCalculate) {

        const financial =
          applyFinancialRules(row);


        grouped[month].totalBilling +=
          financial.billing;


        grouped[month].netAmount +=
          financial.netAmount;


        grouped[month].tlExpenditure +=
          financial.tlExpenditure;
      }
    });


    return financialMonths.map(
      (month) =>
        grouped[month]
    );

  }, [
    modalLeaderRows,
    selectedInfoStatus,
    selectedLeader
  ]);


  /* ==========================================================
     CLIENT DETAILS
     ========================================================== */

  const clientDetails = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }


    return modalLeaderRows.map(
      (row, index) => {

        const info =
          getInfoStatus(row);


        let financial = {

          billing: 0,

          netAmount: 0,

          tlExpenditure: 0
        };


        const shouldCalculate =
          selectedInfoStatus
            ? info === selectedInfoStatus
            : info === "R";


        if (shouldCalculate) {

          financial =
            applyFinancialRules(row);
        }


        return {

          id: index + 1,

          company:
            row?.["Company Name"] ||
            row?.["Company"] ||
            "Unknown",

          info,

          financialYear:
            getRowFinancialYear(row),

          month:
            getFinancialMonth(row),

          industry:
            getIndustry(row),

          city:
            getCity(row),

          billing:
            financial.billing,

          netAmount:
            financial.netAmount,

          tlExpenditure:
            financial.tlExpenditure
        };
      }
    );

  }, [
    modalLeaderRows,
    selectedInfoStatus,
    selectedLeader,
    getFinancialYearFromRow
  ]);


  /* ==========================================================
     OPEN LEADER
     ========================================================== */

  const openLeader = (leader) => {

    setSelectedLeader(leader);

    // Reset modal FY every time a new leader is opened
    setSelectedFinancialYear("");
  };


  /* ==========================================================
     CLOSE LEADER
     ========================================================== */

  const closeLeader = () => {

    setSelectedLeader(null);

    setSelectedFinancialYear("");
  };


  /* ==========================================================
     RENDER
     ========================================================== */

  return (

    <div className="team-leader-performance">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="team-leader-page-header">

        <div>

          <h2>
            Team Leader Performance
          </h2>

          <p>
            Team Leader-wise client and financial performance
          </p>

        </div>

      </div>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="team-leader-filter-wrapper">

        <div className="team-leader-filter-header">

          <div>

            <h3>
              Filters
            </h3>

            <p>
              Filter Team Leader performance by financial year and Info status.
            </p>

          </div>


          <button
            type="button"
            onClick={clearFilters}
            className="team-leader-clear-btn"
          >
            Clear Filters
          </button>

        </div>


        <div className="team-leader-filters">


          {/* Financial Year */}

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


          {/* Info Status */}

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


        {/* Filter Result */}

        <div className="team-leader-filter-result">

          <span>
            Showing:
          </span>

          <strong>
            {filteredRows.length.toLocaleString(
              "en-IN"
            )}
          </strong>

          <span>
            records
          </span>


          {selectedTableFinancialYear && (

            <>

              <span className="filter-separator">
                |
              </span>

              <span>
                FY:
              </span>

              <strong>
                {selectedTableFinancialYear}
              </strong>

            </>

          )}


          {selectedInfoStatus && (

            <>

              <span className="filter-separator">
                |
              </span>

              <span>
                Info:
              </span>

              <strong>
                {selectedInfoStatus}
              </strong>

            </>

          )}

        </div>

      </div>


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="team-leader-summary-cards">


        <div className="team-leader-summary-card">

          <span className="summary-card-label">
            Total Clients
          </span>

          <strong>
            {overallTotals.clients.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>


        <div className="team-leader-summary-card">

          <span className="summary-card-label">
            Total Billing
          </span>

          <strong>
            {formatCurrency(
              overallTotals.totalBilling
            )}
          </strong>

        </div>


        <div className="team-leader-summary-card">

          <span className="summary-card-label">
            Net Amount
          </span>

          <strong>
            {formatCurrency(
              overallTotals.netAmount
            )}
          </strong>

        </div>


        <div className="team-leader-summary-card">

          <span className="summary-card-label">
            TL Expenditure
          </span>

          <strong>
            {formatCurrency(
              overallTotals.tlExpenditure
            )}
          </strong>

        </div>


        <div className="team-leader-summary-card">

          <span className="summary-card-label">
            Gross Profit
          </span>

          <strong>
            {formatCurrency(
              overallTotals.grossProfit
            )}
          </strong>

        </div>


        <div className="team-leader-summary-card">

          <span className="summary-card-label">
            Gross Margin
          </span>

          <strong>
            {overallTotals.grossMargin.toFixed(2)}%
          </strong>

        </div>

      </div>


      {/* ======================================================
          MAIN TABLE
      ====================================================== */}

      <div className="team-leader-table-card">

        <div className="team-leader-table-header">

          <div>

            <h3>
              Team Leader Performance
            </h3>

            <p>
              Click a Team Leader to view detailed performance.
            </p>

          </div>

        </div>


        <div className="team-leader-table-container">

          <table className="team-leader-table">

            <thead>

              <tr>

                <th>
                  Team Leader
                </th>

                <th>
                  Clients
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
                  Gross Profit
                </th>

                <th>
                  Gross Margin
                </th>

              </tr>

            </thead>


            <tbody>

              {teamLeaderSummary.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="no-data"
                  >
                    No Team Leader data found.
                  </td>

                </tr>

              ) : (

                teamLeaderSummary.map(
                  (leader) => (

                    <tr
                      key={leader.teamLeader}
                      onClick={() =>
                        openLeader(
                          leader.teamLeader
                        )
                      }
                      className="clickable-row"
                    >

                      <td className="leader-name">
                        {leader.teamLeader}
                      </td>

                      <td>
                        {leader.acquiredClients.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          leader.totalBilling
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
                        {formatCurrency(
                          leader.grossProfit
                        )}
                      </td>

                      <td>
                        {leader.grossMargin.toFixed(2)}%
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>


            {teamLeaderSummary.length > 0 && (

              <tfoot>

                <tr>

                  <th>
                    Total
                  </th>

                  <th>
                    {overallTotals.clients.toLocaleString(
                      "en-IN"
                    )}
                  </th>

                  <th>
                    {formatCurrency(
                      overallTotals.totalBilling
                    )}
                  </th>

                  <th>
                    {formatCurrency(
                      overallTotals.netAmount
                    )}
                  </th>

                  <th>
                    {formatCurrency(
                      overallTotals.tlExpenditure
                    )}
                  </th>

                  <th>
                    {formatCurrency(
                      overallTotals.grossProfit
                    )}
                  </th>

                  <th>
                    {overallTotals.grossMargin.toFixed(2)}%
                  </th>

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </div>


      {/* ======================================================
          LEADER MODAL
      ====================================================== */}

      {selectedLeader &&
        modalLeaderData && (

        <div
          className="team-leader-modal-overlay"
          onClick={closeLeader}
        >

          <div
            className="team-leader-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* Modal Header */}

            <div className="team-leader-modal-header">

              <div>

                <h2>
                  {selectedLeader}
                </h2>

                <p>
                  Detailed Team Leader Performance
                </p>

              </div>


              <button
                type="button"
                className="team-leader-modal-close"
                onClick={closeLeader}
              >
                ×
              </button>

            </div>


            {/* =================================================
                MODAL FINANCIAL YEAR FILTER
            ================================================= */}

            <div className="leader-modal-filter-section">

              <div className="leader-modal-filter">

                <label htmlFor="leaderFinancialYear">
                  Financial Year
                </label>


                <select
                  id="leaderFinancialYear"
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

            </div>


            {/* =================================================
                MODAL KPI
            ================================================= */}

            <div className="leader-modal-kpis">

              <div>

                <span>
                  Clients
                </span>

                <strong>
                  {modalLeaderData.clients.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.totalBilling
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Net Amount
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.netAmount
                  )}
                </strong>

              </div>


              <div>

                <span>
                  TL Expenditure
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.tlExpenditure
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Gross Profit
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.grossProfit
                  )}
                </strong>

              </div>

            </div>


            {/* =================================================
                BEST INDUSTRY / CITY
            ================================================= */}

            <div className="leader-best-section">

              <div className="leader-best-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {getBestValue(
                    modalLeaderData.industries
                  )}
                </strong>

              </div>


              <div className="leader-best-card">

                <span>
                  Best City
                </span>

                <strong>
                  {getBestValue(
                    modalLeaderData.cities
                  )}
                </strong>

              </div>

            </div>


            {/* =================================================
                YEARLY REPORT
            ================================================= */}

            <div className="leader-report-section">

              <div className="leader-report-header">

                <h3>
                  Yearly Report
                </h3>

              </div>


              <div className="leader-report-table-container">

                <table className="leader-report-table">

                  <thead>

                    <tr>

                      <th>
                        Financial Year
                      </th>

                      <th>
                        Clients
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

                    </tr>

                  </thead>


                  <tbody>

                    {yearlyReport.length === 0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="no-data"
                        >
                          No yearly data found.
                        </td>

                      </tr>

                    ) : (

                      yearlyReport.map(
                        (item) => (

                          <tr
                            key={
                              item.financialYear
                            }
                          >

                            <td>
                              {item.financialYear}
                            </td>

                            <td>
                              {item.clients.toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                item.totalBilling
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                item.netAmount
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                item.tlExpenditure
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* =================================================
                MONTHLY REPORT
            ================================================= */}

            <div className="leader-report-section">

              <div className="leader-report-header">

                <h3>
                  Monthly Report
                </h3>

              </div>


              <div className="leader-chart">

                <ResponsiveContainer
                  width="100%"
                  height={350}
                >

                  <BarChart
                    data={monthlyReport}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 10,
                      bottom: 10
                    }}
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
                      dataKey="totalBilling"
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

            <div className="leader-report-section">

              <div className="leader-report-header">

                <h3>
                  Client Details
                </h3>

              </div>


              <div className="leader-report-table-container">

                <table className="leader-report-table">

                  <thead>

                    <tr>

                      <th>
                        #
                      </th>

                      <th>
                        Company Name
                      </th>

                      <th>
                        Info
                      </th>

                      <th>
                        Financial Year
                      </th>

                      <th>
                        Month
                      </th>

                      <th>
                        Industry
                      </th>

                      <th>
                        City
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

                    {clientDetails.length === 0 ? (

                      <tr>

                        <td
                          colSpan="10"
                          className="no-data"
                        >
                          No client details found.
                        </td>

                      </tr>

                    ) : (

                      clientDetails.map(
                        (client) => (

                          <tr
                            key={client.id}
                          >

                            <td>
                              {client.id}
                            </td>

                            <td>
                              {client.company}
                            </td>

                            <td>

                              <span
                                className={`info-status info-${client.info.toLowerCase()}`}
                              >
                                {client.info || "-"}
                              </span>

                            </td>

                            <td>
                              {client.financialYear || "-"}
                            </td>

                            <td>
                              {client.month || "-"}
                            </td>

                            <td>
                              {client.industry}
                            </td>

                            <td>
                              {client.city}
                            </td>

                            <td>
                              {formatCurrency(
                                client.billing
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                client.netAmount
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                client.tlExpenditure
                              )}
                            </td>

                          </tr>

                        )
                      )

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
