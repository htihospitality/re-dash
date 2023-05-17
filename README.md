![re-dash logo](doc/images/re-dash.png)

# re-dash

A [ClojureDart](https://github.com/Tensegritics/ClojureDart) framework, inspired by re-frame, for building user interfaces with Flutter

## Goals

* Global central state management
* Pure views with no direct reference to global state
* Familiar api if coming from re-frame

## Documentation

[![cljdoc badge](https://cljdoc.org/badge/net.clojars.htihospitality/re-dash)](https://cljdoc.org/d/net.clojars.htihospitality/re-dash)

Many (not all) of the concepts in [re-frame](http://day8.github.io/re-frame/re-frame/) has been made available in this library, and the aim is to share the same api as far as possible, so if you're familiar with re-frame, picking up re-dash should feel natural.

To gain an understanding of the concepts in re-dash, head over to the excellent documentation in [re-frame](http://day8.github.io/re-frame/re-frame/)

## Not (yet) supported

* [Coeffects](https://github.com/day8/re-frame/blob/master/docs/Coeffects.md)
* [Interceptors](https://github.com/day8/re-frame/blob/master/docs/Interceptors.md)

## Configuration

![Clojars Project](https://img.shields.io/clojars/v/net.clojars.htihospitality/re-dash.svg)

Follow the [ClojureDart Quickstart](https://github.com/Tensegritics/ClojureDart/blob/main/doc/flutter-quick-start.md) guide to get your app up and running

Then, add the `re-dash` dependency

### deps.edn

#### from clojars

```edn
:deps {net.clojars.htihospitality/re-dash {:mvn/version "0.0.4"}}
```

#### from a commit

```edn
:deps {hti/re-dash
       {:git/url "https://github.com/htihospitality/re-dash.git"
        :sha "find the latest sha on github"}}
```

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
[More info](http://day8.github.io/re-frame/a-loop/#1st-domino-event-dispatch)

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
[More info](http://day8.github.io/re-frame/a-loop/#2nd-domino-event-handling)

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
Built-in effects: `:db` `:fx` `:dispatch` `diapatch-later` `:deregister-event-handler`

Tip: Need to fetch some data? Do it here then dispatch a new event passing the response.

[More info](http://day8.github.io/re-frame/a-loop/#3rd-domino-effect-handling)

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
[More Info](http://day8.github.io/re-frame/a-loop/#domino-4-query)

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
[More info](http://day8.github.io/re-frame/a-loop/#domino-5-view)

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

[More info](http://day8.github.io/re-frame/a-loop/#domino-6-dom)

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

## Issues and features

Please feel free to raise issues on Github or send pull requests

## Acknowledgements

* [ClojureDart](https://github.com/Tensegritics/ClojureDart) for the language
* [re-frame](https://github.com/day8/re-frame) for the inspiration for this library
* [Dash](https://docs.flutter.dev/dash) the mascot for Dart & Flutter

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
