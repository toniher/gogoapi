# GOGOApi

[![DOI](https://zenodo.org/badge/27595679.svg)](https://zenodo.org/badge/latestdoi/27595679)

Express RESTFul interface for providing information about GO and Taxonomy for supporting functional annotation efforts.

## Installation and usage

In a local computer install node.js (you can use [Node Version Manager](https://github.com/nvm-sh/nvm)).

Adapt ```config.json``` to suit your needs and point to suitable database locations. Data can be provided from generated or existing datasets, as explained in **Datasets** section below.

Install dependendencies with: ```npm install``` and start the application with ```node index.js /path/to/config.json```

This will start a service under ```0.0.0.0:4242/api``` (if defined as such in ```basepath``` and ```port``` configuration parameters).

### Docker

A ```Dockerfile``` and an already [generated Docker image](https://hub.docker.com/r/toniher/gogoapi) is available as well. Care must be taken to adapt Docker networks so it can find pointed databases in ```config.json``` file.

Adapt your ```config.json``` file and execute as follows:

```
docker run --name mygogoapi -v /path/to/config.json:/data/config/config.json toniher/gogoapi
```

## Datasets

* Data used by the application can be filled in a MySQL database using the following scripts: https://github.com/toniher/biomirror/tree/master/mysql

* Database dumps are also provided for convenience 
  * [202010](https://biocore.crg.eu/gogoapi/biosql-202010.sql.gz) (22G)

Import MySQL dump into an existing database (e.g., **biosql**):

```
# First uncompress the file
gunzip biosql-202010.sql.gz
# Import dump into a database
mysql -umyuser -pmypasswd biosql < biosql-202010.sql
```
* **byosql**: Name of the database, which it must be created in advance (e.g., with ```CREATE DATABASE `biosql` ;```)
* **myuser** and **mypasswd** are a MySQL user and password, which must have read-write permissions to the database above

More information: [How To Import and Export Databases in MySQL or MariaDB](https://www.digitalocean.com/community/tutorials/how-to-import-and-export-databases-in-mysql-or-mariadb)

## Options

* Once the webservice is set up, check ```0.0.0.0:4242/api``` for different REST examples.
