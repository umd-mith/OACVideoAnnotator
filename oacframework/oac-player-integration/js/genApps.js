/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	var raphApp, setupAllPlayers, player, OACdrv, wh = [], xy = [],
	OACVideoController;
	
	initStreamingVideoApp = function(playerobj) {
		// Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp("#content-container", {
			playerobject: playerobj,
			base: "http://www.shared-canvas.org/impl/demo1/res/",
			manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
		});
	
		// creating Raphael canvas application
		raphApp.run();
	};
	
	// setting up listener for when a new player is created
	OAC_Controller.on_new_player(initStreamingVideoApp);
};

$(function() {
	
	initPlugin();
});