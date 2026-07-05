import {setTurretAttacks} from "./turret.js";

export const SOURCES = {
    MECHANIC:{
        DEPLOY_TURRET: "Compendium.starfinder-field-test-for-pf2e.sf2e-actions.Item.1vWiNk1jbqCq4O16"     
    }
};
export const TURRET_ACTOR_UUID = "Compendium.sf2e-mechanic.actors.Actor.NnHJk3FnfhVRLVHp";
export const MINE_ACTOR_UUID = "Compendium.pf2e-summons-assistant.sf2e-summons-assistant-actors.Actor.sAVuxP25VE126TdZ";
export const MULTIDISCIPLINARY_MECHANIC_ACTION_UUID = "Compendium.sf2e-mechanic.options.Item.894xo66p6om8suvT";
export const LONG_RANGE_PROPULSORS_TURRET_UUID = "Compendium.sf2e-mechanic.mods.Item.FChpckyLiCTvTiyd";
export const BIG_BOOM_TURRET_UUID = "Compendium.sf2e-mechanic.mods.Item.rdXLN2ExKneE5bHj";

export const SOURCE_UUIDS = getAllSourceUUIDs();

function getAllSourceUUIDs() {
    const uuids = new Set();
    for (const category of Object.values(SOURCES)) {
      for (const uuid of Object.values(category)) {
        uuids.add(uuid);
      }
    }
    return uuids;
  }

export const postSummonHelper = {
    DEPLOY_TURRET: async(summonedActorID, actorUpdateData) => {
        const actor = game.actors.get(summonedActorID);
        await actor.update(actorUpdateData);

        const level = actor.level;
        const intelligence = actor.system.abilities.int.mod;
        const arrayType = actor.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
        const weaponGrade = actor.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;     

        await setTurretAttacks(actor, arrayType, intelligence, level, weaponGrade);
    },
  };