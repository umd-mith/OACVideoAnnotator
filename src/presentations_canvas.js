/*
Presentations for canvas.js

@author Grant Dickie
*/


(function($, MITHGrid) {
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphSVG = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphSVG", container, options);
		
		return that;
	};
	
	// Shape presentation for rectangles
	MITHGrid.Presentation.SVGRect = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("SVGRect", container, options);
		
		return that;
	};
	
})(jQuery, MITHGrid);