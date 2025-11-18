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
import { icons } from "lucide";
import * as lucideLabIcons from "@lucide/lab";

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

  private rootStyle: CSSStyleDeclaration = document.documentElement.style;

  private labIcons: Record<string, any> = Object.fromEntries(
    Object.entries(lucideLabIcons).map(([name, iconData]) => [
      name.charAt(0).toUpperCase() + name.slice(1), // PascalCase
      iconData,
    ])
  );

  constructor(options: VisualConstructorOptions) {
    this.target = options.element;
    this.formattingSettingsService = new FormattingSettingsService();
    this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element, 0);

    this.tooltipService = options.host.tooltipService;

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
      this.header_text.className = "header-text";
      this.header_text.innerText = "";

      this.header_content.appendChild(this.header_text);

      /*###########################################################
        CREATE MIDDLE ICON AND VALUE TEXT
      ###########################################################*/
      this.middle_content_center_text = document.createElement("p");
      this.middle_content_center_text.className = "middle-content-center-text";
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
      this.information_trend_container_text.innerText = ".....";
      this.information_trend_container_text.className = "middle-trend-text";

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
        this.isHighContrast ? this.themeBackgroundColour : "#FFFFFF",
        this.footer_content_left_icon
      );

      this.footer_content_left = document.createElement("div");
      this.footer_content_left.className = "flex-item-left";
      this.footer_content_left.appendChild(this.footer_content_left_icon);

      //############### CREATE RIGHT FOOTER SECTION ###############
      //TOP TEXT
      this.footer_content_right_text_top = document.createElement("p");
      this.footer_content_right_text_top.className = "footer-text-top";
      this.footer_content_right_text_top.innerText = ".....";
      //BOTTOM TEXT
      this.footer_content_right_text_bottom = document.createElement("p");
      this.footer_content_right_text_bottom.className = "footer-text-bottom";
      this.footer_content_right_text_bottom.innerText = ".....";

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

      if (this.isHighContrast) {
        this.rootStyle.setProperty("--primary-color", this.themeForegroundColour);
        this.rootStyle.setProperty("--secondary-color", this.themeBackgroundColour);
        this.rootStyle.setProperty("--center-color", this.themeForegroundColour);
        this.rootStyle.setProperty("--bottom-color", this.themeBackgroundColour);
      }

      let width: number = options.element.clientWidth;
      let height: number = options.element.clientHeight;

      let padding: number = 5;

      this.main_content.style.width = width - padding * 2 + "px";
      this.main_content.style.height = height - padding + "px";

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
      ? this.themeBackgroundColour
      : (styleCard.bottomLeftIconColour.value.value as string);

    const trendUpColour: string = this.isHighContrast ? this.themeForegroundColour : "#4CBB17";
    const trendDownColour: string = this.isHighContrast ? this.themeForegroundColour : "#ED1C24";

    this.rootStyle.setProperty("--primary-color", primaryColour as string);
    this.rootStyle.setProperty("--secondary-color", secondaryColour as string);
    this.rootStyle.setProperty("--center-color", centerIconColour as string);
    this.rootStyle.setProperty("--bottom-color", bottomIconColour as string);

    this.rootStyle.setProperty("--border-radius", `${styleCard.borderRadius.value}px`);
    this.rootStyle.setProperty("--header-text-size", `${textCard.title_fontSize.value}px`);
    this.rootStyle.setProperty("--value-font-size", `${textCard.value_fontSize.value}px`);
    this.rootStyle.setProperty("--footer-font-size", `${textCard.footer_text_top_fontSize.value}px`);

    /*##################################################################
      SET BORDER RADIUS
     ##################################################################*/

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

    this.rootStyle.setProperty("--header-text-family", headerTitleFontFamily);
    this.rootStyle.setProperty("--header-text-size", `${headerTitleFontSize}px`);
    this.rootStyle.setProperty("--header-text-style", headerTitleItalic ? "italic" : "normal");
    this.rootStyle.setProperty("--header-text-weight", headerTitleBold ? "bold" : "normal");
    this.rootStyle.setProperty("--header-text-decoration", headerTitleUnderlined ? "underline" : "normal");
    this.rootStyle.setProperty("--header-text-align", headerTitleAlignment);

    /*##################################################################
      VALUE FONT DETAILS
     ##################################################################*/

    const valueFontFamily = textCard.value_fontFamily.value.toString();
    const valueFontSize = textCard.value_fontSize.value.toString();
    const valueBold = textCard.value_bold.value;
    const valueItalic = textCard.value_italic.value;
    const valueUnderlined = textCard.value_underline.value;
    const valueAlignment = textCard.value_alignment.value;

    console.log(textCard);

    console.log(valueFontFamily, valueFontSize, valueBold, valueItalic, valueUnderlined, valueAlignment);
    this.rootStyle.setProperty("--middle-text-family", valueFontFamily);
    this.rootStyle.setProperty("--middle-text-size", `${valueFontSize}px`);
    this.rootStyle.setProperty("--middle-text-style", valueItalic ? "italic" : "normal");
    this.rootStyle.setProperty("--middle-text-weight", valueBold ? "bold" : "normal");
    this.rootStyle.setProperty("--middle-text-decoration", valueUnderlined ? "underline" : "normal");
    this.rootStyle.setProperty("--middle-text-align", valueAlignment);

    /*##################################################################
      TREND FONT DETAILS
     ##################################################################*/

    const trendTitleFontFamily = textCard.trend_fontFamily.value.toString();
    const trendTitleFontSize = textCard.trend_fontSize.value.toString();
    const trendTitleItalic = textCard.trend_italic.value;
    const trendTitleBold = textCard.trend_bold.value;
    const trendTitleUnderlined = textCard.trend_underline.value;

    this.rootStyle.setProperty("--trend-text-family", trendTitleFontFamily);
    this.rootStyle.setProperty("--trend-text-size", `${trendTitleFontSize}px`);
    this.rootStyle.setProperty("--trend-text-style", trendTitleItalic ? "italic" : "normal");
    this.rootStyle.setProperty("--trend-text-weight", trendTitleBold ? "bold" : "normal");
    this.rootStyle.setProperty("--trend-text-decoration", trendTitleUnderlined ? "underline" : "normal");

    /*##################################################################
      FOOTER TOP TEXT DETAILS
     ##################################################################*/

    const footerTextTopFontFamily = textCard.footer_text_top_fontFamily.value.toString();
    const footerTextTopFontSize = textCard.footer_text_top_fontSize.value.toString();
    const footerTextTopBold = textCard.footer_text_top_bold.value;
    const footerTextTopItalic = textCard.footer_text_top_italic.value;
    const footerTextTopUnderlined = textCard.footer_text_top_underline.value;
    const footerTextTopAlignment = textCard.footer_text_top_alignment.value;

    this.rootStyle.setProperty("--footer-top-text-family", footerTextTopFontFamily);
    this.rootStyle.setProperty("--footer-top-text-size", `${footerTextTopFontSize}px`);
    this.rootStyle.setProperty("--footer-top-text-style", footerTextTopItalic ? "italic" : "normal");
    this.rootStyle.setProperty("--footer-top-text-weight", footerTextTopBold ? "bold" : "normal");
    this.rootStyle.setProperty("--footer-top-text-decoration", footerTextTopUnderlined ? "underline" : "normal");
    this.rootStyle.setProperty("--footer-top-text-align", footerTextTopAlignment);

    /*##################################################################
      FOOTER BOTTOM TEXT DETAILS
     ##################################################################*/

    const footerTextBottomFontFamily = textCard.footer_text_bottom_fontFamily.value.toString();
    const footerTextBottomFontSize = textCard.footer_text_bottom_fontSize.value.toString();
    const footerTextBottomBold = textCard.footer_text_bottom_bold.value;
    const footerTextBottomItalic = textCard.footer_text_bottom_italic.value;
    const footerTextBottomUnderlined = textCard.footer_text_bottom_underline.value;
    const footerTextBottomAlignment = textCard.footer_text_bottom_alignment.value;

    this.rootStyle.setProperty("--footer-bottom-text-family", footerTextBottomFontFamily);
    this.rootStyle.setProperty("--footer-bottom-text-size", `${footerTextBottomFontSize}px`);
    this.rootStyle.setProperty("--footer-bottom-text-style", footerTextBottomItalic ? "italic" : "normal");
    this.rootStyle.setProperty("--footer-bottom-text-weight", footerTextBottomBold ? "bold" : "normal");
    this.rootStyle.setProperty("--footer-bottom-text-decoration", footerTextBottomUnderlined ? "underline" : "normal");
    this.rootStyle.setProperty("--footer-bottom-text-align", footerTextBottomAlignment);

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

  private async swapSVGIcon(iconValue: string, currentColor: string, div: HTMLElement) {
    // Clear previous content
    this.removeChildren(div);

    // If icon is "none", return immediately
    if (iconValue === "none") {
      div.appendChild(this.parseSVG(this.getIconNone(currentColor)));
      return;
    }
    // Show loader while waiting
    div.appendChild(this.parseSVG(this.getIconLoader(currentColor)));

    try {
      const pascalCase = this.toPascalCase(iconValue);
      const svgString = this.getSVGIcon(iconValue, currentColor); //?.toSvg({ color: currentColor });
      //console.log(pascalCase);
      //console.log(icons);
      //console.log(svgString);

      // Parse and append
      const parser = new DOMParser();
      const svgElement = parser.parseFromString(svgString, "image/svg+xml").firstChild as SVGElement;
      svgElement.style.pointerEvents = "none";

      // Replace loader with actual icon
      this.removeChildren(div);
      div.appendChild(svgElement);
    } catch (err) {
      console.error(`Failed to load icon "${iconValue}"`, err);
      this.removeChildren(div);
      div.appendChild(this.parseSVG(this.getIconNone(currentColor)));
    }
  }

  private removeChildren(container: HTMLElement) {
    while (container.firstChild) {
      container.removeChild(container.lastChild);
    }
  }

  private parseSVG(svgString: string): SVGElement {
    const parser = new DOMParser();
    return parser.parseFromString(svgString, "image/svg+xml").firstChild as SVGElement;
  }

  private toPascalCase(name: string): string {
    return name
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }

  private getSVGIcon(iconValue: string, currentColor: string, size: number = 24): string {
    if (iconValue === "none") {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>`;
    }

    if (iconValue === "loading") {
      return this.getIconLoader(currentColor);
    }

    const pascalName = this.toPascalCase(iconValue);
    const iconData = icons[pascalName];
    const labIcon = this.labIcons[pascalName];

    const selectedIcon = iconData ? iconData : labIcon;
    //console.log(selectedIcon);
    //console.log(this.labIcons);
    if (!iconData && !labIcon) {
      console.warn(`Icon "${iconValue}" not found`);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>`;
    }

    // Build SVG string manually
    const attrsString = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${currentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" `;

    //console.log(attrsString);

    const paths = selectedIcon
      .map(([tag, attrs]) => {
        const pathAttrs = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(" ");
        return `<${tag} ${pathAttrs}/>`;
      })
      .join("");

    return `<svg ${attrsString}>${paths}</svg>`;
  }

  private getIconLoader(color: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin lucide-loader">
        <path d="M12 2v4"/>
        <path d="m16.2 7.8 2.9-2.9"/>
        <path d="M18 12h4"/>
        <path d="m16.2 16.2 2.9 2.9"/>
        <path d="M12 18v4"/>
        <path d="m4.9 19.1 2.9-2.9"/>
        <path d="M2 12h4"/>
        <path d="m4.9 4.9 2.9 2.9"/>
      </svg>
    `;
  }

  private getIconNone(color: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>
    `;
  }
}
