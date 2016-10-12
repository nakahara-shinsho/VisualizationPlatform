set PORT=8004
start /B node ./server/start
rem start /B node ./server/backend/worker_for_datalist
start /B node ./server/backend/pdb/bootPDBWorkers