angular.module("myApp.app.Ctrl", ["myApp.auth.factory"])
.controller "AppCtrl", ($scope, $location, $timeout, $materialSidenav, Auth) ->
  $location.path "/"  if Auth.signedIn()
  leftNav = undefined
  $timeout ->
    leftNav = $materialSidenav("left")

  $scope.$on "$firebaseSimpleLogin:login", ->
    $location.path "/"

  $scope.toggleLeft = ->
    leftNav.toggle()

  $scope.login = ->
    Auth.login($scope.user).then ->
      $location.path "/"

  $scope.register = ->
    Auth.register($scope.user).then (authUser) ->
      $location.path "/signin"
 
  $scope.logout = ->
    Auth.logout()
    console.log $scope.user
