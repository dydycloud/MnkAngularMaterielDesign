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
