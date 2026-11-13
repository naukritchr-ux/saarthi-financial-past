import React, { useEffect, useMemo, useState } from "react";
import "./TaxReturnSummary.css";

const TAX_RETURN_API_URL = "/api/tax-return-summary";

const FINANCIAL_YEARS = [
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
    name: record.name ?? "",
    acknowledgementNumber: record.acknowledgement_number ?? record.acknowledgementNumber ?? "",
    formType: record.form_type ?? record.formType ?? "",
    filingStatus: record.filing_status ?? record.filingStatus ?? "",
    itrFilingDate: record.itr_filing_date ?? record.itrFilingDate ?? "",
    grossIncome: record.gross_income ?? record.grossIncome ?? 0,
    taxPayable: record.tax_payable ?? record.taxPayable ?? 0,
    tdsClaim: record.tds_claim ?? record.tdsClaim ?? 0,
    refundProcess: record.refund_process ?? record.refundProcess ?? "",
    refundProcessDate: record.refund_process_date ?? record.refundProcessDate ?? "",
    incomeAssessment: record.income_assessment ?? record.incomeAssessment ?? 0,
    incomeTax: record.income_tax ?? record.incomeTax ?? 0,
    tdsCredit: record.tds_credit ?? record.tdsCredit ?? 0,
    refundAmount: record.refund_amount ?? record.refundAmount ?? 0,
    interest: record.interest ?? 0,
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

  const loadTaxReturnSummary = async financialYear => {
    if (!financialYear) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${TAX_RETURN_API_URL}?financial_year=${encodeURIComponent(financialYear)}`);
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result?.message || "Unable to load Tax Return Summary.");
      const record = unwrap(result);
      if (!record || !record.financial_year) {
        const ay = FINANCIAL_YEARS.find(x => x.financialYear === financialYear)?.assessmentYear || "";
        setForm({ ...INITIAL_FORM, financialYear, assessmentYear: ay });
        setRecordId(null);
        setIsEditing(false);
        return;
      }
      const normalized = normalizeRecord(record);
      setRecordId(normalized.id || null);
      setIsEditing(false);
      setForm({ ...INITIAL_FORM, ...normalized });
    } catch (error) {
      showMessage(error.message || "Unable to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllRecords(); }, []);

  const chooseFinancialYear = async event => {
    const financialYear = event.target.value;
    const ay = FINANCIAL_YEARS.find(x => x.financialYear === financialYear)?.assessmentYear || "";
    setForm({ ...INITIAL_FORM, financialYear, assessmentYear: ay });
    setRecordId(null);
    setIsEditing(false);
    setMessage("");
    if (financialYear) await loadTaxReturnSummary(financialYear);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM); setRecordId(null); setIsEditing(false);
    setMessage(""); setMessageType("");
  };

  const handleSave = async () => {
    if (!form.financialYear || !form.assessmentYear) {
      showMessage("Please select Financial Year and Assessment Year.", "error"); return;
    }
    setSaving(true); setMessage("");
    try {
      const response = await fetch(TAX_RETURN_API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getDatabasePayload()),
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result?.message || "Unable to save Tax Return Summary.");
      const saved = unwrap(result);
      if (saved?.id) setRecordId(saved.id);
      setIsEditing(false); setShowConfirm(false);
      showMessage(result?.message || "Tax Return Summary saved successfully.", "success");
      await Promise.all([loadTaxReturnSummary(form.financialYear), loadAllRecords()]);
    } catch (error) {
      showMessage(error.message || "Unable to save data.", "error");
    } finally { setSaving(false); }
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
    setForm({ ...INITIAL_FORM, ...record });
    setRecordId(record.id || null);
    setIsEditing(false);
    if (record.financialYear) await loadTaxReturnSummary(record.financialYear);
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

  const renderDashboard = () => <div className="trs-content">
    <div className="trs-page-heading">
      <div><span className="trs-eyebrow">OVERVIEW</span><h2>Dashboard</h2><p>Monitor income tax returns and financial performance.</p></div>
      <button className="trs-primary-btn" onClick={() => { resetForm(); setPage("entry"); }}>＋ Add Tax Return</button>
    </div>
    <div className="trs-filter-row">
      <label>Financial Year
        <select value={fyFilter} onChange={e => setFyFilter(e.target.value)}>
          <option value="all">All Financial Years</option>
          {FINANCIAL_YEARS.map(x => <option key={x.financialYear} value={x.financialYear}>FY {x.financialYear}</option>)}
        </select>
      </label>
      <button className="trs-light-btn" onClick={loadAllRecords} disabled={loading}>↻ Refresh Data</button>
    </div>
    {dashboardError && <div className="tax-message error">{dashboardError}</div>}
    {loading && <div className="tax-loading">Loading records...</div>}
    <div className="trs-stats-grid">
      <StatCard label="Total Records" value={records.length.toLocaleString("en-IN")} note="Tax return entries" icon="▤" />
      <StatCard label="Gross Income" value={money(fyFilter === "all" ? totals.gross : records.filter(r => r.financialYear === fyFilter).reduce((s,r) => s + num(r.grossIncome),0))} note="Total reported income" icon="₹" />
      <StatCard label="Tax Liability" value={money(fyFilter === "all" ? totals.tax : records.filter(r => r.financialYear === fyFilter).reduce((s,r) => s + num(r.taxPayable),0))} note="Total tax payable" icon="▣" />
      <StatCard label="Refund Amount" value={money(fyFilter === "all" ? totals.refund : records.filter(r => r.financialYear === fyFilter).reduce((s,r) => s + num(r.refundAmount),0))} note="Assessment refund total" icon="↗" />
    </div>
    <div className="trs-dashboard-grid">
      <section className="trs-panel">
        <div className="trs-panel-heading"><div><h3>Income by Taxpayer</h3><p>Highest gross income records</p></div></div>
        {records.length ? <div className="trs-bars">
          {[...records].filter(r => fyFilter === "all" || r.financialYear === fyFilter).sort((a,b) => num(b.grossIncome)-num(a.grossIncome)).slice(0,6).map((r,i) =>
            <div className="trs-bar-row" key={r.id ?? `${r.name}-${i}`}>
              <div className="trs-bar-label"><span>{r.name || "Unnamed taxpayer"}</span><b>{money(r.grossIncome)}</b></div>
              <div className="trs-bar-track"><div className="trs-bar-fill" style={{ width: `${Math.max(2, num(r.grossIncome) / maxIncome * 100)}%` }} /></div>
            </div>)}
        </div> : <div className="trs-empty">No records available to display.</div>}
      </section>
      <section className="trs-panel">
        <div className="trs-panel-heading"><div><h3>Filing Status</h3><p>Distribution of return records</p></div></div>
        {statusCounts.length ? <div className="trs-status-list">{statusCounts.map(item =>
          <div className="trs-status-row" key={item.status}><span className={`trs-status-dot ${item.status.toLowerCase()}`} /><span>{item.status}</span><b>{item.count}</b></div>)}</div>
          : <div className="trs-empty">No filing status data available.</div>}
      </section>
    </div>
    <section className="trs-panel trs-recent-panel">
      <div className="trs-panel-heading"><div><h3>Recent Taxpayer Records</h3><p>Latest records available in the system</p></div><button className="trs-text-btn" onClick={() => setPage("records")}>View all records →</button></div>
      <RecordsTable records={[...records].slice(-5).reverse()} onEdit={editFromTable} />
    </section>
  </div>;

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
        {isEditing && <button className="trs-light-btn" onClick={() => loadTaxReturnSummary(form.financialYear)}>Cancel Edit</button>}
        {(!recordId || isEditing) && <button className="trs-primary-btn" onClick={() => setShowConfirm(true)} disabled={saving || loading}>{saving ? "Saving..." : "Save Tax Return"}</button>}
        <button className="trs-light-btn" onClick={handleDownload} disabled={loading || saving}>↓ Download PDF</button>
        <button className="trs-ghost-btn" onClick={resetForm} disabled={loading || saving}>Reset</button>
      </div>
    </section>
    {showConfirm && <div className="tax-modal-overlay"><div className="tax-confirm-modal"><h3>Confirm Save</h3><p>Are you sure you want to save the Tax Return Summary for FY {form.financialYear}?</p><div className="tax-modal-actions"><button className="tax-cancel-btn" onClick={() => setShowConfirm(false)} disabled={saving}>Cancel</button><button className="tax-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Confirm"}</button></div></div></div>}
  </div>;

  const renderReports = () => <div className="trs-content">
    <div className="trs-page-heading"><div><span className="trs-eyebrow">ANALYTICS</span><h2>Financial Reports</h2><p>Summary of income, tax liability and refunds from available records.</p></div></div>
    <div className="trs-stats-grid"><StatCard label="Gross Income" value={money(totals.gross)} note="Across all records" icon="₹" /><StatCard label="Tax Liability" value={money(totals.tax)} note="Across all records" icon="▣" /><StatCard label="TDS Claimed" value={money(totals.tds)} note="Across all records" icon="▤" /><StatCard label="Refund Amount" value={money(totals.refund)} note="Across all records" icon="↗" /></div>
    <section className="trs-panel"><div className="trs-panel-heading"><div><h3>Financial Year Summary</h3><p>Aggregated figures by financial year</p></div></div>
      <div className="trs-table-wrap"><table className="trs-table"><thead><tr><th>Financial Year</th><th>Records</th><th>Gross Income</th><th>Tax Payable</th><th>TDS Claimed</th><th>Refund</th></tr></thead><tbody>
        {FINANCIAL_YEARS.filter(y => records.some(r => r.financialYear === y.financialYear)).map(y => { const rows = records.filter(r => r.financialYear === y.financialYear); return <tr key={y.financialYear}><td>FY {y.financialYear}</td><td>{rows.length}</td><td>{money(rows.reduce((s,r)=>s+num(r.grossIncome),0))}</td><td>{money(rows.reduce((s,r)=>s+num(r.taxPayable),0))}</td><td>{money(rows.reduce((s,r)=>s+num(r.tdsClaim),0))}</td><td>{money(rows.reduce((s,r)=>s+num(r.refundAmount),0))}</td></tr>; })}
        {!records.length && <tr><td colSpan="6" className="trs-empty-cell">No records available.</td></tr>}
      </tbody></table></div>
    </section>
  </div>;

  return <div className="trs-app">
    <aside className="trs-sidebar">
      <div className="trs-brand"><div className="trs-brand-mark">₹</div><div><strong>Tax Ledger</strong><small>RETURN MANAGEMENT</small></div></div>
      <div className="trs-nav-label">WORKSPACE</div>
      <nav className="trs-nav">
        {[["dashboard","▦","Dashboard"],["entry","＋","Add Tax Return"],["records","▤","Taxpayer Records"],["reports","▥","Financial Reports"]].map(([key,icon,label]) =>
          <button key={key} className={page === key ? "active" : ""} onClick={() => { setPage(key); if (key === "records") loadAllRecords(); }}><span>{icon}</span>{label}</button>)}
      </nav>
      <div className="trs-sidebar-footer"><span className="trs-sidebar-footer-icon">✓</span><div><b>Tax records</b><small>Centralized management</small></div></div>
    </aside>
    <main className="trs-main">
      <header className="trs-topbar"><div><span>Workspace</span><b>/ {({dashboard:"Dashboard",entry:"Add Tax Return",records:"Taxpayer Records",reports:"Financial Reports"})[page]}</b></div><div className="trs-topbar-right"><span className="trs-live-dot" /> Data management</div></header>
      {page === "dashboard" && renderDashboard()}
      {page === "entry" && renderEntry()}
      {page === "records" && renderRecords()}
      {page === "reports" && renderReports()}
      <footer className="trs-footer">Tax Ledger <span>•</span> Tax Return Management</footer>
    </main>
  </div>;
}

function RecordsTable({ records, onEdit }) {
  if (!records.length) return <div className="trs-empty">No records found. Add a tax return to get started.</div>;
  return <div className="trs-table-wrap"><table className="trs-table"><thead><tr><th>Taxpayer</th><th>Financial Year</th><th>Acknowledgement No.</th><th>Gross Income</th><th>Tax Payable</th><th>Refund</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>{records.map((r,i) => <tr key={r.id ?? `${r.name}-${r.financialYear}-${i}`}><td><b>{r.name || "—"}</b></td><td>{r.financialYear || "—"}</td><td className="trs-ack">{r.acknowledgementNumber || "—"}</td><td>{money(r.grossIncome)}</td><td>{money(r.taxPayable)}</td><td>{money(r.refundAmount)}</td><td><span className={`trs-badge ${String(r.filingStatus || "Draft").toLowerCase()}`}>{r.filingStatus || "Draft"}</span></td><td><button className="trs-row-action" onClick={() => onEdit(r)}>View / Edit</button></td></tr>)}</tbody></table></div>;
}

export default TaxReturnSummary;
