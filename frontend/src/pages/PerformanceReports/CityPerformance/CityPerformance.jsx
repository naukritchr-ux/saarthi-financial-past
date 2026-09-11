import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./CityPerformance.css";


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
  { full: "March", short: "Mar" },
];


// ---------------------------------------------------------
// NUMBER HELPERS
// ---------------------------------------------------------

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


  const cleanedValue =
    String(value)
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


function formatCurrency(value) {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    toNumber(value)
  );

}


// ---------------------------------------------------------
// DATA HELPERS
// ---------------------------------------------------------

function getCity(row) {

  return String(
    row?.city ??
      row?.["City"] ??
      ""
  ).trim();

}


function getTeamLeader(row) {

  return String(
    row?.team_leader ??
      row?.["Team Leader"] ??
      ""
  ).trim();

}


function getBDMember(row) {

  return String(
    row?.bd_member ??
      row?.["BD Member"] ??
      ""
  ).trim();

}


// ---------------------------------------------------------
// BILLING
// IMPORTANT:
// Billing is taken ONLY from total_bill_amount.
// No TANN / TDS is used.
// ---------------------------------------------------------

function getBilling(row) {

  return toNumber(
    row?.total_bill_amount ??
      row?.["Total Bill Amount"] ??
      0
  );

}


// ---------------------------------------------------------
// FRANCHISE SHARE
// ---------------------------------------------------------

function getFranchiseeShare(row) {

  return toNumber(
    row?.franchisee_share ??
      row?.["Franchisee Share"] ??
      0
  );

}


// ---------------------------------------------------------
// INFO STATUS
// ---------------------------------------------------------

function getInfoStatus(row) {

  return String(
    row?.info ??
      row?.["Info"] ??
      row?.["Info Status"] ??
      ""
  )
    .trim()
    .toUpperCase();

}


// ---------------------------------------------------------
// FINANCIAL CALCULATION
//
// ALL:
// Billing = R + RV + C + CN
// Net = Billing - Franchise Share
// Expenditure = 5% of Billing
//
// R:
// Billing = R
// Net = R Billing - R Franchise Share
// Expenditure = 5% of R Billing
//
// RV / C / CN:
// Billing = selected status billing
// Net = 0
// Expenditure = 5% of selected status billing
// ---------------------------------------------------------

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


  // ALL

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {

    return {

      billing,

      netAmount:
        billing -
        franchiseeShare,

      cityExpenditure:
        billing * 0.05,

    };

  }


  // R

  if (
    infoFilter === "R"
  ) {

    if (
      info !== "R"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0,

      };

    }


    return {

      billing,

      netAmount:
        billing -
        franchiseeShare,

      cityExpenditure:
        billing * 0.05,

    };

  }


  // RV

  if (
    infoFilter === "RV"
  ) {

    if (
      info !== "RV"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0,

      };

    }


    return {

      billing,

      netAmount: 0,

      cityExpenditure:
        billing * 0.05,

    };

  }


  // C

  if (
    infoFilter === "C"
  ) {

    if (
      info !== "C"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0,

      };

    }


    return {

      billing,

      netAmount: 0,

      cityExpenditure:
        billing * 0.05,

    };

  }


  // CN

  if (
    infoFilter === "CN"
  ) {

    if (
      info !== "CN"
    ) {

      return {

        billing: 0,

        netAmount: 0,

        cityExpenditure: 0,

      };

    }


    return {

      billing,

      netAmount: 0,

      cityExpenditure:
        billing * 0.05,

    };

  }


  return {

    billing: 0,

    netAmount: 0,

    cityExpenditure: 0,

  };

}


// ---------------------------------------------------------
// CLIENT ACQUIRED DATE
// ---------------------------------------------------------

function getClientAcquiredDate(row) {

  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    ""
  );

}


// ---------------------------------------------------------
// FINANCIAL YEAR
// ---------------------------------------------------------

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


      if (
        month >= 4
      ) {

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


// ---------------------------------------------------------
// MONTH
// ---------------------------------------------------------

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


// ---------------------------------------------------------
// MOST FREQUENT VALUE
// ---------------------------------------------------------

function getMostFrequent(
  rows,
  getter
) {

  const countMap =
    new Map();


  rows.forEach(
    (row) => {

      const value =
        getter(row);


      if (!value) {

        return;

      }


      countMap.set(
        value,
        (
          countMap.get(value) ||
          0
        ) + 1
      );

    }
  );


  let bestValue = "";

  let highestCount = 0;


  countMap.forEach(
    (count, value) => {

      if (
        count >
        highestCount
      ) {

        highestCount =
          count;

        bestValue =
          value;

      }

    }
  );


  return {

    value:
      bestValue,

    count:
      highestCount,

  };

}


// ---------------------------------------------------------
// CUSTOM TOOLTIP
// ---------------------------------------------------------

function CityTooltip({
  active,
  payload,
  label,
}) {

  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {

    return null;

  }


  const city =
    payload[0]?.payload?.city;


  return (

    <div className="city-modern-tooltip">

      <div className="city-tooltip-label">
        {label}
      </div>


      {city && (

        <div className="city-tooltip-city">
          {city}
        </div>

      )}


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

              {item.name ===
                "Total Billing"

                ? formatCurrency(
                    item.value
                  )

                : Number(
                    item.value || 0
                  ).toLocaleString(
                    "en-IN"
                  )}

            </strong>

          </div>

        )
      )}

    </div>

  );

}


// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------

function CityPerformance() {

  const {
    rows = []
  } = useData();


  const [
    selectedCity,
    setSelectedCity,
  ] = useState("");


  const [
    selectedFinancialYear,
    setSelectedFinancialYear,
  ] = useState("");


  const [
    selectedInfoStatus,
    setSelectedInfoStatus,
  ] = useState("");


  // -------------------------------------------------------
  // CITY TABLE DATA
  // -------------------------------------------------------

  const cityData =
    useMemo(() => {

      const cityMap =
        new Map();


      rows.forEach(
        (row) => {

          const city =
            getCity(row);


          if (!city) {

            return;

          }


          if (
            !cityMap.has(city)
          ) {

            cityMap.set(
              city,
              {
                city,
                clients: 0,
                billing: 0,
                netAmount: 0,
                cityExpenditure: 0,
              }
            );

          }


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


          const data =
            cityMap.get(city);


          data.clients += 1;


          data.billing +=
            financialValues.billing;


          data.netAmount +=
            financialValues.netAmount;


          data.cityExpenditure +=
            financialValues.cityExpenditure;

        }
      );


      return Array.from(
        cityMap.values()
      )
        .filter(
          item =>
            item.clients > 0
        )
        .sort(
          (a, b) =>
            b.clients -
            a.clients
        );

    }, [
      rows,
      selectedFinancialYear,
      selectedInfoStatus,
    ]);


  // -------------------------------------------------------
  // FINANCIAL YEARS
  // -------------------------------------------------------

  const financialYears =
    useMemo(() => {

      const years =
        new Set();


      rows.forEach(
        (row) => {

          const year =
            getFinancialYear(row);


          if (year) {

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
              String(a).slice(
                0,
                4
              )
            );


          const yearB =
            Number(
              String(b).slice(
                0,
                4
              )
            );


          return (
            yearA -
            yearB
          );

        }
      );

    }, [rows]);


  // -------------------------------------------------------
  // SELECTED CITY ROWS
  // -------------------------------------------------------

  const selectedRows =
    useMemo(() => {

      if (!selectedCity) {

        return [];

      }


      return rows.filter(
        (row) => {

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


          return true;

        }
      );

    }, [
      rows,
      selectedCity,
      selectedFinancialYear,
    ]);


  // -------------------------------------------------------
  // ENQUIRY COUNT
  // -------------------------------------------------------

  const enquiryCount =
    useMemo(() => {

      return selectedRows.length;

    }, [selectedRows]);


  // -------------------------------------------------------
  // PERFORMANCE SUMMARY
  // -------------------------------------------------------

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;

      let totalFranchiseShare = 0;

      let netAmount = 0;

      let cityExpenditure = 0;


      selectedRows.forEach(
        (row) => {

          const financialValues =
            getFinancialValues(
              row,
              selectedInfoStatus
            );


          totalBilling +=
            financialValues.billing;


          if (
            !selectedInfoStatus ||
            selectedInfoStatus === "R"
          ) {

            totalFranchiseShare +=
              getFranchiseeShare(
                row
              );

          }


          netAmount +=
            financialValues.netAmount;


          cityExpenditure +=
            financialValues.cityExpenditure;

        }
      );


      return {

        city:
          selectedCity,

        totalBilling,

        totalFranchiseShare,

        netAmount,

        cityExpenditure,

      };

    }, [
      selectedRows,
      selectedCity,
      selectedInfoStatus,
    ]);


  // -------------------------------------------------------
  // TEAM LEADER
  // -------------------------------------------------------

  const teamLeader =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getTeamLeader
      );

    }, [selectedRows]);


  // -------------------------------------------------------
  // BD MEMBER
  // -------------------------------------------------------

  const bdMember =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getBDMember
      );

    }, [selectedRows]);


  // -------------------------------------------------------
  // YEARLY REPORT
  // -------------------------------------------------------

  const yearlyReportData =
    useMemo(() => {

      const yearMap =
        new Map();


      rows.forEach(
        (row) => {

          const year =
            getFinancialYear(row);


          const city =
            getCity(row);


          if (
            !year ||
            !city
          ) {

            return;

          }


          if (
            selectedCity &&
            city !== selectedCity
          ) {

            return;

          }


          if (
            !yearMap.has(year)
          ) {

            yearMap.set(
              year,
              {
                city,
                clients: 0,
                billing: 0,
              }
            );

          }


          const data =
            yearMap.get(year);


          const financialValues =
            getFinancialValues(
              row,
              selectedInfoStatus
            );


          data.clients += 1;


          data.billing +=
            financialValues.billing;

        }
      );


      return Array.from(
        yearMap.entries()
      )
        .map(
          ([year, data]) => ({

            year,

            city:
              selectedCity ||
              data.city,

            clients:
              data.clients,

            billing:
              data.billing,

          })
        )
        .sort(
          (a, b) => {

            const yearA =
              Number(
                String(a.year).slice(
                  0,
                  4
                )
              );


            const yearB =
              Number(
                String(b.year).slice(
                  0,
                  4
                )
              );


            return (
              yearA -
              yearB
            );

          }
        );

    }, [
      rows,
      selectedCity,
      selectedInfoStatus,
    ]);


  // -------------------------------------------------------
  // MONTHLY REPORT
  // -------------------------------------------------------

  const monthlyReportData =
    useMemo(() => {

      if (
        !selectedFinancialYear
      ) {

        return [];

      }


      const monthNumbers = [
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
        3,
      ];


      return monthNumbers.map(
        (
          monthNumber,
          index
        ) => {

          const monthInfo =
            financialMonths[
              index
            ];


          const monthRows =
            rows.filter(
              (row) => {

                if (
                  getFinancialYear(
                    row
                  ) !==
                    selectedFinancialYear
                ) {

                  return false;

                }


                if (
                  getMonth(row) !==
                  monthNumber
                ) {

                  return false;

                }


                if (
                  selectedCity &&
                  getCity(row) !==
                    selectedCity
                ) {

                  return false;

                }


                return true;

              }
            );


          let clients = 0;

          let billing = 0;


          monthRows.forEach(
            (row) => {

              const financialValues =
                getFinancialValues(
                  row,
                  selectedInfoStatus
                );


              clients += 1;


              billing +=
                financialValues.billing;

            }
          );


          return {

            month:
              monthInfo.full,

            monthShort:
              monthInfo.short,

            city:
              selectedCity ||
              "All Cities",

            clients,

            billing,

          };

        }
      );

    }, [
      rows,
      selectedFinancialYear,
      selectedCity,
      selectedInfoStatus,
    ]);


  // -------------------------------------------------------
  // REPORT DATA
  // -------------------------------------------------------

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  // -------------------------------------------------------
  // OPEN MODAL
  // -------------------------------------------------------

  function handleViewPerformance(
    city
  ) {

    setSelectedCity(
      city
    );

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  }


  // -------------------------------------------------------
  // CLOSE MODAL
  // -------------------------------------------------------

  function handleCloseModal() {

    setSelectedCity("");

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  }


  // -------------------------------------------------------
  // JSX
  // -------------------------------------------------------

  return (

    <div className="city-performance-page">


      {/* PAGE HEADER */}

      <div className="city-page-header">

        <div>

          <div className="city-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            City Performance
          </h1>

          <p>
            Monitor city-wise client
            acquisition, billing and
            financial performance.
          </p>

        </div>

      </div>


      {/* MAIN TABLE */}

      <div className="city-table-card">

        <div className="city-table-header">

          <div>

            <h2>
              City Performance
            </h2>

            <span className="city-count">
              {cityData.length} Cities
            </span>

          </div>

        </div>


        {/* MAIN FILTERS */}

        <div
          className="city-report-controls"
          style={{
            marginBottom: "20px",
          }}
        >

          <div className="city-report-period">

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


          <div className="city-report-period">

            <label>
              Info Status
            </label>

            <select
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
                  (city) => (

                    <tr
                      key={
                        city.city
                      }
                    >

                      <td>

                        <div className="city-name">

                          <div className="city-avatar">

                            {city.city
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <span>
                            {city.city}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="city-client-count">

                          {city.clients.toLocaleString(
                            "en-IN"
                          )}

                        </span>

                      </td>


                      <td>

                        <span className="city-billing-value">

                          {formatCurrency(
                            city.billing
                          )}

                        </span>

                      </td>


                      <td>

                        <span className="city-net-value">

                          {formatCurrency(
                            city.netAmount
                          )}

                        </span>

                      </td>


                      <td>

                        <span className="city-net-value">

                          {formatCurrency(
                            city.cityExpenditure
                          )}

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


      {/* PERFORMANCE MODAL */}

      {selectedCity && (

        <div
          className="city-performance-overlay"
          onClick={
            handleCloseModal
          }
        >

          <div
            className="city-performance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* MODAL HEADER */}

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
                  analysis and financial
                  trends
                </p>

              </div>


              <button
                type="button"
                className="city-modal-close"
                onClick={
                  handleCloseModal
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* SUMMARY CARDS */}

            <div className="city-summary-grid">


              {/* CITY */}

              <div className="city-summary-card city-top-city-card">

                <span className="city-summary-label">
                  City
                </span>

                <strong className="city-summary-text">

                  {performanceSummary.city ||
                    "—"}

                </strong>

              </div>


              {/* TOTAL BILLING */}

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


              {/* TEAM LEADER */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Team Leader
                </span>

                <strong className="city-summary-text">

                  {teamLeader.value ||
                    "—"}

                </strong>


                {teamLeader.count >
                  0 && (

                  <small className="city-summary-count">

                    {teamLeader.count}
                    {" "}
                    acquired clients

                  </small>

                )}

              </div>


              {/* BD MEMBER */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  BD Member
                </span>

                <strong className="city-summary-text">

                  {bdMember.value ||
                    "—"}

                </strong>


                {bdMember.count >
                  0 && (

                  <small className="city-summary-count">

                    {bdMember.count}
                    {" "}
                    acquired clients

                  </small>

                )}

              </div>


              {/* ENQUIRIES */}

              <div className="city-summary-card city-enquiry-card">

                <span className="city-summary-label">
                  Enquiries
                </span>

                <strong className="city-summary-value">

                  {enquiryCount.toLocaleString(
                    "en-IN"
                  )}

                </strong>

                <small className="city-summary-count">
                  Total enquiries
                </small>

              </div>


              {/* FRANCHISE SHARE */}

              <div className="city-summary-card city-share-card">

                <span className="city-summary-label">
                  Franchise Share Claimed
                </span>

                <strong className="city-summary-value">

                  {formatCurrency(
                    performanceSummary.totalFranchiseShare
                  )}

                </strong>

              </div>


              {/* CITY EXPENDITURE */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  City Expenditure
                </span>

                <strong className="city-summary-value">

                  {formatCurrency(
                    performanceSummary.cityExpenditure
                  )}

                </strong>

                <small>
                  5% of Gross Revenue
                </small>

              </div>


              {/* NET AMOUNT */}

              <div className="city-summary-card city-net-card">

                <span className="city-summary-label">
                  Net Amount
                </span>

                <strong className="city-summary-value">

                  {formatCurrency(
                    performanceSummary.netAmount
                  )}

                </strong>

              </div>

            </div>


            {/* REPORT CONTROLS */}

            <div className="city-report-controls">

              <div className="city-report-period">

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
                    None
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


              <div className="city-report-period">

                <label>
                  Info Status
                </label>

                <select
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

                  {selectedFinancialYear
                    ? "Monthly"
                    : "Yearly"}

                </strong>

              </div>

            </div>


            {/* GRAPHS */}

            <div className="city-report-graphs">


              {/* CLIENT ACQUIRED GRAPH */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>

                    <span className="city-chart-indicator city-client-indicator"></span>

                    <h3>
                      Client Acquired
                    </h3>

                  </div>

                  <span>

                    {selectedFinancialYear
                      ? "Monthly"
                      : "Yearly"}

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
                          bottom: 5,
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
                          }}
                          tickLine={false}
                          axisLine={false}
                        />


                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 12,
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
                            0,
                          ]}
                          barSize={32}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  )}

                </div>

              </div>


              {/* TOTAL BILLING GRAPH */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>

                    <span className="city-chart-indicator city-billing-indicator"></span>

                    <h3>
                      Total Billing
                    </h3>

                  </div>

                  <span>

                    {selectedFinancialYear
                      ? "Monthly"
                      : "Yearly"}

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
                          bottom: 5,
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
                          }}
                          tickLine={false}
                          axisLine={false}
                        />


                        <YAxis
                          tick={{
                            fontSize: 12,
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
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
                            0,
                          ]}
                          barSize={32}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  )}

                </div>

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="city-modal-footer">

              <span>

                {selectedFinancialYear
                  ? `Monthly report for ${selectedFinancialYear}`
                  : "Yearly performance report"}

              </span>


              <button
                type="button"
                className="city-footer-close"
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
