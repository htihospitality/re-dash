# event-queue

Shows an example of [ordered event execution](https://day8.github.io/re-frame/api-builtin-effects/#dispatch) during longer processing events & effects. Logged to console.

Multiple consecutive dispatches, each incrementing a counter in app-db:

```
(dispatch [::model/count-one])
(dispatch [::model/count-three])
(dispatch [::model/count-one])
(dispatch [::model/count-three])
(dispatch [::model/count-one])
(dispatch [::model/count-one])
```

Resulting in an ordered output of `println` effects:

```
The current-count is 1
The current-count is 2
The current-count is 3
The current-count is 4
The current-count is 5
The current-count is 6
The current-count is 7
The current-count is 8
The current-count is 9
The current-count is 10
```

And the final state for counter in the app-db is 10 as expected.

## Run the sample

Create the platform folders

```bash
flutter create .
```

Run it

```bash
clj -M:cljd flutter
```
