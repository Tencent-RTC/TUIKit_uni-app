import ChatEngine from './TUIEngine/engine';

export default class TUIBase {
  public getEngine() {
    return ChatEngine.getInstance();
  }
}
