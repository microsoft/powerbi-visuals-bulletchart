// d3
import * as d3 from "d3";
type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

// powerbi.extensibility.utils.interactivity
import { interactivityBaseService as interactivityService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import ISelectionHandler = interactivityService.ISelectionHandler;
import IBehaviorOptions = interactivityService.IBehaviorOptions;
import BaseDataPoint = interactivityService.BaseDataPoint;

import { BulletchartSettings } from "./settings";
import { BarRect, BarValueRect } from "./dataInterfaces";

export interface BulletBehaviorOptions extends IBehaviorOptions<BaseDataPoint> {
    rects: Selection<any>;
    valueRects: Selection<any>;
    clearCatcher: Selection<any>;
    interactivityService: IInteractivityService<BaseDataPoint>;
    bulletChartSettings: BulletchartSettings;
    hasHighlights: boolean;
}

export class BulletWebBehavior implements IInteractiveBehavior {
    private static DimmedOpacity: number = 0.4;
    private static DefaultOpacity: number = 1.0;

    private static getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
        if ((hasPartialHighlights && !highlight) || (hasSelection && !selected))
            return BulletWebBehavior.DimmedOpacity;
        return BulletWebBehavior.DefaultOpacity;
    }

    private options: BulletBehaviorOptions;

    public bindEvents(options: BulletBehaviorOptions, selectionHandler: ISelectionHandler) {
        this.options = options;
        let clearCatcher = options.clearCatcher;

        options.valueRects.on("click", (d: BarValueRect) => {
            selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
        });

        options.rects.on("click", (d: BarRect) => {
            selectionHandler.handleSelection(d, (d3.event as MouseEvent).ctrlKey);
        });

        clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();
        });
    }

    public renderSelection(hasSelection: boolean) {
        let options = this.options;
        let hasHighlights = options.hasHighlights;

        options.valueRects.style("opacity", (d: BarValueRect) =>
            BulletWebBehavior.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));

        options.rects.style("opacity", (d: BarRect) =>
            BulletWebBehavior.getFillOpacity(d.selected, d.highlight, !d.highlight && hasSelection, !d.selected && hasHighlights));
    }
}