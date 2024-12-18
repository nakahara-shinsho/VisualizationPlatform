


DROP TABLE IF EXISTS fplus.event_tmp;
CREATE TABLE fplus.event_tmp (execution_start_time datetime, upload_id CHAR(32), value CHAR(128));

INSERT INTO fplus.event_tmp
(SELECT execution_start_time, upload_id, value FROM fplus.event WHERE type = 'type_error' OR type = 'type_alarm');


SELECT DATE_FORMAT(execution_start_time, '%Y-%m-%d %H:%i') AS time ,
       (SELECT count(DISTINCT value)*100 / (SELECT count(*)  FROM fplus.record_info_type_info WHERE type = 'type_error'  OR type = 'type_alarm') 
       FROM fplus.event_tmp
       WHERE  date_format(execution_start_time, '%Y-%m-%d %H:%i') <= date_format(a.execution_start_time, '%Y-%m-%d %H:%i')) AS cause_coverage
FROM fplus.event_tmp a
GROUP BY DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i');

DROP TABLE IF EXISTS fplus.event_tmp;
