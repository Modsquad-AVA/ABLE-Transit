/*

Directions in stop names: 
C = Continue 
L = Left 
R = Right 
EB = Eastbound 
WB = Westbound 
NB = Northbound 
SB = Southbound 
NS = Nearside (Before the intersection) 
FS = Farside (After the intersection) 
NM = Nearside midblock 
FM = Farside midblock 
OP = Opposite 
AT = At 
IB = Inbound 
OB = Outbound
*/

// GLOBAL VARIABLES

/* The database object */
var db;
/* Lattitude of the device */
var lat = 48.42446409;
/* Longitude of the device */
var lon = -123.3645784;
/* Flag to change bus stop (1) or to keep the current bus stop (1)*/
var change = 0;
/* stop_id of the current bus stop */
var bus_stop;

/**
 * Called when the application has been loaded. Initializes the db variable to open the Transit.db database with the GTFS data.
 */
function onDeviceReady() {
    db = window.sqlitePlugin.openDatabase("transit.db", "1.0", "BC Transit GTFS", 41750528);

    init_loc();
}

/**
 * Sets up the event listener for the "Schedule info" button, get_loc. If the button is clicked, it calls update_page()
 */
function init_loc(){
    var buttonElement = document.getElementById("loc_button");
    buttonElement.id = "loc_button";
    var tButton = buttonElement;
    tButton.addEventListener("click", update_page, false);
}

/**
 * Changes the display from the initia screen to the screen displaying the bus schedule information of the closest detected stop. Sets change to 0. Calls get_loc()
 */
function update_page(){
    document.getElementById("main").style.display="none";
    document.getElementById("sched").style.display="block";
    document.getElementById("select_stop").style.display="none";
    change = 0;
    get_loc();
}

/**
 * Calls get_loc()
 */
function get_stop(){
    get_loc();
}

/**
 * Changes screen to show the list of bus stops. Updates change to 1. Calls get_loc()
 */
function stop_list(){
    document.getElementById("main").style.display="none";
    document.getElementById("sched").style.display="none";
    document.getElementById("select_stop").style.display="block";
    change = 1;
    get_loc();
}

/**
 * Uses PhoneGap Geolocation API to obtain lon/lat coordinates
 */
function get_loc(){
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
   // closest_stop();
}

/**
 * Called upon successful call to the PhoneGap Geolocation API. Updates lon/lat coordinates and calls closest_stop()
 *      http://docs.phonegap.com/en/1.0.0/phonegap_geolocation_geolocation.md.html#Position
 * @param {position object} position The values retuned from the GeoLocation API
 */
function onSuccess(position) {
    
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    closest_stop();
}
/**
 * Called upon unsuccessful call to the PhoneGap Geolocation API. Notifies user of failure to get GeoLocation data.
 * @param {PositionError object} onError The values retuned from the GeoLocation API
 */ 

function onError(error) {
    navigator.notification.alert("Unable to locate!");
}

/**
 * Queries db to populate an array of the stops (stop). If stops are detected, calls find_closest() to determine the nearest stop, else alerts the user that no stops were found.
 * @param {PositionError object} onError The values retuned from the GeoLocation API
 */
function closest_stop(){
    var stop = new Array();

    db.transaction(function(tx){
        tx.executeSql('SELECT stop_lat, stop_lon, stop_id, stop_name FROM stops;', [], function(tx, result) { 
            if (result != null && result.rows != null) { 
                for (var i = 0; i < result.rows.length; i++) { 
                    var row = result.rows.item(i); 
                    stop[i] = new Array(row.stop_lat, row.stop_lon, row.stop_id, row.stop_name); 
                }
                find_closest(stop);

            } else{
                navigator.notification.alert("No stop located");
            }

        }, function(e){
            console.log("Error: " + e.message);
        });
        
    });
}

/**
 * Finds the stop (from stop[]) closest to current location 
 *   If change = 0 calls update_name() to display the current stop name to get first stop, 
        else calls display_stops() to display the array of closest stops in order 
 * @param {Array} stop  Array of the form [ lat, lon, stop_id, stop_name]
 */
function find_closest(stop){
    
    var R = 6371; // km
    
    //lat1 & long1 = current lat/long
    //lat2 & long2 = stop coors
    var dLat; 
    var dLon; 

    var count = 0;
    for(count = 0; count < stop.length; count++){
        //for each stop coord
        var tempLat = stop[count][0];
        var tempLon = stop[count][1];

        dLat = (lat - tempLat);
        dLat = dLat*Math.PI/180;
        dLon = (lon - tempLon);
        dLon = dLon*Math.PI/180;
        
        var rlat1 = lat*Math.PI/180;
        var rlat2 = stop[count][0]*Math.PI/180;
        
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(rlat1) * Math.cos(rlat2); 
        
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        
        var distance = R * c;
        
        stop[count][0] = distance;
    }
        
    if(count >= stop.length) {
        stop.sort(sortMultiDimensionalFirst); 
        bus_stop = stop[0][2];
        if(change == 0){
            update_name(stop[0][3]);
        } else {
            display_stops(stop);
        }
    }
}
/**
 * Displays the list of closest stops using http://ukijs.org
    calls update_name to display the schedule information for the new stop
 * @param {Array} stop Array of the form [ lat, lon, stop_id, stop_name]
 */
function display_stops(stop){
    var data = new Array();
    for(var j = 0; j < stop.length; j++){
        data[j] = stop[j][3];
    }

    var p = uki({ 
        view: 'HSplitPane', rect: '1000 900', anchors: 'top left right bottom', handleWidth: 1,
            leftMin: 200, rightMin: 400, handlePosition: 200,
            leftChildViews: [ // scrollable list on the left
            { 
                view: 'ScrollPane', rect: '200 600', anchors: 'top left right bottom',
                    // with a wrapping box (test background and border)
                    childViews: { 
                        view: 'Box', rect: '10 10 180 900002', anchors: 'top left right', background: '#CCC',
                        // with indierect child list
                        childViews: { 
                            view: 'List', rect: '1 1 178 900000', anchors: 'top left right',
                            data: data, rowHeight: 40, id: 'list', throttle: 0, multiselect: false, textSelectable: false 
                        }
                    }
                }
            ]
        }

    ).attachTo( document.getElementById('stops'), '1000 600' )
    
    var index;
    uki('List').click(function() {
        index = this.selectedIndex();
        var temp = new Array();
        temp = stop[0];
        stop[0] = stop[index];
        stop[index] = temp;
       
        document.getElementById("main").style.display="none";
        document.getElementById("sched").style.display="block";
        document.getElementById("select_stop").style.display="none";
        bus_stop = stop[0][2];
        update_name(stop[0][3]);

    });
}

/**
 * Displays the list of closest stops using http://ukijs.org
    calls find_holidays() to determine the schedule information for the current stop
    calls refresh() to handle the button click events
 * @param {Array} stop Array of the form [ lat, lon, stop_id, stop_name]
 */
function update_name(stop_name){
    var stopNameElem = document.getElementById("stop_name");
    stopNameElem.innerHTML = stop_name;
    find_holidays();
    refresh();
}

/**
 * Sorts the incoming multidimensional array using the fourth element    
 * @param {Array} a Array within the array to be sorted
 * @param {Array} b Array within the array to be sorted
 */
function sortMultiDimensional(a,b){
    return ((a[3] < b[3]) ? -1 : ((a[3] > b[3]) ? 1 : 0));
}

/**
 * Sorts the incoming multidimensional array using the third element   
 * @param {Array} a Array within the array to be sorted
 * @param {Array} b Array within the array to be sorted
 */
function sortMultiDimensionalH(a,b){
    return ((a[2] < b[2]) ? -1 : ((a[2] > b[2]) ? 1 : 0));
}

/**
 * Sorts the incoming multidimensional array using the first element    
 * @param {Array} a Array within the array to be sorted
 * @param {Array} b Array within the array to be sorted
 */
function sortMultiDimensionalFirst(a,b){
    return ((a[0] < b[0]) ? -1 : ((a[0] > b[0]) ? 1 : 0));
}

/**
 * Handles the "Refresh" and "Change stop" button clicked events
    if Refresh clicked call find_holidays()
    if Change stop clicked call stop_list()
 */
function refresh(){
    var refreshButtonElement = document.getElementById("refresh");
    refreshButtonElement.id = "refresh";
    var refreshButton = refreshButtonElement;
    refreshButton.addEventListener("click", find_holidays, false);
    
    var changeButtonElement = document.getElementById("change_stop");
    changeButtonElement.id = "change_stop";
    var changeButton = changeButtonElement;
    changeButton.addEventListener("click", stop_list, false);
}

/**
 * Determines if current day is listed in calendar_dates.txt (from GTFS) 
    if current day is listed populate service_id [] with relevant service_id's and call find_times() with service_id[]
    else call find_date()
 */
function find_holidays(){
    db.transaction(function(tx){
       // an array of service id's for current day
        var service_id = new Array();

        // if holiday, use special service_id
        tx.executeSql("SELECT service_id FROM calendar_dates WHERE exception_type = 1 AND date = (SELECT strftime('%Y','NOW') || strftime('%m','now') || strftime('%d','now'));", [], function(tx, result) { 

            if(result != null && result.rows != null && result.rows.length > 0 ){
                for (var i = 0; i < result.rows.length; i++) { 
                    service_id[i] = result.rows.item(i).service_id;
                }

                find_times(service_id);
            } else {

                find_date();
            }
        });
    });
}

/**
 * Determines current day uses db to generate a list of relevant service_id's to populate service_id[]
    if service_id.length > 0 call find_times()
    else inform user that no busses returned from query. Log that db may need to be updated
 */
function find_date(){
    var service_id = new Array();
    var date = new Date();
    // current day of the week (0-6)
    //      0 = sunday, 1 = monday, .. , 6 = saturday
    var day = date.getDay();
    var currDay;
    switch (day)
    {
        case 0:
            currDay = 'sunday';
            break;
        case 1:
            currDay = 'monday';
            break;
        case 2:
            currDay = 'tuesday';
            break;
        case 3:
            currDay = 'wednesday';
            break;
        case 4:
            currDay = 'thursday';
            break;
        case 5:
            currDay = 'friday';
            break;
        case 6:
            currDay = 'saturday';
            break;
    }
    db.transaction(function(tx){ 
        tx.executeSql("SELECT service_id FROM calendar WHERE start_date <= (SELECT strftime('%Y','NOW') || strftime('%m','now') || strftime('%d','now')) AND end_date >= (SELECT strftime('%Y','NOW') || strftime('%m','now') || strftime('%d','now')) AND " + currDay + " = 1;",[], function(tx, result){
  
            if(result != null && result.rows != null){
                for (var i = 0; i < result.rows.length; i++) { 
                    service_id[i] = result.rows.item(i).service_id;
                }

                find_times(service_id);
            } else {
                conesole.log("No service_id's for today: -- update data!");
                alert("No busses today!");
            }
        });
    });
}


/**
 * Queries db to get route information for current stop based on current date. Determines the length of time until the scheduled departure time. Sorts the results from lowest duration to highest. Formats data for display_results()
 * @param {Array} service_id Array within list of relevant service_id's based on current date
 */
 
function find_times(service_id){
    var data = new Array();
    var sched_data = new Array();

    db.transaction(function(tx){
        tx.executeSql('SELECT route_short_name, route_long_name, trip_headsign, departure_time, service_id FROM stop_times JOIN trips ON stop_times.trip_id = trips.trip_id JOIN routes ON trips.route_id = routes.route_id WHERE stop_id = "' + bus_stop + '";', [], function(tx, result) { 
            var date = new Date();

            // current day of the week (0-6)
            //      0 = sunday, 1 = monday, .. , 6 = saturday
            var valid_service_id = 0;
            if (result != null && result.rows != null) { 
                
                for (var i = 0; i < result.rows.length; i++) { 
                    var tuple = result.rows.item(i);
                    var time = new Array();
                    valid_service_id = 0;
                    time = tuple.departure_time.split(":");

                    for(var j = 0; j < service_id.length; j++){
                        if(tuple.service_id == service_id[j]){
                            valid_service_id = 1;
                        }
                    }
                    
                    if(valid_service_id != 1){
                        continue;
                    }
                    
                    if(date.getHours() > time[0]){
                        continue;
                    } else if (date.getHours() == time[0] && date.getMinutes() > time[1]){
                        continue;
                    }
                    // time_diff[0] = # hours remaining
                    // time_diff[0] = # mins remaining
                    var time_diff = new Array(2);
                    time_diff[0] = time[0] - date.getHours();
                    time_diff[1] = time[1] - date.getMinutes();
                    
                    if(time_diff[1] < 0){
                        time_diff[0] = time_diff[0] - 1;
                        time_diff[1] = time_diff[1] + 60;
                    }
                    
                    sched_data[i] = new Array(4);
                    sched_data[i][0] = tuple.route_short_name;
                    sched_data[i][1] = tuple.trip_headsign;
                    sched_data[i][2] = time_diff[0];
                    sched_data[i][3] = time_diff[1];
                
                }
                
                // Sort lists to display shortest wait time first
                sched_data.sort(sortMultiDimensional);
                sched_data.sort(sortMultiDimensionalH); 

                for(var j = 0; j < sched_data.length; j++){
                    // don't display hours if hours_diff = 0
                    var str = sched_data[j][0] + " "+ sched_data[j][1] + ": ";

                    if( sched_data[j][2] == 0){
                        var str_info = str + sched_data[j][3] + " m";

                    } else {
                        var str_info = str + sched_data[j][2] + " h " + sched_data[j][3] + "m";
                    }
                    data[j] = str_info.bold();

                }
   
            } else{
                console.log("No busses go here");
            }

        }, function(e){
            console.log("Error: " + e.message);
        });

    });
    display_results(data);
}

/**
 * Uses http://ukijs.org to display the bus schedule informaiton
 * @param {Array} data Array within list of buses and the remaining time until its depature, in order of remaining time (shorteest time first).
 */
function display_results(data){
       var p = uki(
        { view: 'HSplitPane', rect: '1000 900', anchors: 'top left right bottom', handleWidth: 1,
            leftMin: 200, rightMin: 400, handlePosition: 200,
            leftChildViews: [ // scrollable list on the left
                { view: 'ScrollPane', rect: '200 600', anchors: 'top left right bottom',
                    // with a wrapping box (test background and border)
                    childViews: { view: 'Box', rect: '10 10 180 900002', anchors: 'top left right', background: '#CCC',
                        // with indierect child list
                        childViews: { view: 'List', rect: '1 1 178 900000', anchors: 'top left right', 
                            data: data, rowHeight: 40, id: 'list', throttle: 0, multiselect: true, textSelectable: false }
                    }
                }
            ]
        }
    ).attachTo( document.getElementById('test'), '1000 600' )
}
