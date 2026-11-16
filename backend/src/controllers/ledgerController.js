
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// =========================================================
// ENVIRONMENT CONFIGURATION
// =========================================================

// Load backend/.env during local development.
// On Vercel, use Environment Variables configured in settings.
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SECRET_KEY
);

// Do not initialize the client with undefined credentials.
const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
  : null;

function ensureSupabaseConfigured() {
  if (!supabase) {
    const error = new Error(
      "Supabase is not configured. Check SUPABASE_URL and SUPABASE_SECRET_KEY."
    );

    error.code = "SUPABASE_CONFIG_MISSING";

    throw error;
  }

  return supabase;
}

function getSafeErrorDetails(error) {
  return process.env.NODE_ENV === "development"
    ? error?.message || "Unknown error"
    : undefined;
}

/* =========================================================
   SUPABASE TABLE
========================================================= */

const TABLE_NAME = "client_master";

// Fetch records in batches of 1,000.
const BATCH_SIZE = 1000;

/* =========================================================
   LOG
========================================================= */

console.log("==========================================");
console.log("TCHR LEDGER CONTROLLER");
console.log("DATABASE: SUPABASE");
console.log("TABLE:", TABLE_NAME);
console.log(
  "SUPABASE CONFIGURED:",
  Boolean(SUPABASE_URL)
);
console.log(
  "SUPABASE SECRET CONFIGURED:",
  Boolean(SUPABASE_SECRET_KEY)
);
console.log("==========================================");

/* =========================================================
   EMPTY RECORD
========================================================= */

function createEmptyRecord() {
  return {
    id: null,

    company_name: "",
    tann: "",
    tds: "",

    client_status: "",
    bd_member: "",
    team_leader: "",
    franchise_name: "",

    industry: "",
    sub_industry: "",
    city: "",

    gst_number: "",
    no_of_employees: "",

    date_client_acquired: "",
    date_of_allocation: "",
    date_of_reallocation: "",

    placement_fees: "",
    salary_from: "",
    salary_offered: "",

    date_of_joining: "",

    bill_date: "",
    bill_number: "",

    service_charges: "",
    total_bill_amount: "",

    date_received: "",
    amount_received: "",

    franchisee_share: "",
    paid_on_date: "",

    soa_no: "",
    info: "",

    position_name: "",

    acquired_year: "",
    allotment_year: "",
    joining_year: "",
    bill_year: "",
    received_year: "",
    paid_year: "",

    created_at: "",
    updated_at: ""
  };
}

/* =========================================================
   VALUE HELPER
========================================================= */

function emptyIfNull(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return value;
}

/* =========================================================
   DATE HELPER
========================================================= */

function normalizeDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();

    const month = String(
      value.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      value.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return "";
  }

  const isoMatch = stringValue.match(
    /^(\d{4}-\d{2}-\d{2})/
  );

  if (isoMatch) {
    return isoMatch[1];
  }

  return stringValue;
}

/* =========================================================
   SUPABASE RECORD -> API RECORD

   Converts actual Supabase column names into the
   field names expected by the existing frontend.
========================================================= */

function mapSupabaseRecord(record) {
  const result = createEmptyRecord();

  if (!record) {
    return result;
  }

  result.id = record.id ?? null;

  /* BASIC CLIENT INFORMATION */

  result.company_name =
    emptyIfNull(record.company_name);

  result.tann =
    emptyIfNull(record.tann);

  // TDS was not imported into client_master.
  result.tds = "";

  result.client_status =
    emptyIfNull(record.client_status);

  result.bd_member =
    emptyIfNull(record.bd_member);

  result.team_leader =
    emptyIfNull(record.team_leader);

  result.franchise_name =
    emptyIfNull(record.franchise_name);

  result.industry =
    emptyIfNull(record.industry);

  result.sub_industry =
    emptyIfNull(record.sub_industry);

  result.city =
    emptyIfNull(record.city);

  result.gst_number =
    emptyIfNull(record.gst_number);

  result.no_of_employees =
    emptyIfNull(record.no_of_employees);

  /* DATES */

  result.date_client_acquired =
    normalizeDate(record.date_client_acquired);

  result.date_of_allocation =
    normalizeDate(record.date_of_allocation);

  result.date_of_reallocation =
    normalizeDate(record.date_of_reallocation);

  result.date_of_joining =
    normalizeDate(record.date_of_joining);

  result.bill_date =
    normalizeDate(record.bill_date);

  result.date_received =
    normalizeDate(record.date_received);

  result.paid_on_date =
    normalizeDate(record.paid_on_date);

  /* FINANCIAL INFORMATION */

  result.placement_fees =
    emptyIfNull(record.placement_fees);

  result.salary_from =
    emptyIfNull(record.salary_from);

  result.salary_offered =
    emptyIfNull(record.salary_offered);

  result.bill_number =
    emptyIfNull(record.bill_number);

  result.service_charges =
    emptyIfNull(record.service_charges);

  result.total_bill_amount =
    emptyIfNull(record.total_bill_amount);

  result.amount_received =
    emptyIfNull(record.amount_received);

  result.franchisee_share =
    emptyIfNull(record.franchisee_share);

  result.soa_no =
    emptyIfNull(record.soa_no);

  /* STATUS / INFORMATION */

  result.info =
    emptyIfNull(record.info);

  // Position Name was not part of the Supabase import.
  result.position_name = "";

  /* YEAR FIELDS */

  // Actual Supabase column: aquired_year
  result.acquired_year =
    emptyIfNull(record.aquired_year);

  result.allotment_year =
    emptyIfNull(record.allotment_year);

  // Actual Supabase column: joining_date
  result.joining_year =
    normalizeDate(record.joining_date);

  // Actual Supabase column: bill_date_year
  result.bill_year =
    emptyIfNull(record.bill_date_year);

  // Actual Supabase column: recived_year
  result.received_year =
    emptyIfNull(record.recived_year);

  // Actual Supabase column: paid_date
  result.paid_year =
    normalizeDate(record.paid_date);

  /* TIMESTAMPS */

  result.created_at =
    emptyIfNull(record.created_at);

  result.updated_at =
    emptyIfNull(record.updated_at);

  return result;
}

/* =========================================================
   GET ALL SUPABASE RECORDS

   Fetches all records in batches.

   Important:
   This supports datasets larger than 1,000 records.
========================================================= */

async function getAllSupabaseRecords() {
  const client = ensureSupabaseConfigured();

  const allRecords = [];

  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;

    console.log(
      `Fetching Supabase records ${from} - ${to}`
    );

    const {
      data,
      error
    } = await client
      .from(TABLE_NAME)
      .select("*")
      .order("id", {
        ascending: true
      })
      .range(from, to);

    if (error) {
      console.error(
        "SUPABASE SELECT ERROR:",
        error
      );

      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {
      break;
    }

    allRecords.push(...data);

    console.log(
      `Fetched ${data.length} records. Total: ${allRecords.length}`
    );

    // Stop when the last batch is reached.
    if (data.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return allRecords;
}

/* =========================================================
   GET ALL LEDGER RECORDS
   GET /api/ledger
========================================================= */

async function getLedgerRecords(req, res) {
  try {
    console.log("GET /api/ledger");

    const supabaseRecords =
      await getAllSupabaseRecords();

    const records =
      supabaseRecords.map(mapSupabaseRecord);

    console.log(
      "Total ledger records returned:",
      records.length
    );

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error(
      "GET LEDGER RECORDS ERROR:",
      error
    );

    const missingConfiguration =
      error?.code === "SUPABASE_CONFIG_MISSING";

    return res
      .status(missingConfiguration ? 503 : 500)
      .json({
        success: false,

        message: missingConfiguration
          ? "Supabase configuration is missing"
          : "Unable to load ledger records",

        code:
          error?.code || "LEDGER_FETCH_FAILED",

        error: getSafeErrorDetails(error)
      });
  }
}

/* =========================================================
   GET SINGLE LEDGER RECORD
   GET /api/ledger/:id
========================================================= */

async function getLedgerRecordById(req, res) {
  try {
    const { id } = req.params;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Ledger record ID is required"
      });
    }

    console.log(
      "GET /api/ledger/:id",
      id
    );

    const client = ensureSupabaseConfigured();

    const {
      data,
      error
    } = await client
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "SUPABASE SINGLE RECORD ERROR:",
        error
      );

      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Ledger record not found"
      });
    }

    const record =
      mapSupabaseRecord(data);

    return res.status(200).json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error(
      "GET LEDGER RECORD ERROR:",
      error
    );

    const missingConfiguration =
      error?.code === "SUPABASE_CONFIG_MISSING";

    return res
      .status(missingConfiguration ? 503 : 500)
      .json({
        success: false,

        message: missingConfiguration
          ? "Supabase configuration is missing"
          : "Unable to load ledger record",

        code:
          error?.code || "LEDGER_RECORD_FETCH_FAILED",

        error: getSafeErrorDetails(error)
      });
  }
}

/* =========================================================
   EXPORT CONTROLLER FUNCTIONS
========================================================= */

module.exports = {
  getLedgerRecords,
  getLedgerRecordById
};
