$(document).ready(function() {
	
	module("Canvas presentations");
	
	test("Check Canvas Presentations", function() {
		expect(1);
		ok(MITHGrid.Presentation.RaphaelCanvas !== undefined, "Canvas Presentation exists");		
		
	});
	
	test("Check Canvas availability", function() {
		var presentation;
		expect(3);
		
		$.each(['canvas','canvasEvents','editBoundingBox'], function(i, o) {
			ok(MITHGrid.Presentation.RaphaelCanvas[o], "Checked "+o);
		});
	});
});