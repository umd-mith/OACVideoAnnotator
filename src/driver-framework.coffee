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
  # This event is used by applications making use of the PlayerController to discover configured players.
  #
  # Examples:
  #
  #     OAC.Client.StreamingVideo.Player.onNewPlayer.addListener(function(player) {
  #       -- do something with player
  #     });
  #
  exports.onNewPlayer = MITHGrid.initEventFirer(false, false, true)

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
  pendingPlayers = {}
  drivers = {}
  
  exports.onNewPlayer.addListener (p) ->
    players.push p
  
  exports.register = (driverName, driverObjectCB) ->
    driverCallbacks.push [ driverName, driverObjectCB ]
  
  $(document).ready ->
    exports.register = (driverName, driverObjectCB) ->
      driverObject = {}
      driverObjectCB driverObject
    
      drivers[driverName] =
        bindPlayer: (player) ->
          if $(player).data('driver') != driverObject
            $(player).data('driver', driverObject)
            exports.onNewPlayer.fire driverObject.bindPlayer player
      bp = drivers[driverName].bindPlayer
      
      if pendingPlayers[driverName]?
        for player in pendingPlayers[driverName]
          bp player
        delete pendingPlayers[driverName]
        
      for player in driverObject.getAvailablePlayers()
        bp player
        
    for cb in driverCallbacks
      exports.register cb[0], cb[1]
    driverCallbacks = null
  
  exports.driver = (driverName) -> drivers[driverName]

  exports.addPlayer = (driverName, player) ->
    if drivers[driverName]?
      drivers[driverName].bindPlayer player
    else
      pendingPlayers[driverName] ?= []
      pendingPlayers[driverName].push player

  # # Player.DriverBinding
  #
  # This is the super class for player driver bindings. Only used in the #bindPlayer() method defined when
  # a driver is registered.
  #
  exports.namespace "DriverBinding", (db) ->
    db.initInstance = (args...) ->
      MITHGrid.initInstance "OAC.Client.StreamingVideo.Player.DriverBinding", args...