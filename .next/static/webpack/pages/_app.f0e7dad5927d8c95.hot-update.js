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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ArrowIcon: () => (/* binding */ ArrowIcon),\n/* harmony export */   HighlightBar: () => (/* binding */ HighlightBar),\n/* harmony export */   LangMenu: () => (/* binding */ LangMenu),\n/* harmony export */   LangMenuContainer: () => (/* binding */ LangMenuContainer),\n/* harmony export */   LangMenuItem: () => (/* binding */ LangMenuItem),\n/* harmony export */   Logo: () => (/* binding */ Logo),\n/* harmony export */   NavBarContainer: () => (/* binding */ NavBarContainer),\n/* harmony export */   NavLink: () => (/* binding */ NavLink),\n/* harmony export */   NavLinks: () => (/* binding */ NavLinks),\n/* harmony export */   Span: () => (/* binding */ Span),\n/* harmony export */   StyledLangText: () => (/* binding */ StyledLangText),\n/* harmony export */   WorldIcon: () => (/* binding */ WorldIcon)\n/* harmony export */ });\n/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! styled-components */ \"./node_modules/styled-components/dist/styled-components.browser.esm.js\");\n/* harmony import */ var _barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! __barrel_optimize__?names=FaAngleDown,FaGlobe!=!react-icons/fa */ \"__barrel_optimize__?names=FaAngleDown,FaGlobe!=!./node_modules/react-icons/fa/index.mjs\");\n\n\nconst NavBarContainer = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].nav`\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px 20px;\n  background-color: #333;\n  color: white;\n  width: 100%;\n  background-color: transparent;\n  marging-right:10px;\n\n`;\nconst Logo = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].div`\n  font-weight: 800;\n  font-size: 28px;\n`;\nconst Span = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  font-weight: 400;\n`;\nconst NavLinks = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].ul`\n  display: flex;\n  gap: 50px;\n  list-style: none;\n  border-radius: 40px;\n  background-color: rgba(21, 62, 108, 0.34);\n  padding: 15px 30px;\n  border: 2px solid #0034ee;\n  position: relative;\n`;\nconst NavLink = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].a`\n  position: relative;\n  padding: 10px 20px;\n  color: white;\n  text-decoration: none;\n  font-size: 16px;\n  z-index: 1;\n  transition: color 0.3s ease;\n\n  &:hover {\n    color: #ddd;\n  }\n`;\nconst HighlightBar = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].div`\n  position: absolute;\n  bottom: 0;\n  left: ${({ hoveredIndex, tabCount, gap })=>hoveredIndex !== -1 ? `calc(${hoveredIndex / tabCount * 100}% + ${hoveredIndex * gap}px)` : \"0%\"};\nwidth: ${({ tabCount, gap })=>`calc(${100 / tabCount}% - px)`};\n  height: 100%;\n  background-color: rgba(21, 62, 108, 0.84);\n  border-radius: 999px;\n  transition: left 0.3s ease, width 0.3s ease;\n  z-index: 0;\n`;\nconst LangMenuContainer = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 5px;\n  position: relative;\n  margin-right: 25px;\n`;\nconst slideDown = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.keyframes)`\n  from {\n    max-height: 0;\n    opacity: 0;\n    padding-top: 0;\n    padding-bottom: 0;\n  }\n  to {\n    max-height: 200px;\n    opacity: 1;\n    padding-top: 10px;\n    padding-bottom: 10px;\n  }\n`;\nconst slideUp = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.keyframes)`\n  from {\n    max-height: 200px;\n    opacity: 1;\n    padding-top: 10px;\n    padding-bottom: 10px;\n  }\n  to {\n    max-height: 0;\n    opacity: 0;\n    padding-top: 0;\n    padding-bottom: 0;\n  }\n`;\nconst LangMenu = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].ul`\n  position: absolute;\n  list-style-type: none;\n  margin: 0;\n  background-color: transparent;\n  padding: 0;\n  right: 0;\n  padding-right: 55px;\n  border-radius: 5px;\n  max-height: 200px;\n  overflow: hidden;\n  animation: ${(props)=>props.isOpen ? slideDown : slideUp} 0.4s ease forwards;\n`;\nconst LangMenuItem = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].li`\n  padding: 10px;\n  cursor: pointer;\n  right: 0;\n  transition: background-color 0.5s ease, color 0.5s ease;\n  &:hover {\n    background-color: rgba(255, 255, 255, 0.8);\n    border-radius: 40px;\n    color: ${(props)=>props.theme.colors.primary};\n  }\n`;\nconst WorldIcon = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"])((0,_barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__.FaGlobe))`\n  width: 32px;\n  height: 32px;\n  margin-right: 10px;\n`;\nconst StyledLangText = styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"].span`\n  font-weight: 500;\n`;\nconst ArrowIcon = (0,styled_components__WEBPACK_IMPORTED_MODULE_0__[\"default\"])((0,_barrel_optimize_names_FaAngleDown_FaGlobe_react_icons_fa__WEBPACK_IMPORTED_MODULE_1__.FaAngleDown))`\n  transition: transform 0.3s ease-in-out;\n  ${({ open })=>open && (0,styled_components__WEBPACK_IMPORTED_MODULE_0__.css)`\n      animation: rotate 0.3s ease-in-out;\n      transform: rotate(180deg);\n    `}\n`;\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5zdHlsZXMuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBMkQ7QUFDTDtBQUMvQyxNQUFNSyxrQkFBa0JMLDZEQUFVLENBQUM7Ozs7Ozs7Ozs7O0FBVzFDLENBQUMsQ0FBQztBQUVLLE1BQU1PLE9BQU9QLDZEQUFVLENBQUM7OztBQUcvQixDQUFDLENBQUM7QUFFSyxNQUFNUyxPQUFPVCw4REFBVyxDQUFDOztBQUVoQyxDQUFDLENBQUM7QUFFSyxNQUFNVyxXQUFXWCw0REFBUyxDQUFDOzs7Ozs7Ozs7QUFTbEMsQ0FBQyxDQUFDO0FBR0ssTUFBTWEsVUFBVWIsMkRBQVEsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWWhDLENBQUMsQ0FBQztBQUVLLE1BQU1lLGVBQWVmLDZEQUFVLENBQUM7OztRQUcvQixFQUFFLENBQUMsRUFBRWdCLFlBQVksRUFBRUMsUUFBUSxFQUFFQyxHQUFHLEVBQUUsR0FDeENGLGlCQUFpQixDQUFDLElBQ2QsQ0FBQyxLQUFLLEVBQUUsZUFBZ0JDLFdBQVksSUFBSSxJQUFJLEVBQUVELGVBQWVFLElBQUksR0FBRyxDQUFDLEdBQ3JFLEtBQUs7T0FDSixFQUFFLENBQUMsRUFBRUQsUUFBUSxFQUFFQyxHQUFHLEVBQUUsR0FDekIsQ0FBQyxLQUFLLEVBQUUsTUFBTUQsU0FBUyxPQUFPLENBQUMsQ0FBQzs7Ozs7O0FBTWxDLENBQUMsQ0FBQztBQUVLLE1BQU1FLG9CQUFvQm5CLDhEQUFXLENBQUM7Ozs7Ozs7QUFPN0MsQ0FBQyxDQUFDO0FBRUYsTUFBTW9CLFlBQVlsQiw0REFBUyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBYTVCLENBQUM7QUFFRCxNQUFNbUIsVUFBVW5CLDREQUFTLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFhMUIsQ0FBQztBQUVNLE1BQU1vQixXQUFXdEIsNERBQVMsQ0FBQzs7Ozs7Ozs7Ozs7YUFXckIsRUFBRSxDQUFDdUIsUUFBV0EsTUFBTUMsTUFBTSxHQUFHSixZQUFZQyxRQUFTO0FBQy9ELENBQUMsQ0FBQztBQUVLLE1BQU1JLGVBQWV6Qiw0REFBUyxDQUFDOzs7Ozs7OztXQVEzQixFQUFFLENBQUN1QixRQUFVQSxNQUFNSSxLQUFLLENBQUNDLE1BQU0sQ0FBQ0MsT0FBTyxDQUFDOztBQUVuRCxDQUFDLENBQUM7QUFFSyxNQUFNQyxZQUFZOUIsNkRBQU1BLENBQUNJLGtHQUFPQSxDQUFDLENBQUM7Ozs7QUFJekMsQ0FBQyxDQUFDO0FBRUssTUFBTTJCLGlCQUFpQi9CLDhEQUFXLENBQUM7O0FBRTFDLENBQUMsQ0FBQztBQUVLLE1BQU1nQyxZQUFZaEMsNkRBQU1BLENBQUNHLHNHQUFXQSxDQUFDLENBQUM7O0VBRTNDLEVBQUUsQ0FBQyxFQUFFOEIsSUFBSSxFQUFFLEdBQ1RBLFFBQ0FoQyxzREFBRyxDQUFDOzs7SUFHSixDQUFDLENBQUM7QUFDTixDQUFDLENBQUMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYWMvRGVza3RvcC9PR0gvb2doTGFuZGluZy9zcmMvY29tcG9uZW50cy9OYXZCYXIvTmF2QmFyRGVza3RvcC5zdHlsZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0eWxlZCwgeyBjc3MsIGtleWZyYW1lcyB9IGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuaW1wb3J0IHsgRmFBbmdsZURvd24sIEZhR2xvYmUgfSBmcm9tIFwicmVhY3QtaWNvbnMvZmFcIjtcbmV4cG9ydCBjb25zdCBOYXZCYXJDb250YWluZXIgPSBzdHlsZWQubmF2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDEwcHggMjBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzMzMztcbiAgY29sb3I6IHdoaXRlO1xuICB3aWR0aDogMTAwJTtcbiAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gIG1hcmdpbmctcmlnaHQ6MTBweDtcblxuYDtcblxuZXhwb3J0IGNvbnN0IExvZ28gPSBzdHlsZWQuZGl2YFxuICBmb250LXdlaWdodDogODAwO1xuICBmb250LXNpemU6IDI4cHg7XG5gO1xuXG5leHBvcnQgY29uc3QgU3BhbiA9IHN0eWxlZC5zcGFuYFxuICBmb250LXdlaWdodDogNDAwO1xuYDtcblxuZXhwb3J0IGNvbnN0IE5hdkxpbmtzID0gc3R5bGVkLnVsYFxuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDUwcHg7XG4gIGxpc3Qtc3R5bGU6IG5vbmU7XG4gIGJvcmRlci1yYWRpdXM6IDQwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjEsIDYyLCAxMDgsIDAuMzQpO1xuICBwYWRkaW5nOiAxNXB4IDMwcHg7XG4gIGJvcmRlcjogMnB4IHNvbGlkICMwMDM0ZWU7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbmA7XG5cblxuZXhwb3J0IGNvbnN0IE5hdkxpbmsgPSBzdHlsZWQuYWBcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBwYWRkaW5nOiAxMHB4IDIwcHg7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICBmb250LXNpemU6IDE2cHg7XG4gIHotaW5kZXg6IDE7XG4gIHRyYW5zaXRpb246IGNvbG9yIDAuM3MgZWFzZTtcblxuICAmOmhvdmVyIHtcbiAgICBjb2xvcjogI2RkZDtcbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IEhpZ2hsaWdodEJhciA9IHN0eWxlZC5kaXZgXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgYm90dG9tOiAwO1xuICBsZWZ0OiAkeyh7IGhvdmVyZWRJbmRleCwgdGFiQ291bnQsIGdhcCB9KSA9PlxuICBob3ZlcmVkSW5kZXggIT09IC0xXG4gICAgPyBgY2FsYygkeyhob3ZlcmVkSW5kZXggLyB0YWJDb3VudCkgKiAxMDB9JSArICR7aG92ZXJlZEluZGV4ICogZ2FwfXB4KWBcbiAgICA6IFwiMCVcIn07XG53aWR0aDogJHsoeyB0YWJDb3VudCwgZ2FwIH0pID0+XG4gIGBjYWxjKCR7MTAwIC8gdGFiQ291bnR9JSAtIHB4KWB9O1xuICBoZWlnaHQ6IDEwMCU7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjEsIDYyLCAxMDgsIDAuODQpO1xuICBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgdHJhbnNpdGlvbjogbGVmdCAwLjNzIGVhc2UsIHdpZHRoIDAuM3MgZWFzZTtcbiAgei1pbmRleDogMDtcbmA7XG5cbmV4cG9ydCBjb25zdCBMYW5nTWVudUNvbnRhaW5lciA9IHN0eWxlZC5zcGFuYFxuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBnYXA6IDVweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBtYXJnaW4tcmlnaHQ6IDI1cHg7XG5gO1xuXG5jb25zdCBzbGlkZURvd24gPSBrZXlmcmFtZXNgXG4gIGZyb20ge1xuICAgIG1heC1oZWlnaHQ6IDA7XG4gICAgb3BhY2l0eTogMDtcbiAgICBwYWRkaW5nLXRvcDogMDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMDtcbiAgfVxuICB0byB7XG4gICAgbWF4LWhlaWdodDogMjAwcHg7XG4gICAgb3BhY2l0eTogMTtcbiAgICBwYWRkaW5nLXRvcDogMTBweDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMTBweDtcbiAgfVxuYDtcblxuY29uc3Qgc2xpZGVVcCA9IGtleWZyYW1lc2BcbiAgZnJvbSB7XG4gICAgbWF4LWhlaWdodDogMjAwcHg7XG4gICAgb3BhY2l0eTogMTtcbiAgICBwYWRkaW5nLXRvcDogMTBweDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMTBweDtcbiAgfVxuICB0byB7XG4gICAgbWF4LWhlaWdodDogMDtcbiAgICBvcGFjaXR5OiAwO1xuICAgIHBhZGRpbmctdG9wOiAwO1xuICAgIHBhZGRpbmctYm90dG9tOiAwO1xuICB9XG5gO1xuXG5leHBvcnQgY29uc3QgTGFuZ01lbnUgPSBzdHlsZWQudWxgXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xuICBtYXJnaW46IDA7XG4gIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICBwYWRkaW5nOiAwO1xuICByaWdodDogMDtcbiAgcGFkZGluZy1yaWdodDogNTVweDtcbiAgYm9yZGVyLXJhZGl1czogNXB4O1xuICBtYXgtaGVpZ2h0OiAyMDBweDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgYW5pbWF0aW9uOiAkeyhwcm9wcykgPT4gKHByb3BzLmlzT3BlbiA/IHNsaWRlRG93biA6IHNsaWRlVXApfSAwLjRzIGVhc2UgZm9yd2FyZHM7XG5gO1xuXG5leHBvcnQgY29uc3QgTGFuZ01lbnVJdGVtID0gc3R5bGVkLmxpYFxuICBwYWRkaW5nOiAxMHB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHJpZ2h0OiAwO1xuICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kLWNvbG9yIDAuNXMgZWFzZSwgY29sb3IgMC41cyBlYXNlO1xuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOCk7XG4gICAgYm9yZGVyLXJhZGl1czogNDBweDtcbiAgICBjb2xvcjogJHsocHJvcHMpID0+IHByb3BzLnRoZW1lLmNvbG9ycy5wcmltYXJ5fTtcbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IFdvcmxkSWNvbiA9IHN0eWxlZChGYUdsb2JlKWBcbiAgd2lkdGg6IDMycHg7XG4gIGhlaWdodDogMzJweDtcbiAgbWFyZ2luLXJpZ2h0OiAxMHB4O1xuYDtcblxuZXhwb3J0IGNvbnN0IFN0eWxlZExhbmdUZXh0ID0gc3R5bGVkLnNwYW5gXG4gIGZvbnQtd2VpZ2h0OiA1MDA7XG5gO1xuXG5leHBvcnQgY29uc3QgQXJyb3dJY29uID0gc3R5bGVkKEZhQW5nbGVEb3duKWBcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuM3MgZWFzZS1pbi1vdXQ7XG4gICR7KHsgb3BlbiB9KSA9PlxuICAgIG9wZW4gJiZcbiAgICBjc3NgXG4gICAgICBhbmltYXRpb246IHJvdGF0ZSAwLjNzIGVhc2UtaW4tb3V0O1xuICAgICAgdHJhbnNmb3JtOiByb3RhdGUoMTgwZGVnKTtcbiAgICBgfVxuYDtcbiJdLCJuYW1lcyI6WyJzdHlsZWQiLCJjc3MiLCJrZXlmcmFtZXMiLCJGYUFuZ2xlRG93biIsIkZhR2xvYmUiLCJOYXZCYXJDb250YWluZXIiLCJuYXYiLCJMb2dvIiwiZGl2IiwiU3BhbiIsInNwYW4iLCJOYXZMaW5rcyIsInVsIiwiTmF2TGluayIsImEiLCJIaWdobGlnaHRCYXIiLCJob3ZlcmVkSW5kZXgiLCJ0YWJDb3VudCIsImdhcCIsIkxhbmdNZW51Q29udGFpbmVyIiwic2xpZGVEb3duIiwic2xpZGVVcCIsIkxhbmdNZW51IiwicHJvcHMiLCJpc09wZW4iLCJMYW5nTWVudUl0ZW0iLCJsaSIsInRoZW1lIiwiY29sb3JzIiwicHJpbWFyeSIsIldvcmxkSWNvbiIsIlN0eWxlZExhbmdUZXh0IiwiQXJyb3dJY29uIiwib3BlbiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/components/NavBar/NavBarDesktop.styles.js\n"));

/***/ })

});