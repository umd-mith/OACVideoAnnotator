# Video Annotator JavaScript

This JavaScript (CoffeeScript) ties together the OAC Video Annotation toolkit and the Drupal server. This consists of several parts:

* import/export of annotations tying together the export/import JSON-LD API of the Video Annotation toolkit with the REST api provided by the Drupal plugin; 
* the construction and management of the user annotation tool UI based on configuration information from the Drupal plugin;
* the loading of video drivers (currently only the HTML5 driver).

## Namespace

Everything is defined as part of the `OAC.Client.StreamingVideo.Drupal` namespace. We assume that the Video Annotation toolkit has been loaded at this point, so we use the existing `OAC.Client.StramingVideo` namespace as our root.

    OAC.Client.StreamingVideo.namespace 'Drupal', (Drupal) ->

## Controllers

We have a number of controllers which we use to build out the user interface for annotating videos. Some of these are based on the UI used in the [toolkit demo](http://umd-mith.github.io/OACVideoAnnotator/demo.html).

### Hover

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

      MITHgrid.defaults "OAC.Client.StreamingVideo.Drupal.Click",
        bind:
          events:
            onSelect: null

      Drupal.namespace 'Click', (Click) ->
        Click.initInstance = (args...) ->
          MITHgrid.Controller.initInstance 'OAC.Client.StreamingVideo.Drupal.Click', args..., (that) ->
            that.applyBindings = (binding) ->
              binding.locate('').click binding.events.onSelect.fire

### TextControls

The text controls controller provides simple save, edit, delete functions for editing annotation bodies. It does not provide the UI elements. Instead, it ties into them and exposes a set of stateful events: edit, save, cancel, and delete.

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
            shown = false
            inEditing = false

We cache all of the UI elements we'll be binding to. We also show/hide these elements depending on which mode this controller is in.

            editEl = bindings.locate('edit')
            saveEl = bindings.locate('save')
            cancelEl = bindings.locate('cancel')
            deleteEl = bindings.locate('delete')

We bind the click controller instance to each of the elements. This gives us a set of events that we can listen to for mouse clicks. If we wanted to initiate one of the four commands by some other means, this is where we would change our event input mechanism.

            editBinding = clickController.bind editEl
            saveBinding = clickController.bind saveEl
            cancelBinding = clickController.bind cancelEl
            deleteBinding = clickController.bind deleteEl

We need to coordinate the showing and hiding of different elements based on our editing mode. These functions provide us with an easy way to manage the mode and the display of these elements. We'll use them below in translation of click events to semantically meaningful events that we expose to the application.

            setEditingMode = ->
              inEditing = true
              editEl.hide()
              saveEl.show()
              deleteEl.hide()
              cancelEl.show()

            resetEditMode = ->
              inEditing = false
              editEl.show()
              saveEl.hide()
              deleteEl.show()
              cancelEl.hide()

We want to trigger various events based on the mode we're in and which control elements we expect the user to be able to see or access. For example, if not in the editing mode (`inEditing` is `false`), then only the "edit" and "delete" actions should be available.

            editBinding.events.onSelect.addListener (e) ->
              e.preventDefault()
              if shown and not inEditing
                setEditMode()
                @events.onEdit.fire()

            saveBinding.events.onSelect.addListener (e) ->
              e.preventDefault()
              if shown and inEditing
                resetEditMode()
                @events.onSave.fire()

            cancelBinding.events.onSelect.addListener (e) ->
              e.preventDefault()
              if shown and inEditing
                resetEditMode()
                @events.onCancel.fire()

            deleteBinding.events.onSelect.addListener (e) ->
              e.preventDefault()
              if shown and not inEditing
                @events.onDelete.fire()

We make sure we're not in edit mode when we start up.

            resetEditMode()

We provide some event handlers that the application can call to show, hide, and position the controls. The text controller will fire events only when it is visible.

            binding.eventShow = ->
              resetEditMode()
              binding.locate('').show()
              shown = true

            binding.eventHide = ->
              binding.locate('').hide()
              shown = false

            binding.eventMove = (top, right) ->
              if shown and inEditing
                resetEditMode()
                @events.onCancel.fire()

              width = binding.locate('').width()

              binding.locate('').css
                top: "#{top}px"
                left: "#{right-width}px"

            binding.eventHide()

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

### Data Synchronization

We want to tie into the data store and report any changes back to the server. This is done as soon as we know there is a change in the data. We don't require that someone take some action other than edit, create, or delete an annotation in the usual interface.

              app.dataStore.canvas.events.onModelChange (model, list) ->
                if not freezeAjax
                  for id in list
                    if not model.contains id
                      csrl.then (token) ->
                        $.ajax
                          url: uri_from_template(settings?.urls?.record?.delete, {
                              id: id
                            })
                          method: 'DELETE'
                          type: 'json'
                          headers:
                            'X-CSRL-Token': token
                    else
                      item = model.getItem id
                      if item.id?[0] =~ /^\.json$/
                        csrl.then (token) ->
                          $.ajax
                            url: uri_from_template(settings?.urls?.record?.put, {
                              id: id
                              })
                            method: 'PUT'
                            headers:
                              'X-CSRL-Token': token
                            contentType: 'application/json'
                            type: 'json'
                            data: 
                              '@context': json_context
                              '@graph': [ itemToJSON item ]
                      else
                        csrl.then (token) ->
                          p = Q $.ajax
                            url: uri_from_template(settings?.urls?.collection?.post, {
                              id: id
                              })
                            method: 'POST'
                            headers:
                              'X-CSRL-Token': token
                            contentType: 'application/json'
                            type: 'json'
                            data: 
                              '@context': json_context
                              '@graph': [ itemToJSON item ]

              textControls = textController.bind $(container).find(".edit-controls")

              annotationDisplay = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance $(container).find('.annotation-text'),
                dataView: app.dataView.currentAnnotations
                lensKey: ['.bodyType']
                application: appFn


              app.events.onActiveAnnotationChange.addListener annotations.eventFocusChange

              textControls.events.onEdit.addListener ->
                annotations.getFocusedRendering()?.eventEdit()

              textControls.events.onDelete.addListener ->
                annotations.getFocusedRendering()?.eventDelete()

              textControls.events.onSave.addListener ->
                annotations.getFocusedRendering()?.eventSave()

              textControls.events.onCancel.addListener ->
                annotations.getFocusedRendering()?.eventCancel()

              annotations.addLens "Text",(container, view, model, itemId) ->
                rendering = annotations.initTextLens container, view, model, itemId
                hoverBinding = hoverController.bind rendering.el
                inEditing = false
                textEl = $(rendering.el).find(".body-content")
                inputEl = $("<textarea></textarea>")
                rendering.el.append(inputEl)
                inputEl.hide()

                hoverBinding.events.onFocus.addListener ->
                  app.setActiveAnnotation itemId

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

    (($) ->
      Drupal.behaviors.video_annotator =
        attach: (context, settings) ->
          settings = settings.video_annotator

We want to tie together the videoanno.js pieces and the drupal page view. We want to find all of the videos for which we have a driver and create a unified annotation management interface for them. That is, we want a single set of controls to manage annotations in all videos. We associate their events with the video we're closest to. They can float down the page as needed.
          
We want all of the controls to hide away except for some small icon that can be clicked to bring up the annotation HUD, which can float off to the side of the video.
          
When possible, the controls should float off to the side in the middle of the page, but if the page is scrolled all the way up or down, we may need to do something different.
          
Another option: have a control/selector pop up when the mouse hovers near a video on the page.

We need to build out the controls palette based on the settings.controls and settings.permissions

          uri_from_template = (template, variables) ->
            if template?
              out = template.replace('{id}', variables.id)
              out = out.replace('{scope_id}', settings.scope_id)
              out


We need the CSRL token for posting/putting/deleting back to the server

          csrl = Q $.ajax
            url: '?q=services/session/token'
            type: 'GET'
        
We gather all annotations from the server in one call we need to pull in available annotations from the server based on the page we're on and the url of the player's video this page: window.document.location.href or window.document.location.pathname

          annotationJSONLD = Q $.ajax
            url: uri_from_template(settings?.urls?.collection?.get, {
                id: 0
              })
            dataType: 'json'
          
We walk through the DOM and figure out which embedded videos we can work with. For each one, we instantiate the application that manages displaying and editing annotations. We give it all of the annotations we know about for this node and let it figure out which ones it cares about.

          OAC.Client.StreamingVideo.Player.onNewPlayer.addListener (playerobj) ->
            app = OAC.Client.StreamingVideo.Application.Drupal.initInstance
              player: playerobj
              csrl: csrl
              urls: settings.urls.record


            app.run()
            p = annotationJSONLD.then (annos) ->
              app.freezeUpdates()
              app.importJSONLD annos
            p = p.then app.unfreezeUpdates
            p.done()

    )(jQuery)

## Educational Community License, Version 2.0

Copyright 2013 University of Maryland. Licensed under the Educational Community License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

[http://www.osedu.org/licenses/ECL-2.0](http://www.osedu.org/licenses/ECL-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.