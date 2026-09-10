import {
  useMemo,
  useState
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

import "./CityPerformance.css";


const financialMonths = [
  {
    name: "April",
    short: "Apr",
    number: 4
  },
  {
    name: "May",
    short: "May",
    number: 5
  },
  {
    name: "June",
    short: "Jun",
    number: 6
  },
  {
    name: "July",
    short: "Jul",
    number: 7
  },
  {
    name: "August",
    short: "Aug",
    number: 8
  },
  {
    name: "September",
    short: "Sep",
    number: 9
  },
  {
    name: "October",
    short: "Oct",
    number: 10
  },
  {
    name: "November",
    short: "Nov",
    number: 11
  },
  {
    name: "December",
    short: "Dec",
    number: 12
  },
  {
    name: "January",
    short: "Jan",
    number: 1
  },
  {
    name: "February",
    short: "Feb",
    number: 2
  },
  {
    name: "March",
    short: "Mar",
    number: 3
  }
];


function toNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(
    String(value)
      .replace(/,/g, "")
      .replace(/[₹$]/g, "")
      .trim()
  );

  return Number.isFinite(number)
    ? number
    : 0;
}


function formatCurrency(value) {

  return `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

}


function getCity(row) {

  return String(
    row?.city ??
    row?.["City"] ??
    ""
  ).trim();

}


function getTeamLeader(row) {

  return String(
    row?.team_leader ??
    row?.["Team Leader"] ??
    ""
  ).trim();

}


function getBDMember(row) {

  return String(
    row?.bd_member ??
    row?.["BD Member"] ??
    ""
  ).trim();

}


function getBilling(row) {

  return toNumber(
    row?.total_bill_amount ??
    row?.["Total Bill Amount"]
  );

}


function getFranchiseeShare(row) {

  return toNumber(
    row?.franchisee_share ??
    row?.["Franchisee Share"]
  );

}


function getNetAmount(row) {

  return (
    getBilling(row) -
    getFranchiseeShare(row)
  );

}


function getClientAcquiredDate(row) {

  return (
    row?.date_client_acquired ??
    row?.["Date Client Acquired"] ??
    ""
  );

}


function getFinancialYear(row) {

  const dateValue =
    getClientAcquiredDate(row);

  if (dateValue) {

    const date = new Date(dateValue);

    if (!Number.isNaN(date.getTime())) {

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`;
      }

      return `${year - 1}-${String(year).slice(-2)}`;

    }

  }


  const acquiredYear =
    row?.["Aquired Year"] ??
    row?.["Acquired Year"] ??
    row?.acquired_year ??
    "";

  return String(acquiredYear).trim();

}


function getMonth(row) {

  const dateValue =
    getClientAcquiredDate(row);

  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getMonth() + 1;

}


function getMostFrequent(rows, getter) {

  const countMap = new Map();


  rows.forEach(row => {

    const value =
      getter(row);

    if (!value) {
      return;
    }

    countMap.set(
      value,
      (countMap.get(value) || 0) + 1
    );

  });


  let bestValue = "";
  let highestCount = 0;


  countMap.forEach(
    (count, value) => {

      if (count > highestCount) {

        highestCount = count;
        bestValue = value;

      }

    }
  );


  return {
    value: bestValue,
    count: highestCount
  };

}


function CityTooltip({
  active,
  payload,
  label
}) {

  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }


  const data =
    payload[0]?.payload;


  return (

    <div className="city-modern-tooltip">

      <div className="city-tooltip-label">
        {label}
      </div>


      {data?.city && (

        <div className="city-tooltip-city">
          {data.city}
        </div>

      )}


      {payload.map(
        (item, index) => (

          <div
            key={index}
            className="city-tooltip-row"
          >

            <span>
              {item.name}
            </span>

            <strong>

              {item.dataKey === "billing"
                ? formatCurrency(item.value)
                : Number(item.value || 0).toLocaleString("en-IN")
              }

            </strong>

          </div>

        )
      )}

    </div>

  );

}


function CityPerformance() {

  const {
    rows = []
  } = useData();


  const [
    selectedCity,
    setSelectedCity
  ] = useState("");


  const [
    selectedFinancialYear,
    setSelectedFinancialYear
  ] = useState("");


  /*
   * CITY TABLE DATA
   */

  const cityData = useMemo(() => {

    const cityMap = new Map();


    rows.forEach(row => {

      const city =
        getCity(row);

      if (!city) {
        return;
      }


      if (!cityMap.has(city)) {

        cityMap.set(
          city,
          {
            city,
            clients: 0,
            billing: 0,
            netAmount: 0
          }
        );

      }


      const data =
        cityMap.get(city);


      data.clients += 1;

      data.billing +=
        getBilling(row);

      data.netAmount +=
        getNetAmount(row);

    });


    return Array
      .from(cityMap.values())
      .sort(
        (a, b) =>
          b.clients - a.clients
      );

  }, [rows]);


  /*
   * FINANCIAL YEARS
   */

  const financialYears = useMemo(() => {

    const years =
      new Set();


    rows.forEach(row => {

      const year =
        getFinancialYear(row);

      if (year) {
        years.add(year);
      }

    });


    return Array
      .from(years)
      .sort((a, b) => {

        return (
          Number(
            String(a).slice(0, 4)
          ) -
          Number(
            String(b).slice(0, 4)
          )
        );

      });

  }, [rows]);


  /*
   * SELECTED CITY ROWS
   */

  const selectedRows = useMemo(() => {

    if (!selectedCity) {
      return [];
    }


    return rows.filter(
      row =>
        getCity(row) ===
        selectedCity
    );

  }, [
    rows,
    selectedCity
  ]);


  /*
   * ENQUIRIES COUNT
   *
   * Each row belonging to the
   * selected city is counted as
   * one enquiry.
   */

  const enquiryCount = useMemo(() => {

    return selectedRows.length;

  }, [selectedRows]);


  /*
   * MODAL SUMMARY
   */

  const totalBilling = useMemo(() => {

    return selectedRows.reduce(
      (total, row) =>
        total + getBilling(row),
      0
    );

  }, [selectedRows]);


  const totalFranchiseShare = useMemo(() => {

    return selectedRows.reduce(
      (total, row) =>
        total +
        getFranchiseeShare(row),
      0
    );

  }, [selectedRows]);


  const totalNetAmount = useMemo(() => {

    return selectedRows.reduce(
      (total, row) =>
        total +
        getNetAmount(row),
      0
    );

  }, [selectedRows]);


  const topTeamLeader = useMemo(() => {

    return getMostFrequent(
      selectedRows,
      getTeamLeader
    );

  }, [selectedRows]);


  const topBDMember = useMemo(() => {

    return getMostFrequent(
      selectedRows,
      getBDMember
    );

  }, [selectedRows]);


  /*
   * YEARLY REPORT
   *
   * For every financial year,
   * show only the city having the
   * highest acquired-client count.
   */

  const yearlyReportData = useMemo(() => {

    const yearMap = new Map();


    rows.forEach(row => {

      const year =
        getFinancialYear(row);

      const city =
        getCity(row);


      if (
        !year ||
        !city
      ) {
        return;
      }


      if (!yearMap.has(year)) {

        yearMap.set(
          year,
          new Map()
        );

      }


      const cityMap =
        yearMap.get(year);


      if (!cityMap.has(city)) {

        cityMap.set(
          city,
          {
            city,
            clients: 0,
            billing: 0
          }
        );

      }


      const data =
        cityMap.get(city);


      data.clients += 1;

      data.billing +=
        getBilling(row);

    });


    return Array
      .from(yearMap.entries())
      .sort(
        (a, b) =>
          Number(
            String(a[0]).slice(0, 4)
          ) -
          Number(
            String(b[0]).slice(0, 4)
          )
      )
      .map(
        ([year, cityMap]) => {

          const cities =
            Array.from(
              cityMap.values()
            );


          cities.sort(
            (a, b) =>
              b.clients -
              a.clients
          );


          const topCity =
            cities[0];


          if (!topCity) {
            return null;
          }


          return {

            year,

            city:
              topCity.city,

            clients:
              topCity.clients,

            billing:
              topCity.billing

          };

        }
      )
      .filter(Boolean);

  }, [rows]);


  /*
   * MONTHLY REPORT
   *
   * For selected FY, show only
   * the city having the highest
   * acquired-client count for
   * each month.
   */

  const monthlyReportData = useMemo(() => {

    if (!selectedFinancialYear) {
      return [];
    }


    return financialMonths.map(
      month => {

        const monthRows =
          rows.filter(row => {

            const year =
              getFinancialYear(row);

            const rowMonth =
              getMonth(row);

            return (
              year ===
                selectedFinancialYear &&
              rowMonth ===
                month.number
            );

          });


        const cityMap =
          new Map();


        monthRows.forEach(row => {

          const city =
            getCity(row);

          if (!city) {
            return;
          }


          if (!cityMap.has(city)) {

            cityMap.set(
              city,
              {
                city,
                clients: 0,
                billing: 0
              }
            );

          }


          const data =
            cityMap.get(city);


          data.clients += 1;

          data.billing +=
            getBilling(row);

        });


        const cities =
          Array.from(
            cityMap.values()
          );


        cities.sort(
          (a, b) =>
            b.clients -
            a.clients
        );


        const topCity =
          cities[0];


        return {

          month:
            month.name,

          monthShort:
            month.short,

          city:
            topCity?.city || "—",

          clients:
            topCity?.clients || 0,

          billing:
            topCity?.billing || 0

        };

      }
    );

  }, [
    rows,
    selectedFinancialYear
  ]);


  /*
   * REPORT DATA
   */

  const reportData =
    selectedFinancialYear
      ? monthlyReportData
      : yearlyReportData;


  /*
   * OPEN MODAL
   */

  function openCityPerformance(city) {

    setSelectedCity(city);

  }


  /*
   * CLOSE MODAL
   */

  function closeCityPerformance() {

    setSelectedCity("");

    setSelectedFinancialYear("");

  }


  return (

    <div className="city-performance-page">


      {/* PAGE HEADER */}

      <div className="city-page-header">

        <div>

          <div className="city-page-eyebrow">
            PERFORMANCE REPORT
          </div>

          <h1>
            City Performance
          </h1>

          <p>
            Analyse client acquisition,
            billing and net performance
            by city.
          </p>

        </div>

      </div>


      {/* CITY TABLE */}

      <div className="city-table-card">


        <div className="city-table-header">

          <div>

            <h2>
              City Performance
            </h2>

            <span className="city-count">
              {cityData.length} Cities
            </span>

          </div>

        </div>


        <div className="city-table-wrapper">

          <table className="city-table">

            <thead>

              <tr>

                <th>
                  City Name
                </th>

                <th>
                  Total Acquired Client
                </th>

                <th>
                  Total Billing
                </th>

                <th>
                  Net Amount
                </th>

                <th>
                  Performance
                </th>

              </tr>

            </thead>


            <tbody>

              {cityData.map(
                (item, index) => (

                  <tr key={item.city}>

                    <td>

                      <div className="city-name">

                        <span className="city-avatar">
                          {item.city
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span>
                          {item.city}
                        </span>

                      </div>

                    </td>


                    <td>

                      <span className="city-client-count">
                        {item.clients.toLocaleString("en-IN")}
                      </span>

                    </td>


                    <td>

                      <span className="city-billing-value">
                        {formatCurrency(
                          item.billing
                        )}
                      </span>

                    </td>


                    <td>

                      <span className="city-net-value">
                        {formatCurrency(
                          item.netAmount
                        )}
                      </span>

                    </td>


                    <td>

                      <button
                        type="button"
                        className="city-view-performance-btn"
                        onClick={() =>
                          openCityPerformance(
                            item.city
                          )
                        }
                      >

                        View

                        <span className="city-view-arrow">
                          →
                        </span>

                      </button>

                    </td>

                  </tr>

                )
              )}


              {!cityData.length && (

                <tr>

                  <td
                    colSpan="5"
                    className="city-empty"
                  >
                    No city data available.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* PERFORMANCE MODAL */}

      {selectedCity && (

        <div
          className="city-performance-overlay"
          onClick={closeCityPerformance}
        >

          <div
            className="city-performance-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* MODAL HEADER */}

            <div className="city-modal-header">

              <div>

                <div className="city-modal-eyebrow">
                  CITY PERFORMANCE
                </div>

                <h2>
                  {selectedCity}
                </h2>

              </div>


              <button
                type="button"
                className="city-modal-close"
                onClick={closeCityPerformance}
              >
                ×
              </button>

            </div>


            {/* SUMMARY CARDS */}

            <div className="city-summary-grid">


              {/* CITY */}

              <div className="city-summary-card city-top-city-card">

                <span className="city-summary-label">
                  City
                </span>

                <span className="city-summary-text">
                  {selectedCity}
                </span>

              </div>


              {/* TOTAL BILLING */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Total Billing
                </span>

                <span className="city-summary-value">
                  {formatCurrency(
                    totalBilling
                  )}
                </span>

              </div>


              {/* TEAM LEADER */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  Team Leader
                </span>

                <span className="city-summary-text">

                  {topTeamLeader.value ||
                    "—"}

                </span>

                {topTeamLeader.count > 0 && (

                  <span className="city-summary-count">

                    {topTeamLeader.count} clients

                  </span>

                )}

              </div>


              {/* BD MEMBER */}

              <div className="city-summary-card">

                <span className="city-summary-label">
                  BD Member
                </span>

                <span className="city-summary-text">

                  {topBDMember.value ||
                    "—"}

                </span>

                {topBDMember.count > 0 && (

                  <span className="city-summary-count">

                    {topBDMember.count} clients

                  </span>

                )}

              </div>


              {/* ENQUIRIES */}

              <div className="city-summary-card city-enquiry-card">

                <span className="city-summary-label">
                  Enquiries
                </span>

                <span className="city-summary-value">
                  {enquiryCount.toLocaleString("en-IN")}
                </span>

                <span className="city-summary-count">
                  Total enquiries
                </span>

              </div>


              {/* FRANCHISE SHARE */}

              <div className="city-summary-card city-share-card">

                <span className="city-summary-label">
                  Franchise Share Claimed
                </span>

                <span className="city-summary-value">

                  {formatCurrency(
                    totalFranchiseShare
                  )}

                </span>

              </div>


              {/* NET AMOUNT */}

              <div className="city-summary-card city-net-card">

                <span className="city-summary-label">
                  Net Amount
                </span>

                <span className="city-summary-value">

                  {formatCurrency(
                    totalNetAmount
                  )}

                </span>

              </div>


            </div>


            {/* REPORT CONTROLS */}

            <div className="city-report-controls">

              <div>

                <span className="city-summary-label">
                  Financial Year
                </span>

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
                    None — Yearly Report
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


              <div className="city-report-period">

                {selectedFinancialYear
                  ? `Monthly Report — FY ${selectedFinancialYear}`
                  : "Yearly Report"}

              </div>

            </div>


            {/* GRAPHS */}

            <div className="city-report-graphs">


              {/* CLIENT ACQUIRED */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div className="city-chart-indicator city-client-indicator" />

                  <div>

                    <h3>
                      Client Acquired
                    </h3>

                    <p>
                      Top city by acquired clients
                    </p>

                  </div>

                </div>


                <div className="city-chart-container">

                  {reportData.length > 0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >

                      <BarChart
                        data={reportData}
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
                            selectedFinancialYear
                              ? "monthShort"
                              : "year"
                          }
                        />

                        <YAxis />

                        <Tooltip
                          content={
                            <CityTooltip />
                          }
                        />

                        <Bar
                          dataKey="clients"
                          name="Clients"
                          fill="#B78A34"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="city-no-chart-data">
                      No client data available.
                    </div>

                  )}

                </div>

              </div>


              {/* TOTAL BILLING */}

              <div className="city-chart-card">

                <div className="city-chart-heading">

                  <div className="city-chart-indicator city-billing-indicator" />

                  <div>

                    <h3>
                      Total Billing
                    </h3>

                    <p>
                      Billing of top city
                    </p>

                  </div>

                </div>


                <div className="city-chart-container">

                  {reportData.length > 0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >

                      <BarChart
                        data={reportData}
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
                            selectedFinancialYear
                              ? "monthShort"
                              : "year"
                          }
                        />

                        <YAxis />

                        <Tooltip
                          content={
                            <CityTooltip />
                          }
                        />

                        <Bar
                          dataKey="billing"
                          name="Billing"
                          fill="#26734D"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="city-no-chart-data">
                      No billing data available.
                    </div>

                  )}

                </div>

              </div>


            </div>


            {/* MODAL FOOTER */}

            <div className="city-modal-footer">

              <button
                type="button"
                className="city-footer-close"
                onClick={closeCityPerformance}
              >
                Close
              </button>

            </div>


          </div>

        </div>

      )}

    </div>

  );

}


export default CityPerformance;