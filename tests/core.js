$(document).ready(function() {
	test("Check requirements", function() {
		expect(4);
		ok( jQuery, "jQuery" );
		ok( $, "$" );
		ok( fluid, "fluid" );
		ok( Raphael, "Raphael" );
	});
});