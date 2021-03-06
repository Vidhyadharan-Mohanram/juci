//! Author: Martin K. Schröder <mkschreder.uk@gmail.com>

JUCI.app
.factory("$netmode", function($uci, $rpc){
	var sync_netmode = $uci.$sync("netmode"); 
	
	function Netmode (){
		
	}
	
	Netmode.prototype.list = function(){
		var def = $.Deferred(); 
		sync_netmode.done(function(){
			if($uci.netmode && $uci.netmode["@netmode"]){
				def.resolve($uci.netmode["@netmode"]); 
			} else {
				def.reject(); 
			}
		}); 
		return def.promise(); 
	}
	
	Netmode.prototype.select = function(mode){
		var def = $.Deferred(); 
		if(!$rpc.juci.netmode || !$rpc.juci.netmode.select) {
			def.reject(); 
			return def.promise(); 
		}
		$rpc.juci.netmode.select({ "netmode": mode }).done(function(){
			def.resolve(); 
		}).fail(function(){
			def.reject(); 
		}); 
		
		return def.promise(); 
	}
	
	
	Netmode.prototype.getCurrentMode = function(){
		var def = $.Deferred(); 
		// currently use the setting from uci. But we want to actually compare the files eventually. 
		sync_netmode.done(function(){
			setTimeout(function(){
				if($uci.netmode && $uci.netmode.setup){
					def.resolve($uci.netmode[$uci.netmode.setup.curmode.value]); 
				} else {
					def.reject(); 
				}
			},0); 
		});
		return def.promise(); 
	}
	
	return new Netmode(); 
}); 

JUCI.app.run(function($uci){
	// automatically create the setup section because without it we can not get current netmode (it should actually be there by default, but just in case);
	$uci.$sync("netmode").done(function(){
		$uci.netmode.create({".type": "mode", ".name": "setup" }).done(function(){
			$uci.$save(); 
		}); 
	}); 
}); 

UCI.$registerConfig("netmode"); 
UCI.netmode.$registerSectionType("mode", {
	"dir":						{ dvalue: '', type: String }, 
	"detail":					{ dvalue: '', type: String }, 
	"curmode":				{ dvalue: '', type: String }
}); 
UCI.netmode.$registerSectionType("netmode", {
	"name":						{ dvalue: '', type: String }, 
	"desc":						{ dvalue: '', type: String }, 
	"conf":					{ dvalue: '', type: String }, 
	"exp":				{ dvalue: '', type: String }
}); 
