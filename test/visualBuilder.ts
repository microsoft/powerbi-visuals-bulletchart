﻿/*
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

import powerbi from "powerbi-visuals-api";
import * as _ from "lodash";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

// powerbi.extensibility.utils.test
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";

import { BulletChart as VisualClass } from "../src/visual";
import { BulletchartSettings as VisualSettings, BulletChartOrientation } from "../src/settings";

export class BulletChartBuilder extends VisualBuilderBase<VisualClass> {
    constructor(width: number, height: number) {
        super(width, height, "BulletChart1443347686880");
    }

    public get mainElement() {
        return this.element
            .children("div")
            .children("svg");
    }

    public get valueRects() {
        return this.mainElement
            .children("g")
            .children("rect.value");
    }

    public get rangeRects() {
        return this.mainElement
            .children("g")
            .children("rect.range");
    }

    public get axis() {
        return this.mainElement
            .children("g")
            .children("g")
            .children("g.axis");
    }

    public get categoryLabels() {
        return this.mainElement
            .children("g")
            .children("text.title");
    }

    public get measureUnits() {
        return this.mainElement
            .children("g")
            .children("text")
            .not(".title");
    }

    public get rangeRectsGrouped(): JQuery[] {
        let groupBy = this.isVertical ? "x" : "y",
            grouped = _.groupBy(this.rangeRects.toArray(), e => $(e).attr(groupBy)),
            groups = _.keys(grouped).map(x => $(grouped[x]));

        return groups;
    }

    public get orientation(): BulletChartOrientation {
        return this.getSettings().orientation.orientation;
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

    protected build(options: VisualConstructorOptions) {
        return new VisualClass(options);
    }

    public getSettings(): VisualSettings {
        return new VisualSettings();
    }
}
