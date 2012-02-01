Dummy Player
v.0.1
------------------

* Requirements
jQuery 1.6.4 or older

* At a glance
Dummy Player is loaded when page does and looks for dummyplayer class to transforms those DOM objects into Dummy Players.

* Features
It has the following features:
  * Supports several dummy players on the same page
  * Supports Play/Pause functionalities
  * Supports Rewind/Forward functities.
  * Displays current position

* Starting guide
Follow the next steps to get your Dummy Player working:
  1. Load jQuery library: <SCRIPT LANGUAGE="JavaScript" SRC="js/jquery-1.6.4.min.js"></script>
  2. Load Dummy player library: <SCRIPT LANGUAGE="JavaScript" SRC="dummyplayer/dummy-player.0.1.js"></script>
  3. Add "dummyplayer" class to your DIV tag and set size on it: <div id="myplayer" class="dummyplayer" style="width:300px; height:200px;"></div>

* DummyPlayer class: Methods and attributes
  * DummyPlayer(domObject, index)
		Class constructor. Runs like a real player, and supports the main function they have.
		domObject: DOM Object of a DIV tag where the dummy player is loaded
		index: Player ID, it is usually the position of the player on the page.
  * DOMObject
		Attribute to store the DOM Object associated to player
  * index
		Sequential Player ID
  * start_dummy_player()
		It starts the dummy player.
		Initializes aspect, content and plays video
  * setAspect()
		Define visual aspect.
		Set Size, Background and Border for a Dummy Player
  * setContent()
		Set Content for Dummy Player Box
		Paint title, status, position and player controls.
  * sencondIntervalUpdate(DOMObject)
		Runs the video update every second.
		DOM Object is required for this timed function in order to call it later.
  * toggle()
		Toggles between Play/Pause status on video player depending on its current status.
  * pause()
		Pauses video player
  * play()
		Plays video player
  * rewind(value)
		Rewind video
		Set video playhead ahead for value seconds
  * forward(value)
		Forward video
		Set video playhead ahead for value seconds
  * setplayhead(value)
		Set Playhead position of video
		Value Indicates the number of second for the new position.
  * getplayhead()
		Get Playhead position of video
		returns Seconds of the current video position.
  * getsize()
		Get size of video player
		returns Size of real video box
  * getcoordinates()
		Get coordinates of video player
		returns Coordinates X and Y of real video box