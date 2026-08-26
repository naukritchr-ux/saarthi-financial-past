import {
  useData
} from "../../../context/DataContext";

import PerformanceFilters
  from "../../Dashboard/PerformanceFilters";

import "./ClientStatusPerformance.css";


function ClientStatusPerformance() {

  const {
    rows
  } = useData();


  // =====================================================
  // PROCESS CLIENT STATUS DATA
  // =====================================================

  function processStatusData() {

    const statusData = {};


    rows.forEach(row => {

      const status =
        row["Client Status"];


      if (!status) {
        return;
      }


      if (!statusData[status]) {

        statusData[status] = {

          clients: 0,

          placements: 0,

          billing: 0,

          received: 0,

          profit: 0

        };

      }


      // Clients
      statusData[status].clients++;


      // Billing
      const billing =
        Number(
          row["Total Bill Amount"] || 0
        );


      // Received
      const received =
        Number(
          row["Amount Received"] || 0
        );


      statusData[status].billing +=
        billing;


      statusData[status].received +=
        received;


      // Profit
      statusData[status].profit +=
        billing - received;


      // Placements
      if (
        row["Joining Date"] ||
        row["Date of Joining"]
      ) {

        statusData[status].placements++;

      }

    });


    return Object.entries(statusData)

      .map(([name, data]) => {

        const margin =
          data.billing
            ? (
                data.profit /
                data.billing *
                100
              )
            : 0;


        return {

          name,

          ...data,

          margin

        };

      })

      .sort(
        (a, b) =>
          b.clients -
          a.clients
      );

  }


  const statusData =
    rows?.length
      ? processStatusData()
      : [];


  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  function formatAmount(value) {

    const number =
      Number(value || 0);


    if (number >= 10000000) {

      return `₹${(
        number /
        10000000
      ).toFixed(1)} Cr`;

    }


    if (number >= 100000) {

      return `₹${(
        number /
        100000
      ).toFixed(1)} L`;

    }


    if (number >= 1000) {

      return `₹${(
        number /
        1000
      ).toFixed(1)} K`;

    }


    return `₹${number}`;

  }


  // =====================================================
  // TABLE CURRENCY
  // =====================================================

  function tableCurrency(value) {

    return `₹${Number(value || 0)
      .toLocaleString("en-IN")}`;

  }


  // =====================================================
  // TOP STATUS
  // =====================================================

  const topStatus =
    statusData[0];


  // =====================================================
  // HIGHEST BILLING
  // =====================================================

  const highestBilling =
    [...statusData].sort(
      (a, b) =>
        b.billing -
        a.billing
    )[0];


  // =====================================================
  // HIGHEST PROFIT
  // =====================================================

  const highestProfit =
    [...statusData].sort(
      (a, b) =>
        b.profit -
        a.profit
    )[0];


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="client-status-performance">


      {/* =================================================
          PAGE HEADING
      ================================================= */}

      <h1>
        Client Status Performance
      </h1>


      {/* =================================================
          PERFORMANCE FILTER
      ================================================= */}

      <PerformanceFilters
        activeFilter="clientStatus"
      />


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="status-cards">


        {/* Total Client Statuses */}

        <div className="status-card">

          <h3>
            Total Client Statuses
          </h3>

          <strong>
            {statusData.length}
          </strong>

        </div>


        {/* Top Status */}

        <div className="status-card">

          <h3>
            Top Status
          </h3>

          <strong>
            {topStatus?.name || "-"}
          </strong>

          <p>
            {topStatus?.clients || 0}
            {" "}Clients
          </p>

        </div>


        {/* Highest Billing */}

        <div className="status-card">

          <h3>
            Highest Billing
          </h3>

          <strong>
            {highestBilling?.name || "-"}
          </strong>

          <p>
            {
              formatAmount(
                highestBilling?.billing || 0
              )
            }
          </p>

        </div>


        {/* Highest Profit */}

        <div className="status-card">

          <h3>
            Highest Profit
          </h3>

          <strong>
            {highestProfit?.name || "-"}
          </strong>

          <p>
            {
              formatAmount(
                highestProfit?.profit || 0
              )
            }
          </p>

        </div>


      </div>


      {/* =================================================
          FINANCIAL PERFORMANCE TABLE
      ================================================= */}

      <div className="status-table">


        <h2>
          Financial Performance
        </h2>


        <table>


          <thead>

            <tr>

              <th>
                Rank
              </th>

              <th>
                Status
              </th>

              <th>
                Clients
              </th>

              <th>
                Placements
              </th>

              <th>
                Billing
              </th>

              <th>
                Received
              </th>

              <th>
                Profit
              </th>

              <th>
                Margin
              </th>

            </tr>

          </thead>


          <tbody>

            {

              statusData.map(
                (status, index) => (

                  <tr
                    key={status.name}
                  >

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {status.name}
                    </td>

                    <td>
                      {status.clients}
                    </td>

                    <td>
                      {status.placements}
                    </td>

                    <td>
                      {
                        tableCurrency(
                          status.billing
                        )
                      }
                    </td>

                    <td>
                      {
                        tableCurrency(
                          status.received
                        )
                      }
                    </td>

                    <td>
                      {
                        tableCurrency(
                          status.profit
                        )
                      }
                    </td>

                    <td>
                      {
                        status.margin.toFixed(2)
                      }%
                    </td>

                  </tr>

                )
              )

            }

          </tbody>


        </table>


      </div>


    </div>

  );

}


export default ClientStatusPerformance;