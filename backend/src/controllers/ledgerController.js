const { createClient } = require("@supabase/supabase-js");

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL) {
  console.error("ERROR: SUPABASE_URL is not configured");
}

if (!SUPABASE_SECRET_KEY) {
  console.error(
    "ERROR: SUPABASE_SECRET_KEY is not configured"
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY
);

/* =========================================================
   SUPABASE TABLE
========================================================= */

const TABLE_NAME = "client_master";

/*
  Supabase/PostgREST can return a limited number of rows
  per request.

  Therefore we fetch the table in batches.
*/
const BATCH_SIZE = 1000;

/* =========================================================
   LOG
========================================================= */

console.log("==========================================");
console.log("TCHR LEDGER CONTROLLER");
console.log("DATABASE: SUPABASE");
console.log("TABLE:", TABLE_NAME);
console.log("SUPABASE CONFIGURED:", Boolean(SUPABASE_URL));
console.log(
  "SUPABASE SECRET CONFIGURED:",
  Boolean(SUPABASE_SECRET_KEY)
);
console.log("==========================================");

/* =========================================================
   EMPTY RECORD
   Keeps the same response structure as the old controller.
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

   Supabase may return DATE/TIMESTAMP values as strings.

   Keep them in a frontend-compatible format.
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

  /*
    If Supabase returns:
    2024-04-25
    2024-04-25T00:00:00+00:00
  */

  const isoMatch =
    stringValue.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  if (isoMatch) {
    return isoMatch[1];
  }

  return stringValue;
}

/* =========================================================
   SUPABASE RECORD -> OLD API RECORD

   IMPORTANT:
   Your existing DataContext expects these API field names.

   Actual client_master fields include:
     aquired_year
     allotment_year
     joining_date
     bill_date_year
     recived_year
     paid_date

   We convert them back to:
     acquired_year
     allotment_year
     joining_year
     bill_year
     received_year
     paid_year

   This means the frontend does NOT need to be rewritten.
========================================================= */

function mapSupabaseRecord(record) {
  const result = createEmptyRecord();

  if (!record) {
    return result;
  }

  result.id = record.id ?? null;

  /* =======================================================
     BASIC CLIENT INFORMATION
  ======================================================= */

  result.company_name =
    emptyIfNull(record.company_name);

  result.tann =
    emptyIfNull(record.tann);

  /*
    TDS was not imported into client_master.
    Keep empty for frontend compatibility.
  */
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

  /* =======================================================
     DATES
  ======================================================= */

  result.date_client_acquired =
    normalizeDate(
      record.date_client_acquired
    );

  result.date_of_allocation =
    normalizeDate(
      record.date_of_allocation
    );

  result.date_of_reallocation =
    normalizeDate(
      record.date_of_reallocation
    );

  result.date_of_joining =
    normalizeDate(
      record.date_of_joining
    );

  result.bill_date =
    normalizeDate(
      record.bill_date
    );

  result.date_received =
    normalizeDate(
      record.date_received
    );

  result.paid_on_date =
    normalizeDate(
      record.paid_on_date
    );

  /* =======================================================
     FINANCIAL INFORMATION
  ======================================================= */

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

  /* =======================================================
     STATUS / INFO
  ======================================================= */

  result.info =
    emptyIfNull(record.info);

  /*
    Position Name was not part of the Supabase import.
  */
  result.position_name = "";

  /* =======================================================
     YEAR FIELDS

     IMPORTANT:
     client_master uses the original Excel spelling
     for some columns.
  ======================================================= */

  result.acquired_year =
    emptyIfNull(
      record.aquired_year
    );

  result.allotment_year =
    emptyIfNull(
      record.allotment_year
    );

  /*
    Excel "Joining Date" was imported into
    client_master.joining_date.

    The old API expected joining_year.
  */
  result.joining_year =
    normalizeDate(
      record.joining_date
    );

  /*
    Excel "Bill Date Year" was imported into
    client_master.bill_date_year.
  */
  result.bill_year =
    emptyIfNull(
      record.bill_date_year
    );

  /*
    Excel "Recived Year" was imported into
    client_master.recived_year.
  */
  result.received_year =
    emptyIfNull(
      record.recived_year
    );

  /*
    Excel "Paid Date" was imported into
    client_master.paid_date.
  */
  result.paid_year =
    normalizeDate(
      record.paid_date
    );

  /* =======================================================
     TIMESTAMPS
  ======================================================= */

  result.created_at =
    emptyIfNull(record.created_at);

  result.updated_at =
    emptyIfNull(record.updated_at);

  return result;
}

/* =========================================================
   GET ALL SUPABASE RECORDS

   Fetches records in batches.

   This is important because:
   6,378 records > common 1,000-row API limit.
========================================================= */

async function getAllSupabaseRecords() {
  const allRecords = [];

  let from = 0;

  while (true) {
    const to =
      from + BATCH_SIZE - 1;

    console.log(
      `Fetching Supabase records ${from} - ${to}`
    );

    const {
      data,
      error
    } = await supabase
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

    /*
      If fewer than BATCH_SIZE were returned,
      this was the last batch.
    */
    if (
      data.length < BATCH_SIZE
    ) {
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

async function getLedgerRecords(
  req,
  res
) {
  try {
    console.log(
      "GET /api/ledger"
    );

    const supabaseRecords =
      await getAllSupabaseRecords();

    const records =
      supabaseRecords.map(
        mapSupabaseRecord
      );

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

    return res.status(500).json({
      success: false,
      message:
        "Unable to load ledger records",
      error:
        error?.message ||
        "Unknown error"
    });
  }
}

/* =========================================================
   GET SINGLE LEDGER RECORD
   GET /api/ledger/:id
========================================================= */

async function getLedgerRecordById(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Ledger record ID is required"
      });
    }

    console.log(
      "GET /api/ledger/:id",
      id
    );

    const {
      data,
      error
    } = await supabase
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
        message:
          "Ledger record not found"
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

    return res.status(500).json({
      success: false,
      message:
        "Unable to load ledger record",
      error:
        error?.message ||
        "Unknown error"
    });
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  getLedgerRecords,
  getLedgerRecordById
};