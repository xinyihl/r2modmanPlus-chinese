<template>
    <div id="game-list-loading" v-if="!visible">
        <div class="fa-3x">
            <i class="fas fa-circle-notch fa-spin"></i>
        </div>
        <p>游戏准备中</p>
    </div>
    <div id="game-selection-screen" v-else>
        <EcosystemUpdateIndicator />
        <ModalCard id="select-platform-modal" v-show="showPlatformModal" :is-active="showPlatformModal" @close-modal="() => {showPlatformModal = false;}" class="z-max z-top">
            <template v-slot:header>
                <h2 class='modal-title'>选择管理你游戏的平台</h2>
            </template>
            <template v-slot:body>
                <div v-if="selectedGame !== null">
                    <div v-for="(platform, index) of selectedGame.storePlatformMetadata" :key="`${index}-${platform.storePlatform}`">
                        <input type="radio" :id="`${index}-${platform.storePlatform}`" :value="platform.storePlatform" v-model="selectedPlatform"/>
                        <label :for="`${index}-${platform.storePlatform}`"><span class="margin-right margin-right--half-width"/>{{ platformLabels[platform.storePlatform] }}</label>
                    </div>
                </div>
            </template>
            <template v-slot:footer>
                <button class='button is-info' @click='selectPlatform'>
                    选择平台
                </button>
            </template>
        </ModalCard>
        <hero
            :title="activeTab === GameInstanceType.GAME ? '选择游戏' : '选择服务器'"
            :subtitle="
                activeTab === GameInstanceType.GAME
                    ? '你正在管理哪个游戏？'
                    : '你正在管理哪个专用服务器？'
            "
            :heroType="activeTab === GameInstanceType.GAME ? 'primary' : 'warning'"
        />
        <div class="notification is-warning is-square" v-if="runningMigration">
            <div class="container">
                <p>管理器已发布更新，需要进行后台工作。</p>
                <p>工作完成之前，选择游戏的选项将被禁用。</p>
            </div>
        </div>
        <div class="columns">
            <div class="column is-full">
                <div class="sticky-top is-shadowless background-bg z-top">
                    <div class="container">
                        <nav class="pad--sides pad--top-none flex">
                            <div class="input-group input-group--flex margin-right">
                                <input
                                    :value="filterText"
                                    @input="(e: Event) => debouncedFilter((e.target as HTMLInputElement).value)"
                                    id="game-selection-search"
                                    class="input margin-right"
                                    type="text"
                                    placeholder="搜索游戏"
                                    autocomplete="off"
                                />
                            </div>
                            <template v-if="viewMode === GameSelectionViewMode.LIST">
                                <div class="margin-right">
                                    <button class="button is-info"
                                       :disabled="selectedGame === null || runningMigration" @click="selectGame(selectedGame! as Game)">选择{{ activeTab === GameInstanceType.GAME ? '游戏' : activeTab === GameInstanceType.SERVER ? '服务器' : '未知' }}</button>
                                </div>
                                <div class="margin-right">
                                    <button class="button"
                                       :disabled="selectedGame === null || runningMigration" @click="selectDefaultGame(selectedGame! as Game)">设为默认</button>
                                </div>
                            </template>
                            <div>
                                <i :class="['button', 'fas', viewMode === GameSelectionViewMode.LIST ? 'fa-th-large' : 'fa-list']" @click="toggleViewMode"></i>
                            </div>
                        </nav>
                        <div class="pad--sides pad--top-none">
                            <div class="tabs">
                                <ul>
                                    <li v-for="(value) in GameInstanceType" :key="`tab-${value}`"
                                        :class="[{'is-active': activeTab === value}]">
                                        <a @click="changeTab(value)">{{value === GameInstanceType.GAME ? '游戏' : value === GameInstanceType.SERVER ?  '服务器' : '未知'}}</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="container">
                    <GameSelectionList
                        @select-game="selectGame"
                        @set-default-game="selectDefaultGame"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Hero } from '../components/all';
import { GameInstanceType } from '../model/schema/ThunderstoreSchema';
import { GameSelectionViewMode } from '../model/enums/GameSelectionViewMode';
import ModalCard from '../components/ModalCard.vue';
import { onMounted, ref, provide } from 'vue';
import debounce from 'lodash.debounce';
import { useGameSelectionComposable, gameSelectionKey } from '../components/composables/GameSelectionComposable';
import GameSelectionList from '../components/game-selection/GameSelectionList.vue';
import Game from '../model/game/Game';
import { capitalize } from '../utils/StringUtils';
import { StorePlatform as platformLabels } from '../model/platform/StorePlatform';
import EcosystemUpdateIndicator from '../components/navigation/EcosystemUpdateIndicator.vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';

const store = getStore<State>();

const visible = ref<boolean>(false);

const gameSelection = useGameSelectionComposable();
provide(gameSelectionKey, gameSelection);

const {
    selectedGame,
    selectedPlatform,
    filterText,
    activeTab,
    viewMode,
    runningMigration,
    isSettingDefaultPlatform,
    markAsSelectedGame,
    changeTab,
    toggleViewMode,
    proceed,
    proceedDefault,
    selectPlatformForGame,
    initialize,
} = gameSelection;

const showPlatformModal = ref<boolean>(false);
const debouncedFilter = debounce((value: string) => { filterText.value = value; }, 100);

function selectGame(game: Game) {
    markAsSelectedGame(game);
    isSettingDefaultPlatform.value = false;
    if (game.storePlatformMetadata.length > 1) {
        selectPlatformForGame(game);
        showPlatformModal.value = true;
    } else {
        selectedPlatform.value = game.storePlatformMetadata[0]!.storePlatform;
        showPlatformModal.value = false;
        proceed();
    }
}

function selectDefaultGame(game: Game) {
    markAsSelectedGame(game);
    isSettingDefaultPlatform.value = true;
    if (game.storePlatformMetadata.length > 1) {
        showPlatformModal.value = true;
    } else {
        selectedPlatform.value = game.storePlatformMetadata[0]!.storePlatform;
        showPlatformModal.value = false;
        proceedDefault();
    }
}

function selectPlatform() {
    showPlatformModal.value = false;
    if (isSettingDefaultPlatform.value) {
        proceedDefault();
    } else {
        proceed();
    }
}

onMounted(async () => {
    window.app.checkForApplicationUpdates();
    try {
        await initialize();
    } finally {
        visible.value = true;
        void store.dispatch('ecosystemUpdate/updateEcosystemSchema');
    }
});
</script>


<style lang="scss" scoped>
.mb-2 {
    margin-bottom: 0.5rem !important;
}

#game-selection-screen {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
}

#game-selection-search {
    min-width: 100px;
}

#game-list-loading {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>