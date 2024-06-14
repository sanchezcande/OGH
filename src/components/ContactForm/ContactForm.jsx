import React, { useState } from "react";
import { validateEmail, validateName, validateMessage } from "./validations";
import { DarkButton } from "../Button/Button";
import { Input, TextArea, Error, FormContainer } from "./ContactForm.styles";
import SuccessModal from "./SuccessModal/SuccessModal";
import emailjs from "emailjs-com";


const ContactForm = React.forwardRef((props, ref) => {
  const [formStatus, setFormStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  function validateForm(formData) {
    const newErrors = {};
    if (!validateName(formData.from_name)) {
      newErrors.from_name = 'Your name has to have more than 2 characters';
    }
    if (!validateEmail(formData.from_email)) {
      newErrors.from_email = 'Your email is not valid';
    }
    if (!validateMessage(formData.message)) {
      newErrors.message = 'Your message has to have more than 10 characters';
    }
    return newErrors;
  }

  function sendEmail(e) {
    e.preventDefault(); 

    const formData = {
      from_name: e.target.from_name.value,
      from_email: e.target.from_email.value,
      contact_number: e.target.contact_number.value,
      subject: e.target.subject.value,
      message: e.target.message.value
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
            setFormStatus('Message sent successfully');
            setIsModalOpen(true);
            e.target.reset();
          },
          (error) => {
            setFormStatus('Error sending message');
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
    <div ref={ref}>
      <FormContainer className="contact-form" onSubmit={sendEmail} noValidate>
        <Input type="text" name="from_name"  placeholder="Name" />
        {errors.from_name && <Error>{errors.from_name}</Error>}
        <Input type="email" name="from_email" placeholder="Email" />
        {errors.from_email && <Error>{errors.from_email}</Error>}
        <Input type="number" name="contact_number" placeholder="Phone number"/>
        <Input type="text" name="subject" placeholder="Subject" />
        <TextArea name="message" placeholder="Message" />
        {errors.message && <Error>{errors.message}</Error>}
        <DarkButton type="submit">Send</DarkButton>
      </FormContainer>
      {isModalOpen && <SuccessModal message={formStatus} onClose={closeModal} />}
      {formStatus && !formStatus.includes('successfully') && <Error>{formStatus}</Error>}
    </div>
  );
});

export default ContactForm;
