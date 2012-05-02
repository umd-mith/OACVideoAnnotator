---
layout: docs
title: How Video Annotator Works
---
Video Annotator is a developer's toolkit consisting of a number of [MITHgrid](/mithgrid/) components that you can use to add
annotation capabilities to videos embedded in your web site. See [the demo](/OACVideoAnnotator/demo.html) for an example of
the toolkit providing a simple annotation capability with an HTML 5 video tag.

![Diagram of how the Video Annotator components relate.](/OACVideoAnnotator/images/OAC-VideoAnnotation-Parts.png "Video Annotator components")

The toolkit consists of four major parts: 

* the **core annotation manager** 
* a **Raphaël.js-based presentation** that is placed over the video play surface,
* a **annotation content presentation** that can tie into the core annotation manager's data store, and
* the **video player driver**.

Additional components provide a way to create controls and other user interface elements for interacting with the annotations.

## Core Annotation Manager

The heart of the Video Annotator is the annotation manager, a small application that stores the annotation data and provides a
central place to keep track of such things as which annotations are in scope for the current position of the video play head, or
which type of shape is being drawn for a new annotation (this will likely move to the raphael presentation).

Annotations are created, updated, and otherwise managed through this component. Convenience methods are provided to import and
export annotations as RDF/JSON using the Open Annotation model in addition to direct manipulation of the MITHgrid data store.

## Raphaël.js-based Presentation

Video Annotator uses Raphaël to manage an SVG canvas that is placed over the video play surface. It is on this surface that
Video Annotator draws the various shapes representing the annotation targets.

## Annotation Content Presentation

Video Annotator uses a simple HTML presentation for the annotation bodies.

## Video Player Driver

Video Annotator uses video player drivers to abstract the control of the video player. The library comes with an HTML 5
video driver, but the interface is simple. All that is needed to support a new video player is an appropriate driver.
Most of the time, you never need to think about which driver is being used.