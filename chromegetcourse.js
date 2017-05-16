'use strict';

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const verbose = true;

function sleep (miliseconds = 1000) {
  return new Promise(resolve => setTimeout(() => resolve(), miliseconds))
}

exports.dumpCourseTable = (providerName, studioId, extraString) =>
{
  const options = {
    host: 'localhost',
    port: 9222
  };
  return CDP(options, async (client) => {
      const {Page, DOM, Runtime} = client;
      try {
        console.log('Starting studio id [' + studioId + ']')
        await Page.enable();
        await DOM.enable();
        await Runtime.enable();
        await Page.navigate({url: 'https://clients.mindbodyonline.com/classic/home?studioid='+studioId});
        await Page.loadEventFired();

        let topNode = await DOM.getDocument();
        // Check the table exists
        let tableViewNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#tabTD7.tab-sel'
        });
        let updatedTab = false;
        if (tableViewNode.nodeId === 0) { // not found
          debugger;
          const clickEvent = "document.querySelector('#tabA7').click();";
          await Runtime.evaluate({expression: clickEvent});
          await Page.loadEventFired();
          debugger;
          updatedTab = true;
        }
        if (verbose) {
          console.log('Change to class tab ['+updatedTab+']');
        }

        // Check the view
        if (updatedTab) {
          topNode = await DOM.getDocument();
        }
        let viewNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#week-tog-c.date-tog-sel-c'
        });

        let updatedView = false;
        if (viewNode.nodeId === 0) { // not found
          updatedView = true;
          debugger;
          const clickEvent = "document.querySelector('#week-tog-c').click();";
          await Runtime.evaluate({expression: clickEvent});
          await Page.loadEventFired();
          debugger;
        }
        if (verbose) {
          console.log('Updated view mode ['+updatedView+']');
        }

        if (updatedView) {
          topNode = await DOM.getDocument();
        }
        // Check the location
        let locationNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#optLocation'
        });
        let updatedLocation = false;
        if (locationNode.nodeId !== 0) { // was found
          updatedLocation = true;
          debugger;
          const toggleEvent = "var d = document.querySelector('#optLocation'); d.selectedIndex = 0; d.onchange();";
          await Runtime.evaluate({expression: toggleEvent});
          await Page.loadEventFired();
          debugger;
        }
        if (verbose) {
          console.log('Updated location ['+updatedLocation+']');
        }

        // Get the table
        if (updatedLocation) {
          topNode = await DOM.getDocument();
        }
        let tableNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '.classSchedule-mainTable-loaded'
        });
        let tableHTML = await DOM.getOuterHTML({
          nodeId: tableNode.nodeId
        });
        fs.writeFileSync(Math.abs(studioId) + '.html', tableHTML.outerHTML);
        console.log('Dumped table for studio [' + studioId +']');
        const {data} = await Page.captureScreenshot();
        fs.writeFileSync('scrot.png', Buffer.from(data, 'base64'));
        await client.close();
        client._notifier.emit('finish-dumping', client, Math.abs(studioId) + '.html');
      } catch (err) {
        console.error(err);
        await client.close();
      }
  }).on('error', (err) => {
    console.error(err);
    console.error('Problem with studio id [' + studioId + ']')
  });
}
