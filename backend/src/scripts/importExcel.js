const {
  importExcel
} = require("../services/excelImportService");


async function run() {

  try {

    await importExcel();

    console.log(
      "Excel import completed successfully."
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "Excel import failed."
    );

    process.exit(1);

  }

}


run();