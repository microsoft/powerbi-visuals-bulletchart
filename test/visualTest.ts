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
/// <reference path="_references.ts" />
module powerbi.extensibility.visual.test {
    // powerbi.extensibility.visual
    import BulletChartBuilder = powerbi.extensibility.visual.test.BulletChartBuilder;
    import BulletChartOrientation = powerbi.extensibility.visual.BulletChart1443347686880.BulletChartOrientation;
    import BulletChartData = powerbi.extensibility.visual.test.BulletChartData;

    // powerbi.extensibility.utils.test
    import helpers = powerbi.extensibility.utils.test.helpers;
    import colorHelper = powerbi.extensibility.utils.test.helpers.color;
    import RgbColor = powerbi.extensibility.utils.test.helpers.color.RgbColor;
    import MockISelectionId = powerbi.extensibility.utils.test.mocks.MockISelectionId;
    import createSelectionId = powerbi.extensibility.utils.test.mocks.createSelectionId;

    export function roundTo(value: number | string, round: number): number {
        value = _.isNumber(value) ? value : parseFloat(value);
        return _.isNumber(value) ? parseFloat((<number>value).toFixed(round)) : <any>value;
    }

    export function convertAnySizeToPixel(size: string, round?: number): number {
        let result: number;
        switch (_.takeRight(size, 2).join("").toLowerCase()) {
            case "pt": result = powerbi.extensibility.utils.type.PixelConverter.fromPointToPixel(parseFloat(size)); break;
            case "px": result = parseFloat(size); break;
        }

        return _.isNumber(round) ? roundTo(result, round) : result;
    }

    export function assertSizeMatch(actual: string, expected: string, invert?: boolean): boolean {
        let matchers = expect(convertAnySizeToPixel(actual, 0));
        if (invert) {
            matchers = matchers.not;
        }

        return matchers.toBe(convertAnySizeToPixel(expected, 0));
    }

    describe("BulletChart", () => {
        let visualBuilder: BulletChartBuilder,
            defaultDataViewBuilder: BulletChartData,
            dataView: DataView,
            previousCreateSelectionId: any;

        beforeEach(() => {
            let selectionIdIndex: number = 0;

            visualBuilder = new BulletChartBuilder(1000, 500);
            defaultDataViewBuilder = new BulletChartData();
            dataView = defaultDataViewBuilder.getDataView();

            previousCreateSelectionId = createSelectionId;

            powerbi.extensibility.utils.test.mocks.createSelectionId = () => { // TODO: It's temporary solution in order to add keys. We'll consider any other way to inject dependencies.
                return new MockISelectionId((selectionIdIndex++).toString());
            };
        });

        afterEach(() => {
            powerbi.extensibility.utils.test.mocks.createSelectionId = previousCreateSelectionId;
        });

        describe("DOM tests", () => {
            it("svg element created", () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });

            it("update", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.mainElement.children("g").first().children("text").length)
                        .toBe(dataView.categorical.categories[0].values.length);
                    expect(visualBuilder.element.find('.bulletChart').css('height')).toBe(`${visualBuilder.viewport.height}px`);
                    expect(visualBuilder.element.find('.bulletChart').css('width')).toBe(`${visualBuilder.viewport.width}px`);

                    done();
                });
            });

            it("update with illegal values", (done) => {
                defaultDataViewBuilder.valuesValue = [20000, 420837, -3235, -3134, null, 0, 4, 5];
                dataView = defaultDataViewBuilder.getDataView();

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.element.find('.rect').length).toBe(0);
                    done();
                });
            });

            it("if visual shouldn't be rendered bottom scrollbar shouldn't be visible", () => {
                dataView = defaultDataViewBuilder.getDataView([BulletChartData.ColumnCategory]);
                visualBuilder.update(dataView);
                expect(visualBuilder.mainElement[0].getBoundingClientRect().width).toBe(0);
            });

            it("only defined ranges should be visible", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    BulletChartData.ColumnCategory,
                    BulletChartData.ColumnValue,
                    BulletChartData.ColumnTargetValue]);

                dataView.metadata.objects = {
                    values: {
                        targetValue: undefined,
                        targetValue2: undefined,
                        minimumPercent: 0,
                        needsImprovementPercent: 25,
                        satisfactoryPercent: null,
                        goodPercent: 100,
                        veryGoodPercent: 150,
                        maximumPercent: 200
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let valuesLength = dataView.categorical.categories[0].values.length,
                        rangeRects = visualBuilder.rangeRects.filter((i, e) => parseFloat($(e).attr('width')) > 0),
                        settings = visualBuilder.getSettings();

                    let badRange = rangeRects.filter((i, element: Element) => {
                        return doColorsEqual($(element).css('fill'), settings.colors.mincolor);
                    });

                    let needsImprovementRange = rangeRects.filter((i, element: Element) => {
                        return doColorsEqual($(element).css('fill'), settings.colors.needsImprovementcolor);
                    });

                    let satisfactoryRange = rangeRects.filter((i, element: Element) => {
                        return doColorsEqual($(element).css('fill'), settings.colors.satisfactorycolor);
                    });

                    let goodRange = rangeRects.filter((i, element: Element) => {
                        return doColorsEqual($(element).css('fill'), settings.colors.goodcolor);
                    });

                    let veryGoodRange = rangeRects.filter((i, element: Element) => {
                        return doColorsEqual($(element).css('fill'), settings.colors.veryGoodcolor);
                    });

                    expect(badRange.length).toEqual(valuesLength);
                    expect(needsImprovementRange.length).toEqual(valuesLength);
                    expect(satisfactoryRange.length).toEqual(0);
                    expect(goodRange.length).toEqual(valuesLength);
                    expect(veryGoodRange.length).toEqual(valuesLength);

                    done();
                });
            });

            it("x axis labels should be tailored", (done) => {
                dataView = defaultDataViewBuilder.getDataView([
                    BulletChartData.ColumnCategory,
                    BulletChartData.ColumnValue,
                    BulletChartData.ColumnTargetValue],
                    (source) => {
                        switch (source.displayName) {
                            case BulletChartData.ColumnValue:
                                source.format = "0.00 %;-0.00 %;0.00 %";
                                break;
                        }
                    });

                dataView.metadata.objects = {
                    values: {
                        satisfactoryPercent: 1e+250
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    let ticks = visualBuilder.axis.first().children("g.tick"),
                        ticksLengthSum = _.sumBy(
                            ticks.toArray(),
                            (e: Element) => e.getBoundingClientRect().width);

                    expect(ticksLengthSum).toBeLessThan(visualBuilder.viewport.width);

                    done();
                });
            });

            it("multi-selection test", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const grouped = visualBuilder.rangeRectsGrouped;

                let firstBar = grouped[0].first();
                let secondBar = grouped[1].first();
                let thirdBar = grouped[2].first();

                helpers.clickElement(firstBar);
                helpers.clickElement(secondBar, true);

                expect(parseFloat(firstBar.css("opacity"))).toBe(1);
                expect(parseFloat(secondBar.css("opacity"))).toBe(1);
                expect(parseFloat(thirdBar.css("opacity"))).toBeLessThan(1);
            });
        });

        describe("Format settings test", () => {
            describe("Category labels", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        labels: {
                            show: true
                        }
                    };
                });

                it("show", () => {
                    dataView.metadata.objects = {
                        labels: {
                            show: false
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.categoryLabels).not.toBeInDOM();
                });

                it("font size", () => {
                    let fontSize = 25;

                    (dataView.metadata.objects as any).labels.fontSize = fontSize;

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.categoryLabels.toArray().map($).forEach(e =>
                        assertSizeMatch(e.attr('font-size'), fontSize + "pt"));
                });
            });

            describe("Orientation", () => {
                it("orientation", () => {
                    dataView.metadata.objects = {
                        orientation: {
                            orientation: BulletChartOrientation.HorizontalLeft
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.categoryLabels.toArray().map($).forEach(e =>
                        expect(parseFloat(e.attr("x"))).toBeLessThan(visualBuilder.viewport.width / 2));

                    (dataView.metadata.objects as any).orientation.orientation = BulletChartOrientation.HorizontalRight;
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.categoryLabels.toArray().map($).forEach(e =>
                        expect(parseFloat(e.attr("x"))).toBeGreaterThan(visualBuilder.viewport.width / 2));

                    (dataView.metadata.objects as any).orientation.orientation = BulletChartOrientation.VerticalTop;
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.categoryLabels.toArray().map($).forEach(e =>
                        expect(parseFloat(e.attr("y"))).toBeLessThan(visualBuilder.viewport.height / 2));

                    (dataView.metadata.objects as any).orientation.orientation = BulletChartOrientation.VerticalBottom;
                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.categoryLabels.toArray().map($).forEach(e =>
                        expect(parseFloat(e.attr("y"))).toBeGreaterThan(visualBuilder.viewport.height / 2));
                });
            });

            describe("Colors", () => {
                it("minimum", () => {
                    let color = "#000000";

                    dataView.metadata.objects = {
                        colors: {
                            mincolor: colorHelper.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.rangeRectsGrouped.map(e => e.eq(0)).forEach(e =>
                        colorHelper.assertColorsMatch(e.css('fill'), color));
                });

                it("needs improvement", () => {
                    let color = "#111111";

                    dataView.metadata.objects = {
                        colors: {
                            needsImprovementcolor: colorHelper.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.rangeRectsGrouped.map(e => e.eq(1)).forEach(e =>
                        colorHelper.assertColorsMatch(e.css('fill'), color));
                });

                it("satisfactory", () => {
                    let color = "#222222";

                    dataView.metadata.objects = {
                        colors: {
                            satisfactorycolor: colorHelper.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.rangeRectsGrouped.map(e => e.eq(2)).forEach(e =>
                        colorHelper.assertColorsMatch(e.css('fill'), color));
                });

                it("good", () => {
                    let color = "#333333";

                    dataView.metadata.objects = {
                        colors: {
                            goodcolor: colorHelper.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.rangeRectsGrouped.map(e => e.eq(3)).forEach(e =>
                        colorHelper.assertColorsMatch(e.css('fill'), color));
                });

                it("very good", () => {
                    let color = "#444444";

                    dataView.metadata.objects = {
                        colors: {
                            veryGoodcolor: colorHelper.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.rangeRectsGrouped.map(e => e.eq(4)).forEach(e =>
                        colorHelper.assertColorsMatch(e.css('fill'), color));
                });

                it("bullet", () => {
                    let color = "#999999";

                    dataView.metadata.objects = {
                        colors: {
                            bulletcolor: colorHelper.getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    visualBuilder.valueRects.toArray().map($).forEach(e =>
                        colorHelper.assertColorsMatch(e.css('fill'), color));
                });
            });

            describe("Axis", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        labels: {
                            show: true
                        },
                        axis: {}
                    };
                });

                it("show", () => {
                    (dataView.metadata.objects as any).axis.axis = false;

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    expect(visualBuilder.element.find('.axis').length).toBe(0);
                });

                it("axis color", () => {
                    let color = "#333333";
                    (dataView.metadata.objects as any).axis.axisColor = colorHelper.getSolidColorStructuralObject(color);

                    visualBuilder.updateFlushAllD3Transitions(dataView);
                    expect(visualBuilder.element.find('.axis')).toBeDefined();
                    colorHelper.assertColorsMatch(visualBuilder.axis.css('fill'), color);
                    colorHelper.assertColorsMatch(visualBuilder.axis.find('line').css('stroke'), color);
                });

                it("measure units", () => {
                    let measureUnits = "azaza";
                    (dataView.metadata.objects as any).axis.measureUnits = measureUnits;


                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.measureUnits).toBeInDOM();
                    visualBuilder.measureUnits.toArray().map($).forEach(e =>
                        expect(e.text()).toBe(measureUnits));
                });

                it("units color", () => {
                    let color = "#333333";
                    (dataView.metadata.objects as any).axis.measureUnits = "azaza";
                    (dataView.metadata.objects as any).axis.unitsColor = colorHelper.getSolidColorStructuralObject(color);

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.measureUnits.toArray().map($).forEach(e =>
                        colorHelper.assertColorsMatch(e.attr('fill'), color));
                });
            });
        });
    });

    function doColorsEqual(firstColor: string, secondColor: string): boolean {
        const convertedFirstColor: RgbColor = colorHelper.parseColorString(firstColor),
            convertedSecondColor: RgbColor = colorHelper.parseColorString(secondColor);

        return convertedFirstColor.B === convertedSecondColor.B
            && convertedFirstColor.G === convertedSecondColor.G
            && convertedFirstColor.R === convertedSecondColor.R;
    }
}
