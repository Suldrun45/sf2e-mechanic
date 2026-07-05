import {summon, getSpecificSummonDetails} from "./summon.js";
import {SOURCE_UUIDS, TURRET_ACTOR_UUID, MINE_ACTOR_UUID, MULTIDISCIPLINARY_MECHANIC_ACTION_UUID, LONG_RANGE_PROPULSORS_TURRET_UUID, BIG_BOOM_TURRET_UUID} from "./consts.js";
import {messageItemHasRollOption} from "./helpers.js";
import {setTurretAttacks} from "./turret.js";

Hooks.once("ready", async function () {
    Hooks.on("createChatMessage", async (chatMessage, _info, userID) => {
        if (!game.modules.find(p=>p.id=="foundry-summons")?.active)
            return;
        if (userID !== game.user.id) return;
        if (chatMessage.isDamageRoll || chatMessage.isRoll) return;
        if (!messageItemHasRollOption(chatMessage, "origin:item:trait:mechanic")) return;
        let itemUuid = chatMessage?.item?.sourceId;
        if (!SOURCE_UUIDS.has(itemUuid))
            return;
        
        if (chatMessage?.flags?.[game.system.id]?.appliedDamage) return;

        let summonLevel = 20;

        const summonerActor = ChatMessage.getSpeakerActor(chatMessage.speaker);

        const spellRelevantInfo = {
            summonerLevel: summonerActor.level,
            summonerRollOptions: Object.keys(
              summonerActor?.flags?.[game.system.id]?.rollOptions?.all ?? {},
            ),
            summonerActorId: summonerActor.id,
            itemRollOptions:
              chatMessage?.flags?.[game.system.id]?.context?.options ?? [],
            classDC: summonerActor.system.proficiencies.classDCs.mechanic?.value,
            int: summonerActor.system.abilities.int.mod,
            dex: summonerActor.system.abilities.dex.mod,
          };

          let summonDetailsGroup = await getSpecificSummonDetails(
            itemUuid,
            spellRelevantInfo,
          );        
      
          if (!summonDetailsGroup || summonDetailsGroup?.length === 0) return;

          summonDetailsGroup.forEach((group) => {
            group?.itemsToAdd?.forEach((item) => {
                if (item?.system) {
                  item.system.context = {
                    origin: {
                      actor: chatMessage?.actor?.uuid,
                      token: chatMessage?.token?.uuid,
                      item: chatMessage?.item?.uuid,
                    },
                  };
                }
              });
          });

          const config = {
            item: chatMessage?.item,
          };
      
          const summonType = "mechanic";
          await summon(
            summonerActor,
            itemUuid,
            summonType,
            summonDetailsGroup,
            config,
          );
    });
    
    Hooks.on("updateActor", async (actor, data, _info, userID) => {     
      if (actor.sourceId == MINE_ACTOR_UUID && data?.flags?.["pf2e-summons-assistant"]?.summoner){                
        const summoner = game.actors.get(data?.flags?.["pf2e-summons-assistant"]?.summoner?.id);
        const summonerMD = summoner.itemTypes.action.find(p => p.sourceId == MULTIDISCIPLINARY_MECHANIC_ACTION_UUID);
        if (summonerMD){
          const summonerRules= summonerMD.rules;
          const summonerRuleType = summonerRules.find(p=>p.key=="ChoiceSet" && p.flag=="multidisciplinaryMechanic")?.selection;
          if (summonerRuleType){
            const newMD = (await foundry.utils.fromUuid("Compendium.sf2e-mechanic.options.Item.894xo66p6om8suvT")).toObject();
            newMD.system.rules.find(p=>p.key=="ChoiceSet" && p.flag=="multidisciplinaryMechanic").selection = summonerRuleType;
            newMD.system.rules.find(p=>p.key=="RollOption" && p.option=="multidisciplinary-mechanic").value=true;
            await actor.createEmbeddedDocuments("Item", [newMD]);
          }
        }
      }
      if (actor.sourceId == TURRET_ACTOR_UUID){
        if (data.system?.abilities?.int?.mod){
          const level = actor.level;
          const intelligence = data.system.abilities.int.mod;
          const arrayType = actor.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
          const weaponGrade = actor.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;     
          await setTurretAttacks(actor, arrayType, intelligence, level, weaponGrade);      
        }
        if (data.system?.details?.level?.value){
          const level = data.system.details.level.value;
          const intelligence = actor.system.abilities.int.mod;
          const arrayType = actor.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
          const weaponGrade = actor.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;     
          await setTurretAttacks(actor, arrayType, intelligence, level, weaponGrade);      
        }
      }
    });

    Hooks.on("createItem", async (item, _info, userId) => {
      const actor = item.actor;
      if ((item.sourceId == LONG_RANGE_PROPULSORS_TURRET_UUID || item.sourceId == BIG_BOOM_TURRET_UUID) && actor.sourceId == TURRET_ACTOR_UUID){
        const level = actor.level;
        const intelligence = actor.system.abilities.int.mod;
        const arrayType = actor.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
        const weaponGrade = actor.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;     
        await setTurretAttacks(actor, arrayType, intelligence, level, weaponGrade);
      }
    });

    Hooks.on("deleteItem", async (item, _info, userId) => {
      const actor = item.actor;
      if ((item.sourceId == LONG_RANGE_PROPULSORS_TURRET_UUID || item.sourceId == BIG_BOOM_TURRET_UUID) && actor.sourceId == TURRET_ACTOR_UUID){
        const level = actor.level;
        const intelligence = actor.system.abilities.int.mod;
        const arrayType = actor.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
        const weaponGrade = actor.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;     
        await setTurretAttacks(actor, arrayType, intelligence, level, weaponGrade);
      }
    });
    
    Hooks.on("updateItem", async (item, updateData, _info, userId) => {
      if (item.slug == "weapon-arrays" && updateData.system?.rules){
        const arrayType = updateData.system.rules.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
        if (arrayType){
          const turret = item.parent;
          const level = turret.level;
          const intelligence = turret.system.abilities.int.mod;
          const weaponGrade = turret.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;
          await setTurretAttacks(turret, arrayType, intelligence, level, weaponGrade);
        }
      }
      
      if (item.slug == "weapon-grade" && updateData.system?.rules){
        const weaponGrade = updateData.system.rules.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;
        if (weaponGrade){
          const turret = item.parent;
          const level = turret.level;
          const intelligence = turret.system.abilities.int.mod;
          const arrayType = turret.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
          await setTurretAttacks(turret, arrayType, intelligence, level, weaponGrade);
        }
      }
    });

    await game.actors.map(p=>p).filter(p => p.type == "npc" && p.sourceId == TURRET_ACTOR_UUID).forEach(async (turret) => {       
      const level = turret.level;
      const intelligence = turret.system.abilities.int.mod;
      const arrayType = turret.itemTypes.action.find(p => p.slug == "weapon-arrays")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="arrays")?.selection;
      const weaponGrade = turret.itemTypes.action.find(p => p.slug == "weapon-grade")?.system?.rules?.find(p=> p.key == "RollOption" && p.option=="weapon-grade")?.selection;     
      await setTurretAttacks(turret, arrayType, intelligence, level, weaponGrade);      
    });
});