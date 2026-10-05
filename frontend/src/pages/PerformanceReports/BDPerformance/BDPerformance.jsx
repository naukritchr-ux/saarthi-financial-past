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

import "./BDPerformance.css";


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
   NORMALIZE UNIQUE VALUE
========================================================= */

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


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
   GET BD MEMBER
========================================================= */

function getBDMember(row) {

  return String(
    row?.bd_member ??
    row?.["BD Member"] ??
    row?.bdMember ??
    ""
  ).trim();

}


/* =========================================================
   GET COMPANY NAME

   UNIQUE ACQUIRED CLIENT IS BASED ON
   COMPANY NAME
========================================================= */

function getCompanyName(row) {

  return String(
    row?.company_name ??
    row?.["Company Name"] ??
    row?.CompanyName ??
    row?.companyName ??
    row?.company ??
    row?.Company ??
    row?.client_name ??
    row?.["Client Name"] ??
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
   GET FRANCHISE NAME
========================================================= */

function getFranchiseName(row) {

  return String(
    row?.franchise_name ??
    row?.["Franchise Name"] ??
    row?.franchise ??
    row?.["Franchise"] ??
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
    row?.Billing ??
    row?.total_billing ??
    row?.["Total Billing"] ??
    row?.billing_amount ??
    row?.["Billing Amount"] ??
    row?.TANN ??
    row?.tann ??
    0
  );

}


/* =========================================================
   GET FRANCHISEE SHARE
========================================================= */

function getFranchiseeShare(row) {

  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"] ??
    row?.franchise_cost ??
    row?.["Franchise Cost"] ??
    row?.["Franchisee Cost"] ??
    row?.franchisee_cost_amount ??
    0
  );

}


/* =========================================================
   GET BD EXPENDITURE
========================================================= */

function getBDExpenditure(
  row,
  percentage
) {

  const billing =
    getBilling(row);

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

  return billing * (
    rate / 100
  );

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
    ""
  );

}


/* =========================================================
   SAFE DATE PARSER

   Handles YYYY-MM-DD without timezone shifting.
========================================================= */

function parseDate(value) {

  if (!value) {
    return null;
  }

  if (value instanceof Date) {

    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;

  }

  const stringValue =
    String(value).trim();

  if (!stringValue) {
    return null;
  }


  /* YYYY-MM-DD */

  const isoMatch =
    stringValue.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (isoMatch) {

    const year =
      Number(isoMatch[1]);

    const month =
      Number(isoMatch[2]);

    const day =
      Number(isoMatch[3]);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;

  }


  const date =
    new Date(stringValue);

  return Number.isNaN(
    date.getTime()
  )
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

  const date =
    parseDate(dateValue);


  if (!date) {
    return "";
  }


  return date.getMonth() + 1;

}


/* =========================================================
   BD FINANCIAL CALCULATION

   ALL:
   Billing = Billing
   Net Amount = Billing - Franchisee Share
   BD Expenditure = Billing × entered %

   R:
   Billing = R Billing
   Net Amount = R Billing - Franchisee Share
   BD Expenditure = R Billing × entered %

   RV:
   Billing = RV Billing
   Net Amount = 0
   Expenditure = 0

   C:
   Billing = C Billing
   Net Amount = 0
   Expenditure = 0

   CN:
   Billing = CN Billing
   Net Amount = 0
   Expenditure = 0
========================================================= */

function getFinancialValues(
  row,
  infoFilter = "",
  percentage
) {

  const info =
    getInfoStatus(row);

  const billing =
    getBilling(row);

  const franchiseeShare =
    getFranchiseeShare(row);


  /* =======================================================
     ALL
  ======================================================= */

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {

    return {

      billing:
        billing,

      netAmount:
        billing -
        franchiseeShare,

      bdExpenditure:
        getBDExpenditure(
          row,
          percentage
        )

    };

  }


  /* =======================================================
     R
  ======================================================= */

  if (
    infoFilter === "R"
  ) {

    if (
      info !== "R"
    ) {

      return {

        billing: 0,
        netAmount: 0,
        bdExpenditure: 0

      };

    }

    return {

      billing:
        billing,

      netAmount:
        billing -
        franchiseeShare,

      bdExpenditure:
        getBDExpenditure(
          row,
          percentage
        )

    };

  }


  /* =======================================================
     RV
  ======================================================= */

  if (
    infoFilter === "RV"
  ) {

    if (
      info !== "RV"
    ) {

      return {

        billing: 0,
        netAmount: 0,
        bdExpenditure: 0

      };

    }

    return {

      billing:
        billing,

      netAmount: 0,

      bdExpenditure: 0

    };

  }


  /* =======================================================
     C
  ======================================================= */

  if (
    infoFilter === "C"
  ) {

    if (
      info !== "C"
    ) {

      return {

        billing: 0,
        netAmount: 0,
        bdExpenditure: 0

      };

    }

    return {

      billing:
        billing,

      netAmount: 0,

      bdExpenditure: 0

    };

  }


  /* =======================================================
     CN
  ======================================================= */

  if (
    infoFilter === "CN"
  ) {

    if (
      info !== "CN"
    ) {

      return {

        billing: 0,
        netAmount: 0,
        bdExpenditure: 0

      };

    }

    return {

      billing:
        billing,

      netAmount: 0,

      bdExpenditure: 0

    };

  }


  return {

    billing: 0,
    netAmount: 0,
    bdExpenditure: 0

  };

}


/* =========================================================
   CUSTOM TOOLTIP
========================================================= */

function BDTooltip({
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

    <div className="bd-modern-tooltip">

      <div className="bd-tooltip-label">
        {label}
      </div>


      {payload.map(
        (item, index) => (

          <div
            className="bd-tooltip-row"
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

function BDPerformance() {

  const {
    rows = []
  } = useData();


  /* =======================================================
     MAIN TABLE STATE
  ======================================================= */

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");


  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [
    selectedMember,
    setSelectedMember
  ] = useState("");


  const [
    reportFinancialYear,
    setReportFinancialYear
  ] = useState("");


  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("");


  /* =======================================================
     BD EXPENDITURE
  ======================================================= */

  const [
    bdExpenditurePercentage,
    setBdExpenditurePercentage
  ] = useState("");


  const hasBDExpenditurePercentage =
    bdExpenditurePercentage !== "" &&
    bdExpenditurePercentage !== null &&
    bdExpenditurePercentage !== undefined &&
    Number.isFinite(
      Number(
        bdExpenditurePercentage
      )
    ) &&
    Number(
      bdExpenditurePercentage
    ) >= 0;


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
     BD MEMBER SUMMARY TABLE

     Total Acquired Client:
     UNIQUE Company Name

     Total Enquiries:
     EVERY FILTERED ROW

     BOTH respect:
     Financial Year + Info Status
  ======================================================= */

  const memberData =
    useMemo(() => {

      const map =
        new Map();


      rows.forEach(row => {

        const member =
          getBDMember(row);


        if (!member) {
          return;
        }


        /* ================================================
           FINANCIAL YEAR FILTER
        ================================================= */

        if (
          selectedFinancialYear &&
          getFinancialYear(row) !==
            selectedFinancialYear
        ) {

          return;

        }


        /* ================================================
           INFO STATUS FILTER

           This filter affects ALL table metrics.
        ================================================= */

        const info =
          getInfoStatus(row);


        if (
          selectedInfoStatus &&
          selectedInfoStatus !== "ALL" &&
          info !== selectedInfoStatus
        ) {

          return;

        }


        /* ================================================
           FINANCIAL VALUES
        ================================================= */

        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus,
            bdExpenditurePercentage
          );


        /* ================================================
           CREATE MEMBER RECORD
        ================================================= */

        if (!map.has(member)) {

          map.set(
            member,
            {

              member,

              /*
               * Unique Company Names
               */
              clients:
                new Set(),

              /*
               * Every filtered row =
               * one enquiry.
               */
              enquiries: 0,

              /*
               * Unique Franchise Names
               */
              franchisees:
                new Set(),

              billing: 0,

              netAmount: 0,

              bdExpenditure: 0

            }
          );

        }


        const data =
          map.get(member);


        /* ================================================
           TOTAL ACQUIRED CLIENT

           UNIQUE COMPANY NAME
        ================================================= */

        const companyName =
          getCompanyName(row);

        const companyKey =
          normalizeKey(companyName);


        if (companyKey) {

          data.clients.add(
            companyKey
          );

        }


        /* ================================================
           TOTAL ENQUIRIES

           EVERY MATCHING ROW
        ================================================= */

        data.enquiries += 1;


        /* ================================================
           FRANCHISEE

           UNIQUE FRANCHISE NAME
        ================================================= */

        const franchiseName =
          getFranchiseName(row);

        const franchiseKey =
          normalizeKey(franchiseName);


        if (franchiseKey) {

          data.franchisees.add(
            franchiseKey
          );

        }


        /* ================================================
           FINANCIAL TOTALS
        ================================================= */

        data.billing +=
          financialValues.billing;


        data.netAmount +=
          financialValues.netAmount;


        data.bdExpenditure +=
          financialValues.bdExpenditure;

      });


      return Array.from(
        map.values()
      )

        .filter(
          item =>
            item.enquiries > 0
        )

        .map(item => ({

          ...item,

          clients:
            item.clients.size,

          franchisees:
            item.franchisees.size

        }))

        .sort(
          (a, b) => {

            if (
              b.clients !==
              a.clients
            ) {

              return (
                b.clients -
                a.clients
              );

            }

            return a.member.localeCompare(
              b.member
            );

          }
        );

    }, [
      rows,
      selectedFinancialYear,
      selectedInfoStatus,
      bdExpenditurePercentage
    ]);


  /* =======================================================
     SELECTED MEMBER ROWS FOR MODAL

     IMPORTANT:
     Modal has its own FY + Info Status filters.
  ======================================================= */

  const selectedRows =
    useMemo(() => {

      if (!selectedMember) {
        return [];
      }


      return rows.filter(
        row => {

          if (
            getBDMember(row) !==
            selectedMember
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

        }
      );

    }, [
      rows,
      selectedMember,
      reportFinancialYear,
      reportInfoStatus
    ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;

      let totalFranchiseeShare = 0;

      let totalBDExpenditure = 0;

      let netAmount = 0;


      selectedRows.forEach(row => {

        const values =
          getFinancialValues(
            row,
            reportInfoStatus,
            bdExpenditurePercentage
          );


        totalBilling +=
          values.billing;


        /*
         * Franchisee Share is applicable
         * only for ALL / R.
         */
        if (
          !reportInfoStatus ||
          reportInfoStatus === "R"
        ) {

          totalFranchiseeShare +=
            getFranchiseeShare(row);

        }


        totalBDExpenditure +=
          values.bdExpenditure;


        netAmount +=
          values.netAmount;

      });


      return {

        totalBilling,

        totalFranchiseeShare,

        totalBDExpenditure,

        netAmount

      };

    }, [
      selectedRows,
      reportInfoStatus,
      bdExpenditurePercentage
    ]);


  /* =======================================================
     BEST INDUSTRY

     UNIQUE COMPANY COUNT
  ======================================================= */

  const bestIndustry =
    useMemo(() => {

      const industryCompanies =
        new Map();


      selectedRows.forEach(row => {

        const industry =
          getIndustry(row);

        const company =
          normalizeKey(
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

    }, [
      selectedRows
    ]);


  /* =======================================================
     BEST CITY

     UNIQUE COMPANY COUNT
  ======================================================= */

  const bestCity =
    useMemo(() => {

      const cityCompanies =
        new Map();


      selectedRows.forEach(row => {

        const city =
          getCity(row);

        const company =
          normalizeKey(
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

    }, [
      selectedRows
    ]);


  /* =======================================================
     YEARLY REPORT

     CLIENT ACQUIRED =
     UNIQUE COMPANY NAME PER FINANCIAL YEAR
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

              clients:
                new Set(),

              billing: 0

            }
          );

        }


        const data =
          map.get(year);


        const company =
          normalizeKey(
            getCompanyName(row)
          );


        if (company) {

          data.clients.add(
            company
          );

        }


        const values =
          getFinancialValues(
            row,
            reportInfoStatus,
            bdExpenditurePercentage
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
            item.clients.size,

          billing:
            item.billing

        }))

        .sort(
          (a, b) => {

            const yearA =
              Number(
                String(a.year)
                  .slice(0, 4)
              );

            const yearB =
              Number(
                String(b.year)
                  .slice(0, 4)
              );

            return yearA - yearB;

          }
        );

    }, [
      selectedRows,
      reportInfoStatus,
      bdExpenditurePercentage
    ]);


  /* =======================================================
     MONTHLY REPORT

     CLIENT ACQUIRED =
     UNIQUE COMPANY NAME PER MONTH
  ======================================================= */

  const monthlyReportData =
    useMemo(() => {

      if (!reportFinancialYear) {
        return [];
      }


      const monthMap =
        new Map();


      /*
       * Calendar month number:
       * 4 = April
       * ...
       * 12 = December
       * 1 = January
       * ...
       * 3 = March
       */

      financialMonths.forEach(
        (month) => {

          const calendarMonth =
            financialMonths.indexOf(
              month
            ) < 9
              ? financialMonths.indexOf(
                  month
                ) + 4
              : financialMonths.indexOf(
                  month
                ) - 8;


          monthMap.set(
            calendarMonth,
            {

              month:
                month.full,

              monthShort:
                month.short,

              clients:
                new Set(),

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
          normalizeKey(
            getCompanyName(row)
          );


        if (company) {

          data.clients.add(
            company
          );

        }


        const values =
          getFinancialValues(
            row,
            reportInfoStatus,
            bdExpenditurePercentage
          );


        data.billing +=
          values.billing;

      });


      /*
       * April → March
       */

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
        month => {

          const data =
            monthMap.get(month);


          return {

            month:
              data.month,

            monthShort:
              data.monthShort,

            clients:
              data.clients.size,

            billing:
              data.billing

          };

        }
      );

    }, [
      selectedRows,
      reportFinancialYear,
      reportInfoStatus,
      bdExpenditurePercentage
    ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData =
    reportFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /* =======================================================
     OPEN PERFORMANCE

     Main filters are copied into modal filters.
     Main table filters themselves are NOT reset.
  ======================================================= */

  function handleViewPerformance(
    member
  ) {

    setSelectedMember(
      member
    );


    setReportFinancialYear(
      selectedFinancialYear
    );


    setReportInfoStatus(
      selectedInfoStatus
    );

  }


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function handleCloseModal() {

    setSelectedMember("");

    setReportFinancialYear("");

    setReportInfoStatus("");

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="bd-performance-page">


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="bd-page-header">

        <div>

          <div className="bd-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            BD Member Performance
          </h1>

          <p>
            Monitor BD member acquisition,
            billing and financial performance.
          </p>

        </div>

      </div>


      {/* ===================================================
          MAIN TABLE CARD
      =================================================== */}

      <div className="bd-table-card">


        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <div className="bd-table-header">

          <div>

            <h2>
              BD Member Performance
            </h2>

            <p>
              Complete BD member-wise
              performance overview
            </p>

          </div>


          <div className="bd-member-count">

            {memberData.length}

            <span>
              BD Members
            </span>

          </div>

        </div>


        {/* =================================================
            MAIN FILTERS
        ================================================= */}

        <div
          className="bd-performance-filters"
        >

          <div className="bd-filter-group">

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


          <div className="bd-filter-group">

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


          {/* BD EXPENDITURE % */}

          <div className="bd-filter-group">

            <label
              htmlFor="bd-expenditure-percentage"
            >
              BD Expenditure %
            </label>

            <input
              id="bd-expenditure-percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                bdExpenditurePercentage
              }
              placeholder="Enter %"
              onChange={event => {

                const value =
                  event.target.value;


                if (
                  value === ""
                ) {

                  setBdExpenditurePercentage(
                    ""
                  );

                  return;

                }


                const number =
                  Number(value);


                if (
                  Number.isFinite(number) &&
                  number >= 0 &&
                  number <= 100
                ) {

                  setBdExpenditurePercentage(
                    value
                  );

                }

              }}
            />

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="bd-table-wrapper">

          <table className="bd-performance-table">

            <thead>

              <tr>

                <th>
                  BD Member
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

                {hasBDExpenditurePercentage && (

                  <th>
                    BD Expenditure
                  </th>

                )}

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {memberData.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      hasBDExpenditurePercentage
                        ? 8
                        : 7
                    }
                    className="bd-empty"
                  >
                    No BD member data available.
                  </td>

                </tr>

              ) : (

                memberData.map(
                  member => (

                    <tr
                      key={
                        member.member
                      }
                    >


                      {/* BD MEMBER */}

                      <td>

                        <div className="bd-name">

                          <div className="bd-avatar">

                            {
                              member.member
                                .charAt(0)
                                .toUpperCase()
                            }

                          </div>

                          <span>
                            {member.member}
                          </span>

                        </div>

                      </td>


                      {/* UNIQUE ACQUIRED CLIENT */}

                      <td>

                        <span className="bd-client-count">

                          {
                            member.clients
                          }

                        </span>

                      </td>


                      {/* TOTAL ENQUIRIES */}

                      <td>

                        <span className="bd-client-count">

                          {
                            member.enquiries
                          }

                        </span>

                      </td>


                      {/* FRANCHISEE */}

                      <td>

                        <span className="bd-client-count">

                          {
                            member.franchisees
                          }

                        </span>

                      </td>


                      {/* BILLING */}

                      <td>

                        <span className="bd-billing-value">

                          {
                            formatCurrency(
                              member.billing
                            )
                          }

                        </span>

                      </td>


                      {/* NET AMOUNT */}

                      <td>

                        <span className="bd-net-value">

                          {
                            formatCurrency(
                              member.netAmount
                            )
                          }

                        </span>

                      </td>


                      {/* BD EXPENDITURE */}

                      {hasBDExpenditurePercentage && (

                        <td>

                          <span className="bd-expenditure-value">

                            {
                              formatCurrency(
                                member.bdExpenditure
                              )
                            }

                          </span>

                        </td>

                      )}


                      {/* PERFORMANCE */}

                      <td>

                        <button
                          type="button"
                          className="bd-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              member.member
                            )
                          }
                        >

                          View

                          <span className="bd-view-arrow">
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

      {selectedMember && (

        <div
          className="bd-performance-overlay"
          onClick={
            handleCloseModal
          }
        >

          <div
            className="bd-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <div className="bd-modal-header">

              <div>

                <div className="bd-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>
                  {selectedMember}
                </h2>

                <p>
                  BD member performance
                  analysis and financial trends
                </p>

              </div>


              <button
                type="button"
                className="bd-modal-close"
                onClick={
                  handleCloseModal
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =============================================
                SUMMARY CARDS
            ============================================= */}

            <div className="bd-summary-grid">


              {/* BEST INDUSTRY */}

              <div className="bd-summary-card">

                <span className="bd-summary-label">
                  Best Industry
                </span>

                <strong className="bd-summary-text">
                  {bestIndustry}
                </strong>

              </div>


              {/* BEST CITY */}

              <div className="bd-summary-card">

                <span className="bd-summary-label">
                  Best City
                </span>

                <strong className="bd-summary-text">
                  {bestCity}
                </strong>

              </div>


              {/* TOTAL BILLING */}

              <div className="bd-summary-card">

                <span className="bd-summary-label">
                  Total Billing
                </span>

                <strong className="bd-summary-value">

                  {
                    formatCurrency(
                      performanceSummary.totalBilling
                    )
                  }

                </strong>

              </div>


              {/* BD EXPENDITURE */}

              {hasBDExpenditurePercentage && (

                <div className="bd-summary-card">

                  <span className="bd-summary-label">
                    BD Expenditure
                  </span>

                  <strong className="bd-summary-value">

                    {
                      formatCurrency(
                        performanceSummary.totalBDExpenditure
                      )
                    }

                  </strong>

                  <small>
                    {bdExpenditurePercentage}% of Total Billing
                  </small>

                </div>

              )}


              {/* NET AMOUNT */}

              <div className="bd-summary-card bd-summary-net">

                <span className="bd-summary-label">
                  Net Amount
                </span>

                <strong className="bd-summary-value">

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

            <div className="bd-report-controls">


              <div>

                <label
                  htmlFor="bd-financial-year"
                >
                  Financial Year
                </label>

                <select
                  id="bd-financial-year"
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


              <div className="bd-report-period">

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

            <div className="bd-report-graphs">


              {/* CLIENT ACQUIRED */}

              <div className="bd-chart-card">

                <div className="bd-chart-heading">

                  <div>

                    <span className="bd-chart-indicator bd-client-indicator"></span>

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


                <div className="bd-chart-container">

                  {reportData.length === 0 ? (

                    <div className="bd-no-chart-data">
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
                            <BDTooltip />
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

              <div className="bd-chart-card">

                <div className="bd-chart-heading">

                  <div>

                    <span className="bd-chart-indicator bd-billing-indicator"></span>

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


                <div className="bd-chart-container">

                  {reportData.length === 0 ? (

                    <div className="bd-no-chart-data">
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
                          tickFormatter={value => {

                            const number =
                              Number(value) || 0;


                            if (
                              Math.abs(number) >=
                              10000000
                            ) {

                              return `₹${(
                                number /
                                10000000
                              ).toFixed(1)}Cr`;

                            }


                            if (
                              Math.abs(number) >=
                              100000
                            ) {

                              return `₹${(
                                number /
                                100000
                              ).toFixed(0)}L`;

                            }


                            if (
                              Math.abs(number) >=
                              1000
                            ) {

                              return `₹${(
                                number /
                                1000
                              ).toFixed(0)}K`;

                            }


                            return `₹${number}`;

                          }}
                        />

                        <Tooltip
                          content={
                            <BDTooltip />
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

            <div className="bd-modal-footer">

              <span>

                {
                  reportFinancialYear
                    ? `Monthly report for ${reportFinancialYear}`
                    : "Yearly performance report"
                }

              </span>


              <button
                type="button"
                className="bd-footer-close"
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


export default BDPerformance;