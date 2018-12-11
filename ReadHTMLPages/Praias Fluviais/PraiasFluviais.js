var http = require('http');
var cheerio = require('cheerio');
var fs = require('fs');

var options = {
    host: 'aquapolis.com.pt',
    path: '/praias-fluviais-portugal/'
}

var distritos = [
    'Distrito de Aveiro',
    'Distrito de Braga',
    'Distrito de Bragança',
    'Distrito de Porto',
    'Distrito de Viana do Castelo',
    'Distrito de Vila Real',
    'Distrito de Viseu',
    'Distrito de Coimbra',
    'Distrito de Castelo Branco',
    'Distrito da Guarda',
    'Distrito de Leiria',
    'Distrito de Lisboa',
    'Distrito de Portalegre',
    'Distrito de Santarém',
    'Distrito de Beja',
    'Distrito de Évora',
    'Distrito de Faro',
    'Distrito de Setúbal'
];

var praiasFluviais = [];
var idDistritoidDistrito = 0;


var request = http.request(options, function(res) {
    var data = '';
    res.on('data', function(chunk) {
        data += chunk;
    });
    res.on('end', function() {
        var $ = cheerio.load(data);
        var idPraia = 1;

        var id, nome, link, distrito;
		var lastDistrito = -1;
        $('ol li').each(function(i, elm) {
            var li = $(this);
            if (li.text().indexOf('Praia') > -1 && idPraia < 235) {
                id = idPraia;
                nome = li.text().replace('\r\n', '').trim();

                //link = (li.children('a').attr('href') !== undefined) ? li.children('a').attr('href') : "";

                //Norte
                if (id <= 18) {
                    distrito = distritos[0];
					idDistrito = 0;
                } else if (id > 18 && id <= 33) {
                    distrito = distritos[1];
					idDistrito = 1;
                } else if (id > 33 && id <= 46) {
                    distrito = distritos[2];
					idDistrito = 2;
                } else if (id > 46 && id <= 53) {
                    distrito = distritos[3];
					idDistrito = 3;
                } else if (id > 53 && id <= 61) {
                    distrito = distritos[4];
					idDistrito = 4;
                } else if (id > 61 && id <= 64) {
                    distrito = distritos[5];
					idDistrito = 5;
                } else if (id > 64 && id <= 83) {
                    distrito = distritos[6];
					idDistrito = 6;
                }
                //Centro
                else if (id > 83 && id <= 125) {
                    distrito = distritos[7];
					idDistrito = 7;
                } else if (id > 125 && id <= 158) {
                    distrito = distritos[8];
					idDistrito = 8;
                } else if (id > 158 && id <= 180) {
                    distrito = distritos[9];
					idDistrito = 9;
                } else if (id > 180 && id <= 188) {
                    distrito = distritos[10];
					idDistrito = 10;
                } else if (id > 188 && id <= 192) {
                    distrito = distritos[11];
					idDistrito = 11;
                }

                //SUL
                else if (id > 192 && id <= 198) {
                    distrito = distritos[12];
					idDistrito = 12;
                } else if (id > 198 && id <= 215) {
                    distrito = distritos[13];
					idDistrito = 13;
                } else if (id > 215 && id <= 219) {
                    distrito = distritos[14];
					idDistrito = 14;
                } else if (id > 219 && id <= 222) {
                    distrito = distritos[15];
					idDistrito = 15;
                } else if (id > 222 && id <= 226) {
                    distrito = distritos[16];
					idDistrito = 16;
                } else if (id > 226 && id <= 234) {
                    distrito = distritos[17];
					idDistrito = 17;
                }
				
				if(lastDistrito != idDistrito){
					jsonDistrito = JSON.parse('{"id":"'+idDistrito+'","name":"'+distritos[idDistrito]+'","praias":[]}');
					lastDistrito = idDistrito;
					praiasFluviais.push(jsonDistrito);
				}

                //console.log(idPraia, ' - ', nome, ' - ', distrito);
				var jsonPraia = JSON.parse('{"id":"'+idPraia+'","nome":"'+nome+'"}');
				praiasFluviais[idDistrito].praias.push(jsonPraia);
            }
            idPraia++;
        });
		
		//console.log(continentes);
		fs.writeFile("./praias.json", JSON.stringify(praiasFluviais, null, "\t"), function(err) {
			if (err) {
				return console.log(err);
			} 
		});

    });
});
request.on('error', function(e) {
    console.log(e.message);
});
request.end();