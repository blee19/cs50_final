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

        // prevents website/submit from opening
        event.preventDefault();

        window.form_data = $('#form').serialize();

        // ajax post request for the submit sub-url
        $.ajax({
            url: '/submit',
            type: 'post',
            dataType: 'json',
            data: form_data,

            // if successful, run this function
            success: function(data) {

                // submit these data in json to addMarker
                let eventData = {
                    id: data.eventID,
                    event_type: $('#eventType').val(),
                    event_name: $('#eventName').val(),
                    latitude: marker.position.lat(), 
                    longitude: marker.position.lng(),
                    date_time: $('#datetimepicker').val()
                };
                // add marker with correct information
                addMarker(eventData);
            },
            // if error, report that submitting is not possible
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

    // when page is refreshed, it goes to this url, pulls a json of the previously added markers
    $.getJSON(Flask.url_for("query"))
    .done(function(data, textStatus, jqXHR) {
        // add marker for each saved event
        for (let k = 0; k < data.length; k++) {
            addMarker(data[k]);
        };
    })
    // in case it fails
    .fail(function(jqXHR, textStatus, errorThrown) {
        // log error to browser's console
        console.log('fail', errorThrown);       
    });
});

// delete marker function
function deleteMarker(markerId) {
    let parameters = {
        eventID: markerId
    };

    $.getJSON(Flask.url_for("delete"), parameters)
        .done(function(data, textStatus, jqXHR) {
            // after server deletes from sql successfully, I will need to delete it from map screen
            for (let i=0; i<markers.length; i++) {
                
                if (markers[i].id === markerId) {
                    markers[i].setMap(null);
                }
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {

            // if fail, log error to browser's console
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
 * Adds marker for each submitted event to map.
 */
 function addMarker(data) {
    // change the icon for each type of event
    if (data.event_type === 'Free Food Event') {
        var icon = 'http://maps.google.com/mapfiles/ms/micons/restaurant.png'

    } else if (data.event_type === 'Academic Event') {
        var icon = {
            url: 'http://maps.google.com/mapfiles/kml/pal3/icon30.png',
            size: new google.maps.Size(32, 32),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 32)
        }

    } else if (data.event_type === 'Celebrity Sighting'){
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
    // instantiate that marker
    let mk = new google.maps.Marker({
        map: map,
        position: {"lat": data.latitude,"lng": data.longitude},
        id: data.id,
        icon: icon
    });

    // push globally
    markers.push(mk);

    // create the info window
    let info_window = '<p> <b>' + data.event_name + ' </b> </p>' +
    '<p>' + data.event_type + '</p>' +
    '<p>' + data.date_time + '</p>' +
    '<button id="deleteButton" data-id="' + data.id + '">Delete</button>';

    // click on event - get that info_window
    google.maps.event.addListener(mk, 'click', function () {
        info.setContent(info_window);
        info.open(map, mk);
    });
}