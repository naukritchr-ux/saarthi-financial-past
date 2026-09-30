const XLSX = require("xlsx");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const db = require("../config/database");


// ======================================================
// Excel File
// ======================================================

const excelPath = path.join(
  __dirname,
  "../../data/enquiry sheet  old.xlsx"
);


// ======================================================
// Supabase
// ======================================================

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;


if (!SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL environment variable is missing."
  );
}


if (!SUPABASE_SECRET_KEY) {
  throw new Error(
    "SUPABASE_SECRET_KEY environment variable is missing."
  );
}


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
  );


// ======================================================
// Helper Functions
// ======================================================


// ------------------------------------------------------
// Clean String
// ------------------------------------------------------

function cleanString(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const text =
    String(value).trim();

  return text === ""
    ? null
    : text;
}


// ------------------------------------------------------
// Clean Number
// ------------------------------------------------------

function cleanNumber(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {

    return Number.isFinite(value)
      ? value
      : 0;
  }

  const cleaned =
    String(value)
      .replace(/,/g, "")
      .replace(/[₹$]/g, "")
      .trim();

  if (cleaned === "") {
    return 0;
  }

  const number =
    Number(cleaned);

  return Number.isNaN(number)
    ? 0
    : number;
}


// ------------------------------------------------------
// Clean Employees
// ------------------------------------------------------
//
// Examples:
//
// 50-75   -> 50
// 100-150 -> 100
// 500+    -> 500
//
// ------------------------------------------------------

function cleanEmployees(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {

    return Number.isFinite(value)
      ? Math.round(value)
      : null;
  }

  const text =
    String(value).trim();

  if (text === "") {
    return null;
  }

  const match =
    text.match(/\d+/);

  if (!match) {
    return null;
  }

  return Number(match[0]);
}


// ------------------------------------------------------
// Validate Date
// ------------------------------------------------------

function isValidDateParts(
  year,
  month,
  day
) {

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  if (
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }


  // ----------------------------------------------------
  // Make sure the actual calendar date exists
  // ----------------------------------------------------

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}


// ------------------------------------------------------
// Clean Date
// ------------------------------------------------------
//
// Supabase DATE format:
//
// YYYY-MM-DD
//
// Handles:
//
// - Excel serial dates
// - JavaScript Date
// - DD/MM/YYYY
// - DD-MM-YYYY
// - YYYY-MM-DD
// - invalid/empty Excel dates
//
// Invalid dates become NULL.
//
// ------------------------------------------------------

function cleanDate(value) {

  // ----------------------------------------------------
  // Empty value
  // ----------------------------------------------------

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }


  // ----------------------------------------------------
  // Excel serial date
  // ----------------------------------------------------

  if (typeof value === "number") {

    // Excel 0 / negative values are invalid
    if (value <= 0) {
      return null;
    }

    const parsed =
      XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    const year =
      Number(parsed.y);

    const month =
      Number(parsed.m);

    const day =
      Number(parsed.d);

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return (
      `${year}-` +
      `${String(month).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  }


  // ----------------------------------------------------
  // JavaScript Date
  // ----------------------------------------------------

  if (value instanceof Date) {

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    const year =
      value.getFullYear();

    const month =
      value.getMonth() + 1;

    const day =
      value.getDate();

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return (
      `${year}-` +
      `${String(month).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  }


  // ----------------------------------------------------
  // String value
  // ----------------------------------------------------

  const text =
    String(value).trim();

  if (
    text === "" ||
    text === "0" ||
    text === "00" ||
    text.toLowerCase() === "null" ||
    text.toLowerCase() === "undefined" ||
    text.toLowerCase() === "n/a" ||
    text.toLowerCase() === "na"
  ) {
    return null;
  }


  // ----------------------------------------------------
  // Invalid zero dates
  // ----------------------------------------------------

  if (
    text.includes("1900-01-00") ||
    text.includes("00/00/1900") ||
    text.includes("00-00-1900") ||
    text.includes("00/01/1900") ||
    text.includes("00-01-1900")
  ) {
    return null;
  }


  // ----------------------------------------------------
  // DD/MM/YYYY
  // ----------------------------------------------------

  let match =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (match) {

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return (
      `${year}-` +
      `${String(month).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  }


  // ----------------------------------------------------
  // DD-MM-YYYY
  // ----------------------------------------------------

  match =
    text.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );

  if (match) {

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return (
      `${year}-` +
      `${String(month).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  }


  // ----------------------------------------------------
  // YYYY-MM-DD
  // ----------------------------------------------------

  match =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (match) {

    const year =
      Number(match[1]);

    const month =
      Number(match[2]);

    const day =
      Number(match[3]);

    if (
      !isValidDateParts(
        year,
        month,
        day
      )
    ) {
      return null;
    }

    return (
      `${year}-` +
      `${String(month).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  }


  // ----------------------------------------------------
  // Fallback parser
  // ----------------------------------------------------

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  const day =
    date.getDate();

  if (
    !isValidDateParts(
      year,
      month,
      day
    )
  ) {
    return null;
  }

  return (
    `${year}-` +
    `${String(month).padStart(2, "0")}-` +
    `${String(day).padStart(2, "0")}`
  );
}


// ------------------------------------------------------
// Clean Financial Year
// ------------------------------------------------------
//
// Examples:
//
// 2022-2023 -> 2022
// 2023-2024 -> 2023
// 2024      -> 2024
// 0         -> NULL
//
// ------------------------------------------------------

function cleanYear(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (
    text === "" ||
    text === "0"
  ) {
    return null;
  }


  // ----------------------------------------------------
  // Find first four-digit year
  // ----------------------------------------------------

  const match =
    text.match(/\d{4}/);

  if (match) {

    const year =
      Number(match[0]);

    return year === 0
      ? null
      : year;
  }


  const number =
    Number(text);

  if (
    Number.isNaN(number) ||
    number === 0
  ) {
    return null;
  }

  return number;
}


// ======================================================
// Convert Excel Row -> Supabase Row
// ======================================================

function convertToSupabaseRow(row) {

  return {

    company_name:
      cleanString(
        row["Company Name"]
      ),

    tann:
      cleanString(
        row["TANN"]
      ),

    client_status:
      cleanString(
        row["Client Status"]
      ),

    bd_member:
      cleanString(
        row["BD Member"]
      ),

    team_leader:
      cleanString(
        row["Team Leader"]
      ),

    franchise_name:
      cleanString(
        row["Franchise Name"]
      ),

    industry:
      cleanString(
        row["Industry"]
      ),

    sub_industry:
      cleanString(
        row["Sub Industry"]
      ),

    city:
      cleanString(
        row["City"]
      ),

    gst_number:
      cleanString(
        row["GSTNumber"]
      ),

    no_of_employees:
      cleanEmployees(
        row["No Of Employees"]
      ),

    date_client_acquired:
      cleanDate(
        row["Date Client Acquired"]
      ),

    date_of_allocation:
      cleanDate(
        row["Date of Allocation"]
      ),

    date_of_reallocation:
      cleanDate(
        row["Date of Reallocation"]
      ),

    placement_fees:
      cleanNumber(
        row["Placement Fees"]
      ),

    salary_from:
      cleanNumber(
        row["Salary From"]
      ),

    salary_offered:
      cleanNumber(
        row["Salary Offered"]
      ),

    date_of_joining:
      cleanDate(
        row["Date of Joining"]
      ),

    bill_date:
      cleanDate(
        row["Bill Date"]
      ),

    bill_number:
      cleanString(
        row["Bill Number"]
      ),

    service_charges:
      cleanNumber(
        row["Service Charges"]
      ),

    total_bill_amount:
      cleanNumber(
        row["Total Bill Amount"]
      ),

    date_received:
      cleanDate(
        row["Date Received"]
      ),

    amount_received:
      cleanNumber(
        row["Amount Received"]
      ),

    franchisee_share:
      cleanNumber(
        row["Franchisee Share"]
      ),

    paid_on_date:
      cleanDate(
        row["Paid On Date"]
      ),

    soa_no:
      cleanString(
        row["SOA No"]
      ),

    info:
      cleanString(
        row["Info"]
      ),

    aquired_year:
      cleanYear(
        row["Aquired Year"]
      ),

    allotment_year:
      cleanYear(
        row["Allotment Year"]
      ),

    joining_date:
      cleanDate(
        row["Joining Date"]
      ),

    bill_date_year:
      cleanYear(
        row["Bill Date Year"]
      ),

    recived_year:
      cleanYear(
        row["Recived  Year"]
      ),

    paid_date:
      cleanDate(
        row["Paid Date"]
      )
  };
}


// ======================================================
// Import Into Supabase
// ======================================================

async function importIntoSupabase(rows) {

  console.log(
    "\n================================="
  );

  console.log(
    "SUPABASE CLIENT MASTER IMPORT"
  );

  console.log(
    "=================================\n"
  );


  // ====================================================
  // Check Existing Records
  // ====================================================

  const {
    count,
    error: countError
  } =
    await supabase
      .from("client_master")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      );


  if (countError) {

    throw new Error(
      `Unable to check Supabase client_master: ${countError.message}`
    );
  }


  console.log(
    `Existing Supabase client_master records: ${count || 0}`
  );


  // ====================================================
  // Prevent Duplicate Import
  // ====================================================

  if (
    count &&
    count > 0
  ) {

    throw new Error(
      `Supabase client_master already contains ${count} records. Import stopped to prevent duplicate records.`
    );
  }


  // ====================================================
  // Convert Rows
  // ====================================================

  console.log(
    "\nPreparing records for Supabase..."
  );


  const supabaseRows =
    rows.map(
      convertToSupabaseRow
    );


  console.log(
    `Prepared ${supabaseRows.length} records.`
  );


  // ====================================================
  // Batch Insert
  // ====================================================

  const batchSize = 500;

  let imported = 0;


  for (
    let i = 0;
    i < supabaseRows.length;
    i += batchSize
  ) {

    const batch =
      supabaseRows.slice(
        i,
        i + batchSize
      );


    const {
      error
    } =
      await supabase
        .from("client_master")
        .insert(batch);


    if (error) {

      throw new Error(
        `Supabase insert failed at records ${i + 1}-${i + batch.length}: ${error.message}`
      );
    }


    imported +=
      batch.length;


    console.log(
      `Supabase imported ${imported} / ${supabaseRows.length}`
    );
  }


  // ====================================================
  // Verify Count
  // ====================================================

  const {
    count: finalCount,
    error: verifyError
  } =
    await supabase
      .from("client_master")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      );


  if (verifyError) {

    throw new Error(
      `Supabase verification failed: ${verifyError.message}`
    );
  }


  console.log(
    `\nSupabase client_master final count: ${finalCount}`
  );


  if (
    finalCount !== rows.length
  ) {

    throw new Error(
      `Supabase count mismatch. Excel: ${rows.length}, Supabase: ${finalCount}`
    );
  }


  console.log(
    "\nSUPABASE IMPORT SUCCESS"
  );
}


// ======================================================
// Import Excel
// ======================================================

async function importExcel() {

  console.log(
    "\n================================="
  );

  console.log(
    "TCHR EXCEL IMPORT"
  );

  console.log(
    "=================================\n"
  );


  // ====================================================
  // Read Excel
  // ====================================================

  console.log(
    "Reading Excel file:"
  );

  console.log(
    excelPath
  );


  const workbook =
    XLSX.readFile(
      excelPath,
      {
        cellDates: true
      }
    );


  // ====================================================
  // Available Sheets
  // ====================================================

  console.log(
    "\nAvailable sheets:"
  );

  console.log(
    workbook.SheetNames
  );


  // ====================================================
  // Master Sheet
  // ====================================================

  const sheetName =
    "master final enquiry sheet";


  if (
    !workbook.SheetNames.includes(
      sheetName
    )
  ) {

    throw new Error(
      `Sheet "${sheetName}" not found`
    );
  }


  const worksheet =
    workbook.Sheets[sheetName];


  // ====================================================
  // Excel -> JSON
  // ====================================================

  const rows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: null
      }
    );


  console.log(
    `\nTotal Excel records: ${rows.length}`
  );


  if (
    rows.length === 0
  ) {

    throw new Error(
      "Excel sheet contains no records."
    );
  }


  // ====================================================
  // Detect Headers
  // ====================================================

  const headers =
    Object.keys(rows[0]);


  console.log(
    "\nExcel Headers:"
  );

  console.log(
    headers
  );


  // ====================================================
  // Required Excel Columns
  // ====================================================

  const requiredColumns = [

    "Company Name",
    "TANN",
    "Client Status",

    "BD Member",
    "Team Leader",
    "Franchise Name",

    "Industry",
    "Sub Industry",
    "City",

    "GSTNumber",
    "No Of Employees",

    "Date Client Acquired",
    "Date of Allocation",
    "Date of Reallocation",

    "Placement Fees",
    "Salary From",
    "Salary Offered",

    "Date of Joining",

    "Bill Date",
    "Bill Number",

    "Service Charges",
    "Total Bill Amount",

    "Date Received",
    "Amount Received",

    "Franchisee Share",

    "Paid On Date",

    "SOA No",
    "Info",

    "Aquired Year",
    "Allotment Year",
    "Joining Date",

    "Bill Date Year",

    "Recived  Year",
    "Paid Date"

  ];


  const missingColumns =
    requiredColumns.filter(
      column =>
        !headers.includes(column)
    );


  if (
    missingColumns.length > 0
  ) {

    throw new Error(
      `Missing Excel columns: ${missingColumns.join(", ")}`
    );
  }


  console.log(
    "\nAll required Excel columns found successfully."
  );


  // ====================================================
  // SUPABASE IMPORT
  // ====================================================

  await importIntoSupabase(
    rows
  );


  // ====================================================
  // Existing MySQL Import
  // ====================================================

  const connection =
    await db.getConnection();


  try {

    // ==================================================
    // Begin Transaction
    // ==================================================

    await connection.beginTransaction();


    // ==================================================
    // Remove Existing Records
    // ==================================================

    console.log(
      "\nRemoving previous imported data from ledger_records..."
    );


    await connection.query(
      "TRUNCATE TABLE ledger_records"
    );


    // ==================================================
    // Import Records
    // ==================================================

    let imported = 0;


    for (
      const row of rows
    ) {

      const values = [

        // 1
        cleanString(
          row["Company Name"]
        ),

        // 2
        cleanString(
          row["TANN"]
        ),

        // 3
        cleanString(
          row["TDS"] ?? null
        ),

        // 4
        cleanString(
          row["Client Status"]
        ),

        // 5
        cleanString(
          row["BD Member"]
        ),

        // 6
        cleanString(
          row["Team Leader"]
        ),

        // 7
        cleanString(
          row["Franchise Name"]
        ),

        // 8
        cleanString(
          row["Industry"]
        ),

        // 9
        cleanString(
          row["Sub Industry"]
        ),

        // 10
        cleanString(
          row["City"]
        ),

        // 11
        cleanString(
          row["GSTNumber"]
        ),

        // 12
        cleanEmployees(
          row["No Of Employees"]
        ),

        // 13
        cleanDate(
          row["Date Client Acquired"]
        ),

        // 14
        cleanDate(
          row["Date of Allocation"]
        ),

        // 15
        cleanDate(
          row["Date of Reallocation"]
        ),

        // 16
        cleanNumber(
          row["Placement Fees"]
        ),

        // 17
        cleanNumber(
          row["Salary From"]
        ),

        // 18
        cleanNumber(
          row["Salary Offered"]
        ),

        // 19
        cleanDate(
          row["Date of Joining"]
        ),

        // 20
        cleanDate(
          row["Bill Date"]
        ),

        // 21
        cleanString(
          row["Bill Number"]
        ),

        // 22
        cleanNumber(
          row["Service Charges"]
        ),

        // 23
        cleanNumber(
          row["Total Bill Amount"]
        ),

        // 24
        cleanDate(
          row["Date Received"]
        ),

        // 25
        cleanNumber(
          row["Amount Received"]
        ),

        // 26
        cleanNumber(
          row["Franchisee Share"]
        ),

        // 27
        cleanDate(
          row["Paid On Date"]
        ),

        // 28
        cleanString(
          row["SOA No"]
        ),

        // 29
        cleanString(
          row["Info"]
        ),

        // 30
        cleanString(
          row["Position Name"] ?? null
        ),

        // 31
        cleanYear(
          row["Aquired Year"]
        ),

        // 32
        cleanYear(
          row["Allotment Year"]
        ),

        // 33
        cleanYear(
          row["Joining Date"]
        ),

        // 34
        cleanYear(
          row["Bill Date Year"]
        ),

        // 35
        cleanYear(
          row["Recived  Year"]
        ),

        // 36
        cleanYear(
          row["Paid Date"]
        )

      ];


      // =================================================
      // Safety Check
      // =================================================

      if (
        values.length !== 36
      ) {

        throw new Error(
          `Column/value mismatch at Excel row ${imported + 2}. Expected 36 values but received ${values.length}.`
        );
      }


      // =================================================
      // Generate SQL Placeholders
      // =================================================

      const placeholders =
        values
          .map(() => "?")
          .join(", ");


      // =================================================
      // SQL
      // =================================================

      const sql = `

        INSERT INTO ledger_records (

          company_name,
          tann,
          tds,
          client_status,

          bd_member,
          team_leader,
          franchise_name,

          industry,
          sub_industry,
          city,

          gst_number,
          no_of_employees,

          date_client_acquired,
          date_of_allocation,
          date_of_reallocation,

          placement_fees,
          salary_from,
          salary_offered,

          date_of_joining,

          bill_date,
          bill_number,

          service_charges,
          total_bill_amount,

          date_received,
          amount_received,

          franchisee_share,

          paid_on_date,

          soa_no,
          info,
          position_name,

          acquired_year,
          allotment_year,
          joining_year,

          bill_year,

          received_year,
          paid_year

        )

        VALUES (
          ${placeholders}
        )

      `;


      // =================================================
      // Insert
      // =================================================

      await connection.query(
        sql,
        values
      );


      imported++;


      // =================================================
      // Progress
      // =================================================

      if (
        imported % 500 === 0
      ) {

        console.log(
          `MySQL imported ${imported} / ${rows.length}`
        );
      }

    }


    // ==================================================
    // Commit
    // ==================================================

    await connection.commit();


    console.log(
      "\n================================="
    );

    console.log(
      `MYSQL SUCCESS: ${imported} records imported`
    );

    console.log(
      "=================================\n"
    );


  } catch (error) {

    // ==================================================
    // Rollback
    // ==================================================

    await connection.rollback();


    console.error(
      "\nMYSQL IMPORT FAILED"
    );

    console.error(
      error
    );


    throw error;

  } finally {

    connection.release();

  }


  // ====================================================
  // Final Success
  // ====================================================

  console.log(
    "\n================================="
  );

  console.log(
    `TOTAL EXCEL RECORDS: ${rows.length}`
  );

  console.log(
    "SUPABASE: client_master"
  );

  console.log(
    "MYSQL: ledger_records"
  );

  console.log(
    "EXCEL IMPORT COMPLETED SUCCESSFULLY"
  );

  console.log(
    "=================================\n"
  );
}


// ======================================================
// Export
// ======================================================

module.exports = {
  importExcel
};