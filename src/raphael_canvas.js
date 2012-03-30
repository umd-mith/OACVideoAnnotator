
// # Presentations
//
// TODO: rename file to presentation.js
//
// Presentations for canvas.js
// @author Grant Dickie
//


(function($, MITHGrid, OAC) {
	// ## AnnotationList
	//
	// Presentation that extends SimpleText in order to add new 
	// functionality for Annotation HTML lens
	//
	MITHGrid.Presentation.namespace("AnnotationList");
	MITHGrid.Presentation.AnnotationList.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.AnnotationList", container, options);

		return that;
	};

	// ## RaphaelCanvas
	//
	// Presentation for the Canvas area - area that the Raphael canvas is drawn on
	//
	MITHGrid.Presentation.namespace("RaphaelCanvas");
	MITHGrid.Presentation.RaphaelCanvas.initPresentation = function(container, options) {
		var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.RaphaelCanvas", container, options),
		id = $(container).attr('id'),
		h,
		w,
		x,
		y,
		canvasController,
		keyBoardController,
		editBoxController,
		superRender,
		canvasBinding,
		keyboardBinding,
		shapeCreateController,
		shapeCreateBinding,
		windowResizeController,
		windowResizeBinding,
		changeCanvasCoordinates,
		e,
		superEventFocusChange,
		editBoundingBoxBinding,
		eventCurrentTimeChange,
		searchAnnos,
		allAnnosModel,
		initCanvas,
		cachedRendering, xy, wh;

		options = that.options;
		


		canvasController = options.controllers.canvas;
		keyBoardController = options.controllers.keyboard;
		editBoxController = options.controllers.shapeEditBox;
		shapeCreateController = options.controllers.shapeCreateBox;
		windowResizeController = options.controllers.windowResize;
		
		x = $(container).css('x');
		y = $(container).css('y');

		
		w = $(container).width();
		// measure the div space and make the canvas
		// to fit
		h = $(container).height();

		// FIXME: We need to change this. If we have multiple videos on a page, this will break.
		keyboardBinding = keyBoardController.bind($('body'), {});

		that.events = $.extend(true, that.events, keyboardBinding.events);


		// init RaphaelJS canvas
		// Parameters for Raphael:
		// * @x: value for top left corner
		// * @y: value for top left corner
		// * @w: Integer value for width of the SVG canvas
		// * @h: Integer value for height of the SVG canvas
		// Create canvas at xy and width height
		that.canvas = new Raphael($(container), w, h);
	
		// attach binding
		// FIXME: We need to change this. If we have multiple videos on a page, this will break.
		canvasBinding = canvasController.bind($('body'), {
			closeEnough: 5,
			paper: that.canvas
		});

		editBoundingBoxBinding = editBoxController.bind($(container), {
			paper: that.canvas
		});

		shapeCreateBinding = shapeCreateController.bind($(container), {
			paper: that.canvas
		});
		
		// FIXME: We need to change this. If we have multiple videos on a page, this will break.
		windowResizeBinding = windowResizeController.bind(window);
	
		windowResizeBinding.events.onResize.addListener(function() {
			var x, y, w, h, containerEl, canvasEl, htmlWrapper;
			// the following elements should be parts of this presentation
			canvasEl = $('body').find('svg');
			containerEl = $('body').find('#myplayer');
			htmlWrapper = $('body').find('.section-canvas');
			x = parseInt($(containerEl).offset().left, 10);
			y = parseInt($(containerEl).offset().top, 10);
			w = parseInt($(containerEl).width(), 10);
			h = parseInt($(containerEl).height(), 10);

			$(canvasEl).css({
				left: x + 'px',
				top: y + 'px',
				width: w + 'px',
				height: h + 'px'
			});
			
			$(htmlWrapper).css({
				left: x + 'px',
				top: y + 'px',
				width: w + 'px',
				height: h + 'px'
			});
		});
		
		//
		// Registering canvas special events for start, drag, stop
		//
		canvasBinding.events.onShapeStart.addListener(function(coords) {
			shapeCreateBinding.createGuide(coords);
		});

		canvasBinding.events.onShapeDrag.addListener(function(coords) {
			shapeCreateBinding.resizeGuide(coords);
		});

		canvasBinding.events.onShapeDone.addListener(function(coords) {
			//
			// Adjust x,y in order to fit data store 
			// model
			//
			var shape = shapeCreateBinding.completeShape(coords);
			options.application.insertShape(shape);
		});
		
		
		//
		// Called whenever a player is set by the Application. 
		// Assumes that said player object has getcoordinates() and 
		// getsize() as valid methods that return arrays.
		//
		changeCanvasCoordinates = function(args) {
			if (args !== undefined) {
				
				// player passes args of x,y and width, height
				xy = args.getcoordinates();
				wh = args.getsize();
				// move container and change size
				$(container).css({
					left: (parseInt(xy[0], 10) + 'px'),
					top: (parseInt(xy[1], 10) + 'px'),
					width: wh[0],
					height: wh[1]
				});
				// Move canvas SVG to this location
				$('svg').css({
					left: (parseInt(xy[0], 10) + 'px'),
					top: (parseInt(xy[1], 10) + 'px'),
					width: wh[0],
					height: wh[1]
				});

			}
		};

		//
		// Called when the time change event is fired. Makes sure
		// that the present annotations are queued and have the correct
		// opacity (Fades as it comes into play and fades as it goes out
		// of play)
		//
		eventCurrentTimeChange = function(npt) {
			that.visitRenderings(function(id, rendering) {
				if(rendering.eventCurrentTimeChange !== undefined) {
					rendering.eventCurrentTimeChange(npt);
				}
			});
		};

		eventTimeEasementChange = function(te) {
			that.visitRenderings(function(id, rendering) {
				if(rendering.eventTimeEasementChange !== undefined) {
					rendering.eventTimeEasementChange(te);
				}
			});
		};

		options.application.events.onCurrentTimeChange.addListener(eventCurrentTimeChange);
		options.application.events.onPlayerChange.addListener(changeCanvasCoordinates);
		options.application.dataStore.canvas.events.onModelChange.addListener(function() {
			editBoundingBoxBinding.detachRendering();
		});
		
		superRender = that.render;
		
		that.render = function(c, m, i) {
			var rendering = superRender(c, m, i),
			tempStore;
			if (rendering !== undefined) {

				tempStore = m;
				while (tempStore.dataStore) {

					tempStore = tempStore.dataStore;
				}
				allAnnosModel = tempStore;
				searchAnnos = options.dataView.prepare(['!type']);
				
				canvasBinding.registerRendering(rendering);
			}
			return rendering;
		};

		that.renderItems = function() {

		};

		superEventFocusChange = that.eventFocusChange;

		that.eventFocusChange = function(id) {
			if (options.application.getCurrentMode() === 'Select') {
				superEventFocusChange(id);
				editBoundingBoxBinding.attachRendering(that.renderingFor(id));
			}
		};
		//console.log(that);

		return that;
	};
} (jQuery, MITHGrid, OAC));
// End of Presentation constructors
