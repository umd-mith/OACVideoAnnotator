<?php
require_once 'video_annotator.module';
require_once 'lib/jsonld.php';

/*
 * We define these so that the module can use them without having to load drupal.
 * We only care about the hooks defined in this module anyway.
 */
function module_invoke_all($hook) {
  $args = func_get_args();
  unset($args[0]);
  $return = array();
  $function = "video_annotator_$hook";
  if(function_exists($function)) {
    $result = call_user_func_array($function, $args);
    if(isset($result) && is_array($result)) {
      $return = array_merge_recursive($return, $result);
    }
    elseif(isset($result)) {
      $return[] = $result;
    }
  }

  return $return;
}

function drupal_alter($hook, &$data, &$context1 = NULL, &$context2 = NULL, &$context3 = NULL) {
  $function = "video_annotator_" . $hook . "_alter";
  if(function_exists($function)) {
    $function($data, $context1, $context2, $context3);
  }
}

class VideoAnnotatorTest extends PHPUnit_Framework_TestCase
{
  public function testJSONImport()
  {
    $json_text = <<<EOC
{
 "@context": {
    "oa" :     "http://www.w3.org/ns/oa#",
    "cnt" :    "http://www.w3.org/2011/content#",
    "dc" :     "http://purl.org/dc/elements/1.1/",
    "dcterms": "http://purl.org/dc/terms/",
    "dctypes": "http://purl.org/dc/dcmitype/",
    "foaf" :   "http://xmlns.com/foaf/0.1/",
    "rdf" :    "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs" :   "http://www.w3.org/2000/01/rdf-schema#",
    "skos" :   "http://www.w3.org/2004/02/skos/core#",
    "exif":    "http://www.w3.org/2003/12/exif/ns#",

    "hasBody" :         {"@type":"@id", "@id" : "oa:hasBody"},
    "hasTarget" :       {"@type":"@id", "@id" : "oa:hasTarget"},
    "hasSource" :       {"@type":"@id", "@id" : "oa:hasSource"},
    "hasSelector" :     {"@type":"@id", "@id" : "oa:hasSelector"},
    "hasState" :        {"@type":"@id", "@id" : "oa:hasState"},
    "hasScope" :        {"@type":"@id", "@id" : "oa:hasScope"},
    "annotatedBy" :  {"@type":"@id", "@id" : "oa:annotatedBy"},
    "serializedBy" : {"@type":"@id", "@id" : "oa:serializedBy"},
    "motivatedBy" :  {"@type":"@id", "@id" : "oa:motivatedBy"},
    "equivalentTo" : {"@type":"@id", "@id" : "oa:equivalentTo"},
    "styledBy" :     {"@type":"@id", "@id" : "oa:styledBy"},
    "cachedSource" : {"@type":"@id", "@id" : "oa:cachedSource"},
    "conformsTo" :   {"@type":"@id", "@id" : "dcterms:conformsTo"},
    "default" :      {"@type":"@id", "@id" : "oa:default"},
    "item" :         {"@type":"@id", "@id" : "oa:item"},
    "first":         {"@type":"@id", "@id" : "rdf:first"},
    "rest":          {"@type":"@id", "@id" : "rdf:rest", "@container" : "@list"},

    "chars" :        "cnt:chars",
    "bytes" :        "cnt:bytes",
    "format" :       "dc:format",
    "annotatedAt" :  "oa:annotatedAt",
    "serializedAt" : "oa:serializedAt",
    "when" :         "oa:when",
    "value" :        "rdf:value",
    "start" :        "oa:start",
    "end" :          "oa:end",
    "exact" :        "oa:exact",
    "prefix" :       "oa:prefix",
    "suffix" :       "oa:suffix",
    "label" :        "rdfs:label",
    "name" :         "foaf:name",
    "mbox" :         "foaf:mbox",
    "styleClass" :        "oa:styleClass"
  },
  "@graph": [{
    "@id": "http://www.example.org/anno1",
    "@type": "oa:Annotation",
    "hasBody": {
      "@type": [ "cnt:ContentAsText", "dctypes:Text" ],
      "chars": "This is the body text",
      "format": "text/plain"
    },
    "hasTarget": {
      "@type": "oa:SpecificResource",
      "hasSource": {
        "@id": "http://www.example.org/movies/foo.mp4",
        "@type": "dctypes:MovingImage"
      },
      "hasSelector": {
        "@type": "oa:CompoundSelector",
        "oa:item": [{
          "@type": "oa:FragmentSelector",
          "conformsTo": "http://www.w3.org/TR/media-frags/",
          "value": "xywh=10,10,5,5",
          "exif:width": 640,
          "exif:height": 480
        }, {
          "@type": "oa:FragmentSelector",
          "conformsTo": "http:/www.w3.org/TR/media-frags/",
          "value": "t=npt:0.5,4.3"
        }]
      }
    }
  }]
}
EOC;
    $json = json_decode($json_text);
    #$data = _video_annotator_flatten_json($json);
    #print_r($data);
    #print_r(array_keys($data));
    $annos = video_annotator_extract_annotations_from_jsonld($json);
    #print_r($annos);
    $this->assertCount(1, $annos, "We have one annotation");
    $this->assertArrayHasKey("http://www.example.org/anno1", $annos);
    $anno = $annos["http://www.example.org/anno1"];
    $this->assertArrayHasKey("text_body", $anno, "Has a text body");
    $this->assertArrayHasKey("body_type", $anno, "Has a body type");
    $this->assertArrayHasKey("start_time", $anno, "Has a start time");
    $this->assertArrayHasKey("end_time", $anno, "Has an end time");
    $this->assertArrayHasKey("svg_selector", $anno, "Has an svg selector");
    $this->assertArrayHasKey("target", $anno, "Has a target video");
    $this->assertArrayHasKey("height", $anno, "Has a height");
    $this->assertArrayHasKey("width", $anno, "Has a width");

    $this->assertEquals("This is the body text", $anno["text_body"], "Right text body");
    $this->assertEquals("text/plain", $anno["body_type"], "Right text type");
    $this->assertEquals("<rect x='10' y='10' width='5' height='5'>", $anno["svg_selector"], "Right shape in frame");
    $this->assertEquals(0.5, $anno["start_time"], "Right start time");
    $this->assertEquals(4.3, $anno["end_time"], "Right end time");
    $this->assertEquals(480, $anno["height"], "Right height");
    $this->assertEquals(640, $anno["width"], "Right width");
    $this->assertEquals("http://www.example.org/movies/foo.mp4", $anno["target"], "Right video target");

    $json = video_annotator_video_annotation_json($anno);

    $this->assertArrayHasKey("body", $json, "body property present");
    $this->assertArrayHasKey("target", $json, "target property present");
    $this->assertArrayHasKey("type", $json["body"], "body has a type");
    $this->assertArrayHasKey("type", $json["target"], "target has a type");
    $this->assertArrayHasKey("selector", $json["target"], "target has a selector property");
    $this->assertArrayHasKey("item", $json["target"]["selector"], "target selector has an item property");
    $this->assertCount(2, $json["target"]["selector"], "There are two constraints on target");
  }
}
?>