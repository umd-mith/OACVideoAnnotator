# Testing presentations and their associated views. Main things to check on are:
#	* Getting all dataStore items that are within view
#	* Attached events work correctly

$(document).ready ->
	module "Views"
	
	# generating 'dummy' player object - will manually set time to advance 
	# for testing
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
			onResize: MITHgrid.initEventFirer(true, true)
			onPlayheadUpdate: MITHgrid.initEventFirer(true, true)
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
		x: 1,
		y: 1,
		w: 10,
		h: 10,
		npt_start: 31,
		npt_end: 40
	}]
	
	# Setting up the application object -- to be used in each test 
	# 
	appInstance = 0
	setupApp = ->
		$(document).append($("<div id='content-container-#{appInstance}'></div>"))
		app = OAC.Client.StreamingVideo.Application.initInstance '#content-container-'+appInstance,
			url: 'http://youtube.com/'
			player: playerObject
			playerWrapper: '#myplayer'
		
		appInstance += 1
		
		app.ready ->
			app.dataStore.canvas.loadItems(testdata)
			
		app.run()
		
		app
	
	test "Check views", ->
		expect 16
		
		app = setupApp()
			
		for x in testdata
			ok app.dataView.currentAnnotations.contains(x.id), x.id + " is contained in currentAnnotations"
				
		expectAnnos = {}
		subtest = ""
	
		testTimeChange = ->
			ok true, "OnModelChange is called for #{subtest}"
			for i, o of expectAnnos
				check = app.dataView.currentAnnotations.contains(i)
				equal check, o, i + ' is ' + o
		
		# expectAnnos
		#
		# Object of 'expected id' : 'expected return value from contains()'
		#
		expectAnnos =
			'anno1' : true
			'anno2' : false
			'anno3' : false

		subtest = "(3)"
		app.setCurrentTime(3)
		testTimeChange()
		
		expectAnnos =
			'anno1' : false
			'anno2' : true
			'anno3' : true
			
		subtest = "(33)"
		app.setCurrentTime(33)
		testTimeChange()
		# Remove an item and test to make sure that it is gone in the view
		expectAnnos =
			'anno1' : false
			'anno2' : false
			'anno3' : true
		subtest = "remove anno2"
		app.dataStore.canvas.removeItems(['anno2'])
		testTimeChange()
		
		size = app.dataView.currentAnnotations.size()
		ok size = 2, "Size is correct"		
		
	test "Check presentations", ->
		expect 16
		app = setupApp()
		
		# checking lenses
		ok app.presentation.raphsvg.hasLens('Rectangle'), "Rectangle lens present"
		ok app.presentation.raphsvg.hasLens('Ellipse'), "Ellipse lens present"
		
		expectAnnos =
			'anno1' : true
			'anno2' : true
			'anno3' : true
		
		# visiting Renderings to see if they are present
		walkRenderings = (i, r) ->
			ok expectAnnos[i], i + " in renderings array"
		app.presentation.raphsvg.visitRenderings(walkRenderings)
		
	
		# get a rendering -- check it's properties
		rendering = app.presentation.raphsvg.renderingFor('anno1')
		for o in ['eventTimeEasementChange', 'eventCurrentTimeChange', 'setOpacity', 'eventFocus', 'eventUnfocus', 'eventDelete', 'eventResize', 'eventMove', 'update', 'remove', 'getExtents']
			ok $.isFunction(rendering[o]), "rendering.#{o} exists"
		
		
	test "Check Shape Lens", ->	
		expect 20
		app = setupApp()
				
		# checking time easement
		rendering = app.presentation.raphsvg.renderingFor('anno2')
		obj = app.dataStore.canvas.getItem('anno2')
		
		ok rendering?, "We have a rendering object for anno2"
		ok rendering?.getOpacity?, "We have a getOpacity method for the rendering"
		
		rendering.setOpacity(0.12345)
		equal rendering.getOpacity(), 0.12345, "setOpacity and getOpacity work as a pair"
		rendering.setOpacity(0.0)
		
		deepEqual obj.npt_start, [30], "Anno starts at the right time"
		deepEqual obj.npt_end, [45], "Anno ends at the right time"
			
		# going to test in ever-increasing time segments
		#
		oldEventCurrentTimeChange = rendering.eventCurrentTimeChange
		checkIncreasing = (cb) ->
			# opacity should be greater after each time update
			checkRendering = (t, cb) ->
				# is opacity changed?
				o = (5 - 30 + t) / 5.0
				if o < 0
					o = 0
				syncer = MITHgrid.initSynchronizer cb
				
				stop()
				syncer.increment()
				
				rendering.eventCurrentTimeChange = (n) ->
					start()
					oldEventCurrentTimeChange(n)
					equal rendering.getOpacity(), o, "opacity is now #{o} for #{t} (increasing)"
					syncer.decrement()
					rendering.eventCurrentTimeChange = oldEventCurrentTimeChange

				app.setCurrentTime t
				syncer.done()

			checkRendering 26, ->
				checkRendering 27, ->
					checkRendering 28, ->
						checkRendering 29, ->
							checkRendering 30, cb

		checkDecreasing = (cb) ->
			# decreasing the opacity values each time now
			checkRendering = (t, cb) ->
				# is opacity changed?
				o = (5.0 + 45.0 - t) / 5.0
				if o < 0
					o = 0
				if o > 1
					o = 1
				syncer = MITHgrid.initSynchronizer cb
				
				stop()
				syncer.increment()
				
				rendering.eventCurrentTimeChange = (n) ->
					oldEventCurrentTimeChange(n)
					start()
					equal rendering.getOpacity(), o, "opacity is now #{o} for #{t} (decreasing)"
					syncer.decrement()
					rendering.eventCurrentTimeChange = oldEventCurrentTimeChange

				app.setCurrentTime t
				syncer.done()

			checkRendering 45, ->
				checkRendering 47, ->
					checkRendering 50, cb

		checkIncreasing ->
			checkDecreasing ->
				# checking the use of focus
				# If eventfocus is called, object we passed must be in focus
				changeListen = (id) ->
					equal id, obj.id[0], "ID passed in activeAnnotationChange same as expected"
					#equal rendering.getOpacity(), 1.0, "Opacity now set to 1"

				app.setCurrentTime(3)
				app.events.onActiveAnnotationChange.addListener(changeListen)
				obj = app.dataStore.canvas.getItem('anno1')
				app.setActiveAnnotation('anno1');
				#rendering = app.presentation.raphsvg.renderingFor('anno1')
				#equal rendering.getOpacity(), 1.0, "Opacity now set to 1"

				app.events.onActiveAnnotationChange.removeListener(changeListen)

				# Play with inserting an annotation and seeing if it equals correct values
				# 
				# Set up changeListen
				changeListen = () ->
					obj = app.dataStore.canvas.getItem(items[0])
					rendering = app.presentation.raphsvg.renderingFor items[0]
					ok rendering?, "Rendering of #{items[0]} available"
					# check correctness of npt times and opacity
					equal rendering.getOpacity(), 1, "Opacity is 1"
					equal obj.npt_start[0], (app.getCurrentTime() - 5), "npt_start " + (app.getCurrentTime()-5)
					# Checking to see if the rendering got captured in presentation
					ok app.presentation.raphsvg.renderingFor(obj.id[0])?, "Rendering is present in presentation"

		
				# set time
				app.setCurrentTime(20)
				# set up curMode
				app.setCurrentMode('Rectangle')

				# insert shape -- only inserting what would be inserted
				# via the Controllers and presentation talking with the 
				# application
				# 
				coords = {
					'x' : 10
					'y' : 3
					'width' : 100
					'height' : 100
					'npt_start': 19
					'npt_end': 21
				}
				id = app.insertAnnotation(coords)
				rendering = app.presentation.raphsvg.renderingFor id
				obj = app.dataStore.canvas.getItem id
				ok rendering?, "Rendering of inserted shape available"
				equal rendering.getOpacity(), 1, "Opacity is 1"
				equal obj.npt_start[0], 19, "npt_start is 19"
				equal obj.npt_end[0], 21, "npt_end is 21"

				# advancing time frame -- seeing if shape stays as expected
				app.setCurrentTime(22)
				ok app.dataView.currentAnnotations.contains(id), "annotation is in data view"
				app.setCurrentTime(35)
				ok !app.dataView.currentAnnotations.contains(id), "annotation not in data view"
