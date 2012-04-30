---
layout: docs
title: Events
---
Video Annotator uses events to notify components of changes in data or application state. For example, the video driver will fire
events notifying components about the progress of the video as it plays, allowing annotations to be brought in and out of view.

Each event object has two methods: `#addListener`, to add a callback function that is called when the event fires, 
and `#fire`, to fire the event. See [the MITHgrid documentation on events](/mithgrid/docs/events/) for more details. Generally,
you will use `#addListener` and not `#fire`.

In the following list of events, the top-level heading is the namespace holding the initInstance function that creates an object
of that type. Each instance will have the listed events as properties of the instance's `events` property. For example, if
`app` is an instance of `OAC.Client.StreamingVideo`, then you would use `app.events.onActiveAnnotationChange.addListener(...)`
to add a function that gets called when the active annotation changes for the `app` application instance.

Binding events are those associated with the binding object returned when a controller is bound to a DOM element. 
Static events are available from the namespace instead of an instance.

Unless otherwise noted, events are multicast and not preventable.

## OAC.Client.StreamingVideo

### Events

#### onActiveAnnotationChange

#### onCurrentModeChange

#### onCurrentTimeChange

#### onTimeEasementChange

## OAC.Client.StreamingVideo.Component.ShapeCreateBox

## OAC.Client.StreamingVideo.Component.ShapeEditBox

### Events

#### onMove

#### onResize


## OAC.Client.StreamingVideo.Controller.KeyboardListener

### Binding Events

#### onDelete

## OAC.Client.StreamingVideo.Controller.Drag

### Binding Events

#### onFocus

#### onUnfocus

#### onUpdate

## OAC.Client.StreamingVideo.Controller.Select

### Binding Events

#### onSelect

## OAC.Client.StreamingVideo.Controller.TextBodyEditor

### Binding Events

#### onClick

#### onDelete

#### onUpdate

## OAC.Client.StreamingVideo.Controller.CanvasClickController

### Binding Events

#### onShapeStart

#### onShapeDrag

#### onShapeDone

## OAC.Client.StreamingVideo.Controller.timeControl

### Binding Events

#### onUpdate

## OAC.Client.StreamingVideo.Player

### Static Events

#### onNewPlayer

## OAC.Client.StreamingVideo.Player.DriverBinding

Each binding of a video player driver to a video player has the following events.

### Events

#### onResize

#### onPlayheadUpdate
