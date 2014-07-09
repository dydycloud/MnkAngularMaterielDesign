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
