var express = require('express');
var sys = require('sys');
var exec = require('child_process').exec;
var EventEmitter = require('events').EventEmitter;

function puts(error, stdout, stderr) { sys.puts(stdout) }

var intcount = 2;
var inters = {
	0 : 'init',
	1 : {
		'id' : 1,
		'name' : 'Lampe',
		'status' : true
	},
	2 : {
		'id' : 2,
		'name' : 'TV',
		'status' : false
	}
}

// traduction en pins gpio
var num2gpio = {
	// intnum : wiringpi_gpio
	1 : 1,
	2 : 2
}

// Config app server !

var app = express();

var execCommand = function(command){
	exec(command, puts);
}

var iSwitch = function(num){
	// swithing inter
	//console.log("switching inter "+num+" corresponding to gpio "+num2gpio[num]);
	var newstat = !inters[num].status?'1':'0';
	console.log("gpio write "+num2gpio[num]+" "+newstat);
	exec("gpio write "+num2gpio[num]+" "+newstat, puts);

	// switching local data
	inters[num].status = !inters[num].status;
}

var getHandler = function(req, res){
	console.log("Requesting status of inter "+req.params.num);
	console.log("Answering : ");
	console.log(inters[req.params.num]);

	res.setHeader('Content-Type', 'application/json');
	res.status(200);
	res.json(inters[req.params.num]);
}

app.get('/:num/get', getHandler);

var setHandler = function(req, res){
	var num = req.params.num;
	var newstat = !inters[num]['status'];

	console.log("Setting status of inter "+num +" to "+newstat);

	iSwitch(num);
	
	res.setHeader('Content-Type', 'application/json');
	res.status(200);
	res.json(inters[req.params.num]);
}

app.get('/:num/switch', setHandler);

var initHandler = function(req,res){
	var output = "";
	console.log("Init : getting gpio status ...");
	var evem = new EventEmitter();

	// get gpio status ...
	var gpioread = function(num){ 								// Create read handler
		// num = new int to read
		console.log("gpio read "+num);
		exec("gpio read "+num, function(error, stdout, stderr){
			if(stdout == 0) inters[num].status = false;
			else inters[num].status = true;
		});

		if(num != intcount) evem.emit('read_ok', num+1);		// Call new read handler
		if(num == intcount){
			console.log("Init : sending local data ...");
			console.log(inters);
			res.setHeader('Content-Type', 'application/json');
			res.status(200);
			res.json(inters);
		}
	}

	evem.on('read_ok', gpioread);
	evem.emit('read_ok', 1);
}

app.get('/init', initHandler);

console.log("Starting server on port 8000");
app.listen(8000);


// Config web server !

web = express();

web.get('/', function(req, res){
	console.log("Web request !");
	res.setHeader('Content-Type', 'text/plain');
	res.status(200);
	res.end("That's goooood !");
});

console.log("Starting web server (80)");
web.listen(80);