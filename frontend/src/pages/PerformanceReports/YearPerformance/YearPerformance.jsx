import React, {
  useMemo,
  useState
} from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./YearPerformance.css";

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
   GRAPH COLORS
========================================================= */

const GRAPH_COLORS = {
  billing: "#2563eb",
  profit: "#16a34a",
  loss: "#dc2626",
  golden: "#c9a227",
  darkBlue: "#17365d",
  grid: "#e7dcc8"
};

const FINANCIAL_PIE_COLORS = [
  GRAPH_COLORS.profit,
  GRAPH_COLORS.loss
];

/* =========================================================
   NUMBER HELPERS
========================================================= */

function cleanNumber(value) {
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

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  if (!cleaned) {
    return 0;
  }

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =========================================================
   CURRENCY FORMAT
========================================================= */

function formatCurrency(value) {
  return `₹${cleanNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0
    }
  )}`;
}

/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {
  return cleanNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0
    }
  );
}

/* =========================================================
   CRORE FORMAT
========================================================= */

function formatCrore(value) {
  const crore =
    cleanNumber(value) / 10000000;

  if (crore === 0) {
    return "₹0 Cr";
  }

  if (Number.isInteger(crore)) {
    return `₹${crore} Cr`;
  }

  return `₹${crore.toFixed(1)} Cr`;
}

/* =========================================================
   FIRST VALUE
========================================================= */

function firstValue(row, keys) {
  if (!row) {
    return "";
  }

  for (const key of keys) {
    const value = row[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

/* =========================================================
   INFO STATUS
========================================================= */

function getInfoStatus(row) {
  return cleanText(
    firstValue(row, [
      "info",
      "Info",
      "info_status",
      "Info Status",
      "information_status",
      "Information Status"
    ])
  ).toUpperCase();
}

/* =========================================================
   COMPANY NAME
========================================================= */

function getCompanyName(row) {
  return cleanText(
    firstValue(row, [
      "company_name",
      "Company Name",
      "company",
      "Company",
      "client_name",
      "Client Name",
      "client",
      "Client",
      "CompanyName",
      "companyName",
      "tann",
      "TANN"
    ])
  );
}

function getCompanyKey(row) {
  return getCompanyName(row)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* =========================================================
   BD MEMBER
========================================================= */

function getBDMember(row) {
  return cleanText(
    firstValue(row, [
      "BD Member",
      "BD",
      "bd",
      "BD Name",
      "bd_name",
      "bdName",
      "Business Development",
      "Business Development Member",
      "Business Development Name",
      "BD Member Name"
    ])
  );
}

/* =========================================================
   TEAM LEADER
========================================================= */

function getTeamLeader(row) {
  return cleanText(
    firstValue(row, [
      "team_leader",
      "Team Leader",
      "team leader",
      "TeamLeader",
      "teamLeader",
      "TL",
      "tl",
      "TL Name",
      "Team Leader Name"
    ])
  );
}

/* =========================================================
   INDUSTRY
========================================================= */

function getIndustry(row) {
  return cleanText(
    firstValue(row, [
      "Industry",
      "industry",
      "Industry Name",
      "industry_name",
      "IndustryName",
      "Business Type",
      "business_type",
      "Sector",
      "sector"
    ])
  );
}

/* =========================================================
   DATE CLIENT ACQUIRED
========================================================= */

function getAcquiredDate(row) {
  return firstValue(row, [
    "date_client_acquired",
    "Date Client Acquired",
    "client_acquired_date",
    "Client Acquired Date",
    "date_acquired",
    "Date Acquired",
    "Date Acquired Client",
    "client acquired date"
  ]);
}

/* =========================================================
   DATE PARSER
========================================================= */

function parseDate(value) {
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

  /* Excel serial date */
  if (typeof value === "number") {
    if (
      value > 20000 &&
      value < 60000
    ) {
      const date = new Date(
        Date.UTC(
          1899,
          11,
          30
        ) +
          value * 86400000
      );

      return Number.isNaN(date.getTime())
        ? null
        : date;
    }
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  /* YYYY-MM-DD / YYYY/MM/DD */

  let match = text.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  /* DD/MM/YYYY / DD-MM-YYYY */

  match = text.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

/* =========================================================
   FINANCIAL YEAR NORMALIZER
========================================================= */

function normalizeFinancialYear(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const text = String(value)
    .trim()
    .replace(/–/g, "-")
    .replace(/—/g, "-");

  let match = text.match(
    /(20\d{2})\D+(20\d{2})/
  );

  if (match) {
    return `${match[1]}-${match[2].slice(-2)}`;
  }

  match = text.match(
    /(20\d{2})\D+(\d{2})/
  );

  if (match) {
    return `${match[1]}-${match[2]}`;
  }

  match = text.match(/20\d{2}/);

  if (match) {
    const year = Number(match[0]);

    return `${year}-${String(
      year + 1
    ).slice(-2)}`;
  }

  return "";
}

/* =========================================================
   FINANCIAL YEAR
========================================================= */

function getFinancialYear(row) {
  const databaseYear = firstValue(
    row,
    [
      "Financial Year",
      "FinancialYear",
      "financial_year",
      "financialYear",
      "Financial_Year",
      "FY",
      "fy",
      "FY Year",
      "fy_year",
      "acquired_year",
      "Aquired Year",
      "Acquired Year",
      "Year",
      "year"
    ]
  );

  if (databaseYear) {
    const normalized =
      normalizeFinancialYear(
        databaseYear
      );

    if (normalized) {
      return normalized;
    }
  }

  const date = parseDate(
    getAcquiredDate(row)
  );

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(
      year + 1
    ).slice(-2)}`;
  }

  return `${year - 1}-${String(
    year
  ).slice(-2)}`;
}

/* =========================================================
   MONTH NORMALIZER
========================================================= */

function normalizeMonth(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "number") {
    return (
      financialMonths.find(
        (item) =>
          item.month === value
      )?.full || ""
    );
  }

  const text = String(value)
    .trim()
    .toLowerCase();

  const map = {
    january: "January",
    jan: "January",
    february: "February",
    feb: "February",
    march: "March",
    mar: "March",
    april: "April",
    apr: "April",
    may: "May",
    june: "June",
    jun: "June",
    july: "July",
    jul: "July",
    august: "August",
    aug: "August",
    september: "September",
    sept: "September",
    sep: "September",
    october: "October",
    oct: "October",
    november: "November",
    nov: "November",
    december: "December",
    dec: "December"
  };

  if (map[text]) {
    return map[text];
  }

  const numeric = Number(text);

  if (
    Number.isInteger(numeric) &&
    numeric >= 1 &&
    numeric <= 12
  ) {
    return (
      financialMonths.find(
        (item) =>
          item.month === numeric
      )?.full || ""
    );
  }

  return "";
}

/* =========================================================
   MONTH
========================================================= */

function getMonth(row) {
  const databaseMonth =
    firstValue(row, [
      "Month",
      "month",
      "Billing Month",
      "billing_month",
      "billingMonth",
      "Enquiry Month",
      "enquiry_month",
      "enquiryMonth",
      "Month Name",
      "month_name"
    ]);

  if (databaseMonth !== "") {
    return normalizeMonth(
      databaseMonth
    );
  }

  const date = parseDate(
    getAcquiredDate(row)
  );

  if (date) {
    return (
      financialMonths.find(
        (item) =>
          item.month ===
          date.getMonth() + 1
      )?.full || ""
    );
  }

  return "";
}

/* =========================================================
   BILLING
========================================================= */

function getBilling(row) {
  return cleanNumber(
    firstValue(row, [
      "total_bill_amount",
      "Total Bill Amount",
      "Billing",
      "Total Billing",
      "Billing Amount",
      "TotalBillAmount",
      "totalBillAmount",
      "Total Bill",
      "total_bill",
      "TANN/TDS"
    ])
  );
}

/* =========================================================
   BUSINESS METRICS
========================================================= */

function getTotalAcquiredClients(rows) {
  return new Set(
    rows
      .map(getCompanyKey)
      .filter(Boolean)
  ).size;
}

function getTotalEnquiries(rows) {
  return rows.length;
}

function getTotalPlacements(rows) {
  return new Set(
    rows
      .filter(
        (row) =>
          getInfoStatus(row) === "R"
      )
      .map(getCompanyKey)
      .filter(Boolean)
  ).size;
}

function getTotalBilling(rows) {
  return rows.reduce(
    (total, row) =>
      total + getBilling(row),
    0
  );
}

function getProfit(rows) {
  return rows.reduce(
    (total, row) => {
      if (
        getInfoStatus(row) === "R"
      ) {
        return (
          total + getBilling(row)
        );
      }

      return total;
    },
    0
  );
}

function getLoss(rows) {
  return rows.reduce(
    (total, row) => {
      if (
        getInfoStatus(row) === "C"
      ) {
        return (
          total + getBilling(row)
        );
      }

      return total;
    },
    0
  );
}

/* =========================================================
   SORT FINANCIAL YEARS
========================================================= */

function sortYears(years) {
  return [...years].sort(
    (a, b) => {
      const yearA = Number(
        String(a).match(
          /20\d{2}/
        )?.[0] || 0
      );

      const yearB = Number(
        String(b).match(
          /20\d{2}/
        )?.[0] || 0
      );

      return yearA - yearB;
    }
  );
}

/* =========================================================
   GROUP DATA
========================================================= */

function createGroupedData(
  rows,
  getter
) {
  const map = new Map();

  rows.forEach((row) => {
    const name =
      getter(row) || "Unknown";

    if (!map.has(name)) {
      map.set(name, {
        name,
        billing: 0,
        profit: 0,
        loss: 0,
        clients: new Set(),
        enquiries: 0,
        placements: new Set()
      });
    }

    const item = map.get(name);

    const billing =
      getBilling(row);

    const info =
      getInfoStatus(row);

    const companyKey =
      getCompanyKey(row);

    item.billing += billing;

    if (info === "R") {
      item.profit += billing;

      if (companyKey) {
        item.placements.add(
          companyKey
        );
      }
    }

    if (info === "C") {
      item.loss += billing;
    }

    if (companyKey) {
      item.clients.add(
        companyKey
      );
    }

    item.enquiries += 1;
  });

  return Array.from(
    map.values()
  )
    .map((item) => ({
      name: item.name,
      billing: item.billing,
      profit: item.profit,
      loss: item.loss,
      clients: item.clients.size,
      placements:
        item.placements.size,
      enquiries:
        item.enquiries
    }))
    .sort(
      (a, b) =>
        b.billing - a.billing
    );
}

/* =========================================================
   CUSTOM BAR

   Uses SVG PATH instead of the default Recharts
   rectangle renderer.
========================================================= */

function VisibleBar(props) {
  const {
    x,
    y,
    width,
    height,
    fill
  } = props;

  const xValue = Number(x);
  const yValue = Number(y);
  const widthValue = Number(width);
  const heightValue = Number(height);

  if (
    !Number.isFinite(xValue) ||
    !Number.isFinite(yValue) ||
    !Number.isFinite(widthValue) ||
    !Number.isFinite(heightValue)
  ) {
    return null;
  }

  if (
    widthValue <= 0 ||
    heightValue <= 0
  ) {
    return null;
  }

  const radius = Math.min(
    5,
    widthValue / 2,
    heightValue / 2
  );

  const right =
    xValue + widthValue;

  const bottom =
    yValue + heightValue;

  const path = `
    M ${xValue + radius} ${yValue}
    L ${right - radius} ${yValue}
    Q ${right} ${yValue} ${right} ${
      yValue + radius
    }
    L ${right} ${bottom}
    L ${xValue} ${bottom}
    L ${xValue} ${
      yValue + radius
    }
    Q ${xValue} ${yValue} ${
      xValue + radius
    } ${yValue}
    Z
  `;

  return (
    <path
      d={path}
      fill={fill}
      fillOpacity={1}
      stroke="none"
    />
  );
}

/* =========================================================
   TOOLTIP
========================================================= */

function PerformanceTooltip({
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
    <div className="performance-tooltip">

      <strong>
        {label}
      </strong>

      {payload.map(
        (item, index) => {
          const isCount =
            item.dataKey ===
              "clients" ||
            item.dataKey ===
              "placements" ||
            item.dataKey ===
              "enquiries";

          return (
            <div
              className="performance-tooltip-row"
              key={`${item.dataKey}-${index}`}
            >
              <span>
                {item.name}
              </span>

              <strong>
                {isCount
                  ? formatNumber(
                      item.value
                    )
                  : formatCurrency(
                      item.value
                    )}
              </strong>
            </div>
          );
        }
      )}

    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function YearPerformance() {
  const {
    rows = []
  } = useData();

  /* =======================================================
     SOURCE DATA
  ======================================================= */

  const sourceRows = useMemo(
    () =>
      Array.isArray(rows)
        ? rows
        : [],
    [rows]
  );

  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    selectedYear,
    setSelectedYear
  ] = useState("All");

  const [
    selectedBD,
    setSelectedBD
  ] = useState("All");

  const [
    selectedTeamLeader,
    setSelectedTeamLeader
  ] = useState("All");

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState("All");

  const [
    selectedInfo,
    setSelectedInfo
  ] = useState("All");

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const availableYears = useMemo(() => {
    const values = new Set();

    sourceRows.forEach((row) => {
      const year =
        getFinancialYear(row);

      if (year) {
        values.add(year);
      }
    });

    return sortYears(
      Array.from(values)
    );
  }, [sourceRows]);

  const bdOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sourceRows
            .map(getBDMember)
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      ),
    [sourceRows]
  );

  const teamLeaderOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sourceRows
            .map(getTeamLeader)
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      ),
    [sourceRows]
  );

  const industryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sourceRows
            .map(getIndustry)
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      ),
    [sourceRows]
  );

  const infoOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sourceRows
            .map(getInfoStatus)
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      ),
    [sourceRows]
  );

  /* =======================================================
     FILTERED DATA
  ======================================================= */

  const filteredPerformanceRows =
    useMemo(() => {
      return sourceRows.filter(
        (row) => {
          if (
            selectedYear !== "All" &&
            getFinancialYear(row) !==
              selectedYear
          ) {
            return false;
          }

          if (
            selectedBD !== "All" &&
            getBDMember(row) !==
              selectedBD
          ) {
            return false;
          }

          if (
            selectedTeamLeader !==
              "All" &&
            getTeamLeader(row) !==
              selectedTeamLeader
          ) {
            return false;
          }

          if (
            selectedIndustry !==
              "All" &&
            getIndustry(row) !==
              selectedIndustry
          ) {
            return false;
          }

          if (
            selectedInfo !== "All" &&
            getInfoStatus(row) !==
              selectedInfo
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      sourceRows,
      selectedYear,
      selectedBD,
      selectedTeamLeader,
      selectedIndustry,
      selectedInfo
    ]);

  /* =======================================================
     ANALYSIS PERIOD
  ======================================================= */

  const analysisPeriod =
    useMemo(() => {
      const years = Array.from(
        new Set(
          filteredPerformanceRows
            .map(getFinancialYear)
            .filter(Boolean)
        )
      );

      const sorted =
        sortYears(years);

      if (!sorted.length) {
        return "No data";
      }

      return `${sorted[0]} to ${
        sorted[sorted.length - 1]
      }`;
    }, [
      filteredPerformanceRows
    ]);

  /* =======================================================
     PERFORMANCE OVERVIEW
  ======================================================= */

  const overview = useMemo(
    () => ({
      totalAcquiredClients:
        getTotalAcquiredClients(
          filteredPerformanceRows
        ),

      totalEnquiries:
        getTotalEnquiries(
          filteredPerformanceRows
        ),

      totalPlacements:
        getTotalPlacements(
          filteredPerformanceRows
        ),

      totalBilling:
        getTotalBilling(
          filteredPerformanceRows
        ),

      profit:
        getProfit(
          filteredPerformanceRows
        ),

      loss:
        getLoss(
          filteredPerformanceRows
        )
    }),
    [filteredPerformanceRows]
  );

  /* =======================================================
     YEAR-WISE DATA
  ======================================================= */

  const yearlyData = useMemo(() => {
    const yearMap = new Map();

    filteredPerformanceRows.forEach(
      (row) => {
        const year =
          getFinancialYear(row);

        if (!year) {
          return;
        }

        if (!yearMap.has(year)) {
          yearMap.set(year, {
            year,
            billing: 0,
            profit: 0,
            loss: 0,
            enquiries: 0,
            clients: new Set(),
            placements: new Set()
          });
        }

        const item =
          yearMap.get(year);

        const billing =
          getBilling(row);

        const info =
          getInfoStatus(row);

        const companyKey =
          getCompanyKey(row);

        item.enquiries += 1;

        if (companyKey) {
          item.clients.add(
            companyKey
          );
        }

        item.billing += billing;

        if (info === "R") {
          item.profit += billing;

          if (companyKey) {
            item.placements.add(
              companyKey
            );
          }
        }

        if (info === "C") {
          item.loss += billing;
        }
      }
    );

    return Array.from(
      yearMap.values()
    )
      .map((item) => ({
        year: item.year,
        billing:
          Number(item.billing) || 0,
        profit:
          Number(item.profit) || 0,
        loss:
          Number(item.loss) || 0,
        clients:
          item.clients.size,
        placements:
          item.placements.size,
        enquiries:
          item.enquiries
      }))
      .sort((a, b) => {
        const yearA =
          Number(
            String(a.year).match(
              /20\d{2}/
            )?.[0] || 0
          );

        const yearB =
          Number(
            String(b.year).match(
              /20\d{2}/
            )?.[0] || 0
          );

        return yearA - yearB;
      });
  }, [filteredPerformanceRows]);

  /* =======================================================
     MONTHLY TREND
  ======================================================= */

  const monthlyTrend = useMemo(
    () =>
      financialMonths.map(
        (month) => {
          const monthRows =
            filteredPerformanceRows.filter(
              (row) =>
                getMonth(row) ===
                month.full
            );

          return {
            month: month.short,

            billing:
              getTotalBilling(
                monthRows
              ),

            profit:
              getProfit(
                monthRows
              ),

            loss:
              getLoss(
                monthRows
              ),

            clients:
              getTotalAcquiredClients(
                monthRows
              ),

            placements:
              getTotalPlacements(
                monthRows
              ),

            enquiries:
              getTotalEnquiries(
                monthRows
              )
          };
        }
      ),
    [filteredPerformanceRows]
  );

  /* =======================================================
     BD PERFORMANCE
  ======================================================= */

  const bdPerformance = useMemo(
    () =>
      createGroupedData(
        filteredPerformanceRows,
        getBDMember
      ).slice(0, 15),
    [filteredPerformanceRows]
  );

  /* =======================================================
     TEAM LEADER PERFORMANCE
  ======================================================= */

  const teamLeaderPerformance =
    useMemo(
      () =>
        createGroupedData(
          filteredPerformanceRows,
          getTeamLeader
        ).slice(0, 15),
      [filteredPerformanceRows]
    );

  /* =======================================================
     FINANCIAL PIE
  ======================================================= */

  const financialPieData = useMemo(
    () => [
      {
        name: "Profit",
        value:
          Number(
            overview.profit
          ) || 0
      },
      {
        name: "Loss",
        value:
          Number(
            overview.loss
          ) || 0
      }
    ],
    [
      overview.profit,
      overview.loss
    ]
  );

  /* =======================================================
     INSIGHTS
  ======================================================= */

  const insights = useMemo(() => {
    const bestBillingYear =
      yearlyData.length
        ? yearlyData.reduce(
            (best, current) =>
              !best ||
              current.billing >
                best.billing
                ? current
                : best,
            null
          )
        : null;

    const bestPlacementYear =
      yearlyData.length
        ? yearlyData.reduce(
            (best, current) =>
              !best ||
              current.placements >
                best.placements
                ? current
                : best,
            null
          )
        : null;

    const bestClientYear =
      yearlyData.length
        ? yearlyData.reduce(
            (best, current) =>
              !best ||
              current.clients >
                best.clients
                ? current
                : best,
            null
          )
        : null;

    return {
      bestBillingYear,
      bestPlacementYear,
      bestClientYear,
      bestBD:
        bdPerformance[0] || null,
      bestTeamLeader:
        teamLeaderPerformance[0] ||
        null
    };
  }, [
    yearlyData,
    bdPerformance,
    teamLeaderPerformance
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="year-performance">

      {/* HEADER */}

      <div className="performance-header">
        <div>
          <h1>
            Year Performance
          </h1>

          <p>
            Analysis Period:{" "}
            <strong>
              {analysisPeriod}
            </strong>
          </p>
        </div>
      </div>

      {/* FILTERS */}

      <section className="performance-filter-section">

        <div className="section-heading">
          <div>
            <h2>Filters</h2>

            <p>
              Filter the performance
              analysis
            </p>
          </div>
        </div>

        <div className="performance-filters">

          <div className="performance-filter">
            <label>Year</label>

            <select
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Years
              </option>

              {availableYears.map(
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

          <div className="performance-filter">
            <label>BD Member</label>

            <select
              value={selectedBD}
              onChange={(event) =>
                setSelectedBD(
                  event.target.value
                )
              }
            >
              <option value="All">
                All BD Members
              </option>

              {bdOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="performance-filter">
            <label>
              Team Leader
            </label>

            <select
              value={
                selectedTeamLeader
              }
              onChange={(event) =>
                setSelectedTeamLeader(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Team Leaders
              </option>

              {teamLeaderOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="performance-filter">
            <label>Industry</label>

            <select
              value={
                selectedIndustry
              }
              onChange={(event) =>
                setSelectedIndustry(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Industries
              </option>

              {industryOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="performance-filter">
            <label>
              Info Status
            </label>

            <select
              value={selectedInfo}
              onChange={(event) =>
                setSelectedInfo(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Info Status
              </option>

              {infoOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

        </div>
      </section>

      {/* =================================================
          1. PERFORMANCE OVERVIEW
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>1</span>

          <div>
            <h2>
              Performance Overview
            </h2>

            <p>
              Overall performance
              summary
            </p>
          </div>
        </div>

        <div className="performance-kpi-grid">

          <div className="performance-kpi">
            <span>
              Total Acquired Client
            </span>

            <strong>
              {formatNumber(
                overview.totalAcquiredClients
              )}
            </strong>

            <small>
              Unique Company Name
            </small>
          </div>

          <div className="performance-kpi">
            <span>
              Total Enquiries
            </span>

            <strong>
              {formatNumber(
                overview.totalEnquiries
              )}
            </strong>

            <small>
              Total enquiry rows
            </small>
          </div>

          <div className="performance-kpi">
            <span>
              Total Placement
            </span>

            <strong>
              {formatNumber(
                overview.totalPlacements
              )}
            </strong>

            <small>
              Unique Company Name
              where Info = R
            </small>
          </div>

          <div className="performance-kpi">
            <span>
              Total Billing
            </span>

            <strong className="amount-value">
              {formatCurrency(
                overview.totalBilling
              )}
            </strong>

            <small>
              Sum of Total Bill Amount
            </small>
          </div>

          <div className="performance-kpi">
            <span>
              Profit
            </span>

            <strong className="amount-value profit-value">
              {formatCurrency(
                overview.profit
              )}
            </strong>

            <small>
              Billing where Info = R
            </small>
          </div>

          <div className="performance-kpi">
            <span>
              Loss
            </span>

            <strong className="amount-value loss-value">
              {formatCurrency(
                overview.loss
              )}
            </strong>

            <small>
              Billing where Info = C
            </small>
          </div>

        </div>
      </section>

      {/* =================================================
          2. YEAR-WISE ANALYSIS
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>2</span>

          <div>
            <h2>
              Year-Wise Analysis
            </h2>

            <p>
              Billing, profit and loss
              by financial year
            </p>
          </div>
        </div>

        <div className="performance-chart-card year-wise-chart-card">

          {yearlyData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={yearlyData}
                margin={{
                  top: 30,
                  right: 30,
                  left: 20,
                  bottom: 30
                }}
                barCategoryGap="20%"
                barGap={8}
              >

                <CartesianGrid
                  stroke="#e7dcc8"
                  strokeWidth={1}
                  strokeOpacity={1}
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="year"
                  interval={0}
                  tickMargin={10}
                  axisLine={{
                    stroke: "#c9a227",
                    strokeWidth: 2
                  }}
                  tickLine={{
                    stroke: "#c9a227",
                    strokeWidth: 1
                  }}
                  tick={{
                    fill: "#17365d",
                    fontSize: 13,
                    fontWeight: 600
                  }}
                />

                <YAxis
                  width={90}
                  allowDecimals={false}
                  tickMargin={8}
                  tickFormatter={
                    formatCrore
                  }
                  axisLine={{
                    stroke: "#c9a227",
                    strokeWidth: 2
                  }}
                  tickLine={{
                    stroke: "#c9a227",
                    strokeWidth: 1
                  }}
                  tick={{
                    fill: "#17365d",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                />

                <Tooltip
                  content={
                    <PerformanceTooltip />
                  }
                  cursor={{
                    fill:
                      "rgba(201,162,39,0.08)"
                  }}
                />

                <Legend />

                <Bar
                  dataKey="billing"
                  name="Billing"
                  fill="#2563eb"
                  shape={<VisibleBar />}
                  barSize={28}
                  maxBarSize={40}
                  isAnimationActive={false}
                />

                <Bar
                  dataKey="loss"
                  name="Loss"
                  fill="#dc2626"
                  shape={<VisibleBar />}
                  barSize={28}
                  maxBarSize={40}
                  isAnimationActive={false}
                />

                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#16a34a"
                  shape={<VisibleBar />}
                  barSize={28}
                  maxBarSize={40}
                  isAnimationActive={false}
                />

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <div className="no-data">
              No year-wise data
              available.
            </div>

          )}

        </div>
      </section>

      {/* =================================================
          3. MONTHLY TREND
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>3</span>

          <div>
            <h2>
              Monthly Trend
            </h2>

            <p>
              Billing, profit and loss
              across the financial year
            </p>
          </div>
        </div>

        <div className="performance-chart-card trend-chart-card">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={monthlyTrend}
              margin={{
                top: 30,
                right: 30,
                left: 20,
                bottom: 30
              }}
            >

              <CartesianGrid
                stroke="#e7dcc8"
                strokeWidth={1}
                strokeOpacity={1}
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                interval={0}
                tickMargin={10}
                axisLine={{
                  stroke: "#c9a227",
                  strokeWidth: 2
                }}
                tickLine={{
                  stroke: "#c9a227"
                }}
                tick={{
                  fill: "#17365d",
                  fontSize: 12,
                  fontWeight: 600
                }}
              />

              <YAxis
                width={90}
                allowDecimals={false}
                tickMargin={8}
                tickFormatter={
                  formatCrore
                }
                axisLine={{
                  stroke: "#c9a227",
                  strokeWidth: 2
                }}
                tickLine={{
                  stroke: "#c9a227"
                }}
                tick={{
                  fill: "#17365d",
                  fontSize: 12,
                  fontWeight: 600
                }}
              />

              <Tooltip
                content={
                  <PerformanceTooltip />
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="billing"
                name="Billing"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#2563eb"
                }}
                activeDot={{
                  r: 7,
                  fill: "#2563eb"
                }}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#16a34a"
                }}
                activeDot={{
                  r: 7,
                  fill: "#16a34a"
                }}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="loss"
                name="Loss"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#dc2626"
                }}
                activeDot={{
                  r: 7,
                  fill: "#dc2626"
                }}
                isAnimationActive={false}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <div className="performance-trend-summary">

          <div>
            <span>
              Acquired Clients
            </span>

            <strong>
              {formatNumber(
                overview.totalAcquiredClients
              )}
            </strong>
          </div>

          <div>
            <span>
              Placements
            </span>

            <strong>
              {formatNumber(
                overview.totalPlacements
              )}
            </strong>
          </div>

          <div>
            <span>
              Enquiries
            </span>

            <strong>
              {formatNumber(
                overview.totalEnquiries
              )}
            </strong>
          </div>

        </div>
      </section>

      {/* =================================================
          4. BD PERFORMANCE
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>4</span>

          <div>
            <h2>
              BD Performance
            </h2>

            <p>
              BD performance ranking
            </p>
          </div>
        </div>

        <div className="performance-ranking">

          {bdPerformance.map(
            (item, index) => (
              <div
                className="ranking-row"
                key={item.name}
              >

                <span className="ranking-number">
                  {index + 1}
                </span>

                <div className="ranking-name">

                  <strong>
                    {item.name}
                  </strong>

                  <small>
                    Clients:{" "}
                    {formatNumber(
                      item.clients
                    )}{" "}
                    | Placement:{" "}
                    {formatNumber(
                      item.placements
                    )}
                  </small>

                </div>

                <div className="ranking-value">

                  <strong>
                    {formatCurrency(
                      item.billing
                    )}
                  </strong>

                  <small>
                    Profit:{" "}
                    {formatCurrency(
                      item.profit
                    )}
                  </small>

                </div>

              </div>
            )
          )}

          {!bdPerformance.length && (
            <div className="no-data">
              No BD performance
              data available.
            </div>
          )}

        </div>
      </section>

      {/* =================================================
          5. TEAM LEADER PERFORMANCE
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>5</span>

          <div>
            <h2>
              Team Leader Performance
            </h2>

            <p>
              Team Leader performance
              ranking
            </p>
          </div>
        </div>

        <div className="performance-ranking">

          {teamLeaderPerformance.map(
            (item, index) => (
              <div
                className="ranking-row"
                key={item.name}
              >

                <span className="ranking-number">
                  {index + 1}
                </span>

                <div className="ranking-name">

                  <strong>
                    {item.name}
                  </strong>

                  <small>
                    Clients:{" "}
                    {formatNumber(
                      item.clients
                    )}{" "}
                    | Placement:{" "}
                    {formatNumber(
                      item.placements
                    )}
                  </small>

                </div>

                <div className="ranking-value">

                  <strong>
                    {formatCurrency(
                      item.billing
                    )}
                  </strong>

                  <small>
                    Profit:{" "}
                    {formatCurrency(
                      item.profit
                    )}
                  </small>

                </div>

              </div>
            )
          )}

          {!teamLeaderPerformance.length && (
            <div className="no-data">
              No Team Leader
              performance data
              available.
            </div>
          )}

        </div>
      </section>

      {/* =================================================
          6. FINANCIAL ANALYSIS
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>6</span>

          <div>
            <h2>
              Financial Analysis
            </h2>

            <p>
              Billing, profit and loss
              based on Info status
            </p>
          </div>
        </div>

        <div className="financial-analysis-grid">

          <div>
            <span>
              Total Billing
            </span>

            <strong>
              {formatCurrency(
                overview.totalBilling
              )}
            </strong>

            <small>
              Sum of Total Bill Amount
            </small>
          </div>

          <div>
            <span>
              Profit
            </span>

            <strong className="profit-value">
              {formatCurrency(
                overview.profit
              )}
            </strong>

            <small>
              Info = R
            </small>
          </div>

          <div>
            <span>
              Loss
            </span>

            <strong className="loss-value">
              {formatCurrency(
                overview.loss
              )}
            </strong>

            <small>
              Info = C
            </small>
          </div>

        </div>

        {/* FINANCIAL BAR */}

        <div className="financial-chart-card">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={[
                {
                  name:
                    "Financial Performance",

                  Billing:
                    Number(
                      overview.totalBilling
                    ) || 0,

                  Profit:
                    Number(
                      overview.profit
                    ) || 0,

                  Loss:
                    Number(
                      overview.loss
                    ) || 0
                }
              ]}
              margin={{
                top: 30,
                right: 30,
                left: 20,
                bottom: 30
              }}
              barCategoryGap="20%"
              barGap={8}
            >

              <CartesianGrid
                stroke="#e7dcc8"
                strokeWidth={1}
                strokeOpacity={1}
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tickMargin={10}
                axisLine={{
                  stroke: "#c9a227",
                  strokeWidth: 2
                }}
                tickLine={{
                  stroke: "#c9a227"
                }}
                tick={{
                  fill: "#17365d",
                  fontSize: 12,
                  fontWeight: 600
                }}
              />

              <YAxis
                width={90}
                allowDecimals={false}
                tickMargin={8}
                tickFormatter={
                  formatCrore
                }
                axisLine={{
                  stroke: "#c9a227",
                  strokeWidth: 2
                }}
                tickLine={{
                  stroke: "#c9a227"
                }}
                tick={{
                  fill: "#17365d",
                  fontSize: 12,
                  fontWeight: 600
                }}
              />

              <Tooltip
                formatter={(value) =>
                  formatCurrency(
                    value
                  )
                }
              />

              <Legend />

              <Bar
                dataKey="Billing"
                name="Total Billing"
                fill="#2563eb"
                shape={<VisibleBar />}
                barSize={35}
                maxBarSize={45}
                isAnimationActive={false}
              />

              <Bar
                dataKey="Profit"
                name="Profit"
                fill="#16a34a"
                shape={<VisibleBar />}
                barSize={35}
                maxBarSize={45}
                isAnimationActive={false}
              />

              <Bar
                dataKey="Loss"
                name="Loss"
                fill="#dc2626"
                shape={<VisibleBar />}
                barSize={35}
                maxBarSize={45}
                isAnimationActive={false}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* FINANCIAL PIE */}

        <div className="financial-chart-card">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={financialPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={125}
                innerRadius={55}
                paddingAngle={3}
                label
                isAnimationActive={false}
              >

                {financialPieData.map(
                  (item, index) => (
                    <Cell
                      key={`financial-${item.name}`}
                      fill={
                        FINANCIAL_PIE_COLORS[
                          index
                        ]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip
                formatter={(value) =>
                  formatCurrency(
                    value
                  )
                }
              />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </section>

      {/* =================================================
          7. PERFORMANCE INSIGHTS
      ================================================= */}

      <section className="performance-section">

        <div className="section-heading">
          <span>7</span>

          <div>
            <h2>
              Performance Insights
            </h2>

            <p>
              Key performance indicators
            </p>
          </div>
        </div>

        <div className="performance-insights">

          <div className="insight-card">
            <span>
              Best Performing Year
            </span>

            <strong>
              {insights
                .bestBillingYear
                ?.year || "—"}
            </strong>

            <p>
              {insights.bestBillingYear
                ? formatCurrency(
                    insights
                      .bestBillingYear
                      .billing
                  )
                : "No data"}
            </p>
          </div>

          <div className="insight-card">
            <span>
              Highest Client Acquisition
            </span>

            <strong>
              {insights
                .bestClientYear
                ?.year || "—"}
            </strong>

            <p>
              {insights.bestClientYear
                ? `${formatNumber(
                    insights
                      .bestClientYear
                      .clients
                  )} unique clients`
                : "No data"}
            </p>
          </div>

          <div className="insight-card">
            <span>
              Highest Placement
            </span>

            <strong>
              {insights
                .bestPlacementYear
                ?.year || "—"}
            </strong>

            <p>
              {insights.bestPlacementYear
                ? `${formatNumber(
                    insights
                      .bestPlacementYear
                      .placements
                  )} placements`
                : "No data"}
            </p>
          </div>

          <div className="insight-card">
            <span>
              Best-Performing BD
            </span>

            <strong>
              {insights.bestBD?.name ||
                "—"}
            </strong>

            <p>
              {insights.bestBD
                ? formatCurrency(
                    insights.bestBD
                      .profit
                  )
                : "No data"}
            </p>
          </div>

          <div className="insight-card">
            <span>
              Best Team Leader
            </span>

            <strong>
              {insights
                .bestTeamLeader
                ?.name || "—"}
            </strong>

            <p>
              {insights.bestTeamLeader
                ? formatCurrency(
                    insights
                      .bestTeamLeader
                      .profit
                  )
                : "No data"}
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}