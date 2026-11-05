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

const financialMonthNumbers = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(toNumber(value));
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
  ).trim().toUpperCase();
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

function getBDExpenditure(row, percentage) {
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
========================================================= */

function parseDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  const isoMatch = stringValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(stringValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

/* =========================================================
   GET FINANCIAL YEAR
========================================================= */

function getFinancialYear(row) {
  const dateValue = getClientAcquiredDate(row);
  const date = parseDate(dateValue);

  if (date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (month >= 4) {
      return `${year}-${String(year + 1).slice(-2)}`;
    }

    return `${year - 1}-${String(year).slice(-2)}`;
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
    const year = Number(acquiredYear);

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
   GET MONTH
========================================================= */

function getMonth(row) {
  const dateValue = getClientAcquiredDate(row);
  const date = parseDate(dateValue);

  if (!date) {
    return "";
  }

  return date.getMonth() + 1;
}

/* =========================================================
   BD FINANCIAL CALCULATION
========================================================= */

function getFinancialValues(
  row,
  infoFilter = "",
  percentage
) {
  const info = getInfoStatus(row);
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);

  if (!infoFilter || infoFilter === "ALL") {
    return {
      billing,
      netAmount: billing - franchiseeShare,
      bdExpenditure: getBDExpenditure(row, percentage)
    };
  }

  if (infoFilter === "R") {
    if (info !== "R") {
      return {
        billing: 0,
        netAmount: 0,
        bdExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: billing - franchiseeShare,
      bdExpenditure: getBDExpenditure(row, percentage)
    };
  }

  if (infoFilter === "RV") {
    if (info !== "RV") {
      return {
        billing: 0,
        netAmount: 0,
        bdExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      bdExpenditure: 0
    };
  }

  if (infoFilter === "C") {
    if (info !== "C") {
      return {
        billing: 0,
        netAmount: 0,
        bdExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      bdExpenditure: 0
    };
  }

  if (infoFilter === "CN") {
    if (info !== "CN") {
      return {
        billing: 0,
        netAmount: 0,
        bdExpenditure: 0
      };
    }

    return {
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

      {payload.map((item, index) => (
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
      ))}
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
     MAIN TABLE FILTER STATE
  ======================================================= */

  const [
    selectedBDMember,
    setSelectedBDMember
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");

  const [
    selectedMonth,
    setSelectedMonth
  ] = useState("");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("");

  // ALL_TIME | YEARLY | MONTHLY | QUARTERLY
  const [
    selectedReportView,
    setSelectedReportView
  ] = useState("ALL_TIME");

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

  // ALL | COUNT | REVENUE
  const [
    displayFilter,
    setDisplayFilter
  ] = useState("ALL");

  const hasBDExpenditurePercentage =
    bdExpenditurePercentage !== "" &&
    bdExpenditurePercentage !== null &&
    bdExpenditurePercentage !== undefined &&
    Number.isFinite(Number(bdExpenditurePercentage)) &&
    Number(bdExpenditurePercentage) >= 0;

  const showCountColumns =
    displayFilter === "ALL" || displayFilter === "COUNT";

  const showRevenueColumns =
    displayFilter === "ALL" || displayFilter === "REVENUE";

  const tableColumnCount =
    2 +
    (showCountColumns ? 3 : 0) +
    (showRevenueColumns ? 2 + (hasBDExpenditurePercentage ? 1 : 0) : 0);

  /* =======================================================
     BD MEMBER OPTIONS
  ======================================================= */

  const bdMembers = useMemo(() => {
    const members = new Map();

    rows.forEach(row => {
      const member = getBDMember(row);

      if (!member) {
        return;
      }

      const key = normalizeKey(member);

      if (!members.has(key)) {
        members.set(key, member);
      }
    });

    return Array.from(members.values())
      .sort((a, b) => a.localeCompare(b));
  }, [rows]);

  /* =======================================================
     FINANCIAL YEAR OPTIONS
  ======================================================= */

  const financialYears = useMemo(() => {
    const years = new Set();

    rows.forEach(row => {
      const year = getFinancialYear(row);

      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => {
      const yearA = Number(String(a).slice(0, 4));
      const yearB = Number(String(b).slice(0, 4));

      return yearA - yearB;
    });
  }, [rows]);

  /* =======================================================
     MAIN TABLE MONTH OPTIONS
  ======================================================= */

  const availableMonths = useMemo(() => {
    const monthSet = new Set();

    rows.forEach(row => {
      if (
        selectedFinancialYear &&
        getFinancialYear(row) !== selectedFinancialYear
      ) {
        return;
      }

      const month = getMonth(row);

      if (month !== "") {
        monthSet.add(month);
      }
    });

    return financialMonthNumbers
      .filter(month => monthSet.has(month))
      .map(monthNumber => {
        const monthIndex = financialMonthNumbers.indexOf(monthNumber);

        return {
          value: String(monthNumber),
          label: financialMonths[monthIndex].full
        };
      });
  }, [
    rows,
    selectedFinancialYear
  ]);

  /* =======================================================
     MAIN TABLE MEMBER SUMMARY
  ======================================================= */

  const memberData = useMemo(() => {
    const map = new Map();

    rows.forEach(row => {
      const member = getBDMember(row);

      if (!member) {
        return;
      }

      if (
        selectedBDMember &&
        normalizeKey(member) !== normalizeKey(selectedBDMember)
      ) {
        return;
      }

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !== selectedFinancialYear
      ) {
        return;
      }

      if (
        selectedMonth &&
        String(getMonth(row)) !== selectedMonth
      ) {
        return;
      }

      const info = getInfoStatus(row);

      if (
        selectedInfoStatus &&
        selectedInfoStatus !== "ALL" &&
        info !== selectedInfoStatus
      ) {
        return;
      }

      const financialValues = getFinancialValues(
        row,
        selectedInfoStatus,
        bdExpenditurePercentage
      );

      if (!map.has(member)) {
        map.set(member, {
          member,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        });
      }

      const data = map.get(member);

      const companyName = getCompanyName(row);
      const companyKey = normalizeKey(companyName);

      if (companyKey) {
        data.clients.add(companyKey);
      }

      data.enquiries += 1;

      const franchiseName = getFranchiseName(row);
      const franchiseKey = normalizeKey(franchiseName);

      if (franchiseKey) {
        data.franchisees.add(franchiseKey);
      }

      data.billing += financialValues.billing;
      data.netAmount += financialValues.netAmount;
      data.bdExpenditure += financialValues.bdExpenditure;
    });

    return Array.from(map.values())
      .filter(item => item.enquiries > 0)
      .map(item => ({
        ...item,
        clients: item.clients.size,
        franchisees: item.franchisees.size
      }))
      .sort((a, b) => {
        if (b.clients !== a.clients) {
          return b.clients - a.clients;
        }

        return a.member.localeCompare(b.member);
      });
  }, [
    rows,
    selectedBDMember,
    selectedFinancialYear,
    selectedMonth,
    selectedInfoStatus,
    bdExpenditurePercentage
  ]);

  /* =======================================================
     SELECTED BD MEMBER PERIOD DATA
  ======================================================= */

  const periodMemberData = useMemo(() => {
    if (
      !selectedBDMember ||
      selectedReportView === "ALL_TIME"
    ) {
      return [];
    }

    if (
      (selectedReportView === "MONTHLY" ||
        selectedReportView === "QUARTERLY") &&
      !selectedFinancialYear
    ) {
      return [];
    }

    const map = new Map();

    rows.forEach(row => {
      const member = getBDMember(row);

      if (
        normalizeKey(member) !== normalizeKey(selectedBDMember)
      ) {
        return;
      }

      const financialYear = getFinancialYear(row);

      if (!financialYear) {
        return;
      }

      if (
        selectedReportView === "MONTHLY" ||
        selectedReportView === "QUARTERLY"
      ) {
        if (financialYear !== selectedFinancialYear) {
          return;
        }
      }

      const info = getInfoStatus(row);

      if (
        selectedInfoStatus &&
        selectedInfoStatus !== "ALL" &&
        info !== selectedInfoStatus
      ) {
        return;
      }

      const month = getMonth(row);

      let period = "";
      let periodOrder = 0;

      if (selectedReportView === "YEARLY") {
        period = financialYear;
        periodOrder = Number(financialYear.slice(0, 4));
      }

      if (selectedReportView === "MONTHLY") {
        if (month === "") {
          return;
        }

        const monthIndex = financialMonthNumbers.indexOf(month);

        if (monthIndex === -1) {
          return;
        }

        period = financialMonths[monthIndex].full;
        periodOrder = monthIndex;
      }

      if (selectedReportView === "QUARTERLY") {
        if (month === "") {
          return;
        }

        const monthIndex = financialMonthNumbers.indexOf(month);

        if (monthIndex === -1) {
          return;
        }

        const quarterNumber = Math.floor(monthIndex / 3) + 1;

        const quarterLabels = [
          "Q1 (Apr-Jun)",
          "Q2 (Jul-Sep)",
          "Q3 (Oct-Dec)",
          "Q4 (Jan-Mar)"
        ];

        period = quarterLabels[quarterNumber - 1];
        periodOrder = quarterNumber - 1;
      }

      if (!period) {
        return;
      }

      const financialValues = getFinancialValues(
        row,
        selectedInfoStatus,
        bdExpenditurePercentage
      );

      if (!map.has(period)) {
        map.set(period, {
          member,
          period,
          periodOrder,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        });
      }

      const data = map.get(period);

      const companyKey = normalizeKey(getCompanyName(row));

      if (companyKey) {
        data.clients.add(companyKey);
      }

      data.enquiries += 1;

      const franchiseKey = normalizeKey(getFranchiseName(row));

      if (franchiseKey) {
        data.franchisees.add(franchiseKey);
      }

      data.billing += financialValues.billing;
      data.netAmount += financialValues.netAmount;
      data.bdExpenditure += financialValues.bdExpenditure;
    });

    return Array.from(map.values())
      .map(item => ({
        ...item,
        clients: item.clients.size,
        franchisees: item.franchisees.size
      }))
      .sort((a, b) => a.periodOrder - b.periodOrder);
  }, [
    rows,
    selectedBDMember,
    selectedReportView,
    selectedFinancialYear,
    selectedInfoStatus,
    bdExpenditurePercentage
  ]);

  /* =======================================================
     DETERMINE TABLE VIEW
  ======================================================= */

  const isPeriodView =
    Boolean(selectedBDMember) &&
    selectedReportView !== "ALL_TIME";

  const needsFinancialYear =
    isPeriodView &&
    (
      selectedReportView === "MONTHLY" ||
      selectedReportView === "QUARTERLY"
    );

  const displayedMemberData = isPeriodView
    ? periodMemberData
    : memberData;

  /* =======================================================
     SELECTED MEMBER HEADING SUBTITLE
  ======================================================= */

  const memberReportSubtitle = {
    YEARLY: "Yearly Performance Report",
    MONTHLY: "Monthly Performance Report",
    QUARTERLY: "Quarterly Performance Report"
  }[selectedReportView] || "Performance Report";

  /* =======================================================
     SELECTED MEMBER ROWS FOR MODAL
  ======================================================= */

  const selectedRows = useMemo(() => {
    if (!selectedMember) {
      return [];
    }

    return rows.filter(row => {
      if (
        normalizeKey(getBDMember(row)) !==
        normalizeKey(selectedMember)
      ) {
        return false;
      }

      if (
        reportFinancialYear &&
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return false;
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
    selectedMember,
    reportFinancialYear,
    reportInfoStatus
  ]);

  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary = useMemo(() => {
    let totalBilling = 0;
    let totalFranchiseeShare = 0;
    let totalBDExpenditure = 0;
    let netAmount = 0;

    selectedRows.forEach(row => {
      const values = getFinancialValues(
        row,
        reportInfoStatus,
        bdExpenditurePercentage
      );

      totalBilling += values.billing;

      if (
        !reportInfoStatus ||
        reportInfoStatus === "R"
      ) {
        totalFranchiseeShare += getFranchiseeShare(row);
      }

      totalBDExpenditure += values.bdExpenditure;
      netAmount += values.netAmount;
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
  ======================================================= */

  const bestIndustry = useMemo(() => {
    const industryCompanies = new Map();

    selectedRows.forEach(row => {
      const industry = getIndustry(row);
      const company = normalizeKey(getCompanyName(row));

      if (!industry || !company) {
        return;
      }

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
  }, [
    selectedRows
  ]);

  /* =======================================================
     BEST CITY
  ======================================================= */

  const bestCity = useMemo(() => {
    const cityCompanies = new Map();

    selectedRows.forEach(row => {
      const city = getCity(row);
      const company = normalizeKey(getCompanyName(row));

      if (!city || !company) {
        return;
      }

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
  }, [
    selectedRows
  ]);

  /* =======================================================
     YEARLY REPORT
  ======================================================= */

  const yearlyReportData = useMemo(() => {
    const map = new Map();

    selectedRows.forEach(row => {
      const year = getFinancialYear(row);

      if (!year) {
        return;
      }

      if (!map.has(year)) {
        map.set(year, {
          year,
          clients: new Set(),
          billing: 0
        });
      }

      const data = map.get(year);
      const company = normalizeKey(getCompanyName(row));

      if (company) {
        data.clients.add(company);
      }

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        bdExpenditurePercentage
      );

      data.billing += values.billing;
    });

    return Array.from(map.values())
      .map(item => ({
        year: item.year,
        clients: item.clients.size,
        billing: item.billing
      }))
      .sort((a, b) => {
        const yearA = Number(String(a.year).slice(0, 4));
        const yearB = Number(String(b.year).slice(0, 4));

        return yearA - yearB;
      });
  }, [
    selectedRows,
    reportInfoStatus,
    bdExpenditurePercentage
  ]);

  /* =======================================================
     MONTHLY REPORT
  ======================================================= */

  const monthlyReportData = useMemo(() => {
    if (!reportFinancialYear) {
      return [];
    }

    const monthMap = new Map();

    financialMonths.forEach((month, index) => {
      const calendarMonth = financialMonthNumbers[index];

      monthMap.set(calendarMonth, {
        month: month.full,
        monthShort: month.short,
        clients: new Set(),
        billing: 0
      });
    });

    selectedRows.forEach(row => {
      const year = getFinancialYear(row);

      if (year !== reportFinancialYear) {
        return;
      }

      const month = getMonth(row);

      if (!monthMap.has(month)) {
        return;
      }

      const data = monthMap.get(month);
      const company = normalizeKey(getCompanyName(row));

      if (company) {
        data.clients.add(company);
      }

      const values = getFinancialValues(
        row,
        reportInfoStatus,
        bdExpenditurePercentage
      );

      data.billing += values.billing;
    });

    return financialMonthNumbers.map(month => {
      const data = monthMap.get(month);

      return {
        month: data.month,
        monthShort: data.monthShort,
        clients: data.clients.size,
        billing: data.billing
      };
    });
  }, [
    selectedRows,
    reportFinancialYear,
    reportInfoStatus,
    bdExpenditurePercentage
  ]);

  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData = reportFinancialYear
    ? monthlyReportData
    : yearlyReportData;

  /* =======================================================
     OPEN PERFORMANCE
  ======================================================= */

  function handleViewPerformance(member) {
    setSelectedMember(member);
    setReportFinancialYear(selectedFinancialYear);
    setReportInfoStatus(selectedInfoStatus);
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
     RESET MAIN FILTERS
  ======================================================= */

  function handleResetFilters() {
    setSelectedBDMember("");
    setSelectedFinancialYear("");
    setSelectedMonth("");
    setSelectedInfoStatus("");
    setSelectedReportView("ALL_TIME");
    setBdExpenditurePercentage("");
    setDisplayFilter("ALL");
  }

  /* =======================================================
     GET TABLE DESCRIPTION
  ======================================================= */

  const tableDescription = (() => {
    if (!selectedBDMember) {
      return "Complete BD member-wise performance overview";
    }

    if (selectedReportView === "ALL_TIME") {
      return `All-time performance overview for ${selectedBDMember}`;
    }

    if (selectedReportView === "YEARLY") {
      return `Financial-year-wise performance for ${selectedBDMember}`;
    }

    if (selectedReportView === "MONTHLY") {
      return `Monthly performance for ${selectedBDMember}`;
    }

    if (selectedReportView === "QUARTERLY") {
      return `Quarterly performance for ${selectedBDMember}`;
    }

    return "BD member performance overview";
  })();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="bd-performance-page">
      {/* PAGE HEADER */}

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

      {/* MAIN TABLE CARD */}

      <div className="bd-table-card">
        {/* TABLE HEADER */}

        <div className="bd-table-header">
          <div>
            <h2>
              BD Member Performance
            </h2>

            <p>
              {tableDescription}
            </p>
          </div>

          <div className="bd-member-count">
            {displayedMemberData.length}

            <span>
              {isPeriodView ? "Periods" : "BD Members"}
            </span>
          </div>
        </div>

        {/* MAIN FILTERS */}

        <div className="bd-performance-filters">
          {/* 1. BD MEMBER */}

          <div className="bd-filter-group">
            <label htmlFor="bd-member-filter">
              BD Member
            </label>

            <select
              id="bd-member-filter"
              value={selectedBDMember}
              onChange={event => {
                setSelectedBDMember(event.target.value);
              }}
            >
              <option value="">
                All BD Members
              </option>

              {bdMembers.map(member => (
                <option
                  key={member}
                  value={member}
                >
                  {member}
                </option>
              ))}
            </select>
          </div>

          {/* 2. VIEW REPORT AS */}

          {selectedBDMember && (
            <div className="bd-filter-group">
              <label htmlFor="bd-report-view">
                View Report As
              </label>

              <select
                id="bd-report-view"
                value={selectedReportView}
                onChange={event => {
                  setSelectedReportView(event.target.value);
                  setSelectedMonth("");
                }}
              >
                <option value="ALL_TIME">
                  All Time
                </option>

                <option value="YEARLY">
                  Yearly
                </option>

                <option value="MONTHLY">
                  Monthly
                </option>

                <option value="QUARTERLY">
                  Quarterly
                </option>
              </select>
            </div>
          )}

          {/* 3. FINANCIAL YEAR */}

          <div className="bd-filter-group">
            <label htmlFor="bd-main-financial-year">
              Financial Year
            </label>

            <select
              id="bd-main-financial-year"
              value={selectedFinancialYear}
              onChange={event => {
                setSelectedFinancialYear(event.target.value);
                setSelectedMonth("");
              }}
            >
              <option value="">
                All Financial Years
              </option>

              {financialYears.map(year => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* 4. MONTH */}

          <div className="bd-filter-group">
            <label htmlFor="bd-main-month">
              Month
            </label>

            <select
              id="bd-main-month"
              value={selectedMonth}
              disabled={isPeriodView}
              onChange={event => {
                setSelectedMonth(event.target.value);
              }}
            >
              <option value="">
                All Months
              </option>

              {availableMonths.map(month => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. INFO STATUS */}

          <div className="bd-filter-group">
            <label htmlFor="bd-main-info-status">
              Info Status
            </label>

            <select
              id="bd-main-info-status"
              value={selectedInfoStatus}
              onChange={event => {
                setSelectedInfoStatus(event.target.value);
              }}
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

          {/* 6. BD EXPENDITURE */}

          <div className="bd-filter-group">
            <label htmlFor="bd-expenditure-percentage">
              BD Expenditure %
            </label>

            <input
              id="bd-expenditure-percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={bdExpenditurePercentage}
              placeholder="Enter %"
              onChange={event => {
                const value = event.target.value;

                if (value === "") {
                  setBdExpenditurePercentage("");
                  return;
                }

                const number = Number(value);

                if (
                  Number.isFinite(number) &&
                  number >= 0 &&
                  number <= 100
                ) {
                  setBdExpenditurePercentage(value);
                }
              }}
            />
          </div>

          {/* 7. VIEW AS */}

          <div className="bd-filter-group">
            <label htmlFor="bd-view-as">
              View As
            </label>

            <select
              id="bd-view-as"
              value={displayFilter}
              onChange={event => {
                setDisplayFilter(event.target.value);
              }}
            >
              <option value="ALL">All</option>
              <option value="COUNT">Count</option>
              <option value="REVENUE">Revenue</option>
            </select>
          </div>

          {/* RESET FILTERS */}

          <div className="bd-filter-group bd-reset-filter-group">
            <label>
              &nbsp;
            </label>

            <button
              type="button"
              className="bd-reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* SELECTED MEMBER HEADING
            VISIBLE ONLY FOR YEARLY, MONTHLY AND QUARTERLY */}

        {selectedBDMember && selectedReportView !== "ALL_TIME" && (
          <div className="bd-selected-member-heading">
            <span className="bd-member-label">
              BD MEMBER
            </span>

            <h3>
              {selectedBDMember}
            </h3>

            <p>
              {memberReportSubtitle}
            </p>
          </div>
        )}

        {/* TABLE */}

        <div className="bd-table-wrapper">
          <table className="bd-performance-table">
            <thead>
              <tr>
                <th>
                  {isPeriodView ? "Period" : "BD Member"}
                </th>

                {showCountColumns && (
                  <>
                    <th>Total Acquired Client</th>
                    <th>Total Enquiries</th>
                    <th>No. of Franchisee</th>
                  </>
                )}

                {showRevenueColumns && (
                  <>
                    <th>Total Billing</th>
                    <th>Net Amount</th>

                    {hasBDExpenditurePercentage && (
                      <th>BD Expenditure</th>
                    )}
                  </>
                )}

                <th>Performance</th>
              </tr>
            </thead>

            <tbody>
              {needsFinancialYear && !selectedFinancialYear ? (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="bd-empty"
                  >
                    Please select a Financial Year to view monthly or quarterly performance.
                  </td>
                </tr>
              ) : displayedMemberData.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="bd-empty"
                  >
                    No BD member data available for the selected filters.
                  </td>
                </tr>
              ) : (
                displayedMemberData.map((member, index) => (
                  <tr
                    key={`${member.member}-${member.period || "all-time"}-${index}`}
                  >
                    <td>
                      {isPeriodView ? (
                        <strong>
                          {member.period}
                        </strong>
                      ) : (
                        <div className="bd-name">
                          <div className="bd-avatar">
                            {member.member.charAt(0).toUpperCase()}
                          </div>

                          <span>
                            {member.member}
                          </span>
                        </div>
                      )}
                    </td>

                    {showCountColumns && (
                      <>
                        <td>
                          <span className="bd-client-count">
                            {member.clients}
                          </span>
                        </td>

                        <td>
                          <span className="bd-client-count">
                            {member.enquiries}
                          </span>
                        </td>

                        <td>
                          <span className="bd-client-count">
                            {member.franchisees}
                          </span>
                        </td>
                      </>
                    )}

                    {showRevenueColumns && (
                      <>
                        <td>
                          <span className="bd-billing-value">
                            {formatCurrency(member.billing)}
                          </span>
                        </td>

                        <td>
                          <span className="bd-net-value">
                            {formatCurrency(member.netAmount)}
                          </span>
                        </td>

                        {hasBDExpenditurePercentage && (
                          <td>
                            <span className="bd-expenditure-value">
                              {formatCurrency(member.bdExpenditure)}
                            </span>
                          </td>
                        )}
                      </>
                    )}

                    <td>
                      <button
                        type="button"
                        className="bd-view-performance-btn"
                        onClick={() => {
                          handleViewPerformance(member.member);
                        }}
                      >
                        View

                        <span className="bd-view-arrow">
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
      </div>

      {/* ===================================================
          PERFORMANCE MODAL
      =================================================== */}

      {selectedMember && (
        <div
          className="bd-performance-overlay"
          onClick={handleCloseModal}
        >
          <div
            className="bd-performance-modal"
            onClick={event => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

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
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* SUMMARY CARDS */}

            <div className="bd-summary-grid">
              <div className="bd-summary-card">
                <span className="bd-summary-label">
                  Best Industry
                </span>

                <strong className="bd-summary-text">
                  {bestIndustry}
                </strong>
              </div>

              <div className="bd-summary-card">
                <span className="bd-summary-label">
                  Best City
                </span>

                <strong className="bd-summary-text">
                  {bestCity}
                </strong>
              </div>

              <div className="bd-summary-card">
                <span className="bd-summary-label">
                  Total Billing
                </span>

                <strong className="bd-summary-value">
                  {formatCurrency(performanceSummary.totalBilling)}
                </strong>
              </div>

              {hasBDExpenditurePercentage && (
                <div className="bd-summary-card">
                  <span className="bd-summary-label">
                    BD Expenditure
                  </span>

                  <strong className="bd-summary-value">
                    {formatCurrency(performanceSummary.totalBDExpenditure)}
                  </strong>

                  <small>
                    {bdExpenditurePercentage}% of Total Billing
                  </small>
                </div>
              )}

              <div className="bd-summary-card bd-summary-net">
                <span className="bd-summary-label">
                  Net Amount
                </span>

                <strong className="bd-summary-value">
                  {formatCurrency(performanceSummary.netAmount)}
                </strong>
              </div>
            </div>

            {/* REPORT CONTROLS */}

            <div className="bd-report-controls">
              <div>
                <label htmlFor="bd-financial-year">
                  Financial Year
                </label>

                <select
                  id="bd-financial-year"
                  value={reportFinancialYear}
                  onChange={event => {
                    setReportFinancialYear(event.target.value);
                  }}
                >
                  <option value="">
                    None
                  </option>

                  {financialYears.map(year => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bd-report-info-status">
                  Info Status
                </label>

                <select
                  id="bd-report-info-status"
                  value={reportInfoStatus}
                  onChange={event => {
                    setReportInfoStatus(event.target.value);
                  }}
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
                  {reportFinancialYear
                    ? reportFinancialYear
                    : "Yearly"}
                </strong>
              </div>
            </div>

            {/* GRAPHS */}

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
                    {reportFinancialYear ? "Monthly" : "Yearly"}
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
                          dataKey={reportFinancialYear ? "monthShort" : "year"}
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

                        <Tooltip content={<BDTooltip />} />

                        <Bar
                          dataKey="clients"
                          name="Client Acquired"
                          fill="#B78A34"
                          radius={[6, 6, 0, 0]}
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
                    {reportFinancialYear ? "Monthly" : "Yearly"}
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
                          dataKey={reportFinancialYear ? "monthShort" : "year"}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={value => {
                            const number = Number(value) || 0;

                            if (Math.abs(number) >= 10000000) {
                              return `₹${(
                                number / 10000000
                              ).toFixed(1)}Cr`;
                            }

                            if (Math.abs(number) >= 100000) {
                              return `₹${(
                                number / 100000
                              ).toFixed(0)}L`;
                            }

                            if (Math.abs(number) >= 1000) {
                              return `₹${(
                                number / 1000
                              ).toFixed(0)}K`;
                            }

                            return `₹${number}`;
                          }}
                        />

                        <Tooltip content={<BDTooltip />} />

                        <Bar
                          dataKey="billing"
                          name="Total Billing"
                          fill="#26734D"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="bd-modal-footer">
              <span>
                {reportFinancialYear
                  ? `Monthly report for ${reportFinancialYear}`
                  : "Yearly performance report"}
              </span>

              <button
                type="button"
                className="bd-footer-close"
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

export default BDPerformance;