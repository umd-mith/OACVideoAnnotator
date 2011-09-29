$(document).ready(function() {
	
	module("Canvas presentations");
	
	test("Check Canvas Presentations", function() {
		expect(2);
		ok(MITHGrid.Presentation.RaphSVG !== undefined, "RaphSVG Presentation exists");
		ok(MITHGrid.Presentation.SVGRect !== undefined, "SVGRect Presentation exists");
		
	});
	
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
	
});