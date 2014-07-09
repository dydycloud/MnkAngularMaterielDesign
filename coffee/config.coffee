# Declare app level module which depends on filters, and services
angular.module "myApp.config", []

# establish authentication

# your Firebase URL goes here
# should look something like: https://blahblahblah.firebaseio.com
.config([
  "$stateProvider"
  "$urlRouterProvider"
  ($stateProvider, $urlRouterProvider) ->
    # For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/")

    $stateProvider
      .state('home',
        url: "/"
        templateUrl: "views/home.html"
        controller: 'AppCtrl'
      )
      .state('signin',
        url: "/signin"
        templateUrl: "views/signin.html"
        controller: 'AppCtrl'
      )
      .state('signup',
        url: "/signup"
        templateUrl: "views/signup.html"
        controller: 'AppCtrl'
      )
])

# your Firebase URL goes here
# should look something like: https://blahblahblah.firebaseio.com
.constant "FIREBASE_URL", "https://mnklab.firebaseio.com/"