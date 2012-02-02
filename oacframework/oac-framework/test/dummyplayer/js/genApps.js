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
		while(OAC_Controller.player(player) !== undefined) {
			OACdrv = OAC_Controller.player(player);
			initStreamingVideoApp(OACdrv);
			player++;
		};
		
	};
	
	
	initStreamingVideoApp = function(playerobj) {
	
		wh = playerobj.getsize();
		
		// Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp("#main", {
			playerDOM: playerobj.DOMObject,
			width: wh[0], 
			height: wh[1],
			base: "http://www.shared-canvas.org/impl/demo1/res/",
			manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
		});
	
		// creating Raphael canvas application
		raphApp.run();
	};
	
	// Registering OAC Controller
	// OAC_Controller.register("OACVideoController");
	
	setupAllPlayers();
};

$(function() {
	
	
	initPlugin();
});