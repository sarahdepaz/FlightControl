﻿const updateDelay = 500;
let flightsId = [];
let dragEventCounter = 0;
let map;
let markersColor = [];
let allMarker = [];
let marker;
let flightPaths = new Map();
let flightPath;

if (typeof $ === 'undefined') {
    let string = 'jQuery must be included.';
    myAlert(string, 2500);
    //alert('jQuery must be included.');
}

function myAlert(msg, duration) {
    let el = document.createElement("div");
    el.setAttribute("style", "position:absolute;top:0%;left:45%;display:inline-block;background-color:white;height: 40px; width: 240px; vertical-align: middle;text-align: center;background-color: red;text-align: center;font-size: 18px;");
    el.innerHTML = msg;
    setTimeout(function () {
        el.parentNode.removeChild(el);
    }, duration);
    document.body.appendChild(el);
}



$(document).ready(function () {
    $(".drop_box").hide();
    updateFlightsTables();
    setInterval(updateFlightsTables, updateDelay);

    $("#internalFlightsTable").on("click", ".ibtnDel", deleteFlightClick);

    $(".flights").on("click", "td[informative]", flightClick);

    $(".flights").on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
        // Prevent default behavior (Prevent file from being opened)
        e.preventDefault();
        e.stopPropagation();
    });

    $(".flights").on('dragenter', flightsDragHandler);
    $(".flights").on('dragleave dragend drop', flightsDragEndHandler);
    $(".flights").on('drop', flightsDropHandler);

});

// initialize the map in the map section.
function initMap() {
    const uluru = { lat: -25.363, lng: 131.044 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: uluru
    });
}

// get flights from database and update the flights tables.
function updateFlightsTables() {
    const url = "/api/Flights?relative_to=" + new Date().toISOString().split('.')[0] + "Z" + "&sync_all";
    console.log(url);
    $.ajax({
        url: url,
        success:
            function (flights) {

                //delete all markers in the map
                for (i = 0; i < allMarker.length; i++) {
                    allMarker[i].setMap(null);
                }
                allMarker = [];

                let newFlightsId = [];

                // insert new flights to tables
                for (const flight of flights) {
                    if (flight === null) {
                        continue;
                    }

                    newFlightsId.push(flight.flight_id);
                    if (!$("#" + flight.flight_id).length) {
                        const flightSource = flight.is_external ? "external" : "internal";
                        $("#" + flightSource + "FlightsTable tbody").append(flightToTableRowHTML(flight));
                    }

                // draw route
                    const myLatLng = new google.maps.LatLng(flight.latitude, flight.longitude);
                    addMarker(myLatLng, flight);
                }

                // remove deleted flights from tables
                for (const flightId of flightsId) {
                    if (!newFlightsId.includes(flightId)) {
                        // if the row is bold
                        if (flightIsBold(flightId)) {
                            flightUnbold(flightsId);
                        }

                        // remove the flight from table
                        $("#" + flightId).remove();

                        ////delete all route 
                        //for (let [key, value] of flightPaths.entries()) {
                        //    value.setMap(null);
                        //}


                        // delete route
                        for (let [key, value] of flightPaths.entries()) {
                            if (key === flightId) {
                                value.setMap(null);
                                flightPaths.delete(key)
                            }
                    }



                //remove marker on the map
                    for (let i = 0; i < allMarker.length; i++) {
                        if (allMarker[i].get('store_id') === flightId) {
                            allMarker[i].setMap(null);
                            //remove from array
                            allMarker.splice(i, 1);
                            //remove from array color
                            const index = array.indexOf(flightId);
                            markersColor.splice(index, 1);
                        }
                    }
                }
            }

                flightsId = newFlightsId;
},
error: function (request) {
    let string1 = request.responseText;
    myAlert(string1, 2500);
    //alert(request.responseText);
}
//error: function (xhr) { alert("Request Error!!\nURL: " + url + "\nError: " + xhr.status + " - " + xhr.title); },
});
}

// add flight according to the given flight plan text.
function addNewFlightPlan(flightPlanText) {
    if (!isJson(flightPlanText)) {
        let str = "the text is not in a json format";
        myAlert(str, 2500);
        //showAlert()
        //alert("the text is not in a json format");
    }
    else {
        const url = "/api/FlightPlan";

        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json",
            data: flightPlanText,
            success: function (data) {
                let str1 = "file uploaded successfuly";
                myAlert(str1, 2500);
                // alert("file uploaded successfuly");
                updateFlightsTables();
            },
            error: function (request) {
                let str2 = request.responseText + ". status code: 422";
                myAlert(str2, 2500);
                //alert(request.responseText + ". status code: 422");
            }

        });
    }
}

// get a flight and return its html table row.
function flightToTableRowHTML(flight) {
    let newRow = $("<tr id=" + flight.flight_id + ">");
    let cols = "";

    cols += '<td informative>' + flight.flight_id + '</td>';
    cols += '<td informative>' + flight.company_name + '</td>';

    if (!flight.is_external) {
        cols += '<td><input type="button" class="ibtnDel btn btn-md btn-danger "  value="X"></td>';
    }

    newRow.append(cols);

    return newRow;
}

// update the flight information in the flight info section.
function updateFlightInfo(flightId) {
    const url = "/api/FlightPlan/" + flightId;

    $.ajax({
        type: "GET",
        url: url,
        contentType: "application/json",
        success: function (flightPlan) {
            const start_loc = flightPlan.initial_location;
            const end_loc = flightPlan.segments[flightPlan.segments.length - 1];
            const start_time = new Date(start_loc.date_time);
            const end_time = new Date(start_time);

            for (const segment of flightPlan.segments) {
                end_time.setSeconds(end_time.getSeconds() + segment.timespan_seconds);
            }
            //for flightPlan table
            $("#flight_info_id").html(flightPlan.id);
            $("#flight_info_start_loc").html(start_loc.latitude + ", " + start_loc.longitude);
            $("#flight_info_end_loc").html(end_loc.latitude + ", " + end_loc.longitude);
            $("#flight_info_start_time").html(start_time.toISOString().split(".")[0] + "Z");
            $("#flight_info_end_time").html(end_time.toISOString().split(".")[0] + "Z");
            $("#flight_info_passengers").html(flightPlan.passengers);
            $("#flight_info_company").html(flightPlan.company_name);
        },
        error: function (xhr) {
            let st = "Request Error!\nURL: " + url + "\nError: " + xhr.status + " - " + xhr.title
            myAlert(st, 2500);
            //alert("Request Error!\nURL: " + url + "\nError: " + xhr.status + " - " + xhr.title);
        },
    });
}
//empty table
function emptyFlightInfo() {
    $("#flight_info_id").empty();
    $("#flight_info_start_loc").empty();
    $("#flight_info_end_loc").empty();
    $("#flight_info_start_time").empty();
    $("#flight_info_end_time").empty();
    $("#flight_info_time").empty();
    $("#flight_info_passengers").empty();
    $("#flight_info_company").empty();
}

// handle click on the delete button - delete the chosen flight.
function deleteFlightClick() {
    const rowToRemove = this.parentElement.parentElement;
    const flightId = rowToRemove.firstChild.textContent;
    const url = "/api/Flights/" + flightId;

    // deleting bolded row?
    if (flightIsBold(flightId)) {
        flightUnbold(flightId);
    }


    $.ajax({
        type: "DELETE",
        url: url,
        success:
            function () {
                rowToRemove.remove();
                let str5 = "flight " + flightId + " was deleted successfuly";
                myAlert(str5, 2500);
                //alert("flight " + flightId + " was deleted successfuly");

            },
        error: function (xhr) {
            let str6 = "Request Error!\nURL: " + url + "\nError: " + xhr.status + " - " + xhr.title;
            myAlert(str6, 2500);
            //alert("Request Error!\nURL: " + url + "\nError: " + xhr.status + " - " + xhr.title);
        },
    });
}

// handle click on a flight in the map or in the table.
function flightClick() {
    const row = this.parentElement;
    const flightId = row.firstChild.textContent;

    flightBold(flightId);
}


// handle dropped files.
function flightsDropHandler(ev) {
    ev = ev.originalEvent;
    dragEventCounter = 0;
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    for (const file of ev.dataTransfer.files) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            addNewFlightPlan(evt.target.result);
        };
        reader.onerror = function (evt) {
            console.log("error reading file");
        };
        reader.readAsText(file);
    }
}

// handle file dragging over flights tables.
function flightsDragHandler(ev) {
    $(".flights *").css("pointer-events", "none");
    dragEventCounter++;
    $(".internal").hide();
    $(".external").hide();
    $(".drop_box").show();
}

// handle file dragging over flights tables end.
function flightsDragEndHandler(ev) {
    dragEventCounter--;
    if (dragEventCounter === 0) {
        $(".drop_box").hide();
        $(".internal").show();
        $(".external").show();
        $(".flights *").css("pointer-events", "");
    }
}

// bold the flight with id 'flightId'.
function flightBold(flightId) {
    /////////////////////////////////////////////////////////////////////
    flightBoldMap(flightId);
    ////////////////////////////////////////////////////////////////////////
    // bold route
    updateMarker(flightId)
}

// unbold the flight with id 'flightId'.
function flightUnbold(flightId) {
    if (!flightIsBold(flightId)) {
        return;
    }

    $("#" + flightId).removeAttr("bold");
    emptyFlightInfo();
    //delete all route 
    for (let [key, value] of flightPaths.entries()) {
        value.setMap(null);
    }

}

// return true if the flight with id 'flightId' is bold.
function flightIsBold(flightId) {
    if ($("#" + flightId + "[bold]").length) {
        return true;
    }

    return false;
}

// return the bolded rows.
function flightsBoldedRows() {
    return $("tr[bold]");
}

// return true if the text is in json format, false otherwise.
function isJson(text) {
    try {
        JSON.parse(text);
    } catch (e) {
        return false;
    }

    return true;
}

//add marker
function addMarker(myLatLng, data) {
    let infoWindow = new google.maps.InfoWindow();
    let contentString;
    //pop up window marker
    contentString = "Flight ID:" + data.flight_id + "</br>Company Name:" + data.company_name;
    if (markersColor.includes(data.flight_id)) {
        marker = new google.maps.Marker({
            map: map,
            position: myLatLng,
            store_id: data.flight_id,
            icon: {
                url: "https://www.google.com/mapfiles/marker_green.png"
            }
        });
        infoWindow.setContent("<div style = 'width:200px;min-height:40px'>" + contentString + "</div>");
        infoWindow.open(map, marker);
    }
        //if the marker click
    else {
        marker = new google.maps.Marker({
            map: map,
            position: myLatLng,
            store_id: data.flight_id,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }
        });
    }
    allMarker.push(marker);
    //Attach click event to the marker.
    (function (marker, data) {
        google.maps.event.addListener(marker, "click", function (e) {
            if (infoWindow) infoWindow.close();
            //delete all route 
            for (let [key, value] of flightPaths.entries()) {
                value.setMap(null);
        }
            //reset all the markers and there color
            for (i = 0; i < allMarker.length; i++) {
                allMarker[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');

            }
        markersColor = [];
        //Change the marker icon
        marker.setIcon('https://www.google.com/mapfiles/marker_green.png');
        markersColor.push(data.flight_id);
        //Wrap the content inside an HTML DIV in order to set height and width of InfoWindow.
        infoWindow.setContent("<div style = 'width:200px;min-height:40px'>" + contentString + "</div>");
        infoWindow.open(map, marker);
        updateFlightInfo(data.flight_id)
        polyline(data, map, data.flight_id)
        flightBoldMap(data.flight_id)
    });
    //Attach click event to the map.
    google.maps.event.addDomListenerOnce(map, "click", function (e) {
        // deleting bolded row?
        if (flightIsBold(data.flight_id)) {
            flightUnbold(data.flight_id)
        }
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        markersColor.pop(data.flight_id);
        if (infoWindow) infoWindow.close();
        emptyFlightInfo()
        for (let [key, value] of flightPaths.entries()) {
            if (key === marker.get('store_id')) {
                value.setMap(null);
            }
    }
    });
})(marker, data);
}
// bold the flight with id 'flightId'.
function flightBoldMap(flightId) {
    if (flightIsBold(flightId)) {
        return;
    }

    for (const boldedRow of flightsBoldedRows()) {
        const boldedRowFlightId = boldedRow.firstChild.textContent;
        flightUnbold(boldedRowFlightId);
    }
    $("#" + flightId).attr("bold", "");
    updateFlightInfo(flightId);
}
function polyline(item, map, flight_id) {
    //let myMap = new Map();
    let route = [];
    let url = "/api/FlightPlan/"
    url = url.concat(flight_id);
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        success: function (data) {

            //Accessing dynamically multi levels object
            let level = "initial_location.latitude";
            level = level.split(".");
            let currentObjState = data;
            for (let i = 0; i < level.length; i++) {
                currentObjState = currentObjState[level[i]];
            }
            let level2 = "initial_location.longitude";
            level2 = level2.split(".");
            let currentObjState2 = data;
            for (i = 0; i < level2.length; i++) {
                currentObjState2 = currentObjState2[level2[i]];
            }
            route.push({ lat: currentObjState, lng: currentObjState2 });
            $.grep(data.segments, function (item) {
                route.push({ lat: item.latitude, lng: item.longitude });
                // myMap.set(item.latitude, item.longitude)
            });
            let coord = [];
            for (let i = 0; i < route.length; i++) {
                coord.push(new google.maps.LatLng(route[i].lat, route[i].lng));
            }
            /*
            for (let [value] of route.entries()) {
                coord.push(new google.maps.LatLng(value.lat, value.lan));
            }
            */
            flightPath = new google.maps.Polyline({
                path: coord,
                //geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            flightPath.setMap(map);
            flightPaths.set(item.flight_id, flightPath)
        },
    });
}
function updateMarker(flightId) {
    const url = "/api/FlightPlan/" + flightId;
    let infoWindow = new google.maps.InfoWindow();
    let contentString;
    $.ajax({
        type: "GET",
        url: url,
        contentType: "application/json",
        success: function (flight) {
            //reset all the markers and there color
            for (i = 0; i < allMarker.length; i++) {
                allMarker[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
                infoWindow.close();
            }
            markersColor = [];
            //delete all route 
            for (let [key, value] of flightPaths.entries()) {
                value.setMap(null);
        }
            contentString = "Flight ID:" + flightId + "</br>Company Name:" + flight.company_name;
    for (i = 0; i < allMarker.length; i++) {
        if (allMarker[i].get('store_id') === flightId) {
            //Change the marker icon
            allMarker[i].setIcon('https://www.google.com/mapfiles/marker_green.png');
            markersColor.push(flightId);
            //Wrap the content inside an HTML DIV in order to set height and width of InfoWindow.
            infoWindow.setContent("<div style = 'width:200px;min-height:40px'>" + contentString + "</div>");
            infoWindow.open(map, allMarker[i]);
            polyline(flight, map, flightId)
            updateFlightInfo(flightId)
        }
    }

},
});

}