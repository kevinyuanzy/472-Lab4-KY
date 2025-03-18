/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/

// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia2V2aW55dWFuenkiLCJhIjoiY201eHprYXU0MGZwejJsb242Y3Nza25oYyJ9.h05hqdnqlx2BwgwbQNuKCg'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/kevinyuanzy/cm6ztbpqc003s01qwcvdrf6ft',  // ****ADD MAP STYLE HERE *****
    center: [-79.390520, 43.710258],  // starting point, longitude/latitude
    zoom: 10.5 // starting zoom level
});

//Add search control to map overlay
//Requires plugin as source in HTML body
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        countries: "ca"
    })
);

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

// Create empty variable to hold point features
let collisiongeojson;

// Use fetch function to access geojson file of collision cases from the online repository
// Convert the response to JSON format and then store the response in the variable
fetch("https://raw.githubusercontent.com/kevinyuanzy/472-Lab4-KY/refs/heads/main/data/pedcyc_collision_06-21.geojson")
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        collisiongeojson = response; // Store geojson as variable using URL from fetch response
    });


/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function
//      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
//                Consider return types from different turf functions and required argument types carefully here

// Add map event handler
map.on('load', () => {

    

    // Create a bounding box around the collision point data

    let envresult = turf.envelope(collisiongeojson);
    console.log(envresult.bbox)

    // Enlarge the bounding box by 10 percent
    let bboxscaled = turf.transformScale(envresult, 1.1);
    console.log(bboxscaled)

    // Access and store the bounding box coordinates
    // Stored as [minX, minY, maxX, maxY]
    let bboxcoords = [
        bboxscaled.geometry.coordinates[0][0][0],
        bboxscaled.geometry.coordinates[0][0][1],
        bboxscaled.geometry.coordinates[0][2][0],
        bboxscaled.geometry.coordinates[0][2][1],
    ];

    console.log(bboxcoords)

    // Create the hexgrid
    let hexdata = turf.hexGrid(bboxcoords, 0.5, {units: "kilometers"});
    console.log(hexdata)


    /*--------------------------------------------------------------------
    Step 4: AGGREGATE COLLISIONS BY HEXGRID
    --------------------------------------------------------------------*/
    //HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
    //      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

    // use turf.collect() to collect cases in each hexagon
    let collishex = turf.collect(hexdata, collisiongeojson, "id_", "values")

    console.log(collishex)

    // Create new variable to store max number of collision
    let maxcollisions = 0;

    // Count the cases in each hexagon
    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length;
        if (feature.properties.COUNT > maxcollisions) {
            maxcollisions = feature.properties.COUNT;
        }
    });

    map.addSource('CollisionGrid', {
        type: 'geojson',
        data: collishex // The URL to my GeoJson polygon.
    });
    
    // Add layer style to the map to represent park polygons.
    map.addLayer({
        'id': 'CollisionFill',
        'type': 'fill',
        'source': 'CollisionGrid',
        'paint': {
            'fill-color': [
                'step', // STEP expression produces stepped results based on value pairs
                ['get', 'COUNT'], // GET expression retrieves property value from 'population' data field
                '#ffffff', // Colour assigned to any values < first step
                1, '#F0F9E8', // Colours assigned to values >= each step
                6, '#CCEBC5',
                11, '#A8DDB5',
                16, '#7BCCC4',
                21, '#43A2CA',
                31, '#0868AC',
                maxcollisions, '#000000'
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': 'black',
        },
        filter: ["!=", "COUNT", 0],
    });

    map.addSource('CollisionPts', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/kevinyuanzy/472-Lab4-KY/refs/heads/main/data/pedcyc_collision_06-21.geojson' // The URL to my GeoJson polygon.
    });

    map.addLayer({
        'id': 'collision-points', 
        'type': 'circle', 
        'source': 'CollisionPts',
        'paint': {
            'circle-color': '#4F9E2B',
            'circle-radius': 2
        },
    });

    // /*--------------------------------------------------------------------
    // Step 5: FINALIZE YOUR WEB MAP
    // --------------------------------------------------------------------*/
    //HINT: Think about the display of your data and usability of your web map.
    //      Update the addlayer paint properties for your hexgrid using:
    //        - an expression
    //        - The COUNT attribute
    //        - The maximum number of collisions found in a hexagon
    //      Add a legend and additional functionality including pop-up windows

    //Change map layer display based on check box using setLayoutProperty method
    document.getElementById('layercheck').addEventListener('change', (e) => {
        map.setLayoutProperty(
            'collision-points',
            'visibility',
        e.target.checked ? 'visible' : 'none'
        );
    });

    //Create a popup, so the number of collision cases will appear when mouse clicks on features.
    map.on('click', 'CollisionFill', (e) => {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("Collision Count: " + e.features[0].properties.COUNT)          
            .addTo(map);
    });

    map.on('mouseenter', 'line2-completed-stations', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    
    map.on('mouseleave', 'line2-completed-stations', () => {
        map.getCanvas().style.cursor = '';
    });

    //Declare array variables for labels and colours
    const legendlabels = [
    '1-5',
    '6-10',
    '11-15',
    '16-20',
    '21-30',
    'Above 30',
    'Maximum collision'
    ];

    const legendcolours = [
    '#F0F9E8', 
    '#CCEBC5',
    '#A8DDB5',
    '#7BCCC4',
    '#43A2CA',
    '#0868AC',
    '#000000'
    ];

    //Declare legend variable using legend div tag
    const legend = document.getElementById('legend');

    //For each layer create a block to put the colour and label in
    legendlabels.forEach((label, i) => {
    const colour = legendcolours[i];

    const item = document.createElement('div'); //each layer gets a 'row' - this isn't in the legend yet, we do this later
    const key = document.createElement('span'); //add a 'key' to the row. A key will be the colour circle

    key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
    key.style.backgroundColor = colour; // the background color is retreived from teh layers array

    const value = document.createElement('span'); //add a value variable to the 'row' in the legend
    value.innerHTML = `${label}`; //give the value variable text based on the label

    item.appendChild(key); //add the key (colour cirlce) to the legend row
    item.appendChild(value); //add the value to the legend row

    legend.appendChild(item); //add row to the legend
    });
})









