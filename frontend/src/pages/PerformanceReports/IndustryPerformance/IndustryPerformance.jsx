import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
   NORMALIZE VALUE
============================================================ */

const normalizeValue = (value) => {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();

};


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

  return `₹${toNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0
    }
  )}`;

};


/* ============================================================
   NUMBER FORMAT
============================================================ */

const formatNumber = (value) => {

  return Number(value || 0).toLocaleString(
    "en-IN"
  );

};


/* ============================================================
   COMPANY NAME
   UNIQUE ACQUIRED CLIENT KEY
============================================================ */

const getCompanyName = (row) => {

  return normalizeValue(
    row?.company_name ??
    row?.CompanyName ??
    row?.companyName ??
    row?.["Company Name"]
  );

};


/* ============================================================
   INDUSTRY
============================================================ */

const getIndustry = (row) => {

  return normalizeValue(
    row?.industry ??
    row?.Industry ??
    row?.["Industry Name"]
  );

};


/* ============================================================
   TEAM LEADER
============================================================ */

const getTeamLeader = (row) => {

  return normalizeValue(
    row?.team_leader ??
    row?.teamLeader ??
    row?.["Team Leader"]
  );

};


/* ============================================================
   BD MEMBER
============================================================ */

const getBDMember = (row) => {

  return normalizeValue(
    row?.bd_member ??
    row?.bdMember ??
    row?.["BD Member"]
  );

};


/* ============================================================
   FRANCHISE NAME
============================================================ */

const getFranchiseName = (row) => {

  return normalizeValue(
    row?.franchise_name ??
    row?.franchiseName ??
    row?.["Franchise Name"]
  );

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

  return normalizeValue(
    row?.info ??
    row?.Info ??
    row?.["Info Status"]
  ).toUpperCase();

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

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  if (month >= 4) {

    return `${year}-${year + 1}`;

  }

  return `${year - 1}-${year}`;

};


/* ============================================================
   MONTH
============================================================ */

const getMonth = (dateValue) => {

  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-IN",
    {
      month: "long"
    }
  );

};


/* ============================================================
   INFO STATUS MATCH
============================================================ */

const matchesInfoStatus = (
  row,
  selectedStatus
) => {

  const status = normalizeValue(
    selectedStatus || "All"
  ).toUpperCase();

  if (status === "ALL") {
    return true;
  }

  return (
    getInfoStatus(row) === status
  );

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

    const value =
      getter(row);

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

      if (
        count > highest
      ) {

        highest = count;
        result = value;

      }

    }
  );

  return result;

};


/* ============================================================
   INDUSTRY EXPENDITURE
============================================================ */

const getIndustryExpenditure = (
  row,
  percentage
) => {

  if (
    percentage === null ||
    percentage === undefined ||
    percentage === ""
  ) {
    return 0;
  }

  const rate =
    Number(percentage);

  if (
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    return 0;
  }

  const billing =
    getBilling(row);

  return billing * (
    rate / 100
  );

};


/* ============================================================
   FINANCIAL CALCULATION
============================================================ */

const getFinancialValues = (
  row,
  infoFilter = "",
  percentage
) => {

  const info =
    getInfoStatus(row);

  const billing =
    getBilling(row);


  /* ----------------------------------------------------------
     ALL
  ---------------------------------------------------------- */

  if (
    !infoFilter ||
    infoFilter === "All" ||
    infoFilter === "ALL"
  ) {

    const expenditure =
      getIndustryExpenditure(
        row,
        percentage
      );

    return {

      billing,

      expenditure,

      netAmount:
        billing - expenditure

    };

  }


  /* ----------------------------------------------------------
     R
  ---------------------------------------------------------- */

  if (
    infoFilter === "R"
  ) {

    if (info !== "R") {

      return {
        billing: 0,
        expenditure: 0,
        netAmount: 0
      };

    }

    const expenditure =
      getIndustryExpenditure(
        row,
        percentage
      );

    return {

      billing,

      expenditure,

      netAmount:
        billing - expenditure

    };

  }


  /* ----------------------------------------------------------
     RV
  ---------------------------------------------------------- */

  if (
    infoFilter === "RV"
  ) {

    if (info !== "RV") {

      return {
        billing: 0,
        expenditure: 0,
        netAmount: 0
      };

    }

    return {

      billing,

      expenditure: 0,

      netAmount: 0

    };

  }


  /* ----------------------------------------------------------
     C
  ---------------------------------------------------------- */

  if (
    infoFilter === "C"
  ) {

    if (info !== "C") {

      return {
        billing: 0,
        expenditure: 0,
        netAmount: 0
      };

    }

    return {

      billing,

      expenditure: 0,

      netAmount: 0

    };

  }


  /* ----------------------------------------------------------
     CN
  ---------------------------------------------------------- */

  if (
    infoFilter === "CN"
  ) {

    if (info !== "CN") {

      return {
        billing: 0,
        expenditure: 0,
        netAmount: 0
      };

    }

    return {

      billing,

      expenditure: 0,

      netAmount: 0

    };

  }


  return {

    billing: 0,

    expenditure: 0,

    netAmount: 0

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

    <div className="industry-modern-tooltip">

      <div className="industry-tooltip-label">
        Performance
      </div>

      <div className="industry-tooltip-industry">
        {label}
      </div>

      {payload.map(
        (item, index) => (

          <div
            key={index}
            className="industry-tooltip-row"
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
                : item.value}

            </strong>

          </div>

        )
      )}

    </div>

  );

};


/* ============================================================
   MAIN COMPONENT
============================================================ */

function IndustryPerformance() {

  const {
    rows,
    loading,
    error
  } = useData();


  /* ==========================================================
     STATES
  ========================================================== */

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState(null);


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState(
    "All Financial Years"
  );


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("All");


  const [
    industryExpenditurePercentage,
    setIndustryExpenditurePercentage
  ] = useState("");


  const [
    showModal,
    setShowModal
  ] = useState(false);


  /* ==========================================================
     MODAL REPORT FILTERS
  ========================================================== */

  const [
    reportYear,
    setReportYear
  ] = useState(
    "All Financial Years"
  );


  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("All");


  /* ==========================================================
     INDUSTRY EXPENDITURE VALIDITY
  ========================================================== */

  const hasIndustryExpenditurePercentage =
    industryExpenditurePercentage !== "" &&
    industryExpenditurePercentage !== null &&
    industryExpenditurePercentage !== undefined &&
    Number.isFinite(
      Number(
        industryExpenditurePercentage
      )
    ) &&
    Number(
      industryExpenditurePercentage
    ) >= 0;


  /* ==========================================================
     FINANCIAL YEARS
  ========================================================== */

  const financialYears =
    useMemo(() => {

      const years =
        new Set();

      rows.forEach((row) => {

        const date =
          getClientAcquiredDate(row);

        const financialYear =
          getFinancialYear(date);

        if (
          financialYear
        ) {

          years.add(
            financialYear
          );

        }

      });

      return Array.from(years)
        .sort(
          (a, b) =>
            b.localeCompare(a)
        );

    }, [rows]);


  /* ==========================================================
     INDUSTRIES
  ========================================================== */

  const industries =
    useMemo(() => {

      const values =
        new Set();

      rows.forEach((row) => {

        const industry =
          getIndustry(row);

        if (industry) {

          values.add(
            industry
          );

        }

      });

      return Array.from(values)
        .sort();

    }, [rows]);


  /* ==========================================================
     INDUSTRY TABLE DATA
     
     UNIQUE COMPANY NAME
     TOTAL ENQUIRIES
     FY + INFO FILTER
  ========================================================== */

  const industryData =
    useMemo(() => {

      const grouped = {};

      const sourceRows =
        rows.filter((row) => {

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
            !selectedIndustry ||
            industry ===
              selectedIndustry;

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


      sourceRows.forEach((row) => {

        const industry =
          getIndustry(row) ||
          "Unknown";

        if (!grouped[industry]) {

          grouped[industry] = {

            rows: [],

            companyNames:
              new Set(),

            franchiseNames:
              new Set()

          };

        }


        grouped[industry]
          .rows
          .push(row);


        /* UNIQUE COMPANY NAME */

        const companyName =
          getCompanyName(row);

        if (companyName) {

          grouped[industry]
            .companyNames
            .add(
              companyName
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase()
            );

        }


        /* UNIQUE FRANCHISE */

        const franchiseName =
          getFranchiseName(row);

        if (franchiseName) {

          grouped[industry]
            .franchiseNames
            .add(
              franchiseName
            );

        }

      });


      return Object.entries(
        grouped
      )
        .map(
          ([industry, group]) => {

            let totalBilling = 0;
            let expenditure = 0;
            let netAmount = 0;

            group.rows.forEach(
              (row) => {

                const financial =
                  getFinancialValues(
                    row,
                    selectedInfoStatus,
                    industryExpenditurePercentage
                  );

                totalBilling +=
                  financial.billing;

                expenditure +=
                  financial.expenditure;

                netAmount +=
                  financial.netAmount;

              }
            );


            return {

              industry,

              totalClients:
                group.companyNames.size,

              totalEnquiries:
                group.rows.length,

              noOfFranchisee:
                group.franchiseNames.size,

              totalBilling,

              netAmount,

              industryExpenditure:
                expenditure

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
      selectedIndustry,
      selectedFinancialYear,
      selectedInfoStatus,
      industryExpenditurePercentage
    ]);


  /* ==========================================================
     SELECTED INDUSTRY ROWS
  ========================================================== */

  const selectedRows =
    useMemo(() => {

      return rows.filter(
        (row) => {

          const date =
            getClientAcquiredDate(
              row
            );

          const financialYear =
            getFinancialYear(
              date
            );

          const financialYearMatch =
            selectedFinancialYear ===
              "All Financial Years" ||
            financialYear ===
              selectedFinancialYear;

          const industryMatch =
            !selectedIndustry ||
            getIndustry(row) ===
              selectedIndustry;

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

        }
      );

    }, [
      rows,
      selectedIndustry,
      selectedFinancialYear,
      selectedInfoStatus
    ]);


  /* ==========================================================
     PERFORMANCE SUMMARY
  ========================================================== */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;
      let expenditure = 0;
      let netAmount = 0;

      selectedRows.forEach(
        (row) => {

          const financial =
            getFinancialValues(
              row,
              selectedInfoStatus,
              industryExpenditurePercentage
            );

          totalBilling +=
            financial.billing;

          expenditure +=
            financial.expenditure;

          netAmount +=
            financial.netAmount;

        }
      );

      return {
        totalBilling,
        expenditure,
        netAmount
      };

    }, [
      selectedRows,
      selectedInfoStatus,
      industryExpenditurePercentage
    ]);


  /* ==========================================================
     TOP TEAM LEADER
  ========================================================== */

  const topTeamLeader =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getTeamLeader
      );

    }, [
      selectedRows
    ]);


  /* ==========================================================
     TOP BD MEMBER
  ========================================================== */

  const topBDMember =
    useMemo(() => {

      return getMostFrequent(
        selectedRows,
        getBDMember
      );

    }, [
      selectedRows
    ]);


  /* ==========================================================
     REPORT ROWS

     MODAL FILTERS:
     - Selected Industry
     - Report Financial Year
     - Report Info Status
  ========================================================== */

  const reportRows =
    useMemo(() => {

      if (
        !selectedIndustry
      ) {
        return [];
      }

      return rows.filter(
        (row) => {

          const date =
            getClientAcquiredDate(
              row
            );

          const financialYear =
            getFinancialYear(
              date
            );

          const financialYearMatch =
            reportYear ===
              "All Financial Years" ||
            financialYear ===
              reportYear;

          const infoStatusMatch =
            matchesInfoStatus(
              row,
              reportInfoStatus
            );

          return (
            getIndustry(row) ===
              selectedIndustry &&
            financialYearMatch &&
            infoStatusMatch
          );

        }
      );

    }, [
      rows,
      selectedIndustry,
      reportYear,
      reportInfoStatus
    ]);


  /* ==========================================================
     MODAL SUMMARY

     UNIQUE COMPANY NAME
     TOTAL ENQUIRIES
  ========================================================== */

  const modalSummary =
    useMemo(() => {

      let totalBilling = 0;
      let expenditure = 0;
      let netAmount = 0;

      const companyNames =
        new Set();


      reportRows.forEach(
        (row) => {

          const companyName =
            getCompanyName(row);

          if (companyName) {

            companyNames.add(
              companyName
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase()
            );

          }


          const financial =
            getFinancialValues(
              row,
              reportInfoStatus,
              industryExpenditurePercentage
            );

          totalBilling +=
            financial.billing;

          expenditure +=
            financial.expenditure;

          netAmount +=
            financial.netAmount;

        }
      );


      return {

        clients:
          companyNames.size,

        totalEnquiries:
          reportRows.length,

        totalBilling,

        expenditure,

        netAmount

      };

    }, [
      reportRows,
      reportInfoStatus,
      industryExpenditurePercentage
    ]);


  /* ==========================================================
     MODAL YEAR PERFORMANCE

     UNIQUE COMPANY NAME
  ========================================================== */

  const modalYearPerformance =
    useMemo(() => {

      const grouped = {};


      reportRows.forEach(
        (row) => {

          const financialYear =
            getFinancialYear(
              getClientAcquiredDate(
                row
              )
            );


          if (
            !financialYear
          ) {
            return;
          }


          if (
            !grouped[
              financialYear
            ]
          ) {

            grouped[
              financialYear
            ] = {

              year:
                financialYear,

              billing: 0,

              companyNames:
                new Set()

            };

          }


          const companyName =
            getCompanyName(row);

          if (companyName) {

            grouped[
              financialYear
            ]
              .companyNames
              .add(
                companyName
                  .replace(/\s+/g, " ")
                  .trim()
                  .toUpperCase()
              );

          }


          const financial =
            getFinancialValues(
              row,
              reportInfoStatus,
              industryExpenditurePercentage
            );


          grouped[
            financialYear
          ].billing +=
            financial.billing;

        }
      );


      return Object.values(grouped)
        .map((item) => ({

          year:
            item.year,

          clients:
            item.companyNames.size,

          billing:
            item.billing

        }))
        .sort(
          (a, b) =>
            a.year.localeCompare(
              b.year
            )
        );

    }, [
      reportRows,
      reportInfoStatus,
      industryExpenditurePercentage
    ]);


  /* ==========================================================
     MODAL MONTHLY PERFORMANCE

     UNIQUE COMPANY NAME
  ========================================================== */

  const modalMonthlyPerformance =
    useMemo(() => {

      const grouped = {};


      financialMonths.forEach(
        (month) => {

          grouped[month] = {

            month,

            billing: 0,

            companyNames:
              new Set()

          };

        }
      );


      reportRows.forEach(
        (row) => {

          const month =
            getMonth(
              getClientAcquiredDate(
                row
              )
            );


          if (
            grouped[month]
          ) {

            const companyName =
              getCompanyName(row);


            if (companyName) {

              grouped[month]
                .companyNames
                .add(
                  companyName
                    .replace(/\s+/g, " ")
                    .trim()
                    .toUpperCase()
                );

            }


            const financial =
              getFinancialValues(
                row,
                reportInfoStatus,
                industryExpenditurePercentage
              );


            grouped[month]
              .billing +=
              financial.billing;

          }

        }
      );


      return financialMonths.map(
        (month) => ({

          month,

          clients:
            grouped[month]
              .companyNames
              .size,

          billing:
            grouped[month]
              .billing

        })
      );

    }, [
      reportRows,
      reportInfoStatus,
      industryExpenditurePercentage
    ]);


  /* ==========================================================
     MODAL TOP TEAM LEADER
  ========================================================== */

  const modalTopTeamLeader =
    useMemo(() => {

      return getMostFrequent(
        reportRows,
        getTeamLeader
      );

    }, [
      reportRows
    ]);


  /* ==========================================================
     MODAL TOP BD MEMBER
  ========================================================== */

  const modalTopBDMember =
    useMemo(() => {

      return getMostFrequent(
        reportRows,
        getBDMember
      );

    }, [
      reportRows
    ]);


  /* ==========================================================
     OPEN MODAL
  ========================================================== */

  const handleViewPerformance = (
    industry
  ) => {

    setSelectedIndustry(
      industry
    );

    setReportYear(
      selectedFinancialYear
    );

    setReportInfoStatus(
      selectedInfoStatus
    );

    setShowModal(true);

  };


  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  const handleCloseModal = () => {

    setShowModal(false);

    setSelectedIndustry(null);

  };


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {

    return (

      <div className="industry-performance">

        <div className="industry-no-data">

          Loading industry performance...

        </div>

      </div>

    );

  }


  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {

    return (

      <div className="industry-performance">

        <div className="industry-no-data">

          <h3>
            Unable to load industry performance
          </h3>

          <p>
            {error}
          </p>

        </div>

      </div>

    );

  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (

    <div className="industry-performance">


      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="industry-performance-header">

        <div>

          <div className="industry-page-eyebrow">
            PERFORMANCE REPORT
          </div>

          <h1>
            Industry Performance
          </h1>

          <p>
            Analyze client acquisition,
            billing and financial performance
            industry-wise.
          </p>

        </div>

      </div>


      {/* ======================================================
          TABLE CARD
      ====================================================== */}

      <div className="industry-table-card">


        {/* ====================================================
            TABLE HEADER
        ==================================================== */}

        <div className="industry-table-header">

          <div>

            <h2>
              Industry Performance
            </h2>

            <span className="industry-member-count">

              {industryData.length}{" "}

              {industryData.length === 1
                ? "Industry"
                : "Industries"}

            </span>

          </div>

        </div>


        {/* ====================================================
            PAGE FILTERS
        ==================================================== */}

        <div className="industry-performance-filters">


          {/* FINANCIAL YEAR */}

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

              <option value="All Financial Years">
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


          {/* INFO STATUS */}

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


          {/* INDUSTRY */}

          <div className="industry-filter-group">

            <label>
              Industry
            </label>

            <select
              value={
                selectedIndustry || "All"
              }
              onChange={(event) => {

                const value =
                  event.target.value;

                setSelectedIndustry(
                  value === "All"
                    ? null
                    : value
                );

              }}
            >

              <option value="All">
                All
              </option>

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


          {/* INDUSTRY EXPENDITURE % */}

          <div className="industry-filter-group">

            <label
              htmlFor="industry-expenditure-percentage"
            >
              Industry Expenditure %
            </label>

            <input
              id="industry-expenditure-percentage"
              type="number"
              min="0"
              step="0.01"
              value={
                industryExpenditurePercentage
              }
              placeholder="Enter %"
              onChange={(event) => {

                setIndustryExpenditurePercentage(
                  event.target.value
                );

              }}
            />

          </div>

        </div>


        {/* ====================================================
            TABLE
        ==================================================== */}

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
                  Total Enquiries
                </th>

                <th>
                  No. of Franchisee
                </th>

                <th>
                  Total Billing
                </th>

                <th>
                  Net Amount
                </th>

                {hasIndustryExpenditurePercentage && (

                  <th>
                    Expenditure
                  </th>

                )}

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {industryData.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      hasIndustryExpenditurePercentage
                        ? 8
                        : 7
                    }
                    className="industry-no-data"
                  >

                    No industry data available
                    for the selected filters.

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

                        <div className="industry-name-cell">

                          <span className="industry-avatar">

                            {item.industry
                              .charAt(0)
                              .toUpperCase()}

                          </span>

                          <span className="industry-name">

                            {item.industry}

                          </span>

                        </div>

                      </td>


                      {/* UNIQUE ACQUIRED CLIENT */}

                      <td>

                        <span className="industry-client-count">

                          {formatNumber(
                            item.totalClients
                          )}

                        </span>

                      </td>


                      {/* TOTAL ENQUIRIES */}

                      <td>

                        <span className="industry-client-count">

                          {formatNumber(
                            item.totalEnquiries
                          )}

                        </span>

                      </td>


                      <td>

                        <span className="industry-client-count">

                          {formatNumber(
                            item.noOfFranchisee
                          )}

                        </span>

                      </td>


                      <td>

                        <span className="industry-billing-value">

                          {formatCurrency(
                            item.totalBilling
                          )}

                        </span>

                      </td>


                      <td>

                        <span className="industry-net-value">

                          {formatCurrency(
                            item.netAmount
                          )}

                        </span>

                      </td>


                      {hasIndustryExpenditurePercentage && (

                        <td>

                          <span className="industry-expenditure-value">

                            {formatCurrency(
                              item.industryExpenditure
                            )}

                          </span>

                        </td>

                      )}


                      <td>

                        <button
                          type="button"
                          className="industry-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              item.industry
                            )
                          }
                        >

                          View Performance

                          <span className="industry-btn-arrow">
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


      {/* ======================================================
          PERFORMANCE MODAL
      ====================================================== */}

      {showModal &&
        selectedIndustry && (

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


              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="industry-modal-header">

                <div>

                  <div className="industry-modal-eyebrow">
                    INDUSTRY PERFORMANCE
                  </div>

                  <h2>
                    {selectedIndustry}
                  </h2>

                  <p>
                    Detailed performance
                    analysis for{" "}
                    {selectedIndustry}.
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


              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="industry-summary-grid">

                {/* ACQUIRED CLIENT */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Total Acquired Client
                  </span>

                  <strong className="industry-summary-value">

                    {formatNumber(
                      modalSummary.clients
                    )}

                  </strong>

                </div>


                {/* TOTAL ENQUIRIES */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Total Enquiries
                  </span>

                  <strong className="industry-summary-value">

                    {formatNumber(
                      modalSummary.totalEnquiries
                    )}

                  </strong>

                </div>


                {/* TOTAL BILLING */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Total Billing
                  </span>

                  <strong className="industry-summary-value">

                    {formatCurrency(
                      modalSummary.totalBilling
                    )}

                  </strong>

                </div>


                {/* NET AMOUNT */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Net Amount
                  </span>

                  <strong className="industry-summary-net">

                    {formatCurrency(
                      modalSummary.netAmount
                    )}

                  </strong>

                </div>


                {/* EXPENDITURE */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Expenditure
                  </span>

                  <strong className="industry-summary-value">

                    {formatCurrency(
                      modalSummary.expenditure
                    )}

                  </strong>

                </div>


                {/* TOP TEAM LEADER */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Top Team Leader
                  </span>

                  <strong className="industry-summary-text">

                    {modalTopTeamLeader}

                  </strong>

                </div>


                {/* TOP BD MEMBER */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Top BD Member
                  </span>

                  <strong className="industry-summary-text">

                    {modalTopBDMember}

                  </strong>

                </div>

              </div>


              {/* =================================================
                  REPORT FILTERS
              ================================================= */}

              <div className="industry-report-controls">


                {/* REPORT FINANCIAL YEAR */}

                <div className="industry-report-filter">

                  <label>
                    Report Financial Year
                  </label>

                  <select
                    value={
                      reportYear
                    }
                    onChange={(event) =>
                      setReportYear(
                        event.target.value
                      )
                    }
                  >

                    <option value="All Financial Years">
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


                {/* =================================================
                    REPORT INFO STATUS
                ================================================= */}

                <div className="industry-report-filter">

                  <label>
                    Info Status
                  </label>

                  <select
                    value={
                      reportInfoStatus
                    }
                    onChange={(event) =>
                      setReportInfoStatus(
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


                {/* SHOWING */}

                <div className="industry-report-period">

                  <span>
                    Showing
                  </span>

                  <strong>
                    {reportYear}
                  </strong>

                </div>

              </div>


              {/* =================================================
                  REPORT GRAPHS
              ================================================= */}

              <div className="industry-report-graphs">


                {/* =================================================
                    YEARLY CLIENT ACQUISITION
                ================================================= */}

                <div className="industry-chart-card">

                  <div className="industry-chart-heading">

                    <div>

                      <span className="industry-chart-indicator industry-client-indicator" />

                      <h3>
                        Yearly Client Acquisition
                      </h3>

                    </div>

                    <span>
                      Unique Company Name
                    </span>

                  </div>


                  <div className="industry-chart-container">

                    {modalYearPerformance.length === 0 ? (

                      <div className="industry-chart-no-data">
                        No data available
                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <BarChart
                          data={
                            modalYearPerformance
                          }
                          margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 10
                          }}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="year"
                          />

                          <YAxis
                            allowDecimals={false}
                          />

                          <Tooltip
                            content={
                              <IndustryTooltip />
                            }
                          />

                          <Legend />

                          <Bar
                            dataKey="clients"
                            name="Clients"
                            fill="#B78A34"
                            radius={[
                              6,
                              6,
                              0,
                              0
                            ]}
                            minPointSize={4}
                            isAnimationActive={false}
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </div>

                </div>


                {/* =================================================
                    MONTHLY BILLING
                ================================================= */}

                <div className="industry-chart-card">

                  <div className="industry-chart-heading">

                    <div>

                      <span className="industry-chart-indicator industry-billing-indicator" />

                      <h3>
                        Monthly Billing Performance
                      </h3>

                    </div>

                    <span>
                      Total Billing
                    </span>

                  </div>


                  <div className="industry-chart-container">

                    {modalMonthlyPerformance.length === 0 ? (

                      <div className="industry-chart-no-data">
                        No data available
                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <BarChart
                          data={
                            modalMonthlyPerformance
                          }
                          margin={{
                            top: 10,
                            right: 20,
                            left: 0,
                            bottom: 10
                          }}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="month"
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={65}
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
                            fill="#26734D"
                            radius={[
                              6,
                              6,
                              0,
                              0
                            ]}
                            minPointSize={4}
                            isAnimationActive={false}
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </div>

                </div>


                {/* =================================================
                    TEAM LEADER / BD MEMBER
                ================================================= */}

                <div className="industry-owner-grid">

                  <div className="industry-owner-card">

                    <span>
                      TOP TEAM LEADER
                    </span>

                    <strong>
                      {modalTopTeamLeader}
                    </strong>

                  </div>


                  <div className="industry-owner-card">

                    <span>
                      TOP BD MEMBER
                    </span>

                    <strong>
                      {modalTopBDMember}
                    </strong>

                  </div>

                </div>


              </div>


              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="industry-modal-footer">

                <span>

                  Showing performance for{" "}

                  <strong>
                    {selectedIndustry}
                  </strong>

                  {" • "}

                  {reportYear}

                  {" • Info: "}

                  <strong>
                    {reportInfoStatus}
                  </strong>

                  {" • "}

                  {reportRows.length} records

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