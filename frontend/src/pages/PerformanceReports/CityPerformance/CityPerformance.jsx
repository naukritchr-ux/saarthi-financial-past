import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./CityPerformance.css";


function CityPerformance() {

  const {
    rows,
    loading,
    error
  } = useData();


  /* ============================================================
     STATES
     ============================================================ */

  const [selectedCity, setSelectedCity] = useState(null);

  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState("All Financial Years");

  const [selectedInfoStatus, setSelectedInfoStatus] =
    useState("All");

  const [showModal, setShowModal] = useState(false);

  const [reportYear, setReportYear] =
    useState("All Financial Years");


  /* ============================================================
     HELPERS
     ============================================================ */

  const normalizeValue = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  };


  const getInfoStatus = (row) => {

    return normalizeValue(row["Info"]).toUpperCase();

  };


  const getCity = (row) => {

    const city = normalizeValue(row["City"]);

    return city || "Unknown";

  };


  const getBilling = (row) => {

    const value = Number(
      String(row["Total Bill Amount"] ?? "")
        .replace(/,/g, "")
        .replace(/[₹$]/g, "")
        .trim()
    );

    return Number.isFinite(value)
      ? value
      : 0;

  };


  const getFinancialYear = (row) => {

    const dateValue =
      row["Date Client Acquired"];

    if (!dateValue) {
      return "Unknown";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    const year = date.getFullYear();

    const month = date.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${year + 1}`;
    }

    return `${year - 1}-${year}`;

  };


  const formatCurrency = (value) => {

    const amount = Number(value) || 0;

    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })}`;

  };


  const formatNumber = (value) => {

    return Number(value || 0).toLocaleString(
      "en-IN"
    );

  };


  /* ============================================================
     FINANCIAL CALCULATION
     
     ALL:
       R + RV + C + CN
       Billing = actual billing
       Expenditure = 5%
       Net Amount = Billing - Expenditure

     R:
       Billing = actual billing
       Expenditure = 5%
       Net Amount = Billing - Expenditure

     RV:
       Billing = actual billing
       Expenditure = 0
       Net Amount = 0

     C:
       Billing = actual billing
       Expenditure = 0
       Net Amount = 0

     CN:
       Billing = actual billing
       Expenditure = 0
       Net Amount = 0
  ============================================================ */

  const getFinancialValues = (
    row,
    infoFilter = ""
  ) => {

    const info = getInfoStatus(row);

    const billing = getBilling(row);


    /* ---------------- ALL ---------------- */

    if (
      !infoFilter ||
      infoFilter === "ALL"
    ) {

      const expenditure =
        billing * 0.05;

      return {

        billing,

        expenditure,

        netAmount:
          billing - expenditure

      };

    }


    /* ---------------- R ---------------- */

    if (infoFilter === "R") {

      if (info !== "R") {

        return {

          billing: 0,

          expenditure: 0,

          netAmount: 0

        };

      }

      const expenditure =
        billing * 0.05;

      return {

        billing,

        expenditure,

        netAmount:
          billing - expenditure

      };

    }


    /* ---------------- RV ---------------- */

    if (infoFilter === "RV") {

      if (info !== "RV") {

        return {

          billing: 0,

          expenditure: 0,

          netAmount: 0

        };

      }

      return {

        billing,

        expenditure: 0,

        netAmount: 0

      };

    }


    /* ---------------- C ---------------- */

    if (infoFilter === "C") {

      if (info !== "C") {

        return {

          billing: 0,

          expenditure: 0,

          netAmount: 0

        };

      }

      return {

        billing,

        expenditure: 0,

        netAmount: 0

      };

    }


    /* ---------------- CN ---------------- */

    if (infoFilter === "CN") {

      if (info !== "CN") {

        return {

          billing: 0,

          expenditure: 0,

          netAmount: 0

        };

      }

      return {

        billing,

        expenditure: 0,

        netAmount: 0

      };

    }


    return {

      billing: 0,

      expenditure: 0,

      netAmount: 0

    };

  };


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const year =
        getFinancialYear(row);

      if (year !== "Unknown") {
        years.add(year);
      }

    });

    return Array.from(years).sort(
      (a, b) => b.localeCompare(a)
    );

  }, [rows]);


  /* ============================================================
     FILTERED ROWS
     ============================================================ */

  const filteredRows = useMemo(() => {

    return rows.filter((row) => {

      const financialYear =
        getFinancialYear(row);

      const info =
        getInfoStatus(row);


      const financialYearMatch =
        selectedFinancialYear ===
          "All Financial Years" ||
        financialYear ===
          selectedFinancialYear;


      const infoMatch =
        selectedInfoStatus === "All" ||
        info === selectedInfoStatus;


      return (
        financialYearMatch &&
        infoMatch
      );

    });

  }, [
    rows,
    selectedFinancialYear,
    selectedInfoStatus
  ]);


  /* ============================================================
     CITY DATA
     ============================================================ */

  const cityData = useMemo(() => {

    const map = {};

    filteredRows.forEach((row) => {

      const city =
        getCity(row);

      const financial =
        getFinancialValues(
          row,
          selectedInfoStatus === "All"
            ? ""
            : selectedInfoStatus
        );


      if (!map[city]) {

        map[city] = {

          city,

          clients: 0,

          billing: 0,

          netAmount: 0,

          expenditure: 0

        };

      }


      map[city].clients += 1;

      map[city].billing +=
        financial.billing;

      map[city].netAmount +=
        financial.netAmount;

      map[city].expenditure +=
        financial.expenditure;

    });


    return Object.values(map)
      .sort(
        (a, b) =>
          b.billing - a.billing
      );

  }, [
    filteredRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     SELECTED CITY DATA
     ============================================================ */

  const selectedCityRows = useMemo(() => {

    if (!selectedCity) {
      return [];
    }

    return filteredRows.filter(
      (row) =>
        getCity(row) === selectedCity
    );

  }, [
    filteredRows,
    selectedCity
  ]);


  /* ============================================================
     CITY SUMMARY
     ============================================================ */

  const citySummary = useMemo(() => {

    if (!selectedCity) {

      return {

        clients: 0,

        billing: 0,

        expenditure: 0,

        netAmount: 0,

        topIndustry: "N/A",

        topTeamLeader: "N/A",

        topBDMember: "N/A"

      };

    }


    let billing = 0;

    let expenditure = 0;

    let netAmount = 0;


    const industryCount = {};

    const teamLeaderCount = {};

    const bdMemberCount = {};


    selectedCityRows.forEach(
      (row) => {

        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus === "All"
              ? ""
              : selectedInfoStatus
          );


        billing +=
          financial.billing;

        expenditure +=
          financial.expenditure;

        netAmount +=
          financial.netAmount;


        const industry =
          normalizeValue(
            row["Industry"]
          ) || "Unknown";

        const teamLeader =
          normalizeValue(
            row["Team Leader"]
          ) || "Unknown";

        const bdMember =
          normalizeValue(
            row["BD Member"]
          ) || "Unknown";


        industryCount[industry] =
          (industryCount[industry] || 0) + 1;

        teamLeaderCount[teamLeader] =
          (teamLeaderCount[teamLeader] || 0) + 1;

        bdMemberCount[bdMember] =
          (bdMemberCount[bdMember] || 0) + 1;

      }
    );


    const getTopValue = (object) => {

      const entries =
        Object.entries(object);

      if (!entries.length) {
        return "N/A";
      }

      entries.sort(
        (a, b) => b[1] - a[1]
      );

      return entries[0][0];

    };


    return {

      clients:
        selectedCityRows.length,

      billing,

      expenditure,

      netAmount,

      topIndustry:
        getTopValue(industryCount),

      topTeamLeader:
        getTopValue(teamLeaderCount),

      topBDMember:
        getTopValue(bdMemberCount)

    };

  }, [
    selectedCity,
    selectedCityRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     YEARLY CLIENT DATA
     ============================================================ */

  const yearlyClientData = useMemo(() => {

    if (!selectedCity) {
      return [];
    }


    const map = {};


    selectedCityRows.forEach(
      (row) => {

        const year =
          getFinancialYear(row);

        if (
          year === "Unknown"
        ) {
          return;
        }


        if (!map[year]) {
          map[year] = {
            year,
            clients: 0
          };
        }


        map[year].clients += 1;

      }
    );


    return Object.values(map)
      .sort(
        (a, b) =>
          a.year.localeCompare(b.year)
      );

  }, [
    selectedCity,
    selectedCityRows
  ]);


  /* ============================================================
     YEARLY BILLING DATA
     ============================================================ */

  const yearlyBillingData = useMemo(() => {

    if (!selectedCity) {
      return [];
    }


    const map = {};


    selectedCityRows.forEach(
      (row) => {

        const year =
          getFinancialYear(row);

        if (
          year === "Unknown"
        ) {
          return;
        }


        if (!map[year]) {

          map[year] = {

            year,

            billing: 0

          };

        }


        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus === "All"
              ? ""
              : selectedInfoStatus
          );


        map[year].billing +=
          financial.billing;

      }
    );


    return Object.values(map)
      .sort(
        (a, b) =>
          a.year.localeCompare(b.year)
      );

  }, [
    selectedCity,
    selectedCityRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     MONTHLY CLIENT DATA
     ============================================================ */

  const monthlyClientData = useMemo(() => {

    if (!selectedCity) {
      return [];
    }


    const months = [
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar"
    ];


    const map = {};


    months.forEach(
      (month) => {

        map[month] = {

          month,

          clients: 0

        };

      }
    );


    selectedCityRows.forEach(
      (row) => {

        const dateValue =
          row["Date Client Acquired"];


        if (!dateValue) {
          return;
        }


        const date =
          new Date(dateValue);


        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }


        const monthIndex =
          date.getMonth();


        const month =
          monthIndex >= 3
            ? months[monthIndex - 3]
            : months[monthIndex + 9];


        if (map[month]) {

          map[month].clients += 1;

        }

      }
    );


    return Object.values(map);

  }, [
    selectedCity,
    selectedCityRows
  ]);


  /* ============================================================
     MONTHLY BILLING DATA
     ============================================================ */

  const monthlyBillingData = useMemo(() => {

    if (!selectedCity) {
      return [];
    }


    const months = [
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar"
    ];


    const map = {};


    months.forEach(
      (month) => {

        map[month] = {

          month,

          billing: 0

        };

      }
    );


    selectedCityRows.forEach(
      (row) => {

        const dateValue =
          row["Date Client Acquired"];


        if (!dateValue) {
          return;
        }


        const date =
          new Date(dateValue);


        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }


        const monthIndex =
          date.getMonth();


        const month =
          monthIndex >= 3
            ? months[monthIndex - 3]
            : months[monthIndex + 9];


        const financial =
          getFinancialValues(
            row,
            selectedInfoStatus === "All"
              ? ""
              : selectedInfoStatus
          );


        if (map[month]) {

          map[month].billing +=
            financial.billing;

        }

      }
    );


    return Object.values(map);

  }, [
    selectedCity,
    selectedCityRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     REPORT DATA BASED ON REPORT YEAR
     ============================================================ */

  const reportYearRows = useMemo(() => {

    if (
      reportYear ===
      "All Financial Years"
    ) {

      return selectedCityRows;

    }


    return selectedCityRows.filter(
      (row) =>
        getFinancialYear(row) ===
        reportYear
    );

  }, [
    selectedCityRows,
    reportYear
  ]);


  /* ============================================================
     OPEN PERFORMANCE
     ============================================================ */

  const handleViewPerformance = (
    city
  ) => {

    setSelectedCity(city);

    setReportYear(
      selectedFinancialYear
    );

    setShowModal(true);

  };


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const handleCloseModal = () => {

    setShowModal(false);

    setSelectedCity(null);

  };


  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {

    return (

      <div className="city-performance-page">

        <div className="city-empty">

          Loading city performance...

        </div>

      </div>

    );

  }


  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {

    return (

      <div className="city-performance-page">

        <div className="city-empty">

          <h3>
            Unable to load city performance
          </h3>

          <p>
            {error}
          </p>

        </div>

      </div>

    );

  }


  /* ============================================================
     RENDER
     ============================================================ */

  return (

    <div className="city-performance-page">


      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="city-page-header">

        <div>

          <div className="city-page-eyebrow">
            PERFORMANCE REPORT
          </div>

          <h1>
            City Performance
          </h1>

          <p>
            Analyze client acquisition,
            billing and financial performance
            city-wise.
          </p>

        </div>

      </div>


      {/* ======================================================
          TABLE CARD
      ====================================================== */}

      <div className="city-table-card">


        {/* ====================================================
            TABLE HEADER
        ==================================================== */}

        <div className="city-table-header">

          <div>

            <h2>
              City Performance
            </h2>

            <span className="city-member-count">

              {cityData.length}{" "}
              {cityData.length === 1
                ? "City"
                : "Cities"}

            </span>

          </div>


          {/* ==================================================
              FILTERS
          ================================================== */}

          <div className="city-header-filters">


            <div className="city-filter-group">

              <label>
                Financial Year
              </label>

              <select
                value={
                  selectedFinancialYear
                }
                onChange={(e) =>
                  setSelectedFinancialYear(
                    e.target.value
                  )
                }
              >

                <option>
                  All Financial Years
                </option>

                {financialYears.map(
                  (year) => (

                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="city-filter-group">

              <label>
                Info Status
              </label>

              <select
                value={
                  selectedInfoStatus
                }
                onChange={(e) =>
                  setSelectedInfoStatus(
                    e.target.value
                  )
                }
              >

                <option value="All">
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

          </div>

        </div>


        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="city-table-wrapper">

          <table className="city-table">

            <thead>

              <tr>

                <th>
                  City Name
                </th>

                <th>
                  Client Count
                </th>

                <th>
                  Total Billing
                </th>

                <th>
                  Net Amount
                </th>

                <th>
                  Expenditure
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {cityData.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="city-empty"
                  >
                    No city data available
                    for the selected filters.
                  </td>

                </tr>

              ) : (

                cityData.map(
                  (item) => (

                    <tr
                      key={item.city}
                    >


                      {/* CITY NAME */}

                      <td>

                        <div className="city-name-cell">

                          <span className="city-avatar">

                            {item.city
                              .charAt(0)
                              .toUpperCase()}

                          </span>

                          <span className="city-name">

                            {item.city}

                          </span>

                        </div>

                      </td>


                      {/* CLIENT COUNT */}

                      <td>

                        <span className="city-client-count">

                          {formatNumber(
                            item.clients
                          )}

                        </span>

                      </td>


                      {/* TOTAL BILLING */}

                      <td>

                        <span className="city-billing-value">

                          {formatCurrency(
                            item.billing
                          )}

                        </span>

                      </td>


                      {/* NET AMOUNT */}

                      <td>

                        <span className="city-net-value">

                          {formatCurrency(
                            item.netAmount
                          )}

                        </span>

                      </td>


                      {/* EXPENDITURE */}

                      <td>

                        <span className="city-expenditure-value">

                          {formatCurrency(
                            item.expenditure
                          )}

                        </span>

                      </td>


                      {/* ACTION */}

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

                          View Performance

                          <span className="city-btn-arrow">
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


      {/* ======================================================
          PERFORMANCE MODAL
      ====================================================== */}

      {showModal &&
        selectedCity && (

          <div
            className="city-performance-overlay"
            onClick={
              handleCloseModal
            }
          >

            <div
              className="city-performance-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >


              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="city-modal-header">

                <div>

                  <div className="city-modal-eyebrow">
                    CITY PERFORMANCE
                  </div>

                  <h2>
                    {selectedCity}
                  </h2>

                  <p>
                    Detailed performance
                    analysis for{" "}
                    {selectedCity}.
                  </p>

                </div>


                <button
                  type="button"
                  className="city-modal-close"
                  onClick={
                    handleCloseModal
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


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Client Count
                  </span>

                  <strong className="city-summary-value">

                    {formatNumber(
                      citySummary.clients
                    )}

                  </strong>

                </div>


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Total Billing
                  </span>

                  <strong className="city-summary-value">

                    {formatCurrency(
                      citySummary.billing
                    )}

                  </strong>

                </div>


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Net Amount
                  </span>

                  <strong className="city-summary-net">

                    {formatCurrency(
                      citySummary.netAmount
                    )}

                  </strong>

                </div>


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Expenditure
                  </span>

                  <strong className="city-summary-value">

                    {formatCurrency(
                      citySummary.expenditure
                    )}

                  </strong>

                </div>


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Top Industry
                  </span>

                  <strong className="city-summary-text">

                    {citySummary.topIndustry}

                  </strong>

                </div>


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Top Team Leader
                  </span>

                  <strong className="city-summary-text">

                    {citySummary.topTeamLeader}

                  </strong>

                </div>


                <div className="city-summary-card">

                  <span className="city-summary-label">
                    Top BD Member
                  </span>

                  <strong className="city-summary-text">

                    {citySummary.topBDMember}

                  </strong>

                </div>

              </div>


              {/* =================================================
                  REPORT CONTROLS
              ================================================= */}

              <div className="city-report-controls">

                <div className="city-report-filter">

                  <label>
                    Report Financial Year
                  </label>

                  <select
                    value={reportYear}
                    onChange={(e) =>
                      setReportYear(
                        e.target.value
                      )
                    }
                  >

                    <option>
                      All Financial Years
                    </option>

                    {financialYears.map(
                      (year) => (

                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="city-report-period">

                  Showing{" "}

                  <strong>
                    {reportYear}
                  </strong>

                </div>

              </div>


              {/* =================================================
                  REPORT GRAPHS
              ================================================= */}

              <div className="city-report-graphs">


                {/* =================================================
                    YEARLY CLIENT ACQUISITION
                ================================================= */}

                <div className="city-chart-card">

                  <div className="city-chart-heading">

                    <div>

                      <h3>
                        Yearly Client Acquisition
                      </h3>

                      <p>
                        Clients acquired by
                        financial year
                      </p>

                    </div>

                  </div>


                  <div className="city-chart-container">

                    {yearlyClientData.length ===
                    0 ? (

                      <div className="city-chart-no-data">
                        No data available
                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height={300}
                      >

                        <BarChart
                          data={
                            yearlyClientData
                          }
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="year"
                          />

                          <YAxis
                            allowDecimals={false}
                          />

                          <Tooltip />

                          <Bar
                            dataKey="clients"
                            name="Clients"
                            radius={[
                              6,
                              6,
                              0,
                              0
                            ]}
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </div>

                </div>


                {/* =================================================
                    YEARLY BILLING
                ================================================= */}

                <div className="city-chart-card">

                  <div className="city-chart-heading">

                    <div>

                      <h3>
                        Yearly Total Billing
                      </h3>

                      <p>
                        Billing generated by
                        financial year
                      </p>

                    </div>

                  </div>


                  <div className="city-chart-container">

                    {yearlyBillingData.length ===
                    0 ? (

                      <div className="city-chart-no-data">
                        No data available
                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height={300}
                      >

                        <BarChart
                          data={
                            yearlyBillingData
                          }
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="year"
                          />

                          <YAxis />

                          <Tooltip
                            formatter={(value) =>
                              formatCurrency(
                                value
                              )
                            }
                          />

                          <Bar
                            dataKey="billing"
                            name="Billing"
                            radius={[
                              6,
                              6,
                              0,
                              0
                            ]}
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </div>

                </div>


                {/* =================================================
                    MONTHLY CLIENT ACQUISITION
                ================================================= */}

                <div className="city-chart-card">

                  <div className="city-chart-heading">

                    <div>

                      <h3>
                        Monthly Client Acquisition
                      </h3>

                      <p>
                        Clients acquired month-wise
                      </p>

                    </div>

                  </div>


                  <div className="city-chart-container">

                    {monthlyClientData.length ===
                    0 ? (

                      <div className="city-chart-no-data">
                        No data available
                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height={300}
                      >

                        <BarChart
                          data={
                            monthlyClientData
                          }
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="month"
                          />

                          <YAxis
                            allowDecimals={false}
                          />

                          <Tooltip />

                          <Bar
                            dataKey="clients"
                            name="Clients"
                            radius={[
                              6,
                              6,
                              0,
                              0
                            ]}
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </div>

                </div>


                {/* =================================================
                    MONTHLY BILLING
                ================================================= */}

                <div className="city-chart-card">

                  <div className="city-chart-heading">

                    <div>

                      <h3>
                        Monthly Billing
                      </h3>

                      <p>
                        Billing generated
                        month-wise
                      </p>

                    </div>

                  </div>


                  <div className="city-chart-container">

                    {monthlyBillingData.length ===
                    0 ? (

                      <div className="city-chart-no-data">
                        No data available
                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height={300}
                      >

                        <BarChart
                          data={
                            monthlyBillingData
                          }
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="month"
                          />

                          <YAxis />

                          <Tooltip
                            formatter={(value) =>
                              formatCurrency(
                                value
                              )
                            }
                          />

                          <Bar
                            dataKey="billing"
                            name="Billing"
                            radius={[
                              6,
                              6,
                              0,
                              0
                            ]}
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

                Showing performance for{" "}

                <strong>
                  {selectedCity}
                </strong>

                {" "}•{" "}

                {reportYear}

                {" "}•{" "}

                {reportYearRows.length} records

              </div>

            </div>

          </div>

        )}

    </div>

  );

}


export default CityPerformance;
