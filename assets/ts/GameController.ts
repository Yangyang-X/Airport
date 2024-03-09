import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  Vec3,
  view,
  UITransform,
  Sprite,
  SpriteFrame,
  resources,
  director,
  SpriteAtlas,
  assetManager,
} from "cc";
import { Flag } from "./Flag";
import { Suitcase } from "./Suitcase";

const { ccclass, property } = _decorator;
import { GlobalEvents } from "./GlobalEvents";

@ccclass("GameController")
export class GameController extends Component {
  @property({ type: Node })
  conveyorBeltNode: Node = null; // Assign this in the editor

  @property({ type: Prefab })
  suitcasePrefab: Prefab = null; // Assign this in the editor

  @property({ type: Prefab })
  flagPrefab: Prefab = null; // Assign this in the editor

  @property
  beltSpeed: number = 100;

  start() {
    GlobalEvents.emit("update-country-name", "法国");
    GlobalEvents.emit("update-score", 500);

    this.addFlagsToScreen();

    // Start adding suitcases periodically
    this.schedule(this.addSuitcaseWithoutFlag, 5, Infinity); // Every 5 seconds
  }

  addFlagsToScreen() {
    const flagWidth = 160;
    const flagHeight = 120;
    const spacing = 24;
    const rows = 2;
    const cols = 3;
    const canvasSize = view.getVisibleSize();

    const countryCodes = ["GB", "US", "CN", "IT", "FR", "IN"];

    // Calculate the total grid width and height
    const totalWidth = cols * flagWidth + (cols - 1) * spacing;

    // Calculate the starting position of the grid to center it
    const startX = (canvasSize.width - totalWidth) / 2;
    const startY = canvasSize.height / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Instantiate a new flag
        const newFlag = instantiate(this.flagPrefab);
        newFlag.on("flag-tapped", this.handleFlagTapped, this);

        // Calculate and set the position of the flag within the grid
        const x = startX + col * (flagWidth + spacing);
        const y = startY - row * (flagHeight + spacing);
        newFlag.setPosition(new Vec3(x, y, 0));
        const flagComponent = newFlag.getComponent(Flag);
        flagComponent.setFlag(countryCodes[row * 3 + col], "US");

        // Optionally, adjust the size of the flag node to match the desired flag dimensions
        // This step may require accessing the UITransform component of the newFlag
        const uiTransform = newFlag.getComponent(UITransform);
        if (uiTransform) {
          uiTransform.setContentSize(flagWidth, flagHeight);
        }

        // Add the new flag to the scene
        this.node.addChild(newFlag);
      }
    }
  }

  handleFlagTapped(cca2: string) {
    for (const child of this.node.children) {
      // Check if the child is a suitcase
      if (child.name.startsWith("Suitcase")) {
        // Adjust condition based on your naming convention
        const suitcaseComponent = child.getComponent(Suitcase); // Adjust Suitcase to your actual component class name
        if (suitcaseComponent) {
          suitcaseComponent.stickFlag(cca2);
          break; // Exit after attaching the flag to the first suitcase
        }
      }
    }
  }

  addSuitcaseWithoutFlag() {
    // Create a new instance of the suitcase prefab
    const newSuitcase = instantiate(this.suitcasePrefab);

    // Assuming you have a "Flag" node under each suitcase prefab instance
    const flagNode = newSuitcase.getChildByName("Flag");

    if (flagNode) {
      // Try to get the Sprite component from the flag node
      let flagSprite = flagNode.getComponent(Sprite);

      // If the flag node doesn't have a Sprite component, add it
      if (!flagSprite) {
        flagSprite = flagNode.addComponent(Sprite);
      }
    } else {
      console.error("Flag node not found in the instantiated prefab");
    }

    const canvasSize = view.getVisibleSize();

    const beltPosition = this.conveyorBeltNode.getPosition();

    // Calculate the suitcase's position relative to the track
    // Let's say the suitcase should appear just above the track

    const yPosition = beltPosition.y;

    const xPosition = canvasSize.width;

    newSuitcase.setPosition(new Vec3(xPosition, yPosition, 0));

    // Add the new suitcase to the canvas
    this.node.addChild(newSuitcase);
  }
}
