/*
Export functionality for OAC Video Streaming Client

Exporting JSON data into RDF format as per the 
Shared Canvas implementation.

For initial use in the Interedition Symposium, 
Den Haag

@author: Grant Dickie 2012
*/

(function($) {
	var ingestJSON,
	convertJSONtoRDF,
	exportRDF,
	JSONdump,
	RDF,
	idcount = 0,
	NSArray = {
		annotation: 'http://www.openannotation.org/ns/Annotation',
		textanno: 'http://dms.stanford.edu/ns/TextAnnotation'
	};
	
	/* 
	Takes in JSON from MITHGrid data store -- is passed
	data store array of items
	
	populates: @JSONdump
	*/
	ingestJSON = function(data) {
		JSONdump = data;
		
		return JSONdump;
	};
	
	
	/*
	Converts JSONdump data out into RDF format,
	saves as jQuery DOMDocument
	
	populates: @RDF
	*/ 
	convertJSONtoRDF = function() {
		RDF = '<rdf:RDF xmlns:cnt="http://www.w3.org/2008/content#" xmlns:dc="http://purl.org/dc/elements/1.1/"' +
		 'xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dms="http://dms.stanford.edu/ns/"' + 
		 'xmlns:exif="http://www.w3.org/2003/12/exif/ns#" xmlns:foaf="http://xmlns.com/foaf/0.1/"' +
		 'xmlns:oac="http://www.openannotation.org/ns/" xmlns:ore="http://www.openarchives.org/ore/terms/"' +
		 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">';
		
		$.each(JSONdump, function(i, o) {
			if(o.type === 'Annotation') {
				RDF += '<rdf:Description rdf:about="' + idcount + '">\n' + 
						'<rdf:hasBody></rdf:hasBody>\n' + 
						'<rdf:type rdf:resource="' + NSArray.annotation + '"></rdf:type>\n';
				if(o.bodyType === 'text') {
					RDF += '<rdf:type rdf:resource="' + NSArray.textanno + '" />';
				}
				
				RDF += '<rdf:hasTarget rdf:resource="' + o.targetURI + '" />\n' +
				'</rdf:Description>\n';
			}
			idcount++;
		});
		
		RDF += '</rdf:RDF>';
		
		return RDF;
	};
	
	
	/*
	Export using socket.io/other method
	*/
	exportRDF = function() {
		
		
		
	};
	
})(jQuery);