import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "././components/NavBar/NavBar";
import HomePage from "././pages/HomePage/HomePage";
import ContactForm from "././components/ContactForm/ContactForm";


function App() {
  return (
    <Router>
    <NavBar/>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/contact" element={<ContactForm />} />
      {/* <Route path="/about" element={<AboutPage />} /> */}
    </Routes>
  </Router>
  );
}

export default App;
