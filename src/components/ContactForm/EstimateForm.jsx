import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import ReCAPTCHA from "react-google-recaptcha";
import { Body, Button, H3, Small, TextLink, color, font, mq, useLang } from "../../styles/kit";

// Formulario de la página de contacto, para quien prefiere escribir antes que agendar.
// Le pega a /api/send-estimate con los mismos campos de siempre: name, email, company, message.
const BOOKING_URL = "https://strategy.opengatehub.com";
const NEED_KEYS = ["first", "team", "other"];
const FIELD_ORDER = ["name", "email", "need", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: "", email: "", company: "", need: "", message: "" };

const COPY = {
  es: {
    fields: {
      name: "Nombre",
      email: "Email",
      company: "Empresa",
      optional: "(opcional)",
      need: "Qué necesitás",
      needPlaceholder: "Elegí una opción",
      message: "Mensaje",
      messagePlaceholder: "Qué estás construyendo y qué perfil buscás.",
    },
    needs: {
      first: "Mi primer developer",
      team: "Sumar gente a mi equipo",
      other: "Otra cosa",
    },
    errors: {
      name: "Escribí tu nombre.",
      email: "Escribí un email válido, por ejemplo nombre@empresa.com.",
      need: "Elegí una opción.",
      message: "Contanos un poco más (al menos 10 caracteres).",
      captcha: "Completá la verificación para poder enviar.",
      send: "No pudimos enviar tu mensaje. Probá de nuevo o",
      sendLink: "agendá la llamada",
    },
    submit: "Enviar mensaje",
    submitting: "Enviando...",
    note: "Respondemos en menos de 24 horas.",
    sent: {
      title: "Recibimos tu mensaje.",
      text: "Te respondemos en menos de 24 horas.",
      callText: "Preferís hablar antes?",
      callLink: "Agendá la llamada",
    },
  },
  en: {
    fields: {
      name: "Name",
      email: "Email",
      company: "Company",
      optional: "(optional)",
      need: "What you need",
      needPlaceholder: "Choose an option",
      message: "Message",
      messagePlaceholder: "What you're building and the profile you're looking for.",
    },
    needs: {
      first: "My first developer",
      team: "Add people to my team",
      other: "Something else",
    },
    errors: {
      name: "Enter your name.",
      email: "Enter a valid email, like name@company.com.",
      need: "Choose an option.",
      message: "Tell us a bit more (at least 10 characters).",
      captcha: "Complete the verification to send.",
      send: "We couldn't send your message. Try again or",
      sendLink: "book the call",
    },
    submit: "Send message",
    submitting: "Sending...",
    note: "We reply within 24 hours.",
    sent: {
      title: "We got your message.",
      text: "We'll reply within 24 hours.",
      callText: "Rather talk first?",
      callLink: "Book the call",
    },
  },
};

const validate = (values) => {
  const found = {};
  if (!values.name.trim()) found.name = true;
  if (!EMAIL_PATTERN.test(values.email.trim())) found.email = true;
  if (!values.need) found.need = true;
  if (values.message.trim().length < 10) found.message = true;
  return found;
};

// "Qué necesitás" no es un campo de la API: viaja como primera línea del mensaje,
// siempre en español porque el mail lo lee el equipo.
const buildMessage = (values) => `Qué necesita: ${COPY.es.needs[values.need]}\n\n${values.message.trim()}`;

const EstimateForm = () => {
  const lang = useLang();
  const copy = COPY[lang];

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaMissing, setCaptchaMissing] = useState(false);

  const formRef = useRef(null);
  const sentRef = useRef(null);

  // El captcha solo se pide fuera del entorno local, igual que antes.
  useEffect(() => {
    const host = window.location.hostname;
    setShowCaptcha(host !== "localhost" && host !== "127.0.0.1");
  }, []);

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCaptcha = (token) => {
    setCaptchaToken(token);
    if (token) setCaptchaMissing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const found = validate(values);
    const needsCaptcha = showCaptcha && !captchaToken;
    setErrors(found);
    setCaptchaMissing(needsCaptcha);
    setSendFailed(false);

    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      formRef.current?.elements[firstInvalid]?.focus();
      return;
    }
    if (needsCaptcha) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          message: buildMessage(values),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send");

      setValues(EMPTY);
      setCaptchaToken(null);
      setSent(true);
    } catch (error) {
      setSendFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Sent ref={sentRef} tabIndex={-1} role="status">
        <H3 as="p">{copy.sent.title}</H3>
        <Body>{copy.sent.text}</Body>
        <Small>
          {copy.sent.callText}{" "}
          <TextLink href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: "inherit" }}>
            {copy.sent.callLink}
          </TextLink>
        </Small>
      </Sent>
    );
  }

  const describedBy = (field) => (errors[field] ? `estimate-${field}-error` : undefined);
  const fieldError = (field) =>
    errors[field] && <FieldError id={`estimate-${field}-error`}>{copy.errors[field]}</FieldError>;

  return (
    <Form ref={formRef} onSubmit={handleSubmit} noValidate>
      <Field>
        <Label htmlFor="estimate-name">{copy.fields.name}</Label>
        <Input
          id="estimate-name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name")}
          $invalid={errors.name}
        />
        {fieldError("name")}
      </Field>

      <Field>
        <Label htmlFor="estimate-email">{copy.fields.email}</Label>
        <Input
          id="estimate-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email")}
          $invalid={errors.email}
        />
        {fieldError("email")}
      </Field>

      <Field>
        <Label htmlFor="estimate-company">
          {copy.fields.company} <span>{copy.fields.optional}</span>
        </Label>
        <Input
          id="estimate-company"
          name="company"
          type="text"
          autoComplete="organization"
          value={values.company}
          onChange={handleChange}
        />
      </Field>

      <Field>
        <Label htmlFor="estimate-need">{copy.fields.need}</Label>
        <SelectWrap>
          <Select
            id="estimate-need"
            name="need"
            value={values.need}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.need)}
            aria-describedby={describedBy("need")}
            $invalid={errors.need}
            $empty={!values.need}
          >
            <option value="" disabled>
              {copy.fields.needPlaceholder}
            </option>
            {NEED_KEYS.map((key) => (
              <option key={key} value={key}>
                {copy.needs[key]}
              </option>
            ))}
          </Select>
        </SelectWrap>
        {fieldError("need")}
      </Field>

      <Field $full>
        <Label htmlFor="estimate-message">{copy.fields.message}</Label>
        <Textarea
          id="estimate-message"
          name="message"
          rows={5}
          placeholder={copy.fields.messagePlaceholder}
          value={values.message}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          $invalid={errors.message}
        />
        {fieldError("message")}
      </Field>

      {showCaptcha && (
        <Field $full>
          <ReCAPTCHA sitekey="6Lcdg6cqAAAAANwnQdyMzXcCUUTe3GzdeexkbU_-" onChange={handleCaptcha} hl={lang} />
          {captchaMissing && <FieldError role="alert">{copy.errors.captcha}</FieldError>}
        </Field>
      )}

      {sendFailed && (
        <SendError role="alert">
          {copy.errors.send}{" "}
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            {copy.errors.sendLink}
          </a>
          .
        </SendError>
      )}

      <Actions>
        <Submit as="button" type="submit" disabled={isSubmitting} $block>
          {isSubmitting ? copy.submitting : copy.submit}
        </Submit>
        <Small>{copy.note}</Small>
      </Actions>
    </Form>
  );
};

export default EstimateForm;

/* ───────── Estilos del formulario (tokens del kit) ───────── */

// Dos campos por fila cuando entran cómodos; si la columna es angosta, uno solo.
const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, max(248px, calc((100% - 18px) / 2))), 1fr));
  gap: 22px 18px;
`;

const Field = styled.div`
  min-width: 0;
  ${({ $full }) => $full && "grid-column: 1 / -1;"}
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-family: ${font.sans};
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: ${color.ink};

  span {
    font-weight: 400;
    color: ${color.muted};
  }
`;

const control = css`
  display: block;
  width: 100%;
  min-height: 48px;
  padding: 11px 14px;
  border: 1px solid ${({ $invalid }) => ($invalid ? color.accentDark : color.muted)};
  border-radius: 4px;
  background: ${color.paper};
  color: ${color.ink};
  font-family: ${font.sans};
  font-size: 1rem;
  line-height: 1.5;
  appearance: none;
  box-shadow: none;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: ${color.muted};
    opacity: 1;
  }

  &:hover {
    border-color: ${({ $invalid }) => ($invalid ? color.accentDark : color.ink)};
  }

  &:focus {
    border-color: ${color.ink};
    outline: 2px solid ${color.accent};
    outline-offset: 2px;
  }
`;

const Input = styled.input`
  ${control}
`;

const Textarea = styled.textarea`
  ${control}
  min-height: 136px;
  resize: vertical;
`;

const SelectWrap = styled.div`
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 18px;
    width: 8px;
    height: 8px;
    border-right: 1.5px solid ${color.ink};
    border-bottom: 1.5px solid ${color.ink};
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }
`;

const Select = styled.select`
  ${control}
  padding-right: 40px;
  cursor: pointer;
  color: ${({ $empty }) => ($empty ? color.muted : color.ink)};

  option {
    color: ${color.ink};
  }
`;

const FieldError = styled.p`
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: ${color.accentDark};
`;

const SendError = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  padding: 14px 18px;
  background: ${color.paperAlt};
  border-left: 2px solid ${color.accentDark};
  font-size: 0.9375rem;
  line-height: 1.5;
  color: ${color.ink};

  a {
    color: ${color.ink};
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: ${color.accent};
    text-underline-offset: 4px;
  }
`;

const Actions = styled.div`
  grid-column: 1 / -1;
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 20px;

  ${mq.mobile} {
    ${Small} {
      width: 100%;
      text-align: center;
    }
  }
`;

const Submit = styled(Button)`
  &:disabled,
  &:disabled:hover {
    background: ${color.ink};
    border-color: ${color.ink};
    opacity: 0.6;
    cursor: default;
  }
`;

const Sent = styled.div`
  padding: 28px 32px;
  background: ${color.paperAlt};
  border-left: 2px solid ${color.accent};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  &:focus {
    outline: none;
  }

  ${Small} {
    margin-top: 8px;
  }

  ${mq.mobile} {
    padding: 24px;
  }
`;
