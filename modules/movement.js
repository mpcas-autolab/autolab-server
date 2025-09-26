
var robot = require('./robot');

var tmp_list;
var claw_data = robot.list_claw;

exports.generateMovement = function(ori,tar){
	tmp_list = []; 
	
	if( ori.block_name ){
		ori = getClawCoordsFromPos(ori);
	}
	if( tar.block_name ) {
		tar = getClawCoordsFromPos(tar);
	}
	
	tmp_list.push({ 'order':'CLW' , 'PWM':claw_data.CLAW.openSmall });   																					
	tmp_list.push({ 'order':'MTR' , 'x':ori.x, 'y':ori.y, 'z':ori.z });   
	tmp_list.push({ 'order':'CLW' , 'PWM':claw_data.CLAW.closed});   																						
	tmp_list.push({ 'order':'MTR' , 'x':tar.x, 'y':tar.y, 'z':tar.z });   
	tmp_list.push({ 'order':'CLW' , 'PWM':claw_data.CLAW.openSmall});  																				
	tmp_list.push({ 'order':'MTR' , 'x':tar.x, 'y':tar.y, 'z':0});  
	tmp_list.push({ 'order':'CLW' , 'PWM':claw_data.CLAW.openFull});  	 																					
	
	return tmp_list;
}

function getClawCoordsFromPos(pos){
	var data = claw_data[pos.block_name];
	x = data.x + data.offX * Math.floor(pos.t_pos / data.rows);
	y = data.y + data.offY * (pos.t_pos % data.rows)
	return {'x':x, 'y':y, 'z':data.z}
}