import {
  useMemo
} from "react";

import {
  useData
} from "../../../context/DataContext";

import PerformanceFilters
  from "../../Dashboard/PerformanceFilters";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import "./TeamLeaderPerformance.css";


function TeamLeaderPerformance() {


  const {
    rows,
    filters
  } = useData();


  // =====================================================
  // SELECTED TEAM LEADER
  // =====================================================

  const selectedTeamLeader =
    filters?.teamLeader || "";


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

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


    return `₹${number}`;

  }


  // =====================================================
  // FULL CURRENCY
  // =====================================================

  function fullCurrency(value) {

    return `₹${Number(value || 0)
      .toLocaleString("en-IN")}`;

  }


  // =====================================================
  // GET YEAR
  // =====================================================

  function getYear(row) {

    return (
      row.acquired_year ??
      row["Aquired Year"] ??
      row["Allt year"] ??
      null
    );

  }


  // =====================================================
  // GET BILLING
  // =====================================================

  function getBilling(row) {

    return Number(
      row.total_bill_amount ??
      row["Total Bill Amount"] ??
      0
    );

  }


  // =====================================================
  // GET RECEIVED
  // =====================================================

  function getReceived(row) {

    return Number(
      row.amount_received ??
      row["Amount Received"] ??
      0
    );

  }


  // =====================================================
  // TEAM LEADER RANKING
  // =====================================================

  const leaderData = useMemo(() => {


    const teamLeaders = {};


    rows.forEach(row => {


      const leader =
        row.team_leader ??
        row["Team Leader"];


      if (!leader) {

        return;

      }


      if (!teamLeaders[leader]) {

        teamLeaders[leader] = {

          clients: 0,

          billing: 0,

          received: 0,

          outstanding: 0

        };

      }


      teamLeaders[leader].clients++;


      const billing =
        getBilling(row);


      const received =
        getReceived(row);


      teamLeaders[leader].billing +=
        billing;


      teamLeaders[leader].received +=
        received;


      teamLeaders[leader].outstanding +=
        Math.max(
          billing - received,
          0
        );

    });


    return Object.entries(teamLeaders)

      .map(([name, data]) => ({

        name,

        ...data

      }))

      .sort(
        (a, b) =>
          b.clients - a.clients
      );


  }, [rows]);


  // =====================================================
  // SELECTED TEAM LEADER ROWS
  // =====================================================

  const selectedRows = useMemo(() => {


    if (!selectedTeamLeader) {

      return [];

    }


    return rows.filter(row => {


      const leader =
        row.team_leader ??
        row["Team Leader"];


      return (
        String(leader) ===
        String(selectedTeamLeader)
      );

    });


  }, [
    rows,
    selectedTeamLeader
  ]);


  // =====================================================
  // YEARLY CLIENT ACQUISITION
  // =====================================================

  const yearlyClientData = useMemo(() => {


    const yearly = {};


    selectedRows.forEach(row => {


      const year =
        getYear(row);


      if (
        year === null ||
        year === undefined ||
        year === ""
      ) {

        return;

      }


      const key =
        String(year);


      if (!yearly[key]) {

        yearly[key] = 0;

      }


      yearly[key]++;

    });


    return Object.entries(yearly)

      .sort(
        ([yearA], [yearB]) =>
          Number(yearA) -
          Number(yearB)
      )

      .map(([year, clients]) => ({

        year,

        clients

      }));


  }, [selectedRows]);


  // =====================================================
  // FINANCIAL DATA
  // =====================================================

  const financialData = useMemo(() => {


    let billing = 0;

    let received = 0;


    selectedRows.forEach(row => {

      billing += getBilling(row);

      received += getReceived(row);

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


  }, [selectedRows]);


  // =====================================================
  // PIE DATA
  // =====================================================

  const pieData = [

    {

      name: "Received",

      value:
        financialData.received

    },

    {

      name: "Outstanding",

      value:
        financialData.outstanding

    }

  ].filter(
    item => item.value > 0
  );


  // =====================================================
  // PIE COLORS
  // =====================================================

  const PIE_COLORS = [

    "#26734D",

    "#B78A34"

  ];


  // =====================================================
  // CUSTOM PIE TOOLTIP
  // =====================================================

  function renderPieTooltip({
    active,
    payload
  }) {


    if (
      !active ||
      !payload ||
      !payload.length
    ) {

      return null;

    }


    const item =
      payload[0];


    return (

      <div className="team-pie-tooltip">

        <strong>
          {item.name}
        </strong>

        <span>
          {fullCurrency(item.value)}
        </span>

      </div>

    );

  }


  // =====================================================
  // CUSTOM BAR TOOLTIP
  // =====================================================

  function renderBarTooltip({
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


    return (

      <div className="team-bar-tooltip">

        <strong>
          {label}
        </strong>

        <span>
          {payload[0].value} Clients
        </span>

      </div>

    );

  }


  // =====================================================
  // SELECTED TEAM LEADER VIEW
  // =====================================================

  if (selectedTeamLeader) {


    return (

      <div className="team-performance">


        <h1>
          Team Leader Performance
        </h1>


        <PerformanceFilters
          activeFilter="teamLeader"
        />


        <div className="selected-leader-header">

          <div>

            <span>
              Selected Team Leader
            </span>

            <h2>
              {selectedTeamLeader}
            </h2>

          </div>


          <div className="leader-summary">

            <div className="summary-item">

              <span>
                Clients Acquired
              </span>

              <strong>
                {selectedRows.length}
              </strong>

            </div>


            <div className="summary-item">

              <span>
                Billing
              </span>

              <strong>
                {formatCurrency(
                  financialData.billing
                )}
              </strong>

            </div>


            <div className="summary-item">

              <span>
                Received
              </span>

              <strong>
                {formatCurrency(
                  financialData.received
                )}
              </strong>

            </div>


            <div className="summary-item">

              <span>
                Outstanding
              </span>

              <strong>
                {formatCurrency(
                  financialData.outstanding
                )}
              </strong>

            </div>

          </div>

        </div>


        <div className="team-chart-grid">


          {/* ============================================
              YEARLY CLIENT ACQUISITION
          ============================================ */}

          <div className="team-chart-card">


            <div className="chart-card-header">

              <div>

                <span className="chart-label">
                  PERFORMANCE
                </span>

                <h3>
                  Yearly Client Acquisition
                </h3>

              </div>

            </div>


            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <BarChart
                data={yearlyClientData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 10
                }}
              >

                <XAxis
                  dataKey="year"
                  tick={{
                    fill: "#1B2A4A"
                  }}
                  axisLine={false}
                  tickLine={false}
                />


                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "#1B2A4A"
                  }}
                  axisLine={false}
                  tickLine={false}
                />


                <Tooltip
                  content={
                    renderBarTooltip
                  }
                  cursor={{
                    fill:
                      "rgba(183,138,52,0.08)"
                  }}
                />


                <Bar
                  dataKey="clients"
                  radius={[
                    8,
                    8,
                    0,
                    0
                  ]}
                  fill="#B78A34"
                  barSize={48}
                />

              </BarChart>

            </ResponsiveContainer>


          </div>


          {/* ============================================
              RECEIVED VS OUTSTANDING
          ============================================ */}

          <div className="team-chart-card">


            <div className="chart-card-header">

              <div>

                <span className="chart-label">
                  FINANCIAL PERFORMANCE
                </span>

                <h3>
                  Received vs Outstanding
                </h3>

              </div>

            </div>


            {pieData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <PieChart>


                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={0}
                    outerRadius={120}
                    paddingAngle={3}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  >

                    {pieData.map(
                      (entry, index) => (

                        <Cell
                          key={
                            `cell-${index}`
                          }
                          fill={
                            PIE_COLORS[index]
                          }
                        />

                      )
                    )}

                  </Pie>


                  <Tooltip
                    content={
                      renderPieTooltip
                    }
                  />


                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                  />

                </PieChart>

              </ResponsiveContainer>

            ) : (

              <div className="no-financial-data">

                No financial data
                available.

              </div>

            )}


          </div>


        </div>


      </div>

    );

  }


  // =====================================================
  // DEFAULT RANKING VIEW
  // =====================================================

  return (

    <div className="team-performance">


      <h1>
        Team Leader Performance Ranking
      </h1>


      <PerformanceFilters
        activeFilter="teamLeader"
      />


      <table>

        <thead>

          <tr>

            <th>
              Rank
            </th>

            <th>
              Team Leader
            </th>

            <th>
              Clients Acquired
            </th>

            <th>
              Billing
            </th>

            <th>
              Outstanding
            </th>

          </tr>

        </thead>


        <tbody>

          {leaderData.map(
            (leader, index) => (

              <tr
                key={leader.name}
              >

                <td>
                  {index + 1}
                </td>


                <td>
                  {leader.name}
                </td>


                <td>
                  {leader.clients}
                </td>


                <td>
                  ₹
                  {leader.billing
                    .toLocaleString(
                      "en-IN"
                    )}
                </td>


                <td>
                  ₹
                  {leader.outstanding
                    .toLocaleString(
                      "en-IN"
                    )}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>


    </div>

  );

}


export default TeamLeaderPerformance;