import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
/**
 * Data Point Formatting Card
 */
declare class StyleCardSettings extends FormattingSettingsCard {
    name: string;
    displayName: string;
    primaryColour: formattingSettings.ColorPicker;
    secondaryColour: formattingSettings.ColorPicker;
    centerIconColour: formattingSettings.ColorPicker;
    bottomLeftIconColour: formattingSettings.ColorPicker;
    centerIcon: formattingSettings.ItemDropdown;
    bottomLeftIcon: formattingSettings.ItemDropdown;
    trendIcon: formattingSettings.ItemDropdown;
    borderRadius: formattingSettings.Slider;
    slices: Array<FormattingSettingsSlice>;
}
declare class TextCardSetting extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    title_fontFamily: formattingSettings.FontPicker;
    title_fontSize: formattingSettings.NumUpDown;
    title_bold: formattingSettings.ToggleSwitch;
    title_italic: formattingSettings.ToggleSwitch;
    title_underline: formattingSettings.ToggleSwitch;
    title_font: formattingSettings.FontControl;
    footer_text_top_fontFamily: formattingSettings.FontPicker;
    footer_text_top_fontSize: formattingSettings.NumUpDown;
    footer_text_top_bold: formattingSettings.ToggleSwitch;
    footer_text_top_italic: formattingSettings.ToggleSwitch;
    footer_text_top_underline: formattingSettings.ToggleSwitch;
    footer_text_top_font: formattingSettings.FontControl;
    footer_text_bottom_fontFamily: formattingSettings.FontPicker;
    footer_text_bottom_fontSize: formattingSettings.NumUpDown;
    footer_text_bottom_bold: formattingSettings.ToggleSwitch;
    footer_text_bottom_italic: formattingSettings.ToggleSwitch;
    footer_text_bottom_underline: formattingSettings.ToggleSwitch;
    footer_text_bottom_font: formattingSettings.FontControl;
    value_fontFamily: formattingSettings.FontPicker;
    value_fontSize: formattingSettings.NumUpDown;
    value_bold: formattingSettings.ToggleSwitch;
    value_italic: formattingSettings.ToggleSwitch;
    value_underline: formattingSettings.ToggleSwitch;
    value_font: formattingSettings.FontControl;
    title_alignment: formattingSettings.AlignmentGroup;
    value_alignment: formattingSettings.AlignmentGroup;
    footer_text_top_alignment: formattingSettings.AlignmentGroup;
    footer_text_bottom_alignment: formattingSettings.AlignmentGroup;
    slices: formattingSettings.Slice[];
}
/**
 * visual settings model class
 *
 */
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    styleCard: StyleCardSettings;
    textCard: TextCardSetting;
    cards: (StyleCardSettings | TextCardSetting)[];
}
export {};
