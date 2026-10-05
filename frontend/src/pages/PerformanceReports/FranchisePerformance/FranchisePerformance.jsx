import {
  useMemo,
  useState,
  useEffect
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

import "./FranchisePerformance.css";


/* =========================================================
   FINANCIAL YEAR MONTHS
========================================================= */

const financialMonths = [
  { full: "April", short: "Apr", month: 4 },
  { full: "May", short: "May", month: 5 },
  { full: "June", short: "Jun", month: 6 },
  { full: "July", short: "Jul", month: 7 },
  { full: "August", short: "Aug", month: 8 },
  { full: "September", short: "Sep", month: 9 },
  { full: "October", short: "Oct", month: 10 },
  { full: "November", short: "Nov", month: 11 },
  { full: "December", short: "Dec", month: 12 },
  { full: "January", short: "Jan", month: 1 },
  { full: "February", short: "Feb", month: 2 },
  { full: "March", short: "Mar", month: 3 }
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
    return Number.isFinite(value) ? value : 0;
  }

  const cleanedValue = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleanedValue);

  return Number.isFinite(number) ? number : 0;
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
  ).format(toNumber(value));
}


/* =========================================================
   NORMALIZE COMPANY NAME
========================================================= */

function normalizeCompanyKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}


/* =========================================================
   GET FRANCHISE
========================================================= */

function getFranchise(row) {
  return String(
    row?.franchise_name ??
    row?.["Franchise Name"] ??
    row?.franchise ??
    row?.["Franchise"] ??
    row?.franchiseName ??
    ""
  ).trim();
}


/* =========================================================
   GET COMPANY NAME
========================================================= */

function getCompanyName(row) {
  return String(
    row?.company_name ??
    row?.["Company Name"] ??
    row?.company ??
    row?.["Company"] ??
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
    row?.["Industry Name"] ??
    ""
  ).trim();
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
   GET INFO STATUS
========================================================= */

function getInfoStatus(row) {
  return String(
    row?.info ??
    row?.["Info"] ??
    row?.info_status ??
    row?.["Info Status"] ??
    row?.information_status ??
    row?.["Information Status"] ??
    ""
  )
    .trim()
    .toUpperCase();
}


/* =========================================================
   GET BILLING
========================================================= */

function getBilling(row) {
  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    row?.billing ??
    row?.["Billing"] ??
    row?.total_billing ??
    row?.["Total Billing"] ??
    0
  );
}


/* =========================================================
   GET FRANCHISE SHARE
========================================================= */

function getFranchiseeShare(row) {
  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"] ??
    row?.franchise_cost ??
    row?.["Franchise Cost"] ??
    row?.franchisee_cost ??
    row?.["Franchisee Cost"] ??
    0
  );
}


/* =========================================================
   GET FRANCHISE EXPENDITURE
========================================================= */

function getFranchiseExpenditure(
  row,
  percentage
) {
  const billing = getBilling(row);

  if (
    percentage === null ||
    percentage === undefined ||
    percentage === ""
  ) {
    return 0;
  }

  const rate = Number(percentage);

  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100
  ) {
    return 0;
  }

  return billing * (rate / 100);
}


/* =========================================================
   GET FINANCIAL VALUES
========================================================= */

function getFinancialValues(
  row,
  infoFilter = "",
  percentage
) {
  const info = getInfoStatus(row);
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {
    return {
      billing,
      franchiseeShare,
      netAmount:
        billing - franchiseeShare,
      franchiseExpenditure:
        getFranchiseExpenditure(
          row,
          percentage
        )
    };
  }

  if (infoFilter === "R") {
    if (info !== "R") {
      return {
        billing: 0,
        franchiseeShare: 0,
        netAmount: 0,
        franchiseExpenditure: 0
      };
    }

    return {
      billing,
      franchiseeShare,
      netAmount:
        billing - franchiseeShare,
      franchiseExpenditure:
        getFranchiseExpenditure(
          row,
          percentage
        )
    };
  }

  if (
    infoFilter === "RV" ||
    infoFilter === "C" ||
    infoFilter === "CN"
  ) {
    if (info !== infoFilter) {
      return {
        billing: 0,
        franchiseeShare: 0,
        netAmount: 0,
        franchiseExpenditure: 0
      };
    }

    return {
      billing,
      franchiseeShare: 0,
      netAmount: 0,
      franchiseExpenditure: 0
    };
  }

  return {
    billing: 0,
    franchiseeShare: 0,
    netAmount: 0,
    franchiseExpenditure: 0
  };
}


/* =========================================================
   GET CLIENT ACQUIRED DATE
========================================================= */

function getClientAcquiredDate(row) {
  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    row?.client_acquired_date ??
    row?.["Client Acquired Date"] ??
    row?.date_acquired ??
    row?.["Date Acquired"] ??
    ""
  );
}


/* =========================================================
   PARSE DATE
========================================================= */

function parseDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  const ddmmyyyy =
    stringValue.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
    );

  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const isoDate =
    stringValue.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const date = new Date(stringValue);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}


/* =========================================================
   GET FINANCIAL YEAR
========================================================= */

function getFinancialYear(row) {
  const dateValue =
    getClientAcquiredDate(row);

  const date =
    parseDate(dateValue);

  if (date) {
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

  const acquiredYear =
    row?.acquired_year ??
    row?.["Aquired Year"] ??
    row?.["Acquired Year"] ??
    row?.aquired_year ??
    row?.["aquired_year"];

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

  const date =
    parseDate(dateValue);

  if (!date) {
    return "";
  }

  return date.getMonth() + 1;
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

      {payload.map(
        (item, index) => (
          <div
            className="franchise-tooltip-row"
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

function FranchisePerformance() {

  const {
    rows = []
  } = useData();


  /* =======================================================
     MAIN PAGE FILTERS
  ======================================================= */

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");

  /*
   * MAIN PAGE EXPENDITURE %
   *
   * This state belongs ONLY to the main table.
   */
  const [
    franchiseExpenditurePercentage,
    setFranchiseExpenditurePercentage
  ] = useState("");


  /* =======================================================
     MODAL / REPORT FILTERS
  ======================================================= */

  const [
    selectedFranchise,
    setSelectedFranchise
  ] = useState("");

  const [
    reportFinancialYear,
    setReportFinancialYear
  ] = useState("");

  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("");

  /*
   * MODAL EXPENDITURE %
   *
   * IMPORTANT:
   * This is completely independent from the
   * main-page expenditure percentage.
   */
  const [
    reportFranchiseExpenditurePercentage,
    setReportFranchiseExpenditurePercentage
  ] = useState("");


  /* =======================================================
     MAIN EXPENDITURE VALIDITY
  ======================================================= */

  const hasFranchiseExpenditurePercentage =
    franchiseExpenditurePercentage !== "" &&
    franchiseExpenditurePercentage !== null &&
    franchiseExpenditurePercentage !== undefined &&
    Number.isFinite(
      Number(
        franchiseExpenditurePercentage
      )
    ) &&
    Number(
      franchiseExpenditurePercentage
    ) >= 0 &&
    Number(
      franchiseExpenditurePercentage
    ) <= 100;


  /* =======================================================
     REPORT EXPENDITURE VALIDITY
  ======================================================= */

  const hasReportFranchiseExpenditurePercentage =
    reportFranchiseExpenditurePercentage !== "" &&
    reportFranchiseExpenditurePercentage !== null &&
    reportFranchiseExpenditurePercentage !== undefined &&
    Number.isFinite(
      Number(
        reportFranchiseExpenditurePercentage
      )
    ) &&
    Number(
      reportFranchiseExpenditurePercentage
    ) >= 0 &&
    Number(
      reportFranchiseExpenditurePercentage
    ) <= 100;


  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears =
    useMemo(() => {

      const years = new Set();

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
     MAIN FRANCHISE SUMMARY TABLE
  ======================================================= */

  const franchiseData =
    useMemo(() => {

      const map = new Map();

      rows.forEach(row => {

        const franchise =
          getFranchise(row);

        if (!franchise) {
          return;
        }

        if (!map.has(franchise)) {
          map.set(
            franchise,
            {
              franchise,
              enquiries: 0,
              companyNames: new Set(),
              billing: 0,
              franchiseShare: 0,
              franchiseExpenditure: 0,
              netAmount: 0
            }
          );
        }

        const data =
          map.get(franchise);


        /* Financial Year */

        if (
          selectedFinancialYear &&
          getFinancialYear(row) !==
            selectedFinancialYear
        ) {
          return;
        }


        /* Info Status */

        if (
          selectedInfoStatus &&
          selectedInfoStatus !== "ALL" &&
          getInfoStatus(row) !==
            selectedInfoStatus
        ) {
          return;
        }


        /* Total Enquiries */

        data.enquiries += 1;


        /* Unique Company */

        const companyName =
          getCompanyName(row);

        const companyKey =
          normalizeCompanyKey(
            companyName
          );

        if (companyKey) {
          data.companyNames.add(
            companyKey
          );
        }


        /* Financial Values */

        const values =
          getFinancialValues(
            row,
            selectedInfoStatus,
            franchiseExpenditurePercentage
          );

        data.billing +=
          values.billing;

        data.franchiseShare +=
          values.franchiseeShare;

        data.franchiseExpenditure +=
          values.franchiseExpenditure;

        data.netAmount +=
          values.netAmount;

      });


      return Array.from(
        map.values()
      )
        .map(item => ({
          franchise:
            item.franchise,

          clients:
            item.companyNames.size,

          enquiries:
            item.enquiries,

          billing:
            item.billing,

          franchiseShare:
            item.franchiseShare,

          franchiseExpenditure:
            item.franchiseExpenditure,

          netAmount:
            item.netAmount
        }))
        .filter(
          item =>
            item.enquiries > 0
        )
        .sort(
          (a, b) =>
            b.clients - a.clients
        );

    }, [
      rows,
      selectedFinancialYear,
      selectedInfoStatus,
      franchiseExpenditurePercentage
    ]);


  /* =======================================================
     SELECTED FRANCHISE ROWS
  ======================================================= */

  const selectedRows =
    useMemo(() => {

      if (!selectedFranchise) {
        return [];
      }

      return rows.filter(row => {

        if (
          getFranchise(row) !==
          selectedFranchise
        ) {
          return false;
        }

        if (
          reportFinancialYear &&
          getFinancialYear(row) !==
            reportFinancialYear
        ) {
          return false;
        }

        if (
          reportInfoStatus &&
          reportInfoStatus !== "ALL" &&
          getInfoStatus(row) !==
            reportInfoStatus
        ) {
          return false;
        }

        return true;

      });

    }, [
      rows,
      selectedFranchise,
      reportFinancialYear,
      reportInfoStatus
    ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;

      let totalFranchiseShare = 0;

      let totalFranchiseExpenditure = 0;

      let netAmount = 0;

      const companyNames =
        new Set();

      let totalEnquiries = 0;


      selectedRows.forEach(row => {

        totalEnquiries += 1;


        const companyName =
          getCompanyName(row);

        const companyKey =
          normalizeCompanyKey(
            companyName
          );

        if (companyKey) {
          companyNames.add(
            companyKey
          );
        }


        /*
         * IMPORTANT:
         * Modal uses reportFranchiseExpenditurePercentage,
         * NOT the main-page percentage.
         */
        const values =
          getFinancialValues(
            row,
            reportInfoStatus,
            reportFranchiseExpenditurePercentage
          );


        totalBilling +=
          values.billing;

        totalFranchiseShare +=
          values.franchiseeShare;

        totalFranchiseExpenditure +=
          values.franchiseExpenditure;

        netAmount +=
          values.netAmount;

      });


      return {
        totalBilling,
        totalFranchiseShare,
        totalFranchiseExpenditure,
        netAmount,
        totalEnquiries,
        totalClients:
          companyNames.size
      };

    }, [
      selectedRows,
      reportInfoStatus,
      reportFranchiseExpenditurePercentage
    ]);


  /* =======================================================
     BEST INDUSTRY
  ======================================================= */

  const bestIndustry =
    useMemo(() => {

      const industryCompanies =
        new Map();

      selectedRows.forEach(row => {

        const industry =
          getIndustry(row);

        const company =
          normalizeCompanyKey(
            getCompanyName(row)
          );

        if (
          !industry ||
          !company
        ) {
          return;
        }

        if (
          !industryCompanies.has(
            industry
          )
        ) {
          industryCompanies.set(
            industry,
            new Set()
          );
        }

        industryCompanies
          .get(industry)
          .add(company);

      });


      let best = "";
      let highest = 0;


      industryCompanies.forEach(
        (companies, industry) => {

          if (
            companies.size >
            highest
          ) {
            highest =
              companies.size;

            best =
              industry;
          }

        }
      );


      return best || "—";

    }, [selectedRows]);


  /* =======================================================
     BEST CITY
  ======================================================= */

  const bestCity =
    useMemo(() => {

      const cityCompanies =
        new Map();

      selectedRows.forEach(row => {

        const city =
          getCity(row);

        const company =
          normalizeCompanyKey(
            getCompanyName(row)
          );

        if (
          !city ||
          !company
        ) {
          return;
        }

        if (
          !cityCompanies.has(city)
        ) {
          cityCompanies.set(
            city,
            new Set()
          );
        }

        cityCompanies
          .get(city)
          .add(company);

      });


      let best = "";
      let highest = 0;


      cityCompanies.forEach(
        (companies, city) => {

          if (
            companies.size >
            highest
          ) {
            highest =
              companies.size;

            best =
              city;
          }

        }
      );


      return best || "—";

    }, [selectedRows]);


  /* =======================================================
     YEARLY REPORT
  ======================================================= */

  const yearlyReportData =
    useMemo(() => {

      const map = new Map();

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
              companyNames:
                new Set(),
              billing: 0
            }
          );
        }

        const data =
          map.get(year);


        const company =
          normalizeCompanyKey(
            getCompanyName(row)
          );

        if (company) {
          data.companyNames.add(
            company
          );
        }


        /*
         * Modal report uses its own
         * expenditure percentage.
         */
        const values =
          getFinancialValues(
            row,
            reportInfoStatus,
            reportFranchiseExpenditurePercentage
          );


        data.billing +=
          values.billing;

      });


      return Array.from(
        map.values()
      )
        .map(item => ({
          year:
            item.year,

          clients:
            item.companyNames.size,

          billing:
            item.billing
        }))
        .sort((a, b) => {

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
      reportInfoStatus,
      reportFranchiseExpenditurePercentage
    ]);


  /* =======================================================
     MONTHLY REPORT
  ======================================================= */

  const monthlyReportData =
    useMemo(() => {

      if (!reportFinancialYear) {
        return [];
      }

      const monthMap =
        new Map();


      financialMonths.forEach(
        month => {

          monthMap.set(
            month.month,
            {
              month:
                month.full,

              monthShort:
                month.short,

              companyNames:
                new Set(),

              billing:
                0
            }
          );

        }
      );


      selectedRows.forEach(row => {

        const year =
          getFinancialYear(row);

        if (
          year !==
          reportFinancialYear
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


        const company =
          normalizeCompanyKey(
            getCompanyName(row)
          );

        if (company) {
          data.companyNames.add(
            company
          );
        }


        /*
         * Modal report uses its own
         * expenditure percentage.
         */
        const values =
          getFinancialValues(
            row,
            reportInfoStatus,
            reportFranchiseExpenditurePercentage
          );


        data.billing +=
          values.billing;

      });


      return financialMonths.map(
        month => {

          const data =
            monthMap.get(
              month.month
            );

          return {
            month:
              data.month,

            monthShort:
              data.monthShort,

            clients:
              data.companyNames.size,

            billing:
              data.billing
          };

        }
      );

    }, [
      selectedRows,
      reportFinancialYear,
      reportInfoStatus,
      reportFranchiseExpenditurePercentage
    ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData =
    reportFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* =======================================================
     OPEN PERFORMANCE MODAL
  ======================================================= */

  function handleViewPerformance(
    franchise
  ) {

    setSelectedFranchise(
      franchise
    );

    /*
     * Copy current main filters only when
     * opening the modal.
     *
     * After opening, modal filters are independent.
     */
    setReportFinancialYear(
      selectedFinancialYear
    );

    setReportInfoStatus(
      selectedInfoStatus
    );

    /*
     * Initial modal expenditure %
     * is copied from the main filter.
     *
     * After this, both states are independent.
     */
    setReportFranchiseExpenditurePercentage(
      franchiseExpenditurePercentage
    );

  }


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function handleCloseModal() {
    setSelectedFranchise("");
  }


  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {

    if (!selectedFranchise) {
      return undefined;
    }


    const handleKeyDown =
      event => {

        if (
          event.key === "Escape"
        ) {
          handleCloseModal();
        }

      };


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [selectedFranchise]);


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
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            Franchise Performance
          </h1>

          <p>
            Monitor franchise acquisition,
            billing and financial performance.
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
              Complete franchise-wise
              performance overview
            </p>

          </div>


          <div className="franchise-member-count">

            {franchiseData.length}

            <span>
              Franchises
            </span>

          </div>

        </div>


        {/* =================================================
            MAIN FILTERS
        ================================================= */}

        <div
          className="franchise-report-controls"
          style={{
            marginBottom: "20px"
          }}
        >

          {/* FINANCIAL YEAR */}

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


          {/* INFO STATUS */}

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


          {/* MAIN FRANCHISE EXPENDITURE % */}

          <div>

            <label
              htmlFor="franchise-expenditure-percentage"
            >
              Franchise Expenditure %
            </label>

            <input
              id="franchise-expenditure-percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                franchiseExpenditurePercentage
              }
              placeholder="Enter %"
              onChange={event => {

                const value =
                  event.target.value;

                if (
                  value === "" ||
                  (
                    Number(value) >= 0 &&
                    Number(value) <= 100
                  )
                ) {
                  setFranchiseExpenditurePercentage(
                    value
                  );
                }

              }}
            />

          </div>

        </div>


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
                  Total Enquiries
                </th>

                <th>
                  Total Billing
                </th>

                <th>
                  Net Amount
                </th>

                {hasFranchiseExpenditurePercentage && (

                  <th>
                    Franchise Expenditure
                  </th>

                )}

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {franchiseData.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      hasFranchiseExpenditurePercentage
                        ? 7
                        : 6
                    }
                    className="franchise-empty"
                  >
                    No franchise data available.
                  </td>

                </tr>

              ) : (

                franchiseData.map(
                  franchise => (

                    <tr
                      key={
                        franchise.franchise
                      }
                    >

                      <td>

                        <div className="franchise-name">

                          <div className="franchise-avatar">

                            {
                              franchise.franchise
                                .charAt(0)
                                .toUpperCase()
                            }

                          </div>

                          <span>
                            {
                              franchise.franchise
                            }
                          </span>

                        </div>

                      </td>


                      {/* UNIQUE CLIENTS */}

                      <td>

                        <span className="franchise-client-count">

                          {
                            franchise.clients
                          }

                        </span>

                      </td>


                      {/* TOTAL ENQUIRIES */}

                      <td>

                        <span className="franchise-client-count">

                          {
                            franchise.enquiries
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


                      {/* NET */}

                      <td>

                        <span className="franchise-net-value">

                          {
                            formatCurrency(
                              franchise.netAmount
                            )
                          }

                        </span>

                      </td>


                      {/* EXPENDITURE */}

                      {hasFranchiseExpenditurePercentage && (

                        <td>

                          <span className="franchise-expenditure-value">

                            {
                              formatCurrency(
                                franchise.franchiseExpenditure
                              )
                            }

                          </span>

                        </td>

                      )}


                      {/* PERFORMANCE */}

                      <td>

                        <button
                          type="button"
                          className="franchise-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              franchise.franchise
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

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ===================================================
          PERFORMANCE MODAL
      =================================================== */}

      {selectedFranchise && (

        <div
          className="franchise-performance-overlay"
          onClick={handleCloseModal}
        >

          <div
            className="franchise-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >

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
                  Franchise performance
                  analysis and financial trends
                </p>

              </div>


              <button
                type="button"
                className="franchise-modal-close"
                onClick={handleCloseModal}
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

                <span className="franchise-summary-label">
                  Best Industry
                </span>

                <strong className="franchise-summary-text">
                  {bestIndustry}
                </strong>

              </div>


              {/* BEST CITY */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Best City
                </span>

                <strong className="franchise-summary-text">
                  {bestCity}
                </strong>

              </div>


              {/* TOTAL BILLING */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Total Billing
                </span>

                <strong className="franchise-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalBilling
                    )
                  }

                </strong>

              </div>


              {/* TOTAL ACQUIRED CLIENT */}

              <div className="franchise-summary-card">

                <span className="franchise-summary-label">
                  Total Acquired Client
                </span>

                <strong className="franchise-summary-value">

                  {
                    performanceSummary.totalClients
                  }

                </strong>

                <small>
                  Unique Company Name
                </small>

              </div>


              {/* TOTAL ENQUIRIES */}

              <div className="franchise-summary-card franchise-summary-share">

                <span className="franchise-summary-label">
                  Total Enquiries
                </span>

                <strong className="franchise-summary-value">

                  {
                    performanceSummary.totalEnquiries
                  }

                </strong>

                <small>
                  Matching enquiry rows
                </small>

              </div>


              {/* FRANCHISE SHARE */}

              <div className="franchise-summary-card franchise-summary-share">

                <span className="franchise-summary-label">
                  Franchise Share Claimed
                </span>

                <strong className="franchise-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalFranchiseShare
                    )
                  }

                </strong>

              </div>


              {/* =================================================
                  FRANCHISE EXPENDITURE CARD REMOVED
              ================================================= */}


              {/* NET AMOUNT */}

              <div className="franchise-summary-card franchise-summary-net">

                <span className="franchise-summary-label">
                  Net Amount
                </span>

                <strong className="franchise-summary-value">

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

            <div className="franchise-report-controls">

              {/* FINANCIAL YEAR */}

              <div>

                <label
                  htmlFor="franchise-financial-year"
                >
                  Financial Year
                </label>

                <select
                  id="franchise-financial-year"
                  value={
                    reportFinancialYear
                  }
                  onChange={event =>
                    setReportFinancialYear(
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


              {/* INFO STATUS */}

              <div>

                <label>
                  Info Status
                </label>

                <select
                  value={
                    reportInfoStatus
                  }
                  onChange={event =>
                    setReportInfoStatus(
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


              {/* MODAL FRANCHISE EXPENDITURE % */}

              <div>

                <label
                  htmlFor="report-franchise-expenditure-percentage"
                >
                  Franchise Expenditure %
                </label>

                <input
                  id="report-franchise-expenditure-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    reportFranchiseExpenditurePercentage
                  }
                  placeholder="Enter %"
                  onChange={event => {

                    const value =
                      event.target.value;

                    if (
                      value === "" ||
                      (
                        Number(value) >= 0 &&
                        Number(value) <= 100
                      )
                    ) {
                      setReportFranchiseExpenditurePercentage(
                        value
                      );
                    }

                  }}
                />

              </div>


              {/* REPORT PERIOD */}

              <div className="franchise-report-period">

                <span>
                  Report Period
                </span>

                <strong>

                  {
                    reportFinancialYear
                      ? reportFinancialYear
                      : "Yearly"
                  }

                </strong>

              </div>

            </div>


            {/* =============================================
                GRAPHS
            ============================================= */}

            <div className="franchise-report-graphs">

              {/* CLIENT ACQUIRED */}

              <div className="franchise-chart-card">

                <div className="franchise-chart-heading">

                  <div>

                    <span className="franchise-chart-indicator franchise-client-indicator"></span>

                    <h3>
                      Client Acquired
                    </h3>

                  </div>

                  <span>
                    {
                      reportFinancialYear
                        ? "Monthly"
                        : "Yearly"
                    }
                  </span>

                </div>


                <div className="franchise-chart-container">

                  {reportData.length === 0 ? (

                    <div className="franchise-no-chart-data">
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
                            reportFinancialYear
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
                            <FranchiseTooltip />
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
                          maxBarSize={42}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  )}

                </div>

              </div>


              {/* TOTAL BILLING */}

              <div className="franchise-chart-card">

                <div className="franchise-chart-heading">

                  <div>

                    <span className="franchise-chart-indicator franchise-billing-indicator"></span>

                    <h3>
                      Total Billing
                    </h3>

                  </div>

                  <span>
                    {
                      reportFinancialYear
                        ? "Monthly"
                        : "Yearly"
                    }
                  </span>

                </div>


                <div className="franchise-chart-container">

                  {reportData.length === 0 ? (

                    <div className="franchise-no-chart-data">
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
                            reportFinancialYear
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
                            <FranchiseTooltip />
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
                          maxBarSize={42}
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

            <div className="franchise-modal-footer">

              <span>

                {
                  reportFinancialYear
                    ? `Monthly report for ${reportFinancialYear}`
                    : "Yearly performance report"
                }

              </span>


              <button
                type="button"
                className="franchise-footer-close"
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


export default FranchisePerformance;