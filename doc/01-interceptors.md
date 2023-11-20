# Interceptors

Interceptors in re-dash work similar to re-frame, so head over there for [detailed documentation](https://day8.github.io/re-frame/Interceptors/)

## Built-in

Out the box, re-dash supports the following interceptors

### `debug`

Log useful information during event execution, see [debugging](/doc/02-debugging.md)

### `inject-cofx`

Inject coeffects into the `cofx` map that we can use inside our event handlers, see [coeffects](https://day8.github.io/re-frame/Coeffects/)

### `path`

An interceptor which acts somewhat like `clojure.core/update-in`, in the sense that the event handler is given a specific part of app-db to change, not all of app-db, see [path](https://day8.github.io/re-frame/api-re-frame.core/#path)

## Creating your own

An interceptor is simply a map with the following structure:

```clojure
{:id     :my-cool-interceptor
 :before before-fn
 :after  after-fn}
```

There's also a convenience function provided to build an interceptor:

```clojure
(rd/->interceptor
  :my-cool-interceptor
  before-fn
  after-fn)
```

`before-fn` and `after-fn` are functions with one argument which is the event `context`. See re-frame's documentation for more detail.

## Global Interceptors

Registers the given interceptor as a global interceptor. Global interceptors are included in the processing chain of every event.

Also see: [Global Interceptors](https://day8.github.io/re-frame/api-re-frame.core/#global-interceptors)

### Example

Add this somewhere early on in your app's startup, like in `main`

```clojure
(rd/reg-global-interceptor
  (rd/debug))
```
