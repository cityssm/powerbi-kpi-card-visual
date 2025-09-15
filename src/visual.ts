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
"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import IVisualEventService = powerbi.extensibility.IVisualEventService;

import { select as d3Select } from "d3-selection";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
  private target: HTMLElement;
  private formattingSettings: VisualFormattingSettingsModel;
  private formattingSettingsService: FormattingSettingsService;
  private main_content: HTMLDivElement;

  private information_tooltip_container: HTMLDivElement;
  private information_tooltip_container_button: HTMLButtonElement;
  private information_tooltip_container_button_icon: HTMLDivElement;

  private information_trend_container: HTMLDivElement;
  private information_trend_container_button: HTMLButtonElement;
  private information_trend_container_icon: HTMLDivElement;
  private information_trend_container_text: HTMLDivElement;

  private header_middle_content: HTMLDivElement;

  private header_content: HTMLDivElement;
  private header_text: HTMLParagraphElement;

  private middle_content: HTMLDivElement;
  private middle_content_center: HTMLDivElement;
  private middle_content_center_icon: HTMLDivElement;
  private middle_content_center_text: HTMLDivElement;

  private middle_content_info: HTMLDivElement;
  private middle_content_center_info: HTMLDivElement;
  private middle_content_center_info_grow: HTMLDivElement;

  private footer_content: HTMLDivElement;
  private footer_content_left: HTMLDivElement;
  private footer_content_left_icon: HTMLDivElement;

  private footer_content_right: HTMLDivElement;
  private footer_content_right_text_top: HTMLParagraphElement;
  private footer_content_right_text_bottom: HTMLParagraphElement;

  private tooltipServiceWrapper: ITooltipServiceWrapper;
  private tooltipService: powerbi.extensibility.ITooltipService;

  private currentTooltipInfoTitle: string;
  private currentTooltipInfoDescription: string;

  private currentTooltipTrendTitle: string;
  private currentTooltipTrendDescription: string;

  private isHighContrast: boolean;

  private themeForegroundColour: string;
  private themeBackgroundColour: string;
  private themeForegroundSelectedColour: string;
  private themeLinkColour: string;

  private isInfoTooltipOpen: boolean = false;
  private isTrendTooltipOpen: boolean = false;
  private isMouseInContainer: boolean = false;

  private events: IVisualEventService;

  constructor(options: VisualConstructorOptions) {
    this.formattingSettingsService = new FormattingSettingsService();

    this.target = options.element;
    this.tooltipService = options.host.tooltipService;
    this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element, 0);

    let colorPalette: ISandboxExtendedColorPalette = options.host.colorPalette;

    this.isHighContrast = colorPalette.isHighContrast;

    if (this.isHighContrast) {
      this.themeForegroundColour = colorPalette.foreground.value;
      this.themeBackgroundColour = colorPalette.background.value;
      this.themeForegroundSelectedColour = colorPalette.foregroundSelected.value;
      this.themeLinkColour = colorPalette.hyperlink.value;
    }

    options.host.hostCapabilities.allowInteractions = true;

    this.events = options.host.eventService;

    if (document) {
      /*###########################################################
        CREATE HEADER ELEMENTS
      ###########################################################*/
      this.header_content = document.createElement("div");
      this.header_content.className = "flex-container-header";
      //CREATE TEXT ELEMENT
      this.header_text = document.createElement("p");
      this.header_text.id = "title";
      this.header_text.innerText = "";

      this.header_content.appendChild(this.header_text);

      /*###########################################################
        CREATE MIDDLE ICON AND VALUE TEXT
      ###########################################################*/
      this.middle_content_center_text = document.createElement("p");
      this.middle_content_center_text.innerText = "";

      this.middle_content_center_icon = document.createElement("div");
      this.middle_content_center_icon.className = "middle-icon-large";

      this.swapSVGIcon(
        "loading",
        this.isHighContrast ? this.themeForegroundColour : "#808080",
        this.middle_content_center_icon
      );

      /*##################################################################
       CREATE MIDDLE INFORMATION ICON
     ##################################################################*/

      this.information_tooltip_container_button_icon = document.createElement("div");
      this.information_tooltip_container_button_icon.className = "middle-info-icon";

      this.swapSVGIcon(
        "info",
        this.isHighContrast ? this.themeForegroundColour : "#808080",
        this.information_tooltip_container_button_icon
      );

      this.information_tooltip_container = document.createElement("div");
      this.information_tooltip_container.className = "middle-info-container";

      this.information_tooltip_container_button = document.createElement("button");
      this.information_tooltip_container_button.className = "middle-info-button";

      this.information_tooltip_container_button.appendChild(this.information_tooltip_container_button_icon);

      this.information_tooltip_container.appendChild(this.information_tooltip_container_button);

      /*##################################################################
        CREATE TREND ELEMENT ON MAIN
      ##################################################################*/
      this.information_trend_container_icon = document.createElement("div");
      this.information_trend_container_icon.className = "middle-trend-icon";

      this.swapSVGIcon(
        "arrow-down",
        this.isHighContrast ? this.themeForegroundColour : "#808080",
        this.information_trend_container_icon
      );

      this.information_trend_container_text = document.createElement("p");
      this.information_trend_container_text.innerText = "-2.57%";

      this.information_trend_container = document.createElement("div");
      this.information_trend_container.className = "middle-trend-container";

      this.information_trend_container_button = document.createElement("button");
      this.information_trend_container_button.className = "middle-trend-button";

      this.information_trend_container_button.appendChild(this.information_trend_container_text);
      this.information_trend_container_button.appendChild(this.information_trend_container_icon);

      this.information_trend_container.appendChild(this.information_trend_container_button);

      this.middle_content_center_info_grow = document.createElement("div");
      this.middle_content_center_info_grow.className = "middle-info-grow";
      this.middle_content_center_info_grow.appendChild(this.information_tooltip_container);

      this.middle_content_center_info = document.createElement("div");
      this.middle_content_center_info.className = "middle-content-info";
      this.middle_content_center_info.appendChild(this.middle_content_center_info_grow);
      this.middle_content_center_info.appendChild(this.information_trend_container);

      /*##################################################################
      TREND FONT DEFAULTS
     ##################################################################*/

      this.information_trend_container_text.style.margin = "auto";
      this.information_trend_container_text.style.fontFamily = "Arial";
      this.information_trend_container_text.style.fontSize = "15px";
      this.information_trend_container_text.style.fontStyle = "italic";
      this.information_trend_container_text.style.fontWeight = "normal";
      this.information_trend_container_text.style.textDecoration = "normal";

      /*######################
        ATTACH MIDDLE COMPONENTS
      ########################*/

      this.middle_content_center = document.createElement("div");
      this.middle_content_center.className = "middle-content ";
      this.middle_content_center.appendChild(this.middle_content_center_icon);
      this.middle_content_center.appendChild(this.middle_content_center_text);

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

      this.middle_content_info = document.createElement("div");
      this.middle_content_info.appendChild(this.middle_content_center_info);

      this.header_middle_content.appendChild(this.middle_content_info);

      /*###########################################################
        CREATE FOOTER ELEMENTS
      ###########################################################*/

      //############### CREATE LEFT FOOTER SECTION ###############
      this.footer_content_left_icon = document.createElement("div");
      this.footer_content_left_icon.className = "footer-icon-large";
      this.swapSVGIcon(
        "loading",
        this.isHighContrast ? this.themeForegroundColour : "#FFFFFF",
        this.footer_content_left_icon
      );

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

      /*###########################################################
        SET DEFAULT COLOURS/LOADING
      ###########################################################*/

      this.main_content.style.borderColor = this.isHighContrast ? this.themeForegroundColour : "#808080";
      this.main_content.style.backgroundColor = this.isHighContrast ? this.themeBackgroundColour : "#808080";

      this.header_middle_content.style.backgroundColor = this.isHighContrast ? this.themeBackgroundColour : "#E6E6E6";

      this.middle_content_center_text.style.color = this.isHighContrast ? this.themeBackgroundColour : "#000000";
      this.header_text.style.color = this.isHighContrast ? this.themeBackgroundColour : "#000000";
      this.footer_content_right_text_top.style.color = this.isHighContrast ? this.themeBackgroundColour : "#FFFFFF";
      this.footer_content_right_text_bottom.style.color = this.isHighContrast ? this.themeBackgroundColour : "#FFFFFF";

      if (this.isHighContrast) {
        this.middle_content.style.borderBottom = "3px";
        this.middle_content.style.borderBottomColor = this.themeForegroundColour;
        this.middle_content.style.borderBottomStyle = "solid";

        this.information_trend_container_text.style.color = this.themeForegroundColour;
      }

      let width: number = options.element.clientWidth;
      let height: number = options.element.clientHeight;

      let padding: number = 5;

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
      this.header_text.style.textAlign = "center";

      this.header_content.style.justifyContent = "center";

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

      /*############################################
      ACCESSIBILITY
      ############################################*/

      this.header_content.tabIndex = 1;
      this.middle_content_center_text.tabIndex = 2;
      this.information_tooltip_container_button.tabIndex = 3;
      this.information_trend_container_button.tabIndex = 4;
      this.footer_content_right_text_top.tabIndex = 5;
      this.footer_content_right_text_bottom.tabIndex = 6;

      this.middle_content_center_icon.ariaHidden = "true";
      this.footer_content_left_icon.ariaHidden = "true";

      this.information_trend_container_icon.ariaHidden = "true";
      this.information_tooltip_container_button_icon.ariaHidden = "true";

      this.header_content.role = "heading";

      this.middle_content_center.ariaLabel = "Key Performance Indicator Value";
      this.middle_content_center.role = "paragraph";

      this.information_tooltip_container_button.ariaLabel = "Additional Information";
      this.information_tooltip_container_button.role = "button";
      this.information_tooltip_container_button.ariaHasPopup = "true";
      this.information_tooltip_container_button.ariaExpanded = String(this.isInfoTooltipOpen);
      this.information_tooltip_container_button.onclick = () => {};

      this.information_trend_container_button.ariaLabel = "Difference between last period";
      this.information_trend_container_button.role = "button";
      this.information_trend_container_button.ariaHasPopup = "true";
      this.information_trend_container_button.ariaExpanded = String(this.isTrendTooltipOpen);

      this.information_trend_container_button.onclick = () => {};

      this.footer_content_right_text_top.role = "paragraph";
      this.footer_content_right_text_bottom.role = "paragraph";

      this.target.appendChild(this.main_content);
    }
  }

  public update(options: VisualUpdateOptions) {
    this.events.renderingStarted(options);

    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
      VisualFormattingSettingsModel,
      options.dataViews[0]
    );

    const textCard = this.formattingSettings.textCard;
    const styleCard = this.formattingSettings.styleCard;

    let width: number = options.viewport.width;
    let height: number = options.viewport.height;

    let padding: number = 5;

    this.main_content.style.width = width - padding * 2 + "px";
    this.main_content.style.height = height - padding + "px";

    width = width - padding;
    height = height - padding;

    /*##################################################################
      SET COLOURS / HIGH CONTRAST
     ##################################################################*/
    const primaryColour: string = this.isHighContrast
      ? this.themeForegroundColour
      : (styleCard.primaryColour.value.value as string);
    const secondaryColour: string = this.isHighContrast
      ? this.themeBackgroundColour
      : (styleCard.secondaryColour.value.value as string);
    const centerIconColour: string = this.isHighContrast
      ? this.themeForegroundColour
      : (styleCard.centerIconColour.value.value as string);
    const bottomIconColour: string = this.isHighContrast
      ? this.themeForegroundColour
      : (styleCard.bottomLeftIconColour.value.value as string);

    const trendUpColour: string = this.isHighContrast ? this.themeForegroundColour : "#4CBB17";
    const trendDownColour: string = this.isHighContrast ? this.themeForegroundColour : "#ED1C24";

    this.main_content.style.borderColor = primaryColour;
    this.main_content.style.backgroundColor = this.isHighContrast ? secondaryColour : primaryColour;

    this.header_middle_content.style.backgroundColor = secondaryColour;

    this.middle_content_center_text.style.color = centerIconColour;

    this.header_text.style.color = centerIconColour;
    this.footer_content_right_text_top.style.color = bottomIconColour;
    this.footer_content_right_text_bottom.style.color = bottomIconColour;

    if (this.isHighContrast) {
      this.middle_content.style.borderBottom = "3px";
      this.middle_content.style.borderBottomColor = primaryColour;
      this.middle_content.style.borderBottomStyle = "solid";

      this.information_trend_container_text.style.color = primaryColour;
    }
    /*##################################################################
      SET BORDER RADIUS
     ##################################################################*/

    const borderRadius: string = styleCard.borderRadius.value + "px";

    this.header_middle_content.style.borderRadius = borderRadius;
    this.main_content.style.borderRadius = borderRadius;

    if (styleCard.borderRadius.value >= 20) {
      const newPadding = styleCard.borderRadius.value - 10;
      this.information_tooltip_container.style.paddingLeft = newPadding + "px";
      this.information_trend_container.style.paddingRight = newPadding + "px";
    }

    /*##################################################################
      SET ICONS
     ##################################################################*/

    const bottomIconSelected: string = styleCard.bottomLeftIcon.value.value as string;
    const middleIconSelected: string = styleCard.centerIcon.value.value as string;
    const trendIconSelected: string = styleCard.trendIcon.value.value as string;

    if (middleIconSelected === "hide") {
      this.middle_content_center_icon.hidden = true;
    } else {
      this.middle_content_center_icon.hidden = false;
      this.swapSVGIcon(middleIconSelected, centerIconColour, this.middle_content_center_icon);
    }

    if (bottomIconSelected === "hide") {
      this.footer_content_left.hidden = true;
    } else {
      this.footer_content_left.hidden = false;
      this.swapSVGIcon(bottomIconSelected, bottomIconColour, this.footer_content_left_icon);
    }

    this.swapSVGIcon("info", primaryColour, this.information_tooltip_container_button_icon);

    const middleIconSize: string = styleCard.centerIconSize.value.value as string;
    const trendIconSize: string = styleCard.bottomLeftIconSize.value.value as string;

    this.middle_content_center_icon.className = middleIconSize;
    this.footer_content_left_icon.className = trendIconSize;

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

    //POSITION 0: HEADING
    //POSITION 1: CENTER VALUE
    //POSITION 2: FOOTER TOP TEXT
    //POSITION 3: FOOTER BOTTOM TEXT
    //POSITION 4: INCREASE/DECREASE
    //POSITION 5: INCREASE/DECREASE DIRECTION
    //POSITION 6: INFO DESCRIPTION
    //POSITION 7: TREND DESCRIPTION
    //POSITION 8: ACCESSIBILITY
    this.toggleParagraphElement(tableDataView, 0, this.header_text);
    this.toggleParagraphElement(tableDataView, 1, this.middle_content_center_text);
    this.toggleParagraphElement(tableDataView, 2, this.footer_content_right_text_top);
    this.toggleParagraphElement(tableDataView, 3, this.footer_content_right_text_bottom);
    this.toggleTrendElement(
      tableDataView,
      4,
      this.information_trend_container,
      this.information_trend_container_text,
      this.information_trend_container_icon,
      trendIconSelected,
      trendUpColour,
      trendDownColour,
      5
    );

    const tooltipTitleInfo = this.getData(tableDataView, 0);
    const tooltipDescriptionInfo = this.getData(tableDataView, 6);

    const tooltipTitleTrend = tooltipTitleInfo + " Trend";
    const tooltipDescriptionTrend = this.getData(tableDataView, 7);

    /*##################################################################
      MAIN CCONTENT TOOLTIP SETTINGS
    ##################################################################*/

    if (!this.main_content.onmouseleave) {
      this.main_content.onmouseleave = (event) => {
        this.isMouseInContainer = false;

        this.hideTooltip();
        this.setTrendTooltipToggle(false);
        this.setIconTooltipToggle(false);
      };
    }

    if (!this.main_content.onmouseenter) {
      this.main_content.onmouseenter = (event) => {
        this.isMouseInContainer = true;
      };
    }

    /*##################################################################
      INFO TOOLTIP SETTINGS
    ##################################################################*/
    const tooltipInfoChanged =
      tooltipTitleInfo !== this.currentTooltipInfoTitle ||
      tooltipDescriptionInfo !== this.currentTooltipInfoDescription;

    //If title or description have changed remove the events and recreate them later.
    //otherwise the title and description will be wrong
    //only remove the event if one exists
    if (tooltipInfoChanged) {
      this.currentTooltipInfoTitle = tooltipTitleInfo;
      this.currentTooltipInfoDescription = tooltipDescriptionInfo;

      this.information_tooltip_container_button.onclick = null;
      this.information_tooltip_container_button.onmouseenter = null;
    }

    const infoTooltipEvent = this.debounce(this.onInfoTooltipEvent.bind(this), 500);

    if (!this.information_tooltip_container_button.onmouseleave) {
      this.information_tooltip_container_button.onmouseleave = (event) => {
        this.isMouseInContainer = false;
        this.hideTooltip();
        this.setTrendTooltipToggle(false);
        this.setIconTooltipToggle(false);
      };
    }

    if (!this.information_tooltip_container_button.onmouseenter) {
      this.information_tooltip_container_button.onmouseenter = (event) => {
        this.isMouseInContainer = true;
        infoTooltipEvent(event, tooltipTitleInfo, tooltipDescriptionInfo);
      };
    }

    if (!this.information_tooltip_container_button.onclick) {
      this.information_tooltip_container_button.onclick = (event) => {
        infoTooltipEvent(event, tooltipTitleInfo, tooltipDescriptionInfo);
      };
    }
    /*##################################################################
      TREND TOOLTIP SETTINGS
    ##################################################################*/
    const tooltipTrendChanged = tooltipDescriptionTrend !== this.currentTooltipTrendDescription;

    if (tooltipTrendChanged) {
      this.currentTooltipTrendTitle = tooltipTitleTrend;
      this.currentTooltipTrendDescription = tooltipDescriptionTrend;
      this.information_trend_container_button.onclick = null;
      this.information_trend_container_button.onmouseenter = null;
    }

    const trendTooltipEvent = this.debounce(this.onTrendTooltipEvent.bind(this), 500);

    if (!this.information_trend_container_button.onmouseleave) {
      this.information_trend_container_button.onmouseleave = (event) => {
        this.isMouseInContainer = false;
        this.hideTooltip();
        this.setTrendTooltipToggle(false);
        this.setIconTooltipToggle(false);
      };
    }

    if (!this.information_trend_container_button.onmouseenter) {
      this.information_trend_container_button.onmouseenter = (event) => {
        this.isMouseInContainer = true;
        trendTooltipEvent(event, tooltipTitleTrend, tooltipDescriptionTrend);
      };
    }

    if (!this.information_trend_container_button.onclick) {
      this.information_trend_container_button.onclick = (event) => {
        trendTooltipEvent(event, tooltipTitleTrend, tooltipDescriptionTrend);
      };
    }

    this.events.renderingFinished(options);
  }

  private onInfoTooltipEvent(event: any, tooltipTitle: string, tooltipDescriptionInfo: string) {
    if (
      event.type === "click" ||
      event.type === "mouseenter" ||
      (event.type === "keydown" && (event.key === " " || event.key === "Enter"))
    ) {
      event.preventDefault(); //Prevents OnClick and OnKeyDown from being triggered at the same time
      event.stopPropagation();

      if (!this.isMouseInContainer) return;

      const target = <HTMLDivElement>(<SVGElement>event.target).parentElement;

      if (this.isInfoTooltipOpen) {
        this.hideTooltip();
        this.setIconTooltipToggle(false);
      } else {
        this.showTooltip(target, tooltipTitle, tooltipDescriptionInfo);
        this.setIconTooltipToggle(true);
        this.setTrendTooltipToggle(false);
      }
    }
  }

  private onTrendTooltipEvent(event: any, tooltipTitle: string, tooltipDescriptionInfo: string) {
    if (
      event.type === "click" ||
      event.type === "mouseenter" ||
      (event.type === "keydown" && (event.key === " " || event.key === "Enter"))
    ) {
      event.preventDefault(); //Prevents OnClick and OnKeyDown from being triggered at the same time
      event.stopPropagation();

      if (!this.isMouseInContainer) return;

      const target = <HTMLDivElement>(<SVGElement>event.target).parentElement;

      if (this.isTrendTooltipOpen) {
        this.hideTooltip();
        this.setTrendTooltipToggle(false);
      } else {
        this.showTooltip(target, tooltipTitle, tooltipDescriptionInfo, false);
        this.setTrendTooltipToggle(true);
        this.setIconTooltipToggle(false);
      }
    }
  }

  private debounce(func, delay) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout); // Clear any existing timeout
      timeout = setTimeout(() => {
        func.apply(context, args); // Execute the function after the delay
      }, delay);
    };
  }

  private setIconTooltipToggle(value: boolean) {
    this.isInfoTooltipOpen = value;
    this.information_tooltip_container_button.ariaExpanded = String(value);
  }

  private setTrendTooltipToggle(value: boolean) {
    this.isTrendTooltipOpen = value;
    this.information_trend_container_button.ariaExpanded = String(value);
  }

  private hideTooltip() {
    this.tooltipService.hide({ immediately: true, isTouchEvent: false });
  }
  private showTooltip(target: HTMLElement, title: string, description: string, leftJustified: boolean = true) {
    const width = target.clientWidth;
    const y = target.offsetTop;

    const x = leftJustified ? target.offsetLeft + width : target.offsetLeft + width / 2;

    this.tooltipService.show({
      coordinates: [x, y],
      isTouchEvent: false,
      dataItems: [
        {
          displayName: "",
          value: description,
          header: title,
        },
      ],
      identities: [],
    });
  }

  private getData(tableDataView: powerbi.DataViewTable, position: number) {
    const tableRow = tableDataView?.rows[0];

    if (tableRow && tableRow.length > position) {
      return tableDataView.rows[0][position].toString();
    }

    return "";
  }

  private toggleParagraphElement(
    tableDataView: powerbi.DataViewTable,
    position: number,
    element: HTMLParagraphElement
  ) {
    if (element) {
      element.textContent = this.getData(tableDataView, position);
    }
  }

  private toggleTrendElement(
    tableDataView: powerbi.DataViewTable,
    trendPosition: number,
    containingElement: HTMLDivElement,
    textElement: HTMLParagraphElement,
    iconElement: HTMLDivElement,
    trendIconSelected: string,
    trendUpColour: string,
    trendDownColour: string,
    directionPosition: number
  ) {
    const textValue = this.getData(tableDataView, trendPosition);

    if (textValue === "") {
      textElement.textContent = "";
      return;
    }

    if (trendIconSelected === "hide" || textValue === "0%") {
      containingElement.hidden = true;
      return;
    }

    containingElement.hidden = false;

    const directionValue = this.getData(tableDataView, directionPosition);

    textElement.textContent =
      (directionValue === "up-positive" || directionValue === "up-negative"
        ? "+ "
        : directionValue === "down-positive" || directionValue === "down-negative"
        ? "- "
        : "") + textValue;

    if (trendIconSelected === "none") {
      iconElement.hidden = true;
      return;
    }
    iconElement.hidden = false;

    this.swapSVGIcon(
      trendIconSelected.replace("#", directionValue.split("-")[0]),
      directionValue === "up-positive" || directionValue === "down-positive" ? trendUpColour : trendDownColour,
      iconElement
    );
  }

  /**
   * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
   * This method is called once every time we open properties pane or when the user edit any format property.
   */
  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }

  private swapSVGIcon(iconValue: string, currentColor: string, div: HTMLElement) {
    const parser = new DOMParser();
    var icon = parser.parseFromString(this.getSVGIcon(iconValue, currentColor), "image/svg+xml")
      .firstChild as SVGElement;
    //icon.ariaHidden = "true";
    while (div.firstChild) {
      div.removeChild(div.lastChild);
    }

    icon.style = "pointer-events: none;";
    div.appendChild(icon);
  }

  private getSVGIcon(iconValue: string, currentColor: string) {
    switch (iconValue) {
      case "none":
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>';
        break;
      case "a-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 12 4 4 4-4" />  <path d="M18 16V7" />  <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />  <path d="M3.304 13h6.392" /></svg>'
        );
      case "a-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 11 4-4 4 4" />  <path d="M18 16V7" />  <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />  <path d="M3.304 13h6.392" /></svg>'
        );
      case "a-large-small":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 16 2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16" />  <path d="M15.697 14h5.606" />  <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />  <path d="M3.304 13h6.392" /></svg>'
        );
      case "accessibility":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="16" cy="4" r="1" />  <path d="m18 19 1-7-6 1" />  <path d="m5 8 3-3 5.5 3-2.36 3.5" />  <path d="M4.24 14.5a5 5 0 0 0 6.88 6" />  <path d="M13.76 17.5a5 5 0 0 0-6.88-6" /></svg>'
        );
      case "activity":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>'
        );
      case "air-vent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 17.5a2.5 2.5 0 1 1-4 2.03V12" />  <path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />  <path d="M6 8h12" />  <path d="M6.6 15.572A2 2 0 1 0 10 17v-5" /></svg>'
        );
      case "airplay":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />  <path d="m12 15 5 6H7Z" /></svg>'
        );
      case "alarm-clock-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="13" r="8" />  <path d="M5 3 2 6" />  <path d="m22 6-3-3" />  <path d="M6.38 18.7 4 21" />  <path d="M17.64 18.67 20 21" />  <path d="m9 13 2 2 4-4" /></svg>'
        );
      case "alarm-clock-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="13" r="8" />  <path d="M5 3 2 6" />  <path d="m22 6-3-3" />  <path d="M6.38 18.7 4 21" />  <path d="M17.64 18.67 20 21" />  <path d="M9 13h6" /></svg>'
        );
      case "alarm-clock-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6.87 6.87a8 8 0 1 0 11.26 11.26" />  <path d="M19.9 14.25a8 8 0 0 0-9.15-9.15" />  <path d="m22 6-3-3" />  <path d="M6.26 18.67 4 21" />  <path d="m2 2 20 20" />  <path d="M4 4 2 6" /></svg>'
        );
      case "alarm-clock-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="13" r="8" />  <path d="M5 3 2 6" />  <path d="m22 6-3-3" />  <path d="M6.38 18.7 4 21" />  <path d="M17.64 18.67 20 21" />  <path d="M12 10v6" />  <path d="M9 13h6" /></svg>'
        );
      case "alarm-clock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="13" r="8" />  <path d="M12 9v4l2 2" />  <path d="M5 3 2 6" />  <path d="m22 6-3-3" />  <path d="M6.38 18.7 4 21" />  <path d="M17.64 18.67 20 21" /></svg>'
        );
      case "alarm-smoke":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 21c0-2.5 2-2.5 2-5" />  <path d="M16 21c0-2.5 2-2.5 2-5" />  <path d="m19 8-.8 3a1.25 1.25 0 0 1-1.2 1H7a1.25 1.25 0 0 1-1.2-1L5 8" />  <path d="M21 3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z" />  <path d="M6 21c0-2.5 2-2.5 2-5" /></svg>'
        );
      case "album":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <polyline points="11 3 11 11 14 8 17 11 17 3" /></svg>'
        );
      case "align-center-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12h20" />  <path d="M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />  <path d="M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" />  <path d="M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1" />  <path d="M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1" /></svg>'
        );
      case "align-center-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v20" />  <path d="M8 10H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h4" />  <path d="M16 10h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4" />  <path d="M8 20H7a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h1" />  <path d="M16 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" /></svg>'
        );
      case "align-center":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 12H7" />  <path d="M19 18H5" />  <path d="M21 6H3" /></svg>'
        );
      case "align-end-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="16" x="4" y="2" rx="2" />  <rect width="6" height="9" x="14" y="9" rx="2" />  <path d="M22 22H2" /></svg>'
        );
      case "align-end-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="16" height="6" x="2" y="4" rx="2" />  <rect width="9" height="6" x="9" y="14" rx="2" />  <path d="M22 22V2" /></svg>'
        );
      case "align-horizontal-distribute-center":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="4" y="5" rx="2" />  <rect width="6" height="10" x="14" y="7" rx="2" />  <path d="M17 22v-5" />  <path d="M17 7V2" />  <path d="M7 22v-3" />  <path d="M7 5V2" /></svg>'
        );
      case "align-horizontal-distribute-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="4" y="5" rx="2" />  <rect width="6" height="10" x="14" y="7" rx="2" />  <path d="M10 2v20" />  <path d="M20 2v20" /></svg>'
        );
      case "align-horizontal-distribute-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="4" y="5" rx="2" />  <rect width="6" height="10" x="14" y="7" rx="2" />  <path d="M4 2v20" />  <path d="M14 2v20" /></svg>'
        );
      case "align-horizontal-justify-center":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="2" y="5" rx="2" />  <rect width="6" height="10" x="16" y="7" rx="2" />  <path d="M12 2v20" /></svg>'
        );
      case "align-horizontal-justify-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="2" y="5" rx="2" />  <rect width="6" height="10" x="12" y="7" rx="2" />  <path d="M22 2v20" /></svg>'
        );
      case "align-horizontal-justify-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="6" y="5" rx="2" />  <rect width="6" height="10" x="16" y="7" rx="2" />  <path d="M2 2v20" /></svg>'
        );
      case "align-horizontal-space-around":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="10" x="9" y="7" rx="2" />  <path d="M4 22V2" />  <path d="M20 22V2" /></svg>'
        );
      case "align-horizontal-space-between":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="14" x="3" y="5" rx="2" />  <rect width="6" height="10" x="15" y="7" rx="2" />  <path d="M3 2v20" />  <path d="M21 2v20" /></svg>'
        );
      case "align-justify":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12h18" />  <path d="M3 18h18" />  <path d="M3 6h18" /></svg>'
        );
      case "align-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 12H3" />  <path d="M17 18H3" />  <path d="M21 6H3" /></svg>'
        );
      case "align-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12H9" />  <path d="M21 18H7" />  <path d="M21 6H3" /></svg>'
        );
      case "align-start-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="16" x="4" y="6" rx="2" />  <rect width="6" height="9" x="14" y="6" rx="2" />  <path d="M22 2H2" /></svg>'
        );
      case "align-start-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="9" height="6" x="6" y="14" rx="2" />  <rect width="16" height="6" x="6" y="4" rx="2" />  <path d="M2 2v20" /></svg>'
        );
      case "align-vertical-distribute-center":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17h-3" />  <path d="M22 7h-5" />  <path d="M5 17H2" />  <path d="M7 7H2" />  <rect x="5" y="14" width="14" height="6" rx="2" />  <rect x="7" y="4" width="10" height="6" rx="2" /></svg>'
        );
      case "align-vertical-distribute-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="6" x="5" y="14" rx="2" />  <rect width="10" height="6" x="7" y="4" rx="2" />  <path d="M2 20h20" />  <path d="M2 10h20" /></svg>'
        );
      case "align-vertical-distribute-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="6" x="5" y="14" rx="2" />  <rect width="10" height="6" x="7" y="4" rx="2" />  <path d="M2 14h20" />  <path d="M2 4h20" /></svg>'
        );
      case "align-vertical-justify-center":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="6" x="5" y="16" rx="2" />  <rect width="10" height="6" x="7" y="2" rx="2" />  <path d="M2 12h20" /></svg>'
        );
      case "align-vertical-justify-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="6" x="5" y="12" rx="2" />  <rect width="10" height="6" x="7" y="2" rx="2" />  <path d="M2 22h20" /></svg>'
        );
      case "align-vertical-justify-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="6" x="5" y="16" rx="2" />  <rect width="10" height="6" x="7" y="6" rx="2" />  <path d="M2 2h20" /></svg>'
        );
      case "align-vertical-space-around":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="10" height="6" x="7" y="9" rx="2" />  <path d="M22 20H2" />  <path d="M22 4H2" /></svg>'
        );
      case "align-vertical-space-between":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="6" x="5" y="15" rx="2" />  <rect width="10" height="6" x="7" y="3" rx="2" />  <path d="M2 21h20" />  <path d="M2 3h20" /></svg>'
        );
      case "ambulance":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10H6" />  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />  <path    d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14" />  <path d="M8 8v4" />  <path d="M9 18h6" />  <circle cx="17" cy="18" r="2" />  <circle cx="7" cy="18" r="2" /></svg>'
        );
      case "ampersand-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M16 17c-4-2-7-6-7-8a2 2 0 0 1 4 0c0 3-5 1.5-5 5 0 1.7 1.3 3 3 3 3 0 5-2 5-4" /></svg>'
        );
      case "ampersand":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.5 12c0 4.4-3.6 8-8 8A4.5 4.5 0 0 1 5 15.5c0-6 8-4 8-8.5a3 3 0 1 0-6 0c0 3 2.5 8.5 12 13" />  <path d="M16 12h3" /></svg>'
        );
      case "ampersands":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 17c-5-3-7-7-7-9a2 2 0 0 1 4 0c0 2.5-5 2.5-5 6 0 1.7 1.3 3 3 3 2.8 0 5-2.2 5-5" />  <path d="M22 17c-5-3-7-7-7-9a2 2 0 0 1 4 0c0 2.5-5 2.5-5 6 0 1.7 1.3 3 3 3 2.8 0 5-2.2 5-5" /></svg>'
        );
      case "amphora":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v5.632c0 .424-.272.795-.653.982A6 6 0 0 0 6 14c.006 4 3 7 5 8" />  <path d="M10 5H8a2 2 0 0 0 0 4h.68" />  <path d="M14 2v5.632c0 .424.272.795.652.982A6 6 0 0 1 18 14c0 4-3 7-5 8" />  <path d="M14 5h2a2 2 0 0 1 0 4h-.68" />  <path d="M18 22H6" />  <path d="M9 2h6" /></svg>'
        );
      case "anchor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22V8" />  <path d="M5 12H2a10 10 0 0 0 20 0h-3" />  <circle cx="12" cy="5" r="3" /></svg>'
        );
      case "angry":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M16 16s-1.5-2-4-2-4 2-4 2" />  <path d="M7.5 8 10 9" />  <path d="m14 9 2.5-1" />  <path d="M9 10h.01" />  <path d="M15 10h.01" /></svg>'
        );
      case "annoyed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M8 15h8" />  <path d="M8 9h2" />  <path d="M14 9h2" /></svg>'
        );
      case "antenna":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12 7 2" />  <path d="m7 12 5-10" />  <path d="m12 12 5-10" />  <path d="m17 12 5-10" />  <path d="M4.5 7h15" />  <path d="M12 16v6" /></svg>'
        );
      case "anvil":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" />  <path d="M7 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7H8a1 1 0 0 1-1-1z" />  <path d="M9 12v5" />  <path d="M15 12v5" />  <path d="M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1" /></svg>'
        );
      case "aperture":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m14.31 8 5.74 9.94" />  <path d="M9.69 8h11.48" />  <path d="m7.38 12 5.74-9.94" />  <path d="M9.69 16 3.95 6.06" />  <path d="M14.31 16H2.83" />  <path d="m16.62 12-5.74 9.94" /></svg>'
        );
      case "app-window-mac":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="16" x="2" y="4" rx="2" />  <path d="M6 8h.01" />  <path d="M10 8h.01" />  <path d="M14 8h.01" /></svg>'
        );
      case "app-window":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="2" y="4" width="20" height="16" rx="2" />  <path d="M10 4v4" />  <path d="M2 8h20" />  <path d="M6 4v4" /></svg>'
        );
      case "apple-core":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2a2 2 0 0 0-2 2v2.53" />  <path d="M12 6.53a5.98 5.98 0 0 0-8.5.5 4 4 0 0 1 4.02 5.86 4 4 0 0 1-1.76 7.04C6.82 21.17 7.97 22 9 22c1.5 0 1.5-1 3-1s1.5 1 3 1c1.03 0 2.18-.83 3.24-2.07a4 4 0 0 1-1.76-7.03 4 4 0 0 1 4.02-5.87 5.99 5.99 0 0 0-8.5-.5Z" /></svg>'
        );
      case "apple":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6.528V3a1 1 0 0 1 1-1h0" />  <path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" /></svg>'
        );
      case "archive-restore":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="5" x="2" y="3" rx="1" />  <path d="M4 8v11a2 2 0 0 0 2 2h2" />  <path d="M20 8v11a2 2 0 0 1-2 2h-2" />  <path d="m9 15 3-3 3 3" />  <path d="M12 12v9" /></svg>'
        );
      case "archive-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="5" x="2" y="3" rx="1" />  <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />  <path d="m9.5 17 5-5" />  <path d="m9.5 12 5 5" /></svg>'
        );
      case "archive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="5" x="2" y="3" rx="1" />  <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />  <path d="M10 12h4" /></svg>'
        );
      case "armchair":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />  <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />  <path d="M5 18v2" />  <path d="M19 18v2" /></svg>'
        );
      case "arrow-big-down-dash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 11a1 1 0 0 0 1 1h2.939a1 1 0 0 1 .75 1.811l-6.835 6.836a1.207 1.207 0 0 1-1.707 0L4.31 13.81a1 1 0 0 1 .75-1.811H8a1 1 0 0 0 1-1V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1z" />  <path d="M9 4h6" /></svg>'
        );
      case "arrow-big-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 11a1 1 0 0 0 1 1h2.939a1 1 0 0 1 .75 1.811l-6.835 6.836a1.207 1.207 0 0 1-1.707 0L4.31 13.81a1 1 0 0 1 .75-1.811H8a1 1 0 0 0 1-1V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1z" /></svg>'
        );
      case "arrow-big-left-dash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 9a1 1 0 0 1-1-1V5.061a1 1 0 0 0-1.811-.75l-6.835 6.836a1.207 1.207 0 0 0 0 1.707l6.835 6.835a1 1 0 0 0 1.811-.75V16a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" />  <path d="M20 9v6" /></svg>'
        );
      case "arrow-big-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 9a1 1 0 0 1-1-1V5.061a1 1 0 0 0-1.811-.75l-6.835 6.836a1.207 1.207 0 0 0 0 1.707l6.835 6.835a1 1 0 0 0 1.811-.75V16a1 1 0 0 1 1-1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" /></svg>'
        );
      case "arrow-big-right-dash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 9a1 1 0 0 0 1-1V5.061a1 1 0 0 1 1.811-.75l6.836 6.836a1.207 1.207 0 0 1 0 1.707l-6.836 6.835a1 1 0 0 1-1.811-.75V16a1 1 0 0 0-1-1H9a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />  <path d="M4 9v6" /></svg>'
        );
      case "arrow-big-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 9a1 1 0 0 0 1-1V5.061a1 1 0 0 1 1.811-.75l6.836 6.836a1.207 1.207 0 0 1 0 1.707l-6.836 6.835a1 1 0 0 1-1.811-.75V16a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" /></svg>'
        );
      case "arrow-big-up-dash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 13a1 1 0 0 0-1-1H5.061a1 1 0 0 1-.75-1.811l6.836-6.835a1.207 1.207 0 0 1 1.707 0l6.835 6.835a1 1 0 0 1-.75 1.811H16a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />  <path d="M9 20h6" /></svg>'
        );
      case "arrow-big-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 13a1 1 0 0 0-1-1H5.061a1 1 0 0 1-.75-1.811l6.836-6.835a1.207 1.207 0 0 1 1.707 0l6.835 6.835a1 1 0 0 1-.75 1.811H16a1 1 0 0 0-1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" /></svg>'
        );
      case "arrow-down-0-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 20V4" />  <rect x="15" y="4" width="4" height="6" ry="2" />  <path d="M17 20v-6h-2" />  <path d="M15 20h4" /></svg>'
        );
      case "arrow-down-1-0":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 20V4" />  <path d="M17 10V4h-2" />  <path d="M15 10h4" />  <rect x="15" y="14" width="4" height="6" ry="2" /></svg>'
        );
      case "arrow-down-a-z":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 20V4" />  <path d="M20 8h-5" />  <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10" />  <path d="M15 14h5l-5 6h5" /></svg>'
        );
      case "arrow-down-from-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 3H5" />  <path d="M12 21V7" />  <path d="m6 15 6 6 6-6" /></svg>'
        );
      case "arrow-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 7 7 17" />  <path d="M17 17H7V7" /></svg>'
        );
      case "arrow-down-narrow-wide":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 20V4" />  <path d="M11 4h4" />  <path d="M11 8h7" />  <path d="M11 12h10" /></svg>'
        );
      case "arrow-down-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 7 10 10" />  <path d="M17 7v10H7" /></svg>'
        );
      case "arrow-down-to-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v14" />  <path d="m19 9-7 7-7-7" />  <circle cx="12" cy="21" r="1" /></svg>'
        );
      case "arrow-down-to-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17V3" />  <path d="m6 11 6 6 6-6" />  <path d="M19 21H5" /></svg>'
        );
      case "arrow-down-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 20V4" />  <path d="m21 8-4-4-4 4" />  <path d="M17 4v16" /></svg>'
        );
      case "arrow-down-wide-narrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 20V4" />  <path d="M11 4h10" />  <path d="M11 8h7" />  <path d="M11 12h4" /></svg>'
        );
      case "arrow-down-z-a":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 16 4 4 4-4" />  <path d="M7 4v16" />  <path d="M15 4h5l-5 6h5" />  <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" />  <path d="M20 18h-5" /></svg>'
        );
      case "arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 5v14" />  <path d="m19 12-7 7-7-7" /></svg>'
        );
      case "arrow-left-from-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 6-6 6 6 6" />  <path d="M3 12h14" />  <path d="M21 19V5" /></svg>'
        );
      case "arrow-left-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3 4 7l4 4" />  <path d="M4 7h16" />  <path d="m16 21 4-4-4-4" />  <path d="M20 17H4" /></svg>'
        );
      case "arrow-left-to-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 19V5" />  <path d="m13 6-6 6 6 6" />  <path d="M7 12h14" /></svg>'
        );
      case "arrow-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 19-7-7 7-7" />  <path d="M19 12H5" /></svg>'
        );
      case "arrow-right-from-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 5v14" />  <path d="M21 12H7" />  <path d="m15 18 6-6-6-6" /></svg>'
        );
      case "arrow-right-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 3 4 4-4 4" />  <path d="M20 7H4" />  <path d="m8 21-4-4 4-4" />  <path d="M4 17h16" /></svg>'
        );
      case "arrow-right-to-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 12H3" />  <path d="m11 18 6-6-6-6" />  <path d="M21 5v14" /></svg>'
        );
      case "arrow-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 12h14" />  <path d="m12 5 7 7-7 7" /></svg>'
        );
      case "arrow-up-0-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" />  <rect x="15" y="4" width="4" height="6" ry="2" />  <path d="M17 20v-6h-2" />  <path d="M15 20h4" /></svg>'
        );
      case "arrow-up-1-0":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" />  <path d="M17 10V4h-2" />  <path d="M15 10h4" />  <rect x="15" y="14" width="4" height="6" ry="2" /></svg>'
        );
      case "arrow-up-a-z":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" />  <path d="M20 8h-5" />  <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10" />  <path d="M15 14h5l-5 6h5" /></svg>'
        );
      case "arrow-up-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21 16-4 4-4-4" />  <path d="M17 20V4" />  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" /></svg>'
        );
      case "arrow-up-from-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m5 9 7-7 7 7" />  <path d="M12 16V2" />  <circle cx="12" cy="21" r="1" /></svg>'
        );
      case "arrow-up-from-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 9-6-6-6 6" />  <path d="M12 3v14" />  <path d="M5 21h14" /></svg>'
        );
      case "arrow-up-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 17V7h10" />  <path d="M17 17 7 7" /></svg>'
        );
      case "arrow-up-narrow-wide":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" />  <path d="M11 12h4" />  <path d="M11 16h7" />  <path d="M11 20h10" /></svg>'
        );
      case "arrow-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 7h10v10" />  <path d="M7 17 17 7" /></svg>'
        );
      case "arrow-up-to-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 3h14" />  <path d="m18 13-6-6-6 6" />  <path d="M12 7v14" /></svg>'
        );
      case "arrow-up-wide-narrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" />  <path d="M11 12h10" />  <path d="M11 16h7" />  <path d="M11 20h4" /></svg>'
        );
      case "arrow-up-z-a":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 8 4-4 4 4" />  <path d="M7 4v16" />  <path d="M15 4h5l-5 6h5" />  <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" />  <path d="M20 18h-5" /></svg>'
        );
      case "arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m5 12 7-7 7 7" />  <path d="M12 19V5" /></svg>'
        );
      case "arrows-up-down-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 9 3-3 3 3" />  <path d="M9 6v6" />  <rect width="20" height="20" x="2" y="2" rx="2" />  <path d="M15 18v-6" />  <path d="m18 15-3 3-3-3" /></svg>'
        );
      case "arrows-up-from-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m4 6 3-3 3 3" />  <path d="M7 17V3" />  <path d="m14 6 3-3 3 3" />  <path d="M17 17V3" />  <path d="M4 21h16" /></svg>'
        );
      case "asterisk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v12" />  <path d="M17.196 9 6.804 15" />  <path d="m6.804 9 10.392 6" /></svg>'
        );
      case "astronaut-helmet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10.6 13.4 6.3 6.1c.3.5.1 1.1-.4 1.4-1.4.7-2.9 1.1-4.5 1.1a2 2 0 0 1-1.4-.6l-8-8A2 2 0 0 1 2 12a10 10 0 0 1 19.44-3.3c.3.7-.3 1.3-1 1.3H12" />  <circle cx="12" cy="12" r="2" />  <path d="M16.2 18.8c3-1.9 4.4-5.5 3.5-8.8" /></svg>'
        );
      case "at-sign-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M14 17.7a6 6 0 1 1 4-5.7 2 2 0 0 1-4 0" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "at-sign-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <path d="M14 17.7a6 6 0 1 1 4-5.7 2 2 0 0 1-4 0" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "at-sign":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="4" />  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></svg>'
        );
      case "atom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="1" />  <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />  <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" /></svg>'
        );
      case "audio-lines":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 10v3" />  <path d="M6 6v11" />  <path d="M10 3v18" />  <path d="M14 8v7" />  <path d="M18 5v13" />  <path d="M22 10v3" /></svg>'
        );
      case "audio-waveform":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" /></svg>'
        );
      case "avocado":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 7a4.95 4.95 0 0 0-8.6-3.4c-1.5 1.6-1.6 1.8-5 2.6a8 8 0 1 0 9.4 9.5c.7-3.4 1-3.6 2.6-5 1-1 1.6-2.3 1.6-3.7" />  <circle cx="10" cy="14" r="3.5" /></svg>'
        );
      case "award":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />  <circle cx="12" cy="8" r="6" /></svg>'
        );
      case "axe":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9" />  <path d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z" /></svg>'
        );
      case "axis-3d":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.5 10.5 15 9" />  <path d="M4 4v15a1 1 0 0 0 1 1h15" />  <path d="M4.293 19.707 6 18" />  <path d="m9 15 1.5-1.5" /></svg>'
        );
      case "baby-pacifier":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.1 7.4a1.95 1.95 0 0 0 3.7-1.5c-.8-2-3.2-3-5.2-2.2-2.9 1.2-4.8 3.7-5.4 6.5a1.95 1.95 0 0 0 0 3.6A9.05 9.05 0 0 0 7 19.42" />  <path d="M17.1 19.4c2-1.3 3.3-3.4 3.8-5.6a2 2 0 0 0 0-3.6 9.83 9.83 0 0 0-3.2-5" />  <path d="M8 12h.01" />  <path d="M16 12h.01" />  <circle cx="12" cy="16" r="2" />  <path d="M10 16h-.5A2.5 2.5 0 0 0 7 18.5v1A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-1a2.5 2.5 0 0 0-2.5-2.5H14" /></svg>'
        );
      case "baby":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />  <path d="M15 12h.01" />  <path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />  <path d="M9 12h.01" /></svg>'
        );
      case "backpack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />  <path d="M8 10h8" />  <path d="M8 18h8" />  <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>'
        );
      case "bacon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 8c-2 5-5 2-7 7s-5 2-7 7l-6-6c2-5 5-2 7-7s5-2 7-7Z" />  <path d="M5 19c2-5 5-2 7-7s5-2 7-7" /></svg>'
        );
      case "badge-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <line x1="12" x2="12" y1="8" y2="12" />  <line x1="12" x2="12.01" y1="16" y2="16" /></svg>'
        );
      case "badge-cent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M12 7v10" />  <path d="M15.4 10a4 4 0 1 0 0 4" /></svg>'
        );
      case "badge-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="m9 12 2 2 4-4" /></svg>'
        );
      case "badge-dollar-sign":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />  <path d="M12 18V6" /></svg>'
        );
      case "badge-euro":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M7 12h5" />  <path d="M15 9.4a4 4 0 1 0 0 5.2" /></svg>'
        );
      case "badge-indian-rupee":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M8 8h8" />  <path d="M8 12h8" />  <path d="m13 17-5-1h1a4 4 0 0 0 0-8" /></svg>'
        );
      case "badge-info":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <line x1="12" x2="12" y1="16" y2="12" />  <line x1="12" x2="12.01" y1="8" y2="8" /></svg>'
        );
      case "badge-japanese-yen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="m9 8 3 3v7" />  <path d="m12 11 3-3" />  <path d="M9 12h6" />  <path d="M9 16h6" /></svg>'
        );
      case "badge-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <line x1="8" x2="16" y1="12" y2="12" /></svg>'
        );
      case "badge-percent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="m15 9-6 6" />  <path d="M9 9h.01" />  <path d="M15 15h.01" /></svg>'
        );
      case "badge-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <line x1="12" x2="12" y1="8" y2="16" />  <line x1="8" x2="16" y1="12" y2="12" /></svg>'
        );
      case "badge-pound-sterling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M8 12h4" />  <path d="M10 16V9.5a2.5 2.5 0 0 1 5 0" />  <path d="M8 16h7" /></svg>'
        );
      case "badge-question-mark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />  <line x1="12" x2="12.01" y1="17" y2="17" /></svg>'
        );
      case "badge-russian-ruble":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M9 16h5" />  <path d="M9 12h5a2 2 0 1 0 0-4h-3v9" /></svg>'
        );
      case "badge-swiss-franc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <path d="M11 17V8h4" />  <path d="M11 12h3" />  <path d="M9 16h4" /></svg>'
        );
      case "badge-turkish-lira":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 7v10a5 5 0 0 0 5-5" />  <path d="m15 8-6 3" />  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76" /></svg>'
        );
      case "badge-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />  <line x1="15" x2="9" y1="9" y2="15" />  <line x1="9" x2="15" y1="9" y2="15" /></svg>'
        );
      case "badge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /></svg>'
        );
      case "bag-hand":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 8c0-2.8 1.8-5 4-5s4 2.2 4 5" />  <path d="m21 18.6-2-9.8c-.1-.5-.5-.8-1-.8H6c-.5 0-.9.3-1 .8l-2 9.8v.4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z" />  <path d="M12 12v4" />  <path d="M18 8A6 6 0 0 1 6 8" /></svg>'
        );
      case "baggage-claim":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2" />  <path d="M17 14V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v10" />  <rect width="13" height="8" x="8" y="6" rx="1" />  <circle cx="18" cy="20" r="2" />  <circle cx="9" cy="20" r="2" /></svg>'
        );
      case "ban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.929 4.929 19.07 19.071" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "banana":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5" />  <path d="M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z" /></svg>'
        );
      case "bandage":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10.01h.01" />  <path d="M10 14.01h.01" />  <path d="M14 10.01h.01" />  <path d="M14 14.01h.01" />  <path d="M18 6v11.5" />  <path d="M6 6v12" />  <rect x="2" y="6" width="20" height="12" rx="2" /></svg>'
        );
      case "banknote-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />  <path d="m16 19 3 3 3-3" />  <path d="M18 12h.01" />  <path d="M19 16v6" />  <path d="M6 12h.01" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "banknote-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />  <path d="M18 12h.01" />  <path d="M19 22v-6" />  <path d="m22 19-3-3-3 3" />  <path d="M6 12h.01" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "banknote-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />  <path d="m17 17 5 5" />  <path d="M18 12h.01" />  <path d="m22 17-5 5" />  <path d="M6 12h.01" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "banknote":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="12" x="2" y="6" rx="2" />  <circle cx="12" cy="12" r="2" />  <path d="M6 12h.01M18 12h.01" /></svg>'
        );
      case "barbecue":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 4c0-1 2-1 2-2" />  <path d="M12 4c0-1 2-1 2-2" />  <path d="M18 4c0-1 2-1 2-2" />  <path d="M3 8a9.06 9 0 0 0 18 0Z" />  <path d="m9.2 15.6-1.3 2.6" />  <circle cx="7" cy="20" r="2" />  <path d="M9 20h8" />  <path d="M14.8 15.6 18 22" /></svg>'
        );
      case "barber-pole":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 6h10" />  <path d="M7 22h10" />  <path d="M8 22V6a4 4 0 0 1 8 0v16" />  <path d="m8 11.5 8-4" />  <path d="m8 16 8-4" />  <path d="m8 20.5 8-4" /></svg>'
        );
      case "barcode":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 5v14" />  <path d="M8 5v14" />  <path d="M12 5v14" />  <path d="M17 5v14" />  <path d="M21 5v14" /></svg>'
        );
      case "barn":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12H2l2-6 8-4 8 4Z" />  <rect width="4" height="4" x="10" y="8" />  <path d="m7 22 10-10v10L7 12Z" />  <path d="M21 12v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8" /></svg>'
        );
      case "barrel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 3a41 41 0 0 0 0 18" />  <path d="M14 3a41 41 0 0 1 0 18" />  <path d="M17 3a2 2 0 0 1 1.68.92 15.25 15.25 0 0 1 0 16.16A2 2 0 0 1 17 21H7a2 2 0 0 1-1.68-.92 15.25 15.25 0 0 1 0-16.16A2 2 0 0 1 7 3z" />  <path d="M3.84 17h16.32" />  <path d="M3.84 7h16.32" /></svg>'
        );
      case "baseball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12c5.5 0 10-4.5 10-10" />  <circle cx="12" cy="12" r="10" />  <path d="M22 12c-5.5 0-10 4.5-10 10" />  <path d="m8 11.5-1.5-2" />  <path d="m11.5 8-2-1.5" />  <path d="m14.5 17.5-2-1.5" />  <path d="m17.5 14.5-1.5-2" /></svg>'
        );
      case "baseline-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9.5 12h5" />  <path d="m9 13 3-6 3 6" />  <path d="M7 17h10" /></svg>'
        );
      case "baseline":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 20h16" />  <path d="m6 16 6-12 6 12" />  <path d="M8 12h8" /></svg>'
        );
      case "basketball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M2.1 13.4A10.1 10.1 0 0 0 13.4 2.1" />  <path d="m5 4.9 14 14.2" />  <path d="M21.9 10.6a10.1 10.1 0 0 0-11.3 11.3" /></svg>'
        );
      case "bat-ball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18" cy="18" r="4" />  <path d="m4 8 10 10" />  <path d="M20.8 15.2c1.9-3.4 1.4-7.7-1.4-10.6-3.5-3.5-9.1-3.5-12.5 0-4.7 4.7-5.1 6.9-1.4 11.1l-2.9 2.9c-.8.8-.8 2 0 2.8.8.8 2 .8 2.8 0l2.9-2.9c2.6 2.3 4.5 3 6.6 2.1" /></svg>'
        );
      case "bath-bubble":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 3h.01" />  <circle cx="11.5" cy="6.5" r=".5" />  <circle cx="16.5" cy="7.5" r=".5" />  <path d="M2 12h6" />  <path d="M13 15H8v-3c0-.6.4-1 1-1h3c.6 0 1 .4 1 1Z" />  <path d="M13 12h9" />  <path d="M4 12v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />  <path d="M7 19v2" />  <path d="M17 19v2" /></svg>'
        );
      case "bath":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 4 8 6" />  <path d="M17 19v2" />  <path d="M2 12h20" />  <path d="M7 19v2" />  <path d="M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></svg>'
        );
      case "battery-charging":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 7-3 5h4l-3 5" />  <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />  <path d="M22 14v-4" />  <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" /></svg>'
        );
      case "battery-full":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10v4" />  <path d="M14 10v4" />  <path d="M22 14v-4" />  <path d="M6 10v4" />  <rect x="2" y="6" width="16" height="12" rx="2" /></svg>'
        );
      case "battery-low":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 14v-4" />  <path d="M6 14v-4" />  <rect x="2" y="6" width="16" height="12" rx="2" /></svg>'
        );
      case "battery-medium":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 14v-4" />  <path d="M22 14v-4" />  <path d="M6 14v-4" />  <rect x="2" y="6" width="16" height="12" rx="2" /></svg>'
        );
      case "battery-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 9v6" />  <path d="M12.543 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.605" />  <path d="M22 14v-4" />  <path d="M7 12h6" />  <path d="M7.606 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.606" /></svg>'
        );
      case "battery-warning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 17h.01" />  <path d="M10 7v6" />  <path d="M14 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />  <path d="M22 14v-4" />  <path d="M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" /></svg>'
        );
      case "battery":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M 22 14 L 22 10" />  <rect x="2" y="6" width="16" height="12" rx="2" /></svg>'
        );
      case "beach-ball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M19.1 4.9c-1.6-1.6-6 .3-9.9 4.2C5.3 13 3.4 17.4 5 19c1.6 1.6 6-.3 9.9-4.2 3.8-3.9 5.7-8.3 4.2-9.9" /></svg>'
        );
      case "beaker":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.5 3h15" />  <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" />  <path d="M6 14h12" /></svg>'
        );
      case "bean-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22a13.96 13.96 0 0 0 9.9-4.1" />  <path d="M10.75 5.093A6 6 0 0 1 22 8c0 2.411-.61 4.68-1.683 6.66" />  <path d="M5.341 10.62a4 4 0 0 0 6.487 1.208M10.62 5.341a4.015 4.015 0 0 1 2.039 2.04" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "bean":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z" />  <path d="M5.341 10.62a4 4 0 1 0 5.279-5.28" /></svg>'
        );
      case "bear-face":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 7 .5.5" />  <path d="m18 7-.5.5" />  <path d="M20.8 4.2c-1.6-1.6-4.1-1.6-5.7 0l-1 1a13.6 13.6 0 0 0-4.2 0l-1-1a4 4 0 0 0-5.8 5.55A7 7 0 0 0 2 13.5C2 18.2 6.5 22 12 22s10-3.8 10-8.5a7 7 0 0 0-1.1-3.8c1.5-1.6 1.5-4-.1-5.5" />  <path d="M10 12v-.5" />  <path d="M14 12v-.5" />  <path d="M14 16h-4" />  <path d="M12 16v2" /></svg>'
        );
      case "bed-bunk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 22V2" />  <path d="M2 5h18a2 2 0 0 1 2 2v15" />  <path d="M6 5v5" />  <path d="M2 10h20" />  <path d="M2 14h20" />  <path d="M22 19H2" />  <path d="M6 14v5" /></svg>'
        );
      case "bed-double":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />  <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />  <path d="M12 4v6" />  <path d="M2 18h20" /></svg>'
        );
      case "bed-single":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />  <path d="M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />  <path d="M3 18h18" /></svg>'
        );
      case "bed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 4v16" />  <path d="M2 8h18a2 2 0 0 1 2 2v10" />  <path d="M2 17h20" />  <path d="M6 8v9" /></svg>'
        );
      case "bee-hive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="10" height="4" x="7" y="2" rx="2" />  <rect width="16" height="4" x="4" y="6" rx="2" />  <path d="M14 14h6a2 2 0 1 0 0-4H4a2 2 0 1 0 0 4h6" />  <rect width="4" height="8" x="10" y="10" rx="2" />  <path d="M19 14a2 2 0 1 1 0 4H5a2 2 0 1 1 0-4" />  <rect width="14" height="4" x="5" y="18" rx="2" /></svg>'
        );
      case "bee":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 2 1.88 1.88" />  <path d="M14.12 3.88 16 2" />  <path d="M9 7V6a3 3 0 1 1 6 0v1" />  <path d="M5 7a3 3 0 1 0 2.2 5.1C9.1 10 12 7 12 7s2.9 3 4.8 5.1A3 3 0 1 0 19 7Z" />  <path d="M7.56 12h8.87" />  <path d="M7.5 17h9" />  <path d="M15.5 10.7c.9.9 1.4 2.1 1.5 3.3 0 5.8-5 8-5 8s-5-2.2-5-8c.1-1.2.6-2.4 1.5-3.3" /></svg>'
        );
      case "beef":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3" />  <path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1-2.29 7.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" />  <circle cx="12.5" cy="8.5" r="2.5" /></svg>'
        );
      case "beer-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 13v5" />  <path d="M17 11.47V8" />  <path d="M17 11h1a3 3 0 0 1 2.745 4.211" />  <path d="m2 2 20 20" />  <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />  <path d="M7.536 7.535C6.766 7.649 6.154 8 5.5 8a2.5 2.5 0 0 1-1.768-4.268" />  <path d="M8.727 3.204C9.306 2.767 9.885 2 11 2c1.56 0 2 1.5 3 1.5s1.72-.5 2.5-.5a1 1 0 1 1 0 5c-.78 0-1.5-.5-2.5-.5a3.149 3.149 0 0 0-.842.12" />  <path d="M9 14.6V18" /></svg>'
        );
      case "beer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 11h1a3 3 0 0 1 0 6h-1" />  <path d="M9 12v6" />  <path d="M13 12v6" />  <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" />  <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" /></svg>'
        );
      case "beetle-scarab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 2 1.88 1.88" />  <path d="M14.12 3.88 16 2" />  <path d="M9 7.13V6a3 3 0 1 1 6 0v1.13" />  <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />  <path d="M12 20v-9" />  <path d="M5 4.8C3.2 6.2 2 8.5 2 11h20c0-2.5-1.2-4.8-3-6.2" />  <path d="M6.08 15h-4c.2 2.4 1.25 4.4 2.8 6" />  <path d="M19.1 21a9 9.4 0 0 0 2.82-6h-4" /></svg>'
        );
      case "bell-concierge-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="19" cy="9" r="3" />  <path d="M2 18a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2Z" />  <path d="M12 4v4c-4.4 0-8 3.6-8 8" />  <path d="M10 4h4" /></svg>'
        );
      case "bell-concierge-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 20 20" />  <path d="M12 4v2.3" />  <path d="M10 4h4" />  <path d="M19.8 14.1a8 8 0 0 0-5.9-5.9" />  <path d="M8.7 8.7C5.9 10 4 12.8 4 16" />  <path d="M16 16H4a2 2 0 0 0-2 2v2h18" /></svg>'
        );
      case "bell-concierge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" />  <path d="M20 16a8 8 0 1 0-16 0" />  <path d="M12 4v4" />  <path d="M10 4h4" /></svg>'
        );
      case "bell-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.268 21a2 2 0 0 0 3.464 0" />  <path d="M13.916 2.314A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.74 7.327A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673 9 9 0 0 1-.585-.665" />  <circle cx="18" cy="8" r="3" /></svg>'
        );
      case "bell-electric":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.518 17.347A7 7 0 0 1 14 19" />  <path d="M18.8 4A11 11 0 0 1 20 9" />  <path d="M9 9h.01" />  <circle cx="20" cy="16" r="2" />  <circle cx="9" cy="9" r="7" />  <rect x="4" y="16" width="10" height="6" rx="2" /></svg>'
        );
      case "bell-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.268 21a2 2 0 0 0 3.464 0" />  <path d="M15 8h6" />  <path d="M16.243 3.757A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673A9.4 9.4 0 0 1 18.667 12" /></svg>'
        );
      case "bell-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.268 21a2 2 0 0 0 3.464 0" />  <path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742" />  <path d="m2 2 20 20" />  <path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" /></svg>'
        );
      case "bell-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.268 21a2 2 0 0 0 3.464 0" />  <path d="M15 8h6" />  <path d="M18 5v6" />  <path d="M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332" /></svg>'
        );
      case "bell-ring":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.268 21a2 2 0 0 0 3.464 0" />  <path d="M22 8c0-2.3-.8-4.3-2-6" />  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />  <path d="M4 2C2.8 3.7 2 5.7 2 8" /></svg>'
        );
      case "bell":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.268 21a2 2 0 0 0 3.464 0" />  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></svg>'
        );
      case "belt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7.3 9H3c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1h4.3" />  <path d="M6 6h3" />  <path d="M13 6h.01" />  <rect width="10" height="8" x="7" y="2" rx="2" />  <path d="M16.7 3H21c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1h-4.3" />  <path d="m10.5 10-8.1 6.2" />  <path d="M21.6 8.8 12.2 16" />  <path d="M3 22c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1h16l3 3-3 3Z" /></svg>'
        );
      case "between-horizontal-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="13" height="7" x="3" y="3" rx="1" />  <path d="m22 15-3-3 3-3" />  <rect width="13" height="7" x="3" y="14" rx="1" /></svg>'
        );
      case "between-horizontal-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="13" height="7" x="8" y="3" rx="1" />  <path d="m2 9 3 3-3 3" />  <rect width="13" height="7" x="8" y="14" rx="1" /></svg>'
        );
      case "between-vertical-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="13" x="3" y="3" rx="1" />  <path d="m9 22 3-3 3 3" />  <rect width="7" height="13" x="14" y="3" rx="1" /></svg>'
        );
      case "between-vertical-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="13" x="3" y="8" rx="1" />  <path d="m15 2-3 3-3-3" />  <rect width="7" height="13" x="14" y="8" rx="1" /></svg>'
        );
      case "biceps-flexed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1" />  <path d="M15 14a5 5 0 0 0-7.584 2" />  <path d="M9.964 6.825C8.019 7.977 9.5 13 8 15" /></svg>'
        );
      case "bike":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18.5" cy="17.5" r="3.5" />  <circle cx="5.5" cy="17.5" r="3.5" />  <circle cx="15" cy="5" r="1" />  <path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>'
        );
      case "binary":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="14" y="14" width="4" height="6" rx="2" />  <rect x="6" y="4" width="4" height="6" rx="2" />  <path d="M6 20h4" />  <path d="M14 10h4" />  <path d="M6 14h2v6" />  <path d="M14 4h2v6" /></svg>'
        );
      case "binoculars":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10h4" />  <path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" />  <path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z" />  <path d="M 22 16 L 2 16" />  <path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z" />  <path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" /></svg>'
        );
      case "biohazard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="11.9" r="2" />  <path d="M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6" />  <path d="m8.9 10.1 1.4.8" />  <path d="M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5" />  <path d="m15.1 10.1-1.4.8" />  <path d="M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2" />  <path d="M12 13.9v1.6" />  <path d="M13.5 5.4c-1-.2-2-.2-3 0" />  <path d="M17 16.4c.7-.7 1.2-1.6 1.5-2.5" />  <path d="M5.5 13.9c.3.9.8 1.8 1.5 2.5" /></svg>'
        );
      case "bird":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 7h.01" />  <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />  <path d="m20 7 2 .5-2 .5" />  <path d="M10 18v3" />  <path d="M14 17.75V21" />  <path d="M7 18a6 6 0 0 0 3.84-10.61" /></svg>'
        );
      case "bitcoin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727" /></svg>'
        );
      case "blend":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="9" cy="9" r="7" />  <circle cx="15" cy="15" r="7" /></svg>'
        );
      case "blinds":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3h18" />  <path d="M20 7H8" />  <path d="M20 11H8" />  <path d="M10 19h10" />  <path d="M8 15h12" />  <path d="M4 3v14" />  <circle cx="4" cy="19" r="2" /></svg>'
        );
      case "blocks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2" />  <rect x="14" y="2" width="8" height="8" rx="1" /></svg>'
        );
      case "bluetooth-connected":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 7 10 10-5 5V2l5 5L7 17" />  <line x1="18" x2="21" y1="12" y2="12" />  <line x1="3" x2="6" y1="12" y2="12" /></svg>'
        );
      case "bluetooth-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 17-5 5V12l-5 5" />  <path d="m2 2 20 20" />  <path d="M14.5 9.5 17 7l-5-5v4.5" /></svg>'
        );
      case "bluetooth-searching":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 7 10 10-5 5V2l5 5L7 17" />  <path d="M20.83 14.83a4 4 0 0 0 0-5.66" />  <path d="M18 12h.01" /></svg>'
        );
      case "bluetooth":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 7 10 10-5 5V2l5 5L7 17" /></svg>'
        );
      case "bold-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 12h5.5a2.5 2.5 0 0 1 0 5H8V7h5a2.5 2.5 0 0 1 0 5" /></svg>'
        );
      case "bold":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" /></svg>'
        );
      case "bolt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />  <circle cx="12" cy="12" r="4" /></svg>'
        );
      case "bomb":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11" cy="13" r="9" />  <path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95" />  <path d="m22 2-1.5 1.5" /></svg>'
        );
      case "bone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" /></svg>'
        );
      case "book-a":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="m8 13 4-7 4 7" />  <path d="M9.1 11h5.7" /></svg>'
        );
      case "book-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13h.01" />  <path d="M12 6v3" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>'
        );
      case "book-audio":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v7" />  <path d="M16 8v3" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M8 8v3" /></svg>'
        );
      case "book-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="m9 9.5 2 2 4-4" /></svg>'
        );
      case "book-copy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 7a2 2 0 0 0-2 2v11" />  <path d="M5.803 18H5a2 2 0 0 0 0 4h9.5a.5.5 0 0 0 .5-.5V21" />  <path d="M9 15V4a2 2 0 0 1 2-2h9.5a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H11a2 2 0 0 1 0-4h10" /></svg>'
        );
      case "book-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17h1.5" />  <path d="M12 22h1.5" />  <path d="M12 2h1.5" />  <path d="M17.5 22H19a1 1 0 0 0 1-1" />  <path d="M17.5 2H19a1 1 0 0 1 1 1v1.5" />  <path d="M20 14v3h-2.5" />  <path d="M20 8.5V10" />  <path d="M4 10V8.5" />  <path d="M4 19.5V14" />  <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H8" />  <path d="M8 22H6.5a1 1 0 0 1 0-5H8" /></svg>'
        );
      case "book-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13V7" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="m9 10 3 3 3-3" /></svg>'
        );
      case "book-headphones":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M8 12v-2a4 4 0 0 1 8 0v2" />  <circle cx="15" cy="12" r="1" />  <circle cx="9" cy="12" r="1" /></svg>'
        );
      case "book-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M8.62 9.8A2.25 2.25 0 1 1 12 6.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z" /></svg>'
        );
      case "book-image":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <circle cx="10" cy="8" r="2" /></svg>'
        );
      case "book-key":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 3 1 1" />  <path d="m20 2-4.5 4.5" />  <path d="M20 7.898V21a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h7.844" />  <circle cx="14" cy="8" r="2" /></svg>'
        );
      case "book-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 6V4a2 2 0 1 0-4 0v2" />  <path d="M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10" />  <rect x="12" y="6" width="8" height="5" rx="1" /></svg>'
        );
      case "book-marked":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v8l3-3 3 3V2" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>'
        );
      case "book-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M9 10h6" /></svg>'
        );
      case "book-open-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 21V7" />  <path d="m16 12 2 2 4-4" />  <path d="M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3" /></svg>'
        );
      case "book-open-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7v14" />  <path d="M16 12h2" />  <path d="M16 8h2" />  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />  <path d="M6 12h2" />  <path d="M6 8h2" /></svg>'
        );
      case "book-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7v14" />  <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>'
        );
      case "book-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7v6" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M9 10h6" /></svg>'
        );
      case "book-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M8 11h8" />  <path d="M8 7h6" /></svg>'
        );
      case "book-type":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 13h4" />  <path d="M12 6v7" />  <path d="M16 8V6H8v2" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>'
        );
      case "book-up-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13V7" />  <path d="M18 2h1a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2" />  <path d="m9 10 3-3 3 3" />  <path d="m9 5 3-3 3 3" /></svg>'
        );
      case "book-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13V7" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="m9 10 3-3 3 3" /></svg>'
        );
      case "book-user":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 13a3 3 0 1 0-6 0" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <circle cx="12" cy="8" r="2" /></svg>'
        );
      case "book-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.5 7-5 5" />  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />  <path d="m9.5 7 5 5" /></svg>'
        );
      case "book":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>'
        );
      case "bookmark-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />  <path d="m9 10 2 2 4-4" /></svg>'
        );
      case "bookmark-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />  <line x1="15" x2="9" y1="10" y2="10" /></svg>'
        );
      case "bookmark-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />  <line x1="12" x2="12" y1="7" y2="13" />  <line x1="15" x2="9" y1="10" y2="10" /></svg>'
        );
      case "bookmark-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />  <path d="m14.5 7.5-5 5" />  <path d="m9.5 7.5 5 5" /></svg>'
        );
      case "bookmark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>'
        );
      case "boom-box":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />  <path d="M8 8v1" />  <path d="M12 8v1" />  <path d="M16 8v1" />  <rect width="20" height="12" x="2" y="9" rx="2" />  <circle cx="8" cy="15" r="2" />  <circle cx="16" cy="15" r="2" /></svg>'
        );
      case "bot-message-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6V2H8" />  <path d="M15 11v2" />  <path d="M2 12h2" />  <path d="M20 12h2" />  <path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />  <path d="M9 11v2" /></svg>'
        );
      case "bot-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.67 8H18a2 2 0 0 1 2 2v4.33" />  <path d="M2 14h2" />  <path d="M20 14h2" />  <path d="M22 22 2 2" />  <path d="M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586" />  <path d="M9 13v2" />  <path d="M9.67 4H12v2.33" /></svg>'
        );
      case "bot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 8V4H8" />  <rect width="16" height="12" x="4" y="8" rx="2" />  <path d="M2 14h2" />  <path d="M20 14h2" />  <path d="M15 13v2" />  <path d="M9 13v2" /></svg>'
        );
      case "bottle-baby":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 11c1.1-1.4 1.3-3.3.7-4.9l.8-.8a1.5 1.5 0 0 0-2.8-2.8l-.8.8A5.33 5.33 0 0 0 13 4" />  <path d="M11.3 3.7a1 1 0 0 1 1.4 0l7.6 7.6a1 1 0 0 1 0 1.4l-1.6 1.6a1 1 0 0 1-1.4 0L9.7 6.7a1 1 0 0 1 0-1.4Z" />  <path d="m10 7-7.3 7.3c-.9.9-.9 2.5 0 3.4l3.6 3.6c.9.9 2.5.9 3.4 0L17 14" />  <path d="m4 13 2 2" />  <path d="m7 10 2 2" /></svg>'
        );
      case "bottle-champagne":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2h.01" />  <path d="M12 3h.01" />  <path d="m19 8-3-3" />  <path d="M9.7 21.3a2.4 2.4 0 0 1-3.4 0l-3.6-3.6a2.41 2.41 0 0 1 0-3.4l6.27-6.27A3.5 3.5 0 0 1 11.45 7h1.1a3.5 3.5 0 0 0 2.47-1.03l3.62-3.61a1.21 1.21 0 0 1 1.72 0l1.28 1.28a1.2 1.2 0 0 1 0 1.72l-3.62 3.61A3.5 3.5 0 0 0 17 11.45v1.1a3.5 3.5 0 0 1-1.03 2.48Z" />  <path d="m9.06 8 3.23 3.24a1 1 0 0 1 0 1.41L8.65 16.3a1 1 0 0 1-1.41 0L4 13.06" />  <path d="M21 12h.01" />  <path d="M22 16h.01" /></svg>'
        );
      case "bottle-dispenser":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18.5" cy="5.5" r=".5" />  <path d="M20 10h.01" />  <path d="M9 2h7" />  <path d="M11 2v4" />  <rect width="4" height="4" x="9" y="6" rx="1" />  <path d="M9 10c-1.7 0-3 1.3-3 3v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7c0-1.7-1.3-3-3-3Z" />  <path d="M6 14.5a6 6 0 0 1 5 0s2 1.25 5 0" /></svg>'
        );
      case "bottle-perfume":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="12" height="4" x="6" y="3" />  <rect width="6" height="4" x="9" y="7" />  <rect width="18" height="10" x="3" y="11" rx="2" /></svg>'
        );
      case "bottle-plastic":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 6.1V3c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v3.1" />  <path d="M17 14.5c0-1.2-.9-2.2-2-2.4V12a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4 2 2 0 0 0 2 2v.1a2.5 2.5 0 0 0 0 4.8v.1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2v-.1c1.1-.2 2-1.2 2-2.4" /></svg>'
        );
      case "bottle-spray":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v4" />  <path d="M6 10h4" />  <path d="M10 8a2 2 0 0 1 2-2h3c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1H5C3.3 2 2 3.3 2 5c0 .6.4 1 1 1h1a2 2 0 0 1 2 2v2l-2.3 2.3c-.4.4-.7 1.1-.7 1.7v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6c0-.6-.3-1.3-.7-1.7L10 10Z" />  <path d="M14 6c0 2 0 3 2 4" />  <path d="M3 16.5a6 6 0 0 1 5 0s2 1.25 5 0" />  <path d="M22 2h.01" />  <path d="M20 5.5h.01" />  <path d="M22 9h.01" /></svg>'
        );
      case "bottle-toothbrush-comb":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="4" height="4" x="2" y="3" />  <path d="M6 7v2c0 .6.1 1.4.2 2L8 20.8v.2c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V7" />  <path d="M14 2v7l-2 5v8" />  <rect width="4" height="6" x="10" y="3" />  <path d="M18 6h4" />  <path d="M18 10h4" />  <path d="M18 14h4" />  <path d="M18 18h4" />  <path d="M18 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2" /></svg>'
        );
      case "bottle-wine":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a6 6 0 0 0 1.2 3.6l.6.8A6 6 0 0 1 17 13v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a6 6 0 0 1 1.2-3.6l.6-.8A6 6 0 0 0 10 5z" />  <path d="M17 13h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4" /></svg>'
        );
      case "bow-arrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 3h4v4" />  <path d="M18.575 11.082a13 13 0 0 1 1.048 9.027 1.17 1.17 0 0 1-1.914.597L14 17" />  <path d="M7 10 3.29 6.29a1.17 1.17 0 0 1 .6-1.91 13 13 0 0 1 9.03 1.05" />  <path d="M7 14a1.7 1.7 0 0 0-1.207.5l-2.646 2.646A.5.5 0 0 0 3.5 18H5a1 1 0 0 1 1 1v1.5a.5.5 0 0 0 .854.354L9.5 18.207A1.7 1.7 0 0 0 10 17v-2a1 1 0 0 0-1-1z" />  <path d="M9.707 14.293 21 3" /></svg>'
        );
      case "bowl-chopsticks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13 2-3 11" />  <path d="m22 2-8 11" />  <ellipse cx="12" cy="12" rx="10" ry="5" />  <path d="M22 12a10 10 0 0 1-20 0" /></svg>'
        );
      case "bowl-overflow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 4C6.5 4 2 6.2 2 9c0 2.4 3.4 4.4 8 4.9 1.1.1 2 1 2 2.1v3a2 2 0 0 0 4 0v-3.4c0-1.1.9-2.2 1.9-2.6 2.5-.9 4.1-2.4 4.1-4 0-2.8-4.5-5-10-5" />  <path d="M2 9c0 5.5 4.5 10 10 10" />  <path d="M16 18.2c3.5-1.5 6-5.1 6-9.2" />  <path d="M16 15.6c0-2.6 3-2.6 3-4.6 0-1.7-3.1-3-7-3s-7 1.3-7 3c0 1.4 2.1 2.5 5 2.9" /></svg>'
        );
      case "bowling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 10h.01" />  <path d="M6 13h.01" />  <path d="M10 14h.01" />  <path d="M11.09 6.07a8 8 0 1 0 .32 15.81" />  <path d="M16 9h4" />  <path d="M15 5c0 1.5 1 2 1 4 0 2.5-2 4.5-2 7 0 2.6 1.9 6 1.9 6H20s2-3.4 2-6c0-2.5-2-4.5-2-7 0-2 1-2.5 1-4a3 3 0 1 0-6 0" /></svg>'
        );
      case "box":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />  <path d="m3.3 7 8.7 5 8.7-5" />  <path d="M12 22V12" /></svg>'
        );
      case "boxes":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />  <path d="m7 16.5-4.74-2.85" />  <path d="m7 16.5 5-3" />  <path d="M7 16.5v5.17" />  <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />  <path d="m17 16.5-5-3" />  <path d="m17 16.5 4.74-2.85" />  <path d="M17 16.5v5.17" />  <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />  <path d="M12 8 7.26 5.15" />  <path d="m12 8 4.74-2.85" />  <path d="M12 13.5V8" /></svg>'
        );
      case "bra-sports":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 21-9-9V3H4v10.6A4 4 0 0 0 6 21h12a4 4 0 0 0 2-7.4V3h-4v9l-4 4" />  <path d="M8 11h8" /></svg>'
        );
      case "braces":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />  <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" /></svg>'
        );
      case "brackets":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3" />  <path d="M8 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" /></svg>'
        );
      case "brain-circuit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />  <path d="M9 13a4.5 4.5 0 0 0 3-4" />  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />  <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />  <path d="M6 18a4 4 0 0 1-1.967-.516" />  <path d="M12 13h4" />  <path d="M12 18h6a2 2 0 0 1 2 2v1" />  <path d="M12 8h8" />  <path d="M16 8V5a2 2 0 0 1 2-2" />  <circle cx="16" cy="13" r=".5" />  <circle cx="18" cy="3" r=".5" />  <circle cx="20" cy="21" r=".5" />  <circle cx="20" cy="8" r=".5" /></svg>'
        );
      case "brain-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10.852 14.772-.383.923" />  <path d="m10.852 9.228-.383-.923" />  <path d="m13.148 14.772.382.924" />  <path d="m13.531 8.305-.383.923" />  <path d="m14.772 10.852.923-.383" />  <path d="m14.772 13.148.923.383" />  <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 0 0-5.63-1.446 3 3 0 0 0-.368 1.571 4 4 0 0 0-2.525 5.771" />  <path d="M17.998 5.125a4 4 0 0 1 2.525 5.771" />  <path d="M19.505 10.294a4 4 0 0 1-1.5 7.706" />  <path d="M4.032 17.483A4 4 0 0 0 11.464 20c.18-.311.892-.311 1.072 0a4 4 0 0 0 7.432-2.516" />  <path d="M4.5 10.291A4 4 0 0 0 6 18" />  <path d="M6.002 5.125a3 3 0 0 0 .4 1.375" />  <path d="m9.228 10.852-.923-.383" />  <path d="m9.228 13.148-.923.383" />  <circle cx="12" cy="12" r="3" /></svg>'
        );
      case "brain":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 18V5" />  <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />  <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />  <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />  <path d="M18 18a4 4 0 0 0 2-7.464" />  <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />  <path d="M6 18a4 4 0 0 1-2-7.464" />  <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" /></svg>'
        );
      case "brick-wall-fire":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3v2.107" />  <path d="M17 9c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 22 17a5 5 0 0 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C13 11.5 16 9 17 9" />  <path d="M21 8.274V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.938" />  <path d="M3 15h5.253" />  <path d="M3 9h8.228" />  <path d="M8 15v6" />  <path d="M8 3v6" /></svg>'
        );
      case "brick-wall-shield":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 9v1.258" />  <path d="M16 3v5.46" />  <path d="M21 9.118V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5.75" />  <path d="M22 17.5c0 2.499-1.75 3.749-3.83 4.474a.5.5 0 0 1-.335-.005c-2.085-.72-3.835-1.97-3.835-4.47V14a.5.5 0 0 1 .5-.499c1 0 2.25-.6 3.12-1.36a.6.6 0 0 1 .76-.001c.875.765 2.12 1.36 3.12 1.36a.5.5 0 0 1 .5.5z" />  <path d="M3 15h7" />  <path d="M3 9h12.142" />  <path d="M8 15v6" />  <path d="M8 3v6" /></svg>'
        );
      case "brick-wall":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 9v6" />  <path d="M16 15v6" />  <path d="M16 3v6" />  <path d="M3 15h18" />  <path d="M3 9h18" />  <path d="M8 15v6" />  <path d="M8 3v6" /></svg>'
        );
      case "briefcase-business":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12h.01" />  <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />  <path d="M22 13a18.15 18.15 0 0 1-20 0" />  <rect width="20" height="14" x="2" y="6" rx="2" /></svg>'
        );
      case "briefcase-conveyor-belt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 20v2" />  <path d="M14 20v2" />  <path d="M18 20v2" />  <path d="M21 20H3" />  <path d="M6 20v2" />  <path d="M8 16V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12" />  <rect x="4" y="6" width="16" height="10" rx="2" /></svg>'
        );
      case "briefcase-medical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 11v4" />  <path d="M14 13h-4" />  <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />  <path d="M18 6v14" />  <path d="M6 6v14" />  <rect width="20" height="14" x="2" y="6" rx="2" /></svg>'
        );
      case "briefcase-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />  <rect width="20" height="14" x="2" y="7" rx="2" />  <path d="M15 14H9" />  <path d="M12 11v6" /></svg>'
        );
      case "briefcase":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />  <rect width="20" height="14" x="2" y="6" rx="2" /></svg>'
        );
      case "bring-to-front":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="8" y="8" width="8" height="8" rx="2" />  <path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" />  <path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" /></svg>'
        );
      case "broom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13 11 9-9" />  <path d="M14.6 12.6c.8.8.9 2.1.2 3L10 22l-8-8 6.4-4.8c.9-.7 2.2-.6 3 .2Z" />  <path d="m6.8 10.4 6.8 6.8" />  <path d="m5 17 1.4-1.4" /></svg>'
        );
      case "brush-cleaning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 22-1-4" />  <path d="M19 13.99a1 1 0 0 0 1-1V12a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v.99a1 1 0 0 0 1 1" />  <path d="M5 14h14l1.973 6.767A1 1 0 0 1 20 22H4a1 1 0 0 1-.973-1.233z" />  <path d="m8 22 1-4" /></svg>'
        );
      case "brush":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 10 3 3" />  <path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" />  <path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" /></svg>'
        );
      case "bubbles":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7.2 14.8a2 2 0 0 1 2 2" />  <circle cx="18.5" cy="8.5" r="3.5" />  <circle cx="7.5" cy="16.5" r="5.5" />  <circle cx="7.5" cy="4.5" r="2.5" /></svg>'
        );
      case "bucket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 7c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5" />  <path d="M5 11h14" />  <path d="m18 11-.8 9c-.1 1.1-1.1 2-2.2 2H9c-1.1 0-2.1-.9-2.2-2L6 11" /></svg>'
        );
      case "bug-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 7.13V6a3 3 0 0 0-5.14-2.1L8 2" />  <path d="M14.12 3.88 16 2" />  <path d="M22 13h-4v-2a4 4 0 0 0-4-4h-1.3" />  <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />  <path d="m2 2 20 20" />  <path d="M7.7 7.7A4 4 0 0 0 6 11v3a6 6 0 0 0 11.13 3.13" />  <path d="M12 20v-8" />  <path d="M6 13H2" />  <path d="M3 21c0-2.1 1.7-3.9 3.8-4" /></svg>'
        );
      case "bug-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 19.655A6 6 0 0 1 6 14v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 3.97" />  <path d="M14 15.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z" />  <path d="M14.12 3.88 16 2" />  <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />  <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />  <path d="M6 13H2" />  <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />  <path d="m8 2 1.88 1.88" />  <path d="M9 7.13v-1a3 3 0 0 1 4.18-2.895 3 3 0 0 1 1.821 2.896v1" /></svg>'
        );
      case "bug":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 2 1.88 1.88" />  <path d="M14.12 3.88 16 2" />  <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />  <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />  <path d="M12 20v-9" />  <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />  <path d="M6 13H2" />  <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />  <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />  <path d="M22 13h-4" />  <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" /></svg>'
        );
      case "building-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />  <path d="M10 6h4" />  <path d="M10 10h4" />  <path d="M10 14h4" />  <path d="M10 18h4" /></svg>'
        );
      case "building":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10h.01" />  <path d="M12 14h.01" />  <path d="M12 6h.01" />  <path d="M16 10h.01" />  <path d="M16 14h.01" />  <path d="M16 6h.01" />  <path d="M8 10h.01" />  <path d="M8 14h.01" />  <path d="M8 6h.01" />  <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />  <rect x="4" y="2" width="16" height="20" rx="2" /></svg>'
        );
      case "bull-head":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 10a5 5 0 0 1-4-8 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 5 5 0 0 1-4 8" />  <path d="M6.4 15c-.3-.6-.4-1.3-.4-2 0-4 3-3 3-7" />  <path d="M10 12.5v1.6" />  <path d="M17.6 15c.3-.6.4-1.3.4-2 0-4-3-3-3-7" />  <path d="M14 12.5v1.6" />  <path d="M15 22a4 4 0 1 0-3-6.7A4 4 0 1 0 9 22Z" />  <path d="M9 18h.01" />  <path d="M15 18h.01" /></svg>'
        );
      case "burger":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 12a2 2 0 0 1-2-2 9 7 0 0 1 18 0 2 2 0 0 1-2 2l-3.5 4.1c-.8 1-2.4 1.1-3.4.3L7 12" />  <path d="M11.7 16H4a2 2 0 0 1 0-4h16a2 2 0 0 1 0 4h-4.3" />  <path d="M5 16a2 2 0 0 0-2 2c0 1.7 1.3 3 3 3h12c1.7 0 3-1.3 3-3a2 2 0 0 0-2-2" /></svg>'
        );
      case "bus-front":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 6 2 7" />  <path d="M10 6h4" />  <path d="m22 7-2-1" />  <rect width="16" height="16" x="4" y="3" rx="2" />  <path d="M4 11h16" />  <path d="M8 15h.01" />  <path d="M16 15h.01" />  <path d="M6 19v2" />  <path d="M18 21v-2" /></svg>'
        );
      case "bus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 6v6" />  <path d="M15 6v6" />  <path d="M2 12h19.6" />  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />  <circle cx="7" cy="18" r="2" />  <path d="M9 18h5" />  <circle cx="16" cy="18" r="2" /></svg>'
        );
      case "butterfly":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.8 2C12 3.8 12 9 12 9s0-5.2-3.8-7" />  <path d="M12 9v11" />  <path d="M20 5c-3.5 0-6.5 3.9-8 6.3C10.5 8.9 7.5 5 4 5a2 2 0 0 0-2 2c0 2.3.6 4.4 1.5 5.6C4 13.5 4.9 14 6 14h2c-.9.4-2.1.9-2.6 1.5-1.6 1.6-.9 3.4.7 4.9 1.6 1.6 3.4 2.3 4.9.7.3-.3 1-1.1 1-1.1s.6.8 1 1.1c1.6 1.6 3.4.9 4.9-.7 1.6-1.6 2.3-3.4.7-4.9-.5-.5-1.7-1.1-2.6-1.5h2c1.1 0 2-.5 2.5-1.4.9-1.2 1.5-3.3 1.5-5.6a2 2 0 0 0-2-2" /></svg>'
        );
      case "cabin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.6 10.4a2.12 2.12 0 1 0 3.02 2.98L12 7l6.4 6.4a2.12 2.12 0 1 0 2.979-3.021L13.7 2.7a2.4 2.4 0 0 0-3.404.004Z" />  <path d="M14 22v-7a2 2 0 0 0-4 0v7" />  <path d="M14 14h6v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6h6" />  <path d="M4 18h6" />  <path d="M14 18h6" /></svg>'
        );
      case "cabinet-filing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h16" />  <rect width="16" height="20" x="4" y="2" rx="2" />  <path d="M10 6h4" />  <path d="M10 16h4" /></svg>'
        );
      case "cable-car":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 3h.01" />  <path d="M14 2h.01" />  <path d="m2 9 20-5" />  <path d="M12 12V6.5" />  <rect width="16" height="10" x="4" y="12" rx="3" />  <path d="M9 12v5" />  <path d="M15 12v5" />  <path d="M4 17h16" /></svg>'
        );
      case "cable":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z" />  <path d="M17 21v-2" />  <path d="M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10" />  <path d="M21 21v-2" />  <path d="M3 5V3" />  <path d="M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z" />  <path d="M7 5V3" /></svg>'
        );
      case "cactus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 8v6a2 2 0 0 0 2 2h2" />  <path d="M15 14h2a2 2 0 0 0 2-2V6" />  <path d="M9 22V5a3 3 0 1 1 6 0v17" />  <path d="M7 22h10" /></svg>'
        );
      case "cake-slice":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 13H3" />  <path d="M16 17H3" />  <path d="m7.2 7.9-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6" />  <circle cx="9" cy="7" r="2" /></svg>'
        );
      case "cake":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />  <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />  <path d="M2 21h20" />  <path d="M7 8v3" />  <path d="M12 8v3" />  <path d="M17 8v3" />  <path d="M7 4h.01" />  <path d="M12 4h.01" />  <path d="M17 4h.01" /></svg>'
        );
      case "calculator":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="16" height="20" x="4" y="2" rx="2" />  <line x1="8" x2="16" y1="6" y2="6" />  <line x1="16" x2="16" y1="14" y2="18" />  <path d="M16 10h.01" />  <path d="M12 10h.01" />  <path d="M8 10h.01" />  <path d="M12 14h.01" />  <path d="M8 14h.01" />  <path d="M12 18h.01" />  <path d="M8 18h.01" /></svg>'
        );
      case "calendar-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 14h1v4" />  <path d="M16 2v4" />  <path d="M3 10h18" />  <path d="M8 2v4" />  <rect x="3" y="4" width="18" height="18" rx="2" /></svg>'
        );
      case "calendar-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 18 4 4 4-4" />  <path d="M16 2v4" />  <path d="M18 14v8" />  <path d="M21 11.354V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.343" />  <path d="M3 10h18" />  <path d="M8 2v4" /></svg>'
        );
      case "calendar-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 18 4-4 4 4" />  <path d="M16 2v4" />  <path d="M18 22v-8" />  <path d="M21 11.343V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9" />  <path d="M3 10h18" />  <path d="M8 2v4" /></svg>'
        );
      case "calendar-check-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />  <path d="M3 10h18" />  <path d="m16 20 2 2 4-4" /></svg>'
        );
      case "calendar-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M3 10h18" />  <path d="m9 16 2 2 4-4" /></svg>'
        );
      case "calendar-clock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 14v2.2l1.6 1" />  <path d="M16 2v4" />  <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />  <path d="M3 10h5" />  <path d="M8 2v4" />  <circle cx="16" cy="16" r="6" /></svg>'
        );
      case "calendar-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.228 16.852-.923-.383" />  <path d="m15.228 19.148-.923.383" />  <path d="M16 2v4" />  <path d="m16.47 14.305.382.923" />  <path d="m16.852 20.772-.383.924" />  <path d="m19.148 15.228.383-.923" />  <path d="m19.53 21.696-.382-.924" />  <path d="m20.772 16.852.924-.383" />  <path d="m20.772 19.148.924.383" />  <path d="M21 11V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />  <path d="M3 10h18" />  <path d="M8 2v4" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "calendar-days":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M3 10h18" />  <path d="M8 14h.01" />  <path d="M12 14h.01" />  <path d="M16 14h.01" />  <path d="M8 18h.01" />  <path d="M12 18h.01" />  <path d="M16 18h.01" /></svg>'
        );
      case "calendar-fold":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <path d="M21 17V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11Z" />  <path d="M3 10h18" />  <path d="M15 22v-4a2 2 0 0 1 2-2h4" /></svg>'
        );
      case "calendar-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.127 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.125" />  <path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z" />  <path d="M16 2v4" />  <path d="M3 10h18" />  <path d="M8 2v4" /></svg>'
        );
      case "calendar-minus-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M3 10h18" />  <path d="M10 16h4" /></svg>'
        );
      case "calendar-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 19h6" />  <path d="M16 2v4" />  <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5" />  <path d="M3 10h18" />  <path d="M8 2v4" /></svg>'
        );
      case "calendar-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18" />  <path d="M21 15.5V6a2 2 0 0 0-2-2H9.5" />  <path d="M16 2v4" />  <path d="M3 10h7" />  <path d="M21 10h-5.5" />  <path d="m2 2 20 20" /></svg>'
        );
      case "calendar-plus-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M3 10h18" />  <path d="M10 16h4" />  <path d="M12 14v4" /></svg>'
        );
      case "calendar-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 19h6" />  <path d="M16 2v4" />  <path d="M19 16v6" />  <path d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5" />  <path d="M3 10h18" />  <path d="M8 2v4" /></svg>'
        );
      case "calendar-range":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M16 2v4" />  <path d="M3 10h18" />  <path d="M8 2v4" />  <path d="M17 14h-6" />  <path d="M13 18H7" />  <path d="M7 14h.01" />  <path d="M17 18h.01" /></svg>'
        );
      case "calendar-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 2v4" />  <path d="M21 11.75V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.25" />  <path d="m22 22-1.875-1.875" />  <path d="M3 10h18" />  <path d="M8 2v4" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "calendar-sync":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 10v4h4" />  <path d="m11 14 1.535-1.605a5 5 0 0 1 8 1.5" />  <path d="M16 2v4" />  <path d="m21 18-1.535 1.605a5 5 0 0 1-8-1.5" />  <path d="M21 22v-4h-4" />  <path d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3" />  <path d="M3 10h4" />  <path d="M8 2v4" /></svg>'
        );
      case "calendar-x-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />  <path d="M3 10h18" />  <path d="m17 22 5-5" />  <path d="m17 17 5 5" /></svg>'
        );
      case "calendar-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M3 10h18" />  <path d="m14 14-4 4" />  <path d="m10 14 4 4" /></svg>'
        );
      case "calendar":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M16 2v4" />  <rect width="18" height="18" x="3" y="4" rx="2" />  <path d="M3 10h18" /></svg>'
        );
      case "camera-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.564 14.558a3 3 0 1 1-4.122-4.121" />  <path d="m2 2 20 20" />  <path d="M20 20H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 .819-.175" />  <path d="M9.695 4.024A2 2 0 0 1 10.004 4h3.993a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v7.344" /></svg>'
        );
      case "camera":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />  <circle cx="12" cy="13" r="3" /></svg>'
        );
      case "candle-holder-lit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2S8 3.9 8 5s.9 2 2 2 2-.9 2-2-2-3-2-3" />  <rect width="4" height="7" x="8" y="11" />  <path d="m13 13-1-2" />  <path d="M18 18a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4h18a2 2 0 1 0-2-2Z" /></svg>'
        );
      case "candle-holder":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="4" height="7" x="8" y="11" />  <path d="M18 18a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4h18a2 2 0 1 0-2-2Z" />  <path d="M10 9v2" /></svg>'
        );
      case "candle-tealight-lit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2s-2 1.9-2 3 .9 2 2 2 2-.9 2-2-2-3-2-3" />  <path d="M12 12V7" />  <ellipse cx="12" cy="13" rx="10" ry="3" />  <path d="M2 13v6c0 1.7 4.5 3 10 3s10-1.3 10-3v-6" />  <path d="M8 16v1" />  <path d="M12 16v2" /></svg>'
        );
      case "candle-tealight":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12V7" />  <ellipse cx="12" cy="13" rx="10" ry="3" />  <path d="M2 13v6c0 1.7 4.5 3 10 3s10-1.3 10-3v-6" /></svg>'
        );
      case "candlestick-big-lit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2S9 5.3 9 7s1.3 3 3 3 3-1.3 3-3-3-5-3-5" />  <path d="M16 22H8v-7c0-.6.4-1 1-1h6c.6 0 1 .4 1 1Z" />  <path d="M12 14v3" />  <path d="M17 17s-.7-1.4-1.1-2.4" /></svg>'
        );
      case "candlestick-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 22H8v-7c0-.6.4-1 1-1h6c.6 0 1 .4 1 1Z" />  <path d="M12 11v3" /></svg>'
        );
      case "candlestick-lit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2s-2 1.9-2 3 .9 2 2 2 2-.9 2-2-2-3-2-3" />  <rect width="4" height="11" x="10" y="11" />  <path d="m15 13-1-2" /></svg>'
        );
      case "candlestick":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="4" height="11" x="10" y="11" />  <path d="M12 8v3" /></svg>'
        );
      case "candy-cane":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2Z" />  <path d="M17.75 7 15 2.1" />  <path d="M10.9 4.8 13 9" />  <path d="m7.9 9.7 2 4.4" />  <path d="M4.9 14.7 7 18.9" /></svg>'
        );
      case "candy-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10v7.9" />  <path d="M11.802 6.145a5 5 0 0 1 6.053 6.053" />  <path d="M14 6.1v2.243" />  <path d="m15.5 15.571-.964.964a5 5 0 0 1-7.071 0 5 5 0 0 1 0-7.07l.964-.965" />  <path d="M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4" />  <path d="m2 2 20 20" />  <path d="M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4" /></svg>'
        );
      case "candy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 7v10.9" />  <path d="M14 6.1V17" />  <path d="M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4" />  <path d="M16.536 7.465a5 5 0 0 0-7.072 0l-2 2a5 5 0 0 0 0 7.07 5 5 0 0 0 7.072 0l2-2a5 5 0 0 0 0-7.07" />  <path d="M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4" /></svg>'
        );
      case "cannabis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22v-4" />  <path d="M7 12c-1.5 0-4.5 1.5-5 3 3.5 1.5 6 1 6 1-1.5 1.5-2 3.5-2 5 2.5 0 4.5-1.5 6-3 1.5 1.5 3.5 3 6 3 0-1.5-.5-3.5-2-5 0 0 2.5.5 6-1-.5-1.5-3.5-3-5-3 1.5-1 4-4 4-6-2.5 0-5.5 1.5-7 3 0-2.5-.5-5-2-7-1.5 2-2 4.5-2 7-1.5-1.5-4.5-3-7-3 0 2 2.5 5 4 6" /></svg>'
        );
      case "captions-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 5H19a2 2 0 0 1 2 2v8.5" />  <path d="M17 11h-.5" />  <path d="M19 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2" />  <path d="m2 2 20 20" />  <path d="M7 11h4" />  <path d="M7 15h2.5" /></svg>'
        );
      case "captions":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="14" x="3" y="5" rx="2" ry="2" />  <path d="M7 15h4M15 15h2M7 11h2M13 11h4" /></svg>'
        );
      case "car-front":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" />  <path d="M7 14h.01" />  <path d="M17 14h.01" />  <rect width="18" height="8" x="3" y="10" rx="2" />  <path d="M5 18v2" />  <path d="M19 18v2" /></svg>'
        );
      case "car-taxi-front":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2h4" />  <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" />  <path d="M7 14h.01" />  <path d="M17 14h.01" />  <rect width="18" height="8" x="3" y="10" rx="2" />  <path d="M5 18v2" />  <path d="M19 18v2" /></svg>'
        );
      case "car":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />  <circle cx="7" cy="17" r="2" />  <path d="M9 17h6" />  <circle cx="17" cy="17" r="2" /></svg>'
        );
      case "caravan":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 19V9a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2h2" />  <path d="M2 9h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2" />  <path d="M22 17v1a1 1 0 0 1-1 1H10v-9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9" />  <circle cx="8" cy="19" r="2" /></svg>'
        );
      case "card-credit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="14" x="2" y="5" rx="2" />  <path d="M2 10h20" /></svg>'
        );
      case "card-sd":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 22a2 2 0 0 1-2-2V6l4-4h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2Z" />  <path d="M8 10V7.5" />  <path d="M12 6v4" />  <path d="M16 6v4" /></svg>'
        );
      case "card-sim":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2Z" />  <rect width="8" height="8" x="8" y="10" rx="2" />  <path d="M8 14h8" />  <path d="M12 14v4" /></svg>'
        );
      case "carrot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7zM8.64 14l-2.05-2.04M15.34 15l-2.46-2.46" />  <path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z" />  <path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z" /></svg>'
        );
      case "carton-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.1 8.5 16 6V3c0-.6-.4-1-1-1H9" />  <path d="M11.7 6H16l3 4v3.3" />  <path d="m2 2 20 20" />  <path d="M19 19v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10l2.1-2.9" />  <path d="M13 13v9" /></svg>'
        );
      case "carton":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 6V3c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1v3l-3 4v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10Z" />  <path d="M13 22V10l3-4H8" />  <path d="M5 10h8" /></svg>'
        );
      case "case-camel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="7" cy="13" r="3" />  <path d="M10 10v6" />  <path d="M14 12h4.5a2 2 0 0 1 0 4H14V8h4a2 2 0 0 1 0 4" /></svg>'
        );
      case "case-kebab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="4.5" cy="13.5" r="2.5" />  <path d="M7 11v5" />  <path d="M11 13h2" />  <circle cx="19.5" cy="13.5" r="2.5" />  <path d="M17 9v7" /></svg>'
        );
      case "case-lower":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 9v7" />  <path d="M14 6v10" />  <circle cx="17.5" cy="12.5" r="3.5" />  <circle cx="6.5" cy="12.5" r="3.5" /></svg>'
        );
      case "case-sensitive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />  <path d="M22 9v7" />  <path d="M3.304 13h6.392" />  <circle cx="18.5" cy="12.5" r="3.5" /></svg>'
        );
      case "case-snake-upper":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 16v-5.5a2.5 2.5 0 0 1 5 0V16" />  <path d="M7 13H2" />  <path d="M11 16h2" />  <path d="M17 12h3a2 2 0 1 1 0 4h-3V8h2.5a2 2 0 0 1 .1 4" /></svg>'
        );
      case "case-snake":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 11v5" />  <circle cx="4.5" cy="13.5" r="2.5" />  <path d="M11 16h2" />  <circle cx="19.5" cy="13.5" r="2.5" />  <path d="M17 9v7" /></svg>'
        );
      case "case-upper":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 11h4.5a1 1 0 0 1 0 5h-4a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h3a1 1 0 0 1 0 5" />  <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />  <path d="M3.304 13h6.392" /></svg>'
        );
      case "cassette-tape":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="16" x="2" y="4" rx="2" />  <circle cx="8" cy="10" r="2" />  <path d="M8 12h8" />  <circle cx="16" cy="10" r="2" />  <path d="m6 20 .7-2.9A1.4 1.4 0 0 1 8.1 16h7.8a1.4 1.4 0 0 1 1.4 1l.7 3" /></svg>'
        );
      case "cast":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />  <path d="M2 12a9 9 0 0 1 8 8" />  <path d="M2 16a5 5 0 0 1 4 4" />  <line x1="2" x2="2.01" y1="20" y2="20" /></svg>'
        );
      case "castle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 5V3" />  <path d="M14 5V3" />  <path d="M15 21v-3a3 3 0 0 0-6 0v3" />  <path d="M18 3v8" />  <path d="M18 5H6" />  <path d="M22 11H2" />  <path d="M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9" />  <path d="M6 3v8" /></svg>'
        );
      case "cat-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 7 .5.5" />  <path d="m18 7-.5.5" />  <path d="M5 13a5 5 0 1 0 6.8 7.2l3-3.6A1 1 0 0 0 14 15h-4a1 1 0 0 0-.8 1.6l3 3.6A5 5 0 1 0 19 13h3c0-1.2-.4-2.4-1-3.4a3 3 0 0 0-5.8-5.3l-1 1a7 4 0 0 0-4.4 0l-1-1A3 3 0 0 0 3 9.6c-.6 1-1 2.2-1 3.4Z" />  <path d="M10 11v-.5" />  <path d="M14 11v-.5" />  <path d="M5 18H2" />  <path d="M19 18h3" /></svg>'
        );
      case "cat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />  <path d="M8 14v.5" />  <path d="M16 14v.5" />  <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" /></svg>'
        );
      case "cauldron":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="8" cy="3.5" r=".5" />  <circle cx="14" cy="6" r="2" />  <path d="M19 2h.01" />  <path d="M22 8H2" />  <path d="M7 12V8" />  <path d="M11 10V8" />  <path d="M4.4 8C2.9 9.5 2 11.4 2 13.5 2 18.2 6.5 22 12 22s10-3.8 10-8.5c0-2.1-.9-4-2.4-5.5" />  <path d="m5 20-1 2" />  <path d="m19 20 1 2" /></svg>'
        );
      case "cctv":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97" />  <path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z" />  <path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15" />  <path d="M2 21v-4" />  <path d="M7 9h.01" /></svg>'
        );
      case "cent-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 6v12" />  <path d="M16 9a5 5 0 1 0 0 6" /></svg>'
        );
      case "cent-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 7v10" />  <path d="M15.4 10a4 4 0 1 0 0 4" /></svg>'
        );
      case "cent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 8a8 8 0 1 0 0 8" />  <path d="M12 2v20" /></svg>'
        );
      case "chairs-table-parasol":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 8v13" />  <path d="M21 8H3l9-6Z" />  <path d="M7 13h10" />  <path d="M8 21v-3a1 1 0 0 0-1-1H3" />  <path d="M3 12v9" />  <path d="M16 21v-3c0-.5.5-1 1-1h4" />  <path d="M21 12v9" /></svg>'
        );
      case "chairs-table-platter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6V5" />  <path d="M8 10a4 4 0 0 1 8 0" />  <path d="M6 10h12" />  <path d="M12 10v9" />  <path d="M8 19v-4c0-.6-.4-1-1-1H2" />  <path d="M2 8v11" />  <path d="M16 19v-4a1 1 0 0 1 1-1h5" />  <path d="M22 8v11" /></svg>'
        );
      case "chameleon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 22c-5 0-9-4.5-9-10S6 2 11 2c2.2 0 4.2.9 5.7 2.3L19.3 2c3.1 3.1 3.5 7.9 1.3 11.4-.6.9-1.9.9-2.7.1l-1.2-1.2C15.2 10.9 13.2 10 11 10a6 6 0 0 0 0 12 4 4 0 0 0 0-8 2 2 0 0 0 0 4" />  <path d="M14 7h.01" />  <circle cx="14.5" cy="7" r="3.5" />  <path d="M8 10.8 6 10l1-2" />  <path d="M22 22a2 2 0 0 1-2-2v-6.1" /></svg>'
        );
      case "chart-area":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" /></svg>'
        );
      case "chart-bar-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <rect x="7" y="13" width="9" height="4" rx="1" />  <rect x="7" y="5" width="12" height="4" rx="1" /></svg>'
        );
      case "chart-bar-decreasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M7 11h8" />  <path d="M7 16h3" />  <path d="M7 6h12" /></svg>'
        );
      case "chart-bar-increasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M7 11h8" />  <path d="M7 16h12" />  <path d="M7 6h3" /></svg>'
        );
      case "chart-bar-stacked":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 13v4" />  <path d="M15 5v4" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <rect x="7" y="13" width="9" height="4" rx="1" />  <rect x="7" y="5" width="12" height="4" rx="1" /></svg>'
        );
      case "chart-bar":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M7 16h8" />  <path d="M7 11h12" />  <path d="M7 6h3" /></svg>'
        );
      case "chart-candlestick":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 5v4" />  <rect width="4" height="6" x="7" y="9" rx="1" />  <path d="M9 15v2" />  <path d="M17 3v2" />  <rect width="4" height="8" x="15" y="5" rx="1" />  <path d="M17 13v3" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" /></svg>'
        );
      case "chart-column-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <rect x="15" y="5" width="4" height="12" rx="1" />  <rect x="7" y="8" width="4" height="9" rx="1" /></svg>'
        );
      case "chart-column-decreasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 17V9" />  <path d="M18 17v-3" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M8 17V5" /></svg>'
        );
      case "chart-column-increasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 17V9" />  <path d="M18 17V5" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M8 17v-3" /></svg>'
        );
      case "chart-column-stacked":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 13H7" />  <path d="M19 9h-4" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <rect x="15" y="5" width="4" height="12" rx="1" />  <rect x="7" y="8" width="4" height="9" rx="1" /></svg>'
        );
      case "chart-column":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M18 17V9" />  <path d="M13 17V5" />  <path d="M8 17v-3" /></svg>'
        );
      case "chart-gantt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 6h8" />  <path d="M12 16h6" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M8 11h7" /></svg>'
        );
      case "chart-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="m19 9-5 5-4-4-3 3" /></svg>'
        );
      case "chart-network":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13.11 7.664 1.78 2.672" />  <path d="m14.162 12.788-3.324 1.424" />  <path d="m20 4-6.06 1.515" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <circle cx="12" cy="6" r="2" />  <circle cx="16" cy="12" r="2" />  <circle cx="9" cy="15" r="2" /></svg>'
        );
      case "chart-no-axes-column-decreasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20V10" />  <path d="M18 20v-4" />  <path d="M6 20V4" /></svg>'
        );
      case "chart-no-axes-column-increasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="12" x2="12" y1="20" y2="10" />  <line x1="18" x2="18" y1="20" y2="4" />  <line x1="6" x2="6" y1="20" y2="16" /></svg>'
        );
      case "chart-no-axes-column":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="18" x2="18" y1="20" y2="10" />  <line x1="12" x2="12" y1="20" y2="4" />  <line x1="6" x2="6" y1="20" y2="14" /></svg>'
        );
      case "chart-no-axes-combined":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16v5" />  <path d="M16 14v7" />  <path d="M20 10v11" />  <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />  <path d="M4 18v3" />  <path d="M8 14v7" /></svg>'
        );
      case "chart-no-axes-gantt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 6h10" />  <path d="M6 12h9" />  <path d="M11 18h7" /></svg>'
        );
      case "chart-pie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" />  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /></svg>'
        );
      case "chart-scatter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />  <circle cx="18.5" cy="5.5" r=".5" fill="currentColor" />  <circle cx="11.5" cy="11.5" r=".5" fill="currentColor" />  <circle cx="7.5" cy="16.5" r=".5" fill="currentColor" />  <circle cx="17.5" cy="14.5" r=".5" fill="currentColor" />  <path d="M3 3v16a2 2 0 0 0 2 2h16" /></svg>'
        );
      case "chart-spline":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3v16a2 2 0 0 0 2 2h16" />  <path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7" /></svg>'
        );
      case "check-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 6 7 17l-5-5" />  <path d="m22 10-7.5 7.5L13 16" /></svg>'
        );
      case "check-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 4L9 15" />  <path d="M21 19L3 19" />  <path d="M9 15L4 10" /></svg>'
        );
      case "check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 6 9 17l-5-5" /></svg>'
        );
      case "cheese":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 19v-7c-1-6-7-9-7-9l-2.1 1.5a2 2 0 0 1-3 2.2L3 11v9c0 .6.4 1 1 1h3a2 2 0 0 1 4 0h8" />  <path d="M9 12H3" />  <path d="M9 12c0-.8 1.3-1.5 3-1.5s3 .7 3 1.5a3 3 0 1 1-6 0" />  <path d="M21 12h-6" />  <circle cx="19" cy="19" r="2" /></svg>'
        );
      case "chef-hat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" />  <path d="M6 17h12" /></svg>'
        );
      case "cherry":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />  <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />  <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" />  <path d="M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z" /></svg>'
        );
      case "chest":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 19a2 2 0 0 0 2-2V9a4 4 0 0 0-8 0v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a4 4 0 0 0-4-4H6" />  <path d="M2 11h20" />  <path d="M16 11v3" /></svg>'
        );
      case "chevron-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 9 6 6 6-6" /></svg>'
        );
      case "chevron-first":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 18-6-6 6-6" />  <path d="M7 6v12" /></svg>'
        );
      case "chevron-last":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 18 6-6-6-6" />  <path d="M17 6v12" /></svg>'
        );
      case "chevron-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 18-6-6 6-6" /></svg>'
        );
      case "chevron-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 18 6-6-6-6" /></svg>'
        );
      case "chevron-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 15-6-6-6 6" /></svg>'
        );
      case "chevrons-down-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 20 5-5 5 5" />  <path d="m7 4 5 5 5-5" /></svg>'
        );
      case "chevrons-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 6 5 5 5-5" />  <path d="m7 13 5 5 5-5" /></svg>'
        );
      case "chevrons-left-right-ellipsis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12h.01" />  <path d="M16 12h.01" />  <path d="m17 7 5 5-5 5" />  <path d="m7 7-5 5 5 5" />  <path d="M8 12h.01" /></svg>'
        );
      case "chevrons-left-right-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m10 15-3-3 3-3" />  <path d="m14 9 3 3-3 3" /></svg>'
        );
      case "chevrons-left-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 7-5 5 5 5" />  <path d="m15 7 5 5-5 5" /></svg>'
        );
      case "chevrons-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 17-5-5 5-5" />  <path d="m18 17-5-5 5-5" /></svg>'
        );
      case "chevrons-right-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m20 17-5-5 5-5" />  <path d="m4 17 5-5-5-5" /></svg>'
        );
      case "chevrons-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 17 5-5-5-5" />  <path d="m13 17 5-5-5-5" /></svg>'
        );
      case "chevrons-up-down-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m9 10 3-3 3 3" />  <path d="m15 14-3 3-3-3" /></svg>'
        );
      case "chevrons-up-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 15 5 5 5-5" />  <path d="m7 9 5-5 5 5" /></svg>'
        );
      case "chevrons-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 11-5-5-5 5" />  <path d="m17 18-5-5-5 5" /></svg>'
        );
      case "chromium":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.88 21.94 15.46 14" />  <path d="M21.17 8H12" />  <path d="M3.95 6.06 8.54 14" />  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="4" /></svg>'
        );
      case "church":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 9h4" />  <path d="M12 7v5" />  <path d="M14 22v-4a2 2 0 0 0-4 0v4" />  <path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22" />  <path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7" /></svg>'
        );
      case "cigarette-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13" />  <path d="M18 8c0-2.5-2-2.5-2-5" />  <path d="m2 2 20 20" />  <path d="M21 12a1 1 0 0 1 1 1v2a1 1 0 0 1-.5.866" />  <path d="M22 8c0-2.5-2-2.5-2-5" />  <path d="M7 12v4" /></svg>'
        );
      case "cigarette":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14" />  <path d="M18 8c0-2.5-2-2.5-2-5" />  <path d="M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />  <path d="M22 8c0-2.5-2-2.5-2-5" />  <path d="M7 12v4" /></svg>'
        );
      case "circle-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <line x1="12" x2="12" y1="8" y2="12" />  <line x1="12" x2="12.01" y1="16" y2="16" /></svg>'
        );
      case "circle-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 8v8" />  <path d="m8 12 4 4 4-4" /></svg>'
        );
      case "circle-arrow-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m12 8-4 4 4 4" />  <path d="M16 12H8" /></svg>'
        );
      case "circle-arrow-out-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12a10 10 0 1 1 10 10" />  <path d="m2 22 10-10" />  <path d="M8 22H2v-6" /></svg>'
        );
      case "circle-arrow-out-down-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22a10 10 0 1 1 10-10" />  <path d="M22 22 12 12" />  <path d="M22 16v6h-6" /></svg>'
        );
      case "circle-arrow-out-up-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 8V2h6" />  <path d="m2 2 10 10" />  <path d="M12 2A10 10 0 1 1 2 12" /></svg>'
        );
      case "circle-arrow-out-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12A10 10 0 1 1 12 2" />  <path d="M22 2 12 12" />  <path d="M16 2h6v6" /></svg>'
        );
      case "circle-arrow-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m12 16 4-4-4-4" />  <path d="M8 12h8" /></svg>'
        );
      case "circle-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m16 12-4-4-4 4" />  <path d="M12 16V8" /></svg>'
        );
      case "circle-check-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.801 10A10 10 0 1 1 17 3.335" />  <path d="m9 11 3 3L22 4" /></svg>'
        );
      case "circle-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m9 12 2 2 4-4" /></svg>'
        );
      case "circle-chevron-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m16 10-4 4-4-4" /></svg>'
        );
      case "circle-chevron-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m14 16-4-4 4-4" /></svg>'
        );
      case "circle-chevron-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m10 8 4 4-4 4" /></svg>'
        );
      case "circle-chevron-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m8 14 4-4 4 4" /></svg>'
        );
      case "circle-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />  <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />  <path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" />  <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />  <path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" />  <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />  <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />  <path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" /></svg>'
        );
      case "circle-divide":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="8" x2="16" y1="12" y2="12" />  <line x1="12" x2="12" y1="16" y2="16" />  <line x1="12" x2="12" y1="8" y2="8" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-dollar-sign":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />  <path d="M12 18V6" /></svg>'
        );
      case "circle-dot-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" />  <path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" />  <path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" />  <path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" />  <path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" />  <path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" />  <path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" />  <path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" />  <circle cx="12" cy="12" r="1" /></svg>'
        );
      case "circle-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="1" /></svg>'
        );
      case "circle-ellipsis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M17 12h.01" />  <path d="M12 12h.01" />  <path d="M7 12h.01" /></svg>'
        );
      case "circle-equal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 10h10" />  <path d="M7 14h10" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-fading-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2a10 10 0 0 1 7.38 16.75" />  <path d="m16 12-4-4-4 4" />  <path d="M12 16V8" />  <path d="M2.5 8.875a10 10 0 0 0-.5 3" />  <path d="M2.83 16a10 10 0 0 0 2.43 3.4" />  <path d="M4.636 5.235a10 10 0 0 1 .891-.857" />  <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" /></svg>'
        );
      case "circle-fading-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2a10 10 0 0 1 7.38 16.75" />  <path d="M12 8v8" />  <path d="M16 12H8" />  <path d="M2.5 8.875a10 10 0 0 0-.5 3" />  <path d="M2.83 16a10 10 0 0 0 2.43 3.4" />  <path d="M4.636 5.235a10 10 0 0 1 .891-.857" />  <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" /></svg>'
        );
      case "circle-gauge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.6 2.7a10 10 0 1 0 5.7 5.7" />  <circle cx="12" cy="12" r="2" />  <path d="M13.4 10.6 19 5" /></svg>'
        );
      case "circle-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M8 12h8" /></svg>'
        );
      case "circle-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 20 20" />  <path d="M8.35 2.69A10 10 0 0 1 21.3 15.65" />  <path d="M19.08 19.08A10 10 0 1 1 4.92 4.92" /></svg>'
        );
      case "circle-parking-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.656 7H13a3 3 0 0 1 2.984 3.307" />  <path d="M13 13H9" />  <path d="M19.071 19.071A1 1 0 0 1 4.93 4.93" />  <path d="m2 2 20 20" />  <path d="M8.357 2.687a10 10 0 0 1 12.956 12.956" />  <path d="M9 17V9" /></svg>'
        );
      case "circle-parking":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></svg>'
        );
      case "circle-pause":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <line x1="10" x2="10" y1="15" y2="9" />  <line x1="14" x2="14" y1="15" y2="9" /></svg>'
        );
      case "circle-percent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m15 9-6 6" />  <path d="M9 9h.01" />  <path d="M15 15h.01" /></svg>'
        );
      case "circle-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M8 12h8" />  <path d="M12 8v8" /></svg>'
        );
      case "circle-pound-sterling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 16V9.5a1 1 0 0 1 5 0" />  <path d="M8 12h4" />  <path d="M8 16h7" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-power":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7v4" />  <path d="M7.998 9.003a5 5 0 1 0 8-.005" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-question-mark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />  <path d="M12 17h.01" /></svg>'
        );
      case "circle-slash-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 2 2 22" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <line x1="9" x2="15" y1="15" y2="9" /></svg>'
        );
      case "circle-small":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="6" /></svg>'
        );
      case "circle-star":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.051 7.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.867l-1.156-1.152a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-stop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <rect x="9" y="9" width="6" height="6" rx="1" /></svg>'
        );
      case "circle-user-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 20a6 6 0 0 0-12 0" />  <circle cx="12" cy="10" r="4" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circle-user":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="10" r="3" />  <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" /></svg>'
        );
      case "circle-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m15 9-6 6" />  <path d="m9 9 6 6" /></svg>'
        );
      case "circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "circuit-board":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M11 9h4a2 2 0 0 0 2-2V3" />  <circle cx="9" cy="9" r="2" />  <path d="M7 21v-4a2 2 0 0 1 2-2h4" />  <circle cx="15" cy="15" r="2" /></svg>'
        );
      case "citrus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z" />  <path d="M19.65 15.66A8 8 0 0 1 8.35 4.34" />  <path d="m14 10-5.5 5.5" />  <path d="M14 17.85V10H6.15" /></svg>'
        );
      case "clapperboard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />  <path d="m6.2 5.3 3.1 3.9" />  <path d="m12.4 3.4 3.1 4" />  <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>'
        );
      case "clipboard-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />  <path d="m9 14 2 2 4-4" /></svg>'
        );
      case "clipboard-clock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 14v2.2l1.6 1" />  <path d="M16 4h2a2 2 0 0 1 2 2v.832" />  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />  <circle cx="16" cy="16" r="6" />  <rect x="8" y="2" width="8" height="4" rx="1" /></svg>'
        );
      case "clipboard-copy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />  <path d="M16 4h2a2 2 0 0 1 2 2v4" />  <path d="M21 14H11" />  <path d="m15 10-4 4 4 4" /></svg>'
        );
      case "clipboard-list":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />  <path d="M12 11h4" />  <path d="M12 16h4" />  <path d="M8 11h.01" />  <path d="M8 16h.01" /></svg>'
        );
      case "clipboard-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />  <path d="M9 14h6" /></svg>'
        );
      case "clipboard-paste":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 14h10" />  <path d="M16 4h2a2 2 0 0 1 2 2v1.344" />  <path d="m17 18 4-4-4-4" />  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113" />  <rect x="8" y="2" width="8" height="4" rx="1" /></svg>'
        );
      case "clipboard-pen-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" />  <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5" />  <path d="M16 4h2a2 2 0 0 1 1.73 1" />  <path d="M8 18h1" />  <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>'
        );
      case "clipboard-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5" />  <path d="M4 13.5V6a2 2 0 0 1 2-2h2" />  <path d="M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>'
        );
      case "clipboard-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />  <path d="M9 14h6" />  <path d="M12 17v-6" /></svg>'
        );
      case "clipboard-type":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />  <path d="M9 12v-1h6v1" />  <path d="M11 17h2" />  <path d="M12 11v6" /></svg>'
        );
      case "clipboard-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />  <path d="m15 11-6 6" />  <path d="m9 11 6 6" /></svg>'
        );
      case "clipboard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>'
        );
      case "clock-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l2-4" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-10":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l-4-2" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-11":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l-2-4" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-12":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l4-2" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6h4" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l4 2" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-5":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l2 4" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-6":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v10" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-7":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l-2 4" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-8":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l-4 2" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-9":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6H8" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "clock-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l4 2" />  <path d="M20 12v5" />  <path d="M20 21h.01" />  <path d="M21.25 8.2A10 10 0 1 0 16 21.16" /></svg>'
        );
      case "clock-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l2 1" />  <path d="M12.337 21.994a10 10 0 1 1 9.588-8.767" />  <path d="m14 18 4 4 4-4" />  <path d="M18 14v8" /></svg>'
        );
      case "clock-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l1.56.78" />  <path d="M13.227 21.925a10 10 0 1 1 8.767-9.588" />  <path d="m14 18 4-4 4 4" />  <path d="M18 22v-8" /></svg>'
        );
      case "clock-fading":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2a10 10 0 0 1 7.38 16.75" />  <path d="M12 6v6l4 2" />  <path d="M2.5 8.875a10 10 0 0 0-.5 3" />  <path d="M2.83 16a10 10 0 0 0 2.43 3.4" />  <path d="M4.636 5.235a10 10 0 0 1 .891-.857" />  <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" /></svg>'
        );
      case "clock-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l3.644 1.822" />  <path d="M16 19h6" />  <path d="M19 16v6" />  <path d="M21.92 13.267a10 10 0 1 0-8.653 8.653" /></svg>'
        );
      case "clock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v6l4 2" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "closed-caption":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 9.17a3 3 0 1 0 0 5.66" />  <path d="M17 9.17a3 3 0 1 0 0 5.66" />  <rect x="2" y="5" width="20" height="14" rx="2" /></svg>'
        );
      case "cloth":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 5a1.41 1.41 0 0 0 0 2l1 1a1.41 1.41 0 0 1 0 2l-1 1a1.41 1.41 0 0 0 0 2l1 1a1.41 1.41 0 0 1 0 2l-1 1a1.41 1.41 0 0 0 0 2l2 2a1.41 1.41 0 0 0 2 0l1-1a1.41 1.41 0 0 1 2 0l1 1a1.41 1.41 0 0 0 2 0l1-1a1.41 1.41 0 0 1 2 0l1 1a1.41 1.41 0 0 0 2 0l2-2a1.41 1.41 0 0 0 0-2l-1-1a1.41 1.41 0 0 1 0-2l1-1a1.41 1.41 0 0 0 0-2l-1-1a1.41 1.41 0 0 1 0-2l1-1a1.41 1.41 0 0 0 0-2l-2-2a1.41 1.41 0 0 0-2 0l-1 1a1.41 1.41 0 0 1-2 0l-1-1a1.41 1.41 0 0 0-2 0l-1 1a1.41 1.41 0 0 1-2 0L7 3a1.41 1.41 0 0 0-2 0Z" /></svg>'
        );
      case "cloud-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12v4" />  <path d="M12 20h.01" />  <path d="M17 18h.5a1 1 0 0 0 0-9h-1.79A7 7 0 1 0 7 17.708" /></svg>'
        );
      case "cloud-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 15-5.5 5.5L9 18" />  <path d="M5 17.743A7 7 0 1 1 15.71 10h1.79a4.5 4.5 0 0 1 1.5 8.742" /></svg>'
        );
      case "cloud-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10.852 19.772-.383.924" />  <path d="m13.148 14.228.383-.923" />  <path d="M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" />  <path d="m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" />  <path d="m14.772 15.852.923-.383" />  <path d="m14.772 18.148.923.383" />  <path d="M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" />  <path d="m9.228 15.852-.923-.383" />  <path d="m9.228 18.148-.923.383" /></svg>'
        );
      case "cloud-download":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13v8l-4-4" />  <path d="m12 21 4-4" />  <path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284" /></svg>'
        );
      case "cloud-drizzle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="M8 19v1" />  <path d="M8 14v1" />  <path d="M16 19v1" />  <path d="M16 14v1" />  <path d="M12 21v1" />  <path d="M12 16v1" /></svg>'
        );
      case "cloud-fog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="M16 17H7" />  <path d="M17 21H9" /></svg>'
        );
      case "cloud-hail":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="M16 14v2" />  <path d="M8 14v2" />  <path d="M16 20h.01" />  <path d="M8 20h.01" />  <path d="M12 16v2" />  <path d="M12 22h.01" /></svg>'
        );
      case "cloud-lightning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />  <path d="m13 12-3 5h4l-3 5" /></svg>'
        );
      case "cloud-moon-rain":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 20v2" />  <path d="M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36" />  <path d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" />  <path d="M7 19v2" /></svg>'
        );
      case "cloud-moon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 16a3 3 0 0 1 0 6H7a5 5 0 1 1 4.9-6z" />  <path d="M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36" /></svg>'
        );
      case "cloud-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 20 20" />  <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" />  <path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" /></svg>'
        );
      case "cloud-rain-wind":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="m9.2 22 3-7" />  <path d="m9 13-3 7" />  <path d="m17 13-3 7" /></svg>'
        );
      case "cloud-rain":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="M16 14v6" />  <path d="M8 14v6" />  <path d="M12 16v6" /></svg>'
        );
      case "cloud-snow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="M8 15h.01" />  <path d="M8 19h.01" />  <path d="M12 17h.01" />  <path d="M12 21h.01" />  <path d="M16 15h.01" />  <path d="M16 19h.01" /></svg>'
        );
      case "cloud-sun-rain":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v2" />  <path d="m4.93 4.93 1.41 1.41" />  <path d="M20 12h2" />  <path d="m19.07 4.93-1.41 1.41" />  <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />  <path d="M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" />  <path d="M11 20v2" />  <path d="M7 19v2" /></svg>'
        );
      case "cloud-sun":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v2" />  <path d="m4.93 4.93 1.41 1.41" />  <path d="M20 12h2" />  <path d="m19.07 4.93-1.41 1.41" />  <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />  <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" /></svg>'
        );
      case "cloud-upload":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13v8" />  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />  <path d="m8 17 4-4 4 4" /></svg>'
        );
      case "cloud":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>'
        );
      case "cloudy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />  <path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5" /></svg>'
        );
      case "clover":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.17 7.83 2 22" />  <path d="M4.02 12a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12" />  <path d="m7.83 7.83 8.34 8.34" /></svg>'
        );
      case "club":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.28 9.05a5.5 5.5 0 1 0-10.56 0A5.5 5.5 0 1 0 12 17.66a5.5 5.5 0 1 0 5.28-8.6Z" />  <path d="M12 17.66L12 22" /></svg>'
        );
      case "coat-hanger":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 5a3 3 0 1 1 5.1 2.1l-1.5 1.5A2 2 0 0 0 12 10v1" />  <path d="M4 21a2 2 0 0 1-1.1-3.7L12 11l9.2 6.4A2 2 0 0 1 20 21Z" /></svg>'
        );
      case "cocktail":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 6 6.6 2.8C6.3 2.4 5.6 2 5 2H2" />  <path d="m18 6-7 8-7-8Z" />  <path d="M15.4 9.1A4 4 0 1 0 14 6" />  <path d="M11 14v8" />  <path d="M7 22h8" /></svg>'
        );
      case "coconut":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="9" rx="10" ry="7" />  <path d="M2 9v3a10 10 0 0 0 20 0V9" />  <ellipse cx="12" cy="9" rx="6" ry="3" />  <path d="m14 8 6-6h2" /></svg>'
        );
      case "code-xml":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 16 4-4-4-4" />  <path d="m6 8-4 4 4 4" />  <path d="m14.5 4-5 16" /></svg>'
        );
      case "code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 18 6-6-6-6" />  <path d="m8 6-6 6 6 6" /></svg>'
        );
      case "codepen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />  <line x1="12" x2="12" y1="22" y2="15.5" />  <polyline points="22 8.5 12 15.5 2 8.5" />  <polyline points="2 15.5 12 8.5 22 15.5" />  <line x1="12" x2="12" y1="2" y2="8.5" /></svg>'
        );
      case "codesandbox":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />  <polyline points="7.5 4.21 12 6.81 16.5 4.21" />  <polyline points="7.5 19.79 7.5 14.6 3 12" />  <polyline points="21 12 16.5 14.6 16.5 19.79" />  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />  <line x1="12" x2="12" y1="22.08" y2="12" /></svg>'
        );
      case "coffee-bean":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.05 19.95a11.24 8.585 135 0 0 15.9-15.9 11.24 8.585 135 0 0-15.9 15.9" />  <path d="M19.8 4.2C20 14 4 10 4.2 19.8" /></svg>'
        );
      case "coffee":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v2" />  <path d="M14 2v2" />  <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />  <path d="M6 2v2" /></svg>'
        );
      case "coffeemaker":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 22V12a2 2 0 0 0-2-2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v18H2" />  <path d="M10 2v2a2 2 0 1 1-4 0V2" />  <path d="M22 6h-4" />  <path d="M22 10h-4" />  <path d="M18 22v-6a2 2 0 0 1 2-2h2" />  <path d="M7 10v2" />  <path d="M7 22c-1.7 0-3-1.3-3-3v-3h6v3c0 1.7-1.3 3-3 3" />  <path d="M2 18a2 2 0 0 1 2-2" /></svg>'
        );
      case "cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 10.27 7 3.34" />  <path d="m11 13.73-4 6.93" />  <path d="M12 22v-2" />  <path d="M12 2v2" />  <path d="M14 12h8" />  <path d="m17 20.66-1-1.73" />  <path d="m17 3.34-1 1.73" />  <path d="M2 12h2" />  <path d="m20.66 17-1.73-1" />  <path d="m20.66 7-1.73 1" />  <path d="m3.34 17 1.73-1" />  <path d="m3.34 7 1.73 1" />  <circle cx="12" cy="12" r="2" />  <circle cx="12" cy="12" r="8" /></svg>'
        );
      case "coins-exchange":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 10V5c0-1.7 1.3-3 3-3h1" />  <path d="m3 7 3 3 3-3" />  <circle cx="18" cy="6" r="4" />  <path d="M18 14v5c0 1.7-1.3 3-3 3h-1" />  <path d="m21 17-3-3-3 3" />  <circle cx="6" cy="18" r="4" /></svg>'
        );
      case "coins-stack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="6" rx="9" ry="3" />  <path d="M3 10c0 1.7 4 3 9 3s9-1.3 9-3" />  <path d="M3 14c0 1.7 4 3 9 3s9-1.3 9-3" />  <path d="M3 6v12c0 1.7 4 3 9 3s9-1.3 9-3V6" /></svg>'
        );
      case "coins":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="8" cy="8" r="6" />  <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />  <path d="M7 6h1v4" />  <path d="m16.71 13.88.7.71-2.82 2.82" /></svg>'
        );
      case "columns-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 3v18" /></svg>'
        );
      case "columns-3-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5" />  <path d="m14.3 19.6 1-.4" />  <path d="M15 3v7.5" />  <path d="m15.2 16.9-.9-.3" />  <path d="m16.6 21.7.3-.9" />  <path d="m16.8 15.3-.4-1" />  <path d="m19.1 15.2.3-.9" />  <path d="m19.6 21.7-.4-1" />  <path d="m20.7 16.8 1-.4" />  <path d="m21.7 19.4-.9-.3" />  <path d="M9 3v18" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "columns-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 3v18" />  <path d="M15 3v18" /></svg>'
        );
      case "columns-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7.5 3v18" />  <path d="M12 3v18" />  <path d="M16.5 3v18" /></svg>'
        );
      case "combine":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 18H5a3 3 0 0 1-3-3v-1" />  <path d="M14 2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />  <path d="M20 2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />  <path d="m7 21 3-3-3-3" />  <rect x="14" y="14" width="8" height="8" rx="2" />  <rect x="2" y="2" width="8" height="8" rx="2" /></svg>'
        );
      case "command":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></svg>'
        );
      case "compass":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "component":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z" />  <path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z" />  <path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z" />  <path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z" /></svg>'
        );
      case "computer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="8" x="5" y="2" rx="2" />  <rect width="20" height="8" x="2" y="14" rx="2" />  <path d="M6 18h2" />  <path d="M12 18h6" /></svg>'
        );
      case "concierge-bell":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" />  <path d="M20 16a8 8 0 1 0-16 0" />  <path d="M12 4v4" />  <path d="M10 4h4" /></svg>'
        );
      case "cone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98" />  <ellipse cx="12" cy="19" rx="9" ry="3" /></svg>'
        );
      case "construction":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="2" y="6" width="20" height="8" rx="1" />  <path d="M17 14v7" />  <path d="M7 14v7" />  <path d="M17 3v3" />  <path d="M7 3v3" />  <path d="M10 14 2.3 6.3" />  <path d="m14 6 7.7 7.7" />  <path d="m8 6 8 8" /></svg>'
        );
      case "contact-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 2v2" />  <path d="M17.915 22a6 6 0 0 0-12 0" />  <path d="M8 2v2" />  <circle cx="12" cy="12" r="4" />  <rect x="3" y="4" width="18" height="18" rx="2" /></svg>'
        );
      case "contact":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 2v2" />  <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />  <path d="M8 2v2" />  <circle cx="12" cy="11" r="3" />  <rect x="3" y="4" width="18" height="18" rx="2" /></svg>'
        );
      case "container":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" />  <path d="M10 21.9V14L2.1 9.1" />  <path d="m10 14 11.9-6.9" />  <path d="M14 19.8v-8.1" />  <path d="M18 17.5V9.4" /></svg>'
        );
      case "contrast":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 18a6 6 0 0 0 0-12v12z" /></svg>'
        );
      case "cookie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />  <path d="M8.5 8.5v.01" />  <path d="M16 15.5v.01" />  <path d="M12 12v.01" />  <path d="M11 17v.01" />  <path d="M7 14v.01" /></svg>'
        );
      case "cooking-pot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12h20" />  <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />  <path d="m4 8 16-4" />  <path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" /></svg>'
        );
      case "copy-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 15 2 2 4-4" />  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
        );
      case "copy-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />  <rect width="14" height="14" x="8" y="8" rx="2" />  <path d="m13 13-1 2 1 2" />  <path d="m17 13 1 2-1 2" /></svg>'
        );
      case "copy-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />  <rect width="14" height="14" x="8" y="8" rx="2" />  <path d="M15 12v6" />  <path d="m12 15 3 3 3-3" /></svg>'
        );
      case "copy-file-path":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />  <rect width="14" height="14" x="8" y="8" rx="2" />  <path d="M12 18h.01" />  <path d="m18 12-2 6" /></svg>'
        );
      case "copy-image":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />  <rect width="14" height="14" x="8" y="8" rx="2" />  <circle cx="14" cy="14" r="2" />  <path d="m13.4 22 4.7-3.9c.8-.8 2-.8 2.8 0l1.1 1.1" /></svg>'
        );
      case "copy-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="12" x2="18" y1="15" y2="15" />  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
        );
      case "copy-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="15" x2="15" y1="12" y2="18" />  <line x1="12" x2="18" y1="15" y2="15" />  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
        );
      case "copy-slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="12" x2="18" y1="18" y2="12" />  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
        );
      case "copy-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />  <rect width="14" height="14" x="8" y="8" rx="2" />  <path d="M12 13h6" />  <path d="M12 17h6" /></svg>'
        );
      case "copy-type":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="14" x="8" y="8" rx="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />  <path d="M12 13v-1h6v1" />  <path d="M15 12v6" />  <path d="M14 18h2" /></svg>'
        );
      case "copy-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="12" x2="18" y1="12" y2="18" />  <line x1="12" x2="18" y1="18" y2="12" />  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
        );
      case "copy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
        );
      case "copyleft":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M9.17 14.83a4 4 0 1 0 0-5.66" /></svg>'
        );
      case "copyright":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M14.83 14.83a4 4 0 1 1 0-5.66" /></svg>'
        );
      case "corner-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 4v7a4 4 0 0 1-4 4H4" />  <path d="m9 10-5 5 5 5" /></svg>'
        );
      case "corner-down-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 10 5 5-5 5" />  <path d="M4 4v7a4 4 0 0 0 4 4h12" /></svg>'
        );
      case "corner-left-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 15-5 5-5-5" />  <path d="M20 4h-7a4 4 0 0 0-4 4v12" /></svg>'
        );
      case "corner-left-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 9 9 4 4 9" />  <path d="M20 20h-7a4 4 0 0 1-4-4V4" /></svg>'
        );
      case "corner-right-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 15 5 5 5-5" />  <path d="M4 4h7a4 4 0 0 1 4 4v12" /></svg>'
        );
      case "corner-right-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 9 5-5 5 5" />  <path d="M4 20h7a4 4 0 0 0 4-4V4" /></svg>'
        );
      case "corner-up-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20v-7a4 4 0 0 0-4-4H4" />  <path d="M9 14 4 9l5-5" /></svg>'
        );
      case "corner-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 14 5-5-5-5" />  <path d="M4 20v-7a4 4 0 0 1 4-4h12" /></svg>'
        );
      case "cow-head":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.8 15.1a10 10 0 0 0 .9-7.1h.3c1.7 0 3-1.3 3-3V3h-3c-1.3 0-2.4.8-2.8 1.9a10 10 0 0 0-8.4 0C7.4 3.8 6.3 3 5 3H2v2c0 1.7 1.3 3 3 3h.3a10 10 0 0 0 .9 7.1" />  <path d="M9 9.5v.5" />  <path d="M15 9.5v.5" />  <path d="M15 22a4 4 0 1 0-3-6.6A4 4 0 1 0 9 22Z" />  <path d="M9 18h.01" />  <path d="M15 18h.01" /></svg>'
        );
      case "cow-udder-droplets":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 2c0 2 .6 4 1.7 5.5L2.3 10a2 2 0 0 0 3.4 2l.9-1.6c1 .6 2.1 1.1 3.4 1.4V14a2 2 0 0 0 4 0v-2.2a8.5 8.5 0 0 0 3.4-1.4l.9 1.6a1.94 1.94 0 1 0 3.4-2l-1.4-2.5C21.4 6 22 4 22 2Z" />  <path d="M7.9 18.6c-.6-.6-1.1-1.3-1.4-2.1-.3.8-.8 1.5-1.4 2.1a1.93 1.93 0 1 0 2.8 0" />  <path d="M18.9 18.6c-.6-.6-1.1-1.3-1.4-2.1-.3.8-.8 1.5-1.4 2.1a1.93 1.93 0 1 0 2.8 0" /></svg>'
        );
      case "cpu":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20v2" />  <path d="M12 2v2" />  <path d="M17 20v2" />  <path d="M17 2v2" />  <path d="M2 12h2" />  <path d="M2 17h2" />  <path d="M2 7h2" />  <path d="M20 12h2" />  <path d="M20 17h2" />  <path d="M20 7h2" />  <path d="M7 20v2" />  <path d="M7 2v2" />  <rect x="4" y="4" width="16" height="16" rx="2" />  <rect x="8" y="8" width="8" height="8" rx="1" /></svg>'
        );
      case "crab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7.5 14A6 6 0 1 1 10 2.36L8 5l2 2S7 8 2 8" />  <path d="M16.5 14A6 6 0 1 0 14 2.36L16 5l-2 2s3 1 8 1" />  <path d="M10 13v-2" />  <path d="M14 13v-2" />  <ellipse cx="12" cy="17.5" rx="7" ry="4.5" />  <path d="M2 16c2 0 3 1 3 1" />  <path d="M2 22c0-1.7 1.3-3 3-3" />  <path d="M19 17s1-1 3-1" />  <path d="M19 19c1.7 0 3 1.3 3 3" /></svg>'
        );
      case "creative-commons":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M10 9.3a2.8 2.8 0 0 0-3.5 1 3.1 3.1 0 0 0 0 3.4 2.7 2.7 0 0 0 3.5 1" />  <path d="M17 9.3a2.8 2.8 0 0 0-3.5 1 3.1 3.1 0 0 0 0 3.4 2.7 2.7 0 0 0 3.5 1" /></svg>'
        );
      case "credit-card":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="14" x="2" y="5" rx="2" />  <line x1="2" x2="22" y1="10" y2="10" /></svg>'
        );
      case "cricket-ball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 8 3.6 6.6" />  <path d="m8 11 1 1" />  <path d="m12 15 1 1" />  <path d="m16 19 1.4 1.4" />  <circle cx="12" cy="12" r="10" />  <path d="M8 5 6.6 3.6" />  <path d="m11 8 1 1" />  <path d="m15 12 1 1" />  <path d="M20.4 17.4 19 16" /></svg>'
        );
      case "cricket-wicket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 2 4 2" />  <path d="m14 3 4-1" />  <circle cx="12" cy="13" r="2" />  <path d="M6 7v15" />  <path d="m13 7-.3 4.1" />  <path d="M12.5 14.9 12 22" />  <path d="M18 7v15" /></svg>'
        );
      case "croissant":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487" />  <path d="M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132" />  <path d="M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42" />  <path d="M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14" />  <path d="M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676" /></svg>'
        );
      case "crop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 2v14a2 2 0 0 0 2 2h14" />  <path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>'
        );
      case "cross-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="3" />  <path d="M14 10V7c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1v3H7c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h3v3c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-3h3c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1Z" /></svg>'
        );
      case "cross":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4a1 1 0 0 1-1-1V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1z" /></svg>'
        );
      case "crosshair-2-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="8" />  <path d="M12 6V2" />  <path d="M22 12h-4" />  <path d="M6 12H2" />  <path d="M12 22v-4" />  <path d="M12 12h.01" /></svg>'
        );
      case "crosshair-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="8" />  <path d="M12 6V2" />  <path d="M22 12h-4" />  <path d="M6 12H2" />  <path d="M12 22v-4" /></svg>'
        );
      case "crosshair-plus-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16v5" />  <path d="M12 3v5" />  <path d="M16 12h5" />  <path d="M3 12h5" />  <path d="M12 12h.01" /></svg>'
        );
      case "crosshair-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16v5" />  <path d="M12 3v5" />  <path d="M16 12h5" />  <path d="M3 12h5" /></svg>'
        );
      case "crosshair-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3H5a2 2 0 0 0-2 2v3" />  <path d="M12 3v5" />  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />  <path d="M16 12h5" />  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />  <path d="M12 16v5" />  <path d="M3 16v3a2 2 0 0 0 2 2h3" />  <path d="M3 12h5" />  <path d="M12 12h.01" /></svg>'
        );
      case "crosshair":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <line x1="22" x2="18" y1="12" y2="12" />  <line x1="6" x2="2" y1="12" y2="12" />  <line x1="12" x2="12" y1="6" y2="2" />  <line x1="12" x2="12" y1="22" y2="18" /></svg>'
        );
      case "crown":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />  <path d="M5 21h14" /></svg>'
        );
      case "cuboid":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.95 8.41a2 2 0 0 0-.95 1.7v5.82a2 2 0 0 0 .88 1.66l6.05 4.07a2 2 0 0 0 2.17.05l9.95-6.12a2 2 0 0 0 .95-1.7V8.06a2 2 0 0 0-.88-1.66Z" />  <path d="M10 22v-8L2.25 9.15" />  <path d="m10 14 11.77-6.87" /></svg>'
        );
      case "cup-saucer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 18a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4Z" />  <path d="M6 8h12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4Z" />  <path d="M18 8h1a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-1" />  <path d="M6 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M12 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M18 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" /></svg>'
        );
      case "cup-soda":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" />  <path d="M5 8h14" />  <path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />  <path d="m12 8 1-6h2" /></svg>'
        );
      case "cup-to-go":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 7h16" />  <path d="m18.2 11 .8-4-.8-4c-.1-.5-.6-1-1.2-1H7c-.6 0-1.1.4-1.2 1C5.5 4.4 5 7 5 7l.8 4" />  <path d="M18 18H6l-1-7h14Z" />  <path d="m7.2 18 .6 3c.1.5.6 1 1.2 1h6c.6 0 1.1-.4 1.2-1l.6-3" /></svg>'
        );
      case "currency-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m17 7-2.17 2.17" />  <path d="m17 17-2.17-2.17" />  <path d="m7 17 2.17-2.17" />  <path d="m7 7 2.17 2.17" />  <circle cx="12" cy="12" r="4" /></svg>'
        );
      case "currency":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="8" />  <line x1="3" x2="6" y1="3" y2="6" />  <line x1="21" x2="18" y1="3" y2="6" />  <line x1="3" x2="6" y1="21" y2="18" />  <line x1="21" x2="18" y1="21" y2="18" /></svg>'
        );
      case "cylinder":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="5" rx="9" ry="3" />  <path d="M3 5v14a9 3 0 0 0 18 0V5" /></svg>'
        );
      case "dam":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 11.31c1.17.56 1.54 1.69 3.5 1.69 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M11.75 18c.35.5 1.45 1 2.75 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M2 10h4" />  <path d="M2 14h4" />  <path d="M2 18h4" />  <path d="M2 6h4" />  <path d="M7 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1L10 4a1 1 0 0 0-1-1z" /></svg>'
        );
      case "database-backup":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="5" rx="9" ry="3" />  <path d="M3 12a9 3 0 0 0 5 2.69" />  <path d="M21 9.3V5" />  <path d="M3 5v14a9 3 0 0 0 6.47 2.88" />  <path d="M12 12v4h4" />  <path d="M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" /></svg>'
        );
      case "database-zap":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="5" rx="9" ry="3" />  <path d="M3 5V19A9 3 0 0 0 15 21.84" />  <path d="M21 5V8" />  <path d="M21 12L18 17H22L19 22" />  <path d="M3 12A9 3 0 0 0 14.59 14.87" /></svg>'
        );
      case "database":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="5" rx="9" ry="3" />  <path d="M3 5V19A9 3 0 0 0 21 19V5" />  <path d="M3 12A9 3 0 0 0 21 12" /></svg>'
        );
      case "decimals-arrow-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13 21-3-3 3-3" />  <path d="M20 18H10" />  <path d="M3 11h.01" />  <rect x="6" y="3" width="5" height="8" rx="2.5" /></svg>'
        );
      case "decimals-arrow-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 18h10" />  <path d="m17 21 3-3-3-3" />  <path d="M3 11h.01" />  <rect x="15" y="3" width="5" height="8" rx="2.5" />  <rect x="6" y="3" width="5" height="8" rx="2.5" /></svg>'
        );
      case "delete":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />  <path d="m12 9 6 6" />  <path d="m18 9-6 6" /></svg>'
        );
      case "desk-lamp":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 7 1-2" />  <rect width="4" height="4" x="15" y="7" />  <path d="M6 7v4" />  <path d="M9 7H3l1-5h4Z" />  <path d="M22 22V12c0-.6-.4-1-1-1H3c-.6 0-1 .4-1 1v10" />  <path d="M10 15H2" />  <path d="M10 11v8" />  <path d="M22 19H2" /></svg>'
        );
      case "dessert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.162 3.167A10 10 0 0 0 2 13a2 2 0 0 0 4 0v-1a2 2 0 0 1 4 0v4a2 2 0 0 0 4 0v-4a2 2 0 0 1 4 0v1a2 2 0 0 0 4-.006 10 10 0 0 0-8.161-9.826" />  <path d="M20.804 14.869a9 9 0 0 1-17.608 0" />  <circle cx="12" cy="4" r="2" /></svg>'
        );
      case "diameter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="19" cy="19" r="2" />  <circle cx="5" cy="5" r="2" />  <path d="M6.48 3.66a10 10 0 0 1 13.86 13.86" />  <path d="m6.41 6.41 11.18 11.18" />  <path d="M3.66 6.48a10 10 0 0 0 13.86 13.86" /></svg>'
        );
      case "diamond-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z" />  <path d="M8 12h8" /></svg>'
        );
      case "diamond-percent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z" />  <path d="M9.2 9.2h.01" />  <path d="m14.5 9.5-5 5" />  <path d="M14.7 14.8h.01" /></svg>'
        );
      case "diamond-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 8v8" />  <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z" />  <path d="M8 12h8" /></svg>'
        );
      case "diamond":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" /></svg>'
        );
      case "diaper":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9h4" />  <path d="M22 9h-4" />  <path d="M9 20a7 7 0 0 1-7-7V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a7 7 0 0 1-7 7Z" />  <path d="M2 13a7 7 0 0 1 7 7" />  <path d="M15 20a7 7 0 0 1 7-7" /></svg>'
        );
      case "dice-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M12 12h.01" /></svg>'
        );
      case "dice-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M15 9h.01" />  <path d="M9 15h.01" /></svg>'
        );
      case "dice-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M16 8h.01" />  <path d="M12 12h.01" />  <path d="M8 16h.01" /></svg>'
        );
      case "dice-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M16 8h.01" />  <path d="M8 8h.01" />  <path d="M8 16h.01" />  <path d="M16 16h.01" /></svg>'
        );
      case "dice-5":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M16 8h.01" />  <path d="M8 8h.01" />  <path d="M8 16h.01" />  <path d="M16 16h.01" />  <path d="M12 12h.01" /></svg>'
        );
      case "dice-6":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M16 8h.01" />  <path d="M16 12h.01" />  <path d="M16 16h.01" />  <path d="M8 8h.01" />  <path d="M8 12h.01" />  <path d="M8 16h.01" /></svg>'
        );
      case "dices":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />  <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />  <path d="M6 18h.01" />  <path d="M10 14h.01" />  <path d="M15 6h.01" />  <path d="M18 9h.01" /></svg>'
        );
      case "diff":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v14" />  <path d="M5 10h14" />  <path d="M5 21h14" /></svg>'
        );
      case "disc-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="4" />  <path d="M12 12h.01" /></svg>'
        );
      case "disc-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />  <circle cx="12" cy="12" r="2" />  <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" /></svg>'
        );
      case "disc-album":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <circle cx="12" cy="12" r="5" />  <path d="M12 12h.01" /></svg>'
        );
      case "disc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "dishwasher":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 6v2" />  <path d="M3 7h18" />  <rect width="18" height="20" x="3" y="2" rx="2" />  <path d="m9 11-2 7" />  <circle cx="14.5" cy="15.5" r="2.5" />  <path d="m13 11-2 7" /></svg>'
        );
      case "divide":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="6" r="1" />  <line x1="5" x2="19" y1="12" y2="12" />  <circle cx="12" cy="18" r="1" /></svg>'
        );
      case "dna-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2c-1.35 1.5-2.092 3-2.5 4.5L14 8" />  <path d="m17 6-2.891-2.891" />  <path d="M2 15c3.333-3 6.667-3 10-3" />  <path d="m2 2 20 20" />  <path d="m20 9 .891.891" />  <path d="M22 9c-1.5 1.35-3 2.092-4.5 2.5l-1-1" />  <path d="M3.109 14.109 4 15" />  <path d="m6.5 12.5 1 1" />  <path d="m7 18 2.891 2.891" />  <path d="M9 22c1.35-1.5 2.092-3 2.5-4.5L10 16" /></svg>'
        );
      case "dna":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 16 1.5 1.5" />  <path d="m14 8-1.5-1.5" />  <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />  <path d="m16.5 10.5 1 1" />  <path d="m17 6-2.891-2.891" />  <path d="M2 15c6.667-6 13.333 0 20-6" />  <path d="m20 9 .891.891" />  <path d="M3.109 14.109 4 15" />  <path d="m6.5 12.5 1 1" />  <path d="m7 18 2.891 2.891" />  <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" /></svg>'
        );
      case "dock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 8h20" />  <rect width="20" height="16" x="2" y="4" rx="2" />  <path d="M6 16h12" /></svg>'
        );
      case "dog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.25 16.25h1.5L12 17z" />  <path d="M16 14v.5" />  <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" />  <path d="M8 14v.5" />  <path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" /></svg>'
        );
      case "dollar-sign-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />  <path d="M12 18V6" /></svg>'
        );
      case "dollar-sign-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 17V7" />  <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /></svg>'
        );
      case "dollar-sign":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="12" x2="12" y1="2" y2="22" />  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>'
        );
      case "donut":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.5 10a2.5 2.5 0 0 1-2.4-3H18a2.95 2.95 0 0 1-2.6-4.4 10 10 0 1 0 6.3 7.1c-.3.2-.8.3-1.2.3" />  <circle cx="12" cy="12" r="3" /></svg>'
        );
      case "door-closed-locked":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12h.01" />  <path d="M18 9V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />  <path d="M2 20h8" />  <path d="M20 17v-2a2 2 0 1 0-4 0v2" />  <rect x="14" y="17" width="8" height="5" rx="1" /></svg>'
        );
      case "door-closed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12h.01" />  <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />  <path d="M2 20h20" /></svg>'
        );
      case "door-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 20H2" />  <path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z" />  <path d="M11 4H8a2 2 0 0 0-2 2v14" />  <path d="M14 12h.01" />  <path d="M22 20h-3" /></svg>'
        );
      case "doorbell-intercom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.8 4a2.9 2.9 0 0 0-5.6 0H5c-.6 0-1 .4-1 1v14c0 .6.4 1 1 1h4.2a2.9 2.9 0 0 0 5.6 0H19c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1Z" />  <path d="M8 8h.01" />  <path d="M12 8h.01" />  <path d="M16 8h.01" />  <circle cx="12" cy="14" r="2" /></svg>'
        );
      case "dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12.1" cy="12.1" r="1" /></svg>'
        );
      case "download":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 15V3" />  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />  <path d="m7 10 5 5 5-5" /></svg>'
        );
      case "drafting-compass":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12.99 6.74 1.93 3.44" />  <path d="M19.136 12a10 10 0 0 1-14.271 0" />  <path d="m21 21-2.16-3.84" />  <path d="m3 21 8.02-14.26" />  <circle cx="12" cy="5" r="2" /></svg>'
        );
      case "drama":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 11h.01" />  <path d="M14 6h.01" />  <path d="M18 6h.01" />  <path d="M6.5 13.1h.01" />  <path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3" />  <path d="M17.4 9.9c-.8.8-2 .8-2.8 0" />  <path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7" />  <path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4" /></svg>'
        );
      case "drawing":
        return '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!-- Created with Inkscape (http://www.inkscape.org/) --><svg       viewBox="0 0 0.1 0.1"   version="1.1"   id="svg1"   inkscape:version="1.3.2 (091e20e, 2023-11-25, custom)"   sodipodi:docname="drawing.svg"   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"   xmlns="http://www.w3.org/2000/svg"   xmlns:svg="http://www.w3.org/2000/svg">  <sodipodi:namedview     id="namedview1"     pagecolor="#ffffff"     bordercolor="#000000"     borderopacity="0.25"     inkscape:showpageshadow="2"     inkscape:pageopacity="0.0"     inkscape:pagecheckerboard="0"     inkscape:deskcolor="#d1d1d1"     inkscape:document-units="mm"     inkscape:zoom="256"     inkscape:cx="0.36132812"     inkscape:cy="0.45898438"     inkscape:window-width="1920"     inkscape:window-height="1009"     inkscape:window-x="1912"     inkscape:window-y="-8"     inkscape:window-maximized="1"     inkscape:current-layer="layer1">    <inkscape:page       x="0"       y="0"       width="0.02558466"       height="0.025072273"       id="page1"       margin="1.8265682 82.93 73.059998 86.209999"       bleed="0" />  </sodipodi:namedview>  <defs     id="defs1" />  <g     inkscape:label="Layer 1"     inkscape:groupmode="layer"     id="layer1"     transform="translate(0,0)" /></svg>';
      case "dress":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 2v3a5.14 5.14 0 0 1 .7 4.8l-.2.5a7.64 7.64 0 0 0 .4 6.3C17.7 17.9 19 20 19 20s-3.1 2-7 2-7-2-7-2 1.3-2.1 2.1-3.5a7.64 7.64 0 0 0 .4-6.2l-.2-.5A5.66 5.66 0 0 1 8 5V2" />  <path d="M16 5c-1.8 0-3.3 1-4 2.5C11.3 6 9.8 5 8 5" /></svg>'
        );
      case "dribbble":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />  <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />  <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" /></svg>'
        );
      case "drill":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3 1 1 0 0 1 1-1z" />  <path d="M13 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1l-.81 3.242a1 1 0 0 1-.97.758H8" />  <path d="M14 4h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3" />  <path d="M18 6h4" />  <path d="m5 10-2 8" />  <path d="m7 18 2-8" /></svg>'
        );
      case "drone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10 7 7" />  <path d="m10 14-3 3" />  <path d="m14 10 3-3" />  <path d="m14 14 3 3" />  <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863" />  <path d="M19.637 14a4 4 0 1 1-5.432 5.868" />  <path d="M4.367 10a4 4 0 1 1 5.438-5.862" />  <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873" />  <rect x="10" y="8" width="4" height="8" rx="1" /></svg>'
        );
      case "droplet-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.715 13.186C18.29 11.858 17.384 10.607 16 9.5c-2-1.6-3.5-4-4-6.5a10.7 10.7 0 0 1-.884 2.586" />  <path d="m2 2 20 20" />  <path d="M8.795 8.797A11 11 0 0 1 8 9.5C6 11.1 5 13 5 15a7 7 0 0 0 13.222 3.208" /></svg>'
        );
      case "droplet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>'
        );
      case "droplets":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />  <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" /></svg>'
        );
      case "drum":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 8 8" />  <path d="m22 2-8 8" />  <ellipse cx="12" cy="9" rx="10" ry="5" />  <path d="M7 13.4v7.9" />  <path d="M12 14v8" />  <path d="M17 13.4v7.9" />  <path d="M2 9v8a10 5 0 0 0 20 0V9" /></svg>'
        );
      case "drumstick":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" />  <path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" /></svg>'
        );
      case "dumbbell":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />  <path d="m2.5 21.5 1.4-1.4" />  <path d="m20.1 3.9 1.4-1.4" />  <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />  <path d="m9.6 14.4 4.8-4.8" /></svg>'
        );
      case "ear-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 18.5a3.5 3.5 0 1 0 7 0c0-1.57.92-2.52 2.04-3.46" />  <path d="M6 8.5c0-.75.13-1.47.36-2.14" />  <path d="M8.8 3.15A6.5 6.5 0 0 1 19 8.5c0 1.63-.44 2.81-1.09 3.76" />  <path d="M12.5 6A2.5 2.5 0 0 1 15 8.5M10 13a2 2 0 0 0 1.82-1.18" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "ear":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />  <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" /></svg>'
        );
      case "earth-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 3.34V5a3 3 0 0 0 3 3" />  <path d="M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />  <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />  <path d="M12 2a10 10 0 1 0 9.54 13" />  <path d="M20 6V4a2 2 0 1 0-4 0v2" />  <rect width="8" height="5" x="14" y="6" rx="1" /></svg>'
        );
      case "earth":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />  <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />  <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "eclipse":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 2a7 7 0 1 0 10 10" /></svg>'
        );
      case "egg-cup":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 11c0-3.3-2.7-9-6-9s-6 5.7-6 9" />  <path d="M19 11a7 7 0 1 1-14 0Z" />  <path d="M12 18v4" />  <path d="M9 22h6" /></svg>'
        );
      case "egg-fried":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11.5" cy="12.5" r="3.5" />  <path d="M3 8c0-3.5 2.5-6 6.5-6 5 0 4.83 3 7.5 5s5 2 5 6c0 4.5-2.5 6.5-7 6.5-2.5 0-2.5 2.5-6 2.5s-7-2-7-5.5c0-3 1.5-3 1.5-5C3.5 10 3 9 3 8Z" /></svg>'
        );
      case "egg-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 20 20" />  <path d="M20 14.347V14c0-6-4-12-8-12-1.078 0-2.157.436-3.157 1.19" />  <path d="M6.206 6.21C4.871 8.4 4 11.2 4 14a8 8 0 0 0 14.568 4.568" /></svg>'
        );
      case "egg":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12" /></svg>'
        );
      case "elephant-face":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 10a4 4 0 0 0 4 4 2 2 0 0 1 0 4 7 7 0 0 1-2.8-.6c-.5-.2-.9 0-1 .6l-.1 1-.9.9c-.4.4-.3.9.2 1.2 1.4.6 3 .9 4.6.9 3.3 0 6-2.7 6-6V8a4 4 0 0 0-4-4h-4.6c-.7-1.2-2-2-3.4-2H6C4.3 2 3 3.3 3 5v1a7 7 0 0 0 7 7h2.4" />  <path d="M15.5 10H15" /></svg>'
        );
      case "elephant":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.5 12H14c-2.8 0-5-2.2-5-5V5a2 2 0 0 1 2-2h2c1.5 0 2.8.8 3.4 2H19c1.7 0 3 1.3 3 3v10" />  <path d="M18 10h.01" />  <path d="M14 10a4 4 0 0 0 4 4 4 4 0 0 1 4 4 2 2 0 0 1-4 0" />  <path d="M10 16v5" />  <path d="M18 14a4 4 0 0 0-4 4v3H6v-2.6c0-1.1-.8-2.3-1.7-3C2.9 14.3 2 12.8 2 11c0-3.3 3.1-6 7-6" />  <path d="M2 11v7" /></svg>'
        );
      case "ellipsis-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" /></svg>'
        );
      case "ellipsis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="1" />  <circle cx="19" cy="12" r="1" />  <circle cx="5" cy="12" r="1" /></svg>'
        );
      case "equal-approximately":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 15a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" />  <path d="M5 9a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" /></svg>'
        );
      case "equal-not":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="5" x2="19" y1="9" y2="9" />  <line x1="5" x2="19" y1="15" y2="15" />  <line x1="19" x2="5" y1="5" y2="19" /></svg>'
        );
      case "equal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="5" x2="19" y1="9" y2="9" />  <line x1="5" x2="19" y1="15" y2="15" /></svg>'
        );
      case "eraser":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21" />  <path d="m5.082 11.09 8.828 8.828" /></svg>'
        );
      case "escalator-arrow-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="9" cy="3" r="1" />  <path d="M9 7v3" />  <path d="M17 3c-.6 0-1.3.3-1.7.7L6 13H4a2 2 0 0 0 0 4h3c.6 0 1.3-.3 1.7-.7L18 7h2a2 2 0 0 0 0-4Z" />  <path d="m22 13-9 9" />  <path d="M13 18v4h4" /></svg>'
        );
      case "escalator-arrow-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="9" cy="3" r="1" />  <path d="M9 7v3" />  <path d="M17 3c-.6 0-1.3.3-1.7.7L6 13H4a2 2 0 0 0 0 4h3c.6 0 1.3-.3 1.7-.7L18 7h2a2 2 0 0 0 0-4Z" />  <path d="m22 13-9 9" />  <path d="M18 13h4v4" /></svg>'
        );
      case "ethernet-port":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 20 3-3h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2l3 3z" />  <path d="M6 8v1" />  <path d="M10 8v1" />  <path d="M14 8v1" />  <path d="M18 8v1" /></svg>'
        );
      case "euro-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M6 12h7" />  <path d="M16 9a5 5 0 1 0 0 6" /></svg>'
        );
      case "euro-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 12h7" />  <path d="M16 8a5.14 5.14 0 0 0-8 4 4.95 4.95 0 0 0 8 4" /></svg>'
        );
      case "euro":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 10h12" />  <path d="M4 14h9" />  <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" /></svg>'
        );
      case "expand":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 15 6 6" />  <path d="m15 9 6-6" />  <path d="M21 16v5h-5" />  <path d="M21 8V3h-5" />  <path d="M3 16v5h5" />  <path d="m3 21 6-6" />  <path d="M3 8V3h5" />  <path d="M9 9 3 3" /></svg>'
        );
      case "external-link":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 3h6v6" />  <path d="M10 14 21 3" />  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>'
        );
      case "eye-closed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 18-.722-3.25" />  <path d="M2 8a10.645 10.645 0 0 0 20 0" />  <path d="m20 15-1.726-2.05" />  <path d="m4 15 1.726-2.05" />  <path d="m9 18 .722-3.25" /></svg>'
        );
      case "eye-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />  <path d="m2 2 20 20" /></svg>'
        );
      case "eye":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />  <circle cx="12" cy="12" r="3" /></svg>'
        );
      case "face-alien":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12a7.85 7.85 0 0 1-3.7 6.6l-4 2.7a3.9 3.9 0 0 1-4.5 0l-4-2.7A7.57 7.57 0 0 1 2 12a10 10 0 0 1 20 0" />  <path d="M10.7 11.3c-1.4-1.3-3.3-1.7-4.2-.8s-.5 2.8.8 4.2c1.4 1.4 3.2 1.8 4.2.8.9-.9.5-2.8-.8-4.2" />  <path d="M17.5 10.5c-.9-.9-2.8-.5-4.2.8-1.4 1.4-1.8 3.2-.8 4.2.9.9 2.8.5 4.2-.8 1.3-1.4 1.7-3.3.8-4.2" /></svg>'
        );
      case "facebook":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>'
        );
      case "factory":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16h.01" />  <path d="M16 16h.01" />  <path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />  <path d="M8 16h.01" /></svg>'
        );
      case "fan-handheld":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 4c0-.6.4-1 1-1a17.8 17.8 0 0 1 16.9 16.9c0 .6-.4 1-1 1.1H5c-1.1.1-2-.8-2-1.9Z" />  <path d="M9.9 4.4 3 19" />  <path d="M15.7 8.3 3.6 20.4" />  <path d="M19.6 14.1 5 21" /></svg>'
        );
      case "fan":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" />  <path d="M12 12v.01" /></svg>'
        );
      case "farm":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 14V4.5a2.5 2.5 0 0 0-5 0V14" />  <path d="m8 8 6-5 8 6" />  <path d="M20 4v10" />  <rect width="4" height="4" x="12" y="10" />  <path d="M2 14h20" />  <path d="m2 22 5-8" />  <path d="m7 22 5-8" />  <path d="M22 22H12l5-8" />  <path d="M15 18h7" /></svg>'
        );
      case "fast-forward":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z" />  <path d="M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z" /></svg>'
        );
      case "faucet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.22 4.9 5.4 6H5a2 2 0 0 1 0-4h.4l4.86 1" />  <circle cx="12" cy="4" r="2" />  <path d="m13.78 4.9 4.8 1h.4a2 2 0 0 0 0-4h-.4l-4.92 1" />  <path d="M12 6v3" />  <rect width="4" height="6" x="18" y="10" />  <path d="M22 9v8" />  <path d="M18 11h-2.6a3.87 3.87 0 0 0-6.8 0H7c-2.8 0-5 2.2-5 5v1h4v-1c0-.6.4-1 1-1h1.6a3.87 3.87 0 0 0 6.8 0H18" />  <path d="M3.5 17S2 19 2 20a2 2 0 0 0 4 0c0-1-1.5-3-1.5-3" /></svg>'
        );
      case "feather-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 7h6" />  <path d="M5 4v6" />  <path d="M5.1 17H14l8-8.2c-2.3-2.3-6.1-2.3-8.5 0L2.1 20" />  <path d="M18 13H9.2" /></svg>'
        );
      case "feather-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.3 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.8" />  <path d="M7 12l8.5-8.5c2-2 4.5-2 6.5 0L16.5 9H10" /></svg>'
        );
      case "feather-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.9 8H9.2" />  <path d="M5.1 12H14l8-8.2c-2.3-2.3-6.1-2.3-8.5 0L2 15" />  <path d="M2 19h8" />  <path d="M21 17v1c0 1 1 1.5 1 2.5 0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5 0-1 1-1.5 1-2.5v-1" />  <path d="M14 17h8" /></svg>'
        );
      case "feather":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z" />  <path d="M16 8 2 22" />  <path d="M17.5 15H9" /></svg>'
        );
      case "fence":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" />  <path d="M6 8h4" />  <path d="M6 18h4" />  <path d="m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" />  <path d="M14 8h4" />  <path d="M14 18h4" />  <path d="m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" /></svg>'
        );
      case "ferris-wheel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="2" />  <path d="M12 2v4" />  <path d="m6.8 15-3.5 2" />  <path d="m20.7 7-3.5 2" />  <path d="M6.8 9 3.3 7" />  <path d="m20.7 17-3.5-2" />  <path d="m9 22 3-8 3 8" />  <path d="M8 22h8" />  <path d="M18 18.7a9 9 0 1 0-12 0" /></svg>'
        );
      case "figma":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />  <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />  <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />  <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />  <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" /></svg>'
        );
      case "file-archive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12v-1" />  <path d="M10 18v-2" />  <path d="M10 7V6" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01" />  <circle cx="10" cy="20" r="2" /></svg>'
        );
      case "file-audio-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <circle cx="3" cy="17" r="1" />  <path d="M2 17v-3a4 4 0 0 1 8 0v3" />  <circle cx="9" cy="17" r="1" /></svg>'
        );
      case "file-audio":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M2 19a2 2 0 1 1 4 0v1a2 2 0 1 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 1 1-4 0v-1a2 2 0 1 1 4 0" /></svg>'
        );
      case "file-axis-3d":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m8 18 4-4" />  <path d="M8 10v8h8" /></svg>'
        );
      case "file-badge-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13.69 12.479 1.29 4.88a.5.5 0 0 1-.697.591l-1.844-.849a1 1 0 0 0-.88.001l-1.846.85a.5.5 0 0 1-.693-.593l1.29-4.88" />  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />  <circle cx="12" cy="10" r="3" /></svg>'
        );
      case "file-badge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3.072" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m6.69 16.479 1.29 4.88a.5.5 0 0 1-.698.591l-1.843-.849a1 1 0 0 0-.88.001l-1.846.85a.5.5 0 0 1-.693-.593l1.29-4.88" />  <circle cx="5" cy="14" r="3" /></svg>'
        );
      case "file-box":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M3 13.1a2 2 0 0 0-1 1.76v3.24a2 2 0 0 0 .97 1.78L6 21.7a2 2 0 0 0 2.03.01L11 19.9a2 2 0 0 0 1-1.76V14.9a2 2 0 0 0-.97-1.78L8 11.3a2 2 0 0 0-2.03-.01Z" />  <path d="M7 17v5" />  <path d="M11.7 14.2 7 17l-4.7-2.8" /></svg>'
        );
      case "file-chart-column-increasing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M8 18v-2" />  <path d="M12 18v-4" />  <path d="M16 18v-6" /></svg>'
        );
      case "file-chart-column":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M8 18v-1" />  <path d="M12 18v-6" />  <path d="M16 18v-3" /></svg>'
        );
      case "file-chart-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m16 13-3.5 3.5-2-2L8 17" /></svg>'
        );
      case "file-chart-pie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3.5" />  <path d="M4.017 11.512a6 6 0 1 0 8.466 8.475" />  <path d="M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z" /></svg>'
        );
      case "file-check-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m3 15 2 2 4-4" /></svg>'
        );
      case "file-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m9 15 2 2 4-4" /></svg>'
        );
      case "file-clock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />  <path d="M8 14v2.2l1.6 1" />  <circle cx="8" cy="16" r="6" /></svg>'
        );
      case "file-code-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m5 12-3 3 3 3" />  <path d="m9 18 3-3-3-3" /></svg>'
        );
      case "file-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12.5 8 15l2 2.5" />  <path d="m14 12.5 2 2.5-2 2.5" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /></svg>'
        );
      case "file-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m2.305 15.53.923-.382" />  <path d="m3.228 12.852-.924-.383" />  <path d="M4.677 21.5a2 2 0 0 0 1.313.5H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2.5" />  <path d="m4.852 11.228-.383-.923" />  <path d="m4.852 16.772-.383.924" />  <path d="m7.148 11.228.383-.923" />  <path d="m7.53 17.696-.382-.924" />  <path d="m8.772 12.852.923-.383" />  <path d="m8.772 15.148.923.383" />  <circle cx="6" cy="14" r="3" /></svg>'
        );
      case "file-diff":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M9 10h6" />  <path d="M12 13V7" />  <path d="M9 17h6" /></svg>'
        );
      case "file-digit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <rect width="4" height="6" x="2" y="12" rx="2" />  <path d="M10 12h2v6" />  <path d="M10 18h4" /></svg>'
        );
      case "file-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M12 18v-6" />  <path d="m9 15 3 3 3-3" /></svg>'
        );
      case "file-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M2.62 13.8A2.25 2.25 0 1 1 6 10.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z" />  <path d="M4 6.005V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-1.9-1.376" /></svg>'
        );
      case "file-image":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <circle cx="10" cy="12" r="2" />  <path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" /></svg>'
        );
      case "file-input":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M2 15h10" />  <path d="m9 18 3-3-3-3" /></svg>'
        );
      case "file-json-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M4 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />  <path d="M8 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" /></svg>'
        );
      case "file-json":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />  <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" /></svg>'
        );
      case "file-key-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v6" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <circle cx="4" cy="16" r="2" />  <path d="m10 10-4.5 4.5" />  <path d="m9 11 1 1" /></svg>'
        );
      case "file-key":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <circle cx="10" cy="16" r="2" />  <path d="m16 10-4.5 4.5" />  <path d="m15 11 1 1" /></svg>'
        );
      case "file-lock-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <rect width="8" height="5" x="2" y="13" rx="1" />  <path d="M8 13v-2a2 2 0 1 0-4 0v2" /></svg>'
        );
      case "file-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <rect width="8" height="6" x="8" y="12" rx="1" />  <path d="M10 12v-2a2 2 0 1 1 4 0v2" /></svg>'
        );
      case "file-minus-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M3 15h6" /></svg>'
        );
      case "file-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M9 15h6" /></svg>'
        );
      case "file-music":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v8.4" />  <path d="M8 18v-7.7L16 9v7" />  <circle cx="14" cy="16" r="2" />  <circle cx="6" cy="18" r="2" /></svg>'
        );
      case "file-output":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M4 7V4a2 2 0 0 1 2-2 2 2 0 0 0-2 2" />  <path d="M4.063 20.999a2 2 0 0 0 2 1L18 22a2 2 0 0 0 2-2V7l-5-5H6" />  <path d="m5 11-3 3" />  <path d="m5 17-3-3h10" /></svg>'
        );
      case "file-pen-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />  <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />  <path d="M8 18h1" /></svg>'
        );
      case "file-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>'
        );
      case "file-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />  <path d="M15.033 13.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z" /></svg>'
        );
      case "file-plus-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M3 15h6" />  <path d="M6 12v6" /></svg>'
        );
      case "file-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M9 15h6" />  <path d="M12 18v-6" /></svg>'
        );
      case "file-question-mark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17h.01" />  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />  <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" /></svg>'
        );
      case "file-scan":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M16 14a2 2 0 0 0-2 2" />  <path d="M20 14a2 2 0 0 1 2 2" />  <path d="M20 22a2 2 0 0 0 2-2" />  <path d="M16 22a2 2 0 0 1-2-2" /></svg>'
        );
      case "file-search-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <circle cx="11.5" cy="14.5" r="2.5" />  <path d="M13.3 16.3 15 18" /></svg>'
        );
      case "file-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />  <path d="m9 18-1.5-1.5" />  <circle cx="5" cy="14" r="3" /></svg>'
        );
      case "file-sliders":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M8 12h8" />  <path d="M10 11v2" />  <path d="M8 17h8" />  <path d="M14 16v2" /></svg>'
        );
      case "file-spreadsheet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M8 13h2" />  <path d="M14 13h2" />  <path d="M8 17h2" />  <path d="M14 17h2" /></svg>'
        );
      case "file-stack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1" />  <path d="M16 16a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1" />  <path d="M21 6a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 17 2h-3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z" /></svg>'
        );
      case "file-symlink":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 18 3-3-3-3" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M4 11V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7" /></svg>'
        );
      case "file-terminal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m8 16 2-2-2-2" />  <path d="M12 18h4" /></svg>'
        );
      case "file-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M10 9H8" />  <path d="M16 13H8" />  <path d="M16 17H8" /></svg>'
        );
      case "file-type-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M2 13v-1h6v1" />  <path d="M5 12v6" />  <path d="M4 18h2" /></svg>'
        );
      case "file-type":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M9 13v-1h6v1" />  <path d="M12 12v6" />  <path d="M11 18h2" /></svg>'
        );
      case "file-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M12 12v6" />  <path d="m15 15-3-3-3 3" /></svg>'
        );
      case "file-user":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M15 18a3 3 0 1 0-6 0" />  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />  <circle cx="12" cy="13" r="2" /></svg>'
        );
      case "file-video-camera":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <rect width="8" height="6" x="2" y="12" rx="1" />  <path d="m10 13.843 3.033-1.755a.645.645 0 0 1 .967.56v4.704a.645.645 0 0 1-.967.56L10 16.157" /></svg>'
        );
      case "file-volume-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M8 15h.01" />  <path d="M11.5 13.5a2.5 2.5 0 0 1 0 3" />  <path d="M15 12a5 5 0 0 1 0 6" /></svg>'
        );
      case "file-volume":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 11a5 5 0 0 1 0 6" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M4 6.765V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-.93-.23" />  <path d="M7 10.51a.5.5 0 0 0-.826-.38l-1.893 1.628A1 1 0 0 1 3.63 12H2.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h1.129a1 1 0 0 1 .652.242l1.893 1.63a.5.5 0 0 0 .826-.38z" /></svg>'
        );
      case "file-warning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M12 9v4" />  <path d="M12 17h.01" /></svg>'
        );
      case "file-x-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m8 12.5-5 5" />  <path d="m3 12.5 5 5" /></svg>'
        );
      case "file-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="m14.5 12.5-5 5" />  <path d="m9.5 12.5 5 5" /></svg>'
        );
      case "file":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>'
        );
      case "files":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 2a2 2 0 0 1 1.414.586l4 4A2 2 0 0 1 21 8v7a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />  <path d="M15 2v4a2 2 0 0 0 2 2h4" />  <path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" /></svg>'
        );
      case "film":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 3v18" />  <path d="M3 7.5h4" />  <path d="M3 12h18" />  <path d="M3 16.5h4" />  <path d="M17 3v18" />  <path d="M17 7.5h4" />  <path d="M17 16.5h4" /></svg>'
        );
      case "fingerprint":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />  <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />  <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />  <path d="M2 12a10 10 0 0 1 18-6" />  <path d="M2 16h.01" />  <path d="M21.8 16c.2-2 .131-5.354 0-6" />  <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />  <path d="M8.65 22c.21-.66.45-1.32.57-2" />  <path d="M9 6.8a6 6 0 0 1 9 5.2v2" /></svg>'
        );
      case "fire-extinguisher":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5" />  <path d="M9 18h8" />  <path d="M18 3h-3" />  <path d="M11 3a6 6 0 0 0-6 6v11" />  <path d="M5 13h4" />  <path d="M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z" /></svg>'
        );
      case "fish-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 12.47v.03m0-.5v.47m-.475 5.056A6.744 6.744 0 0 1 15 18c-3.56 0-7.56-2.53-8.5-6 .348-1.28 1.114-2.433 2.121-3.38m3.444-2.088A8.802 8.802 0 0 1 15 6c3.56 0 6.06 2.54 7 6-.309 1.14-.786 2.177-1.413 3.058" />  <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33m7.48-4.372A9.77 9.77 0 0 1 16 6.07m0 11.86a9.77 9.77 0 0 1-1.728-3.618" />  <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98M8.53 3h5.27a2 2 0 0 1 1.98 1.67l.23 1.4M2 2l20 20" /></svg>'
        );
      case "fish-symbol":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 16s9-15 20-4C11 23 2 8 2 8" /></svg>'
        );
      case "fish":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" />  <path d="M18 12v.5" />  <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" />  <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" />  <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" />  <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" /></svg>'
        );
      case "flag-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />  <path d="m2 2 20 20" />  <path d="M4 22V4" />  <path d="M7.656 2H8c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10.347" /></svg>'
        );
      case "flag-triangle-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 22V2.8a.8.8 0 0 0-1.17-.71L5.45 7.78a.8.8 0 0 0 0 1.44L18 15.5" /></svg>'
        );
      case "flag-triangle-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 22V2.8a.8.8 0 0 1 1.17-.71l11.38 5.69a.8.8 0 0 1 0 1.44L6 15.5" /></svg>'
        );
      case "flag":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" /></svg>'
        );
      case "flame-kindling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z" />  <path d="m5 22 14-4" />  <path d="m5 18 14 4" /></svg>'
        );
      case "flame":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>'
        );
      case "flashlight-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 16v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4" />  <path d="M7 2h11v4c0 2-2 2-2 4v1" />  <line x1="11" x2="18" y1="6" y2="6" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "flashlight":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z" />  <line x1="6" x2="18" y1="6" y2="6" />  <line x1="12" x2="12" y1="12" y2="12" /></svg>'
        );
      case "flask-conical-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v2.343" />  <path d="M14 2v6.343" />  <path d="m2 2 20 20" />  <path d="M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-1.755-2.96l5.227-9.563" />  <path d="M6.453 15H15" />  <path d="M8.5 2h7" /></svg>'
        );
      case "flask-conical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />  <path d="M6.453 15h11.094" />  <path d="M8.5 2h7" /></svg>'
        );
      case "flask-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v6.292a7 7 0 1 0 4 0V2" />  <path d="M5 15h14" />  <path d="M8.5 2h7" /></svg>'
        );
      case "flip-horizontal-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 7 5 5-5 5V7" />  <path d="m21 7-5 5 5 5V7" />  <path d="M12 20v2" />  <path d="M12 14v2" />  <path d="M12 8v2" />  <path d="M12 2v2" /></svg>'
        );
      case "flip-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />  <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />  <path d="M12 20v2" />  <path d="M12 14v2" />  <path d="M12 8v2" />  <path d="M12 2v2" /></svg>'
        );
      case "flip-vertical-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 3-5 5-5-5h10" />  <path d="m17 21-5-5-5 5h10" />  <path d="M4 12H2" />  <path d="M10 12H8" />  <path d="M16 12h-2" />  <path d="M22 12h-2" /></svg>'
        );
      case "flip-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />  <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />  <path d="M4 12H2" />  <path d="M10 12H8" />  <path d="M16 12h-2" />  <path d="M22 12h-2" /></svg>'
        );
      case "flippers":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 17c0-4 2-7 2-13.5 0-.3-.2-.5-.5-.5C19 3 17 4 17 4s-2-1-4.5-1h-1C9 3 7 4 7 4S5 3 2.5 3c-.3 0-.5.2-.5.5C2 10 4 13 4 17" />  <path d="M12 3v.5C12 10 10 13 10 17" />  <rect width="6" height="7" x="4" y="14" rx="3" />  <path d="M12 3.5C12 10 14 13 14 17" />  <rect width="6" height="7" x="14" y="14" rx="3" />  <path d="M7 4v6" />  <path d="M17 4v6" /></svg>'
        );
      case "floor-plan":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />  <path d="M9 3v7" />  <path d="M21 10h-7" />  <path d="M3 15h9" /></svg>'
        );
      case "floppy-disk-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />  <rect width="7" height="5" x="7" y="3" />  <circle cx="12" cy="14" r="2" /></svg>'
        );
      case "floppy-disk-rear":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />  <circle cx="12" cy="12" r="2" />  <path d="M12 21v-3" /></svg>'
        );
      case "floppy-disk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 3v5h8" />  <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />  <path d="M17 21v-8H7v8" /></svg>'
        );
      case "floppy-disks-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10l4 4v10a2 2 0 0 1-2 2Z" />  <rect width="7" height="4" x="10" y="2" />  <circle cx="14" cy="12" r="2" />  <path d="M18 22H4a2 2 0 0 1-2-2V6" /></svg>'
        );
      case "floppy-disks-rear":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10l4 4v10a2 2 0 0 1-2 2Z" />  <circle cx="14" cy="10" r="2" />  <path d="M14 18v-2" />  <path d="M18 22H4a2 2 0 0 1-2-2V6" /></svg>'
        );
      case "floppy-disks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 4a2 2 0 0 1 2-2h10l4 4v10.2a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-2Z" />  <path d="M10 2v4h6" />  <path d="M18 18v-7h-8v7" />  <path d="M18 22H4a2 2 0 0 1-2-2V6" /></svg>'
        );
      case "flower-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" />  <circle cx="12" cy="8" r="2" />  <path d="M12 10v12" />  <path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z" />  <path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z" /></svg>'
        );
      case "flower-lotus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20c0-5.5-4.5-10-10-10 0 5.5 4.5 10 10 10" />  <path d="M9.7 8.3c-1.8-2-3.8-3.1-3.8-3.1s-.8 2.5-.5 5.4" />  <path d="M15 12.9V12c0-4.4-3-8-3-8s-3 3.6-3 8v.9" />  <path d="M18.6 10.6c.3-2.9-.5-5.4-.5-5.4s-2 1-3.8 3.1" />  <path d="M12 20c5.5 0 10-4.5 10-10-5.5 0-10 4.5-10 10" /></svg>'
        );
      case "flower-pot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 8h1" />  <path d="M12 5v1" />  <path d="M15 8h-1" />  <circle cx="12" cy="8" r="2" />  <path d="M12 11a3 3 0 1 1-3-3 3 3 0 1 1 3-3 3 3 0 1 1 3 3 3 3 0 1 1-3 3" />  <path d="M12 10v8" />  <path d="m15 18-1 4h-4l-1-4" />  <path d="M8 18h8" /></svg>'
        );
      case "flower-rose-single":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 9.52a4.04 4.04 0 1 1 2-3.47" />  <circle cx="17" cy="7.8" r="2" />  <path d="m14 2.5-2 1.3a6 6 0 1 0 6 10.4l2-1.2a4 4 0 0 0-4-6.95" />  <path d="M9.77 12C4 15 2 22 2 22" />  <path d="M13 20s-5 3-9.2-2c0 0 5.2-3 9.2 2" /></svg>'
        );
      case "flower-rose":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 6a4 4 0 1 1-2-3.46" />  <circle cx="12" cy="6" r="2" />  <path d="M10 6a4 4 0 0 1 8 0v2A6 6 0 0 1 6 8V6" />  <path d="M12 14v8" />  <path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5" />  <path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5" /></svg>'
        );
      case "flower-stem":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 8h1" />  <path d="M12 5v1" />  <path d="M15 8h-1" />  <circle cx="12" cy="8" r="2" />  <path d="M12 11a3 3 0 1 1-3-3 3 3 0 1 1 3-3 3 3 0 1 1 3 3 3 3 0 1 1-3 3" />  <path d="M12 10v12" />  <path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5" />  <path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5" /></svg>'
        );
      case "flower-tulip":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7c-2-3.2-6-4-6-4v5c0 3.3 2.7 6 6 6v8" />  <path d="M9.5 4.5C10 3 12 2 12 2s2 1 2.5 2.5" />  <path d="M12 14c3.3 0 6-2.7 6-6V3c-6.2.9-10.8 11-6 11" />  <path d="M12 22c-4.2 0-7-1.7-7-5 4.2 0 7 1.7 7 5" />  <path d="M12 22c4.2 0 7-1.7 7-5-4.2 0-7 1.7-7 5" /></svg>'
        );
      case "flower":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="3" />  <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />  <path d="M12 7.5V9" />  <path d="M7.5 12H9" />  <path d="M16.5 12H15" />  <path d="M12 16.5V15" />  <path d="m8 8 1.88 1.88" />  <path d="M14.12 9.88 16 8" />  <path d="m8 16 1.88-1.88" />  <path d="M14.12 14.12 16 16" /></svg>'
        );
      case "focus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="3" />  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>'
        );
      case "fold-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12h6" />  <path d="M22 12h-6" />  <path d="M12 2v2" />  <path d="M12 8v2" />  <path d="M12 14v2" />  <path d="M12 20v2" />  <path d="m19 9-3 3 3 3" />  <path d="m5 15 3-3-3-3" /></svg>'
        );
      case "fold-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22v-6" />  <path d="M12 8V2" />  <path d="M4 12H2" />  <path d="M10 12H8" />  <path d="M16 12h-2" />  <path d="M22 12h-2" />  <path d="m15 19-3-3-3 3" />  <path d="m15 5-3 3-3-3" /></svg>'
        );
      case "folder-archive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="15" cy="19" r="2" />  <path d="M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1" />  <path d="M15 11v-1" />  <path d="M15 17v-2" /></svg>'
        );
      case "folder-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="m9 13 2 2 4-4" /></svg>'
        );
      case "folder-clock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 14v2.2l1.6 1" />  <path d="M7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2" />  <circle cx="16" cy="16" r="6" /></svg>'
        );
      case "folder-closed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="M2 10h20" /></svg>'
        );
      case "folder-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10.5 8 13l2 2.5" />  <path d="m14 10.5 2 2.5-2 2.5" />  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>'
        );
      case "folder-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3" />  <path d="m14.305 19.53.923-.382" />  <path d="m15.228 16.852-.923-.383" />  <path d="m16.852 15.228-.383-.923" />  <path d="m16.852 20.772-.383.924" />  <path d="m19.148 15.228.383-.923" />  <path d="m19.53 21.696-.382-.924" />  <path d="m20.772 16.852.924-.383" />  <path d="m20.772 19.148.924.383" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "folder-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />  <circle cx="12" cy="13" r="1" /></svg>'
        );
      case "folder-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="M12 10v6" />  <path d="m15 13-3 3-3-3" /></svg>'
        );
      case "folder-git-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />  <circle cx="13" cy="12" r="2" />  <path d="M18 19c-2.8 0-5-2.2-5-5v8" />  <circle cx="20" cy="19" r="2" /></svg>'
        );
      case "folder-git":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="13" r="2" />  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="M14 13h3" />  <path d="M7 13h3" /></svg>'
        );
      case "folder-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.638 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v3.417" />  <path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z" /></svg>'
        );
      case "folder-input":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />  <path d="M2 13h10" />  <path d="m9 16 3-3-3-3" /></svg>'
        );
      case "folder-kanban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />  <path d="M8 10v4" />  <path d="M12 10v2" />  <path d="M16 10v6" /></svg>'
        );
      case "folder-key":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="16" cy="20" r="2" />  <path d="M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2" />  <path d="m22 14-4.5 4.5" />  <path d="m21 15 1 1" /></svg>'
        );
      case "folder-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="5" x="14" y="17" rx="1" />  <path d="M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5" />  <path d="M20 17v-2a2 2 0 1 0-4 0v2" /></svg>'
        );
      case "folder-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 13h6" />  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>'
        );
      case "folder-open-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />  <circle cx="14" cy="15" r="1" /></svg>'
        );
      case "folder-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" /></svg>'
        );
      case "folder-output":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 7.5V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.5" />  <path d="M2 13h10" />  <path d="m5 10-3 3 3 3" /></svg>'
        );
      case "folder-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5" />  <path d="M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>'
        );
      case "folder-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10v6" />  <path d="M9 13h6" />  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>'
        );
      case "folder-root":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />  <circle cx="12" cy="13" r="2" />  <path d="M12 15v5" /></svg>'
        );
      case "folder-search-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11.5" cy="12.5" r="2.5" />  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="M13.3 14.3 15 16" /></svg>'
        );
      case "folder-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1" />  <path d="m21 21-1.9-1.9" />  <circle cx="17" cy="17" r="3" /></svg>'
        );
      case "folder-symlink":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9.35V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7" />  <path d="m8 16 3-3-3-3" /></svg>'
        );
      case "folder-sync":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5" />  <path d="M12 10v4h4" />  <path d="m12 14 1.535-1.605a5 5 0 0 1 8 1.5" />  <path d="M22 22v-4h-4" />  <path d="m22 18-1.535 1.605a5 5 0 0 1-8-1.5" /></svg>'
        );
      case "folder-tree":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />  <path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />  <path d="M3 5a2 2 0 0 0 2 2h3" />  <path d="M3 3v13a2 2 0 0 0 2 2h3" /></svg>'
        );
      case "folder-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="M12 10v6" />  <path d="m9 13 3-3 3 3" /></svg>'
        );
      case "folder-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />  <path d="m9.5 10.5 5 5" />  <path d="m14.5 10.5-5 5" /></svg>'
        );
      case "folder":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>'
        );
      case "folders":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 1.2.6l.6.8a1.5 1.5 0 0 0 1.2.6z" />  <path d="M3 8.268a2 2 0 0 0-1 1.738V19a2 2 0 0 0 2 2h11a2 2 0 0 0 1.732-1" /></svg>'
        );
      case "football-goal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.7 2.3c-.2-.2-.9-.4-1.7-.3a4.6 4.6 0 0 0-3.7 5.7c.3.2.9.4 1.7.3a4.6 4.6 0 0 0 3.7-5.7" />  <path d="M20 2v9c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V2" />  <path d="M14 16a4 4 0 0 0-4-4" />  <path d="M13 16c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-4c0-.6-.4-1-1-1Z" /></svg>'
        );
      case "football-helmet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 14h.01" />  <path d="M21.6 9c-1.3-4-5.1-7-9.6-7C6.5 2 2 6.5 2 12c0 2.6 1 5 3 7 1.4 1.3 3.6 1.4 4.9 0 .7-.7 1-1.6 1-2.5V13c0-1.7 1.3-3 3-3h6.8c.7 0 1-.4.9-1z" />  <path d="M22 18H10.7" />  <path d="M11 14h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2c-2.8 0-5-2.2-5-5v-3" /></svg>'
        );
      case "football":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 3c-.8-.8-3-1.2-5.8-.9s-6 1.6-8.8 4.4-4 6-4.4 8.8.1 5 .9 5.8 3 1.2 5.8.9 6-1.6 8.8-4.4 4-6 4.4-8.8-.1-5-.9-5.8" />  <path d="M6.4 17.6 9 15" />  <path d="M8.7 21.9c-.8-3.3-3.4-5.8-6.7-6.7" />  <path d="m8.1 13.9 2 2" />  <path d="m11 11 2 2" />  <path d="m13.9 8.1 2 2" />  <path d="M15.3 2.1c.8 3.3 3.4 5.8 6.6 6.6" />  <path d="m15 9 2.6-2.6" /></svg>'
        );
      case "footprints":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />  <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />  <path d="M16 17h4" />  <path d="M4 13h4" /></svg>'
        );
      case "fork-knife-crossed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />  <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />  <path d="m2.1 21.8 6.4-6.3" />  <path d="m19 5-7 7" /></svg>'
        );
      case "fork-knife":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />  <path d="M7 2v20" />  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>'
        );
      case "forklift":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12H5a2 2 0 0 0-2 2v5" />  <circle cx="13" cy="19" r="2" />  <circle cx="5" cy="19" r="2" />  <path d="M8 19h3m5-17v17h6M6 12V7c0-1.1.9-2 2-2h3l5 5" /></svg>'
        );
      case "forward":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 17 5-5-5-5" />  <path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>'
        );
      case "fox-face-tail":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.9 8.3C20.6 7 21 5.6 21 4c0-.6-.4-1-1-1-2.3 0-4.3.8-5.9 2.2a14.92 14.92 0 0 0-4.2 0A8.78 8.78 0 0 0 4 3c-.6 0-1 .4-1 1 0 1.6.4 3 1.1 4.3-.6.7-1.1 1.4-1.4 2.2C4 13 11 16 12 16s8-3 9.3-5.5c-.3-.8-.8-1.5-1.4-2.2" />  <path d="M9 9v.5" />  <path d="M13 13h-2" />  <path d="M12 16v-3" />  <path d="M15 9v.5" />  <path d="M6.3 20.5A6.87 6.87 0 0 0 9 15H2.2c.8 4 4.9 7 9.8 7 5.5 0 10-3.8 10-8.5 0-1.1-.2-2.1-.7-3" /></svg>'
        );
      case "frame":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="22" x2="2" y1="6" y2="6" />  <line x1="22" x2="2" y1="18" y2="18" />  <line x1="6" x2="6" y1="2" y2="22" />  <line x1="18" x2="18" y1="2" y2="22" /></svg>'
        );
      case "framer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 16V9h14V2H5l14 14h-7m-7 0 7 7v-7m-7 0h7" /></svg>'
        );
      case "frog-face":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 7h.01" />  <circle cx="6" cy="7" r="4" />  <path d="M14.4 5.3a10 10 0 0 0-4.8 0" />  <circle cx="18" cy="7" r="4" />  <path d="M18 7h.01" />  <path d="M22 13.5C22 16 17.5 18 12 18S2 16 2 13.5" />  <path d="M10 14h.01" />  <path d="M14 14h.01" />  <path d="M3.1 9.75A7 7 0 0 0 2 13.5C2 18.2 6.5 22 12 22s10-3.8 10-8.5a7 7 0 0 0-1.1-3.75" /></svg>'
        );
      case "frown":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M16 16s-1.5-2-4-2-4 2-4 2" />  <line x1="9" x2="9.01" y1="9" y2="9" />  <line x1="15" x2="15.01" y1="9" y2="9" /></svg>'
        );
      case "fruit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m10 10 4-3" />  <path d="m10 7 4 3" /></svg>'
        );
      case "fuel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="3" x2="15" y1="22" y2="22" />  <line x1="4" x2="14" y1="9" y2="9" />  <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />  <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></svg>'
        );
      case "fullscreen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <rect width="10" height="8" x="7" y="8" rx="1" /></svg>'
        );
      case "funnel-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.354 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14v6a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341l1.218-1.348" />  <path d="M16 6h6" />  <path d="M19 3v6" /></svg>'
        );
      case "funnel-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.531 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14v6a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341l.427-.473" />  <path d="m16.5 3.5 5 5" />  <path d="m21.5 3.5-5 5" /></svg>'
        );
      case "funnel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" /></svg>'
        );
      case "gallery-horizontal-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 7v10" />  <path d="M6 5v14" />  <rect width="12" height="18" x="10" y="3" rx="2" /></svg>'
        );
      case "gallery-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 3v18" />  <rect width="12" height="18" x="6" y="3" rx="2" />  <path d="M22 3v18" /></svg>'
        );
      case "gallery-thumbnails":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="14" x="3" y="3" rx="2" />  <path d="M4 21h1" />  <path d="M9 21h1" />  <path d="M14 21h1" />  <path d="M19 21h1" /></svg>'
        );
      case "gallery-vertical-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 2h10" />  <path d="M5 6h14" />  <rect width="18" height="12" x="3" y="10" rx="2" /></svg>'
        );
      case "gallery-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 2h18" />  <rect width="18" height="12" x="3" y="6" rx="2" />  <path d="M3 22h18" /></svg>'
        );
      case "gamepad-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="6" x2="10" y1="11" y2="11" />  <line x1="8" x2="8" y1="9" y2="13" />  <line x1="15" x2="15.01" y1="12" y2="12" />  <line x1="18" x2="18.01" y1="10" y2="10" />  <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" /></svg>'
        );
      case "gamepad":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="6" x2="10" y1="12" y2="12" />  <line x1="8" x2="8" y1="10" y2="14" />  <line x1="15" x2="15.01" y1="13" y2="13" />  <line x1="18" x2="18.01" y1="11" y2="11" />  <rect width="20" height="12" x="2" y="6" rx="2" /></svg>'
        );
      case "garlic":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v1c0 1-.5 2-1.4 2.5L5.1 9.1A7 7 0 0 0 9 22h6a7 7 0 0 0 3.8-12.8l-2.5-1.6A3.32 3.32 0 0 1 15 5Z" />  <path d="M9 5c0 4-2 4-2 9 0 4.4 2.2 8 5 8s5-3.6 5-8c0-5-2-5-2-9" /></svg>'
        );
      case "gauge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 14 4-4" />  <path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>'
        );
      case "gavel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" />  <path d="m16 16 6-6" />  <path d="m21.5 10.5-8-8" />  <path d="m8 8 6-6" />  <path d="m8.5 7.5 8 8" /></svg>'
        );
      case "gearbox-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 7v10" />  <path d="M12 7v10" />  <path d="M17 7v5H7" /></svg>'
        );
      case "gearbox":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 4v16" />  <path d="M12 4v16" />  <path d="M19 4v8H5" /></svg>'
        );
      case "gem-ring":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.2 8.1 16 4.4 14.4 2H9.6L8 4.4l2.8 3.7" />  <circle cx="12" cy="15" r="7" /></svg>'
        );
      case "gem":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />  <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />  <path d="M2 9h20" /></svg>'
        );
      case "georgian-lari":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.5 21a7.5 7.5 0 1 1 7.35-9" />  <path d="M13 12V3" />  <path d="M4 21h16" />  <path d="M9 12V3" /></svg>'
        );
      case "ghost":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 10h.01" />  <path d="M15 10h.01" />  <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg>'
        );
      case "gift":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="3" y="8" width="18" height="4" rx="1" />  <path d="M12 8v13" />  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></svg>'
        );
      case "git-branch-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 3v12" />  <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />  <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />  <path d="M15 6a9 9 0 0 0-9 9" />  <path d="M18 15v6" />  <path d="M21 18h-6" /></svg>'
        );
      case "git-branch":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="6" x2="6" y1="3" y2="15" />  <circle cx="18" cy="6" r="3" />  <circle cx="6" cy="18" r="3" />  <path d="M18 9a9 9 0 0 1-9 9" /></svg>'
        );
      case "git-commit-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="3" />  <line x1="3" x2="9" y1="12" y2="12" />  <line x1="15" x2="21" y1="12" y2="12" /></svg>'
        );
      case "git-commit-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v6" />  <circle cx="12" cy="12" r="3" />  <path d="M12 15v6" /></svg>'
        );
      case "git-compare-arrows":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="5" cy="6" r="3" />  <path d="M12 6h5a2 2 0 0 1 2 2v7" />  <path d="m15 9-3-3 3-3" />  <circle cx="19" cy="18" r="3" />  <path d="M12 18H7a2 2 0 0 1-2-2V9" />  <path d="m9 15 3 3-3 3" /></svg>'
        );
      case "git-compare":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18" cy="18" r="3" />  <circle cx="6" cy="6" r="3" />  <path d="M13 6h3a2 2 0 0 1 2 2v7" />  <path d="M11 18H8a2 2 0 0 1-2-2V9" /></svg>'
        );
      case "git-fork":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="18" r="3" />  <circle cx="6" cy="6" r="3" />  <circle cx="18" cy="6" r="3" />  <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />  <path d="M12 12v3" /></svg>'
        );
      case "git-graph":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="5" cy="6" r="3" />  <path d="M5 9v6" />  <circle cx="5" cy="18" r="3" />  <path d="M12 3v18" />  <circle cx="19" cy="6" r="3" />  <path d="M16 15.7A9 9 0 0 0 19 9" /></svg>'
        );
      case "git-merge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18" cy="18" r="3" />  <circle cx="6" cy="6" r="3" />  <path d="M6 21V9a9 9 0 0 0 9 9" /></svg>'
        );
      case "git-pull-request-arrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="5" cy="6" r="3" />  <path d="M5 9v12" />  <circle cx="19" cy="18" r="3" />  <path d="m15 9-3-3 3-3" />  <path d="M12 6h5a2 2 0 0 1 2 2v7" /></svg>'
        );
      case "git-pull-request-closed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="6" r="3" />  <path d="M6 9v12" />  <path d="m21 3-6 6" />  <path d="m21 9-6-6" />  <path d="M18 11.5V15" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "git-pull-request-create-arrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="5" cy="6" r="3" />  <path d="M5 9v12" />  <path d="m15 9-3-3 3-3" />  <path d="M12 6h5a2 2 0 0 1 2 2v3" />  <path d="M19 15v6" />  <path d="M22 18h-6" /></svg>'
        );
      case "git-pull-request-create":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="6" r="3" />  <path d="M6 9v12" />  <path d="M13 6h3a2 2 0 0 1 2 2v3" />  <path d="M18 15v6" />  <path d="M21 18h-6" /></svg>'
        );
      case "git-pull-request-draft":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18" cy="18" r="3" />  <circle cx="6" cy="6" r="3" />  <path d="M18 6V5" />  <path d="M18 11v-1" />  <line x1="6" x2="6" y1="9" y2="21" /></svg>'
        );
      case "git-pull-request":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18" cy="18" r="3" />  <circle cx="6" cy="6" r="3" />  <path d="M13 6h3a2 2 0 0 1 2 2v7" />  <line x1="6" x2="6" y1="9" y2="21" /></svg>'
        );
      case "github":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />  <path d="M9 18c-4.51 2-5-2-7-2" /></svg>'
        );
      case "gitlab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.18.38.38 0 0 0-.26-.08.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.69-6.88a.71.71 0 0 0 .31-.83Z" /></svg>'
        );
      case "glass-water":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" />  <path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" /></svg>'
        );
      case "glasses-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2.2 13.1 3.1-6.4C5.8 5.7 6.8 5 8 5" />  <rect width="8" height="6" x="2" y="12" rx="2" />  <path d="M14 15a2 2 0 0 0-4 0" />  <rect width="8" height="6" x="14" y="12" rx="2" />  <path d="m21.8 13.1-3.1-6.4C18.2 5.7 17.2 5 16 5" /></svg>'
        );
      case "glasses-sun":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2.16 14.2 3.1-7.4C5.7 5.8 6.8 5 8 5" />  <path d="M4 13a2 2 0 0 0-2 2v1c0 1.7 1.3 3 3 3h1c3.3 0 6-2.7 6-6 0 3.3 2.7 6 6 6h1c1.7 0 3-1.3 3-3v-1a2 2 0 0 0-2-2Z" />  <path d="m21.83 14.2-3.1-7.4C18.3 5.8 17.2 5 16 5" /></svg>'
        );
      case "glasses":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="15" r="4" />  <circle cx="18" cy="15" r="4" />  <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />  <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" />  <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2" /></svg>'
        );
      case "globe-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.686 15A14.5 14.5 0 0 1 12 22a14.5 14.5 0 0 1 0-20 10 10 0 1 0 9.542 13" />  <path d="M2 12h8.5" />  <path d="M20 6V4a2 2 0 1 0-4 0v2" />  <rect width="8" height="5" x="14" y="6" rx="1" /></svg>'
        );
      case "globe":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />  <path d="M2 12h20" /></svg>'
        );
      case "goal-net":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14" />  <path d="M8 8v12" />  <path d="M12 8v12" />  <path d="M16 8v12" />  <path d="M6 10h12" />  <path d="M6 14h12" />  <path d="M6 18h12" /></svg>'
        );
      case "goal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13V2l8 4-8 4" />  <path d="M20.561 10.222a9 9 0 1 1-12.55-5.29" />  <path d="M8.002 9.997a5 5 0 1 0 8.9 2.02" /></svg>'
        );
      case "goblet-crack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2c-1.78 2.72-3 6.65-3 9a7 7 0 1 0 14 0c0-2.35-1.22-6.28-3-9Z" />  <path d="M12 18v4" />  <path d="M8 22h8" />  <path d="m13 11-1-1 2-2-3-3 3-3" /></svg>'
        );
      case "goblet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2c-1.78 2.72-3 6.65-3 9a7 7 0 1 0 14 0c0-2.35-1.22-6.28-3-9Z" />  <path d="M12 18v4" />  <path d="M8 22h8" />  <path d="M5 11c.84-.5 1.68-1 3.5-1 3.5 0 3.5 2 7 2 1.82 0 2.66-.5 3.5-1" /></svg>'
        );
      case "golf-driver":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="9" r="2" />  <path d="M6 11v2" />  <path d="m22 2-9.3 14.1c-.4.6-1 .9-1.7.9H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h2c1.6 0 3.1-.7 4.1-2.1l2.6-3.8" /></svg>'
        );
      case "gpu":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 21V3" />  <path d="M2 5h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.26" />  <path d="M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3" />  <circle cx="16" cy="11" r="2" />  <circle cx="8" cy="11" r="2" /></svg>'
        );
      case "graduation-cap":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />  <path d="M22 10v6" />  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>'
        );
      case "grape":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 5V2l-5.89 5.89" />  <circle cx="16.6" cy="15.89" r="3" />  <circle cx="8.11" cy="7.4" r="3" />  <circle cx="12.35" cy="11.65" r="3" />  <circle cx="13.91" cy="5.85" r="3" />  <circle cx="18.15" cy="10.09" r="3" />  <circle cx="6.56" cy="13.2" r="3" />  <circle cx="10.8" cy="17.44" r="3" />  <circle cx="5" cy="19" r="3" /></svg>'
        );
      case "grapes":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 5V2l-5.89 5.89" />  <circle cx="16.6" cy="15.89" r="3" />  <circle cx="8.11" cy="7.4" r="3" />  <circle cx="12.35" cy="11.65" r="3" />  <circle cx="13.91" cy="5.85" r="3" />  <circle cx="18.15" cy="10.09" r="3" />  <circle cx="6.56" cy="13.2" r="3" />  <circle cx="10.8" cy="17.44" r="3" />  <circle cx="5" cy="19" r="3" /></svg>'
        );
      case "grid-2x2-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />  <path d="m16 19 2 2 4-4" /></svg>'
        );
      case "grid-2x2-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />  <path d="M16 19h6" />  <path d="M19 22v-6" /></svg>'
        );
      case "grid-2x2-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />  <path d="m16 16 5 5" />  <path d="m16 21 5-5" /></svg>'
        );
      case "grid-2x2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v18" />  <path d="M3 12h18" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "grid-3x2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 3v18" />  <path d="M3 12h18" />  <path d="M9 3v18" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "grid-3x3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9h18" />  <path d="M3 15h18" />  <path d="M9 3v18" />  <path d="M15 3v18" /></svg>'
        );
      case "grid-lines-offset":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 3v18" />  <path d="M13 3v18" />  <path d="M3 11h18" />  <path d="M3 17h18" /></svg>'
        );
      case "grid-lines":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 3v18" />  <path d="M15 3v18" />  <path d="M3 9h18" />  <path d="M3 15h18" /></svg>'
        );
      case "grip-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="9" r="1" />  <circle cx="19" cy="9" r="1" />  <circle cx="5" cy="9" r="1" />  <circle cx="12" cy="15" r="1" />  <circle cx="19" cy="15" r="1" />  <circle cx="5" cy="15" r="1" /></svg>'
        );
      case "grip-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="9" cy="12" r="1" />  <circle cx="9" cy="5" r="1" />  <circle cx="9" cy="19" r="1" />  <circle cx="15" cy="12" r="1" />  <circle cx="15" cy="5" r="1" />  <circle cx="15" cy="19" r="1" /></svg>'
        );
      case "grip":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="5" r="1" />  <circle cx="19" cy="5" r="1" />  <circle cx="5" cy="5" r="1" />  <circle cx="12" cy="12" r="1" />  <circle cx="19" cy="12" r="1" />  <circle cx="5" cy="12" r="1" />  <circle cx="12" cy="19" r="1" />  <circle cx="19" cy="19" r="1" />  <circle cx="5" cy="19" r="1" /></svg>'
        );
      case "group":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5c0-1.1.9-2 2-2h2" />  <path d="M17 3h2c1.1 0 2 .9 2 2v2" />  <path d="M21 17v2c0 1.1-.9 2-2 2h-2" />  <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" />  <rect width="7" height="5" x="7" y="7" rx="1" />  <rect width="7" height="5" x="10" y="12" rx="1" /></svg>'
        );
      case "guitar":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11.9 12.1 4.514-4.514" />  <path d="M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z" />  <path d="m6 16 2 2" />  <path d="M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z" /></svg>'
        );
      case "hairdryer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="8" cy="8" r="2" />  <path d="M18 11s-7 3-10 3A6 6 0 0 1 8 2c3 0 10 3 10 3Z" />  <path d="m18 5 4-2v10l-4-2" />  <path d="m7 13.9.8 5.1c.1.5.6 1 1.2 1h2c.6 0 .9-.4.8-1l-.9-5.5" />  <path d="M11.64 18s3.3-2 7.3-2a2 2 0 0 1 0 4H17a2 2 0 0 0-2 2" /></svg>'
        );
      case "ham":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.144 21.144A7.274 10.445 45 1 0 2.856 10.856" />  <path d="M13.144 21.144A7.274 4.365 45 0 0 2.856 10.856a7.274 4.365 45 0 0 10.288 10.288" />  <path d="M16.565 10.435 18.6 8.4a2.501 2.501 0 1 0 1.65-4.65 2.5 2.5 0 1 0-4.66 1.66l-2.024 2.025" />  <path d="m8.5 16.5-1-1" /></svg>'
        );
      case "hamburger":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16H4a2 2 0 1 1 0-4h16a2 2 0 1 1 0 4h-4.25" />  <path d="M5 12a2 2 0 0 1-2-2 9 7 0 0 1 18 0 2 2 0 0 1-2 2" />  <path d="M5 16a2 2 0 0 0-2 2 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 2 2 0 0 0-2-2q0 0 0 0" />  <path d="m6.67 12 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" /></svg>'
        );
      case "hammer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" />  <path d="m18 15 4-4" />  <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" /></svg>'
        );
      case "hand-coins":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />  <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />  <path d="m2 16 6 6" />  <circle cx="16" cy="9" r="2.9" />  <circle cx="6" cy="5" r="3" /></svg>'
        );
      case "hand-fist":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0" />  <path d="M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5" />  <path d="M9 5A2 2 0 1 0 5 5V10" />  <path d="M9 7V4A2 2 0 1 1 13 4V7.268" /></svg>'
        );
      case "hand-grab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" />  <path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />  <path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" />  <path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />  <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" /></svg>'
        );
      case "hand-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />  <path d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95" />  <path d="m2 15 6 6" />  <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" /></svg>'
        );
      case "hand-helping":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" />  <path d="m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />  <path d="m2 13 6 6" /></svg>'
        );
      case "hand-metal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" />  <path d="M14 11V9a2 2 0 1 0-4 0v2" />  <path d="M10 10.5V5a2 2 0 1 0-4 0v9" />  <path d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5" /></svg>'
        );
      case "hand-platter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3V2" />  <path d="m15.4 17.4 3.2-2.8a2 2 0 1 1 2.8 2.9l-3.6 3.3c-.7.8-1.7 1.2-2.8 1.2h-4c-1.1 0-2.1-.4-2.8-1.2l-1.302-1.464A1 1 0 0 0 6.151 19H5" />  <path d="M2 14h12a2 2 0 0 1 0 4h-2" />  <path d="M4 10h16" />  <path d="M5 10a7 7 0 0 1 14 0" />  <path d="M5 14v6a1 1 0 0 1-1 1H2" /></svg>'
        );
      case "hand":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />  <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />  <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>'
        );
      case "handbag":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z" />  <path d="M8 11V6a4 4 0 0 1 8 0v5" /></svg>'
        );
      case "handshake":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 17 2 2a1 1 0 1 0 3-3" />  <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />  <path d="m21 3 1 11h-2" />  <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />  <path d="M3 4h8" /></svg>'
        );
      case "hard-drive-download":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v8" />  <path d="m16 6-4 4-4-4" />  <rect width="20" height="8" x="2" y="14" rx="2" />  <path d="M6 18h.01" />  <path d="M10 18h.01" /></svg>'
        );
      case "hard-drive-upload":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 6-4-4-4 4" />  <path d="M12 2v8" />  <rect width="20" height="8" x="2" y="14" rx="2" />  <path d="M6 18h.01" />  <path d="M10 18h.01" /></svg>'
        );
      case "hard-drive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="22" x2="2" y1="12" y2="12" />  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />  <line x1="6" x2="6.01" y1="16" y2="16" />  <line x1="10" x2="10.01" y1="16" y2="16" /></svg>'
        );
      case "hard-hat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />  <path d="M14 6a6 6 0 0 1 6 6v3" />  <path d="M4 15v-3a6 6 0 0 1 6-6" />  <rect x="2" y="15" width="20" height="4" rx="1" /></svg>'
        );
      case "hash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="4" x2="20" y1="9" y2="9" />  <line x1="4" x2="20" y1="15" y2="15" />  <line x1="10" x2="8" y1="3" y2="21" />  <line x1="16" x2="14" y1="3" y2="21" /></svg>'
        );
      case "hat-baseball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v1" />  <path d="M12 14c2.8 0 5.5.3 8 .9V12a8 8 0 0 0-16 0v2.9c2.5-.6 5.2-.9 8-.9" />  <path d="M9 14.1V10h6v4.1" />  <path d="M2.3 18A2 2 0 0 0 4 21h.4l1.6-.4a26.44 26.44 0 0 1 12 0l1.6.4h.4a2 2 0 0 0 1.7-3l-1.8-3.2a39.9 39.9 0 0 0-15.8 0Z" /></svg>'
        );
      case "hat-beanie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.4 6.2C6.7 6.9 4 10.1 4 14v1" />  <circle cx="12" cy="5" r="2" />  <path d="M20 15v-1c0-3.9-2.7-7.1-6.4-7.8" />  <rect width="20" height="5" x="2" y="15" rx="1" />  <path d="M6 15v5" />  <path d="M10 15v5" />  <path d="M14 15v5" />  <path d="M18 15v5" /></svg>'
        );
      case "hat-bowler":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 13c0 1.7 2.7 3 6 3s6-1.3 6-3v-3a6 6 0 0 0-12 0Z" />  <path d="M6 9c0 1.7 2.7 3 6 3s6-1.3 6-3" />  <path d="M6 9.2C3.6 10.3 2 12 2 14c0 3.3 4.5 6 10 6s10-2.7 10-6c0-2-1.6-3.7-4-4.8" /></svg>'
        );
      case "hat-chef":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 13.85A4 4 0 0 1 7.4 6a5 5 0 0 1 9.2 0 4 4 0 0 1 1.4 7.85V21H6Z" />  <path d="M6 17h12" /></svg>'
        );
      case "hat-glasses":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 18a2 2 0 0 0-4 0" />  <path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" />  <path d="M2 11h20" />  <circle cx="17" cy="18" r="3" />  <circle cx="7" cy="18" r="3" /></svg>'
        );
      case "hat-hard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 6.3c-3.4.9-6 4-6 7.7v2" />  <path d="M10 10V5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v5" />  <path d="M20 16v-2c0-3.7-2.6-6.8-6-7.7" />  <rect width="20" height="4" x="2" y="16" rx="1" /></svg>'
        );
      case "hat-top":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="5" rx="7" ry="3" />  <path d="M5 5c0 1 1 4 1 6v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-2 1-5 1-6" />  <path d="M18 11c0 1.7-2.7 3-6 3s-6-1.3-6-3" />  <path d="M6 11.2C3.6 12.3 2 14 2 16c0 3.3 4.5 6 10 6s10-2.7 10-6c0-2-1.6-3.7-4-4.8" /></svg>'
        );
      case "haze":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m5.2 6.2 1.4 1.4" />  <path d="M2 13h2" />  <path d="M20 13h2" />  <path d="m17.4 7.6 1.4-1.4" />  <path d="M22 17H2" />  <path d="M22 21H2" />  <path d="M16 13a4 4 0 0 0-8 0" />  <path d="M12 5V2.5" /></svg>'
        );
      case "hdmi-port":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1l2 2h12l2-2h1a1 1 0 0 0 1-1Z" />  <path d="M7.5 12h9" /></svg>'
        );
      case "heading-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h8" />  <path d="M4 18V6" />  <path d="M12 18V6" />  <path d="m17 12 3-2v8" /></svg>'
        );
      case "heading-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h8" />  <path d="M4 18V6" />  <path d="M12 18V6" />  <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" /></svg>'
        );
      case "heading-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h8" />  <path d="M4 18V6" />  <path d="M12 18V6" />  <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />  <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" /></svg>'
        );
      case "heading-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 18V6" />  <path d="M17 10v3a1 1 0 0 0 1 1h3" />  <path d="M21 10v8" />  <path d="M4 12h8" />  <path d="M4 18V6" /></svg>'
        );
      case "heading-5":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h8" />  <path d="M4 18V6" />  <path d="M12 18V6" />  <path d="M17 13v-3h4" />  <path d="M17 17.7c.4.2.8.3 1.3.3 1.5 0 2.7-1.1 2.7-2.5S19.8 13 18.3 13H17" /></svg>'
        );
      case "heading-6":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h8" />  <path d="M4 18V6" />  <path d="M12 18V6" />  <circle cx="19" cy="16" r="2" />  <path d="M20 10c-2 2-3 3.5-3 6" /></svg>'
        );
      case "heading-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M9 16V8" />  <path d="M9 12h6" />  <path d="M15 16V8" /></svg>'
        );
      case "heading-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 17V7" />  <path d="M8 12h8" />  <path d="M16 17V7" /></svg>'
        );
      case "heading":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 12h12" />  <path d="M6 20V4" />  <path d="M18 20V4" /></svg>'
        );
      case "headphone-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 14h-1.343" />  <path d="M9.128 3.47A9 9 0 0 1 21 12v3.343" />  <path d="m2 2 20 20" />  <path d="M20.414 20.414A2 2 0 0 1 19 21h-1a2 2 0 0 1-2-2v-3" />  <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 2.636-6.364" /></svg>'
        );
      case "headphones":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></svg>'
        );
      case "headset":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />  <path d="M21 16v2a4 4 0 0 1-4 4h-5" /></svg>'
        );
      case "heart-crack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.409 5.824c-.702.792-1.15 1.496-1.415 2.166l2.153 2.156a.5.5 0 0 1 0 .707l-2.293 2.293a.5.5 0 0 0 0 .707L12 15" />  <path d="M13.508 20.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.677.6.6 0 0 0 .818.001A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5z" /></svg>'
        );
      case "heart-handshake":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" /></svg>'
        );
      case "heart-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.876 18.99-1.368 1.323a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.244 1.572" />  <path d="M15 15h6" /></svg>'
        );
      case "heart-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 4.893a5.5 5.5 0 0 1 1.091.931.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 1.872-1.002 3.356-2.187 4.655" />  <path d="m16.967 16.967-3.459 3.346a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 2.747-4.761" />  <path d="m2 2 20 20" /></svg>'
        );
      case "heart-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.479 19.374-.971.939a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5a5.2 5.2 0 0 1-.219 1.49" />  <path d="M15 15h6" />  <path d="M18 12v6" /></svg>'
        );
      case "heart-pulse":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />  <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></svg>'
        );
      case "heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /></svg>'
        );
      case "heater":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 8c2-3-2-3 0-6" />  <path d="M15.5 8c2-3-2-3 0-6" />  <path d="M6 10h.01" />  <path d="M6 14h.01" />  <path d="M10 16v-4" />  <path d="M14 16v-4" />  <path d="M18 16v-4" />  <path d="M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" />  <path d="M5 20v2" />  <path d="M19 20v2" /></svg>'
        );
      case "hedgehog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 11 3 7.7 5.7 7l.1-2.8 2.7.6 1.3-2.6L12 4l2.2-1.8 1.3 2.6 2.7-.6.1 2.8 2.7.7-1.2 2.5L22 12l-2.2 1.8 1.2 2.5-3 .7" />  <path d="M10 17h.01" />  <path d="M3 16c2.8 0 5-2.2 5-5 3.3 0 6 2.7 6 6a4 4 0 0 0 4 4h-8c-1.1 0-2.6-.6-3.4-1.4L3 16v-1" /></svg>'
        );
      case "helmet-diving":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 17.9c1.5-.9 2.7-2.2 3.4-3.9h.8c.4 0 .8-.4.8-1V9c0-.6-.4-1-.8-1h-.8A7.92 7.92 0 0 0 15 3.6v-.8c0-.4-.4-.8-1-.8h-4c-.6 0-1 .4-1 .8v.8A7.92 7.92 0 0 0 4.6 8h-.8c-.4 0-.8.4-.8 1v4c0 .6.4 1 .8 1h.8c.7 1.7 1.9 3 3.4 3.9" />  <circle cx="12" cy="11" r="4" />  <path d="M8 11h8" />  <path d="M12 7v8" />  <path d="M6.7 17c-1 .6-1.7 1.2-1.7 2 0 1.7 3.1 3 7 3s7-1.3 7-3c0-.8-.7-1.4-1.7-2" /></svg>'
        );
      case "hexagon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>'
        );
      case "hexagons-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 4.4a2 2 0 0 0-1 1.73v4.37l-4 2.4a2 2 0 0 0-1 1.73v3.27a2 2 0 0 0 .97 1.68L6 21.4a2 2 0 0 0 2.03-.02L12 19l4 2.4a2 2 0 0 0 2.03-.02L21 19.6a2 2 0 0 0 1-1.73V14.6a2 2 0 0 0-.97-1.68L17 10.5V6.1a2 2 0 0 0-.97-1.68L13 2.6a2 2 0 0 0-2.03.02Z" />  <path d="m7 10.5 5 3 5-3" />  <path d="M12 13.5V19" /></svg>'
        );
      case "hexagons-7":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.3 4.3v3.9L2 10.1v3.8l3.3 1.9v3.9l3.4 1.9 3.3-1.9 3.3 1.9 3.4-1.9v-3.9l3.3-1.9v-3.8l-3.3-1.9V4.3l-3.4-1.9L12 4.3 8.7 2.4Z" />  <path d="M12 8.2V4.3" />  <path d="m18.7 8.2-3.4 1.9" />  <path d="m15.3 13.9 3.4 1.9" />  <path d="M12 19.7v-3.9" />  <path d="m8.7 13.9-3.4 1.9" />  <path d="m5.3 8.2 3.4 1.9" />  <path d="m8.7 13.9 3.3 1.9 3.3-1.9v-3.8L12 8.2l-3.3 1.9Z" /></svg>'
        );
      case "high-heel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 3c6 6 8.4 10.5 9.8 12 .9 1 2.5 1.3 3.7.6.3-.2.5-.3.7-.6.6.3 3.8 3.1 3.8 5 0 1-1 1-1 1h-7c-1 0-2-.5-2.6-1.5L10.1 17c-.9-1.6-2.2-3-3.7-4.2L4 11a5 5 0 0 1 0-8" />  <path d="m2.56 9.3.6 1.1C4.2 12.6 5 16.5 5 21" /></svg>'
        );
      case "highlighter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 11-6 6v3h9l3-3" />  <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></svg>'
        );
      case "history":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />  <path d="M3 3v5h5" />  <path d="M12 7v5l4 2" /></svg>'
        );
      case "hockey-mask":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12a10 10 0 1 0 20 0c0-4.1-.4-6.6-1.9-8.1S16.1 2 12 2s-6.6.4-8.1 1.9S2 7.9 2 12" />  <path d="M12 6h.01" />  <circle cx="8" cy="10.5" r="2" />  <circle cx="16" cy="10.5" r="2" />  <path d="M8.5 17h.01" />  <path d="M12 15h.01" />  <path d="M15.5 17h.01" /></svg>'
        );
      case "hockey":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="17" cy="19" r="3" />  <path d="M2.8 13a5.95 5.95 0 1 0 10.4 6l8.5-14a1.94 1.94 0 1 0-3.4-2L9.7 17a1.88 1.88 0 1 1-3.4-2 1.94 1.94 0 1 0-3.5-2" />  <path d="m20.6 6.8-3.3-2.1" />  <path d="m15.2 8.1 3.3 2.1" /></svg>'
        );
      case "hop-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.82 16.12c1.69.6 3.91.79 5.18.85.28.01.53-.09.7-.27" />  <path d="M11.14 20.57c.52.24 2.44 1.12 4.08 1.37.46.06.86-.25.9-.71.12-1.52-.3-3.43-.5-4.28" />  <path d="M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .7-.26" />  <path d="M17.99 5.52a20.83 20.83 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-1.17.1-2.5.02-3.9-.25" />  <path d="M20.57 11.14c.24.52 1.12 2.44 1.37 4.08.04.3-.08.59-.31.75" />  <path d="M4.93 4.93a10 10 0 0 0-.67 13.4c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.85.85 0 0 0 .48-.24" />  <path d="M5.52 17.99c1.05.95 2.91 2.42 4.5 3.15a.8.8 0 0 0 1.13-.68c.2-2.34-.33-5.3-1.57-8.28" />  <path d="M8.35 2.68a10 10 0 0 1 9.98 1.58c.43.35.4.96-.12 1.17-1.5.6-4.3.98-6.07 1.05" />  <path d="m2 2 20 20" /></svg>'
        );
      case "hop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.82 16.12c1.69.6 3.91.79 5.18.85.55.03 1-.42.97-.97-.06-1.27-.26-3.5-.85-5.18" />  <path d="M11.5 6.5c1.64 0 5-.38 6.71-1.07.52-.2.55-.82.12-1.17A10 10 0 0 0 4.26 18.33c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.88.88 0 0 0 .73-.74c.3-2.14-.15-3.5-.61-4.88" />  <path d="M15.62 16.95c.2.85.62 2.76.5 4.28a.77.77 0 0 1-.9.7 16.64 16.64 0 0 1-4.08-1.36" />  <path d="M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .96-.96 17.68 17.68 0 0 0-.9-4.87" />  <path d="M16.94 15.62c.86.2 2.77.62 4.29.5a.77.77 0 0 0 .7-.9 16.64 16.64 0 0 0-1.36-4.08" />  <path d="M17.99 5.52a20.82 20.82 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-2.33.2-5.3-.32-8.27-1.57" />  <path d="M4.93 4.93 3 3a.7.7 0 0 1 0-1" />  <path d="M9.58 12.18c1.24 2.98 1.77 5.95 1.57 8.28a.8.8 0 0 1-1.13.68 20.82 20.82 0 0 1-4.5-3.15" /></svg>'
        );
      case "horse-head":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.5 12H11" />  <path d="M5 15a4 4 0 0 0 4 4h7.8l.3.3a3 3 0 0 0 4-4.46L12 7c0-3-1-5-1-5S8 3 8 7c-4 1-6 3-6 3" />  <path d="M6.14 17.8S4 19 2 22" /></svg>'
        );
      case "hospital":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7v4" />  <path d="M14 21v-3a2 2 0 0 0-4 0v3" />  <path d="M14 9h-4" />  <path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />  <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" /></svg>'
        );
      case "hot-dog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.1 3.5a4 4 0 0 0-5.9-.3l-8 8a4 4 0 0 0 .2 5.9" />  <path d="M6.9 20.7a4.07 4.07 0 0 0 5.9.1l8-8a4 4 0 0 0-.1-5.9" />  <path d="M21.3 6.3a2.5 2.5 0 0 0-3.5-3.5l-15 15a2.5 2.5 0 0 0 3.5 3.5Z" /></svg>'
        );
      case "hotel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 22v-6.57" />  <path d="M12 11h.01" />  <path d="M12 7h.01" />  <path d="M14 15.43V22" />  <path d="M15 16a5 5 0 0 0-6 0" />  <path d="M16 11h.01" />  <path d="M16 7h.01" />  <path d="M8 11h.01" />  <path d="M8 7h.01" />  <rect x="4" y="2" width="16" height="20" rx="2" /></svg>'
        );
      case "hourglass":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 22h14" />  <path d="M5 2h14" />  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>'
        );
      case "house-manor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 6V2H5v4" />  <path d="M19 6V2h-4v4" />  <rect width="20" height="16" x="2" y="6" rx="2" />  <path d="M2 12h4" />  <path d="M6 22V12l5.5-6" />  <path d="m12.5 6 5.5 6v10" />  <path d="M18 12h4" />  <path d="M12 11h.01" />  <path d="M10 22v-5a2 2 0 1 1 4 0v5" /></svg>'
        );
      case "house-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 15.3V9l-9-7-2.4 1.9" />  <path d="m2 2 20 20" />  <path d="M6.4 6.4 3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 1.8-1.2" />  <path d="M12 12H9v10" />  <path d="M15 22v-7" /></svg>'
        );
      case "house-plug":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12V8.964" />  <path d="M14 12V8.964" />  <path d="M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z" />  <path d="M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2" /></svg>'
        );
      case "house-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.662 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v2.475" />  <path d="M14.959 12.717A1 1 0 0 0 14 12h-4a1 1 0 0 0-1 1v8" />  <path d="M15 18h6" />  <path d="M18 15v6" /></svg>'
        );
      case "house-roof-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 6.8 6.6 6.6a2 2 0 0 0 2.8-2.8l-8-8c-.8-.8-2-.8-2.8 0L9.2 4" />  <path d="m2 2 20 20" />  <path d="m6.6 6.6-4 4a2 2 0 0 0 2.8 2.8l4-4" />  <path d="M14 22v-6a2 2 0 0 0-4 0v6" />  <path d="M4 14v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /></svg>'
        );
      case "house-roof":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.6 10.4a2.12 2.12 0 1 0 3.02 2.98L12 7l6.4 6.4a2.12 2.12 0 1 0 2.979-3.021L13.7 2.7a2.4 2.4 0 0 0-3.404.004Z" />  <path d="M20 14v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />  <path d="M14 22v-6a2 2 0 0 0-4 0v6" /></svg>'
        );
      case "house-wifi":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9.5 13.866a4 4 0 0 1 5 .01" />  <path d="M12 17h.01" />  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />  <path d="M7 10.754a8 8 0 0 1 10 0" /></svg>'
        );
      case "house":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />  <path d="M9 22V12h6v10" /></svg>'
        );
      case "houses":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 17H3c-.6 0-1-.4-1-1V8.5L8 4l10 7.5V19c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1v-7.5L16 4l6 4.5V16c0 .6-.4 1-1 1h-3" />  <path d="M10 20v-6h4v6" /></svg>'
        );
      case "ice-cream-bowl":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17c5 0 8-2.69 8-6H4c0 3.31 3 6 8 6m-4 4h8m-4-3v3M5.14 11a3.5 3.5 0 1 1 6.71 0" />  <path d="M12.14 11a3.5 3.5 0 1 1 6.71 0" />  <path d="M15.5 6.5a3.5 3.5 0 1 0-7 0" /></svg>'
        );
      case "ice-cream-cone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11" />  <path d="M17 7A5 5 0 0 0 7 7" />  <path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" /></svg>'
        );
      case "ice-hockey":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 4v4c0 1.1-1.8 2-4 2s-4-.9-4-2V4" />  <ellipse cx="6" cy="4" rx="4" ry="2" />  <path d="M4 17a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h4a6 6 0 0 0 5.2-3l8.5-14a1.94 1.94 0 1 0-3.4-2l-7.9 13c-.4.6-1 1-1.7 1Z" />  <path d="m20.6 6.8-3.3-2.1" />  <path d="m15.2 8.1 3.3 2.1" />  <path d="M6 17v5" /></svg>'
        );
      case "ice-skate":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 2v9" />  <path d="M11 7 8 8" />  <path d="M11 3 4 5v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2 3.08 3.08 0 0 0-1.8-2.8L11 11l-3 1" />  <path d="M7 18v4" />  <path d="M15 18v4" />  <path d="M4 22h12c2.1 0 3.9-1.1 5-2.7" /></svg>'
        );
      case "id-card-lanyard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.5 8h-3" />  <path d="m15 2-1 2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />  <path d="M16.899 22A5 5 0 0 0 7.1 22" />  <path d="m9 2 3 6" />  <circle cx="12" cy="15" r="3" /></svg>'
        );
      case "id-card":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 10h2" />  <path d="M16 14h2" />  <path d="M6.17 15a3 3 0 0 1 5.66 0" />  <circle cx="9" cy="11" r="2" />  <rect x="2" y="5" width="20" height="14" rx="2" /></svg>'
        );
      case "igloo":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 20.2c2.4-.7 4-1.9 4-3.2v-5a10 10 0 1 0-20 0v5c0 1.3 1.6 2.5 4 3.2" />  <path d="M6.5 3.65C7.5 5 9.6 6 12 6s4.5-1 5.5-2.35" />  <path d="M10.1 5.8c-1 .9-1.8 2.6-2 4.6" />  <path d="M15.9 10.4c-.3-2-1-3.6-2-4.6" />  <path d="M3.3 7.1C5.3 9.5 8.5 11 12 11c3.5 0 6.7-1.5 8.7-3.9" />  <path d="M2 12c.9 1.2 2.4 2.4 4.3 3.1" />  <path d="M6 21c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-4a6 6 0 1 0-12 0Z" />  <path d="M17.7 15.1c1.9-.7 3.4-1.9 4.3-3.1" />  <path d="M10 22v-5a2 2 0 1 1 4 0v5" /></svg>'
        );
      case "image-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />  <path d="m14 19 3 3v-5.5" />  <path d="m17 22 3-3" />  <circle cx="9" cy="9" r="2" /></svg>'
        );
      case "image-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />  <line x1="16" x2="22" y1="5" y2="5" />  <circle cx="9" cy="9" r="2" />  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>'
        );
      case "image-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="2" x2="22" y1="2" y2="22" />  <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />  <line x1="13.5" x2="6" y1="13.5" y2="21" />  <line x1="18" x2="21" y1="12" y2="15" />  <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" />  <path d="M21 15V5a2 2 0 0 0-2-2H9" /></svg>'
        );
      case "image-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 15.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z" />  <path d="M21 12.17V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />  <path d="m6 21 5-5" />  <circle cx="9" cy="9" r="2" /></svg>'
        );
      case "image-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 5h6" />  <path d="M19 2v6" />  <path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" />  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />  <circle cx="9" cy="9" r="2" /></svg>'
        );
      case "image-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />  <path d="m14 19.5 3-3 3 3" />  <path d="M17 22v-5.5" />  <circle cx="9" cy="9" r="2" /></svg>'
        );
      case "image-upscale":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3h5v5" />  <path d="M17 21h2a2 2 0 0 0 2-2" />  <path d="M21 12v3" />  <path d="m21 3-5 5" />  <path d="M3 7V5a2 2 0 0 1 2-2" />  <path d="m5 21 4.144-4.144a1.21 1.21 0 0 1 1.712 0L13 19" />  <path d="M9 3h3" />  <rect x="3" y="11" width="10" height="10" rx="1" /></svg>'
        );
      case "image":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <circle cx="9" cy="9" r="2" />  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>'
        );
      case "images":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16" />  <path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2" />  <circle cx="13" cy="7" r="1" fill="currentColor" />  <rect x="8" y="2" width="14" height="14" rx="2" /></svg>'
        );
      case "import":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v12" />  <path d="m8 11 4 4 4-4" />  <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" /></svg>'
        );
      case "inbox":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>'
        );
      case "indent-decrease":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12H11" />  <path d="M21 18H11" />  <path d="M21 6H11" />  <path d="m7 8-4 4 4 4" /></svg>'
        );
      case "indent-increase":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12H11" />  <path d="M21 18H11" />  <path d="M21 6H11" />  <path d="m3 8 4 4-4 4" /></svg>'
        );
      case "indian-rupee-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M9 11h6.5" />  <path d="M15.5 7H9a4 4 0 0 1 0 8l3 3" /></svg>'
        );
      case "indian-rupee-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 7h8" />  <path d="M8 11h8" />  <path d="m12 17-4-2h1a4 4 0 0 0 0-8" /></svg>'
        );
      case "indian-rupee":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 3h12" />  <path d="M6 8h12" />  <path d="m6 13 8.5 8" />  <path d="M6 13h3" />  <path d="M9 13c6.667 0 6.667-10 0-10" /></svg>'
        );
      case "infinity":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" /></svg>'
        );
      case "info":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 16v-4" />  <path d="M12 8h.01" /></svg>'
        );
      case "inspection-panel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 7h.01" />  <path d="M17 7h.01" />  <path d="M7 17h.01" />  <path d="M17 17h.01" /></svg>'
        );
      case "instagram":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>'
        );
      case "intercom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <path d="M6 9v6" />  <path d="M10 6v12" />  <path d="M14 6v12" />  <path d="M18 9v6" /></svg>'
        );
      case "iron-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.9 7.3C11.4 4 8.7 2 8 2" />  <path d="M22 16.3V8a2 2 0 0 0-4 0v4.3" />  <path d="m2 2 20 20" />  <path d="M6 11h.01" />  <path d="M10 11h.01" />  <path d="M6 15h.01" />  <path d="M10 15h.01" />  <path d="M4.7 4.7C3.3 6.4 2 9 2 12v7h12v-5" />  <path d="M3 22h10" /></svg>'
        );
      case "iron":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 7h.01" />  <path d="M6 11h.01" />  <path d="M10 11h.01" />  <path d="M6 15h.01" />  <path d="M10 15h.01" />  <path d="M14 19v-7C14 6 9 2 8 2S2 6 2 12v7h14a2 2 0 0 0 2-2V8a2 2 0 0 1 4 0v9" />  <path d="M3 22h10" /></svg>'
        );
      case "ironing-board":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 3a4 4 0 0 0 0 8h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />  <path d="m6 21 12-10" />  <path d="m6 11 12 10" /></svg>'
        );
      case "italic-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M16 7h-6" />  <path d="m13.5 7-4 10" />  <path d="M13 17H7" /></svg>'
        );
      case "italic":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="19" x2="10" y1="4" y2="4" />  <line x1="14" x2="5" y1="20" y2="20" />  <line x1="15" x2="9" y1="4" y2="20" /></svg>'
        );
      case "iteration-ccw":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 14 4 4-4 4" />  <path d="M20 10a8 8 0 1 0-8 8h8" /></svg>'
        );
      case "iteration-cw":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 10a8 8 0 1 1 8 8H4" />  <path d="m8 22-4-4 4-4" /></svg>'
        );
      case "jacket-sports":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 4c0 1.1 1.8 2 4 2s4-.9 4-2V3c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1Z" />  <path d="M8 4c0 2 4 5 4 10v8" />  <path d="M12 14c0-5 4-8 4-10" />  <path d="M6 19H3c-.6 0-1-.4-1-1V7c0-1.1.8-2.3 1.9-2.6L8 3" />  <path d="M18 9v12c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />  <path d="m16 3 4.1 1.4C21.2 4.7 22 5.9 22 7v11c0 .6-.4 1-1 1h-3" />  <path d="M2 15h4l2-2" />  <path d="M22 15h-4l-2-2" />  <path d="M6 18h12" /></svg>'
        );
      case "jacket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 4c0 1.1 1.8 2 4 2s4-.9 4-2V3c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1Z" />  <path d="M8 4c0 2 4 5 4 10v8" />  <path d="M12 14c0-5 4-8 4-10" />  <path d="M6 19H3c-.6 0-1-.4-1-1V7c0-1.1.8-2.3 1.9-2.6L8 3" />  <path d="M18 9v12c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />  <path d="m16 3 4.1 1.4C21.2 4.7 22 5.9 22 7v11c0 .6-.4 1-1 1h-3" />  <path d="m6 15 2-2" />  <path d="m18 15-2-2" /></svg>'
        );
      case "japanese-yen-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m9 7 3 3v8" />  <path d="m12 10 3-3" />  <path d="M9 11h6" />  <path d="M9 15h6" /></svg>'
        );
      case "japanese-yen-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m9 7 3 3v7" />  <path d="m12 10 3-3" />  <path d="M9 11h6" />  <path d="M9 15h6" /></svg>'
        );
      case "japanese-yen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 9.5V21m0-11.5L6 3m6 6.5L18 3" />  <path d="M6 15h12" />  <path d="M6 11h12" /></svg>'
        );
      case "jar":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 3h16" />  <path d="M5 3v1.6c0 .8-.2 1.6-.7 2.2l-.7 1C3.2 8.4 3 9.2 3 10v8c0 1.7 1.3 3 3 3h12c1.7 0 3-1.3 3-3v-8c0-.8-.2-1.6-.7-2.2l-.7-1c-.4-.7-.6-1.4-.6-2.2V3" />  <path d="M3 13h4" />  <rect width="10" height="7" x="7" y="10" rx="1" />  <path d="M17 13h4" /></svg>'
        );
      case "joystick":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2Z" />  <path d="M6 15v-2" />  <path d="M12 15V9" />  <circle cx="12" cy="6" r="3" /></svg>'
        );
      case "jug":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 3-2 5H5L3 3h16Z" />  <path d="M19 3c1.7 0 3 1.3 3 3v4" />  <path d="M2 16c1.08-.5 2.16-1 4.5-1 4.5 0 4.5 2 9 2 2.34 0 3.42-.5 4.5-1" />  <path d="M15 21a5 5 0 0 0 4.48-7.22L17 8H5l-2.5 5.8A5 5 0 0 0 7 21Z" /></svg>'
        );
      case "kanban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 5v11" />  <path d="M12 5v6" />  <path d="M18 5v14" /></svg>'
        );
      case "kayak":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 17a1 1 0 0 0-1 1v1a2 2 0 1 0 2-2z" />  <path d="M20.97 3.61a.45.45 0 0 0-.58-.58C10.2 6.6 6.6 10.2 3.03 20.39a.45.45 0 0 0 .58.58C13.8 17.4 17.4 13.8 20.97 3.61" />  <path d="m6.707 6.707 10.586 10.586" />  <path d="M7 5a2 2 0 1 0-2 2h1a1 1 0 0 0 1-1z" /></svg>'
        );
      case "kebab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 12 4.2-4.2c.4-.4.4-1 .1-1.5a2.9 2.9 0 1 1 4.8.8" />  <path d="M15.3 11.3c.9.9.9 2.5 0 3.4l-1.6 1.6c-.9.9-2.5.9-3.4 0 .9.9.9 2.5 0 3.4l-1.6 1.6c-.9.9-2.5.9-3.4 0l-2.6-2.6c-.9-.9-.9-2.5 0-3.4l1.6-1.6c.9-.9 2.5-.9 3.4 0-.9-.9-.9-2.5 0-3.4l1.6-1.6c.9-.9 2.5-.9 3.4 0Z" />  <path d="m10.3 16.3-2.6-2.6" />  <path d="m9 15-2 2" />  <path d="m2 22 2-2" /></svg>'
        );
      case "kettle-electric":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 14v-4c0-1.7 1.3-3 3-3h16v2c0 2-1.5 3.7-3.5 3.9" />  <path d="M11 7v7" />  <path d="M12 2C9.2 2 7 4.2 7 7l-.8 9c-.1 1.1.7 2 1.8 2h8c1.1 0 1.9-.9 1.8-2a1607.1 1607.1 0 0 1-.8-9c0-2.8-2.2-5-5-5" />  <path d="M6 22h12" /></svg>'
        );
      case "kettle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 6v1" />  <path d="M2 22h16" />  <path d="M3 18c-.6 0-1-.4-1-1v-2a8 8 0 0 1 16 0v2c0 .6-.4 1-1 1Z" />  <path d="M5 8.8V7a5 5 0 0 1 10 0v1.8" />  <path d="M18 14.5A9.06 9.06 0 0 0 22 7l-3-1c-1 2-3.5 5-9 5-2.5 0-4.4-.6-5.8-1.5" /></svg>'
        );
      case "key-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /></svg>'
        );
      case "key-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.4 2.7a2.5 2.5 0 0 1 3.4 0l5.5 5.5a2.5 2.5 0 0 1 0 3.4l-3.7 3.7a2.5 2.5 0 0 1-3.4 0L8.7 9.8a2.5 2.5 0 0 1 0-3.4z" />  <path d="m14 7 3 3" />  <path d="m9.4 10.6-6.814 6.814A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814" /></svg>'
        );
      case "key":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />  <path d="m21 2-9.6 9.6" />  <circle cx="7.5" cy="15.5" r="5.5" /></svg>'
        );
      case "keyboard-music":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="16" x="2" y="4" rx="2" />  <path d="M6 8h4" />  <path d="M14 8h.01" />  <path d="M18 8h.01" />  <path d="M2 12h20" />  <path d="M6 12v4" />  <path d="M10 12v4" />  <path d="M14 12v4" />  <path d="M18 12v4" /></svg>'
        );
      case "keyboard-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M 20 4 A2 2 0 0 1 22 6" />  <path d="M 22 6 L 22 16.41" />  <path d="M 7 16 L 16 16" />  <path d="M 9.69 4 L 20 4" />  <path d="M14 8h.01" />  <path d="M18 8h.01" />  <path d="m2 2 20 20" />  <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />  <path d="M6 8h.01" />  <path d="M8 12h.01" /></svg>'
        );
      case "keyboard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 8h.01" />  <path d="M12 12h.01" />  <path d="M14 8h.01" />  <path d="M16 12h.01" />  <path d="M18 8h.01" />  <path d="M6 8h.01" />  <path d="M7 16h10" />  <path d="M8 12h.01" />  <rect width="20" height="16" x="2" y="4" rx="2" /></svg>'
        );
      case "kiwi":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 6v1" />  <path d="m15 9 1-1" />  <path d="M17 12h1" />  <path d="m15 15 1 1" />  <path d="M12 17v1" />  <path d="m8 16 1-1" />  <path d="M6 12h1" />  <path d="m8 8 1 1" /></svg>'
        );
      case "lamp-ceiling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v5" />  <path d="M14.829 15.998a3 3 0 1 1-5.658 0" />  <path d="M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z" /></svg>'
        );
      case "lamp-desk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.293 2.293a1 1 0 0 1 1.414 0l2.5 2.5 5.994 1.227a1 1 0 0 1 .506 1.687l-7 7a1 1 0 0 1-1.687-.506l-1.227-5.994-2.5-2.5a1 1 0 0 1 0-1.414z" />  <path d="m14.207 4.793-3.414 3.414" />  <path d="M3 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />  <path d="m9.086 6.5-4.793 4.793a1 1 0 0 0-.18 1.17L7 18" /></svg>'
        );
      case "lamp-floor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10v12" />  <path d="M17.929 7.629A1 1 0 0 1 17 9H7a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 9 2h6a1 1 0 0 1 .928.629z" />  <path d="M9 22h6" /></svg>'
        );
      case "lamp-wall-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.929 18.629A1 1 0 0 1 19 20H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 13h6a1 1 0 0 1 .928.629z" />  <path d="M6 3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />  <path d="M8 6h4a2 2 0 0 1 2 2v5" /></svg>'
        );
      case "lamp-wall-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.929 9.629A1 1 0 0 1 19 11H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 4h6a1 1 0 0 1 .928.629z" />  <path d="M6 15a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />  <path d="M8 18h4a2 2 0 0 0 2-2v-5" /></svg>'
        );
      case "lamp":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12v6" />  <path d="M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z" />  <path d="M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" /></svg>'
        );
      case "land-plot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 8 6-3-6-3v10" />  <path d="m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12" />  <path d="m6.49 12.85 11.02 6.3" />  <path d="M17.51 12.85 6.5 19.15" /></svg>'
        );
      case "landmark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 18v-7" />  <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" />  <path d="M14 18v-7" />  <path d="M18 18v-7" />  <path d="M3 22h18" />  <path d="M6 18v-7" /></svg>'
        );
      case "languages":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m5 8 6 6" />  <path d="m4 14 6-6 2-3" />  <path d="M2 5h12" />  <path d="M7 2h1" />  <path d="m22 22-5-10-5 10" />  <path d="M14 18h6" /></svg>'
        );
      case "laptop-minimal-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20h20" />  <path d="m9 10 2 2 4-4" />  <rect x="3" y="4" width="18" height="12" rx="2" /></svg>'
        );
      case "laptop-minimal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="12" x="3" y="4" rx="2" ry="2" />  <line x1="2" x2="22" y1="20" y2="20" /></svg>'
        );
      case "laptop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />  <path d="M20.054 15.987H3.946" /></svg>'
        );
      case "lasso-select":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 22a5 5 0 0 1-2-4" />  <path d="M7 16.93c.96.43 1.96.74 2.99.91" />  <path d="M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8a7.19 7.19 0 0 1-.33 2" />  <path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />  <path d="M14.33 22h-.09a.35.35 0 0 1-.24-.32v-10a.34.34 0 0 1 .33-.34c.08 0 .15.03.21.08l7.34 6a.33.33 0 0 1-.21.59h-4.49l-2.57 3.85a.35.35 0 0 1-.28.14z" /></svg>'
        );
      case "lasso":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.704 14.467A10 8 0 0 1 2 10a10 8 0 0 1 20 0 10 8 0 0 1-10 8 10 8 0 0 1-5.181-1.158" />  <path d="M7 22a5 5 0 0 1-2-3.994" />  <circle cx="5" cy="16" r="2" /></svg>'
        );
      case "laugh":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" />  <line x1="9" x2="9.01" y1="9" y2="9" />  <line x1="15" x2="15.01" y1="9" y2="9" /></svg>'
        );
      case "layers-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z" />  <path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845" /></svg>'
        );
      case "layers":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" /></svg>'
        );
      case "layout-dashboard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="9" x="3" y="3" rx="1" />  <rect width="7" height="5" x="14" y="3" rx="1" />  <rect width="7" height="9" x="14" y="12" rx="1" />  <rect width="7" height="5" x="3" y="16" rx="1" /></svg>'
        );
      case "layout-grid-move-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="7" x="3" y="3" rx="1" />  <rect width="7" height="7" x="14" y="3" rx="1" />  <path d="m7 14-4 4 4 4" />  <path d="M21 18H3" />  <path d="m17 14 4 4-4 4" /></svg>'
        );
      case "layout-grid-move-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="7" x="14" y="3" rx="1" />  <rect width="7" height="7" x="14" y="14" rx="1" />  <path d="m2 7 4-4 4 4" />  <path d="M6 3v18" />  <path d="m2 17 4 4 4-4" /></svg>'
        );
      case "layout-grid-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="7" x="3" y="3" rx="1" />  <rect width="7" height="7" x="14" y="14" rx="1" />  <rect width="7" height="7" x="3" y="14" rx="1" />  <path d="M17.5 3v7" />  <path d="M14 6.5h7" /></svg>'
        );
      case "layout-grid":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="7" x="3" y="3" rx="1" />  <rect width="7" height="7" x="14" y="3" rx="1" />  <rect width="7" height="7" x="14" y="14" rx="1" />  <rect width="7" height="7" x="3" y="14" rx="1" /></svg>'
        );
      case "layout-list-move":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 7 6 3 2 7" />  <path d="M6 3v18" />  <path d="m2 17 4 4 4-4" />  <path d="M14 4h7" />  <path d="M14 9h7" />  <path d="M14 15h7" />  <path d="M14 20h7" /></svg>'
        );
      case "layout-list":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="7" x="3" y="3" rx="1" />  <rect width="7" height="7" x="3" y="14" rx="1" />  <path d="M14 4h7" />  <path d="M14 9h7" />  <path d="M14 15h7" />  <path d="M14 20h7" /></svg>'
        );
      case "layout-panel-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="18" x="3" y="3" rx="1" />  <rect width="7" height="7" x="14" y="3" rx="1" />  <rect width="7" height="7" x="14" y="14" rx="1" /></svg>'
        );
      case "layout-panel-top":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="7" x="3" y="3" rx="1" />  <rect width="7" height="7" x="3" y="14" rx="1" />  <rect width="7" height="7" x="14" y="14" rx="1" /></svg>'
        );
      case "layout-template":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="7" x="3" y="3" rx="1" />  <rect width="9" height="7" x="3" y="14" rx="1" />  <rect width="5" height="7" x="16" y="14" rx="1" /></svg>'
        );
      case "leaf":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>'
        );
      case "leafy-green":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22" />  <path d="M2 22 17 7" /></svg>'
        );
      case "lectern":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 12h3a2 2 0 0 0 1.902-1.38l1.056-3.333A1 1 0 0 0 21 6H3a1 1 0 0 0-.958 1.287l1.056 3.334A2 2 0 0 0 5 12h3" />  <path d="M18 6V3a1 1 0 0 0-1-1h-3" />  <rect width="8" height="12" x="8" y="10" rx="1" /></svg>'
        );
      case "lemon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.6 2.4c-.5.2-1.3.6-1.8.6H12a9 9 0 0 0-9 9v3.8c0 .6-.4 1.3-.6 1.8a2.95 2.95 0 0 0 4 4c.5-.2 1.3-.6 1.8-.6H12a9 9 0 0 0 9-9V8.2c0-.6.4-1.3.6-1.8a2.95 2.95 0 0 0-4-4" />  <path d="M7 12c0-2.8 2.2-5 5-5" /></svg>'
        );
      case "letter-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 12h6" />  <path d="M15 6h6" />  <path d="m3 13 3.553-7.724a.5.5 0 0 1 .894 0L11 13" />  <path d="M3 18h18" />  <path d="M3.92 11h6.16" /></svg>'
        );
      case "library-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="18" x="3" y="3" rx="1" />  <path d="M7 3v18" />  <path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z" /></svg>'
        );
      case "library":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 6 4 14" />  <path d="M12 6v14" />  <path d="M8 8v12" />  <path d="M4 4v16" /></svg>'
        );
      case "life-buoy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m4.93 4.93 4.24 4.24" />  <path d="m14.83 9.17 4.24-4.24" />  <path d="m14.83 14.83 4.24 4.24" />  <path d="m9.17 14.83-4.24 4.24" />  <circle cx="12" cy="12" r="4" /></svg>'
        );
      case "life-jacket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 14a2.5 2.5 0 0 0-.8-1.9 3.5 3.5 0 1 1 5.6 0l-.3.4A2.5 2.5 0 0 0 14 14v5a3 3 0 1 0 6 0v-9a8 8 0 0 0-16 0v9a3 3 0 1 0 6 0Z" /></svg>'
        );
      case "ligature-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 12h3" />  <path d="M14.4 8a3.5 3.5 0 0 0-5.9 2.5V17" />  <path d="M10 17H7" />  <path d="M14 12h1.5v5" />  <path d="M17 17h-3" /></svg>'
        );
      case "ligature":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 12h2v8" />  <path d="M14 20h4" />  <path d="M6 12h4" />  <path d="M6 20h4" />  <path d="M8 20V8a4 4 0 0 1 7.464-2" /></svg>'
        );
      case "light-switch":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <rect width="4" height="8" x="10" y="8" />  <path d="M10 12h4" /></svg>'
        );
      case "lightbulb-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.8 11.2c.8-.9 1.2-2 1.2-3.2a6 6 0 0 0-9.3-5" />  <path d="m2 2 20 20" />  <path d="M6.3 6.3a4.67 4.67 0 0 0 1.2 5.2c.7.7 1.3 1.5 1.5 2.5" />  <path d="M9 18h6" />  <path d="M10 22h4" /></svg>'
        );
      case "lightbulb":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />  <path d="M9 18h6" />  <path d="M10 22h4" /></svg>'
        );
      case "line-squiggle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 3.5c5-2 7 2.5 3 4C1.5 10 2 15 5 16c5 2 9-10 14-7s.5 13.5-4 12c-5-2.5.5-11 6-2" /></svg>'
        );
      case "lingerie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 2v2a2 2 0 0 0-2 2v2c0 1.7 1.3 3 3 3h2a2 2 0 0 0 2-2h4a2 2 0 0 0 2 2h2c1.7 0 3-1.3 3-3V6a2 2 0 0 0-2-2" />  <path d="M10 9c0-2.8-2.2-5-5-5" />  <path d="M19 2v2c-2.8 0-5 2.2-5 5" />  <path d="M3 15a7 7 0 0 1 7 7h4a7 7 0 0 1 7-7Z" /></svg>'
        );
      case "link-2-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 17H7A5 5 0 0 1 7 7" />  <path d="M15 7h2a5 5 0 0 1 4 8" />  <line x1="8" x2="12" y1="12" y2="12" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "link-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 17H7A5 5 0 0 1 7 7h2" />  <path d="M15 7h2a5 5 0 1 1 0 10h-2" />  <line x1="8" x2="16" y1="12" y2="12" /></svg>'
        );
      case "link":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>'
        );
      case "linkedin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />  <rect width="4" height="12" x="2" y="9" />  <circle cx="4" cy="4" r="2" /></svg>'
        );
      case "list-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 18H3" />  <path d="m15 18 2 2 4-4" />  <path d="M16 12H3" />  <path d="M16 6H3" /></svg>'
        );
      case "list-checks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 17 2 2 4-4" />  <path d="m3 7 2 2 4-4" />  <path d="M13 6h8" />  <path d="M13 12h8" />  <path d="M13 18h8" /></svg>'
        );
      case "list-collapse":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12h11" />  <path d="M10 18h11" />  <path d="M10 6h11" />  <path d="m3 10 3-3-3-3" />  <path d="m3 20 3-3-3-3" /></svg>'
        );
      case "list-end":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 12H3" />  <path d="M16 6H3" />  <path d="M10 18H3" />  <path d="M21 6v10a2 2 0 0 1-2 2h-5" />  <path d="m16 16-2 2 2 2" /></svg>'
        );
      case "list-filter-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 18h4" />  <path d="M11 6H3" />  <path d="M15 6h6" />  <path d="M18 9V3" />  <path d="M7 12h8" /></svg>'
        );
      case "list-filter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 6h18" />  <path d="M7 12h10" />  <path d="M10 18h4" /></svg>'
        );
      case "list-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 12H3" />  <path d="M16 6H3" />  <path d="M16 18H3" />  <path d="M21 12h-6" /></svg>'
        );
      case "list-music":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 15V6" />  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />  <path d="M12 12H3" />  <path d="M16 6H3" />  <path d="M12 18H3" /></svg>'
        );
      case "list-ordered":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12h11" />  <path d="M10 18h11" />  <path d="M10 6h11" />  <path d="M4 10h2" />  <path d="M4 6h1v4" />  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>'
        );
      case "list-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 12H3" />  <path d="M16 6H3" />  <path d="M16 18H3" />  <path d="M18 9v6" />  <path d="M21 12h-6" /></svg>'
        );
      case "list-restart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 6H3" />  <path d="M7 12H3" />  <path d="M7 18H3" />  <path d="M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14" />  <path d="M11 10v4h4" /></svg>'
        );
      case "list-start":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 12H3" />  <path d="M16 18H3" />  <path d="M10 6H3" />  <path d="M21 18V8a2 2 0 0 0-2-2h-5" />  <path d="m16 8-2-2 2-2" /></svg>'
        );
      case "list-todo":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="3" y="5" width="6" height="6" rx="1" />  <path d="m3 17 2 2 4-4" />  <path d="M13 6h8" />  <path d="M13 12h8" />  <path d="M13 18h8" /></svg>'
        );
      case "list-tree":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12h-8" />  <path d="M21 6H8" />  <path d="M21 18h-8" />  <path d="M3 6v4c0 1.1.9 2 2 2h3" />  <path d="M3 10v6c0 1.1.9 2 2 2h3" /></svg>'
        );
      case "list-video":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12H3" />  <path d="M12 18H3" />  <path d="M16 6H3" />  <path d="M21.033 14.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .968-.56z" /></svg>'
        );
      case "list-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 12H3" />  <path d="M16 6H3" />  <path d="M16 18H3" />  <path d="m19 10-4 4" />  <path d="m15 10 4 4" /></svg>'
        );
      case "list":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12h.01" />  <path d="M3 18h.01" />  <path d="M3 6h.01" />  <path d="M8 12h13" />  <path d="M8 18h13" />  <path d="M8 6h13" /></svg>'
        );
      case "loader-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>'
        );
      case "loader-pinwheel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />  <path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />  <path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />  <circle cx="12" cy="12" r="10" /></svg>'
        );
      case "loader":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v4" />  <path d="m16.2 7.8 2.9-2.9" />  <path d="M18 12h4" />  <path d="m16.2 16.2 2.9 2.9" />  <path d="M12 18v4" />  <path d="m4.9 19.1 2.9-2.9" />  <path d="M2 12h4" />  <path d="m4.9 4.9 2.9 2.9" /></svg>'
        );
      case "locate-fixed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="2" x2="5" y1="12" y2="12" />  <line x1="19" x2="22" y1="12" y2="12" />  <line x1="12" x2="12" y1="2" y2="5" />  <line x1="12" x2="12" y1="19" y2="22" />  <circle cx="12" cy="12" r="7" />  <circle cx="12" cy="12" r="3" /></svg>'
        );
      case "locate-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 19v3" />  <path d="M12 2v3" />  <path d="M18.89 13.24a7 7 0 0 0-8.13-8.13" />  <path d="M19 12h3" />  <path d="M2 12h3" />  <path d="m2 2 20 20" />  <path d="M7.05 7.05a7 7 0 0 0 9.9 9.9" /></svg>'
        );
      case "locate-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="14" x="5" y="5" rx="2" />  <path d="M12 5V2" />  <path d="M19 12h3" />  <path d="M12 22v-3" />  <path d="M2 12h3" /></svg>'
        );
      case "locate":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="2" x2="5" y1="12" y2="12" />  <line x1="19" x2="22" y1="12" y2="12" />  <line x1="12" x2="12" y1="2" y2="5" />  <line x1="12" x2="12" y1="19" y2="22" />  <circle cx="12" cy="12" r="7" /></svg>'
        );
      case "lock-keyhole-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="16" r="1" />  <rect width="18" height="12" x="3" y="10" rx="2" />  <path d="M7 10V7a5 5 0 0 1 9.33-2.5" /></svg>'
        );
      case "lock-keyhole":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="16" r="1" />  <rect x="3" y="10" width="18" height="12" rx="2" />  <path d="M7 10V7a5 5 0 0 1 10 0v3" /></svg>'
        );
      case "lock-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />  <path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>'
        );
      case "lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />  <path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>'
        );
      case "log-in":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 17 5-5-5-5" />  <path d="M15 12H3" />  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg>'
        );
      case "log-out":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 17 5-5-5-5" />  <path d="M21 12H9" />  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>'
        );
      case "logs":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 12h8" />  <path d="M13 18h8" />  <path d="M13 6h8" />  <path d="M3 12h1" />  <path d="M3 18h1" />  <path d="M3 6h1" />  <path d="M8 12h1" />  <path d="M8 18h1" />  <path d="M8 6h1" /></svg>'
        );
      case "lollipop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11" cy="11" r="8" />  <path d="m21 21-4.3-4.3" />  <path d="M11 11a2 2 0 0 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0" /></svg>'
        );
      case "luggage-cabin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2h8" />  <path d="M10 2v5" />  <path d="M14 2v5" />  <rect width="12" height="14" x="6" y="7" rx="2" />  <path d="M14 21v-8a2 2 0 1 0-4 0v8" />  <path d="M8 21v1" />  <path d="M16 21v1" /></svg>'
        );
      case "luggage":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2" />  <path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />  <path d="M10 20h4" />  <circle cx="16" cy="20" r="2" />  <circle cx="8" cy="20" r="2" /></svg>'
        );
      case "lunch-box":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />  <path d="M8 21a2 2 0 0 0 2-2v-8a4 4 0 0 0-8 0v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a4 4 0 0 0-4-4H6" />  <path d="M2 13h20" /></svg>'
        );
      case "magnet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 15 4 4" />  <path d="M2.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.029-6.029a1 1 0 1 1 3 3l-6.029 6.029a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.365-6.367A1 1 0 0 0 8.716 4.282z" />  <path d="m5 8 4 4" /></svg>'
        );
      case "mail-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="m16 19 2 2 4-4" /></svg>'
        );
      case "mail-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 15V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="M16 19h6" /></svg>'
        );
      case "mail-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />  <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" /></svg>'
        );
      case "mail-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="M19 16v6" />  <path d="M16 19h6" /></svg>'
        );
      case "mail-question-mark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="M18 15.28c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" />  <path d="M20 22v.01" /></svg>'
        );
      case "mail-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7.5" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />  <circle cx="18" cy="18" r="3" />  <path d="m22 22-1.5-1.5" /></svg>'
        );
      case "mail-warning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="M20 14v4" />  <path d="M20 22v.01" /></svg>'
        );
      case "mail-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />  <path d="m17 17 4 4" />  <path d="m21 17-4 4" /></svg>'
        );
      case "mail":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />  <rect x="2" y="4" width="20" height="16" rx="2" /></svg>'
        );
      case "mailbox-flag":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 5.5A4 4 0 0 1 22 9v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a4 4 0 0 1 8 0v8a2 2 0 0 1-2 2" />  <path d="M6 5h4" />  <path d="M14 9V5h2v1h-2" /></svg>'
        );
      case "mailbox":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />  <polyline points="15,9 18,9 18,11" />  <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" />  <line x1="6" x2="7" y1="10" y2="10" /></svg>'
        );
      case "mails":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 1-1.732" />  <path d="m22 5.5-6.419 4.179a2 2 0 0 1-2.162 0L7 5.5" />  <rect x="7" y="3" width="15" height="12" rx="2" /></svg>'
        );
      case "map-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V14" />  <path d="M15 5.764V14" />  <path d="M21 18h-6" />  <path d="M9 3.236v15" /></svg>'
        );
      case "map-pin-check-inside":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />  <path d="m9 10 2 2 4-4" /></svg>'
        );
      case "map-pin-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.43 12.935c.357-.967.57-1.955.57-2.935a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32.197 32.197 0 0 0 .813-.728" />  <circle cx="12" cy="10" r="3" />  <path d="m16 18 2 2 4-4" /></svg>'
        );
      case "map-pin-house":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z" />  <path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2" />  <path d="M18 22v-3" />  <circle cx="10" cy="10" r="3" /></svg>'
        );
      case "map-pin-minus-inside":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />  <path d="M9 10h6" /></svg>'
        );
      case "map-pin-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.977 14C19.6 12.701 20 11.343 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738" />  <circle cx="12" cy="10" r="3" />  <path d="M16 18h6" /></svg>'
        );
      case "map-pin-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.75 7.09a3 3 0 0 1 2.16 2.16" />  <path d="M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568" />  <path d="m2 2 20 20" />  <path d="M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533" />  <path d="M9.13 9.13a3 3 0 0 0 3.74 3.74" /></svg>'
        );
      case "map-pin-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.97 9.304A8 8 0 0 0 2 10c0 4.69 4.887 9.562 7.022 11.468" />  <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />  <circle cx="10" cy="10" r="3" /></svg>'
        );
      case "map-pin-plus-inside":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />  <path d="M12 7v6" />  <path d="M9 10h6" /></svg>'
        );
      case "map-pin-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.914 11.105A7.298 7.298 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738" />  <circle cx="12" cy="10" r="3" />  <path d="M16 18h6" />  <path d="M19 15v6" /></svg>'
        );
      case "map-pin-x-inside":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />  <path d="m14.5 7.5-5 5" />  <path d="m9.5 7.5 5 5" /></svg>'
        );
      case "map-pin-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.752 11.901A7.78 7.78 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 19 19 0 0 0 .09-.077" />  <circle cx="12" cy="10" r="3" />  <path d="m21.5 15.5-5 5" />  <path d="m21.5 20.5-5-5" /></svg>'
        );
      case "map-pin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />  <circle cx="12" cy="10" r="3" /></svg>'
        );
      case "map-pinned":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0" />  <circle cx="12" cy="8" r="2" />  <path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712" /></svg>'
        );
      case "map-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V12" />  <path d="M15 5.764V12" />  <path d="M18 15v6" />  <path d="M21 18h-6" />  <path d="M9 3.236v15" /></svg>'
        );
      case "map":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />  <path d="M15 5.764v15" />  <path d="M9 3.236v15" /></svg>'
        );
      case "mars-stroke":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 6 4 4" />  <path d="M17 3h4v4" />  <path d="m21 3-7.75 7.75" />  <circle cx="9" cy="15" r="6" /></svg>'
        );
      case "mars":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3h5v5" />  <path d="m21 3-6.75 6.75" />  <circle cx="10" cy="14" r="6" /></svg>'
        );
      case "martini":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 22h8" />  <path d="M12 11v11" />  <path d="m19 3-7 8-7-8Z" /></svg>'
        );
      case "mask-snorkel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.5 14a2 2 0 0 1-1.4-.6l-.7-.8c-.8-.8-2-.8-2.8 0l-.7.8a2 2 0 0 1-1.4.6H6a4 4 0 0 1 0-8h8a4 4 0 0 1 0 8Z" />  <path d="M12 18a2 2 0 0 1-4 0" />  <path d="M10 20a2 2 0 0 0 2 2h4c3.3 0 6-2.7 6-6V2h-4v14a2 2 0 0 1-2 2" />  <path d="M18 10h4" />  <circle cx="4.5" cy="21.5" r=".5" />  <path d="M3 17.5h.01" /></svg>'
        );
      case "maximize-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 3h6v6" />  <path d="m21 3-7 7" />  <path d="m3 21 7-7" />  <path d="M9 21H3v-6" /></svg>'
        );
      case "maximize":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3H5a2 2 0 0 0-2 2v3" />  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />  <path d="M3 16v3a2 2 0 0 0 2 2h3" />  <path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>'
        );
      case "meal-box":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="6" />  <path d="M22 12c0 3.3-2.7 6-6 6H8c-3.3 0-6-2.7-6-6" />  <path d="M7 6h10" />  <rect width="4" height="4" x="6" y="10" rx="1" />  <rect width="4" height="4" x="14" y="10" rx="1" /></svg>'
        );
      case "medal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />  <path d="M11 12 5.12 2.2" />  <path d="m13 12 5.88-9.8" />  <path d="M8 7h8" />  <circle cx="12" cy="17" r="5" />  <path d="M12 18v-2h-.5" /></svg>'
        );
      case "megaphone-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.636 6A13 13 0 0 0 19.4 3.2 1 1 0 0 1 21 4v11.344" />  <path d="M14.378 14.357A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1" />  <path d="m2 2 20 20" />  <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />  <path d="M8 8v6" /></svg>'
        );
      case "megaphone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />  <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />  <path d="M8 6v8" /></svg>'
        );
      case "meh":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <line x1="8" x2="16" y1="15" y2="15" />  <line x1="9" x2="9.01" y1="9" y2="9" />  <line x1="15" x2="15.01" y1="9" y2="9" /></svg>'
        );
      case "memory-stick":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 19v-3" />  <path d="M10 19v-3" />  <path d="M14 19v-3" />  <path d="M18 19v-3" />  <path d="M8 11V9" />  <path d="M16 11V9" />  <path d="M12 11V9" />  <path d="M2 15h20" />  <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z" /></svg>'
        );
      case "menu":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 12h16" />  <path d="M4 18h16" />  <path d="M4 6h16" /></svg>'
        );
      case "merge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 6 4-4 4 4" />  <path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22" />  <path d="m20 22-5-5" /></svg>'
        );
      case "message-circle-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 9-3 3 3 3" />  <path d="m14 15 3-3-3-3" />  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" /></svg>'
        );
      case "message-circle-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />  <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />  <path d="M17.609 3.72a10 10 0 0 1 2.69 2.7" />  <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />  <path d="M20.28 17.61a10 10 0 0 1-2.7 2.69" />  <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />  <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />  <path d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98" /></svg>'
        );
      case "message-circle-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 5.004 2.224 3 3 0 0 1-.832 2.083l-3.447 3.62a1 1 0 0 1-1.45-.001z" /></svg>'
        );
      case "message-circle-more":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="M8 12h.01" />  <path d="M12 12h.01" />  <path d="M16 12h.01" /></svg>'
        );
      case "message-circle-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 20 20" />  <path d="M4.93 4.929a10 10 0 0 0-1.938 11.412 2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 0 0 11.302-1.989" />  <path d="M8.35 2.69A10 10 0 0 1 21.3 15.65" /></svg>'
        );
      case "message-circle-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="M8 12h8" />  <path d="M12 8v8" /></svg>'
        );
      case "message-circle-question-mark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />  <path d="M12 17h.01" /></svg>'
        );
      case "message-circle-reply":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="m10 15-3-3 3-3" />  <path d="M7 12h8a2 2 0 0 1 2 2v1" /></svg>'
        );
      case "message-circle-warning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="M12 8v4" />  <path d="M12 16h.01" /></svg>'
        );
      case "message-circle-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />  <path d="m15 9-6 6" />  <path d="m9 9 6 6" /></svg>'
        );
      case "message-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" /></svg>'
        );
      case "message-square-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="m10 8-3 3 3 3" />  <path d="m14 14 3-3-3-3" /></svg>'
        );
      case "message-square-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 19h.01" />  <path d="M12 3h.01" />  <path d="M16 19h.01" />  <path d="M16 3h.01" />  <path d="M2 13h.01" />  <path d="M2 17v4.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H8" />  <path d="M2 5a2 2 0 0 1 2-2" />  <path d="M2 9h.01" />  <path d="M20 3a2 2 0 0 1 2 2" />  <path d="M22 13h.01" />  <path d="M22 17a2 2 0 0 1-2 2" />  <path d="M22 9h.01" />  <path d="M8 3h.01" /></svg>'
        );
      case "message-square-diff":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M10 15h4" />  <path d="M10 9h4" />  <path d="M12 7v4" /></svg>'
        );
      case "message-square-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.7 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4.7" />  <circle cx="19" cy="6" r="3" /></svg>'
        );
      case "message-square-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M7.5 9.5c0 .687.265 1.383.697 1.844l3.009 3.264a1.14 1.14 0 0 0 .407.314 1 1 0 0 0 .783-.004 1.14 1.14 0 0 0 .398-.31l3.008-3.264A2.77 2.77 0 0 0 16.5 9.5 2.5 2.5 0 0 0 12 8a2.5 2.5 0 0 0-4.5 1.5" /></svg>'
        );
      case "message-square-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 8.5V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H10" />  <path d="M20 15v-2a2 2 0 0 0-4 0v2" />  <rect x="14" y="15" width="8" height="5" rx="1" /></svg>'
        );
      case "message-square-more":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M12 11h.01" />  <path d="M16 11h.01" />  <path d="M8 11h.01" /></svg>'
        );
      case "message-square-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 19H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.7.7 0 0 1 2 21.286V5a2 2 0 0 1 1.184-1.826" />  <path d="m2 2 20 20" />  <path d="M8.656 3H20a2 2 0 0 1 2 2v11.344" /></svg>'
        );
      case "message-square-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M12 8v6" />  <path d="M9 11h6" /></svg>'
        );
      case "message-square-quote":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M14 13a2 2 0 0 0 2-2V9h-2" />  <path d="M8 13a2 2 0 0 0 2-2V9H8" /></svg>'
        );
      case "message-square-reply":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="m10 8-3 3 3 3" />  <path d="M17 14v-1a2 2 0 0 0-2-2H7" /></svg>'
        );
      case "message-square-share":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4" />  <path d="M16 3h6v6" />  <path d="m16 9 6-6" /></svg>'
        );
      case "message-square-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M7 11h10" />  <path d="M7 15h6" />  <path d="M7 7h8" /></svg>'
        );
      case "message-square-warning":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="M12 15h.01" />  <path d="M12 7v4" /></svg>'
        );
      case "message-square-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />  <path d="m14.5 8.5-5 5" />  <path d="m9.5 8.5 5 5" /></svg>'
        );
      case "message-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" /></svg>'
        );
      case "messages-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />  <path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1" /></svg>'
        );
      case "mic-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 19v3" />  <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />  <path d="M16.95 16.95A7 7 0 0 1 5 12v-2" />  <path d="M18.89 13.23A7 7 0 0 0 19 12v-2" />  <path d="m2 2 20 20" />  <path d="M9 9v3a3 3 0 0 0 5.12 2.12" /></svg>'
        );
      case "mic-vocal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12" />  <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5" />  <circle cx="16" cy="7" r="5" /></svg>'
        );
      case "mic":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 19v3" />  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />  <rect x="9" y="2" width="6" height="13" rx="3" /></svg>'
        );
      case "microchip":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 12h2" />  <path d="M18 16h2" />  <path d="M18 20h2" />  <path d="M18 4h2" />  <path d="M18 8h2" />  <path d="M4 12h2" />  <path d="M4 16h2" />  <path d="M4 20h2" />  <path d="M4 4h2" />  <path d="M4 8h2" />  <path d="M8 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1.5c-.276 0-.494.227-.562.495a2 2 0 0 1-3.876 0C9.994 2.227 9.776 2 9.5 2z" /></svg>'
        );
      case "microscope":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 18h8" />  <path d="M3 22h18" />  <path d="M14 22a7 7 0 1 0 0-14h-1" />  <path d="M9 14h2" />  <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />  <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>'
        );
      case "microwave":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="15" x="2" y="4" rx="2" />  <rect width="8" height="7" x="6" y="8" rx="1" />  <path d="M18 8v7" />  <path d="M6 19v2" />  <path d="M18 19v2" /></svg>'
        );
      case "milestone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13v8" />  <path d="M12 3v3" />  <path d="M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z" /></svg>'
        );
      case "milk-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2h8" />  <path d="M9 2v1.343M15 2v2.789a4 4 0 0 0 .672 2.219l.656.984a4 4 0 0 1 .672 2.22v1.131M7.8 7.8l-.128.192A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3" />  <path d="M7 15a6.47 6.47 0 0 1 5 0 6.472 6.472 0 0 0 3.435.435" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "milk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2h8" />  <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" />  <path d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" /></svg>'
        );
      case "minimize-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 10 7-7" />  <path d="M20 10h-6V4" />  <path d="m3 21 7-7" />  <path d="M4 14h6v6" /></svg>'
        );
      case "minimize":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3v3a2 2 0 0 1-2 2H3" />  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />  <path d="M3 16h3a2 2 0 0 1 2 2v3" />  <path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>'
        );
      case "minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 12h14" /></svg>'
        );
      case "monitor-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 10 2 2 4-4" />  <rect width="20" height="14" x="2" y="3" rx="2" />  <path d="M12 17v4" />  <path d="M8 21h8" /></svg>'
        );
      case "monitor-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17v4" />  <path d="m14.305 7.53.923-.382" />  <path d="m15.228 4.852-.923-.383" />  <path d="m16.852 3.228-.383-.924" />  <path d="m16.852 8.772-.383.923" />  <path d="m19.148 3.228.383-.924" />  <path d="m19.53 9.696-.382-.924" />  <path d="m20.772 4.852.924-.383" />  <path d="m20.772 7.148.924.383" />  <path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />  <path d="M8 21h8" />  <circle cx="18" cy="6" r="3" /></svg>'
        );
      case "monitor-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17v4" />  <path d="M22 12.307V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.693" />  <path d="M8 21h8" />  <circle cx="19" cy="6" r="3" /></svg>'
        );
      case "monitor-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13V7" />  <path d="m15 10-3 3-3-3" />  <rect width="20" height="14" x="2" y="3" rx="2" />  <path d="M12 17v4" />  <path d="M8 21h8" /></svg>'
        );
      case "monitor-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 17H4a2 2 0 0 1-2-2V5c0-1.5 1-2 1-2" />  <path d="M22 15V5a2 2 0 0 0-2-2H9" />  <path d="M8 21h8" />  <path d="M12 17v4" />  <path d="m2 2 20 20" /></svg>'
        );
      case "monitor-pause":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 13V7" />  <path d="M14 13V7" />  <rect width="20" height="14" x="2" y="3" rx="2" />  <path d="M12 17v4" />  <path d="M8 21h8" /></svg>'
        );
      case "monitor-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z" />  <path d="M12 17v4" />  <path d="M8 21h8" />  <rect x="2" y="3" width="20" height="14" rx="2" /></svg>'
        );
      case "monitor-smartphone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />  <path d="M10 19v-3.96 3.15" />  <path d="M7 19h5" />  <rect width="6" height="10" x="16" y="12" rx="2" /></svg>'
        );
      case "monitor-speaker":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.5 20H8" />  <path d="M17 9h.01" />  <rect width="10" height="16" x="12" y="4" rx="2" />  <path d="M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />  <circle cx="17" cy="15" r="1" /></svg>'
        );
      case "monitor-stop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17v4" />  <path d="M8 21h8" />  <rect x="2" y="3" width="20" height="14" rx="2" />  <rect x="9" y="7" width="6" height="6" rx="1" /></svg>'
        );
      case "monitor-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 10 3-3 3 3" />  <path d="M12 13V7" />  <rect width="20" height="14" x="2" y="3" rx="2" />  <path d="M12 17v4" />  <path d="M8 21h8" /></svg>'
        );
      case "monitor-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.5 12.5-5-5" />  <path d="m9.5 12.5 5-5" />  <rect width="20" height="14" x="2" y="3" rx="2" />  <path d="M12 17v4" />  <path d="M8 21h8" /></svg>'
        );
      case "monitor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="14" x="2" y="3" rx="2" />  <line x1="8" x2="16" y1="21" y2="21" />  <line x1="12" x2="12" y1="17" y2="21" /></svg>'
        );
      case "moon-star":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 5h4" />  <path d="M20 3v4" />  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>'
        );
      case "moon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>'
        );
      case "mortar-pestle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 4a2 2 0 0 0-3-1.7l-8.5 5.1A3 3 0 0 0 12 13c.8 0 1.5-.3 2-.8l7.3-6.7c.4-.4.7-.9.7-1.5" />  <path d="M22 12a10 10 0 0 1-20 0" />  <path d="M11.1 7C6 7.2 2 9.4 2 12c0 2.8 4.5 5 10 5s10-2.2 10-5c0-1.5-1.4-2.9-3.6-3.8" /></svg>'
        );
      case "motor-racing-helmet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 12.2a10 10 0 1 0-19.4 3.2c.2.5.8 1.1 1.3 1.3l13.2 5.1c.5.2 1.2 0 1.6-.3l2.6-2.6c.4-.4.7-1.2.7-1.7Z" />  <path d="m21.8 18-10.5-4a2 2.06 0 0 1 .7-4h9.8" /></svg>'
        );
      case "mountain-snow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 3 4 8 5-5 5 15H2L8 3z" />  <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" /></svg>'
        );
      case "mountain":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>'
        );
      case "mouse-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6v.343" />  <path d="M18.218 18.218A7 7 0 0 1 5 15V9a7 7 0 0 1 .782-3.218" />  <path d="M19 13.343V9A7 7 0 0 0 8.56 2.902" />  <path d="M22 22 2 2" /></svg>'
        );
      case "mouse-pointer-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" /></svg>'
        );
      case "mouse-pointer-ban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.034 2.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.944L8.204 7.545a1 1 0 0 0-.66.66l-1.066 3.443a.5.5 0 0 1-.944.033z" />  <circle cx="16" cy="16" r="6" />  <path d="m11.8 11.8 8.4 8.4" /></svg>'
        );
      case "mouse-pointer-click":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 4.1 12 6" />  <path d="m5.1 8-2.9-.8" />  <path d="m6 12-1.9 2" />  <path d="M7.2 2.2 8 5.1" />  <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" /></svg>'
        );
      case "mouse-pointer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.586 12.586 19 19" />  <path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z" /></svg>'
        );
      case "mouse":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="5" y="2" width="14" height="20" rx="7" />  <path d="M12 6v4" /></svg>'
        );
      case "move-3d":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 3v16h16" />  <path d="m5 19 6-6" />  <path d="m2 6 3-3 3 3" />  <path d="m18 16 3 3-3 3" /></svg>'
        );
      case "move-diagonal-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 13v6h-6" />  <path d="M5 11V5h6" />  <path d="m5 5 14 14" /></svg>'
        );
      case "move-diagonal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 19H5v-6" />  <path d="M13 5h6v6" />  <path d="M19 5 5 19" /></svg>'
        );
      case "move-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 19H5V13" />  <path d="M19 5L5 19" /></svg>'
        );
      case "move-down-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 13V19H13" />  <path d="M5 5L19 19" /></svg>'
        );
      case "move-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 18L12 22L16 18" />  <path d="M12 2V22" /></svg>'
        );
      case "move-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 8 4 4-4 4" />  <path d="M2 12h20" />  <path d="m6 8-4 4 4 4" /></svg>'
        );
      case "move-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 8L2 12L6 16" />  <path d="M2 12H22" /></svg>'
        );
      case "move-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 8L22 12L18 16" />  <path d="M2 12H22" /></svg>'
        );
      case "move-up-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 11V5H11" />  <path d="M5 5L19 19" /></svg>'
        );
      case "move-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 5H19V11" />  <path d="M19 5L5 19" /></svg>'
        );
      case "move-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 6L12 2L16 6" />  <path d="M12 2V22" /></svg>'
        );
      case "move-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v20" />  <path d="m8 18 4 4 4-4" />  <path d="m8 6 4-4 4 4" /></svg>'
        );
      case "move":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v20" />  <path d="m15 19-3 3-3-3" />  <path d="m19 9 3 3-3 3" />  <path d="M2 12h20" />  <path d="m5 9-3 3 3 3" />  <path d="m9 5 3-3 3 3" /></svg>'
        );
      case "mug-teabag":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />  <path d="M4 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M10 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M16 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M9 8v3" />  <path d="M11 16v-3.5L9 11l-2 1.5V16Z" /></svg>'
        );
      case "mug":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />  <path d="M4 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M10 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" />  <path d="M16 4a1 1 0 0 1 1-1 1 1 0 0 0 1-1" /></svg>'
        );
      case "music-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="8" cy="18" r="4" />  <path d="M12 18V2l7 4" /></svg>'
        );
      case "music-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="18" r="4" />  <path d="M16 18V2" /></svg>'
        );
      case "music-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 18V5l12-2v13" />  <path d="m9 9 12-2" />  <circle cx="6" cy="18" r="3" />  <circle cx="18" cy="16" r="3" /></svg>'
        );
      case "music":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 18V5l12-2v13" />  <circle cx="6" cy="18" r="3" />  <circle cx="18" cy="16" r="3" /></svg>'
        );
      case "mustache":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.2 8.6a3.9 3.9 0 0 0-6.2-.2 3.75 3.75 0 0 0-6.2.2l-.6.8C4.5 10.4 3.3 11 2 11a5.55 5.55 0 0 0 10 3.2A5.45 5.45 0 0 0 22 11c-1.3 0-2.5-.6-3.2-1.6Z" /></svg>'
        );
      case "navigation-2-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9.31 9.31 5 21l7-4 7 4-1.17-3.17" />  <path d="M14.53 8.88 12 2l-1.17 3.17" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "navigation-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polygon points="12 2 19 21 12 17 5 21 12 2" /></svg>'
        );
      case "navigation-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8.43 8.43 3 11l8 2 2 8 2.57-5.43" />  <path d="M17.39 11.73 22 2l-9.73 4.61" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "navigation":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>'
        );
      case "network":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="16" y="16" width="6" height="6" rx="1" />  <rect x="2" y="16" width="6" height="6" rx="1" />  <rect x="9" y="2" width="6" height="6" rx="1" />  <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />  <path d="M12 12V8" /></svg>'
        );
      case "newspaper":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 18h-5" />  <path d="M18 14h-8" />  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />  <rect width="8" height="4" x="10" y="6" rx="1" /></svg>'
        );
      case "nfc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />  <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />  <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />  <path d="M16.37 2a20.16 20.16 0 0 1 0 20" /></svg>'
        );
      case "non-binary":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v10" />  <path d="m8.5 4 7 4" />  <path d="m8.5 8 7-4" />  <circle cx="12" cy="17" r="5" /></svg>'
        );
      case "notebook-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />  <path d="M2 6h4" />  <path d="M2 10h4" />  <path d="M2 14h4" />  <path d="M2 18h4" />  <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>'
        );
      case "notebook-tabs":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 6h4" />  <path d="M2 10h4" />  <path d="M2 14h4" />  <path d="M2 18h4" />  <rect width="16" height="20" x="4" y="2" rx="2" />  <path d="M15 2v20" />  <path d="M15 7h5" />  <path d="M15 12h5" />  <path d="M15 17h5" /></svg>'
        );
      case "notebook-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 6h4" />  <path d="M2 10h4" />  <path d="M2 14h4" />  <path d="M2 18h4" />  <rect width="16" height="20" x="4" y="2" rx="2" />  <path d="M9.5 8h5" />  <path d="M9.5 12H16" />  <path d="M9.5 16H14" /></svg>'
        );
      case "notebook":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 6h4" />  <path d="M2 10h4" />  <path d="M2 14h4" />  <path d="M2 18h4" />  <rect width="16" height="20" x="4" y="2" rx="2" />  <path d="M16 2v20" /></svg>'
        );
      case "notepad-text-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M12 2v4" />  <path d="M16 2v4" />  <path d="M16 4h2a2 2 0 0 1 2 2v2" />  <path d="M20 12v2" />  <path d="M20 18v2a2 2 0 0 1-2 2h-1" />  <path d="M13 22h-2" />  <path d="M7 22H6a2 2 0 0 1-2-2v-2" />  <path d="M4 14v-2" />  <path d="M4 8V6a2 2 0 0 1 2-2h2" />  <path d="M8 10h6" />  <path d="M8 14h8" />  <path d="M8 18h5" /></svg>'
        );
      case "notepad-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 2v4" />  <path d="M12 2v4" />  <path d="M16 2v4" />  <rect width="16" height="18" x="4" y="4" rx="2" />  <path d="M8 10h6" />  <path d="M8 14h8" />  <path d="M8 18h5" /></svg>'
        );
      case "nut-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 4V2" />  <path d="M5 10v4a7.004 7.004 0 0 0 5.277 6.787c.412.104.802.292 1.102.592L12 22l.621-.621c.3-.3.69-.488 1.102-.592a7.01 7.01 0 0 0 4.125-2.939" />  <path d="M19 10v3.343" />  <path d="M12 12c-1.349-.573-1.905-1.005-2.5-2-.546.902-1.048 1.353-2.5 2-1.018-.644-1.46-1.08-2-2-1.028.71-1.69.918-3 1 1.081-1.048 1.757-2.03 2-3 .194-.776.84-1.551 1.79-2.21m11.654 5.997c.887-.457 1.28-.891 1.556-1.787 1.032.916 1.683 1.157 3 1-1.297-1.036-1.758-2.03-2-3-.5-2-4-4-8-4-.74 0-1.461.068-2.15.192" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "nut":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 4V2" />  <path d="M5 10v4a7.004 7.004 0 0 0 5.277 6.787c.412.104.802.292 1.102.592L12 22l.621-.621c.3-.3.69-.488 1.102-.592A7.003 7.003 0 0 0 19 14v-4" />  <path d="M12 4C8 4 4.5 6 4 8c-.243.97-.919 1.952-2 3 1.31-.082 1.972-.29 3-1 .54.92.982 1.356 2 2 1.452-.647 1.954-1.098 2.5-2 .595.995 1.151 1.427 2.5 2 1.31-.621 1.862-1.058 2.5-2 .629.977 1.162 1.423 2.5 2 1.209-.548 1.68-.967 2-2 1.032.916 1.683 1.157 3 1-1.297-1.036-1.758-2.03-2-3-.5-2-4-4-8-4Z" /></svg>'
        );
      case "octagon-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16h.01" />  <path d="M12 8v4" />  <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" /></svg>'
        );
      case "octagon-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" />  <path d="M8 12h8" /></svg>'
        );
      case "octagon-pause":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 15V9" />  <path d="M14 15V9" />  <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" /></svg>'
        );
      case "octagon-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 9-6 6" />  <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" />  <path d="m9 9 6 6" /></svg>'
        );
      case "octagon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" /></svg>'
        );
      case "olive":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 10 4-3" />  <path d="m10 7 4 3" />  <ellipse cx="12" cy="12" rx="9" ry="10" />  <path d="m2 22 5-5" />  <path d="M18.69 5.31 22 2" /></svg>'
        );
      case "omega":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 20h4.5a.5.5 0 0 0 .5-.5v-.282a.52.52 0 0 0-.247-.437 8 8 0 1 1 8.494-.001.52.52 0 0 0-.247.438v.282a.5.5 0 0 0 .5.5H21" /></svg>'
        );
      case "onion":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="2" />  <circle cx="12" cy="12" r="6" />  <path d="M2.8 8.1a10 10 0 1 0 5.3-5.3C5 4 3 2 3 2L2 3s2 2 .8 5.1" />  <path d="M18 20v2" />  <path d="m21 21-1.9-1.9" />  <path d="M22 18h-2" /></svg>'
        );
      case "option":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3h6l6 18h6" />  <path d="M14 3h7" /></svg>'
        );
      case "orbit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.341 6.484A10 10 0 0 1 10.266 21.85" />  <path d="M3.659 17.516A10 10 0 0 1 13.74 2.152" />  <circle cx="12" cy="12" r="3" />  <circle cx="19" cy="5" r="2" />  <circle cx="5" cy="19" r="2" /></svg>'
        );
      case "origami":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12V4a1 1 0 0 1 1-1h6.297a1 1 0 0 1 .651 1.759l-4.696 4.025" />  <path d="m12 21-7.414-7.414A2 2 0 0 1 4 12.172V6.415a1.002 1.002 0 0 1 1.707-.707L20 20.009" />  <path d="m12.214 3.381 8.414 14.966a1 1 0 0 1-.167 1.199l-1.168 1.163a1 1 0 0 1-.706.291H6.351a1 1 0 0 1-.625-.219L3.25 18.8a1 1 0 0 1 .631-1.781l4.165.027" /></svg>'
        );
      case "owl":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="9" rx="8" ry="7" />  <path d="M12 9a4 4 0 1 1 8 0v12h-4C9.4 21 4 15.6 4 9a4 4 0 1 1 8 0v1" />  <path d="M8 9h.01" />  <path d="M16 9h.01" />  <path d="M20 21a3.9 3.9 0 1 1 0-7.8" />  <path d="M10 19.4V22" />  <path d="M14 20.85V22" /></svg>'
        );
      case "pac-man-ghost":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 10h.01" />  <path d="M15 10h.01" />  <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg>'
        );
      case "pac-man":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 12 7.4 6.7a10 10 0 1 1 0-13.4Z" />  <path d="M18 12h.01" />  <path d="M22 12h.01" /></svg>'
        );
      case "package-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v6" />  <path d="M16.76 3a2 2 0 0 1 1.8 1.1l2.23 4.479a2 2 0 0 1 .21.891V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.472a2 2 0 0 1 .211-.894L5.45 4.1A2 2 0 0 1 7.24 3z" />  <path d="M3.054 9.013h17.893" /></svg>'
        );
      case "package-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 16 2 2 4-4" />  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />  <path d="m7.5 4.27 9 5.15" />  <polyline points="3.29 7 12 12 20.71 7" />  <line x1="12" x2="12" y1="22" y2="12" /></svg>'
        );
      case "package-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 16h6" />  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />  <path d="m7.5 4.27 9 5.15" />  <polyline points="3.29 7 12 12 20.71 7" />  <line x1="12" x2="12" y1="22" y2="12" /></svg>'
        );
      case "package-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22v-9" />  <path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" />  <path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13" />  <path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" /></svg>'
        );
      case "package-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 16h6" />  <path d="M19 13v6" />  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />  <path d="m7.5 4.27 9 5.15" />  <polyline points="3.29 7 12 12 20.71 7" />  <line x1="12" x2="12" y1="22" y2="12" /></svg>'
        );
      case "package-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />  <path d="m7.5 4.27 9 5.15" />  <polyline points="3.29 7 12 12 20.71 7" />  <line x1="12" x2="12" y1="22" y2="12" />  <circle cx="18.5" cy="15.5" r="2.5" />  <path d="M20.27 17.27 22 19" /></svg>'
        );
      case "package-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />  <path d="m7.5 4.27 9 5.15" />  <polyline points="3.29 7 12 12 20.71 7" />  <line x1="12" x2="12" y1="22" y2="12" />  <path d="m17 13 5 5m-5 0 5-5" /></svg>'
        );
      case "package":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />  <path d="M12 22V12" />  <polyline points="3.29 7 12 12 20.71 7" />  <path d="m7.5 4.27 9 5.15" /></svg>'
        );
      case "paint-bucket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />  <path d="m5 2 5 5" />  <path d="M2 13h15" />  <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" /></svg>'
        );
      case "paint-roller":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="16" height="6" x="2" y="2" rx="2" />  <path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />  <rect width="4" height="6" x="8" y="16" rx="1" /></svg>'
        );
      case "paintbrush-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v2" />  <path d="M14 2v4" />  <path d="M17 2a1 1 0 0 1 1 1v9H6V3a1 1 0 0 1 1-1z" />  <path d="M6 12a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v2.9a2 2 0 1 0 4 0V17a1 1 0 0 1 1-1h2a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1" /></svg>'
        );
      case "paintbrush":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.622 17.897-10.68-2.913" />  <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" />  <path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" /></svg>'
        );
      case "palette":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /></svg>'
        );
      case "palmtree-island-sun":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="7" r="3" />  <path d="M16 14s1-3 1-8V4s-1-2-3-2c-1 0-2 .5-2 .5" />  <path d="M13 8a4 4 0 0 1 8 0" />  <path d="M17 4s1-2 3-2c1 0 2 .5 2 .5" />  <path d="M19.75 19A8 8 0 0 0 4 21" />  <path d="M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>'
        );
      case "pancakes":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 11.6c3.5-.8 6-2.5 6-4.6 0-2.8-4.5-5-10-5S2 4.2 2 7c0 2.5 3.7 4.6 8.4 5" />  <path d="M3.3 9.5C2.5 10.2 2 11.1 2 12c0 2.8 4.5 5 10 5h.3" />  <path d="M15.9 16.6c3.6-.8 6.1-2.5 6.1-4.6 0-.9-.5-1.8-1.3-2.5" />  <path d="M3.3 14.5C2.5 15.2 2 16.1 2 17c0 2.8 4.5 5 10 5s10-2.2 10-5c0-.9-.5-1.8-1.3-2.5" />  <path d="M16 16a2 2 0 0 1-4 0v-2c0-1.1-.9-2-2-2.2-1.8-.5-3-1.6-3-2.8 0-1.7 2.2-3 5-3s5 1.3 5 3c0 .4-.1.7-.3 1.1-.3.5-.7 1.2-.7 1.7Z" /></svg>'
        );
      case "panda":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.25 17.25h1.5L12 18z" />  <path d="m15 12 2 2" />  <path d="M18 6.5a.5.5 0 0 0-.5-.5" />  <path d="M20.69 9.67a4.5 4.5 0 1 0-7.04-5.5 8.35 8.35 0 0 0-3.3 0 4.5 4.5 0 1 0-7.04 5.5C2.49 11.2 2 12.88 2 14.5 2 19.47 6.48 22 12 22s10-2.53 10-7.5c0-1.62-.48-3.3-1.3-4.83" />  <path d="M6 6.5a.495.495 0 0 1 .5-.5" />  <path d="m9 12-2 2" /></svg>'
        );
      case "panel-bottom-close":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 15h18" />  <path d="m15 8-3 3-3-3" /></svg>'
        );
      case "panel-bottom-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M14 15h1" />  <path d="M19 15h2" />  <path d="M3 15h2" />  <path d="M9 15h1" /></svg>'
        );
      case "panel-bottom-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 15h18" />  <path d="m9 10 3-3 3 3" /></svg>'
        );
      case "panel-bottom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 15h18" /></svg>'
        );
      case "panel-left-close":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 3v18" />  <path d="m16 15-3-3 3-3" /></svg>'
        );
      case "panel-left-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 14v1" />  <path d="M9 19v2" />  <path d="M9 3v2" />  <path d="M9 9v1" /></svg>'
        );
      case "panel-left-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 3v18" />  <path d="m14 9 3 3-3 3" /></svg>'
        );
      case "panel-left-right-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 10V9" />  <path d="M16 15v-1" />  <path d="M16 21v-2" />  <path d="M16 5V3" />  <path d="M8 10V9" />  <path d="M8 15v-1" />  <path d="M8 21v-2" />  <path d="M8 5V3" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "panel-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 3v18" /></svg>'
        );
      case "panel-right-close":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M15 3v18" />  <path d="m8 9 3 3-3 3" /></svg>'
        );
      case "panel-right-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M15 14v1" />  <path d="M15 19v2" />  <path d="M15 3v2" />  <path d="M15 9v1" /></svg>'
        );
      case "panel-right-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M15 3v18" />  <path d="m10 15-3-3 3-3" /></svg>'
        );
      case "panel-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M15 3v18" /></svg>'
        );
      case "panel-top-bottom-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 16h1" />  <path d="M14 8h1" />  <path d="M19 16h2" />  <path d="M19 8h2" />  <path d="M3 16h2" />  <path d="M3 8h2" />  <path d="M9 16h1" />  <path d="M9 8h1" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "panel-top-close":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9h18" />  <path d="m9 16 3-3 3 3" /></svg>'
        );
      case "panel-top-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M14 9h1" />  <path d="M19 9h2" />  <path d="M3 9h2" />  <path d="M9 9h1" /></svg>'
        );
      case "panel-top-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9h18" />  <path d="m15 14-3 3-3-3" /></svg>'
        );
      case "panel-top":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9h18" /></svg>'
        );
      case "panels-left-bottom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 3v18" />  <path d="M9 15h12" /></svg>'
        );
      case "panels-right-bottom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 15h12" />  <path d="M15 3v18" /></svg>'
        );
      case "panels-top-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9h18" />  <path d="M9 21V9" /></svg>'
        );
      case "paperclip":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" /></svg>'
        );
      case "parentheses":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 21s-4-3-4-9 4-9 4-9" />  <path d="M16 3s4 3 4 9-4 9-4 9" /></svg>'
        );
      case "parking-meter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 15h2" />  <path d="M12 12v3" />  <path d="M12 19v3" />  <path d="M15.282 19a1 1 0 0 0 .948-.68l2.37-6.988a7 7 0 1 0-13.2 0l2.37 6.988a1 1 0 0 0 .948.68z" />  <path d="M9 9a3 3 0 1 1 6 0" /></svg>'
        );
      case "party-popper":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.8 11.3 2 22l10.7-3.79" />  <path d="M4 3h.01" />  <path d="M22 8h.01" />  <path d="M15 2h.01" />  <path d="M22 20h.01" />  <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />  <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />  <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />  <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" /></svg>'
        );
      case "pause":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="14" y="3" width="5" height="18" rx="1" />  <rect x="5" y="3" width="5" height="18" rx="1" /></svg>'
        );
      case "paw-print":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11" cy="4" r="2" />  <circle cx="18" cy="8" r="2" />  <circle cx="20" cy="16" r="2" />  <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg>'
        );
      case "pc-case":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="20" x="5" y="2" rx="2" />  <path d="M15 14h.01" />  <path d="M9 6h6" />  <path d="M9 10h6" /></svg>'
        );
      case "peace":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M12 2v20" />  <path d="M19.1 19.1 12 12l-7 7" /></svg>'
        );
      case "peach":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 2a2 2 0 0 0-2 2v2" />  <path d="M12 6.5A6 6 0 0 1 22 11c0 6.1-4.5 11-10 11S2 17.1 2 11a6 6 0 0 1 12 0" /></svg>'
        );
      case "pear":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 7a4.95 4.95 0 0 0-8.6-3.4c-1.5 1.6-1.6 1.8-5 2.6a8 8 0 1 0 9.4 9.5c.7-3.4 1-3.6 2.6-5 1-1 1.6-2.3 1.6-3.7" />  <path d="m19 5 3-3" /></svg>'
        );
      case "pen-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 21h8" />  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>'
        );
      case "pen-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982" />  <path d="m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353" />  <path d="m2 2 20 20" /></svg>'
        );
      case "pen-tool":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" />  <path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" />  <path d="m2.3 2.3 7.286 7.286" />  <circle cx="11" cy="11" r="2" /></svg>'
        );
      case "pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>'
        );
      case "pencil-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 21h8" />  <path d="m15 5 4 4" />  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>'
        );
      case "pencil-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 10-6.157 6.162a2 2 0 0 0-.5.833l-1.322 4.36a.5.5 0 0 0 .622.624l4.358-1.323a2 2 0 0 0 .83-.5L14 13.982" />  <path d="m12.829 7.172 4.359-4.346a1 1 0 1 1 3.986 3.986l-4.353 4.353" />  <path d="m15 5 4 4" />  <path d="m2 2 20 20" /></svg>'
        );
      case "pencil-ruler":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />  <path d="m8 6 2-2" />  <path d="m18 16 2-2" />  <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />  <path d="m15 5 4 4" /></svg>'
        );
      case "pencil":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />  <path d="m15 5 4 4" /></svg>'
        );
      case "penguin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.9 15a5.87 5.87 0 0 0-1.7-3.3l-.2-.2c-.6-.6-1-1.5-1-2.5V5a3 3 0 1 0-6 0v4a3.74 3.74 0 0 1-1.2 2.8 6.2 6.2 0 0 0-1.7 3.3" />  <path d="M9 10c-2 4-4-1-7 2" />  <path d="M9 8.9c3-1.9 6 0 6 0s-2 3.1-3 4c-1-.9-3-4-3-4" />  <path d="M15 10c2 4 4-1 7 2" />  <path d="M2 19c0-1 1-1 1-2 0-.6.4-1 1-1 1 0 1-1 2-1 .4 0 .7.2.9.5L8.8 19a2 2 0 0 1-2.7 2.7l-3.5-1.9c-.4-.1-.6-.4-.6-.8" />  <path d="M8.7 21a6.07 6.07 0 0 0 6.6 0" />  <path d="M22 19c0-1-1-1-1-2 0-.6-.4-1-1-1-1 0-1-1-2-1-.4 0-.7.2-.9.5L15.2 19a2 2 0 0 0 2.7 2.7l3.5-1.9c.4-.1.6-.4.6-.8" /></svg>'
        );
      case "pentagon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.83 2.38a2 2 0 0 1 2.34 0l8 5.74a2 2 0 0 1 .73 2.25l-3.04 9.26a2 2 0 0 1-1.9 1.37H7.04a2 2 0 0 1-1.9-1.37L2.1 10.37a2 2 0 0 1 .73-2.25z" /></svg>'
        );
      case "pepper-chilli":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 7V4a2 2 0 0 0-4 0" />  <path d="M14 10s2 0 4 2c2-2 4-2 4-2" />  <path d="M22 10c0 6.6-5.4 12-12 12-4.4 0-8-2.7-8-6v-.4C3.3 17.1 5 18 7 18c3.9 0 7-3.6 7-8 0-1.7 1.3-3 3-3h2c1.7 0 3 1.3 3 3" /></svg>'
        );
      case "percent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="19" x2="5" y1="5" y2="19" />  <circle cx="6.5" cy="6.5" r="2.5" />  <circle cx="17.5" cy="17.5" r="2.5" /></svg>'
        );
      case "person-standing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="5" r="1" />  <path d="m9 20 3-6 3 6" />  <path d="m6 8 6 2 6-2" />  <path d="M12 10v4" /></svg>'
        );
      case "philippine-peso":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 11H4" />  <path d="M20 7H4" />  <path d="M7 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 12H7" /></svg>'
        );
      case "phone-call":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 2a9 9 0 0 1 9 9" />  <path d="M13 6a5 5 0 0 1 5 5" />  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>'
        );
      case "phone-forwarded":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 6h8" />  <path d="m18 2 4 4-4 4" />  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>'
        );
      case "phone-incoming":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 2v6h6" />  <path d="m22 2-6 6" />  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>'
        );
      case "phone-missed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 2 6 6" />  <path d="m22 2-6 6" />  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>'
        );
      case "phone-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" />  <path d="M22 2 2 22" />  <path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" /></svg>'
        );
      case "phone-outgoing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 8 6-6" />  <path d="M22 8V2h-6" />  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>'
        );
      case "phone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg>'
        );
      case "pi":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="9" x2="9" y1="4" y2="20" />  <path d="M4 7c0-1.7 1.3-3 3-3h13" />  <path d="M18 20c-1.7 0-3-1.3-3-3V4" /></svg>'
        );
      case "piano":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.5 8c-1.4 0-2.6-.8-3.2-2A6.87 6.87 0 0 0 2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8.5C22 9.6 20.4 8 18.5 8" />  <path d="M2 14h20" />  <path d="M6 14v4" />  <path d="M10 14v4" />  <path d="M14 14v4" />  <path d="M18 14v4" /></svg>'
        );
      case "pickaxe":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999" />  <path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024" />  <path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069" />  <path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z" /></svg>'
        );
      case "picture-in-picture-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" />  <rect width="10" height="7" x="12" y="13" rx="2" /></svg>'
        );
      case "picture-in-picture":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 10h6V4" />  <path d="m2 4 6 6" />  <path d="M21 10V7a2 2 0 0 0-2-2h-7" />  <path d="M3 14v2a2 2 0 0 0 2 2h3" />  <rect x="12" y="14" width="10" height="7" rx="1" /></svg>'
        );
      case "pie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 2C5.5 4 8.5 5 7 7" />  <path d="M12 2c-1.5 2 1.5 3 0 5" />  <path d="M17 2c-1.5 2 1.5 3 0 5" />  <path d="M21 16s-2-5-9-5-9 5-9 5l1.7 5.1c.2.5.7.9 1.3.9h12c.5 0 1.1-.4 1.3-.9Z" />  <path d="M2 16c1.7 0 1.6 1 3.3 1C7 17 7 16 8.7 16s1.6 1 3.3 1c1.7 0 1.7-1 3.3-1 1.7 0 1.6 1 3.3 1 1.7 0 1.7-1 3.3-1" />  <path d="m8.5 16 1.5 6" />  <path d="M15.5 16 14 22" /></svg>'
        );
      case "pig-head":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 17.9c1.8-.9 3-2.5 3-5.1 0-1.8-.5-3.4-1.5-4.9 1.5-.3 2.5-1.5 2.5-3V3h-3c-1.3 0-2.4.8-2.8 2a10 10 0 0 0-8.4 0C7.4 3.8 6.3 3 5 3H2v2a3 3 0 0 0 2.5 2.9C3.5 9.3 3 11 3 12.8c0 2.6 1.2 4.2 3 5.1" />  <path d="M10 14v-2" />  <path d="M14 14v-2" />  <path d="M14 22a4 4 0 1 0-2-7.45A4 4 0 1 0 10 22Z" />  <path d="M10 18h.01" />  <path d="M14 18h.01" /></svg>'
        );
      case "pig":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 4.5a4.12 4.12 0 0 0-5.5 1.6C13 6 12.5 6 12 6c-4.4 0-8 2.7-8 6 0 1.5.8 2.9 2 4v2a2 2 0 0 0 2 2h2v-2.2a12.3 12.3 0 0 0 4 0V19c0 .6.4 1 1 1h3v-4c.7-.6 1.2-1.2 1.5-2H21c.6 0 1-.4 1-1v-3h-2.5c-.4-1-1.2-1.8-2.2-2.5Z" />  <path d="M16 11h.01" />  <path d="M2.3 7a2 2 0 0 0 2.2 2.9" /></svg>'
        );
      case "piggy-bank":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />  <path d="M16 10h.01" />  <path d="M2 8v1a2 2 0 0 0 2 2h1" /></svg>'
        );
      case "pilcrow-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 3v11" />  <path d="M14 9h-3a3 3 0 0 1 0-6h9" />  <path d="M18 3v11" />  <path d="M22 18H2l4-4" />  <path d="m6 22-4-4" /></svg>'
        );
      case "pilcrow-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 3v11" />  <path d="M10 9H7a1 1 0 0 1 0-6h8" />  <path d="M14 3v11" />  <path d="m18 14 4 4H2" />  <path d="m22 18-4 4" /></svg>'
        );
      case "pilcrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 4v16" />  <path d="M17 4v16" />  <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" /></svg>'
        );
      case "pill-bottle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 11h-4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4" />  <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />  <rect width="16" height="5" x="4" y="2" rx="1" /></svg>'
        );
      case "pill":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />  <path d="m8.5 8.5 7 7" /></svg>'
        );
      case "pillow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.3 7.5a2 2 0 1 0-2.9-2.7C17 4.3 14.6 4 12 4s-4.9.3-6.4.8a2 2 0 1 0-2.9 2.7 14 14 0 0 0 0 9 2 2 0 1 0 2.9 2.7c1.5.5 3.8.8 6.4.8s5-.3 6.4-.8a2 2 0 1 0 2.9-2.7 14 14 0 0 0 0-9" /></svg>'
        );
      case "pin-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17v5" />  <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />  <path d="m2 2 20 20" />  <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" /></svg>'
        );
      case "pin-safety-open":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.8 3.2c-1.6-1.6-4.1-1.6-5.7 0L12.3 6S15 9 18 6c-3 3 0 5.7 0 5.7l2.8-2.8c1.6-1.6 1.6-4.2 0-5.7" />  <path d="m7.1 21.1 10.3-10.2" />  <circle cx="5" cy="19" r="3" />  <path d="M9 2s-4.1 9.5-6.755 15.8" /></svg>'
        );
      case "pin-safety":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.8 3.2c-1.6-1.6-4.1-1.6-5.7 0L12.3 6S15 9 18 6c-3 3 0 5.7 0 5.7l2.8-2.8c1.6-1.6 1.6-4.2 0-5.7" />  <path d="m7.1 21.1 10.3-10.2" />  <circle cx="5" cy="19" r="3" />  <path d="M2.9 16.9 13.1 6.6" /></svg>'
        );
      case "pin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17v5" />  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" /></svg>'
        );
      case "pineapple-ring":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="10" rx="10" ry="8" />  <ellipse cx="12" cy="10" rx="3" ry="2" />  <path d="m6 4 1.5 1.5" />  <path d="M16.7 3.4 15.5 5" />  <path d="M2 10v4c0 4.4 4.5 8 10 8s10-3.6 10-8v-4h-3" />  <path d="m8 15-1 2v3.9" />  <path d="M12 16v6" /></svg>'
        );
      case "pipette":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12" />  <path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z" />  <path d="m2 22 .414-.414" /></svg>'
        );
      case "pizza":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 14-1 1" />  <path d="m13.75 18.25-1.25 1.42" />  <path d="M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12" />  <path d="M18.8 9.3a1 1 0 0 0 2.1 7.7" />  <path d="M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z" /></svg>'
        );
      case "plane-landing":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 22h20" />  <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z" /></svg>'
        );
      case "plane-takeoff":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 22h20" />  <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z" /></svg>'
        );
      case "plane":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>'
        );
      case "planet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="8" />  <path d="M4.05 13c-1.7 1.8-2.5 3.5-1.8 4.5 1.1 1.9 6.4 1 11.8-2s8.9-7.1 7.7-9c-.6-1-2.4-1.2-4.7-.7" /></svg>'
        );
      case "play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" /></svg>'
        );
      case "plug-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 2v6" />  <path d="M15 2v6" />  <path d="M12 17v5" />  <path d="M5 8h14" />  <path d="M6 11V8h12v3a6 6 0 1 1-12 0Z" /></svg>'
        );
      case "plug-zap":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />  <path d="m2 22 3-3" />  <path d="M7.5 13.5 10 11" />  <path d="M10.5 16.5 13 14" />  <path d="m18 3-4 4h6l-4 4" /></svg>'
        );
      case "plug":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22v-5" />  <path d="M9 8V2" />  <path d="M15 8V2" />  <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" /></svg>'
        );
      case "plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 12h14" />  <path d="M12 5v14" /></svg>'
        );
      case "pocket-knife":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 2v1c0 1 2 1 2 2S3 6 3 7s2 1 2 2-2 1-2 2 2 1 2 2" />  <path d="M18 6h.01" />  <path d="M6 18h.01" />  <path d="M20.83 8.83a4 4 0 0 0-5.66-5.66l-12 12a4 4 0 1 0 5.66 5.66Z" />  <path d="M18 11.66V22a4 4 0 0 0 4-4V6" /></svg>'
        );
      case "pocket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 3a2 2 0 0 1 2 2v6a1 1 0 0 1-20 0V5a2 2 0 0 1 2-2z" />  <path d="m8 10 4 4 4-4" /></svg>'
        );
      case "podcast":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 17a1 1 0 1 0-2 0l.5 4.5a0.5 0.5 0 0 0 1 0z" fill="currentColor" />  <path d="M16.85 18.58a9 9 0 1 0-9.7 0" />  <path d="M8 14a5 5 0 1 1 8 0" />  <circle cx="12" cy="11" r="1" fill="currentColor" /></svg>'
        );
      case "pointer-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 4.5V4a2 2 0 0 0-2.41-1.957" />  <path d="M13.9 8.4a2 2 0 0 0-1.26-1.295" />  <path d="M21.7 16.2A8 8 0 0 0 22 14v-3a2 2 0 1 0-4 0v-1a2 2 0 0 0-3.63-1.158" />  <path d="m7 15-1.8-1.8a2 2 0 0 0-2.79 2.86L6 19.7a7.74 7.74 0 0 0 6 2.3h2a8 8 0 0 0 5.657-2.343" />  <path d="M6 6v8" />  <path d="m2 2 20 20" /></svg>'
        );
      case "pointer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 14a8 8 0 0 1-8 8" />  <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />  <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />  <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />  <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>'
        );
      case "pond":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 3v2" />  <rect width="4" height="7" x="10" y="4" rx="2" />  <path d="M4 12v10" />  <path d="M12 2v2" />  <rect width="4" height="7" x="2" y="5" rx="2" />  <path d="M12 11v4.35" />  <path d="M15 18.5V22c-3.8 0-7-1.6-7-3.5s3.2-3.5 7-3.5 7 1.6 7 3.5c0 1.3-1.5 2.5-3.9 3.1Z" /></svg>'
        );
      case "popcorn":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4" />  <path d="M10 22 9 8" />  <path d="m14 22 1-14" />  <path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z" /></svg>'
        );
      case "popsicle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.6 14.4c.8-.8.8-2 0-2.8l-8.1-8.1a4.95 4.95 0 1 0-7.1 7.1l8.1 8.1c.9.7 2.1.7 2.9-.1Z" />  <path d="m22 22-5.5-5.5" /></svg>'
        );
      case "pound-sterling-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M10 17V9.5a2.5 2.5 0 0 1 5 0" />  <path d="M8 13h5" />  <path d="M8 17h7" /></svg>'
        );
      case "pound-sterling-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M10 17V9.5a2.5 2.5 0 0 1 5 0" />  <path d="M8 13h5" />  <path d="M8 17h7" /></svg>'
        );
      case "pound-sterling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 7c0-5.333-8-5.333-8 0" />  <path d="M10 7v14" />  <path d="M6 21h12" />  <path d="M6 13h10" /></svg>'
        );
      case "power-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.36 6.64A9 9 0 0 1 20.77 15" />  <path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" />  <path d="M12 2v4" />  <path d="m2 2 20 20" /></svg>'
        );
      case "power":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v10" />  <path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></svg>'
        );
      case "pram":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.7 4.4 14.5 10" />  <path d="M13 10V2a8.1 8.1 0 0 1 8 8v1c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3v-1h18" />  <path d="m8.2 18.4 3.3-4.4" />  <circle cx="7" cy="20" r="2" />  <path d="M15.8 18.4 5.6 4.8A1.94 1.94 0 0 0 2 6" />  <circle cx="17" cy="20" r="2" /></svg>'
        );
      case "presentation":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 3h20" />  <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />  <path d="m7 21 5-5 5 5" /></svg>'
        );
      case "pretzel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m20 19-6.5-6.5A4.9 4.9 0 0 1 12 9a5 5 0 0 1 10 0A10 10 0 0 1 2 9a5 5 0 1 1 10 0c0 1.4-.6 2.6-1.5 3.5L4 19" /></svg>'
        );
      case "printer-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.5 22H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v.5" />  <path d="m16 19 2 2 4-4" />  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" />  <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /></svg>'
        );
      case "printer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />  <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />  <rect x="6" y="14" width="12" height="8" rx="1" /></svg>'
        );
      case "projector":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 7 3 5" />  <path d="M9 6V3" />  <path d="m13 7 2-2" />  <circle cx="9" cy="13" r="3" />  <path d="M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17" />  <path d="M16 16h2" /></svg>'
        );
      case "proportions":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="16" x="2" y="4" rx="2" />  <path d="M12 9v11" />  <path d="M2 9h13a2 2 0 0 1 2 2v9" /></svg>'
        );
      case "pumpkin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 2c-1 1-1 2-1 2" />  <path d="M17 4c-.9 0-1.8.4-2.5 1.2a3.32 3.32 0 0 0-5 0C8.8 4.4 7.9 4 7 4c-2.8 0-5 4-5 9s2.2 9 5 9c.9 0 1.8-.4 2.5-1.2a3.32 3.32 0 0 0 5 0c.7.8 1.6 1.2 2.5 1.2 2.8 0 5-4 5-9s-2.2-9-5-9" />  <path d="M10 11 8 9l-2 2" />  <path d="m18 11-2-2-2 2" />  <path d="m6 15 2 2 2-2 2 2 2-2 2 2 2-2" /></svg>'
        );
      case "puzzle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" /></svg>'
        );
      case "pyramid":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.5 16.88a1 1 0 0 1-.32-1.43l9-13.02a1 1 0 0 1 1.64 0l9 13.01a1 1 0 0 1-.32 1.44l-8.51 4.86a2 2 0 0 1-1.98 0Z" />  <path d="M12 2v20" /></svg>'
        );
      case "qr-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="5" height="5" x="3" y="3" rx="1" />  <rect width="5" height="5" x="16" y="3" rx="1" />  <rect width="5" height="5" x="3" y="16" rx="1" />  <path d="M21 16h-3a2 2 0 0 0-2 2v3" />  <path d="M21 21v.01" />  <path d="M12 7v3a2 2 0 0 1-2 2H7" />  <path d="M3 12h.01" />  <path d="M12 3h.01" />  <path d="M12 16v.01" />  <path d="M16 12h1" />  <path d="M21 12v.01" />  <path d="M12 21v-1" /></svg>'
        );
      case "quote":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />  <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" /></svg>'
        );
      case "rabbit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 16a3 3 0 0 1 2.24 5" />  <path d="M18 12h.01" />  <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" />  <path d="M20 8.54V4a2 2 0 1 0-4 0v3" />  <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" /></svg>'
        );
      case "radar":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />  <path d="M4 6h.01" />  <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />  <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />  <path d="M12 18h.01" />  <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />  <circle cx="12" cy="12" r="2" />  <path d="m13.41 10.59 5.66-5.66" /></svg>'
        );
      case "radiation":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 12h.01" />  <path d="M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z" />  <path d="M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z" />  <path d="M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z" /></svg>'
        );
      case "radical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12h3.28a1 1 0 0 1 .948.684l2.298 7.934a.5.5 0 0 0 .96-.044L13.82 4.771A1 1 0 0 1 14.792 4H21" /></svg>'
        );
      case "radio-receiver":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 16v2" />  <path d="M19 16v2" />  <rect width="20" height="8" x="2" y="8" rx="2" />  <path d="M18 12h.01" /></svg>'
        );
      case "radio-tower":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" />  <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" />  <circle cx="12" cy="9" r="2" />  <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47" />  <path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1" />  <path d="M9.5 18h5" />  <path d="m8 22 4-11 4 11" /></svg>'
        );
      case "radio":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.247 7.761a6 6 0 0 1 0 8.478" />  <path d="M19.075 4.933a10 10 0 0 1 0 14.134" />  <path d="M4.925 19.067a10 10 0 0 1 0-14.134" />  <path d="M7.753 16.239a6 6 0 0 1 0-8.478" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "radius":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.34 17.52a10 10 0 1 0-2.82 2.82" />  <circle cx="19" cy="19" r="2" />  <path d="m13.41 13.41 4.18 4.18" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "rail-symbol":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 15h14" />  <path d="M5 9h14" />  <path d="m14 20-5-5 6-6-5-5" /></svg>'
        );
      case "rainbow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17a10 10 0 0 0-20 0" />  <path d="M6 17a6 6 0 0 1 12 0" />  <path d="M10 17a2 2 0 0 1 4 0" /></svg>'
        );
      case "rat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 22H4a2 2 0 0 1 0-4h12" />  <path d="M13.236 18a3 3 0 0 0-2.2-5" />  <path d="M16 9h.01" />  <path d="M16.82 3.94a3 3 0 1 1 3.237 4.868l1.815 2.587a1.5 1.5 0 0 1-1.5 2.1l-2.872-.453a3 3 0 0 0-3.5 3" />  <path d="M17 4.988a3 3 0 1 0-5.2 2.052A7 7 0 0 0 4 14.015 4 4 0 0 0 8 18" /></svg>'
        );
      case "ratio":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="12" height="20" x="6" y="2" rx="2" />  <rect width="20" height="12" x="2" y="6" rx="2" /></svg>'
        );
      case "razor-blade":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 8h-2V6H4v2H2v8h2v2h16v-2h2Z" />  <path d="M6 11v2" />  <path d="M10 12H6" />  <circle cx="12" cy="12" r="2" />  <path d="M18 12h-4" />  <path d="M18 11v2" /></svg>'
        );
      case "razor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m22 11-1.6 1.6c-.8.8-2 .8-2.8 0l-6.2-6.2c-.8-.8-.8-2 0-2.8L13 2" />  <path d="m15.8 4.8 3.4 3.4" />  <path d="M17 12c-1.4 1.4-3.6 1.4-4.9 0s-1.4-3.6-.1-5" />  <path d="m11.1 10.1-8.5 8.5a1.95 1.95 0 1 0 2.8 2.8l8.4-8.4" /></svg>'
        );
      case "receipt-cent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M12 6.5v11" />  <path d="M15 9.4a4 4 0 1 0 0 5.2" /></svg>'
        );
      case "receipt-euro":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M8 12h5" />  <path d="M16 9.5a4 4 0 1 0 0 5.2" /></svg>'
        );
      case "receipt-indian-rupee":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M8 7h8" />  <path d="M12 17.5 8 15h1a4 4 0 0 0 0-8" />  <path d="M8 11h8" /></svg>'
        );
      case "receipt-japanese-yen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="m12 10 3-3" />  <path d="m9 7 3 3v7.5" />  <path d="M9 11h6" />  <path d="M9 15h6" /></svg>'
        );
      case "receipt-pound-sterling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M8 13h5" />  <path d="M10 17V9.5a2.5 2.5 0 0 1 5 0" />  <path d="M8 17h7" /></svg>'
        );
      case "receipt-russian-ruble":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M8 15h5" />  <path d="M8 11h5a2 2 0 1 0 0-4h-3v10" /></svg>'
        );
      case "receipt-swiss-franc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M10 17V7h5" />  <path d="M10 11h4" />  <path d="M8 15h5" /></svg>'
        );
      case "receipt-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M14 8H8" />  <path d="M16 12H8" />  <path d="M13 16H8" /></svg>'
        );
      case "receipt-turkish-lira":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 6.5v11a5.5 5.5 0 0 0 5.5-5.5" />  <path d="m14 8-6 3" />  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /></svg>'
        );
      case "receipt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />  <path d="M12 17.5v-11" /></svg>'
        );
      case "rectangle-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 4v16H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />  <circle cx="14" cy="12" r="8" /></svg>'
        );
      case "rectangle-ellipsis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="12" x="2" y="6" rx="2" />  <path d="M12 12h.01" />  <path d="M17 12h.01" />  <path d="M7 12h.01" /></svg>'
        );
      case "rectangle-goggles":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-1.6-.8l-1.6-2.13a1 1 0 0 0-1.6 0L9.6 17.2A2 2 0 0 1 8 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /></svg>'
        );
      case "rectangle-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="12" x="2" y="6" rx="2" /></svg>'
        );
      case "rectangle-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="12" height="20" x="6" y="2" rx="2" /></svg>'
        );
      case "recycle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />  <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />  <path d="m14 16-3 3 3 3" />  <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />  <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />  <path d="m13.378 9.633 4.096 1.098 1.097-4.096" /></svg>'
        );
      case "redo-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 14 5-5-5-5" />  <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" /></svg>'
        );
      case "redo-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="17" r="1" />  <path d="M21 7v6h-6" />  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>'
        );
      case "redo":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 7v6h-6" />  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>'
        );
      case "reel-thread":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 6 4.4 4.6A1.5 1.5 0 0 1 5.5 2h13a1.5 1.5 0 0 1 1.1 2.5L18 6" />  <rect width="12" height="12" x="6" y="6" />  <path d="m6 11 10-5" />  <path d="M22 16v-3a4 4 0 0 0-4-4L6 15" />  <path d="m8 18 10-5" />  <path d="m18 18 1.6 1.4a1.45 1.45 0 0 1-1.1 2.5h-13a1.5 1.5 0 0 1-1.1-2.5L6 18" /></svg>'
        );
      case "refresh-ccw-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />  <path d="M3 3v5h5" />  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />  <path d="M16 16h5v5" />  <circle cx="12" cy="12" r="1" /></svg>'
        );
      case "refresh-ccw":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />  <path d="M3 3v5h5" />  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />  <path d="M16 16h5v5" /></svg>'
        );
      case "refresh-cw-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 8L18.74 5.74A9.75 9.75 0 0 0 12 3C11 3 10.03 3.16 9.13 3.47" />  <path d="M8 16H3v5" />  <path d="M3 12C3 9.51 4 7.26 5.64 5.64" />  <path d="m3 16 2.26 2.26A9.75 9.75 0 0 0 12 21c2.49 0 4.74-1 6.36-2.64" />  <path d="M21 12c0 1-.16 1.97-.47 2.87" />  <path d="M21 3v5h-5" />  <path d="M22 22 2 2" /></svg>'
        );
      case "refresh-cw":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />  <path d="M21 3v5h-5" />  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />  <path d="M8 16H3v5" /></svg>'
        );
      case "refrigerator-freezer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="20" x="5" y="2" rx="2" />  <path d="M9 6h.01" />  <path d="M5 10h14" />  <path d="M9 14h.01" /></svg>'
        );
      case "refrigerator":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" />  <path d="M5 10h14" />  <path d="M15 7v6" /></svg>'
        );
      case "regex":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 3v10" />  <path d="m12.67 5.5 8.66 5" />  <path d="m12.67 10.5 8.66-5" />  <path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z" /></svg>'
        );
      case "remove-formatting-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 9V7h10v2" />  <path d="M13 7 8 17" />  <path d="M7 17h3" />  <path d="m17 14-3 3" />  <path d="m14 14 3 3" /></svg>'
        );
      case "remove-formatting":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 7V4h16v3" />  <path d="M5 20h6" />  <path d="M13 4 8 20" />  <path d="m15 15 5 5" />  <path d="m20 15-5 5" /></svg>'
        );
      case "repeat-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 2 4 4-4 4" />  <path d="M3 11v-1a4 4 0 0 1 4-4h14" />  <path d="m7 22-4-4 4-4" />  <path d="M21 13v1a4 4 0 0 1-4 4H3" />  <path d="M11 10h1v4" /></svg>'
        );
      case "repeat-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 9 3-3 3 3" />  <path d="M13 18H7a2 2 0 0 1-2-2V6" />  <path d="m22 15-3 3-3-3" />  <path d="M11 6h6a2 2 0 0 1 2 2v10" /></svg>'
        );
      case "repeat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 2 4 4-4 4" />  <path d="M3 11v-1a4 4 0 0 1 4-4h14" />  <path d="m7 22-4-4 4-4" />  <path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>'
        );
      case "replace-all":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />  <path d="M14 4a2 2 0 0 1 2-2" />  <path d="M16 10a2 2 0 0 1-2-2" />  <path d="M20 14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />  <path d="M20 2a2 2 0 0 1 2 2" />  <path d="M22 8a2 2 0 0 1-2 2" />  <path d="m3 7 3 3 3-3" />  <path d="M6 10V5a 3 3 0 0 1 3-3h1" />  <rect x="2" y="14" width="8" height="8" rx="2" /></svg>'
        );
      case "replace":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 4a2 2 0 0 1 2-2" />  <path d="M16 10a2 2 0 0 1-2-2" />  <path d="M20 2a2 2 0 0 1 2 2" />  <path d="M22 8a2 2 0 0 1-2 2" />  <path d="m3 7 3 3 3-3" />  <path d="M6 10V5a3 3 0 0 1 3-3h1" />  <rect x="2" y="14" width="8" height="8" rx="2" /></svg>'
        );
      case "reply-all":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 17-5-5 5-5" />  <path d="M22 18v-2a4 4 0 0 0-4-4H7" />  <path d="m7 17-5-5 5-5" /></svg>'
        );
      case "reply":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />  <path d="m9 17-5-5 5-5" /></svg>'
        );
      case "rewind":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 12 18z" />  <path d="M22 6a2 2 0 0 0-3.414-1.414l-6 6a2 2 0 0 0 0 2.828l6 6A2 2 0 0 0 22 18z" /></svg>'
        );
      case "ribbon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 11.22C11 9.997 10 9 10 8a2 2 0 0 1 4 0c0 1-.998 2.002-2.01 3.22" />  <path d="m12 18 2.57-3.5" />  <path d="M6.243 9.016a7 7 0 0 1 11.507-.009" />  <path d="M9.35 14.53 12 11.22" />  <path d="M9.35 14.53C7.728 12.246 6 10.221 6 7a6 5 0 0 1 12 0c-.005 3.22-1.778 5.235-3.43 7.5l3.557 4.527a1 1 0 0 1-.203 1.43l-1.894 1.36a1 1 0 0 1-1.384-.215L12 18l-2.679 3.593a1 1 0 0 1-1.39.213l-1.865-1.353a1 1 0 0 1-.203-1.422z" /></svg>'
        );
      case "rocket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>'
        );
      case "rocking-chair":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polyline points="3.5 2 6.5 12.5 18 12.5" />  <line x1="9.5" x2="5.5" y1="12.5" y2="20" />  <line x1="15" x2="18.5" y1="12.5" y2="20" />  <path d="M2.75 18a13 13 0 0 0 18.5 0" /></svg>'
        );
      case "roller-coaster":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 19V5" />  <path d="M10 19V6.8" />  <path d="M14 19v-7.8" />  <path d="M18 5v4" />  <path d="M18 19v-6" />  <path d="M22 19V9" />  <path d="M2 19V9a4 4 0 0 1 4-4c2 0 4 1.33 6 4s4 4 6 4a4 4 0 1 0-3-6.65" /></svg>'
        );
      case "rose":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 10h-1a4 4 0 1 1 4-4v.534" />  <path d="M17 6h1a4 4 0 0 1 1.42 7.74l-2.29.87a6 6 0 0 1-5.339-10.68l2.069-1.31" />  <path d="M4.5 17c2.8-.5 4.4 0 5.5.8s1.8 2.2 2.3 3.7c-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2" />  <path d="M9.77 12C4 15 2 22 2 22" />  <circle cx="17" cy="8" r="2" /></svg>'
        );
      case "rotate-3d":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2" />  <path d="m15.194 13.707 3.814 1.86-1.86 3.814" />  <path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4" /></svg>'
        );
      case "rotate-ccw-key":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.5 9.5 1 1" />  <path d="m15.5 8.5-4 4" />  <path d="M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8" />  <path d="M3 3v5h5" />  <circle cx="10" cy="14" r="2" /></svg>'
        );
      case "rotate-ccw-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 9V7a2 2 0 0 0-2-2h-6" />  <path d="m15 2-3 3 3 3" />  <path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" /></svg>'
        );
      case "rotate-ccw":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />  <path d="M3 3v5h5" /></svg>'
        );
      case "rotate-cw-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 5H6a2 2 0 0 0-2 2v3" />  <path d="m9 8 3-3-3-3" />  <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /></svg>'
        );
      case "rotate-cw":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />  <path d="M21 3v5h-5" /></svg>'
        );
      case "route-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="19" r="3" />  <path d="M9 19h8.5c.4 0 .9-.1 1.3-.2" />  <path d="M5.2 5.2A3.5 3.53 0 0 0 6.5 12H12" />  <path d="m2 2 20 20" />  <path d="M21 15.3a3.5 3.5 0 0 0-3.3-3.3" />  <path d="M15 5h-4.3" />  <circle cx="18" cy="5" r="3" /></svg>'
        );
      case "route":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="19" r="3" />  <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />  <circle cx="18" cy="5" r="3" /></svg>'
        );
      case "router":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="8" x="2" y="14" rx="2" />  <path d="M6.01 18H6" />  <path d="M10.01 18H10" />  <path d="M15 10v4" />  <path d="M17.84 7.17a4 4 0 0 0-5.66 0" />  <path d="M20.66 4.34a8 8 0 0 0-11.31 0" /></svg>'
        );
      case "rows-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 12h18" /></svg>'
        );
      case "rows-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M21 9H3" />  <path d="M21 15H3" /></svg>'
        );
      case "rows-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M21 7.5H3" />  <path d="M21 12H3" />  <path d="M21 16.5H3" /></svg>'
        );
      case "rss":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 11a9 9 0 0 1 9 9" />  <path d="M4 4a16 16 0 0 1 16 16" />  <circle cx="5" cy="19" r="1" /></svg>'
        );
      case "rugby":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.7 2.3c-.2-.2-.9-.4-1.7-.3a4.6 4.6 0 0 0-3.7 5.7c.3.2.9.4 1.7.3a4.6 4.6 0 0 0 3.7-5.7" />  <path d="M20 12H4" />  <rect width="4" height="6" x="2" y="16" rx="1" />  <path d="M4 2v14" />  <rect width="4" height="6" x="18" y="16" rx="1" />  <path d="M20 2v14" /></svg>'
        );
      case "ruler-dimension-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 15v-3.014" />  <path d="M16 15v-3.014" />  <path d="M20 6H4" />  <path d="M20 8V4" />  <path d="M4 8V4" />  <path d="M8 15v-3.014" />  <rect x="3" y="12" width="18" height="7" rx="1" /></svg>'
        );
      case "ruler":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />  <path d="m14.5 12.5 2-2" />  <path d="m11.5 9.5 2-2" />  <path d="m8.5 6.5 2-2" />  <path d="m17.5 15.5 2-2" /></svg>'
        );
      case "russian-ruble-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M8 11h5a2 2 0 1 0 0-4h-3v10" />  <path d="M8 15h5" /></svg>'
        );
      case "russian-ruble-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 15h5" />  <path d="M8 11h5a2 2 0 1 0 0-4h-3v10" /></svg>'
        );
      case "russian-ruble":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 11h8a4 4 0 0 0 0-8H9v18" />  <path d="M6 15h8" /></svg>'
        );
      case "sailboat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v15" />  <path d="M7 22a4 4 0 0 1-4-4 1 1 0 0 1 1-1h16a1 1 0 0 1 1 1 4 4 0 0 1-4 4z" />  <path d="M9.159 2.46a1 1 0 0 1 1.521-.193l9.977 8.98A1 1 0 0 1 20 13H4a1 1 0 0 1-.824-1.567z" /></svg>'
        );
      case "salad":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 21h10" />  <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />  <path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1" />  <path d="m13 12 4-4" />  <path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" /></svg>'
        );
      case "sandwich":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777" />  <path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25" />  <path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9" />  <path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" />  <rect width="20" height="4" x="2" y="11" rx="1" /></svg>'
        );
      case "satellite-dish":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 10a7.31 7.31 0 0 0 10 10Z" />  <path d="m9 15 3-3" />  <path d="M17 13a6 6 0 0 0-6-6" />  <path d="M21 13A10 10 0 0 0 11 3" /></svg>'
        );
      case "satellite":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13.5 6.5-3.148-3.148a1.205 1.205 0 0 0-1.704 0L6.352 5.648a1.205 1.205 0 0 0 0 1.704L9.5 10.5" />  <path d="M16.5 7.5 19 5" />  <path d="m17.5 10.5 3.148 3.148a1.205 1.205 0 0 1 0 1.704l-2.296 2.296a1.205 1.205 0 0 1-1.704 0L13.5 14.5" />  <path d="M9 21a6 6 0 0 0-6-6" />  <path d="M9.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l4.296-4.296a1.205 1.205 0 0 0 0-1.704l-2.296-2.296a1.205 1.205 0 0 0-1.704 0z" /></svg>'
        );
      case "saudi-riyal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m20 19.5-5.5 1.2" />  <path d="M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2" />  <path d="m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16V2" />  <path d="M20 10 4 13.5" /></svg>'
        );
      case "sausage":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 19a3 3 0 1 1-6 0A11 11 0 0 0 5 8a3 3 0 1 1 0-6 17 17 0 0 1 17 17" />  <path d="M12.8 11.2 2 22" />  <path d="m9.2 8.8-2.5 2.5a3.1 3.1 0 0 0 0 4.2l1.8 1.8a3.1 3.1 0 0 0 4.2 0l2.5-2.5" /></svg>'
        );
      case "save-all":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v3a1 1 0 0 0 1 1h5" />  <path d="M18 18v-6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6" />  <path d="M18 22H4a2 2 0 0 1-2-2V6" />  <path d="M8 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9.172a2 2 0 0 1 1.414.586l2.828 2.828A2 2 0 0 1 22 6.828V16a2 2 0 0 1-2.01 2z" /></svg>'
        );
      case "save-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 13H8a1 1 0 0 0-1 1v7" />  <path d="M14 8h1" />  <path d="M17 21v-4" />  <path d="m2 2 20 20" />  <path d="M20.41 20.41A2 2 0 0 1 19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 .59-1.41" />  <path d="M29.5 11.5s5 5 4 5" />  <path d="M9 3h6.2a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V15" /></svg>'
        );
      case "save":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />  <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />  <path d="M7 3v4a1 1 0 0 0 1 1h7" /></svg>'
        );
      case "scale-3d":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 7v11a1 1 0 0 0 1 1h11" />  <path d="M5.293 18.707 11 13" />  <circle cx="19" cy="19" r="2" />  <circle cx="5" cy="5" r="2" /></svg>'
        );
      case "scale":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />  <path d="M7 21h10" />  <path d="M12 3v18" />  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>'
        );
      case "scaling":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />  <path d="M14 15H9v-5" />  <path d="M16 3h5v5" />  <path d="M21 3 9 15" /></svg>'
        );
      case "scan-barcode":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <path d="M8 7v10" />  <path d="M12 7v10" />  <path d="M17 7v10" /></svg>'
        );
      case "scan-eye":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <circle cx="12" cy="12" r="1" />  <path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" /></svg>'
        );
      case "scan-face":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <path d="M8 14s1.5 2 4 2 4-2 4-2" />  <path d="M9 9h.01" />  <path d="M15 9h.01" /></svg>'
        );
      case "scan-heart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <path d="M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 4.172 4.306l-3.447 3.62a1 1 0 0 1-1.449 0z" /></svg>'
        );
      case "scan-line":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <path d="M7 12h10" /></svg>'
        );
      case "scan-qr-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 12v4a1 1 0 0 1-1 1h-4" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M17 8V7" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M7 17h.01" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <rect x="7" y="7" width="5" height="5" rx="1" /></svg>'
        );
      case "scan-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <circle cx="12" cy="12" r="3" />  <path d="m16 16-1.9-1.9" /></svg>'
        );
      case "scan-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />  <path d="M7 8h8" />  <path d="M7 12h10" />  <path d="M7 16h6" /></svg>'
        );
      case "scan":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7V5a2 2 0 0 1 2-2h2" />  <path d="M17 3h2a2 2 0 0 1 2 2v2" />  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />  <path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>'
        );
      case "scarf":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.5 2.5 7 15c-.5.5-.6 1.5-.2 2L9 20 21.6 7.6a2 1.7 0 0 0 .1-1.9l-2-3c-.2-.4-.7-.7-1.2-.7h-13c-.5 0-1 .3-1.2.7l-2 3a2 1.7 0 0 0 .2 2l6 5.8" />  <path d="M12 10 4.5 2.5" />  <path d="M13 20v2" />  <path d="M16 6H8" />  <path d="M17 12.1V22" />  <path d="M17 18h4" />  <path d="M17 20H9v2" />  <path d="M21 8.2V20" /></svg>'
        );
      case "school":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 21v-3a2 2 0 0 0-4 0v3" />  <path d="M18 5v16" />  <path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" />  <path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" />  <path d="M6 5v16" />  <circle cx="12" cy="9" r="2" /></svg>'
        );
      case "scissors-hair-comb":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 2C5 5 7 5 6 8" />  <path d="M10 2c-1 3 1 3 0 6" />  <circle cx="4" cy="20" r="2" />  <path d="M5.4 18.6 8 16" />  <path d="M10.8 13.2 14 10" />  <circle cx="12" cy="20" r="2" />  <path d="m2 10 8.6 8.6" />  <path d="M18 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2" />  <path d="M18 6h4" />  <path d="M18 10h4" />  <path d="M18 14h4" />  <path d="M18 18h4" /></svg>'
        );
      case "scissors-line-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.42 9.42 8 12" />  <circle cx="4" cy="8" r="2" />  <path d="m14 6-8.58 8.58" />  <circle cx="4" cy="16" r="2" />  <path d="M10.8 14.8 14 18" />  <path d="M16 12h-2" />  <path d="M22 12h-2" /></svg>'
        );
      case "scissors":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="6" r="3" />  <path d="M8.12 8.12 12 12" />  <path d="M20 4 8.12 15.88" />  <circle cx="6" cy="18" r="3" />  <path d="M14.8 14.8 20 20" /></svg>'
        );
      case "screen-share-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />  <path d="M8 21h8" />  <path d="M12 17v4" />  <path d="m22 3-5 5" />  <path d="m17 3 5 5" /></svg>'
        );
      case "screen-share":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />  <path d="M8 21h8" />  <path d="M12 17v4" />  <path d="m17 8 5-5" />  <path d="M17 3h5v5" /></svg>'
        );
      case "scroll-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 12h-5" />  <path d="M15 8h-5" />  <path d="M19 17V5a2 2 0 0 0-2-2H4" />  <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" /></svg>'
        );
      case "scroll":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 17V5a2 2 0 0 0-2-2H4" />  <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" /></svg>'
        );
      case "search-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m8 11 2 2 4-4" />  <circle cx="11" cy="11" r="8" />  <path d="m21 21-4.3-4.3" /></svg>'
        );
      case "search-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13 13.5 2-2.5-2-2.5" />  <path d="m21 21-4.3-4.3" />  <path d="M9 8.5 7 11l2 2.5" />  <circle cx="11" cy="11" r="8" /></svg>'
        );
      case "search-slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13.5 8.5-5 5" />  <circle cx="11" cy="11" r="8" />  <path d="m21 21-4.3-4.3" /></svg>'
        );
      case "search-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m13.5 8.5-5 5" />  <path d="m8.5 8.5 5 5" />  <circle cx="11" cy="11" r="8" />  <path d="m21 21-4.3-4.3" /></svg>'
        );
      case "search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21 21-4.34-4.34" />  <circle cx="11" cy="11" r="8" /></svg>'
        );
      case "section":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 5a4 3 0 0 0-8 0c0 4 8 3 8 7a4 3 0 0 1-8 0" />  <path d="M8 19a4 3 0 0 0 8 0c0-4-8-3-8-7a4 3 0 0 1 8 0" /></svg>'
        );
      case "send-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />  <path d="M6 12h16" /></svg>'
        );
      case "send-to-back":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="14" y="14" width="8" height="8" rx="2" />  <rect x="2" y="2" width="8" height="8" rx="2" />  <path d="M7 14v1a2 2 0 0 0 2 2h1" />  <path d="M14 7h1a2 2 0 0 1 2 2v1" /></svg>'
        );
      case "send":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />  <path d="m21.854 2.147-10.94 10.939" /></svg>'
        );
      case "separator-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 16-4 4-4-4" />  <path d="M3 12h18" />  <path d="m8 8 4-4 4 4" /></svg>'
        );
      case "separator-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v18" />  <path d="m16 16 4-4-4-4" />  <path d="m8 8-4 4 4 4" /></svg>'
        );
      case "server-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10.852 14.772-.383.923" />  <path d="M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923" />  <path d="m13.148 9.228.383-.923" />  <path d="m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544" />  <path d="m14.772 10.852.923-.383" />  <path d="m14.772 13.148.923.383" />  <path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" />  <path d="M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" />  <path d="M6 18h.01" />  <path d="M6 6h.01" />  <path d="m9.228 10.852-.923-.383" />  <path d="m9.228 13.148-.923.383" /></svg>'
        );
      case "server-crash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />  <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />  <path d="M6 6h.01" />  <path d="M6 18h.01" />  <path d="m13 6-4 6h6l-4 6" /></svg>'
        );
      case "server-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5" />  <path d="M10 10 2.5 2.5C2 2 2 2.5 2 5v3a2 2 0 0 0 2 2h6z" />  <path d="M22 17v-1a2 2 0 0 0-2-2h-1" />  <path d="M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16.5l1-.5.5.5-8-8H4z" />  <path d="M6 18h.01" />  <path d="m2 2 20 20" /></svg>'
        );
      case "server":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />  <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />  <line x1="6" x2="6.01" y1="6" y2="6" />  <line x1="6" x2="6.01" y1="18" y2="18" /></svg>'
        );
      case "settings-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 17H5" />  <path d="M19 7h-9" />  <circle cx="17" cy="17" r="3" />  <circle cx="7" cy="7" r="3" /></svg>'
        );
      case "settings":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />  <circle cx="12" cy="12" r="3" /></svg>'
        );
      case "shapes":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />  <rect x="3" y="14" width="7" height="7" rx="1" />  <circle cx="17.5" cy="17.5" r="3.5" /></svg>'
        );
      case "share-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="18" cy="5" r="3" />  <circle cx="6" cy="12" r="3" />  <circle cx="18" cy="19" r="3" />  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />  <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>'
        );
      case "share":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v13" />  <path d="m16 6-4-4-4 4" />  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /></svg>'
        );
      case "shark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.6 15a9.07 9.07 0 0 0 11.7 5.3S19 22 22 22c0 0-1-3-3-4.5 1.1-1.5 1.9-3.3 2-5.3l-8 4.6a1.94 1.94 0 1 1-2-3.4l6-3.5s5-2.8 5-6.8c0-.6-.4-1-1-1h-9c-1.8 0-3.4.5-4.8 1.5C5.7 2.5 3.9 2 2 2c0 0 1.4 2.1 2.3 4.5A10.63 10.63 0 0 0 3.1 13" />  <path d="M13.8 7 13 6" />  <path d="M21.12 6h-3.5c-1.1 0-2.8.5-3.82 1L9 9.8C3 11 2 15 2 15h4" /></svg>'
        );
      case "shave-face":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 20a7 7 0 0 1-7-7V4c0-.6.4-1 1-1h6" />  <path d="M7 7h.01" />  <path d="M11 13h3V4c0-.6.4-1 1-1h6" />  <path d="M18 7h.01" />  <path d="M14 19v2" />  <path d="m18 17 1.5 1.5" />  <path d="M19 13h2" /></svg>'
        );
      case "sheet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <line x1="3" x2="21" y1="9" y2="9" />  <line x1="3" x2="21" y1="15" y2="15" />  <line x1="9" x2="9" y1="9" y2="21" />  <line x1="15" x2="15" y1="9" y2="21" /></svg>'
        );
      case "shell":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 11a2 2 0 1 1-4 0 4 4 0 0 1 8 0 6 6 0 0 1-12 0 8 8 0 0 1 16 0 10 10 0 1 1-20 0 11.93 11.93 0 0 1 2.42-7.22 2 2 0 1 1 3.16 2.44" /></svg>'
        );
      case "shield-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M12 8v4" />  <path d="M12 16h.01" /></svg>'
        );
      case "shield-ban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="m4.243 5.21 14.39 12.472" /></svg>'
        );
      case "shield-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="m9 12 2 2 4-4" /></svg>'
        );
      case "shield-ellipsis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M8 12h.01" />  <path d="M12 12h.01" />  <path d="M16 12h.01" /></svg>'
        );
      case "shield-half":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M12 22V2" /></svg>'
        );
      case "shield-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M9 12h6" /></svg>'
        );
      case "shield-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 2 20 20" />  <path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71" />  <path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264" /></svg>'
        );
      case "shield-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M9 12h6" />  <path d="M12 9v6" /></svg>'
        );
      case "shield-question-mark":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />  <path d="M12 17h.01" /></svg>'
        );
      case "shield-user":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />  <circle cx="12" cy="11" r="4" /></svg>'
        );
      case "shield-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />  <path d="m14.5 9.5-5 5" />  <path d="m9.5 9.5 5 5" /></svg>'
        );
      case "shield":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>'
        );
      case "ship-wheel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="8" />  <path d="M12 2v7.5" />  <path d="m19 5-5.23 5.23" />  <path d="M22 12h-7.5" />  <path d="m19 19-5.23-5.23" />  <path d="M12 14.5V22" />  <path d="M10.23 13.77 5 19" />  <path d="M9.5 12H2" />  <path d="M10.23 10.23 5 5" />  <circle cx="12" cy="12" r="2.5" /></svg>'
        );
      case "ship":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10.189V14" />  <path d="M12 2v3" />  <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />  <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76" />  <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>'
        );
      case "shirt-folded-buttons":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 21H5a2 2 0 0 1-2-2V4c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v15a2 2 0 1 0 4 0V7c0-.6-.4-1-1-1h-3" />  <path d="M7 3v1a3 3 0 1 0 6 0V3" />  <path d="M10 11h.01" />  <path d="M10 15h.01" /></svg>'
        );
      case "shirt-long-sleeve":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 19H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2a4 4 0 0 0 8 0l4.1 1.4C21.2 3.7 22 4.9 22 6v12c0 .6-.4 1-1 1h-3" />  <path d="M18 8v13c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V8" /></svg>'
        );
      case "shirt-t-ruler":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 11H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2a4 4 0 0 0 8 0l4.1 1.4C21.2 3.7 22 4.9 22 6v4c0 .6-.4 1-1 1h-3" />  <path d="M6 18V8" />  <path d="M18 8v10" />  <rect width="20" height="6" x="2" y="16" rx="2" />  <path d="M10 16v2" />  <path d="M14 16v2" /></svg>'
        );
      case "shirt-t-v-neck":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 11H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2c0 2.2 3 5 4 5s4-2.8 4-5l4.1 1.4C21.2 3.7 22 4.9 22 6v4c0 .6-.4 1-1 1h-3" />  <path d="M18 8v13c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V8" /></svg>'
        );
      case "shirt-t":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 11H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2a4 4 0 0 0 8 0l4.1 1.4C21.2 3.7 22 4.9 22 6v4c0 .6-.4 1-1 1h-3" />  <path d="M18 8v13c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V8" /></svg>'
        );
      case "shirt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" /></svg>'
        );
      case "shopping-bag":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 10a4 4 0 0 1-8 0" />  <path d="M3.103 6.034h17.794" />  <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" /></svg>'
        );
      case "shopping-basket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 11-1 9" />  <path d="m19 11-4-7" />  <path d="M2 11h20" />  <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />  <path d="M4.5 15.5h15" />  <path d="m5 11 4-7" />  <path d="m9 11 1 9" /></svg>'
        );
      case "shopping-cart":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="8" cy="21" r="1" />  <circle cx="19" cy="21" r="1" />  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>'
        );
      case "shorts-boxer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.7 15.8 9 20H4a2 2 0 0 1-2-2V5c0-.6.4-1 1-1h18c.6 0 1 .4 1 1v13a2 2 0 0 1-2 2h-5l-1.7-4.2" />  <path d="M2 8h20" />  <path d="M16 8v4a4 4 0 0 1-8 0V8" /></svg>'
        );
      case "shorts":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 8h20" />  <path d="M9 20H4a2 2 0 0 1-2-2V5c0-.6.4-1 1-1h18c.6 0 1 .4 1 1v13a2 2 0 0 1-2 2h-5l-3-5Z" />  <path d="M9 12V8" />  <path d="M15 8v4" />  <path d="m5 13-3 2" />  <path d="m22 15-3-2" /></svg>'
        );
      case "shovel-dig":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 6.5c-1.7 0-3-1.3-3-3V2h6v1.5c0 1.7-1.3 3-3 3" />  <path d="M12 16V6.5" />  <path d="M8 22v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />  <path d="M6 22h12" /></svg>'
        );
      case "shovel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.56 4.56a1.5 1.5 0 0 1 0 2.122l-.47.47a3 3 0 0 1-4.212-.03 3 3 0 0 1 0-4.243l.44-.44a1.5 1.5 0 0 1 2.121 0z" />  <path d="M3 22a1 1 0 0 1-1-1v-3.586a1 1 0 0 1 .293-.707l3.355-3.355a1.205 1.205 0 0 1 1.704 0l3.296 3.296a1.205 1.205 0 0 1 0 1.704l-3.355 3.355a1 1 0 0 1-.707.293z" />  <path d="m9 15 7.879-7.878" /></svg>'
        );
      case "shower-head":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m4 4 2.5 2.5" />  <path d="M13.5 6.5a4.95 4.95 0 0 0-7 7" />  <path d="M15 5 5 15" />  <path d="M14 17v.01" />  <path d="M10 16v.01" />  <path d="M13 13v.01" />  <path d="M16 10v.01" />  <path d="M11 20v.01" />  <path d="M17 14v.01" />  <path d="M20 11v.01" /></svg>'
        );
      case "shower":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 10V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />  <path d="M7 10h14" />  <path d="M3 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2" />  <path d="M10 14h.01" />  <path d="M14 14h.01" />  <path d="M18 14h.01" />  <path d="M9 18h.01" />  <path d="M14 18h.01" />  <path d="M19 18h.01" />  <path d="M8 22h.01" />  <path d="M14 22h.01" />  <path d="M20 22h.01" /></svg>'
        );
      case "shredder":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 22v-5" />  <path d="M14 19v-2" />  <path d="M14 2v4a2 2 0 0 0 2 2h4" />  <path d="M18 20v-3" />  <path d="M2 13h20" />  <path d="M20 13V7l-5-5H6a2 2 0 0 0-2 2v9" />  <path d="M6 20v-3" /></svg>'
        );
      case "shrimp":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 12h.01" />  <path d="M13 22c.5-.5 1.12-1 2.5-1-1.38 0-2-.5-2.5-1" />  <path d="M14 2a3.28 3.28 0 0 1-3.227 1.798l-6.17-.561A2.387 2.387 0 1 0 4.387 8H15.5a1 1 0 0 1 0 13 1 1 0 0 0 0-5H12a7 7 0 0 1-7-7V8" />  <path d="M14 8a8.5 8.5 0 0 1 0 8" />  <path d="M16 16c2 0 4.5-4 4-6" /></svg>'
        );
      case "shrink":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" />  <path d="M9 19.8V15m0 0H4.2M9 15l-6 6" />  <path d="M15 4.2V9m0 0h4.8M15 9l6-6" />  <path d="M9 4.2V9m0 0H4.2M9 9 3 3" /></svg>'
        );
      case "shrub":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22v-5.172a2 2 0 0 0-.586-1.414L9.5 13.5" />  <path d="M14.5 14.5 12 17" />  <path d="M17 8.8A6 6 0 0 1 13.8 20H10A6.5 6.5 0 0 1 7 8a5 5 0 0 1 10 0z" /></svg>'
        );
      case "shuffle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 14 4 4-4 4" />  <path d="m18 2 4 4-4 4" />  <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />  <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />  <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" /></svg>'
        );
      case "sigma":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2" /></svg>'
        );
      case "signal-high":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20h.01" />  <path d="M7 20v-4" />  <path d="M12 20v-8" />  <path d="M17 20V8" /></svg>'
        );
      case "signal-low":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20h.01" />  <path d="M7 20v-4" /></svg>'
        );
      case "signal-medium":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20h.01" />  <path d="M7 20v-4" />  <path d="M12 20v-8" /></svg>'
        );
      case "signal-zero":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20h.01" /></svg>'
        );
      case "signal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 20h.01" />  <path d="M7 20v-4" />  <path d="M12 20v-8" />  <path d="M17 20V8" />  <path d="M22 4v16" /></svg>'
        );
      case "signature":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284" />  <path d="M3 21h18" /></svg>'
        );
      case "signpost-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 9H4L2 7l2-2h6" />  <path d="M14 5h6l2 2-2 2h-6" />  <path d="M10 22V4a2 2 0 1 1 4 0v18" />  <path d="M8 22h8" /></svg>'
        );
      case "signpost":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13v8" />  <path d="M12 3v3" />  <path d="M18 6a2 2 0 0 1 1.387.56l2.307 2.22a1 1 0 0 1 0 1.44l-2.307 2.22A2 2 0 0 1 18 13H6a2 2 0 0 1-1.387-.56l-2.306-2.22a1 1 0 0 1 0-1.44l2.306-2.22A2 2 0 0 1 6 6z" /></svg>'
        );
      case "siren":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 18v-6a5 5 0 1 1 10 0v6" />  <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" />  <path d="M21 12h1" />  <path d="M18.5 4.5 18 5" />  <path d="M2 12h1" />  <path d="M12 2v1" />  <path d="m4.929 4.929.707.707" />  <path d="M12 12v6" /></svg>'
        );
      case "skip-back":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z" />  <path d="M3 20V4" /></svg>'
        );
      case "skip-forward":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 4v16" />  <path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" /></svg>'
        );
      case "skirt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="12" height="4" x="6" y="3" />  <path d="M6 7c0 1.7-.4 3.3-1 4.4C3.8 13.6 2 17 2 17s1.8 1.2 4.5 2.1" />  <path d="m8 16-2 4s2.7 1 6 1 6-1 6-1l-2-4" />  <path d="M17.5 19.1C20.2 18.2 22 17 22 17s-1.8-3.4-3-5.6c-.6-1.1-1-2.7-1-4.4" /></svg>'
        );
      case "skis":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 4 3-1" />  <path d="m3 2 7 20" />  <path d="M10 2 3 22" />  <path d="m2 20 3 1" />  <path d="M22 22V6c0-2.2-2-4-2-4s-2 1.8-2 4c0-2.2-2-4-2-4s-2 1.8-2 4v16Z" />  <path d="M18 6v16" /></svg>'
        );
      case "skull":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12.5 17-.5-1-.5 1h1z" />  <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" />  <circle cx="15" cy="12" r="1" />  <circle cx="9" cy="12" r="1" /></svg>'
        );
      case "slack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="3" height="8" x="13" y="2" rx="1.5" />  <path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5" />  <rect width="3" height="8" x="8" y="14" rx="1.5" />  <path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5" />  <rect width="8" height="3" x="14" y="13" rx="1.5" />  <path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5" />  <rect width="8" height="3" x="2" y="8" rx="1.5" />  <path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5" /></svg>'
        );
      case "slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 2 2 22" /></svg>'
        );
      case "slice":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 16.586V19a1 1 0 0 1-1 1H2L18.37 3.63a1 1 0 1 1 3 3l-9.663 9.663a1 1 0 0 1-1.414 0L8 14" /></svg>'
        );
      case "sliders-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="21" x2="14" y1="4" y2="4" />  <line x1="10" x2="3" y1="4" y2="4" />  <line x1="21" x2="12" y1="12" y2="12" />  <line x1="8" x2="3" y1="12" y2="12" />  <line x1="21" x2="16" y1="20" y2="20" />  <line x1="12" x2="3" y1="20" y2="20" />  <line x1="14" x2="14" y1="2" y2="6" />  <line x1="8" x2="8" y1="10" y2="14" />  <line x1="16" x2="16" y1="18" y2="22" /></svg>'
        );
      case "sliders-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="4" x2="4" y1="21" y2="14" />  <line x1="4" x2="4" y1="10" y2="3" />  <line x1="12" x2="12" y1="21" y2="12" />  <line x1="12" x2="12" y1="8" y2="3" />  <line x1="20" x2="20" y1="21" y2="16" />  <line x1="20" x2="20" y1="12" y2="3" />  <line x1="2" x2="6" y1="14" y2="14" />  <line x1="10" x2="14" y1="8" y2="8" />  <line x1="18" x2="22" y1="16" y2="16" /></svg>'
        );
      case "slot-card-credit":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 13H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3" />  <path d="M6 9h12" />  <path d="M17 9v8.3c0 .9-.9 1.7-2 1.7H9c-1.1 0-2-.7-2-1.7V9" />  <path d="M11 9v10" /></svg>'
        );
      case "slot-card":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 13H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3" />  <path d="M6 9h12" />  <path d="m13 9 4 4v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9" /></svg>'
        );
      case "slot-disc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 13H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />  <path d="M6 9h12" />  <circle cx="12" cy="14" r=".5" />  <path d="M8.7 9a6.07 6.07 0 1 0 6.6 0" /></svg>'
        );
      case "smartphone-charging":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />  <path d="M12.667 8 10 12h4l-2.667 4" /></svg>'
        );
      case "smartphone-nfc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="7" height="12" x="2" y="6" rx="1" />  <path d="M13 8.32a7.43 7.43 0 0 1 0 7.36" />  <path d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58" />  <path d="M19.91 4.1a15.91 15.91 0 0 1 .01 15.8" /></svg>'
        );
      case "smartphone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />  <path d="M12 18h.01" /></svg>'
        );
      case "smile-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 11v1a10 10 0 1 1-9-10" />  <path d="M8 14s1.5 2 4 2 4-2 4-2" />  <line x1="9" x2="9.01" y1="9" y2="9" />  <line x1="15" x2="15.01" y1="9" y2="9" />  <path d="M16 5h6" />  <path d="M19 2v6" /></svg>'
        );
      case "smile":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M8 14s1.5 2 4 2 4-2 4-2" />  <line x1="9" x2="9.01" y1="9" y2="9" />  <line x1="15" x2="15.01" y1="9" y2="9" /></svg>'
        );
      case "snail":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" />  <circle cx="10" cy="13" r="8" />  <path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" />  <path d="M18 3 19.1 5.2" />  <path d="M22 3 20.9 5.2" /></svg>'
        );
      case "sneaker":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.1 7.9 12.5 10" />  <path d="M17.4 10.1 16 12" />  <path d="M2 16a2 2 0 0 0 2 2h13c2.8 0 5-2.2 5-5a2 2 0 0 0-2-2c-.8 0-1.6-.2-2.2-.7l-6.2-4.2c-.4-.3-.9-.2-1.3.1 0 0-.6.8-1.2 1.1a3.5 3.5 0 0 1-4.2.1C4.4 7 3.7 6.3 3.7 6.3A.92.92 0 0 0 2 7Z" />  <path d="M2 11c0 1.7 1.3 3 3 3h7" /></svg>'
        );
      case "snowboard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 6a4 4 0 0 0-7.2-2.3c-4.2 5.8-5.3 6.9-11.1 11.1a4 4 0 1 0 5.5 5.5c4.2-5.8 5.3-6.9 11.1-11.1 1-.7 1.7-1.9 1.7-3.2" />  <path d="M6.15 13H11v4.85" /></svg>'
        );
      case "snowflake":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 20-1.25-2.5L6 18" />  <path d="M10 4 8.75 6.5 6 6" />  <path d="m14 20 1.25-2.5L18 18" />  <path d="m14 4 1.25 2.5L18 6" />  <path d="m17 21-3-6h-4" />  <path d="m17 3-3 6 1.5 3" />  <path d="M2 12h6.5L10 9" />  <path d="m20 10-1.5 2 1.5 2" />  <path d="M22 12h-6.5L14 15" />  <path d="m4 10 1.5 2L4 14" />  <path d="m7 21 3-6-1.5-3" />  <path d="m7 3 3 6h4" /></svg>'
        );
      case "snowman":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="6" r="4" />  <path d="M12 14h.01" />  <path d="M12 18h.01" />  <path d="M2 9h2V7" />  <path d="M7 12 4 9" />  <path d="M17.8 11.1 20 9" />  <path d="M20 7v2h2" />  <path d="M9 8.7a7 7 0 1 0 6 0" />  <path d="M5 22h14" /></svg>'
        );
      case "soap-bar":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.3 2.7c.9-.9 2.5-.9 3.4 0l5.6 5.6c.9.9.9 2.5 0 3.4l-8.6 8.6c-.9.9-2.5.9-3.4 0l-5.6-5.6c-.9-.9-.9-2.5 0-3.4Z" />  <path d="m13 7-6 6 3 3 6-6Z" />  <circle cx="20.5" cy="17.5" r=".5" />  <circle cx="17.5" cy="21.5" r=".5" />  <path d="M22 22h.01" /></svg>'
        );
      case "soap-dispenser-droplet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 2v4" />  <path d="M14 2H7a2 2 0 0 0-2 2" />  <path d="M19.29 14.76A6.67 6.67 0 0 1 17 11a6.6 6.6 0 0 1-2.29 3.76c-1.15.92-1.71 2.04-1.71 3.19 0 2.22 1.8 4.05 4 4.05s4-1.83 4-4.05c0-1.16-.57-2.26-1.71-3.19" />  <path d="M9.607 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>'
        );
      case "soccer-ball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M11.9 6.7s-3 1.3-5 3.6c0 0 0 3.6 1.9 5.9 0 0 3.1.7 6.2 0 0 0 1.9-2.3 1.9-5.9 0 .1-2-2.3-5-3.6" />  <path d="M11.9 6.7V2" />  <path d="M16.9 10.4s3-1.4 4.5-1.6" />  <path d="M15 16.3s1.9 2.7 2.9 3.7" />  <path d="M8.8 16.3S6.9 19 6 20" />  <path d="M2.6 8.7C4 9 7 10.4 7 10.4" /></svg>'
        );
      case "soccer-pitch":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 5v5" />  <path d="M12 14v5" />  <circle cx="12" cy="12" r="2" />  <path d="M2 9h4v6H2" />  <path d="M3 19c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1h18c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1Z" />  <path d="M22 15h-4V9h4" /></svg>'
        );
      case "socket-eu":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <circle cx="12" cy="12" r="6" />  <path d="M10 12h.01" />  <path d="M14 12h.01" /></svg>'
        );
      case "socket-uk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <path d="M12 8v2" />  <path d="M10 15H8" />  <path d="M14 15h2" /></svg>'
        );
      case "socket-usa":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <circle cx="12" cy="12" r="6" />  <path d="M10 11v2" />  <path d="M14 11v2" /></svg>'
        );
      case "socks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9.6 20.4 9 21a3.38 3.38 0 1 1-4.9-4.9l3.5-3.5C8.4 11.6 9 10.4 9 9V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v10a5.15 5.15 0 0 1-1.5 3.6L15 21a3.38 3.38 0 1 1-4.9-4.9l3.5-3.5c.8-1 1.4-2.2 1.4-3.6V2" />  <path d="M9 6h12" /></svg>'
        );
      case "sofa":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />  <path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />  <path d="M4 18v2" />  <path d="M20 18v2" />  <path d="M12 4v9" /></svg>'
        );
      case "soup":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />  <path d="M7 21h10" />  <path d="M19.5 12 22 6" />  <path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62" />  <path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62" />  <path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62" /></svg>'
        );
      case "space":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" /></svg>'
        );
      case "spade":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 18v4" />  <path d="M2 14.499a5.5 5.5 0 0 0 9.591 3.675.6.6 0 0 1 .818.001A5.5 5.5 0 0 0 22 14.5c0-2.29-1.5-4-3-5.5l-5.492-5.312a2 2 0 0 0-3-.02L5 8.999c-1.5 1.5-3 3.2-3 5.5" /></svg>'
        );
      case "sparkle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /></svg>'
        );
      case "sparkles":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />  <path d="M20 2v4" />  <path d="M22 4h-4" />  <circle cx="4" cy="20" r="2" /></svg>'
        );
      case "speaker":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="16" height="20" x="4" y="2" rx="2" />  <path d="M12 6h.01" />  <circle cx="12" cy="14" r="4" />  <path d="M12 14h.01" /></svg>'
        );
      case "speech":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 20" />  <path d="M19.8 17.8a7.5 7.5 0 0 0 .003-10.603" />  <path d="M17 15a3.5 3.5 0 0 0-.025-4.975" /></svg>'
        );
      case "spell-check-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 16 6-12 6 12" />  <path d="M8 12h8" />  <path d="M4 21c1.1 0 1.1-1 2.3-1s1.1 1 2.3 1c1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1 1.1 0 1.1 1 2.3 1 1.1 0 1.1-1 2.3-1" /></svg>'
        );
      case "spell-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m6 16 6-12 6 12" />  <path d="M8 12h8" />  <path d="m16 20 2 2 4-4" /></svg>'
        );
      case "spider-web":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 17.2V6.8L12 2 3 6.8v10.4l9 4.8Z" />  <path d="M2 17.8 22 6.2" />  <path d="m2 6.2 20 11.6" />  <path d="M12 2v20" />  <path d="M17 14.9V9.1l-5-2.6-5 2.6v5.8l5 2.6Z" /></svg>'
        );
      case "spider":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 5v1" />  <path d="M14 6V5" />  <path d="M10 10.4V8a2 2 0 1 1 4 0v2.4" />  <path d="M7 15H4l-2 2.5" />  <path d="M7.42 17 5 20l1 2" />  <path d="m8 12-4-1-2-3" />  <path d="M9 11 5.5 6 7 2" />  <path d="M8 18a5 5 0 1 1 8 0s-2 3-4 4c-2-1-4-4-4-4" />  <path d="m15 11 3.5-5L17 2" />  <path d="m16 12 4-1 2-3" />  <path d="M17 15h3l2 2.5" />  <path d="M16.57 17 19 20l-1 2" /></svg>'
        );
      case "spline-pointer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />  <path d="M5 17A12 12 0 0 1 17 5" />  <circle cx="19" cy="5" r="2" />  <circle cx="5" cy="19" r="2" /></svg>'
        );
      case "spline":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="19" cy="5" r="2" />  <circle cx="5" cy="19" r="2" />  <path d="M5 17A12 12 0 0 1 17 5" /></svg>'
        );
      case "split":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3h5v5" />  <path d="M8 3H3v5" />  <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />  <path d="m15 9 6-6" /></svg>'
        );
      case "spool":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 13.44 4.442 17.082A2 2 0 0 0 4.982 21H19a2 2 0 0 0 .558-3.921l-1.115-.32A2 2 0 0 1 17 14.837V7.66" />  <path d="m7 10.56 12.558-3.642A2 2 0 0 0 19.018 3H5a2 2 0 0 0-.558 3.921l1.115.32A2 2 0 0 1 7 9.163v7.178" /></svg>'
        );
      case "spotlight":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.295 19.562 16 22" />  <path d="m17 16 3.758 2.098" />  <path d="m19 12.5 3.026-.598" />  <path d="M7.61 6.3a3 3 0 0 0-3.92 1.3l-1.38 2.79a3 3 0 0 0 1.3 3.91l6.89 3.597a1 1 0 0 0 1.342-.447l3.106-6.211a1 1 0 0 0-.447-1.341z" />  <path d="M8 9V2" /></svg>'
        );
      case "spray-can":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 3h.01" />  <path d="M7 5h.01" />  <path d="M11 7h.01" />  <path d="M3 7h.01" />  <path d="M7 9h.01" />  <path d="M3 11h.01" />  <rect width="4" height="4" x="15" y="5" />  <path d="m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2" />  <path d="m13 14 8-2" />  <path d="m13 19 8-2" /></svg>'
        );
      case "sprout":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />  <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />  <path d="M5 21h14" /></svg>'
        );
      case "square-activity":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M17 12h-2l-2 5-2-10-2 5H7" /></svg>'
        );
      case "square-arrow-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m16 8-8 8" />  <path d="M16 16H8V8" /></svg>'
        );
      case "square-arrow-down-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m8 8 8 8" />  <path d="M16 8v8H8" /></svg>'
        );
      case "square-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 8v8" />  <path d="m8 12 4 4 4-4" /></svg>'
        );
      case "square-arrow-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m12 8-4 4 4 4" />  <path d="M16 12H8" /></svg>'
        );
      case "square-arrow-out-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6" />  <path d="m3 21 9-9" />  <path d="M9 21H3v-6" /></svg>'
        );
      case "square-arrow-out-down-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />  <path d="m21 21-9-9" />  <path d="M21 15v6h-6" /></svg>'
        );
      case "square-arrow-out-up-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6" />  <path d="m3 3 9 9" />  <path d="M3 9V3h6" /></svg>'
        );
      case "square-arrow-out-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />  <path d="m21 3-9 9" />  <path d="M15 3h6v6" /></svg>'
        );
      case "square-arrow-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 12h8" />  <path d="m12 16 4-4-4-4" /></svg>'
        );
      case "square-arrow-up-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 16V8h8" />  <path d="M16 16 8 8" /></svg>'
        );
      case "square-arrow-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 8h8v8" />  <path d="m8 16 8-8" /></svg>'
        );
      case "square-arrow-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m16 12-4-4-4 4" />  <path d="M12 16V8" /></svg>'
        );
      case "square-asterisk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 8v8" />  <path d="m8.5 14 7-4" />  <path d="m8.5 10 7 4" /></svg>'
        );
      case "square-bottom-dashed-scissors":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2" />  <path d="M10 22H8" />  <path d="M16 22h-2" />  <circle cx="8" cy="8" r="2" />  <path d="M9.414 9.414 12 12" />  <path d="M14.8 14.8 18 18" />  <circle cx="8" cy="16" r="2" />  <path d="m18 6-8.586 8.586" /></svg>'
        );
      case "square-chart-gantt":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 8h7" />  <path d="M8 12h6" />  <path d="M11 16h5" /></svg>'
        );
      case "square-check-big":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />  <path d="m9 11 3 3L22 4" /></svg>'
        );
      case "square-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m9 12 2 2 4-4" /></svg>'
        );
      case "square-chevron-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m16 10-4 4-4-4" /></svg>'
        );
      case "square-chevron-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m14 16-4-4 4-4" /></svg>'
        );
      case "square-chevron-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m10 8 4 4-4 4" /></svg>'
        );
      case "square-chevron-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m8 14 4-4 4 4" /></svg>'
        );
      case "square-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 9-3 3 3 3" />  <path d="m14 15 3-3-3-3" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "square-dashed-bottom-code":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 9.5 8 12l2 2.5" />  <path d="M14 21h1" />  <path d="m14 9.5 2 2.5-2 2.5" />  <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" />  <path d="M9 21h1" /></svg>'
        );
      case "square-dashed-bottom":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" />  <path d="M9 21h1" />  <path d="M14 21h1" /></svg>'
        );
      case "square-dashed-kanban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 7v7" />  <path d="M12 7v4" />  <path d="M16 7v9" />  <path d="M5 3a2 2 0 0 0-2 2" />  <path d="M9 3h1" />  <path d="M14 3h1" />  <path d="M19 3a2 2 0 0 1 2 2" />  <path d="M21 9v1" />  <path d="M21 14v1" />  <path d="M21 19a2 2 0 0 1-2 2" />  <path d="M14 21h1" />  <path d="M9 21h1" />  <path d="M5 21a2 2 0 0 1-2-2" />  <path d="M3 14v1" />  <path d="M3 9v1" /></svg>'
        );
      case "square-dashed-mouse-pointer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />  <path d="M5 3a2 2 0 0 0-2 2" />  <path d="M19 3a2 2 0 0 1 2 2" />  <path d="M5 21a2 2 0 0 1-2-2" />  <path d="M9 3h1" />  <path d="M9 21h2" />  <path d="M14 3h1" />  <path d="M3 9v1" />  <path d="M21 9v2" />  <path d="M3 14v1" /></svg>'
        );
      case "square-dashed-top-solid":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 21h1" />  <path d="M21 14v1" />  <path d="M21 19a2 2 0 0 1-2 2" />  <path d="M21 9v1" />  <path d="M3 14v1" />  <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />  <path d="M3 9v1" />  <path d="M5 21a2 2 0 0 1-2-2" />  <path d="M9 21h1" /></svg>'
        );
      case "square-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 3a2 2 0 0 0-2 2" />  <path d="M19 3a2 2 0 0 1 2 2" />  <path d="M21 19a2 2 0 0 1-2 2" />  <path d="M5 21a2 2 0 0 1-2-2" />  <path d="M9 3h1" />  <path d="M9 21h1" />  <path d="M14 3h1" />  <path d="M14 21h1" />  <path d="M3 9v1" />  <path d="M21 9v1" />  <path d="M3 14v1" />  <path d="M21 14v1" /></svg>'
        );
      case "square-divide":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <line x1="8" x2="16" y1="12" y2="12" />  <line x1="12" x2="12" y1="16" y2="16" />  <line x1="12" x2="12" y1="8" y2="8" /></svg>'
        );
      case "square-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <circle cx="12" cy="12" r="1" /></svg>'
        );
      case "square-equal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 10h10" />  <path d="M7 14h10" /></svg>'
        );
      case "square-function":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />  <path d="M9 11.2h5.7" /></svg>'
        );
      case "square-kanban":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 7v7" />  <path d="M12 7v4" />  <path d="M16 7v9" /></svg>'
        );
      case "square-library":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 7v10" />  <path d="M11 7v10" />  <path d="m15 7 2 10" /></svg>'
        );
      case "square-m":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 16V8l4 4 4-4v8" /></svg>'
        );
      case "square-menu":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 8h10" />  <path d="M7 12h10" />  <path d="M7 16h10" /></svg>'
        );
      case "square-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 12h8" /></svg>'
        );
      case "square-mouse-pointer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />  <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /></svg>'
        );
      case "square-parking-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.6 3.6A2 2 0 0 1 5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-.59 1.41" />  <path d="M3 8.7V19a2 2 0 0 0 2 2h10.3" />  <path d="m2 2 20 20" />  <path d="M13 13a3 3 0 1 0 0-6H9v2" />  <path d="M9 17v-2.3" /></svg>'
        );
      case "square-parking":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></svg>'
        );
      case "square-pause":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <line x1="10" x2="10" y1="15" y2="9" />  <line x1="14" x2="14" y1="15" y2="9" /></svg>'
        );
      case "square-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />  <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" /></svg>'
        );
      case "square-percent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="m15 9-6 6" />  <path d="M9 9h.01" />  <path d="M15 15h.01" /></svg>'
        );
      case "square-pi":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 7h10" />  <path d="M10 7v10" />  <path d="M16 17a2 2 0 0 1-2-2V7" /></svg>'
        );
      case "square-pilcrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M12 12H9.5a2.5 2.5 0 0 1 0-5H17" />  <path d="M12 7v10" />  <path d="M16 7v10" /></svg>'
        );
      case "square-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="3" y="3" width="18" height="18" rx="2" />  <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" /></svg>'
        );
      case "square-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M8 12h8" />  <path d="M12 8v8" /></svg>'
        );
      case "square-power":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 7v4" />  <path d="M7.998 9.003a5 5 0 1 0 8-.005" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "square-radical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 12h2l2 5 2-10h4" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "square-round-corner":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 11a8 8 0 0 0-8-8" />  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>'
        );
      case "square-scissors":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="20" x="2" y="2" rx="2" />  <circle cx="8" cy="8" r="2" />  <path d="M9.414 9.414 12 12" />  <path d="M14.8 14.8 18 18" />  <circle cx="8" cy="16" r="2" />  <path d="m18 6-8.586 8.586" /></svg>'
        );
      case "square-sigma":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M16 8.9V7H8l4 5-4 5h8v-1.9" /></svg>'
        );
      case "square-slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <line x1="9" x2="15" y1="15" y2="9" /></svg>'
        );
      case "square-split-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3" />  <path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3" />  <line x1="12" x2="12" y1="4" y2="20" /></svg>'
        );
      case "square-split-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5 8V5c0-1 1-2 2-2h10c1 0 2 1 2 2v3" />  <path d="M19 16v3c0 1-1 2-2 2H7c-1 0-2-1-2-2v-3" />  <line x1="4" x2="20" y1="12" y2="12" /></svg>'
        );
      case "square-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect x="3" y="3" width="18" height="18" rx="2" />  <rect x="8" y="8" width="8" height="8" rx="1" /></svg>'
        );
      case "square-stack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" />  <path d="M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" />  <rect width="8" height="8" x="14" y="14" rx="2" /></svg>'
        );
      case "square-star":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.035 7.69a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />  <rect x="3" y="3" width="18" height="18" rx="2" /></svg>'
        );
      case "square-stop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <rect x="9" y="9" width="6" height="6" rx="1" /></svg>'
        );
      case "square-terminal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m7 11 2-2-2-2" />  <path d="M11 13h4" />  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /></svg>'
        );
      case "square-user-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 21a6 6 0 0 0-12 0" />  <circle cx="12" cy="11" r="4" />  <rect width="18" height="18" x="3" y="3" rx="2" /></svg>'
        );
      case "square-user":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <circle cx="12" cy="10" r="3" />  <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /></svg>'
        );
      case "square-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <path d="m15 9-6 6" />  <path d="m9 9 6 6" /></svg>'
        );
      case "square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" /></svg>'
        );
      case "squares-exclude":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 12v2a2 2 0 0 1-2 2H9a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h0" />  <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-5a2 2 0 0 0-2 2v2" /></svg>'
        );
      case "squares-intersect":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 22a2 2 0 0 1-2-2" />  <path d="M14 2a2 2 0 0 1 2 2" />  <path d="M16 22h-2" />  <path d="M2 10V8" />  <path d="M2 4a2 2 0 0 1 2-2" />  <path d="M20 8a2 2 0 0 1 2 2" />  <path d="M22 14v2" />  <path d="M22 20a2 2 0 0 1-2 2" />  <path d="M4 16a2 2 0 0 1-2-2" />  <path d="M8 10a2 2 0 0 1 2-2h5a1 1 0 0 1 1 1v5a2 2 0 0 1-2 2H9a1 1 0 0 1-1-1z" />  <path d="M8 2h2" /></svg>'
        );
      case "squares-subtract":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 22a2 2 0 0 1-2-2" />  <path d="M16 22h-2" />  <path d="M16 4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-5a2 2 0 0 1 2-2h5a1 1 0 0 0 1-1z" />  <path d="M20 8a2 2 0 0 1 2 2" />  <path d="M22 14v2" />  <path d="M22 20a2 2 0 0 1-2 2" /></svg>'
        );
      case "squares-unite":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1z" /></svg>'
        );
      case "squircle-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.77 3.043a34 34 0 0 0-3.54 0" />  <path d="M13.771 20.956a33 33 0 0 1-3.541.001" />  <path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" />  <path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" />  <path d="M20.957 10.23a33 33 0 0 1 0 3.54" />  <path d="M3.043 10.23a34 34 0 0 0 .001 3.541" />  <path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" />  <path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" /></svg>'
        );
      case "squircle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" /></svg>'
        );
      case "squirrel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.236 22a3 3 0 0 0-2.2-5" />  <path d="M16 20a3 3 0 0 1 3-3h1a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4V4" />  <path d="M18 13h.01" />  <path d="M18 6a4 4 0 0 0-4 4 7 7 0 0 0-7 7c0-5 4-5 4-10.5a4.5 4.5 0 1 0-9 0 2.5 2.5 0 0 0 5 0C7 10 3 11 3 17c0 2.8 2.2 5 5 5h10" /></svg>'
        );
      case "stairs-arch":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 21H3V11a9 9 0 1 1 18 0Z" />  <path d="M20.77 9H12v4" />  <path d="M8 17v-4h13" />  <path d="M3 17h18" /></svg>'
        );
      case "stairs-arrow-down-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 2-9 9" />  <path d="M3 7v4h4" />  <path d="M2 20h5v-5h5v-5h5V5h5" /></svg>'
        );
      case "stairs-arrow-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m3 11 9-9" />  <path d="M8 2h4v4" />  <path d="M2 20h5v-5h5v-5h5V5h5" /></svg>'
        );
      case "stairs":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="10" height="4" x="2" y="16" />  <rect width="10" height="4" x="4" y="12" />  <rect width="10" height="4" x="6" y="8" />  <rect width="10" height="4" x="8" y="4" />  <path d="M12 20h10V4h-4" /></svg>'
        );
      case "stamp":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />  <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />  <path d="M5 22h14" /></svg>'
        );
      case "star-half":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 18.338a2.1 2.1 0 0 0-.987.244L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16l2.309-4.679A.53.53 0 0 1 12 2" /></svg>'
        );
      case "star-north":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 12h18" />  <path d="M12 3v18" />  <path d="M17 7 7 17" />  <path d="m7 7 10 10" /></svg>'
        );
      case "star-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8.34 8.34 2 9.27l5 4.87L5.82 21 12 17.77 18.18 21l-.59-3.43" />  <path d="M18.42 12.76 22 9.27l-6.91-1L12 2l-1.44 2.91" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "star":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>'
        );
      case "steering-wheel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m3.3 7 7 4" />  <path d="m13.7 11 7-4" />  <path d="M12 14v8" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "step-back":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.971 4.285A2 2 0 0 1 17 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z" />  <path d="M21 20V4" /></svg>'
        );
      case "step-forward":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.029 4.285A2 2 0 0 0 7 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />  <path d="M3 4v16" /></svg>'
        );
      case "stethoscope":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 2v2" />  <path d="M5 2v2" />  <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />  <path d="M8 15a6 6 0 0 0 12 0v-3" />  <circle cx="20" cy="10" r="2" /></svg>'
        );
      case "sticker":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />  <path d="M14 3v4a2 2 0 0 0 2 2h4" />  <path d="M8 13h.01" />  <path d="M16 13h.01" />  <path d="M10 16s.8 1 2 1c1.3 0 2-1 2-1" /></svg>'
        );
      case "sticky-note":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />  <path d="M15 3v4a2 2 0 0 0 2 2h4" /></svg>'
        );
      case "store":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" />  <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244" />  <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" /></svg>'
        );
      case "strawberry":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 7 3.5-3.5" />  <path d="M17 2v5h5" />  <path d="M2.1 17.1a4 4 0 0 0 4.8 4.8l9-2.1a6.32 6.32 0 0 0 2.9-10.9L15 5.2A6.5 6.5 0 0 0 4.1 8.3Z" />  <path d="M8.5 9.5h.01" />  <path d="M12.5 8.5h.01" />  <path d="M7.5 13.5h.01" />  <path d="M11.5 12.5h.01" />  <path d="M15.5 11.5h.01" />  <path d="M6.5 17.5h.01" />  <path d="M10.5 16.5h.01" />  <path d="M14.5 15.5h.01" /></svg>'
        );
      case "stretch-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="6" x="2" y="4" rx="2" />  <rect width="20" height="6" x="2" y="14" rx="2" /></svg>'
        );
      case "stretch-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="6" height="20" x="4" y="2" rx="2" />  <rect width="6" height="20" x="14" y="2" rx="2" /></svg>'
        );
      case "strikethrough-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M10.5 12a2.5 2.5 0 0 1 0-5H15" />  <path d="M7 12h10" />  <path d="M8 17h5.5a2.5 2.5 0 0 0 0-5" /></svg>'
        );
      case "strikethrough":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 4H9a3 3 0 0 0-2.83 4" />  <path d="M14 12a4 4 0 0 1 0 8H6" />  <line x1="4" x2="20" y1="12" y2="12" /></svg>'
        );
      case "stroller":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 12.95c1.6-1.6 4.1-1.6 5.7.05" />  <circle cx="11" cy="6.5" r="2.5" />  <path d="M18.3 17.2 5.45 4.5" />  <path d="M19.7 17 13 18.1c-2.7.5-5.5-1-5.7-4.1-.4-2.6-.9-5.7-1.3-8.3A2 2 0 0 0 2 6" />  <circle cx="8" cy="19" r="2" />  <circle cx="20" cy="19" r="2" /></svg>'
        );
      case "subscript":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m4 5 8 8" />  <path d="m12 5-8 8" />  <path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07" /></svg>'
        );
      case "sun-dim":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="4" />  <path d="M12 4h.01" />  <path d="M20 12h.01" />  <path d="M12 20h.01" />  <path d="M4 12h.01" />  <path d="M17.657 6.343h.01" />  <path d="M17.657 17.657h.01" />  <path d="M6.343 17.657h.01" />  <path d="M6.343 6.343h.01" /></svg>'
        );
      case "sun-medium":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="4" />  <path d="M12 3v1" />  <path d="M12 20v1" />  <path d="M3 12h1" />  <path d="M20 12h1" />  <path d="m18.364 5.636-.707.707" />  <path d="m6.343 17.657-.707.707" />  <path d="m5.636 5.636.707.707" />  <path d="m17.657 17.657.707.707" /></svg>'
        );
      case "sun-moon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v2" />  <path d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715" />  <path d="M16 12a4 4 0 0 0-4-4" />  <path d="m19 5-1.256 1.256" />  <path d="M20 12h2" /></svg>'
        );
      case "sun-snow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 21v-1" />  <path d="M10 4V3" />  <path d="M10 9a3 3 0 0 0 0 6" />  <path d="m14 20 1.25-2.5L18 18" />  <path d="m14 4 1.25 2.5L18 6" />  <path d="m17 21-3-6 1.5-3H22" />  <path d="m17 3-3 6 1.5 3" />  <path d="M2 12h1" />  <path d="m20 10-1.5 2 1.5 2" />  <path d="m3.64 18.36.7-.7" />  <path d="m4.34 6.34-.7-.7" /></svg>'
        );
      case "sun":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="4" />  <path d="M12 2v2" />  <path d="M12 20v2" />  <path d="m4.93 4.93 1.41 1.41" />  <path d="m17.66 17.66 1.41 1.41" />  <path d="M2 12h2" />  <path d="M20 12h2" />  <path d="m6.34 17.66-1.41 1.41" />  <path d="m19.07 4.93-1.41 1.41" /></svg>'
        );
      case "sunlounger-parasol-sun-palmtree":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="4" cy="4" r="2" />  <path d="M16 14s1-3 1-8V4s-1-2-3-2c-1 0-2 .5-2 .5" />  <path d="M13 8a4 4 0 0 1 8 0" />  <path d="M17 4s1-2 3-2c1 0 2 .5 2 .5" />  <path d="m4 14 3-5 5 3Z" />  <path d="m8 13 2 8" />  <path d="m3 21 .7-2.1c.2-.5.7-.9 1.3-.9h12c.5 0 1.3-.4 1.6-.8L22 13" />  <path d="m21 21-3-3" /></svg>'
        );
      case "sunlounger-parasol-sun":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="20" cy="4" r="2" />  <path d="M2.4 14.4a7 7 0 0 1 13.2-4.8Z" />  <path d="m9 12 3 9" />  <path d="m3 21 .7-2.1c.2-.5.7-.9 1.3-.9h12c.5 0 1.3-.4 1.6-.8L22 13" />  <path d="m21 21-3-3" /></svg>'
        );
      case "sunlounger-parasol-table":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 8H3l9-6Z" />  <path d="M12 8v13" />  <path d="M8 13h8" />  <path d="m3 21 .7-2.1c.2-.5.7-.9 1.3-.9h12c.5 0 1.3-.4 1.6-.8L22 13" />  <path d="m21 21-3.2-3.2" /></svg>'
        );
      case "sunrise":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v8" />  <path d="m4.93 10.93 1.41 1.41" />  <path d="M2 18h2" />  <path d="M20 18h2" />  <path d="m19.07 10.93-1.41 1.41" />  <path d="M22 22H2" />  <path d="m8 6 4-4 4 4" />  <path d="M16 18a4 4 0 0 0-8 0" /></svg>'
        );
      case "sunset":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10V2" />  <path d="m4.93 10.93 1.41 1.41" />  <path d="M2 18h2" />  <path d="M20 18h2" />  <path d="m19.07 10.93-1.41 1.41" />  <path d="M22 22H2" />  <path d="m16 6-4 4-4-4" />  <path d="M16 18a4 4 0 0 0-8 0" /></svg>'
        );
      case "superscript":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m4 19 8-8" />  <path d="m12 19-8-8" />  <path d="M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06" /></svg>'
        );
      case "surfboard":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 2 2.6 21.4" />  <path d="M13.8 19.2A18 18 0 0 0 22 4V2h-2C10.1 2 2 10.1 2 20a2 2 0 0 0 2 2 17 17 0 0 0 7.63-1.7" />  <path d="M7 17c2.7 0 4.9 2.3 5 5a6.7 6.7 0 0 0-.1-9.9" /></svg>'
        );
      case "sushi-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.4 3.3a8.23 8.23 0 0 0-8.8 0L3.8 6c-2.4 1.7-2.4 4.4 0 6.1l3.9 2.7c2.4 1.7 6.3 1.7 8.7 0l3.9-2.7c2.4-1.7 2.4-4.4 0-6.1Z" />  <path d="M2 9v6c0 1.1.6 2.2 1.8 3l3.9 2.7c2.4 1.7 6.3 1.7 8.7 0l3.9-2.7c1.2-.8 1.8-1.9 1.8-3V9" />  <path d="M7.7 10.1c-.9-.6-.9-1.6 0-2.2l2.7-1.8c.9-.6 2.4-.6 3.3 0l2.7 1.8c.9.6.9 1.6 0 2.2l-2.7 1.8c-.9.6-2.4.6-3.3 0Z" />  <path d="M15 11c-2-3-5-2-6 0" /></svg>'
        );
      case "sushi-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 10a2 2 0 0 1-2 2h-.5l-5.6-1.4c-1.1-.3-2.8-.3-3.9 0L4.4 12H4a2 2 0 0 1-2-2 4 4 0 0 1 4-4h12a4 4 0 0 1 4 4" />  <path d="m6 11 1-5" />  <path d="m10 10 1-4" />  <path d="m14 10 1-4" />  <path d="m18 11 1-4" />  <path d="M20 12v4a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0v-4" /></svg>'
        );
      case "sushi-chopsticks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 18V2" />  <path d="M22 18V2" />  <path d="M6 11c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5v6c0 2.8-2.2 5-5 5h-2c-2.8 0-5-2.2-5-5Z" />  <path d="M18 13c0 2.8-2.2 5-5 5h-2c-2.8 0-5-2.2-5-5" />  <path d="M11 14c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1Z" /></svg>'
        );
      case "sushi":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="7" />  <rect width="8" height="8" x="8" y="8" rx="2" />  <path d="M12 8v8" />  <path d="M8 12h4" /></svg>'
        );
      case "swatch-book":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z" />  <path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7" />  <path d="M 7 17h.01" />  <path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8" /></svg>'
        );
      case "sweater":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 19H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2a4 4 0 0 0 8 0l4.1 1.4C21.2 3.7 22 4.9 22 6v12c0 .6-.4 1-1 1h-3" />  <path d="M18 8v13c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V8" />  <path d="m6 10 2 2 2-2 2 2 2-2 2 2 2-2" />  <path d="m6 16 2 2 2-2 2 2 2-2 2 2 2-2" /></svg>'
        );
      case "swiss-franc-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M10 17V7h5" />  <path d="M10 11h4" />  <path d="M8 15h5" /></svg>'
        );
      case "swiss-franc-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M10 17V7h5" />  <path d="M10 11h4" />  <path d="M8 15h5" /></svg>'
        );
      case "swiss-franc":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 21V3h8" />  <path d="M6 16h9" />  <path d="M10 9.5h7" /></svg>'
        );
      case "switch-camera":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />  <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />  <circle cx="12" cy="12" r="3" />  <path d="m18 22-3-3 3-3" />  <path d="m6 2 3 3-3 3" /></svg>'
        );
      case "sword":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />  <line x1="13" x2="19" y1="19" y2="13" />  <line x1="16" x2="20" y1="16" y2="20" />  <line x1="19" x2="21" y1="21" y2="19" /></svg>'
        );
      case "swords":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />  <line x1="13" x2="19" y1="19" y2="13" />  <line x1="16" x2="20" y1="16" y2="20" />  <line x1="19" x2="21" y1="21" y2="19" />  <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />  <line x1="5" x2="9" y1="14" y2="18" />  <line x1="7" x2="4" y1="17" y2="20" />  <line x1="3" x2="5" y1="19" y2="21" /></svg>'
        );
      case "syringe":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18 2 4 4" />  <path d="m17 7 3-3" />  <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />  <path d="m9 11 4 4" />  <path d="m5 19-3 3" />  <path d="m14 4 6 6" /></svg>'
        );
      case "tab-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16V8" />  <path d="m16 12-4 4-4-4" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-arrow-up-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15 9-6 6" />  <path d="M9 9h6v6" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 12 2 2 4-4" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="1" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 12H9" />  <path d="M12 9v6" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.5 9.5-5 5" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 8h6" />  <path d="M8 12h8" />  <path d="M8 16h6" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.5 9.5-5 5" />  <path d="m14.5 14.5-5-5" />  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "tab":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />  <path d="M22 20H2" /></svg>'
        );
      case "table-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>'
        );
      case "table-cells-merge":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 21v-6" />  <path d="M12 9V3" />  <path d="M3 15h18" />  <path d="M3 9h18" />  <rect width="18" height="18" x="3" y="3" rx="2" /></svg>'
        );
      case "table-cells-split":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 15V9" />  <path d="M3 15h18" />  <path d="M3 9h18" />  <rect width="18" height="18" x="3" y="3" rx="2" /></svg>'
        );
      case "table-columns-split":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 14v2" />  <path d="M14 20v2" />  <path d="M14 2v2" />  <path d="M14 8v2" />  <path d="M2 15h8" />  <path d="M2 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2" />  <path d="M2 9h8" />  <path d="M22 15h-4" />  <path d="M22 3h-2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />  <path d="M22 9h-4" />  <path d="M5 3v18" /></svg>'
        );
      case "table-of-contents":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 12H3" />  <path d="M16 18H3" />  <path d="M16 6H3" />  <path d="M21 12h.01" />  <path d="M21 18h.01" />  <path d="M21 6h.01" /></svg>'
        );
      case "table-properties":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 3v18" />  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M21 9H3" />  <path d="M21 15H3" /></svg>'
        );
      case "table-rows-split":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 10h2" />  <path d="M15 22v-8" />  <path d="M15 2v4" />  <path d="M2 10h2" />  <path d="M20 10h2" />  <path d="M3 19h18" />  <path d="M3 22v-6a2 2 135 0 1 2-2h14a2 2 45 0 1 2 2v6" />  <path d="M3 2v2a2 2 45 0 0 2 2h14a2 2 135 0 0 2-2V2" />  <path d="M8 10h2" />  <path d="M9 22v-8" />  <path d="M9 2v4" /></svg>'
        );
      case "table":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v18" />  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9h18" />  <path d="M3 15h18" /></svg>'
        );
      case "tablet-smartphone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="10" height="14" x="3" y="8" rx="2" />  <path d="M5 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2.4" />  <path d="M8 18h.01" /></svg>'
        );
      case "tablet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />  <line x1="12" x2="12.01" y1="18" y2="18" /></svg>'
        );
      case "tablets":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="7" cy="7" r="5" />  <circle cx="17" cy="17" r="5" />  <path d="M12 17h10" />  <path d="m3.46 10.54 7.08-7.08" /></svg>'
        );
      case "tag":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></svg>'
        );
      case "tags":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z" />  <path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" />  <circle cx="10.5" cy="6.5" r=".5" fill="currentColor" /></svg>'
        );
      case "tally-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 4v16" /></svg>'
        );
      case "tally-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 4v16" />  <path d="M9 4v16" /></svg>'
        );
      case "tally-3":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 4v16" />  <path d="M9 4v16" />  <path d="M14 4v16" /></svg>'
        );
      case "tally-4":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 4v16" />  <path d="M9 4v16" />  <path d="M14 4v16" />  <path d="M19 4v16" /></svg>'
        );
      case "tally-5":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 4v16" />  <path d="M9 4v16" />  <path d="M14 4v16" />  <path d="M19 4v16" />  <path d="M22 6 2 18" /></svg>'
        );
      case "tangent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="17" cy="4" r="2" />  <path d="M15.59 5.41 5.41 15.59" />  <circle cx="4" cy="17" r="2" />  <path d="M12 22s-4-9-1.5-11.5S22 12 22 12" /></svg>'
        );
      case "target-arrow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 2v3h3" />  <path d="M13.4 10.6 22 2" />  <circle cx="12" cy="12" r="2" />  <path d="M12.3 6H12a6 6 0 1 0 6 6v-.3" />  <path d="M15 2.5A9.93 9.93 0 1 0 21.5 9" />  <path d="M5.3 19.4 4 22" />  <path d="M18.7 19.4 20 22" /></svg>'
        );
      case "target":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="6" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "telescope":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />  <path d="m13.56 11.747 4.332-.924" />  <path d="m16 21-3.105-6.21" />  <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" />  <path d="m6.158 8.633 1.114 4.456" />  <path d="m8 21 3.105-6.21" />  <circle cx="12" cy="13" r="2" /></svg>'
        );
      case "tennis-ball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 12c5.5 0 10-4.5 10-10" />  <circle cx="12" cy="12" r="10" />  <path d="M22 12c-5.5 0-10 4.5-10 10" /></svg>'
        );
      case "tennis-racket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.7 4.7c3-3 7.4-3.6 9.8-1.2s1.8 6.8-1.2 9.8a9.5 9.5 0 0 1-4.3 2.5c-2.1.5-4.1.1-5.5-1.3S7.7 11.1 8.2 9a9.5 9.5 0 0 1 2.5-4.3" />  <path d="M8.2 9 6 18l9-2.2" />  <path d="m2 22 4-4" />  <circle cx="20" cy="20" r="2" /></svg>'
        );
      case "tent-tree":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="4" cy="4" r="2" />  <path d="m14 5 3-3 3 3" />  <path d="m14 10 3-3 3 3" />  <path d="M17 14V2" />  <path d="M17 14H7l-5 8h20Z" />  <path d="M8 14v8" />  <path d="m9 14 5 8" /></svg>'
        );
      case "tent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3.5 21 14 3" />  <path d="M20.5 21 10 3" />  <path d="M15.5 21 12 15l-3.5 6" />  <path d="M2 21h20" /></svg>'
        );
      case "terminal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 19h8" />  <path d="m4 17 6-6-6-6" /></svg>'
        );
      case "test-tube-diagonal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3" />  <path d="m16 2 6 6" />  <path d="M12 16H4" /></svg>'
        );
      case "test-tube":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" />  <path d="M8.5 2h7" />  <path d="M14.5 16h-5" /></svg>'
        );
      case "test-tubes":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 2v17.5A2.5 2.5 0 0 1 6.5 22A2.5 2.5 0 0 1 4 19.5V2" />  <path d="M20 2v17.5a2.5 2.5 0 0 1-2.5 2.5a2.5 2.5 0 0 1-2.5-2.5V2" />  <path d="M3 2h7" />  <path d="M14 2h7" />  <path d="M9 16H4" />  <path d="M20 16h-5" /></svg>'
        );
      case "text-cursor-input":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" />  <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" />  <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />  <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" />  <path d="M9 6v12" /></svg>'
        );
      case "text-cursor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1" />  <path d="M7 22h1a4 4 0 0 0 4-4v-1" />  <path d="M7 2h1a4 4 0 0 1 4 4v1" /></svg>'
        );
      case "text-quote":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 6H3" />  <path d="M21 12H8" />  <path d="M21 18H8" />  <path d="M3 12v6" /></svg>'
        );
      case "text-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 6H3" />  <path d="M10 12H3" />  <path d="M10 18H3" />  <circle cx="17" cy="15" r="3" />  <path d="m21 19-1.9-1.9" /></svg>'
        );
      case "text-select":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 21h1" />  <path d="M14 3h1" />  <path d="M19 3a2 2 0 0 1 2 2" />  <path d="M21 14v1" />  <path d="M21 19a2 2 0 0 1-2 2" />  <path d="M21 9v1" />  <path d="M3 14v1" />  <path d="M3 9v1" />  <path d="M5 21a2 2 0 0 1-2-2" />  <path d="M5 3a2 2 0 0 0-2 2" />  <path d="M7 12h10" />  <path d="M7 16h6" />  <path d="M7 8h8" />  <path d="M9 21h1" />  <path d="M9 3h1" /></svg>'
        );
      case "text-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 12h10" />  <path d="M7 16h6" />  <path d="M7 8h8" /></svg>'
        );
      case "text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 18H3" />  <path d="M17 6H3" />  <path d="M21 12H3" /></svg>'
        );
      case "theater":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 10s3-3 3-8" />  <path d="M22 10s-3-3-3-8" />  <path d="M10 2c0 4.4-3.6 8-8 8" />  <path d="M14 2c0 4.4 3.6 8 8 8" />  <path d="M2 10s2 2 2 5" />  <path d="M22 10s-2 2-2 5" />  <path d="M8 15h8" />  <path d="M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />  <path d="M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" /></svg>'
        );
      case "thermometer-snowflake":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 20-1.25-2.5L6 18" />  <path d="M10 4 8.75 6.5 6 6" />  <path d="M10.585 15H10" />  <path d="M2 12h6.5L10 9" />  <path d="M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" />  <path d="m4 10 1.5 2L4 14" />  <path d="m7 21 3-6-1.5-3" />  <path d="m7 3 3 6h2" /></svg>'
        );
      case "thermometer-sun":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 9a4 4 0 0 0-2 7.5" />  <path d="M12 3v2" />  <path d="m6.6 18.4-1.4 1.4" />  <path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />  <path d="M4 13H2" />  <path d="M6.34 7.34 4.93 5.93" /></svg>'
        );
      case "thermometer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /></svg>'
        );
      case "thumbs-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 14V2" />  <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" /></svg>'
        );
      case "thumbs-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 10v12" />  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>'
        );
      case "ticket-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="m9 12 2 2 4-4" /></svg>'
        );
      case "ticket-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="M9 12h6" /></svg>'
        );
      case "ticket-percent":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="M9 9h.01" />  <path d="m15 9-6 6" />  <path d="M15 15h.01" /></svg>'
        );
      case "ticket-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="M9 12h6" />  <path d="M12 9v6" /></svg>'
        );
      case "ticket-slash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="m9.5 14.5 5-5" /></svg>'
        );
      case "ticket-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="m9.5 14.5 5-5" />  <path d="m9.5 9.5 5 5" /></svg>'
        );
      case "ticket":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />  <path d="M13 5v2" />  <path d="M13 17v2" />  <path d="M13 11v2" /></svg>'
        );
      case "tickets-plane":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.5 17h1.227a2 2 0 0 0 1.345-.52L18 12" />  <path d="m12 13.5 3.75.5" />  <path d="m4.5 8 10.58-5.06a1 1 0 0 1 1.342.488L18.5 8" />  <path d="M6 10V8" />  <path d="M6 14v1" />  <path d="M6 19v2" />  <rect x="2" y="8" width="20" height="13" rx="2" /></svg>'
        );
      case "tickets":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m4.5 8 10.58-5.06a1 1 0 0 1 1.342.488L18.5 8" />  <path d="M6 10V8" />  <path d="M6 14v1" />  <path d="M6 19v2" />  <rect x="2" y="8" width="20" height="13" rx="2" /></svg>'
        );
      case "tie-bow-ribbon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="4" height="4" x="10" y="7" />  <path d="M8 9h2" />  <path d="M10 7C8.8 5.5 6.6 4 4 4 2.9 4 2 6.2 2 9s.9 5 2 5c2.6 0 4.8-1.5 6-3" />  <path d="M14 9h2" />  <path d="M14 11c1.2 1.5 3.4 3 6 3 1.1 0 2-2.2 2-5s-.9-5-2-5c-2.6 0-4.8 1.5-6 3" />  <path d="M5.5 13.83 4 20l3-1 2 2 2.5-10" />  <path d="M18.5 13.83 20 20l-3-1-2 2-2.5-10" /></svg>'
        );
      case "tie-bow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="4" height="4" x="10" y="10" />  <path d="M8 12h2" />  <path d="M10 10C8.8 8.5 6.6 7 4 7c-1.1 0-2 2.2-2 5s.9 5 2 5c2.6 0 4.8-1.5 6-3" />  <path d="M14 12h2" />  <path d="M14 14c1.2 1.5 3.4 3 6 3 1.1 0 2-2.2 2-5s-.9-5-2-5c-2.6 0-4.8 1.5-6 3" /></svg>'
        );
      case "tie":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.9 3c.1-.6.5-1 1.1-1h4c.6 0 1 .4 1.1 1l.9 15-4 4-4-4Z" />  <path d="M8.85 2.4 16 11.8" />  <path d="m9.7 13.15 6.5 8.5" />  <path d="M22 5v16c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V5l3-3Z" /></svg>'
        );
      case "timer-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2h4" />  <path d="M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7" />  <path d="M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2" />  <path d="m2 2 20 20" />  <path d="M12 12v-2" /></svg>'
        );
      case "timer-reset":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2h4" />  <path d="M12 14v-4" />  <path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6" />  <path d="M9 17H4v5" /></svg>'
        );
      case "timer":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <line x1="10" x2="14" y1="2" y2="2" />  <line x1="12" x2="15" y1="14" y2="11" />  <circle cx="12" cy="14" r="8" /></svg>'
        );
      case "tire":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="2" />  <circle cx="12" cy="12" r="6" />  <path d="M12 14v4" />  <path d="m10.1 12.62-3.8 1.23" />  <path d="M10.82 10.38 8.47 7.15" />  <path d="m13.9 12.62 3.8 1.23" />  <path d="m13.18 10.38 2.35-3.23" /></svg>'
        );
      case "toast":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M5.5 3A3.5 3.5 0 0 0 3 8.9V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.9A3.5 3.5 0 0 0 18.5 3Z" />  <path d="M7.5 10c0-1.8 1.2-3 3.2-3 2.5 0 2.4 1.5 3.8 2.5s2.5 1 2.5 3c0 2.2-1.2 3.2-3.5 3.2-1.2 0-1.2 1.2-3 1.2S7 16 7 14.2c0-1.5.8-1.5.8-2.5 0-.7-.3-1.2-.3-1.7" /></svg>'
        );
      case "toaster":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 10V5.7A2 2 0 0 0 15 2H9a2 2 0 0 0-1 3.7V10" />  <path d="M6 10h12" />  <path d="M4 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />  <circle cx="8" cy="16" r="2" />  <path d="M14 16h4" />  <path d="M16 14v8" /></svg>'
        );
      case "toggle-left":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="9" cy="12" r="3" />  <rect width="20" height="14" x="2" y="5" rx="7" /></svg>'
        );
      case "toggle-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="15" cy="12" r="3" />  <rect width="20" height="14" x="2" y="5" rx="7" /></svg>'
        );
      case "toilet-roll":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="10" cy="8" rx="3" ry="2" />  <ellipse cx="10" cy="8" rx="7" ry="6" />  <path d="M3 8v8c0 3.3 3.1 6 7 6s7-2.7 7-6V8c0 2.2 2.2 4 5 4v8c-2.8 0-5-1.8-5-4" />  <path d="M10 14v2" />  <path d="M10 20v2" /></svg>'
        );
      case "toilet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18" />  <path d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" /></svg>'
        );
      case "tool-case":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 15h4" />  <path d="m14.817 10.995-.971-1.45 1.034-1.232a2 2 0 0 0-2.025-3.238l-1.82.364L9.91 3.885a2 2 0 0 0-3.625.748L6.141 6.55l-1.725.426a2 2 0 0 0-.19 3.756l.657.27" />  <path d="m18.822 10.995 2.26-5.38a1 1 0 0 0-.557-1.318L16.954 2.9a1 1 0 0 0-1.281.533l-.924 2.122" />  <path d="M4 12.006A1 1 0 0 1 4.994 11H19a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>'
        );
      case "toolbox-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />  <path d="M4 21a2 2 0 0 1-2-2v-7c0-.6.3-1.3.7-1.7l2.6-2.6C5.7 7.3 6.4 7 7 7h10c.6 0 1.3.3 1.7.7l2.6 2.6c.4.4.7 1.2.7 1.7v7a2 2 0 0 1-2 2Z" />  <path d="M2 14h20" />  <path d="M9 16v-4" />  <path d="M15 16v-4" /></svg>'
        );
      case "toolbox":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />  <path d="M8 21a2 2 0 0 0 2-2v-8a4 4 0 0 0-8 0v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a4 4 0 0 0-4-4H6" />  <path d="M2 13h20" />  <path d="M14 15v-4" />  <path d="M18 15v-4" /></svg>'
        );
      case "top-crop":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5c-1.7 0-3-1.3-3-3V5h-4v1a3 3 0 1 1-6 0V5H5v4c0 1.7-1.3 3-3 3Z" /></svg>'
        );
      case "tornado":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 4H3" />  <path d="M18 8H6" />  <path d="M19 12H9" />  <path d="M16 16h-6" />  <path d="M11 20H9" /></svg>'
        );
      case "torus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <ellipse cx="12" cy="11" rx="3" ry="2" />  <ellipse cx="12" cy="12.5" rx="10" ry="8.5" /></svg>'
        );
      case "touchpad-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20v-6" />  <path d="M19.656 14H22" />  <path d="M2 14h12" />  <path d="m2 2 20 20" />  <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" />  <path d="M9.656 4H20a2 2 0 0 1 2 2v10.344" /></svg>'
        );
      case "touchpad":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="16" x="2" y="4" rx="2" />  <path d="M2 14h20" />  <path d="M12 20v-6" /></svg>'
        );
      case "towel-folded":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 13h10a4 4 0 0 1 0 8H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10" />  <path d="M17 17H7a4 4 0 0 1-4-4" /></svg>'
        );
      case "towel-rack":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 6H2" />  <path d="M6 2h12a2 2 0 0 1 2 2v18H8V4a2 2 0 0 0-4 0v15h4" />  <path d="M22 6h-2" />  <path d="M8 18h12" /></svg>'
        );
      case "tower-control":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .96-.73Z" />  <path d="M8 13v9" />  <path d="M16 22v-9" />  <path d="m9 6 1 7" />  <path d="m15 6-1 7" />  <path d="M12 6V2" />  <path d="M13 2h-2" /></svg>'
        );
      case "toy-brick":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="12" x="3" y="8" rx="1" />  <path d="M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3" />  <path d="M19 8V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3" /></svg>'
        );
      case "tractor":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20" />  <path d="M16 18h-5" />  <path d="M18 5a1 1 0 0 0-1 1v5.573" />  <path d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246" />  <path d="M4 11V4" />  <path d="M7 15h.01" />  <path d="M8 10.1V4" />  <circle cx="18" cy="18" r="2" />  <circle cx="7" cy="15" r="5" /></svg>'
        );
      case "traffic-cone":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.05 10.966a5 2.5 0 0 1-8.1 0" />  <path d="m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04" />  <path d="M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z" />  <path d="M9.194 6.57a5 2.5 0 0 0 5.61 0" /></svg>'
        );
      case "train-front-tunnel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 22V12a10 10 0 1 1 20 0v10" />  <path d="M15 6.8v1.4a3 2.8 0 1 1-6 0V6.8" />  <path d="M10 15h.01" />  <path d="M14 15h.01" />  <path d="M10 19a4 4 0 0 1-4-4v-3a6 6 0 1 1 12 0v3a4 4 0 0 1-4 4Z" />  <path d="m9 19-2 3" />  <path d="m15 19 2 3" /></svg>'
        );
      case "train-front":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1" />  <path d="m9 15-1-1" />  <path d="m15 15 1-1" />  <path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z" />  <path d="m8 19-2 3" />  <path d="m16 19 2 3" /></svg>'
        );
      case "train-track":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 17 17 2" />  <path d="m2 14 8 8" />  <path d="m5 11 8 8" />  <path d="m8 8 8 8" />  <path d="m11 5 8 8" />  <path d="m14 2 8 8" />  <path d="M7 22 22 7" /></svg>'
        );
      case "tram-front":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="16" height="16" x="4" y="3" rx="2" />  <path d="M4 11h16" />  <path d="M12 3v8" />  <path d="m8 19-2 3" />  <path d="m18 22-2-3" />  <path d="M8 15h.01" />  <path d="M16 15h.01" /></svg>'
        );
      case "transgender":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 16v6" />  <path d="M14 20h-4" />  <path d="M18 2h4v4" />  <path d="m2 2 7.17 7.17" />  <path d="M2 5.355V2h3.357" />  <path d="m22 2-7.17 7.17" />  <path d="M8 5 5 8" />  <circle cx="12" cy="12" r="4" /></svg>'
        );
      case "transparent_1x1":
        return '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!-- Created with Inkscape (http://www.inkscape.org/) --><svg   version="1.1"   id="svg1"       viewBox="0 0 0.31999999 0.31999999"   sodipodi:docname="Transparent_1x1.svg"   inkscape:version="1.3.2 (091e20e, 2023-11-25, custom)"   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"   xmlns:xlink="http://www.w3.org/1999/xlink"   xmlns="http://www.w3.org/2000/svg"   xmlns:svg="http://www.w3.org/2000/svg">  <defs     id="defs1" />  <sodipodi:namedview     id="namedview1"     pagecolor="#ffffff"     bordercolor="#000000"     borderopacity="0.25"     inkscape:showpageshadow="2"     inkscape:pageopacity="0.0"     inkscape:pagecheckerboard="0"     inkscape:deskcolor="#d1d1d1"     inkscape:zoom="1"     inkscape:cx="0.5"     inkscape:cy="-159.5"     inkscape:window-width="1920"     inkscape:window-height="1009"     inkscape:window-x="1912"     inkscape:window-y="-8"     inkscape:window-maximized="1"     inkscape:current-layer="g1" />  <g     inkscape:groupmode="layer"     inkscape:label="Image"     id="g1">    <image       width="0.31999999"       height="0.31999999"       preserveAspectRatio="none"       xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IB2cksfwAAAARnQU1BAACx&#10;jwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dE&#10;AAAAAAAA+UO7fwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+kFFAwpCzCKEFUAAAAQSURB&#10;VAgdAQUA+v8AAAAAAAAFAAG6iRCKAAAAAElFTkSuQmCC&#10;"       id="image1" />  </g></svg>';
      case "trash-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 11v6" />  <path d="M14 11v6" />  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />  <path d="M3 6h18" />  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>'
        );
      case "trash":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />  <path d="M3 6h18" />  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>'
        );
      case "tree-deciduous":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z" />  <path d="M12 19v3" /></svg>'
        );
      case "tree-palm":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" />  <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" />  <path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35" />  <path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" /></svg>'
        );
      case "tree-pine":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" />  <path d="M12 22v-3" /></svg>'
        );
      case "trees-forest":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 5 3-3 3 3" />  <path d="m9 10 3-3 3 3" />  <path d="M12 12V2" />  <path d="m2 15 3-3 3 3" />  <path d="m2 20 3-3 3 3" />  <path d="M5 22V12" />  <path d="m16 15 3-3 3 3" />  <path d="m16 20 3-3 3 3" />  <path d="M19 22V12" /></svg>'
        );
      case "trees":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />  <path d="M7 16v6" />  <path d="M13 19v3" />  <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" /></svg>'
        );
      case "trello":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />  <rect width="3" height="9" x="7" y="7" />  <rect width="3" height="5" x="14" y="7" /></svg>'
        );
      case "trending-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 17h6v-6" />  <path d="m22 17-8.5-8.5-5 5L2 7" /></svg>'
        );
      case "trending-up-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.828 14.828 21 21" />  <path d="M21 16v5h-5" />  <path d="m21 3-9 9-4-4-6 6" />  <path d="M21 8V3h-5" /></svg>'
        );
      case "trending-up":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 7h6v6" />  <path d="m22 7-8.5 8.5-5-5L2 17" /></svg>'
        );
      case "triangle-alert":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />  <path d="M12 9v4" />  <path d="M12 17h.01" /></svg>'
        );
      case "triangle-dashed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.17 4.193a2 2 0 0 1 3.666.013" />  <path d="M14 21h2" />  <path d="m15.874 7.743 1 1.732" />  <path d="m18.849 12.952 1 1.732" />  <path d="M21.824 18.18a2 2 0 0 1-1.835 2.824" />  <path d="M4.024 21a2 2 0 0 1-1.839-2.839" />  <path d="m5.136 12.952-1 1.732" />  <path d="M8 21h2" />  <path d="m8.102 7.743-1 1.732" /></svg>'
        );
      case "triangle-right":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 18a2 2 0 0 1-2 2H3c-1.1 0-1.3-.6-.4-1.3L20.4 4.3c.9-.7 1.6-.4 1.6.7Z" /></svg>'
        );
      case "triangle-stripes":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.75 4a2 2 0 0 0-3.5 0L2.2 18A2 2.1 0 0 0 4 21h16a2 2 0 0 0 1.75-3Z" />  <path d="M7.5 9h9" />  <path d="M5.5 13h13" />  <path d="M3 17h18" /></svg>'
        );
      case "triangle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /></svg>'
        );
      case "trophy":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />  <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />  <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />  <path d="M4 22h16" />  <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />  <path d="M6 9H4.5a1 1 0 0 1 0-5H6" /></svg>'
        );
      case "trousers":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 6h16" />  <path d="M6 22a2 2 0 0 1-2-2V3c0-.6.4-1 1-1h14c.6 0 1 .4 1 1v17a2 2 0 0 1-2 2h-3l-3-10-3 10Z" />  <path d="m6 11-2 1" />  <path d="M9 8.5V6" />  <path d="M15 6v2.5" />  <path d="m20 12-2-1" />  <path d="M4 18h6" />  <path d="M14 18h6" /></svg>'
        );
      case "truck-electric":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 19V7a2 2 0 0 0-2-2H9" />  <path d="M15 19H9" />  <path d="M19 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14" />  <path d="M2 13v5a1 1 0 0 0 1 1h2" />  <path d="M4 3 2.15 5.15a.495.495 0 0 0 .35.86h2.15a.47.47 0 0 1 .35.86L3 9.02" />  <circle cx="17" cy="19" r="2" />  <circle cx="7" cy="19" r="2" /></svg>'
        );
      case "truck":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />  <path d="M15 18H9" />  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />  <circle cx="17" cy="18" r="2" />  <circle cx="7" cy="18" r="2" /></svg>'
        );
      case "turkish-lira":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 4 5 9" />  <path d="m15 8.5-10 5" />  <path d="M18 12a9 9 0 0 1-9 9V3" /></svg>'
        );
      case "turntable":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 12.01h.01" />  <path d="M18 8v4a8 8 0 0 1-1.07 4" />  <circle cx="10" cy="12" r="4" />  <rect x="2" y="4" width="20" height="16" rx="2" /></svg>'
        );
      case "turtle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z" />  <path d="M4.82 7.9 8 10" />  <path d="M15.18 7.9 12 10" />  <path d="M16.93 10H20a2 2 0 0 1 0 4H2" /></svg>'
        );
      case "tuxedo":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 3v2l4-2v2Z" />  <path d="M18 3h1a2 2 0 0 1 1.7 3A5270.5 5270.5 0 0 0 12 21S6.8 12 3.3 6A2 2 0 0 1 5 3h1" />  <path d="M12 9h.01" />  <path d="M12 13h.01" />  <path d="M21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" /></svg>'
        );
      case "tv-minimal-play":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z" />  <path d="M7 21h10" />  <rect width="20" height="14" x="2" y="3" rx="2" /></svg>'
        );
      case "tv-minimal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M7 21h10" />  <rect width="20" height="14" x="2" y="3" rx="2" /></svg>'
        );
      case "tv":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m17 2-5 5-5-5" />  <rect width="20" height="15" x="2" y="7" rx="2" /></svg>'
        );
      case "twitch":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" /></svg>'
        );
      case "twitter":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>'
        );
      case "type-outline":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 16.5a.5.5 0 0 0 .5.5h.5a2 2 0 0 1 0 4H9a2 2 0 0 1 0-4h.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V8a2 2 0 0 1-4 0V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-4 0v-.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5Z" /></svg>'
        );
      case "type-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M7 9V7h10v2" />  <path d="M12 7v10" />  <path d="M10 17h4" /></svg>'
        );
      case "type":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 4v16" />  <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />  <path d="M9 20h6" /></svg>'
        );
      case "ufo":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 8c0 1-3 2-6 2S6 9 6 8a6 6 0 0 1 12 0" />  <path d="M7 13h.01" />  <path d="M12 14h.01" />  <path d="M17 13h.01" />  <path d="M6 8.1c-2.4 1-4 2.6-4 4.4 0 3 4.5 5.5 10 5.5s10-2.5 10-5.5c0-1.8-1.6-3.4-4-4.4" />  <path d="m7 22 2-4" />  <path d="m17 22-2-4" /></svg>'
        );
      case "umbrella-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13v7a2 2 0 0 0 4 0" />  <path d="M12 2v2" />  <path d="M18.656 13h2.336a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-12.07-7.51" />  <path d="m2 2 20 20" />  <path d="M5.961 5.957a10.28 10.28 0 0 0-3.922 5.769A1 1 0 0 0 3 13h10" /></svg>'
        );
      case "umbrella":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 13v7a2 2 0 0 0 4 0" />  <path d="M12 2v2" />  <path d="M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z" /></svg>'
        );
      case "underline-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M15 7v3a3 3 0 1 1-6 0V7" />  <path d="M7 17h10" /></svg>'
        );
      case "underline":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 4v6a6 6 0 0 0 12 0V4" />  <line x1="4" x2="20" y1="20" y2="20" /></svg>'
        );
      case "undo-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M9 14 4 9l5-5" />  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" /></svg>'
        );
      case "undo-dot":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />  <path d="M3 7v6h6" />  <circle cx="12" cy="17" r="1" /></svg>'
        );
      case "undo":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 7v6h6" />  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>'
        );
      case "unfold-horizontal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 12h6" />  <path d="M8 12H2" />  <path d="M12 2v2" />  <path d="M12 8v2" />  <path d="M12 14v2" />  <path d="M12 20v2" />  <path d="m19 15 3-3-3-3" />  <path d="m5 9-3 3 3 3" /></svg>'
        );
      case "unfold-vertical":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 22v-6" />  <path d="M12 8V2" />  <path d="M4 12H2" />  <path d="M10 12H8" />  <path d="M16 12h-2" />  <path d="M22 12h-2" />  <path d="m15 19-3 3-3-3" />  <path d="m15 5-3-3-3 3" /></svg>'
        );
      case "ungroup":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="6" x="5" y="4" rx="1" />  <rect width="8" height="6" x="11" y="14" rx="1" /></svg>'
        );
      case "unicorn-head":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.6 4.8 2.7 2.3" />  <path d="M15.5 10S19 7 22 2c-6 2-10 5-10 5" />  <path d="M11.5 12H11" />  <path d="M5 15a4 4 0 0 0 4 4h7.8l.3.3a3 3 0 0 0 4-4.46L12 7c0-3-1-5-1-5S8 3 8 7c-4 1-6 3-6 3" />  <path d="M2 4.5C4 3 6 3 6 3l2 4" />  <path d="M6.14 17.8S4 19 2 22" /></svg>'
        );
      case "university":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14 21v-3a2 2 0 0 0-4 0v3" />  <path d="M18 12h.01" />  <path d="M18 16h.01" />  <path d="M22 7a1 1 0 0 0-1-1h-2a2 2 0 0 1-1.143-.359L13.143 2.36a2 2 0 0 0-2.286-.001L6.143 5.64A2 2 0 0 1 5 6H3a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" />  <path d="M6 12h.01" />  <path d="M6 16h.01" />  <circle cx="12" cy="10" r="2" /></svg>'
        );
      case "unlink-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2" /></svg>'
        );
      case "unlink":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />  <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />  <line x1="8" x2="8" y1="2" y2="5" />  <line x1="2" x2="5" y1="8" y2="8" />  <line x1="16" x2="16" y1="19" y2="22" />  <line x1="19" x2="22" y1="16" y2="16" /></svg>'
        );
      case "unplug":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 5 3-3" />  <path d="m2 22 3-3" />  <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />  <path d="M7.5 13.5 10 11" />  <path d="M10.5 16.5 13 14" />  <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" /></svg>'
        );
      case "upload":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 3v12" />  <path d="m17 8-5-5-5 5" />  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>'
        );
      case "usb":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="10" cy="7" r="1" />  <circle cx="4" cy="20" r="1" />  <path d="M4.7 19.3 19 5" />  <path d="m21 3-3 1 2 2Z" />  <path d="M9.26 7.68 5 12l2 5" />  <path d="m10 14 5 2 3.5-3.5" />  <path d="m18 12 1-1 1 1-1 1Z" /></svg>'
        );
      case "user-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 11 2 2 4-4" />  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />  <circle cx="9" cy="7" r="4" /></svg>'
        );
      case "user-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 15H6a4 4 0 0 0-4 4v2" />  <path d="m14.305 16.53.923-.382" />  <path d="m15.228 13.852-.923-.383" />  <path d="m16.852 12.228-.383-.923" />  <path d="m16.852 17.772-.383.924" />  <path d="m19.148 12.228.383-.923" />  <path d="m19.53 18.696-.382-.924" />  <path d="m20.772 13.852.924-.383" />  <path d="m20.772 16.148.924.383" />  <circle cx="18" cy="15" r="3" />  <circle cx="9" cy="7" r="4" /></svg>'
        );
      case "user-lock":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="10" cy="7" r="4" />  <path d="M10.3 15H7a4 4 0 0 0-4 4v2" />  <path d="M15 15.5V14a2 2 0 0 1 4 0v1.5" />  <rect width="8" height="5" x="13" y="16" rx=".899" /></svg>'
        );
      case "user-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />  <circle cx="9" cy="7" r="4" />  <line x1="22" x2="16" y1="11" y2="11" /></svg>'
        );
      case "user-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.5 15H7a4 4 0 0 0-4 4v2" />  <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />  <circle cx="10" cy="7" r="4" /></svg>'
        );
      case "user-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />  <circle cx="9" cy="7" r="4" />  <line x1="19" x2="19" y1="8" y2="14" />  <line x1="22" x2="16" y1="11" y2="11" /></svg>'
        );
      case "user-round-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 21a8 8 0 0 1 13.292-6" />  <circle cx="10" cy="8" r="5" />  <path d="m16 19 2 2 4-4" /></svg>'
        );
      case "user-round-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.305 19.53.923-.382" />  <path d="m15.228 16.852-.923-.383" />  <path d="m16.852 15.228-.383-.923" />  <path d="m16.852 20.772-.383.924" />  <path d="m19.148 15.228.383-.923" />  <path d="m19.53 21.696-.382-.924" />  <path d="M2 21a8 8 0 0 1 10.434-7.62" />  <path d="m20.772 16.852.924-.383" />  <path d="m20.772 19.148.924.383" />  <circle cx="10" cy="8" r="5" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "user-round-minus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 21a8 8 0 0 1 13.292-6" />  <circle cx="10" cy="8" r="5" />  <path d="M22 19h-6" /></svg>'
        );
      case "user-round-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 21a8 8 0 0 1 10.821-7.487" />  <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />  <circle cx="10" cy="8" r="5" /></svg>'
        );
      case "user-round-plus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 21a8 8 0 0 1 13.292-6" />  <circle cx="10" cy="8" r="5" />  <path d="M19 16v6" />  <path d="M22 19h-6" /></svg>'
        );
      case "user-round-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="10" cy="8" r="5" />  <path d="M2 21a8 8 0 0 1 10.434-7.62" />  <circle cx="18" cy="18" r="3" />  <path d="m22 22-1.9-1.9" /></svg>'
        );
      case "user-round-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 21a8 8 0 0 1 11.873-7" />  <circle cx="10" cy="8" r="5" />  <path d="m17 17 5 5" />  <path d="m22 17-5 5" /></svg>'
        );
      case "user-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="8" r="5" />  <path d="M20 21a8 8 0 0 0-16 0" /></svg>'
        );
      case "user-search":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="10" cy="7" r="4" />  <path d="M10.3 15H7a4 4 0 0 0-4 4v2" />  <circle cx="17" cy="17" r="3" />  <path d="m21 21-1.9-1.9" /></svg>'
        );
      case "user-star":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />  <path d="M8 15H7a4 4 0 0 0-4 4v2" />  <circle cx="10" cy="7" r="4" /></svg>'
        );
      case "user-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />  <circle cx="9" cy="7" r="4" />  <line x1="17" x2="22" y1="8" y2="13" />  <line x1="22" x2="17" y1="8" y2="13" /></svg>'
        );
      case "user":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />  <circle cx="12" cy="7" r="4" /></svg>'
        );
      case "users-round":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 21a8 8 0 0 0-16 0" />  <circle cx="10" cy="8" r="5" />  <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" /></svg>'
        );
      case "users":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />  <path d="M16 3.128a4 4 0 0 1 0 7.744" />  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />  <circle cx="9" cy="7" r="4" /></svg>'
        );
      case "utensils-crossed":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />  <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />  <path d="m2.1 21.8 6.4-6.3" />  <path d="m19 5-7 7" /></svg>'
        );
      case "utensils":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />  <path d="M7 2v20" />  <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>'
        );
      case "utility-pole":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 2v20" />  <path d="M2 5h20" />  <path d="M3 3v2" />  <path d="M7 3v2" />  <path d="M17 3v2" />  <path d="M21 3v2" />  <path d="m19 5-7 7-7-7" /></svg>'
        );
      case "variable":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 21s-4-3-4-9 4-9 4-9" />  <path d="M16 3s4 3 4 9-4 9-4 9" />  <line x1="15" x2="9" y1="9" y2="15" />  <line x1="9" x2="15" y1="9" y2="15" /></svg>'
        );
      case "vault":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />  <path d="m7.9 7.9 2.7 2.7" />  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />  <path d="m13.4 10.6 2.7-2.7" />  <circle cx="7.5" cy="16.5" r=".5" fill="currentColor" />  <path d="m7.9 16.1 2.7-2.7" />  <circle cx="16.5" cy="16.5" r=".5" fill="currentColor" />  <path d="m13.4 13.4 2.7 2.7" />  <circle cx="12" cy="12" r="2" /></svg>'
        );
      case "vector-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19.5 7a24 24 0 0 1 0 10" />  <path d="M4.5 7a24 24 0 0 0 0 10" />  <path d="M7 19.5a24 24 0 0 0 10 0" />  <path d="M7 4.5a24 24 0 0 1 10 0" />  <rect x="17" y="17" width="5" height="5" rx="1" />  <rect x="17" y="2" width="5" height="5" rx="1" />  <rect x="2" y="17" width="5" height="5" rx="1" />  <rect x="2" y="2" width="5" height="5" rx="1" /></svg>'
        );
      case "vegan":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 8q6 0 6-6-6 0-6 6" />  <path d="M17.41 3.59a10 10 0 1 0 3 3" />  <path d="M2 2a26.6 26.6 0 0 1 10 20c.9-6.82 1.5-9.5 4-14" /></svg>'
        );
      case "venetian-mask":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 11c-1.5 0-2.5.5-3 2" />  <path d="M4 6a2 2 0 0 0-2 2v4a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V8a2 2 0 0 0-2-2h-3a8 8 0 0 0-5 2 8 8 0 0 0-5-2z" />  <path d="M6 11c1.5 0 2.5.5 3 2" /></svg>'
        );
      case "venn":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="8" cy="12" r="6" />  <circle cx="16" cy="12" r="6" /></svg>'
        );
      case "venus-and-mars":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 20h4" />  <path d="M12 16v6" />  <path d="M17 2h4v4" />  <path d="m21 2-5.46 5.46" />  <circle cx="12" cy="11" r="5" /></svg>'
        );
      case "venus":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 15v7" />  <path d="M9 19h6" />  <circle cx="12" cy="9" r="6" /></svg>'
        );
      case "vest":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 4a2 2 0 0 0 4 0V3h4v3c0 1.7 1.3 3 3 3v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9c1.7 0 3-1.3 3-3V3h4Z" /></svg>'
        );
      case "vibrate-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 8 2 2-2 2 2 2-2 2" />  <path d="m22 8-2 2 2 2-2 2 2 2" />  <path d="M8 8v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2" />  <path d="M16 10.34V6c0-.55-.45-1-1-1h-4.34" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "vibrate":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 8 2 2-2 2 2 2-2 2" />  <path d="m22 8-2 2 2 2-2 2 2 2" />  <rect width="8" height="14" x="8" y="5" rx="1" /></svg>'
        );
      case "video-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />  <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />  <path d="m2 2 20 20" /></svg>'
        );
      case "video":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />  <rect x="2" y="6" width="14" height="12" rx="2" /></svg>'
        );
      case "videotape":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="20" height="16" x="2" y="4" rx="2" />  <path d="M2 8h20" />  <circle cx="8" cy="14" r="2" />  <path d="M8 12h8" />  <circle cx="16" cy="14" r="2" /></svg>'
        );
      case "view":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />  <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />  <circle cx="12" cy="12" r="1" />  <path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" /></svg>'
        );
      case "voicemail":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="6" cy="12" r="4" />  <circle cx="18" cy="12" r="4" />  <line x1="6" x2="18" y1="16" y2="16" /></svg>'
        );
      case "volleyball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M6.3 3.8a16.55 16.55 0 0 0 1.9 11.5" />  <path d="M20.7 17a12.8 12.8 0 0 0-8.7-5 13.3 13.3 0 0 1 0-10" />  <path d="M22 11.1c-.8-.6-1.7-1.3-2.6-1.8-3-1.7-6.1-2.5-8.3-2.2" />  <path d="M7.8 21.1c1-.4 1.9-.8 2.9-1.4 3-1.7 5.2-4 6.1-6.1" />  <path d="M12 12a12.6 12.6 0 0 1-8.7 5" /></svg>'
        );
      case "volume-1":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />  <path d="M16 9a5 5 0 0 1 0 6" /></svg>'
        );
      case "volume-2":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />  <path d="M16 9a5 5 0 0 1 0 6" />  <path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></svg>'
        );
      case "volume-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M16 9a5 5 0 0 1 .95 2.293" />  <path d="M19.364 5.636a9 9 0 0 1 1.889 9.96" />  <path d="m2 2 20 20" />  <path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11" />  <path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686" /></svg>'
        );
      case "volume-x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />  <line x1="22" x2="16" y1="9" y2="15" />  <line x1="16" x2="22" y1="9" y2="15" /></svg>'
        );
      case "volume":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /></svg>'
        );
      case "vote":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m9 12 2 2 4-4" />  <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />  <path d="M22 19H2" /></svg>'
        );
      case "waffle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="m7 14 7-7" />  <path d="m10 17 7-7" />  <path d="m7 10 7 7" />  <path d="m10 7 7 7" /></svg>'
        );
      case "wallet-cards":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="18" x="3" y="3" rx="2" />  <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />  <path d="M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21" /></svg>'
        );
      case "wallet-minimal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 14h.01" />  <path d="M7 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14" /></svg>'
        );
      case "wallet":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>'
        );
      case "wallpaper":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 17v4" />  <path d="M8 21h8" />  <path d="m9 17 6.1-6.1a2 2 0 0 1 2.81.01L22 15" />  <circle cx="8" cy="9" r="2" />  <rect x="2" y="3" width="20" height="14" rx="2" /></svg>'
        );
      case "wand-sparkles":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />  <path d="m14 7 3 3" />  <path d="M5 6v4" />  <path d="M19 14v4" />  <path d="M10 2v2" />  <path d="M7 8H3" />  <path d="M21 16h-4" />  <path d="M11 3H9" /></svg>'
        );
      case "wand":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M15 4V2" />  <path d="M15 16v-2" />  <path d="M8 9h2" />  <path d="M20 9h2" />  <path d="M17.8 11.8 19 13" />  <path d="M15 9h.01" />  <path d="M17.8 6.2 19 5" />  <path d="m3 21 9-9" />  <path d="M12.2 6.2 11 5" /></svg>'
        );
      case "wardrobe":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="18" height="20" x="3" y="2" rx="2" />  <path d="M8 10h.01" />  <path d="M12 2v15" />  <path d="M16 10h.01" />  <path d="M3 17h18" /></svg>'
        );
      case "warehouse":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" />  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" />  <path d="M6 13h12" />  <path d="M6 17h12" /></svg>'
        );
      case "washing-machine":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 6h3" />  <path d="M17 6h.01" />  <rect width="18" height="20" x="3" y="2" rx="2" />  <circle cx="12" cy="13" r="5" />  <path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" /></svg>'
        );
      case "watch-activity":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="M6 12h3l2 2 2.2-4 1.8 2h3" /></svg>'
        );
      case "watch-alarm":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.5 9a9.93 9.93 0 0 0 0 6" />  <path d="M21.5 15a9.93 9.93 0 0 0 0-6" />  <circle cx="12" cy="12" r="6" />  <path d="M12 10v2l1 1" />  <path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05" />  <path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05" /></svg>'
        );
      case "watch-bars":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="M10 12v2" />  <path d="M14 10v4" /></svg>'
        );
      case "watch-charging":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="m12 10-1 2h2l-1 2" /></svg>'
        );
      case "watch-check":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="m14 11-2.5 2.5L10 12" /></svg>'
        );
      case "watch-loader":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="M14 12a2 2 0 1 1-2-2" /></svg>'
        );
      case "watch-music":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <circle cx="11.5" cy="13.5" r=".5" />  <path d="m14 11-2-1v3.5" /></svg>'
        );
      case "watch-square-alarm":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="M12 10v2l1 1" />  <path d="M2 16c0 2.1 1.1 4 2.7 5" />  <path d="M22 8c0-2.1-1.1-4-2.7-5" /></svg>'
        );
      case "watch-square":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="M12 10v2l1 1" /></svg>'
        );
      case "watch-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m15.8 6-.5-2.4c-.2-1-1-1.6-2-1.6h-2.7a2 2 0 0 0-2 1.6L8.2 6" />  <rect width="12" height="12" x="6" y="6" rx="2" />  <path d="m8.2 18 .5 2.4c.2 1 1 1.6 2 1.6h2.7a2 2 0 0 0 2-1.6l.5-2.4" />  <path d="M10 10h2" />  <path d="M14 14h-4" /></svg>'
        );
      case "watch":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 10v2.2l1.6 1" />  <path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05" />  <path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05" />  <circle cx="12" cy="12" r="6" /></svg>'
        );
      case "watermelon":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M21.7 17.7a1.08 1.08 0 0 1-.08 1.57A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04Z" />  <path d="M19.7 15.7A8 8 0 0 1 8.35 4.34" />  <path d="M10 11h.01" />  <path d="M13 14h.01" /></svg>'
        );
      case "wave-circle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M16.5 20.93a5 5 0 1 1-.6-9 7 7 0 0 0-13.9.6" /></svg>'
        );
      case "waves-birds":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 3c3-1 5 2 5 2s2-2.1 5-1.2" />  <path d="M10 8c3-1 5 2 5 2s2-3 5-2" />  <path d="M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>'
        );
      case "waves-ladder":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M19 5a2 2 0 0 0-2 2v11" />  <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M7 13h10" />  <path d="M7 9h10" />  <path d="M9 5a2 2 0 0 0-2 2v11" /></svg>'
        );
      case "waves-shark-fin":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17.3 14.8C15.3 11 15.8 6.2 19 3 11.6 3 5.6 8.7 5.1 16" />  <path d="M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>'
        );
      case "waves":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />  <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>'
        );
      case "waypoints":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="4.5" r="2.5" />  <path d="m10.2 6.3-3.9 3.9" />  <circle cx="4.5" cy="12" r="2.5" />  <path d="M7 12h10" />  <circle cx="19.5" cy="12" r="2.5" />  <path d="m13.8 17.7 3.9-3.9" />  <circle cx="12" cy="19.5" r="2.5" /></svg>'
        );
      case "webcam":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="10" r="8" />  <circle cx="12" cy="10" r="3" />  <path d="M7 22h10" />  <path d="M12 22v-4" /></svg>'
        );
      case "webhook-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 17h-5c-1.09-.02-1.94.92-2.5 1.9A3 3 0 1 1 2.57 15" />  <path d="M9 3.4a4 4 0 0 1 6.52.66" />  <path d="m6 17 3.1-5.8a2.5 2.5 0 0 0 .057-2.05" />  <path d="M20.3 20.3a4 4 0 0 1-2.3.7" />  <path d="M18.6 13a4 4 0 0 1 3.357 3.414" />  <path d="m12 6 .6 1" />  <path d="m2 2 20 20" /></svg>'
        );
      case "webhook":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />  <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />  <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" /></svg>'
        );
      case "weight":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="5" r="3" />  <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z" /></svg>'
        );
      case "whale-narwhal":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M20 9.98s1-3 1-7c-3 2-5 6-5 6.08" />  <path d="M6 9.7 3.9 8.4C2.7 7.7 2 6.4 2 5V3c2 0 4 2 4 2s2-2 4-2v2c0 1.4-.7 2.7-1.9 3.4l-3.8 2.4A5 5 0 0 0 7 20h12c1.7 0 3-1.3 3-3v-3c0-2.8-2.2-5-5-5-2.7 0-5.1 1.4-6.4 3.6L9.7 14A2 2 0 0 1 6 13Z" />  <path d="M15 15h.01" /></svg>'
        );
      case "whale":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 9.1V5a2 2 0 0 0-4 0" />  <path d="M18 5a2 2 0 0 1 4 0" />  <path d="M6 9.7 3.9 8.4C2.7 7.7 2 6.4 2 5V3c2 0 4 2 4 2s2-2 4-2v2c0 1.4-.7 2.7-1.9 3.4l-3.8 2.4A5 5 0 0 0 7 20h12c1.7 0 3-1.3 3-3v-3c0-2.8-2.2-5-5-5-2.7 0-5.1 1.4-6.4 3.6L9.7 14A2 2 0 0 1 6 13Z" />  <path d="M15 15h.01" /></svg>'
        );
      case "wheat-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m2 22 10-10" />  <path d="m16 8-1.17 1.17" />  <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />  <path d="m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97" />  <path d="M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62" />  <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />  <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />  <path d="m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98" />  <path d="M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "wheat":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 22 16 8" />  <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />  <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />  <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />  <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />  <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />  <path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />  <path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /></svg>'
        );
      case "wheel":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="12" r="2.5" />  <path d="M12 2v7.5" />  <path d="m19 5-5.23 5.23" />  <path d="M22 12h-7.5" />  <path d="m19 19-5.23-5.23" />  <path d="M12 14.5V22" />  <path d="M10.23 13.77 5 19" />  <path d="M9.5 12H2" />  <path d="M10.23 10.23 5 5" /></svg>'
        );
      case "whisk-fork-knife":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 2C3.8 2 2 3.8 2 6s4 8 4 8 4-5.8 4-8-1.8-4-4-4z" />  <path d="M6 22V2" />  <path d="M18 22v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4" />  <path d="M14 22V2" />  <path d="M22 13h-2a2 2 0 0 1-2-2V6a4 4 0 0 1 4-4v20" /></svg>'
        );
      case "whisk":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M22 2 3.45 20.55" />  <path d="M3.5 13.5a5 5 0 1 0 7.1 7.1C12.6 18.6 15 9 15 9s-9.6 2.5-11.5 4.5" /></svg>'
        );
      case "whisks":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M6 2v20" />  <path d="M6 10s-4 5.8-4 8 1.8 4 4 4 4-1.8 4-4-4-8-4-8" />  <path d="M18 2v20" />  <path d="M18 10s-4 5.8-4 8 1.8 4 4 4 4-1.8 4-4-4-8-4-8" /></svg>'
        );
      case "whole-word":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="7" cy="12" r="3" />  <path d="M10 9v6" />  <circle cx="17" cy="12" r="3" />  <path d="M14 7v8" />  <path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" /></svg>'
        );
      case "wifi-cog":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m14.305 19.53.923-.382" />  <path d="m15.228 16.852-.923-.383" />  <path d="m16.852 15.228-.383-.923" />  <path d="m16.852 20.772-.383.924" />  <path d="m19.148 15.228.383-.923" />  <path d="m19.53 21.696-.382-.924" />  <path d="M2 7.82a15 15 0 0 1 20 0" />  <path d="m20.772 16.852.924-.383" />  <path d="m20.772 19.148.924.383" />  <path d="M5 11.858a10 10 0 0 1 11.5-1.785" />  <path d="M8.5 15.429a5 5 0 0 1 2.413-1.31" />  <circle cx="18" cy="18" r="3" /></svg>'
        );
      case "wifi-high":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20h.01" />  <path d="M5 12.859a10 10 0 0 1 14 0" />  <path d="M8.5 16.429a5 5 0 0 1 7 0" /></svg>'
        );
      case "wifi-low":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20h.01" />  <path d="M8.5 16.429a5 5 0 0 1 7 0" /></svg>'
        );
      case "wifi-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20h.01" />  <path d="M8.5 16.429a5 5 0 0 1 7 0" />  <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />  <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />  <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />  <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />  <path d="m2 2 20 20" /></svg>'
        );
      case "wifi-pen":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2 8.82a15 15 0 0 1 20 0" />  <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />  <path d="M5 12.859a10 10 0 0 1 10.5-2.222" />  <path d="M8.5 16.429a5 5 0 0 1 3-1.406" /></svg>'
        );
      case "wifi-sync":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" />  <path d="M11.965 14.105h4" />  <path d="M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" />  <path d="M2 8.82a15 15 0 0 1 20 0" />  <path d="M21.965 22.105v-4" />  <path d="M5 12.86a10 10 0 0 1 3-2.032" />  <path d="M8.5 16.429h.01" /></svg>'
        );
      case "wifi-zero":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20h.01" /></svg>'
        );
      case "wifi":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12 20h.01" />  <path d="M2 8.82a15 15 0 0 1 20 0" />  <path d="M5 12.859a10 10 0 0 1 14 0" />  <path d="M8.5 16.429a5 5 0 0 1 7 0" /></svg>'
        );
      case "wind-arrow-down":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10 2v8" />  <path d="M12.8 21.6A2 2 0 1 0 14 18H2" />  <path d="M17.5 10a2.5 2.5 0 1 1 2 4H2" />  <path d="m6 6 4 4 4-4" /></svg>'
        );
      case "wind":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />  <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />  <path d="M9.8 4.4A2 2 0 1 1 11 8H2" /></svg>'
        );
      case "windmill":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m10 14 8 4 2-4L4 6l2-4 8 4" />  <path d="m8 8-4 8 4 2" />  <path d="m16 12 4-8-4-2L6 22" />  <path d="m19 22-2.4-4.6" />  <path d="M12.5 20v2" />  <path d="M4 22h17" /></svg>'
        );
      case "wine-glass-bottle":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M3 13h8" />  <path d="M5 7s-2 3-2 6a4 4 0 0 0 8 0c0-3-2-6-2-6Z" />  <path d="M7 17v5" />  <path d="M4 22h6" />  <path d="M18 4c0 3-3 3-3 6v11c0 .6.4 1 1 1h4c.6 0 1-.4 1-1V10c0-3-3-3-3-6" />  <path d="M18 4V2" /></svg>'
        );
      case "wine-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 22h8" />  <path d="M7 10h3m7 0h-1.343" />  <path d="M12 15v7" />  <path d="M7.307 7.307A12.33 12.33 0 0 0 7 10a5 5 0 0 0 7.391 4.391M8.638 2.981C8.75 2.668 8.872 2.34 9 2h6c1.5 4 2 6 2 8 0 .407-.05.809-.145 1.198" />  <line x1="2" x2="22" y1="2" y2="22" /></svg>'
        );
      case "wine":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M8 22h8" />  <path d="M7 10h10" />  <path d="M12 15v7" />  <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" /></svg>'
        );
      case "workflow":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <rect width="8" height="8" x="3" y="3" rx="2" />  <path d="M7 11v4a2 2 0 0 0 2 2h4" />  <rect width="8" height="8" x="13" y="13" rx="2" /></svg>'
        );
      case "worm":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m19 12-1.5 3" />  <path d="M19.63 18.81 22 20" />  <path d="M6.47 8.23a1.68 1.68 0 0 1 2.44 1.93l-.64 2.08a6.76 6.76 0 0 0 10.16 7.67l.42-.27a1 1 0 1 0-2.73-4.21l-.42.27a1.76 1.76 0 0 1-2.63-1.99l.64-2.08A6.66 6.66 0 0 0 3.94 3.9l-.7.4a1 1 0 1 0 2.55 4.34z" /></svg>'
        );
      case "wrap-text":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="m16 16-2 2 2 2" />  <path d="M3 12h15a3 3 0 1 1 0 6h-4" />  <path d="M3 18h7" />  <path d="M3 6h18" /></svg>'
        );
      case "wrench":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" /></svg>'
        );
      case "x":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M18 6 6 18" />  <path d="m6 6 12 12" /></svg>'
        );
      case "yarn-ball":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <path d="M10 6h10" />  <path d="M14 10h7.8" />  <path d="m7.2 3.2 13.6 13.6" />  <path d="m4 6 15.3 15.3c.4.4 1.2.7 1.7.7h1" />  <path d="m2.2 10.2 11.6 11.6" /></svg>'
        );
      case "yin-yang":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="12" cy="12" r="10" />  <circle cx="12" cy="7" r=".5" />  <path d="M12 22a5 5 0 1 0 0-10 5 5 0 1 1 0-10" />  <circle cx="12" cy="17" r=".5" /></svg>'
        );
      case "youtube":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />  <path d="m10 15 5-3-5-3z" /></svg>'
        );
      case "zap-off":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M10.513 4.856 13.12 2.17a.5.5 0 0 1 .86.46l-1.377 4.317" />  <path d="M15.656 10H20a1 1 0 0 1 .78 1.63l-1.72 1.773" />  <path d="M16.273 16.273 10.88 21.83a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4a1 1 0 0 1-.78-1.63l4.507-4.643" />  <path d="m2 2 20 20" /></svg>'
        );
      case "zap":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>'
        );
      case "zoom-in":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11" cy="11" r="8" />  <line x1="21" x2="16.65" y1="21" y2="16.65" />  <line x1="11" x2="11" y1="8" y2="14" />  <line x1="8" x2="14" y1="11" y2="11" /></svg>'
        );
      case "zoom-out":
        return (
          '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="' +
          currentColor +
          '"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <circle cx="11" cy="11" r="8" />  <line x1="21" x2="16.65" y1="21" y2="16.65" />  <line x1="8" x2="14" y1="11" y2="11" /></svg>'
        );
      case "loading":
      default:
        return (
          '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin lucide lucide-loader-icon lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>'
        );
        break;
    }
  }
}
