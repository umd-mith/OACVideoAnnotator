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
		
		/**
		Goals for importing:
		
		* Get the raw data from remote source (NodeJS)
		* Use RDFQuery to create a databank from raw
		* Query/aggregate data from databank
		* Form JSON from datadump
		* Troll datadump and create dataStore
		
		**/
		
		socket = io.connect(options.proxy);
	      proxyRequests = {};
	      socket.on('RESPONSE', function(data) {
	        if (proxyRequests[data.id] != null) {
	          if (data.content != null) {
	            proxyRequests[data.id].success(data.content);
	          } else {
	            proxyRequests[data.id].error(data.error);
	          }
	          return delete proxyRequests[data.id];
	        }
	      });
		
		
		
		
	};

})(OAC, MITHGrid, jQuery);