(function($, MITHGrid) {
	/**
	* MITHGrid Canvas
	* Creates a canvas using the Raphael JS library
	*/
	
	// Set the namespace for the Canvas application
	MITHGrid.Application.namespace("Canvas");
	MITHGrid.Application.Canvas.initApp = function(container, options) {
	
	var that = MITHGrid.Application.initApp("MITHGrid.Application.Canvas", container, $.extend(true, {},
options, {
    dataViews: {
        // view for the space in which data from shapes
        // is drawn
        drawspace: {
            dataStore: 'canvas',
            types: ["rect", "oval"],
            label: 'drawspace'
        }
    },
    viewSetup: '<div id="canvasSVG"></div><div id="testdone"></div>',
    presentations: {
        raphsvg: {
            type: MITHGrid.Presentation.RaphaelCanvas,
            container: "#canvasSVG",
            dataView: 'drawspace',
            lenses: {
                rect: function(container, view, model, itemId) {
                    // Note: Rectangle measurements x,y start at CENTER
                    var that = {},
                    item = model.getItem(itemId),
                    c,
                    ox,
                    oy,
                    // Set up drag() callback functions
                    start = function() {
                        ox = parseInt(c.attr("x"), 10);
                        oy = parseInt(c.attr("y"), 10);

                    },
                    move = function(dx, dy) {
                        var targets = {};
                        // This is where we update the shape
                        // object
                        model.updateItems([{
                            id: itemId,
                            x: dx + ox,
                            y: dy + oy
                        }]);
                    },
                    up = function() {

                        };

                    $("#testdone").append("<p>Raphael Object in data store:<br/> " + JSON.stringify(item) + "</p>");
                    ox = (item.x - (item.w / 2));
                    oy = (item.y - (item.h / 2));

                    // Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
                    c = view.canvas.rect(ox, oy, item.w, item.h);
                    // fill and set opacity
                    c.attr({
                        fill: "red",
                        opacity: 1
                    });

                    that.update = function(item) {

                        // receiving the Object passed through
                        // model.updateItems in move()
                        try {
                            if (item.x !== undefined && item.y !== undefined) {
                                c.attr({
                                    x: item.x[0],
                                    y: item.y[0]
                                });
                            }
                        } catch(e) {
                            console.log(e);
                            //	c.remove();
                        }
                        // Raphael object is updated
                        $("#testdone > p").empty().html("Raphael Object in data store:<br/> " + JSON.stringify(item));
                    };

                    that.remove = function(item) {
                        // getting the removeItems callback
                        c.remove();
                    };

                    // initiate the drag feature (RaphaelJS)
                    c.drag(move, start, up);

                    return that;
                },
                oval: function(container, view, model, itemId) {
                    var that = {},
                    item = model.getItem(itemId),
                    c,
                    ox,
                    oy,
                    // Set up drag() callback functions
                    start = function() {
                        ox = parseInt(c.attr("x"), 10);
                        oy = parseInt(c.attr("y"), 10);

                    },
                    move = function(dx, dy) {
                        var targets = {};
                        // This is where we update the shape
                        // object
                        model.updateItems([{
                            id: itemId,
                            x: dx + ox,
                            y: dy + oy
                        }]);
                    },
                    up = function() {

                        };

                    // create the shape
                    c = view.canvas.ellipse(item.x, item.y, item.w, item.h);

                    that.update = function(item) {
                        // receiving the Object passed through
                        // model.updateItems in move()
                        try {
                            if (item.x !== undefined && item.y !== undefined) {
                                c.attr({
                                    x: item.x[0],
                                    y: item.y[0]
                                });
                            }
                        } catch(e) {
                            console.log(e);
                            //	c.remove();
                        }
                        // Raphael object is updated
                        $("#testdone > p").empty().html("Raphael Object in data store:<br/> " + JSON.stringify(item));
                    };

                    return that;

                }
            }
        }
	},

        cWidth: options.width,
        cHeight: options.height
    

})
);
		
		that.ready(function() {
			// This has been extracted into
			// genApps.js and controls.js
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
				rect: {},
				oval: {}
			},
			properties: {
				// posInfo contains the SVG dimensions for 
				// a shape
				bodyContent: {
					type: 'Item'
				},
				targetURI: {
					type: 'Item'
				}
			}
			
		}
		
	}
});
	 
