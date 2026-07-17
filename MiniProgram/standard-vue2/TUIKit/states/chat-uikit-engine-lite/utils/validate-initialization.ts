/* eslint-disable prefer-rest-params */
import type { ITUIChatEngine } from '../interface/engine';
import Middleware from './middleware';
import { ERROR_CODE_ENGINE, ERROR_MSG_ENGINE } from '../const';

export default function validateInitialization(
  TUIChatEngine: ITUIChatEngine,
  target: any,
  APIList: object,
) {
  const obj = Object.create(null);
  Object.keys(APIList).forEach((api) => {
    if (!target[api]) {
      return;
    }
    obj[api] = target[api];

    const validateMiddleware = new Middleware();
    target[api] = function () {
      const args = Array.from(arguments);
      validateMiddleware
        .use((options: any, next: any) => {
          if (TUIChatEngine.isInited) {
            return next();
          }
          return Promise.reject({
            code: ERROR_CODE_ENGINE.NOT_INIT,
            message: `${api} | ${ERROR_MSG_ENGINE.NOT_INIT}`,
          });
        })
        .use((options: any) => obj[api].apply(target, options));
      return validateMiddleware.run(args);
    };
  });
}
