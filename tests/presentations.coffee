# Testing presentations and their associated views. Main things to check on are:
#	* Getting all dataStore items that are within view
#	* Attached events work correctly

$(document).ready ->
	module "Views"
	
	# generating 'dummy' player object - will manually set time to advance 
	# for testing
	playerObject = {
		getcoordinates: ->
			 [0,0]
		getsize: ->
			[100,100]
		play: ->
			true
		pause: ->
			true
		onPlayheadUpdate: (callback) ->
			setTimeout(callback, 1000)
			true
		getPlayhead: -> 
			0
	}
	# Generating some seemingly randomized data -- all the same
	# except for npt start and end times, which is what we're testing
	# the most anyway
	testdata = [{
		id: 'anno1',
		type: 'Annotation',
		bodyType: 'Text',
		bodyContent: 'anno1_',
		shapeType: 'Rectangle',
		opacity: 0,
		x: 1,
		y: 1,
		w: 10,
		h: 10,
		npt_start: 0,
		npt_end: 15
		
	},{
		id: 'anno2',
		type: 'Annotation',
		bodyType: 'Text',
		bodyContent: 'anno2_',
		shapeType: 'Rectangle',
		opacity: 0,
		x: 1,
		y: 1,
		w: 10,
		h: 10,
		npt_start: 30,
		npt_end: 45	
	},
	{
		id: 'anno3',
		type: 'Annotation',
		bodyType: 'Text',
		bodyContent: 'anno2_',
		shapeType: 'Rectangle',
		opacity: 0,
		x: 1,
		y: 1,
		w: 10,
		h: 10,
		npt_start: 31,
		npt_end: 40
	}]
	
	setupApp = ->
		app = OAC.Client.StreamingVideo.initApp('#content-container', {
			url: 'http://youtube.com/',
			playerWrapper: '#myplayer'
		})
		
		app.ready ->
			app.setPlayer(playerObject)
			
		app.run()
		
		app.dataStore.canvas.loadItems(testdata);
		app
	
	test "Check views", ->
		expect 24
		
		app = setupApp()
		
		# make sure that currentAnnotations view receives these
		checkContains = (i, o) ->
			ok app.dataView.currentAnnotations.contains(o.id)?, i + " is contained in currentAnnotations"
			
		$.each(testdata, checkContains)
		
		
		# Test to see if changing time changes the filter
		
		# setting up re-usable function to use as a callback for when the
		# time changes in application
		checkContains = (i, o) ->
			check = app.dataView.currentAnnotations.contains(i)
			ok check = o?, i + ' is ' + o
		
	
		checkEventTrigger = ->
			start()
			ok true, "OnModelChange is called"
			$.each(expectAnnos, checkContains)
			
		app.dataView.currentAnnotations.events.onModelChange.addListener(checkEventTrigger)
		
		expectAnnos = {
			'anno1' : true
			'anno2' : false
			'anno3' : false
		}
		app.setCurrentTime(3)
		stop()
		
		
		expectAnnos = {
			'anno1' : false
			'anno2' : true
			'anno3' : true
		}
		app.setCurrentTime('33')
		stop()
		# Remove an item and test to make sure that it is gone in the view
		app.dataStore.canvas.removeItems(['anno2'])
		expectAnnos = {
			'anno1' : false
			'anno3' : true
		}
		size = app.dataView.currentAnnotations.size()
		ok size = 2, "Size is correct"
		
		app.dataView.currentAnnotations.events.onModelChange.removeListener(checkEventTrigger)
		
		
	test "Check presentations", ->
		expect 16
		app = setupApp()
		
		# checking lenses
		ok app.presentation.raphsvg.hasLens('Rectangle'), "Rectangle lens present"
		ok app.presentation.raphsvg.hasLens('Ellipse'), "Ellipse lens present"
		
		expectAnnos = {
			'anno1' : true
			'anno2' : true
			'anno3' : true
		}
		
		# visiting Renderings to see if they are present
		walkRenderings = (i, r) ->
			ok expectAnnos[i]?, i + " in renderings array"
		app.presentation.raphsvg.visitRenderings(walkRenderings)
		
	
		# get a rendering -- check it's properties
		rendering = app.presentation.raphsvg.renderingFor('anno1')
		callback = (i, o) ->
			ok $.isFunction(rendering[o])?, "rendering." + o + " exists"
		$.each(['eventTimeEasementChange', 'eventCurrentTimeChange', 'setOpacity', 'eventFocus', 'eventUnfocus', 
		'eventDelete', 'eventResize', 'eventMove', 'update', 'remove', 'getExtents'], callback)
		
		
	test "Check Shape Lens", ->	
		expect 10
		app = setupApp()
		
		# checking time easement
		changeListen = (n) ->
			# is opacity changed?
			start()
			ok obj.opacity[0] >= opac, "opacity is now " + obj.opacity[0] + ' formerly: ' + opac
		
		# going to test in ever-increasing time segments
		#
		# opacity should be greater after each time update
		app.events.onCurrentTimeChange.addListener(changeListen)
		obj = app.dataStore.canvas.getItem('anno2')
		opac = obj.opacity[0]
		app.setCurrentTime(20)
		stop()
		opac = obj.opacity[0]
		app.setCurrentTime(26)
		stop()
		opac = obj.opacity[0]
		app.setCurrentTime(27)
		stop()
		opac = obj.opacity[0]
		app.setCurrentTime(28)
		stop()
		opac = obj.opacity[0]
		# decreasing the opacity values
		app.events.onCurrentTimeChange.removeListener(changeListen)
		changeListen = (n) ->
			# is opacity changed?
			start()
			ok obj.opacity[0] < opac, "opacity is now " + obj.opacity[0] + " formerly: " + opac
		
		app.events.onCurrentTimeChange.addListener(changeListen)
		
		app.setCurrentTime(50)
		stop()
		opac = obj.opacity[0]
		app.setCurrentTime(52)
		stop()
		opac = obj.opacity[0]
		app.setCurrentTime(55)
		stop()
		
		app.events.onCurrentTimeChange.removeListener(changeListen)
		
		# checking the use of focus
		# If eventfocus is called, object we passed must be in focus
		changeListen = (id) ->
			ok id = obj.id[0]?, "ID passed in activeAnnotationChange same as expected"
			ok obj.opacity[0] = 1.0?, "Opacity now set to 1"
		
		app.setCurrentTime(3)
		app.events.onActiveAnnotationChange.addListener(changeListen)
		obj = app.dataStore.canvas.getItem('anno1')
		app.setActiveAnnotation('anno1');
		
		app.events.onActiveAnnotationChange.removeListener(changeListen)
		
		# Play with inserting an annotation and seeing if it equals correct values
		# 
		# Set up changeListen
		changeListen = (view, items) ->
			start()
			obj = app.dataStore.canvas.getItem(items[0])
			# check correctness of npt times and opacity
			ok obj.opacity[0] = 1, "Opacity is " + obj.opacity[0]
			ok obj.npt_start[0] = (app.getCurrentTime() - 5), "npt_start " + obj.npt_start[0]
			
		
		app.dataView.currentAnnotations.events.onModelChange.addListener(changeListen)
		# set time
		app.setCurrentTime(20)
		# set up curMode
		app.setCurrentMode('Rectangle')
		
		# insert shape
		coords = {
			'x' : 10
			'y' : 3
			'width' : 100
			'height' : 100
		}
		app.insertShape(coords)
		stop()
		
		app.dataView.currentAnnotations.events.onModelChange.removeListener(changeListen)
		
		changeListen = ->
			start()
			ok app.dataView.currentAnnotations.contains(obj.id[0]), "annotation " + obj.id[0] + " contained"
			ok obj.opacity[0]?, "Opacity " + obj.opacity[0]
		
		app.dataView.currentAnnotations.events.onModelChange.addListener(changeListen)
		
		# advancing time frame -- seeing if shape stays as expected
		app.setCurrentTime(22)
		stop()
		app.setCurrentTime(35)
		stop()
		app.dataView.currentAnnotations.events.onModelChange.removeListener(changeListen)