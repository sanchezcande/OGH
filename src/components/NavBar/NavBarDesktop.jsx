import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./NavBarDesktop.module.css";
import { FaAngleDown, FaGlobe } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const NavBarDesktop = () => {
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en");
  const [tabWidths, setTabWidths] = useState([]);
  const [tabOffsets, setTabOffsets] = useState([]);
  const [showServicesMenu, setShowServicesMenu] = useState(false);

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);
  };

  useEffect(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    const widths = Array.from(navLinks).map((link) => link.offsetWidth);
    const offsets = Array.from(navLinks).map((link) => link.offsetLeft);
    setTabWidths(widths);
    setTabOffsets(offsets);
    if (hoveredIndex >= 0 && widths[hoveredIndex] && offsets[hoveredIndex]) {
      document.documentElement.style.setProperty(
        "--highlight-left",
        `${offsets[hoveredIndex]}px`
      );
      document.documentElement.style.setProperty(
        "--highlight-width",
        `${widths[hoveredIndex]}px`
      );
      console.log(
        "Updated variables:",
        `left: ${offsets[hoveredIndex]}px`,
        `width: ${widths[hoveredIndex]}px`
      );
    }
  }, [hoveredIndex]);

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLang(lang);
    setShowLangMenu(false);
  };

  const pillTabs = [
    { text: t("home"), href: "/" },
    { text: t("services"), href: "/services" },
    { text: t("aboutUs"), href: "/about-us" },
    { text: t("Blog"), href: "/blog" },
    { text: t("contactUs"), href: "/contact-us" },
  ];

  const servicesList = [
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

  let hideMenuTimeout;

  const handleMouseLeave = () => {
    hideMenuTimeout = setTimeout(() => {
      setShowServicesMenu(false);
    }, 200); // Retraso de 200ms
  };

  const handleMouseEnter = () => {
    clearTimeout(hideMenuTimeout);
    setShowServicesMenu(true);
  };

  return (
    <nav className={styles.navBarContainer}>
      <div className={styles.logo}>
        OpenGate<span className={styles.span}>Hub</span>
      </div>
      <ul className={styles.navLinks}>
        <div
          className={styles.highlightBar}
          style={{
            left: `${(tabOffsets[hoveredIndex] || 0) - 30}px`,
            width: `${(tabWidths[hoveredIndex] || 0) + 60}px`,
          }}
        />
        {pillTabs.map((tab, i) => (
          <li key={tab.text}>
            {tab.text === t("services") ? (
              <span
                className={`${styles.navLink} nav-link`}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  handleMouseEnter();
                }}
                onMouseLeave={handleMouseLeave}
              >
                <span>{tab.text}</span>
                <ul
                  className={`${styles.servicesMenu} ${showServicesMenu ? styles.visible : ""
                    }`}
                >
                  {servicesList.map((service, index) => (
                    <li key={index} className={styles.servicesMenuItem}>
                      <Link href={service.href}>{service.text}</Link>
                    </li>
                  ))}
                </ul>
              </span>
            ) : (
              <span
                className={`${styles.navLink} nav-link`}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  handleMouseLeave();
                }}
              >
                <Link href={tab.href}>{tab.text}</Link>
              </span>
            )}
          </li>
        ))}

      </ul>
      <div>
        <div
          className={styles.langMenuContainer}
          onClick={toggleLangMenu}
        >
          <FaGlobe className={styles.worldIcon} />
          <span className={styles.styledLangText}>
            {selectedLang === "en" ? t("english") : t("spanish")}
          </span>
          <FaAngleDown
            className={styles.arrowIcon}
            style={{
              transform: showLangMenu ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
    
          <ul className=
          {`${styles.langMenu} ${
            showLangMenu ? styles.visible : ""
          }`}>
            {selectedLang === "en" ? (
              <li
                className={styles.langMenuItem}
                onClick={() => handleLangChange("es")}
              >
                {t("spanish")}
              </li>
            ) : (
              <li
                className={styles.langMenuItem}
                onClick={() => handleLangChange("en")}
              >
                {t("english")}
              </li>
            )}
          </ul>
    
      </div>
    </nav>
  );
};

export default NavBarDesktop;
