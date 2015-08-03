jQuery.sap.require("sap.m.MessageBox");
sap.ui.controller("itelli.zafs.view.detail.additem", 
{
	onInit : function() {
		this.router = sap.ui.core.UIComponent
				.getRouterFor(this);
		this.router.attachRoutePatternMatched(
				this._handleRouteMatched, this);
	},
	
	_handleRouteMatched : function(evt) {
		if (evt.getParameter("name") !== "additem") {
			return;
		}
		this._detailId = evt.getParameter("arguments").viewId;		
	},
	
	openHelpDialog : function(oEvent) {	
		var that = this, oView = that.getView();
		that._oDialog = sap.ui.xmlfragment("itelli.zafs.view.detail.material", that);
		oView.addDependent(that._oDialog);	
		
		 // clear the old search filter
	    that._oDialog.getBinding("items").filter([]);
	
		// toggle compact style
		jQuery.sap.syncStyleClass("sapUiSizeCompact", that.getView(), that._oDialog);
		that._oDialog.open();
	},
		
	_handleValueHelpSearch : function (evt) {
	    var sValue = evt.getParameter("value");
	    var oFilter = new sap.ui.model.Filter("MaterialNo", sap.ui.model.FilterOperator.Contains, sValue);
	    var oFilter1 = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);
	    evt.getSource().getBinding("items").filter([oFilter, oFilter1]);
	  },
	
	_handlewbsValueHelpConfirm : function(evt) {
		var oView = this.getView();
		var oSelectedItem = evt.getParameter("selectedItem");
		if (oSelectedItem) {
			var title = (oSelectedItem.mProperties.text) ? oSelectedItem.getProperty("text") : oSelectedItem.getTitle();
			// Check the Material is already existed
			var existingItems = this.router._oViews._oViews["itelli.zafs.view.detail.detail"].byId('lineItemList').getModel("VMIItems").getData().results;			
			if(existingItems.length > 0){
				var isItemExist = false;
				for( var i = 0; existingItems.length > i; i++ ){
					if(existingItems[i].Material === title){
						isItemExist = true;
					}
				}
			}
			if(isItemExist){
				sap.m.MessageBox.alert("This material has already been added for this VMI location. Please select another material or cancel.");
				this.formReset(false, "", "");
			} else {
				oView.byId('matHelp').setValue(title);	
				this.materialObj = oSelectedItem.getBindingContext().getObject();
				this.formReset(true, " ", this.materialObj.Uom);		
			}
		}
		
	},
	
	_handlewbsValueHelpClose : function(evt) {
		var oSelectedItem = evt.getParameter("selectedItem");
		if (oSelectedItem) {
			this.getView().byId('matHelp').setValue(
					oSelectedItem.getTitle());
			this.sPath = oSelectedItem.getBindingContextPath();
		}
		evt.getSource().getBinding("items").filter([]);
	},
	
	handleAddItem : function(evt) {
		var that = this;
		var view = this.getView();
		
		// Validation for Add Item
		function validate() {
			var oEntry = {};
			oEntry.Material = view.byId('matHelp').getValue();
			oEntry.HerdSize = parseInt(view.byId('hardSize').getValue());
			oEntry.CurrInv = view.byId('currInv').getValue();
			oEntry.DailyUsage = view.byId('dailyUsg').getValue();
			oEntry.OrderQty = view.byId('ordQty').getValue();
			oEntry.Notes = view.byId('nts').getValue();
			oEntry.Uom = (that.materialObj) ? that.materialObj.Uom : "";
			oEntry.UnitLbs = (that.materialObj) ? that.materialObj.UnitWeightLBS : "";
			oEntry.Shipto = view.getModel("Customers").getData().results[that._detailId].Shipto;
			oEntry.Soldto = view.getModel("Customers").getData().results[that._detailId].Soldto;
	
			if (!oEntry.Material) {
				view.byId('matHelp').addStyleClass("input_error");
			} else {
				view.byId('matHelp').removeStyleClass("input_error");
			}
	
			if (!oEntry.HerdSize) {
				view.byId('hardSize').addStyleClass("input_error");
			} else {
				view.byId('hardSize').removeStyleClass("input_error");
			}
			
			if (!oEntry.CurrInv) {
				view.byId('currInv').addStyleClass("input_error");
			} else {
				view.byId('currInv').removeStyleClass("input_error");
			}
			
			if (!oEntry.DailyUsage) {
				view.byId('dailyUsg').addStyleClass("input_error");
			} else {
				view.byId('dailyUsg').removeStyleClass("input_error");
			}
			
			if (!oEntry.OrderQty) {
				view.byId('ordQty').addStyleClass("input_error");
			} else {
				view.byId('ordQty').removeStyleClass("input_error");
			}
			
			if (oEntry.Material && oEntry.HerdSize && oEntry.CurrInv && oEntry.DailyUsage && oEntry.OrderQty) {
				return oEntry;
			}
		}
		// If Item Valid Add Item
		if (validate()) { 
			var oDialog = new sap.m.BusyDialog({});		    
			var oEntry = {};
			oEntry = validate();
			oDialog.open();
			view.getModel().create('/VMIItemSet', oEntry, null,	function(res) {
				oDialog.close();
				app.ref.MasterController.getView().getController().itemsAdded = res;
				app.ref.MasterController.getView().getController().updateCustomersData();
				sap.m.MessageBox.alert("Material " + res.Material + " added successfully", { onClose : function(evt) {
						that.formReset(false, "", "");														
						that.router.navTo("detail",	{
							viewId : that._detailId
						});
					}
				});
			},
			function(error) {
				oDialog.close();
				var msg = (error.message.value) ? error.message.value : "Error occured while adding item";			
				sap.m.MessageBox.alert(msg);
			});
		}
	
	},
	handleCancel : function(evt) {
		this.formReset(false, "", "");
		this.router.navTo("detail", {
			viewId : this._detailId
		});
	},
	
	currentInvLiveChange : function(evt) {
		var tfValue = sap.ui.getCore().byId(evt.getSource().getId()).getValue();
		if( isNaN(tfValue) ){
			tfValue = tfValue.substr(0,tfValue.length-1);
			evt.getSource().setValue(tfValue);
		}else{
			var curInv = evt.getParameter("value");
			var curInvLbs = curInv * parseInt(this.materialObj.UnitWeightLBS);
			this.getView().byId("curInvLBS").setValue(curInvLbs.toFixed(3));
		}
	},
	
	dailyUsageLiveChange : function(evt) {
		var tfValue = sap.ui.getCore().byId(evt.getSource().getId()).getValue();
		if( isNaN(tfValue) ){
			tfValue = tfValue.substr(0,tfValue.length-1);
			evt.getSource().setValue(tfValue);
		}else{
			var daiUse = evt.getParameter("value");
			var daiUseLbs = daiUse * parseInt(this.materialObj.UnitWeightLBS);
			this.getView().byId("dailyUsgLBS").setValue(daiUseLbs.toFixed(3));
		}
	},
	
	ordQtyLiveChange : function(evt) {
		var tfValue = sap.ui.getCore().byId(evt.getSource().getId()).getValue();
		if( isNaN(tfValue) ){
			tfValue = tfValue.substr(0,tfValue.length-1);
			evt.getSource().setValue(tfValue);
		}else{
			var ordQty = evt.getParameter("value");
			var ordQtyLbs = ordQty * parseInt(this.materialObj.UnitWeightLBS);
			this.getView().byId("ordQtyLBS").setValue(ordQtyLbs.toFixed(3));
		}
	},
	
	formReset : function(bool, nullVal, uom){
		var oView = this.getView();	

		if(!bool){ 
			oView.byId("matHelp").setValue(nullVal);
			oView.byId("curInvLBS").setValue(nullVal);
			oView.byId("dailyUsgLBS").setValue(nullVal);
			oView.byId("ordQtyLBS").setValue(nullVal);
		}
		oView.byId("curInvUOMLab").setVisible(bool);						
		oView.byId("curInvLBS").setVisible(bool);						
		oView.byId("curLbTxt").setVisible(bool);
		
		oView.byId("dailyUsgUOMLab").setVisible(bool);						
		oView.byId("dailyUsgLBS").setVisible(bool);						
		oView.byId("dailyUsgLBText").setVisible(bool);
		
		oView.byId("ordQtyUOMLab").setVisible(bool);						
		oView.byId("ordQtyLBS").setVisible(bool);						
		oView.byId("orderQtyLBText").setVisible(bool);

		oView.byId("curInvUOMLab").setText(uom);
		oView.byId("dailyUsgUOMLab").setText(uom);
		oView.byId("ordQtyUOMLab").setText(uom);		
		
		oView.byId("hardSize").setEditable(bool);
		oView.byId("hardSize").setValue(nullVal);
		oView.byId("currInv").setEditable(bool);
		oView.byId("currInv").setValue(nullVal);
		oView.byId("dailyUsg").setEditable(bool);
		oView.byId("dailyUsg").setValue(nullVal);
		oView.byId("ordQty").setEditable(bool);
		oView.byId("ordQty").setValue(nullVal);
		oView.byId("nts").setEditable(bool);
		oView.byId("nts").setValue(nullVal);
		
		oView.byId('matHelp').removeStyleClass("input_error");
		oView.byId('hardSize').removeStyleClass("input_error");
		oView.byId('currInv').removeStyleClass("input_error");
		oView.byId('dailyUsg').removeStyleClass("input_error");
		oView.byId('ordQty').removeStyleClass("input_error");
	}

	
	});