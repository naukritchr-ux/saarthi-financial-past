import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect
} from "react";

import {
  processDashboardData
} from "../utils/dataProcessor";

const DataContext = createContext();

const API_URL = "/api/ledger";

/* =========================================================
   STATUS MAPPING
   Info column values coming from MySQL
   ========================================================= */

const ENQUIRY_STATUS_CODES = {
  closed: "C",
  "credit note": "CN",
  inprogress: "IP",
  legal: "LEGAL",
  reallocation: "R",
  revised: "RV"
};

/* =========================================================
   NORMALIZE VALUE
   Used for all filter comparisons
   ========================================================= */

function normalizeValue(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

}

/* =========================================================
   MAP BACKEND ROW
   Converts MySQL column names to frontend column names
   ========================================================= */

function mapBackendRow(record) {

  return {

    id: record.id,

    "Company Name":
      record.company_name,

    "TANN":
      record.tann,

    "TDS":
      record.tds,

    "Client Status":
      record.client_status,

    "BD Member":
      record.bd_member,

    "Team Leader":
      record.team_leader,

    "Franchise Name":
      record.franchise_name,

    "Industry":
      record.industry,

    "Sub Industry":
      record.sub_industry,

    "City":
      record.city,

    "GSTNumber":
      record.gst_number,

    "No Of Employees":
      record.no_of_employees,

    "Date Client Acquired":
      record.date_client_acquired,

    "Date of Allocation":
      record.date_of_allocation,

    "Date of Reallocation":
      record.date_of_reallocation,

    "Date of Joining":
      record.date_of_joining,

    "Placement Fees":
      record.placement_fees,

    "Salary From":
      record.salary_from,

    "Salary Offered":
      record.salary_offered,

    "Bill Date":
      record.bill_date,

    "Bill Number":
      record.bill_number,

    "Service Charges":
      record.service_charges,

    "Total Bill Amount":
      record.total_bill_amount,

    "Date Received":
      record.date_received,

    "Amount Received":
      record.amount_received,

    "Franchisee Share":
      record.franchisee_share,

    "Paid On Date":
      record.paid_on_date,

    "SOA No":
      record.soa_no,

    "Info":
      record.info,

    "Position Name":
      record.position_name,

    "Aquired Year":
      record.acquired_year,

    "Allotment Year":
      record.allotment_year,

    "Joining Date":
      record.joining_year,

    "Bill Date Year":
      record.bill_year,

    "Recived Year":
      record.received_year,

    "Paid Date":
      record.paid_year,

    created_at:
      record.created_at,

    updated_at:
      record.updated_at

  };

}

/* =========================================================
   DATE FUNCTIONS
   ========================================================= */

function parseDate(value) {

  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;

}

/* =========================================================
   FINANCIAL YEAR
   April - March
   ========================================================= */

function getFinancialYearFromDate(value) {

  const date =
    parseDate(value);

  if (!date) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  if (month >= 4) {

    return `${year}-${year + 1}`;

  }

  return `${year - 1}-${year}`;

}


function getFinancialYearFromRow(row) {

  const acquiredDate =
    row["Date Client Acquired"];

  const financialYear =
    getFinancialYearFromDate(
      acquiredDate
    );

  if (financialYear) {

    return financialYear;

  }

  const acquiredYear =
    row["Aquired Year"];

  if (
    acquiredYear !== undefined &&
    acquiredYear !== null &&
    acquiredYear !== ""
  ) {

    const year =
      Number(acquiredYear);

    if (
      !Number.isNaN(year)
    ) {

      return `${year}-${year + 1}`;

    }

  }

  return "";

}

/* =========================================================
   MONTH
   ========================================================= */

function getMonthFromDate(value) {

  const date =
    parseDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleString(
    "en-IN",
    {
      month: "long"
    }
  );

}

/* =========================================================
   FINANCIAL QUARTER
   ========================================================= */

function getFinancialQuarter(value) {

  const date =
    parseDate(value);

  if (!date) {
    return "";
  }

  const month =
    date.getMonth() + 1;

  if (
    month >= 4 &&
    month <= 6
  ) {

    return "Q1";

  }

  if (
    month >= 7 &&
    month <= 9
  ) {

    return "Q2";

  }

  if (
    month >= 10 &&
    month <= 12
  ) {

    return "Q3";

  }

  return "Q4";

}

/* =========================================================
   FINANCIAL MONTHS
   ========================================================= */

const FINANCIAL_MONTHS = [

  "April",
  "May",
  "June",

  "July",
  "August",
  "September",

  "October",
  "November",
  "December",

  "January",
  "February",
  "March"

];

/* =========================================================
   FINANCIAL QUARTERS
   ========================================================= */

const FINANCIAL_QUARTERS = [

  "Q1",
  "Q2",
  "Q3",
  "Q4"

];

/* =========================================================
   DATA PROVIDER
   ========================================================= */

export function DataProvider({
  children
}) {

  const [rows, setRows] =
    useState([]);

  const [fileName, setFileName] =
    useState("");

  const [lastRefresh, setLastRefresh] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /* =======================================================
     FILTER STATE
     ======================================================= */

  const [filters, setFilters] = useState({

    /* View */

    viewBy: "",

    reportBy: "",

    metricView: "",

    /* Time */

    allTime: "all",

    viewReportAs: "all",

    sortBy: "",

    /* Main filters */

    company: "",

    year: "",

    month: "",

    quarter: "",

    /* People */

    bdMember: "",

    teamLeader: "",

    /* Business */

    franchise: "",

    industry: "",

    subIndustry: "",

    city: "",

    /* Client */

    clientStatus: "",

    /* Position */

    position: "",

    /* Enquiry */

    enquiryStatus: ""

  });

  /* =========================================================
     FETCH DATA FROM BACKEND
     ========================================================= */

  async function fetchLedgerData() {

    try {

      setLoading(true);

      setError(null);

      const response =
        await fetch(API_URL);

      if (!response.ok) {

        throw new Error(
          `Server returned ${response.status}`
        );

      }

      const result =
        await response.json();

      if (!result.success) {

        throw new Error(
          result.message ||
          "Failed to fetch ledger data"
        );

      }

      const mappedRows =
        (result.data || []).map(
          mapBackendRow
        );

      setRows(mappedRows);

      setFileName(
        "MySQL Database"
      );

      setLastRefresh(
        new Date()
      );

    } catch (err) {

      console.error(
        "Failed to load ledger data:",
        err
      );

      setError(
        err.message ||
        "Failed to load ledger data"
      );

      setRows([]);

    } finally {

      setLoading(false);

    }

  }

  /* =========================================================
     LOAD DATA WHEN APPLICATION STARTS
     ========================================================= */

  useEffect(() => {

    fetchLedgerData();

  }, []);

  /* =========================================================
     LOAD EXCEL DATA
     Kept for compatibility with existing frontend
     ========================================================= */

  function loadExcelData(
    data,
    file
  ) {

    if (
      !Array.isArray(data)
    ) {

      return;

    }

    setRows(data);

    if (file) {

      setFileName(
        file.name ||
        "Imported File"
      );

    }

    setLastRefresh(
      new Date()
    );

  }

  /* =========================================================
     FILTER DATA
     ========================================================= */

  const filteredRows =
    useMemo(() => {

      return rows.filter(
        (row) => {

          /* =================================================
             COMPANY
             ================================================= */

          if (
            filters.company
          ) {

            if (
              normalizeValue(
                row["Company Name"]
              ) !==
              normalizeValue(
                filters.company
              )
            ) {

              return false;

            }

          }

          /* =================================================
             VIEW REPORT AS
             
             All Time
             Yearly
             Quarterly
             Monthly

             This works together with:
             - year
             - month
             - quarter

             Existing filters are preserved.
             ================================================= */

          if (
            filters.viewReportAs ===
            "yearly"
          ) {

            if (
              filters.year
            ) {

              const rowFinancialYear =
                getFinancialYearFromRow(
                  row
                );

              if (
                normalizeValue(
                  rowFinancialYear
                ) !==
                normalizeValue(
                  filters.year
                )
              ) {

                return false;

              }

            }

          }

          if (
            filters.viewReportAs ===
            "quarterly"
          ) {

            if (
              filters.year
            ) {

              const rowFinancialYear =
                getFinancialYearFromRow(
                  row
                );

              if (
                normalizeValue(
                  rowFinancialYear
                ) !==
                normalizeValue(
                  filters.year
                )
              ) {

                return false;

              }

            }

            if (
              filters.quarter
            ) {

              const rowQuarter =
                getFinancialQuarter(
                  row[
                    "Date Client Acquired"
                  ]
                );

              if (
                normalizeValue(
                  rowQuarter
                ) !==
                normalizeValue(
                  filters.quarter
                )
              ) {

                return false;

              }

            }

          }

          if (
            filters.viewReportAs ===
            "monthly"
          ) {

            if (
              filters.year
            ) {

              const rowFinancialYear =
                getFinancialYearFromRow(
                  row
                );

              if (
                normalizeValue(
                  rowFinancialYear
                ) !==
                normalizeValue(
                  filters.year
                )
              ) {

                return false;

              }

            }

            if (
              filters.month
            ) {

              const rowMonth =
                getMonthFromDate(
                  row[
                    "Date Client Acquired"
                  ]
                );

              if (
                normalizeValue(
                  rowMonth
                ) !==
                normalizeValue(
                  filters.month
                )
              ) {

                return false;

              }

            }

          }

          /* =================================================
             OLD FINANCIAL YEAR FILTER
             
             Preserved so existing Financial Year
             filter continues working.
             ================================================= */

          if (
            filters.year &&
            (
              !filters.viewReportAs ||
              filters.viewReportAs === "all"
            )
          ) {

            const rowFinancialYear =
              getFinancialYearFromRow(
                row
              );

            if (
              normalizeValue(
                rowFinancialYear
              ) !==
              normalizeValue(
                filters.year
              )
            ) {

              return false;

            }

          }

          /* =================================================
             OLD MONTH FILTER
             
             Preserved.
             ================================================= */

          if (
            filters.month &&
            (
              !filters.viewReportAs ||
              filters.viewReportAs === "all"
            )
          ) {

            const rowMonth =
              getMonthFromDate(
                row[
                  "Date Client Acquired"
                ]
              );

            if (
              normalizeValue(
                rowMonth
              ) !==
              normalizeValue(
                filters.month
              )
            ) {

              return false;

            }

          }

          /* =================================================
             OLD QUARTER FILTER
             
             Preserved.
             ================================================= */

          if (
            filters.quarter &&
            (
              !filters.viewReportAs ||
              filters.viewReportAs === "all"
            )
          ) {

            const rowQuarter =
              getFinancialQuarter(
                row[
                  "Date Client Acquired"
                ]
              );

            if (
              normalizeValue(
                rowQuarter
              ) !==
              normalizeValue(
                filters.quarter
              )
            ) {

              return false;

            }

          }

          /* =================================================
             BD MEMBER
             ================================================= */

          if (
            filters.bdMember
          ) {

            if (
              normalizeValue(
                row["BD Member"]
              ) !==
              normalizeValue(
                filters.bdMember
              )
            ) {

              return false;

            }

          }

          /* =================================================
             TEAM LEADER
             ================================================= */

          if (
            filters.teamLeader
          ) {

            if (
              normalizeValue(
                row["Team Leader"]
              ) !==
              normalizeValue(
                filters.teamLeader
              )
            ) {

              return false;

            }

          }

          /* =================================================
             FRANCHISE
             ================================================= */

          if (
            filters.franchise
          ) {

            if (
              normalizeValue(
                row["Franchise Name"]
              ) !==
              normalizeValue(
                filters.franchise
              )
            ) {

              return false;

            }

          }

          /* =================================================
             INDUSTRY
             ================================================= */

          if (
            filters.industry
          ) {

            if (
              normalizeValue(
                row["Industry"]
              ) !==
              normalizeValue(
                filters.industry
              )
            ) {

              return false;

            }

          }

          /* =================================================
             SUB INDUSTRY
             ================================================= */

          if (
            filters.subIndustry
          ) {

            if (
              normalizeValue(
                row["Sub Industry"]
              ) !==
              normalizeValue(
                filters.subIndustry
              )
            ) {

              return false;

            }

          }

          /* =================================================
             CITY
             ================================================= */

          if (
            filters.city
          ) {

            if (
              normalizeValue(
                row["City"]
              ) !==
              normalizeValue(
                filters.city
              )
            ) {

              return false;

            }

          }

          /* =================================================
             CLIENT STATUS
             ================================================= */

          if (
            filters.clientStatus
          ) {

            if (
              normalizeValue(
                row["Client Status"]
              ) !==
              normalizeValue(
                filters.clientStatus
              )
            ) {

              return false;

            }

          }

          /* =================================================
             POSITION
             ================================================= */

          if (
            filters.position
          ) {

            if (
              normalizeValue(
                row["Position Name"]
              ) !==
              normalizeValue(
                filters.position
              )
            ) {

              return false;

            }

          }

          /* =================================================
             ENQUIRY STATUS

             Info column values:

             C     = Closed
             CN    = Credit Note
             IP    = Inprogress
             LEGAL = Legal
             R     = Reallocation
             RV    = Revised
             ================================================= */

          if (
            filters.enquiryStatus
          ) {

            const selectedStatus =
              normalizeValue(
                filters.enquiryStatus
              );

            const selectedCode =
              ENQUIRY_STATUS_CODES[
                selectedStatus
              ] ||
              String(
                filters.enquiryStatus
              )
                .trim()
                .toUpperCase();

            const infoValue =
              String(
                row["Info"] ?? ""
              )
                .trim()
                .toUpperCase();

            if (
              infoValue !==
              String(
                selectedCode
              )
                .trim()
                .toUpperCase()
            ) {

              return false;

            }

          }

          /* =================================================
             ALL FILTERS PASSED
             ================================================= */

          return true;

        }
      );

    }, [
      rows,
      filters
    ]);

  /* =========================================================
     DASHBOARD DATA

     Pass BOTH filteredRows and filters.

     This allows dataProcessor.js to calculate:
     - Client Performance
     - Enquiry Performance
     - Report By
     - Count
     - Revenue
     - View Report As
     ========================================================= */

  const dashboardData =
    useMemo(

      () =>
        processDashboardData(
          filteredRows,
          filters
        ),

      [
        filteredRows,
        filters
      ]

    );

  /* =========================================================
     PROVIDER
     ========================================================= */

  return (

    <DataContext.Provider
      value={{

        /* Raw data */

        rows,

        /* Filtered data */

        filteredRows,

        /* API state */

        loading,

        error,

        /* File information */

        fileName,

        lastRefresh,

        /* Filters */

        filters,

        setFilters,

        /* Dashboard */

        dashboardData,

        /* Data functions */

        loadExcelData,

        fetchLedgerData,

        /* Date helpers */

        getFinancialYearFromRow,

        getFinancialYearFromDate,

        getMonthFromDate,

        getFinancialQuarter,

        /* Financial filter options */

        financialMonths:
          FINANCIAL_MONTHS,

        financialQuarters:
          FINANCIAL_QUARTERS

      }}
    >

      {children}

    </DataContext.Provider>

  );

}

/* =========================================================
   USE DATA HOOK
   ========================================================= */

export function useData() {

  return useContext(
    DataContext
  );

}