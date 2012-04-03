// # Annotation Application
//
// TODO: rename file to application.js
(function($, MITHGrid, OAC) {
    var canvasId,
    S4,
    uuid;

    // #S4 (private)
    //
    // Generates a UUID value, this is not a global uid
    //
    // Returns:
    // String with 16-byte pattern
    S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    // #uuid (private)
    //
    // Generates a UUID
    //
    // This is not a global variable - theoretically could clash with another
    // variable if enough MITHGrid instances are started. Works now as a local
    // unique ID
    // **FIXME: Abstract so that there is a server prefix component that insures
    // more of a GUID
    //
    uuid = function() {
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };

    // Create a Unique identifier
    // **FIXME: abstract this so that it is performed server-side, and we attach
    // server-side GUID as prefix to local, browser-side UUID
    canvasId = uuid();

    // ## StreamingVideo.initApp
    //
    // Parameters:
    //
    // * container - the DOM container in which the application should place its content
    // * options - an object holding configuration information
    //
    //
    // Returns:
    //
    // The configured OAC streaming video annotation client object.
    //
    // Options:
    //
    // Currently, there are no required option settings.
    OAC.Client.StreamingVideo.initApp = function(container, options) {
        var renderListItem,
        app,
        svgLens,
        textLens,
        fade,
        shapeTypes = {},
        shapeAnnotationId = 0,
        myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId,
        xy = [],
        wh = [];

        // Generating the canvasId allows us to have multiple instances of the application on a page and still
        // have a unique ID as expected by the Raphaël library.
        canvasId += 1;

        app = MITHGrid.Application.initApp("OAC.Client.StreamingVideo", container,
        $.extend(true, {},
        {
            // We create a general template that holds all of the different DOM elements we need:
            //
            // * the SVG view that will overlay the play surface (myCanvasId is the DOM id)
            // * the time selection input area (.timeselect)
            // * the controls (.section-controls)
            // * the annotations (.section-annotations)
            //
            // TODO: Split out display of modes into a separate issue... let this application focus on
            //		 the display of annotations and targets instead of the chrome.
            //		 We'll put together a demo page that does have all of the parts working together.
            viewSetup:
            '<div id="' + myCanvasId + '" class="section-canvas"></div>' +
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
            // We make the isActive() function available to the keyboard controller to let it know if
            // the keyboard should be considered active.
            controllers: {
                keyboard: {
                    isActive: function() {
                        return app.getCurrentMode() !== 'Editing';
                    }
                },
                selectShape: {
                    isSelectable: function() {
                        if (app.getCurrentMode() === "Select") {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                }
            },
            // We connect the SVG overlay and annotation sections of the DOM with their respective
            // presentations.
            presentations: {
                raphsvg: {
                    container: "#" + myCanvasId,
                    lenses: {},
                    lensKey: ['.shapeType']
                },
                annoItem: {
                    container: '.section-annotations',
                    lenses: {},
                    lensKey: ['.bodyType']
                }
            }
        },
        options)
        );

        // ### #initShapeLens
        //
        // Initializes a basic shape lens. The default methods expect the Raphaël SVG shape object to
        // be held in the .shape property.
        //
        // Parameters:
        //
        // * container - the container holding the lens content
        // * view - the presentation managing the collection of renderings
        // * model - the data store or data view holding information about the item to be rendered
        // * itemId - the item ID of the item to be rendered
        //
        // Returns:
        //
        // The basic lens object with the following methods defined:
        app.initShapeLens = function(container, view, model, itemId) {
            var that = {
                id: itemId
            },
            calcOpacity,
            focused,
            opacity,
            start,
            end,
            fstart,
            fend,
            item = model.getItem(itemId);

            // ### #calcOpacity (private)
            //
            // Calculate the opacity of the annotation shape rendering over the video.
            //
            // Parameters:
            //
            // * n - the current time of the play head
            //
            calcOpacity = function(n) {
                var val = 0;

                if (n < fstart || n > fend) {
                    return 0.0;
                }

                if (n < start) {
                    // fading in
                    val = (1 / (start - n));
                    val = val.toFixed(3);
                } else if (n > end) {
                    // fading out
                    val = (1 / (n - end));
                    val = val.toFixed(3);
                } else {
                    val = 1;
                }
                return val;
            };

            start = item.ntp_start[0];
            end = item.ntp_end[0];
            fstart = start - app.getTimeEasement();
            fend = end + app.getTimeEasement();

            opacity = calcOpacity(app.getCurrentTime());


            // ### eventTimeEasementChange (private)
            //
            // Handles event calls for when the user wants
            // to see the annotation at a specific interval.
            // By default, annotations are in view for the time period
            // of the item being annotated. They are 'eased in', or fade in
            // and out depending on the Easement variable, which is set
            // here.
            //
            // Parameters:
            //
            // * v: when the annotation should be in view
            //
            that.eventTimeEasementChange = function(v) {
                fstart = start - v;
                fend = end + v;
                that.setOpacity(calcOpacity(app.getCurrentTime()));
            };

            // ### eventCurrentTimeChange (private)
            //
            // Handles when application advances the time
            //
            // Parameters:
            //
            // *n: current time of the video player
            //
            that.eventCurrentTimeChange = function(n) {
                that.setOpacity(calcOpacity(n));
            };

            // #### #setOpacity
            //
            // Sets the opacity for the SVG shape. This is moderated by the renderings focus. If in focus, then
            // the full opacity is set. Otherwise, it is halved.
            //
            // If no value is given, then the shape's opacity is updated to reflect the currently set opacity and
            // focus state.
            //
            // Parameters:
            //
            // * o - opacity when in focus
            //
            // Returns: Nothing.
            //
            that.setOpacity = function(o) {
                if (o !== null && o !== undefined) {
                    opacity = o;
                }
                that.shape.attr({
                    opacity: (focused ? 1.0: 0.5) * opacity
                });
            };

            // #### #eventFocus
            //
            // Called when this rendering receives the selection focus. The default implementation brings the rendering
            // to the front and makes it opaque.
            //
            that.eventFocus = function() {
                focused = 1;
                that.setOpacity();
                that.shape.toFront();
                view.events.onDelete.addListener(that.eventDelete);
            };

            // #### #eventUnfocus
            //
            // Called when this rendering loses the selection focus. The default implementation pushes the rendering
            // to the back and makes it semi-transparent.
            //
            that.eventUnfocus = function() {
                focused = 0;
                that.setOpacity();
                that.shape.toBack();
                view.events.onDelete.removeListener(that.eventDelete);
            };

            // #### #eventDelete
            //
            // Called when the data item represented by this rendering is to be deleted. The default implementation
            // passes the deletion request to the data store with the item ID represented by the rendering.
            //
            // Parameters: None.
            //
            // Returns: Nothing.
            //
            that.eventDelete = function() {
                model.removeItems([itemId]);
            };

            // #### #eventResize
            //
            // Called when the bounding box of the rendering changes size.
            //
            // Parameters:
            //
            // * pos - object containing the .width and .height properties
            //
            // Returns: Nothing.
            //
            that.eventResize = function(pos) {
                model.updateItems([{
                    id: itemId,
                    w: pos.width,
                    h: pos.height
                }]);
            };

            // #### #eventMove
            //
            // Called when the bounding box of the rendering is moved.
            //
            // Parameters:
            //
            // * pos - object containing the .x and .y properties
            //
            // Returns: Nothing.
            //
            that.eventMove = function(pos) {
                model.updateItems([{
                    id: itemId,
                    x: pos.x,
                    y: pos.y
                }]);
            };

            // #### #update
            //
            // Updates the rendering's opacity based on the current time and the time extent of the annotation.
            //
            that.update = function(item) {
                if (item.ntp_start[0] !== start || item.ntp_end[0] !== end) {
                    start = item.ntp_start[0];
                    end = item.ntp_end[0];
                    fstart = start - app.getTimeEasement();
                    fend = end + app.getTimeEasement();
                    that.setOpacity(calcOpacity(app.getCurrentTime()));
                }
            };

            // #### #remove
            //
            // Called to remove the rendering from the presentation.
            //
            that.remove = function(item) {
                that.shape.remove();
            };

            return that;
        };

        // ### #initTextLens
        //
        // Initializes a basic text lens.
        //
        // Parameters:
        //
        // * container - the container holding the lens content
        // * view - the presentation managing the collection of renderings
        // * model - the data store or data view holding information abut the item to be rendered
        // * itemId - the item ID of the item to be rendered
        //
        // Returns:
        //
        // The basic lens object.
        //
        app.initTextLens = function(container, view, model, itemId) {
            var that = {},
            item = model.getItem(itemId),
            itemEl,
            annoEvents,
            bodyContentTextArea,
            bodyContent;

            // We put together a template representing the text annotations associated with any shape.
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

            // We capture the parts of the annotation presentation for use later.
            bodyContentTextArea = $(itemEl).find(".bodyContentTextArea");
            bodyContent = $(itemEl).find(".bodyContent");

            $(bodyContentTextArea).text(item.bodyContent[0]);
            $(bodyContent).text(item.bodyContent[0]);

            // We attach the rendering to the container and hide the edit area.
            $(container).append(itemEl);
            $(itemEl).find(".editArea").hide();



            // We then construct the following methods:
            // #### #eventFocus
            //
            // Called when this rendering receives the selection focus. The default implementation adds the
            // .selected CSS class.
            //
            that.eventFocus = function() {
                itemEl.addClass('selected');
            };

            // #### #eventUnfocus
            //
            // Called when this rendering loses the selection focus. The default implementation removes the
            // .selected CSS class.
            //
            that.eventUnfocus = function() {
                itemEl.removeClass('selected');
            };

            // #### #eventUpdate
            //
            //
            // Called when the text annotation body is updated. This will update the data store with the new body.
            //
            // The rendering is update if and only if the id passed in matches the id of the rendered item.
            //
            // Parameters:
            //
            // * id - the item ID of the item to be updated
            // * data - the object holding the current data associated with the item ID
            //
            // Returns: Nothing.
            //
            that.eventUpdate = function(id, data) {
                if (id === itemId) {
                    model.updateItems([{
                        id: itemId,
                        bodyContent: data
                    }]);
                }
            };

            // #### #eventDelete
            //
            // Called when the data item represented by this rendering is to be deleted. The default implementation
            // passes the deletion request to the data store with the item ID represented by the rendering.
            //
            // The data item is removed if and only if the id passed in matches the id of the rendered item.
            //
            // Parameters:
            //
            // * id - the item ID of the item to be deleted
            //
            // Returns: Nothing.
            //
            that.eventDelete = function(id) {
                if (id === itemId) {
                    model.removeItems([itemId]);
                }
            };

            // #### #update
            //
            // Called when the underlying data represented by the rendering changes. The rendering is updated to
            // reflect the item data.
            //
            // The rendering is update if and only if the id passed in matches the id of the rendered item.
            //
            // Parameters:
            //
            // * data - the object holding the current data associated with the item ID
            //
            // Returns: Nothing.
            //
            that.update = function(item) {
                $(itemEl).find(".bodyContent").text(item.bodyContent[0]);
                $(itemEl).find(".bodyContentTextArea").text(item.bodyContent[0]);
            };

            // #### #remove
            //
            // Called to remove the rendering from the presentation.
            //
            that.remove = function() {
                $(itemEl).remove();
            };

            // #### UI events
            //
            // We attach a controller to highlight the
            // HTML when the corresponding shape is selected.
            annoEvents = app.controller.annoActive.bind(itemEl, {
                model: model,
                itemId: itemId
            });

            // We hook up the events generated by the controller to events on the application or
            // rendering, as appropriate.
            annoEvents.events.onClick.addListener(app.setActiveAnnotation);
            annoEvents.events.onDelete.addListener(that.eventDelete);
            annoEvents.events.onUpdate.addListener(that.eventUpdate);


            return that;
        };

        // ### app.buttonFeature
        //
        // Creates an HTML div that acts as a button
        //
        // **FIXME: Tease this out from the rest of the application and work on better parameters
        //
        // Parameters:
        //
        // * area - Classname of the div where the button should go; so far, this can be either 'buttongrouping', where all
		//  general buttons go, or 'slidergrouping', where a jQuery UI slider can be placed
		// 
		// * grouping - Name to be given to the inner div inside the area div
		// 
		// * action - Name to be given to the ID of the clickable HTML button and the name of the event to fire when button is clicked 
		// 
        app.buttonFeature = function(area, grouping, action) {

            // Check to make sure button isn't already present
            // **FIXME:** make sure the id is unique in the page since we can have multiple instances of the
            // annotation client (one per video)
            if ($('#' + action + myCanvasId).length !== 0) {
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
                //
                // Set the group element where this button should go in. If no group
                //element is yet created, create that group element with name *grouping*
                //
                if ($(container).find('#' + grouping + myCanvasId).length === 0) {
                    $(container).append('<div id="' + grouping + myCanvasId + '" class="buttongrouping"></div>');
                }

                groupEl = $("#" + grouping + myCanvasId);

                //
                // generate HTML for button, then attach the callback. action
                // refers to ID and also the title of the button
                //
                item = '<div id="' + action + myCanvasId + '" class="button">' + action + '</div>';

                $(groupEl).append(item);

                that.element = $("#" + action + myCanvasId);

                buttonBinding = app.controller.buttonActive.bind(that.element, {
                    action: action
                });
            } else if (area === 'slidergrouping') {

                if ($(container).find('#' + grouping + myCanvasId).length === 0) {
                    $(container).append('<div id="' + grouping + myCanvasId + '" class="slidergrouping"></div>');
                }

                groupEl = $("#" + grouping + myCanvasId);

                //
                // HTML for slider button
                //
                item = '<div id="' + action + myCanvasId + '"><div class="header">' + action + myCanvasId + '</div>' +
                '<div id="slider"></div><div class="timedisplay"></div></div>';
                $(groupEl).append(item);
                that.element = $("#" + action + myCanvasId);

                buttonBinding = app.controller.slider.bind(that.element, {
                    action: action
                });
            }
            return that;
        };

        // ### #addShape
        //
        // Adds a shape lens to the SVG overlay presentation.
        //
        // Parameters:
        //
        // * key - the internal shape name
        // * svgShape - the lens rendering function for rendering the shape on the SVG overlay
        //
        // Returns: Nothing.
        //
        app.addShape = function(key, svgShape) {
            app.presentation.raphsvg.addLens(key, svgShape);
        };

        // ### #addBody
        //
        // Adds an annotation body lens to the annotation presentation
        //
        // Parameters:
        //
        // * key - the internal annotation body type
        // * textLens - the lens rendering function for rendering the annotation body in the annotation presentation
        //
        // Returns: Nothing.
        //
        app.addBody = function(key, textLens) {
            app.presentation.annoItem.addLens(key, textLens);
        };

        // ### #addShapeType
        //
        // Adds a shape type. This includes a lens, a button to activate the shape mode, and
        // a callback function for creating an item in the data store.
        //
        // Parameters:
        //
        // * type - the internal shape name
        // * args - an object containing the following items:
        //		* calc - the callback function for inserting the new shape into the data store
        //		* lens - the lens rendering function for rendering the shape on the SVG overlay
        //
        // Returns: Nothing.
        //
        app.addShapeType = function(type, args) {
            var button,
            calcF,
            lensF;

            calcF = args.calc;
            lensF = args.lens;
            button = app.buttonFeature('Shapes', type);

            shapeTypes[type] = {
                calc: calcF
            };

            app.addShape(type, lensF);
        };

        // ### #insertShape
        //
        // Inserts a new annotation into the data store using the passed coordinates. An empty text annotation body
        // is added. The application CurrentMode variable determines the shape. The time span is 5 seconds on either side
        // of the CurrentTime variable.
        //
        // Parameters:
        //
        // * coords - the coordinates of the center of the shape in the .x, .y, .width, and .height properties.
        //
        // Returns: Nothing.
        //
        // **FIXME:** We should ensure that we don't have clashing IDs. We need to use UUIDs when possible.
		//  : Using guid() to generate local UUIDs - not truly a UUID, but close enough for now.
        //		
        app.insertShape = function(coords) {
            var shapeItem,
            ntp_start = parseFloat(app.getCurrentTime()) - 5,
            ntp_end = parseFloat(app.getCurrentTime()) + 5,
            curMode = app.getCurrentMode(),
            shape;
			
			// Insert into local array of ShapeTypes
			// 
            shape = shapeTypes[curMode].calc(coords);
            shapeAnnotationId = guid();

            shapeItem = {
                id: "anno" + shapeAnnotationId,
                type: "Annotation",
                bodyType: "Text",
                bodyContent: "This is an annotation for " + curMode,
                shapeType: curMode,
                opacity: 1,
                ntp_start: ntp_start,
                ntp_end: ntp_end
            };

            app.dataStore.canvas.loadItems([$.extend(shapeItem, shape)]);
        };

        // ## Application Configuration
        //
        // The rest of this prepares the annotation application once it's in the up-and-running process.
        //
        // We wrap all of this in the app.ready() call so we will have all of the events, presentations,
        // data stores, etc., instantiated for us.
        //
        app.ready(function() {
            // We want the SVG overlay and the annotation body presentation to react to changes in
            // the selection focus.
            app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventFocusChange);
            app.events.onActiveAnnotationChange.addListener(app.presentation.annoItem.eventFocusChange);

            // We always want the current annotation list to include anything that covers a time within five seconds
            // of the current time.
            app.events.onCurrentTimeChange.addListener(function(t) {
                app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5);
            });

            // We currently have a Player variable that handles the current player object. This may change since
            // we intend for the annotation client to be bound to a particular video stream on the page.
            //
            // **TODO:** This may be better done as an option when the app object is initialized. Annotations are
            // specific to the video being annotated, so it doesn't make as much sense to change the video we're
            // annotating. Better to create a new applicaiton instance.
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

        // We want to populate the available shapes with the rectangle and ellipse. These are considered stock
        // shapes for annotations.
        app.ready(function() {
            var calcOpacity,
            calcRectangle,
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

            // ### calcRectangle (private)
            //
            // Calculate the center and extents given the corner and extents.
            //
            // Parameters:
            //
            // * coords - object holding the .x, .y, .width, and .height
            //
            // Returns:
            //
            // An object holding the .x, .y, .w, and .h holding the center and extents.
            //
            calcRectangle = function(coords) {
                var attrs = {};
                attrs.x = (coords.x + (coords.width / 2));
                attrs.y = (coords.y + (coords.height / 2));
                attrs.w = coords.width;
                attrs.h = coords.height;
                return attrs;
            };

            // ### exportRectangle (private)
            //
            // Calculate the attributes needed for exporting the rectangle constraint.
            //
            // Parameters:
            //
            // * item - an object holding the .x, .y, .w, and .h (center and extents)
            //
            // * w - width of play surface
            //
            // * h - height of play surface
            //
            // Returns:
            //
            // Returns an object with the scaled .x, .y, .w, and .h.
            //
            exportRectangle = function(item, w, h) {
                var attrs = {},
                itemCopy;
                itemCopy = $.extend(true, {},
                item);

                attrs.x = (itemCopy.x / w) * 100;
                attrs.y = (itemCopy.y / h) * 100;
                attrs.w = (itemCopy.w / w) * 100;
                attrs.h = (itemCopy.h / h) * 100;

                return $.extend(itemCopy, attrs);
            };

            // ### lensRectangle (private)
            //
            // Renders the rectangular constraint on the video target.
            //
            // Parameters:
            //
            // * container - the container holding the lens content
			// 
            // * view - the presentation managing the collection of renderings
            //
            // * model - the data store or data view holding information abut the item to be rendered
            //
            // * itemId - the item ID of the item to be rendered
            //
            // Returns:
            //
            // The rendering object.
            //
            lensRectangle = function(container, view, model, itemId) {
                // Note: Rectangle measurements x,y start at CENTER

				// Initiate object with super-class methods and variables
                var that = app.initShapeLens(container, view, model, itemId),
                item = model.getItem(itemId),
                superUpdate,
                selectBinding,
                c,
                bbox;

                // Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
                c = view.canvas.rect(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.w[0], item.h[0]);

                that.shape = c;
                // fill and set opacity
                c.attr({
                    fill: "red"
                });
                that.setOpacity();

                // **FIXME:** may break with multiple videos if different annotations have the same ids in different
                // sets of annotations.
				// Should be fixed with UUID
                $(c.node).attr('id', item.id[0]);

                selectBinding = app.controller.selectShape.bind(c);
                selectBinding.events.onSelect.addListener(function() {
                    app.setActiveAnnotation(itemId);
                });

                superUpdate = that.update;
                that.update = function(newItem) {
                    // receiving the Object passed through
                    // model.updateItems in move()
                    item = newItem;
                    superUpdate(item);
                    try {
                        if (item.x !== undefined && item.y !== undefined && item.w !== undefined && item.h !== undefined) {
                            c.attr({
                                x: item.x[0] - item.w[0] / 2,
                                y: item.y[0] - item.h[0] / 2,
                                width: item.w[0],
                                height: item.h[0]
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
                        x: c.attr("x") + (c.attr("width") / 2),
                        y: c.attr("y") + (c.attr("height") / 2),
                        width: c.attr("width"),
                        height: c.attr("height")
                    };
                };

                return that;
            };
			
			// Using addShapeType to add Rectangle to the array of possible SVG
			// shapes
            app.addShapeType("Rectangle",
            {
                calc: calcRectangle,
                lens: lensRectangle
            });
			
			
			// 
			// 
			// 
			// 
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
                superUpdate,
                selectBinding,
                c;

                // create the shape
                c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0] / 2, item.h[0] / 2);
                that.shape = c;

                // fill shape
                c.attr({
                    fill: "red"
                });
                that.setOpacity();

                selectBinding = app.controller.selectShape.bind(c);
                selectBinding.events.onSelect.addListener(function() {
                    app.setActiveAnnotation(itemId);
                });

                superUpdate = that.update;

                that.update = function(item) {
                    // receiving the Object passed through
                    // model.updateItems in move()
                    superUpdate(item);

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

                return that;
            };
            app.addShapeType("Ellipse", {
                calc: calcEllipse,
                lens: lensEllipse
            });

            app.addBody("Text", app.initTextLens);


            // Adding in button features for annotation creation

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