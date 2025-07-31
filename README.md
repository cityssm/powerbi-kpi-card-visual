# City of Sault Ste. Marie Power BI Card Visual

This project is a simple Card Visual for displaying Key Performance Indicators.  
It is designed to show a single row of data.

<img width="612" height="359" alt="image" src="https://github.com/user-attachments/assets/23006cab-4160-431c-b359-5835444391a7" />

## Data Requirements

It requires 9 Data Points be provided:

0. Heading Text (String)
1. Center Value (Number)
2. Footer Top Text (String)
3. Footer Botom Text (String)
4. Trend Value (String)
5. Trend Direction (String) (Options: "up-negative" | "up-positive" | "down-positive" | "down-negative")
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
- Navigate to the Local Host URL, normally [localhost:8080](https://localhost:8080/)
- Accept the Self Signed SSL certificate
- Run pbiviz package to build the visual
- Open Power BI Desltop and Import the Package from the dist folder.
  
## Run

- pbiviz start

## Package

- pbiviz package

## Example Cards

<img width="1180" height="734" alt="image" src="https://github.com/user-attachments/assets/16d64c40-d7e9-4dec-8627-c086c00eb87b" />


## Text, Style, and Data Configuration Examples:

<img width="1231" height="809" alt="image" src="https://github.com/user-attachments/assets/d56b3f62-1880-4d30-9da8-5ae508e2b972" />



## Example Massaged Data:

0. Transit Ridership
1. 801,833
2. Measured
3. June 2025
4. 20%
5. down-negative
6. The number of individuals accessing city transit services
7. This is a decrease of 20% when compared to the June 2024 value of 1,007,344
8. Transit Ridership, 801,833, Measured June 2025, This is a decrease of 20% when compared to the June 2024 value of 1,007,344

## Example Raw Data

| "index" | "kpi_department"     | "colour"           | "kpi_group_name"    | "kpi_description"                                           | "kpi_value_type" | "kpi_date_heading" | "kpi_change_orientation" | "kpi_name"          | "kpi_current_date" | "kpi_current_fiscal_year" | "kpi_current_period" | "kpi_current_value" | "kpi_last_fiscal_year_date" | "kpi_last_fiscal_year" | "kpi_last_fiscal_year_period" | "kpi_last_fiscal_year_value" | "kpi_last_fiscal_year_growth_from_current_year" | "kpi_previous_period_date" | "kpi_previous_period_fiscal_year" | "kpi_previous_period_value" | "kpi_previous_period_growth_from_current_period" |
| ------- | -------------------- | ------------------ | ------------------- | ----------------------------------------------------------- | ---------------- | ------------------ | ------------------------ | ------------------- | ------------------ | ------------------------- | -------------------- | ------------------- | --------------------------- | ---------------------- | ----------------------------- | ---------------------------- | ----------------------------------------------- | -------------------------- | --------------------------------- | --------------------------- | ------------------------------------------------ |
| 15      | "Community Services" | "#DC6B2F - Orange" | "Transit Ridership" | "The number of individuals accessing city transit services" | "Number"         | "Measured"         | "Positive"               | "Transit Ridership" | "2025-06-30"       | 2025                      | "Q2"                 | 801833              | "2024-06-30"                | 2024                   | "Q2"                          | 1007344                      | -0.20401273050715546                            | "2025-03-31"               | 2025                              | 422571                      | 0.8975107141758426                               |

## Example Power Query Adjustments
```
= Table.AddColumn(#"Changed Type", "KPI_Formatted_Value", each Number.ToText([kpi_current_value], if [kpi_value_type] = "Currency" then  "$#,##0;($#,##0)" else if [kpi_value_type] = "Percentage" then "#,##0%;($#,##0)" else "#,##0;($#,##0)"))
```
```
= Table.AddColumn(#"Added Formatted Value Column", "KPI_Formatted_Last_Year_Value", each Number.ToText([kpi_last_fiscal_year_value], if [kpi_value_type] = "Currency" then "$#,##0;($#,##0)" else if [kpi_value_type] = "Percentage" then "#,##0%;($#,##0)" else "#,##0;($#,##0)"))
```
```
= Table.AddColumn(#"Formatted Last Year Value", "KPI_Current_Formatted_Date", each try Date.ToText([kpi_current_date], [Format="MMMM yyyy"]) otherwise "Unknown")
```
```
= Table.AddColumn(#"Formatted Date Column", "KPI_Previous_Year_Formatted_Date", each try Date.ToText([kpi_last_fiscal_year_date], [Format="MMMM yyyy"]) otherwise "Unknown")
```
```
= Table.AddColumn(#"Formatted Previous Date Column", "KPI_Formatted_Trend", each Number.ToText([kpi_last_fiscal_year_growth_from_current_year], "#,##0%;#,##0%"))
```
```
= Table.AddColumn(#"Added Formatted Trend Column", "KPI_Formatted_Description", each if [kpi_description] = null then "No Description Provided" else [kpi_description])
```
```
= Table.AddColumn(#"Added Formatted Description Column", "KPI_Formatted_Trend_Direction", each try
    if [kpi_last_fiscal_year_growth_from_current_year] > 0 and [kpi_change_orientation] = "Positive" then "up-positive" else
    if [kpi_last_fiscal_year_growth_from_current_year] > 0 and [kpi_change_orientation] = "Negative" then "up-negative" else
    if [kpi_last_fiscal_year_growth_from_current_year] < 0 and [kpi_change_orientation] = "Positive" then "down-negative" else
    if [kpi_last_fiscal_year_growth_from_current_year] < 0 and [kpi_change_orientation] = "Negative" then "down-positive" else "" otherwise "")
```
```
= Table.AddColumn(#"Added Change Direction Column", "KPI_Formatted_Trend_Description", each if [KPI_Formatted_Trend_Direction] = "" then "" else "This is " & (if [KPI_Formatted_Trend_Direction] = "up-positive" or [KPI_Formatted_Trend_Direction] = "up-negative" then "an increase" else if [KPI_Formatted_Trend_Direction] = "down-positive" or [KPI_Formatted_Trend_Direction] = "down-negative" then "a decrease" else "") & " of " & [KPI_Formatted_Trend] & " when compared to the " & [KPI_Previous_Year_Formatted_Date] & " value of " & [KPI_Formatted_Last_Year_Value] )
```
```
= Table.AddColumn(#"Added Trend Description", "Accessibility", each [kpi_group_name] & ", " & [KPI_Formatted_Value] & ", " & [kpi_date_heading] & " " & [KPI_Current_Formatted_Date] & ", " & [KPI_Formatted_Trend_Description] )
```
```
= Table.RenameColumns(#"Added Concatenated Accessibility Column",{{"kpi_group_name", "KPI_0_Name"}, {"KPI_Formatted_Value", "KPI_1_Formatted_Value"}, {"kpi_date_heading", "KPI_2_Date_Heading"}, {"KPI_Current_Formatted_Date", "KPI_3_Current_Formatted_Date"}, {"KPI_Formatted_Trend", "KPI_4_Trend"}, {"KPI_Formatted_Trend_Direction", "KPI_5_Trend_Direction"},{"KPI_Formatted_Description", "KPI_6_Description_ToolTip"},{"KPI_Formatted_Trend_Description", "KPI_7_Description_Trend"}, {"Accessibility", "KPI_8_Accessibility"}})
```
