/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
var initPlugin = function() {
	// Create Raphael canvas application controls
	// var controlApp = MITHGrid.Application.Controls.initApp("#sidebar", {}), 
	raphApp = OAC.Client.StreamingVideo.initApp("#main", {
		width: 500, 
		height: 500,
		base: "http://www.shared-canvas.org/impl/demo1/res/",
		manifest: "http://www.shared-canvas.org/impl/demo1/res/Manifest.xml"
	});
	
	// creating Raphael canvas application
	
	raphApp.run();
	
};

$(initPlugin());