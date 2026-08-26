const XLSX = require("xlsx");
const path = require("path");

const db = require("../config/database");


// ======================================================
// Excel File
// ======================================================

const excelPath = path.join(
  __dirname,
  "../../data/enquiry sheet  old.xlsx"
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

  const text = String(value).trim();

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

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$]/g, "")
    .trim();

  if (cleaned === "") {
    return 0;
  }

  const number = Number(cleaned);

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
// Clean Date
// ------------------------------------------------------

function cleanDate(value) {

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

    const parsed =
      XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    const month =
      String(parsed.m).padStart(2, "0");

    const day =
      String(parsed.d).padStart(2, "0");

    return `${parsed.y}-${month}-${day}`;
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
      String(
        value.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        value.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  // ----------------------------------------------------
  // String date
  // ----------------------------------------------------

  const text =
    String(value).trim();

  if (text === "") {
    return null;
  }

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
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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


  // Financial year
  //
  // Example:
  // 2023-2024
  //
  // Result:
  // 2023

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
// Import Excel
// ======================================================

async function importExcel() {

  console.log("\n=================================");
  console.log("TCHR EXCEL IMPORT");
  console.log("=================================\n");


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
    "TDS",
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
    "Position Name",

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
  // Database Connection
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
      "\nRemoving previous imported data..."
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


      // =================================================
      // Prepare 36 Values
      // =================================================

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
          row["TDS"]
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
          row["Position Name"]
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
      // IMPORTANT FIX
      // =================================================
      //
      // Generate placeholders automatically.
      //
      // This prevents:
      //
      // SQL placeholders != values
      //
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
          `Imported ${imported} / ${rows.length}`
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
      `SUCCESS: ${imported} records imported`
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
      "\nIMPORT FAILED"
    );

    console.error(
      error
    );


    throw error;

  } finally {

    connection.release();

  }

}


// ======================================================
// Export
// ======================================================

module.exports = {
  importExcel
};