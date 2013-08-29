# Video Annotator JavaScript

[video_annotator.coffee]("save:")

This JavaScript (CoffeeScript) ties together the OAC Video Annotation toolkit and the Drupal server. This consists of several parts:

* import/export of annotations tying together the export/import JSON-LD API of the Video Annotation toolkit with the REST api provided by the Drupal plugin; 
* the construction and management of the user annotation tool UI based on configuration information from the Drupal plugin;
* the loading of video drivers (currently only the HTML5 driver).

The code is broken into two main sections:

    (($) ->
 
      _"Definitions"

      Drupal.behaviors.video_annotator =
        attach: (context, settings) ->

          _"Drupal Glue"

    )(jQuery)

*N.B.:* In code, the pattern `_"Named Section"` indicates that the code in the named section should be included in that location. Some references are to small snippets of code within a section. For example, `_"Definitions:setup"` refers to the small section labeled `setup` under the "Definitions" heading.

## Definitions

Everything is defined as part of the `OAC.Client.StreamingVideo.Drupal` namespace. We assume that the Video Annotation toolkit has been loaded at this point, so we use the existing `OAC.Client.StreamingVideo` namespace as our root. 

    _"Definitions:setup"

    OAC.Client.StreamingVideo.namespace 'Drupal', (Drupal) ->
      _"Controllers"
      _"Components"
      _"Application"

[setup](#)

We also assume that the `q` library is loaded. The toolkit does not depend on this library, but we do. The current Drupal MITHgrid module will load the `q` library since we plan on moving MITHgrid to using promises/futures instead of callbacks in the near future. We use promises to track information that we know we'll have eventually. In this case, we know that we'll be getting settings from Drupal, but we don't want to wrap all of the definitions in the function that Drupal's JavaScript will call to set everything up. At the same time, there's no reason for this information to leak outside of the namespace definition we're in.

    settingsDeferred = Q.defer()
    settings = settingsDeferred.promise

## Controllers

We have a number of controllers which we use to build out the user interface for annotating videos. Some of these are based on the UI used in the [toolkit demo](http://umd-mith.github.io/OACVideoAnnotator/demo.html).

    _"Hover"
    _"Click"
    _"AnnoControls"
    _"TextControls"

### Hover

The hover controller provides two different events in response to the UI: `onFocus` and `onUnfocus`. We only use the `onFocus` event in the application, but include the `onUnfocus` event for completeness. *N.B.:* This controller may be moved into MITHgrid in the future.

    MITHgrid.defaults "OAC.Client.StreamingVideo.Drupal.Hover",
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

The click controller provides a simple `onSelect` event in response to a click in the UI. Binding this controller to an element will prevent the default click action in the browser. *N.B.:* This controller may be moved into MITHgrid in the future.

    MITHgrid.defaults "OAC.Client.StreamingVideo.Drupal.Click",
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

The annotation controls manage creation and editing of annotations on the video playsurface. An instance of this controller is created at the end of this file and bound to the DOM control point by each application instance.

This controller will fire the `onModeChange` with the name of the mode when the corresponding control element is clicked. The `events.onModeChange` should be hooked up to the `app.setCurrentMode` variable method.

    MITHgrid.defaults "OAC.Client.StreamingVideo.Drupal.AnnoControls",
      bind:
        events:
          onModeChange: null


    Drupal.namespace 'AnnoControls', (AnnoControls) ->
      clickController = Drupal.Click.initInstance {}

      AnnoControls.initInstance = (args...) ->
        MITHgrid.Controller.initInstance 'OAC.Client.StreamingVideo.Drupal.AnnoControls', args..., (that, container) ->
          that.applyBindings = (binding) ->


### TextControls

The text controls controller provides simple save, edit, delete functions for editing annotation bodies. It does not provide the UI elements. Those will be configured elsewhere based on information passed in from the PHP code. Instead, it ties into the elements and exposes a set of stateful events: edit, save, cancel, and delete.

When in editing mode, only save and cancel are shown and will fire. When not in editing mode, only edit and delete are shown and will fire.

    MITHgrid.defaults "OAC.Client.StreamingVideo.Drupal.TextControls",
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
            _"TextControls:elements"
            _"TextControls:bindings"
            _"TextControls:triggers"
            _"TextControls:event handlers"
            _"TextControls:setup"

[setup](#)

We make sure we're not in edit mode or visible when we start up.

    shown = false
    inEditing = false
    resetEditingMode()
    binding.eventHide()

[elements](#)

We cache all of the UI elements we'll be binding to. We also show/hide these elements depending on which mode this controller is in.

    editEl = binding.locate('edit')
    saveEl = binding.locate('save')
    cancelEl = binding.locate('cancel')
    deleteEl = binding.locate('delete')

[bindings](#)

We bind the click controller instance to each of the elements. This gives us a set of events that we can listen to for mouse clicks. If we wanted to initiate one of the four commands by some other means, this is where we would change our event input mechanism.

    editBinding = clickController.bind editEl
    saveBinding = clickController.bind saveEl
    cancelBinding = clickController.bind cancelEl
    deleteBinding = clickController.bind deleteEl

[triggers](#)

We want to trigger various events based on the mode we're in and which control elements we expect the user to be able to see or access. For example, if not in the editing mode (`inEditing` is `false`), then only the "edit" and "delete" actions should be available.

    setEditingMode = _"TextControls:set editing mode"
    resetEditingMode = _"TextControls:reset editing mode"

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

We need to coordinate the showing and hiding of different elements based on our editing mode. These functions provide us with an easy way to manage the mode and the display of these elements. We use them in the translation of click events to semantically meaningful events that we expose to the application.

    ->
      inEditing = true
      editEl.hide()
      saveEl.show()
      deleteEl.hide()
      cancelEl.show()

[reset editing mode](#)

    ->
      inEditing = false
      editEl.show()
      saveEl.hide()
      deleteEl.show()
      cancelEl.hide()

[event handlers](#)

We provide some event handlers that the application can call to show, hide, and position the controls. The text controller will fire events only when it is visible.

    binding.eventShow = _"TextControls:show event"
    binding.eventHide = _"TextControls:hide event"
    binding.eventMove = _"TextControls:move event"

[show event](#)

When we show the text controls, we want to reset the edit mode so that the user has to select the edit control before being able to edit the annotation body.

    ->
      resetEditingMode()
      binding.locate('').show()
      shown = true

[hide event](#)

When we hide the text controls, we aren't concerned about setting the edit mode to a particular state since the act of hiding and the state of being hidden are enough to stop any events from this controller.

    ->
      binding.locate('').hide()
      shown = false

[move event](#)

When we move the text controls, we are given the upper right coordinates of where the text controls should appear. This assumes that the text controls are positioned to the left of the annotation body display.

    (top, right) ->
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

This component will build out the DOM based on information passed in from the Drupal attachment process (provided by the PHP side of this plugin). The AnnoController instance will bind to the same container as passed to this component after this component is finished adding the appropriate elements to the DOM.

    MITHgrid.defaults 'OAC.Client.StreamingVideo.Drupal.AnnoControlComponent',
      events:
        onModeChange: null

    Drupal.namespace 'AnnoControlComponent', (ACC) ->
      clickController = Drupal.Click.initInstance {}

      ACC.initInstance = (args...) ->
        MITHgrid.initInstance "OAC.Client.StreamingVideo.Drupal.AnnoControlComponent", args..., (that, container) ->
          controls = that.options.controls
          els =
            constraint: $("<div></div>")
            control: $("<div></div>")
          $(container).append( els.control )
          $(container).append( els.constraint )
          names = ((nom for nom of controls).sort (a,b) -> controls[a].weight - controls[b].weight)
          for name in names
            config = controls[name]
            if els[config.type]?
              do (config) ->
                el = $("<i class='#{config.class}'></i>")
                els[config.type].append el

                binding = clickController.bind el
                binding.events.onSelect.addListener ->
                  if $(el).hasClass 'active'
                    $(el).removeClass 'active'
                    that.events.onModeChange.fire null
                  else
                    $(els.constraint).find("i").removeClass 'active'
                    $(el).addClass 'active'
                    that.events.onModeChange.fire config.mode

## Application

We define the application here. 

    Drupal.namespace 'Application', (Application) ->

      textController = OAC.Client.StreamingVideo.Drupal.TextControls.initInstance {}
      hoverController = OAC.Client.StreamingVideo.Drupal.Hover.initInstance {}

      Application.initInstance = (args...) ->
        OAC.Client.StreamingVideo.Application.initInstance "OAC.Client.StreamingVideo.Drupal.Application", args..., (app, container) ->
          appFn = -> app
          freezeAjax = false

          app.freezeUpdates = -> freezeAjax = true
          app.unfreezeUpdates = -> freezeAjax = false

          app.ready ->
            _"Data Synchronization"
            _"Annotation Display"

### Data Synchronization

We want to tie into the data store and report any changes back to the server. This is done as soon as we know there is a change in the data. We don't require that someone take some action other than edit, create, or delete an annotation in the usual interface. When we are allowing updates in the data store to get reflected back to the server, we need to go through each item in the list of updated items and figure out if the item is in one of three states:

* deleted: the item id is no longer in the model,
* updated: the item id is in the model and ends in `.json`, or
* created: the item id is in the model and does not end in `.json`.

[]()

    _"Data Synchronization:context"

    itemToJSON = _"Data Synchronization:serialize"

    app.dataStore.canvas.events.onModelChange.addListener (model, list) ->
      return if freezeAjax
      for id in list
        if not model.contains id
          
          req = _"Data Synchronization: delete"
          
        else
          item = model.getItem id
          if item.id?[0] =~ /^\.json$/
            
            req = _"Data Synchronization: update"
            
          else
            
            req = _"Data Synchronization: create"

        req.done()   
      null

[delete](#)

    csrl.then (token) ->
      $.ajax
        url: uri_from_template settings?.urls?.record?.delete,
          id: id
        method: 'DELETE'
        type: 'json'
        headers:
          'X-CSRL-Token': token

[update](#)

    csrl.then (token) ->
      $.ajax
        url: uri_from_template settings?.urls?.record?.put,
          id: id
        method: 'PUT'
        headers:
          'X-CSRL-Token': token
        contentType: 'application/json'
        type: 'json'
        data: 
          '@context': json_context
          '@graph': [ itemToJSON item ]

[create](#)

    csrl.then (token) ->
      p = Q $.ajax
        url: uri_from_template settings?.urls?.collection?.post,
          id: id
        method: 'POST'
        headers:
          'X-CSRL-Token': token
        contentType: 'application/json'
        type: 'json'
        data: 
          '@context': json_context
          '@graph': [ itemToJSON item ]

[context](#)

We want to start with a fairly well-rounded context for Open Annotation but allow plugins to augment the context with additional properties.

    buildContext = ->
      context = 
        _"Data Synchronization:core context"

      # here, we'll look for hook handlers to modify the context

      context

    json_context = buildContext()

[core context](#)

This is the core context for our JSON-LD export from the annotation application to the Drupal server.

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

We want to serialize individual annotations using a set JSON context to make it easier. This mirrors how we're managing JSON-LD serialization on the server side in the Drupal module. We could have used the export API of the annotation application, but we want to export a single annotation instead of all of the annotations.

    (item) ->
      anno =
        id: item.id[0]
        body: video_annotation_body_json item
        target: video_annotation_target_json item

      anno.target.hasScope = document.href

      anno

    video_annotation_body_json = _"Data Synchronization:serialize the body"

    video_annotation_target_json = _"Data Synchronization:serialize the target"

[serialize the body](#)

    (item) ->

      if "Text" in item.bodyType
        
        type: ["cnt:ContentAsText", "dctypes:Text"]
        format: item.bodyType[0]
        chars: item.bodyContent[0]

      else

        {}

[serialize the target](#)

    (item) ->
      target =
        source: item.target
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

    video_annotation_timing_json = _"Data Synchronization:serialize target timing"

    video_annotation_shape_json = _"Data Synchronization:serialize target shape"

[serialize target shape](#)

    (item) ->
      shape = {}

      if item.shapeType?
        switch item.shapeType[0]
          when 'Rectangle'
            svg = "<rect x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"
          when 'Ellipse'
            svg = "<ellipse x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"
        if svg?
          shape.type = 'oa:SVGSelector'
          shape.chars = svg
          if item.w?
            shape.width = item.w[0]
          if item.h?
            shape.height = item.h[0]

          shape

[serialize target timing](#)

    (item) ->
      if item.npt_start?[0]? and item.npt_end?[0]?
        type: 'oa:FragmentSelector'
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: "t=npt:#{item.npt_start[0]},#{item.npt_end[0]}"

### Annotation Display

We assume that the annotations will be displayed in a way that allows selection of an annotation based on the textual content of that annotation, similar to in the demo. For now, we also assume that the DOMs of the text controls and the body display will be descendents of the application's container. This means that each copy of the application will have its own text controls and display of body content.

    _"Body Display"
    _"Text Controls"
    _"Annotation Controls"

#### Text Controls

    textControls = textController.bind $(container).find(".edit-controls")

We pass along the text control events to the rendering of the annotation body if an annotation is currently in focus and it has a rendering. Otherwise, we ignore the event in the annotation body display.

    textControls.events.onEdit.addListener   -> annotationDisplay.getFocusedRendering()?.eventEdit()

    textControls.events.onDelete.addListener -> annotationDisplay.getFocusedRendering()?.eventDelete()

    textControls.events.onSave.addListener   -> annotationDisplay.getFocusedRendering()?.eventSave()

    textControls.events.onCancel.addListener -> annotationDisplay.getFocusedRendering()?.eventCancel()

#### Annotation Controls

    settings.then (settings) ->
      annoControlDisplay = Drupal.AnnoControlComponent.initInstance $(container).find(".annotation-controls"),
        controls: settings.controls or {}

      #annoControls = annoController.bind $(container).find(".annotation-controls")

      annoControlDisplay.events.onModeChange.addListener app.setCurrentMode

#### Body Display

    annotationDisplay = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance $(container).find('.annotation-text'),
      dataView: app.dataView.currentAnnotations
      lensKey: ['.bodyType']
      application: appFn

    annotationDisplay.addLens "Text", _"Annotation Body Text Lens"

We highlight the annotation body based on which annotation is currently in focus. This is an application-wide setting (but may be different for each instance of the application, and thus for each video on the page). All changes to which annotation is in focus should be done by calling `app.setActiveAnnotation()` with the `id` of the annotation.

    app.events.onActiveAnnotationChange.addListener annotationDisplay.eventFocusChange

#### Annotation Body Text Lens

We base our display of the annotation body on a fairly simple text display. Other annotation body types can be defined and will work as long as a suitable lens is provided.

    (container, view, model, itemId) ->
      rendering = annotations.initTextLens container, view, model, itemId
      hoverBinding = hoverController.bind rendering.el
      inEditing = false
      textEl = $(rendering.el).find(".body-content")
      inputEl = $("<textarea></textarea>")
      rendering.el.append(inputEl)
      inputEl.hide()

      hoverBinding.events.onFocus.addListener -> app.setActiveAnnotation itemId

      superFocus = rendering.eventFocus
      superUnfocus = rendering.eventUnfocus

      rendering.eventFocus = ->
        superFocus()
        pos = $(rendering.el).position()
        textControls.eventMove pos.top, pos.left
        textControls.eventShow()

      rendering.eventUnfocus = ->
        textControls.eventHide()
        superUnfocus()

      rendering.eventEdit = ->
        if not inEditing
          app.lockActiveAnnotation()
          inEditing = true
          text = textEl.text()
          textEl.hide()
          inputEl.show()
          inputEl.val(text)

      superDelete = rendering.eventDelete
      rendering.eventDelete = ->
        if not inEditing
          superDelete()

      rendering.eventCancel = ->
        if inEditing
          app.unlockActiveAnnotation()
          inEditing = false
          textEl.show()
          inputEl.hide()

      rendering.eventSave = ->
        if inEditing
          app.unlockActiveAnnotation()
          inEditing = false
          textEl.show()
          rendering.eventUpdate inputEl.val()
          inputEl.hide()

      rendering


## Drupal Glue

We use Drupal's mechanisms to bootstrap the annotation client. This involves getting settings from the Drupal module and any context provided by Drupal.

    _"Drupal Glue:resolve settings"
    _"Drupal Glue:uri construction"
    _"Drupal Glue:resolve csrl token"
    _"Drupal Glue:fetch annotations"
    OAC.Client.StreamingVideo.Player.onNewPlayer.addListener _"Drupal Glue:instantiate application"

[resolve settings](#)
    
    settingsDeferred.resolve settings.video_annotator

[uri construction](#)

    uri_from_template = (template, variables) ->
      if template?
        out = template.replace('{id}', variables.id)
        out = out.replace('{scope_id}', settings.video_annotator.scope_id)
        out

[resolve csrl token](#)

We need the CSRL token for posting/putting/deleting back to the server. *N.B.:* This should be provided by the Drupal module as part of the settings.

    csrl = Q $.ajax
      url: '?q=services/session/token'
      type: 'GET'

[fetch annotations](#)

We gather all annotations from the server in one call we need to pull in available annotations from the server based on the page we're on and the url of the player's video this page: window.document.location.href or window.document.location.pathname

    annotationJSONLD = Q $.ajax
      url: uri_from_template settings?.video_annotator?.urls?.collection?.get,
          id: 0
      dataType: 'json'

[instantiate application](#)

We walk through the DOM and figure out which embedded videos we can work with. For each one, we instantiate the application that manages displaying and editing annotations. We give it all of the annotations we know about for this node and let it figure out which ones it cares about.

    (playerobj) ->

      app = OAC.Client.StreamingVideo.Drupal.Application.initInstance
        player: playerobj
        csrl: csrl
        urls: settings.video_annotator.urls.record

      app.run()

      p = annotationJSONLD.then (annos) ->
        app.freezeUpdates()
        app.importJSONLD annos

      p = p.then app.unfreezeUpdates

      p.done()

## Educational Community License, Version 2.0

Copyright 2013 University of Maryland. Licensed under the Educational Community License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

[http://www.osedu.org/licenses/ECL-2.0](http://www.osedu.org/licenses/ECL-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
