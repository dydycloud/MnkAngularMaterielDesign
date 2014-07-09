angular.module("myApp.auth.factory", [])
.factory "Auth", ($firebaseSimpleLogin, FIREBASE_URL, $rootScope) ->
  ref = new Firebase(FIREBASE_URL)
  auth = $firebaseSimpleLogin(ref)
  $rootScope.loader = false
  Auth =
    register: (user) ->
      $rootScope.loader = true
      auth.$createUser(user.email, user.password).then ->
        $rootScope.loader = false

    signedIn: ->
      auth.user isnt null

    login: (user)->
      $rootScope.loader = true
      $rootScope.l = "true"
      auth.$login('password', user)

    logout: ->
      $rootScope.loader = false
      $rootScope.l = "false"
      auth.$logout()

  $rootScope.signedIn = ->
    Auth.signedIn()

  Auth