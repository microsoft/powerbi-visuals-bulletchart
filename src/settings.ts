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
    import SettingsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export class BulletchartSettings extends SettingsParser {
        constructor() {
            super([
                "mincolor",
                "needsImprovementcolor",
                "satisfactorycolor",
                "goodcolor",
                "veryGoodcolor",
                "bulletcolor",
                "axisColor",
                "unitsColor"
            ])
        }

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
        public mincolor: string = "Darkred";
        public needsImprovementcolor: string = "Red";
        public satisfactorycolor: string = "Yellow";
        public goodcolor: string = "Green";
        public veryGoodcolor: string = "Darkgreen";
        public bulletcolor: string = "Black";
    }

    export class AxisSettings {
        public axis: boolean = true;
        public axisColor: string = "Grey";
        public measureUnits: string = "";
        public unitsColor: string = "Grey";
    };
}