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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ArrowIcon: () => (/* binding */ ArrowIcon),\n/* harmony export */   HighlightBar: () => (/* binding */ HighlightBar),\n/* harmony export */   LangMenu: () => (/* binding */ LangMenu),\n/* harmony export */   LangMenuContainer: () => (/* binding */ LangMenuContainer),\n/* harmony export */   LangMenuItem: () => (/* binding */ LangMenuItem),\n/* harmony export */   Logo: () => (/* binding */ Logo),\n/* harmony export */   NavBarContainer: () => (/* binding */ NavBarContainer),\n/* harmony export */   NavLink: () => (/* binding */ NavLink),\n/* harmony export */   NavLinks: () => (/* binding */ NavLinks),\n/* harmony export */   Span: () => (/* binding */ Span),\n/* harmony export */   StyledLangText: () => (/* binding */ StyledLangText),\n/* harmony export */   WorldIcon: () => (/* binding */ WorldIcon)\n/* harmony export */ });\n/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! styled-components */ \"./node_modules/styled-components/dist/styled-components.browser.esm.js\");\n/* harmony import */ var _barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! __barrel_optimize__?names=FaAngleDown,FaGlobe!=!react-icons/fa */ \"__barrel_optimize__?names=FaAngleDown,FaGlobe!=!./node_modules/react-icons/fa/index.mjs\");\n\n\nconst NavBarContainer = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].nav`\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px 20px;\n  background-color: #333;\n  color: white;\n  width: 100%;\n  background-color: transparent;\n  marging-right:10px;\n\n`;\nconst Logo = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].div`\n  font-weight: 800;\n  font-size: 28px;\n`;\nconst Span = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  font-weight: 400;\n`;\nconst NavLinks = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].ul`\n  display: flex;\n  gap: 50px;\n  list-style: none;\n  border-radius: 40px;\n  background-color: rgba(21, 62, 108, 0.34);\n  padding: 15px 30px;\n  border: 2px solid #0034ee;\n  position: relative;\n  justify-content: center;\n`;\nconst NavLink = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].a`\n  position: relative;\n  padding: 10px 20px;\n  color: white;\n  text-decoration: none;\n  font-size: 16px;\n  z-index: 1;\n  transition: color 0.3s ease;\n\n  &:hover {\n    color: #ddd;\n  }\n`;\nconst HighlightBar = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].div`\nposition: absolute;\nbottom: 0;\nleft: 0;\nwidth: ${({ hoveredIndex })=>{\n    const widths = [\n        \"150px\",\n        \"150px\",\n        \"150px\",\n        \"175px\"\n    ];\n    return widths[hoveredIndex];\n}};\n  height: 100%;\n  background-color: rgba(21, 62, 108, 0.84);\n  border-radius: 999px;\n  transition: transform 0.3s ease;\n  transform: ${({ hoveredIndex })=>{\n    const positions = [\n        \"0px\",\n        \"92%\",\n        \"195%\",\n        \"265%\"\n    ];\n    return `translateX(${positions[hoveredIndex]})`;\n}};\n  z-index: 0;\n`;\nconst LangMenuContainer = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 5px;\n  position: relative;\n  margin-right: 25px;\n`;\nconst slideDown = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.keyframes)`\n  from {\n    max-height: 0;\n    opacity: 0;\n    padding-top: 0;\n    padding-bottom: 0;\n  }\n  to {\n    max-height: 200px;\n    opacity: 1;\n    padding-top: 10px;\n    padding-bottom: 10px;\n  }\n`;\nconst slideUp = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.keyframes)`\n  from {\n    max-height: 200px;\n    opacity: 1;\n    padding-top: 10px;\n    padding-bottom: 10px;\n  }\n  to {\n    max-height: 0;\n    opacity: 0;\n    padding-top: 0;\n    padding-bottom: 0;\n  }\n`;\nconst LangMenu = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].ul`\n  position: absolute;\n  list-style-type: none;\n  margin: 0;\n  background-color: transparent;\n  padding: 0;\n  right: 0;\n  padding-right: 55px;\n  border-radius: 5px;\n  max-height: 200px;\n  overflow: hidden;\n  animation: ${(props)=>props.isOpen ? slideDown : slideUp} 0.4s ease forwards;\n`;\nconst LangMenuItem = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].li`\n  padding: 10px;\n  cursor: pointer;\n  right: 0;\n  transition: background-color 0.5s ease, color 0.5s ease;\n  &:hover {\n    background-color: rgba(255, 255, 255, 0.8);\n    border-radius: 40px;\n    color: ${(props)=>props.theme.colors.primary};\n  }\n`;\nconst WorldIcon = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"])((0,_barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__.FaGlobe))`\n  width: 32px;\n  height: 32px;\n  margin-right: 10px;\n`;\nconst StyledLangText = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  font-weight: 500;\n`;\nconst ArrowIcon = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"])((0,_barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__.FaAngleDown))`\n  transition: transform 0.3s ease-in-out;\n  ${({ open })=>open && (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.css)`\n      animation: rotate 0.3s ease-in-out;\n      transform: rotate(180deg);\n    `}\n`;\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5zdHlsZXMuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBMkQ7QUFDTDtBQUMvQyxNQUFNSyxrQkFBa0JMLDZEQUFVLENBQUM7Ozs7Ozs7Ozs7O0FBVzFDLENBQUMsQ0FBQztBQUVLLE1BQU1PLE9BQU9QLDZEQUFVLENBQUM7OztBQUcvQixDQUFDLENBQUM7QUFFSyxNQUFNUyxPQUFPVCw4REFBVyxDQUFDOztBQUVoQyxDQUFDLENBQUM7QUFFSyxNQUFNVyxXQUFXWCw0REFBUyxDQUFDOzs7Ozs7Ozs7O0FBVWxDLENBQUMsQ0FBQztBQUdLLE1BQU1hLFVBQVViLDJEQUFRLENBQUM7Ozs7Ozs7Ozs7OztBQVloQyxDQUFDLENBQUM7QUFFSyxNQUFNZSxlQUFlZiw2REFBVSxDQUFDOzs7O09BSWhDLEVBQUUsQ0FBQyxFQUFFZ0IsWUFBWSxFQUFFO0lBQ3hCLE1BQU1DLFNBQVM7UUFBQztRQUFTO1FBQVM7UUFBUztLQUFRO0lBQ25ELE9BQU9BLE1BQU0sQ0FBQ0QsYUFBYTtBQUM3QixFQUFFOzs7OzthQUtXLEVBQUUsQ0FBQyxFQUFFQSxZQUFZLEVBQUU7SUFDNUIsTUFBTUUsWUFBWTtRQUFDO1FBQU87UUFBTztRQUFRO0tBQU87SUFDaEQsT0FBTyxDQUFDLFdBQVcsRUFBRUEsU0FBUyxDQUFDRixhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQ2pELEVBQUU7O0FBRUosQ0FBQyxDQUFDO0FBRUssTUFBTUcsb0JBQW9CbkIsOERBQVcsQ0FBQzs7Ozs7OztBQU83QyxDQUFDLENBQUM7QUFFRixNQUFNb0IsWUFBWWxCLDREQUFTLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFhNUIsQ0FBQztBQUVELE1BQU1tQixVQUFVbkIsNERBQVMsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWExQixDQUFDO0FBRU0sTUFBTW9CLFdBQVd0Qiw0REFBUyxDQUFDOzs7Ozs7Ozs7OzthQVdyQixFQUFFLENBQUN1QixRQUFXQSxNQUFNQyxNQUFNLEdBQUdKLFlBQVlDLFFBQVM7QUFDL0QsQ0FBQyxDQUFDO0FBRUssTUFBTUksZUFBZXpCLDREQUFTLENBQUM7Ozs7Ozs7O1dBUTNCLEVBQUUsQ0FBQ3VCLFFBQVVBLE1BQU1JLEtBQUssQ0FBQ0MsTUFBTSxDQUFDQyxPQUFPLENBQUM7O0FBRW5ELENBQUMsQ0FBQztBQUVLLE1BQU1DLFlBQVk5Qiw2REFBTUEsQ0FBQ0ksa0dBQU9BLENBQUMsQ0FBQzs7OztBQUl6QyxDQUFDLENBQUM7QUFFSyxNQUFNMkIsaUJBQWlCL0IsOERBQVcsQ0FBQzs7QUFFMUMsQ0FBQyxDQUFDO0FBRUssTUFBTWdDLFlBQVloQyw2REFBTUEsQ0FBQ0csc0dBQVdBLENBQUMsQ0FBQzs7RUFFM0MsRUFBRSxDQUFDLEVBQUU4QixJQUFJLEVBQUUsR0FDVEEsUUFDQWhDLHNEQUFHLENBQUM7OztJQUdKLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyIsInNvdXJjZXMiOlsiL1VzZXJzL21hYy9EZXNrdG9wL09HSC9vZ2hMYW5kaW5nL3NyYy9jb21wb25lbnRzL05hdkJhci9OYXZCYXJEZXNrdG9wLnN0eWxlcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3R5bGVkLCB7IGNzcywga2V5ZnJhbWVzIH0gZnJvbSBcInN0eWxlZC1jb21wb25lbnRzXCI7XG5pbXBvcnQgeyBGYUFuZ2xlRG93biwgRmFHbG9iZSB9IGZyb20gXCJyZWFjdC1pY29ucy9mYVwiO1xuZXhwb3J0IGNvbnN0IE5hdkJhckNvbnRhaW5lciA9IHN0eWxlZC5uYXZgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcGFkZGluZzogMTBweCAyMHB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzO1xuICBjb2xvcjogd2hpdGU7XG4gIHdpZHRoOiAxMDAlO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgbWFyZ2luZy1yaWdodDoxMHB4O1xuXG5gO1xuXG5leHBvcnQgY29uc3QgTG9nbyA9IHN0eWxlZC5kaXZgXG4gIGZvbnQtd2VpZ2h0OiA4MDA7XG4gIGZvbnQtc2l6ZTogMjhweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBTcGFuID0gc3R5bGVkLnNwYW5gXG4gIGZvbnQtd2VpZ2h0OiA0MDA7XG5gO1xuXG5leHBvcnQgY29uc3QgTmF2TGlua3MgPSBzdHlsZWQudWxgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogNTBweDtcbiAgbGlzdC1zdHlsZTogbm9uZTtcbiAgYm9yZGVyLXJhZGl1czogNDBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgyMSwgNjIsIDEwOCwgMC4zNCk7XG4gIHBhZGRpbmc6IDE1cHggMzBweDtcbiAgYm9yZGVyOiAycHggc29saWQgIzAwMzRlZTtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbmA7XG5cblxuZXhwb3J0IGNvbnN0IE5hdkxpbmsgPSBzdHlsZWQuYWBcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBwYWRkaW5nOiAxMHB4IDIwcHg7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICBmb250LXNpemU6IDE2cHg7XG4gIHotaW5kZXg6IDE7XG4gIHRyYW5zaXRpb246IGNvbG9yIDAuM3MgZWFzZTtcblxuICAmOmhvdmVyIHtcbiAgICBjb2xvcjogI2RkZDtcbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IEhpZ2hsaWdodEJhciA9IHN0eWxlZC5kaXZgXG5wb3NpdGlvbjogYWJzb2x1dGU7XG5ib3R0b206IDA7XG5sZWZ0OiAwO1xud2lkdGg6ICR7KHsgaG92ZXJlZEluZGV4IH0pID0+IHtcbiAgY29uc3Qgd2lkdGhzID0gW1wiMTUwcHhcIiwgXCIxNTBweFwiLCBcIjE1MHB4XCIsIFwiMTc1cHhcIl07XG4gIHJldHVybiB3aWR0aHNbaG92ZXJlZEluZGV4XTtcbn19O1xuICBoZWlnaHQ6IDEwMCU7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjEsIDYyLCAxMDgsIDAuODQpO1xuICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuM3MgZWFzZTtcbiAgdHJhbnNmb3JtOiAkeyh7IGhvdmVyZWRJbmRleCB9KSA9PiB7XG4gICAgY29uc3QgcG9zaXRpb25zID0gW1wiMHB4XCIsIFwiOTIlXCIsIFwiMTk1JVwiLCBcIjI2NSVcIl07XG4gICAgcmV0dXJuIGB0cmFuc2xhdGVYKCR7cG9zaXRpb25zW2hvdmVyZWRJbmRleF19KWA7XG4gIH19O1xuICB6LWluZGV4OiAwO1xuYDtcblxuZXhwb3J0IGNvbnN0IExhbmdNZW51Q29udGFpbmVyID0gc3R5bGVkLnNwYW5gXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGdhcDogNXB4O1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIG1hcmdpbi1yaWdodDogMjVweDtcbmA7XG5cbmNvbnN0IHNsaWRlRG93biA9IGtleWZyYW1lc2BcbiAgZnJvbSB7XG4gICAgbWF4LWhlaWdodDogMDtcbiAgICBvcGFjaXR5OiAwO1xuICAgIHBhZGRpbmctdG9wOiAwO1xuICAgIHBhZGRpbmctYm90dG9tOiAwO1xuICB9XG4gIHRvIHtcbiAgICBtYXgtaGVpZ2h0OiAyMDBweDtcbiAgICBvcGFjaXR5OiAxO1xuICAgIHBhZGRpbmctdG9wOiAxMHB4O1xuICAgIHBhZGRpbmctYm90dG9tOiAxMHB4O1xuICB9XG5gO1xuXG5jb25zdCBzbGlkZVVwID0ga2V5ZnJhbWVzYFxuICBmcm9tIHtcbiAgICBtYXgtaGVpZ2h0OiAyMDBweDtcbiAgICBvcGFjaXR5OiAxO1xuICAgIHBhZGRpbmctdG9wOiAxMHB4O1xuICAgIHBhZGRpbmctYm90dG9tOiAxMHB4O1xuICB9XG4gIHRvIHtcbiAgICBtYXgtaGVpZ2h0OiAwO1xuICAgIG9wYWNpdHk6IDA7XG4gICAgcGFkZGluZy10b3A6IDA7XG4gICAgcGFkZGluZy1ib3R0b206IDA7XG4gIH1cbmA7XG5cbmV4cG9ydCBjb25zdCBMYW5nTWVudSA9IHN0eWxlZC51bGBcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG4gIG1hcmdpbjogMDtcbiAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gIHBhZGRpbmc6IDA7XG4gIHJpZ2h0OiAwO1xuICBwYWRkaW5nLXJpZ2h0OiA1NXB4O1xuICBib3JkZXItcmFkaXVzOiA1cHg7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICBhbmltYXRpb246ICR7KHByb3BzKSA9PiAocHJvcHMuaXNPcGVuID8gc2xpZGVEb3duIDogc2xpZGVVcCl9IDAuNHMgZWFzZSBmb3J3YXJkcztcbmA7XG5cbmV4cG9ydCBjb25zdCBMYW5nTWVudUl0ZW0gPSBzdHlsZWQubGlgXG4gIHBhZGRpbmc6IDEwcHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcmlnaHQ6IDA7XG4gIHRyYW5zaXRpb246IGJhY2tncm91bmQtY29sb3IgMC41cyBlYXNlLCBjb2xvciAwLjVzIGVhc2U7XG4gICY6aG92ZXIge1xuICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC44KTtcbiAgICBib3JkZXItcmFkaXVzOiA0MHB4O1xuICAgIGNvbG9yOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuY29sb3JzLnByaW1hcnl9O1xuICB9XG5gO1xuXG5leHBvcnQgY29uc3QgV29ybGRJY29uID0gc3R5bGVkKEZhR2xvYmUpYFxuICB3aWR0aDogMzJweDtcbiAgaGVpZ2h0OiAzMnB4O1xuICBtYXJnaW4tcmlnaHQ6IDEwcHg7XG5gO1xuXG5leHBvcnQgY29uc3QgU3R5bGVkTGFuZ1RleHQgPSBzdHlsZWQuc3BhbmBcbiAgZm9udC13ZWlnaHQ6IDUwMDtcbmA7XG5cbmV4cG9ydCBjb25zdCBBcnJvd0ljb24gPSBzdHlsZWQoRmFBbmdsZURvd24pYFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4zcyBlYXNlLWluLW91dDtcbiAgJHsoeyBvcGVuIH0pID0+XG4gICAgb3BlbiAmJlxuICAgIGNzc2BcbiAgICAgIGFuaW1hdGlvbjogcm90YXRlIDAuM3MgZWFzZS1pbi1vdXQ7XG4gICAgICB0cmFuc2Zvcm06IHJvdGF0ZSgxODBkZWcpO1xuICAgIGB9XG5gO1xuIl0sIm5hbWVzIjpbInN0eWxlZCIsImNzcyIsImtleWZyYW1lcyIsIkZhQW5nbGVEb3duIiwiRmFHbG9iZSIsIk5hdkJhckNvbnRhaW5lciIsIm5hdiIsIkxvZ28iLCJkaXYiLCJTcGFuIiwic3BhbiIsIk5hdkxpbmtzIiwidWwiLCJOYXZMaW5rIiwiYSIsIkhpZ2hsaWdodEJhciIsImhvdmVyZWRJbmRleCIsIndpZHRocyIsInBvc2l0aW9ucyIsIkxhbmdNZW51Q29udGFpbmVyIiwic2xpZGVEb3duIiwic2xpZGVVcCIsIkxhbmdNZW51IiwicHJvcHMiLCJpc09wZW4iLCJMYW5nTWVudUl0ZW0iLCJsaSIsInRoZW1lIiwiY29sb3JzIiwicHJpbWFyeSIsIldvcmxkSWNvbiIsIlN0eWxlZExhbmdUZXh0IiwiQXJyb3dJY29uIiwib3BlbiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/components/NavBar/NavBarDesktop.styles.js\n"));

/***/ })

});