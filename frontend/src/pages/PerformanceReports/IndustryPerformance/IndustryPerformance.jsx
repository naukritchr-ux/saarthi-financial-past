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

import "./IndustryPerformance.css";


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
   BASIC HELPERS
========================================================= */

const normalizeValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};


const normalizeCompanyKey = (value) => {
  return normalizeValue(value)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};


const toNumber = (value) => {
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

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
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
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(
      Date.UTC(1899, 11, 30)
    );

    const date = new Date(
      excelEpoch.getTime() +
      value * 86400000
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }


  /* DD/MM/YYYY or DD-MM-YYYY */

  let match = stringValue.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
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
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }


  /* YYYY-MM-DD */

  match = stringValue.match(
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

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }


  /* Native date parsing */

  const parsed = new Date(stringValue);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
};


const getFinancialYear = (row) => {
  const dateValue = getClientAcquiredDate(row);
  const date = parseDate(dateValue);

  if (date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${year + 1}`;
    }

    return `${year - 1}-${year}`;
  }


  /* Fallback year fields */

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
    const yearMatch = String(
      fallbackYear
    ).match(/\d{4}/);

    if (yearMatch) {
      const year = Number(
        yearMatch[0]
      );

      return `${year}-${year + 1}`;
    }
  }

  return "";
};


const getMonth = (row) => {
  const date = parseDate(
    getClientAcquiredDate(row)
  );

  if (!date) {
    return "";
  }

  return date.getMonth() + 1;
};


/* =========================================================
   FILTER HELPERS
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

const getIndustryExpenditure = (
  row,
  percentage
) => {
  const billing = getBilling(row);

  const numericPercentage =
    Number(percentage);

  if (
    !Number.isFinite(numericPercentage) ||
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


const getFinancialValues = (
  row,
  selectedInfoStatus,
  expenditurePercentage
) => {
  const billing = getBilling(row);

  const franchiseeShare =
    getFranchiseeShare(row);

  const expenditure =
    getIndustryExpenditure(
      row,
      expenditurePercentage
    );

  const status = getInfoStatus(row);


  /* ALL */

  if (
    !selectedInfoStatus ||
    selectedInfoStatus === "ALL"
  ) {
    return {
      billing,
      franchiseeShare,
      expenditure,
      net:
        billing -
        franchiseeShare -
        expenditure
    };
  }


  /* R */

  if (
    selectedInfoStatus === "R"
  ) {
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
      net:
        billing -
        franchiseeShare -
        expenditure
    };
  }


  /* RV / C / CN */

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
   TOOLTIP
========================================================= */

const IndustryTooltip = ({
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
    <div className="industry-modern-tooltip">
      <div className="industry-tooltip-label">
        Industry Performance
      </div>

      <div className="industry-tooltip-industry">
        {label}
      </div>

      {payload.map(
        (item, index) => (
          <div
            className="industry-tooltip-row"
            key={`${item.dataKey}-${index}`}
          >
            <span>
              {item.name}
            </span>

            <strong>
              {item.dataKey === "billing"
                ? formatCurrency(item.value)
                : formatNumber(item.value)}
            </strong>
          </div>
        )
      )}
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


  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedIndustry,
    setSelectedIndustry
  ] = useState("");

  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("ALL");

  const [
    selectedInfoStatus,
    setSelectedInfoStatus
  ] = useState("ALL");

  const [
    industryExpenditurePercentage,
    setIndustryExpenditurePercentage
  ] = useState("");


  /* REPORT FILTERS */

  const [
    reportFinancialYear,
    setReportFinancialYear
  ] = useState("ALL");

  const [
    reportInfoStatus,
    setReportInfoStatus
  ] = useState("ALL");


  /* MODAL */

  const [
    showModal,
    setShowModal
  ] = useState(false);


  /* =======================================================
     FINANCIAL YEARS
  ======================================================= */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const year =
        getFinancialYear(row);

      if (year) {
        years.add(year);
      }

    });

    return Array.from(years).sort(
      (a, b) => {

        const yearA =
          Number(a.split("-")[0]);

        const yearB =
          Number(b.split("-")[0]);

        return yearA - yearB;
      }
    );

  }, [rows]);


  /* =======================================================
     INDUSTRIES
  ======================================================= */

  const industries = useMemo(() => {

    const values = new Set();

    rows.forEach((row) => {

      const industry =
        getIndustry(row);

      if (industry) {
        values.add(industry);
      }

    });

    return Array.from(values).sort(
      (a, b) =>
        a.localeCompare(
          b,
          undefined,
          {
            sensitivity: "base"
          }
        )
    );

  }, [rows]);


  /* =======================================================
     VALID EXPENDITURE
  ======================================================= */

  const hasIndustryExpenditure =
    industryExpenditurePercentage !== "" &&
    Number.isFinite(
      Number(
        industryExpenditurePercentage
      )
    ) &&
    Number(
      industryExpenditurePercentage
    ) >= 0 &&
    Number(
      industryExpenditurePercentage
    ) <= 100;


  /* =======================================================
     MAIN INDUSTRY DATA
  ======================================================= */

  const industryData = useMemo(() => {

    const grouped = {};

    rows.forEach((row) => {

      const industry =
        getIndustry(row);

      if (!industry) {
        return;
      }


      /* Industry filter */

      if (
        selectedIndustry &&
        selectedIndustry !== "ALL" &&
        industry !== selectedIndustry
      ) {
        return;
      }


      /* Financial Year filter */

      if (
        selectedFinancialYear &&
        selectedFinancialYear !== "ALL" &&
        getFinancialYear(row) !==
          selectedFinancialYear
      ) {
        return;
      }


      /* Info filter */

      if (
        !matchesInfoFilter(
          row,
          selectedInfoStatus
        )
      ) {
        return;
      }


      if (!grouped[industry]) {
        grouped[industry] = {
          industry,
          rows: [],
          companyNames: new Set(),
          franchiseNames: new Set(),
          totalEnquiries: 0,
          totalBilling: 0,
          totalFranchiseeShare: 0,
          totalExpenditure: 0,
          totalNet: 0
        };
      }


      const item =
        grouped[industry];

      const companyName =
        getCompanyName(row);

      const companyKey =
        normalizeCompanyKey(
          companyName
        );

      const franchiseName =
        getFranchiseName(row);

      const values =
        getFinancialValues(
          row,
          selectedInfoStatus,
          industryExpenditurePercentage
        );


      item.rows.push(row);

      item.totalEnquiries += 1;

      if (companyKey) {
        item.companyNames.add(
          companyKey
        );
      }

      if (franchiseName) {
        item.franchiseNames.add(
          franchiseName
        );
      }

      item.totalBilling +=
        values.billing;

      item.totalFranchiseeShare +=
        values.franchiseeShare;

      item.totalExpenditure +=
        values.expenditure;

      item.totalNet +=
        values.net;

    });


    return Object.values(grouped)
      .map((item) => ({
        ...item,

        totalAcquiredClients:
          item.companyNames.size,

        totalFranchisees:
          item.franchiseNames.size
      }))
      .sort(
        (a, b) =>
          b.totalBilling -
          a.totalBilling
      );

  }, [
    rows,
    selectedIndustry,
    selectedFinancialYear,
    selectedInfoStatus,
    industryExpenditurePercentage
  ]);


  /* =======================================================
     SELECTED INDUSTRY ROWS
  ======================================================= */

  const selectedIndustryRows =
    useMemo(() => {

      if (
        !selectedIndustry ||
        selectedIndustry === "ALL"
      ) {
        return [];
      }

      return rows.filter((row) => {

        if (
          getIndustry(row) !==
          selectedIndustry
        ) {
          return false;
        }

        if (
          reportFinancialYear &&
          reportFinancialYear !== "ALL" &&
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
      selectedIndustry,
      reportFinancialYear,
      reportInfoStatus
    ]);


  /* =======================================================
     MODAL SUMMARY
  ======================================================= */

  const modalSummary =
    useMemo(() => {

      const companySet =
        new Set();

      let totalBilling = 0;
      let totalExpenditure = 0;
      let totalNet = 0;
      let totalFranchiseeShare = 0;

      selectedIndustryRows.forEach(
        (row) => {

          const companyName =
            getCompanyName(row);

          const companyKey =
            normalizeCompanyKey(
              companyName
            );

          if (companyKey) {
            companySet.add(
              companyKey
            );
          }

          const values =
            getFinancialValues(
              row,
              reportInfoStatus,
              industryExpenditurePercentage
            );

          totalBilling +=
            values.billing;

          totalExpenditure +=
            values.expenditure;

          totalNet +=
            values.net;

          totalFranchiseeShare +=
            values.franchiseeShare;

        }
      );


      return {
        totalAcquiredClients:
          companySet.size,

        totalEnquiries:
          selectedIndustryRows.length,

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


  /* =======================================================
     YEARLY PERFORMANCE
  ======================================================= */

  const yearlyPerformance =
    useMemo(() => {

      const grouped = {};

      selectedIndustryRows.forEach(
        (row) => {

          const year =
            getFinancialYear(row);

          if (!year) {
            return;
          }

          if (!grouped[year]) {
            grouped[year] = {
              year,
              companyNames: new Set(),
              billing: 0
            };
          }

          const companyName =
            getCompanyName(row);

          const companyKey =
            normalizeCompanyKey(
              companyName
            );

          if (companyKey) {
            grouped[
              year
            ].companyNames.add(
              companyKey
            );
          }

          const values =
            getFinancialValues(
              row,
              reportInfoStatus,
              industryExpenditurePercentage
            );

          grouped[year].billing +=
            values.billing;

        }
      );


      return Object.values(grouped)
        .sort(
          (a, b) =>
            Number(
              a.year.split("-")[0]
            ) -
            Number(
              b.year.split("-")[0]
            )
        )
        .map((item) => ({
          year: item.year,
          clients:
            item.companyNames.size,
          billing:
            item.billing
        }));

    }, [
      selectedIndustryRows,
      reportInfoStatus,
      industryExpenditurePercentage
    ]);


  /* =======================================================
     MONTHLY PERFORMANCE
  ======================================================= */

  const monthlyPerformance =
    useMemo(() => {

      const grouped =
        financialMonths.map(
          (month) => ({
            month: month.full,
            shortMonth: month.short,
            monthNumber: month.month,
            companyNames: new Set(),
            billing: 0
          })
        );


      selectedIndustryRows.forEach(
        (row) => {

          const monthNumber =
            getMonth(row);

          const item =
            grouped.find(
              (month) =>
                month.monthNumber ===
                monthNumber
            );

          if (!item) {
            return;
          }

          const companyName =
            getCompanyName(row);

          const companyKey =
            normalizeCompanyKey(
              companyName
            );

          if (companyKey) {
            item.companyNames.add(
              companyKey
            );
          }

          const values =
            getFinancialValues(
              row,
              reportInfoStatus,
              industryExpenditurePercentage
            );

          item.billing +=
            values.billing;

        }
      );


      return grouped.map(
        (item) => ({
          month: item.shortMonth,
          fullMonth: item.month,
          clients:
            item.companyNames.size,
          billing:
            item.billing
        })
      );

    }, [
      selectedIndustryRows,
      reportInfoStatus,
      industryExpenditurePercentage
    ]);


  /* =======================================================
     SUB INDUSTRY PERFORMANCE
  ======================================================= */

  const subIndustryData =
    useMemo(() => {

      const grouped = {};

      selectedIndustryRows.forEach(
        (row) => {

          const subIndustry =
            getSubIndustry(row) ||
            "Not Specified";

          if (!grouped[subIndustry]) {
            grouped[subIndustry] = {
              name: subIndustry,
              companyNames: new Set(),
              enquiries: 0
            };
          }

          grouped[
            subIndustry
          ].enquiries += 1;


          const companyName =
            getCompanyName(row);

          const companyKey =
            normalizeCompanyKey(
              companyName
            );

          if (companyKey) {
            grouped[
              subIndustry
            ].companyNames.add(
              companyKey
            );
          }

        }
      );


      return Object.values(grouped)
        .map((item) => ({
          name: item.name,
          clients:
            item.companyNames.size,
          enquiries:
            item.enquiries
        }))
        .sort(
          (a, b) =>
            b.clients -
            a.clients
        );

    }, [
      selectedIndustryRows
    ]);


  /* =======================================================
     TOP TEAM LEADER BY UNIQUE CLIENT
  ======================================================= */

  const topTeamLeader =
    useMemo(() => {

      const grouped = {};

      selectedIndustryRows.forEach(
        (row) => {

          const leader =
            getTeamLeader(row) ||
            "Not Assigned";

          if (!grouped[leader]) {
            grouped[leader] = new Set();
          }

          const companyName =
            getCompanyName(row);

          const companyKey =
            normalizeCompanyKey(
              companyName
            );

          if (companyKey) {
            grouped[leader].add(
              companyKey
            );
          }

        }
      );


      const result =
        Object.entries(grouped)
          .map(
            ([name, companySet]) => ({
              name,
              clients:
                companySet.size
            })
          )
          .sort(
            (a, b) =>
              b.clients -
              a.clients
          );


      return result[0] || null;

    }, [
      selectedIndustryRows
    ]);


  /* =======================================================
     TOP BD MEMBER BY UNIQUE CLIENT
  ======================================================= */

  const topBDMember =
    useMemo(() => {

      const grouped = {};

      selectedIndustryRows.forEach(
        (row) => {

          const member =
            getBDMember(row) ||
            "Not Assigned";

          if (!grouped[member]) {
            grouped[member] = new Set();
          }

          const companyName =
            getCompanyName(row);

          const companyKey =
            normalizeCompanyKey(
              companyName
            );

          if (companyKey) {
            grouped[member].add(
              companyKey
            );
          }

        }
      );


      const result =
        Object.entries(grouped)
          .map(
            ([name, companySet]) => ({
              name,
              clients:
                companySet.size
            })
          )
          .sort(
            (a, b) =>
              b.clients -
              a.clients
          );


      return result[0] || null;

    }, [
      selectedIndustryRows
    ]);


  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportData =
    reportFinancialYear &&
    reportFinancialYear !== "ALL"
      ? monthlyPerformance
      : yearlyPerformance;


  const reportIsMonthly =
    reportFinancialYear &&
    reportFinancialYear !== "ALL";


  /* =======================================================
     OPEN PERFORMANCE
  ======================================================= */

  const handleViewPerformance = (
    industry
  ) => {

    setSelectedIndustry(industry);

    setReportFinancialYear(
      selectedFinancialYear ||
      "ALL"
    );

    setReportInfoStatus(
      selectedInfoStatus ||
      "ALL"
    );

    setShowModal(true);
  };


  /* =======================================================
     CLOSE PERFORMANCE
  ======================================================= */

  const handleClosePerformance = () => {
    setShowModal(false);
    setSelectedIndustry("");
  };


  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {

    if (!showModal) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {

      if (
        event.key === "Escape"
      ) {
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

  }, [showModal]);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="industry-performance-page">
        <div className="industry-empty">
          Loading industry performance...
        </div>
      </div>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="industry-performance-page">
        <div className="industry-empty">
          Unable to load industry performance data.
        </div>
      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="industry-performance-page">


      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="industry-page-header">

        <div>

          <div className="industry-page-eyebrow">
            PERFORMANCE ANALYTICS
          </div>

          <h1>
            Industry Performance
          </h1>

          <p>
            Compare acquired clients,
            enquiries and billing
            performance across industries.
          </p>

        </div>

      </div>


      {/* ===================================================
          TABLE CARD
      =================================================== */}

      <div className="industry-table-card">


        {/* TABLE HEADER */}

        <div className="industry-table-header">

          <div>

            <h2>
              Industry Performance
            </h2>

            <span className="industry-count">
              {industryData.length}{" "}
              {industryData.length === 1
                ? "industry"
                : "industries"}
            </span>

          </div>

        </div>


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="industry-performance-filters">


          {/* FINANCIAL YEAR */}

          <div className="industry-filter-group">

            <label>
              Financial Year
            </label>

            <select
              value={
                selectedFinancialYear
              }
              onChange={(event) =>
                setSelectedFinancialYear(
                  event.target.value
                )
              }
            >

              <option value="ALL">
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


          {/* INFO STATUS */}

          <div className="industry-filter-group">

            <label>
              Info Status
            </label>

            <select
              value={
                selectedInfoStatus
              }
              onChange={(event) =>
                setSelectedInfoStatus(
                  event.target.value
                )
              }
            >

              <option value="ALL">
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


          {/* INDUSTRY */}

          <div className="industry-filter-group">

            <label>
              Industry
            </label>

            <select
              value={
                selectedIndustry || "ALL"
              }
              onChange={(event) =>
                setSelectedIndustry(
                  event.target.value === "ALL"
                    ? ""
                    : event.target.value
                )
              }
            >

              <option value="ALL">
                All Industries
              </option>

              {industries.map(
                (industry) => (
                  <option
                    key={industry}
                    value={industry}
                  >
                    {industry}
                  </option>
                )
              )}

            </select>

          </div>


          {/* EXPENDITURE */}

          <div className="industry-filter-group">

            <label>
              Industry Expenditure %
            </label>

            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={
                industryExpenditurePercentage
              }
              placeholder="0 - 100"
              onChange={(event) => {

                const value =
                  event.target.value;

                if (value === "") {
                  setIndustryExpenditurePercentage(
                    ""
                  );
                  return;
                }

                const number =
                  Number(value);

                if (
                  number >= 0 &&
                  number <= 100
                ) {
                  setIndustryExpenditurePercentage(
                    value
                  );
                }

              }}
            />

          </div>


        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="industry-table-wrapper">

          <table className="industry-table">

            <thead>

              <tr>

                <th>
                  Industry
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

                {hasIndustryExpenditure && (
                  <th>
                    Industry Expenditure
                  </th>
                )}

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {industryData.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      hasIndustryExpenditure
                        ? 8
                        : 7
                    }
                    className="industry-empty"
                  >
                    No industry data found
                    for the selected
                    filters.
                  </td>

                </tr>

              ) : (

                industryData.map(
                  (item) => {

                    const initial =
                      item.industry
                        .charAt(0)
                        .toUpperCase();

                    return (
                      <tr
                        key={
                          item.industry
                        }
                      >

                        {/* INDUSTRY */}

                        <td>

                          <div className="industry-name">

                            <div className="industry-avatar">
                              {initial}
                            </div>

                            <span>
                              {item.industry}
                            </span>

                          </div>

                        </td>


                        {/* ACQUIRED CLIENT */}

                        <td>

                          <span className="industry-client-count">
                            {formatNumber(
                              item.totalAcquiredClients
                            )}
                          </span>

                        </td>


                        {/* ENQUIRIES */}

                        <td>
                          {formatNumber(
                            item.totalEnquiries
                          )}
                        </td>


                        {/* FRANCHISEES */}

                        <td>
                          {formatNumber(
                            item.totalFranchisees
                          )}
                        </td>


                        {/* BILLING */}

                        <td>

                          <span className="industry-billing-value">
                            {formatCurrency(
                              item.totalBilling
                            )}
                          </span>

                        </td>


                        {/* NET */}

                        <td>

                          <span className="industry-net-value">
                            {formatCurrency(
                              item.totalNet
                            )}
                          </span>

                        </td>


                        {/* EXPENDITURE */}

                        {hasIndustryExpenditure && (
                          <td>

                            <span className="industry-net-value">
                              {formatCurrency(
                                item.totalExpenditure
                              )}
                            </span>

                          </td>
                        )}


                        {/* PERFORMANCE */}

                        <td>

                          <button
                            type="button"
                            className="industry-view-performance-btn"
                            onClick={() =>
                              handleViewPerformance(
                                item.industry
                              )
                            }
                          >

                            View Performance

                            <span className="industry-view-arrow">
                              →
                            </span>

                          </button>

                        </td>

                      </tr>
                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ===================================================
          PERFORMANCE MODAL
      =================================================== */}

      {showModal &&
        selectedIndustry && (

          <div
            className="industry-performance-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
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


              {/* MODAL HEADER */}

              <div className="industry-modal-header">

                <div>

                  <div className="industry-modal-eyebrow">
                    INDUSTRY PERFORMANCE
                  </div>

                  <h2 id="industry-performance-title">
                    {selectedIndustry}
                  </h2>

                  <p>
                    Detailed performance
                    report for the
                    selected industry.
                  </p>

                </div>


                <button
                  type="button"
                  className="industry-modal-close"
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

              <div className="industry-summary-grid">


                {/* ACQUIRED CLIENT */}

                <div className="industry-summary-card">

                  <span className="industry-summary-label">
                    Total Acquired Client
                  </span>

                  <span className="industry-summary-value">
                    {formatNumber(
                      modalSummary.totalAcquiredClients
                    )}
                  </span>

                </div>


                {/* ENQUIRIES */}

                <div className="industry-summary-card industry-enquiry-card">

                  <span className="industry-summary-label">
                    Total Enquiries
                  </span>

                  <span className="industry-summary-value">
                    {formatNumber(
                      modalSummary.totalEnquiries
                    )}
                  </span>

                </div>


                {/* BILLING */}

                <div className="industry-summary-card industry-share-card">

                  <span className="industry-summary-label">
                    Total Billing
                  </span>

                  <span className="industry-summary-value">
                    {formatCurrency(
                      modalSummary.totalBilling
                    )}
                  </span>

                </div>


                {/* NET */}

                <div className="industry-summary-card industry-net-card">

                  <span className="industry-summary-label">
                    Net Amount
                  </span>

                  <span className="industry-summary-value">
                    {formatCurrency(
                      modalSummary.totalNet
                    )}
                  </span>

                </div>


                {/* EXPENDITURE */}

                {hasIndustryExpenditure && (

                  <div className="industry-summary-card">

                    <span className="industry-summary-label">
                      Industry Expenditure
                    </span>

                    <span className="industry-summary-value">
                      {formatCurrency(
                        modalSummary.totalExpenditure
                      )}
                    </span>

                  </div>

                )}


                {/* TOP TEAM LEADER */}

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
                      {formatNumber(
                        topTeamLeader.clients
                      )} unique clients
                    </span>
                  )}

                </div>


                {/* TOP BD */}

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
                      {formatNumber(
                        topBDMember.clients
                      )} unique clients
                    </span>
                  )}

                </div>

              </div>


              {/* =================================================
                  REPORT CONTROLS
              ================================================= */}

              <div className="industry-report-controls">


                <div className="industry-report-period">

                  <label>
                    Report Financial Year
                  </label>

                  <select
                    value={
                      reportFinancialYear
                    }
                    onChange={(event) =>
                      setReportFinancialYear(
                        event.target.value
                      )
                    }
                  >

                    <option value="ALL">
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


                <div className="industry-report-period">

                  <label>
                    Report Info Status
                  </label>

                  <select
                    value={
                      reportInfoStatus
                    }
                    onChange={(event) =>
                      setReportInfoStatus(
                        event.target.value
                      )
                    }
                  >

                    <option value="ALL">
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


                <div className="industry-report-period">

                  <span>
                    Report Period
                  </span>

                  <strong>
                    {reportIsMonthly
                      ? `FY ${reportFinancialYear} — Monthly`
                      : "Yearly"}
                  </strong>

                </div>

              </div>


              {/* =================================================
                  CHARTS
              ================================================= */}

              <div className="industry-report-graphs">


                {/* CLIENT CHART */}

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

                    <span>
                      Unique companies
                    </span>

                  </div>


                  <div className="industry-chart-container">

                    {reportData.length === 0 ? (

                      <div className="industry-no-chart-data">
                        No client data
                        available.
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
                              reportIsMonthly
                                ? "month"
                                : "year"
                            }
                          />

                          <YAxis
                            allowDecimals={false}
                          />

                          <Tooltip
                            content={
                              <IndustryTooltip />
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


                {/* BILLING CHART */}

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

                    <span>
                      Total billing
                    </span>

                  </div>


                  <div className="industry-chart-container">

                    {reportData.length === 0 ? (

                      <div className="industry-no-chart-data">
                        No billing data
                        available.
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
                              reportIsMonthly
                                ? "month"
                                : "year"
                            }
                          />

                          <YAxis
                            tickFormatter={
                              (value) =>
                                `₹${(
                                  value /
                                  1000
                                ).toFixed(0)}k`
                            }
                          />

                          <Tooltip
                            content={
                              <IndustryTooltip />
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
                  SUB INDUSTRY
              ================================================= */}

              {subIndustryData.length > 0 && (

                <div
                  className="industry-summary-grid"
                  style={{
                    paddingTop: 0
                  }}
                >

                  <div
                    className="industry-summary-card industry-top-industry-card"
                    style={{
                      gridColumn:
                        "1 / -1"
                    }}
                  >

                    <span className="industry-summary-label">
                      Sub Industry Performance
                    </span>

                    <div className="industry-sub-industry-list">

                      {subIndustryData.map(
                        (item) => (

                          <span
                            className="industry-sub-industry-tag"
                            key={item.name}
                          >

                            {item.name}

                            <small>
                              {formatNumber(
                                item.clients
                              )}
                            </small>

                          </span>

                        )
                      )}

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="industry-modal-footer">

                <span>
                  {selectedIndustry}
                  {" · "}
                  {reportFinancialYear ===
                  "ALL"
                    ? "All Financial Years"
                    : `FY ${reportFinancialYear}`}
                  {" · "}
                  {reportInfoStatus ===
                  "ALL"
                    ? "All Info Status"
                    : reportInfoStatus}
                  {" · "}
                  {formatNumber(
                    modalSummary.totalAcquiredClients
                  )}{" "}
                  unique clients
                  {" · "}
                  {formatNumber(
                    modalSummary.totalEnquiries
                  )}{" "}
                  enquiries
                </span>

                <button
                  type="button"
                  className="industry-footer-close"
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


export default IndustryPerformance;