<?php
/* TODO: See if we can use JSON-LD at this point or if we need to elsewhere */
require_once('lib/jsonld.php');

function _extract_annotation($jsonld) {
  $expanded = jsonld_expand($jsonld);
  
}
function _video_annotation_resource_create($data) {
  global $user;
  
  unset($data->id);
  $data->uid = $user->uid;
  $data->created = time();
  $data->modified = time();
  
  video_annotator_write_video_annotation($data);
  return (object)array(
    '@id' => $data->id,
    'uri' => services_resource_uri(array('video_annotation', $data->id)),
  );
}

function _video_annotation_resource_update($id, $data) {
  global $user;
  $anno = video_annotator_get_annotation($id);
  unset($data->created);
  $data->id = $id;
  $data->uid = $anno->uid;
  $data->modified = time();
  
  video_annotator_write_annotation($data);
  return (object)array(
    '@id' => $id,
    'uri' => services_resource_uri(array('video_annotation', $id)),
  );
}

function _anno_to_jsonld($data) {
  $svgItem = false;
  $fragItem = false;
  
  $anno = array(
    '@id' => $data->id,
    '@type' => 'oa:Annotation',
    'body' => array(
      '@type' => 'dctypes:Text'
      'format' => 'text/plain'
      'chars' => $data->text_body,
    ),
  );
  
  if($data->start_time || $data->end_time) {
    $fragItem = array(
      '@type' => 'oa:FragmentSelector',
      "value" => 't=npt:' + $data->start_time + ',' + $data->end_time,
      "conformsTo" => "http://www.w3.org/TR/media-frags/"
    );
  }
  if($data->svg_selector) {
    $svgItem = array(
      '@type' => 'oa:SvgSelector',
      "format" => "image/svg+xml",
      "chars" => $data->svg_selector,
    );
    
    if($data->height) {
      $svgItem["exif:height"] = $data->height;
    }
    if($data->width) {
      $svgItem["exif:width"] = $data->width;
    }
  }
  
  if($svgItem && $fragItem) {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource"
      "hasSource" => $data->target,
      "hasSelector" => array(
        "@type" => "oa:Composite"
        "item" => array( $svgItem, $fragItem ),
      ),
    );
  }
  else if($svgItem) {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource"
      "hasSource" => $data->target,
      "hasSelector" => $svgItem,
    );
  }
  else if($fragItem) {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource"
      "hasSource" => $data->target,
      "hasSelector" => $fragItem,
    );
  }
  else {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource"
      "hasSource" => $data->target,
    );
  }
  $anno['target']['hasScope'] = $data->scope;
  
  return $anno;
}

function _video_annotation_retrieve($id) {
  $data = video_annotator_get_annotation($id);
  $anno = _anno_to_jsonld($data);
  $anno['@context'] = array("http://www.w3.org/ns/oa-context-20130208.json", array(
      'exif' => "http://www.w3.org/2003/12/exif/ns#", 
    ));
  return $anno;
}

function _video_annotation_delete($id) {
  video_annotator_delete_annotation($id);
  return (object)array(
    'id' => $id,
  );
}

function _video_annotation_index($page, $parameters) {
  global $user;
  
  $annos = array();
  $res = db_query("SELECT * FROM {video_annotation} WHERE scope=:scope ORDER BY modified DESC", array(
    ':scope' => 
  ));
  
  while($data = db_fetch_object($res)) {
    $annos[] = _anno_to_jsonld($data);
  }
  
  return array(
    '@context' => array("http://www.w3.org/ns/oa-context-20130208.json", array(
      'exif' => "http://www.w3.org/2003/12/exif/ns#", 
    )),
    '@graph' => $annos,
  );
}

?>