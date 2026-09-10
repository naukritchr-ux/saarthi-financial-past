import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "./MainLayout.css";


function MainLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(false);


  function handleMenuClick() {

    setSidebarOpen((previous) => !previous);

  }


  return (

    <div
      className={
        sidebarOpen
          ? "layout sidebar-open"
          : "layout sidebar-closed"
      }
    >

      <Sidebar
        isOpen={sidebarOpen}
      />


      <div className="main-content">

        <Topbar
          onMenuClick={handleMenuClick}
        />


        <div className="page-content">

          <Outlet />

        </div>

      </div>

    </div>

  );

}


export default MainLayout;