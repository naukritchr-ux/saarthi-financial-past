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


// ======================================================
// BACKEND API
// ======================================================

const API_URL =
  "http://localhost:5000/api/ledger";


// ======================================================
// MYSQL RECORD -> FRONTEND ROW
// ======================================================

function mapBackendRow(record) {

  return {

    id: record.id,

    "Company Name": record.company_name,
    "TANN": record.tann,
    "TDS": record.tds,
    "Client Status": record.client_status,

    "BD Member": record.bd_member,
    "Team Leader": record.team_leader,
    "Franchise Name": record.franchise_name,

    "Industry": record.industry,
    "Sub Industry": record.sub_industry,
    "City": record.city,

    "GSTNumber": record.gst_number,
    "No Of Employees": record.no_of_employees,

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


// ======================================================
// DATE PARSER
// ======================================================

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


// ======================================================
// FINANCIAL YEAR
// ======================================================
//
// April 2022 - March 2023
// = 2022-2023
//
// April 2023 - March 2024
// = 2023-2024
// ======================================================

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


// ======================================================
// FINANCIAL YEAR FROM ROW
// ======================================================

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

    if (!Number.isNaN(year)) {

      return `${year}-${year + 1}`;

    }
  }

  return "";
}


// ======================================================
// MONTH FROM ACQUISITION DATE
// ======================================================

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


// ======================================================
// MONTH ORDER
// ======================================================

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


// ======================================================
// DATA PROVIDER
// ======================================================

export function DataProvider({
  children
}) {

  // ====================================================
  // DATA
  // ====================================================

  const [rows, setRows] =
    useState([]);


  // ====================================================
  // FILE NAME
  // ====================================================

  const [fileName, setFileName] =
    useState("");


  // ====================================================
  // LAST REFRESH
  // ====================================================

  const [lastRefresh, setLastRefresh] =
    useState(null);


  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] =
    useState(true);


  // ====================================================
  // ERROR
  // ====================================================

  const [error, setError] =
    useState(null);


  // ====================================================
  // GLOBAL FILTERS
  // ====================================================

  const [filters, setFilters] =
    useState({

      company: "",

      year: "",

      month: "",

      bdMember: "",

      teamLeader: "",

      franchise: "",

      industry: "",

      subIndustry: "",

      city: "",

      clientStatus: "",

      position: ""

    });


  // ====================================================
  // FETCH DATA
  // ====================================================

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


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    fetchLedgerData();

  }, []);


  // ====================================================
  // OLD EXCEL FUNCTION
  // ====================================================

  function loadExcelData(
    data,
    file
  ) {

    if (!Array.isArray(data)) {
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


  // ====================================================
  // FILTER DATA
  // ====================================================

  const filteredRows =
    useMemo(() => {

      return rows.filter(
        row => {

          // --------------------------------------------
          // COMPANY
          // --------------------------------------------

          if (
            filters.company &&
            row["Company Name"] !==
              filters.company
          ) {

            return false;

          }


          // --------------------------------------------
          // FINANCIAL YEAR
          // --------------------------------------------

          if (
            filters.year
          ) {

            const rowFinancialYear =
              getFinancialYearFromRow(
                row
              );

            if (
              rowFinancialYear !==
              filters.year
            ) {

              return false;

            }
          }


          // --------------------------------------------
          // MONTH
          // --------------------------------------------

          if (
            filters.month
          ) {

            const rowMonth =
              getMonthFromDate(
                row["Date Client Acquired"]
              );

            if (
              rowMonth !==
              filters.month
            ) {

              return false;

            }
          }


          // --------------------------------------------
          // BD MEMBER
          // --------------------------------------------

          if (
            filters.bdMember &&
            row["BD Member"] !==
              filters.bdMember
          ) {

            return false;

          }


          // --------------------------------------------
          // TEAM LEADER
          // --------------------------------------------

          if (
            filters.teamLeader &&
            row["Team Leader"] !==
              filters.teamLeader
          ) {

            return false;

          }


          // --------------------------------------------
          // FRANCHISE
          // --------------------------------------------

          if (
            filters.franchise &&
            row["Franchise Name"] !==
              filters.franchise
          ) {

            return false;

          }


          // --------------------------------------------
          // INDUSTRY
          // --------------------------------------------

          if (
            filters.industry &&
            row["Industry"] !==
              filters.industry
          ) {

            return false;

          }


          // --------------------------------------------
          // SUB INDUSTRY
          // --------------------------------------------

          if (
            filters.subIndustry &&
            row["Sub Industry"] !==
              filters.subIndustry
          ) {

            return false;

          }


          // --------------------------------------------
          // CITY
          // --------------------------------------------

          if (
            filters.city &&
            row["City"] !==
              filters.city
          ) {

            return false;

          }


          // --------------------------------------------
          // CLIENT STATUS
          // --------------------------------------------

          if (
            filters.clientStatus &&
            row["Client Status"] !==
              filters.clientStatus
          ) {

            return false;

          }


          // --------------------------------------------
          // POSITION
          // --------------------------------------------

          if (
            filters.position &&
            row["Position Name"] !==
              filters.position
          ) {

            return false;

          }


          return true;

        }
      );

    }, [
      rows,
      filters
    ]);


  // ====================================================
  // DASHBOARD DATA
  // ====================================================

  const dashboardData =
    useMemo(() => {

      return processDashboardData(
        filteredRows
      );

    }, [
      filteredRows
    ]);


  // ====================================================
  // PROVIDER
  // ====================================================

  return (

    <DataContext.Provider
      value={{

        // Data
        rows,
        filteredRows,

        // Database
        loading,
        error,

        // Metadata
        fileName,
        lastRefresh,

        // Filters
        filters,
        setFilters,

        // Dashboard
        dashboardData,

        // Functions
        loadExcelData,
        fetchLedgerData,

        // Helpers
        getFinancialYearFromRow,
        getFinancialYearFromDate,
        getMonthFromDate,

        // Month order
        financialMonths:
          FINANCIAL_MONTHS

      }}
    >

      {children}

    </DataContext.Provider>
  );
}


// ======================================================
// USE DATA
// ======================================================

export function useData() {

  return useContext(
    DataContext
  );
}