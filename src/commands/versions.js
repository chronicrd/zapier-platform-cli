const utils = require('../utils');

var versions = (context) => {
  return utils.listVersions()
    .then((data) => {
      context.line(`All versions of your app "${data.app.title}" listed below.\n`);
      utils.printData(data.versions, [
        ['Version', 'version'],
        ['Platform', 'platform_version'],
        ['Users', 'user_count'],
        ['Deployment', 'deployment'],
        ['Deprecation Date', 'deprecation_date'],
        ['Timestamp', 'date'],
      ]);
      if (!data.versions.length) {
        context.line('\nTry adding an version with the `zapier push` command.');
      }
    });
};
versions.argSpec = [];
versions.argOptsSpec = {};
versions.help = 'Lists all the versions of the current app.';
versions.example = 'zapier versions';
versions.docs = `\
**Options**

${utils.defaultArgOptsFragment({cmd: 'versions'})}

${'```'}bash
$ zapier versions
# All versions of your app "Example" listed below.
# 
# ┌─────────┬──────────┬───────┬────────────────┬──────────────────┬─────────────────────┐
# │ Version │ Platform │ Users │ Deployment     │ Deprecation Date │ Timestamp           │
# ├─────────┼──────────┼───────┼────────────────┼──────────────────┼─────────────────────┤
# │ 1.0.0   │ 3.0.0    │ 0     │ non-production │ null             │ 2016-01-01T22:19:36 │
# └─────────┴──────────┴───────┴────────────────┴──────────────────┴─────────────────────┘
${'```'}
`;

module.exports = versions;
