import {
  AccountCircle,
  Logout,
  Menu as MenuIcon,
} from "@mui/icons-material";

import {
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material";

import { useState } from "react";

import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../context/DataContext";

import "./Topbar.css";


function Topbar({ onMenuClick }) {

  const {
    user,
    logout,
  } = useAuth();


  const {
    fileName,
    lastRefresh,
  } = useData();


  const [
    anchorEl,
    setAnchorEl,
  ] = useState(null);


  const menuOpen =
    Boolean(anchorEl);


  function handleProfileClick(event) {

    setAnchorEl(
      event.currentTarget
    );

  }


  function handleClose() {

    setAnchorEl(null);

  }


  function handleLogout() {

    logout();

    handleClose();

    window.location.href = "/";

  }


  return (

    <header className="ledger-topbar">


      {/* =================================================
          FIXED SIDEBAR TOGGLE BUTTON
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

        <h1>
          Dashboard
        </h1>


        <div className="ledger-meta">

          <span>

            Role:

            <strong>
              {user?.role || "Guest"}
            </strong>

          </span>


          <span>

            File:

            <strong>
              {fileName || "enquiry sheet  old.xlsx"}
            </strong>

          </span>


          <span>

            Last Refresh:

            <strong>

              {
                lastRefresh
                  ? lastRefresh.toLocaleString()
                  : "--"
              }

            </strong>

          </span>

        </div>

      </div>


      {/* =================================================
          HEADER ACTIONS
          ================================================= */}

      <div className="ledger-header-actions">


        {/* =================================================
            PROFILE BUTTON
            ================================================= */}

        <IconButton
          className="profile-button"
          onClick={handleProfileClick}
          aria-label="Open profile menu"
        >

          <AccountCircle />

        </IconButton>


        {/* =================================================
            PROFILE MENU
            ================================================= */}

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleClose}
        >


          {/* ROLE */}

          <MenuItem disabled>

            <Typography>

              Role:

              <strong>
                {" "}
                {user?.role || "Guest"}
              </strong>

            </Typography>

          </MenuItem>


          <Divider />


          {/* LOGOUT */}

          <MenuItem
            onClick={handleLogout}
          >

            <Logout
              fontSize="small"
              sx={{
                marginRight: "10px",
              }}
            />

            Logout

          </MenuItem>


        </Menu>

      </div>

    </header>

  );

}


export default Topbar;
