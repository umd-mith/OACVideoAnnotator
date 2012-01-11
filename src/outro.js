
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.CanvasClickController", {
    bind: {
        events: {
            onClick: null,
			onShapeStart: null,
			onShapeDrag: null,
			onShapeDone: null
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
    bind: {
		events: {
	        onResize: null,
	        onMove: null,
	        onEdit: null,
	        onDelete: null
	    }
	}
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.KeyboardListener", {
    bind: {
        events: {
            onDelete: ["preventable", "unicast"]
        }
    }
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", {
	bind: {
		events: {
			onCurrentModeChange: null
		}
	}
});

MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", {
	bind: {
		events: {
			
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
		shapeEditBox: {
			type: OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid
		},
		shapeCreateBox: {
			type: OAC.Client.StreamingVideo.Controller.ShapeCreateBox
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
		},
		buttonActive: {
			type: OAC.Client.StreamingVideo.Controller.AnnotationCreationButton,
			selectors: {
				button: ''
			}
		},
		slider: {
			type: OAC.Client.StreamingVideo.Controller.sliderButton,
			selectors: {
				slider: '#slider',
				timedisplay: '.timedisplay'
			}
		}
	},
	variables: {
		ActiveAnnotation: {
			is: 'rw'
		},
		CurrentTime: {
			is: 'rw',
			"default": 0
		},
		CurrentMode: {
			is: 'rw'
		}
	},
	dataViews: {
		// view for the space in which data from shapes
		// is drawn
		drawspace: {
			dataStore: 'canvas',
			types: ["Annotation"]
		},
		currentAnnotations: {
			dataStore: 'canvas',
			type: MITHGrid.Data.RangePager,
			leftExpressions: [ '.ntp_start' ],
			rightExpressions: [ '.ntp_end' ]
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
				Annotation: {}
			},
			properties: {
				shapeType: {
					valueType: 'text'
				},
				bodyType: {
					valueType: 'text'
				},
				bodyContent: {
					valueType: 'text'
				},
				targetURI: {
					valueType: 'uri'
				},
				opacity: {
					valueType: 'numeric'
				},
				start_ntp: {
					valueType: "numeric"
				},
				end_ntp: {
					valueType: "numeric"
				}
			}
		}
	},
	presentations: {
		raphsvg: {
			type: MITHGrid.Presentation.RaphaelCanvas,
			dataView: 'currentAnnotations',
			controllers: {
				keyboard: "keyboard",
				editBox: "editBox",
				canvas: "canvas",
				shapeCreateBox: "shapeCreateBox",
				shapeEditBox: "shapeEditBox"
			},
			fadeStart: 5
		},
		annoItem: {
			type: MITHGrid.Presentation.AnnotationList,
			dataView: 'currentAnnotations',
			container: '.anno_list'
		} //annoItem
	}
});
// End of OAC Video Annotator

// @author Grant Dickie