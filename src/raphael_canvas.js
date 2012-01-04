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
        var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.AnnotationList", container, options);

        return that;
    };

    MITHGrid.Presentation.namespace("RaphaelCanvas");
    // Presentation for the Canvas area - area that the Raphael canvas is drawn on
    MITHGrid.Presentation.RaphaelCanvas.initPresentation = function(container, options) {
        var that = MITHGrid.Presentation.initPresentation("MITHGrid.Presentation.RaphaelCanvas", container, options),
        id = $(container).attr('id'),
        h,
        w,
        canvasController,
        keyBoardController,
        editBoxController,
        superRender,
        canvasBinding,
        keyboardBinding,
        shapeCreateController,
        shapeCreateBinding,
        e,
        superEventFocusChange,
        editBoundingBoxBinding,
        eventCurrentTimeChange;

        options = that.options;



        canvasController = options.controllers.canvas;
        keyBoardController = options.controllers.keyboard;
        editBoxController = options.controllers.shapeEditBox;
        shapeCreateController = options.controllers.shapeCreateBox;

        if (options.cWidth !== undefined) {
            w = options.cWidth;
        } else {
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

        shapeCreateBinding = shapeCreateController.bind($(container), {
            paper: that.canvas
        });

        keyboardBinding = keyBoardController.bind($('body'), {});

        eventCurrentTimeChange = function(npt) {
            var searchAnnos,
            annoIds,
            anno,
            fadeIn,
            fadeOut,
            calcOpacity = function(n, start, end) {
                if (n < start) {
                    // fading in
                    return (1 / (start - n));
                } else if (n > end) {
                    // fading out
                    return (1 / (n - end));
                } else if (n > start && n < end) {
                    return 1;
                } else {
                    return 0;
                }
            };

            searchAnnos = options.application.dataStore.canvas.prepare(['.type']);
            annoIds = searchAnnos.evaluate('Annotation');
            $.each(annoIds,
            function(i, o) {
                anno = options.application.dataStore.canvas.getItem(o);
                fadeIn = anno[0].npt_start - options.fadeStart;
                fadeOut = anno[0].npt_end + options.fadeStart;

                options.application.dataStore.canvas.updateItems([{
                    id: anno[0].id,
                    type: anno[0].type,
                    opacity: calcOpacity(npt, fadeIn, fadeOut)
                }]);
            });

        };

        that.events = that.events || {};
        for (e in keyboardBinding.events) {
            that.events[e] = keyboardBinding.events[e];
        }

        superRender = that.render;

        options.application.events.onCurrentTimeChange.addListener(eventCurrentTimeChange);

        that.render = function(c, m, i) {
            var rendering = superRender(c, m, i);
            if (rendering !== undefined) {
                canvasBinding.registerRendering(rendering);
            }
            return rendering;
        };

        superEventFocusChange = that.eventFocusChange;

        that.eventFocusChange = function(id) {
            superEventFocusChange(id);
            editBoundingBoxBinding.attachRendering(that.renderingFor(id));
        };

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

        return that;
    };
} (jQuery, MITHGrid, OAC));
// End of Presentation constructors
