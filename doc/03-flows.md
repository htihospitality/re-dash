# Flows

Status: (alpha)

Flows provide a newer mechanism for derived state, by storing the derived result of some calculation in the app-db at the location you specify.

Flows also manage their own life-cycle ensuring it cleans up after itself when the Flow is no longer needed.

For detailed information see [re-frame's Flow](https://day8.github.io/re-frame/Flows/) documentation.

### Getting started

Register the built-in Flow life-cycle effects in your app's `main` function:

```clojure

(require '[hti.re-dash.alpha :as rd]')  ;; <== Flows are available in the alpha namespace

(rd/register-defaults!)
```

Register a Flow

```clojure

(def area-flow
  {:id          :garage-area
   :inputs      {:w [:garage :width]
                 :h [:garage :length]}
   :output      (fn calc-area
                  [{:keys [w h]}]
                  (* w h))
   :path        [:garage :area]})


(rd/reg-flow area-flow)
```

### Sample app

`samples/flow` Shows an example of using Flows to calculate a derived result of some calculation, in addition to Flow life-cycle controls.
