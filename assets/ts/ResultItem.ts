import { _decorator, Component, Label, Node, UITransform } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ResultItem")
export class ResultItem extends Component {
  @property(Label)
  itemName: Label = null;

  @property(Label)
  itemNumber: Label = null;

  @property(Node)
  spacerNode: Node = null;

  public setItem(name: string, number: number | string) {
    this.itemName.string = name;
    this.itemNumber.string = number.toString();
  }

  updateLayout() {
    const parentUITransform = this.node.getComponent(UITransform);

    if (parentUITransform) {
      let parentWidth = parentUITransform.contentSize.width;

      // Calculate positions
      const itemNameX =
        -parentWidth / 2 +
        this.itemName.node.getComponent(UITransform).contentSize.width / 2;
      const itemNumberX =
        parentWidth / 2 -
        this.itemNumber.node.getComponent(UITransform).contentSize.width / 2;

      // Set the position of the itemName to the left
      this.itemName.node.setPosition(itemNameX, 0);

      // Set the position of the itemNumber to the right
      this.itemNumber.node.setPosition(itemNumberX, 0);

      // Adjust spacer width to fill the space between
      const totalLabelWidth =
        this.itemName.node.getComponent(UITransform).contentSize.width +
        this.itemNumber.node.getComponent(UITransform).contentSize.width;
      let spacerWidth = parentWidth - totalLabelWidth;

      // Update spacer node's UITransform contentSize
      if (this.spacerNode) {
        const spacerUITransform = this.spacerNode.getComponent(UITransform); // Corrected this line
        if (spacerUITransform) {
          spacerUITransform.setContentSize(
            spacerWidth,
            spacerUITransform.contentSize.height
          );
        }
      }
    }
  }

  onLoad() {
    this.updateLayout();
  }

  // Update the layout whenever this node's transform changes
  update(deltaTime: number) {
    this.updateLayout();
  }
}
