<?php
function video_annotator_default_services_endpoint() {
  $endpoints = array();

  $endpoint = new stdClass;
  $endpoint->disabled = FALSE;
  $endpoint->name = "video_annotations_js";
  $endpoint->title = "Video Annotations API";
  $endpoint->server = "rest_server";
  $endpoint->path = "js-api";
  $endpoint->authentication = array();
  $endpoint->resources = array(
    'video_annotation' => array(
      'alias' => '',
      'operations' => array(
        'create'   => array('enabled' => 1),
        'retrieve' => array('enabled' => 1),
        'update'   => array('enabled' => 1),
        'delete'   => array('enabled' => 1),
        'index'    => array('enabled' => 1),
      ),
    ),
  );
  $endpoints[] = $endpoint;
  return $endpoints;
}
?>