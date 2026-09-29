const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'uni_modules/tuikit-atomic-x');

const CONFIG = {
    interfaceUtsPath: path.join(SRC_DIR, 'utssdk/interface.uts'),
    stateFiles: [
        path.join(SRC_DIR, 'state/LoginState.ts'),
        path.join(SRC_DIR, 'state/LiveListState.ts'),
        path.join(SRC_DIR, 'state/LiveSeatState.ts'),
        path.join(SRC_DIR, 'state/LiveAudienceState.ts'),
        path.join(SRC_DIR, 'state/CoGuestState.ts'),
        path.join(SRC_DIR, 'state/CoHostState.ts'),
        path.join(SRC_DIR, 'state/BattleState.ts'),
        path.join(SRC_DIR, 'state/DeviceState.ts'),
        path.join(SRC_DIR, 'state/AudioEffectState.ts'),
        path.join(SRC_DIR, 'state/BarrageState.ts'),
        path.join(SRC_DIR, 'state/BaseBeautyState.ts'),
        path.join(SRC_DIR, 'state/GiftState.ts'),
        path.join(SRC_DIR, 'state/LikeState.ts'),
        path.join(SRC_DIR, 'state/CallState.ts'),
    ],
    tempDir: path.join(__dirname, 'temp'),
    outputDir: path.join(__dirname, 'output'),
    apiDir: path.join(__dirname, 'output/api'),
    assetsDir: path.join(__dirname, 'output/assets'),
    tsConfigPath: path.join(__dirname, 'tsconfig.json')
};

module.exports = {
    CONFIG
};