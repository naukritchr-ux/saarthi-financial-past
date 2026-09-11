import React, { useMemo, useState } from "react";
import { Close } from "@mui/icons-material";

import { useData } from "../../../context/DataContext";

import "./BDPerformance.css";


/* ============================================================
   BD PERFORMANCE
   ============================================================ */

function BDPerformance() {

  const {
    rows = [],
    getFinancialYearFromRow
  } = useData();


  /* ============================================================
     STATE
     ============================================================ */

  const [selectedMember, setSelectedMember] = useState(null);

  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState("");

  const [selectedTableFinancialYear, setSelectedTableFinancialYear] =
    useState("");

  const [selectedInfoStatus, setSelectedInfoStatus] =
    useState("");

  const [selectedModalInfoStatus, setSelectedModalInfoStatus] =
    useState("");


  /* ============================================================
     BASIC HELPERS
     ============================================================ */

  const toNumber = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
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


  /* ============================================================
     ROW FIELD HELPERS
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
    ).trim().toUpperCase();

  };


  /* ============================================================
     BILLING
     ============================================================ */

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


  /* ============================================================
     FRANCHISEE SHARE
     ============================================================ */

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
     DATE PARSER
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


    /* Excel serial date */

    if (
      typeof value === "number" &&
      value > 20000 &&
      value < 60000
    ) {

      const excelDate = new Date(
        Math.round(
          (value - 25569) *
          86400 *
          1000
        )
      );

      return isNaN(excelDate.getTime())
        ? null
        : excelDate;

    }


    const stringValue = String(value).trim();


    /* DD/MM/YYYY */

    const slashMatch = stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


    if (slashMatch) {

      const day = Number(slashMatch[1]);

      const month =
        Number(slashMatch[2]) - 1;

      const year =
        Number(slashMatch[3]);

      const date =
        new Date(year, month, day);

      return isNaN(date.getTime())
        ? null
        : date;

    }


    /* DD-MM-YYYY */

    const dashMatch = stringValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );


    if (dashMatch) {

      const day =
        Number(dashMatch[1]);

      const month =
        Number(dashMatch[2]) - 1;

      const year =
        Number(dashMatch[3]);

      const date =
        new Date(year, month, day);

      return isNaN(date.getTime())
        ? null
        : date;

    }


    const date =
      new Date(stringValue);

    return isNaN(date.getTime())
      ? null
      : date;

  };


  /* ============================================================
     ACQUIRED DATE
     ============================================================ */

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


  /* ============================================================
     FINANCIAL YEAR
     ============================================================ */

  const getFinancialYear = (row) => {

    if (
      typeof getFinancialYearFromRow === "function"
    ) {

      const contextYear =
        getFinancialYearFromRow(row);

      if (contextYear) {
        return contextYear;
      }

    }


    const date =
      parseDate(
        getAcquiredDate(row)
      );


    if (!date) {
      return "Unknown";
    }


    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;


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


  /* ============================================================
     FINANCIAL YEARS
     ============================================================ */

  const financialYears = useMemo(() => {

    const years = new Set();

    rows.forEach((row) => {

      const year =
        getFinancialYear(row);

      if (year && year !== "Unknown") {
        years.add(year);
      }

    });

    return Array.from(years).sort();

  }, [rows]);


  /* ============================================================
     FINANCIAL CALCULATION
     
     RULES:

     ALL
     ------------------------------------------------------------
     Billing       = R + RV + C + CN
     Net Amount    = Billing - Franchisee Share
     Expenditure   = 5% of Total Billing

     R
     ------------------------------------------------------------
     Billing       = R Billing
     Net Amount    = R Billing - R Franchisee Share
     Expenditure   = 5% of R Billing

     RV
     ------------------------------------------------------------
     Billing       = RV Billing
     Net Amount    = 0
     Expenditure   = 0

     C
     ------------------------------------------------------------
     Billing       = C Billing
     Net Amount    = 0
     Expenditure   = 0

     CN
     ------------------------------------------------------------
     Billing       = CN Billing
     Net Amount    = 0
     Expenditure   = 0
     ============================================================ */

  const getFinancialValues = (
    row,
    infoFilter = ""
  ) => {

    const info =
      getInfoStatus(row);

    const billing =
      getBilling(row);

    const franchiseeShare =
      getFranchiseeShare(row);


    /* ========================================================
       ALL
       ======================================================== */

    if (
      !infoFilter ||
      infoFilter === "ALL"
    ) {

      return {

        billing: billing,

        netAmount:
          billing - franchiseeShare,

        bdExpenditure:
          billing * 0.05

      };

    }


    /* ========================================================
       R
       ======================================================== */

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

        netAmount:
          billing - franchiseeShare,

        bdExpenditure:
          billing * 0.05

      };

    }


    /* ========================================================
       RV
       ======================================================== */

    if (infoFilter === "RV") {

      if (info !== "RV") {

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


    /* ========================================================
       C
       ======================================================== */

    if (infoFilter === "C") {

      if (info !== "C") {

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


    /* ========================================================
       CN
       ======================================================== */

    if (infoFilter === "CN") {

      if (info !== "CN") {

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
     MAIN TABLE FILTER
     ============================================================ */

  const filteredRows = useMemo(() => {

    return rows.filter((row) => {

      const year =
        getFinancialYear(row);

      const info =
        getInfoStatus(row);


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
     BD MEMBER PERFORMANCE
     ============================================================ */

  const memberPerformance = useMemo(() => {

    const grouped = {};


    filteredRows.forEach((row) => {

      const member =
        getBDMember(row);


      if (!member) {
        return;
      }


      if (!grouped[member]) {

        grouped[member] = {

          name: member,

          clients: 0,

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };

      }


      const financialValues =
        getFinancialValues(
          row,
          selectedInfoStatus
        );


      grouped[member].clients += 1;

      grouped[member].billing +=
        financialValues.billing;

      grouped[member].netAmount +=
        financialValues.netAmount;

      grouped[member].bdExpenditure +=
        financialValues.bdExpenditure;

    });


    return Object.values(grouped);

  }, [
    filteredRows,
    selectedInfoStatus
  ]);


  /* ============================================================
     SELECTED MEMBER ROWS
     ============================================================ */

  const selectedMemberRows = useMemo(() => {

    if (!selectedMember) {
      return [];
    }


    return rows.filter((row) => {

      if (
        getBDMember(row) !==
        selectedMember.name
      ) {

        return false;

      }


      if (
        selectedFinancialYear &&
        getFinancialYear(row) !==
        selectedFinancialYear
      ) {

        return false;

      }


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
     MODAL SUMMARY
     ============================================================ */

  const performanceSummary = useMemo(() => {

    let billing = 0;

    let netAmount = 0;

    let bdExpenditure = 0;


    selectedMemberRows.forEach((row) => {

      const values =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      billing +=
        values.billing;

      netAmount +=
        values.netAmount;

      bdExpenditure +=
        values.bdExpenditure;

    });


    return {

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

    const grouped = {};


    selectedMemberRows.forEach((row) => {

      const industry =
        getIndustry(row);


      if (!grouped[industry]) {

        grouped[industry] = {

          name: industry,

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };

      }


      const values =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      grouped[industry].billing +=
        values.billing;

      grouped[industry].netAmount +=
        values.netAmount;

      grouped[industry].bdExpenditure +=
        values.bdExpenditure;

    });


    return Object.values(grouped)
      .sort(
        (a, b) =>
          b.billing - a.billing
      )[0] || null;

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     BEST CITY
     ============================================================ */

  const bestCity = useMemo(() => {

    const grouped = {};


    selectedMemberRows.forEach((row) => {

      const city =
        getCity(row);


      if (!grouped[city]) {

        grouped[city] = {

          name: city,

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };

      }


      const values =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      grouped[city].billing +=
        values.billing;

      grouped[city].netAmount +=
        values.netAmount;

      grouped[city].bdExpenditure +=
        values.bdExpenditure;

    });


    return Object.values(grouped)
      .sort(
        (a, b) =>
          b.billing - a.billing
      )[0] || null;

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     YEARLY PERFORMANCE
     ============================================================ */

  const yearlyPerformance = useMemo(() => {

    const grouped = {};


    selectedMemberRows.forEach((row) => {

      const year =
        getFinancialYear(row);


      if (!grouped[year]) {

        grouped[year] = {

          year,

          billing: 0,

          netAmount: 0,

          bdExpenditure: 0

        };

      }


      const values =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      grouped[year].billing +=
        values.billing;

      grouped[year].netAmount +=
        values.netAmount;

      grouped[year].bdExpenditure +=
        values.bdExpenditure;

    });


    return Object.values(grouped)
      .sort((a, b) =>
        a.year.localeCompare(b.year)
      );

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     MONTHLY PERFORMANCE
     ============================================================ */

  const monthlyPerformance = useMemo(() => {

    const grouped = {};


    financialMonths.forEach((month) => {

      grouped[month] = {

        month,

        billing: 0,

        netAmount: 0,

        bdExpenditure: 0

      };

    });


    selectedMemberRows.forEach((row) => {

      const date =
        parseDate(
          getAcquiredDate(row)
        );


      if (!date) {
        return;
      }


      const monthIndex =
        date.getMonth();


      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];


      const month =
        monthNames[monthIndex];


      if (!grouped[month]) {
        return;
      }


      const values =
        getFinancialValues(
          row,
          selectedModalInfoStatus
        );


      grouped[month].billing +=
        values.billing;

      grouped[month].netAmount +=
        values.netAmount;

      grouped[month].bdExpenditure +=
        values.bdExpenditure;

    });


    return financialMonths.map(
      (month) =>
        grouped[month]
    );

  }, [
    selectedMemberRows,
    selectedModalInfoStatus
  ]);


  /* ============================================================
     OPEN PERFORMANCE
     ============================================================ */

  const openPerformance = (member) => {

    setSelectedMember(member);

    setSelectedFinancialYear("");

    setSelectedModalInfoStatus("");

  };


  /* ============================================================
     CLOSE PERFORMANCE
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
          HEADER
          ====================================================== */}

      <div className="bd-performance-header">

        <div>

          <h1>
            BD Member Performance
          </h1>

          <p>
            Analyse BD member billing,
            net amount and expenditure
            performance.
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN FILTERS
          ====================================================== */}

      <div className="bd-performance-filters">

        <div className="bd-filter-group">

          <label>
            Financial Year
          </label>

          <select
            value={
              selectedTableFinancialYear
            }
            onChange={(e) =>
              setSelectedTableFinancialYear(
                e.target.value
              )
            }
          >

            <option value="">
              All Financial Years
            </option>

            {financialYears.map((year) => (

              <option
                key={year}
                value={year}
              >
                {year}
              </option>

            ))}

          </select>

        </div>


        <div className="bd-filter-group">

          <label>
            Info Status
          </label>

          <select
            value={
              selectedInfoStatus
            }
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
          MAIN TABLE
          ====================================================== */}

      <div className="bd-table-container">

        <div className="bd-table-header">

          <h2>
            BD Member Performance
          </h2>

        </div>


        <div className="table-responsive">

          <table className="bd-performance-table">

            <thead>

              <tr>

                <th>
                  BD Member
                </th>

                <th>
                  Total Clients
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

              {memberPerformance.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="no-data"
                  >
                    No data available
                  </td>

                </tr>

              ) : (

                memberPerformance.map(
                  (member) => (

                    <tr key={member.name}>

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

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          PERFORMANCE MODAL
          ====================================================== */}

      {selectedMember && (

        <div
          className="performance-modal-overlay"
          onClick={closePerformance}
        >

          <div
            className="performance-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* ==================================================
                MODAL HEADER
                ================================================== */}

            <div className="performance-modal-header">

              <div>

                <h2>
                  {selectedMember.name}
                </h2>

                <p>
                  BD Member Performance Report
                </p>

              </div>


              <button
                className="modal-close-btn"
                onClick={closePerformance}
              >

                <Close />

              </button>

            </div>


            {/* ==================================================
                MODAL FILTERS
                ================================================== */}

            <div className="bd-modal-filters">

              <div className="bd-year-control">

                <label>
                  Financial Year
                </label>

                <select
                  value={
                    selectedFinancialYear
                  }
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


              <div className="bd-year-control">

                <label>
                  Info Status
                </label>

                <select
                  value={
                    selectedModalInfoStatus
                  }
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
                SUMMARY
                ================================================== */}

            <div className="performance-summary-grid">

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


              <div className="performance-summary-card">

                <span>
                  Best Industry
                </span>

                <strong>
                  {bestIndustry
                    ? bestIndustry.name
                    : "N/A"}
                </strong>

              </div>


              <div className="performance-summary-card">

                <span>
                  Best City
                </span>

                <strong>
                  {bestCity
                    ? bestCity.name
                    : "N/A"}
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

                    {yearlyPerformance.length === 0 ? (

                      <tr>

                        <td
                          colSpan="4"
                          className="no-data"
                        >
                          No data available
                        </td>

                      </tr>

                    ) : (

                      yearlyPerformance.map(
                        (item) => (

                          <tr key={item.year}>

                            <td>
                              {item.year}
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
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                MONTHLY REPORT
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Monthly Performance
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

                    {monthlyPerformance.map(
                      (item) => (

                        <tr key={item.month}>

                          <td>
                            {item.month}
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
                CHART DATA
                ================================================== */}

            <div className="performance-report-section">

              <div className="performance-section-header">

                <h3>
                  Performance Chart
                </h3>

              </div>


              <div className="performance-chart">

                {monthlyPerformance.map(
                  (item) => (

                    <div
                      key={item.month}
                      style={{
                        marginBottom: "12px"
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: "4px"
                        }}
                      >

                        <span>
                          {item.month}
                        </span>

                        <strong>
                          {fullCurrency(
                            item.billing
                          )}
                        </strong>

                      </div>


                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background:
                            "#e5e7eb",
                          borderRadius:
                            "20px",
                          overflow:
                            "hidden"
                        }}
                      >

                        <div
                          style={{
                            width:
                              `${Math.min(
                                100,
                                performanceSummary.billing
                                  ? (
                                    item.billing /
                                    performanceSummary.billing
                                  ) * 100
                                  : 0
                              )}%`,
                            height: "100%",
                            background:
                              "#6366f1",
                            borderRadius:
                              "20px"
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default BDPerformance;
