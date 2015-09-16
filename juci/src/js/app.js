//! Author: Martin K. Schröder <mkschreder.uk@gmail.com>

// TODO: make this automatic
if(!window.JUCI_COMPILED) window.JUCI_COMPILED = 1; 
//if(!global.JUCI_PLUGINS) global.JUCI_COMPILED = 0; 

// a few functions for string conversions
String.prototype.toDash = function(){
	return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};
String.prototype.toCamel = function(){
	return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

$.jsonRPC.setup({
  endPoint: '/ubus',
  namespace: 'juci'
});

window.$ = $; 

require.config({
    baseUrl: '/',
    urlArgs: 'v=1.0'
});



JUCI.app.config(function ($stateProvider, $locationProvider, $compileProvider, $urlRouterProvider, $controllerProvider, $templateCacheProvider, $provide) {
	console.log("CONF"); 
	//$locationProvider.otherwise({ redirectTo: "/" });
	$locationProvider.hashPrefix('!');
	$locationProvider.html5Mode(false); 
	
	$juci.controller = $controllerProvider.register; 
	$juci.directive = $compileProvider.directive; 
	$juci.state = $stateProvider.state; 
	$juci.decorator = function(name, func){
		return $provide.decorator(name, func); 
	}
	$juci.$config = angular.module("juci").config; 
	$juci.$stateProvider = $stateProvider; 

	$juci.$urlRouterProvider = $urlRouterProvider; 
	$juci.redirect = function(page){
		var DEVMODE = (JUCI_COMPILED)?"":"devgui.html"; 
		window.location.href = DEVMODE+"#!/"+page; 
	}
	/*
	$stateProvider.state("404", {
		url: "/404", 
		views: {
			"content": {
				templateUrl: "/html/404.html"
			}
		},
		onEnter: function(){
			if(!$juci._initialized){
				$juci.redirect("/init/404"); 
			}
		}
	}); 
	// application init state. All initialization is done here. 
	$stateProvider.state("init", {
		url: "/init/:redirect", 
		views: {
			"content": {
				templateUrl: "html/init.html"
			}
		}, 
		onEnter: function($state, $stateParams, $config, $rpc, $navigation, $location, $rootScope, $http){
			if($juci._initialized) {
				$juci.redirect($stateParams.redirect || "overview"); 
				return;
			} else {
				
			}
		},
	}); */
	$urlRouterProvider.otherwise("404"); 
})
.run(function($templateCache){
	var _get = $templateCache.get; 
	var _put = $templateCache.put; 
	$templateCache.get = function(name){
		name = name.replace(/\/\//g, "/").replace(/^\//, ""); 
		//console.log("Get template '"+name+"'"); 
		return _get.call($templateCache, name); 
	}
	$templateCache.put = function(name, value){
		name = name.replace(/\/\//g, "/").replace(/^\//, ""); 
		//console.log("Put template '"+name+"'"); 
		return _put.call($templateCache, name, value); 
	}
})
.run(function($rootScope, $state, gettextCatalog, $tr, gettext, $rpc, $config, $location, $navigation, $templateCache, $languages){
	console.log("juci: angular init"); 
	
	// TODO: maybe use some other way to gather errors than root scope? 
	$rootScope.errors = []; 
	
	// register a global error handler so we can show all errors
	window.onerror = function(err){
		$rootScope.errors.push({ message: err+":\n\n"+(err.stack||"") });
		alert(err);  
	}
	$rootScope.$on("error", function(ev, data){
		$rootScope.errors.push({message: data}); 
		//console.log("ERROR: "+ev.name+": "+JSON.stringify(Object.keys(ev.currentScope))); 
	}); 
	$rootScope.$on("errors", function(ev, errors){
		if(errors && (errors instanceof Array)){
			$rootScope.errors.concat(errors.map(function(x){ return { message: x }; })); 
		} else {
			$rootScope.errors.length = 0; 
		}
	}); 
	$rootScope.$on("errors_begin", function(ev){
		$rootScope.errors.splice(0, $rootScope.errors.length); 
	}); 
	// set current language
	gettextCatalog.currentLanguage = "en"; 
	gettextCatalog.debug = true;
	
	var path = $location.path().replace(/\//g, "").replace(/\./g, "_");  
	
	// Generate states for all loaded pages
	/*Object.keys($juci.plugins).map(function(pname){
		var plugin = $juci.plugins[pname]; 
		Object.keys(plugin.pages||{}).map(function(k){
			var page = plugin.pages[k]; 
			if(page.view){
				//scripts.push(plugin_root + "/" + page.view); 
				var url = k.replace(/\./g, "-").replace(/_/g, "-").replace(/\//g, "-"); 
				var name = url.replace(/\//g, "_").replace(/-/g, "_"); 
				//console.log("Registering state "+name+" at "+url); 
				var plugin_root = "/plugins/"+pname; 
				$juci.$stateProvider.state(name, {
					url: "/"+url, 
					views: {
						"content": {
							templateUrl: plugin_root + "/" + page.view + ".html"
						}
					},
					onEnter: function($uci, $rootScope){
						$rootScope.errors.splice(0, $rootScope.errors.length); 
						
						// do a revert of any changes upon each page load so that we make sure we start form "clean page"
						$uci.$revert();
						
						document.title = $tr(k.replace(/\//g, ".")+".title")+" - "+$tr(gettext("application.name")); 
					}, 
					onExit: function($interval){
						JUCI.interval.$clearAll(); 
					}
				}); 
			}
		}); 
	}); */
	
	// load the right page from the start
	if($rpc.$isLoggedIn()){
		$juci.redirect(path||"overview"); 
	} else {
		$juci.redirect("login");
	}
	
	// setup automatic session "pinging" and redirect to login page if the user session can not be accessed
	setInterval(function(){
		$rpc.$authenticate().fail(function(){
			// TODO: this also redirects to login without notice if box reboots, or rpcd crashes. 
			// Determine whether this behavior can be improved because it can be annoying (of course the most annoying part is that rpcd crashes in the first place..) 
			$juci.redirect("login");
		});
	}, 10000); 
}) 
// TODO: figure out how to avoid forward declarations of things we intend to override. 
.directive("juciFooter", function(){ return {} })
.directive("juciLayoutNaked", function(){ return {} })
.directive("juciLayoutSingleColumn", function(){ return {} })
.directive("juciLayoutWithSidebar", function(){ return {} })
.directive("juciNav", function(){ return {} })
.directive("juciNavbar", function(){ return {} })
.directive("juciTopBar", function(){ return {} })
.directive('ngOnload', [function(){
	return {
		scope: {
				callBack: '&ngOnload'
		},
		link: function(scope, element, attrs){
				element.on('load', function(){
						return scope.callBack();
				})
		}
}}]); 

// make autofocus directive work as expected
JUCI.app.directive('autofocus', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    link : function($scope, $element) {
      $timeout(function() {
        $element[0].focus();
      });
    }
  }
}]);

// This ensures that we have control over the initialization order (base system first, then angular). 
angular.element(document).ready(function() {
	JUCI.$init().done(function(){
		angular.bootstrap(document, ["juci"]);
	}).fail(function(){
		alert("JUCI failed to initialize! look in browser console for more details (this should not happen!)"); 
	}); 
});

