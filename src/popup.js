const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
  
const DOMtoString = () => {
  var html =  document.documentElement.outerHTML;
    return html;
};

// A simple hash function for generating a unique file name
const hashFunction = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

const saveCredentials = () => {

  var status = document.getElementById("status");
   status.style.fontFamily = 'Gill Sans';
   status.style.textAlign = 'center';
   status.style.color = 'green';

   // Get the values from the form
   var accessKeyId = document.getElementById("accessKeyId").value;
   var secretAccessKey = document.getElementById("secretAccessKey").value;
   var bucketName = document.getElementById("bucketName").value;
 
   // Save the values to chrome.storage
   chrome.storage.local.set({
     accessKeyId: accessKeyId,
     secretAccessKey: secretAccessKey,
     bucketName: bucketName
   }, function() {
     // Update the status to show that the credentials were saved
     var status = document.getElementById("status");
     status.innerHTML = "Credentials saved successfully.";
   });
 }


const uploadHTML = () => {
  var status = document.getElementById("status");
  status.style.fontFamily = 'Gill Sans';
  status.style.textAlign = 'center';
  status.style.color = 'orange';
  status.innerHTML = "Loading.....";

  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    // Get the DOMAIN from the tab URL
    //var domain = new URL(tabs[0].url).hostname;
    var url = new URL(tabs[0].url);
    const fullUrl = url.href;
    const fullpath = fullUrl.replace(/\//g, '_').replace('__','_');

    console.log("Full url : "+fullUrl)
    console.log("Link of the page is "+fullpath)

    var id = tabs[0].id
    console.log("Current Tab ID is "+id)

        // Get the HTML from the tab
        chrome.scripting.executeScript({
          target: {tabId: id, allFrames: true},
          function: DOMtoString
        }, async (html) => { 

      // Generate a unique file name using the url and a hash of the HTML string
      var fileName = hashFunction(html[0]['result'])+ "_"+ fullpath + "_" + ".html";
            console.log("File name  is "+fileName)

      // Get the saved AWS credentials and bucket name from chrome.storage
      chrome.storage.local.get(["accessKeyId", "secretAccessKey", "bucketName"], async function(items) {
        var accessKeyId = items.accessKeyId;
        var secretAccessKey = items.secretAccessKey;
        var bucketName = items.bucketName;

        if (accessKeyId && secretAccessKey && bucketName) {
          // Use the AWS SDK to upload the file to S3
 
          const s3 = new S3Client({
            region: "ap-southeast-1",
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                bucket: bucketName,
              },
          });
   
          var status = document.getElementById("status");
          const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: html[0]['result']
          };

          try {
            await s3.send(new PutObjectCommand(uploadParams));
            status.innerHTML = "File uploaded successfully.";
            status.style.color = 'green';
          } catch (err) {
            status.innerHTML = "Error uploading file: " + err.message;
            status.style.color = 'red';
          }
        } else {
          // Update the status to show that the credentials are not set
          var status = document.getElementById("status");
          status.style.color = 'red';
          status.innerHTML = "Please set the AWS credentials and bucket name first.";
        }
      });
    });
  });
}

//Access the HTML elements
document.getElementById("SaveCred").addEventListener("click", saveCredentials);
document.getElementById("Upload").addEventListener("click", uploadHTML);