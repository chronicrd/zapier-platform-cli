const path = require('path');
const os = require('os');

const utils = require('../utils');
const exampleApps = require('../utils/example-apps');
const constants = require('../constants');

const initApp = (location) => {
  const appDir = path.resolve(location);
  const tempAppDir = path.resolve(path.join(os.tmpdir(), 'zapier', location));
  const vendorAppDir = path.resolve(__dirname, '../../templates/default-app');

  const copyOpts = {clobber: false};
  const template = global.argOpts.template || 'minimal';

  if (template !== 'minimal') {
    utils.printStarting(`Downloading zapier/zapier-platform-example-app-${template} starter app`);
    return utils.removeDir(tempAppDir)
      .then(() => utils.ensureDir(tempAppDir))
      .then(() => exampleApps.downloadAndUnzipTo(template, tempAppDir))
      .then(() => utils.printDone())
      .then(() => utils.printStarting('Copying starter app'))
      .then(() => utils.ensureDir(appDir))
      .then(() => utils.copyDir(tempAppDir, appDir, copyOpts))
      .then(() => utils.removeDir(tempAppDir))
      .then(() => utils.printDone());
  } else {
    utils.printStarting('Copying starter app');
    return utils.ensureDir(appDir)
      .then(() => utils.copyDir(vendorAppDir, appDir, copyOpts))
      .then(() => utils.printDone());
  }
};

const init = (context, location = '.') => {
  context.line('Welcome to the Zapier Platform! :-D');
  context.line();
  context.line(constants.ART);
  context.line();
  context.line('Let\'s initialize your app!');
  context.line();

  return initApp(location)
    .then(() => {
      context.line('\nFinished! You can edit `index.js` and then `zapier deploy` to build & upload your app!');
    });
};

init.argsSpec = [
  {name: 'location', default: '.'},
];
init.argOptsSpec = {
  template: {help: 'select a starting app template', choices: ['middleware', 'write', 'resource', 'search', 'httpbin'], 'default': 'minimal'}
};
init.help = 'Initializes a new zapier app in a directory.';
init.example = 'zapier init [location]';
init.docs = `\
Initializes a new zapier app. If you specify a template, will download and install app from that template.

After running this, you\'ll have a new example app in your directory. If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

> Note: this doesn't register the app with Zapier - try \`zapier register "Example"\` and \`zapier deploy\` for that!

**Arguments**

${utils.argsFragment(init.argsSpec)}
${utils.argOptsFragment(init.argOptsSpec)}

${'```'}bash
$ zapier init example-dir --template=helloworld
# Let\'s create your app!
#
#   Cloning starter app from zapier/example-app - done!
#
# Finished!
${'```'}
`;

module.exports = init;
