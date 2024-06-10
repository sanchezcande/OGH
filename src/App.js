import React, { useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage/HomePage';
import GlobalStyles from './styles/GlobalStyles';
import ContactForm from './components/ContactForm/ContactForm';

function App() {
  const homeRef = useRef(null);
  const contactRef = useRef(null);
  return (
    <Router>
      <GlobalStyles />
      <NavBar homeRef={homeRef} contactRef={contactRef}/>
      <div>
        <HomePage ref={homeRef}/>
        <ContactForm ref={contactRef}/>
      </div>
    </Router>
  );
}

export default App;
