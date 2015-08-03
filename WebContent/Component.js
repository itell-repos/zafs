jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.declare("itelli.zafs.Component");
jQuery.sap.includeStyleSheet(jQuery.sap.getModulePath("itelli.zafs.css.style",".css"));


sap.ui.core.UIComponent
    .extend(
        "itelli.zafs.Component",
        {

          metadata : {
            routing : {
              config : {
                viewType : "XML",
                viewPath : "view",
                targetControl : "app--splitApp",
                clearTarget : false,
                transition : "slide"
              },
              routes : [{
                pattern : "",
                viewType : "XML",
                name : "master",
                viewPath : "itelli.zafs.view.master",
                view : "master",
                viewLevel : 0,
                preservePageInSplitContainer : true,
                targetAggregation : "masterPages",
                subroutes : [ {
					pattern : "detail/{viewId}",
					name : "detail",
					view : "detail",
					viewPath : "itelli.zafs.view.detail",
					viewLevel : 1,
					targetAggregation : "detailPages"
				} ]
              },{
					pattern : "additem/{viewId}",
					name : "additem",
					view : "additem",
					viewPath : "itelli.zafs.view.detail",
					viewLevel : 1,
					targetAggregation : "detailPages"
				},{
					pattern : "proposeorder/{viewId}",
					name : "proposeorder",
					view : "proposeorder",
					viewPath : "itelli.zafs.view.detail",
					viewLevel : 1,
					targetAggregation : "detailPages"
				},{
					pattern : "itemdetail/{viewId}/{itemId}",
					name : "itemdetail",
					view : "itemdetail",
					viewPath : "itelli.zafs.view.detail",
					viewLevel : 1,
					targetAggregation : "detailPages"
				}]
            }
          },

          /**
           * !!! The steps in here are sequence dependent !!!
           */
          init : function() {
            // 1. some very generic requires
        	  jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
        	  jQuery.sap.require("itelli.zafs.MyRouter"); 
        	  
            // 2. call overridden init (calls createContent)
            sap.ui.core.UIComponent.prototype.init.apply(this,arguments);

            // 3a. monkey patch the router
            var router = this.getRouter();
            router.myNavBack = itelli.zafs.MyRouter.myNavBack;
            router.myNavToWithoutHash = itelli.zafs.MyRouter.myNavToWithoutHash;

            

            // 4. initialize the router
            this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
            router.initialize();
            
          },

          destroy : function() {
            if (this.routeHandler) {
              this.routeHandler.destroy();
            }

            // call overridden destroy
            sap.ui.core.UIComponent.prototype.destroy.apply(this,arguments);
          },

          createContent : function() {
            // create root view
            var oView = sap.ui.view({
              id : "app",
              viewName : "itelli.zafs.view.App",
              type : "XML",
              viewData : {
                component : this
              }
            });
            
            var i18nModel = new sap.ui.model.resource.ResourceModel(
                {
                  bundleUrl : jQuery.sap.getModulePath("itelli.zafs.i18n.appTexts",".properties") 
                });
            oView.setModel(i18nModel, "i18n");

            // set device model
            var deviceModel = new sap.ui.model.json.JSONModel({
              isPhone : jQuery.device.is.phone,
              listMode : (jQuery.device.is.phone) ? "None"
                  : "SingleSelectMaster",
              listItemType : (jQuery.device.is.phone) ? "Active"
                  : "Inactive"
            });
            
            deviceModel.setDefaultBindingMode("OneWay");
            oView.setModel(deviceModel, "device");

            // Defining Service URl
			var url ="proxy/sap/opu/odata/sap/ZVMI_SRV?sap-client=110";
			//var url = "/sap/opu/odata/sap/ZVMI_SRV";
            var oData = new sap.ui.model.odata.ODataModel(url, true);
            oData.setDefaultCountMode(false);
            oView.setModel(oData);
            
            var oDialog = new sap.m.BusyDialog({});	
  		  	oDialog.open();
  		  	
  		  	// VMI Items List Call
  		  	oView.getModel().read("/VMIShiptoSet", null, null, true,	function(response) {				
				var jsonModel = new sap.ui.model.json.JSONModel(response);
				oView.setModel(jsonModel, "Customers");
				oDialog.close();
			}, function(oError) {		
				oDialog.close();
				sap.m.MessageBox.alert("VMI Locations are failed to load");
			});


            return oView;
          }
        });