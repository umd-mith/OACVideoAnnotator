# Video Annotator Drupal Module

This module provides simple annotation capabilities for videos embedded in a
Drupal node. The supported embedding formats depend on the available drivers.
For now, this is limited to videos embedded using the HTML5 video element
without iframes.

The PHP and JavaScript both have hooks for extending the types of shapes and
bodies that can be used to annotate a video. See the PHP and JavaScript Hooks sections below.

## Installation

The [general directions for installing modules in Drupal 7](https://drupal.org/documentation/install/modules-themes/modules-7)
should work for this module. The following are additional installation
requirements and settings that you may need to follow for this module to work
properly.

### Require Modules

* jquery_update
* services

### Configuring Services

You need to add a "video_annotations" service under Administration >> Structure >> Services.

For each of the choices in the drop-down menu associated with the service, 
we outline the needed or expected settings.

#### Edit Resources

The only checked resource should be video_annotation. Under this, all of the
CRUD operations should be selected.

#### Edit Server

The response formatters should have "json" selected.

The request parsing should have "application/json" selected.

#### Edit

The machine-readable name of the endpoint should be "video_annotations".

The server should be "REST".

The path to endpoint should be "video_annotation".

The authentication mechanism should be "Session authentication".

## PHP Hooks

### HOOK_video_annotation_control_info()

This hook allows the addition of controls for creating annotations or
controlling the video player. The hook should return an array of arrays using
the following pattern:

```php
$controls["foo"] = array(
  "weight" => integer,
  "type" => "constraint" || "control",
  "mode" => "ShapeOrControlName",
  "class" => "css-class-for-icon",
  "permission" => 'create' || 'delete' || 'update'
);
```

weight 
:   An integer used for relative ordering of controls in the user
interface. Controls are divided into 'control' and 'constraint' sections 
based on their type.

type
:   This should be set to 'constraint' if the control represents a new shape 
that can be drawn on the playsurface to represent a constraint within the 
video frame. A 'constraint' control will create a new annotation when it is 
applied to the playsurface. This should be set to 'control' if it does not 
lead to a new annotation (e.g., a control to start or stop the video 
playback).

mode
:   This is the name of the JavaScript application mode that is triggered 
when the control is selected. For constraints, this should be the shape name 
associated with any lenses or other shape-specific processing.

class
:   This is the name of the CSS class that should be applied to the <a/> 
element when building the control UI.

permission
:   If this is a constraint control, then the permission should be set to 
the permission required of the user to use this control. Typically, this 
will be 'create' for adding new annotations.


### HOOK_video_annotation_context_alter(&$context)

This hook allows you to add additional context to the JSON-LD context used 
to flatten the JSON before extracting annotations. The additions should 
follow the form of the JSON-LD context except use PHP array()s. This hook is 
intended for modules extending the types of constraints or bodies allowed in 
a video annotation.


### HOOK_video_annotation_body_info($body_id, $data)

This hook allows you to support new body types by returning an array with 
appropriate keys based on the information in $data for the given $body_id.


### HOOK_video_annotation_target_info($target_id, $data)

This hook allows you to support new target properties that are not 
constraints by returning an array with appropriate keys based on the 
information in $data for the given $target_id.


### HOOK_video_annotation_timing_info($constraint_id, $data)

This hook allows you to support new ways of specifying the timespan in the 
video which the annotation targets.


### HOOK_video_annotation_shape_info($constraint_id, $data)

This hook allows you to support new shapes for targeting particular areas 
within the video frame.


### HOOK_video_annotation_body_json($data)

This hook allows you to provide JSON-LD properties for the particular type 
of body appropriate for the given $data.


### HOOK_video_annotation_target_json($data)

This hook allows you to provide JSON-LD properties that should be attached 
to the target but aren't part of a constraint.


### HOOK_video_annotation_time_json($data)

This hook allows you to provide the JSON-LD properties for targeting a range 
of time within the video. The resulting JSON-LD will be a node describing an 
Open Annotation constraint that will be an item in a compound constraint in 
the final JSON-LD structure.


### HOOK_video_annotation_shape_json($data)

This hook allows you to provide the JSON-LD properties for a particular 
shape targeting an area within the frame. The resulting JSON-LD will be a 
node describing an Open Annotation constraint that will be an item in a 
compound constraint in the final JSON-LD structure.



## JavaScript Hooks

The JS hooks need to be able to add shape types:

```JavaScript
OAC.Client.StreamingVideo.Drupal.add_shape_handler("ShapeName", {
  export: function(item) { ... },
  rootSVGElement: [''],
  import: function(svg) { ... },
  lens: function(rendering, view, item) { ... }
});
```

The "ShapeName" is the name of the mode that can be used to define a UI 
control element in PHP.

The rootSVGElement is a list of strings that can match SVG elements 
indicating that this is the shape of the constraint on the playsurface.

extractFromSVG returns a JS object containing the x, y, height, width, and 
other information needed to draw and manage the constraint shape on the 
playsurface.

```JavaScript
OAC.Client.StreamingVideo.Drupal.add_body_handler('TextType', {
  export: function() { ... },
  import: function() { ... },
  lens: function(rendering, view, item) { ... }
});
```

The "TextType" is the type of annotation body that should be rendered with 
the given lens/template.

