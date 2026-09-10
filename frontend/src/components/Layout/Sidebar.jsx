import { NavLink } from "react-router-dom";

import {
  MdDashboard,
  MdAnalytics,
  MdAssessment
} from "react-icons/md";

import {
  useAuth
} from "../../auth/AuthContext";

import {
  ROLE_SEGMENTS
} from "../../auth/roles";

import "./Sidebar.css";


function Sidebar({ isOpen }) {

  const {
    user
  } = useAuth();


  const segments =

    user

      ?

    ROLE_SEGMENTS[user.role]

      :

    [];


  /*
   * Client Status has been removed from
   * the sidebar completely.
   */

  const reportSegments = [

    "Year",

    "Team Leader",

    "BD Member",

    "Franchise",

    "Industry",

    "City"

  ];


  /*
   * Only show report options that are
   * available for the logged-in user's role.
   */

  const availableReports =

    reportSegments.filter(

      (segment) =>
        segments.includes(segment)

    );


  function getReportPath(segment) {

    switch (segment) {

      case "Year":

        return "/year-performance";


      case "Team Leader":

        return "/team-leader-performance";


      case "BD Member":

        return "/bd-performance";


      case "Franchise":

        return "/franchise-performance";


      case "Industry":

        return "/industry-performance";


      case "City":

        return "/city-performance";


      default:

        return "/dashboard";

    }

  }


  return (

    <aside
      className={
        isOpen
          ? "sidebar sidebar-visible"
          : "sidebar sidebar-hidden"
      }
    >


      {/* =================================================
          LOGO
          ================================================= */}

      <div className="logo">

        <h2>
          TCHR
        </h2>

        <p>
          Performance Ledger
        </p>

      </div>


      {/* =================================================
          NAVIGATION
          ================================================= */}

      <nav>


        {/* =================================================
            DASHBOARD
            ================================================= */}

        <NavLink
          to="/dashboard"
          className="sidebar-link"
        >

          <MdDashboard />

          <span>
            Dashboard
          </span>

        </NavLink>


        {/* =================================================
            REPORTS CATEGORY
            ================================================= */}

        {

          availableReports.length > 0 && (

            <div className="sidebar-reports">


              {/* Reports Heading */}

              <div className="sidebar-section-title">

                <MdAssessment />

                <span>
                  Reports
                </span>

              </div>


              {/* =================================================
                  REPORT OPTIONS
                  ================================================= */}

              <div className="sidebar-report-items">

                {

                  availableReports.map(

                    (segment) => (

                      <NavLink

                        key={segment}

                        to={getReportPath(segment)}

                        className="sidebar-report-link"

                      >

                        <MdAnalytics />

                        <span>
                          {segment}
                        </span>

                      </NavLink>

                    )

                  )

                }

              </div>


            </div>

          )

        }


      </nav>


    </aside>

  );

}


export default Sidebar;