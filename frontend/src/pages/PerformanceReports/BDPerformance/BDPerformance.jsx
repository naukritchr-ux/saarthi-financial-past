import React, { useMemo, useState } from "react";

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
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

import "./BDPerformance.css";


function BDPerformance() {

  const {
    rows = [],
    filteredRows = [],
    filters = {}
  } = useData();


  // =====================================================
  // STATE
  // =====================================================

  const [selectedClient, setSelectedClient] =
    useState(null);


  // =====================================================
  // ACTIVE FILTERS
  // =====================================================

  const selectedBDMember =
    filters?.bdMember || "";

  const selectedYear =
    filters?.year || "";

  const selectedMonth =
    filters?.month || "";


  // =====================================================
  // MONTH ORDER
  // =====================================================

  const monthOrder = [
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


  // =====================================================
  // NUMBER HELPER
  // =====================================================

  function toNumber(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const cleaned =
      String(value)
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim();

    const number =
      Number(cleaned);

    return Number.isFinite(number)
      ? number
      : 0;
  }


  // =====================================================
  // CURRENCY
  // =====================================================

  function fullCurrency(value) {

    return `₹${toNumber(value).toLocaleString(
      "en-IN"
    )}`;

  }


  function formatCurrency(value) {

    const number =
      toNumber(value);


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


    return fullCurrency(number);

  }


  // =====================================================
  // FIELD HELPERS
  // EXACT MYSQL SCHEMA
  // =====================================================

  function getCompany(row) {

    return String(
      row.company_name || ""
    ).trim();

  }


  function getBDMember(row) {

    return String(
      row.bd_member || ""
    ).trim();

  }


  function getTeamLeader(row) {

    return String(
      row.team_leader || ""
    ).trim();

  }


  function getFranchise(row) {

    return String(
      row.franchise_name || ""
    ).trim();

  }


  function getIndustry(row) {

    return String(
      row.industry || ""
    ).trim();

  }


  function getSubIndustry(row) {

    return String(
      row.sub_industry || ""
    ).trim();

  }


  function getCity(row) {

    return String(
      row.city || ""
    ).trim();

  }


  function getAcquiredDate(row) {

    return row.date_client_acquired || "";

  }


  function getServiceCharges(row) {

    return toNumber(
      row.service_charges
    );

  }


  function getBilling(row) {

    return toNumber(
      row.total_bill_amount
    );

  }


  function getReceived(row) {

    return toNumber(
      row.amount_received
    );

  }


  function getFranchiseeShare(row) {

    return toNumber(
      row.franchisee_share
    );

  }


  // =====================================================
  // PROFIT
  //
  // Profit =
  // Total Billing
  // - Franchisee Share
  // - Other Applicable Costs
  //
  // Your current schema has franchisee_share,
  // but no separate "other costs" column.
  //
  // Therefore:
  //
  // Profit =
  // total_bill_amount - franchisee_share
  //
  // =====================================================

  function getOtherCosts(row) {

    return 0;

  }


  function getProfit(row) {

    const billing =
      getBilling(row);

    const franchiseeShare =
      getFranchiseeShare(row);

    const otherCosts =
      getOtherCosts(row);

    return (
      billing -
      franchiseeShare -
      otherCosts
    );

  }


  // =====================================================
  // DATE FORMAT
  // =====================================================

  function formatDate(value) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  }


  // =====================================================
  // FINANCIAL YEAR
  // =====================================================

  function getFinancialYear(row) {

    if (row.acquired_year) {

      const acquiredYear =
        String(
          row.acquired_year
        ).trim();


      if (
        /^\d{4}$/.test(
          acquiredYear
        )
      ) {

        const year =
          Number(acquiredYear);

        return `${year}-${year + 1}`;

      }


      if (
        /^\d{4}-\d{4}$/.test(
          acquiredYear
        )
      ) {

        return acquiredYear;

      }

    }


    const value =
      row.date_client_acquired;


    if (!value) {

      return "";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "";

    }


    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;


    if (month >= 4) {

      return `${year}-${year + 1}`;

    }


    return `${year - 1}-${year}`;

  }


  // =====================================================
  // MONTH
  // =====================================================

  function getMonth(row) {

    if (!row.date_client_acquired) {

      return "";

    }


    const date =
      new Date(
        row.date_client_acquired
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "";

    }


    return date.toLocaleString(
      "en-IN",
      {
        month: "long"
      }
    );

  }


  // =====================================================
  // ACTIVE DATA
  //
  // filteredRows should already contain the filters
  // coming from DataContext.
  //
  // We additionally ensure BD/year/month filtering here
  // so the page works even if DataContext does not apply
  // those fields correctly.
  // =====================================================

  const activeRows = useMemo(() => {

    let data =
      Array.isArray(filteredRows) &&
      filteredRows.length > 0
        ? filteredRows
        : rows;


    // ---------------------------------------------------
    // BD MEMBER
    // ---------------------------------------------------

    if (selectedBDMember) {

      data =
        data.filter(
          row =>
            getBDMember(row) ===
            String(
              selectedBDMember
            )
        );

    }


    // ---------------------------------------------------
    // YEAR
    // ---------------------------------------------------

    if (selectedYear) {

      data =
        data.filter(
          row =>
            getFinancialYear(row) ===
            String(
              selectedYear
            )
        );

    }


    // ---------------------------------------------------
    // MONTH
    // ---------------------------------------------------

    if (selectedMonth) {

      data =
        data.filter(
          row =>
            getMonth(row) ===
            String(
              selectedMonth
            )
        );

    }


    return data;

  }, [
    rows,
    filteredRows,
    selectedBDMember,
    selectedYear,
    selectedMonth
  ]);


  // =====================================================
  // BD MEMBER RANKING
  // =====================================================

  const memberData = useMemo(() => {

    const members = {};


    activeRows.forEach(row => {

      const member =
        getBDMember(row);


      if (!member) {

        return;

      }


      if (!members[member]) {

        members[member] = {

          clients: 0,

          billing: 0,

          received: 0,

          franchiseeShare: 0,

          profit: 0,

          outstanding: 0

        };

      }


      members[member].clients++;


      const billing =
        getBilling(row);

      const received =
        getReceived(row);

      const franchiseeShare =
        getFranchiseeShare(row);

      const profit =
        getProfit(row);


      members[member].billing +=
        billing;


      members[member].received +=
        received;


      members[member].franchiseeShare +=
        franchiseeShare;


      members[member].profit +=
        profit;


      members[member].outstanding +=
        Math.max(
          billing - received,
          0
        );

    });


    return Object.entries(
      members
    )
      .map(
        ([name, data]) => ({

          name,

          ...data,

          margin:
            data.billing
              ? (
                  data.profit /
                  data.billing
                ) * 100
              : 0

        })
      )
      .sort(
        (a, b) =>
          b.clients -
          a.clients
      );

  }, [
    activeRows
  ]);


  // =====================================================
  // SELECTED MEMBER ROWS
  // =====================================================

  const selectedRows = useMemo(() => {

    if (!selectedBDMember) {

      return [];

    }


    return activeRows.filter(
      row =>
        getBDMember(row) ===
        String(
          selectedBDMember
        )
    );

  }, [
    activeRows,
    selectedBDMember
  ]);


  // =====================================================
  // PERFORMANCE SUMMARY
  // =====================================================

  const performanceSummary =
    useMemo(() => {

      let billing = 0;

      let received = 0;

      let franchiseeShare = 0;

      let profit = 0;

      let outstanding = 0;


      selectedRows.forEach(
        row => {

          const bill =
            getBilling(row);

          const receive =
            getReceived(row);

          billing +=
            bill;

          received +=
            receive;

          franchiseeShare +=
            getFranchiseeShare(row);

          profit +=
            getProfit(row);

          outstanding +=
            Math.max(
              bill - receive,
              0
            );

        }
      );


      return {

        clients:
          selectedRows.length,

        billing,

        received,

        franchiseeShare,

        profit,

        outstanding

      };

    }, [
      selectedRows
    ]);


  // =====================================================
  // INDUSTRY PERFORMANCE
  // =====================================================

  const industryData = useMemo(() => {

    const industries = {};


    selectedRows.forEach(row => {

      const industry =
        getIndustry(row) ||
        "Unknown";


      if (!industries[industry]) {

        industries[industry] = {

          industry,

          clients: 0

        };

      }


      industries[industry].clients++;

    });


    return Object.values(
      industries
    ).sort(
      (a, b) =>
        b.clients -
        a.clients
    );

  }, [
    selectedRows
  ]);


  // =====================================================
  // ENQUIRY COUNT
  //
  // IMPORTANT:
  //
  // Same company appearing multiple times =
  // multiple enquiry requests.
  //
  // Example:
  //
  // ABC Ltd
  // ABC Ltd
  // ABC Ltd
  //
  // enquiry count = 3
  //
  // This is calculated from the actual data.
  // =====================================================

  const enquiryCounts = useMemo(() => {

    const counts = {};


    selectedRows.forEach(row => {

      const company =
        getCompany(row);


      if (!company) {

        return;

      }


      if (!counts[company]) {

        counts[company] = 0;

      }


      counts[company]++;

    });


    return counts;

  }, [
    selectedRows
  ]);


  // =====================================================
  // CLIENT CARDS
  //
  // One card per UNIQUE company.
  // =====================================================

  const clientCards = useMemo(() => {

    const companies = {};


    selectedRows.forEach(row => {

      const company =
        getCompany(row);


      if (!company) {

        return;

      }


      if (!companies[company]) {

        companies[company] = {

          company,

          rows: []

        };

      }


      companies[company].rows.push(
        row
      );

    });


    return Object.values(
      companies
    ).map(
      client => {

        const latestRow =
          client.rows[
            client.rows.length - 1
          ];


        let billing = 0;

        let received = 0;

        let serviceCharges = 0;

        let franchiseeShare = 0;


        client.rows.forEach(
          row => {

            billing +=
              getBilling(row);

            received +=
              getReceived(row);

            serviceCharges +=
              getServiceCharges(row);

            franchiseeShare +=
              getFranchiseeShare(row);

          }
        );


        return {

          company:
            client.company,

          enquiryCount:
            client.rows.length,

          row:
            latestRow,

          acquiredDate:
            latestRow.date_client_acquired,

          bdMember:
            getBDMember(latestRow),

          teamLeader:
            getTeamLeader(latestRow),

          franchise:
            getFranchise(latestRow),

          industry:
            getIndustry(latestRow),

          subIndustry:
            getSubIndustry(latestRow),

          city:
            getCity(latestRow),

          serviceCharges,

          billing,

          received,

          outstanding:
            Math.max(
              billing - received,
              0
            ),

          franchiseeShare,

          profit:
            billing -
            franchiseeShare

        };

      }
    );

  }, [
    selectedRows
  ]);


  // =====================================================
  // MONTHLY PERFORMANCE
  // =====================================================

  const monthlyPerformance =
    useMemo(() => {

      if (!selectedYear) {

        return [];

      }


      const result = {};


      monthOrder.forEach(
        month => {

          result[month] = {

            month,

            clients: 0,

            billing: 0,

            received: 0,

            profit: 0

          };

        }
      );


      selectedRows.forEach(row => {

        const month =
          getMonth(row);


        if (
          !result[month]
        ) {

          return;

        }


        result[month].clients++;

        result[month].billing +=
          getBilling(row);

        result[month].received +=
          getReceived(row);

        result[month].profit +=
          getProfit(row);

      });


      return monthOrder.map(
        month =>
          result[month]
      );

    }, [
      selectedRows,
      selectedYear
    ]);


  // =====================================================
  // PIE DATA
  // =====================================================

  const pieData = [

    {
      name: "Received",
      value:
        performanceSummary.received
    },

    {
      name: "Outstanding",
      value:
        performanceSummary.outstanding
    }

  ].filter(
    item =>
      item.value > 0
  );


  const PIE_COLORS = [
    "#26734D",
    "#B78A34"
  ];


  // =====================================================
  // PIE TOOLTIP
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


    return (

      <div className="bd-pie-tooltip">

        <strong>
          {payload[0].name}
        </strong>

        <span>
          {fullCurrency(
            payload[0].value
          )}
        </span>

      </div>

    );

  }


  // =====================================================
  // MONTHLY TOOLTIP
  // =====================================================

  function renderMonthlyTooltip({
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

      <div className="bd-monthly-tooltip">

        <strong>
          {label}
        </strong>


        {payload.map(item => (

          <div
            key={
              item.dataKey
            }
          >

            <span>
              {item.name}
            </span>

            <b>

              {item.dataKey ===
              "clients"

                ? item.value

                : fullCurrency(
                    item.value
                  )}

            </b>

          </div>

        ))}

      </div>

    );

  }


  // =====================================================
  // NO BD SELECTED
  // =====================================================

  if (!selectedBDMember) {

    return (

      <div className="bd-performance">

        <h1>
          BD Member Performance
        </h1>


        <PerformanceFilters
          activeFilter="bdMember"
        />


        <div className="bd-filter-message">

          <div className="bd-filter-icon">
            👤
          </div>

          <h2>
            Select a BD Member
          </h2>

          <p>
            Select a BD Member from the
            filters above to view complete
            performance details.
          </p>

        </div>


        <div className="bd-performance-table">

          <table>

            <thead>

              <tr>

                <th>Rank</th>

                <th>BD Member</th>

                <th>Clients</th>

                <th>Billing</th>

                <th>Received</th>

                <th>Franchisee Share</th>

                <th>Profit</th>

                <th>Outstanding</th>

              </tr>

            </thead>


            <tbody>

              {memberData.length > 0 ? (

                memberData.map(
                  (member, index) => (

                    <tr
                      key={
                        member.name
                      }
                    >

                      <td>
                        {index + 1}
                      </td>

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
                          member.received
                        )}
                      </td>

                      <td>
                        {fullCurrency(
                          member.franchiseeShare
                        )}
                      </td>

                      <td className={
                        member.profit >= 0
                          ? "profit-positive"
                          : "profit-negative"
                      }>
                        {fullCurrency(
                          member.profit
                        )}
                      </td>

                      <td>
                        {fullCurrency(
                          member.outstanding
                        )}
                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="empty-table"
                  >
                    No BD performance
                    data available.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    );

  }


  // =====================================================
  // SELECTED BD MEMBER VIEW
  // =====================================================

  return (

    <div className="bd-performance">


      {/* =================================================
          TITLE
      ================================================= */}

      <div className="bd-page-heading">

        <div>

          <span>
            BUSINESS DEVELOPMENT
          </span>

          <h1>
            {selectedBDMember}
          </h1>

          <p>
            {selectedYear
              ? `Performance for ${selectedYear}`
              : "Overall performance"
            }

            {selectedMonth &&
              ` • ${selectedMonth}`
            }

          </p>

        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <PerformanceFilters
        activeFilter="bdMember"
      />


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="bd-kpi-grid">


        <div className="bd-kpi-card clients">

          <div className="bd-kpi-icon">
            👥
          </div>

          <span>
            TOTAL CLIENTS
          </span>

          <strong>
            {performanceSummary.clients}
          </strong>

          <small>
            Clients acquired
          </small>

        </div>


        <div className="bd-kpi-card billing">

          <div className="bd-kpi-icon">
            ₹
          </div>

          <span>
            TOTAL BILLING
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.billing
            )}
          </strong>

          <small>
            Total bill amount
          </small>

        </div>


        <div className="bd-kpi-card received">

          <div className="bd-kpi-icon">
            ✓
          </div>

          <span>
            RECEIVED
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.received
            )}
          </strong>

          <small>
            Amount received
          </small>

        </div>


        <div className="bd-kpi-card outstanding">

          <div className="bd-kpi-icon">
            !
          </div>

          <span>
            NOT RECEIVED
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.outstanding
            )}
          </strong>

          <small>
            Outstanding billing
          </small>

        </div>


        <div className="bd-kpi-card profit">

          <div className="bd-kpi-icon">
            ↗
          </div>

          <span>
            PROFIT
          </span>

          <strong>
            {formatCurrency(
              performanceSummary.profit
            )}
          </strong>

          <small>
            Billing − Franchisee Share
          </small>

        </div>

      </div>


      {/* =================================================
          INDUSTRY BREAKDOWN
      ================================================= */}

      <div className="bd-industry-section">

        <div className="bd-section-heading">

          <div>

            <span>
              CLIENT MIX
            </span>

            <h2>
              Industry Performance
            </h2>

          </div>

          <strong>
            {industryData.length}
            {" "}
            Industries
          </strong>

        </div>


        <div className="industry-grid">

          {industryData.length > 0 ? (

            industryData.map(
              industry => (

                <div
                  className="industry-card"
                  key={
                    industry.industry
                  }
                >

                  <div className="industry-number">
                    {industry.clients}
                  </div>

                  <div>

                    <strong>
                      {industry.industry}
                    </strong>

                    <span>
                      Client
                      {industry.clients !== 1
                        ? "s"
                        : ""
                      }
                    </span>

                  </div>

                </div>

              )
            )

          ) : (

            <div className="bd-empty">
              No industry data available.
            </div>

          )}

        </div>

      </div>


      {/* =================================================
          YEARLY / MONTHLY PERFORMANCE
      ================================================= */}

      {selectedYear && (

        <div className="bd-chart-card">

          <div className="chart-card-header">

            <div>

              <span className="chart-label">
                PERFORMANCE TREND
              </span>

              <h3>
                Monthly Performance
              </h3>

            </div>

          </div>


          <ResponsiveContainer
            width="100%"
            height={380}
          >

            <LineChart
              data={
                monthlyPerformance
              }
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
              />

              <YAxis />

              <Tooltip
                content={
                  renderMonthlyTooltip
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="billing"
                name="Billing"
                stroke="#1B2A4A"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="received"
                name="Received"
                stroke="#26734D"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#B78A34"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      )}


      {/* =================================================
          FINANCIAL + PIE
      ================================================= */}

      <div className="bd-chart-grid">


        <div className="bd-chart-card">

          <div className="chart-card-header">

            <div>

              <span className="chart-label">
                COLLECTION
              </span>

              <h3>
                Received vs Not Received
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
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={4}
                >

                  {pieData.map(
                    (entry, index) => (

                      <Cell
                        key={
                          `pie-${index}`
                        }
                        fill={
                          PIE_COLORS[
                            index
                          ]
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


                <Legend />

              </PieChart>

            </ResponsiveContainer>

          ) : (

            <div className="no-financial-data">
              No billing data available.
            </div>

          )}

        </div>


        <div className="bd-chart-card">

          <div className="chart-card-header">

            <div>

              <span className="chart-label">
                FINANCIAL SUMMARY
              </span>

              <h3>
                Complete Overview
              </h3>

            </div>

          </div>


          <div className="financial-summary-list">

            <div>
              <span>
                Total Billing
              </span>

              <strong>
                {fullCurrency(
                  performanceSummary.billing
                )}
              </strong>
            </div>


            <div>
              <span>
                Amount Received
              </span>

              <strong>
                {fullCurrency(
                  performanceSummary.received
                )}
              </strong>
            </div>


            <div>
              <span>
                Franchisee Share
              </span>

              <strong>
                {fullCurrency(
                  performanceSummary.franchiseeShare
                )}
              </strong>
            </div>


            <div>
              <span>
                Not Received
              </span>

              <strong>
                {fullCurrency(
                  performanceSummary.outstanding
                )}
              </strong>
            </div>


            <div className="profit-row">

              <span>
                Profit
              </span>

              <strong>
                {fullCurrency(
                  performanceSummary.profit
                )}
              </strong>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          CLIENT CARDS
      ================================================= */}

      <div className="bd-client-section">

        <div className="bd-section-heading">

          <div>

            <span>
              CLIENT PORTFOLIO
            </span>

            <h2>
              Companies Acquired
            </h2>

          </div>

          <strong>
            {clientCards.length}
            {" "}
            Unique Companies
          </strong>

        </div>


        <div className="client-card-grid">

          {clientCards.length > 0 ? (

            clientCards.map(
              client => (

                <div
                  className="client-card"
                  key={
                    client.company
                  }
                >

                  {/* ---------------------------------
                      CARD HEADER
                  --------------------------------- */}

                  <div className="client-card-header">

                    <div className="client-company-icon">
                      {client.company
                        .charAt(0)
                        .toUpperCase()
                      }
                    </div>


                    <div className="client-company-name">

                      <h3>
                        {client.company}
                      </h3>

                      <span>
                        {client.industry ||
                          "Industry not specified"
                        }
                      </span>

                    </div>


                    {/* ENQUIRY COUNT */}

                    <div className="enquiry-badge">

                      <small>
                        ENQUIRIES
                      </small>

                      <strong>
                        {client.enquiryCount}
                      </strong>

                    </div>

                  </div>


                  {/* ---------------------------------
                      CLIENT DETAILS
                  --------------------------------- */}

                  <div className="client-details">

                    <div>

                      <span>
                        Acquired
                      </span>

                      <strong>
                        {formatDate(
                          client.acquiredDate
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        BD Member
                      </span>

                      <strong>
                        {client.bdMember ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Team Leader
                      </span>

                      <strong>
                        {client.teamLeader ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Franchise
                      </span>

                      <strong>
                        {client.franchise ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>


                  {/* ---------------------------------
                      BILLING SNAPSHOT
                  --------------------------------- */}

                  <div className="client-billing">

                    <div>

                      <span>
                        Service Charges
                      </span>

                      <strong>
                        {fullCurrency(
                          client.serviceCharges
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Billing
                      </span>

                      <strong>
                        {fullCurrency(
                          client.billing
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Not Received
                      </span>

                      <strong className="not-received">

                        {fullCurrency(
                          client.outstanding
                        )}

                      </strong>

                    </div>

                  </div>


                  {/* ---------------------------------
                      VIEW DETAILS
                  --------------------------------- */}

                  <button
                    type="button"
                    className="view-details-button"
                    onClick={() =>
                      setSelectedClient(
                        client
                      )
                    }
                  >

                    <span>
                      View Details
                    </span>

                    <span>
                      →
                    </span>

                  </button>

                </div>

              )
            )

          ) : (

            <div className="bd-empty">

              No clients found for the
              selected filters.

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          BILLING DRAWER
      ================================================= */}

      {selectedClient && (

        <>

          <div
            className="drawer-overlay"
            onClick={() =>
              setSelectedClient(null)
            }
          />


          <aside className="billing-drawer">


            <div className="drawer-header">

              <div>

                <span>
                  BILLING DETAILS
                </span>

                <h2>
                  {selectedClient.company}
                </h2>

              </div>


              <button
                type="button"
                className="drawer-close"
                onClick={() =>
                  setSelectedClient(null)
                }
              >
                ×
              </button>

            </div>


            <div className="drawer-body">


              {/* ENQUIRY */}

              <div className="drawer-enquiry">

                <span>
                  ENQUIRY NO.
                </span>

                <strong>
                  {selectedClient.enquiryCount}
                </strong>

                <small>
                  Requests received for this
                  company
                </small>

              </div>


              {/* GENERAL */}

              <div className="drawer-section">

                <h3>
                  Client Information
                </h3>


                <div className="drawer-grid">

                  <div>
                    <span>
                      Acquired Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedClient.acquiredDate
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      BD Member
                    </span>

                    <strong>
                      {selectedClient.bdMember ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Team Leader
                    </span>

                    <strong>
                      {selectedClient.teamLeader ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Franchise
                    </span>

                    <strong>
                      {selectedClient.franchise ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Industry
                    </span>

                    <strong>
                      {selectedClient.industry ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      City
                    </span>

                    <strong>
                      {selectedClient.city ||
                        "—"
                      }
                    </strong>
                  </div>

                </div>

              </div>


              {/* BILLING */}

              <div className="drawer-section">

                <h3>
                  Billing Information
                </h3>


                <div className="billing-detail-list">

                  <div>

                    <span>
                      Service Charges
                    </span>

                    <strong>
                      {fullCurrency(
                        selectedClient.serviceCharges
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Total Billing
                    </span>

                    <strong>
                      {fullCurrency(
                        selectedClient.billing
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Amount Received
                    </span>

                    <strong>
                      {fullCurrency(
                        selectedClient.received
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Not Received
                    </span>

                    <strong className="drawer-outstanding">
                      {fullCurrency(
                        selectedClient.outstanding
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Franchisee Share
                    </span>

                    <strong>
                      {fullCurrency(
                        selectedClient.franchiseeShare
                      )}
                    </strong>

                  </div>


                  <div className="drawer-profit">

                    <span>
                      Profit
                    </span>

                    <strong>
                      {fullCurrency(
                        selectedClient.profit
                      )}
                    </strong>

                  </div>

                </div>

              </div>


              {/* BILL INFORMATION */}

              <div className="drawer-section">

                <h3>
                  Bill Information
                </h3>


                <div className="drawer-grid">

                  <div>
                    <span>
                      Bill Number
                    </span>

                    <strong>
                      {selectedClient.row
                        ?.bill_number ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Bill Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedClient.row
                          ?.bill_date
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Date Received
                    </span>

                    <strong>
                      {formatDate(
                        selectedClient.row
                          ?.date_received
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      SOA No.
                    </span>

                    <strong>
                      {selectedClient.row
                        ?.soa_no ||
                        "—"
                      }
                    </strong>
                  </div>

                </div>

              </div>


              {/* INFO */}

              {selectedClient.row?.info && (

                <div className="drawer-section">

                  <h3>
                    Additional Information
                  </h3>

                  <p className="drawer-info">
                    {selectedClient.row.info}
                  </p>

                </div>

              )}

            </div>


            <div className="drawer-footer">

              <button
                type="button"
                onClick={() =>
                  setSelectedClient(null)
                }
              >
                Close Details
              </button>

            </div>


          </aside>

        </>

      )}

    </div>

  );

}


export default BDPerformance;