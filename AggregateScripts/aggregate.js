//Requires
var fs = require('fs');

//Variables
var mainFolder = process.cwd();
var folderNameAgregador = 'Agregador';
var app;
var transactions = 0;

// ************* Main - INIT *************

//Argumentos da chamada
const args = process.argv;
//Seleciona a APP
initApp(args);
//Pasta mãe
var mainFolderList = getDirectories(mainFolder)
//Inicia processo
processSubFolders(mainFolder,mainFolderList, 0, '');

// ************* Main - END **************


/*
Função principal
	Verifica se existem ou não subpastas dentro das pastas, chamando-se a si recursivamente se isso acontecer
	Para cada pasta, vai buscar os ficheiros (getFilesInDirectory) e agrega (agregateFilesIntoString)
*/
function processSubFolders(path, folders, x, subFolder)
{
	var index = folders.indexOf(folderNameAgregador);
	if (index > -1) {
	  folders.splice(index, 1);
	}

	if(x < folders.length)
	{
		
		var folderName = folders[x];
		var folderPath = path + '\\' + folderName;

		if(isDirectory(folderPath)){
			if(folderName != folderNameAgregador){
				//Existem Diretorias?
				var directories = getDirectories(folderPath);
				if(directories.length > 0)
				{
					console.log('NOTA: Existem Sub Diretorias: ' + directories +' na pasta: '+ folderPath + '\n');
					processSubFolders(folderPath, directories, 0, folderName)
				}else {
					var files = getFilesInDirectory(folderPath);
					agregateFilesIntoString(folderPath, folderName, files, 0, initSQL(), subFolder);	
				}
			}
		}
		
		processSubFolders(path, folders, x+1, subFolder);
	}
}

//Verifica se um caminho é uma pasta
function isDirectory (path)
{
	return fs.lstatSync(path).isDirectory();
}

//Retorna todas as pastas (ignora ficheiros)
function getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path+'/'+file).isDirectory();
  });
}

//Retorna todos os ficheiros (ignora pastas)
function getFilesInDirectory(path) {
	return fs.readdirSync(path).filter(function (file) {
		return !fs.statSync(path+'/'+file).isDirectory();
	});
}

//Lê um ficheiro
function readFile(path) {
	return fs.readFileSync(path, 'utf8');
}

/*
	Função recursiva que, vai se chamando a só própria até agregar os scripts todos da pasta
	Quando existem procedures, é feito um tratamento diferente devido ao SQL Server (senão dá erro)
	É feita uma limpeza do 'lixo'
	Cria o ficheiro numa pasta (que cria se não existir) com a nomenclatura: [agregador]_[nome da pasta do projeto].sql
		Se for subfolder, coloca o nome da subfolder no meio
	No fim, retorna uma mensagem informativa
*/
function agregateFilesIntoString(path, folderName, files, idScript, SQLString, subFolder)
{
	if(idScript < files.length)
	{
		var fileFullPath = path + '\\' + files[idScript];
		var fileText = readFile(fileFullPath);

		SQLString = SQLString + '-- ******************** SCRIPT ' + idScript + '********************\n';
		SQLString = SQLString + 'SET @IDSCRIPT = ' + idScript + '\n';
		SQLString = SQLString + '\n\n';

		//Limpeza de "Lixo"
		fileText = replaceText(app, fileText);

		//É um create procedure?
		var createProc = fileText.toUpperCase().indexOf('CREATE PROC');
		if (createProc > -1)
		{
			//É um create proc, tem que ser feita separação
			var splitArray = splitScriptProcedures(createProc, fileText);

			for(var i = 0; i < splitArray.length; i++){
				var execute = 'SET @SQLString = N\'' + splitArray[i].replace(/'/g, '\'\'') + '\';\n\n';
				execute += 'EXECUTE sp_executesql @SQLString\n\n';
				SQLString = SQLString + execute;
				SQLString = SQLString + '\n\n';	
			}

		}else {
			var execute = 'SET @SQLString = N\'' + fileText.replace(/'/g, '\'\'') + '\';\n\n';
			execute += 'EXECUTE sp_executesql @SQLString\n\n';
			SQLString = SQLString + execute;
			SQLString = SQLString + '\n\n';	
		}

		agregateFilesIntoString(path, folderName, files, idScript+1, SQLString, subFolder);
	}
	else 
	{
		var fullSQLString = endSQL(SQLString);

		var dirAggreg = mainFolder+'\\'+folderNameAgregador;
		if (!fs.existsSync(dirAggreg)){
		    fs.mkdirSync(dirAggreg);
		}

		var sqlFilePath = '';
		if(subFolder == '')
		{
			sqlFilePath = dirAggreg+'\\'+folderNameAgregador+'_'+folderName+'.sql'; 
		}
		else
		{
			sqlFilePath = dirAggreg+'\\'+folderNameAgregador+'_'+subFolder +'_'+folderName+'.sql'; 
		}
				
		fs.writeFile(sqlFilePath, fullSQLString, (err) => {  
			if (err) throw err;
			console.log("-------> Feita agregação à pasta: "+ path );
		});
	}
}

/*
	Devolve o inicio do ficheiro SQL
*/
function initSQL()
{
	var sql = '';

	sql += 'DECLARE @IDSCRIPT AS INTEGER\n\n'
	sql += 'DECLARE @SQLString AS NVARCHAR(MAX)\n\n'

	if(app == 'PUCC'){
		sql += 'USE eUmbrella\n'
	}
	else if(app == 'APCRED')
	{
		sql += 'USE ucContractManager\n'
	}

	sql += 'BEGIN TRY  \n\n';

	if(transactions == 1){
		sql += '	BEGIN TRAN  \n\n';
	}
	
	return sql;
}

/*
	Devolve o fim do ficheiro SQL
*/
function endSQL(SQLString)
{
	var sql = '';

	sql += '\n\n';
	if(transactions == 1){
		sql += 'ROLLBACK    \n\n';
	}
	sql += 'END TRY    \n';
	sql += 'BEGIN CATCH  \n\n';

	if(transactions == 1){
		sql += '	ROLLBACK  \n\n';
	}

	sql += '	DECLARE @ErrorMessage NVARCHAR(4000)   \n'
	sql += '	DECLARE @ErrorSeverity INT             \n'
	sql += '	DECLARE @ErrorState INT                \n'
	sql += '	                                       \n'
	sql += '	SELECT                                 \n'
	sql += '		@ErrorMessage = ERROR_MESSAGE(),   \n'
	sql += '		@ErrorSeverity = ERROR_SEVERITY(), \n' 
	sql += '		@ErrorState = ERROR_STATE();       \n'
	sql += '	                                       \n'
	sql += '	SET @ErrorMessage =	\'@IDSCRIPT = \' + CAST(@IDSCRIPT AS VARCHAR(MAX)) + Char(10) + @ErrorMessage    \n'
	sql += '	                                       \n'
	sql += '	RAISERROR (@ErrorMessage,              \n'
	sql += '			   @ErrorSeverity,             \n'
	sql += '			   @ErrorState                 \n'
	sql += '			   );                          \n'

	sql += 'END CATCH  ';

	SQLString += sql;

	return SQLString;
}


/*
	Limpeza de SQL dependendo da app
	Os 'GO' por exemplo dão erro no SQL Server
	Os 'Use' são lixo pois é retornado no initSQL
*/
function replaceText(aplication, fileText)
{
	if(aplication == 'PUCC')
	{
		//gi -> Global + insensitive
		fileText = fileText.replace(/\bGO\b/gi,'');
		fileText = fileText.replace(/\buse eUmbrella\b/gi,'');
		fileText = fileText.replace(/use \[eUmbrella\]/gi,'')
	}
	else if(aplication == 'APCRED')
	{
		fileText = fileText.replace(/\bGO\b/gi,'');
		fileText = fileText.replace(/\buse ucContractManager\b/gi,'');
		fileText = fileText.replace(/use \[ucContractManager\]/gi,'')
	}

	return fileText;
}

/*
	Definição da aplicação
*/
function initApp(args) {
	if(args[2] == undefined)
	{
		app = 'PUCC';
	}
	else {
		switch (args[2].toUpperCase()) {
			case 'PUCC':
				app = 'PUCC';
				break;
			case 'APCRED':
				app = 'APCRED';
				break;
			default:
				app = 'PUCC';
				break;
		}
	}

	console.log('\n***************************************************************');
	console.log('* Processo iniciado para a aplicação: ' + app + '                    *');
	console.log('* Para selecionar a aplicação é adicionar o argumento' + '         *');
	console.log('* Ex: node [script.js] [aplicação]' + '                            *');
	console.log('* Colocar na pasta que contém as várias pastas das atividades' + ' *');
	console.log('***************************************************************\n');
}

/*
	Quando é um procedure, é importante fazer a separação para não dar erro no SQL Server
	É também feita uma limpeza
*/
function splitScriptProcedures(index, fileText) 
{
	var splitArray = [];
	
	//Pode ser lixo até lá. Geralmente é superior a 150
	if(index > 20)
	{
		splitArray.push(fileText.slice(0, index));
		splitArray.push(fileText.slice(index, fileText.length));
	}
	else 
	{
		splitArray.push(fileText.slice(index, fileText.length));
	}

	return splitArray;
}