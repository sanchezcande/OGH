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

/***/ "./src/components/NavBar/NavBarDesktop.styles.js":
/*!*******************************************************!*\
  !*** ./src/components/NavBar/NavBarDesktop.styles.js ***!
  \*******************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ArrowIcon: () => (/* binding */ ArrowIcon),\n/* harmony export */   HighlightBar: () => (/* binding */ HighlightBar),\n/* harmony export */   LangMenu: () => (/* binding */ LangMenu),\n/* harmony export */   LangMenuContainer: () => (/* binding */ LangMenuContainer),\n/* harmony export */   LangMenuItem: () => (/* binding */ LangMenuItem),\n/* harmony export */   Logo: () => (/* binding */ Logo),\n/* harmony export */   NavBarContainer: () => (/* binding */ NavBarContainer),\n/* harmony export */   NavLink: () => (/* binding */ NavLink),\n/* harmony export */   NavLinks: () => (/* binding */ NavLinks),\n/* harmony export */   Span: () => (/* binding */ Span),\n/* harmony export */   StyledLangText: () => (/* binding */ StyledLangText),\n/* harmony export */   WorldIcon: () => (/* binding */ WorldIcon)\n/* harmony export */ });\n/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! styled-components */ \"./node_modules/styled-components/dist/styled-components.browser.esm.js\");\n/* harmony import */ var _barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! __barrel_optimize__?names=FaAngleDown,FaGlobe!=!react-icons/fa */ \"__barrel_optimize__?names=FaAngleDown,FaGlobe!=!./node_modules/react-icons/fa/index.mjs\");\n\n\nconst NavBarContainer = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].nav`\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px 20px;\n  background-color: #333;\n  color: white;\n  width: 100%;\n  background-color: transparent;\n  marging-right:10px;\n\n`;\nconst Logo = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].div`\n  font-weight: 800;\n  font-size: 28px;\n`;\nconst Span = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  font-weight: 400;\n`;\nconst NavLinks = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].ul`\n  display: flex;\n  gap: 50px;\n  list-style: none;\n  border-radius: 40px;\n  background-color: rgba(21, 62, 108, 0.34);\n  padding: 15px 30px;\n  border: 2px solid #0034ee;\n  position: relative;\n  justify-content: center;\n`;\nconst NavLink = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].a`\n  position: relative;\n  padding: 10px 20px;\n  color: white;\n  text-decoration: none;\n  font-size: 16px;\n  z-index: 1;\n  transition: color 0.3s ease;\n\n  &:hover {\n    color: #ddd;\n  }\n`;\nconst HighlightBar = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].div`\nposition: absolute;\nbottom: 0;\nleft: 0;\nwidth: ${({ tabCount })=>`calc(100% / ${tabCount})`}; \n  height: 100%;\n  background-color: rgba(21, 62, 108, 0.84);\n  border-radius: 999px;\n  transition: transform 0.3s ease;\n  transform: ${({ hoveredIndex })=>{\n    // Definir las posiiones para cada índice (en píxeles)\n    const positions = [\n        \"0px\",\n        \"100px\",\n        \"220px\",\n        \"330px\"\n    ];\n    return `translateX(${positions[hoveredIndex]})`;\n}};\n  z-index: 0;\n`;\nconst LangMenuContainer = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 5px;\n  position: relative;\n  margin-right: 25px;\n`;\nconst slideDown = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.keyframes)`\n  from {\n    max-height: 0;\n    opacity: 0;\n    padding-top: 0;\n    padding-bottom: 0;\n  }\n  to {\n    max-height: 200px;\n    opacity: 1;\n    padding-top: 10px;\n    padding-bottom: 10px;\n  }\n`;\nconst slideUp = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.keyframes)`\n  from {\n    max-height: 200px;\n    opacity: 1;\n    padding-top: 10px;\n    padding-bottom: 10px;\n  }\n  to {\n    max-height: 0;\n    opacity: 0;\n    padding-top: 0;\n    padding-bottom: 0;\n  }\n`;\nconst LangMenu = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].ul`\n  position: absolute;\n  list-style-type: none;\n  margin: 0;\n  background-color: transparent;\n  padding: 0;\n  right: 0;\n  padding-right: 55px;\n  border-radius: 5px;\n  max-height: 200px;\n  overflow: hidden;\n  animation: ${(props)=>props.isOpen ? slideDown : slideUp} 0.4s ease forwards;\n`;\nconst LangMenuItem = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].li`\n  padding: 10px;\n  cursor: pointer;\n  right: 0;\n  transition: background-color 0.5s ease, color 0.5s ease;\n  &:hover {\n    background-color: rgba(255, 255, 255, 0.8);\n    border-radius: 40px;\n    color: ${(props)=>props.theme.colors.primary};\n  }\n`;\nconst WorldIcon = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"])((0,_barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__.FaGlobe))`\n  width: 32px;\n  height: 32px;\n  margin-right: 10px;\n`;\nconst StyledLangText = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  font-weight: 500;\n`;\nconst ArrowIcon = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"])((0,_barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__.FaAngleDown))`\n  transition: transform 0.3s ease-in-out;\n  ${({ open })=>open && (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.css)`\n      animation: rotate 0.3s ease-in-out;\n      transform: rotate(180deg);\n    `}\n`;\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5zdHlsZXMuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBMkQ7QUFDTDtBQUMvQyxNQUFNSyxrQkFBa0JMLDZEQUFVLENBQUM7Ozs7Ozs7Ozs7O0FBVzFDLENBQUMsQ0FBQztBQUVLLE1BQU1PLE9BQU9QLDZEQUFVLENBQUM7OztBQUcvQixDQUFDLENBQUM7QUFFSyxNQUFNUyxPQUFPVCw4REFBVyxDQUFDOztBQUVoQyxDQUFDLENBQUM7QUFFSyxNQUFNVyxXQUFXWCw0REFBUyxDQUFDOzs7Ozs7Ozs7O0FBVWxDLENBQUMsQ0FBQztBQUdLLE1BQU1hLFVBQVViLDJEQUFRLENBQUM7Ozs7Ozs7Ozs7OztBQVloQyxDQUFDLENBQUM7QUFFSyxNQUFNZSxlQUFlZiw2REFBVSxDQUFDOzs7O09BSWhDLEVBQUUsQ0FBQyxFQUFFZ0IsUUFBUSxFQUFFLEdBQUssQ0FBQyxZQUFZLEVBQUVBLFNBQVMsQ0FBQyxDQUFDLENBQUM7Ozs7O2FBS3pDLEVBQUUsQ0FBQyxFQUFFQyxZQUFZLEVBQUU7SUFDNUIsc0RBQXNEO0lBQ3RELE1BQU1DLFlBQVk7UUFBQztRQUFPO1FBQVM7UUFBUztLQUFRO0lBQ3BELE9BQU8sQ0FBQyxXQUFXLEVBQUVBLFNBQVMsQ0FBQ0QsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUNqRCxFQUFFOztBQUVKLENBQUMsQ0FBQztBQUVLLE1BQU1FLG9CQUFvQm5CLDhEQUFXLENBQUM7Ozs7Ozs7QUFPN0MsQ0FBQyxDQUFDO0FBRUYsTUFBTW9CLFlBQVlsQiw0REFBUyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBYTVCLENBQUM7QUFFRCxNQUFNbUIsVUFBVW5CLDREQUFTLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFhMUIsQ0FBQztBQUVNLE1BQU1vQixXQUFXdEIsNERBQVMsQ0FBQzs7Ozs7Ozs7Ozs7YUFXckIsRUFBRSxDQUFDdUIsUUFBV0EsTUFBTUMsTUFBTSxHQUFHSixZQUFZQyxRQUFTO0FBQy9ELENBQUMsQ0FBQztBQUVLLE1BQU1JLGVBQWV6Qiw0REFBUyxDQUFDOzs7Ozs7OztXQVEzQixFQUFFLENBQUN1QixRQUFVQSxNQUFNSSxLQUFLLENBQUNDLE1BQU0sQ0FBQ0MsT0FBTyxDQUFDOztBQUVuRCxDQUFDLENBQUM7QUFFSyxNQUFNQyxZQUFZOUIsNkRBQU1BLENBQUNJLGtHQUFPQSxDQUFDLENBQUM7Ozs7QUFJekMsQ0FBQyxDQUFDO0FBRUssTUFBTTJCLGlCQUFpQi9CLDhEQUFXLENBQUM7O0FBRTFDLENBQUMsQ0FBQztBQUVLLE1BQU1nQyxZQUFZaEMsNkRBQU1BLENBQUNHLHNHQUFXQSxDQUFDLENBQUM7O0VBRTNDLEVBQUUsQ0FBQyxFQUFFOEIsSUFBSSxFQUFFLEdBQ1RBLFFBQ0FoQyxzREFBRyxDQUFDOzs7SUFHSixDQUFDLENBQUM7QUFDTixDQUFDLENBQUMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYWMvRGVza3RvcC9PR0gvb2doTGFuZGluZy9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5zdHlsZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0eWxlZCwgeyBjc3MsIGtleWZyYW1lcyB9IGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuaW1wb3J0IHsgRmFBbmdsZURvd24sIEZhR2xvYmUgfSBmcm9tIFwicmVhY3QtaWNvbnMvZmFcIjtcbmV4cG9ydCBjb25zdCBOYXZCYXJDb250YWluZXIgPSBzdHlsZWQubmF2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDEwcHggMjBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcbiAgY29sb3I6IHdoaXRlO1xuICB3aWR0aDogMTAwJTtcbiAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gIG1hcmdpbmctcmlnaHQ6MTBweDtcblxuYDtcblxuZXhwb3J0IGNvbnN0IExvZ28gPSBzdHlsZWQuZGl2YFxuICBmb250LXdlaWdodDogODAwO1xuICBmb250LXNpemU6IDI4cHg7XG5gO1xuXG5leHBvcnQgY29uc3QgU3BhbiA9IHN0eWxlZC5zcGFuYFxuICBmb250LXdlaWdodDogNDAwO1xuYDtcblxuZXhwb3J0IGNvbnN0IE5hdkxpbmtzID0gc3R5bGVkLnVsYFxuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDUwcHg7XG4gIGxpc3Qtc3R5bGU6IG5vbmU7XG4gIGJvcmRlci1yYWRpdXM6IDQwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjEsIDYyLCAxMDgsIDAuMzQpO1xuICBwYWRkaW5nOiAxNXB4IDMwcHg7XG4gIGJvcmRlcjogMnB4IHNvbGlkICMwMDM0ZWU7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5gO1xuXG5cbmV4cG9ydCBjb25zdCBOYXZMaW5rID0gc3R5bGVkLmFgXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgcGFkZGluZzogMTBweCAyMHB4O1xuICBjb2xvcjogd2hpdGU7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgZm9udC1zaXplOiAxNnB4O1xuICB6LWluZGV4OiAxO1xuICB0cmFuc2l0aW9uOiBjb2xvciAwLjNzIGVhc2U7XG5cbiAgJjpob3ZlciB7XG4gICAgY29sb3I6ICNkZGQ7XG4gIH1cbmA7XG5cbmV4cG9ydCBjb25zdCBIaWdobGlnaHRCYXIgPSBzdHlsZWQuZGl2YFxucG9zaXRpb246IGFic29sdXRlO1xuYm90dG9tOiAwO1xubGVmdDogMDtcbndpZHRoOiAkeyh7IHRhYkNvdW50IH0pID0+IGBjYWxjKDEwMCUgLyAke3RhYkNvdW50fSlgfTsgXG4gIGhlaWdodDogMTAwJTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgyMSwgNjIsIDEwOCwgMC44NCk7XG4gIGJvcmRlci1yYWRpdXM6IDk5OXB4O1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4zcyBlYXNlO1xuICB0cmFuc2Zvcm06ICR7KHsgaG92ZXJlZEluZGV4IH0pID0+IHtcbiAgICAvLyBEZWZpbmlyIGxhcyBwb3NpaW9uZXMgcGFyYSBjYWRhIMOtbmRpY2UgKGVuIHDDrXhlbGVzKVxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtcIjBweFwiLCBcIjEwMHB4XCIsIFwiMjIwcHhcIiwgXCIzMzBweFwiXTtcbiAgICByZXR1cm4gYHRyYW5zbGF0ZVgoJHtwb3NpdGlvbnNbaG92ZXJlZEluZGV4XX0pYDtcbiAgfX07XG4gIHotaW5kZXg6IDA7XG5gO1xuXG5leHBvcnQgY29uc3QgTGFuZ01lbnVDb250YWluZXIgPSBzdHlsZWQuc3BhbmBcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgZ2FwOiA1cHg7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgbWFyZ2luLXJpZ2h0OiAyNXB4O1xuYDtcblxuY29uc3Qgc2xpZGVEb3duID0ga2V5ZnJhbWVzYFxuICBmcm9tIHtcbiAgICBtYXgtaGVpZ2h0OiAwO1xuICAgIG9wYWNpdHk6IDA7XG4gICAgcGFkZGluZy10b3A6IDA7XG4gICAgcGFkZGluZy1ib3R0b206IDA7XG4gIH1cbiAgdG8ge1xuICAgIG1heC1oZWlnaHQ6IDIwMHB4O1xuICAgIG9wYWNpdHk6IDE7XG4gICAgcGFkZGluZy10b3A6IDEwcHg7XG4gICAgcGFkZGluZy1ib3R0b206IDEwcHg7XG4gIH1cbmA7XG5cbmNvbnN0IHNsaWRlVXAgPSBrZXlmcmFtZXNgXG4gIGZyb20ge1xuICAgIG1heC1oZWlnaHQ6IDIwMHB4O1xuICAgIG9wYWNpdHk6IDE7XG4gICAgcGFkZGluZy10b3A6IDEwcHg7XG4gICAgcGFkZGluZy1ib3R0b206IDEwcHg7XG4gIH1cbiAgdG8ge1xuICAgIG1heC1oZWlnaHQ6IDA7XG4gICAgb3BhY2l0eTogMDtcbiAgICBwYWRkaW5nLXRvcDogMDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMDtcbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IExhbmdNZW51ID0gc3R5bGVkLnVsYFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcbiAgbWFyZ2luOiAwO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgcGFkZGluZzogMDtcbiAgcmlnaHQ6IDA7XG4gIHBhZGRpbmctcmlnaHQ6IDU1cHg7XG4gIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgbWF4LWhlaWdodDogMjAwcHg7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIGFuaW1hdGlvbjogJHsocHJvcHMpID0+IChwcm9wcy5pc09wZW4gPyBzbGlkZURvd24gOiBzbGlkZVVwKX0gMC40cyBlYXNlIGZvcndhcmRzO1xuYDtcblxuZXhwb3J0IGNvbnN0IExhbmdNZW51SXRlbSA9IHN0eWxlZC5saWBcbiAgcGFkZGluZzogMTBweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICByaWdodDogMDtcbiAgdHJhbnNpdGlvbjogYmFja2dyb3VuZC1jb2xvciAwLjVzIGVhc2UsIGNvbG9yIDAuNXMgZWFzZTtcbiAgJjpob3ZlciB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpO1xuICAgIGJvcmRlci1yYWRpdXM6IDQwcHg7XG4gICAgY29sb3I6ICR7KHByb3BzKSA9PiBwcm9wcy50aGVtZS5jb2xvcnMucHJpbWFyeX07XG4gIH1cbmA7XG5cbmV4cG9ydCBjb25zdCBXb3JsZEljb24gPSBzdHlsZWQoRmFHbG9iZSlgXG4gIHdpZHRoOiAzMnB4O1xuICBoZWlnaHQ6IDMycHg7XG4gIG1hcmdpbi1yaWdodDogMTBweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBTdHlsZWRMYW5nVGV4dCA9IHN0eWxlZC5zcGFuYFxuICBmb250LXdlaWdodDogNTAwO1xuYDtcblxuZXhwb3J0IGNvbnN0IEFycm93SWNvbiA9IHN0eWxlZChGYUFuZ2xlRG93bilgXG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGVhc2UtaW4tb3V0O1xuICAkeyh7IG9wZW4gfSkgPT5cbiAgICBvcGVuICYmXG4gICAgY3NzYFxuICAgICAgYW5pbWF0aW9uOiByb3RhdGUgMC4zcyBlYXNlLWluLW91dDtcbiAgICAgIHRyYW5zZm9ybTogcm90YXRlKDE4MGRlZyk7XG4gICAgYH1cbmA7XG4iXSwibmFtZXMiOlsic3R5bGVkIiwiY3NzIiwia2V5ZnJhbWVzIiwiRmFBbmdsZURvd24iLCJGYUdsb2JlIiwiTmF2QmFyQ29udGFpbmVyIiwibmF2IiwiTG9nbyIsImRpdiIsIlNwYW4iLCJzcGFuIiwiTmF2TGlua3MiLCJ1bCIsIk5hdkxpbmsiLCJhIiwiSGlnaGxpZ2h0QmFyIiwidGFiQ291bnQiLCJob3ZlcmVkSW5kZXgiLCJwb3NpdGlvbnMiLCJMYW5nTWVudUNvbnRhaW5lciIsInNsaWRlRG93biIsInNsaWRlVXAiLCJMYW5nTWVudSIsInByb3BzIiwiaXNPcGVuIiwiTGFuZ01lbnVJdGVtIiwibGkiLCJ0aGVtZSIsImNvbG9ycyIsInByaW1hcnkiLCJXb3JsZEljb24iLCJTdHlsZWRMYW5nVGV4dCIsIkFycm93SWNvbiIsIm9wZW4iXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/components/NavBar/NavBarDesktop.styles.js\n"));

/***/ })

});