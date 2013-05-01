#
# # HTML5 Player Driver
#
# This driver provides support for the `<video/>` HTML 5 tag. The target URI should be added to the `<video/>` tag
# as the `@data-oatarget` attribute. For example, the following is the `<video/>` tag from the demonstration page:
#
#     <video preload="metadata" 
#            data-oatarget="http://html5demos.com/assets/dizzy" 
#            controls>
#         <source src="./assets/dizzy.mp4" type="video/mp4" />
#         <source src="./assets/dizzy.webm" type="video/webm" />
#         <source src="./assets/dizzy.ogv" type="video/ogv" />
#     </video>
#
# **N.B.**: All `<video/>` objects in the page will have a driver binding attached, and this driver binding will be passed
# to all of the functions registered through OAC.Client.StreamingVideo.Player.onNewPlayer().
#
# As soon as the player driver is comfortable, it can register itself with the Video Annotator framework by calling
# the OAC.Client.StreamingVideo.Player.register function with a callback. The register function will call this
# callback with a plain JavaScript object that should be filled in with the following properties:
#
OAC.Client.StreamingVideo.Player.register 'HTML5', (driver) ->
  #
  # ## getAvailablePlayers
  #
  # Returns all player DOM objects available on the page, that can be controlled with this driver.
  # All of the DOM objects will be passed individually to the #bindPlayer method. The returned binding
  # objects will be passed to any callbacks passed to OAC.Client.StreamingVideo.Player.onNewPlayer().
  #
  #
  driver.getAvailablePlayers = -> $('video')
  
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
  driver.bindPlayer = (domObj) ->
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
      # We fire the onResize event when the video metadata has been loaded. This ensures
      # that the Video Annotator has the correct size of the play surface once the video
      # is loaded and the player has sized itself accordingly.
      #
      $(domObj).bind 'loadedmetadata', ->
        that.events.onResize.fire that.getSize()
    
      #
      # We fire the onPlayheadUpdate event when the player fires the timeupdate event, but only if
      # the new time is near the beginning or is different by at least 0.2 seconds from
      # the last time we fired the event. This avoids firing off too many events.
      #
      lastTime = 0
      ignoreNextPlayheadUpdate = false
      $(domObj).bind 'timeupdate', ->
        now = domObj.currentTime
        if Math.abs(lastTime - now) >= 0.1 or now < 0.1
          lastTime = now
          ignoreNextPlayheadUpdate = true
          that.events.onPlayheadUpdate.fire now
      
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
      that.getCoordinates = -> 
        [
          $(domObj).position().left
          $(domObj).position().top
        ]

      #
      # ### getSize
      #
      # Returns the video size (width, height) of current player.
      #
      that.getSize = -> 
        [
          $(domObj).width()
          $(domObj).height()
        ]
    
      #
      # ### getTargetURI
      #
      # Returns the targetURI that should be used in an OAC annotation. This should represent the
      # video being played by the player.
      #
      that.getTargetURI = -> $(domObj).data('oatarget')
      
      #
      # ### play
      #
      # Starts playing the video.
      # 
      that.play = -> domObj.play()

      #
      # ### pause
      #
      # Stops playing the video.
      # 
      that.pause = -> domObj.pause()

      #
      # ### getPlayhead
      #
      # Returns the current play head position
      #
      that.getPlayhead = -> domObj.currentTime

      #
      # ### setPlayhead
      #
      # Sets the play head value to a certain position.
      #
      # Parameters:
      #
      # * value - New play head value
      #
      that.setPlayhead = (n) ->
        if ignoreNextPlayheadUpdate
          ignoreNextPlayheadUpdate = false
        else
          domObj.currentTime = parseFloat n