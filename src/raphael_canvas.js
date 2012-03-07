/*
Presentations for canvas.js

@author Grant Dickie
*/


 (function($, MITHGrid, OAC) {
    /*
	Presentation that extends SimpleText in order to add new 
	functionality for Annotation HTML lens
	*/
    MITHGrid.Presentation.namespace("AnnotationList");
    MITHGrid.Presentation.AnnotationList.initPresentation = function(container, options) {
        var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.AnnotationList", container, options),
        eventCurrentTimeChange = function(t) {
            var annoIds,
            anno,
            searchAnno,
            start,
            end;

            searchAnno = options.dataView.prepare(['!bodyType']);
            annoIds = searchAnno.evaluate('text');
            $.each(annoIds,
            function(i, o) {
                anno = options.application.dataStore.canvas.getItem(o);
                start = parseInt(anno.ntp_start, 10);
                end = parseInt(anno.ntp_end, 10);
                if ((t >= start) && (t <= end)) {
                    options.application.dataStore.canvas.updateItems([{
                        id: anno.id
                    }]);

                }
            });
        };



        // options.application.events.onCurrentTimeChange.addListener(eventCurrentTimeChange);
        return that;
    };

    MITHGrid.Presentation.namespace("RaphaelCanvas");
    // Presentation for the Canvas area - area that the Raphael canvas is drawn on
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

        x = options.application.cX || $(container).css('x');
        y = options.application.cY || $(container).css('y');

        if (options.application.cWidth !== undefined) {
            w = options.application.cWidth;
        } else {
            w = $(container).width();
        }
        if (options.application.cHeight !== undefined) {
            h = options.application.cHeight;
        } else {
            // measure the div space and make the canvas
            // to fit
            h = $(container).height();
        }
        that.events = that.events || {};
        that.events.onOpacityChange = MITHGrid.initEventFirer(false, false);

        keyboardBinding = keyBoardController.bind($('body'), {});

        $.extend(true, that.events, keyboardBinding.events);


        // init RaphaelJS canvas
        // Parameters for Raphael:
        // @x: value for top left corner
        // @y: value for top left corner
        // @w: Integer value for width of the SVG canvas
        // @h: Integer value for height of the SVG canvas
        // Create canvas at xy and width height
        that.canvas = new Raphael($(container), w, h);
		
        // attach binding
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

        /*
		Registering canvas special events for start, drag, stop
		*/
        canvasBinding.events.onShapeStart.addListener(function(coords) {
            shapeCreateBinding.createGuide(coords);
        });

        canvasBinding.events.onShapeDrag.addListener(function(coords) {
            shapeCreateBinding.resizeGuide(coords);
        });

        canvasBinding.events.onShapeDone.addListener(function(coords) {
            /*
			Adjust x,y in order to fit data store 
			model
			*/
            var shape = shapeCreateBinding.completeShape(coords);
            options.application.insertShape(shape);
        });

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

        eventCurrentTimeChange = function(npt) {
            var annoIds,
            anno,
            fadeIn,
            fadeOut,
            fOpac,
            calcOpacity = function(n, fstart, fend, start, end) {
                var val = 0;
                if ((n < start) && (n >= fstart)) {
                    // fading in
                    val = (1 / (start - n));
                    val = val.toFixed(1);
                } else if ((n > end) && (n <= fend)) {
                    // fading out
                    val = (1 / (n - end));
                    val = val.toFixed(1);
                } else if ((n >= fstart) && (n <= fend) && (n >= start) && (n <= end)) {
                    val = 1;
                }
                return val;
            };

            searchAnnos = options.dataView.prepare(['!type']);
            annoIds = searchAnnos.evaluate('Annotation');
            $.each(annoIds,
            function(i, o) {
                anno = allAnnosModel.getItem(o);
                fadeIn = parseInt(anno.ntp_start, 10) - options.fadeStart;
                fadeOut = parseInt(anno.ntp_end, 10) + options.fadeStart;
                fOpac = calcOpacity(npt, fadeIn, fadeOut, parseInt(anno.ntp_start, 10), parseInt(anno.ntp_end, 10));
                options.application.dataStore.canvas.updateItems([{
                    id: anno.id,
                    x: anno.x,
                    y: anno.y,
                    w: anno.w,
                    h: anno.h,
                    opacity: fOpac
                }]);
            });
        };



        superRender = that.render;

        options.application.events.onCurrentTimeChange.addListener(eventCurrentTimeChange);
        options.application.events.onPlayerChange.addListener(changeCanvasCoordinates);
		options.application.dataStore.canvas.events.onModelChange.addListener(function() {
			editBoundingBoxBinding.detachRendering();
		});
		
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

        return that;
    };
} (jQuery, MITHGrid, OAC));
// End of Presentation constructors
