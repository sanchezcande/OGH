import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <h3>Nombre de la Empresa</h3>
          <p>Dirección de la Empresa</p>
          <p>Teléfono: +123456789</p>
          <p>Email: info@empresa.com</p>
        </div>
        <div className="footer-center">
          <h3>Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li><a href="#">Inicio</a></li>
            <li><a href="#">Servicios</a></li>
            <li><a href="#">Productos</a></li>
            <li><a href="#">Nosotros</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>
        <div className="footer-right">
          <h3>Síguenos</h3>
          <div className="footer-social-icons">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Nombre de la Empresa. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
