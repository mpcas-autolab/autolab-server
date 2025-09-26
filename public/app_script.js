var socket = io.connect('http://localhost:80');

var protocol_list = [];
var item_list = [];
var selected_block = 0;  
var block_creation = false;
var last_focused = 0;
var edit_flag = false;
var copyableActionBlock = 0;
var water_flag = false; 
var list_modal_visible = false; 
var input_modal_visible = false;
var is_saved = false;
var last_loaded_list = "";

function admitList(){		
	var combined_list = {protocol_list, item_list};
	socket.emit('admitList', combined_list);	
	console.log(combined_list)
}


var scroll_left
var block_div = document.getElementById('timelineBlocks')
document.getElementById('timelineLeftScroll').onmouseover = function() {
	scroll_left = setInterval(function(){
		if(block_div.scrollLeft < 10)
			block_div.scrollLeft = 0;
		else
			block_div.scrollLeft -= 10;
	},15);
}
document.getElementById('timelineLeftScroll').onmouseout = function() {
	clearInterval(scroll_left);
}
document.getElementById('timelineLeftScroll').onclick = function() {
	block_div.scrollLeft -= 320;
}


var scroll_right
document.getElementById('timelineRightScroll').onmouseover = function() {
	scroll_right = setInterval(function(){
		//if(block_div.scrollLeft > 10)
		block_div.scrollLeft += 10;
	},15);
}
document.getElementById('timelineRightScroll').onmouseout = function() {
	clearInterval(scroll_right);
}
document.getElementById('timelineRightScroll').onclick = function() {
	block_div.scrollLeft += 320;
}









/******* COLOR LIST *******/
yellow_400 		= "#FFF176";
yellow_500		= "#FFEB3B";
yellow_600		= "#FDD835";
amber_200		= "#FFE082"
amber_500		= "#FFC107";
amber_600		= "#FFB300";
orange_500		= "#FF9800";
orange_100 		= "#FFE0B2";
green_500		= "#8BC34A";
light_green_A200 = "#B2FF59";
light_green_300 = "#AED581";

blue_500 		= "#2196F3";
blue_600 		= "#1E88E5";
blue_grey_300	= "#90A4AE";
blue_grey_500 	= "#607D8B";
light_blue_500	= "#03A9F4";
light_blue_100  = "#B3E5FC";
cyan_400 		= "#26C6DA";

indigo_500 		= "#3F51B5";
deep_purple_500	= "#673AB7";
purple_500 		= "#9C27B0";
purple_400 		= "#AB47BC";
ASPR_COLOR 		= "#a947ba";
red_500 		= "#F44336";

var block_colors = { CTR:amber_600, PIP:blue_600, INC:green_500, HOT:red_500, COL:cyan_400, ASP:ASPR_COLOR }


/******* CREATE ITEM LIST *******/
var name_number = 1;
function addItemToList(in_name, vol){
	if(!in_name){
		var name = document.getElementById('item_name').value;
	} else {
		name = in_name;
	}
	//name = in_name   ?   in_name   :   document.getElementById('item_name').value ;

	for (n in item_list){
		if (name == item_list[n].name){
			if ( item_list[n].name.slice(1,2) === ">" ){
				name_number = parseInt(item_list[n].name.slice(0,1)) + 1;
				var incremented_name =  name_number + ">" + item_list[n].name.slice(2,20);
				return addItemToList(incremented_name, vol ? vol: 0);
			} 
			else {
				var numbered_name =  name_number + ">" + name;
				name_number += 1;
				return addItemToList(numbered_name, vol ? vol: 0);
			}
		}
	}
	name_number = 1;

	document.getElementById('item_name').value = '';
	if (name){
		if (!in_name){
			var volume = document.getElementById('item_volume').value;
		} else {
			volume = vol;
		}
		document.getElementById('item_volume').value = '';
		if (!volume) {
			volume = 0;
		}

		if ( document.getElementById('falcon_tube').checked ){
			var tube = "falcon"
		}
		else{
			var tube = "micro"
		}

		var temp_list = {"name":name, "keep":true, "tube":tube, "volume":volume}
		if ( vol ){
			temp_list.volume = vol;
		}
		item_list.push(temp_list)
	}
	makeItemInList();
	return name;
}
function makeItemInList(){
	document.getElementById('rightWindowList').innerHTML = '';
	for (var s in item_list) {	
		var newdt = document.createElement('dt');
		newdt.draggable = "true";
		newdt.id = "dt_id_" + (parseInt(s)+1);
		var name = item_list[s].name;
		var keep = item_list[s].keep;

		var box = document.createElement('input');
		box.type = 'checkbox';
		box.id = "item_" + (parseInt(s)+1);

		var label = document.createElement('label');
		label.htmlFor = "item_" + (parseInt(s)+1);

		var name_field = document.createElement('span');
		name_field.className = "rightWindowListItemNameField";
		name_field.name = name;
		name_field.style.width = 'calc(100% - 100px)';
		name_field.style.display = 'inline-block';
		name_field.innerHTML = name.slice(0,10);
		name_field.onclick = function(){
			if (!block_creation){
				this.previousSibling.checked = !this.previousSibling.checked;
			}
			else{
				if (last_focused.tagName == "INPUT"){
					last_focused.value = this.name;
					if(last_focused.nextSibling){
						last_focused.nextSibling.focus();
					}
					else{
						//Make action block
					}
				}
			}
			selected_name = name_field.name;
		}

		edit_icon = document.createElement('img');
		edit_icon.src = "images/edit.png";
		edit_icon.className = "rightMenuEditIcon";
		edit_icon.value = (parseInt(s));
		edit_icon.onclick = function(){
			editItem(this.parentNode);
		}

		keep_icon = document.createElement('div');
		keep_icon.className = "circle";
		if (Boolean(keep) == 0){
			keep_icon.style.backgroundColor = amber_200;
		}
		else {
			keep_icon.style.backgroundColor = light_green_300;
		}

		keep_icon.onclick = function(){
			item_id_number = this.parentNode.id.slice(6)-1;	
			item_list[item_id_number].keep = !item_list[item_id_number].keep;

			if (rgb2hex(this.style.backgroundColor) == amber_200)
				this.style.backgroundColor = light_green_300;
			else 
				this.style.backgroundColor = amber_200;
		}

		newdt.className = "rightWindowListElement";
		newdt.appendChild(box);
		newdt.appendChild(label);
		newdt.appendChild(name_field);
		newdt.appendChild(keep_icon)
		newdt.appendChild(edit_icon);
		document.getElementById('rightWindowList').appendChild(newdt);
	}
}
function removeCheckedItems(){
	var parent = document.getElementById('rightWindowList');
	var children = parent.children;
	for (var i = children.length - 1; i >= 0; i--){
		if (children[i].children[0].checked){
			item_list.splice(i,1);
		}
	}
	makeItemInList();
	var box = document.getElementById('item_menu_checkbox');
	box.checked = false;
}
function itemMenuCheckbox(){
	var box = document.getElementById('item_menu_checkbox');
	var parent = document.getElementById('rightWindowList');
	var children = parent.children;
	for (var i = 0; i < children.length; i++){
		if (box.checked){
			children[i].children[0].checked = true;
		}
		else{
			children[i].children[0].checked = false;
		}
	}
}
function onItemChange(){
	var key = window.event.keyCode;
	if (key == 13){
		addItemToList();
		document.getElementById('item_name').focus();
	}
}
function falconBox(){
	document.getElementById('item_name').focus();
}
function editItem(e){
	modal = document.getElementById('inputModal');
	modal.innerHTML = '';
	modal.style.display = 'block';
	input_modal_visible = true;

	var span = document.createElement('div');
	span.innerHTML = "X ";
	span.className = "modal_X";
	span.onclick = function(){
		this.parentNode.style.display = 'none';
		input_modal_visible = false;
	}
	modal.appendChild(span);

	tmp_input1 = document.createElement('input');
	tmp_input1.type = "text";
	tmp_input1.onfocus = lastFocused;
	tmp_input1.placeholder = "Name";

	tmp_input2 = document.createElement('input');
	tmp_input2.type = "text";
	tmp_input2.onfocus = lastFocused;
	tmp_input2.placeholder = "Volume (Optional)";

	tmp_input3 = document.createElement('input');
	tmp_input3.type = "checkbox";
	tmp_input3.onfocus = lastFocused;
	tmp_input3.id = "item_edit_ID";

	var label = document.createElement('label');
	label.htmlFor = "item_edit_ID";

	var span = document.createElement('span');
	span.innerHTML = " Falcon";

	function tmpOnclick(){
		if (window.event.keyCode == 13){
			item_list[e.children[4].value].name = modal.children[1].value;
			item_list[e.children[4].value].volume = modal.children[2].value;
			item_list[e.children[4].value].falcon = modal.children[3].checked;
			input_modal_visible = false;
			modal.style.display = "none";
			makeItemInList();
		}
	}

	tmp_input1.onkeypress = tmpOnclick;
	tmp_input2.onkeypress = tmpOnclick;
	tmp_input3.onkeypress = tmpOnclick;

	modal.appendChild(tmp_input1);
	modal.appendChild(tmp_input2);
	modal.appendChild(tmp_input3)
	modal.appendChild(label);
	modal.appendChild(span);
}





/******* CREATE ACTION BLOCKS *******/
function lastFocused(){
	last_focused = this;
}
var block_list = [
{order:"CTR", len:"5", link:"false", target:"target (Click item list)", RCF:"RCF (g)", time:"seconds"},
{order:"PIP", len:"6", link:"false", origin:"origin (Click item list)", target:"target (Click item list or write new name)", volume:"volume (ul)", viscous:""},
{order:"INC", len:"5", link:"false", target:"target (Click item list)", temp:"30", time:"minutes"},
{order:"HOT", len:"5", link:"false", target:"target (Click item list)", temp:"42", time:"minutes"},
{order:"COL", len:"5", link:"false", target:"target (Click item list)", temp:"4", time:"minutes"},
{order:"ASP", len:"4", link:"false", origin:"Origin (Click item list)", volume:"volume left (ul)", save:""}
];
var exceptions = ["order","len","viscous","link","save"];
function addBlockInput(tmp_order){
	block_creation = true;
	modal = document.getElementById('inputModal');
	modal.innerHTML = '';
	modal.style.display = 'block';
	input_modal_visible = true;

	var span2 = document.createElement('span');
	var span1 = document.createElement('span');
	span1.innerHTML = "X";
	span1.className = "modal_X";
	span2.onclick = function(){
		this.parentNode.style.display = 'none';
		input_modal_visible = false;
	}
	span2.appendChild(span1)
	span2.innerHTML += " " + tmp_order;
	modal.appendChild(span2);

	for (n in block_list){
		if(tmp_order == block_list[n].order){
			var m = 0;
			for (p in block_list[n]){
				m++;
				//if(!p.indexOf(exceptions)){
				if (p != "order" && p != "len" && p != "viscous" && p != "link" && p!= "save"){
					tmp_input = document.createElement('input');
					tmp_input.type = "text";
					tmp_input.id = "input_" + p;
					tmp_input.onfocus = lastFocused;
					tmp_input.placeholder = block_list[n][p];
					if (edit_flag){
						tmp_input.value = protocol_list[selected_block][p];
					}
					tmp_input.onkeypress = function(){
						if (window.event.keyCode == 13){
							addActionBlock(tmp_order);
							if(tmp_order == "CTR"){
								for (n in item_list){
									if ( item_list[n].name == "Water" ){
										water_flag = true;	
									}
								}
								if (!water_flag){
									item_list.push({"name":"Water", "keep":false, "tube":"falcon", "volume":10000})
								}
								item_list.push({"name":"Balance", "keep":false, "tube":"micro", "volume":0})
								makeItemInList();
							}
						}
					}
					modal.appendChild(tmp_input);
				}
				if(p == "viscous"){
					tmp_input = document.createElement('input');
					tmp_input.type = "checkbox";
					tmp_input.id = "input_" + p;
					tmp_input.onclick = function(){
						last_focused.focus();
					}
					modal.appendChild(tmp_input);
				}
				if(p == "save"){
					tmp_input = document.createElement('input');
					tmp_input.type = "checkbox";
					tmp_input.id = "input_" + p;
					tmp_input.onclick = function(){
						last_focused.focus();
					}
					modal.appendChild(tmp_input);
				}
			}
		}
	}
	modal.children[1].focus();
	input_modal_visible = false;
}
function addActionBlock(tmp_order){
	modal.style.display = 'none';
	var tmp_list = {};

	for (n in block_list){
		if(tmp_order == block_list[n].order){
			for (p in block_list[n]){
				if (p != "len" && p != "link"){
					if(p == "order"){
						tmp_list[p] =  tmp_order;		
					}
					else if(p == "viscous"){
						var checked = document.getElementById("input_" + p).checked;
						checked[p] = tmp_value.value;
					}
					else if(p === "save"){
						var checked = document.getElementById("input_" + p).checked;
						if(checked === true){
							var name_of_tube = document.getElementById("input_origin").value;
							var volume = document.getElementById("input_volume").value;
							console.log(volume)
							tmp_list.target = addItemToList(name_of_tube, volume);
						}
						tmp_list[p] = checked;
					}
					else{
						tmp_value = document.getElementById("input_" + p)
						tmp_list[p] =  tmp_value.value;
					}
				}
			}
		}
	}
	if (edit_flag){
		protocol_list.splice(selected_block, 1, tmp_list);
		edit_flag = false;
	}
	else{
		protocol_list.splice((++selected_block), 0, tmp_list);
		if(protocol_list.length == 1){
			selected_block = 0;
		}
	}
	makeActionBlocks();
}
function makeActionBlocks(){
	document.getElementById('timelineBlocks').innerHTML = '';
	for (var s in protocol_list) {	
		var new_div = document.createElement('div');
		var new_span_left = document.createElement('span');
		var new_span_right = document.createElement('span');

		//console.log(protocol_list[s])
		
		var order = protocol_list[s].order;
		var link = protocol_list[s].link;
		var target = protocol_list[s].target;
		var origin = protocol_list[s].origin;
		var RFC = protocol_list[s].RFC;
		var temp = protocol_list[s].temp;

		new_div.id = s;
		new_div.className = 'actionBlock';
		new_div.style.backgroundColor = block_colors[order]


		new_span_left.className = "actionBlockEnumerationSpan";
		new_span_left.innerHTML = (parseInt(s) + 1);
		new_div.appendChild(new_span_left);


		new_div.innerHTML +=  "<b>" + order + "</b>" + "<br />";
		if (link){
			new_span_right.className = "linkIconSpan"; 
			new_span_right.innerHTML = ('<img src="images/chain.png" class="linkIcon"> </img> ');
			new_div.appendChild(new_span_right);
		}
		if(order == "CTR"){
			new_div.innerHTML += '<span class="actionBoxText">' + target;
		}
		else if(order == "PIP"){
			new_div.innerHTML += '<span class="actionBoxText">' + origin.slice(0,5) + " &#8594 " + target.slice(0,5);
		}
		else if(order == "ASP"){
			new_div.innerHTML += '<span class="actionBoxText">' + origin.slice(0,5) + " &#8594 " + (typeof target !== "undefined" ? target.slice(0,5) : protocol_list[s].volume);
		}
		else{
			new_div.innerHTML += '<span class="actionBoxText">' + target;//temp + "&deg" + "C" ;
		}
		new_div.innerHTML += "</span>";



		new_div.onclick = function(){
			selected_block = this.id;
			makeActionBlocks();					
			document.getElementById(selected_block).style.color = "white";			
		};
		document.getElementById('timelineBlocks').appendChild(new_div);
	}
	if(protocol_list.length)

		document.getElementById(selected_block).style.color = "white";	
}





/******* EDIT ACTION BLOCKS *******/
function editActionBlock(e){
	if (input_modal_visible){
		document.getElementById('inputModal').style.display = 'none';	
		input_modal_visible = false;
	}
	else{
		if(protocol_list.length){
			edit_flag = true;
			var tmp_order
			tmp_order = document.getElementById(selected_block).children[1].innerHTML;
			addBlockInput(tmp_order);
		}
	}
}
function copyActionBlock(){
	if(protocol_list.length)
		copyableActionBlock = protocol_list[selected_block]; 
}
function pasteActionBlock(){
	if(copyableActionBlock){

		if(protocol_list[selected_block].order == "CTR")
			item_list.push({"name":"Balance", "keep":false, "tube":"micro", "volume":0})

		protocol_list.splice(parseInt(selected_block) + 1, 0, copyableActionBlock);
		if(protocol_list.length > 1)
			selected_block++;

		makeActionBlocks();
		makeItemInList();
	}
}
function deleteActionBlock(){
	if(protocol_list.length){

		if(protocol_list[selected_block].order == "CTR")
			for (n in item_list)
				if(item_list[n].name == "Balance"){
					item_list.splice(n,1)
					break;
				}

				protocol_list.splice(selected_block,1);
				if(selected_block > 0){
					selected_block--;
				}

				makeActionBlocks();
				makeItemInList();
			}
		}
		function linkActionBlock(){
			protocol_list[selected_block].link = !protocol_list[selected_block].link;
			makeActionBlocks();
	//
}





/******* EDIT PROTOCOL *******/
function saveList(){
	console.log(last_loaded_list)
	var input = prompt("Name the list", last_loaded_list);
	if (input === null) {
        return; //break out of the function early
    }
    var name_list = {"name":input};
    var combined_lists = {protocol_list, item_list, name_list};
    socket.emit('saveList', combined_lists);
}
function loadList(){
	if (list_modal_visible){
		list_modal.style.display = 'none';	
		list_modal_visible = false;
	}
	else{
		socket.emit('requestLists', 0);
	}
}
socket.on('listNames', function(data){
	list_modal = document.getElementById('protocolNamesModal');
	list_modal_dl = list_modal.children[0];
	list_modal_dl.innerHTML = '';
	for (n in data){
		var name_holder = document.createElement('li');
		name_holder.className = 'list_modal_names';
		name_holder.innerHTML = data[n].slice(0,-4).slice(0,20);
		name_holder.id = data[n].slice(0,-4);
		name_holder.onclick = function(){
			socket.emit('loadList', this.id);
			last_loaded_list = this.innerHTML;
			list_modal.style.display = 'none';
			list_modal_visible = false;
		}
		list_modal_dl.appendChild(name_holder)
	}
	list_modal_visible = true;
	list_modal.style.display = 'inline-block';	
});
socket.on('protocol', function(data){
	data = JSON.parse(data);
	protocol_list = data.protocol;
	item_list = data.items;
	makeActionBlocks();
	makeItemInList();
});


function rgb2hex(rgb) {
	if (  rgb.search("rgb") == -1 ) {
		return rgb;
	} else {
		rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
		function hex(x) {
			return ("0" + parseInt(x).toString(16)).slice(-2);
		}
		return ("#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])).toUpperCase(); 
	}
}
function launchHelp(){
	console.log("TBW")
}