import { useMemo, useState, useEffect } from "react";

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
import "./FranchisePerformance.css";

/* =========================================================
   FINANCIAL YEAR CONFIGURATION
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

const quarters = [
  { quarter: 1, label: "Q1 (Apr-Jun)", months: [4, 5, 6] },
  { quarter: 2, label: "Q2 (Jul-Sep)", months: [7, 8, 9] },
  { quarter: 3, label: "Q3 (Oct-Dec)", months: [10, 11, 12] },
  { quarter: 4, label: "Q4 (Jan-Mar)", months: [1, 2, 3] }
];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const number = Number(
    String(value)
      .replace(/,/g, "")
      .replace(/[₹$€£]/g, "")
      .replace(/%/g, "")
      .trim()
  );

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(toNumber(value));
}

function normalizeCompanyKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

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

function getCompanyName(row) {
  return String(
    row?.company_name ??
    row?.["Company Name"] ??
    row?.company ??
    row?.["Company"] ??
    ""
  ).trim();
}

function getIndustry(row) {
  return String(
    row?.industry ??
    row?.["Industry"] ??
    row?.["Industry Name"] ??
    ""
  ).trim();
}

function getCity(row) {
  return String(
    row?.city ??
    row?.["City"] ??
    ""
  ).trim();
}

function getInfoStatus(row) {
  return String(
    row?.info ??
    row?.["Info"] ??
    row?.info_status ??
    row?.["Info Status"] ??
    row?.information_status ??
    row?.["Information Status"] ??
    ""
  ).trim().toUpperCase();
}

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

function getFranchiseExpenditure(row, percentage) {
  if (
    percentage === null ||
    percentage === undefined ||
    percentage === ""
  ) {
    return 0;
  }

  const rate = Number(percentage);

  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return 0;
  }

  return getBilling(row) * (rate / 100);
}

function getFinancialValues(row, infoFilter = "", percentage) {
  const info = getInfoStatus(row);
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);
  const expenditure = getFranchiseExpenditure(row, percentage);

  if (!infoFilter || infoFilter === "ALL") {
    return {
      billing,
      franchiseeShare,
      netAmount: billing - franchiseeShare,
      franchiseExpenditure: expenditure
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
      netAmount: billing - franchiseeShare,
      franchiseExpenditure: expenditure
    };
  }

  if (["RV", "C", "CN"].includes(infoFilter)) {
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

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const stringValue = String(value).trim();

  if (!stringValue) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = stringValue.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
  );

  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }

    return null;
  }

  // YYYY-MM-DD
  const isoDate = stringValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }

    return null;
  }

  const date = new Date(stringValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getFinancialYear(row) {
  const date = parseDate(getClientAcquiredDate(row));

  if (date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return month >= 4
      ? `${year}-${String(year + 1).slice(-2)}`
      : `${year - 1}-${String(year).slice(-2)}`;
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
    const year = Number(acquiredYear);

    if (Number.isFinite(year) && year > 1900) {
      return `${year}-${String(year + 1).slice(-2)}`;
    }
  }

  return "";
}

function getMonth(row) {
  const date = parseDate(getClientAcquiredDate(row));
  return date ? date.getMonth() + 1 : "";
}

function getQuarter(row) {
  const month = Number(getMonth(row));

  return quarters.find(item =>
    item.months.includes(month)
  ) || null;
}

function getFinancialYearStart(year) {
  return Number(String(year).slice(0, 4));
}

/* =========================================================
   TOOLTIP
========================================================= */

function FranchiseTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="franchise-modern-tooltip">
      <div className="franchise-tooltip-label">{label}</div>

      {payload.map((item, index) => (
        <div className="franchise-tooltip-row" key={index}>
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

function FranchisePerformance() {
  const { rows = [] } = useData();

  /* MAIN FILTERS */

  const [selectedFranchisee, setSelectedFranchisee] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedInfoStatus, setSelectedInfoStatus] = useState("");

  const [franchiseExpenditurePercentage, setFranchiseExpenditurePercentage] =
    useState("");

  const [viewReportAs, setViewReportAs] = useState("all-time");

  /* MODAL FILTERS */

  const [selectedFranchise, setSelectedFranchise] = useState("");
  const [reportFinancialYear, setReportFinancialYear] = useState("");
  const [reportInfoStatus, setReportInfoStatus] = useState("");

  const [
    reportFranchiseExpenditurePercentage,
    setReportFranchiseExpenditurePercentage
  ] = useState("");

  // Additional modal period filters.
  const [reportMonth, setReportMonth] = useState("");
  const [reportQuarter, setReportQuarter] = useState("");

  /* FRANCHISE CHANGE */

  function handleFranchiseeChange(value) {
    setSelectedFranchisee(value);

    if (!value) {
      setViewReportAs("all-time");
    }

    setSelectedFinancialYear("");
    setSelectedMonth("");
  }

  /* RESET FILTERS */

  function handleRemoveFilters() {
    setSelectedFranchisee("");
    setSelectedFinancialYear("");
    setSelectedMonth("");
    setSelectedInfoStatus("");
    setFranchiseExpenditurePercentage("");
    setViewReportAs("all-time");
  }

  /* EXPENDITURE VALIDATION */

  const hasFranchiseExpenditurePercentage =
    franchiseExpenditurePercentage !== "" &&
    Number.isFinite(Number(franchiseExpenditurePercentage)) &&
    Number(franchiseExpenditurePercentage) >= 0 &&
    Number(franchiseExpenditurePercentage) <= 100;

  const hasReportFranchiseExpenditurePercentage =
    reportFranchiseExpenditurePercentage !== "" &&
    Number.isFinite(Number(reportFranchiseExpenditurePercentage)) &&
    Number(reportFranchiseExpenditurePercentage) >= 0 &&
    Number(reportFranchiseExpenditurePercentage) <= 100;

  /* FRANCHISE OPTIONS */

  const franchiseeOptions = useMemo(() => {
    const names = new Set();

    rows.forEach(row => {
      const franchise = getFranchise(row);
      if (franchise) names.add(franchise);
    });

    return Array.from(names).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [rows]);

  /* FINANCIAL YEAR OPTIONS */

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach(row => {
      const year = getFinancialYear(row);
      if (year) years.add(year);
    });

    return Array.from(years).sort((a, b) =>
      getFinancialYearStart(a) - getFinancialYearStart(b)
    );
  }, [rows]);

  /* FILTERED MAIN ROWS */

  const filteredMainRows = useMemo(() => {
    return rows.filter(row => {
      const franchise = getFranchise(row);

      if (!franchise) return false;

      if (
        selectedFranchisee &&
        franchise !== selectedFranchisee
      ) {
        return false;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !== selectedFinancialYear
      ) {
        return false;
      }

      if (
        selectedMonth &&
        Number(getMonth(row)) !== Number(selectedMonth)
      ) {
        return false;
      }

      if (
        selectedInfoStatus &&
        selectedInfoStatus !== "ALL" &&
        getInfoStatus(row) !== selectedInfoStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    selectedFranchisee,
    selectedFinancialYear,
    selectedMonth,
    selectedInfoStatus
  ]);

  /* MAIN TABLE DATA */

  const franchiseData = useMemo(() => {
    const map = new Map();

    if (
      ["monthly", "quarterly"].includes(viewReportAs) &&
      !selectedFinancialYear
    ) {
      return [];
    }

    filteredMainRows.forEach(row => {
      const franchise = getFranchise(row);
      const financialYear = getFinancialYear(row);
      const month = Number(getMonth(row));

      let groupKey = "";
      let rowName = "";

      if (viewReportAs === "all-time") {
        groupKey = franchise;
        rowName = franchise;
      }

      if (viewReportAs === "yearly") {
        if (!financialYear) return;

        groupKey = financialYear;
        rowName = financialYear;
      }

      if (viewReportAs === "monthly") {
        if (!financialYear || !month) return;

        const monthData = financialMonths.find(
          item => item.month === month
        );

        if (!monthData) return;

        groupKey = `${financialYear}-${month}`;
        rowName = monthData.full;
      }

      if (viewReportAs === "quarterly") {
        if (!financialYear || !month) return;

        const quarter = getQuarter(row);

        if (!quarter) return;

        groupKey = `${financialYear}-Q${quarter.quarter}`;
        rowName = quarter.label;
      }

      if (!groupKey) return;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          franchise: rowName,
          enquiries: 0,
          companyNames: new Set(),
          billing: 0,
          franchiseShare: 0,
          franchiseExpenditure: 0,
          netAmount: 0
        });
      }

      const data = map.get(groupKey);

      data.enquiries += 1;

      const companyKey = normalizeCompanyKey(
        getCompanyName(row)
      );

      if (companyKey) {
        data.companyNames.add(companyKey);
      }

      const values = getFinancialValues(
        row,
        selectedInfoStatus,
        franchiseExpenditurePercentage
      );

      data.billing += values.billing;
      data.franchiseShare += values.franchiseeShare;
      data.franchiseExpenditure += values.franchiseExpenditure;
      data.netAmount += values.netAmount;
    });

    const result = Array.from(map.values()).map(item => ({
      key: item.key,
      franchise: item.franchise,
      clients: item.companyNames.size,
      enquiries: item.enquiries,
      billing: item.billing,
      franchiseShare: item.franchiseShare,
      franchiseExpenditure: item.franchiseExpenditure,
      netAmount: item.netAmount
    }));

    if (viewReportAs === "all-time") {
      return result.sort((a, b) => b.clients - a.clients);
    }

    if (viewReportAs === "yearly") {
      return result.sort((a, b) =>
        getFinancialYearStart(a.key) -
        getFinancialYearStart(b.key)
      );
    }

    if (viewReportAs === "monthly") {
      return result.sort((a, b) => {
        const [yearA, monthA] = a.key.split("-");
        const [yearB, monthB] = b.key.split("-");

        return (
          Number(yearA) - Number(yearB) ||
          Number(monthA) - Number(monthB)
        );
      });
    }

    if (viewReportAs === "quarterly") {
      return result.sort((a, b) => {
        const yearA = getFinancialYearStart(a.key);
        const yearB = getFinancialYearStart(b.key);
        const quarterA = Number(a.key.split("Q")[1]);
        const quarterB = Number(b.key.split("Q")[1]);

        return yearA - yearB || quarterA - quarterB;
      });
    }

    return result;
  }, [
    filteredMainRows,
    viewReportAs,
    selectedFinancialYear,
    selectedInfoStatus,
    franchiseExpenditurePercentage
  ]);

  /* MODAL ROWS */

  const selectedRows = useMemo(() => {
    if (!selectedFranchise) return [];

    return rows.filter(row => {
      if (getFranchise(row) !== selectedFranchise) return false;

      if (
        reportFinancialYear &&
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return false;
      }

      if (
        reportMonth &&
        Number(getMonth(row)) !== Number(reportMonth)
      ) {
        return false;
      }

      if (reportQuarter) {
        const quarter = getQuarter(row);

        if (
          !quarter ||
          Number(quarter.quarter) !== Number(reportQuarter)
        ) {
          return false;
        }
      }

      if (
        reportInfoStatus &&
        reportInfoStatus !== "ALL" &&
        getInfoStatus(row) !== reportInfoStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    selectedFranchise,
    reportFinancialYear,
    reportMonth,
    reportQuarter,
    reportInfoStatus
  ]);

  /* PERFORMANCE SUMMARY */

  const performanceSummary = useMemo(() => {
    let totalBilling = 0;
    let totalFranchiseShare = 0;
    let totalFranchiseExpenditure = 0;
    let netAmount = 0;
    let totalEnquiries = 0;

    const companyNames = new Set();

    selectedRows.forEach(row => {
      totalEnquiries += 1;

      const companyKey = normalizeCompanyKey(
        getCompanyName(row)
      );

      if (companyKey) companyNames.add(companyKey);

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        reportFranchiseExpenditurePercentage
      );

      totalBilling += values.billing;
      totalFranchiseShare += values.franchiseeShare;
      totalFranchiseExpenditure += values.franchiseExpenditure;
      netAmount += values.netAmount;
    });

    return {
      totalBilling,
      totalFranchiseShare,
      totalFranchiseExpenditure,
      netAmount,
      totalEnquiries,
      totalClients: companyNames.size
    };
  }, [
    selectedRows,
    reportInfoStatus,
    reportFranchiseExpenditurePercentage
  ]);

  /* BEST INDUSTRY */

  const bestIndustry = useMemo(() => {
    const industryCompanies = new Map();

    selectedRows.forEach(row => {
      const industry = getIndustry(row);
      const company = normalizeCompanyKey(getCompanyName(row));

      if (!industry || !company) return;

      if (!industryCompanies.has(industry)) {
        industryCompanies.set(industry, new Set());
      }

      industryCompanies.get(industry).add(company);
    });

    let best = "";
    let highest = 0;

    industryCompanies.forEach((companies, industry) => {
      if (companies.size > highest) {
        highest = companies.size;
        best = industry;
      }
    });

    return best || "—";
  }, [selectedRows]);

  /* BEST CITY */

  const bestCity = useMemo(() => {
    const cityCompanies = new Map();

    selectedRows.forEach(row => {
      const city = getCity(row);
      const company = normalizeCompanyKey(getCompanyName(row));

      if (!city || !company) return;

      if (!cityCompanies.has(city)) {
        cityCompanies.set(city, new Set());
      }

      cityCompanies.get(city).add(company);
    });

    let best = "";
    let highest = 0;

    cityCompanies.forEach((companies, city) => {
      if (companies.size > highest) {
        highest = companies.size;
        best = city;
      }
    });

    return best || "—";
  }, [selectedRows]);

  /* YEARLY REPORT */

  const yearlyReportData = useMemo(() => {
    const map = new Map();

    selectedRows.forEach(row => {
      const year = getFinancialYear(row);
      if (!year) return;

      if (!map.has(year)) {
        map.set(year, {
          year,
          companyNames: new Set(),
          billing: 0
        });
      }

      const data = map.get(year);
      const company = normalizeCompanyKey(getCompanyName(row));

      if (company) data.companyNames.add(company);

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        reportFranchiseExpenditurePercentage
      );

      data.billing += values.billing;
    });

    return Array.from(map.values())
      .map(item => ({
        year: item.year,
        clients: item.companyNames.size,
        billing: item.billing
      }))
      .sort((a, b) =>
        getFinancialYearStart(a.year) -
        getFinancialYearStart(b.year)
      );
  }, [
    selectedRows,
    reportInfoStatus,
    reportFranchiseExpenditurePercentage
  ]);

  /* MONTHLY REPORT */

  const monthlyReportData = useMemo(() => {
    if (!reportFinancialYear) return [];

    const monthMap = new Map();

    financialMonths.forEach(month => {
      monthMap.set(month.month, {
        month: month.full,
        monthShort: month.short,
        companyNames: new Set(),
        billing: 0
      });
    });

    selectedRows.forEach(row => {
      if (getFinancialYear(row) !== reportFinancialYear) return;

      const month = Number(getMonth(row));

      if (!monthMap.has(month)) return;

      const data = monthMap.get(month);
      const company = normalizeCompanyKey(getCompanyName(row));

      if (company) data.companyNames.add(company);

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        reportFranchiseExpenditurePercentage
      );

      data.billing += values.billing;
    });

    return financialMonths.map(month => {
      const data = monthMap.get(month.month);

      return {
        month: data.month,
        monthShort: data.monthShort,
        clients: data.companyNames.size,
        billing: data.billing
      };
    });
  }, [
    selectedRows,
    reportFinancialYear,
    reportInfoStatus,
    reportFranchiseExpenditurePercentage
  ]);

  const reportData = reportFinancialYear
    ? monthlyReportData
    : yearlyReportData;

  /* OPEN AND CLOSE MODAL */

  function handleViewPerformance(item) {
    if (!item) return;

    // All Time: the row itself identifies the franchise.
    // Period reports: all rows belong to the selected franchise.
    const franchise =
      viewReportAs === "all-time"
        ? item.franchise
        : selectedFranchisee;

    if (!franchise) return;

    setSelectedFranchise(franchise);

    setReportInfoStatus(selectedInfoStatus);

    setReportFranchiseExpenditurePercentage(
      franchiseExpenditurePercentage
    );

    setReportFinancialYear("");
    setReportMonth("");
    setReportQuarter("");

    if (viewReportAs === "yearly") {
      setReportFinancialYear(item.key);
    }

    if (viewReportAs === "monthly") {
      const [year, month] = item.key.split("-");

      setReportFinancialYear(year);
      setReportMonth(month);
    }

    if (viewReportAs === "quarterly") {
      const [year, quarter] = item.key.split("-Q");

      setReportFinancialYear(year);
      setReportQuarter(quarter);
    }
  }

  function handleCloseModal() {
    setSelectedFranchise("");
    setReportMonth("");
    setReportQuarter("");
  }

  useEffect(() => {
    if (!selectedFranchise) return undefined;

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedFranchise]);

  /* TABLE LABELS */

  const tableFirstColumnLabel = {
    "all-time": "Franchise Name",
    yearly: "Financial Year",
    monthly: "Month",
    quarterly: "Quarter"
  }[viewReportAs];

  const tableDescription = {
    "all-time": "Complete franchise-wise performance overview",
    yearly: "Financial-year-wise performance overview",
    monthly: "Month-wise performance overview",
    quarterly: "Quarter-wise performance overview"
  }[viewReportAs];

  const needsFinancialYear = [
    "monthly",
    "quarterly"
  ].includes(viewReportAs);

  const showReportHeading =
    selectedFranchisee && viewReportAs !== "all-time";

  const reportPeriodLabel = reportMonth
    ? `${financialMonths.find(
        month => Number(month.month) === Number(reportMonth)
      )?.full || ""} ${reportFinancialYear}`
    : reportQuarter
      ? `${quarters.find(
          quarter => quarter.quarter === Number(reportQuarter)
        )?.label || ""} ${reportFinancialYear}`
      : reportFinancialYear || "All Financial Years";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="franchise-performance-page">

      {/* PAGE HEADER */}

      <div className="franchise-page-header">
        <div>
          <div className="franchise-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>Franchise Performance</h1>

          <p>
            Monitor franchise acquisition, billing and financial
            performance.
          </p>
        </div>
      </div>

      {/* MAIN TABLE CARD */}

      <div className="franchise-table-card">

        <div className="franchise-table-header">
          <div>
            <h2>Franchise Performance</h2>
            <p>{tableDescription}</p>
          </div>

          <div className="franchise-member-count">
            {franchiseData.length}
            <span>
              {viewReportAs === "all-time" ? "Franchises" : "Periods"}
            </span>
          </div>
        </div>

        {/* FILTERS */}

        <div className="franchise-main-filters">

          <div>
            <label htmlFor="main-franchisee">Franchisee</label>

            <select
              id="main-franchisee"
              value={selectedFranchisee}
              onChange={event =>
                handleFranchiseeChange(event.target.value)
              }
            >
              <option value="">All Franchisees</option>

              {franchiseeOptions.map(franchise => (
                <option key={franchise} value={franchise}>
                  {franchise}
                </option>
              ))}
            </select>
          </div>

          {/* VIEW REPORT AS */}

          {selectedFranchisee && (
            <div>
              <label htmlFor="view-report-as">
                View Report As
              </label>

              <select
                id="view-report-as"
                value={viewReportAs}
                onChange={event => {
                  setViewReportAs(event.target.value);
                  setSelectedFinancialYear("");
                  setSelectedMonth("");
                }}
              >
                <option value="all-time">All Time</option>
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          )}

          {/* FINANCIAL YEAR */}

          <div>
            <label htmlFor="main-financial-year">
              Financial Year
            </label>

            <select
              id="main-financial-year"
              value={selectedFinancialYear}
              onChange={event =>
                setSelectedFinancialYear(event.target.value)
              }
            >
              <option value="">
                {needsFinancialYear
                  ? "Select Financial Year"
                  : "All Financial Years"}
              </option>

              {financialYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* MONTH */}

          <div>
            <label htmlFor="main-month">Month</label>

            <select
              id="main-month"
              value={selectedMonth}
              onChange={event =>
                setSelectedMonth(event.target.value)
              }
            >
              <option value="">All Months</option>

              {financialMonths.map(month => (
                <option key={month.month} value={month.month}>
                  {month.full}
                </option>
              ))}
            </select>
          </div>

          {/* INFO STATUS */}

          <div>
            <label htmlFor="main-info-status">Info Status</label>

            <select
              id="main-info-status"
              value={selectedInfoStatus}
              onChange={event =>
                setSelectedInfoStatus(event.target.value)
              }
            >
              <option value="">All</option>
              <option value="R">R</option>
              <option value="RV">RV</option>
              <option value="C">C</option>
              <option value="CN">CN</option>
            </select>
          </div>

          {/* FRANCHISE EXPENDITURE */}

          <div>
            <label htmlFor="franchise-expenditure-percentage">
              Franchise Expenditure %
            </label>

            <input
              id="franchise-expenditure-percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={franchiseExpenditurePercentage}
              placeholder="Enter %"
              onChange={event => {
                const value = event.target.value;

                if (
                  value === "" ||
                  (Number(value) >= 0 && Number(value) <= 100)
                ) {
                  setFranchiseExpenditurePercentage(value);
                }
              }}
            />
          </div>

          {/* RESET */}

          <div className="franchise-filter-action">
            <button
              type="button"
              className="franchise-remove-filter-btn"
              onClick={handleRemoveFilters}
              disabled={
                !selectedFranchisee &&
                !selectedFinancialYear &&
                !selectedMonth &&
                !selectedInfoStatus &&
                franchiseExpenditurePercentage === "" &&
                viewReportAs === "all-time"
              }
            >
              Reset Filter
            </button>
          </div>

        </div>

        {/* MAIN TABLE */}

        <div className="franchise-table-wrapper">

          {/* SELECTED FRANCHISE HEADING */}

          {showReportHeading && (
            <div className="franchise-selected-report-heading">
              <div>
                <span>FRANCHISE PERFORMANCE REPORT</span>
                <h3>{selectedFranchisee}</h3>
              </div>

              <p>
                {viewReportAs === "yearly" && "Yearly Performance"}
                {viewReportAs === "monthly" && "Monthly Performance"}
                {viewReportAs === "quarterly" && "Quarterly Performance"}
              </p>
            </div>
          )}

          {/* FINANCIAL YEAR PROMPT */}

          {needsFinancialYear && !selectedFinancialYear ? (
            <div className="franchise-financial-year-prompt">
              <div className="franchise-financial-year-prompt-icon">
                📅
              </div>

              <h3>Select Financial Year</h3>

              <p>
                Please select a Financial Year from the filter above
                to view the{" "}
                {viewReportAs === "monthly" ? "monthly" : "quarterly"}
                {" "}performance report for {selectedFranchisee}.
              </p>
            </div>
          ) : (
            <table className="franchise-table">

              <thead>
                <tr>
                  <th>{tableFirstColumnLabel}</th>
                  <th>Total Acquired Client</th>
                  <th>Total Enquiries</th>
                  <th>Total Billing</th>
                  <th>Net Amount</th>

                  {hasFranchiseExpenditurePercentage && (
                    <th>Franchise Expenditure</th>
                  )}

                  {/* PERFORMANCE COLUMN ALWAYS VISIBLE */}

                  <th>Performance</th>
                </tr>
              </thead>

              <tbody>
                {franchiseData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        6 +
                        (hasFranchiseExpenditurePercentage ? 1 : 0)
                      }
                      className="franchise-empty"
                    >
                      No franchise data available.
                    </td>
                  </tr>
                ) : (
                  franchiseData.map(item => (
                    <tr key={item.key}>

                      <td>
                        <div className="franchise-name">
                          <div className="franchise-avatar">
                            {item.franchise.charAt(0).toUpperCase()}
                          </div>

                          <span>{item.franchise}</span>
                        </div>
                      </td>

                      <td>
                        <span className="franchise-client-count">
                          {item.clients}
                        </span>
                      </td>

                      <td>
                        <span className="franchise-client-count">
                          {item.enquiries}
                        </span>
                      </td>

                      <td>
                        <span className="franchise-billing-value">
                          {formatCurrency(item.billing)}
                        </span>
                      </td>

                      <td>
                        <span className="franchise-net-value">
                          {formatCurrency(item.netAmount)}
                        </span>
                      </td>

                      {hasFranchiseExpenditurePercentage && (
                        <td>
                          <span className="franchise-expenditure-value">
                            {formatCurrency(item.franchiseExpenditure)}
                          </span>
                        </td>
                      )}

                      {/* VIEW BUTTON IN ALL REPORT TYPES */}

                      <td>
                        <button
                          type="button"
                          className="franchise-view-performance-btn"
                          onClick={() => handleViewPerformance(item)}
                        >
                          View
                          <span className="franchise-view-arrow">
                            →
                          </span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          )}
        </div>
      </div>

      {/* =====================================================
          PERFORMANCE MODAL
      ===================================================== */}

      {selectedFranchise && (
        <div
          className="franchise-performance-overlay"
          onClick={handleCloseModal}
        >
          <div
            className="franchise-performance-modal"
            onClick={event => event.stopPropagation()}
          >

            <div className="franchise-modal-header">
              <div>
                <div className="franchise-modal-eyebrow">
                  PERFORMANCE REPORT
                </div>

                <h2>{selectedFranchise}</h2>

                <p>
                  Franchise performance analysis and financial trends
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

            {/* SUMMARY CARDS */}

            <div className="franchise-summary-grid">

              <div className="franchise-summary-card">
                <span className="franchise-summary-label">
                  Best Industry
                </span>

                <strong className="franchise-summary-text">
                  {bestIndustry}
                </strong>
              </div>

              <div className="franchise-summary-card">
                <span className="franchise-summary-label">
                  Best City
                </span>

                <strong className="franchise-summary-text">
                  {bestCity}
                </strong>
              </div>

              <div className="franchise-summary-card">
                <span className="franchise-summary-label">
                  Total Billing
                </span>

                <strong className="franchise-summary-value">
                  {formatCurrency(performanceSummary.totalBilling)}
                </strong>
              </div>

              <div className="franchise-summary-card">
                <span className="franchise-summary-label">
                  Total Acquired Client
                </span>

                <strong className="franchise-summary-value">
                  {performanceSummary.totalClients}
                </strong>

                <small>Unique Company Name</small>
              </div>

              <div className="franchise-summary-card franchise-summary-share">
                <span className="franchise-summary-label">
                  Total Enquiries
                </span>

                <strong className="franchise-summary-value">
                  {performanceSummary.totalEnquiries}
                </strong>

                <small>Matching enquiry rows</small>
              </div>

              <div className="franchise-summary-card franchise-summary-share">
                <span className="franchise-summary-label">
                  Franchise Share Claimed
                </span>

                <strong className="franchise-summary-value">
                  {formatCurrency(
                    performanceSummary.totalFranchiseShare
                  )}
                </strong>
              </div>

              <div className="franchise-summary-card franchise-summary-net">
                <span className="franchise-summary-label">
                  Net Amount
                </span>

                <strong className="franchise-summary-value">
                  {formatCurrency(performanceSummary.netAmount)}
                </strong>
              </div>

            </div>

            {/* MODAL FILTERS */}

            <div className="franchise-report-controls">

              <div>
                <label htmlFor="franchise-financial-year">
                  Financial Year
                </label>

                <select
                  id="franchise-financial-year"
                  value={reportFinancialYear}
                  onChange={event => {
                    setReportFinancialYear(event.target.value);
                    setReportMonth("");
                    setReportQuarter("");
                  }}
                >
                  <option value="">All Financial Years</option>

                  {financialYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-info-status">
                  Info Status
                </label>

                <select
                  id="report-info-status"
                  value={reportInfoStatus}
                  onChange={event =>
                    setReportInfoStatus(event.target.value)
                  }
                >
                  <option value="">All</option>
                  <option value="R">R</option>
                  <option value="RV">RV</option>
                  <option value="C">C</option>
                  <option value="CN">CN</option>
                </select>
              </div>

              <div>
                <label htmlFor="report-franchise-expenditure-percentage">
                  Franchise Expenditure %
                </label>

                <input
                  id="report-franchise-expenditure-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={reportFranchiseExpenditurePercentage}
                  placeholder="Enter %"
                  onChange={event => {
                    const value = event.target.value;

                    if (
                      value === "" ||
                      (Number(value) >= 0 && Number(value) <= 100)
                    ) {
                      setReportFranchiseExpenditurePercentage(value);
                    }
                  }}
                />
              </div>

              <div className="franchise-report-period">
                <span>Report Period</span>

                <strong>{reportPeriodLabel}</strong>
              </div>

            </div>

            {/* CHARTS */}

            <div className="franchise-report-graphs">

              {/* CLIENT ACQUIRED CHART */}

              <div className="franchise-chart-card">
                <div className="franchise-chart-heading">
                  <div>
                    <span className="franchise-chart-indicator franchise-client-indicator" />
                    <h3>Client Acquired</h3>
                  </div>

                  <span>
                    {reportFinancialYear ? "Monthly" : "Yearly"}
                  </span>
                </div>

                <div className="franchise-chart-container">
                  {reportData.length === 0 ? (
                    <div className="franchise-no-chart-data">
                      No report data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
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
                            reportFinancialYear ? "monthShort" : "year"
                          }
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip content={<FranchiseTooltip />} />

                        <Bar
                          dataKey="clients"
                          name="Client Acquired"
                          fill="#B78A34"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* TOTAL BILLING CHART */}

              <div className="franchise-chart-card">
                <div className="franchise-chart-heading">
                  <div>
                    <span className="franchise-chart-indicator franchise-billing-indicator" />
                    <h3>Total Billing</h3>
                  </div>

                  <span>
                    {reportFinancialYear ? "Monthly" : "Yearly"}
                  </span>
                </div>

                <div className="franchise-chart-container">
                  {reportData.length === 0 ? (
                    <div className="franchise-no-chart-data">
                      No report data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
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
                            reportFinancialYear ? "monthShort" : "year"
                          }
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={value =>
                            `₹${(value / 100000).toFixed(0)}L`
                          }
                        />

                        <Tooltip content={<FranchiseTooltip />} />

                        <Bar
                          dataKey="billing"
                          name="Total Billing"
                          fill="#26734D"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="franchise-modal-footer">
              <span>
                {reportMonth
                  ? `Monthly report for ${reportPeriodLabel}`
                  : reportQuarter
                    ? `Quarterly report for ${reportPeriodLabel}`
                    : reportFinancialYear
                      ? `Monthly report for ${reportFinancialYear}`
                      : "Yearly performance report"}
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
