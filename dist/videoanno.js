/*
 *  OAC Video Annotation Tool v0.1
 * 
 *  Developed as a plugin for the MITHGrid framework. 
 *  
 *  Date: Wed Jan 11 14:04:42 2012 -0500
 *  
 * Educational Community License, Version 2.0
 * 
 * Copyright 2011 University of Maryland. Licensed under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 * 
 * http://www.osedu.org/licenses/ECL-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 * 
 */

var MITHGrid = MITHGrid || {};
var jQuery = jQuery || {};
var Raphael = Raphael || {};
var OAC = OAC || {};
var app = {};

// Set the namespace for the StreamingVideo Annotation application
MITHGrid.globalNamespace("OAC");
OAC.namespace("Client");
OAC.Client.namespace("StreamingVideo");(function($, MITHGrid, OAC) {
    var Controller = OAC.Client.StreamingVideo.namespace('Controller');
    Controller.namespace("KeyboardListener");

    /*
	 * Keyboard Listener Controller
	 *
	 * Keyboard listener - listens to keydown events on the document
	 * level (not sure if it will work on lower DOM elements)
     */
    Controller.KeyboardListener.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.KeyboardListener", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var doc = binding.locate('doc'),
            activeId,
            setActiveId = function(id) {
                activeId = id;
            };

            options.application.events.onActiveAnnotationChange.addListener(setActiveId);

            $(doc).keydown(function(e) {
                if (activeId !== undefined || activeId !== '') {
                    // If backspace or delete is pressed,
                    // then it is interpreted as a
                    // delete call
                    if (e.keyCode === 8 || e.keyCode === 46) {
                        // delete item
                        binding.events.onDelete.fire(activeId);
                        activeId = '';
                    }
                }
            });
        };

        return that;
    };

    Controller.namespace("AnnotationEditSelectionGrid");
    /*
	 * Annotation Selection Grid
	 *
	 * Attaches to an SVG lens and creates a green rectangle dashed box to
	 * act as the resize and drag tool. Only edits the SVG data - no annotation
	 * bodyContent data.
     */
    Controller.AnnotationEditSelectionGrid.initController = function(options) {
        var that = MITHGrid.Controller.initController(
        "OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid",
        options
        ),
        dirs = [];

        options = that.options;
        dirs = that.options.dirs || ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'];

        /*
		 * Bounding box is created once in memory - it should be bound to the
		 * canvas/paper object or something that contains more than 1 shape.
         */
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

            binding.events.onResize.addListener(function(id, pos) {
                if (activeRendering !== undefined && activeRendering.eventResize !== undefined) {
                    activeRendering.eventResize(id, pos);
                }
            });

            binding.events.onMove.addListener(function(id, pos) {
                if (activeRendering !== undefined && activeRendering.eventMove !== undefined) {
                    activeRendering.eventMove(id, pos);
                }
            });

            binding.events.onDelete.addListener(function(id) {
                if (activeRendering !== undefined && activeRendering.eventDelete !== undefined) {
                    activeRendering.eventDelete(id);
                }
            });

            // Function for applying a new shape to the bounding box
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
                if (typeof(activeRendering) === "undefined" || activeRendering === null) {
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

            // Draws the handles defined in dirs as SVG
            // rectangles and draws the SVG bounding box
            drawHandles = function() {
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
                        midDrag.drag(
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
                        },
                        function(x, y, e) {
                            // start
                            ox = e.layerX;
                            oy = e.layerY;
                            calcFactors();
                            activeRendering.shape.attr({
                                cursor: 'move'
                            });
                        },
                        function() {
                            // end
                            var pos = {
                                x: shapeAttrs.x,
                                y: shapeAttrs.y
                            };

                            that.events.onMove.fire(activeRendering.id, pos);
                            activeRendering.shape.attr({
                                cursor: 'default'
                            });
                        }
                        );
                    }

                    // Attaching drag and resize handlers
                    handleSet.drag(
                    function(dx, dy) {
                        // dragging here means that as element is dragged
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
                    },
                    function(x, y, e) {
                        var px,
                        py;
                        extents = activeRendering.getExtents();
                        ox = e.layerX;
                        oy = e.layerY;
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
                    },
                    function() {
                        // update
                        var pos = {
                            width: shapeAttrs.w,
                            height: shapeAttrs.h
                        };
                        if (activeRendering !== undefined) {
                            that.events.onResize.fire(activeRendering.id, pos);
                        }
                    }
                    );
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

            // Draws menu that sits at the top-right corner
            // of the shape
            drawMenu = function(args) {
                if ($.isEmptyObject(itemMenu)) {

                    menuAttrs.x = args.x + (args.width);
                    menuAttrs.y = args.y - (padding * 4) - 2;
                    menuAttrs.w = 100;
                    menuAttrs.h = 20;

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
                            that.events.onDelete.fire(activeRendering.id);
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

    /*
	* Shape Creation Box
	* Similar to the Edit bounding box, but displays differently
	* and listens for events from canvasClickController in "create" mode
	*/
    Controller.namespace('ShapeCreateBox');
    Controller.ShapeCreateBox.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            /*
			 * Bounding box is created once in memory - it should be bound to the
			 * canvas/paper object or something that contains more than 1 shape.
	         */
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

            /*
			Creates the SVGBBOX which acts as a guide to the user 
			of how big their shape will be once shapeDone is fired
			*/
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

            /*
			Take passed x,y coords and set as bottom-right, not
			top left
			*/
            binding.resizeGuide = function(coords) {

                attrs.width = (coords[0] - attrs.x);
                attrs.height = (coords[1] - attrs.y);

                svgBBox.attr({
                    width: attrs.width,
                    height: attrs.height
                });
            };

            /*
			Take the saved coordinates and pass them back 
			to the calling function
			*/
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

    /** 
	Annotation Active Controller 
	Handles HTML annotation lens 
	*/
    Controller.namespace("AnnoActiveController");
    Controller.AnnoActiveController.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.AnnoActiveController", options);
        options = that.options;

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
            bindingActive = false;

            editStart = function() {
                $(editArea).show();
                $(bodyContent).hide();
                bindingActive = true;
                binding.events.onClick.fire(opts.itemId);
            };

            editEnd = function() {
                $(editArea).hide();
                $(bodyContent).show();
                bindingActive = false;
            };

            editUpdate = function(e) {
                var data = $(textArea).val();
                e.preventDefault();
                binding.events.onUpdate.fire(opts.itemId, data);
                editEnd();
            };

            $(annoEl).bind('dblclick',
            function(e) {
                e.preventDefault();
                if (bindingActive) {
                    editEnd();
                } else {
                    editStart();
                }
            });

            $(annoEl).bind('click',
            function(e) {
                // binding.events.onClick.fire(opts.itemId);
                options.application.setActiveAnnotation(opts.itemId);
            });

            options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id !== opts.id && bindingActive) {
                    editUpdate({
                        preventDefault: function() {}
                    });
                    editEnd();
                }
            });

        };
        return that;
    };

    /*
* Canvas Controller
* Listens for all clicks on the canvas and connects shapes with the
* Edit controller above
*/
    Controller.namespace("CanvasClickController");
    Controller.CanvasClickController.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.CanvasClickController", options);
        options = that.options;
        // Create the object passed back to the Presentation
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
            detachDragResize = function(id) {
                if ((curRendering !== undefined) && (id === curRendering.id)) {
                    return;
                }
                var o = renderings[id];
            },
            drawShape = function(container) {
                /*
				Sets mousedown, mouseup, mousemove to draw a 
				shape on the canvas.
				*/
                var mouseMode = 0,
                topLeft = [],
                bottomRight = [],
                x,
                y,
                w,
                h,
                offset = $(container).offset();

                /*
				MouseMode cycles through three settings:
				0: stasis
				1: Mousedown and ready to drag
				2: Mouse being dragged
				*/
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
            selectShape = function(container) {
                /*
				Sets mousedown events to select shapes, not to draw
				them.
				*/
                $(container).unbind();
                $(container).bind('mousedown',
                function(e) {
                    activeId = '';
                    offset = $(container).offset();

                    ox = Math.abs(e.pageX - offset.left);
                    oy = Math.abs(e.pageY - offset.top);
                    if (curRendering !== undefined) {
                        extents = curRendering.getExtents();
                        dx = Math.abs(ox - extents.x);
                        dy = Math.abs(oy - extents.y);
                        if (dx < extents.width / 2 + 4 && dy < extents.height / 2 + 4) {
                            // nothing has changed
                            return;
                        }
                    }
                    $.each(renderings,
                    function(i, o) {
                        extents = o.getExtents();

                        dx = Math.abs(ox - extents.x);
                        dy = Math.abs(oy - extents.y);
                        // the '3' is for the drag boxes around the object
                        if (dx < extents.width / 2 + 4 && dy < extents.height / 2 + 4) {
                            activeId = o.id;
                            if ((curRendering === undefined) || (o.id !== curRendering.id)) {
                                curRendering = o;
                                options.application.setActiveAnnotation(o.id);
                            }
                            // stop running loop
                            return false;
                        }
                    });
                    if ((activeId.length === 0) && (curRendering !== undefined)) {
                        // No shapes selected - de-activate current rendering and all other possible renderings
                        options.application.setActiveAnnotation(undefined);
                        curRendering = undefined;
                    }
                });

            };

            options.application.events.onActiveAnnotationChange.addListener(attachDragResize);
            options.application.events.onCurrentModeChange.addListener(function(mode) {
                if (mode === 'Rectangle' || mode === 'Ellipse') {
                    drawShape(binding.locate('svg'));
                } else if (mode === 'Select') {
                    selectShape(binding.locate('svg'));
                }
            });

            // Add to events
            binding.registerRendering = function(newRendering) {
                renderings[newRendering.id] = newRendering;
            };

            binding.removeRendering = function(oldRendering) {
                delete renderings[oldRendering.id];
            };
        };

        return that;
    };

    /*
	Controls the Annotation Creation Tools set by app.buttonFeature
	*/
    Controller.namespace('AnnotationCreationButton');
    Controller.AnnotationCreationButton.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", options);
        options = that.options;

        that.applyBindings = function(binding, opts) {
            var buttonEl,
            active = false,
            onCurrentModeChangeHandle,
            id;

            /*
			Mousedown: activate button - set as active mode
			Mousedown #2: de-activate button - unset active mode
			onCurrentModeChange: if != id passed, deactivate, else do nothing
			*/
            buttonEl = binding.locate('button');

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

            onCurrentModeChangeHandle = function(action) {
                if (id === '') {
                    // set to nothing
                    active = false;
                    $(buttonEl).removeClass("active");
                } else if (action === options.action) {
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
	
	Controller.namespace('sliderButton');
	Controller.sliderButton.initController = function(options) {
		var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.sliderButton", options);
		options = that.options;
		
		that.applyBindings = function(binding, opts) {
			var sliderElement, displayElement, sliderStart, sliderMove,
			positionCheck, localTime;
			displayElement = binding.locate('timedisplay');
			positionCheck = function(t) {
				/*
				if time is not equal to internal time, then 
				reset the slider
				*/
				if(localTime === undefined) {
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
				if(localTime === ui.value) {
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
} (jQuery, MITHGrid, OAC));
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
        myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId;

        canvasId += 1;

        /*
		* Creating application to run DOM and presentations
		*/
        app = MITHGrid.Application.initApp("OAC.Client.StreamingVideo", container,
        $.extend(true, {},
        {
            viewSetup: '<div id="sidebar' + myCanvasId + '" class="controlarea"></div>' +
            '<div class="canvas_svg_holder"><div id="' + myCanvasId + '" class="canvas_svg"></div></div>' +

            '<div class="anno_list"></div>',
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

        app.cWidth = 100;
        app.cHeight = 100;

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
            ntp_start = app.getCurrentTime() - 1,
            ntp_end = app.getCurrentTime() + 1,
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
                ntp_start: ntp_start,
                ntp_end: ntp_end
            };
            $.extend(shapeItem, shape);
            app.dataStore.canvas.loadItems([shapeItem]);
        };

        app.ready(function() {
            annoActiveController = app.controller.annoActive;
            app.events.onActiveAnnotationChange.addListener(app.presentation.raphsvg.eventFocusChange);
            app.events.onActiveAnnotationChange.addListener(app.presentation.annoItem.eventFocusChange);
            app.events.onCurrentTimeChange.addListener(function(t) {
                // five seconds on either side of the current time
                app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5);
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
            sliderButton;

            calcRectangle = function(coords) {
                var attrs = {};
                attrs.x = (coords.x + (coords.width / 2));
                attrs.y = (coords.y + (coords.height / 2));
                attrs.w = coords.width;
                attrs.h = coords.height;
                return attrs;
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
				$(c.node).attr('id',item.id[0]);
                that.update = function(item) {
                    // receiving the Object passed through
                    // model.updateItems in move()
                    try {
                        if (item.x !== undefined && item.y !== undefined && item.w !== undefined && item.y !== undefined) {
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
            // app.addBody("Ellipse", app.initTextLens);
            /*
			Adding in button features for annotation creation
			*/

            rectButton = app.buttonFeature('buttongrouping', 'Shapes', 'Rectangle');

            ellipseButton = app.buttonFeature('buttongrouping', 'Shapes', 'Ellipse');

            selectButton = app.buttonFeature('buttongrouping', 'General', 'Select');

            sliderButton = app.buttonFeature('slidergrouping', 'Time', 'progress');


            // Add some items to test
            app.dataStore.canvas.loadItems([{
                id: "anno0",
                type: "Annotation",
                bodyType: "text",
                bodyContent: "Annotation here",
                creator: "Grant Dickie",
                x: 100,
                y: 460,
                w: 100,
                h: 100,
                shapeType: "Rectangle",
                ntp_start: 6,
                ntp_end: 45,
                opacity: 0
            }]);
            app.dataStore.canvas.loadItems([{
                id: "anno1",
                type: "Annotation",
                bodyType: "text",
                bodyContent: "Annotation here",
                creator: "Grant Dickie",
                x: 340,
                y: 220,
                w: 20,
                h: 100,
                shapeType: "Rectangle",
                ntp_start: 16,
                ntp_end: 33,
                opacity: 0
            }]);

			app.setCurrentTime(0);
        });
		
        return app;
    };
} (jQuery, MITHGrid, OAC));

// Default library for the Canvas application

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

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnoActiveController", {
    bind: {
        events: {
            onClick: null,
            onDelete: null,
            onUpdate: null
        }
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid", {
    bind: {
		events: {
	        onResize: null,
	        onMove: null,
	        onEdit: null,
	        onDelete: null
	    }
	}
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.KeyboardListener", {
    bind: {
        events: {
            onDelete: ["preventable", "unicast"]
        }
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", {
	bind: {
		events: {
			onCurrentModeChange: null
		}
	}
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", {
	bind: {
		events: {
			
		}
	}
});

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
				svg: ''
			}
		},
		annoActive: {
			type: OAC.Client.StreamingVideo.Controller.AnnoActiveController,
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
		slider: {
			type: OAC.Client.StreamingVideo.Controller.sliderButton,
			selectors: {
				slider: '#slider',
				timedisplay: '.timedisplay'
			}
		}
	},
	variables: {
		ActiveAnnotation: {
			is: 'rw'
		},
		CurrentTime: {
			is: 'rw',
			"default": 0
		},
		CurrentMode: {
			is: 'rw'
		}
	},
	dataViews: {
		// view for the space in which data from shapes
		// is drawn
		drawspace: {
			dataStore: 'canvas',
			types: ["Annotation"]
		},
		currentAnnotations: {
			dataStore: 'canvas',
			type: MITHGrid.Data.RangePager,
			leftExpressions: [ '.ntp_start' ],
			rightExpressions: [ '.ntp_end' ]
		}
	},
	// Data store for the Application
	dataStores: {
		canvas: {
			// put in here the types of data that will
			// be represented in OACVideoAnnotator
			types:{
				// types of shapes -- to add a new
				// shape object, add it here
				Annotation: {}
			},
			properties: {
				shapeType: {
					valueType: 'text'
				},
				bodyType: {
					valueType: 'text'
				},
				bodyContent: {
					valueType: 'text'
				},
				targetURI: {
					valueType: 'uri'
				},
				opacity: {
					valueType: 'numeric'
				},
				start_ntp: {
					valueType: "numeric"
				},
				end_ntp: {
					valueType: "numeric"
				}
			}
		}
	},
	presentations: {
		raphsvg: {
			type: MITHGrid.Presentation.RaphaelCanvas,
			dataView: 'currentAnnotations',
			controllers: {
				keyboard: "keyboard",
				editBox: "editBox",
				canvas: "canvas",
				shapeCreateBox: "shapeCreateBox",
				shapeEditBox: "shapeEditBox"
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
// End of OAC Video Annotator

// @author Grant Dickie
