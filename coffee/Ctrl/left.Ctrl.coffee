angular.module("myApp.left.Ctrl", [])
.controller "LeftCtrl", ($scope, $timeout, $materialSidenav) ->
  nav = undefined
  $timeout ->
    nav = $materialSidenav("left")

  $scope.close = ->
    nav.close()
