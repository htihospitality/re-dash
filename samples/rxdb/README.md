# rxdb

> This sample tries to demonstrate the Flow sample using RxDB (experimental) as the back-end for app state as opposed to a Clojure map.

Shows an example of using Flows to calculate a derived result of some calculation, in addition to Flow life-cycle controls.

## Run the sample

### Create the platform folders

```bash
flutter create .
```

### Run it

```bash
clj -M:cljd flutter
```

## Updating the RxDB database schema

> Ignore this section if you only intend to run this sample as is. Read on if you made some changes that require a scheme update.

RxDB requires a schema to be persisted prior to any documents being inserted, see [RxDB Flutter Example](https://github.com/pubkey/rxdb/blob/master/examples/flutter/README.md)

This sample includes a pre-built schema with source in `.javascript/src/index.js`.

Any changes to the schema will need to be recompiled with node

(for more information see: https://rxdb.info/articles/flutter-database.html)

```bash
## Make any required changes to .javascript/src/index.js

## Clone RxDB

cd $HOME/src

git clone git@github.com:pubkey/rxdb.git

## Copy over .javascript/src/index.js into the rxdb clone

cp $HOME/src/re-dash/samples/rxdb/javascript/src/index.js $HOME/src/rxdb/examples/flutter/javascript/src/index.js

## Run the npm build scripts

cd $HOME/src/rxdb/examples/flutter/javascript

npm run preinstall && npm run build

## Copy back the compiled dart node package and dist folder

mkdir -p $HOME/src/re-dash/samples/rxdb/javascript/node_modules/rxdb/src/plugins/flutter/dart

cp -r $HOME/src/rxdb/examples/flutter/javascript/node_modules/rxdb/src/plugins/flutter/dart $HOME/src/re-dash/samples/rxdb/javascript/node_modules/rxdb/src/plugins/flutter

mkdir -p $HOME/src/re-dash/samples/rxdb/javascript/dist

cp $HOME/src/rxdb/examples/flutter/javascript/dist/index.js $HOME/src/re-dash/samples/rxdb/javascript/dist/index.js
```
