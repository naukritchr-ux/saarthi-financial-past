import React, { useState } from "react";
import "./TaxReturnSummary.css";

const TaxReturnSummary = () => {
  const financialYears = [
    {
      value: "2021-22",
      label: "FY 2021–2022",
      assessmentYear: "2022-23"
    },
    {
      value: "2022-23",
      label: "FY 2022–2023",
      assessmentYear: "2023-24"
    },
    {
      value: "2023-24",
      label: "FY 2023–2024",
      assessmentYear: "2024-25"
    },
    {
      value: "2024-25",
      label: "FY 2024–2025",
      assessmentYear: "2025-26"
    },
    {
      value: "2025-26",
      label: "FY 2025–2026",
      assessmentYear: "2026-27"
    },
    {
      value: "2026-27",
      label: "FY 2026–2027",
      assessmentYear: "2027-28"
    }
  ];

  const assessmentYears = [
    {
      value: "2022-23",
      label: "AY 2022–2023"
    },
    {
      value: "2023-24",
      label: "AY 2023–2024"
    },
    {
      value: "2024-25",
      label: "AY 2024–2025"
    },
    {
      value: "2025-26",
      label: "AY 2025–2026"
    },
    {
      value: "2026-27",
      label: "AY 2026–2027"
    },
    {
      value: "2027-28",
      label: "AY 2027–2028"
    }
  ];

  const [form, setForm] = useState({
    // Start with no FY/AY selected
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    /*
     * When Financial Year changes,
     * automatically set the corresponding Assessment Year.
     */
    if (name === "financialYear") {
      const selectedFY = financialYears.find(
        (year) => year.value === value
      );

      setForm((prev) => ({
        ...prev,
        financialYear: value,
        assessmentYear: selectedFY
          ? selectedFY.assessmentYear
          : ""
      }));

      return;
    }

    /*
     * Assessment Year can still be manually changed
     * by the user after the automatic selection.
     */
    if (name === "assessmentYear") {
      setForm((prev) => ({
        ...prev,
        assessmentYear: value
      }));

      return;
    }

    /*
     * If Refund Process is changed to anything
     * other than Processed, clear the refund process date.
     */
    if (name === "refundProcess") {
      setForm((prev) => ({
        ...prev,
        refundProcess: value,
        refundProcessDate:
          value === "Processed"
            ? prev.refundProcessDate
            : ""
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /*
   * ==========================================================
   * REFUND DUE CALCULATION
   *
   * Refund Due =
   * TDS Claim As per 26AS - Tax Payable
   *
   * If the result is negative, show 0.
   * ==========================================================
   */

  const taxPayable = Number(form.taxPayable) || 0;
  const tdsClaim = Number(form.tdsClaim) || 0;

  const refundDue = Math.max(
    0,
    tdsClaim - taxPayable
  );

  /*
   * These calculations are still placeholders
   * until their exact formulas are defined.
   */

  const calculatedRefund = 0;

  const differenceIncome = 0;
  const differenceIncomeTax = 0;
  const differenceReturn = 0;

  return (
    <div className="tax-summary-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="tax-summary-header">
        <h2>TAX RETURN SUMMARY</h2>
      </div>

      {/* =====================================================
          ROW 1
      ====================================================== */}

      <div className="tax-row three-columns">

        {/* Financial Year */}

        <div className="tax-field">
          <label>Financial Year (FY)</label>

          <select
            name="financialYear"
            value={form.financialYear}
            onChange={handleChange}
          >
            <option value="">
              Select Financial Year
            </option>

            {financialYears.map((year) => (
              <option
                key={year.value}
                value={year.value}
              >
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Year */}

        <div className="tax-field">
          <label>Assessment Year (AY)</label>

          <select
            name="assessmentYear"
            value={form.assessmentYear}
            onChange={handleChange}
          >
            <option value="">
              Select Assessment Year
            </option>

            {assessmentYears.map((year) => (
              <option
                key={year.value}
                value={year.value}
              >
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* ITR Filing Date */}

        <div className="tax-field">
          <label>ITR Filing Date</label>

          <input
            type="date"
            name="itrFilingDate"
            value={form.itrFilingDate}
            onChange={handleChange}
          />
        </div>

      </div>

      {/* =====================================================
          ROW 2
      ====================================================== */}

      <div className="tax-row two-columns">

        {/* Gross Income */}

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
            />
          </div>
        </div>

        {/* Tax Payable */}

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
            />
          </div>
        </div>

      </div>

      {/* =====================================================
          ROW 3
      ====================================================== */}

      <div className="tax-row two-columns">

        {/* TDS Claim */}

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
            />
          </div>
        </div>

        {/* Refund Due - CALCULATED */}

        <div className="tax-field">
          <label>Refund Due</label>

          <div className="amount-input calculated-input">
            <span>₹</span>

            <input
              type="text"
              value={refundDue.toFixed(2)}
              readOnly
            />
          </div>
        </div>

      </div>

      {/* =====================================================
          ROW 4
      ====================================================== */}

      <div className="tax-row two-columns">

        {/* Refund Process */}

        <div className="tax-field">
          <label>Refund Process</label>

          <select
            name="refundProcess"
            value={form.refundProcess}
            onChange={handleChange}
          >
            <option value="">
              Select Refund Process
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Processed">
              Processed
            </option>

            <option value="Not Applicable">
              Not Applicable
            </option>
          </select>
        </div>

        {/* Date of Refund Process */}

        <div className="tax-field">
          <label>Date of Refund Process</label>

          <input
            type="date"
            name="refundProcessDate"
            value={form.refundProcessDate}
            onChange={handleChange}
            disabled={
              form.refundProcess !== "Processed"
            }
          />
        </div>

      </div>

      {/* =====================================================
          ROW 5
      ====================================================== */}

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
            />
          </div>
        </div>

      </div>

      {/* =====================================================
          ROW 6
      ====================================================== */}

      <div className="tax-row two-columns">

        {/* Income Tax */}

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
            />
          </div>
        </div>

        {/* TDS Credit */}

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
            />
          </div>
        </div>

      </div>

      {/* =====================================================
          ROW 7
      ====================================================== */}

      <div className="tax-row two-columns">

        {/* Refund Amount */}

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
            />
          </div>
        </div>

        {/* Interest */}

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
            />
          </div>
        </div>

      </div>

      {/* =====================================================
          ROW 8 - CALCULATED REFUND
      ====================================================== */}

      <div className="calculated-box">

        <div className="calculated-title">
          REFUND AMOUNT (CALCULATED)
        </div>

        <div className="calculated-value">
          ₹ {calculatedRefund.toFixed(2)}
        </div>

      </div>

      {/* =====================================================
          DIFFERENCE
      ====================================================== */}

      <div className="difference-section">

        <h3>DIFFERENCE</h3>

        <div className="tax-row three-columns">

          {/* Difference Income */}

          <div className="difference-box">
            <label>Income</label>

            <strong>
              ₹ {differenceIncome.toFixed(2)}
            </strong>
          </div>

          {/* Difference Income Tax */}

          <div className="difference-box">
            <label>Income Tax</label>

            <strong>
              ₹ {differenceIncomeTax.toFixed(2)}
            </strong>
          </div>

          {/* Difference Return */}

          <div className="difference-box">
            <label>Return</label>

            <strong>
              ₹ {differenceReturn.toFixed(2)}
            </strong>
          </div>

        </div>

      </div>

    </div>
  );
};

export default TaxReturnSummary;