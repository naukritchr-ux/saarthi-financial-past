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


  /* =========================================================
     TEMPORARY FILTER VALUES
     ========================================================= */

  const [selectedFilters, setSelectedFilters] =
    useState({

      ...filters,

      viewBy:
        filters.viewBy || "",

      reportBy:
        filters.reportBy || "",

      metricView:
        filters.metricView || "",

      allTime:
        filters.allTime || "all",

      sortBy:
        filters.sortBy || "",

      viewReportAs:
        filters.viewReportAs || "all",

      clientStatus:
        filters.clientStatus || "",

      enquiryStatus:
        filters.enquiryStatus || ""

    });


  /* =========================================================
     KEEP LOCAL STATE SYNCHRONIZED
     ========================================================= */

  useEffect(() => {

    setSelectedFilters({

      ...filters,

      viewBy:
        filters.viewBy || "",

      reportBy:
        filters.reportBy || "",

      metricView:
        filters.metricView || "",

      allTime:
        filters.allTime || "all",

      sortBy:
        filters.sortBy || "",

      viewReportAs:
        filters.viewReportAs || "all",

      clientStatus:
        filters.clientStatus || "",

      enquiryStatus:
        filters.enquiryStatus || ""

    });

  }, [filters]);


  /* =========================================================
     UNIQUE VALUES
     ========================================================= */

  function getUniqueValues(column) {

    return [

      ...new Set(

        rows

          .map(
            row =>
              row[column]
          )

          .filter(
            value =>
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ""
          )

          .map(
            value =>
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


  /* =========================================================
     FINANCIAL YEARS
     ========================================================= */

  const financialYears =
    useMemo(() => {

      return [

        ...new Set(

          rows

            .map(
              row =>
                getFinancialYearFromRow(row)
            )

            .filter(Boolean)

        )

      ].sort(
        (a, b) => {

          const yearA =
            Number(
              String(a).split("-")[0]
            );

          const yearB =
            Number(
              String(b).split("-")[0]
            );

          return yearA - yearB;

        }
      );

    }, [
      rows,
      getFinancialYearFromRow
    ]);


  /* =========================================================
     MONTHS
     
     Existing Financial Year + Month dependency
     is preserved.
     ========================================================= */

  const months =
    useMemo(() => {

      if (
        !selectedFilters.year
      ) {

        return [

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

      }


      const monthSet =
        new Set();


      rows.forEach(
        row => {

          const financialYear =
            getFinancialYearFromRow(
              row
            );


          if (
            financialYear !==
            selectedFilters.year
          ) {

            return;

          }


          const month =
            getMonthFromDate(
              row[
                "Date Client Acquired"
              ]
            );


          if (month) {

            monthSet.add(
              month
            );

          }

        }
      );


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


  /* =========================================================
     FINANCIAL QUARTERS
     
     Quarter label includes month range.
     ========================================================= */

  const quarters = [

    {
      label: "Q1 (Apr-Jun)",
      value: "Q1"
    },

    {
      label: "Q2 (Jul-Sep)",
      value: "Q2"
    },

    {
      label: "Q3 (Oct-Dec)",
      value: "Q3"
    },

    {
      label: "Q4 (Jan-Mar)",
      value: "Q4"
    }

  ];


  /* =========================================================
     REPORT VIEW
     ========================================================= */

  const reportView =
    selectedFilters.viewBy || "";


  /* =========================================================
     VIEW BY OPTIONS
     ========================================================= */

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


  /* =========================================================
     VIEW REPORT AS OPTIONS
     ========================================================= */

  const viewReportAsOptions = [

    {
      label: "All Time",
      value: "all"
    },

    {
      label: "Yearly",
      value: "yearly"
    },

    {
      label: "Quarterly",
      value: "quarterly"
    },

    {
      label: "Monthly",
      value: "monthly"
    }

  ];


  /* =========================================================
     SORT BY OPTIONS
     ========================================================= */

  const sortByOptions = [

    {
      label: "BD Member",
      value: "bdMember",
      column: "BD Member"
    },

    {
      label: "Team Leader",
      value: "teamLeader",
      column: "Team Leader"
    },

    {
      label: "Franchise",
      value: "franchise",
      column: "Franchise Name"
    }

  ];


  /* =========================================================
     SELECTED SORT OPTION
     ========================================================= */

  const selectedSortOption =
    sortByOptions.find(
      option =>
        option.value ===
        selectedFilters.sortBy
    );


  /* =========================================================
     SORT VALUE OPTIONS
     ========================================================= */

  const sortValueOptions =
    useMemo(() => {

      if (
        !selectedSortOption
      ) {

        return [];

      }


      return getUniqueValues(
        selectedSortOption.column
      );

    }, [
      rows,
      selectedSortOption
    ]);


  /* =========================================================
     CLIENT STATUS OPTIONS
     ========================================================= */

  const clientStatusOptions =
    useMemo(() => {

      return getUniqueValues(
        "Client Status"
      );

    }, [rows]);


  /* =========================================================
     ENQUIRY STATUS OPTIONS
     ========================================================= */

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


  /* =========================================================
     HANDLE SELECTION
     ========================================================= */

  function handleChange(
    field,
    value
  ) {

    setSelectedFilters(
      previous => {

        const updated = {

          ...previous,

          [field]:
            value

        };


        /* ================================================
           REPORT VIEW CHANGED
           ================================================ */

        if (
          field ===
          "viewBy"
        ) {

          updated.reportBy =
            "";

          updated.metricView =
            "";

        }


        /* ================================================
           SORT BY CHANGED
           
           Clear existing values so that the newly
           selected Sort By field can be used.
           ================================================ */

        if (
          field ===
          "sortBy"
        ) {

          updated.bdMember =
            "";

          updated.teamLeader =
            "";

          updated.franchise =
            "";

        }


        /* ================================================
           VIEW REPORT AS CHANGED
           
           ALL TIME
           No dependent period.

           YEARLY
           Only FY.

           QUARTERLY
           Only Quarter.

           MONTHLY
           Only Month.
           ================================================ */

        if (
          field ===
          "viewReportAs"
        ) {


          if (
            value ===
            "all"
          ) {

            updated.year =
              "";

            updated.month =
              "";

            updated.quarter =
              "";

          }


          if (
            value ===
            "yearly"
          ) {

            updated.month =
              "";

            updated.quarter =
              "";

          }


          if (
            value ===
            "quarterly"
          ) {

            updated.year =
              "";

            updated.month =
              "";

          }


          if (
            value ===
            "monthly"
          ) {

            updated.year =
              "";

            updated.quarter =
              "";

          }

        }


        /* ================================================
           FINANCIAL YEAR CHANGED
           
           Existing old filter behavior preserved.
           ================================================ */

        if (
          field ===
          "year"
        ) {

          updated.month =
            "";

          updated.quarter =
            "";

        }


        return updated;

      }
    );

  }


  /* =========================================================
     HANDLE SORT VALUE
     ========================================================= */

  function handleSortValueChange(
    value
  ) {

    if (
      !selectedSortOption
    ) {

      return;

    }


    setSelectedFilters(
      previous => {

        const updated = {

          ...previous

        };


        if (
          selectedSortOption.value ===
          "bdMember"
        ) {

          updated.bdMember =
            value;

        }


        if (
          selectedSortOption.value ===
          "teamLeader"
        ) {

          updated.teamLeader =
            value;

        }


        if (
          selectedSortOption.value ===
          "franchise"
        ) {

          updated.franchise =
            value;

        }


        return updated;

      }
    );

  }


  /* =========================================================
     APPLY FILTERS
     ========================================================= */

  function applyFilters() {

    setFilters({

      ...selectedFilters

    });

  }


  /* =========================================================
     CLEAR FILTERS
     ========================================================= */

  function clearFilters() {

    const emptyFilters = {

      viewBy: "",

      reportBy: "",

      metricView: "",

      allTime: "all",

      viewReportAs: "all",

      sortBy: "",

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

      enquiryStatus: "",

      position: ""

    };


    setSelectedFilters(
      emptyFilters
    );

    setFilters(
      emptyFilters
    );

  }


  /* =========================================================
     ADDITIONAL FILTERS
     ========================================================= */

  const additionalFilters = [

    {
      label: "Team Leader",
      field: "teamLeader",
      options:
        getUniqueValues(
          "Team Leader"
        )
    },

    {
      label: "BD Member",
      field: "bdMember",
      options:
        getUniqueValues(
          "BD Member"
        )
    },

    {
      label: "Franchise",
      field: "franchise",
      options:
        getUniqueValues(
          "Franchise Name"
        )
    },

    {
      label: "Industry",
      field: "industry",
      options:
        getUniqueValues(
          "Industry"
        )
    },

    {
      label: "Sub Industry",
      field: "subIndustry",
      options:
        getUniqueValues(
          "Sub Industry"
        )
    },

    {
      label: "City",
      field: "city",
      options:
        getUniqueValues(
          "City"
        )
    },

    {
      label: "Position",
      field: "position",
      options:
        getUniqueValues(
          "Position Name"
        )
    }

  ];


  /* =========================================================
     REMOVE SELECTED SORT FIELD
     FROM ADDITIONAL FILTERS
     ========================================================= */

  const visibleAdditionalFilters =
    additionalFilters.filter(
      filter =>
        filter.field !==
        selectedFilters.sortBy
    );


  /* =========================================================
     RENDER SELECT
     ========================================================= */

  function renderSelect(
    label,
    field,
    options,
    placeholder = "Select"
  ) {

    return (

      <div
        className="filter-box"
        key={field}
      >

        <label>
          {label}
        </label>

        <select
          value={
            selectedFilters[field] ||
            ""
          }
          onChange={
            event =>
              handleChange(
                field,
                event.target.value
              )
          }
        >

          <option value="">
            {placeholder}
          </option>

          {options.map(
            option => {

              const value =
                typeof option ===
                "object"
                  ? option.value
                  : option;

              const text =
                typeof option ===
                "object"
                  ? option.label
                  : option;


              return (

                <option
                  key={value}
                  value={value}
                >
                  {text}
                </option>

              );

            }
          )}

        </select>

      </div>

    );

  }


  /* =========================================================
     RENDER SORT VALUE
     ========================================================= */

  function renderSortValue() {

    if (
      !selectedSortOption
    ) {

      return null;

    }


    let currentValue =
      "";


    if (
      selectedSortOption.value ===
      "bdMember"
    ) {

      currentValue =
        selectedFilters.bdMember ||
        "";

    }


    if (
      selectedSortOption.value ===
      "teamLeader"
    ) {

      currentValue =
        selectedFilters.teamLeader ||
        "";

    }


    if (
      selectedSortOption.value ===
      "franchise"
    ) {

      currentValue =
        selectedFilters.franchise ||
        "";

    }


    return (

      <div
        className="filter-box sort-value-box"
      >

        <label>
          Select Value
        </label>

        <select
          value={
            currentValue
          }
          onChange={
            event =>
              handleSortValueChange(
                event.target.value
              )
          }
        >

          <option value="">
            Select Value
          </option>

          {sortValueOptions.map(
            value => (

              <option
                key={value}
                value={value}
              >
                {value}
              </option>

            )
          )}

        </select>

      </div>

    );

  }


  /* =========================================================
     VIEW REPORT PERIOD FILTERS
     
     IMPORTANT:
     
     All Time
     → No dependent filter

     Yearly
     → FY only

     Quarterly
     → Quarter only

     Monthly
     → Month only

     NO FY for Quarterly or Monthly.
     ========================================================= */

  function renderViewReportPeriodFilters() {


    /* =======================================================
       ALL TIME
       ======================================================= */

    if (
      selectedFilters.viewReportAs ===
      "all"
    ) {

      return null;

    }


    /* =======================================================
       YEARLY
       
       FY only.
       ======================================================= */

    if (
      selectedFilters.viewReportAs ===
      "yearly"
    ) {

      return (

        <>

          {renderSelect(
            "FY",
            "year",
            financialYears,
            "Select FY"
          )}

        </>

      );

    }


    /* =======================================================
       QUARTERLY
       
       Quarter only.
       NO FY.
       ======================================================= */

    if (
      selectedFilters.viewReportAs ===
      "quarterly"
    ) {

      return (

        <>

          {renderSelect(
            "Quarter",
            "quarter",
            quarters,
            "Select Quarter"
          )}

        </>

      );

    }


    /* =======================================================
       MONTHLY
       
       Month only.
       NO FY.
       ======================================================= */

    if (
      selectedFilters.viewReportAs ===
      "monthly"
    ) {

      return (

        <>

          {renderSelect(
            "Month",
            "month",
            [
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
            ],
            "Select Month"
          )}

        </>

      );

    }


    return null;

  }


  /* =========================================================
     JSX
     ========================================================= */

  return (

    <div
      className="performance-filter-panel"
    >


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        className="filter-header"
      >

        <h3>
          Performance Filters
        </h3>


        <div
          className="filter-actions"
        >

          <button
            type="button"
            className="filter-button"
            onClick={
              applyFilters
            }
          >
            Apply Filters
          </button>


          <button
            type="button"
            className="clear-filter-button"
            onClick={
              clearFilters
            }
          >
            Clear Filters
          </button>

        </div>

      </div>


      {/* =====================================================
          BASE FILTERS
          ===================================================== */}

      <div
        className="base-performance-section"
      >

        <div
          className="base-performance-title"
        >
          Base Filters
        </div>


        <div
          className="base-performance-grid"
        >


          {/* =================================================
              REPORTS VIEW
              ================================================= */}

          {renderSelect(
            "Reports View",
            "viewBy",
            [

              {
                label: "None",
                value: ""
              },

              {
                label:
                  "Client Performance",
                value: "client"
              },

              {
                label:
                  "Enquiry Performance",
                value: "enquiry"
              }

            ],
            "Select View"
          )}


          {/* =================================================
              VIEW BY
              ================================================= */}

          {renderSelect(
            "View By",
            "metricView",
            metricViewOptions,
            "Select View By"
          )}


          {/* =================================================
              SORT BY
              ================================================= */}

          {renderSelect(
            "Sort By",
            "sortBy",
            sortByOptions,
            "Select Sort By"
          )}


          {/* =================================================
              SELECT VALUE
              ================================================= */}

          {renderSortValue()}


          {/* =================================================
              FINANCIAL YEAR
              
              OLD BASE FILTER PRESERVED.
              ================================================= */}

          {renderSelect(
            "Financial Year",
            "year",
            financialYears,
            "Select Financial Year"
          )}


          {/* =================================================
              MONTH
              
              OLD BASE FILTER PRESERVED.
              ================================================= */}

          {renderSelect(
            "Month",
            "month",
            months,
            "Select Month"
          )}


          {/* =================================================
              VIEW REPORT AS
              ================================================= */}

          {renderSelect(
            "View Report As:",
            "viewReportAs",
            viewReportAsOptions,
            "Select View Report As"
          )}


          {/* =================================================
              DEPENDENT VIEW REPORT FILTER
              ================================================= */}

          {renderViewReportPeriodFilters()}

        </div>

      </div>


      {/* =====================================================
          ADDITIONAL FILTERS
          ===================================================== */}

      <div
        className="additional-filter-section"
      >

        <div
          className="additional-filter-title"
        >
          Additional Filters
        </div>


        <div
          className="filter-grid"
        >


          {/* =================================================
              NORMAL ADDITIONAL FILTERS
              ================================================= */}

          {visibleAdditionalFilters.map(
            filter =>
              renderSelect(
                filter.label,
                filter.field,
                filter.options,
                `Select ${filter.label}`
              )
          )}


          {/* =================================================
              CLIENT STATUS
              
              Visible for:
              - Overall Dashboard
              - Client Performance
              ================================================= */}

          {(
            reportView === "" ||
            reportView === "client"
          ) && (

            <div
              className="filter-box"
            >

              <label>
                Client Status
              </label>

              <select
                value={
                  selectedFilters.clientStatus ||
                  ""
                }
                onChange={
                  event =>
                    handleChange(
                      "clientStatus",
                      event.target.value
                    )
                }
              >

                <option value="">
                  Select Client Status
                </option>

                {clientStatusOptions.map(
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

          )}


          {/* =================================================
              ENQUIRY STATUS
              
              Visible for:
              - Overall Dashboard
              - Enquiry Performance
              ================================================= */}

          {(
            reportView === "" ||
            reportView === "enquiry"
          ) && (

            <div
              className="filter-box"
            >

              <label>
                Enquiry Status
              </label>

              <select
                value={
                  selectedFilters.enquiryStatus ||
                  ""
                }
                onChange={
                  event =>
                    handleChange(
                      "enquiryStatus",
                      event.target.value
                    )
                }
              >

                <option value="">
                  Select Enquiry Status
                </option>

                {enquiryStatusOptions.map(
                  status => (

                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {
                        status.label
                      }
                    </option>

                  )
                )}

              </select>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}


export default PerformanceFilters;