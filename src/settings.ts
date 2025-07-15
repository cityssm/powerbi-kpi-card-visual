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

"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

const iconList: powerbi.IEnumMember[] = [
  { value: "none", displayName: "Nothing/Transparent" },
  { value: "hide", displayName: "Hide Icons Formatting" },
  { value: "accessibility", displayName: "Accessibility" },
  { value: "activity", displayName: "Activity" },
  { value: "alarm-clock", displayName: "Alarm Clock" },
  { value: "armchair", displayName: "Armchair" },
  { value: "badge-dollar-sign", displayName: "Dollar Sign Badge" },
  { value: "bed-double", displayName: "Bed Double" },
  { value: "bell-electric", displayName: "Bell Electric" },
  { value: "bike", displayName: "Bike" },
  { value: "book-open", displayName: "Book Open" },
  { value: "brain", displayName: "Brain" },
  { value: "building", displayName: "Building Type A" },
  { value: "building-2", displayName: "Building Type B" },
  { value: "bus", displayName: "Bus" },
  { value: "cabinet-filing", displayName: "Filing Cabinet" },
  { value: "calendar", displayName: "Calendar Type A" },
  { value: "calendar-check-2", displayName: "Calendar Type B" },
  { value: "calendar-range", displayName: "Calendar Type C" },
  { value: "chart-no-axes-combined", displayName: "Chart Type A" },
  { value: "chart-pie", displayName: "Chart Pie" },
  { value: "check", displayName: "Check" },
  { value: "check-check", displayName: "Check Check" },
  { value: "circle-alert", displayName: "Alert Circle" },
  { value: "circle-dollar-sign", displayName: "Dollar Sign Circle" },
  { value: "circle-parking", displayName: "Circle Parking" },
  { value: "circle-user-round", displayName: "User Circle" },
  { value: "citrus", displayName: "Citrus" },
  { value: "clipboard-list", displayName: "Clipboard List" },
  { value: "clipboard-pen-line", displayName: "Clipboard Pen" },
  { value: "clock", displayName: "Clock" },
  { value: "coffee", displayName: "Coffee" },
  { value: "compass", displayName: "Compass" },
  { value: "construction", displayName: "Construction" },
  { value: "database", displayName: "Database" },
  { value: "dollar-sign", displayName: "Dollar Sign" },
  { value: "door-open", displayName: "Door Open" },
  { value: "drama", displayName: "Drama" },
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
  { value: "handshake", displayName: "Handshake" },
  { value: "house", displayName: "House" },
  { value: "house-plug", displayName: "House Plug" },
  { value: "house-plus", displayName: "House Plus" },
  { value: "house-wifi", displayName: "House WiFi" },
  { value: "houses", displayName: "Houses" },
  { value: "land-plot", displayName: "Land Plot" },
  { value: "landmark", displayName: "Landmark" },
  { value: "leaf", displayName: "Leaf" },
  { value: "lock-keyhole", displayName: "Lock Keyhole" },
  { value: "luggage", displayName: "Luggage" },
  { value: "mail", displayName: "Mail" },
  { value: "mails", displayName: "Mail Multiple" },
  { value: "map-pin", displayName: "Map Pin" },
  { value: "map-plus", displayName: "Map Plus" },
  { value: "medal", displayName: "Medal" },
  { value: "mic-vocal", displayName: "Microphone" },
  { value: "party-popper", displayName: "Party Popper" },
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
  { value: "tent", displayName: "Tent" },
  { value: "tent-tree", displayName: "Tree Tent" },
  { value: "theater", displayName: "Theater" },
  { value: "train-front-tunnel", displayName: "Train Tunnel" },
  { value: "trash-2", displayName: "Trash" },
  { value: "trees-forest", displayName: "Trees" },
  { value: "trending-up", displayName: "Trending Up" },
  { value: "triangle-alert", displayName: "Alert Triangle" },
  { value: "utensils", displayName: "Utensils" },
  { value: "waves", displayName: "Waves" },
  { value: "waves-ladder", displayName: "Waves Ladder" },
  { value: "yin-yang", displayName: "Ying Yang" },
];

const iconTrendList: powerbi.IEnumMember[] = [
  { value: "arrow-#", displayName: "Arrow" },
  { value: "move-#", displayName: "Arrow Narrow Tall" },
  { value: "arrow-#-narrow-wide", displayName: "Arrow Narrow Steps" },
  { value: "chevron-#", displayName: "Chevron" },
  { value: "trending-#", displayName: "Trend" },
  { value: "none", displayName: "Nothing/Transparent" },
  { value: "hide", displayName: "Hide Trend Formatting" },
];

const centerIconSize: powerbi.IEnumMember[] = [
  { value: "middle-icon-large", displayName: "Large" },
  { value: "middle-icon-medium", displayName: "Medium" },
  { value: "middle-icon-small", displayName: "Small" },
  { value: "middle-icon-extra-small", displayName: "Extra Small" },
];

const bottomLeftIconSize: powerbi.IEnumMember[] = [
  { value: "footer-icon-extra-large", displayName: "Extra Large" },
  { value: "footer-icon-large", displayName: "Large" },
  { value: "footer-icon-medium", displayName: "Medium" },
  { value: "footer-icon-small", displayName: "Small" },
];

/**
 * Data Point Formatting Card
 */
class StyleCardSettings extends FormattingSettingsCard {
  name: string = "style";
  displayName: string = "Styles";

  primaryColour = new formattingSettings.ColorPicker({
    name: "primaryColour",
    displayName: "Primary Colour",

    value: { value: "#007681" },
  });

  secondaryColour = new formattingSettings.ColorPicker({
    name: "secondaryColour",
    displayName: "Secondary Colour",
    value: { value: "#FFFFFF" },
  });

  centerIconColour = new formattingSettings.ColorPicker({
    name: "centerIconColour",
    displayName: "Center Icon/Text Colour",
    value: { value: "#000000" },
  });

  bottomLeftIconColour = new formattingSettings.ColorPicker({
    name: "bottomLeftIconColour",
    displayName: "Bottom Left Icon/Text Colour",
    value: { value: "#FFFFFF" },
  });

  //footerTextRightBottom = new formattingSettings.FontControl({});
  centerIcon = new formattingSettings.ItemDropdown({
    name: "centerIcon",
    displayName: "Center Icon",
    items: iconList,
    value: iconList[0],
  });

  centerIconSize = new formattingSettings.ItemDropdown({
    name: "centerIconSize",
    displayName: "Center Icon Size",
    items: centerIconSize,
    value: centerIconSize[0],
  });

  bottomLeftIcon = new formattingSettings.ItemDropdown({
    name: "bottomLeftIcon",
    displayName: "Bottom Left Icon",
    items: iconList,
    value: iconList[0],
  });

  bottomLeftIconSize = new formattingSettings.ItemDropdown({
    name: "bottomLeftIconSize",
    displayName: "Bottom Left Icon Size",
    items: bottomLeftIconSize,
    value: bottomLeftIconSize[1],
  });

  trendIcon = new formattingSettings.ItemDropdown({
    name: "trendIcon",
    displayName: "Trend Icon",
    items: iconTrendList,
    value: iconTrendList[0],
  });

  borderRadius = new formattingSettings.Slider({
    name: "borderRadius",
    displayName: "Border Radius",
    value: 0,
    // optional input value validator
    options: {
      maxValue: {
        type: powerbi.visuals.ValidatorType.Max,
        value: 50,
      },
      minValue: {
        type: powerbi.visuals.ValidatorType.Min,
        value: 0,
      },
    },
  });

  slices: Array<FormattingSettingsSlice> = [
    this.primaryColour,
    this.secondaryColour,
    this.centerIconColour,
    this.bottomLeftIconColour,
    this.centerIcon,
    this.centerIconSize,
    this.bottomLeftIcon,
    this.bottomLeftIconSize,
    this.trendIcon,
    this.borderRadius,
  ];
}

class TextCardSetting extends formattingSettings.SimpleCard {
  name: string = "text"; // same as capabilities object name
  displayName: string = "Text";

  public title_fontFamily: formattingSettings.FontPicker = new formattingSettings.FontPicker({
    name: "title_fontFamily", // same as capabilities property name
    value: "Arial, sans-serif",
  });

  public title_fontSize: formattingSettings.NumUpDown = new formattingSettings.NumUpDown({
    name: "title_fontSize", // same as capabilities property name
    value: 21,
  });

  public title_bold: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "title_bold", // same as capabilities property name
    value: true,
  });

  public title_italic: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "title_italic", // same as capabilities property name
    value: false,
  });

  public title_underline: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "title_underline", // same as capabilities property name
    value: false,
  });

  public title_font: formattingSettings.FontControl = new formattingSettings.FontControl({
    name: "title_font", // must be unique within the same object
    displayName: "Title Font",
    fontFamily: this.title_fontFamily,
    fontSize: this.title_fontSize,
    bold: this.title_bold, //optional
    italic: this.title_italic, //optional
    underline: this.title_underline, //optional
  });

  public footer_text_top_fontFamily: formattingSettings.FontPicker = new formattingSettings.FontPicker({
    name: "footer_text_top_fontFamily", // same as capabilities property name
    value: "Arial, sans-serif",
  });

  public footer_text_top_fontSize: formattingSettings.NumUpDown = new formattingSettings.NumUpDown({
    name: "footer_text_top_fontSize", // same as capabilities property name
    value: 21,
  });

  public footer_text_top_bold: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "footer_text_top_bold", // same as capabilities property name
    value: false,
  });

  public footer_text_top_italic: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "footer_text_top_italic", // same as capabilities property name
    value: false,
  });

  public footer_text_top_underline: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "footer_text_top_underline", // same as capabilities property name
    value: false,
  });

  public footer_text_top_font: formattingSettings.FontControl = new formattingSettings.FontControl({
    name: "footer_text_top_font", // must be unique within the same object
    displayName: "Footer Top Font",
    fontFamily: this.footer_text_top_fontFamily,
    fontSize: this.footer_text_top_fontSize,
    bold: this.footer_text_top_bold, //optional
    italic: this.footer_text_top_italic, //optional
    underline: this.footer_text_top_underline, //optional
  });

  public footer_text_bottom_fontFamily: formattingSettings.FontPicker = new formattingSettings.FontPicker({
    name: "footer_text_bottom_fontFamily", // same as capabilities property name
    value: "Arial, sans-serif",
  });

  public footer_text_bottom_fontSize: formattingSettings.NumUpDown = new formattingSettings.NumUpDown({
    name: "footer_text_bottom_fontSize", // same as capabilities property name
    value: 21,
  });

  public footer_text_bottom_bold: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "footer_text_bottom_bold", // same as capabilities property name
    value: false,
  });

  public footer_text_bottom_italic: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "footer_text_bottom_italic", // same as capabilities property name
    value: false,
  });

  public footer_text_bottom_underline: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "footer_text_bottom_underline", // same as capabilities property name
    value: false,
  });

  public footer_text_bottom_font: formattingSettings.FontControl = new formattingSettings.FontControl({
    name: "footer_text_bottom_font", // must be unique within the same object
    displayName: "Footer Bottom Font",
    fontFamily: this.footer_text_bottom_fontFamily,
    fontSize: this.footer_text_bottom_fontSize,
    bold: this.footer_text_bottom_bold, //optional
    italic: this.footer_text_bottom_italic, //optional
    underline: this.footer_text_bottom_underline, //optional
  });

  public value_fontFamily: formattingSettings.FontPicker = new formattingSettings.FontPicker({
    name: "value_fontFamily", // same as capabilities property name
    value: "Arial, sans-serif",
  });

  public value_fontSize: formattingSettings.NumUpDown = new formattingSettings.NumUpDown({
    name: "value_fontSize", // same as capabilities property name
    value: 46,
  });

  public value_bold: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "value_bold", // same as capabilities property name
    value: false,
  });

  public value_italic: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "value_italic", // same as capabilities property name
    value: false,
  });

  public value_underline: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
    name: "value_underline", // same as capabilities property name
    value: false,
  });

  public value_font: formattingSettings.FontControl = new formattingSettings.FontControl({
    name: "value_font", // must be unique within the same object
    displayName: "Value Font",
    fontFamily: this.value_fontFamily,
    fontSize: this.value_fontSize,
    bold: this.value_bold, //optional
    italic: this.value_italic, //optional
    underline: this.value_underline, //optional
  });

  public title_alignment: formattingSettings.AlignmentGroup = new formattingSettings.AlignmentGroup({
    name: "title_alignment",
    displayName: "Title Alignment",
    value: "center",
    mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
  });

  public value_alignment: formattingSettings.AlignmentGroup = new formattingSettings.AlignmentGroup({
    name: "value_alignment",
    displayName: "Value Alignment",
    value: "center",
    mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
  });

  public footer_text_top_alignment: formattingSettings.AlignmentGroup = new formattingSettings.AlignmentGroup({
    name: "footer_text_top_alignment",
    displayName: "Footer Top Alignment",
    value: "left",
    mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
  });

  public footer_text_bottom_alignment: formattingSettings.AlignmentGroup = new formattingSettings.AlignmentGroup({
    name: "footer_text_bottom_alignment",
    displayName: "Footer Bottom Alignment",
    value: "left",
    mode: powerbi.visuals.AlignmentGroupMode.Horizonal,
  });

  public slices: formattingSettings.Slice[] = [
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
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
  // Create formatting settings model formatting cards
  styleCard = new StyleCardSettings();
  textCard = new TextCardSetting();
  cards = [this.styleCard, this.textCard];
}
