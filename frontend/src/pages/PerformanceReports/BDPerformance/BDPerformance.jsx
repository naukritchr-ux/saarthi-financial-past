import React, { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { useData } from "../../../context/DataContext";

import "./BDPerformance.css";


function BDPerformance() {

  const { rows, getFinancialYearFromRow } = useData();

  /* ============================================================
     STATES
     ============================================================ */

  const [selectedMember, setSelectedMember] = useState(null);

  // Modal Financial Year
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");

  // Main table Financial Year
  const [selectedTableFinancialYear, setSelectedTableFinancialYear] =
    useState("");

  // Main table Info Status
  const [selectedInfoStatus, setSelectedInfoStatus] = useState("");

  // Modal Info Status
  const [selectedModalInfoStatus, setSelectedModalInfoStatus] =
    useState("");


  /* ============================================================
     BASIC HELPERS
     ============================================================ */

  const toNumber = (value) => {

    if (value === null || value === undefined || value === "") {
      return 0;
    }

    if (typeof value === "number") {
      return isNaN(value) ? 0 : value;
    }

    const cleanedValue = String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

    const number = Number(cleanedValue);

    return isNaN(number) ? 0 : number;
  };


  const fullCurrency = (value) => {

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(toNumber(value));

  };


  const formatCurrency = (value) => {

    const number = toNumber(value);

    if (number >= 10000000) {
      return `₹${(number / 10000000).toFixed(2)} Cr`;
    }

    if (number >= 100000) {
      return `₹${(number / 100000).toFixed(2)} L`;
    }

    if (number >= 1000) {
      return `₹${(number / 1000).toFixed(2)} K`;
    }

    return `₹${number.toFixed(2)}`;
  };


  /* ============================================================
     COLUMN HELPERS
     ============================================================ */

  const getBDMember = (row) => {

    return String(
      row["BD Member"] ??
      row.BDMember ??
      row.bd_member ??
      ""
    ).trim();

  };


  const getIndustry = (row) => {

    return String(
      row["Industry"] ??
      row.industry ??
      "Unknown"
    ).trim() || "Unknown";

  };


  const getCity = (row) => {

    return String(
      row["City"] ??
      row.city ??
      "Unknown"
    ).trim() || "Unknown";

  };


  const getInfoStatus = (row) => {

    return String(
      row.Info ??
      row["Info"] ??
      ""
    )
      .trim()
      .toUpperCase();

  };


  const getBilling = (row) => {

    return toNumber(
      row["TANN/TDS"] ??
      row["TANN / TDS"] ??
      row.TANN ??
      row.TDS ??
      row["Billing"] ??
      row.billing ??
      row["Total Billing"] ??
      row.total_billing ??
      0
    );

  };


  const getFranchiseeShare = (row) => {

    return toNumber(
      row["Franchisee Share"] ??
      row["Franchisee Cost"] ??
      row["Franchise Cost"] ??
      row["Franchisee Cost Amount"] ??
      row.franchisee_share ??
      row.franchise_cost ??
      0
    );

  };


  /* ============================================================
     FINANCIAL CALCULATIONS
     ============================================================ */

  const getBDExpenditure = (row) => {

    const billing = getBilling(row);

    return billing * 0.05;

  };


  const getNetAmount = (row) => {

    const billing = getBilling(row);

    const franchiseeShare = getFranchiseeShare(row);

    return billing - franchiseeShare;

  };


  /* ============================================================
     INFO STATUS FINANCIAL LOGIC
     
     R   = Billing + Net Amount + 5% BD Expenditure
     All = R records only
     RV  = Billing only
     C   = Billing only
     CN  = Billing only
     ============================================================ */

  const getFinancialValues = (row, infoFilter = "") => {

    const info = getInfoStatus(row);

    const billing = getBilling(row);


    /* ------------------------------------------------------------
       ALL
       Financial calculations are ONLY for R
       ------------------------------------------------------------ */

    if (!infoFilter || infoFilter === "ALL") {

      if (info !== "R") {

        return {
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        };

      }

      return {

        billing: billing,

        netAmount: getNetAmount(row),

        bdExpenditure: getBDExpenditure(row)

      };

    }


    /* ------------------------------------------------------------
       R
       ------------------------------------------------------------ */

    if (infoFilter === "R") {

      if (info !== "R") {

        return {
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        };

      }

      return {

        billing: billing,

        netAmount: getNetAmount(row),

        bdExpenditure: getBDExpenditure(row)

      };

    }


    /* ------------------------------------------------------------
       RV / C / CN
       Billing only
       Net Amount = 0
       BD Expenditure = 0
       ------------------------------------------------------------ */

    if (
      infoFilter === "RV" ||
      infoFilter === "C" ||
      infoFilter === "CN"
    ) {

      if (info !== infoFilter) {

        return {
          billing: 0,
          netAmount: 0,
          bdExpenditure: 0
        };

      }

      return {

        billing: billing,

        netAmount: 0,

        bdExpenditure: 0

      };

    }


    return {

      billing: 0,

      netAmount: 0,

      bdExpenditure: 0

    };

  };


  /* ============================================================
     DATE HELPERS
     ============================================================ */

  const parseDate = (value) => {

    if (!value) {
      return null;
    }


    if (value instanceof Date) {

      return isNaN(value.getTime())
        ? null
        : value;

    }


    // Excel serial date
    if (
      typeof value === "number" &&
      value > 20000 &&
      value < 60000
    ) {

      const excelDate = new Date(
        Math.round(
          (value - 25569) * 86400 * 1000
        )
      );

      return isNaN(excelDate.getTime())
        ? null
        : excelDate;

    }


    const stringValue = String(value).trim();


    // DD/MM/YYYY
    const slashMatch = stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (slashMatch) {

      const day = Number(slashMatch[1]);

      const month = Number(slashMatch[2]) - 1;

      const year = Number(slashMatch[3]);

      const date = new Date(
        year,
        month,
        day
      );

      return isNaN(date.getTime())
        ? null
        : date;

    }


    // DD-MM-YYYY
    const dashMatch = stringValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );

    if (dashMatch) {

      const day = Number(dashMatch[1]);

      const month = Number(dashMatch[2]) - 1;

      const year = Number(dashMatch[3]);

      const date = new Date(
        year,
        month,
        day
      );

      return isNaN(date.getTime())
        ? null
        : date;

    }


    const date = new Date(stringValue);

    return isNaN(date.getTime())
      ? null
      : date;

  };


  const getAcquiredDate = (row) => {

    return (
      row["Date Client Acquired"] ??
      row["Date of Client Acquired"] ??
      row["Client Acquired Date"] ??
      row.date_client_acquired ??
      row["Acquisition Date"] ??
      null
    );

  };


  const getFinancialYear = (row) => {

    // Use DataContext function first if available
    if (typeof getFinancialYearFromRow === "function") {

      const contextYear = getFinancialYearFromRow(row);

      if (contextYear) {
        return contextYear;
      }

    }


    const date = parseDate(
      getAcquiredDate(row)
    );

    if (!date) {
      return "Unknown";
    }


    const year = date.getFullYear();

    const month = date.getMonth() + 1;


    if (month >= 4) {

      return `${year}-${String(
        year + 1
      ).slice(-2)}`;

    }


    return `${year - 1}-${String(
      year
    ).slice(-2)}`;

  };


  /* ============================================================
     FINANCIAL MONTHS
     ============================================================ */

  const financialMonths = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March"
  ];


  const getFinancialMonth = (row) => {

    const date = parseDate(
      getAcquiredDate(row)
    );

    if (!date) {
      return "Unknown";
    }

    return date.toLocaleString(
      "en-IN",
      {
        month: "long"
      }
    );

  };


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const year = getFinancialYear(row);

      if (year && year !== "Unknown") {
        years.add(year);
      }

    });

    return Array.from(years).sort();

  }, [rows]);


  /* ============================================================
     MAIN TABLE FILTER
     ============================================================ */

  const filteredRows = useMemo(() => {

    return rows.filter((row) => {

      const year = getFinancialYear(row);

      const info = getInfoStatus(row);


      if (
        selectedTableFinancialYear &&
        year !== selectedTableFinancialYear
      ) {

        return false;

      }


      if (
        selectedInfoStatus &&
        info !== selectedInfoStatus
      ) {

        return false;

      }


      return true;

    });

  }, [
    rows,
    selectedTableFinancialYear,
    selectedInfoStatus
  ]);


  /* ============================================================
     BD MEMBER PERFORMANCE DATA
     ============================================================ */

  const memberData = useMemo(() => {

    const members = {};


    filteredRows.forEach((row) => {

      const member =
        getBDMember(row) || "Unknown";


      if (!members[member]) {

        members[member] = {

          name: member,

          clients: 0,

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };

      }


      // Client count follows the selected table filters
      members[member].clients += 1;


      // Financial values follow Info Status rules
      const financialValues =
        getFinancialValues(
          row,
          selectedInfoStatus
        );


      members[member].billing +=
        financialValues.billing;


      members[member].netAmount +=
        financialValues.netAmount;


      members[member].bdExpenditure +=
        financialValues.bdExpenditure;

    });


    return Object.values(members);

  }, [
    filteredRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     SELECTED MEMBER ROWS
     
     IMPORTANT:
     Financial Year + Info Status both affect
     the modal cards.
     ============================================================ */

  const selectedMemberRows = useMemo(() => {

    if (!selectedMember) {
      return [];
    }


    return rows.filter((row) => {

      // BD Member
      if (
        getBDMember(row) !==
        selectedMember.name
      ) {

        return false;

      }


      // Financial Year
      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
        selectedFinancialYear
      ) {

        return false;

      }


      // Info Status
      if (
        selectedModalInfoStatus &&
        getInfoStatus(row) !==
        selectedModalInfoStatus
      ) {

        return false;

      }


      return true;

    });

  }, [
    rows,
    selectedMember,
    selectedFinancialYear,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     PERFORMANCE SUMMARY
     ============================================================ */

  const performanceSummary = useMemo(() => {

    let billing = 0;

    let netAmount = 0;

    let bdExpenditure = 0;


    selectedMemberRows.forEach((row) => {

      const financialValues =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      billing +=
        financialValues.billing;


      netAmount +=
        financialValues.netAmount;


      bdExpenditure +=
        financialValues.bdExpenditure;

    });


    return {

      clients:
        selectedMemberRows.length,

      billing,

      netAmount,

      bdExpenditure

    };

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     BEST INDUSTRY
     ============================================================ */

  const bestIndustry = useMemo(() => {

    const industryMap = {};


    selectedMemberRows.forEach((row) => {

      const industry =
        getIndustry(row);


      if (!industryMap[industry]) {

        industryMap[industry] = {

          count: 0,

          billing: 0

        };

      }


      industryMap[industry].count += 1;


      const financialValues =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      industryMap[industry].billing +=
        financialValues.billing;

    });


    const sorted =
      Object.entries(industryMap)
        .sort(
          (a, b) =>
            b[1].count - a[1].count
        );


    if (!sorted.length) {

      return {

        name: "N/A",

        count: 0,

        billing: 0

      };

    }


    return {

      name: sorted[0][0],

      count: sorted[0][1].count,

      billing: sorted[0][1].billing

    };

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     BEST CITY
     ============================================================ */

  const bestCity = useMemo(() => {

    const cityMap = {};


    selectedMemberRows.forEach((row) => {

      const city =
        getCity(row);


      if (!cityMap[city]) {

        cityMap[city] = {

          count: 0,

          billing: 0

        };

      }


      cityMap[city].count += 1;


      const financialValues =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      cityMap[city].billing +=
        financialValues.billing;

    });


    const sorted =
      Object.entries(cityMap)
        .sort(
          (a, b) =>
            b[1].count - a[1].count
        );


    if (!sorted.length) {

      return {

        name: "N/A",

        count: 0,

        billing: 0

      };

    }


    return {

      name: sorted[0][0],

      count: sorted[0][1].count,

      billing: sorted[0][1].billing

    };

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     YEARLY REPORT
     ============================================================ */

  const yearlyReport = useMemo(() => {

    const report = {};


    selectedMemberRows.forEach((row) => {

      const year =
        getFinancialYear(row);


      if (!report[year]) {

        report[year] = {

          year,

          clients: 0,

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };

      }


      report[year].clients += 1;


      const financialValues =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      report[year].billing +=
        financialValues.billing;


      report[year].netAmount +=
        financialValues.netAmount;


      report[year].bdExpenditure +=
        financialValues.bdExpenditure;

    });


    return Object.values(report)
      .sort(
        (a, b) =>
          a.year.localeCompare(b.year)
      );

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     MONTHLY REPORT
     ============================================================ */

  const monthlyReport = useMemo(() => {

    const report = {};


    financialMonths.forEach((month) => {

      report[month] = {

        month,

        clients: 0,

        billing: 0,

        netAmount: 0,

        bdExpenditure: 0

      };

    });


    selectedMemberRows.forEach((row) => {

      const year =
        getFinancialYear(row);


      if (
        selectedFinancialYear &&
        year !== selectedFinancialYear
      ) {

        return;

      }


      const month =
        getFinancialMonth(row);


      if (!report[month]) {
        return;
      }


      report[month].clients += 1;


      const financialValues =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      report[month].billing +=
        financialValues.billing;


      report[month].netAmount +=
        financialValues.netAmount;


      report[month].bdExpenditure +=
        financialValues.bdExpenditure;

    });


    return financialMonths.map(
      (month) =>
        report[month]
    );

  }, [
    selectedMemberRows,
    selectedFinancialYear,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     MODAL OPEN
     ============================================================ */

  const openPerformance = (member) => {

    setSelectedMember(member);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");

  };


  /* ============================================================
     MODAL CLOSE
     ============================================================ */

  const closePerformance = () => {

    setSelectedMember(null);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");

  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (

    <div className="bd-performance-page">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="bd-performance-header">

        <div>

          <h1>
            BD Member Performance
          </h1>

          <p>
            Analyse BD member performance,
            billing and expenditure.
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN FILTERS
          ====================================================== */}

      <div className="bd-performance-filters">

        {/* Financial Year */}

        <div className="bd-filter-group">

          <label>
            Financial Year
          </label>

          <select
            value={selectedTableFinancialYear}
            onChange={(e) =>
              setSelectedTableFinancialYear(
                e.target.value
              )
            }
          >

            <option value="">
              All Financial Years
            </option>

            {financialYears.map(
              (year) => (

                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>

              )
            )}

          </select>

        </div>


        {/* Info Status */}

        <div className="bd-filter-group">

          <label>
            Info Status
          </label>

          <select
            value={selectedInfoStatus}
            onChange={(e) =>
              setSelectedInfoStatus(
                e.target.value
              )
            }
          >

            <option value="">
              All
            </option>

            <option value="R">
              R
            </option>

            <option value="RV">
              RV
            </option>

            <option value="C">
              C
            </option>

            <option value="CN">
              CN
            </option>

          </select>

        </div>

      </div>


      {/* ======================================================
          BD MEMBER TABLE
          ====================================================== */}

      <div className="bd-table-container">

        <div className="bd-table-header">

          <div>
            <h2>
              BD Member Performance
            </h2>
          </div>

        </div>


        <div className="table-responsive">

          <table className="bd-performance-table">

            <thead>

              <tr>

                <th>
                  BD Member
                </th>

                <th>
                  Clients
                </th>

                <th>
                  Total Billing
                </th>

                <th>
                  Net Amount
                </th>

                <th>
                  BD Expenditure
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {memberData.length > 0 ? (

                memberData.map(
                  (member) => (

                    <tr
                      key={member.name}
                    >

                      <td>
                        {member.name}
                      </td>

                      <td>
                        {member.clients}
                      </td>

                      <td>
                        {fullCurrency(
                          member.billing
                        )}
                      </td>

                      <td>
                        {fullCurrency(
                          member.netAmount
                        )}
                      </td>

                      <td>
                        {fullCurrency(
                          member.bdExpenditure
                        )}
                      </td>

                      <td>

                        <button
                          className="view-performance-btn"
                          onClick={() =>
                            openPerformance(
                              member
                            )
                          }
                        >
                          View Performance
                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="no-data"
                  >
                    No BD member data found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          PERFORMANCE MODAL
          ====================================================== */}

      {selectedMember && (

        <div className="performance-modal-overlay">

          <div className="performance-modal">

            {/* Modal Header */}

            <div className="performance-modal-header">

              <div>

                <h2>
                  {selectedMember.name}
                </h2>

                <p>
                  BD Member Performance
                </p>

              </div>


              <button
                className="modal-close-btn"
                onClick={closePerformance}
              >
                ×
              </button>

            </div>


            {/* ==================================================
                MODAL FILTERS
                ================================================== */}

            <div className="bd-modal-filters">

              {/* Financial Year */}

              <div className="bd-year-control">

                <label>
                  Financial Year
                </label>

                <select
                  value={selectedFinancialYear}
                  onChange={(e) =>
                    setSelectedFinancialYear(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All Financial Years
                  </option>

                  {financialYears.map(
                    (year) => (

                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* Info Status */}

              <div className="bd-year-control">

                <label>
                  Info Status
                </label>

                <select
                  value={selectedModalInfoStatus}
                  onChange={(e) =>
                    setSelectedModalInfoStatus(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All
                  </option>

                  <option value="R">
                    R
                  </option>

                  <option value="RV">
                    RV
                  </option>

                  <option value="C">
                    C
                  </option>

                  <option value="CN">
                    CN
                  </option>

                </select>

              </div>

            </div>


            {/* ==================================================
                PERFORMANCE CARDS
                ================================================== */}

            <div className="performance-summary-grid">

              {/* Best Industry */}

              <div className="performance-summary-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {bestIndustry.name}
                </strong>

                <small>
                  {bestIndustry.count} Clients
                </small>

              </div>


              {/* Best City */}

              <div className="performance-summary-card">

                <span>
                  Best City
                </span>

                <strong>
                  {bestCity.name}
                </strong>

                <small>
                  {bestCity.count} Clients
                </small>

              </div>


              {/* Total Billing */}

              <div className="performance-summary-card">

                <span>
                  Total Billing
                </span>

                <strong>
                  {fullCurrency(
                    performanceSummary.billing
                  )}
                </strong>

              </div>


              {/* Net Amount */}

              <div className="performance-summary-card">

                <span>
                  Net Amount
                </span>

                <strong>
                  {fullCurrency(
                    performanceSummary.netAmount
                  )}
                </strong>

              </div>


              {/* BD Expenditure */}

              <div className="performance-summary-card">

                <span>
                  BD Expenditure
                </span>

                <strong>
                  {fullCurrency(
                    performanceSummary.bdExpenditure
                  )}
                </strong>

              </div>

            </div>


            {/* ==================================================
                YEARLY REPORT
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Yearly Performance
                </h3>

              </div>


              <div className="table-responsive">

                <table className="performance-report-table">

                  <thead>

                    <tr>

                      <th>
                        Financial Year
                      </th>

                      <th>
                        Clients
                      </th>

                      <th>
                        Total Billing
                      </th>

                      <th>
                        Net Amount
                      </th>

                      <th>
                        BD Expenditure
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {yearlyReport.map(
                      (item) => (

                        <tr
                          key={item.year}
                        >

                          <td>
                            {item.year}
                          </td>

                          <td>
                            {item.clients}
                          </td>

                          <td>
                            {fullCurrency(
                              item.billing
                            )}
                          </td>

                          <td>
                            {fullCurrency(
                              item.netAmount
                            )}
                          </td>

                          <td>
                            {fullCurrency(
                              item.bdExpenditure
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                MONTHLY CHART
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Monthly Billing
                </h3>

              </div>


              <div
                className="performance-chart"
                style={{
                  width: "100%",
                  height: 320
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={monthlyReport}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        fullCurrency(value)
                      }
                    />

                    <Bar
                      dataKey="billing"
                      name="Total Billing"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* ==================================================
                MONTHLY REPORT
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Monthly Report
                </h3>

              </div>


              <div className="table-responsive">

                <table className="performance-report-table">

                  <thead>

                    <tr>

                      <th>
                        Month
                      </th>

                      <th>
                        Clients
                      </th>

                      <th>
                        Total Billing
                      </th>

                      <th>
                        Net Amount
                      </th>

                      <th>
                        BD Expenditure
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {monthlyReport.map(
                      (item) => (

                        <tr
                          key={item.month}
                        >

                          <td>
                            {item.month}
                          </td>

                          <td>
                            {item.clients}
                          </td>

                          <td>
                            {fullCurrency(
                              item.billing
                            )}
                          </td>

                          <td>
                            {fullCurrency(
                              item.netAmount
                            )}
                          </td>

                          <td>
                            {fullCurrency(
                              item.bdExpenditure
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default BDPerformance;
