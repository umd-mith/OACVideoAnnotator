<?php
/* TODO: See if we can use JSON-LD at this point or if we need to elsewhere */
require_once('lib/jsonld.php');

function _extract_annotation($jsonld) {
  $expanded = jsonld_expand($jsonld);
  
}
function _video_annotation_resource_create($json) {
  global $user;

  $data = video_annotator_extract_annotations_from_jsonld($json);

  $saved_annos = array();
  foreach($data as $anno) {
    $id = video_annotator_write_video_annotation($anno);
    $saved_annos[] = array(
      '@id' => $id,
      'uri' => services_resource_uri(array('video_annotion', $id)).".json",
    );
  }
  return (object)($saved_annos);
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
    'uri' => services_resource_uri(array('video_annotation', $id)).".json",
  );
}

function _video_annotation_resource_retrieve($id) {
  $anno = array();
  try {
    $data = video_annotator_get_video_annotation($id);
    $anno['@context'] = video_annotator_export_context();
    $anno['@graph'] = video_annotator_video_annotation_json($data);
  }
  catch(Exception $e) {
    $anno['error'] = $e;
  }
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