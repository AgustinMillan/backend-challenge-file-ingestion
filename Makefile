.PHONY: all

all: install build docker-build docker-up

install:
	npm install

build:
	npm run build

docker-build:
	docker-compose build

docker-up:
	docker-compose up

data:
	cd data-generator && npm install && npm run build && npm run start