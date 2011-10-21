(function($, MITHGrid, OAC) {
	OAC.Client.StreamingVideo.namespace('Controller');
	OAC.Client.StreamingVideo.Controller.annotationShapeDragController = function(options) {
		that = MITHGrid.Controller.initRaphaelController("OAC.Client.StreamingVideo.Controller.annotationShapeDragController", options);
		
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
	}
}(jQuery, MITHGrid, OAC));