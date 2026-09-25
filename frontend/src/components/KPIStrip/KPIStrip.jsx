import React, { useEffect, useState } from "react";

import {
  Business,
  Groups,
  CurrencyRupee,
  TrendingUp,
  Percent,
  Payments,
  CheckCircle,
  Delete,
  Block,
  WorkOff,
  Replay,
  SwapHoriz,
  PersonSearch,
  Lock,
  MarkEmailRead,
  AccountBalanceWallet,
  Warning,
  Close
} from "@mui/icons-material";

import { useData } from "../../context/DataContext";

import "./KPIStrip.css";


function KPIStrip() {

  const {
    dashboardData,
    filters,
    rows
  } = useData();

  const [selectedKPI, setSelectedKPI] = useState(null);


  const reportView = filters?.viewBy || "";
  const reportBy = filters?.reportBy || "";
  const metricView = filters?.metricView || "";


  useEffect(() => {
    setSelectedKPI(null);
  }, [reportView]);


  /* =========================================================
     CURRENCY FORMAT
  ========================================================= */

  const formatCurrency = (value) => {

    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  };


  /* =========================================================
     SAFE ROW VALUE
  ========================================================= */

  const getRowValue = (row, possibleColumns) => {

    for (const column of possibleColumns) {

      if (
        row &&
        Object.prototype.hasOwnProperty.call(row, column)
      ) {
        return row[column];
      }

    }

    return "";

  };


  /* =========================================================
     INFO STATUS
     
     C  = Closed
     CN = Credit Note
     IP = Inprogress
     LEGAL = Legal
     R  = Reallocation
     RV = Revised
  ========================================================= */

  const getInfoStatus = (row) => {

    const info = getRowValue(row, [
      "Info",
      "info"
    ]);

    return String(info || "")
      .trim()
      .toUpperCase();

  };


  /* =========================================================
     COMPANY NAME
  ========================================================= */

  const getCompanyName = (row) => {

    return String(
      getRowValue(row, [
        "Company Name",
        "CompanyName",
        "companyName",
        "company_name"
      ]) || ""
    ).trim();

  };


  /* =========================================================
     BILLING AMOUNT
  ========================================================= */

  const getBillingAmount = (row) => {

    const value = getRowValue(row, [
      "Total Bill Amount",
      "Total Billing",
      "totalBilling",
      "totalBillAmount"
    ]);

    const amount = Number(
      String(value ?? "")
        .replace(/,/g, "")
        .replace(/₹/g, "")
        .trim()
    );

    return Number.isFinite(amount)
      ? amount
      : 0;

  };


  /* =========================================================
     PLACEMENT
     
     Unique Company Name where Info = R
  ========================================================= */

  const getUniquePlacementCount = () => {

    const uniqueCompanies = new Set();

    (rows || []).forEach((row) => {

      const status = getInfoStatus(row);

      if (status !== "R") {
        return;
      }

      const companyName = getCompanyName(row);

      if (companyName) {

        uniqueCompanies.add(
          companyName.toLowerCase()
        );

      }

    });

    return uniqueCompanies.size;

  };


  /* =========================================================
     PROFIT
     
     Billing amount where Info = R
  ========================================================= */

  const getProfitBilling = () => {

    return (rows || [])
      .filter(
        (row) => getInfoStatus(row) === "R"
      )
      .reduce(
        (total, row) =>
          total + getBillingAmount(row),
        0
      );

  };


  /* =========================================================
     LOSS
     
     Billing amount where Info = C
  ========================================================= */

  const getLossBilling = () => {

    return (rows || [])
      .filter(
        (row) => getInfoStatus(row) === "C"
      )
      .reduce(
        (total, row) =>
          total + getBillingAmount(row),
        0
      );

  };


  /* =========================================================
     CREDIT NOTE BILLING
     
     Billing amount where Info = CN
  ========================================================= */

  const getCreditNoteBilling = () => {

    return (rows || [])
      .filter(
        (row) => getInfoStatus(row) === "CN"
      )
      .reduce(
        (total, row) =>
          total + getBillingAmount(row),
        0
      );

  };


  const placementCount =
    getUniquePlacementCount();

  const profitBilling =
    getProfitBilling();

  const lossBilling =
    getLossBilling();

  const creditNoteBilling =
    getCreditNoteBilling();


  /* =========================================================
     BILLING KPI CARDS
     
     IMPORTANT ORDER:
     
     1. Placement
     2. Total Billing
     3. Profit
     4. Loss
     5. Credit Note Billing
  ========================================================= */

  const mainBillingKPIs = [

    {
      id: "placement",
      title: "Placement",
      value: placementCount,
      icon: <CheckCircle />,
      type: "number"
    },

    {
      id: "billing",
      title: "Total Billing",
      value: formatCurrency(
        dashboardData?.totalBilling
      ),
      icon: <CurrencyRupee />,
      type: "currency",
      clickable: true
    },

    {
      id: "profit",
      title: "Profit",
      value: formatCurrency(
        profitBilling
      ),
      icon: <TrendingUp />,
      type: "currency"
    },

    {
      id: "loss",
      title: "Loss",
      value: formatCurrency(
        lossBilling
      ),
      icon: <Warning />,
      type: "currency"
    },

    {
      id: "credit-note-billing",
      title: "Credit Note Billing",
      value: formatCurrency(
        creditNoteBilling
      ),
      icon: <Replay />,
      type: "currency"
    }

  ];


  /* =========================================================
     OVERALL / MAIN NON-BILLING KPI CARDS
     
     Gross Profit and Net Amount removed.
     Gross Margin retained.
  ========================================================= */

  const overallNonBillingKPIs = [

    {
      id: "unique-clients",
      title: "Total Unique Clients",
      value:
        dashboardData?.totalUniqueClients || 0,
      icon: <Business />,
      type: "number"
    },

    {
      id: "enquiries",
      title: "Total Enquiries",
      value:
        dashboardData?.totalEnquiries || 0,
      icon: <PersonSearch />,
      type: "number"
    },

    {
      id: "gross-margin",
      title: "Gross Margin",
      value: `${Number(
        dashboardData?.grossMargin || 0
      ).toFixed(2)}%`,
      icon: <Percent />,
      type: "percentage"
    }

  ];


  /* =========================================================
     CLIENT PERFORMANCE NON-BILLING KPI CARDS
  ========================================================= */

  const clientNonBillingKPIs = [

    {
      id: "unique-client",
      title: "Total Unique Client",
      value:
        dashboardData?.totalUniqueClients || 0,
      icon: <Business />,
      type: "number"
    },

    {
      id: "gross-margin",
      title: "Gross Margin",
      value: `${Number(
        dashboardData?.grossMargin || 0
      ).toFixed(2)}%`,
      icon: <Percent />,
      type: "percentage"
    }

  ];


  /* =========================================================
     ENQUIRY PERFORMANCE NON-BILLING KPI CARDS
  ========================================================= */

  const enquiryNonBillingKPIs = [

    {
      id: "enquiries",
      title: "Total Enquiries",
      value:
        dashboardData?.totalEnquiries || 0,
      icon: <PersonSearch />,
      type: "number"
    },

    {
      id: "gross-margin",
      title: "Gross Margin",
      value: `${Number(
        dashboardData?.grossMargin || 0
      ).toFixed(2)}%`,
      icon: <Percent />,
      type: "percentage"
    }

  ];


  /* =========================================================
     DETERMINE WHICH NON-BILLING CARDS TO DISPLAY
  ========================================================= */

  let mainNonBillingKPIs =
    overallNonBillingKPIs;


  if (
    reportView === "client" ||
    reportBy === "client" ||
    metricView === "client"
  ) {

    mainNonBillingKPIs =
      clientNonBillingKPIs;

  }


  if (
    reportView === "enquiry" ||
    reportBy === "enquiry" ||
    metricView === "enquiry"
  ) {

    mainNonBillingKPIs =
      enquiryNonBillingKPIs;

  }


  /* =========================================================
     KPI CARD
  ========================================================= */

  const KPICard = ({
    metric,
    onClick
  }) => {

    return (

      <div
        className={`kpi-card ${
          metric.clickable
            ? "kpi-card-clickable"
            : ""
        }`}
        onClick={onClick}
      >

        <div className="kpi-icon">
          {metric.icon}
        </div>

        <div className="kpi-content">

          <div className="kpi-title">
            {metric.title}
          </div>

          <div className="kpi-value">
            {metric.value}
          </div>

        </div>

      </div>

    );

  };


  /* =========================================================
     BILLING BREAKDOWN
  ========================================================= */

  const renderBillingBreakdown = () => {

    const billingData =
      dashboardData?.billingBreakdown || {};

    return (

      <div className="kpi-modal-overlay">

        <div className="kpi-modal">

          <div className="kpi-modal-header">

            <h3>
              Total Billing Breakdown
            </h3>

            <button
              className="kpi-modal-close"
              onClick={() =>
                setSelectedKPI(null)
              }
            >
              <Close />
            </button>

          </div>


          <div className="kpi-modal-body">

            <div className="kpi-breakdown-row">

              <span>
                Received
              </span>

              <strong>
                {formatCurrency(
                  billingData.received
                )}
              </strong>

            </div>


            <div className="kpi-breakdown-row">

              <span>
                Outstanding
              </span>

              <strong>
                {formatCurrency(
                  billingData.outstanding
                )}
              </strong>

            </div>


            <div className="kpi-breakdown-row">

              <span>
                Franchisee Share
              </span>

              <strong>
                {formatCurrency(
                  billingData.franchiseeShare
                )}
              </strong>

            </div>

          </div>

        </div>

      </div>

    );

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <>

      <div className="kpi-grid main-kpi-grid">


        {/* =================================================
            ROW 1
            NON-BILLING KPI CARDS
        ================================================= */}

        <div className="kpi-row non-billing-kpi-row">

          {mainNonBillingKPIs.map(
            (metric) => (

              <KPICard
                key={metric.id}
                metric={metric}
                onClick={() => {

                  if (metric.clickable) {

                    setSelectedKPI(
                      metric.id
                    );

                  }

                }}
              />

            )
          )}

        </div>


        {/* =================================================
            ROW 2
            BILLING KPI CARDS
             
            Placement
            Total Billing
            Profit
            Loss
            Credit Note Billing
        ================================================= */}

        <div className="kpi-row billing-kpi-row">

          {mainBillingKPIs.map(
            (metric) => (

              <KPICard
                key={metric.id}
                metric={metric}
                onClick={() => {

                  if (metric.clickable) {

                    setSelectedKPI(
                      metric.id
                    );

                  }

                }}
              />

            )
          )}

        </div>


      </div>


      {/* ===================================================
          TOTAL BILLING MODAL
      =================================================== */}

      {selectedKPI === "billing" &&
        renderBillingBreakdown()}

    </>

  );

}


export default KPIStrip;