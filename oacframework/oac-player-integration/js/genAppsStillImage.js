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
		raphApp = OAC.Client.StreamingVideo.initApp("#container", {
			base: "http://www.shared-canvas.org/impl/demo1/res/",
			manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
		});
		
		raphApp.ready(function() {
			console.log('playerobj: ' + playerobj.getsize());
			raphApp.setPlayer(playerobj);
		});
		
		// creating Raphael canvas application
		raphApp.run();
	};
	
	// setting up listener for when a new player is created
	// OAC_Controller.on_new_player(initStreamingVideoApp);
	initStreamingVideoApp({
		play: function () {},
		pause: function () {},
		getcoordinates: function() {
			return [0,0];
		},
		getsize: function() {
			return [$('#container > img').width(), $('#container > img').height()];
		},
		onPlayheadUpdate: function(_f) {
			return 1;
		},
		getPlayhead: function() {
			return 0;
		}
	});
};

$(function() {
	
	initPlugin();
});