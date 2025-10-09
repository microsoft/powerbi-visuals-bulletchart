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

import { select as d3Select, Selection as d3Selection } from 'd3-selection';
import lodashIsnumber from "lodash.isnumber";
import lodashMax from "lodash.max";
import powerbiVisualsApi from "powerbi-visuals-api";
import {scaleLinear as d3ScaleLinearFunction, ScaleLinear as d3ScaleLinear} from "d3-scale";
import {group as d3Group} from "d3-array"

// powerbi.extensibility.utils.type
import {pixelConverter as PixelConverter} from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.formatting
import {
    textMeasurementService as TextMeasurementService,
    valueFormatter,
    interfaces as formattingUtilsInterfaces
} from "powerbi-visuals-utils-formattingutils";
import TextProperties = formattingUtilsInterfaces.TextProperties;

// powerbi.extensibility.utils.chart
import {
    axis as AxisHelper,
    axisInterfaces,
    axisScale,
    legend as LegendModule,
    legendInterfaces,
    legendData,
} from "powerbi-visuals-utils-chartutils";

import createLegend = LegendModule.createLegend;
import positionChartArea = LegendModule.positionChartArea;
import ILegend = legendInterfaces.ILegend;
import LegendData = legendInterfaces.LegendData;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
import LegendPosition = legendInterfaces.LegendPosition;
import MarkerShape = legendInterfaces.MarkerShape;

// powerbi.extensibility.utils.tooltip
import {
    createTooltipServiceWrapper,
    ITooltipServiceWrapper,
} from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import {ColorHelper} from "powerbi-visuals-utils-colorutils";

import {BulletChartColumns, BulletChartValueColumns} from "./BulletChartColumns";
import {
    BarData,
    BarRect,
    BulletChartModel,
    BulletChartTooltipItem,
    RenderedColors,
    TargetValue
} from "./dataInterfaces";
import { BarRectType } from "./enums";
import {VisualLayout} from "./visualLayout";
import {BehaviorOptions, Behavior} from "./behavior";
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

import IViewport = powerbiVisualsApi.IViewport;
import DataView = powerbiVisualsApi.DataView;
import DataViewObject = powerbiVisualsApi.DataViewObject;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

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
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

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
    private static AxisHeight: number = 20;
    private static AxisWidth: number = 25;
    private static MainAxisSpacing: number = 15;
    private static BarPaddingVerticalShort: number = 10;
    private static BarPaddingVerticalDefault: number = 75;
    private static BarPaddingHorizontalShort: number = 5;
    private static BarPaddingHorizontalDefault: number = 35;
    private static BarMargin: number = 10;
    private static LabelsPadding: number = 10;
    private static MaxLabelWidth: number = 80;
    private static MaxMeasureUnitWidth: number = BulletChart.MaxLabelWidth - 20;
    private static SubtitleMargin: number = 10;
    private static SecondTargetLineSize: number = 7;
    private static FontFamily: string = "Segoe UI";
    private static ratioForLabelHeight: number = 1.4;
    private static measureUnitShift: number = 12;
    private static labelHeightReversedPadding: number = 5;
    private static xAxisVerticalShift: number = 10;
    private static verticalHeightOffset: number = 25;
    private static CategoryPropertyIdentifier = {
        conditionalColor: { objectName: "colors", propertyName: "conditionalColor" },
        fill: { objectName: "colors", propertyName: "fill" }
    };

    private static CategoryLabelsSelector: ClassAndSelector = CreateClassAndSelector("categoryLabel");
    public static MeasureUnitsSelector: ClassAndSelector = CreateClassAndSelector("measureUnits");
    private static AxisSelector: ClassAndSelector = CreateClassAndSelector("axis");
    private static BulletContainerSelector: ClassAndSelector = CreateClassAndSelector("bulletContainer");
    private static LegendItemSelector: ClassAndSelector = CreateClassAndSelector("legendItem");

    private baselineDelta: number = 0;
    // Variables
    private root: HTMLElement;
    private bulletBody: d3Selection<HTMLDivElement, null, HTMLElement, null>;
    private scrollContainer: d3Selection<SVGSVGElement, null, HTMLElement, null>;
    private legendContext: d3Selection<SVGSVGElement, null, HTMLElement, null>;
    private labelGraphicsContext: d3Selection<SVGGElement, null, HTMLElement, null>;
    private bulletGraphicsContext: d3Selection<SVGGElement, null, HTMLElement, null>;
    private data: BulletChartModel;
    private selectionManager: ISelectionManager;
    private localizationManager: ILocalizationManager;
    private formattingSettingsService: FormattingSettingsService;
    private visualSettings: BulletChartSettingsModel;
    private subSelectionHelper: HtmlSubSelectionHelper;
    private formatMode: boolean = false;
    public visualOnObjectFormatting?: powerbi.extensibility.visual.VisualOnObjectFormatting;

    private legend: ILegend;
    private behavior: Behavior;
    private hostService: IVisualHost;
    public layout: VisualLayout;
    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;
    private events: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;

    private get BarSize(): number {
        return this.visualSettings.general.barSize.value;
    }

    private get SpaceRequiredForBarVertically(): number {
        if (this.visualSettings.general.customBarSpacing.value) {
            return this.visualSettings.general.barSpacing.value;
        }

        if (!this.visualSettings.axis.axis.value) {
            return this.BarSize + BulletChart.BarPaddingVerticalShort;
        }

        return this.visualSettings.syncAxis.showMainAxis.value
            ? this.BarSize + BulletChart.BarPaddingVerticalShort
            : this.BarSize + BulletChart.BarPaddingVerticalDefault;
    }

    private get SpaceBetweenBarsHorizontally(): number {
        if (this.visualSettings.general.customBarSpacing.value) {
            return this.visualSettings.general.barSpacing.value;
        }

        if (!this.visualSettings.axis.axis.value) {
            return BulletChart.BarPaddingHorizontalShort;
        }

        return this.visualSettings.syncAxis.showMainAxis.value
            ? BulletChart.BarPaddingHorizontalShort
            : BulletChart.BarPaddingHorizontalDefault;
    }

    /**
     * First and second target should have the same size.
     * Target size is 4/6 of the bar size.
     * Target position is between 1/6 and 5/6 of the bar size.
     */
    private get FirstAndSecondTargetPositionStart(): number { return this.BarSize / 6; }
    private get FirstAndSecondTargetPositionEnd(): number { return this.FirstAndSecondTargetPositionStart * 5; }

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

    private addItems(
        anyRangeIsDefined: boolean,
        bulletModel: BulletChartModel,
        idx: number,
        maxStrokeWidthBars: number,
        highlight: boolean,
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
        scale: d3ScaleLinear<number, number>,
        categorical: BulletChartColumns,
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
            metaDataColumn: categorical.Value.source,
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
            axisDisplayUnits: Number(settings.axis.axisDisplayFormat.value),
            axisPrecision: settings.axis.axisPrecision.value,
        });

        return xAxisProperties;
    }

    private computeRenderedColors(
        categorical: BulletChartColumns,
        categoricalValues: BulletChartValueColumns,
    ): RenderedColors {
        if (!categorical?.Value || !categoricalValues) {
            return;
        }

        const length: number = categoricalValues.Value.length;
        const { categoryMinValue, categoryMaxValue }: { categoryMinValue: number | undefined; categoryMaxValue: number | undefined; } = this.calculateCategoryValueRange(length, categoricalValues);

        const renderedColors: RenderedColors = {};

        for (let idx = 0; idx < length; idx++) {
            const categoryValue: PrimitiveValue = categoricalValues.Value[idx] || 0;
            const targetValue: PrimitiveValue = categoricalValues.TargetValue ? categoricalValues.TargetValue[idx] : this.visualSettings.values.targetValue.value;
            const targetValue2: PrimitiveValue = categoricalValues.TargetValue2 ? categoricalValues.TargetValue2[idx] : this.visualSettings.values.targetValue2.value;

            let minimumValue: number;
            if (this.visualSettings.syncAxis.syncAxis.value) {
                minimumValue = categoryMinValue;
            } else {
                minimumValue = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Minimum?.[idx], this.visualSettings.values.minimumPercent.value, targetValue);
            }

            const {
                minimum,
                needsImprovement,
                satisfactory,
                good,
                veryGood,
                maximum,
                anyRangeIsDefined,
            } = BulletChart.computeCategoryNumbers(categoricalValues, idx, this.visualSettings, targetValue, minimumValue, categoryMaxValue, categoryValue, targetValue2);

            if (!anyRangeIsDefined) {
                return;
            }

            if (!isNaN(minimum) && !isNaN(needsImprovement) && minimum !== needsImprovement) {
                renderedColors.minColor = true;
            }

            if (!isNaN(needsImprovement) && !isNaN(satisfactory) && needsImprovement !== satisfactory) {
                renderedColors.needsImprovementColor = true;
            }

            if (!isNaN(satisfactory) && !isNaN(good) && satisfactory !== good) {
                renderedColors.satisfactoryColor = true;
            }

            if (!isNaN(good) && !isNaN(veryGood) && good !== veryGood) {
                renderedColors.goodColor = true;
            }

            if (!isNaN(veryGood) && !isNaN(maximum) && veryGood !== maximum) {
                renderedColors.veryGoodColor = true;
            }

            if (!isNaN(minimum) && typeof categoryValue === 'number' && !isNaN(categoryValue) && minimum !== categoryValue) {
                renderedColors.bulletColor = true;
            }

        }

        return renderedColors;
    }

    private static getCategoryFillColor(
        categoryIndex: number,
        colorHelper: ColorHelper,
        categoryDataPointObjects?: powerbi.DataViewObjects[],
        settings?: BulletChartSettingsModel
    ): string {

        if (settings.colors.categoryFillColorGroup.useConditionalFormatting.value) {
            const overriddenColor = dataViewObjects.getFillColor(
                categoryDataPointObjects?.[categoryIndex],
                BulletChart.CategoryPropertyIdentifier.conditionalColor
            );

            if (overriddenColor) {
                return overriddenColor;
            }

            const defaultColorOverride = settings.colors.categoryFillColorGroup.conditionalColor.value.value;
            if (defaultColorOverride) {
                return defaultColorOverride;
            }
        }
        const paletteColor = colorHelper.getColorForMeasure(
            categoryDataPointObjects?.[categoryIndex],
            categoryIndex
        );
        return paletteColor;
    }

    /**
     * Convert a DataView into a view model.
     */
    public CONVERTER({
        dataView,
        options,
        categorical,
        categoricalValues,
    }: {
        dataView: DataView;
        options: VisualUpdateOptions;
        categorical: BulletChartColumns;
        categoricalValues: BulletChartValueColumns;
    }): BulletChartModel {
        if (!categorical || !categorical.Value) {
            return null;
        }

        this.updateOrientation(dataView);
        this.limitProperties();
        this.setHighContrastColors();

        const orientation: BulletChartOrientation = <BulletChartOrientation>this.visualSettings.orientation.orientation.value.value;
        const isVerticalOrientation: boolean = orientation === BulletChartOrientation.VerticalBottom || orientation === BulletChartOrientation.VerticalTop;
        const isReversedOrientation: boolean = orientation === BulletChartOrientation.HorizontalRight || orientation === BulletChartOrientation.VerticalBottom;

        const valueFormatString: string = valueFormatter.getFormatStringByColumn(categorical.Value.source, true);
        const categoryFormatString: string = categorical.Category ? valueFormatter.getFormatStringByColumn(categorical.Category.source, true) : '';

        const bulletModel: BulletChartModel = this.BuildBulletModel(
            this.visualSettings,
            categorical,
            categoricalValues,
            options.viewport.height,
            options.viewport.width,
            isVerticalOrientation,
            isReversedOrientation,
        );

        const length: number = categoricalValues.Value.length;

        const { categoryMinValue, categoryMaxValue }: { categoryMinValue: number | undefined; categoryMaxValue: number | undefined; } = this.calculateCategoryValueRange(length, categoricalValues);

        for (let idx = 0; idx < length; idx++) {
            const toolTipItems: BulletChartTooltipItem[] = [];

            let category: string = '';
            if (categorical.Category) {
                category = valueFormatter.format(categoricalValues.Category[idx], categoryFormatString);

                let completionPercentTextWidth: number = 0;
                let completionPercentText: string = '';
                if (this.visualSettings.general.showCompletionPercent.value && !isVerticalOrientation) {
                    const value = categoricalValues.Value[idx];
                    const targetValue = categoricalValues?.TargetValue?.[idx] ?? this.visualSettings.values.targetValue.value;
                    completionPercentText = this.computeCompletionPercent(value, targetValue);
                    if (isReversedOrientation) {
                        completionPercentText = completionPercentText + ' - ';
                    } else {
                        completionPercentText = ' - ' + completionPercentText;
                    }
                    completionPercentTextWidth = BulletChart.measureSvgTextWidth({ text: completionPercentText, fontSize: this.visualSettings.labels.font.fontSize.value });
                }

                const textProperties = BulletChart.getTextProperties(category, this.visualSettings.labels.font.fontSize.value);

                let categoryLabelMaxWidth: number = this.visualSettings.labels.autoWidth.value
                    ? bulletModel.longestCategoryWidth
                    : this.visualSettings.labels.maxWidth.value - completionPercentTextWidth;

                if (isVerticalOrientation) {
                    categoryLabelMaxWidth = Math.min(Math.max(0, this.SpaceRequiredForBarVertically - BulletChart.AxisWidth), categoryLabelMaxWidth);
                }

                category = TextMeasurementService.getTailoredTextOrDefault(textProperties, categoryLabelMaxWidth);

                if (this.visualSettings.general.showCompletionPercent.value && !isVerticalOrientation) {
                    if (isReversedOrientation) {
                        category = completionPercentText + category;
                    } else {
                        category = category + completionPercentText;
                    }
                }
            }

            const categoryValue: PrimitiveValue = categoricalValues.Value[idx] || BulletChart.zeroValue;

            toolTipItems.push({
                value: categoryValue,
                metadata: categorical.Value,
                customName: this.visualSettings.tooltips.valueCustomName.value
            });

            const targetValue: PrimitiveValue = categoricalValues.TargetValue?.[idx] || this.visualSettings.values.targetValue.value;

            if (lodashIsnumber(targetValue)) {
                toolTipItems.push({
                    value: targetValue,
                    metadata: categorical.TargetValue,
                    customName: this.visualSettings.tooltips.targetCustomName.value,
                });
            }

            const targetValue2: PrimitiveValue = categoricalValues.TargetValue2?.[idx] || this.visualSettings.values.targetValue2.value;

            if (lodashIsnumber(targetValue2)) {
                toolTipItems.push({
                    value: targetValue2,
                    metadata: categorical.TargetValue2,
                    customName: this.visualSettings.tooltips.target2CustomName.value,
                });
            }

            const highlight: boolean = categorical.Value?.highlights?.[idx] !== null;
            const effectiveColor = BulletChart.getCategoryFillColor(idx, this.colorHelper, categorical.Category?.objects, this.visualSettings);
            const fillColor = this.colorHelper.getHighContrastColor("background", effectiveColor);
            const barData: BarData = this.BuildBulletChartItem(
                idx,
                fillColor,
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

    private calculateCategoryValueRange(length: number, categoricalValues: BulletChartValueColumns) {
        let categoryMinValue: number | undefined = undefined;
        let categoryMaxValue: number | undefined = undefined;
        if (this.visualSettings.syncAxis.syncAxis.value) {
            const rangeValues = [...Array(length).keys()]
                .map(idx => {
                    const targetValue: PrimitiveValue = categoricalValues.TargetValue?.[idx] || this.visualSettings.values.targetValue.value;
                    const min = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Minimum?.[idx], this.visualSettings.values.minimumPercent.value, targetValue);
                    const max = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Maximum?.[idx], this.visualSettings.values.maximumPercent.value, targetValue);
                    return { min, max };
                });

            categoryMinValue = Math.min(...rangeValues.map(x => x.min));
            categoryMaxValue = Math.max(...rangeValues.map(x => x.max));
        }
        return { categoryMinValue, categoryMaxValue };
    }

    private computeLongestCategoryWidth(
        categorical: BulletChartColumns,
        categoricalValues: BulletChartValueColumns,
        isVerticalOrientation: boolean,
        isReversedOrientation: boolean,
    ) {
        if (!categorical?.Category) {
            return 0;
        }

        let longestCategory: string = "";
        for (let index = 0; index < categoricalValues.Category.length; index++) {
            const category = this.formatCategoryWithCompletionPercent({ categoricalValues, index, isVerticalOrientation, isReversedOrientation });

            if (category.length > longestCategory.length) {
                longestCategory = category;
            }
        }

        const longestCategoryWidth = BulletChart.measureSvgTextWidth({ text: longestCategory, fontSize: this.visualSettings.labels.font.fontSize.value });
        return longestCategoryWidth;
    }

    private static measureSvgTextWidth({text, fontSize}: { text: string, fontSize: number }) {
        const textProperties = BulletChart.getTextProperties(text, fontSize);
        // Add 1 pixel to the width to avoid text truncation
        const width = measureSvgTextWidth(textProperties, text) + 1;
        return width;
    }

    private formatCategoryWithCompletionPercent({
        categoricalValues,
        index,
        isVerticalOrientation,
        isReversedOrientation
    }: {
        categoricalValues: BulletChartValueColumns;
        index: number;
        isVerticalOrientation: boolean;
        isReversedOrientation: boolean;
    }) {
        const category = categoricalValues.Category[index].toString();

        if (!this.visualSettings.general.showCompletionPercent.value
            || !categoricalValues.Value?.[index]
            || (!categoricalValues.TargetValue?.[index] && !this.visualSettings.values.targetValue.value)
            || isVerticalOrientation
        ) {
            return category;
        }

        const categoryValue: PrimitiveValue = categoricalValues.Value[index];
        const targetValue: PrimitiveValue = categoricalValues?.TargetValue?.[index] || this.visualSettings.values.targetValue.value;

        if (isReversedOrientation) {
            return this.computeCompletionPercent(categoryValue, targetValue) + " - " + category;
        } else {
            return category + " - " + this.computeCompletionPercent(categoryValue, targetValue);
        }
    }

    private BuildBulletModel(
        visualSettings: BulletChartSettingsModel,
        categorical: BulletChartColumns,
        categoricalValues: BulletChartValueColumns,
        viewPortHeight: number,
        viewPortWidth: number,
        isVerticalOrientation: boolean,
        isReversedOrientation: boolean,
    ): BulletChartModel {

        const longestCategoryWidth = this.computeLongestCategoryWidth(categorical, categoricalValues, isVerticalOrientation, isReversedOrientation);
        const bulletModel: BulletChartModel = <BulletChartModel>{
            settings: visualSettings,
            bars: [],
            barRects: [],
            valueRects: [],
            targetValues: [],
            viewportLength: 0,
            longestCategoryWidth: longestCategoryWidth,
        };

        const labelsPadding: number = isReversedOrientation ? BulletChart.LabelsPadding : BulletChart.zeroValue;
        const labelsWidth = visualSettings.labels.show.value
            ? (visualSettings.labels.autoWidth.value ? longestCategoryWidth + labelsPadding : visualSettings.labels.maxWidth.value)
            : 0;

        bulletModel.labelHeight = (visualSettings.labels.show.value || BulletChart.zeroValue) && Math.ceil(PixelConverter.fromPointToPixel(visualSettings.labels.font.fontSize.value));
        bulletModel.labelHeightTop = (visualSettings.labels.show.value || BulletChart.zeroValue) && Math.ceil(PixelConverter.fromPointToPixel(visualSettings.labels.font.fontSize.value)) / BulletChart.ratioForLabelHeight;
        bulletModel.spaceRequiredForBarHorizontally = visualSettings.general.barSize.value + this.SpaceBetweenBarsHorizontally;

        let legendWidth: number = 0;
        switch (LegendPosition[this.visualSettings.legend.position.value.value]) {
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
            case LegendPosition.Right:
            case LegendPosition.RightCenter:
                legendWidth = parseFloat(this.legendContext.attr("width")) || 0;
                break;
        }

        const topAndBottomVerticalMargin: number = BulletChart.YMarginVertical * 2;

        bulletModel.viewportLength = Math.max(0, (isVerticalOrientation
            ? (viewPortHeight - bulletModel.labelHeightTop - BulletChart.SubtitleMargin - BulletChart.verticalHeightOffset - topAndBottomVerticalMargin)
            : (viewPortWidth - labelsWidth - BulletChart.XMarginHorizontalLeft - BulletChart.XMarginHorizontalRight - legendWidth)) - BulletChart.ScrollBarSize);
        bulletModel.hasHighlights = !!(categorical.Value.values.length > BulletChart.zeroValue && categorical.Value.highlights);

        return bulletModel;
    }

    private BuildBulletChartItem(
        idx: number,
        categoryFillColor,
        category: string,
        categoryValue: PrimitiveValue,
        targetValue: PrimitiveValue,
        targetValue2: PrimitiveValue,
        highlight: boolean,
        valueFormatString: string,
        isVerticalOrientation: boolean,
        isReversedOrientation: boolean,
        visualSettings: BulletChartSettingsModel,
        toolTipItems: BulletChartTooltipItem[],
        categorical: BulletChartColumns,
        categoricalValues: BulletChartValueColumns,
        categoryMinValue: number | undefined,
        categoryMaxValue: number | undefined,
        colorHelper: ColorHelper,
        bulletModel: BulletChartModel,
        visualHost: IVisualHost,
    ): BarData {

        let minimum: number;
        if (visualSettings.syncAxis.syncAxis.value) {
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

        const scale: d3ScaleLinear<number, number> = d3ScaleLinearFunction()
            .clamp(true)
            .domain([minimum, maximum])
            .range(isVerticalOrientation ? [bulletModel.viewportLength, 0] : [0, bulletModel.viewportLength]);

        const minimumScale: number = scale(minimum);
        const needsImprovementScale: number = scale(needsImprovement);
        const satisfactoryScale: number = scale(satisfactory);
        const goodScale: number = scale(good);
        const veryGoodScale: number = scale(veryGood);
        const maximumScale: number = scale(maximum);
        const valueScale: number = lodashIsnumber(categoryValue) ? scale(categoryValue) : undefined;
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

        const scaledTarget: number = lodashIsnumber(targetValue) ? scale(targetValue || BulletChart.zeroValue) : 0;

        if (lodashIsnumber(scaledTarget)) {
            bulletModel.targetValues.push({
                barIndex: idx,
                categoryValue: categoryValue,
                targetValueUnscaled: targetValue,
                value: targetValue && lodashIsnumber(targetValue) ? scale(targetValue) : undefined,
                fill: bulletFillColor,
                stroke: visualSettings.colors.bulletColor.value.value,
                strokeWidth: maxStrokeWidthValues,
                key: selectionIdBuilder().withMeasure(scaledTarget.toString()).createSelectionId().getKey(),
                value2: targetValue2 && lodashIsnumber(targetValue2) ? scale(targetValue2) : undefined,
            });
        }

        const xAxisProperties: IAxisProperties = BulletChart.getXAxisProperties(visualSettings, bulletModel, scale, categorical, valueFormatString, isVerticalOrientation);

        const barData: BarData = {
            fillColor: categoryFillColor,
            scale: scale,
            barIndex: idx,
            categoryLabel: category,
            x: isVerticalOrientation ? (BulletChart.XMarginVertical + (this.SpaceRequiredForBarVertically + this.BarSize) * idx) : (isReversedOrientation ? BulletChart.XMarginHorizontalRight : BulletChart.XMarginHorizontalLeft),
            y: isVerticalOrientation ? (BulletChart.YMarginVertical) : (BulletChart.YMarginHorizontal + bulletModel.spaceRequiredForBarHorizontally * idx),
            xAxisProperties: xAxisProperties,
            key: selectionIdBuilder().createSelectionId().getKey(),
            identity: selectionIdBuilder().createSelectionId(),
        };

        return barData;
    }

    private static computeCategoryNumbers(categoricalValues: BulletChartValueColumns, idx: number, visualSettings: BulletChartSettingsModel, targetValue: PrimitiveValue, minimum: number, categoryMaxValue: number, categoryValue: PrimitiveValue, targetValue2: PrimitiveValue) {
        let needsImprovement: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.NeedsImprovement?.[idx], visualSettings.values.needsImprovementPercent.value, targetValue, minimum);
        let satisfactory: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Satisfactory?.[idx], visualSettings.values.satisfactoryPercent.value, targetValue, minimum);
        let good: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.Good?.[idx], visualSettings.values.goodPercent.value, targetValue, minimum);
        let veryGood: number = BulletChart.CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(categoricalValues.VeryGood?.[idx], visualSettings.values.veryGoodPercent.value, targetValue, minimum);
        let maximum: number;
        if (visualSettings.syncAxis.syncAxis.value) {
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
    public static CALCULATE_ADJUSTED_VALUE_BASED_ON_TARGET(value: PrimitiveValue, percent: number, targetValue: PrimitiveValue, minimum?: number): number {
        if (value !== null && isFinite(Number(value))) {
            return Number(value);
        }

        let adjustedMinimum: number = BulletChart.zeroValue;

        if (minimum !== undefined && minimum < 0) {
            adjustedMinimum = minimum;
        }

        if (lodashIsnumber(targetValue) && isFinite(targetValue) && targetValue !== null && isFinite(percent) && percent !== null && percent >= 0) {
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
        return (this.data && this.data.settings) || this.visualSettings;
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

        this.visualSettings.legend.labelColor.value.value = this.colorHelper.getHighContrastColor("foreground", this.visualSettings.legend.labelColor.value.value);
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

        const body: d3Selection<HTMLElement, null, HTMLElement, null> = d3Select(options.element);

        this.hostService = options.host;
        this.colorPalette = this.hostService.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette, BulletChart.CategoryPropertyIdentifier.fill, "");
        this.events = options.host.eventService;
        this.behavior = new Behavior(this.selectionManager);

        this.root = options.element;
        this.bulletBody = body
            .append("div")
            .classed(BulletChart.bulletChartClassed, true)
            .attr(BulletChart.dragResizeDisabled, true);

        this.scrollContainer = this.bulletBody
            .append("svg")
            .classed(BulletChart.bulletScrollRegion, true)
            .attr("fill", "none");

        this.legend = createLegend(options.element, false);
        this.legendContext = body.selectChild("svg.legend");

        this.labelGraphicsContext = this.scrollContainer.append("g");
        this.bulletGraphicsContext = this.scrollContainer.append("g");
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

            const categorical: BulletChartColumns = BulletChartColumns.getCategoricalColumns(dataView);
            const categoricalValues: BulletChartValueColumns = BulletChartColumns.getCategoricalValues(dataView, categorical);
            const renderedColors = this.computeRenderedColors(categorical, categoricalValues);

            // Render legend first, so we can compute legend width and then adjust visual size
            this.renderLegend(renderedColors);

            const data: BulletChartModel = this.CONVERTER({ dataView, options, categorical, categoricalValues });

            this.clearViewport();
            if (!data) {
                return;
            }

            this.data = data;
            this.visualSettings.populateCategoryColors(data.bars);

            this.baselineDelta = TextMeasurementHelper.estimateSvgTextBaselineDelta(BulletChart.getTextProperties(BulletChart.oneString, this.data.settings.labels.font.fontSize.value));

            this.bulletBody
                .style("height", PixelConverter.toString(this.layout.viewportIn.height))
                .style("width", PixelConverter.toString(this.layout.viewportIn.width));

            if (this.vertical) {
                this.scrollContainer
                    .attr("width", PixelConverter.toString(this.data.bars.length * (this.SpaceRequiredForBarVertically + this.BarSize) + BulletChart.XMarginVertical))
                    .attr("height", PixelConverter.toString(this.viewportScroll.height));
            } else {
                this.scrollContainer
                    .attr("height", () => {
                        const verticalShift: number = BulletChart.YMarginHorizontal;
                        const barsHeight: number = this.data.bars.length * this.data.spaceRequiredForBarHorizontally;

                        let axisHeight: number = 0;
                        if (this.settings.axis.axis.value) {
                            axisHeight = BulletChart.AxisHeight;
                            if (this.settings.syncAxis.showMainAxis.value) {
                                const lastBarSpacing = this.SpaceBetweenBarsHorizontally;
                                // Replace auto/custom spacing with fixed one
                                axisHeight -= lastBarSpacing;
                                axisHeight += BulletChart.MainAxisSpacing;
                            }
                        }

                        return verticalShift + barsHeight + axisHeight
                    })
                    .attr("width", PixelConverter.toString(this.viewportScroll.width));
            }

            if (this.vertical) {
                this.setUpBulletsVertically(this.data, this.reverse);
            } else {
                this.setUpBulletsHorizontally(this.data, this.reverse);
            }

            this.updateSubSelectionOutlines(options);

            this.events.renderingFinished(options);
        } catch (e) {
            console.error(e);
            this.events.renderingFailed(options, e);
        }
    }

    private updateSubSelectionOutlines(options: VisualUpdateOptions) {
        this.subSelectionHelper.setFormatMode(options.formatMode);

        const shouldUpdateSubSelection = options.type & (powerbi.VisualUpdateType.Data
            | powerbi.VisualUpdateType.Resize
            | powerbi.VisualUpdateType.FormattingSubSelectionChange);
        if (this.formatMode && shouldUpdateSubSelection) {
            this.subSelectionHelper.updateOutlinesFromSubSelections(options.subSelections, true);
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

    private calculateXPosition(barData: BarData, bar?: BarRect, reversed?: boolean) {
        const labelWidth = this.settings.labels.show.value
            ? this.settings.labels.autoWidth.value ? this.data.longestCategoryWidth : this.settings.labels.maxWidth.value
            : 0;

        return (reversed
                ? BulletChart.XMarginHorizontalRight
                : barData.x + labelWidth + BulletChart.XMarginHorizontalLeft + BulletChart.LabelsPadding)
            + (bar ? bar.start : BulletChart.zeroValue);
    }

    private calculateLabelHeight(barData: BarData, bar?: BarRect, reversed?: boolean) {
        return BulletChart.YMarginVertical + (reversed
                ? BulletChart.labelHeightReversedPadding
                : barData.y + this.data.labelHeightTop + BulletChart.BarMargin + BulletChart.SubtitleMargin)
            + (bar ? bar.end : 0);
    }

    /**
     * Returns the ratio of the bullet size to the bar size.
     * It's 1/4 of the bar size.
     */
    private static get ValueBulletToBarSizeRatio(): number {
        return 1 / 4;
    }

    /**
     * Bullet takes 2/8 of the bar size.
     * We need to place it in the middle of the bar.
     * Therefore, the bullet takes the position between 3/8 and 5/8, i.e in the middle.
     * The starting position is 3/8 of the bar size;
     */
    private get BulletMiddlePosition(): number {
        return this.BarSize * 3/8;
    }

    private drawAxisAndLabelsForHorizontalOrientation(model: BulletChartModel, reversed: boolean) {
        const bars: BarData[] = model.bars;
        const barSelection: d3Selection<SVGTextElement, BarData, SVGGElement, null> = this.labelGraphicsContext
            .selectAll<SVGTextElement, BarData>("text")
            .data(bars, (d: BarData) => d.key);

        if (model.settings.axis.axis.value) {
            if (model.settings.syncAxis.showMainAxis.value) {
                // main axis should be last/at the bottom
                const mainBar = bars[bars.length - 1];
                this.renderAxisHorizontally(mainBar, reversed, model.settings.syncAxis.showMainAxis.value);
                this.drawGridlines(mainBar, reversed, bars, false);
            } else {
                for (let idx: number = 0; idx < bars.length; idx++) {
                    this.renderAxisHorizontally(bars[idx], reversed, model.settings.syncAxis.showMainAxis.value);
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
                            this.data.viewportLength + BulletChart.XMarginHorizontalRight + BulletChart.LabelsPadding
                        );
                    return d.x;
                })
                .attr(
                    "y",
                    (d: BarData) =>
                        d.y +
                        this.baselineDelta +
                        this.BarSize / 2
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

    private getCategoryColorByCondition(model: BulletChartModel, bars: BarData[]) {
        return (d: BarRect) => {
            if (model.settings.colors.categoryFillColorGroup.fillCategory.value &&
                bars[d.barIndex]?.fillColor) {
                return bars[d.barIndex].fillColor;
            }
            return d.fillColor;
        };
    }

    private addLineToCategoryColor(
        element: SVGRectElement,
        barRect: BarRect,
        model: BulletChartModel,
        isHorizontal: boolean,
    ) {
        if (model.settings.colors.categoryFillColorGroup.fillCategory.value) {
            const x = parseFloat(element.getAttribute("x") || "0");
            const y = parseFloat(element.getAttribute("y") || "0");
            const width = parseFloat(element.getAttribute("width") || "0");
            const height = parseFloat(element.getAttribute("height") || "0");

            const parent = d3Select(element.parentElement);

             if (isHorizontal) {
                parent.append("line")
                    .attr("class", "right-border")
                    .attr("x1", x + width)
                    .attr("x2", x + width)
                    .attr("y1", y)
                    .attr("y2", y + height)
                    .style("stroke", barRect.strokeColor)
                    .style("stroke-width", 3);
            } else {
                parent.append("line")
                    .attr("class", "bottom-border")
                    .attr("x1", x)
                    .attr("x2", x + width)
                    .attr("y1", y + height)
                    .attr("y2", y + height)
                    .style("stroke", barRect.strokeColor)
                    .style("stroke-width", 3);
            }
        }
    }

    private setUpBulletsHorizontally(
        model: BulletChartModel,
        reversed: boolean,
    ): void {
        const bars: BarData[] = model.bars;
        const rects: BarRect[] = model.barRects;
        const valueRects: BarRect[] = model.valueRects;
        const targetValues: TargetValue[] = model.targetValues;
        const barSelection: d3Selection<SVGTextElement, BarData, SVGGElement, null> = this.labelGraphicsContext
            .selectAll<SVGTextElement, BarData>("text")
            .data(bars, (d: BarData) => d.key);

        const groupedBullets = d3Group(rects, (d: BarRect) => d.barIndex);
        const groupedBulletsSelection = this.bulletGraphicsContext
            .selectAll<SVGGElement, null>(`g.${BulletChart.BulletContainerSelector.className}`)
            .data(groupedBullets)
            .join("g")
            .classed(BulletChart.BulletContainerSelector.className, true)
            .attr("focusable", true)
            .attr("tabindex", 0);

        const bullets = groupedBulletsSelection
            .selectAll<SVGRectElement, null>("rect.range")
            .data(d => d[1])
            .join("rect")
            .classed("range", true)
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateXPosition(bars[d.barIndex], d, reversed))))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y)))
            .attr("width", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.end - d.start)))
            .attr("height", this.BarSize)
            .classed("range", true)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, (d: BarRect) => d.type)
            .attr(SubSelectableDisplayNameAttribute, (d: BarRect) => d.type)
            .style("fill", this.getCategoryColorByCondition(model, bars))
            .style("stroke", "none") // Remove the regular stroke
            .each((d: BarRect, i, nodes) => {
                this.addLineToCategoryColor(nodes[i], d, model, true);
            });

        // Draw value rects
        const valueSelection: d3Selection<SVGRectElement, BarRect, SVGGElement, null> = this.bulletGraphicsContext
            .selectAll<SVGRectElement, BarRect>("rect.value")
            .data(valueRects, (d: BarRect) => d.key)
            .join("rect")
            .attr("x", ((d: BarRect) => Math.max(0, this.calculateXPosition(bars[d.barIndex], d, reversed))))
            .attr("y", ((d: BarRect) => Math.max(0, bars[d.barIndex].y + this.BulletMiddlePosition)))
            .attr("width", ((d: BarRect) => Math.max(0, d.end - d.start)))
            .attr("height", this.BarSize * BulletChart.ValueBulletToBarSizeRatio)
            .classed("value", true)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Bullet.name)
            .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Bullet.displayName)
            .style("fill", (d: BarRect) => d.fillColor)
            .style("stroke", (d: BarRect) => d.strokeColor)
            .style("stroke-width", (d: BarRect) => d.strokeWidth);

        // Draw markers
        this.drawFirstTargets(targetValues,
            (d: TargetValue) => this.calculateXPosition(bars[d.barIndex], null, reversed) + d.value,
            (d: TargetValue) => this.calculateXPosition(bars[d.barIndex], null, reversed) + d.value,
            (d: TargetValue) => bars[d.barIndex].y + this.FirstAndSecondTargetPositionStart,
            (d: TargetValue) => bars[d.barIndex].y + this.FirstAndSecondTargetPositionEnd);

        this.drawSecondTargets(
            targetValues,
            (d: TargetValue) => this.calculateXPosition(bars[d.barIndex], null, reversed) + d.value2,
            (d: TargetValue) => bars[d.barIndex].y + this.BarSize / 2);

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
                .attr("y", ((d: BarData) => d.y + this.data.labelHeight / 2 + BulletChart.measureUnitShift + this.BarSize / 2))
                .attr("fill", model.settings.axis.unitsColor.value.value)
                .attr("font-family", model.settings.axis.unitsFont.fontFamily.value)
                .attr("font-size", PixelConverter.fromPoint(model.settings.axis.unitsFont.fontSize.value))
                .attr("font-weight", model.settings.axis.unitsFont.bold.value ? "bold" : "normal")
                .attr("font-style", model.settings.axis.unitsFont.italic.value ? "italic" : "normal")
                .attr("text-decoration", model.settings.axis.unitsFont.underline.value ? "underline" : "none")
                .text(measureUnitsText);
        }

        const targetCollection = this.data.barRects.concat(this.data.valueRects);
        const behaviorOptions: BehaviorOptions = {
            dataPoints: targetCollection,
            hasHighlights: this.data.hasHighlights,
            rects: bullets,
            groupedRects: groupedBulletsSelection,
            valueRects: valueSelection,
            clearCatcher: this.bulletBody,
        };

        this.behavior.bindEvents(behaviorOptions);

        this.tooltipServiceWrapper.addTooltip(valueSelection, (data: BarRect) => data.tooltipInfo);
        this.tooltipServiceWrapper.addTooltip(bullets, (data: BarRect) => data.tooltipInfo);
    }

    private renderLegend(renderedColors: RenderedColors): void {
        const legendDataObject: LegendData = {
            dataPoints: [],
            title: this.visualSettings.legend.titleText.value,
            fontSize: this.visualSettings.legend.font.fontSize.value,
            fontFamily: this.visualSettings.legend.font.fontFamily.value,
            labelColor: this.visualSettings.legend.labelColor.value.value,
        };

        const colors = this.visualSettings.colors.getData();

        let legendColors: { displayNameKey: string; color: string }[];
        if (renderedColors) {
            legendColors = Object.entries(renderedColors)
                .filter(([, value]) => value)
                .map(([key]) => colors[key]);
        } else {
            legendColors = Object.values(colors);
        }

        const emptyIdentity = this.hostService.createSelectionIdBuilder().createSelectionId();
        const dataPoints: LegendDataPoint[] = legendColors.map((colorObject) => ({
            label: this.localizationManager.getDisplayName(colorObject.displayNameKey),
            color: this.colorHelper.getHighContrastColor("foreground", colorObject.color),
            markerShape: MarkerShape.circle,
            identity: emptyIdentity,
            selected: false,
        }));
        legendDataObject.dataPoints = dataPoints;

        const legendObject: DataViewObject = {
            show: this.visualSettings.legend.show.value,
            showTitle: this.visualSettings.legend.showTitle.value,
            position: LegendPosition[this.visualSettings.legend.position.value.value],
            fontSize: this.visualSettings.legend.font.fontSize.value,
            titleText: this.visualSettings.legend.titleText.value,
            labelColor: {
                solid: {
                    color: this.visualSettings.legend.labelColor.value.value,
                }
            }
        };

        legendData.update(legendDataObject, legendObject);
        this.legend.changeOrientation(LegendPosition[this.visualSettings.legend.position.value.value]);
        this.legend.drawLegend(legendDataObject, this.layout.viewport);
        positionChartArea(this.bulletBody, this.legend);

        d3Select(this.root)
            .selectAll(BulletChart.LegendItemSelector.selectorName)
            .style("font-weight", this.visualSettings.legend.font.bold.value ? "bold" : "normal")
            .style("font-style", this.visualSettings.legend.font.italic.value ? "italic" : "normal")
            .style("text-decoration", this.visualSettings.legend.font.underline.value ? "underline" : "none");
    }

    private drawAxisAndLabelsForVerticalOrientation(model: BulletChartModel, reversed: boolean, labelsStartPosition: number) {
        const bars: BarData[] = model.bars;
        const barSelection: d3Selection<SVGTextElement, BarData, SVGGElement, null> = this.labelGraphicsContext
            .selectAll<SVGTextElement, BarData>("text")
            .data(bars, (d: BarData) => d.key);

        if (model.settings.axis.axis.value) {
            const axisColor = model.settings.axis.axisColor.value.value;

            if (model.settings.syncAxis.showMainAxis.value) {
                const mainBar = bars[0];
                this.renderAxisVertically(mainBar, reversed, axisColor, model.settings.syncAxis.showMainAxis.value);
                this.drawGridlines(mainBar, reversed, bars, true);
            } else {
                for (let idx = 0; idx < bars.length; idx++) {
                    const bar = bars[idx];
                    this.renderAxisVertically(bar, reversed, axisColor, model.settings.syncAxis.showMainAxis.value);
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
                    BulletChart.XMarginVertical - BulletChart.xAxisVerticalShift,
                    TextMeasurementService.svgEllipsis
                );
        }

        // Draw Labels
        if (model.settings.labels.show.value) {
            const textSelection = barSelection
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

                // accessibility title
                textSelection.append("title").text((d: BarData) => d.categoryLabel);

                textSelection
                    .append("tspan")
                    .attr("x", (d: BarData) => d.x)
                    .attr("dy", 0)
                    .text((d: BarData) => d.categoryLabel);

                if (this.settings.general.showCompletionPercent.value) {
                    textSelection
                        .append("tspan")
                        .attr("x", (d: BarData) => d.x)
                        .attr("dy", this.data.labelHeightTop + 7) // Add a little space between the category label and the completion percent
                        .text((d: BarData) => {
                            const categoryValue = model.targetValues[d.barIndex].categoryValue;
                            const targetValue = model.targetValues[d.barIndex].targetValueUnscaled;
                            return this.computeCompletionPercent(categoryValue, targetValue);
                        });
                }

        }
    }

    private computeCompletionPercent(value: PrimitiveValue, targetValue: PrimitiveValue): string {
        if (lodashIsnumber(value) && lodashIsnumber(targetValue)) {
            const percent: number = Math.round(value / targetValue * 100);
            if (!isNaN(percent) && isFinite(percent)) {
                return percent + "%";
            }
        }

        return 'N/A';
    }

    private renderAxisVertically(bar: BarData, reversed: boolean, axisColor: string, isMainAxis: boolean) {
        this.bulletGraphicsContext
            .append("g")
            .attr("transform", () => {
                const xLocation: number = bar.x - (isMainAxis ? BulletChart.MainAxisSpacing: 0);
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
                const xLocation: number = this.calculateXPosition(
                    bar,
                    null,
                    reversed
                );
                const yLocation: number = bar.y + this.BarSize + (isMainAxis ? BulletChart.MainAxisSpacing : 0);

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

    private getGridStrokeStyleArray(): string | null {
        const style = this.settings.syncAxis.lineStyle.value.value as string;
        const width = this.settings.syncAxis.width.value ?? 1;
        if (style === "dashed") return `${width * 3},${width * 2}`;
        if (style === "dotted") return `${width},${width * 2}`;
        return null; //solid
    }

    private getGridOpacity(): number {
        const transparency = this.settings.syncAxis.transparency?.value ?? 0;
        return Math.max(0, Math.min(1, 1 - transparency / 100));
    }

    private drawGridlines(mainBar: BarData, reversed: boolean, bars: BarData[], isVertical: boolean) {
        if (!this.settings.syncAxis.gridlines.value) return;

        const stroke = this.colorHelper.getHighContrastColor("foreground", this.settings.syncAxis.color.value.value);
        const opacity = this.getGridOpacity();
        const lineStyle = this.getGridStrokeStyleArray();
        const width = this.settings.syncAxis.width.value ?? 1;
        const ticks = mainBar.xAxisProperties.values as number[];

        const className = isVertical ? "main-gridlines-v" : "main-gridlines-h";
        
        const g = this.bulletGraphicsContext
            .selectAll<SVGGElement, number>(`g.${className}`)
            .data([0])
            .join("g")
            .classed(className, true)
            .lower();

        const lines = g.selectAll<SVGLineElement, number>("line")
            .data(ticks, (d) => String(d));

        if (isVertical) {
            const valueScaleOriginY = this.calculateLabelHeight(mainBar, null, reversed);
            const gridlineStartX = mainBar.x - BulletChart.MainAxisSpacing;
            const gridlineEndX = bars[bars.length - 1].x + this.BarSize + BulletChart.MainAxisSpacing;

            lines.enter()
                .append("line")
                .merge(lines)
                .attr("x1", gridlineStartX)
                .attr("x2", gridlineEndX)
                .attr("y1", d => valueScaleOriginY + mainBar.scale(d))
                .attr("y2", d => valueScaleOriginY + mainBar.scale(d))
                .style("stroke", stroke)
                .style("stroke-width", width)
                .style("stroke-opacity", opacity)
                .attr("stroke-dasharray", lineStyle);
        } else {
            const gridlineStartY = mainBar.y + this.BarSize + BulletChart.MainAxisSpacing;
            const valueScaleOriginX = this.calculateXPosition(mainBar, null, reversed);
            const gridlineEndY = bars[0].y - BulletChart.MainAxisSpacing;

            lines.enter()
                .append("line")
                .merge(lines)
                .attr("x1", d => valueScaleOriginX + mainBar.scale(d))
                .attr("x2", d => valueScaleOriginX + mainBar.scale(d))
                .attr("y1", gridlineStartY)
                .attr("y2", gridlineEndY)
                .style("stroke", stroke)
                .style("stroke-width", width)
                .style("stroke-opacity", opacity)
                .attr("stroke-dasharray", lineStyle);
        }

        lines.exit().remove();
    }

    private setUpBulletsVertically(
        model: BulletChartModel,
        reversed: boolean,
    ) {
        const bars: BarData[] = model.bars;
        const rects: BarRect[] = model.barRects;
        const valueRects: BarRect[] = model.valueRects;
        const targetValues: TargetValue[] = model.targetValues;
        const barSelection: d3Selection<SVGTextElement, BarData, SVGGElement, null> = this.labelGraphicsContext
            .selectAll<SVGTextElement, BarData>("text")
            .data(bars, (d: BarData) => d.key);

        const groupedBullets = d3Group(rects, (d: BarRect) => d.barIndex);
        const groupedBulletsSelection = this.bulletGraphicsContext
            .selectAll<SVGGElement, null>(`g.${BulletChart.BulletContainerSelector.className}`)
            .data(groupedBullets)
            .join("g")
            .classed(BulletChart.BulletContainerSelector.className, true)
            .attr("focusable", true)
            .attr("tabindex", 0);

        const bullets = groupedBulletsSelection
            .selectAll<SVGRectElement, null>("rect.range")
            .data(d => d[1])
            .join("rect")
            .classed("range", true)
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x)))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reversed))))
            .attr("height", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.start - d.end)))
            .attr("width", this.BarSize)
            .classed("range", true)
            .style("fill", this.getCategoryColorByCondition(model, bars))
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, (d: BarRect) => d.type)
            .attr(SubSelectableDisplayNameAttribute, (d: BarRect) => d.type)
            .style("stroke", "none") // Remove the regular stroke
            .each((d: BarRect, i, nodes) => {
                this.addLineToCategoryColor(nodes[i], d, model, false);
            });

        // Draw value rects
        const valueSelection = this.bulletGraphicsContext
            .selectAll<SVGRectElement, null>("rect.value")
            .data(valueRects, (d: BarRect) => d.key);
        const valueSelectionMerged = valueSelection
            .join("rect")
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x + this.BulletMiddlePosition)))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reversed))))
            .attr("height", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.start - d.end)))
            .attr("width", this.BarSize * BulletChart.ValueBulletToBarSizeRatio)
            .classed("value", true)
            .classed(HtmlSubSelectableClass, this.formatMode)
            .attr(SubSelectableObjectNameAttribute, BulletChartObjectNames.Bullet.name)
            .attr(SubSelectableDisplayNameAttribute, BulletChartObjectNames.Bullet.displayName)
            .style("fill", (d: BarRect) => d.fillColor)
            .attr("stroke", (d: BarRect) => d.strokeColor)
            .attr("stroke-width", (d: BarRect) => d.strokeWidth);

        // Draw markers
        this.drawFirstTargets(
            targetValues,
            (d: TargetValue) => bars[d.barIndex].x + this.FirstAndSecondTargetPositionStart,
            (d: TargetValue) => bars[d.barIndex].x + (this.FirstAndSecondTargetPositionEnd),
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reversed) + d.value,
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reversed) + d.value);

        this.drawSecondTargets(targetValues,
            (d: TargetValue) => bars[d.barIndex].x + this.BarSize / 2,
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reversed) + d.value2);

        const labelsStartPos: number = BulletChart.YMarginVertical + (reversed ? model.viewportLength + 15 : 0) + this.data.labelHeightTop;
        this.drawAxisAndLabelsForVerticalOrientation(model, reversed, labelsStartPos);
        const measureUnitsText: string = TextMeasurementService.getTailoredTextOrDefault(
            BulletChart.getTextProperties(model.settings.axis.measureUnits.value, model.settings.axis.unitsFont.fontSize.value),
            BulletChart.MaxMeasureUnitWidth);

        // Draw measure label
        if (model.settings.axis.measureUnits.value) {
            barSelection
                .join("text")
                .classed(BulletChart.MeasureUnitsSelector.className, true)
                .attr("x", ((d: BarData) => d.x + this.BarSize))
                .attr("y", () => {
                    return labelsStartPos + BulletChart.SubtitleMargin + BulletChart.measureUnitShift;
                })
                .attr("fill", model.settings.axis.unitsColor.value.value)
                .attr("font-family", model.settings.axis.unitsFont.fontFamily.value)
                .attr("font-size", PixelConverter.fromPoint(model.settings.axis.unitsFont.fontSize.value))
                .attr("font-weight", model.settings.axis.unitsFont.bold.value ? "bold" : "normal")
                .attr("font-style", model.settings.axis.unitsFont.italic.value ? "italic" : "normal")
                .attr("text-decoration", model.settings.axis.unitsFont.underline.value ? "underline" : "none")
                .text(measureUnitsText);
        }

        const targetCollection: BarRect[] = this.data.barRects.concat(this.data.valueRects);
        const behaviorOptions: BehaviorOptions = {
            dataPoints: targetCollection,
            hasHighlights: this.data.hasHighlights,
            rects: bullets,
            groupedRects: groupedBulletsSelection,
            valueRects: valueSelectionMerged,
            clearCatcher: this.bulletBody,
        };
        this.behavior.bindEvents(behaviorOptions);

        this.tooltipServiceWrapper.addTooltip(valueSelectionMerged, (data: BarRect) => data.tooltipInfo);
        this.tooltipServiceWrapper.addTooltip(bullets, (data: BarRect) => data.tooltipInfo);
    }

    private drawFirstTargets(
        targetValues: TargetValue[],
        x1: (d: TargetValue) => number,
        x2: (d: TargetValue) => number,
        y1: (d: TargetValue) => number,
        y2: (d: TargetValue) => number) {

        const selection: d3Selection<SVGLineElement, TargetValue, SVGGElement, null> = this.bulletGraphicsContext
            .selectAll<SVGLineElement, TargetValue>("line.target")
            .data(targetValues.filter(x => lodashIsnumber(x.value)));

        const selectionMerged: d3Selection<SVGLineElement, TargetValue, SVGGElement, null> = selection
            .enter()
            .append("line")
            .merge(selection);

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
        getMiddleX: (d: TargetValue) => number,
        getY: (d: TargetValue) => number): void {

        const selection: d3Selection<SVGLineElement, TargetValue, SVGGElement, null> = this.bulletGraphicsContext
            .selectAll<SVGLineElement, TargetValue>("line.target2")
            .data(targetValues.filter(x => lodashIsnumber(x.value2)));

        const enterSelection = selection.enter();

        // First target x1 is 1/6 of the bar size and x2 is 5/6 of the bar size.
        // We need to match x1/x2 of the second target with x1/x2 of the first target.
        // 1/2 - 1/3 = 1/6
        // 1/2 + 1/3 = 5/6
        enterSelection
            .append("line")
            .merge(selection)
            .attr("x1", (d: TargetValue) => getMiddleX(d) - this.BarSize / 3)
            // Vertical height of the line is fixed and doesn't depend on the bar size.
            // Otherwise, the line would be too long for the big bars.
            .attr("y1", (d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize)
            .attr("x2", (d: TargetValue) => getMiddleX(d) + this.BarSize / 3)
            .attr("y2", (d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize)
            .style("stroke", (d: TargetValue) => d.fill)
            .style("stroke-width", 2)
            .classed("target2", true);

        enterSelection
            .append("line")
            .merge(selection)
            .attr("x1", (d: TargetValue) => getMiddleX(d) - this.BarSize / 3)
            .attr("y1", (d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize)
            .attr("x2", (d: TargetValue) => getMiddleX(d) + this.BarSize / 3)
            .attr("y2", (d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize)
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

        if (!this.visualSettings.general.customBarSpacing.value) {
            this.visualSettings.general.barSpacing.visible = false;
        }

        if (!this.visualSettings.syncAxis.syncAxis.value && this.visualSettings.syncAxis.showMainAxis.value) {
            this.hostService.persistProperties({
                merge: [{
                    objectName: 'syncAxis',
                    selector: null,
                    properties: {
                        syncAxis: false,
                        showMainAxis: false
                    }
                }]
            });
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
                relatedResetFormattingIds: [axisReference.axis, axisReference.axisColor, axisReference.syncAxis, axisReference.showMainAxis, axisReference.orientation],
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
                ...axisReference.showMainAxis,
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
        d3Select("body").append("span");

        // The style hides the svg element from the canvas, preventing canvas from scrolling down to show svg black square.
        const svgTextElement = d3Select("body")
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