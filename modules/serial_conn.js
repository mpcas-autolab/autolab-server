serialport = require('serialport');
filesys = require('fs');

var ascii_colors = {	
	"end":'\033[0m',
	"yellow":'\033[93m',
	"light_blue":'\033[96m',
	"red":'\033[31m',
	"blue":'\033[92m',
	"bone_blue":'\033[94m',
	"pink":'\033[95m' 	
} 

var port = [];
var callback;
var serial_timeout;
cl = console.log;

exports.findSerial = function(cb_fn){ //Function for detecting MCUs , if such an MCU is found a connection is opened and the MCU is identified
	callback = cb_fn; //Save callback given as argument
	serialport.list(function (err, ports) {
		var port_index = 0;
		var port_name = [];
		ports.forEach(function(pt) {
			if (pt./*vendorId*/manufacturer== /*"2341"*/ "wch.cn") //If an arduino (MCU of choice) uses the CH340 usb to serial chip it has a manufacturer ID of "wch.cn". This is very common among counterfeits 
				port_name[port_index++] = pt.comName; //Save the port name if the unit is an arduino
		});
		if (port_name.length){
			cl(ascii_colors.light_blue + " Identifying peripherals" );
			for (n in port_name)
				cl("   - " + port_name[n])
			cl(ascii_colors.end);
			COM(port_name,0); //Send the list containing port names to the function that identifies them
		}
		else{
			cl(ascii_colors.red + ' No units connected' + ascii_colors.end)
			callback(0); //If no MCU:s were found, return NULL list
		}
	});
};

function COM(port_name, i){ //Function for identifying a MCU mastercl('');
	port[i] = new serialport(port_name[i], {baudRate:115200}); //Opens up the i:th port in the port list
	port[i].on('error', function(err){
		cl(err)
	});
	port[i].on ('data', getData); //Defines a function to callback if data is received from a serial unit
	opening_timeout = setTimeout(function(){ //First timeout is due to DTR reseting the arduino when the port is opened, the arduino requires about 1700ms to reset and be ready to receive data
		port[i].write("IDT"); //Send the string "IDT" to the MCU, if a correct master, it will return "MS", a slave returns "SL"
		querying_timeout = setTimeout(function(){	//Second timeout is for cases where the unit does not reply, if no reply is given within 200ms the connection is terminated and the next unit is tried
			port[i].close();
			cl(ascii_colors.light_blue + "\n No response from " + port_name[i] + ascii_colors.end);
			delete port[i];
			moveOn(i);
		}, 200);
		
	}, 2000);

	function getData(data) { //Callback function for handling data received from the units
		clearTimeout(querying_timeout); //Interrupt the serial_timeout function
		clearTimeout(opening_timeout);
		port[i].close();
		delete port[i];

		if ( data.equals(Buffer("MS")) ) {
			cl(ascii_colors.light_blue + " \n  " + " " + port_name[i] + " identified as master MCU" + ascii_colors.end);
			callback(port_name[i]);
		} 
		else if ( data.equals(Buffer("SL")) ){
			cl(ascii_colors.light_blue + "\n Unit at " + port_name[i] + " identified as slave." + ascii_colors.end);
		} 
		else{
			cl(ascii_colors.light_blue + " Unknown response from " + port_name[i] + ascii_colors.end)
			moveOn(i);
		}

	}

	function moveOn(i){
		if (port_name.length > (i+1))
			COM(port_name, ++i);		
		else{
			callback(0);
			cl(ascii_colors.red + "\n No MCU found" + ascii_colors.end)
		}
	}

}