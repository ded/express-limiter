.PHONY: test

test:
	./node_modules/.bin/mocha --ui bdd --reporter spec tests
