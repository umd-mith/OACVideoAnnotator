$(document).ready ->
	test "Check requirements", ->
		expect 3
		ok MITHgrid?, "MITHgrid"
		ok jQuery?, "jQuery"
		ok Raphael?, "Raphael"
		
	test "Check OAC Namespace", ->
		expect 1
		ok OAC?, "OAC namespace defined"
		
	
