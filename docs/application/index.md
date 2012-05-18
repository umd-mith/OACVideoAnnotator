---
layout: docs
title: Application
---
# Application

* auto-generated TOC:
{:toc}

**Namespace:** OAC.Client.StreamingVideo.Application

There is a single Video Annotator application that should be sub-classed to add in any editing or other
behaviors that you need in your particular use case. See [the demo](/OACVideoAnnotator/demo.html) for an
example of how this can be done.

## Methods

Each application instance has the following methods for managing the application's configuration or set of annotations.

### Shapes

The Video Annotator has a richer API for managing shapes than bodies because its focus is on the video. 

#### addShapeType

#### initShapeLens

This method is exported from the SVG-based presentation once the presentation is set up, which happens after the `run` method
is run.

### Bodies

#### addBodyType

Because the video annotation application doesn't manage the presentation of annotation bodies, the `addBodyType` only
manages information needed to import or export annotation bodies using the Open Annotation data model.

### Data Import/Export

#### insertAnnotation

#### importData

#### exportData

### Miscellaneous

#### getPlayer

#### getCurrentModeClass

## Data Store

Each application instance has a data store available as its `dataStores.canvas` property. See
[the data schema documentation](/OACVideoAnnotator/docs/data-schema/) for information about the data schema.

## Data Views

Each application instance has a data view that filters out currently appropriate annotations. This set
consists of those annotations for which the `CurrentTime` is between the `.npt_start` and `.npt_end`
times as well as some time beyond those times based on the value of the `TimeEasement` variable.

The data view is available as the `dataViews.currentAnnotations` property of the application.

## Presentations

Each application instance has a presentation managing the shapes on the play surface. The presentation
is an instance of `OAC.Client.StreamingVideo.Presentation.RaphaelCanvas` available as the `presentations.raphsvg` property.
The presentation takes its data from the `currentAnnotations` data view.


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

