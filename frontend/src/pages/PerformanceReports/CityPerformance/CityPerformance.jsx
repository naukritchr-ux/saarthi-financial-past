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
   GET TEAM LEADER
========================================================= */

function getTeamLeader(row) {

  return String(
    row?.team_leader ??
    row?.["Team Leader"] ??
    ""
  ).trim();

}


/* =========================================================
   GET BD MEMBER
========================================================= */

function getBDMember(row) {

  return String(
    row?.bd_member ??
    row?.["BD Member"] ??
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
    row?.Info ??
    row?.["Info Status"] ??
    ""
  )
    .trim()
    .toUpperCase();

}


/* =========================================================
   GET BILLING

   DATABASE FIELD:
   total_bill_amount
========================================================= */

function getBilling(row) {

  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    0
  );

}


/* =========================================================
   GET FINANCIAL VALUES

   ALL:
   Billing = R + RV + C + CN
   Expenditure = Billing × 5%
   Net = Billing - Expenditure

   R:
   Billing = R
   Expenditure = R × 5%
   Net = R - Expenditure

   RV:
   Billing = RV
   Expenditure = 0
   Net = RV

   C:
   Billing = C
   Expenditure = 0
   Net = C

   CN:
   Billing = CN
   Expenditure = 0
   Net = CN
========================================================= */

function getFinancialValues(
  row,
  infoFilter = ""
) {

  const info =
    getInfoStatus(row);

  const billing =
    getBilling(row);


  /* =======================================================
     ALL
  ======================================================= */

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

      cityExpenditure:
        expenditure

    };

  }


  /* =======================================================
     R
  ======================================================= */

  if (
    infoFilter === "R"
  ) {

    if (info !== "R") {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0

      };

    }

    const expenditure =
      billing * 0.05;

    return {

      billing,

      netAmount:
        billing - expenditure,

      cityExpenditure:
        expenditure

    };

  }


  /* =======================================================
     RV
  ======================================================= */

  if (
    infoFilter === "RV"
  ) {

    if (info !== "RV") {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0

      };

    }

    return {

      billing,

      netAmount: billing,

      cityExpenditure: 0

    };

  }


  /* =======================================================
     C
  ======================================================= */

  if (
    infoFilter === "C"
  ) {

    if (info !== "C") {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0

      };

    }

    return {

      billing,

      netAmount: billing,

      cityExpenditure: 0

    };

  }


  /* =======================================================
     CN
  ======================================================= */

  if (
    infoFilter === "CN"
  ) {

    if (info !== "CN") {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0

      };

    }

    return {

      billing,

      netAmount: billing,

      cityExpenditure: 0

    };

  }


  return {

    billing: 0,

    netAmount: 0,

    cityExpenditure: 0

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
   MOST FREQUENT
========================================================= */

function getMostFrequent(
  rows,
  getter
) {

  const counts =
    new Map();

  rows.forEach(row => {

    const value =
      getter(row);

    if (!value) {
      return;
    }

    counts.set(
      value,
      (counts.get(value) || 0) + 1
    );

  });

  let best = "";

  let highest = 0;

  counts.forEach(
    (count, value) => {

      if (count > highest) {

        highest = count;

        best = value;

      }

    }
  );

  return best || "—";

}


/* =========================================================
   CUSTOM TOOLTIP
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

      {payload.map(
        (item, index) => (

          <div
            className="city-tooltip-row"
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

function CityPerformance() {

  const {
    rows = []
  } = useData();


  /* =======================================================
     STATE
  ======================================================= */

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


  /* =======================================================
     CITY SUMMARY TABLE
  ======================================================= */

  const cityData =
    useMemo(() => {

      const map =
        new Map();

      rows.forEach(row => {

        const city =
          getCity(row);

        if (!city) {
          return;
        }

        if (!map.has(city)) {

          map.set(
            city,
            {
              city,
              clients: 0,
              billing: 0,
              cityExpenditure: 0,
              netAmount: 0
            }
          );

        }

        const data =
          map.get(city);


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


        /*
         * When a specific Info Status
         * is selected, only that status
         * contributes to client count.
         */

        if (
          selectedInfoStatus &&
          getInfoStatus(row) !==
            selectedInfoStatus
        ) {

          return;

        }


        data.clients += 1;

        data.billing +=
          financialValues.billing;

        data.cityExpenditure +=
          financialValues.cityExpenditure;

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
     SELECTED CITY ROWS
  ======================================================= */

  const selectedRows =
    useMemo(() => {

      if (!selectedCity) {
        return [];
      }

      return rows.filter(
        row => {

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

        }
      );

    }, [
      rows,
      selectedCity,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;

      let totalCityExpenditure = 0;

      let netAmount = 0;

      selectedRows.forEach(row => {

        const values =
          getFinancialValues(
            row,
            selectedInfoStatus
          );

        totalBilling +=
          values.billing;

        totalCityExpenditure +=
          values.cityExpenditure;

        netAmount +=
          values.netAmount;

      });

      return {

        totalBilling,

        totalCityExpenditure,

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

      return getMostFrequent(
        selectedRows,
        getIndustry
      );

    }, [
      selectedRows
    ]);


  /* =======================================================
     BEST TEAM LEADER
  ======================================================= */

  const bestTeamLeader =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getTeamLeader
      );

    }, [
      selectedRows
    ]);


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
     OPEN MODAL
  ======================================================= */

  function handleViewPerformance(
    city
  ) {

    setSelectedCity(city);

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  }


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function handleCloseModal() {

    setSelectedCity("");

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="city-performance-page">


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="city-page-header">

        <div>

          <div className="city-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            City Performance
          </h1>

          <p>
            Monitor city acquisition,
            billing and financial performance.
          </p>

        </div>

      </div>


      {/* ===================================================
          MAIN TABLE
      =================================================== */}

      <div className="city-table-card">

        <div className="city-table-header">

          <div>

            <h2>
              City Performance
            </h2>

            <p>
              Complete city-wise
              performance overview
            </p>

          </div>


          <div className="city-member-count">

            {cityData.length}

            <span>
              Cities
            </span>

          </div>

        </div>


        {/* =================================================
            MAIN FILTERS
        ================================================= */}

        <div
          className="city-report-controls"
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


        <div className="city-table-wrapper">

          <table className="city-table">

            <thead>

              <tr>

                <th>
                  City Name
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
                  City Expenditure
                </th>

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {cityData.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="city-empty"
                  >
                    No city data available.
                  </td>

                </tr>

              ) : (

                cityData.map(
                  city => (

                    <tr
                      key={city.city}
                    >

                      <td>

                        <div className="city-name">

                          <div className="city-avatar">

                            {
                              city.city
                                .charAt(0)
                                .toUpperCase()
                            }

                          </div>

                          <span>
                            {city.city}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="city-client-count">

                          {city.clients}

                        </span>

                      </td>


                      <td>

                        <span className="city-billing-value">

                          {
                            formatCurrency(
                              city.billing
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <span className="city-net-value">

                          {
                            formatCurrency(
                              city.netAmount
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <span className="city-expenditure-value">

                          {
                            formatCurrency(
                              city.cityExpenditure
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="city-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              city.city
                            )
                          }
                        >

                          View

                          <span className="city-view-arrow">
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

      {selectedCity && (

        <div
          className="city-performance-overlay"
          onClick={handleCloseModal}
        >

          <div
            className="city-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <div className="city-modal-header">

              <div>

                <div className="city-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>
                  {selectedCity}
                </h2>

                <p>
                  City performance
                  analysis and financial trends
                </p>

              </div>


              <button
                type="button"
                className="city-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =============================================
                SUMMARY CARDS
            ============================================= */}

            <div className="city-summary-grid">


              {/* BEST INDUSTRY */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Best Industry
                </span>

                <strong className="city-summary-text">
                  {bestIndustry}
                </strong>

              </div>


              {/* BEST TEAM LEADER */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Best Team Leader
                </span>

                <strong className="city-summary-text">
                  {bestTeamLeader}
                </strong>

              </div>


              {/* TOTAL BILLING */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Total Billing
                </span>

                <strong className="city-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalBilling
                    )
                  }

                </strong>

              </div>


              {/* CITY EXPENDITURE */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  City Expenditure
                </span>

                <strong className="city-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalCityExpenditure
                    )
                  }

                </strong>

                <small>
                  5% of R / All Billing
                </small>

              </div>


              {/* NET AMOUNT */}

              <div className="city-summary-card city-summary-net">

                <span className="city-summary-label">
                  Net Amount
                </span>

                <strong className="city-summary-value">

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

            <div className="city-report-controls">

              <div>

                <label
                  htmlFor="city-financial-year"
                >
                  Financial Year
                </label>

                <select
                  id="city-financial-year"
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


              <div className="city-report-period">

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

            <div className="city-report-graphs">


              {/* CLIENT ACQUIRED */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>

                    <span className="city-chart-indicator city-client-indicator"></span>

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


                <div className="city-chart-container">

                  {reportData.length === 0 ? (

                    <div className="city-no-chart-data">
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

                  )}

                </div>

              </div>


              {/* TOTAL BILLING */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>

                    <span className="city-chart-indicator city-billing-indicator"></span>

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


                <div className="city-chart-container">

                  {reportData.length === 0 ? (

                    <div className="city-no-chart-data">
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

                  )}

                </div>

              </div>


            </div>


            {/* =============================================
                MODAL FOOTER
            ============================================= */}

            <div className="city-modal-footer">

              <span>

                {
                  selectedFinancialYear
                    ? `Monthly report for ${selectedFinancialYear}`
                    : "Yearly performance report"
                }

              </span>

              <button
                type="button"
                className="city-footer-close"
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


export default CityPerformance;
