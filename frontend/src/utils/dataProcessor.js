export function processDashboardData(rows, filters = {}) {

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
      industryPerformance: [],

      reportPerformance: [],
      reportView: filters.viewBy || "",
      reportBy: filters.reportBy || "",
      metricView: filters.metricView || ""
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

    return normalizeCompanyName(
      row["Company Name"]
    );

  };


  // ==================================================
  // TOTAL UNIQUE CLIENTS
  // ==================================================

  const uniqueClients = new Set();

  rows.forEach((row) => {

    const companyName =
      getCompanyName(row);

    if (companyName) {

      uniqueClients.add(
        companyName
      );

    }

  });

  const totalClients =
    uniqueClients.size;


  // ==================================================
  // TOTAL ENQUIRIES
  // ==================================================

  const totalEnquiries =
    rows.filter((row) => {

      return Boolean(
        getCompanyName(row)
      );

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

    const companyName =
      getCompanyName(row);

    const status =
      normalizeStatus(
        row["Client Status"]
      );


    if (!companyName) {
      return;
    }


    // --------------------------------------------------
    // ACTIVE
    // --------------------------------------------------

    if (status === "active") {

      statusClients.active.add(
        companyName
      );

    }


    // --------------------------------------------------
    // DELETED
    // --------------------------------------------------

    else if (status === "deleted") {

      statusClients.deleted.add(
        companyName
      );

    }


    // --------------------------------------------------
    // NON ACTIVE
    // --------------------------------------------------

    else if (
      status === "non active" ||
      status === "nonactive"
    ) {

      statusClients.nonActive.add(
        companyName
      );

    }


    // --------------------------------------------------
    // BLACKLISTED
    // --------------------------------------------------

    else if (
      status === "blacklisted" ||
      status === "blacklist"
    ) {

      statusClients.blacklisted.add(
        companyName
      );

    }


    // --------------------------------------------------
    // NO HIRING
    // --------------------------------------------------

    else if (
      status === "no hiring" ||
      status === "no hiring client" ||
      status === "no hiring clients"
    ) {

      statusClients.noHiring.add(
        companyName
      );

    }


    // --------------------------------------------------
    // REVIVAL
    // --------------------------------------------------

    else if (
      status === "revival"
    ) {

      statusClients.revival.add(
        companyName
      );

    }


    // --------------------------------------------------
    // REALLOCATION
    // --------------------------------------------------

    else if (
      status === "reallocation"
    ) {

      statusClients.reallocation.add(
        companyName
      );

    }


    // --------------------------------------------------
    // PROSPECT
    // --------------------------------------------------

    else if (
      status === "prospect"
    ) {

      statusClients.prospect.add(
        companyName
      );

    }


    // --------------------------------------------------
    // PERMANENTLY CLOSED
    // --------------------------------------------------

    else if (
      status === "permanently closed" ||
      status === "permanent closed" ||
      status === "permanently close"
    ) {

      statusClients.permanentlyClosed.add(
        companyName
      );

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

  const openEnquiries =
    rows.filter((row) => {

      const status =
        normalizeStatus(
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

  const closedEnquiries =
    rows.filter((row) => {

      const status =
        normalizeStatus(
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

  const totalPlacements =
    rows.filter((row) => {

      return Boolean(
        row["Date of Joining"] ||
        row["Joining Date"]
      );

    }).length;


  // ==================================================
  // TOTAL BILLING
  // ==================================================

  const totalBilling =
    sumNumericColumn(
      rows,
      "Total Bill Amount"
    );


  // ==================================================
  // AMOUNT RECEIVED
  // ==================================================

  const amountReceived =
    sumNumericColumn(
      rows,
      "Amount Received"
    );


  // ==================================================
  // FRANCHISEE SHARE
  // ==================================================

  const franchiseeShare =
    sumNumericColumn(
      rows,
      "Franchisee Share"
    );


  // ==================================================
  // OUTSTANDING
  // ==================================================

  const outstandingAmount =
    totalBilling -
    amountReceived;


  // ==================================================
  // GROSS PROFIT
  // ==================================================

  const grossProfit =
    totalBilling -
    franchiseeShare;


  // ==================================================
  // GROSS MARGIN
  // ==================================================

  const grossMargin =
    totalBilling > 0
      ? (
          grossProfit /
          totalBilling
        ) * 100
      : 0;


  // ==================================================
  // NET AMOUNT
  // ==================================================

  const netAmount =
    totalBilling -
    franchiseeShare;


  // ==================================================
  // CONVERSION RATE
  // ==================================================

  const conversionRate =
    totalClients > 0
      ? (
          totalPlacements /
          totalClients
        ) * 100
      : 0;


  // ==================================================
  // REPORT PERFORMANCE
  // ==================================================

  const reportPerformance =
    buildReportPerformance(
      rows,
      filters
    );


  // ==================================================
  // RETURN DASHBOARD DATA
  // ==================================================

  return {

    // --------------------------------------------------
    // CLIENTS
    // --------------------------------------------------

    totalClients,

    totalEnquiries,


    // --------------------------------------------------
    // CLIENT STATUS
    // --------------------------------------------------

    activeClients,

    deletedClients,

    nonActiveClients,

    blacklistedClients,

    noHiringClients,

    revivalClients,

    reallocationClients,

    prospectClients,

    permanentlyClosedClients,


    // --------------------------------------------------
    // ENQUIRIES
    // --------------------------------------------------

    openEnquiries,

    closedEnquiries,


    // --------------------------------------------------
    // PLACEMENTS
    // --------------------------------------------------

    totalPlacements,


    // --------------------------------------------------
    // BILLING
    // --------------------------------------------------

    totalBilling,

    amountReceived,

    outstandingAmount,

    franchiseeShare,


    // --------------------------------------------------
    // PROFIT
    // --------------------------------------------------

    grossProfit,

    grossMargin:
      Number(
        grossMargin.toFixed(2)
      ),

    netAmount,


    // --------------------------------------------------
    // CONVERSION
    // --------------------------------------------------

    conversionRate:
      Number(
        conversionRate.toFixed(2)
      ),


    // --------------------------------------------------
    // EXISTING PERFORMANCE
    // --------------------------------------------------

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
      ),


    // --------------------------------------------------
    // REPORT PERFORMANCE
    // --------------------------------------------------

    reportPerformance,

    reportView:
      filters.viewBy || "",

    reportBy:
      filters.reportBy || "",

    metricView:
      filters.metricView || ""

  };

}


// ====================================================
// NUMERIC VALUE HELPER
// ====================================================

function getNumericValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }


  if (typeof value === "number") {

    return Number.isFinite(value)
      ? value
      : 0;

  }


  const cleaned =
    String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/\s/g, "")
      .trim();


  const number =
    Number(cleaned);


  return Number.isFinite(number)
    ? number
    : 0;

}


// ====================================================
// SUM NUMERIC COLUMN
// ====================================================

function sumNumericColumn(
  rows,
  column
) {

  return rows.reduce(
    (sum, row) => {

      return (
        sum +
        getNumericValue(
          row[column]
        )
      );

    },
    0
  );

}


// ====================================================
// GROUP PERFORMANCE
// ====================================================

function groupPerformance(
  rows,
  column
) {

  const result = {};


  rows.forEach((row) => {

    const value =
      String(
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
      (a, b) =>
        b.value - a.value
    );

}


// ====================================================
// REPORT GROUP COLUMN
// ====================================================

function getReportColumn(
  reportBy
) {

  const columns = {

    bdMember:
      "BD Member",

    teamLeader:
      "Team Leader",

    franchise:
      "Franchise Name",

    city:
      "City",

    industry:
      "Industry",

    subIndustry:
      "Sub Industry"

  };


  return columns[
    reportBy
  ] || "";

}


// ====================================================
// REPORT DISPLAY LABEL
// ====================================================

function getReportLabel(
  reportBy
) {

  const labels = {

    bdMember:
      "Business Development Member",

    teamLeader:
      "Team Leader",

    franchise:
      "Franchisee",

    city:
      "City",

    industry:
      "Industry",

    subIndustry:
      "Sub Industry"

  };


  return labels[
    reportBy
  ] || "";

}


// ====================================================
// BUILD REPORT PERFORMANCE
// ====================================================

function buildReportPerformance(
  rows,
  filters
) {

  const reportView =
    filters?.viewBy || "";


  const reportBy =
    filters?.reportBy || "";


  const metricView =
    filters?.metricView || "count";


  // --------------------------------------------------
  // NO REPORT VIEW
  // --------------------------------------------------

  if (!reportView) {

    return [];

  }


  // --------------------------------------------------
  // NO REPORT BY
  // --------------------------------------------------

  if (!reportBy) {

    return [];

  }


  const column =
    getReportColumn(
      reportBy
    );


  if (!column) {

    return [];

  }


  const groups = {};


  // ==================================================
  // PROCESS ROWS
  // ==================================================

  rows.forEach((row) => {

    const groupValue =
      String(
        row[column] ||
        "Unknown"
      ).trim();


    const name =
      groupValue ||
      "Unknown";


    if (!groups[name]) {

      groups[name] = {

        name,

        count: 0,

        revenue: 0,

        placements: 0,

        billing: 0,

        franchiseeShare: 0,

        profit: 0,

        netAmount: 0,

        amountReceived: 0

      };

    }


    const group =
      groups[name];


    // ------------------------------------------------
    // COUNT
    // ------------------------------------------------

    group.count++;


    // ------------------------------------------------
    // BILLING
    // ------------------------------------------------

    const billing =
      getNumericValue(
        row["Total Bill Amount"]
      );


    group.billing +=
      billing;


    // ------------------------------------------------
    // FRANCHISEE SHARE
    // ------------------------------------------------

    const share =
      getNumericValue(
        row["Franchisee Share"]
      );


    group.franchiseeShare +=
      share;


    // ------------------------------------------------
    // PROFIT
    // ------------------------------------------------

    group.profit +=
      billing - share;


    // ------------------------------------------------
    // NET AMOUNT
    // ------------------------------------------------

    group.netAmount +=
      billing - share;


    // ------------------------------------------------
    // RECEIVED
    // ------------------------------------------------

    group.amountReceived +=
      getNumericValue(
        row["Amount Received"]
      );


    // ------------------------------------------------
    // PLACEMENTS
    // ------------------------------------------------

    if (
      row["Date of Joining"] ||
      row["Joining Date"]
    ) {

      group.placements++;

    }

  });


  // ==================================================
  // CONVERT GROUPS TO ARRAY
  // ==================================================

  const result =
    Object.values(groups)
      .map((group) => {

        // ----------------------------------------------
        // COUNT VIEW
        // ----------------------------------------------

        if (
          metricView === "count"
        ) {

          return {

            name:
              group.name,

            value:
              group.count,

            count:
              group.count,

            revenue:
              group.billing,

            billing:
              group.billing,

            placements:
              group.placements,

            profit:
              group.profit,

            netAmount:
              group.netAmount,

            franchiseeShare:
              group.franchiseeShare,

            amountReceived:
              group.amountReceived

          };

        }


        // ----------------------------------------------
        // REVENUE VIEW
        // ----------------------------------------------

        return {

          name:
            group.name,

          value:
            group.billing,

          count:
            group.count,

          revenue:
            group.billing,

          billing:
            group.billing,

          placements:
            group.placements,

          profit:
            group.profit,

          netAmount:
            group.netAmount,

          franchiseeShare:
            group.franchiseeShare,

          amountReceived:
            group.amountReceived

        };

      });


  // ==================================================
  // SORT
  // ==================================================

  result.sort(
    (a, b) =>
      Number(b.value || 0) -
      Number(a.value || 0)
  );


  // ==================================================
  // RETURN
  // ==================================================

  return {

    view:
      reportView,

    reportBy,

    reportLabel:
      getReportLabel(
        reportBy
      ),

    metricView,

    metricLabel:
      metricView === "revenue"
        ? "Revenue"
        : "Count",

    data:
      result

  };

}