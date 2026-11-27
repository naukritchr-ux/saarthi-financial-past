import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./TaxReturnSummary.css";

const TAX_RETURN_API_URL = "/api/tax-return-summary";

const FINANCIAL_YEARS = [
  { financialYear: "2007-08", assessmentYear: "2008-09" },
  { financialYear: "2008-09", assessmentYear: "2009-10" },
  { financialYear: "2009-10", assessmentYear: "2010-11" },
  { financialYear: "2010-11", assessmentYear: "2011-12" },
  { financialYear: "2011-12", assessmentYear: "2012-13" },
  { financialYear: "2012-13", assessmentYear: "2013-14" },
  { financialYear: "2013-14", assessmentYear: "2014-15" },
  { financialYear: "2014-15", assessmentYear: "2015-16" },
  { financialYear: "2015-16", assessmentYear: "2016-17" },
  { financialYear: "2016-17", assessmentYear: "2017-18" },
  { financialYear: "2017-18", assessmentYear: "2018-19" },
  { financialYear: "2018-19", assessmentYear: "2019-20" },
  { financialYear: "2019-20", assessmentYear: "2020-21" },
  { financialYear: "2020-21", assessmentYear: "2021-22" },
  { financialYear: "2021-22", assessmentYear: "2022-23" },
  { financialYear: "2022-23", assessmentYear: "2023-24" },
  { financialYear: "2023-24", assessmentYear: "2024-25" },
  { financialYear: "2024-25", assessmentYear: "2025-26" },
  { financialYear: "2025-26", assessmentYear: "2026-27" },
  { financialYear: "2026-27", assessmentYear: "2027-28" },
];

const ASSESSMENT_YEARS = FINANCIAL_YEARS.map(x => x.assessmentYear);

const FORM_TYPES = [
  "None", "ITR-1", "ITR-2", "ITR-3", "ITR-4",
  "ITR-5", "ITR-6", "ITR-7", "ITR-U"
];

const FILING_STATUSES = [
  "Draft", "Filed", "Verified", "Processed",
  "Defective", "Revised", "Belated"
];

// Data separation: Talent Corner (company) and Doshi Family (individual / HUF).
const DATA_CATEGORIES = ["Talent Corner", "Doshi Family"];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const INITIAL_FORM = {
  dataCategory: "",
  pan: "",
  financialYear: "",
  assessmentYear: "",
  name: "",
  acknowledgementNumber: "",
  formType: "",
  filingStatus: "",
  itrFilingDate: "",
  grossIncome: "",
  taxPayable: "",
  tdsClaim: "",
  refundProcess: "",
  orderType: "",
  dateOfOrder: "",
  totalAssessedIncome: "",
  totalAssessedTaxPayable: "",
  tdsCredit: "",
  refundAmountBeforeInterest: "",
  interest: "",
};

const num = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Status is determined strictly by the signed difference.
// Negative = Less, Positive = Excess, Zero = Match.
const getFinancialStatus = difference => {
  const value = Number(difference);

  if (!Number.isFinite(value)) return "Pending";
  if (value < 0) return "Less";
  if (value > 0) return "Excess";
  return "Match";
};

const money = value =>
  `₹${num(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const unwrap = result => result?.data ?? result?.record ?? result;

// A taxpayer is identified by PAN when available, otherwise by exact name.
// "Bankim Doshi" and "Bankim J Doshi HUF" are different names, so they stay separate.
const taxpayerKey = record =>
  record.pan?.trim().toUpperCase() ||
  `name:${String(record.name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")}`;

// Return records = every saved entry. Unique taxpayers = distinct taxpayers.
function taxpayerStats(list) {
  const all = new Set(list.map(taxpayerKey));
  const withPan = new Set(
    list.filter(record => record.pan?.trim()).map(taxpayerKey)
  );

  return {
    returnRecords: list.length,
    uniqueTaxpayers: all.size,
    withPan: withPan.size,
    withoutPan: all.size - withPan.size,
  };
}

// Member-wise summary used by the Doshi Family dashboard.
// Build one income figure per unique family member.
// When "All Financial Years" is selected, count one final return per member
// per financial year. A revised return takes precedence over its original
// return so the same year's income is not double-counted.
function memberIncomeSummary(list) {
  const members = new Map();

  list.forEach(record => {
    const key = taxpayerKey(record);
    const financialYear = record.financialYear || "Unknown";
    const member = members.get(key) || {
      key,
      name: record.name,
      pan: record.pan || "",
      returnsByYear: new Map(),
    };

    const current = member.returnsByYear.get(financialYear);
    const isRevised = /revised/i.test(String(record.filingStatus || ""));
    const currentIsRevised = /revised/i.test(
      String(current?.filingStatus || "")
    );

    const recordDate = new Date(
      record.itrFilingDate || record.updatedAt || record.createdAt || 0
    ).getTime() || 0;
    const currentDate = current
      ? new Date(
          current.itrFilingDate ||
          current.updatedAt ||
          current.createdAt ||
          0
        ).getTime() || 0
      : -1;

    const shouldReplace =
      !current ||
      (isRevised && !currentIsRevised) ||
      (isRevised === currentIsRevised && recordDate >= currentDate);

    if (shouldReplace) {
      member.returnsByYear.set(financialYear, record);
    }

    if (!member.pan && record.pan) member.pan = record.pan;
    if (!member.name && record.name) member.name = record.name;

    members.set(key, member);
  });

  return [...members.values()]
    .map(member => {
      const finalReturns = [...member.returnsByYear.values()];

      return {
        key: member.key,
        name: member.name,
        pan: member.pan,
        grossIncome: finalReturns.reduce(
          (total, record) => total + num(record.grossIncome),
          0
        ),
        financialYears: finalReturns.length,
      };
    })
    .sort((a, b) => b.grossIncome - a.grossIncome);
}


// Build the Doshi Family member table from one final return per member per FY.
// Revised returns take precedence over original returns to avoid double-counting.
function memberSummary(list) {
  const grouped = new Map();

  list.forEach(record => {
    const key = taxpayerKey(record);
    const financialYear = record.financialYear || "Unknown";
    const member = grouped.get(key) || {
      key,
      name: record.name || "",
      pan: record.pan || "",
      returnsByYear: new Map(),
    };

    const current = member.returnsByYear.get(financialYear);
    const isRevised = /revised/i.test(String(record.filingStatus || ""));
    const currentIsRevised = /revised/i.test(
      String(current?.filingStatus || "")
    );
    const recordDate = new Date(
      record.itrFilingDate || record.updatedAt || record.createdAt || 0
    ).getTime() || 0;
    const currentDate = current
      ? new Date(
          current.itrFilingDate || current.updatedAt || current.createdAt || 0
        ).getTime() || 0
      : -1;

    const shouldReplace =
      !current ||
      (isRevised && !currentIsRevised) ||
      (isRevised === currentIsRevised && recordDate >= currentDate);

    if (shouldReplace) member.returnsByYear.set(financialYear, record);
    if (!member.name && record.name) member.name = record.name;
    if (!member.pan && record.pan) member.pan = record.pan;
    grouped.set(key, member);
  });

  return [...grouped.values()].map(member => {
    const finalReturns = [...member.returnsByYear.values()];
    return {
      key: member.key,
      name: member.name,
      pan: member.pan,
      returns: finalReturns.length,
      grossIncome: finalReturns.reduce(
        (total, record) => total + num(record.grossIncome), 0
      ),
      taxPayable: finalReturns.reduce(
        (total, record) => total + num(record.taxPayable), 0
      ),
      tdsClaim: finalReturns.reduce(
        (total, record) => total + num(record.tdsClaim), 0
      ),
      refundDue: finalReturns.reduce(
        (total, record) => total + num(record.refundDue), 0
      ),
    };
  }).sort((a, b) => b.grossIncome - a.grossIncome);
}

async function readResponse(response) {
  const type = response.headers.get("content-type") || "";

  if (type.includes("application/json")) {
    return response.json();
  }

  const body = await response.text();

  if (body.trim().startsWith("<")) {
    throw new Error(
      "The API returned HTML instead of JSON. Check the backend URL and proxy configuration."
    );
  }

  throw new Error(body || "Unexpected server response.");
}

function normalizeRecord(record) {
  return {
    id: record.id,
    dataCategory: record.data_category ?? record.dataCategory ?? "",
    pan: record.pan ?? "",
    financialYear:
      record.financial_year ?? record.financialYear ?? "",
    assessmentYear:
      record.assessment_year ?? record.assessmentYear ?? "",
    name: record.name ?? record.taxpayer_name ?? "",
    acknowledgementNumber:
      record.acknowledgement_number ??
      record.acknowledgementNumber ??
      "",
    formType: record.form_type ?? record.formType ?? "",
    filingStatus: record.filing_status ?? record.filingStatus ?? "",
    itrFilingDate:
      record.itr_filing_date ?? record.itrFilingDate ?? "",
    grossIncome: record.gross_income ?? record.grossIncome ?? 0,
    taxPayable: record.tax_payable ?? record.taxPayable ?? 0,
    tdsClaim: record.tds_claim ?? record.tdsClaim ?? 0,
    // Always recalculate from source ITR values so legacy clamped refund_due
    // values do not hide a tax-payable balance.
    refundDue:
      num(record.tds_claim ?? record.tdsClaim ?? 0) -
      num(record.tax_payable ?? record.taxPayable ?? 0),
    refundProcess:
      record.refund_process ?? record.refundProcess ?? "",
    orderType: record.order_type ?? record.orderType ?? "",
    dateOfOrder: record.date_of_order ?? record.dateOfOrder ?? "",
    totalAssessedIncome:
      record.total_assessed_income ??
      record.totalAssessedIncome ??
      record.income_assessment ??
      record.incomeAssessment ??
      0,
    totalAssessedTaxPayable:
      record.total_assessed_tax_payable ??
      record.totalAssessedTaxPayable ??
      record.income_tax ??
      record.incomeTax ??
      0,
    tdsCredit: record.tds_credit ?? record.tdsCredit ?? 0,
    refundAmountBeforeInterest:
      record.refund_amount_before_interest ??
      record.refundAmountBeforeInterest ??
      record.refund_amount ??
      record.refundAmount ??
      0,
    interest: record.interest ?? 0,
    netRefundAmount:
      record.net_refund_amount ??
      record.netRefundAmount ??
      (
        Number(
          record.refund_amount_before_interest ??
          record.refundAmountBeforeInterest ??
          record.refund_amount ??
          record.refundAmount ??
          0
        ) +
        Number(record.interest ?? 0)
      ),
    createdAt: record.created_at ?? record.createdAt ?? "",
    updatedAt: record.updated_at ?? record.updatedAt ?? "",
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function openPrintWindow(title, content, landscape = false) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");

  if (!printWindow) {
    throw new Error(
      "The print window was blocked. Please allow pop-ups for this application and try again."
    );
  }

  const generatedDate = new Date().toLocaleString("en-IN");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4 ${landscape ? "landscape" : "portrait"};
            margin: 14mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #243247;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            background: #ffffff;
          }

          .pdf-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 20px;
            margin-bottom: 22px;
            color: #ffffff;
            background: #172f4d;
            border-bottom: 4px solid #c4a15a;
          }

          .pdf-brand {
            font-size: 19px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .pdf-subtitle {
            margin-top: 3px;
            color: #e8d9b7;
            font-size: 10px;
          }

          .pdf-generated {
            text-align: right;
            color: #ffffff;
            font-size: 9px;
          }

          h2 {
            margin: 20px 0 10px;
            padding-bottom: 7px;
            color: #172f4d;
            font-size: 13px;
            border-bottom: 1px solid #d9c79e;
          }

          .pdf-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px 18px;
          }

          .pdf-field {
            padding: 7px 9px;
            background: #f6f7f9;
            border: 1px solid #e7e9ed;
            border-radius: 3px;
            overflow-wrap: anywhere;
          }

          .pdf-label {
            display: block;
            margin-bottom: 2px;
            color: #657286;
            font-size: 9px;
          }

          .pdf-value {
            color: #172f4d;
            font-size: 11px;
            font-weight: 700;
          }

          .pdf-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }

          .pdf-table th {
            padding: 8px 6px;
            color: #ffffff;
            text-align: left;
            background: #172f4d;
          }

          .pdf-table td {
            padding: 7px 6px;
            border-bottom: 1px solid #e3e6eb;
            vertical-align: top;
          }

          .pdf-table tr:nth-child(even) td {
            background: #f6f7f9;
          }

          .pdf-footer {
            margin-top: 24px;
            padding-top: 8px;
            color: #7b8491;
            font-size: 9px;
            text-align: center;
            border-top: 1px solid #dfe3e8;
          }

          .pdf-note {
            margin-top: 12px;
            color: #6b7280;
            font-size: 9px;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .pdf-header,
            .pdf-table th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <header class="pdf-header">
          <div>
            <div class="pdf-brand">SAARTHI FINANCIAL</div>
            <div class="pdf-subtitle">Tax Return Summary · Tax Ledger</div>
          </div>
          <div class="pdf-generated">
            <strong>${escapeHtml(title)}</strong><br />
            Generated: ${escapeHtml(generatedDate)}
          </div>
        </header>

        ${content}

        <footer class="pdf-footer">
          Saarthi Financial · Tax Return Summary
        </footer>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

function pdfField(label, value) {
  return `
    <div class="pdf-field">
      <span class="pdf-label">${escapeHtml(label)}</span>
      <span class="pdf-value">${escapeHtml(value || "—")}</span>
    </div>
  `;
}

function StatCard({ label, value, note, icon }) {
  return (
    <article className="trs-stat-card">
      <div className="trs-stat-top">
        <span>{label}</span>
        <span className="trs-stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function TaxReturnSummary() {
  const [page, setPage] = useState("dashboard");
  const [form, setForm] = useState(INITIAL_FORM);
  const [allRecords, setAllRecords] = useState([]);
  const [category, setCategory] = useState(DATA_CATEGORIES[0]);
  // Doshi Family: which taxpayer card is open on the Taxpayer Records page.
  const [doshiTaxpayerKey, setDoshiTaxpayerKey] = useState(null);
  const [showHome, setShowHome] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [fyFilter, setFyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reportFY, setReportFY] = useState("all");
  const [reportStatus, setReportStatus] = useState("all");
  const [reportType, setReportType] = useState("all");
  const [reconciliationPage, setReconciliationPage] = useState(0);

  // Every page below reads `records`, which now follows the selected category.
  const records = useMemo(
    () => allRecords.filter(record => record.dataCategory === category),
    [allRecords, category]
  );

  const unclassifiedCount = useMemo(
    () => allRecords.filter(record => !DATA_CATEGORIES.includes(record.dataCategory)).length,
    [allRecords]
  );

  const fieldsDisabled = Boolean(recordId) && !isEditing;

  // Section 2: expected refund = TDS claimed - tax payable.
  // A negative result means tax is still payable; do not force it to zero.
  const refundDue = useMemo(
    () => num(form.tdsClaim) - num(form.taxPayable),
    [form.tdsClaim, form.taxPayable]
  );

  const netRefundAmount = useMemo(
    () =>
      num(form.refundAmountBeforeInterest) +
      num(form.interest),
    [form.refundAmountBeforeInterest, form.interest]
  );

  const differenceIncome = useMemo(
    () => num(form.totalAssessedIncome) - num(form.grossIncome),
    [form.totalAssessedIncome, form.grossIncome]
  );

  const differenceIncomeTax = useMemo(
    () => num(form.totalAssessedTaxPayable) - num(form.taxPayable),
    [form.totalAssessedTaxPayable, form.taxPayable]
  );

  const differenceReturn = useMemo(
    () => refundDue - netRefundAmount,
    [refundDue, netRefundAmount]
  );

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleChange = event => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: name === "pan" ? value.toUpperCase() : value,
    }));

    setMessage("");
  };

  const getDatabasePayload = () => ({
    ...(recordId ? { id: recordId } : {}),
    data_category: form.dataCategory || category,
    pan: form.pan.trim().toUpperCase() || null,
    financial_year: form.financialYear || null,
    assessment_year: form.assessmentYear || null,
    name: form.name.trim(),
    acknowledgement_number: form.acknowledgementNumber.trim(),
    form_type: form.formType || null,
    filing_status: form.filingStatus || null,
    itr_filing_date: form.itrFilingDate || null,
    gross_income: num(form.grossIncome),
    tax_payable: num(form.taxPayable),
    tds_claim: num(form.tdsClaim),
    refund_due: refundDue,
    refund_process: form.refundProcess || null,
    order_type: form.orderType.trim() || null,
    date_of_order: form.dateOfOrder || null,
    income_assessment: num(form.totalAssessedIncome),
    income_tax: num(form.totalAssessedTaxPayable),
    tds_credit: num(form.tdsCredit),
    // Keep the existing database column names so the current API remains compatible.
    refund_amount: num(form.refundAmountBeforeInterest),
    interest: num(form.interest),
    calculated_refund: netRefundAmount,
    difference_income: differenceIncome,
    difference_income_tax: differenceIncomeTax,
    difference_return: differenceReturn,
  });

  // Load all saved taxpayer records.
  const loadAllRecords = async () => {
    setLoading(true);
    setDashboardError("");

    try {
      const response = await fetch(TAX_RETURN_API_URL);
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to load tax return records."
        );
      }

      const payload = unwrap(result);

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.records)
          ? payload.records
          : null;

      if (!list) {
        throw new Error(
          "The list API did not return an array. Add a GET route that returns all tax return records."
        );
      }

      setAllRecords(list.map(normalizeRecord));
    } catch (error) {
      setDashboardError(
        error.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load one exact record using its database ID.
  const loadTaxReturnById = async id => {
    if (!id) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${TAX_RETURN_API_URL}?id=${encodeURIComponent(id)}`
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "Unable to load the selected Tax Return record."
        );
      }

      const record = unwrap(result);

      if (!record || !record.id) {
        throw new Error(
          "The selected Tax Return record was not found."
        );
      }

      const normalized = normalizeRecord(record);

      setRecordId(normalized.id);
      setForm({
        ...INITIAL_FORM,
        ...normalized,
      });
      setIsEditing(false);
    } catch (error) {
      showMessage(
        error.message || "Unable to load data.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllRecords();
  }, []);

  const chooseFinancialYear = event => {
    const financialYear = event.target.value;

    const assessmentYear =
      FINANCIAL_YEARS.find(
        item => item.financialYear === financialYear
      )?.assessmentYear || "";

    setForm({
      ...INITIAL_FORM,
      financialYear,
      assessmentYear,
    });

    setRecordId(null);
    setIsEditing(false);
    setMessage("");
    setMessageType("");
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setRecordId(null);
    setIsEditing(false);
    setMessage("");
    setMessageType("");
  };

  // Switch between Talent Corner and Doshi Family data.
  const switchCategory = nextCategory => {
    if (nextCategory === category) return;

    setCategory(nextCategory);
    setDoshiTaxpayerKey(null);
    resetForm();
    setFyFilter("all");
    setStatusFilter("all");
    setSearch("");
    setReportFY("all");
    setReportStatus("all");
    setReportType("all");
    setShowConfirm(false);
  };

  const handleSave = async () => {
    if (!form.financialYear || !form.assessmentYear) {
      showMessage(
        "Please select Financial Year and Assessment Year.",
        "error"
      );
      setShowConfirm(false);
      return;
    }

    if (!form.name.trim()) {
      showMessage("Please enter the taxpayer name.", "error");
      setShowConfirm(false);
      return;
    }

    if (form.pan.trim() && !PAN_REGEX.test(form.pan.trim().toUpperCase())) {
      showMessage(
        "PAN format is invalid. It should look like ABCDE1234F, or leave it blank.",
        "error"
      );
      setShowConfirm(false);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = getDatabasePayload();

      const response = await fetch(TAX_RETURN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await readResponse(response);

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error ||
          "Unable to save Tax Return Summary."
        );
      }

      await loadAllRecords();

      setForm({ ...INITIAL_FORM });
      setRecordId(null);
      setIsEditing(false);
      setShowConfirm(false);

      showMessage(
        result?.message ||
        "Tax Return Summary saved successfully. You can now enter the next ITR record.",
        "success"
      );
    } catch (error) {
      console.error("Tax Return Save Error:", error);

      showMessage(
        error.message || "Unable to save data.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const editFromTable = async record => {
    setPage("entry");

    if (record.id) {
      await loadTaxReturnById(record.id);
      return;
    }

    // Fallback for legacy rows without a database ID.
    setForm({
      ...INITIAL_FORM,
      ...record,
    });

    setRecordId(null);
    setIsEditing(true);

    showMessage(
      "This record has no database ID. Saving it will create a new record.",
      "error"
    );
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesFY =
        fyFilter === "all" ||
        record.financialYear === fyFilter;

      const matchesStatus =
        statusFilter === "all" ||
        record.filingStatus === statusFilter;

      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        [
          record.name,
          record.pan,
          record.acknowledgementNumber,
          record.financialYear,
          record.assessmentYear,
        ].some(value =>
          String(value || "").toLowerCase().includes(term)
        );

      return matchesFY && matchesStatus && matchesSearch;
    });
  }, [records, fyFilter, statusFilter, search]);

  // Build and open the printable PDF for one saved record.
  const openRecordPdf = savedRecord => {
    const content = `
      <h2>Taxpayer Information</h2>
      <div class="pdf-grid">
        ${pdfField("Category", savedRecord.dataCategory)}
        ${pdfField("Taxpayer Name", savedRecord.name)}
        ${pdfField("PAN", savedRecord.pan)}
        ${pdfField("Financial Year", savedRecord.financialYear)}
        ${pdfField("Assessment Year", savedRecord.assessmentYear)}
        ${pdfField("Acknowledgement Number", savedRecord.acknowledgementNumber)}
        ${pdfField("ITR Form Type", savedRecord.formType)}
        ${pdfField("Filing Status", savedRecord.filingStatus)}
        ${pdfField("ITR Filing Date", savedRecord.itrFilingDate)}
      </div>

      <h2>Income and Tax Details</h2>
      <div class="pdf-grid">
        ${pdfField("Gross Income", money(savedRecord.grossIncome))}
        ${pdfField("Tax Payable", money(savedRecord.taxPayable))}
        ${pdfField("TDS Claimed", money(savedRecord.tdsClaim))}
        ${pdfField("Expected Refund / (Tax Payable)", money(savedRecord.refundDue))}
        ${pdfField("Refund Process", savedRecord.refundProcess)}
      </div>

      <h2>Assessment Details</h2>
      <div class="pdf-grid">
        ${pdfField("Order Type", savedRecord.orderType)}
        ${pdfField("Date of Order", savedRecord.dateOfOrder)}
        ${pdfField("Total Assessed Income", money(savedRecord.totalAssessedIncome))}
        ${pdfField("Total Tax Payable as Assessed", money(savedRecord.totalAssessedTaxPayable))}
        ${pdfField("TDS Credit", money(savedRecord.tdsCredit))}
        ${pdfField("Refund Amount Before Interest", money(savedRecord.refundAmountBeforeInterest))}
        ${pdfField("Interest", money(savedRecord.interest))}
        ${pdfField(
          "Net Refund Amount",
          money(num(savedRecord.refundAmountBeforeInterest) + num(savedRecord.interest))
        )}
      </div>

      <p class="pdf-note">
        This document is generated from the saved Tax Return Summary record.
      </p>
    `;

    try {
      openPrintWindow(
        `Tax Return Summary - ${savedRecord.name || "Taxpayer"}`,
        content,
        false
      );
    } catch (error) {
      showMessage(
        error.message || "Unable to open the PDF print window.",
        "error"
      );
    }
  };

  // Individual PDF uses the saved record from the records list,
  // not any unsaved values currently entered in the form.
  const downloadIndividualPdf = () => {
    if (!recordId) {
      showMessage(
        "Open an existing saved taxpayer record to download its PDF.",
        "error"
      );
      return;
    }

    const savedRecord = records.find(
      record => String(record.id) === String(recordId)
    );

    if (!savedRecord) {
      showMessage(
        "The saved record could not be found. Refresh the records and try again.",
        "error"
      );
      return;
    }

    openRecordPdf(savedRecord);
  };

  // Export only the currently filtered Taxpayer Records.  
  const exportRecordsCsv = () => {
    const headers = [
      "Category",
      "Taxpayer Name",
      "PAN",
      "Financial Year",
      "Assessment Year",
      "Acknowledgement Number",
      "ITR Form Type",
      "Filing Status",
      "Gross Income",
      "Tax Payable",
      "TDS Claimed",
      "Expected Refund / (Tax Payable)",
      "Refund Status",
      "Refund Amount Before Interest"
    ];

    const keys = [
      "dataCategory",
      "name",
      "pan",
      "financialYear",
      "assessmentYear",
      "acknowledgementNumber",
      "formType",
      "filingStatus",
      "grossIncome",
      "taxPayable",
      "tdsClaim",
      "refundDue",
      "refundProcess",
      "refundAmountBeforeInterest"
    ];

    const quote = value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(quote).join(","),
      ...filteredRecords.map(record =>
        keys.map(key => quote(record[key])).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\ufeff", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `tax-return-records-${category.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Do not revoke the URL immediately.
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 30000);
  };


  const downloadRecordsPdf = () => {
    if (!filteredRecords.length) {
      showMessage("There are no records available to export.", "error");
      return;
    }

    const rows = filteredRecords.map(record => `
      <tr>
        <td>${escapeHtml(record.name || "—")}</td>
        <td>${escapeHtml(record.pan || "—")}</td>
        <td>${escapeHtml(record.financialYear || "—")}</td>
        <td>${escapeHtml(record.assessmentYear || "—")}</td>
        <td>${escapeHtml(record.acknowledgementNumber || "—")}</td>
        <td>${escapeHtml(record.formType || "—")}</td>
        <td>${escapeHtml(record.filingStatus || "—")}</td>
        <td>${escapeHtml(money(record.grossIncome))}</td>
        <td>${escapeHtml(money(record.taxPayable))}</td>
        <td>${escapeHtml(money(record.tdsClaim))}</td>
        <td>${escapeHtml(money(record.refundDue))}</td>
      </tr>
    `).join("");

    const stats = taxpayerStats(filteredRecords);

    const content = `
      <h2>Taxpayer Records · ${escapeHtml(category)}</h2>
      <p>
        Total records: <strong>${stats.returnRecords}</strong> ·
        Unique taxpayers: <strong>${stats.uniqueTaxpayers}</strong>
      </p>

      <table class="pdf-table">
        <thead>
          <tr>
            <th>Taxpayer</th>
            <th>PAN</th>
            <th>FY</th>
            <th>AY</th>
            <th>Acknowledgement No.</th>
            <th>ITR Form</th>
            <th>Status</th>
            <th>Gross Income</th>
            <th>Tax Payable</th>
            <th>TDS Claimed</th>
            <th>Expected Refund / (Tax Payable)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p class="pdf-note">
        This report includes only the records matching the currently selected search and filters.
      </p>
    `;

    try {
      openPrintWindow(`Taxpayer Records Report - ${category}`, content, true);
    } catch (error) {
      showMessage(
        error.message || "Unable to open the PDF print window.",
        "error"
      );
    }
  };

  const totals = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.gross += num(record.grossIncome);
        acc.tax += num(record.taxPayable);
        acc.tds += num(record.tdsClaim);
        acc.refund += num(record.refundAmountBeforeInterest) + num(record.interest);
        return acc;
      },
      { gross: 0, tax: 0, tds: 0, refund: 0 }
    );
  }, [records]);

  const statusCounts = useMemo(() => {
    return FILING_STATUSES.map(status => ({
      status,
      count: records.filter(
        record => record.filingStatus === status
      ).length,
    })).filter(item => item.count);
  }, [records]);

  const maxIncome = Math.max(
    1,
    ...records.map(record => num(record.grossIncome))
  );

  // Existing names in the selected category, used as suggestions to keep spelling consistent.
  const nameSuggestions = useMemo(
    () =>
      [...new Set(records.map(record => record.name).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [records]
  );

  const renderInput = (
    label,
    name,
    type = "number",
    placeholder = "Enter amount",
    listId
  ) => (
    <div className="tax-form-group" key={name}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={fieldsDisabled}
        list={listId}
        maxLength={name === "pan" ? 10 : undefined}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
    </div>
  );

  const renderReadOnly = (label, value) => (
    <div className="tax-form-group" key={label}>
      <label>{label}</label>
      <input type="text" value={value} readOnly />
    </div>
  );

  const renderDashboard = () => {
    const dashboardRecords = records.filter(
      record =>
        fyFilter === "all" ||
        record.financialYear === fyFilter
    );

    const stats = taxpayerStats(dashboardRecords);
    const members =
      category === "Doshi Family"
        ? memberSummary(dashboardRecords)
        : [];
    const takerLabel =
      category === "Doshi Family" ? "Unique members" : "Unique companies";

    const sum = field =>
      dashboardRecords.reduce(
        (total, record) => total + num(record[field]),
        0
      );

    const totalGross = sum("grossIncome");
    const totalTax = sum("taxPayable");
    const totalTds = sum("tdsClaim");
    const totalTdsCredit = sum("tdsCredit");

    // TDS reconciliation is derived from the ITR TDS claim
    // and assessment TDS credit values. Status uses the exact signed difference.
    const tdsReconciliation = dashboardRecords.reduce(
      (summary, record) => {
        const claimed = num(record.tdsClaim);
        const credited = num(record.tdsCredit);

        // Ignore records where neither side contains a TDS value.
        if (claimed === 0 && credited === 0) return summary;

        const difference = credited - claimed;

        const status = getFinancialStatus(difference);

        if (status === "Match") {
          summary.matched.count += 1;
          summary.matched.amount += Math.min(claimed, credited);
        } else if (status === "Excess") {
          summary.excess.count += 1;
          summary.excess.amount += difference;
        } else if (status === "Less") {
          summary.less.count += 1;
          summary.less.amount += Math.abs(difference);
        }

        return summary;
      },
      {
        matched: { count: 0, amount: 0 },
        excess: { count: 0, amount: 0 },
        less: { count: 0, amount: 0 },
      }
    );

    const totalTdsReconciliationRecords =
      tdsReconciliation.matched.count +
      tdsReconciliation.excess.count +
      tdsReconciliation.less.count;

    // Signed net position: positive = refund expected; negative = tax payable.
    const totalRefundDue = sum("refundDue");

    const totalRefundBeforeInterest = sum("refundAmountBeforeInterest");
    const totalInterest = sum("interest");
    const netRefundTotal = totalRefundBeforeInterest + totalInterest;

    const processedRefund = dashboardRecords.reduce(
      (total, record) => {
        const status = String(
          record.refundProcess || ""
        ).toLowerCase();

        return total +
          (["processed", "received"].includes(status)
            ? num(record.refundAmountBeforeInterest) + num(record.interest)
            : 0);
      },
      0
    );

    const pendingRefund = dashboardRecords.reduce(
      (total, record) => {
        const status = String(
          record.refundProcess || "pending"
        ).toLowerCase();

        return total +
          (["", "pending"].includes(status)
            ? Math.max(
                0,
                (num(record.refundAmountBeforeInterest) + num(record.interest)) ||
                num(record.tdsClaim) - num(record.taxPayable)
              )
            : 0);
      },
      0
    );

    const filedCount = dashboardRecords.filter(record =>
      [
        "filed",
        "verified",
        "processed",
        "revised",
        "belated",
      ].includes(
        String(record.filingStatus || "").toLowerCase()
      )
    ).length;

    const pendingCount = dashboardRecords.filter(record =>
      ["draft", ""].includes(
        String(record.filingStatus || "").toLowerCase()
      )
    ).length;

    const defectiveCount = dashboardRecords.filter(
      record =>
        String(record.filingStatus || "").toLowerCase() ===
        "defective"
    ).length;

    const statusPalette = {
      Draft: "#D9A441",
      Filed: "#4B83B8",
      Verified: "#8C78B8",
      Processed: "#31966B",
      Defective: "#C95D57",
      Revised: "#4D9C9A",
      Belated: "#8A98A8",
    };

    const filingBreakdown = FILING_STATUSES.map(status => ({
      status,
      count: dashboardRecords.filter(
        record =>
          String(record.filingStatus || "").toLowerCase() ===
          status.toLowerCase()
      ).length,
      color: statusPalette[status],
    })).filter(item => item.count > 0);

    const statusTotal = filingBreakdown.reduce(
      (total, item) => total + item.count,
      0
    );

    let runningPercent = 0;

    const donutGradient = filingBreakdown.length
      ? `conic-gradient(${filingBreakdown
          .map(item => {
            const start = runningPercent;
            runningPercent +=
              (item.count / statusTotal) * 100;

            return `${item.color} ${start}% ${runningPercent}%`;
          })
          .join(", ")})`
      : "conic-gradient(#e8e3d8 0% 100%)";

    // Doshi Family: rank unique members, not individual ITR rows.
    // Talent Corner keeps its existing record-wise ranking.
    const incomeLeaders =
      category === "Doshi Family"
        ? memberIncomeSummary(dashboardRecords).slice(0, 5)
        : [...dashboardRecords]
            .sort(
              (a, b) =>
                num(b.grossIncome) - num(a.grossIncome)
            )
            .slice(0, 5);

    const maxIncomeValue = Math.max(
      1,
      ...incomeLeaders.map(record => num(record.grossIncome))
    );

    // Build the chart timeline directly from financialYear values saved in the database.
    // This automatically includes newly added FYs and excludes FYs with no records.
    const databaseFinancialYears = [...new Set(
      records.map(record => String(record.financialYear || "").trim()).filter(Boolean)
    )].sort((a, b) => {
      const startA = Number(a.match(/^(\d{4})/)?.[1] || 0);
      const startB = Number(b.match(/^(\d{4})/)?.[1] || 0);
      return startA - startB || a.localeCompare(b);
    });

    const yearSummary = databaseFinancialYears.map(financialYear => {
      const rows = records.filter(record => String(record.financialYear || "").trim() === financialYear);
      return {
        year: financialYear,
        income: rows.reduce((total, record) => total + num(record.grossIncome), 0),
        tax: rows.reduce((total, record) => total + num(record.taxPayable), 0),
        tds: rows.reduce((total, record) => total + num(record.tdsClaim), 0),
        count: rows.length,
      };
    });

    // Shared scale for Income, Tax Paid, and TDS. Values are stored in rupees
    // and shown as lakhs on the chart axis.
    const maxYearComparison = Math.max(
      1000000,
      Math.ceil(
        Math.max(0, ...yearSummary.flatMap(item => [item.income, item.tax, item.tds])) /
          1000000
      ) * 1000000
    );
    const yearComparisonTickCount = 4;
    const yearComparisonTicks = Array.from(
      { length: yearComparisonTickCount + 1 },
      (_, index) => maxYearComparison - (index * maxYearComparison / yearComparisonTickCount)
    );
    const yearComparisonChartWidth = 1000;
    const yearComparisonPlotLeft = 58;
    const yearComparisonPlotRight = yearComparisonChartWidth - 16;
    const yearComparisonPlotTop = 20;
    const yearComparisonPlotBottom = 255;
    const yearComparisonX = index =>
      yearComparisonPlotLeft + (index * (yearComparisonPlotRight - yearComparisonPlotLeft) / Math.max(yearSummary.length - 1, 1));
    const yearComparisonY = value =>
      yearComparisonPlotBottom - (num(value) / maxYearComparison) * (yearComparisonPlotBottom - yearComparisonPlotTop);
    const yearComparisonSeries = [
      { key: "income", label: "Income", color: "#2878D0" },
      { key: "tax", label: "Tax Paid", color: "#D64545" },
      { key: "tds", label: "TDS", color: "#24965A" },
    ];

    // Highest gross income in the selected financial-year chart.
    // The minimum of 1 prevents division by zero when there is no income.
    const maxYearIncome = Math.max(
      1,
      ...yearSummary.map(item => num(item.income))
    );

    const attentionCount =
      defectiveCount +
      dashboardRecords.filter(
        record =>
          (num(record.totalAssessedIncome) &&
            num(record.totalAssessedIncome) !==
              num(record.grossIncome)) ||
          (num(record.totalAssessedTaxPayable) &&
            num(record.totalAssessedTaxPayable) !==
              num(record.taxPayable))
      ).length;

    const recentRecords = [...dashboardRecords]
      .sort((a, b) => {
        const dateA = new Date(
          a.updatedAt ||
          a.createdAt ||
          a.itrFilingDate ||
          0
        ).getTime();

        const dateB = new Date(
          b.updatedAt ||
          b.createdAt ||
          b.itrFilingDate ||
          0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);

    return (
      <div className="trs-content trs-dashboard-content">
        <div className="trs-dashboard-hero">
          <div className="trs-hero-copy">
            <span className="trs-eyebrow">
              TAX INTELLIGENCE · WORKSPACE
            </span>

            <h2>
              Good overview.
              <br />
              <em>Better decisions.</em>
            </h2>

            <p>
              Your tax return portfolio, filing progress and
              refund position — all in one place.
            </p>

            <div className="trs-hero-meta">
              <span className="trs-hero-pulse" />
              {category}
              <span className="trs-hero-separator">•</span>
              {dashboardRecords.length.toLocaleString("en-IN")}
              {" "}records in view
            </div>
          </div>

          <div className="trs-hero-actions">
            <button
              className="trs-primary-btn"
              onClick={() => {
                resetForm();
                setPage("entry");
              }}
            >
              ＋ Add Tax Return
            </button>

            <button
              className="trs-hero-refresh"
              onClick={loadAllRecords}
              disabled={loading}
            >
              ↻ {loading ? "Refreshing" : "Refresh data"}
            </button>
          </div>

          <div className="trs-hero-watermark">₹</div>
        </div>

        <div className="trs-dashboard-toolbar">
          <div>
            <span className="trs-toolbar-label">
              PORTFOLIO VIEW
            </span>

            <strong>
              {category} ·{" "}
              {fyFilter === "all"
                ? "All financial years"
                : `FY ${fyFilter}`}
            </strong>
          </div>

          <label className="trs-year-select">
            <span>Financial year</span>

            <select
              value={fyFilter}
              onChange={event =>
                setFyFilter(event.target.value)
              }
            >
              <option value="all">
                All Financial Years
              </option>

              {FINANCIAL_YEARS.map(year => (
                <option
                  key={year.financialYear}
                  value={year.financialYear}
                >
                  FY {year.financialYear}
                </option>
              ))}
            </select>
          </label>
        </div>

        {dashboardError && (
          <div className="tax-message error">
            {dashboardError}
          </div>
        )}

        {loading && (
          <div className="tax-loading">
            Refreshing your tax portfolio…
          </div>
        )}

        <div className="trs-stats-grid trs-stats-grid-premium">
          <StatCard
            label="Return records"
            value={stats.returnRecords.toLocaleString("en-IN")}
            note={`${filedCount} filed or processed`}
            icon="▤"
          />

          <StatCard
            label={takerLabel}
            value={stats.uniqueTaxpayers.toLocaleString("en-IN")}
            note={`${stats.withPan} with PAN · ${stats.withoutPan} without PAN`}
            icon="◉"
          />

          <StatCard
            label="Gross income"
            value={money(totalGross)}
            note="Combined reported income"
            icon="₹"
          />

          <StatCard
            label="Tax liability"
            value={money(totalTax)}
            note="Total tax payable"
            icon="▣"
          />

          <StatCard
            label="TDS claimed"
            value={money(totalTds)}
            note="Claimed in ITR"
            icon="↘"
          />

          <StatCard
            label="TDS credit"
            value={money(totalTdsCredit)}
            note={`Difference vs claim: ${money(totalTdsCredit - totalTds)}`}
            icon="✓"
          />

          <StatCard
            label="Expected refund / (tax payable)"
            value={money(totalRefundDue)}
            note="TDS less tax; negative means tax payable"
            icon="↗"
          />

          <StatCard
            label="Refund processed"
            value={money(processedRefund)}
            note={`${money(pendingRefund)} currently pending`}
            icon="✓"
          />
        </div>

        <div className="trs-insight-strip">
          <div className="trs-insight-icon">✦</div>

          <div className="trs-insight-text">
            <span>PORTFOLIO INSIGHT</span>

            <strong>
              {dashboardRecords.length
                ? attentionCount
                  ? `${attentionCount} record${
                      attentionCount === 1 ? "" : "s"
                    } may need a review.`
                  : "Your visible portfolio has no flagged filing or assessment differences."
                : "Add your first return to unlock portfolio insights."}
            </strong>

            <small>
              {dashboardRecords.length
                ? `${pendingCount} draft or unfiled · ${defectiveCount} defective · ${filedCount} filed, verified or processed`
                : "Your dashboard will summarize filing progress and tax position automatically."}
            </small>
          </div>

          {attentionCount > 0 && (
            <button
              className="trs-insight-link"
              onClick={() => {
                setStatusFilter("Defective");
                setPage("records");
              }}
            >
              Review records →
            </button>
          )}
        </div>

        {category === "Doshi Family" && (
          <section className="trs-panel trs-panel-elevated">
            <div className="trs-panel-heading">
              <div>
                <span className="trs-panel-kicker">
                  FAMILY SUMMARY
                </span>
                <h3>Member-wise summary</h3>
                <p>
                  Each member or HUF is counted once, with all of
                  their return records combined.
                </p>
              </div>
            </div>

            <div className="trs-table-wrap">
              <table className="trs-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>PAN</th>
                    <th>Returns</th>
                    <th>Gross Income</th>
                    <th>Tax Payable</th>
                    <th>TDS Claimed</th>
                    <th>Expected Refund / (Tax Payable)</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map(member => (
                    <tr key={member.key}>
                      <td>
                        <b>{member.name || "—"}</b>
                      </td>
                      <td>{member.pan || "PAN missing"}</td>
                      <td>{member.returns}</td>
                      <td>{money(member.grossIncome)}</td>
                      <td>{money(member.taxPayable)}</td>
                      <td>{money(member.tdsClaim)}</td>
                      <td className="trs-amount-good">
                        {money(member.refundDue)}
                      </td>
                    </tr>
                  ))}

                  {members.length > 0 && (
                    <tr>
                      <td>
                        <b>Consolidated family total</b>
                      </td>
                      <td>—</td>
                      <td>
                        <b>{stats.returnRecords}</b>
                      </td>
                      <td>
                        <b>{money(totalGross)}</b>
                      </td>
                      <td>
                        <b>{money(totalTax)}</b>
                      </td>
                      <td>
                        <b>{money(totalTds)}</b>
                      </td>
                      <td className="trs-amount-good">
                        <b>
                          {money(
                            members.reduce(
                              (total, member) =>
                                total + member.refundDue,
                              0
                            )
                          )}
                        </b>
                      </td>
                    </tr>
                  )}

                  {!members.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="trs-empty-cell"
                      >
                        No family records for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="trs-dashboard-grid trs-dashboard-grid-premium trs-dashboard-top-grid">
          <section className="trs-panel trs-panel-elevated trs-income-panel">
            <div className="trs-panel-heading">
              <div>
                <span className="trs-panel-kicker">
                  INCOME DISTRIBUTION
                </span>
                <h3>
                  {category === "Doshi Family"
                    ? "Top family members by gross income"
                    : "Year-on-Year Financial Trends"}
                </h3>
                <p>
                  {category === "Doshi Family"
                    ? "Each member appears once, with income consolidated across the selected period"
                    : "Annual trends for income, tax paid, and TDS"}
                </p>
              </div>

              <span className="trs-panel-icon">↗</span>
            </div>

            {category === "Talent Corner" ? (
              yearSummary.length ? (
                <div className="trs-year-comparison-wrap" style={{ width: "100%", minWidth: 0 }}>
                  <div style={{ width: "100%", overflow: "hidden" }}>
                    <svg
                      role="img"
                      aria-label="Year-on-year line chart showing Income, Tax Paid, and TDS in lakhs across financial years"
                      viewBox={`0 0 ${yearComparisonChartWidth} 310`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ display: "block", width: "100%", height: "310px", maxWidth: "100%" }}
                    >
                      {yearComparisonTicks.map((tick, index) => {
                        const y = yearComparisonPlotTop + (index / yearComparisonTickCount) * (yearComparisonPlotBottom - yearComparisonPlotTop);
                        return (
                          <g key={`tick-${index}`}>
                            <line x1={yearComparisonPlotLeft} x2={yearComparisonPlotRight} y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="4 4" />
                            <text x={yearComparisonPlotLeft - 8} y={y + 4} textAnchor="end" fill="#596579" fontSize="15">
                              ₹{(tick / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L
                            </text>
                          </g>
                        );
                      })}
                      <line x1={yearComparisonPlotLeft} x2={yearComparisonPlotLeft} y1={yearComparisonPlotTop} y2={yearComparisonPlotBottom} stroke="#CBD5E1" />
                      <line x1={yearComparisonPlotLeft} x2={yearComparisonPlotRight} y1={yearComparisonPlotBottom} y2={yearComparisonPlotBottom} stroke="#CBD5E1" />
                      {yearComparisonSeries.map(series => (
                        <g key={series.key}>
                          <polyline
                            fill="none"
                            stroke={series.color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={yearSummary.map((item, index) => `${yearComparisonX(index)},${yearComparisonY(item[series.key])}`).join(" ")}
                          />
                          {yearSummary.map((item, index) => (
                            <circle key={`${series.key}-${item.year}`} cx={yearComparisonX(index)} cy={yearComparisonY(item[series.key])} r="4.5" fill={series.color} stroke="#FFFFFF" strokeWidth="1.2">
                              <title>{`${item.year} ${series.label}: ${money(item[series.key])}`}</title>
                            </circle>
                          ))}
                        </g>
                      ))}
                      {yearSummary.map((item, index) => (
                        <text key={item.year} x={yearComparisonX(index)} y={yearComparisonPlotBottom + 30} textAnchor="end" transform={`rotate(-45 ${yearComparisonX(index)} ${yearComparisonPlotBottom + 30})`} fill="#596579" fontSize="15">
                          {item.year}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="trs-empty">
                  Financial-year comparison will appear once records are available.
                </div>
              )
            ) : incomeLeaders.length ? (
              <div className="trs-leader-bars">
                {incomeLeaders.map((record, index) => (
                  <div
                    className="trs-leader-row"
                    key={record.key || record.id || `${record.name}-${index}`}
                  >
                    <div className="trs-leader-label">
                      <span className="trs-leader-rank">0{index + 1}</span>
                      <strong title={record.name}>
                        {record.name || "Unnamed taxpayer"}
                      </strong>
                      <b>{money(record.grossIncome)}</b>
                    </div>
                    <div className="trs-leader-track">
                      <span
                        style={{
                          width: `${Math.max(2, (num(record.grossIncome) / maxIncomeValue) * 100)}%`,
                          background: index === 0
                            ? "linear-gradient(90deg,#B89548,#E0C77E)"
                            : "linear-gradient(90deg,#24476B,#537B9D)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="trs-empty">
                No income records available for this period.
              </div>
            )}

            <div className="trs-chart-footnote">
              {category === "Talent Corner" ? (
                <>
                  {yearComparisonSeries.map(series => (
                    <span key={series.key} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginRight: "14px" }}>
                      <span style={{ display: "inline-block", width: "18px", height: "3px", borderRadius: "4px", background: series.color }} />
                      {series.label}
                    </span>
                  ))}
                  <span className="trs-chart-footnote-text">Year-wise comparison · ₹ Lakhs</span>
                </>
              ) : (
                <>
                  <span className="trs-chart-key trs-key-gold" />
                  Highest income
                  <span className="trs-chart-footnote-text">
                    Ranked by gross income
                  </span>
                </>
              )}
            </div>
          </section>

          <div className="trs-dashboard-side-stack">
            <section className="trs-panel trs-panel-elevated trs-filing-panel">
              <div className="trs-panel-heading">
                <div>
                  <span className="trs-panel-kicker">
                    COMPLIANCE SNAPSHOT
                  </span>
                  <h3>Filing status</h3>
                  <p>
                    Return progress across this portfolio
                  </p>
                </div>

                <span className="trs-panel-icon">◎</span>
              </div>

              <div className="trs-donut-layout">
                <div
                  className="trs-donut"
                  style={{ background: donutGradient }}
                  role="img"
                  aria-label={`Filing status breakdown for ${dashboardRecords.length} returns`}
                >
                  <div className="trs-donut-hole">
                    <strong>{dashboardRecords.length}</strong>
                    <span>RETURNS</span>
                  </div>
                </div>

                <div className="trs-donut-legend">
                  {filingBreakdown.length
                    ? filingBreakdown.map(item => (
                        <div
                          className="trs-legend-row"
                          key={item.status}
                        >
                          <span style={{ background: item.color }} />
                          <span>{item.status}</span>
                          <b>{item.count}</b>
                        </div>
                      ))
                    : (
                      <span className="trs-muted-note">
                        No filing statuses yet
                      </span>
                    )}
                </div>
              </div>

              <div className="trs-compliance-footer">
                <div>
                  <strong>{filedCount}</strong>
                  <span>Filed / completed</span>
                </div>

                <div>
                  <strong className="trs-amber-text">
                    {pendingCount}
                  </strong>
                  <span>Draft / pending</span>
                </div>

                <div>
                  <strong className="trs-red-text">
                    {defectiveCount}
                  </strong>
                  <span>Defective</span>
                </div>
              </div>
            </section>

            <section className="trs-panel trs-panel-elevated trs-tds-summary-panel">
              <div className="trs-panel-heading trs-tds-summary-heading">
                <div>
                  <span className="trs-panel-kicker">
                    TAX CREDIT RECONCILIATION
                  </span>
                  <h3>TDS Reconciliation Summary</h3>
                  <p>ITR TDS claim compared with assessment TDS credit</p>
                </div>

                <button
                  type="button"
                  className="trs-tds-view-btn"
                  onClick={() => setPage("reconciliation")}
                >
                  View details <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="trs-tds-summary-grid">
                <button
                  type="button"
                  className="trs-tds-summary-item matched"
                  onClick={() => setPage("reconciliation")}
                  title="Open the reconciliation register"
                >
                  <span className="trs-tds-status-label">Matched</span>
                  <strong>{tdsReconciliation.matched.count.toLocaleString("en-IN")}</strong>
                  <b>{money(tdsReconciliation.matched.amount)}</b>
                  <small>Matched amount</small>
                </button>

                <button
                  type="button"
                  className="trs-tds-summary-item excess"
                  onClick={() => setPage("reconciliation")}
                  title="Open the reconciliation register"
                >
                  <span className="trs-tds-status-label">Excess Paid</span>
                  <strong>{tdsReconciliation.excess.count.toLocaleString("en-IN")}</strong>
                  <b>{money(tdsReconciliation.excess.amount)}</b>
                  <small>Excess TDS credit</small>
                </button>

                <button
                  type="button"
                  className="trs-tds-summary-item less"
                  onClick={() => setPage("reconciliation")}
                  title="Open the reconciliation register"
                >
                  <span className="trs-tds-status-label">Less</span>
                  <strong>{tdsReconciliation.less.count.toLocaleString("en-IN")}</strong>
                  <b>{money(tdsReconciliation.less.amount)}</b>
                  <small>TDS credit shortfall</small>
                </button>
              </div>

              <div className="trs-tds-summary-footer">
                <span>Total reconciliation records</span>
                <strong>{totalTdsReconciliationRecords.toLocaleString("en-IN")}</strong>
              </div>
            </section>
          </div>
        </div>

        <div className="trs-dashboard-grid trs-dashboard-grid-lower">
          <section className="trs-panel trs-panel-elevated trs-year-panel">
            <div className="trs-panel-heading">
              <div>
                <span className="trs-panel-kicker">
                  YEAR-ON-YEAR VIEW
                </span>
                <h3>Income across financial years</h3>
                <p>
                  Complete financial-year comparison from FY 2007-08 to the latest configured year
                </p>
              </div>
            </div>

            {yearSummary.length ? (
              <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden" }}>
                <div
                  className="trs-year-chart"
                  style={{ minWidth: `${Math.max(yearSummary.length * 76, 100)}px` }}
                >
                {yearSummary.map(item => (
                  <div
                    className="trs-year-column"
                    key={item.year}
                  >
                    <div className="trs-year-bar-area">
                      <span className="trs-year-value">
                        {money(item.income)}
                      </span>

                      <div
                        className="trs-year-bar"
                        style={{
                          height: item.income > 0
                            ? `${Math.max(1, (item.income / maxYearIncome) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>

                    <span className="trs-year-label">
                      {item.year}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="trs-empty">
                Financial-year comparison will appear once records are available.
              </div>
            )}

            <div className="trs-chart-footnote">
              <span className="trs-chart-key trs-key-navy" />
              Gross income
              <span className="trs-chart-footnote-text">
                Values aggregated by financial year
              </span>
            </div>
          </section>

          <section className="trs-panel trs-panel-elevated trs-refund-panel">
            <div className="trs-panel-heading">
              <div>
                <span className="trs-panel-kicker">
                  REFUND AND INTEREST
                </span>
                <h3>Refund summary</h3>
                <p>
                  Totals from assessment records in this view
                </p>
              </div>

              <span className="trs-panel-icon trs-refund-icon">
                ₹
              </span>
            </div>

            <div className="trs-refund-amount">
              <strong>{money(netRefundTotal)}</strong>
              <span>Total net refund (incl. interest)</span>
            </div>

            <div
              className="trs-refund-track"
              style={{
                display: "flex",
                width: "100%",
                overflow: "hidden",
                gap: 0,
              }}
            >
              <span
                title={`Refund before interest: ${money(totalRefundBeforeInterest)}`}
                style={{
                  display: "block",
                  flex: "0 0 auto",
                  width: `${
                    netRefundTotal > 0
                      ? Math.max(
                          0,
                          Math.min(
                            100,
                            (totalRefundBeforeInterest / netRefundTotal) * 100
                          )
                        )
                      : 0
                  }%`,
                  height: "100%",
                  background: "#31966D",
                }}
              />

              <span
                title={`Interest: ${money(totalInterest)}`}
                style={{
                  display: "block",
                  flex: "0 0 auto",
                  width: `${
                    netRefundTotal > 0
                      ? Math.max(
                          0,
                          Math.min(100, (totalInterest / netRefundTotal) * 100)
                        )
                      : 0
                  }%`,
                  height: "100%",
                  background: "#D8A52E",
                }}
              />
            </div>

            <div className="trs-refund-legend">
              <div>
                <span className="trs-refund-dot paid" />
                Refund before interest
                <b>{money(totalRefundBeforeInterest)}</b>
              </div>

              <div>
                <span className="trs-refund-dot pending" />
                Total interest
                <b>{money(totalInterest)}</b>
              </div>

              <div>
                <span className="trs-refund-dot paid" />
                Expected refund / (tax payable)
                <b>{money(totalRefundDue)}</b>
              </div>
            </div>

            <small className="trs-refund-disclaimer">
              Bar shows refund before interest and interest as shares of the net refund.
            </small>
          </section>
        </div>

        <section className="trs-panel trs-panel-elevated trs-recent-panel">
          <div className="trs-panel-heading">
            <div>
              <span className="trs-panel-kicker">
                LATEST ACTIVITY
              </span>
              <h3>Recent taxpayer records</h3>
              <p>
                Most recently updated records in the selected period
              </p>
            </div>

            <button
              className="trs-text-btn"
              onClick={() => setPage("records")}
            >
              View all records →
            </button>
          </div>

          <RecordsTable
            records={recentRecords}
            onEdit={editFromTable}
          />
        </section>
      </div>
    );
  };

  const renderRecords = () => (
    <div className="trs-content">
      <div className="trs-page-heading">
        <div>
          <span className="trs-eyebrow">DATABASE</span>
          <h2>Taxpayer Records</h2>
          <p>
            Filter and open saved tax return records.
          </p>
        </div>

        <button
          className="trs-primary-btn"
          onClick={() => {
            resetForm();
            setPage("entry");
          }}
        >
          ＋ Add Tax Return
        </button>
      </div>

      {message && (
        <div className={`tax-message ${messageType}`}>
          {message}
        </div>
      )}

      {category === "Doshi Family" ? (
        <DoshiTaxpayerCards
          records={filteredRecords}
          fyFilter={fyFilter}
          onFyFilter={setFyFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          selectedKey={doshiTaxpayerKey}
          onSelect={setDoshiTaxpayerKey}
          onExportPdf={downloadRecordsPdf}
          onExportCsv={exportRecordsCsv}
          onEdit={editFromTable}
          onDownload={openRecordPdf}
        />
      ) : (
        <TaxpayerRecordsExplorer
          records={filteredRecords}
          allRecords={records}
          fyFilter={fyFilter}
          onFyFilter={setFyFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          onExportPdf={downloadRecordsPdf}
          onExportCsv={exportRecordsCsv}
          onEdit={editFromTable}
          onDownload={openRecordPdf}
        />
      )}
    </div>
  );

  const renderEntry = () => (
    <div className="trs-content">
      <div className="trs-page-heading">
        <div>
          <span className="trs-eyebrow">ITR MANAGEMENT</span>
          <h2>
            {recordId ? "Tax Return Details" : "Add Tax Return"}
          </h2>
          <p>
            Enter income tax return and assessment information.
          </p>
        </div>

        <button
          className="trs-light-btn"
          onClick={() => setPage("records")}
        >
          ← Back to Records
        </button>
      </div>

      {message && (
        <div className={`tax-message ${messageType}`}>
          {message}
        </div>
      )}

      {loading && (
        <div className="tax-loading">Loading...</div>
      )}

      <section className="trs-form-panel">
        {recordId && (
          <div className="trs-individual-export">
            <div>
              <strong>Taxpayer report</strong>
              <span>
                Download a PDF of this saved taxpayer record.
              </span>
            </div>

            <button
              className="trs-primary-btn"
              type="button"
              onClick={downloadIndividualPdf}
              disabled={loading || saving}
            >
              ↓ Download Individual PDF
            </button>
          </div>
        )}

        <section className="tax-section">
          <h3>
            <span>01</span> Basic Information
          </h3>

          <div className="tax-form-grid">
            {renderReadOnly(
              "Category",
              form.dataCategory || category
            )}

            <div className="tax-form-group">
              <label htmlFor="financialYear">
                Financial Year
              </label>

              <select
                id="financialYear"
                value={form.financialYear}
                onChange={chooseFinancialYear}
                disabled={loading || saving || fieldsDisabled}
              >
                <option value="">Select Financial Year</option>

                {FINANCIAL_YEARS.map(year => (
                  <option
                    key={year.financialYear}
                    value={year.financialYear}
                  >
                    FY {year.financialYear}
                  </option>
                ))}
              </select>
            </div>

            <div className="tax-form-group">
              <label htmlFor="assessmentYear">
                Assessment Year
              </label>

              <select
                id="assessmentYear"
                name="assessmentYear"
                value={form.assessmentYear}
                onChange={handleChange}
                disabled={fieldsDisabled || loading}
              >
                <option value="">
                  Select Assessment Year
                </option>

                {ASSESSMENT_YEARS.map(year => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>

            {renderInput(
              "Taxpayer Name",
              "name",
              "text",
              "Enter taxpayer name",
              "trs-name-suggestions"
            )}

            <datalist id="trs-name-suggestions">
              {nameSuggestions.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {renderInput(
              "PAN (optional)",
              "pan",
              "text",
              "ABCDE1234F"
            )}

            {renderInput(
              "Acknowledgement Number",
              "acknowledgementNumber",
              "text",
              "Enter acknowledgement number"
            )}

            <div className="tax-form-group">
              <label htmlFor="formType">ITR Form Type</label>

              <select
                id="formType"
                name="formType"
                value={form.formType}
                onChange={handleChange}
                disabled={fieldsDisabled}
              >
                <option value="">Select Form Type</option>

                {FORM_TYPES.map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="tax-form-group">
              <label htmlFor="filingStatus">
                Filing Status
              </label>

              <select
                id="filingStatus"
                name="filingStatus"
                value={form.filingStatus}
                onChange={handleChange}
                disabled={fieldsDisabled}
              >
                <option value="">Select Filing Status</option>

                {FILING_STATUSES.map(status => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            {renderInput(
              "ITR Filing Date",
              "itrFilingDate",
              "date"
            )}
          </div>
        </section>

        <section className="tax-section">
          <h3>
            <span>02</span> Income and Tax Details
          </h3>

          <div className="tax-form-grid">
            {renderInput("Gross Income", "grossIncome")}
            {renderInput("Tax Payable", "taxPayable")}
            {renderInput("TDS Claim", "tdsClaim")}

            {renderReadOnly(
              "Expected Refund / (Tax Payable)",
              money(refundDue)
            )}

            <div className="tax-form-group">
              <label htmlFor="refundProcess">
                Refund Process
              </label>

              <select
                id="refundProcess"
                name="refundProcess"
                value={form.refundProcess}
                onChange={handleChange}
                disabled={fieldsDisabled}
              >
                <option value="">Select Status</option>

                {[
                  "Pending",
                  "Processed",
                  "Received",
                  "Not Applicable",
                ].map(status => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="trs-note">
            Expected refund = TDS Claim − Tax Payable. A negative result means
            tax is still payable; it is not a refund.
          </p>
        </section>

        <section className="tax-section">
          <h3>
            <span>03</span> Assessment Details
          </h3>

          <div className="tax-form-grid">
            {renderInput(
              "Order Type",
              "orderType",
              "text",
              "Enter order type"
            )}

            {renderInput(
              "Date of Order",
              "dateOfOrder",
              "date"
            )}

            {renderInput(
              "Total Assessed Income",
              "totalAssessedIncome"
            )}

            {renderInput(
              "Total Tax Payable as Assessed",
              "totalAssessedTaxPayable"
            )}

            {renderInput("TDS Credit", "tdsCredit")}
            {renderInput("Refund Amount Before Interest", "refundAmountBeforeInterest")}
            {renderInput("Interest", "interest")}

            {renderReadOnly(
              "Net Refund Amount",
              money(netRefundAmount)
            )}
          </div>
        </section>

        <section className="tax-section">
          <h3>
            <span>04</span> Difference Summary
          </h3>

          <div className="tax-difference-grid">
            <div className="tax-difference-card">
              <span>Difference in Income</span>
              <strong>{money(differenceIncome)}</strong>
            </div>

            <div className="tax-difference-card">
              <span>Difference in Income Tax</span>
              <strong>{money(differenceIncomeTax)}</strong>
            </div>

            <div className="tax-difference-card">
              <span>Difference in Return (Expected − Assessment Net Refund)</span>
              <strong>{money(differenceReturn)}</strong>
            </div>
          </div>
        </section>

        <div className="trs-form-actions">
          {recordId && !isEditing && (
            <button
              className="trs-primary-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Record
            </button>
          )}

          {isEditing && (
            <button
              className="trs-light-btn"
              onClick={() =>
                recordId
                  ? loadTaxReturnById(recordId)
                  : resetForm()
              }
            >
              Cancel Edit
            </button>
          )}

          {(!recordId || isEditing) && (
            <button
              className="trs-primary-btn"
              onClick={() => setShowConfirm(true)}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Tax Return"}
            </button>
          )}

          <button
            className="trs-ghost-btn"
            onClick={resetForm}
            disabled={loading || saving}
          >
            Reset
          </button>
        </div>
      </section>

      {showConfirm && (
        <div className="tax-modal-overlay">
          <div className="tax-confirm-modal">
            <h3>Confirm Save</h3>

            <p>
              Are you sure you want to save the Tax Return
              Summary for FY {form.financialYear} under{" "}
              {form.dataCategory || category}?
            </p>

            <div className="tax-modal-actions">
              <button
                className="tax-cancel-btn"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="tax-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReconciliation = () => {
    const isTalentCorner = category === "Talent Corner";
    const hasStoredValue = value =>
      value !== null && value !== undefined && String(value).trim() !== "";

    const rows = records.map(record => {
      const definitions = [
        {
          label: "Income",
          itrValue: record.grossIncome,
          assessmentValue: record.totalAssessedIncome,
          itr: num(record.grossIncome),
          assessment: num(record.totalAssessedIncome),
        },
        {
          label: "Income Tax",
          itrValue: record.taxPayable,
          assessmentValue: record.totalAssessedTaxPayable,
          itr: num(record.taxPayable),
          assessment: num(record.totalAssessedTaxPayable),
        },
        {
          label: "TDS",
          itrValue: record.tdsClaim,
          assessmentValue: record.tdsCredit,
          itr: num(record.tdsClaim),
          assessment: num(record.tdsCredit),
        },
        {
          label: "Expected Refund / (Tax Payable)",
          itrValue: record.refundDue,
          assessmentValue: record.refundAmountBeforeInterest,
          hasAssessmentInterest: hasStoredValue(record.interest),
          itr: num(record.refundDue),
          assessment:
            num(record.refundAmountBeforeInterest) + num(record.interest),
        },
      ];

      const checks = definitions
        .filter(item =>
          !isTalentCorner ||
          hasStoredValue(item.itrValue) ||
          hasStoredValue(item.assessmentValue) ||
          (item.label === "Expected Refund / (Tax Payable)" && item.hasAssessmentInterest)
        )
        .map(item => {
          const difference = item.assessment - item.itr;
          return {
            ...item,
            difference,
            status: getFinancialStatus(difference),
          };
        });

      return { ...record, checks };
    });

    if (isTalentCorner) {
      const getYearSortValue = value => {
        const match = String(value || "").match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
        if (match) return Number(match[1]);
        const year = String(value || "").match(/\d{4}/);
        return year ? Number(year[0]) : -1;
      };

      const yearGroups = [...rows.reduce((map, record) => {
        const key = record.financialYear || "Unknown FY";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(record);
        return map;
      }, new Map())]
        .sort((a, b) => getYearSortValue(b[0]) - getYearSortValue(a[0]))
        .map(([financialYear, yearRecords]) => {
          const checks = yearRecords.flatMap(record =>
            record.checks.map(check => ({ ...check, taxpayerName: record.name }))
          );
          const differenceCount = checks.filter(check => check.status !== "Match").length;
          return { financialYear, yearRecords, checks, differenceCount };
        });

      const allChecks = yearGroups.flatMap(group => group.checks);
      const reconciliationPageSize = 6;
      const reconciliationPageCount = Math.ceil(yearGroups.length / reconciliationPageSize);
      const safeReconciliationPage = Math.min(reconciliationPage, Math.max(0, reconciliationPageCount - 1));
      const visibleYearGroups = yearGroups.slice(
        safeReconciliationPage * reconciliationPageSize,
        (safeReconciliationPage + 1) * reconciliationPageSize
      );
      const refundChecks = yearGroups.flatMap(group =>
        group.checks
          .filter(check => check.label === "Expected Refund / (Tax Payable)")
          .map(check => ({ ...check, financialYear: group.financialYear }))
      );
      const netRefundVariance = refundChecks.reduce((total, check) => total + check.difference, 0);
      const refundYears = [...new Set(refundChecks.map(check => check.financialYear))];
      const formatVariance = value =>
        value > 0 ? `+${money(value)}` : value < 0 ? `−${money(Math.abs(value))}` : money(0);
      const getStatusLabel = status =>
        status === "Match" ? "Matched" : status === "Excess" ? "Assessed higher ▲" : "Assessed lower ▼";
      const companyName = rows.find(record => record.name)?.name || "Talent Corner HR Services Pvt. Ltd.";

      return (
        <div className="trs-content trs-tc-reconciliation">
          <style>{`
            .trs-tc-reconciliation { min-width: 0; }
            .trs-tc-recon-card {
              background: #fffdf8;
              border: 1px solid #e7ddc9;
              border-radius: 18px;
              padding: 24px 30px 28px;
              color: #172342;
              box-shadow: 0 2px 8px rgba(43, 34, 15, .035);
            }
            .trs-tc-recon-heading {
              display: flex; justify-content: space-between; align-items: flex-start;
              gap: 20px; margin-bottom: 16px;
            }
            .trs-tc-recon-heading h2 {
              margin: 0; color: #172342; font-size: 28px; line-height: 1.25; font-weight: 750;
            }
            .trs-tc-recon-heading p { margin: 6px 0 0; color: #817c6d; font-size: 15px; }
            .trs-tc-recon-legend {
              color: #817c6d; font-size: 13px; text-align: right; line-height: 1.9; white-space: nowrap;
            }
            .trs-tc-recon-rule { width: 64px; height: 3px; background: #bd922d; margin: 0 0 16px; }
            .trs-tc-recon-scroll {
              width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
              overscroll-behavior-x: contain;
            }
            .trs-tc-recon-table {
              width: 100%; min-width: 820px; border-collapse: collapse; table-layout: fixed;
            }
            .trs-tc-recon-table thead th {
              padding: 18px 16px; background: #112044; color: #f3ca6e;
              font-size: 13px; font-weight: 750; text-align: left; letter-spacing: .02em;
              border: 0; white-space: nowrap;
            }
            .trs-tc-recon-table thead th:first-child { width: 30%; }
            .trs-tc-recon-table thead th:nth-child(2) { width: 14%; text-align: right; }
            .trs-tc-recon-table thead th:nth-child(3) { width: 17%; text-align: right; }
            .trs-tc-recon-table thead th:nth-child(4) { width: 15%; text-align: right; }
            .trs-tc-recon-table thead th:nth-child(5) { width: 20%; }
            .trs-tc-recon-table tbody td {
              padding: 17px 16px; border-bottom: 1px solid #e8dfce; color: #172342;
              font-size: 14px; line-height: 1.45; vertical-align: middle; white-space: nowrap;
            }
            .trs-tc-recon-table tbody tr:not(.trs-tc-year-row) td:first-child { padding-left: 25px; }
            .trs-tc-recon-table .trs-tc-number { text-align: right; font-variant-numeric: tabular-nums; }
            .trs-tc-year-row td {
              background: #f3e9cc; border-bottom: 0 !important; border-left: 5px solid #bd922d;
              padding: 13px 20px !important; color: #112044 !important; font-size: 15px !important;
            }
            .trs-tc-year-title { font-weight: 800; margin-right: 12px; }
            .trs-tc-diff-count {
              display: inline-block; border-radius: 20px; background: #fffdf8; color: #c63229;
              padding: 4px 12px; font-size: 13px; font-weight: 750;
            }
            .trs-tc-year-note { float: right; color: #817c6d; font-size: 13px; font-weight: 400; }
            .trs-tc-variance {
              display: inline-block; min-width: 112px; text-align: right; border-radius: 9px;
              padding: 4px 9px; font-size: 14px; font-weight: 800;
            }
            .trs-tc-variance.lower { color: #bd3029; background: #f8e0db; }
            .trs-tc-variance.higher { color: #205da4; background: #dce7f7; }
            .trs-tc-variance.match { color: #14734e; background: transparent; }
            .trs-tc-status { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 750; }
            .trs-tc-status::before { content: ''; width: 11px; height: 11px; border-radius: 50%; display: inline-block; background: currentColor; }
            .trs-tc-status.lower { color: #bd3029; }
            .trs-tc-status.higher { color: #205da4; }
            .trs-tc-status.match { color: #14734e; }
            .trs-tc-recon-footer {
              border-top: 2px solid #bd922d; margin-top: 0; padding-top: 18px;
              color: #817c6d; font-size: 13px; line-height: 1.6;
            }
            .trs-tc-pagination {
              display: flex; justify-content: space-between; align-items: center; gap: 12px;
              padding: 14px 2px; color: #817c6d; font-size: 13px;
            }
            .trs-tc-pagination-actions { display: flex; align-items: center; gap: 10px; }
            .trs-tc-pagination-actions button {
              border: 1px solid #d8c9a8; border-radius: 7px; background: #fffdf8;
              color: #172342; padding: 7px 12px; font-weight: 650; cursor: pointer;
            }
            .trs-tc-pagination-actions button:disabled { opacity: .45; cursor: not-allowed; }
            @media (max-width: 600px) {
              .trs-tc-pagination { align-items: flex-start; flex-direction: column; }
              .trs-tc-pagination-actions { width: 100%; justify-content: space-between; }
            }
            .trs-tc-recon-empty { padding: 24px 12px !important; text-align: center; color: #817c6d !important; }
            @media (max-width: 760px) {
              .trs-tc-recon-card { padding: 18px 14px 20px; border-radius: 12px; }
              .trs-tc-recon-heading { display: block; }
              .trs-tc-recon-heading h2 { font-size: 21px; }
              .trs-tc-recon-legend { text-align: left; margin-top: 8px; white-space: normal; }
              .trs-tc-recon-table { min-width: 800px; }
              .trs-tc-recon-table thead th, .trs-tc-recon-table tbody td { padding: 11px 12px; }
              .trs-tc-year-note { float: none; display: block; margin-top: 5px; }
            }
          `}</style>

          <section className="trs-tc-recon-card">
            <div className="trs-tc-recon-heading">
              <div>
                <h2>{companyName}</h2>
                <p>ITR vs Assessment comparison</p>
              </div>
              <div className="trs-tc-recon-legend">
                <div>Difference = Assessment − ITR</div>
                <div>▲ assessed higher &nbsp; ▼ assessed lower &nbsp; ● matched</div>
              </div>
            </div>
            <div className="trs-tc-recon-rule" />

            <div className="trs-tc-recon-scroll" role="region" aria-label="Talent Corner tax reconciliation table. Scroll horizontally to view all columns." tabIndex={0}>
              <table className="trs-tc-recon-table">
                <thead>
                  <tr>
                    <th>PARTICULAR</th>
                    <th>ITR DATA</th>
                    <th>ASSESSMENT DATA</th>
                    <th>DIFFERENCE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleYearGroups.length ? visibleYearGroups.map(group => (
                    <React.Fragment key={group.financialYear}>
                      <tr className="trs-tc-year-row">
                        <td colSpan={5}>
                          <span className="trs-tc-year-title">FY {group.financialYear}</span>
                          <span className="trs-tc-diff-count">
                            {group.differenceCount === 0
                              ? `All ${group.checks.length} matched`
                              : group.checks.length === 1
                                ? "1 difference"
                                : `${group.differenceCount} of ${group.checks.length} differ`}
                          </span>
                          {group.checks.length === 1 && group.checks[0].label === "Income" && (
                            <span className="trs-tc-year-note">Only Income row available in source</span>
                          )}
                        </td>
                      </tr>
                      {group.checks.map((check, index) => {
                        const tone = check.status === "Match" ? "match" : check.status === "Excess" ? "higher" : "lower";
                        return (
                          <tr key={`${group.financialYear}-${check.taxpayerName || "taxpayer"}-${check.label}-${index}`}>
                            <td>{check.label}</td>
                            <td className="trs-tc-number">{money(check.itr)}</td>
                            <td className="trs-tc-number">{money(check.assessment)}</td>
                            <td className="trs-tc-number">
                              <span className={`trs-tc-variance ${tone}`}>{formatVariance(check.difference)}</span>
                            </td>
                            <td><span className={`trs-tc-status ${tone}`}>{getStatusLabel(check.status)}</span></td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  )) : (
                    <tr><td colSpan={5} className="trs-tc-recon-empty">No records available for reconciliation.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {reconciliationPageCount > 1 && (
              <div className="trs-tc-pagination" aria-label="Tax reconciliation pagination">
                <span>Showing {safeReconciliationPage * reconciliationPageSize + 1}–{Math.min((safeReconciliationPage + 1) * reconciliationPageSize, yearGroups.length)} of {yearGroups.length} financial years</span>
                <div className="trs-tc-pagination-actions">
                  <button type="button" onClick={() => setReconciliationPage(current => Math.max(0, current - 1))} disabled={safeReconciliationPage === 0}>Previous</button>
                  <span>Page {safeReconciliationPage + 1} of {reconciliationPageCount}</span>
                  <button type="button" onClick={() => setReconciliationPage(current => Math.min(reconciliationPageCount - 1, current + 1))} disabled={safeReconciliationPage >= reconciliationPageCount - 1}>Next</button>
                </div>
              </div>
            )}

            <p className="trs-note">
              Note: This is a preliminary comparison using the fields currently stored in your database. It is not an official tax assessment or 26AS/AIS verification.
            </p>
          </section>
        </div>
      );
    }

    return <DoshiReconciliation rows={rows} />;
  };

  const renderYearAnalysis = () => {
    const years = FINANCIAL_YEARS.map(year => {
      const list = records.filter(
        record =>
          record.financialYear === year.financialYear
      );

      return {
        ...year,
        count: list.length,
        income: list.reduce(
          (total, record) =>
            total + num(record.grossIncome),
          0
        ),
        tax: list.reduce(
          (total, record) =>
            total + num(record.taxPayable),
          0
        ),
        tds: list.reduce(
          (total, record) =>
            total + num(record.tdsClaim),
          0
        ),
        refund: list.reduce(
          (total, record) =>
            total + num(record.refundDue),
          0
        ),
      };
    });

    const recordedYears = years.filter(year => year.count > 0);

    const totalReturns = recordedYears.reduce(
      (total, year) => total + year.count,
      0
    );

    const totalIncome = recordedYears.reduce(
      (total, year) => total + year.income,
      0
    );

    const totalTax = recordedYears.reduce(
      (total, year) => total + year.tax,
      0
    );

    const totalRefund = recordedYears.reduce(
      (total, year) => total + year.refund,
      0
    );

    // Trend chart scale: fixed ₹10 lakh intervals, rounded up to fit data.
    const maxIncomeValue = Math.max(0, ...years.map(year => year.income));
    const yAxisMax = Math.max(
      10_00_000,
      Math.ceil(maxIncomeValue / 10_00_000) * 10_00_000
    );
    const yAxisStep = 10_00_000;
    const chart = {
      width: Math.max(900, years.length * 58),
      height: 340,
      left: 76,
      right: 24,
      top: 22,
      bottom: 68,
    };
    const plotWidth = chart.width - chart.left - chart.right;
    const plotHeight = chart.height - chart.top - chart.bottom;
    const chartX = index =>
      chart.left + (years.length <= 1 ? plotWidth / 2 : (index / (years.length - 1)) * plotWidth);
    const chartY = value =>
      chart.top + plotHeight - (value / yAxisMax) * plotHeight;
    const plottedPoints = years.map((year, index) => ({
      ...year,
      x: chartX(index),
      y: chartY(year.income),
      hasData: year.count > 0,
    }));
    // Break the line across years with no saved records instead of treating them as zero.
    const trendSegments = [];
    let currentSegment = [];
    plottedPoints.forEach(point => {
      if (point.hasData) {
        currentSegment.push(point);
      } else if (currentSegment.length) {
        trendSegments.push(currentSegment);
        currentSegment = [];
      }
    });
    if (currentSegment.length) trendSegments.push(currentSegment);

    const latest = recordedYears[recordedYears.length - 1];
    const previous = recordedYears[recordedYears.length - 2];

    const incomeChange =
      latest && previous
        ? latest.income - previous.income
        : null;

    return (
      <div className="trs-content trs-analysis-page">
        <div className="trs-page-heading">
          <div>
            <span className="trs-eyebrow">
              PERIOD-WISE ANALYSIS
            </span>
            <h2>Financial Year Analysis</h2>
            <p>
              Understand how income, tax, TDS and refunds change
              across financial years.
            </p>
          </div>

          <span className="trs-summary-chip">
            {years.length} financial years tracked
          </span>
        </div>

        <div className="trs-analysis-hero">
          <div>
            <span className="trs-analysis-kicker">
              PORTFOLIO OVERVIEW
            </span>
            <h3>Financial performance at a glance</h3>
            <p>
              Figures are aggregated from the saved ITR records
              available in this module.
            </p>
          </div>

          <div className="trs-analysis-hero-mark">₹</div>
        </div>

        <div className="trs-analysis-stats">
          <StatCard
            label="Total Returns"
            value={totalReturns.toLocaleString("en-IN")}
            note="Saved ITR records"
            icon="▤"
          />

          <StatCard
            label="Gross Income"
            value={money(totalIncome)}
            note="Across tracked years"
            icon="₹"
          />

          <StatCard
            label="Tax Payable"
            value={money(totalTax)}
            note="Recorded tax liability"
            icon="▣"
          />

          <StatCard
            label="Expected Refund / (Tax Payable)"
            value={money(totalRefund)}
            note="Based on TDS less tax"
            icon="↗"
          />
        </div>

        <div className="trs-analysis-grid">
          <section className="trs-panel trs-analysis-chart-panel">
            <div className="trs-panel-heading">
              <div>
                <span className="trs-panel-kicker">
                  YEARLY TREND
                </span>
                <h3>Gross income by financial year</h3>
                <p>
                  Compare total gross income recorded for each FY.
                </p>
              </div>

              <span className="trs-panel-icon">▥</span>
            </div>

            {years.length ? (
              <>
              <style>{incomeTrendStyles}</style>
              <div className="trs-income-trend-scroll">
                <svg
                  className="trs-income-trend-svg"
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  role="img"
                  aria-label="Gross income trend by financial year, with Y-axis in lakhs and ten-lakh intervals"
                >
                  {Array.from(
                    { length: Math.floor(yAxisMax / yAxisStep) + 1 },
                    (_, index) => index * yAxisStep
                  ).map(value => {
                    const y = chartY(value);
                    return (
                      <g key={value}>
                        <line
                          x1={chart.left}
                          y1={y}
                          x2={chart.width - chart.right}
                          y2={y}
                          stroke="#D9D5CC"
                          strokeDasharray="4 5"
                          strokeWidth="1"
                        />
                        <text
                          x={chart.left - 12}
                          y={y + 4}
                          textAnchor="end"
                          className="trs-income-trend-axis-label"
                        >
                          ₹{value / 1_00_000}L
                        </text>
                      </g>
                    );
                  })}

                  <line
                    x1={chart.left}
                    y1={chart.top}
                    x2={chart.left}
                    y2={chart.height - chart.bottom}
                    stroke="#A9A397"
                  />
                  <line
                    x1={chart.left}
                    y1={chart.height - chart.bottom}
                    x2={chart.width - chart.right}
                    y2={chart.height - chart.bottom}
                    stroke="#A9A397"
                  />

                  {trendSegments.map((segment, segmentIndex) => (
                    <g key={`segment-${segmentIndex}`}>
                      {segment.length > 1 && (
                        <polyline
                          points={segment.map(point => `${point.x},${point.y}`).join(" ")}
                          fill="none"
                          stroke="#3976A8"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {segment.map(point => (
                        <circle
                          key={point.financialYear}
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill="#3976A8"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        >
                          <title>{`FY ${point.financialYear} · Gross income: ${money(point.income)} · ${point.count} ${point.count === 1 ? "return" : "returns"}`}</title>
                        </circle>
                      ))}
                    </g>
                  ))}

                  {plottedPoints.map((point, index) => (
                    <text
                      key={`year-${point.financialYear}`}
                      x={point.x}
                      y={chart.height - chart.bottom + 24}
                      textAnchor="end"
                      transform={`rotate(-42 ${point.x} ${chart.height - chart.bottom + 24})`}
                      className="trs-income-trend-year-label"
                    >
                      {point.financialYear}
                    </text>
                  ))}
                </svg>
              </div>
              </>
            ) : (
              <div className="trs-empty-cell">
                Add records to view the financial year trend.
              </div>
            )}

            <div className="trs-analysis-chart-note trs-income-trend-legend">
              <i />
              Gross income trend · Y-axis interval ₹10 lakh · Hover over a point for details
              <small>Years without saved records are shown as gaps in the trend.</small>
            </div>
          </section>

          <section className="trs-panel trs-analysis-insight-panel">
            <span className="trs-panel-kicker">
              LATEST AVAILABLE YEAR
            </span>

            {latest ? (
              <>
                <h3>FY {latest.financialYear}</h3>

                <p className="trs-analysis-ay">
                  Assessment Year {latest.assessmentYear}
                </p>

                <div className="trs-analysis-highlight">
                  <span>Gross income</span>
                  <strong>{money(latest.income)}</strong>
                </div>

                <div className="trs-analysis-mini-row">
                  <span>Returns recorded</span>
                  <b>{latest.count}</b>
                </div>

                <div className="trs-analysis-mini-row">
                  <span>Tax payable</span>
                  <b>{money(latest.tax)}</b>
                </div>

                <div className="trs-analysis-mini-row">
                  <span>TDS claimed</span>
                  <b>{money(latest.tds)}</b>
                </div>

                <div className="trs-analysis-mini-row">
                  <span>Refund due</span>
                  <b className="trs-amount-good">
                    {money(latest.refund)}
                  </b>
                </div>

                {incomeChange !== null && (
                  <div
                    className={`trs-analysis-change ${
                      incomeChange >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {incomeChange >= 0 ? "↑" : "↓"}{" "}
                    {money(Math.abs(incomeChange))}{" "}
                    {incomeChange >= 0 ? "higher" : "lower"}{" "}
                    than the previous recorded FY
                  </div>
                )}
              </>
            ) : (
              <div className="trs-empty-cell">
                No financial year data available.
              </div>
            )}
          </section>
        </div>

        <section className="trs-panel trs-analysis-table-panel">
          <div className="trs-panel-heading">
            <div>
              <span className="trs-panel-kicker">
                DETAILED BREAKDOWN
              </span>
              <h3>FY and AY comparison</h3>
              <p>
                Aggregated values for each financial year with
                saved records.
              </p>
            </div>
          </div>

          <div className="trs-table-wrap">
            <table className="trs-table">
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Assessment Year</th>
                  <th>Returns</th>
                  <th>Gross Income</th>
                  <th>Tax Payable</th>
                  <th>TDS Claimed</th>
                  <th>Expected Refund / (Tax Payable)</th>
                </tr>
              </thead>

              <tbody>
                {years.slice().reverse().map(year => (
                  <tr key={year.financialYear}>
                    <td>
                      <b>FY {year.financialYear}</b>
                    </td>
                    <td>AY {year.assessmentYear}</td>
                    <td>{year.count}</td>
                    <td>{money(year.income)}</td>
                    <td>{money(year.tax)}</td>
                    <td>{money(year.tds)}</td>
                    <td className="trs-amount-good">
                      {money(year.refund)}
                    </td>
                  </tr>
                ))}

                {!years.length && (
                  <tr>
                    <td
                      colSpan="7"
                      className="trs-empty-cell"
                    >
                      No financial year data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="trs-note">
          Note: Expected refund / (tax payable) is calculated as TDS Claimed less
          Tax Payable. A negative result indicates a tax-payable balance.
        </p>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="trs-content">
      <div className="trs-page-heading">
        <div>
          <span className="trs-eyebrow">
            APPLICATION CONTROL
          </span>
          <h2>Settings & Data Management</h2>
          <p>
            Review application configuration and connected data.
          </p>
        </div>
      </div>

      <div className="trs-settings-grid">
        <section className="trs-panel trs-setting-card">
          <span className="trs-setting-icon">↻</span>
          <h3>Refresh application data</h3>
          <p>
            Fetch the latest taxpayer records from the connected API.
          </p>

          <button
            className="trs-light-btn"
            onClick={loadAllRecords}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh records"}
          </button>
        </section>

        <section className="trs-panel trs-setting-card">
          <span className="trs-setting-icon">▤</span>
          <h3>Data overview</h3>
          <p>
            <b>{allRecords.length}</b> records currently loaded:{" "}
            {DATA_CATEGORIES.map(
              (name, index) =>
                `${index ? " · " : ""}${name} ${
                  allRecords.filter(
                    record => record.dataCategory === name
                  ).length
                }`
            )}
            {unclassifiedCount
              ? ` · Unclassified ${unclassifiedCount}`
              : ""}
            . Records are stored through your configured backend.
          </p>

          <span className="trs-setting-foot">
            Taxpayer records · Database
          </span>
        </section>

        <section className="trs-panel trs-setting-card">
          <span className="trs-setting-icon">⚙</span>
          <h3>Application configuration</h3>
          <p>
            Financial years, ITR form types and filing statuses
            are currently managed in the application.
          </p>

          <span className="trs-setting-foot">
            Import, backup automation and editable configuration
            require backend support.
          </span>
        </section>
      </div>
    </div>
  );

  const renderReports = () => {
    const reportRecords = records.filter(record => {
      const matchesFY =
        reportFY === "all" ||
        record.financialYear === reportFY;

      const matchesStatus =
        reportStatus === "all" ||
        record.filingStatus === reportStatus;

      const matchesType =
        reportType === "all" ||
        record.formType === reportType;

      return matchesFY && matchesStatus && matchesType;
    });

    const reportTotals = reportRecords.reduce(
      (acc, record) => {
        acc.gross += num(record.grossIncome);
        acc.tax += num(record.taxPayable);
        acc.tds += num(record.tdsClaim);
        acc.refundDue += num(record.refundDue);
        acc.refundAmount += num(record.refundAmountBeforeInterest) + num(record.interest);

        return acc;
      },
      {
        gross: 0,
        tax: 0,
        tds: 0,
        refundDue: 0,
        refundAmount: 0,
      }
    );

    return (
      <div className="trs-content trs-reports-page">
        <div className="trs-page-heading">
          <div>
            <span className="trs-eyebrow">
              REPORT CENTRE
            </span>
            <h2>Financial Reports</h2>
            <p>
              Filter saved tax return records and review a report
              for your selected period.
            </p>
          </div>
        </div>

        <section className="trs-panel trs-report-filter-panel">
          <div className="trs-panel-heading">
            <div>
              <span className="trs-panel-kicker">
                REPORT CONFIGURATION
              </span>
              <h3>Choose report filters</h3>
              <p>
                Apply filters to the summary and detailed report below.
              </p>
            </div>
          </div>

          <div className="trs-report-filters">
            <label>
              Financial Year

              <select
                value={reportFY}
                onChange={event =>
                  setReportFY(event.target.value)
                }
              >
                <option value="all">
                  All Financial Years
                </option>

                {FINANCIAL_YEARS.filter(year =>
                  records.some(
                    record =>
                      record.financialYear === year.financialYear
                  )
                ).map(year => (
                  <option
                    key={year.financialYear}
                    value={year.financialYear}
                  >
                    FY {year.financialYear}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Filing Status

              <select
                value={reportStatus}
                onChange={event =>
                  setReportStatus(event.target.value)
                }
              >
                <option value="all">All Statuses</option>

                {FILING_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              ITR Form

              <select
                value={reportType}
                onChange={event =>
                  setReportType(event.target.value)
                }
              >
                <option value="all">All ITR Forms</option>

                {FORM_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="trs-light-btn"
              type="button"
              onClick={() => {
                setReportFY("all");
                setReportStatus("all");
                setReportType("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        </section>

        <div className="trs-report-result-head">
          <div>
            <b>Report summary · {category}</b>
            <span>
              {reportRecords.length} matching{" "}
              {reportRecords.length === 1
                ? "record"
                : "records"}
            </span>
          </div>

          <span className="trs-summary-chip">
            {reportFY === "all"
              ? "All years"
              : `FY ${reportFY}`}
          </span>
        </div>

        <div className="trs-report-stats">
          <StatCard
            label="Gross Income"
            value={money(reportTotals.gross)}
            note="Filtered records"
            icon="₹"
          />

          <StatCard
            label="Tax Liability"
            value={money(reportTotals.tax)}
            note="Recorded tax payable"
            icon="▣"
          />

          <StatCard
            label="TDS Claimed"
            value={money(reportTotals.tds)}
            note="Filtered records"
            icon="▤"
          />

          <StatCard
            label="Expected Refund / (Tax Payable)"
            value={money(reportTotals.refundDue)}
            note="TDS claimed less tax payable; negative means payable"
            icon="↗"
          />
        </div>

        <section className="trs-panel trs-report-table-panel">
          <div className="trs-panel-heading">
            <div>
              <span className="trs-panel-kicker">
                RECORD DETAIL
              </span>
              <h3>Tax return report</h3>
              <p>
                Detailed records matching the selected filters.
              </p>
            </div>
          </div>

          <div className="trs-table-wrap">
            <table className="trs-table">
              <thead>
                <tr>
                  <th>Taxpayer</th>
                  <th>FY / AY</th>
                  <th>ITR Form</th>
                  <th>Filing Status</th>
                  <th>Gross Income</th>
                  <th>Tax Payable</th>
                  <th>TDS Claimed</th>
                  <th>Expected Refund / (Tax Payable)</th>
                </tr>
              </thead>

              <tbody>
                {reportRecords.map((record, index) => (
                  <tr
                    key={
                      record.id ??
                      `${record.name}-${record.financialYear}-${index}`
                    }
                  >
                    <td>
                      <b>{record.name || "—"}</b>
                      <small className="trs-report-ack">
                        {record.acknowledgementNumber ||
                          "No acknowledgement number"}
                      </small>
                    </td>

                    <td>
                      {record.financialYear || "—"}
                      <small className="trs-report-ack">
                        AY {record.assessmentYear || "—"}
                      </small>
                    </td>

                    <td>{record.formType || "—"}</td>
                    <td>{record.filingStatus || "—"}</td>
                    <td>{money(record.grossIncome)}</td>
                    <td>{money(record.taxPayable)}</td>
                    <td>{money(record.tdsClaim)}</td>

                    <td className="trs-amount-good">
                      {money(record.refundDue)}
                    </td>
                  </tr>
                ))}

                {!reportRecords.length && (
                  <tr>
                    <td
                      colSpan="8"
                      className="trs-empty-cell"
                    >
                      No records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="trs-note">
          Report values are based on the fields currently stored
          in Tax Return Summary. Outstanding tax is not calculated
          because advance-tax and self-assessment-tax payment
          fields are not part of the current record structure.
        </p>
      </div>
    );
  };

  const openCategory = name => {
    switchCategory(name);
    resetForm();
    setPage("dashboard");
    setShowHome(false);
  };

  const renderHome = () => {
    const sectionInfo = {
      "Talent Corner": {
        icon: "▣",
        description: "Company tax records",
        uniqueLabel: "Companies",
      },
      "Doshi Family": {
        icon: "◉",
        description: "Individual and HUF tax records",
        uniqueLabel: "Members",
      },
    };

    return (
      <div className="trs-content trs-home">
        <div className="trs-page-heading">
          <div>
            <span className="trs-eyebrow">TAX RETURN SUMMARY</span>
            <h2>Choose a section</h2>
            <p>Open a dashboard to view and manage its tax returns.</p>
          </div>

          <button
            className="trs-light-btn"
            onClick={loadAllRecords}
            disabled={loading}
          >
            ↻ {loading ? "Refreshing" : "Refresh data"}
          </button>
        </div>

        {dashboardError && (
          <div className="tax-message error">{dashboardError}</div>
        )}

        <div className="trs-home-grid">
          {DATA_CATEGORIES.map(name => {
            const list = allRecords.filter(
              record => record.dataCategory === name
            );
            const stats = taxpayerStats(list);
            const latest = [...list].sort((a, b) =>
              String(b.financialYear).localeCompare(
                String(a.financialYear)
              )
            )[0];

            return (
              <button
                key={name}
                type="button"
                className="trs-home-card"
                onClick={() => openCategory(name)}
              >
                <div className="trs-home-card-head">
                  <span className="trs-stat-icon">
                    {sectionInfo[name].icon}
                  </span>
                  <strong>{name}</strong>
                </div>

                <p>{sectionInfo[name].description}</p>

                <div className="trs-home-card-stats">
                  <div>
                    <b>{stats.returnRecords}</b>
                    <span>Return records</span>
                  </div>

                  <div>
                    <b>{stats.uniqueTaxpayers}</b>
                    <span>{sectionInfo[name].uniqueLabel}</span>
                  </div>

                  {stats.withoutPan > 0 && (
                    <div>
                      <b className="trs-amber-text">
                        {stats.withoutPan}
                      </b>
                      <span>PAN missing</span>
                    </div>
                  )}
                </div>

                <small>
                  {latest
                    ? `Latest: FY ${latest.financialYear} · ${
                        latest.filingStatus || "Draft"
                      }`
                    : "No records yet"}
                </small>

                <span className="trs-home-card-open">
                  Open dashboard →
                </span>
              </button>
            );
          })}
        </div>

        {unclassifiedCount > 0 && (
          <div className="tax-message error">
            {unclassifiedCount} saved record(s) have no category and are not
            shown in either section. Set their data_category in the database.
          </div>
        )}
      </div>
    );
  };

  const sectionNavigation = [
    ["dashboard", "▦", "Dashboard"],
    ["entry", "+", "Add ITR"],
    ["records", "▤", "Taxpayer Records"],
    ["reconciliation", "⇄", "Tax Reconciliation"],
    ["analysis", "▥", "FY Analysis"],
    ["reports", "▧", "Reports"],
    ["settings", "⚙", "Settings"],
  ];

  const pageTitles = {
    dashboard: "Dashboard",
    entry: "Add ITR",
    records: "Taxpayer Records",
    reconciliation: "Tax Reconciliation",
    analysis: "Financial Year Analysis",
    reports: "Reports",
    settings: "Settings & Data Management",
  };

  const navigateTo = key => {
    setPage(key);
    setMessage("");

    if (
      [
        "records",
        "reconciliation",
        "analysis",
        "reports",
        "settings",
      ].includes(key)
    ) {
      loadAllRecords();
    }
  };

  return (
    <div className="trs-app">
      <main className="trs-main">
        <header className="trs-topbar">
          <div className="trs-module-heading">
            <div className="trs-module-mark">₹</div>

            <div>
              <strong>Tax Return Summary</strong>
              <span>Tax Ledger · Return Management</span>
            </div>
          </div>

          <div className="trs-topbar-context">
            <span className="trs-live-dot" />
            <span>Data management</span>
          </div>
        </header>

        {!showHome && (
          <div className="trs-category-bar">
            <button
              type="button"
              className="trs-light-btn"
              onClick={() => {
                resetForm();
                setShowHome(true);
              }}
            >
              ← All sections
            </button>

            <span className="trs-summary-chip">{category}</span>
          </div>
        )}

        {showHome ? renderHome() : (
          <>
        <nav
          className="trs-section-nav"
          aria-label="Tax Return Summary sections"
        >
          {sectionNavigation.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              className={page === key ? "active" : ""}
              aria-current={
                page === key ? "page" : undefined
              }
              onClick={() => navigateTo(key)}
            >
              <span
                className="trs-section-nav-icon"
                aria-hidden="true"
              >
                {icon}
              </span>

              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="trs-workspace-heading">
          <div>
            <span>WORKSPACE</span>
            <b>{pageTitles[page]}</b>
          </div>

          <span className="trs-workspace-status">
            <i />
            {category}
          </span>
        </div>

        {page === "dashboard" && renderDashboard()}
        {page === "entry" && renderEntry()}
        {page === "records" && renderRecords()}
        {page === "reconciliation" &&
          renderReconciliation()}
        {page === "analysis" && renderYearAnalysis()}
        {page === "reports" && renderReports()}
        {page === "settings" && renderSettings()}

          </>
        )}

        <footer className="trs-footer">
          Tax Return Summary <span>•</span> Saarthi Financial - Past
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Taxpayer Records: ITR table + record detail popup                   */
/* ------------------------------------------------------------------ */

const TR_PAGE_SIZE = 10;

const trFyStart = value => {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : -1;
};

const trSigned = value =>
  value < 0 ? `−${money(Math.abs(value))}` : money(value);

// Dates arrive as "2021-10-12" or a full ISO timestamp. Read the calendar
// date directly so a time-zone shift can never move it to another day.
const trDate = value => {
  const text = String(value || "").trim();
  if (!text) return "—";
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}` : text;
};

const trInitials = name =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase() || "–";

const trHasAssessment = record =>
  [
    record.totalAssessedIncome,
    record.totalAssessedTaxPayable,
    record.tdsCredit,
    record.refundAmountBeforeInterest,
    record.interest,
  ].some(value => num(value) !== 0) ||
  Boolean(String(record.orderType || "").trim()) ||
  Boolean(record.dateOfOrder);

// Differs = assessed income or tax not equal to the ITR figure.
const trResult = record => {
  if (!trHasAssessment(record)) return "none";
  const sameIncome =
    Math.round(num(record.totalAssessedIncome) - num(record.grossIncome)) === 0;
  const sameTax =
    Math.round(num(record.totalAssessedTaxPayable) - num(record.taxPayable)) === 0;
  return sameIncome && sameTax ? "matched" : "differs";
};

const TR_RESULT_LABEL = {
  matched: "Matched",
  differs: "Differs",
  none: "No assessment",
};

const trNetRefund = record =>
  num(record.refundAmountBeforeInterest) + num(record.interest);

const trDelta = (itr, assessed) => {
  const diff = assessed - itr;
  const tone = Math.round(diff) === 0 ? "same" : diff > 0 ? "higher" : "lower";
  const amount =
    tone === "same"
      ? "Matches ITR"
      : `${diff > 0 ? "▲ +" : "▼ −"}${money(Math.abs(diff))}`;
  return { tone, amount };
};

const trFilingTone = status => {
  const value = String(status || "Draft").toLowerCase();
  if (value === "defective") return "red";
  if (value === "draft") return "grey";
  return "blue";
};

function TrField({ label, value, sub, tone, strong }) {
  return (
    <div className={`trs-tr-field${strong ? " strong" : ""}`}>
      <span>{label}</span>
      <b>{value || "—"}</b>
      {sub && <small className={tone ? `tone-${tone}` : ""}>{sub}</small>}
    </div>
  );
}

function TrRecordDialog({ record, onClose, onEdit, onDownload }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const assessed = trHasAssessment(record);
  const result = trResult(record);

  // Keep focus inside the dialog, close on Escape, lock page scroll, and
  // return focus to the button that opened it.
  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = event => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        "button:not([disabled]), [href], select, input, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [onClose]);

  const income = trDelta(num(record.grossIncome), num(record.totalAssessedIncome));
  const tax = trDelta(num(record.taxPayable), num(record.totalAssessedTaxPayable));

  return createPortal(
    <div
      className="trs-tr-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="trs-tr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trs-tr-dialog-title"
        ref={dialogRef}
      >
        <header className="trs-tr-dialog-head">
          <div className="trs-tr-dialog-title">
            <div className="trs-tr-title-row">
              <h3 id="trs-tr-dialog-title">FY {record.financialYear || "—"}</h3>
              <span className={`trs-tr-pill ${trFilingTone(record.filingStatus)}`}>
                {record.filingStatus || "Draft"}
              </span>
              {assessed && (
                <span className={`trs-tr-pill result-${result}`}>
                  {TR_RESULT_LABEL[result]}
                </span>
              )}
            </div>
            <p>
              {record.name || "Unnamed taxpayer"} · Assessment Year{" "}
              {record.assessmentYear || "—"}
            </p>
          </div>

          <div className="trs-tr-dialog-actions">
            <button type="button" className="trs-tr-btn outline" onClick={() => onEdit(record)}>
              Edit
            </button>
            <button type="button" className="trs-tr-btn solid" onClick={() => onDownload(record)}>
              ↓ Download
            </button>
            <button
              type="button"
              className="trs-tr-close"
              onClick={onClose}
              ref={closeRef}
              aria-label="Close record details"
            >
              ×
            </button>
          </div>
        </header>

        <div className="trs-tr-dialog-body">
          <section className="trs-tr-section">
            <h4>Return details</h4>
            <div className="trs-tr-grid">
              <TrField label="Taxpayer" value={record.name} />
              <TrField label="PAN" value={record.pan} />
              <TrField label="Category" value={record.dataCategory} />
              <TrField label="Financial year" value={record.financialYear} />
              <TrField label="Assessment year" value={record.assessmentYear} />
              <TrField label="ITR form" value={record.formType} />
              <TrField label="Filing status" value={record.filingStatus || "Draft"} />
              <TrField label="Filing date" value={trDate(record.itrFilingDate)} />
              <TrField label="Acknowledgement no." value={record.acknowledgementNumber} />
            </div>
          </section>

          <section className="trs-tr-section">
            <h4>ITR figures</h4>
            <div className="trs-tr-grid">
              <TrField label="Gross income" value={money(record.grossIncome)} />
              <TrField label="Tax payable" value={money(record.taxPayable)} />
              <TrField label="TDS claimed" value={money(record.tdsClaim)} />
              <TrField label="Expected refund / (tax payable)" value={trSigned(num(record.refundDue))} />
              <TrField label="Refund process" value={record.refundProcess} />
            </div>
          </section>

          <section className="trs-tr-section">
            <h4>Assessment details</h4>
            {assessed ? (
              <>
                <div className="trs-tr-grid">
                  <TrField label="Order type" value={record.orderType} />
                  <TrField label="Date of order" value={trDate(record.dateOfOrder)} />
                  <TrField label="Assessed income" value={money(record.totalAssessedIncome)} sub={income.amount} tone={income.tone} />
                  <TrField label="Assessed tax payable" value={money(record.totalAssessedTaxPayable)} sub={tax.amount} tone={tax.tone} />
                  <TrField label="TDS credit" value={money(record.tdsCredit)} />
                  <TrField label="Refund before interest" value={money(record.refundAmountBeforeInterest)} />
                  <TrField label="Interest" value={money(record.interest)} />
                </div>
                <div className="trs-tr-net">
                  <span>Net refund</span>
                  <strong>{money(trNetRefund(record))}</strong>
                </div>
              </>
            ) : (
              <p className="trs-tr-note">
                No assessment order has been recorded for this year. Choose
                Edit to add the order details.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TaxpayerRecordsExplorer({
  records,
  allRecords,
  fyFilter,
  onFyFilter,
  statusFilter,
  onStatusFilter,
  onExportPdf,
  onExportCsv,
  onEdit,
  onDownload,
}) {
  const [taxpayerSel, setTaxpayerSel] = useState("");
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null);
  const closeDialog = useCallback(() => setViewing(null), []);

  // One group per taxpayer, newest financial year first.
  const taxpayers = useMemo(() => {
    const groups = new Map();

    records.forEach((record, index) => {
      const key = taxpayerKey(record);
      const group = groups.get(key) || { key, name: "", pan: "", entries: [] };
      if (!group.name && record.name) group.name = record.name;
      if (!group.pan && record.pan) group.pan = record.pan;
      group.entries.push({
        key: String(record.id ?? `${key}:${record.financialYear}:${index}`),
        record,
      });
      groups.set(key, group);
    });

    const stamp = record =>
      new Date(record.itrFilingDate || record.updatedAt || record.createdAt || 0).getTime() || 0;

    return [...groups.values()]
      .map(group => ({
        ...group,
        entries: group.entries.sort(
          (a, b) =>
            trFyStart(b.record.financialYear) - trFyStart(a.record.financialYear) ||
            stamp(b.record) - stamp(a.record)
        ),
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [records]);

  const taxpayer = taxpayers.find(item => item.key === taxpayerSel) ?? taxpayers[0];
  const entries = taxpayer?.entries ?? [];
  const totalForTaxpayer = taxpayer
    ? allRecords.filter(record => taxpayerKey(record) === taxpayer.key).length
    : 0;

  const pageCount = Math.max(1, Math.ceil(entries.length / TR_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = entries.slice(safePage * TR_PAGE_SIZE, (safePage + 1) * TR_PAGE_SIZE);
  const firstShown = entries.length ? safePage * TR_PAGE_SIZE + 1 : 0;
  const lastShown = safePage * TR_PAGE_SIZE + visible.length;

  const chooseTaxpayer = event => {
    setTaxpayerSel(event.target.value);
    setPage(0);
  };

  return (
    <div className="trs-tr">
      <section className="trs-tr-taxpayer" aria-label="Taxpayer">
        <span className="trs-tr-avatar" aria-hidden="true">
          {trInitials(taxpayer?.name)}
        </span>

        <div className="trs-tr-taxpayer-info">
          <span className="trs-tr-label">Taxpayer</span>

          {taxpayers.length > 1 ? (
            <div className="trs-tr-taxpayer-pick">
              <select
                value={taxpayer?.key ?? ""}
                onChange={chooseTaxpayer}
                aria-label="Choose taxpayer"
              >
                {taxpayers.map(item => (
                  <option key={item.key} value={item.key}>
                    {item.name || "Unnamed taxpayer"}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <strong className="trs-tr-taxpayer-name">
              {taxpayer?.name || "No matching taxpayer"}
            </strong>
          )}

          {taxpayer && (
            <small className="trs-tr-pan">PAN {taxpayer.pan || "not available"}</small>
          )}
        </div>

        <div className="trs-tr-total">
          <span className="trs-tr-label">Total records</span>
          <strong>{totalForTaxpayer}</strong>
        </div>
      </section>

      <section className="trs-tr-filters" aria-label="Filters">
        <select
          value={fyFilter}
          onChange={event => {
            onFyFilter(event.target.value);
            setPage(0);
          }}
          aria-label="Financial year"
        >
          <option value="all">All Financial Years</option>
          {FINANCIAL_YEARS.map(year => (
            <option key={year.financialYear} value={year.financialYear}>
              FY {year.financialYear}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={event => {
            onStatusFilter(event.target.value);
            setPage(0);
          }}
          aria-label="Filing status"
        >
          <option value="all">All Statuses</option>
          {FILING_STATUSES.map(status => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <div className="trs-tr-exports">
          <button
            type="button"
            className="trs-tr-btn outline"
            onClick={onExportCsv}
            disabled={!records.length}
          >
            ↓ CSV
          </button>
          <button
            type="button"
            className="trs-tr-btn solid"
            onClick={onExportPdf}
            disabled={!records.length}
          >
            ↓ Download PDF
          </button>
        </div>
      </section>

      <p className="trs-tr-showing">
        Showing {visible.length} of {entries.length}{" "}
        {entries.length === 1 ? "record" : "records"}
      </p>

      <div
        className="trs-tr-scroll"
        role="region"
        aria-label="ITR records. Scroll horizontally to see all columns."
        tabIndex={0}
      >
        <table className="trs-tr-table">
          <thead>
            <tr>
              <th rowSpan={2} className="trs-tr-fy-col">Financial Year</th>
              <th colSpan={4} className="trs-tr-group">ITR Records</th>
              <th rowSpan={2} className="trs-tr-action-col">Action</th>
            </tr>
            <tr>
              <th className="num">Gross Income</th>
              <th className="num">Tax Payable</th>
              <th className="num">Refund</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {visible.map(({ key, record }) => (
              <tr key={key}>
                <td className="trs-tr-fy-col">
                  <strong>{record.financialYear || "—"}</strong>
                  <small>AY {record.assessmentYear || "—"}</small>
                </td>
                <td className="num">{money(record.grossIncome)}</td>
                <td className="num">{money(record.taxPayable)}</td>
                <td className="num">{trSigned(num(record.refundDue))}</td>
                <td>
                  <span className={`trs-tr-pill ${trFilingTone(record.filingStatus)}`}>
                    {record.filingStatus || "Draft"}
                  </span>
                </td>
                <td className="trs-tr-action-col">
                  <div className="trs-tr-row-actions">
                    <button
                      type="button"
                      className="trs-tr-btn outline small"
                      onClick={() => setViewing(record)}
                      aria-label={`View FY ${record.financialYear} details`}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="trs-tr-btn plain small"
                      onClick={() => onEdit(record)}
                      aria-label={`Edit FY ${record.financialYear}`}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!visible.length && (
              <tr>
                <td colSpan={6} className="trs-tr-empty">
                  No records found. Adjust the filters or add a tax return.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="trs-tr-footer">
        <span>
          {entries.length
            ? `Showing ${firstShown}–${lastShown} of ${entries.length} records`
            : "No records to show"}
        </span>

        {pageCount > 1 && (
          <nav className="trs-tr-pager" aria-label="Records pagination">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                type="button"
                key={index}
                className={safePage === index ? "active" : ""}
                aria-current={safePage === index ? "page" : undefined}
                onClick={() => setPage(index)}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
            >
              ›
            </button>
          </nav>
        )}
      </div>

      {viewing && (
        <TrRecordDialog
          record={viewing}
          onClose={closeDialog}
          onEdit={onEdit}
          onDownload={onDownload}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Doshi Family Tax Reconciliation: taxpayer cards -> reconciliation   */
/* ------------------------------------------------------------------ */

const DR_PAGE_SIZE = 6;

const drVariance = value =>
  value > 0
    ? `+${money(value)}`
    : value < 0
      ? `−${money(Math.abs(value))}`
      : money(0);

const drTone = status =>
  status === "Match" ? "match" : status === "Excess" ? "higher" : "lower";

const drStatusLabel = status =>
  status === "Match"
    ? "Matched"
    : status === "Excess"
      ? "Assessed higher ▲"
      : "Assessed lower ▼";

function DoshiReconciliation({ rows }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [page, setPage] = useState(0);

  // One group per unique taxpayer (PAN first, exact name otherwise).
  const taxpayers = useMemo(() => {
    const groups = new Map();

    rows.forEach(record => {
      const key = taxpayerKey(record);
      const group = groups.get(key) || { key, name: "", pan: "", records: [] };
      if (!group.name && record.name) group.name = record.name;
      if (!group.pan && record.pan) group.pan = record.pan;
      group.records.push(record);
      groups.set(key, group);
    });

    return [...groups.values()]
      .map(group => {
        const records = [...group.records].sort(
          (a, b) => trFyStart(b.financialYear) - trFyStart(a.financialYear)
        );
        const checks = records.flatMap(record => record.checks);
        const years = records
          .map(record => trFyStart(record.financialYear))
          .filter(year => year > 0);
        const first = years.length ? Math.min(...years) : null;
        const last = years.length ? Math.max(...years) : null;
        return {
          ...group,
          records,
          totalChecks: checks.length,
          differing: checks.filter(check => check.status !== "Match").length,
          yearSpan:
            first === null ? "—" : first === last ? `FY ${first}` : `FY ${first} – ${last}`,
        };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [rows]);

  const selected = taxpayers.find(item => item.key === selectedKey) || null;
  const pageCount = selected ? Math.max(1, Math.ceil(selected.records.length / DR_PAGE_SIZE)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const visible = selected
    ? selected.records.slice(safePage * DR_PAGE_SIZE, (safePage + 1) * DR_PAGE_SIZE)
    : [];

  const duplicateYears = useMemo(() => {
    if (!selected) return new Set();
    const seen = new Set();
    const dupes = new Set();
    selected.records.forEach(record => {
      if (seen.has(record.financialYear)) dupes.add(record.financialYear);
      seen.add(record.financialYear);
    });
    return dupes;
  }, [selected]);

  const open = key => {
    setPage(0);
    setSelectedKey(key);
  };

  return (
    <div className="trs-content trs-dr">
      <style>{`
        .trs-dr { min-width: 0; }
        .trs-dr .trs-dr-card { background: #fffdf8; border: 1px solid #e7ddc9; border-radius: 18px; padding: 24px 28px 26px; color: #172342; box-shadow: 0 2px 8px rgba(43, 34, 15, .035); }
        .trs-dr .trs-dr-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 14px; }
        .trs-dr .trs-dr-heading h2 { margin: 0; color: #172342; font-size: 24px; font-weight: 750; line-height: 1.25; }
        .trs-dr .trs-dr-heading p { margin: 6px 0 0; color: #817c6d; font-size: 14px; }
        .trs-dr .trs-dr-legend { color: #817c6d; font-size: 12px; line-height: 1.8; text-align: right; }
        .trs-dr .trs-dr-rule { width: 64px; height: 3px; margin: 0 0 18px; background: #bd922d; }

        .trs-dr .trs-dr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
        .trs-dr .trs-dr-tcard { display: flex; flex-direction: column; gap: 14px; width: 100%; padding: 16px; border: 1px solid #eadfc9; border-radius: 12px; background: #fffdf8; color: #172342; text-align: left; font: inherit; cursor: pointer; transition: border-color .15s, box-shadow .15s, transform .15s; }
        .trs-dr .trs-dr-tcard:hover { background: #fffdf8; background-image: none; border: 1px solid #bd922d; box-shadow: 0 6px 18px rgba(35, 30, 20, .09); transform: translateY(-1px); }
        .trs-dr .trs-dr-tcard:focus-visible { outline: 2px solid #142448; outline-offset: 2px; }
        .trs-dr .trs-dr-top { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .trs-dr .trs-dr-avatar { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 44px; height: 44px; margin: 0; padding: 0; border-radius: 50%; background: #142448; color: #e8c978; font-size: 14px; font-weight: 800; line-height: 1; text-transform: uppercase; }
        .trs-dr .trs-dr-who { min-width: 0; }
        .trs-dr .trs-dr-name { display: block; color: #142448; font-size: 15px; font-weight: 800; overflow-wrap: anywhere; }
        .trs-dr .trs-dr-pan { display: block; margin-top: 2px; color: #817c6d; font-size: 11px; }
        .trs-dr .trs-dr-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-top: 11px; border-top: 1px solid #eee4d2; color: #817c6d; font-size: 11px; }
        .trs-dr .trs-dr-foot b { color: #142448; font-size: 13px; }
        .trs-dr .trs-dr-chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 750; white-space: nowrap; }
        .trs-dr .trs-dr-chip.differ { background: #f8e0db; color: #bd3029; }
        .trs-dr .trs-dr-chip.ok { background: #dff1e8; color: #14734e; }

        .trs-dr .trs-dr-head { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 16px; }
        .trs-dr .trs-dr-back { height: 36px; padding: 0 14px; border: 1px solid #142448; border-radius: 8px; background: #fff; color: #142448; font-size: 12px; font-weight: 750; cursor: pointer; }
        .trs-dr .trs-dr-back:hover { background: #f7f1df; background-image: none; border: 1px solid #142448; }
        .trs-dr .trs-dr-head-info { flex: 1 1 auto; min-width: 0; }
        .trs-dr .trs-dr-head-info h3 { margin: 0; color: #142448; font-size: 20px; font-weight: 800; }
        .trs-dr .trs-dr-head-info span { display: block; margin-top: 2px; color: #817c6d; font-size: 12px; }

        .trs-dr .trs-dr-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; }
        .trs-dr .trs-dr-table { width: 100%; min-width: 820px; border-collapse: collapse; table-layout: fixed; }
        .trs-dr .trs-dr-table thead th { padding: 16px; background: #112044; color: #f3ca6e; font-size: 12px; font-weight: 750; letter-spacing: .03em; text-align: left; white-space: nowrap; border: 0; }
        .trs-dr .trs-dr-table thead th:first-child { width: 30%; }
        .trs-dr .trs-dr-table thead th:nth-child(2) { width: 14%; text-align: right; }
        .trs-dr .trs-dr-table thead th:nth-child(3) { width: 17%; text-align: right; }
        .trs-dr .trs-dr-table thead th:nth-child(4) { width: 17%; text-align: right; }
        .trs-dr .trs-dr-table thead th:nth-child(5) { width: 22%; }
        .trs-dr .trs-dr-table tbody td { padding: 15px 16px; border-bottom: 1px solid #e8dfce; color: #172342; font-size: 13px; vertical-align: middle; white-space: nowrap; }
        .trs-dr .trs-dr-table tbody tr:not(.trs-dr-year) td:first-child { padding-left: 25px; }
        .trs-dr .trs-dr-table .trs-dr-num { text-align: right; font-variant-numeric: tabular-nums; }
        .trs-dr .trs-dr-year td { padding: 12px 20px; border-bottom: 0; border-left: 5px solid #bd922d; background: #f3e9cc; color: #112044; font-size: 14px; }
        .trs-dr .trs-dr-year-title { margin-right: 12px; font-weight: 800; }
        .trs-dr .trs-dr-year-tag { margin-right: 10px; color: #817c6d; font-size: 11px; font-weight: 600; }
        .trs-dr .trs-dr-count { display: inline-block; padding: 3px 11px; border-radius: 20px; background: #fffdf8; font-size: 12px; font-weight: 750; }
        .trs-dr .trs-dr-count.differ { color: #c63229; }
        .trs-dr .trs-dr-count.ok { color: #14734e; }
        .trs-dr .trs-dr-var { display: inline-block; min-width: 108px; padding: 4px 9px; border-radius: 9px; text-align: right; font-size: 13px; font-weight: 800; }
        .trs-dr .trs-dr-var.lower { background: #f8e0db; color: #bd3029; }
        .trs-dr .trs-dr-var.higher { background: #dce7f7; color: #205da4; }
        .trs-dr .trs-dr-var.match { background: transparent; color: #14734e; }
        .trs-dr .trs-dr-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 750; }
        .trs-dr .trs-dr-status::before { content: ''; display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: currentColor; }
        .trs-dr .trs-dr-status.lower { color: #bd3029; }
        .trs-dr .trs-dr-status.higher { color: #205da4; }
        .trs-dr .trs-dr-status.match { color: #14734e; }
        .trs-dr .trs-dr-pager { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 2px 4px; border-top: 2px solid #bd922d; color: #817c6d; font-size: 12px; }
        .trs-dr .trs-dr-pager-actions { display: flex; align-items: center; gap: 10px; }
        .trs-dr .trs-dr-pager button { padding: 6px 12px; border: 1px solid #d8c9a8; border-radius: 7px; background: #fffdf8; color: #172342; font-weight: 650; cursor: pointer; }
        .trs-dr .trs-dr-pager button:hover:not(:disabled) { background: #f7f1df; background-image: none; border: 1px solid #d8c9a8; }
        .trs-dr .trs-dr-pager button:disabled { opacity: .45; cursor: not-allowed; }
        .trs-dr .trs-dr-empty { padding: 28px; border: 1px dashed #eadfc9; border-radius: 12px; color: #817c6d; text-align: center; font-size: 13px; }
        @media (max-width: 760px) {
          .trs-dr .trs-dr-card { padding: 18px 14px 20px; border-radius: 12px; }
          .trs-dr .trs-dr-heading { display: block; }
          .trs-dr .trs-dr-legend { margin-top: 8px; text-align: left; }
          .trs-dr .trs-dr-pager { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <section className="trs-dr-card">
        {selected ? (
          <>
            <div className="trs-dr-head">
              <button type="button" className="trs-dr-back" onClick={() => open(null)}>
                ← All taxpayers
              </button>
              <span className="trs-dr-avatar" aria-hidden="true">{trInitials(selected.name)}</span>
              <div className="trs-dr-head-info">
                <h3>{selected.name || "Unnamed taxpayer"}</h3>
                <span>
                  PAN: {selected.pan || "Not available"} · ITR vs Assessment comparison
                </span>
              </div>
              <div className="trs-dr-legend">
                <div>Difference = Assessment − ITR</div>
                <div>▲ assessed higher &nbsp; ▼ assessed lower &nbsp; ● matched</div>
              </div>
            </div>
            <div className="trs-dr-rule" />

            <div
              className="trs-dr-scroll"
              role="region"
              aria-label="Tax reconciliation table. Scroll horizontally to view all columns."
              tabIndex={0}
            >
              <table className="trs-dr-table">
                <thead>
                  <tr>
                    <th>PARTICULAR</th>
                    <th>ITR DATA</th>
                    <th>ASSESSMENT DATA</th>
                    <th>DIFFERENCE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((record, recordIndex) => {
                    const differing = record.checks.filter(check => check.status !== "Match").length;
                    return (
                      <React.Fragment key={record.id ?? `${record.financialYear}-${safePage}-${recordIndex}`}>
                        <tr className="trs-dr-year">
                          <td colSpan={5}>
                            <span className="trs-dr-year-title">FY {record.financialYear || "—"}</span>
                            {duplicateYears.has(record.financialYear) && (
                              <span className="trs-dr-year-tag">{record.filingStatus || "Draft"}</span>
                            )}
                            <span className={`trs-dr-count ${differing ? "differ" : "ok"}`}>
                              {differing === 0
                                ? `All ${record.checks.length} matched`
                                : `${differing} of ${record.checks.length} differ`}
                            </span>
                          </td>
                        </tr>
                        {record.checks.map(check => {
                          const tone = drTone(check.status);
                          return (
                            <tr key={`${record.id ?? record.financialYear}-${check.label}`}>
                              <td>{check.label}</td>
                              <td className="trs-dr-num">{money(check.itr)}</td>
                              <td className="trs-dr-num">{money(check.assessment)}</td>
                              <td className="trs-dr-num">
                                <span className={`trs-dr-var ${tone}`}>{drVariance(check.difference)}</span>
                              </td>
                              <td>
                                <span className={`trs-dr-status ${tone}`}>{drStatusLabel(check.status)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="trs-dr-pager">
              <span>
                Showing {selected.records.length ? safePage * DR_PAGE_SIZE + 1 : 0}–
                {safePage * DR_PAGE_SIZE + visible.length} of {selected.records.length} financial years
              </span>
              {pageCount > 1 && (
                <div className="trs-dr-pager-actions">
                  <button type="button" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>Previous</button>
                  <span>Page {safePage + 1} of {pageCount}</span>
                  <button type="button" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1}>Next</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="trs-dr-heading">
              <div>
                <h2>Doshi Family</h2>
                <p>
                  {taxpayers.length} unique {taxpayers.length === 1 ? "taxpayer" : "taxpayers"} · select a card to view ITR vs Assessment
                </p>
              </div>
              <div className="trs-dr-legend">
                <div>Difference = Assessment − ITR</div>
                <div>▲ assessed higher &nbsp; ▼ assessed lower &nbsp; ● matched</div>
              </div>
            </div>
            <div className="trs-dr-rule" />

            {taxpayers.length ? (
              <div className="trs-dr-grid">
                {taxpayers.map(item => (
                  <button
                    type="button"
                    key={item.key}
                    className="trs-dr-tcard"
                    onClick={() => open(item.key)}
                    aria-label={`Open reconciliation for ${item.name || "unnamed taxpayer"}`}
                  >
                    <span className="trs-dr-top">
                      <span className="trs-dr-avatar" aria-hidden="true">{trInitials(item.name)}</span>
                      <span className="trs-dr-who">
                        <strong className="trs-dr-name">{item.name || "Unnamed taxpayer"}</strong>
                        <small className="trs-dr-pan">PAN: {item.pan || "Not available"}</small>
                      </span>
                    </span>
                    <span className="trs-dr-foot">
                      <span>
                        <b>{item.records.length}</b> {item.records.length === 1 ? "year" : "years"}
                        <br />
                        {item.yearSpan}
                      </span>
                      <span className={`trs-dr-chip ${item.differing ? "differ" : "ok"}`}>
                        {item.differing ? `${item.differing} of ${item.totalChecks} differ` : "All matched"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="trs-dr-empty">No records available for reconciliation.</div>
            )}
          </>
        )}

        <p className="trs-note">
          Note: This is a preliminary comparison using the fields currently stored in your database. It is not an official tax assessment or 26AS/AIS verification.
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Doshi Family: one clickable card per unique taxpayer                */
/* Clicking a card opens that taxpayer's records in the same table      */
/* format that Talent Corner uses.                                      */
/* ------------------------------------------------------------------ */

function DoshiTaxpayerCards({
  records,
  fyFilter,
  onFyFilter,
  statusFilter,
  onStatusFilter,
  selectedKey,
  onSelect,
  onExportPdf,
  onExportCsv,
  onEdit,
  onDownload,
}) {
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null);
  const closeDialog = useCallback(() => setViewing(null), []);

  // One group per unique taxpayer (PAN first, exact name otherwise).
  const taxpayers = useMemo(() => {
    const groups = new Map();

    records.forEach(record => {
      const key = taxpayerKey(record);
      const group = groups.get(key) || { key, name: "", pan: "", records: [] };
      if (!group.name && record.name) group.name = record.name;
      if (!group.pan && record.pan) group.pan = record.pan;
      group.records.push(record);
      groups.set(key, group);
    });

    return [...groups.values()]
      .map(group => {
        const years = group.records
          .map(record => trFyStart(record.financialYear))
          .filter(year => year > 0);
        const first = years.length ? Math.min(...years) : null;
        const last = years.length ? Math.max(...years) : null;
        return {
          ...group,
          yearSpan:
            first === null
              ? "—"
              : first === last
                ? `FY ${first}`
                : `FY ${first} – ${last}`,
          assessed: group.records.filter(trHasAssessment).length,
        };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [records]);

  const selected = taxpayers.find(item => item.key === selectedKey) || null;

  // Newest financial year first, then by name — same order Talent Corner uses.
  const selectedRecords = useMemo(
    () =>
      selected
        ? [...selected.records].sort(
            (a, b) =>
              trFyStart(b.financialYear) - trFyStart(a.financialYear) ||
              String(a.name || "").localeCompare(String(b.name || ""))
          )
        : [],
    [selected]
  );

  const pageCount = Math.max(1, Math.ceil(selectedRecords.length / TR_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = selectedRecords.slice(safePage * TR_PAGE_SIZE, (safePage + 1) * TR_PAGE_SIZE);
  const firstShown = selectedRecords.length ? safePage * TR_PAGE_SIZE + 1 : 0;
  const lastShown = safePage * TR_PAGE_SIZE + visible.length;

  return (
    <div className="trs-dtc">
      <style>{`
        .trs-dtc { display: grid; gap: 16px; min-width: 0; }
        .trs-dtc-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .trs-dtc-toolbar select { height: 36px; padding: 0 12px; border: 1px solid #eadfc9; border-radius: 8px; background: #fffdf8; color: #142448; font-size: 13px; }
        .trs-dtc-toolbar .trs-dtc-spacer { flex: 1 1 auto; }
        .trs-dtc-btn { height: 36px; padding: 0 14px; border: 1px solid #142448; border-radius: 8px; background: #fff; color: #142448; font-size: 12px; font-weight: 750; cursor: pointer; }
        .trs-dtc-btn.solid { background: #142448; color: #fff; }
        .trs-dtc-btn:disabled { opacity: .45; cursor: not-allowed; }
        .trs-dtc-count { margin: 0; color: #817c6d; font-size: 12px; }
        .trs-dtc-count strong { color: #142448; }
        .trs-dtc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
        .trs-dtc-card { display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 16px; border: 1px solid #eadfc9; border-radius: 12px; background: #fffdf8; color: #172342; text-align: left; font: inherit; cursor: pointer; transition: border-color .15s, box-shadow .15s, transform .15s; }
        .trs-dtc-card:hover { background: #fffdf8; background-image: none; border: 1px solid #bd922d; box-shadow: 0 6px 18px rgba(35, 30, 20, .09); transform: translateY(-1px); }
        .trs-dtc-btn:hover { background-image: none; border: 1px solid #142448; background-color: #f7f1df; }
        .trs-dtc-btn.solid:hover { background-color: #1d3266; color: #fff; }
        .trs-dtc-card:focus-visible { outline: 2px solid #142448; outline-offset: 2px; }
        .trs-dtc-card-top { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .trs-dtc .trs-dtc-avatar { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 44px; height: 44px; margin: 0; padding: 0; border-radius: 50%; background: #142448; color: #e8c978; font-size: 14px; font-weight: 800; line-height: 1; letter-spacing: .02em; text-transform: uppercase; }
        .trs-dtc-name { display: block; color: #142448; font-size: 15px; font-weight: 800; overflow-wrap: anywhere; }
        .trs-dtc-pan { display: block; margin-top: 2px; color: #817c6d; font-size: 11px; letter-spacing: .02em; }
        .trs-dtc-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid #eee4d2; color: #817c6d; font-size: 11px; }
        .trs-dtc-meta b { color: #142448; font-size: 13px; }
        .trs-dtc-open { color: #a27413; font-weight: 750; }
        .trs-dtc-head { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid #eadfc9; border-radius: 12px; background: #f7f1df; }
        .trs-dtc-head h3 { margin: 0; color: #142448; font-size: 17px; font-weight: 800; }
        .trs-dtc-head-info { min-width: 0; }
        .trs-dtc-head-info span { display: block; margin-top: 2px; color: #817c6d; font-size: 11px; }
        .trs-dtc-empty { padding: 28px; border: 1px dashed #eadfc9; border-radius: 12px; color: #817c6d; text-align: center; font-size: 13px; }
      `}</style>

      <div className="trs-dtc-toolbar">
        <select
          value={fyFilter}
          onChange={event => onFyFilter(event.target.value)}
          aria-label="Financial year"
        >
          <option value="all">All Financial Years</option>
          {FINANCIAL_YEARS.map(year => (
            <option key={year.financialYear} value={year.financialYear}>
              FY {year.financialYear}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={event => onStatusFilter(event.target.value)}
          aria-label="Filing status"
        >
          <option value="all">All Statuses</option>
          {FILING_STATUSES.map(status => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <span className="trs-dtc-spacer" />

        <button type="button" className="trs-dtc-btn" onClick={onExportCsv} disabled={!records.length}>
          ↓ CSV
        </button>
        <button type="button" className="trs-dtc-btn solid" onClick={onExportPdf} disabled={!records.length}>
          ↓ Download PDF
        </button>
      </div>

      {selected ? (
        <>
          <div className="trs-dtc-head">
            <button type="button" className="trs-dtc-btn" onClick={() => { setPage(0); onSelect(null); }}>
              ← All taxpayers
            </button>
            <span className="trs-dtc-avatar" aria-hidden="true">{trInitials(selected.name)}</span>
            <div className="trs-dtc-head-info">
              <h3>{selected.name || "Unnamed taxpayer"}</h3>
              <span>
                PAN: {selected.pan || "Not available"} · {selectedRecords.length}{" "}
                {selectedRecords.length === 1 ? "record" : "records"}
              </span>
            </div>
          </div>

          <div className="trs-tr">
            <p className="trs-tr-showing">
              Showing {visible.length} of {selectedRecords.length}{" "}
              {selectedRecords.length === 1 ? "record" : "records"}
            </p>

            <div
              className="trs-tr-scroll"
              role="region"
              aria-label="ITR records. Scroll horizontally to see all columns."
              tabIndex={0}
            >
              <table className="trs-tr-table">
                <thead>
                  <tr>
                    <th rowSpan={2} className="trs-tr-fy-col">Financial Year</th>
                    <th colSpan={4} className="trs-tr-group">ITR Records</th>
                    <th rowSpan={2} className="trs-tr-action-col">Action</th>
                  </tr>
                  <tr>
                    <th className="num">Gross Income</th>
                    <th className="num">Tax Payable</th>
                    <th className="num">Refund</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((record, index) => (
                    <tr key={record.id ?? `${record.financialYear}-${safePage}-${index}`}>
                      <td className="trs-tr-fy-col">
                        <strong>{record.financialYear || "—"}</strong>
                        <small>AY {record.assessmentYear || "—"}</small>
                      </td>
                      <td className="num">{money(record.grossIncome)}</td>
                      <td className="num">{money(record.taxPayable)}</td>
                      <td className="num">{trSigned(num(record.refundDue))}</td>
                      <td>
                        <span className={`trs-tr-pill ${trFilingTone(record.filingStatus)}`}>
                          {record.filingStatus || "Draft"}
                        </span>
                      </td>
                      <td className="trs-tr-action-col">
                        <div className="trs-tr-row-actions">
                          <button
                            type="button"
                            className="trs-tr-btn outline small"
                            onClick={() => setViewing(record)}
                            aria-label={`View FY ${record.financialYear} details`}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="trs-tr-btn plain small"
                            onClick={() => onEdit(record)}
                            aria-label={`Edit FY ${record.financialYear}`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="trs-tr-footer">
              <span>
                Showing {firstShown}–{lastShown} of {selectedRecords.length} records
              </span>
              {pageCount > 1 && (
                <nav className="trs-tr-pager" aria-label="Records pagination">
                  <button type="button" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} aria-label="Previous page">‹</button>
                  {Array.from({ length: pageCount }, (_, index) => (
                    <button
                      type="button"
                      key={index}
                      className={safePage === index ? "active" : ""}
                      aria-current={safePage === index ? "page" : undefined}
                      onClick={() => setPage(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page">›</button>
                </nav>
              )}
            </div>

            {viewing && (
              <TrRecordDialog
                record={viewing}
                onClose={closeDialog}
                onEdit={onEdit}
                onDownload={onDownload}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <p className="trs-dtc-count">
            <strong>{taxpayers.length}</strong> unique{" "}
            {taxpayers.length === 1 ? "taxpayer" : "taxpayers"} ·{" "}
            <strong>{records.length}</strong> {records.length === 1 ? "record" : "records"}. Select a card to view records.
          </p>

          {taxpayers.length ? (
            <div className="trs-dtc-grid">
              {taxpayers.map(item => (
                <button
                  type="button"
                  key={item.key}
                  className="trs-dtc-card"
                  onClick={() => { setPage(0); onSelect(item.key); }}
                  aria-label={`Open records for ${item.name || "unnamed taxpayer"}`}
                >
                  <span className="trs-dtc-card-top">
                    <span className="trs-dtc-avatar" aria-hidden="true">{trInitials(item.name)}</span>
                    <span>
                      <strong className="trs-dtc-name">{item.name || "Unnamed taxpayer"}</strong>
                      <small className="trs-dtc-pan">PAN: {item.pan || "Not available"}</small>
                    </span>
                  </span>
                  <span className="trs-dtc-meta">
                    <span>
                      <b>{item.records.length}</b> {item.records.length === 1 ? "record" : "records"}
                      <br />
                      {item.yearSpan}
                    </span>
                    <span className="trs-dtc-open">View records →</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="trs-dtc-empty">
              No records found. Adjust the filters or add a tax return.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecordsTable({
  records,
  onEdit,
  showAssessmentDetails = false,
  showBasicTotals = false,
}) {
  if (!records.length) {
    return (
      <div className="trs-empty">
        No records found. Add a tax return to get started.
      </div>
    );
  }

  // Sort Financial Year from newest to oldest (e.g. 2026-27, 2025-26, ...).
  const getFinancialYearSortValue = value => {
    const match = String(value || "").match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
    if (match) return Number(match[1]);
    const year = String(value || "").match(/\d{4}/);
    return year ? Number(year[0]) : -1;
  };
  const sortedRecords = [...records].sort((a, b) => {
    const yearDifference =
      getFinancialYearSortValue(b.financialYear) -
      getFinancialYearSortValue(a.financialYear);
    if (yearDifference !== 0) return yearDifference;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  // Talent Corner uses a compact, expandable taxpayer-wise layout.
  // Doshi Family continues to use the existing records table below.
  if (showAssessmentDetails) {
    return <TalentCornerRecordsTable records={sortedRecords} onEdit={onEdit} />;
  }

  const totals = sortedRecords.reduce(
    (sum, record) => {
      const itrRefund = num(record.refundDue);
      const assessmentRefund = num(record.refundAmountBeforeInterest);
      const interest = num(record.interest);
      return {
        itrGrossIncome: sum.itrGrossIncome + num(record.grossIncome),
        itrTaxPayable: sum.itrTaxPayable + num(record.taxPayable),
        itrRefund: sum.itrRefund + itrRefund,
        totalAssessedIncome: sum.totalAssessedIncome + num(record.totalAssessedIncome),
        totalAssessedTaxPayable: sum.totalAssessedTaxPayable + num(record.totalAssessedTaxPayable),
        tdsCredit: sum.tdsCredit + num(record.tdsCredit),
        refundAmountBeforeInterest: sum.refundAmountBeforeInterest + assessmentRefund,
        interest: sum.interest + interest,
        netRefundAmount: sum.netRefundAmount + num(record.netRefundAmount ?? assessmentRefund + interest),
      };
    },
    {
      itrGrossIncome: 0,
      itrTaxPayable: 0,
      itrRefund: 0,
      totalAssessedIncome: 0,
      totalAssessedTaxPayable: 0,
      tdsCredit: 0,
      refundAmountBeforeInterest: 0,
      interest: 0,
      netRefundAmount: 0,
    }
  );

  return (
    <div className="trs-records-table-section">
      <style>{`
        .trs-records-table-section {
          width: 100%;
          min-width: 0;
        }
        .trs-records-table-section .trs-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          border: 1px solid #c9c5bb;
          border-radius: 8px;
        }
        .trs-records-table-section .trs-table {
          width: 100%;
          min-width: 760px;
          border-collapse: separate;
          border-spacing: 0;
          border: 0;
        }
        .trs-records-table-section .trs-table th,
        .trs-records-table-section .trs-table td {
          border-right: 1px solid #c9c5bb;
          border-bottom: 1px solid #c9c5bb;
          padding: 10px 12px;
          vertical-align: middle;
          white-space: nowrap;
        }
        .trs-records-table-section .trs-table thead tr:first-child th:first-child,
        .trs-records-table-section .trs-table tbody td:first-child {
          position: sticky;
          left: 0;
          z-index: 1;
          min-width: 190px;
          max-width: 250px;
          white-space: normal;
          background: #fffdf8;
          box-shadow: 2px 0 4px rgba(35, 30, 20, 0.06);
        }
        .trs-records-table-section .trs-table thead th {
          border-top: 0;
          border-bottom: 1px solid #b8b2a6;
          background: #f7f4ec;
          color: #61718b;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
        }
        .trs-records-table-section .trs-table thead th:first-child {
          z-index: 3;
          background: #f7f4ec;
        }
        .trs-records-table-section .trs-table tbody tr:last-child td {
          border-bottom: 0;
        }
        .trs-records-table-section .trs-table th:last-child,
        .trs-records-table-section .trs-table td:last-child {
          border-right: 0;
        }
        .trs-records-table-section .trs-table td:first-child b {
          overflow-wrap: anywhere;
        }
        .trs-records-table-section .trs-assessment-total-row td {
          border-bottom: 1px solid #b8b2a6;
          background: #f7f4ec;
        }
        .trs-records-table-section .trs-assessment-total-row td:first-child {
          background: #f7f4ec;
        }
        .trs-records-table-section .trs-row-action {
          white-space: nowrap;
        }
        .trs-records-table-section .trs-table-wrap-detailed .trs-table {
          min-width: 1580px;
        }
        @media (max-width: 768px) {
          .trs-records-table-section .trs-table {
            min-width: 760px;
            font-size: 12px;
          }
          .trs-records-table-section .trs-table th,
          .trs-records-table-section .trs-table td {
            padding: 9px 10px;
          }
          .trs-records-table-section .trs-table thead tr:first-child th:first-child,
          .trs-records-table-section .trs-table tbody td:first-child {
            min-width: 160px;
            max-width: 190px;
          }
          .trs-records-table-section .trs-report-ack {
            display: block;
            overflow-wrap: anywhere;
          }
        }
        @media (max-width: 480px) {
          .trs-records-table-section .trs-table {
            min-width: 720px;
          }
          .trs-records-table-section .trs-table th,
          .trs-records-table-section .trs-table td {
            padding: 8px;
          }
        }
      `}</style>
      <div
        className={`trs-table-wrap ${showAssessmentDetails ? "trs-table-wrap-detailed" : "trs-table-wrap-basic"}`}
        role="region"
        aria-label="Taxpayer records table. Scroll horizontally to view all columns."
        tabIndex={0}
      >
        <table className="trs-table">
          {showAssessmentDetails ? (
            <thead>
              <tr>
                <th rowSpan={2}>Taxpayer</th>
                <th rowSpan={2}>Financial Year</th>
                <th rowSpan={2}>Assessment Year</th>
                <th colSpan={4} className="trs-record-group-heading">ITR Records</th>
                <th colSpan={8} className="trs-record-group-heading">Assessment Records</th>
                <th rowSpan={2}>Action</th>
              </tr>
              <tr>
                <th>Gross Income</th>
                <th>Tax Payable</th>
                <th>Refund</th>
                <th>Status</th>
                <th>Order Type</th>
                <th>Date of Order</th>
                <th>Total Assessed Income</th>
                <th>Total Assessed Tax Payable</th>
                <th>TDS Credit</th>
                <th>Refund Before Interest</th>
                <th>Interest</th>
                <th>Net Refund</th>
              </tr>
            </thead>
          ) : (
            <thead>
              <tr>
                <th>Taxpayer</th>
                <th>Financial Year</th>
                <th>Gross Income</th>
                <th>Tax Payable</th>
                <th>Refund</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
          )}

          <tbody>
            {sortedRecords.map((record, index) => (
              <tr key={record.id ?? `${record.name}-${record.financialYear}-${index}`}>
                <td>
                  <b>{record.name || "—"}</b>
                  <small className="trs-report-ack">
                    {record.pan || "PAN missing"}
                  </small>
                </td>
                <td>{record.financialYear || "—"}</td>
                {showAssessmentDetails && (
                  <td>{record.assessmentYear || "—"}</td>
                )}
                <td>{money(record.grossIncome)}</td>
                <td>{money(record.taxPayable)}</td>
                <td>{money(record.refundDue)}</td>
                <td>
                  <span className={`trs-badge ${String(record.filingStatus || "Draft").toLowerCase()}`}>
                    {record.filingStatus || "Draft"}
                  </span>
                </td>
                {showAssessmentDetails && (
                  <>
                    <td>{record.orderType || "—"}</td>
                    <td>{record.dateOfOrder || "—"}</td>
                    <td>{money(record.totalAssessedIncome)}</td>
                    <td>{money(record.totalAssessedTaxPayable)}</td>
                    <td>{money(record.tdsCredit)}</td>
                    <td>{money(record.refundAmountBeforeInterest)}</td>
                    <td>{money(record.interest)}</td>
                    <td>{money(record.netRefundAmount)}</td>
                  </>
                )}
                <td>
                  <button className="trs-row-action" onClick={() => onEdit(record)}>
                    View / Edit
                  </button>
                </td>
              </tr>
            ))}

            {showBasicTotals && !showAssessmentDetails && (
              <tr className="trs-assessment-total-row">
                <td colSpan={2}><strong>Total</strong></td>
                <td><strong>{money(totals.itrGrossIncome)}</strong></td>
                <td><strong>{money(totals.itrTaxPayable)}</strong></td>
                <td><strong>{money(totals.itrRefund)}</strong></td>
                <td></td>
                <td></td>
              </tr>
            )}

            {showAssessmentDetails && (
              <tr className="trs-assessment-total-row">
                <td colSpan={3}><strong>Total</strong></td>
                <td><strong>{money(totals.itrGrossIncome)}</strong></td>
                <td><strong>{money(totals.itrTaxPayable)}</strong></td>
                <td><strong>{money(totals.itrRefund)}</strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td><strong>{money(totals.totalAssessedIncome)}</strong></td>
                <td><strong>{money(totals.totalAssessedTaxPayable)}</strong></td>
                <td><strong>{money(totals.tdsCredit)}</strong></td>
                <td><strong>{money(totals.refundAmountBeforeInterest)}</strong></td>
                <td><strong>{money(totals.interest)}</strong></td>
                <td><strong>{money(totals.netRefundAmount)}</strong></td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TalentCornerRecordsTable({ records, onEdit }) {
  const [expandedRecords, setExpandedRecords] = useState(() => new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(currentPage, pageCount - 1);
  const pageRecords = records.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const taxpayerGroups = pageRecords.reduce((groups, record) => {
    const key = `${record.name || "Unknown taxpayer"}::${record.pan || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
    return groups;
  }, new Map());

  const toggleRecord = recordKey => {
    setExpandedRecords(current => {
      const next = new Set(current);
      if (next.has(recordKey)) next.delete(recordKey);
      else next.add(recordKey);
      return next;
    });
  };

  const getNetRefund = record =>
    num(record.refundAmountBeforeInterest) + num(record.interest);
  const getDifferenceStatus = record => {
    const checks = [
      Math.round(num(record.totalAssessedIncome) - num(record.grossIncome)),
      Math.round(num(record.totalAssessedTaxPayable) - num(record.taxPayable)),
      Math.round(num(record.refundAmountBeforeInterest) - num(record.refundDue)),
    ];
    return checks.every(value => value === 0) ? "Matched" : "Differs";
  };
  const formatDifference = value => {
    const rounded = Math.round(num(value));
    if (!rounded) return "—";
    return `${rounded > 0 ? "▲ +" : "▼ −"}${money(Math.abs(rounded))}`;
  };

  return (
    <div className="trs-tc-records">
      <style>{`
        .trs-tc-records { width: 100%; min-width: 0; display: grid; gap: 14px; }
        .trs-tc-taxpayer-card { border: 1px solid #eadfc9; border-radius: 12px; background: #fffdf8; overflow: hidden; }
        .trs-tc-taxpayer-heading { padding: 13px 18px 10px; background: #f7f1df; border-bottom: 1px solid #eadfc9; }
        .trs-tc-taxpayer-heading h3 { margin: 0; color: #142448; font-size: 16px; font-weight: 800; }
        .trs-tc-taxpayer-heading span { display: block; margin-top: 3px; color: #817c6d; font-size: 11px; }
        .trs-tc-record-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .trs-tc-record-table { width: 100%; min-width: 1020px; border-collapse: separate; border-spacing: 0 6px; padding: 0 10px 8px; }
        .trs-tc-record-table th { padding: 10px 9px 8px; color: #a27413; font-size: 10px; font-weight: 800; text-align: left; text-transform: uppercase; white-space: nowrap; }
        .trs-tc-record-table td { padding: 10px 9px; color: #172342; font-size: 12px; vertical-align: middle; background: #fffdf8; border-top: 1px solid #eee4d2; border-bottom: 1px solid #eee4d2; white-space: nowrap; }
        .trs-tc-record-table tbody tr:not(.trs-tc-expanded-row) td:first-child { border-left: 1px solid #eee4d2; border-radius: 9px 0 0 9px; }
        .trs-tc-record-table tbody tr:not(.trs-tc-expanded-row) td:last-child { border-right: 1px solid #eee4d2; border-radius: 0 9px 9px 0; }
        .trs-tc-record-year { display: block; color: #142448; font-size: 13px; font-weight: 800; }
        .trs-tc-record-ay { display: block; margin-top: 3px; color: #817c6d; font-size: 10px; }
        .trs-tc-record-refund strong { display: block; color: #142448; font-size: 13px; font-weight: 850; }
        .trs-tc-record-refund i { display: block; width: 100%; height: 5px; margin-top: 5px; overflow: hidden; border-radius: 10px; background: #eee6d1; }
        .trs-tc-record-refund i::after { content: ''; display: block; width: var(--refund-width, 50%); height: 100%; border-radius: inherit; background: #bd922d; }
        .trs-tc-record-order { display: block; font-size: 11px; }
        .trs-tc-record-order small { display: block; margin-top: 4px; color: #817c6d; font-size: 10px; }
        .trs-tc-record-status { display: inline-flex; align-items: center; gap: 6px; color: #a27413; font-size: 10px; font-weight: 750; }
        .trs-tc-record-status::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
        .trs-tc-record-status.matched { color: #14734e; }
        .trs-tc-record-status.differs { color: #a27413; }
        .trs-tc-expand-btn { width: 27px; height: 27px; border: 1px solid #eadfc9; border-radius: 50%; background: #fff; color: #142448; cursor: pointer; font-size: 13px; }
        .trs-tc-expand-btn[aria-expanded="true"] { background: #142448; border-color: #142448; color: white; }
        .trs-tc-expanded-row td { padding: 4px 5px 10px; background: transparent; border: 0; white-space: normal; }
        .trs-tc-expanded-panel { display: grid; grid-template-columns: 1.25fr 1fr 1.2fr; gap: 16px; padding: 13px 16px; border-radius: 9px; background: #f7f0dc; }
        .trs-tc-expanded-panel h4 { margin: 0 0 9px; color: #a27413; font-size: 10px; font-weight: 850; text-transform: uppercase; }
        .trs-tc-detail-line { display: grid; grid-template-columns: minmax(100px, 1fr) auto auto; gap: 9px; padding: 4px 0; color: #172342; font-size: 10px; }
        .trs-tc-detail-line b { font-weight: 700; }
        .trs-tc-detail-diff { min-width: 84px; text-align: right; font-weight: 800; }
        .trs-tc-detail-diff.higher { color: #205da4; }
        .trs-tc-detail-diff.lower { color: #bd3029; }
        .trs-tc-refund-total { display: flex; justify-content: space-between; gap: 10px; padding-top: 8px; margin-top: 7px; border-top: 1px solid #d7c79f; color: #142448; font-size: 11px; font-weight: 850; }
        .trs-tc-order-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .trs-tc-order-actions button { border: 1px solid #bd922d; border-radius: 7px; padding: 6px 13px; background: white; color: #142448; font-size: 10px; font-weight: 750; cursor: pointer; }
        .trs-tc-order-actions button:first-child { border-color: #142448; background: #142448; color: white; }
        .trs-tc-record-pagination { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 3px 0; color: #817c6d; font-size: 10px; }
        .trs-tc-record-pagination-actions { display: flex; align-items: center; gap: 6px; }
        .trs-tc-record-pagination button { min-width: 26px; height: 25px; border: 1px solid #eadfc9; border-radius: 7px; background: #fffdf8; color: #142448; cursor: pointer; font-size: 11px; }
        .trs-tc-record-pagination button.active { background: #142448; border-color: #142448; color: white; }
        .trs-tc-record-pagination button:disabled { opacity: .4; cursor: not-allowed; }
        @media (max-width: 760px) {
          .trs-tc-expanded-panel { grid-template-columns: 1fr; gap: 13px; }
          .trs-tc-taxpayer-heading { padding: 12px 14px; }
        }
      `}</style>

      {[...taxpayerGroups.entries()].map(([taxpayerKey, taxpayerRecords]) => {
        const firstRecord = taxpayerRecords[0];
        const maxRefund = Math.max(1, ...taxpayerRecords.map(getNetRefund));
        return (
          <section className="trs-tc-taxpayer-card" key={taxpayerKey}>
            <header className="trs-tc-taxpayer-heading">
              <h3>{firstRecord.name || "Unknown taxpayer"}</h3>
              <span>PAN: {firstRecord.pan || "Not available"}</span>
            </header>
            <div className="trs-tc-record-scroll" role="region" aria-label={`Financial-year records for ${firstRecord.name || "taxpayer"}`} tabIndex={0}>
              <table className="trs-tc-record-table">
                <thead>
                  <tr>
                    <th>Financial Year</th>
                    <th>Gross Income</th>
                    <th>Tax Payable</th>
                    <th>TDS Credit</th>
                    <th>Net Refund</th>
                    <th>Assessment Order</th>
                    <th>Status</th>
                    <th aria-label="Expand details"></th>
                  </tr>
                </thead>
                <tbody>
                  {taxpayerRecords.map((record, index) => {
                    const recordKey = `${taxpayerKey}::${record.financialYear}::${record.id ?? index}`;
                    const isExpanded = expandedRecords.has(recordKey);
                    const status = getDifferenceStatus(record);
                    const netRefund = getNetRefund(record);
                    const incomeDifference = num(record.totalAssessedIncome) - num(record.grossIncome);
                    const taxDifference = num(record.totalAssessedTaxPayable) - num(record.taxPayable);
                    const refundDifference = num(record.refundAmountBeforeInterest) - num(record.refundDue);
                    return (
                      <React.Fragment key={recordKey}>
                        <tr>
                          <td><strong className="trs-tc-record-year">{record.financialYear || "—"}</strong><span className="trs-tc-record-ay">AY {record.assessmentYear || "—"}</span></td>
                          <td>{money(record.grossIncome)}</td>
                          <td>{money(record.taxPayable)}</td>
                          <td>{money(record.tdsCredit)}</td>
                          <td><span className="trs-tc-record-refund"><strong>{money(netRefund)}</strong><i style={{ "--refund-width": `${Math.max(0, Math.min(100, (netRefund / maxRefund) * 100))}%` }} /></span></td>
                          <td><span className="trs-tc-record-order">{record.orderType || "—"}<small>{record.dateOfOrder || "Date not available"}</small></span></td>
                          <td><span className={`trs-tc-record-status ${status === "Matched" ? "matched" : "differs"}`}>{status}</span></td>
                          <td><button type="button" className="trs-tc-expand-btn" aria-expanded={isExpanded} aria-label={`${isExpanded ? "Collapse" : "Expand"} ${record.financialYear} details`} onClick={() => toggleRecord(recordKey)}>{isExpanded ? "⌃" : "⌄"}</button></td>
                        </tr>
                        {isExpanded && (
                          <tr className="trs-tc-expanded-row">
                            <td colSpan={8}>
                              <div className="trs-tc-expanded-panel">
                                <section>
                                  <h4>ITR vs Assessment</h4>
                                  <div className="trs-tc-detail-line"><span>Particular</span><b>ITR</b><b>Assessed</b></div>
                                  <div className="trs-tc-detail-line"><span>Gross Income</span><b>{money(record.grossIncome)}</b><b>{money(record.totalAssessedIncome)}</b><span className={`trs-tc-detail-diff ${incomeDifference > 0 ? "higher" : incomeDifference < 0 ? "lower" : ""}`}>{formatDifference(incomeDifference)}</span></div>
                                  <div className="trs-tc-detail-line"><span>Tax Payable</span><b>{money(record.taxPayable)}</b><b>{money(record.totalAssessedTaxPayable)}</b><span className={`trs-tc-detail-diff ${taxDifference > 0 ? "higher" : taxDifference < 0 ? "lower" : ""}`}>{formatDifference(taxDifference)}</span></div>
                                  <div className="trs-tc-detail-line"><span>Refund (before interest)</span><b>{money(record.refundDue)}</b><b>{money(record.refundAmountBeforeInterest)}</b><span className={`trs-tc-detail-diff ${refundDifference > 0 ? "higher" : refundDifference < 0 ? "lower" : ""}`}>{formatDifference(refundDifference)}</span></div>
                                </section>
                                <section>
                                  <h4>Refund Build-up</h4>
                                  <div className="trs-tc-detail-line"><span>Refund before interest</span><b>{money(record.refundAmountBeforeInterest)}</b></div>
                                  <div className="trs-tc-detail-line"><span>+ Interest</span><b>{money(record.interest)}</b></div>
                                  <div className="trs-tc-refund-total"><span>Net refund</span><strong>{money(netRefund)}</strong></div>
                                </section>
                                <section>
                                  <h4>Assessment Order</h4>
                                  <div className="trs-tc-detail-line"><span>{record.orderType || "Order type not available"}</span><b>{record.dateOfOrder || "—"}</b></div>
                                  <div className="trs-tc-order-actions"><button type="button" onClick={() => onEdit(record)}>View / Edit</button></div>
                                </section>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {records.length > pageSize && (
        <div className="trs-tc-record-pagination">
          <span>Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, records.length)} of {records.length} records</span>
          <div className="trs-tc-record-pagination-actions">
            <button type="button" onClick={() => setCurrentPage(page => Math.max(0, page - 1))} disabled={safePage === 0} aria-label="Previous page">‹</button>
            {Array.from({ length: pageCount }, (_, index) => (
              <button type="button" key={index} className={safePage === index ? "active" : ""} aria-current={safePage === index ? "page" : undefined} onClick={() => setCurrentPage(index)}>{index + 1}</button>
            ))}
            <button type="button" onClick={() => setCurrentPage(page => Math.min(pageCount - 1, page + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page">›</button>
          </div>
        </div>
      )}
    </div>
  );
}

const incomeTrendStyles = `
.trs-income-trend-scroll { width: 100%; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; }
.trs-income-trend-svg { display: block; width: 100%; min-width: 900px; height: auto; }
.trs-income-trend-axis-label { fill: #69665F; font-size: 12px; }
.trs-income-trend-year-label { fill: #69665F; font-size: 11px; }
.trs-income-trend-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.trs-income-trend-legend small { flex-basis: 100%; color: #77736B; margin-left: 18px; }
`;

export default TaxReturnSummary;