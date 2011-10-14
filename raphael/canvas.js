(function($, MITHGrid) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/
	
	// Set the namespace for the Canvas application
	MITHGrid.Application.namespace("Canvas");
	MITHGrid.Application.Canvas.initApp = function(container, options) {
	
		var that = MITHGrid.Application.initApp("MITHGrid.Application.Canvas", container, $.extend(true, {}, options, {
			dataViews: {
				// view for the space in which data from shapes
				// is drawn
				drawspace: {
					dataStore: 'canvas',
					types: ["shape"],
					label: 'drawspace'
				}
			},
			viewSetup: '<h3>Canvas Area</h3><div id="canvasSVG"></div><div id="testdone"></div>'+
			'<button id="loadrect">Load SVG Shape</button><button id="updaterect">Update Shape (Move it)</button>'+
			'<button id="deleterect">Delete the Shape</button>',
			presentations: {
				raphsvg: {
					type: MITHGrid.Presentation.RaphSVG,
					container: "#canvasSVG",
					dataView: 'drawspace',
					lenses: {
						shape: function(container, view, model, itemId) {
							var that = {},
							item = model.getItem(itemId), c, ox, oy,
							// Set up drag() callback functions
			               start = function() {
			                    ox = c.attr("x");
			                    oy = c.attr("y");
			                },
			                move = function(dx, dy) {
			                    var targets = {};
								// This is where we update the shape 
								// object
			                    model.updateItems([{
			                        id: itemId,
			                        posInfo: {
										x: dx + ox,
										y: dy + oy,
										w: c.attr('width'),
										h: c.attr('height')
									}
			                    }]);
			                },
			                up = function() {

			                };
							
							$("#testdone").append("<p>Raphael Object in data store:<br/> "+JSON.stringify(item)+"</p>");
							
							// attach the svg element to the paper object
							if(item.shapeType[0] === 'rect') {
								// only creating rectangles for right now
								// Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG 
								c = view.canvas.rect(item.x, item.y, item.w, item.h);
								// fill and set opacity
								c.attr({
									fill: "red",
									opacity: 1
								});
							}
						
							
							that.update = function(item) {
								
								// receiving the Object passed through
								// model.updateItems in move()
								if(item.posInfo !== undefined){
									c.attr({
										x: item.x,
										y: item.y
									});
								} else {
									c.remove();
								}
								// Raphael object is updated
								$("#testdone > p").empty().html("Raphael Object in data store:<br/> "+JSON.stringify(item));
							};
							
							that.remove = function(item) {
								// getting the removeItems callback
								c.remove();
							};
							
							// initiate the drag feature (RaphaelJS)
							c.drag(move, start, up);
							
							return that;
						}
					},
					cWidth: options.width,
					cHeight: options.height
				}
			}
			
		})
		);
		
		that.ready(function() {
			var initX = 110, initY = 23;
			$("#loadrect").click(function(e) {
				e.preventDefault();
				
				// create a shape object
				that.dataStore.canvas.loadItems([{
					id: "rect1",
					type: "shape",
					shapeType: 'rect',
					
					w: 100,
					h: 100,
					x: initX,
					y: initY
				
				}]);
			});
			// Updating the shape object by adjusting the
			// x,y and the width
			$("#updaterect").click(function(e) {
				e.preventDefault();
				
				that.dataStore.canvas.updateItems([{
					id: "rect1",
					x: initX + 100,
					y: initY + 20,
					w: 200,
					h: 50
				
				}]);
				
			});
			
			// Deleting the shape object
			$("#deleterect").click(function(e) {
				e.preventDefault();
				
				that.dataStore.canvas.removeItems([
					"rect1"
				]);
			});
		});
		
		return that;
	};
}(jQuery, MITHGrid));	


// Default library for the Canvas application
MITHGrid.defaults("MITHGrid.Application.Canvas", {
	// Data store for the Application
	dataStores: {
		canvas: {
			// put in here the types of data that will
			// be represented in OACVideoAnnotator
			types:{
				annotation: {},
				// types of shapes -- to add a new
				// shape object, add it here
				shape: {}
			},
			properties: {
				// posInfo contains the SVG dimensions for 
				// a shape
				posInfo: {
					type: "Item"
				}
			}
			
		}
		
	}
});
	 
