var system = require('system');

var webpage = require('webpage').create();

var tableresource = null;
var redirected = false;

webpage.onResourceRequested = function (request) {
  //console.log('= onResourceRequested()');
  //console.log('  request: ' + JSON.stringify(request, undefined, 4));
};

webpage.onResourceReceived = function(response) {
  if (response.stage === "end" &&
      response.url.match(/^https:\/\/clients.mindbodyonline.com\/classic\/mainclass/))
  {
    console.log('= onResourceReceived()' );
    console.log('  id: ' + response.id + ', stage: "' + response.stage + '", url: ' + response.url);
    console.log("including resource " + response.url);
    tableresource = response.url;
  }
};

webpage.onLoadStarted = function() {
  console.trace('= onLoadStarted()');
  var currentUrl = webpage.evaluate(function() {
    return window.location.href;
  });
  console.trace('  leaving url: ' + currentUrl);
};

webpage.onLoadFinished = function(status) {
  console.trace('= onLoadFinished()');
  console.trace('  status: ' + status);
  console.trace(webpage.url);
  if (status === "success" && redirected === false)
  {
    redirected = true;
    webpage.open(tableresource);
  }
  else if (status === "success" && redirected)
  {
    var tableElement = webpage.evaluate(function() {
      return document.getElementById('classSchedule-mainTable');
    });
    getJSONClasses(tableElement);
    phantom.exit();
  }
};

webpage.onNavigationRequested = function(url, type, willNavigate, main) {
  console.trace('= onNavigationRequested');
  console.trace('  destination_url: ' + url);
  console.trace('  type (cause): ' + type);
  console.trace('  will navigate: ' + willNavigate);
  console.trace('  from webpage\'s main frame: ' + main);
};

webpage.onResourceError = function(resourceError) {
  console.trace('= onResourceError()');
  console.trace('  - unable to load url: "' + resourceError.url + '"');
  console.trace('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
};

webpage.onError = function(msg, trace) {
  console.error('= onError()');
  var msgStack = ['  ERROR: ' + msg];
  if (trace) {
    msgStack.push('  TRACE:');
    trace.forEach(function(t) {
      msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
    });
  }
  console.error(msgStack.join('\n'));
};

function scrapePage(studioId)
{
  //const url = 'https://clients.mindbodyonline.com/classic/ws?sessionChecked=true&studioid='+studioId;
  const url = 'https://clients.mindbodyonline.com/classic/home?studioid='+studioId;
  //const url = 'http://phantomjs.org';
  webpage.viewportSize = {
    width: 800,
    height: 800
  };
  webpage.open(url);
}

function getJSONClasses(tableElement)
{
  // Match up start time, class name, teacher, room and duration with table 
  // index, using the top
  var head = tableElement.tHead.rows[0];
  console.log(tableElement.tHead.rows[0]);
  for (var i = 0, col; col = head.cells[i]; i++)
  {
    console.log(col.id);
  }
  for (var i = 0, row; row = tableElement.tBodies[0].rows[i]; i++)
  {
    //iterate through rows
    //rows would be accessed using the "row" variable assigned in the for loop
    var rowText = "";
    for (var j = 0, col; col = row.cells[j]; j++)
    {
       //iterate through columns
       //columns would be accessed using the "col" variable assigned in the for loop
       rowText += " "+col.innerText;
    }  
    console.log(rowText);
  }
}

scrapePage(23194);
