import { NavLink } from "react-router-dom";

import {
  MdDashboard,
  MdAnalytics
} from "react-icons/md";

import {
  useAuth
} from "../../auth/AuthContext";

import {
  ROLE_SEGMENTS
} from "../../auth/roles";

import "./Sidebar.css";


function Sidebar() {

  const {
    user
  } = useAuth();


  const segments =

    user

      ?

    ROLE_SEGMENTS[user.role]

      :

    [];


  return (

    <aside className="sidebar">


      <div className="logo">

        <h2>
          TCHR
        </h2>

        <p>
          Performance Ledger
        </p>

      </div>


      <nav>


        {/* Dashboard */}

        <NavLink to="/dashboard">

          <MdDashboard />

          Dashboard

        </NavLink>


        {


          segments.map(

            (segment) => (


              <NavLink

                key={segment}

                to={

                  segment === "Year"

                    ?

                  "/year-performance"

                    :

                  segment === "Team Leader"

                    ?

                  "/team-leader-performance"

                    :

                  segment === "BD Member"

                    ?

                  "/bd-performance"

                    :

                  segment === "Franchise"

                    ?

                  "/franchise-performance"

                    :

                  segment === "Industry"

                    ?

                  "/industry-performance"

                    :

                  segment === "City"

                    ?

                  "/city-performance"

                    :

                  segment === "Client Status"

                    ?

                  "/client-status-performance"

                    :

                  `/dashboard?segment=${encodeURIComponent(segment)}`

                }

              >

                <MdAnalytics />

                {segment}

              </NavLink>


            )

          )


        }


      </nav>


    </aside>

  );

}


export default Sidebar;