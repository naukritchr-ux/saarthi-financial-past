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

import "./IndustryPerformance.css";


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

  const cleanedValue =
    String(value)
      .replace(/,/g, "")
      .replace(/[₹$€£]/g, "")
      .trim();

  const number =
    Number(cleanedValue);

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
  ).format(
    toNumber(value)
  );

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
   GET SUB INDUSTRY
========================================================= */

function getSubIndustry(row) {

  return String(
    row?.sub_industry ??
    row?.["Sub Industry"] ??
    ""
  ).trim();

}


/* =========================================================
   GET BILLING
========================================================= */

function getBilling(row) {

  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"]
  );

}


/* =========================================================
   GET FRANCHISE SHARE
========================================================= */

function getFranchiseeShare(row) {

  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"]
  );

}


/* =========================================================
   GET NET AMOUNT
========================================================= */

function getNetAmount(row) {

  return (
    getBilling(row) -
    getFranchiseeShare(row)
  );

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

function IndustryTooltip({
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

    <div className="industry-modern-tooltip">

      <div className="industry-tooltip-label">
        {label}
      </div>


      {payload.map(
        (item, index) => (

          <div
            className="industry-tooltip-row"
            key={index}
          >

            <span>
              {item.name}
            </span>

            <strong>

              {item.name === "Total Billing"
                ? formatCurrency(
                    item.value
                  )
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

function IndustryPerformance() {

  const {
    rows = []
  } = useData();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState("");


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  /* =======================================================
     INDUSTRY TABLE DATA
  ======================================================= */

  const industryData =
    useMemo(() => {

      const map =
        new Map();


      rows.forEach(row => {

        const industry =
          getIndustry(row);


        if (!industry) {
          return;
        }


        if (!map.has(industry)) {

          map.set(
            industry,
            {
              industry,
              clients: 0,
              billing: 0,
              netAmount: 0
            }
          );

        }


        const data =
          map.get(industry);


        data.clients += 1;

        data.billing +=
          getBilling(row);

        data.netAmount +=
          getNetAmount(row);

      });


      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.clients - a.clients
      );

    }, [rows]);


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


      return Array.from(
        years
      ).sort((a, b) => {

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
     SELECTED INDUSTRY ROWS
  ======================================================= */

  const selectedRows =
    useMemo(() => {

      if (!selectedIndustry) {
        return [];
      }


      return rows.filter(
        row =>
          getIndustry(row) ===
          selectedIndustry
      );

    }, [
      rows,
      selectedIndustry
    ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;

      let totalFranchiseShare = 0;

      let netAmount = 0;


      selectedRows.forEach(row => {

        const billing =
          getBilling(row);

        const franchiseShare =
          getFranchiseeShare(row);


        totalBilling +=
          billing;


        totalFranchiseShare +=
          franchiseShare;


        netAmount +=
          billing -
          franchiseShare;

      });


      return {

        totalBilling,

        totalFranchiseShare,

        netAmount

      };

    }, [selectedRows]);


  /* =======================================================
     TOP INDUSTRY
     
     The selected industry is already the main industry.
     This calculates the highest-acquired industry inside
     the available data for the selected report.
  ======================================================= */

  const topIndustry =
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


      let bestIndustry = "";

      let highestCount = 0;


      counts.forEach(
        (count, industry) => {

          if (
            count >
            highestCount
          ) {

            highestCount =
              count;

            bestIndustry =
              industry;

          }

        }
      );


      return {

        name:
          bestIndustry ||
          selectedIndustry ||
          "—",

        count:
          highestCount

      };

    }, [
      selectedRows,
      selectedIndustry
    ]);


  /* =======================================================
     SUB INDUSTRIES OF TOP INDUSTRY
  ======================================================= */

  const topIndustrySubIndustries =
    useMemo(() => {

      if (!topIndustry.name) {
        return [];
      }


      const counts =
        new Map();


      selectedRows.forEach(row => {

        const industry =
          getIndustry(row);

        const subIndustry =
          getSubIndustry(row);


        if (
          industry !==
          topIndustry.name
        ) {
          return;
        }


        if (!subIndustry) {
          return;
        }


        counts.set(
          subIndustry,
          (counts.get(subIndustry) || 0) + 1
        );

      });


      return Array.from(
        counts.entries()
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .map(
          ([name, count]) => ({
            name,
            count
          })
        );

    }, [
      selectedRows,
      topIndustry
    ]);


  /* =======================================================
     YEARLY TOP INDUSTRY REPORT
     
     IMPORTANT:
     Only the TOP INDUSTRY of each year is displayed.
     Top = highest acquired client count.
  ======================================================= */

  const yearlyReportData =
    useMemo(() => {

      const yearMap =
        new Map();


      selectedRows.forEach(row => {

        const year =
          getFinancialYear(row);


        if (!year) {
          return;
        }


        const industry =
          getIndustry(row);


        if (!industry) {
          return;
        }


        if (!yearMap.has(year)) {

          yearMap.set(
            year,
            new Map()
          );

        }


        const industryMap =
          yearMap.get(year);


        if (!industryMap.has(industry)) {

          industryMap.set(
            industry,
            {
              industry,
              clients: 0,
              billing: 0
            }
          );

        }


        const data =
          industryMap.get(
            industry
          );


        data.clients += 1;

        data.billing +=
          getBilling(row);

      });


      const result = [];


      yearMap.forEach(
        (industryMap, year) => {

          let top = null;


          industryMap.forEach(
            data => {

              if (
                !top ||
                data.clients >
                  top.clients
              ) {

                top = data;

              }

            }
          );


          if (top) {

            result.push({

              year,

              industry:
                top.industry,

              clients:
                top.clients,

              billing:
                top.billing

            });

          }

        }
      );


      return result.sort(
        (a, b) => {

          const yearA =
            Number(
              String(a.year)
                .slice(0, 4)
            );

          const yearB =
            Number(
              String(b.year)
                .slice(0, 4)
            );


          return yearA - yearB;

        }
      );

    }, [selectedRows]);


  /* =======================================================
     MONTHLY TOP INDUSTRY REPORT
     
     For selected financial year:
     Apr → Mar

     Each month displays only the industry
     with the highest acquired-client count.
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
              month:
                month.full,

              monthShort:
                month.short,

              industry:
                "",

              clients:
                0,

              billing:
                0
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


        const monthData =
          monthMap.get(month);


        const industry =
          getIndustry(row);


        if (!industry) {
          return;
        }


        if (
          !monthData.industry
        ) {

          monthData.industry =
            industry;

          monthData.clients =
            1;

          monthData.billing =
            getBilling(row);

        } else {

          /*
            Temporary internal storage
            for industry comparison.
          */

          if (
            !monthData._industries
          ) {

            monthData._industries =
              new Map();

          }


          if (
            !monthData._industries.has(
              monthData.industry
            )
          ) {

            monthData._industries.set(
              monthData.industry,
              {
                clients:
                  monthData.clients,

                billing:
                  monthData.billing
              }
            );

          }


          const industries =
            monthData._industries;


          if (
            !industries.has(
              industry
            )
          ) {

            industries.set(
              industry,
              {
                clients: 0,
                billing: 0
              }
            );

          }


          const data =
            industries.get(
              industry
            );


          data.clients += 1;

          data.billing +=
            getBilling(row);

        }

      });


      /*
        Rebuild each month properly so the
        highest-client industry is selected.
      */

      selectedRows.forEach(() => {
        // Intentionally handled in the aggregation above.
      });


      /*
        Recalculate monthly industry data
        cleanly from selected rows.
      */

      const cleanMonthMap =
        new Map();


      financialMonths.forEach(
        (month, index) => {

          cleanMonthMap.set(
            index + 1,
            new Map()
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

        const industry =
          getIndustry(row);


        if (
          !cleanMonthMap.has(month) ||
          !industry
        ) {
          return;
        }


        const industryMap =
          cleanMonthMap.get(month);


        if (
          !industryMap.has(industry)
        ) {

          industryMap.set(
            industry,
            {
              industry,
              clients: 0,
              billing: 0
            }
          );

        }


        const data =
          industryMap.get(industry);


        data.clients += 1;

        data.billing +=
          getBilling(row);

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
        monthNumber => {

          const industryMap =
            cleanMonthMap.get(
              monthNumber
            );


          let top = null;


          industryMap.forEach(
            data => {

              if (
                !top ||
                data.clients >
                  top.clients
              ) {

                top = data;

              }

            }
          );


          const month =
            financialMonths[
              orderedMonths.indexOf(
                monthNumber
              )
            ];


          return {

            month:
              month.full,

            monthShort:
              month.short,

            industry:
              top
                ? top.industry
                : "No Data",

            clients:
              top
                ? top.clients
                : 0,

            billing:
              top
                ? top.billing
                : 0

          };

        }
      );

    }, [
      selectedRows,
      selectedFinancialYear
    ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* =======================================================
     OPEN MODAL
  ======================================================= */

  function handleViewPerformance(
    industry
  ) {

    setSelectedIndustry(
      industry
    );

    setSelectedFinancialYear(
      ""
    );

  }


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function handleCloseModal() {

    setSelectedIndustry("");

    setSelectedFinancialYear("");

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="industry-performance-page">


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="industry-page-header">

        <div>

          <div className="industry-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            Industry Performance
          </h1>

          <p>
            Monitor industry-wise client
            acquisition, billing and
            financial performance.
          </p>

        </div>

      </div>


      {/* ===================================================
          INDUSTRY TABLE
      =================================================== */}

      <div className="industry-table-card">


        <div className="industry-table-header">

          <div>

            <h2>
              Industry Performance
            </h2>

            <p>
              Industry-wise performance overview
            </p>

          </div>


          <div className="industry-count">

            {industryData.length}

            <span>
              Industries
            </span>

          </div>

        </div>


        <div className="industry-table-wrapper">

          <table className="industry-table">

            <thead>

              <tr>

                <th>
                  Industry Name
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
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {industryData.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="industry-empty"
                  >
                    No industry data available.
                  </td>

                </tr>

              ) : (

                industryData.map(
                  industry => (

                    <tr
                      key={
                        industry.industry
                      }
                    >

                      <td>

                        <div className="industry-name">

                          <div className="industry-avatar">

                            {
                              industry.industry
                                .charAt(0)
                                .toUpperCase()
                            }

                          </div>

                          <span>
                            {
                              industry.industry
                            }
                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="industry-client-count">

                          {
                            industry.clients
                          }

                        </span>

                      </td>


                      <td>

                        <span className="industry-billing-value">

                          {
                            formatCurrency(
                              industry.billing
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <span className="industry-net-value">

                          {
                            formatCurrency(
                              industry.netAmount
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="industry-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              industry.industry
                            )
                          }
                        >

                          View

                          <span className="industry-view-arrow">
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

      {selectedIndustry && (

        <div
          className="industry-performance-overlay"
          onClick={handleCloseModal}
        >


          <div
            className="industry-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <div className="industry-modal-header">

              <div>

                <div className="industry-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>
                  {selectedIndustry}
                </h2>

                <p>
                  Industry performance analysis
                  and financial trends
                </p>

              </div>


              <button
                type="button"
                className="industry-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =============================================
                SUMMARY
            ============================================= */}

            <div className="industry-summary-grid">


              {/* TOP INDUSTRY + SUB INDUSTRIES */}

              <div className="industry-summary-card industry-top-industry-card">

                <span className="industry-summary-label">
                  Best Industry
                </span>

                <strong className="industry-summary-text">
                  {topIndustry.name}
                </strong>


                {topIndustrySubIndustries.length > 0 && (

                  <div className="industry-sub-industry-list">

                    {topIndustrySubIndustries.map(
                      subIndustry => (

                        <span
                          key={
                            subIndustry.name
                          }
                          className="industry-sub-industry-tag"
                        >

                          {subIndustry.name}

                          <small>
                            {subIndustry.count}
                          </small>

                        </span>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* TOTAL BILLING */}

              <div className="industry-summary-card">

                <span className="industry-summary-label">
                  Total Billing
                </span>

                <strong className="industry-summary-value">
                  {
                    formatCurrency(
                      performanceSummary.totalBilling
                    )
                  }
                </strong>

              </div>


              {/* FRANCHISE SHARE */}

              <div className="industry-summary-card industry-share-card">

                <span className="industry-summary-label">
                  Franchise Share Claimed
                </span>

                <strong className="industry-summary-value">
                  {
                    formatCurrency(
                      performanceSummary.totalFranchiseShare
                    )
                  }
                </strong>

              </div>


              {/* NET AMOUNT */}

              <div className="industry-summary-card industry-net-card">

                <span className="industry-summary-label">
                  Net Amount
                </span>

                <strong className="industry-summary-value">
                  {
                    formatCurrency(
                      performanceSummary.netAmount
                    )
                  }
                </strong>

              </div>


            </div>


            {/* =============================================
                FINANCIAL YEAR FILTER
            ============================================= */}

            <div className="industry-report-controls">

              <div>

                <label
                  htmlFor="industry-financial-year"
                >
                  Financial Year
                </label>


                <select
                  id="industry-financial-year"
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


              <div className="industry-report-period">

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
                TWO GRAPHS
            ============================================= */}

            <div className="industry-report-graphs">


              {/* ===========================================
                  CLIENT ACQUIRED
              =========================================== */}

              <div className="industry-chart-card">

                <div className="industry-chart-heading">

                  <div>

                    <span className="industry-chart-indicator industry-client-indicator"></span>

                    <h3>
                      Top Industry — Client Acquired
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


                <div className="industry-chart-container">

                  {reportData.length === 0 ? (

                    <div className="industry-no-chart-data">
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
                            <IndustryTooltip />
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


              {/* ===========================================
                  TOTAL BILLING
              =========================================== */}

              <div className="industry-chart-card">

                <div className="industry-chart-heading">

                  <div>

                    <span className="industry-chart-indicator industry-billing-indicator"></span>

                    <h3>
                      Top Industry — Total Billing
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


                <div className="industry-chart-container">

                  {reportData.length === 0 ? (

                    <div className="industry-no-chart-data">
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
                            <IndustryTooltip />
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

            <div className="industry-modal-footer">

              <span>

                {selectedFinancialYear
                  ? `Monthly report for ${selectedFinancialYear}`
                  : "Yearly performance report"}

              </span>


              <button
                type="button"
                className="industry-footer-close"
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


export default IndustryPerformance;