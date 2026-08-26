export function processDashboardData(rows) {


  if (!rows || rows.length === 0) {

    return {

      totalClients: 0,

      activeClients: 0,

      totalPlacements: 0,

      totalBilling: 0,

      amountReceived: 0,

      outstandingAmount: 0,

      franchiseCost: 0,

      grossProfit: 0,

      grossMargin: 0,

      conversionRate: 0,

      teamLeaderPerformance: [],

      franchisePerformance: [],

      industryPerformance: []

    };

  }



  const totalClients =
    rows.length;



  const activeClients =

    rows.filter(

      row =>

      String(row["Client Status"] || "")

      .toLowerCase()

      === "active"

    ).length;



  const totalPlacements =

    rows.filter(

      row =>

      row["Date of Joining"]

      ||

      row["Joining Date"]

    ).length;



  const totalBilling =

    rows.reduce(

      (sum, row) =>

        sum +

        Number(

          row["Total Bill Amount"]

          ||

          0

        ),

      0

    );



  const amountReceived =

    rows.reduce(

      (sum, row) =>

        sum +

        Number(

          row["Amount Received"]

          ||

          0

        ),

      0

    );



  const franchiseCost =

    rows.reduce(

      (sum, row) =>

        sum +

        Number(

          row["Franchisee Share"]

          ||

          0

        ),

      0

    );



  // Gross Profit

  const grossProfit =

    totalBilling -

    franchiseCost;



  // Gross Margin %

  const grossMargin =

    totalBilling > 0

      ?

      (

        (grossProfit / totalBilling)

        * 100

      )

      :

      0;



  // Pending collection

  const outstandingAmount =

    totalBilling -

    amountReceived;



  // Conversion %

  const conversionRate =

    totalClients > 0

      ?

      (

        totalPlacements /

        totalClients

      )

      * 100

      :

      0;



  return {


    totalClients,


    activeClients,


    totalPlacements,


    totalBilling,


    amountReceived,


    outstandingAmount,


    franchiseCost,


    grossProfit,


    grossMargin:

      Number(grossMargin.toFixed(2)),


    conversionRate:

      Number(conversionRate.toFixed(2)),



    teamLeaderPerformance:

      groupPerformance(

        rows,

        "Team Leader"

      ),



    franchisePerformance:

      groupPerformance(

        rows,

        "Franchise Name"

      ),



    industryPerformance:

      groupPerformance(

        rows,

        "Industry"

      )


  };


}





function groupPerformance(rows, column) {


  const result = {};



  rows.forEach(row => {


    const key =

      row[column]

      ||

      "Unknown";



    if (!result[key]) {


      result[key] = 0;


    }



    result[key]++;


  });



  return Object.entries(result)

    .map(([name, value]) => ({


      name,

      value


    }))

    .sort(

      (a,b) =>

      b.value - a.value

    );


}