import {SOURCES, postSummonHelper} from "./consts.js";
import {getTurret} from "./helpers.js";
import {setTurretAttacks} from "./turret.js";

export async function summon(
    summonerActor,
    itemUuid,
    summonType,
    summonDetailsGroup,
    config = {},
  ) {
    const summonerToken = summonerActor.getActiveTokens()[0];
    const summonerAlliance = summonerActor.system.details.alliance;
    // No Summon Spell Found
    if (summonDetailsGroup === null) return;
  
    const summonerItem = config?.item ?? (await foundry.utils.fromUuid(itemUuid));
  
    const summonActorUUIDList = [];
  
    for (const summonDetails of summonDetailsGroup) {
      const requiredTraits = summonDetails?.traits || [];
      const allowedSpecificUuids = summonDetails?.specific_uuids || [];
      const actorModifications = summonDetails?.modifications || {};
      const itemsToAdd = summonDetails?.itemsToAdd || [];
      const isCharacter = summonDetails?.isCharacter;
      const crosshairParameters = summonDetails?.crosshairParameters || {};
      const amount = summonDetails?.amount || 1;

      let selectedActorUuid;
      if (allowedSpecificUuids.length === 1) {
        selectedActorUuid = allowedSpecificUuids[0];
      } 
      else {
        return;
      }  
      
      const selectedActor = await foundry.utils.fromUuid(selectedActorUuid);
      const originalActorLevel = selectedActor?.level; 
  
      delete actorModifications?.["system.traits.value"];
  
      const levelData = summonerToken?.document?.level
        ? { "protoTypeToken.level": summonerToken?.document?.level }
        : {};
  
      const actorUpdateData = {
        "system.details.alliance": summonerAlliance,
        ...levelData,
        ...actorModifications,
      };
  
      let prevSummonedToken;
      for (let i = 0; i < amount; i++) {
        const tokDoc = await foundrySummons.pick({
          uuid: selectedActorUuid,
          updateData: actorUpdateData,
          crosshairParameters:
            typeof crosshairParameters === "function"
              ? crosshairParameters({ cnt: i, prevSummonedToken })
              : crosshairParameters,
        });
  
        const summonedActor = tokDoc.actor ?? game.actors.get(tokDoc.actorId);
  
        if (itemsToAdd.length > 0) {
          await summonedActor?.createEmbeddedDocuments("Item", itemsToAdd);
        }
        
        await handlePostSummon(
          itemUuid,
          summonedActor.uuid,
          summonedActor.id,
          summonerToken,
          actorUpdateData
        );
        prevSummonedToken = tokDoc?.object || canvas.tokens?.get(tokDoc?._id);
      }
    }
  }

  async function handlePostSummon(
    itemUUID,
    summonedActorUUID,
    summonedActorID,
    summonerToken,
    actorUpdateData
  ) {
    switch (itemUUID) {
        case SOURCES.MECHANIC.DEPLOY_TURRET:
          postSummonHelper.DEPLOY_TURRET(summonedActorID, actorUpdateData);
          break;
        default:
          break;
        }
  }

export async function getSpecificSummonDetails(
    uuid,
    data = {
      rank: 0,
      summonerLevel: 0,
      dc: 0,
      summonerRollOptions: [],
      itemRollOptions: [],
      targetTokenUUID: null,
      tokenWidth: 1,
      tokenHeight: 1,
      ignoreDialogue: false,
    },
  ) {  
    const SUMMON_HANDLERS = getSummonHandlers();
    const handler = SUMMON_HANDLERS[uuid];
    if (handler) {
      return await handler(data);
    }
  
    return null;
  }

const getSummonHandlers = () => ({
    [SOURCES.MECHANIC.DEPLOY_TURRET]: handlers.mechanic.handleDeployTurret,
  });

  const handlers = {  
    mechanic: {
        handleDeployTurret: async (data) => {
            const uuid = await getTurret(data.summonerActorId);
            return [{
                specific_uuids: [uuid],
                isCharacter: true,
                rank: data.rank,
                modifications: {
                    "system.details.level.value": data.summonerLevel,
                    "system.resources.dc.value": data.classDC,
                    "system.abilities.int.mod": data.int,
                    "system.abilities.dex.mod": data.dex,
                },
                itemsToAdd: [],
                },
            ];
        }
    }
};
