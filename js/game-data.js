/**
 * Class for keeping track of player progress.
 * Each player is tracked by their unique sender ID.
 * TODO: store data in Firebase.
 */
class Progress {
  constructor() {
    // Story tracker variable.
    this.storyProgress = 0;

    // How sane Rain is. 0 is death while 100 is completely mentally healthy.
    this.sanity = 20;
  }
}

class GameData {
  constructor() {
    this.gameData_ = {};
  }

  /**
   * Fetch the current game progress for a player.
   */
  getProgress(playerId) {
    if (!this.gameData_[playerId]) {
      console.log('creating progress for new player', playerId);
      this.gameData_[playerId] = new Progress();
    }
    return this.gameData_[playerId];
  }

  /**
   * Saves updated player progress.
   */
  saveProgress(playerId, storyProgress, sanity) {
    let progress = this.gameData_[playerId];
    progress.storyProgress += storyProgress;
    progress.sanity += sanity;
    console.log('new progress', this.gameData_[playerId]);
  }

  /**
   * Reset player progress. No undo!
   */
  resetProgress(playerId) {
    this.gameData_[playerId] = new Progress();
    console.log('progress reset for', this.gameData_[playerId]);
  }
}

module.exports = new GameData();
