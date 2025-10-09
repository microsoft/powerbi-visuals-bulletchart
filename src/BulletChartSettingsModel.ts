import powerbi from "powerbi-visuals-api";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import { formattingSettings, formattingSettingsInterfaces } from "powerbi-visuals-utils-formattingmodel";
import { Group, SimpleSlice } from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";
import { BarRectType, BulletChartOrientation } from "./enums";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils"; 

import { nameof } from './utils';

import Model = formattingSettings.Model;
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import FormattingId = powerbi.visuals.FormattingId;
import ValidatorType = powerbi.visuals.ValidatorType;
import LegendPosition = legendInterfaces.LegendPosition;
import ISelectionId = powerbi.visuals.ISelectionId;
import ILocalizedItemMember = formattingSettingsInterfaces.ILocalizedItemMember;

export const BulletChartObjectNames = {
    Labels: { name: "labels", displayName: "Category labels", displayNameKey: "Visual_CategoryLabels" },
    Axis: { name: "axis", displayName: "Axis", displayNameKey: "Visual_Axis" },
    Orientation: { name: "orientation", displayName: "Orientation", displayNameKey: "Visual_Orientation" },
    Colors: { name: "colors", displayName: "Colors", displayNameKey:"Visual_Colors" },
    SyncAxis: { name: "syncAxis", displayName: "Sync Axis", displayNameKey: "Visual_SyncAxis" },
    // used for subselection
    Minimum: { name: BarRectType.Minimum, displayName: "Minimum", displayNameKey: "Visual_Minimum" },
    NeedsImprovement: { name: BarRectType.NeedsImprovement, displayName: "Needs Improvement", displayNameKey: "Visual_NeedsImprovement" },
    Satisfactory: { name: BarRectType.Satisfactory, displayName: "Satisfactory", displayNameKey: "Visual_Satisfactory" },
    Good: { name: BarRectType.Good, displayName: "Good", displayNameKey: "Visual_Good" },
    VeryGood: { name: BarRectType.VeryGood, displayName: "Very good", displayNameKey: "Visual_VeryGood" },
    Bullet: { name: BarRectType.Bullet, displayName: "Bullet", displayNameKey: "Visual_Bullet" },
} as const;

export const labelsReference: {
    cardUid: string;
    groupUid: string;
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
    labelColor: FormattingId;
    show: FormattingId;
} = {
    cardUid: "Visual-labels-card",
    groupUid: "labels-group",
    fontFamily: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: "fontFamily"
    },
    bold: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: "fontBold"
    },
    italic: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: "fontItalic"
    },
    underline: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: "fontUnderline"
    },
    fontSize: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: "fontSize"
    },
    labelColor: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: nameof<LabelsCard>("labelColor")
    },
    show: {
        objectName: BulletChartObjectNames.Labels.name,
        propertyName: nameof<LabelsCard>("show")
    }
} as const;

export const axisReference: {
    cardUid: string;
    groupUid: string;
    axis: FormattingId;
    axisColor: FormattingId;
    syncAxis: FormattingId;
    showMainAxis: FormattingId;
    orientation: FormattingId;
} = {
    cardUid: "Visual-axis-card",
    groupUid: "axis-group",
    axis: {
        objectName: BulletChartObjectNames.Axis.name,
        propertyName: nameof<AxisCard>("axis")
    },
    axisColor: {
        objectName: BulletChartObjectNames.Axis.name,
        propertyName: nameof<AxisCard>("axisColor")
    },
    syncAxis: {
        objectName: BulletChartObjectNames.SyncAxis.name,
        propertyName: nameof<SyncAxisCard>("syncAxis")
    },
    showMainAxis: {
        objectName: BulletChartObjectNames.SyncAxis.name,
        propertyName: nameof<SyncAxisCard>("showMainAxis")
    },
    orientation: {
        objectName: BulletChartObjectNames.Orientation.name,
        propertyName: nameof<OrientationCard>("orientation")
    }
} as const;


export const colorsReference: {
    cardUid: string;
    groupUid: string;
    minColor: FormattingId;
    needsImprovementColor: FormattingId;
    satisfactoryColor: FormattingId;
    goodColor: FormattingId;
    veryGoodColor: FormattingId;
    bulletColor: FormattingId;
} = {
    cardUid: "Visual-colors-card",
    groupUid: "colors-group",
    minColor: {
        objectName: BulletChartObjectNames.Colors.name,
        propertyName: nameof<ColorsCard>("minColor")
    },
    needsImprovementColor: {
        objectName: BulletChartObjectNames.Colors.name,
        propertyName: nameof<ColorsCard>("needsImprovementColor")
    },
    satisfactoryColor: {
        objectName: BulletChartObjectNames.Colors.name,
        propertyName: nameof<ColorsCard>("satisfactoryColor")
    },
    goodColor: {
        objectName: BulletChartObjectNames.Colors.name,
        propertyName: nameof<ColorsCard>("goodColor")
    },
    veryGoodColor: {
        objectName: BulletChartObjectNames.Colors.name,
        propertyName: nameof<ColorsCard>("veryGoodColor")
    },
    bulletColor: {
        objectName: BulletChartObjectNames.Colors.name,
        propertyName: nameof<ColorsCard>("bulletColor")
    },
} as const;


class TextSizeDefaults {
    public static readonly DefaultSize = 11;
    public static readonly MinSize = 7;
    public static readonly MaxSize = 24;
}

const orientationOptions: ILocalizedItemMember[] = [
    { value: BulletChartOrientation.HorizontalLeft, displayNameKey: "Visual_Orientation_HorizontalLeft" },
    { value: BulletChartOrientation.HorizontalRight, displayNameKey: "Visual_Orientation_HorizontalRight" },
    { value: BulletChartOrientation.VerticalTop, displayNameKey: "Visual_Orientation_VerticalTop" },
    { value: BulletChartOrientation.VerticalBottom, displayNameKey: "Visual_Orientation_VerticalBottom" },
];

const legendPositionOptions: ILocalizedItemMember[] = [
    { value: LegendPosition[LegendPosition.Top], displayNameKey: "Visual_Top" },
    { value: LegendPosition[LegendPosition.Bottom], displayNameKey: "Visual_Bottom" },
    { value: LegendPosition[LegendPosition.Right], displayNameKey: "Visual_Right" },
    { value: LegendPosition[LegendPosition.Left], displayNameKey: "Visual_Left" },
    { value: LegendPosition[LegendPosition.TopCenter], displayNameKey: "Visual_TopCenter" },
    { value: LegendPosition[LegendPosition.BottomCenter], displayNameKey: "Visual_BottomCenter" },
    { value: LegendPosition[LegendPosition.RightCenter], displayNameKey: "Visual_RightCenter" },
    { value: LegendPosition[LegendPosition.LeftCenter], displayNameKey: "Visual_LeftCenter" },
];

const gridlinesStyle: ILocalizedItemMember[] = [
    { value: "dotted", displayNameKey: "Visual_Dotted" },
    { value: "dashed", displayNameKey: "Visual_Dashed" },
    { value: 'solid', displayNameKey: "Visual_Solid" },
];


class BaseFontCardSettings extends Card {
    font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayName: "Text Size",
            displayNameKey: "Visual_TextSize",
            value: TextSizeDefaults.DefaultSize,
            options: {
                minValue: { value: TextSizeDefaults.MinSize, type: powerbi.visuals.ValidatorType.Min },
                maxValue: { value: TextSizeDefaults.MaxSize, type: powerbi.visuals.ValidatorType.Max },
            }
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "Arial, sans-serif",
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            value: false,
        }),
    });
}

class GeneralCard extends Card {
    showCompletionPercent = new formattingSettings.ToggleSwitch({
        name: "showCompletionPercent",
        displayNameKey: "Visual_ShowCompletionPercent",
        descriptionKey: "Visual_ShowCompletionPercent",
        value: false,
    });

    barSize = new formattingSettings.NumUpDown({
        name: "barSize",
        displayName: "Bar size",
        displayNameKey: "Visual_BarSize",
        value: 25,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
        }
    });

    customBarSpacing = new formattingSettings.ToggleSwitch({
        name: "customBarSpacing",
        displayName: "Custom bar spacing",
        displayNameKey: "Visual_CustomBarSpacing",
        value: false,
    });

    barSpacing = new formattingSettings.NumUpDown({
        name: "barSpacing",
        displayName: "Bar spacing",
        displayNameKey: "Visual_BarSpacing",
        value: 35,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
        }
    });

    name = "general";
    displayName = "General";
    displayNameKey = "Visual_General";
    slices = [this.showCompletionPercent, this.barSize, this.customBarSpacing, this.barSpacing];
}

class DataValuesCard extends Card {
    targetValue = new formattingSettings.NumUpDown({
        name: "targetValue",
        displayName: "Target Value",
        displayNameKey: "Visual_DataValues_TargetValue",
        value: null,
    });

    targetValue2 = new formattingSettings.NumUpDown({
        name: "targetValue2",
        displayName: "Target Value 2",
        displayNameKey: "Visual_DataValues_TargetValue2",
        value: null,
    });

    minimumPercent = new formattingSettings.NumUpDown({
        name: "minimumPercent",
        displayName: "Minimum %",
        displayNameKey: "Visual_DataValues_MinimumPercent",
        value: 0,
    });

    needsImprovementPercent = new formattingSettings.NumUpDown({
        name: "needsImprovementPercent",
        displayName: "Needs Improvement %",
        displayNameKey: "Visual_DataValues_NeedsImprovementPercent",
        value: null,
    });

    satisfactoryPercent = new formattingSettings.NumUpDown({
        name: "satisfactoryPercent",
        displayName: "Satisfactory %",
        displayNameKey: "Visual_DataValues_SatisfactoryPercent",
        value: null,
    });

    goodPercent = new formattingSettings.NumUpDown({
        name: "goodPercent",
        displayName: "Good %",
        displayNameKey: "Visual_DataValues_GoodPercent",
        value: null,
    });

    veryGoodPercent = new formattingSettings.NumUpDown({
        name: "veryGoodPercent",
        displayName: "Very Good %",
        displayNameKey: "Visual_DataValues_VeryGoodPercent",
        value: null,
    });

    maximumPercent = new formattingSettings.NumUpDown({
        name: "maximumPercent",
        displayName: "Maximum %",
        displayNameKey: "Visual_DataValues_MaximumPercent",
        value: null,
    });

    name: string = "values";
    displayName: string = "Data Values";
    displayNameKey: string = "Visual_DataValues";
    slices = [
        this.targetValue,
        this.targetValue2,
        this.minimumPercent,
        this.needsImprovementPercent,
        this.satisfactoryPercent,
        this.goodPercent,
        this.veryGoodPercent,
        this.maximumPercent,
    ];
}

class TooltipsCard extends Card {
    valueCustomName = new formattingSettings.TextInput({
        name: "valueCustomName",
        displayName: "Value Custom Name",
        displayNameKey: "Visual_ValueCustomName",
        value: "",
        placeholder: "",
    });

    targetCustomName = new formattingSettings.TextInput({
        name: "targetCustomName",
        displayName: "Target Value custom name",
        displayNameKey: "Visual_TargetValueCustomName",
        value: "",
        placeholder: "",
    });

    target2CustomName = new formattingSettings.TextInput({
        name: "target2CustomName",
        displayName: "Target Value 2 custom name",
        displayNameKey: "Visual_TargetValue2CustomName",
        value: "",
        placeholder: "",
    });


    name: string = "tooltips";
    displayName: string = "Tooltips";
    displayNameKey: string = "Visual_Tooltips";
    slices = [this.valueCustomName, this.targetCustomName, this.target2CustomName];
}

class LabelsCard extends BaseFontCardSettings {
    show: SimpleSlice<boolean> = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    topLevelSlice = this.show;

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        description: "Select color for data labels",
        descriptionKey: "Visual_Description_Color",
        value: { value: "#000000" }
    });

    autoWidth = new formattingSettings.ToggleSwitch({
        name: "autoWidth",
        displayName: "Auto width",
        displayNameKey: "Visual_AutoWidth",
        value: false,
    });

    maxWidth = new formattingSettings.NumUpDown({
        name: "maxWidth",
        displayName: "Maximum width",
        displayNameKey: "Visual_MaxWidth",
        value: 80,
    });

    name: string = BulletChartObjectNames.Labels.name;
    displayName: string = BulletChartObjectNames.Labels.displayName
    displayNameKey: string = "Visual_CategoryLabels";
    slices = [this.font, this.labelColor, this.autoWidth, this.maxWidth];
}

class OrientationCard extends Card {
    orientation = new formattingSettings.ItemDropdown({
        name: "orientation",
        displayName: "Orientation",
        displayNameKey: "Visual_Orientation",
        items: orientationOptions,
        value: orientationOptions[0],
    });

    name: string = BulletChartObjectNames.Orientation.name;
    displayName: string = BulletChartObjectNames.Orientation.displayName;
    displayNameKey: string = BulletChartObjectNames.Orientation.displayNameKey;
    slices = [this.orientation];
}

class CategoryFillColorGroup extends Card {
     fillCategory = new formattingSettings.ToggleSwitch({
        name: "categoryFillColor",
        displayName: "Category Fill Color",
        descriptionKey: "Visual_Description_CategoryFill",
        displayNameKey: "Visual_CategoryFillColor",
        value: false,
        visible: true,
    });

     useConditionalFormatting = new formattingSettings.ToggleSwitch({
        name: "useConditionalFormatting",
        displayName: "Use Conditional Formatting",
        displayNameKey: "Visual_UseConditionalFormatting",
        value: false,
        visible: true,
    });

    conditionalColor = new formattingSettings.ColorPicker({
        name: "conditionalColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: {value: "#01B8AA"},
        visible: false,
        instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule,
        selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
        altConstantSelector: null
    });

    name: string = 'categoryFillColor';
    displayName: string = "Category Fill Color";
    displayNameKey: string = "Visual_CategoryFillColor";
    topLevelSlice= this.fillCategory;

    slices = [
        this.useConditionalFormatting,
        this.conditionalColor
    ];
}

class ColorsCard extends CompositeCard {
    minColor = new formattingSettings.ColorPicker({
        name: "minColor",
        displayName: "Minimum",
        displayNameKey: "Visual_Colors_MinimumColor",
        value: { value: "#8b0000" }
    });

    needsImprovementColor = new formattingSettings.ColorPicker({
        name: "needsImprovementColor",
        displayName: "Needs Improvement",
        displayNameKey: "Visual_Colors_NeedsImprovementColor",
        value: { value: "#FF0000" }
    });

    satisfactoryColor = new formattingSettings.ColorPicker({
        name: "satisfactoryColor",
        displayName: "Satisfactory",
        displayNameKey: "Visual_Colors_SatisfactoryColor",
        value: { value: "#FFFF00" }
    });

    goodColor = new formattingSettings.ColorPicker({
        name: "goodColor",
        displayName: "Good",
        displayNameKey: "Visual_Colors_GoodColor",
        value: { value: "#008000" }
    });

    veryGoodColor = new formattingSettings.ColorPicker({
        name: "veryGoodColor",
        displayName: "Very Good",
        displayNameKey: "Visual_Colors_VeryGoodColor",
        value: { value: "#006400" }
    });

    bulletColor = new formattingSettings.ColorPicker({
        name: "bulletColor",
        displayName: "Bullet",
        displayNameKey: "Visual_Colors_BulletColor",
        value: { value: "#000000" }
    });
    

    thresholdsColorGroup = new Group({
        name: "thresholdsColor",
        displayName: "Thresholds Color",
        displayNameKey: "Visual_ThresholdsColor",
        slices: [
            this.minColor,
            this.needsImprovementColor,
            this.satisfactoryColor,
            this.goodColor,
            this.veryGoodColor,
            this.bulletColor,
        ]
    });

    categoryFillColorGroup= new CategoryFillColorGroup();

    name: string = BulletChartObjectNames.Colors.name;
    displayName: string = BulletChartObjectNames.Colors.displayName;
    displayNameKey: string = BulletChartObjectNames.Colors.displayNameKey;
    groups = [this.thresholdsColorGroup, this.categoryFillColorGroup];

    onPreProcess(): void {
        this.categoryFillColorGroup.conditionalColor.visible = this.categoryFillColorGroup.useConditionalFormatting.value;
    }
    
    public getData() {
        const colors = {
            minColor: { displayNameKey: this.minColor.displayNameKey, color: this.minColor.value.value },
            needsImprovementColor: { displayNameKey: this.needsImprovementColor.displayNameKey, color: this.needsImprovementColor.value.value },
            satisfactoryColor: { displayNameKey: this.satisfactoryColor.displayNameKey, color: this.satisfactoryColor.value.value },
            goodColor: { displayNameKey: this.goodColor.displayNameKey, color: this.goodColor.value.value },
            veryGoodColor: { displayNameKey: this.veryGoodColor.displayNameKey, color: this.veryGoodColor.value.value },
            bulletColor: { displayNameKey: this.bulletColor.displayNameKey, color: this.bulletColor.value.value },
        };

        return colors;
    }
}

class AxisCard extends CompositeCard {
    axis = new formattingSettings.ToggleSwitch({
        name: "axis",
        displayName: "Axis",
        displayNameKey: "Visual_Axis",
        value: true,
    });

    axisColor = new formattingSettings.ColorPicker({
        name: "axisColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#808080" },
    });

    axisFont = new formattingSettings.FontControl({
        name: "axisFont",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "axisFontSize",
            displayName: "Text size",
            displayNameKey: "Visual_Text_Size",
            value: 8,
            options: {
                minValue: { value: 0, type: ValidatorType.Min },
                maxValue: { value: TextSizeDefaults.MaxSize, type: ValidatorType.Max },
            }
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "axisFontFamily",
            value: "Arial, sans-serif"
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "axisFontBold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "axisFontItalic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "axisFontUnderline",
            value: false,
        }),
    });

    axisDisplayFormat = new formattingSettings.AutoDropdown({
        name: "axisDisplayFormat",
        displayName: "Display units",
        displayNameKey: "Visual_DisplayUnits",
        value: 1, // none
    });

    axisPrecision = new formattingSettings.NumUpDown({
        name: "axisPrecision",
        displayName: "Precision",
        displayNameKey: "Visual_Precision",
        value: 0,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 10, type: ValidatorType.Max },
        }
    });

    axisGeneralGroup = new Group({
        name: "axisGeneralGroup",
        displayName: "General",
        displayNameKey: "Visual_General",
        slices: [this.axisColor, this.axisFont, this.axisDisplayFormat, this.axisPrecision],
    });

    unitsFont = new formattingSettings.FontControl({
        name: "unitsFont",
        displayNameKey: "Visual_Font",
        fontSize: new formattingSettings.NumUpDown({
            name: "unitsFontSize",
            displayName: "Text size",
            displayNameKey: "Visual_Text_Size",
            value: 9,
            options: {
                minValue: { value: 0, type: ValidatorType.Min },
                maxValue: { value: TextSizeDefaults.MaxSize, type: ValidatorType.Max },
            }
        }),
        fontFamily: new formattingSettings.FontPicker({
            name: "unitsFontFamily",
            value: "Arial, sans-serif"
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "unitsFontBold",
            value: false,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "unitsFontItalic",
            value: false,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "unitsFontUnderline",
            value: false,
        }),
    });

    measureUnits = new formattingSettings.TextInput({
        name: "measureUnits",
        displayName: "Units of measurement",
        displayNameKey: "Visual_UnitsOfMeasurement",
        value: "",
        placeholder: "",
    });

    unitsColor = new formattingSettings.ColorPicker({
        name: "unitsColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#808080" },
    });

    axisMeasureUnitsGroup = new Group({
        name: "axisMeasureUnitsGroup",
        displayName: "Measure units",
        displayNameKey: "Visual_MeasureUnits",
        slices: [this.measureUnits, this.unitsColor, this.unitsFont],
    });

    topLevelSlice = this.axis;
    name: string = BulletChartObjectNames.Axis.name;
    displayName: string = BulletChartObjectNames.Axis.displayName;
    displayNameKey: string = BulletChartObjectNames.Axis.displayNameKey;
    groups = [this.axisGeneralGroup, this.axisMeasureUnitsGroup];
}

class LegendCard extends BaseFontCardSettings {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        displayNameKey: "Visual_Position",
        items: legendPositionOptions,
        value: legendPositionOptions[0],
    });

    showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Show title",
        displayNameKey: "Visual_ShowTitle",
        value: true,
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Title",
        displayNameKey: "Visual_Title",
        value: "",
        placeholder: "",
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: "#666666" },
    });

    topLevelSlice = this.show;
    name = "legend";
    displayName = "Legend";
    displayNameKey = "Visual_Legend";
    description = "Display legend options";
    descriptionKey = "Visual_Description_Legend";
    slices = [this.position, this.showTitle, this.titleText, this.labelColor, this.font];
}

class SyncAxisCard extends CompositeCard {
    syncAxis = new formattingSettings.ToggleSwitch({
        name: "syncAxis",
        displayName: "Sync axis",
        displayNameKey: "Visual_SyncAxis",
        value: false,
    });

    showMainAxis = new formattingSettings.ToggleSwitch({
        name: "showMainAxis",
        displayName: "Show only main axis",
        displayNameKey: "Visual_ShowOnlyMainAxis",
        visible: true,
        value: false,
    });


    gridlines = new formattingSettings.ToggleSwitch({
        name: "gridlines",
        displayName: "Gridlines",
        displayNameKey: "Visual_Gridlines",
        value: false,
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        description: "Select color for grid lines",
        descriptionKey: "Visual_Description_Color",
        value: { value: "#000000" }
    });

    transparency = new formattingSettings.Slider({
        name: "transparency",
        displayName: "transparency",
        displayNameKey: "Visual_Transparency",
        value: 1,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 100, type: ValidatorType.Max },
            unitSymbolAfterInput: true,
            unitSymbol: "%"
        }
    });

    lineStyle = new formattingSettings.ItemDropdown({
        name: "lineStyle",
        displayName: "Line Style",
        displayNameKey: "Visual_LineStyle",
        value: gridlinesStyle[0],
        items: gridlinesStyle
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayName: "Width",
        displayNameKey: "Visual_Width",
        value: 1,
        options: {
            minValue: { value: 0, type: ValidatorType.Min },
            maxValue: { value: 4, type: ValidatorType.Max },
            unitSymbol: "px"
        }
    });

    syncAxisGroup = new Group({
        name: "showMainAxisSetting",
        displayName: "Show only main axis",
        displayNameKey: "Visual_ShowOnlyMainAxis",
        topLevelSlice: this.showMainAxis,
        slices: [this.gridlines, this.color, this.transparency, this.lineStyle, this.width]
    });

    name: string = BulletChartObjectNames.SyncAxis.name;
    displayName: string = BulletChartObjectNames.SyncAxis.displayName;
    displayNameKey: string = BulletChartObjectNames.SyncAxis.displayNameKey;
    topLevelSlice = this.syncAxis;
    groups = [this.syncAxisGroup];
}

export class BulletChartSettingsModel extends Model {
    general = new GeneralCard();
    values = new DataValuesCard();
    tooltips = new TooltipsCard();
    labels = new LabelsCard();
    orientation = new OrientationCard();
    colors = new ColorsCard();
    axis = new AxisCard();
    syncAxis = new SyncAxisCard();
    legend = new LegendCard();

    cards = [
        this.general,
        this.values,
        this.tooltips,
        this.labels,
        this.orientation,
        this.colors,
        this.axis,
        this.syncAxis,
        this.legend,
    ];

    public populateCategoryColors(bars) {
        if (!bars || bars.length === 0) {
            return;
        }        
    
        if (!this.colors.categoryFillColorGroup.useConditionalFormatting.value) {
            this.colors.categoryFillColorGroup.slices = [this.colors.categoryFillColorGroup.useConditionalFormatting, this.colors.categoryFillColorGroup.conditionalColor];

            for (const bar of bars) {                
                const identity: ISelectionId = <ISelectionId>bar.identity;
                const selector = identity.getSelector();

                const colorPicker = new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: "Color",
                    displayNameKey: "Visual_Color",
                    value: { value: bar.fillColor },
                    visible: true,
                    selector,
                });

                this.colors.categoryFillColorGroup.slices.push(colorPicker);
            }
        }
    }
}
