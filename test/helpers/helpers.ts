
import { RgbColor, parseColorString } from "powerbi-visuals-utils-colorutils";

export function areColorsEqual(firstColor: string, secondColor: string): boolean {
    const convertedFirstColor: RgbColor = parseColorString(firstColor),
        convertedSecondColor: RgbColor = parseColorString(secondColor);

    return convertedFirstColor.B === convertedSecondColor.B
        && convertedFirstColor.G === convertedSecondColor.G
        && convertedFirstColor.R === convertedSecondColor.R;
}

export function isColorAppliedToElements(
  elements: SVGElement[],
  color?: string,
  colorStyleName: string = "fill"
): boolean {
  return elements.some((element: SVGElement) => {
    const currentColor: string = element.style[colorStyleName];

    if (!currentColor || !color) {
      return currentColor === color;
    }

    return areColorsEqual(currentColor, color);
  });
}