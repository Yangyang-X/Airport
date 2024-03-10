import { _decorator, Component, Label } from "cc";
import { GlobalEvents } from "./GlobalEvents";
const { ccclass, property } = _decorator;

@ccclass("Display")
export class Display extends Component {
  @property(Label)
  countryNameLabel: Label = null;

  protected onLoad(): void {
    // Listen for the 'update-country-name' event
    GlobalEvents.on("update-country-name", this.updateName, this);
  }

  protected onDestroy(): void {
    // Don't forget to unregister the event listener when the component is destroyed
    GlobalEvents.off("update-country-name", this.updateName, this);
  }

  updateName(name: string) {
    if (this.countryNameLabel) {
      this.countryNameLabel.string = name;
    }
  }
}
