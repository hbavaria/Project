function main(){
    const request = require('request')
    const regedit = require('regedit')
    const fs = require('fs')
    const path = require('path')
    //const csvTojson = require('csvtojson')
    const csvjson = require("csvJson")

    const regPath = 'HKLM\\SOFTWARE\\WOW6432Node\\Emerson\\CIF'
    // Listing all the objects from that registry
    regedit.list(regPath, function(err,result){
    //Reading justh the value(path) of the INstallation of DeltaV
    defaultValue = result[regPath].values['DATA_DIRECTORY'].value
    processFolder(defaultValue)
    //console.log(finalResult)
    //sendData(finalResult)
    })

async function processFolder(defaultValue){
    //let results = []
    // Merging the path and some of the subfolder which were not in the path and are common on all devices
    let folder = defaultValue + '\\Performance'
    if (!fs.existsSync(folder)){
        console.log("no dir ",folder);
        return;
    }
    //await readDirectory(folder)
    //sendData(finalResult)
    finalResults = await readDirectory(folder)
    //console.log(finalResults) 
    sendData(finalResults)
}

async function readDirectory(folder){
    let results = []
    //let i = 0
    // Reading all the files in the directory and finding '.csv' extension and then read it and convert it to json string  
    let files=fs.readdirSync(folder)
    for(let i=0;i<files.length;i++){
        let fileName=path.join(folder,files[i])
        let stat = fs.lstatSync(fileName)
        if (stat.isDirectory()){
            //combine two arrays (result and one declared in  this function)
            results = results.concat((await readDirectory(fileName))) //recurse
            //await readDirectory(fileName)
        }
        else if (fileName.indexOf('.csv')>=0) {
            //i = i + 1
        
            // Calling the funtion to read that file.
             results.push(await readPerformancefile(fileName))
             //await readPerformancefile(fileName)
        }
        //i = i+1
    }
    //console.log(results)
    //sendData(results)
    return results
}

async function readPerformancefile(fileName){
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf8', function (err, data) {
          if (err) {
            reject(err);
          }
          let jsonObj = csvjson.toObject(data);
          resolve(jsonObj);
          //console.log(jsonObj)
          return jsonObj
          //console.log(jsonObj)
    });
    })
}
    //var jsonArray = [];
//This will read the file.
// fs.readFile(fileName,{encoding:'utf-8'},function(err,data){
//     if(err){
//        return  console.log(err);
//     }
//     //The following line will split the csv file line by line and store each of it in the vraiable dataArray.
//     var dataArray = data.split(/\r?\n/);
//     var fieldsArray = dataArray[0].split(",")
    //console.log(dataArray)
    //This line helps us to obtain the keys for various values in the file.
    //var fieldsArray =  dataArray.split(",");

    //The following loop creates an object for every line and then pushes it into the array.
//     for(var i=1;i<dataArray.length;i++){
//         var temp = [];
//         //console.log(fieldsArray)
//         //contains values which are separated by a comma in a line.
//         var valuesArray = dataArray[i].split(",");
//             for(var k=0;k<valuesArray.length;k++){
//                 temp[fieldsArray[k]] = valuesArray[k]
//             }   
//             //pushes the object into the array.
//             jsonArray.push(temp);
//             //console.log(temp)
//     }
//     console.log(jsonArray)
//     //console.log(temp)
//    });
//  fs.readFile(fileName, 'utf-8', (err, fileContent) => {
//      if(err) {
//          console.log(err); // Do something to handle the error or just throw it
//          throw new Error(err);
//      }
//      let jsonObj = csvjson.toObject(fileContent);
//      console.log(jsonObj[5])
//      //return jsonObj
//  });console.log(data)
 //return data

 //console.log(jsonObj)
    //console.log(jsonObj)
    //sendData(jsonObj)
  //});
//}    
    //REading the file and converting it into json string
        //  return await csvTojson()
        //  .fromFile(fileName)
        //  .then((jsonObj)=>{
        //      //console.log(jsonObj)
        //  return jsonObj
        //let jsonObj = csvTojson.toObject(fileName)
        //console.log(jsonObj)

async function sendData(finalResults){
      request({
        url: "http://localhost:4000/csvRoute/todos",
        method: "POST",
        json: true, 
        body: finalResults
    }, function (error, response, body){
        console.log(`statusCode: ${response.statusCode}`)
     });
     //let parseData = Json.parse(finalResults)
     //console.log(parseData)
     console.log(finalResults[0][0][' Session'])
    //console.log(jsonObj[0][' Run Group'])
}
}
main();