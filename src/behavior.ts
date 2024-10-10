// d3
import { BaseType, Selection as d3Selection } from "d3-selection";

import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager

import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";
import { BarRect, BarValueRect } from "./dataInterfaces";

export const DimmedOpacity: number = 0.4;
export const DefaultOpacity: number = 1.0;

function getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
    if ((hasPartialHighlights && !highlight) || (hasSelection && !selected))
        return DimmedOpacity;
    return DefaultOpacity;
}

export interface BaseDataPoint {
    selected: boolean;
}

export interface SelectableDataPoint extends BaseDataPoint {
    identity: ISelectionId;
    specificIdentity?: ISelectionId;
}

export interface BehaviorOptions {
    dataPoints: BarRect[];
    hasHighlights: boolean;
    rects: d3Selection<BaseType | SVGRectElement, BarRect, BaseType | SVGGElement, [number, BarRect[]]>;
    valueRects: d3Selection<BaseType | SVGRectElement, BarValueRect, any, any>;
    groupedRects:  d3Selection<BaseType | SVGGElement, [number, BarRect[]], any, any>;
    clearCatcher: d3Selection<HTMLDivElement, null, HTMLElement, null>;
}

export class Behavior {
    private selectionManager: ISelectionManager;
    private options: BehaviorOptions;

    constructor(selectionManager: ISelectionManager) {
        this.selectionManager = selectionManager;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    public get isInitialized(): boolean {
        return !!this.options;
    }

    private get hasSelection(): boolean {
        return this.selectionManager.hasSelection();
    }

    public bindEvents(options: BehaviorOptions) {
        this.options = options;
        
        this.onSelectCallback();

        this.handleClickEvents();
        this.handleContextMenuEvents();
        this.handleKeyboardEvents();
    }

    private handleClickEvents(): void {
        this.options.valueRects.on("click", (event: MouseEvent, d: BarValueRect) => {
            event.stopPropagation();
            this.selectDataPoint(d, event.ctrlKey || event.metaKey || event.shiftKey);
        });

        this.options.rects.on("click", (event: MouseEvent, d: BarRect) => {
            event.stopPropagation();
            this.selectDataPoint(d, event.ctrlKey || event.metaKey || event.shiftKey);
        });

        this.options.clearCatcher.on("click", () => {
            this.clear();
        });
    }

    private handleContextMenuEvents(): void {
        this.options.rects.on("contextmenu", (event: MouseEvent, d: BarRect) => {
            event.preventDefault();
            event.stopPropagation();

            this.selectionManager.showContextMenu(d ? d.identity : null, {
                x: event.clientX,
                y: event.clientY
            });
        });

        this.options.clearCatcher.on("contextmenu", (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            this.selectionManager.showContextMenu(null, {
                x: event.clientX,
                y: event.clientY
            });
        });
    }

    private handleKeyboardEvents(): void {
        this.options.groupedRects.on("keydown", (event: KeyboardEvent, d: [number, BarRect[]]) => {
            if (event.code === "Enter" || event.code === "Space") {
                event.stopPropagation();

                const groupedBars = d[1];
                const firstBarRect = groupedBars[0];
                this.selectDataPoint(firstBarRect, event.ctrlKey || event.metaKey || event.shiftKey);
            }
        });
    }

    private renderSelection(): void {
        const hasHighlights: boolean = this.options.hasHighlights;
        const hasSelection: boolean = this.hasSelection;

        this.options.valueRects.style("opacity", (d: BarValueRect) => getFillOpacity(d.selected, d.highlight, hasSelection, !d.selected && hasHighlights));
        this.options.rects.style("opacity", (d: BarRect) => getFillOpacity(d.selected, d.highlight, hasSelection, hasHighlights));
    }

    private clear(): void {
        this.selectionManager.clear();
        this.onSelectCallback();
    }

    private selectDataPoint(dataPoint: SelectableDataPoint, multiSelect: boolean): void {
        const selectionIdsToSelect: ISelectionId[] = [dataPoint.identity];
        this.selectionManager.select(selectionIdsToSelect, multiSelect);
        this.onSelectCallback();
    }

    private onSelectCallback(selectionIds?: ISelectionId[]): void {
        this.applySelectionStateToDataPoints(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToDataPoints(selectionIds?: ISelectionId[]): void {
        const selectedIds: ISelectionId[] = selectionIds || <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.options.dataPoints, selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: SelectableDataPoint[] | LegendDataPoint[], ids: ISelectionId[]): void {
        dataPoints.forEach((dataPoint: SelectableDataPoint | LegendDataPoint) => {
            dataPoint.selected = this.isDataPointSelected(dataPoint, ids);
        });
    }

    private isDataPointSelected(dataPoint: SelectableDataPoint | LegendDataPoint, selectedIds: ISelectionId[]): boolean {
        return selectedIds.some((selectedId: ISelectionId) => selectedId.includes(<ISelectionId>dataPoint.identity));
    }
}
