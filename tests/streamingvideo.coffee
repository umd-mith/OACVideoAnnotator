$(document).ready ->
	module "Streaming Video"
	
	test "Check namespace", ->
		expect 2
		ok OAC?.Client?.StreamingVideo?.Application?, "OAC.Client.StreamingVideo.Application exists"
		ok $.isFunction(OAC.Client.StreamingVideo.Application.initInstance), "OAC.Client.StreamingVideo.Application.initInstance is a function"
		
	test "Check construction", ->
		expect 13
		app = OAC.Client.StreamingVideo.Application.initInstance
			url: 'http://www.youtube.com/watch?v=HYLacuAp76U&feature=fvsr'
			easement: 5

		ok $.isFunction(app.setActiveAnnotation), "setActiveAnnotation"
		ok $.isFunction(app.getActiveAnnotation), "getActiveAnnotation"
		
		ok $.isFunction(app.setCurrentTime), "setCurrentTime"
		ok $.isFunction(app.getCurrentTime), "getCurrenTime"
		
		ok $.isFunction(app.setTimeEasement), "setTimeEasement"
		ok $.isFunction(app.getTimeEasement), "getTimeEasement"
		ok $.isFunction(app.setCurrentMode), "setCurrentMode"
		ok $.isFunction(app.getCurrentMode), "getCurrentMode"
		ok $.isFunction(app.getCurrentModeClass), "getCurrentModeClass"
		
		ok $.isFunction(app.addShapeType), "addShapeType"
		ok $.isFunction(app.insertAnnotation), "insertAnnotation"
		ok $.isFunction(app.importData), "importData"
		ok $.isFunction(app.exportData), "exportData"
		
	test "Check annotation management", ->
		expect 14
		
		playerObject = {
			getCoordinates: ->
				 [0,0]
			getSize: ->
				[100,100]
			play: ->
				true
			pause: ->
				true
			onPlayheadUpdate: (callback) ->
				setTimeout(callback, 1000)
				true
			setPlayhead: (t) ->
				t
			getPlayhead: -> 
				0
			getTargetURI: -> 'http://www.youtube.com/watch?v=HYLacuAp76U&feature=fvsr'
			events:
				onResize: MITHGrid.initEventFirer(true, true)
				onPlayheadUpdate: MITHGrid.initEventFirer(true, true)
		}
		
		# We want to put a few annotations in
		app = OAC.Client.StreamingVideo.Application.initInstance
			player: playerObject
			url: 'http://www.youtube.com/watch?v=HYLacuAp76U&feature=fvsr'
			easement: 5
		app.run();
		
		# initShapeLens is only defined once the SVG presentation is instantiated
		ok $.isFunction(app.initShapeLens), "initShapeLens"
		
		app.setCurrentMode 'Rectangle'
		equal app.getCurrentMode(), 'Rectangle', "Setting mode to 'Rectangle' works"
		equal app.getCurrentModeClass(), "shape", "Setting mode to 'Rectangle' means we're in a 'shape' mode"
		
		equal app.dataStore.canvas.items().length, 0, "Right number of items in data store"
		
		app.insertAnnotation
			x: 100
			y: 100
			width: 50
			height: 50
		
		equal app.dataStore.canvas.items().length, 1, "Right number of items in data store"
		equal app.dataView.currentAnnotations.items().length, 1, "Right number of items in the data view"
			
		# move the time around
		app.setCurrentTime(20)
		# see which annotations are rendered
		equal app.getCurrentTime(), 20, "Time set"
		equal app.dataStore.canvas.items().length, 1, "Right number of items in data store"
		equal app.dataView.currentAnnotations.items().length, 0, "Right number of items in the data view"
		
		
		# move time back
		app.setCurrentTime(0)
		equal app.getCurrentTime(), 0, "Time set"
		equal app.dataStore.canvas.items().length, 1, "Right number of items in data store"
		equal app.dataView.currentAnnotations.items().length, 1, "Right number of items in the data view"
		
		app.setCurrentMode 'Rectangle'
		
		# add another annotation
		app.insertAnnotation
			x:200
			y:200
			width:25
			height:25
		
		equal app.dataStore.canvas.items().length, 2, "Right number of items in data store"
		equal app.dataView.currentAnnotations.items().length, 2, "Right number of items in the data view"
