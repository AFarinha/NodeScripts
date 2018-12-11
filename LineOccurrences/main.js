// Require library
var excel = require('excel4node');
var LineByLineReader = require('line-by-line');

/****************** Excel ******************/

// Create a new instance of a Workbook class
var workbook = new excel.Workbook();

// Add Worksheets to the workbook
var worksheet = workbook.addWorksheet('Sheet 1');

// Create a reusable style
var style = workbook.createStyle({
  font: {
    color: '#000000',
    size: 12
  }  
});

worksheet.cell(1,1).string('Query').style(style);
worksheet.cell(1,2).string('Count').style(style);

/****************** Excel ******************/


var array = [];


var lr = new LineByLineReader('PUCC2.txt',{ encoding: 'utf8', skipEmptyLines: false });

lr.on('error', function (err) {
	// 'err' contains error object
});

lr.on('line', function (line) {
	
	if( array.length == 0 || array.filter((el) => el.content.indexOf(line) > -1).length == 0 )
	{
		var code = {
			content: line,
			count: 1
		};
		
		array.push(code);

	}else{
		array.filter((el) => el.content.indexOf(line) > -1)[0].count++;
	}
});

lr.on('end', function () {
	
	var SortedArray = array.sortByDesc('count');
	
	for(i = 0; i < SortedArray.length;i++){
		//console.log(SortedArray[i].content + ':::::::::::::::::::::::::::::::::::::::::::::::::: ' + SortedArray[i].count);

		worksheet.cell(i+2,1).string(SortedArray[i].content).style(style);
		worksheet.cell(i+2,2).number(SortedArray[i].count).style(style);
	}
	
	workbook.write('Excel.xlsx');
});




//Functions Aux

Array.prototype.sortByAsc = function(p) {
  return this.slice(0).sort(function(a,b) {
    return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
  });
}

Array.prototype.sortByDesc = function(p) {
  return this.slice(0).sort(function(a,b) {
    return (a[p] < b[p]) ? 1 : (a[p] > b[p]) ? -1 : 0;
  });
}