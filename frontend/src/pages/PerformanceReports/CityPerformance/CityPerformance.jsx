
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

import "./CityPerformance.css";


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
   NUMBER HELPERS
========================================================= */

const toNumber = (value) => {
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
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
};


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

const firstValue = (row, keys = []) => {
  for (const key of keys) {
    const value = row?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};


/* =========================================================
   CITY NORMALIZATION
========================================================= */

const normalizeCityName = (value) => {
  if (!value) return "";

  return String(value)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};


const getCity = (row) => {
  return normalizeCityName(
    firstValue(row, ["city", "City"])
  );
};


const getCityKey = (city) => {
  return normalizeCityName(city).toLowerCase();
};


/* =========================================================
   COMPANY NAME
========================================================= */

const getCompanyName = (row) => {
  return String(
    firstValue(row, [
      "company_name",
      "Company Name"
    ])
  )
    .trim()
    .toLowerCase();
};


/* =========================================================
   INDUSTRY
========================================================= */

const getIndustry = (row) => {
  return String(
    firstValue(row, [
      "industry",
      "Industry"
    ])
  ).trim();
};


/* =========================================================
   FRANCHISE
========================================================= */

const getFranchiseName = (row) => {
  return String(
    firstValue(row, [
      "franchise_name",
      "Franchise Name",
      "franchise",
      "Franchise",
      "franchisee_name",
      "Franchisee Name"
    ])
  ).trim();
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
      "TANN",
      "TDS"
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
   CITY EXPENDITURE
========================================================= */

const getCityExpenditure = (
  row,
  percentage
) => {
  const billing = getBilling(row);
  const numericPercentage = toNumber(percentage);

  if (
    numericPercentage < 0 ||
    numericPercentage > 100
  ) {
    return 0;
  }

  return billing * numericPercentage / 100;
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
   DATE PARSER
========================================================= */

const parseDate = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    const excelEpoch = new Date(1899, 11, 30);

    const date = new Date(
      excelEpoch.getTime() +
      value * 86400000
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  let match = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  match = text.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  match = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
};


/* =========================================================
   FINANCIAL YEAR
========================================================= */

const getFinancialYear = (row) => {
  const acquiredDate = parseDate(
    getClientAcquiredDate(row)
  );

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
    "aquired_year",
    "Aquired Year",
    "Acquired Year"
  ]);

  if (fallbackYear !== "") {
    const match = String(fallbackYear).match(/\d{4}/);

    if (match) {
      const year = Number(match[0]);

      return `${year}-${String(year + 1).slice(-2)}`;
    }
  }

  return "";
};


/* =========================================================
   MONTH
========================================================= */

const getMonth = (row) => {
  const acquiredDate = parseDate(
    getClientAcquiredDate(row)
  );

  if (!acquiredDate) {
    return null;
  }

  return acquiredDate.getMonth() + 1;
};


/* =========================================================
   QUARTER
========================================================= */

const getQuarter = (month) => {
  if (month >= 4 && month <= 6) return "Q1";
  if (month >= 7 && month <= 9) return "Q2";
  if (month >= 10 && month <= 12) return "Q3";
  if (month >= 1 && month <= 3) return "Q4";

  return null;
};


/* =========================================================
   INFO FILTER
========================================================= */

const matchesInfoFilter = (
  row,
  selectedInfoStatus
) => {
  if (
    !selectedInfoStatus ||
    selectedInfoStatus === "ALL"
  ) {
    return true;
  }

  return (
    getInfoStatus(row) === selectedInfoStatus
  );
};


/* =========================================================
   FINANCIAL VALUES
========================================================= */

const getFinancialValues = (
  row,
  selectedInfoStatus,
  cityExpenditurePercentage
) => {
  const billing = getBilling(row);
  const franchiseeShare = getFranchiseeShare(row);
  const status = getInfoStatus(row);

  if (
    !selectedInfoStatus ||
    selectedInfoStatus === "ALL"
  ) {
    return {
      billing,
      netAmount: billing - franchiseeShare,
      franchiseeShare,
      cityExpenditure: getCityExpenditure(
        row,
        cityExpenditurePercentage
      )
    };
  }

  if (selectedInfoStatus === "R") {
    if (status !== "R") {
      return {
        billing: 0,
        netAmount: 0,
        franchiseeShare: 0,
        cityExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: billing - franchiseeShare,
      franchiseeShare,
      cityExpenditure: getCityExpenditure(
        row,
        cityExpenditurePercentage
      )
    };
  }

  if (["RV", "C", "CN"].includes(selectedInfoStatus)) {
    if (status !== selectedInfoStatus) {
      return {
        billing: 0,
        netAmount: 0,
        franchiseeShare: 0,
        cityExpenditure: 0
      };
    }

    return {
      billing,
      netAmount: 0,
      franchiseeShare,
      cityExpenditure: 0
    };
  }

  return {
    billing: 0,
    netAmount: 0,
    franchiseeShare: 0,
    cityExpenditure: 0
  };
};


/* =========================================================
   DISPLAY HELPERS
========================================================= */

const displayValue = (
  value,
  fallback = "—"
) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return value;
};


const capitalizeWords = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};


/* =========================================================
   CITY TOOLTIP
========================================================= */

const CityTooltip = ({
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

  const value = payload[0]?.value;
  const dataKey = payload[0]?.dataKey;
  const isBilling = dataKey === "billing";

  return (
    <div className="city-modern-tooltip">
      <div className="city-tooltip-label">
        {label}
      </div>

      <div className="city-tooltip-row">
        <span>
          {isBilling ? "Total Billing" : "Client Acquired"}
        </span>

        <strong>
          {isBilling
            ? formatCurrency(value)
            : Number(value || 0).toLocaleString("en-IN")}
        </strong>
      </div>
    </div>
  );
};


/* =========================================================
   COMPONENT
========================================================= */

const CityPerformance = () => {

  const { rows = [] } = useData();


  /* =======================================================
     MAIN PAGE FILTER STATE
  ======================================================= */

  const [
    selectedCityFilter,
    setSelectedCityFilter
  ] = useState("ALL");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("ALL");

  const [
    selectedMonth,
    setSelectedMonth
  ] = useState("ALL");

  const [
    viewReportAs,
    setViewReportAs
  ] = useState("all-time");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("ALL");

  const [
    cityExpenditurePercentage,
    setCityExpenditurePercentage
  ] = useState("");


  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [
    modalCity,
    setModalCity
  ] = useState("");

  const [
    reportFinancialYear,
    setReportFinancialYear
  ] = useState("ALL");

  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("ALL");


  /* =======================================================
     DERIVED FILTER STATE
  ======================================================= */

  const isIndividualCity =
    selectedCityFilter !== "ALL";

  const needsFinancialYear =
    isIndividualCity &&
    ["monthly", "quarterly"].includes(viewReportAs);

  const isPeriodReport =
    isIndividualCity &&
    viewReportAs !== "all-time";

  const firstColumnHeading =
    !isIndividualCity || viewReportAs === "all-time"
      ? "City"
      : viewReportAs === "yearly"
        ? "Financial Year"
        : viewReportAs === "monthly"
          ? "Month"
          : "Quarter";


  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const handleResetFilters = () => {
    setSelectedCityFilter("ALL");
    setSelectedFinancialYear("ALL");
    setSelectedMonth("ALL");
    setViewReportAs("all-time");
    setSelectedInfoStatus("ALL");
    setCityExpenditurePercentage("");
  };


  /* =======================================================
     CITY EXPENDITURE VALIDATION
  ======================================================= */

  const hasCityExpenditurePercentage = useMemo(() => {
    if (
      cityExpenditurePercentage === "" ||
      cityExpenditurePercentage === null ||
      cityExpenditurePercentage === undefined
    ) {
      return false;
    }

    const value = Number(cityExpenditurePercentage);

    return (
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100
    );
  }, [cityExpenditurePercentage]);


  /* =======================================================
     TABLE COLUMN COUNT
  ======================================================= */

  const tableColumnCount =
    7 + (hasCityExpenditurePercentage ? 1 : 0);


  /* =======================================================
     CITY OPTIONS - NORMALIZED UNIQUE CITIES
  ======================================================= */

  const cities = useMemo(() => {
    const cityMap = new Map();

    rows.forEach(row => {
      const city = getCity(row);

      if (!city) return;

      const key = getCityKey(city);

      if (!cityMap.has(key)) {
        cityMap.set(key, city);
      }
    });

    return Array.from(cityMap.values()).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [rows]);


  /* =======================================================
     FINANCIAL YEARS
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
      const yearA = Number(String(a).split("-")[0]);
      const yearB = Number(String(b).split("-")[0]);

      return yearA - yearB;
    });
  }, [rows]);


  /* =======================================================
     INFO STATUSES
  ======================================================= */

  const infoStatuses = ["R", "RV", "C", "CN"];


  /* =======================================================
     MAIN CITY DATA
  ======================================================= */

  const cityData = useMemo(() => {
    const map = new Map();

    rows.forEach(row => {
      const city = getCity(row);

      if (!city) {
        return;
      }

      const cityKey = getCityKey(city);

      if (
        selectedCityFilter !== "ALL" &&
        cityKey !== getCityKey(selectedCityFilter)
      ) {
        return;
      }

      if (
        selectedFinancialYear !== "ALL" &&
        getFinancialYear(row) !== selectedFinancialYear
      ) {
        return;
      }

      if (
        selectedMonth !== "ALL" &&
        getMonth(row) !== Number(selectedMonth)
      ) {
        return;
      }

      if (
        !matchesInfoFilter(row, selectedInfoStatus)
      ) {
        return;
      }

      if (!map.has(cityKey)) {
        map.set(cityKey, {
          city,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          cityExpenditure: 0
        });
      }

      const item = map.get(cityKey);

      item.enquiries += 1;

      const company = getCompanyName(row);

      if (company) {
        item.clients.add(company);
      }

      const franchisee = getFranchiseName(row);

      if (franchisee) {
        item.franchisees.add(franchisee);
      }

      const financial = getFinancialValues(
        row,
        selectedInfoStatus,
        cityExpenditurePercentage
      );

      item.billing += financial.billing;
      item.netAmount += financial.netAmount;
      item.cityExpenditure += financial.cityExpenditure;
    });

    return Array.from(map.values())
      .map(item => ({
        city: item.city,
        clients: item.clients.size,
        enquiries: item.enquiries,
        franchisees: item.franchisees.size,
        billing: item.billing,
        netAmount: item.netAmount,
        cityExpenditure: item.cityExpenditure
      }))
      .filter(item => item.enquiries > 0)
      .sort((a, b) => {
        if (b.clients !== a.clients) {
          return b.clients - a.clients;
        }

        if (b.billing !== a.billing) {
          return b.billing - a.billing;
        }

        return a.city.localeCompare(b.city);
      });
  }, [
    rows,
    selectedCityFilter,
    selectedFinancialYear,
    selectedMonth,
    selectedInfoStatus,
    cityExpenditurePercentage
  ]);


  /* =======================================================
     INDIVIDUAL CITY PERIOD REPORT DATA
  ======================================================= */

  const periodReportData = useMemo(() => {
    if (!isPeriodReport) {
      return [];
    }

    if (
      needsFinancialYear &&
      selectedFinancialYear === "ALL"
    ) {
      return [];
    }

    const periodMap = new Map();

    if (viewReportAs === "yearly") {
      financialYears.forEach(year => {
        if (
          selectedFinancialYear !== "ALL" &&
          year !== selectedFinancialYear
        ) {
          return;
        }

        periodMap.set(year, {
          period: `FY ${year}`,
          sortOrder: Number(year.split("-")[0]),
          clients: new Set(),
          franchisees: new Set(),
          enquiries: 0,
          billing: 0,
          netAmount: 0,
          cityExpenditure: 0
        });
      });
    }

    if (viewReportAs === "monthly") {
      financialMonths.forEach((month, index) => {
        periodMap.set(String(month.month), {
          period: month.full,
          sortOrder: index,
          clients: new Set(),
          franchisees: new Set(),
          enquiries: 0,
          billing: 0,
          netAmount: 0,
          cityExpenditure: 0
        });
      });
    }

    if (viewReportAs === "quarterly") {
      ["Q1", "Q2", "Q3", "Q4"].forEach((quarter, index) => {
        periodMap.set(quarter, {
          period: quarter,
          sortOrder: index,
          clients: new Set(),
          franchisees: new Set(),
          enquiries: 0,
          billing: 0,
          netAmount: 0,
          cityExpenditure: 0
        });
      });
    }

    rows.forEach(row => {
      if (
        getCityKey(getCity(row)) !==
        getCityKey(selectedCityFilter)
      ) {
        return;
      }

      const financialYear = getFinancialYear(row);

      if (
        selectedFinancialYear !== "ALL" &&
        financialYear !== selectedFinancialYear
      ) {
        return;
      }

      if (
        selectedMonth !== "ALL" &&
        getMonth(row) !== Number(selectedMonth)
      ) {
        return;
      }

      if (!matchesInfoFilter(row, selectedInfoStatus)) {
        return;
      }

      const month = getMonth(row);

      let key = null;

      if (viewReportAs === "yearly") {
        key = financialYear;
      }

      if (viewReportAs === "monthly") {
        key = month ? String(month) : null;
      }

      if (viewReportAs === "quarterly") {
        key = month ? getQuarter(month) : null;
      }

      if (!key || !periodMap.has(key)) {
        return;
      }

      const item = periodMap.get(key);

      item.enquiries += 1;

      const company = getCompanyName(row);

      if (company) {
        item.clients.add(company);
      }

      const franchisee = getFranchiseName(row);

      if (franchisee) {
        item.franchisees.add(franchisee);
      }

      const financial = getFinancialValues(
        row,
        selectedInfoStatus,
        cityExpenditurePercentage
      );

      item.billing += financial.billing;
      item.netAmount += financial.netAmount;
      item.cityExpenditure += financial.cityExpenditure;
    });

    return Array.from(periodMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter(item => item.enquiries > 0)
      .map(item => ({
        period: item.period,
        clients: item.clients.size,
        enquiries: item.enquiries,
        franchisees: item.franchisees.size,
        billing: item.billing,
        netAmount: item.netAmount,
        cityExpenditure: item.cityExpenditure
      }));
  }, [
    rows,
    isPeriodReport,
    viewReportAs,
    needsFinancialYear,
    selectedCityFilter,
    selectedFinancialYear,
    selectedMonth,
    selectedInfoStatus,
    cityExpenditurePercentage,
    financialYears
  ]);


  /* =======================================================
     SELECTED MODAL ROWS
  ======================================================= */

  const selectedRows = useMemo(() => {
    if (!modalCity) {
      return [];
    }

    return rows.filter(row => {
      if (
        getCityKey(getCity(row)) !==
        getCityKey(modalCity)
      ) {
        return false;
      }

      if (
        reportFinancialYear !== "ALL" &&
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return false;
      }

      if (
        !matchesInfoFilter(row, reportInfoStatus)
      ) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    modalCity,
    reportFinancialYear,
    reportInfoStatus
  ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary = useMemo(() => {
    let totalBilling = 0;
    let totalNetAmount = 0;
    let totalCityExpenditure = 0;
    let totalFranchiseeShare = 0;

    const companySet = new Set();
    const industryMap = new Map();
    const cityMap = new Map();

    selectedRows.forEach(row => {
      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        cityExpenditurePercentage
      );

      totalBilling += financial.billing;
      totalNetAmount += financial.netAmount;
      totalCityExpenditure += financial.cityExpenditure;
      totalFranchiseeShare += financial.franchiseeShare;

      const company = getCompanyName(row);

      if (company) {
        companySet.add(company);
      }

      const industry = getIndustry(row);

      if (industry && company) {
        if (!industryMap.has(industry)) {
          industryMap.set(industry, new Set());
        }

        industryMap.get(industry).add(company);
      }

      const city = getCity(row);
      const cityKey = getCityKey(city);

      if (city && company) {
        if (!cityMap.has(cityKey)) {
          cityMap.set(cityKey, {
            name: city,
            clients: new Set()
          });
        }

        cityMap.get(cityKey).clients.add(company);
      }
    });

    let bestIndustry = {
      name: "—",
      clients: 0
    };

    industryMap.forEach((clients, industry) => {
      if (clients.size > bestIndustry.clients) {
        bestIndustry = {
          name: industry,
          clients: clients.size
        };
      }
    });

    let bestCity = {
      name: "—",
      clients: 0
    };

    cityMap.forEach(item => {
      if (item.clients.size > bestCity.clients) {
        bestCity = {
          name: item.name,
          clients: item.clients.size
        };
      }
    });

    const grossProfit =
      totalNetAmount - totalCityExpenditure;

    const grossMargin = totalNetAmount > 0
      ? (grossProfit / totalNetAmount) * 100
      : 0;

    return {
      totalBilling,
      totalNetAmount,
      totalCityExpenditure,
      totalFranchiseeShare,
      grossProfit,
      grossMargin,
      bestIndustry,
      bestCity,
      uniqueClients: companySet.size,
      totalEnquiries: selectedRows.length
    };
  }, [
    selectedRows,
    reportInfoStatus,
    cityExpenditurePercentage
  ]);


  /* =======================================================
     YEARLY REPORT DATA
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

      const item = map.get(year);
      const company = getCompanyName(row);

      if (company) {
        item.clients.add(company);
      }

      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        cityExpenditurePercentage
      );

      item.billing += financial.billing;
    });

    return Array.from(map.values())
      .sort((a, b) => {
        const yearA = Number(String(a.year).split("-")[0]);
        const yearB = Number(String(b.year).split("-")[0]);

        return yearA - yearB;
      })
      .map(item => ({
        year: `FY ${item.year}`,
        clients: item.clients.size,
        billing: item.billing
      }));
  }, [
    selectedRows,
    reportInfoStatus,
    cityExpenditurePercentage
  ]);


  /* =======================================================
     MONTHLY REPORT DATA
  ======================================================= */

  const monthlyReportData = useMemo(() => {
    const monthMap = new Map();

    financialMonths.forEach(month => {
      monthMap.set(month.month, {
        month: month.short,
        full: month.full,
        clients: new Set(),
        billing: 0
      });
    });

    selectedRows.forEach(row => {
      const month = getMonth(row);

      if (!month) {
        return;
      }

      if (
        reportFinancialYear !== "ALL" &&
        getFinancialYear(row) !== reportFinancialYear
      ) {
        return;
      }

      const item = monthMap.get(month);

      if (!item) {
        return;
      }

      const company = getCompanyName(row);

      if (company) {
        item.clients.add(company);
      }

      const financial = getFinancialValues(
        row,
        reportInfoStatus,
        cityExpenditurePercentage
      );

      item.billing += financial.billing;
    });

    return financialMonths.map(month => {
      const item = monthMap.get(month.month);

      return {
        month: item.month,
        full: item.full,
        clients: item.clients.size,
        billing: item.billing
      };
    });
  }, [
    selectedRows,
    reportFinancialYear,
    reportInfoStatus,
    cityExpenditurePercentage
  ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData = useMemo(() => {
    return reportFinancialYear !== "ALL"
      ? monthlyReportData
      : yearlyReportData;
  }, [
    reportFinancialYear,
    monthlyReportData,
    yearlyReportData
  ]);


  /* =======================================================
     VIEW PERFORMANCE
  ======================================================= */

  const handleViewPerformance = (city) => {
    if (!city) {
      return;
    }

    setModalCity(city);

    setReportFinancialYear(
      selectedFinancialYear
    );

    setReportInfoStatus(
      selectedInfoStatus
    );
  };


  /* =======================================================
     CLOSE PERFORMANCE
  ======================================================= */

  const handleClosePerformance = () => {
    setModalCity("");
  };


  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!modalCity) {
      return undefined;
    }

    const handleEscape = event => {
      if (event.key === "Escape") {
        handleClosePerformance();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modalCity]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="city-performance-page">

      {/* PAGE HEADER */}

      <div className="city-page-header">
        <div>
          <div className="city-page-eyebrow">
            PERFORMANCE
          </div>

          <h1>
            City Performance
          </h1>

          <p>
            Track acquired clients, enquiries
            and financial performance by city.
          </p>
        </div>
      </div>


      {/* TABLE CARD */}

      <div className="city-table-card">

        <div className="city-table-header">
          <div>
            <h2>
              City Overview
            </h2>

            <p>
              Performance summary based on
              the selected filters.
            </p>
          </div>

          <div className="city-member-count">
            <strong>
              {isPeriodReport
                ? (
                    needsFinancialYear &&
                    selectedFinancialYear === "ALL"
                  )
                  ? 0
                  : periodReportData.length
                : cityData.length}
            </strong>

            <span>
              {isPeriodReport ? "Periods" : "Cities"}
            </span>
          </div>
        </div>


        {/* MAIN FILTERS */}

        <div className="city-performance-filters">

          {/* CITY */}

          <div className="city-filter-group">
            <label>
              City
            </label>

            <select
              value={selectedCityFilter}
              onChange={event => {
                setSelectedCityFilter(event.target.value);
                setViewReportAs("all-time");
              }}
            >
              <option value="ALL">
                All Cities
              </option>

              {cities.map(city => (
                <option
                  key={getCityKey(city)}
                  value={city}
                >
                  {capitalizeWords(city)}
                </option>
              ))}
            </select>
          </div>


          {/* VIEW REPORT AS */}

          {isIndividualCity && (
            <div className="city-filter-group">
              <label>
                View Report As
              </label>

              <select
                value={viewReportAs}
                onChange={event => {
                  setViewReportAs(event.target.value);
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

          <div className="city-filter-group">
            <label>
              Financial Year
            </label>

            <select
              value={selectedFinancialYear}
              onChange={event =>
                setSelectedFinancialYear(event.target.value)
              }
            >
              <option value="ALL">
                All Financial Years
              </option>

              {financialYears.map(year => (
                <option
                  key={year}
                  value={year}
                >
                  FY {year}
                </option>
              ))}
            </select>
          </div>


          {/* MONTH */}

          <div className="city-filter-group">
            <label>
              Month
            </label>

            <select
              value={selectedMonth}
              onChange={event =>
                setSelectedMonth(event.target.value)
              }
            >
              <option value="ALL">
                All Months
              </option>

              {financialMonths.map(month => (
                <option
                  key={month.month}
                  value={month.month}
                >
                  {month.full}
                </option>
              ))}
            </select>
          </div>


          {/* INFO STATUS */}

          <div className="city-filter-group">
            <label>
              Info Status
            </label>

            <select
              value={selectedInfoStatus}
              onChange={event =>
                setSelectedInfoStatus(event.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              {infoStatuses.map(status => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>


          {/* CITY EXPENDITURE */}

          <div className="city-filter-group">
            <label>
              City Expenditure %
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Enter percentage"
              value={cityExpenditurePercentage}
              onChange={event => {
                const value = event.target.value;

                if (
                  value === "" ||
                  (
                    Number(value) >= 0 &&
                    Number(value) <= 100
                  )
                ) {
                  setCityExpenditurePercentage(value);
                }
              }}
            />
          </div>


          {/* RESET FILTERS */}

          <div className="city-filter-group city-reset-filter-group">
            <label>
              &nbsp;
            </label>

            <button
              type="button"
              className="city-reset-filters-btn"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>

        </div>


        {/* SELECTED CITY HEADING */}

        {isIndividualCity && (
          <div className="city-selected-heading">
            <span className="city-selected-label">
              CITY
            </span>

            <h2>
              {capitalizeWords(selectedCityFilter)}
            </h2>

            <p>
              {viewReportAs === "all-time"
                ? "All Time Performance Report"
                : `${viewReportAs.charAt(0).toUpperCase()}${viewReportAs.slice(1)} Performance Report`}
            </p>
          </div>
        )}


        {/* FINANCIAL YEAR VALIDATION */}

        {needsFinancialYear &&
          selectedFinancialYear === "ALL" && (
            <div className="city-period-filter-notice">
              Please select a Financial Year to view the {viewReportAs} report.
            </div>
          )}


        {/* MAIN TABLE */}

        <div className="city-table-wrapper">

          <table className="city-performance-table">

            <thead>
              <tr>

                <th>
                  {firstColumnHeading}
                </th>

                <th>Total Acquired Client</th>
                <th>Total Enquiries</th>
                <th>No. of Franchisee</th>
                <th>Total Billing</th>
                <th>Net Amount</th>

                {hasCityExpenditurePercentage && (
                  <th>City Expenditure</th>
                )}

                <th>Performance</th>

              </tr>
            </thead>


            <tbody>

              {needsFinancialYear &&
              selectedFinancialYear === "ALL" ? (

                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="city-no-data"
                  >
                    Select a financial year to display the report.
                  </td>
                </tr>

              ) : (

                (() => {
                  const displayData = isPeriodReport
                    ? periodReportData
                    : cityData;

                  if (displayData.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={tableColumnCount}
                          className="city-no-data"
                        >
                          No performance data available
                          for the selected filters.
                        </td>
                      </tr>
                    );
                  }

                  return displayData.map(item => (
                    <tr
                      key={
                        isPeriodReport
                          ? item.period
                          : getCityKey(item.city)
                      }
                    >

                      {/* FIRST COLUMN */}

                      <td>
                        {isPeriodReport ? (
                          <span className="city-period-label">
                            {item.period}
                          </span>
                        ) : (
                          <div className="city-name-cell">
                            <div className="city-avatar">
                              {item.city.charAt(0).toUpperCase()}
                            </div>

                            <span>
                              {capitalizeWords(item.city)}
                            </span>
                          </div>
                        )}
                      </td>


                      {/* CLIENTS */}

                      <td>
                        {item.clients.toLocaleString("en-IN")}
                      </td>


                      {/* ENQUIRIES */}

                      <td>
                        {item.enquiries.toLocaleString("en-IN")}
                      </td>


                      {/* FRANCHISEES */}

                      <td>
                        {item.franchisees.toLocaleString("en-IN")}
                      </td>


                      {/* BILLING */}

                      <td>
                        {formatCurrency(item.billing)}
                      </td>


                      {/* NET AMOUNT */}

                      <td>
                        {formatCurrency(item.netAmount)}
                      </td>


                      {/* CITY EXPENDITURE */}

                      {hasCityExpenditurePercentage && (
                        <td>
                          {formatCurrency(item.cityExpenditure)}
                        </td>
                      )}


                      {/* PERFORMANCE */}

                      <td>
                        <button
                          type="button"
                          className="city-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              isPeriodReport
                                ? selectedCityFilter
                                : item.city
                            )
                          }
                        >
                          <span>
                            View Performance
                          </span>

                          <span className="city-view-arrow">
                            →
                          </span>
                        </button>
                      </td>

                    </tr>
                  ));
                })()

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ===================================================
          PERFORMANCE MODAL
      =================================================== */}

      {modalCity && (
        <div
          className="city-performance-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              handleClosePerformance();
            }
          }}
        >

          <div className="city-performance-modal">

            {/* MODAL HEADER */}

            <div className="city-modal-header">

              <div>
                <div className="city-modal-eyebrow">
                  CITY PERFORMANCE
                </div>

                <h2>
                  {capitalizeWords(modalCity)}
                </h2>

                <p>
                  Detailed performance analysis
                  and financial overview.
                </p>
              </div>

              <button
                type="button"
                className="city-modal-close"
                onClick={handleClosePerformance}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* SUMMARY */}

            <div className="city-summary-grid">

              <div className="city-summary-card">
                <span>Best Industry</span>

                <strong>
                  {displayValue(
                    capitalizeWords(
                      performanceSummary.bestIndustry.name
                    )
                  )}
                </strong>

                <small>
                  {performanceSummary.bestIndustry.clients} unique clients
                </small>
              </div>


              <div className="city-summary-card">
                <span>Best City</span>

                <strong>
                  {displayValue(
                    capitalizeWords(
                      performanceSummary.bestCity.name
                    )
                  )}
                </strong>

                <small>
                  {performanceSummary.bestCity.clients} unique clients
                </small>
              </div>


              <div className="city-summary-card">
                <span>Total Billing</span>

                <strong>
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </strong>

                <small>Gross billing</small>
              </div>


              {hasCityExpenditurePercentage && (
                <div className="city-summary-card">
                  <span>City Expenditure</span>

                  <strong>
                    {formatCurrency(
                      performanceSummary.totalCityExpenditure
                    )}
                  </strong>

                  <small>
                    {cityExpenditurePercentage}% of billing
                  </small>
                </div>
              )}


              <div className="city-summary-card">
                <span>Net Amount</span>

                <strong>
                  {formatCurrency(
                    performanceSummary.totalNetAmount
                  )}
                </strong>

                <small>After franchisee share</small>
              </div>

            </div>


            {/* REPORT CONTROLS */}

            <div className="city-report-controls">

              <div>
                <h3>
                  Performance Report
                </h3>

                <p>
                  Analyze client acquisition
                  and billing trends.
                </p>
              </div>


              <div className="city-report-filter-row">

                <div className="city-filter-group">
                  <label>
                    Financial Year
                  </label>

                  <select
                    value={reportFinancialYear}
                    onChange={event =>
                      setReportFinancialYear(event.target.value)
                    }
                  >
                    <option value="ALL">
                      All Financial Years
                    </option>

                    {financialYears.map(year => (
                      <option
                        key={year}
                        value={year}
                      >
                        FY {year}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="city-filter-group">
                  <label>
                    Info Status
                  </label>

                  <select
                    value={reportInfoStatus}
                    onChange={event =>
                      setReportInfoStatus(event.target.value)
                    }
                  >
                    <option value="ALL">
                      All Status
                    </option>

                    {infoStatuses.map(status => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

            </div>


            {/* REPORT PERIOD */}

            <div className="city-report-period">
              <span>
                Report Period
              </span>

              <strong>
                {reportFinancialYear !== "ALL"
                  ? `FY ${reportFinancialYear} · Monthly`
                  : "All Financial Years · Yearly"}
              </strong>
            </div>


            {/* GRAPHS */}

            <div className="city-report-graphs">

              {/* CLIENT GRAPH */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>
                    <h3>
                      Client Acquired
                    </h3>

                    <p>
                      Unique companies acquired
                    </p>
                  </div>

                  <div className="city-chart-indicator city-client-indicator">
                    <span />
                    Client Acquired
                  </div>

                </div>


                <div className="city-chart-container">

                  {reportData.length === 0 ? (
                    <div className="city-no-chart-data">
                      No client data available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
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
                          dataKey={
                            reportFinancialYear !== "ALL"
                              ? "month"
                              : "year"
                          }
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          content={<CityTooltip />}
                        />

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


              {/* BILLING GRAPH */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div>
                    <h3>
                      Total Billing
                    </h3>

                    <p>
                      Billing generated
                    </p>
                  </div>

                  <div className="city-chart-indicator city-billing-indicator">
                    <span />
                    Total Billing
                  </div>

                </div>


                <div className="city-chart-container">

                  {reportData.length === 0 ? (
                    <div className="city-no-chart-data">
                      No billing data available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
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
                          dataKey={
                            reportFinancialYear !== "ALL"
                              ? "month"
                              : "year"
                          }
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={value =>
                            `₹${(
                              Number(value || 0) / 100000
                            ).toFixed(0)}L`
                          }
                        />

                        <Tooltip
                          content={<CityTooltip />}
                        />

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


            {/* MODAL FOOTER */}

            <div className="city-modal-footer">

              <div>
                <strong>
                  {performanceSummary.uniqueClients}
                </strong>

                <span>
                  unique acquired clients
                </span>

                <span className="city-footer-separator">
                  ·
                </span>

                <strong>
                  {performanceSummary.totalEnquiries}
                </strong>

                <span>
                  enquiries
                </span>
              </div>

              <button
                type="button"
                className="city-footer-close"
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


export default CityPerformance;
