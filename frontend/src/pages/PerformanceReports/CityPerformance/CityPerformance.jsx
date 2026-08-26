import {
  useData
} from "../../../context/DataContext";


import PerformanceFilters
  from "../../Dashboard/PerformanceFilters";


import "./CityPerformance.css";



function CityPerformance() {


  const {
    rows,
    filteredRows,
    filters
  } = useData();



  // =====================================================
  // CHECK WHETHER ANY FILTER IS ACTIVE
  // =====================================================

  const hasActiveFilter =

    Object.values(filters).some(
      value => value !== ""
    );



  // =====================================================
  // DATA TO DISPLAY
  // =====================================================

  const dataRows =

    hasActiveFilter

      ?

    filteredRows

      :

    rows;



  // =====================================================
  // PROCESS CITY DATA
  // =====================================================

  function processCityData() {


    const cities = {};



    dataRows.forEach(row => {


      const city =
        row["City"];



      if (!city) {

        return;

      }



      if (!cities[city]) {


        cities[city] = {

          clients: 0,

          placements: 0,

          billing: 0,

          received: 0,

          profit: 0

        };

      }



      // =================================================
      // CLIENTS
      // =================================================

      cities[city].clients++;



      // =================================================
      // BILLING
      // =================================================

      const billing =

        Number(
          row["Total Bill Amount"] || 0
        );



      // =================================================
      // RECEIVED
      // =================================================

      const received =

        Number(
          row["Amount Received"] || 0
        );



      cities[city].billing +=
        billing;



      cities[city].received +=
        received;



      // =================================================
      // PROFIT / OUTSTANDING
      // =================================================

      cities[city].profit +=

        billing - received;



      // =================================================
      // PLACEMENTS
      // =================================================

      if (

        row["Joining Date"]

        ||

        row["Date of Joining"]

      ) {

        cities[city].placements++;

      }


    });



    // ===================================================
    // CONVERT OBJECT TO ARRAY
    // ===================================================

    return Object.entries(cities)

      .map(
        ([name, data]) => {


          const margin =

            data.billing

              ?

            (
              data.profit /
              data.billing *
              100
            )

              :

            0;



          return {

            name,

            ...data,

            margin

          };


        }
      )


      // =================================================
      // HIGHEST CLIENTS FIRST
      // =================================================

      .sort(

        (a, b) =>

          b.clients -
          a.clients

      );


  }



  const cityData =
    processCityData();



  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  function formatAmount(value) {


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
  // TABLE CURRENCY
  // =====================================================

  function tableCurrency(value) {


    return `₹${

      Number(value || 0)

        .toLocaleString(
          "en-IN"
        )

    }`;

  }



  // =====================================================
  // TOP CITY
  // =====================================================

  const topCity =
    cityData[0];



  // =====================================================
  // HIGHEST BILLING
  // =====================================================

  const highestBilling =

    [...cityData]

      .sort(

        (a, b) =>

          b.billing -
          a.billing

      )[0];



  // =====================================================
  // HIGHEST PROFIT
  // =====================================================

  const highestProfit =

    [...cityData]

      .sort(

        (a, b) =>

          b.profit -
          a.profit

      )[0];



  // =====================================================
  // RENDER
  // =====================================================

  return (


    <div className="city-performance">


      {/* =================================================
          PAGE TITLE
      ================================================= */}

      <h1>

        City Performance

      </h1>



      {/* =================================================
          VIEW PERFORMANCE BY FILTERS
      ================================================= */}

      <PerformanceFilters
        activeFilter="city"
      />



      {/* =================================================
          TOP CITY CARDS
      ================================================= */}

      <div className="city-cards">


        {/* ===============================================
            TOTAL CITIES
        =============================================== */}

        <div className="city-card">


          <h3>

            Total Cities

          </h3>


          <strong>

            {cityData.length}

          </strong>


        </div>



        {/* ===============================================
            TOP CITY
        =============================================== */}

        <div className="city-card">


          <h3>

            Top City

          </h3>


          <strong>

            {
              topCity?.name
                || "-"
            }

          </strong>


          <p>

            {
              topCity?.clients
                || 0
            }

            {" "}

            Clients

          </p>


        </div>



        {/* ===============================================
            HIGHEST BILLING
        =============================================== */}

        <div className="city-card">


          <h3>

            Highest Billing

          </h3>


          <strong>

            {
              highestBilling?.name
                || "-"
            }

          </strong>


          <p>

            {

              formatAmount(

                highestBilling?.billing
                  || 0

              )

            }

          </p>


        </div>



        {/* ===============================================
            HIGHEST PROFIT
        =============================================== */}

        <div className="city-card">


          <h3>

            Highest Profit

          </h3>


          <strong>

            {
              highestProfit?.name
                || "-"
            }

          </strong>


          <p>

            {

              formatAmount(

                highestProfit?.profit
                  || 0

              )

            }

          </p>


        </div>


      </div>



      {/* =================================================
          CITY RANKING TABLE
      ================================================= */}

      <div className="city-table">


        <h2>

          City Ranking

        </h2>



        <table>


          {/* =============================================
              TABLE HEADER
          ============================================= */}

          <thead>


            <tr>


              <th>

                Rank

              </th>


              <th>

                City

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



          {/* =============================================
              TABLE BODY
          ============================================= */}

          <tbody>


            {

              cityData.length === 0

                ?

              (

                <tr>

                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "30px"
                    }}
                  >

                    No city data
                    available for the
                    selected filters.

                  </td>

                </tr>

              )

                :

              (

                cityData.map(
                  (city, index) => (


                    <tr
                      key={city.name}
                    >


                      {/* Rank */}

                      <td>

                        {index + 1}

                      </td>



                      {/* City */}

                      <td>

                        {city.name}

                      </td>



                      {/* Clients */}

                      <td>

                        {city.clients}

                      </td>



                      {/* Placements */}

                      <td>

                        {city.placements}

                      </td>



                      {/* Billing */}

                      <td>

                        {

                          tableCurrency(
                            city.billing
                          )

                        }

                      </td>



                      {/* Received */}

                      <td>

                        {

                          tableCurrency(
                            city.received
                          )

                        }

                      </td>



                      {/* Profit */}

                      <td>

                        {

                          tableCurrency(
                            city.profit
                          )

                        }

                      </td>



                      {/* Margin */}

                      <td>

                        {

                          city.margin.toFixed(2)

                        }%

                      </td>


                    </tr>


                  )

                )

              )

            }


          </tbody>


        </table>


      </div>


    </div>


  );

}


export default CityPerformance;