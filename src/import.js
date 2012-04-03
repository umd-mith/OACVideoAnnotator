/*
Related functions for importing
manifest data into MITHGrid and OAC

Converting: RDF -> JSON
*/

 (function(OAC, MITHGrid, $) {
    var prefixes,
    that,
    rdfbase,
    socket,
    proxyRequests,
    loadUri,
    __indexOf,
    urisDone = [],
    requestId = 0;

    __indexOf = Array.prototype.indexOf ||
    function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] === item) return i;
        }
        return - 1;
    };
    prefixes = {
        dc: 'http://purl.org/dc/elements/1.1/',
        dcterms: 'http://purl.org/dc/terms/',
        dctype: 'http://purl.org/dc/dcmitype/',
        oac: 'http://www.openannotation.org/ns/',
        cnt: 'http://www.w3.org/2008/content#',
        dms: 'http://dms.stanford.edu/ns/',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        ore: 'http://www.openarchives.org/ore/terms/',
        exif: 'http://www.w3.org/2003/12/exif/ns#'
    };

    OAC.initManifest = function(options) {
        that = {};
        rdfbase = $.rdf();

        $.each(prefixes,
        function(ns, href) {
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
        socket.on('RESPONSE',
        function(data) {
            if (proxyRequests[data.id] !== null) {
                if (data.content !== null) {
                    proxyRequests[data.id].success(data.content);
                } else {
                    proxyRequests[data.id].error(data.error);
                }
                return delete proxyRequests[data.id];
            }
        });


        loadUri = function(uri, cb) {
            if (__indexOf.call(urisDone, uri) >= 0) {
                cb();
            }
            urisDone.push(uri);
            proxyRequests[requestId] = {
                success: function(data) {
                    var resp;
                    try {
                        resp = rdfbase.databank.load($.parseXML(data));
                    } catch(e) {
                        alert("Broken RDF/XML: " + e);
                    }
                    return cb();
                },
                error: function(err) {
                    return alert("Can not fetch data from " + uri);
                }
            };
            socket.emit('GET', {
                id: requestId,
                url: uri
            });
            return requestId += 1;
        };
        that.base = function(b) {
            return rdfbase.base(b);
        };
        that.prefix = function(ns, href) {
            return rdfbase.prefix(ns, href);
        };
        rdfToList = function(uri) {
            var firsts,
            l,
            nxt,
            rests;
            l = [];
            firsts = {};
            rests = {};
            rdfbase.where("?what rdf:first ?frst").where("?what rdf:rest ?rst").each(function() {
                firsts[this.what.value] = this.frst.value;
                return rests[this.what.value] = this.rst.value;
            }).reset();
            l.push(firsts[uri]);
            nxt = rests[uri];
            while (nxt) {
                if (firsts[nxt] !== null) {
                    l.push(firsts[nxt]);
                }
                nxt = rests[nxt];
            }
            return l;
        };
        parseNptItem = function(npt) {
            var arr,
            hrs,
            mins,
            secs;
            if (__indexOf.call(npt, ':') >= 0) {
                arr = npt.split(':');
                secs = parseFloat(arr.pop());
                mins = parseFloat(arr.pop());
                if (arr.length > 0) {
                    hrs = parseInt(arr.pop(), 10);
                } else {
                    hrs = 0;
                }
                return secs + (mins * 60) + (hrs * 3600);
            } else {
                return parseFloat(npt);
            }
        };
        getRect = function(tgt) {
            var doc,
            pth,
            rect,
            th,
            tw,
            tx,
            ty,
            _ref3;
            if (tgt.constraint !== null) {
                pth = $.parseXML(tgt.constraint.value);
                doc = $(pth);
                rect = doc.children()[0];
                tx = rect.getAttribute('x');
                ty = rect.getAttribute('y');
                tw = rect.getAttribute('width');
                th = rect.getAttribute('height');
                if (! ((tx !== null) && (ty !== null))) {
                    return null;
                }
            } else if ((tgt.fragmentInfo !== null) && tgt.fragmentInfo.length === 4) {
                _ref3 = tgt.fragmentInfo;
                tx = _ref3[0];
                ty = _ref3[1];
                tw = _ref3[2];
                th = _ref3[3];
            } else {
                return null;
            }
            return [tx, ty, tw, th];
        };
        getRemForAggr = function(uri) {
            var hshidx,
            rem;
            rem = '';
            if (uri.toString !== null) {
                uri = uri.toString();
            }
            rdfbase.reset();
            rdfbase.where("<" + uri + "> ore:isDescribedBy ?rem").where('?rem dc:format "application/rdf+xml"').each(function() {
                return rem = this.rem.value.toString();
            });
            if (rem === '') {
                rdfbase.reset();
                rdfbase.where("<" + uri + "> ore:isDescribedBy ?rem").where('?rem dc:format "application/rdf+xml"').each(function() {
                    return rem = this.rem.value.toString();
                });
            }
            if (rem === '') {
                hshidx = uri.indexOf('#');
                if (hshidx > -1) {
                    return uri.substr(0, hshidx);
                } else {
                    return uri + '.xml';
                }
            } else {
                return rem;
            }
        };
        textre = /\/text\(\)$/;
        slashs = /^[\/]+/;
        xptr = /^#?xpointer\((.+)\)$/;
        attrq = /\[([^\]]+)=([^\]"]+)\]/g;
        strrng = /^string-range\((.+),([0-9]+),([0-9]+)\)/;
        trim = function(x) {
            return x.replace(/^\s+|\s+$/g, '');
        };
        xpointerToJQuery = function(xp) {
            var end,
            m,
            start,
            wantsText;
            xp = trim(xp);
            m = xp.match(xptr);
            if (m !== null) {
                xp = m[1];
            }
            xp = trim(xp);
            m = xp.match(strrng);
            if (m !== null) {
                xp = m[1];
                start = parseInt(m[2], 10);
                end = parseInt(m[3], 10);
                wantsText = [start, end];
            } else {
                wantsText = false;
                m = xp.match(textre);
                if (m !== null) {
                    xp = x.replace(textre, '');
                    wantsText = true;
                }
            }
            xp = xp.replace(slashs, '').replace(new RegExp('//', 'g'), ' ').replace(new RegExp('/', 'g'), ' > ').replace(attrq, '[$1="$2"]').replace(/id\((.+)\)/g, '#$1');
            xp = trim(xp);
            return [xp, wantsText];
        };
        importManifestToDataStore = function(data, cb) {
            var finishImport,
            hasValue,
            i,
            info,
            k,
            kk,
            r,
            sync,
            uris,
            v,
            _i,
            _j,
            _len,
            _len2;
            console.log(data);
            uris = [];
            sync = MITHGrid.initSynchonizer({
                done: function() {
                    console.log("Done with the fetching");
                    return finishImport();
                }
            });
            for (k in data) {
                v = data[k];
                if (k === "imgAnnos" || k === "textAnnos") {
                    for (kk in v) {
                        info = v[kk];
                        for (_i = 0, _len = info.length; _i < _len; _i++) {
                            i = info[_i];
                            r = getRemForAggr(i);
                            if (! (__indexOf.call(uris, r) >= 0)) {
                                uris.push(r);
                            }
                        }
                    }
                }
            }
            console.log("Loading", uris);
            progressMeter.setSection("Fetch References");
            progressMeter.addTodo(uris.length);
            for (_j = 0, _len2 = uris.length; _j < _len2; _j++) {
                i = uris[_j];
                sync.increment();
                loadUri(i,
                function() {
                    progressMeter.addDone(1);
                    return sync.decrement();
                });
            }
            sync.done();
            hasValue = function(os, value) {
                var o,
                _k,
                _len3;
                for (_k = 0, _len3 = os.length; _k < _len3; _k++) {
                    o = os[_k];
                    if (o.value === value) {
                        return true;
                    }
                }
                return false;
            };
            return finishImport = function() {
                var b_ps,
                bits,
                body,
                canvas,
                dump,
                items,
                ps,
                s,
                src,
                src_ps,
                target,
                type;
                console.log("Starting RDF extraction");
                items = [];
                dump = rdfbase.databank.dump();
                ns = rdfbase.databank.namespaces;
                for (s in dump) {
                    ps = dump[s];
                    if (ps[ns.rdf + 'type'] !== null) {
                        type = ps[ns.rdf + 'type'][0].value;
                        if (type === ns.dms + 'Canvas') {
                            info = {
                                type: 'Canvas',
                                id: s
                            };
                            if (ps[ns.exif + 'height'] !== null) {
                                info.height = parseInt(ps[ns.exif + 'height'][0].value, 10);
                            }
                            if (ps[ns.exif + 'width'] !== null) {
                                info.width = parseInt(ps[ns.exif + 'width'][0].value, 10);
                            }
                            if (ps[ns.dc + 'title'] !== null) {
                                info.title = ps[ns.dc + 'title'][0].value;
                            }
                            options.dataStore.loadItems([info]);
                        } else if (type === ns.dms + 'TextAnnotation') {
                            info = {
                                type: 'TextAnnotation',
                                id: s
                            };
                            if (ps[ns.oac + 'hasBody'] !== null) {
                                body = ps[ns.oac + 'hasBody'][0].value;
                                b_ps = dump[body];
                                if (b_ps !== null) {
                                    if (b_ps[ns.cnt + 'chars'] !== null) {
                                        info.content = b_ps[ns.cnt + 'chars'][0].value;
                                    }
                                }
                                if ((info.content !== null) && (ps[ns.oac + 'hasTarget'] !== null)) {
                                    target = ps[ns.oac + 'hasTarget'][0].value;
                                    bits = target.split("#");
                                    if (bits.length === 2) {
                                        canvas = bits[0];
                                        info.target = canvas;
                                        if (bits[1].substr(0, 5) === "xywh=") {
                                            bits = bits[1].split("=");
                                            bits = bits[1].split(",");
                                            info.x = parseInt(bits[0], 10);
                                            info.y = parseInt(bits[1], 10);
                                            info.width = parseInt(bits[2], 10);
                                            info.height = parseInt(bits[3], 10);
                                        }
                                    } else {
                                        info.target = target;
                                    }
                                }
                            }
                            if ((info.content !== null) && (info.target !== null)) {
                                items.push(info);
                            }
                        } else if (type === ns.dms + 'ImageAnnotation') {
                            info = {
                                type: 'ImageAnnotation',
                                id: s
                            };
                            if (ps[ns.oac + 'hasBody'] !== null) {
                                src = ps[ns.oac + 'hasBody'][0].value;
                                if (dump[src] !== null) {
                                    src_ps = dump[src];
                                    console.log(src_ps);
                                    if ((src_ps[ns.rdf + 'type'] !== null) && hasValue(src_ps[ns.rdf + 'type'], ns.dms + 'ImageBody')) {
                                        if (src_ps[ns.exif + 'width'] !== null) {
                                            info.width = parseInt(src_ps[ns.exif + 'width'][0].value, 10);
                                        }
                                        if (src_ps[ns.exif + 'height'] !== null) {
                                            info.height = parseInt(src_ps[ns.exif + 'height'][0].value, 10);
                                        }
                                    }
                                    info.src = src;
                                }
                            }
                            if ((info.src !== null) && (ps[ns.oac + 'hasTarget'] !== null)) {
                                target = ps[ns.oac + 'hasTarget'][0].value;
                                bits = target.split("#");
                                if (bits.length === 2) {
                                    canvas = bits[0];
                                    info.target = canvas;
                                    if (bits[1].substr(0, 5) === "xywh=") {
                                        bits = bits[1].split("=");
                                        bits = bits[1].split(",");
                                        info.x = parseInt(bits[0], 10);
                                        info.y = parseInt(bits[1], 10);
                                        info.width = parseInt(bits[2], 10);
                                        info.height = parseInt(bits[3], 10);
                                    }
                                } else {
                                    info.target = target;
                                }
                            }
                            if ((info.src !== null) && (info.target !== null)) {
                                options.dataStore.loadItems([info]);
                            }
                        }
                    }
                }
                options.dataStore.loadItems(items);
                console.log("done loading items");
                return cb();
            };
        };
        loadDataForCanvas = function(canvasId) {};
        that.loadDataForCanvases = function(canvasIds) {};
        that.loadManifest = function(remoteUri, manifestUri, cb) {
            if (! (cb !== null)) {
                if ($.isFunction(manifestUri)) {
                    cb = manifestUri;
                    manifestUri = remoteUri;
                }
            }
            return loadUri(remoteUri,
            function() {
                return processManifest(manifestUri, cb);
            });
        };
        extractCanvasSize = function(uri) {
            var h,
            t,
            w;
            h = 0;
            w = 0;
            t = '';
            rdfbase.where("<" + uri + "> exif:height ?height").where("<" + uri + "> exif:width  ?width").optional("<" + uri + "> dc:title    ?title").each(function() {
                h = this.height.value;
                w = this.width.value;
                if (this.title !== null) {
                    return t = this.title.value;
                }
            });
            return [h, w, t];
        };
        processManifest = function(uri, cb) {
            var annoProcessor,
            audioAnnos,
            commentAnnos,
            imgAnnos,
            rangeAnnos,
            ranges,
            seqs,
            textAnnos,
            uri2,
            zoneAnnos;
            seqs = [];
            textAnnos = {
                '*': []
            };
            audioAnnos = {
                '*': []
            };
            imgAnnos = {
                '*': []
            };
            commentAnnos = {
                '*': []
            };
            zoneAnnos = {
                '*': []
            };
            rangeAnnos = {
                '*': []
            };
            annoProcessor = function(list) {
                return function() {
                    var c,
                    what;
                    c = this.canv !== null ? this.canv.value: '*';
                    what = this.seq.value;
                    if (c === '*' || (list[c] !== null)) {
                        return list[c].push(what);
                    } else {
                        return list[c] = [what];
                    }
                };
            };
            rdfbase.where("<" + uri + "> ore:describes  ?aggr").where("?aggr    ore:aggregates ?seq").where("?seq     rdf:type       dms:Sequence").each(function() {
                return seqs.push(this.seq.value);
            }).reset();
            rdfbase.where("<" + uri + "> ore:describes  ?aggr").where("?aggr    ore:aggregates ?seq").optional("?seq     dms:forCanvas  ?canv").where("?seq     rdf:type       dms:ImageAnnotationList").each(annoProcessor(imgAnnos)).end().where("?seq     rdf:type       dms:Range").each(annoProcessor(rangeAnnos)).end().where("?seq rdf:type dms:TextAnnotationList").each(annoProcessor(textAnnos)).end().where("?seq rdf:type dms:AudioAnnotationList").each(annoProcessor(audioAnnos)).end().where("?seq rdf:type dms:ZoneAnnotationList").each(annoProcessor(zoneAnnos)).end().where("?seq rdf:type dms:CommentAnnotationList").each(annoProcessor(commentAnnos)).reset();
            ranges = [];
            rdfbase.where("?seq dcterms:hasPart ?rng").where("?rng a               dms:Range").where("?rng dc:title        ?title").where("?rng rdf:first       ?f").each(function() {
                return ranges.push([this.title.value, this.f.value]);
            }).reset();
            if (seqs.length === 1) {
                uri2 = getRemForAggr(seqs[0]);
                return loadUri(uri2,
                function() {
                    return processSequence(uri2,
                    function() {
                        return importManifestToDataStore({
                            imgAnnos: imgAnnos,
                            textAnnos: textAnnos,
                            audioAnnos: audioAnnos,
                            zoneAnnos: zoneAnnos,
                            rangeAnnos: rangeAnnos,
                            commentAnnos: commentAnnos
                        },
                        cb);
                    });
                });
            } else {
                rdfbase.where("?seq a dms:Sequence").optional("?seq dc:title ?title").optional("?seq dc:description ?desc").each(function() {
                    var desc,
                    ttl;
                    ttl = this.title !== null ? this.title.value: '';
                    desc = this.desc !== null ? this.desc.value: '';
                    uri2 = getRemForAggr(this.seq.value);
                    return loadUri(uri2,
                    function() {
                        return processSequence(uri2,
                        function() {
                            return options.dataStore.updateItems([
                            {
                                id: uri2,
                                title: ttl,
                                description: desc
                            }
                            ]);
                        });
                    });
                });
                return importManifestToDataStore({
                    imgAnnos: imgAnnos,
                    textAnnos: textAnnos,
                    audioAnnos: audioAnnos,
                    zoneAnnos: zoneAnnos,
                    rangeAnnos: rangeAnnos,
                    commentAnnos: commentAnnos
                },
                cb);
            }
        };
        processSequence = function(uri, cb) {
            var i,
            l,
            sequence,
            top;
            l = [];
            top = null;
            try {
                rdfbase.where("?seq rdf:type          dms:Sequence").where("?seq ore:isDescribedBy <" + uri + ">").each(function() {
                    return top = this.seq.value;
                }).reset();
                if (! (top !== null)) {
                    rdfbase.where("?seq rdf:type dms:Sequence").each(function() {
                        return top = this.seq.value;
                    }).reset();
                }
            } catch(e) {
                alert(e);
            }
            if (top !== null) {
                l = rdfToList(top);
                sequence = l;
                options.dataStore.loadItems([
                {
                    type: "Sequence",
                    id: uri,
                    canvases: (function() {
                        var _i,
                        _len,
                        _results;
                        _results = [];
                        for (_i = 0, _len = l.length; _i < _len; _i++) {
                            i = l[_i];
                            _results.push(i.toString());
                        }
                        return _results;
                    })()
                }
                ]);
                return cb();
            } else {
                alert("Could not find the sequence :(");
                return cb();
            }
        };
        return that;
    };

})(OAC, MITHGrid, jQuery);