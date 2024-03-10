import { _decorator, Component, Label, Node } from "cc";
import { GlobalEvents } from "./GlobalEvents";
const { ccclass, property } = _decorator;

@ccclass("Score")
export class Score extends Component {
  @property(Label)
  scoreLabel: Label = null;

  protected onLoad(): void {
    GlobalEvents.on("update-score", this.updateScore, this);
  }

  updateScore(score: number) {
    if (this.scoreLabel) {
      this.scoreLabel.string = score.toString();
    }
  }
}
