/*
Presentations for canvas.js

@author Grant Dickie
*/


(function($, MITHGrid) {
	MITHGrid.Presentation.namespace("RaphSVG");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphSVG.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphSVG", container, options),
		//create canvas object to be used outside of the Presentation - objects
		//access this to generate shapes
		id = $(container).attr('id'), h, w;
		
		if(options.cWidth && options.cHeight) {
			w = options.cWidth;
			h = options.cHeight;
		} else {
			// measure the div space and make the canvas
			// to fit
			w = $(container).width();
			h = $(container).height();
		}
		// init RaphaelJS canvas
		// Parameters for Raphael: 
		// @id: element ID for container div
		// @w: Integer value for width of the SVG canvas
		// @h: Integer value for height of the SVG canvas
		that.canvas = new Raphael(id, w, h);
		
		return that;
	};
}(jQuery, MITHGrid));