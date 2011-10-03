VIDEOANNO API
=============

A note on namespaces used in this code
------------------

The namespace MITHGrid comes from the MITHGrid code library created and managed by the Maryland Institute of Technology in the Humanities (MITH). All Presentation, View, and Application Objects are based on this namespace and are prefixed as such, e.g. the "Canvas" application is fully titled "MITHGrid.Application.Canvas".

----------------------------
MITHGrid.Application.Canvas
--------------------------

**Constructor**

The constructor for Canvas is as follows:

	MITHGrid.Application.Canvas.initApp("#main", {width: 100, height: 100});

**Configuration Options**

When invoking the Canvas object, there are several options that you can determine. As of now, these are only height and width of the SVG canvas (Defaults are the height and width of the container) and the ID of the container div. 

	"#main" - String - ID for the div that is the container of the SVG canvas
	"width" - Integer - value for the width of the SVG canvas (Defaults to the width of the container specified by the ID parameter)
	"height" - Integer - value for the height of the SVG canvas (Defaults to the height of the container specified by the ID parameter)

**On Lenses and how they affect Canvas**

Lenses are functions that take arrays of data from Views defined in the Application level of MITHGrid. They render each item as defined in the function.

The main Lens for Canvas is called *shape* and it renders each SVG shape passed to it within the SVG canvas created in the Presentation object to which it is attached. Each lens function receives four parameters: *container*, *view*, *model*, and *itemId*

The **view** parameter is how you access the SVG canvas created within the Presentation object. This is done like so:
	
	// Generating rectangle
	view.canvas.rect(x, y, w, h);
	

--------------------------

