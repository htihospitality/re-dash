# flow_drift

> This sample tries to demonstrate the Flow sample using Drift as the back-end for app state as opposed to a Clojure map.

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

## Updating the Drift database schema

> Ignore this section if you only intend to run this sample as is. Read on if you made some changes that require a scheme update.

Drift requires a schema to be persisted prior to any rows  being inserted, see [Database class](https://drift.simonbinder.eu/docs/getting-started/#database-class)

This sample includes a pre-built schema with source in `lib/database.dart`.

Any changes to the schema will need to be recompiled:


```bash

# Either once off

dart run build_runner build

# Or watched for changes

dart run build_runner watch

```
