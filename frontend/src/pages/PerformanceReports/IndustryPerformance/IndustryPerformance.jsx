import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./IndustryPerformance.css";


/* ============================================================
   FINANCIAL YEAR MONTHS
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
    .replace(/[₹,\s]/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
};


/* ============================================================
   CURRENCY FORMAT
   ============================================================ */

const formatCurrency = (value) => {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
};


/* ============================================================
   FIELD HELPERS
   ============================================================ */

const getIndustry = (row) => {
  return String(
    row?.industry ??
    row?.Industry ??
    row?.["Industry Name"] ??
    ""
  ).trim();
};


const getSubIndustry = (row) => {
  return String(
    row?.sub_industry ??
    row?.subIndustry ??
    row?.["Sub Industry"] ??
    row?.["Sub Industry Name"] ??
    ""
  ).trim();
};


const getTeamLeader = (row) => {
  return String(
    row?.team_leader ??
    row?.teamLeader ??
    row?.["Team Leader"] ??
    ""
  ).trim();
};


const getBDMember = (row) => {
  return String(
    row?.bd_member ??
    row?.bdMember ??
    row?.["BD Member"] ??
    ""
  ).trim();
};


/* ============================================================
   BILLING
   ============================================================ */

const getBilling = (row) => {
  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    row?.totalBilling ??
    row?.["Total Billing"] ??
    0
  );
};


/* ============================================================
   INFO STATUS
   ============================================================ */

const getInfoStatus = (row) => {
  return String(
    row?.info ??
    row?.Info ??
    row?.["Info Status"] ??
    ""
  )
    .trim()
    .toUpperCase();
};


/* ============================================================
   CLIENT ACQUIRED DATE
   ============================================================ */

const getClientAcquiredDate = (row) => {
  return (
    row?.date_client_acquired ??
    row?.dateClientAcquired ??
    row?.["Date Client Acquired"] ??
    row?.client_acquired_date ??
    row?.["Client Acquired Date"] ??
    null
  );
};


/* ============================================================
   FINANCIAL YEAR
   ============================================================ */

const getFinancialYear = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
};


/* ============================================================
   MONTH
   ============================================================ */

const getMonth = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    month: "long"
  });
};


/* ============================================================
   INFO STATUS MATCH
   ============================================================ */

const matchesInfoStatus = (
  row,
  selectedStatus
) => {
  const status = String(
    selectedStatus || "All"
  )
    .trim()
    .toUpperCase();

  if (status === "ALL") {
    return true;
  }

  return getInfoStatus(row) === status;
};


/* ============================================================
   MOST FREQUENT VALUE
   ============================================================ */

const getMostFrequent = (
  rows,
  getter
) => {
  const counts = {};

  rows.forEach((row) => {
    const value = getter(row);

    if (!value) {
      return;
    }

    counts[value] =
      (counts[value] || 0) + 1;
  });

  let result = "-";
  let highest = 0;

  Object.entries(counts).forEach(
    ([value, count]) => {
      if (count > highest) {
        highest = count;
        result = value;
      }
    }
  );

  return result;
};


/* ============================================================
   FINANCIAL CALCULATION
   ------------------------------------------------------------
   IMPORTANT:
   Franchise Share is NOT calculated.
   ------------------------------------------------------------

   ALL:
   Total Billing = R + RV + C + CN
   Expenditure = 5% of Total Billing

   R:
   Total Billing = R Billing
   Expenditure = 5% of R Billing

   RV:
   Total Billing = RV Billing
   Expenditure = 0

   C:
   Total Billing = C Billing
   Expenditure = 0

   CN:
   Total Billing = CN Billing
   Expenditure = 0
   ============================================================ */

const getFinancialValues = (
  rows,
  selectedInfoStatus
) => {
  const selectedStatus = String(
    selectedInfoStatus || "All"
  )
    .trim()
    .toUpperCase();


  /* ----------------------------------------------------------
     C / CN / RV
     ---------------------------------------------------------- */

  if (
    selectedStatus === "C" ||
    selectedStatus === "CN" ||
    selectedStatus === "RV"
  ) {
    let totalBilling = 0;

    rows.forEach((row) => {
      if (
        getInfoStatus(row) ===
        selectedStatus
      ) {
        totalBilling += getBilling(row);
      }
    });

    return {
      totalBilling,
      netAmount: totalBilling,
      industryExpenditure: 0
    };
  }


  /* ----------------------------------------------------------
     R
     ---------------------------------------------------------- */

  if (selectedStatus === "R") {
    let totalBilling = 0;

    rows.forEach((row) => {
      if (
        getInfoStatus(row) === "R"
      ) {
        totalBilling += getBilling(row);
      }
    });

    return {
      totalBilling,
      netAmount: totalBilling,
      industryExpenditure:
        totalBilling * 0.05
    };
  }


  /* ----------------------------------------------------------
     ALL
     ---------------------------------------------------------- */

  let totalBilling = 0;

  rows.forEach((row) => {
    totalBilling += getBilling(row);
  });

  return {
    totalBilling,
    netAmount: totalBilling,
    industryExpenditure:
      totalBilling * 0.05
  };
};


/* ============================================================
   TOOLTIP
   ============================================================ */

const IndustryTooltip = ({
  active,
  payload,
  label
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "10px 12px",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: "5px"
        }}
      >
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          key={index}
          style={{
            fontSize: "13px",
            marginTop: "3px"
          }}
        >
          {item.name}:{" "}
          {item.name === "Total Billing"
            ? formatCurrency(item.value)
            : item.value}
        </div>
      ))}
    </div>
  );
};


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function IndustryPerformance() {

  const { rows } = useData();


  /* ==========================================================
     STATES
     ========================================================== */

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState("All");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("All Financial Years");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("All");

  const [
    showModal,
    setShowModal
  ] = useState(false);


  /* ==========================================================
     FINANCIAL YEARS
     ========================================================== */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {
      const date =
        getClientAcquiredDate(row);

      const financialYear =
        getFinancialYear(date);

      if (financialYear) {
        years.add(financialYear);
      }
    });

    return [
      "All Financial Years",
      ...Array.from(years).sort()
    ];

  }, [rows]);


  /* ==========================================================
     INDUSTRIES
     ========================================================== */

  const industries = useMemo(() => {

    const values = new Set();

    rows.forEach((row) => {
      const industry =
        getIndustry(row);

      if (industry) {
        values.add(industry);
      }
    });

    return [
      "All",
      ...Array.from(values).sort()
    ];

  }, [rows]);


  /* ==========================================================
     FILTERED ROWS
     ========================================================== */

  const filteredRows = useMemo(() => {

    return rows.filter((row) => {

      const date =
        getClientAcquiredDate(row);

      const financialYear =
        getFinancialYear(date);

      const industry =
        getIndustry(row);


      const financialYearMatch =
        selectedFinancialYear ===
          "All Financial Years" ||
        financialYear ===
          selectedFinancialYear;


      const industryMatch =
        selectedIndustry === "All" ||
        industry === selectedIndustry;


      const infoStatusMatch =
        matchesInfoStatus(
          row,
          selectedInfoStatus
        );


      return (
        financialYearMatch &&
        industryMatch &&
        infoStatusMatch
      );
    });

  }, [
    rows,
    selectedFinancialYear,
    selectedIndustry,
    selectedInfoStatus
  ]);


  /* ==========================================================
     INDUSTRY DATA
     ========================================================== */

  const industryData = useMemo(() => {

    const grouped = {};

    filteredRows.forEach((row) => {

      const industry =
        getIndustry(row) ||
        "Unknown";

      if (!grouped[industry]) {
        grouped[industry] = [];
      }

      grouped[industry].push(row);
    });


    return Object.entries(grouped)
      .map(
        ([industry, industryRows]) => {

          const financial =
            getFinancialValues(
              industryRows,
              selectedInfoStatus
            );

          return {
            industry,

            totalClients:
              industryRows.length,

            totalBilling:
              financial.totalBilling,

            netAmount:
              financial.netAmount,

            industryExpenditure:
              financial.industryExpenditure
          };
        }
      )
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
     SELECTED INDUSTRY ROWS
     ========================================================== */

  const selectedRows = useMemo(() => {

    if (
      selectedIndustry === "All"
    ) {
      return filteredRows;
    }

    return filteredRows.filter(
      (row) =>
        getIndustry(row) ===
        selectedIndustry
    );

  }, [
    filteredRows,
    selectedIndustry
  ]);


  /* ==========================================================
     SUMMARY
     ========================================================== */

  const performanceSummary =
    useMemo(() => {

      return getFinancialValues(
        selectedRows,
        selectedInfoStatus
      );

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* ==========================================================
     CLIENT COUNT
     ========================================================== */

  const enquiryCount =
    selectedRows.length;


  /* ==========================================================
     SUB INDUSTRY
     ========================================================== */

  const subIndustryData =
    useMemo(() => {

      const grouped = {};

      selectedRows.forEach((row) => {

        const subIndustry =
          getSubIndustry(row) ||
          "Unknown";

        if (!grouped[subIndustry]) {
          grouped[subIndustry] = {
            name: subIndustry,
            clients: 0,
            billing: 0
          };
        }

        grouped[subIndustry].clients += 1;

        grouped[subIndustry].billing +=
          getBilling(row);
      });


      return Object.values(grouped)
        .sort(
          (a, b) =>
            b.billing -
            a.billing
        );

    }, [selectedRows]);


  /* ==========================================================
     TEAM LEADER
     ========================================================== */

  const topTeamLeader =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getTeamLeader
      );

    }, [selectedRows]);


  /* ==========================================================
     BD MEMBER
     ========================================================== */

  const topBDMember =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getBDMember
      );

    }, [selectedRows]);


  /* ==========================================================
     YEAR PERFORMANCE
     ========================================================== */

  const yearPerformance =
    useMemo(() => {

      const grouped = {};

      selectedRows.forEach((row) => {

        const date =
          getClientAcquiredDate(row);

        const financialYear =
          getFinancialYear(date);

        if (!financialYear) {
          return;
        }

        if (!grouped[financialYear]) {
          grouped[financialYear] = {
            year: financialYear,
            clients: 0,
            billing: 0
          };
        }

        grouped[financialYear].clients += 1;

        grouped[financialYear].billing +=
          getBilling(row);
      });


      return Object.values(grouped)
        .sort((a, b) =>
          a.year.localeCompare(b.year)
        );

    }, [selectedRows]);


  /* ==========================================================
     MONTHLY PERFORMANCE
     ========================================================== */

  const monthlyPerformance =
    useMemo(() => {

      const grouped = {};

      financialMonths.forEach((month) => {

        grouped[month] = {
          month,
          clients: 0,
          billing: 0
        };
      });


      selectedRows.forEach((row) => {

        const date =
          getClientAcquiredDate(row);

        const month =
          getMonth(date);

        if (grouped[month]) {
          grouped[month].clients += 1;

          grouped[month].billing +=
            getBilling(row);
        }
      });


      return financialMonths.map(
        (month) =>
          grouped[month]
      );

    }, [selectedRows]);


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="industry-performance">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="industry-performance-header">

        <div>

          <h2>
            Industry Performance
          </h2>

          <p>
            {industryData.length} Industries
          </p>

        </div>

      </div>


      {/* ======================================================
          FILTERS
          ====================================================== */}

      <div className="industry-filters">

        <div className="industry-filter-group">

          <label>
            FINANCIAL YEAR
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


        <div className="industry-filter-group">

          <label>
            INFO STATUS
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


        <div className="industry-filter-group">

          <label>
            INDUSTRY
          </label>

          <select
            value={
              selectedIndustry
            }
            onChange={(event) =>
              setSelectedIndustry(
                event.target.value
              )
            }
          >

            {industries.map(
              (industry) => (
                <option
                  key={industry}
                  value={industry}
                >
                  {industry}
                </option>
              )
            )}

          </select>

        </div>

      </div>


      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div className="industry-summary-grid">

        <div className="industry-summary-card">

          <span>
            TOTAL ACQUIRED CLIENT
          </span>

          <strong>
            {enquiryCount.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>


        <div className="industry-summary-card">

          <span>
            TOTAL BILLING
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.totalBilling
            )}
          </strong>

        </div>


        <div className="industry-summary-card">

          <span>
            NET AMOUNT
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.netAmount
            )}
          </strong>

        </div>


        <div className="industry-summary-card">

          <span>
            INDUSTRY EXPENDITURE
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.industryExpenditure
            )}
          </strong>

        </div>

      </div>


      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="industry-table-card">

        <div className="industry-table-wrapper">

          <table className="industry-table">

            <thead>

              <tr>

                <th>
                  INDUSTRY NAME
                </th>

                <th>
                  TOTAL ACQUIRED CLIENT
                </th>

                <th>
                  TOTAL BILLING
                </th>

                <th>
                  NET AMOUNT
                </th>

                <th>
                  INDUSTRY EXPENDITURE
                </th>

                <th>
                  PERFORMANCE
                </th>

              </tr>

            </thead>


            <tbody>

              {industryData.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="industry-no-data"
                  >
                    No data available
                  </td>

                </tr>

              ) : (

                industryData.map((item) => (

                  <tr
                    key={
                      item.industry
                    }
                  >

                    <td>
                      {item.industry}
                    </td>

                    <td>
                      {item.totalClients.toLocaleString(
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
                        item.industryExpenditure
                      )}
                    </td>

                    <td>

                      <button
                        type="button"
                        className="industry-view-button"
                        onClick={() => {

                          setSelectedIndustry(
                            item.industry
                          );

                          setShowModal(
                            true
                          );

                        }}
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))

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
          className="industry-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="industry-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="industry-modal-header">

              <div>

                <h3>
                  {selectedIndustry}
                </h3>

                <p>
                  Industry Performance
                </p>

              </div>

              <button
                type="button"
                className="industry-modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            {/* MODAL SUMMARY */}

            <div className="industry-modal-summary">

              <div className="industry-modal-summary-card">

                <span>
                  ACQUIRED CLIENTS
                </span>

                <strong>
                  {enquiryCount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div className="industry-modal-summary-card">

                <span>
                  TOTAL BILLING
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </strong>

              </div>


              <div className="industry-modal-summary-card">

                <span>
                  NET AMOUNT
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.netAmount
                  )}
                </strong>

              </div>


              <div className="industry-modal-summary-card">

                <span>
                  INDUSTRY EXPENDITURE
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.industryExpenditure
                  )}
                </strong>

              </div>

            </div>


            {/* MODAL FILTERS */}

            <div className="industry-modal-filters">

              <div>

                <label>
                  FINANCIAL YEAR
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


              <div>

                <label>
                  INFO STATUS
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


            {/* YEAR CHART */}

            <div className="industry-chart-section">

              <div className="industry-section-title">

                <h4>
                  Client Acquired by Financial Year
                </h4>

              </div>

              <div
                className="industry-chart-container"
                style={{
                  width: "100%",
                  height: 300
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      yearPerformance
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="year"
                    />

                    <YAxis />

                    <Tooltip
                      content={
                        <IndustryTooltip />
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="clients"
                      name="Clients"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* BILLING CHART */}

            <div className="industry-chart-section">

              <div className="industry-section-title">

                <h4>
                  Monthly Billing Performance
                </h4>

              </div>

              <div
                className="industry-chart-container"
                style={{
                  width: "100%",
                  height: 300
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      monthlyPerformance
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip
                      content={
                        <IndustryTooltip />
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="billing"
                      name="Total Billing"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* SUB INDUSTRY */}

            <div className="industry-subindustry-section">

              <div className="industry-section-title">

                <h4>
                  Sub Industry Performance
                </h4>

              </div>

              <div className="industry-subindustry-list">

                {subIndustryData.length === 0 ? (

                  <div className="industry-no-data">
                    No sub industry data available
                  </div>

                ) : (

                  subIndustryData.map((item) => (

                    <div
                      className="industry-subindustry-row"
                      key={item.name}
                    >

                      <div>

                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {item.clients.toLocaleString(
                            "en-IN"
                          )}{" "}
                          Clients
                        </span>

                      </div>

                      <strong>
                        {formatCurrency(
                          item.billing
                        )}
                      </strong>

                    </div>

                  ))

                )}

              </div>

            </div>


            {/* TEAM LEADER / BD MEMBER */}

            <div className="industry-owner-grid">

              <div className="industry-owner-card">

                <span>
                  TOP TEAM LEADER
                </span>

                <strong>
                  {topTeamLeader}
                </strong>

              </div>


              <div className="industry-owner-card">

                <span>
                  TOP BD MEMBER
                </span>

                <strong>
                  {topBDMember}
                </strong>

              </div>

            </div>


            {/* FOOTER */}

            <div className="industry-modal-footer">

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
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
