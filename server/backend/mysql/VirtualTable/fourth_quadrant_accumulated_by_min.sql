

DROP TABLE IF EXISTS fplus.tmp;
CREATE TABLE fplus.tmp (timestamp datetime, dn integer, ndn integer, df integer, ndf integer );
INSERT INTO fplus.tmp
(SELECT DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i:%s') AS timestamp,
	 SUM(CASE WHEN fourth_quadrant = 'DETECTED_NORMAL' THEN 1 ELSE 0 END) AS dn,	
	 SUM(CASE WHEN fourth_quadrant = 'NO_DETECTED_NORMAL'  THEN 1 ELSE 0 END) AS ndn,
	 SUM(CASE WHEN fourth_quadrant = 'DETECTED_FAILURE'    THEN 1 ELSE 0 END) AS df,
	 SUM(CASE WHEN fourth_quadrant = 'NO_DETECTED_FAILURE' THEN 1 ELSE 0 END) AS ndf
FROM fplus.fourth_quadrant
GROUP BY DATE_FORMAT(EXECUTION_START_TIME, '%Y-%m-%d %H:%i:%s'));

SELECT 
       DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i') AS time,
       (SELECT sum(dn) from fplus.tmp where date_format(timestamp, '%Y-%m-%d %H:%i') <= date_format(a.timestamp, '%Y-%m-%d %H:%i'))  as dn,
       (SELECT sum(ndn) from fplus.tmp where date_format(timestamp, '%Y-%m-%d %H:%i') <= date_format(a.timestamp, '%Y-%m-%d %H:%i'))  as ndn,
       (SELECT sum(df) from fplus.tmp where date_format(timestamp, '%Y-%m-%d %H:%i') <= date_format(a.timestamp, '%Y-%m-%d %H:%i'))  as df,
       (SELECT sum(ndf) from fplus.tmp where date_format(timestamp, '%Y-%m-%d %H:%i') <= date_format(a.timestamp, '%Y-%m-%d %H:%i'))  as ndf
FROM fplus.tmp a
GROUP BY  time;
DROP TABLE IF EXISTS fplus.tmp;

