
/* STARTUP MESSAGE */
var colors = {
	"clear":'\033c\n',
    "end": '\033[0m',
    "red": '\033[91m',
    "bone_blue": '\033[92m',
    "yellow": '\033[93m',
    "blue": '\033[94m',
    "pink": '\033[95m',
    "light_blue": '\033[96m'
}


exports.out = function(out_data, color_key, depth){
	/* This method only works on windows CMD or PowerShell, check if OS is windows */
	if ( process.platform == "win32" & color_key){
		
		/* Check if eligible color, output available colors if incorrect input */
		var color_Flag = 1;
		for ( n in colors ){
			if( color_key == n ){
				color_Flag = 0;
			}
		}
		if( color_Flag ){
			console.log(color_key + " incorrect colors")
		} else{
			/* Set color for the message, write the message, reset color */
			console.log( colors.color_key );
			if ( depth )
				var indent = Array(depth*2 + 1).join(" ");
			else 
				var indent = " ";
			console.log( indent + out_data );
			console.log( colors.white )
		}
	} 
	/*If not windows, just print the message */
	else {
		console.log(out_data);
	}
}


exports.title = function(out_data, color_key){

	/* This method only works on windows CMD or PowerShell, check if OS is windows */
	if ( process.platform == "win32" && color_key ){

		var color_Flag = 1;
		for ( n in colors ){
			if( color_key == n){
				color_Flag = 0;
			}
		}

		if( color_Flag ){
			console.log(color_key + " incorrect colors")
		} else{
			/* Set color, indent, output message, reset color */
			console.log( colors[color_key] );
			var underline = Array(out_data.length + 3).join("-");
			console.log( "    " + out_data + "\n   " + underline  );
			console.log( colors.end )
		}
	} 

	/*If not windows, just print the message */
	else {
		console.log("   " + out_data + '\n');
	}
}


exports. clearHistory = function (){
	if ( process.platform == "win32" ){
		console.log(colors.clear);
	}
}