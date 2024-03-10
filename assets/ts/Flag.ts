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
      if (!uiTransform) {
        uiTransform = flagNode.addComponent(UITransform);
      }

      // Container dimensions
      const containerWidth = 150;
      const containerHeight = 100;

      // Calculate the aspect ratio of the flag image
      const imageAspectRatio =
        spriteFrame.originalSize.height / spriteFrame.originalSize.width;

      // Calculate the aspect ratio of the container
      const containerAspectRatio = containerHeight / containerWidth;

      let scaleWidth: number, scaleHeight: number;

      // Compare the aspect ratios to decide how to scale the image
      if (imageAspectRatio >= 0.67) {
        // If the flag image is taller, scale based on the container's height
        scaleHeight = containerHeight;
        scaleWidth = containerHeight / imageAspectRatio;
      } else {
        // If the flag image is wider, scale based on the container's width
        scaleWidth = containerWidth;
        scaleHeight = scaleWidth * imageAspectRatio;
      }

      // Set the size for the flag image to fit within the container
      uiTransform.setContentSize(scaleWidth, scaleHeight);

      // Finally, add the flagNode to the current node
      this.node.addChild(flagNode);
    });
  }

  protected onLoad(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onFlagTapped, this);
  }

  onFlagTapped() {
    tween(this.node)
      .to(0.2, { scale: new Vec3(1.1, 1.1, 1.1) }) // Scale up
      .delay(0.4) // Hold the scale
      .to(0.2, { scale: new Vec3(1, 1, 1) }) // Scale down
      .call(() => {
        // Notify parent (FlagsGrid) that this flag was tapped, after animation
        this.node.emit("flag-tapped", this.flagName, this.correctName);
      })
      .start();
  }
}
