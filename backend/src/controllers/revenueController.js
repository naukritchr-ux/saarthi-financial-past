
const { put, list } = require("@vercel/blob");

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
    Find the Revenue blob.
    */
    const result = await list({
      prefix: REVENUE_BLOB_PATH,
      token,
    });

    const blob = result.blobs.find(
      (item) => item.pathname === REVENUE_BLOB_PATH
    );

    /*
    No Revenue file exists yet.
    */
    if (!blob) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: "No Revenue data found yet",
      });
    }

    /*
    Fetch the blob contents using its URL.
    */
    const response = await fetch(blob.url);

    if (!response.ok) {
      throw new Error(
        `Unable to read Revenue blob. HTTP ${response.status}`
      );
    }

    const text = await response.text();

    if (!text) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const parsedData = JSON.parse(text);

    /*
    Support both formats:

    [
      {...}
    ]

    OR

    {
      data: [...]
    }
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
Writes shared Revenue data to Vercel Blob
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

    let incomingData = req.body;

    /*
    Support:

    {
      data: [...]
    }

    OR

    [...]
    */
    if (
      incomingData &&
      !Array.isArray(incomingData) &&
      Array.isArray(incomingData.data)
    ) {
      incomingData = incomingData.data;
    }

    if (!Array.isArray(incomingData)) {
      return res.status(400).json({
        success: false,
        message: "Revenue data must be an array",
      });
    }

    /*
    Store the shared Revenue dataset.
    */
    const payload = JSON.stringify(
      {
        data: incomingData,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    );

    const blob = await put(
      REVENUE_BLOB_PATH,
      payload,
      {
        access: "public",
        token,
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      }
    );

    console.log("==========================================");
    console.log("REVENUE DATA SAVED SUCCESSFULLY");
    console.log("Blob pathname:", blob.pathname);
    console.log("Blob URL:", blob.url);
    console.log("Records:", incomingData.length);
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
