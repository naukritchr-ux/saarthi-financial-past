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
  {
    full: "April",
    short: "Apr",
    month: 4
  },
  {
    full: "May",
    short: "May",
    month: 5
  },
  {
    full: "June",
    short: "Jun",
    month: 6
  },
  {
    full: "July",
    short: "Jul",
    month: 7
  },
  {
    full: "August",
    short: "Aug",
    month: 8
  },
  {
    full: "September",
    short: "Sep",
    month: 9
  },
  {
    full: "October",
    short: "Oct",
    month: 10
  },
  {
    full: "November",
    short: "Nov",
    month: 11
  },
  {
    full: "December",
    short: "Dec",
    month: 12
  },
  {
    full: "January",
    short: "Jan",
    month: 1
  },
  {
    full: "February",
    short: "Feb",
    month: 2
  },
  {
    full: "March",
    short: "Mar",
    month: 3
  }
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

  return Number.isFinite(number)
    ? number
    : 0;
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

const firstValue = (
  row,
  keys = []
) => {
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
   CITY
========================================================= */

const getCity = (row) => {
  return String(
    firstValue(row, [
      "city",
      "City"
    ])
  ).trim();
};


/* =========================================================
   COMPANY NAME
   IMPORTANT:
   Only company_name / Company Name are used for
   acquired-client uniqueness.
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


const getDisplayCompanyName = (row) => {
  return String(
    firstValue(row, [
      "company_name",
      "Company Name"
    ])
  ).trim();
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

  const numericPercentage = toNumber(
    percentage
  );

  if (
    numericPercentage < 0 ||
    numericPercentage > 100
  ) {
    return 0;
  }

  return (
    billing *
    numericPercentage /
    100
  );
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
    const excelEpoch =
      new Date(1899, 11, 30);

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


  /* DD/MM/YYYY or D/M/YYYY */

  let match = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
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

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }


  /* DD-MM-YYYY */

  match = text.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})/
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

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }


  /* YYYY-MM-DD */

  match = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
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

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }


  /* Native JS date parsing */

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
    const year =
      acquiredDate.getFullYear();

    const month =
      acquiredDate.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
    }

    return `${year - 1}-${String(
      year
    ).slice(-2)}`;
  }


  /* Fallback year fields */

  const fallbackYear = firstValue(row, [
    "acquired_year",
    "aquired_year",
    "Aquired Year",
    "Acquired Year"
  ]);

  if (fallbackYear !== "") {
    const match = String(
      fallbackYear
    ).match(/\d{4}/);

    if (match) {
      const year = Number(
        match[0]
      );

      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
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
    getInfoStatus(row) ===
    selectedInfoStatus
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
  const billing =
    getBilling(row);

  const franchiseeShare =
    getFranchiseeShare(row);

  const status =
    getInfoStatus(row);


  /* =======================================================
     ALL / EMPTY
  ======================================================= */

  if (
    !selectedInfoStatus ||
    selectedInfoStatus === "ALL"
  ) {
    const netAmount =
      billing -
      franchiseeShare;

    return {
      billing,
      netAmount,
      franchiseeShare,
      cityExpenditure:
        getCityExpenditure(
          row,
          cityExpenditurePercentage
        )
    };
  }


  /* =======================================================
     R
  ======================================================= */

  if (
    selectedInfoStatus === "R"
  ) {
    if (status !== "R") {
      return {
        billing: 0,
        netAmount: 0,
        franchiseeShare: 0,
        cityExpenditure: 0
      };
    }

    const netAmount =
      billing -
      franchiseeShare;

    return {
      billing,
      netAmount,
      franchiseeShare,
      cityExpenditure:
        getCityExpenditure(
          row,
          cityExpenditurePercentage
        )
    };
  }


  /* =======================================================
     RV / C / CN
  ======================================================= */

  if (
    ["RV", "C", "CN"].includes(
      selectedInfoStatus
    )
  ) {
    if (
      status !== selectedInfoStatus
    ) {
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
      franchiseeShare: 0,
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


const capitalizeWords = (
  value
) => {
  if (!value) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
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

  const value =
    payload[0]?.value;

  const dataKey =
    payload[0]?.dataKey;

  const isBilling =
    dataKey === "billing";

  return (
    <div className="city-modern-tooltip">
      <div className="city-tooltip-label">
        {label}
      </div>

      <div className="city-tooltip-row">
        <span>
          {isBilling
            ? "Total Billing"
            : "Client Acquired"}
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

  /* =======================================================
     IMPORTANT:
     DataContext returns rows, not data.
  ======================================================= */

  const {
    rows = []
  } = useData();


  /* =======================================================
     STATE
  ======================================================= */

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

  const [
    reportFinancialYear,
    setReportFinancialYear
  ] = useState("");

  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("");


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

    const value =
      Number(cityExpenditurePercentage);

    return (
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100
    );
  }, [
    cityExpenditurePercentage
  ]);


  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears = useMemo(() => {
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
            String(a).split("-")[0]
          );

        const yearB =
          Number(
            String(b).split("-")[0]
          );

        return yearA - yearB;
      });
  }, [rows]);


  /* =======================================================
     INFO STATUSES
  ======================================================= */

  const infoStatuses = [
    "R",
    "RV",
    "C",
    "CN"
  ];


  /* =======================================================
     CITY DATA
  ======================================================= */

  const cityData = useMemo(() => {

    const map = new Map();

    rows.forEach(row => {

      const city =
        getCity(row);

      if (!city) {
        return;
      }


      /* Main filters */

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return;
      }

      if (
        !matchesInfoFilter(
          row,
          selectedInfoStatus
        )
      ) {
        return;
      }


      if (!map.has(city)) {
        map.set(city, {
          city,
          clients: new Set(),
          enquiries: 0,
          franchisees: new Set(),
          billing: 0,
          netAmount: 0,
          cityExpenditure: 0
        });
      }


      const item =
        map.get(city);

      /* Every matching row = enquiry */

      item.enquiries += 1;


      /* Unique company */

      const company =
        getCompanyName(row);

      if (company) {
        item.clients.add(
          company
        );
      }


      /* Unique franchisee */

      const franchisee =
        getFranchiseName(row);

      if (franchisee) {
        item.franchisees.add(
          franchisee
        );
      }


      /* Financial values */

      const financial =
        getFinancialValues(
          row,
          selectedInfoStatus,
          cityExpenditurePercentage
        );

      item.billing +=
        financial.billing;

      item.netAmount +=
        financial.netAmount;

      item.cityExpenditure +=
        financial.cityExpenditure;
    });


    return Array.from(
      map.values()
    )
      .map(item => ({
        city: item.city,

        clients:
          item.clients.size,

        enquiries:
          item.enquiries,

        franchisees:
          item.franchisees.size,

        billing:
          item.billing,

        netAmount:
          item.netAmount,

        cityExpenditure:
          item.cityExpenditure
      }))
      .filter(
        item =>
          item.enquiries > 0
      )
      .sort((a, b) => {

        if (
          b.clients !== a.clients
        ) {
          return (
            b.clients -
            a.clients
          );
        }

        if (
          b.billing !== a.billing
        ) {
          return (
            b.billing -
            a.billing
          );
        }

        return a.city.localeCompare(
          b.city
        );
      });

  }, [
    rows,
    selectedFinancialYear,
    selectedInfoStatus,
    cityExpenditurePercentage
  ]);


  /* =======================================================
     SELECTED ROWS
     REPORT FILTERS
  ======================================================= */

  const selectedRows = useMemo(() => {

    if (!selectedCity) {
      return [];
    }

    return rows.filter(row => {

      if (
        getCity(row) !==
        selectedCity
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
        !matchesInfoFilter(
          row,
          reportInfoStatus
        )
      ) {
        return false;
      }


      return true;
    });

  }, [
    rows,
    selectedCity,
    reportFinancialYear,
    reportInfoStatus
  ]);


  /* =======================================================
     PERFORMANCE SUMMARY
  ======================================================= */

  const performanceSummary =
    useMemo(() => {

      let totalBilling = 0;
      let totalNetAmount = 0;
      let totalCityExpenditure = 0;
      let totalFranchiseeShare = 0;


      const companySet =
        new Set();


      const industryMap =
        new Map();


      const cityMap =
        new Map();


      selectedRows.forEach(row => {

        const financial =
          getFinancialValues(
            row,
            reportInfoStatus,
            cityExpenditurePercentage
          );


        totalBilling +=
          financial.billing;

        totalNetAmount +=
          financial.netAmount;

        totalCityExpenditure +=
          financial.cityExpenditure;

        totalFranchiseeShare +=
          financial.franchiseeShare;


        /* Unique clients */

        const company =
          getCompanyName(row);

        if (company) {
          companySet.add(
            company
          );
        }


        /* Best Industry */

        const industry =
          getIndustry(row);

        if (industry && company) {

          if (
            !industryMap.has(
              industry
            )
          ) {
            industryMap.set(
              industry,
              new Set()
            );
          }

          industryMap
            .get(industry)
            .add(company);
        }


        /* City */

        const city =
          getCity(row);

        if (city && company) {

          if (
            !cityMap.has(city)
          ) {
            cityMap.set(
              city,
              new Set()
            );
          }

          cityMap
            .get(city)
            .add(company);
        }
      });


      let bestIndustry = {
        name: "—",
        clients: 0
      };


      industryMap.forEach(
        (clients, industry) => {

          if (
            clients.size >
            bestIndustry.clients
          ) {
            bestIndustry = {
              name: industry,
              clients: clients.size
            };
          }
        }
      );


      let bestCity = {
        name: "—",
        clients: 0
      };


      cityMap.forEach(
        (clients, city) => {

          if (
            clients.size >
            bestCity.clients
          ) {
            bestCity = {
              name: city,
              clients: clients.size
            };
          }
        }
      );


      const grossProfit =
        totalNetAmount -
        totalCityExpenditure;


      const grossMargin =
        totalNetAmount > 0
          ? (
              grossProfit /
              totalNetAmount
            ) * 100
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

        uniqueClients:
          companySet.size,

        totalEnquiries:
          selectedRows.length
      };

    }, [
      selectedRows,
      reportInfoStatus,
      cityExpenditurePercentage
    ]);


  /* =======================================================
     YEARLY REPORT DATA
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
          map.set(year, {
            year,
            clients: new Set(),
            billing: 0
          });
        }


        const item =
          map.get(year);


        const company =
          getCompanyName(row);

        if (company) {
          item.clients.add(
            company
          );
        }


        const financial =
          getFinancialValues(
            row,
            reportInfoStatus,
            cityExpenditurePercentage
          );

        item.billing +=
          financial.billing;
      });


      return Array.from(
        map.values()
      )
        .sort((a, b) => {

          const yearA =
            Number(
              String(a.year)
                .split("-")[0]
            );

          const yearB =
            Number(
              String(b.year)
                .split("-")[0]
            );

          return yearA - yearB;
        })
        .map(item => ({
          year:
            `FY ${item.year}`,

          clients:
            item.clients.size,

          billing:
            item.billing
        }));

    }, [
      selectedRows,
      reportInfoStatus,
      cityExpenditurePercentage
    ]);


  /* =======================================================
     MONTHLY REPORT DATA
  ======================================================= */

  const monthlyReportData =
    useMemo(() => {

      const monthMap =
        new Map();

      financialMonths.forEach(
        month => {

          monthMap.set(
            month.month,
            {
              month:
                month.short,

              full:
                month.full,

              clients:
                new Set(),

              billing:
                0
            }
          );
        }
      );


      selectedRows.forEach(row => {

        const month =
          getMonth(row);

        if (!month) {
          return;
        }


        if (
          reportFinancialYear &&
          getFinancialYear(row) !==
            reportFinancialYear
        ) {
          return;
        }


        const item =
          monthMap.get(month);

        if (!item) {
          return;
        }


        const company =
          getCompanyName(row);

        if (company) {
          item.clients.add(
            company
          );
        }


        const financial =
          getFinancialValues(
            row,
            reportInfoStatus,
            cityExpenditurePercentage
          );

        item.billing +=
          financial.billing;
      });


      return financialMonths.map(
        month => {

          const item =
            monthMap.get(
              month.month
            );

          return {
            month:
              item.month,

            full:
              item.full,

            clients:
              item.clients.size,

            billing:
              item.billing
          };
        }
      );

    }, [
      selectedRows,
      reportFinancialYear,
      reportInfoStatus,
      cityExpenditurePercentage
    ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData =
    useMemo(() => {

      if (
        reportFinancialYear
      ) {
        return monthlyReportData;
      }

      return yearlyReportData;

    }, [
      reportFinancialYear,
      monthlyReportData,
      yearlyReportData
    ]);


  /* =======================================================
     VIEW PERFORMANCE
  ======================================================= */

  const handleViewPerformance = (
    city
  ) => {

    setSelectedCity(city);

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
    setSelectedCity("");
  };


  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {

    if (!selectedCity) {
      return undefined;
    }

    const handleEscape = event => {

      if (
        event.key === "Escape"
      ) {
        handleClosePerformance();
      }
    };


    document.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };

  }, [
    selectedCity
  ]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="city-performance-page">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

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


      {/* ===================================================
          TABLE CARD
      =================================================== */}

      <div className="city-table-card">

        {/* TABLE HEADER */}

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
              {cityData.length}
            </strong>

            <span>
              Cities
            </span>

          </div>

        </div>


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="city-performance-filters">

          {/* Financial Year */}

          <div className="city-filter-group">

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
                    FY {year}
                  </option>
                )
              )}

            </select>

          </div>


          {/* Info Status */}

          <div className="city-filter-group">

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
                All Status
              </option>

              {infoStatuses.map(
                status => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}

            </select>

          </div>


          {/* City Expenditure */}

          <div className="city-filter-group">

            <label>
              City Expenditure %
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Optional"
              value={
                cityExpenditurePercentage
              }
              onChange={event =>
                setCityExpenditurePercentage(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

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
                    City Expenditure
                  </th>
                )}

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {cityData.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      hasCityExpenditurePercentage
                        ? 8
                        : 7
                    }
                    className="city-no-data"
                  >
                    No city performance data
                    available for the selected
                    filters.
                  </td>

                </tr>

              ) : (

                cityData.map(item => (

                  <tr
                    key={item.city}
                  >

                    {/* City */}

                    <td>

                      <div className="city-name-cell">

                        <div className="city-avatar">
                          {item.city
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span>
                          {capitalizeWords(
                            item.city
                          )}
                        </span>

                      </div>

                    </td>


                    {/* Clients */}

                    <td>
                      {item.clients.toLocaleString(
                        "en-IN"
                      )}
                    </td>


                    {/* Enquiries */}

                    <td>
                      {item.enquiries.toLocaleString(
                        "en-IN"
                      )}
                    </td>


                    {/* Franchisees */}

                    <td>
                      {item.franchisees.toLocaleString(
                        "en-IN"
                      )}
                    </td>


                    {/* Billing */}

                    <td>
                      {formatCurrency(
                        item.billing
                      )}
                    </td>


                    {/* Net */}

                    <td>
                      {formatCurrency(
                        item.netAmount
                      )}
                    </td>


                    {/* City Expenditure */}

                    {hasCityExpenditurePercentage && (
                      <td>
                        {formatCurrency(
                          item.cityExpenditure
                        )}
                      </td>
                    )}


                    {/* Performance */}

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
                        <span>
                          View Performance
                        </span>

                        <span className="city-view-arrow">
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

      {selectedCity && (

        <div
          className="city-performance-overlay"
          onMouseDown={event => {

            if (
              event.target ===
              event.currentTarget
            ) {
              handleClosePerformance();
            }

          }}
        >

          <div className="city-performance-modal">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="city-modal-header">

              <div>

                <div className="city-modal-eyebrow">
                  CITY PERFORMANCE
                </div>

                <h2>
                  {capitalizeWords(
                    selectedCity
                  )}
                </h2>

                <p>
                  Detailed performance analysis
                  and financial overview.
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

              {/* Best Industry */}

              <div className="city-summary-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {displayValue(
                    capitalizeWords(
                      performanceSummary
                        .bestIndustry
                        .name
                    )
                  )}
                </strong>

                <small>
                  {
                    performanceSummary
                      .bestIndustry
                      .clients
                  }{" "}
                  unique clients
                </small>

              </div>


              {/* Best City */}

              <div className="city-summary-card">

                <span>
                  Best City
                </span>

                <strong>
                  {displayValue(
                    capitalizeWords(
                      performanceSummary
                        .bestCity
                        .name
                    )
                  )}
                </strong>

                <small>
                  {
                    performanceSummary
                      .bestCity
                      .clients
                  }{" "}
                  unique clients
                </small>

              </div>


              {/* Total Billing */}

              <div className="city-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary
                      .totalBilling
                  )}
                </strong>

                <small>
                  Gross billing
                </small>

              </div>


              {/* City Expenditure */}

              {hasCityExpenditurePercentage && (
                <div className="city-summary-card">

                  <span>
                    City Expenditure
                  </span>

                  <strong>
                    {formatCurrency(
                      performanceSummary
                        .totalCityExpenditure
                    )}
                  </strong>

                  <small>
                    {cityExpenditurePercentage}%
                    of billing
                  </small>

                </div>
              )}


              {/* Net Amount */}

              <div className="city-summary-card">

                <span>
                  Net Amount
                </span>

                <strong>
                  {formatCurrency(
                    performanceSummary
                      .totalNetAmount
                  )}
                </strong>

                <small>
                  After franchisee share
                </small>

              </div>

            </div>


            {/* =================================================
                REPORT CONTROLS
            ================================================= */}

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

                {/* Report Financial Year */}

                <div className="city-filter-group">

                  <label>
                    Financial Year
                  </label>

                  <select
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
                          FY {year}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* Report Info Status */}

                <div className="city-filter-group">

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
                      All Status
                    </option>

                    {infoStatuses.map(
                      status => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

            </div>


            {/* =================================================
                REPORT PERIOD
            ================================================= */}

            <div className="city-report-period">

              <span>
                Report Period
              </span>

              <strong>
                {reportFinancialYear
                  ? `FY ${reportFinancialYear} · Monthly`
                  : "All Financial Years · Yearly"}
              </strong>

            </div>


            {/* =================================================
                GRAPHS
            ================================================= */}

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
                        data={
                          reportData
                        }
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
                            reportFinancialYear
                              ? "month"
                              : "year"
                          }
                          tick={{
                            fontSize: 11
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 11
                          }}
                          axisLine={false}
                          tickLine={false}
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
                            5,
                            5,
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
                        data={
                          reportData
                        }
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
                            reportFinancialYear
                              ? "month"
                              : "year"
                          }
                          tick={{
                            fontSize: 11
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 11
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={value =>
                            `₹${(
                              Number(value || 0) /
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
                            5,
                            5,
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


            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="city-modal-footer">

              <div>

                <strong>
                  {
                    performanceSummary
                      .uniqueClients
                  }
                </strong>

                <span>
                  unique acquired clients
                </span>

                <span className="city-footer-separator">
                  ·
                </span>

                <strong>
                  {
                    performanceSummary
                      .totalEnquiries
                  }
                </strong>

                <span>
                  enquiries
                </span>

              </div>


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
};


export default CityPerformance;