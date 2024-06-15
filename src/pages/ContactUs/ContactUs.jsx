import ContactForm from '../../components/ContactForm/ContactForm';
import React from 'react';
import { Container } from './ContactUs.styles';

const ContactUs = React.forwardRef((props, ref) => {
  return (
    <Container ref={ref}>
       <div style={{ marginBottom: '20px' }} /> 
        <h1>Have a Question? Reach Out!</h1>
        <h2>Thank you for contacting us! Please fill out the form below and we'll get back to you shortly.</h2>
    <ContactForm />
    </Container>
  );
})

export default ContactUs;