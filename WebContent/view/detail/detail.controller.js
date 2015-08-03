jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.ActionSheet");
sap.ui.controller("itelli.zafs.view.detail.detail", {

	onInit: function() {
		 jQuery.sap.declare("app.ref.detailController");
		 app.ref.detailController = this;
		 this.router = sap.ui.core.UIComponent.getRouterFor(this);
	     this.router.attachRoutePatternMatched(this._handleRouteMatched, this);
	},
	
	_handleRouteMatched : function(evt) {
	    if (evt.getParameter("name") !== "detail") {
	      return;
	    }
	    var that = this;
	    var oView = that.getView();
	    var masterController = app.ref.MasterController.getView().getController();
	    var isOrderSubmitted = masterController.isOrderSubmited;
    	var isItemDeleted = masterController.isItemDeleted;
    	var isAddItem = app.ref.MasterController.getView().getController().itemsAdded;
	    if(!app.ref.itemdetails || isOrderSubmitted || isItemDeleted || isAddItem.OrderQty){	    	
	    	
	    	that._detailId = evt.getParameter("arguments").viewId;
	    	var oModel = that.getView().getModel("Customers");	
	    	
	    	// Set Delay
	    	function setDelay() {
	    		var vmiItems = masterController.getItems;
	    		that.ItemsCount = vmiItems.results.length;
	    		oModel = that.getView().getModel("Customers");
			    var sPath = that._detailId;	    
			    var oContext = new sap.ui.model.Context(oView.getModel("Customers"),"/"+sPath);
			    oView.setBindingContext(oContext);
			    
			    that.customer = app.ref.MasterController.getView().getModel("Customers").oData.results[sPath];
			    that.BuildCustomerDetails(that.customer);
				var cModel = new sap.ui.model.json.JSONModel(that.customer);
				oView.setModel(cModel, "CustomerDetails");				
				
				var jsonModel = new sap.ui.model.json.JSONModel(vmiItems);
				oView.byId("lineItemList").setModel(jsonModel, "VMIItems");	
				
				//oView.byId("actionSheetBtn").setVisible(false);
		    	oView.byId("updateBtn").setVisible(false);
		    	oView.byId("proposeOrder").setVisible(false);
		    	
		    	// disable buttons
		    	if( vmiItems && vmiItems.results.length > 0 ){	    		
		    		//oView.byId("actionSheetBtn").setVisible(true);
			    	oView.byId("updateBtn").setVisible(true);
			    	oView.byId("proposeOrder").setVisible(true);
		    	}
		    	
		    	// Grouping
		    	var oBinding = oView.byId("lineItemList").getBinding("items");
	    		var vGroup = {  key: "OrderQty", text: "" };
	    		var oSort = new sap.ui.model.Sorter("OrderQty", true, vGroup);
	    		oBinding.sort([oSort]); 
	    		
	    		//if Customer in inactive status disabling the buttons and setting editable false
		    	if(that.customer && that.customer.DelFlag === "D"){
		    		that.enableDisableInputs(false);
		    	} else {
		    		that.enableDisableInputs(true);
		    	}
	    	}

	    	// if Item added	    	
	    	if(isAddItem.OrderQty){
	    		masterController.getItems.results.push(isAddItem);
	    		masterController.itemsAdded = {};
	    		setDelay();	    		
	    		return;
	    	}
	    	
	    	// If Order Submitted get Items	    	
	    	if(isOrderSubmitted || isItemDeleted){
	    		masterController.getVMIitems(function(response){
	    			masterController.getItems = response;
	    			setDelay();
	    			masterController.isOrderSubmited = false;
	    			masterController.isItemDeleted = false;
	    		});
	    	}
	    	
	    	// Check Model Existence 
	    	if(!isOrderSubmitted && !isItemDeleted){
	    		if(!oModel){
		    		 setTimeout(function(){ 	 		    	
		    			 setDelay();
		    			 clearTimeout(this);
		 		    }, 4000);	    		
		    	} else {
		    		setDelay();
		    	}	    		
	    	}
	    	
	    }
	  },
	  
	 /**
	   * @desc navigate to Add Item screen
	   * @nav_params this._detailId - vendor id
	 */
	  addItems:function(oEvent) {	    
		    this.router.navTo("additem", {
		      viewId :  this._detailId    
		    });		  
	  },
	  /**
	   * @desc navigate to propose order and updates VMI Items
	   * @todos Errors Messages should be maintain in il8n
	 */
	  handleProposeOrder:function(oEvent) {
		  function isFunction(functionToCheck) {
			  var getType = {};
			  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
		  }
		  var that = this, view = that.getView(), batchChanges = [], btnTxt;		  
		  btnTxt = (!isFunction(oEvent)) ? oEvent.getSource().getText() : "Update";		 
		  var Soldto = this.customer.Soldto, Shipto = this.customer.Shipto;		  
		  var itemsList = this.getView().byId("lineItemList").getModel("VMIItems").oData.results;		  
		  // Check Validation
		  function validate(){
			  var isValid = true;
			  for(var i=0; i < itemsList.length; i++){
				  var item = itemsList[i];
				  if(item.CurrInv === "" || item.DailyUsage === "" || item.OrderQty === ""){
					  isValid = false;
					  break;
				  } 
			  }			  
			  return isValid;			  
		  }
		  if(validate()){			  
			  if(itemsList.length > 0) {
				  for(var i=0; i < itemsList.length; i++){
					  if(itemsList[i].DaysInvLeft == "") itemsList[i].DaysInvLeft = "0";
					  if(itemsList[i].LastSoStatus === "" && parseFloat(itemsList[i].OrderQty) !== 0 && parseFloat(itemsList[i].DailyUsage) !== 0 && parseFloat(itemsList[i].CurrInv) !== 0){
						  var uri = encodeURI("/VMIItemSet(Soldto='"+Soldto+"',Shipto='"+Shipto+"',Material='"+itemsList[i].Material+"')");
						  batchChanges.push( this.getView().getModel().createBatchOperation(uri, "PUT", itemsList[i]) );
					  }					  
				  }
				  if(batchChanges.length > 0){
					  view.getModel().addBatchChangeOperations(batchChanges);
					  view.getModel().setUseBatch(true);
					  
					  var oDialog = new sap.m.BusyDialog({});	
					  oDialog.open();
					  //submit changes and refresh the table and display message 
					  view.getModel().submitBatch(function(data) {		
						  view.getModel().setUseBatch(false);
			  
						  oDialog.close();
						  var msg = "Successfully Updated";
						  if(isFunction(oEvent)){
							  if(oEvent) oEvent();
							  sap.m.MessageBox.alert(msg);
							  return;
						  }
						  //propose order
						  if(btnTxt != "Update"){
						      that.router.navTo("proposeorder", {
							      viewId :  that._detailId,
							      data: {}
							  });
						  } else {
							  // Update Items
							  that.updateCustomerDetails("update");
							  sap.m.MessageBox.alert(msg);						  
						  }						  
					      
					    }, function(err) {
					    	oDialog.close();
					    	var msg = (err.messages) ? err.messages.value : "Error Occured While Update";
					    	sap.m.MessageBox.alert(msg);
					    });	  
				  } else {
					  if(itemsList.length && btnTxt != "Update"){
						  that.router.navTo("proposeorder", {
						      viewId :  that._detailId,
						      data: {}
						  });
					  } else {
						  sap.m.MessageBox.alert("There are no items to update");
					  }
				  }
			  }
		  } else {
			  sap.m.MessageBox.alert("Update not possible. Please ensure the current inventory and daily usage is entered for all items.");
		  }
	  },
	  /**
	   * @desc navigate to Item Detail page
	   * @todos 
	 */
	  handleItemDetail:function(oEvent) {	
		  var sPath = oEvent.oSource.getBindingContext("VMIItems").getPath();
          var sId = sPath.substr(sPath.lastIndexOf("/") + 1);
		  this.router.navTo("itemdetail", {
		      viewId :  this._detailId,
		      itemId : 	sId
		  });	
	  },
	  /**
	   * @desc this function will not allow to user enter alphabets
	   * @todos this function should be global
	 */
	  handleKeypress: function(e){
		  var tfValue = sap.ui.getCore().byId(e.getSource().getId()).getValue();
		  if( isNaN(tfValue) ){
			  tfValue = tfValue.substr(0,tfValue.length-1);
			  e.getSource().setValue(tfValue);			 
		  }  
		  
		  if(e.getSource().getValue()){
			  if(app.ref.itemdetails) app.ref.itemdetails = false;
			  this.daysLeftKeyPress(e);
		  } else {
			  var row = e.getSource().getId().split("-")[6], 		 	
			 	 daysLeftEleId = "__xmlview1--daysInvLft-__xmlview1--lineItemList-"+row;
			  sap.ui.getCore().byId(daysLeftEleId).setTitle(0);
		  }

	 },
	 /**
	   * @desc opens action sheet to disable the customer
	   * 
	 */
	 openActionSheet : function(e){		
		 
		var that = this;	
		that.customer = app.ref.MasterController.getView().getModel("Customers").oData.results[that._detailId];
		var oEntry = {	
				        "ImShipto": that.customer.Shipto,
				        "ImSoldto": that.customer.Shipto,
				        "ExResult": ""			    
					};
		
		 var disable = new sap.m.Button({
				icon: "sap-icon://hide" ,
				text: "Deactivate",
				press: function(e){
					this.setVisible(false);
					enable.setVisible(true);
					oEntry.ImDelFlag = "D";
					that.ImDelFlag = "D";
					that.updateCustomerFlag(oEntry);
				}
		 });
		 
		 var enable = new sap.m.Button({
				icon: "sap-icon://show" ,
				text: "Activate",
				press: function(e){
					this.setVisible(false);
					disable.setVisible(true);
					oEntry.ImDelFlag = " ";
					that.ImDelFlag = " ";
					that.updateCustomerFlag(oEntry);
				}
		 });

		 // Set Buttons
		 if(that.ImDelFlag){
			 if(that.ImDelFlag == "D"){
				 enable.setVisible(true);
				 disable.setVisible(false);
			 } else {
				 enable.setVisible(false);
				 disable.setVisible(true);
			 }
		 }else{
			 this.toggleButtons(enable, disable);
		 }		 
		 
		 var oActionSheet = new sap.m.ActionSheet({
				showCancelButton: true,
				buttons: [ enable, disable ],
				cancelButtonText: "Cancel",
				title: "Please choose one action",
				placement: sap.m.PlacementType.Top,
				cancelButtonPress: function(){
					jQuery.sap.log.info("sap.m.ActionSheet: cancelButton is pressed");
				}
		 });
		 
		 oActionSheet.openBy(this.getView().byId("actionSheetBtn")); 
	 },
	 
	 toggleButtons : function(enable, disable){
		// By Default buttons visible false
		 enable.setVisible(false);
		 disable.setVisible(false);
		 
		 // Visible buttons with flags
		 if(this.customer.DelFlag == "D"){
			 enable.setVisible(true);
			 disable.setVisible(false);
		 } else {
			 enable.setVisible(false);
			 disable.setVisible(true);
		 }
	 },
	 
	 updateCustomerFlag : function(oEntry){
		 var that = this;
		 var oDialog = new sap.m.BusyDialog({});	
		 oDialog.open();		 
		 var url = "/VMICustdSet(ImShipto='" + that.customer.Shipto + "',ImSoldto='" + that.customer.Soldto + "',ImDelFlag='" + oEntry.ImDelFlag + "')";
		 that.getView().getModel().update(url, oEntry, null, function(res) {
			 	var msg = "", isActivate = true;
				oDialog.close();
				if(oEntry.ImDelFlag === " "){
					msg = that.customer.Name1 + " customer activated";
					isActivate = true;
				} else {
					msg = that.customer.Name1 + " customer deactivated";
					isActivate = false;
				} 
		
				sap.m.MessageBox.alert(msg);
				that.ImDelFlag = undefined;
				// Update Customer Details
				that.updateCustomerDetails();
				that.enableDisableInputs(isActivate);
	     },function(oError) {
	            oDialog.close();
	            var msg = (oError.message) ? error.message : "Error while deactivating customer";
	    		sap.m.MessageBox.alert(msg);
	    });
	 },
	 /*
	  * Formula : Current Inventery / Daily Usage = Days Left;
	  */
	 daysLeftKeyPress : function(e){
		 var row = e.getSource().getId().split("-")[6], that = this, 		 	
		 	 daysLeftEleId = "__xmlview1--daysInvLft-__xmlview1--lineItemList-"+row;
		 
		 var curInpVal = sap.ui.getCore().byId("__xmlview1--currinventory-__xmlview1--lineItemList-"+row).getValue();
		 var daiInpVal = sap.ui.getCore().byId("__xmlview1--dailyusage-__xmlview1--lineItemList-"+row).getValue();
		 
		 this.curInv = (curInpVal) ? curInpVal : 0;
		 this.dailyUsage =  (daiInpVal) ? daiInpVal : 0;
		
		function calculate(){
			 var daysLeft = parseFloat(that.curInv) / parseFloat(that.dailyUsage);
			 if(!that.curInv){
				 sap.ui.getCore().byId(daysLeftEleId).setTitle(0);
			 }else{
				 var val = daysLeft.toString().split(".")[0];
				 var fraction = (daysLeft.toString().split(".")[1]) ? "."+ daysLeft.toString().split(".")[1].substring(0, 2) : "";
				 var decimalDaysLeft =  parseFloat(val + fraction); 
				 sap.ui.getCore().byId(daysLeftEleId).setTitle((daysLeft == "Infinity" || isNaN(daysLeft)) ? 0 : decimalDaysLeft);
			 }
		 };
		 
		 if(e.getSource().getId().search("currinventory") > -1) {
			 this.curInv = e.getSource().getValue();
			 if(this.curInv > 0) calculate();
		 }
		  
		 if(e.getSource().getId().search("dailyusage") > -1) {
			 this.dailyUsage = e.getSource().getValue();
			 if(this.curInv > 0) calculate();			
		 }		 
	 },
	 
	 updateCustomerDetails : function (type){
		 var that = this;
		 app.ref.MasterController.getView().getController().updateCustomersData(function(res){					
				var cModel = new sap.ui.model.json.JSONModel(res.results[that._detailId]);
				that.getView().setModel(cModel, "CustomerDetails");
				if(type === "update")
					app.ref.MasterController.getView().getController().selectMasterItem(that._detailId);
			});
	 },
	 
	 enableDisableInputs : function(bool){
		 var that = this, oView = that.getView();
		 oView.byId("proposeOrder").setEnabled(bool);
		 oView.byId("updateBtn").setEnabled(bool);
		 oView.byId("addItemBtn").setEnabled(bool);
		 // Enable All User inputs in the List
		 //__attribute8-__xmlview1--lineItemList-0
		 if(that.ItemsCount > 0){
			 for(var i=0; i < that.ItemsCount; i++){
				 var editable = true;
				 var isItemPending = sap.ui.getCore().byId("__attribute8-__xmlview1--lineItemList-"+i).getText();
				 if(isItemPending) { editable = false; }
				 sap.ui.getCore().byId("__xmlview1--currinventory-__xmlview1--lineItemList-"+i).setEditable((editable==false)? editable : bool);
				 sap.ui.getCore().byId("__xmlview1--dailyusage-__xmlview1--lineItemList-"+i).setEditable((editable==false)? editable : bool);
				 sap.ui.getCore().byId("__xmlview1--orderqty-__xmlview1--lineItemList-"+i).setEditable((editable==false)? editable : bool);
			  }		
		 }
	 },
	 
	 BuildCustomerDetails: function(customer){
		 var container = sap.ui.getCore().byId("__xmlview1--SupplierForm");
		 container.removeAllContent();
		 var addressLabel = new sap.m.Label({ text: "Address" });
		 var street = (customer.Street) ? customer.Street + ", " : "";
		 var city = (customer.City) ? customer.City + ", " : "";		 
		 var address = street + city + customer.Region;
		 var addressVal  =new sap.m.Text({ text: address  });
		 var phoneLabel = new sap.m.Label({ text: "Phone" });
		 var phoneVal = new sap.m.Text({ text: customer.PhoneNumber  });
		 var emailLabel = new sap.m.Label({ text: "Email" });
		 var emailVal = new sap.m.Text({ text: customer.Email  });
		 var faxLabel = new sap.m.Label({ text: "Fax" });
		 var faxVal = new sap.m.Text({ text: customer.FaxNumber  });
		 container.setTitle("Address");
		 if(address){
			 container.addContent(addressLabel);
			 container.addContent(addressVal);
		 }
		 
		 if(customer.PhoneNumber){
			 container.addContent(phoneLabel);
			 container.addContent(phoneVal);
		 }
		 
		 if(customer.Email){
			 container.addContent(emailLabel);
			 container.addContent(emailVal);
		 }
		 
		 if(customer.FaxNumber){
			 container.addContent(faxLabel);
			 container.addContent(faxVal);
		 }
	 }
});