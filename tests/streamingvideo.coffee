$(document).ready ->
	module "Streaming Video"
	
	test "Check namespace", ->
		expect 2
		ok OAC.Client?, "OAC.Client"
		ok OAC.Client.StreamingVideo?, "OAC.Client.StreamingVideo"
	
	test "Check construction", ->
		expect 37
		
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
					start()

				# creating Raphael canvas application
				setTimeout callback2, 10
				stop()
				# Going through the getters and setters, as well as events
				# Only making sure that: Getter returns what setter is passed, and that
				# the event is triggered
				
				ok $.isFunction(raphApp.setActiveAnnotation)?, "setActiveAnnotation"
				ok $.isFunction(raphApp.getActiveAnnotation)?, "getActiveAnnotation"
				ok raphApp.events.onActiveAnnotationChange?, "Event set: active annotation"
				
				ok $.isFunction(raphApp.setCurrentTime)?, "setCurrentTime"
				ok $.isFunction(raphApp.getCurrentTime)?, "getCurrentTime"
				ok raphApp.events.onCurrentTimeChange?, "Event set: current time"

				ok $.isFunction(raphApp.setTimeEasement)?, "setTimeEasement"
				ok $.isFunction(raphApp.getTimeEasement)?, "getTimeEasement"
				ok raphApp.events.onTimeEasementChange?, "Event set: time easement"
				
				ok $.isFunction(raphApp.setCurrentMode)?, "setCurrentMode"
				ok $.isFunction(raphApp.getCurrentMode)?, "getCurrentMode"
				ok raphApp.events.onCurrentModeChange?, "Event set: current mode"
				
				ok $.isFunction(raphApp.setPlayer)?, "setPlayer"
				ok $.isFunction(raphApp.getPlayer)?, "getPlayer"
				ok raphApp.events.onPlayerChange?, "Event set: player"
				
				# attach all event handlers
				eveTester = ->
					start()
					ok true, "Event called"
					
					
				eveHandler = (eve, obj) ->
					obj.addListener(eveTester)
				
				$.each(raphApp.events, eveHandler)
				
				val = 'anno9008-9000-0112b'
				raphApp.setActiveAnnotation(val)
				stop()
				ok raphApp.getActiveAnnotation = val?, "getActiveAnnotation returned correct value"
				val = 4
				raphApp.setCurrentTime(val)
				stop()
				ok raphApp.getCurrentTime = val?, "getCurrentTime returned correct value"
				val = 2
				raphApp.setTimeEasement(val)
				stop()
				ok raphApp.getTimeEasement = val?, "getTimeEasement returned correct value"
				val = 'Watch'
				raphApp.setCurrentMode(val)
				stop()
				ok raphApp.getCurrentMode = val?, "getCurrentMode returned correct value"
			
				raphApp.setPlayer(playerObj)
				stop()
				ok raphApp.getPlayer = playerObj?, "getPlayer returned correct value"
				
				
				ok $.isFunction(raphApp.initShapeLens)?, "initShapeLens"
				ok $.isFunction(raphApp.initTextLens)?, "initTextLens"
				ok $.isFunction(raphApp.buttonFeature)?, "buttonFeature"
				ok $.isFunction(raphApp.addShape)?, "addShape"
				ok $.isFunction(raphApp.addBody)?, "addBody"
				ok $.isFunction(raphApp.addShapeType)?, "addShapeType"
				ok $.isFunction(raphApp.insertShape)?, "insertShape"
				ok $.isFunction(raphApp.importData)?, "importData"
				ok $.isFunction(raphApp.exportData)?, "exportData"
				
			# setting up listener for when a new player is created
			OAC_Controller.on_new_player initStreamingVideoApp;

		app = {}
		# Create the app as an OAC instance to use in this module
		initPlugin(app)