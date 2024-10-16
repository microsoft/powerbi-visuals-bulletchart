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

import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import VisualTooltipDataItem = powerbiVisualsApi.extensibility.VisualTooltipDataItem;

import { axisInterfaces } from "powerbi-visuals-utils-chartutils";
import IAxisProperties = axisInterfaces.IAxisProperties;

import {BulletChartSettingsModel} from "./BulletChartSettingsModel";
import { BarRectType } from './enums';
import { SelectableDataPoint } from "./behavior";
import { ScaleLinear as d3ScaleLinear } from "d3-scale";

export type DefinedColors = {
    minColor?: boolean,
    needsImprovementColor?: boolean,
    satisfactoryColor?: boolean,
    goodColor?: boolean,
    veryGoodColor?: boolean,
    bulletColor?: boolean,
}

export interface BulletChartModel {
    bars: BarData[];
    settings: BulletChartSettingsModel;
    barRects: BarRect[];
    valueRects: BarRect[];
    targetValues: TargetValue[];
    hasHighlights: boolean;
    viewportLength: number;
    labelHeight: number;
    labelHeightTop: number;
    spaceRequiredForBarHorizontally: number;
    longestCategoryWidth: number;
}

export interface BarData {
    scale: d3ScaleLinear<number, number>;
    barIndex: number;
    categoryLabel: string;
    xAxisProperties: IAxisProperties;
    x: number;
    y: number;
    key: string;
}

export interface BarRect extends SelectableDataPoint {
    barIndex: number;
    start: number;
    end: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth?: number;
    tooltipInfo?: VisualTooltipDataItem[];
    key: string;
    highlight?: boolean;
    type: BarRectType;
}

export interface TargetValue {
    barIndex: number;
    categoryValue: number;
    targetValueUnscaled: number;
    value: number;
    value2: number;
    fill: string;
    stroke: string;
    strokeWidth?: number;
    key: string;
}

export interface ScaledValues {
    firstScale: number;
    secondScale: number;
    thirdScale: number;
    fourthScale: number;
    fifthScale: number;
}

export interface BulletChartAxis {
    axis: boolean;
    axisColor: string;
    measureUnits: string;
    unitsColor: string;
}

export interface BulletChartTooltipItem {
    value: any;
    metadata?: DataViewValueColumn;
    customName: string;
}
