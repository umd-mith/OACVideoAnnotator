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
					bodyContent = $(itemEl).find ".body-content"

					$(bodyContent).text item.bodyContent[0]

					# We attach the rendering to the container and hide the edit area.
					lens.el = itemEl
					$(container).append itemEl

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
					lens.eventUpdate = (data) ->
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
						$(bodyContent).text item.bodyContent[0]

					# #### #remove
					#
					# Called to remove the rendering from the presentation.
					#
					lens.remove = -> $(itemEl).remove()

					if cb?
						cb lens

					lens

# ## RaphaelCanvas
#
# Presentation for the Canvas area - area that the Raphael canvas is drawn on
#
	Presentation.namespace "RaphaelCanvas", (RaphaelCanvas) ->
		counter = 1
		RaphaelCanvas.initInstance = (args...) ->
			MITHGrid.Presentation.initInstance "OAC.StreamingVideo.Client.Presentation.RaphaelCanvas", args..., (that, container) ->
				if !container?
					id = "oac-raphael-presentation-canvas-#{counter}"
					counter += 1
					container = $("<div id='#{id}'></div>")
					$("body").append(container)
				else
					id = $(container).attr('id')
					if !id?
						id = "oac-raphael-presentation-canvas-#{counter}"
						counter += 1
						$(container).attr
							id: id
		
				options = that.options
			
				app = options.application
				screenSize =
					width: 0
					height: 0
					
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
						screenSize =
							width: w
							height: h

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

				#
				
				# ### #initShapeLens
				#
				# Initializes a basic shape lens. The default methods expect the Raphaël SVG shape object to
				# be held in the .shape property.
				#
				# Parameters:
				#
				# * container - the container holding the lens content
				# * view - the presentation managing the collection of renderings
				# * model - the data store or data view holding information about the item to be rendered
				# * itemId - the item ID of the item to be rendered
				#
				# Returns:
				#
				# The basic lens object with the following methods defined:
				that.initShapeLens = (container, view, model, itemId, cb) ->
					lens =
						id: itemId
					item = model.getItem itemId

					focused = false
					start = item.npt_start[0]
					end = item.npt_end[0]
					fstart = start - app.getTimeEasement()
					fend = end + app.getTimeEasement()

					# ### #calcOpacity (private)
					#
					# Calculate the opacity of the annotation shape rendering over the video.
					#
					# Parameters:
					#
					# * n - the current time of the play head
					#
					calcOpacity = (n) ->
						val = 0.0

						if n >= fstart and n < fend
							e = app.getTimeEasement()
							if e > 0
								if n < start
									# fading in
									val = (e - start + n) / e
								else if n > end
									# fading out
									val = (e + end - n) / e
								else
									val = 1.0
							else
								val = 1.0
						val

					lens.scalePoint = (x, y, w, h) ->
						if w? and w[0]?
							w = w[0]
						else
							w = screenSize.width
						if h? and h[0]?
							h = h[0]
						else
							h = screenSize.height

						if w == 0 or h == 0
							[x, y]
						else
							[ x * screenSize.width / w, y * screenSize.height / h ]

					# ### eventTimeEasementChange (private)
					#
					# Handles event calls for when the user wants
					# to see the annotation at a specific interval.
					# By default, annotations are in view for the time period
					# of the item being annotated. They are 'eased in', or fade in
					# and out depending on the Easement variable, which is set
					# here.
					#
					# Parameters:
					#
					# * v: when the annotation should be in view
					#
					lens.eventTimeEasementChange = (v) ->
						fstart = start - v
						fend = end + v

						lens.setOpacity calcOpacity(app.getCurrentTime())

					# ### eventCurrentTimeChange (private)
					#
					# Handles when application advances the time
					#
					# Parameters:
					#
					# *n: current time of the video player
					#
					lens.eventCurrentTimeChange = (n) ->
						lens.setOpacity calcOpacity(n)

					opacity = 0.0

					# #### #setOpacity
					#
					# Sets the opacity for the SVG shape. This is moderated by the renderings focus. If in focus, then
					# the full opacity is set. Otherwise, it is halved.
					#
					# If no value is given, then the shape's opacity is updated to reflect the currently set opacity and
					# focus state.
					#
					# Parameters:
					#
					# * o - opacity when in focus
					#
					# Returns: Nothing.
					#
					lens.setOpacity = (o) ->
						if o?
							opacity = o

						if lens.shape?
							lens.shape.attr
								opacity: (if focused then 0.5 else 0.25) * opacity

					lens.getOpacity = -> opacity

					lens.setOpacity(calcOpacity app.getCurrentTime())

					# #### #eventFocus
					#
					# Called when this rendering receives the selection focus. The default implementation brings the rendering
					# to the front and makes it opaque.
					#
					lens.eventFocus = ->
						focused = true
						lens.setOpacity()
						lens.shape.toFront()

					# #### #eventUnfocus
					#
					# Called when this rendering loses the selection focus. The default implementation pushes the rendering
					# to the back and makes it semi-transparent.
					#
					lens.eventUnfocus = ->
						focused = false
						lens.setOpacity()
						lens.shape.toBack()

					# #### #eventDelete
					#
					# Called when the data item represented by this rendering is to be deleted. The default implementation
					# passes the deletion request to the data store with the item ID represented by the rendering.
					#
					# Parameters: None.
					#
					# Returns: Nothing.
					#
					lens.eventDelete = -> model.removeItems [itemId]


					# #### #eventResize
					#
					# Called when the bounding box of the rendering changes size. Note that we change the
					# width and height of the targeted video to correspond to the current size of the play surface.
					#
					# Parameters:
					#
					# * pos - object containing the .width and .height properties
					#
					# Returns: Nothing.
					#
					lens.eventResize = (pos) ->
						model.updateItems [
							id: itemId
							x: pos.x
							y: pos.y
							w: pos.width
							h: pos.height
							targetWidth: screenSize.width
							targetHeight: screenSize.height
						]

					# #### #eventMove
					#
					# Called when the bounding box of the rendering is moved.
					#
					# Parameters:
					#
					# * pos - object containing the .x and .y properties
					#
					# Returns: Nothing.
					#
					lens.eventMove = (pos) ->
						model.updateItems [
							id: itemId
							x: pos.x
							y: pos.y
						]

					# #### #update
					#
					# Updates the rendering's opacity based on the current time and the time extent of the annotation.
					#
					lens.update = (item) ->
						if item.npt_start[0] != start or item.npt_end[0] != end
							start = item.npt_start[0]
							end = item.npt_end[0]
							fstart = start - app.getTimeEasement()
							fend = end + app.getTimeEasement()
							lens.setOpacity calcOpacity(app.getCurrentTime())

					# #### #remove
					#
					# Called to remove the rendering from the presentation.
					#
					lens.remove = (item) ->
						if lens.shape?
							lens.shape.remove()
							lens.shape = null

					if cb?
						cb lens
					lens
				
			# End of Presentation constructors