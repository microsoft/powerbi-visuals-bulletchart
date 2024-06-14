# powerbi-visuals-bulletchart
[![build status](https://github.com/microsoft/powerbi-visuals-bulletchart/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/microsoft/powerbi-visuals-bulletchart/actions/workflows/build.yml)

> A bullet chart that includes four orientations and a few customization options. Use to feature a single measure against a qualitative range.

![Bullet chart screenshot](https://github.com/microsoft/powerbi-visuals-bulletchart/blob/main/assets/thumbnail.png?raw=true)
# Overview

Bullet chart serves as a replacement for dashboard gauges and meters. Bullet charts were developed to overcome the fundamental issues of gauges and meters.

The bullet chart features a single, primary measure (for example, current year-to-date revenue), compares that measure to one or more other measures to enrich its meaning (for example, compared to a target), and displays it in the context of qualitative ranges of performance, such as poor, satisfactory, and good. The qualitative ranges are displayed as varying intensities of a single hue to make them discernible by those who are color blind and to restrict the use of colors on the dashboard to a minimum.

Bullet charts may be horizontal or vertical, and may be stacked to allow comparisons of several measures at once.

The Bullet chart consists of 5 primary components:
* Text label: Your chart caption which defines what your chart is about and the unit of measurement.
* Quantitative Scale: Measures the value of your metric on a linear axis.
* The Featured Measure: The bar that displays the primary performance measure (eg: Revenue YTD).
* Comparative Measure: The measure against which you want to compare your featured measure (eg: Target revenue).
* Qualitative Scale: The background fill that encodes qualitative ranges like bad, satisfactory, and good.

See also [Bullet chart at Microsoft Office store](https://store.office.com/en-us/app.aspx?assetid=WA104380755&sourcecorrid=69216a8c-bd11-4cd0-9e5b-9c4e0469b74b&searchapppos=0&ui=en-US&rs=en-US&ad=US&appredirect=false)
