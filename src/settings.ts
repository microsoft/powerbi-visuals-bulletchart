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
    
    export enum BulletChartOrientation {
        HorizontalLeft = <any>"HorizontalLeft",
        HorizontalRight = <any>"HorizontalRight",
        VerticalTop = <any>"VerticalTop",
        VerticalBottom = <any>"VerticalBottom"
    }

    import SettingsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export class BulletchartSettings extends SettingsParser {
        public values: ValuesSettings = new ValuesSettings();
        public labels: LabelsSettings = new LabelsSettings();
        public orientation: OrientationSettings = new OrientationSettings();
        public colors: ColorsSettings = new ColorsSettings();
        public axis: AxisSettings = new AxisSettings();
    }

    export class ValuesSettings {
        public targetValue: number = null;
        public targetValue2: number = null;
        public minimumPercent: number = 0;
        needsImprovementPercent: number = null;
        satisfactoryPercent: number = null;
        goodPercent: number = null;
        veryGoodPercent: number = null;
        maximumPercent: number = null;
    }

    export class LabelsSettings {
        public show: boolean = true;
        public labelColor: string = "Black";
        public fontSize: number = 11;
    }

    export class OrientationSettings {
        public orientation: BulletChartOrientation = BulletChartOrientation.HorizontalLeft;
    }

    export class ColorsSettings {
        public mincolor: any = { solid: { color: "Darkred" } };
        public needsImprovementcolor: any = { solid: { color: "Red" } };
        public satisfactorycolor: any = {solid: {color: "Yellow"}};
        public goodcolor: any = { solid: { color: "Green"}};
        public veryGoodcolor: any = { solid: { color: "Darkgreen"}};
        public bulletcolor: any = { solid: { color: "Black"}};
    }
    
    export class AxisSettings {
        axis: boolean = true;
        axisColor:string = "Grey";
        measureUnits: string = "";
        unitsColor: string = "Grey";
    };
}