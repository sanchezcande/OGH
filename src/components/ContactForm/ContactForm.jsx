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

const ContactForm = () => {
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

  function validateForm() {
    const newErrors = {};
    if (!validateName(formData.from_name)) {
      newErrors.from_name = "Please enter a valid name";
    } else {
      delete newErrors.from_name;
    }
    if (!validateEmail(formData.from_email)) {
      newErrors.from_email = "Please enter a valid email address";
    } else {
     delete newErrors.from_email;
    }
    if (!validateMessage(formData.message)) {
      newErrors.message = "Please enter a message with more than 10 characters";
    } else {
      delete newErrors.message;
    }
    setErrors(newErrors);
    return newErrors;
  }

const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateForm(); 
  };

  function sendEmail(e) {
    e.preventDefault();

    const formData = {
      from_name: e.target.from_name.value,
      from_email: e.target.from_email.value,
      contact_number: e.target.contact_number.value,
      subject: e.target.subject.value,
      message: e.target.message.value,
    };

    const formErrors = validateForm(formData);

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
            setFormStatus("Message sent successfully");
            setIsModalOpen(true);
          },
          (error) => {
            setFormStatus("Error sending message");
            setIsModalOpen(true);
            console.log(error.text);
          }
        );
    } else {
      setErrors(formErrors);
    }
  }

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <FormContainer className="contact-form" onSubmit={sendEmail} noValidate>
        <Input
          type="text"
          name="from_name"
          placeholder="Name"
          onChange={handleInputChange}
          className={errors.from_name ? "error" : "valid"}
        />
        {errors.from_name && (
          <Error className={errors.from_name ? "visible" : "hidden"}>
            {errors.from_name}
          </Error>
        )}
        <Input
          type="email"
          name="from_email"
          placeholder="Email"
          onChange={handleInputChange}
          className={errors.from_email ? "error" : "valid"}
        />
        {errors.from_email && (
          <Error className={errors.from_email ? "visible" : "hidden"}>
            {errors.from_email}
          </Error>
        )}
        <Input
          type="number"
          name="contact_number"
          placeholder="Phone number (optional)"
        />
        <Input type="text" name="subject" placeholder="Subject (optional)" />
        <TextArea
          name="message"
          placeholder="Message"
          onChange={handleInputChange}
          className={errors.message ? "error" : "valid"}
        />
        {errors.message && (
          <Error className={errors.message ? "visible" : "hidden"}>
            {errors.message}
          </Error>
        )}

        <StyledButton
          className={errors.message ? "error" : "valid"}
          type="submit"
        >
          Send
        </StyledButton>
      </FormContainer>
      {isModalOpen && (
        <SuccessModal message={formStatus} onClose={closeModal} />
      )}
      {formStatus && !formStatus.includes("successfully") && (
        <Error className="visible">{formStatus}</Error>
      )}
    </div>
  );
};

export default ContactForm;
