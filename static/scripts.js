// Google Map
var map;

// markers for map
var markers = [];

var marker;

// id
var marker_counter = 0;

// info window
var info = new google.maps.InfoWindow();

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

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 42.3740, lng: -71.1170},  // Harvard yard
        disableDefaultUI: true,
        // mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 22,
        panControl: true,
        // styles: styles,
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

        $('#position').val(event.latLng.lat() + ', ' + event.latLng.lng());
        placeMarker(event.latLng);
        // adds marker
        // addMarker(event.latLng);
    });

    // for (var i = 0; i < marker_data.length; i++) {
    //     var lat = marker_data[i]['latitude'];
    //     var long = marker_data[i]['longitude'];

    //     latLng = new google.maps.LatLng(lat, long);
    //     var marker = new google.maps.Marker({
    //         map: map,
    //         position: latLng
    //     });
    // };

    $("#submitButton").click(function (event) {
        console.log("event:", event);
        // you need post form or form data by javascript
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
                // you need add marker that was submitted
                let eventData = {
                    id: data.eventID,
                    eventType: $('#eventType').val(),
                    eventName: $('#eventName').val(),
                    latitude: marker.position.lat(), 
                    longitude: marker.position.lng()
                    
                };
                addMarker(eventData);
            },
            error: function (request, status, error) {
                console.log('submit error:', request.responseText);

                alert('Error: One or more invalid or empty fields');
            }

        });

    });
    

    google.maps.event.addListener(info, 'domready', function () {
        let button = document.getElementById('deleteButton');
        let id = parseInt(button.getAttribute('data-id'));  
        button.onclick = function() {
            deleteMarker(id);
        };
    });

    $.getJSON(Flask.url_for("query"))
    .done(function(data, textStatus, jqXHR) {

        // console.log('worked', data);
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


// function that builds a list of articles. 
function buildArticleList(articles) {
    var list = [];
    articles.forEach(function(article) {
        // append each article to list in this format
        list.push(`<li><a href="${article.link}">${article.title}</a></li>`);
    });
    // envelope in the ul tags
    return '<ul>' + list.join('') + '</ul>';
}

function addSQLMarker(position) {
    var marker = new google.maps.Marker({
        map: map,
        position: {lat: position.lat, lng: position.lng}
    })

    // var contentString = '<div id="content">'+
    //     '<div id="siteNotice">'+
    //     '</div>'+
    //     '<h1 id="firstHeading" class="firstHeading">plz work</h1>'+
    //     '</div>'+
    //     '</div>';
    var contentString = 'lolol'
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });
}



/**
* places 1 marker and one marker only when I click on the map
*/
function placeMarker(location) {
  if ( marker ) {
    marker.setPosition(location);
  } else {
    marker = new google.maps.Marker({
      position: location,
      map: map
    });
  }
}

/**
 * Adds marker for place to map.
 */
 function addMarker(data) {
    // marker_counter ++;
    let mk = new google.maps.Marker({
        map: map,
        position: {"lat": data.latitude,"lng": data.longitude},
        id: data.id
    });
    // console.log(mk);
    markers.push(mk);
    let deleteButton = '<button id="deleteButton" data-id="' + data.id + '">Delete</button>' +
    '<p>' + data.eventType + '</p>' +
    '<p>' + data.eventName + '</p>';

    google.maps.event.addListener(mk, 'click', function () {
        info.setContent(deleteButton);
        info.open(map, mk);
    });
 }

// function addMarker(place)
// {
//     // make marker variable
//     var marker = new google.maps.Marker({
//         map: map,
//         // position: {lat: place.latitude, lng: place.longitude},
//         position: place, // from gmaps API
//         animation: google.maps.Animation.DROP,
//         // label: place.lng()+ ", " + place.lng()
//     });
//     var infowindow = new google.maps.InfoWindow({
//         content: place.lng()+ ", " + place.lng()
//     });

//     // add listener to that marker
//     marker.addListener('click', function() {
//         infowindow.open(map, marker);
//     });
    
//     // add to markers, a marker!
//     markers.push(marker);
//     console.log(markers);
    
//     // allows clicking
//     marker.addListener('click', function() {
        
//         // get the json data of articles
//         var url = '/articles?geo=' + place.postal_code;
//         $.getJSON(url, function(articles) {
//             console.log('article', articles);
//             var content = buildArticleList(articles);
//             showInfo(marker, content);
//         });
//     });
// }


// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}


// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
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
    // $.getJSON(Flask.url_for("update"), parameters)
    // .done(function(data, textStatus, jqXHR) {

    //    // remove old markers from map
    //    removeMarkers();

    //    // add new markers to map
    //    for (var i = 0; i < data.length; i++)
    //    {
    //        addMarker(data[i]);
    //    }
    // })
    // .fail(function(jqXHR, textStatus, errorThrown) {

    //     // log error to browser's console
    //     console.log(errorThrown.toString());
    // });
};


/*
* getting variables from flask into html into this scripts.js file
*/
function myFunc(vars) {
    return vars
}
