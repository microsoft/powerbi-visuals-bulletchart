// d3
import { Selection } from "d3-selection";
type d3Selection<T1, T2 = T1> = Selection<any, T1, any, T2>;

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
    rects: d3Selection<any>;
    valueRects: d3Selection<any>;
    clearCatcher: d3Selection<any>;
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

        options.valueRects.on("click", (event: MouseEvent, d: BarValueRect) => {
            selectionHandler.handleSelection(d, event.ctrlKey || event.metaKey);
        });

        options.rects.on("click", (event: MouseEvent, d: BarRect) => {
            selectionHandler.handleSelection(d, event.ctrlKey || event.metaKey);
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