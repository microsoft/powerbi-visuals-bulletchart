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

import "regenerator-runtime/runtime.js";
import "./../style/bulletChart.less";

import {select, Selection} from 'd3-selection';
import lodashIsnumber from "lodash.isnumber";
import lodashMax from "lodash.max";
import powerbiVisualsApi from "powerbi-visuals-api";
import {scaleLinear, ScaleLinear} from "d3-scale";
import {group} from "d3-array"

// powerbi.extensibility.utils.type
import {pixelConverter as PixelConverter} from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.interactivity
import {
    interactivityBaseService as interactivityService,
    interactivityBaseService,
    interactivitySelectionService
} from "powerbi-visuals-utils-interactivityutils";

// powerbi.extensibility.utils.formatting
// import { textMeasurementService as tms, valueFormatter } from "powerbi-visuals-utils-formattingutils";
// import TextProperties = tms.TextProperties;
// import TextMeasurementService = tms.textMeasurementService;
import {textMeasurementService as TextMeasurementService} from "powerbi-visuals-utils-formattingutils";
import * as valueFormatter from "powerbi-visuals-utils-formattingutils/lib/src/valueFormatter";
import {TextProperties} from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

// powerbi.extensibility.utils.chart
import {axis as AxisHelper, axisInterfaces, axisScale} from "powerbi-visuals-utils-chartutils";

// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint
} from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import {ColorHelper} from "powerbi-visuals-utils-colorutils";

import {BulletChartColumns} from "./BulletChartColumns";
import {
    BarData,
    BarRect,
    BarValueRect,
    BulletChartModel,
    BulletChartTooltipItem,
    TargetValue
} from "./dataInterfaces";
import { BarRectType } from "./enums";
import {VisualLayout} from "./visualLayout";
import {BulletBehaviorOptions, BulletWebBehavior} from "./behavior";
import { BulletChartOrientation } from "./enums";
import {FormattingSettingsService} from "powerbi-visuals-utils-formattingmodel";
import { BulletChartObjectNames, BulletChartSettingsModel } from './BulletChartSettingsModel';

// OnObject
import {
    HtmlSubSelectableClass,
    HtmlSubSelectionHelper,
    SubSelectableDisplayNameAttribute,
    SubSelectableObjectNameAttribute,
    SubSelectableTypeAttribute,
} from "powerbi-visuals-utils-onobjectutils"

// d3
type BulletSelection<T1, T2 = T1> = Selection<any, T1, any, T2>;
import IViewport = powerbiVisualsApi.IViewport;
import DataView = powerbiVisualsApi.DataView;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;

import IVisual = powerbiVisualsApi.extensibility.IVisual;
import IColorPalette = powerbiVisualsApi.extensibility.IColorPalette;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import VisualTooltipDataItem = powerbiVisualsApi.extensibility.VisualTooltipDataItem;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import IVisualEventService = powerbiVisualsApi.extensibility.IVisualEventService;
// powerbi.visuals
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import ISelectionIdBuilder = powerbiVisualsApi.visuals.ISelectionIdBuilder;
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractivityService = interactivityService.IInteractivityService;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;
import BaseDataPoint = interactivityBaseService.BaseDataPoint;
import IAxisProperties = axisInterfaces.IAxisProperties;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import CustomVisualObject = powerbi.visuals.CustomVisualObject;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

import { labelsReference, axisReference, colorsReference } from "./BulletChartSettingsModel";
import { measureSvgTextWidth } from "powerbi-visuals-utils-formattingutils/lib/src/textMeasurementService";

interface ClassAndSelector {
    className: string;
    selectorName: string;
}

function CreateClassAndSelector(className: string) {
    return {
        className: className,
        selectorName: "." + className,
    };
}


export class BulletChart implements IVisual {
    private static ScrollBarSize: number = 22;
    private static XMarginHorizontalLeft: number = 20;
    private static XMarginHorizontalRight: number = 55;
    private static YMarginHorizontal: number = 17.5;
    private static XMarginVertical: number = 70;
    private static YMarginVertical: number = 10;
    private static MainAxisPadding: number = 15;
    private static BulletSize: number = 25;
    private static BarMargin: number = 10;
    private static LabelsPadding: number = 10;
    private static MaxLabelWidth: number = 80;
    private static MaxMeasureUnitWidth: number = BulletChart.MaxLabelWidth - 20;
    private static SubtitleMargin: number = 10;
    private static SecondTargetLineSize: number = 7;
    private static MarkerMarginHorizontal: number = BulletChart.BulletSize / 6;
    private static MarkerMarginHorizontalEnd: number = 5 * BulletChart.MarkerMarginHorizontal;
    private static MarkerMarginVertical: number = BulletChart.BulletSize / 4;
    private static FontFamily: string = "Segoe UI";

    private static CategoryLabelsSelector: ClassAndSelector = CreateClassAndSelector("categoryLabel");
    public static MeasureUnitsSelector: ClassAndSelector = CreateClassAndSelector("measureUnits");
    private static AxisSelector: ClassAndSelector = CreateClassAndSelector("axis");
    private static BulletContainerSelector: ClassAndSelector = CreateClassAndSelector("bulletContainer");

    private baselineDelta: number = 0;
    // Variables
    private clearCatcher: BulletSelection<any>;
    private bulletBody: BulletSelection<any>;
    private scrollContainer: BulletSelection<any>;
    private labelGraphicsContext: BulletSelection<any>;
    private bulletGraphicsContext: BulletSelection<any>;
    private data: BulletChartModel;
    private localizationManager: ILocalizationManager;
    private formattingSettingsService: FormattingSettingsService;
    private visualSettings: BulletChartSettingsModel;
    private subSelectionHelper: HtmlSubSelectionHelper;
    private formatMode: boolean = false;
    public visualOnObjectFormatting?: powerbi.extensibility.visual.VisualOnObjectFormatting;

    private behavior: BulletWebBehavior;
    private interactivityService: IInteractivityService<BaseDataPoint>;
    private hostService: IVisualHost;
    public layout: VisualLayout;
    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;
    private events: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private selectionManager: ISelectionManager;

    private get SpaceRequiredForBarVertically(): number {
        if (!this.visualSettings.axis.axis.value) {
            return 50;
        }

        return this.visualSettings.axis.showOnlyMainAxis.value ? 50 : 100;
    }

    private get reverse(): boolean {
        switch (this.settings && this.settings.orientation.orientation.value.value) {
            case BulletChartOrientation.HorizontalRight:
            case BulletChartOrientation.VerticalBottom:
                return true;
        }
        return false;
    }

    private get vertical(): boolean {
        switch (this.settings && this.settings.orientation.orientation.value.value) {
            case BulletChartOrientation.VerticalTop:
            case BulletChartOrientation.VerticalBottom:
                return true;
        }
        return false;
    }

    private static zeroValue: number = 0;

    private get viewportScroll(): IViewport {
        return <IViewport>{
            width: Math.max(BulletChart.zeroValue, this.layout.viewportIn.width - BulletChart.ScrollBarSize),
            height: Math.max(BulletChart.zeroValue, this.layout.viewportIn.height - BulletChart.ScrollBarSize)
        };
    }

    private static getTextProperties(text: string, fontSize: number): TextProperties {
        return <TextProperties>{
            fontFamily: BulletChart.FontFamily,
            fontSize: PixelConverter.fromPoint(fontSize),
            text: text,
        };
    }

    private static value1dot4: number = 1.4;
    private static value2: number = 2;
    private static value12: number = 12;
    private static value20: number = 20;
    private static value25: number = 25;
    private static value28: number = 28;
    private static value40: number = 40;
    private static value60: number = 60;
    private static emptyString: string = "";

    private addItems(
        anyRangeIsDefined: boolean,
        bulletModel: BulletChartModel,
        idx: number,
        maxStrokeWidthBars: number,
        highlight: any,
        toolTipItems: BulletChartTooltipItem[],
        selectionIdBuilder: () => powerbi.visuals.ISelectionIdBuilder,
        minimumScale: number, minFillColor: string, minColor: string,
        needsImprovementScale: number, needsImprovementFillColor: string, needsImprovementColor: string,
        satisfactoryScale: number, satisfactoryFillColor: string, satisfactoryColor: string,
        goodScale: number, goodFillColor: string, goodColor: string,
        veryGoodScale: number, veryGoodFillColor: string, veryGoodColor: string,
        maximumScale: number,
    ) {
        if (anyRangeIsDefined) {
            this.addItemToBarArray(
                bulletModel.barRects,
                idx,
                minimumScale,
                needsImprovementScale,
                minFillColor,
                minColor,
                maxStrokeWidthBars,
                toolTipItems,
                selectionIdBuilder(),
                highlight,
                BarRectType.Minimum,
            );

            this.addItemToBarArray(
                bulletModel.barRects,
                idx,
                needsImprovementScale,
                satisfactoryScale,
                needsImprovementFillColor,
                needsImprovementColor,
                maxStrokeWidthBars,
                toolTipItems,
                selectionIdBuilder(),
                highlight,
                BarRectType.NeedsImprovement,
            );

            this.addItemToBarArray(
                bulletModel.barRects,
                idx,
                satisfactoryScale,
                goodScale,
                satisfactoryFillColor,
                satisfactoryColor,
                maxStrokeWidthBars,
                toolTipItems,
                selectionIdBuilder(),
                highlight,
                BarRectType.Satisfactory,
            );

            this.addItemToBarArray(
                bulletModel.barRects,
                idx,
                goodScale,
                veryGoodScale,
                goodFillColor,
                goodColor,
                maxStrokeWidthBars,
                toolTipItems,
                selectionIdBuilder(),
                highlight,
                BarRectType.Good,
            );

            this.addItemToBarArray(
                bulletModel.barRects,
                idx,
                veryGoodScale,
                maximumScale,
                veryGoodFillColor,
                veryGoodColor,
                maxStrokeWidthBars,
                toolTipItems,
                selectionIdBuilder(),
                highlight,
                BarRectType.VeryGood,
            );
        }
    }

    private static getXAxisProperties(
        settings: BulletChartSettingsModel,
        bulletModel: BulletChartModel,
        scale: ScaleLinear<number, number>,
        categorical: BulletChartColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>,
        valueFormatString: string,
        verticalOrientation: boolean,
    ) {
        let xAxisProperties: IAxisProperties = null;
        if (!settings.axis.axis.value) {
            return xAxisProperties;
        }

        xAxisProperties = AxisHelper.createAxis({
            pixelSpan: bulletModel.viewportLength,
            dataDomain: scale.domain(),
            metaDataColumn: categorical.Value[0].source,
            formatString: valueFormatString,
            outerPadding: 0,
            isScalar: true,
            isVertical: verticalOrientation,
            isCategoryAxis: false,
            scaleType: axisScale.linear,
            forcedTickCount: BulletChart.GETFITTICKSCOUNT(
                bulletModel.viewportLength
            ),
            disableNiceOnlyForScale: true,
            useTickIntervalForDisplayUnits: true,
            axisDisplayUnits: <number>settings.axis.axisDisplayFormat.value.valueOf(),
            axisPrecision: settings.axis.axisPrecision.value,
        });

        return xAxisProperties;
    }

    // Convert a DataView into a view model
    // eslint-disable-next-line max-lines-per-function
    public CONVERTER(dataView: DataView, options: VisualUpdateOptions): BulletChartModel {
        const categorical: BulletChartColumns<
            DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns
        > = BulletChartColumns.GET_CATEGORICAL_COLUMNS(dataView);
        if (!categorical || !categorical.Value || !categorical.Value[0]) {
            return null;
        }

        const categoricalValues: BulletChartColumns<any[]> =
            BulletChartColumns.GET_CATEGORICAL_VALUES(dataView);

        this.updateOrientation(dataView);
        this.limitProperties();
        this.setHighContrastColors();

        const isVerticalOrientation: boolean =
            this.visualSettings.orientation.orientation.value.value === BulletChartOrientation.VerticalBottom ||
            this.visualSettings.orientation.orientation.value.value === BulletChartOrientation.VerticalTop;
        const isReversedOrientation: boolean =
            this.visualSettings.orientation.orientation.value.value === BulletChartOrientation.HorizontalRight ||
            this.visualSettings.orientation.orientation.value.value === BulletChartOrientation.VerticalBottom;

        const longestCategoryWidth = this.computeLongestCategoryWidth(categorical, categoricalValues);

        const bulletModel: BulletChartModel = BulletChart.BuildBulletModel(
            this.visualSettings,
            categorical,
            options.viewport.height,
            options.viewport.width,
            isVerticalOrientation,
            isReversedOrientation,
            longestCategoryWidth,
        );

        const valueFormatString: string = valueFormatter.getFormatStringByColumn(categorical.Value[0].source, true);
        const categoryFormatString: string = categorical.Category ? valueFormatter.getFormatStringByColumn(categorical.Category.source, true) : BulletChart.emptyString;
        const length: number = categoricalValues.Value.length;
        let categoryMinValue: number | undefined = undefined;
        let categoryMaxValue: number | undefined = undefined;

        if (this.visualSettings.axis.syncAxis.value) {
            const rangeValues = [...Array(length).keys()]
                .map(idx => {
                    const targetValue: number = categoricalValues.TargetValue ? categoricalValues.TargetValue[idx] : this.visualSettings.values.targetValue.value;
                    const min = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Minimum?.[idx], this.visualSettings.values.minimumPercent.value, targetValue);
                    const max = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Maximum?.[idx], this.visualSettings.values.maximumPercent.value, targetValue);
                    return { min, max };
                });

            categoryMinValue = Math.min(...rangeValues.map(x => x.min));
            categoryMaxValue = Math.max(...rangeValues.map(x => x.max));
        }

        for (let idx = 0; idx < length; idx++) {
            const toolTipItems: BulletChartTooltipItem[] = [];

            let category: string = BulletChart.emptyString;
            if (categorical.Category) {
                category = valueFormatter.format(categoricalValues.Category[idx], categoryFormatString);
                const textProperties = BulletChart.getTextProperties(category, this.visualSettings.labels.font.fontSize.value);
                category = TextMeasurementService.getTailoredTextOrDefault(
                    textProperties,
                    this.visualSettings.labels.autoWidth.value ? longestCategoryWidth : this.visualSettings.labels.maxWidth.value
                );
            }

            const categoryValue = categoricalValues.Value[idx] || BulletChart.zeroValue;

            toolTipItems.push({
                value: categoryValue,
                metadata: categorical.Value[0],
                customName: this.visualSettings.tooltips.valueCustomName.value
            });

            const targetValue: number = categoricalValues.TargetValue ? categoricalValues.TargetValue[idx] : this.visualSettings.values.targetValue.value;

            if (lodashIsnumber(targetValue)) {
                toolTipItems.push({
                    value: targetValue,
                    metadata: categorical.TargetValue && categorical.TargetValue[0],
                    customName: this.visualSettings.tooltips.targetCustomName.value,
                });
            }

            const targetValue2: number = categoricalValues.TargetValue2 ? categoricalValues.TargetValue2[idx] : this.visualSettings.values.targetValue2.value;

            if (lodashIsnumber(targetValue2)) {
                toolTipItems.push({
                    value: targetValue2,
                    metadata: categorical.TargetValue2 && categorical.TargetValue2[0],
                    customName: this.visualSettings.tooltips.target2CustomName.value,
                });
            }

            const highlight: any = categorical.Value[0].highlights && categorical.Value[0].highlights[idx] !== null;

            const barData: BarData = this.BuildBulletChartItem(
                idx,
                category,
                categoryValue,
                targetValue,
                targetValue2,
                highlight,
                valueFormatString,
                isVerticalOrientation,
                isReversedOrientation,
                this.visualSettings,
                toolTipItems,
                categorical,
                categoricalValues,
                categoryMinValue,
                categoryMaxValue,
                this.colorHelper,
                bulletModel,
                this.hostService,
            );

            bulletModel.bars.push(barData);
        }

        return bulletModel;
    }

    private computeLongestCategoryWidth(categorical: BulletChartColumns<powerbiVisualsApi.DataViewCategoryColumn & powerbiVisualsApi.DataViewValueColumn[] & powerbiVisualsApi.DataViewValueColumns>, categoricalValues: BulletChartColumns<any[]>) {
        if (!categorical?.Category) {
            return 0;
        }

        let longestCategory: string = "";
        for (let idx = 0; idx < categoricalValues.Category.length; idx++) {
            if (categoricalValues?.Category[idx]?.length > longestCategory.length) {
                longestCategory = categoricalValues.Category[idx];
            }
        }
        const textProperties = BulletChart.getTextProperties(longestCategory, this.visualSettings.labels.font.fontSize.value);
        // Add 1 pixel to the width to avoid text truncation
        const longestCategoryWidth = measureSvgTextWidth(textProperties, longestCategory) + 1;
        return longestCategoryWidth;
    }

    private static BuildBulletModel(
        visualSettings: BulletChartSettingsModel,
        categorical: BulletChartColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>,
        viewPortHeight: number,
        viewPortWidth: number,
        isVerticalOrientation: boolean,
        isReversedOrientation: boolean,
        longestCategoryWidth: number,
    ): BulletChartModel {

        const bulletModel: BulletChartModel = <BulletChartModel>{
            settings: visualSettings,
            bars: [],
            barRects: [],
            valueRects: [],
            targetValues: [],
            viewportLength: BulletChart.zeroValue,
            longestCategoryWidth: longestCategoryWidth,
        };

        const labelsPadding: number = isReversedOrientation ? BulletChart.LabelsPadding : BulletChart.zeroValue;
        const labelsWidth = visualSettings.labels.show.value
            ? (visualSettings.labels.autoWidth.value ? longestCategoryWidth + labelsPadding : visualSettings.labels.maxWidth.value)
            : 0;

        bulletModel.labelHeight = (visualSettings.labels.show.value || BulletChart.zeroValue) && parseFloat(PixelConverter.fromPoint(visualSettings.labels.font.fontSize.value));
        bulletModel.labelHeightTop = (visualSettings.labels.show.value || BulletChart.zeroValue) && parseFloat(PixelConverter.fromPoint(visualSettings.labels.font.fontSize.value)) / BulletChart.value1dot4;
        bulletModel.spaceRequiredForBarHorizontally = Math.max(visualSettings.axis.axis.value ? (visualSettings.axis.showOnlyMainAxis.value ? BulletChart.value40 : BulletChart.value60) : BulletChart.value28, bulletModel.labelHeight + BulletChart.value25);
        bulletModel.viewportLength = Math.max(0, (isVerticalOrientation
            ? (viewPortHeight - bulletModel.labelHeightTop - BulletChart.SubtitleMargin - BulletChart.value25 - BulletChart.YMarginVertical * BulletChart.value2)
            : (viewPortWidth - labelsWidth - BulletChart.XMarginHorizontalLeft - BulletChart.XMarginHorizontalRight)) - BulletChart.ScrollBarSize);
        bulletModel.hasHighlights = !!(categorical.Value[0].values.length > BulletChart.zeroValue && categorical.Value[0].highlights);

        return bulletModel;
    }

    private BuildBulletChartItem(
        idx: number,
        category: string,
        categoryValue: number,
        targetValue: number,
        targetValue2: number,
        highlight: any,
        valueFormatString: string,
        isVerticalOrientation: boolean,
        isReversedOrientation: boolean,
        visualSettings: BulletChartSettingsModel,
        toolTipItems: BulletChartTooltipItem[],
        categorical: BulletChartColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>,
        categoricalValues: BulletChartColumns<any[]>,
        categoryMinValue: number | undefined,
        categoryMaxValue: number | undefined,
        colorHelper: ColorHelper,
        bulletModel: BulletChartModel,
        visualHost: IVisualHost,
    ): BarData {

        let minimum: number;
        if (visualSettings.axis.syncAxis.value) {
            minimum = categoryMinValue;
        } else {
            minimum = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Minimum?.[idx], visualSettings.values.minimumPercent.value, targetValue);
        }
        const categoryNumbers = BulletChart.computeCategoryNumbers(categoricalValues, idx, visualSettings, targetValue, minimum, categoryMaxValue, categoryValue, targetValue2);
        minimum = categoryNumbers.minimum;
        const needsImprovement = categoryNumbers.needsImprovement;
        const satisfactory = categoryNumbers.satisfactory;
        const good = categoryNumbers.good;
        const veryGood = categoryNumbers.veryGood;
        const maximum = categoryNumbers.maximum;
        const anyRangeIsDefined = categoryNumbers.anyRangeIsDefined;

        const scale: ScaleLinear<number, number> = scaleLinear()
            .clamp(true)
            .domain([minimum, maximum])
            .range(isVerticalOrientation ? [bulletModel.viewportLength, 0] : [0, bulletModel.viewportLength]);

        const minimumScale: number = scale(minimum);
        const needsImprovementScale: number = scale(needsImprovement);
        const satisfactoryScale: number = scale(satisfactory);
        const goodScale: number = scale(good);
        const veryGoodScale: number = scale(veryGood);
        const maximumScale: number = scale(maximum);
        const valueScale: number = scale(categoryValue);
        const minColor: string = visualSettings.colors.minColor.value.value,
            needsImprovementColor: string = visualSettings.colors.needsImprovementColor.value.value,
            satisfactoryColor: string = visualSettings.colors.satisfactoryColor.value.value,
            goodColor: string = visualSettings.colors.goodColor.value.value,
            veryGoodColor: string = visualSettings.colors.veryGoodColor.value.value,
            minFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : minColor,
            needsImprovementFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : needsImprovementColor,
            satisfactoryFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : satisfactoryColor,
            goodFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : goodColor,
            veryGoodFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : veryGoodColor;

        const selectionIdBuilder = () => categorical.Category
            ? visualHost.createSelectionIdBuilder().withCategory(categorical.Category, idx)
            : visualHost.createSelectionIdBuilder();

        const maxStrokeWidthBars: number = 0.5, maxStrokeWidthValues: number = 1.5;

        this.addItems(
            anyRangeIsDefined,
            bulletModel,
            idx,
            maxStrokeWidthBars,
            highlight,
            toolTipItems,
            selectionIdBuilder,
            minimumScale, minFillColor, minColor,
            needsImprovementScale, needsImprovementFillColor, needsImprovementColor,
            satisfactoryScale, satisfactoryFillColor, satisfactoryColor,
            goodScale, goodFillColor, goodColor,
            veryGoodScale, veryGoodFillColor, veryGoodColor,
            maximumScale
        );

        const bulletFillColor = colorHelper.isHighContrast ? colorHelper.getThemeColor() : visualSettings.colors.bulletColor.value.value;

        this.addItemToBarArray(bulletModel.valueRects, idx, minimumScale, valueScale, bulletFillColor, visualSettings.colors.bulletColor.value.value,
            maxStrokeWidthValues, toolTipItems, selectionIdBuilder(), highlight, BarRectType.Bullet);

        const scaledTarget: number = scale(targetValue || BulletChart.zeroValue);

        if (lodashIsnumber(scaledTarget)) {
            bulletModel.targetValues.push({
                barIndex: idx,
                value: targetValue && scale(targetValue),
                fill: bulletFillColor,
                stroke: visualSettings.colors.bulletColor.value.value,
                strokeWidth: maxStrokeWidthValues,
                key: selectionIdBuilder().withMeasure(scaledTarget.toString()).createSelectionId().getKey(),
                value2: targetValue2 && scale(targetValue2),
            });
        }

        const xAxisProperties: IAxisProperties = BulletChart.getXAxisProperties(visualSettings, bulletModel, scale, categorical, valueFormatString, isVerticalOrientation);

        const barData: BarData = {
            scale: scale, barIndex: idx, categoryLabel: category,
            x: isVerticalOrientation ? (BulletChart.XMarginVertical + this.SpaceRequiredForBarVertically * idx) : (isReversedOrientation ? BulletChart.XMarginHorizontalRight : BulletChart.XMarginHorizontalLeft),
            y: isVerticalOrientation ? (BulletChart.YMarginVertical) : (BulletChart.YMarginHorizontal + bulletModel.spaceRequiredForBarHorizontally * idx),
            xAxisProperties: xAxisProperties,
            key: selectionIdBuilder().createSelectionId().getKey(),
        };

        return barData;
    }

    private static computeCategoryNumbers(categoricalValues: BulletChartColumns<any[]>, idx: number, visualSettings: BulletChartSettingsModel, targetValue: number, minimum: number, categoryMaxValue: number, categoryValue: number, targetValue2: number) {
        let needsImprovement: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.NeedsImprovement?.[idx], visualSettings.values.needsImprovementPercent.value, targetValue, minimum);
        let satisfactory: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Satisfactory?.[idx], visualSettings.values.satisfactoryPercent.value, targetValue, minimum);
        let good: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Good?.[idx], visualSettings.values.goodPercent.value, targetValue, minimum);
        let veryGood: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.VeryGood?.[idx], visualSettings.values.veryGoodPercent.value, targetValue, minimum);
        let maximum: number;
        if (visualSettings.axis.syncAxis.value) {
            maximum = categoryMaxValue;
        } else {
            maximum = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Maximum?.[idx], visualSettings.values.maximumPercent.value, targetValue, minimum);
        }

        const anyRangeIsDefined: boolean = [needsImprovement, satisfactory, good, veryGood].some(lodashIsnumber);

        minimum = lodashIsnumber(minimum) ? minimum : BulletChart.zeroValue;
        needsImprovement = lodashIsnumber(needsImprovement) ? Math.max(minimum, needsImprovement) : needsImprovement;
        satisfactory = lodashIsnumber(satisfactory) ? Math.max(satisfactory, needsImprovement) : satisfactory;
        good = lodashIsnumber(good) ? Math.max(good, satisfactory) : good;
        veryGood = lodashIsnumber(veryGood) ? Math.max(veryGood, good) : veryGood;
        const minMaxValue = lodashMax([minimum, needsImprovement, satisfactory, good, veryGood, categoryValue, targetValue, targetValue2].filter(lodashIsnumber));
        maximum = lodashIsnumber(maximum) ? Math.max(maximum, minMaxValue) : minMaxValue;
        veryGood = lodashIsnumber(veryGood) ? veryGood : maximum;
        good = lodashIsnumber(good) ? good : veryGood;
        satisfactory = lodashIsnumber(satisfactory) ? satisfactory : good;
        needsImprovement = lodashIsnumber(needsImprovement) ? needsImprovement : satisfactory;

        return {minimum, needsImprovement, satisfactory, good, veryGood, maximum, anyRangeIsDefined};
    }

    /**
     * Calculate the percentage of the value based on the target value.
     * @param value either passed value or calculated depending on the percentage of the target value
     * @param percent percent of the calculated value, should greater or equal to 0
     * @param targetValue the target value the percent is based on
     * @param minimum the range minimum, usually 0 but when it is less than 0, than the result is adjusted
     */
    public static CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(value: number, percent: number, targetValue: number, minimum?: number): number {
        if (value !== null && isFinite(value)) {
            return value;
        }

        let adjustedMinimum: number = BulletChart.zeroValue;

        if (minimum !== undefined && minimum < 0) {
            adjustedMinimum = minimum;
        }

        if (isFinite(targetValue) && targetValue !== null && isFinite(percent) && percent !== null && percent >= 0) {
            return (percent * (targetValue - adjustedMinimum) / 100) + adjustedMinimum;
        }

        return null;
    }

    // Implemented for old enums using space containing keys for example "Horizontal Left" which doesn't exist in current version
    private updateOrientation(dataView: DataView): void {
        let orientationValue: string = "";

        if (this.visualSettings?.orientation?.orientation.value?.value) {
            orientationValue = this.visualSettings.orientation.orientation.value.value.toString();
        }
        else if (dataView?.metadata?.objects?.orientation?.orientation) {
            orientationValue = dataView.metadata.objects?.orientation?.orientation as string;
        }

        const noSpaceOrientation: string = orientationValue.toString().replace(" ", "");

        if (Object.values(BulletChartOrientation).includes(noSpaceOrientation as BulletChartOrientation)) {
            this.visualSettings.orientation.orientation.value = this.visualSettings.orientation.orientation.items.find(option => option.value.toString() === noSpaceOrientation);
        } else {
            this.visualSettings.orientation.orientation.value = this.visualSettings.orientation.orientation.items.find(option => option.value.toString() === BulletChartOrientation.HorizontalLeft);
        }
    }

    private limitProperties(): void {
        if (this.visualSettings.values.minimumPercent.value > this.visualSettings.values.maximumPercent.value) {
            this.visualSettings.values.maximumPercent.value = this.visualSettings.values.minimumPercent.value;
        }

        if (this.visualSettings.labels.maxWidth.value <= 0) {
            this.visualSettings.labels.maxWidth.value = BulletChart.MaxLabelWidth;
        }
    }

    private get settings(): BulletChartSettingsModel {
        return this.data && this.data.settings;
    }

    private setHighContrastColors(): void {
        this.visualSettings.axis.axisColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.axis.axisColor.value.value);
        this.visualSettings.axis.unitsColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.axis.unitsColor.value.value);
        this.visualSettings.labels.labelColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.labels.labelColor.value.value);

        this.visualSettings.colors.bulletColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.colors.bulletColor.value.value);
        this.visualSettings.colors.goodColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.colors.goodColor.value.value);
        this.visualSettings.colors.minColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.colors.minColor.value.value);
        this.visualSettings.colors.needsImprovementColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.colors.needsImprovementColor.value.value);
        this.visualSettings.colors.satisfactoryColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.colors.satisfactoryColor.value.value);
        this.visualSettings.colors.veryGoodColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.colors.veryGoodColor.value.value);
    }

    public static GETFITTICKSCOUNT(viewportLength: number): number {
        if (viewportLength < 35) {
            return 1;
        } else if (viewportLength < 150) {
            return 3;
        } else if (viewportLength < 300) {
            return 5;
        }

        return 12;
    }

    private addItemToBarArray(
        collection: BarRect[],
        barIndex: number,
        start: number,
        end: number,
        fillColor: string,
        strokeColor: string,
        strokeWidth: number,
        tooltipInfo: BulletChartTooltipItem[],
        selectionIdBuilder: ISelectionIdBuilder,
        highlight: boolean,
        barRectType: BarRectType,
    ): void {

        if (!isNaN(start) && !isNaN(end))
            collection.push({
                barIndex,
                start,
                end,
                fillColor,
                strokeColor,
                strokeWidth,
                tooltipInfo: BulletChart.CREATETOOLTIPINFO(tooltipInfo),
                selected: false,
                identity: selectionIdBuilder.createSelectionId(),
                key: (<ISelectionId>(
                    selectionIdBuilder
                        .withMeasure(start + " " + end)
                        .createSelectionId()
                )).getKey(),
                highlight: highlight,
                type: barRectType,
            });
    }

    public static CREATETOOLTIPINFO(tooltipItems: BulletChartTooltipItem[]): VisualTooltipDataItem[] {
        const tooltipDataItems: VisualTooltipDataItem[] = [];

        tooltipItems.forEach((tooltipItem: BulletChartTooltipItem) => {
            if (tooltipItem && tooltipItem.metadata) {
                let displayName: string;
                const metadata: DataViewMetadataColumn = tooltipItem.metadata.source;
                const formatString: string = valueFormatter.getFormatStringByColumn(metadata);

                if (tooltipItem.customName) {
                    displayName = tooltipItem.customName;
                } else {
                    displayName = metadata.displayName;
                }

                tooltipDataItems.push({
                    displayName,
                    value: valueFormatter.format(tooltipItem.value, formatString)
                });
            }
        });

        return tooltipDataItems;
    }

    private static bulletChartClassed: string = "bulletChart";
    private static dragResizeDisabled: string = "drag-resize-disabled";
    private static bulletScrollRegion: string = "bullet-scroll-region";

    public handleContextMenu() {
        this.bulletBody.on("contextmenu", (event) => {
            const dataPoint: BarRect = <BarRect>select(event.target).datum();
            this.selectionManager.showContextMenu(
                dataPoint?.identity || {},
                {
                    x: event.clientX,
                    y: event.clientY,
                }
            );
            event.preventDefault();
        });
    }

    constructor(options: VisualConstructorOptions) {
        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            options.host.tooltipService,
            options.element);

        this.selectionManager = options.host.createSelectionManager();
        this.localizationManager = options.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: options.element,
            subSelectionService: options.host.subSelectionService,
        });

        this.visualOnObjectFormatting = {
            getSubSelectionStyles: (subSelections) => this.getSubSelectionStyles(subSelections),
            getSubSelectionShortcuts: (subSelections) => this.getSubSelectionShortcuts(subSelections),
            getSubSelectables: (filter) => this.getSubSelectables(filter),
        };

        this.layout = new VisualLayout(null, {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        });

        const body: BulletSelection<any> = select(options.element);
        this.hostService = options.host;
        this.colorPalette = this.hostService.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);
        this.events = options.host.eventService;

        this.bulletBody = body
            .append("div")
            .classed(BulletChart.bulletChartClassed, true)
            .attr(BulletChart.dragResizeDisabled, true);

        this.scrollContainer = this.bulletBody
            .append("svg")
            .classed(BulletChart.bulletScrollRegion, true)
            .attr("fill", "none");
        this.clearCatcher = appendClearCatcher(this.scrollContainer);

        this.labelGraphicsContext = this.scrollContainer.append("g");
        this.bulletGraphicsContext = this.scrollContainer.append("g");

        this.behavior = new BulletWebBehavior();

        this.interactivityService = createInteractivitySelectionService(options.host);
        this.handleContextMenu();
    }

    public static oneString: string = "1";

    public update(options: VisualUpdateOptions) {
        try {
            this.events.renderingStarted(options);
            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }
            const dataView: DataView = options.dataViews[0];
            this.layout.viewport = options.viewport;
            this.formatMode = options.formatMode ?? false;

            this.visualSettings = this.formattingSettingsService.populateFormattingSettingsModel(BulletChartSettingsModel, dataView);
            this.visualSettings.setLocalizedOptions(this.localizationManager);

            const data: BulletChartModel = this.CONVERTER(dataView, options);

            this.clearViewport();
            if (!data) {
                return;
            }

            this.data = data;

            this.baselineDelta = TextMeasurementHelper.estimateSvgTextBaselineDelta(BulletChart.getTextProperties(BulletChart.oneString, this.data.settings.labels.font.fontSize.value));

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.data.barRects);
            }

            this.bulletBody
                .style("height", PixelConverter.toString(this.layout.viewportIn.height))
                .style("width", PixelConverter.toString(this.layout.viewportIn.width));

            if (this.vertical) {
                this.scrollContainer
                    .attr("width", PixelConverter.toString(this.data.bars.length * this.SpaceRequiredForBarVertically + BulletChart.XMarginVertical))
                    .attr("height", PixelConverter.toString(this.viewportScroll.height));
            } else {
                this.scrollContainer
                    .attr("height", (
                        this.data.bars.length * (this.data.spaceRequiredForBarHorizontally || BulletChart.zeroValue)
                        + (this.data.settings.axis.axis.value ? 0 : BulletChart.YMarginHorizontal)
                        + (this.data.settings.axis.showOnlyMainAxis.value ? BulletChart.BarMargin * 2 + BulletChart.MainAxisPadding : 0)
                    ) + "px")
                    .attr("width", PixelConverter.toString(this.viewportScroll.width));
            }

            if (this.vertical) {
                this.setUpBulletsVertically(this.data, this.reverse);
            } else {
                this.setUpBulletsHorizontally(this.data, this.reverse);
            }

            this.behavior.renderSelection(this.interactivityService.hasSelection());

            this.subSelectionHelper.setFormatMode(options.formatMode);
            const shouldUpdateSubSelection = options.type & (powerbi.VisualUpdateType.Data
                | powerbi.VisualUpdateType.Resize
                | powerbi.VisualUpdateType.FormattingSubSelectionChange);
            if (this.formatMode && shouldUpdateSubSelection) {
                this.subSelectionHelper.updateOutlinesFromSubSelections(options.subSelections, true);
            }

            this.events.renderingFinished(options);
        } catch (e) {
            console.error(e);
            this.events.renderingFailed(options, e);
        }
    }

    private clearViewport() {
        this.labelGraphicsContext.selectAll("text").remove();
        this.bulletGraphicsContext.selectAll("rect").remove();
        this.bulletGraphicsContext.selectAll("text").remove();
        this.bulletGraphicsContext.selectAll(BulletChart.AxisSelector.className).remove();
        this.bulletGraphicsContext.selectAll("path").remove();
        this.bulletGraphicsContext.selectAll("line").remove();
        this.bulletGraphicsContext.selectAll("tick").remove();
        this.bulletGraphicsContext.selectAll("g").remove();
        this.scrollContainer
            .attr("width", PixelConverter.toString(0))
            .attr("height", PixelConverter.toString(0));
    }

    public onClearSelection(): void {
        if (this.interactivityService) {
            this.interactivityService.clearSelection();
        }
    }

    private calculateLabelWidth(barData: BarData, bar?: BarRect, reversed?: boolean) {
        return (reversed
                ? BulletChart.XMarginHorizontalRight
                : barData.x + (this.settings.labels.show.value ? (this.settings.labels.autoWidth.value ? this.data.longestCategoryWidth : this.settings.labels.maxWidth.value) : 0) + BulletChart.XMarginHorizontalLeft)
            + (bar ? bar.start : BulletChart.zeroValue);
    }

    private static value5: number = 5;

    private calculateLabelHeight(barData: BarData, bar?: BarRect, reversed?: boolean) {
        return BulletChart.YMarginVertical + (reversed ? BulletChart.value5 :
                barData.y + this.data.labelHeightTop + BulletChart.BarMargin + BulletChart.SubtitleMargin)
            + (bar ? bar.end : BulletChart.zeroValue);
    }

    private static value8: number = 8;
    private static value1: number = 1;
    private static value4: number = 4;
    private static value14: number = 14;
    private static bulletMiddlePosition: number = (1 / BulletChart.value8 + 1 / BulletChart.value4) * BulletChart.BulletSize;

    private drawAxisAndLabelsForHorizontalOrientation(model: BulletChartModel, reversed: boolean) {
        const bars: BarData[] = model.bars;
        const barSelection: BulletSelection<any> = this.labelGraphicsContext
            .selectAll("text")
            .data(bars, (d: BarData) => d.key);

        if (model.settings.axis.axis.value) {
            if (model.settings.axis.showOnlyMainAxis.value) {
                // main axis should be last/at the bottom
                const mainBar = bars[bars.length - 1];
                this.renderAxisHorizontally(mainBar, reversed, model.settings.axis.showOnlyMainAxis.value);
            } else {
                for (let idx: number = 0; idx < bars.length; idx++) {
                    this.renderAxisHorizontally(bars[idx], reversed, model.settings.axis.showOnlyMainAxis.value);
                }
            }
        }

        // Draw Labels
        if (model.settings.labels.show.value) {
            barSelection
                .join("text")
                .classed(BulletChart.CategoryLabelsSelector.className, true)
                .classed(HtmlSubSelectableClass, this.formatMode)
                .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Labels.name)
                .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Labels.displayName)
                .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
                .attr("x", (d: BarData) => {
                    if (reversed)
                        return (
                            BulletChart.XMarginHorizontalLeft +
                            BulletChart.XMarginHorizontalRight +
                            model.viewportLength
                        );
                    return d.x;
                })
                .attr(
                    "y",
                    (d: BarData) =>
                        d.y +
                        this.baselineDelta +
                        BulletChart.BulletSize / BulletChart.value2
                )
                .style("fill", model.settings.labels.labelColor.value.value)
                .style(
                    "font-size",
                    PixelConverter.fromPoint(model.settings.labels.font.fontSize.value)
                )
                .style("font-family", model.settings.labels.font.fontFamily.value)
                .style("font-weight", model.settings.labels.font.bold.value ? "bold" : "normal")
                .style("font-style", model.settings.labels.font.italic.value ? "italic" : "normal")
                .style("text-decoration", model.settings.labels.font.underline.value ? "underline" : "none")
                .text((d: BarData) => d.categoryLabel)
                .append("title")
                .text((d: BarData) => d.categoryLabel);
        }
    }

    // eslint-disable-next-line max-lines-per-function
    private setUpBulletsHorizontally(
        model: BulletChartModel,
        reversed: boolean,
    ): void {
        const bars: BarData[] = model.bars;
        const rects: BarRect[] = model.barRects;
        const valueRects: BarValueRect[] = model.valueRects;
        const targetValues: TargetValue[] = model.targetValues;
        const barSelection: BulletSelection<any> = this.labelGraphicsContext.selectAll("text").data(bars, (d: BarData) => d.key);

        const groupedBullets = group(rects, (d: BarRect) => d.barIndex);
        const groupedBulletsSelection = this.bulletGraphicsContext
            .selectAll(`g.${BulletChart.BulletContainerSelector.className}`)
            .data(groupedBullets)
            .join("g")
            .classed(BulletChart.BulletContainerSelector.className, true)
            .attr("focusable", true)
            .attr("tabindex", 0);

        const bullets = groupedBulletsSelection
            .selectAll("rect.range")
            .data(d => d[1])
            .join("rect")
            .classed("range", true)
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelWidth(bars[d.barIndex], d, reversed))))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y)))
            .attr("width", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.end - d.start)))
            .attr("height", BulletChart.BulletSize)
            .classed("range", true)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, (d: BarRect) => d.type)
            .attr(SubSelectableDisplayNameAttribute, (d: BarRect) => d.type)
            .style("fill", (d: BarRect) => d.fillColor)
            .style("stroke", (d: BarRect) => d.strokeColor)
            .style("stroke-width", (d: BarRect) => d.strokeWidth);

        // Draw value rects
        const valueSelection: BulletSelection<any> = this.bulletGraphicsContext
            .selectAll("rect.value")
            .data(valueRects, (d: BarValueRect) => d.key)
            .join("rect")
            .attr("x", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, this.calculateLabelWidth(bars[d.barIndex], d, reversed))))
            .attr("y", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y + BulletChart.bulletMiddlePosition)))
            .attr("width", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, d.end - d.start)))
            .attr("height", BulletChart.BulletSize * BulletChart.value1 / BulletChart.value4)
            .classed("value", true)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Bullet.name)
            .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Bullet.displayName)
            .style("fill", (d: BarValueRect) => d.fillColor)
            .style("stroke", (d: BarValueRect) => d.strokeColor)
            .style("stroke-width", (d: BarValueRect) => d.strokeWidth);

        // Draw markers
        this.drawFirstTargets(targetValues,
            (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reversed) + d.value,
            (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reversed) + d.value,
            (d: TargetValue) => bars[d.barIndex].y + BulletChart.MarkerMarginHorizontal,
            (d: TargetValue) => bars[d.barIndex].y + BulletChart.MarkerMarginHorizontalEnd);

        this.drawSecondTargets(
            targetValues,
            (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reversed) + d.value2,
            (d: TargetValue) => bars[d.barIndex].y + BulletChart.BulletSize / BulletChart.value2);

        this.drawAxisAndLabelsForHorizontalOrientation(model, reversed);
        const measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
            BulletChart.getTextProperties(model.settings.axis.measureUnits.value, model.settings.axis.unitsFont.fontSize.value),
            BulletChart.MaxMeasureUnitWidth);
        // Draw measure label
        if (model.settings.axis.measureUnits.value) {
            barSelection
                .join("text")
                .classed(BulletChart.MeasureUnitsSelector.className, true)
                .attr("x", ((d: BarData) => {
                    if (reversed)
                        return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength + BulletChart.SubtitleMargin;
                    return d.x - BulletChart.SubtitleMargin;
                }))
                .attr("y", ((d: BarData) => d.y + this.data.labelHeight / BulletChart.value2 + BulletChart.value12 + BulletChart.BulletSize / 2))
                .attr("fill", model.settings.axis.unitsColor.value.value)
                .attr("font-family", model.settings.axis.unitsFont.fontFamily.value)
                .attr("font-size", PixelConverter.fromPoint(model.settings.axis.unitsFont.fontSize.value))
                .attr("font-weight", model.settings.axis.unitsFont.bold.value ? "bold" : "normal")
                .attr("font-style", model.settings.axis.unitsFont.italic.value ? "italic" : "normal")
                .attr("text-decoration", model.settings.axis.unitsFont.underline.value ? "underline" : "none")
                .text(measureUnitsText);
        }

        if (this.interactivityService) {
            const targetCollection = this.data.barRects.concat(this.data.valueRects);
            const behaviorOptions: BulletBehaviorOptions = {
                rects: bullets,
                groupedRects: groupedBulletsSelection,
                valueRects: valueSelection,
                clearCatcher: this.clearCatcher,
                interactivityService: this.interactivityService,
                bulletChartSettings: this.data.settings,
                hasHighlights: this.data.hasHighlights,
                behavior: this.behavior,
                dataPoints: targetCollection
            };

            this.interactivityService.bind(behaviorOptions);
        }

        this.tooltipServiceWrapper.addTooltip(valueSelection, (data: TooltipEnabledDataPoint) => data.tooltipInfo);
        this.tooltipServiceWrapper.addTooltip(bullets, (data: TooltipEnabledDataPoint) => data.tooltipInfo);
    }

    private static value3: number = 3;
    private static value10: number = 10;

    private drawAxisAndLabelsForVerticalOrientation(model: BulletChartModel, reversed: boolean, labelsStartPosition: number) {
        const bars: BarData[] = model.bars;
        const barSelection: BulletSelection<any> = this.labelGraphicsContext
            .selectAll("text")
            .data(bars, (d: BarData) => d.key);

        if (model.settings.axis.axis.value) {
            const axisColor = model.settings.axis.axisColor.value.value;

            if (model.settings.axis.showOnlyMainAxis.value) {
                const mainBar = bars[0];
                this.renderAxisVertically(mainBar, reversed, axisColor, model.settings.axis.showOnlyMainAxis.value);
            } else {
                for (let idx = 0; idx < bars.length; idx++) {
                    const bar = bars[idx];
                    this.renderAxisVertically(bar, reversed, axisColor, model.settings.axis.showOnlyMainAxis.value);
                }
            }

            this.bulletGraphicsContext
                .selectAll("g.axis path")
                .style("stroke", axisColor);

            this.bulletGraphicsContext
                .selectAll(".tick line")
                .style("stroke", axisColor);

            this.bulletGraphicsContext
                .selectAll(".tick text")
                .style("fill", axisColor);

            this.bulletGraphicsContext
                .selectAll("g.axis > .tick text")
                .call(
                    AxisHelper.LabelLayoutStrategy.clip,
                    BulletChart.XMarginVertical - BulletChart.value10,
                    TextMeasurementService.svgEllipsis
                );
        }

        // Draw Labels
        if (model.settings.labels.show.value) {
            barSelection
                .join("text")
                .classed(BulletChart.CategoryLabelsSelector.className, true)
                .classed(HtmlSubSelectableClass, this.formatMode)
                .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Labels.name)
                .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Labels.displayName)
                .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
                .attr("x", (d: BarData) => d.x)
                .attr("y", () => {
                    return labelsStartPosition;
                })
                .style("fill", model.settings.labels.labelColor.value.value)
                .style(
                    "font-size",
                    PixelConverter.fromPoint(model.settings.labels.font.fontSize.value)
                )
                .style("font-family", model.settings.labels.font.fontFamily.value)
                .style("font-weight", model.settings.labels.font.bold.value ? "bold" : "normal")
                .style("font-style", model.settings.labels.font.italic.value ? "italic" : "normal")
                .style("text-decoration", model.settings.labels.font.underline.value ? "underline" : "none")
                .text((d: BarData) => d.categoryLabel)
                .append("title")
                .text((d: BarData) => d.categoryLabel);
        }
    }

    private renderAxisVertically(bar: BarData, reversed: boolean, axisColor: string, isMainAxis: boolean) {
        this.bulletGraphicsContext
            .append("g")
            .attr("transform", () => {
                const xLocation: number = bar.x - (isMainAxis ? BulletChart.MainAxisPadding : 0);
                const yLocation: number = this.calculateLabelHeight(
                    bar,
                    null,
                    reversed
                );
                return `translate(${xLocation},${yLocation})`;
            })
            .classed(BulletChart.AxisSelector.className, true)
            .classed(HtmlSubSelectableClass, this.formatMode && this.visualSettings.axis.axis.value)
            .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Axis.name)
            .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Axis.displayName)
            .call(bar.xAxisProperties.axis)
            .style(
                "font-size",
                PixelConverter.fromPoint(this.settings.axis.axisFont.fontSize.value)
            )
            .style("font-family", this.settings.axis.axisFont.fontFamily.value)
            .style("font-weight", this.settings.axis.axisFont.bold.value ? "bold" : "normal")
            .style("font-style", this.settings.axis.axisFont.italic.value ? "italic" : "normal")
            .style("text-decoration", this.settings.axis.axisFont.underline.value ? "underline" : "none")
            .selectAll("line")
            .style("stroke", axisColor);
    }

    private renderAxisHorizontally(bar: BarData, reversed: boolean, isMainAxis: boolean) {
        const axisColor = this.settings.axis.axisColor.value.value;
        const barGroup = this.bulletGraphicsContext;

        barGroup
            .append("g")
            .attr("transform", () => {
                const xLocation: number = this.calculateLabelWidth(
                    bar,
                    null,
                    reversed
                );
                const yLocation: number = bar.y + BulletChart.BulletSize + (isMainAxis ? BulletChart.MainAxisPadding : 0);

                return `translate(${xLocation},${yLocation})`;
            })
            .classed(BulletChart.AxisSelector.className, true)
            .classed(HtmlSubSelectableClass, this.formatMode && this.visualSettings.axis.axis.value)
            .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Axis.name)
            .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Axis.displayName)
            .call(bar.xAxisProperties.axis)
            .style(
                "font-size",
                PixelConverter.fromPoint(this.settings.axis.axisFont.fontSize.value)
            )
            .style("font-family", this.settings.axis.axisFont.fontFamily.value)
            .style("font-weight", this.settings.axis.axisFont.bold.value ? "bold" : "normal")
            .style("font-style", this.settings.axis.axisFont.italic.value ? "italic" : "normal")
            .style("text-decoration", this.settings.axis.axisFont.underline.value ? "underline" : "none")
            .selectAll("line")
            .style("stroke", axisColor);

        barGroup.selectAll("path.bullet").style("stroke", axisColor);

        barGroup.selectAll(".tick line").style("stroke", axisColor);

        barGroup.selectAll(".tick text").style("fill", axisColor);

        barGroup
            .selectAll(".tick text")
            .call(
                AxisHelper.LabelLayoutStrategy.clip,
                bar.xAxisProperties.xLabelMaxWidth,
                TextMeasurementService.svgEllipsis
            );
    }

    // eslint-disable-next-line max-lines-per-function
    private setUpBulletsVertically(
        model: BulletChartModel,
        reversed: boolean,
    ) {
        const bars: BarData[] = model.bars;
        const rects: BarRect[] = model.barRects;
        const valueRects: BarValueRect[] = model.valueRects;
        const targetValues: TargetValue[] = model.targetValues;
        const barSelection: BulletSelection<any> = this.labelGraphicsContext.selectAll("text").data(bars, (d: BarData) => d.key);

        const groupedBullets = group(rects, (d: BarRect) => d.barIndex);
        const groupedBulletsSelection = this.bulletGraphicsContext
            .selectAll(`g.${BulletChart.BulletContainerSelector.className}`)
            .data(groupedBullets)
            .join("g")
            .classed(BulletChart.BulletContainerSelector.className, true)
            .attr("focusable", true)
            .attr("tabindex", 0);

        const bullets = groupedBulletsSelection
            .selectAll("rect.range")
            .data(d => d[1])
            .join("rect")
            .classed("range", true)
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x)))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reversed))))
            .attr("height", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.start - d.end)))
            .attr("width", BulletChart.BulletSize)
            .classed("range", true)
            .style("fill", (d: BarRect) => d.fillColor)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, (d: BarRect) => d.type)
            .attr(SubSelectableDisplayNameAttribute, (d: BarRect) => d.type)
            .style("stroke", (d: BarRect) => d.strokeColor)
            .style("stroke-width", (d: BarRect) => d.strokeWidth);

        // Draw value rects
        const valueSelection: BulletSelection<any> = this.bulletGraphicsContext.selectAll("rect.value").data(valueRects, (d: BarValueRect) => d.key);

        const valueSelectionMerged = valueSelection
            .join("rect")
            .attr("x", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x + BulletChart.bulletMiddlePosition)))
            .attr("y", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reversed))))
            .attr("height", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, d.start - d.end)))
            .attr("width", BulletChart.BulletSize * BulletChart.value1 / BulletChart.value4)
            .classed("value", true)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Bullet.name)
            .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Bullet.displayName)
            .style("fill", (d: BarValueRect) => d.fillColor)
            .attr("stroke", (d: BarRect) => d.strokeColor)
            .attr("stroke-width", (d: BarRect) => d.strokeWidth);

        // Draw markers
        this.drawFirstTargets(
            targetValues,
            (d: TargetValue) => bars[d.barIndex].x + BulletChart.MarkerMarginVertical,
            (d: TargetValue) => bars[d.barIndex].x + (BulletChart.MarkerMarginVertical * BulletChart.value3),
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reversed) + d.value,
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reversed) + d.value);
        this.drawSecondTargets(targetValues,
            (d: TargetValue) => bars[d.barIndex].x + BulletChart.BulletSize / BulletChart.value2,
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reversed) + d.value2);
        const labelsStartPos: number =
            BulletChart.YMarginVertical +
            (reversed ? model.viewportLength + 15 : 0) +
            this.data.labelHeightTop;
        this.drawAxisAndLabelsForVerticalOrientation(model, reversed, labelsStartPos);
        const measureUnitsText: string = TextMeasurementService.getTailoredTextOrDefault(
            BulletChart.getTextProperties(model.settings.axis.measureUnits.value, model.settings.axis.unitsFont.fontSize.value),
            BulletChart.MaxMeasureUnitWidth);

        // Draw measure label
        if (model.settings.axis.measureUnits.value) {
            barSelection
                .join("text")
                .classed(BulletChart.MeasureUnitsSelector.className, true)
                .attr("x", ((d: BarData) => d.x + BulletChart.BulletSize))
                .attr("y", () => {
                    return labelsStartPos + BulletChart.SubtitleMargin + BulletChart.value12;
                })
                .attr("fill", model.settings.axis.unitsColor.value.value)
                .attr("font-family", model.settings.axis.unitsFont.fontFamily.value)
                .attr("font-size", PixelConverter.fromPoint(model.settings.axis.unitsFont.fontSize.value))
                .attr("font-weight", model.settings.axis.unitsFont.bold.value ? "bold" : "normal")
                .attr("font-style", model.settings.axis.unitsFont.italic.value ? "italic" : "normal")
                .attr("text-decoration", model.settings.axis.unitsFont.underline.value ? "underline" : "none")
                .text(measureUnitsText);
        }
        if (this.interactivityService) {
            const targetCollection: BarRect[] = this.data.barRects.concat(this.data.valueRects);
            const behaviorOptions: BulletBehaviorOptions = {
                rects: bullets,
                groupedRects: groupedBulletsSelection,
                valueRects: valueSelectionMerged,
                clearCatcher: this.clearCatcher,
                interactivityService: this.interactivityService,
                bulletChartSettings: this.data.settings,
                hasHighlights: this.data.hasHighlights,
                behavior: this.behavior,
                dataPoints: targetCollection
            };
            this.interactivityService.bind(behaviorOptions);
        }
        this.tooltipServiceWrapper.addTooltip(valueSelectionMerged, (data: TooltipEnabledDataPoint) => data.tooltipInfo);
        this.tooltipServiceWrapper.addTooltip(bullets, (data: TooltipEnabledDataPoint) => data.tooltipInfo);
    }

    private drawFirstTargets(
        targetValues: TargetValue[],
        x1: (d: TargetValue) => number,
        x2: (d: TargetValue) => number,
        y1: (d: TargetValue) => number,
        y2: (d: TargetValue) => number) {

        const selection = this.bulletGraphicsContext
            .selectAll("line.target")
            .data(targetValues.filter(x => lodashIsnumber(x.value)));

        const selectionMerged = selection
            .enter()
            .append("line")
            .merge(<BulletSelection<any>>selection);

        selectionMerged
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2)
            .style("stroke", ((d: TargetValue) => d.fill))
            .style("stroke-width", 2)
            .classed("target", true);

        selection
            .exit()
            .remove();
    }

    private drawSecondTargets(
        targetValues: TargetValue[],
        getX: (d: TargetValue) => number,
        getY: (d: TargetValue) => number): void {

        const selection = this.bulletGraphicsContext
            .selectAll("line.target2")
            .data(targetValues.filter(x => lodashIsnumber(x.value2)));
        const enterSelection = selection.enter();
        enterSelection
            .append("line")
            .merge((<BulletSelection<any>>selection))
            .attr(
                "x1",
                (d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize
            )
            .attr(
                "y1",
                (d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize
            )
            .attr(
                "x2",
                (d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize
            )
            .attr(
                "y2",
                (d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize
            )
            .style("stroke", (d: TargetValue) => d.fill)
            .style("stroke-width", 2)
            .classed("target2", true);
        enterSelection
            .append("line")
            .merge(<BulletSelection<any>>selection)
            .attr(
                "x1",
                (d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize
            )
            .attr(
                "y1",
                (d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize
            )
            .attr(
                "x2",
                (d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize
            )
            .attr(
                "y2",
                (d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize
            )
            .style("stroke", (d: TargetValue) => d.fill)
            .style("stroke-width", 2)
            .classed("target2", true);
        selection
            .exit()
            .remove();
    }

    // About to remove your visual, do clean up here
    public destroy() {
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        if (this.visualSettings.labels.autoWidth.value) {
            this.visualSettings.labels.maxWidth.visible = false;
        }

        return this.formattingSettingsService.buildFormattingModel(this.visualSettings);
    }

    private getSubSelectionStyles(subSelections: CustomVisualSubSelection[]) {
        const visualObjects = subSelections[0]?.customVisualObjects;
        if (!visualObjects) {
            return undefined;
        }

        let visualObject: CustomVisualObject;
        if (visualObjects.length > 0 && visualObjects[0] != null) {
            visualObject = visualObjects[0];
        } else {
            return undefined;
        }

        switch (visualObject.objectName) {
            case BulletChartObjectNames.Labels.name:
                return this.getLabelsStyles();
            case BulletChartObjectNames.Axis.name:
                return this.getAxisStyles();
                // colors
            case BulletChartObjectNames.Minimum.name:
                return this.getMinimumStyles();
            case BulletChartObjectNames.NeedsImprovement.name:
                return this.getNeedsImprovementStyles();
            case BulletChartObjectNames.Satisfactory.name:
                return this.getSatisfactoryStyles();
            case BulletChartObjectNames.Good.name:
                return this.getGoodStyles();
            case BulletChartObjectNames.VeryGood.name:
                return this.getVeryGoodStyles();
            case BulletChartObjectNames.Bullet.name:
                return this.getBulletStyles();
            default:
                return undefined;
        }
    }

    private getSubSelectionShortcuts(subSelections: powerbi.visuals.CustomVisualSubSelection[]) {
        const visualObjects = subSelections[0]?.customVisualObjects;
        if (!visualObjects) {
            return undefined;
        }

        let visualObject: CustomVisualObject;
        if (visualObjects.length > 0 && visualObjects[0] != null) {
            visualObject = visualObjects[0];
        } else {
            return undefined;
        }

        switch (visualObject.objectName) {
            case BulletChartObjectNames.Labels.name:
                return this.getLabelsShortcuts();
            case BulletChartObjectNames.Axis.name:
                return this.getAxisShortcuts();
            case BulletChartObjectNames.Minimum.name:
            case BulletChartObjectNames.NeedsImprovement.name:
            case BulletChartObjectNames.Satisfactory.name:
            case BulletChartObjectNames.Good.name:
            case BulletChartObjectNames.VeryGood.name:
            case BulletChartObjectNames.Bullet.name:
                return this.getColorsShortcuts();
            default:
                return undefined;
        }
    }

    private getSubSelectables(filter?: powerbi.visuals.SubSelectionStylesType): CustomVisualSubSelection[] | undefined {
        return this.subSelectionHelper.getAllSubSelectables(filter);
    }

    private getLabelsStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: { ...labelsReference.fontFamily },
                label: labelsReference.fontFamily.propertyName
            },
            bold: {
                reference: { ...labelsReference.bold },
                label: labelsReference.bold.propertyName
            },
            italic: {
                reference: { ...labelsReference.italic },
                label: labelsReference.italic.propertyName
            },
            underline: {
                reference: { ...labelsReference.underline },
                label: labelsReference.underline.propertyName
            },
            fontSize: {
                reference: { ...labelsReference.fontSize },
                label: labelsReference.fontSize.propertyName
            },
            fontColor: {
                reference: { ...labelsReference.labelColor },
                label: labelsReference.labelColor.propertyName
            }
        };
    }

    private getAxisStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...axisReference.axisColor,
                },
                label: this.localizationManager.getDisplayName("Visual_AxisColor"),
            },
        }
    }

    private getMinimumStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorsReference.minColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Colors_MinimumColor"),
            }
        }
    }

    private getNeedsImprovementStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorsReference.needsImprovementColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Colors_NeedsImprovementColor"),
            }
        }
    }

    private getSatisfactoryStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorsReference.satisfactoryColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Colors_SatisfactoryColor"),
            },
        }
    }

    private getGoodStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                  ...colorsReference.goodColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Colors_GoodColor")
            },
        }
    }

    private getVeryGoodStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorsReference.veryGoodColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Colors_VeryGoodColor"),
            },
        }
    }

    private getBulletStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorsReference.bulletColor,
                },
                label: this.localizationManager.getDisplayName("Visual_Colors_BulletColor"),
            },
        }
    }


    private getLabelsShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    labelsReference.bold,
                    labelsReference.fontFamily,
                    labelsReference.fontSize,
                    labelsReference.italic,
                    labelsReference.underline,
                    labelsReference.labelColor
                ]
            },
            {
                type: VisualShortcutType.Toggle,
                ...labelsReference.show,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_DeleteLabels"),
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_AddLabels"),
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: labelsReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatLabels")
            }
        ];
    }

    private getAxisShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [axisReference.axis, axisReference.axisColor, axisReference.syncAxis, axisReference.showOnlyMainAxis, axisReference.orientation],
            },
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.axis,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_HideAxis"),
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_ShowAxis"),
            },
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.syncAxis,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_DoNotSyncAxis"),
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_SyncAxis"),
            },
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.showOnlyMainAxis,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_ShowAllAxis"),
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_ShowOnlyMainAxis"),
            },
            {
                type: VisualShortcutType.Picker,
                ...axisReference.orientation,
                label: this.localizationManager.getDisplayName("Visual_Orientation"),
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: axisReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatAxis"),
            }
        ];
    }

    private getColorsShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    colorsReference.minColor,
                    colorsReference.needsImprovementColor,
                    colorsReference.satisfactoryColor,
                    colorsReference.goodColor,
                    colorsReference.veryGoodColor,
                    colorsReference.bulletColor
                ]
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: colorsReference.cardUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatColors")
            },
        ]
    }
}


interface CanvasElement extends HTMLElement {
    getContext(name: string);
}

class TextMeasurementHelper {
    static estimateSvgTextBaselineDelta(textProperties: TextProperties): number {
        const estimatedTextProperties: TextProperties = {
            fontFamily: textProperties.fontFamily,
            fontSize: textProperties.fontSize,
            text: "M",
        };

        const rect = TextMeasurementHelper.measureSvgTextRect(estimatedTextProperties);
        return rect.y + rect.height;
    }

    private static measureSvgTextRect(textProperties: TextProperties): SVGRect {
        select("body").append("span");

        // The style hides the svg element from the canvas, preventing canvas from scrolling down to show svg black square.
        const svgTextElement = select("body")
            .append("svg")
            .style("height", "0px")
            .style("width", "0px")
            .style("position", "absolute")
            .append("text");

        const canvasCtx = (<CanvasElement>document.createElement("canvas")).getContext("2d");
        if (canvasCtx == null) {
            console.error("canvas was not created");
        }

        svgTextElement.style(null);
        svgTextElement
            .text(textProperties.text)
            .attr("visibility", "hidden")
            .attr("font-family", textProperties.fontFamily)
            .attr("font-size", textProperties.fontSize)
            .attr("font-weight", textProperties.fontWeight)
            .attr("font-style", textProperties.fontStyle)
            .attr("white-space", textProperties.whiteSpace || "nowrap");

        // We're expecting the browser to give a synchronous measurement here
        // We're using SVGTextElement because it works across all browsers
        return svgTextElement.node().getBBox();
    }
}


