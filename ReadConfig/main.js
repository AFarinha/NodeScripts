var excel = require('excel4node');
var fs = require('fs');
var parse = require('xml-parser');
var xml = fs.readFileSync('./Web.config', 'utf8');
var inspect = require('util').inspect;
 
var obj = parse(xml);

var appSettings = obj.root.children[6].children;

//console.log(obj.root.children[6]);
//console.log(inspect(obj2, { colors: true, depth: Infinity }));


var workbook = new excel.Workbook();
var worksheet = workbook.addWorksheet('Sheet 1');

worksheet.cell(1,2).string('Key');
worksheet.cell(1,4).string('Value');
worksheet.cell(1,5).string('PORT');
worksheet.cell(1,7).string('Completo');


var row = 2;
for (var i = 0; i < appSettings.length; i++) {
  var main = appSettings[i].attributes;

  if(
    main.value.indexOf('http') > -1 || 
	main.value.indexOf('Http') > -1 || 
	main.value.indexOf('HTTP') > -1 
	) {
	  
	  //console.log(main.key);
	  //console.log(main.value);
	  
	  var value = main.value.replace('http://',''); //Faz replace por causa dos :
	  
	  var arr = value.split(":");//se tiver porto
	  console.log(main.key);
	  console.log('Arr: '+arr);
	  
	  
	  worksheet.cell(row,1).string('<add key="');
	  worksheet.cell(row,3).string('" value="');
	  worksheet.cell(row,6).string('" />');
	  
	  
	  if(arr.length == 2){
		  worksheet.cell(row,2).string(main.key);
		  worksheet.cell(row,4).string('http://'+arr[0]+':');
		  worksheet.cell(row,5).string(arr[1]);

	  }else{
		  worksheet.cell(row,2).string(main.key);
		  worksheet.cell(row,4).string(main.value);
	  }
	  
	  var concat = 'CONCATENATE(A'+row+';B'+row+';C'+row+';D'+row+';E'+row+';F'+row+')';
	  
	  worksheet.cell(row,7).formula(concat);
	  
	  row++;
  }
}
workbook.write('Excel.xlsx');

