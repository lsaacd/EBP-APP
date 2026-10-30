import { registerPlaybackService } from './audio/native-player';

module.exports = async function () {
  registerPlaybackService();
};
