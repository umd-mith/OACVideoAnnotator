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

The cHeight and cWidth are the optional container height and width. If not
specified, the height and width will be taken from the container as it is in
the DOM.

Properties
----------

presentation.canvas

The Raphaël canvas is available as the .canvas property on the presentation
object.