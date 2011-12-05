/*
Presentations for canvas.js

@author Grant Dickie
*/


(function ($, MITHGrid, OAC) {
<<<<<<< HEAD
	var canvasController, editBoxController, keyBoardController;
	canvasController = OAC.Client.StreamingVideo.Controller.canvasClickController({
		selectors: {
			svg: ''
		}
	});
	editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({

	});
	keyBoardController = OAC.Client.StreamingVideo.Controller.keyBoardListener({
		selectors: {
			doc: ''
		}
	});
	


=======
>>>>>>> f9e46cec8fbafd7cc37c8a1255f8d492a0d9f99d
	MITHGrid.Presentation.namespace("AnnotationList");
	MITHGrid.Presentation.AnnotationList.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.AnnotationList", container, options);

		return that;
	};

	MITHGrid.Presentation.namespace("RaphaelCanvas");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.RaphaelCanvas", container, options),
			id = $(container).attr('id'), h, w, 
			canvasController, keyBoardController, editBoxController, superRender, canvasBinding, keyboardBinding, e,
			superEventFocusChange, editBoundingBoxBinding;
		
		options = that.options;
		
		canvasController = options.controllers.canvas;
		keyBoardController = options.controllers.keyboard;
		editBoxController = options.controllers.editBox;
			
		if (options.cWidth !== undefined) {
			w = options.cWidth;
		}
		else {
			w = $(container).width();
		}
		if (options.cHeight !== undefined) {
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
		canvasBinding = canvasController.bind($(container), {
			closeEnough: 5,
			paper: that.canvas
		});

		editBoundingBoxBinding = editBoxController.bind($(container), {
			paper: that.canvas
		});
		
		keyboardBinding = keyBoardController.bind($('body'), {});
		
		that.events = that.events || {};
		for(e in keyboardBinding.events) {
			that.events[e] = keyboardBinding.events[e];
		}
		
		superRender = that.render;
		
		that.render = function(c, m, i) {
			var rendering = superRender(c, m, i);
			if(rendering !== undefined) {
				canvasBinding.registerRendering(rendering);
			}
			return rendering;
		};
		
		superEventFocusChange = that.eventFocusChange;
		
		that.eventFocusChange = function(id) {
			superEventFocusChange(id);
			editBoundingBoxBinding.attachRendering(that.renderingFor(id));
		};
				
		return that;
	};
}(jQuery, MITHGrid, OAC));
// End of Presentation constructors
