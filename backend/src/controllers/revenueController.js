const REVENUE_BLOB_PATH = "revenue/tchr-revenue-data.json";

/*
  We use dynamic import here so this CommonJS backend
  can safely use the current @vercel/blob package.
*/
async function getBlobFunctions() {
  const blob = await import("@vercel/blob");

  return {
    put: blob.put,
    get: blob.get,
  };
}

/* =========================
   GET REVENUE DATA
========================= */

async function getRevenueData(req, res) {
  try {
    const { get } = await getBlobFunctions();

    const result = await get(REVENUE_BLOB_PATH, {
      access: "private",
      useCache: false,
    });

    /*
      No Revenue file has been saved yet.
      This is not an error.
    */
    if (!result || result.statusCode !== 200) {
      return res.status(200).json({
        success: true,
        data: null,
        exists: false,
      });
    }

    /*
      Convert the Blob stream into text.
    */
    const text = await new Response(result.stream).text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Revenue Blob JSON parse error:",
        parseError
      );

      return res.status(500).json({
        success: false,
        message: "Saved Revenue data is corrupted.",
      });
    }

    return res.status(200).json({
      success: true,
      data,
      exists: true,
      updatedAt: data?.updatedAt || null,
    });
  } catch (error) {
    console.error(
      "GET /api/revenue error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load shared Revenue data.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}

/* =========================
   SAVE REVENUE DATA
========================= */

async function saveRevenueData(req, res) {
  try {
    const { put } = await getBlobFunctions();

    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid Revenue data.",
      });
    }

    /*
      Keep the same data structure used by Revenue.jsx.
    */
    const dataToSave = {
      revenue: body.revenue || {},
      expenditure: body.expenditure || {},
      salary: body.salary || {},
      incomeTaxPercentage:
        body.incomeTaxPercentage ?? "",
      isSaved: Boolean(body.isSaved),
      updatedAt: new Date().toISOString(),
    };

    /*
      Save one shared JSON object.

      Same pathname is intentionally used every time.
      allowOverwrite allows Save/Edit to update
      the existing shared Revenue data.
    */
    const blob = await put(
      REVENUE_BLOB_PATH,
      JSON.stringify(dataToSave),
      {
        access: "private",
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Revenue data saved successfully.",
      data: dataToSave,
      pathname: blob.pathname,
      etag: blob.etag,
    });
  } catch (error) {
    console.error(
      "POST /api/revenue error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to save shared Revenue data.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}

module.exports = {
  getRevenueData,
  saveRevenueData,
};