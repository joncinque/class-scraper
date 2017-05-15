const CDP = require('chrome-remote-interface');
const fs = require('fs');

CDP(async (client) => {
    const {Page, DOM} = client;
    try {
        await Page.enable();
        await DOM.enable();
        await Page.navigate({url: 'https://clients.mindbodyonline.com/classic/home?studioid=1991'});
        await Page.loadEventFired();
        DOM.getDocument((error, params) => {
          if (error) {
            console.error(params);
            return;
          }
          const options = {
            nodeId: params.root.nodeId,
            selector: '.classSchedule-mainTable-loaded'
          };
          DOM.querySelector(options, (error, params) => {
            if (error) {
              console.error(params);
              return;
            }
            const options = {
              nodeId: params.nodeId
            };
            DOM.getOuterHTML(options, (error, params) => {
              if (error) {
                console.error(params);
                return;
              }
              console.log(params);
            });
          });
        });

        const {data} = await Page.captureScreenshot();
        fs.writeFileSync('scrot.png', Buffer.from(data, 'base64'));
    } catch (err) {
        console.error(err);
    }
    await client.close();
}).on('error', (err) => {
    console.error(err);
});
