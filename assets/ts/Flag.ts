import {
  _decorator,
  Component,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  tween,
  UITransform,
  Vec3,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("Flag")
export class Flag extends Component {
  @property
  flagName: string = ""; // Stores the country code of the flag

  @property
  correctName: string = "";
  start() {}

  update(deltaTime: number) {}

  public setFlag(cca2: string, correctName: string) {
    this.flagName = cca2; // Store the provided name
    this.correctName = correctName; // Store the provided correctName

    const flagNode = new Node("Flag");
    const flagSprite = flagNode.addComponent(Sprite);

    const path = `flags/${cca2}/spriteFrame`;
    resources.load(path, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
      if (err) {
        console.error(`Failed to load flag image for ${cca2}:`, err);
        return;
      }
      flagSprite.spriteFrame = spriteFrame;

      let uiTransform = flagNode.getComponent(UITransform);
      if (uiTransform) {
        let nodeWidth = 150; // Get the current width of the flag node

        let aspectRatio =
          spriteFrame.originalSize.height / spriteFrame.originalSize.width;
        let contentHeight = nodeWidth * aspectRatio; // Calculate the new height based on the aspect ratio

        // Set the new size for the node
        uiTransform.setContentSize(nodeWidth, contentHeight);
      }

      this.node.addChild(flagNode);
    });
  }

  protected onLoad(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onFlagTapped, this);
  }

  onFlagTapped() {
    console.log("Flag tapped", this.flagName);
    tween(this.node)
      .to(0.2, { scale: new Vec3(1.1, 1.1, 1.1) })
      .delay(0.4)
      .to(0.2, { scale: new Vec3(1, 1, 1) })
      .start();

    // Notify parent (FlagsGrid) that this flag was tapped
    this.node.emit("flag-tapped", this.flagName, this.correctName);
  }
}
