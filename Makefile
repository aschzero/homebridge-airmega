HOMEBRIDGE=/usr/local/bin/homebridge
PWD=$(shell pwd)

default: build run

debug: build node_debug

build:
	tsc --noUnusedLocals --noUnusedParameters

run:
	$(HOMEBRIDGE) -D -U $(PWD)/.homebridge -P $(PWD)

node_debug:
	node --inspect-brk $(HOMEBRIDGE) -D -U $(PWD)/.homebridge

clean:
	rm -r $(PWD)/.homebridge/accessories
	rm -r $(PWD)/.homebridge/persist
