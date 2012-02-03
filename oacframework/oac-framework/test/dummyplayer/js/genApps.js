/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	
	var raphApp, setupAllPlayers, player, OACdrv, wh = [], xy = [],
	OACVideoController;
	
	
	// Now working with integrated Dummy Player. Detects 
	// all players on the client screen and attaches an OAC
	// Video Annotator object to each player
	setupAllPlayers = function() {
		player = 0;
		
		if(OAC_Controller.player() !== undefined) {
			
			OACdrv = OAC_Controller.player();
			initStreamingVideoApp(OACdrv);
			player++;
		};
		
	};
	
	
	initStreamingVideoApp = function(playerobj) {
		xy = playerobj.getcoordinates();
		wh = playerobj.getsize();
		// Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp("#main", {
			playerobject: playerobj,
			base: "http://www.shared-canvas.org/impl/demo1/res/",
			manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
		});
	
		// creating Raphael canvas application
		raphApp.run();
		
		
		raphApp.setPlayer([xy[0], xy[1], wh[0], wh[1], playerobj.getPlayhead()]);
		
		
	};
	
	// Registering OAC Controller
	// OAC_Controller.register("OACVideoController");
	
	setupAllPlayers();
};

$(function() {
	console.log('coords: ' + OAC_Controller.player().getcoordinates());
	
	initPlugin();
});