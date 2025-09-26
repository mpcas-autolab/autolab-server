
var robot = require('./robot');
var pipette = require('./pipetting');
var aspiration = require('./aspiration');
var movement = require('./movement');
var item_parser = require('./item_parser.js');

var micro_tubes_list;
var falcon_tubes_list;
var parsed_list = [];

exports.makeList = function(list, list_number){
	parsed_list = [];
	for(n in list){
		internalParser(list[n], list_number, n); 
	}
	return parsed_list;
}

function internalParser(command, list_number, order_number){
	var tmp_stack = [];
	
	var origin_pos = getPositionOfTube(command.origin, list_number);
	var	target_pos = getPositionOfTube(command.target, list_number);
	
	switch(command.order){

		case "ASP":
			if (!command.target) {
				target_pos = getPositionOfTube("DISPOSAL", list_number);
			}
			tmp_stack = aspiration.generateAspiration(origin_pos, target_pos, command.volume, order_number);
			item_parser.setMicroTubeVolume(command.origin, -parseInt(command.volume));
			item_parser.setMicroTubeVolume(command.target, parseInt(command.volume));
			break;

		case "PIP":
			tmp_stack = pipette.generatePipetting(origin_pos, target_pos, command.volume);
			item_parser.setMicroTubeVolume(command.origin, -parseInt(command.volume));
			item_parser.setMicroTubeVolume(command.target, parseInt(command.volume));
			break;

		case "DEC":
			tmp_stack = pipette.generatePipetting(origin_pos, target_pos, command.volume);
			item_parser.setMicroTubeVolume(command.origin, -parseInt(command.volume)); //Change command.volume to origin.volume - command.volume
			item_parser.setMicroTubeVolume(command.target, parseInt(command.volume));
			break;

		case "MOV":
			tmp_stack = movement.generateMovement(origin_pos, target_pos);
			break;

		case "CTR":
			tmp_stack = movement.generateMovement(target_pos, getCtrPos(0) );
			tmp_stack = tmp_stack.concat( createBalance(command.target, list_number) )
			tmp_stack.push( {'order':'CTR' , 'speed':command.RCF , 'time':command.time} );
			tmp_stack = tmp_stack.concat( movement.generateMovement(getCtrPos(0), target_pos) );
			tmp_stack = tmp_stack.concat( movement.generateMovement(getCtrPos(2), robot.list_data.DISPOSAL) );
			break;

		case "INC": //
		case "COL": //Fall-through
		case "HOT": //
			var	block_pos = getFreePositionInBlock(command.order);
			tmp_stack = movement.generateMovement(target_pos, block_pos);
			tmp_stack.push( {'order':command.order , 'temp':command.temp , 'time':command.time} );
			tmp_stack = tmp_stack.concat( movement.generateMovement(block_pos, target_pos) );
			break;
	}

	if( command.link ){
		tmp_stack.push( {'order':'LINK'} );
	}

	parsed_list.push(tmp_stack);
}

function getPositionOfTube(tube_name, list_number){
	var micro_tubes_list = item_parser.getMicroTubes();
	var falcon_tubes_list = item_parser.getFalconTubes();

	for (var n in micro_tubes_list){
		if (tube_name == micro_tubes_list[n].name && list_number == micro_tubes_list[n].list_number){
			return {block_name : "BLOCK_MICRO" , t_pos : micro_tubes_list[n].tube_number} 
		}
	}

	for (var n in falcon_tubes_list){
		if (tube_name == falcon_tubes_list[n].name){
			return {block_name : "BLOCK_FALCON" , t_pos : micro_tubes_list[n].tube_number} 
		}
	}
}

function createBalance(target_name, list_number){
	var micro_tubes_list = item_parser.getMicroTubes();
	var water_pos = getPositionOfTube("Water", list_number);
	var balance_volume = 0; 
	var balance_pos;

	for ( var n in micro_tubes_list ){
		if ( target_name == micro_tubes_list[n].name)	
			balance_volume = micro_tubes_list[n].volume;
	}
	for ( var n in micro_tubes_list ) {
		if ( micro_tubes_list[n].name == "Balance" ) {
			balance_pos = getPositionOfTube("Balance", list_number);
			item_parser.resetMicroTubes(n);
			break;
		}
	}
	console.log(balance_volume);
	var tmp_stack = pipette.generatePipetting(water_pos, balance_pos, balance_volume, 0);

	var balance_movement = movement.generateMovement( balance_pos, getCtrPos(2) );

	var return_stack = tmp_stack.concat( balance_movement );

	return return_stack;
}

function getCtrPos(loc){
	var ctr_angle = (Math.PI/2) + (Math.PI/2)*loc;//MEASURE ANGLE FROM CAMERA
	var data = robot.list_claw.CENTRIFUGE;

	var x = data.x + toStepsXY(data.radius * Math.cos(ctr_angle) );
	var y = data.y + toStepsXY(data.radius * Math.sin(ctr_angle) );

	return {'x':x , 'y':y , 'z':data.z};
}

function toStepsXY(mm){
	return Math.floor(10*mm);
}



var block_name_list = ["HOT","COL","INC"];
var translated_name = ["HOT_BLOCK", "COLD_BLOCK", "INCUBATOR"];
function getFreePositionInBlock(name){
	claw_data = robot.list_claw;
	var pos = block_name_list.indexOf(name);
	for (n in claw_data){
		if (translated_name[pos] == n) {
			pos = n;
			break
		}
	}
	return {'x':claw_data[pos].x , 'y':claw_data[pos].y , 'z':claw_data[pos].z};
}