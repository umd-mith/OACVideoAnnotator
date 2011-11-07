(function($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');
	
	// Creating a green rectangle dashed box to act as the resize and drag
	// tool for all shapes
	OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid = function(options) {
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", options);
		options = that.options;
		that.handleSet;
		that.midDrag;
		that.svgBBox;
		that.rendering;
		that.handles = {};
		that.itemMenu;
		that.dirs = that.options.dirs ? opts.dirs:['ul','top','ur','lft','lr','btm','ll','rgt','mid'];
		
		// Create event firers for resize and drag
		that.eventResize = MITHGrid.initEventFirer(true, false);	
		that.eventDrag = MITHGrid.initEventFirer(true, false);
		
		that.applyBindings = function(binding, opts) {
			var ox, oy, factors = {}, extents, svgTarget, paper, attrs = {},
			padding = 5;
			
			// register the rendering
			that.rendering = opts.renderObj;
			
			calcFactors = function() {
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
			};
			
			drawHandles = function() {
				if(that.handleSet === undefined){
					var h, handleIds = {};
					// draw the corner and mid-point squares
					that.handleSet = paper.set();
					$.each(that.handles, function(i, o) {
						if(i === 'mid'){
							that.midDrag = paper.rect(o.x, o.y, padding, padding);
							o.id = that.midDrag.id;
							
						} else {
							h = paper.rect(o.x, o.y, padding, padding);
							o.id = h.id;
							that.handleSet.push(h);
						}
					});
					
					// make them all similar looking
					that.handleSet.attr({
						fill: 990000,
						stroke: 'black',
						cursor: 'pointer'
					});
					
					if(that.midDrag !== undefined) {
						that.midDrag.attr({
							fill: 990000,
							stroke: 'black',
							cursor: 'pointer'
						});
					}
					
					// drawing bounding box
					that.svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
					that.svgBBox.attr({
						stroke: 'green',
						'stroke-dasharray': ["--"]
					});	
					
					if(that.midDrag !== undefined) {
						var nx, ny, x, y;
						// Attaching listener to drag-only handle (that.midDrag)
						that.midDrag.drag(
							function(dx, dy) {
								// drag
								// nw = extents.width + 2 * dx * factors.x + (padding * 2);
								// nh = extents.height + 2 * dy * factors.y + (padding * 2);
								nx = attrs.x + dx;
								ny = attrs.y + dy;
								x = extents.x + dx;
								y = extents.y + dy;

								that.svgBBox.attr({
									x: nx,
									y: ny
								});
								
								calcHandles({
									x: nx,
									y: ny,
									width: attrs.width,
									height: attrs.height
								});
							},
							function(x, y, e) {
								// start
								ox = e.offsetX;
								oy = e.offsetY;

								calcFactors();
							},
							function() {
								// end
								var pos = {
									x: x,
									y: y
								};
								that.eventDrag.fire(that.rendering.id, pos);
							}
						);
					} 
					
					// Attaching drag and resize handlers
					var w, h, pos;
					that.handleSet.drag(

						function(dx, dy) {
							var nx, ny, nw, nh;
							if(factors.x == 0 && factors.y == 0) {
								nx = attrs.x + (dx - (attrs.width/2));
								ny = attrs.y + (dy - (attrs.height/2));
								that.svgBBox.attr({
									x: nx,
									y: ny
								});

								calcHandles({
									x: attrs.x,
									y: attrs.y,
									width: attrs.width,
									height: attrs.height
								});
							}
							else {
								w = extents.width + 2 * dx * factors.x;
								h = extents.height + 2 * dy * factors.y;
								nw = extents.width + 2 * dx * factors.x + (padding * 2);
								nh = extents.height + 2 * dy * factors.y + (padding * 2);
								nx = (extents.x - (padding/4)) - (nw/2);
								ny = (extents.y - (padding/4)) - (nh/2);
								that.svgBBox.attr({
									x: nx,
									y: ny,
									width:  nw,
									height: nh
								});
								calcHandles({
									x: nx,
									y: ny,
									width: nw,
									height: nh
								});
							}
						},
					    function(x, y, e) {
							ox = e.offsetX;
							oy = e.offsetY;

							calcFactors();

						},
						function() {
							console.log('resize update');
							// update 
							pos = {
								width: w,
								height: h
							};
							that.eventResize.fire(that.rendering.id, pos);
						}
					);
					
					
				} else {
					// show all the boxes and 
					// handles
					that.svgBBox.show();
					// adjust the SvgBBox to be around new
					// shape
					that.svgBBox.attr({
						x: attrs.x,
						y: attrs.y,
						width: attrs.width,
						height: attrs.height
					});
					that.handleSet.show();
					that.midDrag.show().toFront();
					if(that.itemMenu) {
						that.itemMenu.show();
						that.itemMenu.attr({
							x: (attrs.x + (attrs.width/2)),
							y: attrs.y - (attrs.height/2) - (padding *2)
						});
					}
				} 
			};
			// Draws menu that sits at the top-right corner
			// of the shape
			drawMenu = function(args) {
				if(that.itemMenu === undefined) {
					var x, y, w, h, editButton,
					deleteButton, el;
					
					x = args.x + (args.width/2);
					y = args.y - (args.height/2) - (padding * 2);
					w = padding * 4;
					h = padding * 2;
					
					editButton = {
						x: x + 2,
						y: y + 2,
						w: (w/2) - 4,
						h: h
					};
					
					deleteButton = {
						x: (editButton.x + editButton.w + 2),
						y: y + 2,
						w: (w/2) - 4,
						h: h
					};
					
					that.itemMenu = paper.set();
					el = paper.rect(x,y,w,h);
					el.attr({
						fill: '#FFFFFF',
						stroke: 000000
					});
					
					that.itemMenu.push(el);
					
					el = paper.rect(editButton.x, editButton.y, editButton.w, editButton.h);
					el.attr({
						fill: 334009,
						cursor:'pointer'
					});
					
					that.itemMenu.push(el);
					
					el = paper.rect(deleteButton.x, deleteButton.y, deleteButton.w, deleteButton.h);
					el.attr({
						fill: 334009,
						cursor: 'pointer'
					});
					
					that.itemMenu.push(el);
				}
			};
			
			calcHandles = function(args) {
				// calculate where the resize handles
				// will be located
				$.each(that.dirs, function(i, o) {
					var el, x, y;
					switch(o){
						case 'ul':
							if(that.handles.ul === undefined){
								that.handles.ul = {x: args.x, y: args.y};
							} else {
								x = args.x;
								y = args.y;
								that.handles.ul.x = x;
								that.handles.ul.y = y;
							
								el = paper.getById(that.handles.ul.id);
								
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'top':
							if(that.handles.top === undefined) {
								that.handles.top = {x: (args.x + (args.width/2)), y: args.y};
							} else {
								x =  (args.x + (args.width/2));
								y = args.y;
								that.handles.top.x = x;
								that.handles.top.y = y;
								el = paper.getById(that.handles.top.id);
								
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'ur':
							if(that.handles.ur === undefined) {
								that.handles.ur = {x: ((args.x) + (args.width - padding)), y: args.y};
							} else {
								x =  (args.x + (args.width - padding));
								y = args.y;
								that.handles.ur.x = x;
								that.handles.ur.y = y;
								el = paper.getById(that.handles.ur.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'rgt':
							if(that.handles.lft === undefined) {
								that.handles.lft = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + (args.height/2))};
							} else {
								x =  ((args.x - padding) + args.width);
								y = ((args.y - padding) + (args.height/2));
								that.handles.lft.x = x;
								that.handles.lft.y = y;
								el = paper.getById(that.handles.lft.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'lr':
							if(that.handles.lr === undefined) {
								that.handles.lr = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + args.width)};
							} else {
								x =  ((args.x - padding) + args.width);
								y = ((args.y - padding) + args.height);
								that.handles.lr.x = x;
								that.handles.lr.y = y;
								el = paper.getById(that.handles.lr.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'btm':
							if(that.handles.btm === undefined) {
								that.handles.btm = {x: (args.x + (args.width/2)), y: ((args.y - padding) + args.height)};
							} else {
								x =  (args.x + (args.width/2));
								y = ((args.y - padding) + args.height);
								that.handles.btm.x = x;
								that.handles.btm.y = y;
								el = paper.getById(that.handles.btm.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'll':
							if(that.handles.ll === undefined) {
								that.handles.ll = {x: args.x, y: ((args.y - padding) + args.height)};
							} else {
								x =  args.x;
								y = ((args.y - padding) + args.height);
								that.handles.ll.x = x;
								that.handles.ll.y = y;
								el = paper.getById(that.handles.ll.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'lft':
							if(that.handles.rgt === undefined) {
								that.handles.rgt = {x: args.x, y: (args.y + (args.height/2))};
							} else {
								x =  args.x;
								y = (args.y + (args.height/2));
								that.handles.rgt.x = x;
								that.handles.rgt.y = y;
								el = paper.getById(that.handles.rgt.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'mid':
							if(that.handles.mid === undefined) {
								that.handles.mid = {x: (args.x + (args.width/2)), y: (args.y + (args.height/2))};
							} else {
								x = (args.x + (args.width/2));
								y = (args.y + (args.height/2));
								that.handles.mid.x = x;
								that.handles.mid.y = y;
								el = paper.getById(that.handles.mid.id);
								el.attr({
									x: x,
									y: y
								});
							}
					}
				});
			};
			
			svgTarget = that.rendering.shape;
			// Grabbing the paper element from this shape
			paper = svgTarget.paper;
			
			calcFactors();
			drawHandles();
			drawMenu(extents);
		};
		
		// Function to call in order to "de-activate" the edit box
		// (i.e. make it hidden)
		that.deActivateEditBox = function() {
			that.handleSet.hide();
			
			that.svgBBox.hide();
			that.midDrag.hide();
		};
		
		return that;
	};
	
	
	
	OAC.Client.StreamingVideo.Controller.annoActiveController = function(options) {
		var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.annoActiveController", options);
		options = that.options;
		
		that.applyBindings = function(binding, opts) {
			var annoEl, bodyContent, allAnnos, deleteButton;
			
			annoEl = binding.locate('annotation');
			
			bodyContent = binding.locate('bodycontent');
			allAnnos = binding.locate('annotations');
			textArea = binding.locate('textarea');
			editArea = binding.locate('editarea');
			editButton = binding.locate('editbutton');
			updateButton = binding.locate('updatebutton');
			deleteButton = binding.locate('deletebutton');
			

			// Events 
			binding.events = {};
			binding.events.eventClick = MITHGrid.initEventFirer(true, false);
			binding.events.eventDelete = MITHGrid.initEventFirer(true, false);
			binding.events.eventUpdate = MITHGrid.initEventFirer(true, false);
			binding.renderings = {};
			binding.active = false;
			// Event registration function - ties elements to
			//  event handlers above
			binding.registerRendering = function(rendering) {
				renderings[rendering.id] = rendering;
				
				if(rendering.clickEventHandle !== undefined) {
					binding.events.eventClick.addListener(rendering.clickEventHandle);
				} 
				if(rendering.deleteEventHandle !== undefined) {
					
				}
			}; 
			
			binding.removeRendering = function(rendering) {
				var tmp = {};
				$.each(binding.renderings, function(i,o) {
					if(i !== rendering.id) {
						tmp[i] = o;
					} 
				});
				binding.renderings = $.extend(true, {}, tmp);
			};
			
			editStart = function() {
				$(editArea).show();
				$(bodyContent).hide();
				binding.active = true;
				binding.events.eventClick.fire(opts.itemId);
			};
			
			editEnd = function() {
				$(editArea).hide();
				$(bodyContent).show();
				binding.active = false;
			};
			
			editUpdate = function(e) {
				e.preventDefault();
				
				var data = $(textArea).val();
				binding.events.eventUpdate.fire(opts.itemId, data);
				editEnd();
			};
			
			$(editButton).live('click', function(e) {
				e.preventDefault();
				if(binding.active) {
					editEnd();
				} else {
					editStart();
				}
			});
			
			$(updateButton).live('click', editUpdate);
			$(annoEl).live('click', function(e) {
				binding.events.eventClick.fire(opts.itemId);
			});
			
		};
		return that;
	};	
	
	OAC.Client.StreamingVideo.Controller.annotationShapeResizeController = function(options) {
		var cursors,
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationShapeDragController", options);
		options = that.options;
		
		cursors = [
			'sw', 'w', 'nw',
			's',  '',  'n',
			'se', 'e', 'ne'
		];
		
		that.applyBindings = function(binding, opts) {
			var ox, oy, svgEl, bWidth, bHEight, extents, factors = {}, calcFactors, setCursorType, resetCursorType;
			
			calcFactors = function() {
				var px, py;
				extents = opts.calculate.extents();
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
			};
			
			setCursorType = function() {
				var cursorIndex = (factors.x+1)*3 + (1 - factors.y),
				cursor = cursors[cursorIndex] + '-resize';
				svgEl.attr('cursor', cursor);
			};
			
			resetCursorType = function() {
				svgEl.attr('cursor', 'auto');
			};
			
		
			
			svgEl = binding.locate('raphael');
			svgEl.drag(
				function(dx, dy) {
					if(factors.x == 0 && factors.y == 0) {
						svgEl.attr({
							x: extents.x + dx,
							y: extents.y + dy
						});
						
						// svgEl is ahead of the actual 
						// annotation shape
						opts.model.updateItems([{
							id: opts.itemId,
							x: extents.x + dx,
							y: extents.y + dy
						}]);
					}
					else {
						svgEl.attr({
							x: extents.x - ((bWidth + 2 * dx * factors.x)/2),
							y: extents.y - ((bHeight + 2 * dy * factors.y)/2),
							width:  bWidth + 2 * dx * factors.x,
							height: bHeight + 2 * dy * factors.y
						});
						
						opts.model.updateItems([{
							id: opts.itemId,
							w: extents.width + 2 * dx * factors.x,
							h: extents.height + 2 * dy * factors.y
						}]);
					}
				},
			    function(x, y, e) {
					ox = e.offsetX;
					oy = e.offsetY;
					bWidth = svgEl.attr('width');
					bHeight = svgEl.attr('height');
					calcFactors();
					setCursorType();
				},
				function() {
					resetCursorType();
				}
			);
		};
		
		return that;
	};
	
	// Gets passed a function in options that sets the Active Shape and notifies 
	// the presentation
	OAC.Client.StreamingVideo.Controller.canvasController = function(options) {
		var that = MITHGrid.Controller.initController("OAC.Client.StreamingVideo.Controller.canvasClickController", options);
		that.options = options;
		that.editBoxController = OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid({});
		
		// Create the object passed back to the Presentation
		that.applyBindings = function(binding, opts) {
			var ox, oy, extents, activeId, container = binding.locate('paper'),
			closeEnough = opts.closeEnough, dx, dy, 
			x, y, w, h, paper = opts.paper,
			offset = $(container).offset();
			
			
			// Creating events that the renderings will bind to
			binding.event = {};
			binding.event.eventClick = MITHGrid.initEventFirer(true, false);
			
			binding.renderings = {};
			
			binding.curRendering;
			
			
			// Add to events 
			binding.registerRendering = function(rendering) {
				binding.renderings[rendering.id] = rendering;
				if(rendering.eventClickHandle !== undefined){
					binding.event.eventClick.addListener(rendering.eventClickHandle);
				}
				if(rendering.shapeIsActive !== undefined) {
					// register the rendering shape click event
					rendering.shapeIsActive.addListener(attachDragResize);
				}
			};
			
			binding.removeRendering = function(rendering) {
				var tmp = {}, el;
				if(rendering.eventClickHandle !== undefined){
					binding.event.eventClick.removeListener(rendering.eventClickHandle);
				}
				if(rendering.eventResizeHandle !== undefined) {
					that.editBoxController.eventResize.removeListener(rendering.eventResizeHandle);
				}
				if(rendering.eventMoveHandle !== undefined) {
					that.editBoxController.eventDrag.removeListener(rendering.eventMoveHandle);
				}
				$.each(binding.renderings, function(i,o) {
					if(i !== rendering.id) {
						tmp[i] = o;
					} 
				});
				binding.renderings = $.extend(true, {}, tmp);
			};
			
			attachDragResize = function(id) {
				
				if((binding.curRendering !== undefined) && (id === binding.curRendering.id)) {
					return;
				}
				var o = binding.renderings[id];
				if(o === undefined) {
					// de-activate rendering and all other listeners
					binding.event.eventClick.fire('');
					// hide the editBox
					that.editBoxController.deActivateEditBox();
					binding.curRendering = undefined;
					return false;
				}
				that.editBoxController.bind(o.shape, {
					renderObj: o
				});
				
				// Attach necessary event firers
				if(o.eventResizeHandle !== undefined) {
					that.editBoxController.eventResize.addListener(o.eventResizeHandle);
				}
				if(o.eventMoveHandle !== undefined) {
					that.editBoxController.eventDrag.addListener(o.eventMoveHandle);
				}
				
				binding.curRendering = o;
			};
			
		
			$(container).bind('mousedown', function(e) {
				activeId = '';
				ox = Math.abs(e.pageX - offset.left);
				oy = Math.abs(e.pageY - offset.top);
				$.each(binding.renderings, function(i, o) {
					extents = o.getExtents();
					dx = Math.abs(ox - extents.x);
					dy = Math.abs(oy - extents.y);
					if(dx <= extents.width) {
						if(dy <= extents.height) {
							activeId = o.id;
							if((binding.curRendering === undefined) || (o.id !== binding.curRendering.id)) {
								
								binding.event.eventClick.fire(o.id);
								attachDragResize(o.id);
							}
							// stop running loop
							return false;
						}
					}
				});

				if((activeId.length == 0) && (binding.curRendering !== undefined)) {
					
					// No shapes selected - de-activate current rendering and all other possible renderings
					if(binding.curRendering.eventResizeHandle !== undefined) {
						that.editBoxController.eventResize.removeListener(binding.curRendering.eventResizeHandle);
					}
					if(binding.curRendering.eventMoveHandle !== undefined) {
						that.editBoxController.eventDrag.removeListener(binding.curRendering.eventMoveHandle);
					}
					
					// de-activate rendering and all other listeners
					binding.event.eventClick.fire('');
					
					// hide the editBox
					that.editBoxController.deActivateEditBox();
					binding.curRendering = undefined;
				}				
			});
			
		};
		
		return that;
	};
	
}(jQuery, MITHGrid, OAC));