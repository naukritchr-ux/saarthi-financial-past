import React, { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { useData } from "../../context/DataContext";

import "./IndustryPerformance.css";

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
   NUMBER
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
    .replace(/%/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
};

/* ============================================================
   CURRENCY
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
   INDUSTRY
   ============================================================ */

const getIndustry = (row) => {
  return (
    String(
      row?.industry ??
        row?.Industry ??
        row?.["Industry"] ??
        row?.["Industry Name"] ??
        "Unknown"
    ).trim() || "Unknown"
  );
};

/* ============================================================
   SUB INDUSTRY
   ============================================================ */

const getSubIndustry = (row) => {
  return (
    String(
      row?.sub_industry ??
        row?.subIndustry ??
        row?.["Sub Industry"] ??
        row?.SubIndustry ??
        "Unknown"
    ).trim() || "Unknown"
  );
};

/* ============================================================
   TEAM LEADER
   ============================================================ */

const getTeamLeader = (row) => {
  return (
    String(
      row?.team_leader ??
        row?.teamLeader ??
        row?.["Team Leader"] ??
        "Unknown"
    ).trim() || "Unknown"
  );
};

/* ============================================================
   BD MEMBER
   ============================================================ */

const getBDMember = (row) => {
  return (
    String(
      row?.bd_member ??
        row?.bdMember ??
        row?.["BD Member"] ??
        row?.["BD Members Name"] ??
        "Unknown"
    ).trim() || "Unknown"
  );
};

/* ============================================================
   BILLING
   ============================================================ */

const getBilling = (row) => {
  return toNumber(
    row?.total_bill_amount ??
      row?.["Total Bill Amount"] ??
      0
  );
};

/* ============================================================
   FRANCHISE SHARE
   ============================================================ */

const getFranchiseeShare = (row) => {
  return toNumber(
    row?.franchisee_share ??
      row?.["Franchisee Share"] ??
      row?.["Franchise Share"] ??
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
      row?.["Info"] ??
      row?.["Info Status"] ??
      ""
  )
    .trim()
    .toUpperCase();
};

/* ============================================================
   STATUS MATCH
   ============================================================ */

const matchesInfoStatus = (
  row,
  selectedStatus
) => {
  const status = getInfoStatus(row);

  const selected =
    String(
      selectedStatus || "All"
    )
      .trim()
      .toUpperCase();

  if (
    selected === "ALL" ||
    selected === ""
  ) {
    return true;
  }

  return status === selected;
};

/* ============================================================
   FINANCIAL CALCULATIONS

   VERY IMPORTANT:

   ALL
   ------------------------------------------------------------
   Total Billing       = R + RV + C + CN
   Franchise Share     = R Franchise Share
   Net Amount          = Total Billing - R Franchise Share
   Expenditure         = 5% of Total Billing


   R
   ------------------------------------------------------------
   Total Billing       = R Billing
   Franchise Share     = R Franchise Share
   Net Amount          = R Billing - R Franchise Share
   Expenditure         = 5% of R Billing


   RV
   ------------------------------------------------------------
   Total Billing       = RV Billing
   Franchise Share     = ₹0
   Net Amount          = ₹0
   Expenditure         = ₹0


   C
   ------------------------------------------------------------
   Total Billing       = C Billing
   Franchise Share     = ₹0
   Net Amount          = ₹0
   Expenditure         = ₹0


   CN
   ------------------------------------------------------------
   Total Billing       = CN Billing
   Franchise Share     = ₹0
   Net Amount          = ₹0
   Expenditure         = ₹0

   ============================================================ */

const getFinancialValues = (
  rows,
  selectedInfoStatus
) => {
  const selectedStatus =
    String(
      selectedInfoStatus || "All"
    )
      .trim()
      .toUpperCase();

  /* ==========================================================
     IMPORTANT HARD STOP

     If selected status is RV, C or CN,
     expenditure is ALWAYS ZERO.

     Nothing below can change this.
     ========================================================== */

  if (
    selectedStatus === "RV" ||
    selectedStatus === "C" ||
    selectedStatus === "CN"
  ) {
    let selectedBilling = 0;

    rows.forEach((row) => {
      const status =
        getInfoStatus(row);

      if (
        status === selectedStatus
      ) {
        selectedBilling +=
          getBilling(row);
      }
    });

    return {
      totalBilling: selectedBilling,
      totalFranchiseShare: 0,
      netAmount: 0,
      industryExpenditure: 0
    };
  }

  /* ==========================================================
     R CALCULATION
     ========================================================== */

  if (selectedStatus === "R") {
    let rBilling = 0;
    let rFranchiseShare = 0;

    rows.forEach((row) => {
      const status =
        getInfoStatus(row);

      if (status === "R") {
        rBilling +=
          getBilling(row);

        rFranchiseShare +=
          getFranchiseeShare(row);
      }
    });

    return {
      totalBilling: rBilling,

      totalFranchiseShare:
        rFranchiseShare,

      netAmount:
        rBilling -
        rFranchiseShare,

      industryExpenditure:
        rBilling * 0.05
    };
  }

  /* ==========================================================
     ALL CALCULATION
     ========================================================== */

  let totalBilling = 0;
  let rBilling = 0;
  let rFranchiseShare = 0;

  rows.forEach((row) => {
    const status =
      getInfoStatus(row);

    const billing =
      getBilling(row);

    /* --------------------------------------------------------
       ALL BILLING

       Includes:
       R + RV + C + CN
       -------------------------------------------------------- */

    totalBilling += billing;

    /* --------------------------------------------------------
       ONLY R CONTRIBUTES TO
       FRANCHISE SHARE
       -------------------------------------------------------- */

    if (status === "R") {
      rBilling += billing;

      rFranchiseShare +=
        getFranchiseeShare(row);
    }
  });

  return {
    totalBilling,

    totalFranchiseShare:
      rFranchiseShare,

    netAmount:
      totalBilling -
      rFranchiseShare,

    /* ALL = 5% OF TOTAL BILLING */
    industryExpenditure:
      totalBilling * 0.05
  };
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
    row?.acquisition_date ??
    row?.["Acquisition Date"] ??
    null
  );
};

/* ============================================================
   FINANCIAL YEAR

   April 2025 - March 2026
   = FY 2025-26
   ============================================================ */

const getFinancialYear = (
  dateValue
) => {
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

/* ============================================================
   MONTH
   ============================================================ */

const getMonth = (
  dateValue
) => {
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

const getMostFrequent = (
  values
) => {
  if (
    !values ||
    values.length === 0
  ) {
    return "N/A";
  }

  const counts = {};

  values.forEach(
    (value) => {
      const cleaned =
        value === null ||
        value === undefined ||
        String(value).trim() === ""
          ? "Unknown"
          : String(value).trim();

      counts[cleaned] =
        (counts[cleaned] || 0) +
        1;
    }
  );

  return (
    Object.entries(
      counts
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0]?.[0] || "N/A"
  );
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
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div className="industry-chart-tooltip">

      <p className="industry-tooltip-title">
        {label}
      </p>

      {payload.map(
        (item, index) => (
          <p
            key={index}
            className="industry-tooltip-row"
          >
            <span>
              {item.name}:
            </span>

            <strong>
              {item.name ===
              "Total Billing"
                ? formatCurrency(
                    item.value
                  )
                : Number(
                    item.value
                  ).toLocaleString(
                    "en-IN"
                  )}
            </strong>
          </p>
        )
      )}

    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function IndustryPerformance() {
  const { rows } =
    useData();

  /* ==========================================================
     STATE
     ========================================================== */

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("All");

  /* ==========================================================
     FINANCIAL YEARS
     ========================================================== */

  const financialYears =
    useMemo(() => {
      const years =
        new Set();

      (rows || []).forEach(
        (row) => {
          const fy =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );

          if (fy) {
            years.add(fy);
          }
        }
      );

      return Array.from(
        years
      ).sort(
        (a, b) =>
          Number(
            a.substring(0, 4)
          ) -
          Number(
            b.substring(0, 4)
          )
      );
    }, [rows]);

  /* ==========================================================
     INDUSTRY DATA

     IMPORTANT:
     The table itself also filters by
     Info Status.

     Therefore C / CN / RV will only
     count their own records.
     ========================================================== */

  const industryData =
    useMemo(() => {
      if (
        !rows ||
        rows.length === 0
      ) {
        return [];
      }

      const grouped = {};

      rows.forEach(
        (row) => {
          const industry =
            getIndustry(row);

          const date =
            getClientAcquiredDate(
              row
            );

          const fy =
            getFinancialYear(
              date
            );

          /* --------------------------------------------------
             FINANCIAL YEAR
             -------------------------------------------------- */

          if (
            selectedFinancialYear &&
            fy !==
              selectedFinancialYear
          ) {
            return;
          }

          /* --------------------------------------------------
             INFO STATUS
             -------------------------------------------------- */

          if (
            !matchesInfoStatus(
              row,
              selectedInfoStatus
            )
          ) {
            return;
          }

          if (
            !grouped[industry]
          ) {
            grouped[industry] =
              [];
          }

          grouped[industry].push(
            row
          );
        }
      );

      return Object.entries(
        grouped
      )
        .map(
          ([
            industry,
            industryRows
          ]) => {
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

              totalFranchiseShare:
                financial.totalFranchiseShare,

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
      rows,
      selectedFinancialYear,
      selectedInfoStatus
    ]);

  /* ==========================================================
     SELECTED INDUSTRY ROWS
     ========================================================== */

  const selectedRows =
    useMemo(() => {
      if (
        !selectedIndustry
      ) {
        return [];
      }

      return (
        rows || []
      ).filter(
        (row) => {
          const industryMatch =
            getIndustry(row) ===
            selectedIndustry;

          if (
            !industryMatch
          ) {
            return false;
          }

          const yearMatch =
            !selectedFinancialYear ||
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            ) ===
              selectedFinancialYear;

          if (!yearMatch) {
            return false;
          }

          return matchesInfoStatus(
            row,
            selectedInfoStatus
          );
        }
      );
    }, [
      rows,
      selectedIndustry,
      selectedFinancialYear,
      selectedInfoStatus
    ]);

  /* ==========================================================
     ENQUIRIES
     ========================================================== */

  const enquiryCount =
    selectedRows.length;

  /* ==========================================================
     PERFORMANCE SUMMARY
     ========================================================== */

  const performanceSummary =
    useMemo(
      () =>
        getFinancialValues(
          selectedRows,
          selectedInfoStatus
        ),
      [
        selectedRows,
        selectedInfoStatus
      ]
    );

  /* ==========================================================
     SUB INDUSTRY
     ========================================================== */

  const subIndustryData =
    useMemo(() => {
      const grouped = {};

      selectedRows.forEach(
        (row) => {
          const subIndustry =
            getSubIndustry(row);

          grouped[subIndustry] =
            (grouped[subIndustry] ||
              0) + 1;
        }
      );

      return Object.entries(
        grouped
      )
        .map(
          ([name, value]) => ({
            name,
            value
          })
        )
        .sort(
          (a, b) =>
            b.value -
            a.value
        );
    }, [selectedRows]);

  /* ==========================================================
     TEAM LEADER
     ========================================================== */

  const teamLeader =
    useMemo(
      () =>
        getMostFrequent(
          selectedRows.map(
            getTeamLeader
          )
        ),
      [selectedRows]
    );

  /* ==========================================================
     BD MEMBER
     ========================================================== */

  const bdMember =
    useMemo(
      () =>
        getMostFrequent(
          selectedRows.map(
            getBDMember
          )
        ),
      [selectedRows]
    );

  /* ==========================================================
     YEARLY REPORT
     ========================================================== */

  const yearlyReportData =
    useMemo(() => {
      if (
        !selectedIndustry
      ) {
        return [];
      }

      const grouped = {};

      selectedRows.forEach(
        (row) => {
          const date =
            getClientAcquiredDate(
              row
            );

          const fy =
            getFinancialYear(
              date
            );

          if (!fy) {
            return;
          }

          if (
            !grouped[fy]
          ) {
            grouped[fy] =
              [];
          }

          grouped[fy].push(
            row
          );
        }
      );

      return Object.entries(
        grouped
      )
        .map(
          ([
            year,
            yearRows
          ]) => {
            const financial =
              getFinancialValues(
                yearRows,
                selectedInfoStatus
              );

            return {
              period: year,

              clients:
                yearRows.length,

              totalBilling:
                financial.totalBilling
            };
          }
        )
        .sort(
          (a, b) =>
            a.period.localeCompare(
              b.period
            )
        );
    }, [
      selectedRows,
      selectedIndustry,
      selectedInfoStatus
    ]);

  /* ==========================================================
     MONTHLY REPORT
     ========================================================== */

  const monthlyReportData =
    useMemo(() => {
      if (
        !selectedIndustry ||
        !selectedFinancialYear
      ) {
        return [];
      }

      const grouped = {};

      selectedRows.forEach(
        (row) => {
          const month =
            getMonth(
              getClientAcquiredDate(
                row
              )
            );

          if (!month) {
            return;
          }

          if (
            !grouped[month]
          ) {
            grouped[month] =
              [];
          }

          grouped[month].push(
            row
          );
        }
      );

      return financialMonths.map(
        (month) => {
          const monthRows =
            grouped[
              month.full
            ] || [];

          const financial =
            getFinancialValues(
              monthRows,
              selectedInfoStatus
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
      selectedIndustry,
      selectedFinancialYear,
      selectedInfoStatus
    ]);

  /* ==========================================================
     REPORT DATA
     ========================================================== */

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;

  /* ==========================================================
     VIEW PERFORMANCE
     ========================================================== */

  const handleViewPerformance =
    (industry) => {
      setSelectedIndustry(
        industry
      );

      setSelectedFinancialYear(
        ""
      );

      setSelectedInfoStatus(
        "All"
      );
    };

  /* ==========================================================
     CLOSE MODAL
     ========================================================== */

  const handleCloseModal =
    () => {
      setSelectedIndustry(
        ""
      );

      setSelectedFinancialYear(
        ""
      );

      setSelectedInfoStatus(
        "All"
      );
    };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="industry-performance">

      {/* ====================================================
          HEADER
          ==================================================== */}

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

      {/* ====================================================
          MAIN FILTERS
          ==================================================== */}

      <div className="industry-main-filters">

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

      </div>

      {/* ====================================================
          MAIN TABLE
          ==================================================== */}

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

              {industryData.length ===
              0 ? (
                <tr>

                  <td
                    colSpan="6"
                    className="industry-empty"
                  >
                    No industry data
                    available
                  </td>

                </tr>
              ) : (
                industryData.map(
                  (item) => (
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
                          onClick={() =>
                            handleViewPerformance(
                              item.industry
                            )
                          }
                        >
                          View Performance
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

      {/* ====================================================
          MODAL
          ==================================================== */}

      {selectedIndustry && (
        <div className="industry-modal-overlay">

          <div className="industry-modal">

            {/* ==================================================
                MODAL HEADER
                ================================================== */}

            <div className="industry-modal-header">

              <div>

                <h2>
                  {selectedIndustry}
                  {" "}
                  Performance
                </h2>

                <p>
                  Detailed industry
                  performance report
                </p>

              </div>

              <button
                type="button"
                className="industry-modal-close"
                onClick={
                  handleCloseModal
                }
              >
                ×
              </button>

            </div>

            {/* ==================================================
                SUMMARY
                ================================================== */}

            <div className="industry-summary-grid">

              <div className="industry-summary-card">

                <span>
                  Industry
                </span>

                <strong>
                  {selectedIndustry}
                </strong>

              </div>

              <div className="industry-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </strong>

              </div>

              <div className="industry-summary-card">

                <span>
                  Team Leader
                </span>

                <strong>
                  {teamLeader}
                </strong>

              </div>

              <div className="industry-summary-card">

                <span>
                  BD Member
                </span>

                <strong>
                  {bdMember}
                </strong>

              </div>

              <div className="industry-summary-card">

                <span>
                  Enquiries
                </span>

                <strong>
                  {enquiryCount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div className="industry-summary-card">

                <span>
                  Franchise Share Claimed
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.totalFranchiseShare
                  )}
                </strong>

              </div>

              <div className="industry-summary-card">

                <span>
                  Industry Expenditure
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary.industryExpenditure
                  )}
                </strong>

              </div>

              <div className="industry-summary-card">

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

            {/* ==================================================
                MODAL FILTERS
                ================================================== */}

            <div className="industry-modal-controls">

              <div className="industry-filter-group">

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
                        FY {year}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="industry-filter-group">

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

            {/* ==================================================
                CLIENT ACQUIRED CHART
                ================================================== */}

            <div className="industry-chart-card">

              <div className="industry-chart-header">

                <div>

                  <h3>
                    Client Acquired
                  </h3>

                  <p>
                    Client acquisition
                    trend
                  </p>

                </div>

              </div>

              <div className="industry-chart">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={reportData}
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
                        <IndustryTooltip />
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
                BILLING CHART
                ================================================== */}

            <div className="industry-chart-card">

              <div className="industry-chart-header">

                <div>

                  <h3>
                    Total Billing
                  </h3>

                  <p>
                    Billing performance
                    trend
                  </p>

                </div>

                <small>
                  {selectedFinancialYear
                    ? "Monthly"
                    : "Yearly"}
                </small>

              </div>

              <div className="industry-chart">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >

                  <BarChart
                    data={reportData}
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
                        <IndustryTooltip />
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

            </div>

            {/* ==================================================
                SUB INDUSTRY
                ================================================== */}

            {subIndustryData.length >
              0 && (
                <div className="industry-chart-card">

                  <div className="industry-chart-header">

                    <div>

                      <h3>
                        Sub Industry
                      </h3>

                      <p>
                        Enquiry distribution
                      </p>

                    </div>

                  </div>

                  <div className="industry-subindustry-list">

                    {subIndustryData.map(
                      (item) => (
                        <div
                          className="industry-subindustry-row"
                          key={
                            item.name
                          }
                        >

                          <span>
                            {item.name}
                          </span>

                          <strong>
                            {item.value.toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            {/* ==================================================
                FOOTER
                ================================================== */}

            <div className="industry-modal-footer">

              <span>
                {selectedFinancialYear
                  ? `Monthly report for FY ${selectedFinancialYear}`
                  : "Yearly performance report"}
              </span>

              <button
                type="button"
                className="industry-close-button"
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
