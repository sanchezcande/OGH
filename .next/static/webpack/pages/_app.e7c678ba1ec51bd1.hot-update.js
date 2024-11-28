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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"./node_modules/react/jsx-dev-runtime.js\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/link */ \"./node_modules/next/link.js\");\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./NavBarDesktop.styles */ \"./src/components/NavBar/NavBarDesktop.styles.js\");\n/* harmony import */ var react_i18next__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-i18next */ \"./node_modules/react-i18next/dist/es/index.js\");\n\nvar _s = $RefreshSig$();\n\n // Usamos Link de Next.js\n\n\nconst NavBarDesktop = ()=>{\n    _s();\n    const { t, i18n } = (0,react_i18next__WEBPACK_IMPORTED_MODULE_4__.useTranslation)();\n    const [showLangMenu, setShowLangMenu] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const [hoveredIndex, setHoveredIndex] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(0);\n    const [selectedLang, setSelectedLang] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"en\");\n    const toggleLangMenu = ()=>{\n        setShowLangMenu(!showLangMenu);\n    };\n    const handleLangChange = (lang)=>{\n        i18n.changeLanguage(lang);\n        setSelectedLang(lang);\n        setShowLangMenu(false);\n    };\n    const pillTabs = [\n        {\n            text: t(\"home\"),\n            href: \"/\"\n        },\n        {\n            text: t(\"services\"),\n            href: \"/services\"\n        },\n        {\n            text: t(\"aboutUs\"),\n            href: \"/about-us\"\n        },\n        {\n            text: t(\"contactUs\"),\n            href: \"/contact-us\"\n        }\n    ];\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.NavBarContainer, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.Logo, {\n                children: [\n                    \"OpenGate\",\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.Span, {\n                        children: \"Hub\"\n                    }, void 0, false, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 45,\n                        columnNumber: 17\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                lineNumber: 44,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.NavLinks, {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.HighlightBar, {\n                        hoveredIndex: hoveredIndex,\n                        tabCount: pillTabs.length,\n                        animate: true\n                    }, hoveredIndex, false, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 48,\n                        columnNumber: 7\n                    }, undefined),\n                    pillTabs.map((tab, i)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"li\", {\n                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.NavLink, {\n                                onMouseEnter: ()=>setHoveredIndex(i),\n                                children: tab.text\n                            }, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 51,\n                                columnNumber: 15\n                            }, undefined)\n                        }, tab.text, false, {\n                            fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                            lineNumber: 50,\n                            columnNumber: 11\n                        }, undefined))\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                lineNumber: 47,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenuContainer, {\n                        onClick: toggleLangMenu,\n                        children: [\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.WorldIcon, {}, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 61,\n                                columnNumber: 11\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.StyledLangText, {\n                                children: selectedLang === \"en\" ? t(\"english\") : t(\"spanish\")\n                            }, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 62,\n                                columnNumber: 11\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.ArrowIcon, {\n                                open: showLangMenu\n                            }, void 0, false, {\n                                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                                lineNumber: 65,\n                                columnNumber: 11\n                            }, undefined)\n                        ]\n                    }, void 0, true, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 60,\n                        columnNumber: 9\n                    }, undefined),\n                    showLangMenu && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenu, {\n                        isOpen: showLangMenu,\n                        children: selectedLang === \"en\" ? /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenuItem, {\n                            onClick: ()=>handleLangChange(\"es\"),\n                            children: t(\"spanish\")\n                        }, void 0, false, {\n                            fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                            lineNumber: 70,\n                            columnNumber: 15\n                        }, undefined) : /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_NavBarDesktop_styles__WEBPACK_IMPORTED_MODULE_3__.LangMenuItem, {\n                            onClick: ()=>handleLangChange(\"en\"),\n                            children: t(\"english\")\n                        }, void 0, false, {\n                            fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                            lineNumber: 74,\n                            columnNumber: 15\n                        }, undefined)\n                    }, void 0, false, {\n                        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                        lineNumber: 68,\n                        columnNumber: 11\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n                lineNumber: 59,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/mac/Desktop/OGH/oghLanding/src/components/NavBar/NavBarDesktop.jsx\",\n        lineNumber: 43,\n        columnNumber: 5\n    }, undefined);\n};\n_s(NavBarDesktop, \"9kXHJmV96MMhBLS3KAZ2TVLgw2w=\", false, function() {\n    return [\n        react_i18next__WEBPACK_IMPORTED_MODULE_4__.useTranslation\n    ];\n});\n_c = NavBarDesktop;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NavBarDesktop); // import React, { useState } from \"react\";\n // import {\n //   Logo,\n //   Span,\n //   NavBarContainer,\n //   NavLink,\n //   NavLinks,\n //   LangMenuContainer,\n //   LangMenu,\n //   LangMenuItem,\n //   WorldIcon,\n //   StyledLangText,\n //   ArrowIcon,\n // } from \"./NavBarDesktop.styles\";\n // import { MagicTabSelect } from \"react-magic-motion\";\n // import { useTranslation } from \"react-i18next\";\n // const NavBar = ({ homeRef, aboutUsRef, servicesRef, contactUsRef }) => {\n //   const { t, i18n } = useTranslation();\n //   const [showLangMenu, setShowLangMenu] = useState(false);\n //   const [hoveredIndex, setHoveredIndex] = useState(0);\n //   const [selectedLang, setSelectedLang] = useState(\"en\");\n //   const handleScroll = (ref) => {\n //     ref.current.scrollIntoView({ behavior: \"smooth\", block: \"start\" });\n //   };\n //   const toggleLangMenu = () => {\n //     setShowLangMenu(!showLangMenu);\n //   };\n //   const handleLangChange = (lang) => {\n //     i18n.changeLanguage(lang);\n //     setSelectedLang(lang);\n //     setShowLangMenu(false);\n //   };\n //   const pillTabs = [\n //     { text: t(\"home\"), ref: \"homeRef\", href: \"#home\" },\n //     { text: t(\"services\"), ref: \"servicesRef\", href: \"#services\" },\n //     { text: t(\"aboutUs\"), ref: \"aboutUsRef\", href: \"#about-us\" },\n //     { text: t(\"contactUs\"), ref: \"contactUsRef\", href: \"#contact-us\" },\n //   ];\n //   const tabsComponents = pillTabs.map((tab, i) => (\n //     <li key={tab.text}>\n //       <NavLink\n //         href={tab.href}\n //         onMouseEnter={() => setHoveredIndex(i)}\n //         onClick={(e) => {\n //           e.preventDefault();\n //           handleScroll(\n //             tab.ref === \"homeRef\"\n //               ? homeRef\n //               : tab.ref === \"aboutUsRef\"\n //               ? aboutUsRef\n //               : tab.ref === \"servicesRef\"\n //               ? servicesRef\n //               : contactUsRef\n //           );\n //         }}\n //       >\n //         {hoveredIndex === i && (\n //           <MagicTabSelect\n //             id=\"pillTabs\"\n //             transition={{ type: \"spring\", bounce: 0.35 }}\n //           >\n //             <span\n //               style={{\n //                 borderRadius: \"999px\",\n //                 position: \"absolute\",\n //                 top: \"-5px\",\n //                 left: \"-30px\",\n //                 right: \"-30px\",\n //                 bottom: \"-5px\",\n //                 zIndex: -1,\n //                 backgroundColor: \"rgba(21, 62, 108, 0.84)\",\n //               }}\n //             />\n //           </MagicTabSelect>\n //         )}\n //        {t(tab.text)}\n //       </NavLink>\n //     </li>\n //   ));\n //   return (\n //     <NavBarContainer>\n //       <Logo>\n //         OpenGate<Span>Hub</Span>\n //       </Logo>\n //       <NavLinks>{tabsComponents}</NavLinks>\n //       <div>\n //         <LangMenuContainer onClick={toggleLangMenu}>\n //           <WorldIcon />\n //           <StyledLangText>\n //           {selectedLang === \"en\" ? t(\"english\") : t(\"spanish\")}\n //           </StyledLangText>\n //           <ArrowIcon open={showLangMenu} />\n //         </LangMenuContainer>\n //         {showLangMenu && (\n //           <LangMenu isOpen={showLangMenu}>\n //             {selectedLang === \"en\" ? (\n //               <LangMenuItem onClick={() => handleLangChange(\"es\")}>\n //                 {t(\"spanish\")}\n //               </LangMenuItem>\n //             ) : (\n //               <LangMenuItem onClick={() => handleLangChange(\"en\")}>\n //                 {t(\"english\")}\n //               </LangMenuItem>\n //             )}\n //           </LangMenu>\n //         )}\n //       </div>\n //     </NavBarContainer>\n //   );\n // };\n // export default NavBar;\nvar _c;\n$RefreshReg$(_c, \"NavBarDesktop\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5qc3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBd0M7QUFDWCxDQUFDLHlCQUF5QjtBQWN2QjtBQUNlO0FBRS9DLE1BQU1nQixnQkFBZ0I7O0lBQ3BCLE1BQU0sRUFBRUMsQ0FBQyxFQUFFQyxJQUFJLEVBQUUsR0FBR0gsNkRBQWNBO0lBQ2xDLE1BQU0sQ0FBQ0ksY0FBY0MsZ0JBQWdCLEdBQUduQiwrQ0FBUUEsQ0FBQztJQUNqRCxNQUFNLENBQUNvQixjQUFjQyxnQkFBZ0IsR0FBR3JCLCtDQUFRQSxDQUFDO0lBQ2pELE1BQU0sQ0FBQ3NCLGNBQWNDLGdCQUFnQixHQUFHdkIsK0NBQVFBLENBQUM7SUFFakQsTUFBTXdCLGlCQUFpQjtRQUNyQkwsZ0JBQWdCLENBQUNEO0lBQ25CO0lBRUEsTUFBTU8sbUJBQW1CLENBQUNDO1FBQ3hCVCxLQUFLVSxjQUFjLENBQUNEO1FBQ3BCSCxnQkFBZ0JHO1FBQ2hCUCxnQkFBZ0I7SUFDbEI7SUFFQSxNQUFNUyxXQUFXO1FBQ2Y7WUFBRUMsTUFBTWIsRUFBRTtZQUFTYyxNQUFNO1FBQUk7UUFDN0I7WUFBRUQsTUFBTWIsRUFBRTtZQUFhYyxNQUFNO1FBQVk7UUFDekM7WUFBRUQsTUFBTWIsRUFBRTtZQUFZYyxNQUFNO1FBQVk7UUFDeEM7WUFBRUQsTUFBTWIsRUFBRTtZQUFjYyxNQUFNO1FBQWM7S0FDN0M7SUFFRCxxQkFDRSw4REFBQzFCLGtFQUFlQTs7MEJBQ2QsOERBQUNGLHVEQUFJQTs7b0JBQUM7a0NBQ0ksOERBQUNDLHVEQUFJQTtrQ0FBQzs7Ozs7Ozs7Ozs7OzBCQUVoQiw4REFBQ0csMkRBQVFBOztrQ0FDVCw4REFBQ00sK0RBQVlBO3dCQUFDUSxjQUFjQTt3QkFBY1csVUFBVUgsU0FBU0ksTUFBTTt3QkFBeUJDLFNBQVM7dUJBQXhCYjs7Ozs7b0JBQzFFUSxTQUFTTSxHQUFHLENBQUMsQ0FBQ0MsS0FBS0Msa0JBQ2xCLDhEQUFDQztzQ0FD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Q0FBaUM7Q0FDakMsZ0NBQWdDO0NBQ2hDLGlCQUFpQjtDQUNqQix3QkFBd0I7Q0FDeEIsYUFBYTtDQUNiLGVBQWU7Q0FDZix5QkFBeUI7Q0FDekIsT0FBTztDQUNQLEtBQUs7Q0FFTCx5QkFBeUIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYWMvRGVza3RvcC9PR0gvb2doTGFuZGluZy9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgTGluayBmcm9tIFwibmV4dC9saW5rXCI7IC8vIFVzYW1vcyBMaW5rIGRlIE5leHQuanNcbmltcG9ydCB7XG4gIExvZ28sXG4gIFNwYW4sXG4gIE5hdkJhckNvbnRhaW5lcixcbiAgTmF2TGluayxcbiAgTmF2TGlua3MsXG4gIExhbmdNZW51Q29udGFpbmVyLFxuICBMYW5nTWVudSxcbiAgTGFuZ01lbnVJdGVtLFxuICBXb3JsZEljb24sXG4gIFN0eWxlZExhbmdUZXh0LFxuICBIaWdobGlnaHRCYXIsXG4gIEFycm93SWNvbixcbn0gZnJvbSBcIi4vTmF2QmFyRGVza3RvcC5zdHlsZXNcIjtcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSBcInJlYWN0LWkxOG5leHRcIjtcblxuY29uc3QgTmF2QmFyRGVza3RvcCA9ICgpID0+IHtcbiAgY29uc3QgeyB0LCBpMThuIH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd0xhbmdNZW51LCBzZXRTaG93TGFuZ01lbnVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaG92ZXJlZEluZGV4LCBzZXRIb3ZlcmVkSW5kZXhdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IFtzZWxlY3RlZExhbmcsIHNldFNlbGVjdGVkTGFuZ10gPSB1c2VTdGF0ZShcImVuXCIpO1xuXG4gIGNvbnN0IHRvZ2dsZUxhbmdNZW51ID0gKCkgPT4ge1xuICAgIHNldFNob3dMYW5nTWVudSghc2hvd0xhbmdNZW51KTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVMYW5nQ2hhbmdlID0gKGxhbmcpID0+IHtcbiAgICBpMThuLmNoYW5nZUxhbmd1YWdlKGxhbmcpO1xuICAgIHNldFNlbGVjdGVkTGFuZyhsYW5nKTtcbiAgICBzZXRTaG93TGFuZ01lbnUoZmFsc2UpO1xuICB9O1xuXG4gIGNvbnN0IHBpbGxUYWJzID0gW1xuICAgIHsgdGV4dDogdChcImhvbWVcIiksIGhyZWY6IFwiL1wiIH0sXG4gICAgeyB0ZXh0OiB0KFwic2VydmljZXNcIiksIGhyZWY6IFwiL3NlcnZpY2VzXCIgfSxcbiAgICB7IHRleHQ6IHQoXCJhYm91dFVzXCIpLCBocmVmOiBcIi9hYm91dC11c1wiIH0sXG4gICAgeyB0ZXh0OiB0KFwiY29udGFjdFVzXCIpLCBocmVmOiBcIi9jb250YWN0LXVzXCIgfSxcbiAgXTtcblxuICByZXR1cm4gKFxuICAgIDxOYXZCYXJDb250YWluZXI+XG4gICAgICA8TG9nbz5cbiAgICAgICAgT3BlbkdhdGU8U3Bhbj5IdWI8L1NwYW4+XG4gICAgICA8L0xvZ28+XG4gICAgICA8TmF2TGlua3M+XG4gICAgICA8SGlnaGxpZ2h0QmFyIGhvdmVyZWRJbmRleD17aG92ZXJlZEluZGV4fSB0YWJDb3VudD17cGlsbFRhYnMubGVuZ3RofSAgICBrZXk9e2hvdmVyZWRJbmRleH0gIGFuaW1hdGU9e3RydWV9IC8+XG4gICAgICAgIHtwaWxsVGFicy5tYXAoKHRhYiwgaSkgPT4gKFxuICAgICAgICAgIDxsaSBrZXk9e3RhYi50ZXh0fT5cbiAgICAgICAgICAgICAgPE5hdkxpbmtcbiAgICAgICAgICAgICAgICBvbk1vdXNlRW50ZXI9eygpID0+IHNldEhvdmVyZWRJbmRleChpKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt0YWIudGV4dH1cbiAgICAgICAgICAgICAgPC9OYXZMaW5rPlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgICkpfVxuICAgICAgPC9OYXZMaW5rcz5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxMYW5nTWVudUNvbnRhaW5lciBvbkNsaWNrPXt0b2dnbGVMYW5nTWVudX0+XG4gICAgICAgICAgPFdvcmxkSWNvbiAvPlxuICAgICAgICAgIDxTdHlsZWRMYW5nVGV4dD5cbiAgICAgICAgICAgIHtzZWxlY3RlZExhbmcgPT09IFwiZW5cIiA/IHQoXCJlbmdsaXNoXCIpIDogdChcInNwYW5pc2hcIil9XG4gICAgICAgICAgPC9TdHlsZWRMYW5nVGV4dD5cbiAgICAgICAgICA8QXJyb3dJY29uIG9wZW49e3Nob3dMYW5nTWVudX0gLz5cbiAgICAgICAgPC9MYW5nTWVudUNvbnRhaW5lcj5cbiAgICAgICAge3Nob3dMYW5nTWVudSAmJiAoXG4gICAgICAgICAgPExhbmdNZW51IGlzT3Blbj17c2hvd0xhbmdNZW51fT5cbiAgICAgICAgICAgIHtzZWxlY3RlZExhbmcgPT09IFwiZW5cIiA/IChcbiAgICAgICAgICAgICAgPExhbmdNZW51SXRlbSBvbkNsaWNrPXsoKSA9PiBoYW5kbGVMYW5nQ2hhbmdlKFwiZXNcIil9PlxuICAgICAgICAgICAgICAgIHt0KFwic3BhbmlzaFwiKX1cbiAgICAgICAgICAgICAgPC9MYW5nTWVudUl0ZW0+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8TGFuZ01lbnVJdGVtIG9uQ2xpY2s9eygpID0+IGhhbmRsZUxhbmdDaGFuZ2UoXCJlblwiKX0+XG4gICAgICAgICAgICAgICAge3QoXCJlbmdsaXNoXCIpfVxuICAgICAgICAgICAgICA8L0xhbmdNZW51SXRlbT5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9MYW5nTWVudT5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvTmF2QmFyQ29udGFpbmVyPlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgTmF2QmFyRGVza3RvcDtcblxuXG5cblxuLy8gaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG4vLyBpbXBvcnQge1xuLy8gICBMb2dvLFxuLy8gICBTcGFuLFxuLy8gICBOYXZCYXJDb250YWluZXIsXG4vLyAgIE5hdkxpbmssXG4vLyAgIE5hdkxpbmtzLFxuLy8gICBMYW5nTWVudUNvbnRhaW5lcixcbi8vICAgTGFuZ01lbnUsXG4vLyAgIExhbmdNZW51SXRlbSxcbi8vICAgV29ybGRJY29uLFxuLy8gICBTdHlsZWRMYW5nVGV4dCxcbi8vICAgQXJyb3dJY29uLFxuLy8gfSBmcm9tIFwiLi9OYXZCYXJEZXNrdG9wLnN0eWxlc1wiO1xuLy8gaW1wb3J0IHsgTWFnaWNUYWJTZWxlY3QgfSBmcm9tIFwicmVhY3QtbWFnaWMtbW90aW9uXCI7XG4vLyBpbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gXCJyZWFjdC1pMThuZXh0XCI7XG5cbi8vIGNvbnN0IE5hdkJhciA9ICh7IGhvbWVSZWYsIGFib3V0VXNSZWYsIHNlcnZpY2VzUmVmLCBjb250YWN0VXNSZWYgfSkgPT4ge1xuLy8gICBjb25zdCB7IHQsIGkxOG4gfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4vLyAgIGNvbnN0IFtzaG93TGFuZ01lbnUsIHNldFNob3dMYW5nTWVudV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4vLyAgIGNvbnN0IFtob3ZlcmVkSW5kZXgsIHNldEhvdmVyZWRJbmRleF0gPSB1c2VTdGF0ZSgwKTtcbi8vICAgY29uc3QgW3NlbGVjdGVkTGFuZywgc2V0U2VsZWN0ZWRMYW5nXSA9IHVzZVN0YXRlKFwiZW5cIik7XG5cbi8vICAgY29uc3QgaGFuZGxlU2Nyb2xsID0gKHJlZikgPT4ge1xuLy8gICAgIHJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6IFwic21vb3RoXCIsIGJsb2NrOiBcInN0YXJ0XCIgfSk7XG4vLyAgIH07XG5cbi8vICAgY29uc3QgdG9nZ2xlTGFuZ01lbnUgPSAoKSA9PiB7XG4vLyAgICAgc2V0U2hvd0xhbmdNZW51KCFzaG93TGFuZ01lbnUpO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGhhbmRsZUxhbmdDaGFuZ2UgPSAobGFuZykgPT4ge1xuLy8gICAgIGkxOG4uY2hhbmdlTGFuZ3VhZ2UobGFuZyk7XG4vLyAgICAgc2V0U2VsZWN0ZWRMYW5nKGxhbmcpO1xuLy8gICAgIHNldFNob3dMYW5nTWVudShmYWxzZSk7XG4vLyAgIH07XG4gIFxuLy8gICBjb25zdCBwaWxsVGFicyA9IFtcbi8vICAgICB7IHRleHQ6IHQoXCJob21lXCIpLCByZWY6IFwiaG9tZVJlZlwiLCBocmVmOiBcIiNob21lXCIgfSxcbi8vICAgICB7IHRleHQ6IHQoXCJzZXJ2aWNlc1wiKSwgcmVmOiBcInNlcnZpY2VzUmVmXCIsIGhyZWY6IFwiI3NlcnZpY2VzXCIgfSxcbi8vICAgICB7IHRleHQ6IHQoXCJhYm91dFVzXCIpLCByZWY6IFwiYWJvdXRVc1JlZlwiLCBocmVmOiBcIiNhYm91dC11c1wiIH0sXG4vLyAgICAgeyB0ZXh0OiB0KFwiY29udGFjdFVzXCIpLCByZWY6IFwiY29udGFjdFVzUmVmXCIsIGhyZWY6IFwiI2NvbnRhY3QtdXNcIiB9LFxuLy8gICBdO1xuXG4vLyAgIGNvbnN0IHRhYnNDb21wb25lbnRzID0gcGlsbFRhYnMubWFwKCh0YWIsIGkpID0+IChcbi8vICAgICA8bGkga2V5PXt0YWIudGV4dH0+XG4vLyAgICAgICA8TmF2TGlua1xuLy8gICAgICAgICBocmVmPXt0YWIuaHJlZn1cbi8vICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBzZXRIb3ZlcmVkSW5kZXgoaSl9XG4vLyAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4vLyAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuLy8gICAgICAgICAgIGhhbmRsZVNjcm9sbChcbi8vICAgICAgICAgICAgIHRhYi5yZWYgPT09IFwiaG9tZVJlZlwiXG4vLyAgICAgICAgICAgICAgID8gaG9tZVJlZlxuLy8gICAgICAgICAgICAgICA6IHRhYi5yZWYgPT09IFwiYWJvdXRVc1JlZlwiXG4vLyAgICAgICAgICAgICAgID8gYWJvdXRVc1JlZlxuLy8gICAgICAgICAgICAgICA6IHRhYi5yZWYgPT09IFwic2VydmljZXNSZWZcIlxuLy8gICAgICAgICAgICAgICA/IHNlcnZpY2VzUmVmXG4vLyAgICAgICAgICAgICAgIDogY29udGFjdFVzUmVmXG4vLyAgICAgICAgICAgKTtcbi8vICAgICAgICAgfX1cbi8vICAgICAgID5cbi8vICAgICAgICAge2hvdmVyZWRJbmRleCA9PT0gaSAmJiAoXG4vLyAgICAgICAgICAgPE1hZ2ljVGFiU2VsZWN0XG4vLyAgICAgICAgICAgICBpZD1cInBpbGxUYWJzXCJcbi8vICAgICAgICAgICAgIHRyYW5zaXRpb249e3sgdHlwZTogXCJzcHJpbmdcIiwgYm91bmNlOiAwLjM1IH19XG4vLyAgICAgICAgICAgPlxuLy8gICAgICAgICAgICAgPHNwYW5cbi8vICAgICAgICAgICAgICAgc3R5bGU9e3tcbi8vICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiOTk5cHhcIixcbi8vICAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuLy8gICAgICAgICAgICAgICAgIHRvcDogXCItNXB4XCIsXG4vLyAgICAgICAgICAgICAgICAgbGVmdDogXCItMzBweFwiLFxuLy8gICAgICAgICAgICAgICAgIHJpZ2h0OiBcIi0zMHB4XCIsXG4vLyAgICAgICAgICAgICAgICAgYm90dG9tOiBcIi01cHhcIixcbi8vICAgICAgICAgICAgICAgICB6SW5kZXg6IC0xLFxuLy8gICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJyZ2JhKDIxLCA2MiwgMTA4LCAwLjg0KVwiLFxuLy8gICAgICAgICAgICAgICB9fVxuLy8gICAgICAgICAgICAgLz5cbi8vICAgICAgICAgICA8L01hZ2ljVGFiU2VsZWN0PlxuLy8gICAgICAgICApfVxuLy8gICAgICAgIHt0KHRhYi50ZXh0KX1cbi8vICAgICAgIDwvTmF2TGluaz5cbi8vICAgICA8L2xpPlxuLy8gICApKTtcblxuLy8gICByZXR1cm4gKFxuLy8gICAgIDxOYXZCYXJDb250YWluZXI+XG4vLyAgICAgICA8TG9nbz5cbi8vICAgICAgICAgT3BlbkdhdGU8U3Bhbj5IdWI8L1NwYW4+XG4vLyAgICAgICA8L0xvZ28+XG4vLyAgICAgICA8TmF2TGlua3M+e3RhYnNDb21wb25lbnRzfTwvTmF2TGlua3M+XG4vLyAgICAgICA8ZGl2PlxuLy8gICAgICAgICA8TGFuZ01lbnVDb250YWluZXIgb25DbGljaz17dG9nZ2xlTGFuZ01lbnV9PlxuLy8gICAgICAgICAgIDxXb3JsZEljb24gLz5cbi8vICAgICAgICAgICA8U3R5bGVkTGFuZ1RleHQ+XG4vLyAgICAgICAgICAge3NlbGVjdGVkTGFuZyA9PT0gXCJlblwiID8gdChcImVuZ2xpc2hcIikgOiB0KFwic3BhbmlzaFwiKX1cbi8vICAgICAgICAgICA8L1N0eWxlZExhbmdUZXh0PlxuLy8gICAgICAgICAgIDxBcnJvd0ljb24gb3Blbj17c2hvd0xhbmdNZW51fSAvPlxuLy8gICAgICAgICA8L0xhbmdNZW51Q29udGFpbmVyPlxuLy8gICAgICAgICB7c2hvd0xhbmdNZW51ICYmIChcbi8vICAgICAgICAgICA8TGFuZ01lbnUgaXNPcGVuPXtzaG93TGFuZ01lbnV9PlxuLy8gICAgICAgICAgICAge3NlbGVjdGVkTGFuZyA9PT0gXCJlblwiID8gKFxuLy8gICAgICAgICAgICAgICA8TGFuZ01lbnVJdGVtIG9uQ2xpY2s9eygpID0+IGhhbmRsZUxhbmdDaGFuZ2UoXCJlc1wiKX0+XG4vLyAgICAgICAgICAgICAgICAge3QoXCJzcGFuaXNoXCIpfVxuLy8gICAgICAgICAgICAgICA8L0xhbmdNZW51SXRlbT5cbi8vICAgICAgICAgICAgICkgOiAoXG4vLyAgICAgICAgICAgICAgIDxMYW5nTWVudUl0ZW0gb25DbGljaz17KCkgPT4gaGFuZGxlTGFuZ0NoYW5nZShcImVuXCIpfT5cbi8vICAgICAgICAgICAgICAgICB7dChcImVuZ2xpc2hcIil9XG4vLyAgICAgICAgICAgICAgIDwvTGFuZ01lbnVJdGVtPlxuLy8gICAgICAgICAgICAgKX1cbi8vICAgICAgICAgICA8L0xhbmdNZW51PlxuLy8gICAgICAgICApfVxuLy8gICAgICAgPC9kaXY+XG4vLyAgICAgPC9OYXZCYXJDb250YWluZXI+XG4vLyAgICk7XG4vLyB9O1xuXG4vLyBleHBvcnQgZGVmYXVsdCBOYXZCYXI7XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJ1c2VTdGF0ZSIsIkxpbmsiLCJMb2dvIiwiU3BhbiIsIk5hdkJhckNvbnRhaW5lciIsIk5hdkxpbmsiLCJOYXZMaW5rcyIsIkxhbmdNZW51Q29udGFpbmVyIiwiTGFuZ01lbnUiLCJMYW5nTWVudUl0ZW0iLCJXb3JsZEljb24iLCJTdHlsZWRMYW5nVGV4dCIsIkhpZ2hsaWdodEJhciIsIkFycm93SWNvbiIsInVzZVRyYW5zbGF0aW9uIiwiTmF2QmFyRGVza3RvcCIsInQiLCJpMThuIiwic2hvd0xhbmdNZW51Iiwic2V0U2hvd0xhbmdNZW51IiwiaG92ZXJlZEluZGV4Iiwic2V0SG92ZXJlZEluZGV4Iiwic2VsZWN0ZWRMYW5nIiwic2V0U2VsZWN0ZWRMYW5nIiwidG9nZ2xlTGFuZ01lbnUiLCJoYW5kbGVMYW5nQ2hhbmdlIiwibGFuZyIsImNoYW5nZUxhbmd1YWdlIiwicGlsbFRhYnMiLCJ0ZXh0IiwiaHJlZiIsInRhYkNvdW50IiwibGVuZ3RoIiwiYW5pbWF0ZSIsIm1hcCIsInRhYiIsImkiLCJsaSIsIm9uTW91c2VFbnRlciIsImRpdiIsIm9uQ2xpY2siLCJvcGVuIiwiaXNPcGVuIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/components/NavBar/NavBarDesktop.jsx\n"));

/***/ })

});