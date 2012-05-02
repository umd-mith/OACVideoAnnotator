$(document).ready ->
	module "Streaming Video"
	
	test "Check namespace", ->
		expect 2
		ok OAC.Client?, "OAC.Client"
		ok OAC.Client.StreamingVideo?, "OAC.Client.StreamingVideo"
	
	test "Check construction", ->
		expect 13
		app = OAC.Client.StreamingVideo.Application.initInstance "#content-container",
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
		
		ok $.isFunction(app.initShapeLens), "initShapeLens"
		#ok $.isFunction(app.initTextLens), "initTextLens"
		#ok $.isFunction(app.addShape), "addShape"
		ok $.isFunction(app.addShapeType), "addShapeType"
		ok $.isFunction(app.insertShape), "insertShape"
		ok $.isFunction(app.importData), "importData"
		ok $.isFunction(app.exportData), "exportData"
		
	test "Check annotation management", ->
		expect 12
		
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
			events:
				onResize: MITHGrid.initEventFirer(true, true)
				onPlayheadUpdate: MITHGrid.initEventFirer(true, true)
		}
		
		# We want to put a few annotations in
		app = OAC.Client.StreamingVideo.Application.initInstance "#content-container",
			player: playerObject
			url: 'http://www.youtube.com/watch?v=HYLacuAp76U&feature=fvsr'
			easement: 5
		app.run();
		
		app.setCurrentMode 'Rectangle'
		equal app.getCurrentMode(), 'Rectangle', "Setting mode to 'Rectangle' works"
		
		equal app.dataStore.canvas.items().length, 0, "Right number of items in data store"
		
		app.insertShape
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
		app.insertShape
			x:200
			y:200
			width:25
			height:25
		
		equal app.dataStore.canvas.items().length, 2, "Right number of items in data store"
		equal app.dataView.currentAnnotations.items().length, 2, "Right number of items in the data view"
