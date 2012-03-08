/*
* Create the MITHGrid applications that run the prototype 
* example. This is an alternate test version that runs with 
* embedded Youtube videos.
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	var raphApp, setupAllPlayers, player, OACdrv, wh = [], xy = [],
	OACVideoController, readyAnnotationClient;
	
	readyAnnotationClient = function(playerobj) {
		raphApp.ready(function() {
			raphApp.setPlayer({
				getcoordinates: function() {
					return [
						$(player).offset().left,
						$(player).offset().top
					]
				},
				getsize: function() {
					return [
						$(player).width(),
						$(player).height()
					]
				},
				play: playerobj.play,
				pause: playerobj.pause,
				getPlayhead: playerobj.playerObj.getCurrentTime
			});
		});

		// creating Raphael canvas application
		raphApp.run();
	};
	
	initStreamingVideoApp = function(playerobj) {
		// Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp("#mplayer", {
			base: "http://www.shared-canvas.org/impl/demo1/res/",
			manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
		});
		
		var player = playerobj.getAvailablePlayers()[0];
		
		if (player.done !== true) {
			setTimeout(readyAnnotationClient, 2000, playerobj);
		} else {
			readyAnnotationClient(playerobj);
		}
		
		return;
	
	};
	
	// setting up listener for when a new player is created
	OAC_Controller.on_new_player(initStreamingVideoApp);
};

$(function() {
	initPlugin();
});