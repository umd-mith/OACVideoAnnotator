/*
Related functions for importing
manifest data into MITHGrid and OAC

Converting: RDF -> JSON
*/

 (function(OAC, MITHGrid, $) {
	
	prefixes = {
		dc:'http://purl.org/dc/elements/1.1/',
		dcterms:'http://purl.org/dc/terms/',
		dctype:'http://purl.org/dc/dcmitype/',
		oac:'http://www.openannotation.org/ns/',
		cnt:'http://www.w3.org/2008/content#',
		dms:'http://dms.stanford.edu/ns/',
		rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		ore:'http://www.openarchives.org/ore/terms/',
		exif:'http://www.w3.org/2003/12/exif/ns#'
	};
	
    OAC.initManifest = function(options) {
		that = {};
		rdfbase = $.rdf();
		
		$.each(prefixes, function(ns, href) {
			rdfbase.prefix(ns, href);
		});
		
		
	};

})(OAC, MITHGrid, jQuery);