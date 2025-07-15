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
import { textMeasurementService, valueFormatter } from "powerbi-visuals-utils-formattingutils";

import { BaseType, select as d3Select, Selection as d3Selection } from "d3-selection";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;

import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.IVisualHost;

import * as d3 from "d3";

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

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

  constructor(options: VisualConstructorOptions) {
    this.formattingSettingsService = new FormattingSettingsService();

    this.target = options.element;
    this.tooltipService = options.host.tooltipService;
    this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element);

    let colorPalette: ISandboxExtendedColorPalette = options.host.colorPalette;

    this.isHighContrast = colorPalette.isHighContrast;

    if (this.isHighContrast) {
      this.themeForegroundColour = colorPalette.foreground.value;
      this.themeBackgroundColour = colorPalette.background.value;
      this.themeForegroundSelectedColour = colorPalette.foregroundSelected.value;
      this.themeLinkColour = colorPalette.hyperlink.value;
    }

    options.host.hostCapabilities.allowInteractions = true;

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
      //this.middle_content_center_text.style.margin = "auto";

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

      /*this.middle_content_center_info = document.createElement("div");
      this.middle_content_center_info.className = "middle-content-info";
      this.middle_content_center_info.appendChild(this.information_tooltip_container);
      this.middle_content_center_info.appendChild(this.information_trend_container);*/

      /*
      this.information_tooltip_button = document.createElement("div");
      this.information_tooltip_button.appendChild(this.information_tooltip_button_icon);

      this.information_tooltip_container = document.createElement("div");
      this.information_tooltip_container.className = "middle-info-container";

      this.information_tooltip_container.appendChild(this.information_tooltip_button);*/

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
      //this.middle_content_center.appendChild(this.middle_content_center_info);

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
      //this.middle_content_info.className = "flex-container-middle";
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

      //this.main_content.appendChild(this.information_tooltip_container);
      //this.main_content.appendChild(this.information_trend_container);
      //this.target.hidden = true;

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

      this.header_content.tabIndex = 2;
      this.middle_content_center_text.tabIndex = 3;
      this.information_tooltip_container_button.tabIndex = 4;
      this.information_trend_container_button.tabIndex = 5;
      this.footer_content_right_text_top.tabIndex = 6;
      this.footer_content_right_text_bottom.tabIndex = 7;

      this.middle_content_center_icon.ariaHidden = "true";
      this.footer_content_left_icon.ariaHidden = "true";

      this.information_trend_container_icon.ariaHidden = "true";
      this.information_tooltip_container_button_icon.ariaHidden = "true";

      //this.header_content.ariaLabel = "Key Performance Indicator Title";
      this.header_content.role = "heading";
      //this.header_content.ara = "Key Performance Indicator Title";

      this.middle_content_center.ariaLabel = "Key Performance Indicator Value";
      this.middle_content_center.role = "paragraph";

      this.information_tooltip_container_button.ariaLabel = "Additional Information";
      this.information_tooltip_container_button.role = "button";
      this.information_tooltip_container_button.ariaHasPopup = "true";
      this.information_tooltip_container_button.ariaExpanded = String(this.isInfoTooltipOpen);
      this.information_tooltip_container_button.onclick = () => {
        //console.log("ORIGINAL CLICK");
      };
      this.information_tooltip_container_button.onkeydown = () => {
        //console.log("ORIGINAL KEYDOWN");
      };

      this.information_trend_container_button.ariaLabel = "Difference between last period";
      this.information_trend_container_button.role = "button";
      this.information_trend_container_button.ariaHasPopup = "true";
      this.information_trend_container_button.ariaExpanded = String(this.isTrendTooltipOpen);

      this.information_trend_container_button.onclick = () => {
        //console.log("ORIGINAL CLICK");
      };
      this.information_trend_container_button.onkeydown = () => {
        //console.log("ORIGINAL KEYDOWN");
      };

      this.footer_content_right_text_top.role = "paragraph";
      this.footer_content_right_text_bottom.role = "paragraph";

      this.target.appendChild(this.main_content);
    }
  }

  public update(options: VisualUpdateOptions) {
    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
      VisualFormattingSettingsModel,
      options.dataViews[0]
    );

    //this.target.hidden = false;
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
      SET COLOURS
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

    const tooltipTitleTrend = "Key Performance Indicator Trend";
    const tooltipDescriptionTrend = this.getData(tableDataView, 7);

    /*##################################################################
      INFO TOOLTIP SETTINGS
    ##################################################################*/
    const tooltipInfoChanged =
      tooltipTitleInfo !== this.currentTooltipInfoTitle ||
      tooltipDescriptionInfo !== this.currentTooltipInfoDescription;

    //INFO TOOLTIP
    this.setTooltip(
      this.information_tooltip_container_button,
      this.tooltipServiceWrapper,
      tooltipTitleInfo,
      tooltipDescriptionInfo
    );

    //If title or description have changed remove the onfocus event and recreate it.
    //otherwise the title and description will be wrong
    //only remove the event if one exists
    if (tooltipInfoChanged) {
      this.currentTooltipInfoTitle = tooltipTitleInfo;
      this.currentTooltipInfoDescription = tooltipDescriptionInfo;
      this.information_tooltip_container_button.onfocus = null;
      this.information_tooltip_container_button.onkeydown = null;
      this.information_tooltip_container_button.onclick = null;
    }

    //check if the onfocus event is already set if not create it.
    if (!this.information_tooltip_container_button.onfocus) {
      this.information_tooltip_container_button.onfocus = (event) => {
        this.onInfoTooltipEvent(event, tooltipTitleInfo, tooltipDescriptionInfo);
      };
    }

    if (!this.information_tooltip_container_button.onkeydown) {
      this.information_tooltip_container_button.onkeydown = (event) => {
        this.onInfoTooltipEvent(event, tooltipTitleInfo, tooltipDescriptionInfo);
      };
    }

    if (!this.information_tooltip_container_button.onclick) {
      this.information_tooltip_container_button.onclick = (event) => {
        this.onInfoTooltipEvent(event, tooltipTitleInfo, tooltipDescriptionInfo);
      };
      //check if the onblur event is already set if not create it.
      if (!this.information_tooltip_container_button.onblur) {
        this.information_tooltip_container_button.onblur = () => {
          this.hideTooltip();
          this.setIconTooltipToggle(false);
        };
      }
    }
    /*##################################################################
      TREND TOOLTIP SETTINGS
    ##################################################################*/
    const tooltipTrendChanged = tooltipDescriptionTrend !== this.currentTooltipTrendDescription;
    //TREND TOOLTIP
    this.setTooltip(
      this.information_trend_container,
      this.tooltipServiceWrapper,
      tooltipTitleTrend,
      tooltipDescriptionTrend
    );

    if (tooltipTrendChanged) {
      this.currentTooltipTrendTitle = tooltipTitleTrend;
      this.currentTooltipTrendDescription = tooltipDescriptionTrend;
      this.information_trend_container_button.onfocus = null;
      this.information_trend_container_button.onkeydown = null;
      this.information_trend_container_button.onclick = null;
    }

    //check if the onfocus event is already set if not create it.
    if (!this.information_trend_container_button.onfocus) {
      this.information_trend_container_button.onfocus = (event) => {
        this.onTrendTooltipEvent(event, tooltipTitleTrend, tooltipDescriptionTrend);
      };
    }

    if (!this.information_trend_container_button.onkeydown) {
      this.information_trend_container_button.onkeydown = (event) => {
        this.onTrendTooltipEvent(event, tooltipTitleTrend, tooltipDescriptionTrend);
      };
    }

    if (!this.information_trend_container_button.onclick) {
      this.information_trend_container_button.onclick = (event) => {
        this.onTrendTooltipEvent(event, tooltipTitleTrend, tooltipDescriptionTrend);
      };
      //check if the onblur event is already set if not create it.
      if (!this.information_trend_container_button.onblur) {
        this.information_trend_container_button.onblur = () => {
          this.hideTooltip();
          this.setTrendTooltipToggle(false);
        };
      }
    }
  }

  private onInfoTooltipEvent(event: any, tooltipTitle: string, tooltipDescriptionInfo: string) {
    if (
      event.type === "click" ||
      event.type === "focus" ||
      (event.type === "keydown" && (event.key === " " || event.key === "Enter"))
    ) {
      event.preventDefault(); //Prevents OnClick and OnKeyDown from being triggered at the same time

      const target = <HTMLDivElement>(<SVGElement>event.target).parentElement;
      //console.log(target);

      if (this.isInfoTooltipOpen) {
        this.hideTooltip();
        this.setIconTooltipToggle(false);
      } else {
        this.showTooltip(target, tooltipTitle, tooltipDescriptionInfo);
        this.setIconTooltipToggle(true);
      }
    }
  }

  private onTrendTooltipEvent(event: any, tooltipTitle: string, tooltipDescriptionInfo: string) {
    if (
      event.type === "click" ||
      event.type === "focus" ||
      (event.type === "keydown" && (event.key === " " || event.key === "Enter"))
    ) {
      event.preventDefault(); //Prevents OnClick and OnKeyDown from being triggered at the same time
      const target = <HTMLDivElement>(<SVGElement>event.target).parentElement;
      //console.log(target);

      if (this.isTrendTooltipOpen) {
        this.hideTooltip();
        this.setTrendTooltipToggle(false);
      } else {
        this.showTooltip(target, tooltipTitle, tooltipDescriptionInfo, false);
        this.setTrendTooltipToggle(true);
      }
    }
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

    const floatValue = parseFloat(textValue);

    if (trendIconSelected === "hide" || !floatValue || floatValue === 0) {
      containingElement.hidden = true;
      return;
    }

    textElement.textContent = (floatValue > 0 ? "+ " : floatValue < 0 ? "- " : "") + textValue;

    containingElement.hidden = false;

    const directionValue = this.getData(tableDataView, directionPosition);

    this.swapSVGIcon(
      trendIconSelected.replace("#", directionValue),
      (directionValue === "up" && floatValue > 0) || (directionValue === "down" && floatValue < 0)
        ? trendUpColour
        : trendDownColour,
      iconElement
    );
  }

  private setTooltip(
    tooltipElement: HTMLElement,
    tooltipService: ITooltipServiceWrapper,
    title: string,
    description: string
  ) {
    if (tooltipElement) {
      tooltipService.addTooltip(d3Select(tooltipElement), () => {
        return [
          {
            displayName: "",
            value: description,
            header: title,
          },
        ];
      });
    }
  }

  private getTooltipData(value: string): VisualTooltipDataItem[] {
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
      case "accessibility":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-accessibility-icon lucide-accessibility"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>'
        );
      case "activity":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity-icon lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>'
        );
      case "alarm-clock":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-icon lucide-alarm-clock"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>'
        );
      case "armchair":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-armchair-icon lucide-armchair"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>'
        );
      case "badge-dollar-sign":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-dollar-sign-icon lucide-badge-dollar-sign"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>'
        );
      case "bed-double":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bed-double-icon lucide-bed-double"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>'
        );
      case "bell-electric":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none" stroke="' +
          currentColor +
          '" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-bell-electric-icon lucide-bell-electric"><path d="M18.518 17.347A7 7 0 0 1 14 19M18.8 4A11 11 0 0 1 20 9M9 9h.01"/><circle cx="20" cy="16" r="2"/><circle cx="9" cy="9" r="7"/><rect width="10" height="6" x="4" y="16" rx="2"/></svg>'
        );

      case "book-open":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-icon lucide-book-open"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>'
        );
      case "brain":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brain-icon lucide-brain"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>'
        );
      case "building":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-icon lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>'
        );
      case "building-2":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2-icon lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>'
        );
      case "cabinet-filing":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cabinet-filing-icon lucide-cabinet-filing"><path d="M4 12h16"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M10 6h4"/><path d="M10 16h4"/></svg>'
        );
      case "calendar":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>'
        );
      case "calendar-check-2":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check2-icon lucide-calendar-check-2"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="m16 20 2 2 4-4"/></svg>'
        );
      case "calendar-range":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-range-icon lucide-calendar-range"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>'
        );
      case "chart-no-axes-combined":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-combined-icon lucide-chart-no-axes-combined"><path d="M12 16v5"/><path d="M16 14v7"/><path d="M20 10v11"/><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"/><path d="M4 18v3"/><path d="M8 14v7"/></svg>'
        );
      case "chart-pie":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-pie-icon lucide-chart-pie"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>'
        );
      case "check":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>'
        );
      case "check-check":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-check-icon lucide-check-check"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>'
        );
      case "circle-alert":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>'
        );
      case "circle-dollar-sign":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dollar-sign-icon lucide-circle-dollar-sign"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>'
        );
      case "circle-user-round":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>'
        );
      case "citrus":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-citrus-icon lucide-citrus"><path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z"/><path d="M19.65 15.66A8 8 0 0 1 8.35 4.34"/><path d="m14 10-5.5 5.5"/><path d="M14 17.85V10H6.15"/></svg>'
        );
      case "clock":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        );
      case "coffee":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coffee-icon lucide-coffee"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>'
        );
      case "compass":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass-icon lucide-compass"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>'
        );
      case "database":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-icon lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>'
        );
      case "dollar-sign":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign-icon lucide-dollar-sign"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
        );
      case "door-open":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open-icon lucide-door-open"><path d="M11 20H2"/><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z"/><path d="M11 4H8a2 2 0 0 0-2 2v14"/><path d="M14 12h.01"/><path d="M22 20h-3"/></svg>'
        );
      case "dumbbell":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dumbbell-icon lucide-dumbbell"><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/></svg>'
        );
      case "eye":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>'
        );
      case "farm":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-farm-icon lucide-farm"><path d="M8 14V4.5a2.5 2.5 0 0 0-5 0V14"/><path d="m8 8 6-5 8 6"/><path d="M20 4v10"/><rect width="4" height="4" x="12" y="10"/><path d="M2 14h20"/><path d="m2 22 5-8"/><path d="m7 22 5-8"/><path d="M22 22H12l5-8"/><path d="M15 18h7"/></svg>'
        );
      case "faucet":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-faucet-icon lucide-faucet"><path d="M10.22 4.9 5.4 6H5a2 2 0 0 1 0-4h.4l4.86 1"/><circle cx="12" cy="4" r="2"/><path d="m13.78 4.9 4.8 1h.4a2 2 0 0 0 0-4h-.4l-4.92 1"/><path d="M12 6v3"/><rect width="4" height="6" x="18" y="10"/><path d="M22 9v8"/><path d="M18 11h-2.6a3.87 3.87 0 0 0-6.8 0H7c-2.8 0-5 2.2-5 5v1h4v-1c0-.6.4-1 1-1h1.6a3.87 3.87 0 0 0 6.8 0H18"/><path d="M3.5 17S2 19 2 20a2 2 0 0 0 4 0c0-1-1.5-3-1.5-3"/></svg>'
        );
      case "ferris-wheel":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ferris-wheel-icon lucide-ferris-wheel"><circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/><path d="M18 18.7a9 9 0 1 0-12 0"/></svg>'
        );
      case "file":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-icon lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>'
        );
      case "file-badge-2":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-badge2-icon lucide-file-badge-2"><path d="m13.69 12.479 1.29 4.88a.5.5 0 0 1-.697.591l-1.844-.849a1 1 0 0 0-.88.001l-1.846.85a.5.5 0 0 1-.693-.593l1.29-4.88"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><circle cx="12" cy="10" r="3"/></svg>'
        );
      case "fire-extinguisher":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fire-extinguisher-icon lucide-fire-extinguisher"><path d="M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5"/><path d="M9 18h8"/><path d="M18 3h-3"/><path d="M11 3a6 6 0 0 0-6 6v11"/><path d="M5 13h4"/><path d="M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z"/></svg>'
        );
      case "gamepad-2":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gamepad2-icon lucide-gamepad-2"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>'
        );
      case "goal":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-goal-icon lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M20.561 10.222a9 9 0 1 1-12.55-5.29"/><path d="M8.002 9.997a5 5 0 1 0 8.9 2.02"/></svg>'
        );
      case "hammer":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hammer-icon lucide-hammer"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>'
        );
      case "house":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-icon lucide-house"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
        );
      case "house-plug":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-plug-icon lucide-house-plug"><path d="M10 12V8.964"/><path d="M14 12V8.964"/><path d="M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z"/><path d="M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2"/></svg>'
        );
      case "houses":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-houses-icon lucide-houses"><path d="M6 17H3c-.6 0-1-.4-1-1V8.5L8 4l10 7.5V19c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1v-7.5L16 4l6 4.5V16c0 .6-.4 1-1 1h-3"/><path d="M10 20v-6h4v6"/></svg>'
        );
      case "house-wifi":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-wifi-icon lucide-house-wifi"><path d="M9.5 13.866a4 4 0 0 1 5 .01"/><path d="M12 17h.01"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M7 10.754a8 8 0 0 1 10 0"/></svg>'
        );
      case "land-plot":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-land-plot-icon lucide-land-plot"><path d="m12 8 6-3-6-3v10"/><path d="m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"/><path d="m6.49 12.85 11.02 6.3"/><path d="M17.51 12.85 6.5 19.15"/></svg>'
        );
      case "leaf":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-leaf-icon lucide-leaf"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>'
        );
      case "lock-keyhole":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-keyhole-icon lucide-lock-keyhole"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>'
        );
      case "mail":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>'
        );
      case "mails":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mails-icon lucide-mails"><rect width="16" height="13" x="6" y="4" rx="2"/><path d="m22 7-7.1 3.78c-.57.3-1.23.3-1.8 0L6 7"/><path d="M2 8v11c0 1.1.9 2 2 2h14"/></svg>'
        );
      case "map-pin":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'
        );
      case "map-plus":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-plus-icon lucide-map-plus"><path d="m11 19-1.106-.552a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619V12"/><path d="M15 5.764V12"/><path d="M18 15v6"/><path d="M21 18h-6"/><path d="M9 3.236v15"/></svg>'
        );
      case "medal":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-medal-icon lucide-medal"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>'
        );
      case "pencil":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>'
        );
      case "phone":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-icon lucide-phone"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>'
        );
      case "popcorn":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-popcorn-icon lucide-popcorn"><path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4"/><path d="M10 22 9 8"/><path d="m14 22 1-14"/><path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z"/></svg>'
        );
      case "recycle":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-recycle-icon lucide-recycle"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/></svg>'
        );
      case "ruler":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-icon lucide-ruler"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>'
        );
      case "scroll-text":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scroll-text-icon lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>'
        );
      case "shield":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-icon lucide-shield"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>'
        );
      case "ship":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ship-icon lucide-ship"><path d="M12 10.189V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>'
        );
      case "ship-wheel":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ship-wheel-icon lucide-ship-wheel"><circle cx="12" cy="12" r="8"/><path d="M12 2v7.5"/><path d="m19 5-5.23 5.23"/><path d="M22 12h-7.5"/><path d="m19 19-5.23-5.23"/><path d="M12 14.5V22"/><path d="M10.23 13.77 5 19"/><path d="M9.5 12H2"/><path d="M10.23 10.23 5 5"/><circle cx="12" cy="12" r="2.5"/></svg>'
        );
      case "sprout":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout-icon lucide-sprout"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>'
        );
      case "store":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store-icon lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>'
        );
      case "target-arrow":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target-arrow-icon lucide-target-arrow"><path d="M19 2v3h3"/><path d="M13.4 10.6 22 2"/><circle cx="12" cy="12" r="2"/><path d="M12.3 6H12a6 6 0 1 0 6 6v-.3"/><path d="M15 2.5A9.93 9.93 0 1 0 21.5 9"/><path d="M5.3 19.4 4 22"/><path d="M18.7 19.4 20 22"/></svg>'
        );
      case "telescope":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-telescope-icon lucide-telescope"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>'
        );
      case "tent-tree":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tent-tree-icon lucide-tent-tree"><circle cx="4" cy="4" r="2"/><path d="m14 5 3-3 3 3"/><path d="m14 10 3-3 3 3"/><path d="M17 14V2"/><path d="M17 14H7l-5 8h20Z"/><path d="M8 14v8"/><path d="m9 14 5 8"/></svg>'
        );
      case "train-front-tunnel":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-train-front-tunnel-icon lucide-train-front-tunnel"><path d="M2 22V12a10 10 0 1 1 20 0v10"/><path d="M15 6.8v1.4a3 2.8 0 1 1-6 0V6.8"/><path d="M10 15h.01"/><path d="M14 15h.01"/><path d="M10 19a4 4 0 0 1-4-4v-3a6 6 0 1 1 12 0v3a4 4 0 0 1-4 4Z"/><path d="m9 19-2 3"/><path d="m15 19 2 3"/></svg>'
        );
      case "trash-2":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>'
        );
      case "trees-forest":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trees-forest-icon lucide-trees-forest"><path d="m9 5 3-3 3 3"/><path d="m9 10 3-3 3 3"/><path d="M12 12V2"/><path d="m2 15 3-3 3 3"/><path d="m2 20 3-3 3 3"/><path d="M5 22V12"/><path d="m16 15 3-3 3 3"/><path d="m16 20 3-3 3 3"/><path d="M19 22V12"/></svg>'
        );
      case "trending-up":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up-icon lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>'
        );
      case "triangle-alert":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
        );
      case "utensils":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-utensils-icon lucide-utensils"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>'
        );
      case "waves":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves-icon lucide-waves"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>'
        );
      case "yin-yang":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-yin-yang-icon lucide-yin-yang"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="7" r=".5"/><path d="M12 22a5 5 0 1 0 0-10 5 5 0 1 1 0-10"/><circle cx="12" cy="17" r=".5"/></svg>'
        );
      case "user":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        );
      case "info":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        );
      case "arrow-up":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-icon lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>'
        );
      case "arrow-up-narrow-wide":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-narrow-wide-icon lucide-arrow-up-narrow-wide"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/></svg>'
        );
      case "chevron-up":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>'
        );
      case "move-up":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-up-icon lucide-move-up"><path d="M8 6L12 2L16 6"/><path d="M12 2V22"/></svg>'
        );
      case "trending-up":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up-icon lucide-trending-up"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>'
        );
      case "arrow-down":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-icon lucide-arrow-down"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'
        );
      case "arrow-down-narrow-wide":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-narrow-wide-icon lucide-arrow-down-narrow-wide"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h4"/><path d="M11 8h7"/><path d="M11 12h10"/></svg>'
        );
      case "chevron-down":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>'
        );
      case "move-down":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-down-icon lucide-move-down"><path d="M8 18L12 22L16 18"/><path d="M12 2V22"/></svg>'
        );
      case "trending-down":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down-icon lucide-trending-down"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>'
        );

      case "bike":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike-icon lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>'
        );
      case "bus":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus-icon lucide-bus"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>'
        );
      case "circle-parking":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-parking-icon lucide-circle-parking"><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>'
        );
      case "house-plus":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-plus-icon lucide-house-plus"><path d="M12.662 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v2.475"/><path d="M14.959 12.717A1 1 0 0 0 14 12h-4a1 1 0 0 0-1 1v8"/><path d="M15 18h6"/><path d="M18 15v6"/></svg>'
        );
      case "clipboard-list":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list-icon lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>'
        );
      case "clipboard-pen-line":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-pen-line-icon lucide-clipboard-pen-line"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5"/><path d="M16 4h2a2 2 0 0 1 1.73 1"/><path d="M8 18h1"/><path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>'
        );
      case "drama":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-drama-icon lucide-drama"><path d="M10 11h.01"/><path d="M14 6h.01"/><path d="M18 6h.01"/><path d="M6.5 13.1h.01"/><path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3"/><path d="M17.4 9.9c-.8.8-2 .8-2.8 0"/><path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"/><path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4"/></svg>'
        );
      case "handshake":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-handshake-icon lucide-handshake"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>'
        );
      case "landmark":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark-icon lucide-landmark"><path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/></svg>'
        );
      case "luggage":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-luggage-icon lucide-luggage"><path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/><path d="M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/></svg>'
        );
      case "mic-vocal":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-vocal-icon lucide-mic-vocal"><path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"/><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"/><circle cx="16" cy="7" r="5"/></svg>'
        );
      case "party-popper":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-party-popper-icon lucide-party-popper"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>'
        );
      case "tent":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tent-icon lucide-tent"><path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/></svg>'
        );
      case "theater":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-theater-icon lucide-theater"><path d="M2 10s3-3 3-8"/><path d="M22 10s-3-3-3-8"/><path d="M10 2c0 4.4-3.6 8-8 8"/><path d="M14 2c0 4.4 3.6 8 8 8"/><path d="M2 10s2 2 2 5"/><path d="M22 10s-2 2-2 5"/><path d="M8 15h8"/><path d="M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/><path d="M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/></svg>'
        );

      case "waves-ladder":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves-ladder-icon lucide-waves-ladder"><path d="M19 5a2 2 0 0 0-2 2v11"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M7 13h10"/><path d="M7 9h10"/><path d="M9 5a2 2 0 0 0-2 2v11"/></svg>'
        );
      case "construction":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-construction-icon lucide-construction"><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/></svg>'
        );

      case "loading-circle":
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' +
          currentColor +
          '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin lucide lucide-loader-circle-icon lucide-loader-circle"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>'
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
