import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private formattingSettings;
    private formattingSettingsService;
    private main_content;
    private header_middle_content;
    private header_content;
    private header_text;
    private header_text_icon;
    private middle_content;
    private middle_content_center;
    private middle_content_center_icon;
    private middle_content_center_text;
    private middle_content_center_trend;
    private middle_content_center_trend_icon;
    private middle_content_center_trend_text;
    private footer_content;
    private footer_content_left;
    private footer_content_left_icon;
    private footer_content_right;
    private footer_content_right_text_top;
    private footer_content_right_text_bottom;
    private tooltipServiceWrapper;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private getData;
    private toggleParagraphElement;
    private toggleTrendElement;
    private setTooltip;
    private getTooltipData;
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel(): powerbi.visuals.FormattingModel;
    private swapSVGIcon;
    private getSVGIcon;
}
