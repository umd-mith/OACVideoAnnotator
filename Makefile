# Copied over from Jim Smith's copy of MITHGrid  
# based on the Makefile for jquery

SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
POST_COMPILER = ${JS_ENGINE} ${BUILD_DIR}/post-compile.js

BASE_FILES = ${SRC_DIR}/raphael_canvas.js \
	${SRC_DIR}/canvas.js \
	${SRC_DIR}/controllers.js

MG = ${DIST_DIR}/videoanno.js
MG_MIN = ${DIST_DIR}/videoanno.min.js

MG_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${MG_VER}/"

DATE=$(shell git log --pretty=format:%ad | head -1)

all: core

core: videoanno min lint
		@@echo "videoanno build complete"

${DIST_DIR}:
		@@mkdir -p ${DIST_DIR}

videoanno: ${MG}

#| \
#sed 's/.function....MITHGrid..{//' | \
#sed 's/}..jQuery..MITHGrid.;//' > ${MG}.tmp;

${MG}: ${DIST_DIR} ${SRC_DIR}/intro.js ${BASE_FILES} ${SRC_DIR}/outro.js
		@@echo "Building" ${MG}
		
		@@cat ${BASE_FILES} > ${MG}.tmp
		
		@@cat ${SRC_DIR}/intro.js ${MG}.tmp ${SRC_DIR}/outro.js | \
			sed 's/@DATE/'"${DATE}"'/' | \
			${VER} > ${MG};
		
		@@rm -f ${MG}.tmp;
		
lint: videoanno
		@@if test ! -z ${JS_ENGINE}; then \
				echo "Checking videoanno code against JSLint..."; \
				${JS_ENGINE} build/jslint-check.js; \
		else \
				echo "You must have NodeJS installed in order to test videoanno against JSLint."; \
		fi

min: videoanno ${MG_MIN}

${MG_MIN}: ${MG}
		@@if test ! -z ${JS_ENGINE}; then \
				echo "Minifying videoanno" ${MG_MIN}; \
				${COMPILER} ${MG} > ${MG_MIN}.tmp; \
				${POST_COMPILER} ${MG_MIN}.tmp > ${MG_MIN}; \
				rm -f ${MG_MIN}.tmp; \
		else \
				echo "You must have NodeJS installed in order to minify OAC VideoAnnotator."; \
		fi

clean:
		@@echo "Removing Distribution directory:" ${DIST_DIR}
		@@rm -rf ${DIST_DIR}

distclean: clean

.PHONY: all videoanno lint min clean distclean core
