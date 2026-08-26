import { useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";

import { useData } from "../../context/DataContext";

import "./PerformanceTable.css";


function PerformanceTable() {

  const { filteredRows } = useData();

  const [search, setSearch] = useState("");


  // Create rows directly from uploaded Excel data
  const rows = useMemo(() => {

    return filteredRows
      .filter((row) => {

        return Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      })
      .map((row,index)=>({

        id:index + 1,

        ...row

      }));

  },[filteredRows,search]);



  // Generate columns from Excel headers
  const columns = useMemo(()=>{

    if(!filteredRows.length){

      return [];

    }


    const headers = Object.keys(filteredRows[0]);


    return headers.map((header)=>({

      field:header,

      headerName:header,

      flex:1.5,

      minWidth:150,


      renderCell:(params)=>{

        const value=params.value;


        if(
          value === null ||
          value === undefined
        ){

          return "";

        }


        // Format amount fields
        if(
          header.toLowerCase().includes("amount") ||
          header.toLowerCase().includes("billing") ||
          header.toLowerCase().includes("revenue")
        ){

          return `₹${Number(value || 0).toLocaleString("en-IN")}`;

        }


        return String(value);

      }

    }));


  },[filteredRows]);



  return (

    <div className="performance-table">


      <div className="table-toolbar">


        <h2>
          Performance Records
        </h2>


        <input

          type="text"

          placeholder="Search records..."

          value={search}

          onChange={(e)=>setSearch(e.target.value)}

        />


      </div>



      <DataGrid

        rows={rows}

        columns={columns}

        pageSizeOptions={[25,50,100]}

        initialState={{

          pagination:{

            paginationModel:{

              pageSize:25

            }

          }

        }}

        disableRowSelectionOnClick

      />


    </div>

  );

}


export default PerformanceTable;