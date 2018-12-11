var cheerio = require('cheerio');
var fs = require('fs');
var continentes = [];
var airports = [];
var idCountry = 0;
var count = 0;

fs.readFile('./Airports.html', function read(err, data) {
    if (err) {
        throw err;
	}

	var $ = cheerio.load(data);
	
	$('div div').each(function(i, elm) {
		var div = $(this);
		if(i==0){
			$(div).children('ul').children('li').each(function(i, elm) {
				var li = $(this);
				
				var id = idCountry;
				var name = li.text().trim();
				
				var jsonContinente = JSON.parse('{"id":"'+idCountry+'", "name":"'+name+'","airports":[]}');
				
				continentes.push(jsonContinente);
				idCountry++;
			})
		}
		
		if(div.attr('id') != undefined && div.attr('id').toString().indexOf('panel') !== -1){
			var panel = $(this);
			
			//console.log(div.attr('id').toString());
			//console.log(count);
			
			$(panel).children('div').children('ul').each(function(j, elm) {
				var ul = $(this);

				$(ul).children('li').children('ul').each(function(k, elm) {
					//SPAN
					var ul = $(this);
					$(ul).children('li').each(function(i, elm) {
						var li = $(this);
						
						var name = li.text().trim(); //Full name
						var code = name.substring(name.lastIndexOf("(")+1,name.lastIndexOf(")")).trim();;
						var city = name.substring(name.lastIndexOf(")")+1,name.lastIndexOf("-")-1).trim();
						var country = name.substring(name.lastIndexOf("-")+1,name.length).trim();
						
						jsonAirport = JSON.parse('{"name":"'+li.text().trim()+'","code":"'+code+'","city":"'+city+'","country":"'+country+'"}');
						
						continentes[count].airports.push(jsonAirport);
					})
					
				})
			})
			count=count+1;
		}
	});
	//console.log(continentes);
	fs.writeFile("./airports.json", JSON.stringify(continentes, null, "\t"), function(err) {
		if (err) {
			return console.log(err);
		} 
	});
});

	


