/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	var raphApp, setupAllPlayers, player, OACdrv, wh = [], xy = [],
	OACVideoController, data;
	
	initStreamingVideoApp = function(playerobj) {
		// Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp("#content-container", {
			playerWrapper: '#myplayer'
		});
		
		// Adding a ready wrapper function to set the playerobject
		setTimeout(function() {
			raphApp.ready(function() {
				raphApp.setPlayer(playerobj);
			});
		}, 1);

	
		// creating Raphael canvas application
		setTimeout(function() {
			raphApp.run();
	
			// Creating handler for the export area 
			// 
			// May need to bring this into the application? 
			// 
			$('.section-export-data > #exportDataStore').click(function() {
				// init exportData
				console.log('exporting data');
				data = raphApp.exportData();
				console.log('received exported data: ' + data);
				$('.section-export-data > #export-text').val(JSON.stringify(data));
			});
		}, 10);
	};
	
	// setting up listener for when a new player is created
	OAC_Controller.on_new_player(initStreamingVideoApp);
};

$(function() {
	initPlugin();
});