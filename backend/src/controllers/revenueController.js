const { put, get } = require("@vercel/blob");

const REVENUE_BLOB_PATH =
  "revenue/tchr-revenue-data.json";

/* =========================
   GET REVENUE DATA
========================= */

async function getRevenueData(req, res) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is not configured in Vercel."
      );
    }

    const result = await get(
      REVENUE_BLOB_PATH,
      {
        access: "private",
        useCache: false,
      }
    );

    /*
      Blob does not exist yet.
    */
    if (!result) {
      return res.status(200).json({
        success: true,
        data: null,
        exists: false,
      });
    }

    /*
      Read the private Blob stream.
    */
    const text = await new Response(
      result.stream
    ).text();

    if (!text) {
      return res.status(200).json({
        success: true,
        data: null,
        exists: false,
      });
    }

    const data = JSON.parse(text);

    return res.status(200).json({
      success: true,
      data,
      exists: true,
      updatedAt: data.updatedAt || null,
    });
  } catch (error) {
    console.error(
      "GET /api/revenue ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load shared Revenue data.",
      error: error.message,
      code: error.code || null,
    });
  }
}

/* =========================
   SAVE REVENUE DATA
========================= */

async function saveRevenueData(req, res) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is not configured in Vercel."
      );
    }

    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid Revenue data.",
      });
    }

    const dataToSave = {
      revenue: body.revenue || {},
      expenditure: body.expenditure || {},
      salary: body.salary || {},
      incomeTaxPercentage:
        body.incomeTaxPercentage ?? "",
      isSaved: Boolean(body.isSaved),
      updatedAt: new Date().toISOString(),
    };

    const blob = await put(
      REVENUE_BLOB_PATH,
      JSON.stringify(dataToSave),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Revenue data saved successfully.",
      data: dataToSave,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error(
      "POST /api/revenue ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save shared Revenue data.",
      error: error.message,
      code: error.code || null,
    });
  }
}

module.exports = {
  getRevenueData,
  saveRevenueData,
};