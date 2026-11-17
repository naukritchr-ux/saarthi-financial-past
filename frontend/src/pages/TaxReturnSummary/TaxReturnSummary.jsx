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
const FORM_TYPES = ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7", "ITR-U"];
const FILING_STATUSES = ["Draft", "Filed", "Verified", "Processed", "Defective", "Revised", "Belated"];
const INITIAL_FORM = {
  financialYear: "", assessmentYear: "", name: "", acknowledgementNumber: "",
  formType: "", filingStatus: "", itrFilingDate: "", grossIncome: "",
  taxPayable: "", tdsClaim: "", refundProcess: "", refundProcessDate: "",
  incomeAssessment: "", incomeTax: "", tdsCredit: "", refundAmount: "", interest: "",
};

const num = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = value => `₹${num(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const unwrap = result => result?.data ?? result?.record ?? result;

async function readResponse(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();
  const body = await response.text();
  if (body.trim().startsWith("<")) throw new Error("The API returned HTML instead of JSON. Check the backend URL and proxy configuration.");
  throw new Error(body || "Unexpected server response.");
}

function normalizeRecord(record) {
  return {
    id: record.id,
    financialYear: record.financial_year ?? record.financialYear ?? "",
    assessmentYear: record.assessment_year ?? record.assessmentYear ?? "",
    name: record.name ?? record.taxpayer_name ?? "",
    acknowledgementNumber: record.acknowledgement_number ?? record.acknowledgementNumber ?? "",
    formType: record.form_type ?? record.formType ?? "",
    filingStatus: record.filing_status ?? record.filingStatus ?? "",
    itrFilingDate: record.itr_filing_date ?? record.itrFilingDate ?? "",
    grossIncome: record.gross_income ?? record.grossIncome ?? 0,
    taxPayable: record.tax_payable ?? record.taxPayable ?? 0,
    tdsClaim: record.tds_claim ?? record.tdsClaim ?? 0,
    refundDue: record.refund_due ?? record.refundDue ?? 0,
    refundProcess: record.refund_process ?? record.refundProcess ?? "",
    refundProcessDate: record.refund_process_date ?? record.refundProcessDate ?? "",
    incomeAssessment: record.income_assessment ?? record.incomeAssessment ?? 0,
    incomeTax: record.income_tax ?? record.incomeTax ?? 0,
    tdsCredit: record.tds_credit ?? record.tdsCredit ?? 0,
    refundAmount: record.refund_amount ?? record.refundAmount ?? 0,
    interest: record.interest ?? 0,
    createdAt: record.created_at ?? record.createdAt ?? "",
    updatedAt: record.updated_at ?? record.updatedAt ?? "",
  };
}

function StatCard({ label, value, note, icon }) {
  return <article className="trs-stat-card">
    <div className="trs-stat-top"><span>{label}</span><span className="trs-stat-icon">{icon}</span></div>
    <strong>{value}</strong><small>{note}</small>
  </article>;
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
  const refundDue = useMemo(() => Math.max(0, num(form.tdsClaim) - num(form.taxPayable)), [form.tdsClaim, form.taxPayable]);
  const calculatedRefund = useMemo(() => num(form.tdsCredit) + num(form.interest), [form.tdsCredit, form.interest]);
  const differenceIncome = useMemo(() => num(form.incomeAssessment) - num(form.grossIncome), [form.incomeAssessment, form.grossIncome]);
  const differenceIncomeTax = useMemo(() => num(form.incomeTax) - num(form.taxPayable), [form.incomeTax, form.taxPayable]);
  const differenceReturn = useMemo(() => num(form.refundAmount) - calculatedRefund, [form.refundAmount, calculatedRefund]);

  const showMessage = (text, type = "success") => { setMessage(text); setMessageType(type); };
  const handleChange = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
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
    refund_process_date: form.refundProcessDate || null,
    income_assessment: num(form.incomeAssessment),
    income_tax: num(form.incomeTax),
    tds_credit: num(form.tdsCredit),
    refund_amount: num(form.refundAmount),
    interest: num(form.interest),
    calculated_refund: calculatedRefund,
    difference_income: differenceIncome,
    difference_income_tax: differenceIncomeTax,
    difference_return: differenceReturn,
  });

  // The dashboard requires GET /api/tax-return-summary to return an array of all records.
  const loadAllRecords = async () => {
    setLoading(true);
    setDashboardError("");
    try {
      const response = await fetch(TAX_RETURN_API_URL);
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result?.message || "Unable to load tax return records.");
      const payload = unwrap(result);
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.records) ? payload.records : null);
      if (!list) throw new Error("The list API did not return an array. Add a GET route that returns all tax return records.");
      setRecords(list.map(normalizeRecord));
    } catch (error) {
      setDashboardError(error.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Load one exact ITR record by its database ID. A financial year can contain
  // multiple ITR records, so never use FY alone to identify an editable record.
  const loadTaxReturnById = async id => {
    if (!id) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${TAX_RETURN_API_URL}?id=${encodeURIComponent(id)}`);
      const result = await readResponse(response);
      if (!response.ok) {
        throw new Error(result?.message || "Unable to load the selected Tax Return record.");
      }

      const record = unwrap(result);
      if (!record || !record.id) {
        throw new Error("The selected Tax Return record was not found.");
      }

      const normalized = normalizeRecord(record);
      setRecordId(normalized.id);
      setForm({ ...INITIAL_FORM, ...normalized });
      setIsEditing(false);
    } catch (error) {
      showMessage(error.message || "Unable to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllRecords(); }, []);

  const chooseFinancialYear = event => {
    const financialYear = event.target.value;
    const assessmentYear = FINANCIAL_YEARS.find(
      item => item.financialYear === financialYear
    )?.assessmentYear || "";

    // Selecting an FY starts a new ITR entry. Existing records for that FY
    // remain separate and can be opened from Taxpayer Records.
    setForm({ ...INITIAL_FORM, financialYear, assessmentYear });
    setRecordId(null);
    setIsEditing(false);
    setMessage("");
    setMessageType("");
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM }); setRecordId(null); setIsEditing(false);
    setMessage(""); setMessageType("");
  };

  const handleSave = async () => {
    if (!form.financialYear || !form.assessmentYear) {
      showMessage("Please select Financial Year and Assessment Year.", "error");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await readResponse(response);
      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message || result?.error || "Unable to save Tax Return Summary."
        );
      }

      // Refresh saved records, then clear the entry form for the next ITR.
      // Keep the current page unchanged so the user remains on Add ITR.
      await loadAllRecords();
      setForm({ ...INITIAL_FORM });
      setRecordId(null);
      setIsEditing(false);
      setShowConfirm(false);
      showMessage(
        result?.message || "Tax Return Summary saved successfully. You can now enter the next ITR record.",
        "success"
      );
    } catch (error) {
      console.error("Tax Return Save Error:", error);
      showMessage(error.message || "Unable to save data.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (loading || saving) return;
    if (!form.financialYear || !form.assessmentYear) {
      showMessage("Please select Financial Year and Assessment Year.", "error"); return;
    }
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${TAX_RETURN_API_URL}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/pdf, application/json" },
        body: JSON.stringify(getDatabasePayload()),
      });
      if (!response.ok) {
        const errorResult = await readResponse(response);
        throw new Error(errorResult?.message || "Unable to generate PDF.");
      }
      if (!(response.headers.get("content-type") || "").includes("application/pdf")) {
        throw new Error("The server did not return a valid PDF file.");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The generated PDF is empty.");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `Tax_Return_Summary_FY_${form.financialYear}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
      showMessage("Tax Return Summary PDF generated successfully.", "success");
    } catch (error) { showMessage(error.message || "Unable to generate PDF.", "error"); }
    finally { setLoading(false); }
  };

  const editFromTable = async record => {
    setPage("entry");

    if (record.id) {
      await loadTaxReturnById(record.id);
      return;
    }

    // Fallback for legacy rows that do not have a database ID.
    setForm({ ...INITIAL_FORM, ...record });
    setRecordId(null);
    setIsEditing(true);
    showMessage(
      "This record has no database ID. Saving it will create a new record.",
      "error"
    );
  };

  const filteredRecords = useMemo(() => records.filter(record => {
    const matchesFY = fyFilter === "all" || record.financialYear === fyFilter;
    const matchesStatus = statusFilter === "all" || record.filingStatus === statusFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [record.name, record.acknowledgementNumber, record.financialYear, record.assessmentYear].some(x => String(x || "").toLowerCase().includes(term));
    return matchesFY && matchesStatus && matchesSearch;
  }), [records, fyFilter, statusFilter, search]);

  const totals = useMemo(() => records.reduce((acc, record) => {
    acc.gross += num(record.grossIncome);
    acc.tax += num(record.taxPayable);
    acc.tds += num(record.tdsClaim);
    acc.refund += num(record.refundAmount);
    return acc;
  }, { gross: 0, tax: 0, tds: 0, refund: 0 }), [records]);

  const statusCounts = useMemo(() => FILING_STATUSES.map(status => ({
    status, count: records.filter(r => r.filingStatus === status).length,
  })).filter(x => x.count), [records]);

  const maxIncome = Math.max(1, ...records.map(r => num(r.grossIncome)));
  const renderInput = (label, name, type = "number", placeholder = "Enter amount") => (
    <div className="tax-form-group" key={name}>
      <label htmlFor={name}>{label}</label>
      <input id={name} type={type} name={name} value={form[name]} onChange={handleChange}
        placeholder={placeholder} disabled={fieldsDisabled} min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined} />
    </div>
  );
  const renderReadOnly = (label, value) => (
    <div className="tax-form-group" key={label}><label>{label}</label><input type="text" value={value} readOnly /></div>
  );

  const renderDashboard = () => {
    const dashboardRecords = records.filter(record => fyFilter === "all" || record.financialYear === fyFilter);
    const sum = field => dashboardRecords.reduce((total, record) => total + num(record[field]), 0);
    const totalGross = sum("grossIncome");
    const totalTax = sum("taxPayable");
    const totalTds = sum("tdsClaim");
    const totalRefundDue = sum("refundDue") || dashboardRecords.reduce((total, record) => total + Math.max(0, num(record.tdsClaim) - num(record.taxPayable)), 0);
    const processedRefund = dashboardRecords.reduce((total, record) => {
      const status = String(record.refundProcess || "").toLowerCase();
      return total + (["processed", "received"].includes(status) ? num(record.refundAmount) : 0);
    }, 0);
    const pendingRefund = dashboardRecords.reduce((total, record) => {
      const status = String(record.refundProcess || "pending").toLowerCase();
      return total + (["", "pending"].includes(status) ? Math.max(0, num(record.refundAmount) || num(record.tdsClaim) - num(record.taxPayable)) : 0);
    }, 0);
    const filedCount = dashboardRecords.filter(r => ["filed", "verified", "processed", "revised", "belated"].includes(String(r.filingStatus || "").toLowerCase())).length;
    const pendingCount = dashboardRecords.filter(r => ["draft", ""].includes(String(r.filingStatus || "").toLowerCase())).length;
    const defectiveCount = dashboardRecords.filter(r => String(r.filingStatus || "").toLowerCase() === "defective").length;
    const statusPalette = { Draft: "#D9A441", Filed: "#4B83B8", Verified: "#8C78B8", Processed: "#31966B", Defective: "#C95D57", Revised: "#4D9C9A", Belated: "#8A98A8" };
    const filingBreakdown = FILING_STATUSES.map(status => ({ status, count: dashboardRecords.filter(r => String(r.filingStatus || "").toLowerCase() === status.toLowerCase()).length, color: statusPalette[status] })).filter(item => item.count > 0);
    const statusTotal = filingBreakdown.reduce((total, item) => total + item.count, 0);
    let runningPercent = 0;
    const donutGradient = filingBreakdown.length ? `conic-gradient(${filingBreakdown.map(item => { const start = runningPercent; runningPercent += item.count / statusTotal * 100; return `${item.color} ${start}% ${runningPercent}%`; }).join(", ")})` : "conic-gradient(#e8e3d8 0% 100%)";
    const incomeLeaders = [...dashboardRecords].sort((a, b) => num(b.grossIncome) - num(a.grossIncome)).slice(0, 5);
    const maxIncomeValue = Math.max(1, ...incomeLeaders.map(r => num(r.grossIncome)));
    const yearSummary = FINANCIAL_YEARS.map(year => {
      const rows = records.filter(r => r.financialYear === year.financialYear);
      return { year: year.financialYear, income: rows.reduce((t, r) => t + num(r.grossIncome), 0), tax: rows.reduce((t, r) => t + num(r.taxPayable), 0), count: rows.length };
    }).filter(item => item.count).slice(-6);
    const maxYearIncome = Math.max(1, ...yearSummary.map(item => item.income));
    const attentionCount = defectiveCount + dashboardRecords.filter(r => (num(r.incomeAssessment) && Math.abs(num(r.incomeAssessment) - num(r.grossIncome)) > 1) || (num(r.incomeTax) && Math.abs(num(r.incomeTax) - num(r.taxPayable)) > 1)).length;
    const recentRecords = [...dashboardRecords].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.itrFilingDate || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || b.itrFilingDate || 0).getTime();
      return dateB - dateA;
    }).slice(0, 5);

    return <div className="trs-content trs-dashboard-content">
      <div className="trs-dashboard-hero">
        <div className="trs-hero-copy">
          <span className="trs-eyebrow">TAX INTELLIGENCE · WORKSPACE</span>
          <h2>Good overview.<br/><em>Better decisions.</em></h2>
          <p>Your tax return portfolio, filing progress and refund position — all in one place.</p>
          <div className="trs-hero-meta"><span className="trs-hero-pulse"/> Live records overview <span className="trs-hero-separator">•</span> {dashboardRecords.length.toLocaleString("en-IN")} records in view</div>
        </div>
        <div className="trs-hero-actions">
          <button className="trs-primary-btn" onClick={() => { resetForm(); setPage("entry"); }}>＋ Add Tax Return</button>
          <button className="trs-hero-refresh" onClick={loadAllRecords} disabled={loading}>↻ {loading ? "Refreshing" : "Refresh data"}</button>
        </div>
        <div className="trs-hero-watermark">₹</div>
      </div>

      <div className="trs-dashboard-toolbar">
        <div><span className="trs-toolbar-label">PORTFOLIO VIEW</span><strong>{fyFilter === "all" ? "All financial years" : `FY ${fyFilter}`}</strong></div>
        <label className="trs-year-select"><span>Financial year</span><select value={fyFilter} onChange={e => setFyFilter(e.target.value)}><option value="all">All Financial Years</option>{FINANCIAL_YEARS.map(x => <option key={x.financialYear} value={x.financialYear}>FY {x.financialYear}</option>)}</select></label>
      </div>

      {dashboardError && <div className="tax-message error">{dashboardError}</div>}
      {loading && <div className="tax-loading">Refreshing your tax portfolio…</div>}

      <div className="trs-stats-grid trs-stats-grid-premium">
        <StatCard label="Total returns" value={dashboardRecords.length.toLocaleString("en-IN")} note={`${filedCount} filed or processed`} icon="▤" />
        <StatCard label="Gross income" value={money(totalGross)} note="Combined reported income" icon="₹" />
        <StatCard label="Tax liability" value={money(totalTax)} note="Total tax payable" icon="▣" />
        <StatCard label="TDS claimed" value={money(totalTds)} note="Tax deducted at source" icon="↘" />
        <StatCard label="Refund expected" value={money(totalRefundDue)} note="Based on return TDS less tax" icon="↗" />
        <StatCard label="Refund processed" value={money(processedRefund)} note={`${money(pendingRefund)} currently pending`} icon="✓" />
      </div>

      <div className="trs-insight-strip">
        <div className="trs-insight-icon">✦</div>
        <div className="trs-insight-text"><span>PORTFOLIO INSIGHT</span><strong>{dashboardRecords.length ? (attentionCount ? `${attentionCount} record${attentionCount === 1 ? "" : "s"} may need a review.` : "Your visible portfolio has no flagged filing or assessment differences.") : "Add your first return to unlock portfolio insights."}</strong><small>{dashboardRecords.length ? `${pendingCount} draft or unfiled · ${defectiveCount} defective · ${filedCount} filed, verified or processed` : "Your dashboard will summarize filing progress and tax position automatically."}</small></div>
        {attentionCount > 0 && <button className="trs-insight-link" onClick={() => { setStatusFilter("Defective"); setPage("records"); }}>Review records →</button>}
      </div>

      <div className="trs-dashboard-grid trs-dashboard-grid-premium">
        <section className="trs-panel trs-panel-elevated trs-income-panel">
          <div className="trs-panel-heading"><div><span className="trs-panel-kicker">INCOME DISTRIBUTION</span><h3>Top taxpayer incomes</h3><p>Highest gross income in the selected period</p></div><span className="trs-panel-icon">↗</span></div>
          {incomeLeaders.length ? <div className="trs-leader-bars">{incomeLeaders.map((r, i) => <div className="trs-leader-row" key={r.id || `${r.name}-${i}`}><div className="trs-leader-label"><span className="trs-leader-rank">0{i + 1}</span><strong title={r.name}>{r.name || "Unnamed taxpayer"}</strong><b>{money(r.grossIncome)}</b></div><div className="trs-leader-track"><span style={{ width: `${Math.max(2, num(r.grossIncome) / maxIncomeValue * 100)}%`, background: i === 0 ? "linear-gradient(90deg,#B89548,#E0C77E)" : "linear-gradient(90deg,#24476B,#537B9D)" }}/></div></div>)}</div> : <div className="trs-empty">No income records available for this period.</div>}
          <div className="trs-chart-footnote"><span className="trs-chart-key trs-key-gold"/> Highest income <span className="trs-chart-footnote-text">Ranked by gross income</span></div>
        </section>

        <section className="trs-panel trs-panel-elevated trs-filing-panel">
          <div className="trs-panel-heading"><div><span className="trs-panel-kicker">COMPLIANCE SNAPSHOT</span><h3>Filing status</h3><p>Return progress across this portfolio</p></div><span className="trs-panel-icon">◎</span></div>
          <div className="trs-donut-layout"><div className="trs-donut" style={{ background: donutGradient }}><div className="trs-donut-hole"><strong>{dashboardRecords.length}</strong><span>RETURNS</span></div></div><div className="trs-donut-legend">{filingBreakdown.length ? filingBreakdown.map(item => <div className="trs-legend-row" key={item.status}><span style={{ background: item.color }}/><span>{item.status}</span><b>{item.count}</b></div>) : <span className="trs-muted-note">No filing statuses yet</span>}</div></div>
          <div className="trs-compliance-footer"><div><strong>{filedCount}</strong><span>Filed / completed</span></div><div><strong className="trs-amber-text">{pendingCount}</strong><span>Draft / pending</span></div><div><strong className="trs-red-text">{defectiveCount}</strong><span>Defective</span></div></div>
        </section>
      </div>

      <div className="trs-dashboard-grid trs-dashboard-grid-lower">
        <section className="trs-panel trs-panel-elevated trs-year-panel">
          <div className="trs-panel-heading"><div><span className="trs-panel-kicker">YEAR-ON-YEAR VIEW</span><h3>Income across financial years</h3><p>Latest six financial years with saved records</p></div></div>
          {yearSummary.length ? <div className="trs-year-chart">{yearSummary.map(item => <div className="trs-year-column" key={item.year}><div className="trs-year-bar-area"><span className="trs-year-value">{money(item.income)}</span><div className="trs-year-bar" style={{ height: `${Math.max(5, item.income / maxYearIncome * 100)}%` }}/></div><span className="trs-year-label">{item.year}</span></div>)}</div> : <div className="trs-empty">Financial-year comparison will appear once records are available.</div>}
          <div className="trs-chart-footnote"><span className="trs-chart-key trs-key-navy"/> Gross income <span className="trs-chart-footnote-text">Values aggregated by financial year</span></div>
        </section>

        <section className="trs-panel trs-panel-elevated trs-refund-panel">
          <div className="trs-panel-heading"><div><span className="trs-panel-kicker">REFUND MONITOR</span><h3>Refund position</h3><p>Recorded refund processing status</p></div><span className="trs-panel-icon trs-refund-icon">₹</span></div>
          <div className="trs-refund-amount"><strong>{money(processedRefund)}</strong><span>Processed / received</span></div>
          <div className="trs-refund-track"><span style={{ width: `${processedRefund + pendingRefund > 0 ? Math.min(100, processedRefund / (processedRefund + pendingRefund) * 100) : 0}%` }}/></div>
          <div className="trs-refund-legend"><div><span className="trs-refund-dot paid"/>Processed <b>{money(processedRefund)}</b></div><div><span className="trs-refund-dot pending"/>Pending <b>{money(pendingRefund)}</b></div></div>
          <small className="trs-refund-disclaimer">Calculated from saved refund status and refund amount fields.</small>
        </section>
      </div>

      <section className="trs-panel trs-panel-elevated trs-recent-panel">
        <div className="trs-panel-heading"><div><span className="trs-panel-kicker">LATEST ACTIVITY</span><h3>Recent taxpayer records</h3><p>Most recently updated records in the selected period</p></div><button className="trs-text-btn" onClick={() => setPage("records")}>View all records →</button></div>
        <RecordsTable records={recentRecords} onEdit={editFromTable}/>
      </section>
    </div>;
  };

  const renderRecords = () => <div className="trs-content">
    <div className="trs-page-heading"><div><span className="trs-eyebrow">DATABASE</span><h2>Taxpayer Records</h2><p>Search, filter and open saved tax return records.</p></div><button className="trs-primary-btn" onClick={() => { resetForm(); setPage("entry"); }}>＋ Add Tax Return</button></div>
    <div className="trs-panel">
      <div className="trs-record-filters">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, acknowledgement number or year..." />
        <select value={fyFilter} onChange={e => setFyFilter(e.target.value)}><option value="all">All Financial Years</option>{FINANCIAL_YEARS.map(x => <option key={x.financialYear} value={x.financialYear}>FY {x.financialYear}</option>)}</select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Statuses</option>{FILING_STATUSES.map(x => <option key={x}>{x}</option>)}</select>
      </div>
      <div className="trs-table-caption">{filteredRecords.length} record(s) found</div>
      <RecordsTable records={filteredRecords} onEdit={editFromTable} />
    </div>
  </div>;

  const renderEntry = () => <div className="trs-content">
    <div className="trs-page-heading"><div><span className="trs-eyebrow">ITR MANAGEMENT</span><h2>{recordId ? "Tax Return Details" : "Add Tax Return"}</h2><p>Enter income tax return and assessment information.</p></div>
      <button className="trs-light-btn" onClick={() => setPage("records")}>← Back to Records</button></div>
    {message && <div className={`tax-message ${messageType}`}>{message}</div>}
    {loading && <div className="tax-loading">Loading...</div>}
    <section className="trs-form-panel">
      <section className="tax-section"><h3><span>01</span> Basic Information</h3><div className="tax-form-grid">
        <div className="tax-form-group"><label htmlFor="financialYear">Financial Year</label><select id="financialYear" value={form.financialYear} onChange={chooseFinancialYear} disabled={loading || saving}><option value="">Select Financial Year</option>{FINANCIAL_YEARS.map(x => <option key={x.financialYear} value={x.financialYear}>FY {x.financialYear}</option>)}</select></div>
        <div className="tax-form-group"><label htmlFor="assessmentYear">Assessment Year</label><select id="assessmentYear" name="assessmentYear" value={form.assessmentYear} onChange={handleChange} disabled={fieldsDisabled || loading}><option value="">Select Assessment Year</option>{ASSESSMENT_YEARS.map(x => <option key={x}>{x}</option>)}</select></div>
        {renderInput("Taxpayer Name", "name", "text", "Enter taxpayer name")}
        {renderInput("Acknowledgement Number", "acknowledgementNumber", "text", "Enter acknowledgement number")}
        <div className="tax-form-group"><label htmlFor="formType">ITR Form Type</label><select id="formType" name="formType" value={form.formType} onChange={handleChange} disabled={fieldsDisabled}><option value="">Select Form Type</option>{FORM_TYPES.map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="tax-form-group"><label htmlFor="filingStatus">Filing Status</label><select id="filingStatus" name="filingStatus" value={form.filingStatus} onChange={handleChange} disabled={fieldsDisabled}><option value="">Select Filing Status</option>{FILING_STATUSES.map(x => <option key={x}>{x}</option>)}</select></div>
        {renderInput("ITR Filing Date", "itrFilingDate", "date")}
      </div></section>
      <section className="tax-section"><h3><span>02</span> Income and Tax Details</h3><div className="tax-form-grid">
        {renderInput("Gross Income", "grossIncome")}{renderInput("Tax Payable", "taxPayable")}{renderInput("TDS Claim", "tdsClaim")}
        {renderReadOnly("Refund Due", money(refundDue))}
        <div className="tax-form-group"><label htmlFor="refundProcess">Refund Process</label><select id="refundProcess" name="refundProcess" value={form.refundProcess} onChange={handleChange} disabled={fieldsDisabled}><option value="">Select Status</option>{["Pending","Processed","Received","Not Applicable"].map(x => <option key={x}>{x}</option>)}</select></div>
        {renderInput("Date of Refund Process", "refundProcessDate", "date")}
      </div></section>
      <section className="tax-section"><h3><span>03</span> Assessment Details</h3><div className="tax-form-grid">
        {renderInput("Income as per Assessment", "incomeAssessment")}{renderInput("Income Tax as per AY", "incomeTax")}{renderInput("TDS Credit", "tdsCredit")}{renderInput("Refund Amount", "refundAmount")}{renderInput("Interest", "interest")}{renderReadOnly("Refund Amount (Calculated)", money(calculatedRefund))}
      </div></section>
      <section className="tax-section"><h3><span>04</span> Difference Summary</h3><div className="tax-difference-grid">
        <div className="tax-difference-card"><span>Difference in Income</span><strong>{money(differenceIncome)}</strong></div>
        <div className="tax-difference-card"><span>Difference in Income Tax</span><strong>{money(differenceIncomeTax)}</strong></div>
        <div className="tax-difference-card"><span>Difference in Return</span><strong>{money(differenceReturn)}</strong></div>
      </div></section>
      <div className="trs-form-actions">
        {recordId && !isEditing && <button className="trs-primary-btn" onClick={() => setIsEditing(true)}>Edit Record</button>}
        {isEditing && <button className="trs-light-btn" onClick={() => recordId ? loadTaxReturnById(recordId) : resetForm()}>Cancel Edit</button>}
        {(!recordId || isEditing) && <button className="trs-primary-btn" onClick={() => setShowConfirm(true)} disabled={saving || loading}>{saving ? "Saving..." : "Save Tax Return"}</button>}
        <button className="trs-light-btn" onClick={handleDownload} disabled={loading || saving}>↓ Download PDF</button>
        <button className="trs-ghost-btn" onClick={resetForm} disabled={loading || saving}>Reset</button>
      </div>
    </section>
    {showConfirm && <div className="tax-modal-overlay"><div className="tax-confirm-modal"><h3>Confirm Save</h3><p>Are you sure you want to save the Tax Return Summary for FY {form.financialYear}?</p><div className="tax-modal-actions"><button className="tax-cancel-btn" onClick={() => setShowConfirm(false)} disabled={saving}>Cancel</button><button className="tax-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Confirm"}</button></div></div></div>}
  </div>;


  const renderReconciliation = () => {
    const rows = records.map(r => {
      const checks = [
        { label: "Income", itr: num(r.grossIncome), assessment: num(r.incomeAssessment) },
        { label: "Income Tax", itr: num(r.taxPayable), assessment: num(r.incomeTax) },
        { label: "TDS", itr: num(r.tdsClaim), assessment: num(r.tdsCredit) },
        { label: "Refund", itr: num(r.refundDue), assessment: num(r.refundAmount) },
      ];
      const differences = checks.filter(x => Math.abs(x.itr - x.assessment) > 1);
      return { ...r, checks, differences };
    });
    const flagged = rows.filter(r => r.differences.length);
    return <div className="trs-content">
      <div className="trs-page-heading"><div><span className="trs-eyebrow">COMPLIANCE & VERIFICATION</span><h2>Tax Reconciliation</h2><p>Compare return figures with assessment and credit figures saved in your records.</p></div><span className="trs-summary-chip">{flagged.length} record(s) need review</span></div>
      <div className="trs-stats-grid"><StatCard label="Records checked" value={rows.length} note="Available taxpayer records" icon="▤"/><StatCard label="Matched records" value={rows.length-flagged.length} note="No material difference found" icon="✓"/><StatCard label="Difference found" value={flagged.length} note="Review figures below" icon="!"/></div>
      <section className="trs-panel"><div className="trs-panel-heading"><div><h3>Reconciliation register</h3><p>Differences are calculated as assessment figure minus return figure.</p></div></div>
        <div className="trs-table-wrap"><table className="trs-table"><thead><tr><th>Taxpayer</th><th>FY</th><th>Particular</th><th>ITR Data</th><th>Assessment Data</th><th>Difference</th><th>Status</th></tr></thead><tbody>
          {rows.flatMap(r => r.checks.map((c,i) => <tr key={`${r.id||r.name}-${c.label}`}><td><b>{i===0?(r.name||"—"):""}</b></td><td>{i===0?(r.financialYear||"—"):""}</td><td>{c.label}</td><td>{money(c.itr)}</td><td>{money(c.assessment)}</td><td className={Math.abs(c.assessment-c.itr)>1?"trs-amount-warning":"trs-amount-good"}>{money(c.assessment-c.itr)}</td><td><span className={`trs-badge ${Math.abs(c.assessment-c.itr)>1?"defective":"processed"}`}>{Math.abs(c.assessment-c.itr)>1?"Difference Found":"Matched"}</span></td></tr>))}
          {!rows.length && <tr><td colSpan="7" className="trs-empty-cell">No records available for reconciliation.</td></tr>}
        </tbody></table></div>
        <p className="trs-note">Note: This is a preliminary comparison using the fields currently stored in your database. It is not an official tax assessment or 26AS/AIS verification.</p>
      </section>
    </div>;
  };

  const renderYearAnalysis = () => {
    const years = FINANCIAL_YEARS.map(y => {
      const list = records.filter(r => r.financialYear === y.financialYear);
      return {
        ...y,
        count: list.length,
        income: list.reduce((a, r) => a + num(r.grossIncome), 0),
        tax: list.reduce((a, r) => a + num(r.taxPayable), 0),
        tds: list.reduce((a, r) => a + num(r.tdsClaim), 0),
        refund: list.reduce((a, r) => a + num(r.refundDue), 0),
      };
    }).filter(y => y.count);
    const totalReturns = years.reduce((a, y) => a + y.count, 0);
    const totalIncome = years.reduce((a, y) => a + y.income, 0);
    const totalTax = years.reduce((a, y) => a + y.tax, 0);
    const totalRefund = years.reduce((a, y) => a + y.refund, 0);
    const maxIncome = Math.max(1, ...years.map(y => y.income));
    const latest = years[years.length - 1];
    const previous = years[years.length - 2];
    const incomeChange = latest && previous ? latest.income - previous.income : null;

    return <div className="trs-content trs-analysis-page">
      <div className="trs-page-heading">
        <div>
          <span className="trs-eyebrow">PERIOD-WISE ANALYSIS</span>
          <h2>Financial Year Analysis</h2>
          <p>Understand how income, tax, TDS and refunds change across financial years.</p>
        </div>
        <span className="trs-summary-chip">{years.length} financial years tracked</span>
      </div>

      <div className="trs-analysis-hero">
        <div>
          <span className="trs-analysis-kicker">PORTFOLIO OVERVIEW</span>
          <h3>Financial performance at a glance</h3>
          <p>Figures are aggregated from the saved ITR records available in this module.</p>
        </div>
        <div className="trs-analysis-hero-mark">₹</div>
      </div>

      <div className="trs-analysis-stats">
        <StatCard label="Total Returns" value={totalReturns.toLocaleString("en-IN")} note="Saved ITR records" icon="▤" />
        <StatCard label="Gross Income" value={money(totalIncome)} note="Across tracked years" icon="₹" />
        <StatCard label="Tax Payable" value={money(totalTax)} note="Recorded tax liability" icon="▣" />
        <StatCard label="Refund Due" value={money(totalRefund)} note="Based on TDS less tax" icon="↗" />
      </div>

      <div className="trs-analysis-grid">
        <section className="trs-panel trs-analysis-chart-panel">
          <div className="trs-panel-heading">
            <div><span className="trs-panel-kicker">YEARLY TREND</span><h3>Gross income by financial year</h3><p>Compare total gross income recorded for each FY.</p></div>
            <span className="trs-panel-icon">▥</span>
          </div>
          {years.length ? <div className="trs-analysis-bars">
            {years.map((y, index) => <div className="trs-analysis-bar-item" key={y.financialYear}>
              <div className="trs-analysis-bar-value">{money(y.income)}</div>
              <div className="trs-analysis-bar-track"><span style={{ height: `${Math.max(4, y.income / maxIncome * 100)}%` }} /></div>
              <b>{y.financialYear}</b>
              <small>{y.count} {y.count === 1 ? "return" : "returns"}</small>
            </div>)}
          </div> : <div className="trs-empty-cell">Add records to view the financial year trend.</div>}
          <div className="trs-analysis-chart-note"><i /> Gross income · grouped by financial year</div>
        </section>

        <section className="trs-panel trs-analysis-insight-panel">
          <span className="trs-panel-kicker">LATEST AVAILABLE YEAR</span>
          {latest ? <>
            <h3>FY {latest.financialYear}</h3>
            <p className="trs-analysis-ay">Assessment Year {latest.assessmentYear}</p>
            <div className="trs-analysis-highlight"><span>Gross income</span><strong>{money(latest.income)}</strong></div>
            <div className="trs-analysis-mini-row"><span>Returns recorded</span><b>{latest.count}</b></div>
            <div className="trs-analysis-mini-row"><span>Tax payable</span><b>{money(latest.tax)}</b></div>
            <div className="trs-analysis-mini-row"><span>TDS claimed</span><b>{money(latest.tds)}</b></div>
            <div className="trs-analysis-mini-row"><span>Refund due</span><b className="trs-amount-good">{money(latest.refund)}</b></div>
            {incomeChange !== null && <div className={`trs-analysis-change ${incomeChange >= 0 ? "positive" : "negative"}`}>
              {incomeChange >= 0 ? "↑" : "↓"} {money(Math.abs(incomeChange))} {incomeChange >= 0 ? "higher" : "lower"} than the previous recorded FY
            </div>}
          </> : <div className="trs-empty-cell">No financial year data available.</div>}
        </section>
      </div>

      <section className="trs-panel trs-analysis-table-panel">
        <div className="trs-panel-heading"><div><span className="trs-panel-kicker">DETAILED BREAKDOWN</span><h3>FY and AY comparison</h3><p>Aggregated values for each financial year with saved records.</p></div></div>
        <div className="trs-table-wrap"><table className="trs-table">
          <thead><tr><th>Financial Year</th><th>Assessment Year</th><th>Returns</th><th>Gross Income</th><th>Tax Payable</th><th>TDS Claimed</th><th>Refund Due</th></tr></thead>
          <tbody>
            {years.slice().reverse().map(y => <tr key={y.financialYear}>
              <td><b>FY {y.financialYear}</b></td><td>AY {y.assessmentYear}</td><td>{y.count}</td>
              <td>{money(y.income)}</td><td>{money(y.tax)}</td><td>{money(y.tds)}</td><td className="trs-amount-good">{money(y.refund)}</td>
            </tr>)}
            {!years.length && <tr><td colSpan="7" className="trs-empty-cell">No financial year data available.</td></tr>}
          </tbody>
        </table></div>
      </section>
      <p className="trs-note">Note: Refund Due is calculated from TDS Claimed less Tax Payable, with a minimum of zero, using the existing application calculation.</p>
    </div>;
  };

  const exportRecordsCsv = () => {
    const headers = ["Taxpayer Name","Financial Year","Assessment Year","Acknowledgement Number","ITR Form Type","Filing Status","Gross Income","Tax Payable","TDS Claimed","Refund Due","Refund Status","Refund Amount"];
    const keys = ["name","financialYear","assessmentYear","acknowledgementNumber","formType","filingStatus","grossIncome","taxPayable","tdsClaim","refundDue","refundProcess","refundAmount"];
    const quote = value => `"${String(value ?? "").replace(/"/g,'""')}"`;
    const csv = [headers.map(quote).join(","), ...records.map(r=>keys.map(k=>quote(r[k])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8;"}));
    const a=document.createElement("a"); a.href=url; a.download="tax-return-records.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const renderSettings = () => <div className="trs-content"><div className="trs-page-heading"><div><span className="trs-eyebrow">APPLICATION CONTROL</span><h2>Settings & Data Management</h2><p>Manage your records export and review application configuration.</p></div></div>
    <div className="trs-settings-grid">
      <section className="trs-panel trs-setting-card"><span className="trs-setting-icon">⇩</span><h3>Export taxpayer records</h3><p>Download all currently loaded tax return records as a CSV file that can be opened in Excel.</p><button className="trs-primary-btn" onClick={exportRecordsCsv} disabled={!records.length}>Download CSV</button></section>
      <section className="trs-panel trs-setting-card"><span className="trs-setting-icon">↻</span><h3>Refresh application data</h3><p>Fetch the latest taxpayer records from the connected API.</p><button className="trs-light-btn" onClick={loadAllRecords} disabled={loading}>{loading?"Refreshing…":"Refresh records"}</button></section>
      <section className="trs-panel trs-setting-card"><span className="trs-setting-icon">▤</span><h3>Data overview</h3><p><b>{records.length}</b> records currently loaded. Records are stored through your configured backend.</p><span className="trs-setting-foot">Taxpayer records · CSV export</span></section>
      <section className="trs-panel trs-setting-card"><span className="trs-setting-icon">⚙</span><h3>Application configuration</h3><p>Financial years, ITR form types and filing statuses are currently managed in the application.</p><span className="trs-setting-foot">Import, backup automation and editable configuration require backend support.</span></section>
    </div>
  </div>;

  const renderReports = () => {
    const reportRecords = records.filter(record => {
      const matchesFY = reportFY === "all" || record.financialYear === reportFY;
      const matchesStatus = reportStatus === "all" || record.filingStatus === reportStatus;
      const matchesType = reportType === "all" || record.formType === reportType;
      return matchesFY && matchesStatus && matchesType;
    });
    const reportTotals = reportRecords.reduce((acc, record) => {
      acc.gross += num(record.grossIncome);
      acc.tax += num(record.taxPayable);
      acc.tds += num(record.tdsClaim);
      acc.refundDue += num(record.refundDue);
      acc.refundAmount += num(record.refundAmount);
      return acc;
    }, { gross: 0, tax: 0, tds: 0, refundDue: 0, refundAmount: 0 });

    const exportReportCsv = () => {
      const headers = ["Taxpayer Name","Financial Year","Assessment Year","Acknowledgement Number","ITR Form Type","Filing Status","Gross Income","Tax Payable","TDS Claimed","Refund Due","Refund Status","Refund Amount"];
      const keys = ["name","financialYear","assessmentYear","acknowledgementNumber","formType","filingStatus","grossIncome","taxPayable","tdsClaim","refundDue","refundProcess","refundAmount"];
      const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = [headers.map(quote).join(","), ...reportRecords.map(r => keys.map(k => quote(r[k])).join(","))].join("\\n");
      const url = URL.createObjectURL(new Blob(["\\ufeff", csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `tax-return-report-${reportFY === "all" ? "all-years" : reportFY}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    return <div className="trs-content trs-reports-page">
      <div className="trs-page-heading">
        <div><span className="trs-eyebrow">REPORT CENTRE</span><h2>Financial Reports</h2><p>Filter saved tax return records and export a report for your selected period.</p></div>
        <button className="trs-primary-btn" onClick={exportReportCsv} disabled={!reportRecords.length}>⇩ Export Report CSV</button>
      </div>

      <section className="trs-panel trs-report-filter-panel">
        <div className="trs-panel-heading"><div><span className="trs-panel-kicker">REPORT CONFIGURATION</span><h3>Choose report filters</h3><p>Apply filters to the summary and detailed report below.</p></div></div>
        <div className="trs-report-filters">
          <label>Financial Year
            <select value={reportFY} onChange={e => setReportFY(e.target.value)}>
              <option value="all">All Financial Years</option>
              {FINANCIAL_YEARS.filter(y => records.some(r => r.financialYear === y.financialYear)).map(y => <option key={y.financialYear} value={y.financialYear}>FY {y.financialYear}</option>)}
            </select>
          </label>
          <label>Filing Status
            <select value={reportStatus} onChange={e => setReportStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              {FILING_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>ITR Form
            <select value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="all">All ITR Forms</option>
              {FORM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <button className="trs-light-btn" type="button" onClick={() => { setReportFY("all"); setReportStatus("all"); setReportType("all"); }}>Reset Filters</button>
        </div>
      </section>

      <div className="trs-report-result-head"><div><b>Report summary</b><span>{reportRecords.length} matching {reportRecords.length === 1 ? "record" : "records"}</span></div><span className="trs-summary-chip">{reportFY === "all" ? "All years" : `FY ${reportFY}`}</span></div>
      <div className="trs-report-stats">
        <StatCard label="Gross Income" value={money(reportTotals.gross)} note="Filtered records" icon="₹" />
        <StatCard label="Tax Liability" value={money(reportTotals.tax)} note="Recorded tax payable" icon="▣" />
        <StatCard label="TDS Claimed" value={money(reportTotals.tds)} note="Filtered records" icon="▤" />
        <StatCard label="Refund Due" value={money(reportTotals.refundDue)} note="TDS claimed less tax payable" icon="↗" />
      </div>

      <section className="trs-panel trs-report-table-panel">
        <div className="trs-panel-heading"><div><span className="trs-panel-kicker">RECORD DETAIL</span><h3>Tax return report</h3><p>Detailed records matching the selected filters.</p></div></div>
        <div className="trs-table-wrap"><table className="trs-table">
          <thead><tr><th>Taxpayer</th><th>FY / AY</th><th>ITR Form</th><th>Filing Status</th><th>Gross Income</th><th>Tax Payable</th><th>TDS Claimed</th><th>Refund Due</th></tr></thead>
          <tbody>
            {reportRecords.map((record, index) => <tr key={record.id ?? `${record.name}-${record.financialYear}-${index}`}>
              <td><b>{record.name || "—"}</b><small className="trs-report-ack">{record.acknowledgementNumber || "No acknowledgement number"}</small></td>
              <td>{record.financialYear || "—"}<small className="trs-report-ack">AY {record.assessmentYear || "—"}</small></td>
              <td>{record.formType || "—"}</td><td>{record.filingStatus || "—"}</td>
              <td>{money(record.grossIncome)}</td><td>{money(record.taxPayable)}</td><td>{money(record.tdsClaim)}</td><td className="trs-amount-good">{money(record.refundDue)}</td>
            </tr>)}
            {!reportRecords.length && <tr><td colSpan="8" className="trs-empty-cell">No records match the selected filters.</td></tr>}
          </tbody>
        </table></div>
      </section>
      <p className="trs-note">Report values are based on the fields currently stored in Tax Return Summary. Outstanding tax is not calculated because advance-tax and self-assessment-tax payment fields are not part of the current record structure.</p>
    </div>;
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
    if (["records", "reconciliation", "analysis", "reports", "settings"].includes(key)) {
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

        <nav className="trs-section-nav" aria-label="Tax Return Summary sections">
          {sectionNavigation.map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              className={page === key ? "active" : ""}
              aria-current={page === key ? "page" : undefined}
              onClick={() => navigateTo(key)}
            >
              <span className="trs-section-nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="trs-workspace-heading">
          <div>
            <span>WORKSPACE</span>
            <b>{pageTitles[page]}</b>
          </div>
          <span className="trs-workspace-status"><i /> Connected module</span>
        </div>

        {page === "dashboard" && renderDashboard()}
        {page === "entry" && renderEntry()}
        {page === "records" && renderRecords()}
        {page === "reconciliation" && renderReconciliation()}
        {page === "analysis" && renderYearAnalysis()}
        {page === "reports" && renderReports()}
        {page === "settings" && renderSettings()}

        <footer className="trs-footer">Tax Return Summary <span>•</span> Saarthi Financial - Past</footer>
      </main>
    </div>
  );
}

function RecordsTable({ records, onEdit }) {
  if (!records.length) return <div className="trs-empty">No records found. Add a tax return to get started.</div>;
  return <div className="trs-table-wrap"><table className="trs-table"><thead><tr><th>Taxpayer</th><th>Financial Year</th><th>Acknowledgement No.</th><th>Gross Income</th><th>Tax Payable</th><th>Refund</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>{records.map((r,i) => <tr key={r.id ?? `${r.name}-${r.financialYear}-${i}`}><td><b>{r.name || "—"}</b></td><td>{r.financialYear || "—"}</td><td className="trs-ack">{r.acknowledgementNumber || "—"}</td><td>{money(r.grossIncome)}</td><td>{money(r.taxPayable)}</td><td>{money(r.refundAmount)}</td><td><span className={`trs-badge ${String(r.filingStatus || "Draft").toLowerCase()}`}>{r.filingStatus || "Draft"}</span></td><td><button className="trs-row-action" onClick={() => onEdit(r)}>View / Edit</button></td></tr>)}</tbody></table></div>;
}

export default TaxReturnSummary;
