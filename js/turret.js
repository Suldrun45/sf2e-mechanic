import {hasMod} from "./helpers.js";
import {LONG_RANGE_PROPULSORS_TURRET_UUID, BIG_BOOM_TURRET_UUID} from "./consts.js";

export async function setTurretAttacks(turret, arrayType, intelligence, level, weaponGrade){
    const classDC = getClassDC(turret, intelligence, level);
    let range = getArrayRange(arrayType);
    const grade = getGradeValue(weaponGrade);

    if (hasMod(turret, LONG_RANGE_PROPULSORS_TURRET_UUID)){
        range += 30;
    }
    const hasBigBoom = hasMod(turret, BIG_BOOM_TURRET_UUID);

    const actions = turret.system.actions;
    await actions.forEach(async (action) =>  {
        const updateData = {};
        if (action.type=="area-fire"){
            let area = range / 2;
            if (hasBigBoom){
                if (action.item.system.area.type=="line")
                    area += 10;
                else
                    area += 5;
            }
            updateData['system.area.value'] = area;
            updateData['system.bonus.value'] = classDC - 10 + grade;
        }
        else if (action.type=="strike" && action.slug == "turret-weapon"){
            updateData['system.range.increment'] = range;
        }
        await action.item.update(updateData);
    });
    await turret.update({"system.resources.dc.value": classDC});
};

function getClassDC(turret, intelligence, level){
    let dc = intelligence + level + 10 + 2;
    if (level >= 9)
        dc += 2;
    if (level >= 17)
        dc += 2;
    return dc;
}

function getArrayRange(arrayType){
    switch (arrayType) {
        case "chaingun":
            return 90;
        default:
            return 60;
    }
}

function getGradeValue(grade){
    switch (grade){
        case "tactical":
        case "advanced":
            return 1;
        case "superior":
        case "elite":
            return 2;
        case "ultimate":
        case "paragon":
            return 3;
        default:
            return 0;
    }
}