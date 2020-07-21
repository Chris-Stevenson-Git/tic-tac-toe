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

  // ----------------------------- Start & Reset Button -----------------------------
  $('#start').on('click', function() {
    const gridSize = $('#gridSize').val();
    createGrid(gridSize);
    loadClickFunction();
    $('#reset').css({'display': 'inline'});
    $(this).remove();
  });

  $('.reset').on('click', function() {
    $('.grid-container').html('');
    const gridSize = $('#gridSize').val();
    createGrid(gridSize);
    loadClickFunction();
    $('.endGameMessage').css({'display': 'none'});
    turnSelect = 1;
    drawCount = 0;
  });

  $('.resetWins').on('click', function(){
    winCounter.update({
      'playerOne': 0,
      'playerTwo': 0,
    });
  });

  // ----------------------------- Set the global variables to the firestore database -----------------------
  database = firebase.firestore();
  winCounter = database.collection('gameData').doc('winCounter');

  // ----------------------------- Listen to changes in data -----------------------------
  console.log(winCounter);
  winCounter.onSnapshot(function(doc) {
    $('#p2WinCount').text(doc.data()['playerTwo']);
    $('#p1WinCount').text(doc.data()['playerOne']);
  });


});//end of document ready


let database;
let winCounter;


// ----------------------------- Add tokens to board -----------------------------
let turnSelect = 1;
const loadClickFunction = function() {
  $('.gridItem').on('click', function() {
    if($(this).hasClass('filled') === true) {
      alert('Please choose an unoccupied square.');
      return;
    }
    if(turnSelect % 2 === 0) {
      $(this).css({'background-image': "url('images/Token2.png')"});
      $(this).addClass('Player-Two filled')
      turnSelect++;
    } else {
      $(this).css({'background-image': "url('images/Token1.png')"});
      $(this).addClass('Player-One filled')
      turnSelect++;
    }
    winCheck(gridBoard);
  });//end of add tokens to board function
};


// ----------------------------- Create the board -----------------------------
//Gridboard is a variable to hold a jquery object of an array of every grid square
let gridBoard;

const createGrid = function(number) {
  const squareNum = number**2;
  for (var i = 1; i <= squareNum; i++) {
    let gridItem = document.createElement('div');
    $(gridItem).addClass('gridItem').css({'width': `${100/number}%`, 'height': `${100/number}%`}).appendTo($('.grid-container'));
    if(i % number === 0) {
      let gridBreak = document.createElement('div');
      $(gridBreak).addClass('gridBreak').appendTo($('.grid-container'))
    }
  }
  gridBoard = $('.gridItem');
};//create grid function


// ----------------------------- Win conditions -----------------------------
//set counter to check if there are no moves left to make
let drawCount = 0;
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
  drawCount++;
  if(drawCount === gridBoard.length) {
    endingMessage('draw')
  }
};


// ----------------------------- Ending Message -----------------------------
const endingMessage = function(token) {
  if(token === 'draw'){
    $('.winMessage').text(`It's a draw!`);
  } else {
    $('.winMessage').text(`${token} wins!`);
    if(token === 'Player-One'){
      winCounter.get().then(function(doc) {
        const newWinCount = doc.data()['playerOne'] + 1;
        database.collection('gameData').doc('winCounter').update({
          'playerOne': newWinCount,
        });
      });
    } else {
      winCounter.get().then(function(doc) {
        const newWinCount = doc.data()['playerTwo'] + 1;
        database.collection('gameData').doc('winCounter').update({
          'playerTwo': newWinCount,
        });
      });
    }
  }
  $('.endGameMessage').css({'display': 'block'});
};
