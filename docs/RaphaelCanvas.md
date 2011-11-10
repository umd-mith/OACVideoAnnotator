MITHGrid.Presentation.RaphaelCanvas
===================================

The RaphaelCanvas presentation provides a simple Raphaël surface to which
lenses can draw.

Methods
-------

presentation = MITHGrid.Presentation.RaphaelCanvas.initPresentation(
	container,
	{
		dataView: ...,
		lenses: {
			...
		},
		cHeight: ...,
		cWidth: ...
	}
);

The container, dataView, and lenses are as expected for standard
presentations.

Each lens represents a different SVG shape which is stored in the 
dataStore. The lens' responsibility is to draw this shape using the 
presentation.canvas object.

The cHeight and cWidth are the optional container height and width. If not
specified, the height and width will be taken from the container as it is in
the DOM.

Properties
----------

presentation.canvas

The Raphaël canvas is available as the .canvas property on the presentation
object. Currently, Raphaël supports Rectangles, Circles, Ellipses, and Polygons. Other
definitions have to be custom-built. See the Raphaël documentation for more information (link) 


Events
---------

There are several controllers and events to which a SVG Element can be attached. This is done
within the Lens function. 