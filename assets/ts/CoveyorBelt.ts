import { _decorator, Component, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ConveyorBelt')
export class ConveyorBelt extends Component {

    @property
    speed: number = 100; // Speed of the belt movement

    update(dt: number) {
        // Assuming this.node is the parent node of the conveyor belt pieces
        const parentNodeWidth = this.node.getComponent(UITransform)?.width ?? 0;

        this.node.children.forEach((child: Node) => {
            // Move each child to the left
            const childUITransform = child.getComponent(UITransform);
            if (childUITransform) {
                child.setPosition(child.position.x - this.speed * dt, child.position.y);
                
                // Get the child's width
                const childWidth = childUITransform.width;

                // If the child is completely out of the view on the left
                if (child.position.x + childWidth / 2 < -parentNodeWidth / 2) {
                    // Find the rightmost position among the siblings
                    let maxX = -Infinity;
                    this.node.children.forEach((sibling) => {
                        const siblingUITransform = sibling.getComponent(UITransform);
                        if (siblingUITransform) {
                            const siblingRightEdge = sibling.position.x + siblingUITransform.width / 2;
                            maxX = Math.max(maxX, siblingRightEdge);
                        }
                    });

                    // Move the child to the rightmost position
                    child.setPosition(maxX + childWidth / 2, child.position.y);
                }
            }
        });
    }
}
