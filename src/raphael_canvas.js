/*
Presentations for canvas.js

@author Grant Dickie
*/


(function($, MITHGrid) {
	MITHGrid.Presentation.namespace("RaphaelCanvas");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphaelCanvas", container, options),
		//create canvas object to be used outside of the Presentation - objects
		//access this to generate shapes
		id = $(container).attr('id'), h, w;
		if(options.cWidth !== undefined) {
			w = options.cWidth;
		}
		else {
			w = $(container).width();
		}
		if(options.cHeight !== undefined) {
			h = options.cHeight;
		} else {
			// measure the div space and make the canvas
			// to fit
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
	
	
	
	
	/*
	* Annotation
	* Presentation for all Annotation objects
	* 
	*/
	
	MITHGrid.Presentation.namespace('Annotation');
	MITHGrid.Presentation.Annotation.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation('Annotation', container, options);
		
		return that;
	};
	
	/*
	* BodyContent
	* For rendering the content of the body element of any annotation
	*/
	MITHGrid.Presentation.namespace('BodyContent');
	MITHGrid.Presentation.BodyContent.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation('BodyContent', container, options);
		
		return that;
	};
}(jQuery, MITHGrid));