var interactionBoard = angular.module('interactionBoard', ['firebase'])
.config(function($routeProvider)
{
	$routeProvider.when('/index',
	{
		templateUrl: 'partials/home.html'
	})
	.when('/login',
	{
		templateUrl: 'partials/login.html',
		controller: 'LoginController'
	})
	.when('/register',
	{
		templateUrl: 'partials/register.html',
		controller: 'RegisterController'
	})
	.when('/main',
	{
		templateUrl: 'partials/main.html',
		controller: 'MainController'
	})
	.otherwise
	({
		redirectTo: '/index'
	});
});


interactionBoard.factory('CurrentUser', function() {
    var email = '';
	var uid = '';
	
    return {
        getEmail: function() {
            return email;
        },
		getUID: function(){
			return uid;
		},
        setUser: function(e, u) {
            email = e;
			uid = u;
        },
        logoutUser: function(){
        	email = null;
        	uid = null;
        }
    };
});

//Login controller
interactionBoard.controller('LoginController', ['$scope','$firebaseSimpleLogin', 'CurrentUser', '$location',
	function ($scope, $firebaseSimpleLogin, CurrentUser, $location)
	{
		//REFERENCE: http://code.tutsplus.com/tutorials/creating-a-web-app-from-scratch-using-angularjs-and-firebase--cms-22391
		var firebaseObj = new Firebase("https://flickering-inferno-5359.firebaseio.com");
		var loginObj = $firebaseSimpleLogin(firebaseObj);

		/**
			Name: 			$scope.signin
			Description: 	Allows a user to sign in using a registered email and password. When logged in,
							the user will be redireceted to the main page. The CurrentUser service will
							also be set to the current users details
		**/
		$scope.SignIn = function(event)
		{	
			event.preventDefault();
			var email = $scope.user.email;
			var password = $scope.user.password;

			loginObj.$login('password',
			{
				email: email,
				password: password
			})
			.then(function(user)
			{
				CurrentUser.setUser(user.email, user.uid);
				$location.url('/main');
			},
			function(error)
			{	
				$scope.failedLogin = "Your login credentials failed. Please try again."
				$scope.$apply();
			});
		}

		/**
			Name: 			$scope.googlelogin
			Description: 	Allows a user to sign in using a google account. When logged in,
							the user will be redireceted to the main page. The CurrentUser 
							service will also be set to the current users details
		**/
							
		//REFERENCE: https://www.firebase.com/docs/web/guide/login/google.html
		$scope.GoogleLogin = function(event)
		{
			event.preventDefault();
	
			firebaseObj.authWithOAuthPopup("google", function(error, authData) 
			{
				if(error) 
				{
					$scope.failedLogin = "Your login credentials failed. Please try again.";
					$scope.$apply();
				}
				else 
				{
					CurrentUser.setUser(authData.google.email, authData.uid);
					$location.url('/main');	
					$scope.$apply();
				}
			},
			{
				scope: "email"
			});
		}

		/**
			Name: 			$scope.googlelogin
			Description: 	Allows a user to sign in using a github account. When logged in,
							the user will be redireceted to the main page. The CurrentUser 
							service will also be set to the current users details
		**/

		//REFERENCE: https://www.firebase.com/docs/web/guide/login/github.html
		$scope.GithubLogin = function(event)
		{
			event.preventDefault();
	
			firebaseObj.authWithOAuthPopup("github", function(error, authData) 
			{
				if(error) 
				{
					$scope.failedLogin = "Your login credentials failed. Please try again.";
					$scope.$apply();
				}
				else 
				{
					CurrentUser.setUser(authData.github.email, authData.uid);
					$location.url('/main');	
					$scope.$apply();
				}
			},
			{
				scope: "email"
			});
		}
	}
]);

//Register controller
interactionBoard.controller('RegisterController', ['$scope', '$location',
	function ($scope, $location)
	{
		var ref = new Firebase("https://flickering-inferno-5359.firebaseio.com");

		/**
			Name: 			$scope.register
			Description: 	Allows a user to register for the application. Once registered, the user will will redirected to 
							the login page. 
		**/

		$scope.Register = function(event)
		{	
			event.preventDefault();
			var email = $scope.reg.email;
			var password = $scope.reg.password;

			/*REFERENCE: https://www.firebase.com/docs/web/api/firebase/createuser.html*/
			ref.createUser({
				email : email,
				password : password
			},
			function(error, userdata)
			{
				if(error)
				{
					switch(error.code)
					{
						case "EMAIL_TAKEN":
							$scope.failedRegister = "This email is already registered. Please try again."
							$scope.$apply();
							break;
						case "INVALID_EMAIL":
							$scope.failedRegister = "This emil is Invalid. Please try again.";
							$scope.$apply();
							break;
						default:
							$scope.failedRegister = "Error creating user. Please try again.", error;
							$scope.$apply();
					}
				}
				else
				{
					$scope.successfulRegistration = "You have successfully Registered. Please login using the email and password you registered with.";
					$location.url('/login');	
					$scope.$apply();
				}
			});
		}
	}
]);

interactionBoard.controller('MainController', ['$scope', '$location', 'CurrentUser',
	function ($scope, $location, CurrentUser)
	{
		var ref = new Firebase("https://flickering-inferno-5359.firebaseio.com");
		ref.onAuth(authDataCallback);

		var searchFilter = "";

		/**
			Name: 			$scope.PostComment
			Description: 	Called when a user clicks the main post comment modal button. Maps the inputted comment
							from the modal textfield to a variable, sets the curretn user_email and user_uid 
							and also set some other variables like votes = 0 and subcomments. Sets all this data
							as a new data entry to firebase.
		**/
		$scope.PostComment = function(event)
		{
			event.preventDefault();

			//REFERENCE: https://www.firebase.com/docs/web/api/firebase/push.html
			var comment = $scope.user.comment;
			var dateTime = Date();
			var votes = 0;
			var subComments = "";
			var newComment = ref.push(); 

			newComment.set({'user_email' : CurrentUser.getEmail(), 
				'user_uid' : CurrentUser.getUID(),
				'comment' : comment,
				'dateTime' : dateTime,
				'votes' : votes,
				'subComments': subComments});
			$scope.user.comment = "";
		}	

		/**
			Name: 			$scope.PostSubComment
			Description: 	Called when a user clicks the post comment modal button for sub comments. Works
							similarly to PostComment function. Does not set up a sub comments section
		**/
		$scope.PostSubComment = function(id)
		{
			var subComment = $scope.user.subComment;
			var dateTime = Date();
			var ref = 'https://flickering-inferno-5359.firebaseio.com/';
	  		ref += id;
	  		ref += "/subComments";
	  		var newSubComment = new Firebase(ref);
	  		var sub = newSubComment.push();

	  		sub.set({'user_email' : CurrentUser.getEmail(), 
				'user_uid' : CurrentUser.getUID(),
				'comment' : subComment,
				'dateTime' : dateTime});

	  		$scope.user.subComment = "";

		}

		/**
			Name: 			$scope.logout
			Description: 	Called when the logout button is pressed. ref.unauth() function triggers
							the authdatacallback function.
		**/
		$scope.logout = function(event)
		{
			CurrentUser.logoutUser();
			ref.unauth();
		}

		/**
			Name: 			$scope.authdatacallback
			Description: 	Monitors the users authentication state. When a user refreshes the page, the 
							CurrentUser factory loses its data, this callback method can repopulate the current USer
							when this happens. Also is called when a user logs out. When a user logs out, the app
							is redirected back to the home page and the page is refreshed. The page is automatically
							reset so as to remove any data from the CurrentUser factory. As the user is logged out at 
							this stage this method will not be recalled to populate the factory
		**/
		//REFERENCE: https://www.firebase.com/docs/web/guide/user-auth.html
		function authDataCallback(authData) 
		{
		  	if (authData) 
		  	{
		  		var provider = authData.provider;

		  		//If the user is logged in using email and password
		  		if (provider != "password")
		  		{
		  			CurrentUser.setUser(authData[provider].email, authData.uid);
		  		}
		  		else //else the user is logged in using OAuth
		  		{
		  			CurrentUser.setUser(authData.auth.email, authData.auth.uid);
		  		}
		    } 
		  	else 
		  	{
		    	$location.url('/index');

		    	//Refresh the application
		    	location.reload();
		  	}
		}

		/**
			Name: 			$scope.filter
			Description: 	Allows the user to filter the data to only see posts posts they are interested in. This method 
							is called when the user enters text into the search bar and click the search symbol. 
		**/
		$scope.filter = function(f)
		{
			searchFilter = f;
			$( ".commentsWrapper" ).hide(); //Firstly, hide all the comments.

			//REFERENCE: https://www.firebase.com/docs/web/api/datasnapshot/foreach.html
			ref.orderByChild("votes").on('value', function(snapshot) 
			{
				snapshot.forEach(function(childSnapshot) //loop through each comment
				{
			    	var childKey = childSnapshot.key();
					var comment = childSnapshot.val();
					removeComment(childKey);

					if (comment.comment.indexOf(searchFilter) > -1) //if the comment contains a substring of the search text, display it, otherwise ignore the comment.
					{
						displayComment(comment.comment, comment.user_email, comment.user_uid, comment.dateTime, comment.votes, childKey);
					}
			  	});
			});
		};

		/**
			Name: 			.on, Child_addded
			Description: 	Callback method for when a new comment is added.  	
		**/
		ref.orderByChild("votes").on('child_added', function(snapshot)
		{
			var childKey = snapshot.key();
			var comment = snapshot.val();

			if (comment.comment.indexOf(searchFilter) > -1)
			{
				displayComment(comment.comment, comment.user_email, comment.user_uid, comment.dateTime, comment.votes, childKey);
			}
		});

		/**
			Name: 			.on, Child_changed
			Description: 	Callback method for when a comments data changes. A new sub comment is added
							or the vote has been incremented, for example. 	
		**/
		ref.orderByChild("votes").on('child_changed', function(childSnapshot, prevChildKey) 
		{
 			var childKey = childSnapshot.key();
			var comment = childSnapshot.val();
			removeComment(childKey);
			console.log(childSnapshot.key());
			if (comment.comment.indexOf(searchFilter) > -1)
			{
				displayComment(comment.comment, comment.user_email, comment.user_uid, comment.dateTime, comment.votes, childKey);
			}
		});

		/**
			Name: 			removeComment
			Description: 	given the element id, this function finds and removes the element from the DOM  	
		**/
		function removeComment(key)
		{
			$('#' + key).remove();	
		}

		/**
			Name: 			displayComment
			Description: 	Displays any new comments posted on the application. See comments inside
							the function for moer detail.	
		**/
		function displayComment(comment, email, uid, dateTime, votes, key)	
		{
			//REFERENCE: http://stackoverflow.com/questions/2454611/hide-an-html-element-using-javascript-only-if-browser-is-firefox/2454686#2454686
			var FIREFOX = /Firefox/i.test(navigator.userAgent);

			var deleteButton = "";
			if (dateTime)
			{
				dateTime = trimDateTime(dateTime);
			}

			//This if statement creates a new delete button only if the the comments email matches the currentusers email.
			//This means that a user can only delete comments posted by them. 
			if (email == CurrentUser.getEmail())
			{
				var deleteButton = '<br><button type="submit" class="btn btn-vote" onClick="deleteComment(\'' + key + '\');">delete Comment</buttton>';
			}
			
			//BUG: Dynamically setting the button id's will not work in FIREFOX browsers (EG:  data-id="' + key +'), therefore i am unable to reference
			//any submitted subcomments back to there parent nodes causing errors. I have disabled the subcommented feature for firefox. Users will
			//not be allowed to add sub comments with Firefox for now. No problems like this on Chrome or Internet Explorer. 
			if (FIREFOX)
			{
				//This code dynamically renderes all comment data on the screen and wraps it up in a commentsWrapper DIV. 
				$('<div/>')
	  			.append('<h3 style="word-wrap: break-word;"><strong>' + comment + '</strong></h3>'
	  				+ '<p class="textAlignRight"><strong><br><br>Votes: </strong>' + votes
	  				+ '<br><strong>User: </strong>' + email 
	  				+ '<br><strong>Time Of Post: </strong>' + dateTime 
	  				+ '<br><button type="submit" class="btn btn-vote" onClick="upVote(\'' + votes + '\',\'' + key + '\');">vote</buttton>'
	  				+ deleteButton + '</p>')
	  			.prependTo($('#commentsDiv'))
	  			.wrap('<div class="commentsWrapper" name="posts" id="' + key + '" style="clear: both"></div>');	
			}
			else
			{
				$('<div/>')
				.append('<h3 style="word-wrap: break-word;"><strong>' + comment + '</strong></h3>'
					+ '<p class="textAlignRight"><strong><br><br>Votes: </strong>' + votes
					+ '<br><strong>User: </strong>' + email 
					+ '<br><strong>Time Of Post: </strong>' + dateTime 
					+ '<br><button type="submit" class="btn btn-vote" onClick="upVote(\'' + votes + '\',\'' + key + '\');">vote</buttton>'
					+ '<br><button type="submit" name="_subCommentButton" data-id="' + key +'" class="btn btn-vote subCommentButton" data-toggle="modal" data-target="#subCommentForm">post comment</buttton>'
					+ deleteButton + '</p>')
				.prependTo($('#commentsDiv'))
				.wrap('<div class="commentsWrapper" name="posts" id="' + key + '" style="clear: both"></div>');
			}
			
			//This function can be found in the index.html page
  			showSubComments(key, CurrentUser.getEmail());
		};

		/**
			Name: 			trimDateTime
			Description: 	A function that trims off unnecessary time information returned from javascripts DATE() function
		**/
		function trimDateTime(dateTime)
		{
			var dateTime = dateTime.toString();
			var n = dateTime.indexOf("GMT+");
			var s = dateTime.substring(0, n);
			return s;
		};
	}
]);
