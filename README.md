OAC Video Annotation Tool
=========================

for use in the Alexander Street Press online streaming video window. 

Authors:

* Grant Dickie
* Jim Smith

See license.txt for licensing details

Setting up the OAC Annotation Tool
----------------------------------

What you will need for your site
----------------------
----------------------

The following code libraries are required and are listed in the order
in which to include them:

* jQuery
* Infusion
* RaphaelJS
* MITHGrid 

What you will need for building OAC Video Annotator
-------------------------
-------------------------

A Makefile has been included with this distribution to allow for running system-level commands to minimize the code and provide a distribution directory `dist/` with two files, `videoanno.js` which is the full, human-readable version of the Javascript code, and `videoanno.min.js`, which is a compressed version of the core code library intended for quick-loading in the browser. The minified version is, of course, much less readable than the full version.

In order to perform this build process, you need to have GNU make 3.81 or later, Node.js 0.5 or later, and git 1.7 or later.  Earlier versions might work, but they have not been tested.

Mac OS users should install Xcode, either from the Mac OS install DVD or from the Apple Mac OS App Store.  Node.js can be installed by one of the UNIX package managers available for the Mac OS.

Linux/BSD users should use their appropriate package managers to install make, git, and node.

How to build your own OAC Video Annotator
-------------------------
-------------------------

First, use the *git* command *git clone* to copy the remote repository to your directory, like so: `git clone git://github.com/umd_mith/OACVideoAnnotator.git`.

Then, to get a complete, minified, jslinted version of the OACVideoAnnotator, `cd` to the directory containing the files for OACVideoAnnotator and type `make`.  If you don't have Node installed and/or want to make a basic, uncompressed, unlinted version of OACVideoAnnotator, use `make videoanno` instead of `make`.

The built version of MITHGrid will be in the `dist/` subdirectory.

To remove all built files, run `make clean`.

Testing the OAC Video Annotator
-------------------------------


