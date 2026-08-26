const express = require("express");

const {
  getLedgerRecords,
  getLedgerRecordById
} = require("../controllers/ledgerController");


// ======================================================
// CREATE ROUTER
// ======================================================

const router = express.Router();


// ======================================================
// GET ALL LEDGER RECORDS
// GET /api/ledger
// ======================================================

router.get(
  "/",
  getLedgerRecords
);


// ======================================================
// GET SINGLE LEDGER RECORD
// GET /api/ledger/:id
// ======================================================

router.get(
  "/:id",
  getLedgerRecordById
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;