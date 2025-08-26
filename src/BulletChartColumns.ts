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

import DataView = powerbiVisualsApi.DataView;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import DataViewCategorical = powerbiVisualsApi.DataViewCategorical;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

import { converterHelper } from "powerbi-visuals-utils-dataviewutils";

const bulletChartValueColumnNames = [
    'Value',
    'TargetValue',
    'Minimum',
    'NeedsImprovement',
    'Satisfactory',
    'Good',
    'VeryGood',
    'Maximum',
    'TargetValue2',
];

export type BulletChartValueColumns = {
    Category: PrimitiveValue[]
    Value: PrimitiveValue[];
    TargetValue: PrimitiveValue[];
    Minimum: PrimitiveValue[];
    NeedsImprovement: PrimitiveValue[];
    Satisfactory: PrimitiveValue[];
    Good: PrimitiveValue[];
    VeryGood: PrimitiveValue[];
    Maximum: PrimitiveValue[];
    TargetValue2: PrimitiveValue[];
}

export class BulletChartColumns {
    public Category?: DataViewCategoryColumn = undefined;

    public Value?: DataViewValueColumn = undefined;
    public TargetValue?: DataViewValueColumn = undefined;
    public Minimum?: DataViewValueColumn = undefined;
    public NeedsImprovement?: DataViewValueColumn = undefined;
    public Satisfactory?: DataViewValueColumn = undefined;
    public Good?: DataViewValueColumn = undefined;
    public VeryGood?: DataViewValueColumn = undefined;
    public Maximum?: DataViewValueColumn = undefined;
    public TargetValue2?: DataViewValueColumn = undefined;

    public static getCategoricalColumns(dataView: DataView): BulletChartColumns {
        const categorical: DataViewCategorical = dataView && dataView.categorical;
        const categories: DataViewCategoryColumn[] = categorical && categorical.categories || [];
        const values: DataViewValueColumns = categorical && categorical.values || <DataViewValueColumns>[];

        const categoryColumns: BulletChartColumns = {} as BulletChartColumns;
        categoryColumns.Category = categories.find(x => x.source.roles && x.source.roles['Category']);

        for (const valueRole of bulletChartValueColumnNames) {
            const column = values.find(x => x.source.roles && x.source.roles[valueRole]);

            if (column) {
                categoryColumns[valueRole] = column;
            } else {
                categoryColumns[valueRole] = undefined;
            }
        }

        return categoryColumns;
    }

    public static getCategoricalValues(dataView: DataView, categorical: BulletChartColumns): BulletChartValueColumns {
        const values: DataViewValueColumns = dataView?.categorical?.values || <DataViewValueColumns>[];
        const series = dataView?.categorical?.values?.source && this.getSeries(dataView);

        const bulletChartValueColumns = {} as BulletChartValueColumns;
        bulletChartValueColumns.Category = categorical.Category?.values || [];

        for (const valueRole of bulletChartValueColumnNames) {
            const valueColumn: DataViewValueColumn = categorical[valueRole];
            if (!valueColumn) {
                continue;
            }

            const hasHighlights = !!valueColumn.highlights;
            const hasAnyHighlightValue = hasHighlights && valueColumn.highlights.some(x => x != null);

            bulletChartValueColumns[valueRole] = hasAnyHighlightValue ? valueColumn.highlights : valueColumn.values;

            if (!bulletChartValueColumns[valueRole]) {
                bulletChartValueColumns[valueRole] = values.source?.roles?.[valueRole] && series?.slice();
            }
        }

        return bulletChartValueColumns;
    }

    private static getSeries(dataView: DataView): powerbiVisualsApi.PrimitiveValue[] {
        return dataView
            && dataView.categorical
            && dataView.categorical.values
            && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
    }
}
