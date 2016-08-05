var fs = require('fs');
var moment = require('moment');
var xmldom = require('xmldom');

function dumpObject(obj, prefix)
{
  console.log('=====DUMPING OBJECT=====');
  if (prefix === undefined)
  {
    prefix = "";
  }
  for (var prop in obj)
  {
    var val = obj[prop];
    console.log(prefix + 'prop: ' + prop + ' val: ' + val);
    if (prop === 'childNodes' && val !== null)
    {
      for (var i = 0; i < val.length; ++i)
      {
        if (prefix === "")
        {
          dumpObject(val.item(i), prefix + "  ");
        }
      }
    }
  }
}

function cleanupHtml(htmlString)
{
  var cleanString = htmlString.replace(/&nbsp;/g,' ');
  //cleanString = cleanString.replace(/\<br\>/g,' ');
  //cleanString = cleanString.replace(/\<input.*\>/g,' ');
  return cleanString;
}

function parseFromData(cell)
{
  if (cell.childNodes !== null &&
      cell.childNodes.length > 0)
  {
    var dataCell = cell.childNodes[0];
    if (dataCell.data !== null &&
        dataCell.data !== undefined)
    {
      return dataCell.data.trim();
    }
  }
}

function parseFromChild(cell, recurseLevel)
{
  var firstData = parseFromData(cell);

  if (firstData !== undefined)
  {
    return firstData;
  }

  if (firstData === undefined && recurseLevel > 0)
  {
    if (cell.childNodes !== null &&
        cell.childNodes !== undefined &&
        cell.childNodes.length > 0)
    {
      console.log(cell.childNodes[0]);
      return parseFromChild(cell.childNodes[0], recurseLevel - 1);
    }
  }
}

function makeParseFromChildFunction(recurseLevel)
{
  return function(cell) { return parseFromChild(cell, recurseLevel); };
}

var PARSER_MAP =
{
  start: 
  {
    required: true,
    column: [ 'Start time' ],
    parser: parseFromData,
  },
  course:
  {
    required: true,
    column: [ 'Classes' ],
    parser: makeParseFromChildFunction(1),
  },
  teacher:
  {
    required: true,
    column: [ 'Teacher', 'Yoga + Pilates Mat Teacher' ], 
    parser: makeParseFromChildFunction(2),
  },
  duration:
  {
    required: true,
    column: [ 'Duration' ],
    parser: parseFromData,
  },
  room:
  {
    required: false,
    column: [ 'Room' ],
    parser: parseFromData,
  },
  locale:
  {
    required: false,
    column: [ 'Location' ],
    parser: parseFromData,
  },
};

function propNameOfColumnHeader(col)
{
  for (var prop in PARSER_MAP)
  {
    var headers = PARSER_MAP[prop];
    if (PARSER_MAP[prop].column.indexOf(col) !== -1)
    {
      return prop;
    }
  }
  return '';
}

function makeColumnMap(headerRow)
{
  var map = {};

  for (var i = 0; i < headerRow.childNodes[0].childNodes.length; ++i)
  {
    var item = headerRow.childNodes[0].childNodes[i];
    if (item.childNodes !== null &&
        item.childNodes.length > 0)
    {
      var data = item.childNodes[0].data;
      var propName = propNameOfColumnHeader(data);
      if (propName !== undefined && propName !== "")
      {
        console.log('Mapping for "'+data+'",property "'+propName+'", index '+i);
        map[i] = propName;
      }
    }
  }

  return map;
}

function parseDateFromRow(row)
{
  var DATE_LOCATION = 2; // MAGIC NUMBER

  var firstCell = row.childNodes[0];
  if (firstCell.childNodes !== null &&
      firstCell.childNodes.length > 0)
  {
    // Pull out the date
    var firstData = firstCell.childNodes[0];
    if (firstData.childNodes !== null &&
        firstData.childNodes.length > DATE_LOCATION)
    {
      var dateElement = firstData.childNodes[DATE_LOCATION].data.trim();
      var parsedDate = moment(dateElement, 'DD MMM YYYY');
      if (parsedDate.isValid())
      {
        console.log('Current date: ' + parsedDate.format('DD MMM YYYY'));
      }
      else
      {
        console.log('Problem parsing date from data element in:"' + dateElement + '"');
      }
      return parsedDate;
    }
  }
}

function isCourseValid(course)
{
  for (var prop in PARSER_MAP)
  {
    if (PARSER_MAP[prop].required && course.hasOwnProperty(prop) === false)
    {
      return false;
    }
  }
  return true;
}

function parseCourseStart(webCourse, currentDate)
{
  var courseStart = moment(webCourse['start'], 'HH:mm');
  if (courseStart.isValid())
  {
    courseStart.year(currentDate.year());
    courseStart.month(currentDate.month());
    courseStart.date(currentDate.date());
  }
  else
  {
    console.log('Error parsing time from start time: ' + webCourse['start']);
  }
  return courseStart;
}

function parseCourseEnd(webCourse, courseStart)
{
  var NUMBER_LOCATION = 1;
  var TIME_TYPE_LOCATION = 2;
  var SECOND_NUMBER_LOCATION = 4; // needed for "1 hour & 15 minutes"
  var SECOND_TIME_TYPE_LOCATION = 5;
  var durationRegex = /(\d+) *([a-zA-Z]+)( & (\d+) *([a-zA-Z]+))?/;
  var match = webCourse.duration.match(durationRegex);

  var courseEnd = courseStart.clone().add(
      Number(match[NUMBER_LOCATION]),
      match[TIME_TYPE_LOCATION]);
  if (match[SECOND_NUMBER_LOCATION] !== undefined &&
      match[SECOND_TIME_TYPE_LOCATION] !== undefined)
  {
    courseEnd = courseEnd.add(
        Number(match[SECOND_NUMBER_LOCATION]),
        match[SECOND_TIME_TYPE_LOCATION]);
  }
  if (courseEnd.isValid() === false)
  {
    console.log('Error parsing end time from duration: ' + webCourse['Duration']);
  }
  return courseEnd;
}

function dbCourseOfWebCourse(webCourse, currentDate, studio)
{
  var dbCourse = 
  {
    name: webCourse['course'],
    start: null,
    end: null,
    teacher: webCourse['teacher'],
    studio: studio.name,
    room: webCourse['room'],
    location: webCourse['location'],
    url: null,
  };

  dbCourse.start = parseCourseStart(webCourse, currentDate);
  dbCourse.end = parseCourseEnd(webCourse, dbCourse.start);

  return dbCourse;
}

function rowIsValid(row)
{
  var STRIKETHROUGH_TAG_LOCATION = 1;
  if (row.childNodes === undefined || 
      row.childNodes === null ||
      row.childNodes.length === 0)
  {
    return false;
  }
  var firstCell = row.childNodes[0];
  // test if strikethrough tag exists
  if (firstCell.childNodes !== null &&
      firstCell.childNodes.length > STRIKETHROUGH_TAG_LOCATION)
  {
    var tagCell = firstCell.childNodes[STRIKETHROUGH_TAG_LOCATION];
    if (tagCell.tagName === 's' || tagCell.nodeName === 's')
    {
      return false;
    }
  }
  return true;
}

function makeJSONCourses(columnMap, tableRows, studio)
{
  var courses = [];
  var FIRST_DATA_ROW_LOCATION = 1; // MAGIC NUMBER

  var currentDate = null;

  for (var i = FIRST_DATA_ROW_LOCATION; i < tableRows.length; ++i)
  {
    var row = tableRows[i];
    var nextDate = parseDateFromRow(row);
    if (nextDate !== undefined && nextDate.isValid())
    {
      currentDate = nextDate;
    }
    else if (rowIsValid(row))
    {
      var course = {};
      for (var j = 0; j < row.childNodes.length; ++j)
      {
        var cell = row.childNodes[j];
        if (columnMap[j] !== undefined)
        {
          var key = columnMap[j];
          course[key] = PARSER_MAP[key].parser(cell);
        }
        else
        {
          //console.log('No mapping for column: ' + j);
        }
      }
      if (isCourseValid(course))
      {
        var dbCourse = dbCourseOfWebCourse(course, currentDate, studio);
        courses.push(dbCourse);
      }
      else
      {
        console.log('No valid course found:');
        console.log(course);
      }
    }
  }
  return courses;
}

function processPage(htmlString, studio, callback)
{
  var cleanString = cleanupHtml(htmlString);
  var parser = new xmldom.DOMParser();
  var dom = parser.parseFromString(cleanString, 'text/html');

  //var headerRow = dom.querySelector('.floatingHeaderRow');
  var headerRow = dom.getElementsByTagName('thead');
  var columnMap= makeColumnMap(headerRow[0]);

  //var tableRows = dom.querySelectorAll('.header,.evenRow,.oddRow');
  var tableRows = dom.getElementsByTagName('tr');
  var courses = makeJSONCourses(columnMap, tableRows, studio);
  if (callback !== undefined)
  {
    callback(courses);
  }
}

exports.parsePage = function (path, studio, callback)
{
  fs.readFile(path, 'utf8', function(error, data) {
    if (error)
    {
      console.log(error);
    }
    else
    {
      processPage(data, studio, callback);
    }
  });
}

// For testing
var studioInfo =
{
  "name": "Blue Cow Yoga",
  "provider": "MBO",
  "studioid": 23194,
  "area": "Bank"
};

function loggerCallback(courses)
{
  console.log(courses);
}

//exports.parsePage('test_teacher.html', studioInfo, loggerCallback);
