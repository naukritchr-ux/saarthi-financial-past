import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

import {
  useData
} from "../../context/DataContext";

import "./Segmentation.css";


function Segmentation() {

  const {
    filters,
    setFilters
  } = useData();


  // ======================================================
  // HANDLE FILTER CHANGE
  // ======================================================

  function handleChange(field, value) {

    setFilters(previous => ({

      ...previous,

      [field]: value

    }));

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <Card className="segmentation-card">

      <CardContent>


        {/* ==================================================
            TITLE
        ================================================== */}

        <Typography
          variant="h6"
          className="segmentation-title"
        >

          View Performance By

        </Typography>


        {/* ==================================================
            BASE FILTERS
        ================================================== */}

        <Grid
          container
          spacing={2}
          className="performance-filters"
        >


          {/* ==================================================
              VIEW BY
          ================================================== */}

          <Grid
            item
            xs={12}
            sm={6}
            md={4}
          >

            <FormControl fullWidth>

              <InputLabel>
                View By
              </InputLabel>

              <Select

                label="View By"

                value={
                  filters.viewBy || ""
                }

                onChange={event =>
                  handleChange(
                    "viewBy",
                    event.target.value
                  )
                }

              >

                <MenuItem value="">
                  None
                </MenuItem>

                <MenuItem value="client">
                  Client Performance
                </MenuItem>

                <MenuItem value="enquiry">
                  Enquiry Performance
                </MenuItem>

              </Select>

            </FormControl>

          </Grid>


          {/* ==================================================
              ALL TIME
          ================================================== */}

          <Grid
            item
            xs={12}
            sm={6}
            md={4}
          >

            <FormControl fullWidth>

              <InputLabel>
                All Time
              </InputLabel>

              <Select

                label="All Time"

                value={
                  filters.allTime || "all"
                }

                onChange={event =>
                  handleChange(
                    "allTime",
                    event.target.value
                  )
                }

              >

                <MenuItem value="all">
                  All Time
                </MenuItem>

                <MenuItem value="yearly">
                  Yearly
                </MenuItem>

                <MenuItem value="monthly">
                  Monthly
                </MenuItem>

                <MenuItem value="quarterly">
                  Quarterly
                </MenuItem>

              </Select>

            </FormControl>

          </Grid>


          {/* ==================================================
              SORT BY
          ================================================== */}

          <Grid
            item
            xs={12}
            sm={6}
            md={4}
          >

            <FormControl fullWidth>

              <InputLabel>
                Sort By
              </InputLabel>

              <Select

                label="Sort By"

                value={
                  filters.sortBy || ""
                }

                onChange={event =>
                  handleChange(
                    "sortBy",
                    event.target.value
                  )
                }

              >

                <MenuItem value="">
                  None
                </MenuItem>

                <MenuItem value="franchise">
                  FRANCHISEE NAME
                </MenuItem>

                <MenuItem value="bdMember">
                  BD MEMBER
                </MenuItem>

                <MenuItem value="teamLeader">
                  TEAM LEADER
                </MenuItem>

              </Select>

            </FormControl>

          </Grid>

        </Grid>


        {/* ==================================================
            EXISTING PERFORMANCE TABS
        ================================================== */}

        <Typography
          variant="subtitle1"
          className="segmentation-subtitle"
        >

          Performance Segmentation

        </Typography>


        <div className="segment-result">

          Performance view:

          <strong>

            {
              filters.viewBy === "client"
                ? " Client Performance"
                : filters.viewBy === "enquiry"
                  ? " Enquiry Performance"
                  : " None"
            }

          </strong>

        </div>


      </CardContent>

    </Card>

  );

}


export default Segmentation;