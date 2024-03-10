import { _decorator, Component, Label } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ResultItem")
export class ResultItem extends Component {
  @property(Label)
  itemName: Label = null;

  @property(Label)
  itemNumber: Label = null;

  public setItem(name: string, number: number | string) {
    this.itemName.string = name;
    this.itemNumber.string = number.toString();
  }
}
