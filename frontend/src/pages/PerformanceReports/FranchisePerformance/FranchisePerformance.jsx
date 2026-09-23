import {
  useMemo,
  useState
} from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import {
  useData
} from "../../../context/DataContext";

import "./FranchisePerformance.css";


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
   NUMBER HELPER
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
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const cleanedValue = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleanedValue);

  return Number.isFinite(number)
    ? number
    : 0;
}


/* =========================================================
   CURRENCY FORMAT
========================================================= */

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


/* =========================================================
   GET FRANCHISE
========================================================= */

function getFranchise(row) {

  return String(
    row?.franchise_name ??
    row?.["Franchise Name"] ??
    ""
  ).trim();

}


/* =========================================================
   GET INDUSTRY
========================================================= */

function getIndustry(row) {

  return String(
    row?.industry ??
    row?.["Industry"] ??
    ""
  ).trim();

}


/* =========================================================
   GET CITY
========================================================= */

function getCity(row) {

  return String(
    row?.city ??
    row?.["City"] ??
    ""
  ).trim();

}


/* =========================================================
   GET INFO STATUS
   DATABASE FIELD:
   info
========================================================= */

function getInfoStatus(row) {

  return String(
    row?.info ??
    row?.["Info"] ??
    ""
  )
    .trim()
    .toUpperCase();

}


/* =========================================================
   GET BILLING

   DATABASE FIELD:
   total_bill_amount

   NO TANN
   NO TDS
========================================================= */

function getBilling(row) {

  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    0
  );

}


/* =========================================================
   GET FRANCHISE SHARE

   DATABASE FIELD:
   franchisee_share
========================================================= */

function getFranchiseeShare(row) {

  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"] ??
    0
  );

}


/* =========================================================
   GET FINANCIAL VALUES

   ALL:
   Total Billing = R + RV + C + CN
   Net Amount = Billing - Franchisee Share
   Franchise Expenditure = Billing × 5%

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
========================================================= */

function getFinancialValues(
  row,
  infoFilter = ""
) {

  const info =
    getInfoStatus(row);

  const billing =
    getBilling(row);

  const franchiseeShare =
    getFranchiseeShare(row);


  /* =======================================================
     ALL
  ======================================================= */

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {

    return {

      billing:
        billing,

      netAmount:
        billing -
        franchiseeShare,

      franchiseExpenditure:
        billing * 0.05

    };

  }


  /* =======================================================
     R
  ======================================================= */

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


    return {

      billing:
        billing,

      netAmount:
        billing -
        franchiseeShare,

      franchiseExpenditure:
        billing * 0.05

    };

  }


  /* =======================================================
     RV
  ======================================================= */

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

      billing:
        billing,

      netAmount: 0,

      franchiseExpenditure: 0

    };

  }


  /* =======================================================
     C
  ======================================================= */

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

      billing:
        billing,

      netAmount: 0,

      franchiseExpenditure: 0

    };

  }


  /* =======================================================
     CN
  ======================================================= */

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

      billing:
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


/* =========================================================
   GET CLIENT ACQUIRED DATE
========================================================= */

function getClientAcquiredDate(row) {

  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    ""
  );

}


/* =========================================================
   GET FINANCIAL YEAR
========================================================= */

function getFinancialYear(row) {

  const dateValue =
    getClientAcquiredDate(row);


  if (dateValue) {

    const date =
      new Date(dateValue);


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      const month =
        date.getMonth() + 1;

      const year =
        date.getFullYear();


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

    const year =
      Number(acquiredYear);


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
   GET MONTH
========================================================= */

function getMonth(row) {

  const dateValue =
    getClientAcquiredDate(row);


  if (!dateValue) {
    return "";
  }


  const date =
    new Date(dateValue);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.getMonth() + 1;

}


/* =========================================================
   CUSTOM TOOLTIP
========================================================= */

function FranchiseTooltip({
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

    <div className="franchise-modern-tooltip">

      <div className="franchise-tooltip-label">
        {label}
      </div>


      {payload.map(
        (item, index) => (

          <div
            className="franchise-tooltip-row"
            key={index}
          >

            <span>
              {item.name}
            </span>


            <strong>

              {item.name === "Total Billing"
                ? formatCurrency(item.value)
                : item.value}

            </strong>

          </div>

        )
      )}

    </div>

  );

}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function FranchisePerformance() {

  const {
    rows = []
  } = useData();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedFranchise,
    setSelectedFranchise
  ] = useState("");


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");


  /* =======================================================
     FRANCHISE SUMMARY TABLE
  ======================================================= */

  const franchiseData =
    useMemo(() => {

      const map =
        new Map();


      rows.forEach(row => {

        const franchise =
          getFranchise(row);


        if (!franchise) {
          return;
        }


        if (!map.has(franchise)) {

          map.set(
            franchise,
            {
              franchise,
              clients: 0,
              billing: 0,
              franchiseShare: 0,
              franchiseExpenditure: 0,
              netAmount: 0
            }
          );

        }


        const data =
          map.get(franchise);


        /*
         * Main table uses the selected
         * Financial Year and Info filter.
         */

        if (
          selectedFinancialYear &&
          getFinancialYear(row) !==
            selectedFinancialYear
        ) {

          return;

        }


        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        data.clients += 1;


        data.billing +=
          financialValues.billing;


        data.franchiseShare +=
          getFranchiseeShare(row);


        data.franchiseExpenditure +=
          financialValues.franchiseExpenditure;


        data.netAmount +=
          financialValues.netAmount;

      });


      return Array.from(
        map.values()
      )
        .filter(
          item =>
            item.clients > 0
        )
        .sort(
          (a, b) =>
            b.clients - a.clients
        );

    }, [
      rows,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears =
    useMemo(() => {

      const years =
        new Set();


      rows.forEach(row => {

        const year =
          getFinancialYear(row);


        if (year) {
          years.add(year);
        }

      });


      return Array.from(years)
        .sort((a, b) => {

          const yearA =
            Number(
              String(a).slice(0, 4)
            );


          const yearB =
            Number(
              String(b).slice(0, 4)
            );


          return yearA - yearB;

        });

    }, [rows]);


  /* =======================================================
     SELECTED FRANCHISE ROWS
  ======================================================= */

  const selectedRows =
    useMemo(() => {

      if (!selectedFranchise) {
        return [];
      }


      return rows.filter(
        row => {

          if (
            getFranchise(row) !==
            selectedFranchise
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


          return true;

        }
      );

    }, [
      rows,
      selectedFranchise,
      selectedFinancialYear
    ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;

      let totalFranchiseShare = 0;

      let totalFranchiseExpenditure = 0;

      let netAmount = 0;


      selectedRows.forEach(row => {

        const values =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        totalBilling +=
          values.billing;


        /*
         * Franchisee Share is included
         * in Net Amount calculation only
         * when status is All or R.
         */

        if (
          !selectedInfoStatus ||
          selectedInfoStatus === "R"
        ) {

          totalFranchiseShare +=
            getFranchiseeShare(row);

        }


        totalFranchiseExpenditure +=
          values.franchiseExpenditure;


        netAmount +=
          values.netAmount;

      });


      return {

        totalBilling,

        totalFranchiseShare,

        totalFranchiseExpenditure,

        netAmount

      };

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* =======================================================
     BEST INDUSTRY
  ======================================================= */

  const bestIndustry =
    useMemo(() => {

      const counts =
        new Map();


      selectedRows.forEach(row => {

        const industry =
          getIndustry(row);


        if (!industry) {
          return;
        }


        counts.set(
          industry,
          (counts.get(industry) || 0) + 1
        );

      });


      let best = "";

      let highest = 0;


      counts.forEach(
        (count, industry) => {

          if (count > highest) {

            highest = count;

            best = industry;

          }

        }
      );


      return best || "—";

    }, [selectedRows]);


  /* =======================================================
     BEST CITY
  ======================================================= */

  const bestCity =
    useMemo(() => {

      const counts =
        new Map();


      selectedRows.forEach(row => {

        const city =
          getCity(row);


        if (!city) {
          return;
        }


        counts.set(
          city,
          (counts.get(city) || 0) + 1
        );

      });


      let best = "";

      let highest = 0;


      counts.forEach(
        (count, city) => {

          if (count > highest) {

            highest = count;

            best = city;

          }

        }
      );


      return best || "—";

    }, [selectedRows]);


  /* =======================================================
     YEARLY REPORT
  ======================================================= */

  const yearlyReportData =
    useMemo(() => {

      const map =
        new Map();


      selectedRows.forEach(row => {

        const year =
          getFinancialYear(row);


        if (!year) {
          return;
        }


        if (!map.has(year)) {

          map.set(
            year,
            {
              year,
              clients: 0,
              billing: 0
            }
          );

        }


        const data =
          map.get(year);


        const values =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        data.clients += 1;

        data.billing +=
          values.billing;

      });


      return Array.from(
        map.values()
      ).sort((a, b) => {

        const yearA =
          Number(
            String(a.year).slice(0, 4)
          );


        const yearB =
          Number(
            String(b.year).slice(0, 4)
          );


        return yearA - yearB;

      });

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* =======================================================
     MONTHLY REPORT
  ======================================================= */

  const monthlyReportData =
    useMemo(() => {

      if (!selectedFinancialYear) {
        return [];
      }


      const monthMap =
        new Map();


      financialMonths.forEach(
        (month, index) => {

          monthMap.set(
            index + 1,
            {
              month: month.full,
              monthShort: month.short,
              clients: 0,
              billing: 0
            }
          );

        }
      );


      selectedRows.forEach(row => {

        const year =
          getFinancialYear(row);


        if (
          year !==
          selectedFinancialYear
        ) {

          return;

        }


        const month =
          getMonth(row);


        if (
          !monthMap.has(month)
        ) {

          return;

        }


        const data =
          monthMap.get(month);


        const values =
          getFinancialValues(
            row,
            selectedInfoStatus
          );


        data.clients += 1;


        data.billing +=
          values.billing;

      });


      const orderedMonths = [

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


      return orderedMonths.map(
        month =>
          monthMap.get(month)
      );

    }, [
      selectedRows,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* =======================================================
     OPEN PERFORMANCE MODAL
  ======================================================= */

  function handleViewPerformance(
    franchise
  ) {

    setSelectedFranchise(
      franchise
    );

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  }


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function handleCloseModal() {

    setSelectedFranchise("");

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="franchise-performance-page">


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="franchise-page-header">

        <div>

          <div className="franchise-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            Franchise Performance
          </h1>

          <p>
            Monitor franchise acquisition,
            billing and financial performance.
          </p>

        </div>

      </div>


      {/* ===================================================
          MAIN TABLE
      =================================================== */}

      <div className="franchise-table-card">


        <div className="franchise-table-header">

          <div>

            <h2>
              Franchise Performance
            </h2>

            <p>
              Complete franchise-wise
              performance overview
            </p>

          </div>


          <div className="franchise-member-count">

            {franchiseData.length}

            <span>
              Franchises
            </span>

          </div>

        </div>


        {/* =================================================
            MAIN FILTERS
        ================================================= */}

        <div
          className="franchise-report-controls"
          style={{
            marginBottom: "20px"
          }}
        >

          <div>

            <label>
              Financial Year
            </label>

            <select
              value={
                selectedFinancialYear
              }
              onChange={event =>
                setSelectedFinancialYear(
                  event.target.value
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
              onChange={event =>
                setSelectedInfoStatus(
                  event.target.value
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

        </div>


        <div className="franchise-table-wrapper">

          <table className="franchise-table">

            <thead>

              <tr>

                <th>
                  Franchise Name
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
                  Franchise Expenditure
                </th>

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {franchiseData.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="franchise-empty"
                  >
                    No franchise data available.
                  </td>

                </tr>

              ) : (

                franchiseData.map(
                  franchise => (

                    <tr
                      key={
                        franchise.franchise
                      }
                    >

                      <td>

                        <div className="franchise-name">

                          <div className="franchise-avatar">

                            {
                              franchise.franchise
                                .charAt(0)
                                .toUpperCase()
                            }

                          </div>

                          <span>

                            {
                              franchise.franchise
                            }

                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="franchise-client-count">

                          {
                            franchise.clients
                          }

                        </span>

                      </td>


                      <td>

                        <span className="franchise-billing-value">

                          {
                            formatCurrency(
                              franchise.billing
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <span className="franchise-net-value">

                          {
                            formatCurrency(
                              franchise.netAmount
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <span className="franchise-expenditure-value">

                          {
                            formatCurrency(
                              franchise.franchiseExpenditure
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="franchise-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              franchise.franchise
                            )
                          }
                        >

                          View

                          <span className="franchise-view-arrow">
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

      </div>


      {/* ===================================================
          PERFORMANCE MODAL
      =================================================== */}

      {selectedFranchise && (

        <div
          className="franchise-performance-overlay"
          onClick={handleCloseModal}
        >


          <div
            className="franchise-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <div className="franchise-modal-header">

              <div>

                <div className="franchise-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>
                  {selectedFranchise}
                </h2>

                <p>
                  Franchise performance
                  analysis and financial trends
                </p>

              </div>


              <button
                type="button"
                className="franchise-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =============================================
                SUMMARY CARDS
            ============================================= */}

            <div className="franchise-summary-grid">


              {/* BEST INDUSTRY */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Best Industry
                </span>

                <strong className="franchise-summary-text">
                  {bestIndustry}
                </strong>

              </div>


              {/* BEST CITY */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Best City
                </span>

                <strong className="franchise-summary-text">
                  {bestCity}
                </strong>

              </div>


              {/* TOTAL BILLING */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Total Billing
                </span>

                <strong className="franchise-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalBilling
                    )
                  }

                </strong>

              </div>


              {/* FRANCHISE SHARE */}

              <div className="franchise-summary-card franchise-summary-share">

                <span className="franchise-summary-label">
                  Franchise Share Claimed
                </span>

                <strong className="franchise-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalFranchiseShare
                    )
                  }

                </strong>

              </div>


              {/* FRANCHISE EXPENDITURE */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Franchise Expenditure
                </span>

                <strong className="franchise-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalFranchiseExpenditure
                    )
                  }

                </strong>

                <small>
                  5% of Total Billing
                </small>

              </div>


              {/* NET AMOUNT */}

              <div className="franchise-summary-card franchise-summary-net">

                <span className="franchise-summary-label">
                  Net Amount
                </span>

                <strong className="franchise-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.netAmount
                    )
                  }

                </strong>

              </div>


            </div>


            {/* =============================================
                REPORT CONTROLS
            ============================================= */}

            <div className="franchise-report-controls">


              <div>

                <label
                  htmlFor="franchise-financial-year"
                >
                  Financial Year
                </label>


                <select
                  id="franchise-financial-year"
                  value={
                    selectedFinancialYear
                  }
                  onChange={event =>
                    setSelectedFinancialYear(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    None
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
                  onChange={event =>
                    setSelectedInfoStatus(
                      event.target.value
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


              <div className="franchise-report-period">

                <span>
                  Report Period
                </span>

                <strong>

                  {
                    selectedFinancialYear
                      ? selectedFinancialYear
                      : "Yearly"
                  }

                </strong>

              </div>


            </div>


            {/* =============================================
                GRAPHS
            ============================================= */}

            <div className="franchise-report-graphs">


              {/* CLIENT ACQUIRED */}

              <div className="franchise-chart-card">

                <div className="franchise-chart-heading">

                  <div>

                    <span className="franchise-chart-indicator franchise-client-indicator"></span>

                    <h3>
                      Client Acquired
                    </h3>

                  </div>

                  <span>

                    {
                      selectedFinancialYear
                        ? "Monthly"
                        : "Yearly"
                    }

                  </span>

                </div>


                <div className="franchise-chart-container">

                  {reportData.length === 0 ? (

                    <div className="franchise-no-chart-data">

                      No report data available.

                    </div>

                  ) : (

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={reportData}
                        margin={{
                          top: 15,
                          right: 10,
                          left: 0,
                          bottom: 5
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
                            <FranchiseTooltip />
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

                  )}

                </div>

              </div>


              {/* TOTAL BILLING */}

              <div className="franchise-chart-card">

                <div className="franchise-chart-heading">

                  <div>

                    <span className="franchise-chart-indicator franchise-billing-indicator"></span>

                    <h3>
                      Total Billing
                    </h3>

                  </div>

                  <span>

                    {
                      selectedFinancialYear
                        ? "Monthly"
                        : "Yearly"
                    }

                  </span>

                </div>


                <div className="franchise-chart-container">

                  {reportData.length === 0 ? (

                    <div className="franchise-no-chart-data">

                      No report data available.

                    </div>

                  ) : (

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={reportData}
                        margin={{
                          top: 15,
                          right: 10,
                          left: 0,
                          bottom: 5
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
                          tickFormatter={value =>
                            `₹${(
                              value / 100000
                            ).toFixed(0)}L`
                          }
                        />

                        <Tooltip
                          content={
                            <FranchiseTooltip />
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

                  )}

                </div>

              </div>


            </div>


            {/* =============================================
                MODAL FOOTER
            ============================================= */}

            <div className="franchise-modal-footer">

              <span>

                {
                  selectedFinancialYear
                    ? `Monthly report for ${selectedFinancialYear}`
                    : "Yearly performance report"
                }

              </span>


              <button
                type="button"
                className="franchise-footer-close"
                onClick={handleCloseModal}
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


export default FranchisePerformance;
