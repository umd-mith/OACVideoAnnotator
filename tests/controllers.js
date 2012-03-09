/*
* Controller testing
*
*
*/

$(document).ready(function() {
	module('Controllers');
	
	test("app.options.controllers", 7, function() {
		
		var app = OAC.Client.StreamingVideo.initApp('#qunit-fixture', {width: 100, height: 100}),
		checkCanvasClick = function(id) {
			
			ok(id.length > 0, "Click event returned");
		};
		
		app.run();
		
		ok(app.options.controllers.keyboard, "app.options.controllers.keyboard");
		
		ok(app.options.controllers.shapeEditBox, "app.options.controllers.shapeEditBox");
		ok(app.options.controllers.shapeCreateBox, "app.options.controllers.shapeCreateBox");
		ok(app.options.controllers.canvas, "app.options.controllers.canvas");
		ok(app.options.controllers.annoActive, "app.options.controllers.annoActive");
		ok(app.options.controllers.buttonActive, "app.options.controllers.buttonActive");
	
		app.events.onActiveAnnotationChange.addListener(checkCanvasClick);
		app.events.onActiveAnnotationChange.fire('anno0');
	});
	
	test("OAC.Client.StreamingVideo.Controller functionality", 2, function() {
		var app = OAC.Client.StreamingVideo.initApp('#qunit-fixture', {width: 100, height: 100}),
		searchAnnos, foundIds,
		keyboardCallback = function() {
			start();
			foundIds = searchAnnos.evaluate('Annotation');
			ok(true, "Keyboard event returned OK");
			
		},
		e = $.Event('keydown');
		app.run();
		
		e.which = 8;
		searchAnnos = app.dataStore.canvas.prepare(['.type']);
		app.dataStore.canvas.loadItems([{
			id: "anno0",
			type: "Annotation",
			bodyType: "text",
			bodyContent: "Annotation here",
			creator: "Grant Dickie",
			x: 0,
			y: 0,
			w: 100,
			h: 100,
			shapeType: "Rectangle",
			ntp_start: -1,
			ntp_end: 1,
			opacity: 1
		}]);
		
		$('body').bind('keydown', keyboardCallback);
		
		stop();
		$('body > first').trigger(e);
		
		e.which = 46;
		app.dataStore.canvas.loadItems([{
			id: "anno0",
			type: "Annotation",
			bodyType: "text",
			bodyContent: "Annotation here",
			creator: "Grant Dickie",
			x: 0,
			y: 0,
			w: 100,
			h: 100,
			shapeType: "Rectangle",
			ntp_start: -1,
			ntp_end: 1,
			opacity: 1
		}]);
		
		
		
		$('body > first').trigger(e);
		start();
		
		app.dataStore.canvas.loadItems([{
			id: "anno0",
			type: "Annotation",
			bodyType: "text",
			bodyContent: "Annotation here",
			creator: "Grant Dickie",
			x: 0,
			y: 0,
			w: 100,
			h: 100,
			shapeType: "Rectangle",
			ntp_start: -1,
			ntp_end: 1,
			opacity: 1
		}]);
		
		
		ok();
		
	});
	
	

});