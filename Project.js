function main(){
    const request = require('request')
    const regedit = require('regedit')
    const fs = require('fs')
    const path = require('path')
    const csvjson = require('csvJson')


    const regPath = 'HKLM\\SOFTWARE\\WOW6432Node\\Emerson\\CIF'
    // Listing all the objects from that registry
    regedit.list(regPath, function(err,result){
    //Reading just the value(path) of the INstallation of DeltaV
    defaultValue = result[regPath].values['DATA_DIRECTORY'].value
    processFolder(defaultValue)
    })

 async function processFolder(defaultValue){
    // Merging the path and some of the subfolder which were not in the path and are common on all devices
    let folder = defaultValue + '\\Performance'
    if (!fs.existsSync(folder)){
        console.log("no dir ",folder);
        return;
    }
    finalResults = await readDirectory(folder)
    sendData(finalResults)
}

 async function readDirectory(folder){
    let results = []
    // Reading all the files in the directory and finding '.csv' extension and then read it and convert it to json string  
    let files=fs.readdirSync(folder)
    for(let i=0;i<files.length;i++){
        let fileName=path.join(folder,files[i])
        let stat = fs.lstatSync(fileName)
        if (stat.isDirectory()){
            results = results.concat((await readDirectory(fileName))) //recurse
        }
        else if (fileName.indexOf('.csv')>=0) {
             results.push(await readPerformancefile(fileName))
        }
    }
    return results
}

 async function readPerformancefile(fileName){
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf8', function (err, data) {
          if (err) {
            reject(err);
          }
          var formatting = {
            delimiter : ',',
            quote     : '"'
          }
          let jsonObj = csvjson.toObject(data, formatting);
          resolve(jsonObj);
          return jsonObj
    });
    })
}

 async function sendData(finalResults){
    convertTonumbers(finalResults)
    convertTodate(finalResults)  
    request({
        url: "http://localhost:4000/StorePerformanceData/todos",
        method: "POST",
        json: true, 
        body: finalResults
    }, function (error, response, body){
        console.log(`statusCode: ${response.statusCode}`)
     });
}

 function convertTonumbers(finalResults){
    for(var index = 0; index < finalResults.length; index ++){
        for(let i = 0; i < finalResults[index].length; i ++){
            var obj = finalResults[index][i];
            for(var prop in obj){
                if(obj.hasOwnProperty(prop) && obj[prop] !== null && !isNaN(obj[prop])){
                    obj[prop] = +obj[prop];   
                }
            }
        }
    }
    }
 function convertTodate(finalResults){
     for (let index = 0; index < finalResults.length; index ++){
         for(let i = 0; i < finalResults[index].length; i ++){
            let startDate = finalResults[index][i].Start + 'Z'
            let endDate = finalResults[index][i].End + 'Z'
            finalResults[index][i].Start = new Date(startDate)
            finalResults[index][i].End = new Date(endDate)
         }
     }
}
}
main();