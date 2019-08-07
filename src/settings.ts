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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class BulletchartSettings extends DataViewObjectsParser {
    public values: ValuesSettings = new ValuesSettings();
    public tooltips: TooltipsSettings = new TooltipsSettings();
    public labels: LabelsSettings = new LabelsSettings();
    public orientation: OrientationSettings = new OrientationSettings();
    public colors: ColorsSettings = new ColorsSettings();
    public axis: AxisSettings = new AxisSettings();
}

export class TooltipsSettings {
    public valueCustomName: string = "";
    public targetCustomName: string = "";
    public target2CustomName: string = "";
}

export class ValuesSettings {
    public targetValue: number = null;
    public targetValue2: number = null;
    public minimumPercent: number = 0;
    public needsImprovementPercent: number = null;
    public satisfactoryPercent: number = null;
    public goodPercent: number = null;
    public veryGoodPercent: number = null;
    public maximumPercent: number = null;
}

export class LabelsSettings {
    public show: boolean = true;
    public labelColor: string = "Black";
    public fontSize: number = 11;
    public maxWidth: number = 80;
}

export enum BulletChartOrientation {
    HorizontalLeft = <any>"HorizontalLeft",
    HorizontalRight = <any>"HorizontalRight",
    VerticalTop = <any>"VerticalTop",
    VerticalBottom = <any>"VerticalBottom"
}

export class OrientationSettings {
    public orientation: BulletChartOrientation = BulletChartOrientation.HorizontalLeft;
}

export class ColorsSettings {
    public minColor: string = "#8b0000"; // Darkred
    public needsImprovementColor: string = "#FF0000"; // Red
    public satisfactoryColor: string = "#FFFF00"; // Yellow
    public goodColor: string = "#008000"; // Green
    public veryGoodColor: string = "#006400"; // Darkgreen
    public bulletColor: string = "#000000"; // Black
}

export class AxisSettings {
    public axis: boolean = true;
    public axisColor: string = "Grey";
    public measureUnits: string = "";
    public unitsColor: string = "Grey";
}
