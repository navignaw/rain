/**
 * The game script.
 */
class Story {

  /**
   * Construct an appropriate response based on player progress and message.
   */
  getResponse(progress, message) {
    switch (progress.storyProgress) {
      case 0:
        return [
          {TYPING: true, DELAY: 2000},
          {MESSAGE: 'hey', DELAY: 2000},
          {TYPING: true, DELAY: 3000},
          {MESSAGE: 'are you busy?'},
          {TYPING: true, DELAY: 4000},
          {TYPING: false, DELAY: 3000},
          {TYPING: true, DELAY: 6000},
          {MESSAGE: 'i need to tell you a secret...', DELAY: 4000},
          {TYPING: true, DELAY: 10000},
          {MESSAGE: 'ur dumb', PROGRESS: true},
        ];
    }
  }
}

module.exports = new Story();
