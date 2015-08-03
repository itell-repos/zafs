jQuery.sap.declare("itelli.zafs.util.Formatter");

jQuery.sap.require("sap.ui.core.format.DateFormat");

itelli.zafs.util.Formatter = {
	
	colorFormatter:function(value, delFlag, items, isItemPending) {
		var text="";
		if(delFlag == ""){			
			if(parseInt(value)<3){
				text="Inventory Low";
				this.removeStyleClass("greencolor");
				this.removeStyleClass("graycolor");
				this.removeStyleClass("orderPendingItem");
				this.addStyleClass("redcolor");
			}else{
				text="Inventory OK";
				this.removeStyleClass("redcolor");
				this.removeStyleClass("graycolor");
				this.removeStyleClass("orderPendingItem");
				this.addStyleClass("greencolor");
			}
			if(items == 0) text = ""; 
		} else {
			text = "Inactive";
			this.removeStyleClass("redcolor");
			this.removeStyleClass("greencolor");
			this.removeStyleClass("orderPendingItem");
			this.addStyleClass("graycolor");			
		}
		
		if(isItemPending){
			text = isItemPending;
			this.removeStyleClass("greencolor");
			this.removeStyleClass("graycolor");
			this.removeStyleClass("redcolor");
			this.addStyleClass("orderPendingItem");
		}
		
	    return text;
	},
	
	/*
	 * Date Formatter 
	 * @sample 2015-06-04T00:00:00 to mm/dd/yyyy
	 */
	dateTo : function(val){
		if(val){
			var date = new Date(val);
			var month = date.getMonth() + 1;
			var rformate = month + "/" + date.getDate() + "/" + date.getFullYear();
			return rformate;
		}		
	}, 
	
	/*
	 * @des Float to Number
	 */
	floatToNum : function(val){
		if(val){
			var int = val.toString().split(".")[0];
			var fraction = (val.toString().split(".")[1]) ? "."+ val.toString().split(".")[1].substring(0, 2) : "";
			val =  parseFloat(int + fraction); 
			return val;
		}			
	},
	/*
	 * @Des March 26, 2014
	 */	
	requestDeliveryDate : function(currentInventory, dailyUsage){
		// Formula is CurrentInventory / dailyUsage = Value (how many days left to low inventroy)
		var date = new Date();
		//var extraDays = 3;
		var curDate = ( parseFloat(currentInventory) / parseFloat(dailyUsage) ) + new Date().getDate();
		if(curDate) date.setDate(curDate);
		return date;	
	},
	/*
	 * @Des Number to Decimal
	 */
	showDecimal : function(val){
		return parseInt(val).toFixed(3);
	},
	/*
	 * Last Update Date Generator
	 */
	lastUpdateDate : function(val, items){
		if(items > 0){
			var date = new Date();		
			var curDate = date.getDate() - parseInt(val);
			if(curDate) date.setDate(curDate);
			var month = date.getMonth() + 1;
			var rformate = month + "/" + date.getDate() + "/" + date.getFullYear();
			return "Last Update/Visit: " + rformate;
		} else {
			return " ";
		}
			
	}	
	
};