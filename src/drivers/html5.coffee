#
# Function: ready
#
#	Start point required to call OAC driver register. It initializes the OAC driver.
#
$(document).ready ->
	OAC.Client.StreamingVideo.Player.register initHTML5PlayerDrv()

#
# Class: OACDummyPlayerDrv
#
#	OAC driver for Dummy Player.
#
initHTML5PlayerDrv = ->
	driver = {}

	#
    # Function: getAvailablePlayers
    #	Returns all players available on the page, that can be controlled with this driver.
    # Returns:
    #	An array of DOM objects.
	#
	driver.getAvailablePlayers = -> $('video')
			
	driver.getOACVersion = -> "1.0"
	
	driver.bindPlayer = (domObj) ->
		OAC.Client.StreamingVideo.Player.DriverBinding.initInstance (that) ->
			#
		    # Function: onplayheadupdate
		    #	Customizable callback to set a function that is going to be called on each second.
		    # Parameters:
		    #	callback - User function
			#
			that.onPlayheadUpdate = (cb) ->
				$(domObj).bind 'timeupdate', ->
					cb domObj.currentTime
				
			#
		    # Function: getcoordinates
		    #	Returns the current player coordinates on screen
		    # Returns:
		    #	An array of coordinates(0 is X, 1 is Y).
			#	
			that.getcoordinates = -> 
				[
					$(domObj).position().left
					$(domObj).position().top
				]
	
			#
		    # Function: getsize
		    #	Returns the video size on current player.
		    # Returns:
		    #	Array of pixel values ( 0 is width, 1 is height).
			#
			that.getsize = -> 
				[
					$(domObj).width()
					$(domObj).height()
				]
	
			#
		    # Function: play
		    #	Plays video.
			# 
			that.play = -> domObj.play()
	
			#
		    # Function: pause
		    #	Pauses video.
			# 
			that.pause = -> domObj.pause()
	
			#
		    # Function: getPlayhead
		    #	Returns the current play head position
		    # Returns:
		    #	Play head position
			#
			that.getPlayhead = -> domObj.currentTime
	
			#
		    # Function: setPlayhead
		    #	Sets the play head value to a certain position.
		    # Parameters:
		    #	value - New play head value
			#
			that.setPlayhead = (n) ->
				domObj.currentTime = parseFloat n
	driver