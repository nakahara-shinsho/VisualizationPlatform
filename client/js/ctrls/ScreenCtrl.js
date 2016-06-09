define([
  'js/app',
  'text!templates/screen_ctrl_dlg.html',
  'bootstrap-dialog',
  'util/getFile',
],  function(app, saveDlgTpl, BootstrapDialog, getFile) {
   /**
    * Constructor create ScreenCtrl Class
    * @method ScreenCtrl
    * @memberOf module.ScreenCtrl
    */
   var MyClass = function(username) {
      this.user = username;
   };
 
  //create new screen dialog
   MyClass.prototype.getNewID = function (url) {
     var self = this;
     var deferred = $.Deferred();
     this.bookmarkDialog = BootstrapDialog.show({
       title: 'Crteate a new SCREEN',
       message: _.template(saveDlgTpl)( { id: '', isNewScreen: true}),
       draggable: true,
       buttons: [
         {
           label: 'OK ',
           action: function(dialog) {
             var idElement =  dialog.getModalBody().find('input'),
                 idInputed = idElement.val(),//should check the input is not empty
                 description = dialog.getModalBody().find("textarea[name='description']").val(),
                 maxColumns = dialog.getModalBody().find("select[name='maxColumns'] option:selected").val(),
                 margin = dialog.getModalBody().find("select[name='margin'] option:selected").val();
             var ajaxOptions = {
               url: url,
               type: 'POST',
               dataType: "json",
               data: { user: self.user,
                       id: idInputed,
                       description: description,
                       maxColumns: +maxColumns,
                       margin: +margin
                }
             };
             $.ajax(ajaxOptions)
                .done( function (data, textStatus, jqXHR) {
                      dialog.close();
                      deferred.resolve(data.id);
                  })
                 .fail(function(jqXHR, textStatus, errorThrown) {
                    dialog.getModalBody().find('#errorMessage').text(jqXHR.responseText);
                       setTimeout(function() {
                         dialog.getModalBody().find('#errorMessage').text("");
                       }, 3000);
                     idElement.focus();
                     idElement.select();
                  });
           } //action end
         }, //OK button end
         {
           label: 'CANCEL',
           action: function(dialog) {
             dialog.close();
             deferred.reject(null);
           }
         }
       ]
     });
     return deferred.promise();
   };
   
   MyClass.prototype.getLastestID = function (url) {
      var deferred = $.Deferred();
      var ajaxOptions = {
         url: url,
         type: 'GET',
         dataType: "json",
         timeout: 10000, //ms
         data: {user: this.user },
       };
       
       $.ajax(ajaxOptions)
       .done(function(data, textStatus, jqXHR) {
           deferred.resolve(data);
         })
       .fail(function(jqXHR, textStatus, errorThrown) {
          deferred.reject(errorThrown);
       });
      return deferred.promise();
   };
  
   MyClass.prototype.SaveImg2LocalStorage = function (elem, name) {
      getFile.convertSVGToCanvas(elem);
      html2canvas(elem, {
            onrendered  : function (canvas) {
              var img = canvas.toDataURL("image/jpeg");
              getFile.download(img, name + ".jpg", "image/jpeg");
              // Remove canvas and display SVG chart after capture current chart
              getFile.revertSVGFromCanvas(elem);
            } //onrendered end
          });
   };
   
   MyClass.prototype.captureElement = function(elem, width, height)
   {
     var self = this;
     var deferred = $.Deferred();
     
     getFile.convertSVGToCanvas(elem);
     html2canvas(elem, {
       onrendered: function(canvas) {
         var img = new Image();
         img.onload = function() {
           canvas.width = width;
           canvas.height = height;
           var ctx = canvas.getContext('2d');
           ctx.drawImage(img, 0, 0, width, height);
           getFile.revertSVGFromCanvas(elem);
           var newimg = canvas.toDataURL('image/jpeg');
           deferred.resolve(newimg);
         };
         img.src = canvas.toDataURL();
       } //onrendered end
     });//html2canvas end
     return deferred.promise();
   };
  
  //http://techslides.com/save-svg-as-an-image
  MyClass.prototype.captureSimple = function($svg, $canvas)
   {
     var deferred = $.Deferred();
     var svg = $svg.get(0);
     var canvas = $canvas.get(0);
     
     if( $svg.find("style").length <= 0 ) {
       $("<style type='text/css'></style>")
        .prependTo($svg)
        .html(getFile.styles(svg));
     }
    
     canvg(canvas, svg.outerHTML, {
       renderCallback : function(){
          var data = canvas.toDataURL('image/jpeg');
          deferred.resolve(data);
       }
     });
     return deferred.promise();
   };
  
  //save tool dialog
  MyClass.prototype.inputDlg = function (initialID) {
     var self = this;
     var deferred = $.Deferred();
    
     this.bookmarkDialog = BootstrapDialog.show({
       title: 'Save the current TOOL',
       message: _.template(saveDlgTpl)({id: initialID, isNewScreen: false }),
       draggable: true,
       buttons: [
         {
           label: 'OK ',
           action: function(dialog) {
             var inputElement = dialog.getModalBody().find('input');
             var inputedid = inputElement.val(),
                 description = dialog.getModalBody().find('textarea').val();
                 
             if( !inputedid ) {
               inputElement.focus();
               inputElement.select();
             } else {
                deferred.resolve({
                  id: inputedid,//
                  description: description,//
                });
                dialog.close();
             }
           }
         }, //OK button end
         {
           label: 'CANCEL',
           //cssClass: 'btn-primary',
           action: function(dialog) {
             deferred.reject();
             dialog.close();
           }
         }
       ]
     });
     
     return deferred.promise();
   };
  
  //clone screen dialog
  MyClass.prototype.cloneMe = function (id, url) {
     //open dialog for inputing screeId and description
     //set screeId as current data and description is null
     var self = this;
     var user = app.session.user.get('userId');
     var deferred = $.Deferred();
    
     this.bookmarkDialog = BootstrapDialog.show({
       title: 'Clone the current SCREEN',
       message: _.template(saveDlgTpl)({id: id+'_clone', isNewScreen: false}),
       draggable: true,
       onshow: function(dialog) {
         //dialog.getModalContent().css({'background-color': self.dialogBackgroundColor});
       },
       buttons: [
         {
           label: 'OK ',
           action: function(dialog) {
             var inputElement = dialog.getModalBody().find('input');
             var inputedid = inputElement.val(),
                 description = dialog.getModalBody().find('textarea').val(),
                 imagename = user +'.'+ inputedid;
             var data = { user: user,
                          id: id,
                          cloneid: inputedid,
                          description: description,
                          imgurl: imagename
                        };
             $.ajax({ url: url, type: 'POST',  data: data })
                 .done(function(data, textStatus, jqXHR) { //success to save object to server
                       deferred.resolve(imagename);
                      dialog.close();
                     })
                 .fail(function(jqXHR, textStatus, errorThrown) {
                       //if fail, show warning message
                       dialog.getModalBody().find('#errorMessage').text(jqXHR.responseText);
                       setTimeout(function() {
                         dialog.getModalBody().find('#errorMessage').text("");
                       }, 3000);
                       inputElement.focus();
                       inputElement.select();
                 });
           }
         }, //OK button end
         {
           label: 'CANCEL',
           //cssClass: 'btn-primary',
           action: function(dialog) {
             deferred.reject();
             dialog.close();
           }
         }
       ]
     });
     
     //this.bookmarkDialog.getModalBody().find("select[name='maxColumns']").hide();
     //this.bookmarkDialog.getModalBody().find("select[name='margin']").hide();
      
     return deferred.promise();
   };
  
   //ToDo: a client should get model to check if it have existed before writing a new model
   MyClass.prototype.saveImg = function(url, data) {
       var ajaxOptions = {
         url: url,
         type: 'POST',
         dataType: 'jsonP', //for cross domain POST to work
         data: { image: data, ext: '.jpg' }
       };
       //var deferred = $.Deferred();
       $.ajax(ajaxOptions).done(function(data, textStatus, jqXHR) {
         //deferred.resolve(data);
       }).fail(function(jqXHR, textStatus, errorThrown) {
         //deferred.reject(jqXHR.responseText);
       });
       //return deferred.promise();
   };

   
   return MyClass;
});