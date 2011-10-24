/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	// Create Raphael canvas application controls
	var controlApp = MITHGrid.Application.Controls.initApp("#sidebar", {}), 
	raphApp = OAC.Client.StreamingVideo.initApp("#main", {width: 500, height: 500}),
	initX = 110, initY = 110,
	// insert buttons into controls
	buttons = [{
		id: "rectangle",
		type: "button",
		text: "Rectangle ->",
		callback: function(e) {
			e.preventDefault();
			
			var count = raphApp.dataStore.canvas.prepare(['!shape']), items;
			
			items = count.evaluate(["rect"]); 
			
			// create a shape object
			raphApp.dataStore.canvas.loadItems([{
				id: "rect"+items.length,
				type: 'Rectangle',
				shape: "rectangle",
				bodyContent: "This is an annotation marked by an rectangular space",
				creator: 'Grant Dickie',
				w: 100,
				h: 100,
				x: initX,
				y: initY
			}]);
		}
	},
	{
		id: "ellipse",
		type: "button",
		text: "Ellipse ->",
		callback: function(e) {
			e.preventDefault();
			var count = raphApp.dataStore.canvas.prepare(['!shape']), items;
			
			items = count.evaluate(["oval"]);
			// create an oval object
			raphApp.dataStore.canvas.loadItems([{
				id: "ellipse"+items.length,
				type: 'Ellipse',
				shape: "ellipse",
				bodyContent: "This is an annotation marked by an elliptical space",
				creator: 'Grant Dickie',
				w: 100,
				h: 100,
				x: initX,
				y: initY
			}]);
		}
	}];
	
	controlApp.run();
	
	controlApp.dataStore.controls.loadItems(buttons);
	
	// creating Raphael canvas application
	
	raphApp.run();
	
};

$(initPlugin());