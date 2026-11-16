
const path = require("path");

// ======================================================
// ENVIRONMENT CONFIGURATION
// ======================================================

// Load backend/.env during local development.
// Vercel uses Environment Variables configured in its dashboard.
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

// ======================================================
// ROUTES
// ======================================================

const ledgerRoutes = require("./routes/ledgerRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const taxReturnSummaryRoutes = require("./routes/taxReturnSummaryRoutes");

// ======================================================
// SUPABASE CONFIGURATION
// ======================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
  supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
  );
} else {
  console.error(
    "Supabase configuration missing. Check SUPABASE_URL and SUPABASE_SECRET_KEY."
  );
}

// ======================================================
// EXPRESS APP
// ======================================================

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Saarthi Financial - Past Backend is running",
  });
});

// ======================================================
// SUPABASE DATABASE HEALTH CHECK
// GET /api/health
// ======================================================

app.get("/api/health", async (req, res) => {
  try {
    // Verify Supabase configuration
    if (!supabase) {
      return res.status(503).json({
        success: false,
        backend: true,
        database: false,
        dataSource: "Supabase",
        message: "Supabase environment variables are missing",
      });
    }

    // Execute a real query against the Ledger table
    const { data, error } = await supabase
      .from("client_master")
      .select("id")
      .limit(1);

    if (error) {
      console.error(
        "SUPABASE HEALTH CHECK ERROR:",
        error.message
      );

      return res.status(503).json({
        success: false,
        backend: true,
        database: false,
        dataSource: "Supabase",
        message: "Supabase database connection failed",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
        checkedAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      backend: true,
      database: true,
      dataSource: "Supabase",
      table: "client_master",
      message: "Supabase database connected successfully",
      checkedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error(
      "DATABASE HEALTH CHECK FAILED:",
      error
    );

    return res.status(503).json({
      success: false,
      backend: true,
      database: false,
      dataSource: "Supabase",
      message: "Unable to verify Supabase connection",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
      checkedAt: new Date().toISOString(),
    });
  }
});

// ======================================================
// LEDGER ROUTES
// ======================================================

app.use("/api/ledger", ledgerRoutes);

// ======================================================
// REVENUE ROUTES
// ======================================================

app.use("/api/revenue", revenueRoutes);

// ======================================================
// TAX RETURN SUMMARY ROUTES
// ======================================================

app.use(
  "/api/tax-return-summary",
  taxReturnSummaryRoutes
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ======================================================
// LOCAL DEVELOPMENT
// ======================================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Saarthi Financial - Past Backend running on port ${PORT}`
    );

    console.log(
      "Supabase configured:",
      Boolean(supabase)
    );
  });
}

// ======================================================
// EXPORT APP
// ======================================================

module.exports = app;
