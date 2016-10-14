set PORT=8000
start /B node ./server/start
start /B node ./server/backend/worker_for_datalist

rem start /B node ./server/backend/workers_default
start /B node ./server/backend/workers_for_bigdata.js
start /B node ./server/backend/pdb/bootPDBWorkers.js