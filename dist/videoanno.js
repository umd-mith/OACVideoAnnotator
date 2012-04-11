//
// OAC Video Annotation Tool v0.1
// 
// The **OAC Video Annotation Tool** is a MITHGrid application providing annotation capabilities for streaming
// video embedded in a web page. 
//  
// Date: Mon Apr 9 16:44:49 2012 -0400
//  
// Educational Community License, Version 2.0
// 
// Copyright 2011 University of Maryland. Licensed under the Educational
// Community License, Version 2.0 (the "License"); you may not use this file
// except in compliance with the License. You may obtain a copy of the License at
// 
// http://www.osedu.org/licenses/ECL-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.
//
// Author: Grant Dickie

// # Initialization

// We make sure certain globals are defined in case this library is loaded before MITHGrid,
// jQuery, or Raphaël.

var MITHGrid = MITHGrid || {};
var jQuery = jQuery || {};
var Raphael = Raphael || {};

// The plugin uses the OAC.Client.StreamingVideo namespace.
var OAC = MITHGrid.globalNamespace("OAC");
OAC.namespace("Client");
OAC.Client.namespace("StreamingVideo");
// # Controllers
//
(function($, MITHGrid, OAC) {
    var Controller = OAC.Client.StreamingVideo.namespace('Controller');

    // ## KeyboardListener
    //
    // OAC.Client.StreamingVideo.Controller.KeyboardListener listens to keydown events on the DOM document
    // level and translates them into delete events.
    //
    Controller.namespace("KeyboardListener");

    // ### KeyboardListener.initController
    //
    // Parameters:
    //
    // * options - object holding configuration options for the KeyboardListener object
    //
    // Returns:
    //
    // The configured KeyboardListener controller.
    //
    // Options:
    //
    // * application - the application using this controller
    // * isAction - a function which returns true if keyboard events should be propagated
    //
    Controller.KeyboardListener.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.KeyboardListener", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var doc = binding.locate('doc'),
            activeId;

            options.application.events.onActiveAnnotationChange.addListener(function(id) {
                activeId = id;
            });

            $(doc).keydown(function(e) {
                if (options.application.getCurrentMode() === 'Editing') {
                    return;
                }
                if (activeId !== undefined || activeId !== '') {
                    // If backspace or delete is pressed,
                    // then it is interpreted as a
                    // delete call.
                    if (e.keyCode === 8 || e.keyCode === 46) {
                        binding.events.onDelete.fire(activeId);
                        activeId = '';
                    }
                }
            });
        };

        return that;
    };

    // ## Drag
    //
    // Attaches to an SVG rendering and produces events at the start, middle, and end of a drag.
    //
    Controller.namespace("Drag");

    // ### Drag.initController
    //
    Controller.Drag.initController = function(options) {
        var that = MITHGrid.Controller.initController(
        "OAC.Client.StreamingVideo.Controller.Drag",
        options
        );

        that.applyBindings = function(binding, opts) {
            var el = binding.locate('raphael');

            el.drag(
            function(x, y) {
                binding.events.onUpdate.fire(x, y);
            },
            function(x, y, e) {
                // **FIXME**: layerX and layerY are deprecated in WebKit
                x = e.layerX;
                y = e.layerY;
                binding.events.onFocus.fire(x, y);
            },
            function() {
                binding.events.onUnfocus.fire();
            }
            );
        };

        return that;
    };

    // ## Select
    //
    // Attaches a click handler to an SVG rendering and fires an onSelect event if the rendering is clicked AND
    // the application is in a mode to select things.
    //
    Controller.namespace("Select");

    // ### Select.initController
    //
    // Parameters:
    //
    // * options - object holding configuration information
    //
    // Returns:
    //
    // The configured controller object.
    //
    // Configuration Options:
    //
    // * isSelectable - function taking no arguments that should return "true" if the click should cause the
    //                  onSelect event to fire.
    //
    Controller.Select.initController = function(options) {
        var that = MITHGrid.Controller.initController(
        "OAC.Client.StreamingVideo.Controller.Select",
        options
        );
        options = that.options;

        that.applyBindings = function(binding) {
            var el = binding.locate("raphael");

            el.click(function(e) {
                if (options.isSelectable()) {
                    binding.events.onSelect.fire();
                }
            });
        };

        return that;
    };

    // ## AnnotationEditSelectionGrid
    //
    // Attaches to an SVG lens and creates a green rectangle dashed box to
    // act as the resize and drag tool. Only edits the SVG data - no annotation
    // bodyContent data.
    Controller.namespace("AnnotationEditSelectionGrid");

    // ### AnnotationEditSelectionGrid.initController
    //
    // Initializes the AnnotationEditSelectionGrid controller object. This object may then be used to bind actions to
    // the DOM.
    //
    // We create the bounding box once and keep it around. We then track which rendering is associated with
    // the bounding box and draw it accordingly.
    // We associate the bounding box with the SVG/Raphaël canvas holding the renderings we want to use it with.
    //
    // Each Raphaël canvas should have its own AnnotationEditSelectionGrid instance for binding renderings.
    //
    // Parameters:
    //
    // * options - object holding configuration information
    //
    // Returns:
    //
    // The initialized controller object.
    //
    // **FIXME:**
    //
    // The controller needs to be broken up a bit. The idea of providing a bounding box for renderings is something that
    // should be handled in the presentation, not here. The controller should just generate events based on user interactions.
    // The presentation should worry about which rendering is currently active and manage the translation of controller
    // events to the rendering.
    //
    // For now, we'll refactor this into two pieces: the bounding box drawing (rendering), and translating events in the binding.
    //
    // We will eventually split this controller into two: bounding box resize controller and bounding box drag/move controller.
    //
    Controller.AnnotationEditSelectionGrid.initController = function(options) {
        var that = MITHGrid.Controller.initController(
        "OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid",
        options
        ),
        dragController,
        dirs = [];

        options = that.options;
        dirs = that.options.dirs;
        // || ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'];
        dragController = OAC.Client.StreamingVideo.Controller.Drag.initController({});

        // #### AnnotationEditSelectionGrid #applyBindings
        //
        that.applyBindings = function(binding, opts) {
            var ox,
            oy,
            handleSet = {},
            midDrag = {},
            svgBBox = {},
            itemMenu = {},
            handles = {},
            activeRendering,
            deleteButton = {},
            editButton = {},
            menuContainer = {},
            factors = {},
            extents,
            paper = opts.paper,
            attrs = {},
            padding = 5,
            calcFactors,
            calcHandles,
            drawMenu,
            itemDeleted,
            handleIds = {},
            drawHandles,
            handleAttrs = {},
            shapeAttrs = {},
            menuAttrs = {},
            cursor,
            dAttrs = {},
            eAttrs = {},
            handleCalculationData = {},
            el;

            // ### attachRendering
            //
            // Function for applying a new shape to the bounding box
            //
            // Parameters:
            //
            // * newRendering -
            binding.attachRendering = function(newRendering) {
                binding.detachRendering();

                if (newRendering === undefined) {
                    return;
                }

                // register the rendering
                activeRendering = newRendering;
                calcFactors();
                drawHandles();
            };

            // Function to call in order to "de-activate" the edit box
            // (i.e. make it hidden)
            binding.detachRendering = function() {
                if ($.isEmptyObject(handleSet)) {
                    return;
                }
                activeRendering = undefined;
                handleSet.hide();

                svgBBox.hide();
                midDrag.hide();
                if (itemMenu) {
                    itemMenu.hide();
                }
            };

            // ##### calcFactors (private)
            //
            // Measures where the handles should be on mousemove.
            //
            // Parameters: None.
            //
            // Returns: Nothing.
            //
            calcFactors = function() {
                extents = activeRendering.getExtents();

                // create offset factors for
                // bounding box
                // calculate width - height to be larger
                // than shape
                attrs.width = extents.width + (2 * padding);
                attrs.height = extents.height + (2 * padding);
                attrs.x = (extents.x - (padding / 8)) - (attrs.width / 2);
                attrs.y = (extents.y - (padding / 8)) - (attrs.height / 2);
                calcHandles(attrs);
                if (itemMenu) {
                    drawMenu(attrs);
                }
            };

            // #### drawHandles (private)
            //
            // Draws the handles defined in dirs as SVG rectangles and draws the SVG bounding box
            //
            // Parameters: None.
            //
            // Returns: Nothing.
            //
            drawHandles = function() {
                var midDragDragBinding;

                if ($.isEmptyObject(handleSet)) {

                    // draw the corner and mid-point squares
                    handleSet = paper.set();
                    $.each(handles,
                    function(i, o) {
                        var h;
                        if (i === 'mid') {
                            midDrag = paper.rect(o.x, o.y, padding, padding);
                            o.id = midDrag.id;

                        } else {
                            h = paper.rect(o.x, o.y, padding, padding);
                            o.id = h.id;

                            h.attr({
                                cursor: o.cursor
                            });
                            handleSet.push(h);
                        }
                    });

                    // make them all similar looking
                    handleSet.attr({
                        fill: 990000,
                        stroke: 'black'
                    });

                    if (! ($.isEmptyObject(midDrag))) {
                        midDrag.attr({
                            fill: 990000,
                            stroke: 'black',
                            cursor: 'move'
                        });
                    }

                    // drawing bounding box
                    svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                    svgBBox.attr({
                        stroke: 'green',
                        'stroke-dasharray': ["--"]
                    });
                    // Draw the accompanying menu that sits at top-right corner
                    drawMenu(attrs);

                    if (! ($.isEmptyObject(midDrag))) {

                        // Attaching listener to drag-only handle (midDrag)
                        midDragDragBinding = dragController.bind(midDrag);

                        midDragDragBinding.events.onUpdate.addListener(
                        function(dx, dy) {
                            // dragging means that the svgBBox stays padding-distance
                            // away from the lens' shape and the lens shape gets updated
                            // in dataStore
                            handleAttrs.nx = attrs.x + dx;
                            handleAttrs.ny = attrs.y + dy;
                            shapeAttrs.x = extents.x + dx;
                            shapeAttrs.y = extents.y + dy;

                            svgBBox.attr({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny
                            });

                            calcHandles({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny,
                                width: attrs.width,
                                height: attrs.height
                            });
                            if (itemMenu) {
                                drawMenu({
                                    x: handleAttrs.nx,
                                    y: handleAttrs.ny,
                                    width: attrs.width,
                                    height: attrs.height
                                });
                            }
                        }
                        );

                        midDragDragBinding.events.onFocus.addListener(
                        function(x, y) {
                            // start
                            ox = x;
                            oy = y;
                            calcFactors();
                            activeRendering.shape.attr({
                                cursor: 'move'
                            });
                        }
                        );

                        midDragDragBinding.events.onUnfocus.addListener(
                        function() {
                            // end
                            var pos = {
                                x: shapeAttrs.x,
                                y: shapeAttrs.y
                            };

                            binding.events.onMove.fire(pos);
                            //activeRendering.shape.attr({
                            //	cursor: 'default'
                            //});
                        }
                        );
                    }

                    // Attaching drag and resize handlers
                    handleSet.forEach(function(handle) {
                        var handleBinding = dragController.bind(handle);

                        handleBinding.events.onUpdate.addListener(function(dx, dy) {
                            // onmove function - handles dragging
                            // dragging here means that the shape is being resized;
                            // the factorial determines in which direction the
                            // shape is pulled
                            shapeAttrs.w = Math.abs(extents.width + dx * factors.x);
                            shapeAttrs.h = Math.abs(extents.height + dy * factors.y);
                            handleAttrs.nw = shapeAttrs.w + (padding * 2);
                            handleAttrs.nh = shapeAttrs.h + (padding * 2);
                            handleAttrs.nx = (extents.x - (padding / 4)) - (handleAttrs.nw / 2);
                            handleAttrs.ny = (extents.y - (padding / 4)) - (handleAttrs.nh / 2);

                            svgBBox.attr({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny,
                                width: handleAttrs.nw,
                                height: handleAttrs.nh
                            });
                            calcHandles({
                                x: handleAttrs.nx,
                                y: handleAttrs.ny,
                                width: handleAttrs.nw,
                                height: handleAttrs.nh
                            });
                            if (itemMenu) {
                                drawMenu({
                                    x: handleAttrs.nx,
                                    y: handleAttrs.ny,
                                    width: handleAttrs.nw,
                                    height: handleAttrs.nh
                                });
                            }
                        });

                        handleBinding.events.onFocus.addListener(function(x, y) {
                            // onstart function
                            var px,
                            py;
                            extents = activeRendering.getExtents();
                            ox = x;
                            oy = y;

                            // change mode
                            options.application.setCurrentMode('Drag');
                            // extents: x, y, width, height
                            px = (8 * (ox - extents.x) / extents.width) + 4;
                            py = (8 * (oy - extents.y) / extents.height) + 4;
                            if (px < 3) {
                                factors.x = -2;
                            }
                            else if (px < 5) {
                                factors.x = 0;
                            }
                            else {
                                factors.x = 2;
                            }
                            if (py < 3) {
                                factors.y = -2;
                            }
                            else if (py < 5) {
                                factors.y = 0;
                            }
                            else {
                                factors.y = 2;
                            }
                            calcFactors();
                        });

                        handleBinding.events.onUnfocus.addListener(function() {
                            // onend function
                            // update
                            var pos = {
                                width: shapeAttrs.w,
                                height: shapeAttrs.h
                            };
                            if (activeRendering !== undefined) {
                                binding.events.onResize.fire(pos);
                            }
                            // change mode back
                            options.application.setCurrentMode('Select');
                        });
                    });
                } else {
                    // show all the boxes and
                    // handles
                    svgBBox.show();
                    // adjust the SvgBBox to be around new
                    // shape
                    svgBBox.attr({
                        x: attrs.x,
                        y: attrs.y,
                        width: attrs.width,
                        height: attrs.height
                    });
                    handleSet.show();
                    midDrag.show().toFront();
                    if (itemMenu) {
                        itemMenu.show();
                        drawMenu(attrs);
                    }
                }
            };

            // #### drawMenu (private)
            //
            // Draws menu that sits at the top-right corner of the shape.
            //
            // Parameters:
            //
            // * args - object holding the .x, .y, and .width properties
            //
            // Returns: Nothing.
            //
            drawMenu = function(args) {
                if ($.isEmptyObject(itemMenu)) {

                    menuAttrs.x = args.x + (args.width);
                    menuAttrs.y = args.y - (padding * 4) - 2;
                    menuAttrs.w = 100;
                    menuAttrs.h = 20;
                    // Create separate attribute objects
                    // for each menu button/container
                    eAttrs = {
                        x: menuAttrs.x + 2,
                        y: menuAttrs.y + 2,
                        w: menuAttrs.w / 2 - 4,
                        h: menuAttrs.h - (menuAttrs.h / 8)
                    };

                    dAttrs = {
                        x: (eAttrs.x + eAttrs.w + 2),
                        y: menuAttrs.y + 2,
                        w: menuAttrs.w / 2 - 4,
                        h: menuAttrs.h - (menuAttrs.h / 8)
                    };

                    itemMenu = paper.set();
                    menuContainer = paper.rect(menuAttrs.x, menuAttrs.y, menuAttrs.w, menuAttrs.h);
                    menuContainer.attr({
                        fill: '#FFFFFF',
                        stroke: '#000'
                    });

                    itemMenu.push(menuContainer);

                    editButton = paper.rect(eAttrs.x, eAttrs.y, eAttrs.w, eAttrs.h);
                    editButton.attr({
                        fill: 334009,
                        cursor: 'pointer'
                    });

                    itemMenu.push(editButton);

                    deleteButton = paper.rect(dAttrs.x, dAttrs.y, dAttrs.w, dAttrs.h);
                    deleteButton.attr({
                        fill: 334009,
                        cursor: 'pointer'
                    });

                    itemMenu.push(deleteButton);
                    // attach event firers
                    editButton.mousedown(function() {
                        if (activeRendering !== undefined) {
                            that.events.onEdit.fire(activeRendering.id);
                        }
                    });
                    editButton.hover(function() {
                        editButton.attr({
                            fill: 443009
                        });
                    },
                    function() {
                        editButton.attr({
                            fill: 334009
                        });
                    });


                    deleteButton.mousedown(function() {
                        if (activeRendering !== undefined) {
                            binding.events.onDelete.fire();
                            itemDeleted();
                        }
                    });
                    deleteButton.hover(function() {
                        deleteButton.attr({
                            fill: 443009
                        });
                    },
                    function() {
                        deleteButton.attr({
                            fill: 334009
                        });
                    });
                } else {


                    menuAttrs.x = args.x + (args.width);
                    menuAttrs.y = args.y - (padding * 4) - 2;

                    eAttrs = {
                        x: (menuAttrs.x + 2),
                        y: (menuAttrs.y + 2)
                    };

                    dAttrs = {
                        x: (eAttrs.x + editButton.attr('width') + 2),
                        y: menuAttrs.y + 2
                    };
                    menuContainer.attr({
                        x: menuAttrs.x,
                        y: menuAttrs.y
                    });
                    editButton.attr(eAttrs);
                    deleteButton.attr(dAttrs);
                }
            };

            itemDeleted = function() {
                // set rendering to undefined
                binding.detachRendering();
                activeRendering = undefined;

                itemMenu.hide();
                svgBBox.hide();
                handleSet.hide();
                midDrag.hide();
            };

            handleCalculationData = {
                ul: ['nw', 0, 0, 0, 0],
                top: ['n', 1, 0, 0, 0],
                ur: ['ne', 2, -1, 0, 0],
                rgt: ['e', 2, -1, 1, 0],
                lr: ['se', 2, -1, 2, -1],
                btm: ['s', 1, 0, 2, -1],
                ll: ['sw', 0, 0, 2, -1],
                lft: ['w', 0, 0, 1, 0],
                mid: ['pointer', 1, 0, 1, 0]
            };

            //
            // Goes through handle object array and
            // sets each handle box coordinate
            //
            calcHandles = function(args) {
                // calculate where the resize handles
                // will be located
                var calcHandle = function(type, xn, xp, yn, yp) {
                    return {
                        x: args.x + xn * args.width / 2 + xp * padding,
                        y: args.y + yn * args.height / 2 + yp * padding,
                        cursor: type.length > 2 ? type: type + "-resize"
                    };
                },
                recalcHandle = function(info, xn, xp, yn, yp) {
                    var el;
                    info.x = args.x + xn * args.width / 2 + xp * padding;
                    info.y = args.y + yn * args.height / 2 + yp * padding;
                    el = paper.getById(info.id);
                    el.attr({
                        x: info.x,
                        y: info.y
                    });
                };
                $.each(dirs,
                function(i, o) {
                    var data = handleCalculationData[o];
                    if (data === undefined) {
                        return;
                    }
                    if (handles[o] === undefined) {
                        handles[o] = calcHandle(data[0], data[1], data[2], data[3], data[4]);
                    }
                    else {
                        recalcHandle(handles[o], data[1], data[2], data[3], data[4]);
                    }
                });
            };
        };

        return that;
    };

    // ## ShapeCreateBox
    //
    // Creates an SVG shape with a dotted border to be used as a guide for drawing shapes. Listens for user mousedown, which
    // activates the appearance of the box at the x,y where the mousedown coords are, then finishes when user mouseup call is made
    //
    Controller.namespace('ShapeCreateBox');
    Controller.ShapeCreateBox.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", options);
        options = that.options;

        // #### ShapeCreateBox #applyBindings
        //
        // Init function for Controller.
        //
        // Parameters:
        //
        // * binding - refers to Controller instance
        // * opts - copy of options passed through initController
        //
        // Creates the following methods:
        that.applyBindings = function(binding, opts) {
            //
            // Bounding box is created once in memory - it should be bound to the
            // canvas/paper object or something that contains more than 1 shape.
            //
            var ox,
            oy,
            svgBBox = {},
            activeRendering,
            factors = {},
            paper = opts.paper,
            attrs = {},
            padding = 10,
            drawMenu,
            itemDeleted,
            shapeAttrs = {},
            cursor,
            el;

            // #### createGuide
            //
            // Creates the SVGBBOX which acts as a guide to the user
            // of how big their shape will be once shapeDone is fired
            //
            // Parameters:
            //
            // * coords - object that has x,y coordinates for user mousedown. This is where the left and top of the box will start
            //
            binding.createGuide = function(coords) {
                // coordinates are top x,y values
                attrs.x = coords[0];
                attrs.y = coords[1];
                attrs.width = (coords[0] + padding);
                attrs.height = (coords[1] + padding);
                if ($.isEmptyObject(svgBBox)) {
                    svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
                    svgBBox.attr({
                        stroke: 'green',
                        'stroke-dasharray': ["--"]
                    });

                } else {
                    // show all the boxes and
                    // handles
                    svgBBox.show();
                    // adjust the SvgBBox to be around new
                    // shape
                    svgBBox.attr({
                        x: attrs.x,
                        y: attrs.y,
                        width: attrs.width,
                        height: attrs.height
                    });
                }

            };

            // #### resizeGuide
            //
            // Take passed x,y coords and set as bottom-right, not
            // top left
            //
            // Parameters:
            //
            // * coords - array of x,y coordinates to use as bottom-right coords of the box
            //
            binding.resizeGuide = function(coords) {

                attrs.width = (coords[0] - attrs.x);
                attrs.height = (coords[1] - attrs.y);

                svgBBox.attr({
                    width: attrs.width,
                    height: attrs.height
                });
            };

            // #### completeShape
            //
            // Take the saved coordinates and pass them back
            // to the calling function
            //
            // Parameters:
            //
            // * coords - coordinates object with properties x, y, width, and height
            //
            // Returns:
            // Coordinates object with properties x, y, width, and height
            //
            binding.completeShape = function(coords) {
                attrs.width = coords.width;
                attrs.height = coords.height;

                svgBBox.attr({
                    width: attrs.width,
                    height: attrs.height
                });
                svgBBox.hide();
                return {
                    x: attrs.x,
                    y: attrs.y,
                    width: attrs.width,
                    height: attrs.height
                };
            };
        };

        return that;
    };

    // ## TextBodyEditor
    //
    // Handles HTML annotation lens for editing the bodyContent text.
    //
    //
    Controller.namespace("TextBodyEditor");
    Controller.TextBodyEditor.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.TextBodyEditor", options);
        options = that.options;

        // ### TextBodyEditor #applyBindings
        //
        // Generates the following the methods:
        that.applyBindings = function(binding, opts) {
            var editStart,
            editEnd,
            editUpdate,
            annoEl = binding.locate('annotation'),
            bodyContent = binding.locate('body'),
            allAnnos = binding.locate('annotations'),
            textArea = binding.locate('textarea'),
            editArea = binding.locate('editarea'),
            editButton = binding.locate('editbutton'),
            updateButton = binding.locate('updatebutton'),
            deleteButton = binding.locate('deletebutton'),
            bindingActive = false,
            prevMode;

            // #### editStart (private)
            //
            // displays editing area
            //
            editStart = function() {
                $(editArea).show();
                $(bodyContent).hide();
                bindingActive = true;
                binding.events.onClick.fire(opts.itemId);
            };

            // #### editEnd (private)
            //
            // Hides the editing area after the user has completed editing/canceled editing
            //
            editEnd = function() {
                $(editArea).hide();
                $(bodyContent).show();
                bindingActive = false;

            };

            // #### editUpdate (private)
            //
            // Called when the user sends new data to dataStore
            //
            editUpdate = function(e) {
                var data = $(textArea).val();
                e.preventDefault();
                binding.events.onUpdate.fire(opts.itemId, data);
                editEnd();
            };

            // Annotation DOM element listens for a double-click to either
            // display and become active or hide and become unactive
            $(annoEl).bind('dblclick',
            function(e) {
                e.preventDefault();
                if (bindingActive) {
                    editEnd();

                    options.application.setCurrentMode(prevMode || '');
                } else {
                    editStart();
                    prevMode = options.application.getCurrentMode();
                    options.application.setCurrentMode('TextEdit');
                }
            });

            // Clicking once on the annotation DOM element will activate the attached SVG shape
            $(annoEl).bind('click',
            function(e) {
                // binding.events.onClick.fire(opts.itemId);
                options.application.setActiveAnnotation(opts.itemId);
            });

            // Attach binding to the update button which ends editing and updates the bodyContent of the attached
            // annotation
            $(updateButton).bind('click',
            function(e) {
                binding.events.onUpdate.fire(opts.itemId, $(textArea).val());
                editEnd();
                options.application.setCurrentMode(prevMode);
            });

            // Attach binding to the delete button to delete the entire annotation - removes from dataStore
            $(deleteButton).bind('click',
            function(e) {
                binding.events.onDelete.fire(opts.itemId);
                // remove DOM elements
                $(annoEl).remove();
            });

            // Listening for changes in active annotation so that annotation text lens stays current
            options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id !== opts.id && bindingActive) {
                    editUpdate({
                        preventDefault: function() {}
                    });
                    editEnd();
                }
            });

            // Listens for changes in the mode in order to stay current with rest of the application
            options.application.events.onCurrentModeChange.addListener(function(newMode) {
                if (newMode !== 'TextEdit') {
                    editEnd();
                }
            });
        };
        return that;
    };

    // ## CanvasClickController
    //
    // Listens for all clicks on the canvas and connects shapes with the Edit controller above
    //
    // Parameters:
    //
    // * options - Object that includes:
    //	** paper - RaphaelSVG canvas object generated by Raphael Presentation
    //	** closeEnough - value for how close (In RaphaelSVG units) a mouse-click has to be in order to be considered
    // 'clicking' an object
    //
    Controller.namespace("CanvasClickController");
    Controller.CanvasClickController.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.CanvasClickController", options);
        options = that.options;

        // #### CanvasClickController #applyBindings
        //
        // Create the object passed back to the Presentation
        //
        that.applyBindings = function(binding, opts) {
            var ox,
            oy,
            extents,
            activeId,
            closeEnough = opts.closeEnough,
            dx,
            dy,
            x,
            y,
            w,
            h,
            curRendering,
            renderings = {},
            paper = opts.paper,
            offset,
            // #### attachDragResize (private)
            //
            // Find the passed rendering ID, set that rendering object
            // as the current rendering
            //
            // Parameters:
            // * id - ID of the rendering to set as active
            //
            attachDragResize = function(id) {
                var o;
                if ((curRendering !== undefined) && (id === curRendering.id)) {
                    return;
                }
                o = renderings[id];
                if (o === undefined) {
                    // de-activate rendering and all other listeners
                    binding.events.onClick.fire(undefined);
                    // hide the editBox
                    // editBoxController.deActivateEditBox();
                    curRendering = undefined;
                    return false;
                }

                curRendering = o;

            },
            // #### detachDragResize (private)
            //
            // Make the current rendering or rendering that has matching ID *id* non-active
            //
            // Parameters:
            // * id - ID of rendering to make non-active
            //
            detachDragResize = function(id) {
                if ((curRendering !== undefined) && (id === curRendering.id)) {
                    return;
                }
                var o = renderings[id];
            },
            // #### drawShape (private)
            //
            // Using two html elements: container is for
            // registering the offset of the screen (.section-canvas) and
            // the svgEl is for registering mouse clicks on the svg element (svg)
            //
            // Parameters:
            // * container - DOM element that contains the canvas
            // * svgEl - SVG shape element that will have mouse bindings attached to it
            //
            drawShape = function(container) {
                //
                // Sets mousedown, mouseup, mousemove to draw a
                // shape on the canvas.
                //
                var mouseMode = 0,
                topLeft = [],
                bottomRight = [],
                x,
                y,
                w,
                h,
                offset = $(container).offset();

                //
                // MouseMode cycles through three settings:
                // * 0: stasis
                // * 1: Mousedown and ready to drag
                // * 2: Mouse being dragged
                //
                // remove all previous bindings
                $(container).unbind();

                $(container).mousedown(function(e) {
                    if (mouseMode > 0) {
                        return;
                    }
                    x = e.pageX - offset.left;
                    y = e.pageY - offset.top;
                    topLeft = [x, y];
                    mouseMode = 1;
                    binding.events.onShapeStart.fire(topLeft);
                });

                $(container).mousemove(function(e) {
                    if (mouseMode === 2 || mouseMode === 0) {
                        return;
                    }
                    x = e.pageX - offset.left;
                    y = e.pageY - offset.top;
                    bottomRight = [x, y];
                    binding.events.onShapeDrag.fire(bottomRight);
                });

                $(container).mouseup(function(e) {
                    if (mouseMode < 1) {
                        return;
                    }
                    mouseMode = 0;
                    if (bottomRight === undefined) {
                        bottomRight = [x + 5, y + 5];
                    }
                    binding.events.onShapeDone.fire({
                        x: topLeft[0],
                        y: topLeft[1],
                        width: (bottomRight[0] - topLeft[0]),
                        height: (bottomRight[1] - topLeft[1])
                    });
                });
            },
            // #### selectShape (private)
            //
            // Creates a binding for the canvas to listen for mousedowns to select a shape
            //
            // Parameters:
            // * container - HTML element housing the canvas
            selectShape = function(container) {
                //
                // Sets mousedown events to select shapes, not to draw
                // them.
                //
                $(container).unbind();
                $(container).bind('mousedown',
                function(e) {
                    // By default, nullifies all selections
                    options.application.setActiveAnnotation(undefined);
                    activeId = '';
                });

            };

            // Attaches binding for active annotation change to attachDragResize
            options.application.events.onActiveAnnotationChange.addListener(attachDragResize);
            // Change the mouse actions depending on what Mode the application is currently
            // in
            options.application.events.onCurrentModeChange.addListener(function(mode) {
                if (mode === 'Rectangle' || mode === 'Ellipse') {
                    drawShape(binding.locate('svgwrapper'));
                } else if (mode === 'Select') {
                    selectShape(binding.locate('svgwrapper'));
                } else {
                    $(binding.locate('svgwrapper')).unbind();
                }
            });

            // #### registerRendering
            //
            // Takes a rendering object and adds it to internal array for renderings
            //
            // Parameters:
            // * newRendering - Rendering object for a shape annotation
            //
            binding.registerRendering = function(newRendering) {
                renderings[newRendering.id] = newRendering;
            };

            // #### removeRendering
            //
            // Removes rendering object from internal array - for when a shape is out of view or deleted.
            //
            // Parameters:
            //
            // * oldRendering - Rendering object for a shape annotation
            //
            binding.removeRendering = function(oldRendering) {
                delete renderings[oldRendering.id];
            };
        };

        return that;
    };

    // ## AnnotationCreationButton
    //
    // Controls the Annotation Creation Tools set by app.buttonFeature
    //
    Controller.namespace('AnnotationCreationButton');
    Controller.AnnotationCreationButton.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", options);
        options = that.options;

        // #### AnnotationCreationButton #applyBindings
        that.applyBindings = function(binding, opts) {
            var buttonEl,
            active = false,
            onCurrentModeChangeHandle,
            id;

            //
            // Mousedown: activate button - set as active mode
            //
            // Mousedown #2: de-activate button - unset active mode
            //
            // onCurrentModeChange: if != id passed, deactivate, else do nothing
            //
            buttonEl = binding.locate('button');

            // Attach binding to the mousedown
            $(buttonEl).live('mousedown',
            function(e) {
                if (active === false) {
                    active = true;
                    options.application.setCurrentMode(opts.action);
                    $(buttonEl).addClass("active");
                } else if (active === true) {
                    active = false;
                    options.application.setCurrentMode('');
                    $(buttonEl).removeClass("active");
                }
            });

            // #### onCurrentModeChangeHandle (private)
            //
            // Handles when the mode is changed externally from controller
            //
            // Parameters:
            // * action - name of new mode
            //
            onCurrentModeChangeHandle = function(action) {
                if (action === options.action) {
                    active = true;
                    $(buttonEl).addClass('active');
                } else {
                    active = false;
                    $(buttonEl).removeClass("active");
                }
            };

            options.application.events.onCurrentModeChange.addListener(onCurrentModeChangeHandle);
        };

        return that;
    };

    // ## sliderButton
    //
    // Creates a jQuery UI slider for the current time in the video
    //
    Controller.namespace('sliderButton');
    Controller.sliderButton.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.sliderButton", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var sliderElement,
            displayElement,
            sliderStart,
            sliderMove,
            localTime,
            positionCheck;
            displayElement = binding.locate('timedisplay');
            positionCheck = function(t) {
                //
                // if time is not equal to internal time, then
                // reset the slider
                //
                if (localTime === undefined) {
                    localTime = t;
                    $(sliderElement).slider('value', localTime);
                }
            };

            sliderStart = function(e, ui) {
                options.application.setCurrentTime(ui.value);
                $(displayElement).text('TIME: ' + ui.value);
                localTime = ui.value;
            };

            sliderMove = function(e, ui) {
                if (ui === undefined) {
                    localTime = e;
                    $(sliderElement).slider('value', e);
                }

                if (localTime === ui.value) {
                    return;
                }
                options.application.setCurrentTime(ui.value);
                $(displayElement).text('TIME: ' + ui.value);
                localTime = ui.value;
            };
            sliderElement = binding.locate("slider");

            $(sliderElement).slider({
                start: sliderStart,
                slide: sliderMove
            });


        };

        return that;
    };

    // ## timeControl
    //
    // Controller for manipulating the time sequence for an annotation.
    // Currently, just a text box for user to enter basic time data
    //
    Controller.namespace('timeControl');
    Controller.timeControl.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.timeControl", options);
        options = that.options;
        that.currentId = '';

        // #### timeControl #applyBindings
        that.applyBindings = function(binding, opts) {
            var timestart = binding.locate('timestart'),
            timeend = binding.locate('timeend'),
            submit = binding.locate('submit'),
            menudiv = binding.locate('menudiv'),
            start_time,
            end_time;

            $(menudiv).hide();

            $(submit).bind('click',
            function() {
                // **FIXME:** times can be in parts of seconds
                start_time = parseInt($(timestart).val(), 10);
                end_time = parseInt($(timeend).val(), 10);
                if (binding.currentId !== undefined && start_time !== undefined && end_time !== undefined) {
                    // update core data
                    binding.events.onUpdate.fire(binding.currentId, start_time, end_time);

                    $(menudiv).hide();
                }
            });

            options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id !== undefined) {
                    $(menudiv).show();
                    $(timestart).val('');
                    $(timeend).val('');
                    binding.currentId = id;
                } else if (id === undefined) {
                    $(menudiv).hide();
                }
            });
        };

        return that;
    };

    // ## WindowResize
    //
    // Emits an onResize event when the browser window is resized.
    //
    Controller.namespace('WindowResize');
    Controller.WindowResize.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.WindowResize", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var w = binding.locate('resizeBox');
            w.resize(function() {
                setTimeout(binding.events.onResize.fire, 0);
            });
        };

        return that;
    };
} (jQuery, MITHGrid, OAC));
// # Presentations
//
//
// Presentations for OAC:ASP Application
// @author Grant Dickie, Jim Smith
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
        cachedRendering,
        xy,
        wh;

        options = that.options;

        // Setting up local names for the assigned presentation controllers
        canvasController = options.controllers.canvas;
        keyBoardController = options.controllers.keyboard;
        editBoxController = options.controllers.shapeEditBox;
        shapeCreateController = options.controllers.shapeCreateBox;
        windowResizeController = options.controllers.windowResize;

        // x,y,w, and h coordinates are set through the CSS of the container passed in the constructor
        x = $(container).css('x');
        y = $(container).css('y');


        w = $(container).width();
        // measure the div space and make the canvas
        // to fit
        h = $(container).height();

        // Keyboard binding attached to container to avoid multiple-keyboard events from firing
        keyboardBinding = keyBoardController.bind($(container), {});

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
        // **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
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

        // **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
        windowResizeBinding = windowResizeController.bind(window);

        editBoundingBoxBinding.events.onResize.addListener(function(pos) {
            var activeRendering = that.getActiveRendering();
            if (activeRendering !== null && activeRendering.eventResize !== undefined) {
                activeRendering.eventResize(pos);
            }
        });

        editBoundingBoxBinding.events.onMove.addListener(function(pos) {
            var activeRendering = that.getActiveRendering();
            if (activeRendering !== null && activeRendering.eventMove !== undefined) {
                activeRendering.eventMove(pos);
            }
        });

        editBoundingBoxBinding.events.onDelete.addListener(function() {
            var activeRendering = that.getActiveRendering();
            if (activeRendering !== null && activeRendering.eventDelete !== undefined) {
                activeRendering.eventDelete();
                editBoundingBoxBinding.detachRendering();
            }
        });

        options.application.events.onCurrentModeChange.addListener(function(newMode) {
            if (newMode !== 'Select' && newMode !== 'Drag') {
                editBoundingBoxBinding.detachRendering();
            }
        });


        // Adjusts the canvas area, canvas wrapper to fall directly over the
        // player area
        windowResizeBinding.events.onResize.addListener(function() {
            var x,
            y,
            w,
            h,
            containerEl,
            canvasEl,
            htmlWrapper;
            // the following elements should be parts of this presentation
            canvasEl = $('body').find('svg');
            containerEl = $(options.playerWrapper);
            htmlWrapper = $(container);
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

        windowResizeBinding.events.onResize.fire();
        // to make sure we get things set up right
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
        /*
		eventCurrentTimeChange = function(npt) {
			that.visitRenderings(function(id, rendering) {
				if(rendering.eventCurrentTimeChange !== undefined) {
					rendering.eventCurrentTimeChange(npt);
				}
			});
		};*/

        options.application.events.onCurrentTimeChange.addListener(function(npt) {
            that.visitRenderings(function(id, rendering) {
                if (rendering.eventCurrentTimeChange !== undefined) {
                    rendering.eventCurrentTimeChange(npt);
                }
            });
        });
        options.application.events.onTimeEasementChange.addListener(function(te) {
            that.visitRenderings(function(id, rendering) {
                if (rendering.eventTimeEasementChange !== undefined) {
                    rendering.eventTimeEasementChange(te);
                }
            });
        });
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

        superEventFocusChange = that.eventFocusChange;

        that.eventFocusChange = function(id) {
            if (options.application.getCurrentMode() === 'Select') {
                superEventFocusChange(id);
                editBoundingBoxBinding.attachRendering(that.getActiveRendering());
            }
        };
        return that;
    };



} (jQuery, MITHGrid, OAC));
// End of Presentation constructors
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
// # Default Configurations
//

// ## Controller.CanvasClickController
//
// Bindings created by this controller will have the following events:
//
// - onClick
// - onShapeStart
// - onShapeDrag
// - onShapeDone
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.CanvasClickController", {
    bind: {
        events: {
            onClick: null,
			onShapeStart: null,
			onShapeDrag: null,
			onShapeDone: null
        }
    }
});

// ## Controller.TextBodyEditor
//
// Bindings created by this controller will have the following events:
//
// - onClick
// - onDelete
// - onUpdate
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.TextBodyEditor", {
    bind: {
        events: {
            onClick: null,
            onDelete: null,
            onUpdate: null
        }
    }
});

// ## Controller.AnnotationEditSelectionGrid
//
// Bindings created by this controller will have the following events:
//
// - onResize
// - onMove
// - onEdit
// - onDelete
// - onCurrentModeChange
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid", {
	dirs: ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'],
    bind: {
		events: {
	        onResize: null,
	        onMove: null,
	        onEdit: null,
	        onDelete: null,
			onCurrentModeChange: null
	    }
	}
});

// ## Controller.KeyboardListener
//
// Bindings created by this controller will have the following events:
//
// - onDelete
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.KeyboardListener", {
    bind: {
        events: {
            onDelete: ["preventable", "unicast"]
        }
    }
});

// ## Controller.AnnotationCreationButton
//
// Bindings created by this controller will have the following events:
//
// - onCurrentModeChange
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", {
	bind: {
		events: {
			onCurrentModeChange: null
		}
	}
});

// ## Controller.ShapeCreateBox
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", {
	bind: {
		events: {
			
		}
	}
});

// ## Controller.WindowResize
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.WindowResize", {
	bind: {
		events: {
			onResize: null
		}
	},
	selectors: {
		'': ''
	}
});

// ## Controller.Drag
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Drag", {
	bind: {
		events: {
			onFocus: null,
			onUnfocus: null,
			onUpdate: null
		}
	},
	selectors: {
		'': ''
	}
});

// ## Controller.Select
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Select", {
	bind: {
		events: {
			onSelect: null
		}
	},
	selectors: {
		'': ''
	},
	isSelectable: function() { return true; }
});

// ## Controller.timeControl
//
// Bindings created by this controller will have the following events:
//
// - onUpdate
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.timeControl", {
	bind: {
		events: {
			onUpdate: null
		}
	}
});

// ## Annotation Client
//
MITHGrid.defaults("OAC.Client.StreamingVideo", {
	controllers: {
		keyboard: {
			type: OAC.Client.StreamingVideo.Controller.KeyboardListener,
			selectors: {
				doc: ''
			}
		},
		shapeEditBox: {
			type: OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid
		},
		shapeCreateBox: {
			type: OAC.Client.StreamingVideo.Controller.ShapeCreateBox
		},
		canvas: {
			type: OAC.Client.StreamingVideo.Controller.CanvasClickController,
			selectors: {
				svgwrapper: ''
			}
		},
		annoActive: {
			type: OAC.Client.StreamingVideo.Controller.TextBodyEditor,
			selectors: {
				annotation: '',
				annotationlist: ':parent',
				bodycontent: '.bodyContent',
				body: '.body',
				editbutton: '.button.edit',
				editarea: '.editArea',
				textarea: '.editArea > textarea',
				updatebutton: '.button.update',
				deletebutton: '.button.delete'
			}
		},
		buttonActive: {
			type: OAC.Client.StreamingVideo.Controller.AnnotationCreationButton,
			selectors: {
				button: ''
			}
		},
		timecontrol: {
			type: OAC.Client.StreamingVideo.Controller.timeControl,
			selectors: {
				timestart: '#timestart',
				timeend: '#timeend',
				submit: '#submittime',
				menudiv: ''
			}
		},
		selectShape: {
			type: OAC.Client.StreamingVideo.Controller.Select,
			selectors: {
				raphael: ''
			}
		},
		windowResize: {
			type: OAC.Client.StreamingVideo.Controller.WindowResize,
			selectors: {
				resizeBox: ''
			}
		}
	},
	variables: {
		// **ActiveAnnotation** holds the item ID of the annotation currently receiving selection focus.
		//
		// - setActiveAnnotation(id) sets the id
		// - getActiveAnnotation() returns the id
		// - events.onActiveAnnotationChange fires when the ActiveAnnotation value changes
		ActiveAnnotation: {
			is: 'rw'
		},
		// **CurrentTime** holds the current position of the video play head in seconds. The value defaults to 0 seconds.
		//
		// - setCurrentTime(time) sets the play head position for the annotation client (does not affect the player)
		// - getCurrentTime() returns the current play head position
		// - events.onCurrentTimeChange fires when the CurrentTime value changes
		CurrentTime: {
			is: 'rw',
			"default": 0
		},
		// **TimeEasement** holds the number of seconds an annotation eases in or out of full view.
		//
		// - setTimeEasement(t)
		// - getTimeEasement()
		// - events.onTimeEasementChange
		TimeEasement: {
			is: 'rw',
			"default": 5
		},
		// **CurrentMode** holds the current interaction mode for the annotation client. Values may be a shape type,
		// "Watch", or "Select".
		//
		// - setCurrentMode(mode) sets the annotation client mode
		// - getCurrentMode() returns the current annotation client mode
		// - events.onCurrentModeChange fires when the CurrentMode value changes
		CurrentMode: {
			is: 'rw'
		},
		// **Player** holds the current video player driver instance.
		//
		// - setPlayer(player) sets the current video player driver instance
		// - getPlayer() returns the current video player driver instance
		// - events.onPlayerChange fires when the Player value changes
		Player: {
			is: 'rw'
		}
	},
	dataViews: {
		/*
		drawspace: {
			dataStore: 'canvas',
			types: ["Annotation"]
		},
		*/
		// **currentAnnotations** pages a range of times through the annotation store selecting those
		// annotations which have a time range (.npt\_start through .npt\_end) that fall within the time
		// range set.
		currentAnnotations: {
			dataStore: 'canvas',
			type: MITHGrid.Data.RangePager,
			leftExpressions: [ '.npt_start' ],
			rightExpressions: [ '.npt_end' ]
		}
	},
	// Data store for the Application
	dataStores: {
		// **canvas** holds all of the annotation data for the client.
		canvas: {
			types:{
				// All annotation items are of type "Annotation"
				Annotation: {}
			},
			// The following properties are understood by the annotation client:
			properties: {
				// - shapeType indicates which shape is used as the SVG constraint within the frame (e.g., Rectangle or Ellipse)
				shapeType: {
					valueType: 'text'
				},
				// - bodyType indicates what kind of body the annotation associates with the target (e.g., Text)
				bodyType: {
					valueType: 'text'
				},
				// - bodyContent holds the byte stream associated with the annotation body
				bodyContent: {
					valueType: 'text'
				},
				// - targetURI points to the annotation target video without time constraints
				targetURI: {
					valueType: 'uri'
				},
				// - opacity is used in the SVG rendering of the annotation target constraint (shape)
				opacity: {
					valueType: 'numeric'
				},
				// - the play head position at which this annotation becomes active/current
				npt_start: {
					valueType: "numeric"
				},
				// - the play head position at which this annotation ceases being active/current
				npt_end: {
					valueType: "numeric"
				}
			}
		}
	},
	presentations: {
		raphsvg: {
			type: MITHGrid.Presentation.RaphaelCanvas,
			dataView: 'currentAnnotations',
			// The controllers are configured for the application and passed in to the presentation's
			// initInstance method as named here.
			controllers: {
				keyboard: "keyboard",
				canvas: "canvas",
				shapeCreateBox: "shapeCreateBox",
				shapeEditBox: "shapeEditBox",
				windowResize: "windowResize"
			},
			events: {
				onOpacityChange: null
			},
			fadeStart: 5
		},
		annoItem: {
			type: MITHGrid.Presentation.AnnotationList,
			dataView: 'currentAnnotations',
			container: '.anno_list'
		} //annoItem
	}
});
