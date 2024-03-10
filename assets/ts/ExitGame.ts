import { _decorator, Component, director, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ExitGame")
export class ExitGame extends Component {
  start() {
    this.node.on(Node.EventType.TOUCH_END, this.onExitClicked, this);
  }

  update(deltaTime: number) {}

  onExitClicked() {
    // For navigating to a main menu scene within the game
    // director.loadScene("MainMenu");

    // OR for navigating to another webpage
    window.location.href = "https://dilidili.cloud";
  }
}
