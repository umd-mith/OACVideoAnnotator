/*
Presentations for canvas.js

@author Grant Dickie
*/


(function($, MITHGrid) {
	var canvasController = OAC.Client.StreamingVideo.Controller.canvasController({
		selectors: {
			svg: ''
		}
	}),
	editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({}),
	keyBoardController = OAC.Client.StreamingVideo.Controller.keyBoardListener({
		selectors: {
			doc: ''
		}
	});
	
	
	MITHGrid.Presentation.namespace("AnnotationList");
	MITHGrid.Presentation.AnnotationList.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("AnnotationList", container, options);
		
		
		
		return that;
	};
	
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
		
		
		// attach binding
		that.canvasEvents = canvasController.bind(container, {
			
			closeEnough: 5,
			paper: that.canvas
		});
		
		that.editBoundingBox = editBoxController.bind($(container), {
			paper: that.canvas
		});
		
		that.keyBoardListener = keyBoardController.bind($(document), {});
		
		
		return that;
	};
}(jQuery, MITHGrid));