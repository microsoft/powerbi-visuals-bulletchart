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

import powerbiVisualsApi from "powerbi-visuals-api";
import lodashMapvalues from "lodash.mapvalues";
import lodashIsempty from "lodash.isempty";


import DataView = powerbiVisualsApi.DataView;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import DataViewCategorical = powerbiVisualsApi.DataViewCategorical;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import DataViewCategoricalColumn = powerbiVisualsApi.DataViewCategoricalColumn;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import DataViewTable = powerbiVisualsApi.DataViewTable;

import { converterHelper } from "powerbi-visuals-utils-dataviewutils";

export class BulletChartColumns<T> {
    public static GET_COLUMN_SOURCES(dataView: DataView) {
        return this.GET_COLUMN_SOURCES_T<DataViewMetadataColumn>(dataView);
    }

    public static GET_TABLE_VALUES(dataView: DataView): BulletChartColumns<any[]> {
        const table: DataViewTable = dataView && dataView.table,
            columns = this.GET_COLUMN_SOURCES_T<any[]>(dataView);

        return columns && table && lodashMapvalues(
            columns, (n: DataViewMetadataColumn) => n && table.rows.map(row => row[n.index]));
    }

    public static GET_TABLE_ROWS(dataView: DataView): BulletChartColumns<any>[] {
        const table: DataViewTable = dataView && dataView.table,
            columns = this.GET_COLUMN_SOURCES_T<any[]>(dataView);

        return columns && table && table.rows.map(row =>
            lodashMapvalues(columns, (n: DataViewMetadataColumn) => n && row[n.index]));
    }

    public static GET_CATEGORICAL_VALUES(dataView: DataView): BulletChartColumns<any[]> {
        const categorical: DataViewCategorical = dataView && dataView.categorical,
            categories = categorical && categorical.categories || [],
            values = categorical && categorical.values || <DataViewValueColumns>[],
            series = categorical && values.source && this.GET_SERIES_VALUES(dataView);

        return categorical && lodashMapvalues(new this<any[]>(), (n, i) =>
            (<DataViewCategoricalColumn[]>Array.from(categories)).concat(Array.from(values))
                .filter(x => x.source.roles && x.source.roles[i]).map(x => {
                    const hasHighLight: boolean = !!(<DataViewValueColumn>x).highlights;
                    let useHighlightAsValue: boolean;

                    if (hasHighLight) {
                        useHighlightAsValue = (<DataViewValueColumn>x).highlights.every(y => {
                            if (y === null || y === undefined) {
                                return false;
                            }
                            return true;
                        });
                    }

                    return useHighlightAsValue ? (<DataViewValueColumn>x).highlights : (<DataViewValueColumn>x).values;
                })[0]
            || values.source && values.source.roles && values.source.roles[i] && series);
    }

    public static GET_SERIES_VALUES(dataView: DataView): any[] {
        return dataView && dataView.categorical && dataView.categorical.values
            && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
    }

    public static GET_CATEGORICAL_COLUMNS(dataView: DataView): BulletChartColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns> {
        const categorical: DataViewCategorical = dataView && dataView.categorical,
            categories = categorical && categorical.categories || [],
            values = categorical && categorical.values || <DataViewValueColumns>[];

        return categorical && lodashMapvalues(
            new this<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>(),
            (n, i) => {
                let result: any = categories.filter(x => x.source.roles && x.source.roles[i])[0];

                if (!result) {
                    result = values.source && values.source.roles && values.source.roles[i] && values;
                }

                if (!result) {
                    result = values.filter(x => x.source.roles && x.source.roles[i]);

                    if (lodashIsempty(result)) {
                        result = undefined;
                    }
                }

                return result;
            });
    }

    public static GET_GROUPED_VALUE_COLUMNS(dataView: DataView): BulletChartColumns<DataViewValueColumn>[] {
        const categorical: DataViewCategorical = dataView && dataView.categorical,
            values = categorical && categorical.values,
            grouped = values && values.grouped();

        return grouped && grouped.map(g => lodashMapvalues(
            new this<DataViewValueColumn>(),
            (n, i) => g.values.filter(v => v.source.roles[i])[0]));
    }

    private static GET_COLUMN_SOURCES_T<T>(dataView: DataView): BulletChartColumns<DataViewMetadataColumn> {
        const columns: DataViewMetadataColumn[] = dataView && dataView.metadata && dataView.metadata.columns;

        return columns && lodashMapvalues(
            new this<T>(), (n, i) => columns.filter(x => x.roles && x.roles[i])[0]);
    }

    // Data Roles
    public Category: T = null;
    public Value: T = null;
    public TargetValue: T = null;
    public Minimum: T = null;
    public NeedsImprovement: T = null;
    public Satisfactory: T = null;
    public Good: T = null;
    public VeryGood: T = null;
    public Maximum: T = null;
    public TargetValue2: T = null;
}
