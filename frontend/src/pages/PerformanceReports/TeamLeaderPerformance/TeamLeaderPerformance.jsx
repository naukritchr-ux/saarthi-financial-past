import React, { useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./TeamLeaderPerformance.css";


/* ============================================================
   FINANCIAL MONTHS
============================================================ */

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


/* ============================================================
   NUMBER HELPER
============================================================ */

function toNumber(value) {
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

  const cleanedValue = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleanedValue);

  return Number.isFinite(number) ? number : 0;
}


/* ============================================================
   CURRENCY FORMAT
============================================================ */

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(toNumber(value));
}


/* ============================================================
   TEXT HELPER
============================================================ */

function normalizeText(value) {
  return String(value ?? "").trim();
}


/* ============================================================
   TEAM LEADER
============================================================ */

function getTeamLeader(row) {
  return (
    normalizeText(
      row?.team_leader ??
      row?.["Team Leader"]
    ) || "Unknown"
  );
}


/* ============================================================
   INDUSTRY
============================================================ */

function getIndustry(row) {
  return (
    normalizeText(
      row?.industry ??
      row?.["Industry"]
    ) ||
    normalizeText(
      row?.["Sub Industry"]
    ) ||
    "Unknown"
  );
}


/* ============================================================
   CITY
============================================================ */

function getCity(row) {
  return (
    normalizeText(
      row?.city ??
      row?.["City"]
    ) || "Unknown"
  );
}


/* ============================================================
   INFO STATUS
============================================================ */

function getInfoStatus(row) {
  return String(
    row?.info ??
    row?.["Info"] ??
    ""
  )
    .trim()
    .toUpperCase();
}


/* ============================================================
   BILLING

   DATABASE:
   total_bill_amount

   FRONTEND:
   Total Bill Amount
============================================================ */

function getBilling(row) {
  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    row?.["Billing"] ??
    row?.["Total Billing"] ??
    row?.["Billing Amount"] ??
    0
  );
}


/* ============================================================
   FRANCHISEE SHARE

   DATABASE:
   franchisee_share

   FRONTEND:
   Franchisee Share
============================================================ */

function getFranchiseeShare(row) {
  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"] ??
    0
  );
}


/* ============================================================
   FINANCIAL CALCULATION

   EXACT SAME RULES AS FRANCHISE PERFORMANCE

   ALL:
     Billing = R + RV + C + CN
     Net Amount = Billing - Franchisee Share
     Expenditure = 5% of Billing

   R:
     Billing = R Billing
     Net Amount = R Billing - R Franchisee Share
     Expenditure = R Billing × 5%

   RV:
     Billing = RV Billing
     Net Amount = 0
     Expenditure = 0

   C:
     Billing = C Billing
     Net Amount = 0
     Expenditure = 0

   CN:
     Billing = CN Billing
     Net Amount = 0
     Expenditure = 0
============================================================ */

function getFinancialValues(
  row,
  infoFilter = ""
) {
  const info = getInfoStatus(row);

  const billing = getBilling(row);

  const franchiseeShare =
    getFranchiseeShare(row);


  /* ==========================================================
     ALL
  ========================================================== */

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {
    return {
      billing,

      netAmount:
        billing -
        franchiseeShare,

      tlExpenditure:
        billing * 0.05
    };
  }


  /* ==========================================================
     R
  ========================================================== */

  if (infoFilter === "R") {
    if (info !== "R") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,

      netAmount:
        billing -
        franchiseeShare,

      tlExpenditure:
        billing * 0.05
    };
  }


  /* ==========================================================
     RV
  ========================================================== */

  if (infoFilter === "RV") {
    if (info !== "RV") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      tlExpenditure: 0
    };
  }


  /* ==========================================================
     C
  ========================================================== */

  if (infoFilter === "C") {
    if (info !== "C") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      tlExpenditure: 0
    };
  }


  /* ==========================================================
     CN
  ========================================================== */

  if (infoFilter === "CN") {
    if (info !== "CN") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

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
}


/* ============================================================
   ACQUIRED DATE
============================================================ */

function getAcquiredDate(row) {
  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    row?.["Client Acquired Date"] ??
    row?.["Date Acquired"] ??
    row?.["Acquisition Date"] ??
    ""
  );
}


/* ============================================================
   DATE PARSER
============================================================ */

function parseDate(value) {
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
        Date.UTC(
          1899,
          11,
          30
        ) +
        serial * 86400000
      );

      return Number.isNaN(
        date.getTime()
      )
        ? null
        : date;
    }
  }


  /* DD/MM/YYYY or DD-MM-YYYY */

  const parts =
    text.split(/[\/\-]/);

  if (parts.length === 3) {
    let day =
      Number(parts[0]);

    let month =
      Number(parts[1]);

    let year =
      Number(parts[2]);

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

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return date;
      }
    }
  }


  const date =
    new Date(text);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}


/* ============================================================
   FINANCIAL YEAR
============================================================ */

function getRowFinancialYear(
  row,
  getFinancialYearFromRow
) {
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


  const date =
    parseDate(
      getAcquiredDate(row)
    );

  if (!date) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(
      year + 1
    ).slice(-2)}`;
  }

  return `${year - 1}-${String(
    year
  ).slice(-2)}`;
}


/* ============================================================
   FINANCIAL MONTH
============================================================ */

function getFinancialMonth(row) {
  const date =
    parseDate(
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
}


/* ============================================================
   CUSTOM TOOLTIP
============================================================ */

function TeamLeaderTooltip({
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
    <div className="team-leader-modern-tooltip">

      <div className="team-leader-tooltip-label">
        {label}
      </div>

      {payload.map(
        (item, index) => (
          <div
            className="team-leader-tooltip-row"
            key={index}
          >

            <span>
              {item.name}
            </span>

            <strong>
              {item.name === "Client Acquired"
                ? item.value
                : formatCurrency(
                    item.value
                  )}
            </strong>

          </div>
        )
      )}

    </div>
  );
}


/* ============================================================
   MAIN COMPONENT
============================================================ */

function TeamLeaderPerformance() {

  const {
    rows = [],
    getFinancialYearFromRow
  } = useData();


  /* ==========================================================
     STATES
  ========================================================== */

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
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  /* ==========================================================
     FINANCIAL YEARS
  ========================================================== */

  const financialYears =
    useMemo(() => {

      const years =
        new Set();

      rows.forEach(row => {

        const fy =
          getRowFinancialYear(
            row,
            getFinancialYearFromRow
          );

        if (fy) {
          years.add(fy);
        }

      });

      return Array.from(years)
        .sort((a, b) => {

          const yearA =
            Number(
              String(a).substring(
                0,
                4
              )
            );

          const yearB =
            Number(
              String(b).substring(
                0,
                4
              )
            );

          return yearB - yearA;
        });

    }, [
      rows,
      getFinancialYearFromRow
    ]);


  /* ==========================================================
     MAIN FILTERED ROWS
  ========================================================== */

  const filteredRows =
    useMemo(() => {

      return rows.filter(row => {

        const fy =
          getRowFinancialYear(
            row,
            getFinancialYearFromRow
          );

        const info =
          getInfoStatus(row);


        if (
          selectedTableFinancialYear &&
          fy !==
            selectedTableFinancialYear
        ) {
          return false;
        }


        if (
          selectedInfoStatus &&
          info !==
            selectedInfoStatus
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
     TEAM LEADER SUMMARY

     IMPORTANT:
     Uses Franchise financial rules.
  ========================================================== */

  const teamLeaderSummary =
    useMemo(() => {

      const grouped =
        new Map();


      filteredRows.forEach(row => {

        const leader =
          getTeamLeader(row);


        if (
          !grouped.has(leader)
        ) {

          grouped.set(
            leader,
            {
              teamLeader:
                leader,

              acquiredClients:
                0,

              totalBilling:
                0,

              netAmount:
                0,

              tlExpenditure:
                0,

              industries: {},

              cities: {}
            }
          );

        }


        const data =
          grouped.get(leader);


        /* Client count */

        data.acquiredClients += 1;


        /* Financial calculation */

        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        data.totalBilling +=
          financial.billing;

        data.netAmount +=
          financial.netAmount;

        data.tlExpenditure +=
          financial.tlExpenditure;


        /* Industry */

        const industry =
          getIndustry(row);

        data.industries[industry] =
          (
            data.industries[industry] ||
            0
          ) + 1;


        /* City */

        const city =
          getCity(row);

        data.cities[city] =
          (
            data.cities[city] ||
            0
          ) + 1;

      });


      return Array.from(
        grouped.values()
      )
        .map(leader => {

          const grossProfit =
            leader.netAmount -
            leader.tlExpenditure;

          const grossMargin =
            leader.netAmount !== 0
              ? (
                  grossProfit /
                  leader.netAmount
                ) * 100
              : 0;


          return {
            ...leader,

            grossProfit,

            grossMargin
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

  const overallTotals =
    useMemo(() => {

      let totalBilling = 0;
      let netAmount = 0;
      let tlExpenditure = 0;


      filteredRows.forEach(row => {

        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


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
      selectedInfoStatus
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
        row =>
          getTeamLeader(row) ===
          selectedLeader
      );

    }, [
      filteredRows,
      selectedLeader
    ]);


  /* ==========================================================
     MODAL LEADER ROWS
  ========================================================== */

  const modalLeaderRows =
    useMemo(() => {

      return selectedLeaderRows.filter(
        row => {

          const fy =
            getRowFinancialYear(
              row,
              getFinancialYearFromRow
            );


          if (
            selectedFinancialYear &&
            fy !==
              selectedFinancialYear
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
     MODAL PERFORMANCE SUMMARY
  ========================================================== */

  const modalLeaderData =
    useMemo(() => {

      if (!selectedLeader) {
        return null;
      }


      let totalBilling = 0;
      let netAmount = 0;
      let tlExpenditure = 0;

      const industries = {};
      const cities = {};


      modalLeaderRows.forEach(row => {

        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        totalBilling +=
          financial.billing;

        netAmount +=
          financial.netAmount;

        tlExpenditure +=
          financial.tlExpenditure;


        const industry =
          getIndustry(row);

        industries[industry] =
          (
            industries[industry] ||
            0
          ) + 1;


        const city =
          getCity(row);

        cities[city] =
          (
            cities[city] ||
            0
          ) + 1;

      });


      const grossProfit =
        netAmount -
        tlExpenditure;


      const grossMargin =
        netAmount !== 0
          ? (
              grossProfit /
              netAmount
            ) * 100
          : 0;


      return {

        clients:
          modalLeaderRows.length,

        totalBilling,

        netAmount,

        tlExpenditure,

        grossProfit,

        grossMargin,

        industries,

        cities

      };

    }, [
      modalLeaderRows,
      selectedInfoStatus,
      selectedLeader
    ]);


  /* ==========================================================
     BEST VALUE
  ========================================================== */

  const getBestValue =
    object => {

      const entries =
        Object.entries(
          object || {}
        );


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
     YEARLY REPORT
  ========================================================== */

  const yearlyReport =
    useMemo(() => {

      if (!selectedLeader) {
        return [];
      }


      const grouped = {};


      modalLeaderRows.forEach(row => {

        const fy =
          getRowFinancialYear(
            row,
            getFinancialYearFromRow
          );


        if (!fy) {
          return;
        }


        if (!grouped[fy]) {

          grouped[fy] = {

            financialYear:
              fy,

            clients:
              0,

            totalBilling:
              0,

            netAmount:
              0,

            tlExpenditure:
              0
          };

        }


        grouped[fy].clients += 1;


        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        grouped[fy].totalBilling +=
          financial.billing;

        grouped[fy].netAmount +=
          financial.netAmount;

        grouped[fy].tlExpenditure +=
          financial.tlExpenditure;

      });


      return Object.values(
        grouped
      ).sort(
        (a, b) => {

          const yearA =
            Number(
              String(
                a.financialYear
              ).substring(
                0,
                4
              )
            );

          const yearB =
            Number(
              String(
                b.financialYear
              ).substring(
                0,
                4
              )
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

  const monthlyReport =
    useMemo(() => {

      if (!selectedLeader) {
        return [];
      }


      const grouped = {};


      financialMonths.forEach(
        month => {

          grouped[month.full] = {

            month:
              month.full,

            monthShort:
              month.short,

            clients:
              0,

            totalBilling:
              0,

            netAmount:
              0,

            tlExpenditure:
              0
          };

        }
      );


      modalLeaderRows.forEach(row => {

        const month =
          getFinancialMonth(row);


        if (
          !month ||
          !grouped[month]
        ) {
          return;
        }


        grouped[month].clients += 1;


        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        grouped[month].totalBilling +=
          financial.billing;

        grouped[month].netAmount +=
          financial.netAmount;

        grouped[month].tlExpenditure +=
          financial.tlExpenditure;

      });


      return financialMonths.map(
        month =>
          grouped[month.full]
      );

    }, [
      modalLeaderRows,
      selectedInfoStatus,
      selectedLeader
    ]);


  /* ==========================================================
     CLIENT DETAILS
  ========================================================== */

  const clientDetails =
    useMemo(() => {

      if (!selectedLeader) {
        return [];
      }


      return modalLeaderRows.map(
        (row, index) => {

          const financial =
            getFinancialValues(
              row,
              selectedInfoStatus
            );


          return {

            id:
              index + 1,

            company:
              row?.["Company Name"] ||
              row?.company_name ||
              row?.["Company"] ||
              "Unknown",

            info:
              getInfoStatus(row),

            financialYear:
              getRowFinancialYear(
                row,
                getFinancialYearFromRow
              ),

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
     CLEAR FILTERS
  ========================================================== */

  const clearFilters = () => {

    setSelectedTableFinancialYear("");

    setSelectedInfoStatus("");

  };


  /* ==========================================================
     OPEN LEADER
  ========================================================== */

  const openLeader = leader => {

    setSelectedLeader(
      leader
    );

    setSelectedFinancialYear("");

  };


  /* ==========================================================
     CLOSE LEADER
  ========================================================== */

  const closeLeader = () => {

    setSelectedLeader("");

    setSelectedFinancialYear("");

  };


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <div className="team-leader-performance-page">


      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="team-leader-page-header">

        <div>

          <div className="team-leader-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            Team Leader Performance
          </h1>

          <p>
            Monitor Team Leader acquisition,
            billing and financial performance.
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN TABLE CARD
      ====================================================== */}

      <div className="team-leader-table-card">


        <div className="team-leader-table-header">

          <div>

            <h2>
              Team Leader Performance
            </h2>

            <p>
              Complete Team Leader-wise
              performance overview
            </p>

          </div>


          <div className="team-leader-member-count">

            {teamLeaderSummary.length}

            <span>
              Team Leaders
            </span>

          </div>

        </div>


        {/* ====================================================
            FILTERS
        ==================================================== */}

        <div className="team-leader-report-controls team-leader-main-filters">

          <div>

            <label>
              Financial Year
            </label>

            <select
              value={
                selectedTableFinancialYear
              }
              onChange={e =>
                setSelectedTableFinancialYear(
                  e.target.value
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
                    {year}
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label>
              Info Status
            </label>

            <select
              value={
                selectedInfoStatus
              }
              onChange={e =>
                setSelectedInfoStatus(
                  e.target.value
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


          <div className="team-leader-filter-result">

            <span>
              Showing
            </span>

            <strong>
              {filteredRows.length.toLocaleString(
                "en-IN"
              )}
            </strong>

            <span>
              records
            </span>

          </div>


          {(selectedTableFinancialYear ||
            selectedInfoStatus) && (

            <button
              type="button"
              className="team-leader-clear-btn"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          )}

        </div>


        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="team-leader-table-wrapper">

          <table className="team-leader-table">

            <thead>

              <tr>

                <th>
                  Team Leader
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
                  Gross Profit
                </th>

                <th>
                  Gross Margin
                </th>

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {teamLeaderSummary.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="team-leader-empty"
                  >
                    No Team Leader data available.
                  </td>

                </tr>

              ) : (

                teamLeaderSummary.map(
                  leader => {

                    const initials =
                      leader.teamLeader
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(
                          word =>
                            word[0]
                        )
                        .join("")
                        .toUpperCase();


                    return (

                      <tr
                        key={
                          leader.teamLeader
                        }
                      >

                        <td>

                          <div className="team-leader-name">

                            <div className="team-leader-avatar">

                              {initials || "TL"}

                            </div>

                            <span>
                              {leader.teamLeader}
                            </span>

                          </div>

                        </td>


                        <td>

                          <span className="team-leader-client-count">

                            {leader.acquiredClients.toLocaleString(
                              "en-IN"
                            )}

                          </span>

                        </td>


                        <td>

                          <span className="team-leader-billing-value">

                            {formatCurrency(
                              leader.totalBilling
                            )}

                          </span>

                        </td>


                        <td>

                          <span className="team-leader-net-value">

                            {formatCurrency(
                              leader.netAmount
                            )}

                          </span>

                        </td>


                        <td>

                          <span className="team-leader-expenditure-value">

                            {formatCurrency(
                              leader.tlExpenditure
                            )}

                          </span>

                        </td>


                        <td>

                          <span className="team-leader-profit-value">

                            {formatCurrency(
                              leader.grossProfit
                            )}

                          </span>

                        </td>


                        <td>

                          <span className="team-leader-margin-value">

                            {leader.grossMargin.toFixed(
                              2
                            )}
                            %

                          </span>

                        </td>


                        <td>

                          <button
                            type="button"
                            className="team-leader-view-performance-btn"
                            onClick={() =>
                              openLeader(
                                leader.teamLeader
                              )
                            }
                          >

                            View

                            <span className="team-leader-btn-arrow">
                              →
                            </span>

                          </button>

                        </td>

                      </tr>

                    );

                  }
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
                    {overallTotals.grossMargin.toFixed(
                      2
                    )}
                    %
                  </th>

                  <th />

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </div>


      {/* ======================================================
          PERFORMANCE MODAL
      ====================================================== */}

      {selectedLeader &&
        modalLeaderData && (

        <div
          className="team-leader-performance-overlay"
          onClick={
            closeLeader
          }
        >

          <div
            className="team-leader-performance-modal"
            onClick={e =>
              e.stopPropagation()
            }
          >


            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="team-leader-modal-header">

              <div>

                <div className="team-leader-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>
                  {selectedLeader}
                </h2>

                <p>
                  Team Leader performance
                  analysis and financial trends.
                </p>

              </div>


              <button
                type="button"
                className="team-leader-modal-close"
                onClick={
                  closeLeader
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="team-leader-summary-grid">


              <div className="team-leader-summary-card">

                <span>
                  Clients
                </span>

                <strong>
                  {modalLeaderData.clients.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div className="team-leader-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.totalBilling
                  )}
                </strong>

              </div>


              <div className="team-leader-summary-card team-leader-summary-net">

                <span>
                  Net Amount
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.netAmount
                  )}
                </strong>

              </div>


              <div className="team-leader-summary-card">

                <span>
                  TL Expenditure
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.tlExpenditure
                  )}
                </strong>

                <small>
                  5% of Total Billing
                </small>

              </div>


              <div className="team-leader-summary-card">

                <span>
                  Gross Profit
                </span>

                <strong>
                  {formatCurrency(
                    modalLeaderData.grossProfit
                  )}
                </strong>

              </div>


              <div className="team-leader-summary-card">

                <span>
                  Gross Margin
                </span>

                <strong>
                  {modalLeaderData.grossMargin.toFixed(
                    2
                  )}
                  %
                </strong>

              </div>

            </div>


            {/* =================================================
                BEST INDUSTRY / CITY
            ================================================= */}

            <div className="team-leader-best-grid">

              <div className="team-leader-best-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {getBestValue(
                    modalLeaderData.industries
                  )}
                </strong>

              </div>


              <div className="team-leader-best-card">

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
                REPORT CONTROLS
            ================================================= */}

            <div className="team-leader-report-controls">

              <div>

                <label
                  htmlFor="teamLeaderModalFinancialYear"
                >
                  Financial Year
                </label>

                <select
                  id="teamLeaderModalFinancialYear"
                  value={
                    selectedFinancialYear
                  }
                  onChange={e =>
                    setSelectedFinancialYear(
                      e.target.value
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
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div>

                <label>
                  Info Status
                </label>

                <select
                  value={
                    selectedInfoStatus
                  }
                  onChange={e =>
                    setSelectedInfoStatus(
                      e.target.value
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


              <div className="team-leader-report-period">

                <span>
                  Report Period
                </span>

                <strong>
                  {selectedFinancialYear
                    ? selectedFinancialYear
                    : "Yearly"}
                </strong>

              </div>

            </div>


            {/* =================================================
                YEARLY REPORT
            ================================================= */}

            <div className="team-leader-report-section">

              <div className="team-leader-section-header">

                <div>

                  <span>
                    PERFORMANCE REPORT
                  </span>

                  <h3>
                    Yearly Report
                  </h3>

                </div>

              </div>


              <div className="team-leader-report-table-wrapper">

                <table className="team-leader-report-table">

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
                          className="team-leader-no-data"
                        >
                          No yearly data found.
                        </td>

                      </tr>

                    ) : (

                      yearlyReport.map(
                        item => (

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
                MONTHLY GRAPH
            ================================================= */}

            <div className="team-leader-report-section">

              <div className="team-leader-section-header">

                <div>

                  <span>
                    FINANCIAL TREND
                  </span>

                  <h3>
                    Monthly Report
                  </h3>

                </div>

              </div>


              <div className="team-leader-chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={350}
                >

                  <BarChart
                    data={
                      monthlyReport
                    }
                    margin={{
                      top: 15,
                      right: 20,
                      left: 10,
                      bottom: 10
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="monthShort"
                    />

                    <YAxis
                      tickFormatter={value =>
                        `₹${(
                          value / 100000
                        ).toFixed(0)}L`
                      }
                    />

                    <Tooltip
                      content={
                        <TeamLeaderTooltip />
                      }
                    />


                    <Bar
                      dataKey="totalBilling"
                      name="Total Billing"
                      fill="#26734D"
                      radius={[
                        6,
                        6,
                        0,
                        0
                      ]}
                    />

                    <Bar
                      dataKey="netAmount"
                      name="Net Amount"
                      fill="#B78A34"
                      radius={[
                        6,
                        6,
                        0,
                        0
                      ]}
                    />

                    <Bar
                      dataKey="tlExpenditure"
                      name="TL Expenditure"
                      fill="#9B5C5C"
                      radius={[
                        6,
                        6,
                        0,
                        0
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* =================================================
                CLIENT DETAILS
            ================================================= */}

            <div className="team-leader-report-section">

              <div className="team-leader-section-header">

                <div>

                  <span>
                    CLIENT DATA
                  </span>

                  <h3>
                    Client Details
                  </h3>

                </div>

              </div>


              <div className="team-leader-report-table-wrapper">

                <table className="team-leader-report-table">

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
                          className="team-leader-no-data"
                        >
                          No client details found.
                        </td>

                      </tr>

                    ) : (

                      clientDetails.map(
                        client => (

                          <tr
                            key={
                              client.id
                            }
                          >

                            <td>
                              {client.id}
                            </td>

                            <td>
                              {client.company}
                            </td>

                            <td>

                              <span
                                className={`team-leader-info-status info-${client.info.toLowerCase()}`}
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


            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="team-leader-modal-footer">

              <span>
                Team Leader Performance Report
              </span>

              <button
                type="button"
                onClick={
                  closeLeader
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


export default TeamLeaderPerformance;
