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
        eventCurrentTimeChange,
        searchAnnos,
        allAnnosModel;

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
               
                if (parseInt(anno.opacity, 10) !== fOpac) {
                    allAnnosModel.updateItems([{
                        id: anno.id,
                        x: anno.x,
                        y: anno.y,
                        w: anno.w,
                        h: anno.h,
                        opacity: calcOpacity(npt, fadeIn, fadeOut, parseInt(anno.ntp_start, 10), parseInt(anno.ntp_end, 10))
                    }]);
                }
            });
        };

        that.events = that.events || {};
        for (e in keyboardBinding.events) {
            that.events[e] = keyboardBinding.events[e];
        }

        superRender = that.render;

        options.application.events.onCurrentTimeChange.addListener(eventCurrentTimeChange);

        that.render = function(c, m, i) {
            var rendering = superRender(c, m, i),
            tempStore;
            if (rendering !== undefined) {
                canvasBinding.registerRendering(rendering);
                tempStore = m;
                while (tempStore.dataStore) {

                    tempStore = tempStore.dataStore;
                }
                allAnnosModel = tempStore;
                searchAnnos = options.dataView.prepare(['!type']);

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
