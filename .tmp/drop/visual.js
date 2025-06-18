var citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 165:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}


/***/ }),

/***/ 183:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _selection_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1882);


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(selector) {
  return typeof selector === "string"
      ? new _selection_index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN([[document.querySelector(selector)]], [document.documentElement])
      : new _selection_index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN([[selector]], _selection_index_js__WEBPACK_IMPORTED_MODULE_0__/* .root */ .zr);
}


/***/ }),

/***/ 202:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _window_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6747);


function dispatchEvent(node, type, params) {
  var window = (0,_window_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}


/***/ }),

/***/ 461:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}


/***/ }),

/***/ 477:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   C: () => (/* binding */ createTooltipServiceWrapper)
/* harmony export */ });
/* unused harmony export TooltipServiceWrapper */
/* harmony import */ var d3_selection__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4984);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1191);


function createTooltipServiceWrapper(tooltipService, rootElement, // this argument is deprecated and is optional now, just to maintain visuals with tooltiputils logic written for versions bellow 3.0.0
handleTouchDelay = _constants__WEBPACK_IMPORTED_MODULE_0__/* .DefaultHandleTouchDelay */ .G) {
    return new TooltipServiceWrapper({
        tooltipService: tooltipService,
        handleTouchDelay: handleTouchDelay,
    });
}
class TooltipServiceWrapper {
    constructor(options) {
        this.visualHostTooltipService = options.tooltipService;
        this.handleTouchDelay = options.handleTouchDelay;
    }
    addTooltip(selection, getTooltipInfoDelegate, getDataPointIdentity, reloadTooltipDataOnMouseMove) {
        if (!selection || !this.visualHostTooltipService.enabled()) {
            return;
        }
        const internalSelection = (0,d3_selection__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(selection.nodes());
        const callTooltip = (func, event, tooltipInfo, selectionIds) => {
            const coordinates = [event.clientX, event.clientY];
            func.call(this.visualHostTooltipService, {
                coordinates: coordinates,
                isTouchEvent: event.pointerType === "touch",
                dataItems: tooltipInfo,
                identities: selectionIds
            });
        };
        internalSelection.on("pointerover", (event, data) => {
            const tooltipInfo = getTooltipInfoDelegate(data);
            if (tooltipInfo == null) {
                return;
            }
            const selectionIds = getDataPointIdentity ? [getDataPointIdentity(data)] : [];
            if (event.pointerType === "mouse") {
                callTooltip(this.visualHostTooltipService.show, event, tooltipInfo, selectionIds);
            }
            if (event.pointerType === "touch") {
                this.handleTouchTimeoutId = window.setTimeout(() => {
                    callTooltip(this.visualHostTooltipService.show, event, tooltipInfo, selectionIds);
                    this.handleTouchTimeoutId = undefined;
                }, this.handleTouchDelay);
            }
        });
        internalSelection.on("pointerout", (event) => {
            if (event.pointerType === "mouse") {
                this.visualHostTooltipService.hide({
                    isTouchEvent: false,
                    immediately: false,
                });
            }
            if (event.pointerType === "touch") {
                this.cancelTouchTimeoutEvents();
            }
        });
        internalSelection.on("pointermove", (event, data) => {
            if (event.pointerType === "mouse") {
                let tooltipInfo;
                if (reloadTooltipDataOnMouseMove) {
                    tooltipInfo = getTooltipInfoDelegate(data);
                    if (tooltipInfo == null) {
                        return;
                    }
                }
                const selectionIds = getDataPointIdentity ? [getDataPointIdentity(data)] : [];
                callTooltip(this.visualHostTooltipService.move, event, tooltipInfo, selectionIds);
            }
        });
    }
    cancelTouchTimeoutEvents() {
        if (this.handleTouchTimeoutId) {
            clearTimeout(this.handleTouchTimeoutId);
        }
    }
    hide() {
        this.visualHostTooltipService.hide({ immediately: true, isTouchEvent: false });
    }
}
//# sourceMappingURL=tooltipService.js.map

/***/ }),

/***/ 574:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function none() {}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}


/***/ }),

/***/ 697:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}


/***/ }),

/***/ 747:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function empty() {
  return [];
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}


/***/ }),

/***/ 807:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return !this.node();
}


/***/ }),

/***/ 1191:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   G: () => (/* binding */ DefaultHandleTouchDelay)
/* harmony export */ });
const DefaultHandleTouchDelay = 500;
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ 1322:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function* __WEBPACK_DEFAULT_EXPORT__() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}


/***/ }),

/***/ 1429:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _creator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3663);
/* harmony import */ var _selector_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(574);



function constantNull() {
  return null;
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name, before) {
  var create = typeof name === "function" ? name : (0,_creator_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(name),
      select = before == null ? constantNull : typeof before === "function" ? before : (0,_selector_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}


/***/ }),

/***/ 1480:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   S: () => (/* binding */ VisualFormattingSettingsModel)
/* harmony export */ });
/* harmony import */ var powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7674);
/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */


var FormattingSettingsCard = powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.SimpleCard */ .z.Tn;
var FormattingSettingsModel = powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.Model */ .z.Kx;
const iconList = [
    { value: "none", displayName: "Nothing/Transparent" },
    { value: "hide", displayName: "Hide Icons Formatting" },
    { value: "accessibility", displayName: "Accessibility" },
    { value: "activity", displayName: "Activity" },
    { value: "alarm-clock", displayName: "Alarm Clock" },
    { value: "armchair", displayName: "Armchair" },
    { value: "badge-dollar-sign", displayName: "Dollar Sign Badge" },
    { value: "circle-dollar-sign", displayName: "Dollar Sign Circle" },
    { value: "dollar-sign", displayName: "Dollar Sign" },
    { value: "bed-double", displayName: "Bed Double" },
    { value: "bell-electric", displayName: "Bell Electric" },
    { value: "book-open", displayName: "Book Open" },
    { value: "brain", displayName: "Brain" },
    { value: "building", displayName: "Building Type A" },
    { value: "building-2", displayName: "Building Type B" },
    { value: "cabinet-filing", displayName: "Filing Cabinet" },
    { value: "calendar", displayName: "Calendar Type A" },
    { value: "calendar-check-2", displayName: "Calendar Type B" },
    { value: "calendar-range", displayName: "Calendar Type C" },
    { value: "chart-no-axes-combined", displayName: "Chart Type A" },
    { value: "chart-pie", displayName: "Chart Pie" },
    { value: "check", displayName: "Check" },
    { value: "check-check", displayName: "Check Check" },
    { value: "circle-alert", displayName: "Alert Circle" },
    { value: "circle-user-round", displayName: "User Circle" },
    { value: "citrus", displayName: "Citrus" },
    { value: "clock", displayName: "Clock" },
    { value: "coffee", displayName: "Coffee" },
    { value: "compass", displayName: "Compass" },
    { value: "database", displayName: "Database" },
    { value: "door-open", displayName: "Door Open" },
    { value: "dumbbell", displayName: "Dumbbell" },
    { value: "eye", displayName: "Eye" },
    { value: "farm", displayName: "Farm" },
    { value: "faucet", displayName: "Faucet" },
    { value: "ferris-wheel", displayName: "Ferris Wheel" },
    { value: "file", displayName: "File Type A" },
    { value: "file-badge-2", displayName: "File Type B" },
    { value: "fire-extinguisher", displayName: "Fire Extinguisher" },
    { value: "gamepad-2", displayName: "Game Pad" },
    { value: "goal", displayName: "Goal" },
    { value: "hammer", displayName: "Hammer" },
    { value: "house", displayName: "House" },
    { value: "house-plug", displayName: "House Plug" },
    { value: "houses", displayName: "Houses" },
    { value: "house-wifi", displayName: "House WiFi" },
    { value: "land-plot", displayName: "Land Plot" },
    { value: "leaf", displayName: "Leaf" },
    { value: "lock-keyhole", displayName: "Lock Keyhole" },
    { value: "mail", displayName: "Mail" },
    { value: "mails", displayName: "Mail Multiple" },
    { value: "map-pin", displayName: "Map Pin" },
    { value: "map-plus", displayName: "Map Plus" },
    { value: "medal", displayName: "Medal" },
    { value: "pencil", displayName: "Pencil" },
    { value: "phone", displayName: "Phone" },
    { value: "popcorn", displayName: "Popcorn" },
    { value: "recycle", displayName: "Recycle" },
    { value: "ruler", displayName: "Ruler" },
    { value: "scroll-text", displayName: "Scroll Text" },
    { value: "shield", displayName: "Shield" },
    { value: "ship", displayName: "Ship" },
    { value: "ship-wheel", displayName: "Ship Wheel" },
    { value: "sprout", displayName: "Sprout" },
    { value: "store", displayName: "Store" },
    { value: "target-arrow", displayName: "Target Arrow" },
    { value: "telescope", displayName: "Telescope" },
    { value: "tent-tree", displayName: "Tree Tent" },
    { value: "train-front-tunnel", displayName: "Train Tunnel" },
    { value: "trash-2", displayName: "Trash" },
    { value: "trees-forest", displayName: "Trees" },
    { value: "trending-up", displayName: "Trending Up" },
    { value: "triangle-alert", displayName: "Alert Triangle" },
    { value: "utensils", displayName: "Utensils" },
    { value: "waves", displayName: "Waves" },
    { value: "yin-yang", displayName: "Ying Yang" },
];
const iconTrendList = [
    { value: "arrow-#", displayName: "Arrow" },
    { value: "move-#", displayName: "Arrow Narrow Tall" },
    { value: "arrow-#-narrow-wide", displayName: "Arrow Narrow Steps" },
    { value: "chevron-#", displayName: "Chevron" },
    { value: "trending-#", displayName: "Trend" },
    { value: "none", displayName: "Nothing/Transparent" },
    { value: "hide", displayName: "Hide Trend Formatting" },
];
/**
 * Data Point Formatting Card
 */
class StyleCardSettings extends FormattingSettingsCard {
    name = "style";
    displayName = "Styles";
    primaryColour = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ColorPicker */ .z.sk({
        name: "primaryColour",
        displayName: "Primary Colour",
        value: { value: "#007681" },
    });
    secondaryColour = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ColorPicker */ .z.sk({
        name: "secondaryColour",
        displayName: "Secondary Colour",
        value: { value: "#FFFFFF" },
    });
    centerIconColour = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ColorPicker */ .z.sk({
        name: "centerIconColour",
        displayName: "Center Icon/Text Colour",
        value: { value: "#000000" },
    });
    bottomLeftIconColour = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ColorPicker */ .z.sk({
        name: "bottomLeftIconColour",
        displayName: "Bottom Left Icon/Text Colour",
        value: { value: "#FFFFFF" },
    });
    //footerTextRightBottom = new formattingSettings.FontControl({});
    centerIcon = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ItemDropdown */ .z.PA({
        name: "centerIcon",
        displayName: "Center Icon",
        items: iconList,
        value: iconList[0],
    });
    bottomLeftIcon = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ItemDropdown */ .z.PA({
        name: "bottomLeftIcon",
        displayName: "Bottom Left Icon",
        items: iconList,
        value: iconList[0],
    });
    trendIcon = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ItemDropdown */ .z.PA({
        name: "trendIcon",
        displayName: "Trend Icon",
        items: iconTrendList,
        value: iconTrendList[0],
    });
    borderRadius = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.Slider */ .z.Ap({
        name: "borderRadius",
        displayName: "Border Radius",
        value: 0,
        // optional input value validator
        options: {
            maxValue: {
                type: 1 /* powerbi.visuals.ValidatorType.Max */,
                value: 50,
            },
            minValue: {
                type: 0 /* powerbi.visuals.ValidatorType.Min */,
                value: 0,
            },
        },
    });
    slices = [
        this.primaryColour,
        this.secondaryColour,
        this.centerIconColour,
        this.bottomLeftIconColour,
        this.centerIcon,
        this.bottomLeftIcon,
        this.trendIcon,
        this.borderRadius,
    ];
}
class TextCardSetting extends powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.SimpleCard */ .z.Tn {
    name = "text"; // same as capabilities object name
    displayName = "Text";
    title_fontFamily = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontPicker */ .z.Cx({
        name: "title_fontFamily", // same as capabilities property name
        value: "Arial, sans-serif",
    });
    title_fontSize = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.NumUpDown */ .z.iB({
        name: "title_fontSize", // same as capabilities property name
        value: 21,
    });
    title_bold = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "title_bold", // same as capabilities property name
        value: true,
    });
    title_italic = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "title_italic", // same as capabilities property name
        value: false,
    });
    title_underline = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "title_underline", // same as capabilities property name
        value: false,
    });
    title_font = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontControl */ .z.tc({
        name: "title_font", // must be unique within the same object
        displayName: "Title Font",
        fontFamily: this.title_fontFamily,
        fontSize: this.title_fontSize,
        bold: this.title_bold, //optional
        italic: this.title_italic, //optional
        underline: this.title_underline, //optional
    });
    footer_text_top_fontFamily = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontPicker */ .z.Cx({
        name: "footer_text_top_fontFamily", // same as capabilities property name
        value: "Arial, sans-serif",
    });
    footer_text_top_fontSize = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.NumUpDown */ .z.iB({
        name: "footer_text_top_fontSize", // same as capabilities property name
        value: 21,
    });
    footer_text_top_bold = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "footer_text_top_bold", // same as capabilities property name
        value: false,
    });
    footer_text_top_italic = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "footer_text_top_italic", // same as capabilities property name
        value: false,
    });
    footer_text_top_underline = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "footer_text_top_underline", // same as capabilities property name
        value: false,
    });
    footer_text_top_font = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontControl */ .z.tc({
        name: "footer_text_top_font", // must be unique within the same object
        displayName: "Footer Top Font",
        fontFamily: this.footer_text_top_fontFamily,
        fontSize: this.footer_text_top_fontSize,
        bold: this.footer_text_top_bold, //optional
        italic: this.footer_text_top_italic, //optional
        underline: this.footer_text_top_underline, //optional
    });
    footer_text_bottom_fontFamily = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontPicker */ .z.Cx({
        name: "footer_text_bottom_fontFamily", // same as capabilities property name
        value: "Arial, sans-serif",
    });
    footer_text_bottom_fontSize = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.NumUpDown */ .z.iB({
        name: "footer_text_bottom_fontSize", // same as capabilities property name
        value: 21,
    });
    footer_text_bottom_bold = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "footer_text_bottom_bold", // same as capabilities property name
        value: false,
    });
    footer_text_bottom_italic = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "footer_text_bottom_italic", // same as capabilities property name
        value: false,
    });
    footer_text_bottom_underline = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "footer_text_bottom_underline", // same as capabilities property name
        value: false,
    });
    footer_text_bottom_font = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontControl */ .z.tc({
        name: "footer_text_bottom_font", // must be unique within the same object
        displayName: "Footer Bottom Font",
        fontFamily: this.footer_text_bottom_fontFamily,
        fontSize: this.footer_text_bottom_fontSize,
        bold: this.footer_text_bottom_bold, //optional
        italic: this.footer_text_bottom_italic, //optional
        underline: this.footer_text_bottom_underline, //optional
    });
    value_fontFamily = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontPicker */ .z.Cx({
        name: "value_fontFamily", // same as capabilities property name
        value: "Arial, sans-serif",
    });
    value_fontSize = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.NumUpDown */ .z.iB({
        name: "value_fontSize", // same as capabilities property name
        value: 46,
    });
    value_bold = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "value_bold", // same as capabilities property name
        value: false,
    });
    value_italic = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "value_italic", // same as capabilities property name
        value: false,
    });
    value_underline = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.ToggleSwitch */ .z.jF({
        name: "value_underline", // same as capabilities property name
        value: false,
    });
    value_font = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.FontControl */ .z.tc({
        name: "value_font", // must be unique within the same object
        displayName: "Value Font",
        fontFamily: this.value_fontFamily,
        fontSize: this.value_fontSize,
        bold: this.value_bold, //optional
        italic: this.value_italic, //optional
        underline: this.value_underline, //optional
    });
    title_alignment = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.AlignmentGroup */ .z.$n({
        name: "title_alignment",
        displayName: "Title Alignment",
        value: "center",
        mode: "horizontalAlignment" /* powerbi.visuals.AlignmentGroupMode.Horizonal */,
    });
    value_alignment = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.AlignmentGroup */ .z.$n({
        name: "value_alignment",
        displayName: "Value Alignment",
        value: "center",
        mode: "horizontalAlignment" /* powerbi.visuals.AlignmentGroupMode.Horizonal */,
    });
    footer_text_top_alignment = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.AlignmentGroup */ .z.$n({
        name: "footer_text_top_alignment",
        displayName: "Footer Top Alignment",
        value: "left",
        mode: "horizontalAlignment" /* powerbi.visuals.AlignmentGroupMode.Horizonal */,
    });
    footer_text_bottom_alignment = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .formattingSettings.AlignmentGroup */ .z.$n({
        name: "footer_text_bottom_alignment",
        displayName: "Footer Bottom Alignment",
        value: "left",
        mode: "horizontalAlignment" /* powerbi.visuals.AlignmentGroupMode.Horizonal */,
    });
    slices = [
        this.title_font,
        this.title_alignment,
        this.value_font,
        this.value_alignment,
        this.footer_text_top_font,
        this.footer_text_top_alignment,
        this.footer_text_bottom_font,
        this.footer_text_bottom_alignment,
    ];
}
/**
 * visual settings model class
 *
 */
class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    styleCard = new StyleCardSettings();
    textCard = new TextCardSetting();
    cards = [this.styleCard, this.textCard];
}


/***/ }),

/***/ 1882:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LN: () => (/* binding */ Selection),
/* harmony export */   zr: () => (/* binding */ root)
/* harmony export */ });
/* harmony import */ var _select_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7952);
/* harmony import */ var _selectAll_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9713);
/* harmony import */ var _selectChild_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7408);
/* harmony import */ var _selectChildren_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7867);
/* harmony import */ var _filter_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9734);
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(8664);
/* harmony import */ var _enter_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(4916);
/* harmony import */ var _exit_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(2672);
/* harmony import */ var _join_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(5232);
/* harmony import */ var _merge_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(7610);
/* harmony import */ var _order_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(4510);
/* harmony import */ var _sort_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(2920);
/* harmony import */ var _call_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(5152);
/* harmony import */ var _nodes_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(3455);
/* harmony import */ var _node_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(4784);
/* harmony import */ var _size_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(165);
/* harmony import */ var _empty_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(807);
/* harmony import */ var _each_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(2901);
/* harmony import */ var _attr_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(7339);
/* harmony import */ var _style_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(3683);
/* harmony import */ var _property_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(461);
/* harmony import */ var _classed_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(8235);
/* harmony import */ var _text_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(7499);
/* harmony import */ var _html_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(697);
/* harmony import */ var _raise_js__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(2582);
/* harmony import */ var _lower_js__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(9215);
/* harmony import */ var _append_js__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(8072);
/* harmony import */ var _insert_js__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(1429);
/* harmony import */ var _remove_js__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(3900);
/* harmony import */ var _clone_js__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(9063);
/* harmony import */ var _datum_js__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(9433);
/* harmony import */ var _on_js__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(5233);
/* harmony import */ var _dispatch_js__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(202);
/* harmony import */ var _iterator_js__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(1322);



































var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

function selection_selection() {
  return this;
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: _select_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A,
  selectAll: _selectAll_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A,
  selectChild: _selectChild_js__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .A,
  selectChildren: _selectChildren_js__WEBPACK_IMPORTED_MODULE_3__/* ["default"] */ .A,
  filter: _filter_js__WEBPACK_IMPORTED_MODULE_4__/* ["default"] */ .A,
  data: _data_js__WEBPACK_IMPORTED_MODULE_5__/* ["default"] */ .A,
  enter: _enter_js__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .A,
  exit: _exit_js__WEBPACK_IMPORTED_MODULE_7__/* ["default"] */ .A,
  join: _join_js__WEBPACK_IMPORTED_MODULE_8__/* ["default"] */ .A,
  merge: _merge_js__WEBPACK_IMPORTED_MODULE_9__/* ["default"] */ .A,
  selection: selection_selection,
  order: _order_js__WEBPACK_IMPORTED_MODULE_10__/* ["default"] */ .A,
  sort: _sort_js__WEBPACK_IMPORTED_MODULE_11__/* ["default"] */ .A,
  call: _call_js__WEBPACK_IMPORTED_MODULE_12__/* ["default"] */ .A,
  nodes: _nodes_js__WEBPACK_IMPORTED_MODULE_13__/* ["default"] */ .A,
  node: _node_js__WEBPACK_IMPORTED_MODULE_14__/* ["default"] */ .A,
  size: _size_js__WEBPACK_IMPORTED_MODULE_15__/* ["default"] */ .A,
  empty: _empty_js__WEBPACK_IMPORTED_MODULE_16__/* ["default"] */ .A,
  each: _each_js__WEBPACK_IMPORTED_MODULE_17__/* ["default"] */ .A,
  attr: _attr_js__WEBPACK_IMPORTED_MODULE_18__/* ["default"] */ .A,
  style: _style_js__WEBPACK_IMPORTED_MODULE_19__/* ["default"] */ .A,
  property: _property_js__WEBPACK_IMPORTED_MODULE_20__/* ["default"] */ .A,
  classed: _classed_js__WEBPACK_IMPORTED_MODULE_21__/* ["default"] */ .A,
  text: _text_js__WEBPACK_IMPORTED_MODULE_22__/* ["default"] */ .A,
  html: _html_js__WEBPACK_IMPORTED_MODULE_23__/* ["default"] */ .A,
  raise: _raise_js__WEBPACK_IMPORTED_MODULE_24__/* ["default"] */ .A,
  lower: _lower_js__WEBPACK_IMPORTED_MODULE_25__/* ["default"] */ .A,
  append: _append_js__WEBPACK_IMPORTED_MODULE_26__/* ["default"] */ .A,
  insert: _insert_js__WEBPACK_IMPORTED_MODULE_27__/* ["default"] */ .A,
  remove: _remove_js__WEBPACK_IMPORTED_MODULE_28__/* ["default"] */ .A,
  clone: _clone_js__WEBPACK_IMPORTED_MODULE_29__/* ["default"] */ .A,
  datum: _datum_js__WEBPACK_IMPORTED_MODULE_30__/* ["default"] */ .A,
  on: _on_js__WEBPACK_IMPORTED_MODULE_31__/* ["default"] */ .A,
  dispatch: _dispatch_js__WEBPACK_IMPORTED_MODULE_32__/* ["default"] */ .A,
  [Symbol.iterator]: _iterator_js__WEBPACK_IMPORTED_MODULE_33__/* ["default"] */ .A
};

/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (selection)));


/***/ }),

/***/ 2582:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return this.each(raise);
}


/***/ }),

/***/ 2672:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _sparse_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6732);
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1882);



/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return new _index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN(this._exit || this._groups.map(_sparse_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A), this._parents);
}


/***/ }),

/***/ 2901:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}


/***/ }),

/***/ 2920:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1882);


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new _index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}


/***/ }),

/***/ 3455:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return Array.from(this);
}


/***/ }),

/***/ 3663:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _namespace_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7268);
/* harmony import */ var _namespaces_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7947);



function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === _namespaces_js__WEBPACK_IMPORTED_MODULE_0__/* .xhtml */ .g && document.documentElement.namespaceURI === _namespaces_js__WEBPACK_IMPORTED_MODULE_0__/* .xhtml */ .g
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name) {
  var fullname = (0,_namespace_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}


/***/ }),

/***/ 3683:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony export styleValue */
/* harmony import */ var _window_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6747);


function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove : typeof value === "function"
            ? styleFunction
            : styleConstant)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || (0,_window_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(node).getComputedStyle(node, null).getPropertyValue(name);
}


/***/ }),

/***/ 3900:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return this.each(remove);
}


/***/ }),

/***/ 4510:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}


/***/ }),

/***/ 4784:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}


/***/ }),

/***/ 4916:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   L: () => (/* binding */ EnterNode)
/* harmony export */ });
/* harmony import */ var _sparse_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6732);
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1882);



/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return new _index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN(this._enter || this._groups.map(_sparse_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};


/***/ }),

/***/ 4984:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5478);
/* harmony import */ var _selection_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1882);



/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(selector) {
  return typeof selector === "string"
      ? new _selection_index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN([document.querySelectorAll(selector)], [document.documentElement])
      : new _selection_index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN([(0,_array_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(selector)], _selection_index_js__WEBPACK_IMPORTED_MODULE_0__/* .root */ .zr);
}


/***/ }),

/***/ 5152:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}


/***/ }),

/***/ 5232:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}


/***/ }),

/***/ 5233:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}


/***/ }),

/***/ 5478:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ array)
/* harmony export */ });
// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}


/***/ }),

/***/ 6541:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   j: () => (/* binding */ childMatcher)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}



/***/ }),

/***/ 6667:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony export FormattingSettingsService */
/* harmony import */ var _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9754);

class FormattingSettingsService {
    constructor(localizationManager) {
        this.localizationManager = localizationManager;
    }
    /**
     * Build visual formatting settings model from metadata dataView
     *
     * @param dataViews metadata dataView object
     * @returns visual formatting settings model
     */
    populateFormattingSettingsModel(typeClass, dataView) {
        var _a, _b;
        const defaultSettings = new typeClass();
        const dataViewObjects = (_a = dataView === null || dataView === void 0 ? void 0 : dataView.metadata) === null || _a === void 0 ? void 0 : _a.objects;
        if (dataViewObjects) {
            // loop over each formatting property and set its new value if exists
            (_b = defaultSettings.cards) === null || _b === void 0 ? void 0 : _b.forEach((card) => {
                var _a;
                if (card instanceof _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__/* .CompositeCard */ .St)
                    (_a = card.topLevelSlice) === null || _a === void 0 ? void 0 : _a.setPropertiesValues(dataViewObjects, card.name);
                const cardGroupInstances = (card instanceof _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__/* .SimpleCard */ .Tn ? [card] : card.groups);
                cardGroupInstances.forEach((cardGroupInstance) => {
                    var _a, _b, _c, _d;
                    // Set current top level toggle value
                    (_a = cardGroupInstance.topLevelSlice) === null || _a === void 0 ? void 0 : _a.setPropertiesValues(dataViewObjects, card.name);
                    (_b = cardGroupInstance === null || cardGroupInstance === void 0 ? void 0 : cardGroupInstance.slices) === null || _b === void 0 ? void 0 : _b.forEach((slice) => {
                        slice === null || slice === void 0 ? void 0 : slice.setPropertiesValues(dataViewObjects, card.name);
                    });
                    (_d = (_c = cardGroupInstance === null || cardGroupInstance === void 0 ? void 0 : cardGroupInstance.container) === null || _c === void 0 ? void 0 : _c.containerItems) === null || _d === void 0 ? void 0 : _d.forEach((containerItem) => {
                        var _a;
                        (_a = containerItem === null || containerItem === void 0 ? void 0 : containerItem.slices) === null || _a === void 0 ? void 0 : _a.forEach((slice) => {
                            slice === null || slice === void 0 ? void 0 : slice.setPropertiesValues(dataViewObjects, card.name);
                        });
                    });
                });
            });
        }
        return defaultSettings;
    }
    /**
     * Build formatting model by parsing formatting settings model object
     *
     * @returns powerbi visual formatting model
     */
    buildFormattingModel(formattingSettingsModel) {
        const formattingModel = {
            cards: []
        };
        formattingSettingsModel.cards
            .filter(({ visible = true }) => visible)
            .forEach((card) => {
            var _a;
            const formattingCard = {
                displayName: (this.localizationManager && card.displayNameKey) ? this.localizationManager.getDisplayName(card.displayNameKey) : card.displayName,
                description: (this.localizationManager && card.descriptionKey) ? this.localizationManager.getDisplayName(card.descriptionKey) : card.description,
                groups: [],
                uid: card.name + "-card",
                analyticsPane: card.analyticsPane,
            };
            const objectName = card.name;
            if (card.topLevelSlice) {
                const topLevelToggleSlice = card.topLevelSlice.getFormattingSlice(objectName, this.localizationManager);
                topLevelToggleSlice.suppressDisplayName = true;
                formattingCard.topLevelToggle = topLevelToggleSlice;
            }
            (_a = card.onPreProcess) === null || _a === void 0 ? void 0 : _a.call(card);
            const isSimpleCard = card instanceof _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__/* .SimpleCard */ .Tn;
            const cardGroupInstances = (isSimpleCard ?
                [card].filter(({ visible = true }) => visible) :
                card.groups.filter(({ visible = true }) => visible));
            cardGroupInstances
                .forEach((cardGroupInstance) => {
                const groupUid = cardGroupInstance.name + "-group";
                // Build formatting group for each group
                const formattingGroup = {
                    displayName: isSimpleCard ? undefined : (this.localizationManager && cardGroupInstance.displayNameKey)
                        ? this.localizationManager.getDisplayName(cardGroupInstance.displayNameKey) : cardGroupInstance.displayName,
                    description: isSimpleCard ? undefined : (this.localizationManager && cardGroupInstance.descriptionKey)
                        ? this.localizationManager.getDisplayName(cardGroupInstance.descriptionKey) : cardGroupInstance.description,
                    slices: [],
                    uid: groupUid,
                    collapsible: cardGroupInstance.collapsible,
                    delaySaveSlices: cardGroupInstance.delaySaveSlices,
                    disabled: cardGroupInstance.disabled,
                    disabledReason: cardGroupInstance.disabledReason,
                };
                formattingCard.groups.push(formattingGroup);
                // In case formatting model adds data points or top categories (Like when you modify specific visual category color).
                // these categories use same object name and property name from capabilities and the generated uid will be the same for these formatting categories properties
                // Solution => Save slice names to modify each slice uid to be unique by adding counter value to the new slice uid
                const sliceNames = {};
                // Build formatting container slice for each property
                if (cardGroupInstance.container) {
                    const container = cardGroupInstance.container;
                    const containerUid = groupUid + "-container";
                    const formattingContainer = {
                        displayName: (this.localizationManager && container.displayNameKey)
                            ? this.localizationManager.getDisplayName(container.displayNameKey) : container.displayName,
                        description: (this.localizationManager && container.descriptionKey)
                            ? this.localizationManager.getDisplayName(container.descriptionKey) : container.description,
                        containerItems: [],
                        uid: containerUid
                    };
                    container.containerItems.forEach((containerItem) => {
                        // Build formatting container item object
                        const containerIemName = containerItem.displayNameKey ? containerItem.displayNameKey : containerItem.displayName;
                        const containerItemUid = containerUid + containerIemName;
                        const formattingContainerItem = {
                            displayName: (this.localizationManager && containerItem.displayNameKey)
                                ? this.localizationManager.getDisplayName(containerItem.displayNameKey) : containerItem.displayName,
                            slices: [],
                            uid: containerItemUid
                        };
                        // Build formatting slices and add them to current formatting container item
                        this.buildFormattingSlices({ slices: containerItem.slices, objectName, sliceNames, formattingSlices: formattingContainerItem.slices });
                        formattingContainer.containerItems.push(formattingContainerItem);
                    });
                    formattingGroup.container = formattingContainer;
                }
                if (cardGroupInstance.slices) {
                    if (cardGroupInstance.topLevelSlice) {
                        const topLevelToggleSlice = cardGroupInstance.topLevelSlice.getFormattingSlice(objectName, this.localizationManager);
                        topLevelToggleSlice.suppressDisplayName = true;
                        (formattingGroup.displayName == undefined ? formattingCard : formattingGroup).topLevelToggle = topLevelToggleSlice;
                    }
                    // Build formatting slice for each property
                    this.buildFormattingSlices({ slices: cardGroupInstance.slices, objectName, sliceNames, formattingSlices: formattingGroup.slices });
                }
            });
            formattingCard.revertToDefaultDescriptors = this.getRevertToDefaultDescriptor(card);
            formattingModel.cards.push(formattingCard);
        });
        return formattingModel;
    }
    buildFormattingSlices({ slices, objectName, sliceNames, formattingSlices }) {
        // Filter slices based on their visibility
        slices === null || slices === void 0 ? void 0 : slices.filter(({ visible = true }) => visible).forEach((slice) => {
            const formattingSlice = slice === null || slice === void 0 ? void 0 : slice.getFormattingSlice(objectName, this.localizationManager);
            if (formattingSlice) {
                // Modify formatting slice uid if needed
                if (sliceNames[slice.name] === undefined) {
                    sliceNames[slice.name] = 0;
                }
                else {
                    sliceNames[slice.name]++;
                    formattingSlice.uid = `${formattingSlice.uid}-${sliceNames[slice.name]}`;
                }
                formattingSlices.push(formattingSlice);
            }
        });
    }
    getRevertToDefaultDescriptor(card) {
        var _a;
        // Proceeded slice names are saved to prevent duplicated default descriptors in case of using 
        // formatting categories & selectors, since they have the same descriptor objectName and propertyName
        const sliceNames = {};
        const revertToDefaultDescriptors = [];
        let cardSlicesDefaultDescriptors;
        let cardContainerSlicesDefaultDescriptors = [];
        // eslint-disable-next-line
        if (card instanceof _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__/* .CompositeCard */ .St && card.topLevelSlice)
            revertToDefaultDescriptors.push(...(_a = card.topLevelSlice) === null || _a === void 0 ? void 0 : _a.getRevertToDefaultDescriptor(card.name));
        const cardGroupInstances = (card instanceof _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__/* .SimpleCard */ .Tn ?
            [card].filter(({ visible = true }) => visible) :
            card.groups.filter(({ visible = true }) => visible));
        cardGroupInstances.forEach((cardGroupInstance) => {
            var _a, _b;
            cardSlicesDefaultDescriptors = this.getSlicesRevertToDefaultDescriptor(card.name, cardGroupInstance.slices, sliceNames, cardGroupInstance.topLevelSlice);
            (_b = (_a = cardGroupInstance.container) === null || _a === void 0 ? void 0 : _a.containerItems) === null || _b === void 0 ? void 0 : _b.forEach((containerItem) => {
                cardContainerSlicesDefaultDescriptors = cardContainerSlicesDefaultDescriptors.concat(this.getSlicesRevertToDefaultDescriptor(card.name, containerItem.slices, sliceNames));
            });
            revertToDefaultDescriptors.push(...cardSlicesDefaultDescriptors.concat(cardContainerSlicesDefaultDescriptors));
        });
        return revertToDefaultDescriptors;
    }
    getSlicesRevertToDefaultDescriptor(cardName, slices, sliceNames, topLevelSlice) {
        let revertToDefaultDescriptors = [];
        if (topLevelSlice) {
            sliceNames[topLevelSlice.name] = true;
            revertToDefaultDescriptors = revertToDefaultDescriptors.concat(topLevelSlice.getRevertToDefaultDescriptor(cardName));
        }
        slices === null || slices === void 0 ? void 0 : slices.forEach((slice) => {
            if (slice && !sliceNames[slice.name]) {
                sliceNames[slice.name] = true;
                revertToDefaultDescriptors = revertToDefaultDescriptors.concat(slice.getRevertToDefaultDescriptor(cardName));
            }
        });
        return revertToDefaultDescriptors;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FormattingSettingsService);
//# sourceMappingURL=FormattingSettingsService.js.map

/***/ }),

/***/ 6732:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(update) {
  return new Array(update.length);
}


/***/ }),

/***/ 6747:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}


/***/ }),

/***/ 7268:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _namespaces_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7947);


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return _namespaces_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A.hasOwnProperty(prefix) ? {space: _namespaces_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}


/***/ }),

/***/ 7339:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _namespace_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7268);


function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name, value) {
  var fullname = (0,_namespace_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)
      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
}


/***/ }),

/***/ 7408:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _matcher_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6541);


var find = Array.prototype.find;

function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : (0,_matcher_js__WEBPACK_IMPORTED_MODULE_0__/* .childMatcher */ .j)(match)));
}


/***/ }),

/***/ 7499:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
}


/***/ }),

/***/ 7610:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1882);


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new _index_js__WEBPACK_IMPORTED_MODULE_0__/* .Selection */ .LN(merges, this._parents);
}


/***/ }),

/***/ 7674:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   O: () => (/* reexport safe */ _FormattingSettingsService__WEBPACK_IMPORTED_MODULE_1__.A),
/* harmony export */   z: () => (/* reexport module object */ _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__)
/* harmony export */ });
/* harmony import */ var _FormattingSettingsComponents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9754);
/* harmony import */ var _FormattingSettingsService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6667);



//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7867:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _matcher_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6541);


var filter = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : (0,_matcher_js__WEBPACK_IMPORTED_MODULE_0__/* .childMatcher */ .j)(match)));
}


/***/ }),

/***/ 7947:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   g: () => (/* binding */ xhtml)
/* harmony export */ });
var xhtml = "http://www.w3.org/1999/xhtml";

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
});


/***/ }),

/***/ 7952:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1882);
/* harmony import */ var _selector_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);



/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(select) {
  if (typeof select !== "function") select = (0,_selector_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new _index_js__WEBPACK_IMPORTED_MODULE_1__/* .Selection */ .LN(subgroups, this._parents);
}


/***/ }),

/***/ 8072:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _creator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3663);


/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name) {
  var create = typeof name === "function" ? name : (0,_creator_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}


/***/ }),

/***/ 8235:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}


/***/ }),

/***/ 8639:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   D: () => (/* binding */ getPropertyValue),
/* harmony export */   y: () => (/* binding */ getDescriptor)
/* harmony export */ });
/**
 * Build and return formatting descriptor for simple slice
 *
 * @param objectName Object name from capabilities
 * @param slice formatting simple slice
 * @returns simple slice formatting descriptor
 */
function getDescriptor(objectName, slice) {
    return {
        objectName: objectName,
        propertyName: slice.name,
        selector: slice.selector,
        altConstantValueSelector: slice.altConstantSelector,
        instanceKind: slice.instanceKind
    };
}
/**
 * Get property value from dataview objects if exists
 * Else return the default value from formatting settings object
 *
 * @param value dataview object value
 * @param defaultValue formatting settings default value
 * @returns formatting property value
 */
function getPropertyValue(slice, value, defaultValue) {
    if (value == null || (typeof value === "object" && !value.solid)) {
        return defaultValue;
    }
    if (value.solid) {
        return { value: value === null || value === void 0 ? void 0 : value.solid.color };
    }
    if ((slice === null || slice === void 0 ? void 0 : slice.type) === "Dropdown" /* visuals.FormattingComponent.Dropdown */ && slice.items) {
        const itemsArray = slice.items;
        return itemsArray.find(item => item.value == value);
    }
    return value;
}
//# sourceMappingURL=FormattingSettingsUtils.js.map

/***/ }),

/***/ 8664:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1882);
/* harmony import */ var _enter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4916);
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9731);




function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new _enter_js__WEBPACK_IMPORTED_MODULE_0__/* .EnterNode */ .L(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new _enter_js__WEBPACK_IMPORTED_MODULE_0__/* .EnterNode */ .L(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = (0,_constant_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new _index_js__WEBPACK_IMPORTED_MODULE_2__/* .Selection */ .LN(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}


/***/ }),

/***/ 8849:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   b: () => (/* binding */ Visual)
/* harmony export */ });
/* harmony import */ var powerbi_visuals_utils_tooltiputils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(477);
/* harmony import */ var d3_selection__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(183);
/* harmony import */ var powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7674);
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1480);
/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */






class Visual {
    target;
    formattingSettings;
    formattingSettingsService;
    main_content;
    header_middle_content;
    header_content;
    header_text;
    header_text_icon;
    middle_content;
    middle_content_center;
    middle_content_center_icon;
    middle_content_center_text;
    middle_content_center_trend;
    middle_content_center_trend_icon;
    middle_content_center_trend_text;
    footer_content;
    footer_content_left;
    footer_content_left_icon;
    footer_content_right;
    footer_content_right_text_top;
    footer_content_right_text_bottom;
    tooltipServiceWrapper;
    constructor(options) {
        this.formattingSettingsService = new powerbi_visuals_utils_formattingmodel__WEBPACK_IMPORTED_MODULE_0__/* .FormattingSettingsService */ .O();
        this.target = options.element;
        this.tooltipServiceWrapper = (0,powerbi_visuals_utils_tooltiputils__WEBPACK_IMPORTED_MODULE_2__/* .createTooltipServiceWrapper */ .C)(options.host.tooltipService, options.element);
        if (document) {
            /*###########################################################
              CREATE HEADER ELEMENTS
            ###########################################################*/
            this.header_content = document.createElement("div");
            this.header_content.className = "flex-container-header";
            //CREATE TEXT ELEMENT
            this.header_text = document.createElement("p");
            this.header_text.innerText = "";
            this.header_text_icon = document.createElement("div");
            this.header_text_icon.className = "header-icon ";
            this.swapSVGIcon("info", "#808080", this.header_text_icon);
            //APPEND ELEMENTS TO HEADER
            this.header_content.appendChild(this.header_text_icon);
            this.header_content.appendChild(this.header_text);
            /*###########################################################
              CREATE MIDDLE ICON AND VALUE TEXT
            ###########################################################*/
            this.middle_content_center_text = document.createElement("p");
            this.middle_content_center_text.innerText = "";
            this.middle_content_center_icon = document.createElement("div");
            this.middle_content_center_icon.className = "middle-icon ";
            this.swapSVGIcon("loading", "#808080", this.middle_content_center_icon);
            /*######################
              CREATE MIDDLE TREND LINE
            ########################*/
            this.middle_content_center_trend_icon = document.createElement("div");
            this.middle_content_center_trend_icon.className = "middle-trend-icon";
            this.swapSVGIcon("arrow-up", "#4CBB17", this.middle_content_center_trend_icon);
            this.swapSVGIcon("arrow-up", "#ED1C24", this.middle_content_center_trend_icon);
            //#ED1C24
            this.middle_content_center_trend_text = document.createElement("p");
            this.middle_content_center_trend_text.innerText = "-2.57%";
            this.middle_content_center_trend = document.createElement("div");
            this.middle_content_center_trend.className = "flex-container-header";
            this.middle_content_center_trend.appendChild(this.middle_content_center_trend_text);
            this.middle_content_center_trend.appendChild(this.middle_content_center_trend_icon);
            /*######################
              ATTACH MIDDLE COMPONENTS
            ########################*/
            this.middle_content_center = document.createElement("div");
            this.middle_content_center.className = "middle-content ";
            this.middle_content_center.appendChild(this.middle_content_center_icon);
            this.middle_content_center.appendChild(this.middle_content_center_text);
            this.middle_content_center.appendChild(this.middle_content_center_trend);
            this.middle_content = document.createElement("div");
            this.middle_content.className = "flex-container-middle";
            this.middle_content.appendChild(this.middle_content_center);
            /*###########################################################
              CREATE MIDDLE + HEADER ELEMENTS
            ###########################################################*/
            this.header_middle_content = document.createElement("div");
            this.header_middle_content.className = "headerMiddle";
            this.header_middle_content.appendChild(this.header_content);
            this.header_middle_content.appendChild(this.middle_content);
            /*###########################################################
              CREATE FOOTER ELEMENTS
            ###########################################################*/
            //############### CREATE LEFT FOOTER SECTION ###############
            this.footer_content_left_icon = document.createElement("div");
            this.footer_content_left_icon.className = "footer-icon ";
            this.swapSVGIcon("loading", "#FFFFFF", this.footer_content_left_icon);
            this.footer_content_left = document.createElement("div");
            this.footer_content_left.className = "flex-item-left";
            this.footer_content_left.appendChild(this.footer_content_left_icon);
            //############### CREATE RIGHT FOOTER SECTION ###############
            //TOP TEXT
            this.footer_content_right_text_top = document.createElement("p");
            this.footer_content_right_text_top.innerText = "";
            //BOTTOM TEXT
            this.footer_content_right_text_bottom = document.createElement("p");
            this.footer_content_right_text_bottom.innerText = "";
            //ATTACH TEXT TO CONTENT
            this.footer_content_right = document.createElement("div");
            this.footer_content_right.className = "flex-item-right";
            this.footer_content_right.appendChild(this.footer_content_right_text_top);
            this.footer_content_right.appendChild(this.footer_content_right_text_bottom);
            //############### CREATE FOOTER CONTAINER ###############
            this.footer_content = document.createElement("div");
            this.footer_content.className = "flex-container-footer";
            //ATTACH LEFT AND RIGHT CONTAINERS
            this.footer_content.appendChild(this.footer_content_left);
            this.footer_content.appendChild(this.footer_content_right);
            /*###########################################################
              CREATE MAIN CONTAINER ELEMENTS
            ###########################################################*/
            this.main_content = document.createElement("div");
            this.main_content.className = "mainBody";
            this.main_content.appendChild(this.header_middle_content);
            this.main_content.appendChild(this.footer_content);
            //this.target.hidden = true;
            /*###########################################################
              SET DEFAULT COLOURS/LOADING
            ###########################################################*/
            this.main_content.style.borderColor = "#808080";
            this.main_content.style.backgroundColor = "#808080";
            this.header_middle_content.style.backgroundColor = "#E6E6E6";
            this.middle_content_center_text.style.color = "#000000";
            this.header_text.style.color = "#000000";
            this.footer_content_right_text_top.style.color = "#FFFFFF";
            this.footer_content_right_text_bottom.style.color = "#FFFFFF";
            let width = options.element.clientWidth;
            let height = options.element.clientHeight;
            let padding = 5;
            this.main_content.style.width = width - padding * 2 + "px";
            this.main_content.style.height = height - padding + "px";
            /*##################################################################
            TITLE FONT DEFAULTS
           ##################################################################*/
            this.header_text.style.margin = "0px";
            this.header_text.style.paddingTop = "5px";
            this.header_text.style.fontFamily = "Arial";
            this.header_text.style.fontSize = "21px";
            this.header_text.style.fontStyle = "normal";
            this.header_text.style.fontWeight = "bold";
            this.header_text.style.textDecoration = "normal";
            this.header_content.style.justifyContent = "center";
            this.header_text.style.textAlign = "center";
            /*##################################################################
            VALUE FONT DEFAULTS
           ##################################################################*/
            this.middle_content_center_text.style.margin = "0px";
            this.middle_content_center_text.style.fontFamily = "Arial";
            this.middle_content_center_text.style.fontSize = "46px";
            this.middle_content_center_text.style.fontStyle = "normal";
            this.middle_content_center_text.style.fontWeight = "normal";
            this.middle_content_center_text.style.textDecoration = "normal";
            this.middle_content_center.style.float = "";
            /*##################################################################
            TREND FONT DEFAULTS
           ##################################################################*/
            this.middle_content_center_trend_text.style.margin = "0px";
            this.middle_content_center_trend_text.style.fontFamily = "Arial";
            this.middle_content_center_trend_text.style.fontSize = "21px";
            this.middle_content_center_trend_text.style.fontStyle = "normal";
            this.middle_content_center_trend_text.style.fontWeight = "normal";
            this.middle_content_center_trend_text.style.textDecoration = "normal";
            /*##################################################################
            FOOTER TOP TEXT DEFAULTS
           ##################################################################*/
            this.footer_content_right_text_top.style.margin = "0px";
            this.footer_content_right_text_top.style.fontFamily = "Arial";
            this.footer_content_right_text_top.style.fontSize = "21px";
            this.footer_content_right_text_top.style.fontStyle = "normal";
            this.footer_content_right_text_top.style.fontWeight = "normal";
            this.footer_content_right_text_top.style.textDecoration = "normal";
            this.footer_content_right_text_top.style.textAlign = "left";
            /*##################################################################
            FOOTER BOTTOM TEXT DEFAULTS
           ##################################################################*/
            this.footer_content_right_text_bottom.style.margin = "0px";
            this.footer_content_right_text_bottom.style.fontFamily = "Arial";
            this.footer_content_right_text_bottom.style.fontSize = "21px";
            this.footer_content_right_text_bottom.style.fontStyle = "normal";
            this.footer_content_right_text_bottom.style.fontWeight = "normal";
            this.footer_content_right_text_bottom.style.textDecoration = "normal";
            this.footer_content_right_text_bottom.style.textAlign = "left";
            this.target.appendChild(this.main_content);
        }
    }
    update(options) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(_settings__WEBPACK_IMPORTED_MODULE_1__/* .VisualFormattingSettingsModel */ .S, options.dataViews[0]);
        //this.target.hidden = false;
        const textCard = this.formattingSettings.textCard;
        const styleCard = this.formattingSettings.styleCard;
        let width = options.viewport.width;
        let height = options.viewport.height;
        let padding = 5;
        this.main_content.style.width = width - padding * 2 + "px";
        this.main_content.style.height = height - padding + "px";
        width = width - padding;
        height = height - padding;
        /*##################################################################
          SET COLOURS
         ##################################################################*/
        const primaryColour = styleCard.primaryColour.value.value;
        const secondaryColour = styleCard.secondaryColour.value.value;
        const centerIconColour = styleCard.centerIconColour.value.value;
        const bottomIconColour = styleCard.bottomLeftIconColour.value.value;
        const trendUpColour = "#4CBB17";
        const trendDownColour = "#ED1C24";
        this.main_content.style.borderColor = primaryColour;
        this.main_content.style.backgroundColor = primaryColour;
        this.header_middle_content.style.backgroundColor = secondaryColour;
        this.middle_content_center_text.style.color = centerIconColour;
        this.header_text.style.color = centerIconColour;
        this.footer_content_right_text_top.style.color = bottomIconColour;
        this.footer_content_right_text_bottom.style.color = bottomIconColour;
        /*##################################################################
          SET BORDER RADIUS
         ##################################################################*/
        const borderRadius = styleCard.borderRadius.value + "px";
        this.header_middle_content.style.borderRadius = borderRadius;
        this.main_content.style.borderRadius = borderRadius;
        if (styleCard.borderRadius.value >= 20) {
            const newPadding = styleCard.borderRadius.value - 10;
            this.header_text_icon.style.paddingRight = newPadding + "px";
        }
        /*##################################################################
          SET ICONS
         ##################################################################*/
        const bottomIconSelected = styleCard.bottomLeftIcon.value.value;
        const middleIconSelected = styleCard.centerIcon.value.value;
        const trendIconSelected = styleCard.trendIcon.value.value;
        if (middleIconSelected === "hide") {
            this.middle_content_center_icon.hidden = true;
        }
        else {
            this.middle_content_center_icon.hidden = false;
            this.swapSVGIcon(middleIconSelected, centerIconColour, this.middle_content_center_icon);
        }
        if (bottomIconSelected === "hide") {
            this.footer_content_left.hidden = true;
        }
        else {
            this.footer_content_left.hidden = false;
            this.swapSVGIcon(bottomIconSelected, bottomIconColour, this.footer_content_left_icon);
        }
        this.swapSVGIcon("info", primaryColour, this.header_text_icon);
        /*##################################################################
          TITLE FONT DETAILS
         ##################################################################*/
        const headerTitleFontFamily = textCard.title_fontFamily.value.toString();
        const headerTitleFontSize = textCard.title_fontSize.value.toString();
        const headerTitleBold = textCard.title_bold.value;
        const headerTitleItalic = textCard.title_italic.value;
        const headerTitleUnderlined = textCard.title_underline.value;
        const headerTitleAlignment = textCard.title_alignment.value;
        this.header_text.style.margin = "0px";
        this.header_text.style.paddingTop = "5px";
        this.header_text.style.fontFamily = headerTitleFontFamily;
        this.header_text.style.fontSize = headerTitleFontSize + "px";
        this.header_text.style.fontStyle = headerTitleItalic ? "italic" : "normal";
        this.header_text.style.fontWeight = headerTitleBold ? "bold" : "normal";
        this.header_text.style.textDecoration = headerTitleUnderlined ? "underline" : "normal";
        this.header_content.style.justifyContent = headerTitleAlignment;
        this.header_text.style.textAlign = headerTitleAlignment;
        /*##################################################################
          VALUE FONT DETAILS
         ##################################################################*/
        const valueFontFamily = textCard.value_fontFamily.value.toString();
        const valueFontSize = textCard.value_fontSize.value.toString();
        const valueBold = textCard.value_bold.value;
        const valueItalic = textCard.value_italic.value;
        const valueUnderlined = textCard.value_underline.value;
        const valueAlignment = textCard.value_alignment.value;
        this.middle_content_center_text.style.margin = "0px";
        this.middle_content_center_text.style.fontFamily = valueFontFamily;
        this.middle_content_center_text.style.fontSize = valueFontSize + "px";
        this.middle_content_center_text.style.fontStyle = valueItalic ? "italic" : "normal";
        this.middle_content_center_text.style.fontWeight = valueBold ? "bold" : "normal";
        this.middle_content_center_text.style.textDecoration = valueUnderlined ? "underline" : "normal";
        this.middle_content_center.style.float = valueAlignment === "center" ? "" : valueAlignment;
        /*##################################################################
          FOOTER TOP TEXT DETAILS
         ##################################################################*/
        const footerTextTopFontFamily = textCard.footer_text_top_fontFamily.value.toString();
        const footerTextTopFontSize = textCard.footer_text_top_fontSize.value.toString();
        const footerTextTopBold = textCard.footer_text_top_bold.value;
        const footerTextTopItalic = textCard.footer_text_top_italic.value;
        const footerTextTopUnderlined = textCard.footer_text_top_underline.value;
        const footerTextTopAlignment = textCard.footer_text_top_alignment.value;
        this.footer_content_right_text_top.style.margin = "0px";
        this.footer_content_right_text_top.style.fontFamily = footerTextTopFontFamily;
        this.footer_content_right_text_top.style.fontSize = footerTextTopFontSize + "px";
        this.footer_content_right_text_top.style.fontStyle = footerTextTopItalic ? "italic" : "normal";
        this.footer_content_right_text_top.style.fontWeight = footerTextTopBold ? "bold" : "normal";
        this.footer_content_right_text_top.style.textDecoration = footerTextTopUnderlined ? "underline" : "normal";
        this.footer_content_right_text_top.style.textAlign = footerTextTopAlignment;
        /*##################################################################
          FOOTER BOTTOM TEXT DETAILS
         ##################################################################*/
        const footerTextBottomFontFamily = textCard.footer_text_bottom_fontFamily.value.toString();
        const footerTextBottomFontSize = textCard.footer_text_bottom_fontSize.value.toString();
        const footerTextBottomBold = textCard.footer_text_bottom_bold.value;
        const footerTextBottomItalic = textCard.footer_text_bottom_italic.value;
        const footerTextBottomUnderlined = textCard.footer_text_bottom_underline.value;
        const footerTextBottomAlignment = textCard.footer_text_bottom_alignment.value;
        this.footer_content_right_text_bottom.style.margin = "0px";
        this.footer_content_right_text_bottom.style.fontFamily = footerTextBottomFontFamily;
        this.footer_content_right_text_bottom.style.fontSize = footerTextBottomFontSize + "px";
        this.footer_content_right_text_bottom.style.fontStyle = footerTextBottomItalic ? "italic" : "normal";
        this.footer_content_right_text_bottom.style.fontWeight = footerTextBottomBold ? "bold" : "normal";
        this.footer_content_right_text_bottom.style.textDecoration = footerTextBottomUnderlined ? "underline" : "normal";
        this.footer_content_right_text_bottom.style.textAlign = footerTextBottomAlignment;
        const tableDataView = options.dataViews[0].table;
        //verify that atleast one row exists otherwise we will get some runtime errors.
        //POSITION 1: HEADING
        //POSITION 2: CENTER VALUE
        //POSITION 3: FOOTER TOP TEXT
        //POSITION 4: FOOTER BOTTOM TEXT
        //POSITION 5: INCREASE/DECREASE
        //POSITION 6: INFO DESCRIPTION
        //POSITION 7: ACCESSIBILITY
        this.toggleParagraphElement(tableDataView, 0, this.header_text);
        this.toggleParagraphElement(tableDataView, 1, this.middle_content_center_text);
        this.toggleParagraphElement(tableDataView, 2, this.footer_content_right_text_top);
        this.toggleParagraphElement(tableDataView, 3, this.footer_content_right_text_bottom);
        this.toggleTrendElement(tableDataView, 4, this.middle_content_center_trend, this.middle_content_center_trend_text, this.middle_content_center_trend_icon, trendIconSelected, trendUpColour, trendDownColour);
        /*##################################################################
          TOOLTIP SETTINGS
         ##################################################################*/
        this.setTooltip(tableDataView, 5, this.header_text_icon, 0);
        /*##################################################################
          TREND SETTINGS
         ##################################################################*/
    }
    getData(tableDataView, position) {
        const tableRow = tableDataView?.rows[0];
        if (tableRow && tableRow.length > position) {
            return tableDataView.rows[0][position].toString();
        }
        return "";
    }
    toggleParagraphElement(tableDataView, position, element) {
        if (element) {
            element.textContent = this.getData(tableDataView, position);
        }
    }
    toggleTrendElement(tableDataView, position, containingElement, textElement, iconElement, trendIconSelected, trendUpColour, trendDownColour) {
        const textValue = this.getData(tableDataView, position);
        textElement.textContent = textValue;
        if (textValue === "") {
            return;
        }
        const floatValue = parseFloat(textValue);
        if (trendIconSelected === "hide" || !floatValue || floatValue === 0) {
            containingElement.hidden = true;
            return;
        }
        containingElement.hidden = false;
        this.swapSVGIcon(trendIconSelected.replace("#", floatValue > 0 ? "up" : "down"), floatValue > 0 ? trendUpColour : trendDownColour, iconElement);
    }
    setTooltip(tableDataView, tooltipPosition, tooltipElement, headingPosition) {
        if (tooltipElement) {
            const description = this.getData(tableDataView, tooltipPosition);
            const heading = this.getData(tableDataView, headingPosition);
            this.tooltipServiceWrapper.addTooltip((0,d3_selection__WEBPACK_IMPORTED_MODULE_3__/* ["default"] */ .A)(tooltipElement), () => {
                return [
                    {
                        displayName: "",
                        value: description,
                        color: "#FFFFFF",
                        header: heading,
                    },
                ];
            });
        }
        else {
            this.tooltipServiceWrapper.hide();
        }
    }
    getTooltipData(value) {
        //const formattedValue = valueFormatter.format(value.value, value.format);
        //const language = this.localizationManager.getDisplayName("LanguageKey");
        return [
            {
                displayName: value,
                value: value,
                color: "red",
                header: value && "displayed language " + value,
            },
        ];
    }
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel() {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
    swapSVGIcon(iconValue, currentColor, div) {
        const parser = new DOMParser();
        var icon = parser.parseFromString(this.getSVGIcon(iconValue, currentColor), "image/svg+xml").firstChild;
        while (div.firstChild) {
            div.removeChild(div.lastChild);
        }
        div.appendChild(icon);
    }
    getSVGIcon(iconValue, currentColor) {
        switch (iconValue) {
            case "none":
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>';
                break;
            case "accessibility":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-accessibility-icon lucide-accessibility"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>');
            case "activity":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity-icon lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>');
            case "alarm-clock":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-icon lucide-alarm-clock"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>');
            case "armchair":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-armchair-icon lucide-armchair"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>');
            case "badge-dollar-sign":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-dollar-sign-icon lucide-badge-dollar-sign"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>');
            case "bed-double":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bed-double-icon lucide-bed-double"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>');
            case "bell-electric":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none" stroke="' +
                    currentColor +
                    '" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-bell-electric-icon lucide-bell-electric"><path d="M18.518 17.347A7 7 0 0 1 14 19M18.8 4A11 11 0 0 1 20 9M9 9h.01"/><circle cx="20" cy="16" r="2"/><circle cx="9" cy="9" r="7"/><rect width="10" height="6" x="4" y="16" rx="2"/></svg>');
            case "book-open":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-icon lucide-book-open"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>');
            case "brain":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brain-icon lucide-brain"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>');
            case "building":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-icon lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>');
            case "building-2":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2-icon lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>');
            case "cabinet-filing":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cabinet-filing-icon lucide-cabinet-filing"><path d="M4 12h16"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M10 6h4"/><path d="M10 16h4"/></svg>');
            case "calendar":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>');
            case "calendar-check-2":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check2-icon lucide-calendar-check-2"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="m16 20 2 2 4-4"/></svg>');
            case "calendar-range":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-range-icon lucide-calendar-range"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>');
            case "chart-no-axes-combined":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-combined-icon lucide-chart-no-axes-combined"><path d="M12 16v5"/><path d="M16 14v7"/><path d="M20 10v11"/><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"/><path d="M4 18v3"/><path d="M8 14v7"/></svg>');
            case "chart-pie":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-pie-icon lucide-chart-pie"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>');
            case "check":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>');
            case "check-check":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-check-icon lucide-check-check"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>');
            case "circle-alert":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>');
            case "circle-dollar-sign":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dollar-sign-icon lucide-circle-dollar-sign"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>');
            case "circle-user-round":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>');
            case "citrus":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-citrus-icon lucide-citrus"><path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z"/><path d="M19.65 15.66A8 8 0 0 1 8.35 4.34"/><path d="m14 10-5.5 5.5"/><path d="M14 17.85V10H6.15"/></svg>');
            case "clock":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>');
            case "coffee":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee-icon lucide-coffee"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>');
            case "compass":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass-icon lucide-compass"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>');
            case "database":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-icon lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>');
            case "dollar-sign":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign-icon lucide-dollar-sign"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>');
            case "door-open":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open-icon lucide-door-open"><path d="M11 20H2"/><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/><path d="M11 4H8a2 2 0 0 0-2 2v14"/><path d="M14 12h.01"/><path d="M22 20h-3"/></svg>');
            case "dumbbell":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dumbbell-icon lucide-dumbbell"><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/></svg>');
            case "eye":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>');
            case "farm":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-farm-icon lucide-farm"><path d="M8 14V4.5a2.5 2.5 0 0 0-5 0V14"/><path d="m8 8 6-5 8 6"/><path d="M20 4v10"/><rect width="4" height="4" x="12" y="10"/><path d="M2 14h20"/><path d="m2 22 5-8"/><path d="m7 22 5-8"/><path d="M22 22H12l5-8"/><path d="M15 18h7"/></svg>');
            case "faucet":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-faucet-icon lucide-faucet"><path d="M10.22 4.9 5.4 6H5a2 2 0 0 1 0-4h.4l4.86 1"/><circle cx="12" cy="4" r="2"/><path d="m13.78 4.9 4.8 1h.4a2 2 0 0 0 0-4h-.4l-4.92 1"/><path d="M12 6v3"/><rect width="4" height="6" x="18" y="10"/><path d="M22 9v8"/><path d="M18 11h-2.6a3.87 3.87 0 0 0-6.8 0H7c-2.8 0-5 2.2-5 5v1h4v-1c0-.6.4-1 1-1h1.6a3.87 3.87 0 0 0 6.8 0H18"/><path d="M3.5 17S2 19 2 20a2 2 0 0 0 4 0c0-1-1.5-3-1.5-3"/></svg>');
            case "ferris-wheel":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ferris-wheel-icon lucide-ferris-wheel"><circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/><path d="M18 18.7a9 9 0 1 0-12 0"/></svg>');
            case "file":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-icon lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>');
            case "file-badge-2":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-badge2-icon lucide-file-badge-2"><path d="m13.69 12.479 1.29 4.88a.5.5 0 0 1-.697.591l-1.844-.849a1 1 0 0 0-.88.001l-1.846.85a.5.5 0 0 1-.693-.593l1.29-4.88"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><circle cx="12" cy="10" r="3"/></svg>');
            case "fire-extinguisher":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fire-extinguisher-icon lucide-fire-extinguisher"><path d="M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5"/><path d="M9 18h8"/><path d="M18 3h-3"/><path d="M11 3a6 6 0 0 0-6 6v11"/><path d="M5 13h4"/><path d="M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z"/></svg>');
            case "gamepad-2":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gamepad2-icon lucide-gamepad-2"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>');
            case "goal":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-goal-icon lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M20.561 10.222a9 9 0 1 1-12.55-5.29"/><path d="M8.002 9.997a5 5 0 1 0 8.9 2.02"/></svg>');
            case "hammer":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hammer-icon lucide-hammer"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>');
            case "house":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-icon lucide-house"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>');
            case "house-plug":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-plug-icon lucide-house-plug"><path d="M10 12V8.964"/><path d="M14 12V8.964"/><path d="M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z"/><path d="M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2"/></svg>');
            case "houses":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-houses-icon lucide-houses"><path d="M6 17H3c-.6 0-1-.4-1-1V8.5L8 4l10 7.5V19c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1v-7.5L16 4l6 4.5V16c0 .6-.4 1-1 1h-3"/><path d="M10 20v-6h4v6"/></svg>');
            case "house-wifi":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-wifi-icon lucide-house-wifi"><path d="M9.5 13.866a4 4 0 0 1 5 .01"/><path d="M12 17h.01"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M7 10.754a8 8 0 0 1 10 0"/></svg>');
            case "land-plot":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-land-plot-icon lucide-land-plot"><path d="m12 8 6-3-6-3v10"/><path d="m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"/><path d="m6.49 12.85 11.02 6.3"/><path d="M17.51 12.85 6.5 19.15"/></svg>');
            case "leaf":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-leaf-icon lucide-leaf"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>');
            case "lock-keyhole":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-keyhole-icon lucide-lock-keyhole"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>');
            case "mail":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>');
            case "mails":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mails-icon lucide-mails"><rect width="16" height="13" x="6" y="4" rx="2"/><path d="m22 7-7.1 3.78c-.57.3-1.23.3-1.8 0L6 7"/><path d="M2 8v11c0 1.1.9 2 2 2h14"/></svg>');
            case "map-pin":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>');
            case "map-plus":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-plus-icon lucide-map-plus"><path d="m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V12"/><path d="M15 5.764V12"/><path d="M18 15v6"/><path d="M21 18h-6"/><path d="M9 3.236v15"/></svg>');
            case "medal":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-medal-icon lucide-medal"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>');
            case "pencil":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>');
            case "phone":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>');
            case "popcorn":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-popcorn-icon lucide-popcorn"><path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4"/><path d="M10 22 9 8"/><path d="m14 22 1-14"/><path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z"/></svg>');
            case "recycle":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-recycle-icon lucide-recycle"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>');
            case "ruler":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-icon lucide-ruler"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>');
            case "scroll-text":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scroll-text-icon lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>');
            case "shield":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-icon lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>');
            case "ship":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ship-icon lucide-ship"><path d="M12 10.189V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>');
            case "ship-wheel":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ship-wheel-icon lucide-ship-wheel"><circle cx="12" cy="12" r="8"/><path d="M12 2v7.5"/><path d="m19 5-5.23 5.23"/><path d="M22 12h-7.5"/><path d="m19 19-5.23-5.23"/><path d="M12 14.5V22"/><path d="M10.23 13.77 5 19"/><path d="M9.5 12H2"/><path d="M10.23 10.23 5 5"/><circle cx="12" cy="12" r="2.5"/></svg>');
            case "sprout":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout-icon lucide-sprout"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>');
            case "store":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store-icon lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>');
            case "target-arrow":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target-arrow-icon lucide-target-arrow"><path d="M19 2v3h3"/><path d="M13.4 10.6 22 2"/><circle cx="12" cy="12" r="2"/><path d="M12.3 6H12a6 6 0 1 0 6 6v-.3"/><path d="M15 2.5A9.93 9.93 0 1 0 21.5 9"/><path d="M5.3 19.4 4 22"/><path d="M18.7 19.4 20 22"/></svg>');
            case "telescope":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-telescope-icon lucide-telescope"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>');
            case "tent-tree":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tent-tree-icon lucide-tent-tree"><circle cx="4" cy="4" r="2"/><path d="m14 5 3-3 3 3"/><path d="m14 10 3-3 3 3"/><path d="M17 14V2"/><path d="M17 14H7l-5 8h20Z"/><path d="M8 14v8"/><path d="m9 14 5 8"/></svg>');
            case "train-front-tunnel":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-train-front-tunnel-icon lucide-train-front-tunnel"><path d="M2 22V12a10 10 0 1 1 20 0v10"/><path d="M15 6.8v1.4a3 2.8 0 1 1-6 0V6.8"/><path d="M10 15h.01"/><path d="M14 15h.01"/><path d="M10 19a4 4 0 0 1-4-4v-3a6 6 0 1 1 12 0v3a4 4 0 0 1-4 4Z"/><path d="m9 19-2 3"/><path d="m15 19 2 3"/></svg>');
            case "trash-2":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>');
            case "trees-forest":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trees-forest-icon lucide-trees-forest"><path d="m9 5 3-3 3 3"/><path d="m9 10 3-3 3 3"/><path d="M12 12V2"/><path d="m2 15 3-3 3 3"/><path d="m2 20 3-3 3 3"/><path d="M5 22V12"/><path d="m16 15 3-3 3 3"/><path d="m16 20 3-3 3 3"/><path d="M19 22V12"/></svg>');
            case "trending-up":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up-icon lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>');
            case "triangle-alert":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>');
            case "utensils":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-utensils-icon lucide-utensils"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>');
            case "waves":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves-icon lucide-waves"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>');
            case "yin-yang":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-yin-yang-icon lucide-yin-yang"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="7" r=".5"/><path d="M12 22a5 5 0 1 0 0-10 5 5 0 1 1 0-10"/><circle cx="12" cy="17" r=".5"/></svg>');
            case "user":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>');
            case "info":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>');
            case "arrow-up":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-icon lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>');
            case "arrow-up-narrow-wide":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-narrow-wide-icon lucide-arrow-up-narrow-wide"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/></svg>');
            case "chevron-up":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>');
            case "move-up":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-up-icon lucide-move-up"><path d="M8 6L12 2L16 6"/><path d="M12 2V22"/></svg>');
            case "trending-up":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up-icon lucide-trending-up"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>');
            case "arrow-down":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-icon lucide-arrow-down"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>');
            case "arrow-down-narrow-wide":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-narrow-wide-icon lucide-arrow-down-narrow-wide"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h4"/><path d="M11 8h7"/><path d="M11 12h10"/></svg>');
            case "chevron-down":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>');
            case "move-down":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-down-icon lucide-move-down"><path d="M8 18L12 22L16 18"/><path d="M12 2V22"/></svg>');
            case "trending-down":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down-icon lucide-trending-down"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>');
            case "loading-circle":
                return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin lucide lucide-loader-circle-icon lucide-loader-circle"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>');
            case "loading":
            default:
                return ('<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" fill="none" stroke="' +
                    currentColor +
                    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin lucide lucide-loader-icon lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>');
                break;
        }
    }
}


/***/ }),

/***/ 9063:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}


/***/ }),

/***/ 9215:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return this.each(lower);
}


/***/ }),

/***/ 9433:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}


/***/ }),

/***/ 9713:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1882);
/* harmony import */ var _array_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5478);
/* harmony import */ var _selectorAll_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(747);




function arrayAll(select) {
  return function() {
    return (0,_array_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(select.apply(this, arguments));
  };
}

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = (0,_selectorAll_js__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .A)(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new _index_js__WEBPACK_IMPORTED_MODULE_2__/* .Selection */ .LN(subgroups, parents);
}


/***/ }),

/***/ 9731:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(x) {
  return function() {
    return x;
  };
}


/***/ }),

/***/ 9734:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1882);
/* harmony import */ var _matcher_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6541);



/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(match) {
  if (typeof match !== "function") match = (0,_matcher_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A)(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new _index_js__WEBPACK_IMPORTED_MODULE_1__/* .Selection */ .LN(subgroups, this._parents);
}


/***/ }),

/***/ 9754:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $n: () => (/* binding */ AlignmentGroup),
/* harmony export */   Ap: () => (/* binding */ Slider),
/* harmony export */   Cx: () => (/* binding */ FontPicker),
/* harmony export */   Kx: () => (/* binding */ Model),
/* harmony export */   PA: () => (/* binding */ ItemDropdown),
/* harmony export */   St: () => (/* binding */ CompositeCard),
/* harmony export */   Tn: () => (/* binding */ SimpleCard),
/* harmony export */   iB: () => (/* binding */ NumUpDown),
/* harmony export */   jF: () => (/* binding */ ToggleSwitch),
/* harmony export */   sk: () => (/* binding */ ColorPicker),
/* harmony export */   tc: () => (/* binding */ FontControl)
/* harmony export */ });
/* unused harmony exports CardGroupEntity, Group, SimpleSlice, DatePicker, AutoDropdown, DurationPicker, ErrorRangeControl, FieldPicker, ItemFlagsSelection, AutoFlagsSelection, TextInput, TextArea, GradientBar, ImageUpload, ListEditor, ReadOnlyText, ShapeMapSelector, CompositeSlice, MarginPadding, Container, ContainerItem */
/* harmony import */ var _utils_FormattingSettingsUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8639);
/**
 * Powerbi utils components classes for custom visual formatting pane objects
 *
 */

class NamedEntity {
}
class CardGroupEntity extends NamedEntity {
}
class Model {
}
/** CompositeCard is use to populate a card into the formatting pane with multiple groups */
class CompositeCard extends NamedEntity {
}
class Group extends CardGroupEntity {
    constructor(object) {
        super();
        Object.assign(this, object);
    }
}
/** SimpleCard is use to populate a card into the formatting pane in a single group */
class SimpleCard extends CardGroupEntity {
}
class SimpleSlice extends NamedEntity {
    constructor(object) {
        super();
        Object.assign(this, object);
    }
    getFormattingSlice(objectName, localizationManager) {
        const controlType = this.type;
        const propertyName = this.name;
        const sliceDisplayName = (localizationManager && this.displayNameKey) ? localizationManager.getDisplayName(this.displayNameKey) : this.displayName;
        const sliceDescription = (localizationManager && this.descriptionKey) ? localizationManager.getDisplayName(this.descriptionKey) : this.description;
        const componentDisplayName = {
            displayName: sliceDisplayName,
            description: sliceDescription,
            uid: objectName + '-' + propertyName,
        };
        return Object.assign(Object.assign({}, componentDisplayName), { control: {
                type: controlType,
                properties: this.getFormattingComponent(objectName, localizationManager)
            } });
    }
    // eslint-disable-next-line
    getFormattingComponent(objectName, localizationManager) {
        return {
            descriptor: _utils_FormattingSettingsUtils__WEBPACK_IMPORTED_MODULE_0__/* .getDescriptor */ .y(objectName, this),
            value: this.value,
        };
    }
    getRevertToDefaultDescriptor(objectName) {
        return [{
                objectName: objectName,
                propertyName: this.name
            }];
    }
    setPropertiesValues(dataViewObjects, objectName) {
        var _a;
        const newValue = (_a = dataViewObjects === null || dataViewObjects === void 0 ? void 0 : dataViewObjects[objectName]) === null || _a === void 0 ? void 0 : _a[this.name];
        this.value = _utils_FormattingSettingsUtils__WEBPACK_IMPORTED_MODULE_0__/* .getPropertyValue */ .D(this, newValue, this.value);
    }
}
class AlignmentGroup extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "AlignmentGroup" /* visuals.FormattingComponent.AlignmentGroup */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { mode: this.mode, supportsNoSelection: this.supportsNoSelection });
    }
}
class ToggleSwitch extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "ToggleSwitch" /* visuals.FormattingComponent.ToggleSwitch */;
    }
}
class ColorPicker extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "ColorPicker" /* visuals.FormattingComponent.ColorPicker */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { defaultColor: this.defaultColor, isNoFillItemSupported: this.isNoFillItemSupported });
    }
}
class NumUpDown extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "NumUpDown" /* visuals.FormattingComponent.NumUpDown */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { options: this.options });
    }
}
class Slider extends NumUpDown {
    constructor() {
        super(...arguments);
        this.type = "Slider" /* visuals.FormattingComponent.Slider */;
    }
}
class DatePicker extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "DatePicker" /* visuals.FormattingComponent.DatePicker */;
    }
    getFormattingComponent(objectName, localizationManager) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { placeholder: (localizationManager && this.placeholderKey) ? localizationManager.getDisplayName(this.placeholderKey) : this.placeholder, validators: this.validators });
    }
}
class ItemDropdown extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "Dropdown" /* visuals.FormattingComponent.Dropdown */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { items: this.items });
    }
}
class AutoDropdown extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "Dropdown" /* visuals.FormattingComponent.Dropdown */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { mergeValues: this.mergeValues, filterValues: this.filterValues });
    }
}
class DurationPicker extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "DurationPicker" /* visuals.FormattingComponent.DurationPicker */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { validators: this.validators });
    }
}
class ErrorRangeControl extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "ErrorRangeControl" /* visuals.FormattingComponent.ErrorRangeControl */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { validators: this.validators });
    }
}
class FieldPicker extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "FieldPicker" /* visuals.FormattingComponent.FieldPicker */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { validators: this.validators, allowMultipleValues: this.allowMultipleValues });
    }
}
class ItemFlagsSelection extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "FlagsSelection" /* visuals.FormattingComponent.FlagsSelection */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { items: this.items });
    }
}
class AutoFlagsSelection extends SimpleSlice {
    constructor() {
        super(...arguments);
        this.type = "FlagsSelection" /* visuals.FormattingComponent.FlagsSelection */;
    }
}
class TextInput extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "TextInput" /* visuals.FormattingComponent.TextInput */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { placeholder: this.placeholder });
    }
}
class TextArea extends TextInput {
    constructor() {
        super(...arguments);
        this.type = "TextArea" /* visuals.FormattingComponent.TextArea */;
    }
}
class FontPicker extends SimpleSlice {
    constructor() {
        super(...arguments);
        this.type = "FontPicker" /* visuals.FormattingComponent.FontPicker */;
    }
}
class GradientBar extends SimpleSlice {
    constructor() {
        super(...arguments);
        this.type = "GradientBar" /* visuals.FormattingComponent.GradientBar */;
    }
}
class ImageUpload extends SimpleSlice {
    constructor() {
        super(...arguments);
        this.type = "ImageUpload" /* visuals.FormattingComponent.ImageUpload */;
    }
}
class ListEditor extends SimpleSlice {
    constructor() {
        super(...arguments);
        this.type = "ListEditor" /* visuals.FormattingComponent.ListEditor */;
    }
}
class ReadOnlyText extends SimpleSlice {
    constructor() {
        super(...arguments);
        this.type = "ReadOnlyText" /* visuals.FormattingComponent.ReadOnlyText */;
    }
}
class ShapeMapSelector extends SimpleSlice {
    constructor(object) {
        super(object);
        this.type = "ShapeMapSelector" /* visuals.FormattingComponent.ShapeMapSelector */;
    }
    getFormattingComponent(objectName) {
        return Object.assign(Object.assign({}, super.getFormattingComponent(objectName)), { isAzMapReferenceSelector: this.isAzMapReferenceSelector });
    }
}
class CompositeSlice extends NamedEntity {
    constructor(object) {
        super();
        Object.assign(this, object);
    }
    getFormattingSlice(objectName, localizationManager) {
        const controlType = this.type;
        const propertyName = this.name;
        const componentDisplayName = {
            displayName: (localizationManager && this.displayNameKey) ? localizationManager.getDisplayName(this.displayNameKey) : this.displayName,
            description: (localizationManager && this.descriptionKey) ? localizationManager.getDisplayName(this.descriptionKey) : this.description,
            uid: objectName + '-' + propertyName,
        };
        return Object.assign(Object.assign({}, componentDisplayName), { control: {
                type: controlType,
                properties: this.getFormattingComponent(objectName)
            } });
    }
}
class FontControl extends CompositeSlice {
    constructor(object) {
        super(object);
        this.type = "FontControl" /* visuals.FormattingComponent.FontControl */;
    }
    getFormattingComponent(objectName) {
        var _a, _b, _c;
        return {
            fontFamily: this.fontFamily.getFormattingComponent(objectName),
            fontSize: this.fontSize.getFormattingComponent(objectName),
            bold: (_a = this.bold) === null || _a === void 0 ? void 0 : _a.getFormattingComponent(objectName),
            italic: (_b = this.italic) === null || _b === void 0 ? void 0 : _b.getFormattingComponent(objectName),
            underline: (_c = this.underline) === null || _c === void 0 ? void 0 : _c.getFormattingComponent(objectName)
        };
    }
    getRevertToDefaultDescriptor(objectName) {
        return this.fontFamily.getRevertToDefaultDescriptor(objectName)
            .concat(this.fontSize.getRevertToDefaultDescriptor(objectName))
            .concat(this.bold ? this.bold.getRevertToDefaultDescriptor(objectName) : [])
            .concat(this.italic ? this.italic.getRevertToDefaultDescriptor(objectName) : [])
            .concat(this.underline ? this.underline.getRevertToDefaultDescriptor(objectName) : []);
    }
    setPropertiesValues(dataViewObjects, objectName) {
        var _a, _b, _c;
        this.fontFamily.setPropertiesValues(dataViewObjects, objectName);
        this.fontSize.setPropertiesValues(dataViewObjects, objectName);
        (_a = this.bold) === null || _a === void 0 ? void 0 : _a.setPropertiesValues(dataViewObjects, objectName);
        (_b = this.italic) === null || _b === void 0 ? void 0 : _b.setPropertiesValues(dataViewObjects, objectName);
        (_c = this.underline) === null || _c === void 0 ? void 0 : _c.setPropertiesValues(dataViewObjects, objectName);
    }
}
class MarginPadding extends CompositeSlice {
    constructor(object) {
        super(object);
        this.type = "MarginPadding" /* visuals.FormattingComponent.MarginPadding */;
    }
    getFormattingComponent(objectName) {
        return {
            left: this.left.getFormattingComponent(objectName),
            right: this.right.getFormattingComponent(objectName),
            top: this.top.getFormattingComponent(objectName),
            bottom: this.bottom.getFormattingComponent(objectName)
        };
    }
    getRevertToDefaultDescriptor(objectName) {
        return this.left.getRevertToDefaultDescriptor(objectName)
            .concat(this.right.getRevertToDefaultDescriptor(objectName))
            .concat(this.top.getRevertToDefaultDescriptor(objectName))
            .concat(this.bottom.getRevertToDefaultDescriptor(objectName));
    }
    setPropertiesValues(dataViewObjects, objectName) {
        this.left.setPropertiesValues(dataViewObjects, objectName);
        this.right.setPropertiesValues(dataViewObjects, objectName);
        this.top.setPropertiesValues(dataViewObjects, objectName);
        this.bottom.setPropertiesValues(dataViewObjects, objectName);
    }
}
class Container extends NamedEntity {
    constructor(object) {
        super();
        Object.assign(this, object);
    }
}
class ContainerItem extends (/* unused pure expression or super */ null && (NamedEntity)) {
}
//# sourceMappingURL=FormattingSettingsComponents.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it declares 'citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG' on top-level, which conflicts with the current library output.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (visualPlugin)
/* harmony export */ });
/* harmony import */ var _src_visual__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8849);

var powerbiKey = "powerbi";
var powerbi = window[powerbiKey];
var citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG = {
    name: 'citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG',
    displayName: 'City of Sault Ste. Marie Card',
    class: 'Visual',
    apiVersion: '5.3.0',
    create: (options) => {
        if (_src_visual__WEBPACK_IMPORTED_MODULE_0__/* .Visual */ .b) {
            return new _src_visual__WEBPACK_IMPORTED_MODULE_0__/* .Visual */ .b(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId, options, initialState) => {
        const dialogRegistry = globalThis.dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG"] = citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG;
}
/* harmony default export */ const visualPlugin = (citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG);

})();

citySsmCard45107A144E344891A4CEB01F0F40A156_DEBUG = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=https://localhost:8080/assets/visual.js.map