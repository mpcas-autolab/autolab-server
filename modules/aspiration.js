
var robot = require('./robot');
var p_tips = require('./pipette_tips').pipette_list;
var item_parser = require('./item_parser.js');


var tip_list_index;
var tip_number;
var box;
var tmp_list;
var pip_mod;

exports.generateAspiration = function(ori, tar, asp_vol, order_number, visc, recall){

	// Handle too large volumes
	if ( !recall ){
		tmp_list = [];
	}
	if ( asp_vol > 1000 ){
		this.generateAspiration(ori, tar, 1000, order_number, visc, recall);
		asp_vol -= 1000;
	}

	// Calculate some variables used later
	pip_vol =  item_parser.getAspVol(order_number);
	if ( pip_vol === -1 ){
		console.log("error getting asp volume");
		return -1;
	}
	decideVariables(asp_vol); 
	ori_pos = getAspCoordsFromPos( ori, asp_vol );
	tar_pos = getAspCoordsFromPos( tar, asp_vol );


	getTip();	
	pushOutVolume( asp_vol );
	moveTo( ori_pos );

	// Pipette up and down for low viscosity fluids.
	if ( visc ){
		for (var i = 0; i < 3; i++) {  
			takeInVolume( asp_vol );   
			pushOutVolume( asp_vol );  
		}
	}

	takeInVolume( asp_vol );
	moveTo( tar_pos );
	pushOutVolume( asp_vol );  
	disposeTip();

	return tmp_list;
}


function decideVariables(volume){
	if(volume <= 200){
		pip_mod = robot.list_data.TIP200;
		pip_data = robot.list_200ul;
		if (volume <= 20){
			pip_data = robot.list_20ul;
			tip_list_index = 0;
		}
		else{
			tip_list_index = 1;
		}
	}
	else{
		pip_mod = robot.list_data.TIP1000;
		pip_data = robot.list_1ml;
		tip_list_index = 2;
	}
}



function getStepsFromVolume(asp_vol){
	return Math.floor( 320 * 1000 * asp_vol / ( 476 * pip_data.TIP.volume ) ); // Empirically measured formula
}
function pushOutVolume(asp_vol){
	tmp_list.push( { 'order':'PIP', 'steps':getStepsFromVolume(asp_vol) , 'direction':1 } );
}
function takeInVolume(asp_vol){
	tmp_list.push( { 'order':'PIP', 'steps':getStepsFromVolume(asp_vol) , 'direction':0 } );
}
function moveTo(g){
	tmp_list.push( {'order':'MTR', 'x':g.x, 'y':g.y, 'z':g.z } );
}

function getTip(){
	var box = 3;
	if( tip_list_index == 2){
		box = 4;
	}

	for (n in p_tips[tip_list_index].list){
		index = p_tips[box].list.indexOf(p_tips[tip_list_index].list[n]);
		if (index > -1){
			tip_number = p_tips[box].list.splice(index,1);
			break;
		}
	}
	var x = pip_data.TIP.x + pip_mod.offX * ( Math.floor( (tip_number - 1) / pip_mod.cols ) );
	var y = pip_data.TIP.y + pip_mod.offY * ( (tip_number - 1) % pip_mod.cols );

	tmp_list.push( { 'order':'MTR', 'x':x, 'y':y, 'z':pip_data.TIP.z } );
}

function disposeTip(){
	tmp_list.push({ 'order':'MTR', 'x':robot.list_data.DISPOSAL.x, 'y':robot.list_data.DISPOSAL.y, 'z':robot.list_data.DISPOSAL.z });
	tmp_list.push({ 'order':'PIP', 'steps':3000 , 'direction':0 });
}


function getAspCoordsFromPos(pos, vol){
	var data = robot.list_data[pos.block_name];
	var pd = pip_data[pos.block_name];
	var x = pd.x + data.offX * Math.floor(pos.t_pos / data.rows);
	var y = pd.y + data.offY * (pos.t_pos % data.rows);

	return {'x':x, 'y':y, 'z':pd.z +  robot.asp_lin_formula(vol) };
}