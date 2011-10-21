/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	// Create Raphael canvas application controls
	var controlApp = MITHGrid.Application.Controls.initApp("#sidebar", {}), 
	raphApp = MITHGrid.Application.Canvas.initApp("#main", {width: 500, height: 500}),
	initX = 110, initY = 23,
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
				type: 'rect',
				shape: "rect",
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
		id: "oval",
		type: "button",
		text: "Oval ->",
		callback: function(e) {
			e.preventDefault();
			var count = raphApp.dataStore.canvas.prepare(['!shape']), items;
			
			items = count.evaluate(["oval"]);
			// create an oval object
			raphApp.dataStore.canvas.loadItems([{
				id: "oval"+items.length,
				type: 'oval',
				shape: "ellipse",
				bodyContent: "This is an annotation marked by an oval space",
				creator: 'Grant Dickie',
				w: 100,
				h: 100,
				x: initX,
				y: initY
			}]);
		}
	},
	{
		id: "updaterect",
		type: "button",
		text: "Move the Shape (Update in DataStore)",
		callback: function(e) {
			e.preventDefault();

			raphApp.dataStore.canvas.updateItems([{
				id: "rect1",
				x: initX + 100,
				y: initY + 20,
				w: 200,
				h: 50

			}]);

		}
	},{
		id: "deleterect",
		type: "button",
		text: "Delete the Shape",
		callback: function(e) {
			e.preventDefault();

			raphApp.dataStore.canvas.removeItems([
				"rect1"
			]);
		}
	}];
	
	controlApp.run();
	
	controlApp.dataStore.controls.loadItems(buttons);
	
	// creating Raphael canvas application
	
	raphApp.run();
	
};

$(initPlugin());