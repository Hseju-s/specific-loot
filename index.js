const Command = require('command');

module.exports = function AutoPickup(dispatch) {
	const command = Command(dispatch);

    const essence = [98513],//98513 // 8023 mp mote
    	  otherworldy_shard = [98521],
          veil = [98590],
          veilessence = [98513, 98590],
    	  all = [98513, 98521, 98590];

    let pickup = true,
        playerId = -1,
        interval = 150,
        location,
        loot = {},
    	LootThis = veil,
        lootInterval = pickup ? setInterval(tryLoot, interval) : clearInterval(lootInterval),
		essence_count = 0,
        veil_count = 0,
		shard_count = 0;

    command.add('pickup', arg => {
    	arg = arg.toLowerCase();
        if(arg === 'off'){
            pickup = false;
        	command.message(' Auto-Pickup disabled.');
        	clearInterval(lootInterval);
        }
        else if(arg === 'essence'){
            pickup = true;
        	LootThis = essence;
        	command.message(' Auto-Picking Essence.');
        }
        else if(arg === 'veil'){
            pickup = true;
            LootThis = veil;
            command.message(' Auto-Picking Veil.');
        }
        else if(arg === 'veil+essence'){
            pickup = true;
            LootThis = veilessence;
            command.message(' Auto-Picking Veil and Essence.');
        }
        else if(arg === 'shard'){
            pickup = true;
        	LootThis = otherworldy_shard;
        	command.message(' Auto-Picking Otherworldly Shards.');
        }
        else if(arg === 'all'){
            pickup = true;
        	LootThis = all;
        	command.message(' Auto-Picking all.');
        }
        lootInterval = pickup ? setInterval(tryLoot, interval) : clearInterval(lootInterval);
 	});

    const dist3D = (loc1, loc2) => Math.sqrt(Math.pow(loc2.x - loc1.x, 2) + Math.pow(loc2.y - loc1.y, 2) + Math.pow(loc2.z - loc1.z, 2));
    
    const dropCount = () => {
        if(essence_count != 0 || shard_count != 0 || veil_count != 0){
            if(LootThis.length > 1) command.message(' ' + essence_count + ' Essences, ' + shard_count + ' Otherworldly Shards and ' + veil_count + ' Veilthroch.');
            else if(LootThis[0] === essence[0]) command.message(' ' + essence_count + ' Essences.');
            else if(LootThis[0] === otherworldy_shard[0]) command.message(' ' + shard_count + '  Otherworldly Shards.');
            else if(LootThis[0] === veil[0]) command.message(' ' + veil_count + ' Veilthroch.');
            essence_count = 0;
            shard_count = 0;
            veil_count = 0;
        }
    }

    function tryLoot() {
        for(let item in loot){
            if(dist3D(location, loot[item].loc) < 120) {
                dispatch.toServer('C_TRY_LOOT_DROPITEM', 1, { id: loot[item].gameId });
            }
        }
    }

    dispatch.hook('S_LOGIN', 10, event => { playerId = event.playerId });

	dispatch.hook('S_LOAD_TOPO', 3, event => {
		location = event.loc;
		loot = {};
	});

	dispatch.hook('C_PLAYER_LOCATION', 5, event => { location = event.loc });
	dispatch.hook('S_RETURN_TO_LOBBY', 'raw', () => { loot = {} });

    dispatch.hook('S_SPAWN_DROPITEM', 6, (event) => {
		//console.log(event.id)
        if(LootThis.includes(event.item) && event.owners.some(owner => owner.playerId === playerId)){
        	if(essence.includes(event.item)) essence_count++;
        	if(otherworldy_shard.includes(event.item)) shard_count++;
            if(veil.includes(event.item)) veil_count++;
			loot[event.gameId.toString()] = Object.assign(event);
            setInterval(dropCount, 1000);
		}
    }); 
    
    dispatch.hook('S_DESPAWN_DROPITEM', 4, event => {
        delete loot[event.gameId.toString()];
    });
}
