###
# OAC Video Annotation Tool v@VERSION
# 
# The **OAC Video Annotation Tool** is a MITHgrid application providing annotation capabilities for streaming
# video embedded in a web page. 
#  
# Date: @DATE
#  
# Educational Community License, Version 2.0
# 
# Copyright 2011 University of Maryland. Licensed under the Educational
# Community License, Version 2.0 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of the License at
# 
# http:#www.osedu.org/licenses/ECL-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# Author: Grant Dickie
###

# The plugin uses the OAC.Client.StreamingVideo namespace.
OAC = MITHgrid.globalNamespace("OAC")
OAC.namespace("Client")
OAC.Client.namespace("StreamingVideo")

(($, MITHgrid, OAC) ->
