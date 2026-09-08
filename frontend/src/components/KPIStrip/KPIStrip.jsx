import {
  Business,
  CheckCircle,
  Groups,
  CurrencyRupee,
  AccountBalanceWallet,
  TrendingUp,
  Warning,
  Percent,
  Payments,
  Lock,
  LockOpen
} from "@mui/icons-material";

import {
  useData
} from "../../context/DataContext";

import "./KPIStrip.css";


function KPIStrip() {

  const {
    dashboardData
  } = useData();


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {

    return `₹${Number(value || 0).toLocaleString("en-IN")}`;

  };


  // =====================================================
  // KPI METRICS
  // =====================================================

  const metrics = [

    // ---------------------------------------------------
    // 1. CLIENTS
    // ---------------------------------------------------

    {
      label: "Clients",
      value: dashboardData.totalClients || 0,
      icon: <Business />,
      note: "Unique clients"
    },


    // ---------------------------------------------------
    // 2. ACTIVE CLIENTS
    // ---------------------------------------------------

    {
      label: "Active Clients",
      value: dashboardData.activeClients || 0,
      icon: <CheckCircle />,
      note: "Unique active clients"
    },


    // ---------------------------------------------------
    // 3. OPEN CLIENT ENQUIRY
    // ---------------------------------------------------

    {
      label: "Open Client Enquiry",
      value: dashboardData.openClientEnquiries || 0,
      icon: <LockOpen />,
      note: "Unique open clients"
    },


    // ---------------------------------------------------
    // 4. CLOSED CLIENT ENQUIRY
    // ---------------------------------------------------

    {
      label: "Closed Client Enquiry",
      value: dashboardData.closedClientEnquiries || 0,
      icon: <Lock />,
      note: "Unique closed clients"
    },


    // ---------------------------------------------------
    // 5. PLACEMENTS
    // ---------------------------------------------------

    {
      label: "Placements",
      value: dashboardData.totalPlacements || 0,
      icon: <Groups />,
      note: "Successful placements"
    },


    // ---------------------------------------------------
    // 6. TOTAL BILLING
    // ---------------------------------------------------

    {
      label: "Total Billing",
      value: formatCurrency(
        dashboardData.totalBilling
      ),
      icon: <CurrencyRupee />,
      note: "Generated revenue"
    },


    // ---------------------------------------------------
    // 7. RECEIVED
    // ---------------------------------------------------

    {
      label: "Received",
      value: formatCurrency(
        dashboardData.amountReceived
      ),
      icon: <AccountBalanceWallet />,
      note: "Collected amount"
    },


    // ---------------------------------------------------
    // 8. OUTSTANDING
    // ---------------------------------------------------

    {
      label: "Outstanding",
      value: formatCurrency(
        dashboardData.outstandingAmount
      ),
      icon: <Warning />,
      note: "Pending collection"
    },


    // ---------------------------------------------------
    // 9. GROSS PROFIT
    // ---------------------------------------------------

    {
      label: "Gross Profit",
      value: formatCurrency(
        dashboardData.grossProfit
      ),
      icon: <TrendingUp />,
      note: "Billing - Franchise Share"
    },


    // ---------------------------------------------------
    // 10. GROSS MARGIN
    // ---------------------------------------------------

    {
      label: "Gross Margin",
      value: `${dashboardData.grossMargin || 0}%`,
      icon: <Percent />,
      note: "Profit percentage"
    },


    // ---------------------------------------------------
    // 11. NET AMOUNT
    // ---------------------------------------------------

    {
      label: "Net Amount",
      value: formatCurrency(
        dashboardData.netAmount
      ),
      icon: <Payments />,
      note: "Net business amount"
    }

  ];


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="kpi-ledger">

      <div className="kpi-grid">

        {
          metrics.map((metric) => (

            <div
              className="kpi-item"
              key={metric.label}
            >

              <div className="kpi-cell">

                <div className="kpi-icon">
                  {metric.icon}
                </div>


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

          ))
        }

      </div>

    </div>

  );

}


export default KPIStrip;