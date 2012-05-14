---
layout: docs
Title: Drivers
---
Video Annotator doesn't know anything about how the video player works. Instead, a video player driver provides an interface
between the Video Annotator and the specific driver. 
See [the HTML 5 video driver](/OACVideoAnnotator/code/src/drivers/html5.coffee.html) for an example of how a driver 
is registered with the Video Annotator.

## Driver Management


### OAC.Client.StreamingVideo.Player.register(callback)

Drivers register themselves with the Video Annotator when they are ready to find players in the document. The registration
handler will wait until the document is ready before calling the callbacks to finish driver construction.

The registration function takes a callback function that will be called once the document is ready. A single JavaScript
object is passed to the callback. The various methods needed to manage the players should be added as properties of this
object.

### OAC.Client.StreamingVideo.Player.onNewPlayer(callback)

When a new video player is detected by a driver, the provided callback will be called with the player binding.

Note that the callback will be called for all detected players, not only the players detected after the callback is
registered.

This function is useful for attaching Video Annotator instances to video players. For example, in the
[demo](/OACVideoAnnotator/demo.html), the application instance is associated with the player binding object
and then run:

    OAC.Client.StreamingVideo.Player.onNewPlayer(function(playerobj) {

      var app = OAC.Client.StreamingVideo.Demo.Application.initInstance({
        player: playerobj
      });
    

      app.run();
    });

### OAC.Client.StreamingVideo.Player.player(id)

Returns the player driver binding associated with the `id`. If no `id` is given, then the binding associated with the
first detected video player is returned.