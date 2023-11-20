# Debugging

Often, when troubleshooting a more complex app you'll seek to answer some of these questions:

- Which events are firing?
- In which order did they fire?
- How long did my event take to update app db (state)?
- What did my app db (state) look like before & after an event?

## Logging

We can manually add some logging statements in our event handlers for example:

```clojure

(rd/reg-event-db
   ::count
   (fn [db _]
     (dart:core/print (str "db before value: " db))       ;; <== This
     (let [new-db (update db :current-count inc)]
       (dart:core/print (str "db after value: " new-db))  ;; <== This
       new-db)))
```

This is cumbersome, error prone, and involve quite a bit of refactoring. There is an easier way..

## The `debug` Interceptor

Taking inspiration from [re-frame](https://github.com/Day8/re-frame/blob/master/docs/Debugging.md#the-debug-interceptor) we also have a built in `debug` interceptor at our disposal in re-dash

### Usage

```clojure
(rd/reg-event-db
   ::count
   [(rd/debug)]          ;; <== Add the built-in debug interceptor
   (fn [db _]
     (update db :current-count (fnil inc 0))))
```

### Console Output

```
###############################################
### Event: :acme.model/count
-----------------------------------------------
### DB Diff Before (Removed):
{}
-----------------------------------------------
### DB Diff After (Added):
{:current-count 1}
###############################################
```

### Options

Providing an options map we can add / remove some logging detail:

- `:args?` Default `false`. Include the arguments passed to the event when it was dispatched.
- `:diff?` Default `true`.  Include the 1st two elements from the `clojure.data/diff` tuple.
  - The DB diff before the app db was updated (the data that's been removed/changed by the event)
  - The DB diff after the app db was updated (the data that's been added/changed by the event)
- `:stats?` Default `false`. Include basic timed statistics for the event execution.
- `:target` Default `:target/console`. Logging target, one of
  - `:target/console`   - Standard out
  - `:target/dev-tools` - (Experimental) Flutter [DevTools logging view](https://docs.flutter.dev/tools/devtools/logging), with Kind `re-dash`
  - `:target/everywhere` - Log to both console and Flutter DevTools (experimental)

With all the options enabled:

```clojure
(rd/debug {:args? true :diff? true :stats? true})
```

and the event dispatched with an argument for example:

```clojure
(rd/dispatch [::model/count 1])
```

the console output will be:

```
###############################################
### Event: :acme.model/count
### Started  : 2023-11-18 14:43:23.283354
### Finished : 2023-11-18 14:43:23.289723
### Duration : 0:00:00.006369
-----------------------------------------------
### Event Args:
1
-----------------------------------------------
### DB Diff Before (Removed):
{}
-----------------------------------------------
### DB Diff After (Added):
{:current-count 1}
###############################################
```

if we want to keep the logging minimal, disabling all the options will merely print the event id:

```clojure
Event: :acme.model/count
```

### Global debugging

We can get a global view of what events are running in our program by registering `debug` as a global interceptor for example:

Add this somewhere early on in your app's startup, like in `main`

```clojure
(rd/reg-global-interceptor
  (rd/debug))
```
