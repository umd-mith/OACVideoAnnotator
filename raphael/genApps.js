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
		
		// Adding a ready wrapper function to set the playerobject
		raphApp = OAC.Client.StreamingVideo.initApp("#content-container", {
			player: playerobj,
			playerWrapper: '#myplayer',
			url: 'http://html5demos.com/assets/dizzy',
			easement: 5
		});

	
		// creating Raphael canvas application
			raphApp.run();
	
			// Creating handler for the export area 
			// 
			// May need to bring this into the application? 
			// 
			$('.section-export-data > #exportDataStore').click(function() {
				// init exportData
				data = raphApp.exportData();
				$('.section-export-data > #export-text').val(JSON.stringify(data));
			});
			
			// Setting up import button
			// 
			$('.section-export-data > #importJSONRDF').click(function() {
				if($('.section-export-data > #export-text').val() !== '') {
					data = $('.section-export-data > #export-text').val();
					raphApp.importData(JSON.parse(data));
				}
			});
	};
	
	// setting up listener for when a new player is created
	//OAC_Controller.on_new_player(initStreamingVideoApp);
	OAC.Client.StreamingVideo.Player.onNewPlayer(initStreamingVideoApp);
};

$(function() {
	initPlugin();
});