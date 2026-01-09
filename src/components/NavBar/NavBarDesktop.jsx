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
  const [activeIndex, setActiveIndex] = useState(0);
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
        `${offsets[indexToUse]}px`,
      );
      document.documentElement.style.setProperty(
        "--highlight-width",
        `${widths[indexToUse]}px`,
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
    {
      text: "Staff Augmentation",
      href: "/services/staff-augmentation",
      featured: true,
    },
    { text: "n8n Automation", href: "/services/n8n-automation" },
    { text: t("aiTitle"), href: "/services/AI" },
    { text: t("frontendTitle"), href: "/services/front-end" },
    { text: t("backendTitle"), href: "/services/back-end" },
    { text: t("uxuiTitle"), href: "/services/ux-ui" },
    { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
  ];

  const handleMouseEnterServices = () => {
    setShowServicesMenu(true);
  };

  const handleMouseLeaveServices = (e) => {
    const submenu = document.querySelector(`.${styles.servicesMenu}`);
    const relatedTarget = e.relatedTarget;
    if (
      !submenu ||
      !(relatedTarget instanceof Node) || // FIX aplicado
      !submenu.contains(relatedTarget)
    ) {
      setShowServicesMenu(false);
    }
  };

  const handleTabClick = (index) => {
    setActiveIndex(index);
    if (pillTabs[index].text !== t("services")) {
      setShowServicesMenu(false);
    }
  };

  return (
    <nav className={styles.navBarContainer}>
      <Link href="/" className={styles.logo}>
        <Image src={Logo4} alt="OpenGateHub Logo" height={30} />
      </Link>
      <ul className={styles.navLinks}>
        <div
          className={styles.highlightBar}
          style={{
            left: `${
              (tabOffsets[hoveredIndex !== -1 ? hoveredIndex : activeIndex] ||
                0) - 30
            }px`,
            width: `${
              (tabWidths[hoveredIndex !== -1 ? hoveredIndex : activeIndex] ||
                0) + 60
            }px`,
          }}
        />
        {pillTabs.map((tab, i) => (
          <li
            key={tab.text}
            className={tab.text === t("services") ? styles.navLinkWrapper : ""}
            onMouseEnter={
              tab.text === t("services") ? handleMouseEnterServices : null
            }
            onMouseLeave={
              tab.text === t("services") ? handleMouseLeaveServices : null
            }
          >
            {tab.text === t("services") ? (
              <>
                <span className={`${styles.navLink} nav-link`}>{tab.text}</span>
                <ul
                  className={`${styles.servicesMenu} ${
                    showServicesMenu ? styles.visible : ""
                  }`}
                >
                  {servicesList.map((service, index) => (
                    <li
                      key={index}
                      className={styles.servicesMenuItem}
                      style={
                        service.featured
                          ? {
                              background:
                                "linear-gradient(135deg, #FFF5F5 0%, #FEF2F2 100%)",
                              borderLeft: "3px solid #F97B72",
                              fontWeight: "500",
                            }
                          : {}
                      }
                    >
                      <Link href={service.href}>
                        {service.text}
                        {service.featured && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "0.75rem",
                            }}
                          >
                            ⭐
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Link
                href={tab.href}
                className={`${styles.navLink} nav-link`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => handleTabClick(i)}
              >
                {tab.text}
              </Link>
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
            onClick={() =>
              handleLangChange(selectedLang === "en" ? "es" : "en")
            }
          >
            {selectedLang === "en" ? t("spanish") : t("english")}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBarDesktop;
