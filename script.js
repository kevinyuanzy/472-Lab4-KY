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

// Use fetch function to access geojson file from the online repository
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

    map.addSource('CollisionPts', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/kevinyuanzy/472-Lab4-KY/refs/heads/main/data/pedcyc_collision_06-21.geojson' // The URL to my GeoJson polygon.
    });

    map.addLayer({
        'id': 'collision-points', 
        'type': 'circle', 
        'source': 'CollisionPts',
        'paint': {
            'circle-color': '#ff1a1a',
            'circle-radius': 3 
        },
    });

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
                10, '#fc4e2a', // Colours assigned to values >= each step
                20, '#e31a1c',
                30, '#bd0026',
                maxcollisions, '#000000'
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': 'black',
        },
        filter: ["!=", "COUNT", 0],
    });

})






// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


