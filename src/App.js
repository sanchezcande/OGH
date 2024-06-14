import React, { useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage/HomePage';
import GlobalStyles from './styles/GlobalStyles';
import ContactForm from './components/ContactForm/ContactForm';

function App() {

  const homeRef = useRef(null);
  const aboutUsRef = useRef(null);
  const servicesRef = useRef(null);
  const contactUsRef = useRef(null);

  return (
    <Router>
      <GlobalStyles />
      <NavBar homeRef={homeRef} aboutUsRef={aboutUsRef} servicesRef={servicesRef} contactUsRef={contactUsRef}/>
      <div>
        <HomePage ref={homeRef}/>
        <ContactForm ref={contactUsRef}/>
        
      </div>
    </Router>
  );
}

export default App;
