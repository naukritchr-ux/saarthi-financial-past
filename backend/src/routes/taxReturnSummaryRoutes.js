
const express = require("express");

const {
  getTaxReturnSummary,
  saveTaxReturnSummary,
} = require("../controllers/taxReturnSummaryController");

const router = express.Router();

// GET /api/tax-return-summary?financialYear=2025-26
router.get("/", getTaxReturnSummary);

// POST /api/tax-return-summary
router.post("/", saveTaxReturnSummary);

module.exports = router;
