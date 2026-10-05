import React, { useMemo, useState } from "react";

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
    return Number.isFinite(value) ? value : 0;
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

  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return `₹${cleanNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0
    }
  )}`;
}

function formatNumber(value) {
  return cleanNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0
    }
  );
}

/* =========================================================
   FIRST NON-EMPTY VALUE
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

function cleanText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

/* =========================================================
   INFO

   IMPORTANT:
   Profit / Loss / Placement are based on THIS field.
========================================================= */

function getInfoStatus(row) {
  return cleanText(
    firstValue(row, [
      "Info",
      "info",
      "Info Status",
      "info_status",
      "Information Status",
      "information_status"
    ])
  ).toUpperCase();
}

/* =========================================================
   COMPANY NAME

   UNIQUE CLIENT IDENTIFIER
========================================================= */

function getCompanyName(row) {
  return cleanText(
    firstValue(row, [
      "Company Name",
      "company_name",
      "CompanyName",
      "companyName",
      "Company",
      "company",
      "Client Name",
      "client_name",
      "Client",
      "client",
      "TANN",
      "tann"
    ])
  );
}

function getCompanyKey(row) {
  return getCompanyName(row)
    .trim()
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
      "Team Leader",
      "team_leader",
      "teamLeader",
      "TeamLeader",
      "TL",
      "tl",
      "TL Name",
      "Team Leader Name",
      "team leader"
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
   CITY
========================================================= */

function getCity(row) {
  return cleanText(
    firstValue(row, [
      "City",
      "city",
      "City Name",
      "city_name",
      "CityName",
      "Location",
      "location",
      "Branch",
      "branch"
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

  /*
    Excel serial date support
  */
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

      return Number.isNaN(
        date.getTime()
      )
        ? null
        : date;
    }
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  /*
    YYYY-MM-DD
  */
  let match = text.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
  );

  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  /*
    DD/MM/YYYY or DD-MM-YYYY
  */
  match = text.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
  );

  if (match) {
    const date = new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  const date = new Date(text);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

/* =========================================================
   FINANCIAL YEAR

   Database FY is preferred.
   Otherwise calculated from Date Client Acquired.
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

function getFinancialYear(row) {
  const databaseYear = firstValue(row, [
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
    "Acquired Year",
    "Year",
    "year"
  ]);

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

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

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
   MONTH
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

  const numeric =
    Number(text);

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
   TOTAL BILL AMOUNT

   IMPORTANT:
   This is the ONLY amount used for:
   - Total Billing
   - Profit
   - Loss
   - Yearly Billing
   - Historical Billing
========================================================= */

function getTotalBillAmount(row) {
  return cleanNumber(
    firstValue(row, [
      "Total Bill Amount",
      "total_bill_amount",
      "TotalBillAmount",
      "totalBillAmount",
      "Total Bill",
      "total_bill",
      "Billing",
      "billing"
    ])
  );
}

/* =========================================================
   REQUIRED BUSINESS METRICS
========================================================= */

/*
  1. Total Acquired Client
  = UNIQUE Company Name
*/
function getTotalAcquiredClients(rows) {
  return new Set(
    rows
      .map(getCompanyKey)
      .filter(Boolean)
  ).size;
}

/*
  2. Total Enquiries
  = TOTAL ROW COUNT
*/
function getTotalEnquiries(rows) {
  return rows.length;
}

/*
  3. Total Placement
  = UNIQUE Company Name WHERE Info = R
*/
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

/*
  4. Total Billing
  = SUM Total Bill Amount
*/
function getTotalBilling(rows) {
  return rows.reduce(
    (total, row) =>
      total +
      getTotalBillAmount(row),
    0
  );
}

/*
  5. Profit
  = SUM Total Bill Amount WHERE Info = R
*/
function getProfit(rows) {
  return rows.reduce(
    (total, row) => {
      if (
        getInfoStatus(row) === "R"
      ) {
        return (
          total +
          getTotalBillAmount(row)
        );
      }

      return total;
    },
    0
  );
}

/*
  6. Loss
  = SUM Total Bill Amount WHERE Info = C
*/
function getLoss(rows) {
  return rows.reduce(
    (total, row) => {
      if (
        getInfoStatus(row) === "C"
      ) {
        return (
          total +
          getTotalBillAmount(row)
        );
      }

      return total;
    },
    0
  );
}

/* =========================================================
   SORT YEARS
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

    const bill =
      getTotalBillAmount(row);

    const info =
      getInfoStatus(row);

    item.billing += bill;

    if (info === "R") {
      item.profit += bill;

      const company =
        getCompanyKey(row);

      if (company) {
        item.placements.add(
          company
        );
      }
    }

    if (info === "C") {
      item.loss += bill;
    }

    const company =
      getCompanyKey(row);

    if (company) {
      item.clients.add(company);
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
   TOOLTIP
========================================================= */

function HistoricalTooltip({
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
    <div className="historical-tooltip">

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
              className="historical-tooltip-row"
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
    filteredRows = [],
    rows = [],
    data = [],
    allRows = [],
    allData = []
  } = useData();

  /* =======================================================
     DATABASE DATA
  ======================================================= */

  const sourceRows = useMemo(() => {
    const candidates = [
      allRows,
      allData,
      rows,
      data,
      filteredRows
    ];

    return (
      candidates.find(
        (item) =>
          Array.isArray(item) &&
          item.length > 0
      ) || []
    );
  }, [
    allRows,
    allData,
    rows,
    data,
    filteredRows
  ]);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [selectedYear, setSelectedYear] =
    useState("All");

  const [selectedBD, setSelectedBD] =
    useState("All");

  const [
    selectedTeamLeader,
    setSelectedTeamLeader
  ] = useState("All");

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState("All");

  const [selectedInfo, setSelectedInfo] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

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

  const teamLeaderOptions =
    useMemo(
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

  const industryOptions =
    useMemo(
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
     FILTERED HISTORICAL DATA
  ======================================================= */

  const historicalRows = useMemo(() => {
    return sourceRows.filter((row) => {
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
    });
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

  const analysisPeriod = useMemo(() => {
    const years = Array.from(
      new Set(
        historicalRows
          .map(getFinancialYear)
          .filter(Boolean)
      )
    );

    const sorted =
      sortYears(years);

    if (!sorted.length) {
      return "No historical data";
    }

    return `${sorted[0]} to ${
      sorted[sorted.length - 1]
    }`;
  }, [historicalRows]);

  /* =======================================================
     HISTORICAL OVERVIEW

     EXACT BUSINESS RULES
  ======================================================= */

  const overview = useMemo(() => {
    return {
      totalAcquiredClients:
        getTotalAcquiredClients(
          historicalRows
        ),

      totalEnquiries:
        getTotalEnquiries(
          historicalRows
        ),

      totalPlacements:
        getTotalPlacements(
          historicalRows
        ),

      totalBilling:
        getTotalBilling(
          historicalRows
        ),

      profit:
        getProfit(
          historicalRows
        ),

      loss:
        getLoss(
          historicalRows
        )
    };
  }, [historicalRows]);

  /* =======================================================
     YEAR-WISE DATA
  ======================================================= */

  const yearlyData = useMemo(() => {
    const grouped =
      createGroupedData(
        historicalRows,
        getFinancialYear
      );

    return sortYears(
      grouped.map(
        (item) => item.name
      )
    ).map((year) =>
      grouped.find(
        (item) =>
          item.name === year
      )
    );
  }, [historicalRows]);

  /* =======================================================
     MONTHLY TREND

     Uses the same business rules:
     Billing = Total Bill Amount
     Profit = Info R
     Loss = Info C
     Clients = unique Company Name
     Placement = unique Company Name where R
     Enquiries = rows
  ======================================================= */

  const monthlyTrend = useMemo(() => {
    return financialMonths.map(
      (month) => {
        const monthRows =
          historicalRows.filter(
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
    );
  }, [historicalRows]);

  /* =======================================================
     BD PERFORMANCE
  ======================================================= */

  const bdPerformance = useMemo(
    () =>
      createGroupedData(
        historicalRows,
        getBDMember
      ).slice(0, 15),
    [historicalRows]
  );

  /* =======================================================
     TEAM LEADER PERFORMANCE
  ======================================================= */

  const teamLeaderPerformance =
    useMemo(
      () =>
        createGroupedData(
          historicalRows,
          getTeamLeader
        ).slice(0, 15),
      [historicalRows]
    );

  /* =======================================================
     INDUSTRY PERFORMANCE
  ======================================================= */

  const industryPerformance =
    useMemo(
      () =>
        createGroupedData(
          historicalRows,
          getIndustry
        ).slice(0, 15),
      [historicalRows]
    );

  /* =======================================================
     CITY PERFORMANCE
  ======================================================= */

  const cityPerformance = useMemo(
    () =>
      createGroupedData(
        historicalRows,
        getCity
      ).slice(0, 15),
    [historicalRows]
  );

  /* =======================================================
     FINANCIAL PIE DATA
  ======================================================= */

  const financialPieData = useMemo(
    () => [
      {
        name: "Profit",
        value: overview.profit
      },
      {
        name: "Loss",
        value: overview.loss
      }
    ],
    [
      overview.profit,
      overview.loss
    ]
  );

  /* =======================================================
     HISTORICAL INSIGHTS
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
        null,
      strongestIndustry:
        industryPerformance[0] ||
        null
    };
  }, [
    yearlyData,
    bdPerformance,
    teamLeaderPerformance,
    industryPerformance
  ]);

  /* =======================================================
     DETAIL TABLE
  ======================================================= */

  const detailRows = useMemo(() => {
    const search =
      searchTerm
        .trim()
        .toLowerCase();

    return historicalRows
      .filter((row) => {
        if (!search) {
          return true;
        }

        const searchable = [
          getCompanyName(row),
          getFinancialYear(row),
          getBDMember(row),
          getTeamLeader(row),
          getIndustry(row),
          getCity(row),
          getInfoStatus(row)
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          search
        );
      })
      .slice(0, 500);
  }, [
    historicalRows,
    searchTerm
  ]);

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const exportCSV = () => {
    const headers = [
      "Company Name",
      "Financial Year",
      "BD Member",
      "Team Leader",
      "Industry",
      "City",
      "Info",
      "Total Bill Amount",
      "Placement",
      "Profit",
      "Loss"
    ];

    const exportRows =
      historicalRows.map(
        (row) => {
          const billing =
            getTotalBillAmount(
              row
            );

          const info =
            getInfoStatus(row);

          return [
            getCompanyName(row),
            getFinancialYear(row),
            getBDMember(row),
            getTeamLeader(row),
            getIndustry(row),
            getCity(row),
            info,
            billing,
            info === "R"
              ? "Yes"
              : "No",
            info === "R"
              ? billing
              : 0,
            info === "C"
              ? billing
              : 0
          ];
        }
      );

    const csv = [
      headers,
      ...exportRows
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value ?? ""
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "historical-data-analytics.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="historical-analytics">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="historical-header">

        <div>
          <h1>
            Historical Data Analytics
          </h1>

          <p>
            Analysis Period:{" "}
            <strong>
              {analysisPeriod}
            </strong>
          </p>
        </div>

      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <section className="historical-filter-section">

        <div className="section-heading">

          <div>
            <h2>
              Filters
            </h2>
          </div>

        </div>

        <div className="historical-filters">

          {/* YEAR */}

          <div className="historical-filter">

            <label>
              Year
            </label>

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

          {/* BD */}

          <div className="historical-filter">

            <label>
              BD Member
            </label>

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

          {/* TEAM LEADER */}

          <div className="historical-filter">

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

          {/* INDUSTRY */}

          <div className="historical-filter">

            <label>
              Industry
            </label>

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

          {/* INFO */}

          <div className="historical-filter">

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

      {/* ===================================================
          1. HISTORICAL OVERVIEW
      =================================================== */}

      <section className="historical-section">

        <div className="section-heading">

          <span>1</span>

          <div>
            <h2>
              Historical Overview
            </h2>

            <p>
              Overall historical
              performance
            </p>
          </div>

        </div>

        <div className="historical-kpi-grid">

          <div className="historical-kpi">

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

          <div className="historical-kpi">

            <span>
              Total Enquiries
            </span>

            <strong>
              {formatNumber(
                overview.totalEnquiries
              )}
            </strong>

            <small>
              Total rows
            </small>

          </div>

          <div className="historical-kpi">

            <span>
              Total Placement
            </span>

            <strong>
              {formatNumber(
                overview.totalPlacements
              )}
            </strong>

            <small>
              Unique Company Name where
              Info = R
            </small>

          </div>

          <div className="historical-kpi">

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

          <div className="historical-kpi">

            <span>
              Profit
            </span>

            <strong>
              {formatCurrency(
                overview.profit
              )}
            </strong>

            <small>
              Billing where Info = R
            </small>

          </div>

          <div className="historical-kpi">

            <span>
              Loss
            </span>

            <strong>
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

      {/* ===================================================
          2. YEAR-WISE ANALYSIS
      =================================================== */}

      <section className="historical-section">

        <div className="section-heading">

          <span>2</span>

          <div>
            <h2>
              Year-Wise Analysis
            </h2>

            <p>
              Historical comparison by
              financial year
            </p>
          </div>

        </div>

        <div className="historical-chart-card">

          <ResponsiveContainer
            width="100%"
            height={400}
          >

            <BarChart
              data={yearlyData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="year"
              />

              <YAxis
                tickFormatter={
                  formatCurrency
                }
              />

              <Tooltip
                content={
                  <HistoricalTooltip />
                }
              />

              <Legend />

              <Bar
                dataKey="billing"
                name="Billing"
              />

              <Bar
                dataKey="profit"
                name="Profit"
              />

              <Bar
                dataKey="loss"
                name="Loss"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="historical-year-cards">

          {yearlyData.map(
            (year) => (
              <div
                className="historical-year-card"
                key={year.year}
              >

                <strong>
                  FY {year.year}
                </strong>

                <span>
                  Clients:{" "}
                  {formatNumber(
                    year.clients
                  )}
                </span>

                <span>
                  Placement:{" "}
                  {formatNumber(
                    year.placements
                  )}
                </span>

                <span>
                  Enquiries:{" "}
                  {formatNumber(
                    year.enquiries
                  )}
                </span>

                <span>
                  Billing:{" "}
                  {formatCurrency(
                    year.billing
                  )}
                </span>

                <span>
                  Profit:{" "}
                  {formatCurrency(
                    year.profit
                  )}
                </span>

                <span>
                  Loss:{" "}
                  {formatCurrency(
                    year.loss
                  )}
                </span>

              </div>
            )
          )}

        </div>

      </section>

      {/* ===================================================
          3. HISTORICAL TRENDS
      =================================================== */}

      <section className="historical-section">

        <div className="section-heading">

          <span>3</span>

          <div>
            <h2>
              Historical Trends
            </h2>

            <p>
              Client acquisition,
              placement, billing,
              profit and loss
            </p>
          </div>

        </div>

        <div className="historical-chart-card">

          <ResponsiveContainer
            width="100%"
            height={420}
          >

            <LineChart
              data={monthlyTrend}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
              />

              <YAxis
                tickFormatter={
                  formatCurrency
                }
              />

              <Tooltip
                content={
                  <HistoricalTooltip />
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="billing"
                name="Billing"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="loss"
                name="Loss"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <div className="historical-trend-summary">

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

      {/* ===================================================
          4. BD PERFORMANCE
          5. TEAM LEADER PERFORMANCE
      =================================================== */}

      <div className="historical-two-column">

        <section className="historical-section">

          <div className="section-heading">

            <span>4</span>

            <div>
              <h2>
                BD Performance
              </h2>

              <p>
                Historical ranking
              </p>
            </div>

          </div>

          <div className="historical-ranking">

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
                No BD performance data
                available.
              </div>
            )}

          </div>

        </section>

        <section className="historical-section">

          <div className="section-heading">

            <span>5</span>

            <div>
              <h2>
                Team Leader Performance
              </h2>

              <p>
                Historical ranking
              </p>
            </div>

          </div>

          <div className="historical-ranking">

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

      </div>

      {/* ===================================================
          6. INDUSTRY ANALYSIS
          7. CITY ANALYSIS
      =================================================== */}

      <div className="historical-two-column">

        <section className="historical-section">

          <div className="section-heading">

            <span>6</span>

            <div>
              <h2>
                Industry Analysis
              </h2>

              <p>
                Industry contribution
                and billing
              </p>
            </div>

          </div>

          <div className="historical-chart-card">

            <ResponsiveContainer
              width="100%"
              height={400}
            >

              <BarChart
                data={
                  industryPerformance
                }
                layout="vertical"
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  tickFormatter={
                    formatCurrency
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                />

                <Tooltip
                  content={
                    <HistoricalTooltip />
                  }
                />

                <Bar
                  dataKey="billing"
                  name="Billing"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

        <section className="historical-section">

          <div className="section-heading">

            <span>7</span>

            <div>
              <h2>
                City / Location
                Analysis
              </h2>

              <p>
                Client distribution
                and billing
              </p>
            </div>

          </div>

          <div className="historical-ranking">

            {cityPerformance.map(
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

                  <strong>
                    {formatCurrency(
                      item.billing
                    )}
                  </strong>

                </div>
              )
            )}

            {!cityPerformance.length && (
              <div className="no-data">
                No city/location data
                available.
              </div>
            )}

          </div>

        </section>

      </div>

      {/* ===================================================
          8. FINANCIAL ANALYSIS
      =================================================== */}

      <section className="historical-section">

        <div className="section-heading">

          <span>8</span>

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

            <strong>
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

            <strong>
              {formatCurrency(
                overview.loss
              )}
            </strong>

            <small>
              Info = C
            </small>
          </div>

        </div>

        <div className="financial-chart-card">

          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <BarChart
              data={[
                {
                  name: "Historical Financials",
                  Billing:
                    overview.totalBilling,
                  Profit:
                    overview.profit,
                  Loss:
                    overview.loss
                }
              ]}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
              />

              <YAxis
                tickFormatter={
                  formatCurrency
                }
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="Billing"
                name="Total Billing"
              />

              <Bar
                dataKey="Profit"
                name="Profit"
              />

              <Bar
                dataKey="Loss"
                name="Loss"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="historical-chart-card">

          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <PieChart>

              <Pie
                data={
                  financialPieData
                }
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >

                {financialPieData.map(
                  (_, index) => (
                    <Cell
                      key={`financial-${index}`}
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

      {/* ===================================================
          9. HISTORICAL INSIGHTS
      =================================================== */}

      <section className="historical-section">

        <div className="section-heading">

          <span>9</span>

          <div>
            <h2>
              Historical Insights
            </h2>

            <p>
              Key historical performance
              indicators
            </p>
          </div>

        </div>

        <div className="historical-insights">

          <div className="insight-card">

            <span>
              Best Historical Year
            </span>

            <strong>
              {insights
                .bestBillingYear
                ?.name || "—"}
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
              Highest Client
              Acquisition
            </span>

            <strong>
              {insights
                .bestClientYear
                ?.name || "—"}
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
                ?.name || "—"}
            </strong>

            <p>
              {insights
                .bestPlacementYear
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

          <div className="insight-card">

            <span>
              Strongest Industry
            </span>

            <strong>
              {insights
                .strongestIndustry
                ?.name || "—"}
            </strong>

            <p>
              {insights.strongestIndustry
                ? formatCurrency(
                    insights
                      .strongestIndustry
                      .billing
                  )
                : "No data"}
            </p>

          </div>

        </div>

      </section>

      {/* ===================================================
          10. DETAILED HISTORICAL DATA
      =================================================== */}

      <section className="historical-section">

        <div className="section-heading">

          <span>10</span>

          <div>
            <h2>
              Detailed Historical Data
            </h2>

            <p>
              Search, filter, sort and
              export historical records
            </p>
          </div>

        </div>

        <div className="detail-toolbar">

          <input
            type="text"
            placeholder="Search company, BD, team leader, industry, city..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <span>
            Showing{" "}
            <strong>
              {formatNumber(
                detailRows.length
              )}
            </strong>{" "}
            records
          </span>

          <button
            type="button"
            onClick={exportCSV}
          >
            Export CSV
          </button>

        </div>

        <div className="historical-table-wrapper">

          <table className="historical-table">

            <thead>

              <tr>
                <th>
                  Company
                </th>

                <th>
                  Year
                </th>

                <th>
                  BD
                </th>

                <th>
                  Team Leader
                </th>

                <th>
                  Industry
                </th>

                <th>
                  City
                </th>

                <th>
                  Info
                </th>

                <th>
                  Total Bill Amount
                </th>

                <th>
                  Placement
                </th>

                <th>
                  Profit
                </th>

                <th>
                  Loss
                </th>
              </tr>

            </thead>

            <tbody>

              {detailRows.map(
                (row, index) => {
                  const billing =
                    getTotalBillAmount(
                      row
                    );

                  const info =
                    getInfoStatus(row);

                  return (
                    <tr
                      key={
                        row.id ||
                        row.ID ||
                        row._id ||
                        index
                      }
                    >

                      <td>
                        <strong>
                          {getCompanyName(
                            row
                          ) || "—"}
                        </strong>
                      </td>

                      <td>
                        {getFinancialYear(
                          row
                        ) || "—"}
                      </td>

                      <td>
                        {getBDMember(
                          row
                        ) || "—"}
                      </td>

                      <td>
                        {getTeamLeader(
                          row
                        ) || "—"}
                      </td>

                      <td>
                        {getIndustry(
                          row
                        ) || "—"}
                      </td>

                      <td>
                        {getCity(
                          row
                        ) || "—"}
                      </td>

                      <td>
                        {info || "—"}
                      </td>

                      <td>
                        {formatCurrency(
                          billing
                        )}
                      </td>

                      <td>
                        {info === "R"
                          ? "Yes"
                          : "No"}
                      </td>

                      <td>
                        {formatCurrency(
                          info === "R"
                            ? billing
                            : 0
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          info === "C"
                            ? billing
                            : 0
                        )}
                      </td>

                    </tr>
                  );
                }
              )}

              {!detailRows.length && (
                <tr>

                  <td
                    colSpan="11"
                    className="no-data-cell"
                  >
                    No historical data
                    available for the
                    selected filters.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}