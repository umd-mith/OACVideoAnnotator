# # Annotation Application
#
# TODO: rename file to application.js


# #S4 (private)
#
# Generates a UUID value, this is not a global uid
#
# Returns:
# String with 16-byte pattern
S4 = () -> (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

# #uuid (private)
#
# Generates a UUID
#
# This is not a global variable - theoretically could clash with another
# variable if enough MITHGrid instances are started. Works now as a local
# unique ID
# **FIXME: Abstract so that there is a server prefix component that insures
# more of a GUID
#
uuid = () -> (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())

# canvasId is unique within the OAC annotation application, which is loaded once on a webpage but instanced for
# each video.
canvasId = 1

# ## StreamingVideo.initApp
#
# Parameters:
#
# * container - the DOM container in which the application should place its content
# * options - an object holding configuration information
#
#
# Returns:
#
# The configured OAC streaming video annotation client object.
#
# Options:
#
# * playerWrapper: [Required] DOM path to the top-level element of the video player
#
OAC.Client.StreamingVideo.initApp = OAC.Client.StreamingVideo.initInstance = (args...) ->
	app = {}
	shapeAnnotationId = 0
	myCanvasId = 'OAC-Client-StreamingVideo-SVG-Canvas-' + canvasId
	xy = []
	wh = []
	[klass, container, options, cb] = MITHGrid.normalizeArgs "OAC.Client.StreamingVideo", args...

	# Generating the canvasId allows us to have multiple instances of the application on a page and still
	# have a unique ID as expected by the Raphaël library.
	canvasId += 1;
	
	if not container?
		container = $("<div id='#{myCanvasId}-container'></div>")
		$("body").append container

	extendedOpts = $.extend(true, {}, {
		# We create a general template that holds all of the different DOM elements we need:
		#
		# * the SVG view that will overlay the play surface (myCanvasId is the DOM id)
		# * the time selection input area (.timeselect)
		# * the controls (.section-controls)
		# * the annotations (.section-annotations)
		#
		# TODO: Split out display of modes into a separate issue... let this application focus on
		#		 the display of annotations and targets instead of the chrome.
		#		 We'll put together a demo page that does have all of the parts working together.
		viewSetup: """
			<div id="#{myCanvasId}" class="section-canvas"></div>
			<div class="mithgrid-bottomarea">
				<div class="timeselect">
					<p>Enter start time:</p>
					<input id="timestart" type="text" />
					<p>Enter end time:</p>
					<input id="timeend" type="text" />
					<div id="submittime" class="button">Confirm time settings</div>
				</div>
				<div id="sidebar#{myCanvasId}" class="section-controls"></div>
			</div>
		"""
		# We make the isActive() function available to the keyboard controller to let it know if
		# the keyboard should be considered active.
		controllers:
			keyboard:
				isActive: () -> app.getCurrentMode() != 'Editing'
			selectShape:
				isSelectable: () -> app.getCurrentMode() == "Select"
		# We connect the SVG overlay and annotation sections of the DOM with their respective
		# presentations.
		presentations:
			raphsvg:
				container: "#" + myCanvasId
				lenses: {}
				lensKey: ['.shapeType']
				playerWrapper: options.playerWrapper
	}, options)

	MITHGrid.Application.initInstance klass, container, extendedOpts, (appOb) ->
		app = appOb
		shapeTypes = {}
		
		
		options = app.options

		# We isolate the player object through a closure so it won't change on us.
		# We expect one application instance per player.
		playerObj = options.player

		app.getPlayer = -> playerObj
	
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
		app.initShapeLens = (container, view, model, itemId) ->
			that =
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
			that.eventTimeEasementChange = (v) ->
				fstart = start - v
				fend = end + v
				
				that.setOpacity calcOpacity(app.getCurrentTime())
			
			# ### eventCurrentTimeChange (private)
			#
			# Handles when application advances the time
			#
			# Parameters:
			#
			# *n: current time of the video player
			#
			that.eventCurrentTimeChange = (n) ->
				that.setOpacity calcOpacity(n)
			
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
			that.setOpacity = (o) ->
				if o?
					opacity = o
			
				if that.shape?
					that.shape.attr
						opacity: (if focused then 0.5 else 0.25) * opacity
		
			that.getOpacity = -> opacity
			
			that.setOpacity(calcOpacity app.getCurrentTime())
			
			# #### #eventFocus
			#
			# Called when this rendering receives the selection focus. The default implementation brings the rendering
			# to the front and makes it opaque.
			#
			that.eventFocus = ->
				focused = true
				that.setOpacity()
				that.shape.toFront()
				# **FIXME:** This should be handled in the view instead of by adding/removing listeners like this
				view.events.onDelete.addListener that.eventDelete
			
			# #### #eventUnfocus
			#
			# Called when this rendering loses the selection focus. The default implementation pushes the rendering
			# to the back and makes it semi-transparent.
			#
			that.eventUnfocus = ->
				focused = false
				that.setOpacity()
				that.shape.toBack()
				view.events.onDelete.removeListener that.eventDelete
			
			# #### #eventDelete
			#
			# Called when the data item represented by this rendering is to be deleted. The default implementation
			# passes the deletion request to the data store with the item ID represented by the rendering.
			#
			# Parameters: None.
			#
			# Returns: Nothing.
			#
			that.eventDelete = -> model.removeItems [itemId]


			# #### #eventResize
			#
			# Called when the bounding box of the rendering changes size.
			#
			# Parameters:
			#
			# * pos - object containing the .width and .height properties
			#
			# Returns: Nothing.
			#
			that.eventResize = (pos) ->
				model.updateItems [
					id: itemId
					x: pos.x
					y: pos.y
					w: pos.width
					h: pos.height
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
			that.eventMove = (pos) ->
				model.updateItems [
					id: itemId
					x: pos.x
					y: pos.y
				]
			
			# #### #update
			#
			# Updates the rendering's opacity based on the current time and the time extent of the annotation.
			#
			that.update = (item) ->
				if item.npt_start[0] != start or item.npt_end[0] != end
					start = item.npt_start[0]
					end = item.npt_end[0]
					fstart = start - app.getTimeEasement()
					fend = end + app.getTimeEasement()
					that.setOpacity calcOpacity(app.getCurrentTime())
			
			# #### #remove
			#
			# Called to remove the rendering from the presentation.
			#
			that.remove = (item) -> that.shape.remove()
			
			that
			
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
		app.initTextLens = (container, view, model, itemId) ->
			that = {}
			item = model.getItem itemId

			# We put together a template representing the text annotations associated with any shape.
			itemEl = $("""
				<div class="anno_item">
					<p class="bodyContentInstructions">Double click here to open edit window.</p>
					<div class="editArea">
						<textarea class="bodyContentTextArea"></textarea>
						<div id="editUpdate" class="button update">Update</div>
						<div id="editDelete" class="button delete">Delete</div>
					</div>
					<div class="body">
						<p class="bodyContent"></p>
					</div>
				</div>
			""")

			# We capture the parts of the annotation presentation for use later.
			bodyContentTextArea = $(itemEl).find ".bodyContentTextArea"
			bodyContent = $(itemEl).find ".bodyContent"

			$(bodyContentTextArea).text item.bodyContent[0]
			$(bodyContent).text item.bodyContent[0]

			# We attach the rendering to the container and hide the edit area.
			$(container).append itemEl
			$(itemEl).find(".editArea").hide()



			# We then construct the following methods:
			# #### #eventFocus
			#
			# Called when this rendering receives the selection focus. The default implementation adds the
			# .selected CSS class.
			#
			that.eventFocus = -> itemEl.addClass 'selected'

			# #### #eventUnfocus
			#
			# Called when this rendering loses the selection focus. The default implementation removes the
			# .selected CSS class.
			#
			that.eventUnfocus = -> itemEl.removeClass 'selected'

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
			that.eventUpdate = (id, data) ->
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
			that.eventDelete = (id) ->
				if id == itemId
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
			that.update = (item) ->
				$(itemEl).find(".bodyContent").text item.bodyContent[0]
				$(itemEl).find(".bodyContentTextArea").text item.bodyContent[0]

			# #### #remove
			#
			# Called to remove the rendering from the presentation.
			#
			that.remove = -> $(itemEl).remove()

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
			annoEvents.events.onDelete.addListener that.eventDelete
			annoEvents.events.onUpdate.addListener that.eventUpdate

			that

		# ### app.buttonFeature
		#
		# Creates an HTML div that acts as a button
		#
		# **FIXME: Tease this out from the rest of the application and work on better parameters
		#
		# Parameters:
		#
		# * area - Classname of the div where the button should go; so far, this can be either 'buttongrouping', where all
		#  general buttons go, or 'slidergrouping', where a jQuery UI slider can be placed
		#
		# * grouping - Name to be given to the inner div inside the area div
		#
		# * action - Name to be given to the ID of the clickable HTML button and the name
		# of the event to fire when button is clicked
		#
		app.buttonFeature = (area, grouping, action) ->

			# Check to make sure button isn't already present
			# **FIXME:** make sure the id is unique in the page since we can have multiple instances of the
			# annotation client (one per video)
			if $('#' + action + myCanvasId).length != 0
				return false # Abort

			that = {}
			buttons = $(".button")
			container = $("#sidebar" + myCanvasId)

			switch area
				when 'buttongrouping'
					#
					# Set the group element where this button should go in. If no group
					#element is yet created, create that group element with name *grouping*
					#
					if $(container).find('#' + grouping + myCanvasId).length == 0
						$(container).append('<div id="' + grouping + myCanvasId + '" class="buttongrouping"></div>')

					groupEl = $("#" + grouping + myCanvasId)

					#
					# generate HTML for button, then attach the callback. action
					# refers to ID and also the title of the button
					#
					item = '<div id="' + action + myCanvasId + '" class="button">' + action + '</div>'

					$(groupEl).append(item)

					that.element = $("#" + action + myCanvasId)

					buttonBinding = app.controller.buttonActive.bind that.element,
						action: action
				when 'slidergrouping'
					if $(container).find('#' + grouping + myCanvasId).length == 0
						$(container).append('<div id="' + grouping + myCanvasId + '" class="slidergrouping"></div>')

					groupEl = $("#" + grouping + myCanvasId)

					#
					# HTML for slider button
					#
					item = '<div id="' + action + myCanvasId + '"><div class="header">' + action + myCanvasId + '</div>' +
					'<div id="slider"></div><div class="timedisplay"></div></div>'
					$(groupEl).append(item)
					that.element = $("#" + action + myCanvasId)

					buttonBinding = app.controller.slider.bind that.element,
						action: action
			that

		# ### #addShape
		#
		# Adds a shape lens to the SVG overlay presentation.
		#
		# Parameters:
		#
		# * key - the internal shape name
		# * svgShape - the lens rendering function for rendering the shape on the SVG overlay
		#
		# Returns: Nothing.
		#
		app.addShape = (key, svgShape) -> app.presentation.raphsvg.addLens(key, svgShape)

		# ### #addBody
		#
		# Adds an annotation body lens to the annotation presentation
		#
		# Parameters:
		#
		# * key - the internal annotation body type
		# * textLens - the lens rendering function for rendering the annotation body in the annotation presentation
		#
		# Returns: Nothing.
		#
		#app.addBody = (key, textLens) -> app.presentation.annoItem.addLens(key, textLens)

		# ### #addShapeType
		#
		# Adds a shape type. This includes a lens, a button to activate the shape mode, and
		# a callback function for creating an item in the data store.
		#
		# Parameters:
		#
		# * type - the internal shape name
		# * args - an object containing the following items:
		#		* calc - the callback function for inserting the new shape into the data store
		#		* lens - the lens rendering function for rendering the shape on the SVG overlay
		#
		# Returns: Nothing.
		#
		app.addShapeType = (type, args) ->
			calcF = args.calc
			lensF = args.lens
			button = app.buttonFeature('Shapes', type)

			shapeTypes[type] = args

			app.addShape(type, lensF)

		# ### #insertShape
		#
		# Inserts a new annotation into the data store using the passed coordinates. An empty text annotation body
		# is added. The application CurrentMode variable determines the shape. The time span is 5 seconds on either side
		# of the CurrentTime variable.
		#
		# Parameters:
		#
		# * coords - the coordinates of the center of the shape in the .x, .y, .width, and .height properties.
		#
		# Returns:
		#
		# The item id of the inserted annotation item.
		#
		# **FIXME:** We should ensure that we don't have clashing IDs. We need to use UUIDs when possible.
		#  : Using uuid() to generate local UUIDs - not truly a UUID, but close enough for now.
		#		
		app.insertShape = (coords) ->
			npt_start = parseFloat(app.getCurrentTime()) - 5
			npt_end = parseFloat(app.getCurrentTime()) + 5
			curMode = app.getCurrentMode()

			# Insert into local array of ShapeTypes
			#
			if shapeTypes[curMode]?
				shape = shapeTypes[curMode].calc(coords)
				shapeAnnotationId = uuid()

				shapeItem =
					id: "anno" + shapeAnnotationId
					type: "Annotation"
					bodyType: "Text"
					bodyContent: "This is an annotation for " + curMode
					shapeType: curMode
					targetURI: app.options.url
					# Starts off with half-opacity, 1 is for in-focus
					npt_start: if(npt_start<0) then 0 else npt_start
					npt_end: npt_end

				app.dataStore.canvas.loadItems [t = $.extend(true, shapeItem, shape)]
				shapeItem.id

		# ### importData
		#
		# Importing annotation data from an external source. Must be in JSON format
		#
		# Parameters:
		# * data - Object housing the data for application
		#
	
		NS = 
			OA: "http://www.w3.org/ns/openannotation/core"
			OAX: "http://www.w3.org/ns/openannotation/extensions"
			RDF: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
			CNT: "http://www.w3.org/2008/content#"
			DC: "http://purl.org/dc/elements/1.1/"
		
		parseNPT = (npt) ->
			if npt.indexOf(':') == -1
				seconds = parseFloat npt
				minutes = 0
				hours = 0
			else
				bits = ((parseFloat b) for b in npt.split(':'))
				seconds = bits.pop()
				if bits.length > 0
					minutes = bits.pop()
				else
					minutes = 0
				if bits.length > 0
					hours = bits.pop()
				else
					hours = 0
			(hours * 60 + minutes) * 60 + seconds
		 
		app.importData = (data) ->
			# ingest data and put it into dataStore
			tempstore = []
			for i, o of data
				# Singling out the Annotations from the rest of the RDF data so
				# we can work down from just the Annotation object and its pointers
				if "#{NS.OA}Annotation" in (t.value for t in o["#{NS.RDF}type"])
					temp = 
						id: i
						type: "Annotation"
						bodyContent: ''
						bodyType: 'Text'
						targetURI: app.options.url
					# Logic chain to determine what kind of incoming annotation we're dealing with
					# 
					# Only interested in annotations that match our Video URI: are 'about' the video OR
					# that do not yet have targets
					if o["#{NS.OA}hasBody"]? and o["#{NS.OA}hasBody"][0]? and data[o["#{NS.OA}hasBody"][0].value]?
						temp.bodyContent = data[o["#{NS.OA}hasBody"][0].value]["#{NS.CNT}chars"][0].value
					if o["#{NS.OA}hasTarget"]?
						for hasTarget in (v.value for v in o["#{NS.OA}hasTarget"])
							if data[hasTarget]? and data[hasTarget]["#{NS.OA}hasSource"]?
								refd = (app.options.url in (s.value for s in data[hasTarget]["#{NS.OA}hasSource"]))
								if refd
									# Target source matches the URI of our video; generate an OAC dataStore model 
									# to insert into canvas for this annotation series in the JSON:RDF data
						
									# Unique ID comes from the URI value of type

									#
									# Check to see if target is a CompositeSelector Resource
									# Right now, we don't care about things that are not Compound Resources made
									# up of a time fragment and an SVG Constraint
									#								
									for hasSelector in (v.value for v in data[hasTarget]["#{NS.OA}hasSelector"])
										refd = ("#{NS.OAX}CompositeSelector" in (t.value for t in data[hasSelector]["#{NS.RDF}type"]))
										if data[hasSelector]? and refd
											for hasSubSelector in (v.value for v in data[hasSelector]["#{NS.OA}hasSelector"])
												if data[hasSubSelector]?
													types = (t.value for t in data[hasSubSelector]["#{NS.RDF}type"])
													if "#{NS.OAX}SvgSelector" in types
														# extract SVG stuff
														if data[hasSubSelector]["#{NS.CNT}chars"]? and data[hasSubSelector]["#{NS.CNT}chars"][0]?
															svg = data[hasSubSelector]["#{NS.CNT}chars"][0].value
															dom = $.parseXML svg
															# based on the root element, we interogate the shape info to see
															# which one wants to handle extracting the extents/etc. from the svg
															if dom?
																doc = dom.documentElement
																rootName = doc.nodeName
																for t, info of shapeTypes
																	if info.extractFromSVG? and rootName in info.rootSVGElement
																		shapeInfo = info.extractFromSVG doc
																		if shapeInfo?
																			$.extend(temp, shapeInfo)
																			temp.shapeType = t
															
													if "#{NS.OA}FragSelector" in types
														# extract media fragment stuff
														if data[hasSubSelector]["#{NS.RDF}value"]? and data[hasSubSelector]["#{NS.RDF}value"][0]?
															fragment = data[hasSubSelector]["#{NS.RDF}value"][0].value
															fragment = fragment.replace(/^t=npt:/, '')
															bits = fragment.split(',')
															temp.npt_start = parseNPT bits[0]
															temp.npt_end   = parseNPT bits[1]	
					else
						#  No Target is created yet - create blank item to insert into dataStore
						# Unique ID comes from the URI value of type
						temp =
							id: i
							type: "Annotation"
							bodyContent: ''
							bodyType: 'Text'
							targetURI: app.options.url
							shapeType: ''
							npt_start: 0
							npt_end: 0
					
					if temp.npt_start? or temp.npt_end? or temp.shapeType?
						tempstore.push temp
			# insert into dataStore
			app.dataStore.canvas.loadItems tempstore

		# ### exportData
		#
		# Works backwards from the importData function for now.
		#
		# Parameters:
		#
		# * data - JSON Object of the original data used during import (Not stored locally during MITHGrid session)
		#
		# Returns:
		#
		# JSON Object that conforms to the
		app.exportData = (data) ->
			# Get all data from dataStore
			tempstore = {}
			findAnnos = app.dataStore.canvas.prepare ['!type']
		
		
			node = (s, pns, p, t, o) ->
				if !tempstore[s]?
					tempstore[s] = {}
				if !tempstore[s][pns+p]?
					tempstore[s][pns+p] = []
				tempstore[s][pns+p].push
					'type': t
					'value': o
		
			bnode =   (s, pns, p, o) -> node s, pns, p, 'bnode',   o
			uri =     (s, pns, p, o) -> node s, pns, p, 'uri',     o
			literal = (s, pns, p, o) -> node s, pns, p, 'literal', o

			# #### genBody (private)
			#
			# Generates the body oject and adds it to tempstore
			#
			# Parameters:
			# * obj - DataStore item
			# * id (optional) - create Body Object with specific ID
			#
			genBody = (obj, id) ->
				# Generating body element
				uri     id, NS.RDF, "type",   "#{NS.OA}Body"
				literal id, NS.DC,  "format", "text/plain"
				literal id, NS.CNT, "characterEncoding", "utf-8"
				literal id, NS.CNT, "chars",  obj.bodyContent[0]

			# #### genTarget (private)
			#
			# Generates a JSON object representing a target and adds it to tempstore
			#
			# Parameters
			# * obj - dataStore item
			# * id (optional) - pass array of IDs to use as target ID, Selector ID, etc
			#
			genTarget = (obj, id) ->
				# Unique Identifiers for pieces of Target
			
				# Generating target element
				uri   id[0], NS.RDF, "type",       "#{NS.OA}SpecificResource"
				uri   id[0], NS.OA,  "hasSource",  obj.targetURI[0]
				bnode id[0], NS.OA,  "hasSelector", id[1]

				# Selector element, which points to the SVG constraint and NPT constraint
				uri   id[1], NS.RDF, "type",       "#{NS.OAX}CompositeSelector"
				bnode id[1], NS.OA,  "hasSelector", id[2]
				bnode id[1], NS.OA,  "hasSelector", id[3]
				
				if obj.shapeType?
					svglens = shapeTypes[obj.shapeType[0]]?.renderAsSVG

				if svglens?
					# Targets have selectors, which then have svg and npt elements
					# **FIXME:** This should be provided by the shape management info - render to SVG just as
					# we render to the presentation
					uri     id[2], NS.RDF, "type",              "#{NS.OAX}SvgSelector"
					literal id[2], NS.DC,  "format",            "text/svg+xml"
					literal id[2], NS.CNT, "characterEncoding", "utf-8"
					literal id[2], NS.CNT, "chars",             svglens(app.dataStore.canvas, obj.id[0])
		
				# This is inserted regardless of the shape type - it's a function of this being a
				# streaming video annotation client
				uri     id[3], NS.RDF, "type",  "#{NS.OA}FragSelector"
				literal id[3], NS.RDF, "value", 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]

			# #### createJSONObjSeries (private)
			#
			# Creates the necessary series of objects to be inserted
			# into the exported JSON. Only called if there isn't already a RDF:JSON object that was imported with a matching ID
			#
			# Parameters:
			#
			# * id - Array of Ids to use as:
			# 0th - Annotation Object (required)
			# 1st - Body Object (optional)
			# 2nd - Target (optional)
			# 3rd - Target Selector (optional)
			# 4th - Target SVG (optional)
			# 5th - Target NPT (optional)
			createJSONObjSeries = (id) ->
				obj = app.dataStore.canvas.getItem id[0]
				if id.length > 1
					buid = id[1]
					tuid = id[2]
					suid = id[3]
					svgid = id[4]
					fgid = id[5]
				else
					buid = '_:b' + uuid()
					tuid = '_:t' + uuid()
					suid = '_:sel' + uuid()
					svgid = '_:sel' + uuid()
					fgid = '_:sel' + uuid()

				# Fragment Idenitifier ID
				uri   id[0], NS.RDF, "type",      "#{NS.OA}Annotation"
				bnode id[0], NS.OA,  "hasBody",   buid
				bnode id[0], NS.OA,  "hasTarget", tuid

				genBody obj, buid
				genTarget obj, [tuid, suid, svgid, fgid]

			# #### mergeData (private)
			#
			# Takes an id of a dataStore object and merges the data
			# in the object with what is in the (optionally) passed
			# RDF:JSON object
			#
			# Parameters:
			# * id - ID of object to merge
			#
			mergeData = (id) ->
				obj = app.dataStore.canvas.getItem id

				# check where data merges
				if data[obj.id]?
					# go through annotation pointers in RDF:JSON to update body, target, etc
					for type, value of data[obj.id]
						switch type
							when "#{NS.OA}hasBody"
								buid = data[obj.id].hasBody[0].value
								data[buid].chars[0].value = obj.bodyContent
							when "#{NS.OA}hasTarget"
								# If Target is undefined within ASP JSON, then it remains blank in RDF:JSON
								if obj.targetURI[0]? and obj.x[0]?
									tuid = data[obj.id].hasTarget[0].value
									# Using variable to check against whether object is found or not
									found = false
									# Matching video URLs means matching Targets
									if data[tuid].hasSource[0].value == obj.targetURI[0]
										# matching sources - merging
										suid = data[tuid].hasSelector[0].value
										found = true
										# Go through the selectors
									
										for seltype, selval of data[suid]
											if seltype == 'hasSelector'
												for seli, selo of selval
													# is svg, npt?
													if data[selo.value].type[0].value == OAC_NS.SVGConstraint
														data[selo.value].chars = [
															type: 'literal'
															value: '<' + obj.shapeType[0].substring(0, 4).toLowerCase() +
															' x="' + obj.x[0] + '" y="' + obj.y[0] + ' width="' +
															obj.w[0] + '" height="' + obj.h[0] + '" />'
														]
													else if data[selo.value].type[0].value == OAC_NS.FragSelector
														data[selval].chars = [
															'type': 'literal'
															'value': 't=npt:' + obj.npt_start[0] + ',' + obj.npt_end[0]
														]

									# If no target element found, create new one in RDF:JSON
									if !found
										genTarget(obj)
							else
								# do nothing
				else
					createJSONObjSeries obj.id

			data = data or {}

			for o in findAnnos.evaluate('Annotation')
				mergeData o

			tempstore

		# ## Application Configuration
		#
		# The rest of this prepares the annotation application once it's in the up-and-running process.
		#
		# We wrap all of this in the app.ready() call so we will have all of the events, presentations,
		# data stores, etc., instantiated for us.
		#
		app.ready ->
			# We want the SVG overlay and the annotation body presentation to react to changes in
			# the selection focus.
			app.events.onActiveAnnotationChange.addListener app.presentation.raphsvg.eventFocusChange
			#app.events.onActiveAnnotationChange.addListener app.presentation.annoItem.eventFocusChange

			# We always want the current annotation list to include anything that covers a time within five seconds
			# of the current time.
			app.events.onCurrentTimeChange.addListener (t) ->
				app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5)
				playerObj.setPlayhead t
				# Making sure that none of the button items are still active while video is playing
				# (Can't draw a shape while video is playing - force user to re-click item)
				#app.setCurrentMode('Watch')

			# We currently have a Player variable that handles the current player object. This may change since
			# we intend for the annotation client to be bound to a particular video stream on the page.
			#
			# **TODO:** This may be better done as an option when the app object is initialized. Annotations are
			# specific to the video being annotated, so it doesn't make as much sense to change the video we're
			# annotating. Better to create a new applicaiton instance.
			app.setCurrentTime playerObj.getPlayhead()
			playerObj.events.onPlayheadUpdate.addListener app.setCurrentTime

			app.events.onCurrentModeChange.addListener (nmode) ->
				if nmode != 'Watch'
					playerObj.pause()
				else if nmode == 'Watch'
					playerObj.play()

		# We want to populate the available shapes with the rectangle and ellipse. These are considered stock
		# shapes for annotations.
		app.ready ->
			# Using addShapeType to add Rectangle to the array of possible SVG
			# shapes
			app.addShapeType "Rectangle",
				#
				# Calculate the center and extents given the corner and extents.
				#
				# Parameters:
				#
				# * coords - object holding the .x, .y, .width, and .height
				#
				# Returns:
				#
				# An object holding the .x, .y, .w, and .h holding the center and extents.
				#
				calc: (coords) ->
					x: coords.x + (coords.width / 2)
					y: coords.y + (coords.height / 2)
					w: coords.width
					h: coords.height
					
				#
				# Renders the SVG <rect/> element representing the rectangle
				#
				# Parameters:
				#
				# * model - the data store or data view holding information abut the item to be rendered
				#
				# * itemId - the item ID of the item to be rendered
				# 
				renderAsSVG: (model, itemId) ->
					item = model.getItem itemId
					"<rect x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"

				rootSVGElement: ["rect"]
				
				extractFromSVG: (svg) ->
					info = {}
					info.w = parseFloat svg.getAttribute('width')
					info.h = parseFloat svg.getAttribute('height')
					info.x = parseFloat svg.getAttribute('x')
					info.y = parseFloat svg.getAttribute('y')
					info
				
				#
				# Renders the rectangular constraint on the video target.
				#
				# Parameters:
				#
				# * container - the container holding the lens content
				#
				# * view - the presentation managing the collection of renderings
				#
				# * model - the data store or data view holding information abut the item to be rendered
				#
				# * itemId - the item ID of the item to be rendered
				#
				# Returns:
				#
				# The rendering object.
				#
				lens: (container, view, model, itemId) ->
					# Note: Rectangle measurements x,y start at CENTER
					# Initiate object with super-class methods and variables
					that = app.initShapeLens container, view, model, itemId
					item = model.getItem itemId

					# Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
					c = view.canvas.rect(item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.w[0], item.h[0])

					that.shape = c
					# fill and set opacity
					c.attr
						fill: "silver"
						border: "grey"
					that.setOpacity()

					# **FIXME:** may break with multiple videos if different annotations have the same ids in different
					# sets of annotations.
					# Should be fixed with UUID
					$(c.node).attr('id', item.id[0])

					selectBinding = app.controller.selectShape.bind c
					selectBinding.events.onSelect.addListener ->
						app.setActiveAnnotation(itemId)

					superUpdate = that.update
					that.update = (newItem) ->
						# receiving the Object passed through
						# model.updateItems in move()
						item = newItem
						superUpdate item
						if item.x? and item.y? and item.w? and item.h?
							c.attr
								x: item.x[0] - item.w[0] / 2
								y: item.y[0] - item.h[0] / 2
								width: item.w[0]
								height: item.h[0]

					# calculate the extents (x, y, width, height)
					# of this type of shape
					that.getExtents = ->
						x: c.attr("x") + (c.attr("width") / 2)
						y: c.attr("y") + (c.attr("height") / 2)
						width: c.attr("width")
						height: c.attr("height")

					that

			app.addShapeType "Ellipse",
				# Generates a JSON object containing the measurements for an
				# ellipse object but only using x, y, w, h
				#
				# Returns:
				# JSON object
				calc: (coords) ->
					x: coords.x + (coords.width / 2)
					y: coords.y + (coords.height / 2)
					w: coords.width
					h: coords.height
					
				#
				# Renders the SVG <rect/> element representing the rectangle
				#
				# Parameters:
				#
				# * model - the data store or data view holding information abut the item to be rendered
				#
				# * itemId - the item ID of the item to be rendered
				# 
				renderAsSVG: (model, itemId) ->
					item = model.getItem itemId
					"<elli x='#{item.x[0]}' y='#{item.y[0]}' width='#{item.w[0]}' height='#{item.h[0]}' />"
					
				rootSVGElement: ["elli"]
				
				extractFromSVG: (svg) ->
					info = {}
					info.w = parseFloat svg.getAttribute('width')
					info.h = parseFloat svg.getAttribute('height')
					info.x = parseFloat svg.getAttribute('x')
					info.y = parseFloat svg.getAttribute('y')
					info
				#
				# Rendering Lens for the Ellipse SVG shape
				#
				# Parameters:
				#
				# * container - the container holding the lens content
				#
				# * view - the presentation managing the collection of renderings
				#
				# * model - the data store or data view holding information abut the item to be rendered
				#
				# * itemId - the item ID of the item to be rendered
				#
				# Returns:
				#
				# The rendering object.
				#
				lens: (container, view, model, itemId) ->
					that = app.initShapeLens container, view, model, itemId
					item = model.getItem itemId

					# create the shape
					c = view.canvas.ellipse(item.x[0], item.y[0], item.w[0] / 2, item.h[0] / 2)
					that.shape = c

					# fill shape
					c.attr
						fill: "silver"
						border: "grey"
					that.setOpacity()

					selectBinding = app.controller.selectShape.bind c
					selectBinding.events.onSelect.addListener ->
						app.setActiveAnnotation(itemId)

					superUpdate = that.update

					that.update = (item) ->
						# receiving the Object passed through
						# model.updateItems in move()
						superUpdate item

						if item.x? and item.y?
							c.attr
								cx: item.x[0]
								cy: item.y[0]
								rx: item.w[0] / 2
								ry: item.h[0] / 2
					
					# calculate the extents (x, y, width, height)
					# of this type of shape
					that.getExtents = ->
						x: c.attr("cx")
						y: c.attr("cy")
						width: (c.attr("rx") * 2)
						height: (c.attr("ry") * 2)

					that

			# Adding in button features for annotation creation
			# These will be taken care of elsewhere
			rectButton = app.buttonFeature 'buttongrouping', 'Shapes', 'Rectangle'

			ellipseButton = app.buttonFeature 'buttongrouping', 'Shapes', 'Ellipse'

			selectButton = app.buttonFeature 'buttongrouping', 'General', 'Select'

			watchButton = app.buttonFeature 'buttongrouping', 'General', 'Watch'

			app.setCurrentTime 0

			# binding time controller to time DOM
			timeControlBinding = app.controller.timecontrol.bind '.timeselect', {}
			timeControlBinding.events.onUpdate.addListener (id, start, end) ->
				app.dataStore.canvas.updateItems [
					id: id
					npt_start: start
					npt_end: end
				]