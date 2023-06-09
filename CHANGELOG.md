# Change Log

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
