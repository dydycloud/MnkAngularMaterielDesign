angular.module("myApp.auth.factory", [])
.factory "Auth", ($firebaseSimpleLogin, FIREBASE_URL, $rootScope) ->
  ref = new Firebase(FIREBASE_URL)
  auth = $firebaseSimpleLogin(ref)
  $rootScope.loader = false
  $rootScope.logoutButon = "false"
  Auth =
    register: (user) ->
      $rootScope.loader = true
      auth.$createUser(user.email, user.password).then ->
        $rootScope.loader = false

    signedIn: ->
      auth.user isnt null

    login: (user)->
      $rootScope.logoutButon = "true"
      $rootScope.userInfo = user.email
      auth.$login('password', user)

    logout: ->
      $rootScope.logoutButon = "false"
      $rootScope.userInfo = ""
      auth.$logout()

  $rootScope.signedIn = ->
    Auth.signedIn()

  Auth