![re-dash logo](doc/images/re-dash.png)

# re-dash

[![Clojars Project](https://img.shields.io/clojars/v/net.clojars.htihospitality/re-dash.svg)](https://clojars.org/net.clojars.htihospitality/re-dash)
![CI](https://github.com/htihospitality/re-dash/workflows/CI/badge.svg)

A [ClojureDart](https://github.com/Tensegritics/ClojureDart) framework, inspired by re-frame, for building user interfaces with Flutter

## Features

* Global central state management
* Pure views with no direct reference to global state
* Interact with global state via events & subscriptions
* Handle side effects at the edge with effect handlers
* Familiar api if coming from re-frame
  * [Event Dispatch](https://day8.github.io/re-frame/a-loop/#1st-domino-event-dispatch)
  * [Event Handling](https://day8.github.io/re-frame/a-loop/#2nd-domino-event-handling)
    * [Coeffects](https://day8.github.io/re-frame/Coeffects/)
    * [Interceptors](https://day8.github.io/re-frame/Interceptors/)
  * [Effect Handling](https://day8.github.io/re-frame/a-loop/#3rd-domino-effect-handling)
  * [Signal Graph](https://day8.github.io/re-frame/a-loop/#domino-4-query)
  * [Subscriptions](https://day8.github.io/re-frame/a-loop/#domino-5-view)
  * [Flows](/doc/03-flows.md) (alpha)

## Documentation

[![cljdoc badge](https://cljdoc.org/badge/net.clojars.htihospitality/re-dash)](https://cljdoc.org/d/net.clojars.htihospitality/re-dash)

Most (not all) of the concepts in [re-frame](http://day8.github.io/re-frame/re-frame/) has been made available in this library, and the aim is to share the same api as far as possible, so if you're familiar with re-frame, picking up re-dash should feel natural.

To gain an understanding of the concepts in re-dash, head over to the excellent documentation in [re-frame](http://day8.github.io/re-frame/re-frame/)

Also see [State management in ClojureDart](https://www.etiennetheodore.com/state-management-in-clojuredart) by [Etienne Théodore](https://github.com/Kiruel) for a detailed walk-through

## London Clojurians Talk (Feb 2024)

[<img src="https://img.youtube.com/vi/4A7oK0UJe9w/maxresdefault.jpg" width="80%">](https://www.youtube.com/watch?v=4A7oK0UJe9w "London Clojurians Talk Feb 2024")

## Configuration

[![Clojars Project](https://img.shields.io/clojars/v/net.clojars.htihospitality/re-dash.svg)](https://clojars.org/net.clojars.htihospitality/re-dash)

Follow the [ClojureDart Quickstart](https://github.com/Tensegritics/ClojureDart/blob/main/doc/flutter-quick-start.md) guide to get your app up and running

Then, add the `re-dash` dependency

### deps.edn

#### from clojars

```edn
:deps {net.clojars.htihospitality/re-dash {:mvn/version "0.9.4"}}
```

#### from a commit

```edn
:deps {hti/re-dash
       {:git/url "https://github.com/htihospitality/re-dash.git"
        :sha "find the latest sha on github"}}
```

## Samples

In the `samples` folder of this repository:

| Demo | App | Description |
| ----------- | ------ | ------------ |
| [Launch](https://htihospitality.github.io/re-dash/counter/build/web/) | `counter` | Shows an example of an incrementing counter when clicked. An event is dispatched, counter incremented in app-db, and logging to console as an effect. |
| [Launch](https://htihospitality.github.io/re-dash/fetch/build/web/) | `fetch` | Shows an example of data fetching from an HTTP endpoint, using effects. A spinner indicates that an HTTP request is in flight. |
| [Launch](https://htihospitality.github.io/re-dash/signals/build/web/) | `signals` | Same as the counter sample, but showing various subscription signals: single, vector & map. This demonstrates the subscription signal graph in action. |
| [Launch](https://htihospitality.github.io/re-dash/coeffects/build/web/) | `coeffects` | Shows an example of injecting coeffects into an event handler. The current time is injected as a coeffect, incremented, and logged to the console as an effect. |
| [Launch](https://htihospitality.github.io/re-dash/local_storage/build/web/) | `local_storage` | Shows an example of how to initialize shared_preferences and inject values into event handlers using coeffects. |
| [Launch](https://htihospitality.github.io/re-dash/flow/build/web/) | `flow` | (alpha) Shows an example of using [Flows](/doc/03-flows.md) to calculate a derived result of some calculation, in addition to Flow life-cycle controls. |
| [Launch](https://htihospitality.github.io/re-dash/event_queue/build/web/) | `event_queue` | Shows an example of ordered event execution during longer processing events & effects. Logged to console. |
| [Launch](https://htihospitality.github.io/re-dash/drift/build/web/) | `drift` | Shows an example of how to use Drift as the app state back-end database instead of the default path based Map Atom. |
| N/A | `rxdb` | Shows an example of how to use RxDB as the app state back-end database instead of the default path based Map Atom (NOTE - RxDB for Flutter is [not yet production ready](https://github.com/pubkey/rxdb/tree/master/examples/flutter)) and also does not support the Web platform. |


## Quickstart

What follows is an example of the [six dominoes](http://day8.github.io/re-frame/a-loop/#six-dominoes) principle implemented with `re-dash`

The full working example is available under `samples/counter`

### 1st Domino - Event Dispatch

```clojure
(ns acme.view
  (:require ["package:flutter/material.dart" :as m]
            [acme.model :as model]
            [hti.re-dash :as rd]))

...

(m/IconButton
 .icon (m/Icon (m/Icons.add_circle_outline))
 .onPressed #(rd/dispatch [::model/count]))    ;; <== This

...
```
[More info](http://day8.github.io/re-frame/dominoes-30k/#domino-1-event-dispatch)

### 2nd Domino - Event Handling

Both `reg-event-db` and `reg-event-fx` are supported

```clojure
(ns acme.model
  (:require [hti.re-dash :as rd]))

...

(rd/reg-event-fx
   ::count
   (fn [{:keys [db]} _]
     (let [current-count ((fnil inc 0) (:current-count db))]
       {:db (assoc db :current-count current-count)
        ::log-count current-count})))

...

```
[More info](http://day8.github.io/re-frame/dominoes-30k/#domino-2-event-handling)

### 3rd Domino - Effect Handling


```clojure
(ns acme.model
  (:require [hti.re-dash :as rd]))

...

(rd/reg-fx
   ::log-count
   (fn [current-count]
     (println (str "The current-count is " current-count))))

...

```
Built-in effects: `:db` `:fx` `:dispatch` `dispatch-later` `:deregister-event-handler`

Tip: Need to fetch some data? Do it here then dispatch a new event passing the response.

[More info](http://day8.github.io/re-frame/dominoes-30k/#domino-3-effect-handling)

### 4th Domino - Query

Subscribe to derived state, internally using ClojureDart Cells (see the [Cheatsheet](https://github.com/Tensegritics/ClojureDart/blob/main/doc/ClojureDart%20Cheatsheet.pdf))

```clojure
(ns acme.view
  (:require ["package:flutter/material.dart" :as m]
            [acme.model :as model]
            [hti.re-dash :as rd]))

...

(f/widget
 :watch [current-count (rd/subscribe [::model/get-count])]  ;; <== This
 (m/Text (str current-count)))
...
```

This example assumes a subscription called `get-count` has been pre-registered in the model.

- See `samples/counter` for a full example of registering the subscription.
- See `samples/signals` for more examples of registering subscriptions using extractors and/or signals.
- Also see [re-frame subscriptions](https://day8.github.io/re-frame/subscriptions/) for a more detailed description.
- Note that the re-frame shorthand [syntactic sugar](https://day8.github.io/re-frame/subscriptions/#syntactic-sugar) is also supported.

[More Info](http://day8.github.io/re-frame/dominoes-30k/#domino-4-query)

### 5th Domino - View

Pure. No reference to global state.


```clojure
(ns acme.view
  (:require ["package:flutter/material.dart" :as m]
            [cljd.flutter :as f]
            [acme.model :as model]
            [hti.re-dash :as rd]))

(def counter
  (m/Column
   .mainAxisAlignment m/MainAxisAlignment.center
   .children
   [(f/widget
     :watch [current-count (rd/subscribe [::model/get-count])]
     (m/Text (str current-count)))
    (m/IconButton
     .icon (m/Icon (m/Icons.add_circle_outline))
     .onPressed #(rd/dispatch [::model/count]))
    (m/Text "Click me to count!")]))

```
[More info](http://day8.github.io/re-frame/dominoes-30k/#domino-5-view)

Note, this is a contrived example to illustrate usage of this library. Best practice for when state remains local to the widget (for example key presses in a text field) should be handled in a local atom for example:

```clojure
(ns acme.view
  (:require ["package:flutter/material.dart" :as m]
            [cljd.flutter :as f]
            [acme.model :as model]
            [hti.re-dash :as rd]))

(def counter
  (f/widget
   :watch [current-count (atom 0)]
   (m/Column
    .mainAxisAlignment m/MainAxisAlignment.center
    .children
    [(m/Text (str current-count))
     (m/IconButton
      .icon (m/Icon (m/Icons.add_circle_outline))
      .onPressed #(swap! current-count inc))
     (m/Text "Click me to count!")])))
```

### 6th Domino - Canvas

Done.

[More info](http://day8.github.io/re-frame/dominoes-30k/#domino-6-dom)

## Registering events, effects & subscriptions

Unfortunately, due to the Dart compiler's tree shaking of `unused` code, it incorrectly removes events, effects & subscriptions if declared at the root of a ClojureDart name space. To work around this, we need to wrap all the registrations inside a function callable from `main` so the Dart compiler sees there is a reference to the code

```clojure
(ns acme.main
  (:require ["package:flutter/material.dart" :as m]
            [cljd.flutter :as f]
            [acme.view :as view]
            [acme.model :as model]))

(defn main []
  (model/register!)                     ;; <== This
  (f/run
    (m/MaterialApp
     .title "Welcome to Flutter"
     .theme (m/ThemeData .primarySwatch m.Colors/blue))
    .home
    (m/Scaffold
     .appBar (m/AppBar
              .title (m/Text "ClojureDart with a splash of re-dash")))
    .body
    m/Center
    view/counter))
```

and in the model

```clojure
(ns acme.model
  (:require [hti.re-dash :as rd]))

(defn register!                         ;; <== This
  []

  (rd/reg-sub
   ::get-count
   (fn [db _]
     (:current-count db)))

  (rd/reg-fx
   ::log-count
   (fn [current-count]
     (println (str "The current-count is " current-count)))))
```

This does come with a drawback, as whenever we make a change in the `model` name space, _hot reload_ does not pick up the changes, so a _hot restart_ is needed instead. Note this only affect our `model` name space, _hot reload_ works fine in our _view_. Maybe there is a way to keep our event registrations from being tree shaken, if so, we'd love to hear it!

## Debugging

To debug our event handlers, we can register [interceptors](/doc/01-interceptors.md) to automatically log when events fire, and how the app state db looked before and after the event.

See: [debugging](/doc/02-debugging.md)

## Testing

re-dash comes with some utilities to help with writing tests

### Fixtures

`hti.re-dash-testing/reset-app-db-fixture` can be used to reset / empty the app-db before and after tests

### Subscriptions

Normally subscriptions are not able to be de-referenced outside a reactive context (like within tests)

Use `hti.re-dash-testing/subscribe` instead inside your tests if you need to assert a subscription's value (only [layer 2 - extractors](https://day8.github.io/re-frame/subscriptions/#the-four-layers) currently supported)

### Events

When dispatching events from tests and you need to assert that `app-db` contains the expected updated state with a subscription, use

```
(await (dispatch-sync [:some-event-id]))
```
see the `hti.re-dash-test` namespace for example usage

## Extra Features

### reg-sub-as-cofx

Normally we wouldn't use subscriptions inside event handlers, see [more info](https://github.com/day8/re-frame/blob/master/docs/FAQs/UseASubscriptionInAnEventHandler.md) but in re-dash we have the ability to inject a subscription into an event handler as a coeffect

We do this by registering an existing subscription also as a coeffect with

```
(hti.re-dash/reg-sub-as-cofx [::existing-sub-id])
```

Now we can inject this subscription as a coeffect into an event handler

```
(rd/reg-event-fx
  ::some-event
  [(rd/inject-cofx ::existing-sub-id)]
  (fn [{db :db ::keys [existing-sub-id] :as cofx} _]
      ...))
```

## Issues and features

Please feel free to raise issues on Github or send pull requests

## Acknowledgements

* [ClojureDart](https://github.com/Tensegritics/ClojureDart) for the language
* [re-frame](https://github.com/day8/re-frame) for the inspiration for this library
* [Dash](https://docs.flutter.dev/dash) the mascot for Dart & Flutter

## Development

This section is a guide to developing this re-dash library itself

### Prerequisites

Clojure and Flutter installed and on your path

### Workflow

Fork, then clone this repository to a local folder like `~/src/re-dash`

If you don't already have a ClojureDart/re-dash project you can copy one of the sample projects to start hacking:

```bash
cp -r ~/src/re-dash/samples/counter ~/src/counter
```

Add the re-dash src folder and remove the re-dash dependency from `~/src/counter/deps.edn`

```clojure
{:paths ["src" "../re-dash/src"]
 :deps {tensegritics/clojuredart
        {:git/url "https://github.com/tensegritics/ClojureDart.git"
         :sha "some sha"}}
 :aliases {:cljd {:main-opts ["-m" "cljd.build"]}}
 :cljd/opts {:kind :flutter
             :main acme.main}}
```


Create the platform folders and run the counter app

```bash
cd ~/src/counter

flutter create .

clj -M:cljd flutter -d linux  ;; or whichever device you want to run on
```

Now any changes you make in the re-dash source code will be picked up in the running counter app when doing a hot restart with 'R' in the terminal

### Tests

re-dash tests are run like this

```bash
cd ~/src/re-dash

## first compile the test namespace

clj -M:cljd:test compile hti.re-dash-test

## run the tests

flutter test
```

## License

[MIT License](https://github.com/htihospitality/re-dash/blob/main/LICENSE)

Copyright (c) 2023 Hospitality Technology Limited

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
