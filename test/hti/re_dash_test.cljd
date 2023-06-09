(ns hti.re-dash-test
  (:require [clojure.test :refer [deftest is testing]]
            [hti.re-dash :refer [computation-fn]]))

(deftest some-test
  (is (= 1 1)))

#_(deftest computation-fn-test
  (let [db {:foo 42
            :bar {:baz 9001}}]
    (testing ":->"
      (let [f (computation-fn (list :-> :foo))]
        (is (= 42 (f db [])))))
    (testing ":=>"
      (let [f (computation-fn (list :=> get-in))]
        (is (= 9001 (f db [:bar :baz])))))))
