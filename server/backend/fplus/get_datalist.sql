(
SELECT 'appl_id' as TYPE, i.appl_id AS ID, count(*) AS 'テスト数' 
FROM fplus.scenario_information i, fplus.scenario_execution e 
WHERE  e.scenario_execution_id = i.scenario_execution_id AND e.upload_id = i.upload_id GROUP BY i.appl_id
) 
UNION 
(
SELECT 'upload_id' as TYPE, e.upload_id AS ID, count(*) AS 'テスト数' 
FROM fplus.scenario_execution e 
GROUP BY e.upload_id
);

