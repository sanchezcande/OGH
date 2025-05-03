import React, { useState } from "react";
import { validateEmail, validateName, validateMessage } from "./validations";
import {
  Input,
  TextArea,
  Error,
  FormContainer,
  StyledButton,
} from "./ContactForm.styles";
import SuccessModal from "./SuccessModal/SuccessModal";
import emailjs from "emailjs-com";
import { useTranslation } from "react-i18next";
import ReCAPTCHA from "react-google-recaptcha";

const ContactForm = () => {
  const { t } = useTranslation();
  const initialFormData = {
    from_name: "",
    from_email: "",
    contact_number: "",
    subject: "",
    message: "",
  };
  const [formStatus, setFormStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(initialFormData);
  const [captchaToken, setCaptchaToken] = useState(null);

  function validateForm(currentData = formData) {
    const newErrors = {};
    if (!validateName(currentData.from_name)) {
      newErrors.from_name = t("pleaseEnterValidName");
    }
    if (!validateEmail(currentData.from_email)) {
      newErrors.from_email = t("pleaseEnterValidEmail");
    }
    if (!validateMessage(currentData.message)) {
      newErrors.message = t("pleaseEnterValidMessage");
    }
    setErrors(newErrors);
    return newErrors;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    validateForm(updatedFormData);
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  function sendEmail(e) {
    e.preventDefault();
    const formErrors = validateForm();

    if (!captchaToken) {
      setFormStatus(t("pleaseCompleteCaptcha"));
      return;
    }

    if (Object.keys(formErrors).length === 0) {
      emailjs
        .sendForm(
          "service_jk13omy",
          "template_k5rhtkf",
          e.target,
          "DMk76Fu8oF26N7Yse"
        )
        .then(
          (result) => {
            setFormStatus(t("messageSentSuccessfully"));
            setIsModalOpen(true);
            setFormData(initialFormData);
          },
          (error) => {
            setFormStatus(t("errorSendingMessage"));
            setIsModalOpen(true);
            console.error(error.text);
          }
        );
    }
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setFormStatus("");
  };

  return (
    <div>
      <FormContainer className="contact-form" onSubmit={sendEmail} noValidate>
        <Input
          type="text"
          name="from_name"
          placeholder={t("name")}
          value={formData.from_name}
          onChange={handleInputChange}
          className={errors.from_name ? "error touched" : "valid touched"}
        />
        {errors.from_name && <Error className="visible">{errors.from_name}</Error>}

        <Input
          type="email"
          name="from_email"
          placeholder={t("email")}
          value={formData.from_email}
          onChange={handleInputChange}
          className={errors.from_email ? "error touched" : "valid touched"}
        />
        {errors.from_email && <Error className="visible">{errors.from_email}</Error>}

        <Input
          type="number"
          name="contact_number"
          placeholder={t("phoneNumber")}
          value={formData.contact_number}
          onChange={handleInputChange}
        />

        <Input
          type="text"
          name="subject"
          placeholder={t("subject")}
          value={formData.subject}
          onChange={handleInputChange}
        />

        <TextArea
          name="message"
          placeholder={t("message")}
          value={formData.message}
          onChange={handleInputChange}
          className={errors.message ? "error touched" : "valid touched"}
        />
        {errors.message && <Error className="visible">{errors.message}</Error>}

        <ReCAPTCHA
          sitekey="6Lcdg6cqAAAAANwnQdyMzXcCUUTe3GzdeexkbU_-"
          onChange={handleCaptchaChange}
        />

        {formStatus && !formStatus.includes("successfully") && (
          <Error className="visible">{formStatus}</Error>
        )}

        <StyledButton
          className={Object.keys(errors).length > 0 ? "error" : "valid"}
          type="submit"
        >
          {t("send")}
        </StyledButton>
      </FormContainer>

      {isModalOpen && (
        <SuccessModal message={formStatus} onClose={closeModal} />
      )}
    </div>
  );
};

export default ContactForm;
