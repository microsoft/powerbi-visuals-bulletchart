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
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import converterHelper = powerbi.extensibility.utils.dataview.converterHelper;

    export class BulletChartColumns<T> {
        public static getColumnSources(dataView: DataView) {
            return this.getColumnSourcesT<DataViewMetadataColumn>(dataView);
        }

        public static getTableValues(dataView: DataView):BulletChartColumns<any[]> {
            const table: DataViewTable = dataView && dataView.table,
                columns = this.getColumnSourcesT<any[]>(dataView);

            return columns && table && _.mapValues(
                columns, (n: DataViewMetadataColumn, i) => n && table.rows.map(row => row[n.index]));
        }

        public static getTableRows(dataView: DataView): BulletChartColumns<any[]>[] {
            const table: DataViewTable  = dataView && dataView.table,
                columns = this.getColumnSourcesT<any[]>(dataView);

            return columns && table && table.rows.map(row =>
                _.mapValues(columns, (n: DataViewMetadataColumn, i) => n && row[n.index]));
        }

        public static getCategoricalValues(dataView: DataView): BulletChartColumns<any[]> {
            const categorical: DataViewCategorical = dataView && dataView.categorical,
                categories = categorical && categorical.categories || [],
                values = categorical && categorical.values || <DataViewValueColumns>[],
                series = categorical && values.source && this.getSeriesValues(dataView);

            return categorical && _.mapValues(new this<any[]>(), (n, i) =>
                (<DataViewCategoricalColumn[]>_.toArray(categories)).concat(_.toArray(values))
                    .filter(x => x.source.roles && x.source.roles[i]).map(x => x.values)[0]
                || values.source && values.source.roles && values.source.roles[i] && series);
        }

        public static getSeriesValues(dataView: DataView):any[] {
            return dataView && dataView.categorical && dataView.categorical.values
                && dataView.categorical.values.map(x => converterHelper.getSeriesName(x.source));
        }

        public static getCategoricalColumns(dataView: DataView): BulletChartColumns<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns> {
            const categorical: DataViewCategorical = dataView && dataView.categorical,
                categories = categorical && categorical.categories || [],
                values = categorical && categorical.values || <DataViewValueColumns>[];

            return categorical && _.mapValues(
                new this<DataViewCategoryColumn & DataViewValueColumn[] & DataViewValueColumns>(),
                (n, i) => {
                    let result: any = categories.filter(x => x.source.roles && x.source.roles[i])[0];

                    if (!result) {
                        result = values.source && values.source.roles && values.source.roles[i] && values;
                    }

                    if (!result) {
                        result = values.filter(x => x.source.roles && x.source.roles[i]);

                        if (_.isEmpty(result)) {
                            result = undefined;
                        }
                    }

                    return result;
                });
        }

        public static getGroupedValueColumns(dataView: DataView): BulletChartColumns<DataViewValueColumn>[] {
            const categorical: DataViewCategorical  = dataView && dataView.categorical,
                values = categorical && categorical.values,
                grouped = values && values.grouped();

            return grouped && grouped.map(g => _.mapValues(
                new this<DataViewValueColumn>(),
                (n, i) => g.values.filter(v => v.source.roles[i])[0]));
        }

        private static getColumnSourcesT<T>(dataView: DataView): BulletChartColumns<T> {
            const columns: DataViewMetadataColumn[] = dataView && dataView.metadata && dataView.metadata.columns;

            return columns && _.mapValues(
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

}