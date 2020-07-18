function main(){
    const request = require('request')
    const regedit = require('regedit')
    const fs = require('fs')
    const path = require('path')
    const csvjson = require('csvJson')
    const dateFormat = require('dateformat')
    const fetch = require('node-fetch')

    const regPath = 'HKLM\\SOFTWARE\\WOW6432Node\\Emerson\\CIF'
    // Listing all the objects from that registry
    regedit.list(regPath, function(err,result){
    //Reading just the value(path) of the INstallation of DeltaV
    defaultValue = result[regPath].values['DATA_DIRECTORY'].value
    processFolder(defaultValue)
    })

 async function processFolder(defaultValue){
     let data = []
    // Merging the path and some of the subfolder which were not in the path and are common on all devices
    let folder = defaultValue + '\\Performance'
    if (!fs.existsSync(folder)){
        console.log("no dir ",folder);
        return;
    }
    let date = await getDate()
    //console.log(date)
    finalResults = await readDirectory(folder)
    for(let index = 0; index < finalResults.length; index ++){
        for(let i = 0; i < finalResults[index].length; i++){
            let end = new Date(finalResults[index][i].End)
            let endDate = dateFormat(end, "yyyy-mm-dd'T'HH:MM:ss.ms")
            //console.log(endDate)
            if(date < endDate){
                data.push(finalResults[index][i])  
            }else if(date > endDate){
                data = []
            } else{
                data.push(finalResults[index][i])
            }
        }
    }
    console.log(data.length)
    sendData(data)
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

 async function sendData(data){
    convertTonumbers(data)
    convertTodate(data)  
    request({
        url: "http://localhost:4000/StorePerformanceData/todos",
        method: "POST",
        json: true, 
        body: data
    }, function (error, response, body){
        console.log(`statusCode: ${response.statusCode}`)
     });
}

 function convertTonumbers(data){
    for(var index = 0; index < data.length; index ++){
        //for(let i = 0; i < finalResults[index].length; i ++){
            var obj = data[index];
            for(var prop in obj){
                if(obj.hasOwnProperty(prop) && obj[prop] !== null && !isNaN(obj[prop])){
                    obj[prop] = +obj[prop];   
                }
            }
        //}
    }
    }
 function convertTodate(data){
     for (let index = 0; index < data.length; index ++){
         //for(let i = 0; i < finalResults[index].length; i ++){
            let startDate = data[index].Start + 'Z'
            let endDate = data[index].End + 'Z'
            data[index].Start = new Date(startDate)
            data[index].End = new Date(endDate)
         //}
     }
}
async function getDate(){
    let response = await fetch("http://localhost:4000/sendDate/date")
    let data = await response.json()
    let date = new Date(data)
    let formattedDate = dateFormat(date, "yyyy-mm-dd'T'HH:MM:ss.ms")
    //console.log(formattedDate)
    return formattedDate
    }

}
main();