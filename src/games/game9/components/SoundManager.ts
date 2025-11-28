import { Audio } from "expo-av";

class SoundManager {
  private bg: Audio.Sound | null = null;
  private spin: Audio.Sound | null = null;
  private win: Audio.Sound | null = null;
  private thunder: Audio.Sound | null = null;

  async loadAll() {
    try {
      this.bg = new Audio.Sound();
      await this.bg.loadAsync(require("../assets/sounds/zeus_theme.mp3"));
      await this.bg.setIsLoopingAsync(true);
      await this.bg.playAsync();

      this.spin = new Audio.Sound();
      await this.spin.loadAsync(require("../assets/sounds/spin.mp3"));

      this.win = new Audio.Sound();
      await this.win.loadAsync(require("../assets/sounds/win.mp3"));

      this.thunder = new Audio.Sound();
      await this.thunder.loadAsync(require("../assets/sounds/thunder.mp3"));
    } catch (e) {
      console.log("⚠️ Error cargando sonidos:", e);
    }
  }

  async playSpin() {
    await this.spin?.replayAsync();
  }

  async playWin() {
    await this.win?.replayAsync();
  }

  async playThunder() {
    await this.thunder?.replayAsync();
  }

  async stopBg() {
    await this.bg?.stopAsync();
  }

  async unloadAll() {
    await Promise.all([
      this.bg?.unloadAsync(),
      this.spin?.unloadAsync(),
      this.win?.unloadAsync(),
      this.thunder?.unloadAsync(),
    ]);
  }
}

export default new SoundManager();
