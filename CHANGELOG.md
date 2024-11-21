## 2.5.0
### Visual changes
* Move "sync axis" and "show only main axis" settings to "Axis" card
* Add font setttings for measure units and axis
* Add an 'auto width' toggle for category labels. When enabled, this feature dynamically adjusts the label width to ensure all category names are fully visible without truncation.

### Code improvements
* Fix sync axis by computing min and max category values
* When showing main axis only, reduce space between bars to save more place
* Remove interactivity-utils
* Add settings to control axis display format and precision
* Add settings to control bar size and to show percent of completion
* Add settings to control the gap size between bars
* Add "Legend" settings card
* Update API to 5.11.0, tools to 5.6.0
* Migrate to eslint v9

## 2.4.2
* Check old enums with space like "Horizontal left" to maintain backward compatibility
* Update API to 5.9.0

## 2.4.1
* Packages update
* Fixed tests with measureUnits
* Fixed eslint errors

## 2.4.0
* Update powerbi packages, API to 5.7.0
* Migrate from tslint to eslint
* Use new formatting model API
* Split d3 into submodules to reduce dependencies size
* Add keyboard navigation support
* Add settings to sync axis

## 2.0.1
 * Packages update

## 2.0.0
 * Webpack integration
 * Azure Pipelines integration
 * API 2.5.0
 * updated powerbi-visuals-utils, powerbi-visuals-tools 3.x.x
 * d3 v5

## 1.8.1
* Fixed visual's fail on data with empty category field
## 1.8.0
* Implements high contrast mode
* API 1.13.0

## 1.7.0
* Added localization for all supported languages

## 1.6.1
* UPD: moment library has been updated to 2.22.0

## 1.6.0
* UPD: powerbi-visuals-tools has been updated to 1.11.0 to support Bookmarks
* UPD: API has been updated to 1.11.0 to support Bookmarks
* UPD: powerbi-visuals-utils-interactivityutils has been updated to 3.1.0 to support Bookmarks
* UPD: powerbi-visuals-utils-testutils has been updated to "1.2.0" to support Bookmarks

## 1.5.2
* Fixed bug when not 0 minimum value calculated as 0

## 1.5.1
* Added check for null objects toString call

## 1.5.0
* Added new formatting options for tooltips custom names
* Added negative minimum values support

## 1.4.10
* Fixed Measure Units rendering

## 1.4.9
* Added new formatting option for Category labels "Maximum width" to adjust label width for horizontal oriented bullets.
* Horizontal oriented bullets now renders closer to each other when axis is off.
* Fixed axis tick labels overlapping.
* Visual is updated to API 1.7.0

## 1.4.8
* Bars' values respect selection of other visuals now.
