HOMEBRIDGE=/usr/local/bin/homebridge
PWD=$(shell pwd)

default: build run

debug: build inspect

build:
	tsc

run:
	$(HOMEBRIDGE) -D -U $(PWD)/.homebridge -P $(PWD)

inspect:
	node --inspect-brk $(HOMEBRIDGE) -D -U $(PWD)/.homebridge -P $(PWD)

clean:
	rm -r $(PWD)/.homebridge/accessories
	rm -r $(PWD)/.homebridge/persist
