
exports.list_20ul = {	//Checked
	'TIP'			: { 'x':465 	, 'y':45 	, 'z':6150 , 'volume':200 }, 
	'BLOCK_MICRO'	: { 'x':2900 	, 'y':795 	, 'z':4200 },  
	'BLOCK_FALCON' 	: { 'x':3000 	, 'y':1000 	, 'z':4450 } 
};
	

exports.list_200ul = {//Checked	
	'TIP'			: { 'x':275 	, 'y':185 	, 'z':6100 , 'volume':200 },   
	'BLOCK_MICRO'	: { 'x':2710 	, 'y':970 	, 'z':4100 }, 
	'BLOCK_FALCON' 	: { 'x':2825 	, 'y':250 	, 'z':4450 } 
};//3360 to filter

exports.list_1ml = {//Checked
	'TIP' 			: {	'x':1550 	, 'y':1315 	, 'z':5500 , 'volume':1000 },  
	'BLOCK_MICRO' 	: {	'x':2900 	, 'y':1135 	, 'z':3220 },  
	'BLOCK_FALCON' 	: { 'x':3000 	, 'y':400 	, 'z':4450 } 
};//2340 to filter (1000 from 200ul??)

exports.list_claw = { //Checked
	'CLAW' 			: { 'openFull':1000  	 , 'openSmall':1860			, 'closed':2500 }	,
	'CENTRIFUGE' 	: {	'x':960  , 'y':2880  , 'z':3860 , 'radius':34 	},
	'BLOCK_MICRO' 	: {	'x':2805 , 'y':35    , 'z':3500 , 'offX':260 	, 'offY':127 ,  'rows':5	, 'cols':8  }, 
	'HOT_BLOCK' 	: {	'x':1440 , 'y':1280  , 'z':4850 , 'offX':310 	, 'offY':120	, 'rows':4 		, 'cols':2 },  
	'COLD_BLOCK' 	: {	'x':750  , 'y':1265  , 'z':4850 , 'offX':310 	, 'offY':120	, 'rows':4 		, 'cols':2 }, 
	'INCUBATOR' 	: {	'x':2460 , 'y':3040	 , 'z':2400	, 'offX':275 	, 'offY':155	, 'rows':3		, 'cols':3 }
};

exports.list_data = {
	'TIP200' 		: {	'offX':90 	, 'offY':90	 ,	'rows':8 	, 'cols':12 , 'volume':200  }, 
	'TIP1000' 		: { 'offX':90 	, 'offY':90	 ,  'rows':8 	, 'cols':12 , 'volume':1000 },
	'BLOCK_MICRO'	: { 'offX':260 	, 'offY':127 ,  'rows':5	, 'cols':8  },
	'BLOCK_FALCON'	: { 'offX':315	, 'offY':0 	 ,  'rows':1	, 'cols':5  },
	'DISPOSAL' 		: { 'x':5950 	, 	'y':430  , 	'z':6000 	, 'clwY':0	},
	'HOME' 			: {	'x':0 		, 	'y':0 	 , 	'z':0 		}
};

exports.asp_lin_formula = function(vol){
	return ( 1.8698 + 0.0426*vol);
}
exports.asp_pol2_formula = function(vol){
	return (0.112*vol + 0.2779 - 0.0004*Math.pow(vol,2));
}
exports.asp_pol3_formula = function(vol){
	return ( 0.1091 + 0.1388*vol - 0.0011* Math.pow(vol,2) + .000005*Math.pow(vol,3) );
}
exports.asp_offsets = {
	'10': 10,
	'15': 15,
	'20': 20,
	'25': 25,
	'30': 30,
	'35': 35,
	'40': 40,
	'45': 45,
	'50': 50,
}
