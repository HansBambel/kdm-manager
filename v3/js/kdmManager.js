//"use strict";

// public helpers
function rollUp(e_id) {
    console.error('rollUp() is no longer public JS!');
    console.error('Use the $rootScope.rollUp() instead!');
};

function showHide(e_id, force) {
    console.error('The public showHide() method is deprecated and removed in version 4!');
    console.error("showHide('" + e_id + "') lost full support March 2021!");

    var e = document.getElementById(e_id);
    var hide_class = "hidden";
    var visible_class = "visible";
    if (e === null) {
        console.error("showHide('" + e_id + "') -> No element with ID value '" + e_id + "' found on the page!");
        return false
    }
    if (e.classList.contains(hide_class)) {
        e.classList.remove(hide_class);
        e.classList.add(visible_class);
    } else {
        e.classList.add(hide_class);
        e.classList.remove(visible_class)
    };

    // handle the 'force' param
    if (force === 'show') {
        e.classList.remove(hide_class);
        e.classList.add(visible_class);
        return true;
    } else if (force === 'hide') {
        e.classList.remove(visible_class);
        e.classList.add(hide_class);
        return true;
    };
 }

function sleep (time) {return new Promise((resolve) => setTimeout(resolve, time));}

function convertMS(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
};



//
//      The angular application starts here!
//
angular.module('getTypeFilter', []).filter('getType', function() {
  return function(obj) {
    return typeof obj
  };
});

var app = angular.module('kdmManager', ['ngAnimate','getTypeFilter']);

//  directives for that ass
app.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeFunc);
    }
  };
});



// general-use filters and other AngularJS bric-a-brack
app.filter('trustedHTML', 
   function($sce) {
      return $sce.trustAsHtml; 
   }
);

app.filter('flatten' , function(){
  return function(array){
    return array.reduce(function(flatten, group){
      group.items.forEach(function(item){
        flatten.push({ group: group.name , name: item.name})
      })
      return flatten;
    },[]);
  }
})

app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});

app.filter('hasKeyword', function() {
  return function(assets, keyword) {
    var filtered = [];
    angular.forEach(assets, function(asset) {
        if (asset.keywords.indexOf(keyword) !== -1) {
            filtered.push(asset);
        };
    });
	return filtered;
  };
});


app.controller('rootController', function($scope, $rootScope, $http, $log, $timeout) {
    // root controller keyboard capture! 
	document.onkeydown= function(key){ reactKey(key); }
	function reactKey(evt) {
		// 37 == left ; 39 == right
		//console.warn('keypress: ' + evt.keyCode);
		if(evt.keyCode === 37) {
  	    	$rootScope.changeTab('previous');
	    } else if (evt.keyCode === 39) {
			$rootScope.changeTab('next');
		};
	}

    // debugger
    document.addEventListener ("keydown", function (zEvent) {
        if (zEvent.ctrlKey  &&  zEvent.altKey  &&  zEvent.key === "d") {  // case sensitive
            var e = document.getElementById('ngDebugWindow')
            if ($rootScope.NGDEBUG === true) {
                e.classList.add('hidden')
                console.warn('Debug mode disabled!')
                $rootScope.NGDEBUG = undefined;
            } else {
                e.classList.remove('hidden')
                console.warn('Debug mode enabled!')
                $rootScope.NGDEBUG = true;
            };
        };
    } );

    $scope.$log = $log;

    // we probably have $scope.scratch by now, but initialize just in case
    if ($scope.scratch === undefined ) {
        $scope.scratch = {};
    };

    $scope.scratch.settlementsRetrieved = 0;

    $rootScope.setView = function(view) {
        $rootScope.view = view;
        $scope.view = view;
    };

    // initialize rootScope elements here; these are set on every view
    $rootScope.objectKeys = Object.keys;
    $rootScope.ngString = String;



    // show/hide special loader elements
    $scope.showFullPageLoader = function() {
        $scope.ngShow('fullPageLoader')
    };
    $scope.hideFullPageLoader = function() {
        $scope.ngHide('fullPageLoader', true)
    };
    $scope.showCornerLoader = function() {
        $scope.ngShow('cornerLoader')
    };
    $scope.hideCornerLoader = function() {
        $scope.ngHide('cornerLoader', true)
    };


    // rollUp controls; now TOTALLY angular (no doc-scope JS)
    $rootScope.ngRolledUp = {};
    $rootScope.getRollDownContainer = function(e_id) {
        var e = document.getElementById(e_id);
        if (e === null) {
            console.error("roll-up element '" + e_id + "' does not exist!");
            return;
        };
        return e
    };
    $rootScope.rollUp = function(e_id) {
        var e = $rootScope.getRollDownContainer(e_id);

        if (e.classList.contains('rolled_up') == true) {
            e.classList.remove('rolled_up');
            $rootScope.ngRolledUp[e_id] = false;
        } else {
            e.classList.add('rolled_up');
            $rootScope.ngRolledUp[e_id] = true;
        };
    };
    $rootScope.rollDown = function(e_id) {
        // forces an element into the down position
        var e = $rootScope.getRollDownContainer(e_id);
        e.classList.remove('rolled_up');
        $rootScope.ngRolledUp[e_id] = false;
    }

    // tab helpers
    $rootScope.tabsObject = {   // set object defaults
        previousTab: 0,
        activeTab: 0,
		minTab: 0,
    };

	$rootScope.getPrevNextTab = function() {
        var output = {}
		for (var i = 0; i < $scope.tabsObject.tabs.length; i++) {
		    var tab = $scope.tabsObject.tabs[i];
		    if ($scope.tabsObject.activeTab === tab.id) {
                output.previous = $scope.tabsObject.tabs[i - 1]
				output.current = tab;
                output.next = $scope.tabsObject.tabs[i + 1]
			}
		};
		return output
	};
    $rootScope.changeTab = function(destination) {
        // figures out if we're going up (right) or down (left) in tab order
        // and briefly displays an element with an arrow, indicating that
        // we're moving in that direction

        // set defaults
        if ($scope.tabsObject.previousTab === undefined) {
            console.error(
                '$scope.tabsObject.previousTab is not set! Defaulting to zero...'
            );
            $scope.tabsObject.previousTab = 0;
        }

        var p = $rootScope.getPrevNextTab()

//        console.warn("raw destination ='" + destination + "'");
        if (destination === 'previous') {
            if (p.previous === undefined) {
                destination = $scope.tabsObject.activeTab
            } else {
                destination = p.previous.id;
            };
		} else if (destination === 'next') {
            if (p.next === undefined) {
                destination = $scope.tabsObject.activeTab
            } else {
                destination = p.next.id;
            };
		} else if (destination === undefined) {
            destination = 666;
        }

		// sanity check destination
		if (destination < $scope.tabsObject.minTab) {
			destination = $scope.tabsObject.minTab
		};

		$scope.tabsObject.activeTab = destination;

        // now determine direction
        var direction = 'right';
        if (destination < $scope.tabsObject.previousTab) {
            direction = 'left';
        } else if (destination === $scope.tabsObject.previousTab) {
            direction = null;
        };

        if (direction === 'right') {
            $scope.ngFlash('tabNavArrowRight', 300);
        } else if (direction === 'left') {
            $scope.ngFlash('tabNavArrowLeft', 300);
        } else {
            $scope.ngFlash('tabNavArrowNull', 300);
        };

        // now, leave a var in scope so we know
        $scope.tabsObject.previousTab = destination;
    };

    // backwards compatibility helpers...DEPRECATED THO

    $rootScope.showHide = showHide;

    $rootScope.ngToggleAttrib = function(obj, attr) {
        // toggles a generic attrib on an object, 'obj'
        if (obj[attr] === true) {
            obj[attr] = false;
        } else {
            obj[attr] = true;
        };
    };

    // ngVisible, ngShow, ngHide, ngShowHide

    $rootScope.ngVisible = {}

    $rootScope.ngGetElement = function(elementId) {
        // get an element from the page or die screaming about it
        var err_slug = "ngGetElement(): ID '" + elementId;
        try {
            var element = document.getElementById(elementId);
        } catch(err) {
            console.error(err);
            throw err_slug + "' not found!";
        };
        if (element === null || element === undefined) {
            throw err_slug + "' is " + element + "!";
        };
        return element;
    };

    $rootScope.ngShow = function(elementId) {
        // for legacy compatibility: wait until the $digest finishes, then
        // get the element (it won't be present until the $digest is updated
        // after the ngVisible change above); 
        var eWatch = $scope.$watch(
            function() {
                $rootScope.ngVisible[elementId] = true;
                return document.getElementById(elementId);
            },
            function(newValue, oldValue, scope) {
                if (oldValue !== newValue || newValue !== null) {
                    newValue.classList.remove('hidden');
                    eWatch(); // unbind it
                }
            }
        )
    };

    $rootScope.ngHide = function(elementId, lazy) {
        if (lazy) {
//            console.warn("Lazy ngHide for '" + elementId + "'")
        } else {
            var element = $rootScope.ngGetElement(elementId);
            element.classList.add('hidden');
        };
        $rootScope.ngVisible[elementId] = false;
    }

    $rootScope.ngShowHide = function(elementId) {
        // supersedes showHide(), which is deprecated
        // toggles an element in and out of $rootScope.ngVisible, which is
        //  an arry of UI elements that are true or false

        if ($rootScope.ngVisible[elementId] === true) {
            $rootScope.ngHide(elementId);
        } else {
            $rootScope.ngShow(elementId);
        };

    };

    $rootScope.ngFlash = function(elementId, duration) {
        // shows an element; sleeps for 'duration'; takes the element out of
        // ngVisible list. 
        // works a bit like ngShow(), but uses $timeout to sleep for 'duration'
        // before updating the ngVisible dict
        if (duration === undefined) {
            duration = 3000;
        };

        var eVisibleWatch = $scope.$watch(
            function() {
                $rootScope.ngVisible[elementId] = true;
                return document.getElementById(elementId)
            },
            function(newValue, oldValue, scope) {
                if (oldValue !== newValue || newValue !== null) {
                    newValue.classList.remove('hidden');
                    $timeout(
                        function() {
                            $rootScope.ngVisible[elementId] = false;
                            eVisibleWatch(); // unbind it
                        },
                        duration
                    );
                }
            }
        );
        
    };

    $rootScope.dumpJSONtoTab = function(json_to_dump) {
        var output = JSON.stringify(json_to_dump, null, 2);
        var x = window.open();
        x.document.open();
        x.document.write('<html><body><pre>' + output + '</pre></body></html>');
        x.document.close();
    };

    // legacy support alert flashers
    $rootScope.errorAlert = function(hold) {
        $rootScope.flashCapsuleAlert('Error', hold);
    }
    $rootScope.savedAlert = function(hold) {
        $rootScope.flashCapsuleAlert('Saved', hold);
    }

    $rootScope.flashCapsuleAlert = function(alertType, hold) {
        // we're going to show it, so add it to visible

        $rootScope.ngCapsuleAlert = {};
        $rootScope.ngCapsuleAlert.letter = alertType.substring(0,1);
        $rootScope.ngCapsuleAlert.text = alertType;
        $rootScope.ngCapsuleAlert.style = 'kd_blue';

        if (alertType === 'Error') {
            $rootScope.ngCapsuleAlert.style = 'kd_pink';
        }

        if (hold) {
            $scope.ngShow('capsuleAlertFlasher');
        } else {
            $scope.ngFlash('capsuleAlertFlasher', 500);
        };
    };

	$rootScope.showAPIerrorModal = function(msg, request, isFatal) {

		$rootScope.ngShow('apiErrorModal');
        console.error("Displaying error message to user: '" + msg + "'");

        $rootScope.apiErrorModalMsgRequest = request;
        $rootScope.apiErrorModalMsgIsFatal = isFatal;

	    if (msg === null) {
		    msg = 'API response is NULL. Possible preflight/CORS error!'
        };

	    $rootScope.apiErrorModalMsg = msg;

	};

    $scope.ngSetFocus = function(e, clear) {
        // sets focus on a specific element
        var element = document.getElementById(e);
        console.info("Setting focus to '" + e + "'");
        if (element === null) {
            console.error('Element is null! Cannot set focus...');
        } else {
            element.focus();
        };

        var element_type = element.nodeName.toLowerCase();
        if (element_type === 'div' && clear === true) {
            console.warn("Clearing '" + e + " 'div...")
            element.innerHTML = '';
        } else if (element_type !== 'div' && clear === true) {
            console.error("Unable to clear '" + element_type + "' type element...");
        };
    };

    $scope.numberToRange = function(num) {
        return new Array(num); 
    };


    $rootScope.toTitle = function(str) {
		str = str.replace(/_/g, ' ');
		str = str.replace(/ and /g, ' & ');
		str = str.toLowerCase().split(' ');

        // turn it into a list to iterate it
		for (var i = 0; i < str.length; i++) {
			str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
		}

        // turn it back into a string now
		var norm_str = str.join(' ');

        // post processing/vanity stuff
        norm_str = norm_str.replace(/Xp/g, 'XP');
        return norm_str;
    };


    //
    //  set session and scope attributes
    //
    $rootScope.setSessionVars = function(user_login, current_session) {
        // call this at the top of all 'root' templates
        $rootScope.user_login = user_login;
        $rootScope.current_session = current_session;
        console.info('Session vars set!')
    };

    $rootScope.setLatestRelease = function() {
        var reqURL = $scope.api_url + 'releases/latest';
        console.time(reqURL);

        var res = $http.post(reqURL, {'platform': 'kdm-manager.com'});
        res.then(
            function(payload) {
                $rootScope.latestRelease = payload.data;
                $rootScope.latestRelease.versionString =
                    $scope.latestRelease.version.major + "." +
                    $scope.latestRelease.version.minor + "." +
                    $scope.latestRelease.version.patch;
                console.timeEnd(reqURL);
            },
            function(errorPayload) {
                console.error("Could not retrieve latest release info!");
                console.error(errorPayload);
            }
        );
    };


    //
    //  overlay navigation controls
    //

    $rootScope.openNav = function(e) {
        var element = document.getElementById(e);
        element.classList.add('openNav');
    };
    $rootScope.closeNav = function(e) {
        var element = document.getElementById(e);
        element.classList.remove('openNav');
    };

    $rootScope.openLeftSideNav = function() {
        // opens the main, left-side navigation pane
        $scope.scratch.left_side_nav_open = true;
        var left_element = document.getElementById('leftSideNav');
        var right_element = document.getElementById('leftSideNavUnderlay');
        var elements = [left_element, right_element]
        for (index = 0; index < elements.length; index++) { 
            elements[index].classList.add('open');
        } 
    };

    $rootScope.closeLeftSideNav = function() {
        // opens the main, left-side navigation pane
        $scope.scratch.left_side_nav_open = false;
        var left_element = document.getElementById('leftSideNav');
        var right_element = document.getElementById('leftSideNavUnderlay');
        var elements = [left_element, right_element]
        for (index = 0; index < elements.length; index++) { 
            elements[index].classList.remove('open');
        } 
    };


    //
    // form emulation!
    //

    // post a form to the legacy webapp (useful for buttons that you
    // want to behave like a form
    $scope.postForm = function(action, asset_id) {

        var form = document.createElement("form");
        form.method = "POST";
        form.action = "/";

        var a_input = document.createElement("input");

        a_input.name = action;
        a_input.value =  asset_id;
        a_input.classList.add('hidden');
        form.appendChild(a_input);

        document.body.appendChild(form);
        form.submit();
    };

    // signs the user out of the legacy webapp; call this anywhere instead of
    // making an actual HTML form in the templates, which is super lame
    $scope.signOut = function() {

        console.warn('Signing out...');

        var form = document.createElement("form");
        form.method = "POST";
        form.action = "/";

        var a_input = document.createElement("input");
        a_input.name = 'remove_session';
        a_input.value =  $rootScope.current_session;
        a_input.classList.add('hidden');
        form.appendChild(a_input);

        var b_input = document.createElement("input");
        b_input.name = 'login';
        b_input.value =  $scope.user_login;
        b_input.classList.add('hidden');
        form.appendChild(a_input);

        document.body.appendChild(form);
        form.submit();
    };


    $scope.legacySignOut = function(session_oid) {;
        console.warn("Attempting legacy sign-out...");

        // signs into the legacy webapp by emulating a form POST
        var form = document.createElement("form");
        form.method = "POST";
        form.action = "/";

        var rm = document.createElement("input");

        rm.name = 'remove_session';
        rm.value =  session_oid;
        rm.classList.add('hidden');
        form.appendChild(rm);

        document.body.appendChild(form);
        form.submit();
    }

    //
    //  browsing and navigation helpers
    //
    $scope.loadURL = function(destination) {
       // allows us to use ng-click to re-direct to URLs
        window.location = destination;
    };


    //
    // various methods below here
    //

    $scope.initWorld = function() {

        setInterval( function init() {

            console.time('initWorld()');          
            $scope.showCornerLoader();

            var world_url = $scope.api_url + "world";
            $http.get(world_url).then(
                function(result) {
                    $scope.world = result.data.world;
                    $scope.hideCornerLoader();
                    console.log('[WORLD] Retrieved data successfully!')
                    console.timeEnd('initWorld()');
                }
            );

            return init;
            }(), 180000)

    };


    $scope.getNewSettlementAssets = function() {
        console.time('getNewSettlementAssets()')
        $http.get($scope.api_url + 'game_asset/settlements').then(
            function(payload) {
                $scope.hideFullPageLoader();
                $scope.new_settlement_assets = payload.data;
                $scope.showLoader = false;
                console.timeEnd('getNewSettlementAssets()');
            },
            function(errorPayload) {
                console.log("Error loading new settlement assets!" + errorPayload);
            }
        );
    };

    $scope.getSettlement = function(s_dict, dest, context){
        // pass in a string of a settlement OID to push a settlement onto array
        // 'dest'

        console.time('getSettlement(' + s_dict['name'] + ', ' + context + ')');
        $scope.showCornerLoader();
        var config = {"headers": {"Authorization": $scope.jwt, 'API-Key': $scope.api_key}};

        var s_id = s_dict._id.$oid;
        var s_json = {sheet: s_dict};

        // push the bogus/partial settlement into the dest array and get its index
        dest.push(s_json);
        var s_index = dest.indexOf(s_json);

        // now spin off a job to get the rest of the settlement info and update
        var settlement_url = $scope.api_url + 'settlement/get_summary/' + s_id; 
        $http.get(settlement_url, config).then(
            function(payload) {
//                dest.push(payload.data);
                dest[s_index] = payload.data;
                $scope.scratch.settlementsRetrieved += 1;
                console.timeEnd('getSettlement(' + s_dict['name'] + ', ' + context + ')');
                $scope.hideCornerLoader();
            },
            function(errorPayload) {
                console.error("[rootController.getSettlement()] Could not get settlement " + s_id);
                console.error(errorPayload);
                var err_msg = 'Could not load settlement ' + s_id + '!<hr/>' + errorPayload.data + '<hr/>Please report this error!';
                $scope.showAPIerrorModal(err_msg, settlement_url, true);
            }
        );
    };

    $scope.initializeUser = function(u_id, user_endpoint, api_url){
        // initialize
        console.time('initializeUser()');
        if ($scope.user_id === undefined && u_id !== undefined) {
            $scope.user_id = u_id;
        }
        if (user_endpoint === undefined){
            user_endpoint = 'get';
        };
        if ($scope.api_url === undefined && api_url !== undefined) {
            $scope.api_url = api_url;
        };

        console.log("[USER] Initializing user " + $scope.user_id);

        $scope.userPromise = $scope.getJSONfromAPI('user', user_endpoint, 'initializeUser()')

        $scope.userPromise.then(function(payload) {
            $scope.user = payload.data;
            $scope.user_login = $scope.user.user.login;
            console.timeEnd('initializeUser()');

            // if we're doing the dash, we've got to get settlements and fiddle
            // the UI for new users

            if (user_endpoint === 'dashboard') {
                console.log("[USER] Retrieving campaign assets from API...");
                $scope.initWorld();

                // loading stuff ui/ux
                $scope.scratch.settlementsRequired = $scope.user.dashboard.campaigns.length + $scope.user.dashboard.settlements.length;

                $scope.campaigns = [];
                for (var i = 0; i < $scope.user.dashboard.campaigns.length; i++) {
                    var s_dict = $scope.user.dashboard.campaigns[i];
                    $scope.getSettlement(s_dict, $scope.campaigns, 'campaign');
                };

                $scope.settlements = [];
                for (var i = 0; i < $scope.user.dashboard.settlements.length; i++) {
                    var s_dict = $scope.user.dashboard.settlements[i];
                    $scope.getSettlement(s_dict, $scope.settlements, 'settlement');
                };

                if ($scope.user.dashboard.settlements.length === 0) {
                    $scope.rollUp('campaignsDiv');   // this will hide it, because it's visible on-load
                    $scope.rollUp('settlementsDiv');
                } else {
                    // pass
                };
            }; //end of dashboard stuff

            var notifications_url = 'get/notifications';
            console.time(notifications_url);
            $http.get($scope.api_url + notifications_url).then(
                function(result){
                    $scope.webappAlerts = result.data;
                    console.timeEnd(notifications_url);
                    var arrayLength = $scope.webappAlerts.length;
                    for (var i = 0; i < arrayLength; i++) {
                        if ($scope.webappAlerts[i].sub_type=='kpi') {$scope.activeKPI = true};
                    };
                },
                function(result){console.error('Could not retrieve webapp alerts!');}
            );

        },
        function(errorPayload) {
            console.error("[USER] Could not retrieve user information!");
            console.error("[USER] " + errorPayload.status + " -> " + errorPayload.data);
            var err_msg = "User info could not be retrieved!";
            $scope.showAPIerrorModal(err_msg);

		}
    );


    // now do stuff that we need the settlement to do
    if ($scope.settlementPromise !== undefined) {
        $scope.settlementPromise.then(function() {
            $scope.userPromise.then(function() {
                // determine if the user is a settlement admin
                if ($scope.settlement.sheet.admins.indexOf($scope.user_login) == -1) {
                    $scope.user_is_settlement_admin = false;
                    console.error($scope.user_login + ' is not a settlement admin.');
                } else {
                    $scope.user_is_settlement_admin = true;
                    console.warn($scope.user_login + ' is a settlement admin!');
                };
                console.info('Subscriber level: ' + $scope.user.user.subscriber.level);
            });
        });
    };

};

    // once $scope.user is set, use this to load friends, if not loaded already
    $scope.loadUserFriends = function(){
        console.time('loadUserFriends()');
        $scope.getJSONfromAPI('user', 'get_friends', 'survivor_sheet').then(
            function(payload) {
                $scope.user.friends = payload.data;
                console.timeEnd('loadUserFriends()');
            },
            function(errorPayload) {
                console.error("Could not retrieve friends list!");
                console.error(errorPayload);
            }
       );
    };

    $scope.initializeSettlement = function(src_view, api_url, settlement_id) {

        // every view in the legacy webapp has to call this method. Therefore,
        // it's got lots of twists, turns, evaluations, etc. and can make a lot
        // of API requests.

        // intialize
        console.time('initializeSettlement()');
        if ($scope.api_url === undefined && api_url !== undefined) {
            $scope.api_url = api_url;
        };
        if ($scope.settlement_id === undefined && settlement_id !== undefined) {
            $scope.settlement_id = settlement_id;
        };
        if ($scope.view === undefined && src_view !== undefined) {
            $scope.view = src_view;
        };

        // if we still have no settlement ID in scope, die
        if ($scope.settlement_id === undefined) {
            console.error('$scope.api_url = ' + $scope.api_url);
            console.error('$scope.settlement_id = ' + $scope.settlement_id);
            console.error('$scope.survivor_id = ' + $scope.survivor_id);
            throw 'No settlement ID in scope! Cannot initialize settlement...';
        };

        // initialize misc. scope elements
        $rootScope.departing_survivor_count = 0;
        $rootScope.hideControls = true;

        // now do it
        console.log("[SETTLEMENT] Initializing " + $scope.settlement_id + " '"+ $scope.view + "' view...");
        if ($scope.settlement_id !== undefined) {

            var settlement_endpoint = 'get'
            if ($scope.view === 'campaignSummary') {
                settlement_endpoint = 'get_campaign';
            };

            // save the promise to get the settlement to the $scope
            $scope.settlementPromise = $scope.getJSONfromAPI(
                'settlement', settlement_endpoint, 'initializeSettlement()'
            );

            // init the settlement
            $scope.settlementPromise.then(
                function(payload) {
                    // get the settlement; touch-up some of the arrays for UI/UX purposes
                    $scope.settlement = payload.data;

                    // finish initializing the settlement
                    $rootScope.hideControls = false; 
//                    $scope.postJSONtoAPI('settlement', 'set_last_accessed', {}, false, false, false);

                    console.timeEnd('initializeSettlement()');

                },
                function(errorPayload) {
                    console.error($scope.log_level + "Error loading settlement!" + errorPayload);
                    var err_msg = "An unrecoverable API error prevented this campaign from being retrieved!";
                    $scope.showAPIerrorModal(
                        err_msg,
                        $scope.settlementPromise.$$state.value.config.url,
                        true
                    );
                }
            );

        };

        // if we're viewing the Settlement Sheet or Campaign Summary, do this stuff
        $scope.settlementPromise.then(function() {
            if ($scope.view == 'settlementSheet') {
                $scope.initAssetLists();
                $scope.hideFullPageLoader();
                $scope.hideCornerLoader();
            } else if ($scope.view == 'campaignSummary') {;
                $scope.hideFullPageLoader();
                $scope.hideCornerLoader();
            } else if ($scope.view == 'survivorSheet') {
                // random names
                $scope.randomNamesPromise = $http.get(api_url + 'get_random_names/200');
                $scope.randomNamesPromise.then(function(payload) {
                    $scope.randomSurvivorNames = payload.data;
                });

                // random surnames
                $scope.randomSurnamesPromise = $http.get(api_url + 'get_random_surnames/50');
                $scope.randomSurnamesPromise.then(function(payload) {
                    $scope.randomSurnames = payload.data;
                });

                if ($scope.survivorPromise != undefined) { 
                    $scope.survivorPromise.then(function() {
                        $scope.hideFullPageLoader();
                        $scope.hideCornerLoader();
                    });
                };
            };
        });
    }


    $scope.reinitialize = function(caller) {

        //postJSONtoAPI() sometimes calls this to refresh the view after a
        // significant update.

        if (caller === undefined) {
            console.warn("Re-initializing view...");
        } else {
            console.warn(caller + " method wants to reinitialize the view...");
        };
        $scope.showCornerLoader();
        if ($scope.view === 'survivorSheet') {
            $scope.initializeSurvivor();
        } else if ($scope.view === 'settlementSheet') {
            $scope.initializeSettlement(); 
        } else if ($scope.view === 'campaignSummary') {
            $scope.initializeSettlement(); 
        } else {
            console.error($scope.view + ' cannot be reinitialized!');
        };
    };



    $scope.initializeSurvivor = function(s_id) {
        // pulls a specific survivor down from the API and sets it as
        // $scope.survivor; also sets some other helpful $scope vars

        console.time('initializeSurvivor()');

        // initialize
        if ($scope.survivor_id === undefined) {
            $scope.survivor_id = s_id;
        };

        // wait for the settlement promise and then go get it, girl
        $scope.settlementPromise.then(function() {

            console.info("Initializing Survivor " + $scope.survivor_id);
            $scope.survivorPromise = $scope.getJSONfromAPI('survivor','get', 'initializeSurvivor()');

            $scope.survivorPromise.then(
                function(payload) {
                    $scope.survivor = payload.data;
//                    console.warn($scope.survivor);
                    $scope.survivorBaseName = $scope.survivor.sheet.name;
//                    console.warn("Base name is: " + $scope.survivorBaseName);
                    $scope.hideFullPageLoader();
                    $scope.hideCornerLoader();
                    console.timeEnd('initializeSurvivor()');

                    // now do stuff after we drop the loader
                    $scope.initAssetLists();

                    //lineage first
                    console.time('$scope.lineage');
                    console.log("[LINEAGE] Retrieving survivor lineage data... ");
                    $scope.getJSONfromAPI('survivor','get_lineage','initializeSurvivor()').then(
                        function(payload) {
                            $scope.lineage = payload.data;
                            console.log('[LINEAGE] Lineage retrieved!');
                            console.timeEnd('$scope.lineage');
                        },
                        function(errorPayload) {
                            console.error("[LINEAGE] Could not retrieve survivor lineage from API!" + errorPayload);
                        }
                    );
                },
                function(errorPayload) {
                    console.log("[SURVIVOR] Error loading survivor " + s_id + " " + errorPayload);
                }
            );
        });
    };

    //  root-level timeline helper methods

    $scope.getTimelineLY = function(target_ly) {
        // generic get method: returns a dict repr of a timeline LY
        // (or however you would say that in javascript)

        var target_ly_repr = null;
        for (var i = 0; i < $scope.settlement.sheet.timeline.length; i++) {
            var lantern_year = $scope.settlement.sheet.timeline[i]
            if (lantern_year.year === target_ly) {
                target_ly_repr = lantern_year;
            };
        };
        return target_ly_repr;
    };

    $scope.setCurrentLY = function(new_ly) {
        if (new_ly === $scope.settlement.sheet.lantern_year) {
            return true; 
        } else {
            $scope.postJSONtoAPI('settlement','set_current_lantern_year',{ly: new_ly},false);
            $scope.settlement.sheet.lantern_year = new_ly;
        };
    };


    // game asset init and set stuff

    $scope.setGameAssetOptions = function(game_asset, destination, exclude_type) {
        // generic method to create a set of options by comparing a baseline
        // list to a list of items to exclude from that list
        // 'game_asset' wants to be something from settlement.game_assets
        // 'user_asset' wants to be a user's list, e.g. $scope.survivor.sheet.epithets
        // 'destination' wants to be the output, e.g. $scope.locationOptions

        console.time("setGameAssetOptions(" + game_asset + ", " + destination + ", " + exclude_type +")");

        // initialize
        console.log("Refreshing '" + game_asset + "' game asset options...");
        if ($scope.view == 'survivorSheet') {
            var user_asset = $scope.survivor.sheet;
        } else if ($scope.view == 'settlementSheet') {
            var user_asset = $scope.settlement.sheet;
        } else {
            console.error('I DO NOT KNOW HOW TO SET ASSETS FOR THIS VIEW!');
            return false
        };

        // now do it!
        var output = {};
        angular.copy($scope.settlement.game_assets[game_asset], output);
        for (var i = 0; i < user_asset[game_asset].length; i++) {
            var a = user_asset[game_asset][i];

            if (output[a] != undefined) {
                if (output[a].max != undefined) {
                    var asset_max = output[a].max;
                    var asset_count = 0;
                    for (var j = 0; j < user_asset[game_asset].length; j++) {
                        if (user_asset[game_asset][j] == a) {asset_count += 1};
                    };
                    if (asset_count >= asset_max) {
                        delete output[a];
                    };
                } else {
                    delete output[a];
                };
            };
        };

        // filter anything whose 'type' matches exclude_type
        for (var b in output) {
            if (output[b].sub_type == exclude_type) {
                delete output[b];
            };
        };

        for (var c in output) {
            if (output[c].selectable == false) {
                delete output[c];
            };
        };

        $scope[destination] = output;
        console.log("Game asset '" + game_asset + "' options updated!");
        console.timeEnd("setGameAssetOptions(" + game_asset + ", " + destination + ", " + exclude_type +")");
    };


    $scope.initAssetLists = function() {
        // call this once you've got a settlement sheet in scope, i.e. hitch it to
        // the $scope.settlementPromise
        if ($scope.view == 'survivorSheet') {
            console.log('Initializing Survivor Sheet asset pickers...');

            $scope.setGameAssetOptions('abilities_and_impairments', "AIoptions", "curse");

            $scope.setGameAssetOptions('fighting_arts', "FAoptions");
            $scope.FAoptions["_random"]  = {handle: "_random", selector_text: "* Random Fighting Art", sub_type_pretty: "Special"};

            $scope.setGameAssetOptions('disorders', "dOptions");
            $scope.dOptions["_random"]  = {handle: "_random", selector_text: "* Random Disorder", sub_type_pretty: "Special"};

            $scope.setGameAssetOptions('tags', "epithetOptions");

            //  custom COD junk
            var cod_list = [];
            for (var i = 0; i < $scope.settlement.game_assets.causes_of_death.length; i++) {
                cod_list.push($scope.settlement.game_assets.causes_of_death[i]["name"]);
            };
            $scope.settlement_cod_list = cod_list;
        } else {
            console.log('Initializing Settlement Sheet asset pickers...');
            $scope.setGameAssetOptions('locations', "locationOptions");
            $scope.setGameAssetOptions('innovations', "innovationOptions", "principle");
        };
//       console.log("'" + view + "' view asset pickers initialized!")
    };



    $scope.set_jwt_from_cookie = function() {
        var cname = "jwt_token";
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
//        console.warn("Raw cookie:" + decodeURIComponent(document.cookie));
//        console.warn("Decoded cookie:" + decodedCookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf('session=') == 0) {
                $scope.session_oid = c.substring('session='.length, c.length);
            };
            if (c.indexOf(name) == 0) {
                $scope.jwt = c.substring(name.length, c.length);
                return true;
            };
        }
        console.error("Could not set JWT from cookie!");
        console.error("Session: " + $scope.session_oid);
        if ($scope.session_oid !== undefined) {
//            $scope.legacySignOut($scope.session_oid);
        };
        console.error("Bad cookie: " + decodedCookie);
        $scope.jwt = false;
        return false;
    };
    $scope.set_jwt_from_cookie();

    $scope.getJSONfromAPI = function(collection, action, requester) {

        // die if there is no JWT in $scope
        if (!$scope.jwt) {
            var err = 'No JWT in scope! Cannot getJSONfromAPI()';
            return Promise.reject(new Error(err));
        };

        var r_log_level = "[" + requester + "] "
//        console.log(r_log_level + "Retrieving '" + collection + "' asset '" + action + "' data from API:");
        if ($scope.api_url === undefined){console.error(r_log_level + '$scope.api_url is ' + $scope.api_url + '! API retrieval cannot proceed!'); return false};
        var config = {"headers": {"Authorization": $scope.jwt, 'API-Key': $scope.api_key}};
        if (collection == "settlement") {
            var url = $scope.api_url + "settlement/" + action + "/" + $scope.settlement_id;
        } else if (collection == "survivor") {
            var url = $scope.api_url + "survivor/" + action + "/" + $scope.survivor_id;
        } else if (collection == "user") {
            var url = $scope.api_url + "user/" + action + "/" + $scope.user_id;
        } else if (collection == "game_assets") {
            var url = $scope.api_url + 'game_assets/' + action;
        };
        console.log(r_log_level + "getJSONfromAPI() -> " + url);
        return $http.get(url, config);
    };

    $scope.postJSONtoAPI = function(collection, action, json_obj, reinit, show_alert, update_sheet) {
        // reinit defaults to true;
        // show_alert defaults to true;
        // update_sheet defaults to false;
        console.time('postJSONtoAPI(' + collection + ', ' + action + ')');
        if (reinit === undefined) {reinit = true};
        if (show_alert === undefined) {show_alert = true};

        // always serialize on response, regardless of asset type
        json_obj.serialize_on_response = true;

        if (show_alert === true) {
            $scope.showCornerLoader();
        };

        // figure out which asset ID to use
        if (collection == 'settlement') {
            var asset_id = $scope.settlement_id;
        } else if (collection == 'survivor') {
            var asset_id = $scope.survivor_id;
            if (asset_id === undefined) {asset_id = $rootScope.survivor_id};
        } else if (collection == 'user') {
            var asset_id = $scope.user_id;
        } else {
            console.error("Collection '" + collection + "' is not supported by postJSONtoAPI method!");  
            $scope.errorAlert();
            return false;
        };

        // get auth header
        var config = {
            "headers": {
                "Authorization": $scope.jwt,
                "API-Key": $scope.api_key,
            }
        };

        // create the URL and do the POST
        var endpoint = collection + "/" + action + "/" + asset_id;
        var url = $scope.api_url + endpoint;
        var res = $http.post(url, json_obj, config);

        res.success(function(data, status, headers, config) {
            console.warn("postJSONtoAPI(/'" + endpoint + "') call successful!");
            console.timeEnd('postJSONtoAPI(' + collection + ', ' + action + ')');
            if (update_sheet === true) {
                console.warn('Updating ' + collection + ' sheet from response!');
                $scope[collection] = data;
            };
            if (show_alert === true) {$rootScope.savedAlert()};
            sleep(1000).then(() => {
                if (reinit === true) {
                    $scope.reinitialize('postJSONtoAPI(/' + endpoint + ')')
                };
            });
            $scope.hideCornerLoader();
        });
        res.error(function(data, status, headers, config) {
            $scope.errorAlert();
            console.error("postJSONtoAPI('" + endpoint + "') call has FAILED!!!");
            console.error(data);
            $scope.showAPIerrorModal(data, config.url);
            $scope.hideCornerLoader();
        });

        return res;
    };




    // front-end helper method that sets the scope's story and settlement events
    $scope.setEvents = function() {
        console.time('setEvents()');
        var all_events = $scope.settlement.game_assets.events;

        $scope.story_events = new Array();
        $scope.settlement_events = new Array();


        for (var property in all_events) {
            if (all_events.hasOwnProperty(property)) {
                var e = all_events[property];
                if (e.type == 'story_event') {
                    $scope.story_events.push(e);
                } else if (e.type == 'settlement_event') {
                    $scope.settlement_events.push(e)
                };
            };
        };

        $scope.story_events.sort(compare);
        $scope.settlement_events.sort(compare);

        console.log("Initialized " + $scope.story_events.length + " story events and " + $scope.settlement_events.length + " settlement events!");
        console.timeEnd('setEvents()');

    };


    // helpers and laziness - junk drawer functions
    $scope.isObject = function(a) {return typeof a === 'object';};

    $scope.range  = function(count,command) {
        var r = [];
        for (var i = 0; i < count; i++) {
            if (command=='increment') {
                r.push(i+1)
            } else {
                r.push(i) 
            };
        }
        return r;
    };

    $scope.hasattr = function(obj, name) {
        if (obj === undefined) {console.error("hasattr() called against undefined object. '" + name + "' cannot be an attribute of am undefined object.");};
        if (obj.indexOf(name) > -1) {
            return true
        };
        return false;
    };

    $scope.arrayContains = function(needle, arrhaystack) {
        if (arrhaystack === undefined) {console.warn("Cannot find " + needle + " in undefined!"); return false;};
        if (typeof arrhaystack != "array") {
            if (typeof arrhaystack == "object") {
            } else {
                console.warn(arrhaystack + ' does not appear to be an array or an object!')
            };
        };
        if (arrhaystack.indexOf(needle) > -1) {
            return true;
        };
        return false; 
    };


    //
    // methods used by survivor sheet and campaign summary views!
    //

    $scope.setBleedingTokens = function(s) {
        // uses the survivor sheet to POST to the API
        if (!s.sheet.bleeding_tokens) {
            console.warn('Setting Bleeding tokens to 0...')
            s.sheet.bleeding_tokens = 0;
        };

        $rootScope.survivor_id = s.sheet._id.$oid;
        var res = $scope.postJSONtoAPI(
            'survivor',
            'set_bleeding_tokens',
            {value: s.sheet.bleeding_tokens},
            false
        );
        console.time('setBleedingTokens')
        res.then(
            function(payload) {
                console.timeEnd('setBleedingTokens')
            },
            function(errorPayload){
                console.error('Could not set Bleeding Tokens!');
                console.error(errorPayload);
                console.timeEnd('setBleedingTokens')
            }
        );
    };

    $scope.setSurvivorPrimaryAttributes = function(s, attrib){
		// pass in a survivor object and the name of a primary attribute (Movement, etc.)
		// to update it. Should work from anywhere
        $rootScope.survivor_id = s.sheet._id.$oid;
        json_obj = {
            attributes: [{attribute: attrib, value: s.sheet[attrib]}],
            attribute_details: [
                {attribute: attrib, detail: 'tokens', value: s.sheet.attribute_detail[attrib].tokens },
                {attribute: attrib, detail: 'gear', value: s.sheet.attribute_detail[attrib].gear },
            ],
        };
        var res = $scope.postJSONtoAPI('survivor', 'set_many_attributes', json_obj, false, true, true);
    };

    $scope.setSwordOath = function(s) {
        // uses the survivor sheet to POST to the API
        var sword = s.sheet.sword_oath.sword;
        var wounds = s.sheet.sword_oath.wounds;
        var dict = {
            'sword': sword,
            'wounds': wounds
        }

        // hack city!
        $rootScope.survivor_id = s.sheet._id.$oid;
        var res = $scope.postJSONtoAPI('survivor', 'set_sword_oath', dict, false);
        console.time('setSwordOath')
        res.then(
            function(payload) {
                console.timeEnd('setSwordOath')
            },
            function(errorPayload){
                console.error('Could not set Sword Oath!');
                console.error(errorPayload);
                console.timeEnd('setSwordOath')
            }
        );
    };

    $scope.loadVignetteSurvivors = function() {
        // retrieves available vignette survivors from the API; sets them to
        // $scope.vignetteSurvivors and also sets the $scope.vignetteExpansions
        // element, which can help with display

        var promise = $scope.getJSONfromAPI(
            'game_assets',
            'survivors',
            'loadVignetteSurvivors()'
        );
        promise.then(
            function(payload) {
                $scope.vignetteExpansions = new Set();
                for (const [handle, dict] of Object.entries(payload.data)) {
                    $scope.vignetteExpansions.add(dict.expansion);
                };
                $scope.vignetteExpansions = Array.from($scope.vignetteExpansions);
                $scope.vignetteSurvivors = payload.data;
            },
            function(errorPayload) {
                console.error("Error retrieving vignette survivors!");
            }
        );
    };


    $scope.addVignetteSurvivor = function(survivorHandle) {
        // POSTs a handle to the API's add_survivor endpoint
        $scope.showFullPageLoader();
        var promise = $scope.postJSONtoAPI(
            'settlement',
            'add_survivor',
            {handle: survivorHandle},
            true,
            true,
            true
        );
        promise.then(
            function(payload) {
                console.info('Added Vignette survivor!')
            },
            function(errorPayload) {
                console.error("Failed to add Vignette Survivor!");
            }
        );
    };

});


//  common and shared angularjs controllers. These controllers are used by
//  more than one (usually all) User Asset views. check out the assets.py
//  ua_decorator() method: it basically suffixes our main user asset views
//  with HTML that calls these controllers

app.controller("updateExpansionsController", function($scope) {
    if ($scope.scratch === undefined) {
        $scope.scratch= {}
    };
    $scope.scratch['expansions_updated'] = false; 
    $scope.toggleExpansion = function(e_handle, index) {
        // figure out if its mandatory
        var mandatoryExpansion = false;
        if ($scope.settlement.game_assets.campaign.settlement_sheet_init.expansions != undefined) {
            if ($scope.settlement.game_assets.campaign.settlement_sheet_init.expansions.indexOf(e_handle) != -1){
                mandatoryExpansion = true;
            };
        };

        // bail verbosely if it is mandatory
        if (mandatoryExpansion === true) {
            var campaign_name = $scope.settlement.game_assets.campaign.name;
            var e_name = $scope.settlement.game_assets.expansions[e_handle].name;
            var err_msg = "The " + e_name + " expansion is required by the " + campaign_name + " campaign and may not be removed!";
            console.error(err_msg);
            window.alert(err_msg);
            return false;
        };

        // otherwise, lock and load (or unload)
        $scope.scratch['expansions_updated'] = true;
//        console.error('updated: ' + $scope.scratch.expansions_updated);
        if ($scope.settlement.sheet.expansions.indexOf(e_handle) === -1) {
            $scope.settlement.sheet.expansions.push(e_handle);
            $scope.postJSONtoAPI('settlement', 'add_expansions', {'expansions': [e_handle]}, false,true,true);
        } else {
            $scope.settlement.sheet.expansions.splice(index,1);
            $scope.scratch['expansion_removed'] = true;
            $scope.postJSONtoAPI('settlement', 'rm_expansions', {'expansions': [e_handle]}, false,true,true);
        };
    };
});

app.controller('newSurvivorController', function($scope, $http) {
    if ($scope.scratch === undefined) {
        $scope.scratch = {}
    };
    $scope.scratch.newSurvivorsCreated = 0;
    $scope.scratch.newSurvivorSheets = [];
    $scope.scratch.newSurvivorSex = 'M';
    $scope.scratch.primaryDonor = 'father';
    $scope.scratch.newSurvivorPublic = false;
    $scope.toggleSex = function() {
        if ($scope.scratch.newSurvivorSex === 'M'){
            $scope.scratch.newSurvivorSex = 'F';
        } else if ($scope.scratch.newSurvivorSex === 'F') {
            $scope.scratch.newSurvivorSex = 'R';
        } else if ($scope.scratch.newSurvivorSex === 'R') {
            $scope.scratch.newSurvivorSex = 'M';
        };
    };
    $scope.toggleDonor = function() {
        if ($scope.scratch.primaryDonor === 'father'){
            $scope.scratch.primaryDonor = 'mother';
        } else {
            $scope.scratch.primaryDonor = 'father';
        }; 
    };

    $scope.setAvatar = function(e) {
        // uses the custom-on-change directive to convert the file to a str for
        // POSTing back to the API when the user pulls the trigger
        var reader = new FileReader();
        reader.readAsBinaryString(e.target.files[0]);
        reader.onload = function () {
            $scope.scratch.newSurvivorAvatar = btoa(reader.result);
        };
    };

    $scope.setNewSurvivorName = function() {
        var newName = document.getElementById('newSurvivorName').innerHTML;
        $scope.scratch.newSurvivorName = newName;
        if (newName === "") {
            $scope.scratch.newSurvivorName = undefined;
        };
    };

    $scope.createNewSurvivor = function() {
        // in which we fire some JSON at the API and attempt to make a new
        // survivor and show it to the user

        // 1.) start the clock, show the loader
        console.time('createNewSurvivor()');
        $scope.ngShow('newSurvivorCreationLoader')

        // 2.) create the POST body
        var json_post = {
            settlement: $scope.settlement.sheet._id.$oid,
            name: $scope.scratch.newSurvivorName,
            sex: $scope.scratch.newSurvivorSex,
            avatar: $scope.scratch.newSurvivorAvatar,
            father: $scope.scratch.newSurvivorFather,
            mother: $scope.scratch.newSurvivorMother,
            primary_donor_parent: $scope.scratch.primaryDonor,
            email: $scope.scratch.newSurvivorEmail,
            'public': $scope.scratch.newSurvivorPublic, 
        }
//        console.warn(json_post);

        // 3.) create a promise for the post operation
        var config = {"headers": {"Authorization": $scope.jwt}};
        var res = $http.post(
            $scope.api_url + "new/survivor",
            json_post,
            config
        );

        // 4.) process the result, closing the loader and, if successful,
        // showing the new survivor link box, whose innerHTML we'll fiddle
        res.then(
            function(payload) {
                $scope.newSurvivorData = payload.data;
                $scope.scratch.newSurvivorsCreated += 1;

                var sheet = $scope.newSurvivorData.sheet;
                $scope.scratch.newSurvivorSheets.push(sheet);
   
                // clear the fields, i.e. so we don't repeat stuff
                $scope.scratch.newSurvivorAvatar = undefined;
                $scope.scratch.newSurvivorName = undefined;

                // wrap up, close up 
                console.timeEnd('createNewSurvivor()');
                $scope.ngHide('newSurvivorCreationLoader');

                // re-init the view
                $scope.reinitialize('createNewSurvivor()');

            },
            function(errorPayload) {
                console.timeEnd('createNewSurvivor()');
                $scope.ngHide('newSurvivorCreationLoader');

                $scope.errorAlert();

                $scope.ngShowHide('newSurvivorCreationFailure');
                var userSafeError = "status: " + errorPayload.status + "<br/>data: " + errorPayload.data + "<br/>JSON: " + JSON.stringify(errorPayload.config.data);
                document.getElementById("newSurvivorCreationFailureMessage").innerHTML = userSafeError;

                console.error("Failed to create new Survivor!");
                console.error(errorPayload);

                $scope.ngShowHide('newSurvivorCreationControls')
            }
        );
    };

}); 


app.controller('playerManagementController', function($scope) {
    $scope.toggleAdmin = function(login) {
        var login_index = $scope.settlement.sheet.admins.indexOf(login);
        if (login_index == -1) {
            // user is not an admin
            $scope.settlement.sheet.admins.push(login);
            $scope.postJSONtoAPI('settlement','add_admin',{'login': login}, false)
        } else {
            // user is an admin
            $scope.settlement.sheet.admins.splice(login_index, 1);
            $scope.postJSONtoAPI('settlement','rm_admin',{'login': login}, false)
        };
    };
});



app.controller('eventLogController', function($scope) {
    $scope.eventLog = {}
    $scope.getEventLogLY = function(ly) {
        console.time('getEventLogLY(' + ly + ')');
        console.log('[EVENT LOG] Initializing event log...');
        $scope.postJSONtoAPI('settlement','get_event_log', {ly: ly}, false, false, false).then(
            function(payload) {
                $scope.eventLog[ly] = payload.data;
                console.timeEnd('getEventLogLY(' + ly + ')');
            },
            function(errorPayload) {
                console.log($scope.log_level + "Error retrieving Event Log!" + errorPayload);
            }
        );
    };
});



app.controller('timelineController', function($scope) {

    $scope.setEventOptions = function() {
        // iterates through the settlement.game_assets.events dictionary and
        // injects some new items into $scope that, in turn, may be iterated
        // by the HTML to create drop-down options for adding events to the TL

        console.time('setEventOptions()');

        $scope.showdownOptions = $scope.settlement.game_assets.showdown_options;
        $scope.specialShowdownOptions = $scope.settlement.game_assets.special_showdown_options;
        $scope.nemesisEncounterOptions = $scope.settlement.game_assets.nemesis_encounters;
        $scope.storyEventOptions = {};
        $scope.settlementEventOptions = {};
        angular.forEach($scope.settlement.game_assets.events, function(item) {
            if (item.sub_type === 'story_event') {
                $scope.storyEventOptions[item.handle] = item;
            } else if (item.sub_type == 'settlement_event') {
                $scope.settlementEventOptions[item.handle] = item;
            };
        });
        console.timeEnd('setEventOptions()');
    };


    $scope.updateLanternYear = function(ly) {
        $scope.postJSONtoAPI('settlement','set_lantern_year',{ly:ly},false);
    };

    $scope.addEventToLY = function(ly, event_group, type, value) {
        if (ly[event_group] === undefined) {
            ly[event_group] = [];
        };
        var target_event_group = ly[event_group];
        if (type === 'handle') {
            target_event_group.push({handle: value});
        } else if (type === 'name') {
            target_event_group.push({name: value});
        } else {
            console.error("Unable to add '" + type + "' type event to Timeline.");
        };
//        console.warn(ly);
    };
    $scope.rmEventFromLY = function(event_group, event_index) {
        event_group.splice(event_index, 1);
    };
    $scope.getEventRepr = function(e) {
        if (e.name != undefined) {return e};
        return $scope.settlement.game_assets.events[e.handle];
    };
    $scope.addLanternYears = function(n) {
        var op = $scope.postJSONtoAPI('settlement','add_lantern_years',{years: n},false);
        op.then(
            function(payload) {$scope.reloadTimeline();},
            function(errorPayload) {}
        );
    };
    $scope.rmLanternYears = function(n) {
        var op = $scope.postJSONtoAPI('settlement','rm_lantern_years',{years: n},false);
        op.then(
            function(payload) {$scope.reloadTimeline();},
            function(errorPayload) {}
        );
    };
    $scope.reloadTimeline = function() {
        console.time('reloadTimeline()');
        $scope.showCornerLoader();
        var tl = $scope.getJSONfromAPI('settlement', 'get_timeline', 'reloadTimeline()');
        tl.then(
            function(payload) {
                $scope.settlement.sheet.timeline = payload.data;
                console.timeEnd('reloadTimeline()');
                $scope.hideCornerLoader();
            },
            function(errorPayload) {console.log("Error reloading settlement Timeline!" + errorPayload);}
        );
    };
});



//          angularjs controllers start here.

// all angularjs apps use this, so it needs to stay generic. at a minimum,
// an angularjs scope needs to know the following. survivor stuff is NOT handled
// here because angularjs apps that deal with survivors are necessarily
// specialized

app.controller("epithetController", function($scope) {
    $scope.epithets = [];
    $scope.formData = {};
    $scope.addItem = function (asset_id) {
        $scope.errortext = "";
        if (!$scope.addMe) {return;}
        if ($scope.epithets.indexOf($scope.addMe) == -1) {
            $scope.epithets.push($scope.addMe);
        } else {
            $scope.errortext = "The epithet has already been added!";
        };


        var http = new XMLHttpRequest();
        http.open("POST", "/", true);
        http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        var add_name = $scope.addMe.name;
        if (add_name == undefined) {var add_name = $scope.addMe};
        var params = "add_epithet=" + add_name + "&modify=survivor&asset_id=" + asset_id
        http.send(params);

        $scope.savedAlert();

    }
    $scope.removeItem = function (x, asset_id) {
        $scope.errortext = "";
        var removedEpithet = $scope.epithets[x];
        $scope.epithets.splice(x, 1);
        var http = new XMLHttpRequest();
        http.open("POST", "/", true);
        http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        var rm_name = removedEpithet.name;
        if (rm_name == undefined) {var rm_name = removedEpithet};
        var params = "remove_epithet=" + rm_name + "&modify=survivor&asset_id=" + asset_id;
        http.send(params);

        $scope.savedAlert();

    }
});



// close modal windows from a span
function closeModal(modal_div_id) {
    var modal = document.getElementById(modal_div_id);
    modal.style.display = "none";
}

function increment(elem_id) {
    var e = document.getElementById(elem_id);
    e.stepUp();
}
function decrement(elem_id) {
    var e = document.getElementById(elem_id);
    e.stepDown();
}


// Used to sort arrays of objects by name. Should be a lambda or something
// but FIWE. Maybe when I'm older
function compare(a,b) {
  if (a.name < b.name)
    return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}



// User update methods.

app.controller('addManySurvivorsController', function($scope, $http) {
    $scope.scratch = {
        'manySurvivorsFather': undefined,
        'manySurvivorsMother': undefined,
        'addMaleSurvivors': 0,
        'addFemaleSurvivors': 0,
    };

    $scope.addManySurvivors = function() {
        $scope.scratch.showLoader = true;
        var json_post = {
            male: $scope.scratch.addMaleSurvivors,
            female: $scope.scratch.addFemaleSurvivors,
            father: $scope.scratch.manySurvivorsFather,
            mother: $scope.scratch.manySurvivorsMother,
            settlement_id: $scope.settlement.sheet._id.$oid,
        }
//        console.warn(json_post);
        var config = {"headers": {"Authorization": $scope.jwt}};
        var res = $http.post(
            $scope.api_url + "new/survivors",
            json_post,
            config
        );

        res.success(function(data, status, headers, config) {
            console.warn("addManySurvivors() success!");
            $scope.scratch.bulkAddNewSurvivors = data;
            $scope.scratch.showLoader = false;
            $scope.reinitialize();
        });
        res.error(function(data, status, headers, config) {
            console.error(data);
        });
    };

})

app.controller("sideNavController", function($scope) {
    // feed it a survivor, this returns a bool of whether it's one of
    // the user's favorites. useful in lots of different scopes, hence
    // part of the root

    $scope.favoriteFilter = function(s) {
        var fav = false;
        if (s.sheet.favorite == undefined) {return false;}
        if (s.sheet.favorite.indexOf($scope.user_login) !== -1) {fav = true};
//        console.log($scope.user_login + " -> " + s.sheet.name + " fav: " + fav);
        if (s.sheet._id.$oid === $scope.survivor_id) {fav = false};
        if (s.sheet.dead === true) {fav = false};
        if (s.sheet.departing === true) {fav = false};  //exclude departing survivors
        return fav;
    };

    $scope.departingFilter = function(s)  {
        var dep = false;
        if (s.sheet.departing === true) {dep = true};
        return dep;
    };

    $scope.countSurvivors = function(type) {
        var survivors = 0;

        incrementFavorites = function(s, index) {
            if ($scope.favoriteFilter(s) === true) {survivors += 1};
        };
        incrementDeparting = function(s, index) {
            if ($scope.departingFilter(s) === true) {survivors += 1};
        };

        if ($scope.settlement !== undefined) {
            if (type === 'favorite') {
                $scope.settlement.user_assets.survivors.forEach(incrementFavorites);
            } else if (type === 'departing') {
                $scope.settlement.user_assets.survivors.forEach(incrementDeparting);
            };
        };
        return survivors;
    };


});



