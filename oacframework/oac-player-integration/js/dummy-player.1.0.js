/// <name>ready</name>
/// <summary>Initializes all dummy players available on page.</summary>
$(document).ready(function() {
		$('.dummyplayer').each(function(index) {
			var DummyObject = new DummyPlayer(this, index);
			$(this).data('player', DummyObject);
			DummyObject.start_dummy_player(this, index);
		});
});


/// <name>DummyPlayer</name>
/// <summary>Dummy Player class. Dummy player pretends to be a player for testing purposes.</summary>
/// <param name="domObject">DOM od the DIV Object where the dummy is going to be initialized.</param>
/// <param name="index">Sequential ID to identified this dummy player from others available on the page</param>
/// <example>DummyObject.start_dummy_player(domObj, index);</example>
function DummyPlayer(domObject, index) {
	
	/// <name type="object">domObject</name>
	/// <summary>Stores the DOM Object where the dummy player is placed.</summary>
	this.DOMObject 	= domObject;
	
	/// <name type="object">index</name>
	/// <summary>Stores the player index that indentifies it from other players available.</summary>
	this.index 		= index;
	
	/// <name type="function">start_dummy_player</name>
	/// <summary>Sets aspect and content of the player. Plays it as well.</summary>
	this.start_dummy_player= function(){
		this.setAspect();
		this.setContent();
		this.play();
		window.setTimeout(this.sencondIntervalUpdate, 1000, this.DOMObject);
	}
	
	/// <name type="function">setAspect</name>
	/// <summary>Set background and border</summary>
	this.setAspect= function(){
		$(this.DOMObject).css('background','url("images/dummy.png") no-repeat scroll right bottom #F8C700');
		$(this.DOMObject).css('border','1px solid darkBlue');
	}
	
	/// <name type="function">setContent</name>
	/// <summary>Set initial content</summary>
	this.setContent= function(){
		var player = "$('#player-content-"+this.index+"').parents('.dummyplayer').data('player')";
		$(this.DOMObject).append('<ul id="player-content-'+this.index+'" style="list-style-type: none;padding:0;">' 
				
				+ '<li style="text-align: center;font-weight: bold;text-decoration: underline;">Dummy Player #'+(this.index + 1)+'</li>'
				+ '<li style="text-align: center;">Status: <span class="dummy-status">Paused</span></li>'
				+ '<li style="text-align: center;">Position: <span class="dummy-position">0</span> seconds</li>'
				+ '<li style="text-align: center;">'
				// + '		<ul style="list-style-type: none;padding:0;">'
				// + '			<li style="margin:0 8px; display: inline;"><a onClick="'+player+'.rewind(5)"><img src="images/rewind.png"></a></li>'
				// + '			<li style="margin:0 8px; display: inline;"><a onClick="'+player+'.toggle()"><img src="images/playpause.png"></a></li>'
				// + '			<li style="margin:0 8px; display: inline;"><a onClick="'+player+'.forward(5)"><img src="images/forward.png"></a></li>'
				// + '		</ul>'
				+ '</li>'
				
				+ '</ul>');
	}
	
	
	/// <name type="function">sencondIntervalUpdate</name>
	/// <summary>One second timer to simulate player time</summary>
	this.sencondIntervalUpdate= function(DOMObject){
		var DummyObject = $(DOMObject).data('player');
		if($(DOMObject).find(".dummy-status").html() == "Playing") {
			DummyObject.setplayhead(DummyObject.getplayhead() + 1);
		}
		window.setTimeout(DummyObject.sencondIntervalUpdate, 1000, DOMObject);
	}
	
	/// <name type="function">toggle</name>
	/// <summary>Toggles player status betwen playing and stopped.</summary>
	this.toggle= function(){
		if($(this.DOMObject).find(".dummy-status").html() == "Playing") {
			$(this.DOMObject).data('player').pause();
		} else {
			$(this.DOMObject).data('player').play();
		}
	}
	
	/// <name type="function">pause</name>
	/// <summary>Pauses the video.</summary>
	this.pause= function(){
		$(this.DOMObject).find(".dummy-status").html("Paused");
	}
	
	/// <name type="function">play</name>
	/// <summary>Plays the video</summary>
	this.play= function(){
		$(this.DOMObject).find(".dummy-status").html("Playing");
	}
	
	/// <name type="function">rewind</name>
	/// <summary>Rewinds the video</summary>
	this.rewind= function(value){
		this.setplayhead(this.getplayhead() - parseInt(value));
	}
	
	/// <name type="function">forward</name>
	/// <summary>Forwards the video</summary>
	this.forward= function(value){
		this.setplayhead(this.getplayhead() + parseInt(value));
	}
	
	/// <name type="function">setplayhead</name>
	/// <summary>Sets the play head value to a certain position</summary>
	/// <param name="value">Play head value</param>
	this.setplayhead= function(value){
		var intValue = parseInt(value);
		if (intValue < 0) {
			intValue = 0;
		}
		$(this.DOMObject).find(".dummy-position").html(intValue);
		$(this.DOMObject).trigger('timeupdate');
	}
	
	/// <name type="function">getplayhead</name>
	/// <summary>Returns the current play head position</summary>
	/// <returns>Play head position</returns>
	this.getplayhead= function(){
		return parseInt($(this.DOMObject).find(".dummy-position").html());
	}
	
	/// <name type="function">getsize</name>
	/// <summary>Returns the current player size</summary>
	/// <returns>Array of width and height pixel values</returns>
	this.getsize= function(){
		var retval=new Array();
		retval[0] = parseInt($("#player-content-0").parents('.dummyplayer').css("width"));
		retval[1] = parseInt($("#player-content-0").parents('.dummyplayer').css("height"));
		return retval;
	}
	
	/// <name type="function">getcoordinates</name>
	/// <summary>Returns the current player coordinates</summary>
	/// <returns>Array of X and Y pixel values</returns>
	this.getcoordinates= function(){
		var retval=new Array();
		retval[0] = $("#player-content-"+this.index).parents('.dummyplayer').position().left;
		retval[1] = $("#player-content-"+this.index).parents('.dummyplayer').position().top;
		return retval;
	}
	
	/// <name type="function">onplayheadupdate</name>
	/// <summary>Event that controls time ticks</summary>
	this.onplayheadupdate= function(callback) {
		$(this.DOMObject).bind('timeupdate', callback);
		
	}
}