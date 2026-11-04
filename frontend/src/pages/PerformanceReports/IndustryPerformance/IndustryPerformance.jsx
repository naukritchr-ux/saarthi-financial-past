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

import { useData } from "../../../context/DataContext";
import "./IndustryPerformance.css";

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

const financialQuarters = [
  { name: "Q1 (Apr - Jun)", months: [4, 5, 6] },
  { name: "Q2 (Jul - Sep)", months: [7, 8, 9] },
  { name: "Q3 (Oct - Dec)", months: [10, 11, 12] },
  { name: "Q4 (Jan - Mar)", months: [1, 2, 3] }
];

/* =========================================================
   BASIC HELPERS
========================================================= */

const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeCompanyKey = (value) => {
  return normalizeValue(value)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) => {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
};

const formatNumber = (value) => {
  return toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  });
};

/* =========================================================
   FIELD HELPERS
========================================================= */

const getCompanyName = (row) => {
  return normalizeValue(
    row?.company_name ??
    row?.["Company Name"]
  );
};

const getIndustry = (row) => {
  return normalizeValue(
    row?.industry ??
    row?.Industry ??
    row?.["Industry Name"]
  );
};

const getSubIndustry = (row) => {
  return normalizeValue(
    row?.sub_industry ??
    row?.subIndustry ??
    row?.["Sub Industry"] ??
    row?.["Sub Industry Name"]
  );
};

const getTeamLeader = (row) => {
  return normalizeValue(
    row?.team_leader ??
    row?.teamLeader ??
    row?.["Team Leader"]
  );
};

const getBDMember = (row) => {
  return normalizeValue(
    row?.bd_member ??
    row?.bdMember ??
    row?.["BD Member"]
  );
};

const getFranchiseName = (row) => {
  return normalizeValue(
    row?.franchise_name ??
    row?.franchiseName ??
    row?.franchise ??
    row?.Franchise ??
    row?.["Franchise Name"]
  );
};

const getBilling = (row) => {
  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"] ??
    row?.totalBilling ??
    row?.["Total Billing"] ??
    row?.billing ??
    row?.Billing ??
    row?.["Billing Amount"]
  );
};

const getFranchiseeShare = (row) => {
  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"] ??
    row?.franchise_cost ??
    row?.["Franchise Cost"] ??
    row?.franchisee_cost ??
    row?.["Franchisee Cost"] ??
    row?.["Franchise Cost Amount"]
  );
};

const getInfoStatus = (row) => {
  return normalizeValue(
    row?.info ??
    row?.Info ??
    row?.info_status ??
    row?.["Info Status"] ??
    row?.information_status ??
    row?.["Information Status"]
  ).toUpperCase();
};

/* =========================================================
   DATE HELPERS
========================================================= */

const getClientAcquiredDate = (row) => {
  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    row?.dateClientAcquired ??
    row?.client_acquired_date ??
    row?.["Client Acquired Date"] ??
    row?.date_acquired ??
    row?.["Date Acquired"] ??
    null
  );
};

const parseDate = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));

    const date = new Date(
      excelEpoch.getTime() + value * 86400000
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const stringValue = String(value).trim();

  if (!stringValue) return null;

  let match = stringValue.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  match = stringValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const parsed = new Date(stringValue);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getFinancialYear = (row) => {
  const date = parseDate(getClientAcquiredDate(row));

  if (date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return month >= 4
      ? `${year}-${year + 1}`
      : `${year - 1}-${year}`;
  }

  const fallbackYear =
    row?.acquired_year ??
    row?.["Acquired Year"] ??
    row?.AquiredYear ??
    row?.["Aquired Year"] ??
    row?.aquired_year ??
    null;

  if (
    fallbackYear !== null &&
    fallbackYear !== undefined &&
    fallbackYear !== ""
  ) {
    const yearMatch = String(fallbackYear).match(/\d{4}/);

    if (yearMatch) {
      const year = Number(yearMatch[0]);
      return `${year}-${year + 1}`;
    }
  }

  return "";
};

const getMonth = (row) => {
  const date = parseDate(getClientAcquiredDate(row));
  return date ? date.getMonth() + 1 : "";
};

const getQuarter = (row) => {
  const month = Number(getMonth(row));

  const quarter = financialQuarters.find((item) =>
    item.months.includes(month)
  );

  return quarter?.name || "";
};

/* =========================================================
   FILTER HELPERS
========================================================= */

const matchesInfoFilter = (row, selectedInfoStatus) => {
  if (!selectedInfoStatus || selectedInfoStatus === "ALL") {
    return true;
  }

  return getInfoStatus(row) === selectedInfoStatus;
};

/* =========================================================
   FINANCIAL VALUES
========================================================= */

const getIndustryExpenditure = (row, percentage) => {
  const billing = getBilling(row);
  const numericPercentage = Number(percentage);

  if (
    !Number.isFinite(numericPercentage) ||
    numericPercentage < 0 ||
    numericPercentage > 100
  ) {
    return 0;
  }

  return billing * numericPercentage / 100;
};

const getFinancialValues = (
  row,
  selectedInfoStatus,
  expenditurePercentage
) => {
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);

  const expenditure = getIndustryExpenditure(
    row,
    expenditurePercentage
  );

  const status = getInfoStatus(row);

  if (!selectedInfoStatus || selectedInfoStatus === "ALL") {
    return {
      billing,
      franchiseeShare,
      expenditure,
      net: billing - franchiseeShare - expenditure
    };
  }

  if (selectedInfoStatus === "R") {
    if (status !== "R") {
      return {
        billing: 0,
        franchiseeShare: 0,
        expenditure: 0,
        net: 0
      };
    }

    return {
      billing,
      franchiseeShare,
      expenditure,
      net: billing - franchiseeShare - expenditure
    };
  }

  if (["RV", "C", "CN"].includes(selectedInfoStatus)) {
    if (status !== selectedInfoStatus) {
      return {
        billing: 0,
        franchiseeShare: 0,
        expenditure: 0,
        net: 0
      };
    }

    return {
      billing,
      franchiseeShare: 0,
      expenditure: 0,
      net: 0
    };
  }

  return {
    billing: 0,
    franchiseeShare: 0,
    expenditure: 0,
    net: 0
  };
};

/* =========================================================
   AGGREGATION HELPERS
========================================================= */

const createAggregate = (label, key) => ({
  industry: label,
  key,
  rows: [],
  companyNames: new Set(),
  franchiseNames: new Set(),
  totalEnquiries: 0,
  totalBilling: 0,
  totalFranchiseeShare: 0,
  totalExpenditure: 0,
  totalNet: 0
});

const addRowToAggregate = (
  item,
  row,
  infoStatus,
  expenditurePercentage
) => {
  const companyName = getCompanyName(row);
  const companyKey = normalizeCompanyKey(companyName);
  const franchiseName = getFranchiseName(row);

  const values = getFinancialValues(
    row,
    infoStatus,
    expenditurePercentage
  );

  item.rows.push(row);
  item.totalEnquiries += 1;

  if (companyKey) item.companyNames.add(companyKey);
  if (franchiseName) item.franchiseNames.add(franchiseName);

  item.totalBilling += values.billing;
  item.totalFranchiseeShare += values.franchiseeShare;
  item.totalExpenditure += values.expenditure;
  item.totalNet += values.net;
};

const finalizeAggregate = (item) => ({
  ...item,
  totalAcquiredClients: item.companyNames.size,
  totalFranchisees: item.franchiseNames.size
});

/* =========================================================
   TOOLTIP
========================================================= */

const IndustryTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="industry-modern-tooltip">
      <div className="industry-tooltip-label">
        Industry Performance
      </div>

      <div className="industry-tooltip-industry">
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          className="industry-tooltip-row"
          key={`${item.dataKey}-${index}`}
        >
          <span>{item.name}</span>

          <strong>
            {item.dataKey === "billing"
              ? formatCurrency(item.value)
              : formatNumber(item.value)}
          </strong>
        </div>
      ))}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const IndustryPerformance = () => {
  const {
    rows = [],
    loading,
    error
  } = useData();

  /* MAIN FILTER STATES */

  const [selectedIndustryFilter, setSelectedIndustryFilter] =
    useState("ALL");

  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState("ALL");

  const [selectedMonth, setSelectedMonth] =
    useState("ALL");

  const [selectedInfoStatus, setSelectedInfoStatus] =
    useState("ALL");

  const [industryExpenditurePercentage, setIndustryExpenditurePercentage] =
    useState("");

  const [viewReportAs, setViewReportAs] =
    useState("all-time");

  /* MODAL STATES */

  const [modalIndustry, setModalIndustry] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [reportFinancialYear, setReportFinancialYear] =
    useState("ALL");

  const [reportInfoStatus, setReportInfoStatus] =
    useState("ALL");

  const [reportMonth, setReportMonth] = useState("ALL");
  const [reportQuarter, setReportQuarter] = useState("ALL");

  const isIndividualIndustry =
    selectedIndustryFilter !== "ALL";

  // Monthly and Quarterly reports require a financial year selection.
  const isFinancialYearMissing =
    isIndividualIndustry &&
    (viewReportAs === "monthly" || viewReportAs === "quarterly") &&
    selectedFinancialYear === "ALL";

  /* FINANCIAL YEARS */

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach((row) => {
      const year = getFinancialYear(row);
      if (year) years.add(year);
    });

    return Array.from(years).sort((a, b) =>
      Number(a.split("-")[0]) - Number(b.split("-")[0])
    );
  }, [rows]);

  /* INDUSTRIES */

  const industries = useMemo(() => {
    const values = new Set();

    rows.forEach((row) => {
      const industry = getIndustry(row);
      if (industry) values.add(industry);
    });

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base"
      })
    );
  }, [rows]);

  /* EXPENDITURE VALIDATION */

  const hasIndustryExpenditure =
    industryExpenditurePercentage !== "" &&
    Number.isFinite(Number(industryExpenditurePercentage)) &&
    Number(industryExpenditurePercentage) >= 0 &&
    Number(industryExpenditurePercentage) <= 100;

  /* FILTERED MAIN ROWS */

  const filteredMainRows = useMemo(() => {
    return rows.filter((row) => {
      const industry = getIndustry(row);

      if (!industry) return false;

      if (
        selectedIndustryFilter !== "ALL" &&
        industry !== selectedIndustryFilter
      ) {
        return false;
      }

      if (
        selectedFinancialYear !== "ALL" &&
        getFinancialYear(row) !== selectedFinancialYear
      ) {
        return false;
      }

      if (
        selectedMonth !== "ALL" &&
        String(getMonth(row)) !== selectedMonth
      ) {
        return false;
      }

      return matchesInfoFilter(row, selectedInfoStatus);
    });
  }, [
    rows,
    selectedIndustryFilter,
    selectedFinancialYear,
    selectedMonth,
    selectedInfoStatus
  ]);

  /* ALL-TIME INDUSTRY DATA */

  const industryData = useMemo(() => {
    const grouped = {};

    filteredMainRows.forEach((row) => {
      const industry = getIndustry(row);

      if (!grouped[industry]) {
        grouped[industry] = createAggregate(industry, industry);
      }

      addRowToAggregate(
        grouped[industry],
        row,
        selectedInfoStatus,
        industryExpenditurePercentage
      );
    });

    return Object.values(grouped)
      .map(finalizeAggregate)
      .sort((a, b) => b.totalBilling - a.totalBilling);
  }, [
    filteredMainRows,
    selectedInfoStatus,
    industryExpenditurePercentage
  ]);

  /* PERIOD REPORT DATA */

  const reportTableData = useMemo(() => {
    if (
      !isIndividualIndustry ||
      viewReportAs === "all-time"
    ) {
      return industryData;
    }

    const grouped = {};

    filteredMainRows.forEach((row) => {
      const financialYear = getFinancialYear(row);
      const monthNumber = Number(getMonth(row));
      const quarter = getQuarter(row);

      let key = "";
      let label = "";

      if (viewReportAs === "yearly") {
        key = financialYear;
        label = `FY ${financialYear}`;
      }

      if (viewReportAs === "monthly") {
        const month = financialMonths.find(
          (item) => item.month === monthNumber
        );

        if (!month || !financialYear) return;

        key = `${financialYear}-${monthNumber}`;
        label = month.full;
      }

      if (viewReportAs === "quarterly") {
        if (!quarter || !financialYear) return;

        key = `${financialYear}-${quarter}`;
        label = quarter;
      }

      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = createAggregate(label, key);
        grouped[key].financialYear = financialYear;
        grouped[key].period = label;
      }

      addRowToAggregate(
        grouped[key],
        row,
        selectedInfoStatus,
        industryExpenditurePercentage
      );
    });

    return Object.values(grouped)
      .map(finalizeAggregate)
      .sort((a, b) => {
        const yearA = Number(a.financialYear.split("-")[0]);
        const yearB = Number(b.financialYear.split("-")[0]);

        if (yearA !== yearB) return yearA - yearB;

        if (viewReportAs === "monthly") {
          const monthA = Number(a.key.split("-")[1]);
          const monthB = Number(b.key.split("-")[1]);

          const order = [
            4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3
          ];

          return order.indexOf(monthA) - order.indexOf(monthB);
        }

        if (viewReportAs === "quarterly") {
          return (
            Number(a.key.split("Q")[1]) -
            Number(b.key.split("Q")[1])
          );
        }

        return 0;
      });
  }, [
    isIndividualIndustry,
    viewReportAs,
    industryData,
    filteredMainRows,
    selectedInfoStatus,
    industryExpenditurePercentage
  ]);

  const tableFirstColumnLabel = {
    "all-time": "Industry",
    yearly: "Financial Year",
    monthly: "Month",
    quarterly: "Quarter"
  }[viewReportAs];

  /* RESET FILTERS */

  const handleResetFilters = () => {
    setSelectedIndustryFilter("ALL");
    setSelectedFinancialYear("ALL");
    setSelectedMonth("ALL");
    setSelectedInfoStatus("ALL");
    setIndustryExpenditurePercentage("");
    setViewReportAs("all-time");
  };

  /* MODAL INDUSTRY ROWS */

  const selectedIndustryRows = useMemo(() => {
    if (!modalIndustry) return [];

    return rows.filter((row) => {
      if (getIndustry(row) !== modalIndustry) return false;

      if (
        reportFinancialYear !== "ALL" &&
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return false;
      }

      if (
        reportMonth !== "ALL" &&
        String(getMonth(row)) !== reportMonth
      ) {
        return false;
      }

      if (
        reportQuarter !== "ALL" &&
        getQuarter(row) !== reportQuarter
      ) {
        return false;
      }

      return matchesInfoFilter(row, reportInfoStatus);
    });
  }, [
    rows,
    modalIndustry,
    reportFinancialYear,
    reportMonth,
    reportQuarter,
    reportInfoStatus
  ]);

  /* MODAL SUMMARY */

  const modalSummary = useMemo(() => {
    const companySet = new Set();

    let totalBilling = 0;
    let totalExpenditure = 0;
    let totalNet = 0;
    let totalFranchiseeShare = 0;

    selectedIndustryRows.forEach((row) => {
      const companyKey = normalizeCompanyKey(getCompanyName(row));

      if (companyKey) companySet.add(companyKey);

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        industryExpenditurePercentage
      );

      totalBilling += values.billing;
      totalExpenditure += values.expenditure;
      totalNet += values.net;
      totalFranchiseeShare += values.franchiseeShare;
    });

    return {
      totalAcquiredClients: companySet.size,
      totalEnquiries: selectedIndustryRows.length,
      totalBilling,
      totalExpenditure,
      totalNet,
      totalFranchiseeShare
    };
  }, [
    selectedIndustryRows,
    reportInfoStatus,
    industryExpenditurePercentage
  ]);

  /* YEARLY PERFORMANCE */

  const yearlyPerformance = useMemo(() => {
    const grouped = {};

    selectedIndustryRows.forEach((row) => {
      const year = getFinancialYear(row);
      if (!year) return;

      if (!grouped[year]) {
        grouped[year] = {
          year,
          companyNames: new Set(),
          billing: 0
        };
      }

      const companyKey = normalizeCompanyKey(getCompanyName(row));

      if (companyKey) {
        grouped[year].companyNames.add(companyKey);
      }

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        industryExpenditurePercentage
      );

      grouped[year].billing += values.billing;
    });

    return Object.values(grouped)
      .sort(
        (a, b) =>
          Number(a.year.split("-")[0]) -
          Number(b.year.split("-")[0])
      )
      .map((item) => ({
        year: item.year,
        clients: item.companyNames.size,
        billing: item.billing
      }));
  }, [
    selectedIndustryRows,
    reportInfoStatus,
    industryExpenditurePercentage
  ]);

  /* MONTHLY PERFORMANCE */

  const monthlyPerformance = useMemo(() => {
    const grouped = financialMonths.map((month) => ({
      month: month.full,
      shortMonth: month.short,
      monthNumber: month.month,
      companyNames: new Set(),
      billing: 0
    }));

    selectedIndustryRows.forEach((row) => {
      const monthNumber = getMonth(row);

      const item = grouped.find(
        (month) => month.monthNumber === monthNumber
      );

      if (!item) return;

      const companyKey = normalizeCompanyKey(getCompanyName(row));

      if (companyKey) item.companyNames.add(companyKey);

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        industryExpenditurePercentage
      );

      item.billing += values.billing;
    });

    return grouped.map((item) => ({
      month: item.shortMonth,
      fullMonth: item.month,
      clients: item.companyNames.size,
      billing: item.billing
    }));
  }, [
    selectedIndustryRows,
    reportInfoStatus,
    industryExpenditurePercentage
  ]);

  /* SUB INDUSTRY PERFORMANCE */

  const subIndustryData = useMemo(() => {
    const grouped = {};

    selectedIndustryRows.forEach((row) => {
      const subIndustry = getSubIndustry(row) || "Not Specified";

      if (!grouped[subIndustry]) {
        grouped[subIndustry] = {
          name: subIndustry,
          companyNames: new Set(),
          enquiries: 0
        };
      }

      grouped[subIndustry].enquiries += 1;

      const companyKey = normalizeCompanyKey(getCompanyName(row));

      if (companyKey) {
        grouped[subIndustry].companyNames.add(companyKey);
      }
    });

    return Object.values(grouped)
      .map((item) => ({
        name: item.name,
        clients: item.companyNames.size,
        enquiries: item.enquiries
      }))
      .sort((a, b) => b.clients - a.clients);
  }, [selectedIndustryRows]);

  /* TOP TEAM LEADER */

  const topTeamLeader = useMemo(() => {
    const grouped = {};

    selectedIndustryRows.forEach((row) => {
      const leader = getTeamLeader(row) || "Not Assigned";

      if (!grouped[leader]) grouped[leader] = new Set();

      const companyKey = normalizeCompanyKey(getCompanyName(row));

      if (companyKey) grouped[leader].add(companyKey);
    });

    const result = Object.entries(grouped)
      .map(([name, companySet]) => ({
        name,
        clients: companySet.size
      }))
      .sort((a, b) => b.clients - a.clients);

    return result[0] || null;
  }, [selectedIndustryRows]);

  /* TOP BD MEMBER */

  const topBDMember = useMemo(() => {
    const grouped = {};

    selectedIndustryRows.forEach((row) => {
      const member = getBDMember(row) || "Not Assigned";

      if (!grouped[member]) grouped[member] = new Set();

      const companyKey = normalizeCompanyKey(getCompanyName(row));

      if (companyKey) grouped[member].add(companyKey);
    });

    const result = Object.entries(grouped)
      .map(([name, companySet]) => ({
        name,
        clients: companySet.size
      }))
      .sort((a, b) => b.clients - a.clients);

    return result[0] || null;
  }, [selectedIndustryRows]);

  /* MODAL CHART DATA */

  const reportIsMonthly = reportFinancialYear !== "ALL";

  const reportData = reportIsMonthly
    ? monthlyPerformance
    : yearlyPerformance;

  /* OPEN PERFORMANCE */

  const handleViewPerformance = (item) => {
    const industry =
      viewReportAs === "all-time"
        ? item.industry
        : selectedIndustryFilter;

    setModalIndustry(industry);
    setReportInfoStatus(selectedInfoStatus || "ALL");
    setReportMonth("ALL");
    setReportQuarter("ALL");

    if (viewReportAs === "yearly") {
      setReportFinancialYear(item.financialYear || item.key);
    } else if (viewReportAs === "monthly") {
      setReportFinancialYear(item.financialYear || "ALL");

      const month = financialMonths.find(
        (entry) => entry.full === item.industry
      );

      setReportMonth(month ? String(month.month) : "ALL");
    } else if (viewReportAs === "quarterly") {
      setReportFinancialYear(item.financialYear || "ALL");
      setReportQuarter(item.industry);
    } else {
      setReportFinancialYear(selectedFinancialYear || "ALL");
    }

    setShowModal(true);
  };

  /* CLOSE PERFORMANCE */

  const handleClosePerformance = () => {
    setShowModal(false);
    setModalIndustry("");
    setReportMonth("ALL");
    setReportQuarter("ALL");
  };

  /* ESCAPE KEY */

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClosePerformance();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  /* LOADING */

  if (loading) {
    return (
      <div className="industry-performance-page">
        <div className="industry-empty">
          Loading industry performance...
        </div>
      </div>
    );
  }

  /* ERROR */

  if (error) {
    return (
      <div className="industry-performance-page">
        <div className="industry-empty">
          Unable to load industry performance data.
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="industry-performance-page">

      <div className="industry-page-header">
        <div>
          <div className="industry-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>Industry Performance</h1>

          <p>
            Compare acquired clients, enquiries and billing
            performance across industries.
          </p>
        </div>
      </div>

      <div className="industry-table-card">

        <div className="industry-table-header">
          <div>
            <h2>Industry Performance</h2>

            <span className="industry-count">
              {isFinancialYearMissing ? 0 : reportTableData.length}{" "}
              {(isFinancialYearMissing ? 0 : reportTableData.length) === 1
                ? "record"
                : "records"}
            </span>
          </div>
        </div>

        {/* FILTER SECTION */}

        <div className="industry-performance-filters">

          {/* 1. INDUSTRY FILTER */}

          <div className="industry-filter-group">
            <label>Industry</label>

            <select
              value={selectedIndustryFilter}
              onChange={(event) => {
                setSelectedIndustryFilter(event.target.value);
                setViewReportAs("all-time");
              }}
            >
              <option value="ALL">All Industries</option>

              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* 2. VIEW REPORT AS - IMMEDIATELY AFTER INDUSTRY */}

          {isIndividualIndustry && (
            <div className="industry-filter-group">
              <label>View Report As</label>

              <select
                value={viewReportAs}
                onChange={(event) =>
                  setViewReportAs(event.target.value)
                }
              >
                <option value="all-time">All Time</option>
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          )}

          {/* 3. FINANCIAL YEAR FILTER */}

          <div className="industry-filter-group">
            <label>Financial Year</label>

            <select
              value={selectedFinancialYear}
              onChange={(event) =>
                setSelectedFinancialYear(event.target.value)
              }
            >
              <option value="ALL">All Financial Years</option>

              {financialYears.map((year) => (
                <option key={year} value={year}>
                  FY {year}
                </option>
              ))}
            </select>
          </div>

          {/* 4. MONTH FILTER */}

          <div className="industry-filter-group">
            <label>Month</label>

            <select
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
            >
              <option value="ALL">All Months</option>

              {financialMonths.map((month) => (
                <option
                  key={month.month}
                  value={String(month.month)}
                >
                  {month.full}
                </option>
              ))}
            </select>
          </div>

          {/* 5. INFO STATUS FILTER */}

          <div className="industry-filter-group">
            <label>Info Status</label>

            <select
              value={selectedInfoStatus}
              onChange={(event) =>
                setSelectedInfoStatus(event.target.value)
              }
            >
              <option value="ALL">All</option>
              <option value="R">R</option>
              <option value="RV">RV</option>
              <option value="C">C</option>
              <option value="CN">CN</option>
            </select>
          </div>

          {/* 6. INDUSTRY EXPENDITURE */}

          <div className="industry-filter-group">
            <label>Industry Expenditure %</label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={industryExpenditurePercentage}
              placeholder="0 - 100"
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  setIndustryExpenditurePercentage("");
                  return;
                }

                const number = Number(value);

                if (
                  Number.isFinite(number) &&
                  number >= 0 &&
                  number <= 100
                ) {
                  setIndustryExpenditurePercentage(value);
                }
              }}
            />
          </div>

          {/* 7. RESET FILTERS */}

          <div className="industry-filter-group industry-reset-filter-group">
            <button
              type="button"
              className="industry-reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>

        </div>

        {/* SELECTED INDUSTRY HEADING */}

        {isIndividualIndustry && (
          <div className="industry-selected-heading">
            <div className="industry-selected-heading-content">
              <span className="industry-member-label">
                INDUSTRY
              </span>

              <h2>{selectedIndustryFilter}</h2>

              <p>
                {viewReportAs === "all-time"
                  ? "All Time Performance Report"
                  : `${viewReportAs.charAt(0).toUpperCase()}${viewReportAs.slice(1)} Performance Report`}
              </p>
            </div>
          </div>
        )}

        {/* MAIN TABLE */}

        <div className="industry-table-wrapper">
          <table className="industry-table">

            <thead>
              <tr>
                <th>{tableFirstColumnLabel}</th>
                <th>Total Acquired Client</th>
                <th>Total Enquiries</th>
                <th>No. of Franchisee</th>
                <th>Total Billing</th>
                <th>Net Amount</th>

                {hasIndustryExpenditure && (
                  <th>Industry Expenditure</th>
                )}

                <th>Performance</th>
              </tr>
            </thead>

            <tbody>
              {isFinancialYearMissing ? (
                <tr>
                  <td
                    colSpan={hasIndustryExpenditure ? 8 : 7}
                    className="industry-empty industry-financial-year-table-message"
                    role="alert"
                  >
                    Please select the financial year first.
                  </td>
                </tr>
              ) : reportTableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasIndustryExpenditure ? 8 : 7}
                    className="industry-empty"
                  >
                    No industry data found for the selected filters.
                  </td>
                </tr>
              ) : (
                reportTableData.map((item) => {
                  const isAllTime = viewReportAs === "all-time";
                  const rowLabel = item.industry;

                  const initial = String(rowLabel)
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <tr key={item.key || item.industry}>
                      <td>
                        {isAllTime ? (
                          <div className="industry-name">
                            <div className="industry-avatar">
                              {initial}
                            </div>

                            <span>{rowLabel}</span>
                          </div>
                        ) : (
                          <span className="industry-client-count">
                            {rowLabel}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="industry-client-count">
                          {formatNumber(item.totalAcquiredClients)}
                        </span>
                      </td>

                      <td>
                        {formatNumber(item.totalEnquiries)}
                      </td>

                      <td>
                        {formatNumber(item.totalFranchisees)}
                      </td>

                      <td>
                        <span className="industry-billing-value">
                          {formatCurrency(item.totalBilling)}
                        </span>
                      </td>

                      <td>
                        <span className="industry-net-value">
                          {formatCurrency(item.totalNet)}
                        </span>
                      </td>

                      {hasIndustryExpenditure && (
                        <td>
                          <span className="industry-net-value">
                            {formatCurrency(item.totalExpenditure)}
                          </span>
                        </td>
                      )}

                      <td>
                        <button
                          type="button"
                          className="industry-view-performance-btn"
                          onClick={() => handleViewPerformance(item)}
                        >
                          View Performance

                          <span className="industry-view-arrow">
                            →
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

      </div>

      {/* PERFORMANCE MODAL */}

      {showModal && modalIndustry && (
        <div
          className="industry-performance-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClosePerformance();
            }
          }}
        >
          <div
            className="industry-performance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="industry-performance-title"
          >

            <div className="industry-modal-header">
              <div>
                <div className="industry-modal-eyebrow">
                  INDUSTRY PERFORMANCE
                </div>

                <h2 id="industry-performance-title">
                  {modalIndustry}
                </h2>

                <p>
                  Detailed performance report for the selected industry.
                </p>
              </div>

              <button
                type="button"
                className="industry-modal-close"
                onClick={handleClosePerformance}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* SUMMARY CARDS */}

            <div className="industry-summary-grid">

              <div className="industry-summary-card">
                <span className="industry-summary-label">
                  Total Acquired Client
                </span>

                <span className="industry-summary-value">
                  {formatNumber(modalSummary.totalAcquiredClients)}
                </span>
              </div>

              <div className="industry-summary-card industry-enquiry-card">
                <span className="industry-summary-label">
                  Total Enquiries
                </span>

                <span className="industry-summary-value">
                  {formatNumber(modalSummary.totalEnquiries)}
                </span>
              </div>

              <div className="industry-summary-card industry-share-card">
                <span className="industry-summary-label">
                  Total Billing
                </span>

                <span className="industry-summary-value">
                  {formatCurrency(modalSummary.totalBilling)}
                </span>
              </div>

              <div className="industry-summary-card industry-net-card">
                <span className="industry-summary-label">
                  Net Amount
                </span>

                <span className="industry-summary-value">
                  {formatCurrency(modalSummary.totalNet)}
                </span>
              </div>

              {hasIndustryExpenditure && (
                <div className="industry-summary-card">
                  <span className="industry-summary-label">
                    Industry Expenditure
                  </span>

                  <span className="industry-summary-value">
                    {formatCurrency(modalSummary.totalExpenditure)}
                  </span>
                </div>
              )}

              <div className="industry-summary-card">
                <span className="industry-summary-label">
                  Top Team Leader
                </span>

                <span className="industry-summary-text">
                  {topTeamLeader
                    ? topTeamLeader.name
                    : "Not Available"}
                </span>

                {topTeamLeader && (
                  <span className="industry-summary-count">
                    {formatNumber(topTeamLeader.clients)} unique clients
                  </span>
                )}
              </div>

              <div className="industry-summary-card">
                <span className="industry-summary-label">
                  Top BD Member
                </span>

                <span className="industry-summary-text">
                  {topBDMember
                    ? topBDMember.name
                    : "Not Available"}
                </span>

                {topBDMember && (
                  <span className="industry-summary-count">
                    {formatNumber(topBDMember.clients)} unique clients
                  </span>
                )}
              </div>

            </div>

            {/* MODAL FILTERS */}

            <div className="industry-report-controls">

              <div className="industry-report-period">
                <label>Report Financial Year</label>

                <select
                  value={reportFinancialYear}
                  onChange={(event) => {
                    setReportFinancialYear(event.target.value);
                    setReportMonth("ALL");
                    setReportQuarter("ALL");
                  }}
                >
                  <option value="ALL">All Financial Years</option>

                  {financialYears.map((year) => (
                    <option key={year} value={year}>
                      FY {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="industry-report-period">
                <label>Report Info Status</label>

                <select
                  value={reportInfoStatus}
                  onChange={(event) =>
                    setReportInfoStatus(event.target.value)
                  }
                >
                  <option value="ALL">All</option>
                  <option value="R">R</option>
                  <option value="RV">RV</option>
                  <option value="C">C</option>
                  <option value="CN">CN</option>
                </select>
              </div>

              <div className="industry-report-period">
                <span>Report Period</span>

                <strong>
                  {reportFinancialYear === "ALL"
                    ? "Yearly"
                    : `FY ${reportFinancialYear} — Monthly`}
                </strong>
              </div>

            </div>

            {/* CHARTS */}

            <div className="industry-report-graphs">

              <div className="industry-chart-card">
                <div className="industry-chart-heading">
                  <div>
                    <span className="industry-chart-indicator industry-client-indicator" />

                    <h3>
                      {reportIsMonthly
                        ? "Monthly Client Acquisition"
                        : "Yearly Client Acquisition"}
                    </h3>
                  </div>

                  <span>Unique companies</span>
                </div>

                <div className="industry-chart-container">
                  {reportData.length === 0 ? (
                    <div className="industry-no-chart-data">
                      No client data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData}
                        margin={{
                          top: 10,
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
                          dataKey={reportIsMonthly ? "month" : "year"}
                        />

                        <YAxis allowDecimals={false} />

                        <Tooltip content={<IndustryTooltip />} />

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

              <div className="industry-chart-card">
                <div className="industry-chart-heading">
                  <div>
                    <span className="industry-chart-indicator industry-billing-indicator" />

                    <h3>
                      {reportIsMonthly
                        ? "Monthly Billing Performance"
                        : "Yearly Billing Performance"}
                    </h3>
                  </div>

                  <span>Total billing</span>
                </div>

                <div className="industry-chart-container">
                  {reportData.length === 0 ? (
                    <div className="industry-no-chart-data">
                      No billing data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData}
                        margin={{
                          top: 10,
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
                          dataKey={reportIsMonthly ? "month" : "year"}
                        />

                        <YAxis
                          tickFormatter={(value) =>
                            `₹${(value / 1000).toFixed(0)}k`
                          }
                        />

                        <Tooltip content={<IndustryTooltip />} />

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

            {/* SUB INDUSTRY PERFORMANCE */}

            {subIndustryData.length > 0 && (
              <div
                className="industry-summary-grid"
                style={{ paddingTop: 0 }}
              >
                <div
                  className="industry-summary-card industry-top-industry-card"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <span className="industry-summary-label">
                    Sub Industry Performance
                  </span>

                  <div className="industry-sub-industry-list">
                    {subIndustryData.map((item) => (
                      <span
                        className="industry-sub-industry-tag"
                        key={item.name}
                      >
                        {item.name}

                        <small>
                          {formatNumber(item.clients)}
                        </small>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}

            <div className="industry-modal-footer">
              <span>
                {modalIndustry}
                {" · "}
                {reportFinancialYear === "ALL"
                  ? "All Financial Years"
                  : `FY ${reportFinancialYear}`}
                {" · "}
                {reportMonth === "ALL"
                  ? "All Months"
                  : financialMonths.find(
                      (month) => String(month.month) === reportMonth
                    )?.full}
                {" · "}
                {reportQuarter === "ALL"
                  ? "All Quarters"
                  : reportQuarter}
                {" · "}
                {reportInfoStatus === "ALL"
                  ? "All Info Status"
                  : reportInfoStatus}
                {" · "}
                {formatNumber(modalSummary.totalAcquiredClients)} unique clients
                {" · "}
                {formatNumber(modalSummary.totalEnquiries)} enquiries
              </span>

              <button
                type="button"
                className="industry-footer-close"
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

export default IndustryPerformance;