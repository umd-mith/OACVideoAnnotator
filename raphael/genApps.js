/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	// Create Raphael canvas application controls
	// var controlApp = MITHGrid.Application.Controls.initApp("#sidebar", {}), 
	raphApp = OAC.Client.StreamingVideo.initApp("#main", {width: 500, height: 500}),
	// initX = 110, initY = 110, count = raphApp.dataStore.canvas.prepare(['!type']),
	// 	// insert buttons into controls
	// 	buttons = [{
	// 		id: "rectangle",
	// 		type: "button",
	// 		text: "Rectangle ->",
	// 		callback: function(e) {
	// 			e.preventDefault();
	// 			
	// 			var items = count.evaluate(["Rectangle"]); 
	// 			
	// 			// create a shape object
	// 			raphApp.dataStore.canvas.loadItems([{
	// 				id: "rect"+items.length,
	// 				type: 'Rectangle',
	// 				bodyContent: "This is an annotation marked by an rectangular space",
	// 				creator: 'Grant Dickie',
	// 				start_ntp: 0,
	// 				end_ntp: 1,
	// 				w: 100,
	// 				h: 100,
	// 				x: initX,
	// 				y: initY
	// 			}]);
	// 		}
	// 	},
	// 	{
	// 		id: "ellipse",
	// 		type: "button",
	// 		text: "Ellipse ->",
	// 		callback: function(e) {
	// 			e.preventDefault();
	// 			var items = count.evaluate(["Ellipse"]);
	// 			// create an oval object
	// 			raphApp.dataStore.canvas.loadItems([{
	// 				id: "ellipse"+items.length,
	// 				type: 'Ellipse',
	// 				bodyContent: "This is an annotation marked by an elliptical space",
	// 				creator: 'Grant Dickie',
	// 				start_ntp: 0,
	// 				end_ntp: 1,
	// 				w: 100,
	// 				h: 100,
	// 				x: initX,
	// 				y: initY
	// 			}]);
	// 		}
	// 	}];
	// 	
	// 	controlApp.run();
	// 	
	// 	controlApp.dataStore.controls.loadItems(buttons);
	
	// creating Raphael canvas application
	
	raphApp.run();
	
};

$(initPlugin());