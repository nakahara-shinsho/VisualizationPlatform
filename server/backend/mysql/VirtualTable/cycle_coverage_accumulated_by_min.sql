

SELECT DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i') AS time ,
       (SELECT count(DISTINCT fault_injection_time) * 100/ 
       (SELECT (max(fault_injection_time)*1.05 -  min(fault_injection_time)*0.95)*10 FROM fplus.test_execution)
        FROM fplus.test_execution
        WHERE  date_format(execution_start_time, '%Y-%m-%d %H:%i') <= date_format(a.execution_start_time, '%Y-%m-%d %H:%i')) AS cycle_coverage
FROM fplus.test_execution a
GROUP BY DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i');
