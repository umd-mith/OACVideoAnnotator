/*
* Create the MITHGrid applications that run the prototype 
* example. 
*
*/ 

// pass in ID for the main div
$(function() {
	OAC.Client.StreamingVideo.Player.onNewPlayer(function(playerobj) {
		// Create Raphael canvas application controls
		
		// Adding a ready wrapper function to set the playerobject
		var raphApp = OAC.Client.StreamingVideo.initApp({
			player: playerobj
		});

	
		// creating Raphael canvas application
		raphApp.run();
		
		// have a plain HTML presentation of annotation bodies
        var annotations = OAC.Client.StreamingVideo.Presentation.AnnotationList.initPresentation('#annotation-list', {
	        dataView: raphApp.dataView.currentAnnotations,
	        lensKey: ['.bodyType'],
			application: raphApp
        });
        annotations.addLens("Text", function(container, view, model, itemId) { 
	        return annotations.initTextLens(container, view, model, itemId) 
	    });
		raphApp.events.onActiveAnnotationChange.addListener(annotations.eventFocusChange);
		
		// create mode buttons
		OAC.Client.StreamingVideo.Component.AnnotationCreationButton.initInstance("#modeRectangle", {
			mode: "Rectangle",
			application: raphApp
		});
		OAC.Client.StreamingVideo.Component.AnnotationCreationButton.initInstance("#modeEllipse", {
			mode: "Ellipse",
			application: raphApp
		});
		OAC.Client.StreamingVideo.Component.AnnotationCreationButton.initInstance("#modeSelect", {
			mode: "Select",
			application: raphApp
		});
		OAC.Client.StreamingVideo.Component.AnnotationCreationButton.initInstance("#modeWatch", {
			mode: "Watch",
			application: raphApp
		});
		
		// Creating handler for the export area 
		// 
		// May need to bring this into the application? 
		// 
		$('.section-export-data > #exportDataStore').click(function() {
			// init exportData
			var data = raphApp.exportData();
			$('.section-export-data > #export-text').val(JSON.stringify(data));
		});
			
		// Setting up import button
		// 
		$('.section-export-data > #importJSONRDF').click(function() {
			var data;
			if($('.section-export-data > #export-text').val() !== '') {
				data = $('.section-export-data > #export-text').val();
				raphApp.importData(JSON.parse(data));
			}
		});
	});
});