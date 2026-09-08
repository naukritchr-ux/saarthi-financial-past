export function processDashboardData(rows) {

  // =====================================================
  // EMPTY DATA
  // =====================================================

  if (!rows || rows.length === 0) {

    return {
      totalClients: 0,
      activeClients: 0,
      openClientEnquiries: 0,
      closedClientEnquiries: 0,
      totalPlacements: 0,
      totalBilling: 0,
      amountReceived: 0,
      outstandingAmount: 0,
      franchiseCost: 0,
      grossProfit: 0,
      grossMargin: 0,
      netAmount: 0,
      conversionRate: 0,
      teamLeaderPerformance: [],
      franchisePerformance: [],
      industryPerformance: []
    };

  }


  // =====================================================
  // NORMALIZE COMPANY NAME
  // =====================================================

  function normalizeCompanyName(value) {

    return String(value || "")
      .trim()
      .toLowerCase();

  }


  // =====================================================
  // UNIQUE TOTAL CLIENTS
  // =====================================================

  const uniqueClients = new Set();

  rows.forEach(row => {

    const companyName = normalizeCompanyName(
      row["Company Name"]
    );

    if (companyName) {
      uniqueClients.add(companyName);
    }

  });

  const totalClients = uniqueClients.size;


  // =====================================================
  // UNIQUE ACTIVE CLIENTS
  // =====================================================

  const uniqueActiveClients = new Set();

  rows.forEach(row => {

    const companyName = normalizeCompanyName(
      row["Company Name"]
    );

    const status = String(
      row["Client Status"] || ""
    )
      .trim()
      .toLowerCase();

    if (
      companyName &&
      status === "active"
    ) {

      uniqueActiveClients.add(companyName);

    }

  });

  const activeClients = uniqueActiveClients.size;


  // =====================================================
  // UNIQUE OPEN CLIENT ENQUIRIES
  // =====================================================

  const uniqueOpenClients = new Set();

  rows.forEach(row => {

    const companyName = normalizeCompanyName(
      row["Company Name"]
    );

    const status = String(
      row["Client Status"] || ""
    )
      .trim()
      .toLowerCase();

    if (
      companyName &&
      status === "open"
    ) {

      uniqueOpenClients.add(companyName);

    }

  });

  const openClientEnquiries =
    uniqueOpenClients.size;


  // =====================================================
  // UNIQUE CLOSED CLIENT ENQUIRIES
  // =====================================================

  const uniqueClosedClients = new Set();

  rows.forEach(row => {

    const companyName = normalizeCompanyName(
      row["Company Name"]
    );

    const status = String(
      row["Client Status"] || ""
    )
      .trim()
      .toLowerCase();

    if (
      companyName &&
      status === "closed"
    ) {

      uniqueClosedClients.add(companyName);

    }

  });

  const closedClientEnquiries =
    uniqueClosedClients.size;


  // =====================================================
  // TOTAL PLACEMENTS
  // =====================================================

  const totalPlacements =
    rows.filter(
      row =>
        row["Date of Joining"] ||
        row["Joining Date"]
    ).length;


  // =====================================================
  // TOTAL BILLING
  // =====================================================

  const totalBilling =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row["Total Bill Amount"] || 0
        ),
      0
    );


  // =====================================================
  // AMOUNT RECEIVED
  // =====================================================

  const amountReceived =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row["Amount Received"] || 0
        ),
      0
    );


  // =====================================================
  // FRANCHISE COST
  // =====================================================

  const franchiseCost =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row["Franchisee Share"] || 0
        ),
      0
    );


  // =====================================================
  // GROSS PROFIT
  // =====================================================

  const grossProfit =
    totalBilling - franchiseCost;


  // =====================================================
  // GROSS MARGIN
  // =====================================================

  const grossMargin =
    totalBilling > 0
      ? (grossProfit / totalBilling) * 100
      : 0;


  // =====================================================
  // OUTSTANDING AMOUNT
  // =====================================================

  const outstandingAmount =
    totalBilling - amountReceived;


  // =====================================================
  // NET AMOUNT
  // =====================================================

  const netAmount =
    totalBilling - franchiseCost;


  // =====================================================
  // CONVERSION RATE
  // =====================================================

  const conversionRate =
    totalClients > 0
      ? (totalPlacements / totalClients) * 100
      : 0;


  // =====================================================
  // RETURN DASHBOARD DATA
  // =====================================================

  return {

    totalClients,

    activeClients,

    openClientEnquiries,

    closedClientEnquiries,

    totalPlacements,

    totalBilling,

    amountReceived,

    outstandingAmount,

    franchiseCost,

    grossProfit,

    grossMargin:
      Number(
        grossMargin.toFixed(2)
      ),

    netAmount,

    conversionRate:
      Number(
        conversionRate.toFixed(2)
      ),

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


// =====================================================
// GROUP PERFORMANCE
// =====================================================

function groupPerformance(
  rows,
  column
) {

  const result = {};

  rows.forEach(row => {

    const key =
      row[column] ||
      "Unknown";

    if (!result[key]) {
      result[key] = 0;
    }

    result[key]++;

  });

  return Object.entries(result)

    .map(
      ([name, value]) => ({
        name,
        value
      })
    )

    .sort(
      (a, b) =>
        b.value - a.value
    );

}