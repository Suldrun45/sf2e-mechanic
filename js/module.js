const SOURCES = {
    MECHANIC:{
        DEPLOY_TURRET: "Compendium.starfinder-field-test-for-pf2e.sf2e-actions.Item.1vWiNk1jbqCq4O16"     
    }
}

const TURRET_ACTOR_UUID = "Compendium.sf2e-mechanic.actors.Actor.NnHJk3FnfhVRLVHp"

const SOURCE_UUIDS = getAllSourceUUIDs();

function getAllSourceUUIDs() {
    const uuids = new Set();
    for (const category of Object.values(SOURCES)) {
      for (const uuid of Object.values(category)) {
        uuids.add(uuid);
      }
    }
    return uuids;
  }

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
});

function messageItemHasRollOption(msg, roll_option) {
    return msg?.flags?.sf2e?.origin?.rollOptions?.includes(roll_option);
}
  
async function getSpecificSummonDetails(
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

async function getTurret(summonerActorId) {
    const summonerActor = game.actors.get(summonerActorId);
    const defaultTurretUUID = summonerActor.getFlag("sf2e-mechanic", 'turretUUID');

    const turrets = game.actors
        .filter(act =>
            act.type === 'npc' &&
            (act?._stats?.compendiumSource === TURRET_ACTOR_UUID) &&
            getNonGMOwnerStringified(act) === getNonGMOwnerStringified(summonerActor)
        )
        .map(act => ({ name: act.name, uuid: act.uuid, selected: defaultTurretUUID && act.uuid === defaultTurretUUID }));

    if (turrets.length === 1) {
        const turretUUID = turrets[0].uuid;
        await summonerActor.setFlag("sf2e-mechanic", 'turretUUID', turretUUID);
        return turretUUID;
    } else if (turrets.length > 1) {
        warnNotification("Too many turrets found.");
    }
    return null;
}

function getNonGMOwnerStringified(actor) {
    return JSON.stringify(
        Object.entries(actor?.ownership ?? {})
            .filter(owner =>
                owner[1] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER &&
                owner[0] !== game.users?.activeGM?.id
            )
            .map(owner => owner?.[0])
            .toSorted()
    )
}

async function summon(
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
  
    const summonerItem = config?.item ?? (await fromUuid(itemUuid));
  
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

  const postSummonHelper = {
    DEPLOY_TURRET: async(summonedActorID, actorUpdateData) => {
        const actor = game.actors.get(summonedActorID);
        await actor.update(actorUpdateData);
    },
  };