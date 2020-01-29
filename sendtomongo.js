'use strict';

require('dotenv').config()
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient
const logger = require('./logger');

async function deleteFutureCourses(mongoUri, dbName, collectionName) {
  const client = await MongoClient.connect(mongoUri);
  const dbo = client.db(dbName);
  const col = dbo.collection(collectionName);
  const query = {start: {$gt: new Date()}}
  await col.deleteMany(query);
  logger.info('Done deleting');
}

async function upsertCourses(mongoUri, dbName, collectionName, coursesFile) {
  const client = await MongoClient.connect(mongoUri);
  const dbo = client.db(dbName);
  const col = dbo.collection(collectionName);
  let data = fs.readFileSync(coursesFile, 'utf8');
  const courses = JSON.parse(data);
  const ops = courses.map(x => {
    return {
      updateOne: {
        filter: {name:x.name, start:x.start, studio: x.studio, postcode: x.postcode, timezone: x.timezone},
        update: {$set: {
          name: x.name,
          teacher: x.teacher,
          room: x.room,
          style: x.style,
          start: x.start,
          end: x.end,
          locale: x.locale,
          studio: x.studio,
          url: x.url,
          booking: x.booking,
          postcode: x.postcode,
          timezone: x.timezone,
        }},
        upsert:true}
    };
  });
  await col.bulkWrite(ops, {ordered: false})
  logger.info('Done writing');
}

async function start() {
  await deleteFutureCourses(process.env.MONGO_URI, process.env.DB_NAME, process.env.COLLECTION);
  await upsertCourses(process.env.MONGO_URI, process.env.DB_NAME, process.env.COLLECTION, process.argv[2]);
}

if (require.main === module) {
  start().then(() => {
    logger.info("All done");
    process.exit(0);
  });
}
