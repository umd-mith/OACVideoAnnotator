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
			player: playerobj,
			url: 'http://html5demos.com/assets/dizzy'
		});

	
		// creating Raphael canvas application
		raphApp.run();
	
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