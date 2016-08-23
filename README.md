# Introduction

Zapier is a platform for creating integrations and workflows. This CLI is your gateway to creating custom applications on the Zapier platform.


## Getting Started

> The Zapier CLI and Platform requires Node `v4.3.2` or higher, we recommend using [nvm](https://github.com/creationix/nvm) and [homebrew](http://brew.sh/) to manage your Node installation.

First up is installing the CLI and settting up your auth to then create a working "Hello World" application. It will be private to you and visible in your live [Zapier editor](https://zapier.com/app/editor).

```bash
# install the CLI globally
npm install -g @zapier/zapier-platform-cli

# print all the commands
zapier help

# setup Zapier's auth with your deploy key
zapier auth
```

Your Zapier CLI should be installed and ready to go at this point. Next up, we'll create our first app!

```bash
# make your folder
mkdir helloworld
cd helloworld

# create the needed files from a template
zapier init --template=helloworld

# install all the libraries needed for your app
npm install
```

You should now have a working local app, you can run several local commands to try it out.

```bash
# validate the app
zapier validate

# describe the app
zapier describe

# run the local tests
# the same as npm test
zapier test
```

Next, you'll probably want to register your app and upload your version to Zapier itself so you can start testing live.

```bash
# register and deploy your app & version to Zapier
zapier register "Hello World"
zapier deploy

# list your apps
zapier apps

# list your versions
zapier versions
```

If you open the editor in Zapier, you should now see "Hello World (1.0.0)" listed and usable! We recommend using our built in watch command to iterate on the app.

```bash
# watch and sync up your local app to zapier
zapier watch

# now make changes locally, and see them reflected live in Zapier
# method calls will also be proxied and logged to stdout for convenience
```

Don't forget you'll need to `zapier deploy` to make your changes stick after any `zapier watch` session!

> Go check out our [full CLI reference documentation](docs/cli.md) to see all the other commands!


## Project Structure

In your `helloworld` folder, you should see this general structure. The `index.js` is your entry point, you'll need to export an `App` definition there.

```plain
$ tree .
.
├── README.md
├── index.js
├── package.json
├── test
│   ├── basic.js
│   └── triggers.js
├── build
│   └── build.zip
└── node_modules
    ├── ...
    └── ...
```


## Apps & Versions Overview

In Zapier's Platform there are two primary resources you'll interact with via the CLI:

* **App** - the base record that defines your App, named like "Joe's CRM". Most people have one of these.
* **Version** - a distinct implementation of an App, named like "1.0.0". Most people have many of these.

If you'd like to manage your **App**, use these commands:

* `zapier apps` - list the apps in Zapier you can administer
* `zapier register "Name"` - creates a new app in Zapier
* `zapier link` - lists and links a selected app in Zapier to your current folder
* `zapier history` - print the history of your app

If you'd like to manage your **Version**, use these commands:

* `zapier versions` - list the versions for the current directory's app
* `zapier deploy` - deploy the current version the of current directory's app & version (read from `package.json`)
* `zapier promote [1.0.0]` - mark a version as the "production" version
* `zapier migrate [1.0.0] [1.0.1] [100%]` - move users between versions, regardless of deployment status
* `zapier deprecate [1.0.0] [YYYY-MM-DD]` - mark a version as deprecated, but let users continue to use it (we'll email them)
* `zapier env 1.0.0 [KEY] [value]` - set an environment variable to some value

> Note: there is a distinction between your _local_ environment and what is deployed to Zapier - you could have many versions deployed with users on each. Making changes locally never impacts users until you `zapier promote` (including `zapier watch`). Likewise, deploying one version will not impact other versions - they are completely isolated.

### App Definition

The core definition of your `App` is will look something like this, and is what your `index.js` should provide as the _only_ export:

```javascript
const App = {
  // both version strings are required
  version: require('./package.json').version,
  platformVersion: require('./package.json').dependencies['@zapier/zapier-platform-core'],

  // see "Authentication" section below
  authentication: {},

  // see "Making HTTP Requests" section below
  requestTemplate: {},
  beforeRequest: [],
  afterResponse: [],

  // See "Resources" section below
  resources: {},

  // See "Triggers/Searches/Writes" section below
  triggers: {},
  searches: {},
  writes: {}
};
```


## Authentication

Most applications require some sort of authentication - and Zapier provides a handful of methods for helping your users authenticate with your application. Zapier will provide some of the core behaviors, but you'll likely need to handle the rest.

> Hint: You can access the data tied to your authentication via the `bundle.authData` property in any method called in your app.

### Basic

Useful if your app requires two pieces of information to authentication: `username` and `password` which only the end user can provide. By default we will do the standard Basic authentication base64 header encoding for you (via an automatically registered middleware).

> Note: if you do the common `Authorization: Basic apikey:x` you should look at the "Custom" authentication method instead.

```javascript
const App = {
  // ...
  authentication: {
    type: 'basic',
    // "test" could also be a function
    test: {
      url: 'https://example.com/api/accounts/me.json'
    }
    // you can provide additional fields, but we'll provide `username`/`password` automatically
  },
};
```

### Custom

This is what most "API Key" driven apps should default to doing, you'll likely provide some some custom `beforeRequest` middleware or a `requestTemplate` to complete the authentication by adding/computing needed headers.

```javascript
const App = {
  // ...
  authentication: {
    type: 'custom',
    // "test" could also be a function
    test: {
      url: 'https://{{bundle.authData.subdomain}}.example.com/api/accounts/me.json'
    },
    fields: [
      {key: 'subdomain', type: 'string', required: true, helpText: 'Found in your browsers address bar after logging in.'}
      {key: 'api_key', type: 'string', required: true, helpText: 'Found on your settings page.'}
    ]
  },
  beforeRequest: [
    (request, z, bundle) => {
      request.headers['X-Api-Key'] = bundle.authData.api_key;
      return request;
    }
  ]
};
```

### Digest

Very similar to the "Basic" authentication method above, but uses digest authentication instead of Basic authentication.

```javascript
const App = {
  // ...
  authentication: {
    type: 'digest',
    // "test" could also be a function
    test: {
      url: 'https://example.com/api/accounts/me.json'
    }
    // you can provide additional fields, but we'll provide `username`/`password` automatically
  },
};
```

### Session

TODO.

### OAuth2

We'll handle most of the logic around the 3 step OAuth flow but you'll be required to define how the steps work on your own. You'll also likely want to set your `CLIENT_ID` and `CLIENT_SECRET`:

```bash
# setting the environment variables in Zapier.com
$ zapier env 1.0.0 CLIENT_ID=1234
$ zapier env 1.0.0 CLIENT_SECRET=abcd

# and when running tests locally, don't forget to define them!
$ CLIENT_ID=1234 CLIENT_SECRET=abcd zapier test
```

And your definition would look something like this:

```javascript
const App = {
  // ...
  authentication: {
    type: 'oauth2',
    test: {
      url: 'https://example.com/api/accounts/me.json'
    },
    // you can provide additional fields for inclusion in authData
    oauth2Config: {
      // "authorizeUrl" could also be a function returning a string url
      authorizeUrl: {
        method: 'GET',
        url: 'https://example.com/api/oauth2/authorize',
        params: {
          client_id: '{{bundle.environment.CLIENT_ID}}',
          state: '{{bundle.inputData.state}}',
          redirect_uri: '{{bundle.inputData.redirect_uri}}',
          response_type: 'code'
        }
      },
      // we expect a response providing {access_token: 'abcd'}
      // "getAccessToken" could also be a function returning an object
      getAccessToken: {
        method: 'POST',
        url: 'https://example.com/api/v2/oauth2/token',
        body: {
          code: '{{bundle.inputData.code}}',
          client_id: '{{bundle.environment.CLIENT_ID}}',
          client_secret: '{{bundle.environment.CLIENT_SECRET}}',
          redirect_uri: '{{bundle.inputData.redirect_uri}}',
          state: '{{bundle.inputData.state}}',
          grant_type: 'authorization_code'
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    }
  },
  beforeRequest: [
    (request, z, bundle) => {
      request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
      return request;
    }
  ]
};
```


## Getting Started with Resources

A `resource` is a representation (as a JavaScript object) of one of the REST resources of your API. Say you have a `/movies`
endpoint for working with movies, you can define a movie resource in your app that will tell Zapier how to do create,
read, and update, operations on that resource.

Under the hood, Zapier converts the `resource` into the usual Triggers, Actions, and Searches. The advantage of defining
a resource over the other components directly is that, by tying the functionality together in a resource, Zapier is able
to reuse the functionality to improve the overall experience.

The quickest way to create a resource is with the `zapier scaffold` command:

```bash
zapier scaffold model "Movie"
```

This will generate the resource file and add the necessary statements to the `index.js` file to import it.

### Anatomy of a Resource

A resource has a few basic properties. The first is the `key`, which allows Zapier to identify the resource on our backend.
The second is the `noun`, the user-friendly name of the resource that is presented to users throughout the Zapier UI.

After those, there is a set of optional properties that tell Zapier what methods can be performed on the resource.
We'll look at a couple:

 * `list` - Tells Zapier how to fetch a set of this resource. This becomes a Trigger in the Zapier Editor.
 * `create` - Tells Zapier how to create a new instance of the resource. This becomes an Action in the Zapier Editor.

*Note: For information on the other available methods, see the [Resource Schema Docs](https://github.com/zapier/zapier-platform-schema/blob/master/docs/build/schema.md#modelschema).*

Peeking at the `list` property on your resource, you'll find

```javascript
{
  list: {
    display: {
      label: 'New Movie',
      description: 'Triggers when a new movie is added.'
    },
    operation: {
      perform: {
        url: `http://example.com/movies`
      }
    }
  }
}
```

TODO

## Triggers/Searches/Writes

TODO.


## Making HTTP Requests

There are two primary ways to make HTTP requests in the Zapier platform:

1. **Shorthand HTTP Requests** - these are simple object literals that make it easy to define simple/repetitive requests.
1. **Manual HTTP Requests** - this is much less "magic", you use `z.request()` to make the requests and control the response.

There are also a few helper constructs you can use to reduce boilerplate:

1. `requestTemplate` which is an shorthand HTTP request that will be merged with every request.
2. `beforeRequest` middleware which is an array of functions to mutate a request before it is sent.
2. `afterResponse` middleware which is an array of functions to mutate a response before it is completed.


### Shorthand HTTP Requests

TODO: introductory.

This features:

1. Lazy `{{curly}}` replacement.
2. Smart content type serialization.
3. Automatic non-2xx error raising.

```javascript
const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: {
          method: 'GET'
          url: 'http://{{bundle.authData.subdomain}}.example.com/api/v2/records.json',
          params: {
            sort_by: 'id',
            sort_order: 'DESC'
          }
        }
      }
    }
  }
};
```

### Manual HTTP Requests

TODO: Remind this doesn't do any of shorthand magic stuff (no curlies, smart content type or non-2xx handling).

To make a manual HTTP request, use the `request` method of the `z` object:

```javascript
const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: (z, bundle) => {
          const customHttpOptions = {
            headers: {
              'X-My-Custom-Header': 'xxx'
            }
          };

          return z.request('http://example.com/api/v2/records.json', customHttpOptions)
            .then(response => {
              if (response.status !== 200) {
                throw new Error(`Unexpected status code ${response.status}`);
              }
              const movies = JSON.parse(response.content);
              return movies;
            });
        }
      }
    }
  }
};
```

### Using standard HTTP middleware

TODO: standard HTTP middleware is not yet a thing. let's not document stuff that doesn't exist yet. put it on the wishlist.

If you need to process all HTTP requests in a certain way, you may be able to use one of utility HTTP middleware functions, by putting them in your app definition:

```javascript
const App = {
  // ...
  beforeRequest: [
    // TODO: this isn't real
    middlewares.applyRequestTemplate({
      headers: {
        'X-My-Custom-Header': 'xxx'
      }
   }
  ],
  afterRequest: [
    // TODO: these are real
    middlewares.checkStatusCode,
    middlewares.parseJSON
  ]
  // ...
};
```

With that in place, the above request would be simpler:

```javascript
const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: (z, bundle) => {
          return z.request('http://example.com/api/v2/records.json')
            .then(response => {
              // TODO: response.json isn't real
              const movies = response.json;
              return movies;
            });
        }
      }
    }
  }
};
```

### Custom HTTP Middleware

TODO

## Environment

TODO.
