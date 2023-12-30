# Databases

Global state in re-dash is stored in some database.

Usually this database is in-memory only and represented as some data structure, like a map - this is the default behavior.

Other times we might require more capability like persistence, relational queries, replication etc. and want to opt for using a full featured database engine on the client instead, while keeping with the core concepts of the [data loop](https://day8.github.io/re-frame/a-loop/) - events, subscriptions etc.

This is achieved by implementing the `Database` protocol. Out the box, re-dash ships with support for 3 database implementations of this protocol:

- AppDB (the default path based Map Atom)
- [Drift](https://drift.simonbinder.eu/) (a relational persistence library over sqlite3)
- [RxDB](https://rxdb.info/articles/flutter-database.html)  (a popular reactive NoSQL database for JavaScript, usable from Flutter)

## AppDB

The default path based Map Atom.

This `Database` is registered by default,  always available to query via subscriptions or update via events using the built-in `:db` effect.

## Drift

[Drift](https://drift.simonbinder.eu/) is the relational persistence library for your Dart and Flutter apps - it is an abstraction over sqlite3.

### Schema

The simplest way (currently) is to maintain the Drift schema in raw `.dart` files in the `/.lib` folder directly and have the code generator watch it with `dart run build_runner watch`.

For more info see the `samples/drift/lib/database.dart` sample and the [drift documentation](https://drift.simonbinder.eu/docs/getting-started/#database-class).

### Database registration

Register it early on in the app startup (like in `main`)

```clojure
(await
  (rd/reg-database
    :drift                                 ;; <== Choose any `database-id`
    {:impl     (drift/Drift.)              ;; <== The `Database` protocol implementation
     :instance (database/AppDatabase.)}))  ;; <== The database instance
```

### Subscription

Use the chosen database-id in `reg-sub` that should target Drift for example

```clojure
(rd/reg-sub
  ::app-state
  :drift                               ;; <== The registered database-id
  (fn [^db/AppDatabase db _]
    (.select db (.-appState db))))     ;; <== Query that returns a subsribable (stream)

(rd/reg-sub
  ::width
  :drift
  (fn [_]
    (rd/subscribe [::app-state]))      ;; <== Layer 3 signal(s) supported
  (fn [[^db/AppStateData data] _]
    (.-width data)))
```

### Events

Use the chosen database-id as the effect-id in events.

Note that the event itself does not mutate the database directly, but instead returns a function being passed the database instance. This is keeping with re-dash (& re-frame) methodology of writing pure event handlers - the mutation is applied later when re-dash execute effects.

There is no need to register the `:drift` (database-id) effect as this is automatically done for you.

```clojure
(rd/reg-event-fx
    ::increment-width
    (fn [_ [_ width]]
      {:drift #(let [db ^db/AppDatabase %]
                 (.write (.update db (.-appState db))
                         (db/AppStateCompanion
                           .width (-> width inc int d/Value))))}))
```

### Sample app

There's a working sample app in the `samples/drift` folder using the Drift database as app state


## RxDB

A popular reactive NoSQL database for JavaScript, [somewhat usable from Flutter](https://rxdb.info/articles/flutter-database.html). It has various storage layer plugins including an in-memory only option.

### Schema

Maintain the schema in raw JavaScript, and compile it with node.

For more info see the `samples/rxdb/javascript/src/index.js` sample and the [rxdb documentation](https://github.com/pubkey/rxdb/tree/master/examples/flutter#in-javascript)

### Database registration

Register it  early on in the app startup (like in `main`)

```clojure
(await
    (rd/reg-database
      :rxdb                                                          ;; <== Choose any `database-id`
      {:impl     (rx-db/RxDB.)                                       ;; <== The `Database` protocol implementation
       :instance (database/getRxDatabase "javascript/dist/index.js"  ;; <== The database instance
                                         "AppDatabase")}))
```

### Subscription

Use the chosen database-id in `reg-sub` that should target RxDB for example

```clojure
(rd/reg-sub
  ::app-state
  :rxdb                                         ;; <== The registered database-id
  (fn [db [_ selector]]
    (-> (.getCollection db coll-name)
        (.find selector))))                     ;; <== Query that returns a subsribable (stream)

(rd/reg-sub
  ::width
  :rxdb
  (fn [_]
    (rd/subscribe [::app-state]))               ;; <== Layer 3 signal(s) supported
  (fn [[doc] _]
    (get (->> (.-data ^rxdb/RxDocument doc)
              (into {}))
         "width")))
```

### Events

Use the chosen database-id as the effect-id in events.

Note that the event itself does not mutate the database directly, but instead returns a function being passed the database instance. This is keeping with re-dash (& re-frame) methodology of writing pure event handlers - the mutation is applied later when re-dash execute effects.

There is no need to register the `:rxdb` (database-id) effect as this is automatically done for you.

```clojure
(rd/reg-event-fx
    ::increment-width
    (fn [_ _]
      {:rxdb #(.insert (.getCollection % coll-name)
                       {"id"    (str (DateTime/now))
                        "width" ((fnil f 0) val)})}))
```

### Status

RxDB for Flutter is experimental, and many features are missing.

Some of the known limitations include:

- Documents can only be inserted, queried and observed. [Update is not yet supported](https://pub.dev/documentation/rxdb/latest/rxdb/RxCollection-class.html)
- Only collection queries can be observed (subscribed) not documents, or individual fields in a document.
- RxDB for Flutter is not supported in the web platform.


### Sample app

There's a working sample app in the `samples/rxdb` folder using the RxDB database as app state

## Custom implementation

Adding support for another database is a matter of implementing the `Database` protocol and registering it early on in the app startup, like in main:

```clojure
(await
  (rd/reg-database
    :my-database-id                    ;; <== Choose any `database-id`
    {:impl     (my/DatabaseImpl.)      ;; <== Instantiate the `Database` protocol implementation
     :instance (some/MyDatabase.)}))   ;; <== Instantiate the database instance
```

To support subscriptions, the database engine must support some way of watching / observing queries.
