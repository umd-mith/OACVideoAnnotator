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
	
	test "Check views", ->
		expect 9
		
		app = OAC.Client.StreamingVideo.initApp('#content-container', {
			url: 'http://youtube.com/',
			playerWrapper: '#myplayer'
		})
		
		app.ready ->
			app.setPlayer(playerObject)
			
		app.run()
		
		app.dataStore.canvas.loadItems(testdata);
		
		# make sure that currentAnnotations view receives these
		checkContains = (i, o) ->
			ok app.dataView.currentAnnotations.contains(o.id)?, i + " is contained in currentAnnotations"
			
		$.each(testdata, checkContains)
		
		
		# Test to see if changing time changes the filter
		
		# setting up re-usable function to use as a callback for when the
		# time changes in application
		checkContains = (i, o) ->
			check = app.dataView.currentAnnotations.contains(i)
			ok check = o, i + ' is ' + o
		
		callback = (n) ->
			console.log 'time is now: ' + n
			$.each(expectAnnos, checkContains)
			start()
			
		app.events.onCurrentTimeChange.addListener(callback)
		
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
		
		