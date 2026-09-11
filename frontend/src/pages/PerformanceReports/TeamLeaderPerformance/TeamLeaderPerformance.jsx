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

import { useData } from "../../context/DataContext";

import "./TeamLeaderPerformance.css";


/* ============================================================
   CONSTANTS
   ============================================================ */

const FINANCIAL_MONTHS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar"
];

const INFO_STATUSES = [
  { value: "", label: "All Info Status" },
  { value: "R", label: "R" },
  { value: "RV", label: "RV" },
  { value: "C", label: "C" },
  { value: "CN", label: "CN" }
];


/* ============================================================
   HELPERS
   ============================================================ */

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
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
    maximumFractionDigits: 2
  })}`;
};


const normalizeText = (value) => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};


const getTeamLeader = (row) => {
  return (
    row?.["Team Leader"] ??
    row?.team_leader ??
    row?.["Team Leader Name"] ??
    "Unknown"
  )
    .toString()
    .trim() || "Unknown";
};


const getIndustry = (row) => {
  return (
    row?.["Industry"] ??
    row?.industry ??
    "Unknown"
  )
    .toString()
    .trim() || "Unknown";
};


const getCity = (row) => {
  return (
    row?.["City"] ??
    row?.city ??
    "Unknown"
  )
    .toString()
    .trim() || "Unknown";
};


const getInfoStatus = (row) => {
  return normalizeText(
    row?.["Info"] ??
    row?.info ??
    ""
  );
};


/* ============================================================
   FINANCIAL HELPERS
   ============================================================ */

const getBilling = (row) => {
  return toNumber(
    row?.["Billing"] ??
    row?.["Total Billing"] ??
    row?.["Billing Amount"] ??
    row?.["TANN/TDS"] ??
    row?.["Total Bill Amount"] ??
    row?.total_bill_amount ??
    0
  );
};


const getFranchiseeShare = (row) => {
  return toNumber(
    row?.["Franchisee Share"] ??
    row?.franchisee_share ??
    row?.["Franchise Cost"] ??
    row?.["Franchisee Cost"] ??
    row?.["Franchise Cost Amount"] ??
    0
  );
};


const getNetAmount = (row) => {
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);

  return billing - franchiseeShare;
};


const getTLExpenditure = (row) => {
  return toNumber(
    row?.["TL Expenditure"] ??
    row?.["Team Leader Expenditure"] ??
    row?.["Team Leader Expense"] ??
    row?.["TL Expense"] ??
    row?.["Expenditure"] ??
    0
  );
};


/* ============================================================
   DATE HELPERS
   ============================================================ */

const getAcquiredDate = (row) => {
  return (
    row?.["Date Client Acquired"] ??
    row?.["date_client_acquired"] ??
    row?.["Aquired Date"] ??
    row?.["Acquired Date"] ??
    row?.["Acquisition Date"] ??
    ""
  );
};


const parseDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  const directDate = new Date(text);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const parts = text.split(/[\/\-\.]/);

  if (parts.length === 3) {
    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);

    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year)
    ) {
      const date = new Date(year, month, day);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
};


const getFinancialMonth = (row) => {
  const date = parseDate(getAcquiredDate(row));

  if (!date) {
    return "";
  }

  const month = date.getMonth();

  /*
    April = 0
    March = 11
  */

  return FINANCIAL_MONTHS[(month + 9) % 12];
};


const getRowFinancialYear = (row, getFinancialYearFromRow) => {
  if (typeof getFinancialYearFromRow === "function") {
    const result = getFinancialYearFromRow(row);

    if (result) {
      return result;
    }
  }

  const date = parseDate(getAcquiredDate(row));

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = date.getMonth();

  if (month >= 3) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
};


/* ============================================================
   FINANCIAL RULES
   ============================================================ */

const applyFinancialRules = (row) => {
  const info = getInfoStatus(row);
  const billing = getBilling(row);

  /*
    Team Leader calculation is intentionally kept
    exactly according to the current Team Leader logic.
  */

  if (info === "R") {
    return {
      billing,
      netAmount: getNetAmount(row),
      tlExpenditure: getTLExpenditure(row)
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


/* ============================================================
   COMPONENT
   ============================================================ */

function TeamLeaderPerformance() {
  const {
    rows,
    loading,
    error,
    getFinancialYearFromRow
  } = useData();


  /* ============================================================
     STATE
     ============================================================ */

  const [
    selectedTableFinancialYear,
    setSelectedTableFinancialYear
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");

  const [
    selectedLeader,
    setSelectedLeader
  ] = useState(null);

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears = useMemo(() => {
    const years = new Set();

    (rows || []).forEach((row) => {
      const year = getRowFinancialYear(
        row,
        getFinancialYearFromRow
      );

      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [rows, getFinancialYearFromRow]);


  /* ============================================================
     FILTERED ROWS
     ============================================================ */

  const filteredRows = useMemo(() => {
    let result = Array.isArray(rows) ? rows : [];

    if (selectedTableFinancialYear) {
      result = result.filter((row) => {
        return (
          getRowFinancialYear(
            row,
            getFinancialYearFromRow
          ) === selectedTableFinancialYear
        );
      });
    }

    if (selectedInfoStatus) {
      result = result.filter((row) => {
        return (
          getInfoStatus(row) ===
          selectedInfoStatus
        );
      });
    }

    return result;
  }, [
    rows,
    selectedTableFinancialYear,
    selectedInfoStatus,
    getFinancialYearFromRow
  ]);


  /* ============================================================
     MAIN TEAM LEADER SUMMARY
     ============================================================ */

  const teamLeaderSummary = useMemo(() => {
    const summaryMap = new Map();

    filteredRows.forEach((row) => {
      const leader = getTeamLeader(row);

      if (!summaryMap.has(leader)) {
        summaryMap.set(leader, {
          teamLeader: leader,
          clientCount: 0,
          totalBilling: 0,
          netAmount: 0,
          tlExpenditure: 0,
          grossProfit: 0,
          grossMargin: 0,
          industries: {},
          cities: {}
        });
      }

      const item = summaryMap.get(leader);

      /*
        Client count counts all filtered client rows.
      */
      item.clientCount += 1;


      /* --------------------------------------------------------
         Industry count
         -------------------------------------------------------- */

      const industry = getIndustry(row);

      item.industries[industry] =
        (item.industries[industry] || 0) + 1;


      /* --------------------------------------------------------
         City count
         -------------------------------------------------------- */

      const city = getCity(row);

      item.cities[city] =
        (item.cities[city] || 0) + 1;


      /* --------------------------------------------------------
         Financial calculation
         -------------------------------------------------------- */

      let shouldCalculate = false;

      /*
        When Info is not selected, only R contributes
        financially.
      */
      if (!selectedInfoStatus) {
        shouldCalculate =
          getInfoStatus(row) === "R";
      } else {
        shouldCalculate =
          getInfoStatus(row) === selectedInfoStatus;
      }

      if (shouldCalculate) {
        const financial =
          applyFinancialRules(row);

        item.totalBilling += financial.billing;
        item.netAmount += financial.netAmount;
        item.tlExpenditure +=
          financial.tlExpenditure;
      }
    });


    return Array.from(summaryMap.values())
      .map((item) => {
        const grossProfit =
          item.netAmount -
          item.tlExpenditure;

        const grossMargin =
          item.netAmount !== 0
            ? (grossProfit /
                item.netAmount) *
              100
            : 0;

        return {
          ...item,
          grossProfit,
          grossMargin
        };
      })
      .sort((a, b) =>
        a.teamLeader.localeCompare(
          b.teamLeader
        )
      );
  }, [
    filteredRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     OVERALL TOTALS
     ============================================================ */

  const overallTotals = useMemo(() => {
    return teamLeaderSummary.reduce(
      (total, item) => {
        total.clientCount +=
          item.clientCount;

        total.totalBilling +=
          item.totalBilling;

        total.netAmount +=
          item.netAmount;

        total.tlExpenditure +=
          item.tlExpenditure;

        total.grossProfit +=
          item.grossProfit;

        return total;
      },
      {
        clientCount: 0,
        totalBilling: 0,
        netAmount: 0,
        tlExpenditure: 0,
        grossProfit: 0
      }
    );
  }, [teamLeaderSummary]);


  const overallGrossMargin =
    overallTotals.netAmount !== 0
      ? (
          overallTotals.grossProfit /
          overallTotals.netAmount
        ) * 100
      : 0;


  /* ============================================================
     SELECTED LEADER ROWS
     ============================================================ */

  const selectedLeaderRows = useMemo(() => {
    if (!selectedLeader) {
      return [];
    }

    return filteredRows.filter(
      (row) =>
        getTeamLeader(row) ===
        selectedLeader.teamLeader
    );
  }, [
    filteredRows,
    selectedLeader
  ]);


  /* ============================================================
     MODAL FINANCIAL YEAR FILTER
     ============================================================ */

  const modalRows = useMemo(() => {
    if (!selectedFinancialYear) {
      return selectedLeaderRows;
    }

    return selectedLeaderRows.filter(
      (row) =>
        getRowFinancialYear(
          row,
          getFinancialYearFromRow
        ) === selectedFinancialYear
    );
  }, [
    selectedLeaderRows,
    selectedFinancialYear,
    getFinancialYearFromRow
  ]);


  /* ============================================================
     MODAL LEADER DATA
     ============================================================ */

  const selectedLeaderData = useMemo(() => {
    if (!selectedLeader) {
      return null;
    }

    let clients = 0;
    let totalBilling = 0;
    let netAmount = 0;
    let tlExpenditure = 0;

    const industries = {};
    const cities = {};


    modalRows.forEach((row) => {
      clients += 1;

      const industry =
        getIndustry(row);

      industries[industry] =
        (industries[industry] || 0) + 1;


      const city =
        getCity(row);

      cities[city] =
        (cities[city] || 0) + 1;


      let shouldCalculate = false;

      if (!selectedInfoStatus) {
        shouldCalculate =
          getInfoStatus(row) === "R";
      } else {
        shouldCalculate =
          getInfoStatus(row) ===
          selectedInfoStatus;
      }


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
    });


    const grossProfit =
      netAmount - tlExpenditure;

    const grossMargin =
      netAmount !== 0
        ? (grossProfit / netAmount) * 100
        : 0;


    return {
      clients,
      totalBilling,
      netAmount,
      tlExpenditure,
      grossProfit,
      grossMargin,
      industries,
      cities
    };
  }, [
    selectedLeader,
    modalRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     BEST INDUSTRY
     ============================================================ */

  const bestIndustry = useMemo(() => {
    if (!selectedLeaderData) {
      return {
        name: "N/A",
        count: 0
      };
    }

    const entries =
      Object.entries(
        selectedLeaderData.industries
      );

    if (!entries.length) {
      return {
        name: "N/A",
        count: 0
      };
    }

    entries.sort(
      (a, b) => b[1] - a[1]
    );

    return {
      name: entries[0][0],
      count: entries[0][1]
    };
  }, [selectedLeaderData]);


  /* ============================================================
     BEST CITY
     ============================================================ */

  const bestCity = useMemo(() => {
    if (!selectedLeaderData) {
      return {
        name: "N/A",
        count: 0
      };
    }

    const entries =
      Object.entries(
        selectedLeaderData.cities
      );

    if (!entries.length) {
      return {
        name: "N/A",
        count: 0
      };
    }

    entries.sort(
      (a, b) => b[1] - a[1]
    );

    return {
      name: entries[0][0],
      count: entries[0][1]
    };
  }, [selectedLeaderData]);


  /* ============================================================
     YEARLY REPORT
     ============================================================ */

  const yearlyReport = useMemo(() => {
    const report = {};

    modalRows.forEach((row) => {
      const year =
        getRowFinancialYear(
          row,
          getFinancialYearFromRow
        ) || "Unknown";

      if (!report[year]) {
        report[year] = {
          financialYear: year,
          clients: 0,
          totalBilling: 0,
          netAmount: 0,
          tlExpenditure: 0,
          grossProfit: 0
        };
      }

      report[year].clients += 1;


      let shouldCalculate = false;

      if (!selectedInfoStatus) {
        shouldCalculate =
          getInfoStatus(row) === "R";
      } else {
        shouldCalculate =
          getInfoStatus(row) ===
          selectedInfoStatus;
      }


      if (shouldCalculate) {
        const financial =
          applyFinancialRules(row);

        report[year].totalBilling +=
          financial.billing;

        report[year].netAmount +=
          financial.netAmount;

        report[year].tlExpenditure +=
          financial.tlExpenditure;

        report[year].grossProfit +=
          financial.netAmount -
          financial.tlExpenditure;
      }
    });


    return Object.values(report)
      .sort((a, b) =>
        b.financialYear.localeCompare(
          a.financialYear
        )
      );
  }, [
    modalRows,
    selectedInfoStatus,
    getFinancialYearFromRow
  ]);


  /* ============================================================
     MONTHLY REPORT
     ============================================================ */

  const monthlyReport = useMemo(() => {
    const report = FINANCIAL_MONTHS.map(
      (month) => ({
        month,
        clients: 0,
        totalBilling: 0,
        netAmount: 0,
        tlExpenditure: 0
      })
    );


    modalRows.forEach((row) => {
      const month =
        getFinancialMonth(row);

      const index =
        FINANCIAL_MONTHS.indexOf(month);

      if (index === -1) {
        return;
      }

      report[index].clients += 1;


      let shouldCalculate = false;

      if (!selectedInfoStatus) {
        shouldCalculate =
          getInfoStatus(row) === "R";
      } else {
        shouldCalculate =
          getInfoStatus(row) ===
          selectedInfoStatus;
      }


      if (shouldCalculate) {
        const financial =
          applyFinancialRules(row);

        report[index].totalBilling +=
          financial.billing;

        report[index].netAmount +=
          financial.netAmount;

        report[index].tlExpenditure +=
          financial.tlExpenditure;
      }
    });


    return report;
  }, [
    modalRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     OPEN MODAL
     ============================================================ */

  const openLeaderPerformance = (
    leader
  ) => {
    setSelectedLeader(leader);

    setSelectedFinancialYear(
      selectedTableFinancialYear || ""
    );
  };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const closeLeaderPerformance = () => {
    setSelectedLeader(null);
    setSelectedFinancialYear("");
  };


  /* ============================================================
     INITIALS
     ============================================================ */

  const getInitial = (name) => {
    if (!name) {
      return "?";
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  };


  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="team-leader-performance-page">
        <div className="team-leader-state">
          <div className="team-leader-loader"></div>
          <p>Loading Team Leader performance...</p>
        </div>
      </div>
    );
  }


  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <div className="team-leader-performance-page">
        <div className="team-leader-state team-leader-error">
          <h3>Unable to load data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="team-leader-performance-page">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="team-leader-page-header">
        <div>
          <div className="team-leader-page-eyebrow">
            PERFORMANCE REPORT
          </div>

          <h1>Team Leader Performance</h1>

          <p>
            Track client performance, billing,
            net amount and team leader
            expenditure.
          </p>
        </div>
      </div>


      {/* ======================================================
          TABLE CARD
          ====================================================== */}

      <div className="team-leader-table-card">

        {/* TABLE HEADER */}

        <div className="team-leader-table-header">

          <div>
            <h2>Team Leader Performance</h2>

            <span className="team-leader-member-count">
              {teamLeaderSummary.length} Team Leaders
            </span>
          </div>

        </div>


        {/* ====================================================
            FILTERS
            ==================================================== */}

        <div className="team-leader-performance-filters">

          <div className="team-leader-filter-group">
            <label>
              Financial Year
            </label>

            <select
              value={
                selectedTableFinancialYear
              }
              onChange={(event) =>
                setSelectedTableFinancialYear(
                  event.target.value
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


          <div className="team-leader-filter-group">
            <label>
              Info Status
            </label>

            <select
              value={selectedInfoStatus}
              onChange={(event) =>
                setSelectedInfoStatus(
                  event.target.value
                )
              }
            >
              {INFO_STATUSES.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                )
              )}
            </select>
          </div>


          <div className="team-leader-filter-result">
            <span>
              Showing
            </span>

            <strong>
              {filteredRows.length}
            </strong>

            <span>
              records
            </span>
          </div>

        </div>


        {/* ====================================================
            TABLE
            ==================================================== */}

        <div className="team-leader-table-wrapper">

          <table className="team-leader-performance-table">

            <thead>
              <tr>
                <th>Team Leader</th>
                <th>Client Count</th>
                <th>Total Billing</th>
                <th>Net Amount</th>
                <th>TL Expenditure</th>
                <th>Gross Profit</th>
                <th>Gross Margin</th>
                <th>Action</th>
              </tr>
            </thead>


            <tbody>

              {teamLeaderSummary.length === 0 ? (

                <tr>
                  <td
                    colSpan="8"
                    className="team-leader-no-data"
                  >
                    No Team Leader data found
                    for the selected filters.
                  </td>
                </tr>

              ) : (

                teamLeaderSummary.map(
                  (leader) => (
                    <tr key={leader.teamLeader}>

                      {/* TEAM LEADER */}

                      <td>
                        <div className="team-leader-name-cell">

                          <div className="team-leader-avatar">
                            {getInitial(
                              leader.teamLeader
                            )}
                          </div>

                          <div className="team-leader-name">
                            {leader.teamLeader}
                          </div>

                        </div>
                      </td>


                      {/* CLIENT COUNT */}

                      <td>
                        <span className="team-leader-client-count">
                          {leader.clientCount.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </td>


                      {/* BILLING */}

                      <td>
                        <span className="team-leader-billing-value">
                          {formatCurrency(
                            leader.totalBilling
                          )}
                        </span>
                      </td>


                      {/* NET */}

                      <td>
                        <span className="team-leader-net-value">
                          {formatCurrency(
                            leader.netAmount
                          )}
                        </span>
                      </td>


                      {/* EXPENDITURE */}

                      <td>
                        <span className="team-leader-expenditure-value">
                          {formatCurrency(
                            leader.tlExpenditure
                          )}
                        </span>
                      </td>


                      {/* GROSS PROFIT */}

                      <td>
                        <span className="team-leader-profit-value">
                          {formatCurrency(
                            leader.grossProfit
                          )}
                        </span>
                      </td>


                      {/* GROSS MARGIN */}

                      <td>
                        <span className="team-leader-margin-value">
                          {leader.grossMargin.toFixed(2)}%
                        </span>
                      </td>


                      {/* ACTION */}

                      <td>
                        <button
                          type="button"
                          className="team-leader-view-performance-btn"
                          onClick={() =>
                            openLeaderPerformance(
                              leader
                            )
                          }
                        >
                          View Performance
                          <span className="team-leader-btn-arrow">
                            →
                          </span>
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
            TABLE FOOTER
            ==================================================== */}

        <div className="team-leader-table-footer">

          <div>
            Total Team Leaders:
            <strong>
              {teamLeaderSummary.length}
            </strong>
          </div>

          <div>
            Total Clients:
            <strong>
              {overallTotals.clientCount.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <div>
            Total Billing:
            <strong>
              {formatCurrency(
                overallTotals.totalBilling
              )}
            </strong>
          </div>

        </div>

      </div>


      {/* ======================================================
          PERFORMANCE MODAL
          ====================================================== */}

      {selectedLeader && selectedLeaderData && (

        <div
          className="team-leader-performance-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeLeaderPerformance();
            }
          }}
        >

          <div className="team-leader-performance-modal">

            {/* ==================================================
                MODAL HEADER
                ================================================== */}

            <div className="team-leader-modal-header">

              <div>

                <div className="team-leader-modal-eyebrow">
                  TEAM LEADER PERFORMANCE
                </div>

                <h2>
                  {selectedLeader.teamLeader}
                </h2>

                <p>
                  Detailed performance report
                  and client analysis.
                </p>

              </div>


              <button
                type="button"
                className="team-leader-modal-close"
                onClick={
                  closeLeaderPerformance
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* ==================================================
                MODAL FILTER
                ================================================== */}

            <div className="team-leader-modal-filter-section">

              <div className="team-leader-modal-filter">

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


              <div className="team-leader-modal-filter-status">

                <span>
                  Info Status:
                </span>

                <strong>
                  {selectedInfoStatus ||
                    "All"}
                </strong>

              </div>

            </div>


            {/* ==================================================
                SUMMARY KPI CARDS
                ================================================== */}

            <div className="team-leader-summary-grid">

              <div className="team-leader-summary-card">
                <span>Clients</span>
                <strong>
                  {selectedLeaderData.clients.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>


              <div className="team-leader-summary-card">
                <span>Total Billing</span>
                <strong>
                  {formatCurrency(
                    selectedLeaderData.totalBilling
                  )}
                </strong>
              </div>


              <div className="team-leader-summary-card">
                <span>Net Amount</span>
                <strong className="team-leader-summary-net">
                  {formatCurrency(
                    selectedLeaderData.netAmount
                  )}
                </strong>
              </div>


              <div className="team-leader-summary-card">
                <span>TL Expenditure</span>
                <strong>
                  {formatCurrency(
                    selectedLeaderData.tlExpenditure
                  )}
                </strong>
              </div>


              <div className="team-leader-summary-card">
                <span>Gross Profit</span>
                <strong>
                  {formatCurrency(
                    selectedLeaderData.grossProfit
                  )}
                </strong>
              </div>


              <div className="team-leader-summary-card">
                <span>Gross Margin</span>
                <strong>
                  {selectedLeaderData.grossMargin.toFixed(
                    2
                  )}%
                </strong>
              </div>

            </div>


            {/* ==================================================
                BEST INDUSTRY / CITY
                ================================================== */}

            <div className="team-leader-best-grid">

              <div className="team-leader-best-card">

                <div className="team-leader-best-label">
                  TOP INDUSTRY
                </div>

                <h3>
                  {bestIndustry.name}
                </h3>

                <p>
                  {bestIndustry.count} clients
                </p>

              </div>


              <div className="team-leader-best-card">

                <div className="team-leader-best-label">
                  TOP CITY
                </div>

                <h3>
                  {bestCity.name}
                </h3>

                <p>
                  {bestCity.count} clients
                </p>

              </div>

            </div>


            {/* ==================================================
                YEARLY REPORT
                ================================================== */}

            <section className="team-leader-report-section">

              <div className="team-leader-section-header">

                <div>
                  <span className="team-leader-section-eyebrow">
                    YEARLY ANALYSIS
                  </span>

                  <h3>
                    Financial Year Report
                  </h3>
                </div>

              </div>


              <div className="team-leader-report-table-wrapper">

                <table className="team-leader-report-table">

                  <thead>
                    <tr>
                      <th>Financial Year</th>
                      <th>Clients</th>
                      <th>Total Billing</th>
                      <th>Net Amount</th>
                      <th>TL Expenditure</th>
                      <th>Gross Profit</th>
                    </tr>
                  </thead>

                  <tbody>

                    {yearlyReport.length === 0 ? (

                      <tr>
                        <td
                          colSpan="6"
                          className="team-leader-report-no-data"
                        >
                          No yearly data
                          available.
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
                              <strong>
                                {
                                  item.financialYear
                                }
                              </strong>
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

                            <td>
                              {formatCurrency(
                                item.grossProfit
                              )}
                            </td>

                          </tr>
                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>


            {/* ==================================================
                MONTHLY GRAPH
                ================================================== */}

            <section className="team-leader-report-section">

              <div className="team-leader-section-header">

                <div>
                  <span className="team-leader-section-eyebrow">
                    MONTHLY ANALYSIS
                  </span>

                  <h3>
                    Monthly Financial Performance
                  </h3>
                </div>

              </div>


              <div className="team-leader-chart-card">

                <ResponsiveContainer
                  width="100%"
                  height={350}
                >

                  <BarChart
                    data={monthlyReport}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
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

            </section>


            {/* ==================================================
                CLIENT DETAILS
                ================================================== */}

            <section className="team-leader-report-section">

              <div className="team-leader-section-header">

                <div>
                  <span className="team-leader-section-eyebrow">
                    CLIENT DATA
                  </span>

                  <h3>
                    Client Details
                  </h3>
                </div>

                <span className="team-leader-client-record-count">
                  {modalRows.length} Records
                </span>

              </div>


              <div className="team-leader-client-table-wrapper">

                <table className="team-leader-client-table">

                  <thead>
                    <tr>
                      <th>Info</th>
                      <th>Financial Year</th>
                      <th>Month</th>
                      <th>Industry</th>
                      <th>City</th>
                      <th>Billing</th>
                      <th>Net Amount</th>
                      <th>TL Expenditure</th>
                    </tr>
                  </thead>


                  <tbody>

                    {modalRows.length === 0 ? (

                      <tr>
                        <td
                          colSpan="8"
                          className="team-leader-report-no-data"
                        >
                          No client records
                          available.
                        </td>
                      </tr>

                    ) : (

                      modalRows.map(
                        (row, index) => {

                          const financial =
                            applyFinancialRules(
                              row
                            );

                          return (
                            <tr
                              key={
                                row.id ??
                                `${getTeamLeader(
                                  row
                                )}-${index}`
                              }
                            >

                              <td>
                                <span className="team-leader-info-badge">
                                  {getInfoStatus(
                                    row
                                  ) || "—"}
                                </span>
                              </td>

                              <td>
                                {getRowFinancialYear(
                                  row,
                                  getFinancialYearFromRow
                                ) || "—"}
                              </td>

                              <td>
                                {getFinancialMonth(
                                  row
                                ) || "—"}
                              </td>

                              <td>
                                {getIndustry(
                                  row
                                )}
                              </td>

                              <td>
                                {getCity(row)}
                              </td>

                              <td>
                                {formatCurrency(
                                  financial.billing
                                )}
                              </td>

                              <td>
                                {formatCurrency(
                                  financial.netAmount
                                )}
                              </td>

                              <td>
                                {formatCurrency(
                                  financial.tlExpenditure
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

            </section>


            {/* ==================================================
                MODAL FOOTER
                ================================================== */}

            <div className="team-leader-modal-footer">

              <div>
                <span>
                  Total Clients
                </span>

                <strong>
                  {selectedLeaderData.clients}
                </strong>
              </div>


              <div>
                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    selectedLeaderData.totalBilling
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Gross Profit
                </span>

                <strong>
                  {formatCurrency(
                    selectedLeaderData.grossProfit
                  )}
                </strong>
              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default TeamLeaderPerformance;
