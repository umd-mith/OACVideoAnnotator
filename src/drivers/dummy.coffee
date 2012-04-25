#
# Function: ready
#
#	Start point required to call OAC driver register. It initializes the OAC driver.
#
$(document).ready ->
	OAC.Client.StreamingVideo.Player.register initOACDummyPlayerDrv()

#
# Class: OACDummyPlayerDrv
#
#	OAC driver for Dummy Player.
#
initOACDummyPlayerDrv = ->
	driver = {}

	#
    # Function: getAvailablePlayers
    #	Returns all players available on the page, that can be controlled with this driver.
    # Returns:
    #	An array of DOM objects.
	#
	driver.getAvailablePlayers = ->
		index = 0
		for p in $('.dummyplayer')
			player = $(p).data 'player'
			if not player?
				player = initDummyPlayer p, index
				$(p).data 'player', player
				player.startDummyPlayer()
			index += 1
			player
			
	driver.getOACVersion = -> "1.0"

	driver.bindPlayer = (playerObj) ->
		OAC.Client.StreamingVideo.Player.DriverBinding.initInstance (that) ->
			#
		    # Function: onplayheadupdate
		    #	Customizable callback to set a function that is going to be called on each second.
		    # Parameters:
		    #	callback - User function
			#
			that.onPlayheadUpdate = playerObj.onplayheadupdate
	
			#
		    # Function: getcoordinates
		    #	Returns the current player coordinates on screen
		    # Returns:
		    #	An array of coordinates(0 is X, 1 is Y).
			#
			that.getcoordinates = -> (parseInt(c, 10) for c in playerObj.getcoordinates())
	
			#
		    # Function: getsize
		    #	Returns the video size on current player.
		    # Returns:
		    #	Array of pixel values ( 0 is width, 1 is height).
			#
			that.getsize = -> (parseInt(s, 10) for s in playerObj.getsize())
	
			#
		    # Function: play
		    #	Plays video.
			# 
			that.play = playerObj.play
	
			#
		    # Function: pause
		    #	Pauses video.
			# 
			that.pause = playerObj.pause
	
			#
		    # Function: getPlayhead
		    #	Returns the current play head position
		    # Returns:
		    #	Play head position
			#
			that.getPlayhead = playerObj.getplayhead
	
			#
		    # Function: setPlayhead
		    #	Sets the play head value to a certain position.
		    # Parameters:
		    #	value - New play head value
			#
			that.setPlayhead = playerObj.setplayhead
	driver

initDummyPlayer = (DOMObject, index) ->
		that = {}
		
		that.startDummyPlayer = ->
			that.setAspect()
			that.setContent()
			that.play()
			window.setTimeout that.secondIntervalUpdate, 1000

		that.setAspect = ->
			$(DOMObject).css 'background', 'url("dummyplayer/images/dummy.png") no-repeat scroll right bottom #F8C700'
			$(DOMObject).css 'border', '1px solid darkBlue'

		that.setContent = ->
			player = "$('#player-content-#{index}').parents('.dummyplayer').data('player')"
			$(DOMObject).append """
				<ul id="player-content-#{index}" style="list-style-type: none; padding: 0;">
					<li style="text-align: center; font-weight: bold; text-decoration: underline;">Dummy Player ##{index+1}</li>
					<li style="text-align: center;">Status: <span class="dummy-status">Paused</span></li>
					<li style="text-align: center;">Position: <span class="dummy-position">0</span> seconds</li>
					<!-- li style="text-align: center;">
						<ul style="list-style-type: none; padding: 0;">
							<li style="margin: 0 8px; display: inline;">
								<a onClick="#{player}.rewind(5)"><img src="dummyplayer/images/rewind.png" /></a>
							</li>
							<li style="margin: 0 8px; display: inline;">
								<a onClick="#{player}.toggle()"><img src="dummyplayer/images/playpause.png" /></a>
							</li>
							<li style="margin: 0 8px; display: inline;">
								<a onClick="#{player}.forward(5)"><img src="dummyplayer/images/forward.png" /></a>
							</li>
						</ul>
					</li -->
				</ul>
			"""

		that.secondIntervalUpdate = ->
			window.setTimeout that.secondIntervalUpdate, 1000
			if $(DOMObject).find(".dummy-status").html() == "Playing"
				that.forward 1

		that.toggle = ->
			if $(DOMObject).find(".dummy-status").html() == "Playing"
				that.pause()
			else
				that.play()

		that.pause = ->
			$(DOMObject).find(".dummy-status").html("Paused")

		that.play = ->
			$(DOMObject).find(".dummy-status").html("Playing")

		that.rewind = (value) ->
			that.setplayhead(that.getplayhead() - parseInt(value, 10))

		that.forward = (value) ->
			that.setplayhead(that.getplayhead() + parseInt(value, 10))

		that.setplayhead = (value) ->
			value = parseInt(value, 10)
			if value < 0
				value = 0
			$(DOMObject).find(".dummy-position").html(value)
			$(DOMObject).trigger 'timeupdate'

		that.getplayhead = () ->
			parseInt $(DOMObject).find(".dummy-position").html(), 10

		that.getsize = ->
			retval = []
			retval.push parseInt $("#player-content-#{index}").parents('.dummyplayer').css("width"), 10
			retval.push parseInt $("#player-content-#{index}").parents('.dummyplayer').css("height"), 10
			retval
		
		that.getcoordinates = ->
			retval = []
			retval.push $("#player-content-#{index}").parents('.dummyplayer').position().top
			retval.push $("#player-content-#{index}").parents('.dummyplayer').position().left
			retval

		that.onplayheadupdate = (callback) ->
			$(DOMObject).bind 'timeupdate', callback
		
		that