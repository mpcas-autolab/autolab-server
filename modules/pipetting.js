
var robot = require('./robot');
var p_tips = require('./pipette_tips').pipette_list;
var item_parser = require('./item_parser.js');


var tip_list_index;
var tip_number;
var box;
var tmp_list;
var pip_mod;

exports.generatePipetting = function(ori, tar, fl_vol, mix, visc, recall){
	
	// Handle too large volumes
	if ( !recall ){
		tmp_list = [];
	}
	if ( fl_vol > 1000 ){
		this.generatePipetting(ori, tar, 1000, mix, visc, recall);
		fl_vol -= 1000;
	}

	// Calculate some variables used later
	decideVariables(fl_vol); 
	ori_pos = getPipCoordsFromPos( ori, fl_vol );
	tar_pos = getPipCoordsFromPos( tar, fl_vol );

	getTip();	
	pushOutVolume( fl_vol );
	moveTo( ori_pos );

	// Pipette up and down for low viscosity Volumes.
	if ( visc ){
		for (var i = 0; i < 3; i++) {  
			takeInVolume( fl_vol );   
			pushOutVolume( fl_vol );  
		}
	}

	takeInVolume( fl_vol );
	moveTo( tar_pos );
	pushOutVolume( fl_vol );  
	
	// Mixing, use instead of vortexing
	if ( mix ){
		for (var i = 0; i < 3; i++) {
			takeInVolume( fl_vol );   
			pushOutVolume( fl_vol );  
		}
	}

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



function getStepsFromVolume(fl_vol){
	return Math.floor( 320 * 1000 * fl_vol / ( 476 * pip_data.TIP.volume ) ); // Empirically measured formula
}
function pushOutVolume(fl_vol){
	tmp_list.push( { 'order':'PIP', 'steps':getStepsFromVolume(fl_vol) , 'direction':1 } );
}
function takeInVolume(fl_vol){
	tmp_list.push( { 'order':'PIP', 'steps':getStepsFromVolume(fl_vol) , 'direction':0 } );
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


function getPipCoordsFromPos(pos){
	var data = robot.list_data[pos.block_name];
	var pd = pip_data[pos.block_name]
	var x = pd.x + data.offX * Math.floor(pos.t_pos / data.rows);
	var y = pd.y + data.offY * (pos.t_pos % data.rows)
	return {'x':x, 'y':y, 'z':pd.z}
}