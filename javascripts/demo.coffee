# # Video Annotator Demo
# 
#
# This is the CoffeeScript source for the demo.js file used in the [demonstration page](/OACVideoAnnotator/demo.html).
# This is an example of how you might build a video annotation application using the Video Annotator and
# MITHgrid libraries.
#
# We start by defining some default configuration information, then define the components we'll need for
# the user interface outside the Video Annotator core, and then we end by defining the sub-class of the
# Video Annotator that ties everything together.
#
###
#
# ## Educational Community License, Version 2.0
# 
# Copyright 2011 University of Maryland. Licensed under the Educational
# Community License, Version 2.0 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of the License at
# 
# http:#www.osedu.org/licenses/ECL-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
###


# ## Default Configurations
#
# We define some default configurations for the controllers and other components we define here.
# MITHgrid combines these configurations with any we provide when we instantiate an object.
#

# ### Hover (controller)
#
# Each binding object will have the following events available:
#
# - onFocus
# - onUnfocus
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Demo.Hover",
	bind:
		events:
			onFocus: null
			onUnfocus: null

# ### Click (controller)
#
# Each binding object will have the following events available:
#
# - onSelect
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Demo.Click",
	bind:
		events:
			onSelect: null

# ### TextControls (component)
#
# Each instance of this component will have the following events available:
#
# - onDelete
# - onEdit
# - onSave
#
# Additionally, the text control DOM elements will be added to the container passed in to the
# instance constructor.
#
MITHGrid.defaults "OAC.Client.StreamingVideo.Demo.TextControls",
	events:
		onCancel: null
		onDelete: null
		onEdit: null
		onSave: null
	viewSetup: """
		<span class="edit"><a href="#" title="edit annotation"></a></span>
		<span class="save"><a href="#" title="save edit"></a></span>
		<span class="cancel"><a href="#" title="cancel edit"></a></span>	
		<span class="delete"><a href="#" title="delete annotation"></a></span>
	"""

# ## Components
#
OAC.Client.StreamingVideo.namespace "Demo", (Demo) ->
	# ### Click (controller)
	#
	# Attaches a click handler to an SVG rendering and fires an onSelect event if the rendering is clicked AND
	# the application is in a mode to select things.
	#
	Demo.namespace "Click", (Click) ->
		Click.initInstance = (args...) ->
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Demo.Click", args..., (that) ->
				that.applyBindings = (binding) ->
					binding.locate('').click binding.events.onSelect.fire
	
	# ### Hover (controller)
	#
	# Attaches a set of hover handlers to a DOM element and fires onFocus and onUnfocus events as the
	# mouse starts or stops hovering over the element.
	#
	Demo.namespace "Hover", (Hover) ->
		Hover.initInstance = (args...) ->
			MITHGrid.Controller.initInstance "OAC.Client.StreamingVideo.Demo.Hover", args..., (that) ->
				that.applyBindings = (binding) ->
					binding.locate('').hover binding.events.onFocus.fire, binding.events.onUnfocus.fire

	# ### TextControls (component)
	#
	# 
	Demo.namespace "TextControls", (TextControls) ->
		#
		# We have a global click controller since we don't have any particular configuration that
		# is specific to the TextControls instance.
		#
		clickController = Demo.Click.initInstance {}
		
		TextControls.initInstance = (args...) ->	
			MITHGrid.initInstance "OAC.Client.StreamingVideo.Demo.TextControls", args..., (that, container) ->
				options = that.options
				app = options.application()
				appFn = options.application
				shown = false
				inEditing = false
				setEditMode = ->
				resetEditMode = ->

				$(document).ready ->
					#
					# Instead of building a controller that will bind to four different aspects of
					# the text controls DOM, we attach the controller to each of the controls we
					# show.
					#
					
					editEl = $(container).find(".edit")
					saveEl = $(container).find(".save")
					cancelEl = $(container).find(".cancel")
					deleteEl = $(container).find(".delete")
				
					editBinding = clickController.bind editEl
					saveBinding = clickController.bind saveEl
					cancelBinding = clickController.bind cancelEl
					deleteBinding = clickController.bind deleteEl
					
					#
					# We use a pair of helpers to manage which tools we show.
					#
					setEditMode = ->
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
					
					#
					# We take each of the bindings and add a listener that will manage the set of icons we show.
					# We also fire the individual command-related events that this component exposes.
					#
					editBinding.events.onSelect.addListener ->
						if shown and not inEditing
							setEditMode()
							that.events.onEdit.fire()
					saveBinding.events.onSelect.addListener ->
						if shown and inEditing
							resetEditMode()
							that.events.onSave.fire()
					cancelBinding.events.onSelect.addListener ->
						if shown and inEditing
							resetEditMode()
							that.events.onCancel.fire()
					deleteBinding.events.onSelect.addListener ->
						if shown and not inEditing
							that.events.onDelete.fire()
					
					resetEditMode()

				#
				# #### #eventShow
				#
				# Shows the tools in the DOM. Also resets edit mode flags.
				#
				that.eventShow = -> 
					resetEditMode()
					$(container).show()
					shown = true
			
				#
				# #### #eventHide
				#
				# Hides the tools in the DOM.
				that.eventHide = -> 
					$(container).hide()
					shown = false
			
				#
				# #### #eventMove
				#
				# Moves the tools to the indicated location. For now, we assume that the tools are 15px wide each.
				# Two tools (2 * 15px) plus a 15px separation from the text gives us the 45px deduction.
				#
				# We reset edit mode if we're in edit mode and we're displayed. This triggers a cancel event
				# to cancel any editing.
				#
				that.eventMove = (top, right) ->
					if shown and inEditing
						resetEditMode()
						that.events.onCancel.fire()
						
					$(container).css
						top: top + "px"
						left: (right - 45) + "px"
				
				that.eventHide()


	# ## Demo Application
	#
	# Now that we have our various components defined, we can proceed to the meat of the demo: sub-classing the Video Annotator
	# to add our own annotation body display and edit controls. We also add an import/export tie in to the UI.
	#
	# Typical usage of this would be similar to what we do in the [demo.html](/OACVideoAnnotator/demo.html) page:
	#
	#     $(document).ready(function() {
	#       OAC.Client.StreamingVideo.Player.onNewPlayer(
	#         function(playerobj) {
	#           var app = 
	#             OAC.Client.StreamingVideo.Demo.Application.initInstance({
	#               player: playerobj
	#             });
	#  
	#           app.run();
	#         }
	#       );
	#     });
	#
	Demo.namespace "Application", (Application) ->
		#
		# We have a few objects that aren't tied to a particular instance of our demo application, so we
		# create them here. Controllers that are not configured based on the application instance are excellent
		# candidates for this.
		#
		hoverController = OAC.Client.StreamingVideo.Demo.Hover.initInstance()
		
		Application.initInstance = (args...) ->
			#
			# We begin by creating an instance of the Video Annotator application.
			# This requires the player object passed in by the onNewPlayer function above.
			#
			OAC.Client.StreamingVideo.Application.initInstance "OAC.Client.StreamingVideo.Demo.Application", args..., (app) ->
				#
				# Creating a function `appFn` that will return the `app` object is an easy way to ensure that the proper
				# object is passed through the initInstance process. This is an idiom that shows up in MITHgrid-based
				# projects.
				#
				appFn = -> app

				#
				# Running the application causes all of the DOM elements, presentations, and other components to be
				# instantiated. Once that is done, we proceed with adding the annotations view and hooking up the
				# controllers and events.
				#
				# `app.ready` does for the application what `$(document).ready` does for the DOM.
				#
				app.ready ->

					#
					# We create a simple presentation of the annotations. This particular presentation type has a
					# base body lens that we can build from. We'll add edit controls next.
					#
					annotations = OAC.Client.StreamingVideo.Presentation.AnnotationList.initInstance '#annotation-text',
						dataView: app.dataView.currentAnnotations
						lensKey: ['.bodyType']
						application: appFn

					#
					# We use the TextControls component to create the controls we'll use for managing the text
					# annotation bodies. 
					#
					# **N.B.:** Since we only have a single video in the demo, we can get away with
					# using an id-based container. If we wanted this to work for multiple videos, each with their
					# own text controls, we would need to based the container on something tied to the application.
					#
					textControls = OAC.Client.StreamingVideo.Demo.TextControls.initInstance "#text-controls",
						application: appFn
			
					#
					# We want the text annotation list to focus on the Video Annotator's active
					# annotation, so we make sure any changes to the ActiveAnnotation variable
					# propagate to the annotations presentation.
					#
					app.events.onActiveAnnotationChange.addListener annotations.eventFocusChange
					
					#
					# Now we set up each of the actions that the text controls can generate.
					# Presentations track which rendering is currently in focus. For the Video Annotator
					# application, this is the same item as the ActiveAnnotation since we hooked
					# the presentation's focus to the application's ActiveAnnotation variable above.
					#					
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
							
					textControls.events.onCancel.addListener ->
						rendering = annotations.getFocusedRendering()
						if rendering?
							rendering.eventCancel()
		
					
					#
					# Now we add the meat of the annotation presentation: the body text rendering. In MITHgrid,
					# item templates are called Lenses. These lenses are functions that return a JavaScript
					# object with a number of properties. Check out the MITHgrid documentation for a list of
					# typical properties. Additional properties may be needed by certain presentations.
					#
					annotations.addLens "Text", (container, view, model, itemId) ->
						#
						# We start by calling the base text rendering from the annotation presentation. This
						# handles putting the text in the DOM and updating it when it changes.
						#
						rendering = annotations.initTextLens container, view, model, itemId
						#
						# Now we tie in the hover controller. The binding gives us a way to access the events
						# generated by the hover controller for this element.
						#
						hoverBinding = hoverController.bind rendering.el
						#
						# We use `inEditing` to track state so we know if we need to lock/unlock the ActiveAnnotation
						# variable among other changes.
						#
						inEditing = false
						
						#
						# We go ahead and set up the editing elements for use later.
						#
						textEl = $(rendering.el).find(".body-content")
						inputEl = $("<textarea></textarea>")
						rendering.el.append(inputEl)
						inputEl.hide()

						#
						# When we hover over the text annotation, we switch the active annotation to that item.
						# We don't worry about what happens when we 'unhover' (which would be the `unFocus` event). 
						# We keep the same active annotation.
						# Note that we don't check to see if we're editing. Nor do we do anything else that might
						# seem appropriate for changing focus (such as hiding the text controls or moving them to
						# the newly focused annotation). Instead, we allow those consequences to happen as the
						# change to ActiveAnnotation propagates. If we're editing, then the change won't happen
						# and we don't have to worry about the consequences.
						#
						hoverBinding.events.onFocus.addListener ->
							app.setActiveAnnotation itemId
						
						#
						# Now we want to handle showing the edit controls when this rendering is active.
						# We split this out from the above binding events focus/unfocus handling since
						# an annotation can become active from several different avenues.
						#
						superFocus = rendering.eventFocus
						superUnfocus = rendering.eventUnfocus

						rendering.eventFocus = ->
							superFocus()
							textControls.eventMove $(rendering.el).position().top, $(rendering.el).position().left
							textControls.eventShow()

						rendering.eventUnfocus = ->
							textControls.eventHide()
							superUnfocus()
						
						#
						# And now we add the rendering's handling of text control events.
						# We lock the ActiveAnnotation variable while we're editing so the controls don't
						# move to another annotation on us. This will keep the highlighted shape over the
						# video from changing as well. It won't keep the video from playing or the annotation
						# going out of scope. We leave as an exercise keeping the player from playing while
						# editing an annotation.
						#
						rendering.eventEdit = ->
							if not inEditing
								app.lockActiveAnnotation()
								inEditing = true
								text = textEl.text()
								textEl.hide()
								inputEl.show()
								inputEl.val(text)							
						
						#
						# Note that we don't allow the text annotation to trigger a deletion of the annotation from
						# the MITHgrid data store unless we're not in editing mode. There are other ways to remove
						# the annotation from the data store.
						#
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

					#
					# We now tie together the mode buttons in the Tools area with the Video Annotator
					# CurrentMode variable.
					#
					# A better way to do this might be to have a generic modal button component that
					# fires an event with the mode name. We would then hook that event to the application
					# setCurrentMode method to change the application's mode.
					#
					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeRectangle",
						mode: "Rectangle"
						application: appFn

					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeEllipse",
						mode: "Ellipse"
						application: appFn

					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeSelect",
						mode: "Select"
						application: appFn

					OAC.Client.StreamingVideo.Component.ModeButton.initInstance "#modeWatch",
						mode: "Watch"
						application: appFn

					#
					# We finish out by tying in the import/export functions. We aren't using any MITHgrid-style
					# controllers for this.
					#
					$("#select-button").click ->
						$("#export-text").focus()
						$("#export-text").select()
						
					$("#export-button").click ->
						data = app.exportData()
						$("#export-text").val jsl.format.formatJson JSON.stringify data

					$("#import-button").click ->
						str = $("#export-text").val()
						if str != ""
							app.importData JSON.parse str