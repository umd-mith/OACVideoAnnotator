
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.CanvasClickController", {
    bind: {
        events: {
            onClick: null
        }
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnoActiveController", {
    bind: {
        events: {
            onClick: null,
            onDelete: null,
            onUpdate: null
        }
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid", {
    events: {
        onResize: null,
        onMove: null,
        onEdit: null,
        onDelete: null
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.KeyboardListener", {
    bind: {
        events: {
            onDelete: ["preventable", "unicast"]
        }
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo", {
	controllers: {
		keyboard: {
			type: OAC.Client.StreamingVideo.Controller.KeyboardListener,
			selectors: {
				doc: ''
			}
		},
		editBox: {
			type: OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid
		},
		canvas: {
			type: OAC.Client.StreamingVideo.Controller.CanvasClickController,
			selectors: {
				svg: ''
			}
		},
		annoActive: {
			type: OAC.Client.StreamingVideo.Controller.AnnoActiveController,
			selectors: {
				annotation: '',
				annotationlist: ':parent',
				bodycontent: '.bodyContent',
				body: '.body',
				editbutton: '.button.edit',
				editarea: '.editArea',
				textarea: '.editArea > textarea',
				updatebutton: '.button.update',
				deletebutton: '.button.delete'
			}
		}
	},
	variables: {
		ActiveAnnotation: {
			is: 'rw'
		}
	},
	dataViews: {
		// view for the space in which data from shapes
		// is drawn
		drawspace: {
			dataStore: 'canvas',
			types: ["Rectangle","Ellipse"]
		}
	},
	// Data store for the Application
	dataStores: {
		canvas: {
			// put in here the types of data that will
			// be represented in OACVideoAnnotator
			types:{
				// types of shapes -- to add a new
				// shape object, add it here
				Rectangle: {},
				Ellipse: {}
			},
			properties: {
				// posInfo contains the SVG dimensions for
				// a shape
				bodyContent: {
					valueType: 'text'
				},
				targetURI: {
					valueType: 'uri'
				}
			}

		}

	},
	presentations: {
		raphsvg: {
			type: MITHGrid.Presentation.RaphaelCanvas,
			dataView: 'drawspace',
			controllers: {
				keyboard: "keyboard",
				editBox: "editBox",
				canvas: "canvas"
			}
		},
		annoItem: {
			type: MITHGrid.Presentation.AnnotationList,
			dataView: 'drawspace',
			container: '.anno_list'
		} //annoItem
	}
});
// End of OAC Video Annotator

// @author Grant Dickie