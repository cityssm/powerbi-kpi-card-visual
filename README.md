# City of Sault Ste. Marie Power BI Visual

This project is a simple Card Visual for displaying Key Performance Indicators.  
It is designed to show a single row of data.

It requires 9 Data Points be provided:

0. Heading Text (String)
1. Center Value (Number)
2. Footer Top Text (String)
3. Footer Botom Text (String)
4. Trend Value (Percentage)
5. Trend Direction (String) (Options: "up" | "down")
6. Information Tooltip Text (String)
7. Trend Tooltip Text (String)
8. Accessibility Text (String)

This package includes a set of 105 SVG [Lucide Icons](https://lucide.dev/icons/)

## Install

- Assign Power BI Pro/Premium License
- Import the .pbiviz file from the \dist folder

## Modify

- Assign Power BI Pro/Premium License
- Install Node.JS
- Install pbiviz
  - npm i -g powerbi-visuals-tools@latest
- Enable Power BI developer Mode in an Online Project
- Clone this project
- Run pbiviz start to test the visual in your Online Environment
- Run pbiviz package to build the visual
- Open Power BI Desltop and Import the Package in the dist folder.

## Example Cards

![image](https://github.com/user-attachments/assets/e81b46b1-d20a-42d4-8f3f-5808f6a82088)

## Text, Style, and Data Configuration Examples:

![image](https://github.com/user-attachments/assets/c5d7b885-d899-4aba-bfcb-a8169a5c5d3b)

## Run

- pbiviz start

## Package

- pbiviz package
