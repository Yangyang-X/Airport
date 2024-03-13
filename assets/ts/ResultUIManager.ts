import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Graphics,
  Color,
  Label,
  Layout,
  Size,
  UITransform,
} from "cc";
import { ResultItem } from "./ResultItem"; // Adjust the import path as necessary
const { ccclass, property } = _decorator;

@ccclass("ResultUIManager")
export class ResultUIManager extends Component {
  @property(Node)
  resultsContainer: Node = null; // Assign in the editor

  @property(Prefab)
  resultItemPrefab: Prefab = null; // Assign in the editor

  populateResults(results: { name: string; number: number | string }[], salary: number) {
    // Optional: Clear existing children
    this.resultsContainer.removeAllChildren();

    results.forEach((result) => {
      const resultItemInstance = instantiate(this.resultItemPrefab);
      this.resultsContainer.addChild(resultItemInstance);

      const resultItem = resultItemInstance.getComponent(ResultItem);
      if (resultItem) {
        resultItem.setItem(result.name, result.number.toString());
      }
    });

    const dividerWidth = 240; // Specify the desired width
    const divider = this.createDivider(dividerWidth);
    this.resultsContainer.addChild(divider);

    const salaryRow = this.createSalaryRow("工资", salary.toString());
    this.resultsContainer.addChild(salaryRow);
  }

  createDivider(width: number, height: number = 2): Node {
    const dividerNode = new Node("Divider");
    const graphics = dividerNode.addComponent(Graphics);
    const uiTransform = dividerNode.addComponent(UITransform);

    // Adjust UITransform size for layout considerations
    uiTransform.contentSize = new Size(width, 8); // Total height including space is 4

    // Set the color of the line and draw
    graphics.strokeColor = Color.WHITE;
    graphics.lineWidth = height;
    graphics.moveTo(-width / 2, 0);
    graphics.lineTo(width / 2, 0);
    graphics.stroke();

    return dividerNode;
  }

  createSalaryRow(name: string, amount: number | string): Node {
    const rowNode = new Node("SalaryRow");
    const layout = rowNode.addComponent(Layout);
    layout.type = Layout.Type.HORIZONTAL;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    const rowPadding = 20; // Increased padding for visual spacing
    layout.paddingLeft = layout.paddingRight = rowPadding;

    // Adjust the node's UITransform to set explicit size (optional, depending on your needs)
    const rowTransform = rowNode.addComponent(UITransform);
    rowTransform.contentSize = new Size(240, 50); // Example size, adjust as needed

    // Name Label with adjusted font size
    const nameLabel = new Node("NameLabel");
    const nameLabelComponent = nameLabel.addComponent(Label);
    nameLabelComponent.string = name;
    nameLabelComponent.fontSize = 24; // Adjusted font size

    rowNode.addChild(nameLabel);

    // Spacer node remains unchanged
    const spacerNode = new Node("Spacer");
    spacerNode.addComponent(UITransform).setContentSize(60, 1); // Adjust spacer width as needed
    rowNode.addChild(spacerNode);

    // Amount Label with adjusted font size
    const amountLabel = new Node("AmountLabel");
    const amountLabelComponent = amountLabel.addComponent(Label);
    amountLabelComponent.string = amount.toString();
    amountLabelComponent.fontSize = 24; // Adjusted font size

    rowNode.addChild(amountLabel);

    return rowNode;
  }
}
