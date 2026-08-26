import {
  useData
} from "../../../context/DataContext";


import PerformanceFilters
  from "../../Dashboard/PerformanceFilters";


import "./IndustryPerformance.css";



function IndustryPerformance() {


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
  // PROCESS INDUSTRY DATA
  // =====================================================

  function processIndustryData() {


    const industries = {};



    dataRows.forEach(row => {


      const industry =
        row["Industry"];



      if (!industry) {

        return;

      }



      if (!industries[industry]) {


        industries[industry] = {

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

      industries[industry].clients++;



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



      industries[industry].billing +=
        billing;



      industries[industry].received +=
        received;



      // =================================================
      // PROFIT / OUTSTANDING
      // =================================================

      industries[industry].profit +=

        billing - received;



      // =================================================
      // PLACEMENTS
      // =================================================

      if (

        row["Joining Date"]

        ||

        row["Date of Joining"]

      ) {

        industries[industry].placements++;

      }


    });



    // ===================================================
    // CONVERT OBJECT TO ARRAY
    // ===================================================

    return Object.entries(industries)

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



  const industryData =
    processIndustryData();



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
  // HIGHEST PROFIT INDUSTRY
  // =====================================================

  const highestProfitIndustry =

    [...industryData]

      .sort(

        (a, b) =>

          b.profit -
          a.profit

      )[0];



  // =====================================================
  // RENDER
  // =====================================================

  return (


    <div className="industry-performance">


      {/* =================================================
          PAGE TITLE
      ================================================= */}

      <h1>

        Industry Performance

      </h1>



      {/* =================================================
          VIEW PERFORMANCE BY FILTERS
      ================================================= */}

      <PerformanceFilters
        activeFilter="industry"
      />



      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="industry-cards">


        {/* ===============================================
            TOTAL INDUSTRIES
        =============================================== */}

        <div>

          <h3>

            Total Industries

          </h3>


          <strong>

            {industryData.length}

          </strong>

        </div>



        {/* ===============================================
            TOP INDUSTRY
        =============================================== */}

        <div>

          <h3>

            Top Industry

          </h3>


          <strong>

            {
              industryData[0]?.name
                || "-"
            }

          </strong>

        </div>



        {/* ===============================================
            HIGHEST BILLING
        =============================================== */}

        <div>

          <h3>

            Highest Billing

          </h3>


          <strong>

            {

              industryData[0]

                ?

              formatCurrency(
                industryData[0].billing
              )

                :

              "₹0"

            }

          </strong>

        </div>



        {/* ===============================================
            HIGHEST PROFIT
        =============================================== */}

        <div>

          <h3>

            Highest Profit

          </h3>


          <strong>

            {

              highestProfitIndustry

                ?

              formatCurrency(
                highestProfitIndustry.profit
              )

                :

              "₹0"

            }

          </strong>

        </div>


      </div>



      {/* =================================================
          INDUSTRY TABLE
      ================================================= */}

      <div className="industry-table">


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

                Industry

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

              industryData.length === 0

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

                    No industry data
                    available for the
                    selected filters.

                  </td>

                </tr>

              )

                :

              (

                industryData.map(
                  (item, index) => (


                    <tr
                      key={item.name}
                    >


                      {/* Rank */}

                      <td>

                        {index + 1}

                      </td>



                      {/* Industry */}

                      <td>

                        {item.name}

                      </td>



                      {/* Clients */}

                      <td>

                        {item.clients}

                      </td>



                      {/* Placements */}

                      <td>

                        {item.placements}

                      </td>



                      {/* Billing */}

                      <td>

                        ₹
                        {item.billing
                          .toLocaleString(
                            "en-IN"
                          )}

                      </td>



                      {/* Received */}

                      <td>

                        ₹
                        {item.received
                          .toLocaleString(
                            "en-IN"
                          )}

                      </td>



                      {/* Profit */}

                      <td>

                        ₹
                        {item.profit
                          .toLocaleString(
                            "en-IN"
                          )}

                      </td>



                      {/* Margin */}

                      <td>

                        {item.margin.toFixed(2)}
                        %

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


export default IndustryPerformance;