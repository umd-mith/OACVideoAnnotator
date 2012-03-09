/*
Function: ready

        Start point required to call OAC driver register. It initializes the OAC driver.
*/
$(document).ready(function() {
        OAC_Controller.register("OACYoutubeDrv");
});


function onYouTubePlayerAPIReady() {
        OAC_Controller.player().onYouTubePlayerAPIReady();
}

/*
Class: OACYoutubeDrv

        OAC driver for Dummy Player.
*/
function OACYoutubeDrv(){
        var tag = document.createElement('script');
        tag.src = "http://www.youtube.com/player_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


        this.done = false;


        this.onYouTubePlayerAPIReady = function() {
			console.log('onAPIReady closure ');
           var height = this.domObj.getAttribute("height");
           var width = this.domObj.getAttribute("width");
           var src = this.domObj.getAttribute("src");
           var srcArray = src.split("/");
           var videoId = srcArray[srcArray.length - 1];
           var playerId = $(this.domObj).parent().attr("id");

           this.playerObj = new YT.Player(playerId, {
                   height: height,
                   width: width,
                   videoId: videoId,
                   events: {
                       'onReady': this.onPlayerReady,
                       'onStateChange': this.onPlayerStateChange
                   }
           });
			
        }


        this.onPlayerReady = function(event) {
                event.target.playVideo();
        }


        this.onPlayerStateChange = function(event) {
                if (event.data == YT.PlayerState.PLAYING && !this.done) {
                        setTimeout(this.stop, 6000);
                        this.done = true;
                }
        }




        /*
    Variable: playerObj
        Stores the Dummy player DOM object. Required to control player features.
    */
        this.playerObj = null;
        this.domObj = null;
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
                    return $('.youtubeplayer iframe');
            }

            /*
        Function: setDomObj
            Set a DOM Object for a certain player. This relates driver and player.
             */
            this.setDomObj= function(DOMObject) {
					console.log('setDomObj called');
                    this.domObj = DOMObject;
                    this.playerObj = $(DOMObject).data('player');
            }

            /*
        Function: play
            Plays video.
             */
            this.play= function(){
                    this.playerObj.playVideo();
            }

            /*
        Function: pause
            Pauses video.
             */
            this.pause= function(){
                    this.playerObj.stopVideo();
            }

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
