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
	
	test("Updating items", function() {
		
		var app = OAC.Client.StreamingVideo.initApp("#test-258603", {width: 100, height: 100});
		ok(app.dataStores, "app.dataStore exists");
		ok(app.dataStores.canvas, "app.dataStores.canvas exists");
		
		app.dataStore.canvas.loadItems([{
			id: "ellipse0",
			type: 'Ellipse',
			shape: "ellipse",
			active: false,
			bodyContent: "This is an annotation marked by an elliptical space",
			creator: 'Grant Dickie',
			w: 100,
			h: 100,
			x: 0,
			y: 0
		},
		{
			id: "rect0",
			type: 'Rectangle',
			shape: "rectangle",
			active: false,
			bodyContent: "This is an annotation marked by an rectangular space",
			creator: 'Grant Dickie',
			w: 100,
			h: 100,
			x: 90,
			y: 90
		}]);

		

	});
});