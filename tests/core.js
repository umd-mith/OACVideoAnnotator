$(document).ready(function() {
	module('Core');
	
	test("Check requirements", function() {
		expect(3);
		ok( jQuery, "jQuery" );
		ok( $, "$" );
		ok( Raphael, "Raphael" );
	});
});