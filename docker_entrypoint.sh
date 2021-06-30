#!/bin/bash

if [ "${DISABLE_TOR_PROXY}" != "true" ] && [ "${DISABLE_TOR_PROXY}" != true ]; then
	/etc/init.d/tor start
fi

/usr/local/bin/yarn $@
