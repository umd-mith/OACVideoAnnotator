$(document).ready(function() {
	module('Core');
	
	test("Check requirements", function() {
		expect(5);
		ok( jQuery, "jQuery" );
		ok( $, "$" );
		ok( Raphael, "Raphael" );
		ok(OAC, "OAC");
		ok(MITHGrid, "MITHGrid");
	});
});