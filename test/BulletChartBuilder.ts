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
import lodashGroupby from "lodash.groupby";
import lodashKeys from "lodash.keys";

import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;

// powerbi.extensibility.utils.test
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";

import { BulletChart as VisualClass } from "../src/visual";
import {BulletChartOrientation} from "../src/BulletChartOrientation";
import {BulletChartSettingsModel} from "../src/BulletChartSettingsModel";

export class BulletChartBuilder extends VisualBuilderBase<VisualClass> {
	constructor(width: number, height: number) {
		super(width, height, "BulletChart1443347686880");
	}

	protected build(options: VisualConstructorOptions) {
		return new VisualClass(options);
	}

	public getSettings(): BulletChartSettingsModel {
		return new BulletChartSettingsModel();
	}
	
	public get mainElement(): SVGElement {
		return this.element.querySelector("svg");
	}

	public get valueRects(): NodeListOf<SVGElement> {
		return this.mainElement.querySelectorAll("g rect.value");
	}

	public get rangeRects(): NodeListOf<SVGElement> {
		return this.mainElement.querySelectorAll("g > rect.range");
	}

	public get axis(): NodeListOf<HTMLElement> {
		return this.mainElement.querySelectorAll("g > g > g.axis")
	}

	public get categoryLabels(): NodeListOf<HTMLElement> {
		return this.mainElement.querySelectorAll("g > text.title");
	}

	public get measureUnits(): NodeListOf<SVGElement> {
		return this.mainElement
		.querySelector("g")
		.querySelectorAll("text:not(.title)");
	}

	public get rangeRectsGrouped(): SVGElement[][] {
		let groupBy = this.isVertical ? "x" : "y",
			grouped = lodashGroupby(Array.from(this.rangeRects), e => e.getAttribute(groupBy)),
			groups = Array.from(lodashKeys(grouped).map(key => grouped[key]));

		return groups;
	}

	public get orientation(): BulletChartOrientation {
		return this.getSettings().orientation.orientation.value.value as BulletChartOrientation;
	}

	public get isVertical(): boolean {
		switch (this.orientation) {
		case BulletChartOrientation.VerticalTop:
		case BulletChartOrientation.VerticalBottom:
			return true;
		default:
			return false;
		}
	}
}
