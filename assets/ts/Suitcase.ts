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
import { GlobalEvents } from "./GlobalEvents";
const { ccclass, property } = _decorator;

@ccclass("Suitcase")
export class Suitcase extends Component {
  @property
  beltSpeed: number = 100;

  private isFlagged: boolean = false;

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
    // console.log("newPosition", newPosition);

    if (newPosition.x < -50) {
      if (!this.isFlagged) {
        // The suitcase was not flagged or was flagged incorrectly
        console.log(
          "Suitcase reached the end without the correct flag or any flag."
        );
        // Here you could call a method to decrement the score, show an alert, etc.
        this.emitSuitcaseMissed(); // This is a hypothetical method. You'll need to implement it.
        this.isFlagged = true;
      }
    }

    if (newPosition.x < -canvasSize.width / 2 - 120) {
      this.node.removeFromParent();
      // Additionally, you might want to destroy the node completely if not using pooling
      this.node.destroy();
    }
  }

  emitSuitcaseMissed() {
    GlobalEvents.emit("suitcase-missed");
  }

  stickFlag(cca2: string) {
    this.isFlagged = true;

    // Create a new node for the flag
    const flagNode = new Node(`Flag-${cca2}`);
    const flagSprite = flagNode.addComponent(Sprite);

    // Set the size of the flag node using UITransform

    const path = `flags/${cca2}/spriteFrame`; // Make sure the path matches your project structure

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
