MITHGrid.defaults "OAC.Client.StreamingVideo.Demo.Hover",
	bind:
		events:
			onFocus: null
			onUnfocus: null

MITHGrid.defaults "OAC.Client.StreamingVideo.Demo.Click",
	bind:
		events:
			onSelect: null

MITHGrid.defaults "OAC.Client.StreamingVideo.Demo.TextControls",
	events:
		onDelete: null
		onEdit: null
		onSave: null
	viewSetup: """
		<span class="edit"><a href="#" title="edit annotation"></a></span>
		<span class="save"><a href="#" title="save annotation"></a></span>
		<span class="delete"><a href="#" title="delete annotation"></a></span>
	"""
	
OAC.Client.StreamingVideo.namespace "Demo", (Demo) ->
	# ## Select
	#
	# Attaches a click handler to an SVG rendering and fires an onSelect event if the rendering is clicked AND
	# the application is in a mode to select things.
	#
	Demo.namespace "Click", (Click) ->
		Click.initInstance = (args...) ->
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Demo.Click", args..., (that) ->
				that.applyBindings = (binding) ->
					binding.locate('').click binding.events.onSelect.fire
	
	Demo.namespace "Hover", (Hover) ->
		Hover.initInstance = (args...) ->
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Demo.Hover", args..., (that) ->
				that.applyBindings = (binding) ->
					binding.locate('').hover binding.events.onFocus.fire, binding.events.onUnfocus.fire

	Demo.namespace "TextControls", (TextControls) ->
		
		TextControls.initInstance = (args...) ->
			clickController = Demo.Click.initInstance {}
			
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Demo.TextControls", args..., (that, container) ->
				options = that.options
				app = options.application
				shown = false

				$(document).ready ->
					editEl = $(container).find(".edit")
					saveEl = $(container).find(".save")
					deleteEl = $(container).find(".delete")
				
					editBinding = clickController.bind editEl
					saveBinding = clickController.bind saveEl
					deleteBinding = clickController.bind deleteEl
								
					editBinding.events.onSelect.addListener ->
						if shown
							that.events.onEdit.fire()
					saveBinding.events.onSelect.addListener ->
						if shown
							that.events.onSave.fire()
					deleteBinding.events.onSelect.addListener ->
						if shown
							that.events.onDelete.fire()
			
				that.eventShow = -> 
					$(container).show()
					shown = true
			
				that.eventHide = -> 
					$(container).hide()
					shown = false
			
				that.eventMove = (top, right) ->
					$(container).css
						top: top + "px"
						left: (right - 60) + "px"
				
				that.eventHide()



	Demo.namespace "Application", (Application) ->
		Application.initInstance = (args...) ->
			OAC.Client.StreamingVideo.Application.initInstance "OAC.Client.StreamingVideo.Demo.Application", args..., (app) ->
				#
				# We begin by creating an instance of the Video Annotator application.
				# This requires the player object passed in by the onNewPlayer function above.
				#

				#
				# Running the application causes all of the DOM elements, presentations, and other components to be
				# instantiated. Once that is done, then the following code will run.
				#
				app.ready ->

					#
					# We create a simple presentation of the annotations. This particular presentation type has a
					# base body lens that we can build from.
					#
					annotations = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance '#annotation-text',
						dataView: app.dataView.currentAnnotations
						lensKey: ['.bodyType']
						application: app

					#
					# we can use the default bare-bones text display provided by the annotation client.
					# We add a binding so we can display the edit/delete buttons when the mouse hovers over
					# the text body. We can also make the annotation the active annotation so it highlights
					# the shape on the video.
					#
					hoverController = OAC.Client.StreamingVideo.Demo.Hover.initInstance()
					textControls = OAC.Client.StreamingVideo.Demo.TextControls.initInstance "#text-controls"
			
					app.events.onActiveAnnotationChange.addListener annotations.eventFocusChange
										
					textControls.events.onEdit.addListener ->
						rendering = annotations.getFocusedRendering()
						if rendering?
							rendering.eventEdit()
					textControls.events.onDelete.addListener ->
						rendering = annotations.getFocusedRendering()
						if rendering?
							rendering.eventDelete()
					textControls.events.onSave.addListener ->
						rendering = annotations.getFocusedRendering()
						if rendering?
							rendering.eventSave()
		
					annotations.addLens "Text", (container, view, model, itemId) ->
						rendering = annotations.initTextLens container, view, model, itemId
						binding = hoverController.bind rendering.el
						inEditing = false
						textEl = $(rendering.el).find(".body-content")
						inputEl = $("<textarea></textarea>")
						rendering.el.append(inputEl)
						inputEl.hide()

						# we want to switch the active annotation to this one when the cursor hovers over it
						binding.events.onFocus.addListener ->
							app.setActiveAnnotation itemId

						# Now we want to handle showing the edit controls when this rendering is active.
						# We split this out from the above binding events focus/unfocus handling since
						# an annotation can become active from several different avenues.
						superFocus = rendering.eventFocus
						superUnfocus = rendering.eventUnfocus

						rendering.eventFocus = ->
							superFocus()
							textControls.eventMove $(rendering.el).position().top, $(rendering.el).position().left
							textControls.eventShow()

						rendering.eventUnfocus = ->
							superUnfocus()
							textControls.eventHide()
						
						rendering.eventEdit = ->
							if !inEditing
								app.lockActiveAnnotation()
								inEditing = true
								# we want to replace the body with a textarea
								text = textEl.text()
								textEl.hide()
								inputEl.show()
								inputEl.val(text)							
							
						superDelete = rendering.eventDelete
						rendering.eventDelete = ->
							if inEditing
								app.unlockActiveAnnotation()
								inEditing = false
								textEl.show()
								inputEl.hide()
							else
								app.setActiveAnnotation null
								superDelete()
							
						rendering.eventSave = ->
							if inEditing
								app.unlockActiveAnnotation()
								inEditing = false
								textEl.show()
								rendering.eventUpdate inputEl.val()
								inputEl.hide()
						rendering

					  # create mode buttons
					  # Select and Watch are special. Video Annotator expects any other mode to
					  # be the name of a shapeType.
					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeRectangle",
						mode: "Rectangle"
						application: app

					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeEllipse",
						mode: "Ellipse"
						application: app

					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeSelect",
						mode: "Select"
						application: app

					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeWatch",
						mode: "Watch"
						application: app

					$("#export-button").click ->
						data = app.exportData()
						$("#export-text").val jsl.format.formatJson JSON.stringify data

					$("#import-button").click ->
						str = $("#export-text").val()
						if str != ""
							app.importData JSON.parse str