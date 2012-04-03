
// # Default Configurations
//

// ## Controller.CanvasClickController
//
// Bindings created by this controller will have the following events:
//
// - onClick
// - onShapeStart
// - onShapeDrag
// - onShapeDone
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

// ## Controller.TextBodyEditor
//
// Bindings created by this controller will have the following events:
//
// - onClick
// - onDelete
// - onUpdate
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.TextBodyEditor", {
    bind: {
        events: {
            onClick: null,
            onDelete: null,
            onUpdate: null
        }
    }
});

// ## Controller.AnnotationEditSelectionGrid
//
// Bindings created by this controller will have the following events:
//
// - onResize
// - onMove
// - onEdit
// - onDelete
// - onCurrentModeChange
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationEditSelectionGrid", {
	dirs: ['ul', 'top', 'ur', 'lft', 'lr', 'btm', 'll', 'rgt', 'mid'],
    bind: {
		events: {
	        onResize: null,
	        onMove: null,
	        onEdit: null,
	        onDelete: null,
			onCurrentModeChange: null
	    }
	}
});

// ## Controller.KeyboardListener
//
// Bindings created by this controller will have the following events:
//
// - onDelete
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.KeyboardListener", {
    bind: {
        events: {
            onDelete: ["preventable", "unicast"]
        }
    }
});

// ## Controller.AnnotationCreationButton
//
// Bindings created by this controller will have the following events:
//
// - onCurrentModeChange
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.AnnotationCreationButton", {
	bind: {
		events: {
			onCurrentModeChange: null
		}
	}
});

// ## Controller.ShapeCreateBox
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.ShapeCreateBox", {
	bind: {
		events: {
			
		}
	}
});

// ## Controller.WindowResize
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.WindowResize", {
	bind: {
		events: {
			onResize: null
		}
	},
	selectors: {
		'': ''
	}
});

// ## Controller.Drag
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Drag", {
	bind: {
		events: {
			onFocus: null,
			onUnfocus: null,
			onUpdate: null
		}
	},
	selectors: {
		'': ''
	}
});

// ## Controller.Select
//
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.Select", {
	bind: {
		events: {
			onSelect: null
		}
	},
	selectors: {
		'': ''
	},
	isSelectable: function() { return true; }
});

// ## Controller.timeControl
//
// Bindings created by this controller will have the following events:
//
// - onUpdate
MITHGrid.defaults("OAC.Client.StreamingVideo.Controller.timeControl", {
	bind: {
		events: {
			onUpdate: null
		}
	}
});

// ## Annotation Client
//
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
				svgwrapper: ''
			}
		},
		annoActive: {
			type: OAC.Client.StreamingVideo.Controller.TextBodyEditor,
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
		timecontrol: {
			type: OAC.Client.StreamingVideo.Controller.timeControl,
			selectors: {
				timestart: '#timestart',
				timeend: '#timeend',
				submit: '#submittime',
				menudiv: ''
			}
		},
		selectShape: {
			type: OAC.Client.StreamingVideo.Controller.Select,
			selectors: {
				raphael: ''
			}
		},
		windowResize: {
			type: OAC.Client.StreamingVideo.Controller.WindowResize,
			selectors: {
				resizeBox: ''
			}
		}
	},
	variables: {
		// **ActiveAnnotation** holds the item ID of the annotation currently receiving selection focus.
		//
		// - setActiveAnnotation(id) sets the id
		// - getActiveAnnotation() returns the id
		// - events.onActiveAnnotationChange fires when the ActiveAnnotation value changes
		ActiveAnnotation: {
			is: 'rw'
		},
		// **CurrentTime** holds the current position of the video play head in seconds. The value defaults to 0 seconds.
		//
		// - setCurrentTime(time) sets the play head position for the annotation client (does not affect the player)
		// - getCurrentTime() returns the current play head position
		// - events.onCurrentTimeChange fires when the CurrentTime value changes
		CurrentTime: {
			is: 'rw',
			"default": 0
		},
		// **TimeEasement** holds the number of seconds an annotation eases in or out of full view.
		//
		// - setTimeEasement(t)
		// - getTimeEasement()
		// - events.onTimeEasementChange
		TimeEasement: {
			is: 'rw',
			"default": 5
		},
		// **CurrentMode** holds the current interaction mode for the annotation client. Values may be a shape type,
		// "Watch", or "Select".
		//
		// - setCurrentMode(mode) sets the annotation client mode
		// - getCurrentMode() returns the current annotation client mode
		// - events.onCurrentModeChange fires when the CurrentMode value changes
		CurrentMode: {
			is: 'rw'
		},
		// **Player** holds the current video player driver instance.
		//
		// - setPlayer(player) sets the current video player driver instance
		// - getPlayer() returns the current video player driver instance
		// - events.onPlayerChange fires when the Player value changes
		Player: {
			is: 'rw'
		}
	},
	dataViews: {
		/*
		drawspace: {
			dataStore: 'canvas',
			types: ["Annotation"]
		},
		*/
		// **currentAnnotations** pages a range of times through the annotation store selecting those
		// annotations which have a time range (.ntp\_start through .ntp\_end) that fall within the time
		// range set.
		currentAnnotations: {
			dataStore: 'canvas',
			type: MITHGrid.Data.RangePager,
			leftExpressions: [ '.ntp_start' ],
			rightExpressions: [ '.ntp_end' ]
		}
	},
	// Data store for the Application
	dataStores: {
		// **canvas** holds all of the annotation data for the client.
		canvas: {
			types:{
				// All annotation items are of type "Annotation"
				Annotation: {}
			},
			// The following properties are understood by the annotation client:
			properties: {
				// - shapeType indicates which shape is used as the SVG constraint within the frame (e.g., Rectangle or Ellipse)
				shapeType: {
					valueType: 'text'
				},
				// - bodyType indicates what kind of body the annotation associates with the target (e.g., Text)
				bodyType: {
					valueType: 'text'
				},
				// - bodyContent holds the byte stream associated with the annotation body
				bodyContent: {
					valueType: 'text'
				},
				// - targetURI points to the annotation target video without time constraints
				targetURI: {
					valueType: 'uri'
				},
				// - opacity is used in the SVG rendering of the annotation target constraint (shape)
				opacity: {
					valueType: 'numeric'
				},
				// - the play head position at which this annotation becomes active/current
				ntp_start: {
					valueType: "numeric"
				},
				// - the play head position at which this annotation ceases being active/current
				ntp_end: {
					valueType: "numeric"
				}
			}
		}
	},
	presentations: {
		raphsvg: {
			type: MITHGrid.Presentation.RaphaelCanvas,
			dataView: 'currentAnnotations',
			// The controllers are configured for the application and passed in to the presentation's
			// initInstance method as named here.
			controllers: {
				keyboard: "keyboard",
				canvas: "canvas",
				shapeCreateBox: "shapeCreateBox",
				shapeEditBox: "shapeEditBox",
				windowResize: "windowResize"
			},
			events: {
				onOpacityChange: null
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
