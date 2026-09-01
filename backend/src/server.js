const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");
const ledgerRoutes = require("./routes/ledgerRoutes");

const app = express();

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// ======================================================
// JSON
// ======================================================

app.use(express.json());

// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TCHR Performance Ledger Backend is running"
  });
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT 1 AS connected"
    );

    res.json({
      success: true,
      message:
        "Backend and MySQL connected successfully",
      database:
        result[0].connected === 1
    });

  } catch (error) {

    console.error(
      "Database connection error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Database connection failed"
    });
  }
});

// ======================================================
// LEDGER API
// ======================================================

app.use(
  "/api/ledger",
  ledgerRoutes
);

// ======================================================
// 404
// ======================================================

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      message:
        "API endpoint not found"
    });

  }
);

// ======================================================
// LOCAL DEVELOPMENT
// ======================================================

if (require.main === module) {

  const PORT =
    process.env.PORT || 5000;

  app.listen(
    PORT,
    () => {

      console.log(
        `TCHR Backend running on http://localhost:${PORT}`
      );

    }
  );

}

// ======================================================
// VERCEL
// ======================================================

module.exports = app;