<script lang="ts" setup>
import Game from "../../model/game/Game";
import { Platform } from "../../model/schema/ThunderstoreSchema";
import { computed } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>()

type GameRunningModalProps = {
    activeGame: Game;
}
const props = defineProps<GameRunningModalProps>();

const isSteamGame = computed(() => props.activeGame.activePlatform.storePlatform === Platform.STEAM);
const isOpen = computed(() => store.state.modals.isGameRunningModalOpen);

function close() {
    store.commit('closeGameRunningModal');
}
</script>


<template>
    <div id="gameRunningModal" :class="['modal', {'is-active': isOpen}]">
        <div class="modal-background" @click="close"></div>
        <div class="modal-content">
            <div class='notification is-info'>
                <h3 class="title" v-if="isSteamGame">通过 Steam 启动 {{ activeGame.displayName }}</h3>
                <h3 class="title" v-else>正在启动 {{ activeGame.displayName }}</h3>
                <h5 class="title is-5">关闭此消息以继续修改。</h5>
                <div v-if="isSteamGame">
                    <p>如果这需要一些时间，那很可能是由于 Steam 正在启动。</p>
                    <p>请耐心等待，并玩得开心！</p>
                </div>
            </div>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="close"></button>
    </div>
</template>
