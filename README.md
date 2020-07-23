# Tic-Tac-Toe Game

Chris Stevenson's GA project for a Tic-Tac-Toe game with online multiplayer.

## Link

The game is live and hosted on [Firebase](https://tic-tac-toe-ec2d6.web.app/)


## How it was built
The Game has been built in HTML, CSS, JavaScript and jQuery. User authentication and live multiplayer through Google Firebase.

## Biggest learn
The DOM window is NOT a database and shouldn't be treated as such. My first iteration of the game wrote data to the DOM and then would read the DOM to check the win conditions and anything else that needed to be checked. Almost every function needed to be re-written to varying degrees when I migrated to the cloud. In future I will ensure that data is held in variables and any DOM functions are only accessing those variables and not the source of the data itself. 


## How to play
On login each user must make a username and signup. Returning users can simply sign back in with a previously created username.

Once signed in, your signed in status should update and the page will load the gameboard.

You must now choose one or both of the positions to play and you can get started!

The game will track how many games each player has won and will reset the count if the current user pairing changes.

You have the option to select a grid side and on reset it will update all players' board with the new size. Same rules of needing three in a row to win apply.

![alt text](https://i.imgur.com/e2KcSNS.png)
