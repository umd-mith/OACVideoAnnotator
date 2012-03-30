//
// OAC Video Annotation Tool v0.1
// 
// The **OAC Video Annotation Tool** is a MITHGrid application providing annotation capabilities for streaming
// video embedded in a web page. 
//  
// Date: Fri Mar 30 11:31:52 2012 -0400
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
		dirs = that.options.dirs; // || ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'];
		
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
			
			// ##### calcFactors (private)
			//
			// Measures where the handles should be on mousemove.
			//
			// Parameters: None.
			//
			// Returns: Nothing.
			//
			// **FIXME:** activeRendering management needs to be in the presentation hosting the bounding box rendering.
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
								//
								// **FIXME:** layerX and layerY are deprecated in WebKit
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

								binding.events.onMove.fire(activeRendering.id, pos);
								activeRendering.shape.attr({
									cursor: 'default'
								});
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
								binding.events.onResize.fire(activeRendering.id, pos);
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
	// Similar to the Edit bounding box, but displays differently
	// and listens for events from canvasClickController in "create" mode
	//
	Controller.namespace('ShapeCreateBox');
	Controller.ShapeCreateBox.initController = function(options) {
		var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", options);
		options = that.options;

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

			//
			// Creates the SVGBBOX which acts as a guide to the user 
			// of how big their shape will be once shapeDone is fired
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

			//
			// Take passed x,y coords and set as bottom-right, not
			// top left
			//
			binding.resizeGuide = function(coords) {

				attrs.width = (coords[0] - attrs.x);
				attrs.height = (coords[1] - attrs.y);

				svgBBox.attr({
					width: attrs.width,
					height: attrs.height
				});
			};

			//
			// Take the saved coordinates and pass them back 
			// to the calling function
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
	// Handles HTML annotation lens for editing the bodyContent text.
	//
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

	// ## CanvasClickController
	// Listens for all clicks on the canvas and connects shapes with the Edit controller above
	//
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
			//
			// Using two html elements: container is for 
			// registering the offset of the screen (.section-canvas) and 
			// the svgEl is for registering mouse clicks on the svg element (svg)
			//
			drawShape = function(container, svgEl) {
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

	// ## AnnotationCreationButton
	//
	// Controls the Annotation Creation Tools set by app.buttonFeature
	//
	Controller.namespace('AnnotationCreationButton');
	Controller.AnnotationCreationButton.initController = function(options) {
		var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", options);
		options = that.options;

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

	// ## sliderButton
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
			var w = binding.locate('');
			w.resize(function() {
				setTimeout(binding.events.onResize.fire, 0);
			});
		};
		
		return that;
	};
} (jQuery, MITHGrid, OAC));

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

		// **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
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
		// **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
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
		
		// **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
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
		
		windowResizeBinding.events.onResize.fire(); // to make sure we get things set up right
		
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
				if(rendering.eventCurrentTimeChange !== undefined) {
					rendering.eventCurrentTimeChange(npt);
				}
			});
		});
		options.application.events.onTimeEasementChange.addListener(function(te) {
			that.visitRenderings(function(id, rendering) {
				if(rendering.eventTimeEasementChange !== undefined) {
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

// # Annotation Application
//
// TODO: rename file to application.js

(function($, MITHGrid, OAC) {
	var canvasId = 1;

	// ## StreamingVideo.initApp
	//
	// Parameters:
	//
	// * container - the DOM container in which the application should place its content
	// * options - an object holding configuration information
	//
	// Returns:
	//
	// The configured OAC streaming video annotation client object.
	//
	// Options:
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
					isActive: function() { return app.getCurrentMode() !== 'Editing'; }
				}
			},
			// We connect the SVG overlay and annotation sections of the DOM with their respective
			// presentations.
			presentations: {
				raphsvg: {
					container: "#" + myCanvasId,
					lenses: { },
					lensKey: ['.shapeType']
				},
				annoItem: {
					container: '.section-annotations',
					lenses: { },
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
			}, calcOpacity,
			focused, opacity, start, end, fstart, fend, 
			item = model.getItem(itemId);
			
			// ### calcOpacity (private)
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
			end	  = item.ntp_end[0];
			fstart = start - app.getTimeEasement();
			fend   = end   + app.getTimeEasement();
			
			opacity = calcOpacity(app.getCurrentTime());
			
			that.eventTimeEasementChange = function(v) {
				fstart = start - v;
				fend   = end + v;
				that.setOpacity(calcOpacity(app.getCurrentTime()));
			};
			
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
				if(o !== null && o !== undefined) { opacity = o; }
				that.shape.attr({
					opacity: (focused ? 1.0 : 0.5) * opacity
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
			// The data item is removed if and only if the id passed in matches the id of the rendered item.
			//
			// Parameters:
			//
			// * id - the item ID of the item to be deleted
			that.eventDelete = function(id) {
				if (id === itemId) {
					model.removeItems([itemId]);
				}
			};

			// #### #eventResize
			//
			// Called when the bounding box of the rendering changes size.
			//
			// The item is resized if and only if the id passed in matches the id of the rendered item.
			//
			// Parameters:
			//
			// * id - the item ID of the item to be resized
			// * pos - object containing the .width and .height properties
			//
			// Returns: Nothing.
			//
			that.eventResize = function(id, pos) {
				if (id === itemId) {
					model.updateItems([{
						id: itemId,
						w: pos.width,
						h: pos.height
					}]);
				}
			};

			// #### #eventMove
			//
			// Called when the bounding box of the rendering is moved.
			//
			// The item is moved if and only if the id passed in matches the id of the rendered item.
			//
			// Parameters:
			//
			// * id - the item ID of the item to be moved
			// * pos - object containing the .x and .y properties
			//
			// Returns: Nothing.
			//
			that.eventMove = function(id, pos) {
				if (id === itemId) {
					model.updateItems([{
						id: itemId,
						x: pos.x,
						y: pos.y
					}]);
				}
			};
			
			// #### update
			//
			// Updates the rendering's opacity based on the current time and the time extent of the annotation.
			//
			that.update = function(item) {
				if(item.ntp_start[0] !== start || item.ntp_end[0] !== end) {
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
		app.buttonFeature = function(area, grouping, action) {
			
			// Check to make sure button isn't already present
			// **FIXME:** make sure the id is unique in the page since we can have multiple instances of the
			// annotation client (one per video)
			if ($('#' + action).length !== 0) {
				return false; // Abort
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
				if ($(container).find('#' + grouping).length === 0) {
					$(container).append('<div id="' + grouping + '" class="buttongrouping"></div>');
				}

				groupEl = $("#" + grouping);

				//
				// generate HTML for button, then attach the callback. action
				// refers to ID and also the title of the button
				//
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

				//
				// HTML for slider button
				//
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
		//		
		app.insertShape = function(coords) {
			var shapeItem,
			ntp_start = parseFloat(app.getCurrentTime()) - 5,
			ntp_end = parseFloat(app.getCurrentTime()) + 5,
			curMode = app.getCurrentMode(),
			shape;

			shape = shapeTypes[curMode].calc(coords);
			shapeAnnotationId += 1;

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

		// ### #exportShapes
		//
		// Exports all annotation data as JSON. All SVG data is converted to generic units.
		//
		app.exportShapes = function() {
			var canvasWidth,
			canvasHeight;

			canvasWidth = $('#' + myCanvasId).width();
			canvasHeight = $('#' + myCanvasId).height();

			$.each([]);
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
			// * container -
			//
			// * view -
			//
			// * model -
			//
			// * itemId -
			//
			// Returns:
			//
			// The rendering object.
			//
			lensRectangle = function(container, view, model, itemId) {
				// Note: Rectangle measurements x,y start at CENTER
				var that = app.initShapeLens(container, view, model, itemId),
				item = model.getItem(itemId),
				superUpdate,
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
				$(c.node).attr('id', item.id[0]);
				
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
				superUpdate,
				c;
				
				// create the shape
				c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0] / 2, item.h[0] / 2);
				that.shape = c;
				
				// fill shape
				c.attr({
					fill: "red"
				});
				that.setOpacity();
				
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
				svg: ' > svg',
				svgwrapper: '.section-canvas'
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
		slider: {
			type: OAC.Client.StreamingVideo.Controller.sliderButton,
			selectors: {
				slider: '#slider',
				timedisplay: '.timedisplay'
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
		windowResize: {
			type: OAC.Client.StreamingVideo.Controller.WindowResize
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
		// annotations which have a time range (.ntp\_start through .ntp\_end) that fall within the time
		// range set.
		currentAnnotations: {
			dataStore: 'canvas',
			type: MITHGrid.Data.RangePager,
			leftExpressions: [ '.ntp_start' ],
			rightExpressions: [ '.ntp_end' ]
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
				ntp_start: {
					valueType: "numeric"
				},
				// - the play head position at which this annotation ceases being active/current
				ntp_end: {
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
