/**
 * 임시: 프로덕션 환경에서도 디버깅을 위해 항상 로그 출력
 * TODO: 디버깅 완료 후 개발 모드에서만 출력하도록 복원
 */

/**
 * 로그 출력 (임시로 모든 환경에서 출력)
 */
export const devLogger = {
  /**
   * 일반 로그
   */
  log: (...args: unknown[]): void => {
    console.log('[LOG]', ...args);
  },

  /**
   * 에러 로그
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },

  /**
   * 경고 로그
   */
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },

  /**
   * 정보 로그
   */
  info: (...args: unknown[]): void => {
    console.info('[INFO]', ...args);
  },

  /**
   * 디버그 로그
   */
  debug: (...args: unknown[]): void => {
    console.debug('[DEBUG]', ...args);
  },
};

export default devLogger;
