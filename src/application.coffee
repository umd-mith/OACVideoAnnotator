# # Annotation Application
#

OAC.Client.StreamingVideo.namespace "Application", (Application) ->
	# ### #S4 (private)
	#
	# Generates a UUID value, this is not a global uid
	#
	# Returns:
	# String with 16-byte pattern
	S4 = () -> (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

	# ### #uuid (private)
	#
	# Generates a UUID
	#
	# This is not a globally unique value - theoretically could clash with another
	# value if enough MITHGrid instances are started. Works now as a local
	# unique ID
	# **FIXME:** Abstract so that there is a server prefix component that insures
	# more of a GUID
	#
	uuid = () -> (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
	
	# ## StreamingVideo.initInstance
	#
	# Options:
	#
	# * 
	#
	Application.initInstance = (args...) ->
		appOb = MITHGrid.Application.initInstance "OAC.Client.StreamingVideo.Application", args..., {
			controllers:
				keyboard:
					isActive: -> appOb.getCurrentMode() != 'Editing'
				selectShape:
					isSelectable: -> appOb.getCurrentMode() == "Select"
		}, (app) ->
			shapeTypes = {}
			shapeAnnotationId = 0
			xy = []
			wh = []
					
			options = app.options
		

			# We isolate the player object through a closure so it won't change on us.
			# We expect one application instance per player.
			playerObj = options.player
		
			options.url = options.url or playerObj.getTargetURI()
		
			screenSize = {}
			if playerObj?
				[ screenSize.width, screenSize.height ] = playerObj.getSize()
		
				playerObj.events.onResize.addListener (s) ->
					[ screenSize.width, screenSize.height ] = s

			app.getPlayer = -> playerObj
	
			app.ready ->
				app.initShapeLens = app.presentation.raphsvg.initShapeLens

			app.getCurrentModeClass = ->
				m = app.getCurrentMode()
				if shapeTypes[m]?
					"shape"
				else
					switch m
						when "Select" then "select"
						when "Watch"  then "video"
						else
							null

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
				shapeTypes[type] = args
				app.presentation.raphsvg.addLens(type, args.lens)

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
						id: "_:anno" + shapeAnnotationId
						type: "Annotation"
						bodyType: "Text"
						bodyContent: "This is an annotation for " + curMode
						shapeType: curMode
						targetURI: app.options.url
						targetHeight: screenSize.height
						targetWidth: screenSize.width
						# Starts off with half-opacity, 1 is for in-focus
						npt_start: if(npt_start<0) then 0 else npt_start
						npt_end: npt_end

					app.dataStore.canvas.loadItems [t = $.extend(true, shapeItem, shape)]
					app.setActiveAnnotation shapeItem.id
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
				EXIF: "http://www.w3.org/2003/12/exif/ns#"
		
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
																				if data[hasSubSelector]["#{NS.EXIF}width"]? and data[hasSubSelector]["#{NS.EXIF}width"][0]?
																					temp.targetWidth = parseFloat data[hasSubSelector]["#{NS.EXIF}width"][0].value
																				if data[hasSubSelector]["#{NS.EXIF}height"]? and data[hasSubSelector]["#{NS.EXIF}height"][0]?
																					temp.targetHeight = parseFloat data[hasSubSelector]["#{NS.EXIF}height"][0].value
																			
															
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
						uri     id[2], NS.RDF,  "type",              "#{NS.OAX}SvgSelector"
						literal id[2], NS.DC,   "format",            "text/svg+xml"
						literal id[2], NS.CNT,  "characterEncoding", "utf-8"
						literal id[2], NS.CNT,  "chars",             svglens(app.dataStore.canvas, obj.id[0])
						if obj.targetHeight? and obj.targetHeight[0]?
							literal id[2], NS.EXIF, "height",        obj.targetHeight[0]
						else
							literal id[2], NS.EXIF, "height",        screenSize.height
						if obj.targetWidth? and obj.targetWidth[0]?
							literal id[2], NS.EXIF, "width",         obj.targetWidth[0]
						else
							literal id[2], NS.EXIF, "width",         screenSize.width
		
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

				# We always want the current annotation list to include anything that covers a time within five seconds
				# of the current time.
				app.events.onCurrentTimeChange.addListener (t) ->
					app.dataView.currentAnnotations.setKeyRange(t - 5, t + 5)
					playerObj.setPlayhead t
					# Making sure that none of the button items are still active while video is playing
					# (Can't draw a shape while video is playing - force user to re-click item)
					if app.getCurrentMode() != "Watch"
						app.setCurrentMode null

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

					#
					# We are interested in <rect/> elements. If the SvgConstraint is a <rect/> element, then
					# the import routine will call the extractFromSVG() function and the imported annotation
					# will have a shapeType of "Rectangle"
					#
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
						app.initShapeLens container, view, model, itemId, (that) ->
							item = model.getItem itemId

							# Accessing the view.canvas Object that was created in MITHGrid.Presentation.RaphSVG
							[x, y] = that.scalePoint item.x[0] - (item.w[0] / 2), item.y[0] - (item.h[0] / 2), item.targetWidth, item.targetHeight
							[w, h] = that.scalePoint item.w[0], item.h[0], item.targetWidth, item.targetHeight
					
							c = view.canvas.rect(x, y, w, h)

							that.shape = c
							# fill and set opacity
							c.attr
								fill: "silver"
								border: "grey"
							that.setOpacity()

							$(c.node).css
								"pointer-events": "auto"

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
									[x, y] = that.scalePoint item.x[0], item.y[0], item.targetWidth, item.targetHeight
									[w, h] = that.scalePoint item.w[0], item.h[0], item.targetWidth, item.targetHeight
									c.attr
										x: x - w / 2
										y: y - h / 2
										width: w
										height: h

							# calculate the extents (x, y, width, height)
							# of this type of shape
							that.getExtents = ->
								x: c.attr("x") + (c.attr("width") / 2)
								y: c.attr("y") + (c.attr("height") / 2)
								width: c.attr("width")
								height: c.attr("height")

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
						app.initShapeLens container, view, model, itemId, (that) ->
							item = model.getItem itemId

							# create the shape
							[x, y] = that.scalePoint item.x[0], item.y[0], item.targetWidth, item.targetHeight
							[w, h] = that.scalePoint item.w[0]/2, item.h[0]/2, item.targetWidth, item.targetHeight
							c = view.canvas.ellipse(x, y, w, h)
							that.shape = c

							# fill shape
							c.attr
								fill: "silver"
								border: "grey"
							that.setOpacity()
							$(c.node).css
								"pointer-events": "auto"

							selectBinding = app.controller.selectShape.bind c
							selectBinding.events.onSelect.addListener ->
								app.setActiveAnnotation(itemId)

							superUpdate = that.update

							that.update = (item) ->
								# receiving the Object passed through
								# model.updateItems in move()
								superUpdate item

								if item.x? and item.y?
									[x, y] = that.scalePoint item.x[0], item.y[0], item.targetWidth, item.targetHeight
									[w, h] = that.scalePoint item.w[0], item.h[0], item.targetWidth, item.targetHeight
									c.attr
										cx: x
										cy: y
										rx: w / 2
										ry: h / 2
					
							# calculate the extents (x, y, width, height)
							# of this type of shape
							that.getExtents = ->
								x: c.attr("cx")
								y: c.attr("cy")
								width: (c.attr("rx") * 2)
								height: (c.attr("ry") * 2)

				app.setCurrentTime 0