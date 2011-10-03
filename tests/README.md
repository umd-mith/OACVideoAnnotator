Testing Environment for OAC Video Annotator
-------------------------------------------

This folder contains the *index.html* file that displays the testing area and the scripts to generate testing modules. Point your browser at `http://<your installation of OACVideoAnnotator>/tests` and the testing area will be on display. 
	
Each window displays a different testing module. The names of the modules refer to the names of the Objects in the OAC Video Annotator main code. If a bug is reported or found in that particular object, tests will be generated and given names. If a test doesn't pass, it will be displayed in red and an error is displayed.

Create Your Own Tests
---------------------
----------------------

This uses the QUnit software - [documentation here](http://docs.jquery.com/Qunit). The documentation provides instructions on developing your own test modules. A typical test module is pretty simple and looks like this:

module("Testing Video Annotator Canvas");

test("Checking that Object exists", function() {
	expect(1);
	//display expression to evaluate and then success string to display
	ok(MITHGrid.Application.Canvas, "VideoAnnotator Canvas exists");
	
});