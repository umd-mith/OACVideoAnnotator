/*
Class: OAC_Controller

	Main class for OAC framework. It manages the relation between the available players and their oac drivers for the current page.
*/
var OAC_Controller = {
		
		
		/*
        Variable: players
        	The players array. DOM Objects and drivers of drivers are stored here.
	    */
		players: new Array(),
		
		/*
        Function: player
        	Returns the DOM object for a certain player loaded on the page.
        Parameters:
        	playerId - Player ID, a sequential number what identifies a player on a page, is optional. If not entered, it takes the first player available.
        Returns:
        	A player's DOM Object.
        Examples:
        	OAC_Controller.player().pause();
        	OAC_Controller.player(1).play();
		*/
		player: function(playerId) {
			if(!playerId) {
				playerId = 0;
			}
			return $(this.players[playerId]).data('driver');
		},
		
		/*
        Function: register
        	Used by drivers to let know to OAC what drivers are available and initialize them.
        Parameters:
        	drivername - Driver name to be registered on OAC framework. It's the name of the driver class.
        Returns:
        	A player's DOM Object.
        Examples:
        	OAC_Controller.register("OACDummyPlayerDrv");
		*/
		register: function(drivername) {
			var constructor = new Function("", "return new " + drivername + "()");
			var driverObject = constructor();
			var players = driverObject.getAvailablePlayers();
			players.each(function() {
				$(this).data('driver', driverObject);
				driverObject.setDomObj(this);
				OAC_Controller.players[OAC_Controller.players.length] = this;
			});
		},
		
}