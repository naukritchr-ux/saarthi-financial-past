export function processDashboardData(rows) {

  // --------------------------------------------------
  // EMPTY DATA
  // --------------------------------------------------

  if (!rows || rows.length === 0) {
    return {
      totalClients: 0,
      totalEnquiries: 0,

      activeClients: 0,
      deletedClients: 0,
      nonActiveClients: 0,
      blacklistedClients: 0,
      noHiringClients: 0,
      revivalClients: 0,
      reallocationClients: 0,
      prospectClients: 0,
      permanentlyClosedClients: 0,

      openEnquiries: 0,
      closedEnquiries: 0,

      totalPlacements: 0,

      totalBilling: 0,
      amountReceived: 0,
      outstandingAmount: 0,
      franchiseeShare: 0,

      grossProfit: 0,
      grossMargin: 0,
      netAmount: 0,

      conversionRate: 0,

      teamLeaderPerformance: [],
      franchisePerformance: [],
      industryPerformance: []
    };
  }


  // --------------------------------------------------
  // NORMALIZE COMPANY NAME
  // --------------------------------------------------

  const normalizeCompanyName = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };


  // --------------------------------------------------
  // NORMALIZE STATUS
  // --------------------------------------------------

  const normalizeStatus = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  };


  // --------------------------------------------------
  // GET COMPANY NAME
  // --------------------------------------------------

  const getCompanyName = (row) => {
    return normalizeCompanyName(row["Company Name"]);
  };


  // ==================================================
  // TOTAL UNIQUE CLIENTS
  // ==================================================

  const uniqueClients = new Set();

  rows.forEach((row) => {

    const companyName = getCompanyName(row);

    if (companyName) {
      uniqueClients.add(companyName);
    }

  });

  const totalClients = uniqueClients.size;


  // ==================================================
  // TOTAL ENQUIRIES
  // ==================================================
  // Every valid Company Name row is considered
  // an enquiry record.
  // ==================================================

  const totalEnquiries = rows.filter((row) => {
    return Boolean(getCompanyName(row));
  }).length;


  // ==================================================
  // CLIENT STATUS UNIQUE COUNTS
  // ==================================================

  const statusClients = {

    active: new Set(),

    deleted: new Set(),

    nonActive: new Set(),

    blacklisted: new Set(),

    noHiring: new Set(),

    revival: new Set(),

    reallocation: new Set(),

    prospect: new Set(),

    permanentlyClosed: new Set()

  };


  rows.forEach((row) => {

    const companyName = getCompanyName(row);

    const status = normalizeStatus(
      row["Client Status"]
    );


    // Ignore rows without company name

    if (!companyName) {
      return;
    }


    // Active

    if (status === "active") {

      statusClients.active.add(companyName);

    }


    // Deleted

    else if (status === "deleted") {

      statusClients.deleted.add(companyName);

    }


    // Non Active

    else if (
      status === "non active" ||
      status === "nonactive"
    ) {

      statusClients.nonActive.add(companyName);

    }


    // Blacklisted

    else if (
      status === "blacklisted" ||
      status === "blacklist"
    ) {

      statusClients.blacklisted.add(companyName);

    }


    // No Hiring

    else if (
      status === "no hiring" ||
      status === "no hiring client" ||
      status === "no hiring clients"
    ) {

      statusClients.noHiring.add(companyName);

    }


    // Revival

    else if (status === "revival") {

      statusClients.revival.add(companyName);

    }


    // Reallocation

    else if (status === "reallocation") {

      statusClients.reallocation.add(companyName);

    }


    // Prospect

    else if (status === "prospect") {

      statusClients.prospect.add(companyName);

    }


    // Permanently Closed

    else if (
      status === "permanently closed" ||
      status === "permanent closed" ||
      status === "permanently close"
    ) {

      statusClients.permanentlyClosed.add(companyName);

    }

  });


  // ==================================================
  // CLIENT STATUS COUNTS
  // ==================================================

  const activeClients =
    statusClients.active.size;

  const deletedClients =
    statusClients.deleted.size;

  const nonActiveClients =
    statusClients.nonActive.size;

  const blacklistedClients =
    statusClients.blacklisted.size;

  const noHiringClients =
    statusClients.noHiring.size;

  const revivalClients =
    statusClients.revival.size;

  const reallocationClients =
    statusClients.reallocation.size;

  const prospectClients =
    statusClients.prospect.size;

  const permanentlyClosedClients =
    statusClients.permanentlyClosed.size;


  // ==================================================
  // OPEN ENQUIRIES
  // ==================================================

  const openEnquiries = rows.filter((row) => {

    const status = normalizeStatus(
      row["Client Status"]
    );

    return (
      status === "open" ||
      status === "open enquiry" ||
      status === "open client enquiry"
    );

  }).length;


  // ==================================================
  // CLOSED ENQUIRIES
  // ==================================================

  const closedEnquiries = rows.filter((row) => {

    const status = normalizeStatus(
      row["Client Status"]
    );

    return (
      status === "closed" ||
      status === "closed enquiry" ||
      status === "closed client enquiry"
    );

  }).length;


  // ==================================================
  // TOTAL PLACEMENTS
  // ==================================================

  const totalPlacements = rows.filter((row) => {

    return (
      row["Date of Joining"] ||
      row["Joining Date"]
    );

  }).length;


  // ==================================================
  // TOTAL BILLING
  //
  // Formula:
  //
  // Salary Offered × Service Charge
  //
  // If Service Charge is entered as:
  // 10     → treated as 10%
  // 10%    → Number("10%") becomes 0, so preferably
  //           Excel should store it as 10 or 0.10
  // 0.10   → treated as 10%
  // ==================================================

  const totalBilling = rows.reduce(
    (sum, row) => {

      const salaryOffered =
        Number(row["Salary Offered"] || 0);


      let serviceCharge =
        Number(row["Service Charge"] || 0);


      // If value is greater than 1,
      // assume it is percentage.

      if (serviceCharge > 1) {

        serviceCharge =
          serviceCharge / 100;

      }


      return (
        sum +
        salaryOffered * serviceCharge
      );

    },
    0
  );


  // ==================================================
  // AMOUNT RECEIVED
  // ==================================================

  const amountReceived = rows.reduce(
    (sum, row) => {

      return (
        sum +
        Number(row["Amount Received"] || 0)
      );

    },
    0
  );


  // ==================================================
  // FRANCHISEE SHARE
  // ==================================================

  const franchiseeShare = rows.reduce(
    (sum, row) => {

      return (
        sum +
        Number(row["Franchisee Share"] || 0)
      );

    },
    0
  );


  // ==================================================
  // OUTSTANDING
  // ==================================================

  const outstandingAmount =
    totalBilling - amountReceived;


  // ==================================================
  // GROSS PROFIT
  //
  // Gross Profit =
  // Total Billing - Franchisee Share
  // ==================================================

  const grossProfit =
    totalBilling - franchiseeShare;


  // ==================================================
  // GROSS MARGIN
  // ==================================================

  const grossMargin =
    totalBilling > 0
      ? (grossProfit / totalBilling) * 100
      : 0;


  // ==================================================
  // NET AMOUNT
  // ==================================================

  const netAmount =
    totalBilling - franchiseeShare;


  // ==================================================
  // CONVERSION RATE
  // ==================================================

  const conversionRate =
    totalClients > 0
      ? (totalPlacements / totalClients) * 100
      : 0;


  // ==================================================
  // RETURN DASHBOARD DATA
  // ==================================================

  return {

    // Clients

    totalClients,

    totalEnquiries,


    // Client Status

    activeClients,

    deletedClients,

    nonActiveClients,

    blacklistedClients,

    noHiringClients,

    revivalClients,

    reallocationClients,

    prospectClients,

    permanentlyClosedClients,


    // Enquiries

    openEnquiries,

    closedEnquiries,


    // Placements

    totalPlacements,


    // Billing

    totalBilling,

    amountReceived,

    outstandingAmount,

    franchiseeShare,


    // Profit

    grossProfit,

    grossMargin:
      Number(grossMargin.toFixed(2)),

    netAmount,


    // Conversion

    conversionRate:
      Number(conversionRate.toFixed(2)),


    // Performance

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


// ====================================================
// GROUP PERFORMANCE
// ====================================================

function groupPerformance(rows, column) {

  const result = {};


  rows.forEach((row) => {

    const value = String(
      row[column] || "Unknown"
    ).trim();


    const key =
      value || "Unknown";


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
      (a, b) => b.value - a.value
    );

}