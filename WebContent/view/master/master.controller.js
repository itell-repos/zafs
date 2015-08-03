jQuery.sap.require("itelli.zafs.util.Formatter");
sap.ui.controller("itelli.zafs.view.master.master", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf view.master.master
*/
	onInit: function() {
		jQuery.sap.declare("app.ref.itemdetails");
		jQuery.sap.declare("app.ref.customer");
		jQuery.sap.declare("app.ref.MasterController");
		app.ref.itemdetails = false;
		app.ref.MasterController = this;		
		this.router = sap.ui.core.UIComponent.getRouterFor(this);
	    this.oUpdateFinishedDeferred = jQuery.Deferred();
	    var oView = this.getView();
	    var list = oView.byId("list");
	    this.itemsAdded = {};
	    this.isOrderSubmited = false;
	    this.isItemDeleted = false;
	    
	    list.attachEventOnce("updateFinished", function() {
	    jQuery.when(this.oUpdateFinishedDeferred).then(jQuery.proxy(function() {	    	
	    	// Apply Default Filter
		    var oBinding = list.getBinding("items");
		    var oFilter = new sap.ui.model.Filter("DelFlag", sap.ui.model.FilterOperator.NE, "D");
		    oBinding.filter([oFilter]);
		    // default selection
	        this._selectDetail();
	        }, this));
	      this.oUpdateFinishedDeferred.resolve();
	    }, this);
	},

	_selectDetail : function() {
	    var list = this.getView().byId("list");
	    var items = list.getItems();
	    if (!sap.ui.Device.system.phone && items.length > 0
	        && !list.getSelectedItem()) {
	      list.setSelectedItem(items[0], true);
	      this._showDetail(items[0]);
	    }
	  },
	  
	  _showDetail : function(oEvent) {	
		var that = this;		
		app.ref.itemdetails = false;
		var sPath = oEvent.getBindingContext("Customers").getPath();
		this.customer = oEvent.getBindingContext("Customers").getObject();
	    var sViewId = sPath.substring(sPath.lastIndexOf("/") + 1);
	    this.getVMIitems(function(response){
	    	if(response.results && response.results.length > 0){
				for(var i = 0; i < response.results.length; i++){					
					var item = response.results[i];
					if(!item.LastSoStatus){
						item.DailyUsage = "";
						item.CurrInv = "";
					}					
				}
			}	    	
	    	that.getItems = response;
	    	that.router.navTo("detail", {
	  	      viewId :  sViewId     
	  	    });
	    });
	    
	  },
	  
	  getVMIitems : function(cb){
		var oDialog = new sap.m.BusyDialog({});
		oDialog.open();
		var url = "/VMIItemSet?$filter=Shipto eq '" + this.customer.Shipto + "'";
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
	  
	  //Called when select the list
	  handleListSelect : function(oEvent) {			
			var that = this;
			var params= oEvent.getParameter("listItem");
			if(app.ref.itemdetails === true){
				sap.m.MessageBox.alert("You're about to display another VMI location. Your updates to the current location may be lost. Do you want to proceed?",  { 
					icon : sap.m.MessageBox.Icon.WARNING,
					title: "Alert",  				
					actions : [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
					onClose : function(oAction) { 
						if ( oAction === sap.m.MessageBox.Action.YES ){
							that._showDetail(params); 						
						}
					},
				});
			} else {
				that._showDetail(params);
			}
	  },
	  
	  //Called when press the list
	  handleListItemPress : function(evt) {		
		var that = this;
		var params= evt.getSource();
		if(app.ref.itemdetails){
			sap.m.MessageBox.alert("Do you want to update changes to customer",  { 
				icon : sap.m.MessageBox.Icon.WARNING,
				title: "Alert",  				
				actions : [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
				onClose : function(oAction) { if ( oAction === sap.m.MessageBox.Action.YES )  that._showDetail(params); },
			});
		} else {
			that._showDetail(params);
		}
	  },
	  
	  handleSearch : function(evt) {
		var filters = [];
		var query = evt.getSource().getValue();
		if (query && query.length > 0) {
			// create model filter
			var filter = new sap.ui.model.Filter("Name1", sap.ui.model.FilterOperator.Contains, query);
			var filter1 = new sap.ui.model.Filter("City", sap.ui.model.FilterOperator.Contains, query);
			var filters = new sap.ui.model.Filter([filter, filter1], false);
			// add filter for search			
		}
		// update list binding
		var list = this.getView().byId("list");
		var binding = list.getBinding("items");
		binding.filter(filters);
	},
	
	onFilter : function(evt){		
		if (! this._oDialog) {
			this._oDialog = sap.ui.xmlfragment("itelli.zafs.view.master.FilterDialog", this);
		}
		this._oDialog.setModel(this.getView().getModel());
		// toggle compact style
		jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		this._oDialog.open();
	},
	
	updateCustomersData: function(cb){
		var that = this;		
	    var oldFilters = that.oldFilters;
		that.getView().getModel().read("/VMIShiptoSet", null, null, true,	function(response) {
				var oView = that.getView(), oFilter;
				var jsonModel = new sap.ui.model.json.JSONModel(response);
				oView.setModel(jsonModel, "Customers");				
				
			    var list = oView.byId("list");	   
			    var oBinding = list.getBinding("items");
			    
				// Apply Default Filter
			    if(oldFilters){
			    	oFilter = oldFilters;
			    	var vGroup = { key: "DelFlag", text: "D" };		
				    oBinding.sort([new sap.ui.model.Sorter("DelFlag", false, vGroup)]);
			    } else {				    			    
			    	oFilter = [new sap.ui.model.Filter("DelFlag", sap.ui.model.FilterOperator.NE, "D")];
			    }
			    
			    oBinding.filter(oFilter);
				    
			    if(cb){
			    	cb(response);
			    }
			    
			    
		}, function(oError) {			
			sap.m.MessageBox.alert("VMI Locations are failed to load");
		});		
	},
	
	selectMasterItem : function(ind){
		var list = this.getView().byId("list");
	    var items = list.getItems();
	    list.setSelectedItem(items[ind]);
	},
	
	handleConfirm: function (oEvent) {
	    if (oEvent.getParameters().filterString) {
	      sap.m.MessageToast.show(oEvent.getParameters().filterString);
	    }
	    //
	    var oView = this.getView();
	    var oTable = oView.byId("list");

	    var mParams = oEvent.getParameters();
	    var oBinding = oTable.getBinding("items");

	    // apply sorter to binding
	    var aSorters = [];
	    var aFilters = [];
	    
	    // Group
	    var vGroup = { key: "DelFlag", text: "D" };	
	    aSorters.push(new sap.ui.model.Sorter("DelFlag", false, vGroup));
	    
	    var sPath = mParams.sortItem.getKey();
	    var bDescending = mParams.sortDescending;
	    aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));	   
	    oBinding.sort(aSorters); 

	    // apply filters to binding
	    if( mParams.filterItems.length > 0 ) {    		    
		    jQuery.each(mParams.filterItems, function (i, oItem) {
		      var aSplit = oItem.getKey().split("_");
		      var sPath = aSplit[0];
		      var sValue1 = aSplit[1];
		      var oFilter;
		      var ii = 0;
		      
		      if(sPath == "DaysInvLeft"){
		    	  if(sValue1 == "A"){
		    		  oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.LE, 3);
		    	  } else {
		    		  oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.GT, 3);
		    	  }
		      }
		      		      
		      if(sPath == "DelFlag"){
		    	  ii++;
		    	  oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.EQ, sValue1);		    	 
		      }
		      
		      aFilters.push(oFilter);
		      
		    });
		    this.oldFilters = aFilters;
		    oBinding.filter(aFilters);
	    } else {
	    	var oFilter = new sap.ui.model.Filter("DelFlag", sap.ui.model.FilterOperator.NE, "D");
		    oBinding.filter([oFilter]);
	    }
	    
	    this._selectDetail();

	    // update filter bar
	    oView.byId("vsdFilterBar").setVisible(aFilters.length > 0);
	    oView.byId("vsdFilterLabel").setText(mParams.filterString);
	}

});