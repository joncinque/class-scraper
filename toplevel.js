var fs = require('fs');
var phantomjs = require('phantomjs-prebuilt');
//var getcourse = require('./getcourse'); // used by phantom file
var parsecourse = require('./parsecourse');

function logCourse(course)
{
  console.log("{ name: '" + course.name + "'");
  console.log("  , start: " + course.start.format('DD-MM-YYYY HH:mm'));
  console.log("  , end: " + course.end.format('DD-MM-YYYY HH:mm'));
  console.log("  , room: '" + course.room + "'");
  console.log("  , studio: '" + course.studio + "'");
  console.log("  , teacher: '" + course.teacher + "'");
  console.log("  , url: '" + course.url + "'");
  console.log("}");
}

function makeFinishedCallback(studio)
{
  return function (courses)
  {
    console.log('Finished for studio: ' + studio.name);
    courses.forEach(logCourse);
  }
}

function getCourses(studio)
{
  var htmlFile = studio.studioid + '.html';
  var program = phantomjs.exec('getcourse.js', studio.provider, studio.studioid);
  //program.stdout.pipe(process.stdout)
  //program.stderr.pipe(process.stderr)
  program.on('exit', code => {
    parsecourse.parsePage(htmlFile, studio, makeFinishedCallback(studio));
  })
}

function getAllCourses()
{
  fs.readFile('studios.json', 'utf8', function (error, data) {
    if (error)
    {
      throw error;
    }
    var studioInfo = JSON.parse(data);
    for (var index in studioInfo)
    {
      var studio = studioInfo[index];
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

if (require.main === module)
{
  getAllCourses();
}
