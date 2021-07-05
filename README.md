# GOGOApi

[![DOI](https://zenodo.org/badge/27595679.svg)](https://zenodo.org/badge/latestdoi/27595679)

Express RESTFul interface for providing information about GO and Taxonomy for supporting functional annotation efforts.

## Installation and usage

In a local computer install node.js (you can use [Node Version Manager](https://github.com/nvm-sh/nvm)).

Adapt ```config.json``` to suit your needs and point to suitable database locations.

Install dependendencies with: ```npm install``` and start the application with ```node index.js /path/to/config.json```

This will start a service under ```0.0.0.0:4242/api``` (if defined as such in ```basepath``` and ```port``` configuration parameters).

A ```Dockerfile``` and a [generated Docker image]() is available as well. Care must be taken to adapt Docker networks so it can find pointed databases in ```config.json``` file.

## Datasets

* Database dumps for convenience
  * [202010](https://biocore.crg.eu/gogoapi/biosql-202010.sql.gz) (22G)

## Options

* Check ```0.0.0.0:4242/api``` for examples
