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

import "./IndustryPerformance.css";


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
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const cleanedValue = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .trim();

  const number = Number(cleanedValue);

  return Number.isFinite(number) ? number : 0;
}


function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}


// ---------------------------------------------------------
// DATA HELPERS
// ---------------------------------------------------------

function getIndustry(row) {
  return String(
    row?.industry ??
      row?.["Industry"] ??
      ""
  ).trim();
}


function getSubIndustry(row) {
  return String(
    row?.sub_industry ??
      row?.["Sub Industry"] ??
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


function getBilling(row) {
  return toNumber(
    row?.total_bill_amount ??
      row?.["Total Bill Amount"]
  );
}


function getFranchiseeShare(row) {
  return toNumber(
    row?.franchisee_share ??
      row?.["Franchisee Share"]
  );
}


function getNetAmount(row) {
  return (
    getBilling(row) -
    getFranchiseeShare(row)
  );
}


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
  const dateValue = getClientAcquiredDate(row);

  if (dateValue) {
    const date = new Date(dateValue);

    if (!Number.isNaN(date.getTime())) {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`;
      }

      return `${year - 1}-${String(year).slice(-2)}`;
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
      return `${year}-${String(year + 1).slice(-2)}`;
    }
  }

  return "";
}


// ---------------------------------------------------------
// MONTH
// ---------------------------------------------------------

function getMonth(row) {
  const dateValue = getClientAcquiredDate(row);

  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.getMonth() + 1;
}


// ---------------------------------------------------------
// MOST FREQUENT VALUE
// ---------------------------------------------------------

function getMostFrequent(rows, getter) {
  const countMap = new Map();

  rows.forEach((row) => {
    const value = getter(row);

    if (!value) {
      return;
    }

    countMap.set(
      value,
      (countMap.get(value) || 0) + 1
    );
  });

  let bestValue = "";
  let highestCount = 0;

  countMap.forEach((count, value) => {
    if (count > highestCount) {
      highestCount = count;
      bestValue = value;
    }
  });

  return {
    value: bestValue,
    count: highestCount,
  };
}


// ---------------------------------------------------------
// CUSTOM TOOLTIP
// ---------------------------------------------------------

function IndustryTooltip({
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

  const industry =
    payload[0]?.payload?.industry;

  return (
    <div className="industry-modern-tooltip">

      <div className="industry-tooltip-label">
        {label}
      </div>

      {industry && (
        <div className="industry-tooltip-industry">
          {industry}
        </div>
      )}

      {payload.map((item, index) => (
        <div
          className="industry-tooltip-row"
          key={index}
        >
          <span>
            {item.name}
          </span>

          <strong>
            {item.name === "Total Billing"
              ? formatCurrency(item.value)
              : Number(
                  item.value || 0
                ).toLocaleString("en-IN")}
          </strong>
        </div>
      ))}

    </div>
  );
}


// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------

function IndustryPerformance() {

  const { rows = [] } = useData();

  const [
    selectedIndustry,
    setSelectedIndustry,
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear,
  ] = useState("");


  // -------------------------------------------------------
  // INDUSTRY TABLE DATA
  // -------------------------------------------------------

  const industryData = useMemo(() => {

    const industryMap = new Map();

    rows.forEach((row) => {

      const industry = getIndustry(row);

      if (!industry) {
        return;
      }

      if (!industryMap.has(industry)) {
        industryMap.set(industry, {
          industry,
          clients: 0,
          billing: 0,
          netAmount: 0,
        });
      }

      const data =
        industryMap.get(industry);

      data.clients += 1;

      data.billing += getBilling(row);

      data.netAmount += getNetAmount(row);
    });

    return Array.from(
      industryMap.values()
    ).sort(
      (a, b) =>
        b.clients - a.clients
    );

  }, [rows]);


  // -------------------------------------------------------
  // FINANCIAL YEARS
  // -------------------------------------------------------

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const year =
        getFinancialYear(row);

      if (year) {
        years.add(year);
      }

    });

    return Array.from(years).sort(
      (a, b) => {

        const yearA = Number(
          String(a).slice(0, 4)
        );

        const yearB = Number(
          String(b).slice(0, 4)
        );

        return yearA - yearB;
      }
    );

  }, [rows]);


  // -------------------------------------------------------
  // SELECTED INDUSTRY ROWS
  // -------------------------------------------------------

  const selectedRows = useMemo(() => {

    if (!selectedIndustry) {
      return [];
    }

    return rows.filter(
      (row) =>
        getIndustry(row) ===
        selectedIndustry
    );

  }, [rows, selectedIndustry]);


  // -------------------------------------------------------
  // ENQUIRY COUNT
  // -------------------------------------------------------

  const enquiryCount = useMemo(() => {

    return selectedRows.length;

  }, [selectedRows]);


  // -------------------------------------------------------
  // PERFORMANCE SUMMARY
  // -------------------------------------------------------

  const performanceSummary = useMemo(() => {

    let totalBilling = 0;

    let totalFranchiseShare = 0;

    let netAmount = 0;

    selectedRows.forEach((row) => {

      totalBilling +=
        getBilling(row);

      totalFranchiseShare +=
        getFranchiseeShare(row);

      netAmount +=
        getNetAmount(row);

    });

    return {
      industry: selectedIndustry,
      totalBilling,
      totalFranchiseShare,
      netAmount,
    };

  }, [
    selectedRows,
    selectedIndustry,
  ]);


  // -------------------------------------------------------
  // SUB INDUSTRIES
  // -------------------------------------------------------

  const subIndustryData = useMemo(() => {

    const subIndustryMap =
      new Map();

    selectedRows.forEach((row) => {

      const subIndustry =
        getSubIndustry(row);

      if (!subIndustry) {
        return;
      }

      subIndustryMap.set(
        subIndustry,
        (
          subIndustryMap.get(
            subIndustry
          ) || 0
        ) + 1
      );

    });

    return Array.from(
      subIndustryMap.entries()
    )
      .map(
        ([name, count]) => ({
          name,
          count,
        })
      )
      .sort(
        (a, b) =>
          b.count - a.count
      );

  }, [selectedRows]);


  // -------------------------------------------------------
  // TEAM LEADER
  // -------------------------------------------------------

  const teamLeader = useMemo(() => {

    return getMostFrequent(
      selectedRows,
      getTeamLeader
    );

  }, [selectedRows]);


  // -------------------------------------------------------
  // BD MEMBER
  // -------------------------------------------------------

  const bdMember = useMemo(() => {

    return getMostFrequent(
      selectedRows,
      getBDMember
    );

  }, [selectedRows]);


  // -------------------------------------------------------
  // YEARLY REPORT
  // -------------------------------------------------------

  const yearlyReportData = useMemo(() => {

    const yearMap = new Map();

    rows.forEach((row) => {

      const year =
        getFinancialYear(row);

      const industry =
        getIndustry(row);

      if (!year || !industry) {
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

      if (
        !industryMap.has(industry)
      ) {
        industryMap.set(
          industry,
          {
            industry,
            clients: 0,
            billing: 0,
          }
        );
      }

      const data =
        industryMap.get(industry);

      data.clients += 1;

      data.billing +=
        getBilling(row);

    });


    const result = [];


    yearMap.forEach(
      (industryMap, year) => {

        let topIndustry = null;

        industryMap.forEach(
          (data) => {

            if (
              !topIndustry ||
              data.clients >
                topIndustry.clients
            ) {
              topIndustry = data;
            }

          }
        );


        if (topIndustry) {

          result.push({
            year,
            industry:
              topIndustry.industry,
            clients:
              topIndustry.clients,
            billing:
              topIndustry.billing,
          });

        }

      }
    );


    return result.sort(
      (a, b) => {

        const yearA = Number(
          String(a.year).slice(0, 4)
        );

        const yearB = Number(
          String(b.year).slice(0, 4)
        );

        return yearA - yearB;
      }
    );

  }, [rows]);


  // -------------------------------------------------------
  // MONTHLY REPORT
  // -------------------------------------------------------

  const monthlyReportData = useMemo(() => {

    if (!selectedFinancialYear) {
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
          financialMonths[index];


        const monthRows =
          rows.filter((row) => {

            return (
              getFinancialYear(row) ===
                selectedFinancialYear &&
              getMonth(row) ===
                monthNumber
            );

          });


        const industryMap =
          new Map();


        monthRows.forEach((row) => {

          const industry =
            getIndustry(row);

          if (!industry) {
            return;
          }


          if (
            !industryMap.has(
              industry
            )
          ) {
            industryMap.set(
              industry,
              {
                industry,
                clients: 0,
                billing: 0,
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


        let topIndustry = null;


        industryMap.forEach(
          (data) => {

            if (
              !topIndustry ||
              data.clients >
                topIndustry.clients
            ) {
              topIndustry = data;
            }

          }
        );


        return {
          month:
            monthInfo.full,

          monthShort:
            monthInfo.short,

          industry: topIndustry
            ? topIndustry.industry
            : "No Data",

          clients: topIndustry
            ? topIndustry.clients
            : 0,

          billing: topIndustry
            ? topIndustry.billing
            : 0,
        };

      }
    );

  }, [
    rows,
    selectedFinancialYear,
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
    industry
  ) {

    setSelectedIndustry(
      industry
    );

    setSelectedFinancialYear("");
  }


  // -------------------------------------------------------
  // CLOSE MODAL
  // -------------------------------------------------------

  function handleCloseModal() {

    setSelectedIndustry("");

    setSelectedFinancialYear("");
  }


  // -------------------------------------------------------
  // JSX
  // -------------------------------------------------------

  return (
    <div className="industry-performance-page">

      {/* PAGE HEADER */}

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


      {/* MAIN TABLE */}

      <div className="industry-table-card">

        <div className="industry-table-header">

          <div>

            <h2>
              Industry Performance
            </h2>

            <span className="industry-count">
              {industryData.length} Industries
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
                  (industry) => (

                    <tr
                      key={
                        industry.industry
                      }
                    >

                      <td>

                        <div className="industry-name">

                          <div className="industry-avatar">

                            {industry.industry
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <span>
                            {industry.industry}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="industry-client-count">
                          {industry.clients}
                        </span>

                      </td>


                      <td>

                        <span className="industry-billing-value">
                          {formatCurrency(
                            industry.billing
                          )}
                        </span>

                      </td>


                      <td>

                        <span className="industry-net-value">
                          {formatCurrency(
                            industry.netAmount
                          )}
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


      {/* PERFORMANCE MODAL */}

      {selectedIndustry && (

        <div
          className="industry-performance-overlay"
          onClick={
            handleCloseModal
          }
        >

          <div
            className="industry-performance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* MODAL HEADER */}

            <div className="industry-modal-header">

              <div>

                <div className="industry-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>
                  {selectedIndustry}
                </h2>

                <p>
                  Industry performance
                  analysis and financial
                  trends
                </p>

              </div>


              <button
                type="button"
                className="industry-modal-close"
                onClick={
                  handleCloseModal
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* SUMMARY CARDS */}

            <div className="industry-summary-grid">


              {/* INDUSTRY */}

              <div className="industry-summary-card industry-top-industry-card">

                <span className="industry-summary-label">
                  Industry
                </span>

                <strong className="industry-summary-text">
                  {performanceSummary.industry ||
                    "—"}
                </strong>


                {subIndustryData.length >
                  0 && (

                  <div className="industry-sub-industry-list">

                    {subIndustryData.map(
                      (subIndustry) => (

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
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </strong>

              </div>


              {/* TEAM LEADER */}

              <div className="industry-summary-card">

                <span className="industry-summary-label">
                  Team Leader
                </span>

                <strong className="industry-summary-text">
                  {teamLeader.value ||
                    "—"}
                </strong>


                {teamLeader.count >
                  0 && (

                  <small className="industry-summary-count">
                    {teamLeader.count} acquired
                    clients
                  </small>

                )}

              </div>


              {/* BD MEMBER */}

              <div className="industry-summary-card">

                <span className="industry-summary-label">
                  BD Member
                </span>

                <strong className="industry-summary-text">
                  {bdMember.value ||
                    "—"}
                </strong>


                {bdMember.count >
                  0 && (

                  <small className="industry-summary-count">
                    {bdMember.count} acquired
                    clients
                  </small>

                )}

              </div>


              {/* ENQUIRIES */}

              <div className="industry-summary-card industry-enquiry-card">

                <span className="industry-summary-label">
                  Enquiries
                </span>

                <strong className="industry-summary-value">
                  {enquiryCount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

                <small className="industry-summary-count">
                  Total enquiries
                </small>

              </div>


              {/* FRANCHISE SHARE */}

              <div className="industry-summary-card industry-share-card">

                <span className="industry-summary-label">
                  Franchise Share Claimed
                </span>

                <strong className="industry-summary-value">
                  {formatCurrency(
                    performanceSummary.totalFranchiseShare
                  )}
                </strong>

              </div>


              {/* NET AMOUNT */}

              <div className="industry-summary-card industry-net-card">

                <span className="industry-summary-label">
                  Net Amount
                </span>

                <strong className="industry-summary-value">
                  {formatCurrency(
                    performanceSummary.netAmount
                  )}
                </strong>

              </div>

            </div>


            {/* REPORT CONTROLS */}

            <div className="industry-report-controls">

              <div className="industry-report-period">

                <label htmlFor="industry-financial-year">
                  Financial Year
                </label>

                <select
                  id="industry-financial-year"
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


              <div className="industry-report-period">

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

            <div className="industry-report-graphs">


              {/* CLIENT ACQUIRED GRAPH */}

              <div className="industry-chart-card">

                <div className="industry-chart-heading">

                  <div>

                    <span className="industry-chart-indicator industry-client-indicator"></span>

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

              <div className="industry-chart-card">

                <div className="industry-chart-heading">

                  <div>

                    <span className="industry-chart-indicator industry-billing-indicator"></span>

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

            <div className="industry-modal-footer">

              <span>
                {selectedFinancialYear
                  ? `Monthly report for ${selectedFinancialYear}`
                  : "Yearly performance report"}
              </span>


              <button
                type="button"
                className="industry-footer-close"
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


export default IndustryPerformance;