
import React, { useEffect, useMemo, useState } from "react";
import "./TaxReturnSummary.css";

const TAX_RETURN_API_URL = "/api/tax-return-summary";

const FINANCIAL_YEARS = [
  { financialYear: "2021-22", assessmentYear: "2022-23" },
  { financialYear: "2022-23", assessmentYear: "2023-24" },
  { financialYear: "2023-24", assessmentYear: "2024-25" },
  { financialYear: "2024-25", assessmentYear: "2025-26" },
  { financialYear: "2025-26", assessmentYear: "2026-27" },
  { financialYear: "2026-27", assessmentYear: "2027-28" },
];

const ASSESSMENT_YEARS = [
  "2022-23",
  "2023-24",
  "2024-25",
  "2025-26",
  "2026-27",
  "2027-28",
];

const FORM_TYPES = [
  "ITR-1",
  "ITR-2",
  "ITR-3",
  "ITR-4",
  "ITR-5",
  "ITR-6",
  "ITR-7",
  "ITR-U",
];

const FILING_STATUSES = [
  "Draft",
  "Filed",
  "Verified",
  "Processed",
  "Defective",
  "Revised",
  "Belated",
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
  refundProcessDate: "",
  incomeAssessment: "",
  incomeTax: "",
  tdsCredit: "",
  refundAmount: "",
  interest: "",
};

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) =>
  `₹${numericValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const responseText = await response.text();

  if (responseText.trim().startsWith("<")) {
    throw new Error(
      "The API returned an HTML page instead of JSON. Check your backend URL and Vite proxy configuration."
    );
  }

  throw new Error(
    responseText || "The server returned an unexpected response."
  );
}

function TaxReturnSummary() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const fieldsDisabled = Boolean(recordId) && !isEditing;

  // Existing calculations retained.
  const refundDue = useMemo(
    () =>
      Math.max(
        0,
        numericValue(form.tdsClaim) - numericValue(form.taxPayable)
      ),
    [form.tdsClaim, form.taxPayable]
  );

  const calculatedRefund = useMemo(
    () => numericValue(form.tdsCredit) + numericValue(form.interest),
    [form.tdsCredit, form.interest]
  );

  const differenceIncome = useMemo(
    () =>
      numericValue(form.incomeAssessment) -
      numericValue(form.grossIncome),
    [form.incomeAssessment, form.grossIncome]
  );

  const differenceIncomeTax = useMemo(
    () =>
      numericValue(form.incomeTax) -
      numericValue(form.taxPayable),
    [form.incomeTax, form.taxPayable]
  );

  const differenceReturn = useMemo(
    () => numericValue(form.refundAmount) - calculatedRefund,
    [form.refundAmount, calculatedRefund]
  );

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  const handleFinancialYearChange = async (event) => {
    const financialYear = event.target.value;

    const selectedYear = FINANCIAL_YEARS.find(
      (item) => item.financialYear === financialYear
    );

    setForm({
      ...INITIAL_FORM,
      financialYear,
      assessmentYear: selectedYear?.assessmentYear || "",
    });

    setRecordId(null);
    setIsEditing(false);
    setMessage("");

    if (financialYear) {
      await loadTaxReturnSummary(financialYear);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setRecordId(null);
    setIsEditing(false);
    setMessage("");
    setMessageType("");
  };

  const getDatabasePayload = () => ({
    financial_year: form.financialYear || null,
    assessment_year: form.assessmentYear || null,

    // New fields
    name: form.name.trim(),
    acknowledgement_number: form.acknowledgementNumber.trim(),
    form_type: form.formType || null,
    filing_status: form.filingStatus || null,

    // Existing fields
    itr_filing_date: form.itrFilingDate || null,
    gross_income: numericValue(form.grossIncome),
    tax_payable: numericValue(form.taxPayable),
    tds_claim: numericValue(form.tdsClaim),
    refund_due: refundDue,
    refund_process: form.refundProcess || null,
    refund_process_date: form.refundProcessDate || null,
    income_assessment: numericValue(form.incomeAssessment),
    income_tax: numericValue(form.incomeTax),
    tds_credit: numericValue(form.tdsCredit),
    refund_amount: numericValue(form.refundAmount),
    interest: numericValue(form.interest),
    calculated_refund: calculatedRefund,
    difference_income: differenceIncome,
    difference_income_tax: differenceIncomeTax,
    difference_return: differenceReturn,
  });

  const loadTaxReturnSummary = async (financialYear) => {
    if (!financialYear) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${TAX_RETURN_API_URL}?financial_year=${encodeURIComponent(
          financialYear
        )}`
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to load Tax Return Summary."
        );
      }

      const record = result?.data || result?.record || result;

      if (!record || !record.financial_year) {
        const defaultAssessmentYear = FINANCIAL_YEARS.find(
          (item) => item.financialYear === financialYear
        )?.assessmentYear || "";

        setForm({
          ...INITIAL_FORM,
          financialYear,
          assessmentYear: defaultAssessmentYear,
        });

        setRecordId(null);
        setIsEditing(false);
        return;
      }

      setRecordId(record.id || null);
      setIsEditing(false);

      setForm({
        financialYear: record.financial_year || financialYear,
        assessmentYear: record.assessment_year || "",
        name: record.name || "",
        acknowledgementNumber: record.acknowledgement_number || "",
        formType: record.form_type || "",
        filingStatus: record.filing_status || "",
        itrFilingDate: record.itr_filing_date || "",
        grossIncome: record.gross_income ?? "",
        taxPayable: record.tax_payable ?? "",
        tdsClaim: record.tds_claim ?? "",
        refundProcess: record.refund_process || "",
        refundProcessDate: record.refund_process_date || "",
        incomeAssessment: record.income_assessment ?? "",
        incomeTax: record.income_tax ?? "",
        tdsCredit: record.tds_credit ?? "",
        refundAmount: record.refund_amount ?? "",
        interest: record.interest ?? "",
      });
    } catch (error) {
      console.error("Tax Return Summary load error:", error);
      showMessage(error.message || "Unable to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxReturnSummary(INITIAL_FORM.financialYear);
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!form.financialYear || !form.assessmentYear) {
      showMessage(
        "Please select Financial Year and Assessment Year.",
        "error"
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(TAX_RETURN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getDatabasePayload()),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to save Tax Return Summary."
        );
      }

      const savedRecord = result?.data || result?.record || result;

      if (savedRecord?.id) {
        setRecordId(savedRecord.id);
      }

      setIsEditing(false);
      setShowConfirm(false);

      showMessage(
        result?.message || "Tax Return Summary saved successfully.",
        "success"
      );

      await loadTaxReturnSummary(form.financialYear);
    } catch (error) {
      console.error("Tax Return Summary save error:", error);
      showMessage(error.message || "Unable to save data.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadTaxReturnSummary(form.financialYear);
  };

  const handleDownload = async () => {
    if (loading || saving) return;

    if (!form.financialYear || !form.assessmentYear) {
      showMessage(
        "Please select Financial Year and Assessment Year.",
        "error"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${TAX_RETURN_API_URL}/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf, application/json",
        },
        body: JSON.stringify(getDatabasePayload()),
      });

      if (!response.ok) {
        const errorResult = await readResponse(response);
        throw new Error(
          errorResult?.message || "Unable to generate PDF."
        );
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/pdf")) {
        throw new Error(
          "The server did not return a valid PDF file. Check the backend PDF route."
        );
      }

      const pdfBlob = await response.blob();

      if (!pdfBlob.size) {
        throw new Error("The generated PDF is empty.");
      }

      const filename = `Tax_Return_Summary_FY_${form.financialYear}.pdf`;
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      downloadLink.style.display = "none";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 30000);

      showMessage(
        "Tax Return Summary PDF generated successfully.",
        "success"
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      showMessage(
        error.message || "Unable to generate PDF.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="tax-return-summary-page">
      <div className="tax-return-summary-container">
        {/* PAGE HEADER */}
        <div className="tax-return-header">
          <div>
            <h2>Tax Return Summary</h2>
            <p>Income Tax Return and Assessment Details</p>
          </div>

          <div className="tax-header-actions">
            {recordId && !isEditing && (
              <button
                type="button"
                className="tax-edit-btn"
                onClick={handleEdit}
                disabled={loading || saving}
              >
                Edit
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                className="tax-cancel-btn"
                onClick={handleCancelEdit}
                disabled={loading || saving}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              className="tax-download-btn"
              onClick={handleDownload}
              disabled={loading || saving}
            >
              {loading ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>
        </div>

        {message && (
          <div className={`tax-message ${messageType}`}>
            {message}
          </div>
        )}

        {loading && (
          <div className="tax-loading">
            Loading...
          </div>
        )}

        {/* BASIC INFORMATION */}
        <section className="tax-section">
          <h3>Basic Information</h3>

          <div className="tax-form-grid">
            <div className="tax-form-group">
              <label htmlFor="financialYear">Financial Year</label>
              <select
                id="financialYear"
                name="financialYear"
                value={form.financialYear}
                onChange={handleFinancialYearChange}
                disabled={loading || saving}
              >
                <option value="">Select Financial Year</option>
                {FINANCIAL_YEARS.map((item) => (
                  <option
                    key={item.financialYear}
                    value={item.financialYear}
                  >
                    FY {item.financialYear}
                  </option>
                ))}
              </select>
            </div>

            <div className="tax-form-group">
              <label htmlFor="assessmentYear">Assessment Year</label>
              <select
                id="assessmentYear"
                name="assessmentYear"
                value={form.assessmentYear}
                onChange={handleChange}
                disabled={fieldsDisabled || loading}
              >
                <option value="">Select Assessment Year</option>
                {ASSESSMENT_YEARS.map((year) => (
                  <option key={year} value={year}>
                    AY {year}
                  </option>
                ))}
              </select>
            </div>

            {renderInput("Name", "name", "text", "Enter name")}

            {renderInput(
              "Acknowledgement Number",
              "acknowledgementNumber",
              "text",
              "Enter acknowledgement number"
            )}

            <div className="tax-form-group">
              <label htmlFor="formType">Form Type</label>
              <select
                id="formType"
                name="formType"
                value={form.formType}
                onChange={handleChange}
                disabled={fieldsDisabled}
              >
                <option value="">Select Form Type</option>
                {FORM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="tax-form-group">
              <label htmlFor="filingStatus">Filing Status</label>
              <select
                id="filingStatus"
                name="filingStatus"
                value={form.filingStatus}
                onChange={handleChange}
                disabled={fieldsDisabled}
              >
                <option value="">Select Filing Status</option>
                {FILING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {renderInput("ITR Filing Date", "itrFilingDate", "date")}
          </div>
        </section>

        {/* INCOME AND TAX DETAILS */}
        <section className="tax-section">
          <h3>Income and Tax Details</h3>

          <div className="tax-form-grid">
            {renderInput("Gross Income", "grossIncome")}
            {renderInput("Tax Payable", "taxPayable")}
            {renderInput("TDS Claim", "tdsClaim")}

            {renderReadOnly("Refund Due", formatCurrency(refundDue))}

            <div className="tax-form-group">
              <label htmlFor="refundProcess">Refund Process</label>
              <select
                id="refundProcess"
                name="refundProcess"
                value={form.refundProcess}
                onChange={handleChange}
                disabled={fieldsDisabled}
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Processed">Processed</option>
                <option value="Received">Received</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            {renderInput(
              "Date of Refund Process",
              "refundProcessDate",
              "date"
            )}
          </div>
        </section>

        {/* ASSESSMENT DETAILS */}
        <section className="tax-section">
          <h3>Assessment Details</h3>

          <div className="tax-form-grid">
            {renderInput(
              "Income as per Assessment",
              "incomeAssessment"
            )}

            {renderInput("Income Tax as per AY", "incomeTax")}
            {renderInput("TDS Credit", "tdsCredit")}
            {renderInput("Refund Amount", "refundAmount")}
            {renderInput("Interest", "interest")}

            {renderReadOnly(
              "Refund Amount (Calculated)",
              formatCurrency(calculatedRefund)
            )}
          </div>
        </section>

        {/* DIFFERENCE SUMMARY */}
        <section className="tax-section">
          <h3>Difference Summary</h3>

          <div className="tax-difference-grid">
            <div className="tax-difference-card">
              <span>Difference in Income</span>
              <strong>{formatCurrency(differenceIncome)}</strong>
            </div>

            <div className="tax-difference-card">
              <span>Difference in Income Tax</span>
              <strong>{formatCurrency(differenceIncomeTax)}</strong>
            </div>

            <div className="tax-difference-card">
              <span>Difference in Return</span>
              <strong>{formatCurrency(differenceReturn)}</strong>
            </div>
          </div>
        </section>

        {/* SAVE / RESET */}
        <div className="tax-bottom-actions">
          {!recordId || isEditing ? (
            <button
              type="button"
              className="tax-save-btn"
              onClick={() => setShowConfirm(true)}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Tax Return Summary"}
            </button>
          ) : (
            <button
              type="button"
              className="tax-reset-btn"
              onClick={resetForm}
              disabled={loading || saving}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* CONFIRMATION POPUP */}
      {showConfirm && (
        <div className="tax-modal-overlay">
          <div className="tax-confirm-modal">
            <h3>Confirm Save</h3>

            <p>
              Are you sure you want to save the Tax Return Summary
              for FY {form.financialYear}?
            </p>

            <div className="tax-modal-actions">
              <button
                type="button"
                className="tax-cancel-btn"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
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
}

export default TaxReturnSummary;
