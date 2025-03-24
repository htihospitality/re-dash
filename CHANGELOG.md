# Change Log

## 1.2.0 - 2025-03-24
### Changes
- Added Subscription Cache [PR 37](https://github.com/htihospitality/re-dash/pull/37)

## 1.1.3 - 2024-12-10
### Changes
- Fixed flow execution order to consider custom interceptor changes [PR 36](https://github.com/htihospitality/re-dash/pull/36)

## 1.1.2 - 2024-10-23
### Changes
- Fixed debug interceptor to return json encoded strings in response to `updateConnectionState` events from re-dash-inspector, as per [docs](https://api.flutter.dev/flutter/dart-developer/ServiceExtensionResponse/ServiceExtensionResponse.result.html)

## 1.1.1 - 2024-10-08
### Changes
- Fixed debug interceptor logging nil event-ids when coeffects were used

## 1.1.0 - 2024-09-23
### Changes
- The debug interceptor in re-dash has been enhanced to post messages to Flutter DevTools to update the new [re-dash-inspector](https://github.com/htihospitality/re-dash-inspector) (which will be released soon)

## 1.0.0 - 2024-02-23
### Changes
- Added the Database Protocol with Drift and RxDB implementations [RR 30](https://github.com/htihospitality/re-dash/pull/30)

## 0.9.4 - 2024-02-17
### Changes
- Fixed signal Cell cache to be keyed more accurately to full query

## 0.9.3 - 2024-02-16
### Changes
- Fixed :clear-flow effect that cleared all flows instead of only the one specified
- Fixed :clear-flow effect by making it continue silently when the flow was not found instead of throwing an exception
- Fixed Cell memory leak when using signaled subscriptions [PR 32](https://github.com/htihospitality/re-dash/pull/32)

## 0.9.2 - 2024-01-19
### Changes
- Fixed issue with Flows when reg-event-fx did not return a :db effect

## 0.9.1 - 2023-12-12
### Changes
- Added logging to report errors that occur while calculating subscription [PR 28](https://github.com/htihospitality/re-dash/pull/28)

## 0.9.0 - 2023-12-07
### Changes
- Added support for [Flows](/doc/03-flows.md) (alpha) [PR 25](https://github.com/htihospitality/re-dash/pull/25)
- Added namespace `hti.re-dash.alpha` for trying out API's that might change in future.
- Added deprecation notice for namespace `hti.re-dash` - use `hti.re-dash.core` instead.

## 0.8.1 - 2023-11-21
### Changes
- Added re-dash-testing namespace to deployed jar artifact

## 0.8.0 - 2023-11-20
### Changes
- Added a `debug` interceptor to help with debugging event handlers, see [debugging](https://github.com/htihospitality/re-dash/blob/main/doc/02-debugging.md)
- Added the ability to register [global interceptors](https://github.com/htihospitality/re-dash/blob/main/doc/01-interceptors.md#global-interceptors)
### Dependencies
- ClojureDart SHA `684d6a47a2e85585a138540468fd0ad4ffa664aa` or later

## 0.7.0 - 2023-11-16
### Changes
- Implemented an improved events queue based on Dart's Queue [PR 22](https://github.com/htihospitality/re-dash/pull/22)

## 0.6.2 - 2023-08-29
### Changes
- Fixed issue with multiple input signals [Issue 19](https://github.com/htihospitality/re-dash/issues/19)

## 0.6.1 - 2023-07-27
### Changes
- Fixed dynamic warnings

## 0.6.0 - 2023-07-26
### Changes
- Added an event queue to ensure [ordered event execution](https://day8.github.io/re-frame/api-builtin-effects/#dispatch) - FIFO
- Added a sample demonstrating ordered event execution
- Added support for `nil`s in `:fx` sequence

## 0.5.0 - 2023-07-24
### Changes
- Added [reg-sub-as-cofx](https://github.com/htihospitality/re-dash#reg-sub-as-cofx) to be able to inject a subscription into an event handler
- Fixed coeffects returning a Future, so that they're await(ed) on and their value provided to the event handler


## 0.4.0 - 2023-06-30
### Changes
- Added `hti.re-dash-testing/subscribe` useful to be able to de-reference subscriptions from tests (only [layer 2 - extractors](https://day8.github.io/re-frame/subscriptions/#the-four-layers) currently supported)
- Added `hti.re-dash-testing/reset-app-db-fixture` test fixture that will reset / empty app-db before and after test(s)
- Added `hti.re-dash/register-defaults!` optionally useful to pre-register common events like `:re-dash/initialize-db` to set / reset the app state
- Added built in [path](https://day8.github.io/re-frame/api-re-frame.core/#path) interceptor


## 0.3.0 - 2023-06-23
### Changes
- Added support for [Coeffects](http://day8.github.io/re-frame/Coeffects/)
- Added support for [Interceptors](http://day8.github.io/re-frame/Interceptors/)

## 0.2.0 - 2023-06-15
### Changes
- [Issue 2](https://github.com/htihospitality/re-dash/issues/2) Added shorthand syntactic sugar to subscriptions, as per re-frame - thanks [@valerauko](https://github.com/valerauko)
- [Issue 3](https://github.com/htihospitality/re-dash/issues/3) Added signals support to subscriptions (layer 3 - materialized views as per re-frame) - thanks [@valerauko](https://github.com/valerauko)
- [Issue 4](https://github.com/htihospitality/re-dash/issues/4) Updated [readme](https://github.com/htihospitality/re-dash#development) to add re-dash library development guidelines

## 0.1.3 - 2023-06-09
### Changes
- Revert back to cljd namespaces as cljdoc errors out

## 0.1.2 - 2023-06-09
### Changes
- Renamed namespaces to cljc to test compatibility with cljdoc

## 0.1.1 - 2023-06-01
### Changes
- Fixed issue causing async http calls not updating app-db

## 0.1.0 - 2023-05-17
### Changes
- Initial clojars release

## 2023-05-17
* Commit 5c9a01ee2fc780ffdee2a0de043e66e69f76b05f
### Changes
- Removed duplicate counter component from sample

## 2023-05-17
* Commit 5623a80aa153ba9eae94c472f02cc862208a2037
### Changes
- Initial release
