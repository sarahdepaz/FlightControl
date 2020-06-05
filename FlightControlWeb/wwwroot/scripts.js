var map;
var markersColor = [];
function createMap() {
    var myLatLng = { lat: 32.00683, lng: 34.88533 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: myLatLng
    });
}

function addMarker(myLatLng) {
    var icon = {
        url: "plane-icon.png", 
        scaledSize: new google.maps.Size(20, 20), 
        origin: new google.maps.Point(0, 0), 
        anchor: new google.maps.Point(0, 0) 
    };

    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: icon
    });
    marker.addListener('click', function () {
        var flighturl = "../api/Flights/2";
        var contentString;
        $.getJSON(flighturl, function (data) {
            contentString = "Flight ID:" + data.flightId + "</br>Company Name:" + data.companyName;
            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });
            infowindow.open(map, marker);
        });
    });
    markersColor.push(marker);
}

var flighturl = "../api/Flights";
$.getJSON(flighturl, function (data) {
    data.forEach(function (flight) {
        $("#tblFlights").append("<tr><td>" + flight.companyName + "</td>" +
            "<td>" + flight.flightId + "</td></tr>");
        var myLatLng = { lat: flight.latitude, lng: flight.longitude };
        addMarker(myLatLng);
        appendItem(flight)
    });
});

function appendItem(item) {
    let tableRef = document.getElementById("tblFlights");
    var row = tableRef.insertRow();
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    cell1.innerHTML = item.flight_id;
    cell2.innerHTML = item.company_name;
    cell3.innerHTML = item.date_time;
}