(function($, MITHGrid, OAC) {
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
                if (options.application.getCurrentMode() === 'Editing') {
                    return;
                }
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
                    binding.detachRendering();
                }
            });

            options.application.events.onCurrentModeChange.addListener(function(newMode) {
                if (newMode !== 'Select' && newMode !== 'Drag') {
                    binding.detachRendering();
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
			
			/* Calcfactors
				Measures where the handles should be on 
				mousemove
			*/
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

                            binding.events.onMove.fire(activeRendering.id, pos);
                            activeRendering.shape.attr({
                                cursor: 'default'
                            });
                        }
                        );
                    }

                    // Attaching drag and resize handlers
                    handleSet.drag(
                    function(dx, dy) {
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
                    },
                    function(x, y, e) {
                        // onstart function
                        var px,
                        py;
                        extents = activeRendering.getExtents();
                        ox = e.layerX;
                        oy = e.layerY;

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
                    },
                    function() {
                        // onend function
                        // update
                        var pos = {
                            width: shapeAttrs.w,
                            height: shapeAttrs.h
                        };
                        if (activeRendering !== undefined) {
                            binding.events.onResize.fire(activeRendering.id, pos);
                        }
                        // change mode back
                        options.application.setCurrentMode('Select');
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

			/*
			Goes through handle object array and 
			sets each handle box coordinate
			*/
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
	Text Body Editor
	Handles HTML annotation lens for editing the
	bodyContent text
	*/
    Controller.namespace("TextBodyEditor");
    Controller.TextBodyEditor.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.TextBodyEditor", options);
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
            bindingActive = false,
            prevMode;

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

                    options.application.setCurrentMode(prevMode || '');
                } else {
                    editStart();
                    prevMode = options.application.getCurrentMode();
                    options.application.setCurrentMode('TextEdit');
                }
            });

            $(annoEl).bind('click',
            function(e) {
                // binding.events.onClick.fire(opts.itemId);
                options.application.setActiveAnnotation(opts.itemId);
            });

            $(updateButton).bind('click',
            function(e) {
                binding.events.onUpdate.fire(opts.itemId, $(textArea).val());
                editEnd();
                options.application.setCurrentMode(prevMode);
            });

            $(deleteButton).bind('click',
            function(e) {
                binding.events.onDelete.fire(opts.itemId);
                // remove DOM elements
                $(annoEl).remove();
            });

            options.application.events.onActiveAnnotationChange.addListener(function(id) {
                if (id !== opts.id && bindingActive) {
                    editUpdate({
                        preventDefault: function() {}
                    });
                    editEnd();
                }
            });

            options.application.events.onCurrentModeChange.addListener(function(newMode) {
                if (newMode !== 'TextEdit') {
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
            /*
			Using two html elements: container is for 
			registering the offset of the screen (.section-canvas) and 
			the svgEl is for registering mouse clicks on the svg element (svg)
            */
            drawShape = function(container, svgEl) {
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
				
                $(svgEl).mousedown(function(e) {
                    if (mouseMode > 0) {
                        return;
                    }
                    x = e.pageX - offset.left;
                    y = e.pageY - offset.top;
                    topLeft = [x, y];
                    mouseMode = 1;
                    binding.events.onShapeStart.fire(topLeft);
                });

                $(svgEl).mousemove(function(e) {
                    if (mouseMode === 2 || mouseMode === 0) {
                        return;
                    }
                    x = e.pageX - offset.left;
                    y = e.pageY - offset.top;
                    bottomRight = [x, y];
                    binding.events.onShapeDrag.fire(bottomRight);
                });

                $(svgEl).mouseup(function(e) {
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
					// By default, nullifies all selections
					options.application.setActiveAnnotation(undefined);
					activeId = '';
					/*
                    activeId = '';
                    offset = $(container).offset();
                    
                    if (curRendering !== undefined) {
                        extents = curRendering.getExtents();
                        dx = e.pageX - offset.left;
                        dy = e.pageY - offset.top; 
                        if (dx < extents.width + 4 && dy < extents.height + 4) {
                            // nothing has changed
                            return;
                        }
                    }

                    $.each(renderings,
                    function(i, o) {
                        extents = o.getExtents();
                        dx = e.pageX - offset.left;
                        dy = e.pageY - offset.top;
						
						console.log('offset: ' + JSON.stringify(offset) + 'dx: ' + dx + '  extents.x: ' + extents.x + '  dy: ' + dy + ' extents.y: ' + extents.y);
                        // the '5' is for increasing the space where the user can click
						// to activate a shape
                        if ((dx < (extents.x + 5)) && (dy < (extents.y + 5)) && 
							(dx > (extents.x - 5)) && (dy > (extents.y - 5))) {
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
                
					*/
				});
				
            };

            options.application.events.onActiveAnnotationChange.addListener(attachDragResize);
			// Change the mouse actions depending on what Mode the application is currently
			// in
            options.application.events.onCurrentModeChange.addListener(function(mode) {
                if (mode === 'Rectangle' || mode === 'Ellipse') {
                    drawShape(binding.locate('svgwrapper'), binding.locate('svg'));
                } else if (mode === 'Select') {
                    selectShape(binding.locate('svg'));
					
                } else {
					$(binding.locate('svg')).unbind();
				}
            });

            // Add to events
            binding.registerRendering = function(newRendering) {
                renderings[newRendering.id] = newRendering;
				// add a click event to the SVG shape
				newRendering.shape.click(function(el) {
					if(options.application.getCurrentMode() === 'Select') {
						activeId = newRendering.id;
						options.application.setActiveAnnotation(newRendering.id);
					}
				});
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
                /*
				if time is not equal to internal time, then 
				reset the slider
				*/
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

    /*
Controller for manipulating the time sequence for an annotation.
Currently, just a text box for user to enter basic time data
*/
    Controller.namespace('timeControl');
    Controller.timeControl.initController = function(options) {
        var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.timeControl", options);
        options = that.options;
        that.currentId = '';
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
	
	/* Handles instances where screen has moved and canvas needs to be re-sized */
	Controller.namespace('screenMove'); 
	Controller.screenMove.initController = function(options) {
		var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.screenMove", options);
        options = that.options;
		
		that.applyBindings = function(binding, opts) {
			var canvasEl = binding.locate('canvas'),
			containerEl = binding.locate('container'),
			htmlWrapper = binding.locate('htmlCanvasWrapper'),
			w, h, x, y;
			
			$(window).resize(function() {
				setTimeout(function() {
					// place svg canvas to new area
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
					
				}, 10);
				
				
			});
		};
		
		return that;
		
	};
} (jQuery, MITHGrid, OAC));
