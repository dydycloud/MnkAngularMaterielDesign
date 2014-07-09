angular.module("app", ["firebase", "ngMaterial", "ui.router", "myApp.config", "myApp.app.Ctrl", "myApp.left.Ctrl", "myApp.auth.factory"]);

angular.module("myApp.config", []).config([
  "$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/");
    return $stateProvider.state('home', {
      url: "/",
      templateUrl: "views/home.html",
      controller: 'AppCtrl'
    }).state('signin', {
      url: "/signin",
      templateUrl: "views/signin.html",
      controller: 'AppCtrl'
    }).state('signup', {
      url: "/signup",
      templateUrl: "views/signup.html",
      controller: 'AppCtrl'
    });
  }
]).constant("FIREBASE_URL", "https://mnklab.firebaseio.com/");

angular.module("myApp.auth.factory", []).factory("Auth", function($firebaseSimpleLogin, FIREBASE_URL, $rootScope) {
  var Auth, auth, ref;
  ref = new Firebase(FIREBASE_URL);
  auth = $firebaseSimpleLogin(ref);
  $rootScope.loader = false;
  $rootScope.logoutButon = "false";
  Auth = {
    register: function(user) {
      $rootScope.loader = true;
      return auth.$createUser(user.email, user.password).then(function() {
        return $rootScope.loader = false;
      });
    },
    signedIn: function() {
      return auth.user !== null;
    },
    login: function(user) {
      $rootScope.logoutButon = "true";
      $rootScope.userInfo = user.email;
      return auth.$login('password', user);
    },
    logout: function() {
      $rootScope.logoutButon = "false";
      $rootScope.userInfo = "";
      return auth.$logout();
    }
  };
  $rootScope.signedIn = function() {
    return Auth.signedIn();
  };
  return Auth;
});

angular.module("myApp.app.Ctrl", ["myApp.auth.factory"]).controller("AppCtrl", function($scope, $location, $timeout, $materialSidenav, Auth) {
  var leftNav;
  if (Auth.signedIn()) {
    $location.path("/");
  }
  leftNav = void 0;
  $timeout(function() {
    return leftNav = $materialSidenav("left");
  });
  $scope.$on("$firebaseSimpleLogin:login", function() {
    return $location.path("/");
  });
  $scope.toggleLeft = function() {
    return leftNav.toggle();
  };
  $scope.login = function() {
    $scope.loader = true;
    $scope.logoutButon = "true";
    return Auth.login($scope.user).then(function() {
      return $location.path("/");
    });
  };
  $scope.register = function() {
    return Auth.register($scope.user).then(function(authUser) {
      return $location.path("/signin");
    });
  };
  return $scope.logout = function() {
    $scope.loader = false;
    Auth.logout();
    return console.log($scope.user);
  };
});

angular.module("myApp.left.Ctrl", []).controller("LeftCtrl", function($scope, $timeout, $materialSidenav) {
  var nav;
  nav = void 0;
  $timeout(function() {
    return nav = $materialSidenav("left");
  });
  return $scope.close = function() {
    return nav.close();
  };
});
