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

  // Actualizar highlight cuando cambia el hover o activeIndex
  useEffect(() => {
    updateHighlight();
  }, [hoveredIndex, activeIndex, updateHighlight]);

  const toggleLangMenu = () => {
    setShowLangMenu((prev) => !prev);
  };

  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLang(lang);
    setShowLangMenu(false);
  };

  const handleTabClick = (index) => {
    setActiveIndex(index);
  };

  const pillTabs = [
    { text: "Staff Augmentation", href: "/services/staff-augmentation" },
    { text: "Software Factory", href: "/services/software-factory" },
    { text: t("Blog"), href: "/blog" },
    { text: t("aboutUs"), href: "/about-us" },
    { text: t("contactUs"), href: "/contact-us" },
  ];

  return (
    <nav className={styles.navBarContainer}>
      <Link href="/" className={styles.logo}>
        <Image src={Logo4} alt="OpenGateHub Logo" height={24} />
      </Link>
      <ul className={styles.navLinks}>
        {(() => {
          const currentIndex = hoveredIndex !== -1 ? hoveredIndex : activeIndex;
          const offset = tabOffsets[currentIndex] || 0;
          const width = tabWidths[currentIndex] || 0;
          const calculatedLeft = offset - 20;
          const actualLeft = calculatedLeft < 0 ? 0 : calculatedLeft;
          const leftAdjustment = actualLeft - calculatedLeft;
          
          return (
            <div
              className={styles.highlightBar}
              style={{
                left: `${actualLeft}px`,
                width: `${width + 40 - leftAdjustment}px`,
              }}
            />
          );
        })()}
        {pillTabs.map((tab, i) => (
          <li key={tab.text}>
            <Link
              href={tab.href}
              className={`${styles.navLink} nav-link`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(-1)}
              onClick={() => handleTabClick(i)}
            >
              {tab.text}
            </Link>
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
