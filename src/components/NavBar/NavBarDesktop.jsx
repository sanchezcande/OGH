import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./NavBarDesktop.module.css";
import { FaGlobe } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import OGHLogo from "../Logo/OGHLogo";

const NavBarDesktop = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState("en");
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const navRef = useRef(null);

  const handleLangToggle = () => {
    const next = selectedLang === "en" ? "es" : "en";
    i18n.changeLanguage(next);
    setSelectedLang(next);
  };

  // Hide on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    if (currentY < 100) {
      setVisible(true);
    } else if (currentY > lastScrollY) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setLastScrollY(currentY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Detect background color of the section behind navbar
  useEffect(() => {
    const getActualBg = (el) => {
      // Walk up the DOM until we find an element with a real background color
      while (el && el !== document.documentElement) {
        const bg = window.getComputedStyle(el).backgroundColor;
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
          const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
          // Skip transparent/semi-transparent backgrounds
          if (a > 0.5) return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
        }
        el = el.parentElement;
      }
      return { r: 255, g: 255, b: 255 }; // default white
    };

    const checkBackground = () => {
      const nav = navRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height + 4;

      nav.style.pointerEvents = "none";
      nav.style.visibility = "hidden";
      const el = document.elementFromPoint(midX, midY);
      nav.style.pointerEvents = "";
      nav.style.visibility = "";

      if (!el) return;

      const { r, g, b } = getActualBg(el);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      setIsDark(brightness < 128);
    };

    checkBackground();
    const interval = setInterval(checkBackground, 250);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { text: "Workflow Automation", href: "/services/workflow-automation" },
    { text: "Staff Augmentation", href: "/services/staff-augmentation" },
    { text: t("Blog"), href: "/blog" },
    { text: t("aboutUs"), href: "/about-us" },
    { text: t("contactUs"), href: "/contact-us" },
  ];

  const isActive = (href) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  const mode = isDark ? styles.dark : styles.light;

  return (
    <div ref={navRef} className={`${styles.navBarOuter} ${visible ? "" : styles.hidden}`}>
      <nav className={`${styles.navBarContainer} ${mode}`}>
        <Link href="/" className={styles.logo} aria-label="OpenGateHub Home">
          <OGHLogo size={18} variant={isDark ? "light" : "dark"} />
        </Link>

        <div className={styles.divider} />

        <ul className={styles.navLinks}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${isActive(item.href) ? styles.active : ""}`}
              >
                {item.text}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.divider} />

        <div className={styles.langToggle} onClick={handleLangToggle}>
          <FaGlobe className={styles.langIcon} />
          {selectedLang === "en" ? "EN" : "ES"}
        </div>
      </nav>
    </div>
  );
};

export default NavBarDesktop;
