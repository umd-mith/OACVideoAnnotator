---
layout: docs
title: Data Schema
---
# Data Schema

* auto-generated TOC:
{:toc}

A Video Annotator application instance uses [a MITHgrid data store](/mithgrid/docs/data-stores/) to manage annotation information.
Video Annotator looks for items with type `Annotation` and expects the following properties.

## Body Properties

### bodyContent

The `bodyContent` property holds the content for the default body type (`Text`).

### bodyType

The `bodyType` property indicates which lens should be used to render the body content. Additional properties may be
added to the annotation item as needed by the particular body type.

## Target Properties

### h

The `h` property is the height of the bounding box for the target shape constraint.

### npt\_end

The `npt_end` property indicates how many seconds into the video the annotation ends being a valid annotation.
The default behavior is to begin fading out the shape on the play surface.

### npt\_start

The `npt_start` property indicates how many seconds into the video the annotation starts being a valid annotation.
The default behavior is to stop fading in the shape on the play surface.

### shapeType

The `shapeType` property indicates which lens should be used to render the shape constraint on the play surface.
Additional properties may be added to the annotation item as needed by the particular shape type.

### targetHeight

The `targetHeight` property indicates the height of the play surface in pixels. The vertical placement of the 
bounding box is based on the the proportion to the `targetHeight` property.

### targetURI

The `targetURI` property indicates the nominal URI of the video targeted by the annotation. This property is not
used in the current application when filtering annotations for display.

### targetWidth

The `targetWidth` property indicates the height of the play surface in pixels. The horizontal placement of the 
bounding box is based on the the proportion to the `targetWidth` property.

### w

The `w` property is the width of the bounding box for the target shape constraint.

### x

The `x` property is the horizontal position of the center of the bounding box for the target shape constraint.

### y

The `y` property is the vertical position of the center of the bounding box for the target shape constraint.