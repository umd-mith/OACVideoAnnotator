(function($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');
	OAC.Client.StreamingVideo.Controller.annotationShapeDragController = function(options) {
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationShapeDragController", options);
		options = that.options;
		
		that.applyBindings = function(binding, opts) {
			var ox, oy, svgEl;
			
			svgEl = binding.locate('raphael');
			svgEl.drag(
				function(dx, dy) {			
					opts.model.updateItems([{
						id: opts.itemId,
						x: ox + dx,
						y: oy + dy
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
			var ox, oy, svgEl, extents, factors = {}, calcFactors, setCursorType, resetCursorType;
			
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
						opts.model.updateItems([{
							id: opts.itemId,
							x: extents.x + dx,
							y: extents.y + dy
						}]);
					}
					else {
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