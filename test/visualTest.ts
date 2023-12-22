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

import powerbiVisualsApi from "powerbi-visuals-api";
import lodashSumby from "lodash.sumby";
import lodashIsnumber from "lodash.isnumber";
import lodashTakeright from "lodash.takeright";

import DataView = powerbiVisualsApi.DataView;

// powerbi.extensibility.visual
import { BulletChartBuilder } from "./BulletChartBuilder";
import { BulletChartData } from "./BulletChartData";

// powerbi.extensibility.utils.test
import { pixelConverter } from "powerbi-visuals-utils-typeutils";
import fromPointToPixel = pixelConverter.fromPointToPixel;
import {
  MockISelectionId,
  createSelectionId,
  clickElement,
  assertColorsMatch,
  getSolidColorStructuralObject,
  MockISelectionIdBuilder,
} from "powerbi-visuals-utils-testutils";

import { BulletChart as VisualClass } from "../src/visual";
import { BulletChartTooltipItem } from "../src/dataInterfaces";
import { isColorAppliedToElements, areColorsEqual } from "./helpers/helpers";
import {BulletChartOrientation} from "../src/BulletChartOrientation";
import {BulletChartSettingsModel} from "../src/BulletChartSettingsModel";

export function roundTo(value: number | string, round: number): number {
  value = lodashIsnumber(value) ? value : parseFloat(value);
  return lodashIsnumber(value)
    ? parseFloat((<number>value).toFixed(round))
    : <any>value;
}

export function convertAnySizeToPixel(size: string, round?: number): number {
  let result: number;
  switch (lodashTakeright(size, 2).join("").toLowerCase()) {
    case "pt":
      result = fromPointToPixel(parseFloat(size));
      break;
    case "px":
      result = parseFloat(size);
      break;
  }

  return lodashIsnumber(round) ? roundTo(result, round) : result;
}

export function assertSizeMatch(
  actual: string,
  expected: string,
  invert?: boolean
): void {
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
  let customMockISelectionIdBuilder;

  beforeEach(() => {
    let selectionIdIndex: number = 0;
    customMockISelectionIdBuilder = new MockISelectionIdBuilder();
    visualBuilder = new BulletChartBuilder(1000, 500);
    defaultDataViewBuilder = new BulletChartData();
    dataView = defaultDataViewBuilder.getDataView();

    previousCreateSelectionId = createSelectionId;
    customMockISelectionIdBuilder.createSelectionId = () => {
      return new MockISelectionId((selectionIdIndex++).toString());
    };
  });

  afterEach(() => {
    customMockISelectionIdBuilder.createSelectionId = previousCreateSelectionId;
  });

  describe("DOM tests", () => {
    it("svg element created", () => {
      expect(visualBuilder.mainElement).toBeInDOM;
    });

    it("update", (done) => {
      visualBuilder.updateRenderTimeout(dataView, () => {
        expect(
          visualBuilder.mainElement.querySelector("g").querySelectorAll("text")
            .length
        ).toBe(dataView.categorical.categories[0].values.length);

        expect(
          (<HTMLElement>visualBuilder.element.querySelector(".bulletChart"))
            .style["height"]
        ).toBe(`${visualBuilder.viewport.height}px`);

        expect(
          (<HTMLElement>visualBuilder.element.querySelector(".bulletChart"))
            .style["width"]
        ).toBe(`${visualBuilder.viewport.width}px`);

        done();
      });
    });

    it("update with illegal values", (done) => {
      defaultDataViewBuilder.valuesValue = [
        20000,
        420837,
        -3235,
        -3134,
        null,
        0,
        4,
        5,
      ];
      dataView = defaultDataViewBuilder.getDataView();

      visualBuilder.updateRenderTimeout(dataView, () => {
        expect(
          (<HTMLElement[]>(
            Array.from(visualBuilder.element.querySelectorAll(".rect"))
          )).length
        ).toBe(0);
        done();
      });
    });

    it("if visual shouldn't be rendered bottom scrollbar shouldn't be visible", () => {
      dataView = defaultDataViewBuilder.getDataView([
        BulletChartData.ColumnCategory,
      ]);
      visualBuilder.update(dataView);
      expect(visualBuilder.mainElement.getBoundingClientRect().width).toBe(0);
    });

    it("should be smaller gap between bullets if axis is not rendered", () => {
      visualBuilder.updateFlushAllD3Transitions(dataView);

      let rangeRects: any = Array.from(visualBuilder.rangeRects);
      let yArray: number[] = rangeRects.map((e: HTMLElement) => {
        return parseFloat(e.getAttribute("y"));
      });

      dataView.metadata.objects = {
        axis: {
          axis: false,
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);

      rangeRects = Array.from(visualBuilder.rangeRects);
      let yArrayWithNoAxis: number[] = rangeRects.map((e: HTMLElement) => {
        return parseFloat(e.getAttribute("y"));
      });

      expect(yArray[yArray.length - 1]).toBeGreaterThan(
        yArrayWithNoAxis[yArrayWithNoAxis.length - 1]
      );
    });

    it("only defined ranges should be visible", (done) => {
      dataView = defaultDataViewBuilder.getDataView([
        BulletChartData.ColumnCategory,
        BulletChartData.ColumnValue,
        BulletChartData.ColumnTargetValue,
      ]);

      dataView.metadata.objects = {
        values: {
          targetValue: undefined,
          targetValue2: undefined,
          minimumPercent: 0,
          needsImprovementPercent: 25,
          satisfactoryPercent: null,
          goodPercent: 100,
          veryGoodPercent: 150,
          maximumPercent: 200,
        },
      };

      visualBuilder.updateRenderTimeout(dataView, () => {
        let valuesLength: number =
            dataView.categorical.categories[0].values.length,
          rangeRects: any = Array.from(visualBuilder.rangeRects).filter(
            (e, i) => parseFloat(e.getAttribute("width")) > 0
          ),
          settings: BulletChartSettingsModel = visualBuilder.getSettings();

        let badRange: SVGElement[] = rangeRects.filter(
          (element: HTMLElement) => {
            return areColorsEqual(
              element.style["fill"],
              settings.colors.minColor.value.value
            );
          }
        );

        let needsImprovementRange: SVGElement[] = rangeRects.filter(
          (element: HTMLElement) => {
            return areColorsEqual(
              element.style["fill"],
              settings.colors.needsImprovementColor.value.value
            );
          }
        );

        let satisfactoryRange: SVGElement[] = rangeRects.filter(
          (element: HTMLElement) => {
            return areColorsEqual(
              element.style["fill"],
              settings.colors.satisfactoryColor.value.value
            );
          }
        );

        let goodRange: SVGElement[] = rangeRects.filter(
          (element: HTMLElement) => {
            return areColorsEqual(
              element.style["fill"],
              settings.colors.goodColor.value.value
            );
          }
        );

        let veryGoodRange: SVGElement[] = rangeRects.filter(
          (element: HTMLElement) => {
            return areColorsEqual(
              element.style["fill"],
              settings.colors.veryGoodColor.value.value
            );
          }
        );

        expect(badRange.length).toEqual(valuesLength);
        expect(needsImprovementRange.length).toEqual(valuesLength);
        expect(satisfactoryRange.length).toEqual(0);
        expect(goodRange.length).toEqual(valuesLength);
        expect(veryGoodRange.length).toEqual(valuesLength);

        done();
      });
    });

    it("x axis labels should be tailored", (done) => {
      dataView = defaultDataViewBuilder.getDataView(
        [
          BulletChartData.ColumnCategory,
          BulletChartData.ColumnValue,
          BulletChartData.ColumnTargetValue,
        ],
        (source) => {
          switch (source.displayName) {
            case BulletChartData.ColumnValue:
              source.format = "0.00 %;-0.00 %;0.00 %";
              break;
          }
        }
      );

      dataView.metadata.objects = {
        values: {
          satisfactoryPercent: 1e250,
        },
      };

      visualBuilder.updateRenderTimeout(dataView, () => {
        let ticks: HTMLElement[] = Array.from(
            visualBuilder.axis[0].querySelectorAll("g.tick")
          ),
          ticksLengthSum = lodashSumby(
            ticks,
            (e: Element) => e.getBoundingClientRect().width
          );

        expect(ticksLengthSum).toBeLessThan(visualBuilder.viewport.width);

        done();
      });
    });

    it("multi-selection test", () => {
      visualBuilder.updateFlushAllD3Transitions(dataView);

      let grouped: SVGElement[][] = visualBuilder.rangeRectsGrouped;

      let firstBar: HTMLElement = <HTMLElement>(<unknown>grouped[0][0]);
      let secondBar: HTMLElement = <HTMLElement>(<unknown>grouped[1][0]);
      let thirdBar: HTMLElement = <HTMLElement>(<unknown>grouped[2][0]);

      clickElement(firstBar);
      clickElement(secondBar, true);

      expect(firstBar.style["opacity"]).toBe("1");
      expect(secondBar.style["opacity"]).toBe("1");
      expect(parseFloat(thirdBar.style["opacity"])).toBeLessThan(1);
    });
  });

  describe("Format settings test", () => {
    describe("Category labels", () => {
      beforeEach(() => {
        dataView.metadata.objects = {
          labels: {
            show: true,
          },
        };
      });

      it("show", () => {
        dataView.metadata.objects = {
          labels: {
            show: false,
          },
        };

        visualBuilder.updateFlushAllD3Transitions(dataView);

        expect(visualBuilder.categoryLabels).not.toBeInDOM;
      });

      it("font size", () => {
        let fontSize: number = 25;

        dataView.metadata.objects.labels.fontSize = fontSize;

        visualBuilder.updateFlushAllD3Transitions(dataView);
        Array.from(visualBuilder.categoryLabels).forEach((e) =>
          assertSizeMatch(e.getAttribute("font-size"), fontSize + "pt")
        );
      });
    });
  });

  describe("Orientation", () => {
    it("orientation", () => {
      dataView.metadata.objects = {
        orientation: {
          orientation: BulletChartOrientation.HorizontalLeft,
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      Array.from(visualBuilder.categoryLabels).forEach((e) =>
        expect(parseFloat(e.getAttribute("x"))).toBeLessThan(
          visualBuilder.viewport.width / 2
        )
      );

      dataView.metadata.objects.orientation.orientation =
        BulletChartOrientation.HorizontalRight;
      visualBuilder.updateFlushAllD3Transitions(dataView);
      Array.from(visualBuilder.categoryLabels).forEach((e) =>
        expect(parseFloat(e.getAttribute("x"))).toBeGreaterThan(
          visualBuilder.viewport.width / 2
        )
      );

      dataView.metadata.objects.orientation.orientation =
        BulletChartOrientation.VerticalTop;
      visualBuilder.updateFlushAllD3Transitions(dataView);
      Array.from(visualBuilder.categoryLabels).forEach((e) =>
        expect(parseFloat(e.getAttribute("y"))).toBeLessThan(
          visualBuilder.viewport.height / 2
        )
      );

      dataView.metadata.objects.orientation.orientation =
        BulletChartOrientation.VerticalBottom;
      visualBuilder.updateFlushAllD3Transitions(dataView);
      Array.from(visualBuilder.categoryLabels).forEach((e) =>
        expect(parseFloat(e.getAttribute("y"))).toBeGreaterThan(
          visualBuilder.viewport.height / 2
        )
      );
    });
  });

  describe("Colors", () => {
    it("minimum", () => {
      let color = "#000000";

      dataView.metadata.objects = {
        colors: {
          minColor: getSolidColorStructuralObject(color),
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      visualBuilder.rangeRectsGrouped.forEach((el) =>
        assertColorsMatch(el[0].style["fill"], color)
      );
    });

    it("needs improvement", () => {
      let color = "#111111";

      dataView.metadata.objects = {
        colors: {
          needsImprovementColor: getSolidColorStructuralObject(color),
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      visualBuilder.rangeRectsGrouped.forEach((el) =>
        assertColorsMatch(el[1].style["fill"], color)
      );
    });

    it("satisfactory", () => {
      let color = "#222222";

      dataView.metadata.objects = {
        colors: {
          satisfactoryColor: getSolidColorStructuralObject(color),
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      visualBuilder.rangeRectsGrouped.forEach((el) =>
        assertColorsMatch(el[2].style["fill"], color)
      );
    });

    it("good", () => {
      let color = "#333333";

      dataView.metadata.objects = {
        colors: {
          goodColor: getSolidColorStructuralObject(color),
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      visualBuilder.rangeRectsGrouped.forEach((el) =>
        assertColorsMatch(el[3].style["fill"], color)
      );
    });

    it("very good", () => {
      let color = "#444444";

      dataView.metadata.objects = {
        colors: {
          veryGoodColor: getSolidColorStructuralObject(color),
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      visualBuilder.rangeRectsGrouped.forEach((el) =>
        assertColorsMatch(el[4].style["fill"], color)
      );
    });

    it("bullet", () => {
      let color = "#999999";

      dataView.metadata.objects = {
        colors: {
          bulletColor: getSolidColorStructuralObject(color),
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      Array.from(visualBuilder.valueRects).forEach((e) =>
        assertColorsMatch(e.style["fill"], color)
      );
    });
  });

  describe("Axis", () => {
    beforeEach(() => {
      dataView.metadata.objects = {
        labels: {
          show: true,
        },
        axis: {},
      };
    });

    it("show", () => {
      dataView.metadata.objects.axis.axis = false;

      visualBuilder.updateFlushAllD3Transitions(dataView);
      expect(visualBuilder.element.querySelectorAll(".axis").length).toBe(0);
    });

    it("axis color", () => {
      let color = "#333333";
      dataView.metadata.objects.axis.axisColor =
        getSolidColorStructuralObject(color);

      visualBuilder.updateFlushAllD3Transitions(dataView);
      expect(visualBuilder.element.querySelector(".axis")).toBeDefined();
      visualBuilder.axis.forEach((el) => {
        assertColorsMatch(el.style["fill"], color);
        assertColorsMatch(el.querySelector("line").style["stroke"], color);
      });
    });

    it("measure units", () => {
      let measureUnits = "someUnits";
      dataView.metadata.objects.axis.measureUnits = measureUnits;

      visualBuilder.updateFlushAllD3Transitions(dataView);

      expect(visualBuilder.measureUnits).toBeInDOM;
      visualBuilder.measureUnits.forEach((e) =>
        expect(e.innerHTML).toBe(measureUnits)
      );
    });

    it("units color", () => {
      let color = "#333333";
      dataView.metadata.objects.axis.measureUnits = "someUnit";
      dataView.metadata.objects.axis.unitsColor =
        getSolidColorStructuralObject(color);

      visualBuilder.updateFlushAllD3Transitions(dataView);
      visualBuilder.measureUnits.forEach((e: SVGElement) =>
        assertColorsMatch(e.getAttribute("fill"), color)
      );
    });
  });

  describe("createTooltipInfo", () => {
    it("should return an empty array if metadata isn't defined", () => {
      const tooltipItems: BulletChartTooltipItem[] = <BulletChartTooltipItem[]>[
        {
          value: "Microsoft",
          metadata: undefined,
        },
        {
          value: "Power BI",
          metadata: null,
        },
      ];

      expect(VisualClass.CREATETOOLTIPINFO(tooltipItems).length).toBe(0);
    });
  });

  describe("highlight", () => {
    it("should respect category highlight", () => {
      const highlightsArray: number[] = [
        1,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      dataView.categorical.values[0].highlights = highlightsArray;

      visualBuilder.updateFlushAllD3Transitions(dataView);

      visualBuilder.rangeRectsGrouped[0].forEach((el) =>
        expect(el.style["opacity"]).toBe("1")
      );

      visualBuilder.rangeRectsGrouped.forEach((x, i) => {
        if (i !== 0) {
          x.forEach((el) => expect(el.style["opacity"]).not.toBe("1"));
        }
      });
    });
  });

  describe("tick count tests", () => {
    it("should calculate fit count of ticks using viewport length", () => {
      const tinyViewportLength: number = 10,
        smallViewportLength: number = 100,
        mediumViewportLength: number = 200,
        bigViewportLength: number = 500,
        lengthArray: number[] = [
          tinyViewportLength,
          smallViewportLength,
          mediumViewportLength,
          bigViewportLength,
        ];

      lengthArray.forEach((x) => {
        expect(VisualClass.GETFITTICKSCOUNT(x)).toBeGreaterThan(0);
      });
    });
  });

  describe("formatting option limitation test", () => {
    it("should limit values correctly", () => {
      dataView.metadata.objects = {
        values: {
          minimumPercent: 100,
          maximumPercent: 0,
        },
        labels: {
          maxWidth: 0,
        },
      };

      visualBuilder.updateFlushAllD3Transitions(dataView);
      let sett = visualBuilder.getSettings();
      expect(sett.values.minimumPercent).not.toBeGreaterThan(
        sett.values.maximumPercent.value
      );
      expect(sett.labels.maxWidth.value).not.toBe(0);
    });
  });

  describe("Capabilities tests", () => {
    it("all items having displayName should have displayNameKey property", async () => {
      let capabilities = await fetch("base/capabilities.json");
      let jsonData = await capabilities.json();

      let objectsChecker = (obj) => {
        for (let property of Object.keys(obj)) {
          let value: any = obj[property];

          if (value.displayName) {
            expect(value.displayNameKey).toBeDefined();
          }

          if (typeof value === "object") {
            objectsChecker(value);
          }
        }
      };

      objectsChecker(jsonData);
    });
  });

  describe("high contrast mode test", () => {
    const backgroundColor: string = "#000000";
    const foregroundColor: string = "#ff00ff";

    beforeEach(() => {
      visualBuilder.visualHost.colorPalette.isHighContrast = true;

      visualBuilder.visualHost.colorPalette.background = {
        value: backgroundColor,
      };
      visualBuilder.visualHost.colorPalette.foreground = {
        value: foregroundColor,
      };
    });

    it("should not use fill style", (done) => {
      visualBuilder.updateRenderTimeout(dataView, () => {
        const valueRects: SVGElement[] = Array.from(visualBuilder.valueRects);
        const rangeRects: SVGElement[] = Array.from(visualBuilder.rangeRects);

        expect(isColorAppliedToElements(valueRects, null, "fill"));
        expect(isColorAppliedToElements(rangeRects, null, "fill"));
        done();
      });
    });

    it("should use stroke style", (done) => {
      visualBuilder.updateRenderTimeout(dataView, () => {
        const valueRects: SVGElement[] = Array.from(visualBuilder.valueRects);
        const rangeRects: SVGElement[] = Array.from(visualBuilder.rangeRects);

        expect(isColorAppliedToElements(valueRects, null, "stroke"));
        expect(isColorAppliedToElements(rangeRects, null, "stroke"));
        done();
      });
    });
  });

  describe("empty categories", () => {
    let rangeRects: SVGElement[];
    let valueRects: SVGElement[];

    beforeEach(() => {
      dataView = defaultDataViewBuilder.getDataView(
        [
          BulletChartData.ColumnCategory,
          BulletChartData.ColumnValue,
          BulletChartData.ColumnTargetValue,
          BulletChartData.ColumnSatisfactory,
          BulletChartData.ColumnGood,
          BulletChartData.ColumnMaximum,
        ],
        undefined,
        false
      );
      visualBuilder.update(dataView);

      rangeRects = Array.from(visualBuilder.rangeRects);
      valueRects = Array.from(visualBuilder.valueRects);
    });

    it("should visual's elements be rendered", (done) => {
      visualBuilder.updateRenderTimeout(dataView, () => {
        expect(rangeRects.length).not.toBe(0);
        expect(valueRects.length).not.toBe(0);
        done();
      });
    });
  });
});
