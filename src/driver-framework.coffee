# # Player
#
# The Video Annotator provides a central video player registry. Video player drivers register a set of callbacks
# that are used to discover available video players and bind them to a MITHgrid-based object that provides a
# standard API for managing the player.
#
# The various functions that make up the registry are static functions: they aren't methods on a particular
# object instance.
#
OAC.Client.StreamingVideo.namespace "Player", (exports) ->

	players = []
	callbacks = []

	# ## player
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
	#     OAC.Client.StreamingVideo.Player.player().pause()
	#     OAC.Client.StreamingVideo.Player.player(1).play()
	#
	exports.player = (playerId) ->
		if !playerId?
			playerId = 0
		players[playerId]

	# ## onNewPlayer
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
	#     OAC.Client.StreamingVideo.Player.onNewPlayer(function(player) {
	#       -- do something with player
	#     });
	#
	exports.onNewPlayer = (callback) ->
		for player in players
			callback(player)
		callbacks.push callback

	# ## register
	#
	# Used by drivers to let this object know which drivers are avalable and to initialize them.
	#
	# Parameters:
	#
	# * driverObjectCB - callback function that defines the functions needed to access driver objects
	#
	# Returns: Nothing.
	#
	# Examples:
	#
	#     OAC.Client.StreamingVideo.Player.register(function(driverObject) {
	#       driverObject.getAvailablePlayers = function() { ... };
	#       driverObject.bindPlayer = function(player) { ... };
	#     });
	#
	driverCallbacks = []
	
	exports.register = (driverObjectCB) ->
		driverCallbacks.push driverObjectCB
	
	$(document).ready ->
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
		
		for cb in driverCallbacks
			exports.register cb
	
	# # Player.DriverBinding
	#
	# This is the super class for player driver bindings. Only used in the #bindPlayer() method defined when
	# a driver is registered.
	#
	exports.namespace "DriverBinding", (db) ->
		db.initInstance = (args...) ->
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Player.DriverBinding", args...