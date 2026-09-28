import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback
} from "react";

import {
  processDashboardData
} from "../utils/dataProcessor";

const DataContext = createContext();

/* =========================================================
   API URL
========================================================= */

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api/ledger"
    : "/api/ledger";


/* =========================================================
   FIXED EXCEL FILE NAME

   This is the file used by the backend.
   Keep this name only for display.
========================================================= */

const EXCEL_FILE_NAME =
  "enquiry sheet  old.xlsx";


/* =========================================================
   AUTO REFRESH

   Dashboard checks the backend every 60 seconds.
========================================================= */

const AUTO_REFRESH_INTERVAL =
  60 * 1000;


/* =========================================================
   STATUS MAPPING
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
   NORMALIZE CITY
========================================================= */

function normalizeCity(value) {

  return normalizeValue(value);

}


/* =========================================================
   MAP BACKEND ROW
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

    viewBy: "",

    reportBy: "",

    metricView: "",

    viewReportAs: "all",

    sortBy: "",

    allTime: "all",

    company: "",

    year: "",

    month: "",

    quarter: "",

    bdMember: "",

    teamLeader: "",

    franchise: "",

    industry: "",

    subIndustry: "",

    city: "",

    clientStatus: "",

    position: "",

    enquiryStatus: ""

  });


  /* =========================================================
     FETCH DATA FROM BACKEND

     Cache busting is added so the browser does not reuse
     an old /api/ledger response.
  ========================================================= */

  const fetchLedgerData = useCallback(
    async () => {

      try {

        setLoading(true);

        setError(null);

        console.log(
          "Loading latest ledger data from:",
          API_URL
        );


        const separator =
          API_URL.includes("?")
            ? "&"
            : "?";

        const requestUrl =
          `${API_URL}${separator}_refresh=${Date.now()}`;


        const response =
          await fetch(
            requestUrl,
            {
              method: "GET",

              cache: "no-store",

              headers: {
                "Cache-Control":
                  "no-cache",
                "Pragma":
                  "no-cache"
              }
            }
          );


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


        console.log(
          "Latest ledger rows loaded:",
          mappedRows.length
        );


        /*
         * Update the actual dashboard data.
         */

        setRows(
          mappedRows
        );


        /*
         * This is the fixed Excel file used
         * by the backend.
         */

        setFileName(
          EXCEL_FILE_NAME
        );


        /*
         * IMPORTANT:
         * Update refresh time ONLY after
         * successful API response.
         */

        setLastRefresh(
          new Date()
        );


        console.log(
          "Dashboard refreshed at:",
          new Date().toLocaleString()
        );


        return mappedRows;


      } catch (err) {

        console.error(
          "Failed to load ledger data:",
          err
        );


        setError(
          err.message ||
          "Failed to load ledger data"
        );


        /*
         * Do NOT erase existing rows when
         * an automatic refresh temporarily fails.
         *
         * This prevents the dashboard from
         * becoming blank because of a temporary
         * network/API issue.
         */

        return null;


      } finally {

        setLoading(false);

      }

    },
    []
  );


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    fetchLedgerData();

  }, [
    fetchLedgerData
  ]);


  /* =========================================================
     AUTOMATIC REFRESH
     
     Every 60 seconds.
  ========================================================= */

  useEffect(() => {

    const interval =
      setInterval(
        () => {

          console.log(
            "Automatic dashboard refresh..."
          );

          fetchLedgerData();

        },
        AUTO_REFRESH_INTERVAL
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [
    fetchLedgerData
  ]);


  /* =========================================================
     REFRESH WHEN USER RETURNS TO TAB
  ========================================================= */

  useEffect(() => {

    function handleVisibilityChange() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        console.log(
          "Dashboard became visible. Refreshing..."
        );

        fetchLedgerData();

      }

    }


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

    };

  }, [
    fetchLedgerData
  ]);


  /* =========================================================
     LOAD EXCEL DATA
     
     Kept for compatibility with existing
     components.
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


    setRows(
      data
    );


    if (file) {

      setFileName(
        file.name ||
        EXCEL_FILE_NAME
      );

    } else {

      setFileName(
        EXCEL_FILE_NAME
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
             FINANCIAL YEAR
          ================================================= */

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


          /* =================================================
             MONTH
          ================================================= */

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


          /* =================================================
             QUARTER
          ================================================= */

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
              normalizeCity(
                row["City"]
              ) !==
              normalizeCity(
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


          return true;

        }
      );

    }, [
      rows,
      filters
    ]);


  /* =========================================================
     DASHBOARD DATA
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

        rows,

        filteredRows,

        loading,

        error,

        fileName,

        lastRefresh,

        filters,

        setFilters,

        dashboardData,

        loadExcelData,

        fetchLedgerData,

        getFinancialYearFromRow,

        getFinancialYearFromDate,

        getMonthFromDate,

        getFinancialQuarter,

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
