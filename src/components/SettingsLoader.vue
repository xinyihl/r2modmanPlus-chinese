<template>
    <div id="settings-loader">
        <slot v-if="phase === PHASES.LOADED" />

        <div v-if="phase > PHASES.ERROR_STATES" class="modal z-top is-active">
            <div class="modal-content">
                <div class="notification is-danger">
                    <h3 class="title">错误</h3>
                    <h5 class="title is-5">{{error && error.name}}</h5>
                    <p>{{error && error.message}}</p>
                    <br />
                    <h5 class="title is-5">建议</h5>

                    <p v-if="phase === PHASES.GAME_FAILED">
                        这是 MOD 管理器本身的问题。
                        如果有一个较新版本的管理器可用，请尝试安装它。
                    </p>

                    <div v-else-if="phase === PHASES.SETTINGS_FAILED">
                        <p>
                            加载本地用户设置失败。你可以使用下面的按钮重置设置，但要注意的是，所有游戏的所有设置都将丢失，且无法恢复。
                        </p>
                        <br />
                        <button @click="resetSettings" :disabled="resettingInProgress" class="button is-white">
                            重置设置
                        </button>
                    </div>

                    <p v-else-if="phase === PHASES.RESET_FAILED">
                        重置设置失败。你仍然可以按照以下
                        <a @click="openLink('https://github.com/ebkr/r2modmanPlus/wiki/Error:-White-or-blank-game-select-screen-on-startup#corrupted-settings-on-update')">
                            说明
                        </a>尝试手动重置设置
                    </p>

                    <p v-else-if="phase === PHASES.RETRY_FAILED">
                        重置了本地存储的设置，但这并没有解决加载设置的问题。如果有更新版本的管理器，请尝试安装。
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import R2Error from "../model/errors/R2Error";
import Game from "..//model/game/Game";
import GameManager from "../model/game/GameManager";
import ManagerSettings from "../r2mm/manager/ManagerSettings";
import { SETTINGS_DB_NAME } from "../r2mm/manager/SettingsDexieStore";

enum PHASES {
    INITIAL = 0,
    LOADED = 1,
    // Only error states beyond this point.
    ERROR_STATES = 100,
    GAME_FAILED = 101,
    SETTINGS_FAILED = 102,
    RESET_FAILED = 103,
    RETRY_FAILED = 104
}

type SettingsLoaderType = {
    logError: (error: R2Error) => void;
    openLink: (url: string) => void;
}

const props = defineProps<SettingsLoaderType>();

const error = ref<R2Error|null>(null);
const phase = ref<PHASES>(PHASES.INITIAL);
const resettingInProgress = ref<boolean>(false);

function handleError(name: string, message: string) {
    error.value = new R2Error(name, message);
    props.logError(error.value);
}

async function loadSettings(game: Game) {
    const isRetry = phase.value === PHASES.SETTINGS_FAILED;
    let settings;
    let error;

    try {
        settings = await ManagerSettings.getSingleton(game);
    } catch (e) {
        handleError("Failed to read ManagerSettings", `${e}`);
        phase.value = isRetry ? PHASES.RETRY_FAILED : PHASES.SETTINGS_FAILED;
        return;
    }

    try {
        // Force reload settings from Dexie just to be sure although
        // .getSingleton() should have done it already.
        error = await settings.load(true);
    } catch (e) {
        handleError("Failed to load ManagerSettings", `${e}`);
        phase.value = isRetry ? PHASES.RETRY_FAILED : PHASES.SETTINGS_FAILED;
        return;
    }

    if (error) {
        handleError(error.name, error.message);
        phase.value = isRetry ? PHASES.RETRY_FAILED : PHASES.SETTINGS_FAILED;
        return;
    }

    phase.value = PHASES.LOADED;
}

async function resetSettings() {
    resettingInProgress.value = true;
    try {
        await resetIndexedDB();
    } catch (e) {
        handleError("Failed to reset IndexedDB", `${e}`);
        phase.value = PHASES.RESET_FAILED;
        resettingInProgress.value = false;
        return;
    }

    try {
        // Discard settings singleton since it might be in invalid
        // state after the earlier failed loading attempt.
        ManagerSettings.discardSingleton();

        // We know by now that getDefaultGame is safe to use.
        await loadSettings(getDefaultGame());
    } catch (e) {
        handleError("Unexpected ManagerSettings error", `${e}`);
        phase.value = PHASES.RETRY_FAILED;
    } finally {
        resettingInProgress.value = false;
    }
}

function resetIndexedDB() {
    const DBDeleteRequest = window.indexedDB.deleteDatabase(SETTINGS_DB_NAME);

    return new Promise<void>((resolve, reject) => {
        DBDeleteRequest.onsuccess = () => resolve();
        DBDeleteRequest.onerror = () => reject("Deleting settings database failed");
    });
}

onMounted(async () => {
    let defaultGame;

    try {
        defaultGame = getDefaultGame();
    } catch (e) {
        handleError("Failed to read game definitions", `${e}`);
        phase.value = PHASES.GAME_FAILED;
        return;
    }

    try {
        await loadSettings(defaultGame);
    } catch (e) {
        handleError("Unexpected ManagerSettings error", `${e}`);
        phase.value = PHASES.SETTINGS_FAILED;
    }
});

function getDefaultGame() {
    // Don't trust the non-null asserted typing of GameManager.defaultGame.
    if (GameManager.defaultGame === undefined) {
        throw new Error("GameManager.defaultGame returned undefined");
    }

    return GameManager.defaultGame;
};

</script>
