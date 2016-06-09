//extend the chart control class for color manager

define(['ctrl/COMMON','ctrl/ChartCtrl'], function (COMMON,ChartCtrl) {
     
  ChartCtrl.prototype.manualMapping = function(mapping) {
    //selection is the columns(legend) and y-axises to be shown
    var self = this, 
        mapperProps = this.dataManager().getMapperProps(),
        colorDomainName = this.colorManager().getDomainName();
        
    Object.keys(mapperProps).forEach(function(prop) {
      
      if( !COMMON.isEqualObject(mapping[prop], mapperProps[prop].map2) ) {
        
        var mapperProp = mapperProps[prop].label.trim(),
            map2Columns = mapping[prop];
            if(colorDomainName == mapperProp) { //update current color mapping
                //TBD: check and get data for map2Columns if nonexisted in BIG data cases
                
                //update current domain in colormanager
                var toUpdateColorMapping = self.colorManager().setDomain(colorDomainName, map2Columns);
                
                //update color mapping view
                if(mapperProps[prop].type == 'number' && toUpdateColorMapping) { //number or date: trigger event to update colormap
                    framework.mediator.trigger('data_mapping:update_number_dataset', { colorDomainName: mapperProp, domain: map2Columns });
                }
            }
        
        //update chart
        self.dataManager().setMapper(prop, map2Columns);//update chart
                
      }
    });
  };
 
  return ChartCtrl;
});
