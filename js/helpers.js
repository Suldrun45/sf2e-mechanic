import {TURRET_ACTOR_UUID} from "./consts.js";

export async function getTurret(summonerActorId) {
    const summonerActor = game.actors.get(summonerActorId);

    const defaultTurretUUID = summonerActor.getFlag("sf2e-mechanic", 'turretUUID');
      
    let turrets = game.toolbelt?.api.shareData.getSlavesInMemory(summonerActor, false).filter(act => (act?._stats?.compendiumSource === TURRET_ACTOR_UUID)).map(act => ({ name: act.name, uuid: act.uuid, selected: defaultTurretUUID && act.uuid === defaultTurretUUID }));

    if (turrets.length > 0){
      const turretUUID = turrets[0].uuid;
      await summonerActor.setFlag("sf2e-mechanic", 'turretUUID', turretUUID);
      return turretUUID;
    }
    else
    {
      turrets = game.actors
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

export  function messageItemHasRollOption(msg, roll_option) {
    return msg?.flags?.sf2e?.origin?.rollOptions?.includes(roll_option);
}

export function hasMod(actor, modUuid){
    return actor.itemTypes.effect.some(p=>p.sourceId == modUuid);
}