/*
QUnit policy:
First step:
	Check if all members of an object are present
	
Second step:
	Test each member of an object that it gives the correct value
	
Third step:
	Fire event trigger and make sure event fires with correct value
	ex: getCurrentTime causes eventCurrentTimeChange
	
Fourth step: 
	Number modules and name them with file prefix
*/

$(document).ready(function() {
	
	module("app.initApp");
	var app;
	test("app object tree", 14, function() {
		
		app = OAC.Client.StreamingVideo.initApp("#test-258603", {width: 100, height: 100});
		
		app.run();
		
		$.each(["options", "dataStore", "presentation", "events", "dataView"], function(i, o) {
			ok(app[o] !== undefined, "app." + o + " present and is Object");
		});
		
		$.each(["canvas"], function(i, o) {
			ok(app.dataStore[o], "app.dataStore." + o);
		});
		
		$.each(["onActiveAnnotationChange", "onCurrentModeChange", "onCurrentTimeChange"], function(i, o) {
			ok(app.events[o], "app.events." + o);
		});
		
		$.each(["loadItems", "updateItems"], function(i, o) {
			ok($.isFunction(app.dataStore.canvas[o]), "app.dataStore.canvas." + o);
		});
		/*
		stop();
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
		}], function() {
			start();
		});
		*/
		$.each(["annoItem", "raphsvg"], function(i, o) {
			ok(app.presentation[o], "app.presentation." + o);
		});
		
		$.each(["currentAnnotations"], function(i, o) {
			ok(app.dataView[o], "app.dataView." + o);
		});
	});
	
	module("app.dataStore.canvas");
	
	test("Methods",4, function() {
		var search, find, app;
		
		app = OAC.Client.StreamingVideo.initApp("#test-258603", {width: 100, height: 100});
		app.run();
	
		stop();
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
		}], function() {
			start();
		});
		
		ok(app.dataStore.canvas.contains('anno0'), "app.dataStore.canvas.loadItems");
		
		ok(app.dataStore.canvas.getItem('anno0'), "app.dataStore.canvas.getItem");
		
		stop();
		app.dataStore.canvas.updateItems([{
			id: "anno0",
			type: "Annotation",
			bodyContent: "Newer annotation here",
			x: 10,
			y: 10
		}], function() {
			start();
			
		});
		find = app.dataStore.canvas.getItem("anno0");
		
		equal(find.x, 10, "x value changed through app.dataStore.canvas.updateItems");
		
		stop();
		app.dataStore.canvas.removeItems(['anno0'],
		function() {
			start();
		});
		find = app.dataStore.canvas.contains("anno0");
		ok(find === false, "Annotation item deleted app.dataStore.canvas.removeItems");
		
	});
	
	module("app.dataViews");
	
	test("dataView Filtering",1, function() {
		var app = OAC.Client.StreamingVideo.initApp("#test-258603", {width: 100, height: 100}),
		findItems;
		app.run();
		stop();
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
		}], function() {
			start();
		});
		
		findItems = app.dataView.currentAnnotations.getItem('anno0');
		ok(findItems !== undefined, "dataView loaded Rectangle -- retrieved by getItem");
		
		
		
	});
	
	module("app.presentations");
	
	test("Presentation tree", 3, function() {
		var app = OAC.Client.StreamingVideo.initApp("#test-258603", {width: 100, height: 100}),
		findItems;
		app.run();
		stop();
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
		}], function() {
			start();
		});
		
		$.each(['events', 'options', 'canvas'], function(i, o) {
			ok(app.presentation.raphsvg[o], o + " in raphsvg presentation");
		});
				
	});
	
});