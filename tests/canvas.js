$(document).ready(function() {
	
	module("Canvas presentations");
	
	test("Check Canvas Presentations", function() {
		expect(1);
		ok(MITHGrid.Presentation.RaphaelCanvas !== undefined, "Canvas Presentation exists");		
		
	});

});