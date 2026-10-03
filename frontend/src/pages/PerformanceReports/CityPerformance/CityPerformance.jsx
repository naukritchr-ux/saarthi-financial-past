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

/* =========================================================
   FINANCIAL YEAR MONTHS
========================================================= */

const financialMonths = [
  { full: "April", short: "Apr", number: 4 },
  { full: "May", short: "May", number: 5 },
  { full: "June", short: "Jun", number: 6 },
  { full: "July", short: "Jul", number: 7 },
  { full: "August", short: "Aug", number: 8 },
  { full: "September", short: "Sep", number: 9 },
  { full: "October", short: "Oct", number: 10 },
  { full: "November", short: "Nov", number: 11 },
  { full: "December", short: "Dec", number: 12 },
  { full: "January", short: "Jan", number: 1 },
  { full: "February", short: "Feb", number: 2 },
  { full: "March", short: "Mar", number: 3 }
];

/* =========================================================
   NUMBER HELPERS
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

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£%]/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(toNumber(value));
}

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(value) {
  return String(
    value === null || value === undefined ? "" : value
  ).trim();
}

/* =========================================================
   FIELD GETTERS
========================================================= */

function getCity(row) {
  return normalizeText(
    row?.city ??
      row?.["City"] ??
      ""
  );
}

/*
  IMPORTANT:
  Acquired Client = UNIQUE Company Name

  Supported:
  - company_name
  - Company Name

  TANN is intentionally NOT used as fallback.
*/

function getCompanyName(row) {
  const value =
    row?.company_name ??
    row?.["Company Name"] ??
    "";

  return normalizeText(value).toLowerCase();
}

function getIndustry(row) {
  return normalizeText(
    row?.industry ??
      row?.["Industry"] ??
      ""
  );
}

function getFranchiseName(row) {
  return normalizeText(
    row?.franchise_name ??
      row?.["Franchise Name"] ??
      row?.franchise ??
      row?.["Franchise"] ??
      ""
  );
}

function getInfoStatus(row) {
  return normalizeText(
    row?.info ??
      row?.["Info"] ??
      ""
  ).toUpperCase();
}

function getBilling(row) {
  return toNumber(
    row?.total_bill_amount ??
      row?.["Total Bill Amount"] ??
      row?.["Billing"] ??
      row?.["Total Billing"] ??
      row?.["Billing Amount"] ??
      row?.["TANN/TDS"] ??
      0
  );
}

function getFranchiseeShare(row) {
  return toNumber(
    row?.franchisee_share ??
      row?.["Franchisee Share"] ??
      row?.["Franchise Cost"] ??
      row?.["Franchisee Cost"] ??
      row?.["Franchise Cost Amount"] ??
      0
  );
}

function getTLExpenditure(row, percentage) {
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
    rate < 0
  ) {
    return 0;
  }

  return billing * (rate / 100);
}

function getClientAcquiredDate(row) {
  return normalizeText(
    row?.date_client_acquired ??
      row?.["Date Client Acquired"] ??
      ""
  );
}

/* =========================================================
   SAFE DATE PARSER
========================================================= */

function parseDateOnly(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  /*
    YYYY-MM-DD

    Parse manually so browser timezone does not
    shift the date to the previous day/month.
  */

  const isoMatch = stringValue.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

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

    return null;
  }

  /*
    DD/MM/YYYY
  */

  const indianMatch = stringValue.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (indianMatch) {
    const day = Number(indianMatch[1]);
    const month = Number(indianMatch[2]);
    const year = Number(indianMatch[3]);

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

    return null;
  }

  /*
    Fallback
  */

  const parsed = new Date(stringValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/* =========================================================
   FINANCIAL YEAR
========================================================= */

function getFinancialYear(row) {
  const dateValue = getClientAcquiredDate(row);

  if (dateValue) {
    const date = parseDateOnly(dateValue);

    if (date) {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`;
      }

      return `${year - 1}-${String(year).slice(-2)}`;
    }
  }

  /*
    Supabase actual field:
      aquired_year

    Backend:
      acquired_year

    DataContext may expose:
      Aquired Year / Acquired Year
  */

  const acquiredYear =
    row?.acquired_year ??
    row?.aquired_year ??
    row?.["Aquired Year"] ??
    row?.["Acquired Year"];

  if (
    acquiredYear !== undefined &&
    acquiredYear !== null &&
    acquiredYear !== ""
  ) {
    const year = Number(
      String(acquiredYear)
        .replace(/^FY\s*/i, "")
        .split("-")[0]
        .trim()
    );

    if (
      Number.isFinite(year) &&
      year > 1900
    ) {
      return `${year}-${String(year + 1).slice(-2)}`;
    }
  }

  return "";
}

/* =========================================================
   MONTH
========================================================= */

function getMonth(row) {
  const dateValue = getClientAcquiredDate(row);

  if (!dateValue) {
    return null;
  }

  const date = parseDateOnly(dateValue);

  if (!date) {
    return null;
  }

  return date.getMonth() + 1;
}

/* =========================================================
   FINANCIAL VALUES
========================================================= */

function getFinancialValues(
  row,
  infoFilter = "",
  expenditurePercentage
) {
  const info = getInfoStatus(row);
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);

  /* =======================================================
     ALL
  ======================================================= */

  if (!infoFilter) {
    return {
      billing,
      netAmount: billing - franchiseeShare,
      tlExpenditure: getTLExpenditure(
        row,
        expenditurePercentage
      )
    };
  }

  /* =======================================================
     R
  ======================================================= */

  if (infoFilter === "R") {
    return {
      billing,
      netAmount: billing - franchiseeShare,
      tlExpenditure: getTLExpenditure(
        row,
        expenditurePercentage
      )
    };
  }

  /* =======================================================
     RV
  ======================================================= */

  if (infoFilter === "RV") {
    if (info !== "RV") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      tlExpenditure: 0
    };
  }

  /* =======================================================
     C
  ======================================================= */

  if (infoFilter === "C") {
    if (info !== "C") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      tlExpenditure: 0
    };
  }

  /* =======================================================
     CN
  ======================================================= */

  if (infoFilter === "CN") {
    if (info !== "CN") {
      return {
        billing: 0,
        netAmount: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      tlExpenditure: 0
    };
  }

  return {
    billing: 0,
    netAmount: 0,
    tlExpenditure: 0
  };
}

/* =========================================================
   TOOLTIP
========================================================= */

function CityTooltip({
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
    <div className="city-modern-tooltip">
      <div className="city-tooltip-label">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          className="city-tooltip-row"
          key={index}
        >
          <span>{item.name}</span>

          <strong>
            {item.name === "Total Billing"
              ? formatCurrency(item.value)
              : item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CityPerformance() {
  const { rows = [] } = useData();

  const [
    selectedCity,
    setSelectedCity
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");

  const [
    cityExpenditurePercentage,
    setCityExpenditurePercentage
  ] = useState("");

  /* =========================================================
     EXPENDITURE CHECK
  ========================================================= */

  const hasCityExpenditurePercentage =
    cityExpenditurePercentage !== "" &&
    Number.isFinite(
      Number(cityExpenditurePercentage)
    ) &&
    Number(cityExpenditurePercentage) >= 0;

  /* =========================================================
     FINANCIAL YEARS
  ========================================================= */

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach((row) => {
      const year = getFinancialYear(row);

      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort(
      (a, b) => {
        const yearA = Number(
          a.split("-")[0]
        );

        const yearB = Number(
          b.split("-")[0]
        );

        return yearA - yearB;
      }
    );
  }, [rows]);

  /* =========================================================
     CITY DATA

     Total Acquired Client = UNIQUE Company Name
     Total Enquiries       = TOTAL DATABASE ROWS
  ========================================================= */

  const cityData = useMemo(() => {
    const grouped = new Map();

    rows.forEach((row) => {
      const city = getCity(row);

      if (!city) {
        return;
      }

      /* FINANCIAL YEAR FILTER */

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return;
      }

      /* INFO STATUS FILTER */

      if (
        selectedInfoStatus &&
        getInfoStatus(row) !==
          selectedInfoStatus
      ) {
        return;
      }

      if (!grouped.has(city)) {
        grouped.set(city, {
          city,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          tlExpenditure: 0
        });
      }

      const item = grouped.get(city);

      /* =====================================================
         TOTAL ENQUIRIES

         Every row = one enquiry.
      ===================================================== */

      item.enquiries += 1;

      /* =====================================================
         TOTAL ACQUIRED CLIENT

         Unique Company Name only.
      ===================================================== */

      const companyName = getCompanyName(row);

      if (companyName) {
        item.clients.add(companyName);
      }

      /* =====================================================
         UNIQUE FRANCHISEE
      ===================================================== */

      const franchiseName =
        getFranchiseName(row);

      if (franchiseName) {
        item.franchisees.add(
          franchiseName
        );
      }

      /* =====================================================
         FINANCIAL VALUES
      ===================================================== */

      const financialValues =
        getFinancialValues(
          row,
          selectedInfoStatus,
          cityExpenditurePercentage
        );

      item.billing +=
        financialValues.billing;

      item.netAmount +=
        financialValues.netAmount;

      item.tlExpenditure +=
        financialValues.tlExpenditure;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        clients: item.clients.size,
        franchisees: item.franchisees.size
      }))
      .filter(
        (item) => item.enquiries > 0
      )
      .sort((a, b) => {
        if (b.clients !== a.clients) {
          return b.clients - a.clients;
        }

        return b.enquiries - a.enquiries;
      });
  }, [
    rows,
    selectedFinancialYear,
    selectedInfoStatus,
    cityExpenditurePercentage
  ]);

  /* =========================================================
     SELECTED CITY ROWS
  ========================================================= */

  const selectedRows = useMemo(() => {
    if (!selectedCity) {
      return [];
    }

    return rows.filter((row) => {
      if (getCity(row) !== selectedCity) {
        return false;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return false;
      }

      if (
        selectedInfoStatus &&
        getInfoStatus(row) !==
          selectedInfoStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    selectedCity,
    selectedFinancialYear,
    selectedInfoStatus
  ]);

  /* =========================================================
     PERFORMANCE SUMMARY
  ========================================================= */

  const performanceSummary = useMemo(() => {
    const companies = new Set();

    let enquiries = 0;
    let totalBilling = 0;
    let totalFranchiseeShare = 0;
    let totalTLExpenditure = 0;
    let netAmount = 0;

    selectedRows.forEach((row) => {
      enquiries += 1;

      const companyName =
        getCompanyName(row);

      if (companyName) {
        companies.add(companyName);
      }

      const financialValues =
        getFinancialValues(
          row,
          selectedInfoStatus,
          cityExpenditurePercentage
        );

      totalBilling +=
        financialValues.billing;

      netAmount +=
        financialValues.netAmount;

      totalTLExpenditure +=
        financialValues.tlExpenditure;

      if (
        !selectedInfoStatus ||
        selectedInfoStatus === "R"
      ) {
        totalFranchiseeShare +=
          getFranchiseeShare(row);
      }
    });

    const acquiredClients =
      companies.size;

    const grossProfit =
      netAmount -
      totalTLExpenditure;

    const grossMargin =
      netAmount !== 0
        ? (grossProfit / netAmount) * 100
        : 0;

    return {
      acquiredClients,
      enquiries,
      totalBilling,
      totalFranchiseeShare,
      totalTLExpenditure,
      netAmount,
      grossProfit,
      grossMargin
    };
  }, [
    selectedRows,
    selectedInfoStatus,
    cityExpenditurePercentage
  ]);

  /* =========================================================
     BEST INDUSTRY

     Unique company based.
  ========================================================= */

  const bestIndustry = useMemo(() => {
    const industryCompanies =
      new Map();

    selectedRows.forEach((row) => {
      const industry = getIndustry(row);
      const company = getCompanyName(row);

      if (!industry || !company) {
        return;
      }

      if (
        !industryCompanies.has(industry)
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

    let best = "—";
    let highest = 0;

    industryCompanies.forEach(
      (companies, industry) => {
        if (companies.size > highest) {
          highest = companies.size;
          best = industry;
        }
      }
    );

    return best;
  }, [selectedRows]);

  /* =========================================================
     BEST CITY
  ========================================================= */

  const bestCity = useMemo(() => {
    if (!selectedCity) {
      return "—";
    }

    const companies = new Set();

    selectedRows.forEach((row) => {
      const company = getCompanyName(row);

      if (company) {
        companies.add(company);
      }
    });

    return companies.size > 0
      ? selectedCity
      : "—";
  }, [
    selectedCity,
    selectedRows
  ]);

  /* =========================================================
     FRANCHISEE
  ========================================================= */

  const franchiseeCount = useMemo(() => {
    const franchisees = new Set();

    selectedRows.forEach((row) => {
      const franchiseName =
        getFranchiseName(row);

      if (franchiseName) {
        franchisees.add(franchiseName);
      }
    });

    return franchisees.size;
  }, [selectedRows]);

  /* =========================================================
     GRAPH ROWS
  ========================================================= */

  const graphRows = useMemo(() => {
    if (!selectedCity) {
      return [];
    }

    return rows.filter((row) => {
      if (getCity(row) !== selectedCity) {
        return false;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return false;
      }

      if (
        selectedInfoStatus &&
        getInfoStatus(row) !==
          selectedInfoStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    selectedCity,
    selectedFinancialYear,
    selectedInfoStatus
  ]);

  /* =========================================================
     CLIENT GRAPH DATA

     FY selected:
       April -> March
       unique Company Name per month

     FY not selected:
       FY-wise unique Company Name
  ========================================================= */

  const clientGraphData = useMemo(() => {
    if (!selectedCity) {
      return [];
    }

    /* =====================================================
       MONTHLY
    ===================================================== */

    if (selectedFinancialYear) {
      const monthMap = new Map();

      financialMonths.forEach((month) => {
        monthMap.set(
          month.number,
          {
            month: month.full,
            monthShort: month.short,
            clients: new Set()
          }
        );
      });

      graphRows.forEach((row) => {
        const monthNumber = getMonth(row);

        if (!monthMap.has(monthNumber)) {
          return;
        }

        const companyName =
          getCompanyName(row);

        if (!companyName) {
          return;
        }

        monthMap
          .get(monthNumber)
          .clients.add(companyName);
      });

      return financialMonths.map(
        (month) => {
          const item =
            monthMap.get(
              month.number
            );

          return {
            month: month.full,
            monthShort: month.short,
            clients: item.clients.size
          };
        }
      );
    }

    /* =====================================================
       YEARLY
    ===================================================== */

    const yearlyMap = new Map();

    graphRows.forEach((row) => {
      const year =
        getFinancialYear(row);

      const companyName =
        getCompanyName(row);

      if (!year || !companyName) {
        return;
      }

      if (!yearlyMap.has(year)) {
        yearlyMap.set(
          year,
          new Set()
        );
      }

      yearlyMap
        .get(year)
        .add(companyName);
    });

    return Array.from(
      yearlyMap.entries()
    )
      .map(
        ([year, companies]) => ({
          year,
          clients: companies.size
        })
      )
      .sort((a, b) => {
        const yearA = Number(
          a.year.split("-")[0]
        );

        const yearB = Number(
          b.year.split("-")[0]
        );

        return yearA - yearB;
      });
  }, [
    graphRows,
    selectedCity,
    selectedFinancialYear
  ]);

  /* =========================================================
     BILLING GRAPH DATA
  ========================================================= */

  const billingGraphData = useMemo(() => {
    if (!selectedCity) {
      return [];
    }

    /* =====================================================
       MONTHLY
    ===================================================== */

    if (selectedFinancialYear) {
      const monthMap = new Map();

      financialMonths.forEach((month) => {
        monthMap.set(
          month.number,
          {
            month: month.full,
            monthShort: month.short,
            billing: 0
          }
        );
      });

      graphRows.forEach((row) => {
        const monthNumber = getMonth(row);

        if (!monthMap.has(monthNumber)) {
          return;
        }

        const financialValues =
          getFinancialValues(
            row,
            selectedInfoStatus,
            cityExpenditurePercentage
          );

        monthMap.get(
          monthNumber
        ).billing +=
          Number.isFinite(
            financialValues.billing
          )
            ? financialValues.billing
            : 0;
      });

      return financialMonths.map(
        (month) => {
          const item =
            monthMap.get(
              month.number
            );

          return {
            month: month.full,
            monthShort: month.short,
            billing:
              Number.isFinite(
                item.billing
              )
                ? item.billing
                : 0
          };
        }
      );
    }

    /* =====================================================
       YEARLY
    ===================================================== */

    const yearlyMap = new Map();

    graphRows.forEach((row) => {
      const year =
        getFinancialYear(row);

      if (!year) {
        return;
      }

      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, 0);
      }

      const financialValues =
        getFinancialValues(
          row,
          selectedInfoStatus,
          cityExpenditurePercentage
        );

      yearlyMap.set(
        year,
        yearlyMap.get(year) +
          (
            Number.isFinite(
              financialValues.billing
            )
              ? financialValues.billing
              : 0
          )
      );
    });

    return Array.from(
      yearlyMap.entries()
    )
      .map(
        ([year, billing]) => ({
          year,
          billing:
            Number.isFinite(billing)
              ? billing
              : 0
        })
      )
      .sort((a, b) => {
        const yearA = Number(
          a.year.split("-")[0]
        );

        const yearB = Number(
          b.year.split("-")[0]
        );

        return yearA - yearB;
      });
  }, [
    graphRows,
    selectedCity,
    selectedFinancialYear,
    selectedInfoStatus,
    cityExpenditurePercentage
  ]);

  /* =========================================================
     DEBUG
  ========================================================= */

  console.log(
    "CITY PERFORMANCE DATABASE ROWS:",
    rows.length
  );

  console.log(
    "CITY PERFORMANCE GRAPH ROWS:",
    graphRows.length
  );

  console.log(
    "CITY PERFORMANCE CLIENT GRAPH:",
    clientGraphData
  );

  console.log(
    "CITY PERFORMANCE BILLING GRAPH:",
    billingGraphData
  );

  /* =========================================================
     HANDLERS
  ========================================================= */

  function handleViewPerformance(city) {
    setSelectedCity(city);
    setSelectedFinancialYear("");
    setSelectedInfoStatus("");
  }

  function handleClosePerformance() {
    setSelectedCity("");
    setSelectedFinancialYear("");
    setSelectedInfoStatus("");
  }

  /* =========================================================
     CHART KEY
  ========================================================= */

  const chartKey = [
    selectedCity,
    selectedFinancialYear,
    selectedInfoStatus,
    graphRows.length,

    clientGraphData
      .map(
        (item) =>
          `${item.clients}-${
            item.year ||
            item.monthShort
          }`
      )
      .join("|"),

    billingGraphData
      .map(
        (item) =>
          `${item.billing}-${
            item.year ||
            item.monthShort
          }`
      )
      .join("|")
  ].join("-");

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="city-performance-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="city-page-header">
        <div className="city-page-eyebrow">
          PERFORMANCE
        </div>

        <h1>
          City Performance
        </h1>

        <p>
          Analyse acquired clients,
          enquiries, billing and
          profitability by city.
        </p>
      </div>

      {/* =====================================================
          CITY TABLE
      ===================================================== */}

      <div className="city-table-card">

        <div className="city-table-header">
          <div>
            <h2>
              City Performance
            </h2>

            <p>
              City-wise performance
              overview
            </p>
          </div>

          <div className="city-member-count">
            <strong>
              {cityData.length}
            </strong>

            <span>
              Cities
            </span>
          </div>
        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div className="city-performance-filters">

          <div className="city-filter-group">
            <label htmlFor="city-financial-year">
              Financial Year
            </label>

            <select
              id="city-financial-year"
              value={selectedFinancialYear}
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

          <div className="city-filter-group">
            <label htmlFor="city-info-status">
              Info Status
            </label>

            <select
              id="city-info-status"
              value={selectedInfoStatus}
              onChange={(event) =>
                setSelectedInfoStatus(
                  event.target.value
                )
              }
            >
              <option value="">
                All Info Status
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

          <div className="city-filter-group">
            <label htmlFor="city-expenditure-percentage">
              TL Expenditure %
            </label>

            <input
              id="city-expenditure-percentage"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 5"
              value={
                cityExpenditurePercentage
              }
              onChange={(event) =>
                setCityExpenditurePercentage(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="city-table-wrapper">

          <table className="city-performance-table">

            <thead>
              <tr>
                <th>
                  City
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

                {hasCityExpenditurePercentage && (
                  <th>
                    TL Expenditure
                  </th>
                )}

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
                        <div className="city-name">

                          <div className="city-avatar">
                            {item.city
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span>
                            {item.city}
                          </span>

                        </div>
                      </td>

                      <td>
                        <span className="city-client-count">
                          {item.clients}
                        </span>
                      </td>

                      <td>
                        {item.enquiries}
                      </td>

                      <td>
                        {item.franchisees}
                      </td>

                      <td>
                        <span className="city-billing-value">
                          {formatCurrency(
                            item.billing
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="city-net-value">
                          {formatCurrency(
                            item.netAmount
                          )}
                        </span>
                      </td>

                      {hasCityExpenditurePercentage && (
                        <td>
                          <span className="city-expenditure-value">
                            {formatCurrency(
                              item.tlExpenditure
                            )}
                          </span>
                        </td>
                      )}

                      <td>
                        <button
                          type="button"
                          className="city-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              item.city
                            )
                          }
                        >
                          View Performance

                          <span className="city-view-arrow">
                            →
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={
                      hasCityExpenditurePercentage
                        ? 8
                        : 7
                    }
                    className="city-empty"
                  >
                    No city performance
                    data available.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          PERFORMANCE MODAL
      ===================================================== */}

      {selectedCity && (
        <div
          className="city-performance-overlay"
          onClick={
            handleClosePerformance
          }
        >

          <div
            className="city-performance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="city-modal-header">

              <div>

                <div className="city-modal-eyebrow">
                  CITY PERFORMANCE
                </div>

                <h2>
                  {selectedCity}
                </h2>

                <p>
                  Detailed performance
                  report
                </p>

              </div>

              <button
                type="button"
                className="city-modal-close"
                onClick={
                  handleClosePerformance
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="city-summary-grid">

              <div className="city-summary-card">
                <span className="city-summary-label">
                  Best Industry
                </span>

                <strong className="city-summary-text">
                  {bestIndustry}
                </strong>
              </div>

              <div className="city-summary-card">
                <span className="city-summary-label">
                  Best City
                </span>

                <strong className="city-summary-text">
                  {bestCity}
                </strong>
              </div>

              <div className="city-summary-card">
                <span className="city-summary-label">
                  Franchisee
                </span>

                <strong className="city-summary-value">
                  {franchiseeCount}
                </strong>
              </div>

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

              {hasCityExpenditurePercentage && (
                <div className="city-summary-card">
                  <span className="city-summary-label">
                    TL Expenditure
                  </span>

                  <strong className="city-summary-value">
                    {formatCurrency(
                      performanceSummary.totalTLExpenditure
                    )}
                  </strong>
                </div>
              )}

              <div className="city-summary-card">
                <span className="city-summary-label">
                  Net Amount
                </span>

                <strong className="city-summary-value city-summary-net">
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

              <div className="city-report-period">

                <label htmlFor="city-report-year">
                  Report Period
                </label>

                <select
                  id="city-report-year"
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
                    Yearly Report
                  </option>

                  {financialYears.map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        FY {year} - Monthly
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="city-report-period">

                <label htmlFor="city-report-info">
                  Info Status
                </label>

                <select
                  id="city-report-info"
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
                    All Info Status
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

            {/* =================================================
                REPORT GRAPHS
            ================================================= */}

            <div className="city-report-graphs">

              {/* =================================================
                  CLIENT ACQUIRED
              ================================================= */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>
                    <h3>
                      Client Acquired
                    </h3>

                    <p>
                      Unique companies
                      acquired
                    </p>
                  </div>

                  <div className="city-chart-indicator city-client-indicator">
                    Unique
                  </div>

                </div>

                <div
                  className="city-chart-container"
                  style={{
                    width: "100%",
                    height: "320px",
                    minHeight: "320px",
                    minWidth: "300px",
                    position: "relative"
                  }}
                >

                  {clientGraphData.length > 0 ? (
                    <ResponsiveContainer
                      key={`clients-${chartKey}`}
                      width="100%"
                      height={320}
                      minWidth={1}
                      minHeight={320}
                      debounce={50}
                    >

                      <BarChart
                        data={clientGraphData}
                        width={500}
                        height={320}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 10,
                          bottom: 20
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
                          domain={[
                            0,
                            "auto"
                          ]}
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
                            0
                          ]}
                          barSize={32}
                          maxBarSize={45}
                          minPointSize={3}
                          isAnimationActive={false}
                        />

                      </BarChart>

                    </ResponsiveContainer>
                  ) : (
                    <div className="city-no-chart-data">
                      No client acquisition
                      data available.
                    </div>
                  )}

                </div>
              </div>

              {/* =================================================
                  BILLING
              ================================================= */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>
                    <h3>
                      Total Billing
                    </h3>

                    <p>
                      Billing performance
                    </p>
                  </div>

                  <div className="city-chart-indicator city-billing-indicator">
                    Billing
                  </div>

                </div>

                <div
                  className="city-chart-container"
                  style={{
                    width: "100%",
                    height: "320px",
                    minHeight: "320px",
                    minWidth: "300px",
                    position: "relative"
                  }}
                >

                  {billingGraphData.length > 0 ? (
                    <ResponsiveContainer
                      key={`billing-${chartKey}`}
                      width="100%"
                      height={320}
                      minWidth={1}
                      minHeight={320}
                      debounce={50}
                    >

                      <BarChart
                        data={billingGraphData}
                        width={500}
                        height={320}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 10,
                          bottom: 20
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
                          domain={[
                            0,
                            "auto"
                          ]}
                          tickFormatter={(value) =>
                            `₹${(
                              Number(value) /
                              100000
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
                            0
                          ]}
                          barSize={32}
                          maxBarSize={45}
                          minPointSize={3}
                          isAnimationActive={false}
                        />

                      </BarChart>

                    </ResponsiveContainer>
                  ) : (
                    <div className="city-no-chart-data">
                      No billing data
                      available.
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="city-modal-footer">

              <button
                type="button"
                className="city-footer-close"
                onClick={
                  handleClosePerformance
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