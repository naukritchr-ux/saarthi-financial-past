import React, { useState } from "react";
import "./TaxReturnSummary.css";

const TAX_RETURN_API_URL = "/api/tax-return-summary";

const FINANCIAL_YEARS = [
  { value: "2021-22", label: "FY 2021–2022", assessmentYear: "2022-23" },
  { value: "2022-23", label: "FY 2022–2023", assessmentYear: "2023-24" },
  { value: "2023-24", label: "FY 2023–2024", assessmentYear: "2024-25" },
  { value: "2024-25", label: "FY 2024–2025", assessmentYear: "2025-26" },
  { value: "2025-26", label: "FY 2025–2026", assessmentYear: "2026-27" },
  { value: "2026-27", label: "FY 2026–2027", assessmentYear: "2027-28" }
];

const ASSESSMENT_YEARS = [
  { value: "2022-23", label: "AY 2022–2023" },
  { value: "2023-24", label: "AY 2023–2024" },
  { value: "2024-25", label: "AY 2024–2025" },
  { value: "2025-26", label: "AY 2025–2026" },
  { value: "2026-27", label: "AY 2026–2027" },
  { value: "2027-28", label: "AY 2027–2028" }
];

const INITIAL_FORM = {
  financialYear: "",
  assessmentYear: "",
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
  interest: ""
};

// ------------------------------------------------------
// DATABASE RECORD TO FORM
// ------------------------------------------------------

const mapDatabaseToForm = (record) => ({
  financialYear: record.financial_year || "",
  assessmentYear: record.assessment_year || "",
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
  interest: record.interest ?? ""
});

// ------------------------------------------------------
// API RESPONSE HANDLER
// ------------------------------------------------------

const readApiResponse = async (response) => {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
};

// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------

const TaxReturnSummary = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [recordId, setRecordId] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // POPUP STATES
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("confirm");
  const [popupMessage, setPopupMessage] = useState("");

  const fieldsDisabled = Boolean(recordId) && !isEditing;

  // ------------------------------------------------------
  // LOAD EXISTING RECORD BY FINANCIAL YEAR
  // ------------------------------------------------------

  const loadTaxRecord = async (financialYear) => {
    setMessage("");

    if (!financialYear) {
      setForm(INITIAL_FORM);
      setRecordId(null);
      setIsEditing(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${TAX_RETURN_API_URL}?financialYear=${encodeURIComponent(
          financialYear
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      const result = await readApiResponse(response);

      if (result.exists && result.data) {
        setForm(mapDatabaseToForm(result.data));
        setRecordId(result.data.id);
        setIsEditing(false);

        setMessage("Existing tax return record loaded.");
        setMessageType("success");
      } else {
        const selectedFY = FINANCIAL_YEARS.find(
          (year) => year.value === financialYear
        );

        setForm({
          ...INITIAL_FORM,
          financialYear,
          assessmentYear: selectedFY?.assessmentYear || ""
        });

        setRecordId(null);
        setIsEditing(true);

        setMessage(
          "No saved record found. You can enter a new record."
        );
        setMessageType("info");
      }
    } catch (error) {
      console.error("Error loading tax return:", error);

      setForm({
        ...INITIAL_FORM,
        financialYear
      });

      setRecordId(null);
      setIsEditing(true);

      setMessage(error.message || "Unable to load tax return record.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // HANDLE INPUT CHANGES
  // ------------------------------------------------------

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "financialYear") {
      await loadTaxRecord(value);
      return;
    }

    if (name === "refundProcess") {
      setForm((prev) => ({
        ...prev,
        refundProcess: value,
        refundProcessDate:
          value === "Processed" ? prev.refundProcessDate : ""
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ------------------------------------------------------
  // CALCULATIONS
  // ------------------------------------------------------

  const taxPayable = Number(form.taxPayable) || 0;
  const tdsClaim = Number(form.tdsClaim) || 0;

  // Refund Due = TDS Claim - Tax Payable
  const refundDue = Math.max(0, tdsClaim - taxPayable);

  // Calculated Refund = TDS Credit + Interest
  const tdsCredit = Number(form.tdsCredit) || 0;
  const interest = Number(form.interest) || 0;

  const calculatedRefund = tdsCredit + interest;

  // Difference Income = Income Assessment - Gross Income
  const incomeAssessment = Number(form.incomeAssessment) || 0;
  const grossIncome = Number(form.grossIncome) || 0;

  const differenceIncome = incomeAssessment - grossIncome;

  // Difference Income Tax = Income Tax - Tax Payable
  const incomeTax = Number(form.incomeTax) || 0;

  const differenceIncomeTax = incomeTax - taxPayable;

  // Difference Return = Refund Amount - Calculated Refund
  const refundAmount = Number(form.refundAmount) || 0;

  const differenceReturn = refundAmount - calculatedRefund;

  // ------------------------------------------------------
  // PREPARE DATABASE PAYLOAD
  // ------------------------------------------------------

  const getDatabasePayload = () => ({
    financial_year: form.financialYear,
    assessment_year: form.assessmentYear,
    itr_filing_date: form.itrFilingDate || null,

    gross_income: grossIncome,
    tax_payable: taxPayable,
    tds_claim: tdsClaim,
    refund_due: refundDue,

    refund_process: form.refundProcess || "Pending",
    refund_process_date:
      form.refundProcess === "Processed"
        ? form.refundProcessDate || null
        : null,

    income_assessment: incomeAssessment,
    income_tax: incomeTax,
    tds_credit: tdsCredit,
    refund_amount: refundAmount,
    interest,

    calculated_refund: calculatedRefund,
    difference_income: differenceIncome,
    difference_income_tax: differenceIncomeTax,
    difference_return: differenceReturn
  });

  // ------------------------------------------------------
  // OPEN SAVE CONFIRMATION POPUP
  // ------------------------------------------------------

  const handleSave = () => {
    if (!form.financialYear || !form.assessmentYear) {
      setMessage("Please select Financial Year and Assessment Year.");
      setMessageType("error");
      return;
    }

    if (
      form.refundProcess === "Processed" &&
      !form.refundProcessDate
    ) {
      setMessage("Please select the Date of Refund Process.");
      setMessageType("error");
      return;
    }

    setPopupType("confirm");

    setPopupMessage(
      recordId
        ? "Are you sure you want to update this Tax Return Summary?"
        : "Are you sure you want to save this Tax Return Summary?"
    );

    setShowPopup(true);
  };

  // ------------------------------------------------------
  // CONFIRM AND SAVE TO SUPABASE
  // ------------------------------------------------------

  const confirmSave = async () => {
    if (loading) return;

    setShowPopup(false);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(TAX_RETURN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(getDatabasePayload())
      });

      const result = await readApiResponse(response);

      if (!result.data) {
        throw new Error("The server did not return the saved record.");
      }

      setRecordId(result.data.id);
      setForm(mapDatabaseToForm(result.data));
      setIsEditing(false);

      setMessage(
        result.message || "Tax Return Summary saved successfully."
      );
      setMessageType("success");

      // SUCCESS POPUP
      setPopupType("success");
      setPopupMessage(
        recordId
          ? "Tax Return Summary updated successfully!"
          : "Tax Return Summary saved successfully!"
      );
      setShowPopup(true);

    } catch (error) {
      console.error("Error saving tax return:", error);

      setMessage(error.message || "Unable to save tax return.");
      setMessageType("error");

      // ERROR POPUP
      setPopupType("error");
      setPopupMessage(
        error.message || "Unable to save Tax Return Summary."
      );
      setShowPopup(true);

    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // CLOSE POPUP
  // ------------------------------------------------------

  const closePopup = () => {
    if (loading) return;
    setShowPopup(false);
  };

  // ------------------------------------------------------
  // ENABLE EDIT MODE
  // ------------------------------------------------------

  const handleEdit = () => {
    if (!recordId) {
      setMessage(
        "Please select a Financial Year with a saved record."
      );
      setMessageType("error");
      return;
    }

    setIsEditing(true);

    setMessage(
      "Edit mode enabled. Update the required fields and click Update."
    );

    setMessageType("info");
  };

  // ------------------------------------------------------
  // DOWNLOAD / PRINT PDF
  // ------------------------------------------------------

  const handleDownload = () => {
    if (!form.financialYear) {
      setMessage(
        "Please select a Financial Year before downloading."
      );
      setMessageType("error");
      return;
    }

    window.print();
  };

  // ------------------------------------------------------
  // CURRENCY FORMAT
  // ------------------------------------------------------

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <div className="tax-summary-page">

      {/* HEADER AND DOWNLOAD BUTTON */}

      <div className="tax-summary-header">
        <h2>TAX RETURN SUMMARY</h2>

        <button
          type="button"
          className="tax-download-btn no-print"
          onClick={handleDownload}
          disabled={loading}
        >
          <span>↓</span> Download PDF
        </button>
      </div>

      {/* STATUS MESSAGE */}

      {message && (
        <div className={`tax-message ${messageType} no-print`}>
          {message}
        </div>
      )}

      {loading && (
        <div className="tax-loading no-print">
          Processing...
        </div>
      )}

      {/* ROW 1 */}

      <div className="tax-row three-columns">

        <div className="tax-field">
          <label>Financial Year (FY)</label>

          <select
            name="financialYear"
            value={form.financialYear}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select Financial Year</option>

            {FINANCIAL_YEARS.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        <div className="tax-field">
          <label>Assessment Year (AY)</label>

          <select
            name="assessmentYear"
            value={form.assessmentYear}
            onChange={handleChange}
            disabled={fieldsDisabled || loading}
          >
            <option value="">Select Assessment Year</option>

            {ASSESSMENT_YEARS.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        <div className="tax-field">
          <label>ITR Filing Date</label>

          <input
            type="date"
            name="itrFilingDate"
            value={form.itrFilingDate}
            onChange={handleChange}
            disabled={fieldsDisabled || loading}
          />
        </div>

      </div>

      {/* ROW 2 */}

      <div className="tax-row two-columns">

        <div className="tax-field">
          <label>Gross Income As per ITR</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="grossIncome"
              value={form.grossIncome}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

        <div className="tax-field">
          <label>Tax Payable</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="taxPayable"
              value={form.taxPayable}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

      </div>

      {/* ROW 3 */}

      <div className="tax-row two-columns">

        <div className="tax-field">
          <label>TDS Claim As per 26AS</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="tdsClaim"
              value={form.tdsClaim}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

        <div className="tax-field">
          <label>Refund Due</label>

          <div className="amount-input calculated-input">
            <span>₹</span>
            <input
              type="text"
              value={formatCurrency(refundDue)}
              readOnly
            />
          </div>
        </div>

      </div>

      {/* ROW 4 */}

      <div className="tax-row two-columns">

        <div className="tax-field">
          <label>Refund Process</label>

          <select
            name="refundProcess"
            value={form.refundProcess}
            onChange={handleChange}
            disabled={fieldsDisabled || loading}
          >
            <option value="">Select Refund Process</option>
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
            <option value="Not Applicable">Not Applicable</option>
          </select>
        </div>

        <div className="tax-field">
          <label>Date of Refund Process</label>

          <input
            type="date"
            name="refundProcessDate"
            value={form.refundProcessDate}
            onChange={handleChange}
            disabled={
              fieldsDisabled ||
              loading ||
              form.refundProcess !== "Processed"
            }
          />
        </div>

      </div>

      {/* ROW 5 */}

      <div className="tax-row one-column">

        <div className="tax-field">
          <label>Income As per Assessment</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="incomeAssessment"
              value={form.incomeAssessment}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

      </div>

      {/* ROW 6 */}

      <div className="tax-row two-columns">

        <div className="tax-field">
          <label>Income Tax As Per AY</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="incomeTax"
              value={form.incomeTax}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

        <div className="tax-field">
          <label>TDS Credit</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="tdsCredit"
              value={form.tdsCredit}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

      </div>

      {/* ROW 7 */}

      <div className="tax-row two-columns">

        <div className="tax-field">
          <label>Refund Amount</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="refundAmount"
              value={form.refundAmount}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

        <div className="tax-field">
          <label>Interest</label>

          <div className="amount-input">
            <span>₹</span>
            <input
              type="number"
              name="interest"
              value={form.interest}
              onChange={handleChange}
              min="0"
              disabled={fieldsDisabled || loading}
            />
          </div>
        </div>

      </div>

      {/* CALCULATED REFUND */}

      <div className="calculated-box">
        <div className="calculated-title">
          REFUND AMOUNT (CALCULATED)
        </div>

        <div className="calculated-value">
          ₹ {formatCurrency(calculatedRefund)}
        </div>
      </div>

      {/* DIFFERENCE */}

      <div className="difference-section">

        <h3>DIFFERENCE</h3>

        <div className="tax-row three-columns">

          <div className="difference-box">
            <label>Income</label>
            <strong>₹ {formatCurrency(differenceIncome)}</strong>
          </div>

          <div className="difference-box">
            <label>Income Tax</label>
            <strong>₹ {formatCurrency(differenceIncomeTax)}</strong>
          </div>

          <div className="difference-box">
            <label>Return</label>
            <strong>₹ {formatCurrency(differenceReturn)}</strong>
          </div>

        </div>
      </div>

      {/* BOTTOM ACTION BUTTONS */}

      <div className="tax-action-buttons no-print">

        <button
          type="button"
          className="tax-save-btn"
          onClick={handleSave}
          disabled={loading || !isEditing}
        >
          {loading ? "Saving..." : recordId ? "Update" : "Save"}
        </button>

        <button
          type="button"
          className="tax-edit-btn"
          onClick={handleEdit}
          disabled={loading || !recordId || isEditing}
        >
          Edit
        </button>

      </div>

      {/* PRINT-ONLY PDF REPORT */}

      <div className="tax-print-report">

        <div className="tax-print-header">
          <h2>TAX RETURN SUMMARY</h2>
          <p>Financial Year: {form.financialYear || "—"}</p>
          <p>Assessment Year: {form.assessmentYear || "—"}</p>
        </div>

        <table className="tax-print-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Particulars</th>
              <th>Amount / Details</th>
            </tr>
          </thead>

          <tbody>
            <tr><td>1</td><td>Financial Year (FY)</td><td>{form.financialYear || "—"}</td></tr>
            <tr><td>2</td><td>Assessment Year (AY)</td><td>{form.assessmentYear || "—"}</td></tr>
            <tr><td>3</td><td>ITR Filing Date</td><td>{form.itrFilingDate || "—"}</td></tr>
            <tr><td>4</td><td>Gross Income As per ITR</td><td>₹ {formatCurrency(form.grossIncome)}</td></tr>
            <tr><td>5</td><td>Tax Payable</td><td>₹ {formatCurrency(form.taxPayable)}</td></tr>
            <tr><td>6</td><td>TDS Claim As per 26AS</td><td>₹ {formatCurrency(form.tdsClaim)}</td></tr>
            <tr><td>7</td><td>Refund Due</td><td>₹ {formatCurrency(refundDue)}</td></tr>
            <tr><td>8</td><td>Refund Process</td><td>{form.refundProcess || "—"}</td></tr>
            <tr><td>9</td><td>Date of Refund Process</td><td>{form.refundProcessDate || "—"}</td></tr>
            <tr><td>10</td><td>Income As per Assessment</td><td>₹ {formatCurrency(form.incomeAssessment)}</td></tr>
            <tr><td>11</td><td>Income Tax As Per AY</td><td>₹ {formatCurrency(form.incomeTax)}</td></tr>
            <tr><td>12</td><td>TDS Credit</td><td>₹ {formatCurrency(form.tdsCredit)}</td></tr>
            <tr><td>13</td><td>Refund Amount</td><td>₹ {formatCurrency(form.refundAmount)}</td></tr>
            <tr><td>14</td><td>Interest</td><td>₹ {formatCurrency(form.interest)}</td></tr>
            <tr><td>15</td><td>Refund Amount (Calculated)</td><td>₹ {formatCurrency(calculatedRefund)}</td></tr>
          </tbody>
        </table>

        <h3 className="tax-print-difference-heading">DIFFERENCE</h3>

        <table className="tax-print-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Income</td>
              <td>₹ {formatCurrency(differenceIncome)}</td>
            </tr>
            <tr>
              <td>Income Tax</td>
              <td>₹ {formatCurrency(differenceIncomeTax)}</td>
            </tr>
            <tr>
              <td>Return</td>
              <td>₹ {formatCurrency(differenceReturn)}</td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* SAVE CONFIRMATION / SUCCESS / ERROR POPUP */}

      {showPopup && (
        <div className="tax-popup-overlay no-print">
          <div
            className={`tax-popup tax-popup-${popupType}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tax-popup-title"
          >

            <div className="tax-popup-icon">
              {popupType === "confirm" && "?"}
              {popupType === "success" && "✓"}
              {popupType === "error" && "!"}
            </div>

            <h3 id="tax-popup-title">
              {popupType === "confirm" && "Confirm Save"}
              {popupType === "success" && "Success"}
              {popupType === "error" && "Error"}
            </h3>

            <p>{popupMessage}</p>

            <div className="tax-popup-actions">

              {popupType === "confirm" && (
                <>
                  <button
                    type="button"
                    className="tax-popup-cancel"
                    onClick={closePopup}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="tax-popup-confirm"
                    onClick={confirmSave}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Confirm"}
                  </button>
                </>
              )}

              {(popupType === "success" ||
                popupType === "error") && (
                <button
                  type="button"
                  className="tax-popup-confirm"
                  onClick={closePopup}
                >
                  OK
                </button>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TaxReturnSummary;