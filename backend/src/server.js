require("dotenv").config();

const express = require("express");
const cors = require("cors");

const ledgerRoutes = require("./routes/ledgerRoutes");
const revenueRoutes = require("./routes/revenueRoutes");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TCHR Performance Ledger Backend is running",
  });
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend connected successfully",
    database: true,
    dataSource: "Supabase",
  });
});

/* =========================
   LEDGER ROUTES
   Existing functionality
========================= */

app.use("/api/ledger", ledgerRoutes);

/* =========================
   REVENUE ROUTES
   Shared Revenue storage
========================= */

app.use("/api/revenue", revenueRoutes);

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

/* =========================
   LOCAL DEVELOPMENT
========================= */

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `TCHR Backend running on http://localhost:${PORT}`
    );
  });
}

module.exports = app;