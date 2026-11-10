
const express = require("express");

const {
  getTaxReturnSummary,
  saveTaxReturnSummary,
  generateTaxReturnSummaryPDF,
} = require("../controllers/taxReturnSummaryController");

const router = express.Router();

router.get("/", getTaxReturnSummary);

router.post("/", saveTaxReturnSummary);

router.post("/pdf", generateTaxReturnSummaryPDF);

module.exports = router;
