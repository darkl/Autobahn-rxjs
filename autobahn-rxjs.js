/**
* Copyright 2013 Elad Zelingher
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports &&
    (typeof root == 'object' && root && root == root.global && (window = root), exports);

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports', 'ab'], function (Rx, exports, ab) {
            root.Rx = factory(root, exports, Rx, ab);
            return root.Rx;
        });
    } else if (typeof module == 'object' && module && module.exports == freeExports) {
        module.exports = factory(root, module.exports, require('rx'), require('ab'));
    } else {
        root.Rx = factory(root, {}, root.Rx, ab);
    }
}(this, function (global, exp, root, ab, undefined) {

    var Observable = root.Observable,
        Observer = root.Observer,
        Subject = root.Subject,
        AsyncSubject = root.AsyncSubject,
        observableCreate = Observable.create,
        observerCreate = Observer.create,
        subjectCreate = Subject.create;

    ab.Session.prototype.getTopicAsObservable = function(topicUri) {
        var self = this;

        var subjectObservable =
            observableCreate(function(observer) {
                var callback = function(uri, eventObject) {
                    observer.onNext(eventObject);
                };
                self.subscribe(topicUri, callback);
                return function() {
                    self.unsubscribe(topicUri, callback);
                };
            });

        subjectObservable.topicUri = topicUri;

        return subjectObservable;
    };

    ab.Session.prototype.getTopicAsSubject = function(topicUri) {
        var self = this;

        var subjectObservable = self.getTopicAsObservable(topicUri);

        var subjectObserver = observerCreate(function(data) {
            self.publish(topicUri, data);
        });

        var result = subjectCreate(subjectObserver, subjectObservable);

        return result;
    };

    ab.Session.prototype.callAsObservable = function() {
        var self = this;
        var subject = new AsyncSubject();

        self.call.apply(self, arguments).then(
            function(res) {
                subject.onNext(res);
                subject.onCompleted();
            },
            function(error, desc) {
                subject.onError(error);
                // TODO: add desc information as well
            }
        );

        return subject;
    };

    return root;
}));