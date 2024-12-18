

SELECT DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i') AS time ,
       (SELECT count(DISTINCT file_path) *100 / (SELECT count(DISTINCT file_path) FROM fplus.pc2line)
       FROM fplus.coverage
       WHERE  date_format(execution_start_time, '%Y-%m-%d %H:%i') <= date_format(a.execution_start_time, '%Y-%m-%d %H:%i')) AS code_coverage
FROM fplus.coverage a
GROUP BY DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i');
