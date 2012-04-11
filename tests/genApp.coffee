# Generates an app object (OAC.Client.StreamingVideo) to be used in tests
# 
# Add to .html file in order to activate


initPlugin = () ->
	initStreamingVideoApp = (playerObj) -> 
		# Create Raphael canvas application controls
		raphApp = OAC.Client.StreamingVideo.initApp "#content-container", {
			playerWrapper: '#myplayer',
			url: 'http://www.youtube.com/watch?v=HYLacuAp76U&feature=fvsr',
			easement: 5
		}
		
		# Adding a ready wrapper function to set the playerobject
		callback = (playerobj) ->
			raphApp.ready ->
				raphApp.setPlayer(playerobj)
				
		setTimeout callback, 1
			
		callback2 = () ->
			raphApp.run()
			
		# creating Raphael canvas application
		setTimeout callback2, 10
	
	# setting up listener for when a new player is created
	OAC_Controller.on_new_player initStreamingVideoApp;

$(document).ready ->
	initPlugin()