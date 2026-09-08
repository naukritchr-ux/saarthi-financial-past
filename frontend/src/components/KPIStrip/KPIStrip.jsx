console.log("🔥 NEW KPIStrip.jsx IS RUNNING");
import React, { useState } from "react";

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
  MailOutline,
  AccountBalanceWallet,
  Warning,
  Close
} from "@mui/icons-material";

import { useData } from "../../context/DataContext";

import "./KPIStrip.css";


function KPIStrip() {

  const { dashboardData } = useData();

  const [selectedKPI, setSelectedKPI] =
    useState(null);


  // ==================================================
  // CURRENCY FORMAT
  // ==================================================

  const formatCurrency = (value) => {

    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;

  };


  // ==================================================
  // MAIN KPIs
  // ==================================================

  const mainKPIs = [

    {
      id: "clients",
      label: "Total Unique Clients",
      value: dashboardData.totalClients || 0,
      icon: <Business />,
      note: "Unique Company Name",
      clickable: true
    },

    {
      id: "enquiries",
      label: "Total Enquiries",
      value: dashboardData.totalEnquiries || 0,
      icon: <Groups />,
      note: "Total enquiry records",
      clickable: true
    },

    {
      id: "billing",
      label: "Total Billing",
      value: formatCurrency(
        dashboardData.totalBilling
      ),
      icon: <CurrencyRupee />,
      note: "Salary × Service Charge",
      clickable: true
    },

    {
      id: "placements",
      label: "Placements",
      value: dashboardData.totalPlacements || 0,
      icon: <Groups />,
      note: "Successful placements"
    },

    {
      id: "gross-profit",
      label: "Gross Profit",
      value: formatCurrency(
        dashboardData.grossProfit
      ),
      icon: <TrendingUp />,
      note: "Billing − Franchisee Share"
    },

    {
      id: "gross-margin",
      label: "Gross Margin",
      value: `${
        dashboardData.grossMargin || 0
      }%`,
      icon: <Percent />,
      note: "Profit percentage"
    },

    {
      id: "net-amount",
      label: "Net Amount",
      value: formatCurrency(
        dashboardData.netAmount
      ),
      icon: <Payments />,
      note: "Net business amount"
    }

  ];


  // ==================================================
  // CLIENT STATUS KPIs
  // ==================================================

  const clientStatusKPIs = [

    {
      id: "active",
      label: "Active Clients",
      value: dashboardData.activeClients || 0,
      icon: <CheckCircle />,
      note: "Currently active"
    },

    {
      id: "deleted",
      label: "Deleted Clients",
      value: dashboardData.deletedClients || 0,
      icon: <Delete />,
      note: "Deleted clients"
    },

    {
      id: "non-active",
      label: "Non Active Clients",
      value: dashboardData.nonActiveClients || 0,
      icon: <WorkOff />,
      note: "Currently non active"
    },

    {
      id: "blacklisted",
      label: "Blacklisted",
      value: dashboardData.blacklistedClients || 0,
      icon: <Block />,
      note: "Blacklisted clients"
    },

    {
      id: "no-hiring",
      label: "No Hiring Clients",
      value: dashboardData.noHiringClients || 0,
      icon: <WorkOff />,
      note: "No hiring"
    },

    {
      id: "revival",
      label: "Revival",
      value: dashboardData.revivalClients || 0,
      icon: <Replay />,
      note: "Revival clients"
    },

    {
      id: "reallocation",
      label: "Reallocation",
      value: dashboardData.reallocationClients || 0,
      icon: <SwapHoriz />,
      note: "Reallocated clients"
    },

    {
      id: "prospect",
      label: "Prospect",
      value: dashboardData.prospectClients || 0,
      icon: <PersonSearch />,
      note: "Prospective clients"
    },

    {
      id: "permanently-closed",
      label: "Permanently Closed",
      value:
        dashboardData.permanentlyClosedClients || 0,
      icon: <Lock />,
      note: "Permanently closed"
    }

  ];


  // ==================================================
  // ENQUIRY KPIs
  // ==================================================

  const enquiryKPIs = [

    {
      id: "open-enquiries",
      label: "Open Enquiries",
      value: dashboardData.openEnquiries || 0,
      icon: <MailOutline />,
      note: "Currently open"
    },

    {
      id: "closed-enquiries",
      label: "Closed Enquiries",
      value: dashboardData.closedEnquiries || 0,
      icon: <MarkEmailRead />,
      note: "Successfully closed"
    }

  ];


  // ==================================================
  // BILLING KPIs
  // ==================================================

  const billingKPIs = [

    {
      id: "received",
      label: "Received",
      value: formatCurrency(
        dashboardData.amountReceived
      ),
      icon: <AccountBalanceWallet />,
      note: "Collected amount"
    },

    {
      id: "outstanding",
      label: "Outstanding",
      value: formatCurrency(
        dashboardData.outstandingAmount
      ),
      icon: <Warning />,
      note: "Pending collection"
    },

    {
      id: "franchise-share",
      label: "Franchisee Share",
      value: formatCurrency(
        dashboardData.franchiseeShare
      ),
      icon: <Payments />,
      note: "Franchisee share"
    }

  ];


  // ==================================================
  // MODAL DATA
  // ==================================================

  const getModalData = () => {

    if (selectedKPI === "clients") {

      return {

        title: "Client Status Breakdown",

        subtitle:
          "Unique Company Name count by client status",

        items: clientStatusKPIs

      };

    }


    if (selectedKPI === "enquiries") {

      return {

        title: "Enquiry Breakdown",

        subtitle:
          "Open and closed enquiry records",

        items: enquiryKPIs

      };

    }


    if (selectedKPI === "billing") {

      return {

        title: "Billing Breakdown",

        subtitle:
          "Billing collection and franchisee share",

        items: billingKPIs

      };

    }


    return null;

  };


  const modalData =
    getModalData();


  // ==================================================
  // KPI CARD
  // ==================================================

  const KPICard = ({
    metric,
    section
  }) => {

    return (

      <div

        className={`kpi-item ${
          metric.clickable
            ? "kpi-clickable"
            : ""
        }`}

        onClick={() => {

          if (metric.clickable) {

            setSelectedKPI(
              metric.id
            );

          }

        }}

      >

        <div className="kpi-cell">


          <div
            className={`kpi-icon ${
              section || ""
            }`}
          >

            {metric.icon}

          </div>


          <div className="kpi-content">


            <div className="kpi-label">

              {metric.label}

            </div>


            <div className="kpi-value">

              {metric.value}

            </div>


            <div className="kpi-note">

              {metric.note}

            </div>


          </div>


        </div>

      </div>

    );

  };


  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const closeModal = () => {

    setSelectedKPI(null);

  };


  // ==================================================
  // RENDER
  // ==================================================

  return (

    <>

      <div className="kpi-ledger">


        {/* ==========================================
            PERFORMANCE OVERVIEW
        ========================================== */}

        <section className="kpi-section">

          <div className="kpi-section-header">

            <div>

              <h3>
                Performance Overview
              </h3>

              <p>
                Overall business performance
              </p>

            </div>

          </div>


          <div className="kpi-grid main-kpi-grid">

            {mainKPIs.map((metric) => (

              <KPICard

                key={metric.id}

                metric={metric}

                section="main"

              />

            ))}

          </div>

        </section>



        {/* ==========================================
            CLIENT STATUS
        ========================================== */}

        <section className="kpi-section">

          <div className="kpi-section-header">

            <div>

              <h3>
                Client Status
              </h3>

              <p>
                Unique clients by current status
              </p>

            </div>

          </div>


          <div className="kpi-grid client-kpi-grid">

            {clientStatusKPIs.map((metric) => (

              <KPICard

                key={metric.id}

                metric={metric}

                section="client"

              />

            ))}

          </div>

        </section>



        {/* ==========================================
            ENQUIRY STATUS
        ========================================== */}

        <section className="kpi-section">

          <div className="kpi-section-header">

            <div>

              <h3>
                Enquiry Status
              </h3>

              <p>
                Current enquiry pipeline
              </p>

            </div>

          </div>


          <div className="kpi-grid enquiry-kpi-grid">

            {enquiryKPIs.map((metric) => (

              <KPICard

                key={metric.id}

                metric={metric}

                section="enquiry"

              />

            ))}

          </div>

        </section>



        {/* ==========================================
            BILLING
        ========================================== */}

        <section className="kpi-section">

          <div className="kpi-section-header">

            <div>

              <h3>
                Billing & Collection
              </h3>

              <p>
                Revenue collection breakdown
              </p>

            </div>

          </div>


          <div className="kpi-grid billing-kpi-grid">

            {billingKPIs.map((metric) => (

              <KPICard

                key={metric.id}

                metric={metric}

                section="billing"

              />

            ))}

          </div>

        </section>


      </div>



      {/* =================================================
          CENTERED POPUP
      ================================================= */}

      {modalData && (

        <div
          className="kpi-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="kpi-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* MODAL HEADER */}

            <div className="kpi-modal-header">

              <div>

                <h2>
                  {modalData.title}
                </h2>

                <p>
                  {modalData.subtitle}
                </p>

              </div>


              <button

                type="button"

                className="kpi-modal-close"

                onClick={closeModal}

                aria-label="Close"

              >

                <Close />

              </button>

            </div>



            {/* MODAL KPI CARDS */}

            <div
              className={`kpi-sub-grid ${
                selectedKPI === "clients"
                  ? "client-sub-grid"
                  : ""
              }`}
            >

              {modalData.items.map((item) => (

                <div
                  className="kpi-sub-card"
                  key={item.id}
                >

                  <div className="kpi-sub-icon">

                    {item.icon}

                  </div>


                  <div className="kpi-sub-content">

                    <div className="kpi-sub-label">

                      {item.label}

                    </div>


                    <div className="kpi-sub-value">

                      {item.value}

                    </div>


                    <div className="kpi-sub-note">

                      {item.note}

                    </div>

                  </div>

                </div>

              ))}

            </div>



            {/* MODAL FOOTER */}

            <div className="kpi-modal-footer">

              <button

                type="button"

                className="kpi-modal-button"

                onClick={closeModal}

              >

                Close

              </button>

            </div>


          </div>

        </div>

      )}

    </>

  );

}


export default KPIStrip;