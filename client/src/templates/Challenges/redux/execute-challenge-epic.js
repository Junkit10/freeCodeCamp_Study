import { Subject, merge, of, from } from 'rxjs';

import {
  debounceTime,
  switchMap,
  map,
  filter,
  pluck,
  concat,
  tap,
  catchError,
  ignoreElements,
  startWith,
  delay
} from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { overEvery, isString } from 'lodash';

import {
  types,
  challengeMetaSelector,
  challengeTestsSelector,
  initConsole,
  updateConsole,
  initLogs,
  updateLogs,
  logsToConsole,
  checkChallenge,
  updateTests,
  disableJSOnError,
  isJSEnabledSelector
} from './';
import { buildFromFiles, buildBackendChallenge } from '../utils/build';
import { runTestsInTestFrame, createTestFramer } from '../utils/frame.js';

import { challengeTypes } from '../../../../utils/challengeTypes';

const executeDebounceTimeout = 750;

function executeChallengeEpic(action$, state$, { document }) {
  return of(document).pipe(
    filter(Boolean),
    switchMap(() => {
      const frameReady = new Subject();
      const consoleProxy = new Subject();
      const frameTests = createTestFramer(
        document,
        state$,
        frameReady,
        consoleProxy
      );
      const challengeResults = frameReady.pipe(
        // Delay for jQuery ready code, in jQuery challenges
        delay(250),
        pluck('checkChallengePayload'),
        map(checkChallengePayload => ({
          checkChallengePayload,
          tests: challengeTestsSelector(state$.value)
        })),
        switchMap(({ checkChallengePayload, tests }) => {
          const postTests = of(
            updateConsole('// tests completed'),
            logsToConsole('// console output'),
            checkChallenge(checkChallengePayload)
          ).pipe(delay(250));
          return runTestsInTestFrame(document, tests).pipe(
            switchMap(tests => {
              return from(tests).pipe(
                map(({ message }) => message),
                filter(overEvery(isString, Boolean)),
                map(updateConsole),
                concat(of(updateTests(tests)))
              );
            }),
            concat(postTests)
          );
        })
      );
      const buildAndFrameChallenge = action$.pipe(
        ofType(types.executeChallenge),
        filter(() => false),
        debounceTime(executeDebounceTimeout),
        filter(() => isJSEnabledSelector(state$.value)),
        switchMap(() => {
          const state = state$.value;
          const { challengeType } = challengeMetaSelector(state);
          const build =
            challengeType === challengeTypes.backend
              ? buildBackendChallenge
              : buildFromFiles;
          return build(state).pipe(
            tap(frameTests),
            ignoreElements(),
            startWith(initLogs()),
            startWith(initConsole('// running tests')),
            catchError(err => {
              console.error(err);
              return of(disableJSOnError(err));
            })
          );
        })
      );
      const proxyConsole = consoleProxy.pipe(map(updateLogs));
      return merge(buildAndFrameChallenge, challengeResults, proxyConsole);
    })
  );
}

export default executeChallengeEpic;
