import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  Vec3,
  view,
  UITransform,
  resources,
  JsonAsset,
  v2,
} from "cc";
import { Suitcase } from "./Suitcase";
import { GlobalEvents } from "./GlobalEvents";
import { Flag } from "./Flag";
import { Checkmark } from "./Checkmark";
import { ResultUIManager } from "./ResultUIManager";
const { ccclass, property } = _decorator;

interface Country {
  c: string; // Country code
  n: string; // Country name
  p: number; // Popularity
}

interface Question {
  answer: Country;
  options: Country[]; // Array of cca2 codes for options
}

@ccclass("GameController")
export class GameController extends Component {
  @property({ type: Node })
  conveyorBeltNode: Node = null; // Assign this in the editor

  @property({ type: Prefab })
  suitcasePrefab: Prefab = null; // Assign this in the editor

  @property({ type: Prefab })
  flagPrefab: Prefab = null; // Assign this in the editor

  @property({ type: Prefab })
  CheckmarkPrefab: Prefab = null; // Assign this in the editor

  @property
  beltSpeed: number = 100;

  private countryData: Country[] = [];
  private questions: Question[] = [];
  private questionIndex = 0;
  private correctAnswers = 0;
  private incorrectAnswers = 0;
  private score = 0;
  private questionStartTime = 0;
  private maxTimeForFullPoints = 3;

  onLoad() {
    this.loadCountryData();
  }

  start() {
    setTimeout(() => {
      this.loadQuestions();
    }, 1000);
  }

  loadCountryData() {
    resources.load("data/countries", JsonAsset, (err, asset) => {
      if (err) {
        console.error("Failed to load countries:", err);
        return;
      }
      const jsonData = (asset as JsonAsset).json;
      if (Array.isArray(jsonData)) {
        this.countryData = jsonData;
      } else {
        console.error("The loaded JSON is not an array.");
      }
    });
  }

  loadQuestions() {
    const eligibleCountries = this.countryData.filter(
      (country) => country.p >= 140
    );
    const shuffledCountries = eligibleCountries.sort(() => 0.5 - Math.random());
    const selectedCountries = shuffledCountries.slice(0, 5); //TODO change back to 20

    this.questions = selectedCountries.map((country) => {
      let optionsCountries = eligibleCountries
        .filter((option) => option.c !== country.c)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

      // Ensure the answer is not among the options
      optionsCountries = optionsCountries.filter(
        (option) => option.c !== country.c
      );

      const question: Question = {
        answer: country,
        options: optionsCountries,
      };

      return question;
    });

    this.updateQuestion();
  }

  updateQuestion() {
    // Update the question here
    this.questionStartTime = Date.now(); // Reset timer for each question
    this.clearFlags();

    const currentQuestion = this.questions[this.questionIndex];
    // Prepare country codes for the flags: answer + options, and shuffle
    // Combine answer and options, ensuring answer is not duplicated among options
    const allCountries = [currentQuestion.answer, ...currentQuestion.options];

    // Shuffle the combined array to randomize the order of flags displayed
    const shuffledCountries = allCountries.sort(() => Math.random() - 0.5);

    // Extract cca2 codes for addFlagsToScreen, assuming it needs just the codes
    const countryCodes = shuffledCountries.map((country) => country.c);

    this.addFlagsToScreen(countryCodes);
    GlobalEvents.emit("update-country-name", currentQuestion.answer.n);
    this.addSuitcaseWithoutFlag(currentQuestion.answer.c);
  }

  addFlagsToScreen(countryCodes: string[]) {
    const flagWidth = 160;
    const flagHeight = 120;
    const spacing = 24;
    const rows = 2;
    const cols = 3;
    const canvasSize = view.getVisibleSize();

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
        flagComponent.setFlag(
          countryCodes[row * 3 + col].toUpperCase(),
          "嘀哩嘀哩"
        );

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

  clearFlags() {
    this.node.children.forEach((child) => {
      if (child.getComponent(Flag)) {
        // Adjust condition if needed
        child.destroy();
      }
    });
  }

  updateScoreForAnswer(isCorrect: boolean) {
    const timeElapsed = (Date.now() - this.questionStartTime) / 1000; // Time elapsed in seconds
    const timeFactor = Math.max(0, 1 - timeElapsed / this.maxTimeForFullPoints); // Decreases with time

    if (isCorrect) {
      this.correctAnswers++;
      // Apply the time factor to the score calculation
      this.score += Math.round(10 + 10 * timeFactor); // Example formula
    } else {
      this.incorrectAnswers++;
      this.score -= 5; // Incorrect answers could have a fixed deduction
    }

    GlobalEvents.emit("update-score", this.score);
  }

  // Example usage: Call this when a player selects a flag
  checkAnswer(cca2: string) {
    const currentQuestion = this.questions[this.questionIndex];
    const isCorrect = cca2.toLowerCase() === currentQuestion.answer.c;
    if (isCorrect) {
      this.showCheckmark();
      const correspondingSuitcase = this.node.children.find(
        (child) => child.name === `Suitcase_${cca2.toLowerCase()}`
      );
      if (correspondingSuitcase) {
        const suitcaseComponent = correspondingSuitcase.getComponent(Suitcase);
        if (suitcaseComponent) {
          suitcaseComponent.stickFlag(cca2);
        }
      } else {
        console.error("Corresponding suitcase not found.");
      }
    }

    this.updateScoreForAnswer(isCorrect);

    setTimeout(() => {
      // Move to the next question with a delay to show the checkmark
      this.questionIndex++;
      if (this.questionIndex < this.questions.length) {
        this.clearFlags();
        this.updateQuestion();
      } else {
        this.endGame();
      }
    }, 2000);
  }

  endGame() {
    GlobalEvents.emit("update-country-name", "谢谢！");

    this.clearFlags();

    // Example game results
    const gameResults = [
      { name: "🧳", number: 20 },
      { name: "✅", number: this.correctAnswers },
      { name: "❌", number: this.correctAnswers },
    ];

    // Assuming ResultUIManager is attached to the same node as GameController or is accessible
    const resultUIManager = this.node
      .getChildByName("Result")
      .getComponent(ResultUIManager);
    if (resultUIManager) {
      console.log("GameController: Updating results");
      resultUIManager.populateResults(gameResults);
      const canvasSize = view.getVisibleSize();

      resultUIManager.node.setPosition(
        new Vec3(
          canvasSize.width / 2 - 132 + 25,
          canvasSize.height / 2 - 140,
          0
        )
      ); // Center the results UI node
    }
  }

  handleFlagTapped(cca2: string) {
    this.checkAnswer(cca2);
  }

  showCheckmark() {
    // Instantiate the checkmark prefab and add it to the scene
    const checkmarkNode = instantiate(this.CheckmarkPrefab);
    this.node.addChild(checkmarkNode);

    const canvasSize = view.getVisibleSize();

    // Position it in the center of the screen
    checkmarkNode.setPosition(
      canvasSize.width / 2 - 100,
      canvasSize.height / 2 - 50,
      0
    );

    // Optional: Add animation or scale it as required

    // Hide or destroy the checkmark after a brief period
    setTimeout(() => {
      checkmarkNode.destroy(); // or checkmarkNode.active = false; based on your needs
    }, 1500); // Adjust timing as necessary
  }

  addSuitcaseWithoutFlag(cca2: string) {
    const newSuitcase = instantiate(this.suitcasePrefab);
    newSuitcase.name = `Suitcase_${cca2}`;

    const beltPosition = this.conveyorBeltNode.getPosition();
    const yPosition = beltPosition.y;

    const canvasSize = view.getVisibleSize();
    const xPosition = canvasSize.width;
    newSuitcase.setPosition(new Vec3(xPosition, yPosition, 0));

    this.node.addChild(newSuitcase);
  }
}
