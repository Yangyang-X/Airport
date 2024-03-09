import {
  _decorator,
  Component,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3,
  view,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("Suitcase")
export class Suitcase extends Component {
  @property
  beltSpeed: number = 100;

  start() {
    // this.flag.active = false;
  }

  update(dt: number) {
    let currentPosition = this.node.position;
    let newPosition = new Vec3(
      currentPosition.x - this.beltSpeed * dt,
      currentPosition.y,
      currentPosition.z
    );
    this.node.setPosition(newPosition);

    const canvasSize = view.getVisibleSize();

    // Check if the suitcase is offscreen on the left side
    // Considering the origin (0,0) is at the center of the screen,
    // so the left edge is at x = -canvasSize.width / 2
    if (newPosition.x < -canvasSize.width / 2 - 120) {
      this.node.removeFromParent();
      // Additionally, you might want to destroy the node completely if not using pooling
      this.node.destroy();
    }
  }

  stickFlag(cca2: string) {
    console.log(`Attaching flag ${cca2} to suitcase`);

    // Create a new node for the flag
    const flagNode = new Node(`Flag-${cca2}`);
    const flagSprite = flagNode.addComponent(Sprite);

    // Set the size of the flag node using UITransform

    const path = `flags/${cca2}/spriteFrame`; // Make sure the path matches your project structure
    console.log(`Loading sprite frame ${path}`);

    resources.load(path, SpriteFrame, (err, spriteFrame: SpriteFrame) => {
      if (err) {
        console.error(`Failed to load flag image for ${cca2}:`, err);
        return;
      }
      flagSprite.spriteFrame = spriteFrame; // Set the loaded SpriteFrame to the sprite
      const uiTransform = flagNode.addComponent(UITransform);
      uiTransform.width = 81;
      let aspectRatio =
        spriteFrame.originalSize.height / spriteFrame.originalSize.width;
      let contentHeight = 81 * aspectRatio; // Calculate the new height based on the aspect ratio

      uiTransform.height = contentHeight;
    });

    // Add the new flag node to the current node (the suitcase)
    this.node.addChild(flagNode);

    // Optional: Adjust the position of the flag node relative to the suitcase node if needed
    const offsetX = 5;
    const offsetY = -8;
    flagNode.setPosition(new Vec3(offsetX, offsetY, 0));
  }
}
