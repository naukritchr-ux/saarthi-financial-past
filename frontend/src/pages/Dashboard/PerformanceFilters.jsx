import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useData
} from "../../context/DataContext";

import "./PerformanceFilters.css";


function PerformanceFilters() {

  const {
    rows,
    filters,
    setFilters,
    getFinancialYearFromRow,
    getMonthFromDate
  } = useData();


  // ======================================================
  // TEMPORARY FILTER VALUES
  // ======================================================

  const [selectedFilters, setSelectedFilters] =
    useState({
      ...filters,

      viewBy: filters.viewBy || "",

      reportBy: filters.reportBy || "",

      metricView: filters.metricView || "",

      allTime: filters.allTime || "all",

      clientStatus: filters.clientStatus || "",

      enquiryStatus: filters.enquiryStatus || ""
    });


  // ======================================================
  // KEEP LOCAL STATE SYNCHRONIZED
  // ======================================================

  useEffect(() => {

    setSelectedFilters({
      ...filters,

      viewBy: filters.viewBy || "",

      reportBy: filters.reportBy || "",

      metricView: filters.metricView || "",

      allTime: filters.allTime || "all",

      clientStatus: filters.clientStatus || "",

      enquiryStatus: filters.enquiryStatus || ""
    });

  }, [filters]);


  // ======================================================
  // UNIQUE VALUES
  // ======================================================

  function getUniqueValues(column) {

    return [
      ...new Set(

        rows

          .map(row => row[column])

          .filter(
            value =>
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ""
          )

          .map(value =>
            String(value).trim()
          )

      )

    ].sort(
      (a, b) =>
        String(a).localeCompare(
          String(b)
        )
    );

  }


  // ======================================================
  // FINANCIAL YEARS
  // ======================================================

  const financialYears =
    useMemo(() => {

      return [

        ...new Set(

          rows

            .map(row =>
              getFinancialYearFromRow(row)
            )

            .filter(Boolean)

        )

      ].sort((a, b) => {

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

    }, [
      rows,
      getFinancialYearFromRow
    ]);


  // ======================================================
  // MONTHS
  // ======================================================

  const months =
    useMemo(() => {

      if (!selectedFilters.year) {
        return [];
      }


      const monthSet = new Set();


      rows.forEach(row => {

        const financialYear =
          getFinancialYearFromRow(row);


        if (
          financialYear !==
          selectedFilters.year
        ) {
          return;
        }


        const month =
          getMonthFromDate(
            row["Date Client Acquired"]
          );


        if (month) {
          monthSet.add(month);
        }

      });


      const monthOrder = [

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


      return monthOrder.filter(
        month =>
          monthSet.has(month)
      );

    }, [
      rows,
      selectedFilters.year,
      getFinancialYearFromRow,
      getMonthFromDate
    ]);


  // ======================================================
  // REPORT VIEW
  // ======================================================

  const reportView =
    selectedFilters.viewBy || "";


  // ======================================================
  // REPORT BY OPTIONS
  // ======================================================

  const reportByOptions = [

    {
      label: "Business Development Member",
      value: "bdMember"
    },

    {
      label: "Team Leader",
      value: "teamLeader"
    },

    {
      label: "Franchisee",
      value: "franchise"
    },

    {
      label: "City",
      value: "city"
    },

    {
      label: "Industry",
      value: "industry"
    },

    {
      label: "Sub Industry",
      value: "subIndustry"
    }

  ];


  // ======================================================
  // VIEW BY OPTIONS
  // ======================================================

  const metricViewOptions = [

    {
      label: "Count",
      value: "count"
    },

    {
      label: "Revenue",
      value: "revenue"
    }

  ];


  // ======================================================
  // CLIENT STATUS OPTIONS
  // ======================================================

  const clientStatusOptions =
    useMemo(() => {

      return getUniqueValues(
        "Client Status"
      );

    }, [rows]);


  // ======================================================
  // ENQUIRY STATUS OPTIONS
  // ======================================================

  const enquiryStatusOptions = [

    {
      label: "Closed",
      value: "C"
    },

    {
      label: "Credit Note",
      value: "CN"
    },

    {
      label: "Inprogress",
      value: "IP"
    },

    {
      label: "Legal",
      value: "LEGAL"
    },

    {
      label: "Reallocation",
      value: "R"
    },

    {
      label: "Revised",
      value: "RV"
    }

  ];


  // ======================================================
  // HANDLE SELECTION
  // ======================================================

  function handleChange(
    field,
    value
  ) {

    setSelectedFilters(previous => {

      const updated = {
        ...previous,
        [field]: value
      };


      // ================================================
      // REPORT VIEW CHANGED
      // ================================================

      if (field === "viewBy") {

        updated.reportBy = "";

        updated.metricView = "";

      }


      // ================================================
      // FINANCIAL YEAR CHANGED
      // ================================================

      if (field === "year") {

        updated.month = "";

      }


      return updated;

    });

  }


  // ======================================================
  // APPLY FILTERS
  // ======================================================

  function applyFilters() {

    setFilters({
      ...selectedFilters
    });

  }


  // ======================================================
  // CLEAR FILTERS
  // ======================================================

  function clearFilters() {

    const emptyFilters = {

      // -----------------------------------------------
      // REPORT VIEW
      // -----------------------------------------------

      viewBy: "",

      reportBy: "",

      metricView: "",

      allTime: "all",

      sortBy: "",


      // -----------------------------------------------
      // GENERAL FILTERS
      // -----------------------------------------------

      company: "",

      year: "",

      month: "",

      quarter: "",


      // -----------------------------------------------
      // ORGANIZATION FILTERS
      // -----------------------------------------------

      bdMember: "",

      teamLeader: "",

      franchise: "",

      industry: "",

      subIndustry: "",

      city: "",


      // -----------------------------------------------
      // STATUS FILTERS
      // -----------------------------------------------

      clientStatus: "",

      enquiryStatus: "",


      // -----------------------------------------------
      // POSITION
      // -----------------------------------------------

      position: ""

    };


    setSelectedFilters(
      emptyFilters
    );


    setFilters(
      emptyFilters
    );

  }


  // ======================================================
  // BASE REPORT FILTERS
  // ======================================================

  const baseReportFilters = [

    {
      label: "Reports View",

      field: "viewBy",

      options: [

        {
          label: "None",
          value: ""
        },

        {
          label: "Client Performance",
          value: "client"
        },

        {
          label: "Enquiry Performance",
          value: "enquiry"
        }

      ]

    },


    {
      label: "All Time",

      field: "allTime",

      options: [

        {
          label: "All Time",
          value: "all"
        },

        {
          label: "Yearly",
          value: "yearly"
        },

        {
          label: "Monthly",
          value: "monthly"
        },

        {
          label: "Quarterly",
          value: "quarterly"
        }

      ]

    }

  ];


  // ======================================================
  // REPORT-SPECIFIC FILTERS
  // ======================================================

  const reportSpecificFilters = [];


  // ======================================================
  // CLIENT PERFORMANCE
  // ======================================================

  if (reportView === "client") {

    reportSpecificFilters.push({

      label: "Report By",

      field: "reportBy",

      options: reportByOptions

    });


    reportSpecificFilters.push({

      label: "View By",

      field: "metricView",

      options: metricViewOptions

    });

  }


  // ======================================================
  // ENQUIRY PERFORMANCE
  // ======================================================

  if (reportView === "enquiry") {

    reportSpecificFilters.push({

      label: "Report By",

      field: "reportBy",

      options: reportByOptions

    });


    reportSpecificFilters.push({

      label: "View By",

      field: "metricView",

      options: metricViewOptions

    });

  }


  // ======================================================
  // STATUS FILTERS
  //
  // NONE:
  // Client Status + Enquiry Status
  //
  // CLIENT:
  // Client Status only
  //
  // ENQUIRY:
  // Enquiry Status only
  // ======================================================

  const statusFilters = [];


  // ======================================================
  // OVERALL BUSINESS PERFORMANCE
  // ======================================================

  if (reportView === "") {

    statusFilters.push({

      label: "Client Status",

      field: "clientStatus",

      options: clientStatusOptions

    });


    statusFilters.push({

      label: "Enquiry Status",

      field: "enquiryStatus",

      options: enquiryStatusOptions,

      type: "enquiryStatus"

    });

  }


  // ======================================================
  // CLIENT PERFORMANCE
  // ======================================================

  if (reportView === "client") {

    statusFilters.push({

      label: "Client Status",

      field: "clientStatus",

      options: clientStatusOptions

    });

  }


  // ======================================================
  // ENQUIRY PERFORMANCE
  // ======================================================

  if (reportView === "enquiry") {

    statusFilters.push({

      label: "Enquiry Status",

      field: "enquiryStatus",

      options: enquiryStatusOptions,

      type: "enquiryStatus"

    });

  }


  // ======================================================
  // GENERAL FILTER CONFIG
  // ======================================================

  const filtersConfig = [

    {
      label: "Financial Year",

      field: "year",

      type: "year"
    },

    {
      label: "Month",

      field: "month",

      type: "month"
    },

    {
      label: "Team Leader",

      field: "teamLeader",

      column: "Team Leader"
    },

    {
      label: "BD Member",

      field: "bdMember",

      column: "BD Member"
    },

    {
      label: "Franchise",

      field: "franchise",

      column: "Franchise Name"
    },

    {
      label: "Industry",

      field: "industry",

      column: "Industry"
    },

    {
      label: "Sub Industry",

      field: "subIndustry",

      column: "Sub Industry"
    },

    {
      label: "City",

      field: "city",

      column: "City"
    },

    {
      label: "Position",

      field: "position",

      column: "Position Name"
    }

  ];


  // ======================================================
  // GET OPTIONS
  // ======================================================

  function renderOptions(filter) {

    if (filter.type === "year") {

      return financialYears;

    }


    if (filter.type === "month") {

      return months;

    }


    if (
      filter.type ===
      "enquiryStatus"
    ) {

      return enquiryStatusOptions;

    }


    return getUniqueValues(
      filter.column
    );

  }


  // ======================================================
  // RENDER SELECT
  // ======================================================

  function renderSelect(
    filter
  ) {

    const options =
      filter.options ||
      renderOptions(filter);


    const monthDisabled =
      filter.type === "month" &&
      !selectedFilters.year;


    return (

      <div
        className="filter-box"
        key={filter.field}
      >

        <label>
          {filter.label}
        </label>


        <select

          value={
            selectedFilters[
              filter.field
            ] || ""
          }

          disabled={
            monthDisabled
          }

          onChange={e =>
            handleChange(
              filter.field,
              e.target.value
            )
          }

        >

          <option value="">

            {
              monthDisabled
                ? "Select Financial Year First"
                : `All ${filter.label}`
            }

          </option>


          {

            options.map(option => {

              // ========================================
              // OBJECT OPTION
              // ========================================

              if (
                typeof option ===
                "object"
              ) {

                return (

                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >

                    {
                      option.label
                    }

                  </option>

                );

              }


              // ========================================
              // NORMAL OPTION
              // ========================================

              return (

                <option
                  key={option}
                  value={option}
                >

                  {option}

                </option>

              );

            })

          }

        </select>

      </div>

    );

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="performance-filter-panel">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="filter-header">

        <h3>
          Reports View
        </h3>


        <div className="filter-actions">

          <button
            type="button"
            className="filter-button"
            onClick={applyFilters}
          >
            Filter
          </button>


          <button
            type="button"
            className="clear-filter-button"
            onClick={clearFilters}
          >
            Clear Filter
          </button>

        </div>

      </div>


      {/* ==================================================
          BASE REPORT FILTERS
      ================================================== */}

      <div className="base-performance-grid">

        {

          baseReportFilters.map(
            filter =>
              renderSelect(filter)
          )

        }

      </div>


      {/* ==================================================
          CLIENT / ENQUIRY REPORT FILTERS
      ================================================== */}

      {

        reportSpecificFilters.length > 0 && (

          <>

            <div className="additional-filter-title">

              {
                reportView === "client"
                  ? "Client Performance Filters"
                  : "Enquiry Performance Filters"
              }

            </div>


            <div className="base-performance-grid">

              {

                reportSpecificFilters.map(
                  filter =>
                    renderSelect(filter)
                )

              }

            </div>

          </>

        )

      }


      {/* ==================================================
          ADDITIONAL FILTERS
      ================================================== */}

      <div className="additional-filter-title">

        Additional Filters

      </div>


      <div className="filter-grid">

        {

          filtersConfig.map(
            filter =>
              renderSelect(filter)
          )

        }


        {/* ================================================
            STATUS FILTERS
            ================================================ */}

        {

          statusFilters.map(
            filter =>
              renderSelect(filter)
          )

        }

      </div>


    </div>

  );

}


export default PerformanceFilters;