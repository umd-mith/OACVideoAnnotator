---
layout: docs
title: Controllers
---
# Controllers

* auto-generated TOC:
{:toc}

**Namespace:** OAC.Client.StreamingVideo.Controller

The Video Annotator library defines a number of controllers that may be useful in embedding the Video Annotator
in your website. 
See [the MITHgrid documentation on controllers](/mithgrid/docs/controllers/) for an overview of how controllers work.

## Drag

**N.B.:** This controller may be moved to a Raphaël-specific part of the MITHgrid library since it is general.

The Drag controller binds to a Raphaël shape and translates the Raphaël drag events into MITHgrid events.
The `onFocus` event fires when the drag operation starts. The `onUpdate` event fires as the mouse moves during
the drag operation. The `onUnfocus` event fires when the drag operation ends.

The `onFocus` and `onUpdate` event firers pass the position coordinates (x, y) to the listener as the
first and second parameters. For the `onFocus` event, the position is relative to the position of the element.
For the `onUpdate` event, the position is relative to the position passed to the `onFocus` listener.

## Select

**N.B.:** This controller may be moved to a Raphaël-specific part of the MITHgrid library since it is general.

## CanvasClickController

