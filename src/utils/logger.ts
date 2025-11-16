/**
 * 개발 모드에서만 동작하는 로거
 * 프로덕션 빌드 시에는 로그가 출력되지 않습니다.
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * 개발 환경에서만 로그 출력
 */
export const devLogger = {
  /**
   * 일반 로그
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log('[DEV]', ...args);
    }
  },

  /**
   * 에러 로그
   */
  error: (...args: unknown[]): void => {
    if (isDev) {
      console.error('[DEV ERROR]', ...args);
    }
  },

  /**
   * 경고 로그
   */
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn('[DEV WARN]', ...args);
    }
  },

  /**
   * 정보 로그
   */
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info('[DEV INFO]', ...args);
    }
  },

  /**
   * 디버그 로그
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug('[DEV DEBUG]', ...args);
    }
  },
};

export default devLogger;
