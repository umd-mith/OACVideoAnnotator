Guide to OAC
------------

1. How to load the OAC libraries
Basically they are required three libraries ordered like this:
 * jQuery library: jquery.js
 * OAC Framework library: oac-framework-0.1.js
 * OAC Player Driver library: oac-player-drv-0.1.js
Example:
<SCRIPT LANGUAGE="JavaScript" SRC="js/jquery-1.6.4.min.js"></script>
<SCRIPT LANGUAGE="JavaScript" SRC="dummyplayer/oac-framework-0.1.js"></script>
<SCRIPT LANGUAGE="JavaScript" SRC="dummyplayer/oac-dummyplayer-drv-0.1.js"></script>

2. How to tie a player to OAC
To get tied a player to OAC is very simple, just add one css class to the DOM player or container. The name of the class tells its OAC compatible and the OAC driver. It must fit this format: oacdriver-XXX where XXX is the classname of the driver.
Example:
<div id="myplayer" class="oacdriver-OACDummyPlayerDrv dummyplayer" style="width:300px; height:200px;"></div>

3. How to use OAC actions
OAC framework 1.0 supports these functions:
 * getcoordinates()
 Returns the current player coordinates
 * getsize()
 Returns the current player size
 * play()
 Plays the video
 * pause()
 Pauses the video
 * getPlayhead()
 Returns the current play head position
 * setPlayhead(val)
 Sets the play head value to a certain position
 * getOACVersion()
 Returns the OAC version supported
 
 The call must be done to the player. OAC framework provides a method to get a certain player, player(). By default it returns the first compatible player on the page.
 Examples:
 OAC_Controller.player().getPlayhead()