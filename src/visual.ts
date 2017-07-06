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

module powerbi.extensibility.visual {
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;
    import IEnumType = powerbi.IEnumType;
    import IVisual = powerbi.extensibility.IVisual;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import IVisualHostServices = powerbi.extensibility.visual.IVisualHost;
    import IViewport = powerbi.IViewport;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import DataView = powerbi.DataView;
    import DataViewObjects = powerbi.DataViewObjects;
    import TextMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import VisualInitOptions = powerbi.extensibility.visual.VisualConstructorOptions;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import IEnumMember = powerbi.IEnumMember;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import DataViewObjectPropertyTypeDescriptor = powerbi.DataViewPropertyValue;
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import IAxisProperties = powerbi.extensibility.utils.chart.axis.IAxisProperties;
    import IMargin = powerbi.extensibility.utils.chart.axis.IMargin;
    import converterHelper = powerbi.extensibility.utils.dataview.converterHelper;
    import SelectionIdBuilder = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import axisScale = powerbi.extensibility.utils.chart.axis.scale;
    import tooltip = powerbi.extensibility.utils.tooltip;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;

    export class BulletChart implements IVisual {
        private static ScrollBarSize: number = 22;
        private static SpaceRequiredForBarVertically: number = 100;
        private static XMarginHorizontalLeft: number = 20;
        private static XMarginHorizontalRight: number = 55;
        private static YMarginHorizontal: number = 20;
        private static XMarginVertical: number = 70;
        private static YMarginVertical: number = 10;
        private static BulletSize: number = 25;
        private static DefaultSubtitleFontSizeInPt: number = 9;
        private static BarMargin: number = 10;
        private static MaxLabelWidth: number = 80;
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
        private clearCatcher: d3.Selection<any>;
        private bulletBody: d3.Selection<any>;
        private scrollContainer: d3.Selection<any>;
        private labelGraphicsContext: d3.Selection<any>;
        private bulletGraphicsContext: d3.Selection<any>;
        private data: BulletChartModel;
        private behavior: BulletWebBehavior;
        private interactivityService: IInteractivityService;
        private hostService: IVisualHost;
        public layout: VisualLayout;

        private tooltipServiceWrapper: ITooltipServiceWrapper;

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
        private static categoryLabelModifier: number = 1.25;
        private static value2: number = 2;
        private static value15: number = 15;
        private static value20: number = 20;
        private static value28: number = 28;
        private static value60: number = 60;
        private static emptyString: string = "";
        // Convert a DataView into a view model
        public static converter(dataView: DataView, options: VisualUpdateOptions, visualHost: IVisualHost): BulletChartModel {
            let categorical: BulletChartColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns> = BulletChartColumns.getCategoricalColumns(dataView);

            if (!categorical || !categorical.Value || !categorical.Value[0]) {
                return null;
            }

            let categoricalValues: BulletChartColumns<any[]> = BulletChartColumns.getCategoricalValues(dataView);
            let settings: BulletchartSettings = BulletchartSettings.parse<BulletchartSettings>(dataView);

            BulletChart.limitProperties(settings);

            let bulletModel: BulletChartModel = <BulletChartModel>{
                settings: settings,
                bars: [],
                barRects: [],
                valueRects: [],
                targetValues: [],
                viewportLength: BulletChart.zeroValue
            };

            let verticalOrientation: boolean = settings.orientation.orientation === BulletChartOrientation.VerticalBottom
                || settings.orientation.orientation === BulletChartOrientation.VerticalTop;

            let reversedOrientation: boolean = settings.orientation.orientation === BulletChartOrientation.HorizontalRight
                || settings.orientation.orientation === BulletChartOrientation.VerticalBottom;

            bulletModel.labelHeight = (settings.labels.show || BulletChart.zeroValue) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize));
            bulletModel.labelHeightTop = (settings.labels.show || BulletChart.zeroValue) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize)) / BulletChart.value1dot4;
            bulletModel.spaceRequiredForBarHorizontally = Math.max(settings.axis.axis ? BulletChart.value60 : BulletChart.value28, bulletModel.labelHeight * BulletChart.categoryLabelModifier);
            bulletModel.viewportLength = Math.max(0, (verticalOrientation
                ? (options.viewport.height - bulletModel.labelHeightTop - BulletChart.SubtitleMargin - BulletChart.value20 - BulletChart.YMarginVertical * BulletChart.value2)
                : (options.viewport.width - (settings.labels.show ? settings.labels.maxWidth : 0) - BulletChart.XMarginHorizontalLeft - BulletChart.XMarginHorizontalRight)) - BulletChart.ScrollBarSize);
            bulletModel.hasHighlights = !!(categorical.Value[0].values.length > BulletChart.zeroValue && categorical.Value[0].highlights);

            let valueFormatString: string = valueFormatter.getFormatStringByColumn(categorical.Value[0].source, true);
            let categoryFormatString: string = categorical.Category ? valueFormatter.getFormatStringByColumn(categorical.Category.source, true) : BulletChart.emptyString;
            let length: number = categoricalValues.Value.length;
            for (let idx = 0; idx < length; idx++) {
                let category: string = BulletChart.emptyString;
                if (categorical.Category) {
                    category = valueFormatter.format(categoricalValues.Category[idx], categoryFormatString);
                    category = TextMeasurementService.getTailoredTextOrDefault(
                        BulletChart.getTextProperties(category, settings.labels.fontSize),
                        verticalOrientation ? this.MaxLabelWidth : settings.labels.maxWidth);
                }

                let toolTipItems: BulletChartTooltipItem[] = [],
                    value = categoricalValues.Value[idx] || BulletChart.zeroValue;

                toolTipItems.push({
                    value: value,
                    metadata: categorical.Value[0]
                });

                let targetValue: number = categoricalValues.TargetValue
                    ? categoricalValues.TargetValue[idx]
                    : settings.values.targetValue;

                if (_.isNumber(targetValue)) {
                    toolTipItems.push({
                        value: targetValue,
                        metadata: categorical.TargetValue && categorical.TargetValue[0]
                    });
                }

                let targetValue2: number = categoricalValues.TargetValue2
                    ? categoricalValues.TargetValue2[idx]
                    : settings.values.targetValue2;

                if (_.isNumber(targetValue2)) {
                    toolTipItems.push({
                        value: targetValue2,
                        metadata: categorical.TargetValue2 && categorical.TargetValue2[0]
                    });
                }

                let getRangeValue = (cValues: number[], sValue: number) => cValues ? cValues[idx] :
                    (_.isNumber(targetValue) && _.isNumber(sValue) ? (sValue * targetValue / 100) : null);

                let minimum: number = getRangeValue(categoricalValues.Minimum, settings.values.minimumPercent);
                let needsImprovement: number = getRangeValue(categoricalValues.NeedsImprovement, settings.values.needsImprovementPercent);
                let satisfactory: number = getRangeValue(categoricalValues.Satisfactory, settings.values.satisfactoryPercent);
                let good: number = getRangeValue(categoricalValues.Good, settings.values.goodPercent);
                let veryGood: number = getRangeValue(categoricalValues.VeryGood, settings.values.veryGoodPercent);
                let maximum: number = getRangeValue(categoricalValues.Maximum, settings.values.maximumPercent);

                let anyRangeIsDefined: boolean = [needsImprovement, satisfactory, good, veryGood].some(_.isNumber);

                minimum = _.isNumber(minimum) ? Math.max(minimum, BulletChart.zeroValue) : BulletChart.zeroValue;
                needsImprovement = _.isNumber(needsImprovement) ? Math.max(minimum, needsImprovement) : needsImprovement;
                satisfactory = _.isNumber(satisfactory) ? Math.max(satisfactory, needsImprovement) : satisfactory;
                good = _.isNumber(good) ? Math.max(good, satisfactory) : good;
                veryGood = _.isNumber(veryGood) ? Math.max(veryGood, good) : veryGood;

                let minMaxValue = _.max([minimum, needsImprovement, satisfactory, good, veryGood, value, targetValue, targetValue2].filter(_.isNumber));
                maximum = _.isNumber(maximum) ? Math.max(maximum, minMaxValue) : minMaxValue;

                veryGood = _.isNumber(veryGood) ? veryGood : maximum;
                good = _.isNumber(good) ? good : veryGood;
                satisfactory = _.isNumber(satisfactory) ? satisfactory : good;
                needsImprovement = _.isNumber(needsImprovement) ? needsImprovement : satisfactory;

                let scale: d3.scale.Linear<number, number> = (d3.scale.linear()
                    .clamp(true)
                    .domain([minimum, maximum])
                    .range(verticalOrientation ? [bulletModel.viewportLength, 0] : [0, bulletModel.viewportLength]));

                let firstScale: number = scale(minimum);
                let secondScale: number = scale(needsImprovement);
                let thirdScale: number = scale(satisfactory);
                let fourthScale: number = scale(good);
                let fifthScale: number = scale(veryGood);
                let lastScale: number = scale(maximum);
                let valueScale: number = scale(value);
                let firstColor: string = settings.colors.minColor,
                    secondColor: string = settings.colors.needsImprovementColor,
                    thirdColor: string = settings.colors.satisfactoryColor,
                    fourthColor: string = settings.colors.goodColor,
                    lastColor: string = settings.colors.veryGoodColor;

                let highlight: any = categorical.Value[0].highlights && categorical.Value[0].highlights[idx] !== null;
                let selectionIdBuilder = () => categorical.Category
                    ? visualHost.createSelectionIdBuilder().withCategory(categorical.Category, idx)
                    : visualHost.createSelectionIdBuilder();

                if (anyRangeIsDefined) {
                    BulletChart.addItemToBarArray(
                        bulletModel.barRects,
                        idx,
                        firstScale,
                        secondScale,
                        firstColor,
                        null,
                        toolTipItems,
                        selectionIdBuilder(),
                        highlight);

                    BulletChart.addItemToBarArray(
                        bulletModel.barRects,
                        idx,
                        secondScale,
                        thirdScale,
                        secondColor,
                        null,
                        toolTipItems,
                        selectionIdBuilder(),
                        highlight);

                    BulletChart.addItemToBarArray(
                        bulletModel.barRects,
                        idx,
                        thirdScale,
                        fourthScale,
                        thirdColor,
                        null,
                        toolTipItems,
                        selectionIdBuilder(),
                        highlight);

                    BulletChart.addItemToBarArray(
                        bulletModel.barRects,
                        idx,
                        fourthScale,
                        fifthScale,
                        fourthColor,
                        null,
                        toolTipItems,
                        selectionIdBuilder(),
                        highlight);

                    BulletChart.addItemToBarArray(
                        bulletModel.barRects,
                        idx,
                        fifthScale,
                        lastScale,
                        lastColor,
                        null,
                        toolTipItems,
                        selectionIdBuilder(),
                        highlight);
                }

                BulletChart.addItemToBarArray(
                    bulletModel.valueRects,
                    idx,
                    firstScale,
                    valueScale,
                    settings.colors.bulletColor,
                    null,
                    toolTipItems,
                    selectionIdBuilder(),
                    highlight);

                // markerValue
                bulletModel.targetValues.push({
                    barIndex: idx,
                    value: targetValue && scale(targetValue),
                    fill: settings.colors.bulletColor,
                    key: selectionIdBuilder()
                        .withMeasure(scale(targetValue || BulletChart.zeroValue).toString())
                        .createSelectionId().getKey(),
                    value2: targetValue2 && scale(targetValue2),
                });

                let xAxisProperties: IAxisProperties = null;
                if (settings.axis.axis) {
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
                        forcedTickCount: BulletChart.getFitTicksCount(bulletModel.viewportLength),
                        disableNiceOnlyForScale: true
                    });
                }

                let bar1: BarData = {
                    scale: scale,
                    barIndex: idx,
                    categoryLabel: category,
                    x: verticalOrientation
                        ? (BulletChart.XMarginVertical + BulletChart.SpaceRequiredForBarVertically * idx)
                        : (reversedOrientation ? BulletChart.XMarginHorizontalRight : BulletChart.XMarginHorizontalLeft),
                    y: verticalOrientation
                        ? (BulletChart.YMarginVertical)
                        : (BulletChart.YMarginHorizontal + bulletModel.spaceRequiredForBarHorizontally * idx),
                    xAxisProperties: xAxisProperties,
                    key: selectionIdBuilder().createSelectionId().getKey(),
                };

                bulletModel.bars.push(bar1);
            }

            return bulletModel;
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

        private static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn): BulletchartSettings {
            return BulletchartSettings.parse<BulletchartSettings>(dataView);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return BulletchartSettings.enumerateObjectInstances(
                this.settings || BulletchartSettings.getDefault(),
                options);
        }

        public static getFitTicksCount(viewportLength: number): number {
            if (viewportLength < 35) {
                return 1;
            }  else if (viewportLength < 150) {
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
            fill: string,
            formatString: DataViewObjectPropertyIdentifier,
            tooltipInfo: BulletChartTooltipItem[],
            selectionIdBuilder: ISelectionIdBuilder,
            highlight: boolean): void {

            if (!isNaN(start) && !isNaN(end))
                collection.push({
                    barIndex: barIndex,
                    start: start,
                    end: end,
                    fill: fill,
                    tooltipInfo: BulletChart.createTooltipInfo(tooltipInfo),
                    selected: false,
                    identity: selectionIdBuilder.createSelectionId(),
                    key: (selectionIdBuilder.withMeasure(start + " " + end).createSelectionId() as powerbi.visuals.ISelectionId).getKey(),
                    highlight: highlight,
                });
        }

        public static createTooltipInfo(tooltipItems: BulletChartTooltipItem[]): VisualTooltipDataItem[] {
            const tooltipDataItems: VisualTooltipDataItem[] = [];

            tooltipItems.forEach((tooltipItem: BulletChartTooltipItem) => {
                if (tooltipItem && tooltipItem.metadata) {
                    let metadata: DataViewMetadataColumn = tooltipItem.metadata.source,
                        formatString: string = valueFormatter.getFormatStringByColumn(metadata);

                    tooltipDataItems.push({
                        displayName: metadata.displayName,
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
            this.tooltipServiceWrapper = tooltip.createTooltipServiceWrapper(
                options.host.tooltipService,
                options.element);

            this.layout = new VisualLayout(null, {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            });

            let body: d3.Selection<any> = d3.select(options.element);
            this.hostService = options.host;

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

            this.interactivityService = createInteractivityService(options.host);
        }
        public static oneString: string = "1";
        public update(options: VisualUpdateOptions) {

            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }
            let dataView: DataView = options.dataViews[0];
            this.layout.viewport = options.viewport;
            let data: BulletChartModel = BulletChart.converter(dataView, options, this.hostService);

            // TODO: Calculating the baseline delta of the text. needs to be removed once the TExtMeasurementService.estimateSVGTextBaselineDelta is available.
            this.ClearViewport();
            if (!data) {
                return;
            }

            this.data = data;

            this.baselineDelta = TextMeasurementHelper.estimateSvgTextBaselineDelta(BulletChart.getTextProperties(BulletChart.oneString, this.data.settings.labels.fontSize));

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.data.barRects);
            }

            this.bulletBody.style({
                "height": PixelConverter.toString(this.layout.viewportIn.height),
                "width": PixelConverter.toString(this.layout.viewportIn.width),
            });
            if (this.vertical) {
                this.scrollContainer.attr({
                    width: PixelConverter.toString(this.data.bars.length * BulletChart.SpaceRequiredForBarVertically + BulletChart.XMarginVertical),
                    height: PixelConverter.toString(this.viewportScroll.height)
                });
            }
            else {

                this.scrollContainer.attr({
                    height: (this.data.bars.length * (this.data.spaceRequiredForBarHorizontally || BulletChart.zeroValue) + BulletChart.YMarginHorizontal) + "px",
                    width: PixelConverter.toString(this.viewportScroll.width)
                });
            }

            this.scrollContainer.attr("fill", "none");

            if (this.vertical) {
                this.setUpBulletsVertically(this.bulletBody, this.data, this.reverse);
            } else {
                this.setUpBulletsHorizontally(this.bulletBody, this.data, this.reverse);
            }

            this.behavior.renderSelection(this.interactivityService.hasSelection());
        }

        private ClearViewport() {
            this.labelGraphicsContext.selectAll("text").remove();
            this.bulletGraphicsContext.selectAll("rect").remove();
            this.bulletGraphicsContext.selectAll("text").remove();
            this.bulletGraphicsContext.selectAll("axis").remove();
            this.bulletGraphicsContext.selectAll("path").remove();
            this.bulletGraphicsContext.selectAll("line").remove();
            this.bulletGraphicsContext.selectAll("tick").remove();
            this.bulletGraphicsContext.selectAll("g").remove();
            this.scrollContainer.attr({ width: PixelConverter.toString(0), height: PixelConverter.toString(0) });
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
        private static value12: number = 12;
        private static bulletMiddlePosition: number = (1 / BulletChart.value8 + 1 / BulletChart.value4) * BulletChart.BulletSize;
        private setUpBulletsHorizontally(bulletBody: d3.Selection<any>, model: BulletChartModel, reveresed: boolean): void {
            let bars: BarData[] = model.bars;
            let rects: BarRect[] = model.barRects;
            let valueRects: BarValueRect[] = model.valueRects;
            let targetValues: TargetValue[] = model.targetValues;
            let barSelection: any = this.labelGraphicsContext.selectAll("text").data(bars, (d: BarData) => d.key);
            let rectSelection: any = this.bulletGraphicsContext.selectAll("rect.range").data(rects, (d: BarRect) => d.key);
            // Draw bullets
            let bullets: d3.Selection<any> = rectSelection.enter().append("rect").attr({
                "x": ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))),
                "y": ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y)),
                "width": ((d: BarRect) => Math.max(BulletChart.zeroValue, d.end - d.start)),
                "height": BulletChart.BulletSize,
            }).classed("range", true).style({
                "fill": (d: BarRect) => d.fill
            });

            rectSelection.exit();

            // Draw value rects
            let valueSelection: any = this.bulletGraphicsContext.selectAll("rect.value").data(valueRects, (d: BarValueRect) => d.key);
            valueSelection.enter().append("rect").attr({
                "x": ((d: BarValueRect) => Math.max(BulletChart.zeroValue, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))),
                "y": ((d: BarValueRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].y + BulletChart.bulletMiddlePosition)),
                "width": ((d: BarValueRect) => Math.max(BulletChart.zeroValue, d.end - d.start)),
                "height": BulletChart.BulletSize * BulletChart.value1 / BulletChart.value4,
            }).classed("value", true).style({
                "fill": (d: BarValueRect) => d.fill
            });

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

            // Draw axes
            if (model.settings.axis.axis) {
                // Using var instead of let since you can"t pass let parameters to functions inside loops.
                // needs to be changed to let when typescript 1.8 comes out.
                for (let idx: number = 0; idx < bars.length; idx++) {
                    let bar: BarData = bars[idx],
                        barGroup = this.bulletGraphicsContext.append("g");

                    barGroup.append("g").attr({
                        "transform": () => {
                            let xLocation: number = this.calculateLabelWidth(bar, null, reveresed);
                            let yLocation: number = bar.y + BulletChart.BulletSize;

                            return "translate(" + xLocation + "," + yLocation + ")";
                        },
                    }).classed("axis", true).call(bar.xAxisProperties.axis).style({
                        "fill": model.settings.axis.axisColor,
                        "font-size": PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt)
                    }).selectAll("line").style({
                        "stroke": model.settings.axis.axisColor,
                    });

                    barGroup.selectAll(".tick text").call(
                        AxisHelper.LabelLayoutStrategy.clip,
                        bar.xAxisProperties.xLabelMaxWidth,
                        TextMeasurementService.svgEllipsis);
                }
            }

            // Draw Labels
            if (model.settings.labels.show) {
                barSelection.enter().append("text").classed("title", true).attr({
                    "x": ((d: BarData) => {
                        if (reveresed)
                            return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength;
                        return d.x;
                    }),
                    "y": ((d: BarData) => d.y + this.baselineDelta + BulletChart.BulletSize / 2),
                    "fill": model.settings.labels.labelColor,
                    "font-size": PixelConverter.fromPoint(model.settings.labels.fontSize),
                }).text((d: BarData) => d.categoryLabel);
            }

            let measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
                BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
                BulletChart.MaxMeasureUnitWidth);

            // Draw measure label
            if (model.settings.axis.measureUnits) {
                barSelection.enter().append("text").attr({
                    "x": ((d: BarData) => {
                        if (reveresed)
                            return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength + BulletChart.SubtitleMargin;
                        return d.x - BulletChart.SubtitleMargin;
                    }),
                    "y": ((d: BarData) => d.y + this.data.labelHeight / BulletChart.value2 + BulletChart.value12),
                    "fill": model.settings.axis.unitsColor,
                    "font-size": PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt)
                }).text(measureUnitsText);
            }

            if (this.interactivityService) {
                let behaviorOptions: BulletBehaviorOptions = {
                    rects: bullets,
                    valueRects: valueSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                    bulletChartSettings: this.data.settings,
                    hasHighlights: this.data.hasHighlights,
                };

                let targetCollection = this.data.barRects.concat(this.data.valueRects);
                this.interactivityService.bind(targetCollection, this.behavior, behaviorOptions);
            }

            barSelection.exit();

            this.tooltipServiceWrapper.addTooltip(
                valueSelection,
                (tooltipEvent: TooltipEventArgs<BarValueRect>) => tooltipEvent.data.tooltipInfo);

            this.tooltipServiceWrapper.addTooltip(
                rectSelection,
                (tooltipEvent: TooltipEventArgs<BarRect>) => tooltipEvent.data.tooltipInfo);
        }
        private static value3: number = 3;
        private static value10: number = 10;
        private setUpBulletsVertically(bulletBody: d3.Selection<any>, model: BulletChartModel, reveresed: boolean) {
            let bars: BarData[] = model.bars;
            let rects: BarRect[] = model.barRects;
            let valueRects: BarValueRect[] = model.valueRects;
            let targetValues: TargetValue[] = model.targetValues;
            let barSelection: any = this.labelGraphicsContext.selectAll("text").data(bars, (d: BarData) => d.key);
            let rectSelection: any = this.bulletGraphicsContext.selectAll("rect.range").data(rects, (d: BarRect) => d.key);

            // Draw bullets
            let bullets: any = rectSelection.enter().append("rect").attr({
                "x": ((d: BarRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x)),
                "y": ((d: BarRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))),
                "height": ((d: BarRect) => Math.max(BulletChart.zeroValue, d.start - d.end)),
                "width": BulletChart.BulletSize,
            }).classed("range", true).style({
                "fill": (d: BarRect) => d.fill
            });

            rectSelection.exit();

            // Draw value rects
            let valueSelection: any = this.bulletGraphicsContext.selectAll("rect.value").data(valueRects, (d: BarValueRect) => d.key);
            valueSelection.enter().append("rect").attr({
                "x": ((d: BarValueRect) => Math.max(BulletChart.zeroValue, bars[d.barIndex].x + BulletChart.bulletMiddlePosition)),
                "y": ((d: BarValueRect) => Math.max(BulletChart.zeroValue, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))),
                "height": ((d: BarValueRect) => Math.max(BulletChart.zeroValue, d.start - d.end)),
                "width": BulletChart.BulletSize * BulletChart.value1 / BulletChart.value4,
            }).classed("value", true).style({
                "fill": (d: BarValueRect) => d.fill
            });

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

            // // Draw axes
            if (model.settings.axis.axis) {

                // Using var instead of let since you can't pass let parameters to functions inside loops.
                // needs to be changed to let when typescript 1.8 comes out.
                for (let idx = 0; idx < bars.length; idx++) {
                    let bar = bars[idx];
                    this.bulletGraphicsContext.append("g").attr({
                        "transform": () => {
                            let xLocation: number = bar.x;
                            let yLocation: number = this.calculateLabelHeight(bar, null, reveresed);
                            return "translate(" + xLocation + "," + yLocation + ")";
                        },
                    }).classed("axis", true).call(bar.xAxisProperties.axis).style({
                        "fill": model.settings.axis.axisColor,
                        "font-size": PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt),
                    }).selectAll("line").style({
                        "stroke": model.settings.axis.axisColor,
                    });
                }

                this.bulletGraphicsContext.selectAll("g.axis > .tick text").call(
                    AxisHelper.LabelLayoutStrategy.clip,
                    BulletChart.XMarginVertical - BulletChart.value10,
                    TextMeasurementService.svgEllipsis);
            }

            let labelsStartPos: number = BulletChart.YMarginVertical + (reveresed ? model.viewportLength + 15 : 0) + this.data.labelHeightTop;

            // Draw Labels
            if (model.settings.labels.show) {
                barSelection.enter().append("text").classed("title", true).attr({
                    "x": ((d: BarData) => d.x),
                    "y": ((d: BarData) => {
                        return labelsStartPos;
                    }),
                    "fill": model.settings.labels.labelColor,
                    "font-size": PixelConverter.fromPoint(model.settings.labels.fontSize),
                }).text((d: BarData) => d.categoryLabel);
            }

            let measureUnitsText: string = TextMeasurementService.getTailoredTextOrDefault(
                BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
                BulletChart.MaxMeasureUnitWidth);

            // Draw measure label
            if (model.settings.axis.measureUnits) {
                barSelection.enter().append("text").attr({
                    "x": ((d: BarData) => d.x + BulletChart.BulletSize),
                    "y": ((d: BarData) => {
                        return labelsStartPos + BulletChart.SubtitleMargin + BulletChart.value12;
                    }),
                    "fill": model.settings.axis.unitsColor,
                    "font-size": PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt)
                }).text(measureUnitsText);
            }

            if (this.interactivityService) {
                let behaviorOptions: BulletBehaviorOptions = {
                    rects: bullets,
                    valueRects: valueSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                    bulletChartSettings: this.data.settings,
                    hasHighlights: this.data.hasHighlights,
                };

                let targetCollection: BarRect[] = this.data.barRects.concat(this.data.valueRects);
                this.interactivityService.bind(targetCollection, this.behavior, behaviorOptions);
            }

            barSelection.exit();

            this.tooltipServiceWrapper.addTooltip(
                valueSelection,
                (tooltipEvent: TooltipEventArgs<BarValueRect>) => tooltipEvent.data.tooltipInfo);

            this.tooltipServiceWrapper.addTooltip(
                rectSelection,
                (tooltipEvent: TooltipEventArgs<BarRect>) => tooltipEvent.data.tooltipInfo);
        }

        private drawFirstTargets(
            targetValues: TargetValue[],
            x1: (d: TargetValue) => number,
            x2: (d: TargetValue) => number,
            y1: (d: TargetValue) => number,
            y2: (d: TargetValue) => number) {

            let selection = this.bulletGraphicsContext
                .selectAll("line.target")
                .data(targetValues.filter(x => _.isNumber(x.value)));

            selection.enter().append("line").attr({
                "x1": x1,
                "x2": x2,
                "y1": y1,
                "y2": y2,
            }).style({
                "stroke": ((d: TargetValue) => d.fill),
                "stroke-width": 2,
            }).classed("target", true);

            selection.exit().remove();
        }

        private drawSecondTargets(
            targetValues: TargetValue[],
            getX: (d: TargetValue) => number,
            getY: (d: TargetValue) => number): void {

            let selection = this.bulletGraphicsContext
                .selectAll("line.target2")
                .data(targetValues.filter(x => _.isNumber(x.value2)));
            let enterSelection = selection.enter();

            let targetStyle = {
                "stroke": ((d: TargetValue) => d.fill),
                "stroke-width": 2
            };

            enterSelection.append("line").attr({
                "x1": ((d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize),
                "y1": ((d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize),
                "x2": ((d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize),
                "y2": ((d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize),
            }).style({
                "stroke": ((d: TargetValue) => d.fill),
                "stroke-width": 2
            }).classed("target2", true);

            enterSelection.append("line").attr({
                "x1": ((d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize),
                "y1": ((d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize),
                "x2": ((d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize),
                "y2": ((d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize),
            }).style({
                "stroke": ((d: TargetValue) => d.fill),
                "stroke-width": 2
            }).classed("target2", true);

            selection.exit().remove();
        }

        /*About to remove your visual, do clean up here */
        public destroy() { }
    }

    // TODO: This module should be removed once TextMeasruementService exports the "estimateSvgTextBaselineDelta" function.
    export module TextMeasurementHelper {

        interface CanvasContext {
            font: string;
            measureText(text: string): { width: number };
        }

        interface CanvasElement extends HTMLElement {
            getContext(name: string);
        }

        let spanElement: JQuery;
        let svgTextElement: d3.Selection<any>;
        let canvasCtx: CanvasContext;

        export function estimateSvgTextBaselineDelta(textProperties: TextProperties): number {
            let rect = estimateSvgTextRect(textProperties);
            return rect.y + rect.height;
        }

        function ensureDOM(): void {
            if (spanElement)
                return;

            d3.select("body").append("span");
            // The style hides the svg element from the canvas, preventing canvas from scrolling down to show svg black square.
            svgTextElement = d3.select(d3.select("body")[0][0])
                .append("svg")
                .style({
                    "height": "0px",
                    "width": "0px",
                    "position": "absolute"
                })
                .append("text");

            canvasCtx = (<CanvasElement>document.createElement("canvas")).getContext("2d");
        }

        function measureSvgTextRect(textProperties: TextProperties): SVGRect {

            ensureDOM();

            svgTextElement.style(null);
            svgTextElement
                .text(textProperties.text)
                .attr({
                    "visibility": "hidden",
                    "font-family": textProperties.fontFamily,
                    "font-size": textProperties.fontSize,
                    "font-weight": textProperties.fontWeight,
                    "font-style": textProperties.fontStyle,
                    "white-space": textProperties.whiteSpace || "nowrap"
                });

            // We're expecting the browser to give a synchronous measurement here
            // We're using SVGTextElement because it works across all browsers
            return (svgTextElement.node() as any).getBBox();
        }

        function estimateSvgTextRect(textProperties: TextProperties): SVGRect {
            let estimatedTextProperties: TextProperties = {
                fontFamily: textProperties.fontFamily,
                fontSize: textProperties.fontSize,
                text: "M",
            };

            let rect = measureSvgTextRect(estimatedTextProperties);

            return rect;
        }
    }

    export interface BulletBehaviorOptions {
        rects: d3.Selection<any>;
        valueRects: d3.Selection<any>;
        clearCatcher: d3.Selection<any>;
        interactivityService: IInteractivityService;
        bulletChartSettings: BulletchartSettings;
        hasHighlights: boolean;
    }

    export class BulletWebBehavior implements IInteractiveBehavior {
        private static DimmedOpacity: number = 0.4;
        private static DefaultOpacity: number = 1.0;

        private static getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
            if ((hasPartialHighlights && !highlight) || (hasSelection && !selected))
                return BulletWebBehavior.DimmedOpacity;
            return BulletWebBehavior.DefaultOpacity;
        }

        private options: BulletBehaviorOptions;

        public bindEvents(options: BulletBehaviorOptions, selectionHandler: ISelectionHandler) {
            this.options = options;
            let clearCatcher = options.clearCatcher;

            options.valueRects.on("click", (d: BarValueRect) => {
                selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
            });

            options.rects.on("click", (d: BarRect) => {
                selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
            });

            clearCatcher.on("click", () => {
                selectionHandler.handleClearSelection();
            });
        }

        public renderSelection(hasSelection: boolean) {
            let options = this.options;
            let hasHighlights = options.hasHighlights;

            options.valueRects.style("opacity", (d: BarValueRect) =>
                BulletWebBehavior.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));

            options.rects.style("opacity", (d: BarRect) =>
                BulletWebBehavior.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));
        }
    }
}
