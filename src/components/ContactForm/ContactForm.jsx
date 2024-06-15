import React, { useState } from "react";
import { validateEmail, validateName, validateMessage } from "./validations";
import { DarkButton } from "../Button/Button";
import {
  AnimatedInput,
  AnimatedTextArea,
  AnimatedInputContainer,
  Error,
  FormContainer,
} from "./ContactForm.styles";
import SuccessModal from "./SuccessModal/SuccessModal";
import emailjs from "emailjs-com";
import { useTransition, useSpring, animated } from "react-spring";

const AnimatedError = ({ show, children }) => {
  const transitions = useTransition(show, {
    from: { transform: "translateY(-10px)", opacity: 0 },
    enter: { transform: "translateY(0)", opacity: 1 },
    leave: { transform: "translateY(+10px)", opacity: 0 },
    config: { tension: 200, friction: 20 },
  });

  return transitions(
    (styles, item) =>
      item && <animated.div style={styles}>{children}</animated.div>
  );
};

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
  const [showErrorAnimations, setShowErrorAnimations] = useState({
    from_name: false,
    from_email: false,
    message: false,
  });

  const errorTransitions = useTransition(
    Object.keys(showErrorAnimations).filter((key) => showErrorAnimations[key]),
    {
      from: { opacity: 0, transform: "translateY(-10px)" },
      enter: { opacity: 1, transform: "translateY(0)" },
      leave: { opacity: 0, transform: "translateY(-10px)" },
      config: { tension: 200, friction: 20 },
    }
  );

  function validateForm(formData) {
    const newErrors = {};
    if (!validateName(formData.from_name)) {
      newErrors.from_name = "Please enter a valid name.";
    } else {
      newErrors.from_name = "";
    }
    if (!validateEmail(formData.from_email)) {
      newErrors.from_email = "Please enter a valid email address.";
    } else {
      newErrors.from_email = "";
    }
    if (!validateMessage(formData.message)) {
      newErrors.message =
        "Please enter a message with more than 10 characters.";
    } else {
      newErrors.message = "";
    }
    return newErrors;
  }

  function handleInputChange(e) {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    setFormData({
      ...formData,
      [fieldName]: fieldValue,
    });

    const newErrors = validateForm({
      ...formData,
      [fieldName]: fieldValue,
    });

    setErrors(newErrors);

    setShowErrorAnimations({
      from_name: !!newErrors.from_name,
      from_email: !!newErrors.from_email,
      message: !!newErrors.message,
    });
  }

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
            e.target.reset();
            setErrors({});
            setShowErrorAnimations({
              from_name: false,
              from_email: false,
              message: false,
            });
          },
          (error) => {
            setFormStatus("Error sending message");
            setIsModalOpen(true);
            console.log(error.text);
          }
        );
    } else {
      setErrors(formErrors);
      setShowErrorAnimations({
        from_name: !!formErrors.from_name,
        from_email: !!formErrors.from_email,
        message: !!formErrors.message,
      });
    }
  }

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <FormContainer className="contact-form" onSubmit={sendEmail} noValidate>
        <AnimatedInput
          style={useSpring({
            opacity: 1,
            transform: "translateX(0)",
            from: { opacity: 0, transform: "translateX(-20px)" },
          })}
          onChange={handleInputChange}
          type="text"
          name="from_name"
          placeholder="Name"
        />
        <AnimatedError show={showErrorAnimations.from_name}>
          {errors.from_name && <Error>{errors.from_name}</Error>}
        </AnimatedError>

        <AnimatedInput
          style={useSpring({
            opacity: 1,
            transform: "translateY(0)",
            from: { opacity: 0, transform: "translateY(-10px)" },
          })}
          onChange={handleInputChange}
          type="email"
          name="from_email"
          placeholder="Email"
        />
        <AnimatedError show={showErrorAnimations.from_email}>
          {errors.from_email && <Error>{errors.from_email}</Error>}
        </AnimatedError>

        <AnimatedInput
          style={useSpring({
            opacity: 1,
            transform: "translateY(0)",
            from: { opacity: 0, transform: "translateY(-10px)" },
          })}
          type="number"
          name="contact_number"
          placeholder="Phone number"
        />

        <AnimatedInput
          style={useSpring({
            opacity: 1,
            transform: "translateY(0)",
            from: { opacity: 0, transform: "translateY(-10px)" },
          })}
          type="text"
          name="subject"
          placeholder="Subject"
        />

        <AnimatedTextArea
          style={useSpring({
            opacity: 1,
            transform: "translateY(0)",
            from: { opacity: 0, transform: "translateY(-10px)" },
          })}
          onChange={handleInputChange}
          name="message"
          placeholder="Message"
        />
        <AnimatedError show={showErrorAnimations.message}>
          {errors.message && <Error>{errors.message}</Error>}
        </AnimatedError>

        <DarkButton type="submit">Send</DarkButton>
      </FormContainer>
      {isModalOpen && (
        <SuccessModal message={formStatus} onClose={closeModal} />
      )}
      {formStatus && !formStatus.includes("successfully") && (
        <Error>{formStatus}</Error>
      )}
    </div>
  );
};

export default ContactForm;
