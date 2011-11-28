(function ($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.keyBoardListener", {
	bind: {
		events: {
			onDelete: ["preventable", "unicast"]
		}
	}
});
/*
* Keyboard Listener Controller
*
* Keyboard listener - listens to keydown events on the document
* level (not sure if it will work on lower DOM elements)
*/
OAC.Client.StreamingVideo.Controller.keyBoardListener = function (options) {
	var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.keyBoardListener", options);
	options = that.options;

	that.applyBindings = function (binding, opts) {
		var doc = binding.locate('doc'),
		activeId,
		setActiveId = function (id) {
			activeId = id;
		};

		options.application.events.onActiveAnnotationChange.addListener(setActiveId);

		$(doc).keydown(function (e) {
			if(activeId !== undefined || activeId !== ''){
				// If backspace or delete is pressed,
				// then it is interpreted as a
				// delete call
				if(e.keyCode === 8 || e.keyCode === 46) {
					// delete item
					binding.events.onDelete.fire(activeId);
					activeId = '';
				}
			}

		});
	};

	return that;
};

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", {
	events: {
		onResize: "preventable",
		onDrag: "preventable",
		onEdit: "preventable",
		onDelete: "preventable"
	}
});
/*
* Annotation Selection Grid
*
* Attaches to an SVG lens and creates a green rectangle dashed box to
* act as the resize and drag tool. Only edits the SVG data - no annotation
* bodyContent data.
*/
OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid = function (options) {
	var that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", options),
	    handleSet = {}, midDrag = {}, dirs = [], svgBBox = {}, itemMenu = {};
	options = that.options;
	that.handles = {};
	that.rendering = {};
	that.deleteButton = {}; // **
	that.editButton = {}; // ** - and change live() to on()
	that.menuContainer = {}; // **
	dirs = that.options.dirs || ['ul','top','ur','lft','lr','btm','ll','rgt','mid'];

/*
* Bounding box is created once in memory - it should be bound to the
* canvas/paper object or something that contains more than 1 shape.
*/
that.applyBindings = function (binding, opts) {
	var ox, oy, factors = {}, extents, svgTarget, paper = opts.paper,
	attrs = {},
	padding = 5,
	calcFactors, calcHandles, drawMenu, itemDeleted, handleIds = {}, drawHandles, 
	handleAttrs = {}, shapeAttrs = {}, menuAttrs = {}, cursor, 
	dAttrs = {}, eAttrs = {}, el;

	// Function for applying a new shape to the bounding box
	binding.attachRendering = function (rendering) {

		// register the rendering
		that.rendering = rendering;
		svgTarget = that.rendering.shape;

		calcFactors();
		drawHandles();

		if(that.rendering.eventResizeHandle !== undefined) {
			that.events.onResize.addListener(that.rendering.eventResizeHandle);
		}
		if(that.rendering.eventMoveHandle !== undefined) {
			that.events.onDrag.addListener(that.rendering.eventMoveHandle);
		}
	};

	// Function to call in order to "de-activate" the edit box
	// (i.e. make it hidden)
	binding.detachRendering = function () {

		if(that.rendering.eventResizeHandle !== undefined) {
			that.events.onResize.removeListener(that.rendering.eventResizeHandle);
		}
		if(that.rendering.eventMoveHandle !== undefined) {
			that.events.onDrag.removeListener(that.rendering.eventMoveHandle);
		}

		handleSet.hide();

		svgBBox.hide();
		midDrag.hide();
		if(itemMenu) {
			itemMenu.hide();
		}
	};

	calcFactors = function () {
		var px, py;
		extents = that.rendering.getExtents();
		// extents: x, y, width, height
		px = (4 * (ox - extents.x) / extents.width) + 2;
		py = (4 * (oy - extents.y) / extents.height) + 2;
		if(px < 1) {
			factors.x = -1;
		}
		else if(px < 3) {
			factors.x = 0;
		}
		else {
			factors.x = 1;
		}
		if(py < 1) {
			factors.y = -1;
		}
		else if(py < 3) {
			factors.y = 0;
		}
		else {
			factors.y = 1;
		}

		// create offset factors for
		// bounding box
		// calculate width - height to be larger
		// than shape
		attrs.width = extents.width + (2 * padding);
		attrs.height = extents.height + (2 * padding);
		attrs.x = (extents.x - (padding/8)) - (attrs.width/2);
		attrs.y = (extents.y - (padding/8)) - (attrs.height/2);
		calcHandles(attrs);
		if(itemMenu) {
			drawMenu(attrs);
		}
	};

	// Draws the handles defined in dirs as SVG
	// rectangles and draws the SVG bounding box
	drawHandles = function () {
		if($.isEmptyObject(handleSet)){
			
			// draw the corner and mid-point squares
			handleSet = paper.set();
			$.each(that.handles, function (i, o) {
				var h;
				if(i === 'mid'){
					midDrag = paper.rect(o.x, o.y, padding, padding);
					o.id = midDrag.id;

				} else {
					h = paper.rect(o.x, o.y, padding, padding);
					o.id = h.id;

					h.attr({cursor: o.cursor});
					handleSet.push(h);
				}
			});

			// make them all similar looking
			handleSet.attr({
				fill: 990000,
				stroke: 'black'
			});

			if(!($.isEmptyObject(midDrag))) {
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

			if(!($.isEmptyObject(midDrag))) {
				
				// Attaching listener to drag-only handle (midDrag)
				midDrag.drag(
					function (dx, dy) {
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
						if(itemMenu) {
							drawMenu({
								x: handleAttrs.nx,
								y: handleAttrs.ny,
								width: attrs.width,
								height: attrs.height
							});
						}
					},
					function (x, y, e) {
						// start
						ox = e.offsetX;
						oy = e.offsetY;

						calcFactors();
						that.rendering.shape.attr({cursor: 'move'});
					},
					function () {
						// end
						var pos = {
							x: shapeAttrs.x,
							y: shapeAttrs.y
						};
					
						that.events.onDrag.fire(that.rendering.id, pos);
						that.rendering.shape.attr({cursor: 'default'});
					}
				);
			}

			// Attaching drag and resize handlers
			
			handleSet.drag(
				function (dx, dy) {
					// dragging here means that as element is dragged
					// the factorial determines in which direction the
					// shape is pulled
					shapeAttrs.w = extents.width + 2 * dx * factors.x;
					shapeAttrs.h = extents.height + 2 * dy * factors.y;
					handleAttrs.nw = extents.width + 2 * dx * factors.x + (padding * 2);
					handleAttrs.nh = extents.height + 2 * dy * factors.y + (padding * 2);
					handleAttrs.nx = (extents.x - (padding/4)) - (handleAttrs.nw/2);
					handleAttrs.ny = (extents.y - (padding/4)) - (handleAttrs.nh/2);
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
					if(itemMenu) {
						drawMenu({
							x: handleAttrs.nx,
							y: handleAttrs.ny,
							width: handleAttrs.nw,
							height: handleAttrs.nh
						});
					}
				},
				function (x, y, e) {
					ox = e.offsetX;
					oy = e.offsetY;

					calcFactors();

				},
				function () {
					// update
					var pos = {
						width: shapeAttrs.w,
						height: shapeAttrs.h
					};
					that.events.onResize.fire(that.rendering.id, pos);
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
			if(itemMenu) {
				itemMenu.show();
				drawMenu(attrs);
			}
		}
	};

	// Draws menu that sits at the top-right corner
	// of the shape
	drawMenu = function (args) {
		if($.isEmptyObject(itemMenu)) {
			
			menuAttrs.x = args.x + (args.width);
			menuAttrs.y = args.y - (padding * 4) - 2;
			menuAttrs.w = 100;
			menuAttrs.h = 20;

			eAttrs = {
				x: menuAttrs.x + 2,
				y: menuAttrs.y + 2,
				w: (menuAttrs.w/2) - 4,
				h: menuAttrs.h - (menuAttrs.h/8)
			};

			dAttrs = {
				x: (eAttrs.x + eAttrs.w + 2),
				y: menuAttrs.y + 2,
				w: (menuAttrs.w/2) - 4,
				h: menuAttrs.h - (menuAttrs.h/8)
			};

			itemMenu = paper.set();
			that.menuContainer = paper.rect(menuAttrs.x,menuAttrs.y,menuAttrs.w,menuAttrs.h);
			that.menuContainer.attr({
				fill: '#FFFFFF',
				stroke: '#000'
			});

			itemMenu.push(that.menuContainer);

			that.editButton = paper.rect(eAttrs.x, eAttrs.y, eAttrs.w, eAttrs.h);
			that.editButton.attr({
				fill: 334009,
				cursor: 'pointer'
			});

			itemMenu.push(that.editButton);

			that.deleteButton = paper.rect(dAttrs.x, dAttrs.y, dAttrs.w, dAttrs.h);
			that.deleteButton.attr({
				fill: 334009,
				cursor: 'pointer'
			});

			itemMenu.push(that.deleteButton);
			// attach event firers
			that.editButton.mousedown(function () {
				if(that.rendering !== undefined){
					that.events.onEdit.fire(that.rendering.id);
				}
			});

			that.deleteButton.mousedown(function () {
				if(that.rendering !== undefined) {
					that.events.onDelete.fire(that.rendering.id);

					itemDeleted();
				}
			});

		} else {
		

			menuAttrs.x = args.x + (args.width);
			menuAttrs.y = args.y - (padding * 4) - 2;

			eAttrs = {
				x: (menuAttrs.x + 2),
				y: (menuAttrs.y + 2)
			};

			dAttrs = {
				x: (eAttrs.x + that.editButton.attr('width') + 2),
				y: menuAttrs.y + 2
			};
			that.menuContainer.attr({x: menuAttrs.x, y: menuAttrs.y});
			that.editButton.attr(eAttrs);
			that.deleteButton.attr(dAttrs);
		}
	};

	itemDeleted = function () {
		// set rendering to undefined
		that.rendering = undefined;

		itemMenu.hide();
		svgBBox.hide();
		handleSet.hide();
		midDrag.hide();
	};

	calcHandles = function (args) {
		// calculate where the resize handles
		// will be located
		$.each(dirs, function (i, o) {
			
			switch(o){
				case 'ul':
					if(that.handles.ul === undefined){
						that.handles.ul = {x: args.x, y: args.y, cursor: 'nw-resize'};
					} else {
					
						that.handles.ul.x = args.x;
						that.handles.ul.y = args.y;

						el = paper.getById(that.handles.ul.id);

						el.attr({
							x: that.handles.ul.x,
							y: that.handles.ul.y
						});
					}
				break;
				case 'top':
					if(that.handles.top === undefined) {
						that.handles.top = {x: (args.x + (args.width/2)), y: args.y, cursor: 'n-resize'};
					} else {
						
						that.handles.top.x = (args.x + (args.width/2));
						that.handles.top.y = args.y;
						el = paper.getById(that.handles.top.id);

						el.attr({
							x: that.handles.top.x,
							y: that.handles.top.y
						});
					}
				break;
				case 'ur':
					if(that.handles.ur === undefined) {
						that.handles.ur = {x: ((args.x) + (args.width - padding)), y: args.y, cursor: 'ne-resize'};
					} else {
						that.handles.ur.x = (args.x + (args.width - padding));
						that.handles.ur.y = args.y;
						
						el = paper.getById(that.handles.ur.id);
						el.attr({
							x: that.handles.ur.x,
							y: that.handles.ur.y
						});
					}
				break;
				case 'rgt':
					if(that.handles.rgt === undefined) {
						that.handles.rgt = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + (args.height/2)), cursor: 'e-resize'};
					} else {
						
						that.handles.rgt.x = ((args.x - padding) + args.width);
						that.handles.rgt.y = ((args.y - padding) + (args.height/2));
						el = paper.getById(that.handles.rgt.id);
						el.attr({
							x: that.handles.rgt.x,
							y: that.handles.rgt.y
						});
					}
				break;
				case 'lr':
					if(that.handles.lr === undefined) {
						that.handles.lr = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + args.width), cursor: 'se-resize'};
					} else {
						that.handles.lr.x = ((args.x - padding) + args.width);
						that.handles.lr.y = ((args.y - padding) + args.height);
						
						el = paper.getById(that.handles.lr.id);
						el.attr({
							x: that.handles.lr.x,
							y: that.handles.lr.y
						});
					}
					break;
				case 'btm':
					if(that.handles.btm === undefined) {
						that.handles.btm = {x: (args.x + (args.width/2)), y: ((args.y - padding) + args.height), cursor: 's-resize'};
					} else {
						that.handles.btm.x = (args.x + (args.width/2));
						that.handles.btm.y = ((args.y - padding) + args.height);
						 
						el = paper.getById(that.handles.btm.id);
						el.attr({
							x: that.handles.btm.x,
							y: that.handles.btm.y
						});
					}
					break;
				case 'll':
					if(that.handles.ll === undefined) {
						that.handles.ll = {x: args.x, y: ((args.y - padding) + args.height), cursor: 'sw-resize'};
					} else {
						that.handles.ll.x = args.x;
						that.handles.ll.y = ((args.y - padding) + args.height);
						
						el = paper.getById(that.handles.ll.id);
						el.attr({
							x: that.handles.ll.x,
							y: that.handles.ll.y
						});
					}
					break;
				case 'lft':
					if(that.handles.lft === undefined) {
						that.handles.lft = {x: args.x, y: (args.y + (args.height/2)), cursor: 'w-resize'};
					} else {
						that.handles.lft.x = args.x;
						that.handles.lft.y = (args.y + (args.height/2));
						
						el = paper.getById(that.handles.lft.id);
						el.attr({
							x: that.handles.lft.x,
							y: that.handles.lft.y
						});
					}
					break;
				case 'mid':
					if(that.handles.mid === undefined) {
						that.handles.mid = {x: (args.x + (args.width/2)), y: (args.y + (args.height/2)), cursor: 'pointer'};
					} else {
						that.handles.mid.x = (args.x + (args.width/2));
						that.handles.mid.y = (args.y + (args.height/2));
						
						el = paper.getById(that.handles.mid.id);
						el.attr({
							x: that.handles.mid.x,
							y: that.handles.mid.y
						});
					}
					break;
			}
		});
	};
};

return that;
};

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.annoActiveController", {
	bind: {
		events: {
			onClick: "preventable",
			onDelete: "preventable",
			onUpdate: "preventable"
		}
	}
});

/*
* Annotation Active Controller
* Handles HTML annotation lens
*/
OAC.Client.StreamingVideo.Controller.annoActiveController = function (options) {
	var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.annoActiveController", options);
	options = that.options;

	that.applyBindings = function (binding, opts) {
		var annoEl, bodyContent, allAnnos, deleteButton, editArea, textArea, editButton, updateButton,
		    editStart, editEnd, editUpdate;

		annoEl = binding.locate('annotation');

		bodyContent = binding.locate('body');
		allAnnos = binding.locate('annotations');
		textArea = binding.locate('textarea');
		editArea = binding.locate('editarea');
		editButton = binding.locate('editbutton');
		updateButton = binding.locate('updatebutton');
		deleteButton = binding.locate('deletebutton');

		binding.renderings = {};
		binding.active = false;

		// Event registration function - ties elements to
		// event handlers above
		

		editStart = function () {
			$(editArea).show();
			$(bodyContent).hide();
			binding.active = true;
			binding.events.onClick.fire(opts.itemId);
		};

		editEnd = function () {
			$(editArea).hide();
			$(bodyContent).show();
			binding.active = false;
		};

		editUpdate = function (e) {
			e.preventDefault();

			var data = $(textArea).val();
			binding.events.onUpdate.fire(opts.itemId, data);
			editEnd();
		};
/*
		$(editButton).bind('click', function (e) {
			e.preventDefault();
			if(binding.active) {
				editEnd();
			} else {
				editStart();
			}
		});
		*/
		$(bodyContent).bind('dblclick', function(e) {
			e.preventDefault();
			if(binding.active) {
				editEnd();
			} else {
				editStart();
			}
		});

	//	$(updateButton).bind('click', editUpdate);
		$(annoEl).bind('click', function (e) {
		
			// binding.events.onClick.fire(opts.itemId);
			options.application.setActiveAnnotation(opts.itemId);
		});
		
		options.application.events.onActiveAnnotationChange.addListener(function(id) {
			if(id !== opts.id && binding.active) {
				editUpdate({preventDefault: function(){}});
				editEnd();
			}
		});

	};
	return that;
};

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.canvasClickController", {
	bind: {
		events: {
			onClick: "preventable"
		}
	}
});
/*
* Canvas Controller
* Listens for all clicks on the canvas and connects shapes with the
* Edit controller above
*/
OAC.Client.StreamingVideo.Controller.canvasController = function (options) {
	var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.canvasClickController", options);
	options = that.options;

	// Create the object passed back to the Presentation
	that.applyBindings = function (binding, opts) {
		var ox, oy, extents, activeId, container = binding.locate('svg'),
		closeEnough = opts.closeEnough, dx, dy,
		x, y, w, h, paper = opts.paper,
		offset = $(container).offset(),
		attachDragResize = function (id) {
			
			if((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
				return;
			}
			var o = binding.renderings[id];
			if(o === undefined) {
				// de-activate rendering and all other listeners
				binding.events.onClick.fire(undefined);
				// hide the editBox
				// editBoxController.deActivateEditBox();
				binding.curRendering = undefined;
				return false;
			}

			binding.curRendering = o;
			
		},
		detachDragResize = function (id) {
			if((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
				return;
			}
			var o = binding.renderings[id];
		};
		
		options.application.events.onActiveAnnotationChange.addListener(attachDragResize);

		binding.renderings = {};

		binding.curRendering = undefined;


		// Add to events
		binding.registerRendering = function (rendering) {
			binding.renderings[rendering.id] = rendering;
			
		};

		binding.removeRendering = function (rendering) {
			var tmp = {}, el;
			$.each(binding.renderings, function (i,o) {
				if(i !== rendering.id) {
					tmp[i] = o;
				}
			});
			binding.renderings = $.extend(true, {}, tmp);
		};

		$(container).bind('mousedown', function (e) {
			activeId = '';
			offset = $(container).offset();
			
			ox = Math.abs(e.pageX - offset.left);
			oy = Math.abs(e.pageY - offset.top);
			if(binding.curRendering !== undefined) {
				extents = binding.curRendering.getExtents();
				dx = Math.abs(ox - extents.x);
				dy = Math.abs(oy - extents.y);
				if(dx <= extents.width/2+3 && dy <= extents.height/2+3) {
					// nothing has changed
					return;
				}
			}
			$.each(binding.renderings, function (i, o) {
				extents = o.getExtents();
			
				dx = Math.abs(ox - extents.x);
				dy = Math.abs(oy - extents.y);
				// the '3' is for the drag boxes around the object
				if(dx <= extents.width/2+3 && dy <= extents.height/2+3) {
					activeId = o.id;
					if((binding.curRendering === undefined) || (o.id !== binding.curRendering.id)) {
						binding.curRendering = o;
						options.application.setActiveAnnotation(o.id);
					}
					// stop running loop
					return false;
				}
			});
			if((activeId.length === 0) && (binding.curRendering !== undefined)) {

				// No shapes selected - de-activate current rendering and all other possible renderings
			
				options.application.setActiveAnnotation(undefined);
					
				binding.curRendering = undefined;
			}
		});
		
	};

	return that;
};

} (jQuery, MITHGrid, OAC));
