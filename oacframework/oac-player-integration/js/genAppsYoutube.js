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
	
	
	
	initStreamingVideoApp = function(obj) {
		
			// Create Raphael canvas application controls
			raphApp = OAC.Client.StreamingVideo.initApp("#mplayer", {
				base: "http://www.shared-canvas.org/impl/demo1/res/",
				manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
			});
		
			var player = OAC_Controller.player();
			player.pause();
			setTimeout(function() {
				readyAnnotationClient(player);
			}, 10);
		
	};
	readyAnnotationClient = function(player) {
		
		raphApp.ready(function() {
			raphApp.setPlayer({
				getcoordinates: function() {
					return [
						$(player.domObj).offset().left,
						$(player.domObj).offset().top
					];
				},
				getsize: function() {
					return [
						$(player.domObj).width(),
						$(player.domObj).height()
					];
				},
				play: function() {player.play();},
				pause: function() {player.pause();},
				onPlayheadUpdate: function(callback) { 
					setTimeout(callback, 1000);
				},
				getPlayhead: function() { return player.playerObj.getCurrentTime();}
			});
		});

		// creating Raphael canvas application
		setTimeout(function() {
			raphApp.run();
		}, 10);
	};
	$("body").bind("YTReady", initStreamingVideoApp);
	// OAC_Controller.on_new_player(initStreamingVideoApp);
};

$(function() {
	initPlugin();
});