
var robot = require('./robot');

var micro_tube_slots = [];
var falcon_tube_slots = [];
var asp_volume_list = [];

for (i = 0; i < robot.list_data.BLOCK_MICRO.rows * robot.list_data.BLOCK_MICRO.cols; i++){
	micro_tube_slots.push({'name':"", 'list_number':"", 'tube_number':i, 'volume':0})
}

for (i = 0; i < robot.list_data.BLOCK_FALCON.rows * robot.list_data.BLOCK_FALCON.cols; i++){
	falcon_tube_slots.push({'name':"", 'list_number':"", 'tube_number':i, 'volume':0})
}


exports.getMicroTubes = function(){
	return micro_tube_slots;
}
exports.resetMicroTubes = function(n){
	micro_tube_slots[n] = {'name':"", 'list_number':"", 'tube_number':n};
}
exports.setMicroTubeVolume = function(name, volume){
	for (var n in micro_tube_slots){
		if (micro_tube_slots[n].name == name){
			micro_tube_slots[n].volume += volume;
		}
	}
}

exports.getAspList = function(){
	return asp_volume_list;
}
exports.getAspVol = function(searched_number){
	for ( n in asp_volume_list ){
		if ( asp_volume_list[n].number == searched_number){
			return asp_volume_list[n].volume;
		}
	}
	return -1;
}

exports.getFalconTubes = function(){
	return falcon_tube_slots;
}
exports.resetFalconTubes = function(n){
	falcon_tube_slots[n] = {'name':"", 'list_number':"", 'tube_number':n};
}
exports.setFalconTubeVolume = function(n, volume){
	falcon_tube_slots[n].volume = volume;
}


exports.makeList = function(list, list_number){
	var volume_list = [];
	item_list = list.item_list;
	protocol_list = list.protocol_list;

	for(n in item_list){
		if (item_list[n].name != "DISPOSAL"){
			var volume;
			if ( item_list[n].volume ) {
				volume = parseInt(item_list[n].volume);
			}
			else {
				volume = 0;
			}

			volume_list.push({'name':item_list[n].name, 'volume':volume, 'tube':item_list[n].tube, 'calcvol':volume});
		}
	}

	
	for (n in protocol_list){
		if (protocol_list[n].order == "PIP"){
			target = protocol_list[n].target;
			origin = protocol_list[n].origin;
			volume = parseInt(protocol_list[n].volume);
			for (n in volume_list){
				if (volume_list[n].name == origin){
					volume_list[n].calcvol -= volume;					
					if (volume_list[n].calcvol < -1500){
						volume_list[n].tube = 'falcon';
					}
				}
				if (volume_list[n].name == target){
					volume_list[n].calcvol += volume;
					if (volume_list[n].calcvol > 1500){
						volume_list[n].tube = 'falcon';
					}
				}
			}
		}
		else if ( protocol_list[n].order == "ASP" ){
			origin = protocol_list[n].origin;
			var initial_vol;
			var asp_vol = protocol_list[n].volume;

			if( protocol_list[n].target ){
				target = protocol_list[n].target;
				for ( p in volume_list ){
					if ( (volume_list[p].name) === (origin) ){
						initial_vol = volume_list[p].calcvol;
						break;
					}
				}
				asp_volume_list.push({
					'number': n,
					'name': target, 
					'volume': parseInt(initial_vol - asp_vol)
				});
			}

	console.log(asp_volume_list)
			for (n in volume_list){
				if (volume_list[n].name === origin){
					volume_list[n].calcvol = parseInt(protocol_list[n].volume);
				}
			}
			
		}
	}

	for (n in volume_list){
		if (volume_list[n].calcvol < 0){
			volume_list[n].volume = - volume_list[n].calcvol;
		}

		if (volume_list[n].tube == 'micro'){
			for (p in micro_tube_slots){
				if (micro_tube_slots[p].name == ''){
					micro_tube_slots[p].name = volume_list[n].name;
					micro_tube_slots[p].list_number = list_number;
					micro_tube_slots[p].tube_number = p;
					micro_tube_slots[p].volume = volume_list[n].volume;
					break;
				}
			}
		} 
		else if (volume_list[n].tube == 'falcon'){
			for (p in falcon_tube_slots){
				if (falcon_tube_slots[p].name == ''){
					falcon_tube_slots[p].name = volume_list[n].name;
					falcon_tube_slots[p].list_number = list_number;
					falcon_tube_slots[p].tube_number = p;
					falcon_tube_slots[p].volume = volume_list[n].volume;
					break;
				}
			}
		} 
	}

}
