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
// powerbi
import powerbiVisualsApi from "powerbi-visuals-api";
import lodashKeys from "lodash.keys";
import lodashClone from "lodash.clone";

import IViewport = powerbiVisualsApi.IViewport;

import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import IMargin = SVGUtil.IMargin;

export class VisualLayout {
    private marginValue: IMargin;
    private viewportValue: IViewport;
    private viewportInValue: IViewport;
    private minViewportValue: IViewport;
    private originalViewportValue: IViewport;
    private previousOriginalViewportValue: IViewport;

    public defaultMargin: IMargin;
    public defaultViewport: IViewport;

    constructor(defaultViewport?: IViewport, defaultMargin?: IMargin) {
        this.defaultViewport = defaultViewport || { width: 0, height: 0 };
        this.defaultMargin = defaultMargin || { top: 0, bottom: 0, right: 0, left: 0 };
    }

    public get viewport(): IViewport {
        return this.viewportValue || (this.viewportValue = this.defaultViewport);
    }

    public get viewportCopy(): IViewport {
        return lodashClone(this.viewport);
    }

    // Returns viewport minus margin
    public get viewportIn(): IViewport {
        return this.viewportInValue || this.viewport;
    }

    public get minViewport(): IViewport {
        return this.minViewportValue || { width: 0, height: 0 };
    }

    public get margin(): IMargin {
        return this.marginValue || (this.marginValue = this.defaultMargin);
    }

    public set minViewport(value: IViewport) {
        this.setUpdateObject(value, v => this.minViewportValue = v, VisualLayout.restrictToMinMax);
    }

    public set viewport(value: IViewport) {
        this.previousOriginalViewportValue = lodashClone(this.originalViewportValue);
        this.originalViewportValue = lodashClone(value);
        this.setUpdateObject(value,
            v => this.viewportValue = v,
            o => VisualLayout.restrictToMinMax(o, this.minViewport));
    }

    public set margin(value: IMargin) {
        this.setUpdateObject(value, v => this.marginValue = v, VisualLayout.restrictToMinMax);
    }

    // Returns true if viewport has updated after last change.
    public get viewportChanged(): boolean {
        return !!this.originalViewportValue && (!this.previousOriginalViewportValue
            || this.previousOriginalViewportValue.height !== this.originalViewportValue.height
            || this.previousOriginalViewportValue.width !== this.originalViewportValue.width);
    }

    public get viewportInIsZero(): boolean {
        return this.viewportIn.width === 0 || this.viewportIn.height === 0;
    }

    public resetMargin(): void {
        this.margin = this.defaultMargin;
    }

    private update(): void {
        this.viewportInValue = VisualLayout.restrictToMinMax({
            width: this.viewport.width - (this.margin.left + this.margin.right),
            height: this.viewport.height - (this.margin.top + this.margin.bottom)
        }, this.minViewportValue);
    }

    private setUpdateObject<T>(object: T, setObjectFn: (T) => void, beforeUpdateFn?: (T) => void): void {
        object = lodashClone(object);
        setObjectFn(VisualLayout.createNotifyChangedObject(object, () => {
            if (beforeUpdateFn) beforeUpdateFn(object);
            this.update();
        }));

        if (beforeUpdateFn) beforeUpdateFn(object);
        this.update();
    }

    private static createNotifyChangedObject<T>(object: T, objectChanged: (o?: T, key?: string) => void): T {
        const result: T = <any>{};

        lodashKeys(object).forEach(key => Object.defineProperty(result, key, {
            get: () => object[key],
            set: (value) => { object[key] = value; objectChanged(object, key); },
            enumerable: true,
            configurable: true
        }));

        return result;
    }

    private static restrictToMinMax<T>(value: T, minValue?: T): T {
        lodashKeys(value).forEach(x => value[x] = Math.max(minValue && minValue[x] || 0, value[x]));

        return value;
    }
}