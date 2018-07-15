
import RgbColor = powerbi.extensibility.utils.test.helpers.color.RgbColor;
import parseColorString = powerbi.extensibility.utils.test.helpers.color.parseColorString;

module powerbi.extensibility.visual.test.helpers {
    export function areColorsEqual(firstColor: string, secondColor: string): boolean {
        const convertedFirstColor: RgbColor = parseColorString(firstColor),
            convertedSecondColor: RgbColor = parseColorString(secondColor);

        return convertedFirstColor.B === convertedSecondColor.B
            && convertedFirstColor.G === convertedSecondColor.G
            && convertedFirstColor.R === convertedSecondColor.R;
    }

    export function isColorAppliedToElements(
        elements: JQuery[],
        color?: string,
        colorStyleName: string = "fill"
    ): boolean {
        return elements.some((element: JQuery) => {
            const currentColor: string = element.css(colorStyleName);

            if (!currentColor || !color) {
                return currentColor === color;
            }

            return areColorsEqual(currentColor, color);
        });
    }
}