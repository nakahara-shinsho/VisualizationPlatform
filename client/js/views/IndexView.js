define(['js/app',
        'view/HeaderView',
        'view/MiddleView',
        'view/FooterView',
 ],    function(app, HeaderView, MiddleView, FooterView){
  var MyClass = function(){
  };
  
  MyClass.prototype.close = function(){
     if(this.headerView) {
       this.headerView.remove();
       this.headerView=null;
     }
     
    if(this.footerView){
       this.footerView.remove();
       this.footerView=null;
     }
     
    if(this.middleView) {
       this.middleView.remove();
       this.middleView=null;
     }
     
  };
  
  MyClass.prototype.render = function(){
      var self = this;
    
      if(!this.headerView) {
        this.headerView = new HeaderView(
          {el: $('<div>',{id: 'header'}).appendTo(this.$el)});
        this.headerView.setElement("header").render();
      }
      if(!this.footerView){
          this.footerView = new FooterView(
            {el: $('<div>',{id: 'footer'}).appendTo(this.$el)});
          this.footerView.setElement("footer").render();
      }  
      if(!this.middleView) {
          this.middleView = new MiddleView();
          this.middleView.setElement('section').render();
      }
    
  };
  
  return MyClass;
});
