import {
  Menu as MenuIcon,
} from "@mui/icons-material";

import {
  IconButton,
} from "@mui/material";

import { useData } from "../../context/DataContext";

import "./Topbar.css";


function Topbar({ onMenuClick }) {


  const {
    lastRefresh,
    connectionStatus,
  } = useData();


  // =================================================
  // LAST REFRESH DATE & TIME FORMAT
  // DD/MM/YYYY, HH:MM:SS
  // =================================================

  function formatLastRefresh(date) {

    if (!date) {
      return "--";
    }


    const refreshDate =
      new Date(date);


    if (
      Number.isNaN(
        refreshDate.getTime()
      )
    ) {
      return "--";
    }


    const day =
      String(
        refreshDate.getDate()
      ).padStart(2, "0");


    const month =
      String(
        refreshDate.getMonth() + 1
      ).padStart(2, "0");


    const year =
      refreshDate.getFullYear();


    const hours =
      String(
        refreshDate.getHours()
      ).padStart(2, "0");


    const minutes =
      String(
        refreshDate.getMinutes()
      ).padStart(2, "0");


    const seconds =
      String(
        refreshDate.getSeconds()
      ).padStart(2, "0");


    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;

  }


  return (

    <header className="ledger-topbar">


      {/* =================================================
          SIDEBAR TOGGLE BUTTON
          ================================================= */}

      <IconButton
        className="sidebar-menu-button"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >

        <MenuIcon />

      </IconButton>


      {/* =================================================
          HEADER INFORMATION
          ================================================= */}

      <div className="ledger-header-info">


        {/* =================================================
            PAGE TITLE
            ================================================= */}

        <h1>
          Dashboard
        </h1>


        {/* =================================================
            HEADER META INFORMATION
            ================================================= */}

        <div className="ledger-meta">


          {/* =================================================
              FILE / DATABASE CONNECTION STATUS
              ================================================= */}

          <span>

            File:

            <strong>
              {connectionStatus || "Connecting..."}
            </strong>

          </span>


          {/* =================================================
              LAST REFRESH
              ================================================= */}

          <span>

            Last Refresh:

            <strong>
              {formatLastRefresh(
                lastRefresh
              )}
            </strong>

          </span>


        </div>

      </div>


    </header>

  );

}


export default Topbar;