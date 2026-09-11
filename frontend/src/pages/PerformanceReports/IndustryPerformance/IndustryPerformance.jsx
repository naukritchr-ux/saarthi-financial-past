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
  return `₹${toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;
};


const getIndustry = (row) => {
  return (
    row?.industry ??
    row?.["Industry"] ??
    "Unknown"
  );
};


const getSubIndustry = (row) => {
  return (
    row?.sub_industry ??
    row?.["Sub Industry"] ??
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
   BILLING
   IMPORTANT:
   ONLY total_bill_amount IS USED
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

   RULES:

   ALL:
     Total Billing = R + RV + C + CN
     Franchise Share = R Franchise Share
     Net Amount = Total Billing - R Franchise Share
     Expenditure = 5% of R Billing ONLY

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
       ONLY R IS USED FOR EXPENDITURE
       -------------------------------------------------------- */

    if (status === "R") {

      rBilling += billing;

      totalFranchiseShare +=
        getFranchiseeShare(row);

    }

  });


  /* ----------------------------------------------------------
     RV / C / CN HAVE ZERO NET AMOUNT
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
     RV / C / CN = ZERO
     ---------------------------------------------------------- */

  const applicableFranchiseShare =
    isNonRevenueStatus
      ? 0
      : totalFranchiseShare;


  /* ----------------------------------------------------------
     EXPENDITURE

     IMPORTANT:
     EXPENDITURE IS ALWAYS BASED ON R BILLING ONLY.

     All = 5% of R Billing
     R   = 5% of R Billing
     RV  = 0
     C   = 0
     CN  = 0
     ---------------------------------------------------------- */

  const industryExpenditure =
    isNonRevenueStatus
      ? 0
      : rBilling * 0.05;


  return {
    totalBilling,
    totalFranchiseShare:
      applicableFranchiseShare,
    netAmount,
    industryExpenditure
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

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
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

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
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

      <strong>
        {label}
      </strong>


      {payload.map(
        (item, index) => (

          <div key={index}>

            {item.name}:{" "}

            {item.name === "Total Billing"
              ? formatCurrency(item.value)
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

function IndustryPerformance() {

  const { rows } = useData();


  const [
    selectedIndustry,
    setSelectedIndustry
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
     INDUSTRY DATA
     ============================================================ */

  const industryData = useMemo(() => {

    if (
      !rows ||
      rows.length === 0
    ) {
      return [];
    }


    const grouped = {};


    rows.forEach((row) => {

      const industry =
        getIndustry(row);


      if (!grouped[industry]) {
        grouped[industry] = [];
      }


      grouped[industry].push(row);

    });


    return Object.entries(grouped)
      .map(
        ([industry, industryRows]) => {

          const filteredRows =
            selectedFinancialYear
              ? industryRows.filter(
                  (row) =>
                    getFinancialYear(
                      getClientAcquiredDate(row)
                    ) ===
                    selectedFinancialYear
                )
              : industryRows;


          const financial =
            getFinancialValues(
              filteredRows,
              selectedInfoStatus
            );


          return {
            industry,
            clients:
              filteredRows.length,
            totalBilling:
              financial.totalBilling,
            netAmount:
              financial.netAmount,
            industryExpenditure:
              financial.industryExpenditure
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

  const financialYears = useMemo(() => {

    if (
      !rows ||
      rows.length === 0
    ) {
      return [];
    }


    const years = new Set();


    rows.forEach((row) => {

      const year =
        getFinancialYear(
          getClientAcquiredDate(row)
        );


      if (year) {
        years.add(year);
      }

    });


    return Array.from(years).sort();

  }, [rows]);


  /* ============================================================
     SELECTED ROWS
     ============================================================ */

  const selectedRows = useMemo(() => {

    if (!selectedIndustry) {
      return [];
    }


    return (rows || []).filter(
      (row) => {

        const industryMatch =
          getIndustry(row) ===
          selectedIndustry;


        const yearMatch =
          !selectedFinancialYear ||
          getFinancialYear(
            getClientAcquiredDate(row)
          ) ===
          selectedFinancialYear;


        return (
          industryMatch &&
          yearMatch
        );

      }
    );

  }, [
    rows,
    selectedIndustry,
    selectedFinancialYear
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

      return getFinancialValues(
        selectedRows,
        selectedInfoStatus
      );

    }, [
      selectedRows,
      selectedInfoStatus
    ]);


  /* ============================================================
     SUB INDUSTRY DATA
     ============================================================ */

  const subIndustryData =
    useMemo(() => {

      const grouped = {};


      selectedRows.forEach((row) => {

        const subIndustry =
          getSubIndustry(row);


        grouped[subIndustry] =
          (grouped[subIndustry] || 0) + 1;

      });


      return Object.entries(grouped)
        .map(
          ([name, value]) => ({
            name,
            value
          })
        )
        .sort(
          (a, b) =>
            b.value - a.value
        );

    }, [selectedRows]);


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

      if (!selectedIndustry) {
        return [];
      }


      const grouped = {};


      selectedRows.forEach((row) => {

        const date =
          getClientAcquiredDate(row);


        if (!date) {
          return;
        }


        const year =
          getFinancialYear(date);


        if (!year) {
          return;
        }


        if (!grouped[year]) {
          grouped[year] = [];
        }


        grouped[year].push(row);

      });


      return Object.entries(grouped)
        .sort(
          ([a], [b]) =>
            a.localeCompare(b)
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
        );

    }, [
      selectedRows,
      selectedIndustry,
      selectedInfoStatus
    ]);


  /* ============================================================
     MONTHLY REPORT
     ============================================================ */

  const monthlyReportData =
    useMemo(() => {

      if (
        !selectedIndustry ||
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
                  getClientAcquiredDate(row)
                ) ===
                month.full
            );


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


  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* ============================================================
     VIEW PERFORMANCE
     ============================================================ */

  const handleViewPerformance =
    (industry) => {

      setSelectedIndustry(industry);

      setSelectedFinancialYear("");

      setSelectedInfoStatus("");

    };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const handleCloseModal = () => {

    setSelectedIndustry(null);

    setSelectedFinancialYear("");

    setSelectedInfoStatus("");

  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="industry-performance">

      <div className="industry-performance-header">

        <div>

          <h2>
            Industry Performance
          </h2>

          <p>
            Industry-wise client and financial
            performance analysis
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
            value={selectedFinancialYear}
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


        <div className="industry-filter-group">

          <label>
            Info Status
          </label>


          <select
            value={selectedInfoStatus}
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

      <div className="industry-table-card">

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
                  Industry Expenditure
                </th>

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {industryData.length > 0 ? (

                industryData.map(
                  (item) => (

                    <tr
                      key={item.industry}
                    >

                      <td>
                        {item.industry}
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
                          item.industryExpenditure
                        )}
                      </td>


                      <td>

                        <button
                          className="industry-view-btn"
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

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="industry-empty"
                  >
                    No industry data available
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {selectedIndustry && (

        <div className="industry-modal-overlay">

          <div className="industry-modal">

            <div className="industry-modal-header">

              <div>

                <h2>
                  PERFORMANCE REPORT
                </h2>

                <p>
                  {selectedIndustry}
                </p>

              </div>


              <button
                className="industry-close-btn"
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
                  {enquiryCount}
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


            {/* =================================================
                REPORT CONTROLS
                ================================================= */}

            <div className="industry-report-controls">

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


                <div className="industry-report-period">

                  {selectedFinancialYear
                    ? `FY ${selectedFinancialYear} Monthly`
                    : "Yearly Report"}

                </div>

              </div>

            </div>


            {/* =================================================
                CLIENT CHART
                ================================================= */}

            <div className="industry-chart-card">

              <div className="industry-chart-header">

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


            {/* =================================================
                BILLING CHART
                ================================================= */}

            <div className="industry-chart-card">

              <div className="industry-chart-header">

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


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="industry-modal-footer">

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


export default IndustryPerformance;
