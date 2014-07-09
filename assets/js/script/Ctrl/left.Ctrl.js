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
