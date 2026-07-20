import TUIBase from '../tui-base';

export default class TUIReportService extends TUIBase {
  static instance: TUIReportService;
  /**
  * Get TUIReportService instance
  */
  static getInstance() {
    if (!TUIReportService.instance) {
      TUIReportService.instance = new TUIReportService();
    }
    return TUIReportService.instance;
  }
  /**
   * Report key feature usage for analytics
   * @param code - Event code for analytics
   * @param feature - Feature name or identifier
   */
  public reportFeature(code: number, feature?: string) {
    return this.getEngine().chat?.callExperimentalAPI('statTUIKeyFeatures', {
      code,
      msg: feature ? `${code}-${feature}` : ''
    });
  }
}
