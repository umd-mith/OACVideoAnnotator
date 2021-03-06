<?php

/*
 * This file defines the various functions needed by the REST service.
 * These functions should not be called directly by anything else. Instead,
 * use the functions defined in `video_annotator.module`.
 */

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
      '@id' => services_resource_uri(array('video_annotation', $id)).".json",
    );
  }
  return (object)(array(
    '@graph' => $saved_annos
  ));
}

function _video_annotation_resource_update($id, $json) {
  $data = video_annotator_extract_annotations_from_jsonld($json);

  $uri = services_resource_uri(array('video_annotation', $id)).".json";
  $res = FALSE;
  if(array_key_exists($uri, $data)) {
    if(array_key_exists("uid", $data[$uri])) {
      unset($data[$uri]["uid"]);
    }
    $res = video_annotator_update_video_annotation($id, $data[$uri]);
  }

  return (object)array(
    'success' => $res,
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
  video_annotator_delete_video_annotation($id);
  return (object)array(
    'id' => $id,
  );
}

function _video_annotation_resource_index($page, $parameters) {
  global $user;

  $scope = 
      array_key_exists("scope", $parameters) ? $parameters['scope'] : FALSE;
  if($scope && strpos($scope, "node/") === 0) {
    list($scope) = sscanf($scope, "node/%d");
  }
  else {
    return array('error' => 'no scope');
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