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
