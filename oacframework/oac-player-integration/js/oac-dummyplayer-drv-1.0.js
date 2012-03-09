/*
Function: ready

	Start point required to call OAC driver register. It initializes the OAC driver.
*/
$(document).ready(function() {
	OAC_Controller.register("OACDummyPlayerDrv");
});

/*
Class: OACDummyPlayerDrv

	OAC driver for Dummy Player.
*/
function OACDummyPlayerDrv(){
	
	/*
    Variable: playerObj
    	Stores the Dummy player DOM object. Required to control player features.
    */
	this.playerObj = null;

	/*
    Variable: oac_version
    	Contains the OAC version supported.
	 */
	this.oac_version = '1.0';
	
	/*
    Function: getAvailablePlayers
    	Returns all players available on the page, that can be controlled with this driver.
    Returns:
    	An array of DOM objects.
	 */
	this.getAvailablePlayers= function() {
		return $('.dummyplayer');
	}
	
	/*
    Function: setDomObj
    	Set a DOM Object for a certain player. This relates driver and player.
	 */
	this.setDomObj= function(DOMObject) {
		this.playerObj = $(DOMObject).data('player');
	}
	
	/*
    Function: onplayheadupdate
    	Customizable callback to set a function that is going to be called on each second.
    Parameters:
    	callback - User function
	 */
	this.onPlayheadUpdate= function(callback) {
		this.playerObj.onplayheadupdate(callback);
	}
	
	/*
    Function: getcoordinates
    	Returns the current player coordinates on screen
    Returns:
    	An array of coordinates(0 is X, 1 is Y).
	 */
	this.getcoordinates= function(){
		var coordinates = this.playerObj.getcoordinates();
		coordinates[0] = parseInt(coordinates[0]);
		coordinates[1] = parseInt(coordinates[1]);
		return coordinates;
	}
	
	/*
    Function: getsize
    	Returns the video size on current player.
    Returns:
    	Array of pixel values ( 0 is width, 1 is height).
	 */
	this.getsize= function(){
		var size = this.playerObj.getsize();
		size[0] = parseInt(size[0]);
		size[1] = parseInt(size[1]);
		return size;
	}
	
	/*
    Function: play
    	Plays video.
	 */
	this.play= function(){
		this.playerObj.play();
	}
	
	/*
    Function: pause
    	Pauses video.
	 */
	this.pause= function(){
		this.playerObj.pause();
	}
	
	/*
    Function: getPlayhead
    	Returns the current play head position
    Returns:
    	Play head position
	 */
	this.getPlayhead= function(){
		return this.playerObj.getplayhead();
	}
	
	/*
    Function: setPlayhead
    	Sets the play head value to a certain position.
    Parameters:
    	value - New play head value
	 */
	this.setPlayhead= function(value){
		this.playerObj.setplayhead(value);
	}
	
	/// <name type="function">getOACVersion</name>
	/// <summary>Returns the OAC version supported.</summary>
	/// <returns>OAC version.</returns>
	/*
    Function: getOACVersion
    	Returns the OAC version supported.
    Returns:
    	OAC version.
	 */
	this.getOACVersion= function(){
		return this.oac_version;
	}
	

}