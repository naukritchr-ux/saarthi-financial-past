import {
  useMemo,
  useState
} from "react";

import {
  useData
} from "../../../context/DataContext";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import "./FranchisePerformance.css";


/* =========================================================
   FINANCIAL YEAR MONTHS
   April -> March
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


  const number =
    Number(
      String(value)
        .replace(/,/g, "")
        .replace(/[₹$]/g, "")
        .trim()
    );


  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   FORMAT FULL CURRENCY
========================================================= */

function formatCurrency(value) {

  return `₹${toNumber(value).toLocaleString("en-IN")}`;

}


/* =========================================================
   GET FRANCHISE
========================================================= */

function getFranchise(row) {

  return String(
    row.franchise_name ??
    row["Franchise Name"] ??
    row.franchise ??
    row["Franchise"] ??
    ""
  ).trim();

}


/* =========================================================
   GET INDUSTRY
========================================================= */

function getIndustry(row) {

  return String(
    row.industry ??
    row["Industry"] ??
    ""
  ).trim();

}


/* =========================================================
   GET CITY
========================================================= */

function getCity(row) {

  return String(
    row.city ??
    row["City"] ??
    ""
  ).trim();

}


/* =========================================================
   GET BILLING
========================================================= */

function getBilling(row) {

  return toNumber(
    row.total_bill_amount ??
    row["Total Bill Amount"]
  );

}


/* =========================================================
   GET FRANCHISEE SHARE
========================================================= */

function getFranchiseeShare(row) {

  return toNumber(
    row.franchisee_share ??
    row["Franchisee Share"]
  );

}


/* =========================================================
   GET NET AMOUNT
========================================================= */

function getNetAmount(row) {

  const billing =
    getBilling(row);


  const franchiseeShare =
    getFranchiseeShare(row);


  return (
    billing -
    franchiseeShare
  );

}


/* =========================================================
   GET DATE CLIENT ACQUIRED
========================================================= */

function getClientAcquiredDate(row) {

  const value =
    row.date_client_acquired ??
    row["Date Client Acquired"];


  if (!value) {

    return null;

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;

}


/* =========================================================
   GET FINANCIAL YEAR
   April - March
========================================================= */

function getFinancialYear(row) {

  const date =
    getClientAcquiredDate(row);


  if (date) {

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


  /*
    Fallback for existing Aquired Year field
  */

  const acquiredYear =
    row.acquired_year ??
    row["Aquired Year"] ??
    row["Acquired Year"];


  if (
    acquiredYear === null ||
    acquiredYear === undefined ||
    acquiredYear === ""
  ) {

    return "";

  }


  const value =
    String(acquiredYear).trim();


  if (
    /^\d{4}-\d{2}$/.test(value)
  ) {

    return value;

  }


  if (
    /^\d{4}$/.test(value)
  ) {

    const year =
      Number(value);


    return `${year}-${String(
      year + 1
    ).slice(-2)}`;

  }


  return value;

}


/* =========================================================
   GET MONTH
========================================================= */

function getMonth(row) {

  const date =
    getClientAcquiredDate(row);


  if (!date) {

    return "";

  }


  return date.toLocaleString(
    "en-US",
    {
      month: "long"
    }
  );

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


      {
        payload.map(
          (item, index) => {

            const isBilling =
              item.dataKey === "billing";


            return (

              <div
                className="franchise-tooltip-row"
                key={index}
              >

                <span>
                  {
                    isBilling
                      ? "Total Billing"
                      : "Client Acquired"
                  }
                </span>


                <strong>
                  {
                    isBilling
                      ? formatCurrency(
                          item.value
                        )
                      : Number(
                          item.value || 0
                        ).toLocaleString(
                          "en-IN"
                        )
                  }
                </strong>

              </div>

            );

          }
        )
      }

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


  const [
    selectedFranchise,
    setSelectedFranchise
  ] = useState(null);


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  /* =======================================================
     ALL FRANCHISE DATA
  ======================================================= */

  const franchiseData =
    useMemo(() => {

      const franchiseMap =
        new Map();


      rows.forEach(
        (row) => {

          const franchise =
            getFranchise(row);


          if (!franchise) {

            return;

          }


          if (
            !franchiseMap.has(
              franchise
            )
          ) {

            franchiseMap.set(
              franchise,
              {
                name: franchise,
                clients: 0,
                billing: 0,
                netAmount: 0
              }
            );

          }


          const franchiseItem =
            franchiseMap.get(
              franchise
            );


          franchiseItem.clients += 1;


          franchiseItem.billing +=
            getBilling(row);


          franchiseItem.netAmount +=
            getNetAmount(row);

        }
      );


      return Array.from(
        franchiseMap.values()
      ).sort(
        (a, b) =>
          b.clients -
          a.clients
      );

    }, [rows]);


  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears =
    useMemo(() => {

      const yearSet =
        new Set();


      rows.forEach(
        (row) => {

          const year =
            getFinancialYear(row);


          if (year) {

            yearSet.add(year);

          }

        }
      );


      return Array.from(
        yearSet
      ).sort(
        (a, b) => {

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


          return yearA - yearB;

        }
      );

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
        (row) =>
          getFranchise(row) ===
          selectedFranchise
      );

    }, [
      rows,
      selectedFranchise
    ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let billing = 0;

      let netAmount = 0;


      selectedRows.forEach(
        (row) => {

          billing +=
            getBilling(row);


          netAmount +=
            getNetAmount(row);

        }
      );


      return {

        billing,

        netAmount

      };

    }, [selectedRows]);


  /* =======================================================
     BEST INDUSTRY
     Industry with highest acquired clients
  ======================================================= */

  const bestIndustry =
    useMemo(() => {

      const industryCounts =
        new Map();


      selectedRows.forEach(
        (row) => {

          const industry =
            getIndustry(row);


          if (!industry) {

            return;

          }


          industryCounts.set(
            industry,
            (
              industryCounts.get(
                industry
              ) || 0
            ) + 1
          );

        }
      );


      let bestIndustryName =
        "";

      let highestCount =
        0;


      industryCounts.forEach(
        (
          count,
          industry
        ) => {

          if (
            count >
            highestCount
          ) {

            highestCount =
              count;

            bestIndustryName =
              industry;

          }

        }
      );


      return (
        bestIndustryName ||
        "—"
      );

    }, [selectedRows]);


  /* =======================================================
     BEST CITY
     City with highest acquired clients
  ======================================================= */

  const bestCity =
    useMemo(() => {

      const cityCounts =
        new Map();


      selectedRows.forEach(
        (row) => {

          const city =
            getCity(row);


          if (!city) {

            return;

          }


          cityCounts.set(
            city,
            (
              cityCounts.get(
                city
              ) || 0
            ) + 1
          );

        }
      );


      let bestCityName =
        "";

      let highestCount =
        0;


      cityCounts.forEach(
        (
          count,
          city
        ) => {

          if (
            count >
            highestCount
          ) {

            highestCount =
              count;

            bestCityName =
              city;

          }

        }
      );


      return (
        bestCityName ||
        "—"
      );

    }, [selectedRows]);


  /* =======================================================
     YEARLY REPORT
========================================================= */

  const yearlyReportData =
    useMemo(() => {

      const yearlyMap =
        new Map();


      selectedRows.forEach(
        (row) => {

          const year =
            getFinancialYear(row);


          if (!year) {

            return;

          }


          if (
            !yearlyMap.has(year)
          ) {

            yearlyMap.set(
              year,
              {
                year,
                clients: 0,
                billing: 0
              }
            );

          }


          const yearData =
            yearlyMap.get(year);


          yearData.clients += 1;


          yearData.billing +=
            getBilling(row);

        }
      );


      return Array.from(
        yearlyMap.values()
      ).sort(
        (a, b) => {

          const yearA =
            Number(
              String(a.year).substring(
                0,
                4
              )
            );


          const yearB =
            Number(
              String(b.year).substring(
                0,
                4
              )
            );


          return yearA - yearB;

        }
      );

    }, [selectedRows]);


  /* =======================================================
     MONTHLY REPORT
     April -> March
  ======================================================= */

  const monthlyReportData =
    useMemo(() => {

      if (!selectedFinancialYear) {

        return [];

      }


      const monthMap =
        new Map();


      /*
        Create all 12 months first.
        This ensures months with zero
        clients are still displayed.
      */

      financialMonths.forEach(
        (month) => {

          monthMap.set(
            month.full,
            {
              month: month.full,
              monthShort: month.short,
              clients: 0,
              billing: 0
            }
          );

        }
      );


      selectedRows.forEach(
        (row) => {

          const rowYear =
            getFinancialYear(row);


          if (
            rowYear !==
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


          monthData.clients += 1;


          monthData.billing +=
            getBilling(row);

        }
      );


      return Array.from(
        monthMap.values()
      );

    }, [
      selectedRows,
      selectedFinancialYear
    ]);


  /* =======================================================
     ACTIVE GRAPH DATA
  ======================================================= */

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* =======================================================
     OPEN PERFORMANCE MODAL
  ======================================================= */

  function handleViewPerformance(
    franchiseName
  ) {

    setSelectedFranchise(
      franchiseName
    );


    /*
      Always open on yearly report.
    */

    setSelectedFinancialYear("");

  }


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function handleClosePerformance() {

    setSelectedFranchise(null);

    setSelectedFinancialYear("");

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
            PERFORMANCE REPORT
          </div>


          <h1>
            Franchise Performance
          </h1>


          <p>
            Franchise-wise client acquisition,
            billing and net amount overview.
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
              All franchise performance records
            </p>

          </div>


          <div className="franchise-member-count">

            {franchiseData.length}

            <span>
              Franchises
            </span>

          </div>

        </div>



        {
          franchiseData.length === 0 ? (

            <div className="franchise-empty">

              No franchise data available.

            </div>

          ) : (

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
                      Performance
                    </th>

                  </tr>

                </thead>



                <tbody>

                  {
                    franchiseData.map(
                      (franchise) => (

                        <tr
                          key={
                            franchise.name
                          }
                        >


                          {/* FRANCHISE NAME */}

                          <td>

                            <div className="franchise-name">

                              <div className="franchise-avatar">

                                {
                                  franchise.name
                                    .charAt(0)
                                    .toUpperCase()
                                }

                              </div>


                              <span>
                                {
                                  franchise.name
                                }
                              </span>

                            </div>

                          </td>



                          {/* CLIENTS */}

                          <td>

                            <span className="franchise-client-count">

                              {
                                franchise.clients
                                  .toLocaleString(
                                    "en-IN"
                                  )
                              }

                            </span>

                          </td>



                          {/* BILLING */}

                          <td>

                            <span className="franchise-billing-value">

                              {
                                formatCurrency(
                                  franchise.billing
                                )
                              }

                            </span>

                          </td>



                          {/* NET AMOUNT */}

                          <td>

                            <span className="franchise-net-value">

                              {
                                formatCurrency(
                                  franchise.netAmount
                                )
                              }

                            </span>

                          </td>



                          {/* PERFORMANCE */}

                          <td>

                            <button
                              type="button"
                              className="franchise-view-performance-btn"
                              onClick={() =>
                                handleViewPerformance(
                                  franchise.name
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
                  }

                </tbody>


              </table>

            </div>

          )
        }

      </div>



      {/* ===================================================
          PERFORMANCE MODAL
      =================================================== */}

      {
        selectedFranchise && (

          <div
            className="franchise-performance-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                handleClosePerformance();

              }

            }}
          >


            <div className="franchise-performance-modal">


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
                    Franchise performance analysis
                  </p>

                </div>



                <button
                  type="button"
                  className="franchise-modal-close"
                  onClick={
                    handleClosePerformance
                  }
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

                  <span>
                    Best Industry
                  </span>


                  <strong>
                    {bestIndustry}
                  </strong>


                  <small>
                    Highest client acquisition
                  </small>

                </div>



                {/* BEST CITY */}

                <div className="franchise-summary-card">

                  <span>
                    Best City
                  </span>


                  <strong>
                    {bestCity}
                  </strong>


                  <small>
                    Highest client acquisition
                  </small>

                </div>



                {/* TOTAL BILLING */}

                <div className="franchise-summary-card">

                  <span>
                    Total Billing
                  </span>


                  <strong>
                    {
                      formatCurrency(
                        performanceSummary.billing
                      )
                    }
                  </strong>


                  <small>
                    Total billing generated
                  </small>

                </div>



                {/* NET AMOUNT */}

                <div className="franchise-summary-card">

                  <span>
                    Net Amount
                  </span>


                  <strong>
                    {
                      formatCurrency(
                        performanceSummary.netAmount
                      )
                    }
                  </strong>


                  <small>
                    Billing less franchisee share
                  </small>

                </div>


              </div>



              {/* =============================================
                  FINANCIAL YEAR FILTER
              ============================================= */}

              <div className="franchise-report-controls">


                <div className="franchise-report-period">

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
                    onChange={(event) =>
                      setSelectedFinancialYear(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      None
                    </option>


                    {
                      financialYears.map(
                        (year) => (

                          <option
                            key={year}
                            value={year}
                          >
                            {year}
                          </option>

                        )
                      )
                    }

                  </select>

                </div>



                <div className="franchise-report-period-info">

                  {
                    selectedFinancialYear
                      ? `Monthly Report — ${selectedFinancialYear}`
                      : "Yearly Report"
                  }

                </div>

              </div>



              {/* =============================================
                  TWO GRAPHS
              ============================================= */}

              <div className="franchise-report-graphs">


                {/* ===========================================
                    CLIENT ACQUIRED GRAPH
                =========================================== */}

                <div className="franchise-chart-card">


                  <div className="franchise-chart-heading">

                    <div>

                      <span className="franchise-chart-indicator franchise-client-indicator" />


                      <div>

                        <h3>
                          Client Acquired
                        </h3>


                        <p>

                          {
                            selectedFinancialYear
                              ? "Monthly client acquisition"
                              : "Yearly client acquisition"
                          }

                        </p>

                      </div>

                    </div>

                  </div>



                  <div className="franchise-chart-container">

                    {
                      reportData.length > 0 ? (

                        <ResponsiveContainer
                          width="100%"
                          height={300}
                        >

                          <BarChart
                            data={reportData}
                            margin={{
                              top: 10,
                              right: 15,
                              left: 0,
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
                                fontSize: 12,
                                fill: "#5B6472"
                              }}
                              tickLine={false}
                              axisLine={false}
                            />


                            <YAxis
                              allowDecimals={false}
                              tick={{
                                fontSize: 12,
                                fill: "#5B6472"
                              }}
                              tickLine={false}
                              axisLine={false}
                            />


                            <Tooltip
                              content={
                                <FranchiseTooltip />
                              }
                              cursor={{
                                fill:
                                  "rgba(183,138,52,0.08)"
                              }}
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
                              maxBarSize={48}
                            />

                          </BarChart>

                        </ResponsiveContainer>

                      ) : (

                        <div className="franchise-no-chart-data">

                          No client acquisition data
                          available.

                        </div>

                      )
                    }

                  </div>

                </div>



                {/* ===========================================
                    TOTAL BILLING GRAPH
                =========================================== */}

                <div className="franchise-chart-card">


                  <div className="franchise-chart-heading">

                    <div>

                      <span className="franchise-chart-indicator franchise-billing-indicator" />


                      <div>

                        <h3>
                          Total Billing
                        </h3>


                        <p>

                          {
                            selectedFinancialYear
                              ? "Monthly billing"
                              : "Yearly billing"
                          }

                        </p>

                      </div>

                    </div>

                  </div>



                  <div className="franchise-chart-container">

                    {
                      reportData.length > 0 ? (

                        <ResponsiveContainer
                          width="100%"
                          height={300}
                        >

                          <BarChart
                            data={reportData}
                            margin={{
                              top: 10,
                              right: 15,
                              left: 0,
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
                                fontSize: 12,
                                fill: "#5B6472"
                              }}
                              tickLine={false}
                              axisLine={false}
                            />


                            <YAxis
                              tick={{
                                fontSize: 12,
                                fill: "#5B6472"
                              }}
                              tickLine={false}
                              axisLine={false}
                            />


                            <Tooltip
                              content={
                                <FranchiseTooltip />
                              }
                              cursor={{
                                fill:
                                  "rgba(38,115,77,0.08)"
                              }}
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
                              maxBarSize={48}
                            />

                          </BarChart>

                        </ResponsiveContainer>

                      ) : (

                        <div className="franchise-no-chart-data">

                          No billing data
                          available.

                        </div>

                      )
                    }

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
                      ? `Showing monthly performance for ${selectedFinancialYear}`
                      : "Showing yearly performance"
                  }

                </span>


                <button
                  type="button"
                  className="franchise-footer-close"
                  onClick={
                    handleClosePerformance
                  }
                >

                  Close

                </button>

              </div>


            </div>

          </div>

        )

      }

    </div>

  );

}


export default FranchisePerformance;