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

import { select, Selection } from 'd3-selection';
import lodashIsnumber from "lodash.isnumber";
import lodashMax from "lodash.max";
import powerbiVisualsApi from "powerbi-visuals-api";

// d3
type BulletSelection<T1, T2 = T1> = Selection<any, T1, any, T2>;
import { scaleLinear, ScaleLinear } from "d3-scale";

import IViewport = powerbiVisualsApi.IViewport;
import DataView = powerbiVisualsApi.DataView;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import EnumerateVisualObjectInstancesOptions = powerbiVisualsApi.EnumerateVisualObjectInstancesOptions;
import DataViewObjectPropertyIdentifier = powerbiVisualsApi.DataViewObjectPropertyIdentifier;
import VisualObjectInstanceEnumeration = powerbiVisualsApi.VisualObjectInstanceEnumeration;
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

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

// powerbi.extensibility.utils.interactivity
import { interactivityBaseService as interactivityService, interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractivityService = interactivityService.IInteractivityService;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;
import BaseDataPoint = interactivityBaseService.BaseDataPoint;

// powerbi.extensibility.utils.formatting
// import { textMeasurementService as tms, valueFormatter } from "powerbi-visuals-utils-formattingutils";
// import TextProperties = tms.TextProperties;
// import TextMeasurementService = tms.textMeasurementService;

import { textMeasurementService as TextMeasurementService } from "powerbi-visuals-utils-formattingutils";
import * as valueFormatter from "powerbi-visuals-utils-formattingutils/lib/src/valueFormatter";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

// powerbi.extensibility.utils.chart
import { axisInterfaces, axisScale, axis as AxisHelper } from "powerbi-visuals-utils-chartutils";
import IAxisProperties = axisInterfaces.IAxisProperties;

// powerbi.extensibility.utils.tooltip
import { TooltipEventArgs, ITooltipServiceWrapper, createTooltipServiceWrapper, TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { BulletChartColumns } from "./BulletChartColumns";
import { BulletChartModel, BulletChartTooltipItem, BarValueRect, BarData, BarRect, TargetValue } from "./dataInterfaces";
import { VisualLayout } from "./visualLayout";
import { BulletchartSettings, BulletChartOrientation } from "./settings";
import { BulletBehaviorOptions, BulletWebBehavior } from "./behavior";

export class BulletChart implements IVisual {
    private static ScrollBarSize: number = 22;
    private static SpaceRequiredForBarVertically: number = 100;
    private static XMarginHorizontalLeft: number = 20;
    private static XMarginHorizontalRight: number = 55;
    private static YMarginHorizontal: number = 17.5;
    private static XMarginVertical: number = 70;
    private static YMarginVertical: number = 10;
    private static BulletSize: number = 25;
    private static DefaultSubtitleFontSizeInPt: number = 9;
    private static BarMargin: number = 10;
    private static MaxLabelWidth: number = 80;
    private static MeasureUnitHeightHalf: number = 8;
    private static MaxMeasureUnitWidth: number = BulletChart.MaxLabelWidth - 20;
    private static SubtitleMargin: number = 10;
    private static AxisFontSizeInPt: number = 8;
    private static SecondTargetLineSize: number = 7;
    private static MarkerMarginHorizontal: number = BulletChart.BulletSize / 6;
    private static MarkerMarginHorizontalEnd: number = 5 * BulletChart.MarkerMarginHorizontal;
    private static MarkerMarginVertical: number = BulletChart.BulletSize / 4;
    private static FontFamily: string = "Segoe UI";
    private baselineDelta: number = 0;
    // Variables
    private clearCatcher: BulletSelection<any>;
    private bulletBody: BulletSelection<any>;
    private scrollContainer: BulletSelection<any>;
    private labelGraphicsContext: BulletSelection<any>;
    private bulletGraphicsContext: BulletSelection<any>;
    private data: BulletChartModel;
    private behavior: BulletWebBehavior;
    private interactivityService: IInteractivityService<BaseDataPoint>;
    private hostService: IVisualHost;
    public layout: VisualLayout;
    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;
    private events: IVisualEventService;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private selectionManager: ISelectionManager;

    private get reverse(): boolean {
        switch (this.settings && this.settings.orientation.orientation) {
            case BulletChartOrientation.HorizontalRight:
            case BulletChartOrientation.VerticalBottom:
                return true;
        }
        return false;
    }

    private get vertical(): boolean {
        switch (this.settings && this.settings.orientation.orientation) {
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
    private static value25: number = 25;
    private static value28: number = 28;
    private static value60: number = 60;
    private static emptyString: string = "";

    private static additems(anyRangeIsDefined,
        bulletModel,
        idx,
        firstScale,
        secondScale,
        firstFillColor,
        firstColor,
        thirdScale,
        secondFillColor,
        secondColor,
        fourthScale,
        thirdFillColor,
        thirdColor,
        fifthScale,
        fourthFillColor,
        fourthColor,
        lastScale,
        lastFillColor,
        lastColor,
        maxStrokeWidthBars,
        toolTipItems,
        highlight,
        selectionIdBuilder) {
        if (anyRangeIsDefined) {
          BulletChart.addItemToBarArray(
            bulletModel.barRects,
            idx,
            firstScale,
            secondScale,
            firstFillColor,
            firstColor,
            maxStrokeWidthBars,
            null,
            toolTipItems,
            selectionIdBuilder(),
            highlight
          );

          BulletChart.addItemToBarArray(
            bulletModel.barRects,
            idx,
            secondScale,
            thirdScale,
            secondFillColor,
            secondColor,
            maxStrokeWidthBars,
            null,
            toolTipItems,
            selectionIdBuilder(),
            highlight
          );

          BulletChart.addItemToBarArray(
            bulletModel.barRects,
            idx,
            thirdScale,
            fourthScale,
            thirdFillColor,
            thirdColor,
            maxStrokeWidthBars,
            null,
            toolTipItems,
            selectionIdBuilder(),
            highlight
          );

          BulletChart.addItemToBarArray(
            bulletModel.barRects,
            idx,
            fourthScale,
            fifthScale,
            fourthFillColor,
            fourthColor,
            maxStrokeWidthBars,
            null,
            toolTipItems,
            selectionIdBuilder(),
            highlight
          );

          BulletChart.addItemToBarArray(
            bulletModel.barRects,
            idx,
            fifthScale,
            lastScale,
            lastFillColor,
            lastColor,
            maxStrokeWidthBars,
            null,
            toolTipItems,
            selectionIdBuilder(),
            highlight
          );
        }
    }

    private static getxaxisproperties(settings, bulletModel, scale, categorical, valueFormatString, verticalOrientation) {
        let xAxisProperties: IAxisProperties = null;
        if (settings.axis.axis) {
            return xAxisProperties = AxisHelper.createAxis({
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
            });
        } else return xAxisProperties;
    }

    // Convert a DataView into a view model
    public static CONVERTER(dataView: DataView, options: VisualUpdateOptions, visualHost: IVisualHost, colorHelper: ColorHelper): BulletChartModel {
        const categorical: BulletChartColumns<
          DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns
        > = BulletChartColumns.GETCATEGORICALCOLUMNS(dataView);
        if (!categorical || !categorical.Value || !categorical.Value[0]) {return null;}
        const categoricalValues: BulletChartColumns<any[]> =
          BulletChartColumns.GETCATEGORICALVALUES(dataView);
        const settings: BulletchartSettings = BulletChart.parseSettings(dataView, colorHelper);
        BulletChart.updateOrientation(settings);
        BulletChart.limitProperties(settings);
        const bulletModel: BulletChartModel = <BulletChartModel>{settings: settings, bars: [], barRects: [], valueRects: [], targetValues: [], viewportLength: BulletChart.zeroValue};
        const verticalOrientation: boolean = settings.orientation.orientation === BulletChartOrientation.VerticalBottom
            || settings.orientation.orientation === BulletChartOrientation.VerticalTop;
        const reversedOrientation: boolean = settings.orientation.orientation === BulletChartOrientation.HorizontalRight
            || settings.orientation.orientation === BulletChartOrientation.VerticalBottom;
        bulletModel.labelHeight = (settings.labels.show || BulletChart.zeroValue) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize));
        bulletModel.labelHeightTop = (settings.labels.show || BulletChart.zeroValue) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize)) / BulletChart.value1dot4;
        bulletModel.spaceRequiredForBarHorizontally = Math.max(settings.axis.axis ? BulletChart.value60 : BulletChart.value28, bulletModel.labelHeight + BulletChart.value25);
        bulletModel.viewportLength = Math.max(0, (verticalOrientation
            ? (options.viewport.height - bulletModel.labelHeightTop - BulletChart.SubtitleMargin - BulletChart.value25 - BulletChart.YMarginVertical * BulletChart.value2)
            : (options.viewport.width - (settings.labels.show ? settings.labels.maxWidth : 0) - BulletChart.XMarginHorizontalLeft - BulletChart.XMarginHorizontalRight)) - BulletChart.ScrollBarSize);
        bulletModel.hasHighlights = !!(categorical.Value[0].values.length > BulletChart.zeroValue && categorical.Value[0].highlights);
        const valueFormatString: string = valueFormatter.getFormatStringByColumn(categorical.Value[0].source, true);
        const categoryFormatString: string = categorical.Category ? valueFormatter.getFormatStringByColumn(categorical.Category.source, true) : BulletChart.emptyString;
        const length: number = categoricalValues.Value.length;
        for (let idx = 0; idx < length; idx++) {
            let category: string = BulletChart.emptyString;
            if (categorical.Category) {
                category = valueFormatter.format(categoricalValues.Category[idx], categoryFormatString);
                category = TextMeasurementService.getTailoredTextOrDefault( BulletChart.getTextProperties(category, settings.labels.fontSize), verticalOrientation ? this.MaxLabelWidth : settings.labels.maxWidth); }
            const toolTipItems: BulletChartTooltipItem[] = [],
                value = categoricalValues.Value[idx] || BulletChart.zeroValue;
            toolTipItems.push({ value: value, metadata: categorical.Value[0], customName: settings.tooltips.valueCustomName });
            const targetValue: number = categoricalValues.TargetValue ? categoricalValues.TargetValue[idx] : settings.values.targetValue;
            if (lodashIsnumber(targetValue)) {
                toolTipItems.push({ value: targetValue, metadata: categorical.TargetValue && categorical.TargetValue[0], customName: settings.tooltips.targetCustomName });}
            const targetValue2: number = categoricalValues.TargetValue2 ? categoricalValues.TargetValue2[idx] : settings.values.targetValue2;
            if (lodashIsnumber(targetValue2)) { toolTipItems.push({ value: targetValue2, metadata: categorical.TargetValue2 && categorical.TargetValue2[0], customName: settings.tooltips.target2CustomName });}
            let minimum: number = BulletChart.GETRANGEVALUE(categoricalValues.Minimum ? categoricalValues.Minimum[idx] : undefined, settings.values.minimumPercent, targetValue);
            let needsImprovement: number = BulletChart.GETRANGEVALUE(categoricalValues.NeedsImprovement ? categoricalValues.NeedsImprovement[idx] : undefined, settings.values.needsImprovementPercent, targetValue, minimum);
            let satisfactory: number = BulletChart.GETRANGEVALUE(categoricalValues.Satisfactory ? categoricalValues.Satisfactory[idx] : undefined, settings.values.satisfactoryPercent, targetValue, minimum);
            let good: number = BulletChart.GETRANGEVALUE(categoricalValues.Good ? categoricalValues.Good[idx] : undefined, settings.values.goodPercent, targetValue, minimum);
            let veryGood: number = BulletChart.GETRANGEVALUE(categoricalValues.VeryGood ? categoricalValues.VeryGood[idx] : undefined, settings.values.veryGoodPercent, targetValue, minimum);
            let maximum: number = BulletChart.GETRANGEVALUE(categoricalValues.Maximum ? categoricalValues.Maximum[idx] : undefined, settings.values.maximumPercent, targetValue, minimum);
            const anyRangeIsDefined: boolean = [needsImprovement, satisfactory, good, veryGood].some(lodashIsnumber);
            minimum = lodashIsnumber(minimum) ? minimum : BulletChart.zeroValue;
            needsImprovement = lodashIsnumber(needsImprovement) ? Math.max(minimum, needsImprovement) : needsImprovement;
            satisfactory = lodashIsnumber(satisfactory) ? Math.max(satisfactory, needsImprovement) : satisfactory;
            good = lodashIsnumber(good) ? Math.max(good, satisfactory) : good;
            veryGood = lodashIsnumber(veryGood) ? Math.max(veryGood, good) : veryGood;
            const minMaxValue = lodashMax([minimum, needsImprovement, satisfactory, good, veryGood, value, targetValue, targetValue2].filter(lodashIsnumber));
            maximum = lodashIsnumber(maximum) ? Math.max(maximum, minMaxValue) : minMaxValue;
            veryGood = lodashIsnumber(veryGood) ? veryGood : maximum;
            good = lodashIsnumber(good) ? good : veryGood;
            satisfactory = lodashIsnumber(satisfactory) ? satisfactory : good;
            needsImprovement = lodashIsnumber(needsImprovement) ? needsImprovement : satisfactory;
            const scale: ScaleLinear<number, number> = (scaleLinear().clamp(true).domain([minimum, maximum]).range(verticalOrientation ? [bulletModel.viewportLength, 0] : [0, bulletModel.viewportLength]));
            const firstScale: number = scale(minimum);
            const secondScale: number = scale(needsImprovement);
            const thirdScale: number = scale(satisfactory);
            const fourthScale: number = scale(good);
            const fifthScale: number = scale(veryGood);
            const lastScale: number = scale(maximum);
            const valueScale: number = scale(value);
            const firstColor: string = settings.colors.minColor,
                secondColor: string = settings.colors.needsImprovementColor,
                thirdColor: string = settings.colors.satisfactoryColor,
                fourthColor: string = settings.colors.goodColor,
                lastColor: string = settings.colors.veryGoodColor,
                firstFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : firstColor,
                secondFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : secondColor,
                thirdFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : thirdColor,
                fourthFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : fourthColor,
                lastFillColor: string = colorHelper.isHighContrast ? colorHelper.getThemeColor() : lastColor;
            const highlight: any = categorical.Value[0].highlights && categorical.Value[0].highlights[idx] !== null;
            const selectionIdBuilder = () => categorical.Category
                ? visualHost.createSelectionIdBuilder().withCategory(categorical.Category, idx)
                : visualHost.createSelectionIdBuilder();

            const maxStrokeWidthBars: number = 0.5, maxStrokeWidthValues: number = 1.5;

            BulletChart.additems(anyRangeIsDefined, bulletModel, idx, firstScale, secondScale, firstFillColor, firstColor, thirdScale,
              secondFillColor, secondColor, fourthScale, thirdFillColor, thirdColor, fifthScale, fourthFillColor,
              fourthColor, lastScale, lastFillColor, lastColor, maxStrokeWidthBars, toolTipItems, highlight, selectionIdBuilder);
            const bulletFillColor = colorHelper.isHighContrast ? colorHelper.getThemeColor() : settings.colors.bulletColor;
            BulletChart.addItemToBarArray(bulletModel.valueRects, idx, firstScale, valueScale, bulletFillColor, settings.colors.bulletColor,
                maxStrokeWidthValues, null, toolTipItems, selectionIdBuilder(), highlight);
            const scaledTarget: number = scale(targetValue || BulletChart.zeroValue);
            if (lodashIsnumber(scaledTarget)) {
                bulletModel.targetValues.push({barIndex: idx, value: targetValue && scale(targetValue), fill: bulletFillColor, stroke: settings.colors.bulletColor, strokeWidth: maxStrokeWidthValues,
                    key: selectionIdBuilder().withMeasure(scaledTarget.toString()).createSelectionId().getKey(),
                    value2: targetValue2 && scale(targetValue2),
                });} const xAxisProperties: IAxisProperties = BulletChart.getxaxisproperties(settings, bulletModel, scale, categorical, valueFormatString, verticalOrientation);
            const bar1: BarData = { scale: scale, barIndex: idx, categoryLabel: category,
                x: verticalOrientation ? (BulletChart.XMarginVertical + BulletChart.SpaceRequiredForBarVertically * idx) : (reversedOrientation ? BulletChart.XMarginHorizontalRight : BulletChart.XMarginHorizontalLeft),
                y: verticalOrientation ? (BulletChart.YMarginVertical) : (BulletChart.YMarginHorizontal + bulletModel.spaceRequiredForBarHorizontally * idx),
                xAxisProperties: xAxisProperties,
                key: selectionIdBuilder().createSelectionId().getKey(),
            }; bulletModel.bars.push(bar1);
        } return bulletModel;}

    public static GETRANGEVALUE(value: number, percent: number, targetValue: number, minimum?: number): number {
        let negativeMinimumCoef: number = 0;

        if (minimum === undefined) {
            negativeMinimumCoef = value ? value : BulletChart.zeroValue;
        } else if (minimum < 0) {
            negativeMinimumCoef = minimum;
        }

        return isFinite(value) && value !== null ? value : (isFinite(targetValue) && targetValue !== null && isFinite(percent) && percent !== null ? (percent * (targetValue - negativeMinimumCoef) / 100) + negativeMinimumCoef : null);
    }

    // Implemented for old enums using space containing keys for example "Horizontal Left" which doesn't exist in current version
    private static updateOrientation(settings: BulletchartSettings): void {
        if (settings && settings.orientation && settings.orientation.orientation) {
            const noSpaceOrientation: string = settings.orientation.orientation.toString().replace(" ", "");

            if (BulletChartOrientation[noSpaceOrientation]) {
                settings.orientation.orientation = BulletChartOrientation[noSpaceOrientation];
            }
        }
    }

    private static limitProperties(settings: BulletchartSettings): void {
        if (settings.values.minimumPercent > settings.values.maximumPercent) {
            settings.values.maximumPercent = settings.values.minimumPercent;
        }

        if (settings.labels.maxWidth <= 0) {
            settings.labels.maxWidth = this.MaxLabelWidth;
        }
    }

    private get settings(): BulletchartSettings {
        return this.data && this.data.settings;
    }

    private static parseSettings(dataView: DataView, colorHelper: ColorHelper): BulletchartSettings {
        const settings: BulletchartSettings = BulletchartSettings.parse<BulletchartSettings>(dataView);

        // change colors for high contrast mode
        settings.axis.axisColor = colorHelper.getHighContrastColor("foreground", settings.axis.axisColor);
        settings.axis.unitsColor = colorHelper.getHighContrastColor("foreground", settings.axis.unitsColor);
        settings.labels.labelColor = colorHelper.getHighContrastColor("foreground", settings.labels.labelColor);

        settings.colors.bulletColor = colorHelper.getHighContrastColor("foreground", settings.colors.bulletColor);
        settings.colors.goodColor = colorHelper.getHighContrastColor("foreground", settings.colors.goodColor);
        settings.colors.minColor = colorHelper.getHighContrastColor("foreground", settings.colors.minColor);
        settings.colors.needsImprovementColor = colorHelper.getHighContrastColor("foreground", settings.colors.needsImprovementColor);
        settings.colors.satisfactoryColor = colorHelper.getHighContrastColor("foreground", settings.colors.satisfactoryColor);
        settings.colors.veryGoodColor = colorHelper.getHighContrastColor("foreground", settings.colors.veryGoodColor);

        return settings;
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        return BulletchartSettings.enumerateObjectInstances(
            this.settings || BulletchartSettings.getDefault(),
            options);
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

    private static addItemToBarArray(
        collection: BarRect[],
        barIndex: number,
        start: number,
        end: number,
        fillColor: string,
        strokeColor: string,
        strokeWidth: number,
        formatString: DataViewObjectPropertyIdentifier,
        tooltipInfo: BulletChartTooltipItem[],
        selectionIdBuilder: ISelectionIdBuilder,
        highlight: boolean): void {

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
        if (window.location !== window.parent.location) {
            require("core-js/stable");
        }

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            options.host.tooltipService,
            options.element);

        this.selectionManager = options.host.createSelectionManager();

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

        this.scrollContainer = this.bulletBody.append("svg")
            .classed(BulletChart.bulletScrollRegion, true);
        this.clearCatcher = appendClearCatcher(this.scrollContainer);

        this.labelGraphicsContext = this.scrollContainer.append("g");
        this.bulletGraphicsContext = this.scrollContainer.append("g");

        this.behavior = new BulletWebBehavior();

        this.interactivityService = createInteractivitySelectionService(options.host);
        this.handleContextMenu();
    }
    public static oneString: string = "1";
    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);
        if (!options.dataViews || !options.dataViews[0]) {
            return;
        }
        const dataView: DataView = options.dataViews[0];
        this.layout.viewport = options.viewport;
        const data: BulletChartModel = BulletChart.CONVERTER(dataView, options, this.hostService, this.colorHelper);

        this.clearviewport();
        if (!data) {
            return;
        }

        this.data = data;

        this.baselineDelta = TextMeasurementHelper.estimateSvgTextBaselineDelta(BulletChart.getTextProperties(BulletChart.oneString, this.data.settings.labels.fontSize));

        if (this.interactivityService) {
            this.interactivityService.applySelectionStateToData(this.data.barRects);
        }

        this.bulletBody
            .style("height", PixelConverter.toString(this.layout.viewportIn.height))
            .style("width", PixelConverter.toString(this.layout.viewportIn.width));

        if (this.vertical) {
            this.scrollContainer.attr("width", PixelConverter.toString(this.data.bars.length * BulletChart.SpaceRequiredForBarVertically + BulletChart.XMarginVertical))
                .style("height", PixelConverter.toString(this.viewportScroll.height));
        }
        else {
            this.scrollContainer.attr("height", (this.data.bars.length * (this.data.spaceRequiredForBarHorizontally || BulletChart.zeroValue)
                + (this.data.settings.axis.axis ? 0 : BulletChart.YMarginHorizontal)) + "px")
                .style("width", PixelConverter.toString(this.viewportScroll.width));
        }

        this.scrollContainer.attr("fill", "none");

        if (this.vertical) {
            this.setUpBulletsVertically(this.bulletBody, this.data, this.reverse);
        } else {
            this.setUpBulletsHorizontally(this.bulletBody, this.data, this.reverse);
        }

        this.behavior.renderSelection(this.interactivityService.hasSelection());
        this.events.renderingFinished(options);
    }

    private clearviewport() {
        this.labelGraphicsContext.selectAll("text").remove();
        this.bulletGraphicsContext.selectAll("rect").remove();
        this.bulletGraphicsContext.selectAll("text").remove();
        this.bulletGraphicsContext.selectAll("axis").remove();
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
            : barData.x + (this.settings.labels.show ? this.settings.labels.maxWidth : 0) + BulletChart.XMarginHorizontalLeft)
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

    private drawAxesLabels(model: BulletChartModel, reversed: boolean) {
      const bars: BarData[] = model.bars;
      const barSelection: BulletSelection<any> = this.labelGraphicsContext
        .selectAll("text")
        .data(bars, (d: BarData) => d.key);
      // Draw axes
      if (model.settings.axis.axis) {
        // Using var instead of let since you can"t pass let parameters to functions inside loops.
        // needs to be changed to let when typescript 1.8 comes out.
        for (let idx: number = 0; idx < bars.length; idx++) {
          const axisColor = model.settings.axis.axisColor;
          const bar: BarData = bars[idx];
          const barGroup = this.bulletGraphicsContext.append("g");

          barGroup
            .append("g")
            .attr("transform", () => {
              const xLocation: number = this.calculateLabelWidth(
                bar,
                null,
                reversed
              );
              const yLocation: number = bar.y + BulletChart.BulletSize;

              return "translate(" + xLocation + "," + yLocation + ")";
            })
            .classed("axis", true)
            .call(bar.xAxisProperties.axis)
            .style("fill", axisColor)
            .style(
              "font-size",
              PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt)
            )
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
      }
      // Draw Labels
      if (model.settings.labels.show) {
        barSelection
          .enter()
          .append("text")
          .merge(barSelection)
          .classed("title", true)
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
          .attr("fill", model.settings.labels.labelColor)
          .attr(
            "font-size",
            PixelConverter.fromPoint(model.settings.labels.fontSize)
          )
          .text((d: BarData) => d.categoryLabel)
          .append("title")
          .text((d: BarData) => d.categoryLabel);
      }
    }

    private setUpBulletsHorizontally(bulletBody: BulletSelection<any>, model: BulletChartModel, reveresed: boolean): void {
        const bars: BarData[] = model.bars;
        const rects: BarRect[] = model.barRects;
        const valueRects: BarValueRect[] = model.valueRects;
        const targetValues: TargetValue[] = model.targetValues;
        const barSelection: BulletSelection<any> = this.labelGraphicsContext.selectAll("text").data(bars, (d: BarData) => d.key);
        const rectSelection: BulletSelection<any> = this.bulletGraphicsContext.selectAll("rect.range").data(rects, (d: BarRect) => d.key);
        // Draw bullets
        const bullets: BulletSelection<any> = rectSelection
            .enter()
            .append("rect")
            .merge(rectSelection);

        bullets
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y)))
            .attr("width", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.end - d.start)))
            .attr("height", BulletChart.BulletSize)
            .classed("range", true)
            .style("fill", (d: BarRect) => d.fillColor)
            .style("stroke", (d: BarRect) => d.strokeColor)
            .style("stroke-width", (d: BarRect) => d.strokeWidth);

        rectSelection.exit();

        // Draw value rects
        const valueSelection: BulletSelection<any> = this.bulletGraphicsContext.selectAll("rect.value").data(valueRects, (d: BarValueRect) => d.key);
        const valueSelectionMerged = valueSelection
            .enter()
            .append("rect")
            .merge(valueSelection);

        valueSelectionMerged
            .attr("x", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))))
            .attr("y", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y + BulletChart.bulletMiddlePosition)))
            .attr("width", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, d.end - d.start)))
            .attr("height", BulletChart.BulletSize * BulletChart.value1 / BulletChart.value4)
            .classed("value", true)
            .style("fill", (d: BarValueRect) => d.fillColor)
            .style("stroke", (d: BarValueRect) => d.strokeColor)
            .style("stroke-width", (d: BarValueRect) => d.strokeWidth);

        valueSelection.exit();
        // Draw markers
        this.drawFirstTargets(targetValues,
            (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value,
            (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value,
            (d: TargetValue) => bars[d.barIndex].y + BulletChart.MarkerMarginHorizontal,
            (d: TargetValue) => bars[d.barIndex].y + BulletChart.MarkerMarginHorizontalEnd);

        this.drawSecondTargets(
            targetValues,
            (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value2,
            (d: TargetValue) => bars[d.barIndex].y + BulletChart.BulletSize / BulletChart.value2);

        this.drawAxesLabels(model, reveresed);
        const measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
            BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
            BulletChart.MaxMeasureUnitWidth);
        // Draw measure label
        if (model.settings.axis.measureUnits) {
            barSelection
                .enter()
                .append("text")
                .merge(barSelection)
                .attr("x", ((d: BarData) => {
                    if (reveresed)
                        return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength + BulletChart.SubtitleMargin;
                    return d.x - BulletChart.SubtitleMargin;
                }))
                .attr("y", ((d: BarData) => d.y + this.data.labelHeight / BulletChart.value2 + BulletChart.value12 + BulletChart.BulletSize / 2))
                .attr("fill", model.settings.axis.unitsColor)
                .attr("font-size", PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt))
                .text(measureUnitsText);
        }
        if (this.interactivityService) {
            const targetCollection = this.data.barRects.concat(this.data.valueRects);
            const behaviorOptions: BulletBehaviorOptions = {
                rects: bullets,
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
        barSelection.exit();
        this.tooltipServiceWrapper.addTooltip(
            valueSelectionMerged,
            (data: TooltipEnabledDataPoint) => data.tooltipInfo);
        this.tooltipServiceWrapper.addTooltip(
          bullets,
          (data: TooltipEnabledDataPoint) => data.tooltipInfo
        );
    }
    private static value3: number = 3;
    private static value10: number = 10;

    private drawAxes(model: BulletChartModel, reveresed: boolean, labelsStartPos) {
      const bars: BarData[] = model.bars;
      const barSelection: BulletSelection<any> = this.labelGraphicsContext
        .selectAll("text")
        .data(bars, (d: BarData) => d.key);
      if (model.settings.axis.axis) {
        const axisColor = model.settings.axis.axisColor;

        // Using var instead of let since you can't pass let parameters to functions inside loops.
        // needs to be changed to let when typescript 1.8 comes out.
        for (let idx = 0; idx < bars.length; idx++) {
          const bar = bars[idx];
          this.bulletGraphicsContext
            .append("g")
            .attr("transform", () => {
              const xLocation: number = bar.x;
              const yLocation: number = this.calculateLabelHeight(
                bar,
                null,
                reveresed
              );
              return "translate(" + xLocation + "," + yLocation + ")";
            })
            .classed("axis", true)
            .call(bar.xAxisProperties.axis)
            .style("fill", axisColor)
            .style(
              "font-size",
              PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt)
            )
            .selectAll("line")
            .style("stroke", axisColor);
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
      if (model.settings.labels.show) {
        barSelection
          .enter()
          .append("text")
          .merge(barSelection)
          .classed("title", true)
          .attr("x", (d: BarData) => d.x)
          .attr("y", () => {
            return labelsStartPos;
          })
          .attr("fill", model.settings.labels.labelColor)
          .attr(
            "font-size",
            PixelConverter.fromPoint(model.settings.labels.fontSize)
          )
          .text((d: BarData) => d.categoryLabel)
          .append("title")
          .text((d: BarData) => d.categoryLabel);
      }
    }

    private setUpBulletsVertically(bulletBody: BulletSelection<any>, model: BulletChartModel, reveresed: boolean) {
        const bars: BarData[] = model.bars;
        const rects: BarRect[] = model.barRects;
        const valueRects: BarValueRect[] = model.valueRects;
        const targetValues: TargetValue[] = model.targetValues;
        const barSelection: BulletSelection<any> = this.labelGraphicsContext.selectAll("text").data(bars, (d: BarData) => d.key);
        const rectSelection: BulletSelection<any> = this.bulletGraphicsContext.selectAll("rect.range").data(rects, (d: BarRect) => d.key);

        // Draw bullets
        const bullets: BulletSelection<any> = rectSelection
            .enter()
            .append("rect")
            .merge(rectSelection);

        bullets
            .attr("x", ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x)))
            .attr("y", ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))))
            .attr("height", ((d: BarRect) => Math.max(BulletChart.zeroValue, d.start - d.end)))
            .attr("width", BulletChart.BulletSize)
            .classed("range", true)
            .style("fill", (d: BarRect) => d.fillColor)
            .attr("stroke", (d: BarRect) => d.strokeColor)
            .attr("stroke-width", (d: BarRect) => d.strokeWidth);

        rectSelection.exit();

        // Draw value rects
        const valueSelection: BulletSelection<any> = this.bulletGraphicsContext.selectAll("rect.value").data(valueRects, (d: BarValueRect) => d.key);
        const valueSelectionMerged = valueSelection
            .enter()
            .append("rect")
            .merge(valueSelection)
            .attr("x", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x + BulletChart.bulletMiddlePosition)))
            .attr("y", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))))
            .attr("height", ((d: BarValueRect) => Math.max(BulletChart.zeroValue, d.start - d.end)))
            .attr("width", BulletChart.BulletSize * BulletChart.value1 / BulletChart.value4)
            .classed("value", true)
            .style("fill", (d: BarValueRect) => d.fillColor)
            .attr("stroke", (d: BarRect) => d.strokeColor)
            .attr("stroke-width", (d: BarRect) => d.strokeWidth);

        valueSelection.exit();
        // Draw markers
        this.drawFirstTargets(
            targetValues,
            (d: TargetValue) => bars[d.barIndex].x + BulletChart.MarkerMarginVertical,
            (d: TargetValue) => bars[d.barIndex].x + (BulletChart.MarkerMarginVertical * BulletChart.value3),
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value,
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value);
        this.drawSecondTargets(targetValues,
            (d: TargetValue) => bars[d.barIndex].x + BulletChart.BulletSize / BulletChart.value2,
            (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value2);
        const labelsStartPos: number =
            BulletChart.YMarginVertical +
            (reveresed ? model.viewportLength + 15 : 0) +
            this.data.labelHeightTop;
        this.drawAxes(model, reveresed, labelsStartPos);
        const measureUnitsText: string = TextMeasurementService.getTailoredTextOrDefault(
            BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
            BulletChart.MaxMeasureUnitWidth);
        // Draw measure label
        if (model.settings.axis.measureUnits) {
            barSelection
                .enter()
                .append("text")
                .merge(barSelection)
                .attr("x", ((d: BarData) => d.x + BulletChart.BulletSize))
                .attr("y", () => {
                    return labelsStartPos + BulletChart.SubtitleMargin + BulletChart.value12;
                })
                .attr("fill", model.settings.axis.unitsColor)
                .attr("font-size", PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt))
                .text(measureUnitsText);
        }
        if (this.interactivityService) {
            const targetCollection: BarRect[] = this.data.barRects.concat(this.data.valueRects);
            const behaviorOptions: BulletBehaviorOptions = {
                rects: bullets,
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
        barSelection.exit();
        this.tooltipServiceWrapper.addTooltip(
            valueSelectionMerged,
            (tooltipEvent: TooltipEventArgs<TooltipEnabledDataPoint>) => tooltipEvent.data.tooltipInfo);
        this.tooltipServiceWrapper.addTooltip(
            bullets,
            (tooltipEvent: TooltipEventArgs<TooltipEnabledDataPoint>) => tooltipEvent.data.tooltipInfo);
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
        let enterSelection = selection.enter();
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
    public destroy() { }
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


