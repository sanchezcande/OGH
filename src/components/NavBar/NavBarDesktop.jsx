import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./NavBarDesktop.module.css";
import { FaAngleDown, FaGlobe } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import Logo4 from "../../../public/Logo4.png";

const NavBarDesktop = () => {
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(0); // Default: Home
  const [selectedLang, setSelectedLang] = useState("en");
  const [tabWidths, setTabWidths] = useState([]);
  const [tabOffsets, setTabOffsets] = useState([]);
  const [showServicesMenu, setShowServicesMenu] = useState(false);

  const updateHighlight = useCallback(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    const widths = Array.from(navLinks).map((link) => link.offsetWidth);
    const offsets = Array.from(navLinks).map((link) => link.offsetLeft);
    setTabWidths(widths);
    setTabOffsets(offsets);

    const indexToUse = hoveredIndex !== -1 ? hoveredIndex : activeIndex;
    if (indexToUse >= 0 && widths[indexToUse] && offsets[indexToUse]) {
      document.documentElement.style.setProperty(
        "--highlight-left",
        `${offsets[indexToUse]}px`
      );
      document.documentElement.style.setProperty(
        "--highlight-width",
        `${widths[indexToUse]}px`
      );
    }
  }, [hoveredIndex, activeIndex]);

  useEffect(() => {
    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    return () => {
      window.removeEventListener("resize", updateHighlight);
    };
  }, [updateHighlight]);

  const toggleLangMenu = () => {
    setShowLangMenu((prev) => !prev);
  };

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
    { text: t("FAQs"), href: "/faqs" },
    { text: t("contactUs"), href: "/contact-us" },
  ];

  const servicesList = [
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

  const handleMouseEnterServices = () => {
    setShowServicesMenu(true);
  };

  const handleMouseLeaveServices = (e) => {
    // Asegurarse de que el cursor no esté sobre el submenú antes de cerrarlo
    const submenu = document.querySelector(`.${styles.servicesMenu}`);
    if (!submenu || !submenu.contains(e.relatedTarget)) {
      setShowServicesMenu(false);
    }
  };

  const handleTabClick = (index) => {
    setActiveIndex(index); // Actualiza el índice persistente al hacer clic
    if (pillTabs[index].text !== t("services")) {
      setShowServicesMenu(false); // Asegura que el submenú se cierre si no es "Services"
    }
  };

  return (
    <nav className={styles.navBarContainer}>
      <div className={styles.logo}>
        <Image src={Logo4} alt="OpenGateHub Logo" width={280} height={60} />
      </div>
      <ul className={styles.navLinks}>
        <div
          className={styles.highlightBar}
          style={{
            left: `${
              (tabOffsets[hoveredIndex !== -1 ? hoveredIndex : activeIndex] || 0) -
              30
            }px`,
            width: `${
              (tabWidths[hoveredIndex !== -1 ? hoveredIndex : activeIndex] || 0) +
              60
            }px`,
          }}
        />
        {pillTabs.map((tab, i) => (
          <li key={tab.text}>
            {tab.text === t("services") ? (
              <span
                className={`${styles.navLink} nav-link`}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  handleMouseEnterServices();
                }}
                onMouseLeave={(e) => {
                  setHoveredIndex(-1);
                  handleMouseLeaveServices(e);
                }}
                onClick={() => handleTabClick(i)}
              >
                <span>{tab.text}</span>
                <ul
                  className={`${styles.servicesMenu} ${
                    showServicesMenu ? styles.visible : ""
                  }`}
                  onMouseEnter={handleMouseEnterServices}
                  onMouseLeave={(e) => handleMouseLeaveServices(e)}
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
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => handleTabClick(i)}
              >
                <Link href={tab.href}>{tab.text}</Link>
              </span>
            )}
          </li>
        ))}
      </ul>
      <div>
        <div className={styles.langMenuContainer} onClick={toggleLangMenu}>
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

        <ul
          className={`${styles.langMenu} ${showLangMenu ? styles.visible : ""}`}
        >
          <li
            className={styles.langMenuItem}
            onClick={() => handleLangChange(selectedLang === "en" ? "es" : "en")}
          >
            {selectedLang === "en" ? t("spanish") : t("english")}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBarDesktop;

