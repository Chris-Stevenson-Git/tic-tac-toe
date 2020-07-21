// ----------------------------- Load the game once the page has loaded.  -----------------------------
$('document').ready(function(){

  // ----------------------------- Authentication -----------------------------

  //Signs the user in as anonymous
  firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
  });
  //sets userId to the anonymous
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      // ...
    } else {
      // User is signed out.
      // ...
    }
    // ...
  });
  // ----------------------------- Set the global variables to the firestore database -----------------------
  database = firebase.firestore();
  winCounter = database.collection('gameData').doc('winCounter');
  theBoard = database.collection('gameData').doc('theBoard');
  playerTurn = database.collection('gameData').doc('playerTurn');
  resetWatcher = database.collection('gameData').doc('resetWatcher');


  // ----------------------------- code to init a board -----------------------------
  //Take the size of the board that already exists on firebase and make one for yourself.
  theBoard.get().then(function(doc) {
    createGrid(doc.data()['gridSize']);
    updateBoard();
  });

  // ----------------------------- click  handlers -----------------------------
  //On click of any reset button it changes the resetWatcher value in the database which will trigger a listener working in any browser window
  $('.reset').on('click', function() {
    let randomNum = Math.random() * Number.MAX_VALUE;
    resetWatcher.update({
      'yesReset': randomNum,
    });
    console.log('Clicked Reset');
    console.log(randomNum);
  });

  //Just reset the win counter
  $('.resetWins').on('click', function(){
    winCounter.update({
      'playerOne': 0,
      'playerTwo': 0,
    });
  });

  $("select").change(function() {
    let selectVal = $(this).val();
    theBoard.update({
      'gridSize': selectVal,
    });
  });


  // ----------------------------- Listen to changes in data -----------------------------
  //listening to changes in win counter
  winCounter.onSnapshot(function(doc) {
    //update the values of player 1 and 2 win counts
    $('#p2WinCount').text(doc.data()['playerTwo']);
    $('#p1WinCount').text(doc.data()['playerOne']);
    //Make sure the win message matches the victor
    $('.winMessage').text(doc.data()['winMessage']);
    //change the display type of the end game message to either show or hide
    $('.endGameMessage').css({'display': doc.data()['display']});
  });

  //listening to changing positions in the board
  //any time a square changes values, update the board across browsers and check if the game has been won.
  theBoard.onSnapshot(function() {
    updateBoard();
    winCheck(gridBoard);
  });

  //Listening to if the board has been reset
  resetWatcher.onSnapshot(function() {
    theBoard.get().then(function(doc){
      //clear out the grid container
      $('.grid-container').html('');

      winCounter.update({
        'display': 'none',
      });

      playerTurn.update({
        'playerOneTurn': true,
      });

      theBoard.get().then(function(doc){
        //reset the database boardState
        theBoard.update({
          'boardState': [],
        });
        blankBoardArray = [];
        //create the new grid
        createGrid(doc.data()['gridSize']);
      });
    });//theBoard.get()
  });//resetWatcher




});//end of document ready

// ----------------------------- click function to add token to board-----------------------------
const loadClickFunction = function() {
  $('.gridItem').on('click', function() {
    console.log('clicked');
    if($(this).hasClass('filled') === true) {
      alert('Please choose an unoccupied square.');
      return;
    }
    let thisGridItem = this;
    playerTurn.get().then(function(doc) {
      if(doc.data()['playerOneTurn'] === false) {
        $(thisGridItem).addClass('Player-Two filled')
        playerTurn.update({
          'playerOneTurn': true,
        });
        theBoard.get().then(function(doc) {
          let boardState = doc.data()['boardState'];
          boardState[gridBoard.index(thisGridItem)] = 2;
          theBoard.update({
            'boardState': boardState,
          });
        });
      } else {
        $(thisGridItem).addClass('Player-One filled')
        playerTurn.update({
          'playerOneTurn': false,
        });
        theBoard.get().then(function(doc) {
          let boardState = doc.data()['boardState'];
          boardState[gridBoard.index(thisGridItem)] = 1;
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
      if(doc.data()['boardState'][i] === 1) {
        $(gridBoard[i]).css({'background-image': "url('images/Token1.png')"});
        $(gridBoard[i]).addClass('Player-One filled')
      } else if (doc.data()['boardState'][i] === 2) {
        $(gridBoard[i]).css({'background-image': "url('images/Token2.png')"});
        $(gridBoard[i]).addClass('Player-Two filled')
      } else if (doc.data()['boardState'][i] === 0) {
        $(gridBoard[i]).css({'background-image': "none"});
      }
    }//for loop
  })
};

// ----------------------------- global variables to access the database in functions -----------------------
let database;
let winCounter;
let playerTurn;
let resetWatcher;


// ----------------------------- Add tokens to board -----------------------------
$('.gridItem').on('click', function() {
  if($(this).hasClass('filled') === true) {
    alert('Please choose an unoccupied square.');
    return;
  }
  let thisGridItem = this;
  playerTurn.get().then(function(doc) {
    if(doc.data()['playerOneTurn'] === false) {
      theBoard.get().then(function(doc) {
        playerTurn.update({
          'playerOneTurn': true,
        });
        let boardState = doc.data()['boardState'];
        boardState[gridBoard.index(thisGridItem)] = 2;
        theBoard.update({
          'boardState': boardState,
        });
      });
    } else {
      theBoard.get().then(function(doc) {
        playerTurn.update({
          'playerOneTurn': false,
        });
        let boardState = doc.data()['boardState'];
        boardState[gridBoard.index(thisGridItem)] = 1;
        theBoard.update({
          'boardState': boardState,
        });
      });
    }//else
  });//playerTurn.get()
});//end of on click function


// ----------------------------- Create the board -----------------------------
//Gridboard is a variable to hold a jquery object of an array of every grid square so that I can check it in the checkWin function
let gridBoard;
let blankBoardArray = [];

//function which takes in a number and gives a grid of that number's square.
const createGrid = function(number) {
  blankBoardArray = [];
  const squareNum = number**2;
  for (var i = 1; i <= squareNum; i++) {
    let gridItem = document.createElement('div');
    $(gridItem).addClass('gridItem').css({'width': `${100/number}%`, 'height': `${100/number}%`}).appendTo($('.grid-container'));
    console.log('pushing to array');
    blankBoardArray.push(0);
    //when i hits a modulus of argument number, create an empty div which just forces the grid items to start a new row
    if(i % number === 0) {
      let gridBreak = document.createElement('div');
      $(gridBreak).addClass('gridBreak').appendTo($('.grid-container'))
    }
  }
  theBoard.update({
    'boardState': blankBoardArray,
  });
  console.log('Triggered');
  //gridBoard is equal to every div with a class of gridItem
  gridBoard = $('.gridItem');
  //load click function so the new divs can accept clicks
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
      if($(gridBoard[i]).hasClass(token) && $(gridBoard[next]).hasClass(token) && $(gridBoard[previous]).hasClass(token)) {
        endingMessage(token);
      }
    }
  };
  //vertical 3
  const verticalCheck = function(gridBoard, i, token) {
    const next = i+rowLength;
    const previous = i-rowLength;
    //check everything except the top and bottom rows
    if(i > (rowLength-1) && i < (gridBoard.length - rowLength)) {
      if($(gridBoard[i]).hasClass(token) && $(gridBoard[next]).hasClass(token) && $(gridBoard[previous]).hasClass(token)) {
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
        if($(gridBoard[i]).hasClass(token) && $(gridBoard[topLeft]).hasClass(token) && $(gridBoard[bottomRight]).hasClass(token)) {
          endingMessage(token);
        }
        if($(gridBoard[i]).hasClass(token) && $(gridBoard[topRight]).hasClass(token) && $(gridBoard[bottomLeft]).hasClass(token)) {
          endingMessage(token);
        }
      }
    }
  };

  //work out the dimensions of the board
  const rowLength = Math.sqrt(gridBoard.length);
  //Starting at 1 because I don't want to check the first box
  for (var i = 1; i < gridBoard.length; i++) {
    let token;
    if($(gridBoard[i]).hasClass('Player-One')){
      // console.log(`${i} is an X`);
      token = 'Player-One';
    } else if ($(gridBoard[i]).hasClass('Player-Two')) {
      // console.log(`${i} is an O`);
      token = 'Player-Two';
    } else {
      // console.log(`${i} is an empty`);
    }
    horizontalCheck(gridBoard, i, token);
    verticalCheck(gridBoard, i, token);
    diagonalCheck(gridBoard, i, token);
  }
  //Check the board array to see if it's devoid of unfilled squares.
  theBoard.get().then(function(doc) {
    //if no empty squares, but at least one filled square
    if(doc.data()['boardState'].includes(0) === false && doc.data()['boardState'].includes(1) === true){
      endingMessage('draw')
    }
  });
};


// ----------------------------- Ending Message -----------------------------
//function which takes token as arg. Token is the class name of the X or O
const endingMessage = function(token) {
  if(token === 'draw'){
    winCounter.update({
      'winMessage': `It's a draw!`,
    });
  } else {
    winCounter.update({
      'winMessage': `${token} wins!`,
    });
    if(token === 'Player-One'){
      winCounter.get().then(function(doc) {
        const newWinCount = doc.data()['playerOne'] + 1;
        winCounter.update({
          'playerOne': newWinCount,
        });
      });
    } else {
      winCounter.get().then(function(doc) {
        const newWinCount = doc.data()['playerTwo'] + 1;
        winCounter.update({
          'playerTwo': newWinCount,
        });
      });
    }
  }
  winCounter.update({
    'display': 'block',
  });
};
