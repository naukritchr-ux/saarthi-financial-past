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
  { full: "April", short: "Apr" },
  { full: "May", short: "May" },
  { full: "June", short: "Jun" },
  { full: "July", short: "Jul" },
  { full: "August", short: "Aug" },
  { full: "September", short: "Sep" },
  { full: "October", short: "Oct" },
  { full: "November", short: "Nov" },
  { full: "December", short: "Dec" },
  { full: "January", short: "Jan" },
  { full: "February", short: "Feb" },
  { full: "March", short: "Mar" }
];


/* ============================================================
   HELPERS
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
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
};


const formatCurrency = (value) => {

  return `₹${toNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2
    }
  )}`;
};


const getCity = (row) => {

  return (
    row?.city ??
    row?.["City"] ??
    "Unknown"
  );
};


const getTeamLeader = (row) => {

  return (
    row?.team_leader ??
    row?.["Team Leader"] ??
    "Unknown"
  );
};


const getBDMember = (row) => {

  return (
    row?.bd_member ??
    row?.["BD Member"] ??
    "Unknown"
  );
};


/* ============================================================
   BILLING MUST COME FROM total_bill_amount
   ============================================================ */

const getBilling = (row) => {

  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    0
  );
};


/* ============================================================
   INFO STATUS
   ============================================================ */

const getInfoStatus = (row) => {

  return String(
    row?.info ??
    row?.["Info"] ??
    row?.["Info Status"] ??
    ""
  )
    .trim()
    .toUpperCase();
};


/* ============================================================
   FINANCIAL VALUES
   ============================================================

   ALL
   --------------------------------
   Total Billing = R + RV + C + CN
   City Expenditure = 5% of Billing
   Net Amount = Billing - Expenditure

   R
   --------------------------------
   Total Billing = R Billing
   City Expenditure = 5% of R Billing
   Net Amount = Billing - Expenditure

   RV
   --------------------------------
   Total Billing = RV Billing
   City Expenditure = 0
   Net Amount = Billing

   C
   --------------------------------
   Total Billing = C Billing
   City Expenditure = 0
   Net Amount = Billing

   CN
   --------------------------------
   Total Billing = CN Billing
   City Expenditure = 0
   Net Amount = Billing

   Franchise Share is NOT calculated.
   ============================================================ */

const getFinancialValues = (
  rows,
  infoStatus
) => {

  let totalBilling = 0;


  rows.forEach((row) => {

    const status =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    /*
      ALL
      Include every Info Status.
    */

    if (
      !infoStatus ||
      infoStatus === "All"
    ) {

      totalBilling += billing;

      return;
    }


    /*
      Specific Info Status
      Include only matching rows.
    */

    if (
      status === infoStatus
    ) {

      totalBilling += billing;

    }

  });


  /*
    City Expenditure

    All = 5%
    R   = 5%
    RV  = 0
    C   = 0
    CN  = 0
  */

  const cityExpenditure =
    !infoStatus ||
    infoStatus === "All" ||
    infoStatus === "R"
      ? totalBilling * 0.05
      : 0;


  /*
    Net Amount
  */

  const netAmount =
    totalBilling -
    cityExpenditure;


  return {

    totalBilling,

    netAmount,

    cityExpenditure

  };
};


/* ============================================================
   DATE HELPERS
   ============================================================ */

const getClientAcquiredDate = (row) => {

  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    row?.client_acquired_date ??
    row?.["Client Acquired Date"] ??
    null
  );
};


const getFinancialYear = (dateValue) => {

  if (!dateValue) {
    return null;
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

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
};


const getMonth = (dateValue) => {

  if (!dateValue) {
    return null;
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const monthIndex =
    date.getMonth();


  return financialMonths[
    monthIndex >= 3
      ? monthIndex - 3
      : monthIndex + 9
  ]?.full;
};


/* ============================================================
   MOST FREQUENT
   ============================================================ */

const getMostFrequent = (values) => {

  if (
    !values ||
    values.length === 0
  ) {
    return "N/A";
  }

  const counts = {};


  values.forEach((value) => {

    const cleaned =
      value === null ||
      value === undefined ||
      String(value).trim() === ""
        ? "Unknown"
        : String(value).trim();


    counts[cleaned] =
      (counts[cleaned] || 0) + 1;

  });


  return Object.entries(counts)
    .sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "N/A";
};


/* ============================================================
   TOOLTIP
   ============================================================ */

const CityTooltip = ({
  active,
  payload,
  label
}) => {

  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }


  return (

    <div className="city-chart-tooltip">

      <strong>
        {label}
      </strong>


      {payload.map(
        (item, index) => (

          <div key={index}>

            {item.name}:{" "}

            {item.name ===
            "Total Billing"

              ? formatCurrency(
                  item.value
                )

              : item.value}

          </div>

        )
      )}

    </div>

  );
};


/* ============================================================
   COMPONENT
   ============================================================ */

function CityPerformance() {

  const { rows } =
    useData();


  const [
    selectedCity,
    setSelectedCity
  ] = useState(null);


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");


  /* ============================================================
     CITY DATA
     ============================================================ */

  const cityData =
    useMemo(() => {

      if (
        !rows ||
        rows.length === 0
      ) {
        return [];
      }


      const grouped = {};


      rows.forEach((row) => {

        const city =
          getCity(row);


        if (!grouped[city]) {
          grouped[city] = [];
        }


        grouped[city].push(row);

      });


      return Object.entries(
        grouped
      )

        .map(
          ([city, cityRows]) => {

            /*
              Financial Year filter
            */

            const filteredRows =
              selectedFinancialYear
                ? cityRows.filter(
                    (row) =>
                      getFinancialYear(
                        getClientAcquiredDate(
                          row
                        )
                      ) ===
                      selectedFinancialYear
                  )
                : cityRows;


            /*
              Financial calculation
            */

            const financial =
              getFinancialValues(
                filteredRows,
                selectedInfoStatus
              );


            /*
              Client count

              If Info Status is selected,
              count only that status.
            */

            const clientCount =
              selectedInfoStatus
                ? filteredRows.filter(
                    (row) =>
                      getInfoStatus(
                        row
                      ) ===
                      selectedInfoStatus
                  ).length
                : filteredRows.length;


            return {

              city,

              clients:
                clientCount,

              totalBilling:
                financial.totalBilling,

              netAmount:
                financial.netAmount,

              cityExpenditure:
                financial.cityExpenditure

            };

          }
        )

        .filter(
          (item) =>
            item.clients > 0
        );

    }, [
      rows,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears =
    useMemo(() => {

      if (
        !rows ||
        rows.length === 0
      ) {
        return [];
      }


      const years =
        new Set();


      rows.forEach((row) => {

        const year =
          getFinancialYear(
            getClientAcquiredDate(
              row
            )
          );


        if (year) {
          years.add(year);
        }

      });


      return Array.from(years)
        .sort();

    }, [rows]);


  /* ============================================================
     SELECTED ROWS
     ============================================================ */

  const selectedRows =
    useMemo(() => {

      if (!selectedCity) {
        return [];
      }


      return (rows || [])
        .filter((row) => {

          const cityMatch =
            getCity(row) ===
            selectedCity;


          const yearMatch =
            !selectedFinancialYear ||
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            ) ===
            selectedFinancialYear;


          const infoMatch =
            !selectedInfoStatus ||
            getInfoStatus(row) ===
            selectedInfoStatus;


          return (
            cityMatch &&
            yearMatch &&
            infoMatch
          );

        });

    }, [
      rows,
      selectedCity,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* ============================================================
     ENQUIRY COUNT
     ============================================================ */

  const enquiryCount =
    selectedRows.length;


  /* ============================================================
     PERFORMANCE SUMMARY
     ============================================================ */

  const performanceSummary =
    useMemo(() => {

      /*
        selectedRows are already filtered
        by Info Status.

        Therefore calculate using "All"
        here so we don't filter twice.
      */

      return getFinancialValues(
        selectedRows,
        ""
      );

    }, [
      selectedRows
    ]);


  /* ============================================================
     TEAM LEADER / BD MEMBER
     ============================================================ */

  const teamLeader =
    getMostFrequent(
      selectedRows.map(
        getTeamLeader
      )
    );


  const bdMember =
    getMostFrequent(
      selectedRows.map(
        getBDMember
      )
    );


  /* ============================================================
     YEARLY REPORT
     ============================================================ */

  const yearlyReportData =
    useMemo(() => {

      if (!selectedCity) {
        return [];
      }


      const grouped = {};


      selectedRows.forEach(
        (row) => {

          const date =
            getClientAcquiredDate(
              row
            );


          if (!date) {
            return;
          }


          const year =
            getFinancialYear(
              date
            );


          if (!year) {
            return;
          }


          if (!grouped[year]) {
            grouped[year] = [];
          }


          grouped[year].push(row);

        }
      );


      return Object.entries(
        grouped
      )

        .sort(
          ([a], [b]) =>
            a.localeCompare(b)
        )

        .map(
          ([year, yearRows]) => {

            const financial =
              getFinancialValues(
                yearRows,
                ""
              );


            return {

              period: year,

              clients:
                yearRows.length,

              totalBilling:
                financial.totalBilling

            };

          }
        );

    }, [
      selectedRows,
      selectedCity
    ]);


  /* ============================================================
     MONTHLY REPORT
     ============================================================ */

  const monthlyReportData =
    useMemo(() => {

      if (
        !selectedCity ||
        !selectedFinancialYear
      ) {
        return [];
      }


      return financialMonths.map(
        (month) => {

          const monthRows =
            selectedRows.filter(
              (row) =>
                getMonth(
                  getClientAcquiredDate(
                    row
                  )
                ) === month.full
            );


          const financial =
            getFinancialValues(
              monthRows,
              ""
            );


          return {

            period:
              month.short,

            clients:
              monthRows.length,

            totalBilling:
              financial.totalBilling

          };

        }
      );

    }, [
      selectedRows,
      selectedCity,
      selectedFinancialYear
    ]);


  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* ============================================================
     VIEW PERFORMANCE
     ============================================================ */

  const handleViewPerformance =
    (city) => {

      setSelectedCity(city);

      setSelectedFinancialYear("");

      setSelectedInfoStatus("");

    };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const handleCloseModal = () => {

    setSelectedCity(null);

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (

    <div className="city-performance">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="city-performance-header">

        <div>

          <h2>
            City Performance
          </h2>

          <p>
            City-wise client and financial
            performance analysis
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN FILTERS
          ====================================================== */}

      <div className="city-filters">

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


      {/* ======================================================
          MAIN TABLE
          ====================================================== */}

      <div className="city-table-card">

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

              {cityData.length > 0 ? (

                cityData.map(
                  (item) => (

                    <tr
                      key={item.city}
                    >

                      <td>
                        {item.city}
                      </td>


                      <td>
                        {item.clients}
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
                          item.cityExpenditure
                        )}
                      </td>


                      <td>

                        <button
                          className="city-view-btn"
                          onClick={() =>
                            handleViewPerformance(
                              item.city
                            )
                          }
                        >
                          View Performance
                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="city-empty"
                  >
                    No city data available
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          PERFORMANCE MODAL
          ====================================================== */}

      {selectedCity && (

        <div className="city-modal-overlay">

          <div className="city-modal">


            {/* =================================================
                MODAL HEADER
                ================================================= */}

            <div className="city-modal-header">

              <div>

                <h2>
                  PERFORMANCE REPORT
                </h2>

                <p>
                  {selectedCity}
                </p>

              </div>


              <button
                className="city-close-btn"
                onClick={
                  handleCloseModal
                }
              >
                ×
              </button>

            </div>


            {/* =================================================
                SUMMARY
                ================================================= */}

            <div className="city-summary-grid">


              <div className="city-summary-card">

                <span>
                  City
                </span>

                <strong>
                  {selectedCity}
                </strong>

              </div>


              <div className="city-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </strong>

              </div>


              <div className="city-summary-card">

                <span>
                  Team Leader
                </span>

                <strong>
                  {teamLeader}
                </strong>

              </div>


              <div className="city-summary-card">

                <span>
                  BD Member
                </span>

                <strong>
                  {bdMember}
                </strong>

              </div>


              <div className="city-summary-card">

                <span>
                  Enquiries
                </span>

                <strong>
                  {enquiryCount}
                </strong>

              </div>


              <div className="city-summary-card">

                <span>
                  City Expenditure
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.cityExpenditure
                  )}
                </strong>

              </div>


              <div className="city-summary-card">

                <span>
                  Net Amount
                </span>

                <strong>
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


              <div>

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


              <div>

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


              <div>

                <label>
                  Report Period
                </label>


                <div className="city-report-period">

                  {selectedFinancialYear
                    ? `FY ${selectedFinancialYear} Monthly`
                    : "Yearly Report"}

                </div>

              </div>

            </div>


            {/* =================================================
                CLIENT ACQUIRED CHART
                ================================================= */}

            <div className="city-chart-card">

              <div className="city-chart-header">

                <h3>
                  Client Acquired
                </h3>

                <small>
                  {selectedFinancialYear
                    ? "Monthly"
                    : "Yearly"}
                </small>

              </div>


              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart
                  data={reportData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 20
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="period"
                  />


                  <YAxis />


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


            {/* =================================================
                BILLING CHART
                ================================================= */}

            <div className="city-chart-card">

              <div className="city-chart-header">

                <h3>
                  Total Billing
                </h3>

                <small>
                  {selectedFinancialYear
                    ? "Monthly"
                    : "Yearly"}
                </small>

              </div>


              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart
                  data={reportData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 20
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="period"
                  />


                  <YAxis />


                  <Tooltip
                    content={
                      <CityTooltip />
                    }
                  />


                  <Bar
                    dataKey="totalBilling"
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


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="city-modal-footer">

              <span>

                {selectedFinancialYear
                  ? `Monthly report for FY ${selectedFinancialYear}`
                  : "Yearly performance report"}

              </span>


              <button
                onClick={
                  handleCloseModal
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


export default CityPerformance;
