/**
 * @interface TUITranslateService
*/
export interface ITUIReportService {
  /**
   * Report key feature usage for analytics
   * @param code - Event code for analytics
   * @param feature - Feature name or identifier
   */
  reportFeature(code: number, feature?: string): void;
}
