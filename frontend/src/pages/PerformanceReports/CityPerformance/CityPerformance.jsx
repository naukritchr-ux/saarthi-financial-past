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
   NUMBER HELPER
   ============================================================ */

const toNumber = (value) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/[₹,\s]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
};


/* ============================================================
   CURRENCY FORMAT
   ============================================================ */

const formatCurrency = (value) => {

  return `₹${toNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  )}`;
};


/* ============================================================
   CITY
   ============================================================ */

const getCity = (row) => {

  return String(
    row?.["City"] ?? ""
  ).trim() || "Unknown";
};


/* ============================================================
   INDUSTRY
   ============================================================ */

const getIndustry = (row) => {

  return String(
    row?.["Industry"] ?? ""
  ).trim() || "Unknown";
};


/* ============================================================
   TEAM LEADER
   ============================================================ */

const getTeamLeader = (row) => {

  return String(
    row?.["Team Leader"] ?? ""
  ).trim() || "Unknown";
};


/* ============================================================
   BD MEMBER
   ============================================================ */

const getBDMember = (row) => {

  return String(
    row?.["BD Member"] ?? ""
  ).trim() || "Unknown";
};


/* ============================================================
   INFO STATUS
   ============================================================ */

const getInfoStatus = (row) => {

  return String(
    row?.["Info"] ?? ""
  )
    .trim()
    .toUpperCase();

};


/* ============================================================
   BILLING
   ============================================================ */

const getBilling = (row) => {

  return toNumber(
    row?.["Total Bill Amount"]
  );

};


/* ============================================================
   DATE PARSER
   ============================================================ */

const parseDate = (value) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


  if (value instanceof Date) {

    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;

  }


  const stringValue =
    String(value).trim();


  if (!stringValue) {
    return null;
  }


  /* ==========================================================
     EXCEL SERIAL DATE
     ========================================================== */

  if (
    /^\d+(\.\d+)?$/.test(
      stringValue
    )
  ) {

    const serial =
      Number(stringValue);

    if (
      serial > 20000 &&
      serial < 60000
    ) {

      const excelDate =
        new Date(
          Date.UTC(
            1899,
            11,
            30
          )
        );

      excelDate.setUTCDate(
        excelDate.getUTCDate() +
        serial
      );

      return excelDate;

    }

  }


  /* ==========================================================
     YYYY-MM-DD
     ========================================================== */

  let match =
    stringValue.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
    );


  if (match) {

    const year =
      Number(match[1]);

    const month =
      Number(match[2]) - 1;

    const day =
      Number(match[3]);

    const date =
      new Date(
        year,
        month,
        day
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;

  }


  /* ==========================================================
     DD-MM-YYYY / DD/MM/YYYY
     ========================================================== */

  match =
    stringValue.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
    );


  if (match) {

    const day =
      Number(match[1]);

    const month =
      Number(match[2]) - 1;

    const year =
      Number(match[3]);

    const date =
      new Date(
        year,
        month,
        day
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;

  }


  const date =
    new Date(stringValue);


  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

};


/* ============================================================
   FINANCIAL YEAR

   SAME FORMAT AS DATACONTEXT

   Example:
   2025-2026
   2024-2025
   ============================================================ */

const getFinancialYear = (dateValue) => {

  const date =
    parseDate(dateValue);

  if (!date) {
    return "Unknown";
  }


  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;


  if (month >= 4) {

    return `${year}-${year + 1}`;

  }


  return `${year - 1}-${year}`;

};


/* ============================================================
   CLIENT ACQUIRED DATE
   ============================================================ */

const getClientAcquiredDate = (row) => {

  return (
    row?.["Date Client Acquired"] ??
    ""
  );

};


/* ============================================================
   MONTH
   ============================================================ */

const getMonth = (dateValue) => {

  const date =
    parseDate(dateValue);

  if (!date) {
    return "Unknown";
  }


  return date.toLocaleString(
    "en-IN",
    {
      month: "long"
    }
  );

};


/* ============================================================
   MOST FREQUENT
   ============================================================ */

const getMostFrequent = (
  rows,
  getter
) => {

  const counts = {};


  rows.forEach((row) => {

    const value =
      getter(row);

    if (!value) {
      return;
    }


    counts[value] =
      (counts[value] || 0) + 1;

  });


  const sorted =
    Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  return sorted.length
    ? sorted[0][0]
    : "N/A";

};


/* ============================================================
   FINANCIAL VALUES

   RULES:

   ALL:
   R + RV + C + CN
   Billing = Total Bill Amount
   Expenditure = 5%
   Net = Billing - 5%

   R:
   Billing = Total Bill Amount
   Expenditure = 5%
   Net = Billing - 5%

   RV:
   Billing = Total Bill Amount
   Net = 0

   C:
   Billing = Total Bill Amount
   Net = 0

   CN:
   Billing = Total Bill Amount
   Net = 0

   Franchise Share is NOT USED.
   ============================================================ */

function getFinancialValues(
  row,
  infoFilter = ""
) {

  const info =
    getInfoStatus(row);

  const billing =
    getBilling(row);


  /* ==========================================================
     ALL
     ========================================================== */

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {

    const expenditure =
      billing * 0.05;


    return {

      billing,

      netAmount:
        billing - expenditure,

      franchiseExpenditure:
        expenditure

    };

  }


  /* ==========================================================
     R
     ========================================================== */

  if (
    infoFilter === "R"
  ) {

    if (
      info !== "R"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        franchiseExpenditure: 0

      };

    }


    const expenditure =
      billing * 0.05;


    return {

      billing,

      netAmount:
        billing - expenditure,

      franchiseExpenditure:
        expenditure

    };

  }


  /* ==========================================================
     RV
     ========================================================== */

  if (
    infoFilter === "RV"
  ) {

    if (
      info !== "RV"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        franchiseExpenditure: 0

      };

    }


    return {

      billing,

      netAmount: 0,

      franchiseExpenditure: 0

    };

  }


  /* ==========================================================
     C
     ========================================================== */

  if (
    infoFilter === "C"
  ) {

    if (
      info !== "C"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        franchiseExpenditure: 0

      };

    }


    return {

      billing,

      netAmount: 0,

      franchiseExpenditure: 0

    };

  }


  /* ==========================================================
     CN
     ========================================================== */

  if (
    infoFilter === "CN"
  ) {

    if (
      info !== "CN"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        franchiseExpenditure: 0

      };

    }


    return {

      billing,

      netAmount: 0,

      franchiseExpenditure: 0

    };

  }


  return {

    billing: 0,

    netAmount: 0,

    franchiseExpenditure: 0

  };

}


/* ============================================================
   TOOLTIP
   ============================================================ */

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

    <div className="city-chart-tooltip">

      <p className="city-tooltip-title">
        {label}
      </p>


      {payload.map(
        (item, index) => (

          <p
            key={index}
            className="city-tooltip-row"
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

          </p>

        )
      )}

    </div>

  );

}


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function CityPerformance() {


  /* ==========================================================
     DATA CONTEXT

     IMPORTANT:
     Your DataContext exposes "rows",
     NOT "data".
     ========================================================== */

  const {
    rows,
    loading,
    error
  } = useData();


  /* ==========================================================
     STATE
     ========================================================== */

  const [
    selectedCity,
    setSelectedCity
  ] = useState("");


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState(
    "All Financial Years"
  );


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("All");


  const [
    showModal,
    setShowModal
  ] = useState(false);


  /* ==========================================================
     SAFE ROWS
     ========================================================== */

  const safeRows =
    useMemo(() => {

      return Array.isArray(rows)
        ? rows
        : [];

    }, [rows]);


  /* ==========================================================
     FINANCIAL YEARS
     ========================================================== */

  const financialYears =
    useMemo(() => {

      const years =
        new Set();


      safeRows.forEach(
        (row) => {

          const year =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );


          if (
            year &&
            year !== "Unknown"
          ) {

            years.add(year);

          }

        }
      );


      return Array.from(
        years
      ).sort(
        (a, b) => {

          const yearA =
            Number(
              a.split("-")[0]
            );

          const yearB =
            Number(
              b.split("-")[0]
            );


          return yearB - yearA;

        }
      );

    }, [safeRows]);


  /* ==========================================================
     FILTERED ROWS
     ========================================================== */

  const filteredRows =
    useMemo(() => {

      return safeRows.filter(
        (row) => {


          /* ==================================================
             FINANCIAL YEAR
             ================================================== */

          const rowYear =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );


          const yearMatch =
            selectedFinancialYear ===
              "All Financial Years" ||
            rowYear ===
              selectedFinancialYear;


          if (!yearMatch) {
            return false;
          }


          /* ==================================================
             INFO STATUS
             ================================================== */

          const rowInfo =
            getInfoStatus(row);


          const infoMatch =
            selectedInfoStatus ===
              "All" ||
            rowInfo ===
              selectedInfoStatus
                .toUpperCase();


          if (!infoMatch) {
            return false;
          }


          return true;

        }
      );

    }, [
      safeRows,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* ==========================================================
     CITY DATA
     ========================================================== */

  const cityData =
    useMemo(() => {

      const map = {};


      filteredRows.forEach(
        (row) => {

          const city =
            getCity(row);


          if (!map[city]) {

            map[city] = {

              city,

              clients: 0,

              billing: 0,

              netAmount: 0

            };

          }


          const financial =
            getFinancialValues(
              row,
              selectedInfoStatus ===
                "All"
                ? "ALL"
                : selectedInfoStatus
                    .toUpperCase()
            );


          map[city].clients += 1;


          map[city].billing +=
            financial.billing;


          map[city].netAmount +=
            financial.netAmount;

        }
      );


      return Object.values(
        map
      ).sort(
        (a, b) =>
          b.billing - a.billing
      );

    }, [
      filteredRows,
      selectedInfoStatus
    ]);


  /* ==========================================================
     SELECTED CITY ROWS
     ========================================================== */

  const selectedRows =
    useMemo(() => {

      if (!selectedCity) {
        return [];
      }


      return safeRows.filter(
        (row) => {

          /* ==================================================
             CITY
             ================================================== */

          if (
            getCity(row) !==
            selectedCity
          ) {

            return false;

          }


          /* ==================================================
             FINANCIAL YEAR
             ================================================== */

          const rowYear =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );


          if (
            selectedFinancialYear !==
              "All Financial Years" &&
            rowYear !==
              selectedFinancialYear
          ) {

            return false;

          }


          /* ==================================================
             INFO
             ================================================== */

          const rowInfo =
            getInfoStatus(row);


          if (
            selectedInfoStatus !==
              "All" &&
            rowInfo !==
              selectedInfoStatus
                .toUpperCase()
          ) {

            return false;

          }


          return true;

        }
      );

    }, [
      safeRows,
      selectedCity,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* ==========================================================
     PERFORMANCE SUMMARY
     ========================================================== */

  const performanceSummary =
    useMemo(() => {

      let billing = 0;

      let netAmount = 0;


      selectedRows.forEach(
        (row) => {

          const financial =
            getFinancialValues(
              row,
              selectedInfoStatus ===
                "All"
                ? "ALL"
                : selectedInfoStatus
                    .toUpperCase()
            );


          billing +=
            financial.billing;


          netAmount +=
            financial.netAmount;

        }
      );


      return {

        clients:
          selectedRows.length,

        billing,

        netAmount

      };

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* ==========================================================
     BEST INDUSTRY
     ========================================================== */

  const bestIndustry =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getIndustry
      );

    }, [selectedRows]);


  /* ==========================================================
     BEST TEAM LEADER
     ========================================================== */

  const bestTeamLeader =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getTeamLeader
      );

    }, [selectedRows]);


  /* ==========================================================
     BEST BD MEMBER
     ========================================================== */

  const bestBDMember =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getBDMember
      );

    }, [selectedRows]);


  /* ==========================================================
     YEARLY REPORT
     ========================================================== */

  const yearlyReport =
    useMemo(() => {

      const map = {};


      selectedRows.forEach(
        (row) => {

          const year =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );


          if (
            year === "Unknown"
          ) {

            return;

          }


          if (!map[year]) {

            map[year] = {

              year,

              clients: 0,

              billing: 0,

              netAmount: 0

            };

          }


          const financial =
            getFinancialValues(
              row,
              selectedInfoStatus ===
                "All"
                ? "ALL"
                : selectedInfoStatus
                    .toUpperCase()
            );


          map[year].clients += 1;


          map[year].billing +=
            financial.billing;


          map[year].netAmount +=
            financial.netAmount;

        }
      );


      return Object.values(
        map
      ).sort(
        (a, b) => {

          const yearA =
            Number(
              a.year.split("-")[0]
            );

          const yearB =
            Number(
              b.year.split("-")[0]
            );


          return yearA - yearB;

        }
      );

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* ==========================================================
     MONTHLY REPORT
     ========================================================== */

  const monthlyReport =
    useMemo(() => {

      const map = {};


      financialMonths.forEach(
        (month) => {

          map[month] = {

            month,

            clients: 0,

            billing: 0,

            netAmount: 0

          };

        }
      );


      selectedRows.forEach(
        (row) => {

          const month =
            getMonth(
              getClientAcquiredDate(
                row
              )
            );


          if (
            !map[month]
          ) {

            return;

          }


          const financial =
            getFinancialValues(
              row,
              selectedInfoStatus ===
                "All"
                ? "ALL"
                : selectedInfoStatus
                    .toUpperCase()
            );


          map[month].clients += 1;


          map[month].billing +=
            financial.billing;


          map[month].netAmount +=
            financial.netAmount;

        }
      );


      return financialMonths.map(
        (month) =>
          map[month]
      );

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* ==========================================================
     VIEW PERFORMANCE
     ========================================================== */

  const handleViewPerformance =
    (city) => {

      setSelectedCity(city);

      setShowModal(true);

    };


  /* ==========================================================
     CLOSE MODAL
     ========================================================== */

  const handleCloseModal =
    () => {

      setShowModal(false);

      setSelectedCity("");

    };


  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {

    return (

      <div className="city-performance-page">

        <div className="city-empty">

          Loading city performance data...

        </div>

      </div>

    );

  }


  /* ==========================================================
     ERROR
     ========================================================== */

  if (error) {

    return (

      <div className="city-performance-page">

        <div className="city-empty">

          Failed to load data:
          {" "}
          {error}

        </div>

      </div>

    );

  }


  /* ==========================================================
     PAGE
     ========================================================== */

  return (

    <div className="city-performance-page">


      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="city-page-header">

        <div>

          <div className="city-page-eyebrow">
            PERFORMANCE REPORT
          </div>


          <h1>
            City Performance
          </h1>


          <p>
            Analyse client acquisition,
            billing and financial
            performance city-wise.
          </p>

        </div>

      </div>


      {/* ======================================================
          TABLE CARD
          ====================================================== */}

      <div className="city-table-card">


        <div className="city-table-header">

          <div>

            <h2>
              City Performance
            </h2>


            <span className="city-member-count">

              {cityData.length}

              {" "}

              {cityData.length === 1
                ? "City"
                : "Cities"}

            </span>

          </div>


          {/* ==================================================
              FILTERS
              ================================================== */}

          <div className="city-table-filters">


            <div className="city-filter-group">

              <label>
                Financial Year
              </label>


              <select
                value={
                  selectedFinancialYear
                }
                onChange={(e) =>
                  setSelectedFinancialYear(
                    e.target.value
                  )
                }
              >

                <option value="All Financial Years">
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


            <div className="city-filter-group">

              <label>
                Info Status
              </label>


              <select
                value={
                  selectedInfoStatus
                }
                onChange={(e) =>
                  setSelectedInfoStatus(
                    e.target.value
                  )
                }
              >

                <option value="All">
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

          </div>

        </div>


        {/* ====================================================
            TABLE
            ==================================================== */}

        <div className="city-table-wrapper">

          <table className="city-table">

            <thead>

              <tr>

                <th>
                  City Name
                </th>


                <th>
                  Client Count
                </th>


                <th>
                  Total Billing
                </th>


                <th>
                  Net Amount
                </th>


                <th>
                  Action
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

                        <div className="city-name-cell">

                          <span className="city-avatar">

                            {item.city
                              .charAt(0)
                              .toUpperCase()}

                          </span>


                          <span className="city-name">

                            {item.city}

                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="city-client-count">

                          {item.clients.toLocaleString(
                            "en-IN"
                          )}

                        </span>

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


                      <td>

                        <button
                          className="city-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              item.city
                            )
                          }
                        >

                          View Performance

                          <span className="city-btn-arrow">
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
                    colSpan="5"
                    className="city-empty"
                  >

                    No city data available.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {showModal && (

        <div
          className="city-performance-overlay"
          onClick={
            handleCloseModal
          }
        >

          <div
            className="city-performance-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* ==================================================
                MODAL HEADER
                ================================================== */}

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
                  report for{" "}
                  {selectedCity}.
                </p>

              </div>


              <button
                className="city-modal-close"
                onClick={
                  handleCloseModal
                }
              >
                ×
              </button>

            </div>


            {/* ==================================================
                SUMMARY CARDS
                ================================================== */}

            <div className="city-summary-grid">


              <div className="city-summary-card">

                <span className="city-summary-label">
                  Client Count
                </span>


                <span className="city-summary-value">

                  {performanceSummary.clients.toLocaleString(
                    "en-IN"
                  )}

                </span>

              </div>


              <div className="city-summary-card">

                <span className="city-summary-label">
                  Total Billing
                </span>


                <span className="city-summary-value">

                  {formatCurrency(
                    performanceSummary.billing
                  )}

                </span>

              </div>


              <div className="city-summary-card">

                <span className="city-summary-label">
                  Net Amount
                </span>


                <span className="city-summary-value city-summary-net">

                  {formatCurrency(
                    performanceSummary.netAmount
                  )}

                </span>

              </div>


              <div className="city-summary-card">

                <span className="city-summary-label">
                  Top Industry
                </span>


                <span className="city-summary-text">

                  {bestIndustry}

                </span>

              </div>


              <div className="city-summary-card">

                <span className="city-summary-label">
                  Top Team Leader
                </span>


                <span className="city-summary-text">

                  {bestTeamLeader}

                </span>

              </div>


              <div className="city-summary-card">

                <span className="city-summary-label">
                  Top BD Member
                </span>


                <span className="city-summary-text">

                  {bestBDMember}

                </span>

              </div>

            </div>


            {/* ==================================================
                REPORT CONTROLS
                ================================================== */}

            <div className="city-report-controls">


              <div>

                <span className="city-report-period-label">
                  Financial Year
                </span>


                <strong>
                  {selectedFinancialYear}
                </strong>

              </div>


              <div>

                <span className="city-report-period-label">
                  Info Status
                </span>


                <strong>
                  {selectedInfoStatus}
                </strong>

              </div>

            </div>


            {/* ==================================================
                GRAPHS
                ================================================== */}

            <div className="city-report-graphs">


              {/* ==================================================
                  YEARLY CLIENT ACQUISITION
                  ================================================== */}

              <div className="city-chart-card">

                <div className="city-chart-header">

                  <div>

                    <h3>
                      Client Acquired
                    </h3>


                    <p>
                      Year-wise client
                      acquisition
                    </p>

                  </div>

                </div>


                <div className="city-chart-container">

                  {yearlyReport.length >
                  0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height={320}
                    >

                      <BarChart
                        data={
                          yearlyReport
                        }
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
                          dataKey="year"
                        />


                        <YAxis
                          allowDecimals={false}
                        />


                        <Tooltip
                          content={
                            <CityTooltip />
                          }
                        />


                        <Bar
                          dataKey="clients"
                          name="Clients"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="city-chart-no-data">

                      No yearly data available.

                    </div>

                  )}

                </div>

              </div>


              {/* ==================================================
                  YEARLY BILLING
                  ================================================== */}

              <div className="city-chart-card">

                <div className="city-chart-header">

                  <div>

                    <h3>
                      Total Billing
                    </h3>


                    <p>
                      Year-wise billing
                      performance
                    </p>

                  </div>

                </div>


                <div className="city-chart-container">

                  {yearlyReport.length >
                  0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height={320}
                    >

                      <BarChart
                        data={
                          yearlyReport
                        }
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
                          dataKey="year"
                        />


                        <YAxis
                          tickFormatter={
                            (value) =>
                              `₹${Number(
                                value
                              ).toLocaleString(
                                "en-IN"
                              )}`
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
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="city-chart-no-data">

                      No billing data available.

                    </div>

                  )}

                </div>

              </div>


              {/* ==================================================
                  MONTHLY CLIENT ACQUISITION
                  ================================================== */}

              <div className="city-chart-card">

                <div className="city-chart-header">

                  <div>

                    <h3>
                      Monthly Client Acquisition
                    </h3>


                    <p>
                      Financial year monthly
                      client acquisition
                    </p>

                  </div>

                </div>


                <div className="city-chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <BarChart
                      data={
                        monthlyReport
                      }
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 50
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />


                      <XAxis
                        dataKey="month"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />


                      <YAxis
                        allowDecimals={false}
                      />


                      <Tooltip
                        content={
                          <CityTooltip />
                        }
                      />


                      <Bar
                        dataKey="clients"
                        name="Clients"
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


              {/* ==================================================
                  MONTHLY BILLING
                  ================================================== */}

              <div className="city-chart-card">

                <div className="city-chart-header">

                  <div>

                    <h3>
                      Monthly Billing
                    </h3>


                    <p>
                      Financial year monthly
                      billing
                    </p>

                  </div>

                </div>


                <div className="city-chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <BarChart
                      data={
                        monthlyReport
                      }
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 50
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />


                      <XAxis
                        dataKey="month"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />


                      <YAxis
                        tickFormatter={
                          (value) =>
                            `₹${Number(
                              value
                            ).toLocaleString(
                              "en-IN"
                            )}`
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

            </div>


            {/* ==================================================
                FOOTER
                ================================================== */}

            <div className="city-modal-footer">

              <button
                className="city-modal-footer-close"
                onClick={
                  handleCloseModal
                }
              >
                Close Report
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default CityPerformance;
