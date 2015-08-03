sap.ui.controller("itelli.zafs.view.detail.proposeorder", {

	onInit: function() {
		 this.router = sap.ui.core.UIComponent.getRouterFor(this);
	     this.router.attachRoutePatternMatched(this._handleRouteMatched, this);
	},
	
	_handleRouteMatched : function(evt) {
	    if (evt.getParameter("name") !== "proposeorder") {
	      return;
	    }	    
	    this._detailId = evt.getParameter("arguments").viewId;
	    
	    var oModel = this.getView().getModel(), that = this;
	    that.imodel=this.router._oViews._oViews["itelli.zafs.view.detail.detail"].byId('lineItemList').getModel("VMIItems");
	    if(oModel){
	    	this.customer = this.getView().getModel("Customers").getData().results[this._detailId];				
			var cModel = new sap.ui.model.json.JSONModel(this.customer);
			this.getView().setModel(cModel, "CustomerDetails");
	    }
	    
	    if(that.imodel){
	    	var newItems = {};
	    	var list = this.getView().byId("itemList2");	    	
		    list.setModel(that.imodel, "POVMIItems");  
		    var oModel = this.getView().byId("itemList2").getModel("POVMIItems").getData();
		    this.getView().byId("submitOrder").setEnabled(false);
		    if(oModel.results.length > 0){		    	
		    	newItems.results = [];
	    		for(var i = 0; i < oModel.results.length ; i++){
	    			var status = oModel.results[i].LastSoStatus;
	    			if( !status || status === ""){
	    				newItems.results.push(oModel.results[i]);
	    			}	    				
	    		}	    		
	    	}
		    if(oModel.results.length === 0) app.ref.MasterController.getView().getController().isItemDeleted = true;
		    
		    if(newItems.results.length > 0) this.getView().byId("submitOrder").setEnabled(true);
		    
	    	var jsonModel = new sap.ui.model.json.JSONModel(newItems);
	    	this.getView().byId("itemList2").setModel(jsonModel, "POVMIItems");
		}
	  },
	  
	  handleCancle : function(){
		  app.ref.itemdetails = true;
		  sap.ui.core.UIComponent.getRouterFor(this).myNavBack("detail", {
		      viewId :  this._detailId,
		  });
	  },
	  
	  handlePopoverPress: function (oEvent) {
		  	var that = this;
		  	var note = oEvent.getSource().data("notes");
		  	var textArea =  new sap.m.TextArea({ value: note});
		  	var sId = oEvent.getParameters().id.split("--")[1].split("-")[1];
			var oMessagePopover1 = new sap.m.Popover({
			  title: "Item Notes",			 
			  content: [ textArea ],
			  footer:new sap.m.Bar({
	                contentRight: [new sap.m.Button({
	                    text: 'CANCEL', 
	                    press: function(){	                    	 
	                    	oMessagePopover1.close();
	                    }
	                }), new sap.m.Button({
	                    text: 'OK', 
	                    press: function(){
	                    	//that.data("notes", textArea.getValue()); 
	                    	that.getView().byId('itemList2').getModel("POVMIItems").setProperty("/results/" + sId + "/Notes", textArea.getValue());
	                    	oMessagePopover1.close();
	                    }
	                })]
	            }),
			  placement: sap.m.PlacementType.Right
			});
			
		  oMessagePopover1.openBy(oEvent.getSource());
	  }, 
      	
      PlaceOrderHandler : function(e){
 		  var that = this, view = that.getView();
    	  var vmiItems = this.getView().byId('itemList2').getModel("POVMIItems").getData();
    	  var updatedItems = [], batchItems = [];
    	  var shipto = "", soldto="";
    	  if(vmiItems.results.length > 0){
    		 
    		  for(var i=0; i < vmiItems.results.length; i++){
    			  if(vmiItems.results[i].OrderQty > 0){
    				  var item = {};
        			  item.Material = vmiItems.results[i].Material;
        			  item.Uom = vmiItems.results[i].Uom;
        			  item.Notes = vmiItems.results[i].Notes;
        			  item.Quantity = vmiItems.results[i].OrderQty;
        			  // Requested Delivery Date
        			  var reqDeliveryDate = itelli.zafs.util.Formatter.requestDeliveryDate(vmiItems.results[i].CurrInv, vmiItems.results[i].DailyUsage);
        			  var ii = 1 + i;
        			  var soItem = 10*ii;
        			  // Date.UTC(2012,02,30)
        			  var year = reqDeliveryDate.getFullYear();
        			  var month = reqDeliveryDate.getMonth();
        			  var day = reqDeliveryDate.getDate();
        			  var datefor = Date.UTC(year, month, day);
        			  var utcDate = "/Date("+ datefor +")/";
        			  item.ReqDate = utcDate;
        			  item.SoItem = soItem.toString();
        			  item.SoNumber = "";
        			  shipto = vmiItems.results[i].Shipto;
        			  soldto = vmiItems.results[i].Soldto;
        			  updatedItems.push(item);
    			  }    			  
    		  }
    		  
    	  }
    	  
    	  function groupSameReqDate( array , f )
    	  {
    	    var groups = {};
    	    array.forEach( function( o )
    	    {
    	      var group = JSON.stringify( f(o) );
    	      groups[group] = groups[group] || [];
    	      groups[group].push( o );  
    	    });
    	    return Object.keys(groups).map( function( group )
    	    {
    	      return groups[group]; 
    	    });
    	  }
    	  
    	  var splitOrders = groupSameReqDate(updatedItems, function(item)
		  {
		    return [item.ReqDate];
		  });    	  
    	 
    	  var allOrders = [];
    	  var sameReqDtOrders = [];
    	  
    	  if( splitOrders.length > 0 ) {
    		  for( var i=0; i < splitOrders.length; i++ ) {
    			  var isSameReqBatch = false;
    			  if(splitOrders[i].length > 1){
    				  for(var ii = 0; ii < splitOrders[i].length; ii++) {
    					  if(splitOrders[i][ii].Uom === "LB" || splitOrders[i][ii].Uom === "TON") {
    						  allOrders.push([splitOrders[i][ii]]);
    						  splitOrders[i].splice(ii,1);    						  
    					  }
    					  isSameReqBatch = true;
        			  }
    				  if(isSameReqBatch){
    					  sameReqDtOrders.push(splitOrders[i]);
    				  }
    			  } else {
    				  allOrders.push(splitOrders[i]);
    			  }    			
    		  }
    	  }
    	  
    	  if( sameReqDtOrders.length > 0 )  allOrders.push(sameReqDtOrders[0]);

    	  var notesTxt = view.byId("orderNotes").getValue();    	  
    	  if( allOrders.length > 0 ) {
    		  for ( var i = 0; i < allOrders.length; i++ ){
    			  var oEntry = {
    		  	  		    "d": {
    		  	  		        "DistChan": "10",
    		  	  		        "Division": "10",
    		  	  		        "Notes": notesTxt,
    		  	  		        "OrderType": "OR",
    		  	  		        "PoNumber": "",
    		  	  		        "ReqDate": allOrders[i][0].ReqDate,
    		  	  		        "SalesOrg": "1000",
    		  	  		        "Shipto": shipto,
    		  	  		        "SoNumber": "ABC",
    		  	  		        "Soldto": soldto,
    		  	  		        "VMIOrderItems": allOrders[i]
    		  	  		    }
    		  	  		};
    			  var uri = "/VMIOrderHeaderSet";
    			  batchItems.push( this.getView().getModel().createBatchOperation( uri, "POST", oEntry) );
    		  }
    	  }
    	  
    	  //console.log("Batch Items ::", batchItems);
    	  
    	  if(batchItems.length > 0){
			  view.getModel().addBatchChangeOperations(batchItems);
			  view.getModel().setUseBatch(true);
			  
			  var oDialog = new sap.m.BusyDialog({});	
			  oDialog.open();
			  //submit changes and refresh the table and display message 
			  
			  var onSuccess = function(response){
		          oDialog.close();
		          view.getModel().setUseBatch(false);		          
		          var changeResponse = response.__batchResponses[0].__changeResponses;
		          var orders = [];
		          for(var i = 0; i < changeResponse.length; i++){
		        	  var SoNumber = changeResponse[i].data.SoNumber;
		        	  orders.push(SoNumber);
		          }
		          
		          sap.m.MessageBox.alert("Sales Order(s) "+ orders.toString() +" created successfully",  { 
		            title: "Success",  
		            icon : sap.m.MessageBox.Icon.SUCCESS,
		            onClose : function(evt) {
		              app.ref.MasterController.getView().getController().isOrderSubmited = true;
		              sap.ui.core.UIComponent.getRouterFor(that).myNavBack("detail", {
		                  viewId :  that._detailId,
		              });
		            }
		          });
		          
		          // Update VMI Locations
		          app.ref.MasterController.getView().getController().updateCustomersData(function(res){					
					var cModel = new sap.ui.model.json.JSONModel(res.results[that._detailId]);
					that.getView().setModel(cModel, "CustomerDetails");
					app.ref.MasterController.getView().getController().selectMasterItem(that._detailId);
		          });
		          
		      };
		        
		      var onError = function(error){
		          oDialog.close();
		          sap.m.MessageBox.alert("Error occured while submitting order");    
		      };
			  
			  view.getModel().submitBatch(onSuccess, onError);	  
		  } 

      },
      
      handleDelete : function(oEvent){
			 var oList = oEvent.getSource(),
		      oItem = oEvent.getParameter("listItem"),
		      sPath = oItem.getBindingContext("POVMIItems").getPath();
			 var oModel = oList.getModel("POVMIItems");
			 var ind = sPath.split("/")[2];
			 oModel.getData().results.splice(ind,1);
			 if(oModel.getData().results.length === 0)  this.getView().byId("submitOrder").setEnabled(false);
			 var jsonModel = new sap.ui.model.json.JSONModel(oModel.getData());
			 this.getView().byId("itemList2").setModel(jsonModel, "POVMIItems");
			 app.ref.MasterController.getView().getController().isItemDeleted = true;
		 }
});