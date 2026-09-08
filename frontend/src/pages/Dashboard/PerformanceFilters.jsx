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
      allTime: filters.allTime || "all",
      sortBy: filters.sortBy || ""
    });


  // ======================================================
  // KEEP LOCAL STATE SYNCHRONIZED
  // ======================================================

  useEffect(() => {

    setSelectedFilters({
      ...filters,

      viewBy: filters.viewBy || "",
      allTime: filters.allTime || "all",
      sortBy: filters.sortBy || ""
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


      // Changing financial year
      // resets month

      if (field === "year") {
        updated.month = "";
      }


      return updated;

    });

  }


  // ======================================================
  // APPLY
  // ======================================================

  function applyFilters() {

    setFilters({
      ...selectedFilters
    });

  }


  // ======================================================
  // CLEAR
  // ======================================================

  function clearFilters() {

    const emptyFilters = {

      // -----------------------------------------------
      // NEW PERFORMANCE FILTERS
      // -----------------------------------------------

      viewBy: "",

      allTime: "all",

      sortBy: "",


      // -----------------------------------------------
      // EXISTING FILTERS
      // -----------------------------------------------

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

    };


    setSelectedFilters(
      emptyFilters
    );


    setFilters(
      emptyFilters
    );

  }


  // ======================================================
  // BASE PERFORMANCE FILTERS
  // ======================================================

  const performanceFilters = [

    {
      label: "View By",

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

    },


    {
      label: "Sort By",

      field: "sortBy",

      options: [

        {
          label: "None",
          value: ""
        },

        {
          label: "FRANCHISEE NAME",
          value: "franchise"
        },

        {
          label: "BD MEMBER",
          value: "bdMember"
        },

        {
          label: "TEAM LEADER",
          value: "teamLeader"
        }

      ]

    }

  ];


  // ======================================================
  // EXISTING FILTER CONFIG
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
      label: "City",

      field: "city",

      column: "City"
    },

    {
      label: "Client Status",

      field: "clientStatus",

      column: "Client Status"
    },

    {
      label: "Position",

      field: "position",

      column: "Position Name"
    }

  ];


  // ======================================================
  // OPTIONS
  // ======================================================

  function renderOptions(filter) {

    if (filter.type === "year") {
      return financialYears;
    }


    if (filter.type === "month") {
      return months;
    }


    return getUniqueValues(
      filter.column
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
          View Performance By
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
          NEW PERFORMANCE FILTERS
      ================================================== */}

      <div className="base-performance-grid">

        {
          performanceFilters.map(filter => (

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

                onChange={e =>
                  handleChange(
                    filter.field,
                    e.target.value
                  )
                }

              >

                {
                  filter.options.map(option => (

                    <option
                      key={
                        option.value ||
                        option.label
                      }
                      value={
                        option.value
                      }
                    >

                      {option.label}

                    </option>

                  ))
                }

              </select>

            </div>

          ))
        }

      </div>


      {/* ==================================================
          EXISTING FILTERS
      ================================================== */}

      <div className="additional-filter-title">

        Additional Filters

      </div>


      <div className="filter-grid">

        {

          filtersConfig.map(filter => {

            const options =
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

                    options.map(value => (

                      <option
                        key={value}
                        value={value}
                      >

                        {value}

                      </option>

                    ))

                  }

                </select>

              </div>

            );

          })

        }

      </div>


    </div>

  );

}


export default PerformanceFilters;