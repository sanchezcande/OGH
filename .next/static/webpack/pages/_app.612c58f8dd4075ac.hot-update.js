"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("pages/_app",{

/***/ "./src/components/NavBar/NavBarDesktop.jsx":
/*!*************************************************!*\
  !*** ./src/components/NavBar/NavBarDesktop.jsx ***!
  \*************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"./node_modules/react/jsx-dev-runtime.js\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/link */ \"./node_modules/next/link.js\");\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./NavBarDesktop.styles */ \"./src/components/NavBar/NavBarDesktop.styles.js\");\n/* harmony import */ var react_i18next__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-i18next */ \"./node_modules/react-i18next/dist/es/index.js\");\n\nvar _s = $RefreshSig$();\n\n // Usamos Link de Next.js\n\n\nconst NavBarDesktop = ()=>{\n    _s();\n    const { t, i18n } = (0,react_i18next__WEBPACK_IMPORTED_MODULE_4__.useTranslation)();\n    const [showLangMenu, setShowLangMenu] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [hoveredIndex, setHoveredIndex] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(0);\n    const [selectedLang, setSelectedLang] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"en\");\n    const [isAnimating, setIsAnimating] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const toggleLangMenu = ()=>{\n        setShowLangMenu(!showLangMenu);\n    };\n    const handleLangChange = (lang)=>{\n        i18n.changeLanguage(lang);\n        setSelectedLang(lang);\n        setShowLangMenu(false);\n    };\n    const pillTabs = [\n        {\n            text: t(\"home\"),\n            href: \"/\"\n        },\n        {\n            text: t(\"services\"),\n            href: \"/services\"\n        },\n        {\n            text: t(\"aboutUs\"),\n            href: \"/about-us\"\n        },\n        {\n            text: t(\"contactUs\"),\n            href: \"/contact-us\"\n        }\n    ];\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.NavBarContainer, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.Logo, {\n                children: [\n                    \"OpenGate\",\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.Span, {\n                        children: \"Hub\"\n                    }, void 0, false, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 47,\n                        columnNumber: 17\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                lineNumber: 46,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.NavLinks, {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.HighlightBar, {\n                        hoveredIndex: hoveredIndex,\n                        tabCount: pillTabs.length,\n                        animate: true\n                    }, hoveredIndex, false, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 50,\n                        columnNumber: 7\n                    }, undefined),\n                    pillTabs.map((tab, i)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"li\", {\n                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.NavLink, {\n                                onMouseEnter: ()=>setHoveredIndex(i),\n                                children: tab.text\n                            }, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 53,\n                                columnNumber: 15\n                            }, undefined)\n                        }, tab.text, false, {\n                            fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                            lineNumber: 52,\n                            columnNumber: 11\n                        }, undefined))\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                lineNumber: 49,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenuContainer, {\n                        onClick: toggleLangMenu,\n                        children: [\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.WorldIcon, {}, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 63,\n                                columnNumber: 11\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.StyledLangText, {\n                                children: selectedLang === \"en\" ? t(\"english\") : t(\"spanish\")\n                            }, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 64,\n                                columnNumber: 11\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.ArrowIcon, {\n                                open: showLangMenu\n                            }, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 67,\n                                columnNumber: 11\n                            }, undefined)\n                        ]\n                    }, void 0, true, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 62,\n                        columnNumber: 9\n                    }, undefined),\n                    showLangMenu && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenu, {\n                        isOpen: showLangMenu,\n                        children: selectedLang === \"en\" ? /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenuItem, {\n                            onClick: ()=>handleLangChange(\"es\"),\n                            children: t(\"spanish\")\n                        }, void 0, false, {\n                            fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                            lineNumber: 72,\n                            columnNumber: 15\n                        }, undefined) : /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenuItem, {\n                            onClick: ()=>handleLangChange(\"en\"),\n                            children: t(\"english\")\n                        }, void 0, false, {\n                            fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                            lineNumber: 76,\n                            columnNumber: 15\n                        }, undefined)\n                    }, void 0, false, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 70,\n                        columnNumber: 11\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                lineNumber: 61,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n        lineNumber: 45,\n        columnNumber: 5\n    }, undefined);\n};\n_s(NavBarDesktop, \"kRZcIb4TL6oZSnCIuPFfrAOzcj4=\", false, function() {\n    return [\n        react_i18next__WEBPACK_IMPORTED_MODULE_4__.useTranslation\n    ];\n});\n_c = NavBarDesktop;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NavBarDesktop); // import React, { useState } from \"react\";\n // import {\n //   Logo,\n //   Span,\n //   NavBarContainer,\n //   NavLink,\n //   NavLinks,\n //   LangMenuContainer,\n //   LangMenu,\n //   LangMenuItem,\n //   WorldIcon,\n //   StyledLangText,\n //   ArrowIcon,\n // } from \"./NavBarDesktop.styles\";\n // import { MagicTabSelect } from \"react-magic-motion\";\n // import { useTranslation } from \"react-i18next\";\n // const NavBar = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {\n //   const { t, i18n } = useTranslation();\n //   const [showLangMenu, setShowLangMenu] = useState(false);\n //   const [hoveredIndex, setHoveredIndex] = useState(0);\n //   const [selectedLang, setSelectedLang] = useState(\"en\");\n //   const handleScroll = (ref) => {\n //     ref.current.scrollIntoView({ behavior: \"smooth\", block: \"start\" });\n //   };\n //   const toggleLangMenu = () => {\n //     setShowLangMenu(!showLangMenu);\n //   };\n //   const handleLangChange = (lang) => {\n //     i18n.changeLanguage(lang);\n //     setSelectedLang(lang);\n //     setShowLangMenu(false);\n //   };\n //   const pillTabs = [\n //     { text: t(\"home\"), ref: \"homeRef\", href: \"#home\" },\n //     { text: t(\"services\"), ref: \"servicesRef\", href: \"#services\" },\n //     { text: t(\"aboutUs\"), ref: \"aboutUsRef\", href: \"#about-us\" },\n //     { text: t(\"contactUs\"), ref: \"contactUsRef\", href: \"#contact-us\" },\n //   ];\n //   const tabsComponents = pillTabs.map((tab, i) => (\n //     <li key={tab.text}>\n //       <NavLink\n //         href={tab.href}\n //         onMouseEnter={() => setHoveredIndex(i)}\n //         onClick={(e) => {\n //           e.preventDefault();\n //           handleScroll(\n //             tab.ref === \"homeRef\"\n //               ? homeRef\n //               : tab.ref === \"aboutUsRef\"\n //               ? aboutUsRef\n //               : tab.ref === \"servicesRef\"\n //               ? servicesRef\n //               : contactUsRef\n //           );\n //         }}\n //       >\n //         {hoveredIndex === i && (\n //           <MagicTabSelect\n //             id=\"pillTabs\"\n //             transition={{ type: \"spring\", bounce: 0.35 }}\n //           >\n //             <span\n //               style={{\n //                 borderRadius: \"999px\",\n //                 position: \"absolute\",\n //                 top: \"-5px\",\n //                 left: \"-30px\",\n //                 right: \"-30px\",\n //                 bottom: \"-5px\",\n //                 zIndex: -1,\n //                 backgroundColor: \"rgba(21, 62, 108, 0.84)\",\n //               }}\n //             />\n //           </MagicTabSelect>\n //         )}\n //        {t(tab.text)}\n //       </NavLink>\n //     </li>\n //   ));\n //   return (\n //     <NavBarContainer>\n //       <Logo>\n //         OpenGate<Span>Hub</Span>\n //       </Logo>\n //       <NavLinks>{tabsComponents}</NavLinks>\n //       <div>\n //         <LangMenuContainer onClick={toggleLangMenu}>\n //           <WorldIcon />\n //           <StyledLangText>\n //           {selectedLang === \"en\" ? t(\"english\") : t(\"spanish\")}\n //           </StyledLangText>\n //           <ArrowIcon open={showLangMenu} />\n //         </LangMenuContainer>\n //         {showLangMenu && (\n //           <LangMenu isOpen={showLangMenu}>\n //             {selectedLang === \"en\" ? (\n //               <LangMenuItem onClick={() => handleLangChange(\"es\")}>\n //                 {t(\"spanish\")}\n //               </LangMenuItem>\n //             ) : (\n //               <LangMenuItem onClick={() => handleLangChange(\"en\")}>\n //                 {t(\"english\")}\n //               </LangMenuItem>\n //             )}\n //           </LangMenu>\n //         )}\n //       </div>\n //     </NavBarContainer>\n //   );\n // };\n // export default NavBar;\nvar _c;\n$RefreshReg$(_c, \"NavBarDesktop\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5qc3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBd0M7QUFDWCxDQUFDLHlCQUF5QjtBQWN2QjtBQUNlO0FBRS9DLE1BQU1nQixnQkFBZ0I7O0lBQ3BCLE1BQU0sRUFBRUMsQ0FBQyxFQUFFQyxJQUFJLEVBQUUsR0FBR0gsNkRBQWNBO0lBQ2xDLE1BQU0sQ0FBQ0ksY0FBY0MsZ0JBQWdCLEdBQUduQiwrQ0FBUUEsQ0FBQztJQUNqRCxNQUFNLENBQUNvQixjQUFjQyxnQkFBZ0IsR0FBR3JCLCtDQUFRQSxDQUFDO0lBQ2pELE1BQU0sQ0FBQ3NCLGNBQWNDLGdCQUFnQixHQUFHdkIsK0NBQVFBLENBQUM7SUFDakQsTUFBTSxDQUFDd0IsYUFBYUMsZUFBZSxHQUFHekIsK0NBQVFBLENBQUM7SUFHL0MsTUFBTTBCLGlCQUFpQjtRQUNyQlAsZ0JBQWdCLENBQUNEO0lBQ25CO0lBRUEsTUFBTVMsbUJBQW1CLENBQUNDO1FBQ3hCWCxLQUFLWSxjQUFjLENBQUNEO1FBQ3BCTCxnQkFBZ0JLO1FBQ2hCVCxnQkFBZ0I7SUFDbEI7SUFFQSxNQUFNVyxXQUFXO1FBQ2Y7WUFBRUMsTUFBTWYsRUFBRTtZQUFTZ0IsTUFBTTtRQUFJO1FBQzdCO1lBQUVELE1BQU1mLEVBQUU7WUFBYWdCLE1BQU07UUFBWTtRQUN6QztZQUFFRCxNQUFNZixFQUFFO1lBQVlnQixNQUFNO1FBQVk7UUFDeEM7WUFBRUQsTUFBTWYsRUFBRTtZQUFjZ0IsTUFBTTtRQUFjO0tBQzdDO0lBRUQscUJBQ0UsOERBQUM1QixrRUFBZUE7OzBCQUNkLDhEQUFDRix1REFBSUE7O29CQUFDO2tDQUNJLDhEQUFDQyx1REFBSUE7a0NBQUM7Ozs7Ozs7Ozs7OzswQkFFaEIsOERBQUNHLDJEQUFRQTs7a0NBQ1QsOERBQUNNLCtEQUFZQTt3QkFBQ1EsY0FBY0E7d0JBQWNhLFVBQVVILFNBQVNJLE1BQU07d0JBQXlCQyxTQUFTO3VCQUF4QmY7Ozs7O29C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LGlDQUFpQztDQUNqQyxnQ0FBZ0M7Q0FDaEMsb0JBQW9CO0NBQ3BCLHNFQUFzRTtDQUN0RSxpQ0FBaUM7Q0FDakMsZ0NBQWdDO0NBQ2hDLGlCQUFpQjtDQUNqQix3QkFBd0I7Q0FDeEIsYUFBYTtDQUNiLGVBQWU7Q0FDZix5QkFBeUI7Q0FDekIsT0FBTztDQUNQLEtBQUs7Q0FFTCx5QkFBeUIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYWMvRGVza3RvcC9PR0gvb2doTGFuZGluZy9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgTGluayBmcm9tIFwibmV4dC9saW5rXCI7IC8vIFVzYW1vcyBMaW5rIGRlIE5leHQuanNcbmltcG9ydCB7XG4gIExvZ28sXG4gIFNwYW4sXG4gIE5hdkJhckNvbnRhaW5lcixcbiAgTmF2TGluayxcbiAgTmF2TGlua3MsXG4gIExhbmdNZW51Q29udGFpbmVyLFxuICBMYW5nTWVudSxcbiAgTGFuZ01lbnVJdGVtLFxuICBXb3JsZEljb24sXG4gIFN0eWxlZExhbmdUZXh0LFxuICBIaWdobGlnaHRCYXIsXG4gIEFycm93SWNvbixcbn0gZnJvbSBcIi4vTmF2QmFyRGVza3RvcC5zdHlsZXNcIjtcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSBcInJlYWN0LWkxOG5leHRcIjtcblxuY29uc3QgTmF2QmFyRGVza3RvcCA9ICgpID0+IHtcbiAgY29uc3QgeyB0LCBpMThuIH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd0xhbmdNZW51LCBzZXRTaG93TGFuZ01lbnVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaG92ZXJlZEluZGV4LCBzZXRIb3ZlcmVkSW5kZXhdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtzZWxlY3RlZExhbmcsIHNldFNlbGVjdGVkTGFuZ10gPSB1c2VTdGF0ZShcImVuXCIpO1xuICBjb25zdCBbaXNBbmltYXRpbmcsIHNldElzQW5pbWF0aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTsgXG5cblxuICBjb25zdCB0b2dnbGVMYW5nTWVudSA9ICgpID0+IHtcbiAgICBzZXRTaG93TGFuZ01lbnUoIXNob3dMYW5nTWVudSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlTGFuZ0NoYW5nZSA9IChsYW5nKSA9PiB7XG4gICAgaTE4bi5jaGFuZ2VMYW5ndWFnZShsYW5nKTtcbiAgICBzZXRTZWxlY3RlZExhbmcobGFuZyk7XG4gICAgc2V0U2hvd0xhbmdNZW51KGZhbHNlKTtcbiAgfTtcblxuICBjb25zdCBwaWxsVGFicyA9IFtcbiAgICB7IHRleHQ6IHQoXCJob21lXCIpLCBocmVmOiBcIi9cIiB9LFxuICAgIHsgdGV4dDogdChcInNlcnZpY2VzXCIpLCBocmVmOiBcIi9zZXJ2aWNlc1wiIH0sXG4gICAgeyB0ZXh0OiB0KFwiYWJvdXRVc1wiKSwgaHJlZjogXCIvYWJvdXQtdXNcIiB9LFxuICAgIHsgdGV4dDogdChcImNvbnRhY3RVc1wiKSwgaHJlZjogXCIvY29udGFjdC11c1wiIH0sXG4gIF07XG5cbiAgcmV0dXJuIChcbiAgICA8TmF2QmFyQ29udGFpbmVyPlxuICAgICAgPExvZ28+XG4gICAgICAgIE9wZW5HYXRlPFNwYW4+SHViPC9TcGFuPlxuICAgICAgPC9Mb2dvPlxuICAgICAgPE5hdkxpbmtzPlxuICAgICAgPEhpZ2hsaWdodEJhciBob3ZlcmVkSW5kZXg9e2hvdmVyZWRJbmRleH0gdGFiQ291bnQ9e3BpbGxUYWJzLmxlbmd0aH0gICAga2V5PXtob3ZlcmVkSW5kZXh9ICBhbmltYXRlPXt0cnVlfSAvPlxuICAgICAgICB7cGlsbFRhYnMubWFwKCh0YWIsIGkpID0+IChcbiAgICAgICAgICA8bGkga2V5PXt0YWIudGV4dH0+XG4gICAgICAgICAgICAgIDxOYXZMaW5rXG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBzZXRIb3ZlcmVkSW5kZXgoaSl9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7dGFiLnRleHR9XG4gICAgICAgICAgICAgIDwvTmF2TGluaz5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICApKX1cbiAgICAgIDwvTmF2TGlua3M+XG4gICAgICA8ZGl2PlxuICAgICAgICA8TGFuZ01lbnVDb250YWluZXIgb25DbGljaz17dG9nZ2xlTGFuZ01lbnV9PlxuICAgICAgICAgIDxXb3JsZEljb24gLz5cbiAgICAgICAgICA8U3R5bGVkTGFuZ1RleHQ+XG4gICAgICAgICAgICB7c2VsZWN0ZWRMYW5nID09PSBcImVuXCIgPyB0KFwiZW5nbGlzaFwiKSA6IHQoXCJzcGFuaXNoXCIpfVxuICAgICAgICAgIDwvU3R5bGVkTGFuZ1RleHQ+XG4gICAgICAgICAgPEFycm93SWNvbiBvcGVuPXtzaG93TGFuZ01lbnV9IC8+XG4gICAgICAgIDwvTGFuZ01lbnVDb250YWluZXI+XG4gICAgICAgIHtzaG93TGFuZ01lbnUgJiYgKFxuICAgICAgICAgIDxMYW5nTWVudSBpc09wZW49e3Nob3dMYW5nTWVudX0+XG4gICAgICAgICAgICB7c2VsZWN0ZWRMYW5nID09PSBcImVuXCIgPyAoXG4gICAgICAgICAgICAgIDxMYW5nTWVudUl0ZW0gb25DbGljaz17KCkgPT4gaGFuZGxlTGFuZ0NoYW5nZShcImVzXCIpfT5cbiAgICAgICAgICAgICAgICB7dChcInNwYW5pc2hcIil9XG4gICAgICAgICAgICAgIDwvTGFuZ01lbnVJdGVtPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPExhbmdNZW51SXRlbSBvbkNsaWNrPXsoKSA9PiBoYW5kbGVMYW5nQ2hhbmdlKFwiZW5cIil9PlxuICAgICAgICAgICAgICAgIHt0KFwiZW5nbGlzaFwiKX1cbiAgICAgICAgICAgICAgPC9MYW5nTWVudUl0ZW0+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvTGFuZ01lbnU+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8L05hdkJhckNvbnRhaW5lcj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5hdkJhckRlc2t0b3A7XG5cblxuXG5cbi8vIGltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuLy8gaW1wb3J0IHtcbi8vICAgTG9nbyxcbi8vICAgU3Bhbixcbi8vICAgTmF2QmFyQ29udGFpbmVyLFxuLy8gICBOYXZMaW5rLFxuLy8gICBOYXZMaW5rcyxcbi8vICAgTGFuZ01lbnVDb250YWluZXIsXG4vLyAgIExhbmdNZW51LFxuLy8gICBMYW5nTWVudUl0ZW0sXG4vLyAgIFdvcmxkSWNvbixcbi8vICAgU3R5bGVkTGFuZ1RleHQsXG4vLyAgIEFycm93SWNvbixcbi8vIH0gZnJvbSBcIi4vTmF2QmFyRGVza3RvcC5zdHlsZXNcIjtcbi8vIGltcG9ydCB7IE1hZ2ljVGFiU2VsZWN0IH0gZnJvbSBcInJlYWN0LW1hZ2ljLW1vdGlvblwiO1xuLy8gaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tIFwicmVhY3QtaTE4bmV4dFwiO1xuXG4vLyBjb25zdCBOYXZCYXIgPSAoeyBob21lUmVmLCBhYm91dFVzUmVmLCBzZXJ2aWNlc1JlZiwgY29udGFjdFVzUmVmIH0pID0+IHtcbi8vICAgY29uc3QgeyB0LCBpMThuIH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuLy8gICBjb25zdCBbc2hvd0xhbmdNZW51LCBzZXRTaG93TGFuZ01lbnVdID0gdXNlU3RhdGUoZmFsc2UpO1xuLy8gICBjb25zdCBbaG92ZXJlZEluZGV4LCBzZXRIb3ZlcmVkSW5kZXhdID0gdXNlU3RhdGUoMCk7XG4vLyAgIGNvbnN0IFtzZWxlY3RlZExhbmcsIHNldFNlbGVjdGVkTGFuZ10gPSB1c2VTdGF0ZShcImVuXCIpO1xuXG4vLyAgIGNvbnN0IGhhbmRsZVNjcm9sbCA9IChyZWYpID0+IHtcbi8vICAgICByZWYuY3VycmVudC5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiBcInNtb290aFwiLCBibG9jazogXCJzdGFydFwiIH0pO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IHRvZ2dsZUxhbmdNZW51ID0gKCkgPT4ge1xuLy8gICAgIHNldFNob3dMYW5nTWVudSghc2hvd0xhbmdNZW51KTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBoYW5kbGVMYW5nQ2hhbmdlID0gKGxhbmcpID0+IHtcbi8vICAgICBpMThuLmNoYW5nZUxhbmd1YWdlKGxhbmcpO1xuLy8gICAgIHNldFNlbGVjdGVkTGFuZyhsYW5nKTtcbi8vICAgICBzZXRTaG93TGFuZ01lbnUoZmFsc2UpO1xuLy8gICB9O1xuICBcbi8vICAgY29uc3QgcGlsbFRhYnMgPSBbXG4vLyAgICAgeyB0ZXh0OiB0KFwiaG9tZVwiKSwgcmVmOiBcImhvbWVSZWZcIiwgaHJlZjogXCIjaG9tZVwiIH0sXG4vLyAgICAgeyB0ZXh0OiB0KFwic2VydmljZXNcIiksIHJlZjogXCJzZXJ2aWNlc1JlZlwiLCBocmVmOiBcIiNzZXJ2aWNlc1wiIH0sXG4vLyAgICAgeyB0ZXh0OiB0KFwiYWJvdXRVc1wiKSwgcmVmOiBcImFib3V0VXNSZWZcIiwgaHJlZjogXCIjYWJvdXQtdXNcIiB9LFxuLy8gICAgIHsgdGV4dDogdChcImNvbnRhY3RVc1wiKSwgcmVmOiBcImNvbnRhY3RVc1JlZlwiLCBocmVmOiBcIiNjb250YWN0LXVzXCIgfSxcbi8vICAgXTtcblxuLy8gICBjb25zdCB0YWJzQ29tcG9uZW50cyA9IHBpbGxUYWJzLm1hcCgodGFiLCBpKSA9PiAoXG4vLyAgICAgPGxpIGtleT17dGFiLnRleHR9PlxuLy8gICAgICAgPE5hdkxpbmtcbi8vICAgICAgICAgaHJlZj17dGFiLmhyZWZ9XG4vLyAgICAgICAgIG9uTW91c2VFbnRlcj17KCkgPT4gc2V0SG92ZXJlZEluZGV4KGkpfVxuLy8gICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuLy8gICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbi8vICAgICAgICAgICBoYW5kbGVTY3JvbGwoXG4vLyAgICAgICAgICAgICB0YWIucmVmID09PSBcImhvbWVSZWZcIlxuLy8gICAgICAgICAgICAgICA/IGhvbWVSZWZcbi8vICAgICAgICAgICAgICAgOiB0YWIucmVmID09PSBcImFib3V0VXNSZWZcIlxuLy8gICAgICAgICAgICAgICA/IGFib3V0VXNSZWZcbi8vICAgICAgICAgICAgICAgOiB0YWIucmVmID09PSBcInNlcnZpY2VzUmVmXCJcbi8vICAgICAgICAgICAgICAgPyBzZXJ2aWNlc1JlZlxuLy8gICAgICAgICAgICAgICA6IGNvbnRhY3RVc1JlZlxuLy8gICAgICAgICAgICk7XG4vLyAgICAgICAgIH19XG4vLyAgICAgICA+XG4vLyAgICAgICAgIHtob3ZlcmVkSW5kZXggPT09IGkgJiYgKFxuLy8gICAgICAgICAgIDxNYWdpY1RhYlNlbGVjdFxuLy8gICAgICAgICAgICAgaWQ9XCJwaWxsVGFic1wiXG4vLyAgICAgICAgICAgICB0cmFuc2l0aW9uPXt7IHR5cGU6IFwic3ByaW5nXCIsIGJvdW5jZTogMC4zNSB9fVxuLy8gICAgICAgICAgID5cbi8vICAgICAgICAgICAgIDxzcGFuXG4vLyAgICAgICAgICAgICAgIHN0eWxlPXt7XG4vLyAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjk5OXB4XCIsXG4vLyAgICAgICAgICAgICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcbi8vICAgICAgICAgICAgICAgICB0b3A6IFwiLTVweFwiLFxuLy8gICAgICAgICAgICAgICAgIGxlZnQ6IFwiLTMwcHhcIixcbi8vICAgICAgICAgICAgICAgICByaWdodDogXCItMzBweFwiLFxuLy8gICAgICAgICAgICAgICAgIGJvdHRvbTogXCItNXB4XCIsXG4vLyAgICAgICAgICAgICAgICAgekluZGV4OiAtMSxcbi8vICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwicmdiYSgyMSwgNjIsIDEwOCwgMC44NClcIixcbi8vICAgICAgICAgICAgICAgfX1cbi8vICAgICAgICAgICAgIC8+XG4vLyAgICAgICAgICAgPC9NYWdpY1RhYlNlbGVjdD5cbi8vICAgICAgICAgKX1cbi8vICAgICAgICB7dCh0YWIudGV4dCl9XG4vLyAgICAgICA8L05hdkxpbms+XG4vLyAgICAgPC9saT5cbi8vICAgKSk7XG5cbi8vICAgcmV0dXJuIChcbi8vICAgICA8TmF2QmFyQ29udGFpbmVyPlxuLy8gICAgICAgPExvZ28+XG4vLyAgICAgICAgIE9wZW5HYXRlPFNwYW4+SHViPC9TcGFuPlxuLy8gICAgICAgPC9Mb2dvPlxuLy8gICAgICAgPE5hdkxpbmtzPnt0YWJzQ29tcG9uZW50c308L05hdkxpbmtzPlxuLy8gICAgICAgPGRpdj5cbi8vICAgICAgICAgPExhbmdNZW51Q29udGFpbmVyIG9uQ2xpY2s9e3RvZ2dsZUxhbmdNZW51fT5cbi8vICAgICAgICAgICA8V29ybGRJY29uIC8+XG4vLyAgICAgICAgICAgPFN0eWxlZExhbmdUZXh0PlxuLy8gICAgICAgICAgIHtzZWxlY3RlZExhbmcgPT09IFwiZW5cIiA/IHQoXCJlbmdsaXNoXCIpIDogdChcInNwYW5pc2hcIil9XG4vLyAgICAgICAgICAgPC9TdHlsZWRMYW5nVGV4dD5cbi8vICAgICAgICAgICA8QXJyb3dJY29uIG9wZW49e3Nob3dMYW5nTWVudX0gLz5cbi8vICAgICAgICAgPC9MYW5nTWVudUNvbnRhaW5lcj5cbi8vICAgICAgICAge3Nob3dMYW5nTWVudSAmJiAoXG4vLyAgICAgICAgICAgPExhbmdNZW51IGlzT3Blbj17c2hvd0xhbmdNZW51fT5cbi8vICAgICAgICAgICAgIHtzZWxlY3RlZExhbmcgPT09IFwiZW5cIiA/IChcbi8vICAgICAgICAgICAgICAgPExhbmdNZW51SXRlbSBvbkNsaWNrPXsoKSA9PiBoYW5kbGVMYW5nQ2hhbmdlKFwiZXNcIil9PlxuLy8gICAgICAgICAgICAgICAgIHt0KFwic3BhbmlzaFwiKX1cbi8vICAgICAgICAgICAgICAgPC9MYW5nTWVudUl0ZW0+XG4vLyAgICAgICAgICAgICApIDogKFxuLy8gICAgICAgICAgICAgICA8TGFuZ01lbnVJdGVtIG9uQ2xpY2s9eygpID0+IGhhbmRsZUxhbmdDaGFuZ2UoXCJlblwiKX0+XG4vLyAgICAgICAgICAgICAgICAge3QoXCJlbmdsaXNoXCIpfVxuLy8gICAgICAgICAgICAgICA8L0xhbmdNZW51SXRlbT5cbi8vICAgICAgICAgICAgICl9XG4vLyAgICAgICAgICAgPC9MYW5nTWVudT5cbi8vICAgICAgICAgKX1cbi8vICAgICAgIDwvZGl2PlxuLy8gICAgIDwvTmF2QmFyQ29udGFpbmVyPlxuLy8gICApO1xuLy8gfTtcblxuLy8gZXhwb3J0IGRlZmF1bHQgTmF2QmFyO1xuIl0sIm5hbWVzIjpbIlJlYWN0IiwidXNlU3RhdGUiLCJMaW5rIiwiTG9nbyIsIlNwYW4iLCJOYXZCYXJDb250YWluZXIiLCJOYXZMaW5rIiwiTmF2TGlua3MiLCJMYW5nTWVudUNvbnRhaW5lciIsIkxhbmdNZW51IiwiTGFuZ01lbnVJdGVtIiwiV29ybGRJY29uIiwiU3R5bGVkTGFuZ1RleHQiLCJIaWdobGlnaHRCYXIiLCJBcnJvd0ljb24iLCJ1c2VUcmFuc2xhdGlvbiIsIk5hdkJhckRlc2t0b3AiLCJ0IiwiaTE4biIsInNob3dMYW5nTWVudSIsInNldFNob3dMYW5nTWVudSIsImhvdmVyZWRJbmRleCIsInNldEhvdmVyZWRJbmRleCIsInNlbGVjdGVkTGFuZyIsInNldFNlbGVjdGVkTGFuZyIsImlzQW5pbWF0aW5nIiwic2V0SXNBbmltYXRpbmciLCJ0b2dnbGVMYW5nTWVudSIsImhhbmRsZUxhbmdDaGFuZ2UiLCJsYW5nIiwiY2hhbmdlTGFuZ3VhZ2UiLCJwaWxsVGFicyIsInRleHQiLCJocmVmIiwidGFiQ291bnQiLCJsZW5ndGgiLCJhbmltYXRlIiwibWFwIiwidGFiIiwiaSIsImxpIiwib25Nb3VzZUVudGVyIiwiZGl2Iiwib25DbGljayIsIm9wZW4iLCJpc09wZW4iXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/components/NavBar/NavBarDesktop.jsx\n"));

/***/ })

});