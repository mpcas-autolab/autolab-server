
var robot = require('./robot');
//robot_data = robot.return_robot_data();
//robot.makeHandle();

var list_left = [];
var list_right = [];
var list_down = [];

var list_tips_200 = [];
var list_tips_1000 = [];

var rows_200 = robot.list_data.TIP200.rows;
var cols_200 = robot.list_data.TIP200.cols;
var rows_1000 = robot.list_data.TIP1000.rows;
var cols_1000 = robot.list_data.TIP1000.cols;

for (i = 1; i < (rows_200 * cols_200 + 1); i++){
	list_left.push(generateLeftList(i));
	list_down.push(i);
	list_tips_200.push(i);
}
for (i = 1; i < (rows_1000 * cols_1000 + 1); i++){
	list_right.push(generateRightList(i));
	list_tips_1000.push(i);
}

function generateLeftList(i){
	return ( (i - 1) * cols_200 ) % (rows_200 * cols_200) + 1 * Math.ceil(i / rows_200) 
}
function generateRightList(i){
	return ( (i - 1) * cols_1000 ) % (rows_1000 * cols_1000) + ( cols_1000 + 1 - 1 * Math.ceil(i / rows_1000) ) 
}

var pipette_list = [ 
	{ 'name':20    		, 'list':list_left },
	{ 'name':200   		, 'list':list_down },
	{ 'name':1000  		, 'list':list_right },
	{ 'name':'tip_200'	, 'list':list_tips_200 },
	{ 'name':'tip_1000'	, 'list':list_tips_1000 }
];

exports.pipette_list = pipette_list;
