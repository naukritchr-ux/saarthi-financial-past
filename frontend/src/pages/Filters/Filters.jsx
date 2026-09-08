import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from "@mui/material";

import {
  FilterAlt,
  RestartAlt
} from "@mui/icons-material";

import {
  useEffect,
  useState
} from "react";

import {
  useData
} from "../../context/DataContext";

import "./Filters.css";


function Filters() {

  const {
    rows,
    filters,
    setFilters,
    getFinancialYearFromRow,
    getMonthFromDate,
    financialMonths
  } = useData();


  // ======================================================
  // FILTER STATE
  // ======================================================

  const [
    selectedFilters,
    setSelectedFilters
  ] = useState({

    ...filters,

    viewBy: filters.viewBy || "",
    allTime: filters.allTime || "all",
    sortBy: filters.sortBy || ""

  });


  // ======================================================
  // KEEP FILTERS IN SYNC
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

          .map(value => String(value).trim())

      )

    ].sort((a, b) => a.localeCompare(b));

  }


  // ======================================================
  // FINANCIAL YEARS
  // ======================================================

  function getFinancialYears() {

    const years = [

      ...new Set(

        rows

          .map(row => getFinancialYearFromRow(row))

          .filter(Boolean)

      )

    ];


    return years.sort((a, b) => {

      const yearA =
        Number(a.split("-")[0]);

      const yearB =
        Number(b.split("-")[0]);

      return yearA - yearB;

    });

  }


  // ======================================================
  // AVAILABLE MONTHS
  // ======================================================

  function getAvailableMonths() {

    if (!selectedFilters.year) {
      return [];
    }


    const availableMonths = new Set();


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
        availableMonths.add(month);
      }

    });


    return financialMonths.filter(
      month =>
        availableMonths.has(month)
    );

  }


  // ======================================================
  // CHANGE FILTER
  // ======================================================

  function handleChange(field, value) {

    setSelectedFilters(previous => {

      const updated = {

        ...previous,

        [field]: value

      };


      // Changing financial year
      // resets selected month

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
  // RESET FILTERS
  // ======================================================

  function resetFilters() {

    const emptyFilters = {

      // ------------------------------------------
      // VIEW PERFORMANCE FILTERS
      // ------------------------------------------

      viewBy: "",

      allTime: "all",

      sortBy: "",


      // ------------------------------------------
      // EXISTING FILTERS
      // ------------------------------------------

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
  // VIEW PERFORMANCE FILTERS
  // ======================================================

  const baseFilterConfig = [

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
  // EXISTING FILTER CONFIGURATION
  // ======================================================

  const filterConfig = [

    {
      label: "Company",
      field: "company",
      column: "Company Name"
    },

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
      label: "BD Member",
      field: "bdMember",
      column: "BD Member"
    },

    {
      label: "Team Leader",
      field: "teamLeader",
      column: "Team Leader"
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
  // GET OPTIONS
  // ======================================================

  function getOptions(filter) {

    if (filter.type === "year") {

      return getFinancialYears();

    }


    if (filter.type === "month") {

      return getAvailableMonths();

    }


    return getUniqueValues(
      filter.column
    );

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <Card className="filters-card">

      <CardContent>


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="filters-header">

          <div>

            <Typography variant="h6">

              Filter & Segmentation

            </Typography>


            <p>

              Combine multiple filters
              to view detailed performance

            </p>

          </div>


          <FilterAlt />

        </div>


        {/* ==================================================
            VIEW PERFORMANCE BY
        ================================================== */}

        <div className="view-performance-section">

          <Typography
            variant="subtitle1"
            className="view-performance-title"
          >

            View Performance By

          </Typography>


          {/* ==================================================
              BASE FILTERS
          ================================================== */}

          <Grid
            container
            spacing={2}
            className="base-performance-filters"
          >

            {
              baseFilterConfig.map(filter => (

                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={filter.field}
                >

                  <FormControl fullWidth>

                    <InputLabel>

                      {filter.label}

                    </InputLabel>


                    <Select

                      label={filter.label}

                      value={
                        selectedFilters[
                          filter.field
                        ] || ""
                      }

                      onChange={event =>
                        handleChange(
                          filter.field,
                          event.target.value
                        )
                      }

                    >

                      {
                        filter.options.map(
                          option => (

                            <MenuItem
                              key={
                                option.value ||
                                option.label
                              }
                              value={
                                option.value
                              }
                            >

                              {option.label}

                            </MenuItem>

                          )
                        )
                      }

                    </Select>

                  </FormControl>

                </Grid>

              ))

            }

          </Grid>


          {/* ==================================================
              OTHER FILTERS
          ================================================== */}

          <Typography
            variant="subtitle2"
            className="additional-filters-title"
          >

            Additional Filters

          </Typography>


          <Grid
            container
            spacing={2}
          >

            {
              filterConfig.map(filter => {

                const options =
                  getOptions(filter);


                const isMonth =
                  filter.type === "month";


                const disabled =
                  isMonth &&
                  !selectedFilters.year;


                return (

                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={3}
                    key={filter.field}
                  >

                    <FormControl
                      fullWidth
                      disabled={disabled}
                    >

                      <InputLabel>

                        {filter.label}

                      </InputLabel>


                      <Select

                        label={
                          filter.label
                        }

                        value={
                          selectedFilters[
                            filter.field
                          ] || ""
                        }

                        onChange={event =>
                          handleChange(
                            filter.field,
                            event.target.value
                          )
                        }

                      >

                        <MenuItem value="">

                          {
                            isMonth
                              ? "All Months"
                              : `All ${filter.label}`
                          }

                        </MenuItem>


                        {
                          options.map(
                            option => (

                              <MenuItem
                                key={option}
                                value={option}
                              >

                                {option}

                              </MenuItem>

                            )
                          )
                        }

                      </Select>

                    </FormControl>

                  </Grid>

                );

              })

            }

          </Grid>

        </div>


        {/* ==================================================
            ACTION BUTTONS
        ================================================== */}

        <div className="filter-actions">

          <Button

            variant="outlined"

            startIcon={
              <RestartAlt />
            }

            onClick={
              resetFilters
            }

          >

            Reset

          </Button>


          <Button

            variant="contained"

            startIcon={
              <FilterAlt />
            }

            onClick={
              applyFilters
            }

          >

            Apply Filters

          </Button>

        </div>


      </CardContent>

    </Card>

  );

}


export default Filters;