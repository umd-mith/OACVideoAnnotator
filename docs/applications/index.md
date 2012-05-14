---
layout: docs
title: Applications
---
# Applications

* auto-generated TOC:
{:toc}

**Namespace:** OAC.Client.StreamingVideo.Application

There is a single Video Annotator application that should be sub-classed to add in any editing or other
behaviors that you need in your particular use case. See [the demo](/OACVideoAnnotator/demo.html) for an
example of how this can be done.

## Variables

Each application instance has a number of variables to track application state, such as the current position in
the video or the current annotation receiving focus in the user interface.

### ActiveAnnotation

The active annotation is the one receiving focus in the user interface.

#### getActiveAnnotation

#### setActiveAnnotation

#### lockActiveAnnotation

#### unlockActiveAnnotation

#### events.onActiveAnnotationChange.addListener

#### events.onActiveAnnotationChange.fire

### CurrentTime

#### getCurrentTime

#### setCurrentTime

#### events.onCurrentTimeChange.addListener

#### events.onCurrentTimeChange.fire

### TimeEasement

#### getTimeEasement

#### setTimeEasement

#### events.onTimeEasementChange.addListener

#### events.onTimeEasementChange.fire

### CurrentMode

#### getCurrentMode

#### setCurrentMode

#### events.onCurrentModeChange.addListener

#### events.onCurrentModeChange.fire

## Data Views

Each application instance has a data view that filters out currently appropriate annotations. This set
consists of those annotations for which the `CurrentTime` is between the `.npt_start` and `.npt_end`
times as well as some time beyond those times based on the value of the `TimeEasement` variable.

The data view is available as the `dataViews.currentAnnotations` property of the application.

## Data Store

Each application instance has a data store available as its `dataStores.canvas` property. See
[the data schema documentation](/OACVideoAnnotator/docs/data-schema/) for information about the data schema.

## Presentations

Each application instance has a presentation managing the shapes on the play surface. The presentation
is an instance of `OAC.Client.StreamingVideo.Presentation.RaphaelCanvas` available as the `presentations.raphsvg` property.
The presentation takes its data from the `currentAnnotations` data view.

