const { put, get } = require("@vercel/blob");

const REVENUE_BLOB_PATH = "revenue/tchr-revenue-data.json";

async function getRevenueData(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Revenue controller is working",
      tokenConfigured: Boolean(
        process.env.BLOB_READ_WRITE_TOKEN
      ),
      blobPackageLoaded: Boolean(put && get),
    });
  } catch (error) {
    console.error("REVENUE TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

async function saveRevenueData(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Revenue POST controller is working",
      tokenConfigured: Boolean(
        process.env.BLOB_READ_WRITE_TOKEN
      ),
      blobPackageLoaded: Boolean(put && get),
    });
  } catch (error) {
    console.error("REVENUE POST TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

module.exports = {
  getRevenueData,
  saveRevenueData,
};