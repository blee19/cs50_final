// Google Map
var map;

// markers for map
var markers = [];

// my clicking marker
var marker;

// keep track of markers
var marker_counter = 0;

// info window
var info = new google.maps.InfoWindow();

// https://developers.google.com/maps/documentation/javascript/styling
// execute when the DOM is fully loaded
$(function initmap() {

        // Create a new StyledMapType object, passing it an array of styles,
        // and the name to be displayed on the map type control.
        var styledMapType = new google.maps.StyledMapType(
            [
              {elementType: 'geometry', stylers: [{color: '#ebe3cd'}]},
              {elementType: 'labels.text.fill', stylers: [{color: '#523735'}]},
              {elementType: 'labels.text.stroke', stylers: [{color: '#f5f1e6'}]},
              {
                featureType: 'administrative',
                elementType: 'geometry.stroke',
                stylers: [{color: '#c9b2a6'}]
              },
              {
                featureType: 'administrative.land_parcel',
                elementType: 'geometry.stroke',
                stylers: [{color: '#dcd2be'}]
              },
              {
                featureType: 'administrative.land_parcel',
                elementType: 'labels.text.fill',
                stylers: [{color: '#ae9e90'}]
              },
              {
                featureType: 'landscape.natural',
                elementType: 'geometry',
                stylers: [{color: '#dfd2ae'}]
              },
              {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{color: '#dfd2ae'}]
              },
              {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{color: '#93817c'}]
              },
              {
                featureType: 'poi.park',
                elementType: 'geometry.fill',
                stylers: [{color: '#a5b076'}]
              },
              {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{color: '#447530'}]
              },
              {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{color: '#f5f1e6'}]
              },
              {
                featureType: 'road.arterial',
                elementType: 'geometry',
                stylers: [{color: '#fdfcf8'}]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{color: '#f8c967'}]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{color: '#e9bc62'}]
              },
              {
                featureType: 'road.highway.controlled_access',
                elementType: 'geometry',
                stylers: [{color: '#e98d58'}]
              },
              {
                featureType: 'road.highway.controlled_access',
                elementType: 'geometry.stroke',
                stylers: [{color: '#db8555'}]
              },
              {
                featureType: 'road.local',
                elementType: 'labels.text.fill',
                stylers: [{color: '#806b63'}]
              },
              {
                featureType: 'transit.line',
                elementType: 'geometry',
                stylers: [{color: '#dfd2ae'}]
              },
              {
                featureType: 'transit.line',
                elementType: 'labels.text.fill',
                stylers: [{color: '#8f7d77'}]
              },
              {
                featureType: 'transit.line',
                elementType: 'labels.text.stroke',
                stylers: [{color: '#ebe3cd'}]
              },
              {
                featureType: 'transit.station',
                elementType: 'geometry',
                stylers: [{color: '#dfd2ae'}]
              },
              {
                featureType: 'water',
                elementType: 'geometry.fill',
                stylers: [{color: '#b9d3c2'}]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{color: '#92998d'}]
              }
            ],
            {name: 'Styled Map'});

    // options for map, configure map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 42.3740, lng: -71.1170},  // Harvard Yard
        disableDefaultUI: true,
        maxZoom: 22,
        panControl: true,
        zoom: 17, // 17 is just right to get whole yard in website frame
        zoomControl: true, // creates +/- sign on side of map to control zoom
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',
                         'styled_map']
        }
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    //Associate the styled map with the MapTypeId and set it to display.
    map.mapTypes.set('styled_map', styledMapType);
    map.setMapTypeId('styled_map');

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

    google.maps.event.addListener(map, "click", function(event) {
        // this fits in the value in the html tag of id 'position' with 
        // the values of the event's lat and lng, automatically updating
        // the view of the marker's current position
        $('#position').val(event.latLng.lat() + ', ' + event.latLng.lng());
        placeMarker(event.latLng);
    });

    // on submit button click:
    // #submitButton is id of button tag in index.html
    // when submit button is clicked
    $("#submitButton").click(function (event) {
        event.preventDefault();

        window.form_data = $('#form').serialize();
        console.log("form data:", form_data);
        console.log('marker:', marker);
        $.ajax({
            url: '/submit',
            type: 'post',
            dataType: 'json',
            data: form_data,
            success: function(data) {
                console.log('eventID:', data);
                // submit these data in json to addMarker
                let eventData = {
                    id: data.eventID,
                    eventType: $('#eventType').val(),
                    event_name: $('#eventName').val(),
                    latitude: marker.position.lat(), 
                    longitude: marker.position.lng(),
                    date_time: $('#datetimepicker').val()
                };
                // add marker with correct information
                addMarker(eventData);
            },
            error: function (request, status, error) {
                console.log('submit error:', request.responseText);

                alert('Error: One or more invalid or empty fields');
            }

        });

    });
    
    // delete marker when delete button is clicked
    google.maps.event.addListener(info, 'domready', function () {
        let button = document.getElementById('deleteButton');
        let id = parseInt(button.getAttribute('data-id'));  
        button.onclick = function() {
            deleteMarker(id);
        };
    });

    // when page is refreshed, it goes to this url
    $.getJSON(Flask.url_for("query"))
    .done(function(data, textStatus, jqXHR) {

        console.log('worked', data);
        // call typeahead's callback with search results (i.e., places)
        for (let k = 0; k < data.length; k++) {
            console.log("data", data[k]);
            addMarker(data[k]);
            
        };
    
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log('fail', errorThrown);

        // call typeahead's callback with no results
        
    });

    // makes the submit button darker if you hover over it
    $(document).ready(function() {
        $('button').mouseenter(function() {
            $('button').fadeTo('fast', 1);
        });
        
        $('button').mouseleave(function() {
            $('button').fadeTo('fast', 1);
        });
    });
});

// delete marker 
function deleteMarker(markerId) {
    let parameters = {
        eventID: markerId
    };

    $.getJSON(Flask.url_for("delete"), parameters)
        .done(function(data, textStatus, jqXHR) {
            // server delete successfuly, you will need to delete it from browser screen

            for (let i=0; i<markers.length; i++) {
                
                if (markers[i].id === markerId) {
                    console.log(markerId, markers[i]);
                    markers[i].setMap(null);
                }
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {

            // log error to browser's console
            console.log(errorThrown.toString());
        });
}

/**
* places 1 marker and one marker only when I click on the map
*/
function placeMarker(location) {
    // custom icon
    var image = {
        url: 'http://maps.google.com/mapfiles/ms/micons/blue-pushpin.png',
        size: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(16, 32)
    }
    if ( marker ) {
        marker.setPosition(location);
    } else {
        marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: image
        });
    }
}

/**
 * Adds marker for place to map.
 */
 function addMarker(data) {

    if (data.eventType === 'Free Food Event') {
        var icon = 'http://maps.google.com/mapfiles/ms/micons/restaurant.png'

    } else if (data.eventType === 'Academic Event') {
        var icon = {
            url: 'http://maps.google.com/mapfiles/kml/pal3/icon30.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 32)
        }

    } else if (data.eventType === 'Celebrity Sighting'){
        var icon = {
            url: 'https://d30y9cdsu7xlg0.cloudfront.net/png/21661-200.png',
            scaledSize: new google.maps.Size(28, 28),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 32)
        }

    } else {
        var icon = {
            url: 'http://www.freeiconspng.com/uploads/turkey-thanksgiving-png-0.png',
            scaledSize: new google.maps.Size(29, 29),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 32)
        }
    }

    let mk = new google.maps.Marker({
        map: map,
        position: {"lat": data.latitude,"lng": data.longitude},
        id: data.id,
        icon: icon
    });
    // console.log(mk);
    markers.push(mk);
    let deleteButton = '<p> <b>' + data.event_name + ' </b> </p>' +
    '<p>' + data.eventType + '</p>' +
    '<p>' + data.date_time + '</p>' +
    '<button id="deleteButton" data-id="' + data.id + '">Delete</button>';

    google.maps.event.addListener(mk, 'click', function () {
        info.setContent(deleteButton);
        info.open(map, mk);
    });
 }

/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {

        // if info window isn't open
        // http://stackoverflow.com/a/12410385
        if (!info.getMap || !info.getMap())
        {
            update();
        }
    });
 
    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // remove markers whilst dragging
    google.maps.event.addListener(map, "dragstart", function() {
        // removeMarkers();
    });

    // configure typeahead
    $("#q").typeahead({
        highlight: false,
        minLength: 1
    },
    {
        display: function(suggestion) { return null; },
        limit: 10,
        source: search,
        templates: {
            suggestion: Handlebars.compile(
                
                // straight from Malan's mouth
                "<div>" +
                "{{place_name}}, {{admin_name1}}, {{postal_code}}" +
                "</div>"
            )
        }
    });

    // re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // set map's center
        map.setCenter({lat: parseFloat(suggestion.latitude), lng: parseFloat(suggestion.longitude)});

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        info.close();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    // for marker, set null
    for(let i = 0; i< markers.length; i++) {
        markers[i].setMap(null);
    }
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, syncResults, asyncResults)
{
    // get places matching query (asynchronously)
    let parameters = {
        q: query
    };
    $.getJSON(Flask.url_for("search"), parameters)
    .done(function(data, textStatus, jqXHR) {
     
        // call typeahead's callback with search results (i.e., places)
        asyncResults(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());

        // call typeahead's callback with no results
        asyncResults([]);
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) == "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='/static/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    let parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };

};


/*
* getting variables from flask into html into this scripts.js file
*/
function myFunc(vars) {
    return vars
}
