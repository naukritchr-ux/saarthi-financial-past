import { useSearchParams } from "react-router-dom";


import PerformanceFilters from "./PerformanceFilters";
import KPIStrip from "../../components/KPIStrip/KPIStrip";
import PerformanceTable from "../../components/PerformanceTable/PerformanceTable";


import YearPerformance from "../PerformanceReports/YearPerformance/YearPerformance";
import TeamLeaderPerformance from "../PerformanceReports/TeamLeaderPerformance/TeamLeaderPerformance";



function Dashboard() {


  const [searchParams] = useSearchParams();


  const segment = searchParams.get("segment");



  function renderSegment(){


    if(!segment){

      return null;

    }



    switch(segment.trim()){



      case "Year":

        return (

          <YearPerformance />

        );



      case "Team Leader":

        return (

          <TeamLeaderPerformance />

        );



      default:

        return null;


    }


  }





  return (


    <div>


      {/* Existing Dashboard Components */}

      <PerformanceFilters />


      <KPIStrip />


      <PerformanceTable />



      {/* Sidebar Performance Pages */}

      {
        renderSegment()
      }



    </div>


  );


}


export default Dashboard;