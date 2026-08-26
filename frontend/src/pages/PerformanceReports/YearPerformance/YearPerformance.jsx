import {
  useMemo
} from "react";


import {
  useData
} from "../../../context/DataContext";


import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";


import PerformanceFilters
  from "../../Dashboard/PerformanceFilters";


import "./YearPerformance.css";


// ======================================================
// COMPONENT
// ======================================================

function YearPerformance() {


  const {
    filteredRows,
    filters
  } = useData();


  // ======================================================
  // FORMAT CURRENCY
  // ======================================================

  function formatCurrency(value) {

    const number =
      Number(value || 0);


    if (number >= 10000000) {

      return `₹${(
        number / 10000000
      ).toFixed(1)} Cr`;

    }


    if (number >= 100000) {

      return `₹${(
        number / 100000
      ).toFixed(1)} L`;

    }


    if (number >= 1000) {

      return `₹${(
        number / 1000
      ).toFixed(1)} K`;

    }


    return `₹${number.toLocaleString("en-IN")}`;

  }


  // ======================================================
  // TOOLTIP CURRENCY
  // ======================================================

  function tooltipCurrency(value) {

    return `₹${
      Number(value || 0)
        .toLocaleString("en-IN")
    }`;

  }


  // ======================================================
  // GET YEAR
  // ======================================================

  function getYear(row) {

    return (
      row.acquired_year ??
      row["Aquired Year"] ??
      row["Allt year"] ??
      null
    );

  }


  // ======================================================
  // GET BILLING
  // ======================================================

  function getBilling(row) {

    return Number(
      row.total_bill_amount ??
      row["Total Bill Amount"] ??
      0
    );

  }


  // ======================================================
  // GET RECEIVED
  // ======================================================

  function getReceived(row) {

    return Number(
      row.amount_received ??
      row["Amount Received"] ??
      0
    );

  }


  // ======================================================
  // YEARLY DATA
  // ======================================================

  const yearData = useMemo(() => {

    const yearly = {};


    filteredRows.forEach(row => {

      const year =
        getYear(row);


      if (
        year === null ||
        year === undefined ||
        year === ""
      ) {

        return;

      }


      const yearKey =
        String(year);


      if (!yearly[yearKey]) {

        yearly[yearKey] = {

          clients: 0,

          billing: 0,

          received: 0

        };

      }


      // --------------------------------------------------
      // Acquired Clients
      // --------------------------------------------------

      yearly[yearKey].clients++;


      // --------------------------------------------------
      // Billing
      // --------------------------------------------------

      yearly[yearKey].billing +=
        getBilling(row);


      // --------------------------------------------------
      // Received
      // --------------------------------------------------

      yearly[yearKey].received +=
        getReceived(row);

    });


    return Object.entries(yearly)

      .sort(
        ([yearA], [yearB]) =>
          Number(yearA) -
          Number(yearB)
      )

      .map(
        ([year, data]) => {

          const profit =
            data.billing -
            data.received;


          return {

            year,

            clients:
              data.clients,

            billing:
              data.billing,

            received:
              data.received,

            profit

          };

        }
      );


  }, [filteredRows]);


  // ======================================================
  // SINGLE YEAR DATA
  // ======================================================

  const singleYearData = useMemo(() => {

    let billing = 0;

    let received = 0;


    filteredRows.forEach(row => {

      billing +=
        getBilling(row);


      received +=
        getReceived(row);

    });


    const outstanding =
      Math.max(
        billing - received,
        0
      );


    return {

      billing,

      received,

      outstanding

    };


  }, [filteredRows]);


  // ======================================================
  // YEARLY PROFIT PIE DATA
  // ======================================================

  const yearlyProfitData = useMemo(() => {

    return yearData

      .filter(
        item =>
          item.profit > 0
      )

      .map(item => ({

        name:
          item.year,

        value:
          item.profit

      }));


  }, [yearData]);


  // ======================================================
  // SINGLE YEAR PIE DATA
  // ======================================================

  const singleYearPieData = useMemo(() => {

    return [

      {
        name: "Total Billing",

        value:
          singleYearData.billing

      },

      {
        name: "Amount Received",

        value:
          singleYearData.received

      },

      {
        name: "Outstanding",

        value:
          singleYearData.outstanding

      }

    ].filter(
      item =>
        item.value > 0
    );


  }, [singleYearData]);


  // ======================================================
  // CHECK SINGLE YEAR
  // ======================================================

  const isSingleYear =
    Boolean(filters.year);


  // ======================================================
  // SELECTED YEAR
  // ======================================================

  const selectedYear =
    filters.year || "";


  // ======================================================
  // PIE COLORS
  // ======================================================

  const yearlyProfitColors = [

    "#1B2A4A",

    "#26734D",

    "#B78A34",

    "#6B5B95",

    "#4E79A7",

    "#E15759",

    "#76B7B2",

    "#59A14F"

  ];


  const singleYearColors = [

    "#1B2A4A",

    "#26734D",

    "#B78A34"

  ];


  // ======================================================
  // CHART MARGIN
  // ======================================================

  const chartMargin = {

    top: 20,

    right: 30,

    left: 10,

    bottom: 10

  };


  // ======================================================
  // CUSTOM PIE LABEL
  // ======================================================

  function renderCustomizedLabel({

    cx,

    cy,

    midAngle,

    innerRadius,

    outerRadius,

    percent

  }) {


    const RADIAN =
      Math.PI / 180;


    const radius =
      innerRadius +
      (outerRadius - innerRadius) *
      0.55;


    const x =
      cx +
      radius *
      Math.cos(-midAngle * RADIAN);


    const y =
      cy +
      radius *
      Math.sin(-midAngle * RADIAN);


    if (percent < 0.05) {

      return null;

    }


    return (

      <text

        x={x}

        y={y}

        fill="#ffffff"

        textAnchor={
          x > cx
            ? "start"
            : "end"
        }

        dominantBaseline="central"

        fontSize="12"

        fontWeight="700"

      >

        {`${(
          percent * 100
        ).toFixed(0)}%`}

      </text>

    );

  }


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="year-performance">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="performance-header">

        <div>

          <h1>
            Year Performance
          </h1>

          <p>
            Analyse yearly client acquisition
            and financial performance.
          </p>

        </div>

      </div>


      {/* ==================================================
          FILTERS
      ================================================== */}

      <PerformanceFilters
        activeFilter="year"
      />


      {/* ==================================================
          SINGLE YEAR VIEW
      ================================================== */}

      {

        isSingleYear

          ?

        (

          <div className="single-year-section">


            <div className="single-year-title">

              <div>

                <h2>
                  {selectedYear} Performance
                </h2>

                <p>
                  Billing, received amount
                  and outstanding amount
                </p>

              </div>

            </div>


            <div className="single-year-chart-card">


              <div className="chart-card-header">

                <div>

                  <h3>
                    Financial Distribution
                  </h3>

                  <span>
                    {selectedYear}
                  </span>

                </div>


                <div className="selected-year-total">

                  <small>
                    Total Billing
                  </small>

                  <strong>
                    {formatCurrency(
                      singleYearData.billing
                    )}
                  </strong>

                </div>

              </div>


              <div className="single-year-chart">


                <ResponsiveContainer
                  width="100%"
                  height={420}
                >

                  <PieChart>

                    <Pie

                      data={
                        singleYearPieData
                      }

                      cx="50%"

                      cy="50%"

                      outerRadius={150}

                      dataKey="value"

                      nameKey="name"

                      labelLine={false}

                      label={
                        renderCustomizedLabel
                      }

                      stroke="#ffffff"

                      strokeWidth={3}

                    >

                      {

                        singleYearPieData.map(
                          (entry, index) => (

                            <Cell

                              key={
                                `cell-${index}`
                              }

                              fill={
                                singleYearColors[
                                  index %
                                  singleYearColors.length
                                ]
                              }

                            />

                          )
                        )

                      }

                    </Pie>


                    <Tooltip
                      formatter={
                        tooltipCurrency
                      }
                    />


                    <Legend
                      verticalAlign="bottom"

                      height={45}

                      iconType="circle"

                    />

                  </PieChart>

                </ResponsiveContainer>


              </div>


              {/* ----------------------------------------
                  SUMMARY
              ---------------------------------------- */}

              <div className="financial-summary">


                <div className="financial-summary-item">

                  <span>
                    Total Billing
                  </span>

                  <strong>
                    {formatCurrency(
                      singleYearData.billing
                    )}
                  </strong>

                </div>


                <div className="financial-summary-item">

                  <span>
                    Amount Received
                  </span>

                  <strong>
                    {formatCurrency(
                      singleYearData.received
                    )}
                  </strong>

                </div>


                <div className="financial-summary-item">

                  <span>
                    Outstanding
                  </span>

                  <strong>
                    {formatCurrency(
                      singleYearData.outstanding
                    )}
                  </strong>

                </div>


              </div>


            </div>


          </div>

        )


          :


        /* =================================================
           ALL YEARS VIEW
        ================================================= */

        (

          <div className="year-chart-row">


            {/* ============================================
                YEARLY ACQUIRED CLIENT GROWTH
            ============================================ */}

            <div className="year-chart-card">


              <div className="chart-card-header">

                <div>

                  <h3>
                    Yearly Acquired Client Growth
                  </h3>

                  <p>
                    Number of clients acquired
                    across financial years
                  </p>

                </div>

              </div>


              <div className="year-chart">

                <ResponsiveContainer
                  width="100%"
                  height={390}
                >

                  <LineChart

                    data={yearData}

                    margin={chartMargin}

                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="year"

                      tick={{
                        fontSize: 12
                      }}

                      axisLine={false}

                      tickLine={false}

                    />


                    <YAxis

                      allowDecimals={false}

                      axisLine={false}

                      tickLine={false}

                      tick={{
                        fontSize: 12
                      }}

                    />


                    <Tooltip

                      formatter={(
                        value
                      ) => [
                        `${value} Clients`,
                        "Acquired Clients"
                      ]}

                    />


                    <Line

                      type="monotone"

                      dataKey="clients"

                      stroke="#1B2A4A"

                      strokeWidth={4}

                      dot={{
                        r: 5,

                        strokeWidth: 2,

                        fill: "#ffffff"
                      }}

                      activeDot={{
                        r: 7
                      }}

                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>


            </div>


            {/* ============================================
                YEARLY PROFIT PIE
            ============================================ */}

            <div className="year-chart-card">


              <div className="chart-card-header">

                <div>

                  <h3>
                    Yearly Profit Distribution
                  </h3>

                  <p>
                    Profit generated across years
                  </p>

                </div>

              </div>


              <div className="year-pie-chart">

                <ResponsiveContainer
                  width="100%"
                  height={390}
                >

                  <PieChart>

                    <Pie

                      data={
                        yearlyProfitData
                      }

                      cx="50%"

                      cy="50%"

                      outerRadius={145}

                      dataKey="value"

                      nameKey="name"

                      labelLine={false}

                      label={
                        renderCustomizedLabel
                      }

                      stroke="#ffffff"

                      strokeWidth={3}

                    >

                      {

                        yearlyProfitData.map(
                          (entry, index) => (

                            <Cell

                              key={
                                `profit-${index}`
                              }

                              fill={
                                yearlyProfitColors[
                                  index %
                                  yearlyProfitColors.length
                                ]
                              }

                            />

                          )
                        )

                      }

                    </Pie>


                    <Tooltip

                      formatter={
                        tooltipCurrency
                      }

                    />


                    <Legend

                      verticalAlign="bottom"

                      height={45}

                      iconType="circle"

                    />

                  </PieChart>

                </ResponsiveContainer>

              </div>


            </div>


          </div>

        )

      }


    </div>

  );

}


export default YearPerformance;