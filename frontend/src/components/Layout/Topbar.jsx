import { 
  UploadFile, 
  AccountCircle,
  Logout
} from "@mui/icons-material";

import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography
} from "@mui/material";


import { useState } from "react";

import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../context/DataContext";
import { readExcel } from "../../utils/excel";

import "./Topbar.css";


function Topbar() {


  const { 
    user,
    logout
  } = useAuth();



  const {
    fileName,
    lastRefresh,
    loadExcelData
  } = useData();



  const [anchorEl,setAnchorEl] = useState(null);



  const menuOpen =
    Boolean(anchorEl);



  function handleProfileClick(event){

    setAnchorEl(event.currentTarget);

  }



  function handleClose(){

    setAnchorEl(null);

  }



  function handleLogout(){

    logout();

    handleClose();

    window.location.href="/";

  }



  async function handleUpload(event) {


    const file = event.target.files[0];


    if (!file) return;



    try {


      const rows = await readExcel(file);


      loadExcelData(rows,file);


      alert(`Loaded ${rows.length} rows successfully.`);


    }

    catch(error){


      console.error(error);


      alert("Unable to read Excel file.");


    }


  }




  return (


    <header className="ledger-topbar">


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
              {fileName || "No File Uploaded"}
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




      <div className="ledger-header-actions">



        <Button

          variant="contained"

          component="label"

          startIcon={<UploadFile />}

        >

          Upload New Sheet


          <input

            hidden

            type="file"

            accept=".xlsx,.xls,.csv"

            onChange={handleUpload}

          />


        </Button>





        <IconButton
          onClick={handleProfileClick}
        >

          <AccountCircle />


        </IconButton>




        <Menu

          anchorEl={anchorEl}

          open={menuOpen}

          onClose={handleClose}

        >



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




          <MenuItem
            onClick={handleLogout}
          >


            <Logout

              fontSize="small"

              sx={{
                marginRight:"10px"
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