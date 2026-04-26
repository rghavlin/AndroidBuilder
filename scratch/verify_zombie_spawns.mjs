
function calculateSpawns(mapNumber) {
    let basicCount;
    if (mapNumber === 1) basicCount = 18;
    else if (mapNumber === 2) basicCount = 24;
    else if (mapNumber === 3) basicCount = 25;
    else basicCount = 25 + (mapNumber - 3) * 2;

    const extraFat = Math.floor(mapNumber / 3);
    const extraCrawler = Math.floor(mapNumber / 3);
    const extraAcid = Math.floor(mapNumber / 4);

    let crawlerRange = { min: 3 + extraCrawler, max: 6 + extraCrawler };
    
    let acidRange;
    if (mapNumber === 1) acidRange = { min: 0, max: 0 };
    else if (mapNumber === 2) acidRange = { min: 1 + extraAcid, max: 2 + extraAcid };
    else acidRange = { min: 2 + extraAcid, max: 3 + extraAcid };

    let fatRange;
    if (mapNumber === 1) fatRange = { min: 0, max: 0 };
    else fatRange = { min: 2 + extraFat, max: 3 + extraFat };

    return {
        mapNumber,
        basicCount,
        crawlerRange,
        acidRange,
        fatRange,
        extraFat,
        extraAcid
    };
}

console.log("--- Spawning Simulation ---");
for (let i = 1; i <= 10; i++) {
    console.log(JSON.stringify(calculateSpawns(i), null, 2));
}
