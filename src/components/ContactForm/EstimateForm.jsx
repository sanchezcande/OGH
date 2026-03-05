import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ReCAPTCHA from "react-google-recaptcha";
import SuccessModal from "./SuccessModal/SuccessModal";
import useMediaQuery from "../../Hooks/useMediaQuery";
import {
  FormContainer,
  Input,
  Error as ErrorMessage,
  StyledButton,
} from "./ContactForm.styles";

const EstimateForm = () => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const calendlyUrl = "https://calendly.com/sanchezgcandelaria/15min";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const [modalKind, setModalKind] = useState("info");
  const [captchaToken, setCaptchaToken] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t("pleaseEnterValidName");
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("pleaseEnterValidEmail");
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = t("contactForm.pleaseDescribeProblem", "Tell us a bit more (at least 10 characters)");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isDev = typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (!isDev && !captchaToken) {
      setFormStatus(t("pleaseCompleteCaptcha"));
      setModalKind("error");
      setIsModalOpen(true);
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send");

      setFormStatus(t("contactForm.successMessage", "We'll get back to you within 24 hours."));
      setModalKind("success");
      setIsModalOpen(true);
      setFormData({ name: "", email: "", company: "", message: "" });
      setCaptchaToken(null);
    } catch (error) {
      setFormStatus(t("errorSendingMessage"));
      setModalKind("error");
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseInputStyle = {
    marginBottom: "0.75rem",
    padding: "0.65rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "0.875rem",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s ease",
    fontFamily: "inherit",
    boxShadow: "none",
  };

  const fieldProps = (name) => ({
    style: {
      ...baseInputStyle,
      marginBottom: errors[name] ? "0.25rem" : "0.75rem",
      border: errors[name] ? "1px solid #F97B72" : baseInputStyle.border,
    },
    onFocus: (e) => {
      e.currentTarget.style.borderColor = "#94a3b8";
      e.currentTarget.style.outline = "none";
    },
    onBlur: (e) => {
      e.currentTarget.style.borderColor = errors[name] ? "#F97B72" : "#e5e7eb";
    },
  });

  return (
    <>
      <FormContainer onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <Input
          type="text"
          name="name"
          placeholder={t("name")}
          value={formData.name}
          onChange={handleChange}
          required
          {...fieldProps("name")}
        />
        {errors.name && (
          <ErrorMessage style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.name}
          </ErrorMessage>
        )}

        {/* Email */}
        <Input
          type="email"
          name="email"
          placeholder={t("email")}
          value={formData.email}
          onChange={handleChange}
          required
          {...fieldProps("email")}
        />
        {errors.email && (
          <ErrorMessage style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.email}
          </ErrorMessage>
        )}

        {/* Company (optional) */}
        <Input
          type="text"
          name="company"
          placeholder={t("contactForm.companyOptional", "Company (optional)")}
          value={formData.company}
          onChange={handleChange}
          {...fieldProps("company")}
        />

        {/* Message */}
        <textarea
          name="message"
          placeholder={t("contactForm.messagePlaceholder", "What's going on? Tell us what you're dealing with — the more context, the better.")}
          value={formData.message}
          onChange={handleChange}
          rows={4}
          style={{
            ...baseInputStyle,
            resize: "vertical",
            minHeight: "110px",
            marginBottom: errors.message ? "0.25rem" : "0.75rem",
            border: errors.message ? "1px solid #F97B72" : baseInputStyle.border,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#94a3b8";
            e.currentTarget.style.outline = "none";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.message ? "#F97B72" : "#e5e7eb";
          }}
        />
        {errors.message && (
          <ErrorMessage style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.message}
          </ErrorMessage>
        )}

        {/* Captcha — only in production */}
        {typeof window !== "undefined" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1" && (
            <div style={{ marginBottom: "1rem" }}>
              <ReCAPTCHA
                sitekey="6Lcdg6cqAAAAANwnQdyMzXcCUUTe3GzdeexkbU_-"
                onChange={setCaptchaToken}
              />
            </div>
          )}

        {/* Submit */}
        <StyledButton
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "11px 20px",
            fontSize: "0.9rem",
            fontWeight: "600",
            backgroundColor: isSubmitting ? "#9CA3AF" : "#f97b72",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "background-color 0.2s ease",
            marginTop: "0.25rem",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = "#e06a5f";
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = "#f97b72";
          }}
        >
          {isSubmitting
            ? t("contactForm.submitting", "Sending...")
            : t("contactForm.sendBtn", "Send →")}
        </StyledButton>

        {/* Trust note */}
        <p style={{
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#94a3b8",
          marginTop: "0.75rem",
          marginBottom: 0,
          lineHeight: 1.4,
        }}>
          {t("contactForm.trustNote", "We reply within 24h — no pitch, just a clear next step.")}
        </p>
      </FormContainer>

      {isModalOpen && (
        <SuccessModal
          message={formStatus}
          onClose={() => { setIsModalOpen(false); setFormStatus(""); setModalKind("info"); }}
          showQuickAction={modalKind === "success"}
          quickActionText={t("contactForm.successQuickAction", "Urgent? Book a 15-min automation audit")}
          quickActionHref={calendlyUrl}
        />
      )}
    </>
  );
};

export default EstimateForm;
