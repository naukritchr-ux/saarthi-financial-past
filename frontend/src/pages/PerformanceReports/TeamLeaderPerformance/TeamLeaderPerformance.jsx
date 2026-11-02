
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
import "./TeamLeaderPerformance.css";

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

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£%]/g, "")
    .trim();

  if (!cleaned) return 0;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
};

/* =========================================================
   CURRENCY FORMATTER
========================================================= */

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(toNumber(value));
};

/* =========================================================
   GENERIC VALUE HELPER
========================================================= */

const firstValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

/* =========================================================
   TEAM LEADER
========================================================= */

const getTeamLeader = (row) => {
  return String(
    firstValue(row, [
      "team_leader",
      "Team Leader",
      "team leader",
      "TeamLeader"
    ])
  ).trim();
};

/* =========================================================
   COMPANY NAME
========================================================= */

const getCompanyName = (row) => {
  const value = firstValue(row, [
    "company_name",
    "Company Name",
    "company",
    "Company",
    "client_name",
    "Client Name",
    "tann",
    "TANN"
  ]);

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

/* =========================================================
   INDUSTRY
========================================================= */

const getIndustry = (row) => {
  return String(
    firstValue(row, ["industry", "Industry"])
  ).trim();
};

/* =========================================================
   CITY
========================================================= */

const getCity = (row) => {
  return String(
    firstValue(row, ["city", "City"])
  ).trim();
};

/* =========================================================
   FRANCHISE NAME
========================================================= */

const getFranchiseName = (row) => {
  return String(
    firstValue(row, [
      "franchise_name",
      "Franchise Name",
      "franchise",
      "Franchise"
    ])
  )
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

/* =========================================================
   INFO STATUS
========================================================= */

const getInfoStatus = (row) => {
  return String(
    firstValue(row, [
      "info",
      "Info",
      "info_status",
      "Info Status",
      "information_status",
      "Information Status"
    ])
  )
    .trim()
    .toUpperCase();
};

/* =========================================================
   BILLING
========================================================= */

const getBilling = (row) => {
  return toNumber(
    firstValue(row, [
      "total_bill_amount",
      "Total Bill Amount",
      "Billing",
      "Total Billing",
      "Billing Amount",
      "TANN/TDS"
    ])
  );
};

/* =========================================================
   FRANCHISEE SHARE
========================================================= */

const getFranchiseeShare = (row) => {
  return toNumber(
    firstValue(row, [
      "franchisee_share",
      "Franchisee Share",
      "Franchise Cost",
      "Franchisee Cost",
      "Franchise Cost Amount"
    ])
  );
};

/* =========================================================
   TL EXPENDITURE
========================================================= */

const getTLExpenditure = (row, percentage) => {
  const billing = getBilling(row);
  const percent = toNumber(percentage);

  if (!Number.isFinite(percent) || percent < 0) {
    return 0;
  }

  return billing * (percent / 100);
};

/* =========================================================
   CLIENT ACQUIRED DATE
========================================================= */

const getClientAcquiredDate = (row) => {
  return firstValue(row, [
    "date_client_acquired",
    "Date Client Acquired",
    "client_acquired_date",
    "Client Acquired Date",
    "date_acquired",
    "Date Acquired"
  ]);
};

/* =========================================================
   SAFE DATE PARSER
========================================================= */

const parseDate = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dashMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);

  if (dashMatch) {
    const day = Number(dashMatch[1]);
    const month = Number(dashMatch[2]);
    const year = Number(dashMatch[3]);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
};

/* =========================================================
   FINANCIAL YEAR
========================================================= */

const getFinancialYear = (row) => {
  const acquiredDate = parseDate(getClientAcquiredDate(row));

  if (acquiredDate) {
    const year = acquiredDate.getFullYear();
    const month = acquiredDate.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${String(year + 1).slice(-2)}`;
    }

    return `${year - 1}-${String(year).slice(-2)}`;
  }

  const fallbackYear = firstValue(row, [
    "acquired_year",
    "Aquired Year",
    "Acquired Year"
  ]);

  if (fallbackYear) {
    const year = Number(String(fallbackYear).match(/\d{4}/)?.[0]);

    if (Number.isFinite(year)) {
      return `${year}-${String(year + 1).slice(-2)}`;
    }
  }

  return "";
};

/* =========================================================
   MONTH
========================================================= */

const getMonth = (row) => {
  const date = parseDate(getClientAcquiredDate(row));

  if (!date) return null;

  return date.getMonth() + 1;
};

/* =========================================================
   QUARTER
========================================================= */

const getFinancialQuarter = (month) => {
  if ([4, 5, 6].includes(month)) return "Q1";
  if ([7, 8, 9].includes(month)) return "Q2";
  if ([10, 11, 12].includes(month)) return "Q3";
  if ([1, 2, 3].includes(month)) return "Q4";

  return "";
};

/* =========================================================
   QUARTER DISPLAY LABEL
========================================================= */

const getQuarterLabel = (quarter) => {
  const quarterLabels = {
    Q1: "Q1 (Apr-Jun)",
    Q2: "Q2 (Jul-Sep)",
    Q3: "Q3 (Oct-Dec)",
    Q4: "Q4 (Jan-Mar)"
  };

  return quarterLabels[quarter] || quarter;
};

/* =========================================================
   INFO STATUS FILTER
========================================================= */

const matchesInfoFilter = (row, selectedInfoStatus) => {
  if (!selectedInfoStatus || selectedInfoStatus === "ALL") {
    return true;
  }

  return getInfoStatus(row) === selectedInfoStatus;
};

/* =========================================================
   FINANCIAL VALUES
   EXISTING CALCULATION PRESERVED
========================================================= */

const getFinancialValues = (row, infoFilter = "", percentage = "") => {
  const info = getInfoStatus(row);
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);
  const tlExpenditure = getTLExpenditure(row, percentage);

  if (!infoFilter || infoFilter === "ALL") {
    return {
      billing,
      netAmount: billing - franchiseeShare,
      franchiseeShare,
      tlExpenditure
    };
  }

  if (infoFilter === "R") {
    if (info !== "R") {
      return {
        billing: 0,
        netAmount: 0,
        franchiseeShare: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: billing - franchiseeShare,
      franchiseeShare,
      tlExpenditure
    };
  }

  if (infoFilter === "RV" || infoFilter === "C" || infoFilter === "CN") {
    if (info !== infoFilter) {
      return {
        billing: 0,
        netAmount: 0,
        franchiseeShare: 0,
        tlExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      franchiseeShare: 0,
      tlExpenditure: 0
    };
  }

  return {
    billing: 0,
    netAmount: 0,
    franchiseeShare: 0,
    tlExpenditure: 0
  };
};

/* =========================================================
   DISPLAY HELPERS
========================================================= */

const displayValue = (value) => {
  if (!value) return "—";
  return value;
};

const capitalizeWords = (value) => {
  if (!value) return "—";

  return String(value)
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/* =========================================================
   TOOLTIP
========================================================= */

const TLTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="tl-modern-tooltip">
      <div className="tl-tooltip-label">
        {label}
      </div>

      {payload.map((item, index) => {
        const isBilling = item.dataKey === "billing";

        return (
          <div
            className="tl-tooltip-row"
            key={`${item.dataKey}-${index}`}
          >
            <span>{item.name}</span>

            <strong>
              {isBilling
                ? formatCurrency(item.value)
                : Number(item.value || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const TeamLeaderPerformance = () => {
  const { rows = [] } = useData();

  /* =======================================================
     MAIN PAGE FILTERS
  ======================================================= */

  const [selectedLeader, setSelectedLeader] = useState("");
  const [selectedLeaderFilter, setSelectedLeaderFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedInfoStatus, setSelectedInfoStatus] = useState("");
  const [tlExpenditurePercentage, setTlExpenditurePercentage] = useState("");

  const [selectedReportView, setSelectedReportView] = useState("ALL_TIME");

  /* =======================================================
     MODAL REPORT FILTERS
  ======================================================= */

  const [reportFinancialYear, setReportFinancialYear] = useState("");
  const [reportInfoStatus, setReportInfoStatus] = useState("");
  const [reportView, setReportView] = useState("ALL_TIME");

  /* =======================================================
     ACTIVE REPORT VIEW
  ======================================================= */

  const isSingleLeaderSelected = Boolean(selectedLeaderFilter);

  const activeReportView = isSingleLeaderSelected
    ? selectedReportView
    : "ALL_TIME";

  const activeReportPeriodLabel = {
    ALL_TIME: "All Time",
    YEARLY: "Yearly",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly"
  }[activeReportView];

  const isPeriodView = activeReportView !== "ALL_TIME";

  const requiresFinancialYear =
    isSingleLeaderSelected &&
    (activeReportView === "MONTHLY" ||
      activeReportView === "QUARTERLY") &&
    !selectedFinancialYear;

  /* =======================================================
     MAIN TABLE COLUMN CONFIGURATION
  ======================================================= */

  const periodColumnLabel = {
    YEARLY: "Financial Year",
    MONTHLY: "Month",
    QUARTERLY: "Quarter"
  }[activeReportView] || "Team Leader";

  const showLeaderHeading = isSingleLeaderSelected && isPeriodView;

  /* =======================================================
     RESET MAIN PAGE FILTERS
  ======================================================= */

  const handleResetFilters = () => {
    setSelectedLeaderFilter("");
    setSelectedFinancialYear("");
    setSelectedMonth("");
    setSelectedInfoStatus("");
    setTlExpenditurePercentage("");
    setSelectedReportView("ALL_TIME");
  };

  /* =======================================================
     TL EXPENDITURE VALIDATION
  ======================================================= */

  const hasTLExpenditurePercentage =
    tlExpenditurePercentage !== "" &&
    Number.isFinite(Number(tlExpenditurePercentage)) &&
    Number(tlExpenditurePercentage) >= 0 &&
    Number(tlExpenditurePercentage) <= 100;

  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach(row => {
      const fy = getFinancialYear(row);

      if (fy) years.add(fy);
    });

    return Array.from(years).sort((a, b) => {
      return Number(a.slice(0, 4)) - Number(b.slice(0, 4));
    });
  }, [rows]);

  /* =======================================================
     TEAM LEADERS
  ======================================================= */

  const teamLeaders = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map(row => getTeamLeader(row))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  /* =======================================================
     INFO STATUS OPTIONS
  ======================================================= */

  const infoStatuses = ["R", "RV", "C", "CN"];

  /* =======================================================
     TEAM LEADER DATA
     ALL-TIME CALCULATION PRESERVED
  ======================================================= */

  const leaderData = useMemo(() => {
    const map = new Map();

    rows.forEach(row => {
      const leader = getTeamLeader(row);

      if (!leader) return;

      if (selectedLeaderFilter && leader !== selectedLeaderFilter) {
        return;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !== selectedFinancialYear
      ) {
        return;
      }

      if (selectedMonth && getMonth(row) !== Number(selectedMonth)) {
        return;
      }

      if (!matchesInfoFilter(row, selectedInfoStatus)) {
        return;
      }

      if (!map.has(leader)) {
        map.set(leader, {
          leader,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          tlExpenditure: 0
        });
      }

      const data = map.get(leader);

      data.enquiries += 1;

      const companyName = getCompanyName(row);

      if (companyName) {
        data.clients.add(companyName);
      }

      const franchiseName = getFranchiseName(row);

      if (franchiseName) {
        data.franchisees.add(franchiseName);
      }

      const financial = getFinancialValues(
        row,
        selectedInfoStatus,
        tlExpenditurePercentage
      );

      data.billing += financial.billing;
      data.netAmount += financial.netAmount;
      data.tlExpenditure += financial.tlExpenditure;
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        clients: item.clients.size,
        franchisees: item.franchisees.size
      }))
      .filter(item => item.enquiries > 0)
      .sort((a, b) =>
        b.clients - a.clients ||
        b.billing - a.billing ||
        a.leader.localeCompare(b.leader)
      );
  }, [
    rows,
    selectedLeaderFilter,
    selectedFinancialYear,
    selectedMonth,
    selectedInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     PERIOD-WISE DATA
  ======================================================= */

  const periodLeaderData = useMemo(() => {
    const map = new Map();

    if (!selectedLeaderFilter || activeReportView === "ALL_TIME") {
      return [];
    }

    if (
      (activeReportView === "MONTHLY" ||
        activeReportView === "QUARTERLY") &&
      !selectedFinancialYear
    ) {
      return [];
    }

    rows.forEach(row => {
      const leader = getTeamLeader(row);

      if (!leader || leader !== selectedLeaderFilter) {
        return;
      }

      if (!matchesInfoFilter(row, selectedInfoStatus)) {
        return;
      }

      const financialYear = getFinancialYear(row);

      let period = "";
      let periodLabel = "";

      if (activeReportView === "YEARLY") {
        if (!financialYear) return;

        period = financialYear;
        periodLabel = `FY ${financialYear}`;
      }

      if (activeReportView === "MONTHLY") {
        if (financialYear !== selectedFinancialYear) return;

        const monthNumber = getMonth(row);

        const monthData = financialMonths.find(
          item => item.month === monthNumber
        );

        if (!monthData) return;

        period = String(monthNumber);
        periodLabel = monthData.full;
      }

      if (activeReportView === "QUARTERLY") {
        if (financialYear !== selectedFinancialYear) return;

        const monthNumber = getMonth(row);
        const quarter = getFinancialQuarter(monthNumber);

        if (!quarter) return;

        period = quarter;

        // Updated display label:
        // Q1 (Apr-Jun), Q2 (Jul-Sep), etc.
        periodLabel = getQuarterLabel(quarter);
      }

      if (!period) return;

      const key = `${leader}__${period}`;

      if (!map.has(key)) {
        map.set(key, {
          leader,
          period,
          periodLabel,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          tlExpenditure: 0
        });
      }

      const data = map.get(key);

      data.enquiries += 1;

      const companyName = getCompanyName(row);

      if (companyName) {
        data.clients.add(companyName);
      }

      const franchiseName = getFranchiseName(row);

      if (franchiseName) {
        data.franchisees.add(franchiseName);
      }

      const financial = getFinancialValues(
        row,
        selectedInfoStatus,
        tlExpenditurePercentage
      );

      data.billing += financial.billing;
      data.netAmount += financial.netAmount;
      data.tlExpenditure += financial.tlExpenditure;
    });

    const monthOrder = new Map(
      financialMonths.map((item, index) => [
        String(item.month),
        index
      ])
    );

    return Array.from(map.values())
      .map(item => ({
        ...item,
        clients: item.clients.size,
        franchisees: item.franchisees.size
      }))
      .sort((a, b) => {
        if (activeReportView === "YEARLY") {
          return Number(a.period.slice(0, 4)) -
            Number(b.period.slice(0, 4));
        }

        if (activeReportView === "MONTHLY") {
          return monthOrder.get(a.period) - monthOrder.get(b.period);
        }

        if (activeReportView === "QUARTERLY") {
          return a.period.localeCompare(b.period);
        }

        return 0;
      });
  }, [
    rows,
    selectedLeaderFilter,
    activeReportView,
    selectedFinancialYear,
    selectedInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     DISPLAYED TABLE DATA
  ======================================================= */

  const displayedLeaderData = isPeriodView
    ? periodLeaderData
    : leaderData;

  /* =======================================================
     SELECTED LEADER MODAL ROWS
  ======================================================= */

  const selectedRows = useMemo(() => {
    if (!selectedLeader) return [];

    return rows.filter(row => {
      if (getTeamLeader(row) !== selectedLeader) {
        return false;
      }

      if (
        reportFinancialYear &&
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return false;
      }

      if (!matchesInfoFilter(row, reportInfoStatus)) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    selectedLeader,
    reportFinancialYear,
    reportInfoStatus
  ]);

  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary = useMemo(() => {
    let totalBilling = 0;
    let totalNetAmount = 0;
    let totalTLExpenditure = 0;
    let totalFranchiseeShare = 0;

    selectedRows.forEach(row => {
      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        tlExpenditurePercentage
      );

      totalBilling += financial.billing;
      totalNetAmount += financial.netAmount;
      totalTLExpenditure += financial.tlExpenditure;

      if (
        !reportInfoStatus ||
        reportInfoStatus === "ALL" ||
        reportInfoStatus === "R"
      ) {
        totalFranchiseeShare += financial.franchiseeShare;
      }
    });

    const grossProfit = totalNetAmount - totalTLExpenditure;

    const grossMargin =
      totalNetAmount !== 0
        ? (grossProfit / totalNetAmount) * 100
        : 0;

    const industryMap = new Map();

    selectedRows.forEach(row => {
      const industry = getIndustry(row);
      const company = getCompanyName(row);

      if (!industry || !company) return;

      if (!industryMap.has(industry)) {
        industryMap.set(industry, new Set());
      }

      industryMap.get(industry).add(company);
    });

    let bestIndustry = "";
    let bestIndustryCount = 0;

    industryMap.forEach((companies, industry) => {
      if (companies.size > bestIndustryCount) {
        bestIndustry = industry;
        bestIndustryCount = companies.size;
      }
    });

    const cityMap = new Map();

    selectedRows.forEach(row => {
      const city = getCity(row);
      const company = getCompanyName(row);

      if (!city || !company) return;

      if (!cityMap.has(city)) {
        cityMap.set(city, new Set());
      }

      cityMap.get(city).add(company);
    });

    let bestCity = "";
    let bestCityCount = 0;

    cityMap.forEach((companies, city) => {
      if (companies.size > bestCityCount) {
        bestCity = city;
        bestCityCount = companies.size;
      }
    });

    const uniqueClients = new Set();

    selectedRows.forEach(row => {
      const company = getCompanyName(row);

      if (company) {
        uniqueClients.add(company);
      }
    });

    return {
      totalBilling,
      totalNetAmount,
      totalTLExpenditure,
      totalFranchiseeShare,
      grossProfit,
      grossMargin,
      bestIndustry,
      bestIndustryCount,
      bestCity,
      bestCityCount,
      uniqueClients: uniqueClients.size,
      totalEnquiries: selectedRows.length
    };
  }, [
    selectedRows,
    reportInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     YEARLY REPORT
  ======================================================= */

  const yearlyReportData = useMemo(() => {
    const map = new Map();

    selectedRows.forEach(row => {
      const year = getFinancialYear(row);

      if (!year) return;

      if (!map.has(year)) {
        map.set(year, {
          year,
          clients: new Set(),
          billing: 0
        });
      }

      const data = map.get(year);
      const company = getCompanyName(row);

      if (company) {
        data.clients.add(company);
      }

      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        tlExpenditurePercentage
      );

      data.billing += financial.billing;
    });

    return Array.from(map.values())
      .sort((a, b) =>
        Number(a.year.slice(0, 4)) - Number(b.year.slice(0, 4))
      )
      .map(item => ({
        year: `FY ${item.year}`,
        clients: item.clients.size,
        billing: item.billing
      }));
  }, [
    selectedRows,
    reportInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     MONTHLY REPORT
  ======================================================= */

  const monthlyReportData = useMemo(() => {
    const map = new Map();

    financialMonths.forEach(month => {
      map.set(month.month, {
        month: month.short,
        clients: new Set(),
        billing: 0
      });
    });

    selectedRows.forEach(row => {
      const month = getMonth(row);

      if (!month) return;

      if (
        !reportFinancialYear ||
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return;
      }

      const data = map.get(month);

      if (!data) return;

      const company = getCompanyName(row);

      if (company) {
        data.clients.add(company);
      }

      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        tlExpenditurePercentage
      );

      data.billing += financial.billing;
    });

    return financialMonths.map(month => {
      const data = map.get(month.month);

      return {
        month: month.short,
        clients: data.clients.size,
        billing: data.billing
      };
    });
  }, [
    selectedRows,
    reportFinancialYear,
    reportInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     QUARTERLY REPORT
  ======================================================= */

  const quarterlyReportData = useMemo(() => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"];

    const map = new Map();

    quarters.forEach(quarter => {
      map.set(quarter, {
        quarter,
        clients: new Set(),
        billing: 0
      });
    });

    selectedRows.forEach(row => {
      if (
        !reportFinancialYear ||
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return;
      }

      const month = getMonth(row);
      const quarter = getFinancialQuarter(month);

      if (!quarter) return;

      const data = map.get(quarter);
      const company = getCompanyName(row);

      if (company) {
        data.clients.add(company);
      }

      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        tlExpenditurePercentage
      );

      data.billing += financial.billing;
    });

    return quarters.map(quarter => {
      const data = map.get(quarter);

      return {
        quarter,
        clients: data.clients.size,
        billing: data.billing
      };
    });
  }, [
    selectedRows,
    reportFinancialYear,
    reportInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     ALL-TIME REPORT
  ======================================================= */

  const allTimeReportData = useMemo(() => {
    const clients = new Set();
    let billing = 0;

    selectedRows.forEach(row => {
      const company = getCompanyName(row);

      if (company) {
        clients.add(company);
      }

      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        tlExpenditurePercentage
      );

      billing += financial.billing;
    });

    return [{
      period: "All Time",
      clients: clients.size,
      billing
    }];
  }, [
    selectedRows,
    reportInfoStatus,
    tlExpenditurePercentage
  ]);

  /* =======================================================
     MODAL REPORT DATA
  ======================================================= */

  const reportData = useMemo(() => {
    if (
      (reportView === "MONTHLY" || reportView === "QUARTERLY") &&
      !reportFinancialYear
    ) {
      return [];
    }

    switch (reportView) {
      case "ALL_TIME":
        return allTimeReportData;

      case "YEARLY":
        return yearlyReportData.map(item => ({
          ...item,
          period: item.year
        }));

      case "MONTHLY":
        return monthlyReportData.map(item => ({
          ...item,
          period: item.month
        }));

      case "QUARTERLY":
        return quarterlyReportData.map(item => ({
          ...item,
          period: item.quarter
        }));

      default:
        return allTimeReportData;
    }
  }, [
    reportView,
    reportFinancialYear,
    allTimeReportData,
    yearlyReportData,
    monthlyReportData,
    quarterlyReportData
  ]);

  const reportPeriodLabel = {
    ALL_TIME: "All Time",
    YEARLY: "Yearly",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly"
  }[reportView];

  /* =======================================================
     VIEW PERFORMANCE
  ======================================================= */

  const handleViewPerformance = (leader) => {
    setSelectedLeader(leader);
    setReportFinancialYear(selectedFinancialYear);
    setReportInfoStatus(selectedInfoStatus);
    setReportView(selectedReportView);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const handleClosePerformance = () => {
    setSelectedLeader("");
  };

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!selectedLeader) {
      return undefined;
    }

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        handleClosePerformance();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLeader]);

  /* =======================================================
     AVATAR INITIAL
  ======================================================= */

  const getInitial = (name) => {
    if (!name) return "?";

    return name.trim().charAt(0).toUpperCase();
  };

  /* =========================================================
     TABLE COLUMN COUNT
  ========================================================= */

  const tableColumnCount =
    7 + (hasTLExpenditurePercentage ? 1 : 0);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="tl-performance-page">

      {/* PAGE HEADER */}

      <div className="tl-page-header">
        <div>
          <div className="tl-page-eyebrow">
            PERFORMANCE
          </div>

          <h1>
            Team Leader Performance
          </h1>

          <p>
            Track acquired clients, enquiries and financial performance by team leader.
          </p>
        </div>
      </div>

      {/* TABLE CARD */}

      <div className="tl-table-card">

        <div className="tl-table-header">
          <div>
            <h2>
              {!isSingleLeaderSelected
                ? "Team Leader Overview"
                : activeReportView === "ALL_TIME"
                  ? `${selectedLeaderFilter} — All Time`
                  : `${selectedLeaderFilter} — ${activeReportPeriodLabel} Report`}
            </h2>

            <p>
              Performance summary based on the selected filters.
            </p>
          </div>

          <div className="tl-member-count">
            {requiresFinancialYear ? 0 : displayedLeaderData.length}

            <span>
              {isPeriodView ? "Report Rows" : "Team Leaders"}
            </span>
          </div>
        </div>

        {/* MAIN FILTERS */}

        <div className="tl-performance-filters">

          {/* TEAM LEADER */}

          <div className="tl-filter-group">
            <label>Team Leader</label>

            <select
              value={selectedLeaderFilter}
              onChange={event => setSelectedLeaderFilter(event.target.value)}
            >
              <option value="">All Team Leaders</option>

              {teamLeaders.map(leader => (
                <option key={leader} value={leader}>
                  {leader}
                </option>
              ))}
            </select>
          </div>

          {/* VIEW REPORT AS */}

          {isSingleLeaderSelected && (
            <div className="tl-filter-group">
              <label>View Report As</label>

              <select
                value={selectedReportView}
                onChange={event => setSelectedReportView(event.target.value)}
              >
                <option value="ALL_TIME">All Time</option>
                <option value="YEARLY">Yearly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>
          )}

          {/* FINANCIAL YEAR */}

          <div className="tl-filter-group">
            <label>Financial Year</label>

            <select
              value={selectedFinancialYear}
              onChange={event => setSelectedFinancialYear(event.target.value)}
            >
              <option value="">All Financial Years</option>

              {financialYears.map(year => (
                <option key={year} value={year}>
                  FY {year}
                </option>
              ))}
            </select>
          </div>

          {/* MONTH */}

          <div className="tl-filter-group">
            <label>Month</label>

            <select
              value={selectedMonth}
              onChange={event => setSelectedMonth(event.target.value)}
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

          <div className="tl-filter-group">
            <label>Info Status</label>

            <select
              value={selectedInfoStatus}
              onChange={event => setSelectedInfoStatus(event.target.value)}
            >
              <option value="">All Info Status</option>

              {infoStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* TL EXPENDITURE */}

          <div className="tl-filter-group">
            <label>TL Expenditure %</label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={tlExpenditurePercentage}
              onChange={event => {
                const value = event.target.value;

                if (
                  value === "" ||
                  (Number(value) >= 0 && Number(value) <= 100)
                ) {
                  setTlExpenditurePercentage(value);
                }
              }}
              placeholder="e.g. 10"
            />
          </div>

          {/* RESET FILTERS */}

          <div className="tl-reset-filter-group">
            <button
              type="button"
              className="tl-reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* SELECTED TEAM LEADER HEADING */}

        {showLeaderHeading && (
          <div className="tl-selected-leader-heading">
            <div className="tl-selected-leader-info">
              <span className="tl-selected-leader-eyebrow">
                TEAM LEADER
              </span>

              <h2>
                {selectedLeaderFilter}
              </h2>

              <p>
                {activeReportPeriodLabel} Performance Report
                {selectedFinancialYear &&
                  (activeReportView === "MONTHLY" ||
                    activeReportView === "QUARTERLY")
                  ? ` · FY ${selectedFinancialYear}`
                  : ""}
              </p>
            </div>
          </div>
        )}

        {/* MAIN TABLE */}

        {requiresFinancialYear ? (
          <div className="tl-no-chart-data">
            Please select the financial year.
          </div>
        ) : (
          <div className="tl-table-wrapper">
            <table className="tl-performance-table">

              <thead>
                <tr>
                  <th>
                    {showLeaderHeading
                      ? periodColumnLabel
                      : "Team Leader"}
                  </th>

                  <th>Total Acquired Client</th>
                  <th>Total Enquiries</th>
                  <th>No. of Franchisee</th>
                  <th>Total Billing</th>
                  <th>Net Amount</th>

                  {hasTLExpenditurePercentage && (
                    <th>TL Expenditure</th>
                  )}

                  <th>Performance</th>
                </tr>
              </thead>

              <tbody>
                {displayedLeaderData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
                      className="tl-empty"
                    >
                      No team leader performance data found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  displayedLeaderData.map((leader, index) => (
                    <tr
                      key={
                        isPeriodView
                          ? `${leader.leader}-${leader.period}`
                          : leader.leader
                      }
                    >

                      <td>
                        {showLeaderHeading ? (
                          <span className="tl-period-cell">
                            {leader.periodLabel}
                          </span>
                        ) : (
                          <div className="tl-name">
                            <span className="tl-avatar">
                              {getInitial(leader.leader)}
                            </span>

                            <span className="tl-name-text">
                              <span>
                                {leader.leader}
                              </span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="tl-client-count">
                          {leader.clients.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td>
                        {leader.enquiries.toLocaleString("en-IN")}
                      </td>

                      <td>
                        {leader.franchisees.toLocaleString("en-IN")}
                      </td>

                      <td>
                        <span className="tl-billing-value">
                          {formatCurrency(leader.billing)}
                        </span>
                      </td>

                      <td>
                        <span className="tl-net-value">
                          {formatCurrency(leader.netAmount)}
                        </span>
                      </td>

                      {hasTLExpenditurePercentage && (
                        <td>
                          <span className="tl-expenditure-value">
                            {formatCurrency(leader.tlExpenditure)}
                          </span>
                        </td>
                      )}

                      <td>
                        <button
                          type="button"
                          className="tl-view-performance-btn"
                          onClick={() => handleViewPerformance(leader.leader)}
                        >
                          View Performance

                          <span className="tl-view-arrow">
                            →
                          </span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* PERFORMANCE MODAL */}

      {selectedLeader && (
        <div
          className="tl-performance-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              handleClosePerformance();
            }
          }}
        >
          <div
            className="tl-performance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tl-performance-title"
          >

            {/* MODAL HEADER */}

            <div className="tl-modal-header">
              <div>
                <div className="tl-modal-eyebrow">
                  TEAM LEADER PERFORMANCE
                </div>

                <h2 id="tl-performance-title">
                  {selectedLeader}
                </h2>

                <p>
                  Detailed performance analysis and financial overview.
                </p>
              </div>

              <button
                type="button"
                className="tl-modal-close"
                onClick={handleClosePerformance}
                aria-label="Close performance"
              >
                ×
              </button>
            </div>

            {/* SUMMARY */}

            <div className="tl-summary-grid">

              <div className="tl-summary-card">
                <span className="tl-summary-label">
                  Best Industry
                </span>

                <span className="tl-summary-text">
                  {capitalizeWords(performanceSummary.bestIndustry)}
                </span>

                <small>
                  {performanceSummary.bestIndustryCount.toLocaleString("en-IN")} acquired client
                  {performanceSummary.bestIndustryCount === 1 ? "" : "s"}
                </small>
              </div>

              <div className="tl-summary-card">
                <span className="tl-summary-label">
                  Best City
                </span>

                <span className="tl-summary-text">
                  {capitalizeWords(performanceSummary.bestCity)}
                </span>

                <small>
                  {performanceSummary.bestCityCount.toLocaleString("en-IN")} acquired client
                  {performanceSummary.bestCityCount === 1 ? "" : "s"}
                </small>
              </div>

              <div className="tl-summary-card">
                <span className="tl-summary-label">
                  Total Billing
                </span>

                <span className="tl-summary-value">
                  {formatCurrency(performanceSummary.totalBilling)}
                </span>

                <small>
                  Selected period
                </small>
              </div>

              {hasTLExpenditurePercentage && (
                <div className="tl-summary-card">
                  <span className="tl-summary-label">
                    TL Expenditure
                  </span>

                  <span className="tl-summary-value">
                    {formatCurrency(performanceSummary.totalTLExpenditure)}
                  </span>

                  <small>
                    {Number(tlExpenditurePercentage).toFixed(2)}% of billing
                  </small>
                </div>
              )}

              <div className="tl-summary-card tl-summary-net">
                <span className="tl-summary-label">
                  Net Amount
                </span>

                <span className="tl-summary-value">
                  {formatCurrency(performanceSummary.totalNetAmount)}
                </span>

                <small>
                  After franchisee share
                </small>
              </div>

            </div>

            {/* REPORT CONTROLS */}

            <div className="tl-report-controls">
              <div className="tl-report-filter-row">

                <div className="tl-filter-group">
                  <label>Financial Year</label>

                  <select
                    value={reportFinancialYear}
                    onChange={event => setReportFinancialYear(event.target.value)}
                  >
                    <option value="">
                      All Financial Years
                    </option>

                    {financialYears.map(year => (
                      <option key={year} value={year}>
                        FY {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tl-filter-group">
                  <label>Info Status</label>

                  <select
                    value={reportInfoStatus}
                    onChange={event => setReportInfoStatus(event.target.value)}
                  >
                    <option value="">
                      All Info Status
                    </option>

                    {infoStatuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="tl-report-period">
                <span>Report Period</span>

                <strong>
                  {reportPeriodLabel}
                  {reportFinancialYear
                    ? ` · FY ${reportFinancialYear}`
                    : ""}
                </strong>
              </div>
            </div>

            {/* GRAPHS */}

            <div className="tl-report-graphs">

              {/* CLIENT CHART */}

              <div className="tl-chart-card">
                <div className="tl-chart-heading">
                  <div>
                    <span className="tl-chart-indicator tl-client-indicator" />

                    <h3>Client Acquired</h3>
                  </div>

                  <span>Unique Companies</span>
                </div>

                <div className="tl-chart-container">
                  {reportView !== "ALL_TIME" &&
                    (reportView === "MONTHLY" || reportView === "QUARTERLY") &&
                    !reportFinancialYear ? (
                    <div className="tl-no-chart-data">
                      Please select the financial year.
                    </div>
                  ) : reportData.length === 0 ? (
                    <div className="tl-no-chart-data">
                      No client data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 5
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip content={<TLTooltip />} />

                        <Bar
                          dataKey="clients"
                          name="Client Acquired"
                          fill="#B78A34"
                          radius={[5, 5, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* BILLING CHART */}

              <div className="tl-chart-card">
                <div className="tl-chart-heading">
                  <div>
                    <span className="tl-chart-indicator tl-billing-indicator" />

                    <h3>Total Billing</h3>
                  </div>

                  <span>INR</span>
                </div>

                <div className="tl-chart-container">
                  {reportView !== "ALL_TIME" &&
                    (reportView === "MONTHLY" || reportView === "QUARTERLY") &&
                    !reportFinancialYear ? (
                    <div className="tl-no-chart-data">
                      Please select the financial year.
                    </div>
                  ) : reportData.length === 0 ? (
                    <div className="tl-no-chart-data">
                      No billing data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 5
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={value => {
                            const number = Number(value) || 0;

                            if (Math.abs(number) >= 10000000) {
                              return `₹${(number / 10000000).toFixed(1)}Cr`;
                            }

                            if (Math.abs(number) >= 100000) {
                              return `₹${(number / 100000).toFixed(1)}L`;
                            }

                            if (Math.abs(number) >= 1000) {
                              return `₹${(number / 1000).toFixed(0)}K`;
                            }

                            return `₹${number}`;
                          }}
                        />

                        <Tooltip content={<TLTooltip />} />

                        <Bar
                          dataKey="billing"
                          name="Total Billing"
                          fill="#26734D"
                          radius={[5, 5, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* FOOTER */}

            <div className="tl-modal-footer">
              <span>
                {performanceSummary.uniqueClients.toLocaleString("en-IN")} unique acquired client
                {performanceSummary.uniqueClients === 1 ? "" : "s"} ·{" "}
                {performanceSummary.totalEnquiries.toLocaleString("en-IN")} enquiries
              </span>

              <button
                type="button"
                className="tl-footer-close"
                onClick={handleClosePerformance}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TeamLeaderPerformance;
