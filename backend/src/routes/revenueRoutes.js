const express = require("express");

const {
  getRevenueData,
  saveRevenueData,
} = require("../controllers/revenueController");

const router = express.Router();

/*
  GET /api/revenue

  Loads the shared Revenue data.
*/
router.get("/", getRevenueData);

/*
  POST /api/revenue

  Saves/updates the shared Revenue data.
*/
router.post("/", saveRevenueData);

module.exports = router;