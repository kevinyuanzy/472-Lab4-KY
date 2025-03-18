# GGR472 Lab 4 by Kevin Yuan
This repository contains the Lab 4 website, documents used to create the website, and data it used.

## Repository Contents
The website is an interactive map showing the car collision data in Toronto, including points that indicating the locations of each collision case, and a hexgrid that includes a count of collision cases in each hexagon that made up the hexgrid. 

- `index.html`: HTML file to render the map and elements including information box containing checkbox, and legend. 
- `style.css`: CSS file for positioning the map interface and elements.
- `script.js`: JavaScript file containing code for constructing hexgrid and adding interactivity with map data layers based on HTML element events. 

## Functionalities
- Checkbox to hide collision location points to see the hexgrid more clearly
- Pop-up that display collision count for each hexagon
- Search control
- Zoom & rotation control
- Legend

## Data
- `pedcyc_collision_06-21.geojson`: location of collision cases between 2006 and 2021. This file is provided by the course material.
