---
layout: docs
title: Building Your Own Annotation Application
---
# Building Your Own Annotation Application

Building your own annotation application is a simple matter of configuring the proper components and adding any
application-specific user interface elements. We'll assume that you are using [CoffeeScript](http://coffeescript.org/), but
everything translates easily to JavaScript.

The first thing you need to do is create a function that will return an instance of your annotation application. The easiest
way to do this is to declare a namespace that you will use for all of your MITHgrid-style components:

{% highlight coffeescript %}
MITHGrid.globalnamespace 'My.AnnotationApp'

My.AnnotationApp.namespace 'Application', (Application) ->
  # Application.foo will show up as My.AnnotationApp.Application.foo outside this callback
{% endhighlight %}

This does two things. It declares your own namespace that you can use to hold everything else you need in building your
application (`My.AnnotationApp`) and makes it accessible from the JavaScript global namespace (`My` becomes a global).
It also declares a namespace in `My.AnnotationApp` to hold the application-specific component code separate from any other
components you might need in your application. The MITHgrid namespace function takes an optional callback function as its
second argument. It will call this function with the namespace, so it's an easy way to declare functions in the new
namespace.

Once we have our namespace, we want to create our application initialization function. Think of this as an object
constructor. It assembles all of the methods and data that will be associated with the application.

{% highlight coffeescript %}
  Application.initInstance = (args...) ->
    MITHGrid.Application.initInstance "My.AnnotationApp.Application", args..., (that, container) ->
      options = that.options
{% endhighlight %}

This way of opening our initializer is a common idiom in MITHgrid style components. We aren't concerned with any of the
information passed in to the `initInstance` function, so we pass it along to the super-class initializer sandwiched between
the name of our class (`My.AnnotationApp.Application`) and the callback that gives us a configured instance of the super-class
that we can modify further. We also get any DOM container that might have been passed in through the function arguments. We
pull out the configured options into our own `options` variable. This will have the options passed in through the arguments
as well as any default options that might be set (more on those after we get our application skeleton built).

At this point, if you had an HTML 5 video on a web page (or any video for which you had the proper [driver](/OACVideoAnnotator/docs/drivers/)), you could use the following script in your web page and display annotations as
the video played.

{% highlight js %}
var annotationApps = {};
OAC.Client.StreamingVideo.Player.onNewPlayer.addListener(function(playerobj) {

  var app = My.AnotationApp.Application.initInstance({
    player: playerobj
  });

  app.run();
  annotationApps[playerobj.getTargetURI()] = app;
});
{% endhighlight %}

The `OAC.Client.StreamingVideo.Player.onNewPlayer` event fires each time a new video player is detected for which there is
a loaded driver. Each time it fires, we create an instance of our annotation application and store it in the `annotationApps`
object so we can get to it later.

**N.B.:** Only players that are part of the DOM when the driver loads will be detected for now.

If we have some way of loading annotations from a server, then we can import them into our application by passing the
RDF/JSON data to the `importData` method of our application. We can pull out an RDF/JSON representation of the
annotations by calling the `exportData` method.

