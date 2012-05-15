---
layout: docs
title: Drivers
---
# Drivers

* auto-generated TOC:
{:toc}

**Namespace:** OAC.Client.StreamingVideo.Player

Video Annotator doesn't know anything about how the video player works. Instead, a video player driver provides an interface
between the Video Annotator and the specific driver. 
See [the HTML 5 video driver](/OACVideoAnnotator/code/src/drivers/html5.coffee.html) for an example of how a driver 
is registered with the Video Annotator.

## Driver Management


### register(callback)

Drivers register themselves with the Video Annotator when they are ready to find players in the document. The registration
handler will wait until the document is ready before calling the callbacks to finish driver construction.

The registration function takes a callback function that will be called once the document is ready. A single JavaScript
object is passed to the callback. The various methods needed to manage the players should be added as properties of this
object.

### onNewPlayer(callback)

When a new video player is detected by a driver, the provided callback will be called with the player binding.

Note that the callback will be called for all detected players, not only the players detected after the callback is
registered.

This function is useful for attaching Video Annotator instances to video players. For example, in the
[demo](/OACVideoAnnotator/demo.html), the application instance is associated with the player binding object
and then run:

{% highlight js %}
OAC.Client.StreamingVideo.Player.onNewPlayer(function(playerobj) {

  var app = OAC.Client.StreamingVideo.Demo.Application.initInstance({
    player: playerobj
  });

  app.run();
});
{% endhighlight %}

### player(id)

Returns the player driver binding associated with the `id`. If no `id` is given, then the binding associated with the
first detected video player is returned.

## Driver Requirements

Each driver constructed in the callback provided to `OAC.Client.StreamingVideo.Player.register` must have the following
methods.

### getAvailablePlayers()

This function takes no parameters and returns the DOM objects that are suitable for passing to the
`bindPlayer` method. The registration process will attach the driver object to the DOM object's
`driver` property using the jQuery `data` method.

### bindPlayer(playerDOMObject)

This function takes the DOM object returned by `getAvailablePlayers` and returns a MITHgrid object that
has the appropriate methods as outlined in the next section on Driver Binding Requirements.

## Driver Binding Requirements

Each driver binding object returned by the `bindPlayer` driver method must implement the methods outlined in this section.
Two events are expected as well: `onResize`, and `onPlayheadUpdate`. These event handlers are instantiated automatically
if the `bindPLayer` driver method uses the following CoffeeScript template:

    driver.bindPlayer = (domObj) ->
      OAC.Client.StreamingVideo.Player.DriverBinding.initInstance (that) ->
        # implement methods here as properties of `that`
        that.getCoordinates = -> ...

In JavaScript, this would be

    driver.bindPlayer = function(domObj) {
      return OAC.Client.StreamingVideo.Player.DriverBinding.initInstance(function(that) {
        // implement methods here as properties of `that`
        that.getCoordinates = function() { ... };
      });
    };

### getCoordinates()

This method returns an array holding the coordinates of the top left corner of the play surface.

### getSize()

This method returns an array holding the width and height of the play surface.

### getTargetURI()

This method returns the nominal URI of the video being shown by the video player.

### getPlayhead()

This method returns the current time position of the video.

### setPlayhead(n)

This method sets the current time position to the value passed in. Time is measured in seconds.

### play()

This method starts the video playing.

### pause()

This method stops the video playing and holds its position.
