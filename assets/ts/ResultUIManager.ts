import { _decorator, Component, Node, Prefab, instantiate } from "cc";
import { ResultItem } from "./ResultItem"; // Adjust the import path as necessary
const { ccclass, property } = _decorator;

@ccclass("ResultUIManager")
export class ResultUIManager extends Component {
  @property(Node)
  resultsContainer: Node = null; // Assign in the editor

  @property(Prefab)
  resultItemPrefab: Prefab = null; // Assign in the editor

  populateResults(results: { name: string; number: number | string }[]) {
    this.resultsContainer.removeAllChildren();

    let yOffset = 0; // Initial Y-offset for the first item
    const offsetStep = -50; // Adjust this value as needed for the spacing between items

    results.forEach((result, index) => {
      const resultItemInstance = instantiate(this.resultItemPrefab);
      this.resultsContainer.addChild(resultItemInstance);

      // Set the position of each item with an offset
      // Assuming you're adding items from top to bottom. Adjust as necessary.
      resultItemInstance.setPosition(0, yOffset, 0);

      // Update yOffset for the next item
      yOffset += offsetStep;

      const resultItem = resultItemInstance.getComponent(ResultItem);
      if (resultItem) {
        resultItem.setItem(result.name, result.number.toString());
      }
    });
  }
}
