import React, {
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

import { useData } from "../../context/DataContext";

import "./IndustryPerformance.css";


/* ============================================================
   FINANCIAL MONTHS
   ============================================================ */

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


/* ============================================================
   NUMBER HELPERS
   ============================================================ */

const toNumber = (value) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const cleaned =
    String(value)
      .replace(/[₹,\s]/g, "");

  const number =
    Number(cleaned);

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
   INDUSTRY
   ============================================================ */

const getIndustry = (row) => {

  return String(
    row?.industry ??
    row?.Industry ??
    row?.["Industry Name"] ??
    "Unknown"
  ).trim() || "Unknown";
};


/* ============================================================
   SUB INDUSTRY
   ============================================================ */

const getSubIndustry = (row) => {

  return String(
    row?.sub_industry ??
    row?.subIndustry ??
    row?.["Sub Industry"] ??
    row?.SubIndustry ??
    "Unknown"
  ).trim() || "Unknown";
};


/* ============================================================
   TEAM LEADER
   ============================================================ */

const getTeamLeader = (row) => {

  return String(
    row?.team_leader ??
    row?.teamLeader ??
    row?.["Team Leader"] ??
    ""
  ).trim();
};


/* ============================================================
   BD MEMBER
   ============================================================ */

const getBDMember = (row) => {

  return String(
    row?.bd_member ??
    row?.bdMember ??
    row?.["BD Member"] ??
    row?.["BD Members Name"] ??
    ""
  ).trim();
};


/* ============================================================
   BILLING

   IMPORTANT:
   Billing MUST come from total_bill_amount.

   Do NOT use TANN / TDS as billing fallback.
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
    row?.["Info Status"] ??
    ""
  )
    .trim()
    .toUpperCase();
};


/* ============================================================
   FINANCIAL VALUES

   RULES:

   ALL:
     Total Billing = R + RV + C + CN
     Franchise Share = R Franchise Share
     Net Amount = Total Billing - R Franchise Share
     Expenditure = 5% of TOTAL BILLING

   R:
     Total Billing = R Billing
     Franchise Share = R Franchise Share
     Net Amount = R Billing - R Franchise Share
     Expenditure = 5% of R Billing

   RV:
     Total Billing = RV Billing
     Franchise Share = 0
     Net Amount = 0
     Expenditure = 0

   C:
     Total Billing = C Billing
     Franchise Share = 0
     Net Amount = 0
     Expenditure = 0

   CN:
     Total Billing = CN Billing
     Franchise Share = 0
     Net Amount = 0
     Expenditure = 0
   ============================================================ */

const getFinancialValues = (
  rows,
  infoStatus
) => {

  let totalBilling = 0;

  let rBilling = 0;

  let totalFranchiseShare = 0;


  rows.forEach((row) => {

    const status =
      getInfoStatus(row);

    const billing =
      getBilling(row);


    /* --------------------------------------------------------
       TOTAL BILLING
       -------------------------------------------------------- */

    const matchesInfo =
      !infoStatus ||
      infoStatus === "All" ||
      status === infoStatus;


    if (matchesInfo) {

      totalBilling += billing;

    }


    /* --------------------------------------------------------
       R BILLING + FRANCHISE SHARE
       -------------------------------------------------------- */

    if (status === "R") {

      rBilling += billing;

      totalFranchiseShare +=
        getFranchiseeShare(row);

    }

  });


  /* ----------------------------------------------------------
     NON-REVENUE STATUS
     ---------------------------------------------------------- */

  const isNonRevenueStatus =
    infoStatus === "RV" ||
    infoStatus === "C" ||
    infoStatus === "CN";


  /* ----------------------------------------------------------
     NET AMOUNT
     ---------------------------------------------------------- */

  const netAmount =
    isNonRevenueStatus
      ? 0
      : totalBilling -
        totalFranchiseShare;


  /* ----------------------------------------------------------
     FRANCHISE SHARE
     ---------------------------------------------------------- */

  const applicableFranchiseShare =
    isNonRevenueStatus
      ? 0
      : totalFranchiseShare;


  /* ----------------------------------------------------------
     EXPENDITURE

     ALL:
       5% of total billing

     R:
       5% of R billing

     RV / C / CN:
       0
     ---------------------------------------------------------- */

  let industryExpenditure = 0;


  if (
    infoStatus === "All" ||
    !infoStatus
  ) {

    industryExpenditure =
      totalBilling * 0.05;

  } else if (
    infoStatus === "R"
  ) {

    industryExpenditure =
      rBilling * 0.05;

  } else if (
    infoStatus === "RV" ||
    infoStatus === "C" ||
    infoStatus === "CN"
  ) {

    industryExpenditure = 0;

  }


  return {

    totalBilling,

    totalFranchiseShare:
      applicableFranchiseShare,

    netAmount,

    industryExpenditure

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
    row?.acquisition_date ??
    row?.["Acquisition Date"] ??
    null
  );
};


/* ============================================================
   FINANCIAL YEAR

   April 2025 - March 2026 = FY 2025-26
   ============================================================ */

const getFinancialYear = (dateValue) => {

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

  const month =
    date.getMonth();

  const year =
    date.getFullYear();

  if (month >= 3) {

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

   Financial year starts from April.
   ============================================================ */

const getMonth = (dateValue) => {

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

  return date.toLocaleString(
    "en-US",
    {
      month: "long"
    }
  );
};


/* ============================================================
   MOST FREQUENT VALUE
   ============================================================ */

const getMostFrequent = (
  values
) => {

  const filtered =
    values.filter(
      (value) =>
        value &&
        String(value).trim()
    );

  if (!filtered.length) {
    return "N/A";
  }

  const counts = {};

  filtered.forEach(
    (value) => {

      const key =
        String(value).trim();

      counts[key] =
        (counts[key] || 0) + 1;

    }
  );

  return Object.entries(counts)
    .sort(
      (a, b) =>
        b[1] - a[1]
    )[0][0];
};


/* ============================================================
   INDUSTRY TOOLTIP
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
   COMPONENT
   ============================================================ */

function IndustryPerformance() {

  const {
    rows
  } = useData();


  /* ----------------------------------------------------------
     STATE
     ---------------------------------------------------------- */

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

      return Array.from(years)
        .sort(
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
     ========================================================== */

  const industryData =
    useMemo(() => {

      const grouped = {};


      (rows || []).forEach(
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


          if (
            selectedFinancialYear &&
            fy !==
              selectedFinancialYear
          ) {
            return;
          }


          if (
            !grouped[industry]
          ) {

            grouped[industry] = {
              industry,
              rows: []
            };

          }


          grouped[industry].rows.push(
            row
          );

        }
      );


      return Object.values(
        grouped
      ).map(
        (group) => {

          const financial =
            getFinancialValues(
              group.rows,
              selectedInfoStatus
            );


          return {

            industry:
              group.industry,

            totalClients:
              group.rows.length,

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

          const industry =
            getIndustry(row);

          if (
            industry !==
            selectedIndustry
          ) {
            return false;
          }


          if (
            selectedFinancialYear
          ) {

            const fy =
              getFinancialYear(
                getClientAcquiredDate(
                  row
                )
              );

            if (
              fy !==
              selectedFinancialYear
            ) {
              return false;
            }

          }


          return true;

        }
      );

    }, [
      rows,
      selectedIndustry,
      selectedFinancialYear
    ]);


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
     SUB INDUSTRY DATA
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
     YEARLY REPORT DATA
     ========================================================== */

  const yearlyReportData =
    useMemo(() => {

      const grouped = {};


      selectedRows.forEach(
        (row) => {

          const fy =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );


          if (!fy) {
            return;
          }


          if (!grouped[fy]) {

            grouped[fy] = [];

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
          ([year, yearRows]) => {

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
      selectedInfoStatus
    ]);


  /* ==========================================================
     MONTHLY REPORT DATA
     ========================================================== */

  const monthlyReportData =
    useMemo(() => {

      if (
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


          if (!grouped[month]) {

            grouped[month] = [];

          }


          grouped[month].push(
            row
          );

        }
      );


      return financialMonths
        .map(
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


  return (

    <div className="industry-performance">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="industry-header">

        <div>

          <h2>
            Industry Performance
          </h2>

          <p>
            Industry-wise client,
            billing and performance
            analysis
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN FILTERS
          ====================================================== */}

      <div className="industry-filters">

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


      {/* ======================================================
          INDUSTRY TABLE
          ====================================================== */}

      <div className="industry-table-container">

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
                Industry Expenditure
              </th>

              <th>
                Performance
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


      {/* ======================================================
          PERFORMANCE MODAL
          ====================================================== */}

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
                SUMMARY CARDS
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
                  {selectedRows.length.toLocaleString(
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
                        key={item.name}
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
                MODAL FOOTER
                ================================================== */}

            <div className="industry-modal-footer">

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
