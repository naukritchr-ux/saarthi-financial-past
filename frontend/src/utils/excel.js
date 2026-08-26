import * as XLSX from "xlsx";

export function readExcel(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = (event) => {

      try {

        const data = event.target.result;

        const workbook = XLSX.read(data, {
          type: "array"
        });

        const sheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[sheetName];

        const json =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              defval: ""
            }
          );

        resolve(json);

      }
      catch (error) {

        reject(error);

      }

    };

    reader.onerror = reject;

    reader.readAsArrayBuffer(file);

  });

}