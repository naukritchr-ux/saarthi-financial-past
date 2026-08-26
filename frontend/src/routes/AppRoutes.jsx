import {
  Routes,
  Route
} from "react-router-dom";


import Login from "../pages/Login/Login";

import MainLayout from "../components/Layout/MainLayout";

import ProtectedRoute from "./ProtectedRoute";


import Dashboard from "../pages/Dashboard/Dashboard";
import Analytics from "../pages/Analytics/Analytics";
import Reports from "../pages/Reports/Reports";
import DownloadCenter from "../pages/DownloadCenter/DownloadCenter";
import EnquirySheet from "../pages/EnquirySheet/EnquirySheet";


// Performance Reports

import YearPerformance
from "../pages/PerformanceReports/YearPerformance/YearPerformance";


import TeamLeaderPerformance
from "../pages/PerformanceReports/TeamLeaderPerformance/TeamLeaderPerformance";


import BDPerformance
from "../pages/PerformanceReports/BDPerformance/BDPerformance";


import FranchisePerformance
from "../pages/PerformanceReports/FranchisePerformance/FranchisePerformance";


import IndustryPerformance
from "../pages/PerformanceReports/IndustryPerformance/IndustryPerformance";


import CityPerformance
from "../pages/PerformanceReports/CityPerformance/CityPerformance";


import ClientStatusPerformance
from "../pages/PerformanceReports/ClientStatusPerformance/ClientStatusPerformance";




function AppRoutes() {


return (


<Routes>



{/* Login */}


<Route

path="/"

element={
  <Login />
}

/>






{/* Protected Application */}


<Route

element={


  <ProtectedRoute>


    <MainLayout />


  </ProtectedRoute>


}

>



{/* Dashboard */}


<Route

path="/dashboard"

element={
  <Dashboard />
}

/>







{/* Year Performance */}


<Route

path="/year-performance"

element={
  <YearPerformance />
}

/>







{/* Team Leader Performance */}


<Route

path="/team-leader-performance"

element={
  <TeamLeaderPerformance />
}

/>







{/* BD Member Performance */}


<Route

path="/bd-performance"

element={
  <BDPerformance />
}

/>







{/* Franchise Performance */}


<Route

path="/franchise-performance"

element={
  <FranchisePerformance />
}

/>







{/* Industry Performance */}


<Route

path="/industry-performance"

element={
  <IndustryPerformance />
}

/>







{/* City Performance */}


<Route

path="/city-performance"

element={
  <CityPerformance />
}

/>







{/* Client Status Performance */}


<Route

path="/client-status-performance"

element={
  <ClientStatusPerformance />
}

/>







{/* Analytics */}


<Route

path="/analytics"

element={
  <Analytics />
}

/>







{/* Reports */}


<Route

path="/reports"

element={
  <Reports />
}

/>







{/* Download Center */}


<Route

path="/download-center"

element={
  <DownloadCenter />
}

/>







{/* Enquiry Sheet */}


<Route

path="/enquiry-sheet"

element={
  <EnquirySheet />
}

/>



</Route>



</Routes>


);


}


export default AppRoutes;