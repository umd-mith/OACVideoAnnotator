$(document).ready(function() {
	
	module("Canvas presentations");
	
	test("Check Canvas Presentations", function() {
		expect(1);
		ok(MITHGrid.Presentation.RaphSVG !== undefined, "RaphSVG Presentation exists");
		//ok(MITHGrid.Presentation.SVGRect !== undefined, "SVGRect Presentation exists");
		
	});
	
	test("Check Canvas availability", function() {
		expect(2);
		var container = $("#test-158603");
		
		var svg, presentation;
		presentation = MITHGrid.Presentation.RaphSVG.initPresentation(container, {
			dataView: MITHGrid.Data.initView({
				dataStore: MITHGrid.Data.initStore({})
			}),
			cWidth: 1,
			cHeight: 1,
			lenses: {}
		});

		ok(presentation !== undefined, "Presentation object exists");
		ok(presentation.canvas !== undefined && presentation.canvas.canvas !== undefined &&
			presentation.canvas.canvas.localName === "svg", "presentation canvas svg element is good");
	});
/*	
	module("Canvas");
	
	test("Check namespace", function() {
		expect(2);
		ok(MITHGrid.Application.Canvas !== undefined, "MITHGrid.Application.Canvas exists");
        ok($.isFunction(MITHGrid.Application.Canvas.namespace), "MITHGrid.Application.Canvas.namespace is a function");
	});

	module("Canvas.initApp");
	
	test("Check initApp", function() {
		expect(1);
		
		ok(MITHGrid.Application.Canvas.initApp !== undefined, "Canvas.initApp defined and is a function");
	});
	*/
});