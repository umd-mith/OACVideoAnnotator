---
layout: docs
title: Events
---
Video Annotator uses events to notify components of changes in data or application state. For example, the video driver will fire
events notifying components about the progress of the video as it plays, allowing annotations to be brought in and out of view.

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

### Events

#### onResize

#### onPlayheadUpdate
