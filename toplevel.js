var fs = require('fs');
var getcourse = require('getcourse');
var parsecourse = require('parsecourse');

function finishedCallback(courses)
{
  console.log(courses);
}

function makePhantomCallback(studioInfo, finalCallback)
{
  return function(htmlFile)
  {
    parsecourse.parsePage(htmlFile, studioInfo, finalCallback);
  }
}

function getCourses(studio)
{
  var htmlFile = studio.studioid + '.html';
  getcourse.scrapePage(studio.studioid, makePhantomCallback(studio, finishedCallback));
}

function getAllCourses()
{
  fs.readFile('studios.json', 'utf8', function (error, data) {
    if (error)
    {
      throw error;
    }
    var studioInfo = JSON.parse(data);
    for (var studio in studioInfo)
    {
      if (studio.provider === 'MBO')
      {
        getCourses(studio);
      }
      else
      {
        console.log('Cannot process studio without provider: ' + studio);
      }
    }
  });
}

getAllCourses();
