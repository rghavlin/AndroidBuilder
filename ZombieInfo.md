SUCCESS! As things stand now zombies have been successfully implemented according to the specifications in this document.



Always refer to UniversalGoals.md. Zombies will be instances of the zombie class so a proper class for the zombies will be needed. Keep in mind there will be zombie variants so there will be subclasses of zombies. Specific things every zombie will need:
LastSeen bool should default to false
HeardNoise bool should default to false
Variable to store target sighted coordinates should default to (0,0)
Variable to store noise coordinates should default to (0,0)
MaxAP variable should default to 8.

The reason for these elements is to set up zombie behavior during the zombie's turn. Zombies will move one at a time during their turn with only zombies in sight of the player needing to process things like movement animations. During the player's turn, the zombies will be completely inert. No zombie code will be processed during the player's turn, other than to set the variables listed above. The best way to set those variables, I'm not sure about. As the player moves, something needs to be checking the tiles along the player's path to see if the player enters, then exits a zombie's line of sight. Or the entire path needs to be checked once it is calculated and a zombie-view check run on each tile of the path. If the player comes into the zombie's sight but does not exit the zombie's sight, it doesn't matter as will be demonstrated in the zombie behavior loop to follow. The player has to exit the zombie's line of sight for LastSeen to be true. 
The point that the player exit's the zombie's line of sight is the tile that is stored in the target sighted coordinates. This is also true if the player begins their turn in sight of the zombie. Anytime a player passes from a tile visible to a zombie, to a tile not visible to a zombie, LastSeen becomes true for that zombie and target coordinates are set.

Zombie Behavior Loop:
As previously stated, zombies will do nothing during their turn. Once their turn begins, all possibilities are covered by the zombie's behavior loop in conjunction with the LastSeen/SoundHeard flags. 


At the top of the zombie loop is "can see player". If the zombie's turn begins and the player is in sight, the zombie immediately uses all of it's ap to move towards the player. If the zombie reaches a cardinal position adjacent to the player without using all of its ap, it will use the remaining ap to attack. The loop is exited. The zombie's turn ends.

Next option in the loop: LastSeen is true. If LastSeen is true, target sighted coordinates will have been set and the zombie will move immediately to those coordinates. At this point, LastSeen is set to false and the zombie returns to the top of the loop. If the zombie can now see the player it will follow through with the "can see player" part of the loop. Otherwise it will continue through the loop, passing the second option because LastSeen is now false.

Next option in the loop: HeardSound is true. We will implement sounds later. For now HeardSound will always be false so it will be bypassed.

Final Option in the loop: Random Wandering. We will also implement a random wandering system later. For now this option will merely exit the loop and end the zombie's turn. 
