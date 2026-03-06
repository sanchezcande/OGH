import React, { useState } from "react";
import SEO from "../../src/components/SEO/SEO";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import useMediaQuery from "../../src/Hooks/useMediaQuery";

// ─── Calculation data (values/multipliers are language-independent) ────────────

const TEAM_SIZE_VALUES = [
  { labelKey: "calculator.team1to5", value: "1-5", multiplier: 3 },
  { labelKey: "calculator.team6to15", value: "6-15", multiplier: 10 },
  { labelKey: "calculator.team16to50", value: "16-50", multiplier: 33 },
  { labelKey: "calculator.team50plus", value: "50+", multiplier: 60 },
];

const SALARY_VALUES = [
  { labelKey: "calculator.salaryUnder500", value: "<$500", amount: 350 },
  { labelKey: "calculator.salary500to1500", value: "$500-$1.500", amount: 1000 },
  { labelKey: "calculator.salary1500to4000", value: "$1.500-$4.000", amount: 2750 },
  { labelKey: "calculator.salaryOver4000", value: ">$4.000", amount: 5000 },
];

const TASK_VALUES = [
  { id: "data-transfer", labelKey: "calculator.taskDataTransfer" },
  { id: "follow-up-emails", labelKey: "calculator.taskFollowUpEmails" },
  { id: "reports", labelKey: "calculator.taskReports" },
  { id: "task-coordination", labelKey: "calculator.taskCoordination" },
  { id: "orders-invoices", labelKey: "calculator.taskOrdersInvoices" },
  { id: "crm-updates", labelKey: "calculator.taskCRM" },
  { id: "client-onboarding", labelKey: "calculator.taskOnboarding" },
];

const INDUSTRY_VALUES = [
  { labelKey: "calculator.industryEcommerce", value: "ecommerce" },
  { labelKey: "calculator.industrySaaS", value: "saas-tech" },
  { labelKey: "calculator.industryProfessional", value: "professional-services" },
  { labelKey: "calculator.industryHealthEdu", value: "health-education" },
  { labelKey: "calculator.industryOther", value: "other" },
];

const TOTAL_STEPS = 4;

// ─── Styled Components ─────────────────────────────────────────────────────────

const OptionBtn = styled.button`
  border: 2px solid ${(p) => (p.$selected ? "#f97b72" : "#e5e7eb")};
  border-radius: 10px;
  padding: 1rem 1.25rem;
  background: ${(p) => (p.$selected ? "#fff5f5" : "white")};
  cursor: pointer;
  text-align: left;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.95rem;
  font-weight: ${(p) => (p.$selected ? "600" : "400")};
  color: #2b2b2b;
  transition: all 0.18s ease;
  width: 100%;

  &:hover {
    border-color: #f97b72;
    background: #fff5f5;
    transform: translateY(-1px);
  }
`;

const CheckCard = styled.button`
  border: 2px solid ${(p) => (p.$checked ? "#f97b72" : "#e5e7eb")};
  border-radius: 10px;
  padding: 0.875rem 1rem;
  background: ${(p) => (p.$checked ? "#fff5f5" : "white")};
  cursor: pointer;
  text-align: left;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.9rem;
  font-weight: ${(p) => (p.$checked ? "600" : "400")};
  color: #2b2b2b;
  transition: all 0.18s ease;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    border-color: #f97b72;
    background: #fff5f5;
  }
`;

const PrimaryBtn = styled.button`
  background: #f97b72;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 2rem;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #e35a52;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(249, 123, 114, 0.35);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`;

const GhostBtn = styled.button`
  background: transparent;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    color: #2b2b2b;
    border-color: #9ca3af;
  }
`;

const MetricCard = styled.div`
  background: #fff5f5;
  border: 1px solid #ffe3e1;
  border-radius: 12px;
  padding: 1.25rem 1rem;
  text-align: center;
  flex: 1;
  min-width: 0;
`;

const LeadInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid ${(p) => (p.$error ? "#ef4444" : "#e5e7eb")};
  border-radius: 8px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.95rem;
  color: #2b2b2b;
  background: white;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${(p) => (p.$error ? "#ef4444" : "#f97b72")};
    box-shadow: 0 0 0 3px
      ${(p) => (p.$error ? "rgba(239,68,68,0.12)" : "rgba(249,123,114,0.15)")};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 48 : -48, opacity: 0 }),
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Calculator() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [step, setStep] = useState(1); // 1–4 questions, 5 = result
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({
    teamSize: null,
    salary: null,
    tasks: [],
    industry: null,
  });
  const [lead, setLead] = useState({ name: "", email: "" });
  const [leadErrors, setLeadErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Calculations ──────────────────────────────────────────────────────────────
  const teamMultiplier =
    TEAM_SIZE_VALUES.find((t) => t.value === answers.teamSize)?.multiplier ?? 0;
  const salaryAmount =
    SALARY_VALUES.find((s) => s.value === answers.salary)?.amount ?? 0;
  const tasksCount = answers.tasks.length;

  const hoursLost = Math.round(teamMultiplier * tasksCount * 15);
  const monthlyCost = Math.round(hoursLost * (salaryAmount / 160));
  const potentialSavings = Math.round(monthlyCost * 0.6);
  const annualSavings = potentialSavings * 12;

  // ── Navigation ────────────────────────────────────────────────────────────────
  const canContinue = () => {
    if (step === 1) return !!answers.teamSize;
    if (step === 2) return !!answers.salary;
    if (step === 3) return answers.tasks.length > 0;
    if (step === 4) return !!answers.industry;
    return true;
  };

  const goNext = () => {
    if (!canContinue()) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const toggleTask = (taskId) => {
    setAnswers((prev) => ({
      ...prev,
      tasks: prev.tasks.includes(taskId)
        ? prev.tasks.filter((id) => id !== taskId)
        : [...prev.tasks, taskId],
    }));
  };

  // ── Lead form ──────────────────────────────────────────────────────────────────
  const handleLeadChange = (field, value) => {
    setLead((prev) => ({ ...prev, [field]: value }));
    if (leadErrors[field])
      setLeadErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!lead.name.trim()) errors.name = t("calculator.nameError");
    if (!lead.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))
      errors.email = t("calculator.emailError");
    if (Object.keys(errors).length) {
      setLeadErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          teamSize: answers.teamSize,
          salary: answers.salary,
          tasks: answers.tasks
            .map((id) => {
              const task = TASK_VALUES.find((task) => task.id === id);
              return task ? t(task.labelKey) : null;
            })
            .filter(Boolean),
          industry: (() => {
            const ind = INDUSTRY_VALUES.find((i) => i.value === answers.industry);
            return ind ? t(ind.labelKey) : answers.industry;
          })(),
          hoursLost,
          monthlyCost,
          potentialSavings,
          annualSavings,
        }),
      });
    } catch {
      // show success anyway to avoid friction
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  // ── Step progress ──────────────────────────────────────────────────────────────
  const progressPct = step >= 5 ? 100 : (step / TOTAL_STEPS) * 100;

  // ── Render helpers ─────────────────────────────────────────────────────────────

  const renderStep = (stepNum, titleKey, subKey, options, grid, isMulti) => {
    const cols = grid ?? (isMobile ? "1fr 1fr" : "1fr 1fr");
    const nextLabel =
      stepNum === TOTAL_STEPS
        ? t("calculator.seeResultBtn")
        : t("calculator.nextBtn");

    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#2b2b2b",
              lineHeight: 1.35,
              marginBottom: "0.35rem",
            }}
          >
            {t(titleKey)}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>
            {t(subKey)}
          </p>
        </div>

        {isMulti ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              marginBottom: answers.tasks.length > 0 ? "0.75rem" : "2rem",
            }}
          >
            {options.map((opt) => {
              const checked = answers.tasks.includes(opt.id);
              return (
                <CheckCard
                  key={opt.id}
                  $checked={checked}
                  onClick={() => toggleTask(opt.id)}
                  type="button"
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      minWidth: "20px",
                      borderRadius: "5px",
                      border: `2px solid ${checked ? "#f97b72" : "#d1d5db"}`,
                      background: checked ? "#f97b72" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.18s ease",
                      fontSize: "11px",
                      color: "white",
                      fontWeight: 700,
                    }}
                  >
                    {checked && "✓"}
                  </span>
                  {t(opt.labelKey)}
                </CheckCard>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              gap: "0.75rem",
              marginBottom: "2rem",
            }}
          >
            {options.map((opt) => (
              <OptionBtn
                key={opt.value}
                $selected={
                  stepNum === 1
                    ? answers.teamSize === opt.value
                    : stepNum === 2
                      ? answers.salary === opt.value
                      : answers.industry === opt.value
                }
                onClick={() => {
                  const field =
                    stepNum === 1 ? "teamSize" : stepNum === 2 ? "salary" : "industry";
                  setAnswers((p) => ({ ...p, [field]: opt.value }));
                }}
                type="button"
              >
                {t(opt.labelKey)}
              </OptionBtn>
            ))}
          </div>
        )}

        {isMulti && answers.tasks.length > 0 && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#f97b72",
              fontWeight: 500,
              marginBottom: "1.5rem",
            }}
          >
            {answers.tasks.length === 1
              ? t("calculator.tasksSelectedOne")
              : t("calculator.tasksSelectedMany", { count: answers.tasks.length })}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: step > 1 ? "space-between" : "flex-end",
          }}
        >
          {step > 1 && (
            <GhostBtn type="button" onClick={goBack}>
              {t("calculator.backBtn")}
            </GhostBtn>
          )}
          <PrimaryBtn type="button" onClick={goNext} disabled={!canContinue()}>
            {nextLabel}
          </PrimaryBtn>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (submitted) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: "center", padding: "1rem 0" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#2b2b2b",
              marginBottom: "0.75rem",
            }}
          >
            {t("calculator.successTitle")}
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "#6b7280",
              lineHeight: 1.6,
              maxWidth: "380px",
              margin: "0 auto 1.5rem",
            }}
          >
            {t("calculator.successBody")}
          </p>
          <a
            href="https://calendly.com/sanchezgcandelaria/15min"
            target="_blank"
            rel="noopener noreferrer"
          >
            <PrimaryBtn type="button" style={{ width: "100%", maxWidth: "340px" }}>
              {t("calculator.bookCallBtn")}
            </PrimaryBtn>
          </a>
        </motion.div>
      );
    }

    return (
      <div>
        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#f97b72",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
            }}
          >
            {t("calculator.resultLabel")}
          </p>
          <h2
            style={{
              fontSize: isMobile ? "1.4rem" : "1.6rem",
              fontWeight: 700,
              color: "#2b2b2b",
              lineHeight: 1.3,
            }}
          >
            {t("calculator.resultTitle")}
          </h2>
        </div>

        {/* Metrics */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1.25rem",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <MetricCard>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.4rem",
                fontWeight: 500,
              }}
            >
              {t("calculator.hoursLost")}
            </p>
            <p
              style={{
                fontSize: isMobile ? "1.6rem" : "1.8rem",
                fontWeight: 700,
                color: "#2b2b2b",
                lineHeight: 1,
              }}
            >
              {hoursLost}
              <span style={{ fontSize: "1rem", fontWeight: 500, color: "#6b7280" }}>
                {" "}h
              </span>
            </p>
          </MetricCard>
          <MetricCard>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.4rem",
                fontWeight: 500,
              }}
            >
              {t("calculator.monthlyCost")}
            </p>
            <p
              style={{
                fontSize: isMobile ? "1.6rem" : "1.8rem",
                fontWeight: 700,
                color: "#2b2b2b",
                lineHeight: 1,
              }}
            >
              {fmt(monthlyCost)}
            </p>
          </MetricCard>
          <MetricCard>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: "0.4rem",
                fontWeight: 500,
              }}
            >
              {t("calculator.hoursRecovered")}
            </p>
            <p
              style={{
                fontSize: isMobile ? "1.6rem" : "1.8rem",
                fontWeight: 700,
                color: "#f97b72",
                lineHeight: 1,
              }}
            >
              {hoursLost}
              <span style={{ fontSize: "1rem", fontWeight: 500, color: "#6b7280" }}>
                {" "}h
              </span>
            </p>
          </MetricCard>
        </div>

        {/* Savings highlight */}
        <div
          style={{
            background: "linear-gradient(135deg, #fff5f5 0%, #ffe3e1 100%)",
            border: "2px solid #f97b72",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              color: "#6b7280",
              marginBottom: "0.35rem",
              fontWeight: 500,
            }}
          >
            {t("calculator.savingsHeadline")}
          </p>
          <p
            style={{
              fontSize: isMobile ? "2rem" : "2.4rem",
              fontWeight: 900,
              color: "#f97b72",
              lineHeight: 1,
              marginBottom: "0.25rem",
            }}
          >
            {fmt(potentialSavings)}
            <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              {t("calculator.perMonth")}
            </span>
          </p>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#e35a52",
              marginBottom: "0.5rem",
            }}
          >
            {t("calculator.annualSavings", { amount: fmt(annualSavings) })}
          </p>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.4, marginBottom: "0.6rem" }}>
            {t("calculator.benchmarkNote")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
            {[
              { label: "Flobotics RPA 2024", url: "https://flobotics.io/blog/rpa-statistics/" },
              { label: "McKinsey MGI 2023", url: "https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/superagency-in-the-workplace-empowering-people-to-unlock-ais-full-potential-at-work" },
              { label: "Deloitte IA Survey 2022", url: "https://www.deloitte.com/us/en/insights/topics/talent/intelligent-automation-2022-survey-results.html" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.7rem", color: "#9ca3af", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Social proof — Valthor */}
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "2rem",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <img
            src="/case-studies/valthor.jpeg"
            alt="Valthor CRM"
            style={{
              width: isMobile ? "100%" : "120px",
              height: isMobile ? "140px" : "90px",
              objectFit: "cover",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#f97b72",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.3rem",
              }}
            >
              {t("calculator.socialProofLabel")}
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#2b2b2b",
                marginBottom: "0.6rem",
                lineHeight: 1.4,
              }}
            >
              {t("calculator.socialProofQuote")}
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                { value: "40%", label: t("calculator.socialProofStat1") },
                { value: "3x", label: t("calculator.socialProofStat2") },
              ].map((s) => (
                <div key={s.value}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f97b72" }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", marginLeft: "0.3rem" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead form */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.75rem" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#2b2b2b",
              marginBottom: "0.4rem",
            }}
          >
            {t("calculator.leadTitle")}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "1.25rem",
              lineHeight: 1.5,
            }}
          >
            {t("calculator.leadSub")}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <LeadInput
                type="text"
                placeholder={t("calculator.namePlaceholder")}
                value={lead.name}
                onChange={(e) => handleLeadChange("name", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                $error={!!leadErrors.name}
              />
              {leadErrors.name && (
                <p style={{ fontSize: "0.78rem", color: "#ef4444", marginTop: "0.3rem" }}>
                  {leadErrors.name}
                </p>
              )}
            </div>
            <div>
              <LeadInput
                type="email"
                placeholder={t("calculator.emailPlaceholder")}
                value={lead.email}
                onChange={(e) => handleLeadChange("email", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                $error={!!leadErrors.email}
              />
              {leadErrors.email && (
                <p style={{ fontSize: "0.78rem", color: "#ef4444", marginTop: "0.3rem" }}>
                  {leadErrors.email}
                </p>
              )}
            </div>
          </div>

          <PrimaryBtn
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: "100%" }}
          >
            {submitting ? t("calculator.submitting") : t("calculator.submitBtn")}
          </PrimaryBtn>

          <p
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              textAlign: "center",
              marginTop: "0.75rem",
            }}
          >
            {t("calculator.privacyNote")}
          </p>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button
            type="button"
            onClick={() => {
              setDirection(-1);
              setStep(4);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "0.8rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t("calculator.editAnswers")}
          </button>
        </div>
      </div>
    );
  };

  const getStepContent = () => {
    if (step === 5) return renderResult();
    if (step === 1)
      return renderStep(1, "calculator.step1Title", "calculator.step1Sub", TEAM_SIZE_VALUES, "1fr 1fr");
    if (step === 2)
      return renderStep(2, "calculator.step2Title", "calculator.step2Sub", SALARY_VALUES, "1fr 1fr");
    if (step === 3)
      return renderStep(3, "calculator.step3Title", "calculator.step3Sub", TASK_VALUES, null, true);
    if (step === 4)
      return renderStep(4, "calculator.step4Title", "calculator.step4Sub", INDUSTRY_VALUES, isMobile ? "1fr" : "1fr 1fr");
    return null;
  };

  return (
    <>
      <SEO
        title={t("calculator.metaTitle")}
        description={t("calculator.metaDescription")}
        keywords="automation ROI calculator, business savings calculator, operational efficiency, cost of manual work, automation benefits"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          minHeight: "calc(100vh - 140px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isMobile ? "2rem 1rem 3rem" : "3rem 1rem 4rem",
          background: "#fafafa",
        }}
      >
        {/* Badge */}
        <div
          style={{
            background: "#fff5f5",
            border: "1px solid #ffe3e1",
            borderRadius: "100px",
            padding: "0.35rem 0.875rem",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#f97b72",
            marginBottom: "1.25rem",
            letterSpacing: "0.03em",
          }}
        >
          {t("calculator.badge")}
        </div>

        {/* Headline above card */}
        <h1
          style={{
            fontSize: isMobile ? "1.5rem" : "1.9rem",
            fontWeight: 800,
            color: "#2b2b2b",
            textAlign: "center",
            maxWidth: "520px",
            lineHeight: 1.25,
            marginBottom: "0.6rem",
          }}
        >
          {t("calculator.headline")}
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "420px",
            lineHeight: 1.6,
            marginBottom: "1.75rem",
          }}
        >
          {t("calculator.subheadline")}
        </p>

        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "580px",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            overflow: "hidden",
          }}
        >
          {/* Progress bar */}
          {step <= TOTAL_STEPS && (
            <div
              style={{
                background: "#f9fafb",
                padding: "1rem 1.75rem 0.75rem",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 500 }}>
                  {t("calculator.stepOf", { step, total: TOTAL_STEPS })}
                </span>
                <span style={{ fontSize: "0.78rem", color: "#f97b72", fontWeight: 600 }}>
                  {Math.round(progressPct)}%
                </span>
              </div>
              <div style={{ height: "4px", background: "#e5e7eb", borderRadius: "2px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: "#f97b72",
                    borderRadius: "2px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Animated step content */}
          <div
            style={{
              padding: isMobile ? "1.5rem 1.25rem" : "1.75rem 2rem 2rem",
            }}
          >
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {getStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Trust line */}
        {step <= TOTAL_STEPS && (
          <p
            style={{
              marginTop: "1.25rem",
              fontSize: "0.78rem",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            {t("calculator.trustLine")}
          </p>
        )}
      </motion.div>
    </>
  );
}
