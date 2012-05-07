
OAC.Client.StreamingVideo.namespace "Player", (exports) ->
	# # Players
	#
	# Main class for OAC player driver framework. It manages the relation between the available players and their OAC
	# drivers for the current page. This is a singleton, so no initInstance or other constructor.
	#

	# Private variable: players
	#
	# The players array. DOM objects and drivers of drivers are stored here.
	players = []

	# Private variable: callbacks
	#
	# The callbacks array. Functions called when new players are configured are stored here.
	callbacks = []

	# ### #player
	#
	# Returns the DOM object for a certain player loaded on the page.
   	#
	# Parameters:
	#
	# * playerId (optional) - Player ID, a sequential number that identifies a player on a page. If not provided, it takes the first player available.
	#
	# Returns:
	#
	# A player's DOM object.
	#
	# Examples:
	#
	# oacController.player().pause()
	#
	# oacController.player(1).play()
	#
	exports.player = (playerId) ->
		if !playerId?
			playerId = 0
		players[playerId]

	# ### #onNewPlayer
	#
	# Used by applications making use of the PlayerController to discover configured players.
	#
	# Parameters:
	#
	# * callback - A function to be called with the player object.
	#
	# Returns: Nothing.
	#
	# Examples:
	#
	# oacController.onNewPlayer(function(player) {
	#   -- do something with player
	# });
	#
	exports.onNewPlayer = (callback) ->
		for player in players
			callback(player)
		callbacks.push callback

	# ### #register
	#
	# Used by drivers to let this object know which drivers are avalable and to initialize them.
	#
	# Parameters:
	#
	# * driverclass - The JavaScript class (function object) implementing the driver.
	#
	# Returns:
	#
	# A player's DOM object.
	#
	# Examples:
	#
	# oacController.register(OACDummyPlayerDrv);
	#
	exports.register = (driverObjectCB) ->
		driverObject = {}
		driverObjectCB driverObject
		ps = driverObject.getAvailablePlayers()
		for player in ps
			$(player).data('driver', driverObject)
			p = driverObject.bindPlayer player
			players.push p
			for cb in callbacks
				cb.call({}, p)
	
	exports.namespace "DriverBinding", (db) ->
		db.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Player.DriverBinding", args...