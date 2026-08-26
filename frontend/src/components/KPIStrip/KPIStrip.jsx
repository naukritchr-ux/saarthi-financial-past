import {
  Business,
  CheckCircle,
  Groups,
  CurrencyRupee,
  AccountBalanceWallet,
  TrendingUp,
  Warning,
  Percent,
  Payments
} from "@mui/icons-material";

import {
  useData
} from "../../context/DataContext";

import "./KPIStrip.css";


function KPIStrip() {

  const {
    dashboardData
  } = useData();


  const formatCurrency = (value) => {

    return `₹${Number(value || 0).toLocaleString("en-IN")}`;

  };


  const metrics = [

    {
      label: "Clients",
      value: dashboardData.totalClients || 0,
      icon: <Business />,
      note: "Total enquiries"
    },


    {
      label: "Active Clients",
      value: dashboardData.activeClients || 0,
      icon: <CheckCircle />,
      note: "Currently active"
    },


    {
      label: "Placements",
      value: dashboardData.totalPlacements || 0,
      icon: <Groups />,
      note: "Successful placements"
    },


    {
      label: "Total Billing",
      value: formatCurrency(
        dashboardData.totalBilling
      ),
      icon: <CurrencyRupee />,
      note: "Generated revenue"
    },


    {
      label: "Received",
      value: formatCurrency(
        dashboardData.amountReceived
      ),
      icon: <AccountBalanceWallet />,
      note: "Collected amount"
    },


    {
      label: "Outstanding",
      value: formatCurrency(
        dashboardData.outstandingAmount
      ),
      icon: <Warning />,
      note: "Pending collection"
    },


    {
      label: "Gross Profit",
      value: formatCurrency(
        dashboardData.grossProfit
      ),
      icon: <TrendingUp />,
      note: "Billing - Franchise Share"
    },


    {
      label: "Gross Margin",
      value: `${dashboardData.grossMargin || 0}%`,
      icon: <Percent />,
      note: "Profit percentage"
    },


    {
      label: "Net Amount",
      value: formatCurrency(
        dashboardData.netAmount
      ),
      icon: <Payments />,
      note: "Net business amount"
    }

  ];


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