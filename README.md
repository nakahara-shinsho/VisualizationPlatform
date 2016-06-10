# Polyspector / Visualization Platform

## setup
### require  library
```
 erlang
 rabbitmq-server
 nodejs
 npm
 sqlite3-devel
```

### install 3rd party lib from npm
```
 cd VisualizationPlatform/
 npm install
 npm install sqlite3
```

## Boot (default)
```
 node server/start.js PORT=8888 start 
 node server/backend/worker_for_datalist.js start 
 // sample
 node server/backend/workers_default.js start
```
## Boot (using forever)
```
 forever server/start.js  PORT=8888 start 
 forever server/backend/worker_for_datalist.js start 
 // sample
 forever server/backend/workers_default.js start 
```
## Access
  Please access http://IP_ADDRESS:PORT Using Google Chrome.
