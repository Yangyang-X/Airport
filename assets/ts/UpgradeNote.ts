import { _decorator, Component, Label, Animation } from "cc";
const { ccclass, property } = _decorator;

@ccclass("UpgradeNote")
export class UpgradeNote extends Component {
  @property(Label)
  levelLabel: Label = null;

  start() {}

  update(deltaTime: number) {}

  setLevel(level: string) {
    if (this.levelLabel) {
      this.levelLabel.string = level;
    }
  }

  playAnimation() {
    // 获取 Animation 组件
    const animation = this.getComponent(Animation);
    // 播放动画
    if (animation) {
      animation.play("levelup"); // 确保使用你的动画剪辑名称
    }
  }
}
