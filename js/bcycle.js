$(document).ready(function() {

  initialize();

// Change Addresses to Coordinates ******************************************************

  function getCoordinates(x) {
    var address = x;
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        coordinates = results[0].geometry.location.mb + ", " + results[0].geometry.location.nb;
        drawPath(coordinates);
      }
      else {
        alert("Geocode was not successful for the following reason: " + status);
      }
      console.log(results);
    });
  }

// Get Destination for Plotting Elevation ***********************************************

  function getDestinationAddress(){
    $('.route').click(function(){
      destination_address = event.target.id;
      getCoordinates(destination_address);
    });
  }


// Collect Destination Addresses for Calculating Distance *********************************************

  function getAddresses(x) {
    var collectAddresses = [];
    var theAddresses = $(".origin").each(function(){
      var allAddresses = $(this).val();
      collectAddresses.push(allAddresses);
      for (var i in collectAddresses) {
        if (collectAddresses[i] == x) {
          collectAddresses.splice(i, 1);
        }
      }
    });
  return collectAddresses;
  };

// Calculate Distance *********************************************************************************

  function submitRoute() {
    var origin = $("#origin option:selected").val();
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [origin],
      destinations: getAddresses(origin),
      travelMode: google.maps.TravelMode.BICYCLING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      avoidHighways: true,
      avoidTolls: true
    }, returnDistances);
  }

  function returnDistances(response, status) {
    if (status != google.maps.DistanceMatrixStatus.OK) {
      alert('Error was: ' + status);
        }
    else {
      var origins = response.originAddresses;
      var destinations = response.destinationAddresses;
      var outputDiv = document.getElementById('outputDiv');
      outputDiv.innerHTML = '<p class="heading">'+ origins+ ' to: </p>';

      for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
          sortDistance(response.rows[i].elements[j].distance.text,'<span class = "heading">' + destinations[j] + '</span>' + '<br /><span class = "bold">Distance:</span> ' + results[j].distance.text + '.<br /><span class = "bold">Estimated Time:  </span>' + results[j].duration.text + '<p class = "route" id = "'+ destinations[j] +'">Show Route and Elevation Chart</p><br />');
        }
      }
      getDestinationAddress()
    }
  }

// Sort Results by Distance **************************************************************************

  function sortDistance(x, y) {
    var oneMile = [];
    var twoMile = [];
    var threeMile = [];

    if (parseFloat(x) > 3) {
      threeMile.push(y);
    }
    else if (parseFloat(x) >= 1) {
      twoMile.push(y);
    }
    else {
      oneMile.push(y);
    }
    var distSelect = $("#distance option:selected").val();
      if (distSelect == "3Mile") {
        outputDiv.innerHTML += threeMile;
      }
      else if (distSelect == "1to3Mile") {
        outputDiv.innerHTML += twoMile;
      }
      else {
        outputDiv.innerHTML += oneMile;

      }
    };

// Initialize ***************************************************************************************

  var elevator;
  var directionsDisplay =  new google.maps.DirectionsRenderer({'map': map});
  var directionsService = new google.maps.DirectionsService();
  var map;

  function initialize() {
    directionsDisplay = new google.maps.DirectionsRenderer();
    var nashville = new google.maps.LatLng(36.171361, -86.779495);
    var mapOptions = {
      zoom:12,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: nashville
    }
    map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);
    directionsDisplay.setMap(map);
    geocoder = new google.maps.Geocoder();
      // Create an ElevationService.
    elevator = new google.maps.ElevationService();
  }

// Display Route ***************************************************************************************

  function calcRoute(x,y) {
    var request = {
      origin:x,
      destination:y,
      travelMode: google.maps.TravelMode.BICYCLING
    };
    directionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
      }
    });
  }

  function drawPath(x) {
    var destination = x;
    var destvals = destination.split(",");
    var d1 = parseFloat(destvals[0]);
    var d2 = parseFloat(destvals[1]);
    var origin = $("#origin option:selected").val();
    var origvalues = origin.split(",");
    var o1 = parseFloat(origvalues[0]);
    var o2 = parseFloat(origvalues[1]);
    // Create a new chart in the elevation_chart DIV.
    chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));
    var origin = new google.maps.LatLng(o1, o2);
    var finaldest = new google.maps.LatLng(d1, d2);
    var path = [origin, finaldest];

    // Create a PathElevationRequest object using this array.
    // Ask for 256 samples along that path.
    var pathRequest = {
      'path': path,
      'samples': 50
    }
     // Initiate the path request.
    elevator.getElevationAlongPath(pathRequest, plotElevation);
    calcRoute(origin, destination);

  }

  // Takes an array of ElevationResult objects, draws the path on the map
  // and plots the elevation profile on a Visualization API ColumnChart.
  function plotElevation(results, status) {
    if (status == google.maps.ElevationStatus.OK) {
      elevations = results;
      console.log(results);
      // Extract the elevation samples from the returned results
      // and store them in an array of LatLngs.
      var elevationPath = [];
      for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].location);
      }
      // Display a polyline of the elevation path.
      // var pathOptions = {
      //     path: elevationPath,
      //     strokeColor: '#0000CC',
      //     opacity: 0.4,
      //     map: map
      // }

      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Sample');
      data.addColumn('number', 'Elevation');
      for (var i = 0; i < results.length; i++) {
        data.addRow(['', elevations[i].elevation]);
      }
      // Draw the chart using the data within its DIV.
      document.getElementById('elevation_chart').style.display = 'block';
        chart.draw(data, {
          width: 640,
          height: 200,
          legend: 'none',
          titleY: 'Elevation (m)'
        });
      }
    }

// Clear Page ******************************************************************

    function clearPage() {
      $("#outputDiv").html(" ");
      $('#elevation_chart').hide();
      initialize();

    };

// Call Functions on button clicks *********************************************

  $("#Reset").click(function() {
    clearPage();
  }); //end Reset click
  $("#Distances").click(function() {
    submitRoute();
  }); //end Distances click
}); //end ready