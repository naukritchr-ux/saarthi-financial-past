import React, { useEffect, useMemo, useState } from "react";
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

const INITIAL_FORM = {
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

const money = value =>
  `₹${num(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const unwrap = result => result?.data ?? result?.record ?? result;

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
    refundDue: record.refund_due ?? record.refundDue ?? 0,
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
  const [records, setRecords] = useState([]);
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

  const fieldsDisabled = Boolean(recordId) && !isEditing;

  const refundDue = useMemo(
    () => Math.max(0, num(form.tdsClaim) - num(form.taxPayable)),
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
    () => netRefundAmount - refundDue,
    [netRefundAmount, refundDue]
  );

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleChange = event => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  const getDatabasePayload = () => ({
    ...(recordId ? { id: recordId } : {}),
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

      setRecords(list.map(normalizeRecord));
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

  const handleSave = async () => {
    if (!form.financialYear || !form.assessmentYear) {
      showMessage(
        "Please select Financial Year and Assessment Year.",
        "error"
      );
      return;
    }

    if (!form.name.trim()) {
      showMessage("Please enter the taxpayer name.", "error");
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
          record.acknowledgementNumber,
          record.financialYear,
          record.assessmentYear,
        ].some(value =>
          String(value || "").toLowerCase().includes(term)
        );

      return matchesFY && matchesStatus && matchesSearch;
    });
  }, [records, fyFilter, statusFilter, search]);

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

    const content = `
      <h2>Taxpayer Information</h2>
      <div class="pdf-grid">
        ${pdfField("Taxpayer Name", savedRecord.name)}
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
        ${pdfField("Refund Due", money(savedRecord.refundDue))}
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

  // Export only the currently filtered Taxpayer Records.  
  const exportRecordsCsv = () => {
    const headers = [
      "Taxpayer Name",
      "Financial Year",
      "Assessment Year",
      "Acknowledgement Number",
      "ITR Form Type",
      "Filing Status",
      "Gross Income",
      "Tax Payable",
      "TDS Claimed",
      "Refund Due",
      "Refund Status",
      "Refund Amount Before Interest"
    ];

    const keys = [
      "name",
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
      ...records.map(record =>
        keys.map(key => quote(record[key])).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\ufeff", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tax-return-records.csv";
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

    const content = `
      <h2>Taxpayer Records</h2>
      <p>
        Total records: <strong>${filteredRecords.length}</strong>
      </p>

      <table class="pdf-table">
        <thead>
          <tr>
            <th>Taxpayer</th>
            <th>FY</th>
            <th>AY</th>
            <th>Acknowledgement No.</th>
            <th>ITR Form</th>
            <th>Status</th>
            <th>Gross Income</th>
            <th>Tax Payable</th>
            <th>TDS Claimed</th>
            <th>Refund Due</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p class="pdf-note">
        This report includes only the records matching the currently selected search and filters.
      </p>
    `;

    try {
      openPrintWindow("Taxpayer Records Report", content, true);
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

  const renderInput = (
    label,
    name,
    type = "number",
    placeholder = "Enter amount"
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

    const sum = field =>
      dashboardRecords.reduce(
        (total, record) => total + num(record[field]),
        0
      );

    const totalGross = sum("grossIncome");
    const totalTax = sum("taxPayable");
    const totalTds = sum("tdsClaim");

    const totalRefundDue =
      sum("refundDue") ||
      dashboardRecords.reduce(
        (total, record) =>
          total +
          Math.max(
            0,
            num(record.tdsClaim) - num(record.taxPayable)
          ),
        0
      );

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

    const incomeLeaders = [...dashboardRecords]
      .sort(
        (a, b) =>
          num(b.grossIncome) - num(a.grossIncome)
      )
      .slice(0, 5);

    const maxIncomeValue = Math.max(
      1,
      ...incomeLeaders.map(record =>
        num(record.grossIncome)
      )
    );

    const yearSummary = FINANCIAL_YEARS.map(year => {
      const rows = records.filter(
        record =>
          record.financialYear === year.financialYear
      );

      return {
        year: year.financialYear,
        income: rows.reduce(
          (total, record) =>
            total + num(record.grossIncome),
          0
        ),
        tax: rows.reduce(
          (total, record) =>
            total + num(record.taxPayable),
          0
        ),
        count: rows.length,
      };
    })
      .filter(item => item.count)
      .slice(-6);

    const maxYearIncome = Math.max(
      1,
      ...yearSummary.map(item => item.income)
    );

    const attentionCount =
      defectiveCount +
      dashboardRecords.filter(
        record =>
          (num(record.totalAssessedIncome) &&
            Math.abs(
              num(record.totalAssessedIncome) -
              num(record.grossIncome)
            ) > 1) ||
          (num(record.totalAssessedTaxPayable) &&
            Math.abs(
              num(record.totalAssessedTaxPayable) -
              num(record.taxPayable)
            ) > 1)
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
              Live records overview
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
            label="Total returns"
            value={dashboardRecords.length.toLocaleString("en-IN")}
            note={`${filedCount} filed or processed`}
            icon="▤"
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
            note="Tax deducted at source"
            icon="↘"
          />

          <StatCard
            label="Refund expected"
            value={money(totalRefundDue)}
            note="Based on return TDS less tax"
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

        <div className="trs-dashboard-grid trs-dashboard-grid-premium">
          <section className="trs-panel trs-panel-elevated trs-income-panel">
            <div className="trs-panel-heading">
              <div>
                <span className="trs-panel-kicker">
                  INCOME DISTRIBUTION
                </span>
                <h3>Top taxpayer incomes</h3>
                <p>
                  Highest gross income in the selected period
                </p>
              </div>

              <span className="trs-panel-icon">↗</span>
            </div>

            {incomeLeaders.length ? (
              <div className="trs-leader-bars">
                {incomeLeaders.map((record, index) => (
                  <div
                    className="trs-leader-row"
                    key={
                      record.id ||
                      `${record.name}-${index}`
                    }
                  >
                    <div className="trs-leader-label">
                      <span className="trs-leader-rank">
                        0{index + 1}
                      </span>

                      <strong title={record.name}>
                        {record.name || "Unnamed taxpayer"}
                      </strong>

                      <b>{money(record.grossIncome)}</b>
                    </div>

                    <div className="trs-leader-track">
                      <span
                        style={{
                          width: `${
                            Math.max(
                              2,
                              (num(record.grossIncome) /
                                maxIncomeValue) *
                                100
                            )
                          }%`,
                          background:
                            index === 0
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
              <span className="trs-chart-key trs-key-gold" />
              Highest income
              <span className="trs-chart-footnote-text">
                Ranked by gross income
              </span>
            </div>
          </section>

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
                        <span
                          style={{ background: item.color }}
                        />
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
                  Latest six financial years with saved records
                </p>
              </div>
            </div>

            {yearSummary.length ? (
              <div className="trs-year-chart">
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
                          height: `${
                            Math.max(
                              5,
                              (item.income / maxYearIncome) * 100
                            )
                          }%`,
                        }}
                      />
                    </div>

                    <span className="trs-year-label">
                      {item.year}
                    </span>
                  </div>
                ))}
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
                  REFUND MONITOR
                </span>
                <h3>Refund position</h3>
                <p>
                  Recorded refund processing status
                </p>
              </div>

              <span className="trs-panel-icon trs-refund-icon">
                ₹
              </span>
            </div>

            <div className="trs-refund-amount">
              <strong>{money(processedRefund)}</strong>
              <span>Processed / received</span>
            </div>

            <div className="trs-refund-track">
              <span
                style={{
                  width: `${
                    processedRefund + pendingRefund > 0
                      ? Math.min(
                          100,
                          (processedRefund /
                            (processedRefund + pendingRefund)) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="trs-refund-legend">
              <div>
                <span className="trs-refund-dot paid" />
                Processed
                <b>{money(processedRefund)}</b>
              </div>

              <div>
                <span className="trs-refund-dot pending" />
                Pending
                <b>{money(pendingRefund)}</b>
              </div>
            </div>

            <small className="trs-refund-disclaimer">
              Calculated from saved refund status and refund amount fields.
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
            Search, filter and open saved tax return records.
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

      <div className="trs-panel">
        <div className="trs-record-filters">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search name, acknowledgement number or year..."
          />

          <select
            value={fyFilter}
            onChange={event => setFyFilter(event.target.value)}
          >
            <option value="all">All Financial Years</option>

            {FINANCIAL_YEARS.map(year => (
              <option
                key={year.financialYear}
                value={year.financialYear}
              >
                FY {year.financialYear}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All Statuses</option>

            {FILING_STATUSES.map(status => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="trs-record-export-bar">
          <div className="trs-table-caption">
            {filteredRecords.length} record(s) found
          </div>

          <div className="trs-record-export-actions">
            <button
              className="trs-light-btn"
              type="button"
              onClick={downloadRecordsPdf}
              disabled={!filteredRecords.length}
            >
              ↓ Download PDF
            </button>

            <button
              className="trs-primary-btn"
              type="button"
              onClick={exportRecordsCsv}
              disabled={!filteredRecords.length}
            >
              ↓ Download CSV
            </button>
          </div>
        </div>

        {message && (
          <div className={`tax-message ${messageType}`}>
            {message}
          </div>
        )}

        <RecordsTable
          records={filteredRecords}
          onEdit={editFromTable}
        />
      </div>
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
              "Enter taxpayer name"
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
              "Refund Due",
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
              <span>Difference in Return</span>
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
              Summary for FY {form.financialYear}?
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
    const rows = records.map(record => {
      const checks = [
        {
          label: "Income",
          itr: num(record.grossIncome),
          assessment: num(record.totalAssessedIncome),
        },
        {
          label: "Income Tax",
          itr: num(record.taxPayable),
          assessment: num(record.totalAssessedTaxPayable),
        },
        {
          label: "TDS",
          itr: num(record.tdsClaim),
          assessment: num(record.tdsCredit),
        },
        {
          label: "Net Refund",
          itr: num(record.refundDue),
          assessment: num(record.refundAmountBeforeInterest) + num(record.interest),
        },
      ];

      const differences = checks.filter(
        item => Math.abs(item.itr - item.assessment) > 1
      );

      return {
        ...record,
        checks,
        differences,
      };
    });

    const flagged = rows.filter(
      record => record.differences.length
    );

    return (
      <div className="trs-content">
        <div className="trs-page-heading">
          <div>
            <span className="trs-eyebrow">
              COMPLIANCE & VERIFICATION
            </span>
            <h2>Tax Reconciliation</h2>
            <p>
              Compare return figures with assessment and credit
              figures saved in your records.
            </p>
          </div>

          <span className="trs-summary-chip">
            {flagged.length} record(s) need review
          </span>
        </div>

        <div className="trs-stats-grid">
          <StatCard
            label="Records checked"
            value={rows.length}
            note="Available taxpayer records"
            icon="▤"
          />

          <StatCard
            label="Matched records"
            value={rows.length - flagged.length}
            note="No material difference found"
            icon="✓"
          />

          <StatCard
            label="Difference found"
            value={flagged.length}
            note="Review figures below"
            icon="!"
          />
        </div>

        <section className="trs-panel">
          <div className="trs-panel-heading">
            <div>
              <h3>Reconciliation register</h3>
              <p>
                Differences are calculated as assessment figure
                minus return figure.
              </p>
            </div>
          </div>

          <div className="trs-table-wrap">
            <table className="trs-table">
              <thead>
                <tr>
                  <th>Taxpayer</th>
                  <th>FY</th>
                  <th>Particular</th>
                  <th>ITR Data</th>
                  <th>Assessment Data</th>
                  <th>Difference</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.flatMap(record =>
                  record.checks.map((check, index) => (
                    <tr
                      key={`${record.id || record.name}-${check.label}`}
                    >
                      <td>
                        <b>
                          {index === 0
                            ? record.name || "—"
                            : ""}
                        </b>
                      </td>

                      <td>
                        {index === 0
                          ? record.financialYear || "—"
                          : ""}
                      </td>

                      <td>{check.label}</td>
                      <td>{money(check.itr)}</td>
                      <td>{money(check.assessment)}</td>

                      <td
                        className={
                          Math.abs(
                            check.assessment - check.itr
                          ) > 1
                            ? "trs-amount-warning"
                            : "trs-amount-good"
                        }
                      >
                        {money(
                          check.assessment - check.itr
                        )}
                      </td>

                      <td>
                        <span
                          className={`trs-badge ${
                            Math.abs(
                              check.assessment - check.itr
                            ) > 1
                              ? "defective"
                              : "processed"
                          }`}
                        >
                          {Math.abs(
                            check.assessment - check.itr
                          ) > 1
                            ? "Difference Found"
                            : "Matched"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

                {!rows.length && (
                  <tr>
                    <td
                      colSpan="7"
                      className="trs-empty-cell"
                    >
                      No records available for reconciliation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="trs-note">
            Note: This is a preliminary comparison using the
            fields currently stored in your database. It is not
            an official tax assessment or 26AS/AIS verification.
          </p>
        </section>
      </div>
    );
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
    }).filter(year => year.count);

    const totalReturns = years.reduce(
      (total, year) => total + year.count,
      0
    );

    const totalIncome = years.reduce(
      (total, year) => total + year.income,
      0
    );

    const totalTax = years.reduce(
      (total, year) => total + year.tax,
      0
    );

    const totalRefund = years.reduce(
      (total, year) => total + year.refund,
      0
    );

    const maxIncome = Math.max(
      1,
      ...years.map(year => year.income)
    );

    const latest = years[years.length - 1];
    const previous = years[years.length - 2];

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
            label="Refund Due"
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
              <div className="trs-analysis-bars">
                {years.map(year => (
                  <div
                    className="trs-analysis-bar-item"
                    key={year.financialYear}
                  >
                    <div className="trs-analysis-bar-value">
                      {money(year.income)}
                    </div>

                    <div className="trs-analysis-bar-track">
                      <span
                        style={{
                          height: `${
                            Math.max(
                              4,
                              (year.income / maxIncome) * 100
                            )
                          }%`,
                        }}
                      />
                    </div>

                    <b>{year.financialYear}</b>

                    <small>
                      {year.count}{" "}
                      {year.count === 1 ? "return" : "returns"}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="trs-empty-cell">
                Add records to view the financial year trend.
              </div>
            )}

            <div className="trs-analysis-chart-note">
              <i />
              Gross income · grouped by financial year
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
                  <th>Refund Due</th>
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
          Note: Refund Due is calculated from TDS Claimed less
          Tax Payable, with a minimum of zero, using the existing
          application calculation.
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
            <b>{records.length}</b> records currently loaded.
            Records are stored through your configured backend.
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
            <b>Report summary</b>
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
            label="Refund Due"
            value={money(reportTotals.refundDue)}
            note="TDS claimed less tax payable"
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
                  <th>Refund Due</th>
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
            Connected module
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

        <footer className="trs-footer">
          Tax Return Summary <span>•</span> Saarthi Financial - Past
        </footer>
      </main>
    </div>
  );
}

function RecordsTable({ records, onEdit }) {
  if (!records.length) {
    return (
      <div className="trs-empty">
        No records found. Add a tax return to get started.
      </div>
    );
  }

  return (
    <div className="trs-table-wrap">
      <table className="trs-table">
        <thead>
          <tr>
            <th>Taxpayer</th>
            <th>Financial Year</th>
            <th>Acknowledgement No.</th>
            <th>Gross Income</th>
            <th>Tax Payable</th>
            <th>Refund</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record, index) => (
            <tr
              key={
                record.id ??
                `${record.name}-${record.financialYear}-${index}`
              }
            >
              <td>
                <b>{record.name || "—"}</b>
              </td>

              <td>{record.financialYear || "—"}</td>

              <td className="trs-ack">
                {record.acknowledgementNumber || "—"}
              </td>

              <td>{money(record.grossIncome)}</td>
              <td>{money(record.taxPayable)}</td>
              <td>{money(num(record.refundAmountBeforeInterest) + num(record.interest))}</td>

              <td>
                <span
                  className={`trs-badge ${
                    String(
                      record.filingStatus || "Draft"
                    ).toLowerCase()
                  }`}
                >
                  {record.filingStatus || "Draft"}
                </span>
              </td>

              <td>
                <button
                  className="trs-row-action"
                  onClick={() => onEdit(record)}
                >
                  View / Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaxReturnSummary;