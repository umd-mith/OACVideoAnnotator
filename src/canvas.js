(function($, MITHGrid, OAC) {
    /**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/
    // generating the canvasId allows us to have multiple instances of the app on a page and still
    // have a unique ID as expected by the Raphaël library
    var canvasId = 1;
    OAC.Client.StreamingVideo.initApp = function(container, options) {
        var renderListItem,
        annoActiveController,
        app,
        svgLens,
        textLens,
        fade,
        myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId,
        xy = [],
        wh = [];

        canvasId += 1;

        /*
		* Creating application to run DOM and presentations
		*/
        app = MITHGrid.Application.initApp("OAC.Client.StreamingVideo", container,
        $.extend(true, {},
        {
            viewSetup:
            // '<div class="mithgrid-toparea">' +
            '<div id="' + myCanvasId + '" class="section-canvas"></div>' +
            // '</div>' +
            '<div class="mithgrid-bottomarea">' +
            '<div class="timeselect">' +
            '<p>Enter start time:</p>' +
            '<input id="timestart" type="text" />' +
            '<p>Enter end time:</p>' +
            '<input id="timeend" type="text" />' +
            '<div id="submittime" class="button">Confirm time settings</div>' +
            '</div>' +
            '<div id="sidebar' + myCanvasId + '" class="section-controls"></div>' +
            '<div class="section-annotations">' +
            '<div class="header">' +
            'Annotations' +
            '</div>' +
            '</div>' +
            '</div>',
            presentations: {
                raphsvg: {
                    container: "#" + myCanvasId,
                    lenses: {
                        /*
							* The following are lenses for shapes that
							* are found in the dataStore. These items are using
							* the MITHGrid.Presentation.RaphaelCanvas.canvas
							* object, which is a Raphaël paper object, to draw
							* themselves.
							*/
                    },
                    lensKey: ['.shapeType']
                },
                annoItem: {
                    container: '.section-annotations',
                    lenses: {
                        //			Rectangle: textLens,
                        //			Ellipse: textLens
                        },
                    //annoItem lenses
                    lensKey: ['.bodyType']
                }
                //annoItem
            }
        },
        options)
        );
        // Set initial size for canvas window
        app.cWidth = 100;
        app.cHeight = 100;
        app.cX = 0;
        app.cY = 0;

        app.shapeTypes = {};

        /*
		svgLens builds an object with functionality common to all SVG shapes on the canvas.
		The methods expect the SVG shape object to be in that.shape
		 */
        app.initShapeLens = function(container, view, model, itemId) {
            var that = {
                id: itemId
            };
            that.eventFocus = function() {
                that.shape.attr({
                    opacity: 1
                }).toFront();
                view.events.onDelete.addListener(that.eventDelete);
            };

            that.eventUnfocus = function() {
                that.shape.attr({
                    opacity: 0.5
                }).toBack();
                view.events.onDelete.removeListener(that.eventDelete);
            };

            that.eventDelete = function(id) {
                if (id === itemId) {
                    model.removeItems([itemId]);
                }
            };

            that.eventResize = function(id, pos) {
                if (id === itemId) {
                    // update item with new width/height
                    model.updateItems([{
                        id: itemId,
                        w: pos.width,
                        h: pos.height
                    }]);
                }
            };

            that.eventMove = function(id, pos) {
                if (id === itemId) {
                    // update item with new x/y
                    model.updateItems([{
                        id: itemId,
                        x: pos.x,
                        y: pos.y
                    }]);
                }
            };

            that.remove = function(item) {
                // getting the removeItems callback
                that.shape.remove();
            };



            return that;
        };

        /*
		textLens returns a rendering of the text body of an annotation regardless of the shape
		 */
        app.initTextLens = function(container, view, model, itemId) {
            var that = {},
            item = model.getItem(itemId),
            itemEl,
            annoEvents,
            bodyContentTextArea,
            bodyContent;
            itemEl =
            $('<div class="anno_item">' +
            '<p class="bodyContentInstructions">Double click here to open edit window.</p>' +
            '<div class="editArea">' +
            '<textarea class="bodyContentTextArea"></textarea>' +
            '<div id="editUpdate" class="button update">Update</div>' +
            '<div id="editDelete" class="button delete">Delete</div>' +
            '</div>' +
            '<div class="body">' +
            '<p class="bodyContent"></p>' +
            '</div>' +
            '</div>');

            bodyContentTextArea = $(itemEl).find(".bodyContentTextArea");
            bodyContent = $(itemEl).find(".bodyContent");

            $(bodyContentTextArea).text(item.bodyContent[0]);
            $(bodyContent).text(item.bodyContent[0]);

            $(container).append(itemEl);
            $(itemEl).find(".editArea").hide();

            // attaching controller to make the
            // HTML highlighted when shape is selected
            annoEvents = annoActiveController.bind(itemEl, {
                model: model,
                itemId: itemId
            });

            that.eventUpdate = function(id, data) {
                if (id === itemId) {
                    model.updateItems([{
                        id: itemId,
                        bodyContent: data
                    }]);
                }
            };

            that.eventFocus = function() {
                itemEl.addClass('selected');
            };

            that.eventUnfocus = function() {
                itemEl.removeClass('selected');
            };

            annoEvents.events.onClick.addListener(app.setActiveAnnotation);
            annoEvents.events.onDelete.addListener(function(id) {
                if (id === itemId) {
                    // delete entire annotation
                    app.dataStore.canvas.removeItems([itemId]);
                }
            });
            annoEvents.events.onUpdate.addListener(that.eventUpdate);

            that.update = function(item) {
                $(itemEl).find(".bodyContent").text(item.bodyContent[0]);
                $(itemEl).find(".bodyContentTextArea").text(item.bodyContent[0]);
            };

            that.remove = function() {
                $(itemEl).remove();
            };

            return that;
        };

        /*
		Creates an HTML div that acts as a button
		*/
        app.buttonFeature = function(area, grouping, action) {
            /*
			Check to make sure button isn't already present
			*/
            if ($('#' + action).length !== 0) {
                return false;
                // Abort
            }

            var that = {},
            item,
            buttons = $(".button"),
            groupEl,
            container = $("#sidebar" + myCanvasId),
            buttonBinding,
            insertButton,
            insertSlider;

            if (area === 'buttongrouping') {
                /*
				Set the group element where this button should go in. If no group 
				element is yet created, create that group element with name *grouping*
				*/
                if ($(container).find('#' + grouping).length === 0) {
                    $(container).append('<div id="' + grouping + '" class="buttongrouping"></div>');
                }

                groupEl = $("#" + grouping);

                /*
				generate HTML for button, then attach the callback. action
				refers to ID and also the title of the button
				*/
                item = '<div id="' + action + '" class="button">' + action + '</div>';

                $(groupEl).append(item);

                that.element = $("#" + action);

                buttonBinding = app.controller.buttonActive.bind(that.element, {
                    action: action
                });
            } else if (area === 'slidergrouping') {
                if ($(container).find('#' + grouping).length === 0) {
                    $(container).append('<div id="' + grouping + '" class="slidergrouping"></div>');
                }

                groupEl = $("#" + grouping);

                /*
				HTML for slider button
				*/
                item = '<div id="' + action + '"><div class="header">' + action + '</div>' +
                '<div id="slider"></div><div class="timedisplay"></div></div>';
                $(groupEl).append(item);
                that.element = $("#" + action);

                buttonBinding = app.controller.slider.bind(that.element, {
                    action: action
                });
            }
            return that;
        };

        app.addShape = function(key, svgShape) {
            app.presentation.raphsvg.addLens(key, svgShape);
        };

        app.addBody = function(key, textLens) {
            app.presentation.annoItem.addLens(key, textLens);
        };

        /*
		Adding a shape type, which includes lens, button to activate shape mode,
		and dataStore item load function
		*/
        app.addShapeType = function(type, args) {
            var button,
            calcF,
            lensF;

            calcF = args.calc;
            lensF = args.lens;
            button = app.buttonFeature('Shapes', type);
            // add to shapeTypes array
            app.shapeTypes[type] = {
                calc: calcF
            };
            app.addShape(type, lensF);
        };

        /*
		*
		Called Externally to insert a shape into the data Store regardless of what SVG
		type it is
		*/
        app.insertShape = function(coords) {
            var shapeItem,
            idSearch = app.dataStore.canvas.prepare(['!type']),
            idCount = idSearch.evaluate('Annotation'),
            ntp_start = app.getCurrentTime() - 5,
            ntp_end = app.getCurrentTime() + 5,
            curMode = app.getCurrentMode(),
            shape;

            shape = app.shapeTypes[curMode].calc(coords);

            shapeItem = {
                id: "anno" + idCount.length,
                type: "Annotation",
                bodyType: "Text",
                bodyContent: "This is an annotation for " + curMode,
                shapeType: curMode,
                opacity: 1,
                ntp_start: parseInt(ntp_start, 10),
                ntp_end: parseInt(ntp_end, 10)
            };

            $.extend(shapeItem, shape);
            app.dataStore.canvas.loadItems([shapeItem]);
        };

        /*
		Exports all annotation data as JSON. All 
		SVG data is converted to generic units
		*/
        app.exportShapes = function() {
            var canvasWidth,
            canvasHeight;

            canvasWidth = $('#' + myCanvasId).width();
            canvasHeight = $('#' + myCanvasId).height();

            $.each([]);
        };


        app.ready(function() {
            annoActiveController = app.controller.annoActive;
            app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventFocusChange);
            app.events.onActiveAnnotationChange.addListener(app.presentation.annoItem.eventFocusChange);
            app.events.onCurrentTimeChange.addListener(function(t) {
                // five seconds on either side of the current time
                app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5);
            });


            app.events.onPlayerChange.addListener(function(playerobject) {
                app.setCurrentTime(playerobject.getPlayhead());
                playerobject.onPlayheadUpdate(function(t) {
                    app.setCurrentTime((app.getCurrentTime() + 1));
                });
                app.events.onCurrentModeChange.addListener(function(nmode) {
                    if (nmode !== 'Watch') {
                        playerobject.pause();
                    } else if (nmode === 'Watch') {
                        playerobject.play();
                    }
                });

            });
        });

        app.ready(function() {
            var calcRectangle,
            calcEllipse,
            lensRectangle,
            lensEllipse,
            rectButton,
            ellipseButton,
            selectButton,
            sliderButton,
            exportRectangle,
            watchButton,
            timeControlBinding;

            calcRectangle = function(coords) {
                var attrs = {};
                attrs.x = (coords.x + (coords.width / 2));
                attrs.y = (coords.y + (coords.height / 2));
                attrs.w = coords.width;
                attrs.h = coords.height;
                return attrs;
            };
            exportRectangle = function(item, w, h) {
                var attrs = {},
                itemCopy;
                itemCopy = $.extend(true, {},
                item);

                attrs.x = (itemCopy.x / w) * 100;
                attrs.y = (itemCopy.y / h) * 100;
                attrs.w = (itemCopy.w / w) * 100;
                attrs.h = (itemCopy.h / h) * 100;

                $.extend(itemCopy, attrs);

                return itemCopy;
            };
            lensRectangle = function(container, view, model, itemId) {
                // Note: Rectangle measurements x,y start at CENTER
                var that = app.initShapeLens(container, view, model, itemId),
                item = model.getItem(itemId),
                c,
                bbox;
                // Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
                c = view.canvas.rect(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.w[0], item.h[0]);
                // fill and set opacity
                c.attr({
                    fill: "red",
                    opacity: item.opacity
                });
                $(c.node).attr('id', item.id[0]);
                that.update = function(item) {
                    // receiving the Object passed through
                    // model.updateItems in move()
                    try {
                        if (item.x !== undefined && item.y !== undefined && item.w !== undefined && item.h !== undefined) {
                            c.attr({
                                x: item.x[0] - item.w[0] / 2,
                                y: item.y[0] - item.h[0] / 2,
                                width: item.w[0],
                                height: item.h[0],
                                opacity: item.opacity
                            });
                        }
                    } catch(e) {
                        MITHGrid.debug(e);
                    }
                    // Raphael object is updated
                };

                // attach listener to opacity change event
                view.events.onOpacityChange.addListener(function(n) {
                    $(c).attr('opacity', n);
                });

                // calculate the extents (x, y, width, height)
                // of this type of shape
                that.getExtents = function() {
                    return {
                        x: c.attr("x") + (c.attr("width") / 2),
                        y: c.attr("y") + (c.attr("height") / 2),
						width: c.attr("width"),
                        height: c.attr("height")
                    };
                };

                // register shape
                that.shape = c;
                return that;
            };

            app.addShapeType("Rectangle",
            {
                calc: calcRectangle,
                lens: lensRectangle
            });

            calcEllipse = function(coords) {
                var attrs = {};
                attrs.x = coords.x + (coords.width / 2);
                attrs.y = coords.y + (coords.height / 2);
                attrs.w = coords.width;
                attrs.h = coords.height;
                return attrs;
            };

            lensEllipse = function(container, view, model, itemId) {
                var that = app.initShapeLens(container, view, model, itemId),
                item = model.getItem(itemId),
                c;
                // create the shape
                c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0] / 2, item.h[0] / 2);
                // fill shape
                c.attr({
                    fill: "red",
                    opacity: 0.5
                });


                that.update = function(item) {
                    // receiving the Object passed through
                    // model.updateItems in move()
                    try {
                        if (item.x !== undefined && item.y !== undefined) {
                            c.attr({
                                cx: item.x[0],
                                cy: item.y[0],
                                rx: item.w[0] / 2,
                                ry: item.h[0] / 2
                            });
                        }
                    } catch(e) {
                        MITHGrid.debug(e);

                    }
                    // Raphael object is updated
                };

                // calculate the extents (x, y, width, height)
                // of this type of shape
                that.getExtents = function() {
                    return {
                        x: c.attr("cx"),
                        y: c.attr("cy"),
                        width: (c.attr("rx") * 2),
                        height: (c.attr("ry") * 2)
                    };
                };

                // register shape
                that.shape = c;

                return that;
            };
            app.addShapeType("Ellipse", {
                calc: calcEllipse,
                lens: lensEllipse
            });

            app.addBody("Text", app.initTextLens);

            /*
			Adding in button features for annotation creation
			*/

            rectButton = app.buttonFeature('buttongrouping', 'Shapes', 'Rectangle');

            ellipseButton = app.buttonFeature('buttongrouping', 'Shapes', 'Ellipse');

            selectButton = app.buttonFeature('buttongrouping', 'General', 'Select');

            watchButton = app.buttonFeature('buttongrouping', 'General', 'Watch');

            app.setCurrentTime(0);

            // binding time controller to time DOM
            timeControlBinding = app.controller.timecontrol.bind('.timeselect', {});
            timeControlBinding.events.onUpdate.addListener(function(id, start, end) {
                app.dataStore.canvas.updateItems([{
                    id: id,
                    ntp_start: start,
                    ntp_end: end
                }]);
            });

        });

        return app;
    };
} (jQuery, MITHGrid, OAC));

// Default library for the Canvas application
