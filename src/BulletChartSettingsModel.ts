import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { Group, SimpleSlice } from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";
import { BulletChartOrientation } from "./BulletChartOrientation";
import { BarRectType } from "./dataInterfaces";

import Model = formattingSettings.Model;
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import IEnumMember = powerbi.IEnumMember;
import FormattingId = powerbi.visuals.FormattingId;
import ValidatorType = powerbi.visuals.ValidatorType;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;


const nameof = <T>(name: Extract<keyof T, string>): string => name;

export const BulletChartObjectNames = {
    Labels: { name: "labels", displayName: "Category labels" },
    Axis: { name: "axis", displayName: "Axis" },
    Orientation: { name: "orientation", displayName: "Orientation" },
    Colors: { name: "colors", displayName: "Colors" },
    // used for subselection
    Minimum: { name: BarRectType.Minimum, displayName: "Minimum" },
    NeedsImprovement: { name: BarRectType.NeedsImprovement, displayName: "Needs Improvement" },
    Satisfactory: { name: BarRectType.Satisfactory, displayName: "Satisfactory" },
    Good: { name: BarRectType.Good, displayName: "Good" },
    VeryGood: { name: BarRectType.VeryGood, displayName: "Very good" },
    Bullet: { name: BarRectType.Bullet, displayName: "Bullet" },
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
    axisColor: FormattingId,
    syncAxis: FormattingId,
    showOnlyMainAxis: FormattingId,
    orientation: FormattingId,
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
        objectName: BulletChartObjectNames.Axis.name,
        propertyName: nameof<AxisCard>("syncAxis")
    },
    showOnlyMainAxis: {
        objectName: BulletChartObjectNames.Axis.name,
        propertyName: nameof<AxisCard>("showOnlyMainAxis")
    },
    orientation: {
        objectName: BulletChartObjectNames.Orientation.name,
        propertyName: nameof<OrientationCard>("orientation")
    },
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

const orientationOptions: IEnumMember[] = [
    { value: BulletChartOrientation.HorizontalLeft, displayName: "Visual_Orientation_HorizontalLeft" },
    { value: BulletChartOrientation.HorizontalRight, displayName: "Visual_Orientation_HorizontalRight" },
    { value: BulletChartOrientation.VerticalTop, displayName: "Visual_Orientation_VerticalTop" },
    { value: BulletChartOrientation.VerticalBottom, displayName: "Visual_Orientation_VerticalBottom" },
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

    maxWidth = new formattingSettings.NumUpDown({
        name: "maxWidth",
        displayName: "Maximum width",
        displayNameKey: "Visual_MaxWidth",
        value: 80,
    });

    name: string = BulletChartObjectNames.Labels.name;
    displayName: string = BulletChartObjectNames.Labels.displayName
    displayNameKey: string = "Visual_CategoryLabels";
    slices = [this.font, this.labelColor, this.maxWidth];
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
    displayNameKey: string = "Visual_Orientation";
    slices = [this.orientation];
}

class ColorsCard extends Card {
    minColor = new formattingSettings.ColorPicker({
        name: "minColor",
        displayName: "Minimum color",
        displayNameKey: "Visual_Colors_MinimumColor",
        value: { value: "#8b0000" }
    });

    needsImprovementColor = new formattingSettings.ColorPicker({
        name: "needsImprovementColor",
        displayName: "Needs Improvement color",
        displayNameKey: "Visual_Colors_NeedsImprovementColor",
        value: { value: "#FF0000" }
    });

    satisfactoryColor = new formattingSettings.ColorPicker({
        name: "satisfactoryColor",
        displayName: "Satisfactory color",
        displayNameKey: "Visual_Colors_SatisfactoryColor",
        value: { value: "#FFFF00" }
    });

    goodColor = new formattingSettings.ColorPicker({
        name: "goodColor",
        displayName: "Good color",
        displayNameKey: "Visual_Colors_GoodColor",
        value: { value: "#008000" }
    });

    veryGoodColor = new formattingSettings.ColorPicker({
        name: "veryGoodColor",
        displayName: "Very Good color",
        displayNameKey: "Visual_Colors_VeryGoodColor",
        value: { value: "#006400" }
    });

    bulletColor = new formattingSettings.ColorPicker({
        name: "bulletColor",
        displayName: "Bullet color",
        displayNameKey: "Visual_Colors_BulletColor",
        value: { value: "#000000" }
    });

    name: string = BulletChartObjectNames.Colors.name;
    displayName: string = BulletChartObjectNames.Colors.displayName;
    displayNameKey: string = "Visual_Colors";
    slices = [
        this.minColor,
        this.needsImprovementColor,
        this.satisfactoryColor,
        this.goodColor,
        this.veryGoodColor,
        this.bulletColor,
    ];
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

    syncAxis = new formattingSettings.ToggleSwitch({
        name: "syncAxis",
        displayName: "Sync Axis",
        displayNameKey: "Visual_SyncAxis",
        value: false,
    });

    showOnlyMainAxis = new formattingSettings.ToggleSwitch({
        name: "showOnlyMainAxis",
        displayName: "Show only main axis",
        displayNameKey: "Visual_ShowOnlyMainAxis",
        value: false,
    });

    axisGeneralGroup = new Group({
        name: "axisGeneralGroup",
        displayName: "General",
        displayNameKey: "Visual_General",
        slices: [this.axisColor, this.axisFont, this.syncAxis, this.showOnlyMainAxis],
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

    measureUnitsGroup = new Group({
        name: "measureUnitsGroup",
        displayName: "Measure units",
        displayNameKey: "Visual_MeasureUnits",
        slices: [this.measureUnits, this.unitsColor, this.unitsFont],
    });

    topLevelSlice = this.axis;
    name: string = BulletChartObjectNames.Axis.name;
    displayName: string = BulletChartObjectNames.Axis.displayName;
    displayNameKey: string =  "Visual_Axis";
    groups = [this.axisGeneralGroup, this.measureUnitsGroup];
}

export class BulletChartSettingsModel extends Model {
    values = new DataValuesCard();
    tooltips = new TooltipsCard();
    labels = new LabelsCard();
    orientation = new OrientationCard();
    colors = new ColorsCard();
    axis = new AxisCard();

    cards = [
        this.values,
        this.tooltips,
        this.labels,
        this.orientation,
        this.colors,
        this.axis,
    ];

    public setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(orientationOptions, localizationManager);
    }

    private setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach((option: IEnumMember) => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString());
        });
    }
}
