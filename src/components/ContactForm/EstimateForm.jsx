import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import emailjs from "emailjs-com";
import SuccessModal from "./SuccessModal/SuccessModal";
import {
  FormContainer,
  Input,
  Error,
  StyledButton,
} from "./ContactForm.styles";

const EstimateForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    engagement_type: "",
    budget: "",
    timeline: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("");

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t("pleaseEnterValidName");
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("pleaseEnterValidEmail");
    }
    if (!formData.company.trim()) {
      newErrors.company = t("contactForm.pleaseEnterCompany") || "Please enter your company name";
    }
    if (!formData.engagement_type) {
      newErrors.engagement_type = t("contactForm.pleaseSelectEngagement") || "Please select an engagement type";
    }
    if (!formData.budget) {
      newErrors.budget = t("contactForm.pleaseSelectBudget") || "Please select a budget range";
    }
    if (!formData.timeline) {
      newErrors.timeline = t("contactForm.pleaseSelectTimeline") || "Please select a timeline";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare email template data
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        company: formData.company,
        engagement_type: formData.engagement_type,
        budget: formData.budget,
        timeline: formData.timeline,
        subject: `Project Estimate Request - ${formData.engagement_type}`,
        message: `Company: ${formData.company}\nEngagement Type: ${formData.engagement_type}\nBudget: ${formData.budget}\nTimeline: ${formData.timeline}`,
      };

      await emailjs.send(
        "service_jk13omy",
        "template_k5rhtkf",
        templateParams,
        "DMk76Fu8oF26N7Yse"
      );

      setFormStatus(t("contactForm.estimateRequestSent") || "Estimate request sent successfully");
      setIsModalOpen(true);
      setFormData({
        name: "",
        company: "",
        email: "",
        engagement_type: "",
        budget: "",
        timeline: "",
      });
    } catch (error) {
      console.error("Error sending estimate request:", error);
      setFormStatus(t("errorSendingMessage"));
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormStatus("");
  };

  // Estilo base unificado para todos los inputs
  const baseInputStyle = {
    marginBottom: "0.75rem",
    padding: "0.6rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "0.875rem",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s ease",
    fontFamily: "inherit",
    boxShadow: "none", // Eliminar cualquier sombra/hover
  };

  // Estilo para selects (con padding extra para la flecha)
  const selectStyle = {
    ...baseInputStyle,
    paddingRight: "2.25rem",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.6rem center",
    cursor: "pointer",
  };

  return (
    <>
      <FormContainer onSubmit={handleSubmit} noValidate>
        <Input
          type="text"
          name="name"
          placeholder={t("name")}
          value={formData.name}
          onChange={handleChange}
          required
          style={{
            ...baseInputStyle,
            marginBottom: errors.name ? "0.25rem" : "0.75rem",
            border: errors.name ? "1px solid #F97B72" : baseInputStyle.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.outline = "none";
          }}
        />
        {errors.name && (
          <Error style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.name}
          </Error>
        )}

        <Input
          type="text"
          name="company"
          placeholder={t("contactForm.company") || "Company"}
          value={formData.company}
          onChange={handleChange}
          required
          style={{
            ...baseInputStyle,
            marginBottom: errors.company ? "0.25rem" : "0.75rem",
            border: errors.company ? "1px solid #F97B72" : baseInputStyle.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.outline = "none";
          }}
        />
        {errors.company && (
          <Error style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.company}
          </Error>
        )}

        <Input
          type="email"
          name="email"
          placeholder={t("email")}
          value={formData.email}
          onChange={handleChange}
          required
          style={{
            ...baseInputStyle,
            marginBottom: errors.email ? "0.25rem" : "0.75rem",
            border: errors.email ? "1px solid #F97B72" : baseInputStyle.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.outline = "none";
          }}
        />
        {errors.email && (
          <Error style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.email}
          </Error>
        )}

        <select
          name="engagement_type"
          value={formData.engagement_type}
          onChange={handleChange}
          required
          style={{
            ...selectStyle,
            marginBottom: errors.engagement_type ? "0.25rem" : "0.75rem",
            border: errors.engagement_type ? "1px solid #F97B72" : selectStyle.border,
            color: formData.engagement_type ? "#1f2937" : "#9CA3AF",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.outline = "none";
          }}
        >
          <option value="">{t("contactForm.engagementType") || "Engagement type"}</option>
          <option value="Staff Augmentation">Staff Augmentation</option>
          <option value="Software Factory">Software Factory</option>
        </select>
        {errors.engagement_type && (
          <Error style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.engagement_type}
          </Error>
        )}

        <select
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          required
          style={{
            ...selectStyle,
            marginBottom: errors.budget ? "0.25rem" : "0.75rem",
            border: errors.budget ? "1px solid #F97B72" : selectStyle.border,
            color: formData.budget ? "#1f2937" : "#9CA3AF",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.outline = "none";
          }}
        >
          <option value="">{t("contactForm.budget") || "Estimated budget"}</option>
          <option value="Under $10k">Under $10k</option>
          <option value="$10k–$25k">$10k–$25k</option>
          <option value="$25k–$50k">$25k–$50k</option>
          <option value="$50k+">$50k+</option>
        </select>
        {errors.budget && (
          <Error style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.budget}
          </Error>
        )}

        <select
          name="timeline"
          value={formData.timeline}
          onChange={handleChange}
          required
          style={{
            ...selectStyle,
            marginBottom: errors.timeline ? "0.25rem" : "0.75rem",
            border: errors.timeline ? "1px solid #F97B72" : selectStyle.border,
            color: formData.timeline ? "#1f2937" : "#9CA3AF",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.outline = "none";
          }}
        >
          <option value="">{t("contactForm.timeline") || "Timeline / urgency"}</option>
          <option value="ASAP">ASAP</option>
          <option value="1–3 months">1–3 months</option>
          <option value="Just exploring">Just exploring</option>
        </select>
        {errors.timeline && (
          <Error style={{ marginBottom: "0.5rem", marginTop: "-0.75rem" }}>
            {errors.timeline}
          </Error>
        )}

        <StyledButton
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "10px 20px",
            fontSize: "0.9rem",
            fontWeight: "600",
            backgroundColor: isSubmitting ? "#9CA3AF" : "#f97b72",
            color: "white",
            border: isSubmitting ? "2px solid #9CA3AF" : "2px solid #f97b72",
            borderRadius: "8px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginTop: "0.25rem",
            boxShadow: "none",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = "#e06a5f";
              e.currentTarget.style.borderColor = "#e06a5f";
              // Crear la línea inferior
              if (!e.currentTarget.querySelector(".bottom-line")) {
                const line = document.createElement("div");
                line.className = "bottom-line";
                line.style.cssText = "position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: white; transform: scaleX(0); transform-origin: right; transition: transform 0.3s ease;";
                e.currentTarget.appendChild(line);
                setTimeout(() => {
                  line.style.transform = "scaleX(1)";
                  line.style.transformOrigin = "left";
                }, 10);
              }
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = "#f97b72";
              e.currentTarget.style.borderColor = "#f97b72";
              const line = e.currentTarget.querySelector(".bottom-line");
              if (line) {
                line.style.transform = "scaleX(0)";
                line.style.transformOrigin = "right";
                setTimeout(() => line.remove(), 300);
              }
            }
          }}
        >
          {isSubmitting 
            ? (t("contactForm.submitting") || "Submitting...") 
            : (t("contactForm.requestEstimate") || "Request estimate")
          }
        </StyledButton>
      </FormContainer>

      {isModalOpen && (
        <SuccessModal message={formStatus} onClose={closeModal} />
      )}
    </>
  );
};

export default EstimateForm;
