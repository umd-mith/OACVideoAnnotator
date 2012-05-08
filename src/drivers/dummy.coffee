#
# # Dummy Player Driver
#
# This driver provides a dummy player object and driver for development purposes.
#
# As soon as the player driver is comfortable, it can register itself with the Video Annotator framework by calling
# the OAC.Client.StreamingVideo.Player.register function with a callback. The register function will call this
# callback with a plain JavaScript object that should be filled in with the following properties:
#
$(document).ready ->
	OAC.Client.StreamingVideo.Player.register (driver) ->

		#
		# ## getAvailablePlayers
		#
		# Returns all player DOM objects available on the page, that can be controlled with this driver.
		# All of the DOM objects will be passed individually to the #bindPlayer method. The returned binding
		# objects will be passed to any callbacks passed to OAC.Client.StreamingVideo.Player.onNewPlayer().
		#
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
		
		#
		# ## getOACVersion
		#
		# Returns the version number of the API the player driver is implementing. "1.0" is the only option for now.
		#	
		driver.getOACVersion = -> "1.0"

		#
		# ## bindPlayer
		#
		# Takes the DOM object and binds it to a JavaScript object that provides the OAC player API.
		# The binding is then used by the Video Annotator to manage the player.
		#
		driver.bindPlayer = (playerObj) ->
			#
			# OAC.Client.StreamingVideo.Player.DriverBinding is the MITHgrid super class for
			# driver bindings.
			#
			OAC.Client.StreamingVideo.Player.DriverBinding.initInstance (that) ->
				#
				# We begin by binding appropriate events in the DOM object to the
				# event firers in the driver binding object.
				#
				
				#
				# We fire the onPlayheadUpdate event when the player fires the onplayheadupdate event.
				#
				playerObj.onplayheadupdate ->
					that.events.onPlayheadUpdate.fire that.getPlayhead()
				
				#
				## Player Driver API
				#
				# The following methods are expected for the player driver binding.
				#

				#
				# ### getCoordinates
				#
				# Returns the current player coordinates (left, top) on screen.
				#
				that.getCoordinates = -> (parseInt(c, 10) for c in playerObj.getcoordinates())
	
				#
				# ### getSize
				#
				#	Returns the video size (width, height) of current player.
				#
				that.getSize = -> (parseInt(s, 10) for s in playerObj.getsize())
	
				#
				# ### getTargetURI
				#
				# Returns the targetURI that should be used in an OAC annotation. This should represent the
				# video being played by the player.
				#
				that.getTargetURI = playerObj.getTargetURI
				
				#
				# ### play
				#
				# Starts playing the video.
				#
				that.play = playerObj.play
	
				#
				# ### pause
				#
				# Stops playing the video.
				#
				that.pause = playerObj.pause
	
				#
				# ### getPlayhead
				#
				# Returns the current play head position
				#
				that.getPlayhead = playerObj.getplayhead
	
				#
				# ### setPlayhead
				#
				# Sets the play head value to a certain position.
				#
				# Parameters:
				#
				# * value - New play head value
				#
				that.setPlayhead = playerObj.setplayhead

		initDummyPlayer = (DOMObject, index) ->
			that = {}
	
			that.getTargetURI = -> $(DOMObject).data('oatarget')
	
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