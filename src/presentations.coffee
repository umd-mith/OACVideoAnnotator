# # Presentations
#
#
# Presentations for OAC:ASP Application
# @author Grant Dickie, Jim Smith
#

# ## AnnotationList
#
# Presentation that extends SimpleText in order to add new
# functionality for Annotation HTML lens
#
OAC.Client.StreamingVideo.namespace "Presentation", (Presentation) ->
	Presentation.namespace "AnnotationList", (AnnotationList) ->
		AnnotationList.initInstance = (args...) ->
			MITHGrid.Presentation.initInstance "OAC.Client.StreamingVideo.Presentation.AnnotationList", args..., (that, container) ->
				options = that.options
				app = options.application
			
				# ### #initTextLens
				#
				# Initializes a basic text lens.
				#
				# Parameters:
				#
				# * container - the container holding the lens content
				# * view - the presentation managing the collection of renderings
				# * model - the data store or data view holding information abut the item to be rendered
				# * itemId - the item ID of the item to be rendered
				#
				# Returns:
				#
				# The basic lens object.
				#
				that.initTextLens = (container, view, model, itemId, cb) ->
					lens = {}
					item = model.getItem itemId

					# We put together a template representing the text annotations associated with any shape.
					itemEl = $("""
						<div class="annotation-body">
							<div class="annotation-body-text">
								<div class="body-content">
								</div>
							</div>
						</div>
					""")

					# We capture the parts of the annotation presentation for use later.
					bodyContentTextArea = $(itemEl).find ".body-content-edit"
					bodyContent = $(itemEl).find ".body-content"

					#$(bodyContentTextArea).text item.bodyContent[0]
					$(bodyContent).text item.bodyContent[0]

					# We attach the rendering to the container and hide the edit area.
					lens.el = itemEl
					$(container).append itemEl
					$(itemEl).find(".editArea").hide()

					# We then construct the following methods:
					# #### #eventFocus
					#
					# Called when this rendering receives the selection focus. The default implementation adds the
					# .selected CSS class.
					#
					lens.eventFocus = -> itemEl.addClass 'selected'

					# #### #eventUnfocus
					#
					# Called when this rendering loses the selection focus. The default implementation removes the
					# .selected CSS class.
					#
					lens.eventUnfocus = -> itemEl.removeClass 'selected'

					# #### #eventUpdate
					#
					#
					# Called when the text annotation body is updated. This will update the data store with the new body.
					#
					# The rendering is update if and only if the id passed in matches the id of the rendered item.
					#
					# Parameters:
					#
					# * id - the item ID of the item to be updated
					# * data - the object holding the current data associated with the item ID
					#
					# Returns: Nothing.
					#
					lens.eventUpdate = (id, data) ->
						if id == itemId
							model.updateItems [
								id: itemId
								bodyContent: data
							]

					# #### #eventDelete
					#
					# Called when the data item represented by this rendering is to be deleted. The default implementation
					# passes the deletion request to the data store with the item ID represented by the rendering.
					#
					# The data item is removed if and only if the id passed in matches the id of the rendered item.
					#
					# Parameters:
					#
					# * id - the item ID of the item to be deleted
					#
					# Returns: Nothing.
					#
					lens.eventDelete = ->
						model.removeItems [itemId]

					# #### #update
					#
					# Called when the underlying data represented by the rendering changes. The rendering is updated to
					# reflect the item data.
					#
					# The rendering is update if and only if the id passed in matches the id of the rendered item.
					#
					# Parameters:
					#
					# * data - the object holding the current data associated with the item ID
					#
					# Returns: Nothing.
					#
					lens.update = (item) ->
						$(itemEl).find(".bodyContent").text item.bodyContent[0]
						$(itemEl).find(".bodyContentTextArea").text item.bodyContent[0]

					# #### #remove
					#
					# Called to remove the rendering from the presentation.
					#
					lens.remove = -> $(itemEl).remove()

					# #### UI events
					#
					# We attach a controller to highlight the
					# HTML when the corresponding shape is selected.
					annoEvents = app.controller.annoActive.bind itemEl,
						model: model
						itemId: itemId

					# We hook up the events generated by the controller to events on the application or
					# rendering, as appropriate.
					#
					# **FIXME:** We may need to hook some of these up through the view if we depend on the itemId being passed in
					annoEvents.events.onClick.addListener app.setActiveAnnotation
					annoEvents.events.onDelete.addListener lens.eventDelete
					annoEvents.events.onUpdate.addListener lens.eventUpdate

					if cb?
						cb lens

					lens
# ## RaphaelCanvas
#
# Presentation for the Canvas area - area that the Raphael canvas is drawn on
#
	Presentation.namespace "RaphaelCanvas", (RaphaelCanvas) ->
		RaphaelCanvas.initInstance = (args...) ->
			MITHGrid.Presentation.initInstance "OAC.StreamingVideo.Client.Presentation.RaphaelCanvas", args..., (that, container) ->
				id = $(container).attr('id')
		
				options = that.options
			
				app = options.application

				# Setting up local names for the assigned presentation controllers
				canvasController = options.controllers.canvas
				keyBoardController = options.controllers.keyboard

				that.canvas = new Raphael($(container), 10, 10)

				$(that.canvas.canvas).css
					"pointer-events": "none"
			
				# attach binding
				# **FIXME:** We need to change this. If we have multiple videos on a page, this will break.
				canvasBinding = canvasController.bind $(container),
					closeEnough: 5
					paper: that.canvas
			
				boundingBoxComponent = OAC.Client.StreamingVideo.Component.ShapeEditBox.initInstance that.canvas
						
				shapeCreateBoxComponent = OAC.Client.StreamingVideo.Component.ShapeCreateBox.initInstance that.canvas

				# Keyboard binding attached to container to avoid multiple-keyboard events from firing
				keyboardBinding = keyBoardController.bind $(container), {}

				that.events = $.extend true, that.events, keyboardBinding.events

				boundingBoxComponent.events.onResize.addListener (pos) ->
					activeRendering = that.getFocusedRendering()
					if activeRendering? and activeRendering.eventResize?
						activeRendering.eventResize(pos)

				boundingBoxComponent.events.onMove.addListener (pos) ->
					activeRendering = that.getFocusedRendering()
					if activeRendering? and activeRendering.eventMove?
						activeRendering.eventMove(pos)

				boundingBoxComponent.events.onDelete.addListener ->
					activeRendering = that.getFocusedRendering()
					if activeRendering? and activeRendering.eventDelete?
						activeRendering.eventDelete()
						boundingBoxComponent.detachFromRendering()

				app.events.onCurrentModeChange.addListener (newMode) ->
					if newMode not in ["Select", "Drag"]
						boundingBoxComponent.detachFromRendering()

				# Adjusts the canvas area, canvas wrapper to fall directly over the
				# player area
				playerObj = app.getPlayer()
			
				updateLocation = ->
					# the following elements should be parts of this presentation
					if playerObj?
						[x, y] = playerObj.getCoordinates()
						[w, h] = playerObj.getSize()

						$(that.canvas.canvas).css
							left: x + 'px'
							top: y + 'px'
							
						that.canvas.setSize w, h

				MITHGrid.events.onWindowResize.addListener updateLocation
			
				if playerObj?
					playerObj.events.onResize.addListener updateLocation
			
				updateLocation()
			
				# to make sure we get things set up right
				#
				# Registering canvas special events for start, drag, stop
				#
				canvasBinding.events.onShapeStart.addListener shapeCreateBoxComponent.createGuide 

				canvasBinding.events.onShapeDrag.addListener shapeCreateBoxComponent.resizeGuide

				canvasBinding.events.onShapeDone.addListener (coords) ->
					#
					# Adjust x,y in order to fit data store
					# model
					#
					shape = shapeCreateBoxComponent.completeShape coords
					if shape.height > 1 and shape.width > 1
						app.insertShape shape

				app.events.onCurrentTimeChange.addListener (npt) ->
					that.visitRenderings (id, rendering) ->
						if rendering.eventCurrentTimeChange?
							rendering.eventCurrentTimeChange npt

				app.events.onTimeEasementChange.addListener (te) ->
					that.visitRenderings (id, rendering) ->
						if rendering.eventTimeEasementChange?
							rendering.eventTimeEasementChange te

				superEventFocusChange = that.eventFocusChange

				that.eventFocusChange = (id) ->
					superEventFocusChange id
					if app.getCurrentMode() == 'Select'
						boundingBoxComponent.attachToRendering that.getFocusedRendering()
						canvasBinding.toBack()

			# End of Presentation constructors