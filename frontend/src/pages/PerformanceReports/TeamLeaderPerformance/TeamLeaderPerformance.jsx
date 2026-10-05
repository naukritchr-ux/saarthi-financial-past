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

  if (!cleaned) {
    return 0;
  }

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
   UNIQUE CLIENT IDENTIFIER
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
    firstValue(row, [
      "industry",
      "Industry"
    ])
  ).trim();
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

const getTLExpenditure = (
  row,
  percentage
) => {
  const billing = getBilling(row);

  const percent = toNumber(percentage);

  if (
    !Number.isFinite(percent) ||
    percent < 0
  ) {
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

   Handles:
   YYYY-MM-DD
   DD/MM/YYYY
   DD-MM-YYYY
   Date objects
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

  const text = String(value).trim();

  if (!text) {
    return null;
  }


  /* YYYY-MM-DD */

  const isoMatch = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
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

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }


  /* DD/MM/YYYY */

  const slashMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

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

  const dashMatch = text.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})/
  );

  if (dashMatch) {
    const day = Number(dashMatch[1]);
    const month = Number(dashMatch[2]);
    const year = Number(dashMatch[3]);

    const date = new Date(
      year,
      month - 1,
      day
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }


  /* Normal Date parsing */

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? null
    : date;
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
    "Aquired Year",
    "Acquired Year"
  ]);

  if (fallbackYear) {
    const year = Number(
      String(fallbackYear).match(/\d{4}/)?.[0]
    );

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
  const date = parseDate(
    getClientAcquiredDate(row)
  );

  if (!date) {
    return null;
  }

  return date.getMonth() + 1;
};


/* =========================================================
   CHECK INFO STATUS FILTER
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
  infoFilter = "",
  percentage = ""
) => {
  const info = getInfoStatus(row);

  const billing = getBilling(row);

  const franchiseeShare =
    getFranchiseeShare(row);

  const tlExpenditure =
    getTLExpenditure(
      row,
      percentage
    );


  /* ALL */

  if (
    !infoFilter ||
    infoFilter === "ALL"
  ) {
    return {
      billing,
      netAmount:
        billing - franchiseeShare,
      franchiseeShare,
      tlExpenditure
    };
  }


  /* R */

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
      netAmount:
        billing - franchiseeShare,
      franchiseeShare,
      tlExpenditure
    };
  }


  /* RV / C / CN */

  if (
    infoFilter === "RV" ||
    infoFilter === "C" ||
    infoFilter === "CN"
  ) {
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
   DISPLAY NAME HELPERS
========================================================= */

const displayValue = (value) => {
  if (!value) {
    return "—";
  }

  return value;
};


const capitalizeWords = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .split(" ")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};


/* =========================================================
   TOOLTIP
========================================================= */

const TLTooltip = ({
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

  return (
    <div className="tl-modern-tooltip">

      <div className="tl-tooltip-label">
        {label}
      </div>

      {payload.map(
        (item, index) => {
          const isBilling =
            item.dataKey === "billing";

          return (
            <div
              className="tl-tooltip-row"
              key={`${item.dataKey}-${index}`}
            >
              <span>
                {item.name}
              </span>

              <strong>
                {isBilling
                  ? formatCurrency(item.value)
                  : Number(item.value || 0).toLocaleString("en-IN")}
              </strong>
            </div>
          );
        }
      )}

    </div>
  );
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

const TeamLeaderPerformance = () => {

  const {
    rows = []
  } = useData();


  /* =======================================================
     MAIN PAGE FILTERS
  ======================================================= */

  const [
    selectedLeader,
    setSelectedLeader
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
    tlExpenditurePercentage,
    setTlExpenditurePercentage
  ] = useState("");


  /* =======================================================
     MODAL REPORT FILTERS
  ======================================================= */

  const [
    reportFinancialYear,
    setReportFinancialYear
  ] = useState("");

  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("");


  /* =======================================================
     TL EXPENDITURE VALIDATION
  ======================================================= */

  const hasTLExpenditurePercentage =
    tlExpenditurePercentage !== "" &&
    Number.isFinite(
      Number(tlExpenditurePercentage)
    ) &&
    Number(tlExpenditurePercentage) >= 0 &&
    Number(tlExpenditurePercentage) <= 100;


  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach(row => {

      const fy =
        getFinancialYear(row);

      if (fy) {
        years.add(fy);
      }

    });

    return Array.from(years)
      .sort((a, b) => {
        return (
          Number(a.slice(0, 4)) -
          Number(b.slice(0, 4))
        );
      });

  }, [rows]);


  /* =======================================================
     INFO STATUS OPTIONS
  ======================================================= */

  const infoStatuses = [
    "R",
    "RV",
    "C",
    "CN"
  ];


  /* =======================================================
     TEAM LEADER DATA
  ======================================================= */

  const leaderData = useMemo(() => {

    const map = new Map();


    rows.forEach(row => {

      const leader =
        getTeamLeader(row);

      if (!leader) {
        return;
      }


      /* Financial Year filter */

      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return;
      }


      /* Info Status filter */

      if (
        !matchesInfoFilter(
          row,
          selectedInfoStatus
        )
      ) {
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


      const data =
        map.get(leader);


      /* Total enquiries */

      data.enquiries += 1;


      /* Unique acquired client */

      const companyName =
        getCompanyName(row);

      if (companyName) {
        data.clients.add(
          companyName
        );
      }


      /* Unique franchisee */

      const franchiseName =
        getFranchiseName(row);

      if (franchiseName) {
        data.franchisees.add(
          franchiseName
        );
      }


      /* Financial values */

      const financial =
        getFinancialValues(
          row,
          selectedInfoStatus,
          tlExpenditurePercentage
        );

      data.billing +=
        financial.billing;

      data.netAmount +=
        financial.netAmount;

      data.tlExpenditure +=
        financial.tlExpenditure;

    });


    return Array.from(map.values())
      .map(item => ({
        ...item,
        clients:
          item.clients.size,
        franchisees:
          item.franchisees.size
      }))
      .filter(
        item => item.enquiries > 0
      )
      .sort(
        (a, b) =>
          b.clients - a.clients ||
          b.billing - a.billing ||
          a.leader.localeCompare(
            b.leader
          )
      );

  }, [
    rows,
    selectedFinancialYear,
    selectedInfoStatus,
    tlExpenditurePercentage
  ]);


  /* =======================================================
     SELECTED LEADER ROWS
  ======================================================= */

  const selectedRows = useMemo(() => {

    if (!selectedLeader) {
      return [];
    }

    return rows.filter(row => {

      if (
        getTeamLeader(row) !==
        selectedLeader
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
    selectedLeader,
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
      let totalTLExpenditure = 0;
      let totalFranchiseeShare = 0;


      selectedRows.forEach(row => {

        const financial =
          getFinancialValues(
            row,
            reportInfoStatus,
            tlExpenditurePercentage
          );


        totalBilling +=
          financial.billing;

        totalNetAmount +=
          financial.netAmount;

        totalTLExpenditure +=
          financial.tlExpenditure;


        if (
          !reportInfoStatus ||
          reportInfoStatus === "ALL" ||
          reportInfoStatus === "R"
        ) {
          totalFranchiseeShare +=
            financial.franchiseeShare;
        }

      });


      const grossProfit =
        totalNetAmount -
        totalTLExpenditure;


      const grossMargin =
        totalNetAmount !== 0
          ? (
              grossProfit /
              totalNetAmount
            ) * 100
          : 0;


      /* ================================================
         BEST INDUSTRY
      ================================================= */

      const industryMap =
        new Map();


      selectedRows.forEach(row => {

        const industry =
          getIndustry(row);

        const company =
          getCompanyName(row);


        if (
          !industry ||
          !company
        ) {
          return;
        }


        if (!industryMap.has(industry)) {
          industryMap.set(
            industry,
            new Set()
          );
        }


        industryMap
          .get(industry)
          .add(company);

      });


      let bestIndustry = "";
      let bestIndustryCount = 0;


      industryMap.forEach(
        (companies, industry) => {

          if (
            companies.size >
            bestIndustryCount
          ) {
            bestIndustry =
              industry;

            bestIndustryCount =
              companies.size;
          }

        }
      );


      /* ================================================
         BEST CITY
      ================================================= */

      const cityMap =
        new Map();


      selectedRows.forEach(row => {

        const city =
          getCity(row);

        const company =
          getCompanyName(row);


        if (
          !city ||
          !company
        ) {
          return;
        }


        if (!cityMap.has(city)) {
          cityMap.set(
            city,
            new Set()
          );
        }


        cityMap
          .get(city)
          .add(company);

      });


      let bestCity = "";
      let bestCityCount = 0;


      cityMap.forEach(
        (companies, city) => {

          if (
            companies.size >
            bestCityCount
          ) {
            bestCity =
              city;

            bestCityCount =
              companies.size;
          }

        }
      );


      /* ================================================
         UNIQUE ACQUIRED CLIENT COUNT
      ================================================= */

      const uniqueClients =
        new Set();


      selectedRows.forEach(row => {

        const company =
          getCompanyName(row);

        if (company) {
          uniqueClients.add(
            company
          );
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
        uniqueClients:
          uniqueClients.size,
        totalEnquiries:
          selectedRows.length
      };

    }, [
      selectedRows,
      reportInfoStatus,
      tlExpenditurePercentage
    ]);


  /* =======================================================
     YEARLY REPORT
     UNIQUE COMPANY COUNT
  ======================================================= */

  const yearlyReportData = useMemo(() => {

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


      const data =
        map.get(year);


      const company =
        getCompanyName(row);

      if (company) {
        data.clients.add(
          company
        );
      }


      const financial =
        getFinancialValues(
          row,
          reportInfoStatus,
          tlExpenditurePercentage
        );


      data.billing +=
        financial.billing;

    });


    return Array.from(map.values())
      .sort(
        (a, b) =>
          Number(a.year.slice(0, 4)) -
          Number(b.year.slice(0, 4))
      )
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
    tlExpenditurePercentage
  ]);


  /* =======================================================
     MONTHLY REPORT
     UNIQUE COMPANY COUNT PER MONTH
  ======================================================= */

  const monthlyReportData = useMemo(() => {

    const map = new Map();


    financialMonths.forEach(month => {

      map.set(
        month.month,
        {
          month:
            month.short,
          clients:
            new Set(),
          billing:
            0
        }
      );

    });


    selectedRows.forEach(row => {

      const month =
        getMonth(row);

      if (!month) {
        return;
      }


      const financialYear =
        getFinancialYear(row);


      if (
        reportFinancialYear &&
        financialYear !==
        reportFinancialYear
      ) {
        return;
      }


      const data =
        map.get(month);

      if (!data) {
        return;
      }


      const company =
        getCompanyName(row);

      if (company) {
        data.clients.add(
          company
        );
      }


      const financial =
        getFinancialValues(
          row,
          reportInfoStatus,
          tlExpenditurePercentage
        );


      data.billing +=
        financial.billing;

    });


    return financialMonths.map(
      month => {

        const data =
          map.get(month.month);

        return {
          month:
            month.short,
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
    tlExpenditurePercentage
  ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData = useMemo(() => {

    if (reportFinancialYear) {
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
    leader
  ) => {

    setSelectedLeader(leader);

    /*
      Modal starts with the same filters
      currently selected on the main page.
    */

    setReportFinancialYear(
      selectedFinancialYear
    );

    setReportInfoStatus(
      selectedInfoStatus
    );

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


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, [selectedLeader]);


  /* =======================================================
     AVATAR INITIAL
  ======================================================= */

  const getInitial = (
    name
  ) => {

    if (!name) {
      return "?";
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="tl-performance-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="tl-page-header">

        <div>

          <div className="tl-page-eyebrow">
            PERFORMANCE
          </div>

          <h1>
            Team Leader Performance
          </h1>

          <p>
            Track acquired clients,
            enquiries and financial
            performance by team leader.
          </p>

        </div>

      </div>


      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <div className="tl-table-card">

        <div className="tl-table-header">

          <div>

            <h2>
              Team Leader Overview
            </h2>

            <p>
              Performance summary based
              on the selected filters.
            </p>

          </div>

          <div className="tl-member-count">

            {leaderData.length}

            <span>
              Team Leaders
            </span>

          </div>

        </div>


        {/* ===================================================
            MAIN FILTERS
        =================================================== */}

        <div className="tl-performance-filters">

          {/* Financial Year */}

          <div className="tl-filter-group">

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

          <div className="tl-filter-group">

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
                All Info Status
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


          {/* TL Expenditure */}

          <div className="tl-filter-group">

            <label>
              TL Expenditure %
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                tlExpenditurePercentage
              }
              onChange={event => {

                const value =
                  event.target.value;

                if (
                  value === "" ||
                  (
                    Number(value) >= 0 &&
                    Number(value) <= 100
                  )
                ) {
                  setTlExpenditurePercentage(
                    value
                  );
                }

              }}
              placeholder="e.g. 10"
            />

          </div>

        </div>


        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="tl-table-wrapper">

          <table className="tl-performance-table">

            <thead>

              <tr>

                <th>
                  Team Leader
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

                {hasTLExpenditurePercentage && (
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

              {leaderData.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      hasTLExpenditurePercentage
                        ? 8
                        : 7
                    }
                    className="tl-empty"
                  >
                    No team leader
                    performance data found
                    for the selected filters.
                  </td>

                </tr>

              ) : (

                leaderData.map(
                  leader => (

                    <tr
                      key={leader.leader}
                    >

                      {/* Team Leader */}

                      <td>

                        <div className="tl-name">

                          <span className="tl-avatar">
                            {getInitial(
                              leader.leader
                            )}
                          </span>

                          <span>
                            {leader.leader}
                          </span>

                        </div>

                      </td>


                      {/* Acquired Clients */}

                      <td>

                        <span className="tl-client-count">
                          {leader.clients.toLocaleString(
                            "en-IN"
                          )}
                        </span>

                      </td>


                      {/* Enquiries */}

                      <td>

                        {leader.enquiries.toLocaleString(
                          "en-IN"
                        )}

                      </td>


                      {/* Franchisees */}

                      <td>

                        {leader.franchisees.toLocaleString(
                          "en-IN"
                        )}

                      </td>


                      {/* Billing */}

                      <td>

                        <span className="tl-billing-value">
                          {formatCurrency(
                            leader.billing
                          )}
                        </span>

                      </td>


                      {/* Net Amount */}

                      <td>

                        <span className="tl-net-value">
                          {formatCurrency(
                            leader.netAmount
                          )}
                        </span>

                      </td>


                      {/* TL Expenditure */}

                      {hasTLExpenditurePercentage && (
                        <td>

                          <span className="tl-expenditure-value">
                            {formatCurrency(
                              leader.tlExpenditure
                            )}
                          </span>

                        </td>
                      )}


                      {/* Performance */}

                      <td>

                        <button
                          type="button"
                          className="tl-view-performance-btn"
                          onClick={() =>
                            handleViewPerformance(
                              leader.leader
                            )
                          }
                        >

                          View Performance

                          <span className="tl-view-arrow">
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


      {/* =====================================================
          PERFORMANCE MODAL
      ===================================================== */}

      {selectedLeader && (

        <div
          className="tl-performance-overlay"
          onMouseDown={event => {

            if (
              event.target ===
              event.currentTarget
            ) {
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

            {/* ===============================================
                MODAL HEADER
            =============================================== */}

            <div className="tl-modal-header">

              <div>

                <div className="tl-modal-eyebrow">
                  TEAM LEADER PERFORMANCE
                </div>

                <h2 id="tl-performance-title">
                  {selectedLeader}
                </h2>

                <p>
                  Detailed performance
                  analysis and financial
                  overview.
                </p>

              </div>


              <button
                type="button"
                className="tl-modal-close"
                onClick={
                  handleClosePerformance
                }
                aria-label="Close performance"
              >
                ×
              </button>

            </div>


            {/* ===============================================
                SUMMARY
            =============================================== */}

            <div className="tl-summary-grid">

              {/* Best Industry */}

              <div className="tl-summary-card">

                <span className="tl-summary-label">
                  Best Industry
                </span>

                <span className="tl-summary-text">
                  {capitalizeWords(
                    performanceSummary.bestIndustry
                  )}
                </span>

                <small>
                  {performanceSummary.bestIndustryCount.toLocaleString(
                    "en-IN"
                  )} acquired client
                  {performanceSummary.bestIndustryCount === 1
                    ? ""
                    : "s"}
                </small>

              </div>


              {/* Best City */}

              <div className="tl-summary-card">

                <span className="tl-summary-label">
                  Best City
                </span>

                <span className="tl-summary-text">
                  {capitalizeWords(
                    performanceSummary.bestCity
                  )}
                </span>

                <small>
                  {performanceSummary.bestCityCount.toLocaleString(
                    "en-IN"
                  )} acquired client
                  {performanceSummary.bestCityCount === 1
                    ? ""
                    : "s"}
                </small>

              </div>


              {/* Billing */}

              <div className="tl-summary-card">

                <span className="tl-summary-label">
                  Total Billing
                </span>

                <span className="tl-summary-value">
                  {formatCurrency(
                    performanceSummary.totalBilling
                  )}
                </span>

                <small>
                  Selected period
                </small>

              </div>


              {/* TL Expenditure */}

              {hasTLExpenditurePercentage && (

                <div className="tl-summary-card">

                  <span className="tl-summary-label">
                    TL Expenditure
                  </span>

                  <span className="tl-summary-value">
                    {formatCurrency(
                      performanceSummary.totalTLExpenditure
                    )}
                  </span>

                  <small>
                    {Number(
                      tlExpenditurePercentage
                    ).toFixed(2)}%
                    of billing
                  </small>

                </div>

              )}


              {/* Net Amount */}

              <div className="tl-summary-card tl-summary-net">

                <span className="tl-summary-label">
                  Net Amount
                </span>

                <span className="tl-summary-value">
                  {formatCurrency(
                    performanceSummary.totalNetAmount
                  )}
                </span>

                <small>
                  After franchisee share
                </small>

              </div>

            </div>


            {/* ===============================================
                REPORT CONTROLS
            =============================================== */}

            <div className="tl-report-controls">

              <div className="tl-report-filter-row">

                {/* Report Financial Year */}

                <div className="tl-filter-group">

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

                <div className="tl-filter-group">

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
                      All Info Status
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


              <div className="tl-report-period">

                <span>
                  Report Period
                </span>

                <strong>
                  {reportFinancialYear
                    ? `FY ${reportFinancialYear} · Monthly`
                    : "All Financial Years · Yearly"}
                </strong>

              </div>

            </div>


            {/* ===============================================
                GRAPHS
            =============================================== */}

            <div className="tl-report-graphs">

              {/* =============================================
                  CLIENT CHART
              ============================================= */}

              <div className="tl-chart-card">

                <div className="tl-chart-heading">

                  <div>

                    <span className="tl-chart-indicator tl-client-indicator" />

                    <h3>
                      Client Acquired
                    </h3>

                  </div>

                  <span>
                    Unique Companies
                  </span>

                </div>


                <div className="tl-chart-container">

                  {reportData.length === 0 ? (

                    <div className="tl-no-chart-data">
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
                          dataKey={
                            reportFinancialYear
                              ? "month"
                              : "year"
                          }
                          tick={{
                            fontSize: 10
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 10
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={
                            <TLTooltip />
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


              {/* =============================================
                  BILLING CHART
              ============================================= */}

              <div className="tl-chart-card">

                <div className="tl-chart-heading">

                  <div>

                    <span className="tl-chart-indicator tl-billing-indicator" />

                    <h3>
                      Total Billing
                    </h3>

                  </div>

                  <span>
                    INR
                  </span>

                </div>


                <div className="tl-chart-container">

                  {reportData.length === 0 ? (

                    <div className="tl-no-chart-data">
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
                          dataKey={
                            reportFinancialYear
                              ? "month"
                              : "year"
                          }
                          tick={{
                            fontSize: 10
                          }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 10
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
                              ).toFixed(1)}L`;
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
                            <TLTooltip />
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


            {/* ===============================================
                FOOTER
            =============================================== */}

            <div className="tl-modal-footer">

              <span>
                {performanceSummary.uniqueClients.toLocaleString(
                  "en-IN"
                )} unique acquired client
                {performanceSummary.uniqueClients === 1
                  ? ""
                  : "s"}{" "}
                ·{" "}
                {performanceSummary.totalEnquiries.toLocaleString(
                  "en-IN"
                )} enquiries
              </span>

              <button
                type="button"
                className="tl-footer-close"
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


export default TeamLeaderPerformance;