$(document).ready(function() {
	
	module("Canvas presentations");
	
	test("Check Canvas Presentations", function() {
		expect(1);
		ok(MITHGrid.Presentation.RaphaelCanvas !== undefined, "RaphaelCanvas Presentation exists");		
	});
	
	test("Check Canvas availability", function() {
		var presentation;
		expect(3);
		
		try {
			presentation = MITHGrid.Presentation.RaphaelCanvas.initPresentation($('test-158603'), {
				dataView: MITHGrid.Data.initView({
					dataStore: MITHGrid.Data.initStore({})
				}),
				cWidth: 1,
				cHeight: 1,
				lenses: {}
			});
			ok(true, "Presentation object created");
		}
		catch(e) {
			ok(false, "Presentation object not created: " + e);
		}


		ok(presentation !== undefined, "Presentation object exists");
		ok(presentation.canvas !== undefined && presentation.canvas.canvas !== undefined &&
			presentation.canvas.canvas.localName === "svg", "presentation canvas svg element is good");
	});
});