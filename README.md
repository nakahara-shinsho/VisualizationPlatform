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
### library Installation

  [node]
  requre g++ version 4.8 or above
  upgrade g++4.8 for compilation of node.js
```
$sudo wget http://people.centos.org/tru/devtools-2/devtools-2.repo -O /etc/yum.repos.d/devtools-2.repo
$sudo yum install devtoolset-2-gcc devtoolset-2-binutils
$sudo yum install devtoolset-2-gcc-c++ devtoolset-2-gcc-gfortran
$scl enable devtoolset-2 bash
```
  install node.js with npm
```
$sudo yum groupinstall 'Development Tools'
$yum install openssl-devel
$mkdir tmp
$cd tmp
$curl -O http://nodejs.org./dist/node-latest.tar.gz
$tar zxvf node-latest.tar.gz
$cd node-v*
$./configure
$make
$make install
$node -v  
```
  configure npm
```
$npm config set proxy http://proxy.toshiba.co.jp:8080
$npm config set registry  http://registry.npmjs.org/
```
  [forever]
  install forever
```
$cd FrontendServer/
$npm install
$sudo npm install -g forever
```
  [rabbitmq]
  install rabbitmq
```
$wget http://packages.erlang-solutions.com/erlang-solutions-1.0-1.noarch.rpm
$sudo rpm -Uvh erlang-solutions-1.0-1.noarch.rpm
$sudo yum install erlang
$wget http://www.rabbitmq.com/rabbitmq-server-3.x.x.noarch.rpm.asc
$sudo yum install rabbitmq-server-3.x.x.noarch.rpm
$sudo /etc/init.d rabbitmq-server start ; chkconfig rabbitmq-server start
  <For Centos 7.x>
$diabled selinux
$sudo systemctl start rabbitmq-server ; systemctl enable rabbitmq-server
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
## Boot minimum platform 
```
 node server/start.js  PORT=8888
 //default data list
 node server/backend/worker_for_datalist.js
 //default workers for sample data (csv, tsv)
 node  server/backend/workers_default.js
```
## Boot application-based platform
``` 
 PORT=8888 node start start/start.js
 //application datalist
 NODE_PATH=./node_modules VISPLA_PATH=$(pwd) node $application_folder/boot_datalist.js 
 //application workers
 NODE_PATH=./node_modules VISPLA_PATH=$(pwd) node $application_folder/boot_virtualtable.js 

 //for PM2
 pm2 start server/start.js
 NODE_PATH=$(pwd)/node_modules pm2 start ~/fplus-all/workers/boot_datalist.js
 NODE_PATH=$(pwd)/node_modules pm2 start ~/fplus-all/workers/boot_virtualtable.js

```
## Access
  Please access http://IP_ADDRESS:PORT Using Google Chrome.

