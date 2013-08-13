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
  
  #return $data;
  #if(!$data || !defined($data->id)) { return array(); }

  $anno = array(
    '@id' => services_resource_uri(array('video_annotation', $data->id)).'.json',
    '@type' => 'oa:Annotation',
    'body' => array(
      '@type' => 'dctypes:Text',
      'format' => $data->body_type,
      'chars' => $data->text_body,
    ),
  );
  
  if($data->start_time || $data->end_time) {
    $s = floatval($data->start_time);
    $e = floatval($data->end_time);
    $fragItem = array(
      '@type' => 'oa:FragmentSelector',
      "value" => 't=npt:' . ($s|| 0) . ($e >= 0 ? ',' . $e : ''),
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
      $svgItem["exif:height"] = intval($data->height);
    }
    if($data->width) {
      $svgItem["exif:width"] = intval($data->width);
    }
  }
  
  if($svgItem && $fragItem) {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource",
      "hasSource" => $data->target,
      "hasSelector" => array(
        "@type" => "oa:Composite",
        "item" => array( $svgItem, $fragItem ),
      ),
    );
  }
  else if($svgItem) {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource",
      "hasSource" => $data->target,
      "hasSelector" => $svgItem,
    );
  }
  else if($fragItem) {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource",
      "hasSource" => $data->target,
      "hasSelector" => $fragItem,
    );
  }
  else {
    $anno['target'] = array(
      '@type' => "oa:SpecificResource",
      "hasSource" => $data->target,
    );
  }
  $anno['target']['hasScope'] = url("node/".$data->scope, array());

  $account = user_load($data->uid);
  $anno['annotatedBy'] = array(
    '@type' => array( 'foaf:Person', 'foaf:Agent' ),
    'foaf:nick' => $account->name,
    'foaf:mbox_sha1sum' => sha1($account->email),
  );

  $anno['serializedBy'] = array(
    '@type' => [ 'foaf:Agent', 'foaf:Thing' ],
    'foaf:page' => 'http://umd-mith.github.io/OACVideoAnnotator/',
    'foaf:name' => 'Drupal video_annotator plugin',
  );
  
  return $anno;
}

function _video_annotation_resource_retrieve($id) {
  $anno = array();
  try {
    $data = video_annotator_get_video_annotation($id);
    $anno['@graph'] = video_annotator_video_annotation_json($data);
  }
  catch(Exception $e) {
    $anno['error'] = $e;
  }
  $anno['@context'] = video_annotator_export_context();
  return $anno;
}

function _video_annotation_resource_delete($id) {
  video_annotator_delete_annotation($id);
  return (object)array(
    'id' => $id,
  );
}

function _video_annotation_resource_index($page, $parameters) {
  global $user;

  #echo "/* "; print_r($parameters); echo " */";
  $scope = array_key_exists("scope", $parameters) ? $parameters['scope'] : FALSE;
  if($scope) {
    if(substr($scope, 0, 5) == "node/") {
      $scope = 0+substr($scope, 5);
    }
    else {
      return array('error'=>'no scope');
    }
  }
  else {
    return array('error'=>'no scope');
  }
  $annos = array();
  try {
    $list = video_annotator_get_video_annotations_for_node($scope);
    foreach($list as $item) {
      $annos[] = video_annotator_video_annotation_json($item);
    }
  }
  catch(Exception $e) {
    return array(
      'error' => $e
    );
  }

  return array(
    '@context' => video_annotator_export_context(),
    '@graph' => $annos,
  );
}

?>
