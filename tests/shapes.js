/*
* Qunit testing for Rectangle and Oval shape types
*
* 
*/

$(document).ready(function() {

	var rect = {}, rectItem = {
		id: 'rect1',
		type: 'Rectangle',
		shape: 'rectangle',
		active: false,
		bodyContent: "Annotation",
		creator: 'Grant Dickie',
		x: 10,
		y: 10,
		w: 100,
		h: 100
	}, search, result, canvas, oval;
	
	module("Shapes");
	
	test("Check Canvas and create rectangle", function() {
		expect(23);
		
		
		canvas = OAC.Client.StreamingVideo.initApp('#test-258603', {width: 100, height: 100});
		ok(canvas, "Canvas application created");
		
		
		try {
			canvas.dataStore.canvas.loadItems([rectItem]);
			ok(true, "Rect object loaded");
		} catch(e) {
			ok(false, "Object didn't load");
		}

		search = canvas.dataStore.canvas.prepare(["!shape"]);
		result = search.evaluate(["rectangle"]);
		ok((result.length>0), "Rectangle is successfully loaded");
		
		// test if Rect object has all the necessary components
		rect = canvas.dataStore.canvas.getItem("rect1");
		$.each(rect, function(i, o) {
			equal(rect[i], o, "Present and equals correct value");
		});
		
		canvas.dataStore.canvas.updateItems([{
			id: "rect1",
			bodyContent: "New Annotation",
			w: 200
		}]);
		
		rect = canvas.dataStore.canvas.getItem("rect1");
		$.each(rect, function(i, o) {
			equal(rect[i], o, "Present and equals (new) value");
		});
	});
	
	
	test("Check for oval", function() {
		expect(1);
		
		
		search = canvas.dataStore.canvas.prepare(["!shape"]); 
		
		canvas.dataStore.canvas.loadItems([{
			id: "oval1",
			type: 'oval',
			shape: 'oval',
			bodyContent: 'Annotation on oval',
			x: 10,
			y: 100,
			w: 200,
			h: 300
		}]);
		
		result = search.evaluate(["oval"]);
		ok((result.length>0), "Oval is loaded");
	});
	
	test("Update oval", function() {
		expect(4);
		canvas = OAC.Client.StreamingVideo.initApp('#test-258603', {width: 100, height: 100});
		ok(canvas, "Canvas application created");
		
		canvas.dataStore.canvas.updateItems([{
			id: "oval1",
			bodyContent: "New oval annotation",
			w: 400,
			x: 20
		}]);
		
		oval = canvas.dataStore.canvas.getItem("oval1");
		
		equal(oval.bodyContent[0], "New oval annotation", "Correct value");
		equal(oval.w[0], 400, "Correct value");
		equal(oval.x[0], 20, "Correct value");
		
	});
	
});