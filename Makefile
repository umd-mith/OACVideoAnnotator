SRC_DIR = src
TEST_DIR = tests
BUILD_DIR = build
COMPILED_DOCS_DIR = ${PREFIX}/compiled_docs

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
POST_COMPILER = ${JS_ENGINE} ${BUILD_DIR}/post-compile.js
DOCCO ?= `which docco-husky`
GRUNT ?= `which grunt`
COFFEE ?= `which coffee`

BASE_FILES = ${SRC_DIR}/controller.coffee \
	${SRC_DIR}/driver-framework.coffee \
	${SRC_DIR}/drivers/dummy.coffee \
	${SRC_DIR}/drivers/html5.coffee \
	${SRC_DIR}/component.coffee \
	${SRC_DIR}/presentation.coffee \
	${SRC_DIR}/application.coffee

MODULES = ${SRC_DIR}/intro.coffee \
	${BASE_FILES} \
	${SRC_DIR}/outro.coffee

OAC = ${DIST_DIR}/videoanno.js
OAC_MIN = ${DIST_DIR}/videoanno.min.js
OAC_C = ${DIST_DIR}/videoanno.coffee

OAC_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${MG_VER}/"

DATE=$(shell git log --pretty=format:%ad | head -1)

all: core docs

core: videoanno min test
	@@echo "videoanno build complete"

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

${COMPILED_DOCS_DIR}/src:
	@@mkdir -p ${COMPILED_DOCS_DIR}/src

docs: ${MODULES} ${COMPILED_DOCS_DIR}/src README.md
	@@${DOCCO} ${SRC_DIR}

test: videoanno
	@@if test ! -z ${GRUNT}; then \
		echo "Testing videoanno"; \
		${COFFEE} -c ${TEST_DIR}; \
		${GRUNT} qunit; \
	else \
		echo "You must have grunt installed in order to test videoanno."; \
	fi

videoanno: ${OAC}

${OAC_C}: ${MODULES} ${DIST_DIR}
	@@echo "Building" ${OAC_C}
	@@rm -f ${OAC_C}.tmp
	@@for i in ${BASE_FILES}; do \
		cat $$i | sed 's/^/	/' >> ${OAC_C}.tmp; \
		echo >> ${OAC_C}.tmp; \
		done	
	@@cat ${SRC_DIR}/intro.coffee ${OAC_C}.tmp ${SRC_DIR}/outro.coffee | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${OAC_C};
	@@rm -f ${OAC_C}.tmp;

${OAC}:	${OAC_C}
	@@${COFFEE} -c ${OAC_C}

lint: videoanno
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Checking videoanno code against JSLint..."; \
		${JS_ENGINE} build/jslint-check.js; \
	else \
		echo "You must have NodeJS installed in order to test videoanno against JSLint."; \
	fi

min: videoanno ${OAC_MIN}

${OAC_MIN}: ${OAC}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying videoanno" ${OAC_MIN}; \
		${COMPILER} ${OAC} > ${OAC_MIN}.tmp; \
		${POST_COMPILER} ${OAC_MIN}.tmp > ${OAC_MIN}; \
		rm -f ${OAC_MIN}.tmp; \
	else \
		echo "You must have NodeJS installed in order to minify videoanno."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}
	@@echo "Removing compiled test scripts:" ${TEST_DIR}/*.js
	@@rm -f ${TEST_DIR}/*.js
	@@echo "Removing compiled documentation: " ${COMPILED_DOCS_DIR}
	@@rm -rf ${COMPILED_DOCS_DIR}

distclean: clean

.PHONY: all videoanno lint min clean distclean core
