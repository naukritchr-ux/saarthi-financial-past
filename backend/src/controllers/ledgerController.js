const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

/* =========================================================
   EXCEL FILE PATH
   Exact file:
   C:\TCHR Project\backend\data\enquiry sheet  old.xlsx
========================================================= */

const BACKEND_ROOT = path.resolve(__dirname, "../..");

const EXCEL_FILE = path.join(
  BACKEND_ROOT,
  "data",
  "enquiry sheet  old.xlsx"
);

console.log("BACKEND ROOT:", BACKEND_ROOT);
console.log("EXCEL FILE:", EXCEL_FILE);


/* =========================================================
   EXCEL COLUMN MAPPING
========================================================= */

const COLUMN_MAP = {
  "Company Name": "company_name",
  "TANN": "tann",
  "Client Status": "client_status",
  "BD Member": "bd_member",
  "Team Leader": "team_leader",
  "Franchise Name": "franchise_name",
  "Industry": "industry",
  "Sub Industry": "sub_industry",
  "City": "city",
  "GSTNumber": "gst_number",
  "No Of Employees": "no_of_employees",
  "Date Client Acquired": "date_client_acquired",
  "Date of Allocation": "date_of_allocation",
  "Date of Reallocation": "date_of_reallocation",
  "Placement Fees": "placement_fees",
  "Salary From": "salary_from",
  "Salary Offered": "salary_offered",
  "Date of Joining": "date_of_joining",
  "Bill Date": "bill_date",
  "Bill Number": "bill_number",
  "Service Charges": "service_charges",
  "Total Bill Amount": "total_bill_amount",
  "Date Received": "date_received",
  "Amount Received": "amount_received",
  "Franchisee Share": "franchisee_share",
  "Paid On Date": "paid_on_date",
  "SOA No": "soa_no",
  "Info": "info",
  "Aquired Year": "acquired_year",
  "Allotment Year": "allotment_year",
  "Joining Date": "joining_year",
  "Bill Date Year": "bill_year",
  "Recived Year": "received_year",
  "Paid Date": "paid_year"
};


/* =========================================================
   HEADER NORMALIZATION
========================================================= */

function normalizeHeader(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


/* =========================================================
   NORMALIZED COLUMN MAP
========================================================= */

const NORMALIZED_COLUMN_MAP = {};

Object.keys(COLUMN_MAP).forEach((excelColumn) => {
  NORMALIZED_COLUMN_MAP[normalizeHeader(excelColumn)] =
    COLUMN_MAP[excelColumn];
});


/* =========================================================
   DATE FIELDS
========================================================= */

const DATE_FIELDS = [
  "date_client_acquired",
  "date_of_allocation",
  "date_of_reallocation",
  "date_of_joining",
  "bill_date",
  "date_received",
  "paid_on_date"
];


/* =========================================================
   NUMBER FIELDS
========================================================= */

const NUMBER_FIELDS = [
  "no_of_employees",
  "placement_fees",
  "salary_from",
  "salary_offered",
  "service_charges",
  "total_bill_amount",
  "amount_received",
  "franchisee_share"
];


/* =========================================================
   DEFAULT RECORD
========================================================= */

function createEmptyRecord() {
  return {
    id: "",
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
   DATE NORMALIZATION
========================================================= */

function normalizeDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  /* Excel serial date */
  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);

    if (excelDate) {
      const year = String(excelDate.y).padStart(4, "0");
      const month = String(excelDate.m).padStart(2, "0");
      const day = String(excelDate.d).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return "";
  }

  /* YYYY-MM-DD */
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(stringValue)) {
    const parts = stringValue.split("-");

    return `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(
      parts[2]
    ).padStart(2, "0")}`;
  }

  /* DD/MM/YYYY */
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(stringValue)) {
    const parts = stringValue.split("/");

    return `${parts[2]}-${String(parts[1]).padStart(2, "0")}-${String(
      parts[0]
    ).padStart(2, "0")}`;
  }

  /* DD-MM-YYYY */
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(stringValue)) {
    const parts = stringValue.split("-");

    return `${parts[2]}-${String(parts[1]).padStart(2, "0")}-${String(
      parts[0]
    ).padStart(2, "0")}`;
  }

  /* JavaScript Date */
  const parsedDate = new Date(stringValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return stringValue;
}


/* =========================================================
   NUMBER NORMALIZATION
========================================================= */

function normalizeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "number") {
    return value;
  }

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim();

  if (!cleaned) {
    return "";
  }

  const numberValue = Number(cleaned);

  if (!Number.isNaN(numberValue)) {
    return numberValue;
  }

  return value;
}


/* =========================================================
   NORMALIZE EXCEL ROW
========================================================= */

function normalizeRow(excelRow, index) {
  const record = createEmptyRecord();

  record.id = index + 1;

  Object.keys(excelRow).forEach((originalHeader) => {
    const normalizedHeader =
      normalizeHeader(originalHeader);

    const fieldName =
      NORMALIZED_COLUMN_MAP[normalizedHeader];

    if (!fieldName) {
      return;
    }

    let value = excelRow[originalHeader];

    if (DATE_FIELDS.includes(fieldName)) {
      value = normalizeDate(value);
    }

    if (NUMBER_FIELDS.includes(fieldName)) {
      value = normalizeNumber(value);
    }

    if (
      value !== null &&
      value !== undefined &&
      typeof value === "string"
    ) {
      value = value.trim();
    }

    record[fieldName] = value;
  });

  return record;
}


/* =========================================================
   READ EXCEL DATA
========================================================= */

function readExcelData() {
  try {
    if (!fs.existsSync(EXCEL_FILE)) {
      throw new Error(
        `Excel file not found: ${EXCEL_FILE}`
      );
    }

    const workbook = XLSX.readFile(EXCEL_FILE, {
      cellDates: true
    });

    if (
      !workbook.SheetNames ||
      workbook.SheetNames.length === 0
    ) {
      throw new Error(
        "Excel workbook does not contain any sheets"
      );
    }

    const firstSheetName =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new Error(
        `Unable to read worksheet: ${firstSheetName}`
      );
    }

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: "",
        raw: true
      }
    );

    return rows.map((row, index) =>
      normalizeRow(row, index)
    );
  } catch (error) {
    console.error(
      "READ EXCEL ERROR:",
      error.message
    );

    throw error;
  }
}


/* =========================================================
   GET ALL LEDGER RECORDS
   GET /api/ledger
========================================================= */

async function getLedgerRecords(req, res) {
  try {
    const records = readExcelData();

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
      message: "Unable to load ledger records",
      error: error.message
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

    const records = readExcelData();

    const record = records.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Ledger record not found"
      });
    }

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
      message: "Unable to load ledger record",
      error: error.message
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