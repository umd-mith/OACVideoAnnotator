$(document).ready ->
	module "Streaming Video"
	

	
	
	test "Check namespace", ->
		expect 2
		ok OAC.Client?, "OAC.Client"
		ok OAC.Client.StreamingVideo?, "OAC.Client.StreamingVideo"
	
	test "Check construction", ->
		expect 19
		
		# Generates an app object (OAC.Client.StreamingVideo) to be used in tests
		# 
		initPlugin = (raphApp) ->
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
				
				ok $.isFunction(app.setActiveAnnotation)?, "setActiveAnnotation"
				ok $.isFunction(app.getActiveAnnotation)?, "getActiveAnnotation"

				ok $.isFunction(app.setCurrentTime)?, "setCurrentTime"
				ok $.isFunction(app.getCurrentTime)?, "getCurrenTime"

				ok $.isFunction(app.setTimeEasement)?, "setTimeEasement"
				ok $.isFunction(app.getTimeEasement)?, "getTimeEasement"
				ok $.isFunction(app.setCurrentMode)?, "setCurrentMode"
				ok $.isFunction(app.getCurrentMode)?, "getCurrentMode"
				ok $.isFunction(app.setPlayer)?, "setPlayer"
				ok $.isFunction(app.getPlayer)?, "getPlayer"

				ok $.isFunction(app.initShapeLens)?, "initShapeLens"
				ok $.isFunction(app.initTextLens)?, "initTextLens"
				ok $.isFunction(app.buttonFeature)?, "buttonFeature"
				ok $.isFunction(app.addShape)?, "addShape"
				ok $.isFunction(app.addBody)?, "addBody"
				ok $.isFunction(app.addShapeType)?, "addShapeType"
				ok $.isFunction(app.insertShape)?, "insertShape"
				ok $.isFunction(app.importData)?, "importData"
				ok $.isFunction(app.exportData)?, "exportData"

			# setting up listener for when a new player is created
			OAC_Controller.on_new_player initStreamingVideoApp;

		app = {}
		# Create the app as an OAC instance to use in this module
		initPlugin(app)