---
layout: docs
title: Downloading Video Annotator
---
# Downloading Video Annotator

* auto-generated TOC:
{:toc}

## About the Code

Video Annotator is written in [CoffeeScript](http://coffeescript.org/) to make it more readable.
Each part of Video Annotator is a separate source file. These files are combined into a single
CoffeeScript file before being compiled into JavaScript.

The compiled Video Annotator libraries are available in two formats:

* Minified, which provides the same functionality in a smaller file size, and
* Unminified, which is good for debugging.

Video Annotator is provided under the [Educational Community License, Version 2.0](http://opensource.org/licenses/ECL2).

## Hosted Video Annotator

You may link to the current version of Video Annotator using the following URL:

* Minified: http://umd-mith.github.com/OACVideoAnnotator/dist/videoanno.min.js
* Unminified: http://umd-mith.github.com/OACVideoAnnotator/dist/videoanno.js

## Download Video Annotator

We recommend that you download and host Video Annotator for your own use. 
This ensures that the version of Video Annotator you use only changes when you download a new version.

The minified versions are generally the best versions to use on production deployments.

## Build from Git

In order to build Video Annotator, you need to have GNU make 3.81 or later, CoffeeScript 1.1.1 or later, Node.js 0.5 or later, and git 1.7 or later.  Earlier versions might work, but they have not been tested.

Mac OS users should install Xcode, either from the Mac OS install DVD or from the Apple Mac OS App Store.  Node.js can be installed by one of the UNIX package managers available for the Mac OS.

Linux/BSD users should use their appropriate package managers to install make, git, and node.

### How to build your own Video Annotator

First, clone a copy of the Video Annotator git repo by running `git clone git://github.com/umd_mith/OACVideoAnnotator.git`.

Then, to get a complete, minified, jslinted version of Video Annotator, simple `cd` to the `OACVideoAnnotator` directory and type `make`.  If you don't have Node installed and/or want to make a basic, uncompressed, unlinted version of Video Annotator, use `make videoanno` instead of `make`.

The built version of Video Annotator will be in the `dist/` subdirectory.

To remove all built files, run `make clean`.

### How to test Video Annotator

Once you have built Video Annotator, you can browse to the `test/` subdirectory and view the `index.html` file.  This file loads the minified version of Video Annotator by default.
