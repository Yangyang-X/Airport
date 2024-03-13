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
  Button,
  Label,
  sys,
  AudioSource,
  AudioClip,
} from "cc";
import { Suitcase } from "./Suitcase";
import { GlobalEvents } from "./GlobalEvents";
import { Flag } from "./Flag";
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

  @property({ type: Prefab })
  ConfirmButtonPrefab: Prefab = null; // Assign this in the editor

  @property({ type: Node })
  preGameUI: Node = null; // Assign this in the editor to your pre-game UI node

  @property({ type: Label })
  levelDisplayLabel: Label = null; // Assign this in the editor to the label showing the level

  @property({ type: Node })
  startButtonNode: Node = null; // Assign this in the editor to your "开始" button node

  private confirmButtonNode: Node = null; // Class level reference

  private currentLevel: number = 1;

  private justUpgraded: boolean = false;

  private levelNames = {
    1: "实习生",
    2: "专员",
    3: "资深专员",
    4: "专家",
  };

  @property
  beltSpeed: number = 100;

  private countryData: Country[] = [];
  private questions: Question[] = [];
  private questionIndex = 0;
  private correctAnswers = 0;
  private incorrectAnswers = 0;
  private missed = 0;
  private score = 0;
  private questionStartTime = 0;

  onLoad() {
    this.loadLevel();
    this.loadCountryData();
    this.playAudio("bkg", true);
  }

  loadLevel() {
    const savedLevel = sys.localStorage.getItem("currentLevel");
    if (savedLevel) {
      this.currentLevel = parseInt(savedLevel, 10); // Ensure it's an integer
    } else {
      this.currentLevel = 1; // Default level if none is saved
    }
  }

  start() {
    this.updatePreGameUI();
  }

  updatePreGameUI() {
    const levelName = this.levelNames[this.currentLevel] || "实习生";
    this.levelDisplayLabel.string = `当前级别：${levelName}`;
    this.preGameUI.active = true;

    if (this.startButtonNode) {
      // Get the Button component from the start button node
      const startButton = this.startButtonNode.getComponent(Button);
      if (!startButton) return;

      // Remove previous event listeners to avoid duplicates
      this.startButtonNode.off(Node.EventType.TOUCH_END, this.startGame, this);

      // Add an event listener for the TOUCH_END event, which corresponds to a click
      this.startButtonNode.on(Node.EventType.TOUCH_END, this.startGame, this);
    }
  }

  startGame() {
    // Hide pre-game UI and start the game logic
    this.preGameUI.active = false;
    this.questionIndex = 0; // Reset question index
    this.correctAnswers = 0; // Reset score counters
    this.incorrectAnswers = 0;
    this.missed = 0;
    this.score = 0; // Reset score
    this.loadQuestions().then(() => {
      this.updateQuestion();
    });

    GlobalEvents.on("suitcase-missed", this.onSuitcaseMissed, this);
  }

  onSuitcaseMissed() {
    this.missed++;
    this.playAudio("alarm");

    this.questionIndex++;
    if (this.questionIndex < this.questions.length) {
      this.clearFlags();
      this.updateQuestion();
    } else {
      this.endGame();
    }
  }

  async loadCountryData() {
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

  async loadQuestions() {
    let threshold = 140;
    switch (this.currentLevel) {
      case 1:
        threshold = 100;
        break;
      case 2:
        threshold = 60;
        break;
      case 3:
        threshold = 0;
      default:
        break;
    }
    const eligibleCountries = this.countryData.filter(
      (country) => country.p >= threshold
    );
    const shuffledCountries = eligibleCountries.sort(() => 0.5 - Math.random());
    const selectedCountries = shuffledCountries.slice(0, 20);

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

    // Define new scoring parameters
    const totalTime = 5; // Total time for the question
    const fullPointsTime = 1; // Time to get full points
    const minScorePercentage = 0.2; // Minimum score as a percentage of time-based component
    const maxAdditionalPoints = 10; // Maximum additional points for time factor

    let timeFactor;
    if (timeElapsed <= fullPointsTime) {
      timeFactor = 1; // Full additional points if within 1 sec
    } else if (timeElapsed > totalTime) {
      timeFactor = minScorePercentage; // Minimum score percentage if over total time
    } else {
      const additionalTime = timeElapsed - fullPointsTime - 0.8; //! 0.8 is animation time
      const reductionFactor =
        (additionalTime * (1 - minScorePercentage)) /
        (totalTime - fullPointsTime);
      timeFactor = 1 - reductionFactor;
      timeFactor = Math.max(timeFactor, minScorePercentage); // Ensure time factor doesn't drop below minimum score percentage
    }

    if (isCorrect) {
      this.correctAnswers++;
      this.score += Math.round(maxAdditionalPoints * timeFactor); // Adjusted score calculation
    } else {
      this.incorrectAnswers++;
      this.score -= 5; // Incorrect answers could have a fixed deduction
    }

    GlobalEvents.emit("update-score", this.score);
  }

  resetScore() {
    GlobalEvents.emit("update-score", 0);
  }

  playAudio(fileName: string, loop = false) {
    const preference = sys.localStorage.getItem("flag_sound_on");
    if (preference !== "true") {
      return;
    }

    let audioNode = this.node.getComponent(AudioSource);

    resources.load(`sound/${fileName}`, AudioClip, (error, clip) => {
      if (!error) {
        audioNode.clip = clip;
        audioNode.loop = loop; // 设置循环播放
        audioNode.play();
      } else {
        console.error("Failed to load audio:", fileName, error);
      }
    });
  }

  // Example usage: Call this when a player selects a flag
  checkAnswer(cca2: string) {
    const currentQuestion = this.questions[this.questionIndex];
    const isCorrect = cca2.toLowerCase() === currentQuestion.answer.c;
    if (isCorrect) {
      this.showCheckmark();
      this.playAudio("correct");
    } else {
      this.playAudio("error");
    }

    const correspondingSuitcase = this.node.children.find(
      (child) => child.name === `Suitcase_${currentQuestion.answer.c}`
    );
    if (correspondingSuitcase) {
      const suitcaseComponent = correspondingSuitcase.getComponent(Suitcase);
      if (suitcaseComponent) {
        suitcaseComponent.stickFlag(cca2);
      }
    } else {
      console.error("Corresponding suitcase not found.");
    }

    this.updateScoreForAnswer(isCorrect);

    setTimeout(() => {
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
    this.playAudio("settlement");

    const gameResults = [
      { name: "行李", number: 20 },
      { name: "正确", number: this.correctAnswers },
      { name: "错误", number: this.incorrectAnswers },
      { name: "遗漏", number: this.missed },
    ];

    // Assuming ResultUIManager is attached to the same node as GameController or is accessible
    const resultUIManager = this.node
      .getChildByName("Result")
      .getComponent(ResultUIManager);
    if (resultUIManager) {
      resultUIManager.node.active = true;

      resultUIManager.populateResults(
        gameResults,
        this.score * this.currentLevel
      );
      const canvasSize = view.getVisibleSize();

      resultUIManager.node.setPosition(
        new Vec3(canvasSize.width / 2 - 132 + 25, canvasSize.height / 2, 0)
      ); // Center the results UI node

      const offsetY = 48; // Offset to place the button below the result UI

      const resultUIHeight =
        resultUIManager.node.getComponent(UITransform).contentSize.height;
      const halfResultUIHeight = resultUIHeight / 2;

      this.confirmButtonNode = instantiate(this.ConfirmButtonPrefab);

      const buttonYPosition =
        resultUIManager.node.position.y - halfResultUIHeight - offsetY;

      this.confirmButtonNode.setPosition(
        new Vec3(canvasSize.width / 2 - 132 + 25, buttonYPosition, 0)
      );

      this.node.addChild(this.confirmButtonNode);
      const button = this.confirmButtonNode.getComponent(Button);
      button.node.on("click", this.onConfirmButtonClick, this);
    }

    if (this.score >= 160) {
      this.updateLevel(this.currentLevel + 1);
      this.justUpgraded = true;
    }
  }

  updateLevel(newLevel: number) {
    this.currentLevel = newLevel;
    sys.localStorage.setItem("currentLevel", newLevel.toString());
  }

  onConfirmButtonClick() {
    this.resetScore();

    const resultUIManager = this.node
      .getChildByName("Result")
      .getComponent(ResultUIManager);
    if (resultUIManager && resultUIManager.node) {
      resultUIManager.node.active = false; // Hide the UI
    }
    if (this.confirmButtonNode) {
      this.confirmButtonNode.removeFromParent();
      this.confirmButtonNode.destroy();
      this.confirmButtonNode = null; // Clear the reference
    }

    if (this.justUpgraded) {
      this.showUpgradeNote();
      this.justUpgraded = false;
    }
    GlobalEvents.emit("update-country-name", "准备");
    this.updatePreGameUI();
  }

  showUpgradeNote() {
    let toastNode = new Node("Toast");
    let toastLabel = toastNode.addComponent(Label);
    toastLabel.string = "恭喜你升级了！";
    toastNode.parent = this.node; // Assuming 'this' is a component with a node property

    toastNode.setPosition(new Vec3(0, 0, 0));

    // Auto-remove the toast after 'duration' seconds
    setTimeout(() => {
      toastNode.removeFromParent();
    }, 3000);
  }

  handleFlagTapped(cca2: string) {
    this.disableAllFlags();
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

  disableAllFlags() {
    this.node.children.forEach((child) => {
      const flagComponent = child.getComponent(Flag);
      if (flagComponent) {
        flagComponent.setInteraction(false);
      }
    });
  }
}
