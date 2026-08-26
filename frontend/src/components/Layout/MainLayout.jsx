import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "./MainLayout.css";

function MainLayout() {
  return (
    <div className="layout">

      <Sidebar />

      <div className="main-content">

        <Topbar />

        <div className="page-content">
          <Outlet />
        </div>

      </div>

    </div>
  );
}

export default MainLayout;