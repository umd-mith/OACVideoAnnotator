/*
Function: ready

	Initializes all dummy players available on page.
*/
$(document).ready(function() {
		$('.dummyplayer').each(function(index) {
			var DummyObject = new DummyPlayer(this, index);
			$(this).data('player', DummyObject);
			DummyObject.start_dummy_player(this, index);
		});
});


/*
Class: DummyPlayer

	Dummy Player class. Dummy player pretends to be a player for testing purposes.

Parameters:
	
	domObject - DOM od the DIV Object where the dummy is going to be initialized.
	index - Sequential ID to identified this dummy player from others available on the page.
	
Example:
	DummyObject.start_dummy_player(domObj, index);
	
*/
function DummyPlayer(domObject, index) {
	
	/*
    Variable: DOMObject
    	Stores the DOM Object where the dummy player is placed.
	 */
	this.DOMObject 	= domObject;
	
	/*
    Variable: index
    	Stores the player index that indentifies it from other players available.
	 */
	this.index 		= index;
	
	/*
    Function: start_dummy_player
    	Sets aspect and content of the player. Plays it as well.
	 */
	this.start_dummy_player= function(){
		this.setAspect();
		this.setContent();
		this.play();
		window.setTimeout(this.sencondIntervalUpdate, 1000, this.DOMObject);
	}
	
	/*
    Function: setAspect
    	Set background and border
	 */
	this.setAspect= function(){
		$(this.DOMObject).css('background','url("../images/dummy.png") no-repeat scroll right bottom #F8C700');
		$(this.DOMObject).css('border','1px solid darkBlue');
	}
	
	/*
    Function: setContent
    	Set initial content
	 */
	this.setContent= function(){
		var player = "$('#player-content-"+this.index+"').parents('.dummyplayer').data('player')";
		$(this.DOMObject).append('<ul id="player-content-'+this.index+'" style="list-style-type: none;padding:0;">' 
				+ '<li style="text-align: center;font-weight: bold;text-decoration: underline;">Dummy Player #'+(this.index + 1)+'</li>'
				+ '<li style="text-align: center;">Status: <span class="dummy-status">Paused</span></li>'
				+ '<li style="text-align: center;">Position: <span class="dummy-position">0</span> seconds</li>'
				+ '<li style="text-align: center;">'
				+ '		<ul style="list-style-type: none;padding:0;">'
				+ '			<li style="margin:0 8px; display: inline;"><a onClick="'+player+'.rewind(5)"><img src="../images/rewind.png"></a></li>'
				+ '			<li style="margin:0 8px; display: inline;"><a onClick="'+player+'.toggle()"><img src="../images/playpause.png"></a></li>'
				+ '			<li style="margin:0 8px; display: inline;"><a onClick="'+player+'.forward(5)"><img src="../images/forward.png"></a></li>'
				+ '		</ul>'
				+ '</li>'
				+ '</ul>');
	}
	
	
	/*
    Function: sencondIntervalUpdate
    	One second timer to simulate player time
	 */
	this.sencondIntervalUpdate= function(DOMObject){
		var DummyObject = $(DOMObject).data('player');
		if($(DOMObject).find(".dummy-status").html() == "Playing") {
			DummyObject.setplayhead(DummyObject.getplayhead() + 1);
		}
		window.setTimeout(DummyObject.sencondIntervalUpdate, 1000, DOMObject);
	}
	
	/*
    Function: toggle
    	Toggles player status betwen playing and stopped.
	 */
	this.toggle= function(){
		if($(this.DOMObject).find(".dummy-status").html() == "Playing") {
			$(this.DOMObject).data('player').pause();
		} else {
			$(this.DOMObject).data('player').play();
		}
	}
	
	/*
    Function: pause
    	Pauses the video.
	 */
	this.pause= function(){
		$(this.DOMObject).find(".dummy-status").html("Paused");
	}
	
	/*
    Function: play
    	Plays the video
	 */
	this.play= function(){
		$(this.DOMObject).find(".dummy-status").html("Playing");
	}
	
	/*
    Function: rewind
    	Rewinds the video
    Parameters:
    	value - Seconds to rewind
	 */
	this.rewind= function(value){
		this.setplayhead(this.getplayhead() - parseInt(value));
	}
	
	/*
    Function: forward
    	Forwards the video
    Parameters:
    	value - Seconds to forward
	 */
	this.forward= function(value){
		this.setplayhead(this.getplayhead() + parseInt(value));
	}
	
	/*
    Function: setplayhead
    	Sets the play head value to a certain position
	Parameters:
		value - New position
	 */
	this.setplayhead= function(value){
		var intValue = parseInt(value);
		if (intValue < 0) {
			intValue = 0;
		}
		$(this.DOMObject).find(".dummy-position").html(intValue);
		$(this.DOMObject).trigger('timeupdate');
	}
	
	/*
    Function: getplayhead
    	Returns the current play head position
    Returns:
    	Play head position
	 */
	this.getplayhead= function(){
		return parseInt($(this.DOMObject).find(".dummy-position").html());
	}
	
	/*
    Function: getsize
    	Returns the current player size
    Returns:
    	Returns the current player size
	 */
	this.getsize= function(){
		var retval=new Array();
		retval[0] = parseInt($("#player-content-0").parents('.dummyplayer').css("width"));
		retval[1] = parseInt($("#player-content-0").parents('.dummyplayer').css("height"));
		return retval;
	}
	
	/*
    Function: getcoordinates
    	Returns the current player coordinates
    Returns:
    	Array of X and Y pixel values
	 */
	this.getcoordinates= function(){
		var retval=new Array();
		retval[0] = $("#player-content-"+this.index).parents('.dummyplayer').position().top;
		retval[1] = $("#player-content-"+this.index).parents('.dummyplayer').position().left;
		return retval;
	}
	
	/*
    Function: onplayheadupdate
    	Event that controls time ticks
	 */
	this.onplayheadupdate= function(callback) {
		$(this.DOMObject).bind('timeupdate', callback);
		
	}
}