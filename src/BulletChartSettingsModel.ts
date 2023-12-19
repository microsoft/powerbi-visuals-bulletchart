import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Model = formattingSettings.Model;
import Card = formattingSettings.SimpleCard;
import {SimpleSlice} from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";
import IEnumMember = powerbi.IEnumMember;
import {BulletChartOrientation} from "./BulletChartOrientation";

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

class DataValuesCard extends Card {
    targetValue = new formattingSettings.NumUpDown({
        name: "targetValue",
        displayName: "Target Value",
        displayNameKey: "Visual_DataValues_TargetValue",
        value: undefined,
    });

    targetValue2 = new formattingSettings.NumUpDown({
        name: "targetValue2",
        displayName: "Target Value 2",
        displayNameKey: "Visual_DataValues_TargetValue2",
        value: undefined,
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
        value: undefined,
    });

    satisfactoryPercent = new formattingSettings.NumUpDown({
        name: "satisfactoryPercent",
        displayName: "Satisfactory %",
        displayNameKey: "Visual_DataValues_SatisfactoryPercent",
        value: undefined,
    });

    goodPercent = new formattingSettings.NumUpDown({
        name: "goodPercent",
        displayName: "Good %",
        displayNameKey: "Visual_DataValues_GoodPercent",
        value: undefined,
    });

    veryGoodPercent = new formattingSettings.NumUpDown({
        name: "veryGoodPercent",
        displayName: "Very Good %",
        displayNameKey: "Visual_DataValues_VeryGoodPercent",
        value: undefined,
    });

    maximumPercent = new formattingSettings.NumUpDown({
        name: "maximumPercent",
        displayName: "Maximum %",
        displayNameKey: "Visual_DataValues_MaximumPercent",
        value: undefined,
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

class LabelsCard extends Card {
    topLevelSlice: SimpleSlice<boolean> = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        description: "Select color for data labels",
        descriptionKey: "Visual_Description_Color",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        displayNameKey: "Visual_TextSize",
        value: TextSizeDefaults.DefaultSize,
        options: {
            minValue: { value: TextSizeDefaults.MinSize, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: TextSizeDefaults.MaxSize, type: powerbi.visuals.ValidatorType.Max },
        }
    });

    maxWidth = new formattingSettings.NumUpDown({
        name: "maxWidth",
        displayName: "Maximum width",
        displayNameKey: "Visual_MaxWidth",
        value: 80,
    });

    name: string = "labels";
    displayName: string = "Category labels";
    displayNameKey: string = "Visual_CategoryLabels";
    slices = [this.labelColor, this.fontSize, this.maxWidth];
}

class OrientationCard extends Card {
    orientation = new formattingSettings.ItemDropdown({
        name: "orientation",
        displayName: "Orientation",
        displayNameKey: "Visual_Orientation",
        items: orientationOptions,
        value: orientationOptions[0],
    });

    name: string = "orientation";
    displayName: string = "Orientation";
    displayNameKey: string = "Visual_Orientation";
    slices = [this.orientation];
}

class ColorsCard extends Card {
    minColor = new formattingSettings.ColorPicker({
        name: "minColor",
        displayName: "Minimum color",
        displayNameKey: "Visual_Color_MinimumColor",
        value: { value: "#8b0000" }
    });

    needsImprovementColor = new formattingSettings.ColorPicker({
        name: "needsImprovementColor",
        displayName: "Needs Improvement color",
        displayNameKey: "Visual_Color_NeedsImprovementColor",
        value: { value: "#FF0000" }
    });

    satisfactoryColor = new formattingSettings.ColorPicker({
        name: "satisfactoryColor",
        displayName: "Satisfactory color",
        displayNameKey: "Visual_Color_SatisfactoryColor",
        value: { value: "#FFFF00" }
    });

    goodColor = new formattingSettings.ColorPicker({
        name: "goodColor",
        displayName: "Good color",
        displayNameKey: "Visual_Color_GoodColor",
        value: { value: "#008000" }
    });

    veryGoodColor = new formattingSettings.ColorPicker({
        name: "veryGoodColor",
        displayName: "Very Good color",
        displayNameKey: "Visual_Color_VeryGoodColor",
        value: { value: "#006400" }
    });

    bulletColor = new formattingSettings.ColorPicker({
        name: "bulletColor",
        displayName: "Bullet color",
        displayNameKey: "Visual_Color_BulletColor",
        value: { value: "#000000" }
    });

    name: string = "colors";
    displayName: string = "Colors";
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

class AxisCard extends Card {
    axis = new formattingSettings.ToggleSwitch({
        name: "axis",
        displayName: "Axis",
        displayNameKey: "Visual_Axis",
        value: true,
    });

    topLevelSlice = this.axis;

    axisColor = new formattingSettings.ColorPicker({
        name: "axisColor",
        displayName: "Axis color",
        displayNameKey: "Visual_AxisColor",
        value: { value: "#808080" },
    });

    measureUnits = new formattingSettings.TextInput({
        name: "measureUnits",
        displayName: "Measure units",
        displayNameKey: "Visual_MeasureUnits",
        value: "",
        placeholder: "",
    });

    unitsColor = new formattingSettings.ColorPicker({
        name: "unitsColor",
        displayName: "Units color",
        displayNameKey: "Visual_UnitsColor",
        value: { value: "#808080" },
    });


    name: string = "axis";
    displayName: string = "Axis";
    displayNameKey: string =  "Visual_Axis";
    slices = [this.axisColor, this.measureUnits, this.unitsColor];
}

export class BulletChartSettingsModel extends Model {
    dataValues = new DataValuesCard();
    tooltips = new TooltipsCard();
    labels = new LabelsCard();
    orientation = new OrientationCard();
    colors = new ColorsCard();
    axis = new AxisCard();

    cards = [
        this.dataValues,
        this.tooltips,
        this.labels,
        this.orientation,
        this.colors,
        this.axis,
    ]
}