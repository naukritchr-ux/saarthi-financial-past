const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(
  __dirname,
  "../../data/enquiry sheet  old.xlsx"
);

const workbook = XLSX.readFile(filePath, {
  cellDates: true
});

console.log("\nSHEETS:");
console.log(workbook.SheetNames);

const sheetName = workbook.SheetNames[0];

const worksheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(
  worksheet,
  {
    defval: null
  }
);

console.log("\nROW COUNT:");
console.log(rows.length);

console.log("\nACTUAL HEADERS:");
console.log(
  Object.keys(rows[0] || {})
);

console.log("\nFIRST ROW:");
console.dir(
  rows[0],
  {
    depth: null
  }
);