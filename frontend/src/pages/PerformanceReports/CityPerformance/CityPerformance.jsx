import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./CityPerformance.css";

/* =========================================================
   FINANCIAL YEAR MONTHS
========================================================= */

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

/* =========================================================
   NUMBER HELPERS
========================================================= */

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

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£%]/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(toNumber(value));
}

/* =========================================================
   FIELD GETTERS
========================================================= */

function getCity(row) {
  return String(
    row?.city ??
      row?.["City"] ??
      ""
  ).trim();
}

function getCompanyName(row) {
  return String(
    row?.company_name ??
      row?.["Company Name"] ??
      row?.company ??
      row?.["Company"] ??
      row?.client_name ??
      row?.["Client Name"] ??
      row?.tann ??
      row?.["TANN"] ??
      ""
  )
    .trim()
    .toLowerCase();
}

function getTeamLeader(row) {
  return String(
    row?.team_leader ??
      row?.["Team Leader"] ??
      ""
  ).trim();
}

function getIndustry(row) {
  return String(
    row?.industry ??
      row?.["Industry"] ??
      ""
  ).trim();
}

function getFranchiseName(row) {
  return String(
    row?.franchise_name ??
      row?.["Franchise Name"] ??
      row?.franchise ??
      row?.["Franchise"] ??
      ""
  ).trim();
}

function getInfoStatus(row) {
  return String(
    row?.info ??
      row?.["Info"] ??
      ""
  )
    .trim()
    .toUpperCase();
}

function getBilling(row) {
  return toNumber(
    row?.total_bill_amount ??
      row?.["Total Bill Amount"] ??
      row?.["Billing"] ??
      row?.["Total Billing"] ??
      row?.["Billing Amount"] ??
      row?.["TANN/TDS"] ??
      0
  );
}

function getFranchiseeShare(row) {
  return toNumber(
    row?.franchisee_share ??
      row?.["Franchisee Share"] ??
      row?.["Franchise Cost"] ??
      row?.["Franchisee Cost"] ??
      row?.["Franchise Cost Amount"] ??
      0
  );
}

function getTLExpenditure(row, percentage) {
  const billing = getBilling(row);

  if (
    percentage === null ||
    percentage === undefined ||
    percentage === ""
  ) {
    return 0;
  }

  const rate = Number(percentage);

  if (
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    return 0;
  }

  return billing * (rate / 100);
}

function getClientAcquiredDate(row) {
  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    ""
  );
}

/* =========================================================
   FINANCIAL YEAR
========================================================= */

function getFinancialYear(row) {
  const dateValue = getClientAcquiredDate(row);

  if (dateValue) {
    const date = new Date(dateValue);

    if (!Number.isNaN(date.getTime())) {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (month >= 4) {
        return `${year}-${String(
          year + 1
        ).slice(-2)}`;
      }

      return `${year - 1}-${String(
        year
      ).slice(-2)}`;
    }
  }

  const acquiredYear =
    row?.acquired_year ??
    row?.["Aquired Year"] ??
    row?.["Acquired Year"];

  if (
    acquiredYear !== undefined &&
    acquiredYear !== null &&
    acquiredYear !== ""
  ) {
    const year = Number(acquiredYear);

    if (
      Number.isFinite(year) &&
      year > 1900
    ) {
      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
    }
  }

  return "";
}

/* =========================================================
   MONTH
========================================================= */

function getMonth(row) {
  const dateValue =
    getClientAcquiredDate(row);

  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.getMonth() + 1;
}

/* =========================================================
   FINANCIAL VALUES
========================================================= */

function getFinancialValues(
  row,
  infoFilter = "",
  expenditurePercentage
) {
  const info = getInfoStatus(row);
  const billing = getBilling(row);
  const franchiseeShare =
    getFranchiseeShare(row);

  /* =======================================================
     ALL
  ======================================================= */

  if (!infoFilter) {
    return {
      billing,
      netAmount:
        billing - franchiseeShare,
      tlExpenditure:
        getTLExpenditure(
          row,
          expenditurePercentage
        )
    };
  }

  /* =======================================================
     R
  ======================================================= */

  if (infoFilter === "R") {
    return {
      billing,
      netAmount:
        billing - franchiseeShare,
      tlExpenditure:
        getTLExpenditure(
          row,
          expenditurePercentage
        )
    };
  }

  /* =======================================================
     RV
  ======================================================= */

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

  /* =======================================================
     C
  ======================================================= */

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

  /* =======================================================
     CN
  ======================================================= */

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

/* =========================================================
   TOOLTIP
========================================================= */

function CityTooltip({
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
    <div className="city-modern-tooltip">

      <div className="city-tooltip-label">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          className="city-tooltip-row"
          key={index}
        >
          <span>
            {item.name}
          </span>

          <strong>
            {item.name ===
            "Total Billing"
              ? formatCurrency(
                  item.value
                )
              : item.value}
          </strong>
        </div>
      ))}

    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CityPerformance() {
  const { rows = [] } = useData();

  const [
    selectedCity,
    setSelectedCity
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");

  const [
    cityExpenditurePercentage,
    setCityExpenditurePercentage
  ] = useState("");

  /* =========================================================
     EXPENDITURE CHECK
  ========================================================= */

  const hasCityExpenditurePercentage =
    cityExpenditurePercentage !== "" &&
    Number.isFinite(
      Number(cityExpenditurePercentage)
    ) &&
    Number(cityExpenditurePercentage) >= 0;

  /* =========================================================
     FINANCIAL YEARS
  ========================================================= */

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach((row) => {
      const financialYear =
        getFinancialYear(row);

      if (financialYear) {
        years.add(financialYear);
      }
    });

    return Array.from(years).sort(
      (a, b) => {
        const yearA = Number(
          a.split("-")[0]
        );

        const yearB = Number(
          b.split("-")[0]
        );

        return yearA - yearB;
      }
    );
  }, [rows]);

  /* =========================================================
     CITY DATA

     - enquiries = enquiry rows
     - clients = UNIQUE company names
     - FY filter applies
     - Info filter applies
  ========================================================= */

  const cityData = useMemo(() => {
    const grouped = new Map();

    rows.forEach((row) => {
      const city = getCity(row);

      if (!city) {
        return;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return;
      }

      if (
        selectedInfoStatus &&
        getInfoStatus(row) !==
          selectedInfoStatus
      ) {
        return;
      }

      if (!grouped.has(city)) {
        grouped.set(city, {
          city,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          tlExpenditure: 0
        });
      }

      const item =
        grouped.get(city);

      /* =====================================================
         TOTAL ENQUIRIES
      ===================================================== */

      item.enquiries += 1;

      /* =====================================================
         UNIQUE ACQUIRED CLIENT
      ===================================================== */

      const companyName =
        getCompanyName(row);

      if (companyName) {
        item.clients.add(
          companyName
        );
      }

      /* =====================================================
         UNIQUE FRANCHISEE
      ===================================================== */

      const franchiseName =
        getFranchiseName(row);

      if (franchiseName) {
        item.franchisees.add(
          franchiseName
        );
      }

      /* =====================================================
         FINANCIAL VALUES
      ===================================================== */

      const financialValues =
        getFinancialValues(
          row,
          selectedInfoStatus,
          cityExpenditurePercentage
        );

      item.billing +=
        financialValues.billing;

      item.netAmount +=
        financialValues.netAmount;

      item.tlExpenditure +=
        financialValues.tlExpenditure;
    });

    return Array.from(
      grouped.values()
    )
      .map((item) => ({
        ...item,
        clients:
          item.clients.size,
        franchisees:
          item.franchisees.size
      }))
      .filter(
        (item) =>
          item.enquiries > 0
      )
      .sort((a, b) => {
        if (
          b.clients !==
          a.clients
        ) {
          return (
            b.clients -
            a.clients
          );
        }

        return (
          b.enquiries -
          a.enquiries
        );
      });
  }, [
    rows,
    selectedFinancialYear,
    selectedInfoStatus,
    cityExpenditurePercentage
  ]);

  /* =========================================================
     SELECTED CITY ROWS
  ========================================================= */

  const selectedRows = useMemo(() => {
    if (!selectedCity) {
      return [];
    }

    return rows.filter((row) => {

      if (
        getCity(row) !==
        selectedCity
      ) {
        return false;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return false;
      }

      if (
        selectedInfoStatus &&
        getInfoStatus(row) !==
          selectedInfoStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    selectedCity,
    selectedFinancialYear,
    selectedInfoStatus
  ]);

  /* =========================================================
     PERFORMANCE SUMMARY
  ========================================================= */

  const performanceSummary =
    useMemo(() => {
      const companies = new Set();

      let enquiries = 0;
      let totalBilling = 0;
      let totalFranchiseeShare = 0;
      let totalTLExpenditure = 0;
      let netAmount = 0;

      selectedRows.forEach((row) => {

        enquiries += 1;

        /* ===================================================
           UNIQUE ACQUIRED CLIENT
        =================================================== */

        const companyName =
          getCompanyName(row);

        if (companyName) {
          companies.add(
            companyName
          );
        }

        /* ===================================================
           FINANCIAL VALUES
        =================================================== */

        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus,
            cityExpenditurePercentage
          );

        totalBilling +=
          financialValues.billing;

        netAmount +=
          financialValues.netAmount;

        totalTLExpenditure +=
          financialValues.tlExpenditure;

        /* ===================================================
           FRANCHISEE SHARE
        =================================================== */

        if (
          !selectedInfoStatus ||
          selectedInfoStatus === "R"
        ) {
          totalFranchiseeShare +=
            getFranchiseeShare(row);
        }
      });

      const acquiredClients =
        companies.size;

      const grossProfit =
        netAmount -
        totalTLExpenditure;

      const grossMargin =
        netAmount !== 0
          ? (grossProfit /
              netAmount) *
            100
          : 0;

      return {
        acquiredClients,
        enquiries,
        totalBilling,
        totalFranchiseeShare,
        totalTLExpenditure,
        netAmount,
        grossProfit,
        grossMargin
      };
    }, [
      selectedRows,
      selectedInfoStatus,
      cityExpenditurePercentage
    ]);

  /* =========================================================
     BEST INDUSTRY
  ========================================================= */

  const bestIndustry =
    useMemo(() => {
      const counts = new Map();

      selectedRows.forEach((row) => {
        const industry =
          getIndustry(row);

        if (!industry) {
          return;
        }

        counts.set(
          industry,
          (counts.get(industry) ||
            0) + 1
        );
      });

      let best = "—";
      let highest = 0;

      counts.forEach(
        (count, industry) => {
          if (count > highest) {
            highest = count;
            best = industry;
          }
        }
      );

      return best;
    }, [selectedRows]);

  /* =========================================================
     BEST CITY
  ========================================================= */

  const bestCity = useMemo(() => {
    const counts = new Map();

    selectedRows.forEach((row) => {
      const city = getCity(row);

      if (!city) {
        return;
      }

      counts.set(
        city,
        (counts.get(city) || 0) +
          1
      );
    });

    let best = "—";
    let highest = 0;

    counts.forEach(
      (count, city) => {
        if (count > highest) {
          highest = count;
          best = city;
        }
      }
    );

    return best;
  }, [selectedRows]);

  /* =========================================================
     FRANCHISEE
  ========================================================= */

  const franchiseeCount =
    useMemo(() => {
      const franchisees =
        new Set();

      selectedRows.forEach(
        (row) => {
          const franchiseName =
            getFranchiseName(row);

          if (franchiseName) {
            franchisees.add(
              franchiseName
            );
          }
        }
      );

      return franchisees.size;
    }, [selectedRows]);

  /* =========================================================
     YEARLY REPORT

     Client Acquired = UNIQUE COMPANY
     Billing = filtered billing
  ========================================================= */

  const yearlyReportData =
    useMemo(() => {
      const yearlyMap = new Map();

      selectedRows.forEach((row) => {
        const year =
          getFinancialYear(row);

        if (!year) {
          return;
        }

        if (
          !yearlyMap.has(year)
        ) {
          yearlyMap.set(year, {
            year,
            clients: new Set(),
            billing: 0
          });
        }

        const item =
          yearlyMap.get(year);

        const companyName =
          getCompanyName(row);

        if (companyName) {
          item.clients.add(
            companyName
          );
        }

        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus,
            cityExpenditurePercentage
          );

        item.billing +=
          financialValues.billing;
      });

      return Array.from(
        yearlyMap.values()
      )
        .map((item) => ({
          year: item.year,
          clients:
            item.clients.size,
          billing: item.billing
        }))
        .sort((a, b) => {
          const yearA = Number(
            a.year.split("-")[0]
          );

          const yearB = Number(
            b.year.split("-")[0]
          );

          return yearA - yearB;
        });
    }, [
      selectedRows,
      selectedInfoStatus,
      cityExpenditurePercentage
    ]);

  /* =========================================================
     MONTHLY REPORT

     Financial Year:
     April → March
  ========================================================= */

  const monthlyReportData =
    useMemo(() => {
      if (!selectedFinancialYear) {
        return [];
      }

      /*
       * IMPORTANT:
       *
       * getMonth() returns normal calendar
       * month numbers:
       *
       * January   = 1
       * February  = 2
       * March     = 3
       * April     = 4
       * ...
       * December  = 12
       *
       * Financial year order is:
       *
       * April → May → ... → December
       * → January → February → March
       */

      const financialMonthNumbers = [
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        1,
        2,
        3
      ];

      const monthMap = new Map();

      financialMonths.forEach(
        (month, index) => {
          const calendarMonth =
            financialMonthNumbers[index];

          monthMap.set(
            calendarMonth,
            {
              month: month.full,
              monthShort:
                month.short,
              clients: new Set(),
              billing: 0
            }
          );
        }
      );

      selectedRows.forEach((row) => {
        const month =
          getMonth(row);

        if (
          !monthMap.has(month)
        ) {
          return;
        }

        const item =
          monthMap.get(month);

        /* ===============================================
           UNIQUE COMPANY
        =============================================== */

        const companyName =
          getCompanyName(row);

        if (companyName) {
          item.clients.add(
            companyName
          );
        }

        /* ===============================================
           FILTERED BILLING
        =============================================== */

        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus,
            cityExpenditurePercentage
          );

        item.billing +=
          financialValues.billing;
      });

      /*
       * Return strictly in Financial Year order:
       * April → March
       */

      return financialMonths.map(
        (month, index) => {
          const calendarMonth =
            financialMonthNumbers[index];

          const item =
            monthMap.get(
              calendarMonth
            );

          return {
            month: item.month,
            monthShort:
              item.monthShort,
            clients:
              item.clients.size,
            billing:
              item.billing
          };
        }
      );
    }, [
      selectedRows,
      selectedFinancialYear,
      selectedInfoStatus,
      cityExpenditurePercentage
    ]);

  /* =========================================================
     ACTIVE REPORT DATA
  ========================================================= */

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;

  /* =========================================================
     HANDLERS
  ========================================================= */

  function handleViewPerformance(city) {
    setSelectedCity(city);

    /*
     * Existing behavior preserved:
     * opening a city starts with yearly report
     * and all info statuses.
     */
    setSelectedFinancialYear("");
    setSelectedInfoStatus("");
  }

  function handleClosePerformance() {
    setSelectedCity("");
    setSelectedFinancialYear("");
    setSelectedInfoStatus("");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="city-performance-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="city-page-header">

        <div className="city-page-eyebrow">
          PERFORMANCE
        </div>

        <h1>
          City Performance
        </h1>

        <p>
          Analyse acquired clients,
          enquiries, billing and
          profitability by city.
        </p>

      </div>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <div className="city-table-card">

        <div className="city-table-header">

          <div>
            <h2>
              City Performance
            </h2>

            <p>
              City-wise performance
              overview
            </p>
          </div>

          <div className="city-member-count">

            <strong>
              {cityData.length}
            </strong>

            <span>
              Cities
            </span>

          </div>

        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div className="city-performance-filters">

          <div className="city-filter-group">

            <label htmlFor="city-financial-year">
              Financial Year
            </label>

            <select
              id="city-financial-year"
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
                    FY {year}
                  </option>
                )
              )}

            </select>

          </div>

          <div className="city-filter-group">

            <label htmlFor="city-info-status">
              Info Status
            </label>

            <select
              id="city-info-status"
              value={
                selectedInfoStatus
              }
              onChange={(event) =>
                setSelectedInfoStatus(
                  event.target.value
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

          <div className="city-filter-group">

            <label htmlFor="city-expenditure-percentage">
              TL Expenditure %
            </label>

            <input
              id="city-expenditure-percentage"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 5"
              value={
                cityExpenditurePercentage
              }
              onChange={(event) =>
                setCityExpenditurePercentage(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {/* ===================================================
            PERFORMANCE TABLE
        =================================================== */}

        <div className="city-table-wrapper">

          <table className="city-performance-table">

            <thead>

              <tr>

                <th>
                  City
                </th>

                <th>
                  Total Acquired Client
                </th>

                <th>
                  Total Enquiries
                </th>

                <th>
                  No. of Franchisee
                </th>

                <th>
                  Total Billing
                </th>

                <th>
                  Net Amount
                </th>

                {hasCityExpenditurePercentage && (
                  <th>
                    TL Expenditure
                  </th>
                )}

                <th>
                  Performance
                </th>

              </tr>

            </thead>

            <tbody>

              {cityData.length > 0 ? (

                cityData.map(
                  (item) => (
                    <tr
                      key={item.city}
                    >

                      <td>

                        <div className="city-name">

                          <div className="city-avatar">
                            {item.city
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span>
                            {item.city}
                          </span>

                        </div>

                      </td>

                      <td>

                        <span className="city-client-count">
                          {item.clients}
                        </span>

                      </td>

                      <td>
                        {item.enquiries}
                      </td>

                      <td>
                        {item.franchisees}
                      </td>

                      <td>

                        <span className="city-billing-value">
                          {formatCurrency(
                            item.billing
                          )}
                        </span>

                      </td>

                      <td>

                        <span className="city-net-value">
                          {formatCurrency(
                            item.netAmount
                          )}
                        </span>

                      </td>

                      {hasCityExpenditurePercentage && (
                        <td>

                          <span className="city-expenditure-value">
                            {formatCurrency(
                              item.tlExpenditure
                            )}
                          </span>

                        </td>
                      )}

                      <td>

                        <button
                          type="button"
                          className="city-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              item.city
                            )
                          }
                        >

                          View Performance

                          <span className="city-view-arrow">
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
                    colSpan={
                      hasCityExpenditurePercentage
                        ? 8
                        : 7
                    }
                    className="city-empty"
                  >
                    No city performance
                    data available.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          PERFORMANCE MODAL
      ===================================================== */}

      {selectedCity && (

        <div
          className="city-performance-overlay"
          onClick={
            handleClosePerformance
          }
        >

          <div
            className="city-performance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="city-modal-header">

              <div>

                <div className="city-modal-eyebrow">
                  CITY PERFORMANCE
                </div>

                <h2>
                  {selectedCity}
                </h2>

                <p>
                  Detailed performance
                  report
                </p>

              </div>

              <button
                type="button"
                className="city-modal-close"
                onClick={
                  handleClosePerformance
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="city-summary-grid">

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Best Industry
                </span>

                <strong className="city-summary-text">
                  {bestIndustry}
                </strong>

              </div>

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Best City
                </span>

                <strong className="city-summary-text">
                  {bestCity}
                </strong>

              </div>

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Franchisee
                </span>

                <strong className="city-summary-value">
                  {franchiseeCount}
                </strong>

              </div>

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Total Billing
                </span>

                <strong className="city-summary-value">
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </strong>

              </div>

              {hasCityExpenditurePercentage && (

                <div className="city-summary-card">

                  <span className="city-summary-label">
                    TL Expenditure
                  </span>

                  <strong className="city-summary-value">
                    {formatCurrency(
                      performanceSummary.totalTLExpenditure
                    )}
                  </strong>

                </div>

              )}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Net Amount
                </span>

                <strong className="city-summary-value city-summary-net">
                  {formatCurrency(
                    performanceSummary.netAmount
                  )}
                </strong>

              </div>

            </div>

            {/* =================================================
                REPORT CONTROLS
            ================================================= */}

            <div className="city-report-controls">

              <div className="city-report-period">

                <label htmlFor="city-report-year">
                  Report Period
                </label>

                <select
                  id="city-report-year"
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
                    Yearly Report
                  </option>

                  {financialYears.map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        FY {year} - Monthly
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="city-report-period">

                <label htmlFor="city-report-info">
                  Info Status
                </label>

                <select
                  id="city-report-info"
                  value={
                    selectedInfoStatus
                  }
                  onChange={(event) =>
                    setSelectedInfoStatus(
                      event.target.value
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

            {/* =================================================
                REPORT GRAPHS
            ================================================= */}

            <div className="city-report-graphs">

              {/* ===============================================
                  CLIENT ACQUIRED CHART
              =============================================== */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>

                    <h3>
                      Client Acquired
                    </h3>

                    <p>
                      Unique companies
                      acquired
                    </p>

                  </div>

                  <div className="city-chart-indicator city-client-indicator">
                    Unique
                  </div>

                </div>

                {/* IMPORTANT:
                    Explicit height prevents
                    ResponsiveContainer from
                    rendering at 0px height.
                */}

                <div
                  className="city-chart-container"
                  style={{
                    width: "100%",
                    height: "320px",
                    minHeight: "320px"
                  }}
                >

                  {reportData.length > 0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={reportData}
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
                          dataKey={
                            selectedFinancialYear
                              ? "monthShort"
                              : "year"
                          }
                          tick={{
                            fontSize: 12
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 12
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={
                            <CityTooltip />
                          }
                        />

                        <Bar
                          dataKey="clients"
                          name="Client Acquired"
                          fill="#B78A34"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                          barSize={32}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="city-no-chart-data">
                      No client acquisition
                      data available.
                    </div>

                  )}

                </div>

              </div>

              {/* ===============================================
                  BILLING CHART
              =============================================== */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>

                    <h3>
                      Total Billing
                    </h3>

                    <p>
                      Billing performance
                    </p>

                  </div>

                  <div className="city-chart-indicator city-billing-indicator">
                    Billing
                  </div>

                </div>

                {/* IMPORTANT:
                    Explicit height prevents
                    ResponsiveContainer from
                    rendering at 0px height.
                */}

                <div
                  className="city-chart-container"
                  style={{
                    width: "100%",
                    height: "320px",
                    minHeight: "320px"
                  }}
                >

                  {reportData.length > 0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={reportData}
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
                          dataKey={
                            selectedFinancialYear
                              ? "monthShort"
                              : "year"
                          }
                          tick={{
                            fontSize: 12
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 12
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            `₹${(
                              Number(value) /
                              100000
                            ).toFixed(0)}L`
                          }
                        />

                        <Tooltip
                          content={
                            <CityTooltip />
                          }
                        />

                        <Bar
                          dataKey="billing"
                          name="Total Billing"
                          fill="#26734D"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                          barSize={32}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="city-no-chart-data">
                      No billing data
                      available.
                    </div>

                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="city-modal-footer">

              <button
                type="button"
                className="city-footer-close"
                onClick={
                  handleClosePerformance
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