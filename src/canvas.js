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
    // * playerWrapper: [Required] DOM path to the top-level element of the video player
    //
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
        wh = [],
        // **FIXME:** May want to tease this out as a configurable option or as a global
        //
        // For now, putting namespaces of Annotations, bodies, targets, contraints here in order to be used
        // in import/export
        //
        OAC_NS = {
            root: 'http://www.openannotation.org/ns/',
            Annotation: 'http://www.openannotation.org/ns/Annotation',
            Body: 'http://www.openannotation.org/ns/Body',
            Target: 'http://www.openannotation.org/ns/Target',
            SpTarget: 'http://www.openannotation.org/ns/ConstrainedTarget',
            Selector: 'http://www.w3.org/ns/openannotation/core/CompoundSelector',
            FragSelector: 'http://www.w3.org/ns/openannotation/core/FragmentSelector',
            SVGConstraint: 'http://www.w3.org/ns/openannotation/extensions/SvgSelector'
        };

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
                    lensKey: ['.shapeType'],
                    playerWrapper: options.playerWrapper
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
                var val = 0, opac = (focused === true)? 1 : 0.5;

                if (n < fstart || n > fend) {
                    return 0.0;
                }
                if (n < start) {
                    // fading in
                    val = (1 / (start - n));
                    val = val.toFixed(1);
                } else if (n > end) {
                    // fading out
                    val = (1 / (n - end));
                    val = val.toFixed(1);
                } else {
                    val = opac;
                }
                return val;
            };

            start = item.npt_start[0];
            end = item.npt_end[0];
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
					that.shape.attr({
	                    opacity: (focused ? 1.0: 0.5) * opacity
	                });
					// Update the model
					model.updateItems([{
						id: that.id,
						type: 'Annotation',
						opacity: opacity
					}]);
                }
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
                if (item.npt_start[0] !== start || item.npt_end[0] !== end) {
                    start = item.npt_start[0];
                    end = item.npt_end[0];
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
        // * action - Name to be given to the ID of the clickable HTML button and the name
        // of the event to fire when button is clicked
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
        //  : Using uuid() to generate local UUIDs - not truly a UUID, but close enough for now.
        //		
        app.insertShape = function(coords) {
            var shapeItem,
            npt_start = parseFloat(app.getCurrentTime()) - 5,
            npt_end = parseFloat(app.getCurrentTime()) + 5,
            curMode = app.getCurrentMode(),
            shape;
			
            // Insert into local array of ShapeTypes
            //
            shape = shapeTypes[curMode].calc(coords);
            shapeAnnotationId = uuid();

            shapeItem = {
                id: "anno" + shapeAnnotationId,
                type: "Annotation",
                bodyType: "Text",
                bodyContent: "This is an annotation for " + curMode,
                shapeType: curMode,
                targetURI: app.options.url,
                // **FIXME: Needs to be changed to dynamic value
                opacity: 0.5,
                // Starts off with half-opacity, 1 is for in-focus
                npt_start: (npt_start<0)? 0:npt_start,
                npt_end: npt_end
            };

            app.dataStore.canvas.loadItems([$.extend(shapeItem, shape)]);
        };

        // ### importData
        //
        // Importing annotation data from an external source. Must be in JSON format
        //
        // Parameters:
        // * data - Object housing the data for application
        //
        app.importData = function(data) {
            // ingest data and put it into dataStore
            var tempstore = [],
            temp,
            npt,
            constraint,
            tuid,
            suid,
            svgid,
            nptid;
            $.each(data,
            function(i, o) {
                // Singling out the Annotations from the rest of the RDF data so
                // we can work down from just the Annotation object and its pointers
                if (o.type[0].value === OAC_NS.Annotation) {
					
					// Logic chain to determine what kind of incoming annotation we're dealing with
					// 
					// Only interested in annotations that match our Video URI: are 'about' the video OR
					// that do not yet have targets
					if(o.hasTarget !== undefined) {
						if(data[o.hasTarget[0].value].hasSource[0].value !== app.options.url) {
							return 1; // Skip over this item (From $.each() docs)
						} else if(data[o.hasTarget[0].value].hasSource[0].value === app.options.url) {
							// Target source matches the URI of our video; generate an OAC dataStore model 
							// to insert into canvas for this annotation series in the JSON:RDF data
							
							// Unique ID comes from the URI value of type
		                    temp = {
		                        id: i,
		                        type: "Annotation",
		                        bodyContent: '',
		                        bodyType: 'Text',
								targetURI: app.options.url,
		                        shapeType: '',
		                        opacity: 0.5,
		                        npt_start: 0,
		                        npt_end: 0
		                    };

		                    //
		                    // Check to see if target is a CompoundSelection Resource
		                    // Right now, we don't care about things that are not Compound Resources made
		                    // up of a time fragment and an SVG Constraint
		                    //
		                    tuid = data[o.hasTarget[0].value];

		                    if (tuid.hasSelector !== undefined && data[tuid.hasSelector[0].value].type[0].value === OAC_NS.Selector) {
		                        suid = data[tuid.hasSelector[0].value];
		                        svgid = data[suid.hasSelector[0].value];

		                        // Fill in blanks for SVG
		                        temp.shapeType = $(svgid.chars[0].value)[0].nodeName;
								// correct shape-type nodeName to full name for DataStore
								if(temp.shapeType === 'RECT') {
									temp.shapeType = 'Rectangle';
								} else if(temp.shapeType === 'ELLI') {
									temp.shapeType = 'Ellipse';
								}
		                        temp.x = parseInt($(svgid.chars[0].value).attr('x'),10);
		                        temp.y = parseInt($(svgid.chars[0].value).attr('y'),10);
		                        temp.w = parseInt($(svgid.chars[0].value).attr('width'),10);
		                        temp.h = parseInt($(svgid.chars[0].value).attr('height'),10);

		                        // Fill in blanks for the NPT constraint
		                        nptid = data[suid.hasSelector[1].value];
		                        npt = nptid.value[0].value.replace(/^t=npt:/g, '');
		                        temp.npt_start = parseInt(npt.replace(/\,[0-9]+/g, ''),10);
		                        temp.npt_end = parseInt(npt.replace(/^[0-9]+\,/g, ''),10);

		                        // Fill in blanks for body
		                        temp.bodyContent = data[o.hasBody[0].value].chars[0].value || '';
		                        tempstore.push(temp);
		                    }
						}
					} else {
						//  No Target is created yet - create blank item to insert into dataStore
							// Unique ID comes from the URI value of type
		                    temp = {
		                        id: i,
		                        type: "Annotation",
		                        bodyContent: '',
		                        bodyType: 'Text',
								targetURI: app.options.url,
		                        shapeType: '',
		                        opacity: 0.5,
		                        npt_start: 0,
		                        npt_end: 0
		                    };
		
							if(o.hasBody !== undefined) {
								temp.bodyContent = data[o.hasBody[0].value].chars[0];
							}
							
							tempstore.push(temp);
					}
					
                    
                }
            });
            // insert into dataStore
            app.dataStore.canvas.loadItems(tempstore);
        };

        // ### exportData
        //
        // Works backwards from the importData function for now.
        //
        // Parameters:
        //
        // * data - JSON Object of the original data used during import (Not stored locally during MITHGrid session)
        //
        // Returns:
        //
        // JSON Object that conforms to the
        app.exportData = function(data) {
            // Get all data from dataStore
            var tempstore = {},
            findAnnos = app.dataStore.canvas.prepare(['!type']),
            annos,
            obj,
            temp,
            tuid,
            buid,
            fgid,
            svgid,
            suid,
            found,

            // #### genBody (private)
            //
            // Generates the body oject and adds it to tempstore
            //
            // Parameters:
			// * obj - DataStore item
            // * id (optional) - create Body Object with specific ID
            //
            genBody = function(obj, id) {
                
                // Generating body element
                tempstore[id] = {
                    'type': [{
                        'type': 'uri',
                        'value': OAC_NS.Body
                    }],
                    'format': [{
                        'type': 'literal',
                        'value': 'text/plain'
                    }],
                    'characterEncoding': [{
                        type: 'literal',
                        value: 'utf-8'
                    }],

                    'chars': [{
                        type: 'literal',
                        value: obj.bodyContent[0]
                    }]
                };
            },
            // #### genTarget (private)
            //
            // Generates a JSON object representing a target and adds it to tempstore
            //
            // Parameters
            // * obj - dataStore item
            // * id (optional) - pass array of IDs to use as target ID, Selector ID, etc
            //
            genTarget = function(obj, id) {
                // Unique Identifiers for pieces of Target
                
                // Generating target element
                tempstore[id[0]] = {
                    'type': [{
                        'type': 'uri',
                        'value': OAC_NS.SpTarget
                    }],
                    'hasSource': [{
                        'type': 'uri',
                        'value': obj.targetURI[0]
                    }],
                    'hasSelector': [{
                        'type': 'bnode',
                        'value': suid
                    }]
                };

                // Selector element, which points to the SVG constraint and NPT constraint
                tempstore[id[1]] = {
                    'type': [{
                        'type': 'uri',
                        'value': OAC_NS.Selector
                    }],
                    'hasSelector': [{
                        type: 'bnode',
                        value: id[2]
                    },
                    {
                        type: 'bnode',
                        value: id[3]
                    }]
                };

                // Targets have selectors, which then have svg and npt elements
                tempstore[id[2]] = {
                    'type': [{
                        'type': 'uri',
                        'value': OAC_NS.SVGConstraint
                    }],
                    'format': [{
                        type: 'literal',
                        value: 'text/svg+xml'
                    }],

                    'characterEncoding': [{
                        type: 'literal',
                        value: 'utf-8'
                    }],

                    'chars': [{
                        type: 'literal',
                        value: '<' + obj.shapeType[0].substring(0, 4).toLowerCase() +
                        ' x="' + obj.x[0] + '" y="' + obj.y[0] + '" width="' + obj.w[0] + '" height="' + obj.h[0] + '" />'
                    }]
                };

                tempstore[id[3]] = {
                    'type': [{
                        'type': 'uri',
                        'value': OAC_NS.FragSelector
                    }],
                    'value': [{
                        'type': 'literal',
                        'value': 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]
                    }]
                };
            },
            // #### createJSONObjSeries (private)
            //
            // Creates the necessary series of objects to be inserted
            // into the exported JSON. Only called if there isn't already a RDF:JSON object that was imported with a matching ID
            //
            // Parameters:
            //
            // * id - Array of Ids to use as:
            // 0th - Annotation Object (required)
            // 1st - Body Object (optional)
            // 2nd - Target (optional)
            // 3rd - Target Selector (optional)
            // 4th - Target SVG (optional)
            // 5th - Target NPT (optional)
            createJSONObjSeries = function(id) {
                obj = app.dataStore.canvas.getItem(id);
				if (id.length > 1) {
					buid = id[1];
					tuid = id[2];
                    suid = id[3];
                    svgid = id[4];
                    fgid = id[5];
				} else {
					
					buid = '_:b' + uuid();
					tuid = '_:t' + uuid();
					suid = '_:sel' + uuid();
					svgid = '_:sel' + uuid();
					fgid = '_:sel' + uuid();
				}

                // Fragment Idenitifier ID
                tempstore[id[0]] = {
                    'type': [{
                        'type': 'uri',
                        'value': OAC_NS.Annotation
                    }],
                    'hasBody': [{
                        type: 'bnode',
                        value: buid
                    }],
                    'hasTarget': [{
                        type: 'bnode',
                        value: tuid
                    }]
                };

                genBody(obj, buid);
                genTarget(obj, [tuid, suid, svgid, fgid]);
            },
            // #### mergeData (private)
            //
            // Takes an id of a dataStore object and merges the data
            // in the object with what is in the (optionally) passed
            // RDF:JSON object
            //
            // Parameters:
            // * id - ID of object to merge
            //
            mergeData = function(id) {
                obj = app.dataStore.canvas.getItem(id);

                // check where data merges
                if (data[obj.id] !== undefined) {
                    // go through annotation pointers in RDF:JSON to update body, target, etc
                    $.each(data[obj.id],
                    function(type, value) {
                        switch (type) {
                        case 'hasBody':
                            buid = data[obj.id].hasBody[0].value;
                            data[buid].chars[0].value = obj.bodyContent;
                            break;
                        case 'hasTarget':
                            // If Target is undefined within ASP JSON, then it remains blank in RDF:JSON
                            if (obj.targetURI[0] !== undefined && obj.x[0] !== undefined) {
                                tuid = data[obj.id].hasTarget[0].value;
                                // Using variable to check against whether object is found or not
                                found = false;
                                // Matching video URLs means matching Targets
                                if (data[tuid].hasSource[0].value === obj.targetURI[0]) {
                                    // matching sources - merging
                                    suid = data[tuid].hasSelector[0].value;
                                    found = true;
                                    // Go through the selectors
                                    $.each(data[suid],
                                    function(seltype, selval) {
                                        if (seltype === 'hasSelector') {
                                            $.each(selval,
                                            function(seli, selo) {
                                                // is svg, npt?
                                                if (data[selo.value].type[0].value === OAC_NS.SVGConstraint) {
                                                    data[selo.value].chars = [{
                                                        type: 'literal',
                                                        value: '<' + obj.shapeType[0].substring(0, 4).toLowerCase() +
                                                        ' x="' + obj.x[0] + '" y="' + obj.y[0] + ' width="' +
                                                        obj.w[0] + '" height="' + obj.h[0] + '" />'
                                                    }];
                                                } else if (data[selo.value].type[0].value === OAC_NS.FragSelector) {
                                                    data[selval].chars = [{
                                                        'type': 'literal',
                                                        'value': 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]
                                                    }];
                                                }
                                            });
                                        }
                                    });
                                }

                                // If no target element found, create new one in RDF:JSON
                                if (found === false) {
                                    genTarget(obj);
                                }
                            }
                            break;
                        default:
                            // do nothing
                            break;
                        }
                    });
                } else {
                    createJSONObjSeries(obj.id);
                }
            };

            data = data || {};

            annos = findAnnos.evaluate('Annotation');
            $.each(annos,
            function(i, o) {
                mergeData(o);
            });

            return tempstore;

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
				// Making sure that none of the button items are still active while video is playing
				// (Can't draw a shape while video is playing - force user to re-click item)
				app.setCurrentMode('Watch');
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


            // #### calcEllipse (private)
            //
            // Generates a JSON object containing the measurements for an
            // ellipse object but only using x, y, w, h
            //
            // Returns:
            // JSON object
            calcEllipse = function(coords) {
                var attrs = {};
                attrs.x = coords.x + (coords.width / 2);
                attrs.y = coords.y + (coords.height / 2);
                attrs.w = coords.width;
                attrs.h = coords.height;
                return attrs;
            };

            // #### lensEllipse
            //
            // Rendering Lens for the Ellipse SVG shape
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
                    npt_start: start,
                    npt_end: end
                }]);
            });

        });

        return app;
    };
} (jQuery, MITHGrid, OAC));