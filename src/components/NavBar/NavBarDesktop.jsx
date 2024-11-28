import React, { useState } from "react";
import Link from "next/link"; // Usamos Link de Next.js
import {
  Logo,
  Span,
  NavBarContainer,
  NavLink,
  NavLinks,
  LangMenuContainer,
  LangMenu,
  LangMenuItem,
  WorldIcon,
  StyledLangText,
  HighlightBar,
  ArrowIcon,
} from "./NavBarDesktop.styles";
import { useTranslation } from "react-i18next";

const NavBarDesktop = () => {
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en");

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);
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
    { text: t("contactUs"), href: "/contact-us" },
  ];

  return (
    <NavBarContainer>
      <Logo>
        OpenGate<Span>Hub</Span>
      </Logo>
      <NavLinks>
      <HighlightBar hoveredIndex={hoveredIndex} tabCount={pillTabs.length}/>
        {pillTabs.map((tab, i) => (
          <li key={tab.text}>
              <NavLink
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {tab.text}
              </NavLink>
          </li>
        ))}
      </NavLinks>
      <div>
        <LangMenuContainer onClick={toggleLangMenu}>
          <WorldIcon />
          <StyledLangText>
            {selectedLang === "en" ? t("english") : t("spanish")}
          </StyledLangText>
          <ArrowIcon open={showLangMenu} />
        </LangMenuContainer>
        {showLangMenu && (
          <LangMenu isOpen={showLangMenu}>
            {selectedLang === "en" ? (
              <LangMenuItem onClick={() => handleLangChange("es")}>
                {t("spanish")}
              </LangMenuItem>
            ) : (
              <LangMenuItem onClick={() => handleLangChange("en")}>
                {t("english")}
              </LangMenuItem>
            )}
          </LangMenu>
        )}
      </div>
    </NavBarContainer>
  );
};

export default NavBarDesktop;




// import React, { useState } from "react";
// import {
//   Logo,
//   Span,
//   NavBarContainer,
//   NavLink,
//   NavLinks,
//   LangMenuContainer,
//   LangMenu,
//   LangMenuItem,
//   WorldIcon,
//   StyledLangText,
//   ArrowIcon,
// } from "./NavBarDesktop.styles";
// import { MagicTabSelect } from "react-magic-motion";
// import { useTranslation } from "react-i18next";

// const NavBar = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {
//   const { t, i18n } = useTranslation();
//   const [showLangMenu, setShowLangMenu] = useState(false);
//   const [hoveredIndex, setHoveredIndex] = useState(0);
//   const [selectedLang, setSelectedLang] = useState("en");

//   const handleScroll = (ref) => {
//     ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
//   };

//   const toggleLangMenu = () => {
//     setShowLangMenu(!showLangMenu);
//   };

//   const handleLangChange = (lang) => {
//     i18n.changeLanguage(lang);
//     setSelectedLang(lang);
//     setShowLangMenu(false);
//   };
  
//   const pillTabs = [
//     { text: t("home"), ref: "homeRef", href: "#home" },
//     { text: t("services"), ref: "servicesRef", href: "#services" },
//     { text: t("aboutUs"), ref: "aboutUsRef", href: "#about-us" },
//     { text: t("contactUs"), ref: "contactUsRef", href: "#contact-us" },
//   ];

//   const tabsComponents = pillTabs.map((tab, i) => (
//     <li key={tab.text}>
//       <NavLink
//         href={tab.href}
//         onMouseEnter={() => setHoveredIndex(i)}
//         onClick={(e) => {
//           e.preventDefault();
//           handleScroll(
//             tab.ref === "homeRef"
//               ? homeRef
//               : tab.ref === "aboutUsRef"
//               ? aboutUsRef
//               : tab.ref === "servicesRef"
//               ? servicesRef
//               : contactUsRef
//           );
//         }}
//       >
//         {hoveredIndex === i && (
//           <MagicTabSelect
//             id="pillTabs"
//             transition={{ type: "spring", bounce: 0.35 }}
//           >
//             <span
//               style={{
//                 borderRadius: "999px",
//                 position: "absolute",
//                 top: "-5px",
//                 left: "-30px",
//                 right: "-30px",
//                 bottom: "-5px",
//                 zIndex: -1,
//                 backgroundColor: "rgba(21, 62, 108, 0.84)",
//               }}
//             />
//           </MagicTabSelect>
//         )}
//        {t(tab.text)}
//       </NavLink>
//     </li>
//   ));

//   return (
//     <NavBarContainer>
//       <Logo>
//         OpenGate<Span>Hub</Span>
//       </Logo>
//       <NavLinks>{tabsComponents}</NavLinks>
//       <div>
//         <LangMenuContainer onClick={toggleLangMenu}>
//           <WorldIcon />
//           <StyledLangText>
//           {selectedLang === "en" ? t("english") : t("spanish")}
//           </StyledLangText>
//           <ArrowIcon open={showLangMenu} />
//         </LangMenuContainer>
//         {showLangMenu && (
//           <LangMenu isOpen={showLangMenu}>
//             {selectedLang === "en" ? (
//               <LangMenuItem onClick={() => handleLangChange("es")}>
//                 {t("spanish")}
//               </LangMenuItem>
//             ) : (
//               <LangMenuItem onClick={() => handleLangChange("en")}>
//                 {t("english")}
//               </LangMenuItem>
//             )}
//           </LangMenu>
//         )}
//       </div>
//     </NavBarContainer>
//   );
// };

// export default NavBar;
