import { Component, Directive, ElementRef, EventEmitter, HostListener, Inject, Injectable, InjectionToken, Input, NgModule, NgZone, Output, Renderer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable as Observable$1 } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/sampleTime';
import { of as of$2 } from 'rxjs/observable/of';
function createCommonjsModule(fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports;
}
var mousetrap = createCommonjsModule(function (module) {
    /*global define:false */
    /**
     * Copyright 2012-2017 Craig Campbell
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     * Mousetrap is a simple keyboard shortcut library for Javascript with
     * no external dependencies
     *
     * @version 1.6.1
     * @url craig.is/killing/mice
     */
    (function (window, document, undefined) {
        // Check if mousetrap is used inside browser, if not, return
        if (!window) {
            return;
        }
        /**
         * mapping of special keycodes to their corresponding keys
         *
         * everything in this dictionary cannot use keypress events
         * so it has to be here to map to the correct keycodes for
         * keyup/keydown events
         *
         * @type {Object}
         */
        var _MAP = {
            8: 'backspace',
            9: 'tab',
            13: 'enter',
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
            20: 'capslock',
            27: 'esc',
            32: 'space',
            33: 'pageup',
            34: 'pagedown',
            35: 'end',
            36: 'home',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            45: 'ins',
            46: 'del',
            91: 'meta',
            93: 'meta',
            224: 'meta'
        };
        /**
         * mapping for special characters so they can support
         *
         * this dictionary is only used incase you want to bind a
         * keyup or keydown event to one of these keys
         *
         * @type {Object}
         */
        var _KEYCODE_MAP = {
            106: '*',
            107: '+',
            109: '-',
            110: '.',
            111: '/',
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: '\''
        };
        /**
         * this is a mapping of keys that require shift on a US keypad
         * back to the non shift equivelents
         *
         * this is so you can use keyup events with these keys
         *
         * note that this will only work reliably on US keyboards
         *
         * @type {Object}
         */
        var _SHIFT_MAP = {
            '~': '`',
            '!': '1',
            '@': '2',
            '#': '3',
            '$': '4',
            '%': '5',
            '^': '6',
            '&': '7',
            '*': '8',
            '(': '9',
            ')': '0',
            '_': '-',
            '+': '=',
            ':': ';',
            '\"': '\'',
            '<': ',',
            '>': '.',
            '?': '/',
            '|': '\\'
        };
        /**
         * this is a list of special strings you can use to map
         * to modifier keys when you specify your keyboard shortcuts
         *
         * @type {Object}
         */
        var _SPECIAL_ALIASES = {
            'option': 'alt',
            'command': 'meta',
            'return': 'enter',
            'escape': 'esc',
            'plus': '+',
            'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
        };
        /**
         * variable to store the flipped version of _MAP from above
         * needed to check if we should use keypress or not when no action
         * is specified
         *
         * @type {Object|undefined}
         */
        var _REVERSE_MAP;
        /**
         * loop through the f keys, f1 to f19 and add them to the map
         * programatically
         */
        for (var i = 1; i < 20; ++i) {
            _MAP[111 + i] = 'f' + i;
        }
        /**
         * loop through to map numbers on the numeric keypad
         */
        for (i = 0; i <= 9; ++i) {
            // This needs to use a string cause otherwise since 0 is falsey
            // mousetrap will never fire for numpad 0 pressed as part of a keydown
            // event.
            //
            // @see https://github.com/ccampbell/mousetrap/pull/258
            _MAP[i + 96] = i.toString();
        }
        /**
         * cross browser add event method
         *
         * @param {Element|HTMLDocument} object
         * @param {string} type
         * @param {Function} callback
         * @returns void
         */
        function _addEvent(object, type, callback) {
            if (object.addEventListener) {
                object.addEventListener(type, callback, false);
                return;
            }
            object.attachEvent('on' + type, callback);
        }
        /**
         * takes the event and returns the key character
         *
         * @param {Event} e
         * @return {string}
         */
        function _characterFromEvent(e) {
            // for keypress events we should return the character as is
            if (e.type == 'keypress') {
                var character = String.fromCharCode(e.which);
                // if the shift key is not pressed then it is safe to assume
                // that we want the character to be lowercase.  this means if
                // you accidentally have caps lock on then your key bindings
                // will continue to work
                //
                // the only side effect that might not be desired is if you
                // bind something like 'A' cause you want to trigger an
                // event when capital A is pressed caps lock will no longer
                // trigger the event.  shift+a will though.
                if (!e.shiftKey) {
                    character = character.toLowerCase();
                }
                return character;
            }
            // for non keypress events the special maps are needed
            if (_MAP[e.which]) {
                return _MAP[e.which];
            }
            if (_KEYCODE_MAP[e.which]) {
                return _KEYCODE_MAP[e.which];
            }
            // if it is not in the special map
            // with keydown and keyup events the character seems to always
            // come in as an uppercase character whether you are pressing shift
            // or not.  we should make sure it is always lowercase for comparisons
            return String.fromCharCode(e.which).toLowerCase();
        }
        /**
         * checks if two arrays are equal
         *
         * @param {Array} modifiers1
         * @param {Array} modifiers2
         * @returns {boolean}
         */
        function _modifiersMatch(modifiers1, modifiers2) {
            return modifiers1.sort().join(',') === modifiers2.sort().join(',');
        }
        /**
         * takes a key event and figures out what the modifiers are
         *
         * @param {Event} e
         * @returns {Array}
         */
        function _eventModifiers(e) {
            var modifiers = [];
            if (e.shiftKey) {
                modifiers.push('shift');
            }
            if (e.altKey) {
                modifiers.push('alt');
            }
            if (e.ctrlKey) {
                modifiers.push('ctrl');
            }
            if (e.metaKey) {
                modifiers.push('meta');
            }
            return modifiers;
        }
        /**
         * prevents default for this event
         *
         * @param {Event} e
         * @returns void
         */
        function _preventDefault(e) {
            if (e.preventDefault) {
                e.preventDefault();
                return;
            }
            e.returnValue = false;
        }
        /**
         * stops propogation for this event
         *
         * @param {Event} e
         * @returns void
         */
        function _stopPropagation(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
                return;
            }
            e.cancelBubble = true;
        }
        /**
         * determines if the keycode specified is a modifier key or not
         *
         * @param {string} key
         * @returns {boolean}
         */
        function _isModifier(key) {
            return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
        }
        /**
         * reverses the map lookup so that we can look for specific keys
         * to see what can and can't use keypress
         *
         * @return {Object}
         */
        function _getReverseMap() {
            if (!_REVERSE_MAP) {
                _REVERSE_MAP = {};
                for (var key in _MAP) {
                    // pull out the numeric keypad from here cause keypress should
                    // be able to detect the keys from the character
                    if (key > 95 && key < 112) {
                        continue;
                    }
                    if (_MAP.hasOwnProperty(key)) {
                        _REVERSE_MAP[_MAP[key]] = key;
                    }
                }
            }
            return _REVERSE_MAP;
        }
        /**
         * picks the best action based on the key combination
         *
         * @param {string} key - character for key
         * @param {Array} modifiers
         * @param {string=} action passed in
         */
        function _pickBestAction(key, modifiers, action) {
            // if no action was picked in we should try to pick the one
            // that we think would work best for this key
            if (!action) {
                action = _getReverseMap()[key] ? 'keydown' : 'keypress';
            }
            // modifier keys don't work as expected with keypress,
            // switch to keydown
            if (action == 'keypress' && modifiers.length) {
                action = 'keydown';
            }
            return action;
        }
        /**
         * Converts from a string key combination to an array
         *
         * @param  {string} combination like "command+shift+l"
         * @return {Array}
         */
        function _keysFromString(combination) {
            if (combination === '+') {
                return ['+'];
            }
            combination = combination.replace(/\+{2}/g, '+plus');
            return combination.split('+');
        }
        /**
         * Gets info for a specific key combination
         *
         * @param  {string} combination key combination ("command+s" or "a" or "*")
         * @param  {string=} action
         * @returns {Object}
         */
        function _getKeyInfo(combination, action) {
            var keys;
            var key;
            var i;
            var modifiers = [];
            // take the keys from this pattern and figure out what the actual
            // pattern is all about
            keys = _keysFromString(combination);
            for (i = 0; i < keys.length; ++i) {
                key = keys[i];
                // normalize key names
                if (_SPECIAL_ALIASES[key]) {
                    key = _SPECIAL_ALIASES[key];
                }
                // if this is not a keypress event then we should
                // be smart about using shift keys
                // this will only work for US keyboards however
                if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                    key = _SHIFT_MAP[key];
                    modifiers.push('shift');
                }
                // if this key is a modifier then add it to the list of modifiers
                if (_isModifier(key)) {
                    modifiers.push(key);
                }
            }
            // depending on what the key combination is
            // we will try to pick the best event for it
            action = _pickBestAction(key, modifiers, action);
            return {
                key: key,
                modifiers: modifiers,
                action: action
            };
        }
        function _belongsTo(element, ancestor) {
            if (element === null || element === document) {
                return false;
            }
            if (element === ancestor) {
                return true;
            }
            return _belongsTo(element.parentNode, ancestor);
        }
        function Mousetrap(targetElement) {
            var self = this;
            targetElement = targetElement || document;
            if (!(self instanceof Mousetrap)) {
                return new Mousetrap(targetElement);
            }
            /**
             * element to attach key events to
             *
             * @type {Element}
             */
            self.target = targetElement;
            /**
             * a list of all the callbacks setup via Mousetrap.bind()
             *
             * @type {Object}
             */
            self._callbacks = {};
            /**
             * direct map of string combinations to callbacks used for trigger()
             *
             * @type {Object}
             */
            self._directMap = {};
            /**
             * keeps track of what level each sequence is at since multiple
             * sequences can start out with the same sequence
             *
             * @type {Object}
             */
            var _sequenceLevels = {};
            /**
             * variable to store the setTimeout call
             *
             * @type {null|number}
             */
            var _resetTimer;
            /**
             * temporary state where we will ignore the next keyup
             *
             * @type {boolean|string}
             */
            var _ignoreNextKeyup = false;
            /**
             * temporary state where we will ignore the next keypress
             *
             * @type {boolean}
             */
            var _ignoreNextKeypress = false;
            /**
             * are we currently inside of a sequence?
             * type of action ("keyup" or "keydown" or "keypress") or false
             *
             * @type {boolean|string}
             */
            var _nextExpectedAction = false;
            /**
             * resets all sequence counters except for the ones passed in
             *
             * @param {Object} doNotReset
             * @returns void
             */
            function _resetSequences(doNotReset) {
                doNotReset = doNotReset || {};
                var activeSequences = false, key;
                for (key in _sequenceLevels) {
                    if (doNotReset[key]) {
                        activeSequences = true;
                        continue;
                    }
                    _sequenceLevels[key] = 0;
                }
                if (!activeSequences) {
                    _nextExpectedAction = false;
                }
            }
            /**
             * finds all callbacks that match based on the keycode, modifiers,
             * and action
             *
             * @param {string} character
             * @param {Array} modifiers
             * @param {Event|Object} e
             * @param {string=} sequenceName - name of the sequence we are looking for
             * @param {string=} combination
             * @param {number=} level
             * @returns {Array}
             */
            function _getMatches(character, modifiers, e, sequenceName, combination, level) {
                var i;
                var callback;
                var matches = [];
                var action = e.type;
                // if there are no events related to this keycode
                if (!self._callbacks[character]) {
                    return [];
                }
                // if a modifier key is coming up on its own we should allow it
                if (action == 'keyup' && _isModifier(character)) {
                    modifiers = [character];
                }
                // loop through all callbacks for the key that was pressed
                // and see if any of them match
                for (i = 0; i < self._callbacks[character].length; ++i) {
                    callback = self._callbacks[character][i];
                    // if a sequence name is not specified, but this is a sequence at
                    // the wrong level then move onto the next match
                    if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                        continue;
                    }
                    // if the action we are looking for doesn't match the action we got
                    // then we should keep going
                    if (action != callback.action) {
                        continue;
                    }
                    // if this is a keypress event and the meta key and control key
                    // are not pressed that means that we need to only look at the
                    // character, otherwise check the modifiers as well
                    //
                    // chrome will not fire a keypress if meta or control is down
                    // safari will fire a keypress if meta or meta+shift is down
                    // firefox will fire a keypress if meta or control is down
                    if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {
                        // when you bind a combination or sequence a second time it
                        // should overwrite the first one.  if a sequenceName or
                        // combination is specified in this call it does just that
                        //
                        // @todo make deleting its own method?
                        var deleteCombo = !sequenceName && callback.combo == combination;
                        var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                        if (deleteCombo || deleteSequence) {
                            self._callbacks[character].splice(i, 1);
                        }
                        matches.push(callback);
                    }
                }
                return matches;
            }
            /**
             * actually calls the callback function
             *
             * if your callback function returns false this will use the jquery
             * convention - prevent default and stop propogation on the event
             *
             * @param {Function} callback
             * @param {Event} e
             * @returns void
             */
            function _fireCallback(callback, e, combo, sequence) {
                // if this event should not happen stop here
                if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
                    return;
                }
                if (callback(e, combo) === false) {
                    _preventDefault(e);
                    _stopPropagation(e);
                }
            }
            /**
             * handles a character key event
             *
             * @param {string} character
             * @param {Array} modifiers
             * @param {Event} e
             * @returns void
             */
            self._handleKey = function (character, modifiers, e) {
                var callbacks = _getMatches(character, modifiers, e);
                var i;
                var doNotReset = {};
                var maxLevel = 0;
                var processedSequenceCallback = false;
                // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
                for (i = 0; i < callbacks.length; ++i) {
                    if (callbacks[i].seq) {
                        maxLevel = Math.max(maxLevel, callbacks[i].level);
                    }
                }
                // loop through matching callbacks for this key event
                for (i = 0; i < callbacks.length; ++i) {
                    // fire for all sequence callbacks
                    // this is because if for example you have multiple sequences
                    // bound such as "g i" and "g t" they both need to fire the
                    // callback for matching g cause otherwise you can only ever
                    // match the first one
                    if (callbacks[i].seq) {
                        // only fire callbacks for the maxLevel to prevent
                        // subsequences from also firing
                        //
                        // for example 'a option b' should not cause 'option b' to fire
                        // even though 'option b' is part of the other sequence
                        //
                        // any sequences that do not match here will be discarded
                        // below by the _resetSequences call
                        if (callbacks[i].level != maxLevel) {
                            continue;
                        }
                        processedSequenceCallback = true;
                        // keep a list of which sequences were matches for later
                        doNotReset[callbacks[i].seq] = 1;
                        _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                        continue;
                    }
                    // if there were no sequence matches but we are still here
                    // that means this is a regular match so we should fire that
                    if (!processedSequenceCallback) {
                        _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
                    }
                }
                // if the key you pressed matches the type of sequence without
                // being a modifier (ie "keyup" or "keypress") then we should
                // reset all sequences that were not matched by this event
                //
                // this is so, for example, if you have the sequence "h a t" and you
                // type "h e a r t" it does not match.  in this case the "e" will
                // cause the sequence to reset
                //
                // modifier keys are ignored because you can have a sequence
                // that contains modifiers such as "enter ctrl+space" and in most
                // cases the modifier key will be pressed before the next key
                //
                // also if you have a sequence such as "ctrl+b a" then pressing the
                // "b" key will trigger a "keypress" and a "keydown"
                //
                // the "keydown" is expected when there is a modifier, but the
                // "keypress" ends up matching the _nextExpectedAction since it occurs
                // after and that causes the sequence to reset
                //
                // we ignore keypresses in a sequence that directly follow a keydown
                // for the same character
                var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
                if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
                    _resetSequences(doNotReset);
                }
                _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
            };
            /**
             * handles a keydown event
             *
             * @param {Event} e
             * @returns void
             */
            function _handleKeyEvent(e) {
                // normalize e.which for key events
                // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
                if (typeof e.which !== 'number') {
                    e.which = e.keyCode;
                }
                var character = _characterFromEvent(e);
                // no character found then stop
                if (!character) {
                    return;
                }
                // need to use === for the character check because the character can be 0
                if (e.type == 'keyup' && _ignoreNextKeyup === character) {
                    _ignoreNextKeyup = false;
                    return;
                }
                self.handleKey(character, _eventModifiers(e), e);
            }
            /**
             * called to set a 1 second timeout on the specified sequence
             *
             * this is so after each key press in the sequence you have 1 second
             * to press the next key before you have to start over
             *
             * @returns void
             */
            function _resetSequenceTimer() {
                clearTimeout(_resetTimer);
                _resetTimer = setTimeout(_resetSequences, 1000);
            }
            /**
             * binds a key sequence to an event
             *
             * @param {string} combo - combo specified in bind call
             * @param {Array} keys
             * @param {Function} callback
             * @param {string=} action
             * @returns void
             */
            function _bindSequence(combo, keys, callback, action) {
                // start off by adding a sequence level record for this combination
                // and setting the level to 0
                _sequenceLevels[combo] = 0;
                /**
                 * callback to increase the sequence level for this sequence and reset
                 * all other sequences that were active
                 *
                 * @param {string} nextAction
                 * @returns {Function}
                 */
                function _increaseSequence(nextAction) {
                    return function () {
                        _nextExpectedAction = nextAction;
                        ++_sequenceLevels[combo];
                        _resetSequenceTimer();
                    };
                }
                /**
                 * wraps the specified callback inside of another function in order
                 * to reset all sequence counters as soon as this sequence is done
                 *
                 * @param {Event} e
                 * @returns void
                 */
                function _callbackAndReset(e) {
                    _fireCallback(callback, e, combo);
                    // we should ignore the next key up if the action is key down
                    // or keypress.  this is so if you finish a sequence and
                    // release the key the final key will not trigger a keyup
                    if (action !== 'keyup') {
                        _ignoreNextKeyup = _characterFromEvent(e);
                    }
                    // weird race condition if a sequence ends with the key
                    // another sequence begins with
                    setTimeout(_resetSequences, 10);
                }
                // loop through keys one at a time and bind the appropriate callback
                // function.  for any key leading up to the final one it should
                // increase the sequence. after the final, it should reset all sequences
                //
                // if an action is specified in the original bind call then that will
                // be used throughout.  otherwise we will pass the action that the
                // next key in the sequence should match.  this allows a sequence
                // to mix and match keypress and keydown events depending on which
                // ones are better suited to the key provided
                for (var i = 0; i < keys.length; ++i) {
                    var isFinal = i + 1 === keys.length;
                    var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
                    _bindSingle(keys[i], wrappedCallback, action, combo, i);
                }
            }
            /**
             * binds a single keyboard combination
             *
             * @param {string} combination
             * @param {Function} callback
             * @param {string=} action
             * @param {string=} sequenceName - name of sequence if part of sequence
             * @param {number=} level - what part of the sequence the command is
             * @returns void
             */
            function _bindSingle(combination, callback, action, sequenceName, level) {
                // store a direct mapped reference for use with Mousetrap.trigger
                self._directMap[combination + ':' + action] = callback;
                // make sure multiple spaces in a row become a single space
                combination = combination.replace(/\s+/g, ' ');
                var sequence = combination.split(' ');
                var info;
                // if this pattern is a sequence of keys then run through this method
                // to reprocess each pattern one key at a time
                if (sequence.length > 1) {
                    _bindSequence(combination, sequence, callback, action);
                    return;
                }
                info = _getKeyInfo(combination, action);
                // make sure to initialize array if this is the first time
                // a callback is added for this key
                self._callbacks[info.key] = self._callbacks[info.key] || [];
                // remove an existing match if there is one
                _getMatches(info.key, info.modifiers, { type: info.action }, sequenceName, combination, level);
                // add this call back to the array
                // if it is a sequence put it at the beginning
                // if not put it at the end
                //
                // this is important because the way these are processed expects
                // the sequence ones to come first
                self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
                    callback: callback,
                    modifiers: info.modifiers,
                    action: info.action,
                    seq: sequenceName,
                    level: level,
                    combo: combination
                });
            }
            /**
             * binds multiple combinations to the same callback
             *
             * @param {Array} combinations
             * @param {Function} callback
             * @param {string|undefined} action
             * @returns void
             */
            self._bindMultiple = function (combinations, callback, action) {
                for (var i = 0; i < combinations.length; ++i) {
                    _bindSingle(combinations[i], callback, action);
                }
            };
            // start!
            _addEvent(targetElement, 'keypress', _handleKeyEvent);
            _addEvent(targetElement, 'keydown', _handleKeyEvent);
            _addEvent(targetElement, 'keyup', _handleKeyEvent);
        }
        /**
         * binds an event to mousetrap
         *
         * can be a single key, a combination of keys separated with +,
         * an array of keys, or a sequence of keys separated by spaces
         *
         * be sure to list the modifier keys first to make sure that the
         * correct key ends up getting bound (the last key in the pattern)
         *
         * @param {string|Array} keys
         * @param {Function} callback
         * @param {string=} action - 'keypress', 'keydown', or 'keyup'
         * @returns void
         */
        Mousetrap.prototype.bind = function (keys, callback, action) {
            var self = this;
            keys = keys instanceof Array ? keys : [keys];
            self._bindMultiple.call(self, keys, callback, action);
            return self;
        };
        /**
         * unbinds an event to mousetrap
         *
         * the unbinding sets the callback function of the specified key combo
         * to an empty function and deletes the corresponding key in the
         * _directMap dict.
         *
         * TODO: actually remove this from the _callbacks dictionary instead
         * of binding an empty function
         *
         * the keycombo+action has to be exactly the same as
         * it was defined in the bind method
         *
         * @param {string|Array} keys
         * @param {string} action
         * @returns void
         */
        Mousetrap.prototype.unbind = function (keys, action) {
            var self = this;
            return self.bind.call(self, keys, function () { }, action);
        };
        /**
         * triggers an event that has already been bound
         *
         * @param {string} keys
         * @param {string=} action
         * @returns void
         */
        Mousetrap.prototype.trigger = function (keys, action) {
            var self = this;
            if (self._directMap[keys + ':' + action]) {
                self._directMap[keys + ':' + action]({}, keys);
            }
            return self;
        };
        /**
         * resets the library back to its initial state.  this is useful
         * if you want to clear out the current keyboard shortcuts and bind
         * new ones - for example if you switch to another page
         *
         * @returns void
         */
        Mousetrap.prototype.reset = function () {
            var self = this;
            self._callbacks = {};
            self._directMap = {};
            return self;
        };
        /**
         * should we stop this event before firing off callbacks
         *
         * @param {Event} e
         * @param {Element} element
         * @return {boolean}
         */
        Mousetrap.prototype.stopCallback = function (e, element) {
            var self = this;
            // if the element has the class "mousetrap" then no need to stop
            if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
                return false;
            }
            if (_belongsTo(element, self.target)) {
                return false;
            }
            // stop for input, select, and textarea
            return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
        };
        /**
         * exposes _handleKey publicly so it can be overwritten by extensions
         */
        Mousetrap.prototype.handleKey = function () {
            var self = this;
            return self._handleKey.apply(self, arguments);
        };
        /**
         * allow custom key mappings
         */
        Mousetrap.addKeycodes = function (object) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    _MAP[key] = object[key];
                }
            }
            _REVERSE_MAP = null;
        };
        /**
         * Init the global mousetrap functions
         *
         * This method is needed to allow the global mousetrap functions to work
         * now that mousetrap is a constructor function.
         */
        Mousetrap.init = function () {
            var documentMousetrap = Mousetrap(document);
            for (var method in documentMousetrap) {
                if (method.charAt(0) !== '_') {
                    Mousetrap[method] = (function (method) {
                        return function () {
                            return documentMousetrap[method].apply(documentMousetrap, arguments);
                        };
                    }(method));
                }
            }
        };
        Mousetrap.init();
        // expose mousetrap to the global object
        window.Mousetrap = Mousetrap;
        // expose as a common js module
        if ('object' !== 'undefined' && module.exports) {
            module.exports = Mousetrap;
        }
        // expose mousetrap as an AMD module
        if (typeof undefined === 'function' && undefined.amd) {
            undefined(function () {
                return Mousetrap;
            });
        }
    })(typeof window !== 'undefined' ? window : null, typeof window !== 'undefined' ? document : null);
});
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Service to intercept ctrl+s (or cmd+s on macOS) using a third-party library, called Mousetrap.
 */
var KeyboardService = (function () {
    /**
     * @param {?} config
     */
    function KeyboardService(config) {
        this.config = config;
        this.shortcuts = this.config && this.config.shortcuts ? this.config.shortcuts : ['ctrl+s', 'meta+s'];
        this.mousetrap = new Mousetrap();
    }
    /**
     * Method to add a lister for ctrl+s/cmd+s keyboard events.
     * @param {?} onBind Callback function
     * @return {?}
     */
    KeyboardService.prototype.add = function (onBind) {
        this.mousetrap.bind(this.shortcuts, function (event, combo) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            else {
                // internet explorer
                event.returnValue = false;
            }
            onBind(event, combo);
        });
    };
    /**
     * Useful function to reset all listeners. Please, call this function when needed
     * to free resources ad prevent leaks.
     * @return {?}
     */
    KeyboardService.prototype.reset = function () {
        this.mousetrap.reset();
    };
    return KeyboardService;
}());
KeyboardService.decorators = [
    { type: Injectable },
];
/**
 * @nocollapse
 */
KeyboardService.ctorParameters = function () { return [
    { type: undefined, decorators: [{ type: Inject, args: [KEYBOARD_CONFIGURATION,] },] },
]; };
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)
 Copyright (c) 2016 vimalavinisha (only for version 1)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
var Action = {};
Action.NORMAL = 0;
Action.CLICK = 1;
Action.KEYBOARD = 2;
Action.SWIPE = 3;
Action.LOAD = 4;
Action[Action.NORMAL] = "NORMAL";
Action[Action.CLICK] = "CLICK";
Action[Action.KEYBOARD] = "KEYBOARD";
Action[Action.SWIPE] = "SWIPE";
Action[Action.LOAD] = "LOAD";
/**
 * Class `ImageModalEvent` that represents the Event after an action `action` and its result.
 */
var ImageModalEvent = (function () {
    /**
     * @param {?} action
     * @param {?} result
     */
    function ImageModalEvent(action, result) {
        this.action = action;
        this.result = result;
    }
    return ImageModalEvent;
}());
/**
 * Class `Image` that represents an Image with both images and thumb paths,
 * also with a description and an external url.
 * The only required value is the image path `img`.
 */
var Image = (function () {
    /**
     * @param {?} img
     * @param {?=} thumb
     * @param {?=} description
     * @param {?=} caption
     * @param {?=} extUrl
     * @param {?=} thumbWidth
     * @param {?=} thumbHeight
     */
    function Image(img, thumb, description, caption, extUrl, thumbWidth, thumbHeight) {
        this.img = img;
        this.thumb = thumb;
        this.description = description;
        this.caption = caption;
        this.extUrl = extUrl;
        this.thumbWidth = thumbWidth;
        this.thumbHeight = thumbHeight;
    }
    return Image;
}());
var Keyboard = {};
Keyboard.ESC = 27;
Keyboard.LEFT_ARROW = 37;
Keyboard.RIGHT_ARROW = 39;
Keyboard.UP_ARROW = 38;
Keyboard.DOWN_ARROW = 40;
Keyboard[Keyboard.ESC] = "ESC";
Keyboard[Keyboard.LEFT_ARROW] = "LEFT_ARROW";
Keyboard[Keyboard.RIGHT_ARROW] = "RIGHT_ARROW";
Keyboard[Keyboard.UP_ARROW] = "UP_ARROW";
Keyboard[Keyboard.DOWN_ARROW] = "DOWN_ARROW";
/**
 * Main Component of this library with the modal gallery.
 */
var AngularModalGalleryComponent = (function () {
    /**
     * Constructor with the injection of ´KeyboardService´ that initialize some description fields
     * based on default values.
     * @param {?} keyboardService
     */
    function AngularModalGalleryComponent(keyboardService) {
        this.keyboardService = keyboardService;
        /**
         * Boolean required to enable image download with both ctrl+s/cmd+s and download button.
         * If you want to show enable button, this is not enough. You have to use also `buttonsConfig`.
         */
        this.downloadable = false;
        /**
         * enableCloseOutside's input to enable modal-gallery close's behaviour while clicking
         * on the semi-transparent background. Disabled by default.
         */
        this.enableCloseOutside = false;
        /**
         * DEPRECATED
         * -----REMOVE THIS IN 4.0.0----- deprecated both showDownloadButton and showExtUrlButton
         */
        this.showDownloadButton = false;
        /**
         * DEPRECATED
         * -----REMOVE THIS IN 4.0.0----- deprecated both showDownloadButton and showExtUrlButton
         */
        this.showExtUrlButton = false; // deprecated
        this.showThumbCaption = true;
        this.close = new EventEmitter();
        this.show = new EventEmitter();
        this.firstImage = new EventEmitter();
        this.lastImage = new EventEmitter();
        this.hasData = new EventEmitter();
        /**
         * Boolean that it is true if the modal gallery is visible
         */
        this.opened = false;
        /**
         * Boolean that it is true if an image of the modal gallery is still loading
         */
        this.loading = false;
        /**
         * Boolean to open the modal gallery. Closed by default.
         */
        this.showGallery = false;
        /**
         * Number that represents the index of the current image.
         */
        this.currentImageIndex = 0;
        /**
         * Enum of type `Action` used to pass a click action when you click on the modal image.
         * Declared here to be used inside the template.
         */
        this.clickAction = Action.CLICK;
        /**
         * Boolean that it's true when you are watching the first image (currently visible).
         */
        this.isFirstImage = false;
        /**
         * Boolean that it's true when you are watching the last image (currently visible).
         */
        this.isLastImage = false;
        /**
         * Infinite scroll with server side images
         */
        this.isServerSide = false;
        /**
         * Function to call at bottom of thumbnails cointainer
         */
        this.scrolled = new EventEmitter();
        /**
         * Private SWIPE_ACTION to define all swipe actions used by hammerjs.
         */
        this.SWIPE_ACTION = {
            LEFT: 'swipeleft',
            RIGHT: 'swiperight',
            UP: 'swipeup',
            DOWN: 'swipedown'
        };
        // if description isn't provided initialize it with a default object
        if (!this.description) {
            this.description = {
                imageText: 'Image ',
                numberSeparator: '/',
                beforeTextDescription: ' - '
            };
        }
        // if one of the Description fields isn't initialized, provide a default value
        this.description.imageText = this.description.imageText || 'Image ';
        this.description.numberSeparator = this.description.numberSeparator || '/';
        this.description.beforeTextDescription = this.description.beforeTextDescription || ' - ';
    }
    /**
     * Listener to catch keyboard's events and call the right method based on the key.
     * For instance, pressing esc, this will call `closeGallery(Action.KEYBOARD)` and so on.
     * If you passed a valid `keyboardConfig` esc, right and left buttons will be customized based on your data.
     * @param {?} e KeyboardEvent caught by the listener.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.onKeyDown = function (e) {
        if (!this.opened) {
            return;
        }
        var /** @type {?} */ esc = this.keyboardConfig && this.keyboardConfig.esc ? this.keyboardConfig.esc : Keyboard.ESC;
        var /** @type {?} */ right = this.keyboardConfig && this.keyboardConfig.right ? this.keyboardConfig.right : Keyboard.RIGHT_ARROW;
        var /** @type {?} */ left = this.keyboardConfig && this.keyboardConfig.left ? this.keyboardConfig.left : Keyboard.LEFT_ARROW;
        switch (e.keyCode) {
            case esc:
                this.closeGallery(Action.KEYBOARD);
                break;
            case right:
                this.nextImage(Action.KEYBOARD);
                break;
            case left:
                this.prevImage(Action.KEYBOARD);
                break;
        }
    };
    /**
     * Method ´ngOnInit´ to build `configButtons` and to call `initImages()`.
     * This is an Angular's lifecycle hook, so its called automatically by Angular itself.
     * In particular, it's called only one time!!!
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.ngOnInit = function () {
        // build configButtons to use it inside upper-buttons
        this.configButtons = {
            download: this.showDownloadButton || (this.buttonsConfig && this.buttonsConfig.download),
            extUrl: this.showExtUrlButton || (this.buttonsConfig && this.buttonsConfig.extUrl),
            close: (this.buttonsConfig && this.buttonsConfig.close)
        };
        // call initImages passing true as parameter, because I want to emit `hasData` event
        this.initImages(true);
    };
    /**
     * Method ´ngOnChanges´ to init images preventing errors.
     * This is an Angular's lifecycle hook, so its called automatically by Angular itself.
     * In particular, it's called before `ngOnInit()` and whenever one or more data-bound input properties change.
     * @param {?} changes `SimpleChanges` object of current and previous property values provided by Angular.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.ngOnChanges = function (changes) {
        // to prevent errors when you pass to this library
        // the array of images inside a subscribe block, in this way: `...subscribe(val => { this.images = arrayOfImages })`
        // As you can see, I'm providing examples in these situations in all official demos
        if (this.modalImages) {
            // I pass `false` as parameter, because I DON'T want to emit `hasData`
            // event (preventing multiple hasData events while initializing)
            this.initImages(false);
        }
    };
    /**
     * Method `getDescriptionToDisplay` to get the image description based on input params.
     * If you provide a full description this will be the visible description, otherwise,
     * it will be built using the `description` object, concatenating its fields.
     * @return {?} String description to display.
     */
    AngularModalGalleryComponent.prototype.getDescriptionToDisplay = function () {
        if (this.description && this.description.customFullDescription) {
            return this.description.customFullDescription;
        }
        // If the current image hasn't a description,
        // prevent to write the ' - ' (or this.description.beforeTextDescription)
        if (!this.currentImage.description || this.currentImage.description === '') {
            return "" + this.description.imageText + (this.currentImageIndex + 1) + this.description.numberSeparator + this.images.length;
        }
        return "" + this.description.imageText + (this.currentImageIndex + 1) + this.description.numberSeparator + this.images.length + this.description.beforeTextDescription + this.currentImage.description;
    };
    /**
     * Method `swipe` used by Hammerjs to support touch gestures.
     * @param {?} index Number that represent the current visible index
     * @param {?=} action String that represent the direction of the swipe action. 'swiperight' by default.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.swipe = function (index, action) {
        if (action === void 0) { action = this.SWIPE_ACTION.RIGHT; }
        switch (action) {
            case this.SWIPE_ACTION.RIGHT:
                this.nextImage(Action.SWIPE);
                break;
            case this.SWIPE_ACTION.LEFT:
                this.prevImage(Action.SWIPE);
                break;
        }
    };
    /**
     * Method `closeGallery` to close the modal gallery.
     * @param {?=} action Enum of type `Action` that represents the source
     *  action that closed the modal gallery. NORMAL by default.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.closeGallery = function (action) {
        if (action === void 0) { action = Action.NORMAL; }
        this.close.emit(new ImageModalEvent(action, true));
        this.opened = false;
        this.keyboardService.reset();
    };
    /**
     * Method `prevImage` to go back to the previous image shown into the modal gallery.
     * @param {?=} action Enum of type `Action` that represents the source
     *  action that moved back to the previous image. NORMAL by default.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.prevImage = function (action) {
        if (action === void 0) { action = Action.NORMAL; }
        // check if prevImage should be blocked
        if (this.isPreventSliding(0)) {
            return;
        }
        this.loading = true;
        this.currentImageIndex = this.getPrevIndex(action, this.currentImageIndex);
        this.showModalGallery(this.currentImageIndex);
    };
    /**
     * Method `nextImage` to go back to the previous image shown into the modal gallery.
     * @param {?=} action Enum of type `Action` that represents the source
     *  action that moved to the next image. NORMAL by default.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.nextImage = function (action) {
        if (action === void 0) { action = Action.NORMAL; }
        // check if nextImage should be blocked
        if (this.isPreventSliding(this.images.length - 1)) {
            return;
        }
        this.loading = true;
        this.currentImageIndex = this.getNextIndex(action, this.currentImageIndex);
        this.showModalGallery(this.currentImageIndex);
    };
    /**
     * Method `onShowModalGallery` called when you click on an image of your gallery.
     * The input index is the index of the clicked image thumb.
     * @param {?} index Number that represents the index of the clicked image.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.onShowModalGallery = function (index) {
        this.showModalGallery(index);
    };
    /**
     * Method `showModalGallery` to show the modal gallery displaying the image with
     * the index specified as input parameter.
     * It will also register a new `keyboardService` to catch keyboard's events to download the current
     * image with keyboard's shortcuts. This service, will be removed when modal gallery component will be destroyed.
     * @param {?} index Number that represents the index of the image to show.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.showModalGallery = function (index) {
        var _this = this;
        this.keyboardService.add(function (event, combo) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            else {
                // internet explorer
                event.returnValue = false;
            }
            _this.downloadImage();
        });
        // enable/disable 'infinite sliding' based on @Input() slideConfig
        this.manageSlideConfig(index);
        this.currentImageIndex = index;
        this.opened = true;
        this.currentImage = this.images[this.currentImageIndex];
        this.loading = false;
        // emit current visible image index
        this.show.emit(new ImageModalEvent(Action.LOAD, this.currentImageIndex + 1));
    };
    /**
     * Method `downloadImage` to download the current visible image, only if `downloadable` is true.
     * For IE, this will navigate to the image instead of a direct download as in all modern browsers.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.downloadImage = function () {
        if (!this.downloadable) {
            return;
        }
        // for all browsers
        // Attention: with IE is not working, but it will navigate to the image
        var /** @type {?} */ link = document.createElement('a');
        link.href = this.currentImage.img;
        link.setAttribute('download', this.getFileName(this.currentImage.img));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    /**
     * Method `onClickOutside` to close modal gallery when both `enableCloseOutside` is true and user
     * clicked on the semi-transparent background around the image.
     * @param {?} event Boolean that is true if user clicked on the semi-transparent background, false otherwise.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.onClickOutside = function (event) {
        if (event && this.enableCloseOutside) {
            this.closeGallery(Action.CLICK);
        }
    };
    /**
     * Method to get `alt attribute`.
     * `alt` specifies an alternate text for an image, if the image cannot be displayed.
     * There is a similar version of this method into `gallery.component.ts` that
     * receives the image index as input.
     * @param {?} currentImage Image that represents the current visible image.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.getAltDescriptionByImage = function (currentImage) {
        if (!currentImage) {
            return '';
        }
        if (!currentImage.description) {
            return "Image " + this.images.indexOf(currentImage);
        }
        return currentImage.description;
    };
    /**
     * Method `ngOnDestroy` to cleanup resources. In fact, this will unsubscribe
     * all subscriptions and it will reset keyboard's service.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.ngOnDestroy = function () {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.keyboardService.reset();
    };
    /**
     * Private method `getNextIndex` to get the next index, based on the action and the current index.
     * This is necessary because at the end, when you call next again, you'll go to the first image.
     * That happens because all modal images are shown like in a circle.
     * @param {?} action Enum of type Action that represents the source of the event that changed the
     *  current image to the next one.
     * @param {?} currentIndex Number that represents the current index of the visible image.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.getNextIndex = function (action, currentIndex) {
        var /** @type {?} */ newIndex = 0;
        if (currentIndex >= 0 && currentIndex < this.images.length - 1) {
            newIndex = currentIndex + 1;
        }
        else {
            newIndex = 0; // start from the first index
        }
        // emit first/last event based on newIndex value
        this.emitBoundaryEvent(action, newIndex);
        // emit current visible image index
        this.show.emit(new ImageModalEvent(action, currentIndex + 1));
        return newIndex;
    };
    /**
     * Private method `getPrevIndex` to get the previous index, based on the action and the current index.
     * This is necessary because at index 0, when you call prev again, you'll go to the last image.
     * That happens because all modal images are shown like in a circle.
     * @param {?} action Enum of type Action that represents the source of the event that changed the
     *  current image to the previous one.
     * @param {?} currentIndex Number that represents the current index of the visible image.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.getPrevIndex = function (action, currentIndex) {
        var /** @type {?} */ newIndex = 0;
        if (currentIndex > 0 && currentIndex <= this.images.length - 1) {
            newIndex = currentIndex - 1;
        }
        else {
            newIndex = this.images.length - 1; // start from the last index
        }
        // emit first/last event based on newIndex value
        this.emitBoundaryEvent(action, newIndex);
        // emit current visible image index
        this.show.emit(new ImageModalEvent(action, currentIndex + 1));
        return newIndex;
    };
    /**
     * Private method ´initImages´ to initialize `images` as array of `Image` or as an
     * Observable of `Array<Image>`. Also, it will call completeInitialization.
     * @param {?=} emitHasDataEvent boolean to emit `hasData` event while initializing `angular-modal-gallery`.
     *  Use this parameter to prevent multiple `hasData` events.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.initImages = function (emitHasDataEvent) {
        var _this = this;
        if (emitHasDataEvent === void 0) { emitHasDataEvent = false; }
        if (this.modalImages instanceof Array) {
            this.images = (this.modalImages);
            this.completeInitialization(emitHasDataEvent);
        }
        else {
            if (this.modalImages instanceof Observable$1) {
                this.subscription = ((this.modalImages)).subscribe(function (val) {
                    _this.images = val;
                    _this.completeInitialization(emitHasDataEvent);
                });
            }
        }
    };
    /**
     * Private method ´completeInitialization´ to emit ImageModalEvent to say that images are loaded. If you are
     * using imagePointer feature, it will also call showModalGallery with imagePointer as parameter.
     * @param {?} emitHasDataEvent boolean to emit `hasData` event while initializing `angular-modal-gallery`.
     *  Use this parameter to prevent multiple `hasData` events.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.completeInitialization = function (emitHasDataEvent) {
        if (emitHasDataEvent) {
            // this will prevent multiple emissions if called from both ngOnInit and ngOnChanges
            this.hasData.emit(new ImageModalEvent(Action.LOAD, true));
        }
        this.loading = true;
        if (this.imagePointer >= 0) {
            this.showGallery = false;
            this.showModalGallery(this.imagePointer);
        }
        else {
            this.showGallery = true;
        }
    };
    /**
     * Private method `emitBoundaryEvent` to emit events when either the last or the first image are visible.
     * @param {?} action Enum of type Action that represents the source of the event that changed the
     *  current image to the first one or the last one.
     * @param {?} indexToCheck Number of type Action that represents the source of the event that changed the
     *  current image to either the first or the last one.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.emitBoundaryEvent = function (action, indexToCheck) {
        // to emit first/last event
        switch (indexToCheck) {
            case 0:
                this.firstImage.emit(new ImageModalEvent(action, true));
                break;
            case this.images.length - 1:
                this.lastImage.emit(new ImageModalEvent(action, true));
                break;
        }
    };
    /**
     * Method `getFileName` to get the filename from an input path.
     * This is used to get the image's name from its path.
     * @param {?} path String that represents the path of the image.
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.getFileName = function (path) {
        return path.replace(/^.*[\\\/]/, '');
    };
    /**
     * Method `manageSlideConfig` to manage boundary arrows and sliding.
     * This is based on \@Input() slideConfig to enable/disable 'infinite sliding'.
     * @param {?} index
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.manageSlideConfig = function (index) {
        if (!this.slideConfig || this.slideConfig.infinite !== false) {
            this.isFirstImage = false;
            this.isLastImage = false;
        }
        else {
            this.isFirstImage = index === 0;
            this.isLastImage = index === this.images.length - 1;
        }
    };
    /**
     * Method `isPreventSliding` to check if next/prev actions should be blocked.
     * It checks if slideConfig.infinite === false and if the image index is equals to the input parameter.
     * If yes, it returns true to say that sliding should be blocked, otherwise not.
     *  of images (this.images.length - 1).
     *  either the first or the last one.
     * @param {?} boundaryIndex
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.isPreventSliding = function (boundaryIndex) {
        return !!this.slideConfig && this.slideConfig.infinite === false &&
            this.currentImageIndex === boundaryIndex;
    };
    /**
     * @return {?}
     */
    AngularModalGalleryComponent.prototype.onScrollDown = function () {
        this.scrolled.emit(null);
    };
    return AngularModalGalleryComponent;
}());
AngularModalGalleryComponent.decorators = [
    { type: Component, args: [{
                selector: 'modal-gallery',
                exportAs: 'modalGallery',
                styles: ["\n    /*\n     The MIT License (MIT)\n\n     Copyright (c) 2017 Stefano Cappa (Ks89)\n     Copyright (c) 2016 vimalavinisha\n\n     Permission is hereby granted, free of charge, to any person obtaining a copy\n     of this software and associated documentation files (the \"Software\"), to deal\n     in the Software without restriction, including without limitation the rights\n     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n     copies of the Software, and to permit persons to whom the Software is\n     furnished to do so, subject to the following conditions:\n\n     The above copyright notice and this permission notice shall be included in all\n     copies or substantial portions of the Software.\n\n     THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n     FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE\n     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n     SOFTWARE.\n     */\n    .ng-overlay {\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.8);\n      /*opacity: 0.85;*/\n      z-index: 9999;\n      -webkit-user-select: none;\n      -moz-user-select: none;\n      -ms-user-select: none;\n      user-select: none;\n      -webkit-user-drag: none; }\n\n    .ng-gallery-content {\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      z-index: 10000;\n      text-align: center; }\n      .ng-gallery-content > a.nav-left, .ng-gallery-content > a.nav-right {\n        color: #fff !important;\n        text-decoration: none;\n        font-size: 60px;\n        cursor: pointer;\n        outline: none; }\n      .ng-gallery-content > a.nav-left {\n        position: fixed;\n        left: 15px;\n        top: 50%;\n        -webkit-transform: translateY(-50%);\n                transform: translateY(-50%); }\n      .ng-gallery-content > a.nav-right {\n        position: fixed;\n        right: 15px;\n        top: 50%;\n        -webkit-transform: translateY(-50%);\n                transform: translateY(-50%); }\n      .ng-gallery-content > img {\n        height: auto;\n        max-height: calc(100% - 150px);\n        max-width: calc(100% - 100px);\n        position: relative;\n        display: block;\n        margin: 0 auto 0 auto;\n        top: 50%;\n        transform: translateY(-50%);\n        -webkit-transform: translateY(-50%);\n        cursor: pointer;\n        -webkit-user-select: none;\n        -moz-user-select: none;\n        -ms-user-select: none;\n        user-select: none;\n        -webkit-user-drag: none; }\n      .ng-gallery-content.effect {\n        -webkit-animation: fadeIn 0.5s;\n                animation: fadeIn 0.5s; }\n      .ng-gallery-content > span.info-text {\n        color: #fff;\n        display: inline-block;\n        width: 100%;\n        height: 20px;\n        font-weight: bold;\n        text-align: center;\n        position: fixed;\n        left: 0;\n        right: 0; }\n      @media (max-width: 676px) {\n        .ng-gallery-content > span.info-text {\n          bottom: 100px; } }\n      @media (min-width: 676px) and (max-width: 752px) {\n        .ng-gallery-content > span.info-text {\n          padding-top: 52px; } }\n      @media (min-width: 752px) and (max-width: 804px) {\n        .ng-gallery-content > span.info-text {\n          padding-top: 43px; } }\n      @media (min-width: 804px) {\n        .ng-gallery-content > span.info-text {\n          bottom: 100px; } }\n      .ng-gallery-content > .ng-thumbnails-wrapper {\n        width: 400px;\n        height: 70px;\n        text-align: center;\n        position: fixed;\n        bottom: 20px;\n        left: 0;\n        right: 0;\n        margin-left: auto;\n        margin-right: auto;\n        overflow-x: hidden; }\n        .ng-gallery-content > .ng-thumbnails-wrapper > .ng-thumbnails {\n          width: 4000px;\n          height: 70px; }\n          .ng-gallery-content > .ng-thumbnails-wrapper > .ng-thumbnails > div > img {\n            width: auto;\n            height: 70px;\n            float: left;\n            margin-right: 10px;\n            cursor: pointer;\n            opacity: 0.6; }\n            .ng-gallery-content > .ng-thumbnails-wrapper > .ng-thumbnails > div > img:hover, .ng-gallery-content > .ng-thumbnails-wrapper > .ng-thumbnails > div > img.active {\n              -webkit-transition: opacity 0.25s ease;\n              transition: opacity 0.25s ease;\n              opacity: 1; }\n\n    @-webkit-keyframes fadeIn {\n      from {\n        opacity: 0.3; }\n      to {\n        opacity: 1; } }\n\n    @keyframes fadeIn {\n      from {\n        opacity: 0.3; }\n      to {\n        opacity: 1; } }\n\n    /* Loading - from http://loading.io */\n    uiload {\n      display: inline-block;\n      position: relative; }\n      uiload > div {\n        position: relative; }\n\n    @-webkit-keyframes uil-ring-anim {\n      0% {\n        -webkit-transform: rotate(0deg);\n        transform: rotate(0deg); }\n      100% {\n        -webkit-transform: rotate(360deg);\n        transform: rotate(360deg); } }\n\n    @keyframes uil-ring-anim {\n      0% {\n        -webkit-transform: rotate(0deg);\n        transform: rotate(0deg); }\n      100% {\n        -webkit-transform: rotate(360deg);\n        transform: rotate(360deg); } }\n\n    .uil-ring-css {\n      background: none;\n      position: relative;\n      top: 0;\n      margin: 180px auto 0 auto;\n      width: 100px;\n      height: 100px; }\n      .uil-ring-css > div {\n        position: absolute;\n        display: block;\n        width: 80px;\n        height: 80px;\n        top: 20px;\n        left: 20px;\n        border-radius: 40px;\n        -webkit-box-shadow: 0 6px 0 0 #fff;\n                box-shadow: 0 6px 0 0 #fff;\n        -webkit-animation: uil-ring-anim 1s linear infinite;\n        animation: uil-ring-anim 1s linear infinite; }\n  "],
                template: "\n    <gallery [images]=\"images\" [showGallery]=\"showGallery\" [showThumbCaption]=\"showThumbCaption\" (show)=\"onShowModalGallery($event)\" (scrolled)=\"onScrollDown()\"></gallery>\n\n    <div class=\"ng-overlay\" *ngIf=\"opened\">\n\n      <div id=\"ng-gallery-content\" class=\"ng-gallery-content\"\n           click-outside [clickOutsideEnable]=\"enableCloseOutside\"\n           (clickOutside)=\"onClickOutside($event)\">\n\n          <div class=\"uil-ring-css\" *ngIf=\"loading\">\n            <div></div>\n          </div>\n\n          <upperButtons [image]=\"currentImage\" [configButtons]=\"configButtons\"\n                        (close)=\"closeGallery()\" (download)=\"downloadImage()\"></upperButtons>\n\n          <a class=\"nav-left\" *ngIf=\"images?.length > 1\"\n             [hidden]=\"isFirstImage\"\n             (click)=\"prevImage()\"><i class=\"fa fa-angle-left\"></i>\n          </a>\n          <img *ngIf=\"!loading\" class=\"effect\" src=\"{{ currentImage.img }}\"\n               alt=\"{{getAltDescriptionByImage(currentImage)}}\"\n               (click)=\"nextImage(clickAction)\"\n               (swipeleft)=\"swipe(currentImageIndex, $event.type)\"\n               (swiperight)=\"swipe(currentImageIndex, $event.type)\"/>\n          <a class=\"nav-right\" *ngIf=\"images?.length > 1\"\n             [hidden]=\"isLastImage\"\n             (click)=\"nextImage()\"><i class=\"fa fa-angle-right\"></i>\n          </a>\n          <span class=\"info-text\" [innerHtml]=\"getDescriptionToDisplay()\"></span>\n      </div>\n    </div>\n  "
            },] },
];
/**
 * @nocollapse
 */
AngularModalGalleryComponent.ctorParameters = function () { return [
    { type: KeyboardService, },
]; };
AngularModalGalleryComponent.propDecorators = {
    'modalImages': [{ type: Input },],
    'imagePointer': [{ type: Input },],
    'downloadable': [{ type: Input },],
    'description': [{ type: Input },],
    'buttonsConfig': [{ type: Input },],
    'keyboardConfig': [{ type: Input },],
    'enableCloseOutside': [{ type: Input },],
    'slideConfig': [{ type: Input },],
    'showDownloadButton': [{ type: Input },],
    'showExtUrlButton': [{ type: Input },],
    'showThumbCaption': [{ type: Input },],
    'close': [{ type: Output },],
    'show': [{ type: Output },],
    'firstImage': [{ type: Output },],
    'lastImage': [{ type: Output },],
    'hasData': [{ type: Output },],
    'isServerSide': [{ type: Input },],
    'scrolled': [{ type: Output },],
    'onKeyDown': [{ type: HostListener, args: ['window:keydown', ['$event'],] },],
};
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Directive to display the external url button.
 * To show this button, you must provide a ButtonsConfig object with 'extUrl: true' as property.
 * All other configurations will hide this button.
 * Pay attention, because this directive is quite smart to choose button's order using the
 * correct right margin in pixels. To do that, it uses also imgExtUrl and configButtons.
 */
var ExternalUrlButtonDirective = (function () {
    /**
     * @param {?} renderer
     * @param {?} el
     */
    function ExternalUrlButtonDirective(renderer, el) {
        this.renderer = renderer;
        this.el = el;
        this.RIGHT = 63;
    }
    /**
     * @return {?}
     */
    ExternalUrlButtonDirective.prototype.ngOnInit = function () {
        this.applyStyle();
    };
    /**
     * @param {?} changes
     * @return {?}
     */
    ExternalUrlButtonDirective.prototype.ngOnChanges = function (changes) {
        this.applyStyle();
    };
    /**
     * @return {?}
     */
    ExternalUrlButtonDirective.prototype.applyStyle = function () {
        var /** @type {?} */ right = 0;
        if (this.configButtons && this.configButtons.extUrl && this.imgExtUrl) {
            right = this.getNumOfPrecedingButtons() * this.RIGHT;
        }
        else {
            right = 0;
        }
        // apply [style.right]="" to external url <a></a>
        this.renderer.setElementStyle(this.el.nativeElement, 'right', right + "px");
        // hide externalUrlButton based on this condition
        // configButtons && !configButtons.extUrl OR imgExtUrl is not valid (for instance is null)
        this.renderer.setElementProperty(this.el.nativeElement, 'hidden', !this.configButtons || (this.configButtons && !this.configButtons.extUrl) || !this.imgExtUrl);
    };
    /**
     * @return {?}
     */
    ExternalUrlButtonDirective.prototype.getNumOfPrecedingButtons = function () {
        var /** @type {?} */ num = 0;
        if (!this.configButtons) {
            return num;
        }
        if (this.configButtons.close === undefined || this.configButtons.close === true) {
            num++;
        }
        return num;
    };
    return ExternalUrlButtonDirective;
}());
ExternalUrlButtonDirective.decorators = [
    { type: Directive, args: [{
                selector: '[exturl-button]'
            },] },
];
/**
 * @nocollapse
 */
ExternalUrlButtonDirective.ctorParameters = function () { return [
    { type: Renderer, },
    { type: ElementRef, },
]; };
ExternalUrlButtonDirective.propDecorators = {
    'configButtons': [{ type: Input },],
    'imgExtUrl': [{ type: Input },],
};
/**
 * Directive to display the download button.
 * To show this button, you must provide a ButtonsConfig object with 'download: true' as property.
 * All other configurations will hide this button.
 * Pay attention, because this directive is quite smart to choose button's order using the
 * correct right margin in pixels. To do that, it uses also imgExtUrl and configButtons.
 */
var DownloadButtonDirective = (function () {
    /**
     * @param {?} renderer
     * @param {?} el
     */
    function DownloadButtonDirective(renderer, el) {
        this.renderer = renderer;
        this.el = el;
        this.RIGHT = 63;
    }
    /**
     * @return {?}
     */
    DownloadButtonDirective.prototype.ngOnInit = function () {
        this.applyStyle();
    };
    /**
     * @param {?} changes
     * @return {?}
     */
    DownloadButtonDirective.prototype.ngOnChanges = function (changes) {
        this.applyStyle();
    };
    /**
     * @return {?}
     */
    DownloadButtonDirective.prototype.applyStyle = function () {
        var /** @type {?} */ right = 0;
        if (this.configButtons && this.configButtons.download) {
            right = this.getNumOfPrecedingButtons() * this.RIGHT;
        }
        else {
            right = 0;
        }
        // apply [style.right]="" to download url <a></a>
        this.renderer.setElementStyle(this.el.nativeElement, 'right', right + "px");
        // hide downloadButton if configButtons.download is false
        this.renderer.setElementProperty(this.el.nativeElement, 'hidden', !this.configButtons || (this.configButtons && !this.configButtons.download));
    };
    /**
     * @return {?}
     */
    DownloadButtonDirective.prototype.getNumOfPrecedingButtons = function () {
        var /** @type {?} */ num = 0;
        if (!this.configButtons) {
            return num;
        }
        if (this.configButtons.extUrl && this.imgExtUrl) {
            num++;
        }
        if (this.configButtons.close === undefined || this.configButtons.close === true) {
            num++;
        }
        return num;
    };
    return DownloadButtonDirective;
}());
DownloadButtonDirective.decorators = [
    { type: Directive, args: [{
                selector: '[download-button]'
            },] },
];
/**
 * @nocollapse
 */
DownloadButtonDirective.ctorParameters = function () { return [
    { type: Renderer, },
    { type: ElementRef, },
]; };
DownloadButtonDirective.propDecorators = {
    'configButtons': [{ type: Input },],
    'imgExtUrl': [{ type: Input },],
};
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Directive to display the close button.
 * To hide this button, you must provide a ButtonsConfig object with 'close: false' as property.
 * All other configurations won't hide this button.
 */
var CloseButtonDirective = (function () {
    /**
     * @param {?} renderer
     * @param {?} el
     */
    function CloseButtonDirective(renderer, el) {
        this.renderer = renderer;
        this.el = el;
    }
    /**
     * @return {?}
     */
    CloseButtonDirective.prototype.ngOnInit = function () {
        this.applyStyle();
    };
    /**
     * @param {?} changes
     * @return {?}
     */
    CloseButtonDirective.prototype.ngOnChanges = function (changes) {
        this.applyStyle();
    };
    /**
     * @return {?}
     */
    CloseButtonDirective.prototype.applyStyle = function () {
        // apply [style.right]="" to close url <a></a>
        this.renderer.setElementStyle(this.el.nativeElement, 'right', '0px');
        var /** @type {?} */ condition = this.configButtons === null || (this.configButtons && this.configButtons.close === false);
        // hide closeButton if configButtons.close is false
        this.renderer.setElementProperty(this.el.nativeElement, 'hidden', condition);
    };
    return CloseButtonDirective;
}());
CloseButtonDirective.decorators = [
    { type: Directive, args: [{
                selector: '[close-button]'
            },] },
];
/**
 * @nocollapse
 */
CloseButtonDirective.ctorParameters = function () { return [
    { type: Renderer, },
    { type: ElementRef, },
]; };
CloseButtonDirective.propDecorators = {
    'configButtons': [{ type: Input },],
};
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Directive to close the modal gallery clicking on the semi-transparent background.
 * In fact, it listens for a click on the element with id="ng-gallery-content" and it emits
 * an event using `\@Output clickOutside`.
 */
var ClickOutsideDirective = (function () {
    function ClickOutsideDirective() {
        this.clickOutside = new EventEmitter();
    }
    /**
     * @param {?} targetElement
     * @return {?}
     */
    ClickOutsideDirective.prototype.onClick = function (targetElement) {
        var /** @type {?} */ elementId = targetElement.id;
        if (elementId === 'ng-gallery-content' && this.clickOutsideEnable) {
            this.clickOutside.emit(true);
        }
    };
    return ClickOutsideDirective;
}());
ClickOutsideDirective.decorators = [
    { type: Directive, args: [{
                selector: '[click-outside]'
            },] },
];
/**
 * @nocollapse
 */
ClickOutsideDirective.ctorParameters = function () { return []; };
ClickOutsideDirective.propDecorators = {
    'clickOutsideEnable': [{ type: Input },],
    'clickOutside': [{ type: Output },],
    'onClick': [{ type: HostListener, args: ['document:click', ['$event.target'],] },],
};
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Array of all directives.
 */
var DIRECTIVES = [
    ExternalUrlButtonDirective, DownloadButtonDirective, CloseButtonDirective, ClickOutsideDirective
];
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Component with all upper right buttons.
 * In fact, it uses a template with extUrl, download and close buttons with the right directive.
 * Also it emits click events as outputs.
 */
var UpperButtonsComponent = (function () {
    function UpperButtonsComponent() {
        this.close = new EventEmitter();
        this.download = new EventEmitter();
    }
    /**
     * @return {?}
     */
    UpperButtonsComponent.prototype.downloadImage = function () {
        this.download.emit(true);
    };
    /**
     * @return {?}
     */
    UpperButtonsComponent.prototype.closeGallery = function () {
        this.close.emit(true);
    };
    return UpperButtonsComponent;
}());
UpperButtonsComponent.decorators = [
    { type: Component, args: [{
                selector: 'upperButtons',
                styles: ["\n    a.close-popup {\n      font-size: 42px;\n      float: right;\n      color: #fff !important;\n      text-decoration: none;\n      margin: 0 30px 0 0;\n      cursor: pointer;\n      position: absolute;\n      top: 20px;\n      right: 0; }\n\n    a.external-url-image {\n      font-size: 33px;\n      float: right;\n      color: #fff !important;\n      text-decoration: none;\n      margin: 0 30px 0 0;\n      cursor: pointer;\n      position: absolute;\n      top: 28px;\n      right: 0px; }\n\n    a.download-image {\n      font-size: 33px;\n      float: right;\n      color: #fff !important;\n      text-decoration: none;\n      margin: 0 30px 0 0;\n      cursor: pointer;\n      position: absolute;\n      top: 28px;\n      right: 0px; }\n  "],
                template: "\n    <a class=\"external-url-image\" href=\"{{image?.extUrl}}\"\n       exturl-button [configButtons]=\"configButtons\" [imgExtUrl]=\"image?.extUrl\"><i class=\"fa fa-external-link\"></i></a>\n    <a class=\"download-image\"\n       download-button [configButtons]=\"configButtons\" [imgExtUrl]=\"image?.extUrl\"\n       (click)=\"downloadImage()\"><i class=\"fa fa-download\"></i></a>\n    <a class=\"close-popup\"\n       close-button [configButtons]=\"configButtons\"\n       (click)=\"closeGallery()\"><i class=\"fa fa-close\"></i></a>\n  "
            },] },
];
/**
 * @nocollapse
 */
UpperButtonsComponent.ctorParameters = function () { return []; };
UpperButtonsComponent.propDecorators = {
    'image': [{ type: Input },],
    'configButtons': [{ type: Input },],
    'close': [{ type: Output },],
    'download': [{ type: Output },],
};
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/**
 * Component with the gallery of thumbs.
 * In receives an array of Images and a boolean to show/hide
 * the gallery (feature used by imagePointer).
 * Also it emits click events as outputs.
 */
var GalleryComponent = (function () {
    function GalleryComponent() {
        /**
         * Infinite scroll with server side images
         */
        this.isServerSide = false;
        /**
         * Function to call at bottom of thumbnails cointainer
         */
        this.scrolled = new EventEmitter();
        this.show = new EventEmitter();
    }
    /**
     * @param {?} index
     * @return {?}
     */
    GalleryComponent.prototype.showModalGallery = function (index) {
        this.show.emit(index);
    };
    /**
     * Method to get `alt attribute`.
     * `alt` specifies an alternate text for an image, if the image cannot be displayed.
     * There is a similar version of this method into `modal-gallery.component.ts` that
     * receives an Image as input.
     * @param {?} index Number that represents the image index.
     * @return {?}
     */
    GalleryComponent.prototype.getAltDescriptionByIndex = function (index) {
        if (!this.images) {
            return '';
        }
        if (!this.images[index] || !this.images[index].description) {
            return "Image " + index;
        }
        return this.images[index].description;
    };
    /**
     * @return {?}
     */
    GalleryComponent.prototype.onScrollDown = function () {
        this.scrolled.emit(null);
    };
    return GalleryComponent;
}());
GalleryComponent.decorators = [
    { type: Component, args: [{
                selector: 'gallery',
                styles: ["\n    /*\n     The MIT License (MIT)\n\n     Copyright (c) 2017 Stefano Cappa (Ks89)\n     Copyright (c) 2016 vimalavinisha\n\n     Permission is hereby granted, free of charge, to any person obtaining a copy\n     of this software and associated documentation files (the \"Software\"), to deal\n     in the Software without restriction, including without limitation the rights\n     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n     copies of the Software, and to permit persons to whom the Software is\n     furnished to do so, subject to the following conditions:\n\n     The above copyright notice and this permission notice shall be included in all\n     copies or substantial portions of the Software.\n\n     THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n     FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE\n     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n     SOFTWARE.\n     */\n    .ng-gallery {\n      width: 100%;\n      display: inline-block; }\n\n    img.ng-thumb {\n      height: 50px;\n      float: left;\n      display: block;\n      cursor: pointer;\n      margin: 2px 2px 0 0; }\n\n    .img {\n      text-align: left;\n      display: block;\n      background-color: transparent;\n      border: 1px solid transparent;\n      margin-right: 10px;\n      margin-bottom: 1px;\n      float: left; }\n  "],
                template: "\n    <div class=\"ng-gallery\" *ngIf=\"showGallery\">\n      <div class=\"img\" *ngFor=\"let i of images; let index = index\">\n        <ng-container *ngIf=\"i && i.img && !isServerSide\">\n          <img *ngIf=\"i.thumb\" src=\"{{ i.thumb }}\" class=\"ng-thumb\" (click)=\"showModalGallery(index)\"\n               alt=\"{{getAltDescriptionByIndex(index)}}\" [ngStyle]=\"{'width': i.thumbWidth, 'height': i.thumbHeight}\" crossorigin=\"use-credentials\"/>\n          <img *ngIf=\"!i.thumb\" src=\"{{ i.img }}\" class=\"ng-thumb\" (click)=\"showModalGallery(index)\"\n               alt=\"{{getAltDescriptionByIndex(index)}}\" [ngStyle]=\"{'width': i.thumbWidth, 'height': i.thumbHeight}\"/>\n          <div *ngIf=\"showThumbCaption\" class=\"small\" [ngStyle]=\"{'width': i.thumbWidth, 'height': '100px', 'float': 'left', 'clear': 'both'}\"\n               [innerHTML]=\"i.caption\"></div>\n        </ng-container>\n        <ng-container *ngIf=\"i && i.img && isServerSide\">\n          <div\n            data-infinite-scroll\n            debounce\n            (scrolled)=\"onScrollDown()\">\n            <img *ngIf=\"i.thumb\" src=\"{{ i.thumb }}\" class=\"ng-thumb\" (click)=\"showModalGallery(index)\"\n                 alt=\"{{getAltDescriptionByIndex(index)}}\" [ngStyle]=\"{'width': i.thumbWidth, 'height': i.thumbHeight}\" crossorigin=\"use-credentials\"/>\n            <img *ngIf=\"!i.thumb\" src=\"{{ i.img }}\" class=\"ng-thumb\" (click)=\"showModalGallery(index)\"\n                 alt=\"{{getAltDescriptionByIndex(index)}}\" [ngStyle]=\"{'width': i.thumbWidth, 'height': i.thumbHeight}\"/>\n            <div *ngIf=\"showThumbCaption\" class=\"small\" [ngStyle]=\"{'width': i.thumbWidth, 'height': '100px', 'float': 'left', 'clear': 'both'}\"\n                 [innerHTML]=\"i.caption\"></div>\n          </div>\n        </ng-container>\n      </div>\n    </div>\n  "
            },] },
];
/**
 * @nocollapse
 */
GalleryComponent.ctorParameters = function () { return []; };
GalleryComponent.propDecorators = {
    'images': [{ type: Input },],
    'showThumbCaption': [{ type: Input },],
    'showGallery': [{ type: Input },],
    'isServerSide': [{ type: Input },],
    'scrolled': [{ type: Output },],
    'show': [{ type: Output },],
};
/**
 * @param {?} selector
 * @param {?} scrollWindow
 * @param {?} defaultElement
 * @param {?} fromRoot
 * @return {?}
 */
function resolveContainerElement(selector, scrollWindow, defaultElement, fromRoot) {
    var /** @type {?} */ hasWindow = window && !!window.document && window.document.documentElement;
    var /** @type {?} */ container = hasWindow && scrollWindow ? window : defaultElement;
    if (selector) {
        var /** @type {?} */ containerIsString = selector && hasWindow && typeof selector === 'string';
        container = containerIsString
            ? findElement(selector, defaultElement.nativeElement, fromRoot)
            : selector;
        if (!container) {
            throw new Error('ngx-infinite-scroll {resolveContainerElement()}: selector for');
        }
    }
    return container;
}
/**
 * @param {?} selector
 * @param {?} customRoot
 * @param {?} fromRoot
 * @return {?}
 */
function findElement(selector, customRoot, fromRoot) {
    var /** @type {?} */ rootEl = fromRoot ? window.document : customRoot;
    return rootEl.querySelector(selector);
}
/**
 * @param {?} prop
 * @return {?}
 */
function inputPropChanged(prop) {
    return prop && !prop.firstChange;
}
/**
 * @return {?}
 */
function hasWindowDefined() {
    return typeof window !== 'undefined';
}
var AxisResolver = (function () {
    /**
     * @param {?=} vertical
     */
    function AxisResolver(vertical) {
        if (vertical === void 0) {
            vertical = true;
        }
        this.vertical = vertical;
    }
    /**
     * @return {?}
     */
    AxisResolver.prototype.clientHeightKey = function () { return this.vertical ? 'clientHeight' : 'clientWidth'; };
    /**
     * @return {?}
     */
    AxisResolver.prototype.offsetHeightKey = function () { return this.vertical ? 'offsetHeight' : 'offsetWidth'; };
    /**
     * @return {?}
     */
    AxisResolver.prototype.scrollHeightKey = function () { return this.vertical ? 'scrollHeight' : 'scrollWidth'; };
    /**
     * @return {?}
     */
    AxisResolver.prototype.pageYOffsetKey = function () { return this.vertical ? 'pageYOffset' : 'pageXOffset'; };
    /**
     * @return {?}
     */
    AxisResolver.prototype.offsetTopKey = function () { return this.vertical ? 'offsetTop' : 'offsetLeft'; };
    /**
     * @return {?}
     */
    AxisResolver.prototype.scrollTopKey = function () { return this.vertical ? 'scrollTop' : 'scrollLeft'; };
    /**
     * @return {?}
     */
    AxisResolver.prototype.topKey = function () { return this.vertical ? 'top' : 'left'; };
    return AxisResolver;
}());
/**
 * @param {?} alwaysCallback
 * @param {?} shouldFireScrollEvent
 * @param {?} isTriggeredCurrentTotal
 * @return {?}
 */
function shouldTriggerEvents(alwaysCallback, shouldFireScrollEvent, isTriggeredCurrentTotal) {
    return (alwaysCallback || shouldFireScrollEvent) && !isTriggeredCurrentTotal;
}
/**
 * @param {?} __0
 * @return {?}
 */
function createResolver(_a) {
    var windowElement = _a.windowElement, axis = _a.axis;
    return createResolverWithContainer({ axis: axis, isWindow: isElementWindow(windowElement) }, windowElement);
}
/**
 * @param {?} resolver
 * @param {?} windowElement
 * @return {?}
 */
function createResolverWithContainer(resolver, windowElement) {
    var /** @type {?} */ container = resolver.isWindow || (windowElement && !windowElement.nativeElement)
        ? windowElement
        : windowElement.nativeElement;
    return Object.assign({}, resolver, { container: container });
}
/**
 * @param {?} windowElement
 * @return {?}
 */
function isElementWindow(windowElement) {
    var /** @type {?} */ isWindow = ['Window', 'global'].some(function (obj) { return Object.prototype.toString.call(windowElement).includes(obj); });
    return isWindow;
}
/**
 * @param {?} isContainerWindow
 * @param {?} windowElement
 * @return {?}
 */
function getDocumentElement(isContainerWindow, windowElement) {
    return isContainerWindow ? windowElement.document.documentElement : null;
}
/**
 * @param {?} element
 * @param {?} resolver
 * @return {?}
 */
function calculatePoints(element, resolver) {
    var /** @type {?} */ height = extractHeightForElement(resolver);
    return resolver.isWindow
        ? calculatePointsForWindow(height, element, resolver)
        : calculatePointsForElement(height, element, resolver);
}
/**
 * @param {?} height
 * @param {?} element
 * @param {?} resolver
 * @return {?}
 */
function calculatePointsForWindow(height, element, resolver) {
    var axis = resolver.axis, container = resolver.container, isWindow = resolver.isWindow;
    var _a = extractHeightPropKeys(axis), offsetHeightKey = _a.offsetHeightKey, clientHeightKey = _a.clientHeightKey;
    // scrolled until now / current y point
    var /** @type {?} */ scrolled = height +
        getElementPageYOffset(getDocumentElement(isWindow, container), axis, isWindow);
    // total height / most bottom y point
    var /** @type {?} */ nativeElementHeight = getElementHeight(element.nativeElement, isWindow, offsetHeightKey, clientHeightKey);
    var /** @type {?} */ totalToScroll = getElementOffsetTop(element.nativeElement, axis, isWindow) +
        nativeElementHeight;
    return { height: height, scrolled: scrolled, totalToScroll: totalToScroll };
}
/**
 * @param {?} height
 * @param {?} element
 * @param {?} resolver
 * @return {?}
 */
function calculatePointsForElement(height, element, resolver) {
    var axis = resolver.axis, container = resolver.container;
    // perhaps use container.offsetTop instead of 'scrollTop'
    var /** @type {?} */ scrolled = container[axis.scrollTopKey()];
    var /** @type {?} */ totalToScroll = container[axis.scrollHeightKey()];
    return { height: height, scrolled: scrolled, totalToScroll: totalToScroll };
}
/**
 * @param {?} axis
 * @return {?}
 */
function extractHeightPropKeys(axis) {
    return {
        offsetHeightKey: axis.offsetHeightKey(),
        clientHeightKey: axis.clientHeightKey()
    };
}
/**
 * @param {?} __0
 * @return {?}
 */
function extractHeightForElement(_a) {
    var container = _a.container, isWindow = _a.isWindow, axis = _a.axis;
    var _b = extractHeightPropKeys(axis), offsetHeightKey = _b.offsetHeightKey, clientHeightKey = _b.clientHeightKey;
    return getElementHeight(container, isWindow, offsetHeightKey, clientHeightKey);
}
/**
 * @param {?} elem
 * @param {?} isWindow
 * @param {?} offsetHeightKey
 * @param {?} clientHeightKey
 * @return {?}
 */
function getElementHeight(elem, isWindow, offsetHeightKey, clientHeightKey) {
    if (isNaN(elem[offsetHeightKey])) {
        return getDocumentElement(isWindow, elem)[clientHeightKey];
    }
    else {
        return elem[offsetHeightKey];
    }
}
/**
 * @param {?} elem
 * @param {?} axis
 * @param {?} isWindow
 * @return {?}
 */
function getElementOffsetTop(elem, axis, isWindow) {
    var /** @type {?} */ topKey = axis.topKey();
    // elem = elem.nativeElement;
    if (!elem.getBoundingClientRect) {
        // || elem.css('none')) {
        return;
    }
    return (elem.getBoundingClientRect()[topKey] +
        getElementPageYOffset(elem, axis, isWindow));
}
/**
 * @param {?} elem
 * @param {?} axis
 * @param {?} isWindow
 * @return {?}
 */
function getElementPageYOffset(elem, axis, isWindow) {
    var /** @type {?} */ pageYOffset = axis.pageYOffsetKey();
    var /** @type {?} */ scrollTop = axis.scrollTopKey();
    var /** @type {?} */ offsetTop = axis.offsetTopKey();
    if (isNaN(window[pageYOffset])) {
        return getDocumentElement(isWindow, elem)[scrollTop];
    }
    else if (elem.ownerDocument) {
        return elem.ownerDocument.defaultView[pageYOffset];
    }
    else {
        return elem[offsetTop];
    }
}
/**
 * @param {?} container
 * @param {?} distance
 * @param {?} scrollingDown
 * @return {?}
 */
function shouldFireScrollEvent(container, distance, scrollingDown) {
    var /** @type {?} */ remaining;
    var /** @type {?} */ containerBreakpoint;
    var /** @type {?} */ scrolledUntilNow = container.height + container.scrolled;
    if (scrollingDown) {
        remaining = (container.totalToScroll - scrolledUntilNow) / container.totalToScroll;
        containerBreakpoint = distance.down / 10;
    }
    else {
        remaining = scrolledUntilNow / container.totalToScroll;
        containerBreakpoint = distance.up / 10;
    }
    var /** @type {?} */ shouldFireEvent = remaining <= containerBreakpoint;
    return shouldFireEvent;
}
/**
 * @param {?} lastScrollPosition
 * @param {?} container
 * @return {?}
 */
function isScrollingDownwards(lastScrollPosition, container) {
    return lastScrollPosition < container.scrolled;
}
/**
 * @param {?} lastScrollPosition
 * @param {?} container
 * @param {?} distance
 * @return {?}
 */
function getScrollStats(lastScrollPosition, container, distance) {
    var /** @type {?} */ scrollDown = isScrollingDownwards(lastScrollPosition, container);
    return {
        fire: shouldFireScrollEvent(container, distance, scrollDown),
        scrollDown: scrollDown
    };
}
/**
 * @param {?} position
 * @param {?} scrollState
 * @return {?}
 */
function updateScrollPosition(position, scrollState) {
    return (scrollState.lastScrollPosition = position);
}
/**
 * @param {?} totalToScroll
 * @param {?} scrollState
 * @return {?}
 */
function updateTotalToScroll(totalToScroll, scrollState) {
    if (scrollState.lastTotalToScroll !== totalToScroll) {
        scrollState.lastTotalToScroll = scrollState.totalToScroll;
        scrollState.totalToScroll = totalToScroll;
    }
}
/**
 * @param {?} scrollState
 * @return {?}
 */
/**
 * @param {?} scroll
 * @param {?} scrollState
 * @param {?} triggered
 * @param {?} isScrollingDown
 * @return {?}
 */
function updateTriggeredFlag(scroll, scrollState, triggered, isScrollingDown) {
    if (isScrollingDown) {
        scrollState.triggered.down = scroll;
    }
    else {
        scrollState.triggered.up = scroll;
    }
}
/**
 * @param {?} totalToScroll
 * @param {?} scrollState
 * @param {?} isScrollingDown
 * @return {?}
 */
function isTriggeredScroll(totalToScroll, scrollState, isScrollingDown) {
    return isScrollingDown
        ? scrollState.triggered.down === totalToScroll
        : scrollState.triggered.up === totalToScroll;
}
/**
 * @param {?} scrollState
 * @param {?} scrolledUntilNow
 * @param {?} totalToScroll
 * @return {?}
 */
function updateScrollState(scrollState, scrolledUntilNow, totalToScroll) {
    updateScrollPosition(scrolledUntilNow, scrollState);
    updateTotalToScroll(totalToScroll, scrollState);
    // const isSameTotal = isSameTotalToScroll(scrollState);
    // if (!isSameTotal) {
    //   updateTriggeredFlag(scrollState, false, isScrollingDown);
    // }
}
/**
 * @param {?} config
 * @return {?}
 */
function createScroller(config) {
    var scrollContainer = config.scrollContainer, scrollWindow = config.scrollWindow, element = config.element, fromRoot = config.fromRoot;
    var /** @type {?} */ resolver = createResolver({
        axis: new AxisResolver(!config.horizontal),
        windowElement: resolveContainerElement(scrollContainer, scrollWindow, element, fromRoot)
    });
    var startWithTotal = calculatePoints(element, resolver).totalToScroll;
    var /** @type {?} */ scrollState = {
        lastScrollPosition: 0,
        lastTotalToScroll: 0,
        totalToScroll: startWithTotal,
        triggered: {
            down: 0,
            up: 0
        }
    };
    var /** @type {?} */ options = {
        container: resolver.container,
        throttle: config.throttle
    };
    var /** @type {?} */ distance = {
        up: config.upDistance,
        down: config.downDistance
    };
    return attachScrollEvent(options)
        .mergeMap(function (ev) { return of$2(calculatePoints(element, resolver)); })
        .map(function (positionStats) { return toInfiniteScrollParams(scrollState.lastScrollPosition, positionStats, distance); })
        .do(function (_a) {
        var stats = _a.stats;
        return updateScrollState(scrollState, stats.scrolled, stats.totalToScroll);
    })
        .filter(function (_a) {
        var fire = _a.fire, scrollDown = _a.scrollDown, totalToScroll = _a.stats.totalToScroll;
        return shouldTriggerEvents(fire, config.alwaysCallback, isTriggeredScroll(totalToScroll, scrollState, scrollDown));
    })
        .do(function (_a) {
        var scrollDown = _a.scrollDown, totalToScroll = _a.stats.totalToScroll;
        updateTriggeredFlag(totalToScroll, scrollState, true, scrollDown);
    })
        .map(toInfiniteScrollAction);
}
/**
 * @param {?} options
 * @return {?}
 */
function attachScrollEvent(options) {
    var /** @type {?} */ obs = Observable$1.fromEvent(options.container, 'scroll');
    // For an unknown reason calling `sampleTime()` causes trouble for many users, even with `options.throttle = 0`.
    // Let's avoid calling the function unless needed.
    // See https://github.com/orizens/ngx-infinite-scroll/issues/198
    if (options.throttle) {
        obs = obs.sampleTime(options.throttle);
    }
    return obs;
}
/**
 * @param {?} lastScrollPosition
 * @param {?} stats
 * @param {?} distance
 * @return {?}
 */
function toInfiniteScrollParams(lastScrollPosition, stats, distance) {
    var _a = getScrollStats(lastScrollPosition, stats, distance), scrollDown = _a.scrollDown, fire = _a.fire;
    return {
        scrollDown: scrollDown,
        fire: fire,
        stats: stats
    };
}
var InfiniteScrollActions = {
    DOWN: '[NGX_ISE] DOWN',
    UP: '[NGX_ISE] UP'
};
/**
 * @param {?} response
 * @return {?}
 */
function toInfiniteScrollAction(response) {
    var scrollDown = response.scrollDown, currentScrollPosition = response.stats.scrolled;
    return {
        type: scrollDown ? InfiniteScrollActions.DOWN : InfiniteScrollActions.UP,
        payload: {
            currentScrollPosition: currentScrollPosition
        }
    };
}
var InfiniteScrollDirective = (function () {
    /**
     * @param {?} element
     * @param {?} zone
     */
    function InfiniteScrollDirective(element, zone) {
        this.element = element;
        this.zone = zone;
        this.scrolled = new EventEmitter();
        this.scrolledUp = new EventEmitter();
        this.infiniteScrollDistance = 2;
        this.infiniteScrollUpDistance = 1.5;
        this.infiniteScrollThrottle = 150;
        this.infiniteScrollDisabled = false;
        this.infiniteScrollContainer = null;
        this.scrollWindow = true;
        this.immediateCheck = false;
        this.horizontal = false;
        this.alwaysCallback = false;
        this.fromRoot = false;
    }
    /**
     * @return {?}
     */
    InfiniteScrollDirective.prototype.ngAfterViewInit = function () {
        if (!this.infiniteScrollDisabled) {
            this.setup();
        }
    };
    /**
     * @param {?} __0
     * @return {?}
     */
    InfiniteScrollDirective.prototype.ngOnChanges = function (_a) {
        var infiniteScrollContainer = _a.infiniteScrollContainer, infiniteScrollDisabled = _a.infiniteScrollDisabled, infiniteScrollDistance = _a.infiniteScrollDistance;
        var /** @type {?} */ containerChanged = inputPropChanged(infiniteScrollContainer);
        var /** @type {?} */ disabledChanged = inputPropChanged(infiniteScrollDisabled);
        var /** @type {?} */ distanceChanged = inputPropChanged(infiniteScrollDistance);
        var /** @type {?} */ shouldSetup = (!disabledChanged && !this.infiniteScrollDisabled) ||
            (disabledChanged && !infiniteScrollDisabled.currentValue) || distanceChanged;
        if (containerChanged || disabledChanged || distanceChanged) {
            this.destroyScroller();
            if (shouldSetup) {
                this.setup();
            }
        }
    };
    /**
     * @return {?}
     */
    InfiniteScrollDirective.prototype.setup = function () {
        var _this = this;
        if (hasWindowDefined()) {
            this.zone.runOutsideAngular(function () {
                _this.disposeScroller = createScroller({
                    fromRoot: _this.fromRoot,
                    alwaysCallback: _this.alwaysCallback,
                    disable: _this.infiniteScrollDisabled,
                    downDistance: _this.infiniteScrollDistance,
                    element: _this.element,
                    horizontal: _this.horizontal,
                    scrollContainer: _this.infiniteScrollContainer,
                    scrollWindow: _this.scrollWindow,
                    throttle: _this.infiniteScrollThrottle,
                    upDistance: _this.infiniteScrollUpDistance
                }).subscribe(function (payload) { return _this.zone.run(function () { return _this.handleOnScroll(payload); }); });
            });
        }
    };
    /**
     * @param {?} __0
     * @return {?}
     */
    InfiniteScrollDirective.prototype.handleOnScroll = function (_a) {
        var type = _a.type, payload = _a.payload;
        switch (type) {
            case InfiniteScrollActions.DOWN:
                return this.scrolled.emit(payload);
            case InfiniteScrollActions.UP:
                return this.scrolledUp.emit(payload);
            default:
                return;
        }
    };
    /**
     * @return {?}
     */
    InfiniteScrollDirective.prototype.ngOnDestroy = function () {
        this.destroyScroller();
    };
    /**
     * @return {?}
     */
    InfiniteScrollDirective.prototype.destroyScroller = function () {
        if (this.disposeScroller) {
            this.disposeScroller.unsubscribe();
        }
    };
    return InfiniteScrollDirective;
}());
InfiniteScrollDirective.decorators = [
    { type: Directive, args: [{
                selector: '[infiniteScroll], [infinite-scroll], [data-infinite-scroll]'
            },] },
];
/**
 * @nocollapse
 */
InfiniteScrollDirective.ctorParameters = function () {
    return [
        { type: ElementRef, },
        { type: NgZone, },
    ];
};
InfiniteScrollDirective.propDecorators = {
    'scrolled': [{ type: Output },],
    'scrolledUp': [{ type: Output },],
    'infiniteScrollDistance': [{ type: Input },],
    'infiniteScrollUpDistance': [{ type: Input },],
    'infiniteScrollThrottle': [{ type: Input },],
    'infiniteScrollDisabled': [{ type: Input },],
    'infiniteScrollContainer': [{ type: Input },],
    'scrollWindow': [{ type: Input },],
    'immediateCheck': [{ type: Input },],
    'horizontal': [{ type: Input },],
    'alwaysCallback': [{ type: Input },],
    'fromRoot': [{ type: Input },],
};
var InfiniteScrollModule = (function () {
    function InfiniteScrollModule() {
    }
    return InfiniteScrollModule;
}());
InfiniteScrollModule.decorators = [
    { type: NgModule, args: [{
                declarations: [InfiniteScrollDirective],
                exports: [InfiniteScrollDirective],
                imports: [],
                providers: []
            },] },
];
/**
 * @nocollapse
 */
InfiniteScrollModule.ctorParameters = function () { return []; };
/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

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
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
var KEYBOARD_CONFIGURATION = new InjectionToken('KEYBOARD_CONFIGURATION');
/**
 * Module with `forRoot` method to import it in the root module of your application.
 */
var ModalGalleryModule = (function () {
    function ModalGalleryModule() {
    }
    /**
     * @param {?=} config
     * @return {?}
     */
    ModalGalleryModule.forRoot = function (config) {
        return {
            ngModule: ModalGalleryModule,
            providers: [
                {
                    provide: KEYBOARD_CONFIGURATION,
                    useValue: config ? config : {}
                },
                {
                    provide: KeyboardService,
                    useFactory: setupRouter,
                    deps: [KEYBOARD_CONFIGURATION]
                }
            ]
        };
    };
    return ModalGalleryModule;
}());
ModalGalleryModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule, InfiniteScrollModule],
                declarations: [AngularModalGalleryComponent, UpperButtonsComponent, GalleryComponent, DIRECTIVES],
                exports: [AngularModalGalleryComponent]
            },] },
];
/**
 * @nocollapse
 */
ModalGalleryModule.ctorParameters = function () { return []; };
/**
 * @param {?} injector
 * @return {?}
 */
function setupRouter(injector) {
    return new KeyboardService(injector);
}
/*
 * MIT License
 *
 * Copyright (c) 2017 Stefano Cappa
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/**
 * Generated bundle index. Do not edit.
 */
export { ModalGalleryModule, Action, Image, ImageModalEvent, GalleryComponent as ɵg, AngularModalGalleryComponent as ɵc, UpperButtonsComponent as ɵf, ClickOutsideDirective as ɵl, CloseButtonDirective as ɵk, DIRECTIVES as ɵh, DownloadButtonDirective as ɵj, ExternalUrlButtonDirective as ɵi, KEYBOARD_CONFIGURATION as ɵa, setupRouter as ɵb, KeyboardService as ɵd };
//# sourceMappingURL=angular-modal-gallery.es5.js.map
