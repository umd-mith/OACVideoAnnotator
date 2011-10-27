(function($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');
	
	// Creating a green rectangle dashed box to act as the resize and drag
	// tool for all shapes
	OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid = function(options) {
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationEditSelectionGrid", options);
		options = that.options;
		that.svgBBox;
		
		that.applyBindings = function(binding, opts) {
			var ox, oy, factors = {}, extents, svgTarget, paper, attrs = {},
			padding = 5, handles = {}, handleSet, 
			dirs = (opts.dirs)?opts.dirs:['ul','top','ur','lft','lr','btm','ll','rgt'];
			
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
				if(handleSet === undefined){
					var h, handleIds = {};
					// draw the corner and mid-point squares
					handleSet = paper.set();
					$.each(handles, function(i, o) {
						h = paper.rect(o.x, o.y, padding, padding);
						o.id = h.id;
						handleSet.push(h);
					});
					
					// make them all similar looking
					handleSet.attr({
						fill: 990000,
						stroke: 'black',
						cursor: 'pointer'
					});
					// drawing bounding box
				
					that.svgBBox = paper.rect(attrs.x, attrs.y, attrs.width, attrs.height);
					that.svgBBox.attr({
						stroke: 'green',
						'stroke-dasharray': ["--"]
					});	
					// handleSet.push(that.svgBBox);
					
				} 
			};
			
			calcHandles = function(args) {
				// calculate where the resize handles
				// will be located
				$.each(dirs, function(i, o) {
					var el, x, y;
					switch(o){
						case 'ul':
							if(handles.ul === undefined){
								handles.ul = {x: args.x, y: args.y};
							} else {
								x = args.x;
								y = args.y;
								handles.ul.x = x;
								handles.ul.y = y;
								
								el = paper.getById(handles.ul.id);
								
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'top':
							if(handles.top === undefined) {
								handles.top = {x: (args.x + (args.width/2)), y: args.y};
							} else {
								x =  (args.x + (args.width/2));
								y = args.y;
								handles.top.x = x;
								handles.top.y = y;
								el = paper.getById(handles.top.id);
								
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'ur':
							if(handles.ur === undefined) {
								handles.ur = {x: ((args.x) + (args.width - padding)), y: args.y};
							} else {
								x =  (args.x + (args.width - padding));
								y = args.y;
								handles.ur.x = x;
								handles.ur.y = y;
								el = paper.getById(handles.ur.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'rgt':
							if(handles.lft === undefined) {
								handles.lft = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + (args.height/2))};
							} else {
								x =  ((args.x - padding) + args.width);
								y = ((args.y - padding) + (args.height/2));
								handles.lft.x = x;
								handles.lft.y = y;
								el = paper.getById(handles.lft.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'lr':
							if(handles.lr === undefined) {
								handles.lr = {x: ((args.x - padding) + args.width), y: ((args.y - padding) + args.width)};
							} else {
								x =  ((args.x - padding) + args.width);
								y = ((args.y - padding) + args.height);
								handles.lr.x = x;
								handles.lr.y = y;
								el = paper.getById(handles.lr.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'btm':
							if(handles.btm === undefined) {
								handles.btm = {x: (args.x + (args.width/2)), y: ((args.y - padding) + args.height)};
							} else {
								x =  (args.x + (args.width/2));
								y = ((args.y - padding) + args.height);
								handles.btm.x = x;
								handles.btm.y = y;
								el = paper.getById(handles.btm.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'll':
							if(handles.ll === undefined) {
								handles.ll = {x: args.x, y: ((args.y - padding) + args.height)};
							} else {
								x =  args.x;
								y = ((args.y - padding) + args.height);
								handles.ll.x = x;
								handles.ll.y = y;
								el = paper.getById(handles.ll.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
						case 'lft':
							if(handles.rgt === undefined) {
								handles.rgt = {x: args.x, y: (args.y + (args.height/2))};
							} else {
								x =  args.x;
								y = (args.y + (args.height/2));
								handles.rgt.x = x;
								handles.rgt.y = y;
								el = paper.getById(handles.rgt.id);
								el.attr({
									x: x,
									y: y
								});
							}
							break;
					}
				});
			};
			
			svgTarget = binding.locate('raphael');
			// Grabbing the paper element from this shape
			paper = svgTarget.paper;
			
			calcFactors();
			drawHandles();
			
			// fire event
			$("body:first").trigger("svgElementClicked", [opts.itemId]);
			
			// Attaching drag and resize handlers
			handleSet.drag(
				function(dx, dy) {
					var nx, ny, nw, nh;
					if(factors.x == 0 && factors.y == 0) {
						nx = attrs.x + (dx - (attrs.width/2));
						ny = attrs.y + (dy - (attrs.height/2));
						that.svgBBox.attr({
							x: nx,
							y:  ny
						});
						
						calcHandles({
							x: attrs.x,
							y: attrs.y,
							width: attrs.width,
							height: attrs.height
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
						opts.model.updateItems([{
							id: opts.itemId,
							x: extents.x,
							y: extents.y,
							w: extents.width + 2 * dx * factors.x,
							h: extents.height + 2 * dy * factors.y
						}]);
					}
				},
			    function(x, y, e) {
					ox = e.offsetX;
					oy = e.offsetY;
				
					calcFactors();
				
					// setCursorType();
				},
				function() {
					
					// resetCursorType();
				}
			);
			
		};
		
		
		
		return that;
	};
	
	OAC.Client.StreamingVideo.Controller.annotationShapeDragController = function(options) {
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationShapeDragController", options);
		options = that.options;
		
		that.applyBindings = function(binding, opts) {
			var ox, oy, svgEl;
			
			svgEl = binding.locate('raphael');
			svgEl.drag(
				function(dx, dy) {	
					var ddx = (dx - 3), ddy = (dy - 3);
					
					svgEl.attr({
						x: ox + dx,
						y: ox + dy
					});
					// SvgEl stays ahead of the actual shape
					opts.model.updateItems([{
						id: opts.itemId,
						x: ox + ddx,
						y: oy + ddy
					}]);
				},
				function() {
					ox = parseInt(svgEl.attr(opts.x), 10);
					oy = parseInt(svgEl.attr(opts.y), 10);
				},
				function() {
					
				}
			);
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
			deleteButton = binding.locate('deletebutton');

			$("body").bind("svgElementClicked", function(e, id) {
				
				if(opts.itemId === id) {
					// $(allAnnos).removeClass('selected');
					annoEl.addClass('selected');
				}
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
}(jQuery, MITHGrid, OAC));