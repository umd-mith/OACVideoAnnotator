/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	var raphApp, setupAllPlayers, player, OACdrv, wh = [], xy = [],
	OACVideoController, importJSONData, importsocket;
	
	
	initStreamingVideoApp = function(playerobj) {
		// Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp("#myplayer", {
			base: "http://www.shared-canvas.org/impl/demo1/res/",
			manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
		});
		
		raphApp.ready(function() {
			raphApp.setPlayer(playerobj);
		});
		
		setTimeout(function() {
			// creating Raphael canvas application
			raphApp.run();
		},10);
	};
	
	setTimeout(function() {
		// setting up listener for when a new player is created
		// OAC_Controller.on_new_player(initStreamingVideoApp);
		initStreamingVideoApp({
			play: null,
			pause: null,
			getcoordinates: function() {
				return [0,0];
			},
			getsize: function() {
				return [$('#myplayer > img')[0].width, $('#myplayer > img')[0].height];
			},
			onPlayheadUpdate: null,
			getPlayhead: function() {
				return 0;
			}
		});
	}, 10);
};

$(function() {
	
	initPlugin();
});