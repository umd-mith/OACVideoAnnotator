$(document).ready(function() {
	
	module("Canvas presentations");
	
	test("Check Canvas Presentations", function() {
		expect(1);
		ok(MITHGrid.Presentation.RaphaelCanvas !== undefined, "Canvas Presentation exists");		
			
	});
	
	module("Annotation Presentation");
	
	test("Test Annotation Presentation", function() {
		expect(1);
		
		ok(MITHGrid.Presentation.AnnotationList !== undefined, "AnnotationList Presentation exists");
		
		
	});
	
	module("Presentations in action");
	
	test("Updating items", function() {
		
		var canvas = OAC.Client.StreamingVideo.initApp("#test-258603", {width: 100, height: 100});
		
		canvas.dataStore.canvas.loadItems([{
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