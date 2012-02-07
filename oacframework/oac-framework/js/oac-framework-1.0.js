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
        Variable: callbacks
        	The callbacks array. Functions called when new players are configured are stored here.
	    */
		callbacks: new Array(),
		
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
		Function: on_new_player
			Used by applications making use of the OAC_Controller to discover configured players
		Parameters:
			callback - A function to be called with the player object.
		Returns:
			Nothing.
		Examples:
			OAC_Controller.on_new_player(function(player) { 
				# do something with player
			});
		*/
		
		on_new_player: function(callback) {
			OAC_Controller.players.each(function() {
				var player = this;
				callback(player);
			});
			OAC_Controller.callbacks.push(callback);
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
				var player = this;
				$(this).data('driver', driverObject);
				driverObject.setDomObj(this);
				OAC_Controller.players[OAC_Controller.players.length] = this;
				OAC_Controller.callbacks.each(function() {
					this.call({}, player);
				});
			});
		},
		
}