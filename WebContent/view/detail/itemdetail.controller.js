jQuery.sap.require("sap.m.MessageBox");
sap.ui.controller("itelli.zafs.view.detail.itemdetail", {

	onInit: function() {
		 this.router = sap.ui.core.UIComponent.getRouterFor(this);
	     this.router.attachRoutePatternMatched(this._handleRouteMatched, this);
	},
	
	_handleRouteMatched : function(evt) {
	    if (evt.getParameter("name") !== "itemdetail") {
	      return;
	    }  
		var that = this, oView = that.getView();
	    this._detailId = evt.getParameter("arguments").viewId;
	    this._item = evt.getParameter("arguments").itemId;
	    
	    var oModel = this.getView().getModel();
	    var imodel = this.router._oViews._oViews["itelli.zafs.view.detail.detail"].byId('lineItemList').getModel("VMIItems");
	    // VMI Item obj
	    this.materialObj = imodel.oData.results[this._item];
	
	    oView.byId("MaterialNo").setText("Material No: " + that.materialObj.Material);	    
	    
	    // Set JSON Model for Customer Details
	    if(oModel){	    	
	    	that.customer = app.ref.MasterController.getView().byId("list").getModel("Customers").getData().results[that._detailId];				
			var cModel = new sap.ui.model.json.JSONModel(that.customer);
			oView.setModel(cModel, "CustomerDetails");	
	    }
	    
    	//Set Days Inventory left
	    function updateDaysLeft(){
		    var curInpVal = oView.byId("currInv").getValue();
			var daiInpVal = oView.byId("dailyUsg").getValue();
			var daysLeft = parseFloat(curInpVal) / parseFloat(daiInpVal);
			var val = daysLeft.toString().split(".")[0];
			var fraction = (daysLeft.toString().split(".")[1]) ? "."+ daysLeft.toString().split(".")[1].substring(0, 2) : "";
			var decimalDaysLeft =  parseFloat(val + fraction); 
		    that.getView().byId("DaysInvLeft").setValue((daysLeft == "Infinity" || isNaN(daysLeft)) ? 0 : decimalDaysLeft);
	    }
	    
	    // Setting Model for Item Details
	    if(imodel){
	    	var sPath = that._item;
	    	oView.byId("CusDetails").setModel(imodel);
	    	oView.byId("CusDetails").bindElement("/results/"+sPath);
    		oView.byId("itemDetailsForm").setModel(imodel);
    		oView.byId("itemDetailsForm").bindElement("/results/"+sPath);
    		var isItemUpdated = imodel.getProperty("/results/"+sPath);
    		if(isItemUpdated.CurrInv === "" && isItemUpdated.DailyUsage ==="" ) {
		    	that.getVMIItem(that.materialObj.Material, function(res){
		    		that.originalVMIItem = res;
		    		that.updateFields(res);
		    		that.updateLBSFields();
		    		updateDaysLeft();
		    	});
    		} else {
    			// Make LBS Weight values Empty
    			that.updateLBSFields();
    			updateDaysLeft();
    		}
    		
    		// Disable Enable 
    		if(that.customer && that.customer.DelFlag === "D" || isItemUpdated.LastSoStatus){
	    		that.disEnableFields(false);
	    	} else {
	    		that.disEnableFields(true);
	    	}
		}
	    
	  },
	  
	  updateFields : function(data){
		  	var that = this, oView = that.getView();		    
		    if(that.materialObj){
		    	oView.byId("currInv").setValue(data.CurrInv);
		    	oView.byId("dailyUsg").setValue(data.DailyUsage);
		    	oView.byId("ordQty").setValue(data.OrderQty);
		    	oView.byId("DaysInvLeft").setValue(data.DaysInvLeft);
		    	// Set Description of uom
		    	oView.byId("curInvUOMLab").setText(this.materialObj.Uom);
		    	oView.byId("dailyUsgUOMLab").setText(this.materialObj.Uom);
		    	oView.byId("ordQtyUOMLab").setText(this.materialObj.Uom);
		    }
	  },
	  
	  updateLBSFields : function(){
		  var that = this, oView = that.getView();
		  var curInvLbs = that.toLBSWeight(this.materialObj.CurrInv, this.materialObj.UnitLbs);    	
		  var dailyUsgLbs = that.toLBSWeight(this.materialObj.DailyUsage, this.materialObj.UnitLbs);
		  var ordQtyLBS = that.toLBSWeight(this.materialObj.OrderQty, this.materialObj.UnitLbs);
		  oView.byId("curInvLBS").setValue(curInvLbs.toFixed(3));
		  oView.byId("dailyUsgLBS").setValue(dailyUsgLbs.toFixed(3));	    	
		  oView.byId("ordQtyLBS").setValue(ordQtyLBS.toFixed(3));
		  oView.byId("curInvUOMLab").setText(this.materialObj.Uom);
		  oView.byId("dailyUsgUOMLab").setText(this.materialObj.Uom);
		  oView.byId("ordQtyUOMLab").setText(this.materialObj.Uom);
	  },  
	  
	  // Get VMI Item
	  getVMIItem : function(material, cb){
		  var oDialog = new sap.m.BusyDialog({});
		  oDialog.open();
		  var url = "VMIItemSet(Soldto='"+this.materialObj.Shipto+"',Shipto='"+this.materialObj.Shipto+"',Material='"+material+"')";
			this.getView().getModel().read(url, null, null, true,
	            function(response) {		    	
		            if(cb){
		            	cb(response);
		            }
		            oDialog.close();
	            },function(oError) {
	            	oDialog.close();
	            	var msg = (oError.message.value) ? oError.message.value : "VMI Items service failed to load";
	    			sap.m.MessageBox.alert(msg);
	            });
	  },
	  
	  handleUpdate:function(oEvent) {
		  if(!this.materialObj.LastSoStatus) app.ref.itemdetails = true;		  
		  sap.ui.core.UIComponent.getRouterFor(this).myNavBack("detail", {
		      viewId :  this._detailId,
		  });		  
	  },
	  
	  handleCancle:function(oEvent) {
		  var that = this;
		  function redirect(){
			  app.ref.itemdetails = false;
			  sap.ui.core.UIComponent.getRouterFor(that).myNavBack("detail", {
				      viewId :  that._detailId			     
			 });
		  }
		  if(!this.originalVMIItem) {
		    	that.getVMIItem(that.materialObj.Material, function(res){
		    		that.updateFields(res);	
		    		redirect();
		    	});
  		  } else {
  			this.updateFields(this.originalVMIItem);
  			redirect();
  		  }
	  },
	  
	  currentInvLiveChange : function(evt) {
		  this.liveChange(evt, "curInvLBS");			
	  },
		
	  dailyUsageLiveChange : function(evt) {
			this.liveChange(evt, "dailyUsgLBS");
	  },
		
		ordQtyLiveChange : function(evt) {
			this.liveChange(evt, "ordQtyLBS");
		},
		
		liveChange : function (evt, ele){
			var tfValue = sap.ui.getCore().byId(evt.getSource().getId()).getValue(), that = this;
			if( isNaN(tfValue) ){
				tfValue = tfValue.substr(0,tfValue.length-1);
				evt.getSource().setValue(tfValue);
			}else{
				if(app.ref.itemdetails == false)
						app.ref.itemdetails = true;	
				
				var qty = evt.getParameter("value");
				var qtyLBS = qty * parseInt(this.materialObj.UnitLbs);
				this.getView().byId(ele).setValue(qtyLBS.toFixed(3));
				if(evt.getSource().getValue()){
					  this.daysLeftKeyPress(evt);
				} else {
					that.getView().byId("DaysInvLeft").setTitle(0);
				}
			}
		},
		
		toLBSWeight : function(value, lbs){
			return (value) ? parseInt(lbs) * parseInt(value) : 0;
		},
		
		/*
		  * Formula : Current Inventery / Daily Usage = Days Left;
		  */
		 daysLeftKeyPress : function(e){
			var that = this, oVIew = that.getView();
			var curInpVal = oVIew.byId("currInv").getValue();
			var daiInpVal = oVIew.byId("dailyUsg").getValue();
			 
			this.curInv = (curInpVal) ? curInpVal : 0;
			this.dailyUsage =  (daiInpVal) ? daiInpVal : 0;
			
			function calculate(){
				 var daysLeft = parseFloat(that.curInv) / parseFloat(that.dailyUsage);
				 var val = daysLeft.toString().split(".")[0];
				 var fraction = (daysLeft.toString().split(".")[1]) ? "."+ daysLeft.toString().split(".")[1].substring(0, 2) : "";
				 var decimalDaysLeft =  parseFloat(val + fraction); 
				 if(!that.curInv){
					 that.getView().byId("DaysInvLeft").setValue(0);
				 }else{
					 that.getView().byId("DaysInvLeft").setValue((daysLeft == "Infinity") ? 0 : decimalDaysLeft);
				 }
			 };
			 
			 if(e.getSource().getId().search("currInv") > -1) {
				 this.curInv = e.getSource().getValue();
				 calculate();
			 }
			  
			 if(e.getSource().getId().search("dailyUsg") > -1) {
				 this.dailyUsage = e.getSource().getValue();
				 if(this.curInv > 0) calculate();			
			 }		 
		 },
		 
		 disEnableFields : function(bool){
			 var that = this, oView = that.getView();
			 oView.byId("herdSize").setEditable(bool);
			 oView.byId("currInv").setEditable(bool);
			 oView.byId("dailyUsg").setEditable(bool);
			 oView.byId("ordQty").setEditable(bool);
			 oView.byId("notes").setEditable(bool);			 
		 }
		 

});