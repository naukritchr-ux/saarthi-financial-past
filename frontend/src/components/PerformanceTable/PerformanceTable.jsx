import { useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";

import { useData } from "../../context/DataContext";

import "./PerformanceTable.css";


function PerformanceTable() {

  const { filteredRows } = useData();

  const [search, setSearch] = useState("");


  // =================================================
  // FORMAT DATE AS DD/MM/YYYY
  // =================================================
  function formatDate(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }


  // =================================================
  // CHECK WHETHER COLUMN IS A DATE COLUMN
  // =================================================
  function isDateColumn(header) {

    const normalizedHeader = header
      .toLowerCase()
      .trim();

    return (
      normalizedHeader.includes("date") ||
      normalizedHeader === "joining date"
    );

  }


  // Create rows directly from Excel data
  const rows = useMemo(() => {

    return filteredRows
      .filter((row) => {

        return Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      })
      .map((row, index) => ({

        id: index + 1,

        ...row

      }));

  }, [filteredRows, search]);


  // Generate columns from Excel headers
  const columns = useMemo(() => {

    if (!filteredRows.length) {

      return [];

    }


    const headers = Object.keys(filteredRows[0]);


    return headers.map((header) => ({

      field: header,

      headerName: header,

      flex: 1.5,

      minWidth: 150,


      renderCell: (params) => {

        const value = params.value;


        if (
          value === null ||
          value === undefined
        ) {

          return "";

        }


        // =================================================
        // FORMAT DATE FIELDS AS DD/MM/YYYY
        // =================================================
        if (isDateColumn(header)) {

          return formatDate(value);

        }


        // =================================================
        // FORMAT AMOUNT FIELDS
        // =================================================
        if (
          header.toLowerCase().includes("amount") ||
          header.toLowerCase().includes("billing") ||
          header.toLowerCase().includes("revenue")
        ) {

          return `₹${Number(value || 0).toLocaleString("en-IN")}`;

        }


        return String(value);

      }

    }));


  }, [filteredRows]);


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

          onChange={(e) => setSearch(e.target.value)}

        />


      </div>



      <DataGrid

        rows={rows}

        columns={columns}

        pageSizeOptions={[25, 50, 100]}

        initialState={{

          pagination: {

            paginationModel: {

              pageSize: 25

            }

          }

        }}

        disableRowSelectionOnClick

      />


    </div>

  );

}


export default PerformanceTable;
