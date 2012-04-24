# # Controllers
#
OAC.Client.StreamingVideo.namespace 'Controller', (Controller) ->
	relativeCoords = (currentElement, event) ->
		totalOffsetX = 0
		totalOffsetY = 0
		
		while currentElement?
			totalOffsetX += currentElement.offsetLeft
			totalOffsetY += currentElement.offsetTop
			currentElement = currentElement.offsetParent
		
		x: event.pageX - totalOffsetX
		y: event.pageY - totalOffsetY
		
	# ## KeyboardListener
	#
	# OAC.Client.StreamingVideo.Controller.KeyboardListener listens to keydown events on the DOM document
	# level and translates them into delete events.
	#
	Controller.namespace "KeyboardListener", (KeyboardListener) ->

		# ### KeyboardListener.initController
		#
		# Parameters:
		#
		# * options - object holding configuration options for the KeyboardListener object
		#
		# Returns:
		#
		# The configured KeyboardListener controller.
		#
		# Options:
		#
		# * application - the application using this controller
		# * isAction - a function which returns true if keyboard events should be propagated
		#
		KeyboardListener.initController = (args...) ->			
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Controller.KeyboardListener", args..., (that) ->
				options = that.options

				that.applyBindings = (binding, opts) ->
					doc = binding.locate('doc')

					options.application.events.onActiveAnnotationChange.addListener (id) ->
						activeId = id

					$(doc).keydown (e) ->
						if options.application.getCurrentMode() == 'Editing'
							return

						if activeId?
							# If backspace or delete is pressed,
							# then it is interpreted as a
							# delete call.
							if e.keyCode in [8, 46]
								binding.events.onDelete.fire activeId
								activeId = null

	# ## Drag
	#
	# Attaches to an SVG rendering and produces events at the start, middle, and end of a drag.
	#
	Controller.namespace "Drag", (Drag) ->

		# ### Drag.initController
		#
		Drag.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.Drag", args..., (that) ->
				that.applyBindings = (binding, opts) ->
					el = binding.locate('raphael')

					dstart = (x, y, e) ->
						# We need to get the X/Y relative to the container we're bound to
						pos = relativeCoords el.node, e
						binding.events.onFocus.fire pos.x, pos.y
					dend = ->
						binding.events.onUnfocus.fire()
					dmid = (x, y) ->
						binding.events.onUpdate.fire x, y
					
					el.drag dmid, dstart, dend

	# ## Select
	#
	# Attaches a click handler to an SVG rendering and fires an onSelect event if the rendering is clicked AND
	# the application is in a mode to select things.
	#
	Controller.namespace "Select", (Select) ->

		# ### Select.initController
		#
		# Parameters:
		#
		# * options - object holding configuration information
		#
		# Returns:
		#
		# The configured controller object.
		#
		# Configuration Options:
		#
		# * isSelectable - function taking no arguments that should return "true" if the click should cause the
		#				   onSelect event to fire.
		#
		Select.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.Select", args..., (that) ->
				options = that.options

				that.applyBindings = (binding) ->
					el = binding.locate("raphael")

					el.click (e) ->
						if options.isSelectable()
							binding.events.onSelect.fire()

	# ## TextBodyEditor
	#
	# Handles HTML annotation lens for editing the bodyContent text.
	#
	#
	Controller.namespace "TextBodyEditor", (TextBodyEditor) ->
		TextBodyEditor.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.TextBodyEditor", args..., (that) ->
				options = that.options

				# ### TextBodyEditor #applyBindings
				#
				# Generates the following the methods:
				that.applyBindings = (binding, opts) ->
					annoEl = binding.locate('annotation')
					bodyContent = binding.locate('body')
					allAnnos = binding.locate('annotations')
					textArea = binding.locate('textarea')
					editArea = binding.locate('editarea')
					editButton = binding.locate('editbutton')
					updateButton = binding.locate('updatebutton')
					deleteButton = binding.locate('deletebutton')
					bindingActive = false

					# #### editStart (private)
					#
					# displays editing area
					#
					editStart = () ->
						$(editArea).show()
						$(bodyContent).hide()
						bindingActive = true
						binding.events.onClick.fire(opts.itemId)

					# #### editEnd (private)
					#
					# Hides the editing area after the user has completed editing/canceled editing
					#
					editEnd = () ->
						$(editArea).hide()
						$(bodyContent).show()
						bindingActive = false

					# #### editUpdate (private)
					#
					# Called when the user sends new data to dataStore
					#
					editUpdate = (e) ->
						data = $(textArea).val()
						e.preventDefault()
						binding.events.onUpdate.fire(opts.itemId, data)
						editEnd()

					# Annotation DOM element listens for a double-click to either
					# display and become active or hide and become unactive
					$(annoEl).bind 'dblclick', (e) ->
						e.preventDefault()
						if bindingActive
							editEnd()
							options.application.setCurrentMode(prevMode or '')
						else
							editStart()
							prevMode = options.application.getCurrentMode()
							options.application.setCurrentMode 'TextEdit'

					# Clicking once on the annotation DOM element will activate the attached SVG shape
					$(annoEl).bind 'click', (e) ->
						# binding.events.onClick.fire(opts.itemId);
						options.application.setActiveAnnotation opts.itemId

					# Attach binding to the update button which ends editing and updates the bodyContent of the attached
					# annotation
					$(updateButton).bind 'click', (e) ->
						binding.events.onUpdate.fire(opts.itemId, $(textArea).val())
						editEnd()
						options.application.setCurrentMode(prevMode)

					# Attach binding to the delete button to delete the entire annotation - removes from dataStore
					$(deleteButton).bind 'click', (e) ->
						binding.events.onDelete.fire(opts.itemId)
						# remove DOM elements
						$(annoEl).remove()

					# Listening for changes in active annotation so that annotation text lens stays current
					options.application.events.onActiveAnnotationChange.addListener (id) ->
						if id != opts.id and bindingActive
							editUpdate
								preventDefault: ->
							editEnd()

					# Listens for changes in the mode in order to stay current with rest of the application
					options.application.events.onCurrentModeChange.addListener (newMode) ->
						if newMode != 'TextEdit'
							editEnd()

	# ## CanvasClickController
	#
	# Listens for all clicks on the canvas and connects shapes with the Edit controller above
	#
	# Parameters:
	#
	# * options - Object that includes:
	#	** paper - RaphaelSVG canvas object generated by Raphael Presentation
	#	** closeEnough - value for how close (In RaphaelSVG units) a mouse-click has to be in order to be considered
	# 'clicking' an object
	#
	Controller.namespace "CanvasClickController", (CanvasClickController) ->
		CanvasClickController.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.CanvasClickController", args..., (that) ->
				options = that.options
				overlay = null

				# #### CanvasClickController #applyBindings
				#
				# Create the object passed back to the Presentation
				#
				that.applyBindings = (binding, opts) ->
					closeEnough = opts.closeEnough
					renderings = {}
					paper = opts.paper
					
					# #### attachDragResize (private)
					#
					# Find the passed rendering ID, set that rendering object
					# as the current rendering
					#
					# Parameters:
					# * id - ID of the rendering to set as active
					#
					attachDragResize = (id) ->
						if curRendering? and id == curRendering.id
							return

						o = renderings[id]
						if o?
							curRendering = o
						else
							# de-activate rendering and all other listeners
							binding.events.onClick.fire(undefined)
							# hide the editBox
							# editBoxController.deActivateEditBox();
							curRendering = undefined

					# #### detachDragResize (private)
					#
					# Make the current rendering or rendering that has matching ID *id* non-active
					#
					# Parameters:
					# * id - ID of rendering to make non-active
					#
					detachDragResize = (id) ->
						if curRendering? and id == curRendering.id
							return
						o = renderings[id]
						
					drawOverlay = ->
						removeOverlay()
						overlay = paper.rect(0,0,paper.width,paper.height)
						overlay.toFront()
						overlay.attr
							fill: "#ffffff"
							opacity: 0.01
					
					removeOverlay = ->
						if overlay?
							overlay.unmousedown()
							overlay.unmouseup()
							overlay.unmousemove()
							overlay.remove()

					# #### drawShape (private)
					#
					# Using two html elements: container is for
					# registering the offset of the screen (.section-canvas) and
					# the svgEl is for registering mouse clicks on the svg element (svg)
					#
					# Parameters:
					# * container - DOM element that contains the canvas
					# * svgEl - SVG shape element that will have mouse bindings attached to it
					#
					drawShape = (container) ->
						#
						# Sets mousedown, mouseup, mousemove to draw a
						# shape on the canvas.
						#
						mouseMode = 0
						topLeft = []
						bottomRight = []
						container = $(container)
						drawOverlay()
						offset = container.offset()

						#
						# MouseMode cycles through three settings:
						# * 0: stasis
						# * 1: Mousedown and ready to drag
						# * 2: Mouse being dragged
						#
						# remove all previous bindings
						#container.unbind()
						overlay.unmousedown()
						overlay.unmouseup()
						overlay.unmousemove()
						overlay.mousedown (e) ->
							if mouseMode > 0
								return

							pos = relativeCoords overlay.node, e
							x = pos.x
							y = pos.y
							topLeft = [x, y]
							mouseMode = 1
							binding.events.onShapeStart.fire(topLeft)

						overlay.mousemove (e) ->
							
							if mouseMode in [2, 0]
								return

							pos = relativeCoords overlay.node, e
							x = pos.x
							y = pos.y
							bottomRight = [x, y]
							binding.events.onShapeDrag.fire(bottomRight)

						overlay.mouseup (e) ->
							if mouseMode < 1
								return

							mouseMode = 0
							if !bottomRight?
								bottomRight = [x + 5, y + 5]

							binding.events.onShapeDone.fire
								x: topLeft[0]
								y: topLeft[1]
								width: (bottomRight[0] - topLeft[0])
								height: (bottomRight[1] - topLeft[1])
						
					# #### selectShape (private)
					#
					# Creates a binding for the canvas to listen for mousedowns to select a shape
					#
					# Parameters:
					# * container - HTML element housing the canvas
					selectShape = (container) ->
						#
						# Sets mousedown events to select shapes, not to draw
						# them.
						#
						drawOverlay()
						overlay.unmousedown()
						overlay.mousedown (e) ->
							# By default, nullifies all selections
							options.application.setActiveAnnotation(undefined)
							activeId = null
						overlay.toBack()

					# Attaches binding for active annotation change to attachDragResize
					options.application.events.onActiveAnnotationChange.addListener attachDragResize
					
					# Change the mouse actions depending on what Mode the application is currently
					# in
					# **FIXME:** We shouldn't depend on the shape name being drawn - will break when a third
					# shape is added
					options.application.events.onCurrentModeChange.addListener (mode) ->
						if mode in ["Rectangle", "Ellipse"]
							drawShape binding.locate('svgwrapper')
						else if mode == 'Select'
							selectShape binding.locate('svgwrapper')
						else
							removeOverlay()
							$(binding.locate('svgwrapper')).unbind()

					# #### registerRendering
					#
					# Takes a rendering object and adds it to internal array for renderings
					#
					# Parameters:
					# * newRendering - Rendering object for a shape annotation
					#
					binding.registerRendering = (newRendering) ->
						renderings[newRendering.id] = newRendering

					# #### removeRendering
					#
					# Removes rendering object from internal array - for when a shape is out of view or deleted.
					#
					# Parameters:
					#
					# * oldRendering - Rendering object for a shape annotation
					#
					binding.removeRendering = (oldRendering) ->
						delete renderings[oldRendering.id]

	# ## AnnotationCreationButton
	#
	# Controls the Annotation Creation Tools set by app.buttonFeature
	#
	Controller.namespace 'AnnotationCreationButton', (AnnotationCreationButton) ->
		AnnotationCreationButton.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", args..., (that) ->
				options = that.options

				# #### AnnotationCreationButton #applyBindings
				that.applyBindings = (binding, opts) ->
					active = false

					#
					# Mousedown: activate button - set as active mode
					#
					# Mousedown #2: de-activate button - unset active mode
					#
					# onCurrentModeChange: if != id passed, deactivate, else do nothing
					#
					buttonEl = binding.locate('button')

					# Attach binding to the mousedown
					$(buttonEl).live 'mousedown', (e) ->
						if active == false
							active = true
							options.application.setCurrentMode(opts.action)
							$(buttonEl).addClass("active")
						else if active == true
							active = false
							options.application.setCurrentMode('')
							$(buttonEl).removeClass("active")

					# #### onCurrentModeChangeHandle (private)
					#
					# Handles when the mode is changed externally from controller
					#
					# Parameters:
					# * action - name of new mode
					#
					onCurrentModeChangeHandle = (action) ->
						if action == options.action
							active = true
							$(buttonEl).addClass('active')
						else
							active = false
							$(buttonEl).removeClass("active")

					options.application.events.onCurrentModeChange.addListener onCurrentModeChangeHandle

	# ## sliderButton
	#
	# Creates a jQuery UI slider for the current time in the video
	#
	Controller.namespace 'sliderButton', (sliderButton) ->
		sliderButton.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.sliderButton", args..., (that) ->
				options = that.options

				that.applyBindings = (binding, opts) ->
					displayElement = binding.locate('timedisplay')
					positionCheck = (t) ->
						#
						# if time is not equal to internal time, then
						# reset the slider
						#
						if !localTime?
							localTime = t
							$(sliderElement).slider('value', localTime)

					sliderStart = (e, ui) ->
						options.application.setCurrentTime ui.value
						$(displayElement).text 'TIME: ' + ui.value
						localTime = ui.value

					sliderMove = (e, ui) ->
						if !ui?
							localTime = e
							$(sliderElement).slider('value', e)

						if localTime != ui.value
							options.application.setCurrentTime(ui.value)
							$(displayElement).text('TIME: ' + ui.value)
							localTime = ui.value

					sliderElement = binding.locate("slider")

					$(sliderElement).slider
						start: sliderStart
						slide: sliderMove

	# ## timeControl
	#
	# Controller for manipulating the time sequence for an annotation.
	# Currently, just a text box for user to enter basic time data
	#
	Controller.namespace 'timeControl', (timeControl) ->
		timeControl.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.timeControl", args..., (that) ->
				options = that.options
				that.currentId = ''

				# #### timeControl #applyBindings
				that.applyBindings = (binding, opts) ->
					timestart = binding.locate('timestart')
					timeend = binding.locate('timeend')
					submit = binding.locate('submit')
					menudiv = binding.locate('menudiv')

					$(menudiv).hide()

					$(submit).bind 'click', ->
						# **FIXME:** times can be in parts of seconds
						start_time = parseInt($(timestart).val(), 10)
						end_time = parseInt($(timeend).val(), 10)
						if binding.currentId? and start_time? and end_time?
							# update core data
							binding.events.onUpdate.fire binding.currentId, start_time, end_time

							$(menudiv).hide()

					options.application.events.onActiveAnnotationChange.addListener (id) ->
						if id?
							$(menudiv).show()
							$(timestart).val('')
							$(timeend).val('')
							binding.currentId = id
						else
							$(menudiv).hide()

	# ## WindowResize
	#
	# Emits an onResize event when the browser window is resized.
	#
	Controller.namespace 'WindowResize', (WindowResize) ->
		WindowResize.initController = (args...) ->
			MITHGrid.Controller.initController "OAC.Client.StreamingVideo.Controller.WindowResize", args..., (that) ->
				options = that.options

				that.applyBindings = (binding, opts) ->
					w = binding.locate('resizeBox')
					w.resize ->
						setTimeout(binding.events.onResize.fire, 0)