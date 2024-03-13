import { _decorator, Component, Node, Sprite, Button, SpriteFrame, AudioSource, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundControl')
export class SoundControl extends Component {
    @property(SpriteFrame)
    soundOnIcon: SpriteFrame = null; // Assign in the editor

    @property(SpriteFrame)
    soundOffIcon: SpriteFrame = null; // Assign in the editor

    @property(Button)
    soundToggleButton: Button = null; // Assign in the editor

    @property({type: AudioSource})
    audioSource: AudioSource = null; // Assign in the editor

    private isSoundOn: boolean = true; // Tracks the current sound state

    onLoad() {
        this.loadSoundPreference();
        this.updateButtonIcon();
        this.updateSoundState();
        this.soundToggleButton.node.on(Button.EventType.CLICK, this.toggleSound, this);
    }

    toggleSound() {
        this.isSoundOn = !this.isSoundOn;
        this.saveSoundPreference();
        this.updateButtonIcon();
        this.updateSoundState();
    }

    private updateButtonIcon() {
        const sprite = this.soundToggleButton.getComponent(Sprite);
        if (!sprite) return;

        sprite.spriteFrame = this.isSoundOn ? this.soundOnIcon : this.soundOffIcon;
    }

    private updateSoundState() {
        if (this.isSoundOn) {
            if (!this.audioSource.playing) {
                this.audioSource.play();
            }
        } else {
            this.audioSource.pause();
        }
    }

    private saveSoundPreference() {
        sys.localStorage.setItem('flag_sound_on', this.isSoundOn ? 'true' : 'false');
    }

    private loadSoundPreference() {
        const preference = sys.localStorage.getItem('flag_sound_on');
        // Convert the stored string back to a boolean
        this.isSoundOn = preference === 'true';
    }
}
