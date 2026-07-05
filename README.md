![](https://img.shields.io/badge/Foundry-v14-informational)
<!--- Downloads @ Latest Badge -->
<!--- replace <user>/<repo> with your username/repository -->
![All Downloads](https://img.shields.io/github/downloads/Suldrun45/sf2e-mechanic/module.zip?color=5e0000&label=All%20Downloads)
![Latest Release Download Count](https://img.shields.io/github/downloads/Suldrun45/sf2e-mechanic/latest/module.zip)

<!--- Forge Bazaar Install % Badge -->
<!--- replace <your-module-name> with the `name` in your manifest -->

# SF2e Mechanic - Automation for the SF2e Playtest Mechanic

## Mods
Mods have a 1 round duration by default and can be dragged and dropped on the turret, mine, drone or player.
There are specific versions of some weapon and grenade mods for the Turret and for the Mine. Do not use the generic versions for them.

## Equipments
Contains versions of Weapon Upgrades working with the Turret's weapon

## Options
Contains automation for some non-mod options coming from feats. They can be dragged and dropped on your character, your turret, your drone or your mine when relevant.
- Expansive Array for the Turret only
- Multidisciplinary Mechanic for all exocortex and for your character. You should put it on your character if you have `Explosive Shot` or if you are a Mine Mechanic and have `Critical Explosion`.
Also contains the base passives of the Turret in case they are deleted from the Turret actor.

## Turret
The Turret actor should be imported from the Actors compendium into your world and the Mechanic player given ownership to it. It can then be customized with a specific token and art.
If you use the Foundry Summons module, the Turret will be summoned on the scene when you post Deploy Turret to chat and its level, intelligence and dexterity will be updated to match the Mechanic's.
If you use the PF2e Toolbelt module, make the Mechanic the master of the Turret and check the "Share Events" option in the Share Data options on the Turret sheet.
If you delete the actions on the Turret, you can put them back from the "Options" compendium.
Be careful to not delete the Attacks on the Turret as there is currently no way to put them back once deleted. This is also why the Area Denial Turret attacks are present on the token even if you don't have the Feat.

## Mine
When a Mine is placed on the scene, if you have the `Critical Explosion` feat and you have the `Multidisciplinary Mechanic` option from this module, the Mine will receive automatically the `Multidisciplinary Mechanic` option too and it will be selected by default.

Automation for Deploy Turret inspired from ChasarooniZ's PF2e Summons Assistant module https://github.com/ChasarooniZ/pf2e-summons-assistant

Install it with the manifest URL: 

https://github.com/Suldrun45/sf2e-mechanic/releases/latest/download/module.json
