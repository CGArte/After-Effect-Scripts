//BatchRender TGA and JPEG
//by Renan de Araujo

//Script para automatizar o processo de exportação de arquivos de escalação de jogadores para a Criação de Arte da Globosat.

{ 
    function batchRenderTGA_JPEG(){
        
        var scriptName = "Batch Render TGA and JPEG";
        
        //Esta função pega os arquivos importados cria uma comp para cada um, 
        //coloca na fila de render, com dois outputs(TGA e JPG), 
        //e renomeia os arquivos finais em caixa alta corrigindo um problema do After Effects gerar numero do frame no final.
        function createCompsAndRender(){
      
            numItems = app.project.numItems;
                        
            var myItems=[]; //Array para os vídeos
            
            //Variáveis da composição
            var compW = 512;         // Largura em pixels
            var compH = 512;         // Altura em pixels 
            var compL = 3;             // Duração em segundos
            var compRate = 30;      // CompositionHeight
            var compBG = [0,0,0];   // Cor do Fundo
            
            
            //Loop para adicionar videos no array criado acima
            for (i=1; i <= numItems; i++){

                myItems.push(app.project.item(i));
            }
            
            //Escolhe o diretório para onde vão as imagens
            var targetFolder = Folder.selectDialog("Render files to...");
                
            // Cria as comps e render outputModules
            for (index in myItems){
                    
                    //Variável para nome da comp baseado no arquivo de vídeo cortando os digitos da extensão
                    var compName = myItems[index].name.slice(0,-4);
                   
                    //Variáveis com o destino dos outputModules
                    var compDestinationTGA = new File( String(targetFolder ) + "//" + String(compName) + ".tga");
                    var compDestinationJPEG = new File( String(targetFolder ) + "//" + String(compName) + ".jpg"); 
                    
                    //Cria a comp
                    myComp = app.project.items.addComp(compName,compW,compH,1, compL,compRate);
                    myComp.bgColor = compBG;
                    
                    //Adiciona o vídeo
                    myComp.layers.add(myItems[index]);
                    
                    //Adiciona para a render queue e estabelece os outputModules
                    myCompInQueue = app.project.renderQueue.items.add(myComp); 
                    myCompInQueue.timeSpanStart = currentFormatToTime("2:29",30);
                    myCompInQueue.timeSpanDuration= currentFormatToTime("1",30,1);
                    myCompInQueue.outputModule(1).applyTemplate("TGA");
                    myCompInQueue.outputModule(1).file = compDestinationTGA;
                    myCompInQueue.outputModules.add();
                    myCompInQueue.outputModule(2).applyTemplate("JPEG");
                    myCompInQueue.outputModule(2).file = compDestinationJPEG;
                    
                    
            }
            
            //Manda fazer render
            app.project.renderQueue.render();
            
            //Pega a lista de arquivos do diretorio destino do render
            var targetFolderFiles = targetFolder.getFiles();
            
            //Renomeia os arquivos com render cortando o número do frame e colocando em caixa alta
            for (index in targetFolderFiles){
                var newName = targetFolderFiles[index].name.slice(0,-5).toUpperCase();
                
                targetFolderFiles[index].rename(newName);
             }
      
        }

        
        
        
       
       //Esta função importa as sequencias ou videos de um determinado diretório. (Vem com o próprio After Effects)
        function SmartImport(){	
            // Ask the user for a folder whose contents are to be imported.
            var targetFolder = Folder.selectDialog("Import items from folder...");
            if (targetFolder != null) {
                // If no project open, create a new project to import the files into.
                if (!app.project) {
                    app.newProject();
                }
                
                
                function processFile(theFile)
                {
                    try {
                        // Create a variable containing ImportOptions.
                        var importOptions = new ImportOptions(theFile);
                        importSafeWithError(importOptions);
                    } catch (error) {
                        // Ignore errors.
                    }
                }
                
                
                function testForSequence(files)
                {
                    var searcher = new RegExp("[0-9]+");
                    var movieFileSearcher = new RegExp("(mov|avi|mpg)$", "i");
                    var parseResults = new Array;
                    
                    // Test that we have a sequence. Stop parsing after 10 files.
                    for (x = 0; (x < files.length) & x < 10; x++) {
                        var movieFileResult = movieFileSearcher.exec(files[x].name);
                        if (!movieFileResult) {
                            var currentResult = searcher.exec(files[x].name);
                            // Regular expressions return null if no match was found.
                            // Otherwise, they return an array with the following information:
                            // array[0] = the matched string.
                            // array[1..n] = the matched capturing parentheses.
                            
                            if (currentResult) { // We have a match -- the string contains numbers.
                                // The match of those numbers is stored in the array[1].
                                // Take that number and save it into parseResults.
                                parseResults[parseResults.length] = currentResult[0];
                            } else {
                                parseResults[parseResults.length] = null;
                            }
                        } else {
                            parseResults[parseResults.length] = null;
                        }
                    }
                    
                    // If all the files we just went through have a number in their file names, 
                    // assume they are part of a sequence and return the first file.
                    
                    var result = null;
                    for (i = 0; i < parseResults.length; ++i) {
                        if (parseResults[i]) {
                            if (!result) {
                                result = files[i];		
                            }
                        } else {
                            // In this case, a file name did not contain a number.
                            result = null;
                            break;
                        }
                    }
                    
                    return result;
                }
                
                
                function importSafeWithError(importOptions)
                {
                    try { 
                        app.project.importFile(importOptions);
                    } catch (error) {
                        alert(error.toString() + importOptions.file.fsName, scriptName);
                    }
                }
                
                
                function processFolder(theFolder)
                {
                    // Get an array of files in the target folder.
                    var files = theFolder.getFiles();
                    
                    // Test whether theFolder contains a sequence.
                    var sequenceStartFile = testForSequence(files);
                    
                    // If it does contain a sequence, import the sequence,
                    if (sequenceStartFile) {
                        try {
                            // Create a variable containing ImportOptions.
                            var importOptions = new ImportOptions(sequenceStartFile);
                            
                            importOptions.sequence = true;
                            // importOptions.forceAlphabetical = true;		// Un-comment this if you want to force alpha order by default.
                            importSafeWithError(importOptions);
                        } catch (error) {
                        }
                    }
                    
                    // Otherwise, import the files and recurse.
                    
                    for (index in files) { // Go through the array and set each element to singleFile, then run the following.
                        if (files[index] instanceof File) {
                            if (!sequenceStartFile) { // If file is already part of a sequence, don't import it individually.
                                processFile(files[index]); // Calls the processFile function above.
                            }
                        }
                        if (files[index] instanceof Folder) {
                            processFolder(files[index]); // recursion
                        }
                    }
                }
                
                // Recursively examine that folder.
                processFolder(targetFolder);
            }
        }

        
        SmartImport ();
        createCompsAndRender ();
        
    }

    batchRenderTGA_JPEG ();

    alert("O script rodou até o fim.","Job done!");
}
