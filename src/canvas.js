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
					types: ["paper", "shape"],
					label: 'drawspace'
				},
				shapes: {
					dataStore: 'canvas',
					types: ["shape"],
					label: 'shapes',
					filters: [".posInfo"]
				}
			},
			viewSetup: '<h3>Canvas Area</h3><div id="canvasSVG"></div><div id="testdone"></div><button id="loadrect">Load SVG Shape</button>',
			presentations: {
				raphsvg: {
					type: MITHGrid.Presentation.RaphSVG,
					container: "#canvasSVG",
					dataView: 'drawspace',
					lenses: {
						shape: function(container, view, model, itemId) {
							var that = {},
							item = model.getItem(itemId);
							
							$("#testdone").append("<p>Rect object: "+JSON.stringify(item)+"</p>");
							
							// attach the svg element to the paper object
							if(item.shapeType[0] === 'rect') {
								view.canvas.rect(item.posInfo[0].x, item.posInfo[0].y, item.posInfo[0].w, item.posInfo[0].h);
							}
						}
					},
					cWidth: options.width,
					cHeight: options.height
				}
			}
			
		})
		);
		
		that.ready(function() {
		
			
			$("#loadrect").click(function(e) {
				e.preventDefault();
				
				// create a shape object
				
				
				that.dataStore.canvas.loadItems([{
					id: "rect1",
					type: "shape",
					shapeType: 'rect',
					posInfo: {
						w: 100,
						h: 100,
						x: 110,
						y: 23
					}
				}]);
			});
		});
		
		return that;
	};
	

	
	// Default library for the Canvas application
	fluid.defaults("MITHGrid.Application.Canvas", {
		// Data store for the Application
		dataStores: {
			canvas: {
				types:{
					// the plane that is being drawn on
					paper: {}, 
				
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
	 
}(jQuery, MITHGrid));