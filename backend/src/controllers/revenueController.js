const { put, get } = require("@vercel/blob");

const REVENUE_BLOB_PATH = "revenue/tchr-revenue-data.json";

/*
=========================================================
GET REVENUE DATA
Reads the shared Revenue data from Vercel Blob
=========================================================
*/
async function getRevenueData(req, res) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: "BLOB_READ_WRITE_TOKEN is not configured",
      });
    }

    /*
      Find the existing Revenue JSON file.
    */
    const result = await get(REVENUE_BLOB_PATH, {
      access: "private",
      token,
    });

    /*
      If the file does not exist yet, return an empty dataset.
    */
    if (!result) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: "No Revenue data found yet",
      });
    }

    /*
      Vercel Blob returns the file body as a stream.
      Convert it to text and then JSON.
    */
    const text = await result.blob.text();

    if (!text) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const parsedData = JSON.parse(text);

    /*
      Support both:
        - directly stored array
        - { data: [...] }
    */
    const data = Array.isArray(parsedData)
      ? parsedData
      : Array.isArray(parsedData.data)
      ? parsedData.data
      : [];

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("==========================================");
    console.error("GET REVENUE DATA ERROR");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("==========================================");

    /*
      If the Blob file does not exist yet, start with [].
    */
    if (
      error.message &&
      (
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("blob not found")
      )
    ) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: "No Revenue data found yet",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to load Revenue data",
      error: error.message,
    });
  }
}

/*
=========================================================
SAVE REVENUE DATA
Writes the shared Revenue data to Vercel Blob
=========================================================
*/
async function saveRevenueData(req, res) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: "BLOB_READ_WRITE_TOKEN is not configured",
      });
    }

    /*
      The frontend should send the Revenue data
      in req.body.
    */
    let incomingData = req.body;

    /*
      Support:
        { data: [...] }
      or
        [...]
    */
    if (
      incomingData &&
      !Array.isArray(incomingData) &&
      Array.isArray(incomingData.data)
    ) {
      incomingData = incomingData.data;
    }

    /*
      Revenue data must be an array.
    */
    if (!Array.isArray(incomingData)) {
      return res.status(400).json({
        success: false,
        message: "Revenue data must be an array",
      });
    }

    /*
      Save the complete shared dataset.
    */
    const payload = JSON.stringify(
      {
        data: incomingData,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    );

    /*
      Write/update the same Blob path every time.
      This makes the data shared between users.
    */
    const blob = await put(REVENUE_BLOB_PATH, payload, {
      access: "private",
      token,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    console.log("==========================================");
    console.log("REVENUE DATA SAVED");
    console.log("Blob path:", REVENUE_BLOB_PATH);
    console.log("Records:", incomingData.length);
    console.log("Blob URL:", blob.url);
    console.log("==========================================");

    return res.status(200).json({
      success: true,
      message: "Revenue data saved successfully",
      data: incomingData,
      count: incomingData.length,
    });
  } catch (error) {
    console.error("==========================================");
    console.error("SAVE REVENUE DATA ERROR");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("==========================================");

    return res.status(500).json({
      success: false,
      message: "Unable to save Revenue data",
      error: error.message,
    });
  }
}

module.exports = {
  getRevenueData,
  saveRevenueData,
};

