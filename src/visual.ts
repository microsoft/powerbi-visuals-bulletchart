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
    // jsCommon
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi
    import IEnumType = powerbi.IEnumType;
    import IVisual = powerbi.extensibility.IVisual;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    //import VisualCapabilities = powerbi.VisualCapabilities;
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

    // powerbi.data
    import DataViewObjectPropertyTypeDescriptor = powerbi.DataViewPropertyValue;

    // powerbi.visuals
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

    // powerbi.extensibility.utils.tooltip
    import tooltip = powerbi.extensibility.utils.tooltip;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;


    export class BulletChart implements IVisual {
        private static ScrollBarSize: number = 22;
        private static SpaceRequiredForBarVertically: number = 100;
        private static XMarginHorizontalLeft: number = 20;
        private static XMarginHorizontalRight: number = 55;
        private static YMarginHorizontal: number = 30;
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
        private static MarkerMarginHorizontal: number = BulletChart.BulletSize / 3;
        private static MarkerMarginVertical: number = BulletChart.BulletSize / 4;

        private static FontFamily: string = "Segoe UI";
        private baselineDelta: number = 0;

        //Variables
        private clearCatcher: d3.Selection<any>;
        private bulletBody: d3.Selection<any>;
        private scrollContainer: d3.Selection<any>;
        private labelGraphicsContext: d3.Selection<any>;
        private bulletGraphicsContext: d3.Selection<any>;
        private data: BulletChartModel;
        private behavior: BulletWebBehavior;
        private interactivityService: IInteractivityService;
        private hostService: IVisualHost;
        private layout: VisualLayout;

        private tooltipServiceWrapper: ITooltipServiceWrapper;

        private get reverse(): boolean {
            switch (this.settings && this.settings.orientation.orientation) {
                case BulletChartOrientation.HorizontalRight:
                case BulletChartOrientation.VerticalBottom:
                    return true;
                default:
                    return false;
            }
        }

        private get vertical(): boolean {
            switch (this.settings && this.settings.orientation.orientation) {
                case BulletChartOrientation.VerticalTop:
                case BulletChartOrientation.VerticalBottom:
                    return true;
                default:
                    return false;
            }
        }

        private get viewportScroll(): IViewport {
            return <IViewport>{
                width: Math.max(0, this.layout.viewportIn.width - BulletChart.ScrollBarSize),
                height: Math.max(0, this.layout.viewportIn.height - BulletChart.ScrollBarSize)
            };
        }

        private static getTextProperties(text: string, fontSize: number): TextProperties {
            return <TextProperties>{
                fontFamily: BulletChart.FontFamily,
                fontSize: PixelConverter.fromPoint(fontSize),
                text: text,
            };
        }

        // Convert a DataView into a view model
        public static converter(dataView: DataView, options: VisualUpdateOptions, visualHost: IVisualHost): BulletChartModel {
            let categorical = BulletChartColumns.getCategoricalColumns(dataView);

            if (!categorical || !categorical.Value || !categorical.Value[0]) {
                return null;
            }

            let categoricalValues = BulletChartColumns.getCategoricalValues(dataView);
            let settings = BulletChart.parseSettings(dataView, categorical.Category.source);

            let bulletModel: BulletChartModel = <BulletChartModel>{
                settings: settings,
                bars: [],
                barRects: [],
                valueRects: [],
                targetValues: [],
                viewportLength: 0
            };

            let verticalOrientation: boolean = settings.orientation.orientation === BulletChartOrientation.VerticalBottom
                || settings.orientation.orientation === BulletChartOrientation.VerticalTop;

            let reversedOrientation: boolean = settings.orientation.orientation === BulletChartOrientation.HorizontalRight
                || settings.orientation.orientation === BulletChartOrientation.VerticalBottom;

            bulletModel.labelHeight = (settings.labels.show || 0) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize));
            bulletModel.labelHeightTop = (settings.labels.show || 0) && parseFloat(PixelConverter.fromPoint(settings.labels.fontSize)) / 1.4;
            bulletModel.spaceRequiredForBarHorizontally = Math.max(60, bulletModel.labelHeight + 20);
            bulletModel.viewportLength = Math.max(0, (verticalOrientation
                ? (options.viewport.height - bulletModel.labelHeightTop - BulletChart.SubtitleMargin - 20 - BulletChart.YMarginVertical * 2)
                : (options.viewport.width - BulletChart.MaxLabelWidth - BulletChart.XMarginHorizontalLeft - BulletChart.XMarginHorizontalRight)) - BulletChart.ScrollBarSize);
            bulletModel.hasHighlights = !!(categorical.Value[0].values.length > 0 && categorical.Value[0].highlights);

            let valueFormatString: string = valueFormatter.getFormatStringByColumn(categorical.Value[0].source, true)
            let categoryFormatString: string = valueFormatter.getFormatStringByColumn(categorical.Category.source, true);
            let length: number = categoricalValues.Value.length
            for (let idx = 0; idx < length; idx++) {
                let category: string = "";
                if (categorical.Category) {
                    category = valueFormatter.format(categoricalValues.Category[idx], categoryFormatString);
                    category = TextMeasurementService.getTailoredTextOrDefault(
                        BulletChart.getTextProperties(category, settings.labels.fontSize),
                        BulletChart.MaxLabelWidth);
                }

                let toolTipItems: BulletChartTooltipItem[] = [],
                    value = categoricalValues.Value[idx] || 0;

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

                minimum = _.isNumber(minimum) ? Math.max(minimum, 0) : 0;
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

                let scale = (d3.scale.linear()
                    .clamp(true)
                    .domain([minimum, maximum])
                    .range(verticalOrientation ? [bulletModel.viewportLength, 0] : [0, bulletModel.viewportLength]));

                let firstScale = scale(minimum);
                let secondScale = scale(needsImprovement);
                let thirdScale = scale(satisfactory);
                let fourthScale = scale(good);
                let fifthScale = scale(veryGood);
                let lastScale = scale(maximum);
                let valueScale = scale(value);
                //debugger;
                let firstColor = settings.colors.mincolor,
                    secondColor = settings.colors.needsImprovementcolor,
                    thirdColor = settings.colors.satisfactorycolor,
                    fourthColor = settings.colors.goodcolor,
                    lastColor = settings.colors.veryGoodcolor;

                let highlight = categorical.Value[0].highlights && categorical.Value[0].highlights[idx] !== null;
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
                    settings.colors.bulletcolor,
                    null,
                    toolTipItems,
                    selectionIdBuilder(),
                    highlight);

                // markerValue
                bulletModel.targetValues.push({
                    barIndex: idx,
                    value: targetValue && scale(targetValue),
                    fill: settings.colors.bulletcolor,
                    key: selectionIdBuilder()
                        .withMeasure(scale(targetValue || 0).toString())
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

        private get settings(): BulletchartSettings {
            return this.data && this.data.settings;
        }

        private static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn): BulletchartSettings {
            let settings: BulletchartSettings = BulletchartSettings.parse<BulletchartSettings>(dataView);

            //settings.labels.precision = Math.min(17, Math.max(0, settings.labels.precision));
            //settings.outerLine.thickness = Math.min(25, Math.max(1, settings.outerLine.thickness));

            //if (_.isEmpty(settings.legend.titleText)) {
            //    settings.legend.titleText = categorySource.displayName;
            //}

            return settings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return BulletchartSettings.enumerateObjectInstances(
                this.settings || BulletchartSettings.getDefault(),
                options);
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

        private static createTooltipInfo(toolTipItems: BulletChartTooltipItem[]): VisualTooltipDataItem[] {
            return toolTipItems.map((toolTipItems: BulletChartTooltipItem) => {
                let metadata: DataViewMetadataColumn = toolTipItems.metadata.source,
                    formatString: string = valueFormatter.getFormatStringByColumn(metadata);

                return {
                    displayName: metadata.displayName,
                    value: valueFormatter.format(toolTipItems.value, formatString)
                } as VisualTooltipDataItem;
            });
        }

        constructor(options: VisualConstructorOptions) {
            this.tooltipServiceWrapper = tooltip.createTooltipServiceWrapper(
                options.host.tooltipService,
                options.element);

            this.layout = new VisualLayout(null, {
                top: 10,
                right: 10,
                bottom: 15,
                left: 10
            });

            let body = d3.select(options.element);
            this.hostService = options.host;

            this.bulletBody = body
                .append('div')
                .classed('bulletChart', true)
                .attr("drag-resize-disabled", true);

            this.scrollContainer = this.bulletBody.append('svg')
                .classed('bullet-scroll-region', true);
            this.clearCatcher = appendClearCatcher(this.scrollContainer);

            this.labelGraphicsContext = this.scrollContainer.append('g');
            this.bulletGraphicsContext = this.scrollContainer.append('g');

            this.behavior = new BulletWebBehavior();

            this.interactivityService = createInteractivityService(options.host);
        }

        /* Called for data, size, formatting changes*/
        public update(options: VisualUpdateOptions) {

            if (!options.dataViews || !options.dataViews[0]) {
                return;
            }

            let dataView = options.dataViews[0];
            this.layout.viewport = options.viewport;
            let data = BulletChart.converter(dataView, options, this.hostService);

            //TODO: Calculating the baseline delta of the text. needs to be removed once the TExtMeasurementService.estimateSVGTextBaselineDelta is available.
            this.ClearViewport();
            if (!data) {
                return;
            }

            this.data = data;

            this.baselineDelta = TextMeasurementHelper.estimateSvgTextBaselineDelta(BulletChart.getTextProperties("1", this.data.settings.labels.fontSize));

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.data.barRects);
            }

            this.bulletBody.style({
                'height': this.layout.viewportIn.height + 'px',
                'width': this.layout.viewportIn.width + 'px',
            });
            if (this.vertical) {
                this.scrollContainer.attr({
                    width: (this.data.bars.length * BulletChart.SpaceRequiredForBarVertically + BulletChart.XMarginVertical) + 'px',
                    height: this.viewportScroll.height + 'px'
                });
            }
            else {
                this.scrollContainer.attr({
                    height: (this.data.bars.length * (this.data.spaceRequiredForBarHorizontally || 0)) + 'px',
                    width: this.viewportScroll.width + 'px'
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
            this.bulletGraphicsContext.selectAll('axis').remove();
            this.bulletGraphicsContext.selectAll('path').remove();
            this.bulletGraphicsContext.selectAll('line').remove();
            this.bulletGraphicsContext.selectAll('tick').remove();
            this.bulletGraphicsContext.selectAll('g').remove();
            this.scrollContainer.attr({ width: 0 + 'px', height: 0 + 'px' });
        }

        public onClearSelection(): void {
            if (this.interactivityService)
                this.interactivityService.clearSelection();
        }

        private calculateLabelWidth(barData: BarData, bar?: BarRect, reversed?: boolean) {
            return (reversed
                ? BulletChart.XMarginHorizontalRight
                : barData.x + BulletChart.MaxLabelWidth + BulletChart.XMarginHorizontalLeft)
                + (bar ? bar.start : 0);
        }

        private calculateLabelHeight(barData: BarData, bar?: BarRect, reversed?: boolean) {
            return BulletChart.YMarginVertical + (reversed ? 5 :
                barData.y + this.data.labelHeightTop + BulletChart.BarMargin + BulletChart.SubtitleMargin)
                + (bar ? bar.end : 0);
        }

        private setUpBulletsHorizontally(bulletBody: d3.Selection<any>, model: BulletChartModel, reveresed: boolean) {
            let bars = model.bars;
            let rects = model.barRects;
            let valueRects = model.valueRects;
            let targetValues = model.targetValues;
            let barSelection = this.labelGraphicsContext.selectAll('text').data(bars, (d: BarData) => d.key);
            let rectSelection = this.bulletGraphicsContext.selectAll('rect.range').data(rects, (d: BarRect) => d.key);

            // Draw bullets
            let bullets = rectSelection.enter().append('rect').attr({
                'x': ((d: BarRect) => Math.max(0, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))),
                'y': ((d: BarRect) => Math.max(0, bars[d.barIndex].y - BulletChart.BulletSize / 2)),
                'width': ((d: BarRect) => Math.max(0, d.end - d.start)),
                'height': BulletChart.BulletSize,
            }).classed('range', true).style({
                'fill': (d: BarRect) => d.fill
            });

            rectSelection.exit();

            // Draw value rects
            let valueSelection = this.bulletGraphicsContext.selectAll('rect.value').data(valueRects, (d: BarValueRect) => d.key);
            valueSelection.enter().append('rect').attr({
                'x': ((d: BarValueRect) => Math.max(0, this.calculateLabelWidth(bars[d.barIndex], d, reveresed))),
                'y': ((d: BarValueRect) => Math.max(0, bars[d.barIndex].y - BulletChart.BulletSize / 8)),
                'width': ((d: BarValueRect) => Math.max(0, d.end - d.start)),
                'height': BulletChart.BulletSize * 1 / 4,
            }).classed('value', true).style({
                'fill': (d: BarValueRect) => d.fill
            });

            valueSelection.exit();
            // Draw markers
            this.drawFirstTargets(targetValues,
                (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value,
                (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value,
                (d: TargetValue) => bars[d.barIndex].y - BulletChart.MarkerMarginHorizontal,
                (d: TargetValue) => bars[d.barIndex].y + BulletChart.MarkerMarginHorizontal);

            this.drawSecondTargets(
                targetValues,
                (d: TargetValue) => this.calculateLabelWidth(bars[d.barIndex], null, reveresed) + d.value2,
                (d: TargetValue) => bars[d.barIndex].y);

            // Draw axes
            if (model.settings.axis.axis) {
                // Using var instead of let since you can't pass let parameters to functions inside loops.
                // needs to be changed to let when typescript 1.8 comes out.
                for (let idx: number = 0; idx < bars.length; idx++) {
                    var bar: BarData = bars[idx];
                    let barGroup = this.bulletGraphicsContext.append("g");

                    barGroup.append("g").attr({
                        'transform': () => {
                            let xLocation = this.calculateLabelWidth(bar, null, reveresed);
                            let yLocation = bar.y + BulletChart.BulletSize / 2;

                            return 'translate(' + xLocation + ',' + yLocation + ')';
                        },
                    }).classed("axis", true).call(bar.xAxisProperties.axis).style({
                        'fill': model.settings.axis.axisColor,
                        'font-size': PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt)
                    }).selectAll('line').style({
                        'stroke': model.settings.axis.axisColor,
                    });

                    barGroup.selectAll(".tick text").call(
                        AxisHelper.LabelLayoutStrategy.clip,
                        bar.xAxisProperties.xLabelMaxWidth,
                        TextMeasurementService.svgEllipsis);
                }
            }

            // Draw Labels
            if (model.settings.labels.show) {
                barSelection.enter().append('text').classed("title", true).attr({
                    'x': ((d: BarData) => {
                        if (reveresed)
                            return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength;
                        return d.x;
                    }),
                    'y': ((d: BarData) => d.y + this.baselineDelta),
                    'fill': model.settings.labels.labelColor,
                    'font-size': PixelConverter.fromPoint(model.settings.labels.fontSize),
                }).text((d: BarData) => d.categoryLabel);
            }

            let measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
                BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
                BulletChart.MaxMeasureUnitWidth);

            // Draw measure label
            if (model.settings.axis.measureUnits) {
                barSelection.enter().append('text').attr({
                    'x': ((d: BarData) => {
                        if (reveresed)
                            return BulletChart.XMarginHorizontalLeft + BulletChart.XMarginHorizontalRight + model.viewportLength + BulletChart.SubtitleMargin;
                        return d.x - BulletChart.SubtitleMargin;
                    }),
                    'y': ((d: BarData) => d.y + this.data.labelHeight / 2 + 12),
                    'fill': model.settings.axis.unitsColor,
                    'font-size': PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt)
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

        private setUpBulletsVertically(bulletBody: d3.Selection<any>, model: BulletChartModel, reveresed: boolean) {
            let bars = model.bars;
            let rects = model.barRects;
            let valueRects = model.valueRects;
            let targetValues = model.targetValues;
            let barSelection = this.labelGraphicsContext.selectAll('text').data(bars, (d: BarData) => d.key);
            let rectSelection = this.bulletGraphicsContext.selectAll('rect.range').data(rects, (d: BarRect) => d.key);

            // Draw bullets
            let bullets = rectSelection.enter().append('rect').attr({
                'x': ((d: BarRect) => Math.max(0, bars[d.barIndex].x)),
                'y': ((d: BarRect) => Math.max(0, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))),
                'height': ((d: BarRect) => Math.max(0, d.start - d.end)),
                'width': BulletChart.BulletSize,
            }).classed('range', true).style({
                'fill': (d: BarRect) => d.fill
            });

            rectSelection.exit();

            // Draw value rects
            let valueSelection = this.bulletGraphicsContext.selectAll('rect.value').data(valueRects, (d: BarValueRect) => d.key);
            valueSelection.enter().append('rect').attr({
                'x': ((d: BarValueRect) => Math.max(0, bars[d.barIndex].x + BulletChart.BulletSize / 3)),
                'y': ((d: BarValueRect) => Math.max(0, this.calculateLabelHeight(bars[d.barIndex], d, reveresed))),
                'height': ((d: BarValueRect) => Math.max(0, d.start - d.end)),
                'width': BulletChart.BulletSize * 1 / 4,
            }).classed('value', true).style({
                'fill': (d: BarValueRect) => d.fill
            });

            valueSelection.exit();

            // Draw markers
            this.drawFirstTargets(
                targetValues,
                (d: TargetValue) => bars[d.barIndex].x + BulletChart.MarkerMarginVertical,
                (d: TargetValue) => bars[d.barIndex].x + (BulletChart.MarkerMarginVertical * 3),
                (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value,
                (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value);

            this.drawSecondTargets(targetValues,
                (d: TargetValue) => bars[d.barIndex].x + BulletChart.BulletSize / 3 + BulletChart.BulletSize / 8,
                (d: TargetValue) => this.calculateLabelHeight(bars[d.barIndex], null, reveresed) + d.value2);

            // // Draw axes
            if (model.settings.axis.axis) {

                // Using var instead of let since you can't pass let parameters to functions inside loops.
                // needs to be changed to let when typescript 1.8 comes out.
                for (var idx = 0; idx < bars.length; idx++) {
                    var bar = bars[idx];
                    this.bulletGraphicsContext.append("g").attr({
                        'transform': () => {
                            let xLocation = bar.x;
                            let yLocation = this.calculateLabelHeight(bar, null, reveresed);
                            // let yLocation = bar.y + BulletChart.BulletSize / 2;
                            return 'translate(' + xLocation + ',' + yLocation + ')';
                        },
                    }).classed("axis", true).call(bar.xAxisProperties.axis).style({
                        'fill': model.settings.axis.axisColor,
                        'font-size': PixelConverter.fromPoint(BulletChart.AxisFontSizeInPt),
                    }).selectAll('line').style({
                        'stroke': model.settings.axis.axisColor,
                    });
                }

                this.bulletGraphicsContext.selectAll("g.axis > .tick text").call(
                    AxisHelper.LabelLayoutStrategy.clip,
                    BulletChart.XMarginVertical - 10,
                    TextMeasurementService.svgEllipsis);
            }

            let labelsStartPos = BulletChart.YMarginVertical + (reveresed ? model.viewportLength + 15 : 0) + this.data.labelHeightTop;

            // Draw Labels
            if (model.settings.labels.show) {
                barSelection.enter().append('text').classed("title", true).attr({
                    'x': ((d: BarData) => d.x),
                    'y': ((d: BarData) => {
                        return labelsStartPos;
                    }),
                    'fill': model.settings.labels.labelColor,
                    'font-size': PixelConverter.fromPoint(model.settings.labels.fontSize),
                }).text((d: BarData) => d.categoryLabel);
            }

            let measureUnitsText = TextMeasurementService.getTailoredTextOrDefault(
                BulletChart.getTextProperties(model.settings.axis.measureUnits, BulletChart.DefaultSubtitleFontSizeInPt),
                BulletChart.MaxMeasureUnitWidth);

            // Draw measure label
            if (model.settings.axis.measureUnits) {
                barSelection.enter().append('text').attr({
                    'x': ((d: BarData) => d.x + BulletChart.BulletSize),
                    'y': ((d: BarData) => {
                        return labelsStartPos + BulletChart.SubtitleMargin + 12;
                    }),
                    'fill': model.settings.axis.unitsColor,
                    'font-size': PixelConverter.fromPoint(BulletChart.DefaultSubtitleFontSizeInPt)
                }).text(measureUnitsText);
            }

            if (this.interactivityService) {
                let behaviorOptions: BulletBehaviorOptions = {
                    rects: bullets,
                    valueRects: valueSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                    bulletChartSettings: this.data.settings,
                    hasHighlights: false,
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

        private drawFirstTargets(
            targetValues: TargetValue[],
            x1: (d: TargetValue) => number,
            x2: (d: TargetValue) => number,
            y1: (d: TargetValue) => number,
            y2: (d: TargetValue) => number) {

            let selection = this.bulletGraphicsContext
                .selectAll('line.target')
                .data(targetValues.filter(x => _.isNumber(x.value)));

            selection.enter().append('line').attr({
                'x1': x1,
                'x2': x2,
                'y1': y1,
                'y2': y2,
            }).style({
                'stroke': ((d: TargetValue) => d.fill),
                'stroke-width': 2,
            }).classed("target", true);

            selection.exit().remove();
        }

        private drawSecondTargets(
            targetValues: TargetValue[],
            getX: (d: TargetValue) => number,
            getY: (d: TargetValue) => number): void {

            let selection = this.bulletGraphicsContext
                .selectAll('line.target2')
                .data(targetValues.filter(x => _.isNumber(x.value2)));
            let enterSelection = selection.enter();

            let targetStyle = {
                'stroke': ((d: TargetValue) => d.fill),
                'stroke-width': 2
            };

            enterSelection.append('line').attr({
                'x1': ((d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize),
                'y1': ((d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize),
                'x2': ((d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize),
                'y2': ((d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize),
            }).style({
                'stroke': ((d: TargetValue) => d.fill),
                'stroke-width': 2
            }).classed("target2", true);

            enterSelection.append('line').attr({
                'x1': ((d: TargetValue) => getX(d) + BulletChart.SecondTargetLineSize),
                'y1': ((d: TargetValue) => getY(d) - BulletChart.SecondTargetLineSize),
                'x2': ((d: TargetValue) => getX(d) - BulletChart.SecondTargetLineSize),
                'y2': ((d: TargetValue) => getY(d) + BulletChart.SecondTargetLineSize),
            }).style({
                'stroke': ((d: TargetValue) => d.fill),
                'stroke-width': 2
            }).classed("target2", true);

            selection.exit().remove();
        }

        /*About to remove your visual, do clean up here */
        public destroy() { }
    }

    //TODO: This module should be removed once TextMeasruementService exports the "estimateSvgTextBaselineDelta" function.
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

            spanElement = $('<span/>');
            $('body').append(spanElement);
            //The style hides the svg element from the canvas, preventing canvas from scrolling down to show svg black square.
            svgTextElement = d3.select($('body').get(0))
                .append('svg')
                .style({
                    'height': '0px',
                    'width': '0px',
                    'position': 'absolute'
                })
                .append('text');
            canvasCtx = (<CanvasElement>$('<canvas/>').get(0)).getContext("2d");
        }

        function measureSvgTextRect(textProperties: TextProperties): SVGRect {

            ensureDOM();

            svgTextElement.style(null);
            svgTextElement
                .text(textProperties.text)
                .attr({
                    'visibility': 'hidden',
                    'font-family': textProperties.fontFamily,
                    'font-size': textProperties.fontSize,
                    'font-weight': textProperties.fontWeight,
                    'font-style': textProperties.fontStyle,
                    'white-space': textProperties.whiteSpace || 'nowrap'
                });

            // We're expecting the browser to give a synchronous measurement here
            // We're using SVGTextElement because it works across all browsers 
            return (svgTextElement.node() as any).getBBox();
        }

        function estimateSvgTextRect(textProperties: TextProperties): SVGRect {
            // debug.assertValue(textProperties, 'textProperties');

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

            options.valueRects.on('click', (d: BarValueRect) => {
                selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
            });

            options.rects.on('click', (d: BarRect) => {
                selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
            });

            clearCatcher.on('click', () => {
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
