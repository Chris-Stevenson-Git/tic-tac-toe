
// ----------------------------- global variables to more easily the database in functions -----------------------
let database;
let winCounter;
let playerTurn;
let resetWatcher;
let playerName;


function initApp() {
  // Listening for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
    // [START_EXCLUDE silent]
    // [END_EXCLUDE]
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      playerName = (email.slice(0, email.indexOf('@')));
      playerName = playerName.charAt(0).toUpperCase() + playerName.slice(1);
      // [START_EXCLUDE]
      document.getElementById('quickstart-sign-in-status').textContent = `Signed in as ${playerName}`;
      document.getElementById('quickstart-sign-in').textContent = 'Sign out';
      document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
      gameInit();
      // [END_EXCLUDE]
    } else {
      // User is signed out.
      // [START_EXCLUDE]
      document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
      document.getElementById('quickstart-sign-in').textContent = 'Sign in';
      document.getElementById('quickstart-account-details').textContent = 'null';
      // [END_EXCLUDE]
    }
    // [START_EXCLUDE silent]
    document.getElementById('quickstart-sign-in').disabled = false;
    // [END_EXCLUDE]
  });
  // [END authstatelistener]

  document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
  document.getElementById('quickstart-sign-up').addEventListener('click', handleSignUp, false);
}
$('document').ready(function(){
  initApp();
});
// ----------------------------- Authenticate -----------------------------
function toggleSignIn() {
  if (firebase.auth().currentUser) {
    // [START signout]
    firebase.auth().signOut();
    // [END signout]
  } else {
    var email = document.getElementById('email').value + '@fakeemail.com';
    var password = 'password';
    if (email.length < 4) {
      alert('Please enter an email address.');
      return;
    }
    if (password.length < 4) {
      alert('Please enter a password.');
      return;
    }
    // Sign in with email and pass.
    // [START authwithemail]
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // [START_EXCLUDE]
      if (errorCode === 'auth/wrong-password') {
        alert('Wrong password.');
      } else {
        alert(errorMessage);
      }
      console.log(error);
      document.getElementById('quickstart-sign-in').disabled = false;
      // [END_EXCLUDE]
    });
    // [END authwithemail]
  }
  document.getElementById('quickstart-sign-in').disabled = true;
}

/**
* Handles the sign up button press.
*/
function handleSignUp() {
  var email = document.getElementById('email').value + '@fakeemail.com';
  var password = 'password';
  if (email.length < 4) {
    alert('Please enter an email address.');
    return;
  }
  if (password.length < 4) {
    alert('Please enter a password.');
    return;
  }
  // Create user with email and pass.
  // [START createwithemail]
  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/weak-password') {
      alert('The password is too weak.');
    } else {
      alert(errorMessage);
    }
    console.log(error);
    // [END_EXCLUDE]
  });
  // [END createwithemail]
}

// ----------------------------- Load the game once the page has loaded.  -----------------------------
const gameInit = function(){


      /**
       * initApp handles setting up UI event listeners and registering Firebase auth listeners:
       *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
       *    out, and that is where we update the UI.
       */



  // ----------------------------- END OF AUTH -----------------------------

  // ----------------------------- Set the global variables to the firestore database -----------------------
  database = firebase.firestore();
  winCounter = database.collection('gameData').doc('winCounter');
  theBoard = database.collection('gameData').doc('theBoard');
  playerTurn = database.collection('gameData').doc('playerTurn');
  resetWatcher = database.collection('gameData').doc('resetWatcher');


  // ----------------------------- code to init a board -----------------------------
  //Take the size of the board that already exists on firebase and make one for yourself.
  //Will also reset anyone else's half filled board if they're on the page
  theBoard.get().then(function(doc) {
    for (var i = 1; i <= doc.data()['boardState'].length; i++) {
      //create new grid divs which are proportional sizes to the containing box.
      let gridItem = document.createElement('div');
      $(gridItem).addClass('gridItem').css({'width': `${100/number}%`, 'height': `${100/number}%`}).appendTo($('.grid-container'));
      //populate the local boardState
      blankBoardArray.push('empty');
      //when loop hits a modulus of argument number, create an empty div which just forces the grid items to start a new row
      if(i % number === 0) {
        let gridBreak = document.createElement('div');
        $(gridBreak).addClass('gridBreak').appendTo($('.grid-container'))
      }
    }
    updateBoard();
    //gridBoard global var is equal to jquery object of every div with a class of gridItem
    gridBoard = $('.gridItem');
    //load click function so the new divs can have click event listeners
    loadClickFunction();
  });
  playerTurn.get().then(function(doc){
    $('#playerOneTag').text(doc.data()['setPlayerOne']);
    $('#playerTwoTag').text(doc.data()['setPlayerTwo']);
  });

  // ----------------------------- click  handlers -----------------------------
  //On click of any reset button it changes the resetWatcher value in the database which will trigger a listener working in any browser window
  $('.reset').on('click', function() {
    let randomNum = Math.random() * Number.MAX_VALUE;
    resetWatcher.update({
      'yesReset': randomNum,
    });
  });

  //Update the database's win counter values to zero
  $('.resetWins').on('click', function(){
    winCounter.update({
      'playerOne': 0,
      'playerTwo': 0,
    });
  });

  //When changing the grid size selector, store that value in the database
  $("select").change(function() {
    let selectVal = $(this).val();
    theBoard.update({
      'gridSize': selectVal,
    });
  });

  $('#playerOneSelect').on('click', function(){
    playerTurn.update({
      'setPlayerOne': playerName,
    });
  });

  $('#playerTwoSelect').on('click', function(){
    playerTurn.update({
      'setPlayerTwo': playerName,
    });
  });


  // ----------------------------- Listen to changes in data -----------------------------
  playerTurn.onSnapshot(function(doc) {
    $('#playerOneTag').text(doc.data()['setPlayerOne']);
    $('#playerTwoTag').text(doc.data()['setPlayerTwo']);
  });

  //listening to changes in win counter database
  //will trigger if the display value changes, either player wins, or the win message changes
  winCounter.onSnapshot(function(doc) {
    //update the values of player 1 and 2 win counts in the DOM
    $('#p2WinCount').text(doc.data()['playerTwo']);
    $('#p1WinCount').text(doc.data()['playerOne']);
    //update the win message in the DOM from the database
    $('.winMessage').text(doc.data()['winMessage']);
    //change the display type of the end game message to either show or hide
    $('.endGameMessage').css({'display': doc.data()['display']});
  });

  //listening to changing positions in the board
  //any time a square changes values, update the board across browsers and check if the game has been won.
  theBoard.onSnapshot(function() {
    updateBoard();
  });

  //Listening to if the board has been reset
  resetWatcher.onSnapshot(function() {
    //load information on the boardState from the database and then run the below commands
    theBoard.get().then(function(doc){
      //clear out the grid container
      $('.grid-container').html('');

      //hide the ending message
      winCounter.update({
        'display': 'none',
      });

      //reset to player one's turn
      playerTurn.update({
        'playerOneTurn': true,
      });

      //reset the database boardState to an empty array
      theBoard.update({
        'boardState': [],
      });

      //reset the local board array to empty
      blankBoardArray = [];

      //create the new grid with the size equal to the gridSize in the database
      createGrid(doc.data()['gridSize']);
    });//theBoard.get()
  });//resetWatcher


};//end of gameInit function



// ----------------------------- click function to add token to board-----------------------------
//the click handler is held in a 'load' function because each time the board is destoryed and created, new click handlers need to be assigned to the DIV elements created.
const loadClickFunction = function() {
  //Click event listener function
  $('.gridItem').on('click', function() {
    //if the square already has been filled then alert and exit function
    if($(this).hasClass('filled') === true) {
      alert('Please choose an unoccupied square.');
      return;
    }
    //variable set to the square clicked
    let thisGridItem = this;
    //get who's turn it is from the database
    playerTurn.get().then(function(doc) {
      //if it's player two's turn, make the O appear, update the DB so next turn is P1 and then update the boardstate in the database.
      if(doc.data()['playerOneTurn'] === false && doc.data()['setPlayerTwo'] === playerName) {
        playerTurn.update({
          'playerOneTurn': true,
        });
        theBoard.get().then(function(doc) {
          let boardState = doc.data()['boardState'];
          boardState[gridBoard.index(thisGridItem)] = 'token2';
          theBoard.update({
            'boardState': boardState,
          });
        });
      } else if (doc.data()['playerOneTurn'] && doc.data()['setPlayerOne'] === playerName){
        //do the same but reverse
        playerTurn.update({
          'playerOneTurn': false,
        });
        theBoard.get().then(function(doc) {
          let boardState = doc.data()['boardState'];
          boardState[gridBoard.index(thisGridItem)] = 'token1';
          theBoard.update({
            'boardState': boardState,
          });
        });
      }//else
    });//playerTurn.get()
  });//end of on click function
}//end of loadClickFunction


// ----------------------------- Update the board -----------------------------
//This is a function that loops through the boardState array held in the database and populates the squares with the correct images.
const updateBoard = function() {
  theBoard.get().then(function(doc){
    for (let i = 0; i < doc.data()['boardState'].length; i++) {
      if(doc.data()['boardState'][i] === 'token1') {
        $(gridBoard[i]).css({'background-image': "url('images/Token1.png')"});
        $(gridBoard[i]).addClass('Player-One filled')
      } else if (doc.data()['boardState'][i] === 'token2') {
        $(gridBoard[i]).css({'background-image': "url('images/Token2.png')"});
        $(gridBoard[i]).addClass('Player-Two filled')
      } else if (doc.data()['boardState'][i] === 'empty') {
        $(gridBoard[i]).css({'background-image': "none"});
      }
    }//for loop
    console.log(doc.data()['boardState']);
    winCheck(doc.data()['boardState']);
  })//theBoard.get()
};//updateBoard




// ----------------------------- Create the board -----------------------------
//Gridboard is a variable to hold a jquery object of an array of every grid square so that I can check it in the checkWin function
let gridBoard;
//Blank board Array is an empty array I can push a new boardstate to and update the database to whenever a new board is created.
let blankBoardArray = [];

//function which takes in a number and gives a grid of that number's square.
const createGrid = function(number) {
  //reset blankBoardArray if necessary
  blankBoardArray = [];
  //square the function argument to make a grid
  const squareNum = number**2;
  for (var i = 1; i <= squareNum; i++) {
    //create new grid divs which are proportional sizes to the containing box.
    let gridItem = document.createElement('div');
    $(gridItem).addClass('gridItem').css({'width': `${100/number}%`, 'height': `${100/number}%`}).appendTo($('.grid-container'));
    //populate the local boardState
    blankBoardArray.push('empty');
    //when loop hits a modulus of argument number, create an empty div which just forces the grid items to start a new row
    if(i % number === 0) {
      let gridBreak = document.createElement('div');
      $(gridBreak).addClass('gridBreak').appendTo($('.grid-container'))
    }
  }
  console.log(blankBoardArray);
  //set the database's boardstate to the new local boardstate called blankBoardArray
  theBoard.update({
    'boardState': blankBoardArray,
  });
  //gridBoard global var is equal to jquery object of every div with a class of gridItem
  gridBoard = $('.gridItem');
  //load click function so the new divs can have click event listeners
  loadClickFunction();
};//create grid function

// ----------------------------- Win conditions -----------------------------
//win checking function which takes grid board as an array.
const winCheck = function(gridBoard){
  //horizontal 3
  const horizontalCheck = function(gridBoard, i, token) {
    const next = i+1;
    const previous = i-1;
    //only perform the operation in the same row
    if(i % rowLength != 0 && next % rowLength != 0){
      //check if the previous and following tokens are the same
      if(gridBoard[i] === token && gridBoard[next] === token && gridBoard[previous] === token) {
        endingMessage(token);
        console.log('Working');
      }
    }
  };
  //vertical 3
  const verticalCheck = function(gridBoard, i, token) {
    const next = i+rowLength;
    const previous = i-rowLength;
    //check everything except the top and bottom rows
    if(i > (rowLength-1) && i < (gridBoard.length - rowLength)) {
      if(gridBoard[i] === token && gridBoard[next] === token && gridBoard[previous] === token) {
        endingMessage(token);
      }
    }
  };
  //diagonal 3
  const diagonalCheck = function(gridBoard, i, token) {
    //checks eveything but the top and bottom row
    if(i > (rowLength-1) && i < (gridBoard.length - rowLength)){
      //exclude the left and right columns
      if(i % rowLength != 0 && (i+1) % rowLength != 0) {
        const topLeft = i-rowLength-1;
        const topRight = i-rowLength+1;
        const bottomLeft = i+rowLength-1;
        const bottomRight = i+rowLength+1;
        if(gridBoard[i] === token && gridBoard[topLeft] === token && gridBoard[bottomRight] === token) {
          endingMessage(token);
        }
        if(gridBoard[i] === token && gridBoard[topRight] === token && gridBoard[bottomLeft] === token) {
          endingMessage(token);
        }
      }
    }
  };

  //work out the dimensions of the board
  const rowLength = Math.sqrt(gridBoard.length);
  //Starting at 1 because I never need to check the first box
  for (var i = 1; i < gridBoard.length; i++) {
    //set token variable to either playerOne or Two depending on what's in the contents of the clicked square
    let token;
    if(gridBoard[i] === 'token1'){
      token = 'token1';
    } else if (gridBoard[i] === 'token2') {
      token = 'token2';
    }
    //run checks on each square in the baord to see if it's got a winning combo
    horizontalCheck(gridBoard, i, token);
    verticalCheck(gridBoard, i, token);
    diagonalCheck(gridBoard, i, token);
  }//for loop
  //Check the board array to see if it's devoid of unfilled squares.
  theBoard.get().then(function(doc) {
    //if no empty squares, but at least one filled square
    //this is because an empty array would otherwise return true and display that it's a draw.
    if(doc.data()['boardState'].includes('empty') === false && doc.data()['boardState'].includes('token1') === true){
      endingMessage('draw')
    }
  });
};


// ----------------------------- Ending Message -----------------------------
//function which takes token as arg. Token is the class name of the X or O
const endingMessage = function(token) {
  //update the win message in the database
  if(token === 'draw'){
    winCounter.update({
      'winMessage': `It's a draw!`,
    });
  }
  //update the winCounter values in the database
  else if(token === 'token1'){
    winCounter.get().then(function(doc) {
      const newWinCount = doc.data()['playerOne'] + 1;
      playerTurn.get().then(function(doc) {
        winCounter.update({
          'playerOne': newWinCount,
          'winMessage': `${doc.data()['setPlayerOne']} wins!`,
        });
      });
    });
  } else if(token === 'token2'){
    winCounter.get().then(function(doc) {
      const newWinCount = doc.data()['playerTwo'] + 1;
      playerTurn.get().then(function(doc) {
        winCounter.update({
          'playerTwo': newWinCount,
          'winMessage': `${doc.data()['setPlayerTwo']} wins!`,
        });
      });
    });
  }
  //Show the end of game message
  winCounter.update({
    'display': 'block',
  });
};
