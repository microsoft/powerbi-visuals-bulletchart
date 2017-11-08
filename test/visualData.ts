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
    // powerbi.extensibility.utils.type
    import ValueType = powerbi.extensibility.utils.type.ValueType;

    // powerbi.extensibility.utils.test
    import getRandomNumber = powerbi.extensibility.utils.test.helpers.getRandomNumber;
    import CustomizeColumnFn = powerbi.extensibility.utils.test.dataViewBuilder.CustomizeColumnFn;
    import TestDataViewBuilder = powerbi.extensibility.utils.test.dataViewBuilder.TestDataViewBuilder;

    export class BulletChartData extends TestDataViewBuilder {
        public static ColumnCategory: string = "Category";
        public static ColumnValue: string = "Value";
        public static ColumnTargetValue: string = "Target Value";
        public static ColumnMinimum: string = "Minimum";
        public static ColumnSatisfactory: string = "Satisfactory";
        public static ColumnGood: string = "Good";
        public static ColumnMaximum: string = "Maximum";

        public valuesCategory = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
        public valuesValue = [2, 4, 3, 3, 4, 3, 4, 5];
        public valuesTargetValue = [3, 3, 3, 2, 2, 2, 3, 3];
        public valuesMinimum = [-1, 1, 1, 1, 1, 1, 2, 2];
        public valuesSatisfactory = [2, 2, 2, 3, 3, 3, 3, 3];
        public valuesGood = [4, 4, 4, 6, 6, 6, 4, 4];
        public valuesMaximum = [6, 6, 6, 8, 8, 8, 8, 7];

        public getDataView(columnNames?: string[], customizeColumns?: CustomizeColumnFn): DataView {
            return this.createCategoricalDataViewBuilder([
                {
                    source: {
                        displayName: BulletChartData.ColumnCategory,
                        roles: { "Category": true },
                        type: ValueType.fromDescriptor({ text: true }),
                    },
                    values: this.valuesCategory
                }
            ], [
                    {
                        source: {
                            displayName: BulletChartData.ColumnValue,
                            roles: { "Value": true },
                            isMeasure: true,
                            type: ValueType.fromDescriptor({ numeric: true }),
                        },
                        values: this.valuesValue
                    },
                    {
                        source: {
                            displayName: BulletChartData.ColumnTargetValue,
                            roles: { "TargetValue": true },
                            isMeasure: true,
                            type: ValueType.fromDescriptor({ numeric: true }),
                        },
                        values: this.valuesTargetValue
                    },
                    {
                        source: {
                            displayName: BulletChartData.ColumnMinimum,
                            roles: { "Minimum": true },
                            isMeasure: true,
                            type: ValueType.fromDescriptor({ numeric: true }),
                        },
                        values: this.valuesMinimum
                    },
                    {
                        source: {
                            displayName: BulletChartData.ColumnSatisfactory,
                            roles: { "Satisfactory": true },
                            isMeasure: true,
                            type: ValueType.fromDescriptor({ numeric: true })
                        },
                        values: this.valuesSatisfactory
                    },
                    {
                        source: {
                            displayName: BulletChartData.ColumnGood,
                            roles: { "Good": true },
                            isMeasure: true,
                            type: ValueType.fromDescriptor({ numeric: true }),
                        },
                        values: this.valuesGood
                    },
                    {
                        source: {
                            displayName: BulletChartData.ColumnMaximum,
                            roles: { "Maximum": true },
                            isMeasure: true,
                            type: ValueType.fromDescriptor({ numeric: true }),
                        },
                        values: this.valuesMaximum
                    }
                ], columnNames, customizeColumns).build();
        }
    }
}