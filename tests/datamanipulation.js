$(document).ready(function() {
	module('Data Manipulation');
	
	test('Changing variables', function() {
		var app = OAC.Client.StreamingVideo.initApp('#qunit-fixture', {width: 100, height: 100}),
		modeCheck = function(mode) {
			start();
			ok((mode === curMode), 'Mode is currently ' + mode);
	
		},
		activeIdCheck = function(id) {
			start();
			ok((curActiveid === id), 'ActiveId is currently ' + id);
		
			
		},
		curPlayerCheck = function(obj) {
			start();
			ok((obj === curPlayer), 'curPlayer is set');
		},
		curMode,
		curActiveId,
		curPlayer,
		curTime,
		cur;
		app.run();
		expect(6);
		
		app.events.onCurrentModeChange.addListener(modeCheck);
		app.events.onActiveAnnotationChange.addListener(activeIdCheck);
		app.events.onPlayerChange.addListener(curPlayerCheck);

		curMode = 'Select';
		
		app.setCurrentMode(curMode);
		stop();
		ok((app.getCurrentMode() === curMode), 'getCurrentMode returns correct value');
		
		curActiveId = 'anno0';
		
		app.setActiveAnnotation(curActiveId);
		stop();
		ok((app.getActiveAnnotation() === curActiveId), 'getActiveAnnotation() returns correct value');
		
		curPlayer = {object: 'object'};
		
		app.setPlayer(curPlayer);
		stop();
		ok((app.getPlayer() === curPlayer), 'getPlayer() returns correct value');
	});
	
	test('Changing data store data', function() {
		var app = OAC.Client.StreamingVideo.initApp('#qunit-fixture', {width: 100, height: 100}),
		data = [{
			id: 'anno0',
			type: 'Annotation',
			shapeType: 'Rectangle',
			x: 100,
			y: 100,
			w: 10,
			h: 10,
			bodyContent: 'this is an unchanged annotation anno0',
			ntp_start: -1,
			ntp_end: 10,
			opacity: 1
		},{
			id: 'anno1',
			type: 'Annotation',
			shapeType: 'Rectangle',
			x: 110,
			y: 140,
			w: 10,
			h: 10,
			bodyContent: 'this is an unchanged annotation anno1',
			ntp_start: 2,
			ntp_end: 15,
			opacity: 1
		},{
			id: 'anno2',
			type: 'Annotation',
			shapeType: 'Rectangle',
			x: 110,
			y: 140,
			w: 10,
			h: 10,
			bodyContent: 'this is an unchanged annotation anno2',
			ntp_start: 12,
			ntp_end: 25,
			opacity: 1
		}],
		expectedResult,
		testResult,
		subj,
		dataCheck = function(store, list) {
			start();
			subj = store.getItem(list[0]);
			
			ok((subj[testResult][0] === expectedResult), testResult + ' returns ' + expectedResult);
		};
		app.run();
		
		app.dataStore.canvas.loadItems(data);
		
		app.dataStore.canvas.events.onModelChange.addListener(dataCheck);
		
		testResult = 'x';
		expectedResult = 20;
		
		app.dataStore.canvas.updateItems([{
			id: 'anno0',
			type: 'Annotation',
			x: 20,
			y: 40
		}]);
		stop();
		
		
	});
	
});