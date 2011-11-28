/*
Presentations for canvas.js

@author Grant Dickie
*/


(function ($, MITHGrid, OAC) {
	MITHGrid.Presentation.namespace("AnnotationList");
	MITHGrid.Presentation.AnnotationList.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("AnnotationList", container, options), activeRenderingId;

		// that.annoListController = annoActiveController.bind($(container), {});
		that.eventActiveRenderingChange = function(id) {
			var rendering;
			if(typeof activeRenderingId !== "undefined" && activeRenderingId !== null) {
				rendering = that.renderingFor(activeRenderingId);
			}
			if(activeRenderingId !== id) {
				if(rendering && typeof rendering.makeInactive !== "undefined") {
					rendering.makeInactive();
				}
				if(typeof id !== "undefined" && id !== null) {
					rendering = that.renderingFor(id);
					if(rendering && typeof rendering.makeActive !== "undefined") {
						rendering.makeActive();
					}
				}
				activeRenderingId = id;
			}
		};
		
		return that;
	};

	MITHGrid.Presentation.namespace("RaphaelCanvas");
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function (container, options) {
		var that = MITHGrid.Presentation.initPresentation("RaphaelCanvas", container, options),
			id = $(container).attr('id'), h, w, activeRenderingId, 
			canvasController, keyBoardController, editBoxController;
		
		canvasController = OAC.Client.StreamingVideo.Controller.canvasController({
			application: that.options.application,
			selectors: {
				svg: ''
			}
		});
		
		keyBoardController = OAC.Client.StreamingVideo.Controller.keyBoardListener({
			application: that.options.application,
			selectors: {
				doc: ''
			}
		});
		
		editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({
			application: that.options.application
		});
			
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
		that.canvasEvents = canvasController.bind(container, {

			closeEnough: 5,
			paper: that.canvas
		});

		that.editBoundingBox = editBoxController.bind($(container), {
			paper: that.canvas
		});

		that.keyBoardListener = keyBoardController.bind($('body'), {});

		that.eventActiveRenderingChange = function(id) {
			var rendering;
			if(typeof activeRenderingId !== "undefined" && activeRenderingId !== null) {
				rendering = that.renderingFor(activeRenderingId);
			}
			if(activeRenderingId !== id) {
				if(rendering && typeof rendering.makeInactive !== "undefined") {
					rendering.makeInactive();
				}
				if(typeof id !== "undefined" && id !== null) {
					rendering = that.renderingFor(id);
					if(rendering && typeof rendering.makeActive !== "undefined") {
						rendering.makeActive();
					}
				}
				activeRenderingId = id;
			}
		};
				
		return that;
	};
}(jQuery, MITHGrid, OAC));
// End of Presentation constructors
