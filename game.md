We are going to create a multiplayer card game

I already setup firebase auth, firestore, realtime database

A user can create a room and other users can join the room.
Each room can hold upto 10 players and minimum players is 3

Game Mechanics
1-10 players
- Each player will be given a random card with a random picture (ie. Apple, Car, Radio) Each card has a visible arrow pointing left or right.
- All initial cards will be visible to all players.
- Then the players will need to memorize their card and then pres "Ready".
- AFter all players press ready, all cards will be hidden. only the player can see his/her own card.
- First player's turn he/she will be given a new random card so he/she will have two cards now
- The player should now pass a card following the arrow direction of the card to the next player while declaring what the item he/she is passing by typing on his/her chatbox. (This is the twist, the declared item can be a bluff he/she may have given the next player the wrong item).
- After the player passed the new item to the next player, other players can call the attention of the player and say "Bluff" via a button.
- IF the call is correct, the player who called bluff wins the round.
- If the call is wrong, the player called would win the round.
- Points will be tallied and the game will reset. The first turn will go to the one who lost the round (ie. wrong call or being called correctly)


You can create assets by using pictures from the web in the meantime. (Allow images in next config)