# Video Annotator JavaScript

[video_annotator.coffee]("save:")

This JavaScript (CoffeeScript) ties together the OAC Video Annotation
toolkit and the Drupal server. This consists of several parts:

* import/export of annotations tying together the export/import JSON-LD API
  of the Video Annotation toolkit with the REST api provided by the Drupal
  plugin; 
* the construction and management of the user annotation tool UI based on
  configuration information from the Drupal plugin;
* the loading of video drivers (currently only the HTML5 driver).

The code is broken into two main sections:

    (($) ->

      _"Definitions"

      Drupal.behaviors.video_annotator =
        attach: (context, settings) ->

          _"Drupal Glue"

    )(jQuery)

**N.B.:** In code, the pattern `_"Named Section"` indicates that the code in
the named section should be included in that location. Some references are
to small snippets of code within a section. For example,
`_"Definitions:setup"` refers to the small section labeled `setup` under the
"Definitions" heading.

To build the JavaScript file from this file, run the following commands:

```
$ literate-programming video_annotator.coffee.md
$ coffee -c video_annotator.coffee
```

## Definitions

Everything is defined as part of the `OAC.Client.StreamingVideo.Drupal`
namespace. We assume that the Video Annotation toolkit has been loaded at
this point, so we use the existing `OAC.Client.StreamingVideo` namespace as
our root. 

    _"Definitions:setup"
    _"Definitions:uri construction"
    _"Definitions:csrl token"

    OAC.Client.StreamingVideo.namespace 'Drupal', (Drupal) ->
      _"Hooks"
      _"Controllers"
      _"Components"
      _"Application"

[setup](#)

We also assume that the `q` library is loaded. The toolkit does not depend 
on this library, but we do. The current Drupal MITHgrid module will load the 
`q` library since we plan on moving MITHgrid to using promises/futures 
instead of callbacks in the near future. We use promises to track 
information that we know we'll have eventually. In this case, we know that 
we'll be getting settings from Drupal, but we don't want to wrap all of the 
definitions in the function that Drupal's JavaScript will call to set 
everything up.

    settingsDeferred = Q.defer()
    settings = settingsDeferred.promise

[uri construction](#)

    uri_from_template = (template, variables) ->
      if template?
        out = template.replace('{id}', variables.id)
        if Q.isFulfilled settingsDeferred
          out = out.replace('{scope_id}', settings.inspect().value?.scope_id)
        out

[csrl token](#)

We need the CSRL token for posting/putting/deleting back to the server.
**N.B.:** This should be provided by the Drupal module as part of the
settings.

    csrl = Q $.ajax
      url: '?q=services/session/token'
      type: 'GET'

## Hooks

We use a few hooks to allow other Durpal modules to extend the capabilities
of the video annotation tool. 
These are in the `OAC.Client.StreamingVideo.Drupal` namespace and define
callbacks to be used by all instances of the 
`OAC.Client.StreamingVideo.Drupal` application.

    shapeHandlers = []
    bodyHandlers = []
    builtApps = []

    _"Hooks:add shape handler"
    _"Hooks:register annotation ui"

[add shape handler](#)

To add a new shape to the toolbox for creating annotations, the JavaScript
component of a Drupal module should call `add_shape_handler` to register
the appropriate information needed to tie in with the Open Annotation
exchange mechanism and the annotation display area over the video play
surface.

The `shapeMode` should be the application mode that indicates that a new
annotation can be created using this shape handler. For example, the default
modes for new annotations are "Rectangle" and "Ellipse".

The `options` parameter should be a JavaScript object with the following
properties.

**export** is a function that should return a SVG fragment describing
the shape that the annotation uses as the target of the annotation.

**import** is a function that should return the critical information
needed extracted from the SVG fragment used in the annotation target. This
should be enough to reproduce the SVG fragment in the `renderAsSVG` function
as well as render the shape in the `lens` function.

**lens** is a function that should render the appropriate SVG shape
representing the annotation target. The `lens` function is passed an
SVG DOM element into which the rendering can be placed, the MITHgrid view
object managing the annotation display, and the JavaScript object with the
annotation information.

**rootSVGElement** is an array of root SVG elements that indicate that the
annotation might be using this shape as part of the annotation target.

    Drupal.add_shape_handler = (shapeMode, options) ->
      shapeHandlers.push
        mode: shapeMode
        options: options

      for app in builtApps
        do (app) ->
          app.ready ->
            app.addShapeType shapeMode,
              renderAsSVG: (model, itemId) ->
                item = model.getItem itemId
                options.export item
              rootSVGElement: options.rootSVGElement
              extractFromSVG: options.import
              lens: (container, view, model, itemId) ->
                app.initShapeLens container, view, model, itemId, (rendering) ->
                  item = model.getItem itemId
                  options.lens rendering, view, item
      null

[add body handler](#)

To add a new annotation body type, the JavaScript
component of a Drupal module should call `add_body_handler` to register
the appropriate information needed to tie in with the Open Annotation
exchange mechanism and the annotation body display area.

The `options` parameter should be a JavaScript object with the following
properties.

**export** is a function that should return a SVG fragment describing
the shape that the annotation uses as the target of the annotation.

**import** is a function that should return the critical information
needed extracted from the SVG fragment used in the annotation target. This
should be enough to reproduce the SVG fragment in the `renderAsSVG` function
as well as render the shape in the `lens` function.

**lens** is a function that should render the appropriate HTML
representing the annotation body. The `lens` function is passed an
HTML DOM element into which the rendering can be placed, the MITHgrid view
object managing the annotation display, and the JavaScript object with the
annotation information.

**rootSVGElement** is an array of root SVG elements that indicate that the
annotation might be using this shape as part of the annotation target.

    Drupal.add_body_handler = (bodyType, options) ->
      if options.lens?

        bodyHandlers.push
          type: bodyType
          export: options.export
          import: options.import
          lens: options.lens

        for app in builtApps
          do (app) ->
            app.ready ->
              # do something to add body lens to app
              app.addBodyType bodyType,
                renderAsOA: options.export
                extractFromOA: options.import
              app.addBodyLens bodyType, (c, v, m, i) ->
                app.initTextLens c, v, m, i, (lens) ->
                  lens.model = m
                  lens.itemId = i
                  options.lens(lens)

[register annotation ui](#)

When creating a new annotation management application instance outside the
default mechanism provided by this Drupal plugin, you should call the
`register_annotation_ui` function to have all of the registered shape
and body handlers added to the application. Any shape or body handlers added
after registration will be added to the application as well.

    Drupal.register_annotation_ui = (app) ->
      for handler in shapeHandlers
        do (handler) ->
          app.ready ->
            app.addShapeType handler.mode,
              renderAsSVG: (model, itemId) ->
                item = model.getItem itemId
                handler.export item
              rootSVGElement: handler.rootSVGElement
              extractFromSVG: handler.import
              lens: (container, view, model, itemId) ->
                app.initShapeLens container, view, model, itemId, (rendering) ->
                  item = model.getItem itemId
                  handler.lens rendering, view, item

      for handler in bodyHandlers
        do (handler) ->
          app.ready ->
            app.addBodyType handler.type,
              renderAsOA: handler.export
              extractFromOA: handler.import
            app.addBodyLens bodyType, (c, v, m, i) ->
              app.initTextLens c, v, m, i, (lens) ->
                lens.model = m
                lens.itemId = i
                handler.lens(lens)

      builtApps.push app
      null

## Controllers

We have a number of controllers which we use to build out the user interface
for annotating videos. Some of these are based on the UI used in the
[toolkit demo](http://umd-mith.github.io/OACVideoAnnotator/demo.html).

    _"Hover"
    _"Click"
    _"AnnoControls"
    _"TextControls"

### Hover

The hover controller provides two different events in response to the UI: 
`onFocus` and `onUnfocus`. We only use the `onFocus` event in the 
application, but include the `onUnfocus` event for completeness. **N.B.:** 
This controller may be moved into MITHgrid in the future.

    Drupal.defaults "Hover",
      bind:
        events:
          onFocus: null
          onUnfocus: null

    Drupal.namespace 'Hover', (Hover) ->
      Hover.initInstance = (args...) ->
        MITHgrid.Controller.initInstance 'OAC.Client.StreamingVideo.Drupal.Hover', args..., (that) ->
          that.applyBindings = (binding) ->
            binding.locate('').hover binding.events.onFocus.fire, binding.events.onUnfocus.fire

### Click

The click controller provides a simple `onSelect` event in response to a 
click in the UI. Binding this controller to an element will prevent the 
default click action in the browser. **N.B.:** This controller may be moved 
into MITHgrid in the future.

    Drupal.defaults "Click",
      bind:
        events:
          onSelect: null

    Drupal.namespace 'Click', (Click) ->
      Click.initInstance = (args...) ->
        MITHgrid.Controller.initInstance 'OAC.Client.StreamingVideo.Drupal.Click', args..., (that) ->
          that.applyBindings = (binding) ->
            binding.locate('').click (e) ->
              e.preventDefault()
              binding.events.onSelect.fire()

### AnnoControls

The annotation controls manage creation and editing of annotations on the 
video playsurface. An instance of this controller is created at the end of 
this file and bound to the DOM control point by each application instance.

This controller will fire the `onModeChange` with the name of the mode when 
the corresponding control element is clicked. The `events.onModeChange` 
should be hooked up to the `app.setCurrentMode` variable method.

    Drupal.defaults "AnnoControls",
      bind:
        events:
          onModeChange: null


    Drupal.namespace 'AnnoControls', (AnnoControls) ->
      clickController = Drupal.Click.initInstance {}

      AnnoControls.initInstance = (args...) ->
        MITHgrid.Controller.initInstance 'OAC.Client.StreamingVideo.Drupal.AnnoControls', args..., (that, container) ->
          that.applyBindings = (binding) ->


### TextControls

The text controls controller provides simple save, edit, delete functions 
for editing annotation bodies. It does not provide the UI elements. Those 
will be configured elsewhere based on information passed in from the PHP
code. Instead, it ties into the elements and exposes a set of stateful 
events: edit, save, cancel, and delete.

When in editing mode, only save and cancel are shown and will fire. When not 
in editing mode, only edit and delete are shown and will fire.

    Drupal.defaults "TextControls",
      selectors:
        'edit': '.edit'
        'save': '.save'
        'cancel': '.cancel'
        'delete': '.delete'
      bind:
        events:
          onCancel: null
          onDelete: null
          onEdit: null
          onSave: null

    Drupal.namespace 'TextControls', (TextControls) ->
      clickController = Drupal.Click.initInstance {}

      TextControls.initInstance = (args...) ->
        MITHgrid.Controller.initInstance 'OAC.Client.StreamingVideo.Drupal.TextControls', args..., (that) ->
          that.applyBindings = (binding) ->
            shown = false
            inEditing = false
            _"TextControls:elements"
            _"TextControls:bindings"
            _"TextControls:triggers"
            _"TextControls:event handlers"
            _"TextControls:setup"

[setup](#)

We make sure we're not in edit mode or visible when we start up.

    resetEditingMode()
    binding.eventHide()

[elements](#)

We cache all of the UI elements we'll be binding to. We also show/hide these
elements depending on which mode this controller is in.

    editEl = binding.locate('edit')
    saveEl = binding.locate('save')
    cancelEl = binding.locate('cancel')
    deleteEl = binding.locate('delete')

[bindings](#)

We bind the click controller instance to each of the elements. This gives us 
a set of events that we can listen to for mouse clicks. If we wanted to 
initiate one of the four commands by some other means, this is where we 
would change our event input mechanism.

    editBinding = clickController.bind editEl
    saveBinding = clickController.bind saveEl
    cancelBinding = clickController.bind cancelEl
    deleteBinding = clickController.bind deleteEl

[triggers](#)

We want to trigger various events based on the mode we're in and which 
control elements we expect the user to be able to see or access. For 
example, if not in the editing mode (`inEditing` is `false`), then only the 
"edit" and "delete" actions should be available.

    setEditingMode = ->
      _"TextControls:set editing mode"
    resetEditingMode = ->
      _"TextControls:reset editing mode"

    editBinding.events.onSelect.addListener (e) ->
      if shown and not inEditing
        setEditingMode()
        binding.events.onEdit.fire()

    saveBinding.events.onSelect.addListener (e) ->
      if shown and inEditing
        resetEditingMode()
        binding.events.onSave.fire()

    cancelBinding.events.onSelect.addListener (e) ->
      if shown and inEditing
        resetEditingMode()
        binding.events.onCancel.fire()

    deleteBinding.events.onSelect.addListener (e) ->
      if shown and not inEditing
        binding.events.onDelete.fire()

[set editing mode](#)

We need to coordinate the showing and hiding of different elements based on 
our editing mode. These functions provide us with an easy way to manage the 
mode and the display of these elements. We use them in the translation of 
click events to semantically meaningful events that we expose to the 
application.
    
    inEditing = true
    editEl.hide()
    saveEl.show()
    deleteEl.hide()
    cancelEl.show()

[reset editing mode](#)

    inEditing = false
    editEl.show()
    saveEl.hide()
    deleteEl.show()
    cancelEl.hide()

[event handlers](#)

We provide some event handlers that the application can call to show, hide, 
and position the controls. The text controller will fire events only when it 
is visible.

    binding.eventShow = ->
      _"TextControls:show event"
    binding.eventHide = ->
      _"TextControls:hide event"
    binding.eventMove = (top, right) ->
      _"TextControls:move event"

[show event](#)

When we show the text controls, we want to reset the edit mode so that the 
user has to select the edit control before being able to edit the annotation 
body.

    resetEditingMode()
    binding.locate('').show()
    shown = true

[hide event](#)

When we hide the text controls, we aren't concerned about setting the edit 
mode to a particular state since the act of hiding and the state of being 
hidden are enough to stop any events from this controller.

    binding.locate('').hide()
    shown = false

[move event](#)

When we move the text controls, we are given the upper right coordinates of 
where the text controls should appear. This assumes that the text controls 
are positioned to the left of the annotation body display.

    # given (top, right) ...

    if shown and inEditing
      resetEditingMode()
      @events.onCancel.fire()

    width = binding.locate('').width()

    binding.locate('').css
      top: "#{top}px"
      left: "#{right-width}px"

## Components

    _"AnnoControlComponent"

### AnnoControlComponent

This component will build out the DOM based on information passed in from 
the Drupal attachment process (provided by the PHP side of this plugin). The 
AnnoController instance will bind to the same container as passed to this 
component after this component is finished adding the appropriate elements 
to the DOM.

    Drupal.defaults 'AnnoControlComponent',
      events:
        onModeChange: null

    Drupal.namespace 'AnnoControlComponent', (ACC) ->
      clickController = Drupal.Click.initInstance {}

      ACC.initInstance = (args...) ->
        MITHgrid.initInstance "OAC.Client.StreamingVideo.Drupal.AnnoControlComponent", args..., (that, container) ->
          controls = that.options.controls
          perms = that.options.permissions
          els =
            constraint: $("<div></div>")
            control: $("<div></div>")
          $(container).append( els.control )
          $(container).append( els.constraint )
          names = ((nom for nom of controls).sort (a,b) -> controls[a].weight - controls[b].weight)
          for name in names
            config = controls[name]
            if els[config.type]? and (not(config.permission) or perms[config.permission])
              do (config) ->
                if config.iconClass?
                  innerEl = $("<i class='#{config.iconClass}'></i>")
                else
                  innerEl = $("&nbsp;")
                el = $("<a href='#' class='#{config.class}'></a>")
                el.append innerEl
                els[config.type].append el

                binding = clickController.bind el
                binding.events.onSelect.addListener ->
                  if $(el).hasClass 'active'
                    $(el).removeClass 'active'
                    that.events.onModeChange.fire null
                  else
                    $(container).find("a").removeClass 'active'
                    $(el).addClass 'active'
                    that.events.onModeChange.fire config.mode

## Application

We define the application here. 

    Drupal.defaults 'Application',
      viewSetup: """
        <div class="video_annotator">
          <div class="activation-control">
            <div style="float: right;"><a href="#"><i class="fa open-close-control fa-chevron-down"></i></a></div>
            <span class="counter">0</span> comments
          </div>
          <div class="annotations">
            <div class="annotation-controls"></div>
            <div class="annotation-text"></div>
          </div>
          <div class="edit-controls">
            <span class="edit"><a href="#" title="edit annotation"></a></span>
            <span class="save"><a href="#" title="save edit"></a></span>
            <span class="cancel"><a href="#" title="cancel edit"></a></span>  
            <span class="delete"><a href="#" title="delete annotation"></a></span>
          </div>
          <div class="canvas"></div>
        </div>
      """

    Drupal.namespace 'Application', (Application) ->

      textController = OAC.Client.StreamingVideo.Drupal.TextControls.initInstance {}
      hoverController = OAC.Client.StreamingVideo.Drupal.Hover.initInstance {}

      Application.initInstance = (args...) ->
        OAC.Client.StreamingVideo.Application.initInstance "OAC.Client.StreamingVideo.Drupal.Application", args..., (app, container) ->
          appFn = -> app
          freezeAjax = false
          csrl = app.options.csrl

          app.freezeUpdates = -> freezeAjax = true
          app.unfreezeUpdates = -> freezeAjax = false

          Drupal.register_annotation_ui app
          
          app.ready ->
            _"Data Synchronization"
            _"Annotation Display"

### Data Synchronization

We want to tie into the data store and report any changes back to the server.
This is done as soon as we know there is a change in the data. We don't 
require that someone take some action other than edit, create, or delete an 
annotation in the usual interface. When we are allowing updates in the data 
store to get reflected back to the server, we need to go through each item 
in the list of updated items and figure out if the item is in one of three 
states:

* deleted: the item id is no longer in the model,
* updated: the item id is in the model and ends in `.json`, or
* created: the item id is in the model and does not end in `.json`.

For any annotation that is being modified or deleted, the id of the 
annotation is the URL of the annotation, and thus the URL to which we PUT or 
DELETE. Otherwise, we're creating an annotation and POST to the collection 
URL.

    _"Data Synchronization:context"

    itemToJSON = (item) ->
      _"Data Synchronization:serialize"

    app.dataStore.canvas.events.onModelChange.addListener (model, list) ->
      return if freezeAjax
      for id in list
        if not model.contains id
          if id[ -5 .. ] == ".json"
            req = _"Data Synchronization: delete"
          
        else
          item = model.getItem id
          if id[ -5 .. ] == ".json"
            
            req = _"Data Synchronization: update"
            
          else
            
            req = _"Data Synchronization: create"

        req?.done()   
      null

[delete](#)

    csrl.then (token) ->
      Q $.ajax
        url: id
        type: 'DELETE'
        headers:
          'X-CSRF-Token': token

[update](#)

    csrl.then (token) ->
      Q $.ajax
        url: id
        headers:
          'X-CSRF-Token': token
        contentType: 'application/json'
        type: 'PUT'
        data: JSON.stringify
          '@context': json_context
          '@graph': [ itemToJSON item ]

[create](#)

When we create a new annotation on the server, we want to replace the 
annotation in the browser so that the id of the annotation in the browser 
matches the URL of the annotation as stored on the server.

    do ->
      q = csrl.then (token) ->
        json = itemToJSON item
        delete json.id
        Q $.ajax
          url: uri_from_template app.options.urls.collection.post,
            id: id
          headers:
            'X-CSRF-Token': token
          contentType: 'application/json'
          type: 'POST'
          data: JSON.stringify
            '@context': json_context
            '@graph': [ json ]
      q.then (response) ->
        if response?['@graph']?
          model.removeItems [ item.id ]
          item.id = response['@graph'][0]['@id']
          item.type or= 'Annotation'
          model.loadItems [ item ]
        response

[context](#)

We want to start with a fairly well-rounded context for Open Annotation but
allow plugins to augment the context with additional properties.

    buildContext = ->
      context = 
        _"Data Synchronization:core context"

      # here, we'll look for hook handlers to modify the context

      context

    json_context = buildContext()

[core context](#)

This is the core context for our JSON-LD export from the annotation
application to the Drupal server.

    oa: 'http://www.w3.org/ns/oa#'
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
    cnt: 'http://www.w3.org/2011/content#'
    dc: 'http://purl.org/dc/elements/1.1/'
    dcterms: 'http://purl.org/dc/terms/'
    exif: 'http://www.w3.org/2003/12/exif/ns#'
    foaf: 'http://xmlns.com/foaf/0.1/'
    height: 'exif:height'
    width: 'exif:width'
    id: '@id'
    type: '@type'
    graph: '@graph'
    value: 'rdf:value'
    annotatedBy:
      '@id': 'oa:annotatedBy'
      '@type': '@id'
    serializedBy:
      '@id': 'oa:serializedBy'
      '@type': '@id'
    motivatedBy:
      '@id': 'oa:motivatedBy'
      '@type': '@id'
    equivalentTo:
      '@id': 'oa:equivalentTo'
      '@type': '@id'
    styledBy:
      '@id': 'oa:styledBy'
      '@type': '@id'
    cachedSource:
      '@id': 'oa:cachedSource'
      '@type': '@id'
    conformsTo:
      '@id': 'dcterms:conformsTo'
      '@type': '@id'
    default:
      '@id': 'oa:default'
      '@type': '@id'
    first:
      '@id': 'rdf:first'
      '@type': '@id'
    rest:
      '@id': 'rdf:rest'
      '@container': '@list'
      '@type': '@id'
    body:
      '@id': 'oa:hasBody'
      '@type': '@id'
    target:
      '@id': 'oa:hasTarget'
      '@type': '@id'
    chars: 'cnt:chars'
    format: 'dc:format'
    source:
      '@id': 'oa:hasSource'
      '@type': '@id'
    selector:
      '@id': 'oa:hasSelector'
      '@type': '@id'
    scope:
      '@id': 'oa:hasScope'
      '@type': '@id'
    item:
      '@id': 'oa:item'
      '@type': '@id'

[serialize](#)

We want to serialize individual annotations using a set JSON context to make 
it easier. This mirrors how we're managing JSON-LD serialization on the 
server side in the Drupal module. We could have used the export API of the 
annotation application, but we want to export a single annotation instead of 
all of the annotations.

    # given (item) ...

    video_annotation_body_json  = (item) ->
      _"Data Synchronization:serialize the body"

    video_annotation_target_json = (item) ->
      _"Data Synchronization:serialize the target"

    anno =
      id: item.id[0]
      type: 'oa:Annotation'
      body: video_annotation_body_json item
      target: video_annotation_target_json item

    anno.target.scope = document.URL

    anno

[serialize the body](#)

    # given (item) ...

    if "Text" in item.bodyType
      
      type: ["cnt:ContentAsText", "dctypes:Text"]
      format: item.bodyType[0]
      chars: item.bodyContent[0]

    else

      {}

[serialize the target](#)

    # given (item) ...

    video_annotation_timing_json = (item) ->
      _"Data Synchronization:serialize target timing"

    video_annotation_shape_json = (item) ->
      _"Data Synchronization:serialize target shape"

    target =
      source: item.targetURI?[0]
      type: 'oa:SpecificResource'

    selectors = [video_annotation_timing_json(item), video_annotation_shape_json(item)]
    selectors = (s for s in selectors when s?)

    if selectors.length > 1
      target.selector =
        item: selectors
        type: 'oa:CompoundSelector'
    else if selectors.length > 0
      target.selector = selectors[0]

    target


[serialize target shape](#)

    # given (item) ...

    shape = {}

    if item.shapeType?
      switch item.shapeType[0]
        when 'Rectangle'
          svg = "<rect x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"
        when 'Ellipse'
          svg = "<ellipse x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"
      if svg?
        shape.type = 'oa:SvgSelector'
        shape.chars = svg
        if item.targetWidth?
          shape.width = item.targetWidth[0]
        if item.targetHeight?
          shape.height = item.targetHeight[0]

        shape

[serialize target timing](#)

    # given (item) ...

    if item.npt_start?[0]? and item.npt_end?[0]?
      type: 'oa:FragmentSelector'
      conformsTo: 'http://www.w3.org/TR/media-frags/'
      value: "t=npt:#{item.npt_start[0]},#{item.npt_end[0]}"

### Annotation Display

We assume that the annotations will be displayed in a way that allows 
selection of an annotation based on the textual content of that annotation, 
similar to in the demo. For now, we also assume that the DOMs of the text 
controls and the body display will be descendents of the application's 
container. This means that each copy of the application will have its own 
text controls and display of body content.

    annotationDisplay = null

    _"Body Display"
    _"Text Controls"
    _"Annotation Controls"

#### Text Controls

    textControls = textController.bind $(container).find(".edit-controls")

We pass along the text control events to the rendering of the annotation 
body if an annotation is currently in focus and it has a rendering. 
Otherwise, we ignore the event in the annotation body display.

    textControls.events.onEdit.addListener   -> 
      annotationDisplay.getFocusedRendering()?.eventEdit()

    textControls.events.onDelete.addListener -> 
      annotationDisplay.getFocusedRendering()?.eventDelete()

    textControls.events.onSave.addListener   -> 
      annotationDisplay.getFocusedRendering()?.eventSave()

    textControls.events.onCancel.addListener -> 
      annotationDisplay.getFocusedRendering()?.eventCancel()

#### Annotation Controls

    settings.then (settings) ->
      annoControlDisplay = Drupal.AnnoControlComponent.initInstance $(container).find(".annotation-controls"),
        controls: settings.controls or {}
        permissions: settings.permissions

      #annoControls = annoController.bind $(container).find(".annotation-controls")

      annoControlDisplay.events.onModeChange.addListener app.setCurrentMode

#### Body Display

    bodyLenses = []

    app.addBodyLens = (type, lens) ->
      bodyLenses.push [ type, lens ]

    settings.then (settings) ->
      annotationDisplay = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance $(container).find('.annotation-text'),
        dataView: app.dataView.currentAnnotations
        lensKey: ['.bodyType']
        application: appFn

      for l in bodyLenses
        annotationDisplay.addLens l[0], l[1]

      app.initTextLens = annotationDisplay.initTextLens
      app.addBodyLens = annotationDisplay.addLens
      bodyLenses = null

      annotationDisplay.addLens "Text", (container, view, model, itemId) ->
        _"Annotation Body Text Lens"

We highlight the annotation body based on which annotation is currently in 
focus. This is an application-wide setting (but may be different for each 
instance of the application, and thus for each video on the page). All 
changes to which annotation is in focus should be done by calling 
`app.setActiveAnnotation()` with the `id` of the annotation.

      app.events.onActiveAnnotationChange.addListener annotationDisplay.eventFocusChange

#### Annotation Body Text Lens

We base our display of the annotation body on a fairly simple text display. 
Other annotation body types can be defined and will work as long as a 
suitable lens is provided.

    # given (container, view, model, itemId) ...

    rendering = annotationDisplay.initTextLens container, view, model, itemId
    hoverBinding = hoverController.bind rendering.el
    inEditing = false
    textEl = $(rendering.el).find(".body-content")
    inputEl = $("<textarea></textarea>")
    rendering.el.append(inputEl)
    inputEl.hide()
    item = model.getItem itemId
    hoverBinding.events.onFocus.addListener -> app.setActiveAnnotation itemId
    superFocus = rendering.eventFocus
    superUnfocus = rendering.eventUnfocus

    canEditThis = settings.permissions.bypass or settings.permission.edit_any or (settings.permission.edit_own and (settings.user_id in item.owner))

    canDeleteThis = settings.permissions.bypass or settings.permission.delete_any or (settings.permission.delete_own and (settings.user_id in item.owner))

    rendering.eventFocus = ->
      superFocus()
      if canEditThis or canDeleteThis
        pos = $(rendering.el).position()
        textControls.eventMove pos.top, pos.left
        textControls.eventShow()
      else
        textControls.eventHide()

    rendering.eventUnfocus = ->
      textControls.eventHide()
      superUnfocus()

    rendering.eventEdit = ->
      if not inEditing and canEditThis
        app.lockActiveAnnotation()
        inEditing = true
        text = textEl.text()
        textEl.hide()
        inputEl.show()
        inputEl.val(text)

    superDelete = rendering.eventDelete
    rendering.eventDelete = ->
      if not inEditing and canDeleteThis
        superDelete()

    rendering.eventCancel = ->
      if inEditing and canEditThis
        app.unlockActiveAnnotation()
        inEditing = false
        textEl.show()
        inputEl.hide()

    rendering.eventSave = ->
      if inEditing and canEditThis
        app.unlockActiveAnnotation()
        inEditing = false
        textEl.show()
        rendering.eventUpdate inputEl.val()
        inputEl.hide()

    rendering


## Drupal Glue

We use Drupal's mechanisms to bootstrap the annotation client. This involves 
getting settings from the Drupal module and any context provided by Drupal.

    _"Drupal Glue:resolve settings"

    annotationJSONLD = _"Drupal Glue:fetch annotations"

    hoverController = OAC.Client.StreamingVideo.Drupal.Hover.initInstance {}
    clickController = OAC.Client.StreamingVideo.Drupal.Click.initInstance {}
    
    OAC.Client.StreamingVideo.Player.onNewPlayer.addListener (playerobj) ->
      _"Drupal Glue:instantiate application"

[resolve settings](#)
    
    settingsDeferred.resolve settings.video_annotator

[fetch annotations](#)

We gather all annotations from the server in one call we need to pull in 
available annotations from the server based on the page we're on and the url 
of the player's video this page: window.document.location.href or window.
document.location.pathname

    Q $.ajax
      url: uri_from_template settings?.video_annotator?.urls?.collection?.get, { id: 0 }
      dataType: 'json'

[instantiate application](#)

We walk through the DOM and figure out which embedded videos we can work
with. For each one, we instantiate the application that manages displaying 
and editing annotations. We give it all of the annotations we know about for 
this node and let it figure out which ones it cares about.

We wrap the player DOM element so that we can better position and manage the 
annotation interface elements. We're displaying the textual annotations 
below the video player on the page. As long as the mouse is over the 
interface (either the video, text, or controls), the annotation interface 
open/close buttons will show up.

    # given (playerobj) ...

    $(playerobj.container).wrap $("<div></div>")
    el = $(playerobj.container).parent()
    appEl = $("<div></div>")
    el.append(appEl)

    app = OAC.Client.StreamingVideo.Drupal.Application.initInstance appEl,
      player: playerobj
      csrl: csrl
      urls: settings.video_annotator.urls

    app.run()
    app.ready ->
      controlsShown = false

      el.find(".video_annotator").width playerobj.getSize()[0]

      playerobj.events.onResize.addListener (size) ->
        el.find(".video_annotator").width size[0]

      hoverBinding = hoverController.bind el
      hoverBinding.events.onFocus.addListener ->
        if not controlsShown
          el.find(".activation-control").show()
      hoverBinding.events.onUnfocus.addListener ->
        if not controlsShown
          el.find(".activation-control").hide()

      annoViewControlBinding = clickController.bind el.find(".activation-control .open-close-control")

      annoViewControlBinding.events.onSelect.addListener ->
        if controlsShown
          el.find(".annotations").slideUp()
          controlsShown = false
          el.find(".activation-control .open-close-control").addClass("fa-chevron-down")
          el.find(".activation-control .open-close-control").removeClass("fa-chevron-up")
          app.setActiveAnnotation(null)
        else
          el.find(".annotations").slideDown()
          controlsShown = true
          el.find(".activation-control .open-close-control").addClass("fa-chevron-up")
          el.find(".activation-control .open-close-control").removeClass("fa-chevron-down")

      el.find(".annotation-controls").show()
      el.find(".activation-control").hide()
      el.find(".annotations").hide()

      counterEl = el.find(".counter")
      app.dataStore.canvas.events.onModelChange.addListener (m, l) ->
        $(counterEl).text m.size()

    annotationJSONLD.then (annos) ->
      app.freezeUpdates()
      d = Q.defer()
      app.importJSONLD annos, ->
        d.resolve null
      d.promise
    .then(app.unfreezeUpdates)
    .done()

## Educational Community License, Version 2.0

Copyright 2013, 2014 University of Maryland. Licensed under the Educational 
Community License, Version 2.0 (the "License"); you may not use this file 
except in compliance with the License. You may obtain a copy of the License 
at

[http://www.osedu.org/licenses/ECL-2.0](http://www.osedu.org/licenses/ECL-2.0)

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT 
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
License for the specific language governing permissions and limitations 
under the License.