## Hooks

### HOOK_video_annotation_context_alter(&$context)

This hook allows you to add additional context to the JSON-LD context used to flatten the JSON before extracting annotations.

### HOOK_video_annotation_body_info($body_id, $data)

This hook allows you to support new body types by returning an array with appropriate keys based on the information in $data for the given $body_id.

### HOOK_video_annotation_target_info($target_id, $data)

This hook allows you to support new target properties that are not constraints by returning an array with appropriate keys based on the information in $data for the given $target_id.

### HOOK_video_annotation_timing_info($constraint_id, $data)

This hook allows you to support new ways of specifying the timespan in the video which the annotation targets.

### HOOK_video_annotation_shape_info($constraint_id, $data)

This hook allows you to support new shapes for targeting particular areas within the video frame.

### HOOK_video_annotation_body_json($data)

This hook allows you to provide JSON-LD properties for the particular type of body appropriate for the given $data.

### HOOK_video_annotation_target_json($data)

This hook allows you to provide JSON-LD properties that should be attached to the target but aren't part of a constraint.

### HOOK_video_annotation_time_json($data)

This hook allows you to provide the JSON-LD properties for targeting a range of time within the video. The resulting JSON-LD will be a node describing an Open Annotation constraint that will be an item in a compound constraint in the final JSON-LD structure.

### HOOK_video_annotation_shape_json($data)

This hook allows you to provide the JSON-LD properties for a particular shape targeting an area within the frame. The resulting JSON-LD will be a node describing an Open Annotation constraint that will be an item in a compound constraint in the final JSON-LD structure.

